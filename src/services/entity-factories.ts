import {toTechnicalRecord} from "../models/technical-records";
import {DynamoDbImage} from "./dynamodb-images";
import {DatabaseEntity} from "./database-operations";

export type EntityFactory = (image: DynamoDbImage) => DatabaseEntity;

const entityFactories: Map<string, EntityFactory> = new Map();

export const getEntityFactory = (tableName: string): EntityFactory => {
    const entityFactory: ((image: DynamoDbImage) => DatabaseEntity) | undefined = entityFactories.get(tableName);

    if (!entityFactory) {
        throw new Error(`no entity factory for table "${tableName}"`);
    }

    return entityFactory;
};
