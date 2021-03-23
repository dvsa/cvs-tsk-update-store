import {DynamoDbImage} from "../services/dynamodb-images";
import {SqlParametersList} from "aws-sdk/clients/rdsdataservice";
import {booleanParam, integerParam, stringParam} from "../services/sql-parameter";

export interface Brakes {
    brakeCodeOriginal: string;
    brakeCode: string;
    dataTrBrakeOne: string;
    dataTrBrakeTwo: string;
    dataTrBrakeThree: string;
    retarderBrakeOne: RetarderBrakeType;
    retarderBrakeTwo: RetarderBrakeType;
    dtpNumber: string;
    brakeForceWheelsNotLocked: BrakeForceWheelsNotLocked;
    brakeForceWheelsUpToHalfLocked: BrakeForceWheelsUpToHalfLocked;
    loadSensingValve: boolean;
    antilockBrakingSystem: boolean;
}

export type RetarderBrakeType = "electric" | "exhaust" | "friction" | "hydraulic" | "other" | "none";

export interface BrakeForceWheelsNotLocked {
    serviceBrakeForceA: number;
    secondaryBrakeForceA: number;
    parkingBrakeForceA: number;
}

export interface BrakeForceWheelsUpToHalfLocked {
    serviceBrakeForceB: number;
    secondaryBrakeForceB: number;
    parkingBrakeForceB: number;
}

export const parseBrakes = (brakes: DynamoDbImage): Brakes => {
    const brakeForceWheelsNotLockedImage: DynamoDbImage = brakes.getMap("brakeForceWheelsNotLocked");
    const brakeForceWheelsNotLocked: BrakeForceWheelsNotLocked = {
        serviceBrakeForceA: brakeForceWheelsNotLockedImage.getNumber("serviceBrakeForceA"),
        secondaryBrakeForceA: brakeForceWheelsNotLockedImage.getNumber("secondaryBrakeForceA"),
        parkingBrakeForceA: brakeForceWheelsNotLockedImage.getNumber("parkingBrakeForceA")
    };

    const brakeForceWheelsUpToHalfLockedImage: DynamoDbImage = brakes.getMap("brakeForceWheelsUpToHalfLocked");
    const brakeForceWheelsUpToHalfLocked: BrakeForceWheelsUpToHalfLocked = {
        serviceBrakeForceB: brakeForceWheelsUpToHalfLockedImage.getNumber("serviceBrakeForceB"),
        secondaryBrakeForceB: brakeForceWheelsUpToHalfLockedImage.getNumber("secondaryBrakeForceB"),
        parkingBrakeForceB: brakeForceWheelsUpToHalfLockedImage.getNumber("parkingBrakeForceB")
    };

    return {
        brakeCodeOriginal: brakes.getString("brakeCodeOriginal"),
        brakeCode: brakes.getString("brakeCode"),
        dataTrBrakeOne: brakes.getString("dataTrBrakeOne"),
        dataTrBrakeTwo: brakes.getString("dataTrBrakeTwo"),
        dataTrBrakeThree: brakes.getString("dataTrBrakeThree"),
        retarderBrakeOne: brakes.getString("retarderBrakeOne") as RetarderBrakeType,
        retarderBrakeTwo: brakes.getString("retarderBrakeTwo") as RetarderBrakeType,
        dtpNumber: brakes.getString("dtpNumber"),
        brakeForceWheelsNotLocked,
        brakeForceWheelsUpToHalfLocked,
        loadSensingValve: brakes.getBoolean("loadSensingValve"),
        antilockBrakingSystem: brakes.getBoolean("antilockBrakingSystem")
    };
};

export const toBrakeSqlParameters = (brakes: Brakes): SqlParametersList => {
    const sqlParameters: SqlParametersList = [];

    sqlParameters.push(stringParam("brakeCodeOriginal", brakes.brakeCodeOriginal));
    sqlParameters.push(stringParam("brakeCode", brakes.brakeCode));
    sqlParameters.push(stringParam("dataTrBrakeOne", brakes.dataTrBrakeOne));
    sqlParameters.push(stringParam("dataTrBrakeTwo", brakes.dataTrBrakeTwo));
    sqlParameters.push(stringParam("dataTrBrakeThree", brakes.dataTrBrakeThree));
    sqlParameters.push(stringParam("retarderBrakeOne", brakes.retarderBrakeOne));
    sqlParameters.push(stringParam("retarderBrakeTwo", brakes.retarderBrakeTwo));
    sqlParameters.push(stringParam("dtpNumber", brakes.dtpNumber));
    sqlParameters.push(booleanParam("loadSensingValve", brakes.loadSensingValve));
    sqlParameters.push(booleanParam("antilockBrakingSystem", brakes.antilockBrakingSystem));
    sqlParameters.push(integerParam("serviceBrakeForceA", brakes.brakeForceWheelsNotLocked.serviceBrakeForceA));
    sqlParameters.push(integerParam("secondaryBrakeForceA", brakes.brakeForceWheelsNotLocked.secondaryBrakeForceA));
    sqlParameters.push(integerParam("parkingBrakeForceA", brakes.brakeForceWheelsNotLocked.parkingBrakeForceA));
    sqlParameters.push(integerParam("serviceBrakeForceB", brakes.brakeForceWheelsUpToHalfLocked.serviceBrakeForceB));
    sqlParameters.push(integerParam("secondaryBrakeForceB", brakes.brakeForceWheelsUpToHalfLocked.secondaryBrakeForceB));
    sqlParameters.push(integerParam("parkingBrakeForceB", brakes.brakeForceWheelsUpToHalfLocked.parkingBrakeForceB));

    return sqlParameters;
};

export const toBrakesTemplateVariables = (brakes: Brakes): any[] => {
    const templateVariables: any[] = [];

    templateVariables.push(brakes.brakeCodeOriginal);
    templateVariables.push(brakes.brakeCode);
    templateVariables.push(brakes.dataTrBrakeOne);
    templateVariables.push(brakes.dataTrBrakeTwo);
    templateVariables.push(brakes.dataTrBrakeThree);
    templateVariables.push(brakes.retarderBrakeOne);
    templateVariables.push(brakes.retarderBrakeTwo);
    templateVariables.push(brakes.dtpNumber);
    templateVariables.push(brakes.loadSensingValve);
    templateVariables.push(brakes.antilockBrakingSystem);
    templateVariables.push(brakes.brakeForceWheelsNotLocked.serviceBrakeForceA);
    templateVariables.push(brakes.brakeForceWheelsNotLocked.secondaryBrakeForceA);
    templateVariables.push(brakes.brakeForceWheelsNotLocked.parkingBrakeForceA);
    templateVariables.push(brakes.brakeForceWheelsUpToHalfLocked.serviceBrakeForceB);
    templateVariables.push(brakes.brakeForceWheelsUpToHalfLocked.secondaryBrakeForceB);
    templateVariables.push(brakes.brakeForceWheelsUpToHalfLocked.parkingBrakeForceB);

    return templateVariables;
};
