import {StartedTestContainer} from "testcontainers";
import {destroyConnectionPool, execute} from "../../src/services/connection-pool";
import {castToImageShape} from "../utils";
import testResultsJson from "../resources/dynamodb-image-test-results.json";
import {DynamoDbImage} from "../../src/services/dynamodb-images";
import {getContainerizedDatabase} from "./cvsbnop-container";
import {convertTestResults} from "../../src/services/test-result-record-conversion";

describe("convertTestResults() integration tests", () => {
    let container: StartedTestContainer;

    beforeAll(async () => {
        jest.setTimeout(300_000);
        container = await getContainerizedDatabase();
    });

    afterAll(async () => {
        await destroyConnectionPool();
        await container.stop();
    });

    it("should correctly convert a DynamoDB event into Aurora rows", async () => {
        await convertTestResults("INSERT", DynamoDbImage.parse(castToImageShape(testResultsJson)));

        // TODO expand this SELECT to '*', check every row
        const response = await execute("SELECT `system_number` FROM `vehicle` WHERE `vehicle`.`vin` = 'VIN'");

        expect(response.rows[0].system_number).toEqual("SYSTEM-NUMBER");
    });
});
