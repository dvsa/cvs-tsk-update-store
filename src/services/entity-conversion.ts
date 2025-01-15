/* eslint-disable import/no-cycle */
import { DynamoDbImage } from './dynamodb-images';
import { techRecordDocumentConverter } from './tech-record-document-conversion';
import { testResultsConverter } from './test-result-record-conversion';
import { SqlOperation } from './sql-operations';
import { Maybe } from '../models/optionals';
import { debugLog } from './logger';

export interface EntityConverter<T> {
  parseRootImage: (image: DynamoDbImage) => T;
  upsertEntity: (entity: T) => Promise<any>;
  deleteEntity: (entity: T) => Promise<any>;
}

const entityConverters: Map<string, EntityConverter<any>> = new Map();

entityConverters.set('technical-records', techRecordDocumentConverter());
entityConverters.set('test-results', testResultsConverter());

/**
 * Shared conversion code: convert from DynamoDB document snapshot to Aurora RDS rows
 *
 * @param tableName source DynamoDB table name
 * @param sqlOperation
 * @param image DynamoDB document snapshot
 */
export const convert = async <T>(
  tableName: string,
  sqlOperation: SqlOperation,
  image: DynamoDbImage,
  // eslint-disable-next-line consistent-return
): Promise<any> => {
  debugLog(`source table name: '${tableName}'`);

  const converter = getEntityConverter(tableName);

  debugLog('valid converter found');

  const entity: T = converter.parseRootImage(image) as T;
  // eslint-disable-next-line default-case
  switch (sqlOperation) {
    case 'INSERT':
    case 'UPDATE':
      debugLog('Upserting entity...');
      return converter.upsertEntity(entity);
    case 'DELETE':
      debugLog('Deleting entity...');
      return converter.deleteEntity(entity);
  }
};

const getEntityConverter = <T>(tableName: string): EntityConverter<T> => {
  if (
    tableName.includes('technical-records')
    || tableName.includes('flat-tech-records')
  ) {
    // eslint-disable-next-line no-param-reassign
    tableName = 'technical-records';
  } else if (tableName.includes('test-results')) {
    // eslint-disable-next-line no-param-reassign
    tableName = 'test-results';
  }

  debugLog(`converter key:     '${tableName}'`);

  const entityConverter: Maybe<EntityConverter<T>> = entityConverters.get(
    tableName,
  );

  if (!entityConverter) {
    throw new Error(`no entity converter for table "${tableName}"`);
  }

  return entityConverter;
};
