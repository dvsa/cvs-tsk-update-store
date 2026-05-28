import { DynamoDbImage } from '../services/dynamodb-images';

export type Medias = Media[];

export type MediaType = 'failReason';

export interface Media {
  path: string;
  reason: string;
  type: MediaType;
}

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

  return {
    path: image.getString('path')!,
    reason: image.getString('reason')!,
    type: image.getString('type')! as MediaType,
  };
};
