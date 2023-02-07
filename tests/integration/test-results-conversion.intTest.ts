import {StartedTestContainer} from "testcontainers";
import {destroyConnectionPool, executeSql} from "../../src/services/connection-pool";
import {exampleContext, useLocalDb} from "../utils";
import testResultsJson from "../resources/dynamodb-image-test-results.json";
import testResultsJsonWithTestTypes from "../resources/dynamodb-image-test-results-with-testtypes.json";
import {getContainerizedDatabase} from "./cvsbnop-container";
import {processStreamEvent} from "../../src/functions/process-stream-event";
import {getConnectionPoolOptions} from "../../src/services/connection-pool-options";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";

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
        await processStreamEvent(
            event,
            exampleContext(),
            () => {
                return;
            }
        );

        const vehicleResultSet = await executeSql(
            `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
             FROM \`vehicle\`
             WHERE \`vehicle\`.\`id\` IN (
                SELECT \`id\`
                FROM \`vehicle\`
                WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER"
             )`
        );

        expect(vehicleResultSet.rows.length).toEqual(1);
        expect(vehicleResultSet.rows[0].system_number).toEqual("SYSTEM-NUMBER");
        expect(vehicleResultSet.rows[0].vin).toEqual("VIN");
        expect(vehicleResultSet.rows[0].vrm_trm).toEqual("VRM");
        expect(vehicleResultSet.rows[0].trailer_id).toEqual("88888888");
        expect((vehicleResultSet.rows[0].createdAt as Date).toUTCString()).not.toBeNull();

        // const testResultSet = await executeSql(
        //     `SELECT \`test_station_id\`, \`tester_id\`, \`vehicle_class_id\`, \`preparer_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`, \`fuel_emission_id\`, \`test_type_id\`, \`id\`
        //      FROM \`test_result\`
        //      WHERE \`test_result\`.\`vehicle_id\` = ${vehicleResultSet.rows[0].id}`
        // );

        const testResultSet = await executeSql(
            `SELECT \`test_station_id\`, \`tester_id\`, \`vehicle_class_id\`, \`preparer_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`,
                    \`fuel_emission_id\`, \`test_type_id\`, \`id\`, \`testResultId\`, \`testCode\`,  \`certificateNumber\`,  \`secondaryCertificateNumber\`,
                    \`testExpiryDate\`,  \`testAnniversaryDate\`,  \`testTypeStartTimestamp\`,  \`numberOfSeatbeltsFitted\`, \`lastSeatbeltInstallationCheckDate\`,
                    \`seatbeltInstallationCheckDate\`,  \`testResult\`,  \`reasonForAbandoning\`,  \`additionalNotesRecorded\`,  \`additionalCommentsForAbandon\`,
                    \`particulateTrapFitted\`,  \`particulateTrapSerialNumber\`,  \`modificationTypeUsed\`, \`smokeTestKLimitApplied\`
            FROM \`test_result\`
            WHERE \`test_result\`.\`vehicle_id\` = ${vehicleResultSet.rows[0].id}`
        );

        expect(testResultSet.rows[0].testResultId).toEqual("TEST-RESULT-ID");
        expect(testResultSet.rows.length).toEqual(1);
        expect(testResultSet.rows[0].testCode).toEqual("333");
        expect(testResultSet.rows[0].certificateNumber).toEqual("999999999");
        expect(testResultSet.rows[0].secondaryCertificateNumber).toEqual("999999999");
        expect((testResultSet.rows[0].testExpiryDate as Date).toISOString()).toEqual("2020-01-01T00:00:00.000Z");
        expect((testResultSet.rows[0].testAnniversaryDate as Date).toISOString()).toEqual("2020-01-01T00:00:00.000Z");
        expect((testResultSet.rows[0].testTypeStartTimestamp as Date).toISOString()).toEqual("2020-01-01T00:00:00.000Z");
        expect(testResultSet.rows[0].lastSeatbeltInstallationCheckDate).toEqual(new Date("2020-01-01"));
        expect(testResultSet.rows[0].seatbeltInstallationCheckDate).toEqual(1);
        expect(testResultSet.rows[0].testResult).toEqual("fail");
        expect(testResultSet.rows[0].reasonForAbandoning).toEqual("REASON-FOR-ABANDONING");
        expect(testResultSet.rows[0].additionalNotesRecorded).toEqual("ADDITIONAL-NOTES-RECORDED");
        expect(testResultSet.rows[0].particulateTrapFitted).toEqual("PARTICULATE-TRAP-FITTED");
        expect(testResultSet.rows[0].particulateTrapSerialNumber).toEqual("PARTICULATE-TRAP-SERIAL-NUMBER");
        expect(testResultSet.rows[0].modificationTypeUsed).toEqual("MODIFICATION-TYPE-USED");
        expect(testResultSet.rows[0].smokeTestKLimitApplied).toEqual("SMOKE-TEST-K-LIMIT-APPLIED");

        expect(testResultSet.rows.length).toEqual(1);

        const { test_station_id, tester_id, vehicle_class_id, preparer_id, createdBy_Id, lastUpdatedBy_Id, fuel_emission_id, test_type_id, id } = testResultSet.rows[0];

        const testStationResultSet = await executeSql(
            `SELECT \`pNumber\`, \`name\`, \`type\`
             FROM \`test_station\`
             WHERE \`test_station\`.\`id\` = ${test_station_id}`
        );
        expect(testStationResultSet.rows.length).toEqual(1);
        expect(testStationResultSet.rows[0].pNumber).toEqual("P-NUMBER");
        expect(testStationResultSet.rows[0].name).toEqual("TEST-STATION-NAME");
        expect(testStationResultSet.rows[0].type).toEqual("atf");

        const testerResultSet = await executeSql(
            `SELECT \`staffId\`, \`name\`, \`email_address\`
             FROM \`tester\`
             WHERE \`tester\`.\`id\` = ${tester_id}`
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
             WHERE \`vehicle_class\`.\`id\` = ${vehicle_class_id}`
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
             WHERE \`preparer\`.\`id\` = ${preparer_id}`
        );
        expect(preparerResultSet.rows.length).toEqual(1);
        expect(preparerResultSet.rows[0].preparerId).toEqual("999999999");
        expect(preparerResultSet.rows[0].name).toEqual("PREPARER-NAME");

        const createdByResultSet = await executeSql(
            `SELECT \`identityId\`, \`name\`
             FROM \`identity\`
             WHERE \`identity\`.\`id\` = ${createdBy_Id}`
        );
        expect(createdByResultSet.rows.length).toEqual(1);
        expect(createdByResultSet.rows[0].identityId).toEqual("CREATED-BY-ID");
        expect(createdByResultSet.rows[0].name).toEqual("CREATED-BY-NAME");

        const lastUpdatedByResultSet = await executeSql(
            `SELECT \`identityId\`, \`name\`
             FROM \`identity\`
             WHERE \`identity\`.\`id\` = ${lastUpdatedBy_Id}`
        );
        expect(lastUpdatedByResultSet.rows.length).toEqual(1);
        expect(lastUpdatedByResultSet.rows[0].identityId).toEqual("LAST-UPDATED-BY-ID");
        expect(lastUpdatedByResultSet.rows[0].name).toEqual("LAST-UPDATED-BY-NAME");

        const fuelEmissionResultSet = await executeSql(
            `SELECT \`modTypeCode\`, \`description\`, \`emissionStandard\`, \`fuelType\`
             FROM \`fuel_emission\`
             WHERE \`fuel_emission\`.\`id\` = ${fuel_emission_id}`
        );
        expect(fuelEmissionResultSet.rows.length).toEqual(1);
        expect(fuelEmissionResultSet.rows[0].modTypeCode).toEqual("p");
        expect(fuelEmissionResultSet.rows[0].description).toEqual("particulate trap");
        expect(fuelEmissionResultSet.rows[0].emissionStandard).toEqual("0.10 g/kWh Euro 3 PM");
        expect(fuelEmissionResultSet.rows[0].fuelType).toEqual("diesel");

        const testTypeResultSet = await executeSql(
            `SELECT \`testTypeClassification\`, \`testTypeName\`
             FROM \`test_type\`
             WHERE \`test_type\`.\`id\` = ${test_type_id}`
        );
        expect(testTypeResultSet.rows.length).toEqual(1);
        expect(testTypeResultSet.rows[0].testTypeClassification).toEqual("2323232323232323232323");
        expect(testTypeResultSet.rows[0].testTypeName).toEqual("TEST-TYPE-NAME");

        const testDefectResultSet = await executeSql(
            `SELECT \`test_result_id\`, \`defect_id\`, \`location_id\`, \`notes\`, \`prs\`, \`prohibitionIssued\`
             FROM \`test_defect\`
             WHERE \`test_defect\`.\`test_result_id\` = ${id}`
        );

        const testDefectLastIndex = testDefectResultSet.rows.length - 1;

        expect(testDefectResultSet.rows[testDefectLastIndex].test_result_id).toEqual(id);
        expect(testDefectResultSet.rows[testDefectLastIndex].defect_id).toEqual(1);
        expect(testDefectResultSet.rows[testDefectLastIndex].location_id).toEqual(1);
        expect(testDefectResultSet.rows[testDefectLastIndex].notes).toEqual("NOTES");
        expect(testDefectResultSet.rows[testDefectLastIndex].prs).toEqual(1);
        expect(testDefectResultSet.rows[testDefectLastIndex].prohibitionIssued).toEqual(1);

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
             WHERE \`defect\`.\`id\` = ${testDefectResultSet.rows[testDefectLastIndex].defect_id}`
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

        const customDefectResultSet = await executeSql(
            `SELECT \`test_result_id\`, \`referenceNumber\`, \`defectName\`, \`defectNotes\`
             FROM \`custom_defect\`
             WHERE \`custom_defect\`.\`test_result_id\` = ${id}`
        );

        const customDefectLastIndex = customDefectResultSet.rows.length - 1;

        expect(customDefectResultSet.rows[customDefectLastIndex].test_result_id).toEqual(id);
        expect(customDefectResultSet.rows[customDefectLastIndex].referenceNumber).toEqual("1010101010");
        expect(customDefectResultSet.rows[customDefectLastIndex].defectName).toEqual("DEFECT-NAME");
        expect(customDefectResultSet.rows[customDefectLastIndex].defectNotes).toEqual("DEFECT-NOTES");
    });
    it("Existing Test Result TestType attributes are modified correctly", async () => {
        const deserializedJson = unmarshall(testResultsJson);
        deserializedJson.testResults[0].testTypes[0].testCode = "444";
        deserializedJson.testResults[0].testTypes[0].certificateNumber = "W323232";
        deserializedJson.testResults[0].testTypes[0].secondaryCertificateNumber = "111111";
        deserializedJson.testResults[0].testTypes[0].testExpiryDate = "2022-01-01T00:00:00.000Z";
        deserializedJson.testResults[0].testTypes[0].testAnniversaryDate = "2022-01-01T00:00:00.000Z";
        deserializedJson.testResults[0].testTypes[0].testTypeStartTimestamp = "2021-01-01T00:00:00.000Z";
        deserializedJson.testResults[0].testTypes[0].numberOfSeatbeltsFitted = 5;
        deserializedJson.testResults[0].testTypes[0].lastSeatbeltInstallationCheckDate = "2021-01-01";
        deserializedJson.testResults[0].testTypes[0].seatbeltInstallationCheckDate = false;
        deserializedJson.testResults[0].testTypes[0].testResult = "pass";
        deserializedJson.testResults[0].testTypes[0].reasonForAbandoning = "NEW-REASON-FOR-ABANDONING";
        deserializedJson.testResults[0].testTypes[0].additionalNotesRecorded = "NEW-ADDITIONAL-NOTES-RECORDED";
        deserializedJson.testResults[0].testTypes[0].additionalCommentsForAbandon = "NEW-ADDITIONAL-COMMENTS-FOR-ABANDON";
        deserializedJson.testResults[0].testTypes[0].particulateTrapFitted = "t";
        deserializedJson.testResults[0].testTypes[0].particulateTrapSerialNumber = "trap";
        deserializedJson.testResults[0].testTypes[0].modificationTypeUsed = "NEW-MODIFICATION-TYPE-USED";
        deserializedJson.testResults[0].testTypes[0].smokeTestKLimitApplied = "NEW-SMOKE-TEST-K-LIMIT-APPLIED";

        const serializedJSONb = marshall(deserializedJson);

        const event = {
            Records: [
                {
                    body: JSON.stringify({
                        eventSourceARN: "arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000",
                        eventName: "INSERT",
                        dynamodb: {
                            NewImage: serializedJSONb
                        }
                    })
                }
            ]
        };

        await processStreamEvent(
            event,
            exampleContext(),
            () => {
                return;
            }
        );

        const vehicleResultSet = await executeSql(
            `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
             FROM \`vehicle\`
             WHERE \`vehicle\`.\`id\` IN (
                SELECT \`id\`
                FROM \`vehicle\`
                WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER"
             )`
        );

        expect(vehicleResultSet.rows.length).toEqual(1);
        expect(vehicleResultSet.rows[0].system_number).toEqual("SYSTEM-NUMBER");
        expect(vehicleResultSet.rows[0].vin).toEqual("VIN");
        expect(vehicleResultSet.rows[0].vrm_trm).toEqual("VRM");
        expect(vehicleResultSet.rows[0].trailer_id).toEqual("88888888");
        expect((vehicleResultSet.rows[0].createdAt as Date).toUTCString()).not.toBeNull();

        const testResultSet = await executeSql(
            `SELECT \`test_station_id\`, \`tester_id\`, \`vehicle_class_id\`, \`preparer_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`,
                    \`fuel_emission_id\`, \`test_type_id\`, \`id\`, \`testResultId\`, \`testCode\`,  \`certificateNumber\`,  \`secondaryCertificateNumber\`,
                    \`testExpiryDate\`,  \`testAnniversaryDate\`,  \`testTypeStartTimestamp\`,  \`numberOfSeatbeltsFitted\`, \`lastSeatbeltInstallationCheckDate\`,
                    \`seatbeltInstallationCheckDate\`,  \`testResult\`,  \`reasonForAbandoning\`,  \`additionalNotesRecorded\`,  \`additionalCommentsForAbandon\`,
                    \`particulateTrapFitted\`,  \`particulateTrapSerialNumber\`,  \`modificationTypeUsed\`, \`smokeTestKLimitApplied\`
            FROM \`test_result\`
            WHERE \`test_result\`.\`vehicle_id\` = ${vehicleResultSet.rows[0].id}`
        );

        expect(testResultSet.rows[0].testResultId).toEqual("TEST-RESULT-ID");
        expect(testResultSet.rows.length).toEqual(1);
        expect(testResultSet.rows[0].testCode).toEqual("444");
        expect(testResultSet.rows[0].certificateNumber).toEqual("W323232");
        expect(testResultSet.rows[0].secondaryCertificateNumber).toEqual("111111");
        expect(testResultSet.rows[0].testExpiryDate).toEqual(new Date("2022-01-01"));
        expect(testResultSet.rows[0].testAnniversaryDate).toEqual(new Date("2022-01-01"));
        expect((testResultSet.rows[0].testTypeStartTimestamp as Date).toISOString()).toEqual("2021-01-01T00:00:00.000Z");
        expect((testResultSet.rows[0].lastSeatbeltInstallationCheckDate as Date).toISOString()).toEqual("2021-01-01T00:00:00.000Z");
        expect(testResultSet.rows[0].seatbeltInstallationCheckDate).toEqual(0);
        expect(testResultSet.rows[0].testResult).toEqual("pass");
        expect(testResultSet.rows[0].reasonForAbandoning).toEqual("NEW-REASON-FOR-ABANDONING");
        expect(testResultSet.rows[0].additionalNotesRecorded).toEqual("NEW-ADDITIONAL-NOTES-RECORDED");
        expect(testResultSet.rows[0].particulateTrapFitted).toEqual("t");
        expect(testResultSet.rows[0].particulateTrapSerialNumber).toEqual("trap");
        expect(testResultSet.rows[0].modificationTypeUsed).toEqual("NEW-MODIFICATION-TYPE-USED");
        expect(testResultSet.rows[0].smokeTestKLimitApplied).toEqual("NEW-SMOKE-TEST-K-LIMIT-APPLIED");

        const { test_station_id, tester_id, vehicle_class_id, preparer_id, createdBy_Id, lastUpdatedBy_Id, fuel_emission_id, test_type_id, id } = testResultSet.rows[0];

        const testStationResultSet = await executeSql(
            `SELECT \`pNumber\`, \`name\`, \`type\`
             FROM \`test_station\`
             WHERE \`test_station\`.\`id\` = ${test_station_id}`
        );
        expect(testStationResultSet.rows.length).toEqual(1);
        expect(testStationResultSet.rows[0].pNumber).toEqual("P-NUMBER");
        expect(testStationResultSet.rows[0].name).toEqual("TEST-STATION-NAME");
        expect(testStationResultSet.rows[0].type).toEqual("atf");

        const testerResultSet = await executeSql(
            `SELECT \`staffId\`, \`name\`, \`email_address\`
             FROM \`tester\`
             WHERE \`tester\`.\`id\` = ${tester_id}`
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
             WHERE \`vehicle_class\`.\`id\` = ${vehicle_class_id}`
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
             WHERE \`preparer\`.\`id\` = ${preparer_id}`
        );
        expect(preparerResultSet.rows.length).toEqual(1);
        expect(preparerResultSet.rows[0].preparerId).toEqual("999999999");
        expect(preparerResultSet.rows[0].name).toEqual("PREPARER-NAME");

        const createdByResultSet = await executeSql(
            `SELECT \`identityId\`, \`name\`
             FROM \`identity\`
             WHERE \`identity\`.\`id\` = ${createdBy_Id}`
        );
        expect(createdByResultSet.rows.length).toEqual(1);
        expect(createdByResultSet.rows[0].identityId).toEqual("CREATED-BY-ID");
        expect(createdByResultSet.rows[0].name).toEqual("CREATED-BY-NAME");

        const lastUpdatedByResultSet = await executeSql(
            `SELECT \`identityId\`, \`name\`
             FROM \`identity\`
             WHERE \`identity\`.\`id\` = ${lastUpdatedBy_Id}`
        );
        expect(lastUpdatedByResultSet.rows.length).toEqual(1);
        expect(lastUpdatedByResultSet.rows[0].identityId).toEqual("LAST-UPDATED-BY-ID");
        expect(lastUpdatedByResultSet.rows[0].name).toEqual("LAST-UPDATED-BY-NAME");

        const fuelEmissionResultSet = await executeSql(
            `SELECT \`modTypeCode\`, \`description\`, \`emissionStandard\`, \`fuelType\`
             FROM \`fuel_emission\`
             WHERE \`fuel_emission\`.\`id\` = ${fuel_emission_id}`
        );
        expect(fuelEmissionResultSet.rows.length).toEqual(1);
        expect(fuelEmissionResultSet.rows[0].modTypeCode).toEqual("p");
        expect(fuelEmissionResultSet.rows[0].description).toEqual("particulate trap");
        expect(fuelEmissionResultSet.rows[0].emissionStandard).toEqual("0.10 g/kWh Euro 3 PM");
        expect(fuelEmissionResultSet.rows[0].fuelType).toEqual("diesel");

        const testTypeResultSet = await executeSql(
            `SELECT \`testTypeClassification\`, \`testTypeName\`
             FROM \`test_type\`
             WHERE \`test_type\`.\`id\` = ${test_type_id}`
        );
        expect(testTypeResultSet.rows.length).toEqual(1);
        expect(testTypeResultSet.rows[0].testTypeClassification).toEqual("2323232323232323232323");
        expect(testTypeResultSet.rows[0].testTypeName).toEqual("TEST-TYPE-NAME");

        const testDefectResultSet = await executeSql(
            `SELECT \`test_result_id\`, \`defect_id\`, \`location_id\`, \`notes\`, \`prs\`, \`prohibitionIssued\`
             FROM \`test_defect\`
             WHERE \`test_defect\`.\`test_result_id\` = ${id}`
        );

        const testDefectLastIndex = testDefectResultSet.rows.length - 1;

        expect(testDefectResultSet.rows[testDefectLastIndex].test_result_id).toEqual(id);
        expect(testDefectResultSet.rows[testDefectLastIndex].defect_id).toEqual(1);
        expect(testDefectResultSet.rows[testDefectLastIndex].location_id).toEqual(1);
        expect(testDefectResultSet.rows[testDefectLastIndex].notes).toEqual("NOTES");
        expect(testDefectResultSet.rows[testDefectLastIndex].prs).toEqual(1);
        expect(testDefectResultSet.rows[testDefectLastIndex].prohibitionIssued).toEqual(1);

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
             WHERE \`defect\`.\`id\` = ${testDefectResultSet.rows[testDefectLastIndex].defect_id}`
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

        const customDefectResultSet = await executeSql(
            `SELECT \`test_result_id\`, \`referenceNumber\`, \`defectName\`, \`defectNotes\`
             FROM \`custom_defect\`
             WHERE \`custom_defect\`.\`test_result_id\` = ${id}`
        );

        const customDefectLastIndex = customDefectResultSet.rows.length - 1;

        expect(customDefectResultSet.rows[customDefectLastIndex].test_result_id).toEqual(id);
        expect(customDefectResultSet.rows[customDefectLastIndex].referenceNumber).toEqual("1010101010");
        expect(customDefectResultSet.rows[customDefectLastIndex].defectName).toEqual("DEFECT-NAME");
        expect(customDefectResultSet.rows[customDefectLastIndex].defectNotes).toEqual("DEFECT-NOTES");

    });
    it("A new Test Result with two TestTypes is inserted correctly", async () => {

        const event = {
            Records: [
                {
                    body: JSON.stringify({
                        eventSourceARN: "arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000",
                        eventName: "INSERT",
                        dynamodb: {
                            NewImage: testResultsJsonWithTestTypes
                        }
                    })
                }
            ]
        };

        await processStreamEvent(
            event,
            exampleContext(),
            () => {
                return;
            }
        );

        const vehicleResultSet = await executeSql(
            `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
             FROM \`vehicle\`
             WHERE \`vehicle\`.\`id\` IN (
                SELECT \`id\`
                FROM \`vehicle\`
                WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-1"
             )`
        );

        expect(vehicleResultSet.rows.length).toEqual(1);
        expect(vehicleResultSet.rows[0].system_number).toEqual("SYSTEM-NUMBER-1");
        expect(vehicleResultSet.rows[0].vin).toEqual("VIN");
        expect(vehicleResultSet.rows[0].vrm_trm).toEqual("VRM");
        expect(vehicleResultSet.rows[0].trailer_id).toEqual("88888888");
        expect((vehicleResultSet.rows[0].createdAt as Date).toUTCString()).not.toBeNull();

        const testResultSet = await executeSql(
            `SELECT \`test_station_id\`, \`tester_id\`, \`vehicle_class_id\`, \`preparer_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`,
                    \`fuel_emission_id\`, \`test_type_id\`, \`id\`, \`testResultId\`, \`testCode\`,  \`certificateNumber\`,  \`secondaryCertificateNumber\`,
                    \`testExpiryDate\`,  \`testAnniversaryDate\`,  \`testTypeStartTimestamp\`,  \`numberOfSeatbeltsFitted\`, \`lastSeatbeltInstallationCheckDate\`,
                    \`seatbeltInstallationCheckDate\`,  \`testResult\`,  \`reasonForAbandoning\`,  \`additionalNotesRecorded\`,  \`additionalCommentsForAbandon\`,
                    \`particulateTrapFitted\`,  \`particulateTrapSerialNumber\`,  \`modificationTypeUsed\`, \`smokeTestKLimitApplied\`, \`testTypeEndTimestamp\`
            FROM \`test_result\`
            WHERE \`test_result\`.\`vehicle_id\` = ${vehicleResultSet.rows[0].id}
            ORDER BY id ASC`
        );

        expect(testResultSet.rows.length).toEqual(2);

        expect(testResultSet.rows[0].testResultId).toEqual("TEST-RESULT-ID-NEW");
        expect(testResultSet.rows[0].testCode).toEqual("333");
        expect(testResultSet.rows[0].certificateNumber).toEqual("999999999");
        expect(testResultSet.rows[0].secondaryCertificateNumber).toEqual("999999999");
        expect(testResultSet.rows[0].testExpiryDate).toEqual(new Date("2020-01-01"));
        expect(testResultSet.rows[0].testAnniversaryDate).toEqual(new Date("2020-01-01"));
        expect((testResultSet.rows[0].testTypeStartTimestamp as Date).toISOString()).toEqual("2020-01-01T00:00:00.000Z");
        expect((testResultSet.rows[0].testTypeEndTimestamp as Date).toISOString()).toEqual("2020-01-01T16:54:44.123Z");
        expect(testResultSet.rows[0].lastSeatbeltInstallationCheckDate).toEqual(new Date("2020-01-01"));
        expect(testResultSet.rows[0].seatbeltInstallationCheckDate).toEqual(1);
        expect(testResultSet.rows[0].testResult).toEqual("fail");
        expect(testResultSet.rows[0].reasonForAbandoning).toEqual("REASON-FOR-ABANDONING");
        expect(testResultSet.rows[0].additionalNotesRecorded).toEqual("ADDITIONAL-NOTES-RECORDED");
        expect(testResultSet.rows[0].particulateTrapFitted).toEqual("PARTICULATE-TRAP-FITTED");
        expect(testResultSet.rows[0].particulateTrapSerialNumber).toEqual("PARTICULATE-TRAP-SERIAL-NUMBER");
        expect(testResultSet.rows[0].modificationTypeUsed).toEqual("MODIFICATION-TYPE-USED");
        expect(testResultSet.rows[0].smokeTestKLimitApplied).toEqual("SMOKE-TEST-K-LIMIT-APPLIED");

        expect(testResultSet.rows[1].testResultId).toEqual("TEST-RESULT-ID-NEW");
        expect(testResultSet.rows[1].testCode).toEqual("aav");
        expect(testResultSet.rows[1].certificateNumber).toEqual("W123123");
        expect(testResultSet.rows[1].secondaryCertificateNumber).toBeNull();
        expect(testResultSet.rows[1].testExpiryDate).toEqual(new Date(2022, 5, 30));
        expect(testResultSet.rows[1].testAnniversaryDate).toEqual(new Date(2022, 5, 30));
        expect((testResultSet.rows[1].testTypeStartTimestamp as Date).toISOString()).toEqual("2021-06-21T12:07:22.000Z");
        expect((testResultSet.rows[1].testTypeEndTimestamp as Date).toISOString()).toEqual("2021-06-21T12:59:07.000Z");
        expect(testResultSet.rows[1].lastSeatbeltInstallationCheckDate).toBeNull();
        expect(testResultSet.rows[1].seatbeltInstallationCheckDate).toEqual(0);
        expect(testResultSet.rows[1].testResult).toEqual("pass");
        expect(testResultSet.rows[1].reasonForAbandoning).toBeNull();
        expect(testResultSet.rows[1].additionalNotesRecorded).toEqual("No emission plate default 0.70");
        expect(testResultSet.rows[1].particulateTrapFitted).toBeNull();
        expect(testResultSet.rows[1].particulateTrapSerialNumber).toBeNull();
        expect(testResultSet.rows[1].modificationTypeUsed).toBeNull();
        expect(testResultSet.rows[1].smokeTestKLimitApplied).toBeNull();

        const { test_station_id, tester_id, vehicle_class_id, preparer_id, createdBy_Id, lastUpdatedBy_Id, fuel_emission_id, test_type_id, id } = testResultSet.rows[0];

        const testStationResultSet = await executeSql(
            `SELECT \`pNumber\`, \`name\`, \`type\`
             FROM \`test_station\`
             WHERE \`test_station\`.\`id\` = ${test_station_id}`
        );

        expect(testStationResultSet.rows.length).toEqual(1);
        expect(testStationResultSet.rows[0].pNumber).toEqual("P-NUMBER-2");
        expect(testStationResultSet.rows[0].name).toEqual("TEST-STATION-NAME-2");
        expect(testStationResultSet.rows[0].type).toEqual("atf");

        const testerResultSet = await executeSql(
            `SELECT \`staffId\`, \`name\`, \`email_address\`
             FROM \`tester\`
             WHERE \`tester\`.\`id\` = ${tester_id}`
        );
        expect(testerResultSet.rows.length).toEqual(1);
        expect(testerResultSet.rows[0].staffId).toEqual("999999998");
        expect(testerResultSet.rows[0].name).toEqual("TESTER-NAME-2");
        expect(testerResultSet.rows[0].email_address).toEqual("TESTER-EMAIL-ADDRESS-2");

        const vehicleClassResultSet = await executeSql(
            `SELECT \`code\`,
                    \`description\`,
                    \`vehicleType\`,
                    \`vehicleSize\`,
                    \`vehicleConfiguration\`,
                    \`euVehicleCategory\`
             FROM \`vehicle_class\`
             WHERE \`vehicle_class\`.\`id\` = ${vehicle_class_id}`
        );
        expect(vehicleClassResultSet.rows.length).toEqual(1);
        expect(vehicleClassResultSet.rows[0].code).toEqual("v");
        expect(vehicleClassResultSet.rows[0].description).toEqual("heavy goods vehicle");
        expect(vehicleClassResultSet.rows[0].vehicleType).toEqual("hgv");
        expect(vehicleClassResultSet.rows[0].vehicleSize).toEqual("large");
        expect(vehicleClassResultSet.rows[0].vehicleConfiguration).toEqual("rigid");
        expect(vehicleClassResultSet.rows[0].euVehicleCategory).toEqual("m1");

        const preparerResultSet = await executeSql(
            `SELECT \`preparerId\`, \`name\`
             FROM \`preparer\`
             WHERE \`preparer\`.\`id\` = ${preparer_id}`
        );
        expect(preparerResultSet.rows.length).toEqual(1);
        expect(preparerResultSet.rows[0].preparerId).toEqual("999999998");
        expect(preparerResultSet.rows[0].name).toEqual("PREPARER-NAME-2");

        const createdByResultSet = await executeSql(
            `SELECT \`identityId\`, \`name\`
             FROM \`identity\`
             WHERE \`identity\`.\`id\` = ${createdBy_Id}`
        );
        expect(createdByResultSet.rows.length).toEqual(1);
        expect(createdByResultSet.rows[0].identityId).toEqual("CREATED-BY-ID-2");
        expect(createdByResultSet.rows[0].name).toEqual("CREATED-BY-NAME-2");

        const lastUpdatedByResultSet = await executeSql(
            `SELECT \`identityId\`, \`name\`
             FROM \`identity\`
             WHERE \`identity\`.\`id\` = ${lastUpdatedBy_Id}`
        );
        expect(lastUpdatedByResultSet.rows.length).toEqual(1);
        expect(lastUpdatedByResultSet.rows[0].identityId).toEqual("LAST-UPDATED-BY-ID-2");
        expect(lastUpdatedByResultSet.rows[0].name).toEqual("LAST-UPDATED-BY-NAME-2");

        const fuelEmissionResultSet = await executeSql(
            `SELECT \`modTypeCode\`, \`description\`, \`emissionStandard\`, \`fuelType\`
             FROM \`fuel_emission\`
             WHERE \`fuel_emission\`.\`id\` = ${fuel_emission_id}`
        );
        expect(fuelEmissionResultSet.rows.length).toEqual(1);
        expect(fuelEmissionResultSet.rows[0].modTypeCode).toEqual("p");
        expect(fuelEmissionResultSet.rows[0].description).toEqual("particulate trap");
        expect(fuelEmissionResultSet.rows[0].emissionStandard).toEqual("0.10 g/kWh Euro 3 PM");
        expect(fuelEmissionResultSet.rows[0].fuelType).toEqual("diesel");

        const testTypeResultSet = await executeSql(
            `SELECT \`testTypeClassification\`, \`testTypeName\`
             FROM \`test_type\`
             WHERE \`test_type\`.\`id\` = ${test_type_id}`
        );
        expect(testTypeResultSet.rows.length).toEqual(1);
        expect(testTypeResultSet.rows[0].testTypeClassification).toEqual("2323232323232323232323");
        expect(testTypeResultSet.rows[0].testTypeName).toEqual("TEST-TYPE-NAME");


        const testDefectResultSet = await executeSql(
            `SELECT \`test_result_id\`, \`defect_id\`, \`location_id\`, \`notes\`, \`prs\`, \`prohibitionIssued\`
             FROM \`test_defect\`
             WHERE \`test_defect\`.\`test_result_id\` = ${id}`
        );

        const testDefectLastIndex = testDefectResultSet.rows.length - 1;

        expect(testDefectResultSet.rows[testDefectLastIndex].test_result_id).toEqual(id);
        expect(testDefectResultSet.rows[testDefectLastIndex].defect_id).toEqual(1);
        expect(testDefectResultSet.rows[testDefectLastIndex].location_id).toEqual(1);
        expect(testDefectResultSet.rows[testDefectLastIndex].notes).toEqual("NOTES");
        expect(testDefectResultSet.rows[testDefectLastIndex].prs).toEqual(1);
        expect(testDefectResultSet.rows[testDefectLastIndex].prohibitionIssued).toEqual(1);

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
             WHERE \`defect\`.\`id\` = ${testDefectResultSet.rows[testDefectLastIndex].defect_id}`
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

        const customDefectResultSet = await executeSql(
            `SELECT \`test_result_id\`, \`referenceNumber\`, \`defectName\`, \`defectNotes\`
             FROM \`custom_defect\`
             WHERE \`custom_defect\`.\`test_result_id\` = ${id}`
        );

        const customDefectLastIndex = customDefectResultSet.rows.length - 1;

        expect(customDefectResultSet.rows[customDefectLastIndex].test_result_id).toEqual(id);
        expect(customDefectResultSet.rows[customDefectLastIndex].referenceNumber).toEqual("1010101010");
        expect(customDefectResultSet.rows[customDefectLastIndex].defectName).toEqual("DEFECT-NAME");
        expect(customDefectResultSet.rows[customDefectLastIndex].defectNotes).toEqual("DEFECT-NOTES");

    });
});
