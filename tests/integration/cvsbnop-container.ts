import {spawnSync} from "child_process";
import {pathToResources} from "../utils";
import {GenericContainer, StartedTestContainer} from "testcontainers";
import {Port} from "testcontainers/dist/port";
import {PoolOptions} from "mysql2";
import {getPoolOptions} from "../../src/services/database-configuration";

export const containerMySqlPort: Port = 3306;

const databaseName: string = "CVSBNOP"; // match `${pathToResources()}/Dockerfile`

export const getContainerizedDatabase = async (): Promise<StartedTestContainer> => {
    const containerDefinition = (await GenericContainer.fromDockerfile(pathToResources(), "Dockerfile").build())
        .withExposedPorts(containerMySqlPort);

    const container: StartedTestContainer = await containerDefinition.start();

    const hostPort: Port = container.getMappedPort(containerMySqlPort);

    console.log(`MySQL container '${container.getName()}' started on port ${hostPort} (ID: ${container.getId()})`);

    const liquibaseExecutable = process.platform === "win32" ? "liquibase.bat" : "liquibase";

    const liquibaseProcess = spawnSync(liquibaseExecutable, [
        "--changeLogFile", "cvs-nop/changelog-master.xml",
        "--username", "root",
        "--password", "12345",
        "--url", `jdbc:mysql://localhost:${hostPort}/${databaseName}`,
        "--classpath", `${pathToResources()}/mysql-connector-java-8.0.23.jar`,
        "update"
    ]);

    console.log(`Liquibase process started with PID ${liquibaseProcess.pid}`);
    console.log(liquibaseProcess.output.toString());

    mockPoolOptions(container);

    return container;
};

const mockPoolOptions = (container: StartedTestContainer): void => {
    const poolOptions: PoolOptions = getPoolOptions();

    (getPoolOptions as jest.Mock) = jest.fn().mockReturnValue({
        ...poolOptions,
        port: container.getMappedPort(containerMySqlPort)
    });
};
