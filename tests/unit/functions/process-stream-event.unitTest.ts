import { mocked } from 'jest-mock';
import {
  getTableNameFromArn,
  processStreamEvent,
} from '../../../src/functions/process-stream-event';
import { convert } from '../../../src/services/entity-conversion';
import { exampleContext } from '../../utils';
import testResultWithTestType from '../../resources/dynamodb-image-test-results-with-testtypes.json';
import techRecordV3 from '../../resources/dynamodb-image-technical-record-V3.json';


jest.mock('../../../src/services/entity-conversion', () => ({
  convert: jest.fn(),
}));

describe('processStreamEvent()', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks()
    mocked(convert).mockResolvedValueOnce({});
  });

  it('should allow valid events to reach the entity conversion procedure TECHNICAL RECORD', async () => {
    await expect(
      processStreamEvent(
        {
          Records: [
            {
              body: JSON.stringify({
                eventName: 'INSERT',
                dynamodb: {
                  NewImage: techRecordV3
                },
                eventSourceARN:
                  'arn:aws:dynamodb:eu-west-1:1:table/flat-tech-records/stream/2020-01-01T00:00:00.000',
              }),
            },
          ],
        },
        exampleContext(),
        () => {

        },
      ),
    ).resolves.not.toThrow();
    expect(convert).toHaveBeenCalledTimes(1);
  });

  it('should allow valid events to reach the entity conversion procedure test RECORD TRL', async () => {
    await expect(
        processStreamEvent(
            {
              Records: [
                {
                  body: JSON.stringify({
                    eventName: 'INSERT',
                    dynamodb: {
                      NewImage: testResultWithTestType,
                    },
                    eventSourceARN:
                        'arn:aws:dynamodb:eu-west-1:1:table/test-result/stream/2020-01-01T00:00:00.000',
                  }),
                },
              ],
            },
            exampleContext(),
            () => {

            },
        ),
    ).resolves.not.toThrow();
    expect(convert).toHaveBeenCalledTimes(1);
  });

  it('should allow valid events to reach the entity conversion procedure test RECORD TRL and produce result log', async () => {
    const consoleSpy = jest.spyOn(console, 'log');

    await expect(
        processStreamEvent(
            {
              Records: [
                {
                  body: JSON.stringify({
                    eventName: 'INSERT',
                    dynamodb: {
                      NewImage: testResultWithTestType,
                    },
                    eventSourceARN:
                        'arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000',
                  }),
                },
              ],
            },
            exampleContext(),
            () => {
            },
        ),
    ).resolves.not.toThrow();
    expect(convert).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('changeType\":\"Test Record Change\",\"testResultId\":\"TEST-RESULT-ID-3\",\"identifier\":\"VRM-3\",\"operationType\":\"INSERT\"}]'));
  });

  it('should allow valid events to reach the entity conversion procedure tech RECORD TRL and produce result log', async () => {
    const consoleSpy = jest.spyOn(console, 'log');

    await expect(
        processStreamEvent(
            {
              Records: [
                {
                  body: JSON.stringify({
                    eventName: 'INSERT',
                    dynamodb: {
                      NewImage: techRecordV3,
                    },
                    eventSourceARN:
                        'arn:aws:dynamodb:eu-west-1:1:table/flat-tech-records/stream/2020-01-01T00:00:00.000',
                  }),
                },
              ],
            },
            exampleContext(),
            () => {
            },
        ),
    ).resolves.not.toThrow();
    expect(convert).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"changeType\":\"Technical Record Change\",\"identifier\":\"VRM-1\",\"statusCode\":\"STATUS-CODE\",\"operationType\":\"INSERT\"}]'));
    consoleSpy.mockRestore()
  });

  it('should fail on null event', async () => {
    await expect(
      processStreamEvent(null, exampleContext(), () => {

      }),
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on event missing 'Records'", async () => {
    await expect(
      processStreamEvent({}, exampleContext(), () => {

      }),
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on event where 'Records' is not an array", async () => {
    await expect(
      processStreamEvent({ Records: '' }, exampleContext(), () => {

      }),
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it('should fail on null record', async () => {
    await expect(
      processStreamEvent({ Records: [null] }, exampleContext(), () => {

      }),
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on record missing 'eventName'", async () => {
    await expect(
      processStreamEvent({ Records: [{}] }, exampleContext(), () => {

      }),
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on record missing 'dynamodb'", async () => {
    await expect(
      processStreamEvent(
        {
          Records: [
            {
              eventName: 'INSERT',
            },
          ],
        },
        exampleContext(),
        () => {

        },
      ),
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on record missing 'eventSourceARN'", async () => {
    await expect(
      processStreamEvent(
        {
          Records: [
            {
              eventName: 'INSERT',
              dynamodb: {},
            },
          ],
        },
        exampleContext(),
        () => {

        },
      ),
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on record missing 'NewImage' when eventName is 'INSERT'", async () => {
    await expect(
      processStreamEvent(
        {
          Records: [
            {
              eventName: 'INSERT',
              dynamodb: {
                OldImage: {},
              },
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/t/stream/2020-01-01T00:00:00.000',
            },
          ],
        },
        exampleContext(),
        () => {

        },
      ),
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on record missing 'OldImage' when eventName is 'REMOVE'", async () => {
    await expect(
      processStreamEvent(
        {
          Records: [
            {
              eventName: 'REMOVE',
              dynamodb: {
                NewImage: {},
              },
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/t/stream/2020-01-01T00:00:00.000',
            },
          ],
        },
        exampleContext(),
        () => {

        },
      ),
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it('should return events that failed in entity conversion to the queue, but not halt processing of other records', async () => {
    (convert as jest.Mock) = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({})
      .mockResolvedValueOnce({});

    const res = await processStreamEvent(
      {
        Records: [
          {
            messageId: 'SUCCESS',
            body: JSON.stringify({
              eventName: 'INSERT',
              dynamodb: {
                NewImage: {},
              },
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T00:00:00.000',
            }),
          },
          {
            messageId: 'FAILURE',
            body: JSON.stringify({
              eventName: 'INSERT',
              dynamodb: {
                NewImage: {},
              },
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T00:00:00.000',
            }),
          },
          {
            messageId: 'SUCCESS',
            body: JSON.stringify({
              eventName: 'INSERT',
              dynamodb: {
                NewImage: {},
              },
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T00:00:00.000',
            }),
          },
        ],
      },
      exampleContext(),
      () => {

      },
    );
    expect(res).toEqual({ batchItemFailures: [{ itemIdentifier: 'FAILURE' }] });
    expect(convert).toHaveBeenCalledTimes(3);
  });
});

describe('getTableNameFromArn', () => {
  it('should return table name when ARN is provided', () => {
    const arn = 'arn:aws:dynamodb:us-east-2:123456789012:table/my-table/stream/2019-06-10T19:26:16.525';
    expect(getTableNameFromArn(arn)).toBe('my-table');
  });
});
