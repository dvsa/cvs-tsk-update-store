import {executeSql} from "../../src/services/connection-pool";
import {allTables, TableDetails} from "../../src/services/table-details";

export const databaseTearDown = async () => {
    // only run if database is not containerized - no point in tearing down data on an ephemeral environment
    if (!process.env.USE_CONTAINERIZED_DATABASE || process.env.USE_CONTAINERIZED_DATABASE === "0") {
        const tables: TableDetails[] = allTables();
        for (const table of tables) {
            await executeSql(`TRUNCATE TABLE ${table.tableName}`);
        }
    }
};
