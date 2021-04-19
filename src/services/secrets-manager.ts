import {SecretsManager} from "aws-sdk";

export const getSecretValue = async (secretName: string): Promise<string> => {
    // This constructor is inside the function for testability (Jest hoisting is a pain).
    // It's only called once per lambda execution, so this shouldn't affect performance.
    // Please refactor if the above is ever not the case :)
    const secretsManager: SecretsManager = new SecretsManager();

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
