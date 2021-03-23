import * as mysql from "mysql";
import {FieldInfo, Pool, PoolConfig} from "mysql";

const poolConfig: PoolConfig = {
    connectionLimit: 10,
    host: "localhost",
    port: 49156,
    user: "root",
    password: "12345",
    database: "vott_db"
};

let pool: Pool | undefined;

export const getOrCreatePool = (): Pool => {
    if (!pool) {
        pool = mysql.createPool(poolConfig);
    }
    return pool;
};

export const destroyPool = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        if (pool) {
            pool.end((err) => {
                reject(err);
            });
        }
        resolve();
    });
};

export interface QueryResponse {
    results?: any;
    fields?: FieldInfo[];
}

export const query = (sql: string, templateVariables?: any[]): Promise<QueryResponse> => {
    return new Promise<QueryResponse>((resolve, reject) => {
        getOrCreatePool().query(sql, templateVariables, (error, results, fields) => {
            if (error) {
                reject(error);
                return;
            }
            resolve({
                results,
                fields
            });
        });
    });
};
