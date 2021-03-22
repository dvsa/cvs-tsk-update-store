import {DynamoDbImage} from "../services/dynamodb-images";

export type ApplicantDetailsProperties = {
    name: string,
    address1: string,
    address2: string,
    postTown: string,
    address3: string,
    postCode: string,
    emailAddress: string,
    telephoneNumber: string,
}

export const parseApplicantDetailsProperties = (applicantDetailsProperties: DynamoDbImage): ApplicantDetailsProperties => {
    return {
        name: applicantDetailsProperties.getString("name"),
        address1: applicantDetailsProperties.getString("address1"),
        address2: applicantDetailsProperties.getString("address1"),
        postTown: applicantDetailsProperties.getString("postTown"),
        address3: applicantDetailsProperties.getString("address1"),
        postCode: applicantDetailsProperties.getString("postCode"),
        emailAddress: applicantDetailsProperties.getString("emailAddress"),
        telephoneNumber: applicantDetailsProperties.getString("telephoneNumber")
    }
}
