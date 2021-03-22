import {DynamoDbImage} from "../services/dynamodb-images";

export type Plates = Plate[];

export type Plate = {
    plateSerialNumber: string
    plateIssueDate: string
    plateReasonForIssue: PlateReasonForIssue
    plateIssuer: string
    toEmailAddress: string
}

export type PlateReasonForIssue =
    "Free replacement"
    | "Replacement"
    | "Destroyed"
    | "Provisional"
    | "Original"
    | "Manual";

export const parsePlates = (platesImage: DynamoDbImage): Plates => {
    const plates: Plates = [];

    for (const key of Object.keys(platesImage)) {
        const plateImage = platesImage.getMap(key);

        plates.push({
            plateSerialNumber: plateImage.getString("plateSerialNumber"),
            plateIssueDate: plateImage.getString("plateIssueDate"),
            plateReasonForIssue: <PlateReasonForIssue>plateImage.getString("plateReasonForIssue"),
            plateIssuer: plateImage.getString("plateIssuer"),
            toEmailAddress: plateImage.getString("toEmailAddress")
        });
    }

    return plates;
}