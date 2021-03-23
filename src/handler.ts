import {processStreamEvent} from "./functions/process-stream-event";
import {config as AWSConfig} from "aws-sdk";

const isOffline: boolean = (!process.env.BRANCH || process.env.BRANCH === "local");

if (isOffline) {
    AWSConfig.credentials = {
        accessKeyId: "accessKey1",
        secretAccessKey: "verySecretKey1"
    };
}

export {processStreamEvent as handler};
