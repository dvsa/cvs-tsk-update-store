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

  it('should correctly convert a DynamoDB event into Aurora rows', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            eventSourceARN:
              'arn:aws:dynamodb:eu-west-1:1:table/flat-tech-records/stream/2020-01-01T00:00:00.000',
            eventName: 'INSERT',
            dynamodb: {
              NewImage: techRecordDocumentJson,
            },
          }),
        },
      ],
    };

    // array of arrays: event contains array of records, each with array of tech record entities
    await processStreamEvent(event, exampleContext(), () => {

    });

    const vehicleResultSet = await executeSql(
      `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
            FROM \`vehicle\`
            WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-1"`,
    );
    expect(vehicleResultSet.rows).toHaveLength(1);
    expect(vehicleResultSet.rows[0].system_number).toBe('SYSTEM-NUMBER-1');
    expect(vehicleResultSet.rows[0].vin).toBe('VIN1');
    expect(vehicleResultSet.rows[0].vrm_trm).toBe('VRM-1');
    expect(vehicleResultSet.rows[0].trailer_id).toBe('TRL-1');
    expect(
      (vehicleResultSet.rows[0].createdAt as Date).toUTCString(),
    ).not.toBeNull(); // todo This returns null

    const vehicleId = vehicleResultSet.rows[0].id;
    const technicalRecordSet = await executeSql(
      `SELECT \`make_model_id\`, \`vehicle_class_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`, \`applicant_detail_id\`, \`purchaser_detail_id\`, \`manufacturer_detail_id\`, \`id\`, \`createdAt\`
          FROM \`technical_record\`
          WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`,
    );

    expect(technicalRecordSet.rows).toHaveLength(1);
    expect(
      (technicalRecordSet.rows[0].createdAt as Date).toISOString(),
    ).toBe('2020-01-01T00:00:00.055Z');

    const {
      make_model_id,
      vehicle_class_id,
      createdBy_Id,
      lastUpdatedBy_Id,
      applicant_detail_id,
      purchaser_detail_id,
      manufacturer_detail_id,
    } = technicalRecordSet.rows[0];

    const technicalRecordId = technicalRecordSet.rows[0].id;

    const makeModelResultSet = await executeSql(
      `SELECT \`make\`,
                  \`model\`,
                  \`chassisMake\`,
                  \`chassisModel\`,
                  \`bodyMake\`,
                  \`bodyModel\`,
                  \`modelLiteral\`,
                  \`bodyTypeCode\`,
                  \`bodyTypeDescription\`,
                  \`fuelPropulsionSystem\`,
                  \`dtpCode\`
            FROM \`make_model\`
            WHERE \`make_model\`.\`id\` = ${make_model_id}`,
    );
    expect(makeModelResultSet.rows).toHaveLength(1);
    expect(makeModelResultSet.rows[0].make).toBe('MAKE');
    expect(makeModelResultSet.rows[0].model).toBe('MODEL');
    expect(makeModelResultSet.rows[0].chassisMake).toBe('CHASSIS-MAKE');
    expect(makeModelResultSet.rows[0].chassisModel).toBe('CHASSIS-MODEL');
    expect(makeModelResultSet.rows[0].bodyMake).toBe('BODY-MAKE');
    expect(makeModelResultSet.rows[0].bodyModel).toBe('BODY-MODEL');
    expect(makeModelResultSet.rows[0].modelLiteral).toBe('MODEL-LITERAL');
    expect(makeModelResultSet.rows[0].bodyTypeCode).toBe('a');
    expect(makeModelResultSet.rows[0].bodyTypeDescription).toBe(
      'articulated',
    );
    expect(makeModelResultSet.rows[0].fuelPropulsionSystem).toBe(
      'DieselPetrol',
    );
    expect(makeModelResultSet.rows[0].dtpCode).toBeNull();

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
    expect(vehicleClassResultSet.rows[0].vehicleSize).toBe('small');
    expect(vehicleClassResultSet.rows[0].vehicleConfiguration).toBe(
      'rigid',
    );
    expect(vehicleClassResultSet.rows[0].euVehicleCategory).toBe('m1');

    const createdByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${createdBy_Id}`,
    );
    expect(createdByResultSet.rows).toHaveLength(1);
    expect(createdByResultSet.rows[0].identityId).toBe('CREATED-BY-ID-2');
    expect(createdByResultSet.rows[0].name).toBe('CREATED-BY-NAME-2');

    const lastUpdatedByResultSet = await executeSql(
      `SELECT \`identityId\`, \`name\`
            FROM \`identity\`
            WHERE \`identity\`.\`id\` = ${lastUpdatedBy_Id}`,
    );
    expect(lastUpdatedByResultSet.rows).toHaveLength(1);
    expect(lastUpdatedByResultSet.rows[0].identityId).toBe(
      'LAST-UPDATED-BY-ID-2',
    );
    expect(lastUpdatedByResultSet.rows[0].name).toBe(
      'LAST-UPDATED-BY-NAME-2',
    );

    const contactDetailsResultSet = await executeSql(
      `SELECT \`name\`,
                  \`address1\`,
                  \`address2\`,
                  \`postTown\`,
                  \`address3\`,
                  \`postCode\`,
                  \`emailAddress\`,
                  \`telephoneNumber\`,
                  \`faxNumber\`
            FROM \`contact_details\`
            WHERE \`contact_details\`.\`id\` = ${applicant_detail_id}`,
    );

    const contactIds = [
      applicant_detail_id,
      manufacturer_detail_id,
      purchaser_detail_id,
    ];
    expect(contactIds.every((id) => contactIds[0] === id)).toBe(true);

    expect(contactDetailsResultSet.rows).toHaveLength(1);
    expect(contactDetailsResultSet.rows[0].name).toBe('NAME');
    expect(contactDetailsResultSet.rows[0].address1).toBe('ADDRESS-1');
    expect(contactDetailsResultSet.rows[0].address2).toBe('ADDRESS-2');
    expect(contactDetailsResultSet.rows[0].postTown).toBe('POST-TOWN');
    expect(contactDetailsResultSet.rows[0].address3).toBe('ADDRESS-3');
    expect(contactDetailsResultSet.rows[0].postCode).toBe('POST-CODE');
    expect(contactDetailsResultSet.rows[0].emailAddress).toBe(
      'EMAIL-ADDRESS',
    );
    expect(contactDetailsResultSet.rows[0].telephoneNumber).toBe(
      'TELEPHONE-NUMBER',
    );
    expect(contactDetailsResultSet.rows[0].faxNumber).toBe('FAX-NUMBER');

    const techRecordResultSet = await executeSql(
      `SELECT \`vehicle_id\`,
                  \`recordCompleteness\`,
                  \`createdAt\`,
                  \`lastUpdatedAt\`,
                  \`make_model_id\`,
                  \`functionCode\`,
                  \`offRoad\`,
                  \`numberOfWheelsDriven\`,
                  \`regnDate\`,
                  \`unladenWeight\`,
                  \`emissionsLimit\`,
                  \`departmentalVehicleMarker\`,
                  \`alterationMarker\`,
                  \`vehicle_class_id\`,
                  \`variantVersionNumber\`,
                  \`grossEecWeight\`,
                  \`trainEecWeight\`,
                  \`maxTrainEecWeight\`,
                  \`applicant_detail_id\`,
                  \`purchaser_detail_id\`,
                  \`manufacturer_detail_id\`,
                  \`manufactureYear\`,
                  \`firstUseDate\`,
                  \`coifDate\`,
                  \`ntaNumber\`,
                  \`coifSerialNumber\`,
                  \`coifCertifierName\`,
                  \`approvalType\`,
                  \`approvalTypeNumber\`,
                  \`variantNumber\`,
                  \`conversionRefNo\`,
                  \`seatsLowerDeck\`,
                  \`seatsUpperDeck\`,
                  \`standingCapacity\`,
                  \`speedRestriction\`,
                  \`speedLimiterMrk\`,
                  \`tachoExemptMrk\`,
                  \`dispensations\`,
                  \`remarks\`,
                  \`reasonForCreation\`,
                  \`statusCode\`,
                  \`grossKerbWeight\`,
                  \`grossLadenWeight\`,
                  \`grossGbWeight\`,
                  \`grossDesignWeight\`,
                  \`trainGbWeight\`,
                  \`trainDesignWeight\`,
                  \`maxTrainGbWeight\`,
                  \`maxTrainDesignWeight\`,
                  \`maxLoadOnCoupling\`,
                  \`frameDescription\`,
                  \`tyreUseCode\`,
                  \`roadFriendly\`,
                  \`drawbarCouplingFitted\`,
                  \`euroStandard\`,
                  \`suspensionType\`,
                  \`couplingType\`,
                  \`length\`,
                  \`height\`,
                  \`width\`,
                  \`frontAxleTo5thWheelMin\`,
                  \`frontAxleTo5thWheelMax\`,
                  \`frontVehicleTo5thWheelCouplingMin\`,
                  \`frontVehicleTo5thWheelCouplingMax\`,
                  \`frontAxleToRearAxle\`,
                  \`rearAxleToRearTrl\`,
                  \`couplingCenterToRearAxleMin\`,
                  \`couplingCenterToRearAxleMax\`,
                  \`couplingCenterToRearTrlMin\`,
                  \`couplingCenterToRearTrlMax\`,
                  \`centreOfRearmostAxleToRearOfTrl\`,
                  \`notes\`,
                  \`purchaserNotes\`,
                  \`manufacturerNotes\`,
                  \`noOfAxles\`,
                  \`brakeCode\`,
                  \`brakes_dtpNumber\`,
                  \`brakes_loadSensingValve\`,
                  \`brakes_antilockBrakingSystem\`,
                  \`createdBy_Id\`,
                  \`lastUpdatedBy_Id\`,
                  \`updateType\`,
                  \`numberOfSeatbelts\`,
                  \`seatbeltInstallationApprovalDate\`
            FROM \`technical_record\`
            WHERE \`technical_record\`.\`id\` = ${technicalRecordId}`,
    );
    // check a few fields of different types here
    expect(techRecordResultSet.rows[0].vehicle_id).toEqual(vehicleId);
    expect(techRecordResultSet.rows[0].recordCompleteness).toBe(
      '88888888',
    );
    expect(
      (techRecordResultSet.rows[0].createdAt as Date).toUTCString(),
    ).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
    expect(
      (techRecordResultSet.rows[0].lastUpdatedAt as Date).toUTCString(),
    ).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
    expect(techRecordResultSet.rows[0].make_model_id).toBe(1);
    expect(techRecordResultSet.rows[0].functionCode).toBe('1');
    expect(techRecordResultSet.rows[0].offRoad).toBe(1);
    expect(techRecordResultSet.rows[0].numberOfWheelsDriven).toBe(1);
    expect(
      (techRecordResultSet.rows[0].regnDate as Date).toUTCString(),
    ).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
    expect(techRecordResultSet.rows[0].unladenWeight).toBe(1);
    expect(techRecordResultSet.rows[0].emissionsLimit).toBe('1');
    expect(techRecordResultSet.rows[0].departmentalVehicleMarker).toBe(1);
    expect(techRecordResultSet.rows[0].alterationMarker).toBe(1);
    expect(techRecordResultSet.rows[0].vehicle_class_id).toEqual(
      vehicle_class_id,
    );
    expect(techRecordResultSet.rows[0].variantVersionNumber).toBe('1');
    expect(techRecordResultSet.rows[0].grossEecWeight).toBe(1);
    expect(techRecordResultSet.rows[0].trainEecWeight).toBe(1);
    expect(techRecordResultSet.rows[0].maxTrainEecWeight).toBe(1);
    expect(techRecordResultSet.rows[0].applicant_detail_id).toBe(1);
    expect(techRecordResultSet.rows[0].purchaser_detail_id).toBe(1);
    expect(techRecordResultSet.rows[0].manufacturer_detail_id).toBe(1);
    expect(techRecordResultSet.rows[0].manufactureYear).toBe(2020);
    expect(
      (techRecordResultSet.rows[0].firstUseDate as Date).toUTCString(),
    ).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
    expect(
      (techRecordResultSet.rows[0].coifDate as Date).toUTCString(),
    ).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
    expect(techRecordResultSet.rows[0].ntaNumber).toBe('NTA-NUMBER');
    expect(techRecordResultSet.rows[0].coifSerialNumber).toBe('88888888');
    expect(techRecordResultSet.rows[0].coifCertifierName).toBe(
      'COIF-CERTIFIER-NAME',
    );
    expect(techRecordResultSet.rows[0].approvalType).toBe('NTA');
    expect(techRecordResultSet.rows[0].approvalTypeNumber).toBe('1');
    expect(techRecordResultSet.rows[0].variantNumber).toBe('1');
    expect(techRecordResultSet.rows[0].conversionRefNo).toBe('1010101010');
    expect(techRecordResultSet.rows[0].seatsLowerDeck).toBe(1);
    expect(techRecordResultSet.rows[0].seatsUpperDeck).toBe(1);
    expect(techRecordResultSet.rows[0].standingCapacity).toBe(1);
    expect(techRecordResultSet.rows[0].speedRestriction).toBe(1);
    expect(techRecordResultSet.rows[0].speedLimiterMrk).toBe(1);
    expect(techRecordResultSet.rows[0].tachoExemptMrk).toBe(1);
    expect(techRecordResultSet.rows[0].dispensations).toBe(
      'DISPENSATIONS',
    );
    expect(techRecordResultSet.rows[0].remarks).toBe('REMARKS');
    expect(techRecordResultSet.rows[0].reasonForCreation).toBe(
      'REASON-FOR-CREATION',
    );
    expect(techRecordResultSet.rows[0].statusCode).toBe('STATUS-CODE');
    expect(techRecordResultSet.rows[0].grossKerbWeight).toBe(1);
    expect(techRecordResultSet.rows[0].grossLadenWeight).toBe(1);
    expect(techRecordResultSet.rows[0].grossGbWeight).toBe(1);
    expect(techRecordResultSet.rows[0].grossDesignWeight).toBe(1);
    expect(techRecordResultSet.rows[0].trainGbWeight).toBe(1);
    expect(techRecordResultSet.rows[0].trainDesignWeight).toBe(1);
    expect(techRecordResultSet.rows[0].maxTrainGbWeight).toBe(1);
    expect(techRecordResultSet.rows[0].maxTrainDesignWeight).toBe(1);
    expect(techRecordResultSet.rows[0].maxLoadOnCoupling).toBe(1);
    expect(techRecordResultSet.rows[0].frameDescription).toBe(
      'Channel section',
    );
    expect(techRecordResultSet.rows[0].tyreUseCode).toBe('22');
    expect(techRecordResultSet.rows[0].roadFriendly).toBe(1);
    expect(techRecordResultSet.rows[0].drawbarCouplingFitted).toBe(1);
    expect(techRecordResultSet.rows[0].euroStandard).toBe('euroStd');
    expect(techRecordResultSet.rows[0].suspensionType).toBe('1');
    expect(techRecordResultSet.rows[0].couplingType).toBe('1');
    expect(techRecordResultSet.rows[0]).toHaveLength(1);
    expect(techRecordResultSet.rows[0].height).toBe(1);
    expect(techRecordResultSet.rows[0].width).toBe(1);
    expect(techRecordResultSet.rows[0].frontAxleTo5thWheelMin).toBe(1);
    expect(techRecordResultSet.rows[0].frontAxleTo5thWheelMax).toBe(1);
    expect(
      techRecordResultSet.rows[0].frontVehicleTo5thWheelCouplingMin,
    ).toBe(1);
    expect(
      techRecordResultSet.rows[0].frontVehicleTo5thWheelCouplingMax,
    ).toBe(1);
    expect(techRecordResultSet.rows[0].frontAxleToRearAxle).toBe(1);
    expect(techRecordResultSet.rows[0].rearAxleToRearTrl).toBe(1);
    expect(techRecordResultSet.rows[0].couplingCenterToRearAxleMin).toBe(
      1,
    );
    expect(techRecordResultSet.rows[0].couplingCenterToRearAxleMax).toBe(
      1,
    );
    expect(techRecordResultSet.rows[0].couplingCenterToRearTrlMin).toBe(1);
    expect(techRecordResultSet.rows[0].couplingCenterToRearTrlMax).toBe(1);
    expect(
      techRecordResultSet.rows[0].centreOfRearmostAxleToRearOfTrl,
    ).toBe(1);
    expect(techRecordResultSet.rows[0].notes).toBe('NOTES');
    expect(techRecordResultSet.rows[0].purchaserNotes).toBe(
      'PURCHASER-NOTES',
    );
    expect(techRecordResultSet.rows[0].manufacturerNotes).toBe(
      'MANUFACTURER-NOTES',
    );
    expect(techRecordResultSet.rows[0].noOfAxles).toBe(1);
    expect(techRecordResultSet.rows[0].brakeCode).toBe('1');
    expect(techRecordResultSet.rows[0].brakes_dtpNumber).toBe('666666');
    expect(techRecordResultSet.rows[0].brakes_loadSensingValve).toBe(1);
    expect(techRecordResultSet.rows[0].brakes_antilockBrakingSystem).toBe(
      1,
    );
    expect(techRecordResultSet.rows[0].updateType).toBe('adrUpdate');
    expect(techRecordResultSet.rows[0].numberOfSeatbelts).toBe(
      'NUMBER-OF-SEATBELTS',
    );
    expect(
      (techRecordResultSet.rows[0]
        .seatbeltInstallationApprovalDate as Date).toUTCString(),
    ).toBe('Wed, 01 Jan 2020 00:00:00 GMT');

    const brakesResultSet = await executeSql(
      `SELECT \`technical_record_id\`,
                  \`brakeCodeOriginal\`,
                  \`brakeCode\`,
                  \`dataTrBrakeOne\`,
                  \`dataTrBrakeTwo\`,
                  \`dataTrBrakeThree\`,
                  \`retarderBrakeOne\`,
                  \`retarderBrakeTwo\`,
                  \`serviceBrakeForceA\`,
                  \`secondaryBrakeForceA\`,
                  \`parkingBrakeForceA\`,
                  \`serviceBrakeForceB\`,
                  \`secondaryBrakeForceB\`,
                  \`parkingBrakeForceB\`
            FROM \`psv_brakes\`
            WHERE \`psv_brakes\`.\`technical_record_id\` = ${technicalRecordId}`,
    );
    expect(brakesResultSet.rows).toHaveLength(1);
    expect(brakesResultSet.rows[0].technical_record_id).toEqual(
      technicalRecordId,
    );
    expect(brakesResultSet.rows[0].brakeCodeOriginal).toBe('333');
    expect(brakesResultSet.rows[0].brakeCode).toBe('666666');
    expect(brakesResultSet.rows[0].dataTrBrakeOne).toBe(
      'DATA-TR-BRAKE-ONE',
    );
    expect(brakesResultSet.rows[0].dataTrBrakeTwo).toBe(
      'DATA-TR-BRAKE-TWO',
    );
    expect(brakesResultSet.rows[0].dataTrBrakeThree).toBe(
      'DATA-TR-BRAKE-THREE',
    );
    expect(brakesResultSet.rows[0].retarderBrakeOne).toBe('electric');
    expect(brakesResultSet.rows[0].retarderBrakeTwo).toBe('electric');
    expect(brakesResultSet.rows[0].serviceBrakeForceA).toBe(1);
    expect(brakesResultSet.rows[0].secondaryBrakeForceA).toBe(1);
    expect(brakesResultSet.rows[0].parkingBrakeForceA).toBe(1);
    expect(brakesResultSet.rows[0].serviceBrakeForceB).toBe(1);
    expect(brakesResultSet.rows[0].secondaryBrakeForceB).toBe(1);
    expect(brakesResultSet.rows[0].parkingBrakeForceB).toBe(1);

    const axleSpacingResultSet = await executeSql(
      `SELECT \`technical_record_id\`, \`axles\`, \`value\`
            FROM \`axle_spacing\`
            WHERE \`axle_spacing\`.\`id\` IN (
              SELECT \`id\`
              FROM \`axle_spacing\`
              WHERE \`axle_spacing\`.\`technical_record_id\` = ${technicalRecordId}
            )`,
    );
    expect(axleSpacingResultSet.rows).toHaveLength(1);
    expect(axleSpacingResultSet.rows[0].technical_record_id).toEqual(
      technicalRecordId,
    );
    expect(axleSpacingResultSet.rows[0].axles).toBe('1-2');
    expect(axleSpacingResultSet.rows[0].value).toBe(1);

    const microfilmResultSet = await executeSql(
      `SELECT \`technical_record_id\`, \`microfilmDocumentType\`, \`microfilmRollNumber\`, \`microfilmSerialNumber\`
            FROM \`microfilm\`
            WHERE \`microfilm\`.\`technical_record_id\` = ${technicalRecordId}`,
    );
    expect(microfilmResultSet.rows).toHaveLength(1);
    expect(microfilmResultSet.rows[0].technical_record_id).toEqual(
      technicalRecordId,
    );
    expect(microfilmResultSet.rows[0].microfilmDocumentType).toBe(
      'PSV Miscellaneous',
    );
    expect(microfilmResultSet.rows[0].microfilmRollNumber).toBe('1');
    expect(microfilmResultSet.rows[0].microfilmSerialNumber).toBe('1');

    const platesResultSet = await executeSql(
      `SELECT \`technical_record_id\`,
                  \`plateSerialNumber\`,
                  \`plateIssueDate\`,
                  \`plateReasonForIssue\`,
                  \`plateIssuer\`
            FROM \`plate\`
            WHERE \`plate\`.\`id\` IN (
              SELECT \`id\`
              FROM \`plate\`
              WHERE \`plate\`.\`technical_record_id\` = ${technicalRecordId}
            )`,
    );
    expect(platesResultSet.rows).toHaveLength(1);
    expect(platesResultSet.rows[0].technical_record_id).toEqual(
      technicalRecordId,
    );
    expect(platesResultSet.rows[0].plateSerialNumber).toBe('1');
    expect(
      (platesResultSet.rows[0].plateIssueDate as Date).toUTCString(),
    ).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
    expect(platesResultSet.rows[0].plateReasonForIssue).toBe(
      'Free replacement',
    );
    expect(platesResultSet.rows[0].plateIssuer).toBe('PLATE-ISSUER');

    const axlesResultSet = await executeSql(
      `SELECT \`technical_record_id\`,
                  \`tyre_id\`,
                  \`axleNumber\`,
                  \`parkingBrakeMrk\`,
                  \`kerbWeight\`,
                  \`ladenWeight\`,
                  \`gbWeight\`,
                  \`eecWeight\`,
                  \`designWeight\`,
                  \`brakeActuator\`,
                  \`leverLength\`,
                  \`springBrakeParking\`
            FROM \`axles\`
            WHERE \`axles\`.\`id\` IN (
              SELECT \`id\`
              FROM \`axles\`
              WHERE \`axles\`.\`technical_record_id\` = ${technicalRecordId}
            )`,
    );
    expect(axlesResultSet.rows).toHaveLength(1);
    expect(axlesResultSet.rows[0].technical_record_id).toEqual(
      technicalRecordId,
    );
    expect(axlesResultSet.rows[0].tyre_id).toEqual(technicalRecordId);
    expect(axlesResultSet.rows[0].axleNumber).toBe(1);
    expect(axlesResultSet.rows[0].parkingBrakeMrk).toBe(1);
    expect(axlesResultSet.rows[0].kerbWeight).toBe(1);
    expect(axlesResultSet.rows[0].ladenWeight).toBe(1);
    expect(axlesResultSet.rows[0].gbWeight).toBe(1);
    expect(axlesResultSet.rows[0].eecWeight).toBe(1);
    expect(axlesResultSet.rows[0].designWeight).toBe(1);
    expect(axlesResultSet.rows[0].brakeActuator).toBe(1);
    expect(axlesResultSet.rows[0].leverLength).toBe(1);
    expect(axlesResultSet.rows[0].springBrakeParking).toBe(1);

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
      (authIntoServiceResultSet.rows[0].dateAuthorised as Date).toUTCString(),
    ).toBe('Sat, 04 Apr 2020 00:00:00 GMT');
    expect(
      (authIntoServiceResultSet.rows[0].dateRejected as Date).toUTCString(),
    ).toBe('Tue, 05 May 2020 00:00:00 GMT');
  });

  describe('when adding a new vehicle and changing VRM to a new value, VRM should change on existing vehicle.', () => {
    it('A new vehicle is present', async () => {
      // arrange - create a record so we can later query for it and assert for is existence
      const techRecordDocumentJsonNew = JSON.parse(
        JSON.stringify(techRecordDocumentJson),
      );
      techRecordDocumentJsonNew.systemNumber = { S: 'SYSTEM-NUMBER-2' };
      techRecordDocumentJsonNew.vin = { S: 'VIN2' };
      techRecordDocumentJsonNew.primaryVrm = { S: 'VRM7777' };

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
      // array of arrays: event contains array of records, each with array of tech record entities
      await processStreamEvent(event, exampleContext(), () => {

      });

      const vehicleResultSet = await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`
                FROM \`vehicle\`
                WHERE \`system_number\` = "SYSTEM-NUMBER-2"`,
      );

      expect(vehicleResultSet.rows).toHaveLength(1);
      expect(vehicleResultSet.rows[0].system_number).toBe(
        'SYSTEM-NUMBER-2',
      );
      expect(vehicleResultSet.rows[0].vin).toBe('VIN2');
      expect(vehicleResultSet.rows[0].vrm_trm).toBe('VRM7777');
      expect(vehicleResultSet.rows[0].trailer_id).toBe('TRL-1');
      expect(
        (vehicleResultSet.rows[0].createdAt as Date).toUTCString(),
      ).not.toBeNull(); // todo This returns null
    });

    it('VRM has changed', async () => {
      // arrange - create a record with existing pair of (SystemNumber, VIN) and new VRM so we can later query for it and assert its value
      const techRecordDocumentJsonNew = JSON.parse(
        JSON.stringify(techRecordDocumentJson),
      );
      techRecordDocumentJsonNew.systemNumber = { S: 'SYSTEM-NUMBER-2' };
      techRecordDocumentJsonNew.vin = { S: 'VIN2' };
      techRecordDocumentJsonNew.primaryVrm = { S: 'VRM888NEW' };

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
      // array of arrays: event contains array of records, each with array of tech record entities
      await processStreamEvent(event, exampleContext(), () => {

      });

      const vehicleResultSet = await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`
                FROM \`vehicle\`
                WHERE \`system_number\` = "SYSTEM-NUMBER-2"`,
      );

      expect(vehicleResultSet.rows).toHaveLength(1);
      expect(vehicleResultSet.rows[0].system_number).toBe(
        'SYSTEM-NUMBER-2',
      );
      expect(vehicleResultSet.rows[0].vin).toBe('VIN2');
      expect(vehicleResultSet.rows[0].vrm_trm).toBe('VRM888NEW');
      expect(vehicleResultSet.rows[0].trailer_id).toBe('TRL-1');
      expect(
        (vehicleResultSet.rows[0].createdAt as Date).toUTCString(),
      ).not.toBeNull(); // todo This returns null
    });
  });
});
