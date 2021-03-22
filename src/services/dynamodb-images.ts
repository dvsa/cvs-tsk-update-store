import {AttributeValue} from "aws-sdk/clients/dynamodbstreams";

export type DynamoDbType = "NULL" | "BOOL" | "S" | "SS" | "N" | "NS" | "B" | "BS" | "M" | "L";

export interface DynamoDbField {
    key: string;
    type: DynamoDbType;
    value: any;
}

// maps type "L", subtype "S" to string[]
// note difference with DynamoDbImage::getStrings, which maps type "SS" to string[]
export const parseStringArray = (listOfStrings: DynamoDbImage): string[] => {
    const strings: string[] = [];

    for (const key of Object.keys(listOfStrings)) {
        strings.push(listOfStrings.getString(key));
    }

    return strings;
};

/**
 * placeholder
 */
export class DynamoDbImage {
    private readonly fields: Map<string, DynamoDbField>;

    private constructor(list: DynamoDbField[]) {
        this.fields = list.reduce(
            (map: Map<string, DynamoDbField>, field: DynamoDbField): Map<string, DynamoDbField> => {
                map.set(field.key!, field);
                return map;
            },
            new Map()
        );
    }

    /**
     * placeholder
     * @param image
     */
    public static parse(image: { [key: string]: AttributeValue }): DynamoDbImage {
        const fields: DynamoDbField[] = [];
        const fieldKeys = Object.keys(image);

        for (const fieldKey of fieldKeys) {
            const [typeKey, value] = typeValuePair(image[fieldKey]);

            fields.push({
                key: fieldKey,
                type: typeKey,
                value
            });
        }

        return new DynamoDbImage(fields);
    }

    /**
     * placeholder
     * @param key
     */
    public getNull(key: string): null {
        const field: DynamoDbField = this.getRequired(key);
        verifyType("NULL", field);
        return field.value as null;
    }

    /**
     * placeholder
     * @param key
     */
    public getBoolean(key: string): boolean {
        const field: DynamoDbField = this.getRequired(key);
        verifyType("BOOL", field);
        return field.value as boolean;
    }

    /**
     * placeholder
     * @param key
     */
    public getString(key: string): string {
        const field: DynamoDbField = this.getRequired(key);
        verifyType("S", field);
        return field.value as string;
    }

    /**
     * placeholder
     * @param key
     */
    public getStrings(key: string): string[] {
        const field: DynamoDbField = this.getRequired(key);
        verifyType("SS", field);
        return field.value as string[];
    }

    /**
     * placeholder
     * @param key
     */
    public getNumber(key: string): number {
        const field: DynamoDbField = this.getRequired(key);
        verifyType("N", field);
        return parseFloat(field.value) as number;
    }

    /**
     * placeholder
     * @param key
     */
    public getNumbers(key: string): number[] {
        const field: DynamoDbField = this.getRequired(key);
        verifyType("NS", field);
        return field.value.map((f: any) => parseFloat(f)) as number[];
    }

    /**
     * placeholder
     * @param key
     */
    public getBinary(key: string): Buffer {
        const field: DynamoDbField = this.getRequired(key);
        verifyType("B", field);
        return Buffer.from(field.value, "base64") as Buffer;
    }

    /**
     * placeholder
     * @param key
     */
    public getBinaries(key: string): Buffer[] {
        const field: DynamoDbField = this.getRequired(key);
        verifyType("BS", field);
        return field.value.map((e: string) => Buffer.from(e, "base64")) as Buffer[];
    }

    /**
     * placeholder
     * @param key
     */
    public getMap(key: string): DynamoDbImage {
        const field: DynamoDbField = this.getRequired(key);
        verifyType("M", field);
        return DynamoDbImage.parse(field.value) as DynamoDbImage;
    }

    /**
     * placeholder
     * @param key
     */
    public getList(key: string): DynamoDbImage {
        const field: DynamoDbField = this.getRequired(key);
        verifyType("L", field);
        let index = 0;
        return new DynamoDbImage(
            field.value
                .map((e: AttributeValue) => typeValuePair(e))
                .map(([type, value]: [DynamoDbType, any]) => {
                    return {
                        key: "" + (index++),
                        type,
                        value
                    } as DynamoDbField;
                })
        );
        // return field.value as DynamoDbImage;
    }

    /**
     * placeholder
     * @param key
     */
    public getRequired(key: string): DynamoDbField {
        const field: DynamoDbField | undefined = this.fields.get(key);

        if (!field) {
            throw new Error(`key ${key} not found`);
        }

        return field;
    }
}

const verifyType = (expectedType: DynamoDbType, field: DynamoDbField) => {
    if (expectedType !== field.type) {
        throw new Error(`field ${field.key} is not of type "${expectedType}" (actual: "${field.type}")`);
    }
};

const typeValuePair = (value: AttributeValue): [DynamoDbType, any] => {
    const typeKeys = Object.keys(value);

    if (typeKeys.length !== 1) {
        throw new Error(`expected exactly 1 type key, found ${typeKeys.length} (${typeKeys})`);
    }

    const typeKey: DynamoDbType = typeKeys[0] as DynamoDbType;

    return [typeKey, value[typeKey]];
};
