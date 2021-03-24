import {PoolConfig} from "mysql";

const poolConfig: PoolConfig = {
    connectionLimit: 10,
    host: "localhost",
    port: 49156,
    user: "root",
    password: "12345",
    database: "vott_db"
};

export const getConnectionPoolConfiguration = (): PoolConfig => {
    return poolConfig;
};
