import {AttributeValue} from "aws-sdk/clients/dynamodbstreams";
import path from "path";

// DO NOT MOVE THIS FILE.
const resourcesDirectory = path.resolve(__dirname, "./resources");

export const pathToResources = (): string => {
    return resourcesDirectory;
};

export const castToImageShape = (json: any): { [key: string]: AttributeValue } => {
    return json as any;
};
