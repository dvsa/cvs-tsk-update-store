import {
  parseTechRecordDocument,
  TechRecordDocument,
} from "../models/tech-record-document";
import { getFaxNumber, TechRecord } from "../models/tech-record";
import {
  AXLE_SPACING_TABLE,
  AXLES_TABLE,
  CONTACT_DETAILS_TABLE,
  IDENTITY_TABLE,
  MAKE_MODEL_TABLE,
  MICROFILM_TABLE,
  PLATE_TABLE,
  PSV_BRAKES_TABLE,
  TECHNICAL_RECORD_TABLE,
  TYRE_TABLE,
  VEHICLE_CLASS_TABLE,
  VEHICLE_SUBCLASS_TABLE,
  VEHICLE_TABLE,
  AUTH_INTO_SERVICE_TABLE,
  ADR_ADDITIONAL_EXAMINER_NOTES_TABLE,
  ADR_ADDITIONAL_NOTES_NUMBER_TABLE,
  ADR_DANGEROUS_GOODS_LIST_TABLE,
  ADR_DETAILS_TABLE,
  ADR_MEMOS_APPLY_TABLE,
  ADR_PERMITTED_DANGEROUS_GOODS_TABLE,
  ADR_PRODUCTLISTUNNO_LIST_TABLE,
  ADR_PRODUCTLISTUNNO_TABLE,
  ADR_TC3DETAILS_TABLE,
  ADR_TANK_DOCUMENTS_TABLE,
  ADR_PASS_CERTIFICATE_DETAILS,
} from "./table-details";
import {
  deleteBasedOnWhereIn,
  executeFullUpsert,
  executePartialUpsertIfNotExists,
  executePartialUpsertIfNotExistsWithCondition,
} from "./sql-execution";
import { getConnectionPool } from "./connection-pool";
import { Connection } from "mysql2/promise";
import { EntityConverter } from "./entity-conversion";
import { debugLog } from "./logger";
import { vinCleanser } from "../utils/cleanser";

export const techRecordDocumentConverter = (): EntityConverter<TechRecordDocument> => {
  return {
    parseRootImage: parseTechRecordDocument,
    upsertEntity: upsertTechRecords,
    deleteEntity: deleteTechRecords,
  };
};

