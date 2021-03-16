import {RDSDataService} from "aws-sdk";
import {
    DbName,
    ExecuteStatementRequest,
    ExecuteStatementResponse,
    SqlParametersList,
    SqlStatement
} from "aws-sdk/clients/rdsdataservice";
import util from "util";
import {DB_OPERATIONS} from "../handler";

export interface DatabaseEntity {
    tableName: string;
    databaseName: () => DbName;
    insertStatement: () => SqlStatement;
    updateStatement: () => SqlStatement;
    deleteStatement: () => SqlStatement;
    sqlParameters: () => SqlParametersList;
}

/**
 * placeholder
 */
export class DatabaseOperations extends RDSDataService {

    public executeStatementPromise: (request: ExecuteStatementRequest) => Promise<ExecuteStatementResponse>;

    constructor() {
        super();
        this.executeStatementPromise = util.promisify(this.executeStatement);
    }
}

export const executeStatement = async (sql: SqlStatement, entity: DatabaseEntity): Promise<ExecuteStatementResponse> => {
    return DB_OPERATIONS.executeStatementPromise({
        resourceArn: process.env.AWS_AURORA_ARN!,
        secretArn: process.env.AWS_AURORA_SECRET!,
        sql,
        database: entity.databaseName(),
        parameters: entity.sqlParameters(),
    });
};
