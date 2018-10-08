export interface SettingsAndroid extends Settings {
    targetAPI: number;
    density: number;
    dimensResourceValue: boolean;
    numberResourceValue: boolean;
    fontAliasResourceValue: boolean;
    ellipsisOnTextOverflow: boolean;
    constraintChainDisabled: boolean;
    constraintChainPackedHorizontalOffset: number;
    constraintChainPackedVerticalOffset: number;
    constraintCirclePositionAbsolute: boolean;
    constraintPercentAccuracy: number;
    showAttributes: boolean;
    convertPixels: string;
}

export type Constraint = {
    horizontal: boolean,
    vertical: boolean,
    current: {
        adjacent: string,
        orientation: string,
        overwrite: boolean;
    },
    layoutWidth: boolean;
    layoutHeight: boolean;
    layoutHorizontal: boolean;
    layoutVertical: boolean;
    marginHorizontal: string;
    marginVertical: string;
    guideline: ObjectMapNested<ObjectMapNested<number>>
};