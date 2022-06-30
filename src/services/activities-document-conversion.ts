import { Activity, parseActivity } from "../models/activity";
import { ActivitiesUpsertResult } from "../models/upsert-results";
import { getConnectionPool } from "./connection-pool";
import {EntityConverter} from "./entity-conversion";
import { debugLog } from "./logger";
import { executeFullUpsert, executePartialUpsertIfNotExists } from "./sql-execution";
import { ACTIVITY_TABLE, TESTER_TABLE, TEST_STATION_TABLE, WAIT_REASON_TABLE } from "./table-details";
import {Connection} from "mysql2/promise";

export const activitiesDocumentConverter = (): EntityConverter<Activity> => {
    return {
        parseRootImage: parseActivity,
        upsertEntity: upsertActivity,
        deleteEntity: deleteActivity
    };
};

const upsertActivity = async (activity: Activity): Promise<ActivitiesUpsertResult[]> => {
    debugLog(`upsertActivity: START`);

    const pool = await getConnectionPool();
    const upsertResults: ActivitiesUpsertResult[] = [];
    const activityConnection = await pool.getConnection();

    try {
        await activityConnection.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED");

        const testStationId = await upsertTestStation(activityConnection, activity);
        const testerId = await upsertTester(activityConnection, activity);

        debugLog(`upsertActivity: Upserting activity..`);
        await activityConnection.beginTransaction();

        const response = await executeFullUpsert(
            ACTIVITY_TABLE,
            [
                testStationId,
                testerId,
                activity.id,
                activity.parentId,
                activity.activityType,
                activity.startTime,
                activity.endTime,
                activity.notes
            ],
            activityConnection
        );

        const activityId = response.rows.insertId;
        const waitReasonIds = await upsertWaitReasons(activityConnection, activityId, activity);

        await activityConnection.commit();

        upsertResults.push({activityId, testStationId, testerId, waitReasonIds});
    } catch (err) {
        console.error(err);
        await activityConnection.rollback();
        throw err;
    } finally {
        activityConnection.release();
    }

    return upsertResults;
};

const deleteActivity = async (activity: Activity): Promise<void> => {
    throw new Error("deleting activities is not implemented yet");
};

const upsertTestStation = async (connection: Connection, activity: Activity): Promise<number> => {
    debugLog(`upsertTestStation: Upserting test station...`);

    const response = await executePartialUpsertIfNotExists(
        TEST_STATION_TABLE,
        [
            activity.testStationPNumber,
            activity.testStationName,
            activity.testStationType
        ],
        connection
    );

    debugLog(`upsertTestStation: Upserted test station (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertTester = async (connection: Connection, activity: Activity): Promise<number> => {
    debugLog(`upsertTester: Upserting tester...`);

    const response = await executePartialUpsertIfNotExists(
        TESTER_TABLE,
        [
            activity.testerStaffId,
            activity.testerName,
            activity.testerEmail,
        ],
        connection
    );

    debugLog(`upsertTester: Upserted tester (ID: ${response.rows.insertId})`);

    return response.rows.insertId;
};

const upsertWaitReasons = async (connection: Connection, activityId: string, activity: Activity): Promise<number[]> => {
    debugLog(`upsertWaitReasons: Upserting wait reason (activity-id: ${activityId})...`);

    if (!activity.waitReason) {
        debugLog(`upsertWaitReasons: no wait reasons present`);
        return [];
    }

    const insertedIds: number[] = [];

    debugLog(`upsertWaitReasons: ${activity.waitReason.length} wait reasons to upsert`);

    for (const reason of activity.waitReason) {
        const response = await executeFullUpsert(
            WAIT_REASON_TABLE,
            [
                activityId,
                reason
            ],
            connection
        );

        debugLog(`upsertWaitReasons: Upserted wait reason (activity-id: ${activityId}, ID: ${response.rows.insertId})`);

        insertedIds.push(response.rows.insertId);
    }

    return insertedIds;
};
