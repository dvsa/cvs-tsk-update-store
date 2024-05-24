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
describe('convertTestResults() integration tests with upsert', () => {
  let container: StartedTestContainer;
  const testResultsJson = JSON.parse(
    JSON.stringify(require('../resources/dynamodb-image-test-results.json')),
  );
  const testResultsJsonWithTestTypes = JSON.parse(
    JSON.stringify(
      require('../resources/dynamodb-image-test-results-with-testtypes.json'),
    ),
  );
  const testResultsJsonWithNoSystemNumber = JSON.parse(
    JSON.stringify(
      require('../resources/dynamodb-image-test-results-with-no-systemNumber.json'),
    ),
  );
  const testResultsJsonWithoutTestTypes = JSON.parse(
    JSON.stringify(
      require('../resources/dynamodb-image-test-results-without-testtypes.json'),
    ),
  );
  testResultsJson.testResultId.S = `${testResultsJson.testResultId.S}-U`;
  testResultsJson.systemNumber.S = `${testResultsJson.systemNumber.S}-U`;
  testResultsJsonWithTestTypes.testResultId.S = `${testResultsJsonWithTestTypes.testResultId.S}-U`;
  testResultsJsonWithTestTypes.systemNumber.S = `${testResultsJsonWithTestTypes.systemNumber.S}-U`;
  testResultsJsonWithNoSystemNumber.testResultId.S = `${testResultsJsonWithNoSystemNumber.testResultId.S}-U`;
  testResultsJsonWithoutTestTypes.testResultId.S = `${testResultsJsonWithoutTestTypes.testResultId.S}-U`;
  testResultsJsonWithoutTestTypes.systemNumber.S = `${testResultsJsonWithoutTestTypes.systemNumber.S}-U`;

  beforeAll(async () => {
    process.env.DISABLE_DELETE_ON_UPDATE = 'true';
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
    if (process.env.USE_CONTAINERIZED_DATABASE === '1') {
      await container.stop();
    }
  });

  it('should correctly convert a DynamoDB event into Aurora rows', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            eventSourceARN:
              'arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000',
            eventName: 'INSERT',
            dynamodb: {
              NewImage: testResultsJson,
            },
          }),
        },
      ],
    };

    // array of arrays: event contains array of records, each with array of test result entities
    await processStreamEvent(event, exampleContext(), () => {

    });

    const vehicleResultSet = await executeSql(
      `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
            FROM \`vehicle\`
            WHERE \`vehicle\`.\`id\` IN (
              SELECT \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "${testResultsJson.systemNumber.S}"
            )`,
    );

    expect(vehicleResultSet.rows).toHaveLength(1);
    expect(vehicleResultSet.rows[0].system_number).toBe(
      'SYSTEM-NUMBER-5-U',
    );
    expect(vehicleResultSet.rows[0].vin).toBe('VIN5');
    expect(vehicleResultSet.rows[0].vrm_trm).toBe('VRM-5');
    expect(vehicleResultSet.rows[0].trailer_id).toBe('TRL-5');
    expect(
      (vehicleResultSet.rows[0].createdAt as Date).toUTCString(),
    ).not.toBeNull();

    const testResultSet = await executeSql(
      `SELECT \`test_station_id\`, \`tester_id\`, \`vehicle_class_id\`, \`preparer_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`,
                  \`fuel_emission_id\`, \`test_type_id\`, \`id\`, \`testResultId\`, \`testCode\`,  \`certificateNumber\`,  \`secondaryCertificateNumber\`,
                  \`testExpiryDate\`,  \`testAnniversaryDate\`,  \`testTypeStartTimestamp\`,  \`numberOfSeatbeltsFitted\`, \`lastSeatbeltInstallationCheckDate\`,
                  \`seatbeltInstallationCheckDate\`,  \`testResult\`,  \`reasonForAbandoning\`,  \`additionalNotesRecorded\`,  \`additionalCommentsForAbandon\`,
                  \`particulateTrapFitted\`,  \`particulateTrapSerialNumber\`,  \`modificationTypeUsed\`, \`smokeTestKLimitApplied\`
          FROM \`test_result\`
          WHERE \`test_result\`.\`vehicle_id\` = ${vehicleResultSet.rows[0].id}`,
    );

    expect(testResultSet.rows[0].testResultId).toBe('TEST-RESULT-ID-5-U');
    expect(testResultSet.rows).toHaveLength(1);
    expect(testResultSet.rows[0].testCode).toBe('333');
    expect(testResultSet.rows[0].certificateNumber).toBe('CERTIFICATE-NO');
    expect(testResultSet.rows[0].secondaryCertificateNumber).toBe(
      '2ND-CERTIFICATE-NO',
    );
    expect(
      (testResultSet.rows[0].testExpiryDate as Date).toISOString(),
    ).toBe('2020-01-01T00:00:00.000Z');
    expect(
      (testResultSet.rows[0].testAnniversaryDate as Date).toISOString(),
    ).toBe('2020-01-01T00:00:00.000Z');
    expect(
      (testResultSet.rows[0].testTypeStartTimestamp as Date).toISOString(),
    ).toBe('2020-01-01T00:00:00.023Z');
    expect(testResultSet.rows[0].lastSeatbeltInstallationCheckDate).toEqual(
      new Date('2020-01-01'),
    );
    expect(testResultSet.rows[0].seatbeltInstallationCheckDate).toBe(1);
    expect(testResultSet.rows[0].testResult).toBe('fail');
    expect(testResultSet.rows[0].reasonForAbandoning).toBe(
      'REASON-FOR-ABANDONING',
    );
    expect(testResultSet.rows[0].additionalNotesRecorded).toBe(
      'ADDITIONAL-NOTES-RECORDED',
    );
    expect(testResultSet.rows[0].particulateTrapFitted).toBe(
      'PARTICULATE-TRAP-FITTED',
    );
    expect(testResultSet.rows[0].particulateTrapSerialNumber).toBe(
      'PARTICULATE-TRAP-SERIAL-NUMBER',
    );
    expect(testResultSet.rows[0].modificationTypeUsed).toBe(
      'MODIFICATION-TYPE-USED',
    );
    expect(testResultSet.rows[0].smokeTestKLimitApplied).toBe(
      'SMOKE-TEST-K-LIMIT-APPLIED',
    );

    expect(testResultSet.rows).toHaveLength(1);

    const {
      test_station_id,
      tester_id,
      vehicle_class_id,
      preparer_id,
      createdBy_Id,
      lastUpdatedBy_Id,
      fuel_emission_id,
      test_type_id,
      id,
    } = testResultSet.rows[0];

    const testStationResultSet = await executeSql(
      `SELECT \`pNumber\`, \`name\`, \`type\`
            FROM \`test_station\`
            WHERE \`test_station\`.\`id\` = ${test_station_id}`,
    );
    expect(testStationResultSet.rows).toHaveLength(1);
    expect(testStationResultSet.rows[0].pNumber).toBe('P-NUMBER-5');
    expect(testStationResultSet.rows[0].name).toBe('TEST-STATION-NAME-5');
    expect(testStationResultSet.rows[0].type).toBe('atf');

    const testerResultSet = await executeSql(
      `SELECT \`staffId\`, \`name\`, \`email_address\`
            FROM \`tester\`
            WHERE \`tester\`.\`id\` = ${tester_id}`,
    );
    expect(testerResultSet.rows).toHaveLength(1);
    expect(testerResultSet.rows[0].staffId).toBe('TESTER-STAFF-ID-5');
    expect(testerResultSet.rows[0].name).toBe('TESTER-NAME-5');
    expect(testerResultSet.rows[0].email_address).toBe(
      'TESTER-EMAIL-ADDRESS-5',
    );

    const vehicleClassResultSet = await executeSql(
      `SELECT \`code\`,
                  \`description\`,
                  \`vehicleType\`,
                  \`vehicleSize\`,
                  \`vehicleConfiguration\`,
                  \`euVehicleCategory\`
            FROM \`vehicle_class\`
            WHERE \`vehicle_class\`.\`id\` = ${vehicle_class_id}`,
    );
    expect(vehicleClassResultSet.rows).toHaveLength(1);
    expect(vehicleClassResultSet.rows[0].code).toBe('2');
    expect(vehicleClassResultSet.rows[0].description).toBe(
      'motorbikes over 200cc or with a sidecar',
    );
    expect(vehicleClassResultSet.rows[0].vehicleType).toBe('psv');
    expect(vehicleClassResultSet.rows[0].vehicleSize).toBe('large');
    expect(vehicleClassResultSet.rows[0].vehicleConfiguration).toBe(
      'rigid',
    );
    expect(vehicleClassResultSet.rows[0].euVehicleCategory).toBe('m1');

    const preparerResultSet = await executeSql(
      `SELECT \`preparerId\`, \`name\`
            FROM \`preparer\`
            WHERE \`preparer\`.\`id\` = ${preparer_id}`,
    );
    expect(preparerResultSet.rows).toHaveLength(1);
    expect(preparerResultSet.rows[0].preparerId).toBe('PREPARER-ID-5');
    expect(preparerResultSet.rows[0].name).toBe('PREPARER-NAME-5');

    const createdByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${createdBy_Id}`,
    );
    expect(createdByResultSet.rows).toHaveLength(1);
    expect(createdByResultSet.rows[0].identityId).toBe('CREATED-BY-ID-5');
    expect(createdByResultSet.rows[0].name).toBe('CREATED-BY-NAME-5');

    const lastUpdatedByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${lastUpdatedBy_Id}`,
    );
    expect(lastUpdatedByResultSet.rows).toHaveLength(1);
    expect(lastUpdatedByResultSet.rows[0].identityId).toBe(
      'LAST-UPDATED-BY-ID-5',
    );
    expect(lastUpdatedByResultSet.rows[0].name).toBe(
      'LAST-UPDATED-BY-NAME-5',
    );

    const fuelEmissionResultSet = await executeSql(
      `SELECT \`modTypeCode\`, \`description\`, \`emissionStandard\`, \`fuelType\`
            FROM \`fuel_emission\`
            WHERE \`fuel_emission\`.\`id\` = ${fuel_emission_id}`,
    );
    expect(fuelEmissionResultSet.rows).toHaveLength(1);
    expect(fuelEmissionResultSet.rows[0].modTypeCode).toBe('p');
    expect(fuelEmissionResultSet.rows[0].description).toBe(
      'particulate trap',
    );
    expect(fuelEmissionResultSet.rows[0].emissionStandard).toBe(
      '0.10 g/kWh Euro 3 PM',
    );
    expect(fuelEmissionResultSet.rows[0].fuelType).toBe('diesel');

    const testTypeResultSet = await executeSql(
      `SELECT \`testTypeClassification\`, \`testTypeName\`
            FROM \`test_type\`
            WHERE \`test_type\`.\`id\` = ${test_type_id}`,
    );
    expect(testTypeResultSet.rows).toHaveLength(1);
    expect(testTypeResultSet.rows[0].testTypeClassification).toBe(
      '2323232323232323232323',
    );
    expect(testTypeResultSet.rows[0].testTypeName).toBe('TEST-TYPE-NAME');

    const testDefectResultSet = await executeSql(
      `SELECT \`test_result_id\`, \`defect_id\`, \`location_id\`, \`notes\`, \`prs\`, \`prohibitionIssued\`
            FROM \`test_defect\`
            WHERE \`test_defect\`.\`test_result_id\` = ${id}`,
    );

    expect(testDefectResultSet.rows).toHaveLength(1);
    expect(testDefectResultSet.rows[0].test_result_id).toEqual(id);
    expect(testDefectResultSet.rows[0].defect_id).toBe(1);
    expect(testDefectResultSet.rows[0].location_id).toBe(1);
    expect(testDefectResultSet.rows[0].notes).toBe('NOTES');
    expect(testDefectResultSet.rows[0].prs).toBe(1);
    expect(testDefectResultSet.rows[0].prohibitionIssued).toBe(1);

    const defectResultSet = await executeSql(
      `SELECT \`imNumber\`,
                  \`imDescription\`,
                  \`itemNumber\`,
                  \`itemDescription\`,
                  \`deficiencyRef\`,
                  \`deficiencyId\`,
                  \`deficiencySubId\`,
                  \`deficiencyCategory\`,
                  \`deficiencyText\`,
                  \`stdForProhibition\`
            FROM \`defect\`
            WHERE \`defect\`.\`id\` = ${testDefectResultSet.rows[0].defect_id}`,
    );
    expect(defectResultSet.rows).toHaveLength(1);
    expect(defectResultSet.rows[0].imNumber).toBe(5);
    expect(defectResultSet.rows[0].imDescription).toBe('IM-DESCRIPTION-5');
    expect(defectResultSet.rows[0].itemNumber).toBe(1);
    expect(defectResultSet.rows[0].itemDescription).toBe(
      'ITEM-DESCRIPTION-5',
    );
    expect(defectResultSet.rows[0].deficiencyRef).toBe('DEFICIENCY-REF-5');
    expect(defectResultSet.rows[0].deficiencyId).toBe('a');
    expect(defectResultSet.rows[0].deficiencySubId).toBe('mdclxvi');
    expect(defectResultSet.rows[0].deficiencyCategory).toBe('advisory');
    expect(defectResultSet.rows[0].deficiencyText).toBe(
      'DEFICIENCY-TEXT-5',
    );
    expect(defectResultSet.rows[0].itemNumber).toBe(1);

    const customDefectResultSet = await executeSql(
      `SELECT \`test_result_id\`, \`referenceNumber\`, \`defectName\`, \`defectNotes\`
            FROM \`custom_defect\`
            WHERE \`custom_defect\`.\`test_result_id\` = ${id}`,
    );

    const customDefectLastIndex = customDefectResultSet.rows.length - 1;

    expect(
      customDefectResultSet.rows[customDefectLastIndex].test_result_id,
    ).toEqual(id);
    expect(
      customDefectResultSet.rows[customDefectLastIndex].referenceNumber,
    ).toBe('def5');
    expect(
      customDefectResultSet.rows[customDefectLastIndex].defectName,
    ).toBe('DEFECT-NAME-5');
    expect(
      customDefectResultSet.rows[customDefectLastIndex].defectNotes,
    ).toBe('DEFECT-NOTES-5');
  });

  it('should correctly convert a DynamoDB event into Aurora rows when processed a second time', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            eventSourceARN:
              'arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000',
            eventName: 'INSERT',
            dynamodb: {
              NewImage: testResultsJson,
            },
          }),
        },
      ],
    };

    const consoleSpy = jest
      .spyOn(global.console, 'error')
      .mockImplementation();
    await processStreamEvent(event, exampleContext(), () => {

    });

    expect(consoleSpy).toBeCalledTimes(0);

    const vehicleResultSet = await executeSql(
      `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
            FROM \`vehicle\`
            WHERE \`vehicle\`.\`id\` IN (
              SELECT \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "${testResultsJson.systemNumber.S}"
            )`,
    );

    expect(vehicleResultSet.rows).toHaveLength(1);
    expect(vehicleResultSet.rows[0].system_number).toBe(
      'SYSTEM-NUMBER-5-U',
    );
    expect(vehicleResultSet.rows[0].vin).toBe('VIN5');
    expect(vehicleResultSet.rows[0].vrm_trm).toBe('VRM-5');
    expect(vehicleResultSet.rows[0].trailer_id).toBe('TRL-5');
    expect(
      (vehicleResultSet.rows[0].createdAt as Date).toUTCString(),
    ).not.toBeNull();

    const testResultSet = await executeSql(
      `SELECT \`test_station_id\`, \`tester_id\`, \`vehicle_class_id\`, \`preparer_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`,
                  \`fuel_emission_id\`, \`test_type_id\`, \`id\`, \`testResultId\`, \`testCode\`,  \`certificateNumber\`,  \`secondaryCertificateNumber\`,
                  \`testExpiryDate\`,  \`testAnniversaryDate\`,  \`testTypeStartTimestamp\`,  \`numberOfSeatbeltsFitted\`, \`lastSeatbeltInstallationCheckDate\`,
                  \`seatbeltInstallationCheckDate\`,  \`testResult\`,  \`reasonForAbandoning\`,  \`additionalNotesRecorded\`,  \`additionalCommentsForAbandon\`,
                  \`particulateTrapFitted\`,  \`particulateTrapSerialNumber\`,  \`modificationTypeUsed\`, \`smokeTestKLimitApplied\`
          FROM \`test_result\`
          WHERE \`test_result\`.\`vehicle_id\` = ${vehicleResultSet.rows[0].id}`,
    );

    expect(testResultSet.rows[0].testResultId).toBe('TEST-RESULT-ID-5-U');
    expect(testResultSet.rows).toHaveLength(1);
    expect(testResultSet.rows[0].testCode).toBe('333');
    expect(testResultSet.rows[0].certificateNumber).toBe('CERTIFICATE-NO');
    expect(testResultSet.rows[0].secondaryCertificateNumber).toBe(
      '2ND-CERTIFICATE-NO',
    );
    expect(
      (testResultSet.rows[0].testExpiryDate as Date).toISOString(),
    ).toBe('2020-01-01T00:00:00.000Z');
    expect(
      (testResultSet.rows[0].testAnniversaryDate as Date).toISOString(),
    ).toBe('2020-01-01T00:00:00.000Z');
    expect(
      (testResultSet.rows[0].testTypeStartTimestamp as Date).toISOString(),
    ).toBe('2020-01-01T00:00:00.023Z');
    expect(testResultSet.rows[0].lastSeatbeltInstallationCheckDate).toEqual(
      new Date('2020-01-01'),
    );
    expect(testResultSet.rows[0].seatbeltInstallationCheckDate).toBe(1);
    expect(testResultSet.rows[0].testResult).toBe('fail');
    expect(testResultSet.rows[0].reasonForAbandoning).toBe(
      'REASON-FOR-ABANDONING',
    );
    expect(testResultSet.rows[0].additionalNotesRecorded).toBe(
      'ADDITIONAL-NOTES-RECORDED',
    );
    expect(testResultSet.rows[0].particulateTrapFitted).toBe(
      'PARTICULATE-TRAP-FITTED',
    );
    expect(testResultSet.rows[0].particulateTrapSerialNumber).toBe(
      'PARTICULATE-TRAP-SERIAL-NUMBER',
    );
    expect(testResultSet.rows[0].modificationTypeUsed).toBe(
      'MODIFICATION-TYPE-USED',
    );
    expect(testResultSet.rows[0].smokeTestKLimitApplied).toBe(
      'SMOKE-TEST-K-LIMIT-APPLIED',
    );

    expect(testResultSet.rows).toHaveLength(1);

    const {
      test_station_id,
      tester_id,
      vehicle_class_id,
      preparer_id,
      createdBy_Id,
      lastUpdatedBy_Id,
      fuel_emission_id,
      test_type_id,
      id,
    } = testResultSet.rows[0];

    const testStationResultSet = await executeSql(
      `SELECT \`pNumber\`, \`name\`, \`type\`
            FROM \`test_station\`
            WHERE \`test_station\`.\`id\` = ${test_station_id}`,
    );
    expect(testStationResultSet.rows).toHaveLength(1);
    expect(testStationResultSet.rows[0].pNumber).toBe('P-NUMBER-5');
    expect(testStationResultSet.rows[0].name).toBe('TEST-STATION-NAME-5');
    expect(testStationResultSet.rows[0].type).toBe('atf');

    const testerResultSet = await executeSql(
      `SELECT \`staffId\`, \`name\`, \`email_address\`
            FROM \`tester\`
            WHERE \`tester\`.\`id\` = ${tester_id}`,
    );
    expect(testerResultSet.rows).toHaveLength(1);
    expect(testerResultSet.rows[0].staffId).toBe('TESTER-STAFF-ID-5');
    expect(testerResultSet.rows[0].name).toBe('TESTER-NAME-5');
    expect(testerResultSet.rows[0].email_address).toBe(
      'TESTER-EMAIL-ADDRESS-5',
    );

    const vehicleClassResultSet = await executeSql(
      `SELECT \`code\`,
                  \`description\`,
                  \`vehicleType\`,
                  \`vehicleSize\`,
                  \`vehicleConfiguration\`,
                  \`euVehicleCategory\`
            FROM \`vehicle_class\`
            WHERE \`vehicle_class\`.\`id\` = ${vehicle_class_id}`,
    );
    expect(vehicleClassResultSet.rows).toHaveLength(1);
    expect(vehicleClassResultSet.rows[0].code).toBe('2');
    expect(vehicleClassResultSet.rows[0].description).toBe(
      'motorbikes over 200cc or with a sidecar',
    );
    expect(vehicleClassResultSet.rows[0].vehicleType).toBe('psv');
    expect(vehicleClassResultSet.rows[0].vehicleSize).toBe('large');
    expect(vehicleClassResultSet.rows[0].vehicleConfiguration).toBe(
      'rigid',
    );
    expect(vehicleClassResultSet.rows[0].euVehicleCategory).toBe('m1');

    const preparerResultSet = await executeSql(
      `SELECT \`preparerId\`, \`name\`
            FROM \`preparer\`
            WHERE \`preparer\`.\`id\` = ${preparer_id}`,
    );
    expect(preparerResultSet.rows).toHaveLength(1);
    expect(preparerResultSet.rows[0].preparerId).toBe('PREPARER-ID-5');
    expect(preparerResultSet.rows[0].name).toBe('PREPARER-NAME-5');

    const createdByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${createdBy_Id}`,
    );
    expect(createdByResultSet.rows).toHaveLength(1);
    expect(createdByResultSet.rows[0].identityId).toBe('CREATED-BY-ID-5');
    expect(createdByResultSet.rows[0].name).toBe('CREATED-BY-NAME-5');

    const lastUpdatedByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${lastUpdatedBy_Id}`,
    );
    expect(lastUpdatedByResultSet.rows).toHaveLength(1);
    expect(lastUpdatedByResultSet.rows[0].identityId).toBe(
      'LAST-UPDATED-BY-ID-5',
    );
    expect(lastUpdatedByResultSet.rows[0].name).toBe(
      'LAST-UPDATED-BY-NAME-5',
    );

    const fuelEmissionResultSet = await executeSql(
      `SELECT \`modTypeCode\`, \`description\`, \`emissionStandard\`, \`fuelType\`
            FROM \`fuel_emission\`
            WHERE \`fuel_emission\`.\`id\` = ${fuel_emission_id}`,
    );
    expect(fuelEmissionResultSet.rows).toHaveLength(1);
    expect(fuelEmissionResultSet.rows[0].modTypeCode).toBe('p');
    expect(fuelEmissionResultSet.rows[0].description).toBe(
      'particulate trap',
    );
    expect(fuelEmissionResultSet.rows[0].emissionStandard).toBe(
      '0.10 g/kWh Euro 3 PM',
    );
    expect(fuelEmissionResultSet.rows[0].fuelType).toBe('diesel');

    const testTypeResultSet = await executeSql(
      `SELECT \`testTypeClassification\`, \`testTypeName\`
            FROM \`test_type\`
            WHERE \`test_type\`.\`id\` = ${test_type_id}`,
    );
    expect(testTypeResultSet.rows).toHaveLength(1);
    expect(testTypeResultSet.rows[0].testTypeClassification).toBe(
      '2323232323232323232323',
    );
    expect(testTypeResultSet.rows[0].testTypeName).toBe('TEST-TYPE-NAME');

    const testDefectResultSet = await executeSql(
      `SELECT \`test_result_id\`, \`defect_id\`, \`location_id\`, \`notes\`, \`prs\`, \`prohibitionIssued\`
            FROM \`test_defect\`
            WHERE \`test_defect\`.\`test_result_id\` = ${id}`,
    );

    expect(testDefectResultSet.rows).toHaveLength(1);
    expect(testDefectResultSet.rows[0].test_result_id).toEqual(id);
    expect(testDefectResultSet.rows[0].defect_id).toBe(1);
    expect(testDefectResultSet.rows[0].location_id).toBe(1);
    expect(testDefectResultSet.rows[0].notes).toBe('NOTES');
    expect(testDefectResultSet.rows[0].prs).toBe(1);
    expect(testDefectResultSet.rows[0].prohibitionIssued).toBe(1);

    const defectResultSet = await executeSql(
      `SELECT \`imNumber\`,
                  \`imDescription\`,
                  \`itemNumber\`,
                  \`itemDescription\`,
                  \`deficiencyRef\`,
                  \`deficiencyId\`,
                  \`deficiencySubId\`,
                  \`deficiencyCategory\`,
                  \`deficiencyText\`,
                  \`stdForProhibition\`
            FROM \`defect\`
            WHERE \`defect\`.\`id\` = ${testDefectResultSet.rows[0].defect_id}`,
    );
    expect(defectResultSet.rows).toHaveLength(1);
    expect(defectResultSet.rows[0].imNumber).toBe(5);
    expect(defectResultSet.rows[0].imDescription).toBe('IM-DESCRIPTION-5');
    expect(defectResultSet.rows[0].itemNumber).toBe(1);
    expect(defectResultSet.rows[0].itemDescription).toBe(
      'ITEM-DESCRIPTION-5',
    );
    expect(defectResultSet.rows[0].deficiencyRef).toBe('DEFICIENCY-REF-5');
    expect(defectResultSet.rows[0].deficiencyId).toBe('a');
    expect(defectResultSet.rows[0].deficiencySubId).toBe('mdclxvi');
    expect(defectResultSet.rows[0].deficiencyCategory).toBe('advisory');
    expect(defectResultSet.rows[0].deficiencyText).toBe(
      'DEFICIENCY-TEXT-5',
    );
    expect(defectResultSet.rows[0].itemNumber).toBe(1);

    const customDefectResultSet = await executeSql(
      `SELECT \`test_result_id\`, \`referenceNumber\`, \`defectName\`, \`defectNotes\`
            FROM \`custom_defect\`
            WHERE \`custom_defect\`.\`test_result_id\` = ${id}`,
    );

    const customDefectLastIndex = customDefectResultSet.rows.length - 1;

    expect(
      customDefectResultSet.rows[customDefectLastIndex].test_result_id,
    ).toEqual(id);
    expect(
      customDefectResultSet.rows[customDefectLastIndex].referenceNumber,
    ).toBe('def5');
    expect(
      customDefectResultSet.rows[customDefectLastIndex].defectName,
    ).toBe('DEFECT-NAME-5');
    expect(
      customDefectResultSet.rows[customDefectLastIndex].defectNotes,
    ).toBe('DEFECT-NOTES-5');
  });

  it('should correctly update when non-unique attributes changed', async () => {
    const deserializedJson = unmarshall(testResultsJson);
    deserializedJson.testTypes[0].testCode = '444';
    deserializedJson.testTypes[0].certificateNumber = 'W323232';
    deserializedJson.testTypes[0].secondaryCertificateNumber = '111111';
    deserializedJson.testTypes[0].testExpiryDate = '2022-01-01T00:00:00.000Z';
    deserializedJson.testTypes[0].testAnniversaryDate = '2022-01-01T00:00:00.000Z';
    deserializedJson.testTypes[0].testTypeStartTimestamp = '2021-01-01T00:00:00.000Z';
    deserializedJson.testTypes[0].numberOfSeatbeltsFitted = 5;
    deserializedJson.testTypes[0].lastSeatbeltInstallationCheckDate = '2021-01-01';
    deserializedJson.testTypes[0].seatbeltInstallationCheckDate = false;
    deserializedJson.testTypes[0].testResult = 'pass';
    deserializedJson.testTypes[0].reasonForAbandoning = 'NEW-REASON-FOR-ABANDONING';
    deserializedJson.testTypes[0].additionalNotesRecorded = 'NEW-ADDITIONAL-NOTES-RECORDED';
    deserializedJson.testTypes[0].additionalCommentsForAbandon = 'NEW-ADDITIONAL-COMMENTS-FOR-ABANDON';
    deserializedJson.testTypes[0].particulateTrapFitted = 't';
    deserializedJson.testTypes[0].particulateTrapSerialNumber = 'trap';
    deserializedJson.testTypes[0].modificationTypeUsed = 'NEW-MODIFICATION-TYPE-USED';
    deserializedJson.testTypes[0].smokeTestKLimitApplied = 'NEW-SMOKE-TEST-K-LIMIT-APPLIED';

    const serializedJSONb = marshall(deserializedJson);

    const event = {
      Records: [
        {
          body: JSON.stringify({
            eventSourceARN:
              'arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000',
            eventName: 'INSERT',
            dynamodb: {
              NewImage: serializedJSONb,
            },
          }),
        },
      ],
    };

    await processStreamEvent(event, exampleContext(), () => {

    });

    const vehicleResultSet = await executeSql(
      `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
            FROM \`vehicle\`
            WHERE \`vehicle\`.\`id\` IN (
              SELECT \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "${testResultsJson.systemNumber.S}"
            )`,
    );

    expect(vehicleResultSet.rows).toHaveLength(1);
    expect(vehicleResultSet.rows[0].system_number).toBe(
      'SYSTEM-NUMBER-5-U',
    );
    expect(vehicleResultSet.rows[0].vin).toBe('VIN5');
    expect(vehicleResultSet.rows[0].vrm_trm).toBe('VRM-5');
    expect(vehicleResultSet.rows[0].trailer_id).toBe('TRL-5');
    expect(
      (vehicleResultSet.rows[0].createdAt as Date).toUTCString(),
    ).not.toBeNull();

    const testResultSet = await executeSql(
      `SELECT \`test_station_id\`, \`tester_id\`, \`vehicle_class_id\`, \`preparer_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`,
                  \`fuel_emission_id\`, \`test_type_id\`, \`id\`, \`testResultId\`, \`testCode\`,  \`certificateNumber\`,  \`secondaryCertificateNumber\`,
                  \`testExpiryDate\`,  \`testAnniversaryDate\`,  \`testTypeStartTimestamp\`,  \`numberOfSeatbeltsFitted\`, \`lastSeatbeltInstallationCheckDate\`,
                  \`seatbeltInstallationCheckDate\`,  \`testResult\`,  \`reasonForAbandoning\`,  \`additionalNotesRecorded\`,  \`additionalCommentsForAbandon\`,
                  \`particulateTrapFitted\`,  \`particulateTrapSerialNumber\`,  \`modificationTypeUsed\`, \`smokeTestKLimitApplied\`
          FROM \`test_result\`
          WHERE \`test_result\`.\`vehicle_id\` = ${vehicleResultSet.rows[0].id}`,
    );

    expect(testResultSet.rows[0].testResultId).toBe('TEST-RESULT-ID-5-U');
    expect(testResultSet.rows).toHaveLength(1);
    expect(testResultSet.rows[0].testCode).toBe('444');
    expect(testResultSet.rows[0].certificateNumber).toBe('W323232');
    expect(testResultSet.rows[0].secondaryCertificateNumber).toBe(
      '111111',
    );
    expect(testResultSet.rows[0].testExpiryDate).toEqual(
      new Date('2022-01-01'),
    );
    expect(testResultSet.rows[0].testAnniversaryDate).toEqual(
      new Date('2022-01-01'),
    );
    expect(
      (testResultSet.rows[0].testTypeStartTimestamp as Date).toISOString(),
    ).toBe('2021-01-01T00:00:00.000Z');
    expect(
      (testResultSet.rows[0]
        .lastSeatbeltInstallationCheckDate as Date).toISOString(),
    ).toBe('2021-01-01T00:00:00.000Z');
    expect(testResultSet.rows[0].seatbeltInstallationCheckDate).toBe(0);
    expect(testResultSet.rows[0].testResult).toBe('pass');
    expect(testResultSet.rows[0].reasonForAbandoning).toBe(
      'NEW-REASON-FOR-ABANDONING',
    );
    expect(testResultSet.rows[0].additionalNotesRecorded).toBe(
      'NEW-ADDITIONAL-NOTES-RECORDED',
    );
    expect(testResultSet.rows[0].particulateTrapFitted).toBe('t');
    expect(testResultSet.rows[0].particulateTrapSerialNumber).toBe('trap');
    expect(testResultSet.rows[0].modificationTypeUsed).toBe(
      'NEW-MODIFICATION-TYPE-USED',
    );
    expect(testResultSet.rows[0].smokeTestKLimitApplied).toBe(
      'NEW-SMOKE-TEST-K-LIMIT-APPLIED',
    );

    const {
      test_station_id,
      tester_id,
      vehicle_class_id,
      preparer_id,
      createdBy_Id,
      lastUpdatedBy_Id,
      fuel_emission_id,
      test_type_id,
      id,
    } = testResultSet.rows[0];

    const testStationResultSet = await executeSql(
      `SELECT \`pNumber\`, \`name\`, \`type\`
            FROM \`test_station\`
            WHERE \`test_station\`.\`id\` = ${test_station_id}`,
    );
    expect(testStationResultSet.rows).toHaveLength(1);
    expect(testStationResultSet.rows[0].pNumber).toBe('P-NUMBER-5');
    expect(testStationResultSet.rows[0].name).toBe('TEST-STATION-NAME-5');
    expect(testStationResultSet.rows[0].type).toBe('atf');

    const testerResultSet = await executeSql(
      `SELECT \`staffId\`, \`name\`, \`email_address\`
            FROM \`tester\`
            WHERE \`tester\`.\`id\` = ${tester_id}`,
    );
    expect(testerResultSet.rows).toHaveLength(1);
    expect(testerResultSet.rows[0].staffId).toBe('TESTER-STAFF-ID-5');
    expect(testerResultSet.rows[0].name).toBe('TESTER-NAME-5');
    expect(testerResultSet.rows[0].email_address).toBe(
      'TESTER-EMAIL-ADDRESS-5',
    );

    const vehicleClassResultSet = await executeSql(
      `SELECT \`code\`,
                  \`description\`,
                  \`vehicleType\`,
                  \`vehicleSize\`,
                  \`vehicleConfiguration\`,
                  \`euVehicleCategory\`
            FROM \`vehicle_class\`
            WHERE \`vehicle_class\`.\`id\` = ${vehicle_class_id}`,
    );
    expect(vehicleClassResultSet.rows).toHaveLength(1);
    expect(vehicleClassResultSet.rows[0].code).toBe('2');
    expect(vehicleClassResultSet.rows[0].description).toBe(
      'motorbikes over 200cc or with a sidecar',
    );
    expect(vehicleClassResultSet.rows[0].vehicleType).toBe('psv');
    expect(vehicleClassResultSet.rows[0].vehicleSize).toBe('large');
    expect(vehicleClassResultSet.rows[0].vehicleConfiguration).toBe(
      'rigid',
    );
    expect(vehicleClassResultSet.rows[0].euVehicleCategory).toBe('m1');

    const preparerResultSet = await executeSql(
      `SELECT \`preparerId\`, \`name\`
            FROM \`preparer\`
            WHERE \`preparer\`.\`id\` = ${preparer_id}`,
    );
    expect(preparerResultSet.rows).toHaveLength(1);
    expect(preparerResultSet.rows[0].preparerId).toBe('PREPARER-ID-5');
    expect(preparerResultSet.rows[0].name).toBe('PREPARER-NAME-5');

    const createdByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${createdBy_Id}`,
    );
    expect(createdByResultSet.rows).toHaveLength(1);
    expect(createdByResultSet.rows[0].identityId).toBe('CREATED-BY-ID-5');
    expect(createdByResultSet.rows[0].name).toBe('CREATED-BY-NAME-5');

    const lastUpdatedByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${lastUpdatedBy_Id}`,
    );
    expect(lastUpdatedByResultSet.rows).toHaveLength(1);
    expect(lastUpdatedByResultSet.rows[0].identityId).toBe(
      'LAST-UPDATED-BY-ID-5',
    );
    expect(lastUpdatedByResultSet.rows[0].name).toBe(
      'LAST-UPDATED-BY-NAME-5',
    );

    const fuelEmissionResultSet = await executeSql(
      `SELECT \`modTypeCode\`, \`description\`, \`emissionStandard\`, \`fuelType\`
            FROM \`fuel_emission\`
            WHERE \`fuel_emission\`.\`id\` = ${fuel_emission_id}`,
    );
    expect(fuelEmissionResultSet.rows).toHaveLength(1);
    expect(fuelEmissionResultSet.rows[0].modTypeCode).toBe('p');
    expect(fuelEmissionResultSet.rows[0].description).toBe(
      'particulate trap',
    );
    expect(fuelEmissionResultSet.rows[0].emissionStandard).toBe(
      '0.10 g/kWh Euro 3 PM',
    );
    expect(fuelEmissionResultSet.rows[0].fuelType).toBe('diesel');

    const testTypeResultSet = await executeSql(
      `SELECT \`testTypeClassification\`, \`testTypeName\`
            FROM \`test_type\`
            WHERE \`test_type\`.\`id\` = ${test_type_id}`,
    );
    expect(testTypeResultSet.rows).toHaveLength(1);
    expect(testTypeResultSet.rows[0].testTypeClassification).toBe(
      '2323232323232323232323',
    );
    expect(testTypeResultSet.rows[0].testTypeName).toBe('TEST-TYPE-NAME');

    const testDefectResultSet = await executeSql(
      `SELECT \`test_result_id\`, \`defect_id\`, \`location_id\`, \`notes\`, \`prs\`, \`prohibitionIssued\`
            FROM \`test_defect\`
            WHERE \`test_defect\`.\`test_result_id\` = ${id}`,
    );

    expect(testDefectResultSet.rows).toHaveLength(1);
    expect(testDefectResultSet.rows[0].test_result_id).toEqual(id);
    expect(testDefectResultSet.rows[0].defect_id).toBe(1);
    expect(testDefectResultSet.rows[0].location_id).toBe(1);
    expect(testDefectResultSet.rows[0].notes).toBe('NOTES');
    expect(testDefectResultSet.rows[0].prs).toBe(1);
    expect(testDefectResultSet.rows[0].prohibitionIssued).toBe(1);

    const defectResultSet = await executeSql(
      `SELECT \`imNumber\`,
                  \`imDescription\`,
                  \`itemNumber\`,
                  \`itemDescription\`,
                  \`deficiencyRef\`,
                  \`deficiencyId\`,
                  \`deficiencySubId\`,
                  \`deficiencyCategory\`,
                  \`deficiencyText\`,
                  \`stdForProhibition\`
            FROM \`defect\`
            WHERE \`defect\`.\`id\` = ${testDefectResultSet.rows[0].defect_id}`,
    );
    expect(defectResultSet.rows).toHaveLength(1);
    expect(defectResultSet.rows[0].imNumber).toBe(5);
    expect(defectResultSet.rows[0].imDescription).toBe('IM-DESCRIPTION-5');
    expect(defectResultSet.rows[0].itemNumber).toBe(1);
    expect(defectResultSet.rows[0].itemDescription).toBe(
      'ITEM-DESCRIPTION-5',
    );
    expect(defectResultSet.rows[0].deficiencyRef).toBe('DEFICIENCY-REF-5');
    expect(defectResultSet.rows[0].deficiencyId).toBe('a');
    expect(defectResultSet.rows[0].deficiencySubId).toBe('mdclxvi');
    expect(defectResultSet.rows[0].deficiencyCategory).toBe('advisory');
    expect(defectResultSet.rows[0].deficiencyText).toBe(
      'DEFICIENCY-TEXT-5',
    );
    expect(defectResultSet.rows[0].itemNumber).toBe(1);

    const customDefectResultSet = await executeSql(
      `SELECT \`test_result_id\`, \`referenceNumber\`, \`defectName\`, \`defectNotes\`
            FROM \`custom_defect\`
            WHERE \`custom_defect\`.\`test_result_id\` = ${id}`,
    );

    const customDefectLastIndex = customDefectResultSet.rows.length - 1;

    expect(
      customDefectResultSet.rows[customDefectLastIndex].test_result_id,
    ).toEqual(id);
    expect(
      customDefectResultSet.rows[customDefectLastIndex].referenceNumber,
    ).toBe('def5');
    expect(
      customDefectResultSet.rows[customDefectLastIndex].defectName,
    ).toBe('DEFECT-NAME-5');
    expect(
      customDefectResultSet.rows[customDefectLastIndex].defectNotes,
    ).toBe('DEFECT-NOTES-5');
  });

  it('should correctly insert when unique attributes changed', async () => {
    const deserializedJson = unmarshall(testResultsJson);
    deserializedJson.testTypes[0].testNumber = 'NewTestNumber';
    deserializedJson.testTypes[0].testCode = '555';
    deserializedJson.testTypes[0].certificateNumber = 'W43434343';
    deserializedJson.testTypes[0].secondaryCertificateNumber = '111111';
    deserializedJson.testTypes[0].testExpiryDate = '2022-01-02T00:00:00.000Z';
    deserializedJson.testTypes[0].testAnniversaryDate = '2022-01-02T00:00:00.000Z';
    deserializedJson.testTypes[0].testTypeStartTimestamp = '2021-01-02T00:00:00.000Z';
    deserializedJson.testTypes[0].numberOfSeatbeltsFitted = 5;
    deserializedJson.testTypes[0].lastSeatbeltInstallationCheckDate = '2021-01-02';
    deserializedJson.testTypes[0].seatbeltInstallationCheckDate = false;
    deserializedJson.testTypes[0].testResult = 'pass';
    deserializedJson.testTypes[0].reasonForAbandoning = 'NEW-REASON-FOR-ABANDONING';
    deserializedJson.testTypes[0].additionalNotesRecorded = 'NEW-ADDITIONAL-NOTES-RECORDED';
    deserializedJson.testTypes[0].additionalCommentsForAbandon = 'NEW-ADDITIONAL-COMMENTS-FOR-ABANDON';
    deserializedJson.testTypes[0].particulateTrapFitted = 't';
    deserializedJson.testTypes[0].particulateTrapSerialNumber = 'trap';
    deserializedJson.testTypes[0].modificationTypeUsed = 'NEW-MODIFICATION-TYPE-USED';
    deserializedJson.testTypes[0].smokeTestKLimitApplied = 'NEW-SMOKE-TEST-K-LIMIT-APPLIED';
    deserializedJson.testTypes[0].defects[0].imDescription = 'IM-DESCRIPTION-5a';

    const serializedJSONb = marshall(deserializedJson);

    const event = {
      Records: [
        {
          body: JSON.stringify({
            eventSourceARN:
              'arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000',
            eventName: 'INSERT',
            dynamodb: {
              NewImage: serializedJSONb,
            },
          }),
        },
      ],
    };

    await processStreamEvent(event, exampleContext(), () => {

    });

    const vehicleResultSet = await executeSql(
      `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
            FROM \`vehicle\`
            WHERE \`vehicle\`.\`id\` IN (
              SELECT \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "${testResultsJson.systemNumber.S}"
            )`,
    );

    expect(vehicleResultSet.rows).toHaveLength(1);
    expect(vehicleResultSet.rows[0].system_number).toBe(
      'SYSTEM-NUMBER-5-U',
    );
    expect(vehicleResultSet.rows[0].vin).toBe('VIN5');
    expect(vehicleResultSet.rows[0].vrm_trm).toBe('VRM-5');
    expect(vehicleResultSet.rows[0].trailer_id).toBe('TRL-5');
    expect(
      (vehicleResultSet.rows[0].createdAt as Date).toUTCString(),
    ).not.toBeNull();

    const testResultSet = await executeSql(
      `SELECT \`test_station_id\`, \`tester_id\`, \`vehicle_class_id\`, \`preparer_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`,
                  \`fuel_emission_id\`, \`test_type_id\`, \`id\`, \`testResultId\`, \`testCode\`,  \`certificateNumber\`,  \`secondaryCertificateNumber\`,
                  \`testExpiryDate\`,  \`testAnniversaryDate\`,  \`testTypeStartTimestamp\`,  \`numberOfSeatbeltsFitted\`, \`lastSeatbeltInstallationCheckDate\`,
                  \`seatbeltInstallationCheckDate\`,  \`testResult\`,  \`reasonForAbandoning\`,  \`additionalNotesRecorded\`,  \`additionalCommentsForAbandon\`,
                  \`particulateTrapFitted\`,  \`particulateTrapSerialNumber\`,  \`modificationTypeUsed\`, \`smokeTestKLimitApplied\`
          FROM \`test_result\`
          WHERE \`test_result\`.\`vehicle_id\` = ${vehicleResultSet.rows[0].id}`,
    );

    expect(testResultSet.rows[0].testResultId).toBe('TEST-RESULT-ID-5-U');
    expect(testResultSet.rows).toHaveLength(2);
    expect(testResultSet.rows[0].testCode).toBe('555');
    expect(testResultSet.rows[0].certificateNumber).toBe('W43434343');
    expect(testResultSet.rows[0].secondaryCertificateNumber).toBe(
      '111111',
    );
    expect(testResultSet.rows[0].testExpiryDate).toEqual(
      new Date('2022-01-02'),
    );
    expect(testResultSet.rows[0].testAnniversaryDate).toEqual(
      new Date('2022-01-02'),
    );
    expect(
      (testResultSet.rows[0].testTypeStartTimestamp as Date).toISOString(),
    ).toBe('2021-01-02T00:00:00.000Z');
    expect(
      (testResultSet.rows[0]
        .lastSeatbeltInstallationCheckDate as Date).toISOString(),
    ).toBe('2021-01-02T00:00:00.000Z');
    expect(testResultSet.rows[0].seatbeltInstallationCheckDate).toBe(0);
    expect(testResultSet.rows[0].testResult).toBe('pass');
    expect(testResultSet.rows[0].reasonForAbandoning).toBe(
      'NEW-REASON-FOR-ABANDONING',
    );
    expect(testResultSet.rows[0].additionalNotesRecorded).toBe(
      'NEW-ADDITIONAL-NOTES-RECORDED',
    );
    expect(testResultSet.rows[0].particulateTrapFitted).toBe('t');
    expect(testResultSet.rows[0].particulateTrapSerialNumber).toBe('trap');
    expect(testResultSet.rows[0].modificationTypeUsed).toBe(
      'NEW-MODIFICATION-TYPE-USED',
    );
    expect(testResultSet.rows[0].smokeTestKLimitApplied).toBe(
      'NEW-SMOKE-TEST-K-LIMIT-APPLIED',
    );

    const {
      test_station_id,
      tester_id,
      vehicle_class_id,
      preparer_id,
      createdBy_Id,
      lastUpdatedBy_Id,
      fuel_emission_id,
      test_type_id,
      id,
    } = testResultSet.rows[0];

    const testStationResultSet = await executeSql(
      `SELECT \`pNumber\`, \`name\`, \`type\`
            FROM \`test_station\`
            WHERE \`test_station\`.\`id\` = ${test_station_id}`,
    );
    expect(testStationResultSet.rows).toHaveLength(1);
    expect(testStationResultSet.rows[0].pNumber).toBe('P-NUMBER-5');
    expect(testStationResultSet.rows[0].name).toBe('TEST-STATION-NAME-5');
    expect(testStationResultSet.rows[0].type).toBe('atf');

    const testerResultSet = await executeSql(
      `SELECT \`staffId\`, \`name\`, \`email_address\`
            FROM \`tester\`
            WHERE \`tester\`.\`id\` = ${tester_id}`,
    );
    expect(testerResultSet.rows).toHaveLength(1);
    expect(testerResultSet.rows[0].staffId).toBe('TESTER-STAFF-ID-5');
    expect(testerResultSet.rows[0].name).toBe('TESTER-NAME-5');
    expect(testerResultSet.rows[0].email_address).toBe(
      'TESTER-EMAIL-ADDRESS-5',
    );

    const vehicleClassResultSet = await executeSql(
      `SELECT \`code\`,
                  \`description\`,
                  \`vehicleType\`,
                  \`vehicleSize\`,
                  \`vehicleConfiguration\`,
                  \`euVehicleCategory\`
            FROM \`vehicle_class\`
            WHERE \`vehicle_class\`.\`id\` = ${vehicle_class_id}`,
    );
    expect(vehicleClassResultSet.rows).toHaveLength(1);
    expect(vehicleClassResultSet.rows[0].code).toBe('2');
    expect(vehicleClassResultSet.rows[0].description).toBe(
      'motorbikes over 200cc or with a sidecar',
    );
    expect(vehicleClassResultSet.rows[0].vehicleType).toBe('psv');
    expect(vehicleClassResultSet.rows[0].vehicleSize).toBe('large');
    expect(vehicleClassResultSet.rows[0].vehicleConfiguration).toBe(
      'rigid',
    );
    expect(vehicleClassResultSet.rows[0].euVehicleCategory).toBe('m1');

    const preparerResultSet = await executeSql(
      `SELECT \`preparerId\`, \`name\`
            FROM \`preparer\`
            WHERE \`preparer\`.\`id\` = ${preparer_id}`,
    );
    expect(preparerResultSet.rows).toHaveLength(1);
    expect(preparerResultSet.rows[0].preparerId).toBe('PREPARER-ID-5');
    expect(preparerResultSet.rows[0].name).toBe('PREPARER-NAME-5');

    const createdByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${createdBy_Id}`,
    );
    expect(createdByResultSet.rows).toHaveLength(1);
    expect(createdByResultSet.rows[0].identityId).toBe('CREATED-BY-ID-5');
    expect(createdByResultSet.rows[0].name).toBe('CREATED-BY-NAME-5');

    const lastUpdatedByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${lastUpdatedBy_Id}`,
    );
    expect(lastUpdatedByResultSet.rows).toHaveLength(1);
    expect(lastUpdatedByResultSet.rows[0].identityId).toBe(
      'LAST-UPDATED-BY-ID-5',
    );
    expect(lastUpdatedByResultSet.rows[0].name).toBe(
      'LAST-UPDATED-BY-NAME-5',
    );

    const fuelEmissionResultSet = await executeSql(
      `SELECT \`modTypeCode\`, \`description\`, \`emissionStandard\`, \`fuelType\`
            FROM \`fuel_emission\`
            WHERE \`fuel_emission\`.\`id\` = ${fuel_emission_id}`,
    );
    expect(fuelEmissionResultSet.rows).toHaveLength(1);
    expect(fuelEmissionResultSet.rows[0].modTypeCode).toBe('p');
    expect(fuelEmissionResultSet.rows[0].description).toBe(
      'particulate trap',
    );
    expect(fuelEmissionResultSet.rows[0].emissionStandard).toBe(
      '0.10 g/kWh Euro 3 PM',
    );
    expect(fuelEmissionResultSet.rows[0].fuelType).toBe('diesel');

    const testTypeResultSet = await executeSql(
      `SELECT \`testTypeClassification\`, \`testTypeName\`
            FROM \`test_type\`
            WHERE \`test_type\`.\`id\` = ${test_type_id}`,
    );
    expect(testTypeResultSet.rows).toHaveLength(1);
    expect(testTypeResultSet.rows[0].testTypeClassification).toBe(
      '2323232323232323232323',
    );
    expect(testTypeResultSet.rows[0].testTypeName).toBe('TEST-TYPE-NAME');

    const testDefectResultSet = await executeSql(
      `SELECT \`test_result_id\`, \`defect_id\`, \`location_id\`, \`notes\`, \`prs\`, \`prohibitionIssued\`
            FROM \`test_defect\`
            WHERE \`test_defect\`.\`test_result_id\` = ${id}`,
    );

    expect(testDefectResultSet.rows).toHaveLength(1);
    expect(testDefectResultSet.rows[0].test_result_id).toEqual(id);
    expect(testDefectResultSet.rows[0].defect_id).toBe(2);
    expect(testDefectResultSet.rows[0].location_id).toBe(1);
    expect(testDefectResultSet.rows[0].notes).toBe('NOTES');
    expect(testDefectResultSet.rows[0].prs).toBe(1);
    expect(testDefectResultSet.rows[0].prohibitionIssued).toBe(1);

    const defectResultSet = await executeSql(
      `SELECT \`imNumber\`,
                  \`imDescription\`,
                  \`itemNumber\`,
                  \`itemDescription\`,
                  \`deficiencyRef\`,
                  \`deficiencyId\`,
                  \`deficiencySubId\`,
                  \`deficiencyCategory\`,
                  \`deficiencyText\`,
                  \`stdForProhibition\`
            FROM \`defect\`
            WHERE \`defect\`.\`id\` = ${testDefectResultSet.rows[0].defect_id}`,
    );
    expect(defectResultSet.rows).toHaveLength(1);
    expect(defectResultSet.rows[0].imNumber).toBe(5);
    expect(defectResultSet.rows[0].imDescription).toBe(
      'IM-DESCRIPTION-5a',
    );
    expect(defectResultSet.rows[0].itemNumber).toBe(1);
    expect(defectResultSet.rows[0].itemDescription).toBe(
      'ITEM-DESCRIPTION-5',
    );
    expect(defectResultSet.rows[0].deficiencyRef).toBe('DEFICIENCY-REF-5');
    expect(defectResultSet.rows[0].deficiencyId).toBe('a');
    expect(defectResultSet.rows[0].deficiencySubId).toBe('mdclxvi');
    expect(defectResultSet.rows[0].deficiencyCategory).toBe('advisory');
    expect(defectResultSet.rows[0].deficiencyText).toBe(
      'DEFICIENCY-TEXT-5',
    );
    expect(defectResultSet.rows[0].itemNumber).toBe(1);

    const customDefectResultSet = await executeSql(
      `SELECT \`test_result_id\`, \`referenceNumber\`, \`defectName\`, \`defectNotes\`
            FROM \`custom_defect\`
            WHERE \`custom_defect\`.\`test_result_id\` = ${id}`,
    );

    const customDefectLastIndex = customDefectResultSet.rows.length - 1;

    expect(
      customDefectResultSet.rows[customDefectLastIndex].test_result_id,
    ).toEqual(id);
    expect(
      customDefectResultSet.rows[customDefectLastIndex].referenceNumber,
    ).toBe('def5');
    expect(
      customDefectResultSet.rows[customDefectLastIndex].defectName,
    ).toBe('DEFECT-NAME-5');
    expect(
      customDefectResultSet.rows[customDefectLastIndex].defectNotes,
    ).toBe('DEFECT-NOTES-5');
  });

  it('A new Test Result with two TestTypes is inserted correctly', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            eventSourceARN:
              'arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000',
            eventName: 'INSERT',
            dynamodb: {
              NewImage: testResultsJsonWithTestTypes,
            },
          }),
        },
      ],
    };

    await processStreamEvent(event, exampleContext(), () => {

    });

    const vehicleResultSet = await executeSql(
      `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
            FROM \`vehicle\`
            WHERE \`vehicle\`.\`id\` IN (
              SELECT \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "${testResultsJsonWithTestTypes.systemNumber.S}"
            )`,
    );

    expect(vehicleResultSet.rows).toHaveLength(1);
    expect(vehicleResultSet.rows[0].system_number).toBe(
      'SYSTEM-NUMBER-3-U',
    );
    expect(vehicleResultSet.rows[0].vin).toBe('VIN3');
    expect(vehicleResultSet.rows[0].vrm_trm).toBe('VRM-3');
    expect(vehicleResultSet.rows[0].trailer_id).toBe('TRL-3');
    expect(
      (vehicleResultSet.rows[0].createdAt as Date).toUTCString(),
    ).not.toBeNull();

    const testResultSet = await executeSql(
      `SELECT \`test_station_id\`, \`tester_id\`, \`vehicle_class_id\`, \`preparer_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`,
                  \`fuel_emission_id\`, \`test_type_id\`, \`id\`, \`testResultId\`, \`testCode\`,  \`certificateNumber\`,  \`secondaryCertificateNumber\`,
                  \`testExpiryDate\`,  \`testAnniversaryDate\`,  \`testTypeStartTimestamp\`,  \`numberOfSeatbeltsFitted\`, \`lastSeatbeltInstallationCheckDate\`,
                  \`seatbeltInstallationCheckDate\`,  \`testResult\`,  \`reasonForAbandoning\`,  \`additionalNotesRecorded\`,  \`additionalCommentsForAbandon\`,
                  \`particulateTrapFitted\`,  \`particulateTrapSerialNumber\`,  \`modificationTypeUsed\`, \`smokeTestKLimitApplied\`, \`testTypeEndTimestamp\`
          FROM \`test_result\`
          WHERE \`test_result\`.\`vehicle_id\` = ${vehicleResultSet.rows[0].id}
          ORDER BY id ASC`,
    );

    expect(testResultSet.rows).toHaveLength(2);

    expect(testResultSet.rows[0].testResultId).toBe('TEST-RESULT-ID-3-U');
    expect(testResultSet.rows[0].testCode).toBe('333');
    expect(testResultSet.rows[0].certificateNumber).toBe('CERTIFICATE-NO');
    expect(testResultSet.rows[0].secondaryCertificateNumber).toBe(
      '2ND-CERTIFICATE-NO',
    );
    expect(testResultSet.rows[0].testExpiryDate).toEqual(
      new Date('2020-01-01'),
    );
    expect(testResultSet.rows[0].testAnniversaryDate).toEqual(
      new Date('2020-01-01'),
    );
    expect(
      (testResultSet.rows[0].testTypeStartTimestamp as Date).toISOString(),
    ).toBe('2020-01-01T00:00:00.000Z');
    expect(
      (testResultSet.rows[0].testTypeEndTimestamp as Date).toISOString(),
    ).toBe('2020-01-01T16:54:44.123Z');
    expect(testResultSet.rows[0].lastSeatbeltInstallationCheckDate).toEqual(
      new Date('2020-01-01'),
    );
    expect(testResultSet.rows[0].seatbeltInstallationCheckDate).toBe(1);
    expect(testResultSet.rows[0].testResult).toBe('fail');
    expect(testResultSet.rows[0].reasonForAbandoning).toBe(
      'REASON-FOR-ABANDONING',
    );
    expect(testResultSet.rows[0].additionalNotesRecorded).toBe(
      'ADDITIONAL-NOTES-RECORDED',
    );
    expect(testResultSet.rows[0].particulateTrapFitted).toBe(
      'PARTICULATE-TRAP-FITTED',
    );
    expect(testResultSet.rows[0].particulateTrapSerialNumber).toBe(
      'PARTICULATE-TRAP-SERIAL-NUMBER',
    );
    expect(testResultSet.rows[0].modificationTypeUsed).toBe(
      'MODIFICATION-TYPE-USED',
    );
    expect(testResultSet.rows[0].smokeTestKLimitApplied).toBe(
      'SMOKE-TEST-K-LIMIT-APPLIED',
    );

    expect(testResultSet.rows[1].testResultId).toBe('TEST-RESULT-ID-3-U');
    expect(testResultSet.rows[1].testCode).toBe('aav');
    expect(testResultSet.rows[1].certificateNumber).toBe('W123123');
    expect(testResultSet.rows[1].secondaryCertificateNumber).toBeNull();
    expect(testResultSet.rows[1].testExpiryDate).toEqual(
      new Date(2022, 5, 30),
    );
    expect(testResultSet.rows[1].testAnniversaryDate).toEqual(
      new Date(2022, 5, 30),
    );
    expect(
      (testResultSet.rows[1].testTypeStartTimestamp as Date).toISOString(),
    ).toBe('2021-06-21T12:07:22.000Z');
    expect(
      (testResultSet.rows[1].testTypeEndTimestamp as Date).toISOString(),
    ).toBe('2021-06-21T12:59:07.000Z');
    expect(
      testResultSet.rows[1].lastSeatbeltInstallationCheckDate,
    ).toBeNull();
    expect(testResultSet.rows[1].seatbeltInstallationCheckDate).toBe(0);
    expect(testResultSet.rows[1].testResult).toBe('pass');
    expect(testResultSet.rows[1].reasonForAbandoning).toBeNull();
    expect(testResultSet.rows[1].additionalNotesRecorded).toBe(
      'No emission plate default 0.70',
    );
    expect(testResultSet.rows[1].particulateTrapFitted).toBeNull();
    expect(testResultSet.rows[1].particulateTrapSerialNumber).toBeNull();
    expect(testResultSet.rows[1].modificationTypeUsed).toBeNull();
    expect(testResultSet.rows[1].smokeTestKLimitApplied).toBeNull();

    const {
      test_station_id,
      tester_id,
      vehicle_class_id,
      preparer_id,
      createdBy_Id,
      lastUpdatedBy_Id,
      fuel_emission_id,
      test_type_id,
      id,
    } = testResultSet.rows[0];

    const testStationResultSet = await executeSql(
      `SELECT \`pNumber\`, \`name\`, \`type\`
            FROM \`test_station\`
            WHERE \`test_station\`.\`id\` = ${test_station_id}`,
    );

    expect(testStationResultSet.rows).toHaveLength(1);
    expect(testStationResultSet.rows[0].pNumber).toBe('P-NUMBER-3');
    expect(testStationResultSet.rows[0].name).toBe('TEST-STATION-NAME-3');
    expect(testStationResultSet.rows[0].type).toBe('atf');

    const testerResultSet = await executeSql(
      `SELECT \`staffId\`, \`name\`, \`email_address\`
            FROM \`tester\`
            WHERE \`tester\`.\`id\` = ${tester_id}`,
    );
    expect(testerResultSet.rows).toHaveLength(1);
    expect(testerResultSet.rows[0].staffId).toBe('999999998');
    expect(testerResultSet.rows[0].name).toBe('TESTER-NAME-3');
    expect(testerResultSet.rows[0].email_address).toBe(
      'TESTER-EMAIL-ADDRESS-3',
    );

    const vehicleClassResultSet = await executeSql(
      `SELECT \`code\`,
                  \`description\`,
                  \`vehicleType\`,
                  \`vehicleSize\`,
                  \`vehicleConfiguration\`,
                  \`euVehicleCategory\`
            FROM \`vehicle_class\`
            WHERE \`vehicle_class\`.\`id\` = ${vehicle_class_id}`,
    );
    expect(vehicleClassResultSet.rows).toHaveLength(1);
    expect(vehicleClassResultSet.rows[0].code).toBe('v');
    expect(vehicleClassResultSet.rows[0].description).toBe(
      'heavy goods vehicle',
    );
    expect(vehicleClassResultSet.rows[0].vehicleType).toBe('hgv');
    expect(vehicleClassResultSet.rows[0].vehicleSize).toBe('large');
    expect(vehicleClassResultSet.rows[0].vehicleConfiguration).toBe(
      'rigid',
    );
    expect(vehicleClassResultSet.rows[0].euVehicleCategory).toBe('m1');

    const preparerResultSet = await executeSql(
      `SELECT \`preparerId\`, \`name\`
            FROM \`preparer\`
            WHERE \`preparer\`.\`id\` = ${preparer_id}`,
    );
    expect(preparerResultSet.rows).toHaveLength(1);
    expect(preparerResultSet.rows[0].preparerId).toBe('999999998');
    expect(preparerResultSet.rows[0].name).toBe('PREPARER-NAME-3');

    const createdByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${createdBy_Id}`,
    );
    expect(createdByResultSet.rows).toHaveLength(1);
    expect(createdByResultSet.rows[0].identityId).toBe('CREATED-BY-ID-3');
    expect(createdByResultSet.rows[0].name).toBe('CREATED-BY-NAME-3');

    const lastUpdatedByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${lastUpdatedBy_Id}`,
    );
    expect(lastUpdatedByResultSet.rows).toHaveLength(1);
    expect(lastUpdatedByResultSet.rows[0].identityId).toBe(
      'LAST-UPDATED-BY-ID-3',
    );
    expect(lastUpdatedByResultSet.rows[0].name).toBe(
      'LAST-UPDATED-BY-NAME-3',
    );

    const fuelEmissionResultSet = await executeSql(
      `SELECT \`modTypeCode\`, \`description\`, \`emissionStandard\`, \`fuelType\`
            FROM \`fuel_emission\`
            WHERE \`fuel_emission\`.\`id\` = ${fuel_emission_id}`,
    );
    expect(fuelEmissionResultSet.rows).toHaveLength(1);
    expect(fuelEmissionResultSet.rows[0].modTypeCode).toBe('p');
    expect(fuelEmissionResultSet.rows[0].description).toBe(
      'particulate trap',
    );
    expect(fuelEmissionResultSet.rows[0].emissionStandard).toBe(
      '0.10 g/kWh Euro 3 PM',
    );
    expect(fuelEmissionResultSet.rows[0].fuelType).toBe('diesel');

    const testTypeResultSet = await executeSql(
      `SELECT \`testTypeClassification\`, \`testTypeName\`
            FROM \`test_type\`
            WHERE \`test_type\`.\`id\` = ${test_type_id}`,
    );
    expect(testTypeResultSet.rows).toHaveLength(1);
    expect(testTypeResultSet.rows[0].testTypeClassification).toBe(
      '2323232323232323232323',
    );
    expect(testTypeResultSet.rows[0].testTypeName).toBe('TEST-TYPE-NAME');

    const testDefectResultSet = await executeSql(
      `SELECT \`test_result_id\`, \`defect_id\`, \`location_id\`, \`notes\`, \`prs\`, \`prohibitionIssued\`
            FROM \`test_defect\`
            WHERE \`test_defect\`.\`test_result_id\` = ${id}`,
    );

    const testDefectLastIndex = testDefectResultSet.rows.length - 1;

    expect(
      testDefectResultSet.rows[testDefectLastIndex].test_result_id,
    ).toEqual(id);
    expect(testDefectResultSet.rows[testDefectLastIndex].defect_id).toBe(
      3,
    );
    expect(testDefectResultSet.rows[testDefectLastIndex].location_id).toBe(
      1,
    );
    expect(testDefectResultSet.rows[testDefectLastIndex].notes).toBe(
      'NOTES',
    );
    expect(testDefectResultSet.rows[testDefectLastIndex].prs).toBe(1);
    expect(
      testDefectResultSet.rows[testDefectLastIndex].prohibitionIssued,
    ).toBe(1);

    const defectResultSet = await executeSql(
      `SELECT \`imNumber\`,
                  \`imDescription\`,
                  \`itemNumber\`,
                  \`itemDescription\`,
                  \`deficiencyRef\`,
                  \`deficiencyId\`,
                  \`deficiencySubId\`,
                  \`deficiencyCategory\`,
                  \`deficiencyText\`,
                  \`stdForProhibition\`
            FROM \`defect\`
            WHERE \`defect\`.\`id\` = ${testDefectResultSet.rows[testDefectLastIndex].defect_id}`,
    );
    expect(defectResultSet.rows).toHaveLength(1);
    expect(defectResultSet.rows[0].imNumber).toBe(3);
    expect(defectResultSet.rows[0].imDescription).toBe('IM-DESCRIPTION-3');
    expect(defectResultSet.rows[0].itemNumber).toBe(1);
    expect(defectResultSet.rows[0].itemDescription).toBe(
      'ITEM-DESCRIPTION-3',
    );
    expect(defectResultSet.rows[0].deficiencyRef).toBe('DEFICIENCY-REF-3');
    expect(defectResultSet.rows[0].deficiencyId).toBe('a');
    expect(defectResultSet.rows[0].deficiencySubId).toBe('mdclxvi');
    expect(defectResultSet.rows[0].deficiencyCategory).toBe('advisory');
    expect(defectResultSet.rows[0].deficiencyText).toBe(
      'DEFICIENCY-TEXT-3',
    );
    expect(defectResultSet.rows[0].itemNumber).toBe(1);

    const customDefectResultSet = await executeSql(
      `SELECT \`test_result_id\`, \`referenceNumber\`, \`defectName\`, \`defectNotes\`
            FROM \`custom_defect\`
            WHERE \`custom_defect\`.\`test_result_id\` = ${id}`,
    );

    const customDefectLastIndex = customDefectResultSet.rows.length - 1;

    expect(
      customDefectResultSet.rows[customDefectLastIndex].test_result_id,
    ).toEqual(id);
    expect(
      customDefectResultSet.rows[customDefectLastIndex].referenceNumber,
    ).toBe('def3');
    expect(
      customDefectResultSet.rows[customDefectLastIndex].defectName,
    ).toBe('DEFECT-NAME-3');
    expect(
      customDefectResultSet.rows[customDefectLastIndex].defectNotes,
    ).toBe('DEFECT-NOTES-3');
  });

  it('A new Test Result with no systemNumber throws an error', async () => {
    const event = {
      Records: [
        {
          messageId: 'faf41ab1-5b42-462c-b242-c4450e15c724',
          body: JSON.stringify({
            eventSourceARN:
              'arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000',
            eventName: 'INSERT',
            dynamodb: {
              NewImage: testResultsJsonWithNoSystemNumber,
            },
          }),
        },
      ],
    };

    const consoleSpy = jest
      .spyOn(global.console, 'error')
      .mockImplementation();
    const returnValue = await processStreamEvent(
      event,
      exampleContext(),
      () => {

      },
    );

    const expectedValue = {
      batchItemFailures: [
        { itemIdentifier: 'faf41ab1-5b42-462c-b242-c4450e15c724' },
      ],
    };

    expect(returnValue).toEqual(expectedValue);
    expect(consoleSpy).nthCalledWith(
      1,
      "Couldn't convert DynamoDB entity to Aurora, will return record to SQS for retry",
      [
        'messageId: faf41ab1-5b42-462c-b242-c4450e15c724',
        new Error("result is missing required field 'systemNumber'"),
      ],
    );
  });

  it('A new Test Result with no TestTypes is inserted correctly', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            eventSourceARN:
              'arn:aws:dynamodb:eu-west-1:1:table/test-results/stream/2020-01-01T00:00:00.000',
            eventName: 'INSERT',
            dynamodb: {
              NewImage: testResultsJsonWithoutTestTypes,
            },
          }),
        },
      ],
    };

    await processStreamEvent(event, exampleContext(), () => {

    });

    const vehicleResultSet = await executeSql(
      `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
            FROM \`vehicle\`
            WHERE \`vehicle\`.\`id\` IN (
              SELECT \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "${testResultsJsonWithoutTestTypes.systemNumber.S}"
            )`,
    );

    expect(vehicleResultSet.rows).toHaveLength(1);
    expect(vehicleResultSet.rows[0].system_number).toBe(
      'SYSTEM-NUMBER-4-U',
    );
    expect(vehicleResultSet.rows[0].vin).toBe('VIN4');
    expect(vehicleResultSet.rows[0].vrm_trm).toBe('VRM-4');
    expect(vehicleResultSet.rows[0].trailer_id).toBe('TRL-4');
    expect(
      (vehicleResultSet.rows[0].createdAt as Date).toUTCString(),
    ).not.toBeNull();

    const testResultSet = await executeSql(
      `SELECT \`test_station_id\`, \`tester_id\`, \`vehicle_class_id\`, \`preparer_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`,
                  \`fuel_emission_id\`, \`test_type_id\`, \`id\`, \`testResultId\`, \`testCode\`,  \`certificateNumber\`,  \`secondaryCertificateNumber\`,
                  \`testExpiryDate\`,  \`testAnniversaryDate\`,  \`testTypeStartTimestamp\`,  \`numberOfSeatbeltsFitted\`, \`lastSeatbeltInstallationCheckDate\`,
                  \`seatbeltInstallationCheckDate\`,  \`testResult\`,  \`reasonForAbandoning\`,  \`additionalNotesRecorded\`,  \`additionalCommentsForAbandon\`,
                  \`particulateTrapFitted\`,  \`particulateTrapSerialNumber\`,  \`modificationTypeUsed\`, \`smokeTestKLimitApplied\`, \`testTypeEndTimestamp\`
          FROM \`test_result\`
          WHERE \`test_result\`.\`vehicle_id\` = ${vehicleResultSet.rows[0].id}
          ORDER BY id ASC`,
    );

    expect(testResultSet.rows).toHaveLength(1);

    expect(testResultSet.rows[0].testResultId).toBe('TEST-RESULT-ID-4-U');
    expect(testResultSet.rows[0].testCode).toBeNull();
    expect(testResultSet.rows[0].certificateNumber).toBeNull();
    expect(testResultSet.rows[0].secondaryCertificateNumber).toBeNull();
    expect(testResultSet.rows[0].testExpiryDate).toBeNull();
    expect(testResultSet.rows[0].testAnniversaryDate).toBeNull();
    expect(testResultSet.rows[0].testTypeStartTimestamp).toBeNull();
    expect(testResultSet.rows[0].testTypeEndTimestamp).toBeNull();
    expect(
      testResultSet.rows[0].lastSeatbeltInstallationCheckDate,
    ).toBeNull();
    expect(testResultSet.rows[0].seatbeltInstallationCheckDate).toBeNull();
    expect(testResultSet.rows[0].testResult).toBeNull();
    expect(testResultSet.rows[0].reasonForAbandoning).toBeNull();
    expect(testResultSet.rows[0].additionalNotesRecorded).toBeNull();
    expect(testResultSet.rows[0].particulateTrapFitted).toBeNull();
    expect(testResultSet.rows[0].particulateTrapSerialNumber).toBeNull();
    expect(testResultSet.rows[0].modificationTypeUsed).toBeNull();
    expect(testResultSet.rows[0].smokeTestKLimitApplied).toBeNull();

    const {
      test_station_id,
      tester_id,
      vehicle_class_id,
      preparer_id,
      createdBy_Id,
      lastUpdatedBy_Id,
      fuel_emission_id,
      test_type_id,
      id,
    } = testResultSet.rows[0];

    const testStationResultSet = await executeSql(
      `SELECT \`pNumber\`, \`name\`, \`type\`
            FROM \`test_station\`
            WHERE \`test_station\`.\`id\` = ${test_station_id}`,
    );

    expect(testStationResultSet.rows).toHaveLength(1);
    expect(testStationResultSet.rows[0].pNumber).toBe('P-NUMBER-4');
    expect(testStationResultSet.rows[0].name).toBe('TEST-STATION-NAME-4');
    expect(testStationResultSet.rows[0].type).toBe('atf');

    const testerResultSet = await executeSql(
      `SELECT \`staffId\`, \`name\`, \`email_address\`
            FROM \`tester\`
            WHERE \`tester\`.\`id\` = ${tester_id}`,
    );
    expect(testerResultSet.rows).toHaveLength(1);
    expect(testerResultSet.rows[0].staffId).toBe('999999998');
    expect(testerResultSet.rows[0].name).toBe('TESTER-NAME-4');
    expect(testerResultSet.rows[0].email_address).toBe(
      'TESTER-EMAIL-ADDRESS-4',
    );

    const vehicleClassResultSet = await executeSql(
      `SELECT \`code\`,
                  \`description\`,
                  \`vehicleType\`,
                  \`vehicleSize\`,
                  \`vehicleConfiguration\`,
                  \`euVehicleCategory\`
            FROM \`vehicle_class\`
            WHERE \`vehicle_class\`.\`id\` = ${vehicle_class_id}`,
    );
    expect(vehicleClassResultSet.rows).toHaveLength(1);
    expect(vehicleClassResultSet.rows[0].code).toBe('v');
    expect(vehicleClassResultSet.rows[0].description).toBe(
      'heavy goods vehicle',
    );
    expect(vehicleClassResultSet.rows[0].vehicleType).toBe('hgv');
    expect(vehicleClassResultSet.rows[0].vehicleSize).toBe('large');
    expect(vehicleClassResultSet.rows[0].vehicleConfiguration).toBe(
      'rigid',
    );
    expect(vehicleClassResultSet.rows[0].euVehicleCategory).toBe('m1');

    const preparerResultSet = await executeSql(
      `SELECT \`preparerId\`, \`name\`
            FROM \`preparer\`
            WHERE \`preparer\`.\`id\` = ${preparer_id}`,
    );
    expect(preparerResultSet.rows).toHaveLength(1);
    expect(preparerResultSet.rows[0].preparerId).toBe('999999998');
    expect(preparerResultSet.rows[0].name).toBe('PREPARER-NAME-4');

    const createdByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${createdBy_Id}`,
    );
    expect(createdByResultSet.rows).toHaveLength(1);
    expect(createdByResultSet.rows[0].identityId).toBe('CREATED-BY-ID-4');
    expect(createdByResultSet.rows[0].name).toBe('CREATED-BY-NAME-4');

    const lastUpdatedByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${lastUpdatedBy_Id}`,
    );
    expect(lastUpdatedByResultSet.rows).toHaveLength(1);
    expect(lastUpdatedByResultSet.rows[0].identityId).toBe(
      'LAST-UPDATED-BY-ID-4',
    );
    expect(lastUpdatedByResultSet.rows[0].name).toBe(
      'LAST-UPDATED-BY-NAME-4',
    );

    const fuelEmissionResultSet = await executeSql(
      `SELECT \`modTypeCode\`, \`description\`, \`emissionStandard\`, \`fuelType\`
            FROM \`fuel_emission\`
            WHERE \`fuel_emission\`.\`id\` = ${fuel_emission_id}`,
    );
    expect(fuelEmissionResultSet.rows).toHaveLength(0);

    const testTypeResultSet = await executeSql(
      `SELECT \`testTypeClassification\`, \`testTypeName\`
            FROM \`test_type\`
            WHERE \`test_type\`.\`id\` = ${test_type_id}`,
    );
    expect(testTypeResultSet.rows).toHaveLength(0);

    const testDefectResultSet = await executeSql(
      `SELECT \`test_result_id\`, \`defect_id\`, \`location_id\`, \`notes\`, \`prs\`, \`prohibitionIssued\`
            FROM \`test_defect\`
            WHERE \`test_defect\`.\`test_result_id\` = ${id}`,
    );
    expect(testDefectResultSet.rows).toHaveLength(0);
  });

  it('After all tests the database has all the expected data', async () => {
    const testResultResultSet = await executeSql(
      `SELECT id FROM test_result
              WHERE testResultId like '%-U';`,
    );

    expect(testResultResultSet.rows).toHaveLength(5);

    const customDefectResultSet = await executeSql(
      `SELECT DISTINCT cd.id FROM custom_defect cd
              INNER JOIN test_result tr ON cd.test_result_id = tr.id
              WHERE testResultId like '%-U';`,
    );

    expect(customDefectResultSet.rows).toHaveLength(5);

    const testTypeResultSet = await executeSql(
      `SELECT DISTINCT tt.id FROM test_type tt
              JOIN test_result tr ON tt.id = tr.test_type_id
              WHERE testResultId like '%-U';`,
    );

    expect(testTypeResultSet.rows).toHaveLength(2);

    const testDefectResultSet = await executeSql(
      `SELECT DISTINCT td.id FROM test_defect td
              INNER JOIN test_result tr ON td.test_result_id = tr.id
              WHERE testResultId like '%-U';`,
    );

    expect(testDefectResultSet.rows).toHaveLength(3);

    const defectResultSet = await executeSql(
      `SELECT DISTINCT d.id FROM defect d
              JOIN test_defect td ON d.id = td.defect_id
              JOIN test_result tr ON td.test_result_id = tr.id
              WHERE testResultId like '%-U';`,
    );

    expect(defectResultSet.rows).toHaveLength(3);
  });
});
