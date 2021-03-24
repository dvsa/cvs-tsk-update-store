import {DynamoDbImage, parseStringArray} from "../services/dynamodb-images";
import {SqlParametersList} from "aws-sdk/clients/rdsdataservice";
import {booleanParam, dateParam, stringParam} from "../services/sql-parameter";

export interface AdrDetails {
    vehicleDetails: VehicleDetails;
    listStatementApplicable: boolean;
    batteryListNumber: string;
    declarationsSeen: boolean;
    brakeDeclarationsSeen: boolean;
    brakeDeclarationIssuer: string;
    brakeEndurance: boolean;
    weight: string;
    compatibilityGroupJ: boolean;
    documents: string[];
    permittedDangerousGoods: string[];
    additionalExaminerNotes: string;
    applicantDetails: ApplicantDetails;
    memosApply: string[];
    additionalNotes: AdditionalNotes;
    adrTypeApprovalNo: string;
    adrCertificateNotes: string;
    tank: Tank;
}

export interface VehicleDetails {
    type: string;
    approvalDate: string;
}

export interface ApplicantDetails {
    name: string;
    street: string;
    town: string;
    city: string;
    postcode: string;
}

export interface AdditionalNotes {
    number: string[];
    guidanceNotes: string[];
}

export interface Tank {
    tankDetails: TankDetails;
    tankStatement: TankStatement;
}

export interface TankDetails {
    tankManufacturer: string;
    yearOfManufacture: number;
    tankCode: string;
    specialProvisions: string;
    tankManufacturerSerialNo: string;
    tankTypeAppNo: string;
    tc2Details: Tc2Details;
    tc3Details: Tc3Details;
}

export interface TankStatement {
    substancesPermitted: string;
    statement: string;
    productListRefNo: string;
    productListUnNo: string[];
    productList: string;
}

export interface Tc2Details {
    tc2Type: Tc2Type;
    tc2IntermediateApprovalNo: string;
    tc2IntermediateExpiryDate: string;
}

export type Tc2Type = "initial";

export type Tc3Details = Tc3DetailsItem[];

export interface Tc3DetailsItem {
    tc3Type: Tc3Type;
    tc3PeriodicNumber: string;
    tc3PeriodicExpiryDate: string;
}

export type Tc3Type = "intermediate" | "periodic" | "exceptional";

export const parseAdrDetails = (adrDetails: DynamoDbImage): AdrDetails => {
    const additionalNotesImage: DynamoDbImage = adrDetails.getMap("additionalNotes");
    const additionalNotes: AdditionalNotes = {
        number: parseStringArray(additionalNotesImage.getList("number")),
        guidanceNotes: parseStringArray(additionalNotesImage.getList("guidanceNotes"))
    };

    const applicantDetailsImage: DynamoDbImage = adrDetails.getMap("applicantDetails");
    const applicantDetails: ApplicantDetails = {
        name: applicantDetailsImage.getString("name"),
        street: applicantDetailsImage.getString("street"),
        town: applicantDetailsImage.getString("town"),
        city: applicantDetailsImage.getString("city"),
        postcode: applicantDetailsImage.getString("postcode"),
    };

    const vehicleDetailsImage: DynamoDbImage = adrDetails.getMap("vehicleDetails");
    const vehicleDetails: VehicleDetails = {
        type: vehicleDetailsImage.getString("type"),
        approvalDate: vehicleDetailsImage.getString("approvalDate")
    };

    const tankImage: DynamoDbImage = adrDetails.getMap("tank");

    const tankDetailsImage = tankImage.getMap("tankDetails");

    const tc2DetailsImage: DynamoDbImage = tankDetailsImage.getMap("tc2Details");
    const tc2Details: Tc2Details = {
        tc2Type: tc2DetailsImage.getString("tc2Type") as Tc2Type,
        tc2IntermediateApprovalNo: tc2DetailsImage.getString("tc2IntermediateApprovalNo"),
        tc2IntermediateExpiryDate: tc2DetailsImage.getString("tc2IntermediateExpiryDate")
    };

    const tc3DetailsImage: DynamoDbImage = tankDetailsImage.getList("tc3Details");
    const tc3Details: Tc3Details = [];

    for (const key of tc3DetailsImage.getKeys()) {
        const tc3DetailsItemImage = tc3DetailsImage.getMap(key);
        tc3Details.push({
            tc3Type: tc3DetailsItemImage.getString("tc3Type") as Tc3Type,
            tc3PeriodicNumber: tc3DetailsItemImage.getString("tc3PeriodicNumber"),
            tc3PeriodicExpiryDate: tc3DetailsItemImage.getString("tc3PeriodicExpiryDate")
        });
    }

    const tankDetails: TankDetails = {
        tankManufacturer: tankDetailsImage.getString("tankManufacturer"),
        yearOfManufacture: 0,
        tankCode: tankDetailsImage.getString("tankCode"),
        specialProvisions: tankDetailsImage.getString("specialProvisions"),
        tankManufacturerSerialNo: tankDetailsImage.getString("tankManufacturerSerialNo"),
        tankTypeAppNo: tankDetailsImage.getString("tankTypeAppNo"),
        tc2Details,
        tc3Details
    };

    const tankStatementImage: DynamoDbImage = tankImage.getMap("tankStatement");
    const tankStatement: TankStatement = {
        substancesPermitted: tankStatementImage.getString("substancesPermitted"),
        statement: tankStatementImage.getString("statement"),
        productListRefNo: tankStatementImage.getString("productListRefNo"),
        productListUnNo: parseStringArray(tankStatementImage.getList("productListUnNo")),
        productList: tankStatementImage.getString("productList")
    };

    const tank: Tank = {
        tankDetails,
        tankStatement
    };

    return {
        vehicleDetails,
        listStatementApplicable: adrDetails.getBoolean("listStatementApplicable"),
        batteryListNumber: adrDetails.getString("batteryListNumber"),
        declarationsSeen: adrDetails.getBoolean("declarationsSeen"),
        brakeDeclarationsSeen: adrDetails.getBoolean("brakeDeclarationsSeen"),
        brakeDeclarationIssuer: adrDetails.getString("brakeDeclarationIssuer"),
        brakeEndurance: adrDetails.getBoolean("brakeEndurance"),
        weight: adrDetails.getString("weight"),
        compatibilityGroupJ: adrDetails.getBoolean("compatibilityGroupJ"),
        documents: parseStringArray(adrDetails.getList("documents")),
        permittedDangerousGoods: parseStringArray(adrDetails.getList("permittedDangerousGoods")),
        additionalExaminerNotes: adrDetails.getString("additionalExaminerNotes"),
        applicantDetails,
        memosApply: parseStringArray(adrDetails.getList("memosApply")),
        additionalNotes,
        adrTypeApprovalNo: adrDetails.getString("adrTypeApprovalNo"),
        adrCertificateNotes: adrDetails.getString("adrCertificateNotes"),
        tank
    };
};

