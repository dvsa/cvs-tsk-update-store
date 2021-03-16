import {Context, DynamoDBStreamEvent, Handler, StreamRecord} from "aws-lambda";
import {DatabaseEntity, executeStatement} from "../services/database-operations";
import {DynamoDBRecord} from "aws-lambda/trigger/dynamodb-stream";
import {EventSourceArn, stringToArn} from "../services/event-source-arn";
import {EntityFactory, getEntityFactory} from "../services/entity-factories";
import {DynamoDbImage} from "../services/dynamodb-images";
import {KnownOperationType, parseOperationType} from "../services/operation-types";
import {SqlStatement} from "aws-sdk/clients/rdsdataservice";

/**
 * λ function to process an SQS message detailing info for update store
 * @param event - DynamoDB Stream event
 * @param context - λ Context
 */
export const processStreamEvent: Handler = async (event: DynamoDBStreamEvent, context: Context): Promise<any> => {
    validateEvent(event);

    for await (const record of event.Records) {
        validateRecord(record);

        const eventSourceArn: EventSourceArn = stringToArn(record.eventSourceARN!);
        const operationType: KnownOperationType = parseOperationType(record.eventName!);

        const image: DynamoDbImage = selectImage(operationType, record.dynamodb!);
        const entityFactory: EntityFactory = getEntityFactory(eventSourceArn.table);
        const entity = entityFactory(image);

        try {
            await executeStatement(selectSql(operationType, entity), entity);
        } catch (e) {
            console.error(e.message);
            dumpArguments(event, context);
        }
    }
};

const selectImage = (operationType: KnownOperationType, streamRecord: StreamRecord): DynamoDbImage => {
    switch (operationType) {
        case "INSERT":
        case "UPDATE":
            return DynamoDbImage.parse(streamRecord.NewImage!);
        case "DELETE":
            return DynamoDbImage.parse(streamRecord.OldImage!);
    }
}

const selectSql = (operationType: KnownOperationType, entity: DatabaseEntity): SqlStatement => {
    switch (operationType) {
        case "INSERT":
            return entity.insertStatement();
        case "UPDATE":
            return entity.updateStatement();
        case "DELETE":
            return entity.deleteStatement();
    }
}

const validateEvent = (event: DynamoDBStreamEvent): void => {
    if (!event) {
        throw new Error('event is null or undefined');
    }

    if (!event.Records) {
        throw new Error('missing required field event.Records');
    }

    if (!Array.isArray(event.Records)) {
        throw new Error('event.Records is not an array');
    }
}

const validateRecord = (record: DynamoDBRecord): void => {
    if (!record.eventName) {
        throw new Error('record is missing required field \'eventName\'');
    }

    if (!record.dynamodb) {
        throw new Error('record is missing required field \'dynamodb\'');
    }

    if (!record.eventSourceARN) {
        throw new Error('record is missing required field \'eventSourceARN\'');
    }
}

const dumpArguments = (event: DynamoDBStreamEvent, context: Context): void => {
    console.error('Event dump  : ', JSON.stringify(event));
    console.error('Context dump: ', JSON.stringify(context));
}
