// (disability discrimination act)
import {DynamoDbImage} from "../services/dynamodb-images";

export type Dda = {
    certificateIssued: boolean;
    wheelchairCapacity: number;
    wheelchairFittings: string;
    wheelchairLiftPresent: boolean;
    wheelchairLiftInformation: string;
    wheelchairRampPresent: boolean;
    wheelchairRampInformation: string;
    minEmergencyExits: number;
    outswing: string;
    ddaSchedules: string;
    seatbeltsFitted: number;
    ddaNotes: string;
}

export const parseDda = (dda: DynamoDbImage): Dda => {
    return {
        certificateIssued: dda.getBoolean("certificateIssued"),
        wheelchairCapacity: dda.getNumber("wheelchairCapacity"),
        wheelchairFittings: dda.getString("wheelchairFittings"),
        wheelchairLiftPresent: dda.getBoolean("wheelchairLiftPresent"),
        wheelchairLiftInformation: dda.getString("wheelchairLiftInformation"),
        wheelchairRampPresent: dda.getBoolean("wheelchairRampPresent"),
        wheelchairRampInformation: dda.getString("wheelchairRampInformation"),
        minEmergencyExits: dda.getNumber("minEmergencyExits"),
        outswing: dda.getString("outswing"),
        ddaSchedules: dda.getString("ddaSchedules"),
        seatbeltsFitted: dda.getNumber("seatbeltsFitted"),
        ddaNotes: dda.getString("ddaNotes")
    }
}
