import {DynamoDbImage} from "../services/dynamodb-images";

export type Axles = Axle[];

export type Axle = {
    axleNumber: number;
    parkingBrakeMrk: boolean;
    weights: AxleWeightProperties;
    tyres: AxleTyreProperties;
    brakes: AxleBrakeProperties;
}

export type AxleWeightProperties = {
    kerbWeight: number;
    ladenWeight: number;
    gbWeight: number;
    eecWeight: number;
    designWeight: number;
}

export type AxleTyreProperties = {
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

export type AxleBrakeProperties = {
    brakeActuator: number;
    leverLength: number;
    springBrakeParking: boolean;
}

export const parseAxles = (axlesImage: DynamoDbImage): Axles => {
    const axles: Axles = [];

    for (const key of Object.keys(axlesImage)) {
        const axleImage = axlesImage.getMap(key);

        const weightsImage = axleImage.getMap("weights");
        const weights: AxleWeightProperties = {
            kerbWeight: weightsImage.getNumber("kerbWeight"),
            ladenWeight: weightsImage.getNumber("ladenWeight"),
            gbWeight: weightsImage.getNumber("gbWeight"),
            eecWeight: weightsImage.getNumber("eecWeight"),
            designWeight: weightsImage.getNumber("designWeight")
        }
        const tyresImage = axleImage.getMap("tyres");
        const tyres: AxleTyreProperties = {
            tyreSize: tyresImage.getString("tyreSize"),
            plyRating: tyresImage.getString("plyRating"),
            fitmentCode: <FitmentCode>tyresImage.getString("fitmentCode"),
            dataTrAxles: tyresImage.getNumber("dataTrAxles"),
            speedCategorySymbol: <SpeedCategorySymbol>tyresImage.getString("speedCategorySymbol"),
            tyreCode: tyresImage.getNumber("tyreCode")
        }
        const brakesImage = axleImage.getMap("brakes");
        const brakes: AxleBrakeProperties = {
            brakeActuator: brakesImage.getNumber("brakeActuator"),
            leverLength: brakesImage.getNumber("leverLength"),
            springBrakeParking: brakesImage.getBoolean("springBrakeParking")
        }

        axles.push({
            axleNumber: axleImage.getNumber("axleNumber"),
            parkingBrakeMrk: axleImage.getBoolean("parkingBrakeMrk"),
            weights,
            brakes,
            tyres
        })
    }

    return axles;
}