const upsertTechRecords = async (
  techRecordDocument: TechRecordDocument
): Promise<void> => {
  debugLog(`upsertTechRecords: START`);

  const pool = await getConnectionPool();

  let vehicleId;
  const vehicleConnection = await pool.getConnection();

  try {
    await vehicleConnection.execute(
      "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED"
    );
    await vehicleConnection.beginTransaction();

    vehicleId = await upsertVehicle(vehicleConnection, techRecordDocument);

    await vehicleConnection.commit();
  } catch (err) {
    console.error(err);
    await vehicleConnection.rollback();
    throw err;
  } finally {
    vehicleConnection.release();
  }

  const techRecords = techRecordDocument.techRecord;

  if (!techRecords) {
    return;
  }

  debugLog(`upsertTechRecords: ${techRecords.length} tech records to upsert`);

  for (const techRecord of techRecords) {
    const techRecordConnection = await pool.getConnection();

    try {
      await techRecordConnection.execute(
        "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED"
      );

      debugLog(`upsertTechRecords: Upserting tech record...`);

      const makeModelId = await upsertMakeModel(
        techRecordConnection,
        techRecord
      );
      const vehicleClassId = await upsertVehicleClass(
        techRecordConnection,
        techRecord
      );
      await upsertVehicleSubclasses(
        techRecordConnection,
        vehicleClassId,
        techRecord
      );
      const createdById = await upsertIdentity(
        techRecordConnection,
        techRecord.createdById!,
        techRecord.createdByName!
      );
      const lastUpdatedById = await upsertIdentity(
        techRecordConnection,
        techRecord.lastUpdatedById!,
        techRecord.lastUpdatedByName!
      );
      const contactDetailsId = await upsertContactDetails(
        techRecordConnection,
        techRecord
      );

      await techRecordConnection.beginTransaction();

      const response = await executeFullUpsert(
        TECHNICAL_RECORD_TABLE,
        [
          vehicleId,
          techRecord.recordCompleteness,
          techRecord.createdAt,
          techRecord.lastUpdatedAt,
          makeModelId,
          techRecord.functionCode,
          techRecord.offRoad,
          techRecord.numberOfWheelsDriven,
          "" + techRecord.emissionsLimit,
          techRecord.departmentalVehicleMarker,
          techRecord.alterationMarker,
          vehicleClassId,
          techRecord.variantVersionNumber,
          techRecord.grossEecWeight,
          techRecord.trainEecWeight,
          techRecord.maxTrainEecWeight,
          contactDetailsId,
          contactDetailsId,
          contactDetailsId,
          techRecord.manufactureYear,
          techRecord.regnDate,
          techRecord.firstUseDate,
          techRecord.coifDate,
          techRecord.ntaNumber,
          techRecord.coifSerialNumber,
          techRecord.coifCertifierName,
          techRecord.approvalType,
          techRecord.approvalTypeNumber,
          techRecord.variantNumber,
          techRecord.conversionRefNo,
          techRecord.seatsLowerDeck,
          techRecord.seatsUpperDeck,
          techRecord.standingCapacity,
          techRecord.speedRestriction,
          techRecord.speedLimiterMrk,
          techRecord.tachoExemptMrk,
          techRecord.dispensations,
          techRecord.remarks,
          techRecord.reasonForCreation,
          techRecord.statusCode,
          techRecord.unladenWeight,
          techRecord.grossKerbWeight,
          techRecord.grossLadenWeight,
          techRecord.grossGbWeight,
          techRecord.grossDesignWeight,
          techRecord.trainGbWeight,
          techRecord.trainDesignWeight,
          techRecord.maxTrainGbWeight,
          techRecord.maxTrainDesignWeight,
          techRecord.maxLoadOnCoupling,
          techRecord.frameDescription,
          techRecord.tyreUseCode,
          techRecord.roadFriendly,
          techRecord.drawbarCouplingFitted,
          techRecord.euroStandard,
          techRecord.suspensionType,
          techRecord.couplingType,
          techRecord.dimensions?.length,
          techRecord.dimensions?.height,
          techRecord.dimensions?.width,
          techRecord.frontAxleTo5thWheelMin,
          techRecord.frontAxleTo5thWheelMax,
          techRecord.frontVehicleTo5thWheelCouplingMin,
          techRecord.frontVehicleTo5thWheelCouplingMax,
          techRecord.frontAxleToRearAxle,
          techRecord.rearAxleToRearTrl,
          techRecord.couplingCenterToRearAxleMin,
          techRecord.couplingCenterToRearAxleMax,
          techRecord.couplingCenterToRearTrlMin,
          techRecord.couplingCenterToRearTrlMax,
          techRecord.centreOfRearmostAxleToRearOfTrl,
          techRecord.notes,
          techRecord.purchaserDetails?.purchaserNotes,
          techRecord.manufacturerDetails?.manufacturerNotes,
          techRecord.noOfAxles,
          techRecord.brakeCode,
          techRecord.brakes?.dtpNumber,
          techRecord.brakes?.loadSensingValve,
          techRecord.brakes?.antilockBrakingSystem,
          createdById,
          lastUpdatedById,
          techRecord.updateType,
          techRecord.numberOfSeatbelts,
          techRecord.seatbeltInstallationApprovalDate,
        ],
        techRecordConnection
      );

      const techRecordId = response.rows.insertId;

      debugLog(`upsertTechRecords: Upserted tech record (ID: ${techRecordId})`);

      await upsertPsvBrakes(techRecordConnection, techRecordId, techRecord);
      await upsertAxleSpacings(techRecordConnection, techRecordId, techRecord);
      await upsertMicrofilm(techRecordConnection, techRecordId, techRecord);
      await upsertPlates(techRecordConnection, techRecordId, techRecord);
      await upsertAxles(techRecordConnection, techRecordId, techRecord);
      await upsertAuthIntoService(
        techRecordConnection,
        techRecordId,
        techRecord
      );
      await upsertAdrPassCertificateDetails(
        techRecordConnection,
        techRecordId,
        techRecord
      );

      // upsert adr-details
      if (techRecord.adrDetails) {
        debugLog(`upsertTechRecords: Upserting ADR Details...`);
        const adrResponse = await executeFullUpsert(
          ADR_DETAILS_TABLE,
          [
            techRecordId,
            techRecord.adrDetails.vehicleDetails?.type,
            techRecord.adrDetails.vehicleDetails?.approvalDate,
            techRecord.adrDetails.listStatementApplicable,
            techRecord.adrDetails.batteryListNumber,
            techRecord.adrDetails.declarationsSeen,
            techRecord.adrDetails.brakeDeclarationsSeen,
            techRecord.adrDetails.brakeDeclarationIssuer,
            techRecord.adrDetails.brakeEndurance,
            techRecord.adrDetails.weight,
            techRecord.adrDetails.compatibilityGroupJ,
            // techRecord.adrDetails.dangerousGoods,
            techRecord.adrDetails.applicantDetails?.name,
            techRecord.adrDetails.applicantDetails?.street,
            techRecord.adrDetails.applicantDetails?.town,
            techRecord.adrDetails.applicantDetails?.city,
            techRecord.adrDetails.applicantDetails?.postcode,
            techRecord.adrDetails.adrTypeApprovalNo,
            techRecord.adrDetails.adrCertificateNotes,
            techRecord.adrDetails.tank?.tankDetails?.tankManufacturer,
            techRecord.adrDetails.tank?.tankDetails?.yearOfManufacture,
            techRecord.adrDetails.tank?.tankDetails?.tankCode,
            techRecord.adrDetails.tank?.tankDetails?.specialProvisions,
            techRecord.adrDetails.tank?.tankDetails?.tankManufacturerSerialNo,
            techRecord.adrDetails.tank?.tankDetails?.tankTypeAppNo,
            techRecord.adrDetails.tank?.tankDetails?.tc2Details?.tc2Type,
            techRecord.adrDetails.tank?.tankDetails?.tc2Details
              ?.tc2IntermediateApprovalNo,
            techRecord.adrDetails.tank?.tankDetails?.tc2Details
              ?.tc2IntermediateExpiryDate,
            techRecord.adrDetails.tank?.tankDetails?.tankStatement?.substancesPermitted,
            // techRecord.adrDetails.tank?.tankDetails?.tankStatement?.select,
            techRecord.adrDetails.tank?.tankDetails?.tankStatement?.statement,
            techRecord.adrDetails.tank?.tankDetails?.tankStatement?.productListRefNo,
            techRecord.adrDetails.tank?.tankDetails?.tankStatement?.productList,
            techRecord.adrDetails.m145Statement,
            // techRecord.adrDetails.newCertificateRequested,
          ],
          techRecordConnection
        );

        const adrDetailsId = adrResponse.rows.insertId;

        debugLog(
          `upsertTechRecords: Upserted ADR Details (ID: ${adrDetailsId})`
        );

        await upsertAdrMemosApply(
          techRecordConnection,
          adrDetailsId,
          techRecord
        );
        await upsertAdrPermittedDangerousGoods(
          techRecordConnection,
          adrDetailsId,
          techRecord
        );
        await upsertAdrProductListUnNo(
          techRecordConnection,
          adrDetailsId,
          techRecord
        );
        await upsertAdrTc3Details(
          techRecordConnection,
          adrDetailsId,
          techRecord
        );
        await upsertAdrAdditionalExaminerNotes(
          techRecordConnection,
          adrDetailsId,
          techRecord
        );
        await upsertAdrAdditionalNotesNumber(
          techRecordConnection,
          adrDetailsId,
          techRecord
        );
        // await upsertAdrTankDocuments(
        //   techRecordConnection,
        //   adrDetailsId,
        //   techRecord
        // );

        debugLog(`upsertTechRecords: Upsert ADR Details END`);
      }

      await techRecordConnection.commit();
    } catch (err) {
      console.error(err);
      await techRecordConnection.rollback();
      throw err;
    } finally {
      techRecordConnection.release();
    }
  }

  debugLog(`upsertTechRecords: END`);

  return;
};

