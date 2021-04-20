import {getSecretValue} from "../../../src/services/secrets-manager";
import {SecretsManager} from "aws-sdk";

jest.mock("aws-sdk");

describe("getSecretValue()", () => {

    beforeEach(() => {
        // @ts-ignore
        SecretsManager.mockClear();
    });

    it("should fail on non-existent secret", async () => {
        mockSecretString("MY-SECRET-KEY", "MY-SECRET-VALUE");
        await expect(getSecretValue("any")).rejects.toThrowError("does not exist");
    });

    it("should correctly retrieve existing string secret", async () => {
        mockSecretString("MY-SECRET-KEY", "MY-SECRET-VALUE");
        await expect(getSecretValue("MY-SECRET-KEY")).resolves.toEqual("MY-SECRET-VALUE");
    });

    it("should correctly retrieve existing binary secret", async () => {
        mockSecretBinary("MY-SECRET-KEY", "MY-SECRET-VALUE");
        await expect(getSecretValue("MY-SECRET-KEY")).resolves.toEqual("MY-SECRET-VALUE");
    });

    it("should fail on secret with no recognizable value format", async () => {
        mockSecretValue("MY-SECRET-KEY", { SecretFoo: "MY-SECRET-VALUE" });
        await expect(getSecretValue("MY-SECRET-KEY")).rejects.toThrowError("one of");
    });

    const mockSecretString = (expectedSecretKey: string, secretValue: string) => {
        mockSecretValue(expectedSecretKey, { SecretString: secretValue });
    };

    const mockSecretBinary = (expectedSecretKey: string, secretValue: string) => {
        mockSecretValue(expectedSecretKey, { SecretBinary: Buffer.from(secretValue, "utf-8") });
    };

    const mockSecretValue = (expectedSecretKey: string, secretValue: any) => {
        // @ts-ignore
        SecretsManager.mockImplementation(() => ({
            getSecretValue: jest.fn().mockImplementation((actualSecretKey) => ({
                promise: jest.fn().mockImplementation(() => {
                    if (expectedSecretKey === actualSecretKey?.SecretId) {
                        return Promise.resolve(secretValue);
                    }
                    return Promise.resolve(undefined);
                })
            }))
        }));
    };
});
