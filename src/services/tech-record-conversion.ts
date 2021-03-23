import {DynamoDbImage} from "./dynamodb-images";
import {parseTechRecordDocument, TechRecordDocument, toVehicleTemplateVariables} from "../models/tech-record-document";
import {query} from "./connection-pool";
import {
    getFaxNumber,
    TechRecord,
    toMakeModelTemplateVariables,
    toVehicleClassTemplateVariables
} from "../models/tech-record";
import {toContactDetailsTemplateVariables} from "../models/applicant-details-properties";
import {toBrakesTemplateVariables} from "../models/brakes";
import {KnownOperationType} from "./operation-types";

export const techRecordDocumentConverter = async (operationType: KnownOperationType, image: DynamoDbImage): Promise<void> => {
    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(image);

    const sqlOperation: (techRecordDocument: TechRecordDocument) => Promise<void> = deriveSqlOperation(operationType);

    await sqlOperation(techRecordDocument);
};

const deriveSqlOperation = (operationType: KnownOperationType): ((techRecordDocument: TechRecordDocument) => Promise<void>) => {
    switch (operationType) {
        case "INSERT":
        case "UPDATE":
            return upsertTechRecord;
        case "DELETE":
            return deleteTechRecord;
    }
};

const upsertTechRecord = async (techRecordDocument: TechRecordDocument): Promise<void> => {
    const vehicleId = await upsertVehicle(techRecordDocument);

    const techRecords = techRecordDocument.techRecord;

    for (const techRecord of techRecords) {
        const makeModelId = upsertMakeModel(techRecord);
        const vehicleClassId = upsertVehicleClass(techRecord);
        const contactDetailsId = upsertContactDetails(techRecord);
        const createdById = upsertIdentity(techRecord.createdById, techRecord.createdByName);
        const lastUpdatedById = upsertIdentity(techRecord.lastUpdatedById, techRecord.lastUpdatedByName);
        const brakesId = upsertBrakes(techRecord);

        // TODO vehicle_subclass
        // TODO technical_record
    }

    // #2 vehicle_subclass
    // #3 technical_record
};

const deleteTechRecord = async (techRecordDocument: TechRecordDocument): Promise<void> => {
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
    const contactDetailsTemplateVariables = toContactDetailsTemplateVariables(techRecord.applicantDetails);
    contactDetailsTemplateVariables.push(getFaxNumber(techRecord));
    const insertContactDetailsResponse = await query(insertContactDetailsQuery, contactDetailsTemplateVariables);
    return insertContactDetailsResponse.results.insertId;
};

const upsertIdentity = async (id: string, name: string): Promise<number> => {
    const insertIdentityQuery = "f_upsert_identity(?, ?)";
    const insertIdentityResponse = await query(insertIdentityQuery, [id, name]);
    return insertIdentityResponse.results.insertId;
};

const upsertBrakes = async (techRecord: TechRecord): Promise<number> => {
    const insertBrakesQuery = "INSERT INTO brakes (brakeCodeOriginal, brakeCode, dataTrBrakeOne, dataTrBrakeTwo, dataTrBrakeThree, retarderBrakeOne, retarderBrakeTwo, dtpNumber, loadSensingValve, antilockBrakingSystem, serviceBrakeForceA, secondaryBrakeForceA, parkingBrakeForceA, serviceBrakeForceB, secondaryBrakeForceB, parkingBrakeForceB) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); SELECT LAST_INSERT_ID();";
    const insertBrakesResponse = await query(insertBrakesQuery, toBrakesTemplateVariables(techRecord.brakes));
    return insertBrakesResponse.results[0].id;
};
