import {KnownOperationType} from "./operation-types";
import {DynamoDbImage} from "./dynamodb-images";
import {parseTestResults, TestResult, TestResults} from "../models/test-results";
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
import {getConnectionPool} from "./connection-pool";
import {Connection} from "mysql2/promise";

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

    const pool = await getConnectionPool();

    const upsertResults: TestResultUpsertResult[] = [];

    for (const testResult of testResults) {
        validateTestResult(testResult);

        const vehicleConnection = await pool.getConnection();

        let vehicleId;
        try {
            await vehicleConnection.beginTransaction();

            vehicleId = await upsertVehicle(vehicleConnection, testResult);

            await vehicleConnection.commit();
        } catch (err) {
            console.error(err);
            await vehicleConnection.rollback();
            throw err;
        }

        const testResultConnection = await pool.getConnection();

        try {
            await testResultConnection.beginTransaction();

            const testStationId = await upsertTestStation(testResultConnection, testResult);
            const testerId = await upsertTester(testResultConnection, testResult);
            const vehicleClassId = await upsertVehicleClass(testResultConnection, testResult);
            // TODO vehicle subclass - not clear on insert procedure here
            const preparerId = await upsertPreparer(testResultConnection, testResult);
            const createdById = await upsertIdentity(testResultConnection, testResult.createdById!, testResult.createdByName!);
            const lastUpdatedById = await upsertIdentity(testResultConnection, testResult.lastUpdatedById!, testResult.lastUpdatedByName!);

            for (const testType of testResult.testTypes!) {
                const fuelEmissionId = await upsertFuelEmission(testResultConnection, testType);
                const testTypeId = await upsertTestType(testResultConnection, testType);

                const response = await executePartialUpsert(
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
                    ],
                    testResultConnection
                );

                const testResultId = response.rows.insertId;

                const defectIds = await upsertDefects(testResultConnection, testResultId, testType);
                const customDefectIds = await upsertCustomDefects(testResultConnection, testResultId, testType);

                await testResultConnection.commit();

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
        } catch (err) {
            testResultConnection.rollback();
            throw err;
        }
    }

    return upsertResults;
};

const deleteTestResults = async (testResult: TestResults): Promise<void> => {
    // TODO
};

// TODO confirm with Chris - might instead need to assume vehicle is present and execute SELECT here
const upsertVehicle = async (connection: Connection, testResult: TestResult): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(VEHICLE_TABLE),
        [
            testResult.systemNumber,
            testResult.vin,
            testResult.vrm,
            testResult.trailerId,
        ],
        connection
    );
    return response.rows.insertId;
};

const upsertTestStation = async (connection: Connection, testResult: TestResult): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(TEST_STATION_TABLE),
        [
            testResult.testStationPNumber,
            testResult.testStationName,
            testResult.testStationType
        ],
        connection
    );
    return response.rows.insertId;
};

const upsertTester = async (connection: Connection, testResult: TestResult): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(TESTER_TABLE),
        [
            testResult.testerStaffId,
            testResult.testerName,
            testResult.testerEmailAddress,
        ],
        connection
    );
    return response.rows.insertId;
};

const upsertVehicleClass = async (connection: Connection, testResult: TestResult): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(VEHICLE_CLASS_TABLE),
        [
            testResult.vehicleClass?.code,
            testResult.vehicleClass?.description,
            testResult.vehicleType,
            testResult.vehicleSize,
            testResult.vehicleConfiguration,
            testResult.euVehicleCategory,
        ],
        connection
    );
    return response.rows.insertId;
};

const upsertFuelEmission = async (connection: Connection, testType: TestType): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(FUEL_EMISSION_TABLE),
        [
            testType.modType!.code,
            testType.modType!.description,
            testType.emissionStandard,
            testType.fuelType,
        ],
        connection
    );
    return response.rows.insertId;
};

const upsertTestType = async (connection: Connection, testType: TestType): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(TEST_TYPE_TABLE),
        [
            testType.testTypeClassification,
            testType.testTypeName,
        ],
        connection
    );
    return response.rows.insertId;
};

const upsertPreparer = async (connection: Connection, testResult: TestResult): Promise<number> => {
    const response = await executePartialUpsert(
        generatePartialUpsertSql(PREPARER_TABLE),
        [
            testResult.preparerId,
            testResult.preparerName,
        ],
        connection
    );
    return response.rows.insertId;
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

const upsertDefects = async (connection: Connection, testResultId: number, testType: TestType): Promise<number[]> => {
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
            ],
            connection
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
            ],
            connection
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
            ],
            connection
        );
    }

    return insertedIds;
};

const upsertCustomDefects = async (connection: Connection, testResultId: number, testType: TestType): Promise<number[]> => {
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
            ],
            connection
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
