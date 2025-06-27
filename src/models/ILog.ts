interface ILog {
  timestamp: string;
  changeType: string | null;
  identifier: string | null;
  operationType: string | null;
  statusCode?: string | null;
  testResultId?: string | null;
  techRecordVIN?: string | null;
  techRecordSystemNumber?: string | null;
  serviceState?: string | null;
  eventId?: string | null;
}
