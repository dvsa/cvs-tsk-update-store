import {
    deleteBasedOnWhereIn,
    executeFullUpsert,
    executePartialUpsert,
    executePartialUpsertIfNotExists,
    selectRecordIds
} from "../../../src/services/sql-execution";
import {executeSql} from "../../../src/services/connection-pool";
import {CUSTOM_DEFECT_TABLE, TECHNICAL_RECORD_TABLE} from "../../../src/services/table-details";
import {
    generateDeleteBasedOnWhereIn,
    generateFullUpsertSql,
    generatePartialUpsertSql,
    generateSelectRecordIds,
    generateSelectSql
} from "../../../src/services/sql-generation";

describe("executePartialUpsert()", () => {
    it("should call partial upsert SQL generation", () => {
        (generatePartialUpsertSql as jest.Mock) = jest.fn().mockReturnValue("SELECT 1");

        (executeSql as jest.Mock) = jest.fn().mockResolvedValue({
            rows: [],
            fields: []
        });

        // @ts-ignore
        executePartialUpsert(TECHNICAL_RECORD_TABLE, [], undefined);

        expect(executeSql).toHaveBeenCalledTimes(1);
        expect(generatePartialUpsertSql).toHaveBeenCalledTimes(1);
        expect(executeSql).toHaveBeenCalledWith("SELECT 1", [], undefined);
    });
});

describe("executeFullUpsert()", () => {
    it("should call partial upsert SQL generation", () => {
        (generateFullUpsertSql as jest.Mock) = jest.fn().mockReturnValue("SELECT 1");

        (executeSql as jest.Mock) = jest.fn().mockResolvedValue({
            rows: [],
            fields: []
        });

        // @ts-ignore
        executeFullUpsert(TECHNICAL_RECORD_TABLE, [], undefined);

        expect(executeSql).toHaveBeenCalledTimes(1);
        expect(generateFullUpsertSql).toHaveBeenCalledTimes(1);
        expect(executeSql).toHaveBeenCalledWith("SELECT 1", [], undefined);
    });
});

describe("executePartialUpsertIfNotExists()", () => {
    it("should call partial upsert SQL generation if no row exists", () => {
        (generateSelectSql as jest.Mock) = jest.fn().mockReturnValue("SELECT 1");
        (generatePartialUpsertSql as jest.Mock) = jest.fn().mockReturnValue("INSERT INTO table_name () VALUES () ON DUPLICATE KEY");

        (executeSql as jest.Mock) = jest.fn()
        .mockResolvedValue({
                rows: [{column: 1}],
                fields: []});
        // @ts-ignore
        executePartialUpsertIfNotExists(TECHNICAL_RECORD_TABLE, [], undefined);

        expect(executeSql).toHaveBeenCalledTimes(1);
        expect(executeSql).toHaveBeenCalledWith("SELECT 1", [], undefined);
        expect(generateSelectSql).toHaveBeenCalledTimes(1);
    });

    it("should call partial upsert SQL generation if row exists", () => {
        (generateSelectSql as jest.Mock) = jest.fn().mockReturnValue("SELECT 1");
        (generatePartialUpsertSql as jest.Mock) = jest.fn().mockReturnValue("INSERT INTO table_name () VALUES () ON DUPLICATE KEY");

        (executeSql as jest.Mock) = jest.fn()
        .mockResolvedValueOnce({
                rows: [],
                fields: []})
        .mockResolvedValue({
                rows: [{column: 1}],
                fields: []
        });
        // @ts-ignore
        executePartialUpsertIfNotExists(TECHNICAL_RECORD_TABLE, [], undefined);

        expect(executeSql).toHaveBeenCalledTimes(1);
        expect(executeSql).toHaveBeenCalledWith("SELECT 1", [], undefined);
        expect(generateSelectSql).toHaveBeenCalledTimes(1);
    });
});

describe("deleteBasedOnWhereIn()", () => {
    it("should call generateDeleteBasedOnWhereIn", () => {
        (generateDeleteBasedOnWhereIn as jest.Mock) = jest.fn().mockReturnValue("DELETE 1");

        (executeSql as jest.Mock) = jest.fn().mockResolvedValue({
            rows: [],
            fields: []
        });

        // @ts-ignore
        deleteBasedOnWhereIn(CUSTOM_DEFECT_TABLE.tableName, "id", [], undefined);

        expect(executeSql).toHaveBeenCalledTimes(1);
        expect(generateDeleteBasedOnWhereIn).toHaveBeenCalledTimes(1);
        expect(executeSql).toHaveBeenCalledWith("DELETE 1", [], undefined);
    });
});

describe("selectRecordIds()", () => {
    it("should call generateSelectRecordIds", () => {
        (generateSelectRecordIds as jest.Mock) = jest.fn().mockReturnValue("SELECT 1");

        (executeSql as jest.Mock) = jest.fn().mockResolvedValue({
            rows: [],
            fields: []
        });

        // @ts-ignore
        selectRecordIds(CUSTOM_DEFECT_TABLE.tableName, [], undefined);

        expect(executeSql).toHaveBeenCalledTimes(1);
        expect(generateSelectRecordIds).toHaveBeenCalledTimes(1);
        expect(executeSql).toHaveBeenCalledWith("SELECT 1", [], undefined);
    });
});
