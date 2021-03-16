import {OperationType} from "aws-sdk/clients/dynamodbstreams";

export type KnownOperationType = "INSERT" | "UPDATE" | "DELETE";

export const parseOperationType = (operationType: OperationType): KnownOperationType => {
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
