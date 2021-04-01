import {PoolOptions} from "mysql2";

const poolConfig: PoolOptions = {
    connectionLimit: 10,
    host: "localhost",
    port: 3306,
    user: "root",
    password: "12345",
    database: "CVSBNOP"
};

export const getPoolOptions = (): PoolOptions => {
    return poolConfig;
};
