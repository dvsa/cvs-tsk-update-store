import { DynamoDbImage, parseStringArray } from "../services/dynamodb-images";
import { Maybe } from "./optionals";

// define AdrDetails' high-level attributes data types
export interface AdrDetails {
  vehicleDetails?: VehicleDetails;
  listStatementApplicable?: boolean;
  batteryListNumber?: string;
  declarationsSeen?: boolean;
  brakeDeclarationsSeen?: boolean;
  brakeDeclarationIssuer?: string;
  brakeEndurance?: boolean;
  weight?: number;
  compatibilityGroupJ?: string;
  documents?: string[];
  permittedDangerousGoods?: string[];
  additionalExaminerNotes?: AdditionalExaminerNotes;
  applicantDetails?: ApplicantDetails;
  dangerousGoods?: boolean;
  memosApply?: string[];
  additionalNotes?: AdditionalNotes;
  adrTypeApprovalNo?: string;
  adrCertificateNotes?: string;
  tank?: Tank;
}

// define Enums
export type VehicleDetailsTypeEnum = "Artic tractor" | "Rigid box body" | "Rigid sheeted load" | "Rigid tank" | 
                                 "Rigid skeletal" | "Rigid battery" | "Full drawbar box body" | 
                                 "Full drawbar sheeted load" | "Full drawbar tank" | "Full drawbar skeletal" | 
                                 "Full drawbar battery" | "Centre axle box body" | "Centre axle sheeted load" | 
                                 "Centre axle tank" | "Centre axle skeletal" | "Centre axle battery" | 
                                 "Semi trailer box body" | "Semi trailer sheeted load" | "Semi trailer tank" | 
                                 "Semi trailer skeletal" | "Semi trailer battery Enum"

export type Tc2TypeEnum = "initial";

export type Tc3TypeEnum = "intermediate" | "periodic" | "exceptional";

export type permittedDangerousGoodsEnum = "FP <61 (FL)" | "AT" | "Class 5.1 Hydrogen Peroxide (OX)" | "MEMU" |
                                          "Carbon Disulphide" | "Hydrogen" | "Explosives (type 2)" | "Explosives (type 3)"

export type compatibilityGroupJEnum = "I" | "E"

export type additionalNotesNumberEnum =  "1" | "1A" | "2" | "3" | "V1B" | "T1B"

export type substancesPermittedEnum = "Substances permitted under the tank code and any special provisions specified in 9 may be carried" |
                                      "Substances (Class UN number and if necessary packing group and proper shipping name) may be carried"

export type memosApplyEnum = "07/09 3mth leak ext"

// define AdrDetails' sub-attributes data types 
export interface VehicleDetails {
  type?: VehicleDetailsTypeEnum;
  approvalDate?: string;
}

export type AdditionalExaminerNotes = AdditionalExaminerNotesItems[];

export interface AdditionalExaminerNotesItems {
  note?: string;
  createdAtDate?: string;
  lastUpdatedBy?: string;
}

export interface ApplicantDetails {
  name?: string;
  street?: string;
  town?: string;
  city?: string;
  postcode?: string;
}

export interface AdditionalNotes {
  number?: additionalNotesNumberEnum[];
  // guidanceNotes?: string[];
}

export interface Tank {
  tankDetails?: TankDetails;
  tankStatement?: TankStatement;
}

export interface TankDetails {
  tankManufacturer?: string;
  yearOfManufacture?: number;
  tankCode?: string;
  specialProvisions?: string;
  tankManufacturerSerialNo?: string;
  tankTypeAppNo?: string;
  tc2Details?: Tc2Details;
  tc3Details?: Tc3Details;
}

export interface TankStatement {
  substancesPermitted?: string;
  select?: string;
  statement?: string;
  productListRefNo?: string;
  productListUnNo?: string[];
  productList?: string;
}

export interface Tc2Details {
  tc2Type?: Tc2TypeEnum;
  tc2IntermediateApprovalNo?: string;
  tc2IntermediateExpiryDate?: string;
}


export type Tc3Details = Tc3DetailsItem[];

export interface Tc3DetailsItem {
  tc3Type?: Tc3TypeEnum;
  tc3PeriodicNumber?: string;
  tc3PeriodicExpiryDate?: string;
}

