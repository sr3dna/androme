import { ObjectMap } from '../lib/types';
import { BUILD_ANDROID as BUILD } from './constants';

interface DEFAULT {
    [index: number]: {
        android?: string[];
        customizations?: ObjectMap<any>;
    };
}

const API_ANDROID: DEFAULT = {
    [BUILD.OREO]: {
        android: ['fontWeight', 'layout_marginHorizontal', 'layout_marginVertical', 'paddingHorizontal', 'paddingVertical'],
        customizations: {}
    },
    [BUILD.JELLYBEAN_1]: {
        android: ['labelFor'],
        customizations: {}
    },
    [BUILD.LOLLIPOP]: {
        android: ['layout_columnWeight']
    },
    [BUILD.ALL]: {
        customizations: {
            'Button': {
                android: {
                    textAllCaps: 'false',
                    minWidth: '0dp',
                    minHeight: '0dp'
                }
            }
        }
    }
};

export default API_ANDROID;