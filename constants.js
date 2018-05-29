const WIDGET_ANDROID =
{
    FRAME: 'FrameLayout',
    LINEAR: 'LinearLayout',
    CONSTRAINT: 'android.support.constraint.ConstraintLayout',
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

const FIXED_ANDROID =
[
    WIDGET_ANDROID.EDIT,
    WIDGET_ANDROID.SPINNER,
    WIDGET_ANDROID.CHECKBOX,
    WIDGET_ANDROID.RADIO,
    WIDGET_ANDROID.BUTTON
];

const MAPPING_CHROME =
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

const BLOCK_CHROME =
[
    'DIV',
    'LI',
    'TD',
    'SECTION',
    'SPAN'
];

const INLINE_CHROME =
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

const PROPERTY_ANDROID =
{
    'backgroundStyle': {
        'backgroundColor': 'android:background="@drawable/{0}"'
    },
    'computedStyle': {
        'fontFamily': 'android:fontFamily="{0}"',
        'fontSize': 'android:textSize="{0}"',
        'fontWeight': 'android:fontWeight="{0}"',
        'fontStyle': 'android:textStyle="{0}"',
        'color': 'android:textColor="{0}"',
        'backgroundColor': 'android:background="{0}"'
    },
    'boxSpacing': {
        'margin': 'android:layout_margin="{0}"',
        'marginTop': 'android:layout_marginTop="{0}"',
        'marginRight': 'android:layout_marginRight="{0}"',
        'marginEnd': 'android:layout_marginEnd="{0}"',
        'marginBottom': 'android:layout_marginBottom="{0}"',
        'marginLeft': 'android:layout_marginLeft="{0}"',
        'marginStart': 'android:layout_marginStart="{0}"',
        'padding': 'android:padding="{0}"',
        'paddingTop': 'android:paddingTop="{0}"',
        'paddingRight': 'android:paddingRight="{0}"',
        'paddingEnd': 'android:paddingEnd="{0}"',
        'paddingBottom': 'android:paddingBottom="{0}"',
        'paddingLeft': 'android:paddingLeft="{0}"',
        'paddingStart': 'android:paddingStart="{0}"'
    },
    'resourceString': {
        'text': 'android:text="{0}"'
    },
    'resourceStringArray': {
        'entries': 'android:entries="@array/{0}"'
    }
};

const ACTION_ANDROID =
{
    'FrameLayout': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'LinearLayout': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'RelativeLayout': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'android.support.constraint.ConstraintLayout': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'GridLayout': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'ScrollView': {
        'androidId': 'android:id="@+id/{0}"'
    },
    'HorizontalScrollView': {
        'androidId': 'android:id="@+id/{0}"'
    },
    'NestedScrollView': {
        'androidId': 'android:id="@+id/{0}"'
    },
    'RadioGroup': {
        'androidId': 'android:id="@+id/{0}"'
    },
    'RadioButton': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'CheckBox': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'Spinner': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceStringArray': PROPERTY_ANDROID['resourceStringArray']
    },
    'TextView': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceString': PROPERTY_ANDROID['resourceString']
    },
    'EditText': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceString': PROPERTY_ANDROID['resourceString']
    },
    'View': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'Button': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceString': PROPERTY_ANDROID['resourceString']
    },
    'ImageView': {
        'androidId': 'android:id="@+id/{0}"',
        'androidSrc': 'android:src="@drawable/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    }
};

const INHERIT_ANDROID =
{
    'TextView': {
        'fontFamily': 'android:fontFamily="{0}"',
        'fontSize': 'android:textSize="{0}"',
        'fontWeight': 'android:fontWeight="{0}"',
        'fontStyle': 'android:textStyle="{0}"',
        'color': 'android:textColor="{0}"'
    }
};

const DENSITY_ANDROID =
{
    LDPI: 120,
    MDPI: 160,
    HDPI: 240,
    XHDPI: 320,
    XXHDPI: 480,
    XXXHDPI: 640
};

const BUILD_ANDROID =
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

const API_ANDROID = {
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

const STRING_ANDROID =
{
    XML_DECLARATION: '<?xml version="1.0" encoding="utf-8"?>',
};

const XMLNS_ANDROID =
{
    ANDROID: 'xmlns:android="http://schemas.android.com/apk/res/android"',
    APP: 'xmlns:app="http://schemas.android.com/apk/res-auto"',
    TOOLS: 'xmlns:tools="http://schemas.android.com/tools"'
};