import {KnownOperationType} from "./operation-types";
import {DynamoDbImage} from "./dynamodb-images";
import {parseTestResults, TestResult, TestResults} from "../models/test-results";
import {execute} from "./connection-pool";
import {toVehicleTemplateVariables} from "../models/tech-record-document";
import {TestType} from "../models/test-types";
import {generatePartialUpsertSql} from "./sql-generation";
import {
    CUSTOM_DEFECT_TABLE,
    DEFECTS_TABLE,
    FUEL_EMISSION_TABLE,
    IDENTITY_TABLE,
    LOCATION_TABLE,
    PREPARER_TABLE,
    TEST_DEFECT_TABLE,
    TEST_STATION_TABLE,
    TEST_TYPE_TABLE,
    TESTER_TABLE,
    VEHICLE_CLASS_TABLE
} from "./table-details";

export const convertTestResults = async (operationType: KnownOperationType, image: DynamoDbImage): Promise<void> => {
    const testResults: TestResults = parseTestResults(image);

    const sqlOperation: (testResults: TestResults) => Promise<void> = deriveSqlOperation(operationType);

    await sqlOperation(testResults);
};

const deriveSqlOperation = (operationType: KnownOperationType): ((testResults: TestResults) => Promise<any>) => {
    switch (operationType) {
        case "INSERT":
        case "UPDATE":
            return upsertTestResults;
        case "DELETE":
            return deleteTestResults;
    }
};

const upsertTestResults = async (testResults: TestResults): Promise<number[]> => {
    if (!testResults) {
        return [];
    }

    const insertedIds: number[] = [];

    for (const testResult of testResults) {
        validateTestResult(testResult);

        const vehicleId = await upsertVehicle(testResult);
        const testStationId = await upsertTestStation(testResult);
        const testerId = await upsertTester(testResult);
        const vehicleClassId = await upsertVehicleClass(testResult);
        // TODO vehicle subclass - not clear on insert procedure here
        const preparerId = await upsertPreparer(testResult);
        const createdById = await upsertIdentity(testResult.createdById!, testResult.createdByName!);
        const lastUpdatedById = await upsertIdentity(testResult.lastUpdatedById!, testResult.lastUpdatedByName!);

        for (const testType of testResult.testTypes!) {
            const fuelEmissionId = await upsertFuelEmission(testType);
            const testTypeId = await upsertTestType(testType);

            const insertTestResultQuery = "INSERT INTO test_result (testStatus, reasonForCancellation, numberOfSeats, odometerReading, odometerReadingUnits, countryOfRegistration, noOfAxles, regnDate, firstUseDate, createdAt, lastUpdatedAt, testCode, testNumber, certificateNumber, secondaryCertificateNumber, testExpiryDate, testAnniversaryDate, testTypeStartTimestamp, testTypeEndTimestamp, numberOfSeatbeltsFitted, lastSeatbeltInstallationCheckDate, seatbeltInstallationCheckDate, testResult, reasonForAbandoning, additionalNotesRecorded, additionalCommentsForAbandon, particulateTrapFitted, particulateTrapSerialNumber, modificationTypeUsed, smokeTestKLimitApplied, vehicle_id, test_station_id, tester_id, vehicle_class_id, preparer_id, createdBy_Id, lastUpdatedBy_Id, fuel_emission_id, test_type_id ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)"; // TODO
            const testResultTemplateVariables: any[] = [
                testResult.testStatus,
                testResult.reasonForCancellation,
                testResult.numberOfSeats,
                testResult.odometerReading,
                testResult.odometerReadingUnits,
                testResult.countryOfRegistration,
                testResult.noOfAxles,
                testResult.regnDate,
                testResult.firstUseDate,
                testResult.createdAt,
                testResult.lastUpdatedAt,
                testType.testCode,
                testType.testNumber,
                testType.certificateNumber,
                testType.secondaryCertificateNumber,
                testType.testExpiryDate,
                testType.testAnniversaryDate,
                testType.testTypeStartTimestamp,
                testType.testTypeEndTimestamp,
                testType.numberOfSeatbeltsFitted,
                testType.lastSeatbeltInstallationCheckDate,
                testType.seatbeltInstallationCheckDate,
                testType.testResult,
                testType.reasonForAbandoning,
                testType.additionalNotesRecorded,
                testType.additionalCommentsForAbandon,
                testType.particulateTrapFitted,
                testType.particulateTrapSerialNumber,
                testType.modificationTypeUsed,
                testType.smokeTestKLimitApplied,
            ];
            testResultTemplateVariables.push(vehicleId, testStationId, testerId, vehicleClassId, preparerId, createdById, lastUpdatedById, fuelEmissionId, testTypeId);

            await execute(insertTestResultQuery, testResultTemplateVariables);

            const testResultId = (await execute("SELECT LAST_INSERT_ID() AS testResultId")).rows[0].testResultId;

            await upsertDefects(testResultId, testType);
            await upsertCustomDefects(testResultId, testType);

            insertedIds.push(testResultId);
        }
    }

    return insertedIds;
};

