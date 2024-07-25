export const debugLog = (message?: any, ...optionalParams: any[]) => {
  if (process.env.DEBUG) {
    console.info(message, optionalParams);
  }
};

let logManager: ILog[] = [];

export const createLogEntry = (): Partial<ILog> => ({
  timestamp: new Date().toISOString(),
});

export const updateLogEntry = (entry: Partial<ILog>, updates: Partial<ILog>) => Object.assign(entry, updates);

export const addToLogManager = (entry: Partial<ILog>) => logManager.push(<ILog>entry);

export const printLogs = () => console.log(JSON.stringify(logManager));

export const clearLogs = () => logManager = [];