const deleteTechRecords = async (
  techRecordDocument: TechRecordDocument
): Promise<void> => {
  throw new Error("deleting tech record documents is not implemented yet");
};

const upsertVehicle = async (
  connection: Connection,
  techRecordDocument: TechRecordDocument
): Promise<number> => {
  debugLog(`upsertTechRecords: Upserting vehicle...`);

  const response = await executeFullUpsert(
    VEHICLE_TABLE,
    [
      techRecordDocument.systemNumber,
      vinCleanser(techRecordDocument.vin),
      techRecordDocument.primaryVrm,
      techRecordDocument.trailerId,
      new Date().toISOString().substring(0, 23),
    ],
    connection
  );

  debugLog(
    `upsertTechRecords: Upserted vehicle (ID: ${response.rows.insertId})`
  );

  return response.rows.insertId;
};

const upsertMakeModel = async (
  connection: Connection,
  techRecord: TechRecord
): Promise<number> => {
  debugLog(`upsertTechRecords: Upserting make-model...`);

  const response = await executePartialUpsertIfNotExists(
    MAKE_MODEL_TABLE,
    [
      techRecord.make,
      techRecord.model,
      techRecord.chassisMake,
      techRecord.chassisModel,
      techRecord.bodyMake,
      techRecord.bodyModel,
      techRecord.modelLiteral,
      techRecord.bodyType?.code,
      techRecord.bodyType?.description,
      techRecord.fuelPropulsionSystem,
      null, // intentional hack until JSON path of make-model dtpCode is documented
    ].fingerprintCleanser(),
    connection
  );

  debugLog(
    `upsertTechRecords: Upserted make-model (ID ${response.rows.insertId})`
  );

  return response.rows.insertId;
};

