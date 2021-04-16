import {Context, DynamoDBStreamEvent, Handler, SQSEvent, StreamRecord} from "aws-lambda";
import {DynamoDBRecord} from "aws-lambda/trigger/dynamodb-stream";
import {EventSourceArn, stringToArn} from "../services/event-source-arn";
import {convert} from "../services/entity-conversion";
import {DynamoDbImage} from "../services/dynamodb-images";
import {deriveSqlOperation, SqlOperation} from "../services/sql-operations";
import {destroyConnectionPool} from "../services/connection-pool";

/**
 * λ function: convert a DynamoDB document to Aurora RDS rows
 * @param event - DynamoDB stream event, containing DynamoDB document image
 * @param context - λ context
 */
export const processStreamEvent: Handler = async (event: SQSEvent, context: Context): Promise<any> => {
    try {
        console.info("Received SQS event", event);
        validateEvent(event);

        const upsertResults: any[] = [];

        console.info(`Received valid SQS event (${event.Records.length} records)`);

        for await (const record of event.Records) {
            console.info("body (unparsed): ", record.body);

            const dynamoRecord: DynamoDBRecord = JSON.parse(record.body) as DynamoDBRecord;

            console.info("body (parsed):   ", dynamoRecord);

            validateRecord(dynamoRecord);

            // parse source ARN
            const eventSourceArn: EventSourceArn = stringToArn(dynamoRecord.eventSourceARN!);

            console.info(`source ARN region:     '${eventSourceArn.region}'`);
            console.info(`source ARN account ID: '${eventSourceArn.accountId}'`);
            console.info(`source ARN timestamp:  '${eventSourceArn.timestamp}'`);

            // is this an INSERT, UPDATE, or DELETE?
            const operationType: SqlOperation = deriveSqlOperation(dynamoRecord.eventName!);

            // parse native DynamoDB format to usable TS map
            const image: DynamoDbImage = selectImage(operationType, dynamoRecord.dynamodb!);

            console.info("Dynamo image dump:", image);

            try {
                console.info(`DynamoDB ---> Aurora | START (event ID: ${dynamoRecord.eventID})`);

                const upsertResult = await convert(eventSourceArn.table, operationType, image);
                upsertResults.push(upsertResult);

                console.info(`DynamoDB ---> Aurora | END   (event ID: ${dynamoRecord.eventID})`);
            } catch (err) {
                console.error("couldn't convert DynamoDB entity to Aurora", err);
                dumpArguments(event, context);
            }
        }

        await destroyConnectionPool();

        return upsertResults;
    } catch (err) {
        console.error(err);
        dumpArguments(event, context);
        throw err;
    }
};

const selectImage = (operationType: SqlOperation, streamRecord: StreamRecord): DynamoDbImage => {
    switch (operationType) {
        case "INSERT":
        case "UPDATE":
            if (!streamRecord.NewImage) {
                throw new Error("'dynamodb' object missing required field 'NewImage'");
            }
            console.info(`operation type '${operationType}', selecting image 'NewImage'`);
            return DynamoDbImage.parse(streamRecord.NewImage!);
        case "DELETE":
            if (!streamRecord.OldImage) {
                throw new Error("'dynamodb' object missing required field 'OldImage'");
            }
            console.info(`operation type '${operationType}', selecting image 'OldImage'`);
            return DynamoDbImage.parse(streamRecord.OldImage!);
    }
};

const validateEvent = (event: DynamoDBStreamEvent): void => {
    if (!event) {
        throw new Error("event is null or undefined");
    }

    if (!event.Records) {
        throw new Error("event missing required field 'Records'");
    }

    if (!Array.isArray(event.Records)) {
        throw new Error("event.Records is not an array");
    }
};

const validateRecord = (record: DynamoDBRecord): void => {
    if (!record) {
        throw new Error("record is null or undefined");
    }

    if (!record.eventName) {
        throw new Error("record is missing required field \'eventName\'");
    }

    if (!record.dynamodb) {
        throw new Error("record is missing required field \'dynamodb\'");
    }

    if (!record.eventSourceARN) {
        throw new Error("record is missing required field \'eventSourceARN\'");
    }
};

const dumpArguments = (event: DynamoDBStreamEvent, context: Context): void => {
    console.error("Event dump  : ", JSON.stringify(event));
    console.error("Context dump: ", JSON.stringify(context));
};
