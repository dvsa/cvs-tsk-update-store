import {ModType, parseModType} from "./mod-type";
import {CustomDefects, Defects, parseCustomDefects, parseDefects} from "./defects";
import {DynamoDbImage} from "../services/dynamodb-images";

export type TestResultStatus = "fail" | "pass" | "prs" | "abandoned";

export type EmissionStandard = "0.10 g/kWh Euro 3 PM" | "0.03 g/kWh Euro IV PM" | "Euro 3" | "Euro 4" | "Euro 6" | "Euro VI" | "Full Electric";

export type FuelType = "diesel" | "gas-cng" | "gas-lng" | "gas-lpg" | "fuel cell" | "petrol" | "full electric";

export type TestTypes = TestType[];

export interface TestType {
    createdAt?: string;
    lastUpdatedAt?: string;
    deletionFlag?: boolean;
    testCode?: string;
    testTypeClassification?: string; // field does not exist in API schema, but is definitely present on some documents
    testTypeName?: string;
    name?: string;
    testTypeId?: string;
    testNumber?: string;
    certificateNumber?: string;
    secondaryCertificateNumber?: string;
    certificateLink?: string;
    testExpiryDate?: string;
    testAnniversaryDate?: string;
    testTypeStartTimestamp?: string;
    testTypeEndTimestamp?: string;
    statusUpdatedFlag?: boolean;
    numberOfSeatbeltsFitted?: number;
    lastSeatbeltInstallationCheckDate?: string;
    seatbeltInstallationCheckDate?: boolean;
    testResult?: TestResultStatus;
    prohibitionIssued?: boolean;
    reasonForAbandoning?: string;
    additionalNotesRecorded?: string;
    additionalCommentsForAbandon?: string;
    modType?: ModType;
    emissionStandard?: EmissionStandard;
    fuelType?: FuelType;
    particulateTrapFitted?: string;
    particulateTrapSerialNumber?: string;
    modificationTypeUsed?: string;
    smokeTestKLimitApplied?: string;
    defects?: Defects;
    customDefects?: CustomDefects;
}

export const parseTestTypes = (image?: DynamoDbImage): TestTypes => {
    if (!image) {
        return [] as TestTypes;
    }

    const testResults: TestTypes = [];

    for (const key of image.getKeys()) {
        testResults.push(parseTestType(image.getMap(key)!));
    }

    return testResults;
};

export const parseTestType = (image: DynamoDbImage): TestType => {
    return {
        createdAt: image.getString("createdAt"),
        lastUpdatedAt: image.getString("lastUpdatedAt"),
        deletionFlag: image.getBoolean("deletionFlag"),
        testCode: image.getString("testCode"),
        testTypeName: image.getString("testTypeName"),
        name: image.getString("name"),
        testTypeId: image.getString("testTypeId"),
        testNumber: image.getString("testNumber"),
        certificateNumber: image.getString("certificateNumber"),
        secondaryCertificateNumber: image.getString("secondaryCertificateNumber"),
        certificateLink: image.getString("certificateLink"),
        testExpiryDate: image.getString("testExpiryDate"),
        testAnniversaryDate: image.getString("testAnniversaryDate"),
        testTypeStartTimestamp: image.getString("testTypeStartTimestamp"),
        testTypeEndTimestamp: image.getString("testTypeEndTimestamp"),
        statusUpdatedFlag: image.getBoolean("statusUpdatedFlag"),
        numberOfSeatbeltsFitted: image.getNumber("numberOfSeatbeltsFitted"),
        lastSeatbeltInstallationCheckDate: image.getString("lastSeatbeltInstallationCheckDate"),
        seatbeltInstallationCheckDate: image.getBoolean("seatbeltInstallationCheckDate"),
        testResult: image.getString("testResult") as TestResultStatus,
        prohibitionIssued: image.getBoolean("prohibitionIssued"),
        reasonForAbandoning: image.getString("reasonForAbandoning"),
        additionalNotesRecorded: image.getString("additionalNotesRecorded"),
        additionalCommentsForAbandon: image.getString("additionalCommentsForAbandon"),
        modType: parseModType(image.getMap("modType")),
        emissionStandard: image.getString("emissionStandard") as EmissionStandard,
        fuelType: image.getString("fuelType") as FuelType,
        particulateTrapFitted: image.getString("particulateTrapFitted"),
        particulateTrapSerialNumber: image.getString("particulateTrapSerialNumber"),
        modificationTypeUsed: image.getString("modificationTypeUsed"),
        smokeTestKLimitApplied: image.getString("smokeTestKLimitApplied"),
        defects: parseDefects(image.getMap("defects")),
        customDefects: parseCustomDefects(image.getMap("customDefects"))
    };
};
