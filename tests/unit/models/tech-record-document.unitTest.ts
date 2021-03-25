import {parseTechRecordDocument, TechRecordDocument} from "../../../src/models/tech-record-document";
import {DynamoDbImage} from "../../../src/services/dynamodb-images";
import {castToImageShape} from "../utils";
import {default as techRecordDocumentJson} from "../../resources/dynamodb-image-technical-record.json";

describe("parseTechRecordDocument()", () => {
    it("should successfully parse a DynamoDB image into a TechRecordDocument", () => {
        const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));

        const techRecordDocument: TechRecordDocument = parseTechRecordDocument(image);

        expect(techRecordDocument.systemNumber).toEqual("SYSTEM-NUMBER");
        expect(techRecordDocument.partialVin).toEqual("PARTIAL-VIN");
        expect(techRecordDocument.primaryVrm).toEqual("PRIMARY-VRM");
        expect(techRecordDocument.secondaryVms).toEqual(["SECONDARY-VRM"]);
        expect(techRecordDocument.vin).toEqual("VIN");
        expect(techRecordDocument.trailerId).toEqual("TRAILER-ID");
        expect(techRecordDocument.techRecord!.length).toEqual(1);
    });
});
