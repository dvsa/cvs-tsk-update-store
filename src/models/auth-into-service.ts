import {DynamoDbImage} from "../services/dynamodb-images";

export interface AuthIntoService {
    cocIssueDate: string;
    dateReceived: string;
    datePending: string;
    dateAuthorised: string;
    dateRejected: string;
}

export const parseAuthIntoService = (authIntoService: DynamoDbImage): AuthIntoService => {
    return {
        cocIssueDate: authIntoService.getString("cocIssueDate"),
        dateAuthorised: authIntoService.getString("dateAuthorised"),
        datePending: authIntoService.getString("datePending"),
        dateReceived: authIntoService.getString("dateReceived"),
        dateRejected: authIntoService.getString("dateRejected")
    };
};

// TODO add authIntoServiceToTemplateVariables, whenever it's needed
