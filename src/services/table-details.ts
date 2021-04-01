export interface TableDetails {
    tableName: string;
    columnNames: string[];
}

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
