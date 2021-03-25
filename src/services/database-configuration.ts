import {PoolOptions} from "mysql2";

const poolConfig: PoolOptions = {
    connectionLimit: 10,
    host: "localhost",
    port: 49156,
    user: "root",
    password: "12345",
    database: "vott_db"
};

export const getConnectionPoolConfiguration = (): PoolOptions => {
    return poolConfig;
};
