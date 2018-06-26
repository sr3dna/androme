import { BUILD_ANDROID as BUILD } from './constants';

export default {
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