import { Null, ObjectMap, StringMap } from './types';

function sort<T>(list: T[], asc = 0, ...attrs: string[]) {
    return list.sort((a: T, b: T) => {
        for (const attr of attrs) {
            const result = compare(a, b, attr);
            if (result && result[0] !== result[1]) {
                if (asc === 0) {
                    return (result[0] > result[1] ? 1 : -1);
                }
                else {
                    return (result[0] < result[1] ? 1 : -1);
                }
            }
        }
        return 0;
    });
}

export function formatString(value: string, ...params: string[]) {
    for (let i = 0; i < params.length; i++) {
        value = value.replace(`{${i}}`, params[i]);
    }
    return value;
}

export function cameltoLowerCase(value: string) {
    value = value.charAt(0).toLowerCase() + value.substring(1);
    const result = value.match(/([a-z]{1}[A-Z]{1})/g);
    if (result) {
        for (const match of result) {
            value = value.replace(match, `${match[0]}_${match[1].toLowerCase()}`);
        }
    }
    return value;
}

export function convertCamelCase(value: string, char = '-') {
    value = value.replace(new RegExp(`^${char}+`), '');
    const result = value.match(new RegExp(`(${char}{1}[a-z]{1})`, 'g'));
    if (result) {
        for (const match of result) {
            value = value.replace(match, match[1].toUpperCase());
        }
    }
    return value;
}

export function convertWord(value: string) {
    return (value ? value.replace(/[^\w]/g, '_').trim() : '');
}

export function capitalize(value: string, upper = true) {
    return (value ? value.charAt(0)[(upper ? 'toUpperCase' : 'toLowerCase')]() + value.substring(1)[(upper ? 'toLowerCase' : 'toString')]() : '');
}

export function convertInt(value: any) {
    return (value && parseInt(value)) || 0;
}

export function convertFloat(value: any) {
    return (value && parseFloat(value)) || 0;
}

export function convertPX(value: any) {
    if (hasValue(value)) {
        if (isNumber(value)) {
            value = `${value}px`;
        }
        const match = value.match(/(pt|em)/);
        value = parseFloat(value);
        if (match) {
            switch (match[0]) {
                case 'pt':
                    value *= (4 / 3);
                    break;
                case 'em':
                    value *= 16;
                    break;
            }
        }
        if (!isNaN(value)) {
            return `${value}px`;
        }
    }
    return '0px';
}

export function formatPX(value: any) {
    value = parseFloat(value);
    return `${(!isNaN(value) ? Math.ceil(value) : 0)}px`;
}

export function convertAlpha(value: number) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    while (value >= alphabet.length) {
        const base = Math.floor(value / alphabet.length);
        if (base > 1 && base <= alphabet.length) {
            result += alphabet.charAt(base - 1);
            value -= base * alphabet.length;
        }
        else if (base > alphabet.length) {
            result += convertAlpha(base * alphabet.length);
            value -= base * alphabet.length;
        }
        const index = value % alphabet.length;
        result += alphabet.charAt(index);
        value -= index + alphabet.length;
    }
    result = alphabet.charAt(value) + result;
    return result;
}

export function convertRoman(value: number) {
    let result = '';
    const digits = value.toString().split('');
    const numerals = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM',
                      '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC',
                      '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
    let i = 3;
    while (i--) {
        result = (numerals[parseInt(digits.pop() || '') + (i * 10)] || '') + result;
    }
    return 'M'.repeat(parseInt(digits.join(''))) + result;
}

export function convertEnum(value: number, base: {}, derived: {}): string {
    for (const key of Object.keys(base)) {
        const index: number = base[key];
        if (value === index) {
            return derived[key];
        }
    }
    return '';
}

export function hasBit(value: number, type: number) {
    return ((value & type) === type);
}

export function isNumber(value: string) {
    return /^-?[0-9]+(\.[0-9]+)?$/.test(value.toString().trim());
}

export function isUnit(value?: string) {
    return /^-?[0-9\.]+(px|pt|em)$/.test((value || '').trim());
}

export function isPercent(value: string) {
    return /^[0-9]+(\.[0-9]+)?%$/.test(value);
}

export function includes(source: Null<string>, value: string, delimiter = ',') {
    return (source != null ? source.split(delimiter).map(segment => segment.trim()).includes(value) : false);
}

export function optional(obj: any, value: string, type?: string) {
    let valid = false;
    let result: any = null;
    if (obj != null) {
        const attrs = value.split('.');
        result = obj;
        let i = 0;
        do {
            result = (result[attrs[i]] != null ? result[attrs[i]] : null);
        }
        while (result != null && ++i < attrs.length && typeof result !== 'string' && typeof result !== 'number' && typeof result !== 'boolean');
        valid = (result != null && i === attrs.length);
    }
    switch (type) {
        case 'object':
            return (valid ? result : null);
        case 'number':
            return (valid && !isNaN(parseInt(result)) ? parseInt(result) : 0);
        case 'boolean':
            return (valid && result);
        default:
            return (valid ? result.toString() : '');
    }
}

