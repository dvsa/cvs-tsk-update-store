import path from "path";

// DO NOT MOVE THIS FILE.

const resourcesDirectory = path.resolve(__dirname, "../resources");

export const pathToResources = (): string => {
    return resourcesDirectory;
};
