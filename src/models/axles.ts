import { DynamoDbImage } from '../services/dynamodb-images';
import { Maybe } from './optionals';

export type Axles = Axle[];

export interface Axle {
  axleNumber?: number;
  parkingBrakeMrk?: boolean;
  weights?: AxleWeightProperties;
  tyres?: AxleTyreProperties;
  brakes?: AxleBrakeProperties;
}

export interface AxleWeightProperties {
  kerbWeight?: number;
  ladenWeight?: number;
  gbWeight?: number;
  eecWeight?: number;
  designWeight?: number;
}

export interface AxleTyreProperties {
  tyreSize?: string;
  plyRating?: string;
  fitmentCode?: FitmentCode;
  dataTrAxles?: number;
  speedCategorySymbol?: SpeedCategorySymbol;
  tyreCode?: number;
}

export type FitmentCode = 'double' | 'single';

export type SpeedCategorySymbol =
  | 'a7'
  | 'a8'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'p'
  | 'q';

export interface AxleBrakeProperties {
  brakeActuator?: number;
  leverLength?: number;
  springBrakeParking?: boolean;
}

export const parseAxles = (axlesImage?: DynamoDbImage): Axles => {
  if (!axlesImage) {
    return [] as Axles;
  }

  const axles: Axles = [];

  for (const key of axlesImage.getKeys()) {
    const axleImage = axlesImage.getMap(key)!;

    const weights = parseAxleWeightProperties(axleImage.getMap('weights'));
    const tyres = parseAxleTyreProperties(axleImage.getMap('tyres'));
    const brakes = parseAxleBrakeProperties(axleImage.getMap('brakes'));

    axles.push({
      axleNumber: axleImage.getNumber('axleNumber'),
      parkingBrakeMrk: axleImage.getBoolean('parkingBrakeMrk'),
      weights,
      brakes,
      tyres,
    });
  }

  return axles;
};

const parseAxleWeightProperties = (
  axleWeightPropertiesImage?: DynamoDbImage,
): Maybe<AxleWeightProperties> => {
  if (!axleWeightPropertiesImage) {
    return undefined;
  }

  return {
    kerbWeight: axleWeightPropertiesImage.getNumber('kerbWeight'),
    ladenWeight: axleWeightPropertiesImage.getNumber('ladenWeight'),
    gbWeight: axleWeightPropertiesImage.getNumber('gbWeight'),
    eecWeight: axleWeightPropertiesImage.getNumber('eecWeight'),
    designWeight: axleWeightPropertiesImage.getNumber('designWeight'),
  };
};

const parseAxleTyreProperties = (
  axleTyrePropertiesImage?: DynamoDbImage,
): Maybe<AxleTyreProperties> => {
  if (!axleTyrePropertiesImage) {
    return undefined;
  }

  return {
    tyreSize: axleTyrePropertiesImage.getString('tyreSize'),
    plyRating: axleTyrePropertiesImage.getString('plyRating'),
    fitmentCode: axleTyrePropertiesImage.getString(
      'fitmentCode',
    ) as FitmentCode,
    dataTrAxles: axleTyrePropertiesImage.getNumber('dataTrAxles'),
    speedCategorySymbol: axleTyrePropertiesImage.getString(
      'speedCategorySymbol',
    ) as SpeedCategorySymbol,
    tyreCode: axleTyrePropertiesImage.getNumber('tyreCode'),
  };
};

const parseAxleBrakeProperties = (
  axleBrakePropertiesImage?: DynamoDbImage,
): Maybe<AxleBrakeProperties> => {
  if (!axleBrakePropertiesImage) {
    return undefined;
  }

  return {
    brakeActuator: axleBrakePropertiesImage.getNumber('brakeActuator'),
    leverLength: axleBrakePropertiesImage.getNumber('leverLength'),
    springBrakeParking: axleBrakePropertiesImage.getBoolean(
      'springBrakeParking',
    ),
  };
};
