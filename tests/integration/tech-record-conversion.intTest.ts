import {StartedTestContainer} from "testcontainers";
import {getConnectionPoolConfiguration} from "../../src/services/database-configuration";
import {PoolOptions} from "mysql2";
import {destroyConnectionPool, execute} from "../../src/services/connection-pool";
import {castToImageShape} from "../utils";
import {convertTechRecordDocument} from "../../src/services/tech-record-conversion";
import techRecordDocumentJson from "../resources/dynamodb-image-technical-record.json";
import {DynamoDbImage} from "../../src/services/dynamodb-images";
import {containerMySqlPort, getContainerizedDatabase} from "./cvsbnop-container";

describe.skip("convertTechRecordDocument() integration tests", () => {
    let container: StartedTestContainer;

    beforeAll(async () => {
        container = await getContainerizedDatabase();

        const actualPoolConfig: PoolOptions = getConnectionPoolConfiguration();
        (getConnectionPoolConfiguration as jest.Mock) = jest.fn().mockReturnValue({
            ...actualPoolConfig,
            port: container.getMappedPort(containerMySqlPort)
        });
    }, 1000000);

    afterAll(async () => {
        await destroyConnectionPool();
        await container.stop();
    }, 1000000);

    it("should correctly convert a DynamoDB event into Aurora rows", async () => {
        await convertTechRecordDocument("INSERT", DynamoDbImage.parse(castToImageShape(techRecordDocumentJson)));

        // TODO expand this SELECT to '*', check every row
        const response = await execute("SELECT `system_number` FROM `vehicle` WHERE `vehicle`.`vin` = 'VIN'");

        expect(response.rows[0].system_number).toEqual("SYSTEM-NUMBER");
    }, 1000000);
});
