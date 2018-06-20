import { BUILD_ANDROID as BUILD } from './constants';

export default {
    [0]: {
        customizations: {
            'Button': {
                android: {
                    minWidth: '0dp',
                    minHeight: '0dp'
                }
            }
        }
    },
    [BUILD.OREO]: {
        android: ['fontWeight'],
        customizations: {}
    },
    [BUILD.JELLYBEAN_1]: {
        android: ['labelFor'],
        customizations: {}
    },
    [BUILD.LOLLIPOP]: {
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