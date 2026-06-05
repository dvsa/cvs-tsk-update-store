import { ModType, parseModType } from './mod-type';
import {
  CustomDefects,
  Defects,
  parseCustomDefects,
  parseDefects,
} from './defects';
import { DynamoDbImage } from '../services/dynamodb-images';

export type TestResultStatus = 'fail' | 'pass' | 'prs' | 'abandoned';

export type EmissionStandard =
  | '0.10 g/kWh Euro 3 PM'
  | '0.03 g/kWh Euro IV PM'
  | 'Euro 3'
  | 'Euro 4'
  | 'Euro 6'
  | 'Euro VI'
  | 'Full Electric';

export type FuelType =
  | 'diesel'
  | 'gas-cng'
  | 'gas-lng'
  | 'gas-lpg'
  | 'fuel cell'
  | 'petrol'
  | 'full electric';

export type VehicleLoadStatus =
  | 'Unladen'
  | 'Partially laden'
  | 'Partially laden 50% to 65%'
  | 'Fully laden'
  | 'Load simulated partially laden'
  | 'Load simulated fully laden';

export type UnladenBodyType =
  | 'Skeletal'
  | 'Curtain'
  | 'Fridge'
  | 'Box'
  | 'Tank'
  | 'Flat'
  | 'Car transporter'
  | 'Fixed plant'
  | 'Tipper'
  | 'Refuge'
  | 'Street cleaner'
  | 'Specialised vehicle/trailer'
  | 'Other';

export type ReasonForNotLoading =
  | 'Obnoxious load'
  | 'Tanker'
  | 'Perishable goods'
  | 'Livestock'
  | 'Car transporter'
  | 'Refuge'
  | 'Street cleaner'
  | 'ULTAST'
  | 'Specialist body/load'
  | 'Other';

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
  load_status?: VehicleLoadStatus;
  unladen_body_type?: UnladenBodyType;
  other_unladen_body_type?: string;
  reason_for_not_loading?: ReasonForNotLoading;
  other_reason_for_not_loading?: string;
  partially_laden_reason?: string;
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

export const parseTestType = (image: DynamoDbImage): TestType => ({
  createdAt: image.getDate('createdAt'),
  lastUpdatedAt: image.getDate('lastUpdatedAt'),
  deletionFlag: image.getBoolean('deletionFlag'),
  testCode: image.getString('testCode'),
  testTypeClassification: image.getString('testTypeClassification'),
  testTypeName: image.getString('testTypeName'),
  name: image.getString('name'),
  testTypeId: image.getString('testTypeId'),
  testNumber: image.getString('testNumber'),
  certificateNumber: image.getString('certificateNumber'),
  secondaryCertificateNumber: image.getString('secondaryCertificateNumber'),
  certificateLink: image.getString('certificateLink'),
  testExpiryDate: image.getDate('testExpiryDate'),
  testAnniversaryDate: image.getDate('testAnniversaryDate'),
  testTypeStartTimestamp: image.getDate('testTypeStartTimestamp'),
  testTypeEndTimestamp: image.getDate('testTypeEndTimestamp'),
  statusUpdatedFlag: image.getBoolean('statusUpdatedFlag'),
  numberOfSeatbeltsFitted: image.getNumber('numberOfSeatbeltsFitted'),
  lastSeatbeltInstallationCheckDate: image.getString(
    'lastSeatbeltInstallationCheckDate',
  ),
  seatbeltInstallationCheckDate: image.getBoolean(
    'seatbeltInstallationCheckDate',
  ),
  testResult: image.getString('testResult') as TestResultStatus,
  prohibitionIssued: image.getBoolean('prohibitionIssued'),
  reasonForAbandoning: image.getString('reasonForAbandoning'),
  additionalNotesRecorded: image.getString('additionalNotesRecorded'),
  additionalCommentsForAbandon: image.getString(
    'additionalCommentsForAbandon',
  ),
  modType: parseModType(image.getMap('modType')),
  emissionStandard: image.getString('emissionStandard') as EmissionStandard,
  fuelType: image.getString('fuelType') as FuelType,
  particulateTrapFitted: image.getString('particulateTrapFitted'),
  particulateTrapSerialNumber: image.getString('particulateTrapSerialNumber'),
  modificationTypeUsed: image.getString('modificationTypeUsed'),
  smokeTestKLimitApplied: image.getString('smokeTestKLimitApplied'),
  defects: parseDefects(image.getList('defects')),
  customDefects: parseCustomDefects(image.getList('customDefects')),
  load_status: image.getString('load_status') as VehicleLoadStatus,
  unladen_body_type: image.getString('unladen_body_type') as UnladenBodyType,
  other_unladen_body_type: image.getString('other_unladen_body_type'),
  reason_for_not_loading: image.getString('reason_for_not_loading') as ReasonForNotLoading,
  other_reason_for_not_loading: image.getString('other_reason_for_not_loading'),
  partially_laden_reason: image.getString('partially_laden_reason'),
});
