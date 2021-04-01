import {AttributeValue} from "aws-sdk/clients/dynamodbstreams";
import {Maybe} from "../models/optionals";

export type DynamoDbItemType = "NULL" | "BOOL" | "S" | "N" | "B" | "M" | "L";
export type DynamoDbArrayType = "SS" | "NS" | "BS";
export type DynamoDbType = DynamoDbItemType | DynamoDbArrayType;

export interface DynamoDbField {
    key: string;
    type: DynamoDbType;
    value: any;
}

// maps type "L", subtype "S" to string[]
// note difference with DynamoDbImage::getStrings, which maps type "SS" to string[]
export const parseStringArray = (listOfStrings?: DynamoDbImage): string[] => {
    if (!listOfStrings) {
        return [];
    }

    const strings: string[] = [];

    for (const key of listOfStrings.getKeys()) {
        strings.push(listOfStrings.getString(key)!);
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
     * @param _
     */
    public getNull(_: string): null {
        return null;
    }

    /**
     * placeholder
     * @param key
     */
    public getBoolean(key: string): boolean {
        return this.parse(key, "BOOL", ((v: any) => v as boolean), false);
    }

    /**
     * placeholder
     * @param key
     */
    public getString(key: string): Maybe<string> {
        return this.parseItem(key, "S", ((v: any) => v as string));
    }

    /**
     * placeholder
     * @param key
     */
    public getStrings(key: string): string[] {
        return this.parseArray(key, "SS", ((arr: any) => arr as string[]));
    }

    /**
     * placeholder
     * @param key
     */
    public getNumber(key: string): Maybe<number> {
        return this.parseItem(key, "N", ((v: any) => parseFloat(v)));
    }

    /**
     * placeholder
     * @param key
     */
    public getNumbers(key: string): number[] {
        return this.parseArray(key, "NS", ((arr: any) => arr.map((e: any) => parseFloat(e)) as number[]));
    }

    /**
     * placeholder
     * @param key
     */
    public getBinary(key: string): Maybe<Buffer> {
        return this.parseItem(key, "B", ((v: any) => Buffer.from(v, "base64") as Buffer));
    }

    /**
     * placeholder
     * @param key
     */
    public getBinaries(key: string): Buffer[] {
        return this.parseArray(key, "BS", ((arr: any) => arr.map((e: string) => Buffer.from(e, "base64")) as Buffer[]));
    }

    /**
     * placeholder
     * @param key
     */
    public getMap(key: string): Maybe<DynamoDbImage> {
        return this.parseItem(key, "M", ((v: any) => DynamoDbImage.parse(v) as DynamoDbImage));
    }

    /**
     * placeholder
     * @param key
     */
    public getList(key: string): Maybe<DynamoDbImage> {
        return this.parseItem(key, "L", ((v: any) => {
            let index = 0;
            return new DynamoDbImage(
                v
                    .map((e: AttributeValue) => typeValuePair(e))
                    .map(([type, value]: [DynamoDbType, any]) => {
                        return {
                            key: "" + (index++),
                            type,
                            value
                        } as DynamoDbField;
                    })
            );
        }));
    }

    /**
     * placeholder
     */
    public getKeys(): string[] {
        return Array.from(this.fields.keys());
    }

    /**
     * placeholder
     * @param key
     * @param expectedType
     * @param parser
     * @private
     */
    private parseItem<T>(key: string, expectedType: DynamoDbItemType, parser: (value: any) => T): Maybe<T> {
        return this.parse(key, expectedType, parser, undefined);
    }

    /**
     * placeholder
     * @param key
     * @param expectedType
     * @param parser
     * @private
     */
    private parseArray<E>(key: string, expectedType: DynamoDbArrayType, parser: (value: any) => E[]): E[] {
        return this.parse(key, expectedType, parser, []);
    }

    /**
     * placeholder
     * @param key
     * @param expectedType
     * @param parser
     * @param defaultValue
     * @private
     */
    private parse<ANY>(key: string, expectedType: DynamoDbType, parser: (value: any) => ANY, defaultValue: ANY): ANY {
        const field: Maybe<DynamoDbField> = this.fields.get(key);

        if (!field) {
            return defaultValue;
        }

        switch (field.type) {
            case "NULL": {
                return defaultValue;
            }
            default: {
                verifyType(expectedType, field);
                return parser(field.value);
            }
        }
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
