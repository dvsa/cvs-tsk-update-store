import { _Record } from '@aws-sdk/client-dynamodb-streams';
import type {
  Context,
  DynamoDBRecord,
  DynamoDBStreamEvent,
  Handler,
  SQSEvent,
  StreamRecord,
} from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { BatchItemFailuresResponse } from '../models/batch-item-failure-response';
import { destroyConnectionPool } from '../services/connection-pool';
import { DynamoDbImage } from '../services/dynamodb-images';
import { convert } from '../services/entity-conversion';
import {
  addToLogManager, clearLogs, createLogEntry, debugLog, printLogs, updateLogEntry,
} from '../services/logger';
import { SqlOperation, deriveSqlOperation } from '../services/sql-operations';
import { transformTechRecord } from '../utils/transform-tech-record';

/**
 * λ function: convert a DynamoDB document to Aurora RDS rows
 * @param event - DynamoDB stream event, containing DynamoDB document image
 * @param context - λ context
 */
export const processStreamEvent: Handler = async (
  event: SQSEvent,
  context: Context,
): Promise<any> => {
  const res: BatchItemFailuresResponse = {
    batchItemFailures: [],
  };
  try {
    debugLog('Received SQS event: ', JSON.stringify(event));

    const currentLog = createLogEntry();
    validateEvent(event);

    const region = process.env.AWS_REGION;
    if (!region) {
      console.error('AWS_REGION envvar not available');
      return;
    }

    debugLog(`Received valid SQS event (${event.Records.length} records)`);

    for await (const record of event.Records) {
      const id = record.messageId;
      const dynamoRecord: DynamoDBRecord = JSON.parse(record.body) as DynamoDBRecord;

      debugLog('Original DynamoDB stream event body (parsed): ', dynamoRecord);

      validateRecord(dynamoRecord);

      // parse source ARN
      const tableName: string = getTableNameFromArn(
        dynamoRecord.eventSourceARN!,
      );
      if (tableName.includes('flat-tech-records')) {
        transformTechRecord(dynamoRecord as _Record);
        debugLog(`Dynamo Record after transformation: ${JSON.stringify(dynamoRecord)}`);

        const technicalRecord: any = dynamoRecord.dynamodb?.NewImage;
        const unmarshalledTechnicalRecord = unmarshall(technicalRecord);
        updateLogEntry(currentLog, {
          changeType: 'Technical Record Change',
          identifier: unmarshalledTechnicalRecord.vehicleType === 'trl'
            ? unmarshalledTechnicalRecord.trailerId
            : unmarshalledTechnicalRecord.primaryVrm,
          statusCode: unmarshalledTechnicalRecord.techRecord[0]?.statusCode,
        });
      }
      if (tableName.includes('test-result')) {
        const testResult: any = dynamoRecord.dynamodb?.NewImage;
        const unmarshalledTestResult = unmarshall(testResult);
        updateLogEntry(currentLog, {
          changeType: 'Test Record Change',
          testResultId: unmarshalledTestResult.testResultId,
          identifier: unmarshalledTestResult.vehicleType === 'trl'
            ? unmarshalledTestResult.trailerId
            : unmarshalledTestResult.vrm,
        });
      }

      // is this an INSERT, UPDATE, or DELETE?
      const operationType: SqlOperation = deriveSqlOperation(
        dynamoRecord.eventName!,
      );
      updateLogEntry(currentLog, { operationType });
      addToLogManager(currentLog);

      // parse native DynamoDB format to usable TS map
      const image: DynamoDbImage = selectImage(
        operationType,
        dynamoRecord.dynamodb!,
      );

      debugLog('Dynamo image dump:', image);

      try {
        debugLog(
          `DynamoDB ---> Aurora | START (event ID: ${dynamoRecord.eventID})`,
        );

        await convert(tableName, operationType, image);

        printLogs();
        clearLogs();

        debugLog(
          `DynamoDB ---> Aurora | END   (event ID: ${dynamoRecord.eventID})`,
        );
      } catch (err) {
        console.error(
          "Couldn't convert DynamoDB entity to Aurora, will return record to SQS for retry",
          [`messageId: ${id}`, err],
        );
        res.batchItemFailures.push({ itemIdentifier: id });
        dumpArguments(event, context);
      }
    }
  } catch (err) {
    console.error(
      'An error unrelated to Dynamo-to-Aurora conversion has occurred, event will not be retried',
      err,
    );
    dumpArguments(event, context);
    await destroyConnectionPool();
  }
  // eslint-disable-next-line consistent-return
  return res;
};

export const getTableNameFromArn = (eventSourceArn: string): string => eventSourceArn.split(':')[5].split('/')[1];

const selectImage = (
  operationType: SqlOperation,
  streamRecord: StreamRecord,
  // eslint-disable-next-line consistent-return
): DynamoDbImage => {
  // eslint-disable-next-line default-case
  switch (operationType) {
    case 'INSERT':
    case 'UPDATE':
      if (!streamRecord.NewImage) {
        throw new Error("'dynamodb' object missing required field 'NewImage'");
      }
      debugLog(`operation type '${operationType}', selecting image 'NewImage'`);
      return DynamoDbImage.parse(streamRecord.NewImage);
    case 'DELETE':
      if (!streamRecord.OldImage) {
        throw new Error("'dynamodb' object missing required field 'OldImage'");
      }
      debugLog(`operation type '${operationType}', selecting image 'OldImage'`);
      return DynamoDbImage.parse(streamRecord.OldImage);
  }
};

const validateEvent = (event: DynamoDBStreamEvent): void => {
  if (!event) {
    throw new Error('event is null or undefined');
  }

  if (!event.Records) {
    throw new Error("event missing required field 'Records'");
  }

  if (!Array.isArray(event.Records)) {
    throw new Error('event.Records is not an array');
  }
};

const validateRecord = (record: DynamoDBRecord): void => {
  if (!record) {
    throw new Error('record is null or undefined');
  }

  if (!record.eventName) {
    throw new Error("record is missing required field 'eventName'");
  }

  if (!record.dynamodb) {
    throw new Error("record is missing required field 'dynamodb'");
  }

  if (!record.eventSourceARN) {
    throw new Error("record is missing required field 'eventSourceARN'");
  }
};

const dumpArguments = (event: DynamoDBStreamEvent, context: Context): void => {
  console.error('Event dump  : ', JSON.stringify(event));
  console.error('Context dump: ', JSON.stringify(context));
};
