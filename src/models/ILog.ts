interface ILog {
  timestamp: string;
  changeType: string;
  identifier: string;
  operationType: string;
  statusCode?: string;
  testResultId?: string;
}
