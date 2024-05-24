import { DynamoDbImage } from '../services/dynamodb-images';
import { Maybe } from './optionals';

export interface Brakes {
  brakeCodeOriginal?: string;
  brakeCode?: string;
  dataTrBrakeOne?: string;
  dataTrBrakeTwo?: string;
  dataTrBrakeThree?: string;
  retarderBrakeOne?: RetarderBrakeType;
  retarderBrakeTwo?: RetarderBrakeType;
  dtpNumber?: string;
  brakeForceWheelsNotLocked?: BrakeForceWheelsNotLocked;
  brakeForceWheelsUpToHalfLocked?: BrakeForceWheelsUpToHalfLocked;
  loadSensingValve?: boolean;
  antilockBrakingSystem?: boolean;
}

export type RetarderBrakeType =
  | 'electric'
  | 'exhaust'
  | 'friction'
  | 'hydraulic'
  | 'other'
  | 'none';

export interface BrakeForceWheelsNotLocked {
  serviceBrakeForceA?: number;
  secondaryBrakeForceA?: number;
  parkingBrakeForceA?: number;
}

export interface BrakeForceWheelsUpToHalfLocked {
  serviceBrakeForceB?: number;
  secondaryBrakeForceB?: number;
  parkingBrakeForceB?: number;
}

export const parseBrakes = (brakes?: DynamoDbImage): Maybe<Brakes> => {
  if (!brakes) {
    return undefined;
  }

  const brakeForceWheelsNotLocked = parseBrakeForceWheelsNotLocked(
    brakes.getMap('brakeForceWheelsNotLocked'),
  );
  const brakeForceWheelsUpToHalfLocked = parseBrakeForceWheelsUpToHalfLocked(
    brakes.getMap('brakeForceWheelsUpToHalfLocked'),
  );

  return {
    brakeCodeOriginal: brakes.getString('brakeCodeOriginal'),
    brakeCode: brakes.getString('brakeCode'),
    dataTrBrakeOne: brakes.getString('dataTrBrakeOne'),
    dataTrBrakeTwo: brakes.getString('dataTrBrakeTwo'),
    dataTrBrakeThree: brakes.getString('dataTrBrakeThree'),
    retarderBrakeOne: brakes.getString('retarderBrakeOne') as RetarderBrakeType,
    retarderBrakeTwo: brakes.getString('retarderBrakeTwo') as RetarderBrakeType,
    dtpNumber: brakes.getString('dtpNumber'),
    brakeForceWheelsNotLocked,
    brakeForceWheelsUpToHalfLocked,
    loadSensingValve: brakes.getBoolean('loadSensingValve'),
    antilockBrakingSystem: brakes.getBoolean('antilockBrakingSystem'),
  };
};

const parseBrakeForceWheelsNotLocked = (
  brakeForceWheelsNotLockedImage?: DynamoDbImage,
): Maybe<BrakeForceWheelsNotLocked> => {
  if (!brakeForceWheelsNotLockedImage) {
    return undefined;
  }

  return {
    serviceBrakeForceA: brakeForceWheelsNotLockedImage.getNumber(
      'serviceBrakeForceA',
    ),
    secondaryBrakeForceA: brakeForceWheelsNotLockedImage.getNumber(
      'secondaryBrakeForceA',
    ),
    parkingBrakeForceA: brakeForceWheelsNotLockedImage.getNumber(
      'parkingBrakeForceA',
    ),
  };
};

const parseBrakeForceWheelsUpToHalfLocked = (
  brakeForceWheelsUpToHalfLockedImage?: DynamoDbImage,
): Maybe<BrakeForceWheelsUpToHalfLocked> => {
  if (!brakeForceWheelsUpToHalfLockedImage) {
    return undefined;
  }

  return {
    serviceBrakeForceB: brakeForceWheelsUpToHalfLockedImage.getNumber(
      'serviceBrakeForceB',
    ),
    secondaryBrakeForceB: brakeForceWheelsUpToHalfLockedImage.getNumber(
      'secondaryBrakeForceB',
    ),
    parkingBrakeForceB: brakeForceWheelsUpToHalfLockedImage.getNumber(
      'parkingBrakeForceB',
    ),
  };
};
