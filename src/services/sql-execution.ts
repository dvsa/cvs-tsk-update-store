import {executeSql, QueryResponse} from "./connection-pool";
import {Connection} from "mysql2/promise";
import {TableDetails} from "./table-details";
import {generateFullUpsertSql, generateSelectSql, generatePartialUpsertSql} from "./sql-generation";

/**
 * Execute a "partial upsert" on a fingerprinted table:
 * - if a matching fingerprint exists, return the existing entity's ID
 * - if a matching fingerprint does not exist, insert a new fingerprinted record and return its ID
 *
 * A "fingerprint" is a hash value derived from all table attributes excluding the primary key.
 *
 * @param tableDetails
 * @param templateVariables
 * @param connection
 */
export const executePartialUpsert = (tableDetails: TableDetails, templateVariables: any[], connection: Connection): Promise<QueryResponse> => {
    return executeSql(
        generatePartialUpsertSql(tableDetails),
        templateVariables,
        connection
    );
};

/**
 * Execute a "select or partial upsert" on a fingerprinted table:
 * - if a matching fingerprint exists (run SELECT first), return the existing entity's ID
 * - if a matching fingerprint does not exist, insert a new fingerprinted record and return its ID
 *
 * A "fingerprint" is a hash value derived from all table attributes excluding the primary key.
 *
 * @param tableDetails
 * @param templateVariables
 * @param connection
 */
export const executePartialUpsertIfNotExists = async (tableDetails: TableDetails, templateVariables: any[], connection: Connection): Promise<QueryResponse> => {
    const selectResultSet = await executeSql(
        generateSelectSql(tableDetails),
        templateVariables,
        connection
    );

    if (selectResultSet.rows.length === 0) {
        return executeSql(
            generatePartialUpsertSql(tableDetails),
            templateVariables,
            connection
        );
    } else {
        return {rows: selectResultSet.rows[0], fields: selectResultSet.fields};
    }
};

/**
 * Execute a "full upsert" on a table:
 * - if a matching unique key exists, update all entity attributes and return the existing entity's ID
 * - if a matching unique key does not exists, insert a new record and return its ID
 *
 * @param tableDetails
 * @param templateVariables
 * @param connection
 */
export const executeFullUpsert = async (tableDetails: TableDetails, templateVariables: any[], connection: Connection): Promise<QueryResponse> => {
    templateVariables = templateVariables.concat(templateVariables.slice());

    return executeSql(
        generateFullUpsertSql(tableDetails),
        templateVariables,
        connection
    );
};
