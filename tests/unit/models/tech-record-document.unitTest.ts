import {
  parseTechRecordDocument,
  TechRecordDocument,
} from '../../../src/models/tech-record-document';
import { DynamoDbImage } from '../../../src/services/dynamodb-images';
import techRecordDocumentJson from '../../resources/dynamodb-image-technical-record.json';
import { castToImageShape } from '../../utils';

describe('parseTechRecordDocument()', () => {
  it('should successfully parse a DynamoDB image into a TechRecordDocument', () => {
    const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));

    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(
      image,
    );

    // check only first property of each root, for now
    expect(techRecordDocument.systemNumber).toBe('SYSTEM-NUMBER-1');
    expect(techRecordDocument.techRecord![0].recordCompleteness).toBe(
      '88888888',
    );
    expect(techRecordDocument.techRecord![0].createdAt).toBe(
      '2020-01-01 00:00:00.055',
    );
    expect(
      techRecordDocument.techRecord![0].authIntoService?.cocIssueDate,
    ).toBe('2020-01-01');
    expect(techRecordDocument.techRecord![0].lettersOfAuth?.letterType).toBe(
      'Trailer authorization',
    );
    expect(techRecordDocument.techRecord![0].applicantDetails?.name).toBe(
      'NAME',
    );
    expect(techRecordDocument.techRecord![0].purchaserDetails?.name).toBe(
      'NAME',
    );
    expect(techRecordDocument.techRecord![0].manufacturerDetails?.name).toBe(
      'NAME',
    );
    expect(
      techRecordDocument.techRecord![0].microfilm?.microfilmDocumentType,
    ).toBe('PSV Miscellaneous');
    expect(
      techRecordDocument.techRecord![0].plates![0].plateSerialNumber,
    ).toBe('1');
    expect(techRecordDocument.techRecord![0].bodyType?.code).toBe('a');
    expect(
      techRecordDocument.techRecord![0].dimensions?.axleSpacing![0].axles,
    ).toBe('1-2');
    expect(techRecordDocument.techRecord![0].vehicleClass?.code).toBe('2');
    expect(techRecordDocument.techRecord![0].brakes?.brakeCodeOriginal).toBe(
      '333',
    );
    expect(techRecordDocument.techRecord![0].axles![0].axleNumber).toBe(1);
  });

  it('should successfully parse a DynamoDB image, with no authIntoService, into a TechRecordDocument', () => {
    // @ts-expect-error
    delete techRecordDocumentJson.techRecord.L[0].M.authIntoService;
    const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));

    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(
      image,
    );

    // check only first property of each root, for now
    expect(techRecordDocument.systemNumber).toBe('SYSTEM-NUMBER-1');
    expect(techRecordDocument.techRecord![0].recordCompleteness).toBe(
      '88888888',
    );
    expect(techRecordDocument.techRecord![0].createdAt).toBe(
      '2020-01-01 00:00:00.055',
    );
    expect(techRecordDocument.techRecord![0].authIntoService).toBeUndefined();
    expect(techRecordDocument.techRecord![0].lettersOfAuth?.letterType).toBe(
      'Trailer authorization',
    );
    expect(techRecordDocument.techRecord![0].applicantDetails?.name).toBe(
      'NAME',
    );
    expect(techRecordDocument.techRecord![0].purchaserDetails?.name).toBe(
      'NAME',
    );
    expect(techRecordDocument.techRecord![0].manufacturerDetails?.name).toBe(
      'NAME',
    );
    expect(
      techRecordDocument.techRecord![0].microfilm?.microfilmDocumentType,
    ).toBe('PSV Miscellaneous');
    expect(
      techRecordDocument.techRecord![0].plates![0].plateSerialNumber,
    ).toBe('1');
    expect(techRecordDocument.techRecord![0].bodyType?.code).toBe('a');
    expect(
      techRecordDocument.techRecord![0].dimensions?.axleSpacing![0].axles,
    ).toBe('1-2');
    expect(techRecordDocument.techRecord![0].vehicleClass?.code).toBe('2');
    expect(techRecordDocument.techRecord![0].brakes?.brakeCodeOriginal).toBe(
      '333',
    );
    expect(techRecordDocument.techRecord![0].axles![0].axleNumber).toBe(1);
  });
});
