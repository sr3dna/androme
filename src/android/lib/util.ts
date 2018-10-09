import { BUILD_ANDROID } from './constant';

let MAP_ID: ObjectMap<string[]>;

export function resetId() {
    MAP_ID = {
        android: ['parent']
    };
}

export function generateId(section: string, name: string) {
    if (MAP_ID == null) {
        resetId();
    }
    let prefix = name;
    let i = 1;
    const match = name.match(/^(\w+)_([0-9]+)$/);
    if (match) {
        prefix = match[1];
        i = parseInt(match[2]);
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
            name = `${prefix}_${i++}`;
        }
    }
    while (true);
    return name;
}

export function stripId(value: Null<string>) {
    return value ? value.replace(/@\+?id\//, '') : '';
}

export function convertDP(value: any, dpi = 160, font = false) {
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
            return value.replace(/("|>)(-)?([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + (capture[1] || '') + convertDP(capture[2], density, font) + capture[3]);
        default:
            return value;
    }
}

export function calculateBias(start: number, end: number, accurracy: number) {
    return (
        parseFloat(
            Math.max(start === 0 ? 0
                                 : (end === 0 ? 1 : (start / (start + end))), 0)
                .toFixed(accurracy)
        )
    );
}

export function parseRTL(value: string, { supportRTL = true, targetAPI = BUILD_ANDROID.JELLYBEAN_1 }) {
    if (supportRTL && targetAPI >= BUILD_ANDROID.JELLYBEAN_1) {
        value = value.replace(/left/g, 'start').replace(/right/g, 'end');
        value = value.replace(/Left/g, 'Start').replace(/Right/g, 'End');
    }
    return value;
}