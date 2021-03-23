import {DynamoDbImage, parseStringArray} from "../services/dynamodb-images";
import {AuthIntoService, parseAuthIntoService} from "./auth-into-service";
import {LettersOfAuth, parseLettersOfAuth} from "./letters-of-auth";
import {ApplicantDetailsProperties, parseApplicantDetailsProperties} from "./applicant-details-properties";
import {parsePurchaserDetails, PurchaserDetails} from "./purchaser-details";
import {ManufacturerDetails, parseManufacturerDetails} from "./manufacturer-details";
import {Microfilm, parseMicrofilm} from "./microfilm";
import {parsePlates, Plates} from "./plates";
import {BodyType, parseBodyType} from "./body-type";
import {Dimensions, parseDimensions} from "./dimensions";
import {AdrDetails, parseAdrDetails} from "./adr-details";
import {parseVehicleClass, VehicleClass} from "./vehicle-class";
import {Brakes, parseBrakes} from "./brakes";
import {Axles, parseAxles} from "./axles";
import {Dda, parseDda} from "./dda";
import {SqlParametersList} from "aws-sdk/clients/rdsdataservice";
import {booleanParam, dateParam, integerParam, stringParam, timestampParam} from "../services/sql-parameter";

export type TechRecords = TechRecord[];

export interface TechRecord {
    recordCompleteness: string;
    createdAt: string;
    lastUpdatedAt: string;
    make: string;
    model: string;
    functionCode: string;
    fuelPropulsionSystem: FuelPropulsionSystem;
    offRoad: boolean;
    numberOfWheelsDriven: number;
    euVehicleCategory: EuVehicleCategory;
    emissionsLimit: number;
    departmentalVehicleMarker: boolean;
    authIntoService: AuthIntoService;
    lettersOfAuth: LettersOfAuth;
    alterationMarker: boolean;
    approvalType: ApprovalType;
    approvalTypeNumber: string;
    variantNumber: string;
    variantVersionNumber: string;
    grossEecWeight: number;
    trainEecWeight: number;
    maxTrainEecWeight: number;
    applicantDetails: ApplicantDetailsProperties;
    purchaserDetails: PurchaserDetails;
    manufacturerDetails: ManufacturerDetails;
    microfilm: Microfilm;
    plates: Plates;
    chassisMake: string;
    chassisModel: string;
    bodyMake: string;
    bodyModel: string;
    modelLiteral: string;
    bodyType: BodyType;
    manufactureYear: number;
    regnDate: string;
    firstUseDate: string;
    coifDate: string;
    ntaNumber: string;
    coifSerialNumber: string;
    coifCertifierName: string;
    conversionRefNo: string;
    seatsLowerDeck: number;
    seatsUpperDeck: number;
    standingCapacity: number;
    speedRestriction: number;
    speedLimiterMrk: boolean;
    tachoExemptMrk: boolean;
    dispensations: string;
    remarks: string;
    reasonForCreation: string;
    statusCode: StatusCode;
    unladenWeight: number;
    grossKerbWeight: number;
    grossLadenWeight: number;
    grossGbWeight: number;
    grossDesignWeight: number;
    trainGbWeight: number;
    trainDesignWeight: number;
    maxTrainGbWeight: number;
    maxTrainDesignWeight: number;
    maxLoadOnCoupling: number;
    frameDescription: FrameDescription;
    tyreUseCode: string;
    roadFriendly: boolean;
    drawbarCouplingFitted: boolean;
    euroStandard: string;
    suspensionType: string;
    couplingType: string;
    dimensions: Dimensions;
    frontAxleTo5thWheelMin: number;
    frontAxleTo5thWheelMax: number;
    frontAxleTo5thWheelCouplingMin: number;
    frontAxleTo5thWheelCouplingMax: number;
    frontAxleToRearAxle: number;
    rearAxleToRearTrl: number;
    couplingCenterToRearAxleMin: number;
    couplingCenterToRearAxleMax: number;
    couplingCenterToRearTrlMin: number;
    couplingCenterToRearTrlMax: number;
    centreOfRearmostAxleToRearOfTrl: number;
    notes: string;
    noOfAxles: number;
    brakeCode: string;
    adrDetails: AdrDetails;
    createdByName: string;
    createdById: string;
    lastUpdatedByName: string;
    lastUpdatedById: string;
    updateType: UpdateType;
    vehicleClass: VehicleClass;
    vehicleSubclass: string[];
    vehicleType: VehicleType;
    vehicleSize: VehicleSize;
    numberOfSeatbelts: string;
    seatbeltInstallationApprovalDate: string;
    vehicleConfiguration: VehicleConfiguration;
    brakes: Brakes;
    axles: Axles;
    dda: Dda;
}

