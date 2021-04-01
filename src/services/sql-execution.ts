import {execute, QueryResponse} from "./connection-pool";

export const executePartialUpsert = (sql: string, values: any[]) => {
    return execute(sql, values);
};

export const executeFullUpsert = async (sql: string, values: any[]): Promise<QueryResponse> => {
    values = values.concat(values.slice());
    return execute(sql, values);
};
