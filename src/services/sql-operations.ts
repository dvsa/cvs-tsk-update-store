import { OperationType } from '@aws-sdk/client-dynamodb-streams';

export type SqlOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export const deriveSqlOperation = (
  operationType: OperationType,
): SqlOperation => {
  switch (operationType) {
    case 'INSERT':
      return 'INSERT';
    case 'MODIFY':
      return 'UPDATE';
    case 'REMOVE':
      return 'DELETE';
    default:
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`unrecognized operation type ${operationType}`);
  }
};
