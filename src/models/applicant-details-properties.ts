import {DynamoDbImage} from "../services/dynamodb-images";

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

export const parseApplicantDetailsProperties = (applicantDetailsProperties: DynamoDbImage): ApplicantDetailsProperties => {
    return {
        name: applicantDetailsProperties.getString("name"),
        address1: applicantDetailsProperties.getString("address1"),
        address2: applicantDetailsProperties.getString("address2"),
        postTown: applicantDetailsProperties.getString("postTown"),
        address3: applicantDetailsProperties.getString("address3"),
        postCode: applicantDetailsProperties.getString("postCode"),
        emailAddress: applicantDetailsProperties.getString("emailAddress"),
        telephoneNumber: applicantDetailsProperties.getString("telephoneNumber")
    };
};

export const toContactDetailsTemplateVariables = (applicantDetailsProperties: ApplicantDetailsProperties): any[] => {
    const templateVariables: any[] = [];

    templateVariables.push(applicantDetailsProperties.name);
    templateVariables.push(applicantDetailsProperties.address1);
    templateVariables.push(applicantDetailsProperties.address2);
    templateVariables.push(applicantDetailsProperties.postTown);
    templateVariables.push(applicantDetailsProperties.address3);
    templateVariables.push(applicantDetailsProperties.postCode);
    templateVariables.push(applicantDetailsProperties.emailAddress);
    templateVariables.push(applicantDetailsProperties.telephoneNumber);

    return templateVariables;
};
