import {parseTestResults, TestResult, TestResults} from "../models/test-results";
import {TestType} from "../models/test-types";
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
    VEHICLE_SUBCLASS_TABLE,
    VEHICLE_TABLE
} from "./table-details";
import {executePartialUpsert} from "./sql-execution";
import {TestResultUpsertResult} from "../models/upsert-results";
import {getConnectionPool} from "./connection-pool";
import {Connection} from "mysql2/promise";
import {EntityConverter} from "./entity-conversion";
import {debugLog} from "./logger";

export const testResultsConverter = (): EntityConverter<TestResults> => {
    return {
        parseRootImage: parseTestResults,
        upsertEntity: upsertTestResults,
        deleteEntity: deleteTestResults
    };
};

const upsertTestResults = async (testResults: TestResults): Promise<TestResultUpsertResult[]> => {
    debugLog(`upsertTestResults: START`);

    if (!testResults) {
        return [];
    }

    const pool = await getConnectionPool();

    const upsertResults: TestResultUpsertResult[] = [];

    debugLog(`Upserting ${testResults.length} test results`);

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
            const vehicleSubclassIds = await upsertVehicleSubclasses(testResultConnection, vehicleClassId, testResult);
            const preparerId = await upsertPreparer(testResultConnection, testResult);
            const createdById = await upsertIdentity(testResultConnection, testResult.createdById!, testResult.createdByName!);
            const lastUpdatedById = await upsertIdentity(testResultConnection, testResult.lastUpdatedById!, testResult.lastUpdatedByName!);

            for (const testType of testResult.testTypes!) {
                const fuelEmissionId = await upsertFuelEmission(testResultConnection, testType);
                const testTypeId = await upsertTestType(testResultConnection, testType);

                debugLog(`upsertTestResults: Upserting test result...`);

                const response = await executePartialUpsert(
                    TEST_RESULT_TABLE,
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

                debugLog(`upsertTestResults: Upserted test result (ID: ${testResultId})`);

                const defectIds = await upsertDefects(testResultConnection, testResultId, testType);
                const customDefectIds = await upsertCustomDefects(testResultConnection, testResultId, testType);

                await testResultConnection.commit();

                upsertResults.push({
                    vehicleId,
                    testResultId,
                    testStationId,
                    testerId,
                    vehicleClassId,
                    vehicleSubclassIds,
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
            await testResultConnection.rollback();
            throw err;
        }
    }

    debugLog(`upsertTestResults: END`);

    return upsertResults;
};

const deleteTestResults = async (testResult: TestResults): Promise<void> => {
    throw new Error("deleting test results is not implemented yet");
};

const upsertVehicle = async (connection: Connection, testResult: TestResult): Promise<number> => {
    debugLog(`upsertTestResults: Upserting vehicle...`);

    const response = await executePartialUpsert(
        VEHICLE_TABLE,
        [
            testResult.systemNumber,
            testResult.vin,
            testResult.vrm,
            testResult.trailerId,
            new Date().toISOString().substr(0, 23)
        ],
        connection
    );

    debugLog(`upsertTestResults: Upserted vehicle (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertTestStation = async (connection: Connection, testResult: TestResult): Promise<number> => {
    debugLog(`upsertTestResults: Upserting test station...`);

    const response = await executePartialUpsert(
        TEST_STATION_TABLE,
        [
            testResult.testStationPNumber,
            testResult.testStationName,
            testResult.testStationType
        ],
        connection
    );

    debugLog(`upsertTestResults: Upserted test station (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertTester = async (connection: Connection, testResult: TestResult): Promise<number> => {
    debugLog(`upsertTestResults: Upserting tester...`);

    const response = await executePartialUpsert(
        TESTER_TABLE,
        [
            testResult.testerStaffId,
            testResult.testerName,
            testResult.testerEmailAddress,
        ],
        connection
    );

    debugLog(`upsertTestResults: Upserted tester (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertVehicleClass = async (connection: Connection, testResult: TestResult): Promise<number> => {
    debugLog(`upsertTestResults: Upserting vehicle class...`);

    const response = await executePartialUpsert(
        VEHICLE_CLASS_TABLE,
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

    debugLog(`upsertTestResults: Upserted vehicle class (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertVehicleSubclasses = async (connection: Connection, vehicleClassId: number, testResult: TestResult): Promise<number[]> => {
    debugLog(`upsertTestResults: Upserting vehicle subclasses...`);

    if (!testResult.vehicleSubclass) {
        debugLog(`upsertTestResults: no vehicle subclasses present`);
        return [];
    }

    const insertedIds: number[] = [];

    for (const vehicleSubclass of testResult.vehicleSubclass) {
        const response = await executePartialUpsert(
            VEHICLE_SUBCLASS_TABLE,
            [
                vehicleClassId,
                vehicleSubclass
            ],
            connection
        );

        debugLog(`upsertTestResults: Upserted vehicle subclass (ID: ${response.rows.insertId})`);

        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
};

const upsertFuelEmission = async (connection: Connection, testType: TestType): Promise<number> => {
    debugLog(`upsertTestResults: Upserting fuel emission...`);

    const response = await executePartialUpsert(
        FUEL_EMISSION_TABLE,
        [
            testType.modType?.code,
            testType.modType?.description,
            testType.emissionStandard,
            testType.fuelType,
        ],
        connection
    );

    debugLog(`upsertTestResults: Upserted fuel emission (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertTestType = async (connection: Connection, testType: TestType): Promise<number> => {
    debugLog(`upsertTestResults: Upserting test type...`);

    const response = await executePartialUpsert(
        TEST_TYPE_TABLE,
        [
            testType.testTypeClassification,
            testType.testTypeName,
        ],
        connection
    );

    debugLog(`upsertTestResults: Upserted test type (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertPreparer = async (connection: Connection, testResult: TestResult): Promise<number> => {
    debugLog(`upsertTestResults: Upserting preparer...`);

    const response = await executePartialUpsert(
        PREPARER_TABLE,
        [
            testResult.preparerId,
            testResult.preparerName,
        ],
        connection
    );

    debugLog(`upsertTestResults: Upserted preparer (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertIdentity = async (connection: Connection, id: string, name: string): Promise<number> => {
    debugLog(`upsertTestResults: Upserting identity (${id} ---> ${name})...`);

    const response = await executePartialUpsert(
        IDENTITY_TABLE,
        [
            id,
            name
        ],
        connection
    );

    debugLog(`upsertTestResults: Upserted identity (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertDefects = async (connection: Connection, testResultId: number, testType: TestType): Promise<number[]> => {
    if (!testType.defects) {
        return [];
    }

    const insertedIds: number[] = [];

    for (const defect of testType.defects) {
        debugLog(`upsertTestResults: Upserting defect...`);

        const insertDefectResponse = await executePartialUpsert(
            DEFECTS_TABLE,
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

        debugLog(`upsertTestResults: Upserted defect (defect ID: ${defectId})`);

        insertedIds.push(defectId);

        const insertLocationResponse = await executePartialUpsert(
            LOCATION_TABLE,
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

        debugLog(`upsertTestResults: Upserted defect location (location ID: ${locationId})`);

        await executePartialUpsert(
            TEST_DEFECT_TABLE,
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

        debugLog(`upsertTestResults: Upserted defect test-defect mapping`);
    }

    return insertedIds;
};

const upsertCustomDefects = async (connection: Connection, testResultId: number, testType: TestType): Promise<number[]> => {
    if (!testType.customDefects) {
        return [];
    }

    const insertedIds: number[] = [];

    for (const customDefect of testType.customDefects) {
        debugLog(`upsertTestResults: Upserting custom defect...`);

        const response = await executePartialUpsert(
            CUSTOM_DEFECT_TABLE,
            [
                testResultId,
                customDefect.referenceNumber,
                customDefect.defectName,
                customDefect.defectNotes,
            ],
            connection
        );

        debugLog(`upsertTestResults: Upserted custom defect (ID: ${response.rows.insertId})`);

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
