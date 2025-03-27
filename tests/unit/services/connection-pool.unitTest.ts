import { createPool } from 'mysql2/promise';
import {
  destroyConnectionPool,
  executeSql,
  getConnectionPool,
} from '../../../src/services/connection-pool';
import { useLocalDb } from '../../utils';

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn().mockReturnValue({
    end: jest.fn(),
    execute: jest.fn(),
  }),
}));

useLocalDb();

describe('getConnectionPool()', () => {
  it('should create connection pool exactly once', async () => {
    await getConnectionPool();
    await getConnectionPool();
    await getConnectionPool();

    expect(createPool).toHaveBeenCalledTimes(1);
  });
});

describe('destroyConnectionPool()', () => {
  beforeEach(async () => {
    await destroyConnectionPool();

    // need to access nested function directly via mocked module parent function
    // using getConnectionPool().end will implicitly add 1 to mock calls counter
    // @ts-expect-error
    createPool().end.mockReset();
  });

  it('should do nothing if connection pool is undefined', async () => {
    await destroyConnectionPool();

    expect((await getConnectionPool()).end).not.toHaveBeenCalled();
  });

  it('should destroy connection pool if present', async () => {
    await getConnectionPool();
    await destroyConnectionPool();

    expect((await getConnectionPool()).end).toHaveBeenCalledTimes(1);
  });
});

describe('executeSql()', () => {
  beforeEach(() => {
    // need to access nested function directly via mocked module parent function
    // using getConnectionPool().execute will implicitly add 1 to mock calls counter
    // @ts-expect-error
    createPool().execute.mockReset();
    // Jest hoisting forces us to mockImplementation anywhere except in the module-level mock
    // @ts-expect-error
    createPool().execute.mockImplementation(() => [[], []]);
  });

  it('should accept single SQL statement', async () => {
    await executeSql('SELECT 1');

    expect((await getConnectionPool()).execute).toHaveBeenCalledWith(
      'SELECT 1',
      undefined,
    );
  });

  it('should accept SQL statement + template variables', async () => {
    const sql = 'SELECT 1 FROM t WHERE a = ? AND b = ?';
    const templateVariables = ['a', 'b'];
    await executeSql(sql, templateVariables);

    expect((await getConnectionPool()).execute).toHaveBeenCalledWith(
      sql,
      templateVariables,
    );
  });

  it('should use explicit connection if provided', async () => {
    const mockPoolExecute = jest.fn().mockReturnValue([[], []]);
    (createPool as jest.Mock) = jest
      .fn()
      .mockReturnValue({ execute: mockPoolExecute });

    const mockConnectionExecute = jest.fn().mockReturnValue([[], []]);
    const mockConnection = {
      execute: mockConnectionExecute,
    };

    const sql = 'SELECT 1 FROM t WHERE a = ? AND b = ?';
    const templateVariables = ['a', 'b'];

    // @ts-expect-error
    await executeSql(sql, templateVariables, mockConnection);

    expect(mockPoolExecute).not.toHaveBeenCalled();
    expect(mockConnectionExecute).toHaveBeenCalledWith(sql, templateVariables);
  });

  it('should return object, not tuple', async () => {
    const response = await executeSql('SELECT 1');

    expect(response).toEqual({
      rows: [],
      fields: [],
    });
  });
});
