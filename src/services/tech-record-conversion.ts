import {DynamoDbImage} from "./dynamodb-images";
import {parseTechRecordDocument, TechRecordDocument, toVehicleTemplateVariables} from "../models/tech-record-document";
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
import {execute} from "./connection-pool";

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
        const makeModelId = await upsertMakeModel(techRecord);
        const vehicleClassId = await upsertVehicleClass(techRecord);
        const contactDetailsId = await upsertContactDetails(techRecord);
        const createdById = await upsertIdentity(techRecord.createdById!, techRecord.createdByName!);
        const lastUpdatedById = await upsertIdentity(techRecord.lastUpdatedById!, techRecord.lastUpdatedByName!);

        const insertTechRecordQuery = "INSERT INTO technical_record (recordCompleteness, createdAt, lastUpdatedAt, functionCode, offRoad, numberOfWheelsDriven, emissionsLimit, departmentalVehicleMarker, alterationMarker, variantVersionNumber, grossEecWeight, trainEecWeight, maxTrainEecWeight, manufactureYear, regnDate, firstUseDate, coifDate, ntaNumber, coifSerialNumber, coifCertifierName, approvalType, approvalTypeNumber, variantNumber, conversionRefNo, seatsLowerDeck, seatsUpperDeck, standingCapacity, speedRestriction, speedLimiterMrk, tachoExemptMrk, dispensations, remarks, reasonForCreation, statusCode, unladenWeight, grossKerbWeight, grossLadenWeight, grossGbWeight, grossDesignWeight, trainGbWeight, trainDesignWeight, maxTrainGbWeight, maxTrainDesignWeight, maxLoadOnCoupling, frameDescription, tyreUseCode, roadFriendly, drawbarCouplingFitted, euroStandard, suspensionType, couplingType, length, height, width, frontAxleTo5thWheelMin, frontAxleTo5thWheelMax, frontAxleTo5thWheelCouplingMin, frontAxleTo5thWheelCouplingMax, frontAxleToRearAxle, rearAxleToRearTrl, couplingCenterToRearAxleMin, couplingCenterToRearAxleMax, couplingCenterToRearTrlMin, couplingCenterToRearTrlMax, centreOfRearmostAxleToRearOfTrl, notes, purchaserNotes, manufacturerNotes, noOfAxles, brakeCode, brakes_dtpNumber, brakes_loadSensingValve, brakes_antilockBrakingSystem, updateType, numberOfSeatbelts, seatbeltInstallationApprovalDate, vehicle_id, make_model_id, vehicle_class_id, applicant_detail_id, purchaser_detail_id, manufacturer_detail_id, createdBy_Id, lastUpdatedBy_Id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const techRecordTemplateVariables = toTechRecordTemplateVariables(techRecord);
        techRecordTemplateVariables.push(vehicleId, makeModelId, vehicleClassId, contactDetailsId, contactDetailsId, contactDetailsId, createdById, lastUpdatedById);

        await execute(insertTechRecordQuery, techRecordTemplateVariables);

        const techRecordId = (await execute("SELECT LAST_INSERT_ID() AS techRecordId")).rows[0].techRecordId;
        const brakesId = await upsertBrakes(techRecordId, techRecord);
        // const vehicleSubclassId = await upsertVehicleSubclass(techRecord);

        insertedIds.push(techRecordId);
    }

    return insertedIds;
};

const deleteTechRecords = async (techRecordDocument: TechRecordDocument): Promise<void> => {
    // TODO
};

const upsertVehicle = async (techRecordDocument: TechRecordDocument): Promise<number> => {
    const insertVehicleQuery = "INSERT INTO vehicle (system_number, vin, vrm_trm, trailer_id, createdAt) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)";

    await execute(insertVehicleQuery, toVehicleTemplateVariables(techRecordDocument));

    return (await execute("SELECT LAST_INSERT_ID() AS vehicleId")).rows[0].vehicleId;
};

const upsertMakeModel = async (techRecord: TechRecord): Promise<number> => {
    const insertMakeModelQuery = "SELECT f_upsert_make_model(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) AS makeModelId";
    const templateVariables = toMakeModelTemplateVariables(techRecord);
    templateVariables.push(null); // TODO intentional hack until we know JSON path of make-model dtpCode
    const insertMakeModelResponse = await execute(insertMakeModelQuery, templateVariables);
    return insertMakeModelResponse.rows[0].makeModelId;
};

const upsertVehicleClass = async (techRecord: TechRecord): Promise<number> => {
    const insertVehicleClassQuery = "SELECT f_upsert_vehicle_class(?, ?, ?, ?, ?, ?) AS vehicleClassId";
    const insertVehicleClassResponse = await execute(insertVehicleClassQuery, toVehicleClassTemplateVariables(techRecord));
    return insertVehicleClassResponse.rows[0].vehicleClassId;
};

const upsertContactDetails = async (techRecord: TechRecord): Promise<number> => {
    const insertContactDetailsQuery = "SELECT f_upsert_contact_details(?, ?, ?, ?, ?, ?, ?, ?, ?) AS contactDetailsId";
    const contactDetailsTemplateVariables = toContactDetailsTemplateVariables(techRecord.applicantDetails!); // TODO check nullity
    contactDetailsTemplateVariables.push(getFaxNumber(techRecord));
    const insertContactDetailsResponse = await execute(insertContactDetailsQuery, contactDetailsTemplateVariables);
    return insertContactDetailsResponse.rows[0].contactDetailsId;
};

const upsertIdentity = async (id: string, name: string): Promise<number> => {
    // TODO check nullity
    const insertIdentityQuery = "SELECT f_upsert_identity(?, ?) AS identityId";
    const insertIdentityResponse = await execute(insertIdentityQuery, [id, name]);
    return insertIdentityResponse.rows[0].identityId;
};

const upsertBrakes = async (techRecordId: string, techRecord: TechRecord): Promise<number> => {
    const insertBrakesQuery = "INSERT INTO psv_brakes (technical_record_id, brakeCodeOriginal, brakeCode, dataTrBrakeOne, dataTrBrakeTwo, dataTrBrakeThree, retarderBrakeOne, retarderBrakeTwo, serviceBrakeForceA, secondaryBrakeForceA, parkingBrakeForceA, serviceBrakeForceB, secondaryBrakeForceB, parkingBrakeForceB) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const brakesTemplateVariables = toBrakesTemplateVariables(techRecord.brakes!);
    brakesTemplateVariables.unshift(techRecordId);
    await execute(insertBrakesQuery, brakesTemplateVariables); // TODO check nullity
    return (await execute("SELECT LAST_INSERT_ID() AS brakesId")).rows[0].brakesId;
};

const upsertVehicleSubclass = async (techRecord: TechRecord): Promise<number> => {
    const insertVehicleSubclassQuery = "SELECT f_upsert_vehicle_subclass(?) AS vehicleSubclassId"; // TODO why is this only one field? shouldn't it contain vehicle_class_id?
    const insertVehicleSubclassResponse = await execute(insertVehicleSubclassQuery, toVehicleSubClassTemplateVariables(techRecord));
    return insertVehicleSubclassResponse.rows[0].vehicleSubclassId;
};
