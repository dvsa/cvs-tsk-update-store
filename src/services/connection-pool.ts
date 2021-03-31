import * as mysql2 from "mysql2/promise";
import {FieldPacket, Pool} from "mysql2/promise";
import {getConnectionPoolConfiguration} from "./database-configuration";
import {Maybe} from "../models/optionals";

export interface QueryResponse {
    rows?: any;
    fields?: FieldPacket[];
}

let pool: Maybe<Pool>;

export const getConnectionPool = (): Pool => {
    if (!pool) {
        pool = mysql2.createPool(getConnectionPoolConfiguration());
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
