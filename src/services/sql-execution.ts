import {executeSql, QueryResponse} from "./connection-pool";
import {Connection} from "mysql2/promise";

export const executePartialUpsert = (sql: string, values: any[], connection: Connection) => {
    return executeSql(sql, values, connection);
};

export const executeFullUpsert = async (sql: string, values: any[], connection: Connection): Promise<QueryResponse> => {
    values = values.concat(values.slice());
    return executeSql(sql, values, connection);
};
