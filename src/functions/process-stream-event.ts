import {Context, DynamoDBStreamEvent, Handler, StreamRecord} from "aws-lambda";
import {DynamoDBRecord} from "aws-lambda/trigger/dynamodb-stream";
import {EventSourceArn, stringToArn} from "../services/event-source-arn";
import {EntityConverter, getEntityConverter} from "../services/entity-converters";
import {DynamoDbImage} from "../services/dynamodb-images";
import {KnownOperationType, parseOperationType} from "../services/operation-types";

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
        const entityConverter: EntityConverter = getEntityConverter(eventSourceArn.table);

        try {
            await entityConverter(operationType, image);
        } catch (e) {
            console.error("couldn't apply entity converter", e);
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
};

const validateEvent = (event: DynamoDBStreamEvent): void => {
    if (!event) {
        throw new Error("event is null or undefined");
    }

    if (!event.Records) {
        throw new Error("missing required field event.Records");
    }

    if (!Array.isArray(event.Records)) {
        throw new Error("event.Records is not an array");
    }
};

const validateRecord = (record: DynamoDBRecord): void => {
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
