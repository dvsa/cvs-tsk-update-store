import { DynamoDbImage } from '../services/dynamodb-images';
import { Maybe } from './optionals';

export interface AuthIntoService {
  cocIssueDate?: string;
  dateReceived?: string;
  datePending?: string;
  dateAuthorised?: string;
  dateRejected?: string;
}

export const parseAuthIntoService = (
  authIntoServiceImage?: DynamoDbImage,
): Maybe<AuthIntoService> => {
  const authIntoService = {
    cocIssueDate: authIntoServiceImage?.getString('cocIssueDate'),
    dateReceived: authIntoServiceImage?.getString('dateReceived'),
    datePending: authIntoServiceImage?.getString('datePending'),
    dateAuthorised: authIntoServiceImage?.getString('dateAuthorised'),
    dateRejected: authIntoServiceImage?.getString('dateRejected'),
  };

  for (const value of Object.values(authIntoService)) {
    if (value) {
      return authIntoService;
    }
  }

  return undefined;
};
