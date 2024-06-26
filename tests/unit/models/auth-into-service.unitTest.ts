import { DynamoDbImage } from '../../../src/services/dynamodb-images';
import { castToImageShape } from '../../utils';
import techRecordDocumentJson from '../../resources/dynamodb-image-technical-record.json';
import {
  parseTechRecordDocument,
  TechRecordDocument,
} from '../../../src/models/tech-record-document';

describe('parseAuthIntoService()', () => {
  it('should successfully parse a fully populated authIntoService image into an authIntoService object', () => {
    techRecordDocumentJson.techRecord.L[0].M.authIntoService = {
      M: {
        cocIssueDate: {
          S: '2020-01-01',
        },
        dateReceived: {
          S: '2020-02-02',
        },
        datePending: {
          S: '2020-03-03',
        },
        dateAuthorised: {
          S: '2020-04-04',
        },
        dateRejected: {
          S: '2020-05-05',
        },
      },
    };
    const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));
    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(
      image,
    );

    expect(techRecordDocument.systemNumber).toBe('SYSTEM-NUMBER-1');
    expect(
      techRecordDocument.techRecord![0].authIntoService?.cocIssueDate,
    ).toBe('2020-01-01');
    expect(
      techRecordDocument.techRecord![0].authIntoService?.dateReceived,
    ).toBe('2020-02-02');
    expect(
      techRecordDocument.techRecord![0].authIntoService?.datePending,
    ).toBe('2020-03-03');
    expect(
      techRecordDocument.techRecord![0].authIntoService?.dateAuthorised,
    ).toBe('2020-04-04');
    expect(
      techRecordDocument.techRecord![0].authIntoService?.dateRejected,
    ).toBe('2020-05-05');
  });

  it('should successfully parse an authIntoService image into an authIntoService object with some null properties', () => {
    techRecordDocumentJson.techRecord.L[0].M.authIntoService = {
      M: {
        cocIssueDate: {
          // @ts-expect-error
          NULL: true,
        },
        dateAuthorised: {
          S: '2020-02-02',
        },
        datePending: {
          // @ts-expect-error
          NULL: true,
        },
        dateReceived: {
          S: '2020-04-04',
        },
        dateRejected: {
          // @ts-expect-error
          NULL: true,
        },
      },
    };

    const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));
    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(
      image,
    );

    expect(techRecordDocument.systemNumber).toBe('SYSTEM-NUMBER-1');
    expect(
      techRecordDocument.techRecord![0].authIntoService?.cocIssueDate,
    ).toBeUndefined();
    expect(
      techRecordDocument.techRecord![0].authIntoService?.dateAuthorised,
    ).toBe('2020-02-02');
    expect(
      techRecordDocument.techRecord![0].authIntoService?.datePending,
    ).toBeUndefined();
    expect(
      techRecordDocument.techRecord![0].authIntoService?.dateReceived,
    ).toBe('2020-04-04');
    expect(
      techRecordDocument.techRecord![0].authIntoService?.dateRejected,
    ).toBeUndefined();
  });

  it('should return undefined for an empty authIntoService', () => {
    techRecordDocumentJson.techRecord.L[0].M.authIntoService = {
      // @ts-expect-error
      M: {},
    };

    const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));
    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(
      image,
    );

    expect(techRecordDocument.systemNumber).toBe('SYSTEM-NUMBER-1');
    expect(techRecordDocument.techRecord![0].authIntoService).toBeUndefined();
  });

  it('should return undefined when no authIntoService present', () => {
    // @ts-expect-error
    delete techRecordDocumentJson.techRecord.L[0].M.authIntoService;

    const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));
    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(
      image,
    );

    expect(techRecordDocument.systemNumber).toBe('SYSTEM-NUMBER-1');
    expect(techRecordDocument.techRecord![0].authIntoService).toBeUndefined();
  });

  it('should return undefined for an authIntoService with all null properties', () => {
    techRecordDocumentJson.techRecord.L[0].M.authIntoService = {
      M: {
        cocIssueDate: {
          // @ts-expect-error
          NULL: true,
        },
        dateAuthorised: {
          // @ts-expect-error
          NULL: true,
        },
        datePending: {
          // @ts-expect-error
          NULL: true,
        },
        dateReceived: {
          // @ts-expect-error
          NULL: true,
        },
        dateRejected: {
          // @ts-expect-error
          NULL: true,
        },
      },
    };

    const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));
    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(
      image,
    );

    expect(techRecordDocument.systemNumber).toBe('SYSTEM-NUMBER-1');
    expect(techRecordDocument.techRecord![0].authIntoService).toBeUndefined();
  });

  it('should return undefined for an authIntoService with rogue properties', () => {
    techRecordDocumentJson.techRecord.L[0].M.authIntoService = {
      M: {
        // @ts-expect-error
        iDoNotBelong: {
          S: '2020-01-01',
        },
        meNeither: {
          S: '2020-02-02',
        },
      },
    };

    const image = DynamoDbImage.parse(castToImageShape(techRecordDocumentJson));
    const techRecordDocument: TechRecordDocument = parseTechRecordDocument(
      image,
    );

    expect(techRecordDocument.systemNumber).toBe('SYSTEM-NUMBER-1');
    expect(techRecordDocument.techRecord![0].authIntoService).toBeUndefined();
  });
});
