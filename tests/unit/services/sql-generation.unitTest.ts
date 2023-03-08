import {
    generateDeleteBasedOnWhereIn,
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

describe("generateDeleteBasedOnWhereIn", () => {
    it("should construct a correct Delete SQL query, based on WHERE IN clause", async () => {
        const targetTableName = "test_result";
        const targetColumnName = "test_result_id";
        const ids = [1, 3, 5, 6];
    
        const expectedQuery = "DELETE FROM test_result WHERE test_result_id IN (?,?,?,?)";
        const result = generateDeleteBasedOnWhereIn(targetTableName, targetColumnName, ids);
        expect(result).toEqual(expectedQuery);
    });
});

describe("generateSelectRecordIds", () => {
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
