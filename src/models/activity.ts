import {DynamoDbImage, parseStringArray} from "../services/dynamodb-images";
import {debugLog} from "../services/logger";

export interface Activity {
    id?: string;
    activityType?: string;
    activityDay?: string;
    startTime?: string;
    endTime?: string;
    testerStaffId?: string;
    testerName?: string;
    testerEmail?: string;
    testStationType?: string;
    testStationName?: string;
    testStationPNumber?: string;
    testStationEmail?: string;
    parentId?: string;
    notes?: string;
    waitReason?: string[];
}

export const parseActivity = (image: DynamoDbImage): Activity => {
    debugLog("Parsing activity...");

    return {
        id: image.getString("id"),
        activityType: image.getString("activityType"),
        activityDay: image.getString("activityDay"),
        startTime: image.getDateTime("startTime"),
        endTime: image.getDateTime("endTime"),
        testerStaffId: image.getString("testerStaffId"),
        testerName: image.getString("testerName"),
        testerEmail: image.getString("testerEmail"),
        testStationType: image.getString("testStationType"),
        testStationName: image.getString("testStationName"),
        testStationPNumber: image.getString("testStationPNumber"),
        testStationEmail: image.getString("testStationEmail"),
        parentId: image.getString("parentId"),
        notes: image.getString("notes"),
        waitReason: parseStringArray(image.getList("waitReason")),
    };
};
