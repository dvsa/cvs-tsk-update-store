import {DynamoDbImage} from "./dynamodb-images";
import {techRecordDocumentConverter} from "./tech-record-document-conversion";
import {testResultsConverter} from "./test-result-record-conversion";
import {SqlOperation} from "./sql-operations";
import {Maybe} from "../models/optionals";

export interface EntityConverter<T> {
    parseRootImage: (image: DynamoDbImage) => T;
    upsertEntity: (entity: T) => Promise<any>;
    deleteEntity: (entity: T) => Promise<any>;
}

const entityConverters: Map<string, EntityConverter<any>> = new Map();

entityConverters.set("technical-records", techRecordDocumentConverter());
entityConverters.set("test-results", testResultsConverter());

/**
 * Shared conversion code: convert from DynamoDB document snapshot to Aurora RDS rows
 *
 * @param tableName source DynamoDB table name
 * @param sqlOperation
 * @param image DynamoDB document snapshot
 */
export const convert = async <T> (tableName: string, sqlOperation: SqlOperation, image: DynamoDbImage): Promise<any> => {
    console.info(`source table name: '${tableName}'`);

    const converter = getEntityConverter(tableName);

    console.info("valid converter found");

    const entity: T = converter.parseRootImage(image) as T;

    switch (sqlOperation) {
        case "INSERT":
        case "UPDATE":
            console.info(`Upserting entity...`);
            return converter.upsertEntity(entity);
        case "DELETE":
            console.info(`Deleting entity...`);
            return converter.deleteEntity(entity);
    }
};

const getEntityConverter = <T> (tableName: string): EntityConverter<T> => {
    if (tableName.includes("technical-records")) {
        tableName = "technical-records";
    } else if (tableName.includes("test-results")) {
        tableName = "test-results";
    }

    console.info(`converter key:     '${tableName}'`);

    const entityConverter: Maybe<EntityConverter<T>> = entityConverters.get(tableName);

    if (!entityConverter) {
        throw new Error(`no entity converter for table "${tableName}"`);
    }

    return entityConverter;
};
