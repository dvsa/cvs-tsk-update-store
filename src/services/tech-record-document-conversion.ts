import {parseTechRecordDocument, TechRecordDocument} from "../models/tech-record-document";
import {getFaxNumber, TechRecord} from "../models/tech-record";
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
import {getConnectionPool} from "./connection-pool";
import {Connection} from "mysql2/promise";
import {EntityConverter} from "./entity-converters";

export const techRecordDocumentConverter = (): EntityConverter<TechRecordDocument> => {
    return {
        parseRootImage: parseTechRecordDocument,
        upsertEntity: upsertTechRecords,
        deleteEntity: deleteTechRecords
    };
};

const upsertTechRecords = async (techRecordDocument: TechRecordDocument): Promise<TechRecordUpsertResult[]> => {
    const pool = await getConnectionPool();

    let vehicleId;
    const vehicleConnection = await pool.getConnection();

    try {
        await vehicleConnection.beginTransaction();

        vehicleId = await upsertVehicle(vehicleConnection, techRecordDocument);

        await vehicleConnection.commit();
    } catch (err) {
        console.error(err);
        await vehicleConnection.rollback();
        throw err;
    }

    const techRecords = techRecordDocument.techRecord;

    const upsertResults: TechRecordUpsertResult[] = [];

    if (!techRecords) {
        return [];
    }

    for (const techRecord of techRecords) {
        const techRecordConnection = await pool.getConnection();

        try {
            await techRecordConnection.beginTransaction();

            const makeModelId = await upsertMakeModel(techRecordConnection, techRecord);
            const vehicleClassId = await upsertVehicleClass(techRecordConnection, techRecord);
            const vehicleSubclassIds = await upsertVehicleSubclasses(techRecordConnection, vehicleClassId, techRecord);
            const createdById = await upsertIdentity(techRecordConnection, techRecord.createdById!, techRecord.createdByName!);
            const lastUpdatedById = await upsertIdentity(techRecordConnection, techRecord.lastUpdatedById!, techRecord.lastUpdatedByName!);
            const contactDetailsId = await upsertContactDetails(techRecordConnection, techRecord);

            const response = await executeFullUpsert(
                generateFullUpsertSql(TECHNICAL_RECORD_TABLE),
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
                    techRecord.frontAxleTo5thWheelCouplingMin,
                    techRecord.frontAxleTo5thWheelCouplingMax,
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

            const psvBrakesId = await upsertPsvBrakes(techRecordConnection, techRecordId, techRecord);
            const axleSpacingIds = await upsertAxleSpacings(techRecordConnection, techRecordId, techRecord);
            const microfilmId = await upsertMicrofilm(techRecordConnection, techRecordId, techRecord);
            const plateIds = await upsertPlates(techRecordConnection, techRecordId, techRecord);
            const axleIds = await upsertAxles(techRecordConnection, techRecordId, techRecord);

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
        }
    }

    return upsertResults;
};

const deleteTechRecords = async (techRecordDocument: TechRecordDocument): Promise<void> => {
    // TODO
};

const upsertVehicle = async (connection: Connection, techRecordDocument: TechRecordDocument): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(VEHICLE_TABLE),
        [
            techRecordDocument.systemNumber,
            techRecordDocument.vin,
            techRecordDocument.primaryVrm,
            techRecordDocument.trailerId,
        ],
        connection
    );

    return response.rows.insertId;
};

const upsertMakeModel = async (connection: Connection, techRecord: TechRecord): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(MAKE_MODEL_TABLE),
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
            null // TODO intentional hack until we know JSON path of make-model dtpCode
        ],
        connection
    );

    return response.rows.insertId;
};

const upsertVehicleClass = async (connection: Connection, techRecord: TechRecord): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(VEHICLE_CLASS_TABLE),
        [
            techRecord.vehicleClass?.code,
            techRecord.vehicleClass?.description,
            techRecord.vehicleType,
            techRecord.vehicleSize,
            techRecord.vehicleConfiguration,
            techRecord.euVehicleCategory,
        ],
        connection
    );

    return response.rows.insertId;
};

const upsertVehicleSubclasses = async (connection: Connection, vehicleClassId: number, techRecord: TechRecord): Promise<number[]> => {
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
            ],
            connection
        );
        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
};

const upsertIdentity = async (connection: Connection, id: string, name: string): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(IDENTITY_TABLE),
        [
            id,
            name
        ],
        connection
    );
    return response.rows.insertId;
};

const upsertContactDetails = async (connection: Connection, techRecord: TechRecord): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(CONTACT_DETAILS_TABLE),
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
        ],
        connection
    );

    return response.rows.insertId;
};

const upsertPsvBrakes = async (connection: Connection, techRecordId: string, techRecord: TechRecord): Promise<number> => {
    const response = await executeFullUpsert(
        generateFullUpsertSql(PSV_BRAKES_TABLE),
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

    return response.rows.insertId;
};

const upsertAxleSpacings = async (connection: Connection, techRecordId: string, techRecord: TechRecord): Promise<number[]> => {
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
            ],
            connection
        );
        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
};

const upsertMicrofilm = async (connection: Connection, techRecordId: string, techRecord: TechRecord): Promise<number> => {
    const response = await executeFullUpsert(
        generateFullUpsertSql(MICROFILM_TABLE),
        [
            techRecordId,
            techRecord.microfilm?.microfilmDocumentType,
            techRecord.microfilm?.microfilmRollNumber,
            techRecord.microfilm?.microfilmSerialNumber
        ],
        connection
    );

    return response.rows.insertId;
};

const upsertPlates = async (connection: Connection, techRecordId: any, techRecord: TechRecord): Promise<number[]> => {
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
            ],
            connection
        );
        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
};

const upsertAxles = async (connection: Connection, techRecordId: any, techRecord: TechRecord): Promise<number[]> => {
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
            ],
            connection
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
            ],
            connection
        );
        insertedIds.push(axleUpsertResponse.rows.insertId);
    }

    return insertedIds;
};
