import {deriveSqlOperation} from "../../../src/services/sql-operations";

describe("deriveSqlOperation()", () => {
    it("should return 'INSERT' for input 'INSERT'", () => {
        expect(deriveSqlOperation("INSERT")).toEqual("INSERT");
    });

    it("should return 'UPDATE' for input 'MODIFY'", () => {
        expect(deriveSqlOperation("MODIFY")).toEqual("UPDATE");
    });

    it("should return 'DELETE' for input 'REMOVE'", () => {
        expect(deriveSqlOperation("REMOVE")).toEqual("DELETE");
    });

    it("should throw error on unrecognized operation", () => {
        expect(() => deriveSqlOperation("any-unknown")).toThrowError();
    });
});
