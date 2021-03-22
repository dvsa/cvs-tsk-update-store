import {ParameterName, SqlParameter} from "aws-sdk/clients/rdsdataservice";

export const booleanParam = (name: ParameterName, value: boolean): SqlParameter => {
    return {
        name,
        value: {
            booleanValue: value
        }
    };
};

export const integerParam = (name: ParameterName, value: number): SqlParameter => {
    return {
        name,
        value: {
            longValue: value
        }
    };
};

export const stringParam = (name: ParameterName, value: string): SqlParameter => {
    return {
        name,
        value: {
            stringValue: value
        }
    };
};

export const dateParam = (name: ParameterName, value: string): SqlParameter => {
    return {
        name,
        typeHint: "DATE",
        value: {
            stringValue: value
        }
    };
};

export const timeParam = (name: ParameterName, value: string): SqlParameter => {
    return {
        name,
        typeHint: "TIME",
        value: {
            stringValue: value
        }
    };
};

export const timestampParam = (name: ParameterName, value: string): SqlParameter => {
    return {
        name,
        typeHint: "TIMESTAMP",
        value: {
            stringValue: value
        }
    };
};
