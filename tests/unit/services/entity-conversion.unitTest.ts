import { techRecordDocumentConverter } from '../../../src/services/tech-record-document-conversion';
import { convert } from '../../../src/services/entity-conversion';
import { DynamoDbImage } from '../../../src/services/dynamodb-images';
import { testResultsConverter } from '../../../src/services/test-result-record-conversion';
import { selectRecordIds } from '../../../src/services/sql-execution';

jest.mock('../../../src/services/tech-record-document-conversion', () => ({
  techRecordDocumentConverter: jest.fn().mockReturnValue({
    parseRootImage: jest.fn(),
    upsertEntity: jest.fn(),
    deleteEntity: jest.fn(),
  }),
}));

describe('convert()', () => {
  beforeEach(() => {
    // @ts-expect-error
    techRecordDocumentConverter().parseRootImage.mockReset();
    // @ts-expect-error
    techRecordDocumentConverter().upsertEntity.mockReset();
    // @ts-expect-error
    techRecordDocumentConverter().deleteEntity.mockReset();
  });

  it("should parse and upsert entities on 'INSERT'", () => {
    convert('technical-records', 'INSERT', exampleImage());

    expect(techRecordDocumentConverter().parseRootImage).toHaveBeenCalledTimes(
      1,
    );
    expect(techRecordDocumentConverter().upsertEntity).toHaveBeenCalledTimes(1);
    expect(techRecordDocumentConverter().deleteEntity).toHaveBeenCalledTimes(0);
  });

  it("should parse and delete entities on 'DELETE'", () => {
    convert('technical-records', 'DELETE', exampleImage());

    expect(techRecordDocumentConverter().parseRootImage).toHaveBeenCalledTimes(
      1,
    );
    expect(techRecordDocumentConverter().upsertEntity).toHaveBeenCalledTimes(0);
    expect(techRecordDocumentConverter().deleteEntity).toHaveBeenCalledTimes(1);
  });

  it('should fail on non-existent table', async () => {
    await expect(() => convert('any-unknown', 'INSERT', exampleImage())).rejects.toThrow();
  });

  const exampleImage = (): DynamoDbImage => DynamoDbImage.parse({
    StringField: {
      S: 'TEST',
    },
  });
});

// jest.mock('../../../src/services/test-result-record-conversion.ts', () => ({
//   testResultsConverter: jest.fn().mockReturnValue({
//     parseRootImage: jest.fn(),
//     upsertEntity: jest.fn(),
//     deleteEntity: jest.fn(),
//   }),
// }));
//
// // Mock sql-execution so that it always returns one row
// jest.mock('../../../src/services/sql-execution.ts', () => ({
//   selectRecordIds: jest.fn().mockReturnValue({
//     rows: [1]
//   })
// }));
//
// describe('upsertTestResults()', () => {
//   beforeEach(() => {
//     // techRecordDocumentConverter().parseRootImage.mockReset();
//     // techRecordDocumentConverter().upsertEntity.mockReset();
//     // techRecordDocumentConverter().deleteEntity.mockReset();
//   });
//
//   it("should be ", () => {
//     convert('technical-records', 'INSERT', exampleImage());
//
//     expect(techRecordDocumentConverter().parseRootImage).toHaveBeenCalledTimes(
//       1,
//     );
//     expect(techRecordDocumentConverter().upsertEntity).toHaveBeenCalledTimes(1);
//     expect(techRecordDocumentConverter().deleteEntity).toHaveBeenCalledTimes(0);
//   });
//
//
//
