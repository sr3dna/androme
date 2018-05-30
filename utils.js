const Utils = (function() {
    const ID = {
        android: ['parent']
    };

    const Utils = class {
        static generateId(section, name) {
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
            while (true)
            return name;
        }
        static formatString(value, ...params) {
            for (let i = 0; i < params.length; i++) {
                value = value.replace(`{${i}}`, params[i]);
            }
            return value;
        }
        static cameltoLowerCase(value) {
            value = value.charAt(0).toLowerCase() + value.substring(1);
            const result = value.match(/([a-z]{1}[A-Z]{1})/g);
            if (result != null) {
                for (const match of result) {
                    value = value.replace(match, `${match[0]}_${match[1].toLowerCase()}`);
                }
            }
            return value;
        }
        static hyphenToCamelCase(value) {
            value = value.replace(/$-+/, '');
            const result = value.match(/(-{1}[a-z]{1})/g);
            if (result != null) {
                for (const match of result) {
                    value = value.replace(match, match[1].toUpperCase());
                }
            }
            return value;
        }
        static padLeft(n, value = '\t') {
            return value.repeat(n);
        }
        static convertToPX(value, unit = true) {
            if (Utils.hasValue(value)) {
                if (typeof value == 'number') {
                    value += 'px';
                }
                const match = value.match(/(pt|em)/);
                value = parseFloat(value);
                if (match != null) {
                    switch (match[0]) {
                        case 'pt':
                            value *= (4 / 3);
                            break
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
        static convertToDP(value, unit = true, font = false) {
            if (Utils.hasValue(value)) {
                value = Utils.convertToPX(value, false);
                value = value / (SETTINGS.density / 160);
                value = parseFloat(value.toFixed(2));
                if (!isNaN(value)) {
                    return value + (unit ? (font ? 'sp' : 'dp') : 0);
                }
            }
            return (unit ? '0dp' : 0);
        }
        static convertToSP(value, unit = true) {
            return Utils.convertToDP(value, unit, true);
        }
        static insetToDP(xml, font = false) {
            return xml.replace(/("|>)([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + Utils.convertToDP(capture[1], true, font) + capture[2]);
        }
        static parseInt(value) {
            return parseInt(value) || 0;
        }
        static search(obj, value) {
            const result = [];
            if (typeof value == 'object') {
                for (const term in value) {
                    const i = value[term];
                    if (Utils.hasValue(obj[i])) {
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
        static indexOf(value, ...terms) {
            for (const term of terms) {
                const index = value.indexOf(term);
                if (index != -1) {
                    return index;
                }
            }
            return -1;
        }
        static sort(list, asc = 0, ...attributes) {
            return list.sort((a, b) => {
                for (const attr of attributes) {
                    const result = Utils.compare(a, b, attr);
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
        static sortAsc(list, ...attributes) {
            return Utils.sort(list, 0, ...attributes);
        }
        static sortDesc(list, ...attributes) {
            return Utils.sort(list, 1, ...attributes);
        }
        static same(obj1, obj2, ...attributes) {
            for (const attr of attributes) {
                const result = Utils.compare(obj1, obj2, attr);
                if (!result || result[0] !== result[1]) {
                    return false;
                }
            }
            return true;
        }
        static compare(obj1, obj2, attr) {
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
                return [Utils.parseInt(current1), Utils.parseInt(current2)];
            }
            else {
                return [current1, current2];
            }
        }
        static parseUnit(value) {
            if (Utils.hasValue(value)) {
                const match = value.match(/(?:"|>)([0-9]+)(?:(px|pt|em|dp|sp))(?:"|<)/);
                if (match != null) {
                    return parseFloat(match[1]);
                }
            }
            return 0;
        }
        static calculateBias(start, end) {
            return parseFloat(start == 0 ? 0 : (end == 0 ? 1 : (start / (start + end)).toFixed(2)));
        }
        static hasValue(value) {
            return (typeof value !== 'undefined' && value !== null && value !== '');
        }
        static withinRange(a, b, n = 1) {
            return (b >= (a - n) && b <= (a + n));
        }
        static withinFraction(left, right) {
            return (left == right || Math.ceil(left) == Math.floor(right));
        }
        static isNumber(value) {
            return /^[0-9.]+$/.test(value.trim());
        }
        static hasFreeFormText(element) {
            return Array.from(element.childNodes).some(item => (item.nodeName == '#text' && item.textContent.trim() != ''));
        }
        static isVisible(element) {
            if (typeof element.getBoundingClientRect == 'function') {
                const bounds = element.getBoundingClientRect();
                if (bounds.width != 0 && bounds.height != 0) {
                    return true;
                }
                else if (element.children.length > 0) {
                    return Array.from(element.children).some(item => {
                        const style = getComputedStyle(item);
                        return !(style.position == '' || style.position == 'static');
                    });
                }
            }
            return false;
        }
    };

    return Utils;
}());