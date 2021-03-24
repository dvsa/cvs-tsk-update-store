import {DynamoDbImage} from "../services/dynamodb-images";
import {SqlParametersList} from "aws-sdk/clients/rdsdataservice";
import {integerParam, stringParam} from "../services/sql-parameter";

export type Axles = Axle[];

export interface Axle {
    axleNumber: number;
    parkingBrakeMrk: boolean;
    weights: AxleWeightProperties;
    tyres: AxleTyreProperties;
    brakes: AxleBrakeProperties;
}

export interface AxleWeightProperties {
    kerbWeight: number;
    ladenWeight: number;
    gbWeight: number;
    eecWeight: number;
    designWeight: number;
}

export interface AxleTyreProperties {
    tyreSize: string;
    plyRating: string;
    fitmentCode: FitmentCode;
    dataTrAxles: number;
    speedCategorySymbol: SpeedCategorySymbol;
    tyreCode: number;
}

export type FitmentCode = "double" | "single";

export type SpeedCategorySymbol =
    "a7"
    | "a8"
    | "b"
    | "c"
    | "d"
    | "e"
    | "f"
    | "g"
    | "j"
    | "k"
    | "l"
    | "m"
    | "n"
    | "p"
    | "q";

export interface AxleBrakeProperties {
    brakeActuator: number;
    leverLength: number;
    springBrakeParking: boolean;
}

export const parseAxles = (axlesImage: DynamoDbImage): Axles => {
    const axles: Axles = [];

    for (const key of axlesImage.getKeys()) {
        const axleImage = axlesImage.getMap(key);

        const weightsImage = axleImage.getMap("weights");
        const weights: AxleWeightProperties = {
            kerbWeight: weightsImage.getNumber("kerbWeight"),
            ladenWeight: weightsImage.getNumber("ladenWeight"),
            gbWeight: weightsImage.getNumber("gbWeight"),
            eecWeight: weightsImage.getNumber("eecWeight"),
            designWeight: weightsImage.getNumber("designWeight")
        };
        const tyresImage = axleImage.getMap("tyres");
        const tyres: AxleTyreProperties = {
            tyreSize: tyresImage.getString("tyreSize"),
            plyRating: tyresImage.getString("plyRating"),
            fitmentCode: tyresImage.getString("fitmentCode") as FitmentCode,
            dataTrAxles: tyresImage.getNumber("dataTrAxles"),
            speedCategorySymbol: tyresImage.getString("speedCategorySymbol") as SpeedCategorySymbol,
            tyreCode: tyresImage.getNumber("tyreCode")
        };
        const brakesImage = axleImage.getMap("brakes");
        const brakes: AxleBrakeProperties = {
            brakeActuator: brakesImage.getNumber("brakeActuator"),
            leverLength: brakesImage.getNumber("leverLength"),
            springBrakeParking: brakesImage.getBoolean("springBrakeParking")
        };

        axles.push({
            axleNumber: axleImage.getNumber("axleNumber"),
            parkingBrakeMrk: axleImage.getBoolean("parkingBrakeMrk"),
            weights,
            brakes,
            tyres
        });
    }

    return axles;
};

export const toTireSqlParameters = (tyre: AxleTyreProperties): SqlParametersList => {
    const sqlParameters: SqlParametersList = [];

    sqlParameters.push(stringParam("tyreSize", tyre.tyreSize));
    sqlParameters.push(stringParam("plyRating", tyre.plyRating));
    sqlParameters.push(stringParam("fitmentCode", tyre.fitmentCode));
    sqlParameters.push(stringParam("dataTrAxles", "" + tyre.dataTrAxles));
    sqlParameters.push(stringParam("speedCategorySymbol", tyre.speedCategorySymbol));
    sqlParameters.push(integerParam("tyreCode", tyre.tyreCode));

    return sqlParameters;
};
