import {DynamoDbImage} from "../services/dynamodb-images";
import {Maybe} from "./optionals";

export interface AuthIntoService {
    cocIssueDate?: string;
    dateReceived?: string;
    datePending?: string;
    dateAuthorised?: string;
    dateRejected?: string;
}

export const parseAuthIntoService = (authIntoServiceImage?: DynamoDbImage): Maybe<AuthIntoService> => {
    const authIntoService = {
        cocIssueDate: authIntoServiceImage?.getString("cocIssueDate"),
        dateAuthorised: authIntoServiceImage?.getString("dateAuthorised"),
        datePending: authIntoServiceImage?.getString("datePending"),
        dateReceived: authIntoServiceImage?.getString("dateReceived"),
        dateRejected: authIntoServiceImage?.getString("dateRejected")
    };

    for (const value of Object.values(authIntoService)) {
        if (value) {
            return authIntoService;
        }
    }

    return undefined;
};
