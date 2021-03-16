import {processStreamEvent} from "./functions/process-stream-event";
import {config as AWSConfig} from "aws-sdk";
import {DatabaseOperations} from "./services/database-operations";

const isOffline: boolean = (!process.env.BRANCH || process.env.BRANCH === "local");

if (isOffline) {
    AWSConfig.credentials = {
        accessKeyId: "accessKey1",
        secretAccessKey: "verySecretKey1"
    };
}

// Share a repository layer: if the container is re-used, connection pool can be re-used across invocations
// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.Lambda.BestPracticesWithDynamoDB.html
export const DB_OPERATIONS = new DatabaseOperations();

export {processStreamEvent as handler};
