import {DynamoDbImage} from "../services/dynamodb-images";
import {Maybe} from "./optionals";

export interface AuthIntoService {
    cocIssueDate?: string;
    dateReceived?: string;
    datePending?: string;
    dateAuthorised?: string;
    dateRejected?: string;
}

export const parseAuthIntoService = (authIntoService?: DynamoDbImage): Maybe<AuthIntoService> => {
    if (!authIntoService) {
        return undefined;
    }

    return {
        cocIssueDate: authIntoService.getString("cocIssueDate"),
        dateAuthorised: authIntoService.getString("dateAuthorised"),
        datePending: authIntoService.getString("datePending"),
        dateReceived: authIntoService.getString("dateReceived"),
        dateRejected: authIntoService.getString("dateRejected")
    };
};
