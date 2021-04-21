import {processStreamEvent} from "../../src/functions/process-stream-event";
import {handler} from "../../src/handler";
import {config} from "aws-sdk";
import {CredentialsOptions} from "aws-sdk/lib/credentials";

describe("handler", () => {
    const oldEnv = process.env;
    const oldCredentials: CredentialsOptions = config.credentials as CredentialsOptions;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...oldEnv };
        config.credentials = { ...oldCredentials };
    });

    afterEach(() => {
        process.env = oldEnv;
        config.credentials = oldCredentials;
    });

    it("should use local credentials when BRANCH is undefined", () => {
        (processStreamEvent as jest.Mock) = jest.fn();

        // @ts-ignore
        handler(null, null, null);

        const credentials = config.credentials;

        expect(credentials?.accessKeyId).toEqual("accessKey1");
        expect(credentials?.secretAccessKey).toEqual("verySecretKey1");
    });

    it("should use local credentials when BRANCH is 'local'", () => {
        process.env.BRANCH = "local";

        (processStreamEvent as jest.Mock) = jest.fn();

        // @ts-ignore
        handler(null, null, null);

        const credentials = config.credentials;

        expect(credentials?.accessKeyId).toEqual("accessKey1");
        expect(credentials?.secretAccessKey).toEqual("verySecretKey1");
    });
});
