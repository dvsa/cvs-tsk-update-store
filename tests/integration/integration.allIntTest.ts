import { authIntoServiceDocumentConversion } from "./auth-into-service-document-conversion.intTest";
import { techRecordDocumentConversion } from "./tech-record-document-conversion.intTest";
import { testResultsConversionWithDelete } from "./test-results-conversion-with-delete.intTest";
import { testResultsConversionWithUpsert } from "./test-results-conversion-with-upsert.intTest";

describe("convert TechRecord document integration tests", () => {
    techRecordDocumentConversion();
});
describe("convert authIntoService document integration tests", () => {
    authIntoServiceDocumentConversion();
});
describe("convert TestResults integration tests", () => {
    testResultsConversionWithDelete();
    testResultsConversionWithUpsert();
});
