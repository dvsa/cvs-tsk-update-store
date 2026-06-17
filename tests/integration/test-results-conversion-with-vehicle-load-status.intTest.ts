/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import { StartedTestContainer } from 'testcontainers';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  destroyConnectionPool,
  executeSql,
} from '../../src/services/connection-pool';
import { exampleContext, useLocalDb } from '../utils';
import { getContainerizedDatabase } from './cvsbnop-container';
import { processStreamEvent } from '../../src/functions/process-stream-event';
import { getConnectionPoolOptions } from '../../src/services/connection-pool-options';

useLocalDb();
jest.setTimeout(60_000);

describe('convertTestResults() integration tests with vehicle load status', () => {
  let container: StartedTestContainer;
  const testResultsJsonWithVehicleLoadStatus = JSON.parse(
    JSON.stringify(
      require('../resources/dynamodb-image-test-results-with-vehicle-load-status.json'),
    ),
  );
  const testResultId = testResultsJsonWithVehicleLoadStatus.testResultId.S;

  beforeAll(async () => {
    delete process.env.DISABLE_DELETE_ON_UPDATE;
    jest.restoreAllMocks();

    // see README for why this environment variable exists
    if (process.env.USE_CONTAINERIZED_DATABASE === '1') {
      container = await getContainerizedDatabase();
    } else {
      (getConnectionPoolOptions as jest.Mock) = jest.fn().mockResolvedValue({
        host: '127.0.0.1',
        port: '3306',
        user: 'root',
        password: '12345',
        database: 'CVSBNOP',
      });
    }
  });

  afterAll(async () => {
    await destroyConnectionPool();
    if (process.env.USE_CONTAINERIZED_DATABASE === '1' && container) {
      await container.stop();
    }
  });

  it('should correctly convert vehicle load status into Aurora rows', async () => {
    await processStreamEvent(
      buildEvent(testResultsJsonWithVehicleLoadStatus),
      exampleContext(),
      jest.fn(),
    );

    const vehicleLoadStatusSet = await selectVehicleLoadStatus();

    expect(vehicleLoadStatusSet.rows).toEqual([
      {
        testNumber: 'LOAD-STATUS-1',
        load_status: 'Unladen',
        unladen_body_type: 'Box',
        other_unladen_body_type: 'LOAD-OTHER-BODY',
        reason_for_not_loading: 'Tanker',
        other_reason_for_not_loading: 'LOAD-OTHER-REASON',
        partially_laden_reason: 'LOAD-PARTIAL-REASON',
      },
    ]);

    const nullLookupRows = await selectNullLookupRows();
    expect(nullLookupRows.rows).toEqual([
      { table_name: 'load_status', row_count: 0 },
      { table_name: 'reason_for_not_loading', row_count: 0 },
      { table_name: 'unladen_body_type', row_count: 0 },
    ]);
  });

  it('should replace old vehicle load status rows when the test result is updated', async () => {
    const updatedTestResult = unmarshall(testResultsJsonWithVehicleLoadStatus);
    updatedTestResult.testTypes[0].load_status = 'Fully laden';
    delete updatedTestResult.testTypes[0].unladen_body_type;
    delete updatedTestResult.testTypes[0].reason_for_not_loading;
    updatedTestResult.testTypes[0].other_unladen_body_type = 'UPDATED-OTHER-BODY';
    updatedTestResult.testTypes[0].other_reason_for_not_loading = 'UPDATED-OTHER-REASON';
    updatedTestResult.testTypes[0].partially_laden_reason = 'UPDATED-PARTIAL-REASON';
    updatedTestResult.testTypes[1].load_status = 'Partially laden';
    updatedTestResult.testTypes[1].reason_for_not_loading = 'Other';

    await processStreamEvent(
      buildEvent(marshall(updatedTestResult), 'MODIFY'),
      exampleContext(),
      jest.fn(),
    );

    const vehicleLoadStatusSet = await selectVehicleLoadStatus();

    expect(vehicleLoadStatusSet.rows).toEqual([
      {
        testNumber: 'LOAD-STATUS-1',
        load_status: 'Fully laden',
        unladen_body_type: null,
        other_unladen_body_type: 'UPDATED-OTHER-BODY',
        reason_for_not_loading: null,
        other_reason_for_not_loading: 'UPDATED-OTHER-REASON',
        partially_laden_reason: 'UPDATED-PARTIAL-REASON',
      },
      {
        testNumber: 'LOAD-STATUS-2',
        load_status: 'Partially laden',
        unladen_body_type: null,
        other_unladen_body_type: null,
        reason_for_not_loading: 'Other',
        other_reason_for_not_loading: null,
        partially_laden_reason: null,
      },
    ]);

    const oldVehicleLoadStatusSet = await executeSql(
      `SELECT vls.id
          FROM vehicle_load_status vls
          INNER JOIN test_result tr ON vls.test_type_id = tr.test_type_id
          LEFT JOIN load_status ls ON vls.load_status_id = ls.id
          LEFT JOIN unladen_body_type ubt ON vls.unladen_body_type_id = ubt.id
          LEFT JOIN reason_for_not_loading rfnl ON vls.reason_for_not_loading_id = rfnl.id
          WHERE tr.testResultId = "${testResultId}"
            AND (
              ls.load_status = "Unladen"
              OR ubt.unladen_body_type = "Box"
              OR rfnl.reason_for_not_loading = "Tanker"
            )`,
    );
    expect(oldVehicleLoadStatusSet.rows).toHaveLength(0);
  });

  function buildEvent(newImage: any, eventName = 'INSERT') {
    return {
      Records: [
        {
          body: JSON.stringify({
            eventSourceARN:
            'arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000',
            eventName,
            dynamodb: {
              NewImage: newImage,
            },
          }),
        },
      ],
    };
  }

  async function selectVehicleLoadStatus() {
    return executeSql(
      `SELECT tr.testNumber,
              ls.load_status,
              ubt.unladen_body_type,
              vls.other_unladen_body_type,
              rfnl.reason_for_not_loading,
              vls.other_reason_for_not_loading,
              vls.partially_laden_reason
          FROM vehicle_load_status vls
          INNER JOIN test_result tr ON vls.test_type_id = tr.test_type_id
          LEFT JOIN load_status ls ON vls.load_status_id = ls.id
          LEFT JOIN unladen_body_type ubt ON vls.unladen_body_type_id = ubt.id
          LEFT JOIN reason_for_not_loading rfnl ON vls.reason_for_not_loading_id = rfnl.id
          WHERE tr.testResultId = "${testResultId}"
          ORDER BY tr.testNumber`,
    );
  }

  async function selectNullLookupRows() {
    return executeSql(
      `SELECT "load_status" table_name, COUNT(*) row_count FROM load_status WHERE load_status IS NULL
          UNION ALL
        SELECT "reason_for_not_loading" table_name, COUNT(*) row_count FROM reason_for_not_loading WHERE reason_for_not_loading IS NULL
          UNION ALL
        SELECT "unladen_body_type" table_name, COUNT(*) row_count FROM unladen_body_type WHERE unladen_body_type IS NULL
          ORDER BY table_name`,
    );
  }
});