const upsertVehicleClass = async (
  connection: Connection,
  techRecord: TechRecord
): Promise<number> => {
  debugLog(`upsertTechRecords: Upserting vehicle class...`);

  const response = await executePartialUpsertIfNotExists(
    VEHICLE_CLASS_TABLE,
    [
      techRecord.vehicleClass?.code,
      techRecord.vehicleClass?.description,
      techRecord.vehicleType,
      techRecord.vehicleSize,
      techRecord.vehicleConfiguration,
      techRecord.euVehicleCategory,
    ].fingerprintCleanser(),
    connection
  );

  debugLog(
    `upsertTechRecords: Upserted vehicle class (ID: ${response.rows.insertId})`
  );

  return response.rows.insertId;
};

const upsertVehicleSubclasses = async (
  connection: Connection,
  vehicleClassId: number,
  techRecord: TechRecord
): Promise<void> => {
  debugLog(`upsertTechRecords: Upserting vehicle subclasses...`);

  if (!techRecord.vehicleSubclass) {
    debugLog(`upsertTechRecords: no vehicle subclasses present`);
    return;
  }

  debugLog(
    `upsertTechRecords: ${techRecord.vehicleSubclass.length} vehicle subclasses to upsert`
  );

  for (const vehicleSubclass of techRecord.vehicleSubclass) {
    const response = await executePartialUpsertIfNotExists(
      VEHICLE_SUBCLASS_TABLE,
      [vehicleClassId, vehicleSubclass].fingerprintCleanser(),
      connection
    );

    debugLog(
      `upsertTechRecords: Upserted vehicle subclass (ID: ${response.rows.insertId}`
    );
  }

  return;
};

const upsertIdentity = async (
  connection: Connection,
  id: string,
  name: string
): Promise<number> => {
  debugLog(`upsertTechRecords: Upserting identity (${id} ---> ${name})...`);

  const response = await executePartialUpsertIfNotExists(
    IDENTITY_TABLE,
    [id, name].fingerprintCleanser(),
    connection
  );

  debugLog(
    `upsertTechRecords: Upserted identity  (ID: ${response.rows.insertId})`
  );

  return response.rows.insertId;
};

