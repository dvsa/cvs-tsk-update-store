import {PoolOptions} from "mysql2/promise";
import {getSecretValue} from "./secrets-manager";
import {SecretsManagerConfig} from "../models/aws-sm-config";

export const getConnectionPoolOptions = async (): Promise<PoolOptions> => {
    const config: SecretsManagerConfig = await getConfig();
    return {
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: process.env.SCHEMA_NAME,
        connectionLimit: 1000,
    };
};

const getConfig = async (): Promise<SecretsManagerConfig> => {
    const configJson = await getSecretValue(process.env.SECRET!);
    return JSON.parse(configJson) as SecretsManagerConfig;
};
