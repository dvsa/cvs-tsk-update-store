import { parseActivity, Activity } from "../../../src/models/activity";
import {DynamoDbImage} from "../../../src/services/dynamodb-images";
import {default as activityJson} from "../../resources/dynamodb-image-activity.json";
import {castToImageShape} from "../../utils";

describe("parseTechRecordDocument()", () => {
    it("should successfully parse a DynamoDB image into a TechRecordDocument", () => {
        const image = DynamoDbImage.parse(castToImageShape(activityJson));

        const activity: Activity = parseActivity(image);

        // check only first property of each root, for now
        expect(activity.id).toEqual("c2b83364-7cef-44b0-a110-e999c871170c");
        expect(activity.testStationType).toEqual("gvts");
        expect(activity.startTime).toEqual("2020-12-03 10:04:47.746");
        expect(activity.testerStaffId).toEqual("918a7700-f9fe-4165-ac8b-b189d965dcf5");
        expect(activity.testerName).toEqual("CVS _UAT");
        expect(activity.activityType).toEqual("visit");
        expect(activity.testerEmail).toEqual("CVS_UAT@DVSA.GOV.UK");
        expect(activity.endTime).toEqual("2020-12-03 10:07:39.448");
        expect(activity.testStationName).toEqual("Abshire-Kub");
        expect(activity.testStationPNumber).toEqual("09-4129632");
        expect(activity.testStationEmail).toEqual("cvs.test2@dvsagov.onmicrosoft.com");
        expect(activity.parentId).toEqual("6c910323-0a80-420e-89be-fd41fba1b203");
        expect(activity.notes).toEqual("Note 1");
        expect(activity.waitReason).toEqual(["reason 1"]);
    });
});
