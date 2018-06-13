import { BUILD_ANDROID } from './constants';
import SETTINGS from '../settings';

export default function parseRTL(value: string) {
    if (SETTINGS.supportRTL && SETTINGS.targetAPI >= BUILD_ANDROID.JELLYBEAN_1) {
        switch (value) {
            case 'left':
                return 'start';
            case 'right':
                return 'end';
        }
        value = value.replace(/Left/g, 'Start').replace(/Right/g, 'End');
    }
    return value;
}