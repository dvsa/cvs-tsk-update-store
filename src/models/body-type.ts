import {DynamoDbImage} from "../services/dynamodb-images";

export type BodyType = {
    code: BodyTypeCode
    description: BodyTypeDescription
}

export type BodyTypeCode = "a" | "s" | "d" | "o" | "m" | "x" | "p" | "k" | "t" | "b" | "f" | "r" | "c";

export type BodyTypeDescription =
    "articulated"
    | "single decker"
    | "double decker"
    | "other"
    | "petrol/oil tanker"
    | "skeletal"
    | "tipper"
    | "box"
    | "flat"
    | "refuse"
    | "skip loader"
    | "refrigerated";

export const parseBodyType = (bodyType: DynamoDbImage): BodyType => {
    return {
        code: <BodyTypeCode>bodyType.getString("code"),
        description: <BodyTypeDescription>bodyType.getString("description")
    }
}
