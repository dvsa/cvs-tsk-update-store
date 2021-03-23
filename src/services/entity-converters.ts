import {DynamoDbImage} from "./dynamodb-images";
import {techRecordDocumentConverter} from "./tech-record-conversion";
import {KnownOperationType} from "./operation-types";

export type EntityConverter = (operationType: KnownOperationType, image: DynamoDbImage) => Promise<void>;

const entityHandlers: Map<string, EntityConverter> = new Map();

entityHandlers.set("Technical_Records", techRecordDocumentConverter); // TODO actual table names

export const getEntityConverter = (tableName: string): EntityConverter => {
    const entityFactory: ((operationType: KnownOperationType, image: DynamoDbImage) => Promise<void>) | undefined = entityHandlers.get(tableName);

    if (!entityFactory) {
        throw new Error(`no entity factory for table "${tableName}"`);
    }

    return entityFactory;
};
