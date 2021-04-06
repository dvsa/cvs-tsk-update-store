import {DynamoDbImage} from "./dynamodb-images";
import {parseTechRecordDocument, TechRecordDocument} from "../models/tech-record-document";
import {getFaxNumber, TechRecord} from "../models/tech-record";
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
            ]
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
        [
            techRecordDocument.systemNumber,
            techRecordDocument.vin,
            techRecordDocument.primaryVrm,
            techRecordDocument.trailerId,
        ]
    );

    return response.rows.insertId;
};

const upsertMakeModel = async (techRecord: TechRecord): Promise<number> => {
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
        ]
    );

    return response.rows.insertId;
};

const upsertVehicleClass = async (techRecord: TechRecord): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(VEHICLE_CLASS_TABLE),
        [
            techRecord.vehicleClass?.code,
            techRecord.vehicleClass?.description,
            techRecord.vehicleType,
            techRecord.vehicleSize,
            techRecord.vehicleConfiguration,
            techRecord.euVehicleCategory,
        ]
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
    const response = await executePartialUpsert(
        generatePartialUpsertSql(IDENTITY_TABLE),
        [
            id,
            name
        ]
    );
    return response.rows.insertId;
};

const upsertContactDetails = async (techRecord: TechRecord): Promise<number> => {
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
        ]
    );

    return response.rows.insertId;
};

const upsertPsvBrakes = async (techRecordId: string, techRecord: TechRecord): Promise<number> => {
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
        ]
    );

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
