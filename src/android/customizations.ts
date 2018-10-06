import { ObjectMap, StringMap } from '../lib/types';
import { BUILD_ANDROID } from './constants';

type Customizations = {
    [index: number]: {
        android: string[];
        app: string[];
        customizations: {
            [namespace: string]: ObjectMap<StringMap>;
        };
    };
};

const API_ANDROID: Customizations = {
    [BUILD_ANDROID.PIE]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.OREO_1]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.OREO]: {
        android: ['fontWeight', 'layout_marginHorizontal', 'layout_marginVertical', 'paddingHorizontal', 'paddingVertical'],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.NOUGAT_1]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.NOUGAT]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.MARSHMALLOW]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.LOLLIPOP_1]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.LOLLIPOP]: {
        android: ['layout_columnWeight'],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.KITKAT_1]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.KITKAT]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.JELLYBEAN_2]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.JELLYBEAN_1]: {
        android: ['labelFor'],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.JELLYBEAN]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.ICE_CREAM_SANDWICH_1]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.ICE_CREAM_SANDWICH]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD_ANDROID.ALL]: {
        android: [],
        app: [],
        customizations: {
            SUB: {
                android: {
                    layout_marginTop: '6px'
                }
            },
            SUP: {
                android: {
                    layout_marginTop: '-4px'
                }
            },
            Button: {
                android: {
                    textAllCaps: 'false'
                }
            }
        }
    }
};

export default API_ANDROID;