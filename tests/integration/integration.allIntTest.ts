import { techRecordDocumentConversion } from "./tech-record-document-conversion.intTest";
import { testResultsConversionWithDelete } from "./test-results-conversion-with-delete.intTest";
import { testResultsConversionWithUpsert } from "./test-results-conversion-with-upsert.intTest";

describe("convertTechRecordDocument() integration tests", () => {
    techRecordDocumentConversion();
});
describe("convertTestResults() integration tests", () => {
    testResultsConversionWithDelete();
    testResultsConversionWithUpsert();
});
