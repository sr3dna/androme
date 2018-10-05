import { Null, ObjectMap, StringMap } from './types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMERALS = [
    '', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM',
    '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC',
    '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'
];

function sort<T>(list: T[], asc = 0, ...attrs: string[]) {
    return list.sort((a: T, b: T) => {
        for (const attr of attrs) {
            const result = compareObject(a, b, attr);
            if (result && result[0] !== result[1]) {
                if (asc === 0) {
                    return result[0] > result[1] ? 1 : -1;
                }
                else {
                    return result[0] < result[1] ? 1 : -1;
                }
            }
        }
        return 0;
    });
}

export function partition<T>(list: T[], predicate: (value: T) => boolean): [T[], T[]] {
    const valid: T[] = [];
    const invalid: T[] = [];
    for (const node of list) {
        if (predicate(node)) {
            valid.push(node);
        }
        else {
            invalid.push(node);
        }
    }
    return [valid, invalid];
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
    return value ? value.replace(/[^\w]/g, '_').trim() : '';
}

export function capitalize(value: string, upper = true) {
    return value ? value.charAt(0)[(upper ? 'toUpperCase' : 'toLowerCase')]() + value.substring(1)[(upper ? 'toLowerCase' : 'toString')]() : '';
}

export function convertInt(value: any) {
    return (value && parseInt(value)) || 0;
}

export function convertFloat(value: any) {
    return (value && parseFloat(value)) || 0;
}

export function convertPX(value: any, fontSize: string) {
    if (hasValue(value)) {
        if (isNumber(value)) {
            return `${Math.round(value)}px`;
        }
        let result = parseFloat(value);
        if (!isNaN(result)) {
            const match = value.match(/(pt|em)/);
            if (match) {
                switch (match[0]) {
                    case 'pt':
                        result *= (4 / 3);
                        break;
                    case 'em':
                        result *= convertInt(fontSize) || 16;
                        break;
                }
            }
            return `${result}px`;
        }
    }
    return '0px';
}

export function replaceWhiteSpace(value: string) {
    value = value.replace(/\u00A0/g, '&#160;');
    value = value.replace(/\u2002/g, '&#8194;');
    value = value.replace(/\u2003/g, '&#8195;');
    value = value.replace(/\u2009/g, '&#8201;');
    value = value.replace(/\u200C/g, '&#8204;');
    value = value.replace(/\u200D/g, '&#8205;');
    value = value.replace(/\u200E/g, '&#8206;');
    value = value.replace(/\u200F/g, '&#8207;');
    return value;
}

export function formatPX(value: any) {
    value = parseFloat(value);
    return `${!isNaN(value) ? Math.round(value) : 0}px`;
}

export function convertAlpha(value: number) {
    let result = '';
    while (value >= ALPHABET.length) {
        const base = Math.floor(value / ALPHABET.length);
        if (base > 1 && base <= ALPHABET.length) {
            result += ALPHABET.charAt(base - 1);
            value -= base * ALPHABET.length;
        }
        else if (base > ALPHABET.length) {
            result += convertAlpha(base * ALPHABET.length);
            value -= base * ALPHABET.length;
        }
        const index = value % ALPHABET.length;
        result += ALPHABET.charAt(index);
        value -= index + ALPHABET.length;
    }
    result = ALPHABET.charAt(value) + result;
    return result;
}

export function convertRoman(value: number) {
    const digits = value.toString().split('');
    let result = '';
    let i = 3;
    while (i--) {
        result = (NUMERALS[parseInt(digits.pop() || '') + (i * 10)] || '') + result;
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
    return (value & type) === type;
}

export function isNumber(value: string | number): value is number {
    return /^-?[0-9]+(\.[0-9]+)?$/.test(value.toString().trim());
}

export function isString(value: any): value is string {
    return typeof value === 'string' && value !== '';
}

export function isUnit(value: string) {
    return isString(value) ? /^-?[0-9\.]+(px|pt|em)$/.test(value.trim()) : false;
}

export function isPercent(value: string) {
    return /^[0-9]+(\.[0-9]+)?%$/.test(value);
}

export function includes(source: Null<string>, value: string, delimiter = ',') {
    return source ? source
                        .split(delimiter)
                        .map(segment => segment.trim())
                        .includes(value)
                  : false;
}

export function optional(obj: Null<{}>, value: string, type?: string) {
    let valid = false;
    let result: any = null;
    if (typeof obj === 'object') {
        result = obj;
        const attrs = value.split('.');
        let i = 0;
        do {
            result = result[attrs[i]] != null ? result[attrs[i]] : null;
        }
        while (result != null && ++i < attrs.length && typeof result !== 'string' && typeof result !== 'number' && typeof result !== 'boolean');
        valid = result != null && i === attrs.length;
    }
    switch (type) {
        case 'object':
            return valid ? result : null;
        case 'number':
            return valid && !isNaN(parseInt(result)) ? parseInt(result) : 0;
        case 'boolean':
            return valid && result === true;
        default:
            return valid ? result.toString() : '';
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
                value
                    .split('/')
                    .forEach(dir => {
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

export function trimString(value: string, char: string) {
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
    for (const term of terms) {
        const index = value.indexOf(term);
        if (index !== -1) {
            return index;
        }
    }
    return -1;
}

export function lastIndexOf(value: string, char = '/') {
    return value.substring(value.lastIndexOf(char) + 1);
}

export function sameValue(obj1: {}, obj2: {}, ...attrs: string[]) {
    for (const attr of attrs) {
        const result = compareObject(obj1, obj2, attr);
        if (!result || result[0] !== result[1]) {
            return false;
        }
    }
    return true;
}

export function searchObject(obj: ObjectMap<string>, value: string | StringMap) {
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

export function compareObject(obj1: {}, obj2: {}, attr: string) {
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
    return typeof value !== 'undefined' && value !== null && value.toString().trim() !== '';
}

export function withinRange(a: number, b: number, n = 0) {
    return b >= (a - n) && b <= (a + n);
}

export function withinFraction(lower: number, upper: number) {
    return lower === upper || Math.floor(lower) === Math.floor(upper) || Math.ceil(lower) === Math.ceil(upper) || Math.ceil(lower) === Math.floor(upper) || Math.floor(lower) === Math.ceil(upper);
}

export function sortAsc<T>(list: T[], ...attrs: string[]) {
    return sort<T>(list, 0, ...attrs);
}

export function sortDesc<T>(list: T[], ...attrs: string[]) {
    return sort<T>(list, 1, ...attrs);
}