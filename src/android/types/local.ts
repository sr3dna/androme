export interface SettingsAndroid extends Settings {
    targetAPI: number;
    density: number;
    dimensResourceValue: boolean;
    numberResourceValue: boolean;
    fontAliasResourceValue: boolean;
    vectorColorResourceValue: boolean;
    ellipsisOnTextOverflow: boolean;
    constraintChainDisabled: boolean;
    constraintChainPackedHorizontalOffset: number;
    constraintChainPackedVerticalOffset: number;
    constraintCirclePositionAbsolute: boolean;
    constraintPercentAccuracy: number;
    showAttributes: boolean;
    convertPixels: string;
}

export type ViewAttribute = {
    android: StringMap;
    app: StringMap;
};

export type Constraint = {
    horizontal: boolean;
    vertical: boolean;
    current: {
        adjacent: string,
        orientation: string,
        overwrite: boolean;
    };
    layoutWidth: boolean;
    layoutHeight: boolean;
    layoutHorizontal: boolean;
    layoutVertical: boolean;
    marginHorizontal: string;
    marginVertical: string;
    guideline: ObjectMapNested<ObjectMapNested<number>>
};

export type BackgroundImage = {
    src: string;
    top: string;
    right: string;
    bottom: string;
    left: string;
    gravity: string;
    tileMode: string;
    tileModeX: string;
    tileModeY: string;
    width: string;
    height: string;
};

export type BackgroundGradient = {
    type: string;
    startColor: string;
    endColor: string;
    centerColor: string;
    colorStop: ColorStop[];
    angle?: string;
    startX?: string;
    startY?: string;
    endX?: string;
    endY?: string;
    centerX?: string;
    centerY?: string;
    gradientRadius?: string;
    tileMode?: string;
};

export type ResourceStyleData = {
    name: string;
    parent?: string;
    attrs: string;
    ids: number[];
};