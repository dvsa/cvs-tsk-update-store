import { DynamoDbImage } from "../services/dynamodb-images";
import { Maybe } from "./optionals";

export interface ApplicantDetailsProperties {
  name?: string;
  address1?: string;
  address2?: string;
  postTown?: string;
  address3?: string;
  postCode?: string;
  emailAddress?: string;
  telephoneNumber?: string;
}

export const parseApplicantDetailsProperties = (
  applicantDetailsProperties?: DynamoDbImage
): Maybe<ApplicantDetailsProperties> => {
  if (!applicantDetailsProperties) {
    return undefined;
  }

  return {
    name: applicantDetailsProperties.getString("name"),
    address1: applicantDetailsProperties.getString("address1"),
    address2: applicantDetailsProperties.getString("address2"),
    postTown: applicantDetailsProperties.getString("postTown"),
    address3: applicantDetailsProperties.getString("address3"),
    postCode: applicantDetailsProperties.getString("postCode"),
    emailAddress: applicantDetailsProperties.getString("emailAddress"),
    telephoneNumber: applicantDetailsProperties.getString("telephoneNumber"),
  };
};
