/* androme 1.7.15
   https://github.com/anpham6/androme */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.androme = {})));
}(this, (function (exports) { 'use strict';

    let ID;
    resetId();
    function sort(list, asc = 0, ...attributes) {
        return list.sort((a, b) => {
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
    function resetId() {
        ID = {
            android: ['parent']
        };
    }
    function generateId(section, name) {
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
        } while (true);
        return name;
    }
    function formatString(value, ...params) {
        for (let i = 0; i < params.length; i++) {
            value = value.replace(`{${i}}`, params[i]);
        }
        return value;
    }
    function cameltoLowerCase(value) {
        value = value.charAt(0).toLowerCase() + value.substring(1);
        const result = value.match(/([a-z]{1}[A-Z]{1})/g);
        if (result != null) {
            for (const match of result) {
                value = value.replace(match, `${match[0]}_${match[1].toLowerCase()}`);
            }
        }
        return value;
    }
    function hyphenToCamelCase(value) {
        value = value.replace(/$-+/, '');
        const result = value.match(/(-{1}[a-z]{1})/g);
        if (result != null) {
            for (const match of result) {
                value = value.replace(match, match[1].toUpperCase());
            }
        }
        return value;
    }
    function convertAlpha(value) {
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
    function convertRoman(value) {
        let result = '';
        const digits = value.toString().split('');
        const numerals = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM',
            '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC',
            '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
        let i = 3;
        while (i--) {
            result = (numerals[parseInt(digits.pop()) + (i * 10)] || '') + result;
        }
        return 'M'.repeat(parseInt(digits.join(''))) + result;
    }
    function padLeft(n, value = '\t') {
        return value.repeat(n);
    }
    function formatPX(value) {
        value = parseFloat(value);
        return `${(!isNaN(value) ? Math.ceil(value) : 0)}px`;
    }
    function convertPX(value) {
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
    function convertDP(value, dpi = 160, font = false) {
        if (hasValue(value)) {
            value = parseFloat(convertPX(value));
            if (!isNaN(value)) {
                value = parseFloat((value / (dpi / 160)).toFixed(2));
                return value + (font ? 'sp' : 'dp');
            }
        }
        return '0dp';
    }
    function replaceDP(xml, dpi = 160, font = false) {
        return xml.replace(/("|>)([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + convertDP(capture[1], dpi, font) + capture[2]);
    }
    function convertInt(value) {
        return parseInt(value) || 0;
    }
    function averageInt(values) {
        return Math.floor(values.reduce((a, b) => a + b) / values.length);
    }
    function isNumber(value) {
        return /^[0-9]+\.?[0-9]*$/.test(value.toString().trim());
    }
    function isPercent(value) {
        return /^[0-9]+%$/.test(value);
    }
    function trim(value, character) {
        return value.replace(new RegExp(`^${character}+`, 'g'), '').replace(new RegExp(`${character}+$`, 'g'), '');
    }
    function getFileName(value) {
        return value.substring(value.lastIndexOf('/') + 1);
    }
    function getFileExt(value) {
        return value.substring(value.lastIndexOf('.') + 1);
    }
    function resolveRelativePath(value) {
        if (!/^\w+:\/\//.test(value)) {
            let pathname = location.pathname.split('/');
            pathname.pop();
            if (value.charAt(0) === '/') {
                value = location.origin + value;
            }
            else {
                if (value.startsWith('../')) {
                    const parts = [];
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
    function search(obj, value) {
        const result = [];
        if (typeof value === 'object') {
            for (const term in value) {
                const i = value[term];
                if (hasValue(obj[i])) {
                    result.push([i, obj[i]]);
                }
            }
        }
        else {
            let filter = (a) => (a === value);
            if (/^\*.+\*$/.test(value)) {
                filter = (a) => (a.indexOf(value.replace(/\*/g, '')) !== -1);
            }
            else if (/^\*/.test(value)) {
                filter = (a) => (a.endsWith(value.replace(/\*/, '')));
            }
            else if (/\*$/.test(value)) {
                filter = (a) => (a.startsWith(value.replace(/\*/, '')));
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
    function indexOf(value, ...terms) {
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
    function same(obj1, obj2, ...attributes) {
        for (const attr of attributes) {
            const result = compare(obj1, obj2, attr);
            if (!result || result[0] !== result[1]) {
                return false;
            }
        }
        return true;
    }
    function compare(obj1, obj2, attr) {
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
    function parseUnit(value) {
        if (hasValue(value)) {
            const match = value.match(/(?:"|>)([0-9]+)(?:(px|pt|em|dp|sp))(?:"|<)/);
            if (match != null) {
                return parseFloat(match[1]);
            }
        }
        return 0;
    }
    function calculateBias(start, end) {
        return parseFloat(Math.max(start === 0 ? 0 : (end === 0 ? 1 : (start / (start + end))), 0).toFixed(2));
    }
    function hasValue(value) {
        return (typeof value !== 'undefined' && value !== null && value.toString() !== '');
    }
    function withinRange(a, b, n = 1) {
        return (b >= (a - n) && b <= (a + n));
    }
    function withinFraction(lower, upper) {
        return (lower === upper || Math.ceil(lower) === Math.floor(upper));
    }
    function caseInsensitve(a, b) {
        return (a.toString().toLowerCase() >= b.toString().toLowerCase() ? 1 : -1);
    }
    function sortAsc(list, ...attributes) {
        return sort(list, 0, ...attributes);
    }
    function sortDesc(list, ...attributes) {
        return sort(list, 1, ...attributes);
    }

    class NodeList {
        constructor(nodes, parent) {
            this.parent = parent;
            this._list = [];
            if (Array.isArray(nodes)) {
                this._list = nodes;
            }
            this.parent = parent;
        }
        static intersect(list, dimension = 'linear') {
            list.forEach(node => {
                if (list.some(item => (item !== node && node.intersect(item[dimension])))) {
                    return true;
                }
            });
            return false;
        }
        static linearX(list) {
            if (list.length > 0 && !NodeList.intersect(list)) {
                if (list.length > 1) {
                    const minBottom = Math.min.apply(null, list.map(node => node.linear.bottom));
                    return !list.some(node => node.linear.top >= minBottom);
                }
                return true;
            }
            return false;
        }
        static linearY(list) {
            if (list.length > 0 && !NodeList.intersect(list)) {
                if (list.length > 1) {
                    const minRight = Math.min.apply(null, list.map(node => node.linear.right));
                    return !list.some(node => node.linear.left >= minRight);
                }
                return true;
            }
            return false;
        }
        find(id) {
            return this._list.find(node => node.id === id) || null;
        }
        reset() {
            NodeList.currentId = 0;
            this.clear();
        }
        clear() {
            this._list = [];
        }
        sortAsc(...attr) {
            return sortAsc(this._list, ...attr);
        }
        sortDesc(...attr) {
            return sortDesc(this._list, ...attr);
        }
        intersect(dimension = 'linear') {
            return NodeList.intersect(this._list, dimension);
        }
        get length() {
            return this._list.length;
        }
        get list() {
            return this._list;
        }
        get visible() {
            return this._list.filter(node => node.visible);
        }
        get elements() {
            return this._list.filter(node => node.hasElement);
        }
        get first() {
            return this._list[0];
        }
        get last() {
            return this._list[this._list.length - 1];
        }
        get nextId() {
            return ++NodeList.currentId;
        }
        get linearX() {
            return NodeList.linearX(this._list);
        }
        get linearY() {
            return NodeList.linearY(this._list);
        }
    }
    NodeList.currentId = 0;

    var VIEW_STANDARD;
    (function (VIEW_STANDARD) {
        VIEW_STANDARD[VIEW_STANDARD["FRAME"] = 1] = "FRAME";
        VIEW_STANDARD[VIEW_STANDARD["LINEAR"] = 2] = "LINEAR";
        VIEW_STANDARD[VIEW_STANDARD["CONSTRAINT"] = 3] = "CONSTRAINT";
        VIEW_STANDARD[VIEW_STANDARD["GUIDELINE"] = 4] = "GUIDELINE";
        VIEW_STANDARD[VIEW_STANDARD["RELATIVE"] = 5] = "RELATIVE";
        VIEW_STANDARD[VIEW_STANDARD["GRID"] = 6] = "GRID";
        VIEW_STANDARD[VIEW_STANDARD["SCROLL_VERTICAL"] = 7] = "SCROLL_VERTICAL";
        VIEW_STANDARD[VIEW_STANDARD["SCROLL_HORIZONTAL"] = 8] = "SCROLL_HORIZONTAL";
        VIEW_STANDARD[VIEW_STANDARD["SCROLL_NESTED"] = 9] = "SCROLL_NESTED";
        VIEW_STANDARD[VIEW_STANDARD["RADIO_GROUP"] = 10] = "RADIO_GROUP";
        VIEW_STANDARD[VIEW_STANDARD["TEXT"] = 11] = "TEXT";
        VIEW_STANDARD[VIEW_STANDARD["EDIT"] = 12] = "EDIT";
        VIEW_STANDARD[VIEW_STANDARD["IMAGE"] = 13] = "IMAGE";
        VIEW_STANDARD[VIEW_STANDARD["SELECT"] = 14] = "SELECT";
        VIEW_STANDARD[VIEW_STANDARD["RANGE"] = 15] = "RANGE";
        VIEW_STANDARD[VIEW_STANDARD["CHECKBOX"] = 16] = "CHECKBOX";
        VIEW_STANDARD[VIEW_STANDARD["RADIO"] = 17] = "RADIO";
        VIEW_STANDARD[VIEW_STANDARD["BUTTON"] = 18] = "BUTTON";
        VIEW_STANDARD[VIEW_STANDARD["VIEW"] = 19] = "VIEW";
        VIEW_STANDARD[VIEW_STANDARD["SPACE"] = 20] = "SPACE";
    })(VIEW_STANDARD || (VIEW_STANDARD = {}));
    var VIEW_RESOURCE;
    (function (VIEW_RESOURCE) {
        VIEW_RESOURCE[VIEW_RESOURCE["BOX_STYLE"] = 2] = "BOX_STYLE";
        VIEW_RESOURCE[VIEW_RESOURCE["BOX_SPACING"] = 4] = "BOX_SPACING";
        VIEW_RESOURCE[VIEW_RESOURCE["FONT_STYLE"] = 8] = "FONT_STYLE";
        VIEW_RESOURCE[VIEW_RESOURCE["VALUE_STRING"] = 16] = "VALUE_STRING";
        VIEW_RESOURCE[VIEW_RESOURCE["OPTION_ARRAY"] = 32] = "OPTION_ARRAY";
        VIEW_RESOURCE[VIEW_RESOURCE["IMAGE_SOURCE"] = 64] = "IMAGE_SOURCE";
        VIEW_RESOURCE[VIEW_RESOURCE["ALL"] = 126] = "ALL";
    })(VIEW_RESOURCE || (VIEW_RESOURCE = {}));
    var BOX_STANDARD;
    (function (BOX_STANDARD) {
        BOX_STANDARD[BOX_STANDARD["MARGIN_TOP"] = 2] = "MARGIN_TOP";
        BOX_STANDARD[BOX_STANDARD["MARGIN_RIGHT"] = 4] = "MARGIN_RIGHT";
        BOX_STANDARD[BOX_STANDARD["MARGIN_BOTTOM"] = 8] = "MARGIN_BOTTOM";
        BOX_STANDARD[BOX_STANDARD["MARGIN_LEFT"] = 16] = "MARGIN_LEFT";
        BOX_STANDARD[BOX_STANDARD["PADDING_TOP"] = 32] = "PADDING_TOP";
        BOX_STANDARD[BOX_STANDARD["PADDING_RIGHT"] = 64] = "PADDING_RIGHT";
        BOX_STANDARD[BOX_STANDARD["PADDING_BOTTOM"] = 128] = "PADDING_BOTTOM";
        BOX_STANDARD[BOX_STANDARD["PADDING_LEFT"] = 256] = "PADDING_LEFT";
    })(BOX_STANDARD || (BOX_STANDARD = {}));
    const MAPPING_CHROME = {
        'PLAINTEXT': VIEW_STANDARD.TEXT,
        'HR': VIEW_STANDARD.VIEW,
        'IMG': VIEW_STANDARD.IMAGE,
        'SELECT': VIEW_STANDARD.SELECT,
        'RANGE': VIEW_STANDARD.RANGE,
        'TEXT': VIEW_STANDARD.EDIT,
        'PASSWORD': VIEW_STANDARD.EDIT,
        'NUMBER': VIEW_STANDARD.EDIT,
        'EMAIL': VIEW_STANDARD.EDIT,
        'SEARCH': VIEW_STANDARD.EDIT,
        'URL': VIEW_STANDARD.EDIT,
        'CHECKBOX': VIEW_STANDARD.CHECKBOX,
        'RADIO': VIEW_STANDARD.RADIO,
        'BUTTON': VIEW_STANDARD.BUTTON,
        'SUBMIT': VIEW_STANDARD.BUTTON,
        'RESET': VIEW_STANDARD.BUTTON,
        'TEXTAREA': VIEW_STANDARD.EDIT
    };
    const BLOCK_CHROME = [
        'ADDRESS',
        'ARTICLE',
        'ASIDE',
        'BLOCKQUOTE',
        'CANVAS',
        'DD',
        'DIV',
        'DL',
        'DT',
        'FIELDSET',
        'FIGCAPTION',
        'FIGURE',
        'FOOTER',
        'FORM',
        'H1',
        'H2',
        'H3',
        'H4',
        'H5',
        'H6',
        'HEADER',
        'LI',
        'MAIN',
        'NAV',
        'OL',
        'OUTPUT',
        'P',
        'PRE',
        'SECTION',
        'TABLE',
        'TFOOT',
        'UL',
        'VIDEO'
    ];
    const INLINE_CHROME = [
        'STRONG',
        'B',
        'EM',
        'CITE',
        'DFN',
        'I',
        'BIG',
        'SMALL',
        'FONT',
        'BLOCKQUOTE',
        'TT',
        'A',
        'U',
        'SUP',
        'SUB',
        'STRIKE',
        'H1',
        'H2',
        'H3',
        'H4',
        'H5',
        'H6',
        'DEL',
        'LABEL',
        'PLAINTEXT'
    ];

    const X11_CSS3 = {
        'Pink': { 'hex': '#FFC0CB' },
        'LightPink': { 'hex': '#FFB6C1' },
        'HotPink': { 'hex': '#FF69B4' },
        'DeepPink': { 'hex': '#FF1493' },
        'PaleVioletRed': { 'hex': '#DB7093' },
        'MediumVioletRed': { 'hex': '#C71585' },
        'LightSalmon': { 'hex': '#FFA07A' },
        'Salmon': { 'hex': '#FA8072' },
        'DarkSalmon': { 'hex': '#E9967A' },
        'LightCoral': { 'hex': '#F08080' },
        'IndianRed': { 'hex': '#CD5C5C' },
        'Crimson': { 'hex': '#DC143C' },
        'Firebrick': { 'hex': '#B22222' },
        'DarkRed': { 'hex': '#8B0000' },
        'Red': { 'hex': '#FF0000' },
        'OrangeRed': { 'hex': '#FF4500' },
        'Tomato': { 'hex': '#FF6347' },
        'Coral': { 'hex': '#FF7F50' },
        'Orange': { 'hex': '#FFA500' },
        'DarkOrange': { 'hex': '#FF8C00' },
        'Yellow': { 'hex': '#FFFF00' },
        'LightYellow': { 'hex': '#FFFFE0' },
        'LemonChiffon': { 'hex': '#FFFACD' },
        'LightGoldenrodYellow': { 'hex': '#FAFAD2' },
        'PapayaWhip': { 'hex': '#FFEFD5' },
        'Moccasin': { 'hex': '#FFE4B5' },
        'PeachPuff': { 'hex': '#FFDAB9' },
        'PaleGoldenrod': { 'hex': '#EEE8AA' },
        'Khaki': { 'hex': '#F0E68C' },
        'DarkKhaki': { 'hex': '#BDB76B' },
        'Gold': { 'hex': '#FFD700' },
        'Cornsilk': { 'hex': '#FFF8DC' },
        'BlanchedAlmond': { 'hex': '#FFEBCD' },
        'Bisque': { 'hex': '#FFE4C4' },
        'NavajoWhite': { 'hex': '#FFDEAD' },
        'Wheat': { 'hex': '#F5DEB3' },
        'Burlywood': { 'hex': '#DEB887' },
        'Tan': { 'hex': '#D2B48C' },
        'RosyBrown': { 'hex': '#BC8F8F' },
        'SandyBrown': { 'hex': '#F4A460' },
        'Goldenrod': { 'hex': '#DAA520' },
        'DarkGoldenrod': { 'hex': '#B8860B' },
        'Peru': { 'hex': '#CD853F' },
        'Chocolate': { 'hex': '#D2691E' },
        'SaddleBrown': { 'hex': '#8B4513' },
        'Sienna': { 'hex': '#A0522D' },
        'Brown': { 'hex': '#A52A2A' },
        'Maroon': { 'hex': '#800000' },
        'DarkOliveGreen': { 'hex': '#556B2F' },
        'Olive': { 'hex': '#808000' },
        'OliveDrab': { 'hex': '#6B8E23' },
        'YellowGreen': { 'hex': '#9ACD32' },
        'LimeGreen': { 'hex': '#32CD32' },
        'Lime': { 'hex': '#00FF00' },
        'LawnGreen': { 'hex': '#7CFC00' },
        'Chartreuse': { 'hex': '#7FFF00' },
        'GreenYellow': { 'hex': '#ADFF2F' },
        'SpringGreen': { 'hex': '#00FF7F' },
        'MediumSpringGreen': { 'hex': '#00FA9A' },
        'LightGreen': { 'hex': '#90EE90' },
        'PaleGreen': { 'hex': '#98FB98' },
        'DarkSeaGreen': { 'hex': '#8FBC8F' },
        'MediumAquamarine': { 'hex': '#66CDAA' },
        'MediumSeaGreen': { 'hex': '#3CB371' },
        'SeaGreen': { 'hex': '#2E8B57' },
        'ForestGreen': { 'hex': '#228B22' },
        'Green': { 'hex': '#008000' },
        'DarkGreen': { 'hex': '#006400' },
        'Aqua': { 'hex': '#00FFFF' },
        'Cyan': { 'hex': '#00FFFF' },
        'LightCyan': { 'hex': '#E0FFFF' },
        'PaleTurquoise': { 'hex': '#AFEEEE' },
        'Aquamarine': { 'hex': '#7FFFD4' },
        'Turquoise': { 'hex': '#40E0D0' },
        'DarkTurquoise': { 'hex': '#00CED1' },
        'MediumTurquoise': { 'hex': '#48D1CC' },
        'LightSeaGreen': { 'hex': '#20B2AA' },
        'CadetBlue': { 'hex': '#5F9EA0' },
        'DarkCyan': { 'hex': '#008B8B' },
        'Teal': { 'hex': '#008080' },
        'LightSteelBlue': { 'hex': '#B0C4DE' },
        'PowderBlue': { 'hex': '#B0E0E6' },
        'LightBlue': { 'hex': '#ADD8E6' },
        'SkyBlue': { 'hex': '#87CEEB' },
        'LightSkyBlue': { 'hex': '#87CEFA' },
        'DeepSkyBlue': { 'hex': '#00BFFF' },
        'DodgerBlue': { 'hex': '#1E90FF' },
        'Cornflower': { 'hex': '#6495ED' },
        'SteelBlue': { 'hex': '#4682B4' },
        'RoyalBlue': { 'hex': '#4169E1' },
        'Blue': { 'hex': '#0000FF' },
        'MediumBlue': { 'hex': '#0000CD' },
        'DarkBlue': { 'hex': '#00008B' },
        'Navy': { 'hex': '#000080' },
        'MidnightBlue': { 'hex': '#191970' },
        'Lavender': { 'hex': '#E6E6FA' },
        'Thistle': { 'hex': '#D8BFD8' },
        'Plum': { 'hex': '#DDA0DD' },
        'Violet': { 'hex': '#EE82EE' },
        'Orchid': { 'hex': '#DA70D6' },
        'Fuchsia': { 'hex': '#FF00FF' },
        'Magenta': { 'hex': '#FF00FF' },
        'MediumOrchid': { 'hex': '#BA55D3' },
        'MediumPurple': { 'hex': '#9370DB' },
        'BlueViolet': { 'hex': '#8A2BE2' },
        'DarkViolet': { 'hex': '#9400D3' },
        'DarkOrchid': { 'hex': '#9932CC' },
        'DarkMagenta': { 'hex': '#8B008B' },
        'Purple': { 'hex': '#800080' },
        'RebeccaPurple': { 'hex': '#663399' },
        'Indigo': { 'hex': '#4B0082' },
        'DarkSlateBlue': { 'hex': '#483D8B' },
        'SlateBlue': { 'hex': '#6A5ACD' },
        'MediumSlateBlue': { 'hex': '#7B68EE' },
        'White': { 'hex': '#FFFFFF' },
        'Snow': { 'hex': '#FFFAFA' },
        'Honeydew': { 'hex': '#F0FFF0' },
        'MintCream': { 'hex': '#F5FFFA' },
        'Azure': { 'hex': '#F0FFFF' },
        'AliceBlue': { 'hex': '#F0F8FF' },
        'GhostWhite': { 'hex': '#F8F8FF' },
        'WhiteSmoke': { 'hex': '#F5F5F5' },
        'Seashell': { 'hex': '#FFF5EE' },
        'Beige': { 'hex': '#F5F5DC' },
        'OldLace': { 'hex': '#FDF5E6' },
        'FloralWhite': { 'hex': '#FFFAF0' },
        'Ivory': { 'hex': '#FFFFF0' },
        'AntiqueWhite': { 'hex': '#FAEBD7' },
        'Linen': { 'hex': '#FAF0E6' },
        'LavenderBlush': { 'hex': '#FFF0F5' },
        'MistyRose': { 'hex': '#FFE4E1' },
        'Gainsboro': { 'hex': '#DCDCDC' },
        'LightGray': { 'hex': '#D3D3D3' },
        'Silver': { 'hex': '#C0C0C0' },
        'DarkGray': { 'hex': '#A9A9A9' },
        'Gray': { 'hex': '#808080' },
        'DimGray': { 'hex': '#696969' },
        'LightSlateGray': { 'hex': '#778899' },
        'SlateGray': { 'hex': '#708090' },
        'DarkSlateGray': { 'hex': '#2F4F4F' },
        'Black': { 'hex': '#000000' }
    };
    const HSL_SORTED = [];
    for (const i in X11_CSS3) {
        const x11 = X11_CSS3[i];
        for (const j in x11) {
            x11.rgb = convertHextoRGB(x11[j]);
            x11.hsl = convertRGBtoHSL(x11.rgb.r, x11.rgb.g, x11.rgb.b);
            HSL_SORTED.push({ name: i, rgb: x11.rgb, hex: x11.hex, hsl: x11.hsl });
        }
    }
    HSL_SORTED.sort(sortHSL);
    function convertHextoHSL(value) {
        const rgb = convertHextoRGB(value);
        if (rgb != null) {
            return convertRGBtoHSL(rgb.r, rgb.g, rgb.b);
        }
        return null;
    }
    function convertRGBtoHSL(r, g, b) {
        r = r / 255;
        g = g / 255;
        b = b / 255;
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);
        let h = (max + min) / 2;
        let s = h;
        const l = h;
        if (max === min) {
            h = 0;
            s = 0;
        }
        else {
            const d = max - min;
            s = (l > 0.5 ? d / (2 - max - min) : d / (max + min));
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return { h: (h * 360), s: (s * 100), l: (l * 100) };
    }
    function sortHSL(a, b) {
        let [c, d] = [a.hsl.h, b.hsl.h];
        if (c === d) {
            [c, d] = [a.hsl.s, b.hsl.s];
            if (c === d) {
                [c, d] = [a.hsl.l, b.hsl.l];
            }
        }
        return (c >= d ? 1 : -1);
    }
    function findNearestColor(value) {
        const result = HSL_SORTED.slice();
        let index = result.findIndex((item) => item.hex === value);
        if (index !== -1) {
            return result[index];
        }
        else {
            const hsl = convertHextoHSL(value);
            if (hsl != null) {
                result.push({ name: '', hsl, rgb: { r: -1, g: -1, b: -1 }, hex: '' });
                result.sort(sortHSL);
                index = result.findIndex((item) => item.name === '');
                return result[Math.min(index + 1, result.length - 1)];
            }
            return '';
        }
    }
    function getByColorName(value) {
        for (const color in X11_CSS3) {
            if (color.toLowerCase() === value.toLowerCase()) {
                return X11_CSS3[color];
            }
        }
        return '';
    }
    function convertRGB({ rgb }) {
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
    function parseRGBA(value) {
        if (value != null) {
            const color = getByColorName(value);
            if (color !== '') {
                return [color.hex, convertRGB(color), '1'];
            }
            const match = value.match(/rgb(?:a)?\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})(?:, ([0-9]{1,3}))?\)/);
            if (match && match.length >= 4) {
                return [`#${convertRGBtoHex(match[1])}${convertRGBtoHex(match[2])}${convertRGBtoHex(match[3])}`, match[0], match[4] || '1'];
            }
        }
        return [];
    }
    function convertRGBtoHex(value) {
        const hex = '0123456789ABCDEF';
        let rgb = parseInt(value);
        if (isNaN(rgb)) {
            return '00';
        }
        rgb = Math.max(0, Math.min(rgb, 255));
        return hex.charAt((rgb - (rgb % 16)) / 16) + hex.charAt(rgb % 16);
    }
    function convertHextoRGB(value) {
        value = value.replace('#', '').trim();
        if (value.length === 3) {
            value = value.charAt(0).repeat(2) + value.charAt(1).repeat(2) + value.charAt(2).repeat(2);
        }
        if (value.length === 6) {
            return { r: parseInt(value.substring(0, 2), 16), g: parseInt(value.substring(2, 4), 16), b: parseInt(value.substring(4), 16) };
        }
        return { r: -1, g: -1, b: -1 };
    }

    function getRangeBounds(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const domRect = range.getClientRects();
        const bounds = assignBounds(domRect[domRect.length - 1]);
        if (domRect.length > 1) {
            bounds.x = Math.min.apply(null, Array.from(domRect).map((item) => item.x));
            bounds.left = bounds.x;
            bounds.width = Array.from(domRect).reduce((a, b) => a + b.width, 0);
        }
        return bounds;
    }
    function assignBounds(bounds) {
        return {
            x: bounds.x,
            y: bounds.y,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
            left: bounds.left,
            width: bounds.width,
            height: bounds.height
        };
    }
    function getStyle(element, cache = true) {
        const object = element;
        if (cache) {
            if (object.__style != null) {
                return object.__style;
            }
            else if (object.__node != null && object.__node.style != null) {
                return object.__node.style;
            }
        }
        else if (element.nodeName !== '#text') {
            const style = getComputedStyle(element);
            object.__style = style;
            return style;
        }
        return {};
    }
    function sameAsParent(element, attr) {
        if (element && element.parentElement != null) {
            const style = getStyle(element);
            return (style && style[attr] === getStyle(element.parentElement)[attr]);
        }
        return false;
    }
    function getBoxSpacing(element, complete = false) {
        const result = {};
        const style = getStyle(element);
        const node = element.__node;
        ['padding', 'margin'].forEach(border => {
            ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
                const attr = border + side;
                const value = convertInt((node != null ? node[attr] : style[attr]));
                if (complete || value !== 0) {
                    result[attr] = value;
                }
            });
        });
        return result;
    }
    function hasFreeFormText(element) {
        return Array.from(element.childNodes).some((item) => item.nodeName === '#text' && item.textContent != null && item.textContent.trim() !== '');
    }
    function isVisible(element) {
        switch (element.tagName) {
            case 'BR':
            case 'OPTION':
            case 'AREA':
                return false;
        }
        if (typeof element.getBoundingClientRect === 'function') {
            const bounds = element.getBoundingClientRect();
            if (bounds.width !== 0 && bounds.height !== 0) {
                return true;
            }
            else {
                let current = element.parentElement;
                let valid = true;
                while (current != null) {
                    const style = getStyle(current);
                    if (style.display === 'none') {
                        valid = false;
                        break;
                    }
                    current = current.parentElement;
                }
                if (valid && element.children.length > 0) {
                    return Array.from(element.children).some((item) => {
                        const style = getComputedStyle(item);
                        return (style.position !== 'static' || style.float === 'left' || style.float === 'right');
                    });
                }
            }
        }
        return false;
    }

    (function (BUILD_ANDROID) {
        BUILD_ANDROID[BUILD_ANDROID["P"] = 28] = "P";
        BUILD_ANDROID[BUILD_ANDROID["OREO_1"] = 27] = "OREO_1";
        BUILD_ANDROID[BUILD_ANDROID["OREO"] = 26] = "OREO";
        BUILD_ANDROID[BUILD_ANDROID["NOUGAT_1"] = 25] = "NOUGAT_1";
        BUILD_ANDROID[BUILD_ANDROID["NOUGAT"] = 24] = "NOUGAT";
        BUILD_ANDROID[BUILD_ANDROID["MARSHMALLOW"] = 23] = "MARSHMALLOW";
        BUILD_ANDROID[BUILD_ANDROID["LOLLIPOP_1"] = 22] = "LOLLIPOP_1";
        BUILD_ANDROID[BUILD_ANDROID["LOLLIPOP"] = 21] = "LOLLIPOP";
        BUILD_ANDROID[BUILD_ANDROID["KITKAT_1"] = 20] = "KITKAT_1";
        BUILD_ANDROID[BUILD_ANDROID["KITKAT"] = 19] = "KITKAT";
        BUILD_ANDROID[BUILD_ANDROID["JELLYBEAN_2"] = 18] = "JELLYBEAN_2";
        BUILD_ANDROID[BUILD_ANDROID["JELLYBEAN_1"] = 17] = "JELLYBEAN_1";
        BUILD_ANDROID[BUILD_ANDROID["JELLYBEAN"] = 16] = "JELLYBEAN";
        BUILD_ANDROID[BUILD_ANDROID["ICE_CREAM_SANDWICH_1"] = 15] = "ICE_CREAM_SANDWICH_1";
        BUILD_ANDROID[BUILD_ANDROID["ICE_CREAM_SANDWICH"] = 14] = "ICE_CREAM_SANDWICH";
        BUILD_ANDROID[BUILD_ANDROID["ALL"] = 0] = "ALL";
        BUILD_ANDROID[BUILD_ANDROID["LATEST"] = 28] = "LATEST";
    })(exports.build || (exports.build = {}));
    (function (DENSITY_ANDROID) {
        DENSITY_ANDROID[DENSITY_ANDROID["LDPI"] = 120] = "LDPI";
        DENSITY_ANDROID[DENSITY_ANDROID["MDPI"] = 160] = "MDPI";
        DENSITY_ANDROID[DENSITY_ANDROID["HDPI"] = 240] = "HDPI";
        DENSITY_ANDROID[DENSITY_ANDROID["XHDPI"] = 320] = "XHDPI";
        DENSITY_ANDROID[DENSITY_ANDROID["XXHDPI"] = 480] = "XXHDPI";
        DENSITY_ANDROID[DENSITY_ANDROID["XXXHDPI"] = 640] = "XXXHDPI";
    })(exports.density || (exports.density = {}));
    const VIEW_ANDROID = {
        FRAME: 'FrameLayout',
        LINEAR: 'LinearLayout',
        CONSTRAINT: 'android.support.constraint.ConstraintLayout',
        GUIDELINE: 'android.support.constraint.Guideline',
        RELATIVE: 'RelativeLayout',
        GRID: 'GridLayout',
        SCROLL_VERTICAL: 'ScrollView',
        SCROLL_HORIZONTAL: 'HorizontalScrollView',
        SCROLL_NESTED: 'NestedScrollView',
        RADIO_GROUP: 'RadioGroup',
        TEXT: 'TextView',
        EDIT: 'EditText',
        IMAGE: 'ImageView',
        SELECT: 'Spinner',
        RANGE: 'SeekBar',
        CHECKBOX: 'CheckBox',
        RADIO: 'RadioButton',
        BUTTON: 'Button',
        VIEW: 'View',
        SPACE: 'Space'
    };
    const BOX_ANDROID = {
        MARGIN_TOP: 'layout_marginTop',
        MARGIN_RIGHT: 'layout_marginRight',
        MARGIN_BOTTOM: 'layout_marginBottom',
        MARGIN_LEFT: 'layout_marginLeft',
        PADDING_TOP: 'paddingTop',
        PADDING_RIGHT: 'paddingRight',
        PADDING_BOTTOM: 'paddingBottom',
        PADDING_LEFT: 'paddingLeft'
    };
    const FIXED_ANDROID = [
        VIEW_ANDROID.EDIT,
        VIEW_ANDROID.SELECT,
        VIEW_ANDROID.CHECKBOX,
        VIEW_ANDROID.RADIO,
        VIEW_ANDROID.BUTTON
    ];
    const XMLNS_ANDROID = {
        'ANDROID': 'xmlns:android="http://schemas.android.com/apk/res/android"',
        'APP': 'xmlns:app="http://schemas.android.com/apk/res-auto"'
    };
    const FONT_ANDROID = {
        'sans-serif': exports.build.ICE_CREAM_SANDWICH,
        'sans-serif-thin': exports.build.JELLYBEAN,
        'sans-serif-light': exports.build.JELLYBEAN,
        'sans-serif-condensed': exports.build.JELLYBEAN,
        'sans-serif-condensed-light': exports.build.JELLYBEAN,
        'sans-serif-medium': exports.build.LOLLIPOP,
        'sans-serif-black': exports.build.LOLLIPOP,
        'sans-serif-smallcaps': exports.build.LOLLIPOP,
        'serif-monospace': exports.build.LOLLIPOP,
        'serif': exports.build.LOLLIPOP,
        'casual': exports.build.LOLLIPOP,
        'cursive': exports.build.LOLLIPOP,
        'monospace': exports.build.LOLLIPOP,
        'sans-serif-condensed-medium': exports.build.OREO
    };
    const FONTALIAS_ANDROID = {
        'arial': 'sans-serif',
        'helvetica': 'sans-serif',
        'tahoma': 'sans-serif',
        'verdana': 'sans-serif',
        'times': 'serif',
        'times new roman': 'serif',
        'palatino': 'serif',
        'georgia': 'serif',
        'baskerville': 'serif',
        'goudy': 'serif',
        'fantasy': 'serif',
        'itc stone serif': 'serif',
        'sans-serif-monospace': 'monospace',
        'monaco': 'monospace',
        'courier': 'serif-monospace',
        'courier new': 'serif-monospace'
    };
    const FONTWEIGHT_ANDROID = {
        '100': 'thin',
        '200': 'extra_light',
        '300': 'light',
        '400': 'normal',
        '500': 'medium',
        '600': 'semi_bold',
        '700': 'bold',
        '800': 'extra_bold',
        '900': 'black'
    };

    const SETTINGS = {
        builtInExtensions: [
            'androme.external',
            'androme.list',
            'androme.table',
            'androme.grid',
            'androme.menu',
            'androme.drawer'
        ],
        targetAPI: exports.build.OREO,
        density: exports.density.MDPI,
        useConstraintLayout: true,
        useConstraintChain: true,
        useConstraintGuideline: true,
        useUnitDP: true,
        useFontAlias: true,
        supportRTL: true,
        numberResourceValue: false,
        alwaysReevaluateResources: false,
        excludeTextColor: ['#000000'],
        excludeBackgroundColor: ['#FFFFFF'],
        horizontalPerspective: true,
        whitespaceHorizontalOffset: 4,
        whitespaceVerticalOffset: 14,
        chainPackedHorizontalOffset: 4,
        chainPackedVerticalOffset: 14,
        showAttributes: true,
        autoCloseOnWrite: true,
        outputDirectory: 'app/src/main',
        outputActivityMainFileName: 'activity_main.xml',
        outputArchiveFileType: 'zip',
        outputMaxProcessingTime: 30
    };

    class Application {
        constructor(TypeT, TypeU) {
            this.TypeT = TypeT;
            this.TypeU = TypeU;
            this.elements = new Set();
            this.ids = [];
            this.views = [];
            this.pathnames = [];
            this._extensions = [];
            this._closed = false;
            this.cache = new this.TypeU();
            this.cacheInternal = new this.TypeU();
        }
        registerController(controllerHandler) {
            controllerHandler.cache = this.cache;
            this.controllerHandler = controllerHandler;
        }
        registerResource(resource) {
            resource.cache = this.cache;
            this.resourceHandler = resource;
        }
        registerExtension(extension) {
            const found = this.findExtension(extension.name);
            if (found != null) {
                found.tagNames = extension.tagNames;
                Object.assign(found.options, extension.options);
            }
            else {
                if (extension.dependences.every((item) => this.findExtension(item.name) != null)) {
                    extension.application = this;
                    this._extensions.push(extension);
                }
            }
        }
        finalize() {
            this.resourceHandler.finalize(this.viewData);
            this.views = this.resourceHandler.views;
            this.cacheInternal.list.forEach(node => {
                this.extensions.forEach(item => {
                    item.parent = null;
                    item.node = node;
                    item.element = node.element;
                    if (item.condition()) {
                        item.finalize();
                    }
                });
            });
            for (let i = 0; i < this.views.length; i++) {
                let output = this.views[i].replace(/{[<:#@&>]{1}[0-9]+}/g, '');
                if (SETTINGS.useUnitDP) {
                    output = replaceDP(output, SETTINGS.density);
                }
                this.views[i] = output;
            }
            this._closed = true;
        }
        reset() {
            resetId();
            this.cacheInternal.list.forEach(node => {
                const element = node.element;
                delete element.__boxSpacing;
                delete element.__boxStyle;
                delete element.__fontStyle;
                delete element.__imageSource;
                delete element.__optionArray;
                delete element.__valueString;
            });
            this.cache.reset();
            this.cacheInternal.reset();
            this.resetController();
            this.resetResource();
            this.appName = '';
            this.ids = [];
            this.views = [];
            this.pathnames = [];
            this._closed = false;
        }
        resetController() {
            this.controllerHandler.reset();
        }
        resetResource() {
            this.resourceHandler.reset();
        }
        setConstraints() {
            this.controllerHandler.setConstraints();
        }
        setMarginPadding() {
            this.controllerHandler.setMarginPadding();
        }
        setResources() {
            this.resourceHandler.setFontStyle();
            this.resourceHandler.setBoxSpacing();
            this.resourceHandler.setBoxStyle();
            this.resourceHandler.setValueString();
            this.resourceHandler.setOptionArray();
            this.resourceHandler.setImageSource();
        }
        setStyleMap() {
            let cssWarning = false;
            for (let i = 0; i < document.styleSheets.length; i++) {
                const styleSheet = document.styleSheets[i];
                try {
                    for (let j = 0; j < styleSheet.cssRules.length; j++) {
                        const cssRule = styleSheet.cssRules[j];
                        const attributes = new Set();
                        for (const attr of Array.from(cssRule.style)) {
                            attributes.add(hyphenToCamelCase(attr));
                        }
                        const elements = document.querySelectorAll(cssRule.selectorText);
                        if (this.appName !== '') {
                            Array.from(elements).forEach((element) => {
                                const object = element;
                                delete object.__style;
                                delete object.__styleMap;
                            });
                        }
                        Array.from(elements).forEach((element) => {
                            for (const attr of Array.from(element.style)) {
                                attributes.add(hyphenToCamelCase(attr));
                            }
                            const style = getComputedStyle(element);
                            const styleMap = {};
                            for (const name of attributes) {
                                if (name.toLowerCase().indexOf('color') !== -1) {
                                    const color = getByColorName(cssRule.style[name]);
                                    if (color !== '') {
                                        cssRule.style[name] = convertRGB(color);
                                    }
                                }
                                if (hasValue(element.style[name])) {
                                    styleMap[name] = element.style[name];
                                }
                                else if (style[name] === cssRule.style[name]) {
                                    styleMap[name] = style[name];
                                }
                            }
                            const object = element;
                            if (object.__styleMap != null) {
                                Object.assign(object.__styleMap, styleMap);
                            }
                            else {
                                object.__style = style;
                                object.__styleMap = styleMap;
                            }
                        });
                    }
                }
                catch (error) {
                    if (!cssWarning) {
                        alert('External CSS files cannot be parsed when loading this program from your hard drive with Chrome 64+ (file://). Either use a local web ' +
                            'server (http://), embed your CSS files into a <style> tag, or use a different browser. See the README for further instructions.\n\n' +
                            `${styleSheet.href}\n\n${error}`);
                        cssWarning = true;
                    }
                }
            }
        }
        createNodeCache(layoutRoot) {
            let nodeTotal = 0;
            if (layoutRoot === document.body) {
                Array.from(document.body.childNodes).forEach((item) => {
                    if (item.nodeName === '#text') {
                        if (item.textContent && item.textContent.trim() !== '') {
                            nodeTotal++;
                        }
                    }
                    else {
                        if (isVisible(item)) {
                            nodeTotal++;
                        }
                    }
                });
            }
            const elements = (layoutRoot !== document.body ? layoutRoot.querySelectorAll('*') : document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *')));
            this.cache.parent = undefined;
            this.cache.clear();
            this.controllerHandler.namespaces.clear();
            const extensions = this.extensions;
            extensions.forEach(item => {
                item.parent = null;
                item.node = {};
                item.element = layoutRoot;
                item.beforeInit();
            });
            if (layoutRoot != null) {
                const node = this.insertNode(layoutRoot);
                if (node != null) {
                    node.parent = new this.TypeT(0, 0);
                    this.cache.parent = node;
                }
            }
            extensions.forEach(item => item.node = this.cache.parent);
            for (const element of Array.from(elements)) {
                let handled = false;
                extensions.some(item => {
                    if (item.init(element)) {
                        handled = true;
                        return true;
                    }
                    return false;
                });
                if (!handled) {
                    if (INLINE_CHROME.includes(element.tagName) && element.parentElement && (MAPPING_CHROME[element.parentElement.tagName] != null || INLINE_CHROME.includes(element.parentElement.tagName))) {
                        continue;
                    }
                    let valid = true;
                    let current = element.parentElement;
                    while (current != null) {
                        if (current === layoutRoot) {
                            break;
                        }
                        else if (current !== layoutRoot && this.elements.has(current)) {
                            valid = false;
                            break;
                        }
                        current = current.parentElement;
                    }
                    if (valid) {
                        this.insertNode(element);
                    }
                }
            }
            if (this.cache.list.length > 0) {
                const preAlignment = {};
                this.cache.list.forEach(node => {
                    const element = node.element;
                    preAlignment[node.id] = {};
                    const style = preAlignment[node.id];
                    switch (node.styleMap.textAlign) {
                        case 'center':
                        case 'right':
                        case 'end':
                            style.textAlign = node.style.textAlign;
                            element.style.textAlign = '';
                            break;
                    }
                    style.verticalAlign = node.styleMap.verticalAlign || '';
                    element.style.verticalAlign = 'top';
                    if (node.overflow !== 0 /* NONE */) {
                        if (hasValue(node.styleMap.width)) {
                            style.width = node.styleMap.width;
                            element.style.width = '';
                        }
                        if (hasValue(node.styleMap.height)) {
                            style.height = node.styleMap.height;
                            element.style.height = '';
                        }
                        style.overflow = node.style.overflow;
                        element.style.overflow = 'visible';
                    }
                    node.setBounds();
                });
                const parents = {};
                this.cache.list.forEach(parent => {
                    this.cache.list.forEach(child => {
                        if (parent !== child) {
                            if (child.element && child.element.parentElement === parent.element) {
                                child.parent = parent;
                                parent.children.push(child);
                            }
                            if (child.fixed && child.box.left >= parent.linear.left && child.box.right <= parent.linear.right && child.box.top >= parent.linear.top && child.box.bottom <= parent.linear.bottom) {
                                if (parents[child.id] == null) {
                                    parents[child.id] = [];
                                }
                                parents[child.id].push(parent);
                            }
                        }
                    });
                });
                this.cache.list.forEach(node => {
                    const nodes = parents[node.id];
                    if (nodes != null) {
                        nodes.push(node.parent);
                        let minArea = Number.MAX_VALUE;
                        let closest = null;
                        nodes.forEach(current => {
                            const area = (current.box.left - node.linear.left) + (current.box.right - node.linear.right) + (current.box.top - node.linear.top) + (current.box.bottom - node.linear.bottom);
                            if (area < minArea) {
                                closest = current;
                                minArea = area;
                            }
                            else if (area === minArea) {
                                if (current.element === node.parent.element) {
                                    closest = current;
                                }
                            }
                        });
                        if (closest != null) {
                            node.parent = closest;
                        }
                    }
                    if (node.element && node.element.children.length > 0 && !node.children.every((current) => INLINE_CHROME.includes(current.tagName))) {
                        Array.from(node.element.childNodes).forEach((element) => {
                            if (element.nodeName === '#text' && element.textContent && element.textContent.trim() !== '') {
                                this.insertNode(element, node);
                            }
                        });
                    }
                });
                this.cache.list.forEach(node => {
                    if (node.hasElement) {
                        const style = preAlignment[node.id];
                        if (style != null) {
                            for (const attr in style) {
                                node.element.style[attr] = style[attr];
                            }
                        }
                    }
                });
                extensions.forEach(item => {
                    item.parent = null;
                    item.node = this.cache.parent;
                    item.element = layoutRoot;
                    item.afterInit();
                });
                this.cache.sortAsc('depth', 'parent.id', 'parentIndex', 'id');
                this.cache.list.forEach(node => {
                    if (node.hasElement) {
                        let i = 0;
                        Array.from(node.element.childNodes).forEach((element) => {
                            if (element.__node != null && (element.__node.parent.element === node.element)) {
                                element.__node.parentIndex = i++;
                            }
                        });
                        sortAsc(node.children, 'parentIndex');
                    }
                });
                this.currentId = layoutRoot.dataset.currentId;
                this.cacheInternal.list.push(...this.cache.list);
                return true;
            }
            return false;
        }
        createLayoutXml() {
            let output = `<?xml version="1.0" encoding="utf-8"?>\n{:0}`;
            let empty = true;
            const mapX = [];
            const mapY = [];
            const extensions = this.extensions;
            this.cache.list.forEach(node => {
                const x = Math.floor(node.bounds.x);
                const y = node.parent.id;
                if (mapX[node.depth] == null) {
                    mapX[node.depth] = {};
                }
                if (mapY[node.depth] == null) {
                    mapY[node.depth] = {};
                }
                if (mapX[node.depth][x] == null) {
                    mapX[node.depth][x] = new this.TypeU();
                }
                if (mapY[node.depth][y] == null) {
                    mapY[node.depth][y] = new this.TypeU();
                }
                mapX[node.depth][x].list.push(node);
                mapY[node.depth][y].list.push(node);
            });
            for (let i = 0; i < mapY.length; i++) {
                const coordsY = Object.keys(mapY[i]);
                const partial = new Map();
                for (let j = 0; j < coordsY.length; j++) {
                    const axisY = [];
                    const layers = [];
                    for (const node of mapY[i][coordsY[j]].list) {
                        switch (node.css('position')) {
                            case 'absolute':
                            case 'relative':
                            case 'fixed':
                                layers.push(node);
                                break;
                            default:
                                axisY.push(node);
                        }
                    }
                    axisY.sort((a, b) => {
                        if (a.linear.left !== b.linear.left && !a.parent.flex.enabled && !b.parent.flex.enabled && a.withinX(b.linear)) {
                            return (a.linear.left > b.linear.left ? 1 : -1);
                        }
                        return (a.parentIndex > b.parentIndex ? 1 : -1);
                    });
                    axisY.push(...sortAsc(layers, 'style.zIndex', 'parentIndex'));
                    for (let k = 0; k < axisY.length; k++) {
                        const nodeY = axisY[k];
                        const parent = nodeY.parent;
                        if (!nodeY.renderParent) {
                            let xml = '';
                            extensions.some(item => {
                                if (nodeY.renderExtension == null && item.is(nodeY.tagName)) {
                                    item.node = nodeY;
                                    item.parent = parent;
                                    if (item.condition()) {
                                        const [result, restart] = item.processNode(mapX, mapY);
                                        if (result !== '') {
                                            xml += result;
                                            if (restart) {
                                                k--;
                                            }
                                        }
                                        nodeY.renderExtension = item;
                                        return true;
                                    }
                                }
                                return false;
                            });
                            const renderExtension = parent.renderExtension;
                            if (renderExtension != null) {
                                renderExtension.node = nodeY;
                                renderExtension.parent = parent;
                                const [result, restart] = parent.renderExtension.processChild();
                                if (result !== '') {
                                    xml += result;
                                    if (restart) {
                                        k--;
                                    }
                                }
                            }
                            if (xml === '') {
                                let tagName = nodeY.viewName;
                                if (tagName === '') {
                                    if (nodeY.children.length > 0 && nodeY.children.some(node => !INLINE_CHROME.includes(node.tagName))) {
                                        const [linearX, linearY] = [NodeList.linearX(nodeY.children), NodeList.linearY(nodeY.children)];
                                        if (!nodeY.renderParent) {
                                            if (nodeY.children.length === 1 && linearX && linearY) {
                                                xml += this.writeFrameLayout(nodeY, parent);
                                            }
                                            else if ((linearX || linearY) && (!nodeY.flex.enabled || nodeY.children.every(node => node.flex.enabled)) && (!nodeY.children.some(node => node.css('float') === 'right') || nodeY.children.every(node => node.css('float') === 'right'))) {
                                                xml += this.writeLinearLayout(nodeY, parent, linearY);
                                            }
                                            else {
                                                xml += this.writeDefaultLayout(nodeY, parent);
                                            }
                                        }
                                    }
                                    else {
                                        if (nodeY.children.length === 0 && nodeY.element && !hasFreeFormText(nodeY.element)) {
                                            continue;
                                        }
                                        tagName = this.controllerHandler.getViewName(VIEW_STANDARD.TEXT);
                                    }
                                }
                                if (!nodeY.renderParent) {
                                    xml += this.writeView(nodeY, parent, tagName);
                                }
                            }
                            if (xml !== '') {
                                if (!partial.has(parent.id)) {
                                    partial.set(parent.id, []);
                                }
                                partial.get(parent.id).push(xml);
                            }
                        }
                    }
                }
                for (const [id, views] of partial.entries()) {
                    output = output.replace(`{:${id}}`, views.join(''));
                    empty = false;
                }
            }
            let pathname = '';
            if (this.cache.first.element.dataset != null) {
                pathname = trim((this.cache.first.element.dataset.pathname || '').trim(), '/');
            }
            if (!empty) {
                this.create(output, pathname);
                extensions.forEach(item => {
                    item.parent = null;
                    item.node = this.cache.parent;
                    item.element = null;
                    item.afterRender();
                });
                return true;
            }
            else {
                this.ids.pop();
                return false;
            }
        }
        writeFrameLayout(node, parent) {
            return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.FRAME);
        }
        writeLinearLayout(node, parent, vertical) {
            return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.LINEAR, { android: { orientation: (vertical ? 'vertical' : 'horizontal') } });
        }
        writeGridLayout(node, parent, columnCount, rowCount = 0) {
            return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.GRID, { android: { columnCount: columnCount.toString(), rowCount: (rowCount > 0 ? rowCount.toString() : '') } });
        }
        writeRelativeLayout(node, parent) {
            return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.RELATIVE);
        }
        writeConstraintLayout(node, parent) {
            return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.CONSTRAINT);
        }
        writeView(node, parent, viewName) {
            return this.controllerHandler.renderView(node, parent, viewName);
        }
        writeDefaultLayout(node, parent) {
            if (SETTINGS.useConstraintLayout || node.flex.enabled) {
                return this.writeConstraintLayout(node, parent);
            }
            else {
                return this.writeRelativeLayout(node, parent);
            }
        }
        replaceInlineAttributes() {
            let output = this.current;
            const options = {};
            this.cache.visible.forEach(node => output = this.controllerHandler.replaceInlineAttributes(output, node, options));
            output = output.replace('{@0}', this.controllerHandler.getRootAttributes(options));
            this.current = output;
        }
        replaceAppended() {
            const output = this.controllerHandler.replaceAppended(this.current);
            this.current = output;
        }
        findExtension(name) {
            return this._extensions.find(item => item.name === name);
        }
        toString() {
            return (this.views.length > 0 ? this.views[0] : '');
        }
        insertNode(element, parent) {
            let node = null;
            if (element.nodeName === '#text') {
                if (element.textContent && element.textContent.trim() !== '') {
                    node = new this.TypeT(this.cache.nextId, SETTINGS.targetAPI, element, { parent, tagName: 'PLAINTEXT' });
                    node.setBounds(false, element);
                    if (parent != null) {
                        node.inheritStyle(parent);
                        parent.children.push(node);
                    }
                }
            }
            else if (isVisible(element)) {
                node = new this.TypeT(this.cache.nextId, SETTINGS.targetAPI, element);
            }
            if (node != null) {
                this.cache.list.push(node);
            }
            return node;
        }
        create(value, pathname = '') {
            if (this.views.length < this.ids.length) {
                this.pathnames[this.views.length] = (pathname !== '' ? pathname : 'res/layout');
                this.views.push(value);
            }
        }
        set appName(value) {
            if (this.resourceHandler != null) {
                this.resourceHandler.file.appName = value;
            }
        }
        get appName() {
            return (this.resourceHandler != null ? this.resourceHandler.file.appName : '');
        }
        set current(value) {
            const index = this.views.length - 1;
            this.views[index] = value;
        }
        get current() {
            return this.views[this.views.length - 1];
        }
        set currentId(value) {
            if (this.ids.length === this.views.length) {
                this.ids.push(value);
            }
        }
        get currentId() {
            return this.ids[this.ids.length - 1] || '';
        }
        get closed() {
            return this._closed;
        }
        get extensions() {
            return this._extensions.filter(item => item.enabled);
        }
        get viewData() {
            return { cache: this.cacheInternal.list, ids: this.ids, views: this.views, pathnames: this.pathnames };
        }
        get length() {
            return this.views.length;
        }
    }

    class Extension {
        constructor(name, tagNames = [], options = {}) {
            this.name = name;
            this.options = options;
            this.tagNames = [];
            this.enabled = true;
            this.dependences = [];
            this.tagNames = tagNames.map(value => value.trim().toUpperCase());
        }
        is(tagName) {
            return (this.tagNames.length === 0 || this.tagNames.includes(tagName));
        }
        included(element) {
            if (element == null) {
                element = this.element;
            }
            return (element != null && element.dataset && element.dataset.extension != null ? element.dataset.extension.split(',').map(value => value.trim()).includes(this.name) : false);
        }
        beforeInit(internal = false) {
            if (!internal && this.included()) {
                this.dependences.filter((item) => item.init).forEach((item) => {
                    const extension = this.application.findExtension(item.name);
                    if (extension != null) {
                        extension.parent = this.parent;
                        extension.node = this.node;
                        extension.element = this.element;
                        extension.beforeInit(true);
                    }
                });
            }
        }
        init(element) {
            return false;
        }
        afterInit(internal = false) {
            if (!internal && this.included()) {
                this.dependences.filter((item) => item.init).forEach((item) => {
                    const extension = this.application.findExtension(item.name);
                    if (extension != null) {
                        extension.parent = this.parent;
                        extension.node = this.node;
                        extension.element = this.element;
                        extension.afterInit(true);
                    }
                });
            }
        }
        afterRender() {
            return;
        }
        condition() {
            if (this.node && this.node.element.dataset != null) {
                if (!this.node.element.dataset.extension) {
                    return (this.tagNames.length > 0);
                }
                else {
                    const extensions = this.node.element.dataset.extension.split(',');
                    return (this.tagNames.length === 0 && extensions.length > 1 ? false : this.included());
                }
            }
            return false;
        }
        processNode(mapX, mapY) {
            return ['', false];
        }
        processChild(mapX, mapY) {
            return ['', false];
        }
        require(value, init = false) {
            this.dependences.push({ name: value, init });
        }
        finalize() {
            return;
        }
        get linearX() {
            return (this.node != null ? NodeList.linearX(this.node.children) : false);
        }
        get linearY() {
            return (this.node != null ? NodeList.linearY(this.node.children) : false);
        }
    }

    class Controller {
        constructor() {
            this.namespaces = new Set();
            this.before = {};
            this.after = {};
        }
        reset() {
            this.before = {};
            this.after = {};
        }
        replaceAppended(output) {
            for (const id in this.before) {
                output = output.replace(`{<${id}}`, this.before[id].join(''));
            }
            for (const id in this.after) {
                output = output.replace(`{>${id}}`, this.after[id].join(''));
            }
            return output;
        }
        prependBefore(id, xml, index = -1) {
            if (this.before[id] == null) {
                this.before[id] = [];
            }
            if (index !== -1 && index < this.before[id].length) {
                this.before[id].splice(index, 0, xml);
            }
            else {
                this.before[id].push(xml);
            }
        }
        appendAfter(id, xml, index = -1) {
            if (this.after[id] == null) {
                this.after[id] = [];
            }
            if (index !== -1 && index < this.after[id].length) {
                this.after[id].splice(index, 0, xml);
            }
            else {
                this.after[id].push(xml);
            }
        }
        getEnclosingTag(depth, tagName, id, xml = '', preXml = '', postXml = '') {
            const indent = padLeft(depth);
            let output = preXml +
                `{<${id}}`;
            if (hasValue(xml)) {
                output += indent + `<${tagName}{@${id}}{#${id}}{&${id}}>\n` +
                    xml +
                    indent + `</${tagName}>\n`;
            }
            else {
                output += indent + `<${tagName}{@${id}}{#${id}}{&${id}} />\n`;
            }
            output += `{>${id}}` +
                postXml;
            return output;
        }
    }

    class Node {
        constructor(id, element, options) {
            this.id = id;
            this.depth = -1;
            this.styleMap = {};
            this.visible = true;
            this.companion = false;
            this.parentIndex = Number.MAX_VALUE;
            this.ignoreResource = 0;
            this.gridRowSpan = 0;
            this.gridColumnSpan = 0;
            this.gridPadding = { top: 0, right: [], bottom: 0, left: [] };
            this._namespaces = new Set();
            this._options = {};
            Object.assign(this, options);
            if (element != null) {
                const object = element;
                if (element instanceof HTMLElement) {
                    const styleMap = object.__styleMap || {};
                    for (const inline of Array.from(element.style)) {
                        styleMap[hyphenToCamelCase(inline)] = element.style[inline];
                    }
                    this.style = object.__style || getComputedStyle(element);
                    this.styleMap = styleMap;
                }
                this._element = element;
                object.__node = this;
            }
        }
        add(obj, attr, value = '', overwrite = true) {
            const name = `_${obj || '_'}`;
            if (hasValue(value)) {
                if (this[name] == null) {
                    this._namespaces.add(obj);
                    this[name] = {};
                }
                if (!overwrite && this[name][attr] != null) {
                    return null;
                }
                this[name][attr] = value;
            }
            return this[name] && this[name][attr];
        }
        get(obj, attr) {
            const name = `_${obj || '_'}`;
            return (this[name] && this[name][attr] != null ? this[name][attr] : '');
        }
        delete(obj, ...attributes) {
            const name = `_${obj || '_'}`;
            if (this[name] != null) {
                if (typeof attributes[0] === 'object') {
                    for (const key in attributes[0]) {
                        delete this[name][attributes[0][key]];
                    }
                }
                else {
                    for (const attr of attributes) {
                        if (attr.indexOf('*') !== -1) {
                            for (const [key] of search(this[name], attr)) {
                                delete this[name][key];
                            }
                        }
                        else {
                            delete this[name][attr];
                        }
                    }
                }
            }
        }
        apply(options) {
            if (options != null) {
                for (const namespace in options) {
                    const obj = options[namespace];
                    for (const attr in obj) {
                        this.add(namespace, attr, obj[attr]);
                    }
                }
            }
        }
        render(parent) {
            this.renderParent = parent;
            this.renderDepth = (parent.id === 0 ? 0 : parent.renderDepth + 1);
        }
        hide() {
            this.renderParent = true;
            this.visible = false;
        }
        options(attr, value, overwrite = true) {
            if (hasValue(value)) {
                if (!overwrite && this._options[attr] != null) {
                    return {};
                }
                this._options[attr] = value;
            }
            return this._options[attr];
        }
        ascend() {
            const result = [];
            let current = this.parent;
            while (current != null) {
                if (current.id !== 0) {
                    result.push(current);
                    current = current.parent;
                }
                else {
                    break;
                }
            }
            return result;
        }
        cascade() {
            function cascade(node) {
                const current = [...node.children];
                node.children.forEach(item => current.push(...cascade(item)));
                return current;
            }
            return cascade(this);
        }
        inheritStyle(node) {
            const style = this.style || this.styleMap;
            for (const attr in node.style) {
                if (attr.startsWith('font') || attr.startsWith('color')) {
                    const key = hyphenToCamelCase(attr);
                    style[key] = node.style[key];
                }
            }
        }
        inheritStyleMap(node) {
            for (const attr in node.styleMap) {
                if (this.styleMap[attr] == null) {
                    this.styleMap[attr] = node.styleMap[attr];
                }
            }
        }
        intersect(rect, dimension = 'bounds') {
            const top = (rect.top >= this[dimension].top && rect.top < this[dimension].bottom);
            const right = (rect.right > this[dimension].left && rect.right <= this[dimension].right);
            const bottom = (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom);
            const left = (rect.left >= this[dimension].left && rect.left < this[dimension].right);
            return (top && (left || right)) || (bottom && (left || right));
        }
        withinX(rect, dimension = 'linear') {
            return ((rect.top >= this[dimension].top && rect.top < this[dimension].bottom) ||
                (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom) ||
                (this[dimension].top >= rect.top && this[dimension].bottom <= rect.bottom) ||
                (rect.top >= this[dimension].top && rect.bottom <= this[dimension].bottom));
        }
        withinY(rect, dimension = 'linear') {
            return ((rect.left >= this[dimension].left && rect.left < this[dimension].right) ||
                (rect.right > this[dimension].left && rect.right <= this[dimension].right) ||
                (this[dimension].left >= rect.left && this[dimension].right <= rect.right) ||
                (rect.left >= this[dimension].left && rect.right <= this[dimension].right));
        }
        css(attr, value = '') {
            if (arguments.length === 2) {
                this.styleMap[attr] = (hasValue(value) ? value : '');
            }
            return this.styleMap[attr] || (this.style && this.style[attr]) || '';
        }
        setBounds(calibrate = false, element) {
            if (!calibrate) {
                const bounds = (element != null ? getRangeBounds(element) : (this.hasElement ? assignBounds(this.element.getBoundingClientRect()) : null));
                if (bounds != null) {
                    this.bounds = bounds;
                }
            }
            if (this.bounds != null) {
                this.linear = {
                    top: this.bounds.top - this.marginTop,
                    right: this.bounds.right + this.marginRight,
                    bottom: this.bounds.bottom + this.marginBottom,
                    left: this.bounds.left - this.marginLeft,
                    width: 0,
                    height: 0
                };
                this.box = {
                    top: this.bounds.top + (this.paddingTop + this.borderTopWidth),
                    right: this.bounds.right - (this.paddingRight + this.borderRightWidth),
                    bottom: this.bounds.bottom - (this.paddingBottom + this.borderBottomWidth),
                    left: this.bounds.left + (this.paddingLeft + this.borderLeftWidth),
                    width: 0,
                    height: 0
                };
                this.setDimensions();
            }
        }
        expandDimensions() {
            let [width, height] = [Math.max.apply(null, this.children.map(node => node.linear.right)), Math.max.apply(null, this.children.map(node => node.linear.bottom))];
            switch (this.style.position) {
                case 'static':
                case 'relative':
                    width -= this.linear.left;
                    height -= this.linear.top;
                    break;
            }
            width += this.paddingRight + this.borderRightWidth;
            height += this.paddingBottom + this.borderBottomWidth;
            let calibrate = false;
            if (this.viewWidth < width) {
                if (this.bounds.width < width) {
                    this.bounds.width = width;
                    this.bounds.right = this.bounds.left + this.bounds.width;
                    calibrate = true;
                }
                else {
                    width = this.bounds.width;
                }
                this.bounds.minWidth = formatPX(width);
            }
            if (this.viewHeight < height) {
                if (this.bounds.height < height) {
                    this.bounds.height = height;
                    this.bounds.bottom = this.bounds.top + this.bounds.height;
                    calibrate = true;
                }
                else {
                    height = this.bounds.height;
                }
                this.bounds.minHeight = formatPX(height);
            }
            if (calibrate) {
                this.setBounds(true);
            }
        }
        setDimensions() {
            const linear = this.linear;
            linear.width = linear.right - linear.left;
            linear.height = linear.bottom - linear.top;
            const box = this.box;
            box.width = box.right - box.left;
            box.height = box.bottom - box.top;
        }
        set parent(value) {
            if (value === this._parent) {
                return;
            }
            if (this._parent && this._parentOriginal == null) {
                this._parentOriginal = this._parent;
            }
            this._parent = value;
            if (this.depth === -1) {
                this.depth = value.depth + 1;
            }
        }
        get parent() {
            return this._parent;
        }
        set parentOriginal(value) {
            this._parentOriginal = value;
        }
        get parentOriginal() {
            return this._parentOriginal || this._parent;
        }
        set tagName(value) {
            this._tagName = value;
        }
        get tagName() {
            return this._tagName || (this.hasElement ? (this.element.tagName === 'INPUT' ? this.element.type.toUpperCase() : this.element.tagName) : '');
        }
        set viewName(value) {
            this._viewName = value;
        }
        get viewName() {
            return this._viewName;
        }
        set renderParent(value) {
            if (value instanceof Node) {
                value.renderChildren.push(this);
            }
            this._renderParent = value;
        }
        get renderParent() {
            return this._renderParent;
        }
        get element() {
            return this._element || {};
        }
        get hasElement() {
            return (this._element != null);
        }
        get parentElement() {
            return this._element && this._element.parentElement;
        }
        get namespaces() {
            return Array.from(this._namespaces);
        }
        get flex() {
            if (this._flex == null) {
                const style = this.style;
                if (style != null) {
                    const parent = this.parentOriginal;
                    this._flex = {
                        enabled: (style.display.indexOf('flex') !== -1),
                        direction: style.flexDirection,
                        basis: style.flexBasis,
                        grow: convertInt(style.flexGrow),
                        shrink: convertInt(style.flexShrink),
                        wrap: style.flexWrap,
                        alignSelf: (parent.styleMap.alignItems != null && (this.styleMap.alignSelf == null || style.alignSelf === 'auto') ? parent.styleMap.alignItems : style.alignSelf),
                        justifyContent: style.justifyContent,
                        order: convertInt(style.order)
                    };
                }
            }
            return this._flex || {};
        }
        get floating() {
            const float = (this.style != null ? this.style.float : '');
            return (float === 'left' || float === 'right');
        }
        get fixed() {
            return (this.style.display === 'fixed');
        }
        get overflow() {
            if (this._overflow == null) {
                let value = 0 /* NONE */;
                if (this.hasElement) {
                    if (this.css('overflow') === 'scroll' || (this.css('overflowX') === 'auto' && this.element.clientWidth !== this.element.scrollWidth)) {
                        value |= 2 /* HORIZONTAL */;
                    }
                    if (this.css('overflow') === 'scroll' || (this.css('overflowY') === 'auto' && this.element.clientHeight !== this.element.scrollHeight)) {
                        value |= 4 /* VERTICAL */;
                    }
                }
                this._overflow = value;
            }
            return this._overflow;
        }
        get overflowX() {
            return ((this._overflow & 2 /* HORIZONTAL */) === 2 /* HORIZONTAL */);
        }
        get overflowY() {
            return ((this._overflow & 4 /* VERTICAL */) === 4 /* VERTICAL */);
        }
        get viewWidth() {
            return convertInt(this.styleMap.width || this.styleMap.minWidth);
        }
        get viewHeight() {
            return convertInt(this.styleMap.height || this.styleMap.lineHeight || this.styleMap.minHeight);
        }
        get marginTop() {
            return convertInt(this.css('marginTop'));
        }
        get marginRight() {
            return convertInt(this.css('marginRight'));
        }
        get marginBottom() {
            return convertInt(this.css('marginBottom'));
        }
        get marginLeft() {
            return convertInt(this.css('marginLeft'));
        }
        get borderTopWidth() {
            return convertInt(this.css('borderTopWidth'));
        }
        get borderRightWidth() {
            return convertInt(this.css('borderRightWidth'));
        }
        get borderBottomWidth() {
            return convertInt(this.css('borderBottomWidth'));
        }
        get borderLeftWidth() {
            return convertInt(this.css('borderLeftWidth'));
        }
        get paddingTop() {
            return convertInt(this.css('paddingTop'));
        }
        get paddingRight() {
            return convertInt(this.css('paddingRight'));
        }
        get paddingBottom() {
            return convertInt(this.css('paddingBottom'));
        }
        get paddingLeft() {
            return convertInt(this.css('paddingLeft'));
        }
        get center() {
            return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2) };
        }
    }

    function parseRTL(value) {
        if (SETTINGS.supportRTL && SETTINGS.targetAPI >= exports.build.JELLYBEAN_1) {
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

    const API_ANDROID = {
        [exports.build.OREO]: {
            android: ['fontWeight', 'layout_marginHorizontal', 'layout_marginVertical', 'paddingHorizontal', 'paddingVertical'],
            customizations: {}
        },
        [exports.build.JELLYBEAN_1]: {
            android: ['labelFor'],
            customizations: {}
        },
        [exports.build.LOLLIPOP]: {
            android: ['layout_columnWeight']
        },
        [exports.build.ALL]: {
            customizations: {
                'Button': {
                    android: {
                        textAllCaps: 'false',
                        minWidth: '0dp',
                        minHeight: '0dp'
                    }
                }
            }
        }
    };

    class View extends Node {
        constructor(id, api, element, options) {
            super(id, element, options);
            this.id = id;
            this.api = api;
            this.constraint = {};
            this.children = [];
            this.renderChildren = [];
        }
        static getViewName(tagName) {
            return VIEW_ANDROID[VIEW_STANDARD[tagName]];
        }
        add(obj, attr, value = '', overwrite = true) {
            if (hasValue(attr) && !this.supported(obj, attr)) {
                return false;
            }
            return super.add(obj, attr, value, overwrite);
        }
        android(attr = '', value = '', overwrite = true) {
            switch (arguments.length) {
                case 0:
                    return this._android;
                case 1:
                    return this._android && this._android[attr];
                default:
                    this.add('android', attr, value, overwrite);
            }
        }
        app(attr = '', value = '', overwrite = true) {
            switch (arguments.length) {
                case 0:
                    return this._app;
                case 1:
                    return this._app && this._app[attr];
                default:
                    this.add('app', attr, value, overwrite);
            }
        }
        attr(value, overwrite = true) {
            const match = value.match(/^(?:([a-z]+):)?(\w+)="((?:@+?[a-z]+\/)?.+)"$/);
            if (match != null) {
                this.add(match[1] || '_', match[2], match[3], overwrite);
            }
        }
        anchor(position, adjacent = {}, orientation = '', overwrite) {
            if (overwrite == null) {
                overwrite = (adjacent.stringId === 'parent');
            }
            switch (this.renderParent.viewName) {
                case VIEW_ANDROID.CONSTRAINT:
                    if (arguments.length === 1) {
                        return this.app(position);
                    }
                    this.app(position, adjacent.stringId, overwrite);
                    break;
                case VIEW_ANDROID.RELATIVE:
                    if (arguments.length === 1) {
                        return this.android(position);
                    }
                    this.android(position, adjacent.stringId, overwrite);
                    break;
            }
            if (orientation !== '') {
                this.constraint[orientation] = true;
            }
        }
        modifyBox(area, offset) {
            for (const key of Object.keys(BOX_STANDARD)) {
                if ((area & BOX_STANDARD[key]) === BOX_STANDARD[key]) {
                    const dimension = parseRTL(BOX_ANDROID[key]);
                    const total = formatPX(offset + convertInt(this.android(dimension)));
                    this.css(dimension, total);
                    this.android(dimension, total);
                }
            }
            this.setBounds(true);
        }
        supported(obj, attr) {
            for (let i = this.api + 1; i < exports.build.LATEST; i++) {
                const version = API_ANDROID[i];
                if (version && version[obj] && version[obj].includes(attr)) {
                    return false;
                }
            }
            return true;
        }
        combine() {
            const result = [];
            this.namespaces.forEach(value => {
                const obj = this[`_${value}`];
                for (const attr in obj) {
                    if (value !== '_') {
                        result.push(`${value}:${attr}="${obj[attr]}"`);
                    }
                    else {
                        result.push(`${attr}="${obj[attr]}"`);
                    }
                }
            });
            return result.sort((a, b) => {
                if (a.startsWith('android:id=')) {
                    return -1;
                }
                else {
                    return (a > b ? 1 : -1);
                }
            });
        }
        applyCustomizations() {
            [API_ANDROID[this.api], API_ANDROID[0]].forEach(item => {
                if (item && item.customizations != null) {
                    const customizations = item.customizations[this.viewName];
                    if (customizations != null) {
                        for (const obj in customizations) {
                            for (const attr in customizations[obj]) {
                                this.add(obj, attr, customizations[obj][attr], false);
                            }
                        }
                    }
                }
            });
        }
        is(...views) {
            for (const value of views) {
                if (this.viewName === View.getViewName(value)) {
                    return true;
                }
            }
            return false;
        }
        setViewId(viewName) {
            super.viewName = viewName || this.viewName;
            if (this.viewId == null) {
                const element = this.element;
                this.viewId = generateId('android', (element.id || element.name || `${getFileExt(this.viewName).toLowerCase()}_1`).replace(/[^\w]/g, '_'));
                this.android('id', this.stringId);
            }
        }
        setViewLayout(options) {
            const styleMap = this.styleMap;
            let parent;
            let width;
            let height;
            let wrapContent;
            const renderParent = this.renderParent;
            if (renderParent == null || renderParent === true) {
                return;
            }
            const constraint = this.constraint;
            if (options != null) {
                parent = options.parent;
                [width, height] = [options.width, options.height];
                wrapContent = options.wrapContent;
            }
            else {
                parent = this.parent;
                width = (this.hasElement ? this.element.offsetWidth + this.marginLeft + this.marginRight : 0);
                height = (this.hasElement ? this.element.offsetHeight + this.marginTop + this.marginBottom : 0);
                wrapContent = parent.is(VIEW_STANDARD.CONSTRAINT, VIEW_STANDARD.GRID);
            }
            const parentWidth = (parent.hasElement ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + convertInt(parent.style.borderLeftWidth) + convertInt(parent.style.borderRightWidth)) : Number.MAX_VALUE);
            const parentHeight = (parent.hasElement ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + convertInt(parent.style.borderTopWidth) + convertInt(parent.style.borderBottomWidth)) : Number.MAX_VALUE);
            if (this.overflow !== 0 /* NONE */ && !this.is(VIEW_STANDARD.TEXT)) {
                this.android('layout_width', (this.horizontal ? 'wrap_content' : 'match_parent'));
                this.android('layout_height', (this.horizontal ? 'match_parent' : 'wrap_content'));
            }
            else {
                if (this.android('layout_width') !== '0px') {
                    if (hasValue(styleMap.width)) {
                        if (isPercent(styleMap.width)) {
                            if (renderParent.tagName === 'TABLE') {
                                this.android('layout_columnWeight', (convertInt(styleMap.width) / 100).toFixed(2));
                                this.android('layout_width', '0px');
                            }
                            else {
                                this.android('layout_width', 'wrap_content');
                            }
                        }
                        else {
                            this.android('layout_width', convertPX(styleMap.width));
                        }
                    }
                    if (hasValue(styleMap.minWidth) && !isPercent(styleMap.minWidth) && !constraint.minWidth) {
                        this.android('layout_width', 'wrap_content', false);
                        this.android('minWidth', convertPX(styleMap.minWidth), false);
                    }
                    if (hasValue(styleMap.maxWidth) && !isPercent(styleMap.maxWidth) && !constraint.maxWidth) {
                        this.android('maxWidth', convertPX(styleMap.maxWidth), false);
                    }
                }
                if ((!this.flex.enabled || constraint.expand) && constraint.layoutWidth != null) {
                    if (constraint.layoutWidth) {
                        this.android('layout_width', (this.renderChildren.some(node => node.css('float') === 'right') || convertInt(this.bounds.minWidth) >= parentWidth ? 'match_parent' : this.bounds.minWidth));
                    }
                    else {
                        this.android('layout_width', 'wrap_content', false);
                    }
                }
                else if (this.android('layout_width') == null) {
                    if (wrapContent || (renderParent.android('layout_width') === 'wrap_content')) {
                        this.android('layout_width', 'wrap_content');
                    }
                    else {
                        if (FIXED_ANDROID.includes(this.viewName) || this.floating) {
                            this.android('layout_width', 'wrap_content');
                        }
                        else {
                            if (parent.overflow === 0 /* NONE */ && width >= parentWidth) {
                                this.android('layout_width', 'match_parent');
                            }
                            else if (this.style != null) {
                                switch (this.style.display) {
                                    case 'line-item':
                                    case 'block':
                                    case 'inherit':
                                        this.android('layout_width', 'match_parent');
                                        break;
                                    default:
                                        this.android('layout_width', 'wrap_content');
                                }
                            }
                        }
                    }
                }
                if (this.android('layout_height') !== '0px') {
                    if (hasValue(styleMap.height) || hasValue(styleMap.lineHeight)) {
                        if (isPercent(styleMap.height) || isPercent(styleMap.lineHeight)) {
                            if (renderParent.tagName === 'TABLE') {
                                this.android('layout_rowWeight', (convertInt(styleMap.height || styleMap.lineHeight) / 100).toFixed(2));
                                this.android('layout_height', '0px');
                            }
                            else {
                                this.android('layout_height', 'wrap_content');
                            }
                        }
                        else {
                            this.android('layout_height', convertPX(styleMap.height || styleMap.lineHeight));
                        }
                    }
                    if (hasValue(styleMap.minHeight) && !isPercent(styleMap.minHeight) && !constraint.minHeight) {
                        this.android('layout_height', 'wrap_content', false);
                        this.android('minHeight', convertPX(styleMap.minHeight), false);
                    }
                    if (hasValue(styleMap.maxHeight) && !isPercent(styleMap.maxHeight) && !constraint.maxHeight) {
                        this.android('maxHeight', convertPX(styleMap.maxHeight), false);
                    }
                }
                if ((!this.flex.enabled || constraint.expand) && constraint.layoutHeight != null) {
                    this.android('layout_height', (constraint.layoutHeight ? this.bounds.minHeight : 'wrap_content'), constraint.layoutHeight);
                }
                else if (this.android('layout_height') == null) {
                    let layoutHeight = 'wrap_content';
                    if (height >= parentHeight) {
                        if (!wrapContent) {
                            if (parent.hasElement && parent.overflow === 0 /* NONE */ && !FIXED_ANDROID.includes(this.viewName) && (!renderParent.is(VIEW_STANDARD.RELATIVE) && renderParent.android('layout_height') !== 'wrap_content')) {
                                layoutHeight = 'match_parent';
                            }
                            else if (this.parentOriginal.flex.enabled) {
                                layoutHeight = '0px';
                            }
                        }
                    }
                    this.android('layout_height', layoutHeight);
                }
            }
            if (this.is(VIEW_STANDARD.LINEAR) && this.renderChildren.length > 0 && this.renderChildren.every(node => node.css('float') === 'right')) {
                this.android('gravity', parseRTL('right'));
            }
            if (this.gridRowSpan > 1) {
                this.android('layout_rowSpan', this.gridRowSpan.toString());
            }
            if (this.gridColumnSpan > 1) {
                this.android('layout_columnSpan', this.gridColumnSpan.toString());
            }
            if (this.gridPadding) {
                if (this.gridPadding.top > 0) {
                    this.modifyBox(BOX_STANDARD.PADDING_TOP, this.gridPadding.top);
                }
                if (this.gridPadding.right.length > 0) {
                    this.modifyBox(BOX_STANDARD.PADDING_RIGHT, averageInt(this.gridPadding.right));
                }
                if (this.gridPadding.bottom > 0) {
                    this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, this.gridPadding.bottom);
                }
                if (this.gridPadding.left.length > 0) {
                    this.modifyBox(BOX_STANDARD.PADDING_LEFT, averageInt(this.gridPadding.left));
                }
            }
            if (this.api >= exports.build.OREO) {
                ['layout_margin', 'padding'].forEach(value => {
                    const leftRtl = parseRTL(`${value}Left`);
                    const rightRtl = parseRTL(`${value}Right`);
                    const top = convertInt(this.android(`${value}Top`));
                    const right = convertInt(this.android(rightRtl));
                    const bottom = convertInt(this.android(`${value}Bottom`));
                    const left = convertInt(this.android(leftRtl));
                    if (top !== 0 && top === bottom && bottom === left && left === right) {
                        this.delete('android', `${value}*`);
                        this.android(value, formatPX(top));
                    }
                    else {
                        if (top !== 0 && top === bottom) {
                            this.delete('android', `${value}Top`, `${value}Bottom`);
                            this.android(`${value}Vertical`, formatPX(top));
                        }
                        if (left !== 0 && left === right) {
                            this.delete('android', leftRtl, rightRtl);
                            this.android(`${value}Horizontal`, formatPX(left));
                        }
                    }
                });
            }
        }
        setGravity() {
            const verticalAlign = this.styleMap.verticalAlign;
            let textAlign = '';
            let node = this;
            while (node != null) {
                textAlign = node.styleMap.textAlign || textAlign;
                const float = (node !== this ? node.styleMap.float : '');
                if (float === 'left' || float === 'right' || hasValue(textAlign)) {
                    break;
                }
                node = node.parentOriginal;
            }
            if (textAlign === '' && this.tagName === 'TH') {
                textAlign = 'center';
            }
            if (hasValue(verticalAlign) || hasValue(textAlign)) {
                let horizontal = '';
                let vertical = '';
                switch (textAlign) {
                    case 'start':
                        horizontal = 'start';
                        break;
                    case 'right':
                        horizontal = parseRTL('right');
                        break;
                    case 'end':
                        horizontal = 'end';
                        break;
                    case 'center':
                        horizontal = 'center_horizontal';
                        break;
                }
                switch (verticalAlign) {
                    case 'top':
                        vertical = 'top';
                        break;
                    case 'middle':
                        vertical = 'center_vertical';
                        break;
                    case 'bottom':
                    case 'text-bottom':
                        vertical = 'bottom';
                        break;
                    default:
                        if (this.style.height === this.style.lineHeight || convertInt(this.style.lineHeight) === (this.box.bottom - this.box.top)) {
                            vertical = 'center_vertical';
                        }
                }
                switch (this.renderParent.viewName) {
                    case VIEW_ANDROID.GRID:
                        const fillX = (horizontal === 'center_horizontal' || horizontal === 'center');
                        const fillY = (vertical === 'center_vertical' || vertical === 'middle');
                        if ((fillX && fillY) || this.renderParent.tagName === 'TABLE') {
                            this.android('layout_gravity', 'fill');
                        }
                        else {
                            if (fillX) {
                                this.android('layout_gravity', 'fill_horizontal');
                            }
                            else if (fillY) {
                                this.android('layout_gravity', 'fill_vertical');
                            }
                        }
                        break;
                }
                const gravity = [horizontal, vertical].filter(value => value !== '');
                if (gravity.length > 0) {
                    this.android('gravity', (gravity.length === 2 ? 'center' : gravity[0]));
                }
            }
        }
        setAccessibility() {
            const element = this.element;
            const nextElement = element.nextElementSibling;
            let labeled = false;
            if (nextElement && nextElement.htmlFor === element.id && element.tagName === 'INPUT') {
                const node = nextElement.__node;
                node.setViewId(VIEW_ANDROID.TEXT);
                this.css('marginRight', node.style.marginRight);
                this.css('paddingRight', node.style.paddingRight);
                this.label = node;
                node.hide();
                node.labelFor = this;
                labeled = true;
            }
            switch (this.viewName) {
                case VIEW_ANDROID.EDIT:
                    if (!labeled) {
                        let parent = this.renderParent;
                        let current = this;
                        let label = null;
                        while (parent && parent.renderChildren != null) {
                            const index = parent.renderChildren.findIndex(node => node === current);
                            if (index > 0) {
                                label = parent.renderChildren[index - 1];
                                break;
                            }
                            current = parent;
                            parent = parent.renderParent;
                        }
                        if (label && label.is(VIEW_STANDARD.TEXT)) {
                            label.android('labelFor', this.stringId);
                        }
                    }
                case VIEW_ANDROID.SELECT:
                case VIEW_ANDROID.CHECKBOX:
                case VIEW_ANDROID.RADIO:
                case VIEW_ANDROID.BUTTON:
                    this.android('focusable', 'true');
                    break;
            }
        }
        set label(value) {
            this._label = value;
            value.companion = true;
            value.labelFor = this;
        }
        get label() {
            return this._label;
        }
        get stringId() {
            return (hasValue(this.viewId) ? `@+id/${this.viewId}` : '');
        }
        set viewName(value) {
            this._viewName = value;
        }
        get viewName() {
            if (this._viewName != null) {
                return super.viewName;
            }
            else {
                const value = MAPPING_CHROME[this.tagName];
                return (value != null ? View.getViewName(value) : '');
            }
        }
        get anchored() {
            return (this.constraint.horizontal && this.constraint.vertical);
        }
        get horizontal() {
            return (this._android && this._android.orientation === 'horizontal');
        }
        get horizontalBias() {
            const parent = this.renderParent;
            if (parent && parent.visible) {
                const left = this.linear.left - parent.box.left;
                const right = parent.box.right - this.linear.right;
                return calculateBias(left, right);
            }
            return 0.5;
        }
        get verticalBias() {
            const parent = this.renderParent;
            if (parent && parent.visible) {
                const top = this.linear.top - parent.box.top;
                const bottom = parent.box.bottom - this.linear.bottom;
                return calculateBias(top, bottom);
            }
            return 0.5;
        }
    }

    class ViewGroup extends View {
        constructor(id, node, parent, children) {
            const options = {
                parent,
                depth: node.depth,
                parentOriginal: node.parentOriginal
            };
            super(id, node.api, null, options);
            if (children != null) {
                this.children = children;
            }
        }
        setViewLayout() {
            const [width, height] = this.childrenBox;
            const options = {
                parent: this.parentOriginal,
                width,
                height,
                wrapContent: this.parent.is(VIEW_STANDARD.CONSTRAINT, VIEW_STANDARD.GRID)
            };
            super.setViewLayout(options);
        }
        setBounds(calibrate = false) {
            const nodes = this.outerRegion;
            if (!calibrate) {
                this.bounds = {
                    x: nodes.left[0].bounds.x,
                    y: nodes.top[0].bounds.y,
                    top: nodes.top[0].bounds.top,
                    right: nodes.right[0].bounds.right,
                    bottom: nodes.bottom[0].bounds.bottom,
                    left: nodes.left[0].bounds.left,
                    width: 0,
                    height: 0
                };
                this.bounds.width = this.bounds.right - this.bounds.left;
                this.bounds.height = this.bounds.bottom - this.bounds.top;
            }
            this.linear = {
                top: nodes.top[0].linear.top,
                right: nodes.right[0].linear.right,
                bottom: nodes.bottom[0].linear.bottom,
                left: nodes.left[0].linear.left,
                width: 0,
                height: 0
            };
            this.box = {
                top: nodes.top[0].box.top,
                right: nodes.right[0].box.right,
                bottom: nodes.bottom[0].box.bottom,
                left: nodes.left[0].box.left,
                width: 0,
                height: 0
            };
            this.setDimensions();
        }
        inheritGrid(node) {
            for (const attr in node) {
                if (attr.startsWith('grid')) {
                    if (typeof node[attr] === 'number') {
                        this[attr] += node[attr];
                        node[attr] = 0;
                    }
                    else {
                        if (node[attr] !== false) {
                            this[attr] = node[attr];
                            node[attr] = false;
                        }
                    }
                }
            }
        }
        get childrenBox() {
            let minLeft = Number.MAX_VALUE;
            let maxRight = 0;
            let minTop = Number.MAX_VALUE;
            let maxBottom = 0;
            for (const node of this.children) {
                minLeft = Math.min(node.bounds.left, minLeft);
                maxRight = Math.max(node.bounds.right, maxRight);
                minTop = Math.min(node.bounds.top, minTop);
                maxBottom = Math.max(node.bounds.bottom, maxBottom);
            }
            return [maxRight - minLeft, maxBottom - minTop];
        }
        get outerRegion() {
            const children = this.children;
            let top = [children[0]];
            let right = [children[0]];
            let bottom = [children[0]];
            let left = [children[0]];
            for (let i = 1; i < children.length; i++) {
                const node = children[i];
                const nodeRight = node.label || node;
                if (top[0].bounds.top === node.bounds.top) {
                    top.push(node);
                }
                else if (node.bounds.top < top[0].bounds.top) {
                    top = [node];
                }
                if (right[0].bounds.right === nodeRight.bounds.right) {
                    right.push(nodeRight);
                }
                else if (nodeRight.bounds.right > right[0].bounds.right) {
                    right = [nodeRight];
                }
                if (bottom[0].bounds.bottom === node.bounds.bottom) {
                    bottom.push(node);
                }
                else if (node.bounds.bottom > bottom[0].bounds.bottom) {
                    bottom = [node];
                }
                if (left[0].bounds.left === node.bounds.left) {
                    left.push(node);
                }
                else if (node.bounds.left < left[0].bounds.left) {
                    left = [node];
                }
            }
            return { top, right, bottom, left, children };
        }
    }

    class ViewList extends NodeList {
        constructor(nodes, parent) {
            super(nodes, parent);
        }
        slice() {
            return new ViewList(this.list.slice.apply(this.list, arguments));
        }
        filter(callback) {
            return new ViewList(this.list.filter.call(this.list, callback));
        }
        get anchors() {
            return this.list.filter(node => node.anchored);
        }
        get horizontalBias() {
            if (this.parent != null && this.list.length > 0) {
                const left = this.first.linear.left - this.parent.box.left;
                const right = this.parent.box.right - this.last.linear.right;
                return calculateBias(left, right);
            }
            return 0.5;
        }
        get verticalBias() {
            if (this.parent != null && this.list.length > 0) {
                const top = this.first.linear.top - this.parent.box.top;
                const bottom = this.parent.box.bottom - this.last.linear.bottom;
                return calculateBias(top, bottom);
            }
            return 0.5;
        }
    }

    const LAYOUT_MAP = {
        relative: {
            top: 'layout_alignTop',
            bottom: 'layout_alignBottom',
            baseline: 'layout_alignBaseline',
            bottomTop: 'layout_above',
            topBottom: 'layout_below'
        },
        constraint: {
            top: 'layout_constraintTop_toTopOf',
            bottom: 'layout_constraintBottom_toBottomOf',
            baseline: 'layout_constraintBaseline_toBaselineOf',
            bottomTop: 'layout_constraintBottom_toTopOf',
            topBottom: 'layout_constraintTop_toBottomOf'
        }
    };
    const CHAIN_MAP = {
        direction: ['horizontalChain', 'verticalChain'],
        leftTop: ['left', 'top'],
        rightBottom: ['right', 'bottom'],
        rightLeftBottomTop: ['rightLeft', 'bottomTop'],
        leftRightTopBottom: ['leftRight', 'topBottom'],
        widthHeight: ['Width', 'Height'],
        horizontalVertical: ['Horizontal', 'Vertical']
    };
    class ViewController extends Controller {
        constructor() {
            super();
        }
        setConstraints() {
            Object.assign(LAYOUT_MAP.relative, {
                left: parseRTL('layout_alignLeft'),
                right: parseRTL('layout_alignRight'),
                leftRight: parseRTL('layout_toRightOf'),
                rightLeft: parseRTL('layout_toLeftOf')
            });
            Object.assign(LAYOUT_MAP.constraint, {
                left: parseRTL('layout_constraintLeft_toLeftOf'),
                right: parseRTL('layout_constraintRight_toRightOf'),
                leftRight: parseRTL('layout_constraintLeft_toRightOf'),
                rightLeft: parseRTL('layout_constraintRight_toLeftOf')
            });
            this.cache.visible.forEach(node => {
                const nodes = new ViewList(node.renderChildren, node);
                const constraint = node.is(VIEW_STANDARD.CONSTRAINT);
                const relative = node.is(VIEW_STANDARD.RELATIVE);
                const flex = node.flex;
                if (nodes.list.length > 0 && (constraint || relative || flex.enabled)) {
                    node.expandDimensions();
                    if (node.is(VIEW_STANDARD.LINEAR)) {
                        if (node.renderChildren.some(item => item.flex.direction.indexOf('row') !== -1)) {
                            node.constraint.layoutWidth = true;
                            node.constraint.expand = true;
                        }
                        if (node.renderChildren.some(item => item.flex.direction.indexOf('column') !== -1)) {
                            node.constraint.layoutHeight = true;
                            node.constraint.expand = true;
                        }
                        return;
                    }
                    const LAYOUT = LAYOUT_MAP[(relative ? 'relative' : 'constraint')];
                    const linearX = nodes.linearX;
                    nodes.list.forEach(current => {
                        if (withinRange(current.horizontalBias, 0.5, 0.01) && withinRange(current.verticalBias, 0.5, 0.01)) {
                            if (constraint) {
                                this.setAlignParent(current);
                            }
                            else {
                                current.android('layout_centerInParent', 'true');
                                current.constraint.horizontal = true;
                                current.constraint.vertical = true;
                            }
                            node.constraint.layoutWidth = true;
                            node.constraint.layoutHeight = true;
                        }
                    });
                    nodes.list.unshift(node);
                    nodes.list.forEach(current => {
                        nodes.list.forEach((adjacent) => {
                            if (current === adjacent) {
                                return;
                            }
                            else if (constraint) {
                                let linear1 = current.linear;
                                let linear2 = adjacent.linear;
                                let parent = false;
                                if (current === node || adjacent === node) {
                                    if (current === node) {
                                        current = adjacent;
                                    }
                                    adjacent = { stringId: 'parent' };
                                    linear1 = current.linear;
                                    linear2 = node.box;
                                    parent = true;
                                }
                                if (current.css('width') != null && current.styleMap.marginTop === '0px' && current.styleMap.marginRight === 'auto' && current.styleMap.marginBottom === '0px' && current.styleMap.marginLeft === 'auto') {
                                    this.setAlignParent(current, 'horizontal');
                                }
                                else {
                                    if (parent) {
                                        if (linear1.left === linear2.left) {
                                            current.anchor(LAYOUT['left'], adjacent, 'horizontal');
                                        }
                                        if (withinRange(linear1.right, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                            current.anchor(LAYOUT['right'], adjacent, 'horizontal');
                                        }
                                    }
                                    else {
                                        if (current.viewWidth === 0 && linear1.left === linear2.left && linear1.right === linear2.right) {
                                            current.anchor(LAYOUT['left'], adjacent);
                                            current.anchor(LAYOUT['right'], adjacent);
                                        }
                                        else if (!SETTINGS.horizontalPerspective) {
                                            if (linear1.left === linear2.left) {
                                                current.anchor(LAYOUT['left'], adjacent);
                                            }
                                            else if (linear1.right === linear2.right) {
                                                current.anchor(LAYOUT['right'], adjacent);
                                            }
                                        }
                                        if (withinRange(linear1.left, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                            if (current.css('float') !== 'right') {
                                                current.anchor(LAYOUT['leftRight'], adjacent, '', current.withinX(linear2));
                                            }
                                            else {
                                                current.constraint.marginHorizontal = adjacent.stringId;
                                            }
                                        }
                                        if (withinRange(linear1.right, linear2.left, SETTINGS.whitespaceHorizontalOffset)) {
                                            if (current.css('float') !== 'left') {
                                                current.anchor(LAYOUT['rightLeft'], adjacent, '', current.withinX(linear2));
                                            }
                                        }
                                    }
                                }
                                if (parent) {
                                    if (linear1.top === linear2.top) {
                                        current.anchor(LAYOUT['top'], adjacent, 'vertical');
                                    }
                                    if (withinRange(linear1.bottom, linear2.bottom, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['bottom'], adjacent, 'vertical');
                                    }
                                }
                                else {
                                    if (withinRange(linear1.top, linear2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                        if ((current.app(LAYOUT['bottom']) !== 'parent' || !current.floating) && (current.withinY(linear2) || !current.constraint.vertical)) {
                                            current.anchor(LAYOUT['topBottom'], adjacent, (adjacent.constraint.vertical ? 'vertical' : ''), (linear1.left === linear2.left || linear2.right === linear2.right));
                                        }
                                    }
                                    else if (current.viewHeight === 0 && linear1.top === linear2.top && linear1.bottom === linear2.bottom) {
                                        if (!current.floating || !current.constraint.vertical) {
                                            const baseline = (current.is(VIEW_STANDARD.TEXT) && current.style.verticalAlign === 'baseline' && adjacent.is(VIEW_STANDARD.TEXT) && adjacent.style.verticalAlign === 'baseline');
                                            if (current.app(LAYOUT['top']) !== 'parent') {
                                                current.anchor(LAYOUT[(baseline ? 'baseline' : 'top')], adjacent);
                                            }
                                            current.anchor(LAYOUT['bottom'], adjacent);
                                        }
                                    }
                                }
                            }
                            else if (relative) {
                                if (current === node) {
                                    return;
                                }
                                else if (adjacent === node) {
                                    adjacent = { stringId: 'true' };
                                    if (current.linear.left === node.box.left) {
                                        current.anchor(parseRTL('layout_alignParentLeft'), adjacent, 'horizontal');
                                    }
                                    if (current.linear.right === node.box.right) {
                                        current.anchor(parseRTL('layout_alignParentRight'), adjacent, 'horizontal');
                                    }
                                    if (current.linear.top === node.box.top) {
                                        current.anchor('layout_alignParentTop', adjacent, 'vertical');
                                    }
                                    if (withinRange(current.linear.bottom, node.box.bottom, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor('layout_alignParentBottom', adjacent, 'vertical');
                                    }
                                }
                                else {
                                    const linear1 = current.linear;
                                    const linear2 = adjacent.linear;
                                    if (current.css('width') != null && current.styleMap.marginTop === '0px' && current.styleMap.marginRight === 'auto' && current.styleMap.marginBottom === '0px' && current.styleMap.marginLeft === 'auto') {
                                        current.android('layout_centerHorizontal', 'true');
                                        current.constraint.horizontal = true;
                                    }
                                    else {
                                        if ((linear1.top === linear2.top || linear1.bottom === linear2.bottom) && withinRange(linear1.left, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                            if (current.css('float') === 'right') {
                                                adjacent.anchor(LAYOUT['rightLeft'], current, (current.constraint.horizontal ? 'horizontal' : ''));
                                            }
                                            else {
                                                current.anchor(LAYOUT['leftRight'], adjacent, (adjacent.constraint.horizontal ? 'horizontal' : ''));
                                                if (adjacent.constraint.horizontal) {
                                                    current.delete('android', parseRTL('layout_alignParentRight'));
                                                }
                                            }
                                        }
                                    }
                                    if (adjacent.constraint.vertical && withinRange(linear1.top, linear2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                        current.anchor(LAYOUT['topBottom'], adjacent, (adjacent.constraint.vertical ? 'vertical' : ''));
                                        if (adjacent.constraint.vertical) {
                                            current.delete('android', 'layout_alignParentBottom');
                                        }
                                    }
                                    if (adjacent.constraint.horizontal) {
                                        if (linear1.bottom === linear2.bottom) {
                                            if (!linearX && (!current.floating || !current.constraint.vertical)) {
                                                current.anchor(LAYOUT['bottom'], adjacent, (adjacent.constraint.vertical ? 'vertical' : ''));
                                                if (adjacent.constraint.vertical) {
                                                    current.delete('android', 'layout_alignParentBottom');
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    });
                    nodes.list.shift();
                    nodes.list.forEach(current => {
                        const leftRight = current.anchor(LAYOUT['leftRight']);
                        if (leftRight != null) {
                            current.constraint.horizontal = true;
                            current.constraint.marginHorizontal = leftRight;
                        }
                        const topBottom = current.anchor(LAYOUT['topBottom']);
                        if (topBottom != null) {
                            current.constraint.vertical = true;
                            current.constraint.marginVertical = topBottom;
                        }
                        if (constraint) {
                            const position = [];
                            if (current.constraint.horizontal) {
                                if (current.anchor(LAYOUT['left']) !== 'parent') {
                                    position.push(LAYOUT['left']);
                                }
                                if (current.anchor(LAYOUT['right']) !== 'parent') {
                                    position.push(LAYOUT['right']);
                                }
                            }
                            if (current.constraint.vertical) {
                                if (current.anchor(LAYOUT['top']) !== 'parent') {
                                    position.push(LAYOUT['top']);
                                }
                                if (current.anchor(LAYOUT['bottom']) !== 'parent') {
                                    position.push(LAYOUT['bottom']);
                                }
                            }
                            current.delete((relative ? 'android' : 'app'), ...position);
                        }
                    });
                    if (flex.enabled || (constraint && SETTINGS.useConstraintChain && !nodes.intersect()) && !nodes.list.some(item => item.floating)) {
                        let flexNodes = null;
                        if (flex.enabled) {
                            const directionNodes = nodes.list.slice();
                            if (flex.direction.indexOf('column') !== -1 && directionNodes.every(item => directionNodes[0].linear.left === item.linear.left || directionNodes[0].linear.right === item.linear.right)) {
                                if (flex.direction === 'column-reverse') {
                                    directionNodes.reverse();
                                }
                                flexNodes = [{ constraint: { horizontalChain: null, verticalChain: new ViewList(directionNodes, node) } }];
                            }
                            else {
                                switch (flex.direction) {
                                    case 'row-reverse':
                                    case 'column-reverse':
                                        directionNodes.reverse();
                                }
                                const map = {};
                                const levels = [];
                                directionNodes.forEach(item => {
                                    const y = item.linear.top;
                                    if (map[y] == null) {
                                        map[y] = [];
                                        levels.push(y);
                                    }
                                    map[y].push(item);
                                });
                                if (flex.wrap === 'wrap-reverse') {
                                    if (flex.direction.indexOf('column') !== -1) {
                                        for (const y in map) {
                                            map[y].reverse();
                                        }
                                    }
                                    else {
                                        levels.reverse();
                                    }
                                }
                                flexNodes = [];
                                for (const n of levels) {
                                    flexNodes.push({ constraint: { horizontalChain: new ViewList(map[n], node), verticalChain: null } });
                                }
                            }
                        }
                        else {
                            nodes.list.forEach(current => {
                                let horizontalChain = nodes.filter((item) => same(current, item, 'linear.top'));
                                if (horizontalChain.list.length === 0) {
                                    horizontalChain = nodes.filter((item) => same(current, item, 'linear.bottom'));
                                }
                                if (horizontalChain.list.length > 0) {
                                    horizontalChain.sortAsc('linear.x');
                                }
                                let verticalChain = nodes.filter((item) => same(current, item, 'linear.left'));
                                if (verticalChain.list.length === 0) {
                                    verticalChain = nodes.filter((item) => same(current, item, 'linear.right'));
                                }
                                if (verticalChain.list.length > 0) {
                                    verticalChain.sortAsc('linear.y');
                                }
                                current.constraint.horizontalChain = horizontalChain;
                                current.constraint.verticalChain = verticalChain;
                            });
                        }
                        const direction = CHAIN_MAP.direction.slice();
                        if (!SETTINGS.horizontalPerspective) {
                            direction.reverse();
                        }
                        direction.forEach((value, index) => {
                            if (!SETTINGS.horizontalPerspective) {
                                index = (index === 0 ? 1 : 0);
                            }
                            const inverse = (index === 0 ? 1 : 0);
                            const chainNodes = flexNodes || nodes.slice().list.sort((a, b) => (a.constraint[value].length >= b.constraint[value].length ? -1 : 1));
                            chainNodes.forEach((current, level) => {
                                const chainDirection = current.constraint[value];
                                if (chainDirection != null) {
                                    if (chainDirection.length > 1 && (flex.enabled || chainDirection.list.map(item => parseInt((item.constraint[value].list || [{ id: 0 }]).map((result) => result.id).join(''))).reduce((a, b) => (a === b ? a : 0)) > 0)) {
                                        chainDirection.parent = node;
                                        if (flex.enabled && chainDirection.list.some(item => item.flex.order > 0)) {
                                            chainDirection[(flex.direction.indexOf('reverse') !== -1 ? 'sortDesc' : 'sortAsc')]('flex.order');
                                        }
                                        const [HV, VH] = [CHAIN_MAP['horizontalVertical'][index], CHAIN_MAP['horizontalVertical'][inverse]];
                                        const [LT, TL] = [CHAIN_MAP['leftTop'][index], CHAIN_MAP['leftTop'][inverse]];
                                        const [RB, BR] = [CHAIN_MAP['rightBottom'][index], CHAIN_MAP['rightBottom'][inverse]];
                                        const [WH, HW] = [CHAIN_MAP['widthHeight'][index], CHAIN_MAP['widthHeight'][inverse]];
                                        const orientation = HV.toLowerCase();
                                        const orientationInverse = VH.toLowerCase();
                                        const dimension = WH.toLowerCase();
                                        const firstNode = chainDirection.first;
                                        const lastNode = chainDirection.last;
                                        let maxOffset = -1;
                                        for (let i = 0; i < chainDirection.list.length; i++) {
                                            const chain = chainDirection.list[i];
                                            const next = chainDirection.list[i + 1];
                                            const previous = chainDirection.list[i - 1];
                                            if (flex.enabled) {
                                                if (chain.linear[TL] === node.box[TL] && chain.linear[BR] === node.box[BR]) {
                                                    this.setAlignParent(chain, orientationInverse);
                                                }
                                                const nextLevel = chainNodes[level + 1];
                                                if (nextLevel != null && nextLevel.constraint[value] != null && nextLevel.constraint[value].list[i] != null) {
                                                    const nextChain = nextLevel.constraint[value].list[i];
                                                    if (chain.withinY(nextChain.linear)) {
                                                        chain.app(LAYOUT['bottomTop'], nextChain.stringId);
                                                    }
                                                }
                                            }
                                            if (next != null) {
                                                chain.app(LAYOUT[CHAIN_MAP['rightLeftBottomTop'][index]], next.stringId);
                                                maxOffset = Math.max(next.linear[LT] - chain.linear[RB], maxOffset);
                                            }
                                            if (previous != null) {
                                                chain.app(LAYOUT[CHAIN_MAP['leftRightTopBottom'][index]], previous.stringId);
                                                chain.constraint[`margin${HV}`] = previous.stringId;
                                            }
                                            if (chain.styleMap[dimension] == null) {
                                                const minW = chain.styleMap[`min${WH}`];
                                                const minH = chain.styleMap[`min${HW}`];
                                                const maxW = chain.styleMap[`max${WH}`];
                                                const maxH = chain.styleMap[`max${HW}`];
                                                if (hasValue(minW)) {
                                                    chain.app(`layout_constraint${WH}_min`, convertPX(minW));
                                                    chain.constraint[`min${WH}`] = true;
                                                }
                                                if (hasValue(maxW)) {
                                                    chain.app(`layout_constraint${WH}_max`, convertPX(maxW));
                                                    chain.constraint[`max${WH}`] = true;
                                                }
                                                if (hasValue(minH)) {
                                                    chain.app(`layout_constraint${HW}_min`, convertPX(minH));
                                                    chain.constraint[`min${HW}`] = true;
                                                }
                                                if (hasValue(maxH)) {
                                                    chain.app(`layout_constraint${HW}_max`, convertPX(maxH));
                                                    chain.constraint[`max${HW}`] = true;
                                                }
                                            }
                                            if (flex.enabled) {
                                                const map = LAYOUT_MAP.constraint;
                                                chain.app(`layout_constraint${HV}_weight`, chain.flex.grow.toString());
                                                if (chain[`view${WH}`] == null && chain.flex.grow === 0 && chain.flex.shrink <= 1) {
                                                    chain.android(`layout_${dimension}`, 'wrap_content');
                                                }
                                                else if (chain.flex.grow > 0) {
                                                    chain.android(`layout_${dimension}`, (node.renderParent.is(VIEW_STANDARD.LINEAR) && node.renderParent.constraint.expand && node.flex.direction.indexOf('row') !== -1 ? 'wrap_content' : '0px'));
                                                }
                                                if (chain.flex.shrink === 0) {
                                                    chain.app(`layout_constrained${WH}`, 'true');
                                                }
                                                switch (chain.flex.alignSelf) {
                                                    case 'flex-start':
                                                        chain.app(map[TL], 'parent');
                                                        chain.constraint[orientationInverse] = true;
                                                        break;
                                                    case 'flex-end':
                                                        chain.app(map[BR], 'parent');
                                                        chain.constraint[orientationInverse] = true;
                                                        break;
                                                    case 'baseline':
                                                        chain.app(map['baseline'], 'parent');
                                                        chain.constraint.vertical = true;
                                                        break;
                                                    case 'center':
                                                    case 'stretch':
                                                        if (chain.flex.alignSelf === 'center') {
                                                            chain.app(`layout_constraint${VH}_bias`, '0.5');
                                                        }
                                                        else {
                                                            chain.android(`layout_${HW.toLowerCase()}`, '0px');
                                                        }
                                                        this.setAlignParent(chain, orientationInverse);
                                                        break;
                                                }
                                                if (chain.flex.basis !== 'auto') {
                                                    if (/(100|[1-9][0-9]?)%/.test(chain.flex.basis)) {
                                                        chain.app(`layout_constraint${WH}_percent`, chain.flex.basis);
                                                    }
                                                    else {
                                                        const width = convertPX(chain.flex.basis);
                                                        if (width !== '0px') {
                                                            chain.app(`layout_constraintWidth_min`, width);
                                                            delete chain.styleMap.minWidth;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        firstNode.app(LAYOUT[LT], 'parent');
                                        firstNode.constraint[orientation] = true;
                                        lastNode.app(LAYOUT[RB], 'parent');
                                        lastNode.constraint[orientation] = true;
                                        const chainStyle = `layout_constraint${HV}_chainStyle`;
                                        if (flex.enabled && flex.justifyContent !== 'normal' && Math.max.apply(null, chainDirection.list.map(item => item.flex.grow)) === 0) {
                                            switch (flex.justifyContent) {
                                                case 'space-between':
                                                    firstNode.app(chainStyle, 'spread_inside');
                                                    break;
                                                case 'space-evenly':
                                                    firstNode.app(chainStyle, 'spread');
                                                    chainDirection.list.forEach(item => item.app(`layout_constraint${HV}_weight`, (item.flex.grow || 1).toString()));
                                                    break;
                                                case 'space-around':
                                                    const leftTop = (index === 0 ? 'left' : 'top');
                                                    const percent = (firstNode.bounds[leftTop] - node.box[leftTop]) / node.box[dimension];
                                                    firstNode.app(`layout_constraint${HV}_chainStyle`, 'spread_inside');
                                                    this.createGuideline(node, firstNode, orientation, false, parseFloat(percent.toFixed(2)));
                                                    this.createGuideline(node, lastNode, orientation, true, parseFloat((1 - percent).toFixed(2)));
                                                    break;
                                                default:
                                                    let justifyContent = flex.justifyContent;
                                                    if (flex.direction.indexOf('reverse') !== -1) {
                                                        switch (flex.justifyContent) {
                                                            case 'flex-start':
                                                                justifyContent = 'flex-end';
                                                                break;
                                                            case 'flex-end':
                                                                justifyContent = 'flex-start';
                                                                break;
                                                        }
                                                    }
                                                    let bias = '0.5';
                                                    switch (justifyContent) {
                                                        case 'flex-start':
                                                            bias = '0';
                                                            break;
                                                        case 'flex-end':
                                                            bias = '1';
                                                            break;
                                                    }
                                                    firstNode.app(chainStyle, 'packed');
                                                    firstNode.app(`layout_constraint${HV}_bias`, bias);
                                            }
                                        }
                                        else {
                                            if (flex.enabled && withinFraction(node.box.left, firstNode.linear.left) && withinFraction(lastNode.linear.right, node.box.right)) {
                                                firstNode.app(chainStyle, 'spread_inside');
                                            }
                                            else if (maxOffset <= SETTINGS[`chainPacked${HV}Offset`] || firstNode.linear.left === node.box.left || lastNode.linear.right === node.box.right) {
                                                firstNode.app(chainStyle, 'packed');
                                                let bias = '';
                                                if (firstNode.linear.left === node.box.left) {
                                                    bias = '0';
                                                }
                                                else if (lastNode.linear.right === node.box.right) {
                                                    bias = '1';
                                                }
                                                else {
                                                    bias = firstNode[`${orientation}Bias`];
                                                }
                                                firstNode.app(`layout_constraint${HV}_bias`, bias);
                                                this.adjustMargins(chainDirection.list);
                                            }
                                            else {
                                                firstNode.app(chainStyle, 'spread');
                                            }
                                            if (!flex.enabled) {
                                                chainDirection.list.forEach(item => {
                                                    item.constraint.horizontalChain = [];
                                                    item.constraint.verticalChain = [];
                                                });
                                            }
                                        }
                                    }
                                    else if (chainDirection.length > 0) {
                                        const firstNode = chainDirection.first;
                                        if (firstNode.app(LAYOUT['left']) === 'parent') {
                                            firstNode.delete('app', LAYOUT['rightLeft']);
                                        }
                                        if (firstNode.app(LAYOUT['right']) === 'parent') {
                                            firstNode.delete('app', LAYOUT['leftRight']);
                                        }
                                    }
                                }
                            });
                        });
                    }
                    if (!flex.enabled) {
                        const anchors = nodes.anchors;
                        if (constraint) {
                            if (anchors.length === 0) {
                                const unbound = nodes.sortAsc('bounds.x', 'bounds.y')[0];
                                if (SETTINGS.useConstraintGuideline) {
                                    this.createGuideline(node, unbound);
                                }
                                else {
                                    this.setAlignParent(unbound, '', true);
                                }
                                anchors.push(unbound);
                            }
                        }
                        do {
                            let restart = false;
                            nodes.list.forEach(current => {
                                if (!current.anchored) {
                                    const result = (constraint ? search(current.app(), '*constraint*') : search(current.android(), LAYOUT));
                                    for (const [key, value] of result) {
                                        if (value !== 'parent') {
                                            if (anchors.find(item => item.stringId === value) != null) {
                                                if (!current.constraint.horizontal && indexOf(key, parseRTL('Left'), parseRTL('Right')) !== -1) {
                                                    current.constraint.horizontal = true;
                                                }
                                                if (!current.constraint.vertical && indexOf(key, 'Top', 'Bottom', 'Baseline', 'above', 'below') !== -1) {
                                                    current.constraint.vertical = true;
                                                }
                                            }
                                        }
                                    }
                                    if (current.anchored) {
                                        anchors.push(current);
                                        restart = true;
                                    }
                                }
                            });
                            if (!restart) {
                                break;
                            }
                        } while (true);
                        if (constraint) {
                            nodes.list.forEach(opposite => {
                                if (!opposite.anchored) {
                                    this.deleteConstraints(node);
                                    if (SETTINGS.useConstraintGuideline) {
                                        this.createGuideline(node, opposite);
                                    }
                                    else {
                                        const adjacent = nodes.anchors[0];
                                        const center1 = opposite.center;
                                        const center2 = adjacent.center;
                                        const x = Math.abs(center1.x - center2.x);
                                        const y = Math.abs(center1.y - center2.y);
                                        let degrees = Math.round(Math.atan(Math.min(x, y) / Math.max(x, y)) * (180 / Math.PI));
                                        const radius = Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
                                        if (center1.y > center2.y) {
                                            if (center1.x > center2.x) {
                                                if (x > y) {
                                                    degrees += 90;
                                                }
                                                else {
                                                    degrees = 180 - degrees;
                                                }
                                            }
                                            else {
                                                if (x > y) {
                                                    degrees = 270 - degrees;
                                                }
                                                else {
                                                    degrees += 180;
                                                }
                                            }
                                        }
                                        else if (center1.y < center2.y) {
                                            if (center2.x > center1.x) {
                                                if (x > y) {
                                                    degrees += 270;
                                                }
                                                else {
                                                    degrees = 360 - degrees;
                                                }
                                            }
                                            else {
                                                if (x > y) {
                                                    degrees = 90 - degrees;
                                                }
                                            }
                                        }
                                        else {
                                            degrees = (center1.x > center2.x ? 90 : 270);
                                        }
                                        opposite.app('layout_constraintCircle', adjacent.stringId);
                                        opposite.app('layout_constraintCircleRadius', formatPX(radius));
                                        opposite.app('layout_constraintCircleAngle', degrees.toString());
                                        opposite.constraint.horizontal = true;
                                        opposite.constraint.vertical = true;
                                    }
                                }
                            });
                            nodes.list.forEach(current => {
                                if (current.app(LAYOUT['right']) === 'parent' && current.app(LAYOUT['leftRight']) == null) {
                                    node.constraint.layoutWidth = true;
                                }
                                if (current.app(LAYOUT['bottom']) === 'parent' && current.app(LAYOUT['topBottom']) == null) {
                                    node.constraint.layoutHeight = true;
                                }
                            });
                        }
                        else {
                            nodes.list.forEach(current => {
                                const parentRight = current.android(parseRTL('layout_alignParentRight'));
                                const parentBottom = current.android('layout_alignParentBottom');
                                if (!anchors.includes(current)) {
                                    const parentLeft = parseRTL('layout_alignParentLeft');
                                    current.delete('android', LAYOUT);
                                    if (current.android(parentLeft) !== 'true') {
                                        const left = formatPX(current.bounds.left - node.box.left);
                                        current.css(parseRTL('marginLeft'), left);
                                        current.android(parentLeft, 'true');
                                        current.android(parseRTL('layout_marginLeft'), left);
                                    }
                                    if (parentBottom !== 'true') {
                                        const top = formatPX(current.bounds.top - node.box.top);
                                        current.css('marginTop', top);
                                        current.android('layout_alignParentTop', 'true');
                                        current.android('layout_marginTop', top);
                                    }
                                    current.constraint.horizontal = true;
                                    current.constraint.vertical = true;
                                }
                                else {
                                    this.adjustMargins([current]);
                                }
                                if (parentRight === 'true' && current.android(LAYOUT['leftRight']) == null) {
                                    node.constraint.layoutWidth = true;
                                }
                                if (parentBottom === 'true' && current.android(LAYOUT['topBottom']) == null) {
                                    node.constraint.layoutHeight = true;
                                }
                            });
                        }
                    }
                }
            });
        }
        setMarginPadding() {
            this.cache.list.forEach(node => {
                if (node.is(VIEW_STANDARD.LINEAR, VIEW_STANDARD.RADIO_GROUP)) {
                    switch (node.android('orientation')) {
                        case 'horizontal':
                            let left = node.box.left;
                            sortAsc(node.renderChildren, 'linear.left').forEach(item => {
                                if (!item.floating) {
                                    const width = Math.ceil(item.linear.left - left);
                                    if (width >= 1) {
                                        item.modifyBox(BOX_STANDARD.MARGIN_LEFT, width);
                                    }
                                }
                                left = (item.label || item).linear.right;
                            });
                            break;
                        case 'vertical':
                            let top = node.box.top;
                            sortAsc(node.renderChildren, 'linear.top').forEach(item => {
                                const height = Math.ceil(item.linear.top - top);
                                if (height >= 1) {
                                    item.modifyBox(BOX_STANDARD.MARGIN_TOP, height);
                                }
                                top = item.linear.bottom;
                            });
                            break;
                    }
                }
            });
        }
        renderGroup(node, parent, viewName, options = {}) {
            let preXml = '';
            let postXml = '';
            let renderParent = parent;
            node.setViewId(View.getViewName(viewName));
            if (node.overflow !== 0 /* NONE */) {
                const scrollView = [];
                if (node.overflowX) {
                    scrollView.push(VIEW_ANDROID.SCROLL_HORIZONTAL);
                }
                if (node.overflowY) {
                    scrollView.push((node.ascend().some(item => item.overflow !== 0 /* NONE */) ? VIEW_ANDROID.SCROLL_NESTED : VIEW_ANDROID.SCROLL_VERTICAL));
                }
                let current = node;
                let scrollDepth = parent.renderDepth + scrollView.length;
                scrollView
                    .map(scrollName => {
                    const viewGroup = new ViewGroup(this.cache.nextId, current, null, [current]);
                    const view = viewGroup;
                    viewGroup.setViewId(scrollName);
                    viewGroup.setBounds();
                    viewGroup.inheritGrid(current);
                    viewGroup.android('fadeScrollbars', 'false');
                    this.cache.list.push(view);
                    switch (scrollName) {
                        case VIEW_ANDROID.SCROLL_HORIZONTAL:
                            viewGroup.css('width', node.styleMap.width);
                            viewGroup.css('minWidth', node.styleMap.minWidth);
                            viewGroup.css('overflowX', node.styleMap.overflowX);
                            break;
                        default:
                            viewGroup.css('height', node.styleMap.height);
                            viewGroup.css('minHeight', node.styleMap.minHeight);
                            viewGroup.css('overflowY', node.styleMap.overflowY);
                    }
                    const indent = padLeft(scrollDepth--);
                    preXml = indent + `<${scrollName}{@${viewGroup.id}}>\n` + preXml;
                    postXml += indent + `</${scrollName}>\n`;
                    if (current === node) {
                        node.parent = view;
                        renderParent = view;
                    }
                    current = view;
                    return viewGroup;
                })
                    .reverse()
                    .forEach((item, index) => {
                    switch (index) {
                        case 0:
                            item.parent = parent;
                            item.render(parent);
                            break;
                        case 1:
                            item.parent = current;
                            item.render(current);
                            break;
                    }
                    current = item;
                });
            }
            node.apply(options);
            node.applyCustomizations();
            node.render(renderParent);
            node.setGravity();
            this.setGridSpace(node);
            return this.getEnclosingTag(node.renderDepth, View.getViewName(viewName), node.id, `{:${node.id}}`, preXml, postXml);
        }
        renderView(node, parent, viewName, recursive = false) {
            const element = node.element;
            if (typeof viewName === 'number') {
                viewName = View.getViewName(viewName);
            }
            node.setViewId(viewName);
            switch (element.tagName) {
                case 'IMG':
                    switch (element.style.objectFit) {
                        case 'contain':
                            node.android('scaleType', 'centerInside');
                            break;
                        case 'cover':
                            node.android('scaleType', 'centerCrop');
                            break;
                        case 'fill':
                            node.android('scaleType', 'fitXY');
                            break;
                        case 'scale-down':
                            node.android('scaleType', 'fitCenter');
                            break;
                    }
                    break;
                case 'TEXTAREA':
                    node.android('minLines', '2');
                    if (element.rows > 2) {
                        node.android('maxLines', element.rows.toString());
                    }
                    if (element.maxLength > 0) {
                        node.android('maxLength', element.maxLength.toString());
                    }
                    node.android('hint', element.placeholder);
                    node.android('scrollbars', 'vertical');
                    node.android('inputType', 'textMultiLine');
                    if (node.overflowX) {
                        node.android('scrollHorizontally', 'true');
                    }
                    break;
                case 'INPUT':
                    switch (element.type) {
                        case 'radio':
                            if (!recursive) {
                                const result = node.parentOriginal.children.filter(item => (item.element.type === 'radio' && item.element.name === element.name));
                                let xml = '';
                                if (result.length > 1) {
                                    const viewGroup = new ViewGroup(this.cache.nextId, node, parent, result);
                                    const view = viewGroup;
                                    let checked = '';
                                    this.cache.list.push(view);
                                    viewGroup.setViewId(VIEW_ANDROID.RADIO_GROUP);
                                    viewGroup.render(parent);
                                    result.forEach(item => {
                                        viewGroup.inheritGrid(item);
                                        if (item.element.checked) {
                                            checked = item.stringId;
                                        }
                                        item.parent = viewGroup;
                                        item.render(viewGroup);
                                        xml += this.renderView(item, view, VIEW_STANDARD.RADIO, true);
                                    });
                                    viewGroup.android('orientation', NodeList.linearX(viewGroup.children) ? 'horizontal' : 'vertical');
                                    if (checked !== '') {
                                        viewGroup.android('checkedButton', checked);
                                    }
                                    viewGroup.setBounds();
                                    this.setGridSpace(view);
                                    return this.getEnclosingTag(viewGroup.renderDepth, VIEW_ANDROID.RADIO_GROUP, viewGroup.id, xml);
                                }
                            }
                            break;
                        case 'password':
                            node.android('inputType', 'textPassword');
                            break;
                        case 'text':
                            node.android('inputType', 'text');
                            break;
                        case 'range':
                            if (hasValue(element.min)) {
                                node.android('min', element.min);
                            }
                            if (hasValue(element.max)) {
                                node.android('max', element.max);
                            }
                            if (hasValue(element.value)) {
                                node.android('progess', element.value);
                            }
                            break;
                    }
                    break;
            }
            switch (node.viewName) {
                case VIEW_ANDROID.TEXT:
                    if (node.overflow !== 0 /* NONE */) {
                        const scrollbars = [];
                        if (node.overflowX) {
                            scrollbars.push('horizontal');
                        }
                        if (node.overflowY) {
                            scrollbars.push('vertical');
                        }
                        node.android('scrollbars', scrollbars.join('|'));
                    }
                    break;
            }
            node.applyCustomizations();
            node.render(parent);
            node.setGravity();
            node.setAccessibility();
            node.cascade().forEach(item => item.hide());
            this.setGridSpace(node);
            return this.getEnclosingTag(node.renderDepth, node.viewName, node.id);
        }
        createGroup(node, parent, children) {
            const viewGroup = new ViewGroup(this.cache.nextId, node, parent, children);
            children.forEach(item => {
                item.parent = viewGroup;
                viewGroup.inheritGrid(item);
            });
            viewGroup.setBounds();
            return viewGroup;
        }
        getViewStatic(tagName, depth, options = {}, width = 'wrap_content', height = 'wrap_content', id = 0, children = false) {
            const node = new View(id, SETTINGS.targetAPI);
            let viewName = '';
            if (typeof tagName === 'number') {
                node.setViewId(View.getViewName(tagName));
                viewName = node.viewName;
            }
            else {
                viewName = tagName;
            }
            let attributes = '';
            if (SETTINGS.showAttributes) {
                node.apply(options);
                for (const obj in options) {
                    this.namespaces.add(obj);
                }
                if (hasValue(width)) {
                    node.android('layout_width', width);
                }
                if (hasValue(height)) {
                    node.android('layout_height', height);
                }
                const indent = padLeft(depth + 1);
                attributes = node.combine().map(value => `\n${indent + value}`).join('');
            }
            let output = this.getEnclosingTag(depth, viewName, id, (children ? `{:${id}}` : ''));
            output = output.replace(`{#${id}}`, attributes);
            return [output, node.stringId];
        }
        replaceInlineAttributes(output, node, options) {
            node.setViewLayout();
            node.namespaces.forEach((value) => options[value] = true);
            return output.replace(`{@${node.id}}`, this.parseAttributes(node));
        }
        getRootAttributes(options) {
            for (const obj in options) {
                this.namespaces.add(obj);
            }
            return Array.from(this.namespaces).sort().map(value => (XMLNS_ANDROID[value.toUpperCase()] != null ? `\n\t${XMLNS_ANDROID[value.toUpperCase()]}` : '')).join('');
        }
        getViewName(value) {
            return View.getViewName(value);
        }
        parseAttributes(node) {
            let output = '';
            const attributes = node.combine();
            const indent = padLeft(node.renderDepth + 1);
            output = (node.renderDepth === 0 ? '{@0}' : '') + attributes.map((value) => `\n${indent + value}`).join('');
            return output;
        }
        setGridSpace(node) {
            if (node.parent.is(VIEW_STANDARD.GRID)) {
                const dimensions = getBoxSpacing(node.parentOriginal.element, true);
                const options = {
                    android: {
                        layout_columnSpan: node.renderParent.gridColumnCount
                    }
                };
                if (node.gridFirst) {
                    const heightTop = dimensions.paddingTop + dimensions.marginTop;
                    if (heightTop > 0) {
                        node.parent.gridPadding.top = heightTop;
                    }
                }
                if (node.gridRowStart) {
                    const marginLeft = dimensions.marginLeft + dimensions.paddingLeft;
                    if (marginLeft > 0) {
                        node.parent.gridPadding.left.push(marginLeft);
                    }
                }
                if (node.gridRowEnd) {
                    const heightBottom = dimensions.marginBottom + dimensions.paddingBottom + (!node.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
                    if (heightBottom > 0) {
                        if (node.gridLast) {
                            node.parent.gridPadding.bottom = heightBottom;
                        }
                        else {
                            this.appendAfter(node.id, this.getViewStatic(VIEW_STANDARD.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightBottom))[0]);
                        }
                    }
                    const marginRight = dimensions.marginRight + dimensions.paddingRight;
                    if (marginRight > 0) {
                        node.parent.gridPadding.right.push(marginRight);
                    }
                }
            }
        }
        setAlignParent(node, orientation = '', bias = false) {
            const map = LAYOUT_MAP.constraint;
            ['horizontal', 'vertical'].forEach((value, index) => {
                if (orientation === '' || value === orientation) {
                    node.app(map[(index === 0 ? 'left' : 'top')], 'parent');
                    node.app(map[(index === 0 ? 'right' : 'bottom')], 'parent');
                    node.constraint[value] = true;
                    if (bias) {
                        node.app(`layout_constraint${value.charAt(0).toUpperCase() + value.substring(1)}_bias`, node[`${value}Bias`]);
                    }
                }
            });
        }
        createGuideline(parent, node, orientation = '', opposite = false, percent = -1) {
            const map = LAYOUT_MAP.constraint;
            const beginPercent = `layout_constraintGuide_${(percent !== -1 ? 'percent' : 'begin')}`;
            ['horizontal', 'vertical'].forEach((value, index) => {
                if ((orientation === '' && !node.constraint[value]) || orientation === value) {
                    const position = (index === 0 ? 'left' : 'top');
                    const options = {
                        android: {
                            orientation: (index === 0 ? 'vertical' : 'horizontal')
                        },
                        app: {
                            [beginPercent]: (percent !== -1 ? percent : formatPX(Math.max(node.bounds[position] - parent.box[position], 0)))
                        }
                    };
                    const LRTB = (index === 0 ? (!opposite ? 'left' : 'right') : (!opposite ? 'top' : 'bottom'));
                    const RLBT = (index === 0 ? (!opposite ? 'right' : 'left') : (!opposite ? 'bottom' : 'top'));
                    const [xml, id] = this.getViewStatic(VIEW_STANDARD.GUIDELINE, node.renderDepth, options);
                    this.appendAfter(node.id, xml, -1);
                    node.app(map[LRTB], id);
                    node.delete('app', map[RLBT]);
                    node.constraint[value] = true;
                }
            });
        }
        deleteConstraints(node, orientation = '') {
            const map = LAYOUT_MAP.constraint;
            if (orientation === '' || orientation === 'horizontal') {
                node.delete('app', map['leftRight'], map['rightLeft']);
                node.constraint.horizontal = false;
            }
            if (orientation === '' || orientation === 'vertical') {
                node.delete('app', map['bottomTop'], map['topBottom'], map['baseline']);
                node.constraint.vertical = false;
            }
        }
        findByAndroidId(id) {
            return this.cache.list.find(node => node.android('id') === id);
        }
        adjustMargins(nodes) {
            for (const node of nodes) {
                if (node.constraint.marginHorizontal != null) {
                    const item = this.findByAndroidId(node.constraint.marginHorizontal);
                    if (item != null) {
                        const offset = node.linear.left - item.linear.right;
                        if (offset >= 1) {
                            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, offset);
                        }
                    }
                }
                if (node.constraint.marginVertical != null) {
                    const item = this.findByAndroidId(node.constraint.marginVertical);
                    if (item != null) {
                        const offset = node.linear.top - item.linear.bottom;
                        if (offset >= 1) {
                            node.modifyBox(BOX_STANDARD.MARGIN_TOP, offset);
                        }
                    }
                }
            }
        }
    }

    class Resource {
        constructor(file) {
            this.file = file;
        }
        static addString(value, name = '') {
            if (hasValue(value)) {
                if (name === '') {
                    name = value;
                }
                const num = isNumber(value);
                if (SETTINGS.numberResourceValue || !num) {
                    for (const key of Resource.STORED.STRINGS.keys()) {
                        if (key === value) {
                            return key;
                        }
                    }
                    name = name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').split('_').slice(0, 4).join('_').replace(/_+$/g, '');
                    if (num || /^[0-9]/.test(value)) {
                        name = `__${name}`;
                    }
                    else if (name === '') {
                        name = `__symbol${Math.ceil(Math.random() * 100000)}`;
                    }
                    Resource.STORED.STRINGS.set(value, name);
                }
                return value;
            }
            return '';
        }
        static addImage(images, prefix = '') {
            let src = '';
            if (images['mdpi'] != null && hasValue(images['mdpi'])) {
                src = getFileName(images['mdpi']);
                const format = getFileExt(src).toLowerCase();
                src = src.replace(/.\w+$/, '').replace(/-/g, '_');
                switch (format) {
                    case 'bmp':
                    case 'bmpf':
                    case 'cur':
                    case 'gif':
                    case 'ico':
                    case 'jpg':
                    case 'png':
                    case 'tif':
                    case 'tiff':
                    case 'webp':
                    case 'xbm':
                        src = Resource.insertStoredAsset('IMAGES', prefix + src, images);
                        break;
                    default:
                        src = '';
                }
            }
            return src;
        }
        static addImageURL(value, prefix = '') {
            const match = value.match(/^url\("(.*?)"\)$/);
            if (match != null) {
                return Resource.addImage({ 'mdpi': resolveRelativePath(match[1]) }, prefix);
            }
            return '';
        }
        static addColor(value) {
            value = value.toUpperCase().trim();
            if (value !== '') {
                let colorName = '';
                if (!Resource.STORED.COLORS.has(value)) {
                    const color = findNearestColor(value);
                    if (color !== '') {
                        color.name = cameltoLowerCase(color.name);
                        if (value === color.hex) {
                            colorName = color.name;
                        }
                        else {
                            colorName = generateId('color', `${color.name}_1`);
                        }
                        Resource.STORED.COLORS.set(value, colorName);
                    }
                }
                else {
                    colorName = Resource.STORED.COLORS.get(value);
                }
                return colorName;
            }
            return '';
        }
        static insertStoredAsset(asset, name, value) {
            const stored = Resource.STORED[asset];
            if (stored != null) {
                let storedName = '';
                for (const [storedKey, storedValue] of stored.entries()) {
                    if (JSON.stringify(value) === JSON.stringify(storedValue)) {
                        storedName = storedKey;
                        break;
                    }
                }
                if (storedName === '') {
                    if (isNumber(name)) {
                        name = `__${name}`;
                    }
                    if (hasValue(value)) {
                        let i = 0;
                        do {
                            storedName = name;
                            if (i > 0) {
                                storedName += `_${i}`;
                            }
                            if (!stored.has(storedName)) {
                                stored.set(storedName, value);
                            }
                            i++;
                        } while (stored.has(storedName) && stored.get(storedName) !== value);
                    }
                }
                return storedName;
            }
            return '';
        }
        addFile(pathname, filename, content = '', uri = '') {
            this.file.addFile(pathname, filename, content, uri);
        }
        reset() {
            Resource.STORED.STRINGS = new Map();
            Resource.STORED.COLORS = new Map();
            Resource.STORED.IMAGES = new Map();
            this.file.reset();
        }
        setBoxSpacing() {
            this.cache.elements.forEach(node => {
                if ((node.ignoreResource & VIEW_RESOURCE.BOX_SPACING) !== VIEW_RESOURCE.BOX_SPACING) {
                    const element = node.element;
                    const object = element;
                    if (!hasValue(object.__boxSpacing) || SETTINGS.alwaysReevaluateResources) {
                        const result = getBoxSpacing(element);
                        for (const i in result) {
                            result[i] += 'px';
                        }
                        object.__boxSpacing = result;
                    }
                }
            });
        }
        setBoxStyle() {
            this.cache.elements.forEach(node => {
                if ((node.ignoreResource & VIEW_RESOURCE.BOX_STYLE) !== VIEW_RESOURCE.BOX_STYLE) {
                    const element = node.element;
                    const object = element;
                    if (!hasValue(object.__boxStyle) || SETTINGS.alwaysReevaluateResources) {
                        const result = {
                            borderTop: this.parseBorderStyle,
                            borderRight: this.parseBorderStyle,
                            borderBottom: this.parseBorderStyle,
                            borderLeft: this.parseBorderStyle,
                            borderRadius: this.parseBorderRadius,
                            backgroundColor: parseRGBA,
                            backgroundImage: Resource.addImageURL,
                            backgroundSize: this.parseBoxDimensions
                        };
                        for (const i in result) {
                            result[i] = result[i](node.css(i), node, i);
                        }
                        if (result.backgroundColor.length > 0) {
                            if (SETTINGS.excludeBackgroundColor.includes(result.backgroundColor[0]) || result.backgroundColor[2] === '0' || (node.styleMap.backgroundColor == null && sameAsParent(element, 'backgroundColor'))) {
                                result.backgroundColor = [];
                            }
                            else {
                                result.backgroundColor[0] = Resource.addColor(result.backgroundColor[0]);
                            }
                        }
                        const borderTop = JSON.stringify(result.borderTop);
                        if (borderTop === JSON.stringify(result.borderRight) && borderTop === JSON.stringify(result.borderBottom) && borderTop === JSON.stringify(result.borderLeft)) {
                            result.border = result.borderTop;
                        }
                        object.__boxStyle = result;
                    }
                }
            });
        }
        setFontStyle() {
            this.cache.elements.forEach(node => {
                if ((node.visible || node.companion) && (node.ignoreResource & VIEW_RESOURCE.FONT_STYLE) !== VIEW_RESOURCE.FONT_STYLE) {
                    const element = node.element;
                    const object = element;
                    if (!hasValue(object.__fontStyle) || SETTINGS.alwaysReevaluateResources) {
                        if (node.renderChildren.length > 0 || node.tagName === 'IMG' || node.tagName === 'HR') {
                            return;
                        }
                        else {
                            let color = parseRGBA(node.css('color'));
                            if (color.length > 0) {
                                if (SETTINGS.excludeTextColor.includes(color[0])) {
                                    color = [];
                                }
                                else {
                                    color[0] = Resource.addColor(color[0]);
                                }
                            }
                            let backgroundColor = parseRGBA(node.css('backgroundColor'));
                            if (backgroundColor.length > 0) {
                                if (SETTINGS.excludeBackgroundColor.includes(backgroundColor[0]) || backgroundColor[2] === '0' || (node.styleMap.backgroundColor == null && sameAsParent(element, 'backgroundColor'))) {
                                    backgroundColor = [];
                                }
                                else {
                                    backgroundColor[0] = Resource.addColor(backgroundColor[0]);
                                }
                            }
                            const result = {
                                fontFamily: node.css('fontFamily'),
                                fontStyle: node.css('fontStyle'),
                                fontSize: node.css('fontSize'),
                                fontWeight: node.css('fontWeight'),
                                color: (color.length > 0 ? `@color/${color[0]}` : ''),
                                backgroundColor: (backgroundColor.length > 0 ? `@color/${backgroundColor[0]}` : '')
                            };
                            object.__fontStyle = result;
                        }
                    }
                }
            });
        }
        setImageSource() {
            this.cache.list.filter(node => node.tagName === 'IMG').forEach(node => {
                const element = node.element;
                const object = element;
                const prefix = object.__imageSourcePrefix || '';
                const target = object.__imageSourceTarget;
                if ((node.ignoreResource & VIEW_RESOURCE.IMAGE_SOURCE) !== VIEW_RESOURCE.IMAGE_SOURCE || target != null || prefix !== '') {
                    if (!hasValue(object.__imageSource) || SETTINGS.alwaysReevaluateResources) {
                        const srcset = element.srcset.trim();
                        const images = {};
                        if (hasValue(srcset)) {
                            const filePath = element.src.substring(0, element.src.lastIndexOf('/') + 1);
                            srcset.split(',').forEach((value) => {
                                const match = /^(.*?)\s*([0-9]+\.?[0-9]*x)?$/.exec(value.trim());
                                if (match != null) {
                                    if (match[2] == null) {
                                        match[2] = '1x';
                                    }
                                    const image = filePath + getFileName(match[1]);
                                    switch (match[2]) {
                                        case '0.75x':
                                            images['ldpi'] = image;
                                            break;
                                        case '1x':
                                            images['mdpi'] = image;
                                            break;
                                        case '1.5x':
                                            images['hdpi'] = image;
                                            break;
                                        case '2x':
                                            images['xhdpi'] = image;
                                            break;
                                        case '3x':
                                            images['xxhdpi'] = image;
                                            break;
                                        case '4x':
                                            images['xxxhdpi'] = image;
                                            break;
                                    }
                                }
                            });
                        }
                        if (images['mdpi'] == null) {
                            images['mdpi'] = element.src;
                        }
                        const result = Resource.addImage(images, prefix);
                        object.__imageSource = result;
                    }
                }
            });
        }
        setOptionArray() {
            this.cache.list.filter(node => node.tagName === 'SELECT').forEach(node => {
                if ((node.ignoreResource & VIEW_RESOURCE.OPTION_ARRAY) !== VIEW_RESOURCE.OPTION_ARRAY) {
                    const element = node.element;
                    const object = element;
                    if (!hasValue(object.__optionArray) || SETTINGS.alwaysReevaluateResources) {
                        const stringArray = [];
                        let numberArray = [];
                        for (let i = 0; i < element.children.length; i++) {
                            const item = element.children[i];
                            const value = item.text.trim();
                            if (value !== '') {
                                if (numberArray != null && stringArray.length === 0 && isNumber(value)) {
                                    numberArray.push(value);
                                }
                                else {
                                    if (numberArray != null && numberArray.length > 0) {
                                        i = -1;
                                        numberArray = null;
                                        continue;
                                    }
                                    const result = Resource.addString(value);
                                    if (result !== '') {
                                        stringArray.push(result);
                                    }
                                }
                            }
                        }
                        object.__optionArray = { stringArray: (stringArray.length > 0 ? stringArray : null), numberArray: (numberArray != null && numberArray.length > 0 ? numberArray : null) };
                    }
                }
            });
        }
        setValueString() {
            this.cache.elements.forEach(node => {
                if ((node.ignoreResource & VIEW_RESOURCE.VALUE_STRING) !== VIEW_RESOURCE.VALUE_STRING) {
                    const element = node.element;
                    const object = element;
                    if (!hasValue(object.__valueString) || SETTINGS.alwaysReevaluateResources) {
                        let name = '';
                        let value = '';
                        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                            if (element.type !== 'range') {
                                value = element.value.trim();
                            }
                        }
                        else if (element.nodeName === '#text') {
                            value = (element.textContent ? element.textContent.trim() : '');
                        }
                        else if (element.children.length === 0 || Array.from(element.children).every((item) => INLINE_CHROME.includes(item.tagName))) {
                            name = element.innerText.trim();
                            value = element.innerHTML.trim();
                        }
                        if (hasValue(value)) {
                            Resource.addString(value, name);
                            object.__valueString = value;
                        }
                    }
                }
            });
        }
        borderVisible(border) {
            return (border != null && !(border.style === 'none' || border.width === '0px'));
        }
        getBorderStyle(border) {
            const result = { solid: `android:color="@color/${border.color}"` };
            Object.assign(result, {
                inset: result.solid,
                outset: result.solid,
                dotted: `${result.solid} android:dashWidth="3px" android:dashGap="1px"`,
                dashed: `${result.solid} android:dashWidth="1px" android:dashGap="1px"`
            });
            return result[border.style] || 'android:color="@android:color/black"';
        }
        parseBorderStyle(value, node, attribute) {
            const style = node.css(`${attribute}Style`) || 'none';
            let width = node.css(`${attribute}Width`) || '1px';
            const color = (style !== 'none' ? parseRGBA(node.css(`${attribute}Color`)) : []);
            if (color.length > 0) {
                color[0] = Resource.addColor(color[0]);
            }
            if (style === 'inset' && width === '0px') {
                width = '1px';
            }
            return { style, width, color: (color.length > 0 ? color[0] : '#000000') };
        }
        parseBorderRadius(value, node, attribute) {
            const radiusTop = node.css('borderTopLeftRadius');
            const radiusRight = node.css('borderTopRightRadius');
            const radiusBottom = node.css('borderBottomLeftRadius');
            const radiusLeft = node.css('borderBottomRightRadius');
            if (radiusTop === radiusRight && radiusRight === radiusBottom && radiusBottom === radiusLeft) {
                return (radiusTop === '' || radiusTop === '0px' ? [] : [radiusTop]);
            }
            else {
                return [radiusTop, radiusRight, radiusBottom, radiusLeft];
            }
        }
        parseBoxDimensions(value, node, attribute) {
            const match = value.match(/^([0-9]+(?:px|pt|em)|auto)(?: ([0-9]+(?:px|pt|em)|auto))?(?: ([0-9]+(?:px|pt|em)))?(?: ([0-9]+(?:px|pt|em)))?$/);
            if (match != null) {
                if ((match[1] === '0px' && match[2] == null) || (match[1] === 'auto' && match[2] === 'auto')) {
                    return [];
                }
                if (match[1] === 'auto' || match[2] === 'auto') {
                    return [(match[1] === 'auto' ? '' : convertPX(match[1])), (match[2] === 'auto' ? '' : convertPX(match[2]))];
                }
                else if (match[2] == null || (match[1] === match[2] && match[1] === match[3] && match[1] === match[4])) {
                    return [convertPX(match[1])];
                }
                else if (match[3] == null || (match[1] === match[3] && match[2] === match[4])) {
                    return [convertPX(match[1]), convertPX(match[2])];
                }
                else {
                    return [convertPX(match[1]), convertPX(match[2]), convertPX(match[3]), convertPX(match[4])];
                }
            }
            return [];
        }
    }
    Resource.STORED = {
        STRINGS: new Map(),
        COLORS: new Map(),
        IMAGES: new Map()
    };

    function getDataLevel(data, ...levels) {
        let current = data;
        for (const level of levels) {
            const [index, array = '0'] = level.split('-');
            current = current[index][array];
        }
        return current;
    }
    function parseTemplateMatch(template) {
        const result = {};
        let pattern = null;
        let match = false;
        let section = 0;
        let characters = template.length;
        do {
            if (match) {
                const segment = match[0].replace(new RegExp(match[1], 'g'), '');
                for (const index in result) {
                    result[index] = result[index].replace(new RegExp(match[0], 'g'), `{%${match[2]}}`);
                }
                result[match[2]] = segment;
                characters -= match[0].length;
            }
            if (match == null || characters === 0) {
                template = result[section++];
                if (!hasValue(template)) {
                    break;
                }
                characters = template.length;
                match = null;
            }
            if (!match) {
                pattern = /(!([0-9]+)\n?)[\w\W]*\1/g;
            }
            if (pattern != null) {
                match = pattern.exec(template);
            }
            else {
                break;
            }
        } while (true);
        return result;
    }
    function parseTemplateData(template, data, index, include, exclude) {
        let output = (index != null ? template[index] : '');
        if (data['#include'] != null) {
            include = data['#include'];
            delete data['#include'];
        }
        if (data['#exclude'] != null) {
            exclude = data['#exclude'];
            delete data['#exclude'];
        }
        for (const i in data) {
            let value = '';
            if (data[i] === false) {
                output = output.replace(`{%${i}}`, '');
                continue;
            }
            else if (Array.isArray(data[i])) {
                for (const j in data[i]) {
                    value += parseTemplateData(template, data[i][j], i, include, exclude);
                }
            }
            else {
                value = data[i];
            }
            if (hasValue(value)) {
                output = (index != null ? output.replace(new RegExp(`{[%@&]*${i}}`), value) : value.trim());
            }
            else if (new RegExp(`{%${i}}`).test(output) || value === false) {
                output = output.replace(`{%${i}}`, '');
            }
            else if (new RegExp(`{&${i}}`).test(output)) {
                output = '';
            }
            const pattern = /\s+[\w:]+="{#(\w+)=(.*?)}"/g;
            let match;
            while ((match = pattern.exec(output)) != null) {
                if (include && include[match[1]]) {
                    const attribute = `{#${match[1]}=${match[2]}}`;
                    if (data[match[2]] != null) {
                        output = output.replace(attribute, data[match[2]]);
                    }
                    else {
                        output = output.replace(attribute, match[2]);
                    }
                }
                else if (exclude && exclude[match[1]]) {
                    output = output.replace(match[0], '');
                }
            }
        }
        return output.replace(/\s+[\w:]+="{@\w+}"/g, '');
    }

    const template = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">',
        '!1',
        '	<stroke android:width="{&width}" {borderStyle} />',
        '!1',
        '!2',
        '!3',
        '	<solid android:color="@color/{&color}" />',
        '!3',
        '!4',
        '	<corners android:radius="{&radius}" />',
        '!4',
        '!5',
        '	<corners android:topLeftRadius="{&topLeftRadius}" android:topRightRadius="{&topRightRadius}" android:bottomRightRadius="{&bottomRightRadius}" android:bottomLeftRadius="{&bottomLeftRadius}" />',
        '!5',
        '!2',
        '</shape>',
        '!0'
    ];
    var SHAPERECTANGLE_TMPL = template.join('\n');

    const template$1 = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<layer-list xmlns:android="http://schemas.android.com/apk/res/android">',
        '!1',
        '	<item android:top="{@top}" android:right="{@right}" android:bottom="{@bottom}" android:left="{@left}">',
        '		<shape android:shape="rectangle">',
        '!2',
        '			<stroke android:width="{&width}" {borderStyle} />',
        '!2',
        '!3',
        '			<solid android:color="@color/{&color}" />',
        '!3',
        '!4',
        '			<corners android:radius="{&radius}" />',
        '!4',
        '!5',
        '			<corners android:topLeftRadius="{@topLeftRadius}" android:topRightRadius="{@topRightRadius}" android:bottomRightRadius="{@bottomRightRadius}" android:bottomLeftRadius="{@bottomLeftRadius}" />',
        '!5',
        '		</shape>',
        '	</item>',
        '!1',
        '!6',
        '	<item android:drawable="@drawable/{image}" width="{@width}" height="{@height}" />',
        '!6',
        '</layer-list>',
        '!0'
    ];
    var LAYERLIST_TMPL = template$1.join('\n');

    const STORED = {
        ARRAYS: new Map(),
        FONTS: new Map(),
        DRAWABLES: new Map(),
        STYLES: new Map(),
        STRINGS: new Map(),
        COLORS: new Map(),
        IMAGES: new Map()
    };
    Object.assign(STORED, Resource.STORED);
    const METHOD_ANDROID = {
        'boxSpacing': {
            'margin': 'android:layout_margin="{0}"',
            'marginTop': 'android:layout_marginTop="{0}"',
            'marginRight': 'android:layout_marginRight="{0}"',
            'marginBottom': 'android:layout_marginBottom="{0}"',
            'marginLeft': 'android:layout_marginLeft="{0}"',
            'padding': 'android:padding="{0}"',
            'paddingTop': 'android:paddingTop="{0}"',
            'paddingRight': 'android:paddingRight="{0}"',
            'paddingBottom': 'android:paddingBottom="{0}"',
            'paddingLeft': 'android:paddingLeft="{0}"'
        },
        'boxStyle': {
            'background': 'android:background="@drawable/{0}"',
            'backgroundColor': 'android:background="@color/{0}"'
        },
        'fontStyle': {
            'fontFamily': 'android:fontFamily="{0}"',
            'fontStyle': 'android:textStyle="{0}"',
            'fontWeight': 'android:fontWeight="{0}"',
            'fontSize': 'android:textSize="{0}"',
            'color': 'android:textColor="{0}"',
            'backgroundColor': 'android:background="{0}"'
        },
        'valueString': {
            'text': 'android:text="{0}"'
        },
        'optionArray': {
            'entries': 'android:entries="@array/{0}"'
        },
        'imageSource': {
            'src': 'android:src="@drawable/{0}"'
        }
    };
    class ResourceView extends Resource {
        constructor(file) {
            super(file);
            this.tagStyle = {};
            this.tagCount = {};
            this.file.stored = STORED;
        }
        finalize(viewData) {
            this.processFontStyle(viewData);
        }
        reset() {
            super.reset();
            STORED.ARRAYS = new Map();
            STORED.FONTS = new Map();
            STORED.DRAWABLES = new Map();
            STORED.STYLES = new Map();
            STORED.STRINGS = new Map();
            STORED.COLORS = new Map();
            STORED.IMAGES = new Map();
            Object.assign(STORED, Resource.STORED);
            this.file.reset();
            this.tagStyle = {};
            this.tagCount = {};
        }
        setBoxSpacing() {
            super.setBoxSpacing();
            this.cache.elements.forEach(node => {
                const stored = node.element.__boxSpacing;
                if (stored != null) {
                    const method = METHOD_ANDROID['boxSpacing'];
                    for (const i in stored) {
                        node.attr(formatString(parseRTL(method[i]), stored[i]));
                    }
                }
            });
        }
        setBoxStyle() {
            super.setBoxStyle();
            this.cache.elements.forEach(node => {
                const element = node.element;
                const object = element;
                const stored = object.__boxStyle;
                if (stored != null) {
                    const method = METHOD_ANDROID['boxStyle'];
                    const label = node.label;
                    if (label && !sameAsParent(label.element, 'backgroundColor')) {
                        stored.backgroundColor = label.element.__boxStyle.backgroundColor;
                    }
                    if (this.borderVisible(stored.borderTop) || this.borderVisible(stored.borderRight) || this.borderVisible(stored.borderBottom) || this.borderVisible(stored.borderLeft) || stored.backgroundImage !== '' || stored.borderRadius.length > 0) {
                        let template;
                        let data;
                        let resourceName = '';
                        if (stored.border != null && stored.backgroundImage === '') {
                            template = parseTemplateMatch(SHAPERECTANGLE_TMPL);
                            data = {
                                '0': [{
                                        '1': this.getShapeAttribute(stored, 'stroke'),
                                        '2': (stored.backgroundColor.length > 0 || stored.borderRadius.length > 0 ? [{
                                                '3': this.getShapeAttribute(stored, 'backgroundColor'),
                                                '4': this.getShapeAttribute(stored, 'radius'),
                                                '5': this.getShapeAttribute(stored, 'radiusInit')
                                            }] : false)
                                    }]
                            };
                            if (stored.borderRadius.length > 1) {
                                const shape = getDataLevel(data, '0', '2');
                                const borderRadius = this.getShapeAttribute(stored, 'radiusAll');
                                shape['5'].push(borderRadius);
                            }
                        }
                        else if (stored.border != null) {
                            template = parseTemplateMatch(LAYERLIST_TMPL);
                            data = {
                                '0': [{
                                        '1': [{
                                                '2': this.getShapeAttribute(stored, 'stroke'),
                                                '3': this.getShapeAttribute(stored, 'backgroundColor'),
                                                '4': this.getShapeAttribute(stored, 'radius'),
                                                '5': this.getShapeAttribute(stored, 'radiusInit')
                                            }],
                                        '6': (stored.backgroundImage !== '' ? [{ image: stored.backgroundImage, width: stored.backgroundSize[0], height: stored.backgroundSize[1] }] : false)
                                    }]
                            };
                            if (stored.borderRadius.length > 1) {
                                const shape = getDataLevel(data, '0', '1');
                                const borderRadius = this.getShapeAttribute(stored, 'radiusAll');
                                shape['5'].push(borderRadius);
                            }
                        }
                        else {
                            template = parseTemplateMatch(LAYERLIST_TMPL);
                            data = {
                                '0': [{
                                        '1': [],
                                        '6': (stored.backgroundImage !== '' ? [{ image: stored.backgroundImage, width: stored.backgroundSize[0], height: stored.backgroundSize[1] }] : false)
                                    }]
                            };
                            const root = getDataLevel(data, '0');
                            const borderRadius = {};
                            if (stored.borderRadius.length > 1) {
                                Object.assign(borderRadius, {
                                    topLeftRadius: stored.borderRadius[0],
                                    topRightRadius: stored.borderRadius[1],
                                    bottomRightRadius: stored.borderRadius[2],
                                    bottomLeftRadius: stored.borderRadius[3]
                                });
                            }
                            [stored.borderTop, stored.borderRight, stored.borderBottom, stored.borderLeft].forEach((item, index) => {
                                if (this.borderVisible(item)) {
                                    const hideWidth = `-${item.width}`;
                                    const layerList = {
                                        'top': hideWidth,
                                        'right': hideWidth,
                                        'bottom': hideWidth,
                                        'left': hideWidth,
                                        '2': [{ width: item.width, borderStyle: this.getBorderStyle(item) }],
                                        '3': false,
                                        '4': this.getShapeAttribute(stored, 'radius'),
                                        '5': this.getShapeAttribute(stored, 'radiusInit')
                                    };
                                    layerList[['top', 'right', 'bottom', 'left'][index]] = item.width;
                                    if (stored.borderRadius.length > 1) {
                                        layerList['5'].push(borderRadius);
                                    }
                                    root['1'].push(layerList);
                                }
                            });
                            if (root['1'].length === 0) {
                                root['1'] = false;
                            }
                        }
                        const xml = parseTemplateData(template, data);
                        for (const [name, value] of STORED.DRAWABLES.entries()) {
                            if (value === xml) {
                                resourceName = name;
                                break;
                            }
                        }
                        if (resourceName === '') {
                            resourceName = `${node.tagName.toLowerCase()}_${node.viewId}`;
                            STORED.DRAWABLES.set(resourceName, xml);
                        }
                        node.attr(formatString(method['background'], resourceName));
                    }
                    else if (object.__fontStyle == null && stored.backgroundColor.length > 0) {
                        node.attr(formatString(method['backgroundColor'], stored.backgroundColor[0]));
                    }
                }
            });
        }
        setFontStyle() {
            super.setFontStyle();
            const tagName = {};
            this.cache.elements.forEach(node => {
                if (node.element.__fontStyle != null) {
                    if (tagName[node.tagName] == null) {
                        tagName[node.tagName] = [];
                    }
                    tagName[node.tagName].push(node);
                }
            });
            for (const tag in tagName) {
                const nodes = tagName[tag];
                const sorted = [];
                nodes.forEach(node => {
                    if (node.labelFor != null) {
                        return;
                    }
                    let system = false;
                    let labelFor = null;
                    if (node.label != null) {
                        labelFor = node;
                        node = node.label;
                    }
                    const element = node.element;
                    const nodeId = (labelFor || node).id;
                    const stored = Object.assign({}, element.__fontStyle);
                    if (stored.fontFamily != null) {
                        const fontFamily = stored.fontFamily.toLowerCase().split(',')[0].replace(/"/g, '').trim();
                        let fontStyle = '';
                        let fontWeight = '';
                        if ((FONT_ANDROID[fontFamily] && SETTINGS.targetAPI >= FONT_ANDROID[fontFamily]) || (SETTINGS.useFontAlias && FONTALIAS_ANDROID[fontFamily] && SETTINGS.targetAPI >= FONT_ANDROID[FONTALIAS_ANDROID[fontFamily]])) {
                            system = true;
                            stored.fontFamily = fontFamily;
                            if (stored.fontStyle === 'normal') {
                                delete stored.fontStyle;
                            }
                            if (stored.fontWeight === '400') {
                                delete stored.fontWeight;
                            }
                        }
                        else {
                            stored.fontFamily = `@font/${fontFamily.replace(/ /g, '_') + (stored.fontStyle !== 'normal' ? `_${stored.fontStyle}` : '') + (stored.fontWeight !== '400' ? `_${FONTWEIGHT_ANDROID[stored.fontWeight] || stored.fontWeight}` : '')}`;
                            fontStyle = stored.fontStyle;
                            fontWeight = stored.fontWeight;
                            delete stored.fontStyle;
                            delete stored.fontWeight;
                        }
                        if (!system) {
                            const fonts = STORED.FONTS.get(fontFamily) || {};
                            Object.assign(fonts, { [`${fontStyle}-${fontWeight}`]: true });
                            STORED.FONTS.set(fontFamily, fonts);
                        }
                    }
                    const method = METHOD_ANDROID['fontStyle'];
                    const keys = Object.keys(method);
                    for (let i = 0; i < keys.length; i++) {
                        if (sorted[i] == null) {
                            sorted[i] = {};
                        }
                        const value = stored[keys[i]];
                        if (hasValue(value)) {
                            const attr = formatString(method[keys[i]], value);
                            if (sorted[i][attr] == null) {
                                sorted[i][attr] = [];
                            }
                            sorted[i][attr].push(nodeId);
                        }
                    }
                });
                if (this.tagStyle[tag] != null) {
                    const tagStyle = this.tagStyle[tag];
                    for (let i = 0; i < tagStyle.length; i++) {
                        for (const attr in tagStyle[i]) {
                            if (sorted[i][attr] != null) {
                                sorted[i][attr].push(...tagStyle[i][attr]);
                            }
                            else {
                                sorted[i][attr] = tagStyle[i][attr];
                            }
                        }
                    }
                    this.tagCount[tag] += nodes.filter(item => item.visible).length;
                }
                else {
                    this.tagCount[tag] = nodes.filter(item => item.visible).length;
                }
                this.tagStyle[tag] = sorted;
            }
        }
        setImageSource() {
            super.setImageSource();
            this.cache.list.filter(node => node.tagName === 'IMG').forEach(node => {
                const object = node.element;
                const stored = object.__imageSource;
                if (stored != null) {
                    const target = object.__imageSourceTarget;
                    if (target == null) {
                        const method = METHOD_ANDROID['imageSource'];
                        node.attr(formatString(method['src'], stored));
                    }
                    else {
                        target.node[target.namespace](target.attribute, `@drawable/${stored}`);
                        delete object.__imageSourceTarget;
                    }
                    delete object.__imageSourcePrefix;
                }
            });
        }
        setOptionArray() {
            super.setOptionArray();
            this.cache.list.filter(node => node.tagName === 'SELECT').forEach(node => {
                const stored = node.element.__optionArray;
                const method = METHOD_ANDROID['optionArray'];
                let result = [];
                if (stored.stringArray != null) {
                    for (const value of stored.stringArray) {
                        const name = STORED.STRINGS.get(value);
                        result.push((name != null ? `@string/${name}` : value));
                    }
                }
                if (stored.numberArray != null) {
                    result = stored.numberArray;
                }
                let arrayName = '';
                const arrayValue = result.join('-');
                for (const [storedName, storedResult] of STORED.ARRAYS.entries()) {
                    if (arrayValue === storedResult.join('-')) {
                        arrayName = storedName;
                        break;
                    }
                }
                if (arrayName === '') {
                    arrayName = `${node.viewId}_array`;
                    STORED.ARRAYS.set(arrayName, result);
                }
                node.attr(formatString(method['entries'], arrayName));
            });
        }
        setValueString() {
            super.setValueString();
            this.cache.elements.forEach(node => {
                const element = (node.label != null ? node.label.element : node.element);
                const stored = element.__valueString;
                if (stored != null) {
                    const method = METHOD_ANDROID['valueString'];
                    let name = STORED.STRINGS.get(stored);
                    if (node.is(VIEW_STANDARD.TEXT) && node.style != null) {
                        const match = node.style.textDecoration.match(/(underline|line-through)/);
                        if (match != null) {
                            let value = '';
                            switch (match[0]) {
                                case 'underline':
                                    value = `<u>${stored}</u>`;
                                    break;
                                case 'line-through':
                                    value = `<strike>${stored}</strike>`;
                                    break;
                            }
                            if (name == null) {
                                name = `${value.replace(/[^\w+]/g, '')}`;
                            }
                            if (/^[0-9]/.test(name)) {
                                name = `__${name}`;
                            }
                            STORED.STRINGS.delete(stored);
                            STORED.STRINGS.set(value, name);
                        }
                    }
                    node.attr(formatString(method['text'], (name != null ? `@string/${name}` : stored)));
                }
            });
        }
        processFontStyle(viewData) {
            const style = {};
            const layout = {};
            for (const tag in this.tagStyle) {
                style[tag] = {};
                layout[tag] = {};
                let sorted = this.tagStyle[tag].filter((item) => Object.keys(item).length > 0).sort((a, b) => {
                    let maxA = 0;
                    let maxB = 0;
                    let countA = 0;
                    let countB = 0;
                    for (const attr in a) {
                        maxA = Math.max(a[attr].length, maxA);
                        countA += a[attr].length;
                    }
                    for (const attr in b) {
                        maxB = Math.max(b[attr].length, maxB);
                        countB += b[attr].length;
                    }
                    if (maxA !== maxB) {
                        return (maxA > maxB ? -1 : 1);
                    }
                    else {
                        return (countA >= countB ? -1 : 1);
                    }
                });
                const count = this.tagCount[tag];
                do {
                    if (sorted.length === 1) {
                        for (const attr in sorted[0]) {
                            const value = sorted[0][attr];
                            if (value.length > 2) {
                                style[tag][attr] = value;
                            }
                            else {
                                layout[tag][attr] = value;
                            }
                        }
                        sorted.length = 0;
                    }
                    else {
                        const styleKey = {};
                        const layoutKey = {};
                        for (let i = 0; i < sorted.length; i++) {
                            const filtered = {};
                            const combined = {};
                            const deleteKeys = new Set();
                            for (const attr1 in sorted[i]) {
                                if (sorted[i] == null) {
                                    continue;
                                }
                                const ids = sorted[i][attr1];
                                let revalidate = false;
                                if (ids == null || ids.length === 0) {
                                    continue;
                                }
                                else if (ids.length === count) {
                                    styleKey[attr1] = ids;
                                    sorted[i] = null;
                                    revalidate = true;
                                }
                                else if (ids.length === 1) {
                                    layoutKey[attr1] = ids;
                                    sorted[i][attr1] = null;
                                    revalidate = true;
                                }
                                if (!revalidate) {
                                    const found = {};
                                    let merged = false;
                                    for (let j = 0; j < sorted.length; j++) {
                                        if (i !== j) {
                                            for (const attr in sorted[j]) {
                                                const compare$$1 = sorted[j][attr];
                                                for (const nodeId of ids) {
                                                    if (compare$$1.includes(nodeId)) {
                                                        if (found[attr] == null) {
                                                            found[attr] = [];
                                                        }
                                                        found[attr].push(nodeId);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    for (const attr2 in found) {
                                        if (found[attr2].length > 1) {
                                            filtered[[attr1, attr2].sort().join(';')] = found[attr2];
                                            merged = true;
                                        }
                                    }
                                    if (!merged) {
                                        filtered[attr1] = ids;
                                    }
                                }
                            }
                            for (const attr1 in filtered) {
                                for (const attr2 in filtered) {
                                    if (attr1 !== attr2 && filtered[attr1].join('') === filtered[attr2].join('')) {
                                        const index = filtered[attr1].join(',');
                                        if (combined[index] != null) {
                                            combined[index] = new Set([...combined[index], ...attr2.split(';')]);
                                        }
                                        else {
                                            combined[index] = new Set([...attr1.split(';'), ...attr2.split(';')]);
                                        }
                                        deleteKeys.add(attr1).add(attr2);
                                    }
                                }
                            }
                            deleteKeys.forEach(value => delete filtered[value]);
                            for (const attrs in filtered) {
                                this.deleteStyleAttribute(sorted, attrs, filtered[attrs]);
                                style[tag][attrs] = filtered[attrs];
                            }
                            for (const index in combined) {
                                const attrs = Array.from(combined[index]).sort().join(';');
                                const ids = index.split(',').map((value) => parseInt(value));
                                this.deleteStyleAttribute(sorted, attrs, ids);
                                style[tag][attrs] = ids;
                            }
                        }
                        const shared = Object.keys(styleKey);
                        if (shared.length > 0) {
                            if (shared.length > 1 || styleKey[shared[0]].length > 1) {
                                style[tag][shared.join(';')] = styleKey[shared[0]];
                            }
                            else {
                                Object.assign(layoutKey, styleKey);
                            }
                        }
                        for (const attr in layoutKey) {
                            layout[tag][attr] = layoutKey[attr];
                        }
                        for (let i = 0; i < sorted.length; i++) {
                            if (sorted[i] && Object.keys(sorted[i]).length === 0) {
                                delete sorted[i];
                            }
                        }
                        sorted = sorted.filter((item) => item && item.length > 0);
                    }
                } while (sorted.length > 0);
            }
            const resource = {};
            for (const tagName in style) {
                const tag = style[tagName];
                const tagData = [];
                for (const attributes in tag) {
                    tagData.push({ attributes, ids: tag[attributes] });
                }
                tagData.sort((a, b) => {
                    let [c, d] = [a.ids.length, b.ids.length];
                    if (c === d) {
                        [c, d] = [a.attributes.split(';').length, b.attributes.split(';').length];
                    }
                    return (c >= d ? -1 : 1);
                });
                tagData.forEach((item, index) => item.name = `${tagName.charAt(0) + tagName.substring(1).toLowerCase()}_${(index + 1)}`);
                resource[tagName] = tagData;
            }
            const inherit = new Set();
            const map = {};
            for (const tagName in resource) {
                for (const item of resource[tagName]) {
                    for (const id of item.ids) {
                        if (map[id] == null) {
                            map[id] = { styles: [], attributes: [] };
                        }
                        map[id].styles.push(item.name);
                    }
                }
                const tagData = layout[tagName];
                if (tagData != null) {
                    for (const attr in tagData) {
                        for (const id of tagData[attr]) {
                            if (attr.startsWith('android:background=')) {
                                const node = viewData.cache.find(item => item.id === id);
                                if (node && node.android('backround') != null) {
                                    continue;
                                }
                            }
                            if (map[id] == null) {
                                map[id] = { styles: [], attributes: [] };
                            }
                            map[id].attributes.push(attr);
                        }
                    }
                }
            }
            for (const id in map) {
                const node = viewData.cache.find(item => item.id === parseInt(id));
                if (node != null) {
                    const styles = map[id].styles;
                    const attributes = map[id].attributes;
                    const indent = padLeft(node.renderDepth + 1);
                    let append = '';
                    if (styles.length > 0) {
                        inherit.add(styles.join('.'));
                        append += `\n${indent}style="@style/${styles.pop()}"`;
                    }
                    if (attributes.length > 0) {
                        attributes.sort().forEach((value) => append += `\n${indent}${value}`);
                    }
                    for (let i = 0; i < viewData.views.length; i++) {
                        const output = viewData.views[i];
                        const pattern = `{&${id}}`;
                        if (new RegExp(pattern).test(output)) {
                            viewData.views[i] = output.replace(pattern, append);
                            break;
                        }
                    }
                }
            }
            for (const styles of inherit) {
                let parent = '';
                styles.split('.').forEach((value) => {
                    const match = value.match(/^(\w+)_([0-9]+)$/);
                    if (match != null) {
                        const tagData = resource[match[1].toUpperCase()][parseInt(match[2]) - 1];
                        STORED.STYLES.set(value, { parent, attributes: tagData.attributes });
                        parent = value;
                    }
                });
            }
            this.views = viewData.views;
        }
        deleteStyleAttribute(sorted, attributes, ids) {
            attributes.split(';').forEach((value) => {
                for (let i = 0; i < sorted.length; i++) {
                    if (sorted[i] != null) {
                        let index = -1;
                        let key = '';
                        for (const j in sorted[i]) {
                            if (j === value) {
                                index = i;
                                key = j;
                                i = sorted.length;
                                break;
                            }
                        }
                        if (index !== -1) {
                            sorted[index][key] = sorted[index][key].filter((id) => !ids.includes(id));
                            if (sorted[index][key].length === 0) {
                                delete sorted[index][key];
                            }
                            break;
                        }
                    }
                }
            });
        }
        getShapeAttribute(stored, name) {
            switch (name) {
                case 'stroke':
                    return (stored.border.width !== '0px' ? [{ width: stored.border.width, borderStyle: this.getBorderStyle(stored.border) }] : false);
                case 'backgroundColor':
                    return (stored.backgroundColor.length > 0 ? [{ color: stored.backgroundColor[0] }] : false);
                case 'radius':
                    return (stored.borderRadius.length === 1 && stored.borderRadius[0] !== '0px' ? [{ radius: stored.borderRadius[0] }] : false);
                case 'radiusInit':
                    return (stored.borderRadius.length > 1 ? [] : false);
                case 'radiusAll':
                    const result = {};
                    stored.borderRadius.forEach((value, index) => result[`${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius`] = value);
                    return result;
            }
        }
    }

    class File {
        constructor(directory, processingTime, compression) {
            this.directory = directory;
            this.processingTime = processingTime;
            this.appName = '';
            this.queue = [];
            this.compression = 'zip';
            if (hasValue(compression)) {
                this.compression = compression;
            }
        }
        addFile(pathname, filename, content, uri) {
            if (content !== '' || uri !== '') {
                this.queue.push({ pathname, filename, content, uri });
            }
        }
        reset() {
            this.queue = [];
        }
        saveToDisk(files) {
            if (!location.protocol.startsWith('http')) {
                alert('SERVER (required): See README for instructions');
                return;
            }
            if (files != null && files.length > 0) {
                files.push(...this.queue);
                fetch(`/api/savetodisk?directory=${encodeURIComponent(trim(this.directory, '/'))}&appname=${encodeURIComponent(this.appName.trim())}&filetype=${this.compression.toLocaleLowerCase()}&processingtime=${this.processingTime.toString().trim()}`, {
                    method: 'POST',
                    body: JSON.stringify(files),
                    headers: new Headers({ 'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json' })
                })
                    .then((res) => res.json())
                    .then(json => {
                    if (json) {
                        if (json.zipname != null) {
                            fetch(`/api/downloadtobrowser?filename=${encodeURIComponent(json.zipname)}`)
                                .then((res) => res.blob())
                                .then(blob => this.downloadToDisk(blob, getFileName(json.zipname)));
                        }
                        else if (json.system != null) {
                            alert(`${json.application}\n\n${json.system}`);
                        }
                    }
                })
                    .catch(err => alert(`ERROR: ${err}`));
            }
        }
        downloadToDisk(data, filename, mime = '') {
            const blob = new Blob([data], { type: mime || 'application/octet-stream' });
            if (typeof window.navigator.msSaveBlob !== 'undefined') {
                window.navigator.msSaveBlob(blob, filename);
                return;
            }
            const url = window.URL.createObjectURL(blob);
            const element = document.createElement('a');
            element.style.display = 'none';
            element.href = url;
            element.setAttribute('download', filename);
            if (typeof element.download === 'undefined') {
                element.setAttribute('target', '_blank');
            }
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        }
    }

    const template$2 = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '!1',
        '	<string name="{name}">{value}</string>',
        '!1',
        '</resources>',
        '<!-- filename: res/values/strings.xml -->',
        '!0'
    ];
    var STRING_TMPL = template$2.join('\n');

    const template$3 = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '!1',
        '	<string-array name="{name}">',
        '!2',
        '		<item>{value}</item>',
        '!2',
        '	</string-array>',
        '!1',
        '</resources>',
        '<!-- filename: res/values/string_arrays.xml -->',
        '!0'
    ];
    var STRINGARRAY_TMPL = template$3.join('\n');

    const template$4 = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '!1',
        '	<style name="{name1}" parent="{@parent}">',
        '!2',
        '		<item name="{name2}">{value}</item>',
        '!2',
        '	</style>',
        '!1',
        '</resources>',
        '<!-- filename: res/values/styles.xml -->',
        '!0'
    ];
    var STYLE_TMPL = template$4.join('\n');

    const template$5 = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<font-family xmlns:android="http://schemas.android.com/apk/res/android" xmlns:app="{#app=http://schemas.android.com/apk/res-auto}">',
        '!1',
        '	<font android:fontStyle="{style}" android:fontWeight="{weight}" android:font="{font}" app:fontStyle="{#app=style}" app:fontWeight="{#app=weight}" app:font="{#app=font}" />',
        '!1',
        '</font-family>',
        '<!-- filename: res/font/{name}.xml -->',
        '!0'
    ];
    var FONT_TMPL = template$5.join('\n');

    const template$6 = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '!1',
        '	<color name="{value}">{name}</color>',
        '!1',
        '</resources>',
        '<!-- filename: res/values/colors.xml -->',
        '!0'
    ];
    var COLOR_TMPL = template$6.join('\n');

    const template$7 = [
        '!0',
        '{value}',
        '<!-- filename: {name} -->',
        '!0'
    ];
    var DRAWABLE_TMPL = template$7.join('\n');

    class FileRes extends File {
        constructor() {
            super(SETTINGS.outputDirectory, SETTINGS.outputMaxProcessingTime, SETTINGS.outputArchiveFileType);
        }
        saveAllToDisk(data) {
            const files = [];
            for (let i = 0; i < data.views.length; i++) {
                files.push(this.getLayoutFile(data.pathnames[i], (i === 0 ? SETTINGS.outputActivityMainFileName : `${data.ids[i]}.xml`), data.views[i]));
            }
            const xml = this.resourceDrawableToXml();
            files.push(...this.parseFileDetails(this.resourceStringToXml()));
            files.push(...this.parseFileDetails(this.resourceStringArrayToXml()));
            files.push(...this.parseFileDetails(this.resourceFontToXml()));
            files.push(...this.parseFileDetails(this.resourceColorToXml()));
            files.push(...this.parseFileDetails(this.resourceStyleToXml()));
            files.push(...this.parseImageDetails(xml), ...this.parseFileDetails(xml));
            this.saveToDisk(files);
        }
        layoutAllToXml(data, saveToDisk = false) {
            const result = {};
            const files = [];
            for (let i = 0; i < data.views.length; i++) {
                const view = data.views[i];
                result[data.ids[i]] = view;
                if (saveToDisk) {
                    files.push(this.getLayoutFile(data.pathnames[i], (i === 0 ? SETTINGS.outputActivityMainFileName : `${data.ids[i]}.xml`), view));
                }
            }
            if (saveToDisk) {
                this.saveToDisk(files);
            }
            return result;
        }
        resourceAllToXml(saveToDisk = false) {
            const result = {
                string: this.resourceStringToXml(),
                stringArray: this.resourceStringArrayToXml(),
                font: this.resourceFontToXml(),
                color: this.resourceColorToXml(),
                style: this.resourceStyleToXml(),
                drawable: this.resourceDrawableToXml()
            };
            if (saveToDisk) {
                const files = [];
                for (const resource in result) {
                    if (resource === 'drawable') {
                        files.push(...this.parseImageDetails(result[resource]));
                    }
                    files.push(...this.parseFileDetails(result[resource]));
                }
                this.saveToDisk(files);
            }
            return result;
        }
        resourceStringToXml(saveToDisk = false) {
            this.stored.STRINGS = new Map([...this.stored.STRINGS.entries()].sort(caseInsensitve));
            let xml = '';
            if (this.stored.STRINGS.size > 0) {
                const template = parseTemplateMatch(STRING_TMPL);
                const data = {
                    '0': [{
                            '1': []
                        }]
                };
                const root = getDataLevel(data, '0');
                if (hasValue(this.appName) && !this.stored.STRINGS.has('app_name')) {
                    root['1'].push({ name: 'app_name', value: this.appName });
                }
                for (const [value, name] of this.stored.STRINGS.entries()) {
                    root['1'].push({ name, value });
                }
                xml = parseTemplateData(template, data);
                if (saveToDisk) {
                    this.saveToDisk(this.parseFileDetails(xml));
                }
            }
            return xml;
        }
        resourceStringArrayToXml(saveToDisk = false) {
            this.stored.ARRAYS = new Map([...this.stored.ARRAYS.entries()].sort());
            let xml = '';
            if (this.stored.ARRAYS.size > 0) {
                const template = parseTemplateMatch(STRINGARRAY_TMPL);
                const data = {
                    '0': [{
                            '1': []
                        }]
                };
                const root = getDataLevel(data, '0');
                for (const [name, values] of this.stored.ARRAYS.entries()) {
                    const arrayItem = {
                        name,
                        '2': []
                    };
                    const item = arrayItem['2'];
                    for (const value of values) {
                        item.push({ value });
                    }
                    root['1'].push(arrayItem);
                }
                xml = parseTemplateData(template, data);
                if (saveToDisk) {
                    this.saveToDisk(this.parseFileDetails(xml));
                }
            }
            return xml;
        }
        resourceFontToXml(saveToDisk = false) {
            this.stored.FONTS = new Map([...this.stored.FONTS.entries()].sort());
            let xml = '';
            if (this.stored.FONTS.size > 0) {
                const template = parseTemplateMatch(FONT_TMPL);
                for (const [name, font] of this.stored.FONTS.entries()) {
                    const data = {
                        '#include': {},
                        '#exclude': {},
                        '0': [{
                                name,
                                '1': []
                            }]
                    };
                    data[(SETTINGS.targetAPI < exports.build.OREO ? '#include' : '#exclude')]['app'] = true;
                    const root = getDataLevel(data, '0');
                    for (const attr in font) {
                        const [style, weight] = attr.split('-');
                        root['1'].push({
                            style,
                            weight,
                            font: `@font/${name + (style === 'normal' && weight === '400' ? `_${style}` : (style !== 'normal' ? `_${style}` : '') + (weight !== '400' ? `_${FONTWEIGHT_ANDROID[weight] || weight}` : ''))}`
                        });
                    }
                    xml += '\n\n' + parseTemplateData(template, data);
                }
                if (saveToDisk) {
                    this.saveToDisk(this.parseFileDetails(xml));
                }
            }
            return xml.trim();
        }
        resourceColorToXml(saveToDisk = false) {
            let xml = '';
            if (this.stored.COLORS.size > 0) {
                this.stored.COLORS = new Map([...this.stored.COLORS.entries()].sort());
                const template = parseTemplateMatch(COLOR_TMPL);
                const data = {
                    '0': [{
                            '1': []
                        }]
                };
                const root = getDataLevel(data, '0');
                for (const [name, value] of this.stored.COLORS.entries()) {
                    root['1'].push({ name, value });
                }
                xml = parseTemplateData(template, data);
                if (saveToDisk) {
                    this.saveToDisk(this.parseFileDetails(xml));
                }
            }
            return xml;
        }
        resourceStyleToXml(saveToDisk = false) {
            let xml = '';
            if (this.stored.STYLES.size > 0) {
                this.stored.STYLES = new Map([...this.stored.STYLES.entries()].sort());
                const template = parseTemplateMatch(STYLE_TMPL);
                const data = {
                    '0': [{
                            '1': []
                        }]
                };
                const root = getDataLevel(data, '0');
                for (const [name1, style] of this.stored.STYLES.entries()) {
                    const styleItem = {
                        name1,
                        parent: style.parent || '',
                        '2': []
                    };
                    style.attributes.split(';').sort().forEach((attr) => {
                        const [name2, value] = attr.split('=');
                        styleItem['2'].push({ name2, value: value.replace(/"/g, '') });
                    });
                    root['1'].push(styleItem);
                }
                xml = parseTemplateData(template, data);
                if (SETTINGS.useUnitDP) {
                    xml = replaceDP(xml, SETTINGS.density, true);
                }
                if (saveToDisk) {
                    this.saveToDisk(this.parseFileDetails(xml));
                }
            }
            return xml;
        }
        resourceDrawableToXml(saveToDisk = false) {
            let xml = '';
            if (this.stored.DRAWABLES.size > 0 || this.stored.IMAGES.size > 0) {
                const template = parseTemplateMatch(DRAWABLE_TMPL);
                const data = {
                    '0': []
                };
                const root = data['0'];
                for (const [name, value] of this.stored.DRAWABLES.entries()) {
                    root.push({ name: `res/drawable/${name}.xml`, value });
                }
                for (const [name, images] of this.stored.IMAGES.entries()) {
                    if (Object.keys(images).length > 1) {
                        for (const dpi in images) {
                            root.push({ name: `res/drawable-${dpi}/${name}.${getFileExt(images[dpi])}`, value: `<!-- image: ${images[dpi]} -->` });
                        }
                    }
                    else if (images['mdpi'] != null) {
                        root.push({ name: `res/drawable/${name}.${getFileExt(images['mdpi'])}`, value: `<!-- image: ${images['mdpi']} -->` });
                    }
                }
                xml = parseTemplateData(template, data);
                if (SETTINGS.useUnitDP) {
                    xml = replaceDP(xml, SETTINGS.density);
                }
                if (saveToDisk) {
                    this.saveToDisk([...this.parseImageDetails(xml), ...this.parseFileDetails(xml)]);
                }
            }
            return xml;
        }
        parseImageDetails(xml) {
            const result = [];
            const pattern = /<!-- image: (.+) -->\n<!-- filename: (.+)\/(.*?\.\w+) -->/;
            let match = null;
            while ((match = pattern.exec(xml)) != null) {
                result.push({
                    uri: match[1],
                    pathname: match[2],
                    filename: match[3]
                });
                xml = xml.replace(match[0], '');
            }
            return result;
        }
        parseFileDetails(xml) {
            const result = [];
            const pattern = /<\?xml[\w\W]*?(<!-- filename: (.+)\/(.*?\.xml) -->)/;
            let match = null;
            while ((match = pattern.exec(xml)) != null) {
                result.push({
                    content: match[0].replace(match[1], '').trim(),
                    pathname: match[2],
                    filename: match[3]
                });
                xml = xml.replace(match[0], '');
            }
            return result;
        }
        getLayoutFile(pathname, filename, content) {
            return {
                pathname,
                filename,
                content
            };
        }
    }

    class External extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        beforeInit(init = false) {
            if (init || this.included()) {
                if (this.element != null) {
                    const object = this.element;
                    if (object.__andromeExternalDisplay == null) {
                        object.__andromeExternalDisplay = getStyle(this.element).display;
                    }
                    this.element.style.display = 'block';
                }
            }
        }
        init(element) {
            if (this.included(element) && element.dataset.extension != null && element.dataset.extension.split(',').length <= 1) {
                this.application.elements.add(element);
                return true;
            }
            return false;
        }
        afterInit(init = false) {
            if (init || this.included()) {
                if (this.element != null) {
                    const object = this.element;
                    if (object.__andromeExternalDisplay != null) {
                        this.element.style.display = object.__andromeExternalDisplay;
                    }
                }
            }
        }
    }

    class List extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        condition() {
            return (super.condition() &&
                (this.node.children.every(node => node.tagName === 'LI') && this.node.children.some(node => node.css('display') === 'list-item' && node.css('listStyleType') !== 'none') && (this.linearX || this.linearY)));
        }
        processNode() {
            let xml = '';
            if (this.linearY) {
                xml = this.application.writeGridLayout(this.node, this.parent, 2);
            }
            else {
                xml = this.application.writeLinearLayout(this.node, this.parent, this.linearY);
            }
            for (let i = 0, j = 0; i < this.node.children.length; i++) {
                const node = this.node.children[i];
                let ordinal = '0';
                if (node.css('display') === 'list-item') {
                    const listStyle = node.css('listStyleType');
                    switch (listStyle) {
                        case 'disc':
                            ordinal = '●';
                            break;
                        case 'square':
                            ordinal = '■';
                            break;
                        case 'lower-alpha':
                        case 'lower-latin':
                            ordinal = `${convertAlpha(j).toLowerCase()}.`;
                            break;
                        case 'upper-alpha':
                        case 'upper-latin':
                            ordinal = `${convertAlpha(j)}.`;
                            break;
                        case 'lower-roman':
                            ordinal = `${convertRoman(j + 1).toLowerCase()}.`;
                            break;
                        case 'upper-roman':
                            ordinal = `${convertRoman(j + 1)}.`;
                            break;
                        default:
                            if (this.node.tagName === 'OL') {
                                ordinal = `${(listStyle === 'decimal-leading-zero' && j < 9 ? '0' : '') && (j + 1).toString()}.`;
                            }
                            else {
                                ordinal = '○';
                            }
                    }
                    j++;
                }
                node.options(this.name, { listStyle: ordinal });
            }
            return [xml, false];
        }
    }

    class ListAndroid extends List {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processChild() {
            const node = this.node;
            const controllerHandler = this.application.controllerHandler;
            const options = node.options(this.name);
            if (options && options.listStyle != null) {
                controllerHandler.prependBefore(node.id, controllerHandler.getViewStatic((options.listStyle !== '0' ? VIEW_STANDARD.TEXT : VIEW_STANDARD.SPACE), node.depth, { android: { gravity: parseRTL('right'), layout_gravity: 'fill', layout_columnWeight: '0', [parseRTL('layout_marginRight')]: '8px', text: (options.listStyle !== '0' ? options.listStyle : '') } })[0]);
                node.android('layout_columnWeight', '1');
            }
            return ['', false];
        }
    }

    class Table extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processNode() {
            const tableRows = [];
            const thead = this.node.children.find(node => node.tagName === 'THEAD');
            const tbody = this.node.children.find(node => node.tagName === 'TBODY');
            const tfoot = this.node.children.find(node => node.tagName === 'TFOOT');
            if (thead != null) {
                thead.cascade().filter(node => node.tagName === 'TH' || node.tagName === 'TD').forEach(node => node.inheritStyleMap(thead));
                tableRows.push(...thead.children);
                thead.hide();
            }
            if (tbody != null) {
                tableRows.push(...tbody.children);
                tbody.hide();
            }
            if (tfoot != null) {
                tfoot.cascade().filter(node => node.tagName === 'TH' || node.tagName === 'TD').forEach(node => node.inheritStyleMap(tfoot));
                tableRows.push(...tfoot.children);
                tfoot.hide();
            }
            const rowCount = tableRows.length;
            let columnCount = 0;
            for (let i = 0; i < tableRows.length; i++) {
                const tr = tableRows[i];
                tr.hide();
                columnCount = Math.max(tr.children.map(node => node.element).reduce((a, b) => a + b.colSpan, 0), columnCount);
                for (let j = 0; j < tr.children.length; j++) {
                    const td = tr.children[j];
                    const style = td.element.style;
                    const element = td.element;
                    if (element.rowSpan > 1) {
                        td.gridRowSpan = element.rowSpan;
                    }
                    if (element.colSpan > 1) {
                        td.gridColumnSpan = element.colSpan;
                    }
                    if (td.styleMap.textAlign == null && !(style.textAlign === 'left' || style.textAlign === 'start')) {
                        td.styleMap.textAlign = style.textAlign;
                    }
                    if (td.styleMap.verticalAlign == null && style.verticalAlign === '') {
                        td.styleMap.verticalAlign = 'middle';
                    }
                    const [width, height] = (this.node.style.borderCollapse === 'collapse' ? ['0px', '0px'] : this.node.style.borderSpacing.split(' '));
                    delete td.styleMap.margin;
                    td.styleMap.marginTop = height;
                    td.styleMap.marginRight = width;
                    td.styleMap.marginBottom = height;
                    td.styleMap.marginLeft = width;
                    td.parent = this.node;
                }
            }
            const xml = this.application.writeGridLayout(this.node, this.parent, columnCount, rowCount);
            return [xml, false];
        }
    }

    class Grid extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        condition() {
            return (this.included() ||
                (this.node.element.dataset != null && this.node.element.dataset.extension == null && !this.node.flex.enabled && this.node.children.length > 1 && BLOCK_CHROME.includes(this.node.children[0].tagName) && this.node.children.every(node => !node.flex.enabled && node.children.length > 1 && this.node.children[0].tagName === node.tagName && !node.children.some(child => child.css('float') === 'right'))));
        }
        processNode(mapX, mapY) {
            let xml = '';
            let columns = [];
            const columnEnd = [];
            const balanceColumns = this.options.balanceColumns;
            if (balanceColumns) {
                const dimensions = [];
                for (let l = 0; l < this.node.children.length; l++) {
                    const children = this.node.children[l].children;
                    dimensions[l] = [];
                    for (let m = 0; m < children.length; m++) {
                        dimensions[l].push(children[m].bounds.width);
                    }
                    columns.push(children);
                }
                const base = columns[dimensions.findIndex((item) => {
                    return (item === dimensions.reduce((a, b) => {
                        if (a.length === b.length) {
                            return (a.reduce((c, d) => c + d, 0) < b.reduce((c, d) => c + d, 0) ? a : b);
                        }
                        else {
                            return (a.length < b.length ? a : b);
                        }
                    }));
                })];
                if (base.length > 1) {
                    let maxIndex = -1;
                    let assigned = [];
                    let every = false;
                    for (let l = 0; l < base.length; l++) {
                        const bounds = base[l].bounds;
                        const found = [];
                        if (l < base.length - 1) {
                            for (let m = 0; m < columns.length; m++) {
                                if (columns[m] === base) {
                                    found.push(l);
                                }
                                else {
                                    const result = columns[m].findIndex((item, index) => (index >= l && Math.floor(item.bounds.width) === Math.floor(bounds.width) && index < columns[m].length - 1));
                                    if (result !== -1) {
                                        found.push(result);
                                    }
                                    else {
                                        found.length = 0;
                                        break;
                                    }
                                }
                            }
                        }
                        else {
                            for (let m = 0; m < columns.length; m++) {
                                if (columns[m].length > base.length) {
                                    const removed = columns[m].splice(assigned[m] + (every ? 2 : 1), columns[m].length - base.length);
                                    columns[m][assigned[m] + (every ? 1 : 0)].gridSiblings = [...removed];
                                }
                            }
                        }
                        if (found.length === columns.length) {
                            const minIndex = found.reduce((a, b) => Math.min(a, b));
                            maxIndex = found.reduce((a, b) => Math.max(a, b));
                            if (maxIndex > minIndex) {
                                for (let m = 0; m < columns.length; m++) {
                                    if (found[m] > minIndex) {
                                        const removed = columns[m].splice(minIndex, found[m] - minIndex);
                                        columns[m][assigned[m]].gridSiblings = [...removed];
                                    }
                                }
                            }
                            assigned = found;
                            every = true;
                        }
                        else {
                            assigned = new Array(columns.length).fill(l);
                            every = false;
                        }
                    }
                }
                else {
                    columns.length = 0;
                }
            }
            else {
                const nextMapX = mapX[this.node.depth + 2];
                const nextCoordsX = (nextMapX ? Object.keys(nextMapX) : []);
                if (nextCoordsX.length > 1) {
                    const columnRight = [];
                    for (let l = 0; l < nextCoordsX.length; l++) {
                        const nextAxisX = sortAsc(nextMapX[nextCoordsX[l]], 'bounds.top');
                        columnRight[l] = (l === 0 ? 0 : columnRight[l - 1]);
                        for (let m = 0; m < nextAxisX.length; m++) {
                            const nextX = nextAxisX[m];
                            if (nextX.parent.parent && this.node.id === nextX.parent.parent.id) {
                                const [left, right] = [nextX.bounds.left, nextX.bounds.right];
                                if (l === 0 || left >= columnRight[l - 1]) {
                                    if (columns[l] == null) {
                                        columns[l] = [];
                                    }
                                    columns[l].push(nextX);
                                }
                                columnRight[l] = Math.max(right, columnRight[l]);
                            }
                        }
                    }
                    for (let l = 0, m = -1; l < columnRight.length; l++) {
                        if (m === -1 && columns[l] == null) {
                            m = l - 1;
                        }
                        else if (columns[l] == null) {
                            if (m !== -1 && l === columnRight.length - 1) {
                                columnRight[m] = columnRight[l];
                            }
                            continue;
                        }
                        else if (m !== -1) {
                            columnRight[m] = columnRight[l - 1];
                            m = -1;
                        }
                    }
                    for (let l = 0; l < columns.length; l++) {
                        if (columns[l] != null) {
                            columnEnd.push(columnRight[l]);
                        }
                    }
                    columns = columns.filter(item => item);
                    const columnLength = columns.reduce((a, b) => Math.max(a, b.length), 0);
                    for (let l = 0; l < columnLength; l++) {
                        let top = null;
                        for (let m = 0; m < columns.length; m++) {
                            const nodeX = columns[m][l];
                            if (nodeX != null) {
                                if (top == null) {
                                    top = nodeX.bounds.top;
                                }
                                else if (nodeX.bounds.top !== top) {
                                    const nextRowX = columns[m - 1][l + 1];
                                    if (columns[m][l - 1] == null || (nextRowX && nextRowX.bounds.top === nodeX.bounds.top)) {
                                        columns[m].splice(l, 0, { spacer: 1 });
                                    }
                                    else if (columns[m][l + 1] == null) {
                                        columns[m][l + 1] = nodeX;
                                        columns[m][l] = { spacer: 1 };
                                    }
                                }
                            }
                            else {
                                columns[m].splice(l, 0, { spacer: 1 });
                            }
                        }
                    }
                }
            }
            if (columns.length > 1) {
                this.node.gridColumnEnd = columnEnd;
                this.node.gridColumnCount = (balanceColumns ? columns[0].length : columns.length);
                xml = this.application.writeGridLayout(this.node, this.parent, this.node.gridColumnCount);
                for (let l = 0, count = 0; l < columns.length; l++) {
                    let spacer = 0;
                    for (let m = 0, start = 0; m < columns[l].length; m++) {
                        const node = columns[l][m];
                        if (!node.spacer) {
                            node.parent.hide();
                            node.parent = this.node;
                            if (balanceColumns) {
                                node.gridRowStart = (m === 0);
                                node.gridRowEnd = (m === columns[l].length - 1);
                                node.gridFirst = (l === 0 && m === 0);
                                node.gridLast = (l === columns.length - 1 && node.gridRowEnd);
                                node.gridIndex = m;
                            }
                            else {
                                let rowSpan = 1;
                                let columnSpan = 1 + spacer;
                                for (let n = l + 1; n < columns.length; n++) {
                                    if (columns[n][m].spacer === 1) {
                                        columnSpan++;
                                        columns[n][m].spacer = 2;
                                    }
                                    else {
                                        break;
                                    }
                                }
                                if (columnSpan === 1) {
                                    for (let n = m + 1; n < columns[l].length; n++) {
                                        if (columns[l][n].spacer === 1) {
                                            rowSpan++;
                                            columns[l][n].spacer = 2;
                                        }
                                        else {
                                            break;
                                        }
                                    }
                                }
                                if (rowSpan > 1) {
                                    node.gridRowSpan = rowSpan;
                                }
                                if (columnSpan > 1) {
                                    node.gridColumnSpan = columnSpan;
                                }
                                node.gridRowStart = (start++ === 0);
                                node.gridRowEnd = (columnSpan + l === columns.length);
                                node.gridFirst = (count++ === 0);
                                node.gridLast = (node.gridRowEnd && m === columns[l].length - 1);
                                node.gridIndex = l;
                                spacer = 0;
                            }
                        }
                        else if (node.spacer === 1) {
                            spacer++;
                        }
                    }
                }
            }
            return [xml, false];
        }
        processChild() {
            let xml = '';
            let siblings;
            const parent = this.parent;
            if (this.options.balanceColumns) {
                siblings = this.node.gridSiblings;
            }
            else {
                const columnEnd = parent.gridColumnEnd[this.node.gridIndex + this.node.gridColumnSpan];
                siblings = this.node.parentOriginal.children.filter(item => !item.renderParent && item.bounds.left >= this.node.bounds.right && item.bounds.right <= columnEnd);
            }
            if (siblings != null && siblings.length > 0) {
                siblings.unshift(this.node);
                sortAsc(siblings, 'bounds.x');
                const viewGroup = this.application.controllerHandler.createGroup(this.node, parent, siblings);
                this.application.cache.list.push(viewGroup);
                const [linearX, linearY] = [NodeList.linearX(siblings), NodeList.linearY(siblings)];
                if (linearX || linearY) {
                    xml = this.application.writeLinearLayout(viewGroup, parent, linearY);
                }
                else {
                    xml = this.application.writeDefaultLayout(viewGroup, parent);
                }
                return [xml, true];
            }
            return ['', false];
        }
    }

    class Menu extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
            this.require('androme.external', true);
        }
        init(element) {
            if (this.included(element) || this.is(element.tagName)) {
                let valid = false;
                if (element.children.length > 0) {
                    const tagName = element.children[0].tagName;
                    valid = (BLOCK_CHROME.includes(tagName) && Array.from(element.children).every((item) => item.tagName === tagName && !(item.style.display === 'inline' || item.style.float === 'left' || item.style.float === 'right')));
                    let current = element.parentElement;
                    while (current != null) {
                        if (current.tagName === 'NAV' && this.application.elements.has(current)) {
                            valid = false;
                            break;
                        }
                        current = current.parentElement;
                    }
                }
                if (valid) {
                    Array.from(element.querySelectorAll('NAV')).forEach((item) => {
                        const style = getStyle(element);
                        if (style.display === 'none') {
                            item.__andromeExternalDisplay = 'none';
                            item.style.display = 'block';
                        }
                    });
                    this.application.elements.add(element);
                    return true;
                }
            }
            return false;
        }
        afterRender() {
            if (this.included(this.node.element)) {
                Array.from(this.node.element.querySelectorAll('NAV')).forEach((item) => {
                    const display = item.__andromeExternalDisplay;
                    if (display != null) {
                        item.style.display = display;
                    }
                });
            }
        }
    }

    var VIEW_STATIC;
    (function (VIEW_STATIC) {
        VIEW_STATIC["MENU"] = "menu";
        VIEW_STATIC["ITEM"] = "item";
        VIEW_STATIC["GROUP"] = "group";
    })(VIEW_STATIC || (VIEW_STATIC = {}));
    const VALIDATE_ITEM = {
        id: /^@\+id\/\w+$/,
        title: /^.+$/,
        titleCondensed: /^.+$/,
        icon: /^@drawable\/.+$/,
        onClick: /^.+$/,
        showAsAction: /^(ifRoom|never|withText|always|collapseActionView)$/,
        actionLayout: /^@layout\/.+$/,
        actionViewClass: /^.+$/,
        actionProviderClass: /^.+$/,
        alphabeticShortcut: /^[a-zA-Z]+$/,
        alphabeticModifiers: /(META|CTRL|ALT|SHIFT|SYM|FUNCTION)+/g,
        numericShortcut: /^[0-9]+$/,
        numericModifiers: /(META|CTRL|ALT|SHIFT|SYM|FUNCTION)+/g,
        checkable: /^(true|false)$/,
        visible: /^(true|false)$/,
        enabled: /^(true|false)$/,
        menuCategory: /^(container|system|secondary|alternative)$/,
        orderInCategory: /^[0-9]+$/
    };
    const VALIDATE_GROUP = {
        id: /^@\+id\/\w+$/,
        checkableBehavior: /^(none|all|single)$/,
        visible: /^(true|false)$/,
        enabled: /^(true|false)$/,
        menuCategory: /^(container|system|secondary|alternative)$/,
        orderInCategory: /^[0-9]+$/
    };
    const NAMESPACE_APP = ['showAsAction', 'actionViewClass', 'actionProviderClass'];
    class MenuAndroid extends Menu {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processNode() {
            const node = this.node;
            node.setViewId(VIEW_STATIC.MENU);
            let xml = '';
            xml = this.application.controllerHandler.getViewStatic(VIEW_STATIC.MENU, node.depth, {}, '', '', node.id, true)[0];
            node.renderDepth = 0;
            node.renderParent = true;
            node.cascade().forEach(item => item.renderExtension = this);
            node.ignoreResource = VIEW_RESOURCE.ALL;
            return [xml, false];
        }
        processChild() {
            const node = this.node;
            const element = node.element;
            if (element.nodeName === '#text') {
                node.hide();
                return ['', false];
            }
            const parent = this.parent;
            node.ignoreResource = VIEW_RESOURCE.ALL;
            node.renderDepth = parent.renderDepth + 1;
            node.renderParent = true;
            const options = { android: {}, app: {} };
            let viewName = VIEW_STATIC.ITEM;
            let layout = false;
            let title = '';
            const children = Array.from(node.element.children);
            if (children.some(item => BLOCK_CHROME.includes(item.tagName) && item.children.length > 0)) {
                if (children.some(item => item.tagName === 'NAV')) {
                    if (element.title !== '') {
                        title = element.title.trim();
                    }
                    else {
                        Array.from(node.element.childNodes).some((item) => {
                            if (item.nodeName === '#text') {
                                if (item.textContent != null && item.textContent.trim() !== '') {
                                    title = item.textContent.trim();
                                    return true;
                                }
                                return false;
                            }
                            else if (item.tagName !== 'NAV') {
                                title = item.innerText.trim();
                                return true;
                            }
                            return false;
                        });
                    }
                    node.children.forEach(item => item.tagName !== 'NAV' && item.hide());
                }
                else if (node.tagName === 'NAV') {
                    viewName = VIEW_STATIC.MENU;
                }
                else {
                    viewName = VIEW_STATIC.GROUP;
                    let checkable = '';
                    if (node.children.every((item) => this.hasInputType(item, 'radio'))) {
                        checkable = 'single';
                    }
                    else if (node.children.every((item) => this.hasInputType(item, 'checkbox'))) {
                        checkable = 'all';
                    }
                    options.android.checkableBehavior = checkable;
                }
                layout = true;
            }
            else {
                if (parent.android('checkableBehavior') == null) {
                    if (this.hasInputType(node, 'checkbox')) {
                        options.android.checkable = 'true';
                    }
                }
                title = (element.title !== '' ? element.title : element.innerText).trim();
            }
            switch (viewName) {
                case VIEW_STATIC.ITEM:
                    this.parseDataSet(VALIDATE_ITEM, element, options);
                    if (node.android('icon') == null) {
                        const resourceName = Resource.addImageURL(element.style.backgroundImage, 'ic_menu_');
                        if (resourceName !== '') {
                            options.android.icon = `@drawable/${resourceName}`;
                        }
                        else {
                            const image = node.children.find(item => item.element.tagName === 'IMG');
                            if (image != null) {
                                const object = image.element;
                                object.__imageSourcePrefix = 'ic_menu_';
                                object.__imageSourceTarget = { node, namespace: 'android', attribute: 'icon' };
                            }
                        }
                    }
                    break;
                case VIEW_STATIC.GROUP:
                    this.parseDataSet(VALIDATE_GROUP, element, options);
                    break;
            }
            if (node.android('title') == null) {
                if (title !== '') {
                    Resource.addString(title);
                    if (Resource.STORED.STRINGS.has(title)) {
                        title = `@string/${Resource.STORED.STRINGS.get(title)}`;
                    }
                    options.android.title = title;
                }
            }
            if (options.android.id == null) {
                node.setViewId(viewName);
            }
            else {
                node.viewName = viewName;
            }
            node.apply(options);
            const xml = this.application.controllerHandler.getViewStatic(viewName, node.depth, {}, '', '', node.id, layout)[0];
            return [xml, false];
        }
        afterRender() {
            super.afterRender();
            if (this.included(this.node.element)) {
                this.application.pathnames[this.application.pathnames.length - 1] = 'res/menu';
            }
        }
        parseDataSet(validator, element, options) {
            for (const attr in element.dataset) {
                const value = element.dataset[attr];
                if (value != null && validator[attr] != null) {
                    const match = value.match(validator[attr]);
                    if (match != null) {
                        const namespace = (this.options.nsAppCompat && NAMESPACE_APP.includes(attr) ? 'app' : 'android');
                        options[namespace][attr] = Array.from(new Set(match)).join('|');
                    }
                }
            }
        }
        hasInputType(node, value) {
            return (node.children.length > 0 && node.children.some(item => item.element.type === value));
        }
    }

    class Drawer extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
            this.require('androme.external', true);
            this.require('androme.menu');
        }
        init(element) {
            if (this.included(element)) {
                Array.from(element.children).forEach((item) => {
                    if (item.tagName !== 'NAV' && item.dataset.extension == null) {
                        item.dataset.extension = 'androme.external';
                    }
                });
                this.application.elements.add(element);
                return true;
            }
            return false;
        }
    }

    const template$8 = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '   <style name="{@appTheme}" parent="{@parentTheme}">',
        '       <item name="android:windowDrawsSystemBarBackgrounds">true</item>',
        '       <item name="android:statusBarColor">@android:color/transparent</item>',
        '       <item name="android:windowTranslucentStatus">true</item>',
        '!1',
        '       <item name="{name}">{value}</item>',
        '!1',
        '   </style>',
        '</resources>',
        '!0'
    ];
    var EXTENSION_DRAWER_TMPL = template$8.join('\n');

    class DrawerAndroid extends Drawer {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processNode() {
            const controller = this.application.controllerHandler;
            const node = this.node;
            node.setViewId("android.support.v4.widget.DrawerLayout" /* DRAWER */);
            let xml = controller.getViewStatic("android.support.v4.widget.DrawerLayout" /* DRAWER */, node.depth, {}, '', '', node.id, true)[0];
            node.android('layout_width', (this.options.layout_width || 'match_parent'));
            node.android('layout_height', (this.options.layout_height || 'match_parent'));
            node.android('fitsSystemWindows', (this.options.fitsSystemWindows || 'true'));
            node.renderDepth = 0;
            node.renderParent = true;
            node.ignoreResource = VIEW_RESOURCE.ALL;
            this.createResources();
            const options = {
                android: {
                    id: `${node.stringId}_view`,
                    layout_gravity: parseRTL(this.options.layout_gravity || 'left'),
                    fitsSystemWindows: (this.options.fitsSystemWindows || 'true')
                },
                app: {
                    menu: `@menu/{androme.drawer:menu:${node.id}}`,
                    headerLayout: `@layout/{androme.drawer:headerLayout:${node.id}}`
                }
            };
            const navigation = controller.getViewStatic("android.support.design.widget.NavigationView" /* NAVIGATION */, node.depth + 1, options, 'wrap_content', 'match_parent')[0];
            xml = xml.replace(`{:${node.id}}`, navigation);
            return [xml, false];
        }
        finalize() {
            let menu = '';
            let headerLayout = '';
            this.application.elements.forEach(item => {
                if (item.parentElement === this.element) {
                    switch (item.dataset.extension) {
                        case 'androme.external':
                            headerLayout = item.dataset.currentId;
                            break;
                        case 'androme.menu':
                            menu = item.dataset.currentId;
                            break;
                    }
                }
            });
            const views = this.application.views;
            for (let i = 0; i < views.length; i++) {
                views[i] = views[i].replace(`{androme.drawer:menu:${this.node.id}}`, menu);
                views[i] = views[i].replace(`{androme.drawer:headerLayout:${this.node.id}}`, headerLayout);
            }
        }
        createResources() {
            const template = parseTemplateMatch(EXTENSION_DRAWER_TMPL);
            const data = {
                '0': [{
                        'appTheme': this.options.appTheme || 'AppTheme',
                        'parentTheme': this.options.parentTheme || 'Theme.AppCompat.Light.NoActionBar',
                        '1': []
                    }]
            };
            if (this.options.item != null) {
                const root = getDataLevel(data, '0');
                for (const name in this.options.item) {
                    root['1'].push({
                        name,
                        value: this.options.item[name]
                    });
                }
            }
            const pathname = (this.options.output && this.options.output.path != null ? this.options.output.path : 'res/values-v21');
            const filename = (this.options.output && this.options.output.file != null ? this.options.output.file : 'androme.drawer.xml');
            const xml = parseTemplateData(template, data);
            this.application.resourceHandler.addFile(pathname, filename, xml);
        }
    }

    const CACHE = new Set();
    const EXTENSIONS = {
        'androme.external': new External('androme.external', []),
        'androme.list': new ListAndroid('androme.list', ['UL', 'OL']),
        'androme.table': new Table('androme.table', ['TABLE']),
        'androme.grid': new Grid('androme.grid', [], { balanceColumns: true }),
        'androme.menu': new MenuAndroid('androme.menu', ['NAV'], { nsAppCompat: true }),
        'androme.drawer': new DrawerAndroid('androme.drawer', [])
    };
    const Node$1 = View;
    const NodeList$1 = ViewList;
    const Controller$1 = new ViewController();
    const File$1 = new FileRes();
    const Resource$1 = new ResourceView(File$1);
    const main = new Application(Node$1, NodeList$1);
    main.registerController(Controller$1);
    main.registerResource(Resource$1);
    for (const name of SETTINGS.builtInExtensions) {
        const extension = EXTENSIONS[name.toLowerCase().trim()];
        if (extension != null) {
            main.registerExtension(extension);
        }
    }
    function parseDocument(...elements) {
        if (main.closed) {
            return;
        }
        main.resetController();
        main.setStyleMap();
        main.elements.clear();
        if (main.appName === '' && elements.length === 0) {
            elements.push(document.body);
        }
        elements.forEach(element => {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            if (element instanceof HTMLElement) {
                main.elements.add(element);
            }
        });
        main.elements.forEach(element => {
            if (main.appName === '') {
                if (element.id === '') {
                    element.id = 'androme';
                }
                main.appName = element.id;
            }
            else {
                if (element.id === '') {
                    element.id = `view_${main.length}`;
                }
            }
            element.dataset.views = (element.dataset.views != null ? parseInt(element.dataset.views) + 1 : 1).toString();
            element.dataset.currentId = (element.dataset.views !== '1' ? `${element.id}_${element.dataset.views}` : element.id).replace(/[^\w]/g, '_');
            if (main.createNodeCache(element) && main.createLayoutXml()) {
                main.setResources();
                if (SETTINGS.showAttributes) {
                    main.setMarginPadding();
                    main.setConstraints();
                    main.replaceInlineAttributes();
                }
                main.replaceAppended();
                CACHE.add(element);
            }
            else {
                delete element.dataset.views;
                delete element.dataset.currentId;
            }
        });
    }
    function registerExtension(extension) {
        if (extension instanceof Extension) {
            main.registerExtension(extension);
        }
    }
    function configureExtension(name, options) {
        if (options != null) {
            const extension = main.findExtension(name);
            if (extension != null) {
                Object.assign(extension.options, options);
            }
        }
    }
    function ready() {
        return !main.closed;
    }
    function close() {
        if (main.length > 0) {
            main.finalize();
        }
    }
    function reset() {
        CACHE.forEach((element) => {
            delete element.dataset.views;
            delete element.dataset.currentId;
        });
        CACHE.clear();
        main.reset();
    }
    function saveAllToDisk() {
        if (main.length > 0) {
            if (!main.closed) {
                main.finalize();
            }
            main.resourceHandler.file.saveAllToDisk(main.viewData);
        }
    }
    function writeLayoutAllXml(saveToDisk = false) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.layoutAllToXml(main.viewData, saveToDisk);
        }
        return '';
    }
    function writeResourceAllXml(saveToDisk = false) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceAllToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceStringXml(saveToDisk = false) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceStringToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceArrayXml(saveToDisk = false) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceStringArrayToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceFontXml(saveToDisk = false) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceFontToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceColorXml(saveToDisk = false) {
        if (main.closed) {
            return main.resourceHandler.file.resourceColorToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceStyleXml(saveToDisk = false) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceStyleToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceDrawableXml(saveToDisk = false) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceDrawableToXml(saveToDisk);
        }
        return '';
    }
    function toString() {
        return main.toString();
    }
    function autoClose() {
        if (SETTINGS.autoCloseOnWrite && !main.closed) {
            main.finalize();
        }
    }

    exports.parseDocument = parseDocument;
    exports.registerExtension = registerExtension;
    exports.configureExtension = configureExtension;
    exports.ready = ready;
    exports.close = close;
    exports.reset = reset;
    exports.saveAllToDisk = saveAllToDisk;
    exports.writeLayoutAllXml = writeLayoutAllXml;
    exports.writeResourceAllXml = writeResourceAllXml;
    exports.writeResourceStringXml = writeResourceStringXml;
    exports.writeResourceArrayXml = writeResourceArrayXml;
    exports.writeResourceFontXml = writeResourceFontXml;
    exports.writeResourceColorXml = writeResourceColorXml;
    exports.writeResourceStyleXml = writeResourceStyleXml;
    exports.writeResourceDrawableXml = writeResourceDrawableXml;
    exports.toString = toString;
    exports.api = API_ANDROID;
    exports.settings = SETTINGS;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
