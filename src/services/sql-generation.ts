export const generatePartialUpsertSql = (tableName: string, columnNames: string[], primaryKeyColumn?: string): string => {
    return generateUpsertSql(tableName, columnNames, generateUpdatePlaceholders(primaryKeyColumn));
};

export const generateFullUpsertSql = (tableName: string, columnNames: string[], primaryKeyColumn?: string): string => {
    return generateUpsertSql(tableName, columnNames, generateUpdatePlaceholders(primaryKeyColumn, columnNames));
};

const generateUpsertSql = (tableName: string, columnNames: string[], updatePlaceholders: string[]): string => {
    return `INSERT INTO \`${tableName}\` (${columnNames.map((c) => `\`${c}\``).join(", ")})`
        + ` VALUES (${(nCopies(columnNames.length, "?").join(", "))})`
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
