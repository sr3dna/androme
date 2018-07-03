import { BUILD_ANDROID } from './constants';
import SETTINGS from '../settings';

export default function parseRTL(value: string) {
    if (SETTINGS.supportRTL && SETTINGS.targetAPI >= BUILD_ANDROID.JELLYBEAN_1) {
        value = value.replace(/left/g, 'start').replace(/right/g, 'end');
        value = value.replace(/Left/g, 'Start').replace(/Right/g, 'End');
    }
    return value;
}