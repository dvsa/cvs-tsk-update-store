import {DynamoDbImage} from "./dynamodb-images";
import {techRecordDocumentConverter} from "./tech-record-document-conversion";
import {testResultsConverter} from "./test-result-record-conversion";
import {SqlOperation} from "./operation-types";
import {Maybe} from "../models/optionals";

export interface EntityConverter<T> {
    parseRootImage: (image: DynamoDbImage) => T;
    upsertEntity: (entity: T) => Promise<any>;
    deleteEntity: (entity: T) => Promise<any>;
}

const entityConverters: Map<string, EntityConverter<any>> = new Map();

entityConverters.set("Technical_Records", techRecordDocumentConverter());
entityConverters.set("Test_Results", testResultsConverter());

export const convert = async <T> (tableName: string, sqlOperation: SqlOperation, image: DynamoDbImage): Promise<any> => {
    const converter = getEntityConverter(tableName);

    const entity: T = converter.parseRootImage(image) as T;

    switch (sqlOperation) {
        case "INSERT":
        case "UPDATE":
            return converter.upsertEntity(entity);
        case "DELETE":
            return converter.deleteEntity(entity);
    }
};

const getEntityConverter = <T> (tableName: string): EntityConverter<T> => {
    const entityConverter: Maybe<EntityConverter<T>> = entityConverters.get(tableName);

    if (!entityConverter) {
        throw new Error(`no entity converter for table "${tableName}"`);
    }

    return entityConverter;
};
