import { ObjectMap, StringMap } from '../lib/types';
import { BUILD_ANDROID as BUILD } from './constants';

type UserSupport = {
    [index: number]: {
        android: string[];
        app: string[];
        customizations: Customization;
    };
};

type Customization = {
    [namespace: string]: ObjectMap<StringMap>;
};

const API_ANDROID: UserSupport = {
    [BUILD.PIE]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.OREO_1]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.OREO]: {
        android: ['fontWeight', 'layout_marginHorizontal', 'layout_marginVertical', 'paddingHorizontal', 'paddingVertical'],
        app: [],
        customizations: {}
    },
    [BUILD.NOUGAT_1]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.NOUGAT]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.MARSHMALLOW]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.LOLLIPOP_1]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.LOLLIPOP]: {
        android: ['layout_columnWeight'],
        app: [],
        customizations: {}
    },
    [BUILD.KITKAT_1]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.KITKAT]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.JELLYBEAN_2]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.JELLYBEAN_1]: {
        android: ['labelFor'],
        app: [],
        customizations: {}
    },
    [BUILD.JELLYBEAN]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.ICE_CREAM_SANDWICH_1]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.ICE_CREAM_SANDWICH]: {
        android: [],
        app: [],
        customizations: {}
    },
    [BUILD.ALL]: {
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