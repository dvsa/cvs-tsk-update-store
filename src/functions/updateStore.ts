import {Callback, Context, Handler, SQSEvent, SQSRecord} from "aws-lambda";

/**
 * λ function to process an SQS message detailing info for update store
 * @param event - DynamoDB Stream event
 * @param context - λ Context
 * @param callback - callback function
 */
const updateStore: Handler = async (event: SQSEvent, context?: Context, callback?: Callback): Promise<any[]> => {

    if (!event || !event.Records || !Array.isArray(event.Records) || !event.Records.length) {
        console.error("ERROR: event is not defined.");
        throw new Error("Event is empty");
    }
    event.Records.forEach((record: SQSRecord) => {
        const updatedRecords: any = JSON.parse(record.body);
        console.log("Data Updated:", updatedRecords);
    });

    return Promise.all([Promise.resolve("OK")])
        .catch((error: Error) => {
            console.error(error);
            throw error;
        });
};

export {updateStore};
