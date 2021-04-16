import {SecretsManager} from "aws-sdk";

const secretsManager: SecretsManager = new SecretsManager();

export const getSecretValue = async (secretName: string): Promise<string> => {
    console.info(`Fetching secret '${secretName}' from AWS Secrets Manager`);

    const secretValue = await secretsManager.getSecretValue({ SecretId: secretName }).promise();

    if (!secretValue) {
        throw new Error(`secret '${secretName}' does not exist`);
    }

    if (secretValue.SecretString) {
        return secretValue.SecretString;
    } else if (secretValue.SecretBinary) {
        return secretValue.SecretBinary.toString("utf-8");
    }

    throw new Error(`secret '${secretName}' must contain one of ['SecretString', 'SecretBinary']`);
};
