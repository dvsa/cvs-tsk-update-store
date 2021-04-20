import {DynamoDbImage, parseStringArray} from "../services/dynamodb-images";
import {parseTechRecords, TechRecords} from "./tech-record";
import {debugLog} from "../services/logger";

// https://wiki.dvsacloud.uk/pages/viewpage.action?spaceKey=HVT&title=Technical+API+Changelog
// API_Vehicle_Tech_Records_v32.yaml
export interface TechRecordDocument {
    systemNumber?: string;
    partialVin?: string;
    primaryVrm?: string;
    secondaryVms?: string[];
    vin?: string;
    trailerId?: string;
    techRecord?: TechRecords;
}

export const parseTechRecordDocument = (image: DynamoDbImage): TechRecordDocument => {
    debugLog("Parsing tech records...");

    return {
        systemNumber: image.getString("systemNumber"),
        partialVin: image.getString("partialVin"),
        primaryVrm: image.getString("primaryVrm"),
        secondaryVms: parseStringArray(image.getList("secondaryVrms")),
        vin: image.getString("vin"),
        trailerId: image.getString("trailerId"),
        techRecord: parseTechRecords(image.getList("techRecord"))
    };
};
