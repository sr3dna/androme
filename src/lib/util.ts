const ID = {
    android: ['parent']
};

function sort<T>(list: T[], asc = 0, ...attributes: string[]) {
    return list.sort((a: T, b: T) => {
        for (const attr of attributes) {
            const result = compare(a, b, attr);
            if (result && result[0] !== result[1]) {
                if (asc === 0) {
                    return (result[0] >= result[1] ? 1 : -1);
                }
                else {
                    return (result[0] <= result[1] ? 1 : -1);
                }
            }
        }
        return 0;
    });
}

export function generateId(section: string, name: string) {
    let prefix = name;
    let i = 1;
    const match = name.match(/^([a-zA-Z0-9_]+)_([0-9]+)$/);
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

export function formatString(value: string, ...params: string[]) {
    for (let i = 0; i < params.length; i++) {
        value = value.replace(`{${i}}`, params[i]);
    }
    return value;
}

export function cameltoLowerCase(value: string) {
    value = value.charAt(0).toLowerCase() + value.substring(1);
    const result = value.match(/([a-z]{1}[A-Z]{1})/g);
    if (result != null) {
        for (const match of result) {
            value = value.replace(match, `${match[0]}_${match[1].toLowerCase()}`);
        }
    }
    return value;
}

export function hyphenToCamelCase(value: string) {
    value = value.replace(/$-+/, '');
    const result = value.match(/(-{1}[a-z]{1})/g);
    if (result != null) {
        for (const match of result) {
            value = value.replace(match, match[1].toUpperCase());
        }
    }
    return value;
}

export function padLeft(n: number, value = '\t') {
    return value.repeat(n);
}

export function formatPX(value: any) {
    value = parseFloat(value);
    return `${(!isNaN(value) ? Math.ceil(value) : 0)}px`;
}

export function convertPX(value: any) {
    if (hasValue(value)) {
        if (isNumber(value)) {
            value = `${value}px`;
        }
        const match = value.match(/(pt|em)/);
        value = parseFloat(value);
        if (match != null) {
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

export function convertDP(value: any, dpi = 160, font = false) {
    if (hasValue(value)) {
        value = parseFloat(convertPX(value));
        if (!isNaN(value)) {
            value = parseFloat((value / (dpi / 160)).toFixed(2));
            return value + (font ? 'sp' : 'dp');
        }
    }
    return '0dp';
}

export function replaceDP(xml: string, dpi = 160, font = false) {
    return xml.replace(/("|>)([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + convertDP(capture[1], dpi, font) + capture[2]);
}

export function convertInt(value: any) {
    return parseInt(value) || 0;
}

export function averageInt(values: number[]) {
    return Math.floor(values.reduce((a, b) => a + b) / values.length);
}

export function isNumber(value: string) {
    return /^[0-9]+\.?[0-9]*$/.test(value.toString().trim());
}

export function isPercent(value: string) {
    return /^[0-9]+%$/.test(value);
}

export function trim(value: string, character: string) {
    return value.replace(new RegExp(`^${character}+`, 'g'), '').replace(new RegExp(`${character}+$`, 'g'), '');
}

export function getFileName(value: string) {
    return value.substring(value.lastIndexOf('/') + 1);
}

export function getFileExt(value: string) {
    return value.substring(value.lastIndexOf('.') + 1);
}

export function search(obj: {}, value: string | object) {
    const result: any[][] = [];
    if (typeof value === 'object') {
        for (const term in value) {
            const i = value[term];
            if (hasValue(obj[i])) {
                result.push([i, obj[i]]);
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
        if (filter != null) {
            for (const i in obj) {
                if (filter(i)) {
                    result.push([i, obj[i]]);
                }
            }
        }
    }
    return result;
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

export function same(obj1: {}, obj2: {}, ...attributes: string[]) {
    for (const attr of attributes) {
        const result = compare(obj1, obj2, attr);
        if (!result || result[0] !== result[1]) {
            return false;
        }
    }
    return true;
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

export function parseUnit(value: string) {
    if (hasValue(value)) {
        const match = value.match(/(?:"|>)([0-9]+)(?:(px|pt|em|dp|sp))(?:"|<)/);
        if (match != null) {
            return parseFloat(match[1]);
        }
    }
    return 0;
}

export function calculateBias(start: number, end: number) {
    return parseFloat(Math.max(start === 0 ? 0 : (end === 0 ? 1 : (start / (start + end))), 0).toFixed(2));
}

export function hasValue<T>(value: T) {
    return (typeof value !== 'undefined' && value !== null && value.toString() !== '');
}

export function withinRange(a: number, b: number, n = 1) {
    return (b >= (a - n) && b <= (a + n));
}

export function withinFraction(lower: number, upper: number) {
    return (lower === upper || Math.ceil(lower) === Math.floor(upper));
}

export function remove<T>(list: T[], value: any) {
    const index = list.indexOf(value);
    if (index !== -1) {
        list.splice(index, 1);
    }
    return list;
}

export function caseInsensitve(a: any, b: any) {
    return (a.toString().toLowerCase() >= b.toString().toLowerCase() ? 1 : -1);
}

export function sortAsc<T>(list: T[], ...attributes: string[]) {
    return sort<T>(list, 0, ...attributes);
}

export function sortDesc<T>(list: T[], ...attributes: string[]) {
    return sort<T>(list, 1, ...attributes);
}