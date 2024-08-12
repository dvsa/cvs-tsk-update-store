import { parseVehicleClass, VehicleClass } from './vehicle-class';
import { parseTestTypes, TestTypes } from './test-types';
import {
  EuVehicleCategory,
  VehicleConfiguration,
  VehicleSize,
  VehicleType,
} from './shared-enums';
import { DynamoDbImage, parseStringArray } from '../services/dynamodb-images';
import { debugLog } from '../services/logger';

export type TestVersion = 'current' | 'archived';

export type TestStationType = 'atf' | 'gvts' | 'hq' | 'vef';

export type TestStatus = 'submitted' | 'cancelled';

export type OdometerReadingUnits = 'kilometres' | 'miles';

export type TestResults = TestResult[];

export interface TestResult {
  systemNumber?: string;
  vrm?: string;
  trailerId?: string;
  vin?: string;
  vehicleId?: string;
  deletionFlag?: boolean;
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
  debugLog('Parsing test results...');

  if (!image) {
    debugLog('image is null or undefined, no test results to process');
    return [] as TestResults;
  }

  if (!image.getString('systemNumber')) {
    throw new Error("result is missing required field 'systemNumber'");
  }

  return [parseTestResult(image)];
};

export const parseTestResult = (image: DynamoDbImage): TestResult => ({
  systemNumber: image.getString('systemNumber'),
  vrm: image.getString('vrm'),
  trailerId: image.getString('trailerId'),
  vin: image.getString('vin'),
  vehicleId: image.getString('vehicleId'),
  deletionFlag: image.getBoolean('deletionFlag'),
  testVersion: image.getString('testVersion') as TestVersion,
  reasonForCreation: image.getString('reasonForCreation'),
  createdAt: image.getDate('createdAt'),
  createdByName: image.getString('createdByName'),
  createdById: image.getString('createdById'),
  lastUpdatedAt: image.getDate('lastUpdatedAt'),
  lastUpdatedByName: image.getString('lastUpdatedByName'),
  lastUpdatedById: image.getString('lastUpdatedById'),
  shouldEmailCertificate: image.getString('shouldEmailCertificate'),
  testStationName: image.getString('testStationName'),
  testStationPNumber: image.getString('testStationPNumber'),
  testStationType: image.getString('testStationType') as TestStationType,
  testerName: image.getString('testerName'),
  testerStaffId: image.getString('testerStaffId'),
  testResultId: image.getString('testResultId'),
  testerEmailAddress: image.getString('testerEmailAddress'),
  testStartTimestamp: image.getDate('testStartTimestamp'),
  testEndTimestamp: image.getDate('testEndTimestamp'),
  testStatus: image.getString('testStatus') as TestStatus,
  reasonForCancellation: image.getString('reasonForCancellation'),
  vehicleClass: parseVehicleClass(image.getMap('vehicleClass')),
  vehicleSubclass: parseStringArray(image.getList('vehicleSubclass')),
  vehicleType: image.getString('vehicleType') as VehicleType,
  numberOfSeats: image.getNumber('numberOfSeats'),
  vehicleConfiguration: image.getString(
    'vehicleConfiguration',
  ) as VehicleConfiguration,
  odometerReading: image.getNumber('odometerReading'),
  odometerReadingUnits: image.getString(
    'odometerReadingUnits',
  ) as OdometerReadingUnits,
  preparerId: image.getString('preparerId'),
  preparerName: image.getString('preparerName'),
  numberOfWheelsDriven: image.getNumber('numberOfWheelsDriven'),
  euVehicleCategory: image.getString(
    'euVehicleCategory',
  ) as EuVehicleCategory,
  countryOfRegistration: image.getString('countryOfRegistration'),
  vehicleSize: image.getString('vehicleSize') as VehicleSize,
  noOfAxles: image.getNumber('noOfAxles'),
  regnDate: image.getString('regnDate'),
  firstUseDate: image.getString('firstUseDate'),
  testTypes: parseTestTypes(image.getList('testTypes')),
});