const deleteTestResults = async (testResult: TestResults): Promise<void> => {
    // TODO
};

const upsertVehicle = async (testResult: TestResult): Promise<number> => {
    const insertVehicleQuery = "INSERT INTO vehicle (system_number, vin, vrm_trm, trailer_id, createdAt) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)";

    await execute(insertVehicleQuery, toVehicleTemplateVariables(testResult)); // TODO

    return (await execute("SELECT LAST_INSERT_ID() AS vehicleId")).rows[0].vehicleId;
};

const upsertTestStation = async (testResult: TestResult): Promise<number> => {
    const response = await execute(
        generatePartialUpsertSql(TEST_STATION_TABLE),
        [
            testResult.testStationPNumber,
            testResult.testStationName,
            testResult.testStationType
        ]
    );
    return response.rows.insertId;
};

const upsertTester = async (testResult: TestResult): Promise<number> => {
    const response = await execute(
        generatePartialUpsertSql(TESTER_TABLE),
        [
            testResult.testerStaffId,
            testResult.testerName,
            testResult.testerEmailAddress,
        ]
    );
    return response.rows.insertId;
};

const upsertVehicleClass = async (testResult: TestResult): Promise<number> => {
    const response = await execute(
        generatePartialUpsertSql(VEHICLE_CLASS_TABLE),
        [
            testResult.vehicleClass?.code,
            testResult.vehicleClass?.description,
            testResult.vehicleType,
            testResult.vehicleSize,
            testResult.vehicleConfiguration,
            testResult.euVehicleCategory,
        ]
    );
    return response.rows.insertId;
};

const upsertFuelEmission = async (testType: TestType): Promise<number> => {
    const response = await execute(
        generatePartialUpsertSql(FUEL_EMISSION_TABLE),
        [
            testType.modType!.code,
            testType.modType!.description,
            testType.emissionStandard,
            testType.fuelType,
        ]
    );
    return response.rows.insertId;
};

const upsertTestType = async (testType: TestType): Promise<number> => {
    const response = await execute(
        generatePartialUpsertSql(TEST_TYPE_TABLE),
        [
            testType.testTypeClassification,
            testType.testTypeName,
        ]
    );
    return response.rows.insertId;
};

const upsertPreparer = async (testResult: TestResult): Promise<number> => {
    const response = await execute(
        generatePartialUpsertSql(PREPARER_TABLE),
        [
            testResult.preparerId,
            testResult.preparerName,
        ]
    );
    return response.rows.insertId;
};

const upsertIdentity = async (id: string, name: string): Promise<number> => {
    const response = await execute(
        generatePartialUpsertSql(IDENTITY_TABLE),
        [
            id,
            name
        ]
    );
    return response.rows.insertId;
};

const upsertDefects = async (testResultId: number, testType: TestType): Promise<void> => {
    if (!testType.defects) {
        return;
    }

    for (const defect of testType.defects) {
        const insertDefectResponse = await execute(
            generatePartialUpsertSql(DEFECTS_TABLE),
            [
                defect.imNumber,
                defect.imDescription,
                defect.itemNumber,
                defect.itemDescription,
                defect.deficiencyRef,
                defect.deficiencyId,
                defect.deficiencySubId,
                defect.deficiencyCategory,
                defect.deficiencyText,
                defect.stdForProhibition,
            ]
        );

        const defectId = insertDefectResponse.rows.insertId;

        const insertLocationResponse = await execute(
            generatePartialUpsertSql(LOCATION_TABLE),
            [
                defect.additionalInformation?.location?.vertical,
                defect.additionalInformation?.location?.horizontal,
                defect.additionalInformation?.location?.lateral,
                defect.additionalInformation?.location?.longitudinal,
                defect.additionalInformation?.location?.rowNumber,
                defect.additionalInformation?.location?.seatNumber,
                defect.additionalInformation?.location?.axleNumber,
            ]
        );

        const locationId = insertLocationResponse.rows.insertId;

        await execute(
            generatePartialUpsertSql(TEST_DEFECT_TABLE),
            [
                testResultId,
                defectId,
                locationId,
                defect.additionalInformation?.notes,
                defect.prs,
                defect.prohibitionIssued,
            ]
        );
    }
};

const upsertCustomDefects = async (testResultId: number, testType: TestType): Promise<void> => {
    if (!testType.customDefects) {
        return;
    }

    for (const customDefect of testType.customDefects) {
        await execute(
            generatePartialUpsertSql(CUSTOM_DEFECT_TABLE),
            [
                testResultId,
                customDefect.referenceNumber,
                customDefect.defectName,
                customDefect.defectNotes,
            ]
        );
    }
};

const validateTestResult = (testResult: TestResult): void => {
    if (!testResult) {
        throw new Error(`testResult cannot be null`);
    }
    if (!testResult.testTypes) {
        throw new Error(`missing required field testResult.testTypes`);
    }
    if (testResult.testTypes.length < 1) {
        throw new Error(`array testResult.testTypes must contain at least 1 element`);
    }
};
