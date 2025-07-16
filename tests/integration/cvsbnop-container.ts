import { spawnSync } from 'child_process';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { PoolOptions } from 'mysql2';
import { pathToResources } from '../utils';
import { getConnectionPoolOptions } from '../../src/services/connection-pool-options';

export const containerMySqlPort = 3306;

const databaseName: string = 'CVSBNOP'; // match `${pathToResources()}/Dockerfile`

export const getContainerizedDatabase = async (): Promise<StartedTestContainer> => {
  const containerDefinition = (
    await GenericContainer.fromDockerfile(
      pathToResources(),
      'Dockerfile',
    ).build()
  ).withExposedPorts(containerMySqlPort);

  const container: StartedTestContainer = await containerDefinition.start();

  const hostPort = container.getMappedPort(containerMySqlPort);

  console.log(
    `MySQL container '${container.getName()}' started on port ${hostPort} (ID: ${container.getId()})`,
  );

  const liquibaseExecutable = process.platform === 'win32' ? 'liquibase.bat' : 'liquibase';

  const liquibaseProcess = spawnSync(liquibaseExecutable, [
    '--changeLogFile',
    'cvs-nop/changelog-master.xml',
    '--username',
    'root',
    '--password',
    '12345',
    '--url',
    `jdbc:mysql://127.0.0.1:${hostPort}/${databaseName}`,
    '--classpath',
    `${pathToResources()}/mysql-connector-java-8.0.23.jar`,
    'update',
  ]);

  console.log(`Liquibase process started with PID ${liquibaseProcess.pid}`);
  console.log(liquibaseProcess.output.toString());

  await mockPoolOptions(container);

  return container;
};

const mockPoolOptions = async (
  container: StartedTestContainer,
): Promise<void> => {
  const poolOptions: PoolOptions = await getConnectionPoolOptions();

  (getConnectionPoolOptions as jest.Mock) = jest.fn().mockReturnValue({
    ...poolOptions,
    port: container.getMappedPort(containerMySqlPort),
  });
};
