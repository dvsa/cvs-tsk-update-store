import { DynamoDbImage } from "../services/dynamodb-images";
import { Maybe } from "./optionals";

export interface ManufacturerDetails {
  name?: string;
  address1?: string;
  address2?: string;
  postTown?: string;
  address3?: string;
  postCode?: string;
  emailAddress?: string;
  telephoneNumber?: string;
  faxNumber?: string;
  manufacturerNotes?: string;
}

export const parseManufacturerDetails = (
  manufacturerDetails?: DynamoDbImage
): Maybe<ManufacturerDetails> => {
  if (!manufacturerDetails) {
    return undefined;
  }

  return {
    name: manufacturerDetails.getString("name"),
    address1: manufacturerDetails.getString("address1"),
    address2: manufacturerDetails.getString("address2"),
    postTown: manufacturerDetails.getString("postTown"),
    address3: manufacturerDetails.getString("address3"),
    postCode: manufacturerDetails.getString("postCode"),
    emailAddress: manufacturerDetails.getString("emailAddress"),
    telephoneNumber: manufacturerDetails.getString("telephoneNumber"),
    faxNumber: manufacturerDetails.getString("faxNumber"),
    manufacturerNotes: manufacturerDetails.getString("manufacturerNotes"),
  };
};
