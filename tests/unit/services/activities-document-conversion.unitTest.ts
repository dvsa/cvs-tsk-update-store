import { Pool, PoolConnection } from "mysql2/promise";
import { Activity } from "../../../src/models/activity";
import { activitiesDocumentConverter } from "../../../src/services/activities-document-conversion";
import * as connectionPool from "../../../src/services/connection-pool";

describe("Activities document conversion", () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    describe("activitiesDocumentConverter", () => {
        it("returns a set of functions", () => {
            const response = activitiesDocumentConverter();

            expect(typeof response.parseRootImage).toEqual("function");
            expect(typeof response.deleteEntity).toEqual("function");
            expect(typeof response.upsertEntity).toEqual("function");
        });
    });

    describe("deleteActivity", () => {
        it("throws an error", async () => {
            const response = activitiesDocumentConverter();
            await expect(response.deleteEntity({})).rejects.toThrow();
        });
    });

    describe("upsertActivity", () => {
        let execute: jest.Mock;
        let beginTransaction: jest.Mock;
        let commit: jest.Mock;
        let rollback: jest.Mock;
        let release: jest.Mock;
        let connection: PoolConnection;
        let connectionPoolSpy: jest.SpyInstance;
        let activity: Activity;

        beforeEach(() => {
            execute = jest.fn().mockResolvedValue([[{insertId: 1}], {}]);
            beginTransaction = jest.fn();
            commit = jest.fn();
            rollback = jest.fn();
            release = jest.fn();
            connection = {
                execute,
                beginTransaction,
                commit,
                rollback,
                release
            } as unknown as PoolConnection;
            connectionPoolSpy = jest.spyOn(connectionPool, "getConnectionPool").mockImplementation(() => {
                return Promise.resolve({
                    getConnection: jest.fn().mockResolvedValue(connection)
                } as unknown as Pool);
            });
            activity = {
                id: "1234",
                activityType: "visit",
                activityDay: "2021-06-15",
                startTime: "2021-06-15 15:36:20.234",
                endTime: "2021-06-15 16:15:25.954",
                testerStaffId: "123",
                testerName: "Dave",
                testerEmail: "dave@qa.gov.uk",
                testStationType: "large",
                testStationName: "Test station",
                testStationPNumber: "P12345",
                testStationEmail: "test-station@qa.gov.uk",
                notes: "",
                waitReason: ["Coffee"]
            };
        });
        it("puts an activity in the the database", async () => {
            const functions = activitiesDocumentConverter();

            await functions.upsertEntity(activity);

            expect(connectionPoolSpy.mock.calls.length).toBe(1);
            expect(beginTransaction.mock.calls.length).toBe(1);
            expect(commit.mock.calls.length).toBe(1);
            expect(execute.mock.calls.length).toBeGreaterThan(4);
            expect(release.mock.calls.length).toBe(1);
        });

        it("rolls back the transaction if there is an error", async () => {
            commit = jest.fn().mockRejectedValue(false);
            connection = {
                execute,
                beginTransaction,
                commit,
                rollback,
                release
            } as unknown as PoolConnection;
            connectionPoolSpy = jest.spyOn(connectionPool, "getConnectionPool").mockImplementation(() => {
                return Promise.resolve({
                    getConnection: jest.fn().mockResolvedValue(connection)
                } as unknown as Pool);
            });

            const functions = activitiesDocumentConverter();

            await expect(functions.upsertEntity(activity)).rejects.toBe(false);

            expect(connectionPoolSpy.mock.calls.length).toBe(1);
            expect(beginTransaction.mock.calls.length).toBe(1);
            expect(rollback.mock.calls.length).toBe(1);
            expect(execute.mock.calls.length).toBeGreaterThan(4);
            expect(release.mock.calls.length).toBe(1);
        });
    });
});