export type FuelPropulsionSystem = "DieselPetrol" | "Hybrid" | "Electric" | "CNG" | "Fuel cell" | "LNG" | "Other";

export type EuVehicleCategory =
    "m1"
    | "m2"
    | "m3"
    | "n1"
    | "n2"
    | "n3"
    | "o1"
    | "o2"
    | "o3"
    | "o4"
    | "l1e-a"
    | "l1e"
    | "l2e"
    | "l3e"
    | "l4e"
    | "l5e"
    | "l6e"
    | "l7e";

export type ApprovalType = "NTA" | "ECTA" | "IVA" | "NSSTA" | "ECSSTA";

export type StatusCode = "archived" | "current" | "provisional";

export type FrameDescription =
    "Channel section"
    | "Space frame"
    | "I section"
    | "Tubular"
    | "Frame section"
    | "Other"
    | "integral"
    | "Box section"
    | "U section";

export type UpdateType = "adrUpdate" | "techRecordUpdate";

export type VehicleType = "psv" | "hgv" | "trl" | "car" | "lgv" | "motorcycle";

export type VehicleSize = "small" | "large";

export type VehicleConfiguration =
    "rigid"
    | "articulated"
    | "centre axle drawbar"
    | "semi-car transporter"
    | "semi-trailer"
    | "low loader"
    | "other"
    | "drawbar"
    | "four-in-line"
    | "dolly"
    | "full drawbar";

export const parseTechRecords = (image: DynamoDbImage): TechRecords => {
    const techRecords: TechRecords = [];

    for (const key of Object.keys(image)) {
        techRecords.push(parseTechRecord(image.getMap(key)));
    }

    return techRecords;
};