export function resolvePath(value: string) {
    if (!/^\w+:\/\//.test(value)) {
        let pathname = location.pathname.split('/');
        pathname.pop();
        if (value.charAt(0) === '/') {
            value = location.origin + value;
        }
        else {
            if (value.startsWith('../')) {
                const parts: string[] = [];
                let levels = 0;
                value.split('/').forEach(dir => {
                    if (dir === '..') {
                        levels++;
                    }
                    else {
                        parts.push(dir);
                    }
                });
                pathname = pathname.slice(0, Math.max(pathname.length - levels, 0));
                pathname.push(...parts);
                value = location.origin + pathname.join('/');
            }
            else {
                value = `${location.origin + pathname.join('/')}/${value}`;
            }
        }
    }
    return value;
}

export function trim(value: string, char: string) {
    return trimStart(trimEnd(value, char), char);
}

export function trimStart(value: string, char: string) {
    return value.replace(new RegExp(`^${char}+`, 'g'), '');
}

export function trimEnd(value: string, char: string) {
    return value.replace(new RegExp(`${char}+$`, 'g'), '');
}

export function repeat(n: number, value = '\t') {
    return value.repeat(n);
}

export function indexOf(value: string, ...terms: string[]) {
    if (hasValue(value)) {
        for (const term of terms) {
            const index = value.indexOf(term);
            if (index !== -1) {
                return index;
            }
        }
    }
    return -1;
}

export function lastIndexOf(value: string, char = '/') {
    return value.substring(value.lastIndexOf(char) + 1);
}

export function same(obj1: {}, obj2: {}, ...attrs: string[]) {
    for (const attr of attrs) {
        const result = compare(obj1, obj2, attr);
        if (!result || result[0] !== result[1]) {
            return false;
        }
    }
    return true;
}

export function search(obj: ObjectMap<string>, value: string | StringMap) {
    const result: any[][] = [];
    if (typeof value === 'object') {
        for (const term in value) {
            const attr = value[term];
            if (hasValue(obj[attr])) {
                result.push([attr, obj[attr]]);
            }
        }
    }
    else {
        let filter = (a: string): boolean => (a === value);
        if (/^\*.+\*$/.test(value)) {
            filter = (a: string): boolean => (a.indexOf(value.replace(/\*/g, '')) !== -1);
        }
        else if (/^\*/.test(value)) {
            filter = (a: string): boolean => (a.endsWith(value.replace(/\*/, '')));
        }
        else if (/\*$/.test(value)) {
            filter = (a: string): boolean => (a.startsWith(value.replace(/\*/, '')));
        }
        for (const i in obj) {
            if (filter(i)) {
                result.push([i, obj[i]]);
            }
        }
    }
    return result;
}

export function compare(obj1: {}, obj2: {}, attr: string) {
    const namespaces = attr.split('.');
    let current1: any = obj1;
    let current2: any = obj2;
    for (const name of namespaces) {
        if (current1[name] != null && current2[name] != null) {
            current1 = current1[name];
            current2 = current2[name];
        }
        else if (current1[name] == null && current2[name] == null) {
            return false;
        }
        else if (current1[name] != null) {
            return [1, 0];
        }
        else {
            return [0, 1];
        }
    }
    if (!isNaN(parseInt(current1)) || !isNaN(parseInt(current2))) {
        return [convertInt(current1), convertInt(current2)];
    }
    else {
        return [current1, current2];
    }
}

export function hasValue(value: any) {
    return (typeof value !== 'undefined' && value !== null && value.toString().trim() !== '');
}

export function withinRange(a: number, b: number, n = 0) {
    return (b >= (a - n) && b <= (a + n));
}

export function withinFraction(lower: number, upper: number) {
    return (lower === upper || Math.floor(lower) === Math.floor(upper) || Math.ceil(lower) === Math.ceil(upper) || Math.ceil(lower) === Math.floor(upper) || Math.floor(lower) === Math.ceil(upper));
}

export function caseInsensitve(a: string | string[], b: string | string[]) {
    return (a.toString().toLowerCase() >= b.toString().toLowerCase() ? 1 : -1);
}

export function sortAsc<T>(list: T[], ...attrs: string[]) {
    return sort<T>(list, 0, ...attrs);
}

export function sortDesc<T>(list: T[], ...attrs: string[]) {
    return sort<T>(list, 1, ...attrs);
}