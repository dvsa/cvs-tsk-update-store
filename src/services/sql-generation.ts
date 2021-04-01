import {TableDetails} from "./table-details";

export const generatePartialUpsertSql = (tableDetails: TableDetails, primaryKeyColumn?: string): string => {
    return generateUpsertSql(tableDetails, generateUpdatePlaceholders(primaryKeyColumn));
};

export const generateFullUpsertSql = (tableDetails: TableDetails, primaryKeyColumn?: string): string => {
    return generateUpsertSql(tableDetails, generateUpdatePlaceholders(primaryKeyColumn, tableDetails.columnNames));
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
