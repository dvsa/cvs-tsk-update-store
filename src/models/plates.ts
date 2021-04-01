import {DynamoDbImage} from "../services/dynamodb-images";

export type Plates = Plate[];

export interface Plate {
    plateSerialNumber?: string;
    plateIssueDate?: string;
    plateReasonForIssue?: PlateReasonForIssue;
    plateIssuer?: string;
    toEmailAddress?: string;
}

export type PlateReasonForIssue =
    "Free replacement"
    | "Replacement"
    | "Destroyed"
    | "Provisional"
    | "Original"
    | "Manual";

export const parsePlates = (platesImage?: DynamoDbImage): Plates => {
    if (!platesImage) {
        return [] as Plates;
    }

    const plates: Plates = [];

    for (const key of platesImage.getKeys()) {
        const plateImage = platesImage.getMap(key)!;

        plates.push({
            plateSerialNumber: plateImage.getString("plateSerialNumber"),
            plateIssueDate: plateImage.getString("plateIssueDate"),
            plateReasonForIssue: plateImage.getString("plateReasonForIssue") as PlateReasonForIssue,
            plateIssuer: plateImage.getString("plateIssuer"),
            toEmailAddress: plateImage.getString("toEmailAddress")
        });
    }

    return plates;
};

// TODO add toPlateTemplateVariables
