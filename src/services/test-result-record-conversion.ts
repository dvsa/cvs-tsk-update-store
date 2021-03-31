import {KnownOperationType} from "./operation-types";
import {DynamoDbImage} from "./dynamodb-images";
import {parseTestResults, TestResult, TestResults} from "../models/test-results";
import {execute} from "./connection-pool";
import {toVehicleClassTemplateVariables} from "../models/tech-record";
import {toVehicleTemplateVariables} from "../models/tech-record-document";
import {TestType} from "../models/test-types";

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
        const preparerId = await upsertPreparer(testResult);
        const createdById = await upsertIdentity(testResult.createdById!, testResult.createdByName!);
        const lastUpdatedById = await upsertIdentity(testResult.lastUpdatedById!, testResult.lastUpdatedByName!);

        for (const testType of testResult.testTypes!) {
            const fuelEmissionId = await upsertFuelEmission(testType);
            const testTypeId = await upsertTestType(testType);

            const insertTestResultQuery = ""; // TODO
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
        "INSERT INTO `test_station` (`pNumber`, `name`, `type`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [
            testResult.testStationPNumber,
            testResult.testStationName,
            testResult.testStationType,
        ]
    );
    return response.rows[0].id;
};

const upsertTester = async (testResult: TestResult): Promise<number> => {
    const response = await execute(
        "INSERT INTO `tester` (`staffId`, `name`, `email_address`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [
            testResult.testerStaffId,
            testResult.testerName,
            testResult.testerEmailAddress,
        ]
    );
    return response.rows[0].id;
};

const upsertVehicleClass = async (testResult: TestResult): Promise<number> => {
    const insertVehicleClassQuery = "SELECT f_upsert_vehicle_class(?, ?, ?, ?, ?, ?) AS vehicleClassId";
    const insertVehicleClassResponse = await execute(insertVehicleClassQuery, toVehicleClassTemplateVariables(testResult)); // TODO
    return insertVehicleClassResponse.rows[0].vehicleClassId;
};

const upsertFuelEmission = async (testType: TestType): Promise<number> => {
    const response = await execute(
        "INSERT INTO fuel_emission (`modTypeCode`, `description`, `emissionStandard`, `fuelType`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [
            testType.modType!.code,
            testType.modType!.description,
            testType.emissionStandard,
            testType.fuelType,
        ]
    );
    return response.rows[0].id;
};

const upsertTestType = async (testType: TestType): Promise<number> => {
    const response = await execute(
        "INSERT INTO `test_type` (`testTypeClassification`, `testTypeName`) VALUES (?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [
            testType.testTypeClassification,
            testType.testTypeName,
        ]
    );
    return response.rows[0].id;
};

const upsertPreparer = async (testResult: TestResult): Promise<number> => {
    const response = await execute(
        "INSERT INTO preparer (`preparerId`, `name`) VALUES (?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [
            testResult.preparerId,
            testResult.preparerName,
        ]
    );
    return response.rows[0].id;
};

const upsertIdentity = async (id: string, name: string): Promise<number> => {
    // TODO check nullity
    const insertIdentityQuery = "SELECT f_upsert_identity(?, ?) AS identityId";
    const insertIdentityResponse = await execute(insertIdentityQuery, [id, name]);
    return insertIdentityResponse.rows[0].identityId;
};

const upsertDefects = async (testResultId: number, testType: TestType): Promise<void> => {
    if (!testType.defects) {
        return;
    }

    for (const defect of testType.defects) {
        const insertDefectResponse = await execute(
            "INSERT INTO `defects` (`imNumber`, `imDescription`, `itemNumber`, `itemDescription`, `deficiencyRef`, `deficiencyId`, `deficiencySubId`, `deficiencyCategory`, `deficiencyText`, `stdForProhibition` ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
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

        const defectId = insertDefectResponse.rows[0].id;

        const locationId = await execute(
            "INSERT INTO `location` (`vertical`, `horizontal`, `lateral`, `longitudinal`, `rowNumber`, `seatNumber`, `axleNumber`) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
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

        await execute(
            "INSERT INTO `test_defect` (`test_record_id`, `defect_id`, `location_id`, `notes`, `prs`, `prohibitionIssued`) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
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
            "INSERT INTO `custom_defect` (`test_record_id`, `referenceNumber`, `defectName`, `defectNotes`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
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
