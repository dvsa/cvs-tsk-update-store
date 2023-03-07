import {
    generateDeleteBasedOnSelect,
    generateDeleteBasedOnWhere,
    generateFullUpsertSql,
    generatePartialUpsertSql,
    generateSelectRecordIds,
    generateSelectSql
} from "../../../src/services/sql-generation";

const tableName = "myTable";
const columnNames = ["columnA", "columnZ"];

describe("generatePartialUpsertSql", () => {
    it("should generate correct SQL with a default PK 'id'", async () => {
        expect(generatePartialUpsertSql({ tableName, columnNames })).toEqual(
            "INSERT INTO `myTable` (`columnA`, `columnZ`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `id` = LAST_INSERT_ID(`id`)"
        );
    });

    it("should generate correct SQL when PK is provided", async () => {
        expect(generatePartialUpsertSql({ tableName, columnNames, primaryKeyColumnName: "myId"})).toEqual(
            "INSERT INTO `myTable` (`columnA`, `columnZ`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `myId` = LAST_INSERT_ID(`myId`)"
        );
    });
});

describe("generateFullUpsertSql", () => {
    it("should generate correct SQL with a default PK 'id'", async () => {
        expect(generateFullUpsertSql({ tableName, columnNames })).toEqual(
            "INSERT INTO `myTable` (`columnA`, `columnZ`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `id` = LAST_INSERT_ID(`id`), `columnA` = ?, `columnZ` = ?"
        );
    });

    it("should generate correct SQL when PK is provided", async () => {
        expect(generateFullUpsertSql({ tableName, columnNames, primaryKeyColumnName: "myId"})).toEqual(
            "INSERT INTO `myTable` (`columnA`, `columnZ`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `myId` = LAST_INSERT_ID(`myId`), `columnA` = ?, `columnZ` = ?"
        );
    });
});

describe("generateSelectSql", () => {
    it("should generate correct SELECT SQL with MD5 function clause, and columns placeholder", async () => {
        expect(generateSelectSql({ tableName, columnNames })).toEqual(
            "SELECT id insertId FROM `myTable` WHERE fingerprint = MD5(CONCAT_WS('|', IFNULL(?, ''), IFNULL(?, '')))"
        );
    });
});

describe("generateDeleteBasedOnSelect ", () => {
    it("should construct a correct Delete SQL query, based on SELECT from the child table", async () => {
        const targetTableName = "test_defect";
        const foreignTableName = "test_result";
        const foreignTableId = "test_result_id";    
        const attributes = {
            vehicle_id: 1,
            testResultId: "TEST-RESULT-ID",
        };
    
        const expectedQuery = "DELETE FROM test_defect WHERE test_result_id IN (SELECT id FROM test_result WHERE vehicle_id=? AND testResultId=?)";
        const result = generateDeleteBasedOnSelect(targetTableName, foreignTableName, foreignTableId, attributes);
        expect(result).toEqual(expectedQuery);
    });
});

describe("generateDeleteBasedOnWhere ", () => {
    it("should construct a correct Delete SQL query, based on WHERE clause", async () => {
        const targetTableName = "test_result";
        const attributes = {
            vehicle_id: 1,
            testResultId: "TEST-RESULT-ID",
        };
    
        const expectedQuery = "DELETE FROM test_result WHERE vehicle_id=? AND testResultId=?";
        const result = generateDeleteBasedOnWhere(targetTableName, attributes);
        expect(result).toEqual(expectedQuery);
    });
});

describe("generateSelectRecordIds ", () => {
    it("should construct a correct Select SQL query, based on WHERE clause", async () => {
        const targetTableName = "test_result";
        const attributes = {
            vehicle_id: 1,
            testResultId: "TEST-RESULT-ID",
        };
    
        const expectedQuery = "SELECT id FROM test_result WHERE vehicle_id=? AND testResultId=?";
        const result = generateSelectRecordIds(targetTableName, attributes);
        expect(result).toEqual(expectedQuery);
    });
});
