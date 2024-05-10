import { getSecretValue } from "../../../src/services/secrets-manager";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { mockClient } from "aws-sdk-client-mock";

const mockSecretsManager = mockClient(SecretsManagerClient)
const mockSecretValue = (expectedSecretKey: string, secretValue: any) => {
  mockSecretsManager.on(GetSecretValueCommand).callsFake((actualSecretKey) => {
    if (expectedSecretKey === actualSecretKey?.SecretId) {
      return Promise.resolve(secretValue);
    }
    return Promise.resolve(undefined);
  });
};
describe("getSecretValue()", () => {
  beforeEach(() => {
    // @ts-ignore
    mockSecretsManager.reset();
  });

  it("should fail on non-existent secret", async () => {
    mockSecretString("MY-SECRET-KEY", "MY-SECRET-VALUE");
    await expect(getSecretValue("any")).rejects.toThrowError("does not exist");
  });

  it("should correctly retrieve existing string secret", async () => {
    mockSecretString("MY-SECRET-KEY", "MY-SECRET-VALUE");
    await expect(getSecretValue("MY-SECRET-KEY")).resolves.toEqual(
      "MY-SECRET-VALUE"
    );
  });

  it("should correctly retrieve existing binary secret", async () => {
    mockSecretBinary("MY-SECRET-KEY", "MY-SECRET-VALUE");
    await expect(getSecretValue("MY-SECRET-KEY")).resolves.toEqual(
      "MY-SECRET-VALUE"
    );
  });

  it("should fail on secret with no recognizable value format", async () => {
    mockSecretValue("MY-SECRET-KEY", { SecretFoo: "MY-SECRET-VALUE" });
    await expect(getSecretValue("MY-SECRET-KEY")).rejects.toThrowError(
      "one of"
    );
  });

  const mockSecretString = (expectedSecretKey: string, secretValue: string) => {
    mockSecretValue(expectedSecretKey, { SecretString: secretValue });
  };

  const mockSecretBinary = (expectedSecretKey: string, secretValue: string) => {
    mockSecretValue(expectedSecretKey, {
      SecretBinary: Buffer.from(secretValue, "utf-8"),
    });
  };
});
