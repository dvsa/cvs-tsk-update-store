import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { getSecretValue } from '../../../src/services/secrets-manager';

const mockSecretsManager = mockClient(SecretsManagerClient as any);
const mockSecretValue = (expectedSecretKey: string, secretValue: any) => {
  // @ts-ignore
  mockSecretsManager.on(GetSecretValueCommand).callsFake((actualSecretKey) => {
    if (expectedSecretKey === actualSecretKey?.SecretId) {
      return Promise.resolve(secretValue);
    }
    return Promise.resolve(undefined);
  });
};
describe('getSecretValue()', () => {
  beforeEach(() => {
    mockSecretsManager.reset();
  });

  it('should fail on non-existent secret', async () => {
    mockSecretString('MY-SECRET-KEY', 'MY-SECRET-VALUE');
    await expect(getSecretValue('any')).rejects.toThrow('does not exist');
  });

  it('should correctly retrieve existing string secret', async () => {
    mockSecretString('MY-SECRET-KEY', 'MY-SECRET-VALUE');
    await expect(getSecretValue('MY-SECRET-KEY')).resolves.toBe(
      'MY-SECRET-VALUE',
    );
  });

  it('should correctly retrieve existing binary secret', async () => {
    mockSecretBinary('MY-SECRET-KEY', 'MY-SECRET-VALUE');
    await expect(getSecretValue('MY-SECRET-KEY')).resolves.toBe(
      'MY-SECRET-VALUE',
    );
  });

  it('should fail on secret with no recognizable value format', async () => {
    mockSecretValue('MY-SECRET-KEY', { SecretFoo: 'MY-SECRET-VALUE' });
    await expect(getSecretValue('MY-SECRET-KEY')).rejects.toThrow(
      'one of',
    );
  });

  const mockSecretString = (expectedSecretKey: string, secretValue: string) => {
    mockSecretValue(expectedSecretKey, { SecretString: secretValue });
  };

  const mockSecretBinary = (expectedSecretKey: string, secretValue: string) => {
    mockSecretValue(expectedSecretKey, {
      SecretBinary: Buffer.from(secretValue, 'utf-8'),
    });
  };
});
