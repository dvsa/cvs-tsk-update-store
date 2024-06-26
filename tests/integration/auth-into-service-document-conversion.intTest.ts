import { StartedTestContainer } from 'testcontainers';
import {
  destroyConnectionPool,
  executeSql,
} from '../../src/services/connection-pool';
import { exampleContext, useLocalDb } from '../utils';
import techRecordDocumentJson from '../resources/dynamodb-image-technical-record-V3.json';
import { getContainerizedDatabase } from './cvsbnop-container';
import { processStreamEvent } from '../../src/functions/process-stream-event';
import { getConnectionPoolOptions } from '../../src/services/connection-pool-options';

useLocalDb();
jest.setTimeout(60_000);

describe('convertTechRecordDocument() integration tests', () => {
  let container: StartedTestContainer;

  beforeAll(async () => {
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

  describe('when adding a new vehicle with an authIntoService having some null properties.', () => {
    it('should insert into auth_into_service', async () => {
      // arrange - create a record so we can later query for it and assert for is existence
      const techRecordDocumentJsonNew = JSON.parse(
        JSON.stringify(techRecordDocumentJson),
      );
      techRecordDocumentJsonNew.systemNumber = { S: 'SYSTEM-NUMBER-1a' };
      techRecordDocumentJsonNew.vin = { S: 'VIN1a' };
      techRecordDocumentJsonNew.techRecord_authIntoService_cocIssueDate = {
        S: '2020-01-01',
      };
      techRecordDocumentJsonNew.techRecord_authIntoService_dateAuthorised = {
        NULL: true,
      };
      techRecordDocumentJsonNew.techRecord_authIntoService_datePending = {
        S: '2020-03-03',
      };
      techRecordDocumentJsonNew.techRecord_authIntoService_dateReceived = {
        NULL: true,
      };

      techRecordDocumentJsonNew.techRecord_authIntoService_dateRejected = {
        S: '2020-05-05',
      };

      const event = {
        Records: [
          {
            body: JSON.stringify({
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/flat-tech-records/stream/2020-01-01T00:00:00.000',
              eventName: 'INSERT',
              dynamodb: {
                NewImage: techRecordDocumentJsonNew,
              },
            }),
          },
        ],
      };

      await processStreamEvent(event, exampleContext(), () => {

      });

      const vehicleResultSet = await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-1a"`,
      );
      expect(vehicleResultSet.rows).toHaveLength(1);
      expect(vehicleResultSet.rows[0].system_number).toBe(
        'SYSTEM-NUMBER-1a',
      );
      expect(vehicleResultSet.rows[0].vin).toBe('VIN1a');
      const vehicleId = vehicleResultSet.rows[0].id;

      const technicalRecordSet = await executeSql(
        `SELECT \`id\`
              FROM \`technical_record\`
              WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`,
      );
      const technicalRecordId = technicalRecordSet.rows[0].id;

      const authIntoServiceResultSet = await executeSql(
        `SELECT \`technical_record_id\`,
                      \`cocIssueDate\`,
                      \`dateReceived\`,
                      \`datePending\`,
                      \`dateAuthorised\`,
                      \`dateRejected\`
              FROM \`auth_into_service\`
              WHERE \`auth_into_service\`.\`technical_record_id\` = ${technicalRecordId}`,
      );

      expect(authIntoServiceResultSet.rows).toHaveLength(1);
      expect(authIntoServiceResultSet.rows[0].technical_record_id).toEqual(
        technicalRecordId,
      );
      expect(
        (authIntoServiceResultSet.rows[0].cocIssueDate as Date).toUTCString(),
      ).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
      expect(authIntoServiceResultSet.rows[0].dateReceived).toBeNull();
      expect(
        (authIntoServiceResultSet.rows[0].datePending as Date).toUTCString(),
      ).toBe('Tue, 03 Mar 2020 00:00:00 GMT');
      expect(authIntoServiceResultSet.rows[0].dateAuthorised).toBeNull();
      expect(
        (authIntoServiceResultSet.rows[0].dateRejected as Date).toUTCString(),
      ).toBe('Tue, 05 May 2020 00:00:00 GMT');
    });

    it('should update auth_into_service when the vehicle is updated with an authIntoService having some null properties', async () => {
      // arrange - create a record so we can later query for it and assert for is existence
      const techRecordDocumentJsonNew = JSON.parse(
        JSON.stringify(techRecordDocumentJson),
      );
      techRecordDocumentJsonNew.systemNumber = { S: 'SYSTEM-NUMBER-1a' };
      techRecordDocumentJsonNew.vin = { S: 'VIN1a' };
      techRecordDocumentJsonNew.techRecord_authIntoService_cocIssueDate = {
        NULL: true,
      };
      techRecordDocumentJsonNew.techRecord_authIntoService_dateAuthorised = {
        S: '2020-04-04',
      };
      techRecordDocumentJsonNew.techRecord_authIntoService_datePending = {
        NULL: true,
      };
      techRecordDocumentJsonNew.techRecord_authIntoService_dateReceived = {
        S: '2020-02-02',
      };

      techRecordDocumentJsonNew.techRecord_authIntoService_dateRejected = {
        NULL: true,
      };

      const event = {
        Records: [
          {
            body: JSON.stringify({
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/flat-tech-records/stream/2020-01-01T00:00:00.000',
              eventName: 'INSERT',
              dynamodb: {
                NewImage: techRecordDocumentJsonNew,
              },
            }),
          },
        ],
      };

      await processStreamEvent(event, exampleContext(), () => {

      });

      const vehicleResultSet = await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-1a"`,
      );
      expect(vehicleResultSet.rows).toHaveLength(1);
      expect(vehicleResultSet.rows[0].system_number).toBe(
        'SYSTEM-NUMBER-1a',
      );
      expect(vehicleResultSet.rows[0].vin).toBe('VIN1a');
      const vehicleId = vehicleResultSet.rows[0].id;

      const technicalRecordSet = await executeSql(
        `SELECT \`id\`
              FROM \`technical_record\`
              WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`,
      );
      const technicalRecordId = technicalRecordSet.rows[0].id;

      const authIntoServiceResultSet = await executeSql(
        `SELECT \`technical_record_id\`,
                      \`cocIssueDate\`,
                      \`dateReceived\`,
                      \`datePending\`,
                      \`dateAuthorised\`,
                      \`dateRejected\`
              FROM \`auth_into_service\`
              WHERE \`auth_into_service\`.\`technical_record_id\` = ${technicalRecordId}`,
      );

      expect(authIntoServiceResultSet.rows).toHaveLength(1);
      expect(authIntoServiceResultSet.rows[0].technical_record_id).toEqual(
        technicalRecordId,
      );
      expect(authIntoServiceResultSet.rows[0].cocIssueDate).toBeNull();
      expect(
        (authIntoServiceResultSet.rows[0].dateReceived as Date).toUTCString(),
      ).toBe('Sun, 02 Feb 2020 00:00:00 GMT');
      expect(authIntoServiceResultSet.rows[0].datePending).toBeNull();
      expect(
        (authIntoServiceResultSet.rows[0]
          .dateAuthorised as Date).toUTCString(),
      ).toBe('Sat, 04 Apr 2020 00:00:00 GMT');
      expect(authIntoServiceResultSet.rows[0].dateRejected).toBeNull();
    });
  });

  describe('when adding a new vehicle with an empty authIntoService.', () => {
    it('should not insert into auth_into_service', async () => {
      // arrange - create a record so we can later query for it and assert for is existence
      const techRecordDocumentJsonNew = JSON.parse(
        JSON.stringify(techRecordDocumentJson),
      );
      techRecordDocumentJsonNew.systemNumber = { S: 'SYSTEM-NUMBER-1b' };
      techRecordDocumentJsonNew.vin = { S: 'VIN1b' };
      techRecordDocumentJsonNew.techRecord_authIntoService_cocIssueDate = {
        NULL: true,
      };
      techRecordDocumentJsonNew.techRecord_authIntoService_dateAuthorised = {
        NULL: true,
      };
      techRecordDocumentJsonNew.techRecord_authIntoService_datePending = {
        NULL: true,
      };
      techRecordDocumentJsonNew.techRecord_authIntoService_dateReceived = {
        NULL: true,
      };

      techRecordDocumentJsonNew.techRecord_authIntoService_dateRejected = {
        NULL: true,
      };

      const event = {
        Records: [
          {
            body: JSON.stringify({
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/flat-tech-records/stream/2020-01-01T00:00:00.000',
              eventName: 'INSERT',
              dynamodb: {
                NewImage: techRecordDocumentJsonNew,
              },
            }),
          },
        ],
      };

      await processStreamEvent(event, exampleContext(), () => {

      });

      const vehicleResultSet = await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-1b"`,
      );
      expect(vehicleResultSet.rows).toHaveLength(1);
      expect(vehicleResultSet.rows[0].system_number).toBe(
        'SYSTEM-NUMBER-1b',
      );
      expect(vehicleResultSet.rows[0].vin).toBe('VIN1b');
      const vehicleId = vehicleResultSet.rows[0].id;

      const technicalRecordSet = await executeSql(
        `SELECT \`id\`
              FROM \`technical_record\`
              WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`,
      );
      const technicalRecordId = technicalRecordSet.rows[0].id;

      const authIntoServiceResultSet = await executeSql(
        `SELECT \`id\`
              FROM \`auth_into_service\`
              WHERE \`auth_into_service\`.\`technical_record_id\` = ${technicalRecordId}`,
      );

      expect(authIntoServiceResultSet.rows).toHaveLength(0);
    });

    it('should insert into auth_into_service when the vehicle is updated with an authIntoService', async () => {
      // arrange - create a record so we can later query for it and assert for is existence
      const techRecordDocumentJsonNew = JSON.parse(
        JSON.stringify(techRecordDocumentJson),
      );
      techRecordDocumentJsonNew.systemNumber = { S: 'SYSTEM-NUMBER-1b' };
      techRecordDocumentJsonNew.vin = { S: 'VIN1b' };

      const event = {
        Records: [
          {
            body: JSON.stringify({
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/flat-tech-records/stream/2020-01-01T00:00:00.000',
              eventName: 'INSERT',
              dynamodb: {
                NewImage: techRecordDocumentJsonNew,
              },
            }),
          },
        ],
      };

      await processStreamEvent(event, exampleContext(), () => {

      });

      const vehicleResultSet = await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-1b"`,
      );
      expect(vehicleResultSet.rows).toHaveLength(1);
      expect(vehicleResultSet.rows[0].system_number).toBe(
        'SYSTEM-NUMBER-1b',
      );
      expect(vehicleResultSet.rows[0].vin).toBe('VIN1b');
      const vehicleId = vehicleResultSet.rows[0].id;

      const technicalRecordSet = await executeSql(
        `SELECT \`id\`
              FROM \`technical_record\`
              WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`,
      );
      const technicalRecordId = technicalRecordSet.rows[0].id;

      const authIntoServiceResultSet = await executeSql(
        `SELECT \`technical_record_id\`,
                      \`cocIssueDate\`,
                      \`dateReceived\`,
                      \`datePending\`,
                      \`dateAuthorised\`,
                      \`dateRejected\`
              FROM \`auth_into_service\`
              WHERE \`auth_into_service\`.\`technical_record_id\` = ${technicalRecordId}`,
      );

      expect(authIntoServiceResultSet.rows).toHaveLength(1);
      expect(authIntoServiceResultSet.rows[0].technical_record_id).toEqual(
        technicalRecordId,
      );
      expect(
        (authIntoServiceResultSet.rows[0].cocIssueDate as Date).toUTCString(),
      ).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
      expect(
        (authIntoServiceResultSet.rows[0].dateReceived as Date).toUTCString(),
      ).toBe('Sun, 02 Feb 2020 00:00:00 GMT');
      expect(
        (authIntoServiceResultSet.rows[0].datePending as Date).toUTCString(),
      ).toBe('Tue, 03 Mar 2020 00:00:00 GMT');
      expect(
        (authIntoServiceResultSet.rows[0]
          .dateAuthorised as Date).toUTCString(),
      ).toBe('Sat, 04 Apr 2020 00:00:00 GMT');
      expect(
        (authIntoServiceResultSet.rows[0].dateRejected as Date).toUTCString(),
      ).toBe('Tue, 05 May 2020 00:00:00 GMT');
    });

    it('should remove auth_into_service when the vehicle if updated and authIntoService is empty', async () => {
      // arrange - create a record so we can later query for it and assert for is existence
      const techRecordDocumentJsonNew = JSON.parse(
        JSON.stringify(techRecordDocumentJson),
      );
      techRecordDocumentJsonNew.systemNumber = { S: 'SYSTEM-NUMBER-1b' };
      techRecordDocumentJsonNew.vin = { S: 'VIN1b' };
      delete techRecordDocumentJsonNew.techRecord_authIntoService_cocIssueDate;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_dateAuthorised;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_datePending;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_dateReceived;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_dateRejected;

      const event = {
        Records: [
          {
            body: JSON.stringify({
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/flat-tech-records/stream/2020-01-01T00:00:00.000',
              eventName: 'INSERT',
              dynamodb: {
                NewImage: techRecordDocumentJsonNew,
              },
            }),
          },
        ],
      };

      await processStreamEvent(event, exampleContext(), () => {

      });

      const vehicleResultSet = await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-1b"`,
      );
      expect(vehicleResultSet.rows).toHaveLength(1);
      expect(vehicleResultSet.rows[0].system_number).toBe(
        'SYSTEM-NUMBER-1b',
      );
      expect(vehicleResultSet.rows[0].vin).toBe('VIN1b');
      const vehicleId = vehicleResultSet.rows[0].id;

      const technicalRecordSet = await executeSql(
        `SELECT \`id\`
              FROM \`technical_record\`
              WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`,
      );
      const technicalRecordId = technicalRecordSet.rows[0].id;

      const authIntoServiceResultSet = await executeSql(
        `SELECT \`id\`
              FROM \`auth_into_service\`
              WHERE \`auth_into_service\`.\`technical_record_id\` = ${technicalRecordId}`,
      );

      expect(authIntoServiceResultSet.rows).toHaveLength(0);
    });
  });

  describe('when adding a new vehicle and authIntoService is not present.', () => {
    it('should not insert into auth_into_service', async () => {
      // arrange - create a record so we can later query for it and assert for is existence
      const techRecordDocumentJsonNew = JSON.parse(
        JSON.stringify(techRecordDocumentJson),
      );
      techRecordDocumentJsonNew.systemNumber = { S: 'SYSTEM-NUMBER-1c' };
      techRecordDocumentJsonNew.vin = { S: 'VIN1c' };
      delete techRecordDocumentJsonNew.techRecord_authIntoService_cocIssueDate;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_dateAuthorised;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_datePending;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_dateReceived;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_dateRejected;

      const event = {
        Records: [
          {
            body: JSON.stringify({
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/flat-tech-records/stream/2020-01-01T00:00:00.000',
              eventName: 'INSERT',
              dynamodb: {
                NewImage: techRecordDocumentJsonNew,
              },
            }),
          },
        ],
      };

      await processStreamEvent(event, exampleContext(), () => {

      });

      const vehicleResultSet = await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-1c"`,
      );
      expect(vehicleResultSet.rows).toHaveLength(1);
      expect(vehicleResultSet.rows[0].system_number).toBe(
        'SYSTEM-NUMBER-1c',
      );
      expect(vehicleResultSet.rows[0].vin).toBe('VIN1c');
      const vehicleId = vehicleResultSet.rows[0].id;

      const technicalRecordSet = await executeSql(
        `SELECT \`id\`
              FROM \`technical_record\`
              WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`,
      );
      const technicalRecordId = technicalRecordSet.rows[0].id;

      const authIntoServiceResultSet = await executeSql(
        `SELECT \`technical_record_id\`,
                      \`cocIssueDate\`,
                      \`dateReceived\`,
                      \`datePending\`,
                      \`dateAuthorised\`,
                      \`dateRejected\`
              FROM \`auth_into_service\`
              WHERE \`auth_into_service\`.\`technical_record_id\` = ${technicalRecordId}`,
      );

      expect(authIntoServiceResultSet.rows).toHaveLength(0);
    });

    it('should insert into auth_into_service when the vehicle is updated with an authIntoService', async () => {
      // arrange - create a record so we can later query for it and assert for is existence
      const techRecordDocumentJsonNew = JSON.parse(
        JSON.stringify(techRecordDocumentJson),
      );
      techRecordDocumentJsonNew.systemNumber = { S: 'SYSTEM-NUMBER-1c' };
      techRecordDocumentJsonNew.vin = { S: 'VIN1c' };

      const event = {
        Records: [
          {
            body: JSON.stringify({
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/flat-tech-records/stream/2020-01-01T00:00:00.000',
              eventName: 'INSERT',
              dynamodb: {
                NewImage: techRecordDocumentJsonNew,
              },
            }),
          },
        ],
      };

      await processStreamEvent(event, exampleContext(), () => {

      });

      const vehicleResultSet = await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-1c"`,
      );
      expect(vehicleResultSet.rows).toHaveLength(1);
      expect(vehicleResultSet.rows[0].system_number).toBe(
        'SYSTEM-NUMBER-1c',
      );
      expect(vehicleResultSet.rows[0].vin).toBe('VIN1c');
      const vehicleId = vehicleResultSet.rows[0].id;

      const technicalRecordSet = await executeSql(
        `SELECT \`id\`
              FROM \`technical_record\`
              WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`,
      );
      const technicalRecordId = technicalRecordSet.rows[0].id;

      const authIntoServiceResultSet = await executeSql(
        `SELECT \`technical_record_id\`,
                      \`cocIssueDate\`,
                      \`dateReceived\`,
                      \`datePending\`,
                      \`dateAuthorised\`,
                      \`dateRejected\`
              FROM \`auth_into_service\`
              WHERE \`auth_into_service\`.\`technical_record_id\` = ${technicalRecordId}`,
      );

      expect(authIntoServiceResultSet.rows).toHaveLength(1);
      expect(authIntoServiceResultSet.rows[0].technical_record_id).toEqual(
        technicalRecordId,
      );
      expect(
        (authIntoServiceResultSet.rows[0].cocIssueDate as Date).toUTCString(),
      ).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
      expect(
        (authIntoServiceResultSet.rows[0].dateReceived as Date).toUTCString(),
      ).toBe('Sun, 02 Feb 2020 00:00:00 GMT');
      expect(
        (authIntoServiceResultSet.rows[0].datePending as Date).toUTCString(),
      ).toBe('Tue, 03 Mar 2020 00:00:00 GMT');
      expect(
        (authIntoServiceResultSet.rows[0]
          .dateAuthorised as Date).toUTCString(),
      ).toBe('Sat, 04 Apr 2020 00:00:00 GMT');
      expect(
        (authIntoServiceResultSet.rows[0].dateRejected as Date).toUTCString(),
      ).toBe('Tue, 05 May 2020 00:00:00 GMT');
    });

    it('should remove auth_into_service when the vehicle if updated and authIntoService is not present', async () => {
      // arrange - create a record so we can later query for it and assert for is existence
      const techRecordDocumentJsonNew = JSON.parse(
        JSON.stringify(techRecordDocumentJson),
      );
      techRecordDocumentJsonNew.systemNumber = { S: 'SYSTEM-NUMBER-1c' };
      techRecordDocumentJsonNew.vin = { S: 'VIN1c' };
      delete techRecordDocumentJsonNew.techRecord_authIntoService_cocIssueDate;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_dateAuthorised;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_datePending;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_dateReceived;
      delete techRecordDocumentJsonNew.techRecord_authIntoService_dateRejected;

      const event = {
        Records: [
          {
            body: JSON.stringify({
              eventSourceARN:
                'arn:aws:dynamodb:eu-west-1:1:table/flat-tech-records/stream/2020-01-01T00:00:00.000',
              eventName: 'INSERT',
              dynamodb: {
                NewImage: techRecordDocumentJsonNew,
              },
            }),
          },
        ],
      };

      await processStreamEvent(event, exampleContext(), () => {

      });

      const vehicleResultSet = await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-1c"`,
      );
      expect(vehicleResultSet.rows).toHaveLength(1);
      expect(vehicleResultSet.rows[0].system_number).toBe(
        'SYSTEM-NUMBER-1c',
      );
      expect(vehicleResultSet.rows[0].vin).toBe('VIN1c');
      const vehicleId = vehicleResultSet.rows[0].id;

      const technicalRecordSet = await executeSql(
        `SELECT \`id\`
              FROM \`technical_record\`
              WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`,
      );
      const technicalRecordId = technicalRecordSet.rows[0].id;

      const authIntoServiceResultSet = await executeSql(
        `SELECT \`id\`
              FROM \`auth_into_service\`
              WHERE \`auth_into_service\`.\`technical_record_id\` = ${technicalRecordId}`,
      );

      expect(authIntoServiceResultSet.rows).toHaveLength(0);
    });
  });
});
