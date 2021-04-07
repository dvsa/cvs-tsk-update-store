import {OperationType} from "aws-sdk/clients/dynamodbstreams";

export type SqlOperation = "INSERT" | "UPDATE" | "DELETE";

export const deriveSqlOperation = (operationType: OperationType): SqlOperation => {
    switch (operationType) {
        case "INSERT":
            return "INSERT";
        case "MODIFY":
            return "UPDATE";
        case "REMOVE":
            return "DELETE";
        default:
            throw new Error(`unrecognized operation type ${operationType}`);
    }
};
