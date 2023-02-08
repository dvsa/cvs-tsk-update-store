export interface TableDetails {
    tableName: string;
    columnNames: string[];
    primaryKeyColumnName?: string;
}

export const VEHICLE_TABLE: TableDetails = {
    tableName: "vehicle",
    columnNames: [
        "system_number",
        "vin",
        "vrm_trm",
        "trailer_id",
        "createdAt",
    ]
};

export const MAKE_MODEL_TABLE: TableDetails = {
    tableName: "make_model",
    columnNames: [
        "make",
        "model",
        "chassisMake",
        "chassisModel",
        "bodyMake",
        "bodyModel",
        "modelLiteral",
        "bodyTypeCode",
        "bodyTypeDescription",
        "fuelPropulsionSystem",
        "dtpCode",
    ]
};

export const VEHICLE_CLASS_TABLE: TableDetails = {
    tableName: "vehicle_class",
    columnNames: [
        "code",
        "description",
        "vehicleType",
        "vehicleSize",
        "vehicleConfiguration",
        "euVehicleCategory",
    ]
};

export const VEHICLE_SUBCLASS_TABLE: TableDetails = {
    tableName: "vehicle_subclass",
    columnNames: [
        "vehicle_class_id",
        "subclass",
    ]
};

export const IDENTITY_TABLE: TableDetails = {
    tableName: "identity",
    columnNames: [
        "identityId",
        "name",
    ]
};

export const CONTACT_DETAILS_TABLE: TableDetails = {
    tableName: "contact_details",
    columnNames: [
        "name",
        "address1",
        "address2",
        "postTown",
        "address3",
        "postCode",
        "emailAddress",
        "telephoneNumber",
        "faxNumber",
    ]
};

export const TECHNICAL_RECORD_TABLE: TableDetails = {
    tableName: "technical_record",
    columnNames: [
        "vehicle_id",
        "recordCompleteness",
        "createdAt",
        "lastUpdatedAt",
        "make_model_id",
        "functionCode",
        "offRoad",
        "numberOfWheelsDriven",
        "emissionsLimit",
        "departmentalVehicleMarker",
        "alterationMarker",
        "vehicle_class_id",
        "variantVersionNumber",
        "grossEecWeight",
        "trainEecWeight",
        "maxTrainEecWeight",
        "applicant_detail_id",
        "purchaser_detail_id",
        "manufacturer_detail_id",
        "manufactureYear",
        "regnDate",
        "firstUseDate",
        "coifDate",
        "ntaNumber",
        "coifSerialNumber",
        "coifCertifierName",
        "approvalType",
        "approvalTypeNumber",
        "variantNumber",
        "conversionRefNo",
        "seatsLowerDeck",
        "seatsUpperDeck",
        "standingCapacity",
        "speedRestriction",
        "speedLimiterMrk",
        "tachoExemptMrk",
        "dispensations",
        "remarks",
        "reasonForCreation",
        "statusCode",
        "unladenWeight",
        "grossKerbWeight",
        "grossLadenWeight",
        "grossGbWeight",
        "grossDesignWeight",
        "trainGbWeight",
        "trainDesignWeight",
        "maxTrainGbWeight",
        "maxTrainDesignWeight",
        "maxLoadOnCoupling",
        "frameDescription",
        "tyreUseCode",
        "roadFriendly",
        "drawbarCouplingFitted",
        "euroStandard",
        "suspensionType",
        "couplingType",
        "length",
        "height",
        "width",
        "frontAxleTo5thWheelMin",
        "frontAxleTo5thWheelMax",
        "frontAxleTo5thWheelCouplingMin",
        "frontAxleTo5thWheelCouplingMax",
        "frontAxleToRearAxle",
        "rearAxleToRearTrl",
        "couplingCenterToRearAxleMin",
        "couplingCenterToRearAxleMax",
        "couplingCenterToRearTrlMin",
        "couplingCenterToRearTrlMax",
        "centreOfRearmostAxleToRearOfTrl",
        "notes",
        "purchaserNotes",
        "manufacturerNotes",
        "noOfAxles",
        "brakeCode",
        "brakes_dtpNumber",
        "brakes_loadSensingValve",
        "brakes_antilockBrakingSystem",
        "createdBy_Id",
        "lastUpdatedBy_Id",
        "updateType",
        "numberOfSeatbelts",
        "seatbeltInstallationApprovalDate",
    ]
};

export const PSV_BRAKES_TABLE: TableDetails = {
    tableName: "psv_brakes",
    columnNames: [
        "technical_record_id",
        "brakeCodeOriginal",
        "brakeCode",
        "dataTrBrakeOne",
        "dataTrBrakeTwo",
        "dataTrBrakeThree",
        "retarderBrakeOne",
        "retarderBrakeTwo",
        "serviceBrakeForceA",
        "secondaryBrakeForceA",
        "parkingBrakeForceA",
        "serviceBrakeForceB",
        "secondaryBrakeForceB",
        "parkingBrakeForceB",
    ]
};

export const AXLE_SPACING_TABLE: TableDetails = {
    tableName: "axle_spacing",
    columnNames: [
        "technical_record_id",
        "axles",
        "value",
    ]
};