const upsertContactDetails = async (
  connection: Connection,
  techRecord: TechRecord
): Promise<number> => {
  debugLog(`upsertTechRecords: Upserting contact details...`);

  const response = await executePartialUpsertIfNotExists(
    CONTACT_DETAILS_TABLE,
    [
      techRecord.applicantDetails?.name,
      techRecord.applicantDetails?.address1,
      techRecord.applicantDetails?.address2,
      techRecord.applicantDetails?.postTown,
      techRecord.applicantDetails?.address3,
      techRecord.applicantDetails?.postCode,
      techRecord.applicantDetails?.emailAddress,
      techRecord.applicantDetails?.telephoneNumber,
      getFaxNumber(techRecord),
    ].fingerprintCleanser(),
    connection
  );

  debugLog(
    `upsertTechRecords: Upserted contact details (ID: ${response.rows.insertId})`
  );

  return response.rows.insertId;
};

const upsertPsvBrakes = async (
  connection: Connection,
  techRecordId: string,
  techRecord: TechRecord
): Promise<void> => {
  debugLog(
    `upsertTechRecords: Upserting PSV brakes (tech-record-id: ${techRecordId})...`
  );

  const response = await executeFullUpsert(
    PSV_BRAKES_TABLE,
    [
      techRecordId,
      techRecord.brakes?.brakeCodeOriginal,
      techRecord.brakes?.brakeCode,
      techRecord.brakes?.dataTrBrakeOne,
      techRecord.brakes?.dataTrBrakeTwo,
      techRecord.brakes?.dataTrBrakeThree,
      techRecord.brakes?.retarderBrakeOne,
      techRecord.brakes?.retarderBrakeTwo,
      techRecord.brakes?.brakeForceWheelsNotLocked?.serviceBrakeForceA,
      techRecord.brakes?.brakeForceWheelsNotLocked?.secondaryBrakeForceA,
      techRecord.brakes?.brakeForceWheelsNotLocked?.parkingBrakeForceA,
      techRecord.brakes?.brakeForceWheelsUpToHalfLocked?.serviceBrakeForceB,
      techRecord.brakes?.brakeForceWheelsUpToHalfLocked?.secondaryBrakeForceB,
      techRecord.brakes?.brakeForceWheelsUpToHalfLocked?.parkingBrakeForceB,
    ],
    connection
  );

  debugLog(
    `upsertTechRecords: Upserted PSV brakes (tech-record-id: ${techRecordId}, ID: ${response.rows.insertId})`
  );

  return;
};

const upsertAxleSpacings = async (
  connection: Connection,
  techRecordId: string,
  techRecord: TechRecord
): Promise<void> => {
  debugLog(
    `upsertTechRecords: Upserting axle spacings (tech-record-id: ${techRecordId})...`
  );

  if (!techRecord.dimensions?.axleSpacing) {
    debugLog(`upsertTechRecords: no axle spacings present`);
    return;
  }

  debugLog(
    `upsertTechRecords: ${techRecord.dimensions.axleSpacing.length} axle spacings to upsert`
  );

  for (const axleSpacing of techRecord.dimensions.axleSpacing) {
    const response = await executeFullUpsert(
      AXLE_SPACING_TABLE,
      [techRecordId, axleSpacing.axles, axleSpacing.value],
      connection
    );

    debugLog(
      `upsertTechRecords: Upserted axle spacing (tech-record-id: ${techRecordId}, ID: ${response.rows.insertId})`
    );
  }

  return;
};

const upsertMicrofilm = async (
  connection: Connection,
  techRecordId: string,
  techRecord: TechRecord
): Promise<void> => {
  debugLog(
    `upsertTechRecords: Upserting microfilm (tech-record-id: ${techRecordId})...`
  );

  const response = await executeFullUpsert(
    MICROFILM_TABLE,
    [
      techRecordId,
      techRecord.microfilm?.microfilmDocumentType,
      techRecord.microfilm?.microfilmRollNumber,
      techRecord.microfilm?.microfilmSerialNumber,
    ],
    connection
  );

  debugLog(
    `upsertTechRecords: Upserted microfilm (tech-record-id: ${techRecordId}, ID: ${response.rows.insertId})`
  );

  return;
};

