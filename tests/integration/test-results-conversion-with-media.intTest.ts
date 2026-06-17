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

describe('convertTestResults() integration tests with media', () => {
  let container: StartedTestContainer;
  const testResultsJsonWithMedia = JSON.parse(
    JSON.stringify(
      require('../resources/dynamodb-image-test-results-with-media.json'),
    ),
  );
  const testResultId = testResultsJsonWithMedia.testResultId.S;

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

  it('should correctly convert test-result and defect media into Aurora rows', async () => {
    await processStreamEvent(buildEvent(testResultsJsonWithMedia), exampleContext(), jest.fn());

    const testResultSet = await executeSql(
      `SELECT id FROM test_result WHERE testResultId = "${testResultId}"`,
    );
    expect(testResultSet.rows).toHaveLength(2);

    const testResultMediaSet = await selectTestResultMedia();
    expect(testResultMediaSet.rows).toHaveLength(testResultSet.rows.length);
    testResultMediaSet.rows.forEach((row: any) => {
      expect(row.path).toBe('test-result-media-path-1.jpg');
      expect(row.reason).toBe('TEST-RESULT-MEDIA-REASON');
      expect(row.type).toBe('failReason');
    });

    const defectMediaSet = await selectDefectMedia();
    expect(defectMediaSet.rows).toEqual([
      {
        path: 'defect-media-path-1.jpg',
        reason: 'DEFECT-MEDIA-REASON',
        type: 'failReason',
      },
      {
        path: 'defect-media-path-2.jpg',
        reason: 'SECOND-DEFECT-MEDIA-REASON',
        type: 'failReason',
      },
    ]);
  });

  it('should replace old media rows when the test result is updated', async () => {
    const deserializedJson = unmarshall(testResultsJsonWithMedia);
    deserializedJson.media = [
      {
        path: 'test-result-media-path-2.jpg',
        reason: 'UPDATED-TEST-RESULT-MEDIA-REASON',
        type: 'failReason',
      },
    ];
    deserializedJson.testTypes[0].defects[0].media = [
      {
        path: 'defect-media-path-3.jpg',
        reason: 'UPDATED-DEFECT-MEDIA-REASON',
        type: 'failReason',
      },
      {
        path: 'defect-media-path-4.jpg',
        reason: 'SECOND-UPDATED-DEFECT-MEDIA-REASON',
        type: 'failReason',
      },
    ];

    await processStreamEvent(buildEvent(marshall(deserializedJson), 'MODIFY'), exampleContext(), jest.fn());

    const testResultMediaSet = await selectTestResultMedia();
    expect(testResultMediaSet.rows).toHaveLength(2);
    testResultMediaSet.rows.forEach((row: any) => {
      expect(row.path).toBe('test-result-media-path-2.jpg');
      expect(row.reason).toBe('UPDATED-TEST-RESULT-MEDIA-REASON');
      expect(row.type).toBe('failReason');
    });

    const oldTestResultMediaSet = await executeSql(
      `SELECT trm.id
          FROM test_result_media trm
          INNER JOIN test_result tr ON trm.test_result_id = tr.id
          WHERE tr.testResultId = "${testResultId}"
            AND trm.path = "test-result-media-path-1.jpg"`,
    );
    expect(oldTestResultMediaSet.rows).toHaveLength(0);

    const defectMediaSet = await selectDefectMedia();
    expect(defectMediaSet.rows).toEqual([
      {
        path: 'defect-media-path-3.jpg',
        reason: 'UPDATED-DEFECT-MEDIA-REASON',
        type: 'failReason',
      },
      {
        path: 'defect-media-path-4.jpg',
        reason: 'SECOND-UPDATED-DEFECT-MEDIA-REASON',
        type: 'failReason',
      },
    ]);

    const oldDefectMediaSet = await executeSql(
      `SELECT dm.id
          FROM defect_media dm
          INNER JOIN test_defect td ON dm.test_defect_id = td.id
          INNER JOIN test_result tr ON td.test_result_id = tr.id
          WHERE tr.testResultId = "${testResultId}"
            AND dm.path IN ("defect-media-path-1.jpg", "defect-media-path-2.jpg")`,
    );
    expect(oldDefectMediaSet.rows).toHaveLength(0);
  });

  it('should correctly convert image and video media without reasons into Aurora rows', async () => {
    const deserializedJson = unmarshall(testResultsJsonWithMedia);
    deserializedJson.media = [
      {
        path: 'test-result-media-image-1.jpg',
        type: 'image',
      },
      {
        path: 'test-result-media-video-1.mp4',
        type: 'video',
      },
    ];
    deserializedJson.testTypes[0].defects[0].media = [
      {
        path: 'defect-media-image-1.jpg',
        type: 'image',
      },
      {
        path: 'defect-media-video-1.mp4',
        type: 'video',
      },
    ];

    await processStreamEvent(buildEvent(marshall(deserializedJson), 'MODIFY'), exampleContext(), jest.fn());

    const testResultSet = await executeSql(
      `SELECT id FROM test_result WHERE testResultId = "${testResultId}"`,
    );
    expect(testResultSet.rows).toHaveLength(2);

    const testResultMediaSet = await selectTestResultMedia();
    expect(testResultMediaSet.rows).toHaveLength(testResultSet.rows.length * 2);
    testResultMediaSet.rows.forEach((row: any) => {
      expect(row.reason).toBeNull();
    });
    expect(testResultMediaSet.rows.filter((row: any) => (
      row.path === 'test-result-media-image-1.jpg'
      && row.type === 'image'
    ))).toHaveLength(testResultSet.rows.length);
    expect(testResultMediaSet.rows.filter((row: any) => (
      row.path === 'test-result-media-video-1.mp4'
      && row.type === 'video'
    ))).toHaveLength(testResultSet.rows.length);

    const defectMediaSet = await selectDefectMedia();
    expect(defectMediaSet.rows).toEqual([
      {
        path: 'defect-media-image-1.jpg',
        reason: null,
        type: 'image',
      },
      {
        path: 'defect-media-video-1.mp4',
        reason: null,
        type: 'video',
      },
    ]);
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

  async function selectTestResultMedia() {
    return executeSql(
      `SELECT trm.path, trm.reason, mt.type
          FROM test_result_media trm
          INNER JOIN media_type mt ON trm.media_type_id = mt.id
          INNER JOIN test_result tr ON trm.test_result_id = tr.id
          WHERE tr.testResultId = "${testResultId}"
          ORDER BY tr.testNumber, trm.path`,
    );
  }

  async function selectDefectMedia() {
    return executeSql(
      `SELECT dm.path, dm.reason, mt.type
          FROM defect_media dm
          INNER JOIN media_type mt ON dm.media_type_id = mt.id
          INNER JOIN test_defect td ON dm.test_defect_id = td.id
          INNER JOIN test_result tr ON td.test_result_id = tr.id
          WHERE tr.testResultId = "${testResultId}"
          ORDER BY dm.path`,
    );
  }
});
