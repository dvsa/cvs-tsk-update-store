import * as mysql2 from "mysql2/promise";
import {Connection, FieldPacket, Pool} from "mysql2/promise";
import {Maybe} from "../models/optionals";
import {getConnectionPoolOptions} from "./connection-pool-options";

export interface QueryResponse {
    rows?: any;
    fields?: FieldPacket[];
}

// Lazy
let pool: Maybe<Pool>;

export const getConnectionPool = async (): Promise<Pool> => {
    if (!pool) {
        const config = await getConnectionPoolOptions();
        pool = mysql2.createPool(config);
    }
    return pool;
};

export const destroyConnectionPool = async (): Promise<void> => {
    if (pool) {
        await pool.end();
        pool = undefined;
    }
};

export const executeSql = async (sql: string, templateVariables?: any[], connection?: Connection): Promise<QueryResponse> => {
    if (templateVariables) {
        templateVariables = undefinedToNull(templateVariables);
    }

    if (connection) {
        const [rows, fields] = await connection.execute(sql, templateVariables);
        return { rows, fields };
    } else {
        const connectionPool = await getConnectionPool();
        const [rows, fields] = await connectionPool.execute(sql, templateVariables);
        return { rows, fields };
    }
};

// npm packages mysql and mysql2 will throw an error on encountering JS "undefined".
// In contrast, an explicit JS "null" translates to SQL "NULL".
// hence, transform all "undefined" to "null".
const undefinedToNull = (array: any[]): any[] => {
    array.forEach((v, i) => {
        if (v === undefined) {
            array[i] = null;
        }
    });
    return array;
};
