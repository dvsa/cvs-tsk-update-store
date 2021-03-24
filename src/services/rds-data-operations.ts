import {RDSDataService} from "aws-sdk";
import {
    ExecuteStatementRequest,
    ExecuteStatementResponse,
    SqlParametersList,
    SqlStatement
} from "aws-sdk/clients/rdsdataservice";
import util from "util";

/**
 * placeholder
 */
export class RdsDataOperations extends RDSDataService {

    public executeStatementPromise: (request: ExecuteStatementRequest) => Promise<ExecuteStatementResponse>;

    constructor() {
        super();
        this.executeStatementPromise = util.promisify(this.executeStatement);
    }
}

export const executeStatement = async (sql: SqlStatement, sqlParameters: SqlParametersList): Promise<number> => {
    const dbOperations = new RdsDataOperations();
    const response: ExecuteStatementResponse = await dbOperations.executeStatementPromise({
        resourceArn: process.env.AWS_AURORA_ARN!,
        secretArn: process.env.AWS_AURORA_SECRET!,
        sql,
        database: "vott_db",
        parameters: sqlParameters,
        includeResultMetadata: true
    });

    return 1;

    // return response.generatedFields ? response.generatedFields[0].longValue | -1;
};

export const getFields = (response: ExecuteStatementResponse): any => {
    if (!response) {
        throw new Error("no response from database");
    }

    if (!response.columnMetadata) {
        throw new Error("no column metadata included with response - please specify 'includeMetadata: true'");
    }

    const columnNames: string[] = [];
    const rows: any[] = [];

    response.columnMetadata.map((v) => {
        columnNames.push(v.name!);
    });

    if (response.records) {
        response.records.map((record) => {
            const row: any = {};
            record.map((column, i) => {
                if (column.stringValue !== undefined) {
                    row[columnNames[i]] = column.stringValue;
                } else if (column.blobValue !== undefined) {
                    row[columnNames[i]] = column.blobValue;
                } else if (column.doubleValue !== undefined) {
                    row[columnNames[i]] = column.doubleValue;
                } else if (column.longValue !== undefined) {
                    row[columnNames[i]] = column.longValue;
                } else if (column.booleanValue !== undefined) {
                    row[columnNames[i]] = column.booleanValue;
                } else if (column.isNull) {
                    row[columnNames[i]] = null;
                }
            });
            rows.push(row);
        });
    }

    return rows;
};
