import {generateFullUpsertSql, generatePartialUpsertSql} from "../../src/services/sql-generation";

const tableName = "myTable";
const columnNames = ["columnA", "columnZ"];

describe("generatePartialUpsertSql", () => {
    it("should generate correct SQL with a default PK 'id'", async () => {
        expect(generatePartialUpsertSql({ tableName, columnNames })).toEqual(
            "INSERT INTO `myTable` (`columnA`, `columnZ`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `id` = LAST_INSERT_ID(`id`)"
        );
    });

    it("should generate correct SQL when PK is provided", async () => {
        expect(generatePartialUpsertSql({ tableName, columnNames }, "myId")).toEqual(
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
        expect(generateFullUpsertSql({ tableName, columnNames }, "myId")).toEqual(
            "INSERT INTO `myTable` (`columnA`, `columnZ`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `myId` = LAST_INSERT_ID(`myId`), `columnA` = ?, `columnZ` = ?"
        );
    });
});