export const MICROFILM_TABLE: TableDetails = {
    tableName: "microfilm",
    columnNames: [
        "technical_record_id",
        "microfilmDocumentType",
        "microfilmRollNumber",
        "microfilmSerialNumber",
    ]
};

export const PLATE_TABLE: TableDetails = {
    tableName: "plate",
    columnNames: [
        "technical_record_id",
        "plateSerialNumber",
        "plateIssueDate",
        "plateReasonForIssue",
        "plateIssuer",
    ]
};

export const AXLES_TABLE: TableDetails = {
    tableName: "axles",
    columnNames: [
        "technical_record_id",
        "tyre_id",
        "axleNumber",
        "parkingBrakeMrk",
        "kerbWeight",
        "ladenWeight",
        "gbWeight",
        "eecWeight",
        "designWeight",
        "brakeActuator",
        "leverLength",
        "springBrakeParking",
    ]
};

export const TYRE_TABLE: TableDetails = {
    tableName: "tyre",
    columnNames: [
        "tyreSize",
        "plyRating",
        "fitmentCode",
        "dataTrAxles",
        "speedCategorySymbol",
        "tyreCode",
    ]
};

export const TEST_STATION_TABLE: TableDetails = {
    tableName: "test_station",
    columnNames: [
        "pNumber",
        "name",
        "type",
    ]
};

export const TESTER_TABLE: TableDetails = {
    tableName: "tester",
    columnNames: [
        "staffId",
        "name",
        "email_address",
    ]
};

export const FUEL_EMISSION_TABLE: TableDetails = {
    tableName: "fuel_emission",
    columnNames: [
        "modTypeCode",
        "description",
        "emissionStandard",
        "fuelType",
    ]
};

export const TEST_TYPE_TABLE: TableDetails = {
    tableName: "test_type",
    columnNames: [
        "testTypeClassification",
        "testTypeName",
    ]
};

export const PREPARER_TABLE: TableDetails = {
    tableName: "preparer",
    columnNames: [
        "preparerId",
        "name",
    ]
};

export const DEFECTS_TABLE: TableDetails = {
    tableName: "defect",
    columnNames: [
        "imNumber",
        "imDescription",
        "itemNumber",
        "itemDescription",
        "deficiencyRef",
        "deficiencyId",
        "deficiencySubId",
        "deficiencyCategory",
        "deficiencyText",
        "stdForProhibition",
    ]
};

export const LOCATION_TABLE: TableDetails = {
    tableName: "location",
    columnNames: [
        "vertical",
        "horizontal",
        "lateral",
        "longitudinal",
        "rowNumber",
        "seatNumber",
        "axleNumber",
    ]
};

export const TEST_DEFECT_TABLE: TableDetails = {
    tableName: "test_defect",
    columnNames: [
        "test_result_id",
        "defect_id",
        "location_id",
        "notes",
        "prs",
        "prohibitionIssued",
    ]
};

export const CUSTOM_DEFECT_TABLE: TableDetails = {
    tableName: "custom_defect",
    columnNames: [
        "test_result_id",
        "referenceNumber",
        "defectName",
        "defectNotes",
    ]
};

export const TEST_RESULT_TABLE: TableDetails = {
    tableName: "test_result",
    columnNames: [
        "vehicle_id",
        "fuel_emission_id",
        "test_station_id",
        "tester_id",
        "preparer_id",
        "vehicle_class_id",
        "test_type_id",
        "testResultId",
        "testStatus",
        "reasonForCancellation",
        "numberOfSeats",
        "odometerReading",
        "odometerReadingUnits",
        "countryOfRegistration",
        "noOfAxles",
        "regnDate",
        "firstUseDate",
        "createdAt",
        "lastUpdatedAt",
        "testCode",
        "testNumber",
        "certificateNumber",
        "secondaryCertificateNumber",
        "testExpiryDate",
        "testAnniversaryDate",
        "testTypeStartTimestamp",
        "testTypeEndTimestamp",
        "numberOfSeatbeltsFitted",
        "lastSeatbeltInstallationCheckDate",
        "seatbeltInstallationCheckDate",
        "testResult",
        "reasonForAbandoning",
        "additionalNotesRecorded",
        "additionalCommentsForAbandon",
        "particulateTrapFitted",
        "particulateTrapSerialNumber",
        "modificationTypeUsed",
        "smokeTestKLimitApplied",
        "createdBy_Id",
        "lastUpdatedBy_Id"
    ]
};

export const allTables = (): TableDetails[] => {
    return [
        VEHICLE_TABLE,
        MAKE_MODEL_TABLE,
        VEHICLE_CLASS_TABLE,
        VEHICLE_SUBCLASS_TABLE,
        IDENTITY_TABLE,
        CONTACT_DETAILS_TABLE,
        TECHNICAL_RECORD_TABLE,
        PSV_BRAKES_TABLE,
        AXLE_SPACING_TABLE,
        MICROFILM_TABLE,
        PLATE_TABLE,
        AXLES_TABLE,
        TYRE_TABLE,
        TEST_STATION_TABLE,
        TESTER_TABLE,
        FUEL_EMISSION_TABLE,
        TEST_TYPE_TABLE,
        PREPARER_TABLE,
        DEFECTS_TABLE,
        LOCATION_TABLE,
        TEST_DEFECT_TABLE,
        CUSTOM_DEFECT_TABLE,
        TEST_RESULT_TABLE,
    ];
};
