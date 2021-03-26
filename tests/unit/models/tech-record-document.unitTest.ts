import {parseTechRecordDocument, TechRecordDocument} from "../../../src/models/tech-record-document";
import {DynamoDbImage} from "../../../src/services/dynamodb-images";
import {default as techRecordDocumentJson} from "../../resources/dynamodb-image-technical-record.json";
import {castToImageShape} from "../../utils";

describe("parseTechRecordDocument()", () => {
    it("should successfully parse a DynamoDB image into a TechRecordDocument", () => {
        const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));

        const techRecordDocument: TechRecordDocument = parseTechRecordDocument(image);

        expect(techRecordDocument.systemNumber).toEqual("SYSTEM-NUMBER");
        expect(techRecordDocument.partialVin).toEqual("PARTIAL-VIN");
        expect(techRecordDocument.primaryVrm).toEqual("999999999");
        expect(techRecordDocument.secondaryVms).toEqual(["SECONDARY-VRM"]);
        expect(techRecordDocument.vin).toEqual("VIN");
        expect(techRecordDocument.trailerId).toEqual("88888888");
        expect(techRecordDocument.techRecord!.length).toEqual(1);
    });
});
