import {DynamoDbImage} from "../services/dynamodb-images";

export type LetterType = "Trailer authorization" | "Trailer rejection";

export interface LettersOfAuth {
    letterType?: LetterType;
    letterDateRequested?: string;
    letterContents?: string;
}

export const parseLettersOfAuth = (lettersOfAuth: DynamoDbImage): LettersOfAuth => {
    return {
        letterType: lettersOfAuth.getString("letterType") as LetterType,
        letterDateRequested: lettersOfAuth.getString("letterDateRequested"),
        letterContents: lettersOfAuth.getString("letterContents")
    };
};

// TODO add toLettersOFAuthTemplateVariables, whenever it's needed
