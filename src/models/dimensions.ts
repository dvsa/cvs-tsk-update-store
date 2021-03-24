import {DynamoDbImage} from "../services/dynamodb-images";

export interface Dimensions {
    length?: number;
    height?: number;
    width?: number;
    axleSpacing?: AxleSpacing;
}

export type AxleSpacing = AxleSpacingItem[];

export interface AxleSpacingItem {
    axles?: string;
    value?: number;
}

export const parseDimensions = (dimensions?: DynamoDbImage): Dimensions | undefined => {
    if (!dimensions) {
        return undefined;
    }

    const axleSpacing = parseAxleSpacing(dimensions.getList("axleSpacing"));

    return {
        length: dimensions.getNumber("length"),
        height: dimensions.getNumber("height"),
        width: dimensions.getNumber("width"),
        axleSpacing
    };
};

const parseAxleSpacing = (axleSpacingImage?: DynamoDbImage) => {
    if (!axleSpacingImage) {
        return [] as AxleSpacing;
    }

    const axleSpacing: AxleSpacing = [];

    for (const key of axleSpacingImage.getKeys()) {
        const axleSpacingItemImage = axleSpacingImage.getMap(key)!;
        axleSpacing.push({
            axles: axleSpacingItemImage.getString("axles"),
            value: axleSpacingItemImage.getNumber("value")
        });
    }

    return axleSpacing;
};
