import {
  parseTestResults,
  TestResult,
  TestResults,
} from '../../../src/models/test-results';
import { DynamoDbImage } from '../../../src/services/dynamodb-images';
import testResultsJson from '../../resources/dynamodb-image-test-results.json';
import { castToImageShape } from '../../utils';

describe('parseTestResults()', () => {
  it('should successfully parse a DynamoDB image into a TestResults list', () => {
    const image = DynamoDbImage.parse(castToImageShape(testResultsJson));

    const testResults: TestResults = parseTestResults(image);
    const testResult: TestResult = testResults[0];

    // check only first property of each root, for now
    expect(testResult.systemNumber).toBe('SYSTEM-NUMBER-5');
    expect(testResult.vehicleClass?.code).toBe('2');
    expect(testResult.testTypes![0].createdAt).toBe(
      '2020-01-01 00:00:00.123',
    );
    expect(testResult.testTypes![0].modType?.code).toBe('p');
    expect(testResult.testTypes![0].defects![0].imNumber).toBe(5);
    expect(
      testResult.testTypes![0].defects![0].additionalInformation?.location
        ?.vertical,
    ).toBe('upper');
    expect(testResult.testTypes![0].customDefects![0].referenceNumber).toBe(
      'def5',
    );
  });
});
