import {DynamoDbImage} from "../services/dynamodb-images";
import {SqlParametersList} from "aws-sdk/clients/rdsdataservice";
import {stringParam} from "../services/sql-parameter";

export interface ApplicantDetailsProperties {
    name: string;
    address1: string;
    address2: string;
    postTown: string;
    address3: string;
    postCode: string;
    emailAddress: string;
    telephoneNumber: string;
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

export const toContactDetailsSqlParameters = (applicantDetailsProperties: ApplicantDetailsProperties): SqlParametersList => {
    const sqlParameters: SqlParametersList = [];

    sqlParameters.push(stringParam("name", applicantDetailsProperties.name));
    sqlParameters.push(stringParam("address1", applicantDetailsProperties.address1));
    sqlParameters.push(stringParam("address2", applicantDetailsProperties.address2));
    sqlParameters.push(stringParam("postTown", applicantDetailsProperties.postTown));
    sqlParameters.push(stringParam("address3", applicantDetailsProperties.address3));
    sqlParameters.push(stringParam("postCode", applicantDetailsProperties.postCode));
    sqlParameters.push(stringParam("emailAddress", applicantDetailsProperties.emailAddress));
    sqlParameters.push(stringParam("telephoneNumber", applicantDetailsProperties.telephoneNumber));

    return sqlParameters;
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
