import {DynamoDbImage} from "../services/dynamodb-images";

export interface Dimensions {
    length: number;
    height: number;
    width: number;
    axleSpacing: AxleSpacing;
}

export type AxleSpacing = AxleSpacingItem[];

export interface AxleSpacingItem {
    axles: string;
    value: number;
}

export const parseDimensions = (dimensions: DynamoDbImage): Dimensions => {
    const axleSpacing: AxleSpacing = [];

    const axleSpacingImage = dimensions.getMap("axleSpacing");
    for (const key of Object.keys(axleSpacingImage)) {
        const axleSpacingItemImage = axleSpacingImage.getMap(key);
        axleSpacing.push({
            axles: axleSpacingItemImage.getString("axles"),
            value: axleSpacingItemImage.getNumber("value")
        });
    }

    return {
        length: dimensions.getNumber("length"),
        height: dimensions.getNumber("height"),
        width: dimensions.getNumber("width"),
        axleSpacing
    };
};
