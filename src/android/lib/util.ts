import { ObjectMap } from '../.././lib/types';
import SETTINGS from '../../settings';

let ID: ObjectMap<string[]>;

export function resetId() {
    ID = {
        android: ['parent']
    };
}

export function generateId(section: string, name: string) {
    let prefix = name;
    let i = 1;
    const match = name.match(/^(\w+)_([0-9]+)$/);
    if (match != null) {
        prefix = match[1];
        i = parseInt(match[2]);
    }
    if (ID[section] == null) {
        ID[section] = [];
    }
    do {
        if (!ID[section].includes(name)) {
            ID[section].push(name);
            break;
        }
        else {
            name = `${prefix}_${i++}`;
        }
    }
    while (true);
    return name;
}

export function stripId(value: string) {
    return value.replace(/@\+?id\//, '');
}

export function convertDP(value: any, dpi = 160, font = false) {
    if (value) {
        value = parseFloat(value);
        if (!isNaN(value)) {
            value /= (dpi / 160);
            value = (value >= 1 || value === 0 ? Math.floor(value) : value.toFixed(2));
            return value + (font ? 'sp' : 'dp');
        }
    }
    return '0dp';
}

export function delimitDimens(tagName: string, attr: string, size: string) {
    return (SETTINGS.dimensResourceValue ? `{%${tagName.toLowerCase()},${attr},${size}}` : size);
}

export function replaceUnit(value: string, font = false) {
    switch (SETTINGS.convertPixels) {
        case 'dp':
            return value.replace(/("|>)(-)?([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + (capture[1] || '') + convertDP(capture[2], SETTINGS.density, font) + capture[3]);
        default:
            return value;
    }
}

export function calculateBias(start: number, end: number, accurracy?: number) {
    if (accurracy == null) {
        accurracy = SETTINGS.constraintPercentAccuracy;
    }
    return parseFloat(Math.max(start === 0 ? 0 : (end === 0 ? 1 : (start / (start + end))), 0).toFixed(accurracy));
}