const upsertPlates = async (
  connection: Connection,
  techRecordId: any,
  techRecord: TechRecord
): Promise<void> => {
  debugLog(
    `upsertTechRecords: Upserting plates (tech-record-id: ${techRecordId})...`
  );

  if (!techRecord.plates) {
    debugLog(`upsertTechRecords: no plates present`);
    return;
  }

  debugLog(`upsertTechRecords: ${techRecord.plates.length} plates to upsert`);

  for (const plate of techRecord.plates) {
    const response = await executeFullUpsert(
      PLATE_TABLE,
      [
        techRecordId,
        plate.plateSerialNumber,
        plate.plateIssueDate,
        plate.plateReasonForIssue,
        plate.plateIssuer,
      ],
      connection
    );

    debugLog(
      `upsertTechRecords: Upserted plate (tech-record-id: ${techRecordId}, ID: ${response.rows.insertId})`
    );
  }

  return;
};

const upsertAxles = async (
  connection: Connection,
  techRecordId: any,
  techRecord: TechRecord
): Promise<void> => {
  debugLog(
    `upsertTechRecords: Upserting axles (tech-record-id: ${techRecordId})...`
  );

  if (!techRecord.axles) {
    debugLog(`upsertTechRecords: no axles present`);
    return;
  }

  for (const axle of techRecord.axles) {
    const tyreUpsertResponse = await executePartialUpsertIfNotExists(
      TYRE_TABLE,
      [
        axle.tyres?.tyreSize,
        axle.tyres?.plyRating,
        axle.tyres?.fitmentCode,
        axle.tyres?.dataTrAxles,
        axle.tyres?.speedCategorySymbol,
        axle.tyres?.tyreCode,
      ].fingerprintCleanser(),
      connection
    );

    const tyreId = tyreUpsertResponse.rows.insertId;

    debugLog(
      `upsertTechRecords: Upserted axle tyre (tech-record-id: ${techRecordId}, ID: ${tyreId})`
    );

    const axleUpsertResponse = await executeFullUpsert(
      AXLES_TABLE,
      [
        techRecordId,
        tyreId,
        axle.axleNumber,
        axle.parkingBrakeMrk,
        axle.weights?.kerbWeight,
        axle.weights?.ladenWeight,
        axle.weights?.gbWeight,
        axle.weights?.eecWeight,
        axle.weights?.designWeight,
        axle.brakes?.brakeActuator,
        axle.brakes?.leverLength,
        axle.brakes?.springBrakeParking,
      ],
      connection
    );

    debugLog(
      `upsertTechRecords: Upserted axle (tech-record-id: ${techRecordId}, ID: ${axleUpsertResponse.rows.insertId})`
    );
  }

  return;
};

const upsertAuthIntoService = async (
  connection: Connection,
  techRecordId: string,
  techRecord: TechRecord
): Promise<void> => {
  debugLog(
    `upsertTechRecords: Upserting authIntoService (tech-record-id: ${techRecordId})...`
  );

  if (!techRecord.authIntoService) {
    debugLog(`upsertTechRecords: no authIntoService present`);
    await deleteBasedOnWhereIn(
      AUTH_INTO_SERVICE_TABLE.tableName,
      "technical_record_id",
      [techRecordId],
      connection
    );
    return;
  }

  const response = await executeFullUpsert(
    AUTH_INTO_SERVICE_TABLE,
    [
      techRecordId,
      techRecord.authIntoService?.cocIssueDate,
      techRecord.authIntoService?.dateAuthorised,
      techRecord.authIntoService?.datePending,
      techRecord.authIntoService?.dateReceived,
      techRecord.authIntoService?.dateRejected,
    ],
    connection
  );

  debugLog(
    `upsertTechRecords: Upserted authIntoService (tech-record-id: ${techRecordId}, ID: ${response.rows.insertId})`
  );
};

