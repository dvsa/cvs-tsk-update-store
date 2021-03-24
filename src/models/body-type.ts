import {DynamoDbImage} from "../services/dynamodb-images";

export interface BodyType {
    code?: BodyTypeCode;
    description?: BodyTypeDescription;
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

export const parseBodyType = (bodyType?: DynamoDbImage): BodyType | undefined => {
    if (!bodyType) {
        return undefined;
    }

    return {
        code: bodyType.getString("code") as BodyTypeCode,
        description: bodyType.getString("description") as BodyTypeDescription
    };
};
