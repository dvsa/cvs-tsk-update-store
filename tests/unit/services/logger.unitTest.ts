import { debugLog } from '../../../src/services/logger';

describe('logger service', () => {
  it('Should be able to get a logger instance', () => {
    process.env.DEBUG = 'true';
    const consoleSpy = jest.spyOn(console, 'info');
    debugLog('Test');
    expect(consoleSpy).toHaveBeenCalledWith('Test', []);
  });
});
