import * as mysql2 from "mysql2/promise";
import {FieldPacket, Pool} from "mysql2/promise";
import {Maybe} from "../models/optionals";
import {PoolOptions} from "mysql2";

export interface QueryResponse {
    rows?: any;
    fields?: FieldPacket[];
}

let pool: Maybe<Pool>;

const poolConfig: PoolOptions = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "12345",
    database: "CVSBNOP"
};

export const getPoolOptions = (): PoolOptions => {
    return poolConfig;
};

export const getConnectionPool = (): Pool => {
    if (!pool) {
        pool = mysql2.createPool(getPoolOptions());
    }
    return pool;
};

export const destroyConnectionPool = async (): Promise<void> => {
    if (pool) {
        await pool.end();
    }
};

export const execute = async (sql: string, templateVariables?: any[]): Promise<QueryResponse> => {
    if (templateVariables) {
        templateVariables = undefinedToNull(templateVariables);
    }
    const [rows, fields] = await getConnectionPool().execute(sql, templateVariables);
    return {
        rows,
        fields
    };
};

export const undefinedToNull = (array: any[]): any[] => {
    array.forEach((v, i) => {
        if (v === undefined) {
            array[i] = null;
        }
    });
    return array;
};
