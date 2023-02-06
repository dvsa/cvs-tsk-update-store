export interface TechRecordUpsertResult {
    vehicleId: number;
    techRecordId: number;
    makeModelId: number;
    vehicleClassId: number;
    vehicleSubclassIds: number[];
    createdById: number;
    lastUpdatedById: number;
    contactDetailsId: number;
    psvBrakesId: number;
    axleSpacingIds: number[];
    microfilmId: number;
    plateIds: number[];
    axleIds: number[];
}

export interface TestResultUpsertResult {
    vehicleId: number;
    testResultRecordId: number;
    testStationId: number;
    testerId: number;
    vehicleClassId: number;
    vehicleSubclassIds: number[];
    preparerId: number;
    createdById: number;
    lastUpdatedById: number;
    fuelEmissionId: number;
    testTypeId: number;
    defectIds: number[];
    customDefectIds: number[];
}
