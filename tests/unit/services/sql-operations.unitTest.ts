import { OperationType } from '@aws-sdk/client-dynamodb-streams';
import { deriveSqlOperation } from '../../../src/services/sql-operations';

describe('deriveSqlOperation()', () => {
  it("should return 'INSERT' for input 'INSERT'", () => {
    expect(deriveSqlOperation('INSERT')).toBe('INSERT');
  });

  it("should return 'UPDATE' for input 'MODIFY'", () => {
    expect(deriveSqlOperation('MODIFY')).toBe('UPDATE');
  });

  it("should return 'DELETE' for input 'REMOVE'", () => {
    expect(deriveSqlOperation('REMOVE')).toBe('DELETE');
  });

  it('should throw error on unrecognized operation', () => {
    expect(() => deriveSqlOperation('any-unknown' as unknown as OperationType)).toThrow();
  });
});
