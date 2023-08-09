export interface BatchItemFailuresResponse {
  batchItemFailures: BatchItemIdentifiers[];
}

interface BatchItemIdentifiers {
  itemIdentifier: string;
}
