export const WIDGET_ANDROID =
{
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
    SPINNER: 'Spinner',
    CHECKBOX: 'CheckBox',
    RADIO: 'RadioButton',
    BUTTON: 'Button',
    VIEW: 'View',
    SPACE: 'Space'
};

export const FIXED_ANDROID =
[
    WIDGET_ANDROID.EDIT,
    WIDGET_ANDROID.SPINNER,
    WIDGET_ANDROID.CHECKBOX,
    WIDGET_ANDROID.RADIO,
    WIDGET_ANDROID.BUTTON
];

export const MAPPING_CHROME =
{
    'TEXT': WIDGET_ANDROID.TEXT,
    'LABEL': WIDGET_ANDROID.TEXT,
    'P': WIDGET_ANDROID.TEXT,
    'HR': WIDGET_ANDROID.VIEW,
    'IMG': WIDGET_ANDROID.IMAGE,
    'SELECT': WIDGET_ANDROID.SPINNER,
    'INPUT' : {
        'text': WIDGET_ANDROID.EDIT,
        'password': WIDGET_ANDROID.EDIT,
        'checkbox': WIDGET_ANDROID.CHECKBOX,
        'radio': WIDGET_ANDROID.RADIO,
        'button': WIDGET_ANDROID.BUTTON,
        'submit': WIDGET_ANDROID.BUTTON
    },
    'BUTTON': WIDGET_ANDROID.BUTTON,
    'TEXTAREA': WIDGET_ANDROID.EDIT
};

export const BLOCK_CHROME =
[
    'ADDRESS',
    'ARTICLE',
    'ASIDE',
    'BLOCKQUOTE',
    'CANVAS',
    'DD',
    'DIV',
    'DL',
    'DT',
    'FIELDSET',
    'FIGCAPTION',
    'FIGURE',
    'FOOTER',
    'FORM',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HEADER',
    'LI',
    'MAIN',
    'NAV',
    'OL',
    'OUTPUT',
    'P',
    'PRE',
    'SECTION',
    'TABLE',
    'TFOOT',
    'UL',
    'VIDEO'
];

export const INLINE_CHROME =
[
    'STRONG',
    'B',
    'EM',
    'CITE',
    'DFN',
    'I',
    'BIG',
    'SMALL',
    'FONT',
    'BLOCKQUOTE',
    'TT',
    'A',
    'U',
    'SUP',
    'SUB',
    'STRIKE',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'DEL',
    'TEXT'
];

export const INHERIT_ANDROID =
{
    'TextView': {
        'fontFamily': 'android:fontFamily="{0}"',
        'fontSize': 'android:textSize="{0}"',
        'fontWeight': 'android:fontWeight="{0}"',
        'fontStyle': 'android:textStyle="{0}"',
        'color': 'android:textColor="{0}"'
    }
};

export const DENSITY_ANDROID =
{
    LDPI: 120,
    MDPI: 160,
    HDPI: 240,
    XHDPI: 320,
    XXHDPI: 480,
    XXXHDPI: 640
};

export const BUILD_ANDROID =
{
    OREO_1: 27,
    OREO: 26,
    NOUGAT_1: 25,
    NOUGAT: 24,
    MARSHMALLOW: 23,
    LOLLIPOP_1: 22,
    LOLLIPOP: 21,
    KITKAT_1: 20,
    KITKAT: 19,
    JELLYBEAN_2: 18,   
    JELLYBEAN_1: 17,
    JELLYBEAN: 16,
    ICE_CREAM_SANDWICH_1: 15,
    ICE_CREAM_SANDWICH: 14,
    HONEYCOMB_2: 13,
    HONEYCOMB_1: 12,
    HONEYCOMB: 11
};

BUILD_ANDROID.LATEST = BUILD_ANDROID.OREO_1;

export const API_ANDROID = {
    [BUILD_ANDROID.OREO]: {
        android: ['fontWeight'],
        customizations: {}
    },
    [BUILD_ANDROID.JELLYBEAN_1]: {
        android: ['labelFor'],
        customizations: {}
    },
    [BUILD_ANDROID.LOLLIPOP]: {
        android: ['layout_columnWeight'],
        customizations: {
            'Button': {
                android: {
                    textAllCaps: 'false'
                }
            }
        }
    }
};

export const XMLNS_ANDROID =
{
    ANDROID: 'xmlns:android="http://schemas.android.com/apk/res/android"',
    APP: 'xmlns:app="http://schemas.android.com/apk/res-auto"',
    TOOLS: 'xmlns:tools="http://schemas.android.com/tools"'
};