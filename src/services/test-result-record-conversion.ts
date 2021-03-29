import {KnownOperationType} from "./operation-types";
import {DynamoDbImage} from "./dynamodb-images";
import {parseTestResults, TestResults} from "../models/test-results";

export const convertTestResults = async (operationType: KnownOperationType, image: DynamoDbImage): Promise<void> => {
    const testResults: TestResults = parseTestResults(image);

    const sqlOperation: (testResults: TestResults) => Promise<void> = deriveSqlOperation(operationType);

    await sqlOperation(testResults);
};

const deriveSqlOperation = (operationType: KnownOperationType): ((testResults: TestResults) => Promise<any>) => {
    switch (operationType) {
        case "INSERT":
        case "UPDATE":
            return upsertTestResults;
        case "DELETE":
            return deleteTestResults;
    }
};

const upsertTestResults = async (testResults: TestResults): Promise<number[]> => {
    return [];
};

const deleteTestResults = async (testResult: TestResults): Promise<void> => {
    // TODO
};
