import { DynamoDbImage } from "../services/dynamodb-images";
import { Maybe } from "./optionals";

export type LetterType = "Trailer authorization" | "Trailer rejection";

export interface LettersOfAuth {
  letterType?: LetterType;
  letterDateRequested?: string;
  letterContents?: string;
}

export const parseLettersOfAuth = (
  lettersOfAuth?: DynamoDbImage
): Maybe<LettersOfAuth> => {
  if (!lettersOfAuth) {
    return undefined;
  }

  return {
    letterType: lettersOfAuth.getString("letterType") as LetterType,
    letterDateRequested: lettersOfAuth.getString("letterDateRequested"),
    letterContents: lettersOfAuth.getString("letterContents"),
  };
};