const upsertAdrMemosApply = async (
  connection: Connection,
  adrDetailsId: string,
  techRecord: TechRecord
): Promise<void> => {
  if (techRecord.adrDetails?.memosApply) {
    debugLog(
      `upsertTechRecords: Upserting ADR memos_apply (adr-details-id: ${adrDetailsId})...`
    );

    for (const memo of techRecord.adrDetails?.memosApply) {
      const response = await executeFullUpsert(
        ADR_MEMOS_APPLY_TABLE,
        [adrDetailsId, memo],
        connection
      );

      debugLog(
        `upsertTechRecords: Upserted ADR memos-apply (adr-details-id: ${adrDetailsId}, ID: ${response.rows.insertId})`
      );
    }
  }
  return;
};

const upsertAdrDangerousGoodsList = async (
  connection: Connection,
  dangerousGoodsName: string
): Promise<number> => {
  debugLog(
    `upsertTechRecords: Selecting/Upserting adr_dangerous_goods_list...`
  );

  const response = await executePartialUpsertIfNotExistsWithCondition(
    ADR_DANGEROUS_GOODS_LIST_TABLE,
    { name: dangerousGoodsName },
    connection
  );

  debugLog(
    `upsertTechRecords: Selected adr_dangerous_goods_list (ID ${response.rows.insertId})`
  );

  return response.rows.insertId;
};

const upsertAdrPermittedDangerousGoods = async (
  connection: Connection,
  adrDetailsId: string,
  techRecord: TechRecord
): Promise<void> => {
  if (techRecord.adrDetails?.permittedDangerousGoods) {
    debugLog(
      `upsertTechRecords: Upserting ADR permitted_dangerous_goods (adr-details-id: ${adrDetailsId})...`
    );

    for (const permittedDangerousGoods of techRecord.adrDetails
      ?.permittedDangerousGoods) {
      const permittedDangerousGoodsId = await upsertAdrDangerousGoodsList(
        connection,
        permittedDangerousGoods
      );

      const response = await executeFullUpsert(
        ADR_PERMITTED_DANGEROUS_GOODS_TABLE,
        [adrDetailsId, permittedDangerousGoodsId],
        connection
      );

      debugLog(
        `upsertTechRecords: Upserted ADR permitted_dangerous_goods (adr-details-id: ${adrDetailsId}, ID: ${response.rows.insertId})`
      );
    }
  }
  return;
};

const upsertAdrProductListUnNoList = async (
  connection: Connection,
  productListUnNo: string
): Promise<number> => {
  debugLog(`upsertTechRecords: Upserting adr_productListUnNo_list...`);

  const response = await executePartialUpsertIfNotExistsWithCondition(
    ADR_PRODUCTLISTUNNO_LIST_TABLE,
    { name: productListUnNo },
    connection
  );

  debugLog(
    `upsertTechRecords: Upserted adr_productListUnNo_list (ID ${response.rows.insertId})`
  );

  return response.rows.insertId;
};

const upsertAdrProductListUnNo = async (
  connection: Connection,
  adrDetailsId: string,
  techRecord: TechRecord
): Promise<void> => {
  if (techRecord.adrDetails?.tank?.tankDetails?.tankStatement?.productListUnNo) {
    debugLog(
      `upsertTechRecords: Upserting ADR tankStatement productListUnNo (adr-details-id: ${adrDetailsId})...`
    );

    for (const productListUnNo of techRecord.adrDetails?.tank?.tankDetails?.tankStatement
      ?.productListUnNo) {
      const productListUnNoId = await upsertAdrProductListUnNoList(
        connection,
        productListUnNo
      );

      const response = await executeFullUpsert(
        ADR_PRODUCTLISTUNNO_TABLE,
        [adrDetailsId, productListUnNoId],
        connection
      );

      debugLog(
        `upsertTechRecords: Upserted ADR tankStatement productListUnNo (adr-details-id: ${adrDetailsId}, ID: ${response.rows.insertId})`
      );
    }
  }
  return;
};

const upsertAdrTc3Details = async (
  connection: Connection,
  adrDetailsId: string,
  techRecord: TechRecord
): Promise<void> => {
  if (techRecord.adrDetails?.tank?.tankDetails?.tc3Details) {
    debugLog(
      `upsertTechRecords: Upserting ADR tc3Details (adr-details-id: ${adrDetailsId})...`
    );

    for (const tc3Details of techRecord.adrDetails?.tank?.tankDetails
      ?.tc3Details) {
      const response = await executeFullUpsert(
        ADR_TC3DETAILS_TABLE,
        [
          adrDetailsId,
          tc3Details.tc3Type,
          tc3Details.tc3PeriodicNumber,
          tc3Details.tc3PeriodicExpiryDate,
        ],
        connection
      );

      debugLog(
        `upsertTechRecords: Upserted ADR tc3Details (adr-details-id: ${adrDetailsId}, ID: ${response.rows.insertId})`
      );
    }
  }
  return;
};

