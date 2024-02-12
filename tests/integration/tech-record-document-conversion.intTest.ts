import { StartedTestContainer } from "testcontainers";
import {
  destroyConnectionPool,
  executeSql,
} from "../../src/services/connection-pool";
import { exampleContext, useLocalDb } from "../utils";
import techRecordDocumentJsonWithADR from "../resources/dynamodb-image-technical-record-with-adr.json";
import { getContainerizedDatabase } from "./cvsbnop-container";
import { processStreamEvent } from "../../src/functions/process-stream-event";
import { getConnectionPoolOptions } from "../../src/services/connection-pool-options";

useLocalDb();

export const techRecordDocumentConversion = () =>
  describe("convertTechRecordDocument() with ADR integration tests", () => {
    let container: StartedTestContainer;

    beforeAll(async () => {
      jest.setTimeout(60_000);
      jest.restoreAllMocks();

      // see README for why this environment variable exists
      if (process.env.USE_CONTAINERIZED_DATABASE === "1") {
        container = await getContainerizedDatabase();
      } else {
        (getConnectionPoolOptions as jest.Mock) = jest.fn().mockResolvedValue({
          host: "localhost",
          port: "3306",
          user: "root",
          password: "12345",
          database: "CVSBNOP",
        });
      }
    });

    afterAll(async () => {
      await destroyConnectionPool();
      if (process.env.USE_CONTAINERIZED_DATABASE === "1") {
        await container.stop();
      }
    });

    it("should correctly convert a DynamoDB event into Aurora rows", async () => {
      const event = {
        Records: [
          {
            body: JSON.stringify({
              eventSourceARN:
                "arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T00:00:00.000",
              eventName: "INSERT",
              dynamodb: {
                NewImage: techRecordDocumentJsonWithADR,
              },
            }),
          },
        ],
      };

      // array of arrays: event contains array of records, each with array of tech record entities
      await processStreamEvent(event, exampleContext(), () => {
        return;
      });

      const vehicleResultSet = await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
             FROM \`vehicle\`
             WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-1"`
      );
      expect(vehicleResultSet.rows.length).toEqual(1);
      expect(vehicleResultSet.rows[0].system_number).toEqual("SYSTEM-NUMBER-1");
      expect(vehicleResultSet.rows[0].vin).toEqual("VIN1");
      expect(vehicleResultSet.rows[0].vrm_trm).toEqual("VRM-1");
      expect(vehicleResultSet.rows[0].trailer_id).toEqual("TRL-1");
      expect(
        (vehicleResultSet.rows[0].createdAt as Date).toUTCString()
      ).not.toBeNull(); // todo This returns null

      const vehicleId = vehicleResultSet.rows[0].id;
      const technicalRecordSet = await executeSql(
        `SELECT \`make_model_id\`, \`vehicle_class_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`, \`applicant_detail_id\`, \`purchaser_detail_id\`, \`manufacturer_detail_id\`, \`id\`, \`createdAt\`
            FROM \`technical_record\`
            WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`
      );

      expect(technicalRecordSet.rows.length).toEqual(1);
      expect(
        (technicalRecordSet.rows[0].createdAt as Date).toISOString()
      ).toEqual("2020-01-01T00:00:00.055Z");

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
             WHERE \`make_model\`.\`id\` = ${make_model_id}`
      );
      expect(makeModelResultSet.rows.length).toEqual(1);
      expect(makeModelResultSet.rows[0].make).toEqual("MAKE");
      expect(makeModelResultSet.rows[0].model).toEqual("MODEL");
      expect(makeModelResultSet.rows[0].chassisMake).toEqual("CHASSIS-MAKE");
      expect(makeModelResultSet.rows[0].chassisModel).toEqual("CHASSIS-MODEL");
      expect(makeModelResultSet.rows[0].bodyMake).toEqual("BODY-MAKE");
      expect(makeModelResultSet.rows[0].bodyModel).toEqual("BODY-MODEL");
      expect(makeModelResultSet.rows[0].modelLiteral).toEqual("MODEL-LITERAL");
      expect(makeModelResultSet.rows[0].bodyTypeCode).toEqual("a");
      expect(makeModelResultSet.rows[0].bodyTypeDescription).toEqual(
        "articulated"
      );
      expect(makeModelResultSet.rows[0].fuelPropulsionSystem).toEqual(
        "DieselPetrol"
      );
      expect(makeModelResultSet.rows[0].dtpCode).toEqual(null);

      const vehicleClassResultSet = await executeSql(
        `SELECT \`code\`,
                    \`description\`,
                    \`vehicleType\`,
                    \`vehicleSize\`,
                    \`vehicleConfiguration\`,
                    \`euVehicleCategory\`
             FROM \`vehicle_class\`
             WHERE \`vehicle_class\`.\`id\` = ${vehicle_class_id}`
      );
      expect(vehicleClassResultSet.rows.length).toEqual(1);
      expect(vehicleClassResultSet.rows[0].code).toEqual("2");
      expect(vehicleClassResultSet.rows[0].description).toEqual(
        "motorbikes over 200cc or with a sidecar"
      );
      expect(vehicleClassResultSet.rows[0].vehicleType).toEqual("psv");
      expect(vehicleClassResultSet.rows[0].vehicleSize).toEqual("small");
      expect(vehicleClassResultSet.rows[0].vehicleConfiguration).toEqual(
        "rigid"
      );
      expect(vehicleClassResultSet.rows[0].euVehicleCategory).toEqual("m1");

      const createdByResultSet = await executeSql(
        `SELECT \`identityId\`, \`name\`
             FROM \`identity\`
             WHERE \`identity\`.\`id\` = ${createdBy_Id}`
      );
      expect(createdByResultSet.rows.length).toEqual(1);
      expect(createdByResultSet.rows[0].identityId).toEqual("CREATED-BY-ID-2");
      expect(createdByResultSet.rows[0].name).toEqual("CREATED-BY-NAME-2");

      const lastUpdatedByResultSet = await executeSql(
        `SELECT \`identityId\`, \`name\`
             FROM \`identity\`
             WHERE \`identity\`.\`id\` = ${lastUpdatedBy_Id}`
      );
      expect(lastUpdatedByResultSet.rows.length).toEqual(1);
      expect(lastUpdatedByResultSet.rows[0].identityId).toEqual(
        "LAST-UPDATED-BY-ID-2"
      );
      expect(lastUpdatedByResultSet.rows[0].name).toEqual(
        "LAST-UPDATED-BY-NAME-2"
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
             WHERE \`contact_details\`.\`id\` = ${applicant_detail_id}`
      );

      const contactIds = [
        applicant_detail_id,
        manufacturer_detail_id,
        purchaser_detail_id,
      ];
      expect(contactIds.every((id) => contactIds[0] === id)).toBe(true);

      expect(contactDetailsResultSet.rows.length).toEqual(1);
      expect(contactDetailsResultSet.rows[0].name).toEqual("NAME");
      expect(contactDetailsResultSet.rows[0].address1).toEqual("ADDRESS-1");
      expect(contactDetailsResultSet.rows[0].address2).toEqual("ADDRESS-2");
      expect(contactDetailsResultSet.rows[0].postTown).toEqual("POST-TOWN");
      expect(contactDetailsResultSet.rows[0].address3).toEqual("ADDRESS-3");
      expect(contactDetailsResultSet.rows[0].postCode).toEqual("POST-CODE");
      expect(contactDetailsResultSet.rows[0].emailAddress).toEqual(
        "EMAIL-ADDRESS"
      );
      expect(contactDetailsResultSet.rows[0].telephoneNumber).toEqual(
        "TELEPHONE-NUMBER"
      );
      expect(contactDetailsResultSet.rows[0].faxNumber).toEqual("FAX-NUMBER");

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
             WHERE \`technical_record\`.\`id\` = ${technicalRecordId}`
      );
      // check a few fields of different types here
      expect(techRecordResultSet.rows[0].vehicle_id).toEqual(vehicleId);
      expect(techRecordResultSet.rows[0].recordCompleteness).toEqual(
        "88888888"
      );
      expect(
        (techRecordResultSet.rows[0].createdAt as Date).toUTCString()
      ).toEqual("Wed, 01 Jan 2020 00:00:00 GMT");
      expect(
        (techRecordResultSet.rows[0].lastUpdatedAt as Date).toUTCString()
      ).toEqual("Wed, 01 Jan 2020 00:00:00 GMT");
      expect(techRecordResultSet.rows[0].make_model_id).toEqual(1);
      expect(techRecordResultSet.rows[0].functionCode).toEqual("1");
      expect(techRecordResultSet.rows[0].offRoad).toEqual(1);
      expect(techRecordResultSet.rows[0].numberOfWheelsDriven).toEqual(1);
      expect(
        (techRecordResultSet.rows[0].regnDate as Date).toUTCString()
      ).toEqual("Wed, 01 Jan 2020 00:00:00 GMT");
      expect(techRecordResultSet.rows[0].unladenWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].emissionsLimit).toEqual("1");
      expect(techRecordResultSet.rows[0].departmentalVehicleMarker).toEqual(1);
      expect(techRecordResultSet.rows[0].alterationMarker).toEqual(1);
      expect(techRecordResultSet.rows[0].vehicle_class_id).toEqual(
        vehicle_class_id
      );
      expect(techRecordResultSet.rows[0].variantVersionNumber).toEqual("1");
      expect(techRecordResultSet.rows[0].grossEecWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].trainEecWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].maxTrainEecWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].applicant_detail_id).toEqual(1);
      expect(techRecordResultSet.rows[0].purchaser_detail_id).toEqual(1);
      expect(techRecordResultSet.rows[0].manufacturer_detail_id).toEqual(1);
      expect(techRecordResultSet.rows[0].manufactureYear).toEqual(2020);
      expect(
        (techRecordResultSet.rows[0].firstUseDate as Date).toUTCString()
      ).toEqual("Wed, 01 Jan 2020 00:00:00 GMT");
      expect(
        (techRecordResultSet.rows[0].coifDate as Date).toUTCString()
      ).toEqual("Wed, 01 Jan 2020 00:00:00 GMT");
      expect(techRecordResultSet.rows[0].ntaNumber).toEqual("NTA-NUMBER");
      expect(techRecordResultSet.rows[0].coifSerialNumber).toEqual("88888888");
      expect(techRecordResultSet.rows[0].coifCertifierName).toEqual(
        "COIF-CERTIFIER-NAME"
      );
      expect(techRecordResultSet.rows[0].approvalType).toEqual("NTA");
      expect(techRecordResultSet.rows[0].approvalTypeNumber).toEqual("1");
      expect(techRecordResultSet.rows[0].variantNumber).toEqual("1");
      expect(techRecordResultSet.rows[0].conversionRefNo).toEqual("1010101010");
      expect(techRecordResultSet.rows[0].seatsLowerDeck).toEqual(1);
      expect(techRecordResultSet.rows[0].seatsUpperDeck).toEqual(1);
      expect(techRecordResultSet.rows[0].standingCapacity).toEqual(1);
      expect(techRecordResultSet.rows[0].speedRestriction).toEqual(1);
      expect(techRecordResultSet.rows[0].speedLimiterMrk).toEqual(1);
      expect(techRecordResultSet.rows[0].tachoExemptMrk).toEqual(1);
      expect(techRecordResultSet.rows[0].dispensations).toEqual(
        "DISPENSATIONS"
      );
      expect(techRecordResultSet.rows[0].remarks).toEqual("REMARKS");
      expect(techRecordResultSet.rows[0].reasonForCreation).toEqual(
        "REASON-FOR-CREATION"
      );
      expect(techRecordResultSet.rows[0].statusCode).toEqual("STATUS-CODE");
      expect(techRecordResultSet.rows[0].grossKerbWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].grossLadenWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].grossGbWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].grossDesignWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].trainGbWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].trainDesignWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].maxTrainGbWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].maxTrainDesignWeight).toEqual(1);
      expect(techRecordResultSet.rows[0].maxLoadOnCoupling).toEqual(1);
      expect(techRecordResultSet.rows[0].frameDescription).toEqual(
        "Channel section"
      );
      expect(techRecordResultSet.rows[0].tyreUseCode).toEqual("22");
      expect(techRecordResultSet.rows[0].roadFriendly).toEqual(1);
      expect(techRecordResultSet.rows[0].drawbarCouplingFitted).toEqual(1);
      expect(techRecordResultSet.rows[0].euroStandard).toEqual("euroStd");
      expect(techRecordResultSet.rows[0].suspensionType).toEqual("1");
      expect(techRecordResultSet.rows[0].couplingType).toEqual("1");
      expect(techRecordResultSet.rows[0].length).toEqual(1);
      expect(techRecordResultSet.rows[0].height).toEqual(1);
      expect(techRecordResultSet.rows[0].width).toEqual(1);
      expect(techRecordResultSet.rows[0].frontAxleTo5thWheelMin).toEqual(1);
      expect(techRecordResultSet.rows[0].frontAxleTo5thWheelMax).toEqual(1);
      expect(
        techRecordResultSet.rows[0].frontVehicleTo5thWheelCouplingMin
      ).toEqual(1);
      expect(
        techRecordResultSet.rows[0].frontVehicleTo5thWheelCouplingMax
      ).toEqual(1);
      expect(techRecordResultSet.rows[0].frontAxleToRearAxle).toEqual(1);
      expect(techRecordResultSet.rows[0].rearAxleToRearTrl).toEqual(1);
      expect(techRecordResultSet.rows[0].couplingCenterToRearAxleMin).toEqual(
        1
      );
      expect(techRecordResultSet.rows[0].couplingCenterToRearAxleMax).toEqual(
        1
      );
      expect(techRecordResultSet.rows[0].couplingCenterToRearTrlMin).toEqual(1);
      expect(techRecordResultSet.rows[0].couplingCenterToRearTrlMax).toEqual(1);
      expect(
        techRecordResultSet.rows[0].centreOfRearmostAxleToRearOfTrl
      ).toEqual(1);
      expect(techRecordResultSet.rows[0].notes).toEqual("NOTES");
      expect(techRecordResultSet.rows[0].purchaserNotes).toEqual(
        "PURCHASER-NOTES"
      );
      expect(techRecordResultSet.rows[0].manufacturerNotes).toEqual(
        "MANUFACTURER-NOTES"
      );
      expect(techRecordResultSet.rows[0].noOfAxles).toEqual(1);
      expect(techRecordResultSet.rows[0].brakeCode).toEqual("1");
      expect(techRecordResultSet.rows[0].brakes_dtpNumber).toEqual("666666");
      expect(techRecordResultSet.rows[0].brakes_loadSensingValve).toEqual(1);
      expect(techRecordResultSet.rows[0].brakes_antilockBrakingSystem).toEqual(
        1
      );
      expect(techRecordResultSet.rows[0].updateType).toEqual("adrUpdate");
      expect(techRecordResultSet.rows[0].numberOfSeatbelts).toEqual(
        "NUMBER-OF-SEATBELTS"
      );
      expect(
        (techRecordResultSet.rows[0]
          .seatbeltInstallationApprovalDate as Date).toUTCString()
      ).toEqual("Wed, 01 Jan 2020 00:00:00 GMT");

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
             WHERE \`psv_brakes\`.\`technical_record_id\` = ${technicalRecordId}`
      );
      expect(brakesResultSet.rows.length).toEqual(1);
      expect(brakesResultSet.rows[0].technical_record_id).toEqual(
        technicalRecordId
      );
      expect(brakesResultSet.rows[0].brakeCodeOriginal).toEqual("333");
      expect(brakesResultSet.rows[0].brakeCode).toEqual("666666");
      expect(brakesResultSet.rows[0].dataTrBrakeOne).toEqual(
        "DATA-TR-BRAKE-ONE"
      );
      expect(brakesResultSet.rows[0].dataTrBrakeTwo).toEqual(
        "DATA-TR-BRAKE-TWO"
      );
      expect(brakesResultSet.rows[0].dataTrBrakeThree).toEqual(
        "DATA-TR-BRAKE-THREE"
      );
      expect(brakesResultSet.rows[0].retarderBrakeOne).toEqual("electric");
      expect(brakesResultSet.rows[0].retarderBrakeTwo).toEqual("electric");
      expect(brakesResultSet.rows[0].serviceBrakeForceA).toEqual(1);
      expect(brakesResultSet.rows[0].secondaryBrakeForceA).toEqual(1);
      expect(brakesResultSet.rows[0].parkingBrakeForceA).toEqual(1);
      expect(brakesResultSet.rows[0].serviceBrakeForceB).toEqual(1);
      expect(brakesResultSet.rows[0].secondaryBrakeForceB).toEqual(1);
      expect(brakesResultSet.rows[0].parkingBrakeForceB).toEqual(1);

      const axleSpacingResultSet = await executeSql(
        `SELECT \`technical_record_id\`, \`axles\`, \`value\`
             FROM \`axle_spacing\`
             WHERE \`axle_spacing\`.\`id\` IN (
                SELECT \`id\`
                FROM \`axle_spacing\`
                WHERE \`axle_spacing\`.\`technical_record_id\` = ${technicalRecordId}
             )`
      );
      expect(axleSpacingResultSet.rows.length).toEqual(1);
      expect(axleSpacingResultSet.rows[0].technical_record_id).toEqual(
        technicalRecordId
      );
      expect(axleSpacingResultSet.rows[0].axles).toEqual("1-2");
      expect(axleSpacingResultSet.rows[0].value).toEqual(1);

      const microfilmResultSet = await executeSql(
        `SELECT \`technical_record_id\`, \`microfilmDocumentType\`, \`microfilmRollNumber\`, \`microfilmSerialNumber\`
             FROM \`microfilm\`
             WHERE \`microfilm\`.\`technical_record_id\` = ${technicalRecordId}`
      );
      expect(microfilmResultSet.rows.length).toEqual(1);
      expect(microfilmResultSet.rows[0].technical_record_id).toEqual(
        technicalRecordId
      );
      expect(microfilmResultSet.rows[0].microfilmDocumentType).toEqual(
        "PSV Miscellaneous"
      );
      expect(microfilmResultSet.rows[0].microfilmRollNumber).toEqual("1");
      expect(microfilmResultSet.rows[0].microfilmSerialNumber).toEqual("1");

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
             )`
      );
      expect(platesResultSet.rows.length).toEqual(1);
      expect(platesResultSet.rows[0].technical_record_id).toEqual(
        technicalRecordId
      );
      expect(platesResultSet.rows[0].plateSerialNumber).toEqual("1");
      expect(
        (platesResultSet.rows[0].plateIssueDate as Date).toUTCString()
      ).toEqual("Wed, 01 Jan 2020 00:00:00 GMT");
      expect(platesResultSet.rows[0].plateReasonForIssue).toEqual(
        "Free replacement"
      );
      expect(platesResultSet.rows[0].plateIssuer).toEqual("PLATE-ISSUER");

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
             )`
      );
      expect(axlesResultSet.rows.length).toEqual(1);
      expect(axlesResultSet.rows[0].technical_record_id).toEqual(
        technicalRecordId
      );
      expect(axlesResultSet.rows[0].tyre_id).toEqual(technicalRecordId);
      expect(axlesResultSet.rows[0].axleNumber).toEqual(1);
      expect(axlesResultSet.rows[0].parkingBrakeMrk).toEqual(1);
      expect(axlesResultSet.rows[0].kerbWeight).toEqual(1);
      expect(axlesResultSet.rows[0].ladenWeight).toEqual(1);
      expect(axlesResultSet.rows[0].gbWeight).toEqual(1);
      expect(axlesResultSet.rows[0].eecWeight).toEqual(1);
      expect(axlesResultSet.rows[0].designWeight).toEqual(1);
      expect(axlesResultSet.rows[0].brakeActuator).toEqual(1);
      expect(axlesResultSet.rows[0].leverLength).toEqual(1);
      expect(axlesResultSet.rows[0].springBrakeParking).toEqual(1);

      const authIntoServiceResultSet = await executeSql(
        `SELECT \`technical_record_id\`,
                    \`cocIssueDate\`,
                    \`dateReceived\`,
                    \`datePending\`,
                    \`dateAuthorised\`,
                    \`dateRejected\`
             FROM \`auth_into_service\`
             WHERE \`auth_into_service\`.\`technical_record_id\` = ${technicalRecordId}`
      );
      expect(authIntoServiceResultSet.rows.length).toEqual(1);
      expect(authIntoServiceResultSet.rows[0].technical_record_id).toEqual(
        technicalRecordId
      );
      expect(
        (authIntoServiceResultSet.rows[0].cocIssueDate as Date).toUTCString()
      ).toEqual("Wed, 01 Jan 2020 00:00:00 GMT");
      expect(
        (authIntoServiceResultSet.rows[0].dateReceived as Date).toUTCString()
      ).toEqual("Sun, 02 Feb 2020 00:00:00 GMT");
      expect(
        (authIntoServiceResultSet.rows[0].datePending as Date).toUTCString()
      ).toEqual("Tue, 03 Mar 2020 00:00:00 GMT");
      expect(
        (authIntoServiceResultSet.rows[0].dateAuthorised as Date).toUTCString()
      ).toEqual("Sat, 04 Apr 2020 00:00:00 GMT");
      expect(
        (authIntoServiceResultSet.rows[0].dateRejected as Date).toUTCString()
      ).toEqual("Tue, 05 May 2020 00:00:00 GMT");

      const adrPassCertificateDetailsResultSet = await executeSql(
        `SELECT \`technical_record_id\`,
                    \`createdByName\`,
                    \`certificateType\`,
                    \`generatedTimestamp\`,
                    \`certificateId\`
             FROM \`adr_PassCertificateDetails\`
             WHERE \`adr_PassCertificateDetails\`.\`technical_record_id\` = ${technicalRecordId}`
      );
      expect(adrPassCertificateDetailsResultSet.rows.length).toEqual(1);
      expect(
        adrPassCertificateDetailsResultSet.rows[0].technical_record_id
      ).toEqual(technicalRecordId);
      expect(adrPassCertificateDetailsResultSet.rows[0].createdByName).toEqual(
        "CREATED-BY-NAME-01"
      );
      expect(
        adrPassCertificateDetailsResultSet.rows[0].certificateType
      ).toEqual("PASS");
      expect(
        (adrPassCertificateDetailsResultSet.rows[0].generatedTimestamp as Date)
          .toISOString()
      ).toEqual("2023-04-01T01:49:00.000Z");
      expect(adrPassCertificateDetailsResultSet.rows[0].certificateId).toEqual(
        "CERTIFICATE-ID-1"
      );

      // adr_details
      const adrDetailsResultSet = await executeSql(
        `SELECT \`id\`,
                \`technical_record_id\`,
                \`type\`,
                \`approvalDate\`,
                \`listStatementApplicable\`,
                \`batteryListNumber\`,
                \`declarationsSeen\`,
                \`brakeDeclarationsSeen\`,
                \`brakeDeclarationIssuer\`,
                \`brakeEndurance\`,
                \`weight\`,
                \`compatibilityGroupJ\`,
                \`applicantDetailsName\`,
                \`street\`,
                \`town\`,
                \`city\`,
                \`postcode\`,
                \`adrTypeApprovalNo\`,
                \`adrCertificateNotes\`,
                \`tankManufacturer\`,
                \`yearOfManufacture\`,
                \`tankCode\`,
                \`specialProvisions\`,
                \`tankManufacturerSerialNo\`,
                \`tankTypeAppNo\`,
                \`tc2Type\`,
                \`tc2IntermediateApprovalNo\`,
                \`tc2IntermediateExpiryDate\`,
                \`substancesPermitted\`,
                \`statement\`,
                \`productListRefNo\`,
                \`productList\`,
                \`m145Statement\`
             FROM \`adr_details\`
             WHERE \`adr_details\`.\`technical_record_id\` = ${technicalRecordId}`
      );
      expect(adrDetailsResultSet.rows.length).toEqual(1);
      expect(adrDetailsResultSet.rows[0].technical_record_id).toEqual(
        technicalRecordId
      );
      expect(adrDetailsResultSet.rows[0].type).toEqual("Artic tractor");
      expect(
        (adrDetailsResultSet.rows[0].approvalDate as Date).toUTCString()
      ).toEqual("Mon, 12 Jun 2023 00:00:00 GMT");
      expect(adrDetailsResultSet.rows[0].listStatementApplicable).toEqual(1);
      expect(adrDetailsResultSet.rows[0].batteryListNumber).toEqual("BATTERY1");
      expect(adrDetailsResultSet.rows[0].declarationsSeen).toEqual(0);
      expect(adrDetailsResultSet.rows[0].brakeDeclarationsSeen).toEqual(1);
      expect(adrDetailsResultSet.rows[0].brakeDeclarationIssuer).toEqual(
        "brakeDeclarationIssuer_1"
      );
      expect(adrDetailsResultSet.rows[0].brakeEndurance).toEqual(0);
      expect(adrDetailsResultSet.rows[0].weight).toEqual("7.50");
      expect(adrDetailsResultSet.rows[0].compatibilityGroupJ).toEqual("I");
      expect(adrDetailsResultSet.rows[0].applicantDetailsName).toEqual(
        "applicantDetails_Name"
      );
      expect(adrDetailsResultSet.rows[0].street).toEqual(
        "applicantDetailsSTREET"
      );
      expect(adrDetailsResultSet.rows[0].town).toEqual("applicantDetailsTOWN");
      expect(adrDetailsResultSet.rows[0].city).toEqual("applicantDetailsCITY");
      expect(adrDetailsResultSet.rows[0].postcode).toEqual("POST-CODE");
      expect(adrDetailsResultSet.rows[0].adrTypeApprovalNo).toEqual(
        "adrTypeApprovalNo_1"
      );
      expect(adrDetailsResultSet.rows[0].adrCertificateNotes).toEqual(
        "adrCertificateNotes_1"
      );
      expect(adrDetailsResultSet.rows[0].tankManufacturer).toEqual(
        "tankManufacturer_1"
      );
      expect(adrDetailsResultSet.rows[0].yearOfManufacture).toEqual(2012);
      expect(adrDetailsResultSet.rows[0].tankCode).toEqual("tankCode_1");
      expect(adrDetailsResultSet.rows[0].specialProvisions).toEqual(
        "specialProvisions_1"
      );
      expect(adrDetailsResultSet.rows[0].tankManufacturerSerialNo).toEqual(
        "1234"
      );
      expect(adrDetailsResultSet.rows[0].tankTypeAppNo).toEqual("9876");
      expect(adrDetailsResultSet.rows[0].tc2Type).toEqual("initial");
      expect(adrDetailsResultSet.rows[0].tc2IntermediateApprovalNo).toEqual(
        "12345"
      );
      expect(
        (adrDetailsResultSet.rows[0]
          .tc2IntermediateExpiryDate as Date).toUTCString()
      ).toEqual("Sat, 01 Jun 2024 00:00:00 GMT");
      expect(adrDetailsResultSet.rows[0].substancesPermitted).toEqual(
        "Substances permitted under the tank code and any special provisions specified in 9 may be carried"
      );
      expect(adrDetailsResultSet.rows[0].statement).toEqual("statement_1");
      expect(adrDetailsResultSet.rows[0].productListRefNo).toEqual("123456");
      expect(adrDetailsResultSet.rows[0].productList).toEqual("productList_1");
      expect(adrDetailsResultSet.rows[0].m145Statement).toEqual(1);

      const adrDetailsId = adrDetailsResultSet.rows[0].id;

      // adr_memos_apply
      const adrMemosApplyResultSet = await executeSql(
        `SELECT \`adr_details_id\`,
                \`memo\`
             FROM \`adr_memos_apply\`
             WHERE \`adr_memos_apply\`.\`adr_details_id\` = ${adrDetailsId}`
      );
      expect(adrMemosApplyResultSet.rows.length).toEqual(1);
      expect(adrMemosApplyResultSet.rows[0].adr_details_id).toEqual(
        adrDetailsId
      );
      expect(adrMemosApplyResultSet.rows[0].memo).toEqual(
        "07/09 3mth leak ext"
      );

      // adr_dangerous_goods_list
      const adrDangerousGoodsListResultSet = await executeSql(
        `SELECT \`id\`,
                \`name\`
             FROM \`adr_dangerous_goods_list\`
             `
      );
      expect(adrDangerousGoodsListResultSet.rows.length).toEqual(3);

      expect(adrDangerousGoodsListResultSet.rows[0].name).toEqual(
        "FP <61 (FL)"
      );
      expect(adrDangerousGoodsListResultSet.rows[1].name).toEqual(
        "Carbon Disulphide"
      );
      expect(adrDangerousGoodsListResultSet.rows[2].name).toEqual("Hydrogen");

      // adr_permitted_dangerous_goods
      const adrPermittedDangerousGoodsResultSet = await executeSql(
        `SELECT \`adr_details_id\`,
                \`adr_dangerous_goods_list_id\`
             FROM \`adr_permitted_dangerous_goods\`
             WHERE \`adr_permitted_dangerous_goods\`.\`adr_details_id\` = ${adrDetailsId}`
      );
      expect(adrPermittedDangerousGoodsResultSet.rows.length).toEqual(3);
      expect(
        adrPermittedDangerousGoodsResultSet.rows[0].adr_details_id
      ).toEqual(adrDetailsId);
      expect(
        adrPermittedDangerousGoodsResultSet.rows[0].adr_dangerous_goods_list_id
      ).toEqual(1);
      expect(
        adrPermittedDangerousGoodsResultSet.rows[1].adr_dangerous_goods_list_id
      ).toEqual(2);
      expect(
        adrPermittedDangerousGoodsResultSet.rows[2].adr_dangerous_goods_list_id
      ).toEqual(3);

      // adr_productListUnNo_list
      const adrProductListUnNoListResultSet = await executeSql(
        `SELECT \`id\`,
                \`name\`
             FROM \`adr_productListUnNo_list\`
             `
      );
      expect(adrProductListUnNoListResultSet.rows.length).toEqual(3);

      expect(adrProductListUnNoListResultSet.rows[0].name).toEqual("123123");
      expect(adrProductListUnNoListResultSet.rows[1].name).toEqual("987987");
      expect(adrProductListUnNoListResultSet.rows[2].name).toEqual("135790");

      // adr_productListUnNo
      const adrProductListUnNoResultSet = await executeSql(
        `SELECT \`adr_details_id\`,
                \`adr_productListUnNo_list_id\`
             FROM \`adr_productListUnNo\`
             WHERE \`adr_productListUnNo\`.\`adr_details_id\` = ${adrDetailsId}`
      );
      expect(adrProductListUnNoResultSet.rows.length).toEqual(3);
      expect(adrProductListUnNoResultSet.rows[0].adr_details_id).toEqual(
        adrDetailsId
      );
      expect(
        adrProductListUnNoResultSet.rows[0].adr_productListUnNo_list_id
      ).toEqual(1);
      expect(
        adrProductListUnNoResultSet.rows[1].adr_productListUnNo_list_id
      ).toEqual(2);
      expect(
        adrProductListUnNoResultSet.rows[2].adr_productListUnNo_list_id
      ).toEqual(3);

      // adr_tc3Details
      const adrTc3DetailsResultSet = await executeSql(
        `SELECT \`adr_details_id\`,
                \`tc3Type\`,
                \`tc3PeriodicNumber\`,
                \`tc3PeriodicExpiryDate\`
             FROM \`adr_tc3Details\`
             WHERE \`adr_tc3Details\`.\`adr_details_id\` = ${adrDetailsId}`
      );
      expect(adrTc3DetailsResultSet.rows.length).toEqual(1);
      expect(adrTc3DetailsResultSet.rows[0].adr_details_id).toEqual(
        adrDetailsId
      );
      expect(adrTc3DetailsResultSet.rows[0].tc3Type).toEqual("intermediate");
      expect(adrTc3DetailsResultSet.rows[0].tc3PeriodicNumber).toEqual("98765");
      expect(
        (adrTc3DetailsResultSet.rows[0]
          .tc3PeriodicExpiryDate as Date).toUTCString()
      ).toEqual("Sat, 01 Jun 2024 00:00:00 GMT");

      // adr_additional_examiner_notes
      const adrAdditionalExaminerNotesResultSet = await executeSql(
        `SELECT \`adr_details_id\`,
                \`note\`,
                \`createdAtDate\`,
                \`lastUpdatedBy\`
             FROM \`adr_additional_examiner_notes\`
             WHERE \`adr_additional_examiner_notes\`.\`adr_details_id\` = ${adrDetailsId}`
      );
      expect(adrAdditionalExaminerNotesResultSet.rows.length).toEqual(1);
      expect(
        adrAdditionalExaminerNotesResultSet.rows[0].adr_details_id
      ).toEqual(adrDetailsId);
      expect(adrAdditionalExaminerNotesResultSet.rows[0].note).toEqual(
        "additionalExaminerNotes_note_1"
      );
      expect(
        (adrAdditionalExaminerNotesResultSet.rows[0]
          .createdAtDate as Date).toUTCString()
      ).toEqual("Tue, 30 May 2023 00:00:00 GMT");
      expect(adrAdditionalExaminerNotesResultSet.rows[0].lastUpdatedBy).toEqual(
        "additionalExaminerNotes_lastUpdatedBy_1"
      );

      // adr_additional_notes_number
      const adrAdditionalNotesNumberResultSet = await executeSql(
        `SELECT \`adr_details_id\`,
                \`number\`
             FROM \`adr_additional_notes_number\`
             WHERE \`adr_additional_notes_number\`.\`adr_details_id\` = ${adrDetailsId}`
      );
      expect(adrAdditionalNotesNumberResultSet.rows.length).toEqual(2);
      expect(adrAdditionalNotesNumberResultSet.rows[0].adr_details_id).toEqual(
        adrDetailsId
      );
      expect(adrAdditionalNotesNumberResultSet.rows[0].number).toEqual("1");
      expect(adrAdditionalNotesNumberResultSet.rows[1].number).toEqual("T1B");
    });

    it("should reject to insert same tech-record record into database", async () => {
      const event = {
        Records: [
          {
            body: JSON.stringify({
              eventSourceARN:
                "arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T01:00:00.000",
              eventName: "INSERT",
              dynamodb: {
                NewImage: techRecordDocumentJsonWithADR,
              },
            }),
          },
        ],
      };

      // array of arrays: event contains array of records, each with array of tech record entities
      await processStreamEvent(event, exampleContext(), () => {
        return;
      });

      const vehicleResultSet = await executeSql(`SELECT * FROM \`vehicle\``);
      expect(vehicleResultSet.rows.length).toEqual(1);

      const technicalRecordSet = await executeSql(
        `SELECT * FROM \`technical_record\``
      );
      expect(technicalRecordSet.rows.length).toEqual(1);

      const makeModelResultSet = await executeSql(
        `SELECT * FROM \`make_model\``
      );
      expect(makeModelResultSet.rows.length).toEqual(1);

      const vehicleClassResultSet = await executeSql(
        `SELECT * FROM \`vehicle_class\``
      );
      expect(vehicleClassResultSet.rows.length).toEqual(1);

      const {
        make_model_id,
        vehicle_class_id,
        createdBy_Id,
        lastUpdatedBy_Id,
        applicant_detail_id,
        purchaser_detail_id,
        manufacturer_detail_id,
      } = technicalRecordSet.rows[0];

      const createdByResultSet = await executeSql(
        `SELECT * FROM \`identity\`
        WHERE \`identity\`.\`id\` IN (${lastUpdatedBy_Id}, ${createdBy_Id})`
      );
      expect(createdByResultSet.rows.length).toEqual(2);

      const contactDetailsResultSet = await executeSql(
        `SELECT * FROM \`contact_details\``
      );
      expect(contactDetailsResultSet.rows.length).toEqual(1);

      const techRecordResultSet = await executeSql(
        `SELECT * FROM \`technical_record\``
      );
      expect(techRecordResultSet.rows.length).toEqual(1);

      const brakesResultSet = await executeSql(`SELECT * FROM \`psv_brakes\``);
      expect(brakesResultSet.rows.length).toEqual(1);

      const axleSpacingResultSet = await executeSql(
        `SELECT * FROM \`axle_spacing\``
      );
      expect(axleSpacingResultSet.rows.length).toEqual(1);

      const microfilmResultSet = await executeSql(
        `SELECT * FROM \`microfilm\``
      );
      expect(microfilmResultSet.rows.length).toEqual(1);

      const platesResultSet = await executeSql(`SELECT * FROM \`plate\``);
      expect(platesResultSet.rows.length).toEqual(1);

      const axlesResultSet = await executeSql(`SELECT * FROM \`axles\``);
      expect(axlesResultSet.rows.length).toEqual(1);

      const authIntoServiceResultSet = await executeSql(
        `SELECT * FROM \`auth_into_service\``
      );
      expect(authIntoServiceResultSet.rows.length).toEqual(1);

      const adrDetailsResultSet = await executeSql(
        `SELECT * FROM \`adr_details\``
      );
      expect(adrDetailsResultSet.rows.length).toEqual(1);

      const adrMemosApplyResultSet = await executeSql(
        `SELECT * FROM \`adr_memos_apply\``
      );
      expect(adrMemosApplyResultSet.rows.length).toEqual(2); // With current logic, this gets duplicated

      const adrDangerousGoodsListResultSet = await executeSql(
        `SELECT * FROM \`adr_dangerous_goods_list\``
      );
      expect(adrDangerousGoodsListResultSet.rows.length).toEqual(3);

      const adrPermittedDangerousGoodsResultSet = await executeSql(
        `SELECT * FROM \`adr_permitted_dangerous_goods\``
      );
      expect(adrPermittedDangerousGoodsResultSet.rows.length).toEqual(6); // With current logic, this gets duplicated

      const adrProductListUnNoListResultSet = await executeSql(
        `SELECT * FROM \`adr_productListUnNo_list\``
      );
      expect(adrProductListUnNoListResultSet.rows.length).toEqual(3);

      const adrProductListUnNoResultSet = await executeSql(
        `SELECT * FROM \`adr_productListUnNo\``
      );
      expect(adrProductListUnNoResultSet.rows.length).toEqual(6); // With current logic, this gets duplicated

      const adrTc3DetailsResultSet = await executeSql(
        `SELECT * FROM \`adr_tc3Details\``
      );
      expect(adrTc3DetailsResultSet.rows.length).toEqual(2); // With current logic, this gets duplicated

      const adrAdditionalExaminerNotesResultSet = await executeSql(
        `SELECT * FROM \`adr_additional_examiner_notes\``
      );
      expect(adrAdditionalExaminerNotesResultSet.rows.length).toEqual(2); // With current logic, this gets duplicated

      const adrAdditionalNotesNumberResultSet = await executeSql(
        `SELECT * FROM \`adr_additional_notes_number\``
      );
      expect(adrAdditionalNotesNumberResultSet.rows.length).toEqual(4);
    });

    describe("when adding a new vehicle and changing VRM to a new value, VRM should change on existing vehicle.", () => {
      it("A new vehicle is present", async () => {
        // arrange - create a record so we can later query for it and assert for is existence
        const techRecordDocumentJsonNew = JSON.parse(
          JSON.stringify(techRecordDocumentJsonWithADR)
        );
        techRecordDocumentJsonNew.systemNumber = { S: "SYSTEM-NUMBER-2" };
        techRecordDocumentJsonNew.vin = { S: "VIN2" };
        techRecordDocumentJsonNew.primaryVrm = { S: "VRM7777" };

        const event = {
          Records: [
            {
              body: JSON.stringify({
                eventSourceARN:
                  "arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T00:00:00.000",
                eventName: "INSERT",
                dynamodb: {
                  NewImage: techRecordDocumentJsonNew,
                },
              }),
            },
          ],
        };
        // array of arrays: event contains array of records, each with array of tech record entities
        await processStreamEvent(event, exampleContext(), () => {
          return;
        });

        const vehicleResultSet = await executeSql(
          `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`
                 FROM \`vehicle\`
                 WHERE \`system_number\` = "SYSTEM-NUMBER-2"`
        );

        expect(vehicleResultSet.rows.length).toEqual(1);
        expect(vehicleResultSet.rows[0].system_number).toEqual(
          "SYSTEM-NUMBER-2"
        );
        expect(vehicleResultSet.rows[0].vin).toEqual("VIN2");
        expect(vehicleResultSet.rows[0].vrm_trm).toEqual("VRM7777");
        expect(vehicleResultSet.rows[0].trailer_id).toEqual("TRL-1");
        expect(
          (vehicleResultSet.rows[0].createdAt as Date).toUTCString()
        ).not.toBeNull(); // todo This returns null
      });

      it("VRM has changed", async () => {
        // arrange - create a record with existing pair of (SystemNumber, VIN) and new VRM so we can later query for it and assert its value
        const techRecordDocumentJsonNew = JSON.parse(
          JSON.stringify(techRecordDocumentJsonWithADR)
        );
        techRecordDocumentJsonNew.systemNumber = { S: "SYSTEM-NUMBER-2" };
        techRecordDocumentJsonNew.vin = { S: "VIN2" };
        techRecordDocumentJsonNew.primaryVrm = { S: "VRM888NEW" };

        const event = {
          Records: [
            {
              body: JSON.stringify({
                eventSourceARN:
                  "arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T00:00:00.000",
                eventName: "INSERT",
                dynamodb: {
                  NewImage: techRecordDocumentJsonNew,
                },
              }),
            },
          ],
        };
        // array of arrays: event contains array of records, each with array of tech record entities
        await processStreamEvent(event, exampleContext(), () => {
          return;
        });

        const vehicleResultSet = await executeSql(
          `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`
                 FROM \`vehicle\`
                 WHERE \`system_number\` = "SYSTEM-NUMBER-2"`
        );

        expect(vehicleResultSet.rows.length).toEqual(1);
        expect(vehicleResultSet.rows[0].system_number).toEqual(
          "SYSTEM-NUMBER-2"
        );
        expect(vehicleResultSet.rows[0].vin).toEqual("VIN2");
        expect(vehicleResultSet.rows[0].vrm_trm).toEqual("VRM888NEW");
        expect(vehicleResultSet.rows[0].trailer_id).toEqual("TRL-1");
        expect(
          (vehicleResultSet.rows[0].createdAt as Date).toUTCString()
        ).not.toBeNull(); // todo This returns null
      });
    });

    describe("when adding a new vehicle and changing some ADR attributes to a new values, those fields are changed on ADR tables.", () => {
      it("A new vehicle is created", async () => {
        // arrange - create a record so we can later query for it and assert for is existence
        const techRecordDocumentJsonNew = JSON.parse(
          JSON.stringify(techRecordDocumentJsonWithADR)
        );
        techRecordDocumentJsonNew.systemNumber = { S: "SYSTEM-NUMBER-3" };
        techRecordDocumentJsonNew.vin = { S: "VIN3" };
        techRecordDocumentJsonNew.primaryVrm = { S: "VRM3" };

        // productListUnNo removed from payload
        delete techRecordDocumentJsonNew.techRecord.L[0].M.adrDetails.M
          .tank.M.tankStatement.M.productListUnNo;

        const event = {
          Records: [
            {
              body: JSON.stringify({
                eventSourceARN:
                  "arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T00:00:00.000",
                eventName: "INSERT",
                dynamodb: {
                  NewImage: techRecordDocumentJsonNew,
                },
              }),
            },
          ],
        };
        // array of arrays: event contains array of records, each with array of tech record entities
        await processStreamEvent(event, exampleContext(), () => {
          return;
        });

        const vehicleResultSet = await executeSql(
          `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
                 FROM \`vehicle\`
                 WHERE \`system_number\` = "SYSTEM-NUMBER-3"`
        );

        expect(vehicleResultSet.rows.length).toEqual(1);
        expect(vehicleResultSet.rows[0].system_number).toEqual(
          "SYSTEM-NUMBER-3"
        );
        expect(vehicleResultSet.rows[0].vin).toEqual("VIN3");
        expect(vehicleResultSet.rows[0].vrm_trm).toEqual("VRM3");
        expect(vehicleResultSet.rows[0].trailer_id).toEqual("TRL-1");
        expect(
          (vehicleResultSet.rows[0].createdAt as Date).toUTCString()
        ).not.toBeNull(); // todo This returns null

        const vehicleId = vehicleResultSet.rows[0].id;

        const technicalRecordSet = await executeSql(
          `SELECT *
            FROM \`technical_record\`
            WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`
        );

        expect(technicalRecordSet.rows.length).toEqual(1);

        const technicalRecordId = technicalRecordSet.rows[0].id;

        // check data in adr_details is updated and get adrDetailsId
        const adrDetailsResultSet = await executeSql(
          `SELECT *
           FROM \`adr_details\`
           WHERE \`adr_details\`.\`technical_record_id\` = ${technicalRecordId}`
        );
        expect(adrDetailsResultSet.rows.length).toEqual(1);
        expect(adrDetailsResultSet.rows[0].technical_record_id).toEqual(
          technicalRecordId
        );

        const adrDetailsId = adrDetailsResultSet.rows[0].id;

        // adr_productListUnNo_list
        const adrProductListUnNoListResultSet = await executeSql(
          `SELECT \`id\`,
                  \`name\`
            FROM \`adr_productListUnNo_list\``
        );
        expect(adrProductListUnNoListResultSet.rows.length).toEqual(3);

        // adr_productListUnNo (There shouldn't be any record for this)
        const adrProductListUnNoResultSet = await executeSql(
          `SELECT \`adr_details_id\`,
                  \`adr_productListUnNo_list_id\`
              FROM \`adr_productListUnNo\`
              WHERE \`adr_productListUnNo\`.\`adr_details_id\` = ${adrDetailsId}`
        );
        expect(adrProductListUnNoResultSet.rows.length).toEqual(0);
      });

      it("Some ADR attributes have been changed", async () => {
        const techRecordDocumentJsonNew = JSON.parse(
          JSON.stringify(techRecordDocumentJsonWithADR)
        );
        techRecordDocumentJsonNew.systemNumber = { S: "SYSTEM-NUMBER-3" };
        techRecordDocumentJsonNew.vin = { S: "VIN3" };
        techRecordDocumentJsonNew.primaryVrm = { S: "VRM3" };

        // update an already existing list into a different list
        techRecordDocumentJsonNew.techRecord.L[0].M.adrDetails.M.additionalNotes.M.number = {
          L: [{ S: "1" }, { S: "V1B" }],
        };
        // update an already existing string to a NULL value
        techRecordDocumentJsonNew.techRecord.L[0].M.adrDetails.M.adrCertificateNotes = { NULL: true };
        // update an already existing string to a different string
        techRecordDocumentJsonNew.techRecord.L[0].M.adrDetails.M.tank.M.tankDetails.M.tankManufacturer = {
          S: "different_tankManufacturer",
        };
        // update missing attribute to NULL
        techRecordDocumentJsonNew.techRecord.L[0].M.adrDetails.M.tank.M.tankStatement.M.productListUnNo = { NULL: true };

        const event = {
          Records: [
            {
              body: JSON.stringify({
                eventSourceARN:
                  "arn:aws:dynamodb:eu-west-1:1:table/technical-records/stream/2020-01-01T02:00:00.000",
                eventName: "INSERT",
                dynamodb: {
                  NewImage: techRecordDocumentJsonNew,
                },
              }),
            },
          ],
        };
        // array of arrays: event contains array of records, each with array of tech record entities
        await processStreamEvent(event, exampleContext(), () => {
          return;
        });

        // check if vehicle table is intact and get vehicleId
        const vehicleResultSet = await executeSql(
          `SELECT \`system_number\`, \`vin\`, \`vrm_trm\`, \`trailer_id\`, \`createdAt\`, \`id\`
             FROM \`vehicle\`
             WHERE \`vehicle\`.\`system_number\` = "SYSTEM-NUMBER-3"`
        );

        expect(vehicleResultSet.rows.length).toEqual(1);
        expect(vehicleResultSet.rows[0].system_number).toEqual(
          "SYSTEM-NUMBER-3"
        );
        expect(vehicleResultSet.rows[0].vin).toEqual("VIN3");
        expect(vehicleResultSet.rows[0].vrm_trm).toEqual("VRM3");
        expect(vehicleResultSet.rows[0].trailer_id).toEqual("TRL-1");
        expect(
          (vehicleResultSet.rows[0].createdAt as Date).toUTCString()
        ).not.toBeNull(); // todo This returns null

        const vehicleId = vehicleResultSet.rows[0].id;

        // check if technical_record table is intact and get technicalRecordId
        const technicalRecordSet = await executeSql(
          `SELECT \`make_model_id\`, \`vehicle_class_id\`, \`createdBy_Id\`, \`lastUpdatedBy_Id\`, \`applicant_detail_id\`, \`purchaser_detail_id\`, \`manufacturer_detail_id\`, \`id\`, \`createdAt\`
            FROM \`technical_record\`
            WHERE \`technical_record\`.\`vehicle_id\` = ${vehicleId}`
        );

        expect(technicalRecordSet.rows.length).toEqual(1);
        expect(
          (technicalRecordSet.rows[0].createdAt as Date).toISOString()
        ).toEqual("2020-01-01T00:00:00.055Z");

        const technicalRecordId = technicalRecordSet.rows[0].id;

        // check data in adr_details is updated and get adrDetailsId
        const adrDetailsResultSet = await executeSql(
          `SELECT * FROM \`adr_details\`
        WHERE \`adr_details\`.\`technical_record_id\` = ${technicalRecordId}`
        );
        expect(adrDetailsResultSet.rows.length).toEqual(1);
        expect(adrDetailsResultSet.rows[0].technical_record_id).toEqual(
          technicalRecordId
        );
        expect(adrDetailsResultSet.rows[0].adrCertificateNotes).toBeNull();
        expect(adrDetailsResultSet.rows[0].tankManufacturer).toEqual(
          "different_tankManufacturer"
        ); // is this gonna create an orphaned row?

        const adrDetailsId = adrDetailsResultSet.rows[0].id;

        // check data in adr_additional_notes_number is updated
        const adrAdditionalNotesNumberResultSet = await executeSql(
          `SELECT \`adr_details_id\`,
                \`number\`
             FROM \`adr_additional_notes_number\`
             WHERE \`adr_additional_notes_number\`.\`adr_details_id\` = ${adrDetailsId}`
        );
        // With current logic, this will create orphan rows
        expect(adrAdditionalNotesNumberResultSet.rows.length).toEqual(4);
        expect(
          adrAdditionalNotesNumberResultSet.rows[0].adr_details_id
        ).toEqual(adrDetailsId);
        expect(adrAdditionalNotesNumberResultSet.rows[0].number).toEqual("1"); // orphaned row
        expect(adrAdditionalNotesNumberResultSet.rows[1].number).toEqual("T1B"); // orphaned row
        expect(adrAdditionalNotesNumberResultSet.rows[2].number).toEqual("1");
        expect(adrAdditionalNotesNumberResultSet.rows[3].number).toEqual("V1B");

        // adr_productListUnNo_list
        const adrProductListUnNoListResultSet = await executeSql(
          `SELECT \`id\`,
                  \`name\`
            FROM \`adr_productListUnNo_list\``
        );
        expect(adrProductListUnNoListResultSet.rows.length).toEqual(3);

        // adr_productListUnNo (There still shouldn't be any record for this)
        const adrProductListUnNoResultSet = await executeSql(
          `SELECT \`adr_details_id\`,
                  \`adr_productListUnNo_list_id\`
              FROM \`adr_productListUnNo\`
              WHERE \`adr_productListUnNo\`.\`adr_details_id\` = ${adrDetailsId}`
        );
        expect(adrProductListUnNoResultSet.rows.length).toEqual(0);
      });
    });
  });
