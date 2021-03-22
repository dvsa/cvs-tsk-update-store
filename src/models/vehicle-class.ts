import {DynamoDbImage} from "../services/dynamodb-images";

export interface VehicleClass {
    code: VehicleCode;
    description: VehicleDescription;
}

export type VehicleDescription =
    "motorbikes over 200cc or with a sidecar"
    | "not applicable"
    | "small psv (ie: less than or equal to 22 seats)"
    | "motorbikes up to 200cc"
    | "trailer"
    | "large psv(ie: greater than 23 seats)"
    | "3 wheelers"
    | "heavy goods vehicle"
    | "MOT class 4"
    | "MOT class 7"
    | "MOT class 5"
    | "PSV of unknown or unspecified size"
    | "Not Known";

export type VehicleCode = "2" | "n" | "s" | "1" | "t" | "l" | "3" | "v" | "4" | "7" | "5";

export const parseVehicleClass = (vehicleClass: DynamoDbImage): VehicleClass => {
    return {
        code: vehicleClass.getString("code") as VehicleCode,
        description: vehicleClass.getString("description") as VehicleDescription
    };
};
