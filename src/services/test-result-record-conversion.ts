import {KnownOperationType} from "./operation-types";
import {DynamoDbImage} from "./dynamodb-images";
import {parseTestResults, TestResult, TestResults} from "../models/test-results";
import {execute} from "./connection-pool";
import {toTechRecordTemplateVariables, toVehicleClassTemplateVariables} from "../models/tech-record";
import {toVehicleTemplateVariables} from "../models/tech-record-document";

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
        const vehicleId = await upsertVehicle(testResult);
        const technicalRecordId = 1; // TODO
        const testStationId = await upsertTestStation(testResult);
        const testerId = await upsertTester(testResult);
        const vehicleClassId = await upsertVehicleClass(testResult);
        const fuelEmissionId = await upsertFuelEmission(testResult);
        const testTypeId = await upsertTestType(testResult);
        const preparerId = await upsertPreparer(testResult);
        const createdById = await upsertIdentity(testResult.createdById!, testResult.createdByName!);
        const lastUpdatedById = await upsertIdentity(testResult.lastUpdatedById!, testResult.lastUpdatedByName!);

        const insertTestResultQuery = "";
        const testResultTemplateVariables = toTechRecordTemplateVariables(testResult);
        testResultTemplateVariables.push(vehicleId, technicalRecordId, vehicleClassId, fuelEmissionId, testStationId, testerId, vehicleClassId, testTypeId, preparerId, createdById, lastUpdatedById);

        await execute(insertTestResultQuery, testResultTemplateVariables);

        const techRecordId = (await execute("SELECT LAST_INSERT_ID() AS techRecordId")).rows[0].techRecordId;

        insertedIds.push(techRecordId);
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
    return 1;
};

const upsertTester = async (testResult: TestResult): Promise<number> => {
    return 1;
};

const upsertVehicleClass = async (testResult: TestResult): Promise<number> => {
    const insertVehicleClassQuery = "SELECT f_upsert_vehicle_class(?, ?, ?, ?, ?, ?) AS vehicleClassId";
    const insertVehicleClassResponse = await execute(insertVehicleClassQuery, toVehicleClassTemplateVariables(testResult)); // TODO
    return insertVehicleClassResponse.rows[0].vehicleClassId;
};

const upsertFuelEmission = async (testResult: TestResult): Promise<number> => {
    return 1;
};

const upsertTestType = async (testResult: TestResult): Promise<number> => {
    return 1;
};

const upsertPreparer = async (testResult: TestResult): Promise<number> => {
    return 1;
};

const upsertIdentity = async (id: string, name: string): Promise<number> => {
    // TODO check nullity
    const insertIdentityQuery = "SELECT f_upsert_identity(?, ?) AS identityId";
    const insertIdentityResponse = await execute(insertIdentityQuery, [id, name]);
    return insertIdentityResponse.rows[0].identityId;
};
