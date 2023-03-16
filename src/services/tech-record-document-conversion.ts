import {parseTechRecordDocument, TechRecordDocument} from "../models/tech-record-document";
import {getFaxNumber, TechRecord} from "../models/tech-record";
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
    VEHICLE_TABLE,
    AUTH_INTO_SERVICE_TABLE
} from "./table-details";
import {deleteBasedOnWhereIn, executeFullUpsert, executePartialUpsertIfNotExists} from "./sql-execution";
import {TechRecordUpsertResult} from "../models/upsert-results";
import {getConnectionPool} from "./connection-pool";
import {Connection} from "mysql2/promise";
import {EntityConverter} from "./entity-conversion";
import {debugLog} from "./logger";
import { vinCleanser } from "../utils/cleanser";

export const techRecordDocumentConverter = (): EntityConverter<TechRecordDocument> => {
    return {
        parseRootImage: parseTechRecordDocument,
        upsertEntity: upsertTechRecords,
        deleteEntity: deleteTechRecords
    };
};

const upsertTechRecords = async (techRecordDocument: TechRecordDocument): Promise<TechRecordUpsertResult[]> => {
    debugLog(`upsertTechRecords: START`);

    const pool = await getConnectionPool();

    let vehicleId;
    const vehicleConnection = await pool.getConnection();

    try {
        await vehicleConnection.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED");
        await vehicleConnection.beginTransaction();

        vehicleId = await upsertVehicle(vehicleConnection, techRecordDocument);

        await vehicleConnection.commit();
    } catch (err) {
        console.error(err);
        await vehicleConnection.rollback();
        throw err;
    } finally {
        vehicleConnection.release();
    }

    const techRecords = techRecordDocument.techRecord;

    const upsertResults: TechRecordUpsertResult[] = [];

    if (!techRecords) {
        return [];
    }

    debugLog(`upsertTechRecords: ${techRecords.length} tech records to upsert`);

    for (const techRecord of techRecords) {
        const techRecordConnection = await pool.getConnection();

        try {
            await techRecordConnection.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED");

            debugLog(`upsertTechRecords: Upserting tech record...`);

            const makeModelId = await upsertMakeModel(techRecordConnection, techRecord);
            const vehicleClassId = await upsertVehicleClass(techRecordConnection, techRecord);
            const vehicleSubclassIds = await upsertVehicleSubclasses(techRecordConnection, vehicleClassId, techRecord);
            const createdById = await upsertIdentity(techRecordConnection, techRecord.createdById!, techRecord.createdByName!);
            const lastUpdatedById = await upsertIdentity(techRecordConnection, techRecord.lastUpdatedById!, techRecord.lastUpdatedByName!);
            const contactDetailsId = await upsertContactDetails(techRecordConnection, techRecord);

            await techRecordConnection.beginTransaction();

            const response = await executeFullUpsert(
                TECHNICAL_RECORD_TABLE,
                [
                    vehicleId,
                    techRecord.recordCompleteness,
                    techRecord.createdAt,
                    techRecord.lastUpdatedAt,
                    makeModelId,
                    techRecord.functionCode,
                    techRecord.offRoad,
                    techRecord.numberOfWheelsDriven,
                    "" + techRecord.emissionsLimit,
                    techRecord.departmentalVehicleMarker,
                    techRecord.alterationMarker,
                    vehicleClassId,
                    techRecord.variantVersionNumber,
                    techRecord.grossEecWeight,
                    techRecord.trainEecWeight,
                    techRecord.maxTrainEecWeight,
                    contactDetailsId,
                    contactDetailsId,
                    contactDetailsId,
                    techRecord.manufactureYear,
                    techRecord.regnDate,
                    techRecord.firstUseDate,
                    techRecord.coifDate,
                    techRecord.ntaNumber,
                    techRecord.coifSerialNumber,
                    techRecord.coifCertifierName,
                    techRecord.approvalType,
                    techRecord.approvalTypeNumber,
                    techRecord.variantNumber,
                    techRecord.conversionRefNo,
                    techRecord.seatsLowerDeck,
                    techRecord.seatsUpperDeck,
                    techRecord.standingCapacity,
                    techRecord.speedRestriction,
                    techRecord.speedLimiterMrk,
                    techRecord.tachoExemptMrk,
                    techRecord.dispensations,
                    techRecord.remarks,
                    techRecord.reasonForCreation,
                    techRecord.statusCode,
                    techRecord.unladenWeight,
                    techRecord.grossKerbWeight,
                    techRecord.grossLadenWeight,
                    techRecord.grossGbWeight,
                    techRecord.grossDesignWeight,
                    techRecord.trainGbWeight,
                    techRecord.trainDesignWeight,
                    techRecord.maxTrainGbWeight,
                    techRecord.maxTrainDesignWeight,
                    techRecord.maxLoadOnCoupling,
                    techRecord.frameDescription,
                    techRecord.tyreUseCode,
                    techRecord.roadFriendly,
                    techRecord.drawbarCouplingFitted,
                    techRecord.euroStandard,
                    techRecord.suspensionType,
                    techRecord.couplingType,
                    techRecord.dimensions?.length,
                    techRecord.dimensions?.height,
                    techRecord.dimensions?.width,
                    techRecord.frontAxleTo5thWheelMin,
                    techRecord.frontAxleTo5thWheelMax,
                    techRecord.frontVehicleTo5thWheelCouplingMin,
                    techRecord.frontVehicleTo5thWheelCouplingMax,
                    techRecord.frontAxleToRearAxle,
                    techRecord.rearAxleToRearTrl,
                    techRecord.couplingCenterToRearAxleMin,
                    techRecord.couplingCenterToRearAxleMax,
                    techRecord.couplingCenterToRearTrlMin,
                    techRecord.couplingCenterToRearTrlMax,
                    techRecord.centreOfRearmostAxleToRearOfTrl,
                    techRecord.notes,
                    techRecord.purchaserDetails?.purchaserNotes,
                    techRecord.manufacturerDetails?.manufacturerNotes,
                    techRecord.noOfAxles,
                    techRecord.brakeCode,
                    techRecord.brakes?.dtpNumber,
                    techRecord.brakes?.loadSensingValve,
                    techRecord.brakes?.antilockBrakingSystem,
                    createdById,
                    lastUpdatedById,
                    techRecord.updateType,
                    techRecord.numberOfSeatbelts,
                    techRecord.seatbeltInstallationApprovalDate,
                ],
                techRecordConnection
            );

            const techRecordId = response.rows.insertId;

            debugLog(`upsertTechRecords: Upserted tech record (ID: ${techRecordId})`);

            const psvBrakesId = await upsertPsvBrakes(techRecordConnection, techRecordId, techRecord);
            const axleSpacingIds = await upsertAxleSpacings(techRecordConnection, techRecordId, techRecord);
            const microfilmId = await upsertMicrofilm(techRecordConnection, techRecordId, techRecord);
            const plateIds = await upsertPlates(techRecordConnection, techRecordId, techRecord);
            const axleIds = await upsertAxles(techRecordConnection, techRecordId, techRecord);
            await upsertAuthIntoService(techRecordConnection, techRecordId, techRecord);

            await techRecordConnection.commit();

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
        } catch (err) {
            console.error(err);
            await techRecordConnection.rollback();
            throw err;
        } finally {
            techRecordConnection.release();
        }
    }

    debugLog(`upsertTechRecords: END`);

    return upsertResults;
};

