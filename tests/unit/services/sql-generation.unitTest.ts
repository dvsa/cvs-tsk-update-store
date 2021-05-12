import {generateFullUpsertSql, generatePartialUpsertSql, generateSelectSql} from "../../../src/services/sql-generation";

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