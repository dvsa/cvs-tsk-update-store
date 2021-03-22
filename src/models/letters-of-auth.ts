import {DynamoDbImage} from "../services/dynamodb-images";

export type LetterType = "Trailer authorization" | "Trailer rejection";

export type LettersOfAuth = {
    letterType: LetterType,
    letterDateRequested: string,
    letterContents: string,
}

export const parseLettersOfAuth = (lettersOfAuth: DynamoDbImage): LettersOfAuth => {
    return {
        letterType: <LetterType>lettersOfAuth.getString("letterType"),
        letterDateRequested: lettersOfAuth.getString("letterDateRequested"),
        letterContents: lettersOfAuth.getString("letterContents")
    }
}
