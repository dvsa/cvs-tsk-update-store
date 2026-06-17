import { DynamoDbImage } from '../services/dynamodb-images';

export type Medias = Media[];

export type MediaType = 'failReason' | 'image' | 'video';

export interface FailReasonMedia {
  path: string;
  reason: string;
  type: 'failReason';
}

export interface FileMedia {
  path: string;
  type: 'image' | 'video';
}

export type Media = FailReasonMedia | FileMedia;

export const parseMedias = (image?: DynamoDbImage): Medias => {
  if (!image) {
    return [] as Medias;
  }

  const medias: Medias = [];

  for (const key of image.getKeys()) {
    medias.push(parseMedia(image.getMap(key)!));
  }

  return medias;
};

export const parseMedia = (
    image: DynamoDbImage,
): Media => {
  const type = image.getString('type')! as MediaType;

  if (type === 'failReason') {
    return {
      path: image.getString('path')!,
      reason: image.getString('reason')!,
      type,
    };
  }

  return {
    path: image.getString('path')!,
    type,
  };
};
