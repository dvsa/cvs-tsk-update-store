import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { debugLog } from "./logger";

export const getSecretValue = async (secretName: string): Promise<string> => {
  // This constructor is inside the function for testability (Jest hoisting is a pain).
  // It's only called once per lambda execution, so this shouldn't affect performance.
  // Please refactor if the above is ever not the case :)
  const secretsManager = new SecretsManagerClient();

  debugLog(`Fetching secret '${secretName}' from AWS Secrets Manager`);

  const secretValue = await secretsManager.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    }),
  );

  if (!secretValue) {
    throw new Error(`secret '${secretName}' does not exist`);
  }

  if (secretValue.SecretString) {
    return secretValue.SecretString;
  } else if (secretValue.SecretBinary) {
    return secretValue.SecretBinary.toString();
  }

  throw new Error(
    `secret '${secretName}' must contain one of ['SecretString', 'SecretBinary']`
  );
};
