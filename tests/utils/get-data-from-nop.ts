import { QueryResponse, executeSql } from "../../src/services/connection-pool"

export const getVehicleBySysNumber = async (systemNumber: string):
Promise<QueryResponse> => {
    return await executeSql(
        `SELECT \`system_number\`, \`vin\`, \`id\`
              FROM \`vehicle\`
              WHERE \`vehicle\`.\`system_number\` = "${systemNumber}"`,
      );
}

// export const getVehicleBySysNumber = (systemNumber: string): string => {

//     return `SELECT \`system_number\`, \`vin\`, \`id\`
//             FROM \`vehicle\` 
//             WHERE \`vehicle\`.\`system_number\` = "${systemNumber}"`

// }