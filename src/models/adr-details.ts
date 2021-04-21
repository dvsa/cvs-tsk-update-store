import {DynamoDbImage, parseStringArray} from "../services/dynamodb-images";
import {Maybe} from "./optionals";

export interface AdrDetails {
    vehicleDetails?: VehicleDetails;
    listStatementApplicable?: boolean;
    batteryListNumber?: string;
    declarationsSeen?: boolean;
    brakeDeclarationsSeen?: boolean;
    brakeDeclarationIssuer?: string;
    brakeEndurance?: boolean;
    weight?: string;
    compatibilityGroupJ?: boolean;
    documents?: string[];
    permittedDangerousGoods?: string[];
    additionalExaminerNotes?: string;
    applicantDetails?: ApplicantDetails;
    memosApply?: string[];
    additionalNotes?: AdditionalNotes;
    adrTypeApprovalNo?: string;
    adrCertificateNotes?: string;
    tank?: Tank;
}

export interface VehicleDetails {
    type?: string;
    approvalDate?: string;
}

export interface ApplicantDetails {
    name?: string;
    street?: string;
    town?: string;
    city?: string;
    postcode?: string;
}

export interface AdditionalNotes {
    number?: string[];
    guidanceNotes?: string[];
}

export interface Tank {
    tankDetails?: TankDetails;
    tankStatement?: TankStatement;
}

export interface TankDetails {
    tankManufacturer?: string;
    yearOfManufacture?: number;
    tankCode?: string;
    specialProvisions?: string;
    tankManufacturerSerialNo?: string;
    tankTypeAppNo?: string;
    tc2Details?: Tc2Details;
    tc3Details?: Tc3Details;
}

export interface TankStatement {
    substancesPermitted?: string;
    statement?: string;
    productListRefNo?: string;
    productListUnNo?: string[];
    productList?: string;
}

export interface Tc2Details {
    tc2Type?: Tc2Type;
    tc2IntermediateApprovalNo?: string;
    tc2IntermediateExpiryDate?: string;
}

export type Tc2Type = "initial";

export type Tc3Details = Tc3DetailsItem[];

export interface Tc3DetailsItem {
    tc3Type?: Tc3Type;
    tc3PeriodicNumber?: string;
    tc3PeriodicExpiryDate?: string;
}

export type Tc3Type = "intermediate" | "periodic" | "exceptional";

export const parseAdrDetails = (adrDetails?: DynamoDbImage): Maybe<AdrDetails> => {
    if (!adrDetails) {
        return undefined;
    }

    const additionalNotesImage: DynamoDbImage = adrDetails.getMap("additionalNotes")!;
    const additionalNotes: AdditionalNotes = {
        number: parseStringArray(additionalNotesImage.getList("number")),
        guidanceNotes: parseStringArray(additionalNotesImage.getList("guidanceNotes"))
    };

    const applicantDetailsImage: DynamoDbImage = adrDetails.getMap("applicantDetails")!;
    const applicantDetails: ApplicantDetails = {
        name: applicantDetailsImage.getString("name"),
        street: applicantDetailsImage.getString("street"),
        town: applicantDetailsImage.getString("town"),
        city: applicantDetailsImage.getString("city"),
        postcode: applicantDetailsImage.getString("postcode"),
    };

    const vehicleDetailsImage: DynamoDbImage = adrDetails.getMap("vehicleDetails")!;
    const vehicleDetails: VehicleDetails = {
        type: vehicleDetailsImage.getString("type"),
        approvalDate: vehicleDetailsImage.getString("approvalDate")
    };

    const tankImage: DynamoDbImage = adrDetails.getMap("tank")!;

    const tankDetailsImage = tankImage.getMap("tankDetails")!;

    const tc2DetailsImage: DynamoDbImage = tankDetailsImage.getMap("tc2Details")!;
    const tc2Details: Tc2Details = {
        tc2Type: tc2DetailsImage.getString("tc2Type") as Tc2Type,
        tc2IntermediateApprovalNo: tc2DetailsImage.getString("tc2IntermediateApprovalNo"),
        tc2IntermediateExpiryDate: tc2DetailsImage.getString("tc2IntermediateExpiryDate")
    };

    const tc3DetailsImage: DynamoDbImage = tankDetailsImage.getList("tc3Details")!;
    const tc3Details: Tc3Details = [];

    for (const key of tc3DetailsImage.getKeys()) {
        const tc3DetailsItemImage = tc3DetailsImage.getMap(key)!;
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

    const tankStatementImage: DynamoDbImage = tankImage.getMap("tankStatement")!;
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
