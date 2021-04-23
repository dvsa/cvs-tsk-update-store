import {parseTechRecordDocument, TechRecordDocument} from "../../../src/models/tech-record-document";
import {DynamoDbImage} from "../../../src/services/dynamodb-images";
import {default as techRecordDocumentJson} from "../../resources/dynamodb-image-technical-record.json";
import {castToImageShape} from "../../utils";

describe("parseTechRecordDocument()", () => {
    it("should successfully parse a DynamoDB image into a TechRecordDocument", () => {
        const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));

        const techRecordDocument: TechRecordDocument = parseTechRecordDocument(image);

        // check only first property of each root, for now
        expect(techRecordDocument.systemNumber).toEqual("SYSTEM-NUMBER-1");
        expect(techRecordDocument.techRecord![0].recordCompleteness).toEqual("88888888");
        expect(techRecordDocument.techRecord![0].authIntoService?.cocIssueDate).toEqual("2020-01-01");
        expect(techRecordDocument.techRecord![0].lettersOfAuth?.letterType).toEqual("Trailer authorization");
        expect(techRecordDocument.techRecord![0].applicantDetails?.name).toEqual("NAME");
        expect(techRecordDocument.techRecord![0].purchaserDetails?.name).toEqual("NAME");
        expect(techRecordDocument.techRecord![0].manufacturerDetails?.name).toEqual("NAME");
        expect(techRecordDocument.techRecord![0].microfilm?.microfilmDocumentType).toEqual("PSV Miscellaneous");
        expect(techRecordDocument.techRecord![0].plates![0].plateSerialNumber).toEqual("1");
        expect(techRecordDocument.techRecord![0].bodyType?.code).toEqual("a");
        expect(techRecordDocument.techRecord![0].dimensions?.axleSpacing![0].axles).toEqual("1-2");
        expect(techRecordDocument.techRecord![0].vehicleClass?.code).toEqual("2");
        expect(techRecordDocument.techRecord![0].brakes?.brakeCodeOriginal).toEqual("333");
        expect(techRecordDocument.techRecord![0].axles![0].axleNumber).toEqual(1);
    });
});
