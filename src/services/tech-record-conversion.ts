import {DynamoDbImage} from "./dynamodb-images";
import {parseTechRecordDocument, TechRecordDocument, toVehicleTemplateVariables} from "../models/tech-record-document";
import {query} from "./connection-pool";
import {
    getFaxNumber,
    TechRecord,
    toMakeModelTemplateVariables,
    toTechRecordTemplateVariables,
    toVehicleClassTemplateVariables,
    toVehicleSubClassTemplateVariables
} from "../models/tech-record";
import {toContactDetailsTemplateVariables} from "../models/applicant-details-properties";
import {toBrakesTemplateVariables} from "../models/brakes";
import {KnownOperationType} from "./operation-types";

export const convertTechRecordDocument = async (operationType: KnownOperationType, image: DynamoDbImage): Promise<void> => {
    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(image);

    const sqlOperation: (techRecordDocument: TechRecordDocument) => Promise<void> = deriveSqlOperation(operationType);

    await sqlOperation(techRecordDocument);
};

const deriveSqlOperation = (operationType: KnownOperationType): ((techRecordDocument: TechRecordDocument) => Promise<any>) => {
    switch (operationType) {
        case "INSERT":
        case "UPDATE":
            return upsertTechRecords;
        case "DELETE":
            return deleteTechRecords;
    }
};

const upsertTechRecords = async (techRecordDocument: TechRecordDocument): Promise<number[]> => {
    const vehicleId = await upsertVehicle(techRecordDocument);

    const techRecords = techRecordDocument.techRecord;

    const insertedIds: number[] = [];

    if (!techRecords) {
        return [];
    }

    for (const techRecord of techRecords) {
        const makeModelId = upsertMakeModel(techRecord);
        const vehicleClassId = upsertVehicleClass(techRecord);
        const contactDetailsId = upsertContactDetails(techRecord);
        const createdById = upsertIdentity(techRecord.createdById!, techRecord.createdByName!);
        const lastUpdatedById = upsertIdentity(techRecord.lastUpdatedById!, techRecord.lastUpdatedByName!);
        const brakesId = upsertBrakes(techRecord);
        const vehicleSubclassId = upsertVehicleSubclass(techRecord);

        const insertTechRecordQuery = "INSERT INTO technical_record (recordCompleteness, createdAt, lastUpdatedAt, functionCode, offRoad, numberOfWheelsDriven, emissionsLimit, departmentalVehicleMarker, alterationMarker, variantVersionNumber, grossEecWeight, trainEecWeight, maxTrainEecWeight, manufactureYear, regnDate, firstUseDate, coifDate, ntaNumber, coifSerialNumber, coifCertifierName, approvalType, approvalTypeNumber, variantNumber, conversionRefNo, seatsLowerDeck, seatsUpperDeck, standingCapacity, speedRestriction, speedLimiterMrk, tachoExemptMrk, dispensations, remarks, reasonForCreation, statusCode, unladenWeight, grossKerbWeight, grossLadenWeight, grossGbWeight, grossDesignWeight, trainGbWeight, trainDesignWeight, maxTrainGbWeight, maxTrainDesignWeight, maxLoadOnCoupling, frameDescription, tyreUseCode, roadFriendly, drawbarCouplingFitted, euroStandard, suspensionType, couplingType, length, height, width, frontAxleTo5thWheelMin, frontAxleTo5thWheelMax, frontAxleTo5thWheelCouplingMin, frontAxleTo5thWheelCouplingMax, frontAxleToRearAxle, rearAxleToRearTrl, couplingCenterToRearAxleMin, couplingCenterToRearAxleMax, couplingCenterToRearTrlMin, couplingCenterToRearTrlMax, centreOfRearmostAxleToRearOfTrl, notes, purchaserNotes, manufacturerNotes, noOfAxles, brakeCode, updateType, numberOfSeatbelts, seatbeltInstallationApprovalDate, vehicle_id, make_model_id, vehicle_class_id, applicant_detail_id, purchaser_detail_id, manufacturer_detail_id, createdBy_Id, lastUpdatedBy_Id, brakes_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const techRecordTemplateVariables = toTechRecordTemplateVariables(techRecord);
        techRecordTemplateVariables.push(vehicleId, makeModelId, vehicleClassId, contactDetailsId, createdById, lastUpdatedById, brakesId);
        const insertTechRecordResponse = await query(insertTechRecordQuery, techRecordTemplateVariables);
        insertedIds.push(insertTechRecordResponse.results.insertId);
    }

    return insertedIds;
};