const parseTechRecord = (image: DynamoDbImage): TechRecord => {
    return {
        recordCompleteness: image.getString("recordCompleteness"),
        createdAt: image.getString("createdAt"),
        lastUpdatedAt: image.getString("lastUpdatedAt"),
        make: image.getString("make"),
        model: image.getString("model"),
        functionCode: image.getString("functionCode"),
        fuelPropulsionSystem: image.getString("fuelPropulsionSystem") as FuelPropulsionSystem,
        offRoad: image.getBoolean("offRoad"),
        numberOfWheelsDriven: image.getNumber("numberOfWheelsDriven"),
        euVehicleCategory: image.getString("euVehicleCategory") as EuVehicleCategory,
        emissionsLimit: image.getNumber("emissionsLimit"),
        departmentalVehicleMarker: image.getBoolean("departmentalVehicleMarker"),
        authIntoService: parseAuthIntoService(image.getMap("authIntoService")),
        lettersOfAuth: parseLettersOfAuth(image.getMap("lettersOfAuth")),
        alterationMarker: image.getBoolean("alterationMarker"),
        approvalType: image.getString("approvalType") as ApprovalType,
        approvalTypeNumber: image.getString("approvalTypeNumber"),
        variantNumber: image.getString("variantNumber"),
        variantVersionNumber: image.getString("variantVersionNumber"),
        grossEecWeight: image.getNumber("grossEecWeight"),
        trainEecWeight: image.getNumber("trainEecWeight"),
        maxTrainEecWeight: image.getNumber("maxTrainEecWeight"),
        applicantDetails: parseApplicantDetailsProperties(image.getMap("applicantDetails")),
        purchaserDetails: parsePurchaserDetails(image.getMap("purchaserDetails")),
        manufacturerDetails: parseManufacturerDetails(image.getMap("manufacturerDetails")),
        microfilm: parseMicrofilm(image.getMap("microfilm")),
        plates: parsePlates(image.getList("plates")),
        chassisMake: image.getString("chassisMake"),
        chassisModel: image.getString("chassisModel"),
        bodyMake: image.getString("bodyMake"),
        bodyModel: image.getString("bodyModel"),
        modelLiteral: image.getString("bodyModel"),
        bodyType: parseBodyType(image.getMap("bodyType")),
        manufactureYear: image.getNumber("manufactureYear"),
        regnDate: image.getString("regnDate"),
        firstUseDate: image.getString("firstUseDate"),
        coifDate: image.getString("coifDate"),
        ntaNumber: image.getString("ntaNumber"),
        coifSerialNumber: image.getString("coifSerialNumber"),
        coifCertifierName: image.getString("coifCertifierName"),
        conversionRefNo: image.getString("coifCertifierName"),
        seatsLowerDeck: image.getNumber("seatsLowerDeck"),
        seatsUpperDeck: image.getNumber("seatsUpperDeck"),
        standingCapacity: image.getNumber("standingCapacity"),
        speedRestriction: image.getNumber("speedRestriction"),
        speedLimiterMrk: image.getBoolean("speedLimiterMrk"),
        tachoExemptMrk: image.getBoolean("tachoExemptMrk"),
        dispensations: image.getString("dispensations"),
        remarks: image.getString("remarks"),
        reasonForCreation: image.getString("reasonForCreation"),
        statusCode: image.getString("statusCode") as StatusCode,
        unladenWeight: image.getNumber("unladenWeight"),
        grossKerbWeight: image.getNumber("grossKerbWeight"),
        grossLadenWeight: image.getNumber("grossLadenWeight"),
        grossGbWeight: image.getNumber("grossGbWeight"),
        grossDesignWeight: image.getNumber("grossGbWeight"),
        trainGbWeight: image.getNumber("trainGbWeight"),
        trainDesignWeight: image.getNumber("trainDesignWeight"),
        maxTrainGbWeight: image.getNumber("maxTrainGbWeight"),
        maxTrainDesignWeight: image.getNumber("maxTrainDesignWeight"),
        maxLoadOnCoupling: image.getNumber("maxLoadOnCoupling"),
        frameDescription: image.getString("frameDescription") as FrameDescription,
        tyreUseCode: image.getString("tyreUseCode"),
        roadFriendly: image.getBoolean("roadFriendly"),
        drawbarCouplingFitted: image.getBoolean("drawbarCouplingFitted"),
        euroStandard: image.getString("euroStandard"),
        suspensionType: image.getString("suspensionType"),
        couplingType: image.getString("couplingType"),
        dimensions: parseDimensions(image.getMap("dimensions")),
        frontAxleTo5thWheelMin: image.getNumber("frontAxleTo5thWheelMin"),
        frontAxleTo5thWheelMax: image.getNumber("frontAxleTo5thWheelMax"),
        frontAxleTo5thWheelCouplingMin: image.getNumber("frontAxleTo5thWheelCouplingMin"),
        frontAxleTo5thWheelCouplingMax: image.getNumber("frontAxleTo5thWheelCouplingMax"),
        frontAxleToRearAxle: image.getNumber("frontAxleToRearAxle"),
        rearAxleToRearTrl: image.getNumber("rearAxleToRearTrl"),
        couplingCenterToRearAxleMin: image.getNumber("couplingCenterToRearAxleMin"),
        couplingCenterToRearAxleMax: image.getNumber("couplingCenterToRearAxleMax"),
        couplingCenterToRearTrlMin: image.getNumber("couplingCenterToRearTrlMin"),
        couplingCenterToRearTrlMax: image.getNumber("couplingCenterToRearTrlMax"),
        centreOfRearmostAxleToRearOfTrl: image.getNumber("centreOfRearmostAxleToRearOfTrl"),
        notes: image.getString("notes"),
        noOfAxles: image.getNumber("noOfAxles"),
        brakeCode: image.getString("brakeCode"),
        adrDetails: parseAdrDetails(image.getMap("adrDetails")),
        createdByName: image.getString("createdByName"),
        createdById: image.getString("createdById"),
        lastUpdatedByName: image.getString("lastUpdatedByName"),
        lastUpdatedById: image.getString("lastUpdatedById"),
        updateType: image.getString("updateType") as UpdateType,
        vehicleClass: parseVehicleClass(image.getMap("vehicleClass")),
        vehicleSubclass: parseStringArray(image.getList("vehicleSubclass")),
        vehicleType: image.getString("vehicleType") as VehicleType,
        vehicleSize: image.getString("vehicleSize") as VehicleSize,
        numberOfSeatbelts: image.getString("numberOfSeatbelts"),
        seatbeltInstallationApprovalDate: image.getString("seatbeltInstallationApprovalDate"),
        vehicleConfiguration: image.getString("vehicleConfiguration") as VehicleConfiguration,
        brakes: parseBrakes(image.getMap("brakes")),
        axles: parseAxles(image.getList("axles")),
        dda: parseDda(image.getMap("dda"))
    };
};

