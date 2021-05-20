import {StartedTestContainer} from "testcontainers";
import {destroyConnectionPool, executeSql} from "../../src/services/connection-pool";
import {exampleContext, useLocalDb} from "../utils";
import testResultsJson from "../resources/dynamodb-image-test-results.json";
import {getContainerizedDatabase} from "./cvsbnop-container";
import {TestResultUpsertResult} from "../../src/models/upsert-results";
import {processStreamEvent} from "../../src/functions/process-stream-event";
import {getConnectionPoolOptions} from "../../src/services/connection-pool-options";

useLocalDb();

describe("convertTestResults() integration tests", () => {
    let container: StartedTestContainer;

    beforeAll(async () => {
        jest.setTimeout(60_000);

        // see README for why this environment variable exists
        if (process.env.USE_CONTAINERIZED_DATABASE === "1") {
            container = await getContainerizedDatabase();
        } else {
            (getConnectionPoolOptions as jest.Mock) = jest.fn().mockResolvedValue({
                host: "localhost",
                port: "3306",
                user: "root",
                password: "12345",
                database: "CVSBNOP"
            });
        }
    });

    afterAll(async () => {
        await destroyConnectionPool();
        if (process.env.USE_CONTAINERIZED_DATABASE === "1") {
            await container.stop();
        }
    });

    it("should correctly convert a DynamoDB event into Aurora rows", async () => {
        const event = {
            Records: [
                {
                    body: JSON.stringify({
                        eventSourceARN: "arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000",
                        eventName: "INSERT",
                        dynamodb: {
                            NewImage: testResultsJson
                        }
                    })
                }
            ]
        };

        // array of arrays: event contains array of records, each with array of test result entities
        const upsertResults: TestResultUpsertResult[][] = await processStreamEvent(
            event,
            exampleContext(),
            () => {
                return;
            }
        );

        expect(upsertResults.length).toEqual(1);
        expect(upsertResults[0].length).toEqual(1);

        const upsertResult = upsertResults[0][0];

        const vehicleResultSet = await executeSql(
            `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`
             FROM \`vehicle\`
             WHERE \`vehicle\`.\`id\` = ${upsertResult.vehicleId}`
        );
        expect(vehicleResultSet.rows.length).toEqual(1);
        expect(vehicleResultSet.rows[0].system_number).toEqual("SYSTEM-NUMBER");
        expect(vehicleResultSet.rows[0].vin).toEqual("VIN");
        expect(vehicleResultSet.rows[0].vrm_trm).toEqual("VRM");
        expect(vehicleResultSet.rows[0].trailer_id).toEqual("88888888");
        expect((vehicleResultSet.rows[0].createdAt as Date).toUTCString()).not.toBeNull();

        const testStationResultSet = await executeSql(
            `SELECT \`pNumber\`, \`name\`, \`type\`
             FROM \`test_station\`
             WHERE \`test_station\`.\`id\` = ${upsertResult.testStationId}`
        );
        expect(testStationResultSet.rows.length).toEqual(1);
        expect(testStationResultSet.rows[0].pNumber).toEqual("P-NUMBER");
        expect(testStationResultSet.rows[0].name).toEqual("TEST-STATION-NAME");
        expect(testStationResultSet.rows[0].type).toEqual("atf");

        const testerResultSet = await executeSql(
            `SELECT \`staffId\`, \`name\`, \`email_address\`
             FROM \`tester\`
             WHERE \`tester\`.\`id\` = ${upsertResult.testerId}`
        );
        expect(testerResultSet.rows.length).toEqual(1);
        expect(testerResultSet.rows[0].staffId).toEqual("999999999");
        expect(testerResultSet.rows[0].name).toEqual("TESTER-NAME");
        expect(testerResultSet.rows[0].email_address).toEqual("TESTER-EMAIL-ADDRESS");

        const vehicleClassResultSet = await executeSql(
            `SELECT \`code\`,
                    \`description\`,
                    \`vehicleType\`,
                    \`vehicleSize\`,
                    \`vehicleConfiguration\`,
                    \`euVehicleCategory\`
             FROM \`vehicle_class\`
             WHERE \`vehicle_class\`.\`id\` = ${upsertResult.vehicleClassId}`
        );
        expect(vehicleClassResultSet.rows.length).toEqual(1);
        expect(vehicleClassResultSet.rows[0].code).toEqual("2");
        expect(vehicleClassResultSet.rows[0].description).toEqual("motorbikes over 200cc or with a sidecar");
        expect(vehicleClassResultSet.rows[0].vehicleType).toEqual("psv");
        expect(vehicleClassResultSet.rows[0].vehicleSize).toEqual("large");
        expect(vehicleClassResultSet.rows[0].vehicleConfiguration).toEqual("rigid");
        expect(vehicleClassResultSet.rows[0].euVehicleCategory).toEqual("m1");

        const preparerResultSet = await executeSql(
            `SELECT \`preparerId\`, \`name\`
             FROM \`preparer\`
             WHERE \`preparer\`.\`id\` = ${upsertResult.preparerId}`
        );
        expect(preparerResultSet.rows.length).toEqual(1);
        expect(preparerResultSet.rows[0].preparerId).toEqual("999999999");
        expect(preparerResultSet.rows[0].name).toEqual("PREPARER-NAME");

        const createdByResultSet = await executeSql(
            `SELECT \`identityId\`, \`name\`
             FROM \`identity\`
             WHERE \`identity\`.\`id\` = ${upsertResult.createdById}`
        );
        expect(createdByResultSet.rows.length).toEqual(1);
        expect(createdByResultSet.rows[0].identityId).toEqual("CREATED-BY-ID");
        expect(createdByResultSet.rows[0].name).toEqual("CREATED-BY-NAME");

        const lastUpdatedByResultSet = await executeSql(
            `SELECT \`identityId\`, \`name\`
             FROM \`identity\`
             WHERE \`identity\`.\`id\` = ${upsertResult.lastUpdatedById}`
        );
        expect(lastUpdatedByResultSet.rows.length).toEqual(1);
        expect(lastUpdatedByResultSet.rows[0].identityId).toEqual("LAST-UPDATED-BY-ID");
        expect(lastUpdatedByResultSet.rows[0].name).toEqual("LAST-UPDATED-BY-NAME");

        const fuelEmissionResultSet = await executeSql(
            `SELECT \`modTypeCode\`, \`description\`, \`emissionStandard\`, \`fuelType\`
             FROM \`fuel_emission\`
             WHERE \`fuel_emission\`.\`id\` = ${upsertResult.fuelEmissionId}`
        );
        expect(fuelEmissionResultSet.rows.length).toEqual(1);
        expect(fuelEmissionResultSet.rows[0].modTypeCode).toEqual("p");
        expect(fuelEmissionResultSet.rows[0].description).toEqual("particulate trap");
        expect(fuelEmissionResultSet.rows[0].emissionStandard).toEqual("0.10 g/kWh Euro 3 PM");
        expect(fuelEmissionResultSet.rows[0].fuelType).toEqual("diesel");

        const testTypeResultSet = await executeSql(
            `SELECT \`testTypeClassification\`, \`testTypeName\`
             FROM \`test_type\`
             WHERE \`test_type\`.\`id\` = ${upsertResult.testTypeId}`
        );
        expect(testTypeResultSet.rows.length).toEqual(1);
        expect(testTypeResultSet.rows[0].testTypeClassification).toEqual("2323232323232323232323");
        expect(testTypeResultSet.rows[0].testTypeName).toEqual("TEST-TYPE-NAME");

        expect(upsertResult.defectIds.length).toEqual(1);

        const defectResultSet = await executeSql(
            `SELECT \`imNumber\`,
                    \`imDescription\`,
                    \`itemNumber\`,
                    \`itemDescription\`,
                    \`deficiencyRef\`,
                    \`deficiencyId\`,
                    \`deficiencySubId\`,
                    \`deficiencyCategory\`,
                    \`deficiencyText\`,
                    \`stdForProhibition\`
             FROM \`defect\`
             WHERE \`defect\`.\`id\` = ${upsertResult.defectIds[0]}`
        );
        expect(defectResultSet.rows.length).toEqual(1);
        expect(defectResultSet.rows[0].imNumber).toEqual(1);
        expect(defectResultSet.rows[0].imDescription).toEqual("IM-DESCRIPTION");
        expect(defectResultSet.rows[0].itemNumber).toEqual(1);
        expect(defectResultSet.rows[0].itemDescription).toEqual("ITEM-DESCRIPTION");
        expect(defectResultSet.rows[0].deficiencyRef).toEqual("DEFICIENCY-REF");
        expect(defectResultSet.rows[0].deficiencyId).toEqual("a");
        expect(defectResultSet.rows[0].deficiencySubId).toEqual("mdclxvi");
        expect(defectResultSet.rows[0].deficiencyCategory).toEqual("advisory");
        expect(defectResultSet.rows[0].deficiencyText).toEqual("DEFICIENCY-TEXT");
        expect(defectResultSet.rows[0].itemNumber).toEqual(1);

        const testDefectResultSet = await executeSql(
            `SELECT \`test_result_id\`, \`defect_id\`, \`location_id\`, \`notes\`, \`prs\`, \`prohibitionIssued\`
             FROM \`test_defect\`
             WHERE \`test_defect\`.\`test_result_id\` = ${upsertResult.testResultId}`
        );
        // expect(testDefectResultSet.rows.length).toEqual(1);
        const lastIndex = testDefectResultSet.rows.length - 1;
        expect(testDefectResultSet.rows[lastIndex].test_result_id).toEqual(upsertResult.testResultId);
        expect(testDefectResultSet.rows[lastIndex].defect_id).toEqual(upsertResult.defectIds[0]);
        expect(testDefectResultSet.rows[lastIndex].location_id).toEqual(1);
        expect(testDefectResultSet.rows[lastIndex].notes).toEqual("NOTES");
        expect(testDefectResultSet.rows[lastIndex].prs).toEqual(1);
        expect(testDefectResultSet.rows[lastIndex].prohibitionIssued).toEqual(1);
        // expect(testDefectResultSet.rows.length).toEqual(1);
        // expect(testDefectResultSet.rows[0].test_result_id).toEqual(upsertResult.testResultId);
        // expect(testDefectResultSet.rows[0].defect_id).toEqual(upsertResult.defectIds[0]);
        // expect(testDefectResultSet.rows[0].location_id).toEqual(1);
        // expect(testDefectResultSet.rows[0].notes).toEqual("NOTES");
        // expect(testDefectResultSet.rows[0].prs).toEqual(1);
        // expect(testDefectResultSet.rows[0].prohibitionIssued).toEqual(1);

        expect(upsertResult.customDefectIds.length).toEqual(1);

        const customDefectResultSet = await executeSql(
            `SELECT \`test_result_id\`, \`referenceNumber\`, \`defectName\`, \`defectNotes\`
             FROM \`custom_defect\`
             WHERE \`custom_defect\`.\`id\` = ${upsertResult.customDefectIds[0]}`
        );
        expect(customDefectResultSet.rows.length).toEqual(1);
        expect(customDefectResultSet.rows[0].test_result_id).toEqual(upsertResult.testResultId);
        expect(customDefectResultSet.rows[0].referenceNumber).toEqual("1010101010");
        expect(customDefectResultSet.rows[0].defectName).toEqual("DEFECT-NAME");
        expect(customDefectResultSet.rows[0].defectNotes).toEqual("DEFECT-NOTES");
    });
});
