import {DynamoDbImage} from "./dynamodb-images";
import {parseTechRecordDocument, TechRecordDocument, toVehicleTemplateVariables} from "../models/tech-record-document";
import {
    getFaxNumber,
    TechRecord,
    toMakeModelTemplateVariables,
    toTechRecordTemplateVariables,
    toVehicleClassTemplateVariables
} from "../models/tech-record";
import {toContactDetailsTemplateVariables} from "../models/applicant-details-properties";
import {toBrakesTemplateVariables} from "../models/brakes";
import {KnownOperationType} from "./operation-types";
import {generateFullUpsertSql, generatePartialUpsertSql} from "./sql-generation";
import {
    AXLE_SPACING_TABLE,
    AXLES_TABLE,
    CONTACT_DETAILS_TABLE,
    IDENTITY_TABLE,
    MAKE_MODEL_TABLE,
    MICROFILM_TABLE,
    PLATE_TABLE,
    PSV_BRAKES_TABLE,
    TECHNICAL_RECORD_TABLE,
    TYRE_TABLE,
    VEHICLE_CLASS_TABLE,
    VEHICLE_SUBCLASS_TABLE,
    VEHICLE_TABLE
} from "./table-details";
import {executeFullUpsert, executePartialUpsert} from "./sql-execution";
import {TechRecordUpsertResult} from "../models/upsert-results";

export const convertTechRecordDocument = async (operationType: KnownOperationType, image: DynamoDbImage): Promise<any> => {
    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(image);

    const sqlOperation: (techRecordDocument: TechRecordDocument) => Promise<void> = deriveSqlOperation(operationType);

    return sqlOperation(techRecordDocument);
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

const upsertTechRecords = async (techRecordDocument: TechRecordDocument): Promise<TechRecordUpsertResult[]> => {
    const vehicleId = await upsertVehicle(techRecordDocument);

    const techRecords = techRecordDocument.techRecord;

    const upsertResults: TechRecordUpsertResult[] = [];

    if (!techRecords) {
        return [];
    }

    for (const techRecord of techRecords) {
        const makeModelId = await upsertMakeModel(techRecord);
        const vehicleClassId = await upsertVehicleClass(techRecord);
        const vehicleSubclassIds = await upsertVehicleSubclasses(vehicleClassId, techRecord);
        const createdById = await upsertIdentity(techRecord.createdById!, techRecord.createdByName!);
        const lastUpdatedById = await upsertIdentity(techRecord.lastUpdatedById!, techRecord.lastUpdatedByName!);
        const contactDetailsId = await upsertContactDetails(techRecord);

        const techRecordTemplateVariables = toTechRecordTemplateVariables(techRecord);
        techRecordTemplateVariables.push(vehicleId, makeModelId, vehicleClassId, contactDetailsId, contactDetailsId, contactDetailsId, createdById, lastUpdatedById);

        const response = await executeFullUpsert(
            generateFullUpsertSql(TECHNICAL_RECORD_TABLE),
            techRecordTemplateVariables
        );

        const techRecordId = response.rows.insertId;

        const psvBrakesId = await upsertPsvBrakes(techRecordId, techRecord);
        const axleSpacingIds = await upsertAxleSpacings(techRecordId, techRecord);
        const microfilmId = await upsertMicrofilm(techRecordId, techRecord);
        const plateIds = await upsertPlates(techRecordId, techRecord);
        const axleIds = await upsertAxles(techRecordId, techRecord);

        upsertResults.push({
            vehicleId,
            techRecordId,
            makeModelId,
            vehicleClassId,
            vehicleSubclassIds,
            createdById,
            lastUpdatedById,
            contactDetailsId,
            psvBrakesId,
            axleSpacingIds,
            microfilmId,
            plateIds,
            axleIds,
        });
    }

    return upsertResults;
};

const deleteTechRecords = async (techRecordDocument: TechRecordDocument): Promise<void> => {
    // TODO
};

const upsertVehicle = async (techRecordDocument: TechRecordDocument): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(VEHICLE_TABLE),
        toVehicleTemplateVariables(techRecordDocument));

    return response.rows.insertId;
};

const upsertMakeModel = async (techRecord: TechRecord): Promise<number> => {
    const templateVariables = toMakeModelTemplateVariables(techRecord);
    templateVariables.push(null); // TODO intentional hack until we know JSON path of make-model dtpCode

    const response = await executePartialUpsert(
        generatePartialUpsertSql(MAKE_MODEL_TABLE),
        templateVariables
    );

    return response.rows.insertId;
};

