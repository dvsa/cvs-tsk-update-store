import {processStreamEvent} from "../../../src/functions/process-stream-event";
import {Context} from "aws-lambda";
import {convert} from "../../../src/services/entity-converters";

describe("processStreamEvent()", () => {

    it("should allow valid events to reach the entity conversion procedure", async () => {
        (convert as jest.Mock) = jest.fn().mockResolvedValue({});

        await expect(processStreamEvent(
            {
                Records: [
                    {
                        eventName: "INSERT",
                        dynamodb: {
                            NewImage: {}
                        },
                        eventSourceARN: "arn:aws:dynamodb:eu-west-1:1:table/Technical_Records/stream/2020-01-01T00:00:00.000"
                    }
                ]
            },
            exampleContext(),
            () => {
                return;
            })
        ).resolves.not.toThrowError();

        expect(convert).toHaveBeenCalledTimes(1);
    });

    it("should fail on null event", async () => {
        await expect(processStreamEvent(null, exampleContext(), () => {
            return;
        })).rejects.toThrowError();
    });

    it("should fail on event missing 'Records'", async () => {
        await expect(processStreamEvent({}, exampleContext(), () => {
            return;
        })).rejects.toThrowError();
    });

    it("should fail on event where 'Records' is not an array", async () => {
        await expect(processStreamEvent({Records: ""}, exampleContext(), () => {
            return;
        })).rejects.toThrowError();
    });

    it("should fail on null record", async () => {
        await expect(processStreamEvent(
            { Records: [ null ]},
            exampleContext(),
            () => {
                return;
            })
        ).rejects.toThrowError();
    });

    it("should fail on record missing 'eventName'", async () => {
        await expect(processStreamEvent(
            { Records: [ {} ]},
            exampleContext(),
            () => {
                return;
            })
        ).rejects.toThrowError();
    });

    it("should fail on record missing 'dynamodb'", async () => {
        await expect(processStreamEvent(
            {
                Records: [
                    {
                        eventName: "INSERT"
                    }
                ]
            },
            exampleContext(),
            () => {
                return;
            })
        ).rejects.toThrowError();
    });

    it("should fail on record missing 'eventSourceARN'", async () => {
        await expect(processStreamEvent(
            {
                Records: [
                    {
                        eventName: "INSERT",
                        dynamodb: {}
                    }
                ]
            },
            exampleContext(),
            () => {
                return;
            })
        ).rejects.toThrowError();
    });

    it("should fail on record missing 'NewImage' when eventName is 'INSERT'", async () => {
        await expect(processStreamEvent(
            {
                Records: [
                    {
                        eventName: "INSERT",
                        dynamodb: {
                            OldImage: {}
                        },
                        eventSourceARN: "arn:aws:dynamodb:eu-west-1:1:table/t/stream/2020-01-01T00:00:00.000"
                    }
                ]
            },
            exampleContext(),
            () => {
                return;
            })
        ).rejects.toThrowError();
    });

    it("should fail on record missing 'OldImage' when eventName is 'REMOVE'", async () => {
        await expect(processStreamEvent(
            {
                Records: [
                    {
                        eventName: "REMOVE",
                        dynamodb: {
                            NewImage: {}
                        },
                        eventSourceARN: "arn:aws:dynamodb:eu-west-1:1:table/t/stream/2020-01-01T00:00:00.000"
                    }
                ]
            },
            exampleContext(),
            () => {
                return;
            })
        ).rejects.toThrowError();
    });

    const exampleContext = (): Context => {
        return {
            callbackWaitsForEmptyEventLoop: false,
            functionName: "test",
            functionVersion: "0.0.0",
            invokedFunctionArn: "arn:aws:execute-api:eu-west-1:TEST",
            memoryLimitInMB: "128",
            awsRequestId: "TEST-AWS-REQUEST-ID",
            logGroupName: "TEST-LOG-GROUP-NAME",
            logStreamName: "TEST-LOG-STREAM-NAME",
            getRemainingTimeInMillis: (): number => 86400000,
            done: (): void => { /* circumvent TSLint no-empty */
            },
            fail: (): void => { /* circumvent TSLint no-empty */
            },
            succeed: (): void => { /* circumvent TSLint no-empty */
            },
        };
    };
});

