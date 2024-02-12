import { DynamoDbImage } from "../services/dynamodb-images";
import { Maybe } from "./optionals";

// define Enums
export type AdrPassCertificateTypeEnum = "PASS" | "REPLACEMENT";

export type AdrPassCertificateDetails = AdrPassCertificateDetailsItems[];

export interface AdrPassCertificateDetailsItems {
  createdByName?: string;
  certificateType?: AdrPassCertificateTypeEnum;
  generatedTimestamp?: string;
  certificateId?: string;
}

export const parseAdrCertificateDetails = (
  adrPassCertificateDetailsImage?: DynamoDbImage
): Maybe<AdrPassCertificateDetails> => {
  if (!adrPassCertificateDetailsImage) {
    return undefined;
  }

  const adrPassCertificateDetails: AdrPassCertificateDetails = [];

  for (const key of adrPassCertificateDetailsImage.getKeys()) {
    const adrPassCertificateDetailsItemImage = adrPassCertificateDetailsImage.getMap(
      key
    )!;
    adrPassCertificateDetails.push({
      createdByName: adrPassCertificateDetailsItemImage.getString(
        "createdByName"
      ),
      certificateType: adrPassCertificateDetailsItemImage.getString(
        "certificateType"
      ) as AdrPassCertificateTypeEnum,
      generatedTimestamp: adrPassCertificateDetailsItemImage.getDate(
        "generatedTimestamp"
      ),
      certificateId: adrPassCertificateDetailsItemImage.getString(
        "certificateId"
      ),
    });
  }
  return adrPassCertificateDetails;
};
