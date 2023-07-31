import { DynamoDbImage } from "../services/dynamodb-images";
import { Maybe } from "./optionals";

export type DeficiencyCategory = "advisory" | "dangerous" | "major" | "minor";

export type VerticalLocation = "upper" | "lower";

export type HorizontalLocation = "inner" | "outer";

export type LateralLocation = "nearside" | "centre" | "offside";

export type LongitudinalLocation = "front" | "rear";

export interface DefectAdditionalInformation {
  location?: DefectAdditionalInformationLocation;
  notes?: string;
}

export interface DefectAdditionalInformationLocation {
  vertical?: VerticalLocation;
  horizontal?: HorizontalLocation;
  lateral?: LateralLocation;
  longitudinal?: LongitudinalLocation;
  rowNumber?: number;
  seatNumber?: number;
  axleNumber?: number;
}

export type Defects = Defect[];

export interface Defect {
  imNumber?: number;
  imDescription?: string;
  additionalInformation?: DefectAdditionalInformation;
  itemNumber?: number;
  itemDescription?: string;
  deficiencyRef?: string;
  deficiencyId?: string;
  deficiencySubId?: string;
  deficiencyCategory?: DeficiencyCategory;
  deficiencyText?: string;
  stdForProhibition?: boolean;
  prs?: boolean;
  prohibitionIssued?: boolean;
}

export type CustomDefects = CustomDefect[];

export interface CustomDefect {
  referenceNumber?: string;
  defectName?: string;
  defectNotes?: string;
}

export const parseDefects = (image?: DynamoDbImage): Defects => {
  if (!image) {
    return [] as Defects;
  }

  const defects: Defects = [];

  for (const key of image.getKeys()) {
    defects.push(parseDefect(image.getMap(key)!));
  }

  return defects;
};

export const parseCustomDefects = (image?: DynamoDbImage): CustomDefects => {
  if (!image) {
    return [] as CustomDefects;
  }

  const defects: CustomDefects = [];

  for (const key of image.getKeys()) {
    defects.push(parseCustomDefect(image.getMap(key)!));
  }

  return defects;
};

export const parseDefect = (image: DynamoDbImage): Defect => {
  return {
    imNumber: image.getNumber("imNumber"),
    imDescription: image.getString("imDescription"),
    additionalInformation: parseDefectAdditionalInformation(
      image.getMap("additionalInformation")
    ),
    itemNumber: image.getNumber("itemNumber"),
    itemDescription: image.getString("itemDescription"),
    deficiencyRef: image.getString("deficiencyRef"),
    deficiencyId: image.getString("deficiencyId"),
    deficiencySubId: image.getString("deficiencySubId"),
    deficiencyCategory: image.getString(
      "deficiencyCategory"
    ) as DeficiencyCategory,
    deficiencyText: image.getString("deficiencyText"),
    stdForProhibition: image.getBoolean("stdForProhibition"),
    prs: image.getBoolean("prs"),
    prohibitionIssued: image.getBoolean("prohibitionIssued"),
  };
};

export const parseDefectAdditionalInformation = (
  image?: DynamoDbImage
): Maybe<DefectAdditionalInformation> => {
  if (!image) {
    return undefined;
  }

  return {
    location: parseDefectAdditionalInformationLocation(
      image.getMap("location")
    ),
    notes: image.getString("notes"),
  };
};

export const parseDefectAdditionalInformationLocation = (
  image?: DynamoDbImage
): Maybe<DefectAdditionalInformationLocation> => {
  if (!image) {
    return undefined;
  }

  return {
    vertical: image.getString("vertical") as VerticalLocation,
    horizontal: image.getString("horizontal") as HorizontalLocation,
    lateral: image.getString("lateral") as LateralLocation,
    longitudinal: image.getString("longitudinal") as LongitudinalLocation,
    rowNumber: image.getNumber("rowNumber"),
    seatNumber: image.getNumber("seatNumber"),
    axleNumber: image.getNumber("axleNumber"),
  };
};

const parseCustomDefect = (image: DynamoDbImage): CustomDefect => {
  return {
    referenceNumber: image.getString("referenceNumber"),
    defectName: image.getString("defectName"),
    defectNotes: image.getString("defectNotes"),
  };
};
