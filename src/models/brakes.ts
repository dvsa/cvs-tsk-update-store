import {DynamoDbImage} from "../services/dynamodb-images";
import {Maybe} from "./optionals";
import {undefinedToNull} from "../services/connection-pool";

export interface Brakes {
    brakeCodeOriginal?: string;
    brakeCode?: string;
    dataTrBrakeOne?: string;
    dataTrBrakeTwo?: string;
    dataTrBrakeThree?: string;
    retarderBrakeOne?: RetarderBrakeType;
    retarderBrakeTwo?: RetarderBrakeType;
    dtpNumber?: string;
    brakeForceWheelsNotLocked?: BrakeForceWheelsNotLocked;
    brakeForceWheelsUpToHalfLocked?: BrakeForceWheelsUpToHalfLocked;
    loadSensingValve?: boolean;
    antilockBrakingSystem?: boolean;
}

export type RetarderBrakeType = "electric" | "exhaust" | "friction" | "hydraulic" | "other" | "none";

export interface BrakeForceWheelsNotLocked {
    serviceBrakeForceA?: number;
    secondaryBrakeForceA?: number;
    parkingBrakeForceA?: number;
}

export interface BrakeForceWheelsUpToHalfLocked {
    serviceBrakeForceB?: number;
    secondaryBrakeForceB?: number;
    parkingBrakeForceB?: number;
}

export const parseBrakes = (brakes?: DynamoDbImage): Maybe<Brakes> => {
    if (!brakes) {
        return undefined;
    }

    const brakeForceWheelsNotLocked = parseBrakeForceWheelsNotLocked(brakes.getMap("brakeForceWheelsNotLocked"));
    const brakeForceWheelsUpToHalfLocked = parseBrakeForceWheelsUpToHalfLocked(brakes.getMap("brakeForceWheelsUpToHalfLocked"));

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

    // TODO nullity checks here
    templateVariables.push(brakes.brakeForceWheelsNotLocked!.serviceBrakeForceA);
    templateVariables.push(brakes.brakeForceWheelsNotLocked!.secondaryBrakeForceA);
    templateVariables.push(brakes.brakeForceWheelsNotLocked!.parkingBrakeForceA);
    templateVariables.push(brakes.brakeForceWheelsUpToHalfLocked!.serviceBrakeForceB);
    templateVariables.push(brakes.brakeForceWheelsUpToHalfLocked!.secondaryBrakeForceB);
    templateVariables.push(brakes.brakeForceWheelsUpToHalfLocked!.parkingBrakeForceB);

    return undefinedToNull(templateVariables);
};

const parseBrakeForceWheelsNotLocked = (brakeForceWheelsNotLockedImage?: DynamoDbImage): Maybe<BrakeForceWheelsNotLocked> => {
    if (!brakeForceWheelsNotLockedImage) {
        return undefined;
    }

    return {
        serviceBrakeForceA: brakeForceWheelsNotLockedImage.getNumber("serviceBrakeForceA"),
        secondaryBrakeForceA: brakeForceWheelsNotLockedImage.getNumber("secondaryBrakeForceA"),
        parkingBrakeForceA: brakeForceWheelsNotLockedImage.getNumber("parkingBrakeForceA")
    };
};

const parseBrakeForceWheelsUpToHalfLocked = (brakeForceWheelsUpToHalfLockedImage?: DynamoDbImage): Maybe<BrakeForceWheelsUpToHalfLocked> => {
    if (!brakeForceWheelsUpToHalfLockedImage) {
        return undefined;
    }

    return {
        serviceBrakeForceB: brakeForceWheelsUpToHalfLockedImage.getNumber("serviceBrakeForceB"),
        secondaryBrakeForceB: brakeForceWheelsUpToHalfLockedImage.getNumber("secondaryBrakeForceB"),
        parkingBrakeForceB: brakeForceWheelsUpToHalfLockedImage.getNumber("parkingBrakeForceB")
    };
};