// function to parse AdrDetails' high-level and sub attributes + return AdrDetails object 
export const parseAdrDetails = (
  adrDetails?: DynamoDbImage
): Maybe<AdrDetails> => {
  if (!adrDetails) {
    return undefined;
  }

  const additionalNotesImage: DynamoDbImage = adrDetails.getMap(
    "additionalNotes"
  )!;
  const additionalNotes: AdditionalNotes = {
    number: parseStringArray(additionalNotesImage.getList("number")) as additionalNotesNumberEnum[],
    // guidanceNotes: parseStringArray(
    //   additionalNotesImage.getList("guidanceNotes")
    // ),
  };

  const applicantDetailsImage: DynamoDbImage = adrDetails.getMap(
    "applicantDetails"
  )!;
  const applicantDetails: ApplicantDetails = {
    name: applicantDetailsImage.getString("name"),
    street: applicantDetailsImage.getString("street"),
    town: applicantDetailsImage.getString("town"),
    city: applicantDetailsImage.getString("city"),
    postcode: applicantDetailsImage.getString("postcode"),
  };

  const vehicleDetailsImage: DynamoDbImage = adrDetails.getMap(
    "vehicleDetails"
  )!;
  const vehicleDetails: VehicleDetails = {
    type: vehicleDetailsImage.getString("type") as VehicleDetailsTypeEnum,
    approvalDate: vehicleDetailsImage.getString("approvalDate"),
  };

  const tankImage: DynamoDbImage = adrDetails.getMap("tank")!;

  const tankDetailsImage = tankImage.getMap("tankDetails")!;

  const tc2DetailsImage: DynamoDbImage = tankDetailsImage.getMap("tc2Details")!;
  const tc2Details: Tc2Details = {
    tc2Type: tc2DetailsImage.getString("tc2Type") as Tc2TypeEnum,
    tc2IntermediateApprovalNo: tc2DetailsImage.getString(
      "tc2IntermediateApprovalNo"
    ),
    tc2IntermediateExpiryDate: tc2DetailsImage.getString(
      "tc2IntermediateExpiryDate"
    ),
  };

  const tc3DetailsImage: DynamoDbImage = tankDetailsImage.getList(
    "tc3Details"
  )!;
  const tc3Details: Tc3Details = [];

  for (const key of tc3DetailsImage.getKeys()) {
    const tc3DetailsItemImage = tc3DetailsImage.getMap(key)!;
    tc3Details.push({
      tc3Type: tc3DetailsItemImage.getString("tc3Type") as Tc3TypeEnum,
      tc3PeriodicNumber: tc3DetailsItemImage.getString("tc3PeriodicNumber"),
      tc3PeriodicExpiryDate: tc3DetailsItemImage.getString(
        "tc3PeriodicExpiryDate"
      ),
    });
  }

  const tankDetails: TankDetails = {
    tankManufacturer: tankDetailsImage.getString("tankManufacturer"),
    yearOfManufacture: tankDetailsImage.getNumber("yearOfManufacture"),
    tankCode: tankDetailsImage.getString("tankCode"),
    specialProvisions: tankDetailsImage.getString("specialProvisions"),
    tankManufacturerSerialNo: tankDetailsImage.getString(
      "tankManufacturerSerialNo"
    ),
    tankTypeAppNo: tankDetailsImage.getString("tankTypeAppNo"),
    tc2Details,
    tc3Details,
  };

  const tankStatementImage: DynamoDbImage = tankImage.getMap("tankStatement")!;
  const tankStatement: TankStatement = {
    substancesPermitted: tankStatementImage.getString("substancesPermitted") as substancesPermittedEnum,
    select: tankStatementImage.getString("select"),
    statement: tankStatementImage.getString("statement"),
    productListRefNo: tankStatementImage.getString("productListRefNo"),
    productListUnNo: parseStringArray(
      tankStatementImage.getList("productListUnNo")
    ),
    productList: tankStatementImage.getString("productList"),
  };

  const tank: Tank = {
    tankDetails,
    tankStatement,
  };


  const additionalExaminerNotesImage: DynamoDbImage = adrDetails.getList(
    "additionalExaminerNotes"
  )!;
  const additionalExaminerNotes: AdditionalExaminerNotes = [];

  for (const key of additionalExaminerNotesImage.getKeys()) {
    const additionalExaminerNotesItemImage = additionalExaminerNotesImage.getMap(key)!;
    additionalExaminerNotes.push({
      note: additionalExaminerNotesItemImage.getString("note"),
      createdAtDate: additionalExaminerNotesItemImage.getString("createdAtDate"),
      lastUpdatedBy: additionalExaminerNotesItemImage.getString("lastUpdatedBy"),
    });
  };


  return {
    vehicleDetails,
    listStatementApplicable: adrDetails.getBoolean("listStatementApplicable"),
    batteryListNumber: adrDetails.getString("batteryListNumber"),
    declarationsSeen: adrDetails.getBoolean("declarationsSeen"),
    brakeDeclarationsSeen: adrDetails.getBoolean("brakeDeclarationsSeen"),
    brakeDeclarationIssuer: adrDetails.getString("brakeDeclarationIssuer"),
    brakeEndurance: adrDetails.getBoolean("brakeEndurance"),
    weight: adrDetails.getNumber("weight"),
    compatibilityGroupJ: adrDetails.getString("compatibilityGroupJ") as compatibilityGroupJEnum,
    documents: parseStringArray(adrDetails.getList("documents")),
    permittedDangerousGoods: parseStringArray(
      adrDetails.getList("permittedDangerousGoods")
    ) as permittedDangerousGoodsEnum[],
    additionalExaminerNotes: additionalExaminerNotes,
    applicantDetails,
    dangerousGoods: adrDetails.getBoolean("dangerousGoods"),
    memosApply: parseStringArray(adrDetails.getList("memosApply")) as memosApplyEnum[],
    additionalNotes,
    adrTypeApprovalNo: adrDetails.getString("adrTypeApprovalNo"),
    adrCertificateNotes: adrDetails.getString("adrCertificateNotes"),
    tank,
  };
};
