import {executeFullUpsert, executePartialUpsert} from "../../../src/services/sql-execution";
import {executeSql} from "../../../src/services/connection-pool";
import {TECHNICAL_RECORD_TABLE} from "../../../src/services/table-details";
import {generateFullUpsertSql, generatePartialUpsertSql} from "../../../src/services/sql-generation";

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
