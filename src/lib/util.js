const ID = {
    android: ['parent']
};

function sort(list, asc = 0, ...attributes) {
    return list.sort((a, b) => {
        for (const attr of attributes) {
            const result = compare(a, b, attr);
            if (result && result[0] !== result[1]) {
                if (asc == 0) {
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

export function generateId(section, name) {
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

export function formatString(value, ...params) {
    for (let i = 0; i < params.length; i++) {
        value = value.replace(`{${i}}`, params[i]);
    }
    return value;
}

export function cameltoLowerCase(value) {
    value = value.charAt(0).toLowerCase() + value.substring(1);
    const result = value.match(/([a-z]{1}[A-Z]{1})/g);
    if (result != null) {
        for (const match of result) {
            value = value.replace(match, `${match[0]}_${match[1].toLowerCase()}`);
        }
    }
    return value;
}

export function hyphenToCamelCase(value) {
    value = value.replace(/$-+/, '');
    const result = value.match(/(-{1}[a-z]{1})/g);
    if (result != null) {
        for (const match of result) {
            value = value.replace(match, match[1].toUpperCase());
        }
    }
    return value;
}

export function padLeft(n, value = '\t') {
    return value.repeat(n);
}

export function formatPX(value) {
    value = parseFloat(value);
    return `${(!isNaN(value) ? Math.ceil(value) : 0)}px`;
}

export function convertPX(value, unit = true) {
    if (hasValue(value)) {
        if (typeof value == 'number') {
            value += 'px';
        }
        const match = value.match(/(pt|em)/);
        value = parseFloat(value);
        if (match != null) {
            switch (match[0]) {
                case 'pt':
                    value *= (4 / 3);
                    break;
                case 'em':
                    value * 16;
                    break;
            }
        }
        if (!isNaN(value)) {
            return (unit ? `${value}px` : value);
        }
    }
    return (unit ? '0px' : 0);
}

export function convertDP(value, dpi = 160, unit = true, font = false) {
    if (hasValue(value)) {
        value = convertPX(value, false);
        value = value / (dpi / 160);
        value = parseFloat(value.toFixed(2));
        if (!isNaN(value)) {
            return value + (unit ? (font ? 'sp' : 'dp') : 0);
        }
    }
    return (unit ? '0dp' : 0);
}

export function convertSP(value, dpi = 160, unit = true) {
    return convertDP(value, dpi, unit, true);
}

export function replaceDP(xml, dpi = 160, font = false) {
    return xml.replace(/("|>)([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + convertDP(capture[1], dpi, true, font) + capture[2]);
}

export function convertInt(value) {
    return parseInt(value) || 0;
}

export function isNumber(value) {
    return /^[0-9]+\.?[0-9]*$/.test(value.trim());
}

export function search(obj, value) {
    const result = [];
    if (typeof value == 'object') {
        for (const term in value) {
            const i = value[term];
            if (hasValue(obj[i])) {
                result.push([i, obj[i]]);
            }
        }
    }
    else {
        let filter = null;
        if (/^\*.+\*$/.test(value)) {
            filter = attr => attr.indexOf(value.replace(/\*/g, '')) != -1;
        }
        else if (/^\*/.test(value)) {
            filter = attr => attr.endsWith(value.replace(/\*/, ''));
        }
        else if (/\*$/.test(value)) {
            filter = attr => attr.startsWith(value.replace(/\*/, ''));
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

export function indexOf(value, ...terms) {
    if (hasValue(value)) {
        for (const term of terms) {
            const index = value.indexOf(term);
            if (index != -1) {
                return index;
            }
        }
    }
    return -1;
}

export function sortAsc(list, ...attributes) {
    return sort(list, 0, ...attributes);
}

export function sortDesc(list, ...attributes) {
    return sort(list, 1, ...attributes);
}

export function same(obj1, obj2, ...attributes) {
    for (const attr of attributes) {
        const result = compare(obj1, obj2, attr);
        if (!result || result[0] !== result[1]) {
            return false;
        }
    }
    return true;
}

export function compare(obj1, obj2, attr) {
    const namespaces = attr.split('.');
    let current1 = obj1;
    let current2 = obj2;
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

export function parseUnit(value) {
    if (hasValue(value)) {
        const match = value.match(/(?:"|>)([0-9]+)(?:(px|pt|em|dp|sp))(?:"|<)/);
        if (match != null) {
            return parseFloat(match[1]);
        }
    }
    return 0;
}

export function calculateBias(start, end) {
    return Math.max(parseFloat(start == 0 ? 0 : (end == 0 ? 1 : (start / (start + end)).toFixed(2))), 0);
}

export function hasValue(value) {
    return (typeof value !== 'undefined' && value !== null && value !== '');
}

export function withinRange(a, b, n = 1) {
    return (b >= (a - n) && b <= (a + n));
}

export function withinFraction(lower, upper) {
    return (lower == upper || Math.ceil(lower) == Math.floor(upper));
}