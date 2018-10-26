import { BUILD_ANDROID } from './enumeration';

let MAP_ID: ObjectMap<string[]>;

export function resetId() {
    MAP_ID = {
        android: ['parent']
    };
}

export function generateId(section: string, name: string, start: number) {
    if (MAP_ID == null) {
        resetId();
    }
    const prefix = name;
    let i = start;
    if (start === 1) {
        name += `_${i.toString()}`;
    }
    if (MAP_ID[section] == null) {
        MAP_ID[section] = [];
    }
    do {
        if (!MAP_ID[section].includes(name)) {
            MAP_ID[section].push(name);
            break;
        }
        else {
            name = `${prefix}_${(++i).toString()}`;
        }
    }
    while (true);
    return name;
}

export function stripId(value: Null<string>) {
    return value ? value.replace(/@\+?id\//, '') : '';
}

export function convertUnit(value: any, dpi = 160, font = false) {
    if (value) {
        value = parseFloat(value);
        if (!isNaN(value)) {
            value /= (dpi / 160);
            value = value >= 1 || value === 0 ? Math.floor(value) : value.toFixed(2);
            return value + (font ? 'sp' : 'dp');
        }
    }
    return '0dp';
}

export function delimitUnit(nodeName: string, attr: string, size: string, { dimensResourceValue = true }) {
    return dimensResourceValue ? `{%${nodeName.toLowerCase()},${attr},${size}}` : size;
}

export function replaceUnit(value: string, { density = 160, convertPixels = 'dp' }, font = false) {
    switch (convertPixels) {
        case 'dp':
            return value.replace(/([">])(-)?(\d+(?:\.\d+)?px)(["<])/g, (match, ...capture) => capture[0] + (capture[1] || '') + convertUnit(capture[2], density, font) + capture[3]);
        default:
            return value;
    }
}

export function calculateBias(start: number, end: number, accuracy: number) {
    if (start === 0) {
        return 0;
    }
    else if (end === 0) {
        return 1;
    }
    else {
        return parseFloat(Math.max(start / (start + end), 0).toFixed(accuracy));
    }
}

export function parseRTL(value: string, { supportRTL = true, targetAPI = BUILD_ANDROID.JELLYBEAN_1 }) {
    if (supportRTL && targetAPI >= BUILD_ANDROID.JELLYBEAN_1) {
        value = value.replace(/left/g, 'start').replace(/right/g, 'end');
        value = value.replace(/Left/g, 'Start').replace(/Right/g, 'End');
    }
    return value;
}