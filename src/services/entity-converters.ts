import {DynamoDbImage} from "./dynamodb-images";
import {convertTechRecordDocument} from "./tech-record-conversion";
import {KnownOperationType} from "./operation-types";
import {Maybe} from "../models/optionals";
import {convertTestResults} from "./test-result-record-conversion";

export type EntityConverter = (operationType: KnownOperationType, image: DynamoDbImage) => Promise<void>;

const entityHandlers: Map<string, EntityConverter> = new Map();

entityHandlers.set("Technical_Records", convertTechRecordDocument); // TODO actual table names
entityHandlers.set("Test_Results", convertTestResults); // TODO actual table names

export const getEntityConverter = (tableName: string): EntityConverter => {
    const entityFactory: Maybe<(operationType: KnownOperationType, image: DynamoDbImage) => Promise<void>> = entityHandlers.get(tableName);

    if (!entityFactory) {
        throw new Error(`no entity factory for table "${tableName}"`);
    }

    return entityFactory;
};
