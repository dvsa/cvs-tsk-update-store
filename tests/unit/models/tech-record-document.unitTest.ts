import {
  parseTechRecordDocument,
  TechRecordDocument,
} from "../../../src/models/tech-record-document";
import { DynamoDbImage } from "../../../src/services/dynamodb-images";
import { default as techRecordDocumentJson } from "../../resources/dynamodb-image-technical-record-with-adr.json";
import { castToImageShape } from "../../utils";

describe("parseTechRecordDocument()", () => {
  it("should successfully parse a DynamoDB image with ADR into a TechRecordDocument", async () => {
    const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));

    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(
      image
    );

    // check only first property of each root, for now
    expect(techRecordDocument.systemNumber).toEqual("SYSTEM-NUMBER-1");
    expect(techRecordDocument.techRecord![0].recordCompleteness).toEqual(
      "88888888"
    );
    expect(techRecordDocument.techRecord![0].createdAt).toEqual(
      "2020-01-01 00:00:00.055"
    );
    expect(
      techRecordDocument.techRecord![0].authIntoService?.cocIssueDate
    ).toEqual("2020-01-01");
    expect(techRecordDocument.techRecord![0].lettersOfAuth?.letterType).toEqual(
      "Trailer authorization"
    );
    expect(techRecordDocument.techRecord![0].applicantDetails?.name).toEqual(
      "NAME"
    );
    expect(techRecordDocument.techRecord![0].purchaserDetails?.name).toEqual(
      "NAME"
    );
    expect(techRecordDocument.techRecord![0].manufacturerDetails?.name).toEqual(
      "NAME"
    );
    expect(
      techRecordDocument.techRecord![0].microfilm?.microfilmDocumentType
    ).toEqual("PSV Miscellaneous");
    expect(
      techRecordDocument.techRecord![0].plates![0].plateSerialNumber
    ).toEqual("1");
    expect(techRecordDocument.techRecord![0].bodyType?.code).toEqual("a");
    expect(
      techRecordDocument.techRecord![0].dimensions?.axleSpacing![0].axles
    ).toEqual("1-2");
    expect(techRecordDocument.techRecord![0].vehicleClass?.code).toEqual("2");
    expect(techRecordDocument.techRecord![0].brakes?.brakeCodeOriginal).toEqual(
      "333"
    );
    expect(techRecordDocument.techRecord![0].axles![0].axleNumber).toEqual(1);

    expect(techRecordDocument.techRecord![0].adrPassCertificateDetails![0].certificateId).toEqual("CERTIFICATE-ID-1");
    expect(techRecordDocument.techRecord![0].adrPassCertificateDetails![0].createdByName).toEqual("CREATED-BY-NAME-01");
    expect(techRecordDocument.techRecord![0].adrPassCertificateDetails![0].certificateType).toEqual("PASS");
    expect(techRecordDocument.techRecord![0].adrPassCertificateDetails![0].generatedTimestamp).toEqual("2023-04-01 01:49:00.055");
    
    // ADR Details attributes
    expect(techRecordDocument.techRecord![0].adrDetails?.additionalExaminerNotes![0].note).toEqual("additionalExaminerNotes_note_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.additionalExaminerNotes![0].createdAtDate).toEqual("2023-05-30");
    expect(techRecordDocument.techRecord![0].adrDetails?.additionalExaminerNotes![0].lastUpdatedBy).toEqual("additionalExaminerNotes_lastUpdatedBy_1");

    expect(techRecordDocument.techRecord![0].adrDetails?.additionalNotes?.number![0]).toEqual("1");
    expect(techRecordDocument.techRecord![0].adrDetails?.additionalNotes?.number![1]).toEqual("T1B");

    expect(techRecordDocument.techRecord![0].adrDetails?.adrCertificateNotes).toEqual("adrCertificateNotes_1");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.adrTypeApprovalNo).toEqual("adrTypeApprovalNo_1");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.applicantDetails?.name).toEqual("applicantDetails_Name");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.batteryListNumber).toEqual("BATTERY1");
    expect(techRecordDocument.techRecord![0].adrDetails?.brakeDeclarationIssuer).toEqual("brakeDeclarationIssuer_1");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.brakeDeclarationsSeen).toEqual(true);
    expect(techRecordDocument.techRecord![0].adrDetails?.brakeEndurance).toEqual(false);
    expect(techRecordDocument.techRecord![0].adrDetails?.compatibilityGroupJ).toEqual("I");
    expect(techRecordDocument.techRecord![0].adrDetails?.dangerousGoods).toEqual(false);
    expect(techRecordDocument.techRecord![0].adrDetails?.declarationsSeen).toEqual(false);
    
    expect(techRecordDocument.techRecord![0].adrDetails?.documents![0]).toEqual("documents_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.documents![1]).toEqual("documents_2");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.listStatementApplicable).toEqual(true);
    expect(techRecordDocument.techRecord![0].adrDetails?.m145Statement).toEqual(true);
    expect(techRecordDocument.techRecord![0].adrDetails?.newCertificateRequested).toEqual(false);
    
    expect(techRecordDocument.techRecord![0].adrDetails?.memosApply![0]).toEqual("07/09 3mth leak ext");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.permittedDangerousGoods![0]).toEqual("FP <61 (FL)");
    expect(techRecordDocument.techRecord![0].adrDetails?.permittedDangerousGoods![1]).toEqual("Carbon Disulphide");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankManufacturer).toEqual("tankManufacturer_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.yearOfManufacture).toEqual(2012);
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankCode).toEqual("tankCode_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.specialProvisions).toEqual("specialProvisions_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankManufacturerSerialNo).toEqual("1234");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankTypeAppNo).toEqual("9876");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc2Details?.tc2Type).toEqual("initial");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc2Details?.tc2IntermediateApprovalNo).toEqual("12345");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc2Details?.tc2IntermediateExpiryDate).toEqual("2024-06-01");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc3Details![0].tc3Type).toEqual("intermediate");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc3Details![0].tc3PeriodicNumber).toEqual("98765");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc3Details![0].tc3PeriodicExpiryDate).toEqual("2024-06-01");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.select).toEqual("Product list");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.statement).toEqual("statement_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.productListRefNo).toEqual("123456");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.productList).toEqual("productList_1");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.productListUnNo![0]).toEqual("123123");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.productListUnNo![1]).toEqual("987987");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.vehicleDetails?.type).toEqual("Artic tractor");
    expect(techRecordDocument.techRecord![0].adrDetails?.vehicleDetails?.approvalDate).toEqual("2023-06-12");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.weight).toEqual(7.50);

  });

  it("should successfully parse a DynamoDB image, with ADR, with no authIntoService, into a TechRecordDocument", async () => {
    // @ts-ignore
    delete techRecordDocumentJson.techRecord.L[0].M.authIntoService;
    const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));

    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(
      image
    );

    // check only first property of each root, for now
    expect(techRecordDocument.systemNumber).toEqual("SYSTEM-NUMBER-1");
    expect(techRecordDocument.techRecord![0].recordCompleteness).toEqual(
      "88888888"
    );
    expect(techRecordDocument.techRecord![0].createdAt).toEqual(
      "2020-01-01 00:00:00.055"
    );
    expect(techRecordDocument.techRecord![0].authIntoService).toBeUndefined;
    expect(techRecordDocument.techRecord![0].lettersOfAuth?.letterType).toEqual(
      "Trailer authorization"
    );
    expect(techRecordDocument.techRecord![0].applicantDetails?.name).toEqual(
      "NAME"
    );
    expect(techRecordDocument.techRecord![0].purchaserDetails?.name).toEqual(
      "NAME"
    );
    expect(techRecordDocument.techRecord![0].manufacturerDetails?.name).toEqual(
      "NAME"
    );
    expect(
      techRecordDocument.techRecord![0].microfilm?.microfilmDocumentType
    ).toEqual("PSV Miscellaneous");
    expect(
      techRecordDocument.techRecord![0].plates![0].plateSerialNumber
    ).toEqual("1");
    expect(techRecordDocument.techRecord![0].bodyType?.code).toEqual("a");
    expect(
      techRecordDocument.techRecord![0].dimensions?.axleSpacing![0].axles
    ).toEqual("1-2");
    expect(techRecordDocument.techRecord![0].vehicleClass?.code).toEqual("2");
    expect(techRecordDocument.techRecord![0].brakes?.brakeCodeOriginal).toEqual(
      "333"
    );
    expect(techRecordDocument.techRecord![0].axles![0].axleNumber).toEqual(1);

    expect(techRecordDocument.techRecord![0].adrPassCertificateDetails![0].certificateId).toEqual("CERTIFICATE-ID-1");
    expect(techRecordDocument.techRecord![0].adrPassCertificateDetails![0].createdByName).toEqual("CREATED-BY-NAME-01");
    expect(techRecordDocument.techRecord![0].adrPassCertificateDetails![0].certificateType).toEqual("PASS");
    expect(techRecordDocument.techRecord![0].adrPassCertificateDetails![0].generatedTimestamp).toEqual("2023-04-01 01:49:00.055");
    
    // ADR Details attributes
    expect(techRecordDocument.techRecord![0].adrDetails?.additionalExaminerNotes![0].note).toEqual("additionalExaminerNotes_note_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.additionalExaminerNotes![0].createdAtDate).toEqual("2023-05-30");
    expect(techRecordDocument.techRecord![0].adrDetails?.additionalExaminerNotes![0].lastUpdatedBy).toEqual("additionalExaminerNotes_lastUpdatedBy_1");

    expect(techRecordDocument.techRecord![0].adrDetails?.additionalNotes?.number![0]).toEqual("1");
    expect(techRecordDocument.techRecord![0].adrDetails?.additionalNotes?.number![1]).toEqual("T1B");

    expect(techRecordDocument.techRecord![0].adrDetails?.adrCertificateNotes).toEqual("adrCertificateNotes_1");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.adrTypeApprovalNo).toEqual("adrTypeApprovalNo_1");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.applicantDetails?.name).toEqual("applicantDetails_Name");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.batteryListNumber).toEqual("BATTERY1");
    expect(techRecordDocument.techRecord![0].adrDetails?.brakeDeclarationIssuer).toEqual("brakeDeclarationIssuer_1");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.brakeDeclarationsSeen).toEqual(true);
    expect(techRecordDocument.techRecord![0].adrDetails?.brakeEndurance).toEqual(false);
    expect(techRecordDocument.techRecord![0].adrDetails?.compatibilityGroupJ).toEqual("I");
    expect(techRecordDocument.techRecord![0].adrDetails?.dangerousGoods).toEqual(false);
    expect(techRecordDocument.techRecord![0].adrDetails?.declarationsSeen).toEqual(false);
    
    expect(techRecordDocument.techRecord![0].adrDetails?.documents![0]).toEqual("documents_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.documents![1]).toEqual("documents_2");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.listStatementApplicable).toEqual(true);
    expect(techRecordDocument.techRecord![0].adrDetails?.m145Statement).toEqual(true);
    expect(techRecordDocument.techRecord![0].adrDetails?.newCertificateRequested).toEqual(false);
    
    expect(techRecordDocument.techRecord![0].adrDetails?.memosApply![0]).toEqual("07/09 3mth leak ext");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.permittedDangerousGoods![0]).toEqual("FP <61 (FL)");
    expect(techRecordDocument.techRecord![0].adrDetails?.permittedDangerousGoods![1]).toEqual("Carbon Disulphide");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankManufacturer).toEqual("tankManufacturer_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.yearOfManufacture).toEqual(2012);
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankCode).toEqual("tankCode_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.specialProvisions).toEqual("specialProvisions_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankManufacturerSerialNo).toEqual("1234");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankTypeAppNo).toEqual("9876");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc2Details?.tc2Type).toEqual("initial");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc2Details?.tc2IntermediateApprovalNo).toEqual("12345");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc2Details?.tc2IntermediateExpiryDate).toEqual("2024-06-01");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc3Details![0].tc3Type).toEqual("intermediate");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc3Details![0].tc3PeriodicNumber).toEqual("98765");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tc3Details![0].tc3PeriodicExpiryDate).toEqual("2024-06-01");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.select).toEqual("Product list");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.statement).toEqual("statement_1");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.productListRefNo).toEqual("123456");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.productList).toEqual("productList_1");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.productListUnNo![0]).toEqual("123123");
    expect(techRecordDocument.techRecord![0].adrDetails?.tank?.tankDetails?.tankStatement?.productListUnNo![1]).toEqual("987987");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.vehicleDetails?.type).toEqual("Artic tractor");
    expect(techRecordDocument.techRecord![0].adrDetails?.vehicleDetails?.approvalDate).toEqual("2023-06-12");
    
    expect(techRecordDocument.techRecord![0].adrDetails?.weight).toEqual(7.50);
    
  });
});
