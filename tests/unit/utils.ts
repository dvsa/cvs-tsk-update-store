import {AttributeValue} from "aws-sdk/clients/dynamodbstreams";

export const castToImageShape = (json: any): { [key: string]: AttributeValue } => {
    return json as any;
};
