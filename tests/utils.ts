import {AttributeValue} from "aws-sdk/clients/dynamodbstreams";
import path from "path";
import {getSecretValue} from "../src/services/secrets-manager";
import {SecretsManagerConfig} from "../src/models/aws-sm-config";
import {Context} from "aws-lambda";

// DO NOT MOVE THIS FILE.
const resourcesDirectory = path.resolve(__dirname, "./resources");

export const pathToResources = (): string => {
    return resourcesDirectory;
};

export const castToImageShape = (json: any): { [key: string]: AttributeValue } => {
    return json as any;
};

export const useLocalDb = (): void => {
    process.env.SECRET = "TEST_SECRET";
    process.env.SCHEMA_NAME = "CVSBNOP";

    const localDbSmConfig: SecretsManagerConfig = {
        username: "root",
        password: "12345",
        engine: "",
        host: "localhost",
        port: 3306,
        dbname: "",
        dbClusterIdentifier: ""
    };

    (getSecretValue as jest.Mock) = jest.fn().mockImplementation((secretName: string) => {
        if (secretName === "TEST_SECRET") {
            return JSON.stringify(localDbSmConfig);
        }
        throw new Error(`TEST SECRETS MANAGER - unrecognized key ${secretName}`);
    });
};

export const exampleContext = (): Context => {
    return {
        callbackWaitsForEmptyEventLoop: false,
        functionName: "test",
        functionVersion: "0.0.0",
        invokedFunctionArn: "arn:aws:execute-api:eu-west-1:TEST",
        memoryLimitInMB: "128",
        awsRequestId: "TEST-AWS-REQUEST-ID",
        logGroupName: "TEST-LOG-GROUP-NAME",
        logStreamName: "TEST-LOG-STREAM-NAME",
        getRemainingTimeInMillis: (): number => 86400000,
        done: (): void => { /* circumvent TSLint no-empty */
        },
        fail: (): void => { /* circumvent TSLint no-empty */
        },
        succeed: (): void => { /* circumvent TSLint no-empty */
        },
    };
};