const upsertVehicleClass = async (techRecord: TechRecord): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(VEHICLE_CLASS_TABLE),
        toVehicleClassTemplateVariables(techRecord)
    );

    return response.rows.insertId;
};


const upsertVehicleSubclasses = async (vehicleClassId: number, techRecord: TechRecord): Promise<number[]> => {
    if (!techRecord.vehicleSubclass) {
        return [];
    }

    const insertedIds: number[] = [];

    for (const vehicleSubclass of techRecord.vehicleSubclass) {
        const response = await executePartialUpsert(
            generatePartialUpsertSql(VEHICLE_SUBCLASS_TABLE),
            [
                vehicleClassId,
                vehicleSubclass
            ]
        );
        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
};

const upsertIdentity = async (id: string, name: string): Promise<number> => {
    const response = await executePartialUpsert(generatePartialUpsertSql(IDENTITY_TABLE), [id, name]);
    return response.rows.insertId;
};

const upsertContactDetails = async (techRecord: TechRecord): Promise<number> => {
    const contactDetailsTemplateVariables = toContactDetailsTemplateVariables(techRecord.applicantDetails!); // TODO check nullity
    contactDetailsTemplateVariables.push(getFaxNumber(techRecord));

    const response = await executePartialUpsert(
        generatePartialUpsertSql(CONTACT_DETAILS_TABLE),
        contactDetailsTemplateVariables
    );

    return response.rows.insertId;
};

const upsertPsvBrakes = async (techRecordId: string, techRecord: TechRecord): Promise<number> => {
    const brakesTemplateVariables = toBrakesTemplateVariables(techRecord.brakes!);
    brakesTemplateVariables.unshift(techRecordId);

    const response = await executeFullUpsert(generateFullUpsertSql(PSV_BRAKES_TABLE), brakesTemplateVariables);
    return response.rows.insertId;
};

const upsertAxleSpacings = async (techRecordId: string, techRecord: TechRecord): Promise<number[]> => {
    if (!techRecord.dimensions?.axleSpacing) {
        return [];
    }

    const insertedIds: number[] = [];

    for (const axleSpacing of techRecord.dimensions.axleSpacing) {
        const response = await executeFullUpsert(
            generateFullUpsertSql(AXLE_SPACING_TABLE),
            [
                techRecordId,
                axleSpacing.axles,
                axleSpacing.value,
            ]
        );
        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
};

const upsertMicrofilm = async (techRecordId: string, techRecord: TechRecord): Promise<number> => {
    const response = await executeFullUpsert(
        generateFullUpsertSql(MICROFILM_TABLE),
        [
            techRecordId,
            techRecord.microfilm?.microfilmDocumentType,
            techRecord.microfilm?.microfilmRollNumber,
            techRecord.microfilm?.microfilmSerialNumber
        ]
    );

    return response.rows.insertId;
};

const upsertPlates = async (techRecordId: any, techRecord: TechRecord): Promise<number[]> => {
    if (!techRecord.plates) {
        return [];
    }

    const insertedIds: number[] = [];

    for (const plate of techRecord.plates) {
        const response = await executeFullUpsert(
            generateFullUpsertSql(PLATE_TABLE),
            [
                techRecordId,
                plate.plateSerialNumber,
                plate.plateIssueDate,
                plate.plateReasonForIssue,
                plate.plateIssuer,
            ]
        );
        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
};

const upsertAxles = async (techRecordId: any, techRecord: TechRecord): Promise<number[]> => {
    if (!techRecord.axles) {
        return [];
    }

    const insertedIds: number[] = [];

    for (const axle of techRecord.axles) {
        const tyreUpsertResponse = await executePartialUpsert(
            generatePartialUpsertSql(TYRE_TABLE),
            [
                axle.tyres?.tyreSize,
                axle.tyres?.plyRating,
                axle.tyres?.fitmentCode,
                axle.tyres?.dataTrAxles,
                axle.tyres?.speedCategorySymbol,
                axle.tyres?.tyreCode,
            ]
        );

        const tyreId = tyreUpsertResponse.rows.insertId;

        const axleUpsertResponse = await executeFullUpsert(
            generateFullUpsertSql(AXLES_TABLE),
            [
                techRecordId,
                tyreId,
                axle.axleNumber,
                axle.parkingBrakeMrk,
                axle.weights?.kerbWeight,
                axle.weights?.ladenWeight,
                axle.weights?.gbWeight,
                axle.weights?.eecWeight,
                axle.weights?.designWeight,
                axle.brakes?.brakeActuator,
                axle.brakes?.leverLength,
                axle.brakes?.springBrakeParking,
            ]
        );
        insertedIds.push(axleUpsertResponse.rows.insertId);
    }

    return insertedIds;
};
