import {parseVehicleClass, VehicleClass} from "./vehicle-class";
import {parseTestTypes, TestTypes} from "./test-types";
import {EuVehicleCategory, VehicleConfiguration, VehicleSize, VehicleType} from "./shared-enums";
import {DynamoDbImage, parseStringArray} from "../services/dynamodb-images";

export type TestVersion = "current" | "archived";

export type TestStationType = "atf" | "gvts" | "hq";

export type TestStatus = "submitted" | "cancelled";

export type OdometerReadingUnits = "kilometres" | "miles";

export type TestResults = TestResult[];

export interface TestResult {
    systemNumber?: string;
    vrm?: string;
    trailerId?: string;
    vin?: string;
    vehicleId?: string;
    deletionFlag?: boolean;
    testHistory?: TestResult[];
    testVersion?: TestVersion;
    reasonForCreation?: string;
    createdAt?: string;
    createdByName?: string;
    createdById?: string;
    lastUpdatedAt?: string;
    lastUpdatedByName?: string;
    lastUpdatedById?: string;
    shouldEmailCertificate?: string;
    testStationName?: string;
    testStationPNumber?: string;
    testStationType?: TestStationType;
    testerName?: string;
    testerStaffId?: string;
    testResultId?: string;
    testerEmailAddress?: string;
    testStartTimestamp?: string;
    testEndTimestamp?: string;
    testStatus?: TestStatus;
    reasonForCancellation?: string;
    vehicleClass?: VehicleClass;
    vehicleSubclass?: string[];
    vehicleType?: VehicleType;
    numberOfSeats?: number;
    vehicleConfiguration?: VehicleConfiguration;
    odometerReading?: number;
    odometerReadingUnits?: OdometerReadingUnits;
    preparerId?: string;
    preparerName?: string;
    numberOfWheelsDriven?: number;
    euVehicleCategory?: EuVehicleCategory;
    countryOfRegistration?: string;
    vehicleSize?: VehicleSize;
    noOfAxles?: number;
    regnDate?: string;
    firstUseDate?: string;
    testTypes?: TestTypes;
}

export const parseTestResults = (image?: DynamoDbImage): TestResults => {
    console.info("Parsing test results...");
    console.info("Expect exactly 2 calls to parseTestResults: root, and recursive call for nested field 'testHistory'");

    if (!image) {
        console.info("image is null or undefined, no test results / test history to process");
        return [] as TestResults;
    }

    const testResultsImage = image.getList("testResults");

    if (!testResultsImage) {
        console.info("image.testResults is null or undefined: attempting to parse image as single, unwrapped test result instead");

        if (!image.getString("systemNumber")) {
            console.info("image missing required field 'systemNumber': this is not a test result, no test results to process");
            return [] as TestResults;
        }

        return [ parseTestResult(image) ];
    }

    const testResults: TestResults = [];

    for (const key of testResultsImage.getKeys()) {
        testResults.push(parseTestResult(testResultsImage.getMap(key)!));
    }

    return testResults;
};

export const parseTestResult = (image: DynamoDbImage): TestResult => {
    return {
        systemNumber: image.getString("systemNumber"),
        vrm: image.getString("vrm"),
        trailerId: image.getString("trailerId"),
        vin: image.getString("vin"),
        vehicleId: image.getString("vehicleId"),
        deletionFlag: image.getBoolean("deletionFlag"),
        testHistory: parseTestResults(image.getList("testHistory")),
        testVersion: image.getString("testVersion") as TestVersion,
        reasonForCreation: image.getString("reasonForCreation"),
        createdAt: image.getString("createdAt"),
        createdByName: image.getString("createdByName"),
        createdById: image.getString("createdById"),
        lastUpdatedAt: image.getString("lastUpdatedAt"),
        lastUpdatedByName: image.getString("lastUpdatedByName"),
        lastUpdatedById: image.getString("lastUpdatedById"),
        shouldEmailCertificate: image.getString("shouldEmailCertificate"),
        testStationName: image.getString("testStationName"),
        testStationPNumber: image.getString("testStationPNumber"),
        testStationType: image.getString("testStationType") as TestStationType,
        testerName: image.getString("testerName"),
        testerStaffId: image.getString("testerStaffId"),
        testResultId: image.getString("testResultId"),
        testerEmailAddress: image.getString("testerEmailAddress"),
        testStartTimestamp: image.getString("testStartTimestamp"),
        testEndTimestamp: image.getString("testEndTimestamp"),
        testStatus: image.getString("testStatus") as TestStatus,
        reasonForCancellation: image.getString("reasonForCancellation"),
        vehicleClass: parseVehicleClass(image.getMap("vehicleClass")),
        vehicleSubclass: parseStringArray(image.getList("vehicleSubclass")),
        vehicleType: image.getString("vehicleType") as VehicleType,
        numberOfSeats: image.getNumber("numberOfSeats"),
        vehicleConfiguration: image.getString("vehicleConfiguration") as VehicleConfiguration,
        odometerReading: image.getNumber("odometerReading"),
        odometerReadingUnits: image.getString("odometerReadingUnits") as OdometerReadingUnits,
        preparerId: image.getString("preparerId"),
        preparerName: image.getString("preparerName"),
        numberOfWheelsDriven: image.getNumber("numberOfWheelsDriven"),
        euVehicleCategory: image.getString("euVehicleCategory") as EuVehicleCategory,
        countryOfRegistration: image.getString("countryOfRegistration"),
        vehicleSize: image.getString("vehicleSize") as VehicleSize,
        noOfAxles: image.getNumber("noOfAxles"),
        regnDate: image.getString("regnDate"),
        firstUseDate: image.getString("firstUseDate"),
        testTypes: parseTestTypes(image.getList("testTypes"))
    };
};
