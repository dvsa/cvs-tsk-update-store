import {DynamoDbImage, parseStringArray} from "../services/dynamodb-images";
import {debugLog} from "../services/logger";

// https://wiki.dvsacloud.uk/pages/viewpage.action?spaceKey=HVT&title=Technical+API+Changelog
// API_Vehicle_Tech_Records_v32.yaml
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
    debugLog("Parsing tech records...");

    return {
        id: image.getString("id"),
        activityType: image.getString("activityType"),
        activityDay: image.getString("activityDay"),
        startTime: image.getDate("startTime"),
        endTime: image.getDate("endTime"),
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