export const toAdrSqlParameters = (adrDetails: AdrDetails): SqlParametersList => {
    const sqlParameters: SqlParametersList = [];

    // TODO resolve issues at a later date - ADR out of scope for now

    sqlParameters.push(stringParam("type", adrDetails.vehicleDetails.type));
    sqlParameters.push(dateParam("approvalDate", adrDetails.vehicleDetails.approvalDate));
    sqlParameters.push(booleanParam("listStatementApplicable", adrDetails.listStatementApplicable));
    sqlParameters.push(stringParam("batteryListNumber", adrDetails.batteryListNumber));
    sqlParameters.push(booleanParam("declarationsSeen", adrDetails.declarationsSeen));
    sqlParameters.push(booleanParam("brakeDeclarationsSeen", adrDetails.brakeDeclarationsSeen));
    // sqlParameters.push(booleanParam("brakeDeclarationIssuer", adrDetails.brakeDeclarationIssuer));
    sqlParameters.push(booleanParam("brakeEndurance", adrDetails.brakeEndurance));
    sqlParameters.push(stringParam("weight", adrDetails.weight));
    sqlParameters.push(booleanParam("compatibilityGroupJ", adrDetails.compatibilityGroupJ));
    sqlParameters.push(stringParam("additionalExaminerNotes", adrDetails.additionalExaminerNotes));
    sqlParameters.push(stringParam("applicantDetailsName", adrDetails.applicantDetails.name));
    sqlParameters.push(stringParam("street", adrDetails.applicantDetails.street));
    sqlParameters.push(stringParam("town", adrDetails.applicantDetails.town));
    sqlParameters.push(stringParam("city", adrDetails.applicantDetails.city));
    sqlParameters.push(stringParam("postcode", adrDetails.applicantDetails.postcode));
    // sqlParameters.push(stringParam("memosApply", adrDetails.memosApply));
    sqlParameters.push(stringParam("adrTypeApprovalNo", adrDetails.adrTypeApprovalNo));
    sqlParameters.push(stringParam("adrCertificateNotes", adrDetails.adrCertificateNotes));
    sqlParameters.push(stringParam("tankManufacturer", adrDetails.tank.tankDetails.tankManufacturer));
    // sqlParameters.push(dateParam("yearOfManufacture", adrDetails.tank.tankDetails.yearOfManufacture));
    sqlParameters.push(stringParam("tankCode", adrDetails.tank.tankDetails.tankCode));
    sqlParameters.push(stringParam("specialProvisions", adrDetails.tank.tankDetails.specialProvisions));
    sqlParameters.push(stringParam("tankManufacturerSerialNo", adrDetails.tank.tankDetails.tankManufacturerSerialNo));
    sqlParameters.push(stringParam("tankTypeAppNo", adrDetails.tank.tankDetails.tankTypeAppNo));
    sqlParameters.push(stringParam("tc2Type", adrDetails.tank.tankDetails.tc2Details.tc2Type));
    sqlParameters.push(stringParam("tc2IntermediateApprovalNo", adrDetails.tank.tankDetails.tc2Details.tc2IntermediateApprovalNo));
    sqlParameters.push(dateParam("tc2IntermediateExpiryDate", adrDetails.tank.tankDetails.tc2Details.tc2IntermediateExpiryDate));
    sqlParameters.push(stringParam("substancesPermitted", adrDetails.tank.tankDetails.tc2Details.tc2Type));
    sqlParameters.push(stringParam("statement", adrDetails.tank.tankStatement.statement));
    sqlParameters.push(stringParam("productListRefNo", adrDetails.tank.tankStatement.productListRefNo));
    sqlParameters.push(stringParam("productList", adrDetails.tank.tankStatement.productList));

    return sqlParameters;
};

// TODO add toPermittedDangerousGoods, toDangerousGoods, toAdditionalNotes, toAdditionalGuidance, etc
