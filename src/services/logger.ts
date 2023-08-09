export const debugLog = (message?: any, ...optionalParams: any[]) => {
  if (process.env.DEBUG) {
    console.info(message, optionalParams);
  }
};