export const toTechRecordSqlParameters = (techRecord: TechRecord): SqlParametersList => {
    const sqlParameters: SqlParametersList = [];

    sqlParameters.push(stringParam("recordCompleteness", techRecord.recordCompleteness));
    sqlParameters.push(timestampParam("createdAt", techRecord.createdAt));
    sqlParameters.push(timestampParam("lastUpdatedAt", techRecord.lastUpdatedAt));
    sqlParameters.push(stringParam("functionCode", techRecord.functionCode));
    sqlParameters.push(booleanParam("offRoad", techRecord.offRoad));
    sqlParameters.push(integerParam("numberOfWheelsDriven", techRecord.numberOfWheelsDriven));
    sqlParameters.push(stringParam("emissionsLimit", "" + techRecord.emissionsLimit));
    sqlParameters.push(booleanParam("departmentalVehicleMarker", techRecord.departmentalVehicleMarker));
    sqlParameters.push(booleanParam("alterationMarker", techRecord.alterationMarker));
    sqlParameters.push(stringParam("variantVersionNumber", techRecord.variantVersionNumber));
    sqlParameters.push(integerParam("grossEecWeight", techRecord.grossEecWeight));
    sqlParameters.push(integerParam("trainEecWeight", techRecord.trainEecWeight));
    sqlParameters.push(integerParam("maxTrainEecWeight", techRecord.maxTrainEecWeight));
    sqlParameters.push(integerParam("manufactureYear", techRecord.manufactureYear));
    sqlParameters.push(dateParam("regnDate", techRecord.regnDate));
    sqlParameters.push(dateParam("firstUseDate", techRecord.firstUseDate));
    sqlParameters.push(dateParam("coifDate", techRecord.coifDate));
    sqlParameters.push(stringParam("ntaNumber", techRecord.ntaNumber));
    sqlParameters.push(stringParam("coifSerialNumber", techRecord.coifSerialNumber));
    sqlParameters.push(stringParam("coifCertifierName", techRecord.coifCertifierName));
    sqlParameters.push(stringParam("approvalType", techRecord.approvalType));
    sqlParameters.push(stringParam("approvalTypeNumber", techRecord.approvalTypeNumber));
    sqlParameters.push(stringParam("conversionRefNo", techRecord.conversionRefNo));
    sqlParameters.push(integerParam("seatsLowerDeck", techRecord.seatsLowerDeck));
    sqlParameters.push(integerParam("seatsUpperDeck", techRecord.seatsUpperDeck));
    sqlParameters.push(integerParam("standingCapacity", techRecord.standingCapacity));
    sqlParameters.push(integerParam("speedRestriction", techRecord.speedRestriction));
    sqlParameters.push(booleanParam("speedLimiterMrk", techRecord.speedLimiterMrk));
    sqlParameters.push(booleanParam("tachoExemptMrk", techRecord.tachoExemptMrk));
    sqlParameters.push(stringParam("dispensations", techRecord.dispensations));
    sqlParameters.push(stringParam("remarks", techRecord.remarks));
    sqlParameters.push(stringParam("reasonForCreation", techRecord.reasonForCreation));
    sqlParameters.push(stringParam("statusCode", techRecord.statusCode));
    sqlParameters.push(integerParam("unladenWeight", techRecord.unladenWeight));
    sqlParameters.push(integerParam("grossKerbWeight", techRecord.grossKerbWeight));
    sqlParameters.push(integerParam("grossLadenWeight", techRecord.grossLadenWeight));
    sqlParameters.push(integerParam("grossGbWeight", techRecord.grossGbWeight));
    sqlParameters.push(integerParam("grossDesignWeight", techRecord.grossDesignWeight));
    sqlParameters.push(integerParam("trainGbWeight", techRecord.trainGbWeight));
    sqlParameters.push(integerParam("trainDesignWeight", techRecord.trainDesignWeight));
    sqlParameters.push(integerParam("maxTrainGbWeight", techRecord.maxTrainGbWeight));
    sqlParameters.push(integerParam("maxTrainDesignWeight", techRecord.maxTrainDesignWeight));
    sqlParameters.push(integerParam("maxLoadOnCoupling", techRecord.maxLoadOnCoupling));
    sqlParameters.push(stringParam("frameDescription", techRecord.frameDescription));
    sqlParameters.push(stringParam("tyreUseCode", techRecord.tyreUseCode));
    sqlParameters.push(booleanParam("roadFriendly", techRecord.roadFriendly));
    sqlParameters.push(booleanParam("drawbarCouplingFitted", techRecord.drawbarCouplingFitted));
    sqlParameters.push(stringParam("euroStandard", techRecord.euroStandard));
    sqlParameters.push(stringParam("suspensionType", techRecord.suspensionType));
    sqlParameters.push(stringParam("couplingType", techRecord.couplingType));
    sqlParameters.push(integerParam("length", techRecord.dimensions.length));
    sqlParameters.push(integerParam("height", techRecord.dimensions.height));
    sqlParameters.push(integerParam("width", techRecord.dimensions.width));
    sqlParameters.push(integerParam("frontAxleTo5thWheelMin", techRecord.frontAxleTo5thWheelMin));
    sqlParameters.push(integerParam("frontAxleTo5thWheelMax", techRecord.frontAxleTo5thWheelMax));
    sqlParameters.push(integerParam("frontAxleTo5thWheelCouplingMin", techRecord.frontAxleTo5thWheelCouplingMin));
    sqlParameters.push(integerParam("frontAxleTo5thWheelCouplingMax", techRecord.frontAxleTo5thWheelCouplingMax));
    sqlParameters.push(integerParam("frontAxleToRearAxle", techRecord.frontAxleToRearAxle));
    sqlParameters.push(integerParam("rearAxleToRearTrl", techRecord.rearAxleToRearTrl));
    sqlParameters.push(integerParam("couplingCenterToRearAxleMin", techRecord.couplingCenterToRearAxleMin));
    sqlParameters.push(integerParam("couplingCenterToRearAxleMax", techRecord.couplingCenterToRearAxleMax));
    sqlParameters.push(integerParam("couplingCenterToRearTrlMin", techRecord.couplingCenterToRearTrlMin));
    sqlParameters.push(integerParam("couplingCenterToRearTrlMax", techRecord.couplingCenterToRearTrlMax));
    sqlParameters.push(integerParam("centreOfRearmostAxleToRearOfTrl", techRecord.centreOfRearmostAxleToRearOfTrl));
    sqlParameters.push(stringParam("notes", techRecord.notes));
    sqlParameters.push(stringParam("purchaserNotes", techRecord.purchaserDetails.purchaserNotes));
    sqlParameters.push(stringParam("manufacturerNotes", techRecord.manufacturerDetails.manufacturerNotes));
    sqlParameters.push(integerParam("noOfAxles", techRecord.noOfAxles));
    sqlParameters.push(stringParam("brakeCode", techRecord.brakeCode));
    sqlParameters.push(integerParam("createdBy_Id", +techRecord.createdById));
    sqlParameters.push(integerParam("lastUpdatedBy_Id", +techRecord.lastUpdatedById));
    sqlParameters.push(stringParam("updateType", techRecord.updateType));
    sqlParameters.push(stringParam("numberOfSeatbelts", techRecord.numberOfSeatbelts));
    sqlParameters.push(dateParam("seatbeltInstallationApprovalDate", techRecord.seatbeltInstallationApprovalDate));

    return sqlParameters;
};

