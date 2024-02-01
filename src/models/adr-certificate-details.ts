import { DynamoDbImage } from "../services/dynamodb-images";
import { Maybe } from "./optionals";

// define AdrCertificateDetails' high-level attributes data types
export interface AdrCertificateDetails {
    adrPassCertificateDetails?: AdrPassCertificateDetails;
}

// define Enums
export type certificateIdEnum = "PASS" | "REPLACEMENT";

// define AdrCertificateDetails' sub-attributes data types
export type AdrPassCertificateDetails = AdrPassCertificateDetailsItems[];

export interface AdrPassCertificateDetailsItems {
    createdByName?: string;
    certificateType?: string;
    generatedTimestamp?: string;
    certificateId?: string;
  }

// function to parse AdrCertificateDetails' high-level and sub attributes + return AdrCertificateDetails object
export const parseAdrCertificateDetails = (
    certificateDetails?: DynamoDbImage
  ): Maybe<AdrCertificateDetails> => {
    if (!certificateDetails) {
      return undefined;
    }

    const adrPassCertificateDetailsImage: DynamoDbImage = certificateDetails.getList(
        "adrPassCertificateDetails"
    )!;
    const adrPassCertificateDetails: AdrPassCertificateDetails = [];

    for (const key of adrPassCertificateDetailsImage.getKeys()) {
        const adrPassCertificateDetailsItemImage = adrPassCertificateDetailsImage.getMap(key)!;
        adrPassCertificateDetails.push({
        createdByName: adrPassCertificateDetailsItemImage.getString("createdByName"),
        certificateType: adrPassCertificateDetailsItemImage.getString("certificateType"),
        generatedTimestamp: adrPassCertificateDetailsItemImage.getString("generatedTimestamp"),
        certificateId: adrPassCertificateDetailsItemImage.getString("certificateId") as certificateIdEnum,
        });
    }
    return {
      adrPassCertificateDetails
    };
};
