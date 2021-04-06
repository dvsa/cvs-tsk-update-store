import {KnownOperationType} from "./operation-types";
import {DynamoDbImage} from "./dynamodb-images";
import {parseTestResults, TestResult, TestResults} from "../models/test-results";
import {execute} from "./connection-pool";
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
    TEST_RESULT_TABLE,
    TEST_STATION_TABLE,
    TEST_TYPE_TABLE,
    TESTER_TABLE,
    VEHICLE_CLASS_TABLE,
    VEHICLE_TABLE
} from "./table-details";
import {executePartialUpsert} from "./sql-execution";
import {TestResultUpsertResult} from "../models/upsert-results";

export const convertTestResults = async (operationType: KnownOperationType, image: DynamoDbImage): Promise<any> => {
    const testResults: TestResults = parseTestResults(image);

    const sqlOperation: (testResults: TestResults) => Promise<void> = deriveSqlOperation(operationType);

    return sqlOperation(testResults);
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

const upsertTestResults = async (testResults: TestResults): Promise<TestResultUpsertResult[]> => {
    if (!testResults) {
        return [];
    }

    const upsertResults: TestResultUpsertResult[] = [];

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

            const response = await execute(
                generatePartialUpsertSql(TEST_RESULT_TABLE),
                [
                    vehicleId,
                    fuelEmissionId,
                    testStationId,
                    testerId,
                    preparerId,
                    vehicleClassId,
                    testTypeId,
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
                    createdById,
                    lastUpdatedById
                ]
            );

            const testResultId = response.rows.insertId;

            const defectIds = await upsertDefects(testResultId, testType);
            const customDefectIds = await upsertCustomDefects(testResultId, testType);

            upsertResults.push({
                vehicleId,
                testResultId,
                testStationId,
                testerId,
                vehicleClassId,
                preparerId,
                createdById,
                lastUpdatedById,
                fuelEmissionId,
                testTypeId,
                defectIds,
                customDefectIds,
            });
        }
    }

    return upsertResults;
};

const deleteTestResults = async (testResult: TestResults): Promise<void> => {
    // TODO
};

// TODO confirm with Chris - might instead need to assume vehicle is present and execute SELECT here
const upsertVehicle = async (testResult: TestResult): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(VEHICLE_TABLE),
        [
            testResult.systemNumber,
            testResult.vin,
            testResult.vrm,
            testResult.trailerId,
        ]
    );
    return response.rows.insertId;
};

const upsertTestStation = async (testResult: TestResult): Promise<number> => {
    const response = await executePartialUpsert(
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
    const response = await executePartialUpsert(
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
    const response = await executePartialUpsert(
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
    const response = await executePartialUpsert(
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
    const response = await executePartialUpsert(
        generatePartialUpsertSql(TEST_TYPE_TABLE),
        [
            testType.testTypeClassification,
            testType.testTypeName,
        ]
    );
    return response.rows.insertId;
};

const upsertPreparer = async (testResult: TestResult): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(PREPARER_TABLE),
        [
            testResult.preparerId,
            testResult.preparerName,
        ]
    );
    return response.rows.insertId;
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

const upsertDefects = async (testResultId: number, testType: TestType): Promise<number[]> => {
    if (!testType.defects) {
        return [];
    }

    const insertedIds: number[] = [];

    for (const defect of testType.defects) {
        const insertDefectResponse = await executePartialUpsert(
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
        insertedIds.push(defectId);

        const insertLocationResponse = await executePartialUpsert(
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

        await executePartialUpsert(
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

    return insertedIds;
};

const upsertCustomDefects = async (testResultId: number, testType: TestType): Promise<number[]> => {
    if (!testType.customDefects) {
        return [];
    }

    const insertedIds: number[] = [];

    for (const customDefect of testType.customDefects) {
        const response = await executePartialUpsert(
            generatePartialUpsertSql(CUSTOM_DEFECT_TABLE),
            [
                testResultId,
                customDefect.referenceNumber,
                customDefect.defectName,
                customDefect.defectNotes,
            ]
        );
        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
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
