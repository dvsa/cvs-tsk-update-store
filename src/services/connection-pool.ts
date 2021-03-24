import * as mysql from "mysql";
import {FieldInfo, Pool} from "mysql";
import {getConnectionPoolConfiguration} from "./database-configuration";
import {Maybe} from "../models/optionals";

let pool: Maybe<Pool>;

export const getConnectionPool = (): Pool => {
    if (!pool) {
        pool = mysql.createPool(getConnectionPoolConfiguration());
    }
    return pool;
};

export const destroyConnectionPool = async (): Promise<void> => {
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
        getConnectionPool().query(sql, templateVariables, (error, results, fields) => {
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
