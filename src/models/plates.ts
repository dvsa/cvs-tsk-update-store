import {DynamoDbImage} from "../services/dynamodb-images";
import {SqlParametersList} from "aws-sdk/clients/rdsdataservice";
import {stringParam} from "../services/sql-parameter";

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

export const parsePlates = (platesImage: DynamoDbImage): Plates => {
    const plates: Plates = [];

    for (const key of platesImage.getKeys()) {
        const plateImage = platesImage.getMap(key);

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

export const toPlateSqlParameters = (plate: Plate): SqlParametersList => {
    const sqlParameters: SqlParametersList = [];

    sqlParameters.push(stringParam("plateSerialNumber", plate.plateSerialNumber!));
    sqlParameters.push(stringParam("plateIssueDate", plate.plateIssueDate!));
    sqlParameters.push(stringParam("plateReasonForIssue", plate.plateReasonForIssue!));
    sqlParameters.push(stringParam("plateIssuer", plate.plateIssuer!));

    return sqlParameters;
};

// TODO add toPlateTemplateVariables
