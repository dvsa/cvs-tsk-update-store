import {TableDetails} from "./table-details";

/**
 * Generate partial upsert SQL. See sql-execution.ts for a definition of partial upsert.
 *
 * @param tableDetails the table to generate upsert SQL for
 */
export const generatePartialUpsertSql = (tableDetails: TableDetails): string => {
    return generateUpsertSql(
        tableDetails,
        generateUpdatePlaceholders(tableDetails.primaryKeyColumnName)
    );
};

/**
 * Generate full upsert SQL. See sql-execution.ts for a definition of full upsert.
 *
 * @param tableDetails the table to generate upsert SQL for
 */
export const generateFullUpsertSql = (tableDetails: TableDetails): string => {
    return generateUpsertSql(
        tableDetails,
        generateUpdatePlaceholders(tableDetails.primaryKeyColumnName, tableDetails.columnNames)
    );
};

/**
 * Generate select SQL statement. See sql-execution.ts for a definition of partial upsert if record already exists.
 *
 * @param tableDetails the table to generate select statement for
 */
export const generateSelectSql = (tableDetails: TableDetails): string => {
    const query = `SELECT id insertId FROM \`${tableDetails.tableName}\` WHERE fingerprint = MD5(CONCAT_WS('|', ${(nCopies(tableDetails.columnNames.length, "IFNULL(?, '')").join(", "))}))`;
    return query;
};

export const generateDeleteBasedOnWhereIn = (targetTableName: string, targetColumnName: string, conditionAttributes: any[]): string => {
    return `DELETE FROM ${targetTableName} WHERE ${targetColumnName} IN (${Object.entries(conditionAttributes)
        .map(() => {
            return `?`;
        })
    })`;
};

export const generateSelectRecordIds = (targetTableName: string, conditionAttributes: { [key: string]: any; }): string => {
    return `SELECT id FROM ${targetTableName} WHERE ${Object.entries(conditionAttributes)
        .map(([key]) => {
            return `${key}=?`;
        }).join(" AND ")}`;
};

const generateUpsertSql = (tableDetails: TableDetails, updatePlaceholders: string[]): string => {
    return `INSERT INTO \`${tableDetails.tableName}\` (${tableDetails.columnNames.map((c) => `\`${c}\``).join(", ")})`
        + ` VALUES (${(nCopies(tableDetails.columnNames.length, "?").join(", "))})`
        + ` ON DUPLICATE KEY UPDATE ${updatePlaceholders.join(", ")}`;
};

const generateUpdatePlaceholders = (primaryKeyColumn?: string, columnNames?: string[]): string[] => {
    if (!primaryKeyColumn) {
        primaryKeyColumn = "id";
    }

    const primaryKeyPlaceholder = `\`${primaryKeyColumn}\` = LAST_INSERT_ID(\`${primaryKeyColumn}\`)`;

    if (!columnNames) {
        return [ primaryKeyPlaceholder ];
    }

    return [ primaryKeyPlaceholder ].concat(
        columnNames
            .filter((c) => c !== primaryKeyColumn)
            .map((c) => `\`${c}\` = ?`)
    );
};

const nCopies = (n: number, s: string): string[] => {
    return Array.from({length: n}).map((_: any) => s);
};
