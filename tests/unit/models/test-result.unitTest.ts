import {parseTestResults, TestResult, TestResults} from "../../../src/models/test-results";
import {DynamoDbImage} from "../../../src/services/dynamodb-images";
import {default as testResultsJson} from "../../resources/dynamodb-image-test-results.json";
import {castToImageShape} from "../../utils";

describe("parseTestResults()", () => {
    it("should successfully parse a DynamoDB image into a TestResults list", () => {
        const image = DynamoDbImage.parse(castToImageShape(testResultsJson));

        const testResults: TestResults = parseTestResults(image);
        const testResult: TestResult = testResults[0];

        // check only first property of each root, for now
        expect(testResult.systemNumber).toEqual("SYSTEM-NUMBER");
        expect(testResult.vehicleClass?.code).toEqual("2");
        expect(testResult.testTypes![0].createdAt).toEqual("2020-01-01T00:00:00.000");
        expect(testResult.testTypes![0].modType?.code).toEqual("p");
        expect(testResult.testTypes![0].defects![0].imNumber).toEqual(1);
        expect(testResult.testTypes![0].defects![0].additionalInformation?.location?.vertical).toEqual("upper");
        expect(testResult.testTypes![0].customDefects![0].referenceNumber).toEqual("1010101010");
    });
});
