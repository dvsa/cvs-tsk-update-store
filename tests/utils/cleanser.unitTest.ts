import { BodyType } from "../../src/models/body-type";
import "../../src/utils/cleanser";

describe("fingerprintCleanser function", () => {
    it("should trim and null empty strings from data", () => {
        const bodyType: BodyType = {
            code: "m",
            description: "skeletal",
        };

        const originalData = [
            1234,
            " Trim Me",
            "    ",
            " ",
            "",
            bodyType.code,
            bodyType.description,
        ];

        const expectedCleansedData = [
            1234,
            "Trim Me",
            null,
            null,
            null,
            bodyType.code,
            bodyType.description,
        ];

        const cleansedData = originalData.fingerprintCleanser();

        expect(cleansedData[0]).toBe(expectedCleansedData[0]);
        expect(cleansedData[1]).toBe(expectedCleansedData[1]);
        expect(cleansedData[2]).toBe(expectedCleansedData[2]);
        expect(cleansedData[3]).toBe(expectedCleansedData[3]);
        expect(cleansedData[4]).toBe(expectedCleansedData[4]);
        expect(cleansedData[5]).toBe(expectedCleansedData[5]);
        expect(cleansedData[6]).toBe(expectedCleansedData[6]);
    });
});