const upsertAdrAdditionalExaminerNotes = async (
  connection: Connection,
  adrDetailsId: string,
  techRecord: TechRecord
): Promise<void> => {
  if (techRecord.adrDetails?.additionalExaminerNotes) {
    debugLog(
      `upsertTechRecords: Upserting ADR additionalExaminerNotes (adr-details-id: ${adrDetailsId})...`
    );

    for (const additionalExaminerNotes of techRecord.adrDetails
      ?.additionalExaminerNotes) {
      const response = await executeFullUpsert(
        ADR_ADDITIONAL_EXAMINER_NOTES_TABLE,
        [
          adrDetailsId,
          additionalExaminerNotes.note,
          additionalExaminerNotes.createdAtDate,
          additionalExaminerNotes.lastUpdatedBy,
        ],
        connection
      );

      debugLog(
        `upsertTechRecords: Upserted ADR additionalExaminerNotes (adr-details-id: ${adrDetailsId}, ID: ${response.rows.insertId})`
      );
    }
  }
  return;
};

const upsertAdrAdditionalNotesNumber = async (
  connection: Connection,
  adrDetailsId: string,
  techRecord: TechRecord
): Promise<void> => {
  if (techRecord.adrDetails?.additionalNotes?.number) {
    debugLog(
      `upsertTechRecords: Upserting ADR additional_notes_number (adr-details-id: ${adrDetailsId})...`
    );

    for (const additionalNotesNumber of techRecord.adrDetails?.additionalNotes
      ?.number) {
      const response = await executeFullUpsert(
        ADR_ADDITIONAL_NOTES_NUMBER_TABLE,
        [additionalNotesNumber, adrDetailsId],
        connection
      );

      debugLog(
        `upsertTechRecords: Upserted ADR additional_notes_number (adr-details-id: ${adrDetailsId}, ID: ${response.rows.insertId})`
      );
    }
  }
  return;
};

const upsertAdrTankDocuments = async (
  connection: Connection,
  adrDetailsId: string,
  techRecord: TechRecord
): Promise<void> => {
  if (techRecord.adrDetails?.documents) {
    debugLog(
      `upsertTechRecords: Upserting ADR tank documents (adr-details-id: ${adrDetailsId})...`
    );

    for (const documents of techRecord.adrDetails?.documents) {
      const response = await executeFullUpsert(
        ADR_TANK_DOCUMENTS_TABLE,
        [adrDetailsId, documents],
        connection
      );

      debugLog(
        `upsertTechRecords: Upserted ADR tank documents (adr-details-id: ${adrDetailsId}, ID: ${response.rows.insertId})`
      );
    }
  }
  return;
};

const upsertAdrPassCertificateDetails = async (
  connection: Connection,
  techRecordId: string,
  techRecord: TechRecord
): Promise<void> => {
  if (techRecord.adrPassCertificateDetails) {
    debugLog(
      `upsertTechRecords: Upserting ADR Pass Certificate Details (tech-record-id: ${techRecordId})...`
    );

    for (const adrPassCertificateDetails of techRecord.adrPassCertificateDetails) {
      const response = await executeFullUpsert(
        ADR_PASS_CERTIFICATE_DETAILS,
        [
          techRecordId,
          adrPassCertificateDetails.createdByName,
          adrPassCertificateDetails.certificateType,
          adrPassCertificateDetails.generatedTimestamp,
          adrPassCertificateDetails.certificateId,
        ],
        connection
      );

      debugLog(
        `upsertTechRecords: Upserted ADR Pass Certificate Details (tech-record-id: ${techRecordId}, ID: ${response.rows.insertId})`
      );
    }
  }
  return;
};
