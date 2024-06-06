import { _Record } from '@aws-sdk/client-dynamodb-streams';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { debugLog } from '../services/logger';

interface LegacyKeyStructure {
  [index: string]: string | boolean | number | Array<string> | Array<LegacyKeyStructure> | LegacyKeyStructure;
}

interface NewKeyStructure {
  [index: string]: string | boolean | number | Array<string>;
}

interface LegacyTechRecord extends LegacyKeyStructure {
  techRecord: LegacyKeyStructure[]
}

const nestItem = (record: LegacyKeyStructure, key: string, value: string | number | boolean | string[], position: number) => {
  const idx = key.indexOf('_', position);

  if (idx === -1) {
    record[key.substring(position)] = value;
    return;
  }
  const realKey = key.substring(position, idx);
  const isArray = !isNaN(parseInt(key[idx + 1]));

  if (!record[realKey.toString()]) {
    if (isArray) {
      record[realKey.toString()] = [];
    } else {
      record[realKey.toString()] = {};
    }
  }

  nestItem(record[realKey.toString()] as LegacyKeyStructure, key, value, idx + 1);
  return record;
};

const transformImage = (image: NewKeyStructure) => {
  const vehicle = {} as LegacyTechRecord;
  vehicle.techRecord = [];

  const legacyRecord = {} as LegacyKeyStructure;

  for (const [key, value] of Object.entries(image)) {
    if (key.indexOf('_') === -1 && !vehicle[key.toString()]) {
      vehicle[key.toString()] = value;
      continue;
    }
    nestItem(legacyRecord, key, value, 0);
  }

  delete vehicle.createdTimestamp;

  vehicle.techRecord.push(legacyRecord.techRecord as LegacyKeyStructure);

  return (marshall(vehicle));
};

export const transformTechRecord = (record: _Record) => {
  if (record.dynamodb?.OldImage) {
    debugLog('Transforming old image of flat-tech-record');
    const OldImage: NewKeyStructure = unmarshall(record.dynamodb.OldImage);
    record.dynamodb.OldImage = transformImage(OldImage);
  }

  if (record.dynamodb?.NewImage) {
    debugLog('Transforming new image of flat-tech-record');
    const NewImage: NewKeyStructure = unmarshall(record.dynamodb.NewImage);
    record.dynamodb.NewImage = transformImage(NewImage);
  }
  debugLog('Succesfully transformed flat-tech-record stream record');
};
