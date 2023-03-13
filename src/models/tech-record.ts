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
import {AdrDetails} from "./adr-details";
import {parseVehicleClass, VehicleClass} from "./vehicle-class";
import {Brakes, parseBrakes} from "./brakes";
import {Axles, parseAxles} from "./axles";
import {Dda} from "./dda";
import {Maybe} from "./optionals";
import {EuVehicleCategory, VehicleConfiguration, VehicleSize, VehicleType} from "./shared-enums";

export type TechRecords = TechRecord[];

export interface TechRecord {
    recordCompleteness?: string;
    createdAt?: string;
    lastUpdatedAt?: string;
    make?: string;
    model?: string;
    functionCode?: string;
    fuelPropulsionSystem?: FuelPropulsionSystem;
    offRoad?: boolean;
    numberOfWheelsDriven?: number;
    euVehicleCategory?: EuVehicleCategory;
    emissionsLimit?: number;
    departmentalVehicleMarker?: boolean;
    authIntoService?: AuthIntoService;
    lettersOfAuth?: LettersOfAuth;
    alterationMarker?: boolean;
    approvalType?: ApprovalType;
    approvalTypeNumber?: string;
    variantNumber?: string;
    variantVersionNumber?: string;
    grossEecWeight?: number;
    trainEecWeight?: number;
    maxTrainEecWeight?: number;
    applicantDetails?: ApplicantDetailsProperties;
    purchaserDetails?: PurchaserDetails;
    manufacturerDetails?: ManufacturerDetails;
    microfilm?: Microfilm;
    plates?: Plates;
    chassisMake?: string;
    chassisModel?: string;
    bodyMake?: string;
    bodyModel?: string;
    modelLiteral?: string;
    bodyType?: BodyType;
    manufactureYear?: number;
    regnDate?: string;
    firstUseDate?: string;
    coifDate?: string;
    ntaNumber?: string;
    coifSerialNumber?: string;
    coifCertifierName?: string;
    conversionRefNo?: string;
    seatsLowerDeck?: number;
    seatsUpperDeck?: number;
    standingCapacity?: number;
    speedRestriction?: number;
    speedLimiterMrk?: boolean;
    tachoExemptMrk?: boolean;
    dispensations?: string;
    remarks?: string;
    reasonForCreation?: string;
    statusCode?: StatusCode;
    unladenWeight?: number;
    grossKerbWeight?: number;
    grossLadenWeight?: number;
    grossGbWeight?: number;
    grossDesignWeight?: number;
    trainGbWeight?: number;
    trainDesignWeight?: number;
    maxTrainGbWeight?: number;
    maxTrainDesignWeight?: number;
    maxLoadOnCoupling?: number;
    frameDescription?: FrameDescription;
    tyreUseCode?: string;
    roadFriendly?: boolean;
    drawbarCouplingFitted?: boolean;
    euroStandard?: string;
    suspensionType?: string;
    couplingType?: string;
    dimensions?: Dimensions;
    frontAxleTo5thWheelMin?: number;
    frontAxleTo5thWheelMax?: number;
    frontVehicleTo5thWheelCouplingMin?: number;
    frontVehicleTo5thWheelCouplingMax?: number;
    frontAxleToRearAxle?: number;
    rearAxleToRearTrl?: number;
    couplingCenterToRearAxleMin?: number;
    couplingCenterToRearAxleMax?: number;
    couplingCenterToRearTrlMin?: number;
    couplingCenterToRearTrlMax?: number;
    centreOfRearmostAxleToRearOfTrl?: number;
    notes?: string;
    noOfAxles?: number;
    brakeCode?: string;
    adrDetails?: AdrDetails;
    createdByName?: string;
    createdById?: string;
    lastUpdatedByName?: string;
    lastUpdatedById?: string;
    updateType?: UpdateType;
    vehicleClass?: VehicleClass;
    vehicleSubclass?: string[];
    vehicleType?: VehicleType;
    vehicleSize?: VehicleSize;
    numberOfSeatbelts?: string;
    seatbeltInstallationApprovalDate?: string;
    vehicleConfiguration?: VehicleConfiguration;
    brakes?: Brakes;
    axles?: Axles;
    dda?: Dda;
}

export type FuelPropulsionSystem = "DieselPetrol" | "Hybrid" | "Electric" | "CNG" | "Fuel cell" | "LNG" | "Other";

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

export const parseTechRecords = (image?: DynamoDbImage): TechRecords => {
    if (!image) {
        return [] as TechRecords;
    }

    const techRecords: TechRecords = [];

    for (const key of image.getKeys()) {
        techRecords.push(parseTechRecord(image.getMap(key)!));
    }

    return techRecords;
};

const parseTechRecord = (image: DynamoDbImage): TechRecord => {
    return {
        recordCompleteness: image.getString("recordCompleteness"),
        createdAt: image.getDate("createdAt"),
        lastUpdatedAt: image.getDate("lastUpdatedAt"),
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
        modelLiteral: image.getString("modelLiteral"),
        bodyType: parseBodyType(image.getMap("bodyType")),
        manufactureYear: image.getNumber("manufactureYear"),
        regnDate: image.getString("regnDate"),
        firstUseDate: image.getString("firstUseDate"),
        coifDate: image.getString("coifDate"),
        ntaNumber: image.getString("ntaNumber"),
        coifSerialNumber: image.getString("coifSerialNumber"),
        coifCertifierName: image.getString("coifCertifierName"),
        conversionRefNo: image.getString("conversionRefNo"),
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
        grossDesignWeight: image.getNumber("grossDesignWeight"),
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
        frontVehicleTo5thWheelCouplingMin: image.getNumber("frontVehicleTo5thWheelCouplingMin"),
        frontVehicleTo5thWheelCouplingMax: image.getNumber("frontVehicleTo5thWheelCouplingMax"),
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
        adrDetails: undefined, // intentional - not implemented. parseAdrDetails(image.getMap("adrDetails"))
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
        dda: undefined, // intentional - not implemented. parseDda(image.getMap("dda"))
    };
};

export const getFaxNumber = (techRecord: TechRecord): Maybe<string> => {
    if (techRecord.purchaserDetails) {
        return techRecord.purchaserDetails.faxNumber;
    }
    if (techRecord.manufacturerDetails) {
        return techRecord.manufacturerDetails.faxNumber;
    }
    return undefined;
};
