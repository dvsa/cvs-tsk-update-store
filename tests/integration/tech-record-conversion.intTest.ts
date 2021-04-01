import {StartedTestContainer} from "testcontainers";
import {destroyConnectionPool, execute} from "../../src/services/connection-pool";
import {castToImageShape} from "../utils";
import {convertTechRecordDocument} from "../../src/services/tech-record-conversion";
import techRecordDocumentJson from "../resources/dynamodb-image-technical-record.json";
import {DynamoDbImage} from "../../src/services/dynamodb-images";
import {getContainerizedDatabase} from "./cvsbnop-container";

describe.skip("convertTechRecordDocument() integration tests", () => {
    let container: StartedTestContainer;

    beforeAll(async () => {
        jest.setTimeout(60_000);
        container = await getContainerizedDatabase();
    });

    afterAll(async () => {
        await destroyConnectionPool();
        await container.stop();
    });

    it("should correctly convert a DynamoDB event into Aurora rows", async () => {
        await convertTechRecordDocument("INSERT", DynamoDbImage.parse(castToImageShape(techRecordDocumentJson)));

        // TODO expand this SELECT to '*', check every row
        const response = await execute("SELECT `system_number` FROM `vehicle` WHERE `vehicle`.`vin` = 'VIN'");

        expect(response.rows[0].system_number).toEqual("SYSTEM-NUMBER");
    });
});
