import {DynamoDbImage, parseStringArray} from "../services/dynamodb-images";
import {parseTechRecords, TechRecords} from "./tech-record";
import {SqlParametersList} from "aws-sdk/clients/rdsdataservice";
import {stringParam} from "../services/sql-parameter";

// https://wiki.dvsacloud.uk/pages/viewpage.action?spaceKey=HVT&title=Technical+API+Changelog
// API_Vehicle_Tech_Records_v32.yaml
export interface TechRecordDocument {
    systemNumber: string;
    partialVin: string;
    primaryVrm: string;
    secondaryVms: string[];
    vin: string;
    trailerId: string;
    techRecord: TechRecords;
}

export const parseTechRecordDocument = (image: DynamoDbImage): TechRecordDocument => {
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

export const toVehicleSqlParameters = (techRecordDocument: TechRecordDocument): SqlParametersList => {
    const sqlParameters: SqlParametersList = [];

    sqlParameters.push(stringParam("system_number", techRecordDocument.systemNumber));
    sqlParameters.push(stringParam("vin", techRecordDocument.vin));
    sqlParameters.push(stringParam("vrm_trm", techRecordDocument.primaryVrm));
    sqlParameters.push(stringParam("trailer_id", techRecordDocument.trailerId));
    // sqlParameters.push(timestampParam("createdAt", ""/*TODO*/));

    return sqlParameters;
};

export const toVehicleTemplateVariables = (techRecordDocument: TechRecordDocument): any[] => {
    const templateVariables: any[] = [];

    templateVariables.push(techRecordDocument.systemNumber);
    templateVariables.push(techRecordDocument.vin);
    templateVariables.push(techRecordDocument.primaryVrm);
    templateVariables.push(techRecordDocument.trailerId);

    return templateVariables;
};
