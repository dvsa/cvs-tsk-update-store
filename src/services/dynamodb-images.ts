import {AttributeValue} from "aws-sdk/clients/dynamodbstreams";

export type DynamoDbType = "NULL" | "BOOL" | "S" | "SS" | "N" | "NS" | "B" | "BS" | "M" | "L";

export interface DynamoDbField {
    key: string;
    type: DynamoDbType;
    value: any;
}

/**
 * placeholder
 */
export class DynamoDbImage {
    private readonly fields: Map<string, DynamoDbField>;

    private constructor(list: DynamoDbField[]) {
        this.fields = list.reduce(
            (map: Map<string, DynamoDbField>, field: DynamoDbField): Map<string, DynamoDbField> => {
                map.set(field.key, field);
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
            const value: AttributeValue = image[fieldKey];

            const typeKeys = Object.keys(value);

            if (typeKeys.length !== 1) {
                throw new Error(`expected exactly 1 type key, found ${typeKeys.length} (${typeKeys})`);
            }

            const typeKey: DynamoDbType = typeKeys[0] as DynamoDbType;

            fields.push({
                key: fieldKey,
                type: typeKey,
                value: value[typeKey]
            });
        }

        return new DynamoDbImage(fields);
    }

    /**
     * placeholder
     * @param expectedType
     * @param field
     */
    private static verifyType(expectedType: DynamoDbType, field: DynamoDbField) {
        if (expectedType !== field.type) {
            throw new Error(`field ${field.key} is not of type "${expectedType}" (actual: "${field.type}"`);
        }
    }

    /**
     * placeholder
     * @param key
     */
    public getNull(key: string): null {
        const field: DynamoDbField = this.getRequired(key);
        DynamoDbImage.verifyType("NULL", field);
        return field.value as null;
    }

    /**
     * placeholder
     * @param key
     */
    public getBoolean(key: string): boolean {
        const field: DynamoDbField = this.getRequired(key);
        DynamoDbImage.verifyType("BOOL", field);
        return field.value as boolean;
    }

    /**
     * placeholder
     * @param key
     */
    public getString(key: string): string {
        const field: DynamoDbField = this.getRequired(key);
        DynamoDbImage.verifyType("S", field);
        return field.value as string;
    }

    /**
     * placeholder
     * @param key
     */
    public getStrings(key: string): string[] {
        const field: DynamoDbField = this.getRequired(key);
        DynamoDbImage.verifyType("SS", field);
        return field.value as string[];
    }

    /**
     * placeholder
     * @param key
     */
    public getNumber(key: string): number {
        const field: DynamoDbField = this.getRequired(key);
        DynamoDbImage.verifyType("N", field);
        return field.value as number;
    }

    /**
     * placeholder
     * @param key
     */
    public getNumbers(key: string): number[] {
        const field: DynamoDbField = this.getRequired(key);
        DynamoDbImage.verifyType("NS", field);
        return field.value as number[];
    }

    /**
     * placeholder
     * @param key
     */
    public getBinary(key: string): Buffer {
        const field: DynamoDbField = this.getRequired(key);
        DynamoDbImage.verifyType("B", field);
        return Buffer.from(field.value, "base64");
    }

    /**
     * placeholder
     * @param key
     */
    public getBinaries(key: string): Buffer[] {
        const field: DynamoDbField = this.getRequired(key);
        DynamoDbImage.verifyType("BS", field);
        return field.value.map((e: string) => Buffer.from(e, "base64"));
    }

    /**
     * placeholder
     * @param key
     */
    public getMap(key: string): Map<string, any> {
        const field: DynamoDbField = this.getRequired(key);
        DynamoDbImage.verifyType("M", field);

        const map: Map<string, any> = new Map();

        for (const mapKey of Object.keys(field.value)) {
            map.set(mapKey, field.value[mapKey]);
        }

        return map;
    }

    /**
     * placeholder
     * @param key
     */
    public getList(key: string): any[] {
        const field: DynamoDbField = this.getRequired(key);
        DynamoDbImage.verifyType("L", field);
        return field.value as any[];
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
