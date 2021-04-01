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
        "recordCompleteness",
        "createdAt",
        "lastUpdatedAt",
        "functionCode",
        "offRoad",
        "numberOfWheelsDriven",
        "emissionsLimit",
        "departmentalVehicleMarker",
        "alterationMarker",
        "variantVersionNumber",
        "grossEecWeight",
        "trainEecWeight",
        "maxTrainEecWeight",
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
        "updateType",
        "numberOfSeatbelts",
        "seatbeltInstallationApprovalDate",
        "vehicle_id",
        "make_model_id",
        "vehicle_class_id",
        "applicant_detail_id",
        "purchaser_detail_id",
        "manufacturer_detail_id",
        "createdBy_Id",
        "lastUpdatedBy_Id",
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
