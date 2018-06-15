export enum BUILD_ANDROID {
    OREO_1 = 27,
    OREO = 26,
    NOUGAT_1 = 25,
    NOUGAT = 24,
    MARSHMALLOW = 23,
    LOLLIPOP_1 = 22,
    LOLLIPOP = 21,
    KITKAT_1 = 20,
    KITKAT = 19,
    JELLYBEAN_2 = 18,
    JELLYBEAN_1 = 17,
    JELLYBEAN = 16,
    ICE_CREAM_SANDWICH_1 = 15,
    ICE_CREAM_SANDWICH = 14,
    LATEST = 27
}

export enum DENSITY_ANDROID {
    LDPI = 120,
    MDPI = 160,
    HDPI = 240,
    XHDPI = 320,
    XXHDPI = 480,
    XXXHDPI = 640
}

export const VIEW_ANDROID = {
    FRAME: 'FrameLayout',
    LINEAR: 'LinearLayout',
    CONSTRAINT: 'android.support.constraint.ConstraintLayout',
    GUIDELINE: 'android.support.constraint.Guideline',
    RELATIVE: 'RelativeLayout',
    GRID: 'GridLayout',
    SCROLL_VERTICAL: 'ScrollView',
    SCROLL_HORIZONTAL: 'HorizontalScrollView',
    SCROLL_NESTED: 'NestedScrollView',
    RADIO_GROUP: 'RadioGroup',
    TEXT: 'TextView',
    EDIT: 'EditText',
    IMAGE: 'ImageView',
    SELECT: 'Spinner',
    CHECKBOX: 'CheckBox',
    RADIO: 'RadioButton',
    BUTTON: 'Button',
    VIEW: 'View',
    SPACE: 'Space'
};

export const BOX_ANDROID = {
    MARGIN_TOP: 'layout_marginTop',
    MARGIN_RIGHT: 'layout_marginRight',
    MARGIN_BOTTOM: 'layout_marginBottom',
    MARGIN_LEFT: 'layout_marginLeft',
    PADDING_TOP: 'paddingTop',
    PADDING_RIGHT: 'paddingRight',
    PADDING_BOTTOM: 'paddingBottom',
    PADDING_LEFT: 'paddingLeft'
};

export const FIXED_ANDROID = [
    VIEW_ANDROID.EDIT,
    VIEW_ANDROID.SELECT,
    VIEW_ANDROID.CHECKBOX,
    VIEW_ANDROID.RADIO,
    VIEW_ANDROID.BUTTON
];

export const XMLNS_ANDROID = {
    'ANDROID': 'xmlns:android="http://schemas.android.com/apk/res/android"',
    'APP': 'xmlns:app="http://schemas.android.com/apk/res-auto"',
    'TOOLS': 'xmlns:tools="http://schemas.android.com/tools"'
};