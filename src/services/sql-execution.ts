import {executeSql, QueryResponse} from "./connection-pool";
import {Connection} from "mysql2/promise";
import {TableDetails} from "./table-details";
import {generateFullUpsertSql, generatePartialUpsertSql} from "./sql-generation";

export const executePartialUpsert = (tableDetails: TableDetails, values: any[], connection: Connection): Promise<QueryResponse> => {
    return executeSql(
        generatePartialUpsertSql(tableDetails),
        values,
        connection
    );
};

export const executeFullUpsert = async (tableDetails: TableDetails, values: any[], connection: Connection): Promise<QueryResponse> => {
    values = values.concat(values.slice());

    return executeSql(
        generateFullUpsertSql(tableDetails),
        values,
        connection
    );
};
