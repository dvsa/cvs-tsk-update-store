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
    jest.restoreAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2023-01-01T00:00:00Z'));
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
          messageId: '1234',
          Records: [
            {
              messageId: '12345',
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
    expect(consoleSpy).toHaveBeenCalledTimes(4);
    expect(consoleSpy).toHaveBeenCalledWith('{"serviceState":"ENQUIRY_UPDATE_NOP_INITIATED"}');
    // expect(consoleSpy).toHaveBeenCalledWith('{"serviceState":"ENQUIRY_UPDATE_NOP_INITIATED_FOR_RECORD_ID"}');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('{"eventId":"12345","TECH_RECORD":{"systemNumber":"SYSTEM-NUMBER-3","vrm":"VRM-3","trailerId":"TRL-3","vin":"VIN-3","vehicleId":"VEHICLE-ID","testHistory":[],"testVersion":"TEST-VERSION-3","reasonForCreation":"REASON-FOR-CREATION-3","createdAt":"2020-01-01T00:00:00.000Z","createdByName":"CREATED-BY-NAME-3","createdById":"CREATED-BY-ID-3","lastUpdatedAt":"2020-01-01T00:00:00.000Z","lastUpdatedByName":"LAST-UPDATED-BY-NAME-3","lastUpdatedById":"LAST-UPDATED-BY-ID-3","shouldEmailCertificate":"SHOULD-EMAIL-CERTIFICATE-3","testStationName":"TEST-STATION-NAME-3","testStationPNumber":"P-NUMBER-3","testStationType":"atf","testerName":"TESTER-NAME-3","testerStaffId":"999999998","testResultId":"TEST-RESULT-ID-3","testerEmailAddress":"TESTER-EMAIL-ADDRESS-3","testStartTimestamp":"2020-01-01T00:00:00.000Z","testEndTimestamp":"2020-01-01T00:00:00.000Z","testStatus":"submitted","reasonForCancellation":"REASON-FOR-CANCELLATION-3","vehicleClass":{"code":"v","description":"heavy goods vehicle"},"vehicleSubclass":["2"],"vehicleType":"hgv","numberOfSeats":1,"vehicleConfiguration":"rigid","odometerReading":1,"odometerReadingUnits":"KILOMETRES","preparerId":"999999998","preparerName":"PREPARER-NAME-3","numberOfWheelsDriven":1,"euVehicleCategory":"m1","countryOfRegistration":"COUNTRY-OF-REGISTRATION-3","vehicleSize":"large","noOfAxles":4,"regnDate":"2020-01-01","firstUseDate":"2020-01-01","testTypes":[{"createdAt":"2020-01-01T00:00:00.000Z","lastUpdatedAt":"2020-01-01T00:00:00.000Z","deletionFlag":true,"testCode":"333","testTypeClassification":"2323232323232323232323","testTypeName":"TEST-TYPE-NAME","name":"NAME","testTypeId":"TEST-TYPE-ID","testNumber":"TEST-NUMBER","certificateNumber":"CERTIFICATE-NO","secondaryCertificateNumber":"2ND-CERTIFICATE-NO","certificateLink":"CERTIFICATE-LINK","testExpiryDate":"2020-01-01T00:00:00.000Z","testAnniversaryDate":"2020-01-01T00:00:00.000Z","testTypeStartTimestamp":"2020-01-01T00:00:00.000Z","testTypeEndTimestamp":"2020-01-01T16:54:44.123Z","statusUpdatedFlag":true,"numberOfSeatbeltsFitted":1,"lastSeatbeltInstallationCheckDate":"2020-01-01","seatbeltInstallationCheckDate":true,"testResult":"fail","prohibitionIssued":true,"reasonForAbandoning":"REASON-FOR-ABANDONING","additionalNotesRecorded":"ADDITIONAL-NOTES-RECORDED","additionalCommentsForAbandon":"ADDITIONAL-COMMENTS-FOR-ABANDON","modType":{"code":"p","description":"particulate trap"},"emissionStandard":"0.10 g/kWh Euro 3 PM","fuelType":"diesel","particulateTrapFitted":"PARTICULATE-TRAP-FITTED","particulateTrapSerialNumber":"PARTICULATE-TRAP-SERIAL-NUMBER","modificationTypeUsed":"MODIFICATION-TYPE-USED","smokeTestKLimitApplied":"SMOKE-TEST-K-LIMIT-APPLIED","defects":[{"imNumber":3,"imDescription":"IM-DESCRIPTION-3","additionalInformation":{"location":{"vertical":"upper","horizontal":"inner","lateral":"nearside","longitudinal":"front","rowNumber":1,"seatNumber":1,"axleNumber":1},"notes":"NOTES"},"itemNumber":1,"itemDescription":"ITEM-DESCRIPTION-3","deficiencyRef":"DEFICIENCY-REF-3","deficiencyId":"a","deficiencySubId":"mdclxvi","deficiencyCategory":"advisory","deficiencyText":"DEFICIENCY-TEXT-3","stdForProhibition":true,"prs":true,"prohibitionIssued":true}],"customDefects":[{"referenceNumber":"def3","defectName":"DEFECT-NAME-3","defectNotes":"DEFECT-NOTES-3"}]},{"additionalCommentsForAbandon":null,"additionalNotesRecorded":"No emission plate default 0.70","certificateNumber":"W123123","createdAt":"2021-06-21T12:59:08.000Z","customDefects":null,"defects":[],"emissionStandard":null,"fuelType":null,"lastUpdatedAt":"2021-06-21T12:59:08.000Z","modificationTypeUsed":null,"modType":null,"name":"Annual test","particulateTrapFitted":null,"particulateTrapSerialNumber":null,"prohibitionIssued":false,"reasonForAbandoning":null,"secondaryCertificateNumber":null,"smokeTestKLimitApplied":null,"testAnniversaryDate":"2022-06-30T00:00:00.000Z","testCode":"aav","testExpiryDate":"2022-06-30T00:00:00.000Z","testNumber":"W123123","testResult":"pass","testTypeClassification":"Annual With Certificate","testTypeEndTimestamp":"2021-06-21T12:59:07.000Z","testTypeId":"94","testTypeName":"Annual test","testTypeStartTimestamp":"2021-06-21T12:07:22.000Z"}]}}'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('{"eventId":"12345","TECH_RECORD":{"systemNumber":"SYSTEM-NUMBER-3","vrm":"VRM-3","trailerId":"TRL-3","vin":"VIN-3","vehicleId":"VEHICLE-ID","testHistory":[],"testVersion":"TEST-VERSION-3","reasonForCreation":"REASON-FOR-CREATION-3","createdAt":"2020-01-01T00:00:00.000Z","createdByName":"CREATED-BY-NAME-3","createdById":"CREATED-BY-ID-3","lastUpdatedAt":"2020-01-01T00:00:00.000Z","lastUpdatedByName":"LAST-UPDATED-BY-NAME-3","lastUpdatedById":"LAST-UPDATED-BY-ID-3","shouldEmailCertificate":"SHOULD-EMAIL-CERTIFICATE-3","testStationName":"TEST-STATION-NAME-3","testStationPNumber":"P-NUMBER-3","testStationType":"atf","testerName":"TESTER-NAME-3","testerStaffId":"999999998","testResultId":"TEST-RESULT-ID-3","testerEmailAddress":"TESTER-EMAIL-ADDRESS-3","testStartTimestamp":"2020-01-01T00:00:00.000Z","testEndTimestamp":"2020-01-01T00:00:00.000Z","testStatus":"submitted","reasonForCancellation":"REASON-FOR-CANCELLATION-3","vehicleClass":{"code":"v","description":"heavy goods vehicle"},"vehicleSubclass":["2"],"vehicleType":"hgv","numberOfSeats":1,"vehicleConfiguration":"rigid","odometerReading":1,"odometerReadingUnits":"KILOMETRES","preparerId":"999999998","preparerName":"PREPARER-NAME-3","numberOfWheelsDriven":1,"euVehicleCategory":"m1","countryOfRegistration":"COUNTRY-OF-REGISTRATION-3","vehicleSize":"large","noOfAxles":4,"regnDate":"2020-01-01","firstUseDate":"2020-01-01","testTypes":[{"createdAt":"2020-01-01T00:00:00.000Z","lastUpdatedAt":"2020-01-01T00:00:00.000Z","deletionFlag":true,"testCode":"333","testTypeClassification":"2323232323232323232323","testTypeName":"TEST-TYPE-NAME","name":"NAME","testTypeId":"TEST-TYPE-ID","testNumber":"TEST-NUMBER","certificateNumber":"CERTIFICATE-NO","secondaryCertificateNumber":"2ND-CERTIFICATE-NO","certificateLink":"CERTIFICATE-LINK","testExpiryDate":"2020-01-01T00:00:00.000Z","testAnniversaryDate":"2020-01-01T00:00:00.000Z","testTypeStartTimestamp":"2020-01-01T00:00:00.000Z","testTypeEndTimestamp":"2020-01-01T16:54:44.123Z","statusUpdatedFlag":true,"numberOfSeatbeltsFitted":1,"lastSeatbeltInstallationCheckDate":"2020-01-01","seatbeltInstallationCheckDate":true,"testResult":"fail","prohibitionIssued":true,"reasonForAbandoning":"REASON-FOR-ABANDONING","additionalNotesRecorded":"ADDITIONAL-NOTES-RECORDED","additionalCommentsForAbandon":"ADDITIONAL-COMMENTS-FOR-ABANDON","modType":{"code":"p","description":"particulate trap"},"emissionStandard":"0.10 g/kWh Euro 3 PM","fuelType":"diesel","particulateTrapFitted":"PARTICULATE-TRAP-FITTED","particulateTrapSerialNumber":"PARTICULATE-TRAP-SERIAL-NUMBER","modificationTypeUsed":"MODIFICATION-TYPE-USED","smokeTestKLimitApplied":"SMOKE-TEST-K-LIMIT-APPLIED","defects":[{"imNumber":3,"imDescription":"IM-DESCRIPTION-3","additionalInformation":{"location":{"vertical":"upper","horizontal":"inner","lateral":"nearside","longitudinal":"front","rowNumber":1,"seatNumber":1,"axleNumber":1},"notes":"NOTES"},"itemNumber":1,"itemDescription":"ITEM-DESCRIPTION-3","deficiencyRef":"DEFICIENCY-REF-3","deficiencyId":"a","deficiencySubId":"mdclxvi","deficiencyCategory":"advisory","deficiencyText":"DEFICIENCY-TEXT-3","stdForProhibition":true,"prs":true,"prohibitionIssued":true}],"customDefects":[{"referenceNumber":"def3","defectName":"DEFECT-NAME-3","defectNotes":"DEFECT-NOTES-3"}]},{"additionalCommentsForAbandon":null,"additionalNotesRecorded":"No emission plate default 0.70","certificateNumber":"W123123","createdAt":"2021-06-21T12:59:08.000Z","customDefects":null,"defects":[],"emissionStandard":null,"fuelType":null,"lastUpdatedAt":"2021-06-21T12:59:08.000Z","modificationTypeUsed":null,"modType":null,"name":"Annual test","particulateTrapFitted":null,"particulateTrapSerialNumber":null,"prohibitionIssued":false,"reasonForAbandoning":null,"secondaryCertificateNumber":null,"smokeTestKLimitApplied":null,"testAnniversaryDate":"2022-06-30T00:00:00.000Z","testCode":"aav","testExpiryDate":"2022-06-30T00:00:00.000Z","testNumber":"W123123","testResult":"pass","testTypeClassification":"Annual With Certificate","testTypeEndTimestamp":"2021-06-21T12:59:07.000Z","testTypeId":"94","testTypeName":"Annual test","testTypeStartTimestamp":"2021-06-21T12:07:22.000Z"}]}}'));
  });

  it('should allow valid events to reach the entity conversion procedure tech RECORD TRL and produce result log', async () => {
    const consoleSpy = jest.spyOn(console, 'log');

    await expect(
      processStreamEvent(
        {
          Records: [
            {
              messageId: '12345',
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
    expect(consoleSpy).toHaveBeenCalledTimes(3);
    expect(consoleSpy).toHaveBeenCalledWith('{"serviceState":"ENQUIRY_UPDATE_NOP_INITIATED"}');
    expect(consoleSpy).toHaveBeenCalledWith('{"eventId":"12345","serviceState":"ENQUIRY_UPDATE_NOP_INITIATED_FOR_RECORD_ID"}');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[{"timestamp":"2023-01-01T00:00:00.000Z","changeType":"Technical Record Change","identifier":"VRM-1","techRecordVIN":"VIN-1","techRecordSystemNumber":"SYSTEM-NUMBER-1","statusCode":"STATUS-CODE","serviceState":"ENQUIRY_UPDATE_NOP_SUCCESSFUL","eventId":"12345","operationType":"INSERT"}]'));
    consoleSpy.mockRestore();
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
