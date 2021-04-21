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