const deleteTechRecords = async (techRecordDocument: TechRecordDocument): Promise<void> => {
    // TODO
};

const upsertVehicle = async (techRecordDocument: TechRecordDocument): Promise<number> => {
    const insertVehicleQuery = "INSERT INTO vehicle (system_number, vin, vrm_trm, trailer_id, createdAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP())";
    const insertVehicleResponse = await query(insertVehicleQuery, toVehicleTemplateVariables(techRecordDocument));
    return insertVehicleResponse.results.insertId;
};

const upsertMakeModel = async (techRecord: TechRecord): Promise<number> => {
    const insertMakeModelQuery = "f_upsert_make_model(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const insertMakeModelResponse = await query(insertMakeModelQuery, toMakeModelTemplateVariables(techRecord));
    return insertMakeModelResponse.results.insertId;
};

const upsertVehicleClass = async (techRecord: TechRecord): Promise<number> => {
    const insertVehicleClassQuery = "f_upsert_vehicle_class(?, ?, ?, ?, ?, ?)";
    const insertVehicleClassResponse = await query(insertVehicleClassQuery, toVehicleClassTemplateVariables(techRecord));
    return insertVehicleClassResponse.results.insertId;
};

const upsertContactDetails = async (techRecord: TechRecord): Promise<void> => {
    const insertContactDetailsQuery = "f_upsert_contact_details(?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const contactDetailsTemplateVariables = toContactDetailsTemplateVariables(techRecord.applicantDetails!); // TODO check nullity
    contactDetailsTemplateVariables.push(getFaxNumber(techRecord));
    const insertContactDetailsResponse = await query(insertContactDetailsQuery, contactDetailsTemplateVariables);
    return insertContactDetailsResponse.results.insertId;
};

const upsertIdentity = async (id: string, name: string): Promise<number> => {
    // TODO check nullity
    const insertIdentityQuery = "f_upsert_identity(?, ?)";
    const insertIdentityResponse = await query(insertIdentityQuery, [id, name]);
    return insertIdentityResponse.results.insertId;
};

const upsertBrakes = async (techRecord: TechRecord): Promise<number> => {
    const insertBrakesQuery = "INSERT INTO brakes (brakeCodeOriginal, brakeCode, dataTrBrakeOne, dataTrBrakeTwo, dataTrBrakeThree, retarderBrakeOne, retarderBrakeTwo, dtpNumber, loadSensingValve, antilockBrakingSystem, serviceBrakeForceA, secondaryBrakeForceA, parkingBrakeForceA, serviceBrakeForceB, secondaryBrakeForceB, parkingBrakeForceB) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); SELECT LAST_INSERT_ID();";
    const insertBrakesResponse = await query(insertBrakesQuery, toBrakesTemplateVariables(techRecord.brakes!)); // TODO check nullity
    return insertBrakesResponse.results[0].id;
};

const upsertVehicleSubclass = async (techRecord: TechRecord): Promise<number> => {
    const insertVehicleSubclassQuery = "f_upsert_vehicle_subclass(?)"; // TODO why is this only one field? shouldn't it contain vehicle_class_id?
    const insertVehicleSubclassResponse = await query(insertVehicleSubclassQuery, toVehicleSubClassTemplateVariables(techRecord));
    return insertVehicleSubclassResponse.results.insertId;
};
