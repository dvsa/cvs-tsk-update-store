import { Activity, parseActivity } from "../models/activity";
import { ActivitiesUpsertResult } from "../models/upsert-results";
import { getConnectionPool } from "./connection-pool";
import {EntityConverter} from "./entity-conversion";
import { debugLog } from "./logger";
import { executeFullUpsert } from "./sql-execution";
import { ACTIVITIES_TABLE } from "./table-details";

export const activitiesDocumentConverter = (): EntityConverter<Activity> => {
    return {
        parseRootImage: parseActivity,
        upsertEntity: upsertActivities,
        deleteEntity: deleteActivities
    };
};

const upsertActivities = async (activity: Activity): Promise<ActivitiesUpsertResult[]> => {
    debugLog(`upsertTechRecords: START`);

    const pool = await getConnectionPool();
    const activityConnection = await pool.getConnection();
    const upsertResults: ActivitiesUpsertResult[] = [];

    try {
        await activityConnection.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED");

        debugLog(`upsertTechRecords: Upserting tech record..`);
        await activityConnection.beginTransaction();

        const response = await executeFullUpsert(
            ACTIVITIES_TABLE,
            [
                activity.id,
                activity.activityType,
                activity.activityDay,
                activity.startTime,
                activity.endTime,
                activity.testerStaffId,
                activity.testerName,
                activity.testerEmail,
                activity.testStationType,
                activity.testStationName,
                activity.testStationPNumber,
                activity.testStationEmail,
                activity.parentId,
                activity.notes,
                activity.waitReason
            ],
            activityConnection
        );

        const activityId = response.rows.insertId;
        upsertResults.push({activityId});
    } catch (err) {
        console.error(err);
        await activityConnection.rollback();
        throw err;
    } finally {
        activityConnection.release();
    }

    return upsertResults;
};

const deleteActivities = async (activity: Activity): Promise<void> => {
    throw new Error("deleting tech record documents is not implemented yet");
};
