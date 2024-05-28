import {
  getTableNameFromArn,
  processStreamEvent,
} from "../../../src/functions/process-stream-event";
import { convert } from "../../../src/services/entity-conversion";
import { exampleContext } from "../../utils";
import { mocked } from 'ts-jest/utils'

jest.mock("../../../src/services/entity-conversion", () => ({
  convert: jest.fn(),
}));

describe("processStreamEvent()", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mocked(convert).mockResolvedValueOnce({});
  });

  it("should allow valid events to reach the entity conversion procedure", async () => {
    await expect(
      processStreamEvent(
        {
          Records: [
            {
              body: JSON.stringify({
                Message: JSON.stringify({
                  eventName: "INSERT",
                  dynamodb: {
                    NewImage: {},
                  },
                  eventSourceARN:
                    "arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T00:00:00.000",
                })
              }),
            },
          ],
        },
        exampleContext(),
        () => {
          return;
        }
      )
    ).resolves.not.toThrowError();
    expect(convert).toHaveBeenCalledTimes(1);
  });

  it("should fail on null event", async () => {
    await expect(
      processStreamEvent(null, exampleContext(), () => {
        return;
      })
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on event missing 'Records'", async () => {
    await expect(
      processStreamEvent({}, exampleContext(), () => {
        return;
      })
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on event where 'Records' is not an array", async () => {
    await expect(
      processStreamEvent({ Records: "" }, exampleContext(), () => {
        return;
      })
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on null record", async () => {
    await expect(
      processStreamEvent({ Records: [null] }, exampleContext(), () => {
        return;
      })
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on record missing 'eventName'", async () => {
    await expect(
      processStreamEvent({ Records: [{}] }, exampleContext(), () => {
        return;
      })
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on record missing 'dynamodb'", async () => {
    await expect(
      processStreamEvent(
        {
          Records: [
            {
              eventName: "INSERT",
            },
          ],
        },
        exampleContext(),
        () => {
          return;
        }
      )
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on record missing 'eventSourceARN'", async () => {
    await expect(
      processStreamEvent(
        {
          Records: [
            {
              eventName: "INSERT",
              dynamodb: {},
            },
          ],
        },
        exampleContext(),
        () => {
          return;
        }
      )
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on record missing 'NewImage' when eventName is 'INSERT'", async () => {
    await expect(
      processStreamEvent(
        {
          Records: [
            {
              eventName: "INSERT",
              dynamodb: {
                OldImage: {},
              },
              eventSourceARN:
                "arn:aws:dynamodb:eu-west-1:1:table/t/stream/2020-01-01T00:00:00.000",
            },
          ],
        },
        exampleContext(),
        () => {
          return;
        }
      )
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should fail on record missing 'OldImage' when eventName is 'REMOVE'", async () => {
    await expect(
      processStreamEvent(
        {
          Records: [
            {
              eventName: "REMOVE",
              dynamodb: {
                NewImage: {},
              },
              eventSourceARN:
                "arn:aws:dynamodb:eu-west-1:1:table/t/stream/2020-01-01T00:00:00.000",
            },
          ],
        },
        exampleContext(),
        () => {
          return;
        }
      )
    ).resolves.toEqual({ batchItemFailures: [] });
    expect(convert).toHaveBeenCalledTimes(0);
  });

  it("should return events that failed in entity conversion to the queue, but not halt processing of other records", async () => {
    (convert as jest.Mock) = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({})
      .mockResolvedValueOnce({});

    const res = await processStreamEvent(
      {
        Records: [
          {
            messageId: "SUCCESS",
            body: JSON.stringify({
              Message: JSON.stringify({
                eventName: "INSERT",
                dynamodb: {
                  NewImage: {},
                },
                eventSourceARN:
                  "arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T00:00:00.000",           
              })
            }),
          },
          {
            messageId: "FAILURE",
            body: JSON.stringify({
              Message: JSON.stringify({
                eventName: "INSERT",
                dynamodb: {
                  NewImage: {},
                },
                eventSourceARN:
                  "arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T00:00:00.000",
              })
            }),
          },
          {
            messageId: "SUCCESS",
            body: JSON.stringify({
              Message: JSON.stringify({
                eventName: "INSERT",
                dynamodb: {
                  NewImage: {},
                },
                eventSourceARN:
                  "arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T00:00:00.000",
              })
            }),
          },
        ],
      },
      exampleContext(),
      () => {
        return;
      }
    );
    expect(res).toEqual({ batchItemFailures: [{ itemIdentifier: "FAILURE" }] });
    expect(convert).toHaveBeenCalledTimes(3);
  });
});

describe("getTableNameFromArn", () => {
  it("should return table name when ARN is provided", () => {
    const arn =
      "arn:aws:dynamodb:us-east-2:123456789012:table/my-table/stream/2019-06-10T19:26:16.525";
    expect(getTableNameFromArn(arn)).toEqual("my-table");
  });
});
