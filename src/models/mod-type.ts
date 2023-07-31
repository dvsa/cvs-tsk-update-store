import { DynamoDbImage } from "../services/dynamodb-images";
import { Maybe } from "./optionals";

export type ModTypeCode = "p" | "m" | "g";

export type ModTypeDescription =
  | "particulate trap"
  | "modification or change of engine"
  | "gas engine";

export interface ModType {
  code?: ModTypeCode;
  description?: ModTypeDescription;
}

export const parseModType = (image?: DynamoDbImage): Maybe<ModType> => {
  if (!image) {
    return undefined;
  }

  return {
    code: image.getString("code") as ModTypeCode,
    description: image.getString("description") as ModTypeDescription,
  };
};
