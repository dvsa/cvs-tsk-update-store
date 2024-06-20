import { executeSql } from '../../src/services/connection-pool';
import {
  allTables, TableDetails,
} from '../../src/services/table-details';

export const databaseTearDown = async () => {
  const tables: TableDetails[] = allTables();
  await executeSql('SET FOREIGN_KEY_CHECKS=0');
  for (const table of tables) {
    /* eslint-disable no-await-in-loop */
    await executeSql(`TRUNCATE TABLE ${table.tableName}`);
  }
  await executeSql('SET FOREIGN_KEY_CHECKS=1');
};
