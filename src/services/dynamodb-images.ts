import {AttributeValue} from "aws-sdk/clients/dynamodbstreams";
import { parseISO } from "date-fns";
import {Maybe} from "../models/optionals";

export type DynamoDbItemType = "NULL" | "BOOL" | "S" | "N" | "B" | "M" | "L";
export type DynamoDbArrayType = "SS" | "NS" | "BS";
export type DynamoDbType = DynamoDbItemType | DynamoDbArrayType;

export interface DynamoDbField {
    key: string;
    type: DynamoDbType;
    value: any;
}

/**
 * Concise, utility-focused representation of a DynamoDb "image", i.e. a document snapshot.
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
     * Parse DynamoDB's native format into a {@link DynamoDbImage}.
     *
     * This is the only way to instantiate this class.
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
     * Parse a {@code NULL} field with any name as a {@code null}.
     *
     * Does nothing. Returns {@code null} in all cases.
     * @param _
     * @returns {@code null}, regardless of input
     */
    public getNull(_: string): null {
        return null;
    }

    /**
     * Parse the {@code BOOL} field under {@code key} as a {@code boolean}.
     * @param key
     */
    public getBoolean(key: string): boolean {
        return this.parse(key, "BOOL", ((v: any) => v as boolean), false);
    }

    /**
     * Parse the {@code S} field under {@code key} as a {@code string}.
     * @param key
     */
    public getString(key: string): Maybe<string> {
        return this.parseItem(key, "S", ((v: any) => v as string));
    }

    /**
     * Parse the {@code S} field under {@code key} as a {@code string}.
     * @param key
     */
    public getDateTime(key: string): Maybe<string> {
        return this.parseItem(
            key,
            "S",
            ((v: any) => {
                const parsedDate = parseISO(v);
                const year = parsedDate.getUTCFullYear();
                const month = padToTwo(parsedDate.getUTCMonth() + 1);
                const date = padToTwo(parsedDate.getUTCDate());
                const hours = padToTwo(parsedDate.getUTCHours());
                const minutes = padToTwo(parsedDate.getUTCMinutes());
                const seconds = padToTwo(parsedDate.getUTCSeconds());
                const ms = parsedDate.getUTCMilliseconds();

                return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${ms}`;
            }));
    }

    /**
     * Parse the {@code SS} field under {@code key} as a {@code string[]}.
     * @param key
     */
    public getStrings(key: string): string[] {
        return this.parseArray(key, "SS", ((arr: any) => arr as string[]));
    }

    /**
     * Parse the {@code N} field under {@code key} as a {@code number}.
     * @param key
     */
    public getNumber(key: string): Maybe<number> {
        return this.parseItem(key, "N", ((v: any) => parseFloat(v)));
    }

    /**
     * Parse the {@code NS} field under {@code key} as a {@code number[]}.
     * @param key
     */
    public getNumbers(key: string): number[] {
        return this.parseArray(key, "NS", ((arr: any) => arr.map((e: any) => parseFloat(e)) as number[]));
    }

    /**
     * Parse the {@code B} field under {@code key} as a {@code Buffer}.
     * @param key
     */
    public getBinary(key: string): Maybe<Buffer> {
        return this.parseItem(key, "B", ((v: any) => Buffer.from(v, "base64") as Buffer));
    }

    /**
     * Parse the {@code BS} field under {@code key} as a {@code Buffer[]}.
     * @param key
     */
    public getBinaries(key: string): Buffer[] {
        return this.parseArray(key, "BS", ((arr: any) => arr.map((e: string) => Buffer.from(e, "base64")) as Buffer[]));
    }

    /**
     * Parse the {@code M} field under {@code key} as a {@link DynamoDbImage}.
     * @param key
     */
    public getMap(key: string): Maybe<DynamoDbImage> {
        return this.parseItem(key, "M", ((v: any) => DynamoDbImage.parse(v) as DynamoDbImage));
    }

    /**
     * Parse the {@code L} field under {@code key} as a {@link DynamoDbImage}.
     *
     * The resulting image's field keys will all be numeric indexes ("0", "1", "2", ...).
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
     * Return all field keys this instance knows about.
     *
     * Use this function instead of Object::keys when iterating over type {@code L} fields.
     */
    public getKeys(): string[] {
        return Array.from(this.fields.keys());
    }

    /**
     * Parse a field of type {@link DynamoDbItemType}.
     * @param key
     * @param expectedType
     * @param parser
     * @private
     */
    private parseItem<T>(key: string, expectedType: DynamoDbItemType, parser: (value: any) => T): Maybe<T> {
        return this.parse(key, expectedType, parser, undefined);
    }

    /**
     * Parse a field of type {@link DynamoDbArrayType}.
     * @param key
     * @param expectedType
     * @param parser
     * @private
     */
    private parseArray<E>(key: string, expectedType: DynamoDbArrayType, parser: (value: any) => E[]): E[] {
        return this.parse(key, expectedType, parser, []);
    }

    private parse<ANY>(key: string, expectedType: DynamoDbType, parser: (value: any) => ANY, defaultValue: ANY): ANY {
        const field: Maybe<DynamoDbField> = this.fields.get(key);

        if (!field) {
            return defaultValue;
        }

        switch (field.type) {
            case "NULL": {
                // account for explicit nulls in source data
                return defaultValue;
            }
            default: {
                verifyType(expectedType, field);
                return parser(field.value);
            }
        }
    }
}

const padToTwo = (digit: number): string => {
    return digit > 9 ? digit.toString() : "0" + digit;
  };

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