const deleteTechRecords = async (techRecordDocument: TechRecordDocument): Promise<void> => {
    throw new Error("deleting tech record documents is not implemented yet");
};

const upsertVehicle = async (connection: Connection, techRecordDocument: TechRecordDocument): Promise<number> => {
    debugLog(`upsertTechRecords: Upserting vehicle...`);

    const response = await executeFullUpsert(
        VEHICLE_TABLE,
        [
            techRecordDocument.systemNumber,
            vinCleanser(techRecordDocument.vin),
            techRecordDocument.primaryVrm,
            techRecordDocument.trailerId,
            new Date().toISOString().substring(0, 23)
        ],
        connection
    );

    debugLog(`upsertTechRecords: Upserted vehicle (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertMakeModel = async (connection: Connection, techRecord: TechRecord): Promise<number> => {
    debugLog(`upsertTechRecords: Upserting make-model...`);

    const response = await executePartialUpsertIfNotExists(
        MAKE_MODEL_TABLE,
        [
            techRecord.make,
            techRecord.model,
            techRecord.chassisMake,
            techRecord.chassisModel,
            techRecord.bodyMake,
            techRecord.bodyModel,
            techRecord.modelLiteral,
            techRecord.bodyType?.code,
            techRecord.bodyType?.description,
            techRecord.fuelPropulsionSystem,
            null // intentional hack until JSON path of make-model dtpCode is documented
        ].fingerprintCleanser(),
        connection
    );

    debugLog(`upsertTechRecords: Upserted make-model (ID ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertVehicleClass = async (connection: Connection, techRecord: TechRecord): Promise<number> => {
    debugLog(`upsertTechRecords: Upserting vehicle class...`);

    const response = await executePartialUpsertIfNotExists(
        VEHICLE_CLASS_TABLE,
        [
            techRecord.vehicleClass?.code,
            techRecord.vehicleClass?.description,
            techRecord.vehicleType,
            techRecord.vehicleSize,
            techRecord.vehicleConfiguration,
            techRecord.euVehicleCategory,
        ].fingerprintCleanser(),
        connection
    );

    debugLog(`upsertTechRecords: Upserted vehicle class (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertVehicleSubclasses = async (connection: Connection, vehicleClassId: number, techRecord: TechRecord): Promise<number[]> => {
    debugLog(`upsertTechRecords: Upserting vehicle subclasses...`);

    if (!techRecord.vehicleSubclass) {
        debugLog(`upsertTechRecords: no vehicle subclasses present`);
        return [];
    }

    const insertedIds: number[] = [];

    debugLog(`upsertTechRecords: ${techRecord.vehicleSubclass.length} vehicle subclasses to upsert`);

    for (const vehicleSubclass of techRecord.vehicleSubclass) {
        const response = await executePartialUpsertIfNotExists(
            VEHICLE_SUBCLASS_TABLE,
            [
                vehicleClassId,
                vehicleSubclass
            ].fingerprintCleanser(),
            connection
        );

        debugLog(`upsertTechRecords: Upserted vehicle subclass (ID: ${response.rows.insertId}`);

        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
};

const upsertIdentity = async (connection: Connection, id: string, name: string): Promise<number> => {
    debugLog(`upsertTechRecords: Upserting identity (${id} ---> ${name})...`);

    const response = await executePartialUpsertIfNotExists(
        IDENTITY_TABLE,
        [
            id,
            name
        ].fingerprintCleanser(),
        connection
    );

    debugLog(`upsertTechRecords: Upserted identity  (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertContactDetails = async (connection: Connection, techRecord: TechRecord): Promise<number> => {
    debugLog(`upsertTechRecords: Upserting contact details...`);

    const response = await executePartialUpsertIfNotExists(
        CONTACT_DETAILS_TABLE,
        [
            techRecord.applicantDetails?.name,
            techRecord.applicantDetails?.address1,
            techRecord.applicantDetails?.address2,
            techRecord.applicantDetails?.postTown,
            techRecord.applicantDetails?.address3,
            techRecord.applicantDetails?.postCode,
            techRecord.applicantDetails?.emailAddress,
            techRecord.applicantDetails?.telephoneNumber,
            getFaxNumber(techRecord)
        ].fingerprintCleanser(),
        connection
    );

    debugLog(`upsertTechRecords: Upserted contact details (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertPsvBrakes = async (connection: Connection, techRecordId: string, techRecord: TechRecord): Promise<number> => {
    debugLog(`upsertTechRecords: Upserting PSV brakes (tech-record-id: ${techRecordId})...`);

    const response = await executeFullUpsert(
        PSV_BRAKES_TABLE,
        [
            techRecordId,
            techRecord.brakes?.brakeCodeOriginal,
            techRecord.brakes?.brakeCode,
            techRecord.brakes?.dataTrBrakeOne,
            techRecord.brakes?.dataTrBrakeTwo,
            techRecord.brakes?.dataTrBrakeThree,
            techRecord.brakes?.retarderBrakeOne,
            techRecord.brakes?.retarderBrakeTwo,
            techRecord.brakes?.brakeForceWheelsNotLocked?.serviceBrakeForceA,
            techRecord.brakes?.brakeForceWheelsNotLocked?.secondaryBrakeForceA,
            techRecord.brakes?.brakeForceWheelsNotLocked?.parkingBrakeForceA,
            techRecord.brakes?.brakeForceWheelsUpToHalfLocked?.serviceBrakeForceB,
            techRecord.brakes?.brakeForceWheelsUpToHalfLocked?.secondaryBrakeForceB,
            techRecord.brakes?.brakeForceWheelsUpToHalfLocked?.parkingBrakeForceB,
        ],
        connection
    );

    debugLog(`upsertTechRecords: Upserted PSV brakes (tech-record-id: ${techRecordId}, ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertAxleSpacings = async (connection: Connection, techRecordId: string, techRecord: TechRecord): Promise<number[]> => {
    debugLog(`upsertTechRecords: Upserting axle spacings (tech-record-id: ${techRecordId})...`);

    if (!techRecord.dimensions?.axleSpacing) {
        debugLog(`upsertTechRecords: no axle spacings present`);
        return [];
    }

    const insertedIds: number[] = [];

    debugLog(`upsertTechRecords: ${techRecord.dimensions.axleSpacing.length} axle spacings to upsert`);

    for (const axleSpacing of techRecord.dimensions.axleSpacing) {
        const response = await executeFullUpsert(
            AXLE_SPACING_TABLE,
            [
                techRecordId,
                axleSpacing.axles,
                axleSpacing.value,
            ],
            connection
        );

        debugLog(`upsertTechRecords: Upserted axle spacing (tech-record-id: ${techRecordId}, ID: ${response.rows.insertId})`);

        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
};

const upsertMicrofilm = async (connection: Connection, techRecordId: string, techRecord: TechRecord): Promise<number> => {
    debugLog(`upsertTechRecords: Upserting microfilm (tech-record-id: ${techRecordId})...`);

    const response = await executeFullUpsert(
        MICROFILM_TABLE,
        [
            techRecordId,
            techRecord.microfilm?.microfilmDocumentType,
            techRecord.microfilm?.microfilmRollNumber,
            techRecord.microfilm?.microfilmSerialNumber
        ],
        connection
    );

    debugLog(`upsertTechRecords: Upserted microfilm (tech-record-id: ${techRecordId}, ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertPlates = async (connection: Connection, techRecordId: any, techRecord: TechRecord): Promise<number[]> => {
    debugLog(`upsertTechRecords: Upserting plates (tech-record-id: ${techRecordId})...`);

    if (!techRecord.plates) {
        debugLog(`upsertTechRecords: no plates present`);
        return [];
    }

    const insertedIds: number[] = [];

    debugLog(`upsertTechRecords: ${techRecord.plates.length} plates to upsert`);

    for (const plate of techRecord.plates) {
        const response = await executeFullUpsert(
            PLATE_TABLE,
            [
                techRecordId,
                plate.plateSerialNumber,
                plate.plateIssueDate,
                plate.plateReasonForIssue,
                plate.plateIssuer,
            ],
            connection
        );

        debugLog(`upsertTechRecords: Upserted plate (tech-record-id: ${techRecordId}, ID: ${response.rows.insertId})`);

        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
};

const upsertAxles = async (connection: Connection, techRecordId: any, techRecord: TechRecord): Promise<number[]> => {
    debugLog(`upsertTechRecords: Upserting axles (tech-record-id: ${techRecordId})...`);

    if (!techRecord.axles) {
        debugLog(`upsertTechRecords: no axles present`);
        return [];
    }

    const insertedIds: number[] = [];

    for (const axle of techRecord.axles) {
        const tyreUpsertResponse = await executePartialUpsertIfNotExists(
            TYRE_TABLE,
            [
                axle.tyres?.tyreSize,
                axle.tyres?.plyRating,
                axle.tyres?.fitmentCode,
                axle.tyres?.dataTrAxles,
                axle.tyres?.speedCategorySymbol,
                axle.tyres?.tyreCode,
            ].fingerprintCleanser(),
            connection
        );

        const tyreId = tyreUpsertResponse.rows.insertId;

        debugLog(`upsertTechRecords: Upserted axle tyre (tech-record-id: ${techRecordId}, ID: ${tyreId})`);

        const axleUpsertResponse = await executeFullUpsert(
            AXLES_TABLE,
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
            ],
            connection
        );

        debugLog(`upsertTechRecords: Upserted axle (tech-record-id: ${techRecordId}, ID: ${axleUpsertResponse.rows.insertId})`);

        insertedIds.push(axleUpsertResponse.rows.insertId);
    }

    return insertedIds;
};

const upsertAuthIntoService = async (connection: Connection, techRecordId: string, techRecord: TechRecord): Promise<void> => {
    debugLog(`upsertTechRecords: Upserting authIntoService (tech-record-id: ${techRecordId})...`);

    if (!techRecord.authIntoService) {
        debugLog(`upsertTechRecords: no authIntoService present`);
        const mooi = await deleteBasedOnWhereIn(AUTH_INTO_SERVICE_TABLE.tableName, "technical_record_id", [techRecordId], connection);
        return;
    }

    const response = await executeFullUpsert(
        AUTH_INTO_SERVICE_TABLE,
        [
            techRecordId,
            techRecord.authIntoService?.cocIssueDate,
            techRecord.authIntoService?.dateAuthorised,
            techRecord.authIntoService?.datePending,
            techRecord.authIntoService?.dateReceived,
            techRecord.authIntoService?.dateRejected,
        ],
        connection
    );

    debugLog(`upsertTechRecords: Upserted authIntoService (tech-record-id: ${techRecordId}, ID: ${response.rows.insertId})`);
};
