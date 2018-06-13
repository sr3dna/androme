import { BUILD_ANDROID } from './constants';

export default {
    [BUILD_ANDROID.OREO]:
    {
        android: ['fontWeight'],
        customizations: {}
    },
    [BUILD_ANDROID.JELLYBEAN_1]:
    {
        android: ['labelFor'],
        customizations: {}
    },
    [BUILD_ANDROID.LOLLIPOP]:
    {
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