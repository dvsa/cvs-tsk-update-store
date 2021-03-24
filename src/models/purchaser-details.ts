import {DynamoDbImage} from "../services/dynamodb-images";
import {Maybe} from "./optionals";

export interface PurchaserDetails {
    name?: string;
    address1?: string;
    address2?: string;
    postTown?: string;
    address3?: string;
    postCode?: string;
    emailAddress?: string;
    telephoneNumber?: string;
    faxNumber?: string;
    purchaserNotes?: string;
}

export const parsePurchaserDetails = (purchaserDetails?: DynamoDbImage): Maybe<PurchaserDetails> => {
    if (!purchaserDetails) {
        return undefined;
    }

    return {
        name: purchaserDetails.getString("name"),
        address1: purchaserDetails.getString("address1"),
        address2: purchaserDetails.getString("address2"),
        postTown: purchaserDetails.getString("postTown"),
        address3: purchaserDetails.getString("address3"),
        postCode: purchaserDetails.getString("postCode"),
        emailAddress: purchaserDetails.getString("emailAddress"),
        telephoneNumber: purchaserDetails.getString("telephoneNumber"),
        faxNumber: purchaserDetails.getString("faxNumber"),
        purchaserNotes: purchaserDetails.getString("purchaserNotes")
    };
};
