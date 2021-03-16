import {ParameterName, SqlParameter} from "aws-sdk/clients/rdsdataservice";

export const stringValue = (name: ParameterName, value: string): SqlParameter => {
    return {
        name,
        value: {
            stringValue: value
        }
    }
}

export const longValue = (name: ParameterName, value: number): SqlParameter => {
    return {
        name,
        value: {
            longValue: value
        }
    }
}