export const toMakeModelSqlParameters = (techRecord: TechRecord): SqlParametersList => {
    const sqlParameters: SqlParametersList = [];

    sqlParameters.push(stringParam("make", techRecord.make));
    sqlParameters.push(stringParam("model", techRecord.model));
    sqlParameters.push(stringParam("chassisMake", techRecord.chassisMake));
    sqlParameters.push(stringParam("chassisModel", techRecord.chassisModel));
    sqlParameters.push(stringParam("bodyMake", techRecord.bodyMake));
    sqlParameters.push(stringParam("bodyModel", techRecord.bodyModel));
    sqlParameters.push(stringParam("modelLiteral", techRecord.modelLiteral));
    sqlParameters.push(stringParam("bodyTypeCode", techRecord.bodyType.code));
    sqlParameters.push(stringParam("bodyTypeDescription", techRecord.bodyType.description));
    sqlParameters.push(stringParam("fuelPropulsionSystem", techRecord.fuelPropulsionSystem));

    return sqlParameters;
};

export const toMakeModelTemplateVariables = (techRecord: TechRecord): any[] => {
    const templateVariables: any[] = [];

    templateVariables.push(techRecord.make);
    templateVariables.push(techRecord.model);
    templateVariables.push(techRecord.chassisMake);
    templateVariables.push(techRecord.chassisModel);
    templateVariables.push(techRecord.bodyMake);
    templateVariables.push(techRecord.bodyModel);
    templateVariables.push(techRecord.modelLiteral);
    templateVariables.push(techRecord.bodyType.code);
    templateVariables.push(techRecord.bodyType.description);
    templateVariables.push(techRecord.fuelPropulsionSystem);

    return templateVariables;
};

