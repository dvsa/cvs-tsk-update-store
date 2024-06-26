import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import path from 'path';
import type { Context } from 'aws-lambda';
import { getSecretValue } from '../src/services/secrets-manager';
import { SecretsManagerConfig } from '../src/models/aws-sm-config';

// DO NOT MOVE THIS FILE.
const resourcesDirectory = path.resolve(__dirname, './resources');

export const pathToResources = (): string => resourcesDirectory;

export const castToImageShape = (
  json: any,
): { [key: string]: NativeAttributeValue } => json;

export const useLocalDb = (): void => {
  process.env.SECRET = 'TEST_SECRET';
  process.env.SCHEMA_NAME = 'CVSBNOP';

  const localDbSmConfig: SecretsManagerConfig = {
    username: 'root',
    password: '12345',
    engine: '',
    host: '127.0.0.1',
    port: 3306,
    dbname: '',
    dbClusterIdentifier: '',
  };

  (getSecretValue as jest.Mock) = jest
    .fn()
    .mockImplementation((secretName: string) => {
      if (secretName === 'TEST_SECRET') {
        return JSON.stringify(localDbSmConfig);
      }
      throw new Error(`TEST SECRETS MANAGER - unrecognized key ${secretName}`);
    });
};

export const exampleContext = (): Context => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test',
  functionVersion: '0.0.0',
  invokedFunctionArn: 'arn:aws:execute-api:eu-west-1:TEST',
  memoryLimitInMB: '128',
  awsRequestId: 'TEST-AWS-REQUEST-ID',
  logGroupName: 'TEST-LOG-GROUP-NAME',
  logStreamName: 'TEST-LOG-STREAM-NAME',
  getRemainingTimeInMillis: (): number => 86400000,
  done: (): void => {
    /* circumvent TSLint no-empty */
  },
  fail: (): void => {
    /* circumvent TSLint no-empty */
  },
  succeed: (): void => {
    /* circumvent TSLint no-empty */
  },
});
