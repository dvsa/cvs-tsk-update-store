import {Context, DynamoDBStreamEvent, Handler, StreamRecord} from "aws-lambda";
import {DynamoDBRecord} from "aws-lambda/trigger/dynamodb-stream";
import {EventSourceArn, stringToArn} from "../services/event-source-arn";
import {EntityConverter, getEntityConverter} from "../services/entity-converters";
import {DynamoDbImage} from "../services/dynamodb-images";
import {KnownOperationType, parseOperationType} from "../services/operation-types";

/**
 * λ function: convert a DynamoDB document to Aurora RDS rows
 * @param event - DynamoDB stream event, containing DynamoDB document image
 * @param context - λ context
 */
export const processStreamEvent: Handler = async (event: DynamoDBStreamEvent, context: Context): Promise<any> => {
    validateEvent(event);

    for await (const record of event.Records) {
        validateRecord(record);

        // parse source ARN
        const eventSourceArn: EventSourceArn = stringToArn(record.eventSourceARN!);

        // is this an INSERT, UPDATE, or DELETE?
        const operationType: KnownOperationType = parseOperationType(record.eventName!);

        // parse native DynamoDB format to usable TS map
        const image: DynamoDbImage = selectImage(operationType, record.dynamodb!);

        // use the source table name to figure out which conversion procedure we want to run
        const entityConverter: EntityConverter = getEntityConverter(eventSourceArn.table);

        try {
            // perform conversion
            await entityConverter(operationType, image);
        } catch (e) {
            console.error("couldn't convert DynamoDB entity to Aurora", e);
            dumpArguments(event, context);
        }
    }
};

const selectImage = (operationType: KnownOperationType, streamRecord: StreamRecord): DynamoDbImage => {
    switch (operationType) {
        case "INSERT":
        case "UPDATE":
            if (!streamRecord.NewImage) {
                throw new Error("'dynamodb' object missing required field 'NewImage'");
            }
            return DynamoDbImage.parse(streamRecord.NewImage!);
        case "DELETE":
            if (!streamRecord.OldImage) {
                throw new Error("'dynamodb' object missing required field 'OldImage'");
            }
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