export const toVehicleClassSqlParameters = (techRecord: TechRecord): SqlParametersList => {
    const sqlParameters: SqlParametersList = [];

    sqlParameters.push(stringParam("code", techRecord.vehicleClass.code));
    sqlParameters.push(stringParam("description", techRecord.vehicleClass.code));
    sqlParameters.push(stringParam("vehicleType", techRecord.vehicleType));
    sqlParameters.push(stringParam("vehicleSize", techRecord.vehicleSize));
    sqlParameters.push(stringParam("vehicleConfiguration", techRecord.vehicleConfiguration));
    sqlParameters.push(stringParam("euVehicleCategory", techRecord.euVehicleCategory));

    return sqlParameters;
};

export const toVehicleClassTemplateVariables = (techRecord: TechRecord): any[] => {
    const templateVariables: any[] = [];

    templateVariables.push(techRecord.vehicleClass.code);
    templateVariables.push(techRecord.vehicleClass.description);
    templateVariables.push(techRecord.vehicleType);
    templateVariables.push(techRecord.vehicleSize);
    templateVariables.push(techRecord.vehicleConfiguration);
    templateVariables.push(techRecord.euVehicleCategory);

    return templateVariables;
};

export const toVehicleSubClassSqlParameters = (techRecord: TechRecord): SqlParametersList => {
    const sqlParameters: SqlParametersList = [];

    sqlParameters.push(stringParam("subclass", techRecord.euVehicleCategory));

    return sqlParameters;
};

export const getFaxNumber = (techRecord: TechRecord): string | undefined => {
    if (techRecord.purchaserDetails) {
        return techRecord.purchaserDetails.faxNumber;
    }
    if (techRecord.manufacturerDetails) {
        return techRecord.manufacturerDetails.faxNumber;
    }
    return undefined;
};
