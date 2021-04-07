import {EventSourceArn, stringToArn} from "../../../src/services/event-source-arn";
import {DateTime} from "luxon";

describe("stringToArn()", () => {
    it("should parse a valid ARN", () => {
        const arn: EventSourceArn = stringToArn(
            "arn:aws:dynamodb:us-east-2:123456789012:table/my-table/stream/2019-06-10T19:26:16.525"
        );
        expect(arn.region).toEqual("us-east-2");
        expect(arn.accountId).toEqual("123456789012");
        expect(arn.table).toEqual("my-table");
        expect(arn.timestamp).toEqual(DateTime.fromISO("2019-06-10T19:26:16.525").toUTC());
    });

    it("should fail on null ARN", () => {
        // @ts-ignore
        expect(() => stringToArn(null)).toThrowError();
    });

    it("should fail on blank ARN", () => {
        expect(() => stringToArn("")).toThrowError();
    });

    it("should fail on ARN with < 6 parts", () => {
        expect(() => stringToArn("1:2:3")).toThrowError();
    });

    it("should fail on ARN where part 0 is not 'arn'", () => {
        expect(() => stringToArn("arm:aws:dynamodb:us-east-2:AID:table/t/stream/timestamp")).toThrowError();
    });

    it("should fail on ARN where part 1 is not 'aws'", () => {
        expect(() => stringToArn("arn:awt:dynamodb:us-east-2:AID:table/t/stream/timestamp")).toThrowError();
    });

    it("should fail on ARN where part 2 is not 'dynamodb'", () => {
        expect(() => stringToArn("arn:aws:sqs:us-east-2:AID:table/t/stream/timestamp")).toThrowError();
    });

    it("should fail on ARN where path has < 4 parts", () => {
        expect(() => stringToArn("arn:aws:dynamodb:us-east-2:AID:1/2/3")).toThrowError();
    });

    it("should fail on ARN where path part 0 is not 'table'", () => {
        expect(() => stringToArn("arn:aws:dynamodb:us-east-2:AID:chair/t/stream/timestamp")).toThrowError();
    });

    it("should fail on ARN where path part 2 is not 'stream'", () => {
        expect(() => stringToArn("arn:aws:dynamodb:us-east-2:AID:table/t/flower/timestamp")).toThrowError();
    });
});
