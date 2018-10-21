/* androme 2.0.2
   https://github.com/anpham6/androme */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.androme = {})));
}(this, (function (exports) { 'use strict';

    var USER_AGENT;
    (function (USER_AGENT) {
        USER_AGENT[USER_AGENT["NONE"] = 0] = "NONE";
        USER_AGENT[USER_AGENT["CHROME"] = 2] = "CHROME";
        USER_AGENT[USER_AGENT["SAFARI"] = 4] = "SAFARI";
        USER_AGENT[USER_AGENT["EDGE"] = 8] = "EDGE";
    })(USER_AGENT || (USER_AGENT = {}));
    var APP_FRAMEWORK;
    (function (APP_FRAMEWORK) {
        APP_FRAMEWORK[APP_FRAMEWORK["UNIVERSAL"] = 0] = "UNIVERSAL";
        APP_FRAMEWORK[APP_FRAMEWORK["ANDROID"] = 2] = "ANDROID";
    })(APP_FRAMEWORK || (APP_FRAMEWORK = {}));
    var APP_SECTION;
    (function (APP_SECTION) {
        APP_SECTION[APP_SECTION["NONE"] = 0] = "NONE";
        APP_SECTION[APP_SECTION["INCLUDE"] = 2] = "INCLUDE";
        APP_SECTION[APP_SECTION["DOM_TRAVERSE"] = 4] = "DOM_TRAVERSE";
        APP_SECTION[APP_SECTION["EXTENSION"] = 8] = "EXTENSION";
        APP_SECTION[APP_SECTION["RENDER"] = 16] = "RENDER";
        APP_SECTION[APP_SECTION["ALL"] = 30] = "ALL";
    })(APP_SECTION || (APP_SECTION = {}));
    var NODE_ALIGNMENT;
    (function (NODE_ALIGNMENT) {
        NODE_ALIGNMENT[NODE_ALIGNMENT["NONE"] = 0] = "NONE";
        NODE_ALIGNMENT[NODE_ALIGNMENT["EXTENDABLE"] = 2] = "EXTENDABLE";
        NODE_ALIGNMENT[NODE_ALIGNMENT["HORIZONTAL"] = 4] = "HORIZONTAL";
        NODE_ALIGNMENT[NODE_ALIGNMENT["VERTICAL"] = 8] = "VERTICAL";
        NODE_ALIGNMENT[NODE_ALIGNMENT["ABSOLUTE"] = 16] = "ABSOLUTE";
        NODE_ALIGNMENT[NODE_ALIGNMENT["FLOAT"] = 32] = "FLOAT";
        NODE_ALIGNMENT[NODE_ALIGNMENT["SEGMENTED"] = 64] = "SEGMENTED";
        NODE_ALIGNMENT[NODE_ALIGNMENT["PERCENT"] = 128] = "PERCENT";
        NODE_ALIGNMENT[NODE_ALIGNMENT["TOP"] = 256] = "TOP";
        NODE_ALIGNMENT[NODE_ALIGNMENT["RIGHT"] = 512] = "RIGHT";
        NODE_ALIGNMENT[NODE_ALIGNMENT["BOTTOM"] = 1024] = "BOTTOM";
        NODE_ALIGNMENT[NODE_ALIGNMENT["LEFT"] = 2048] = "LEFT";
        NODE_ALIGNMENT[NODE_ALIGNMENT["SINGLE"] = 4096] = "SINGLE";
        NODE_ALIGNMENT[NODE_ALIGNMENT["MULTILINE"] = 8192] = "MULTILINE";
        NODE_ALIGNMENT[NODE_ALIGNMENT["SPACE"] = 16384] = "SPACE";
    })(NODE_ALIGNMENT || (NODE_ALIGNMENT = {}));
    var NODE_RESOURCE;
    (function (NODE_RESOURCE) {
        NODE_RESOURCE[NODE_RESOURCE["NONE"] = 0] = "NONE";
        NODE_RESOURCE[NODE_RESOURCE["BOX_STYLE"] = 2] = "BOX_STYLE";
        NODE_RESOURCE[NODE_RESOURCE["BOX_SPACING"] = 4] = "BOX_SPACING";
        NODE_RESOURCE[NODE_RESOURCE["FONT_STYLE"] = 8] = "FONT_STYLE";
        NODE_RESOURCE[NODE_RESOURCE["VALUE_STRING"] = 16] = "VALUE_STRING";
        NODE_RESOURCE[NODE_RESOURCE["OPTION_ARRAY"] = 32] = "OPTION_ARRAY";
        NODE_RESOURCE[NODE_RESOURCE["IMAGE_SOURCE"] = 64] = "IMAGE_SOURCE";
        NODE_RESOURCE[NODE_RESOURCE["ASSET"] = 120] = "ASSET";
        NODE_RESOURCE[NODE_RESOURCE["ALL"] = 126] = "ALL";
    })(NODE_RESOURCE || (NODE_RESOURCE = {}));
    var NODE_PROCEDURE;
    (function (NODE_PROCEDURE) {
        NODE_PROCEDURE[NODE_PROCEDURE["NONE"] = 0] = "NONE";
        NODE_PROCEDURE[NODE_PROCEDURE["LAYOUT"] = 2] = "LAYOUT";
        NODE_PROCEDURE[NODE_PROCEDURE["ALIGNMENT"] = 4] = "ALIGNMENT";
        NODE_PROCEDURE[NODE_PROCEDURE["AUTOFIT"] = 8] = "AUTOFIT";
        NODE_PROCEDURE[NODE_PROCEDURE["OPTIMIZATION"] = 16] = "OPTIMIZATION";
        NODE_PROCEDURE[NODE_PROCEDURE["CUSTOMIZATION"] = 32] = "CUSTOMIZATION";
        NODE_PROCEDURE[NODE_PROCEDURE["ACCESSIBILITY"] = 64] = "ACCESSIBILITY";
        NODE_PROCEDURE[NODE_PROCEDURE["ALL"] = 126] = "ALL";
    })(NODE_PROCEDURE || (NODE_PROCEDURE = {}));
    var NODE_STANDARD;
    (function (NODE_STANDARD) {
        NODE_STANDARD[NODE_STANDARD["NONE"] = 0] = "NONE";
        NODE_STANDARD[NODE_STANDARD["CHECKBOX"] = 1] = "CHECKBOX";
        NODE_STANDARD[NODE_STANDARD["RADIO"] = 2] = "RADIO";
        NODE_STANDARD[NODE_STANDARD["EDIT"] = 3] = "EDIT";
        NODE_STANDARD[NODE_STANDARD["SELECT"] = 4] = "SELECT";
        NODE_STANDARD[NODE_STANDARD["RANGE"] = 5] = "RANGE";
        NODE_STANDARD[NODE_STANDARD["SVG"] = 6] = "SVG";
        NODE_STANDARD[NODE_STANDARD["TEXT"] = 7] = "TEXT";
        NODE_STANDARD[NODE_STANDARD["IMAGE"] = 8] = "IMAGE";
        NODE_STANDARD[NODE_STANDARD["BUTTON"] = 9] = "BUTTON";
        NODE_STANDARD[NODE_STANDARD["INLINE"] = 10] = "INLINE";
        NODE_STANDARD[NODE_STANDARD["LINE"] = 11] = "LINE";
        NODE_STANDARD[NODE_STANDARD["SPACE"] = 12] = "SPACE";
        NODE_STANDARD[NODE_STANDARD["BLOCK"] = 13] = "BLOCK";
        NODE_STANDARD[NODE_STANDARD["WEB_VIEW"] = 14] = "WEB_VIEW";
        NODE_STANDARD[NODE_STANDARD["FRAME"] = 15] = "FRAME";
        NODE_STANDARD[NODE_STANDARD["LINEAR"] = 16] = "LINEAR";
        NODE_STANDARD[NODE_STANDARD["RADIO_GROUP"] = 17] = "RADIO_GROUP";
        NODE_STANDARD[NODE_STANDARD["GRID"] = 18] = "GRID";
        NODE_STANDARD[NODE_STANDARD["RELATIVE"] = 19] = "RELATIVE";
        NODE_STANDARD[NODE_STANDARD["CONSTRAINT"] = 20] = "CONSTRAINT";
        NODE_STANDARD[NODE_STANDARD["SCROLL_HORIZONTAL"] = 21] = "SCROLL_HORIZONTAL";
        NODE_STANDARD[NODE_STANDARD["SCROLL_VERTICAL"] = 22] = "SCROLL_VERTICAL";
    })(NODE_STANDARD || (NODE_STANDARD = {}));
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
        BOX_STANDARD[BOX_STANDARD["MARGIN"] = 30] = "MARGIN";
        BOX_STANDARD[BOX_STANDARD["MARGIN_VERTICAL"] = 10] = "MARGIN_VERTICAL";
        BOX_STANDARD[BOX_STANDARD["MARGIN_HORIZONTAL"] = 20] = "MARGIN_HORIZONTAL";
        BOX_STANDARD[BOX_STANDARD["PADDING"] = 480] = "PADDING";
        BOX_STANDARD[BOX_STANDARD["PADDING_VERTICAL"] = 160] = "PADDING_VERTICAL";
        BOX_STANDARD[BOX_STANDARD["PADDING_HORIZONTAL"] = 320] = "PADDING_HORIZONTAL";
    })(BOX_STANDARD || (BOX_STANDARD = {}));
    var CSS_STANDARD;
    (function (CSS_STANDARD) {
        CSS_STANDARD[CSS_STANDARD["NONE"] = 0] = "NONE";
        CSS_STANDARD[CSS_STANDARD["UNIT"] = 2] = "UNIT";
        CSS_STANDARD[CSS_STANDARD["AUTO"] = 4] = "AUTO";
        CSS_STANDARD[CSS_STANDARD["LEFT"] = 8] = "LEFT";
        CSS_STANDARD[CSS_STANDARD["BASELINE"] = 16] = "BASELINE";
        CSS_STANDARD[CSS_STANDARD["PERCENT"] = 32] = "PERCENT";
        CSS_STANDARD[CSS_STANDARD["ZERO"] = 64] = "ZERO";
    })(CSS_STANDARD || (CSS_STANDARD = {}));

    var enumeration = /*#__PURE__*/Object.freeze({
        get USER_AGENT () { return USER_AGENT; },
        get APP_FRAMEWORK () { return APP_FRAMEWORK; },
        get APP_SECTION () { return APP_SECTION; },
        get NODE_ALIGNMENT () { return NODE_ALIGNMENT; },
        get NODE_RESOURCE () { return NODE_RESOURCE; },
        get NODE_PROCEDURE () { return NODE_PROCEDURE; },
        get NODE_STANDARD () { return NODE_STANDARD; },
        get BOX_STANDARD () { return BOX_STANDARD; },
        get CSS_STANDARD () { return CSS_STANDARD; }
    });

    const MAP_ELEMENT = {
        INPUT: NODE_STANDARD.NONE,
        PLAINTEXT: NODE_STANDARD.TEXT,
        HR: NODE_STANDARD.LINE,
        SVG: NODE_STANDARD.SVG,
        IMG: NODE_STANDARD.IMAGE,
        SELECT: NODE_STANDARD.SELECT,
        RANGE: NODE_STANDARD.RANGE,
        TEXT: NODE_STANDARD.EDIT,
        PASSWORD: NODE_STANDARD.EDIT,
        NUMBER: NODE_STANDARD.EDIT,
        EMAIL: NODE_STANDARD.EDIT,
        SEARCH: NODE_STANDARD.EDIT,
        URL: NODE_STANDARD.EDIT,
        CHECKBOX: NODE_STANDARD.CHECKBOX,
        RADIO: NODE_STANDARD.RADIO,
        BUTTON: NODE_STANDARD.BUTTON,
        SUBMIT: NODE_STANDARD.BUTTON,
        RESET: NODE_STANDARD.BUTTON,
        TEXTAREA: NODE_STANDARD.EDIT,
        IFRAME: NODE_STANDARD.WEB_VIEW
    };
    const BLOCK_ELEMENT = [
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
        'TFOOT',
        'TH',
        'THEAD',
        'TR',
        'UL',
        'VIDEO'
    ];
    const INLINE_ELEMENT = [
        'A',
        'ABBR',
        'ACRONYM',
        'B',
        'BDO',
        'BIG',
        'BR',
        'BUTTON',
        'CITE',
        'CODE',
        'DFN',
        'EM',
        'I',
        'IFRAME',
        'IMG',
        'INPUT',
        'KBD',
        'LABEL',
        'MAP',
        'OBJECT',
        'Q',
        'S',
        'SAMP',
        'SCRIPT',
        'SELECT',
        'SMALL',
        'SPAN',
        'STRIKE',
        'STRONG',
        'SUB',
        'SUP',
        'TEXTAREA',
        'TIME',
        'TT',
        'U',
        'VAR',
        'PLAINTEXT'
    ];
    const EXT_NAME = {
        EXTERNAL: 'androme.external',
        ORIGIN: 'androme.origin',
        ACCESSIBILITY: 'androme.accessibility',
        CUSTOM: 'androme.custom',
        GRID: 'androme.grid',
        LIST: 'androme.list',
        TABLE: 'androme.table'
    };

    var constant = /*#__PURE__*/Object.freeze({
        MAP_ELEMENT: MAP_ELEMENT,
        BLOCK_ELEMENT: BLOCK_ELEMENT,
        INLINE_ELEMENT: INLINE_ELEMENT,
        EXT_NAME: EXT_NAME
    });

    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const NUMERALS = [
        '', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM',
        '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC',
        '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'
    ];
    function sort(list, asc = 0, ...attrs) {
        return list.sort((a, b) => {
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
    function compareObject(obj1, obj2, attr) {
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
    function formatString(value, ...params) {
        for (let i = 0; i < params.length; i++) {
            value = value.replace(`{${i}}`, params[i]);
        }
        return value;
    }
    function camelToLowerCase(value) {
        value = value.charAt(0).toLowerCase() + value.substring(1);
        const result = value.match(/([a-z]{1}[A-Z]{1})/g);
        if (result) {
            for (const match of result) {
                value = value.replace(match, `${match[0]}_${match[1].toLowerCase()}`);
            }
        }
        return value;
    }
    function convertCamelCase(value, char = '-') {
        value = value.replace(new RegExp(`^${char}+`), '');
        const result = value.match(new RegExp(`(${char}{1}[a-z]{1})`, 'g'));
        if (result) {
            for (const match of result) {
                value = value.replace(match, match[1].toUpperCase());
            }
        }
        return value;
    }
    function convertWord(value) {
        return value ? value.replace(/[^\w]/g, '_').trim() : '';
    }
    function capitalize(value, upper = true) {
        return value ? value.charAt(0)[upper ? 'toUpperCase' : 'toLowerCase']() + value.substring(1)[upper ? 'toLowerCase' : 'toString']() : '';
    }
    function convertInt(value) {
        return (value && parseInt(value)) || 0;
    }
    function convertFloat(value) {
        return (value && parseFloat(value)) || 0;
    }
    function convertPX(value, fontSize) {
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
    function replaceWhiteSpace(value) {
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
    function formatPX(value) {
        value = parseFloat(value);
        return `${!isNaN(value) ? Math.round(value) : 0}px`;
    }
    function convertAlpha(value) {
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
    function convertRoman(value) {
        const digits = value.toString().split('');
        let result = '';
        let i = 3;
        while (i--) {
            result = (NUMERALS[parseInt(digits.pop() || '') + (i * 10)] || '') + result;
        }
        return 'M'.repeat(parseInt(digits.join(''))) + result;
    }
    function convertEnum(value, base, derived) {
        for (const key of Object.keys(base)) {
            const index = base[key];
            if (value === index) {
                return derived[key];
            }
        }
        return '';
    }
    function hasBit(value, type) {
        return (value & type) === type;
    }
    function isNumber(value) {
        return /^-?[0-9]+(\.[0-9]+)?$/.test(value.toString().trim());
    }
    function isString(value) {
        return typeof value === 'string' && value !== '';
    }
    function isUnit(value) {
        return isString(value) ? /^-?[0-9\.]+(px|pt|em)$/.test(value.trim()) : false;
    }
    function isPercent(value) {
        return /^[0-9]+(\.[0-9]+)?%$/.test(value);
    }
    function includes(source, value, delimiter = ',') {
        return source ? source.split(delimiter).map(segment => segment.trim()).includes(value) : false;
    }
    function optional(obj, value, type) {
        let valid = false;
        let result = null;
        if (typeof obj === 'object') {
            result = obj;
            const attrs = value.split('.');
            let i = 0;
            do {
                result = result[attrs[i]] != null ? result[attrs[i]] : null;
            } while (result != null &&
                ++i < attrs.length &&
                typeof result !== 'string' &&
                typeof result !== 'number' &&
                typeof result !== 'boolean');
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
    function resolvePath(value) {
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
    function trimNull(value) {
        return value ? value.trim() : '';
    }
    function trimString(value, char) {
        return value ? trimStart(trimEnd(value, char), char) : '';
    }
    function trimStart(value, char) {
        return value.replace(new RegExp(`^${char}+`, 'g'), '');
    }
    function trimEnd(value, char) {
        return value.replace(new RegExp(`${char}+$`, 'g'), '');
    }
    function repeat(many, value = '\t') {
        return value.repeat(many);
    }
    function indexOf(value, ...terms) {
        for (const term of terms) {
            const index = value.indexOf(term);
            if (index !== -1) {
                return index;
            }
        }
        return -1;
    }
    function lastIndexOf(value, char = '/') {
        return value.substring(value.lastIndexOf(char) + 1);
    }
    function sameValue(obj1, obj2, ...attrs) {
        for (const attr of attrs) {
            const result = compareObject(obj1, obj2, attr);
            if (!result || result[0] !== result[1]) {
                return false;
            }
        }
        return true;
    }
    function searchObject(obj, value) {
        const result = [];
        if (typeof value === 'object') {
            for (const term in value) {
                const attr = value[term];
                if (hasValue(obj[attr])) {
                    result.push([attr, obj[attr]]);
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
            for (const i in obj) {
                if (filter(i)) {
                    result.push([i, obj[i]]);
                }
            }
        }
        return result;
    }
    function hasValue(value) {
        return typeof value !== 'undefined' && value !== null && value.toString().trim() !== '';
    }
    function withinRange(a, b, offset = 0) {
        return b >= (a - offset) && b <= (a + offset);
    }
    function withinFraction(lower, upper) {
        return (lower === upper ||
            Math.floor(lower) === Math.floor(upper) ||
            Math.ceil(lower) === Math.ceil(upper) ||
            Math.ceil(lower) === Math.floor(upper) ||
            Math.floor(lower) === Math.ceil(upper));
    }
    function overwriteDefault(options, namespace, attr, value) {
        if (namespace !== '') {
            if (options[namespace] == null) {
                options[namespace] = {};
            }
            if (options[namespace][attr] == null) {
                options[namespace][attr] = value;
            }
        }
        else {
            if (options[attr] == null) {
                options[attr] = value;
            }
        }
    }
    function partition(list, predicate) {
        const valid = [];
        const invalid = [];
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
    function sortAsc(list, ...attrs) {
        return sort(list, 0, ...attrs);
    }
    function sortDesc(list, ...attrs) {
        return sort(list, 1, ...attrs);
    }

    var util = /*#__PURE__*/Object.freeze({
        formatString: formatString,
        camelToLowerCase: camelToLowerCase,
        convertCamelCase: convertCamelCase,
        convertWord: convertWord,
        capitalize: capitalize,
        convertInt: convertInt,
        convertFloat: convertFloat,
        convertPX: convertPX,
        replaceWhiteSpace: replaceWhiteSpace,
        formatPX: formatPX,
        convertAlpha: convertAlpha,
        convertRoman: convertRoman,
        convertEnum: convertEnum,
        hasBit: hasBit,
        isNumber: isNumber,
        isString: isString,
        isUnit: isUnit,
        isPercent: isPercent,
        includes: includes,
        optional: optional,
        resolvePath: resolvePath,
        trimNull: trimNull,
        trimString: trimString,
        trimStart: trimStart,
        trimEnd: trimEnd,
        repeat: repeat,
        indexOf: indexOf,
        lastIndexOf: lastIndexOf,
        sameValue: sameValue,
        searchObject: searchObject,
        hasValue: hasValue,
        withinRange: withinRange,
        withinFraction: withinFraction,
        overwriteDefault: overwriteDefault,
        partition: partition,
        sortAsc: sortAsc,
        sortDesc: sortDesc
    });

    function isUserAgent(value) {
        let client = USER_AGENT.CHROME;
        if (navigator.appVersion.indexOf('Edge') !== -1) {
            client = USER_AGENT.EDGE;
        }
        else if (navigator.appVersion.indexOf('Chrome') === -1 && navigator.appVersion.indexOf('Safari') !== -1) {
            client = USER_AGENT.SAFARI;
        }
        return hasBit(client, value);
    }
    function getBoxRect() {
        return {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        };
    }
    function getClientRect() {
        return Object.assign({ width: 0, height: 0 }, getBoxRect());
    }
    function getBoxModel() {
        return {
            marginTop: 0,
            marginRight: 0,
            marginBottom: 0,
            marginLeft: 0,
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            paddingLeft: 0
        };
    }
    function setElementCache(element, attr, data) {
        if (element) {
            element[`__${attr}`] = data;
        }
    }
    function getElementCache(element, attr) {
        return element ? element[`__${attr}`] : null;
    }
    function deleteElementCache(element, ...attrs) {
        if (element) {
            for (const attr of attrs) {
                delete element[`__${attr}`];
            }
        }
    }
    function getNodeFromElement(element) {
        return getElementCache(element, 'node');
    }
    function getRangeClientRect(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const domRect = Array.from(range.getClientRects()).filter(item => !(Math.round(item.width) === 0 && withinFraction(item.left, item.right)));
        let result = getClientRect();
        let multiLine = false;
        if (domRect.length > 0) {
            result = assignBounds(domRect[0]);
            const top = new Set([result.top]);
            const bottom = new Set([result.bottom]);
            for (let i = 1; i < domRect.length; i++) {
                const rect = domRect[i];
                top.add(rect.top);
                bottom.add(rect.bottom);
                result.width += rect.width;
                result.right = Math.max(rect.right, result.right);
                result.height = Math.max(rect.height, result.height);
            }
            if (top.size > 1 && bottom.size > 1) {
                result.top = Math.min.apply(null, Array.from(top));
                result.bottom = Math.max.apply(null, Array.from(bottom));
                if (domRect[domRect.length - 1].top >= domRect[0].bottom &&
                    element.textContent && (element.textContent.trim() !== '' ||
                    /^\s*\n/.test(element.textContent))) {
                    multiLine = true;
                }
            }
        }
        return [result, multiLine];
    }
    function assignBounds(bounds) {
        return {
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
            left: bounds.left,
            width: bounds.width,
            height: bounds.height
        };
    }
    function getStyle(element, cache = true) {
        if (element) {
            if (cache) {
                const node = getNodeFromElement(element);
                const style = getElementCache(element, 'style');
                if (style) {
                    return style;
                }
                else if (node) {
                    if (node.style) {
                        return node.style;
                    }
                    else if (node.plainText) {
                        return node.styleMap;
                    }
                }
            }
            if (element.nodeName && element.nodeName.charAt(0) !== '#') {
                const style = getComputedStyle(element);
                setElementCache(element, 'style', style);
                return style;
            }
        }
        return {};
    }
    function getBoxSpacing(element, complete = false, merge = false) {
        const result = {};
        const node = getNodeFromElement(element);
        const style = getStyle(element);
        ['Top', 'Left', 'Right', 'Bottom'].forEach(direction => {
            let total = 0;
            ['padding', 'margin'].forEach(region => {
                const attr = region + direction;
                const value = convertInt((node || style)[attr]);
                if (complete || value !== 0) {
                    result[attr] = value;
                }
                total += value;
            });
            if (merge) {
                result[`padding${direction}`] = total;
                if (complete) {
                    result[`margin${direction}`] = 0;
                }
                else {
                    delete result[`margin${direction}`];
                }
            }
        });
        return result;
    }
    function cssResolveUrl(value) {
        const match = value.match(/^url\("?(.*?)"?\)$/);
        if (match) {
            return resolvePath(match[1]);
        }
        return '';
    }
    function cssInherit(element, attr, exclude, tagNames) {
        let result = '';
        let current = element.parentElement;
        while (current && (tagNames == null || !tagNames.includes(current.tagName))) {
            result = getStyle(current)[attr] || '';
            if (result === 'inherit' || (exclude && exclude.some(value => result.indexOf(value) !== -1))) {
                result = '';
            }
            if (current === document.body || result) {
                break;
            }
            current = current.parentElement;
        }
        return result;
    }
    function cssParent(element, attr, ...styles) {
        if (element.nodeName.charAt(0) !== '#') {
            if (styles.includes(getStyle(element)[attr])) {
                return true;
            }
        }
        if (element.parentElement) {
            return styles.includes(getStyle(element.parentElement)[attr]);
        }
        return false;
    }
    function cssFromParent(element, attr) {
        if (isStyleElement(element) && element.parentElement) {
            const node = getNodeFromElement(element);
            const style = getStyle(element);
            return (style &&
                style[attr] === getStyle(element.parentElement)[attr] && (!node ||
                !node.styleMap[attr]));
        }
        return false;
    }
    function cssAttribute(element, attr) {
        return element.getAttribute(attr) || getStyle(element)[convertCamelCase(attr)] || '';
    }
    function hasFreeFormText(element, maxDepth = 0, whiteSpace = true) {
        let valid = false;
        let depth = -1;
        function findFreeForm(elements) {
            if (depth++ === maxDepth) {
                return true;
            }
            return elements.some((item) => {
                if (item.nodeName === '#text') {
                    if (isPlainText(item, whiteSpace) || (cssParent(item, 'whiteSpace', 'pre', 'pre-wrap') && item.textContent && item.textContent !== '')) {
                        valid = true;
                        return true;
                    }
                }
                else if (item instanceof HTMLElement && item.childNodes.length > 0) {
                    return findFreeForm(Array.from(item.childNodes));
                }
                return false;
            });
        }
        if (element.nodeName === '#text') {
            maxDepth = 0;
            findFreeForm([element]);
        }
        else {
            findFreeForm(Array.from(element.childNodes));
        }
        return valid;
    }
    function isPlainText(element, whiteSpace = false) {
        if (element && element.nodeName === '#text' && element.textContent) {
            if (whiteSpace) {
                const value = element.textContent;
                let valid = false;
                for (let i = 0; i < value.length; i++) {
                    switch (value.charCodeAt(i)) {
                        case 9:
                        case 10:
                        case 13:
                        case 32:
                            continue;
                        default:
                            valid = true;
                            break;
                    }
                }
                return valid && value !== '';
            }
            else {
                return element.textContent.trim() !== '';
            }
        }
        return false;
    }
    function hasLineBreak(element) {
        if (element) {
            const node = getNodeFromElement(element);
            const fromParent = element.nodeName === '#text';
            const whiteSpace = node ? node.css('whiteSpace') : (getStyle(element).whiteSpace || '');
            return ((element instanceof HTMLElement && element.children.length > 0 && Array.from(element.children).some(item => item.tagName === 'BR')) ||
                (/\n/.test(element.textContent || '') && (['pre', 'pre-wrap'].includes(whiteSpace) ||
                    (fromParent && cssParent(element, 'whiteSpace', 'pre', 'pre-wrap')))));
        }
        return false;
    }
    function isLineBreak(element, excluded = true) {
        const node = getNodeFromElement(element);
        if (node) {
            return (node.tagName === 'BR' ||
                (excluded && node.block && (node.excluded ||
                    node.textContent.trim() === '')));
        }
        return false;
    }
    function getElementsBetweenSiblings(firstElement, secondElement, cacheNode = false, whiteSpace = false) {
        if (!firstElement || firstElement.parentElement === secondElement.parentElement) {
            const parentElement = secondElement.parentElement;
            if (parentElement) {
                const elements = Array.from(parentElement.childNodes);
                const firstIndex = firstElement ? elements.findIndex(element => element === firstElement) : 0;
                const secondIndex = elements.findIndex(element => element === secondElement);
                if (firstIndex !== -1 && secondIndex !== -1 && firstIndex !== secondIndex) {
                    let result = elements.slice(Math.min(firstIndex, secondIndex) + 1, Math.max(firstIndex, secondIndex));
                    if (!whiteSpace) {
                        result = result.filter(element => {
                            if (element.nodeName.charAt(0) === '#') {
                                return isPlainText(element);
                            }
                            return true;
                        });
                    }
                    else {
                        result = result.filter(element => element.nodeName !== '#comment');
                    }
                    if (cacheNode) {
                        result = result.filter(element => getNodeFromElement(element));
                    }
                    return result;
                }
            }
        }
        return [];
    }
    function isStyleElement(element) {
        return element instanceof HTMLElement || element instanceof SVGSVGElement;
    }
    function isElementVisible(element) {
        if (!getElementCache(element, 'inlineSupport') && !(element.parentElement instanceof SVGSVGElement)) {
            if (isStyleElement(element)) {
                if (typeof element.getBoundingClientRect === 'function') {
                    const bounds = element.getBoundingClientRect();
                    if ((bounds.width !== 0 && bounds.height !== 0) || hasValue(element.dataset.ext) || getStyle(element).clear !== 'none') {
                        return true;
                    }
                    else {
                        let current = element.parentElement;
                        let valid = true;
                        while (current) {
                            if (getStyle(current).display === 'none') {
                                valid = false;
                                break;
                            }
                            current = current.parentElement;
                        }
                        if (valid) {
                            if (element.children.length > 0) {
                                return Array.from(element.children).some((item) => {
                                    const style = getStyle(item);
                                    const float = style.cssFloat;
                                    const position = style.position;
                                    return ((position !== 'static' && position !== 'initial') ||
                                        float === 'left' ||
                                        float === 'right');
                                });
                            }
                        }
                    }
                }
                return false;
            }
            else {
                return isPlainText(element);
            }
        }
        return false;
    }
    function findNestedExtension(element, name) {
        if (isStyleElement(element)) {
            return Array.from(element.children).find((item) => includes(item.dataset.ext, name));
        }
        return null;
    }

    var dom = /*#__PURE__*/Object.freeze({
        isUserAgent: isUserAgent,
        getBoxRect: getBoxRect,
        getClientRect: getClientRect,
        getBoxModel: getBoxModel,
        setElementCache: setElementCache,
        getElementCache: getElementCache,
        deleteElementCache: deleteElementCache,
        getNodeFromElement: getNodeFromElement,
        getRangeClientRect: getRangeClientRect,
        assignBounds: assignBounds,
        getStyle: getStyle,
        getBoxSpacing: getBoxSpacing,
        cssResolveUrl: cssResolveUrl,
        cssInherit: cssInherit,
        cssParent: cssParent,
        cssFromParent: cssFromParent,
        cssAttribute: cssAttribute,
        hasFreeFormText: hasFreeFormText,
        isPlainText: isPlainText,
        hasLineBreak: hasLineBreak,
        isLineBreak: isLineBreak,
        getElementsBetweenSiblings: getElementsBetweenSiblings,
        isStyleElement: isStyleElement,
        isElementVisible: isElementVisible,
        findNestedExtension: findNestedExtension
    });

    class Node {
        constructor(id, element) {
            this.id = id;
            this.styleMap = {};
            this.nodeType = 0;
            this.alignmentType = 0;
            this.depth = -1;
            this.siblingIndex = Number.MAX_VALUE;
            this.renderIndex = Number.MAX_VALUE;
            this.renderPosition = -1;
            this.excludeSection = 0;
            this.excludeProcedure = 0;
            this.excludeResource = 0;
            this.renderExtension = new Set();
            this.documentRoot = false;
            this.auto = true;
            this.visible = true;
            this.excluded = false;
            this.rendered = false;
            this._data = {};
            this._initialized = false;
            this.initial = {
                depth: -1,
                children: [],
                styleMap: {},
                bounds: getClientRect()
            };
            if (element) {
                this._element = element;
                this.init();
            }
        }
        init() {
            if (!this._initialized) {
                if (this.styleElement) {
                    const element = this._element;
                    const styleMap = getElementCache(element, 'styleMap') || {};
                    for (const inline of Array.from(element.style)) {
                        styleMap[convertCamelCase(inline)] = element.style[inline];
                    }
                    this.style = getElementCache(element, 'style') || getComputedStyle(element);
                    this.styleMap = Object.assign({}, styleMap);
                    Object.assign(this.initial.styleMap, styleMap);
                }
                if (this.id !== 0) {
                    setElementCache(this._element, 'node', this);
                }
                this._initialized = true;
            }
        }
        is(...views) {
            for (const value of views) {
                if (this.nodeType === value) {
                    return true;
                }
            }
            return false;
        }
        of(nodeType, ...alignmentType) {
            if (this.nodeType === nodeType) {
                for (const value of alignmentType) {
                    if (this.hasAlign(value)) {
                        return true;
                    }
                }
            }
            return false;
        }
        attr(obj, attr, value = '', overwrite = true) {
            const name = `_${obj || '_'}`;
            if (hasValue(value)) {
                if (this[name] == null) {
                    this._namespaces.add(obj);
                    this[name] = {};
                }
                if (!overwrite && this[name][attr] != null) {
                    return '';
                }
                this[name][attr] = value.toString();
            }
            return this[name][attr] || '';
        }
        get(obj) {
            const name = `_${obj || '_'}`;
            return this[name] || {};
        }
        delete(obj, ...attrs) {
            const name = `_${obj || '_'}`;
            if (this[name]) {
                for (const attr of attrs) {
                    if (attr.indexOf('*') !== -1) {
                        for (const [key] of searchObject(this[name], attr)) {
                            delete this[name][key];
                        }
                    }
                    else {
                        delete this[name][attr];
                    }
                }
            }
        }
        apply(options = {}) {
            for (const obj in options) {
                const attrs = options[obj];
                if (typeof attrs === 'object') {
                    for (const attr in attrs) {
                        this.attr(obj, attr, attrs[attr]);
                    }
                    delete options[obj];
                }
            }
        }
        each(predicate, rendered = false) {
            (rendered ? this.renderChildren : this.children).forEach(predicate);
            return this;
        }
        render(parent) {
            this.renderParent = parent;
            this.renderDepth = this.documentRoot || this === parent || hasValue(parent.dataset.target) ? 0 : parent.renderDepth + 1;
            this.rendered = true;
        }
        hide() {
            this.rendered = true;
            this.visible = false;
        }
        data(obj, attr, value, overwrite = true) {
            if (hasValue(value)) {
                if (this._data[obj] == null) {
                    this._data[obj] = {};
                }
                if (overwrite || this._data[obj][attr] == null) {
                    this._data[obj][attr] = value;
                }
            }
            return this._data[obj] != null ? this._data[obj][attr] : null;
        }
        ascend(generated = false, levels = -1) {
            const result = [];
            const attr = generated ? 'parent' : 'documentParent';
            let current = this[attr];
            let i = -1;
            while (current && current.id !== 0 && !result.includes(current)) {
                result.push(current);
                if (++i === levels) {
                    break;
                }
                current = current[attr];
            }
            return result;
        }
        cascade() {
            function cascade(node) {
                const current = [...node.children];
                for (const item of node.children) {
                    current.push(...cascade(item));
                }
                return current;
            }
            return cascade(this);
        }
        inherit(node, ...props) {
            if (this._initialized) {
                function copyMap(source, destination) {
                    for (const attr in source) {
                        if (source[attr] == null) {
                            destination[attr] = source[attr];
                        }
                    }
                }
                for (const type of props) {
                    switch (type) {
                        case 'initial':
                            Object.assign(this.initial, node.initial);
                            break;
                        case 'base':
                            this.style = node.style;
                        case 'dimensions':
                            this.bounds = assignBounds(node.bounds);
                            this.linear = assignBounds(node.linear);
                            this.box = assignBounds(node.box);
                            break;
                        case 'data':
                            for (const obj in this._data) {
                                for (const name in this._data[obj]) {
                                    const source = this._data[obj][name];
                                    if (typeof source === 'object' && source.inherit === true) {
                                        const destination = node.data(obj, name);
                                        if (destination) {
                                            for (const attr in source) {
                                                switch (typeof source[attr]) {
                                                    case 'number':
                                                        destination[attr] += source[attr];
                                                        break;
                                                    case 'boolean':
                                                        if (source[attr] === true) {
                                                            destination[attr] = true;
                                                        }
                                                        break;
                                                    default:
                                                        destination[attr] = source[attr];
                                                        break;
                                                }
                                            }
                                        }
                                        else {
                                            node.data(obj, name, source);
                                        }
                                        delete this._data[obj][name];
                                    }
                                }
                            }
                            break;
                        case 'alignment':
                            ['position', 'display', 'verticalAlign', 'cssFloat', 'clear'].forEach(attr => {
                                this.styleMap[attr] = node.css(attr);
                                this.initial.styleMap[attr] = node.cssInitial(attr);
                            });
                            if (node.css('marginLeft') === 'auto') {
                                this.styleMap.marginLeft = 'auto';
                                this.initial.styleMap.marginLeft = 'auto';
                            }
                            if (node.css('marginRight') === 'auto') {
                                this.styleMap.marginRight = 'auto';
                                this.initial.styleMap.marginRight = 'auto';
                            }
                            break;
                        case 'style':
                            const style = { whiteSpace: node.css('whiteSpace') };
                            for (const attr in node.style) {
                                if (attr.startsWith('font') || attr.startsWith('color')) {
                                    const key = convertCamelCase(attr);
                                    style[key] = node.style[key];
                                }
                            }
                            this.css(style);
                            break;
                        case 'styleMap':
                            copyMap(node.styleMap, this.styleMap);
                            break;
                    }
                }
            }
        }
        alignedVertically(previous, cleared = new Map(), firstNode = false) {
            if (this.documentParent.baseElement === previous.documentParent.baseElement) {
                const widthParent = this.documentParent.has('width', CSS_STANDARD.UNIT) ? this.documentParent.toInt('width') : this.documentParent.box.width;
                return (this.lineBreak ||
                    previous.lineBreak ||
                    previous.blockStatic ||
                    (previous.bounds && previous.bounds.width > widthParent && (!previous.textElement || previous.css('whiteSpace') === 'nowrap')) ||
                    (previous.float === 'left' && this.autoMarginRight) ||
                    (previous.float === 'right' && this.autoMarginLeft) ||
                    (!previous.floating && ((!this.inlineElement && !this.floating) || this.blockStatic)) ||
                    (previous.plainText && previous.multiLine && (this.parent && !this.parent.is(NODE_STANDARD.RELATIVE))) ||
                    (this.blockStatic && (!previous.inlineElement || (cleared.has(previous) && previous.floating))) ||
                    (!firstNode && cleared.has(this)) ||
                    (!firstNode && this.floating && previous.floating && this.linear.top >= previous.linear.bottom));
            }
            return false;
        }
        intersect(rect, dimension = 'linear') {
            const bounds = this[dimension] || this.linear;
            const top = rect.top > bounds.top && rect.top < bounds.bottom;
            const right = Math.floor(rect.right) > Math.ceil(bounds.left) && rect.right < bounds.right;
            const bottom = Math.floor(rect.bottom) > Math.ceil(bounds.top) && rect.bottom < bounds.bottom;
            const left = rect.left > bounds.left && rect.left < bounds.right;
            return (top && (left || right)) || (bottom && (left || right));
        }
        intersectX(rect, dimension = 'linear') {
            const bounds = this[dimension] || this.linear;
            return ((rect.top >= bounds.top && rect.top < bounds.bottom) ||
                (rect.bottom > bounds.top && rect.bottom <= bounds.bottom) ||
                (bounds.top >= rect.top && this[dimension].bottom <= rect.bottom) ||
                (rect.top >= bounds.top && rect.bottom <= bounds.bottom));
        }
        intersectY(rect, dimension = 'linear') {
            const bounds = this[dimension] || this.linear;
            return ((rect.left >= bounds.left && rect.left < bounds.right) ||
                (rect.right > bounds.left && rect.right <= bounds.right) ||
                (bounds.left >= rect.left && bounds.right <= rect.right) ||
                (rect.left >= bounds.left && rect.right <= bounds.right));
        }
        withinX(rect, dimension = 'linear') {
            const bounds = this[dimension] || this.linear;
            return bounds.top >= rect.top && bounds.bottom <= rect.bottom;
        }
        withinY(rect, dimension = 'linear') {
            const bounds = this[dimension] || this.linear;
            return bounds.left >= rect.left && bounds.right <= rect.right;
        }
        outsideX(rect, dimension = 'linear') {
            const bounds = this[dimension] || this.linear;
            return bounds.right < rect.left || bounds.left > rect.right;
        }
        outsideY(rect, dimension = 'linear') {
            const bounds = this[dimension] || this.linear;
            return bounds.bottom < rect.top || bounds.top > rect.bottom;
        }
        css(attr, value = '') {
            if (typeof attr === 'object') {
                Object.assign(this.styleMap, attr);
                return '';
            }
            else {
                if (arguments.length === 2) {
                    this.styleMap[attr] = hasValue(value) ? value : '';
                }
                return this.styleMap[attr] || (this.style && this.style[attr]) || '';
            }
        }
        cssInitial(attr, complete = false) {
            return this.initial.styleMap[attr] || (complete ? this.css(attr) : '');
        }
        cssParent(attr, startChild = false, ignoreHidden = false) {
            let result = '';
            if (this.baseElement) {
                let current = startChild ? this : getNodeFromElement(this.baseElement.parentElement);
                while (current) {
                    result = current.initial.styleMap[attr] || '';
                    if (result || current.documentBody) {
                        if (ignoreHidden && !current.visible) {
                            result = '';
                        }
                        break;
                    }
                    current = getNodeFromElement(current.baseElement.parentElement);
                }
            }
            return result;
        }
        has(attr, checkType = 0, options) {
            const value = (options && options.map === 'initial' ? this.initial.styleMap : this.styleMap)[attr];
            if (hasValue(value)) {
                switch (value) {
                    case '0px':
                        if (hasBit(checkType, CSS_STANDARD.ZERO)) {
                            return true;
                        }
                    case 'left':
                        if (hasBit(checkType, CSS_STANDARD.LEFT)) {
                            return true;
                        }
                    case 'baseline':
                        if (hasBit(checkType, CSS_STANDARD.BASELINE)) {
                            return true;
                        }
                    case 'auto':
                        if (hasBit(checkType, CSS_STANDARD.AUTO)) {
                            return true;
                        }
                    case 'none':
                    case 'initial':
                    case 'normal':
                    case 'transparent':
                    case 'rgba(0, 0, 0, 0)':
                        return false;
                    default:
                        if (options) {
                            if (options.not != null) {
                                if (Array.isArray(options.not)) {
                                    for (const exclude of options.not) {
                                        if (value === exclude) {
                                            return false;
                                        }
                                    }
                                }
                                else {
                                    if (value === options.not) {
                                        return false;
                                    }
                                }
                            }
                        }
                        let result = checkType === 0;
                        if (hasBit(checkType, CSS_STANDARD.UNIT) && isUnit(value)) {
                            result = true;
                        }
                        if (hasBit(checkType, CSS_STANDARD.PERCENT) && isPercent(value)) {
                            result = true;
                        }
                        if (hasBit(checkType, CSS_STANDARD.AUTO)) {
                            result = false;
                        }
                        return result;
                }
            }
            return false;
        }
        isSet(obj, attr) {
            return this[obj] && this[obj][attr] != null ? hasValue(this[obj][attr]) : false;
        }
        hasBit(attr, value) {
            if (this[attr] != null) {
                return hasBit(this[attr], value);
            }
            return false;
        }
        toInt(attr, defaultValue = 0, options) {
            const value = (options && options.map === 'initial' ? this.initial.styleMap : this.styleMap)[attr];
            return parseInt(value) || defaultValue;
        }
        hasAlign(value) {
            return hasBit(this.alignmentType, value);
        }
        setExclusions() {
            if (this.styleElement) {
                [['excludeSection', APP_SECTION], ['excludeProcedure', NODE_PROCEDURE], ['excludeResource', NODE_RESOURCE]].forEach((item) => {
                    let exclude = this.dataset[item[0]] || '';
                    if (this._element.parentElement) {
                        exclude += '|' + trimNull(this._element.parentElement.dataset[`${item[0]}Child`]);
                    }
                    exclude.split('|').map(value => value.toUpperCase().trim()).forEach(value => {
                        if (item[1][value] != null) {
                            this[item[0]] |= item[1][value];
                        }
                    });
                });
            }
        }
        setBounds(calibrate = false) {
            if (this._element) {
                if (!calibrate) {
                    if (this.styleElement) {
                        this.bounds = assignBounds(this._element.getBoundingClientRect());
                    }
                    else {
                        const bounds = getRangeClientRect(this._element);
                        if (bounds[0]) {
                            this.bounds = bounds[0];
                        }
                    }
                }
            }
            if (this.bounds) {
                if (this.initial.bounds.width === 0 && this.initial.bounds.height === 0) {
                    Object.assign(this.initial.bounds, assignBounds(this.bounds));
                }
                this.linear = {
                    top: this.bounds.top - (this.marginTop > 0 ? this.marginTop : 0),
                    right: this.bounds.right + this.marginRight,
                    bottom: this.bounds.bottom + this.marginBottom,
                    left: this.bounds.left - (this.marginLeft > 0 ? this.marginLeft : 0),
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
        setDimensions(region = ['linear', 'box']) {
            for (const dimension of region) {
                const bounds = this[dimension];
                bounds.width = this.bounds.width;
                if (!this.plainText) {
                    switch (dimension) {
                        case 'linear':
                            bounds.width += (this.marginLeft > 0 ? this.marginLeft : 0) + this.marginRight;
                            break;
                        case 'box':
                            bounds.width -= this.paddingLeft + this.borderLeftWidth + this.paddingRight + this.borderRightWidth;
                            break;
                    }
                }
                bounds.height = bounds.bottom - bounds.top;
                if (this.initial[dimension] == null) {
                    this.initial[dimension] = assignBounds(bounds);
                }
            }
        }
        setMultiLine() {
            if (this._element) {
                this._multiLine = false;
                switch (this._element.tagName) {
                    case 'IMG':
                    case 'INPUT':
                    case 'BUTTON':
                    case 'TEXTAREA':
                    case 'HR':
                    case 'IFRAME':
                        return;
                    default:
                        if (this.textElement) {
                            const [bounds, multiLine] = getRangeClientRect(this._element);
                            if (this.plainText) {
                                if (bounds) {
                                    this.bounds = bounds;
                                    this.setBounds(true);
                                }
                                else {
                                    this.hide();
                                }
                                this.multiLine = multiLine;
                            }
                            else {
                                if (!this.hasWidth && (this.blockStatic ||
                                    this.display === 'table-cell' ||
                                    hasLineBreak(this._element))) {
                                    this.multiLine = multiLine;
                                }
                            }
                        }
                        break;
                }
            }
            else {
                this._multiLine = false;
            }
        }
        getParentElementAsNode(negative = false, containerDefault) {
            if (this._element) {
                let parent = getNodeFromElement(this._element.parentElement);
                if (!this.pageflow) {
                    let found = false;
                    let previous = null;
                    let relativeParent = null;
                    let outside = false;
                    while (parent && parent.id !== 0) {
                        if (!relativeParent && this.position === 'absolute') {
                            if (!['static', 'initial'].includes(parent.position)) {
                                const top = convertInt(this.top);
                                const left = convertInt(this.left);
                                if ((top >= 0 && left >= 0) ||
                                    !negative ||
                                    (negative && Math.abs(top) <= parent.marginTop && Math.abs(left) <= parent.marginLeft) ||
                                    this.imageElement) {
                                    if (negative &&
                                        !parent.documentRoot &&
                                        top !== 0 &&
                                        left !== 0 &&
                                        this.bottom == null &&
                                        this.right == null &&
                                        (this.outsideX(parent.linear) || this.outsideY(parent.linear))) {
                                        outside = true;
                                    }
                                    else {
                                        found = true;
                                        break;
                                    }
                                }
                                relativeParent = parent;
                            }
                        }
                        else {
                            if ((this.withinX(parent.box) && this.withinY(parent.box)) ||
                                (previous && ((this.linear.top >= parent.linear.top && this.linear.top < previous.linear.top) ||
                                    (this.linear.right <= parent.linear.right && this.linear.right > previous.linear.right) ||
                                    (this.linear.bottom <= parent.linear.bottom && this.linear.bottom > previous.linear.bottom) ||
                                    (this.linear.left >= parent.linear.left && this.linear.left < previous.linear.left)))) {
                                found = true;
                                break;
                            }
                        }
                        previous = parent;
                        parent = getNodeFromElement(parent.element.parentElement);
                    }
                    if (!found) {
                        parent = outside && containerDefault ? containerDefault : relativeParent;
                    }
                }
                return parent;
            }
            return null;
        }
        remove(node) {
            for (let i = 0; i < this.children.length; i++) {
                if (node === this.children[i]) {
                    this.children.splice(i, 1);
                    break;
                }
            }
        }
        appendRendered(node) {
            if (this.renderChildren.indexOf(node) === -1) {
                node.renderIndex = this.renderChildren.length;
                this.renderChildren.push(node);
            }
        }
        resetBox(region, node, negative = false) {
            const attrs = [];
            if (hasBit(region, BOX_STANDARD.MARGIN)) {
                attrs.push('marginTop', 'marginRight', 'marginBottom', 'marginLeft');
            }
            if (hasBit(region, BOX_STANDARD.PADDING)) {
                attrs.push('paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft');
            }
            for (const attr of attrs) {
                this._boxReset[attr] = 1;
                if (node) {
                    node.modifyBox(attr, this[attr], negative);
                }
            }
        }
        removeElement() {
            if (this._element) {
                if (this._nodeName == null) {
                    this._nodeName = this.nodeName;
                }
                if (this._tagName == null) {
                    this._tagName = this.tagName;
                }
                this._baseElement = this._element;
                this._element = undefined;
            }
        }
        previousSibling(pageflow = false, lineBreak = true, excluded = true) {
            let element = null;
            if (this._element) {
                element = this._element.previousSibling;
            }
            else if (this.initial.children.length > 0) {
                const list = this.initial.children.filter(node => pageflow ? node.pageflow : node.siblingflow);
                element = list.length > 0 ? list[0].element.previousSibling : null;
            }
            while (element) {
                const node = getNodeFromElement(element);
                if (node &&
                    !(node.lineBreak && !lineBreak) &&
                    !(node.excluded && !excluded) && ((pageflow && node.pageflow) ||
                    (!pageflow && node.siblingflow))) {
                    return node;
                }
                element = element.previousSibling;
            }
            return null;
        }
        nextSibling(pageflow = false, lineBreak = true, excluded = true) {
            let element = null;
            if (this._element) {
                element = this._element.nextSibling;
            }
            else if (this.initial.children.length > 0) {
                const list = this.initial.children.filter(node => pageflow ? node.pageflow : node.siblingflow);
                element = list.length > 0 ? list[0].element.nextSibling : null;
            }
            while (element) {
                const node = getNodeFromElement(element);
                if (node &&
                    !(node.lineBreak && !lineBreak) &&
                    !(node.excluded && !excluded) && ((pageflow && node.pageflow) ||
                    (!pageflow && node.siblingflow))) {
                    return node;
                }
                element = element.nextSibling;
            }
            return null;
        }
        actualLeft(dimension = 'linear') {
            return this.companion && !this.companion.visible && this.companion[dimension] ? Math.min(this[dimension].left, this.companion[dimension].left) : this[dimension].left;
        }
        actualRight(dimension = 'linear') {
            return this.companion && !this.companion.visible && this.companion[dimension] ? Math.max(this[dimension].right, this.companion[dimension].right) : this[dimension].right;
        }
        boxAttribute(region, direction) {
            const attr = region + direction;
            if (this.styleElement) {
                const value = this.css(attr);
                if (isPercent(value)) {
                    return this.style[attr] && this.style[attr] !== value ? convertInt(this.style[attr]) : this.documentParent.box[(direction === 'Left' || direction === 'Right' ? 'width' : 'height')] * (convertInt(value) / 100);
                }
                else {
                    return convertInt(value);
                }
            }
            else {
                return convertInt(this.css(attr));
            }
        }
        getOverflow() {
            if (this._overflow == null) {
                this._overflow = 0;
                if (this.styleElement) {
                    const [overflow, overflowX, overflowY] = [this.css('overflow'), this.css('overflowX'), this.css('overflowY')];
                    if (this.toInt('width') > 0 && (overflow === 'scroll' ||
                        overflowX === 'scroll' ||
                        (overflowX === 'auto' && this._element.clientWidth !== this._element.scrollWidth))) {
                        this._overflow |= NODE_ALIGNMENT.HORIZONTAL;
                    }
                    if (this.toInt('height') > 0 && (overflow === 'scroll' ||
                        overflowY === 'scroll' ||
                        (overflowY === 'auto' && this._element.clientHeight !== this._element.scrollHeight))) {
                        this._overflow |= NODE_ALIGNMENT.VERTICAL;
                    }
                }
            }
            return this._overflow;
        }
        set parent(value) {
            if (value !== this._parent) {
                if (this._parent) {
                    this._parent.remove(this);
                }
                this._parent = value;
            }
            if (value) {
                if (!value.children.includes(this)) {
                    value.children.push(this);
                    if (!value.styleElement && this.siblingIndex !== -1) {
                        value.siblingIndex = Math.min(this.siblingIndex, value.siblingIndex);
                    }
                }
                if (this.initial.depth === -1) {
                    this.initial.depth = value.depth + 1;
                }
                this.depth = value.depth + 1;
            }
            else {
                this.depth = -1;
            }
        }
        get parent() {
            return this._parent;
        }
        set nodeName(value) {
            this._nodeName = value;
        }
        get nodeName() {
            return (this._nodeName ||
                (this.styleElement ? (this.tagName === 'INPUT' ? this._element.type : this.tagName).toUpperCase() : ''));
        }
        set element(value) {
            this._element = value;
        }
        get element() {
            return this._element || { dataset: {}, style: {} };
        }
        get baseElement() {
            return this._baseElement || this.element;
        }
        get tagName() {
            return (this._tagName || (this._element && this._element.tagName) || '').toUpperCase();
        }
        get htmlElement() {
            return this._element instanceof HTMLElement;
        }
        get domElement() {
            return this.styleElement || this.plainText;
        }
        get styleElement() {
            return this._element instanceof HTMLElement || this.svgElement;
        }
        get documentBody() {
            return this._element === document.body;
        }
        set renderAs(value) {
            if (!this.rendered && !value.rendered) {
                this._renderAs = value;
            }
        }
        get renderAs() {
            return this._renderAs;
        }
        set renderDepth(value) {
            this._renderDepth = value;
        }
        get renderDepth() {
            if (this._renderDepth == null) {
                if (this.documentRoot) {
                    this._renderDepth = 0;
                }
                else {
                    if (this.parent) {
                        this._renderDepth = this.parent.renderDepth + 1;
                    }
                }
            }
            return this._renderDepth || 0;
        }
        get dataset() {
            return this._element instanceof HTMLElement ? this._element.dataset : {};
        }
        get extension() {
            return this.dataset.ext ? this.dataset.ext.split(',')[0].trim() : '';
        }
        get flex() {
            const style = this.style;
            if (style) {
                return {
                    enabled: (style.display.indexOf('flex') !== -1),
                    direction: style.flexDirection,
                    basis: style.flexBasis,
                    grow: convertInt(style.flexGrow),
                    shrink: convertInt(style.flexShrink),
                    wrap: style.flexWrap,
                    alignSelf: (!this.has('alignSelf') && this.documentParent.has('alignItems') ? this.documentParent.css('alignItems') : style.alignSelf),
                    justifyContent: style.justifyContent,
                    order: convertInt(style.order)
                };
            }
            return { enabled: false };
        }
        get viewWidth() {
            return this.inlineStatic || this.has('width', CSS_STANDARD.PERCENT) ? 0 : this.toInt('width') || this.toInt('minWidth');
        }
        get viewHeight() {
            return this.inlineStatic || this.has('height', CSS_STANDARD.PERCENT) ? 0 : this.toInt('height') || this.toInt('minHeight');
        }
        get hasWidth() {
            return !this.inlineStatic ? this.has('width', CSS_STANDARD.UNIT | CSS_STANDARD.PERCENT, { map: 'initial', not: ['0px', '0%'] }) || this.toInt('minWidth') > 0 : false;
        }
        get hasHeight() {
            return !this.inlineStatic ? this.has('height', CSS_STANDARD.UNIT | CSS_STANDARD.PERCENT, { map: 'initial', not: ['0px', '0%'] }) || this.toInt('minHeight') > 0 : false;
        }
        get lineHeight() {
            if (this.rendered) {
                if (this._lineHeight == null) {
                    this._lineHeight = 0;
                    if (this.children.length === 0 && !this.renderParent.linearHorizontal) {
                        const lineHeight = this.toInt('lineHeight');
                        if (this.inlineElement) {
                            this._lineHeight = lineHeight || this.documentParent.toInt('lineHeight');
                        }
                        else {
                            this._lineHeight = lineHeight;
                        }
                    }
                }
                return this._lineHeight;
            }
            return 0;
        }
        get display() {
            return this.css('display');
        }
        get position() {
            return this.css('position');
        }
        get top() {
            const value = this.styleMap.top;
            return !value || value === 'auto' ? null : convertInt(value);
        }
        get right() {
            const value = this.styleMap.right;
            return !value || value === 'auto' ? null : convertInt(value);
        }
        get bottom() {
            const value = this.styleMap.bottom;
            return !value || value === 'auto' ? null : convertInt(value);
        }
        get left() {
            const value = this.styleMap.left;
            return !value || value === 'auto' ? null : convertInt(value);
        }
        get marginTop() {
            return this.inlineStatic ? 0 : this.boxAttribute('margin', 'Top');
        }
        get marginRight() {
            return this.boxAttribute('margin', 'Right');
        }
        get marginBottom() {
            return this.inlineStatic ? 0 : this.boxAttribute('margin', 'Bottom');
        }
        get marginLeft() {
            return this.boxAttribute('margin', 'Left');
        }
        get borderTopWidth() {
            return this.css('borderTopStyle') !== 'none' ? convertInt(this.css('borderTopWidth')) : 0;
        }
        get borderRightWidth() {
            return this.css('borderRightStyle') !== 'none' ? convertInt(this.css('borderRightWidth')) : 0;
        }
        get borderBottomWidth() {
            return this.css('borderBottomStyle') !== 'none' ? convertInt(this.css('borderBottomWidth')) : 0;
        }
        get borderLeftWidth() {
            return this.css('borderLeftStyle') !== 'none' ? convertInt(this.css('borderLeftWidth')) : 0;
        }
        get paddingTop() {
            return this.boxAttribute('padding', 'Top');
        }
        get paddingRight() {
            return this.boxAttribute('padding', 'Right');
        }
        get paddingBottom() {
            return this.boxAttribute('padding', 'Bottom');
        }
        get paddingLeft() {
            return this.boxAttribute('padding', 'Left');
        }
        set pageflow(value) {
            this._pageflow = value;
        }
        get pageflow() {
            if (this._pageflow == null) {
                const value = this.position;
                return value === 'static' || value === 'initial' || value === 'relative' || this.alignOrigin;
            }
            return this._pageflow;
        }
        get siblingflow() {
            const value = this.position;
            return !(value === 'absolute' || value === 'fixed');
        }
        get inline() {
            const value = this.display;
            return value === 'inline' || (value === 'initial' && INLINE_ELEMENT.includes(this.tagName));
        }
        get inlineElement() {
            const position = this.position;
            const display = this.display;
            return this.inline || display.indexOf('inline') !== -1 || display === 'table-cell' || this.floating || ((position === 'absolute' || position === 'fixed') && this.alignOrigin);
        }
        get inlineStatic() {
            return this.inline && !this.floating && !this.imageElement;
        }
        get inlineText() {
            if (this._inlineText == null) {
                switch (this.tagName) {
                    case 'INPUT':
                    case 'BUTTON':
                    case 'IMG':
                    case 'SELECT':
                    case 'TEXTAREA':
                        this._inlineText = false;
                        break;
                    default:
                        this._inlineText = (this.htmlElement &&
                            hasFreeFormText(this._element) &&
                            (this.children.length === 0 || this.children.every(node => !!getElementCache(node.element, 'inlineSupport'))) &&
                            (this._element.childNodes.length === 0 || !Array.from(this._element.childNodes).some((element) => {
                                const node = getNodeFromElement(element);
                                return !!node && !node.lineBreak && (!node.excluded || !node.visible);
                            })));
                        break;
                }
            }
            return this._inlineText;
        }
        get plainText() {
            return this._nodeName === 'PLAINTEXT';
        }
        get imageElement() {
            return this.tagName === 'IMG';
        }
        get svgElement() {
            return this.tagName === 'SVG';
        }
        get imageOrSvgElement() {
            return this.imageElement || this.svgElement;
        }
        get lineBreak() {
            return this.tagName === 'BR';
        }
        get textElement() {
            return this.plainText || this.inlineText;
        }
        get block() {
            const value = this.display;
            return value === 'block' || value === 'list-item' || (value === 'initial' && BLOCK_ELEMENT.includes(this.tagName));
        }
        get blockStatic() {
            return this.block && this.siblingflow && (!this.floating || this.cssInitial('width') === '100%');
        }
        get alignOrigin() {
            return this.top == null && this.right == null && this.bottom == null && this.left == null;
        }
        get alignNegative() {
            return this.toInt('top') < 0 || this.toInt('left') < 0;
        }
        get autoMargin() {
            return this.blockStatic && (this.initial.styleMap.marginLeft === 'auto' || this.initial.styleMap.marginRight === 'auto');
        }
        get autoMarginLeft() {
            return this.blockStatic && this.initial.styleMap.marginLeft === 'auto' && this.initial.styleMap.marginRight !== 'auto';
        }
        get autoMarginRight() {
            return this.blockStatic && this.initial.styleMap.marginLeft !== 'auto' && this.initial.styleMap.marginRight === 'auto';
        }
        get autoMarginHorizontal() {
            return this.blockStatic && this.initial.styleMap.marginLeft === 'auto' && this.initial.styleMap.marginRight === 'auto';
        }
        get autoMarginVertical() {
            return this.blockStatic && this.initial.styleMap.marginTop === 'auto' && this.initial.styleMap.marginBottom === 'auto';
        }
        get floating() {
            const value = this.css('cssFloat');
            return this.position !== 'absolute' ? (value === 'left' || value === 'right') : false;
        }
        get float() {
            return this.floating ? this.css('cssFloat') : 'none';
        }
        get textContent() {
            if (this._element) {
                if (this._element instanceof HTMLElement) {
                    return this._element.innerText || this._element.innerHTML;
                }
                else if (this._element.nodeName === '#text') {
                    return this._element.textContent || '';
                }
            }
            return '';
        }
        get overflowX() {
            return hasBit(this.getOverflow(), NODE_ALIGNMENT.HORIZONTAL);
        }
        get overflowY() {
            return hasBit(this.getOverflow(), NODE_ALIGNMENT.VERTICAL);
        }
        get baseline() {
            const value = this.css('verticalAlign');
            return (value === 'baseline' || value === 'initial' || value === 'unset') && this.siblingflow;
        }
        get baselineInside() {
            return this.nodes.length > 0 ? this.nodes.every(node => node.baseline) : this.baseline;
        }
        set multiLine(value) {
            this._multiLine = value;
        }
        get multiLine() {
            if (this._multiLine == null) {
                this.setMultiLine();
            }
            return this._multiLine;
        }
        get preserveWhiteSpace() {
            const value = this.css('whiteSpace');
            return value === 'pre' || value === 'pre-wrap';
        }
        get actualHeight() {
            return this.plainText ? this.bounds.bottom - this.bounds.top : this.bounds.height;
        }
        get singleChild() {
            return this.rendered ? this.renderParent.length === 1 : this.parent.length === 1;
        }
        get dir() {
            switch (this.css('direction')) {
                case 'unset':
                case 'inherit':
                    let parent = this.documentParent;
                    do {
                        const value = parent.dir;
                        if (value !== '') {
                            return value;
                        }
                        parent = parent.documentParent;
                    } while (parent.id !== 0);
                    return '';
                case 'rtl':
                    return 'rtl';
                default:
                    return 'ltr';
            }
        }
        get nodes() {
            return this.rendered ? this.renderChildren : this.children;
        }
        get length() {
            return this.nodes.length;
        }
        get previousElementSibling() {
            let element = this.baseElement.previousSibling;
            while (element) {
                if (isPlainText(element) || isStyleElement(element) || element.tagName === 'BR') {
                    return element;
                }
                element = element.previousSibling;
            }
            return null;
        }
        get nextElementSibling() {
            let element = this.baseElement.nextSibling;
            while (element) {
                if (isPlainText(element) || isStyleElement(element) || element.tagName === 'BR') {
                    return element;
                }
                element = element.nextSibling;
            }
            return null;
        }
        get firstElementChild() {
            const element = this.baseElement;
            if (isStyleElement(element)) {
                for (let i = 0; i < element.childNodes.length; i++) {
                    const childElement = element.childNodes[i];
                    if (childElement instanceof Element) {
                        return childElement;
                    }
                    else if (isPlainText(childElement)) {
                        return childElement;
                    }
                }
            }
            return null;
        }
        get lastElementChild() {
            const element = this.baseElement;
            if (isStyleElement(element)) {
                for (let i = element.childNodes.length - 1; i >= 0; i--) {
                    const childElement = element.childNodes[i];
                    if (childElement instanceof Element) {
                        return childElement;
                    }
                    else if (isPlainText(childElement)) {
                        return childElement;
                    }
                }
            }
            return null;
        }
        get center() {
            return {
                x: this.bounds.left + Math.floor(this.bounds.width / 2),
                y: this.bounds.top + Math.floor(this.actualHeight / 2)
            };
        }
    }

    function getDocumentParent(nodes) {
        for (const node of nodes) {
            if (!node.companion && node.domElement) {
                return node.documentParent;
            }
        }
        return nodes[0].documentParent;
    }
    class NodeList {
        constructor(nodes, parent) {
            this.parent = parent;
            this._currentId = 0;
            this._list = [];
            if (Array.isArray(nodes)) {
                this._list = nodes;
            }
        }
        static outerRegion(list, dimension = 'linear') {
            let top = [];
            let right = [];
            let bottom = [];
            let left = [];
            const nodes = list.slice();
            for (const node of list) {
                if (node.companion) {
                    nodes.push(node.companion);
                }
            }
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (i === 0) {
                    top.push(node);
                    right.push(node);
                    bottom.push(node);
                    left.push(node);
                }
                else {
                    if (top[0][dimension].top === node[dimension].top) {
                        top.push(node);
                    }
                    else if (node[dimension].top < top[0][dimension].top) {
                        top = [node];
                    }
                    if (right[0][dimension].right === node[dimension].right) {
                        right.push(node);
                    }
                    else if (node[dimension].right > right[0][dimension].right) {
                        right = [node];
                    }
                    if (bottom[0][dimension].bottom === node[dimension].bottom) {
                        bottom.push(node);
                    }
                    else if (node[dimension].bottom > bottom[0][dimension].bottom) {
                        bottom = [node];
                    }
                    if (left[0][dimension].left === node[dimension].left) {
                        left.push(node);
                    }
                    else if (node[dimension].left < left[0][dimension].left) {
                        left = [node];
                    }
                }
            }
            return { top, right, bottom, left };
        }
        static floated(list) {
            return new Set(list.map(node => node.float).filter(value => value !== 'none'));
        }
        static cleared(list) {
            const nodes = new Map();
            const floated = new Set();
            list.forEach(node => {
                if (node.siblingflow) {
                    const clear = node.css('clear');
                    if (floated.size > 0) {
                        if (clear === 'both') {
                            nodes.set(node, floated.size === 2 ? 'both' : floated.values().next().value);
                            floated.clear();
                        }
                        else if (floated.has(clear)) {
                            floated.delete(clear);
                            nodes.set(node, clear);
                        }
                    }
                    if (node.floating) {
                        floated.add(node.float);
                    }
                }
            });
            return nodes;
        }
        static textBaseline(list) {
            let baseline = [];
            if (!list.some(node => (node.textElement || node.imageElement) && node.baseline)) {
                baseline = list.filter(node => node.baseline).sort((a, b) => {
                    let nodeTypeA = a.nodeType;
                    let nodeTypeB = b.nodeType;
                    if (a.layoutHorizontal) {
                        nodeTypeA = Math.min.apply(null, a.children.map(item => item.nodeType > 0 ? item.nodeType : NODE_STANDARD.INLINE));
                    }
                    if (b.layoutHorizontal) {
                        nodeTypeB = Math.min.apply(null, b.children.map(item => item.nodeType > 0 ? item.nodeType : NODE_STANDARD.INLINE));
                    }
                    return nodeTypeA <= nodeTypeB ? -1 : 1;
                });
            }
            else {
                const lineHeight = Math.max.apply(null, list.map(node => node.lineHeight));
                const boundsHeight = Math.max.apply(null, list.map(node => node.bounds.height));
                if (lineHeight > boundsHeight) {
                    const result = list.filter(node => node.lineHeight === lineHeight);
                    return (result.length === list.length ? result.filter(node => node.htmlElement) : result).filter(node => node.baseline);
                }
                baseline = list.filter(node => node.baselineInside).sort((a, b) => {
                    let heightA = a.bounds.height;
                    let heightB = b.bounds.height;
                    if (isUserAgent(USER_AGENT.EDGE)) {
                        if (a.textElement) {
                            heightA = Math.max(Math.floor(heightA), a.lineHeight);
                        }
                        if (b.textElement) {
                            heightB = Math.max(Math.floor(heightB), b.lineHeight);
                        }
                    }
                    if (!a.imageElement || !b.imageElement) {
                        const fontSizeA = convertInt(a.css('fontSize'));
                        const fontSizeB = convertInt(b.css('fontSize'));
                        if (a.multiLine || b.multiLine) {
                            if (a.lineHeight > 0 && b.lineHeight > 0) {
                                return a.lineHeight >= b.lineHeight ? -1 : 1;
                            }
                            else if (fontSizeA === fontSizeB) {
                                return a.htmlElement || !b.htmlElement ? -1 : 1;
                            }
                        }
                        if (a.nodeType !== b.nodeType && (a.nodeType < NODE_STANDARD.TEXT || b.nodeType < NODE_STANDARD.TEXT)) {
                            if (a.textElement || a.imageElement) {
                                return -1;
                            }
                            else if (b.textElement || b.imageElement) {
                                return 1;
                            }
                            return a.nodeType < b.nodeType ? -1 : 1;
                        }
                        else if ((a.lineHeight > heightB && b.lineHeight === 0) || b.imageElement) {
                            return -1;
                        }
                        else if ((b.lineHeight > heightA && a.lineHeight === 0) || a.imageElement) {
                            return 1;
                        }
                        else {
                            if (fontSizeA === fontSizeB && heightA === heightB) {
                                if (a.htmlElement && !b.htmlElement) {
                                    return -1;
                                }
                                else if (!a.htmlElement && b.htmlElement) {
                                    return 1;
                                }
                                else {
                                    return a.siblingIndex <= b.siblingIndex ? -1 : 1;
                                }
                            }
                            else if (fontSizeA !== fontSizeB &&
                                fontSizeA !== 0 &&
                                fontSizeB !== 0) {
                                return fontSizeA > fontSizeB ? -1 : 1;
                            }
                        }
                    }
                    return heightA >= heightB ? -1 : 1;
                });
            }
            let fontFamily;
            let fontSize;
            let fontWeight;
            return baseline.filter((node, index) => {
                if (index === 0) {
                    fontFamily = node.css('fontFamily');
                    fontSize = node.css('fontSize');
                    fontWeight = node.css('fontWeight');
                    return true;
                }
                else {
                    return (node.css('fontFamily') === fontFamily &&
                        node.css('fontSize') === fontSize &&
                        node.css('fontWeight') === fontWeight &&
                        node.nodeName === baseline[0].nodeName && ((node.lineHeight > 0 && node.lineHeight === baseline[0].lineHeight) ||
                        node.bounds.height === baseline[0].bounds.height));
                }
            });
        }
        static linearX(list, traverse = true) {
            const nodes = list.filter(node => node.pageflow);
            switch (nodes.length) {
                case 0:
                    return false;
                case 1:
                    return true;
                default:
                    const parent = getDocumentParent(nodes);
                    let horizontal = false;
                    if (traverse) {
                        if (nodes.every(node => node.documentParent === parent || (node.companion && node.companion.documentParent === parent))) {
                            const result = NodeList.clearedSiblings(parent);
                            horizontal = nodes.slice().sort(NodeList.siblingIndex).every((node, index) => {
                                if (index > 0) {
                                    if (node.companion && node.companion.documentParent === parent) {
                                        node = node.companion;
                                    }
                                    const previous = node.previousSibling();
                                    if (previous) {
                                        return !node.alignedVertically(previous, result);
                                    }
                                }
                                return true;
                            });
                        }
                    }
                    if (horizontal || !traverse) {
                        return nodes.every(node => !nodes.some(sibling => sibling !== node && node.linear.top >= sibling.linear.bottom && node.intersectY(sibling.linear)));
                    }
                    return false;
            }
        }
        static linearY(list) {
            const nodes = list.filter(node => node.pageflow);
            switch (nodes.length) {
                case 0:
                    return false;
                case 1:
                    return true;
                default:
                    const parent = getDocumentParent(nodes);
                    if (nodes.every(node => node.documentParent === parent || (node.companion && node.companion.documentParent === parent))) {
                        const result = NodeList.clearedSiblings(parent);
                        return nodes.slice().sort(NodeList.siblingIndex).every((node, index) => {
                            if (index > 0 && !node.lineBreak) {
                                if (node.companion && node.companion.documentParent === parent) {
                                    node = node.companion;
                                }
                                const previous = node.previousSibling();
                                if (previous) {
                                    return node.alignedVertically(previous, result);
                                }
                            }
                            return true;
                        });
                    }
                    return false;
            }
        }
        static siblingIndex(a, b) {
            return a.siblingIndex <= b.siblingIndex ? -1 : 1;
        }
        static clearedSiblings(parent) {
            return this.cleared(Array.from(parent.baseElement.children).map(element => getNodeFromElement(element)).filter(node => node));
        }
        [Symbol.iterator]() {
            const list = this._list;
            let i = 0;
            return {
                next() {
                    if (i < list.length) {
                        return { done: false, value: list[i++] };
                    }
                    else {
                        return { done: true, value: undefined };
                    }
                }
            };
        }
        reset() {
            this._currentId = 0;
            this.clear();
        }
        get(index) {
            if (index == null) {
                return this._list[this._list.length - 1];
            }
            return this._list[index];
        }
        append(...nodes) {
            this._list.push(...nodes);
            if (typeof this.delegateAppend === 'function') {
                this.delegateAppend.call(this, nodes);
            }
        }
        prepend(...nodes) {
            this._list.unshift(...nodes);
        }
        remove(start, deleteCount = 1) {
            return this._list.splice(start, deleteCount);
        }
        clone() {
            return new NodeList(this._list.slice());
        }
        partition(predicate) {
            const [valid, invalid] = partition(this._list, predicate);
            return [new NodeList(valid), new NodeList(invalid)];
        }
        each(predicate) {
            this._list.forEach(predicate);
        }
        find(attr, value) {
            if (typeof attr === 'string') {
                return this._list.find(node => node[attr] === value);
            }
            return this._list.find(attr);
        }
        clear() {
            this._list.length = 0;
        }
        sort(predicate) {
            this._list.sort(predicate);
            return this;
        }
        sliceSort(predicate) {
            return new NodeList(this._list.slice().sort(predicate));
        }
        sortAsc(...attrs) {
            sortAsc(this._list, ...attrs);
            return this;
        }
        sortDesc(...attrs) {
            sortDesc(this._list, ...attrs);
            return this;
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
            return this._list.filter(node => node.visible && node.styleElement);
        }
        get nextId() {
            return ++this._currentId;
        }
        get linearX() {
            return NodeList.linearX(this._list);
        }
        get linearY() {
            return NodeList.linearY(this._list);
        }
    }

    class NodeGroup extends Node {
        init() {
            super.init();
            if (this.children.length > 0) {
                this.children.forEach(item => {
                    this.siblingIndex = Math.min(this.siblingIndex, item.siblingIndex);
                    item.parent = this;
                });
                this.parent.children.sort(NodeList.siblingIndex);
                this.initial.children.push(...this.children.slice());
            }
            this.setBounds();
            this.css('direction', this.documentParent.dir);
        }
        setBounds(calibrate = false) {
            if (!calibrate) {
                if (this.children.length > 0) {
                    const nodes = NodeList.outerRegion(this.children);
                    this.bounds = {
                        top: nodes.top[0].linear.top,
                        right: nodes.right[0].linear.right,
                        bottom: nodes.bottom[0].linear.bottom,
                        left: nodes.left[0].linear.left,
                        width: 0,
                        height: 0
                    };
                }
                else {
                    this.bounds = getClientRect();
                }
                this.bounds.width = this.bounds.right - this.bounds.left;
                this.bounds.height = this.bounds.bottom - this.bounds.top;
            }
            this.linear = assignBounds(this.bounds);
            this.box = assignBounds(this.bounds);
            this.setDimensions();
        }
        previousSibling(pageflow = false, lineBreak = true, excluded = true) {
            return this.children.length > 0 ? this.children[0].previousSibling(pageflow, lineBreak, excluded) : null;
        }
        nextSibling(pageflow = false, lineBreak = true, excluded = true) {
            return this.children.length > 0 ? this.children[this.children.length - 1].nextSibling(pageflow, lineBreak, excluded) : null;
        }
        get inline() {
            return this.children.every(node => node.inline);
        }
        get pageflow() {
            return this.children.every(node => node.pageflow);
        }
        get siblingflow() {
            return this.children.every(node => node.siblingflow);
        }
        get inlineElement() {
            return this.hasAlign(NODE_ALIGNMENT.SEGMENTED);
        }
        get inlineStatic() {
            return this.children.every(node => node.inlineStatic);
        }
        get blockStatic() {
            return this.children.every(node => node.blockStatic);
        }
        get floating() {
            return this.hasAlign(NODE_ALIGNMENT.FLOAT);
        }
        get float() {
            if (this.floating) {
                return this.hasAlign(NODE_ALIGNMENT.RIGHT) ? 'right' : 'left';
            }
            return 'none';
        }
        get baseline() {
            return this.children.every(node => node.baseline);
        }
        get multiLine() {
            return this.children.some(node => node.multiLine);
        }
        get display() {
            return this.css('display') || (this.children.every(node => node.blockStatic) || this.of(NODE_STANDARD.CONSTRAINT, NODE_ALIGNMENT.PERCENT) ? 'block' : this.children.every(node => node.inline) ? 'inline' : 'inline-block');
        }
        get baseElement() {
            function cascade(nodes) {
                for (let i = 0; i < nodes.length; i++) {
                    const item = nodes[i];
                    if (item.styleElement || item.plainText) {
                        return item.element;
                    }
                    else if (item.length > 0) {
                        const element = cascade(item.nodes);
                        if (element) {
                            return element;
                        }
                    }
                }
                return null;
            }
            return cascade(this.nodes) || super.baseElement;
        }
        get firstElementChild() {
            const element = this.documentParent.element;
            if (isStyleElement(element)) {
                for (let i = 0; i < element.childNodes.length; i++) {
                    const childElement = element.childNodes[i];
                    if (this.nodes.includes(getNodeFromElement(childElement))) {
                        return childElement;
                    }
                }
            }
            return null;
        }
        get lastElementChild() {
            const element = this.baseElement;
            if (isStyleElement(element)) {
                for (let i = element.childNodes.length - 1; i >= 0; i--) {
                    const childElement = element.childNodes[i];
                    if (this.nodes.includes(getNodeFromElement(childElement))) {
                        return childElement;
                    }
                }
            }
            return null;
        }
    }

    function formatPlaceholder(id, symbol = ':') {
        return `{${symbol + id.toString()}}`;
    }
    function removePlaceholderAll(value) {
        return value.replace(/{[<:@>]{1}[0-9]+(\:[0-9]+)?}/g, '').trim();
    }
    function replacePlaceholder(value, id, content, before = false) {
        const placeholder = typeof id === 'number' ? formatPlaceholder(id) : id;
        return value.replace(placeholder, (before ? placeholder : '') + content + (before ? '' : placeholder));
    }
    function replaceIndent(value, depth) {
        if (depth >= 0) {
            let indent = -1;
            return value.split('\n').map(line => {
                const match = /^({.*?})(\t*)(<.*)/.exec(line);
                if (match) {
                    if (indent === -1) {
                        indent = match[2].length;
                    }
                    return match[1] + repeat(depth + (match[2].length - indent)) + match[3];
                }
                return line;
            })
                .join('\n');
        }
        return value;
    }
    function replaceTab(value, { insertSpaces = 4 }, preserve = false) {
        if (insertSpaces > 0) {
            if (preserve) {
                value = value.split('\n').map(line => {
                    const match = line.match(/^(\t+)(.*)$/);
                    if (match) {
                        return ' '.repeat(insertSpaces * match[1].length) + match[2];
                    }
                    return line;
                })
                    .join('\n');
            }
            else {
                value = value.replace(/\t/g, ' '.repeat(insertSpaces));
            }
        }
        return value;
    }
    function replaceEntity(value) {
        value = value.replace(/&#([0-9]+);/g, (match, capture) => String.fromCharCode(parseInt(capture)));
        value = value.replace(/&nbsp;/g, '&#160;');
        return replaceWhiteSpace(value);
    }
    function parseTemplate(template) {
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
                if (!template) {
                    break;
                }
                characters = template.length;
                match = null;
            }
            if (!match) {
                pattern = /(!([0-9]+)\n?)[\w\W]*\1/g;
            }
            if (pattern) {
                match = pattern.exec(template);
            }
            else {
                break;
            }
        } while (true);
        return result;
    }
    function getTemplateLevel(data, ...levels) {
        let current = data;
        for (const level of levels) {
            const [index, array = '0'] = level.split('-');
            current = current[index][array];
        }
        return current;
    }
    function createTemplate(template, data, index, include, exclude) {
        let output = index ? template[index] : '';
        if (data['#include']) {
            include = data['#include'];
            delete data['#include'];
        }
        if (data['#exclude']) {
            exclude = data['#exclude'];
            delete data['#exclude'];
        }
        for (const i in data) {
            let value = '';
            if (data[i] === false || (Array.isArray(data[i]) && data[i].length === 0)) {
                output = output.replace(`{%${i}}`, '');
                continue;
            }
            else if (Array.isArray(data[i])) {
                for (const j in data[i]) {
                    value += createTemplate(template, data[i][j], i, include, exclude);
                }
            }
            else {
                value = data[i];
            }
            if (isString(value)) {
                output = index ? output.replace(new RegExp(`{[%@&]*${i}}`, 'g'), value) : value.trim();
            }
            else if (value === false || new RegExp(`{%${i}}`).test(output)) {
                output = output.replace(`{%${i}}`, '');
            }
            else if (new RegExp(`{&${i}}`).test(output)) {
                output = '';
            }
            if (include || exclude) {
                const pattern = /\s+[\w:]+="{#(\w+)=(.*?)}"/g;
                let match;
                while ((match = pattern.exec(output)) != null) {
                    if (include && include[match[1]]) {
                        const attr = `{#${match[1]}=${match[2]}}`;
                        output = output.replace(attr, data[match[2]] || match[2]);
                    }
                    else if (exclude && exclude[match[1]]) {
                        output = output.replace(match[0], '');
                    }
                }
            }
        }
        return output.replace(/\s+[\w:]+="{@\w+}"/g, '');
    }

    var xml = /*#__PURE__*/Object.freeze({
        formatPlaceholder: formatPlaceholder,
        removePlaceholderAll: removePlaceholderAll,
        replacePlaceholder: replacePlaceholder,
        replaceIndent: replaceIndent,
        replaceTab: replaceTab,
        replaceEntity: replaceEntity,
        parseTemplate: parseTemplate,
        getTemplateLevel: getTemplateLevel,
        createTemplate: createTemplate
    });

    function prioritizeExtensions(extensions, element) {
        let result = [];
        let current = element;
        while (current) {
            result = [
                ...result,
                ...trimNull(current.dataset.ext)
                    .split(',')
                    .map(value => value.trim())
            ];
            current = current.parentElement;
        }
        result = result.filter(value => value);
        if (result.length > 0) {
            const tagged = [];
            const untagged = [];
            for (const item of extensions) {
                const index = result.indexOf(item.name);
                if (index !== -1) {
                    tagged[index] = item;
                }
                else {
                    untagged.push(item);
                }
            }
            return [...tagged.filter(item => item), ...untagged];
        }
        else {
            return extensions;
        }
    }
    class Application {
        constructor(framework) {
            this.framework = framework;
            this.renderQueue = {};
            this.loading = false;
            this.closed = false;
            this.cache = new NodeList();
            this.cacheSession = new NodeList();
            this.elements = new Set();
            this.extensions = [];
            this._cacheRoot = new Set();
            this._cacheImage = new Map();
            this._sorted = {};
            this._currentIndex = -1;
            this._views = [];
            this._includes = [];
        }
        static sortByAlignment(children, parent, alignmentType = NODE_ALIGNMENT.NONE) {
            let sorted = false;
            if (parent && alignmentType === NODE_ALIGNMENT.NONE) {
                if (parent.linearHorizontal) {
                    alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                }
                else if (parent.is(NODE_STANDARD.CONSTRAINT) && children.some(node => !node.pageflow)) {
                    alignmentType |= NODE_ALIGNMENT.ABSOLUTE;
                }
            }
            if (hasBit(alignmentType, NODE_ALIGNMENT.HORIZONTAL)) {
                if (children.some(node => node.floating)) {
                    children.sort((a, b) => {
                        if (a.floating && !b.floating) {
                            return a.float === 'left' ? -1 : 1;
                        }
                        else if (!a.floating && b.floating) {
                            return b.float === 'left' ? 1 : -1;
                        }
                        else if (a.floating && b.floating) {
                            if (a.float !== b.float) {
                                return a.float === 'left' ? -1 : 1;
                            }
                        }
                        return a.linear.left <= b.linear.left ? -1 : 1;
                    });
                    sorted = true;
                }
            }
            if (hasBit(alignmentType, NODE_ALIGNMENT.ABSOLUTE)) {
                if (children.some(node => node.toInt('zIndex') !== 0)) {
                    children.sort((a, b) => {
                        const indexA = convertInt(a.css('zIndex'));
                        const indexB = convertInt(b.css('zIndex'));
                        if (indexA === 0 && indexB === 0) {
                            return a.siblingIndex <= b.siblingIndex ? -1 : 1;
                        }
                        else {
                            return indexA <= indexB ? -1 : 1;
                        }
                    });
                    sorted = true;
                }
            }
            return sorted;
        }
        static isFrameHorizontal(nodes, cleared, lineBreak = false) {
            const floated = NodeList.floated(nodes);
            const margin = nodes.filter(node => node.autoMargin);
            const br = lineBreak ? getElementsBetweenSiblings(nodes[0].baseElement, nodes[nodes.length - 1].baseElement).filter(element => element.tagName === 'BR').length : 0;
            return (br === 0 && (floated.has('right') ||
                cleared.size > 0 ||
                margin.length > 0 ||
                !NodeList.linearX(nodes)));
        }
        static isRelativeHorizontal(nodes, cleared = new Map()) {
            const visible = nodes.filter(node => node.visible);
            const floated = NodeList.floated(nodes);
            const [floating, pageflow] = new NodeList(nodes).partition(node => node.floating);
            const flowIndex = pageflow.length > 0 ? Math.min.apply(null, pageflow.list.map(node => node.siblingIndex)) : Number.MAX_VALUE;
            const floatIndex = floating.length > 0 ? Math.max.apply(null, floating.list.map(node => node.siblingIndex)) : -1;
            const linearX = NodeList.linearX(nodes);
            if (visible.some(node => node.autoMarginHorizontal)) {
                return false;
            }
            if (floated.size === 1 && floating.length === nodes.length) {
                return !(linearX && cleared.size === 0);
            }
            return (cleared.size === 0 &&
                !floated.has('right') &&
                (pageflow.length === 0 || floating.length === 0 || floatIndex < flowIndex) &&
                visible.every(node => {
                    const verticalAlign = node.css('verticalAlign');
                    return (node.toInt('top') >= 0 &&
                        (['baseline', 'initial', 'unset', 'top', 'middle', 'sub', 'super'].includes(verticalAlign) || (isUnit(verticalAlign) && parseInt(verticalAlign) >= 0)));
                }) && (visible.some(node => ((node.textElement || node.imageElement || node.svgElement) && node.baseline) || (node.plainText && node.multiLine)) ||
                (!linearX && nodes.every(node => node.pageflow && node.inlineElement))));
        }
        registerController(controller) {
            controller.application = this;
            controller.cache = this.cache;
            this.viewController = controller;
        }
        registerResource(resource) {
            resource.application = this;
            resource.cache = this.cache;
            this.resourceHandler = resource;
        }
        registerExtension(ext) {
            const found = this.getExtension(ext.name);
            if (found) {
                if (Array.isArray(ext.tagNames)) {
                    found.tagNames = ext.tagNames;
                }
                Object.assign(found.options, ext.options);
            }
            else {
                if ((ext.framework === 0 || hasBit(ext.framework, this.framework)) && ext.dependencies.every(item => !!this.getExtension(item.name))) {
                    ext.application = this;
                    this.extensions.push(ext);
                }
            }
        }
        finalize() {
            const visible = this.cacheSession.visible.filter(node => !node.hasAlign(NODE_ALIGNMENT.SPACE));
            for (const node of visible) {
                if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.LAYOUT)) {
                    node.setLayout();
                }
                if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.ALIGNMENT)) {
                    node.setAlignment(this.settings);
                }
            }
            for (const node of visible) {
                if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.OPTIMIZATION)) {
                    node.applyOptimizations(this.settings);
                }
                if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.CUSTOMIZATION)) {
                    node.applyCustomizations(this.settings);
                }
            }
            this.viewController.setBoxSpacing(this.viewData);
            this.appendRenderQueue();
            this.viewController.setDimensions(this.viewData);
            this.resourceHandler.finalize(this.viewData);
            this.viewController.finalize(this.viewData);
            for (const ext of this.extensions) {
                for (const node of ext.subscribers) {
                    ext.setTarget(node);
                    ext.finalize();
                }
            }
            this.closed = true;
        }
        saveAllToDisk() {
            this.resourceHandler.file.saveAllToDisk(this.viewData);
        }
        reset() {
            for (const node of this.cacheSession) {
                deleteElementCache(node.element, 'node', 'style', 'styleMap', 'inlineSupport', 'boxSpacing', 'boxStyle', 'fontStyle', 'imageSource', 'optionArray', 'valueString');
            }
            for (const element of this._cacheRoot) {
                delete element.dataset.iteration;
                delete element.dataset.layoutName;
            }
            this.appName = '';
            this.renderQueue = {};
            this.cache.reset();
            this.cacheSession.reset();
            this.viewController.reset();
            this.resourceHandler.reset();
            this._cacheRoot.clear();
            this._cacheImage.clear();
            this._views.length = 0;
            this._includes.length = 0;
            this._sorted = {};
            this._currentIndex = -1;
            for (const ext of this.extensions) {
                ext.subscribers.clear();
                ext.subscribersChild.clear();
            }
            this.closed = false;
        }
        setConstraints() {
            this.viewController.setConstraints();
        }
        setResources() {
            this.resourceHandler.setBoxStyle();
            this.resourceHandler.setFontStyle();
            this.resourceHandler.setBoxSpacing();
            this.resourceHandler.setValueString();
            this.resourceHandler.setOptionArray();
            this.resourceHandler.setImageSource();
        }
        setImageCache(element) {
            if (element && hasValue(element.src)) {
                const image = {
                    width: element.naturalWidth,
                    height: element.naturalHeight,
                    url: element.src
                };
                this._cacheImage.set(element.src, image);
            }
        }
        parseDocument(...elements) {
            let __THEN;
            this.elements.clear();
            this.loading = false;
            this.setStyleMap();
            if (this.appName === '' && elements.length === 0) {
                elements.push(document.body);
            }
            for (const item of elements) {
                const element = typeof item === 'string' ? document.getElementById(item) : item;
                if (element && isStyleElement(element)) {
                    this.elements.add(element);
                }
            }
            const rootElement = this.elements.values().next().value;
            const parseResume = () => {
                this.loading = false;
                if (this.settings.preloadImages && rootElement) {
                    Array.from(rootElement.getElementsByClassName('androme.preload')).forEach(element => rootElement.removeChild(element));
                }
                this.resourceHandler.imageDimensions = this._cacheImage;
                for (const element of this.elements) {
                    if (this.appName === '') {
                        if (element.id === '') {
                            element.id = 'untitled';
                        }
                        this.appName = element.id;
                    }
                    let filename = trimNull(element.dataset.filename).replace(new RegExp(`\.${this.viewController.settingsInternal.layout.fileExtension}$`), '');
                    if (filename === '') {
                        if (element.id === '') {
                            element.id = `document_${this.size}`;
                        }
                        filename = element.id;
                    }
                    const iteration = convertInt(element.dataset.iteration) + 1;
                    element.dataset.iteration = iteration.toString();
                    element.dataset.layoutName = convertWord(iteration > 1 ? `${filename}_${iteration}` : filename);
                    if (this.initCache(element)) {
                        this.createDocument();
                        this.setConstraints();
                        this.setResources();
                        this._cacheRoot.add(element);
                    }
                }
                if (typeof __THEN === 'function') {
                    __THEN.call(this);
                }
            };
            if (this.settings.preloadImages && rootElement) {
                for (const image of this._cacheImage.values()) {
                    if (image.width === 0 && image.height === 0 && image.url) {
                        const imageElement = document.createElement('IMG');
                        imageElement.src = image.url;
                        if (imageElement.complete && imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
                            image.width = imageElement.naturalWidth;
                            image.height = imageElement.naturalHeight;
                        }
                        else {
                            imageElement.className = 'androme.preload';
                            imageElement.style.display = 'none';
                            rootElement.appendChild(imageElement);
                        }
                    }
                }
            }
            const images = Array.from(this.elements).map(element => {
                const queue = [];
                Array.from(element.querySelectorAll('IMG')).forEach((image) => {
                    if (image.complete) {
                        this.setImageCache(image);
                    }
                    else {
                        queue.push(image);
                    }
                });
                return queue;
            })
                .reduce((a, b) => a.concat(b), []);
            if (images.length === 0) {
                parseResume();
            }
            else {
                this.loading = true;
                const queue = images.map(image => {
                    return new Promise((resolve, reject) => {
                        image.onload = resolve;
                        image.onerror = reject;
                    });
                });
                Promise.all(queue).then((result) => {
                    if (Array.isArray(result)) {
                        result.forEach(item => {
                            try {
                                this.setImageCache(item.srcElement);
                            }
                            catch (_a) {
                            }
                        });
                    }
                    parseResume();
                })
                    .catch((error) => {
                    const message = error.srcElement ? error.srcElement.src : '';
                    if (!hasValue(message) || confirm(`FAIL: ${message}`)) {
                        parseResume();
                    }
                });
            }
            return {
                then: (resolve) => {
                    if (this.loading) {
                        __THEN = resolve;
                    }
                    else {
                        resolve();
                    }
                }
            };
        }
        initCache(rootElement) {
            let nodeTotal = 0;
            if (rootElement === document.body) {
                Array.from(document.body.childNodes).some((item) => isElementVisible(item) && ++nodeTotal > 1);
            }
            const elements = rootElement !== document.body ? rootElement.querySelectorAll('*') : document.querySelectorAll(nodeTotal > 1 ? 'body, body *' : 'body *');
            this.cache.parent = undefined;
            this.cache.delegateAppend = undefined;
            this.cache.clear();
            for (const ext of this.extensions) {
                ext.setTarget(undefined, undefined, rootElement);
                ext.beforeInit();
            }
            const rootNode = this.insertNode(rootElement);
            if (rootNode) {
                rootNode.parent = new this.nodeObject(0, (rootElement === document.body ? rootElement : rootElement.parentElement) || document.body);
                rootNode.documentRoot = true;
                this.viewController.initNode(rootNode);
                this.cache.parent = rootNode;
            }
            else {
                return false;
            }
            const inlineAlways = this.viewController.settingsInternal.inline.always;
            const inlineSupport = this.settings.renderInlineText ? [] : this.viewController.settingsInternal.inline.tagName;
            function inlineElement(element) {
                const styleMap = getElementCache(element, 'styleMap');
                return ((!styleMap || Object.keys(styleMap).length === 0) &&
                    element.children.length === 0 &&
                    inlineSupport.includes(element.tagName));
            }
            for (const element of Array.from(elements)) {
                if (!this.elements.has(element)) {
                    prioritizeExtensions(this.extensions, element).some(item => item.init(element));
                    if (!this.elements.has(element)) {
                        if ((inlineElement(element) && element.parentElement && Array.from(element.parentElement.children).every(item => inlineElement(item))) ||
                            inlineAlways.includes(element.tagName)) {
                            setElementCache(element, 'inlineSupport', true);
                        }
                        let valid = true;
                        let current = element.parentElement;
                        while (current) {
                            if (current === rootElement) {
                                break;
                            }
                            else if (current !== rootElement && this.elements.has(current)) {
                                valid = false;
                                break;
                            }
                            current = current.parentElement;
                        }
                        if (valid) {
                            let styleMap = getElementCache(element, 'styleMap');
                            if (!styleMap) {
                                styleMap = {};
                                setElementCache(element, 'styleMap', styleMap);
                            }
                            switch (element.tagName) {
                                case 'SELECT':
                                    if (styleMap['verticalAlign'] == null && element.size > 1) {
                                        styleMap['verticalAlign'] = 'text-bottom';
                                    }
                                    break;
                            }
                            this.insertNode(element);
                        }
                    }
                }
            }
            if (this.cache.length > 0) {
                for (const node of this.cache) {
                    const nodes = [];
                    let valid = false;
                    Array.from(node.element.childNodes).forEach((element) => {
                        if (element.nodeName === '#text') {
                            if (node.tagName !== 'SELECT') {
                                nodes.push(element);
                            }
                        }
                        else if (element.tagName !== 'BR') {
                            const elementNode = getNodeFromElement(element);
                            if (!inlineSupport.includes(element.tagName) || (elementNode && !elementNode.excluded)) {
                                valid = true;
                            }
                        }
                    });
                    if (valid) {
                        nodes.forEach(element => this.insertNode(element, node));
                    }
                }
                const preAlignment = {};
                const direction = [];
                for (const node of this.cache) {
                    if (node.styleElement) {
                        const element = node.element;
                        const textAlign = node.css('textAlign');
                        preAlignment[node.id] = {};
                        const attrs = preAlignment[node.id];
                        ['right', 'end', element.tagName !== 'BUTTON' && element.type !== 'button' ? 'center' : ''].some(value => {
                            if (value === textAlign) {
                                attrs.textAlign = value;
                                element.style.textAlign = 'left';
                                return true;
                            }
                            return false;
                        });
                        if (node.marginLeft < 0) {
                            attrs.marginLeft = node.css('marginLeft');
                            element.style.marginLeft = '0px';
                        }
                        if (node.marginTop < 0) {
                            attrs.marginTop = node.css('marginTop');
                            element.style.marginTop = '0px';
                        }
                        if (node.position === 'relative') {
                            ['top', 'right', 'bottom', 'left'].forEach(value => {
                                if (node.has(value)) {
                                    attrs[value] = node.styleMap[value];
                                    element.style[value] = 'auto';
                                }
                            });
                        }
                        if (node.overflowX || node.overflowY) {
                            if (node.has('width')) {
                                attrs.width = node.styleMap.width;
                                element.style.width = 'auto';
                            }
                            if (node.has('height')) {
                                attrs.height = node.styleMap.height;
                                element.style.height = 'auto';
                            }
                            attrs.overflow = node.style.overflow || '';
                            element.style.overflow = 'visible';
                        }
                        if (element.dir === 'rtl') {
                            element.dir = 'ltr';
                            direction.push(element);
                        }
                        node.setBounds();
                    }
                    node.setMultiLine();
                }
                for (const node of this.cache) {
                    if (node.styleElement) {
                        const element = node.element;
                        const attrs = preAlignment[node.id];
                        if (attrs) {
                            for (const attr in attrs) {
                                element.style[attr] = attrs[attr];
                            }
                            if (direction.includes(element)) {
                                element.dir = 'rtl';
                            }
                        }
                    }
                    if (node.children.length === 1) {
                        const firstNode = node.children[0];
                        if (!firstNode.pageflow &&
                            firstNode.toInt('top') === 0 &&
                            firstNode.toInt('right') === 0 &&
                            firstNode.toInt('bottom') === 0 &&
                            firstNode.toInt('left') === 0) {
                            firstNode.pageflow = true;
                        }
                    }
                }
                for (const node of this.cache) {
                    if (!node.documentRoot) {
                        let parent = node.getParentElementAsNode(this.settings.supportNegativeLeftTop, this.cache.parent);
                        if (!parent && !node.pageflow) {
                            parent = this.cache.parent;
                        }
                        if (parent) {
                            node.parent = parent;
                            node.documentParent = parent;
                        }
                        else {
                            node.hide();
                        }
                    }
                }
                for (const node of this.cache.elements) {
                    if (node.htmlElement) {
                        let i = 0;
                        Array.from(node.element.childNodes).forEach((element) => {
                            const item = getNodeFromElement(element);
                            if (item && !item.excluded && item.pageflow) {
                                item.siblingIndex = i++;
                            }
                        });
                        node.children.sort(NodeList.siblingIndex);
                        node.initial.children.push(...node.children.slice());
                    }
                }
                this.cache.sortAsc('depth', 'id');
                for (const ext of this.extensions) {
                    ext.setTarget(rootNode);
                    ext.afterInit();
                }
                return true;
            }
            return false;
        }
        createDocument() {
            const mapX = [];
            const mapY = new Map();
            let baseTemplate = this.viewController.baseTemplate;
            let empty = true;
            function setMapY(depth, id, node) {
                if (!mapY.has(depth)) {
                    mapY.set(depth, new Map());
                }
                const mapIndex = mapY.get(depth);
                if (mapIndex) {
                    mapIndex.set(id, node);
                }
            }
            function deleteMapY(id) {
                for (const mapNode of mapY.values()) {
                    for (const node of mapNode.values()) {
                        if (node.id === id) {
                            mapNode.delete(node.id);
                            return;
                        }
                    }
                }
            }
            setMapY(-1, 0, this.cache.parent.parent);
            let maxDepth = 0;
            for (const node of this.cache.visible) {
                const x = Math.floor(node.linear.left);
                if (mapX[node.depth] == null) {
                    mapX[node.depth] = {};
                }
                if (mapX[node.depth][x] == null) {
                    mapX[node.depth][x] = [];
                }
                mapX[node.depth][x].push(node);
                setMapY(node.depth, node.id, node);
                maxDepth = Math.max(node.depth, maxDepth);
            }
            for (let i = 0; i < maxDepth; i++) {
                mapY.set((i * -1) - 2, new Map());
            }
            this.cache.delegateAppend = (nodes) => {
                nodes.forEach(node => {
                    deleteMapY(node.id);
                    setMapY((node.initial.depth * -1) - 2, node.id, node);
                    node.cascade().forEach((item) => {
                        deleteMapY(item.id);
                        setMapY((item.initial.depth * -1) - 2, item.id, item);
                    });
                });
            };
            for (const depth of mapY.values()) {
                function insertNodeTemplate(data, node, parentId, value, current) {
                    const key = parentId + (current === '' && node.renderPosition !== -1 ? `:${node.renderPosition}` : '');
                    if (!data.has(key)) {
                        data.set(key, new Map());
                    }
                    const template = data.get(key);
                    if (template) {
                        template.set(node.id, value);
                    }
                }
                const partial = new Map();
                const external = new Map();
                const renderNode = (node, parent, output, current = '', group = false) => {
                    if (output !== '') {
                        if (group) {
                            node.each((item) => {
                                [partial, external].some(data => {
                                    for (const views of partial.values()) {
                                        let template = views.get(item.id);
                                        if (template) {
                                            const indent = node.renderDepth + 1;
                                            if (item.renderDepth !== indent) {
                                                template = replaceIndent(template, indent);
                                                item.renderDepth = indent;
                                            }
                                            insertNodeTemplate(data, item, node.id.toString(), template, current);
                                            views.delete(item.id);
                                            return true;
                                        }
                                    }
                                    return false;
                                });
                            });
                        }
                        if (current !== '') {
                            insertNodeTemplate(external, node, current, output, current);
                        }
                        else {
                            if (!this.elements.has(node.element)) {
                                if (node.dataset.target) {
                                    const target = document.getElementById(node.dataset.target);
                                    if (target && target !== parent.element) {
                                        this.addRenderQueue(node.dataset.target, [output]);
                                        node.auto = false;
                                        return;
                                    }
                                }
                                else if (parent.dataset.target) {
                                    const target = document.getElementById(parent.dataset.target);
                                    if (target) {
                                        this.addRenderQueue(parent.nodeId, [output]);
                                        node.dataset.target = parent.nodeId;
                                        return;
                                    }
                                }
                            }
                            insertNodeTemplate(partial, node, parent.id.toString(), output, current);
                        }
                    }
                };
                for (const parent of depth.values()) {
                    if (parent.children.length === 0 || parent.renderAs) {
                        continue;
                    }
                    const axisY = [];
                    const below = [];
                    const middle = [];
                    const above = [];
                    for (const node of parent.children) {
                        if (node.documentRoot) {
                            axisY.push(node);
                        }
                        else if (node.pageflow || node.alignOrigin) {
                            middle.push(node);
                        }
                        else {
                            if (node.toInt('zIndex') >= 0 || node.parent.element !== node.element.parentElement) {
                                above.push(node);
                            }
                            else {
                                below.push(node);
                            }
                        }
                    }
                    Application.sortByAlignment(middle, parent);
                    axisY.push(...sortAsc(below, 'style.zIndex', 'id'));
                    axisY.push(...middle);
                    axisY.push(...sortAsc(above, 'style.zIndex', 'id'));
                    const cleared = NodeList.cleared(axisY);
                    const includes$$1 = [];
                    let current = '';
                    let k = -1;
                    function getCurrent() {
                        return includes$$1.length > 0 ? includes$$1[includes$$1.length - 1] : '';
                    }
                    while (++k < axisY.length) {
                        let nodeY = axisY[k];
                        if (!nodeY.visible || (!nodeY.documentRoot && this.elements.has(nodeY.element))) {
                            continue;
                        }
                        let parentY = nodeY.parent;
                        let currentY = '';
                        const includeSupport = this.viewController.settingsInternal.includes;
                        if (includeSupport) {
                            if (!nodeY.hasBit('excludeSection', APP_SECTION.INCLUDE)) {
                                const filename = trimNull(nodeY.dataset.include);
                                if (filename !== '' && includes$$1.indexOf(filename) === -1) {
                                    renderNode(nodeY, parentY, this.viewController.renderInclude(nodeY, parentY, filename), getCurrent());
                                    includes$$1.push(filename);
                                }
                                current = getCurrent();
                                if (current !== '') {
                                    const cloneParent = parentY.clone();
                                    cloneParent.renderDepth = this.viewController.baseRenderDepth(current);
                                    nodeY.parent = cloneParent;
                                    parentY = cloneParent;
                                }
                                currentY = current;
                            }
                            else {
                                currentY = '';
                            }
                        }
                        if (nodeY.renderAs) {
                            parentY.remove(nodeY);
                            nodeY.hide();
                            nodeY = nodeY.renderAs;
                        }
                        if (!nodeY.hasBit('excludeSection', APP_SECTION.DOM_TRAVERSE) && axisY.length > 1 && k < axisY.length - 1) {
                            const linearVertical = parentY.linearVertical;
                            if (nodeY.pageflow &&
                                current === '' &&
                                !parentY.flex.enabled &&
                                !parentY.has('columnCount') &&
                                !parentY.is(NODE_STANDARD.GRID) && ((nodeY.alignmentType === NODE_ALIGNMENT.NONE && parentY.alignmentType === NODE_ALIGNMENT.NONE) ||
                                nodeY.hasAlign(NODE_ALIGNMENT.EXTENDABLE))) {
                                const horizontal = [];
                                const vertical = [];
                                const floatedOpen = new Set(['left', 'right']);
                                let verticalExtended = false;
                                let l = k;
                                let m = 0;
                                if (nodeY.hasAlign(NODE_ALIGNMENT.EXTENDABLE)) {
                                    horizontal.push(nodeY);
                                    l++;
                                    m++;
                                }
                                mainloop: {
                                    for (; l < axisY.length; l++, m++) {
                                        const adjacent = axisY[l];
                                        if (adjacent.pageflow) {
                                            const float = cleared.get(adjacent);
                                            if (float) {
                                                if (float === 'both') {
                                                    floatedOpen.clear();
                                                }
                                                else {
                                                    floatedOpen.delete(float);
                                                }
                                            }
                                            if (adjacent.floating) {
                                                floatedOpen.add(adjacent.float);
                                            }
                                            const previousSibling = adjacent.previousSibling();
                                            const nextSibling = adjacent.nextSibling(true);
                                            if (m === 0 && nextSibling) {
                                                if (adjacent.blockStatic || nextSibling.alignedVertically(adjacent, cleared, true)) {
                                                    vertical.push(adjacent);
                                                }
                                                else {
                                                    horizontal.push(adjacent);
                                                }
                                            }
                                            else if (previousSibling) {
                                                const floated = NodeList.floated([...horizontal, ...vertical]);
                                                const pending = [...horizontal, ...vertical, adjacent];
                                                const clearedPartial = NodeList.cleared(pending);
                                                const clearedPrevious = new Map();
                                                if (clearedPartial.has(previousSibling)) {
                                                    clearedPrevious.set(previousSibling, previousSibling.css('clear'));
                                                }
                                                const verticalAlign = adjacent.alignedVertically(previousSibling, clearedPrevious);
                                                if (verticalAlign ||
                                                    clearedPartial.has(adjacent) ||
                                                    (this.settings.floatOverlapDisabled && previousSibling.floating && adjacent.blockStatic && floatedOpen.size === 2)) {
                                                    if (horizontal.length > 0) {
                                                        if (!this.settings.floatOverlapDisabled && !previousSibling.lineBreak) {
                                                            const clearedDirection = new Set(pending.map(node => clearedPartial.get(node) || '').filter(value => value !== ''));
                                                            let maxBottom = null;
                                                            if (floated.size > 0) {
                                                                maxBottom = Math.max.apply(null, horizontal.filter(node => node.floating).map(node => node.bounds.bottom));
                                                            }
                                                            if (floatedOpen.size > 0 &&
                                                                !clearedDirection.has('both') && (maxBottom == null ||
                                                                adjacent.bounds.top < maxBottom)) {
                                                                if (clearedPartial.has(adjacent)) {
                                                                    const clear = clearedPartial.has(adjacent) ? clearedPartial.get(adjacent) : 'none';
                                                                    if (clear !== 'none') {
                                                                        if (floatedOpen.size < 2 && floated.size === 2 && !adjacent.floating) {
                                                                            adjacent.alignmentType |= NODE_ALIGNMENT.EXTENDABLE;
                                                                            verticalExtended = true;
                                                                            horizontal.push(adjacent);
                                                                            continue;
                                                                        }
                                                                    }
                                                                    else if (floated.size < 2 && (!adjacent.floating ||
                                                                        !floated.has(adjacent.float) ||
                                                                        adjacent.float === horizontal[horizontal.length - 1].float)) {
                                                                        horizontal.push(adjacent);
                                                                        continue;
                                                                    }
                                                                    break mainloop;
                                                                }
                                                                else if (!verticalAlign) {
                                                                    horizontal.push(adjacent);
                                                                    continue;
                                                                }
                                                                if (floated.size === 1 && (!adjacent.floating ||
                                                                    floatedOpen.has(adjacent.float))) {
                                                                    horizontal.push(adjacent);
                                                                    continue;
                                                                }
                                                            }
                                                        }
                                                        break mainloop;
                                                    }
                                                    if (linearVertical && vertical.length > 0) {
                                                        const previousAbove = vertical[vertical.length - 1];
                                                        if (previousAbove.linearVertical) {
                                                            adjacent.parent = previousAbove;
                                                            continue;
                                                        }
                                                    }
                                                    vertical.push(adjacent);
                                                }
                                                else {
                                                    if (vertical.length > 0 || verticalExtended) {
                                                        break mainloop;
                                                    }
                                                    horizontal.push(adjacent);
                                                }
                                            }
                                            else {
                                                break mainloop;
                                            }
                                        }
                                    }
                                }
                                let group = null;
                                let groupOutput = '';
                                if (horizontal.length > 1) {
                                    const clearedPartial = NodeList.cleared(horizontal);
                                    if (Application.isFrameHorizontal(horizontal, clearedPartial)) {
                                        group = this.viewController.createGroup(parentY, nodeY, horizontal);
                                        groupOutput = this.writeFrameLayoutHorizontal(group, parentY, horizontal, clearedPartial);
                                    }
                                    else {
                                        if (horizontal.length === axisY.length) {
                                            parentY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                        }
                                        else {
                                            const floated = NodeList.floated(horizontal);
                                            if (floated.size === 1 &&
                                                horizontal.some(node => node.has('width', CSS_STANDARD.PERCENT)) &&
                                                horizontal.every(node => node.has('width', CSS_STANDARD.UNIT | CSS_STANDARD.PERCENT))) {
                                                group = this.viewController.createGroup(parentY, nodeY, horizontal);
                                                groupOutput = this.writeConstraintLayout(group, parentY);
                                                group.alignmentType |= NODE_ALIGNMENT.PERCENT;
                                            }
                                            else if (Application.isRelativeHorizontal(horizontal, clearedPartial)) {
                                                group = this.viewController.createGroup(parentY, nodeY, horizontal);
                                                groupOutput = this.writeRelativeLayout(group, parentY);
                                                group.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                            }
                                            else {
                                                group = this.viewController.createGroup(parentY, nodeY, horizontal);
                                                groupOutput = this.writeLinearLayout(group, parentY, true);
                                                if (floated.size > 0) {
                                                    group.alignmentType |= NODE_ALIGNMENT.FLOAT;
                                                    group.alignmentType |= horizontal.every(node => node.float === 'right' || node.autoMarginLeft) ? NODE_ALIGNMENT.RIGHT : NODE_ALIGNMENT.LEFT;
                                                }
                                                else {
                                                    group.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                }
                                            }
                                        }
                                    }
                                }
                                else if (vertical.length > 1) {
                                    const floated = NodeList.floated(vertical);
                                    const clearedPartial = NodeList.cleared(vertical);
                                    if (floated.size > 0 &&
                                        clearedPartial.size > 0 &&
                                        !(floated.size === 1 && vertical.slice(1, vertical.length - 1).every(node => clearedPartial.has(node)))) {
                                        if (parentY.linearVertical) {
                                            group = nodeY;
                                            groupOutput = this.writeFrameLayoutVertical(null, parentY, vertical, clearedPartial);
                                        }
                                        else {
                                            group = this.viewController.createGroup(parentY, nodeY, vertical);
                                            groupOutput = this.writeFrameLayoutVertical(group, parentY, vertical, clearedPartial);
                                        }
                                    }
                                    else {
                                        if (vertical.length === axisY.length) {
                                            parentY.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                        }
                                        else if (!linearVertical) {
                                            group = this.viewController.createGroup(parentY, nodeY, vertical);
                                            groupOutput = this.writeLinearLayout(group, parentY, false);
                                            group.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                        }
                                    }
                                    if (vertical.length !== axisY.length) {
                                        const lastNode = vertical[vertical.length - 1];
                                        if (!lastNode.blockStatic && lastNode !== axisY[axisY.length - 1]) {
                                            lastNode.alignmentType |= NODE_ALIGNMENT.EXTENDABLE;
                                        }
                                    }
                                }
                                if (group) {
                                    renderNode(group, parentY, groupOutput, '', true);
                                    parentY = nodeY.parent;
                                }
                                if (nodeY.hasAlign(NODE_ALIGNMENT.EXTENDABLE)) {
                                    nodeY.alignmentType ^= NODE_ALIGNMENT.EXTENDABLE;
                                }
                            }
                        }
                        if (!nodeY.hasBit('excludeSection', APP_SECTION.EXTENSION) && !nodeY.rendered) {
                            let next = false;
                            const subscribed = [];
                            for (const ext of this.extensions) {
                                if (ext.subscribersChild.has(nodeY)) {
                                    subscribed.push(ext);
                                }
                            }
                            for (const ext of [...parentY.renderExtension, ...subscribed]) {
                                ext.setTarget(nodeY, parentY);
                                const result = ext.processChild();
                                if (result.output !== '') {
                                    renderNode(nodeY, parentY, result.output, currentY);
                                }
                                if (result.parent) {
                                    parentY = result.parent;
                                }
                                next = result.next || false;
                                if (result.complete || result.next) {
                                    break;
                                }
                            }
                            if (next) {
                                continue;
                            }
                            if (nodeY.styleElement) {
                                const processed = [];
                                prioritizeExtensions(this.extensions, nodeY.element).some(item => {
                                    if (item.is(nodeY)) {
                                        item.setTarget(nodeY, parentY);
                                        if (item.condition()) {
                                            const result = item.processNode(mapX, mapY);
                                            if (result.output !== '') {
                                                renderNode(nodeY, parentY, result.output, currentY);
                                            }
                                            if (result.parent) {
                                                parentY = result.parent;
                                            }
                                            if (result.output !== '' || result.include) {
                                                processed.push(item);
                                            }
                                            next = result.next || false;
                                            if (result.complete || result.next) {
                                                return true;
                                            }
                                        }
                                    }
                                    return false;
                                });
                                if (processed.length > 0) {
                                    for (const ext of processed) {
                                        ext.subscribers.add(nodeY);
                                        nodeY.renderExtension.add(ext);
                                    }
                                }
                                if (next) {
                                    continue;
                                }
                            }
                        }
                        if (!nodeY.hasBit('excludeSection', APP_SECTION.RENDER) && !nodeY.rendered) {
                            let output = '';
                            if (nodeY.alignmentType === NODE_ALIGNMENT.NONE &&
                                !nodeY.imageElement &&
                                nodeY.has('width', CSS_STANDARD.PERCENT, { not: '100%' }) && (parentY.linearVertical ||
                                (parentY.is(NODE_STANDARD.FRAME) && nodeY.singleChild))) {
                                const group = this.viewController.createGroup(parentY, nodeY, [nodeY]);
                                const groupOutput = this.writeGridLayout(group, parentY, 2, 1);
                                group.alignmentType |= NODE_ALIGNMENT.PERCENT;
                                renderNode(group, parentY, groupOutput, currentY);
                                this.viewController[nodeY.float === 'right' || nodeY.autoMarginLeft ? 'prependBefore' : 'appendAfter'](nodeY.id, this.viewController.renderColumnSpace(group.renderDepth + 1, `${100 - nodeY.toInt('width')}%`));
                                parentY = group;
                            }
                            if (nodeY.controlName === '') {
                                const borderVisible = nodeY.borderTopWidth > 0 || nodeY.borderBottomWidth > 0 || nodeY.borderRightWidth > 0 || nodeY.borderLeftWidth > 0;
                                const backgroundImage = /url(.*?)/.test(nodeY.css('backgroundImage'));
                                const backgroundColor = nodeY.has('backgroundColor');
                                const backgroundVisible = borderVisible || backgroundImage || backgroundColor;
                                if (nodeY.children.length === 0) {
                                    const freeFormText = hasFreeFormText(nodeY.element, this.settings.renderInlineText ? 0 : 1);
                                    if (freeFormText || (borderVisible && nodeY.textContent.length > 0)) {
                                        output = this.writeNode(nodeY, parentY, NODE_STANDARD.TEXT);
                                    }
                                    else if (backgroundImage &&
                                        nodeY.css('backgroundRepeat') === 'no-repeat' &&
                                        (!nodeY.inlineText || nodeY.toInt('textIndent') + nodeY.bounds.width < 0)) {
                                        nodeY.alignmentType |= NODE_ALIGNMENT.SINGLE;
                                        nodeY.excludeResource |= NODE_RESOURCE.FONT_STYLE | NODE_RESOURCE.VALUE_STRING;
                                        output = this.writeNode(nodeY, parentY, NODE_STANDARD.IMAGE);
                                    }
                                    else if (nodeY.block &&
                                        (backgroundColor || backgroundImage) &&
                                        (borderVisible || nodeY.paddingTop + nodeY.paddingRight + nodeY.paddingRight + nodeY.paddingLeft > 0)) {
                                        output = this.writeNode(nodeY, parentY, NODE_STANDARD.LINE);
                                    }
                                    else if (!nodeY.documentRoot) {
                                        if (this.settings.collapseUnattributedElements &&
                                            nodeY.bounds.height === 0 &&
                                            !hasValue(nodeY.element.id) &&
                                            !hasValue(nodeY.dataset.ext) &&
                                            !backgroundVisible) {
                                            parentY.remove(nodeY);
                                            nodeY.hide();
                                        }
                                        else if (backgroundVisible) {
                                            output = this.writeNode(nodeY, parentY, NODE_STANDARD.TEXT);
                                        }
                                        else {
                                            output = this.writeFrameLayout(nodeY, parentY);
                                        }
                                    }
                                }
                                else {
                                    if (nodeY.flex.enabled || nodeY.children.some(node => !node.pageflow) || nodeY.has('columnCount')) {
                                        output = this.writeConstraintLayout(nodeY, parentY);
                                    }
                                    else {
                                        if (nodeY.children.length === 1) {
                                            const targeted = nodeY.children.filter(node => {
                                                if (node.dataset.target) {
                                                    const element = document.getElementById(node.dataset.target);
                                                    return element != null && hasValue(element.dataset.ext) && element !== parentY.element;
                                                }
                                                return false;
                                            });
                                            if ((this.settings.collapseUnattributedElements &&
                                                !nodeY.documentRoot &&
                                                !hasValue(nodeY.element.id) &&
                                                !hasValue(nodeY.dataset.ext) &&
                                                !hasValue(nodeY.dataset.target) &&
                                                nodeY.toInt('width') === 0 &&
                                                nodeY.toInt('height') === 0 &&
                                                !backgroundVisible &&
                                                !nodeY.has('textAlign') && !nodeY.has('verticalAlign') &&
                                                nodeY.float !== 'right' && !nodeY.autoMargin && nodeY.alignOrigin &&
                                                !this.viewController.hasAppendProcessing(nodeY.id)) ||
                                                (nodeY.documentRoot && targeted.length === 1)) {
                                                const child = nodeY.children[0];
                                                child.documentRoot = nodeY.documentRoot;
                                                child.siblingIndex = nodeY.siblingIndex;
                                                if (parentY.id !== 0) {
                                                    child.parent = parentY;
                                                }
                                                if (targeted.length === 0) {
                                                    nodeY.resetBox(BOX_STANDARD.MARGIN, child, true);
                                                    child.modifyBox(BOX_STANDARD.MARGIN_TOP, nodeY.paddingTop);
                                                    child.modifyBox(BOX_STANDARD.MARGIN_RIGHT, nodeY.paddingRight);
                                                    child.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, nodeY.paddingBottom);
                                                    child.modifyBox(BOX_STANDARD.MARGIN_LEFT, nodeY.paddingLeft);
                                                }
                                                nodeY.hide();
                                                axisY[k] = child;
                                                k--;
                                                continue;
                                            }
                                            else {
                                                output = this.writeFrameLayout(nodeY, parentY);
                                            }
                                        }
                                        else {
                                            const children = nodeY.children;
                                            const [linearX, linearY] = [NodeList.linearX(children), NodeList.linearY(children)];
                                            const clearedInside = NodeList.cleared(children);
                                            const relativeWrap = children.every(node => node.pageflow && node.inlineElement);
                                            if (!parentY.flex.enabled && children.every(node => node.pageflow)) {
                                                const floated = NodeList.floated(children);
                                                if (linearX && clearedInside.size === 0) {
                                                    if (floated.size === 0 && children.every(node => node.toInt('verticalAlign') === 0)) {
                                                        if (children.some(node => ['text-top', 'text-bottom'].includes(node.css('verticalAlign')))) {
                                                            output = this.writeConstraintLayout(nodeY, parentY);
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                        }
                                                        else if (Application.isRelativeHorizontal(children)) {
                                                            output = this.writeRelativeLayout(nodeY, parentY);
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                        }
                                                    }
                                                    if (output === '') {
                                                        if (floated.size === 0 || !floated.has('right')) {
                                                            if (Application.isRelativeHorizontal(children)) {
                                                                output = this.writeRelativeLayout(nodeY, parentY);
                                                                nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                            }
                                                            else {
                                                                output = this.writeLinearLayout(nodeY, parentY, true);
                                                                nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                            }
                                                        }
                                                    }
                                                }
                                                else {
                                                    if (linearY ||
                                                        (!relativeWrap && children.some(node => {
                                                            const previous = node.previousSibling();
                                                            return (previous != null && node.alignedVertically(previous, clearedInside));
                                                        }))) {
                                                        output = this.writeLinearLayout(nodeY, parentY, false);
                                                        if (linearY && !nodeY.documentRoot) {
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                                        }
                                                    }
                                                }
                                            }
                                            if (output === '') {
                                                if (relativeWrap) {
                                                    if (Application.isFrameHorizontal(children, clearedInside, true)) {
                                                        output = this.writeFrameLayoutHorizontal(nodeY, parentY, children, clearedInside);
                                                    }
                                                    else {
                                                        output = this.writeRelativeLayout(nodeY, parentY);
                                                        if (getElementsBetweenSiblings(children[0].baseElement, children[children.length - 1].baseElement).filter(element => isLineBreak(element)).length === 0) {
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                        }
                                                    }
                                                }
                                                else {
                                                    output = this.writeConstraintLayout(nodeY, parentY);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                output = this.writeNode(nodeY, parentY, nodeY.controlName);
                            }
                            renderNode(nodeY, parentY, output, currentY);
                        }
                        if (includeSupport && !nodeY.hasBit('excludeSection', APP_SECTION.INCLUDE)) {
                            if (includes$$1.length > 0 && nodeY.dataset.includeEnd === 'true') {
                                includes$$1.pop();
                            }
                        }
                    }
                }
                for (const [key, templates] of partial.entries()) {
                    const content = [];
                    const [parentId, position] = key.split(':');
                    const views = Array.from(templates.values());
                    if (views.length > 0) {
                        if (this._sorted[parentId]) {
                            const parsed = [];
                            this._sorted[parentId].forEach(value => {
                                const result = views.find(view => view.indexOf(formatPlaceholder(value, '@')) !== -1);
                                if (result) {
                                    parsed.push(result);
                                }
                            });
                            if (parsed.length === views.length) {
                                content.push(...parsed);
                            }
                        }
                        if (content.length === 0) {
                            content.push(...views);
                        }
                        const id = parentId + (position ? `:${position}` : '');
                        const placeholder = formatPlaceholder(id);
                        if (baseTemplate.indexOf(placeholder) !== -1) {
                            baseTemplate = replacePlaceholder(baseTemplate, placeholder, content.join(''));
                            empty = false;
                        }
                        else {
                            this.addRenderQueue(id, views);
                        }
                    }
                }
                if (this.viewController.settingsInternal.includes) {
                    for (const [filename, templates] of external.entries()) {
                        const content = Array.from(templates.values());
                        if (content.length > 0) {
                            const output = this.viewController.renderMerge(filename, content);
                            this.createIncludeFile(filename, output);
                        }
                    }
                }
            }
            const root = this.cache.parent;
            if (root.dataset.layoutName && (!hasValue(root.dataset.target) || root.renderExtension.size === 0)) {
                this.createLayoutFile(trimString(trimNull(root.dataset.pathname), '/'), root.dataset.layoutName, empty ? '' : baseTemplate, root.renderExtension.size > 0 && Array.from(root.renderExtension).some(item => item.documentRoot));
            }
            if (!empty) {
                for (const ext of this.extensions) {
                    ext.setTarget(root);
                    ext.afterRender();
                }
            }
            else if (root.renderExtension.size === 0) {
                root.hide();
            }
            this.cache.sort((a, b) => {
                if (!a.visible) {
                    return 1;
                }
                else if (!b.visible) {
                    return -1;
                }
                else if (a.renderDepth !== b.renderDepth) {
                    return a.renderDepth < b.renderDepth ? -1 : 1;
                }
                else {
                    if (!a.domElement) {
                        const nodeA = getNodeFromElement(a.baseElement);
                        if (nodeA) {
                            a = nodeA;
                        }
                        else {
                            return 1;
                        }
                    }
                    if (!b.domElement) {
                        const nodeB = getNodeFromElement(a.baseElement);
                        if (nodeB) {
                            b = nodeB;
                        }
                        else {
                            return -1;
                        }
                    }
                    if (a.documentParent !== b.documentParent) {
                        return a.documentParent.id < b.documentParent.id ? -1 : 1;
                    }
                    else {
                        return a.renderIndex < b.renderIndex ? -1 : 1;
                    }
                }
            });
            this.cacheSession.list.push(...this.cache.list);
        }
        writeFrameLayout(node, parent, children = false) {
            if (!children && node.children.length === 0) {
                return this.viewController.renderNode(node, parent, NODE_STANDARD.FRAME);
            }
            else {
                return this.viewController.renderGroup(node, parent, NODE_STANDARD.FRAME);
            }
        }
        writeLinearLayout(node, parent, horizontal) {
            return this.viewController.renderGroup(node, parent, NODE_STANDARD.LINEAR, { horizontal });
        }
        writeGridLayout(node, parent, columnCount, rowCount = 0) {
            return this.viewController.renderGroup(node, parent, NODE_STANDARD.GRID, { columnCount, rowCount });
        }
        writeRelativeLayout(node, parent) {
            return this.viewController.renderGroup(node, parent, NODE_STANDARD.RELATIVE);
        }
        writeConstraintLayout(node, parent) {
            return this.viewController.renderGroup(node, parent, NODE_STANDARD.CONSTRAINT);
        }
        writeNode(node, parent, nodeName) {
            return this.viewController.renderNode(node, parent, nodeName);
        }
        writeFrameLayoutHorizontal(group, parent, nodes, cleared) {
            let output = '';
            let layers = [];
            if (cleared.size === 0 && !nodes.some(node => node.autoMargin)) {
                const inline = [];
                const left = [];
                const right = [];
                for (const node of nodes) {
                    if (node.floating) {
                        if (node.float === 'right') {
                            right.push(node);
                        }
                        else {
                            left.push(node);
                        }
                    }
                    else {
                        inline.push(node);
                    }
                }
                if (inline.length === nodes.length || left.length === nodes.length || right.length === nodes.length) {
                    group.alignmentType |= inline.length > 0 ? NODE_ALIGNMENT.HORIZONTAL : NODE_ALIGNMENT.FLOAT;
                    if (right.length > 0) {
                        group.alignmentType |= NODE_ALIGNMENT.RIGHT;
                    }
                    if (Application.isRelativeHorizontal(nodes, cleared)) {
                        output = this.writeRelativeLayout(group, parent);
                        return output;
                    }
                    else {
                        output = this.writeLinearLayout(group, parent, true);
                        return output;
                    }
                }
                else if (left.length === 0 || right.length === 0) {
                    const subgroup = right.length === 0 ? [...left, ...inline] : [...inline, ...right];
                    if (NodeList.linearY(subgroup)) {
                        output = this.writeLinearLayout(group, parent, false);
                        group.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                        return output;
                    }
                    else {
                        if (Application.isRelativeHorizontal(subgroup, cleared)) {
                            output = this.writeRelativeLayout(group, parent);
                            group.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                            if (right.length > 0) {
                                group.alignmentType |= NODE_ALIGNMENT.RIGHT;
                            }
                            return output;
                        }
                        else if (right.length === 0) {
                            if (!this.settings.floatOverlapDisabled) {
                                output = this.writeLinearLayout(group, parent, true);
                                layers = [left, inline];
                                group.alignmentType |= NODE_ALIGNMENT.FLOAT;
                            }
                        }
                    }
                }
            }
            const inlineAbove = [];
            const inlineBelow = [];
            const leftAbove = [];
            const rightAbove = [];
            const leftBelow = [];
            const rightBelow = [];
            let leftSub = [];
            let rightSub = [];
            if (layers.length === 0) {
                let current = '';
                let pendingFloat = 0;
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    if (cleared.has(node)) {
                        const clear = cleared.get(node);
                        if (hasBit(pendingFloat, clear === 'right' ? 4 : 2) || (pendingFloat !== 0 && clear === 'both')) {
                            switch (clear) {
                                case 'left':
                                    pendingFloat ^= 2;
                                    current = 'left';
                                    break;
                                case 'right':
                                    pendingFloat ^= 4;
                                    current = 'right';
                                    break;
                                case 'both':
                                    switch (pendingFloat) {
                                        case 2:
                                            current = 'left';
                                            break;
                                        case 4:
                                            current = 'right';
                                            break;
                                        default:
                                            current = 'both';
                                            break;
                                    }
                                    pendingFloat = 0;
                                    break;
                            }
                        }
                    }
                    if (current === '') {
                        if (node.floating) {
                            if (node.float === 'right') {
                                rightAbove.push(node);
                                if (node.floating) {
                                    pendingFloat |= 4;
                                }
                            }
                            else {
                                leftAbove.push(node);
                                if (node.floating) {
                                    pendingFloat |= 2;
                                }
                            }
                        }
                        else if (node.autoMargin) {
                            if (node.autoMarginLeft) {
                                if (rightAbove.length > 0) {
                                    rightBelow.push(node);
                                }
                                else {
                                    rightAbove.push(node);
                                }
                            }
                            else if (node.autoMarginRight) {
                                if (leftAbove.length > 0) {
                                    leftBelow.push(node);
                                }
                                else {
                                    leftAbove.push(node);
                                }
                            }
                            else {
                                if (inlineAbove.length > 0) {
                                    if (leftAbove.length === 0) {
                                        leftAbove.push(node);
                                    }
                                    else {
                                        rightAbove.push(node);
                                    }
                                }
                                else {
                                    inlineAbove.push(node);
                                }
                            }
                        }
                        else {
                            inlineAbove.push(node);
                        }
                    }
                    else {
                        if (node.floating) {
                            if (node.float === 'right') {
                                if (rightBelow.length === 0) {
                                    pendingFloat |= 4;
                                }
                                if (!this.settings.floatOverlapDisabled && current !== 'right' && rightAbove.length > 0) {
                                    rightAbove.push(node);
                                }
                                else {
                                    rightBelow.push(node);
                                }
                            }
                            else {
                                if (leftBelow.length === 0) {
                                    pendingFloat |= 2;
                                }
                                if (!this.settings.floatOverlapDisabled && current !== 'left' && leftAbove.length > 0) {
                                    leftAbove.push(node);
                                }
                                else {
                                    leftBelow.push(node);
                                }
                            }
                        }
                        else if (node.autoMargin) {
                            if (node.autoMarginLeft && rightBelow.length > 0) {
                                rightBelow.push(node);
                            }
                            else if (node.autoMarginRight && leftBelow.length > 0) {
                                leftBelow.push(node);
                            }
                            else {
                                inlineBelow.push(node);
                            }
                        }
                        else {
                            switch (current) {
                                case 'left':
                                    leftBelow.push(node);
                                    break;
                                case 'right':
                                    rightBelow.push(node);
                                    break;
                                default:
                                    inlineBelow.push(node);
                                    break;
                            }
                        }
                    }
                }
                if (leftAbove.length > 0 && leftBelow.length > 0) {
                    leftSub = [leftAbove, leftBelow];
                    if (leftBelow.length > 1) {
                        leftBelow[0].alignmentType |= NODE_ALIGNMENT.EXTENDABLE;
                    }
                }
                else if (leftAbove.length > 0) {
                    leftSub = leftAbove;
                }
                else if (leftBelow.length > 0) {
                    leftSub = leftBelow;
                }
                if (rightAbove.length > 0 && rightBelow.length > 0) {
                    rightSub = [rightAbove, rightBelow];
                    if (rightBelow.length > 1) {
                        rightBelow[0].alignmentType |= NODE_ALIGNMENT.EXTENDABLE;
                    }
                }
                else if (rightAbove.length > 0) {
                    rightSub = rightAbove;
                }
                else if (rightBelow.length > 0) {
                    rightSub = rightBelow;
                }
                if (this.settings.floatOverlapDisabled) {
                    if (parent.linearVertical) {
                        output = formatPlaceholder(group.id);
                        group.renderDepth--;
                    }
                    else {
                        output = this.writeLinearLayout(group, parent, false);
                    }
                    layers.push(inlineAbove, [leftAbove, rightAbove], inlineBelow);
                }
                else {
                    if (inlineAbove.length === 0 &&
                        (leftSub.length === 0 || rightSub.length === 0)) {
                        output = this.writeLinearLayout(group, parent, false);
                        if (rightSub.length > 0) {
                            group.alignmentType |= NODE_ALIGNMENT.RIGHT;
                        }
                    }
                    else {
                        output = this.writeFrameLayout(group, parent, true);
                    }
                    if (inlineAbove.length > 0) {
                        if (rightBelow.length > 0) {
                            leftSub = [inlineAbove, leftAbove];
                            layers.push(leftSub, rightSub);
                        }
                        else if (leftBelow.length > 0) {
                            rightSub = [inlineAbove, rightAbove];
                            layers.push(rightSub, leftSub);
                        }
                        else {
                            layers.push(inlineAbove, leftSub, rightSub);
                        }
                        if (inlineAbove.length > 1) {
                            inlineAbove[0].alignmentType |= NODE_ALIGNMENT.EXTENDABLE;
                        }
                    }
                    else {
                        if ((leftSub === leftBelow && rightSub === rightAbove) || (leftSub === leftAbove && rightSub === rightBelow)) {
                            if (leftBelow.length === 0) {
                                layers.push([leftAbove, rightBelow]);
                            }
                            else {
                                layers.push([rightAbove, leftBelow]);
                            }
                        }
                        else {
                            layers.push(leftSub, rightSub);
                        }
                    }
                    layers = layers.filter(item => item && item.length > 0);
                }
                group.alignmentType |= NODE_ALIGNMENT.FLOAT;
            }
            if (layers.length > 0) {
                let floatgroup = null;
                layers.forEach((item, index) => {
                    if (Array.isArray(item[0])) {
                        const grouping = [];
                        item.forEach(list => grouping.push(...list));
                        grouping.sort(NodeList.siblingIndex);
                        floatgroup = this.viewController.createGroup(group, grouping[0], grouping);
                        if (this.settings.floatOverlapDisabled) {
                            output = replacePlaceholder(output, group.id, this.writeFrameLayout(floatgroup, group, true));
                        }
                        else {
                            output = replacePlaceholder(output, group.id, this.writeLinearLayout(floatgroup, group, false));
                            if (item.some(list => list === rightSub || list === rightAbove)) {
                                floatgroup.alignmentType |= NODE_ALIGNMENT.RIGHT;
                            }
                        }
                        floatgroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                    }
                    else {
                        floatgroup = null;
                    }
                    (Array.isArray(item[0]) ? item : [item]).forEach(section => {
                        let basegroup = group;
                        if (floatgroup && [inlineAbove, leftAbove, leftBelow, rightAbove, rightBelow].includes(section)) {
                            basegroup = floatgroup;
                        }
                        if (section.length > 1) {
                            let groupOutput = '';
                            const subgroup = this.viewController.createGroup(basegroup, section[0], section);
                            const floatLeft = section.some(node => node.float === 'left');
                            const floatRight = section.some(node => node.float === 'right');
                            if (Application.isRelativeHorizontal(section, NodeList.cleared(section))) {
                                groupOutput = this.writeRelativeLayout(subgroup, basegroup);
                                subgroup.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                            }
                            else {
                                groupOutput = this.writeLinearLayout(subgroup, basegroup, NodeList.linearX(section));
                                if (floatRight && subgroup.children.some(node => node.marginLeft < 0)) {
                                    const sorted = [];
                                    let marginRight = 0;
                                    subgroup.children.slice().forEach((node) => {
                                        let prepend = false;
                                        if (marginRight < 0) {
                                            if (Math.abs(marginRight) > node.bounds.width) {
                                                marginRight += node.bounds.width;
                                                node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, node.bounds.width * -1, true);
                                                prepend = true;
                                            }
                                            else {
                                                if (Math.abs(marginRight) >= node.marginRight) {
                                                    node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, Math.ceil(Math.abs(marginRight) - node.marginRight));
                                                    node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, null);
                                                }
                                                else {
                                                    node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, marginRight, true);
                                                }
                                            }
                                        }
                                        if (node.marginLeft < 0) {
                                            marginRight += Math.max(node.marginLeft, node.bounds.width * -1);
                                            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
                                        }
                                        if (prepend) {
                                            sorted.splice(sorted.length - 1, 0, node);
                                        }
                                        else {
                                            sorted.push(node);
                                        }
                                    });
                                    subgroup.children = sorted.reverse();
                                    this.saveSortOrder(subgroup.id, subgroup.children);
                                }
                            }
                            subgroup.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                            if (floatLeft || floatRight) {
                                subgroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                                if (floatRight) {
                                    subgroup.alignmentType |= NODE_ALIGNMENT.RIGHT;
                                }
                            }
                            output = replacePlaceholder(output, basegroup.id, groupOutput);
                            basegroup.appendRendered(subgroup);
                        }
                        else if (section.length > 0) {
                            const single = section[0];
                            single.alignmentType |= NODE_ALIGNMENT.SINGLE;
                            if (single.float === 'right') {
                                single.alignmentType |= NODE_ALIGNMENT.RIGHT;
                            }
                            single.renderPosition = index;
                            output = replacePlaceholder(output, basegroup.id, `{:${basegroup.id}:${index}}`);
                            basegroup.appendRendered(single);
                        }
                    });
                });
            }
            return output;
        }
        writeFrameLayoutVertical(group, parent, nodes, cleared) {
            let output = '';
            if (!group) {
                group = parent;
                output = formatPlaceholder(group.id);
            }
            else {
                output = this.writeLinearLayout(group, parent, false);
                group.alignmentType |= NODE_ALIGNMENT.VERTICAL;
            }
            const rowsCurrent = [];
            const rowsFloated = [];
            const current = [];
            const floated = [];
            let leadingMargin = 0;
            let clearReset = false;
            let linearVertical = true;
            nodes.some(node => {
                if (!node.floating) {
                    leadingMargin += node.linear.height;
                    return true;
                }
                return false;
            });
            for (const node of nodes) {
                if (cleared.has(node)) {
                    if (!node.floating) {
                        node.modifyBox(BOX_STANDARD.MARGIN_TOP, null);
                        rowsCurrent.push(current.slice());
                        current.length = 0;
                        rowsFloated.push(floated.slice());
                        floated.length = 0;
                    }
                    else {
                        clearReset = true;
                    }
                }
                if (node.floating) {
                    floated.push(node);
                }
                else {
                    if (clearReset && !cleared.has(node)) {
                        linearVertical = false;
                    }
                    current.push(node);
                }
            }
            if (floated.length > 0) {
                rowsFloated.push(floated);
            }
            if (current.length > 0) {
                rowsCurrent.push(current);
            }
            if (!linearVertical) {
                let content = '';
                for (let i = 0; i < Math.max(rowsFloated.length, rowsCurrent.length); i++) {
                    const floating = rowsFloated[i] || [];
                    const pageflow = rowsCurrent[i] || [];
                    if (pageflow.length > 0 || floating.length > 0) {
                        const baseNode = floating[0] || pageflow[0];
                        const basegroup = this.viewController.createGroup(group, baseNode, []);
                        const children = [];
                        let subgroup = null;
                        if (floating.length > 1) {
                            subgroup = this.viewController.createGroup(basegroup, floating[0], floating);
                            basegroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                        }
                        else if (floating.length > 0) {
                            subgroup = floating[0];
                            subgroup.parent = basegroup;
                            basegroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                        }
                        if (subgroup) {
                            children.push(subgroup);
                            if (i === 0 && leadingMargin > 0) {
                                subgroup.modifyBox(BOX_STANDARD.MARGIN_TOP, leadingMargin);
                            }
                            subgroup = null;
                        }
                        if (pageflow.length > 1) {
                            subgroup = this.viewController.createGroup(basegroup, pageflow[0], pageflow);
                        }
                        else if (pageflow.length > 0) {
                            subgroup = pageflow[0];
                            subgroup.parent = basegroup;
                        }
                        if (subgroup) {
                            children.push(subgroup);
                        }
                        basegroup.init();
                        content += this.writeFrameLayout(basegroup, group, true);
                        basegroup.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                        children.forEach((node, index) => {
                            if (nodes.includes(node)) {
                                content = replacePlaceholder(content, basegroup.id, `{:${basegroup.id}:${index}}`);
                            }
                            else {
                                content = replacePlaceholder(content, basegroup.id, this.writeLinearLayout(node, basegroup, false));
                                node.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                            }
                        });
                    }
                }
                output = replacePlaceholder(output, group.id, content);
            }
            return output;
        }
        appendRenderQueue() {
            for (const ext of this.extensions) {
                for (const node of ext.subscribers) {
                    ext.setTarget(node);
                    ext.beforeInsert();
                }
            }
            const template = {};
            for (const id in this.renderQueue) {
                const [originalId] = id.split(':');
                let replaceId = originalId;
                if (!isNumber(replaceId)) {
                    const target = getNodeFromElement(document.getElementById(replaceId));
                    if (target) {
                        replaceId = target.id.toString();
                    }
                }
                let output = this.renderQueue[id].join('\n');
                if (replaceId !== originalId) {
                    const target = this.cacheSession.find('id', parseInt(replaceId));
                    if (target) {
                        const depth = target.renderDepth + 1;
                        output = replaceIndent(output, depth);
                        const pattern = /{@([0-9]+)}/g;
                        let match = null;
                        let i = 0;
                        while ((match = pattern.exec(output)) != null) {
                            const node = this.cacheSession.find('id', parseInt(match[1]));
                            if (node) {
                                if (i++ === 0) {
                                    node.renderDepth = depth;
                                }
                                else {
                                    node.renderDepth = node.parent.renderDepth + 1;
                                }
                            }
                        }
                    }
                }
                template[replaceId] = output;
            }
            for (const inner in template) {
                for (const outer in template) {
                    if (inner !== outer) {
                        template[inner] = template[inner].replace(formatPlaceholder(outer), template[outer]);
                        template[outer] = template[outer].replace(formatPlaceholder(inner), template[inner]);
                    }
                }
            }
            for (const value of this.layouts) {
                for (const id in template) {
                    value.content = value.content.replace(formatPlaceholder(id), template[id]);
                }
                value.content = this.viewController.appendRenderQueue(value.content);
            }
            for (const ext of this.extensions) {
                for (const node of ext.subscribers) {
                    ext.setTarget(node);
                    ext.afterInsert();
                }
            }
        }
        createLayoutFile(pathname, filename, content, documentRoot = false) {
            pathname = pathname || this.viewController.settingsInternal.layout.pathName;
            const layout = {
                pathname,
                filename,
                content
            };
            if (documentRoot && this._views.length > 0 && this._views[0].content === '') {
                this._views[0] = layout;
                this._currentIndex = 0;
            }
            else {
                this.layoutProcessing = layout;
            }
        }
        createIncludeFile(filename, content) {
            this._includes.push({
                pathname: this.viewController.settingsInternal.layout.pathName,
                filename,
                content
            });
        }
        addRenderQueue(id, views) {
            if (this.renderQueue[id] == null) {
                this.renderQueue[id] = [];
            }
            this.renderQueue[id].push(...views);
        }
        saveSortOrder(id, nodes) {
            this._sorted[id.toString()] = nodes.map(node => node.id);
        }
        insertNode(element, parent) {
            let node = null;
            if (element.nodeName.charAt(0) === '#') {
                if (element.nodeName === '#text') {
                    if (isPlainText(element, true) || cssParent(element, 'whiteSpace', 'pre', 'pre-wrap')) {
                        node = new this.nodeObject(this.cache.nextId, element);
                        this.viewController.initNode(node);
                        node.nodeName = 'PLAINTEXT';
                        if (parent) {
                            node.parent = parent;
                            node.inherit(parent, 'style');
                        }
                        else {
                            node.css('whiteSpace', (element.parentElement ? getStyle(element.parentElement).whiteSpace : null) || 'normal');
                        }
                        node.css({
                            position: 'static',
                            display: 'inline',
                            clear: 'none',
                            cssFloat: 'none',
                            verticalAlign: 'baseline'
                        });
                    }
                }
            }
            else if (isStyleElement(element)) {
                const elementNode = new this.nodeObject(this.cache.nextId, element);
                this.viewController.initNode(elementNode);
                if (isElementVisible(element)) {
                    node = elementNode;
                    node.setExclusions();
                }
                else {
                    elementNode.excluded = true;
                    elementNode.visible = false;
                }
            }
            if (node) {
                this.cache.append(node);
            }
            return node;
        }
        getExtension(name) {
            return this.extensions.find(item => item.name === name);
        }
        toString() {
            return this._views.length > 0 ? this._views[0].content : '';
        }
        setStyleMap() {
            let warning = false;
            for (let i = 0; i < document.styleSheets.length; i++) {
                const styleSheet = document.styleSheets[i];
                if (styleSheet.cssRules) {
                    for (let j = 0; j < styleSheet.cssRules.length; j++) {
                        try {
                            const rule = styleSheet.cssRules[j];
                            const attrs = new Set();
                            for (const attr of Array.from(rule.style)) {
                                attrs.add(convertCamelCase(attr));
                            }
                            Array.from(document.querySelectorAll(rule.selectorText)).forEach((element) => {
                                for (const attr of Array.from(element.style)) {
                                    attrs.add(convertCamelCase(attr));
                                }
                                const style = getStyle(element);
                                const styleMap = {};
                                for (const attr of attrs) {
                                    const value = rule.style[attr];
                                    if (element.style[attr]) {
                                        styleMap[attr] = element.style[attr];
                                    }
                                    else if (style[attr] === value) {
                                        styleMap[attr] = style[attr];
                                    }
                                    else if (value) {
                                        switch (attr) {
                                            case 'fontSize':
                                                styleMap[attr] = style[attr] || value;
                                                break;
                                            case 'width':
                                            case 'height':
                                            case 'lineHeight':
                                            case 'verticalAlign':
                                            case 'columnGap':
                                            case 'top':
                                            case 'right':
                                            case 'bottom':
                                            case 'left':
                                            case 'marginTop':
                                            case 'marginRight':
                                            case 'marginBottom':
                                            case 'marginLeft':
                                            case 'paddingTop':
                                            case 'paddingRight':
                                            case 'paddingBottom':
                                            case 'paddingLeft':
                                                styleMap[attr] = /^[A-Za-z\-]+$/.test(value) || isPercent(value) ? value : convertPX(value, style.fontSize);
                                                break;
                                            default:
                                                if (styleMap[attr] == null) {
                                                    styleMap[attr] = value;
                                                }
                                                break;
                                        }
                                    }
                                }
                                if (this.settings.preloadImages &&
                                    hasValue(styleMap['backgroundImage']) &&
                                    styleMap['backgroundImage'] !== 'initial') {
                                    styleMap['backgroundImage'].split(',')
                                        .map((value) => value.trim())
                                        .forEach(value => {
                                        const url = cssResolveUrl(value);
                                        if (url !== '' && !this._cacheImage.has(url)) {
                                            this._cacheImage.set(url, { width: 0, height: 0, url });
                                        }
                                    });
                                }
                                const data = getElementCache(element, 'styleMap');
                                if (data) {
                                    Object.assign(data, styleMap);
                                }
                                else {
                                    setElementCache(element, 'style', style);
                                    setElementCache(element, 'styleMap', styleMap);
                                }
                            });
                        }
                        catch (error) {
                            if (!warning) {
                                alert('External CSS files cannot be parsed when loading this program from your hard drive with Chrome 64+ (file://). ' +
                                    'Either use a local web server (http://), embed your CSS files into a <style> tag, or use a different browser. ' +
                                    'See the README for further instructions.\n\n' +
                                    `${styleSheet.href}\n\n${error}`);
                                warning = true;
                            }
                        }
                    }
                }
            }
        }
        set appName(value) {
            if (this.resourceHandler) {
                this.resourceHandler.file.appName = value;
            }
        }
        get appName() {
            return this.resourceHandler ? this.resourceHandler.file.appName : '';
        }
        set settings(value) {
            this._settings = value;
            if (this.viewController) {
                this.viewController.settings = value;
            }
            if (this.resourceHandler) {
                this.resourceHandler.settings = value;
            }
        }
        get settings() {
            return this._settings ? this._settings : {};
        }
        set layoutProcessing(value) {
            this._currentIndex = this._views.length;
            this._views.push(value);
        }
        get layoutProcessing() {
            return this._views[this._currentIndex];
        }
        get layouts() {
            return [...this._views, ...this._includes];
        }
        get viewData() {
            return {
                cache: this.cacheSession,
                views: this._views,
                includes: this._includes
            };
        }
        get size() {
            return this._views.length + this._includes.length;
        }
    }

    class Controller {
        constructor() {
            this._before = {};
            this._after = {};
        }
        reset() {
            this._before = {};
            this._after = {};
        }
        appendRenderQueue(output) {
            for (const id in this._before) {
                output = output.replace(`{<${id}}`, this._before[id].join(''));
            }
            for (const id in this._after) {
                output = output.replace(`{>${id}}`, this._after[id].join(''));
            }
            return output;
        }
        prependBefore(id, output, index = -1) {
            if (this._before[id] == null) {
                this._before[id] = [];
            }
            if (index !== -1 && index < this._before[id].length) {
                this._before[id].splice(index, 0, output);
            }
            else {
                this._before[id].push(output);
            }
        }
        appendAfter(id, output, index = -1) {
            if (this._after[id] == null) {
                this._after[id] = [];
            }
            if (index !== -1 && index < this._after[id].length) {
                this._after[id].splice(index, 0, output);
            }
            else {
                this._after[id].push(output);
            }
        }
        hasAppendProcessing(id) {
            return this._before[id] != null || this._after[id] != null;
        }
    }

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
    for (const name in X11_CSS3) {
        const x11 = X11_CSS3[name];
        x11.name = name;
        const rgb = convertToRGB(x11['hex']);
        if (rgb) {
            x11.rgb = rgb;
            x11.hsl = convertToHSL(x11.rgb);
            HSL_SORTED.push(x11);
        }
    }
    HSL_SORTED.sort(sortHSL);
    function convertToHSL({ r = 0, g = 0, b = 0 }) {
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
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
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
        return {
            h: h * 360,
            s: s * 100,
            l: l * 100
        };
    }
    function sortHSL(a, b) {
        if (a.hsl && b.hsl) {
            let [c, d] = [a.hsl.h, b.hsl.h];
            if (c === d) {
                [c, d] = [a.hsl.s, b.hsl.s];
                if (c === d) {
                    [c, d] = [a.hsl.l, b.hsl.l];
                }
            }
            return c >= d ? 1 : -1;
        }
        return 0;
    }
    function formatRGB(rgb) {
        return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';
    }
    function getColorNearest(value) {
        const result = HSL_SORTED.slice();
        let index = result.findIndex(item => item.hex === value);
        if (index !== -1) {
            return result[index];
        }
        else {
            const rgb = convertToRGB(value);
            if (rgb) {
                const hsl = convertToHSL(rgb);
                if (hsl) {
                    result.push({
                        name: '',
                        hsl,
                        rgb: { r: -1, g: -1, b: -1 },
                        hex: ''
                    });
                    result.sort(sortHSL);
                    index = result.findIndex(item => item.name === '');
                    return result[Math.min(index + 1, result.length - 1)];
                }
            }
            return null;
        }
    }
    function getColorByName(value) {
        for (const color in X11_CSS3) {
            if (color.toLowerCase() === value.trim().toLowerCase()) {
                return X11_CSS3[color];
            }
        }
        return null;
    }
    function parseRGBA(value, opacity = '1') {
        if (value !== '') {
            if (value === 'initial') {
                value = '#000000';
            }
            else if (value === 'transparent') {
                value = '#000000';
                opacity = '0';
            }
            else {
                const color = getColorByName(value);
                if (color) {
                    return [color.hex, formatRGB(color.rgb), opacity];
                }
            }
            const rgb = convertToRGB(value);
            if (rgb) {
                value = formatRGB(rgb);
            }
            const match = value.match(/rgb(?:a)?\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})(?:, ([0-9\.]{1,3}))?\)/);
            if (match && match.length >= 4 && match[4] !== '0') {
                if (match[4] == null) {
                    match[4] = opacity;
                }
                return [
                    `#${convertToHex(match[1]) + convertToHex(match[2]) + convertToHex(match[3])}`,
                    match[0],
                    parseFloat(match[4]) < 1 ? parseFloat(match[4]).toFixed(2) : '1'
                ];
            }
        }
        return [];
    }
    function convertToHex(value) {
        const hex = '0123456789ABCDEF';
        let rgb = parseInt(value);
        if (isNaN(rgb)) {
            return '00';
        }
        rgb = Math.max(0, Math.min(rgb, 255));
        return hex.charAt((rgb - (rgb % 16)) / 16) + hex.charAt(rgb % 16);
    }
    function convertToRGB(value) {
        value = value.replace('#', '').trim();
        if (value.length === 3) {
            value = value.charAt(0).repeat(2) + value.charAt(1).repeat(2) + value.charAt(2).repeat(2);
        }
        if (value.length === 6) {
            return {
                r: parseInt(value.substring(0, 2), 16),
                g: parseInt(value.substring(2, 4), 16),
                b: parseInt(value.substring(4), 16)
            };
        }
        return null;
    }
    function parseHex(value) {
        if (value !== '') {
            value = value.trim();
            const color = parseRGBA(value);
            if (color.length > 0) {
                value = color[0];
            }
            if (value.charAt(0) === '#' && /^#[a-zA-Z0-9]{3,6}$/.test(value)) {
                const rgb = convertToRGB(value);
                return value.length === 4 && rgb ? parseRGBA(formatRGB(rgb))[0] : value;
            }
        }
        return '';
    }
    function reduceToRGB(value, percent) {
        const rgb = convertToRGB(value);
        if (rgb) {
            const base = percent < 0 ? 0 : 255;
            percent = Math.abs(percent);
            return `rgb(${Math.round((base - rgb.r) * percent) + rgb.r}, ${Math.round((base - rgb.g) * percent) + rgb.g}, ${Math.round((base - rgb.b) * percent) + rgb.b})`;
        }
        return value;
    }

    var color = /*#__PURE__*/Object.freeze({
        getColorNearest: getColorNearest,
        getColorByName: getColorByName,
        parseRGBA: parseRGBA,
        convertToHex: convertToHex,
        convertToRGB: convertToRGB,
        parseHex: parseHex,
        reduceToRGB: reduceToRGB
    });

    class Resource {
        constructor(file) {
            this.file = file;
            this.file.stored = Resource.STORED;
        }
        static insertStoredAsset(asset, name, value) {
            const stored = Resource.STORED[asset];
            if (stored) {
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
        static isBorderVisible(border) {
            return border != null && !(border.style === 'none' || border.width === '0px' || (Array.isArray(border.color) && (border.color.length === 0 || border.color[2] === '0')));
        }
        static hasDrawableBackground(object) {
            return (object != null && (this.isBorderVisible(object.borderTop) ||
                this.isBorderVisible(object.borderRight) ||
                this.isBorderVisible(object.borderBottom) ||
                this.isBorderVisible(object.borderLeft) ||
                object.borderRadius.length > 0 ||
                (object.backgroundImage !== '' && object.backgroundImage !== 'none')));
        }
        addFile(pathname, filename, content = '', uri = '') {
            this.file.addFile(pathname, filename, content, uri);
        }
        reset() {
            for (const name in Resource.STORED) {
                Resource.STORED[name] = new Map();
            }
            this.file.reset();
        }
        setBoxSpacing() {
            this.cache.elements.forEach(node => {
                if (!node.hasBit('excludeResource', NODE_RESOURCE.BOX_SPACING) && (!getElementCache(node.element, 'boxSpacing') ||
                    this.settings.alwaysReevaluateResources)) {
                    const result = getBoxSpacing(node.element);
                    const formatted = {};
                    for (const attr in result) {
                        if (node.inlineStatic && (attr === 'marginTop' || attr === 'marginBottom')) {
                            formatted[attr] = '0px';
                        }
                        else {
                            formatted[attr] = convertPX(result[attr], node.css('fontSize'));
                        }
                    }
                    setElementCache(node.element, 'boxSpacing', formatted);
                }
            });
        }
        setBoxStyle() {
            this.cache.elements.forEach(node => {
                if (!node.hasBit('excludeResource', NODE_RESOURCE.BOX_STYLE) && (!getElementCache(node.element, 'boxStyle') ||
                    this.settings.alwaysReevaluateResources)) {
                    const boxStyle = {
                        borderTop: null,
                        borderRight: null,
                        borderBottom: null,
                        borderLeft: null,
                        borderRadius: null,
                        backgroundColor: null,
                        backgroundSize: null,
                        backgroundImage: null,
                        backgroundRepeat: null,
                        backgroundPositionX: null,
                        backgroundPositionY: null
                    };
                    for (const attr in boxStyle) {
                        const value = node.css(attr);
                        switch (attr) {
                            case 'borderTop':
                            case 'borderRight':
                            case 'borderBottom':
                            case 'borderLeft': {
                                let cssColor = node.css(`${attr}Color`);
                                switch (cssColor) {
                                    case 'initial':
                                        cssColor = value;
                                        break;
                                    case 'inherit':
                                    case 'currentColor':
                                        cssColor = cssInherit(node.element, `${attr}Color`);
                                        break;
                                }
                                const style = node.css(`${attr}Style`) || 'none';
                                let width = node.css(`${attr}Width`) || '1px';
                                const color = style !== 'none' ? parseRGBA(cssColor, node.css('opacity')) : [];
                                if (style === 'inset' && width === '0px') {
                                    width = '1px';
                                }
                                boxStyle[attr] = {
                                    style,
                                    width,
                                    color: color.length > 0 ? color : ['#000000', 'rgb(0, 0, 0)', '0']
                                };
                                break;
                            }
                            case 'borderRadius': {
                                const [top, right, bottom, left] = [
                                    node.css('borderTopLeftRadius'),
                                    node.css('borderTopRightRadius'),
                                    node.css('borderBottomLeftRadius'),
                                    node.css('borderBottomRightRadius')
                                ];
                                if (top === right && right === bottom && bottom === left) {
                                    boxStyle[attr] = top === '' || top === '0px' ? [] : [top];
                                }
                                else {
                                    boxStyle[attr] = [top, right, bottom, left];
                                }
                                break;
                            }
                            case 'backgroundColor': {
                                boxStyle[attr] = parseRGBA(value, node.css('opacity'));
                                break;
                            }
                            case 'backgroundSize': {
                                const fontSize = node.css('fontSize');
                                let result = [];
                                if (value !== 'auto' && value !== 'auto auto' && value !== 'initial' && value !== '0px') {
                                    const match = value.match(/^([0-9\.]+(?:px|pt|em|%)|auto)(?: ([0-9\.]+(?:px|pt|em|%)|auto))?(?: ([0-9\.]+(?:px|pt|em)))?(?: ([0-9\.]+(?:px|pt|em)))?$/);
                                    if (match) {
                                        if (match[1] === 'auto' || match[2] === 'auto') {
                                            result = [match[1] === 'auto' ? '' : convertPX(match[1], fontSize), match[2] === 'auto' ? '' : convertPX(match[2], fontSize)];
                                        }
                                        else if (isPercent(match[1]) && match[3] == null) {
                                            result = [match[1], match[2]];
                                        }
                                        else if (match[2] == null || (match[1] === match[2] && match[1] === match[3] && match[1] === match[4])) {
                                            result = [convertPX(match[1], fontSize)];
                                        }
                                        else if (match[3] == null || (match[1] === match[3] && match[2] === match[4])) {
                                            result = [convertPX(match[1], fontSize), convertPX(match[2], fontSize)];
                                        }
                                        else {
                                            result = [convertPX(match[1], fontSize), convertPX(match[2], fontSize), convertPX(match[3], fontSize), convertPX(match[4], fontSize)];
                                        }
                                    }
                                }
                                boxStyle[attr] = result;
                                break;
                            }
                            case 'backgroundImage': {
                                boxStyle[attr] = !node.hasBit('excludeResource', NODE_RESOURCE.IMAGE_SOURCE) ? value : '';
                                break;
                            }
                            case 'backgroundRepeat':
                            case 'backgroundPositionX':
                            case 'backgroundPositionY': {
                                boxStyle[attr] = value;
                                break;
                            }
                        }
                    }
                    if (Array.isArray(boxStyle.backgroundColor) &&
                        !node.has('backgroundColor') && (node.cssParent('backgroundColor', false, true) === boxStyle.backgroundColor[1] ||
                        (node.documentParent.visible && cssFromParent(node.element, 'backgroundColor')))) {
                        boxStyle.backgroundColor.length = 0;
                    }
                    if (boxStyle.borderTop.style !== 'none') {
                        const borderTop = JSON.stringify(boxStyle.borderTop);
                        if (borderTop === JSON.stringify(boxStyle.borderRight) &&
                            borderTop === JSON.stringify(boxStyle.borderBottom) &&
                            borderTop === JSON.stringify(boxStyle.borderLeft)) {
                            boxStyle.border = boxStyle.borderTop;
                        }
                    }
                    setElementCache(node.element, 'boxStyle', boxStyle);
                }
            });
        }
        setFontStyle() {
            this.cache.each(node => {
                if (!node.hasBit('excludeResource', NODE_RESOURCE.FONT_STYLE) && (!getElementCache(node.element, 'fontStyle') ||
                    this.settings.alwaysReevaluateResources)) {
                    const backgroundImage = Resource.hasDrawableBackground(getElementCache(node.element, 'boxStyle'));
                    if (node.length > 0 ||
                        node.imageElement ||
                        node.tagName === 'HR' ||
                        (node.inlineText && !backgroundImage && !node.preserveWhiteSpace && node.element.innerHTML.trim() === '')) {
                        return;
                    }
                    else {
                        const color = parseRGBA(node.css('color'), node.css('opacity'));
                        const backgroundColor = parseRGBA(node.css('backgroundColor'), node.css('opacity'));
                        if (backgroundColor.length > 0 && (backgroundImage ||
                            (node.cssParent('backgroundColor', false, true) === backgroundColor[1] && (node.plainText || backgroundColor[1] !== node.styleMap.backgroundColor)) ||
                            (!node.has('backgroundColor') && cssFromParent(node.element, 'backgroundColor')))) {
                            backgroundColor.length = 0;
                        }
                        let fontFamily = node.css('fontFamily');
                        let fontSize = node.css('fontSize');
                        let fontWeight = node.css('fontWeight');
                        if (isUserAgent(USER_AGENT.EDGE) && !node.has('fontFamily')) {
                            switch (node.tagName) {
                                case 'TT':
                                case 'CODE':
                                case 'KBD':
                                case 'SAMP':
                                    fontFamily = 'monospace';
                                    break;
                            }
                        }
                        if (convertInt(fontSize) === 0) {
                            switch (fontSize) {
                                case 'xx-small':
                                    fontSize = '8px';
                                    break;
                                case 'x-small':
                                    fontSize = '10px';
                                    break;
                                case 'small':
                                    fontSize = '13px';
                                    break;
                                case 'medium':
                                    fontSize = '16px';
                                    break;
                                case 'large':
                                    fontSize = '18px';
                                    break;
                                case 'x-large':
                                    fontSize = '24px';
                                    break;
                                case 'xx-large':
                                    fontSize = '32px';
                                    break;
                            }
                        }
                        if (!isNumber(fontWeight)) {
                            switch (fontWeight) {
                                case 'lighter':
                                    fontWeight = '200';
                                    break;
                                case 'bold':
                                    fontWeight = '700';
                                    break;
                                case 'bolder':
                                    fontWeight = '900';
                                    break;
                                default:
                                    fontWeight = '400';
                                    break;
                            }
                        }
                        const result = {
                            fontFamily,
                            fontStyle: node.css('fontStyle'),
                            fontSize,
                            fontWeight,
                            color,
                            backgroundColor
                        };
                        setElementCache(node.element, 'fontStyle', result);
                    }
                }
            });
        }
        setImageSource() {
            this.cache.visible.forEach(node => {
                if (!node.hasBit('excludeResource', NODE_RESOURCE.IMAGE_SOURCE) && (!getElementCache(node.element, 'imageSource') ||
                    this.settings.alwaysReevaluateResources)) {
                    if (node.svgElement) {
                        const element = node.element;
                        if (element.children.length > 0) {
                            function getPath(item, d, clipPath) {
                                if (d === '') {
                                    d = cssAttribute(item, 'd');
                                }
                                if (d && d !== 'none' && cssAttribute(item, 'display') !== 'none' && !['hidden', 'collpase'].includes(cssAttribute(item, 'visibility'))) {
                                    let fillColor = cssAttribute(item, 'fill');
                                    let strokeColor = cssAttribute(item, 'stroke');
                                    const color = parseHex(cssAttribute(item, 'color'));
                                    if (fillColor !== '') {
                                        switch (fillColor) {
                                            case 'none':
                                            case 'transparent':
                                                fillColor = '';
                                                break;
                                            case 'currentColor':
                                                fillColor = color || parseHex(cssInherit(item, 'color'));
                                                break;
                                            default:
                                                fillColor = parseHex(fillColor);
                                                break;
                                        }
                                    }
                                    if (strokeColor !== '') {
                                        switch (strokeColor) {
                                            case 'none':
                                            case 'transparent':
                                                strokeColor = '';
                                                break;
                                            case 'currentColor':
                                                strokeColor = color || parseHex(cssInherit(item, 'color'));
                                                break;
                                            default:
                                                strokeColor = parseHex(strokeColor);
                                                break;
                                        }
                                    }
                                    const fillAlpha = parseFloat(cssAttribute(item, 'fill-opacity'));
                                    const strokeAlpha = parseFloat(cssAttribute(item, 'stroke-opacity'));
                                    return {
                                        name: item.id,
                                        color,
                                        fillColor,
                                        strokeColor,
                                        strokeWidth: convertInt(cssAttribute(item, 'stroke-width')).toString(),
                                        fillAlpha: !isNaN(fillAlpha) && fillAlpha < 1 ? fillAlpha : 1,
                                        strokeAlpha: !isNaN(strokeAlpha) && strokeAlpha < 1 ? strokeAlpha : 1,
                                        strokeLineCap: cssAttribute(item, 'stroke-linecap'),
                                        strokeLineJoin: cssAttribute(item, 'stroke-linejoin'),
                                        strokeMiterLimit: cssAttribute(item, 'stroke-miterlimit'),
                                        clipPath,
                                        d
                                    };
                                }
                                return null;
                            }
                            const opacity = parseFloat(node.css('opacity'));
                            const svg = {
                                element,
                                name: element.id,
                                width: element.width.baseVal.value,
                                height: element.height.baseVal.value,
                                viewBoxWidth: element.viewBox.baseVal.width,
                                viewBoxHeight: element.viewBox.baseVal.height,
                                opacity: !isNaN(opacity) && opacity < 1 ? opacity : 1,
                                children: []
                            };
                            const gOrSvg = Array.from(element.children).filter(item => item.tagName === 'svg' || item.tagName === 'g');
                            [element, ...gOrSvg].forEach((item, index) => {
                                const group = {
                                    element: item,
                                    name: element.id || `group_${index}`,
                                    translateX: 0,
                                    translateY: 0,
                                    scaleX: 1,
                                    scaleY: 1,
                                    rotation: 0,
                                    skewX: 0,
                                    skewY: 0,
                                    nestedSVG: false,
                                    children: []
                                };
                                if (item.tagName === 'g') {
                                    const g = item;
                                    for (let i = 0; i < g.transform.baseVal.numberOfItems; i++) {
                                        const transform = g.transform.baseVal.getItem(i);
                                        switch (transform.type) {
                                            case SVGTransform.SVG_TRANSFORM_TRANSLATE:
                                                group.translateX = transform.matrix.e;
                                                group.translateY = transform.matrix.f;
                                                break;
                                            case SVGTransform.SVG_TRANSFORM_SCALE:
                                                group.scaleX = transform.matrix.a;
                                                group.scaleY = transform.matrix.d;
                                                break;
                                            case SVGTransform.SVG_TRANSFORM_ROTATE:
                                                group.rotation = transform.angle;
                                                break;
                                            case SVGTransform.SVG_TRANSFORM_SKEWX:
                                                group.skewX = transform.angle;
                                                break;
                                            case SVGTransform.SVG_TRANSFORM_SKEWY:
                                                group.skewY = transform.angle;
                                                break;
                                        }
                                    }
                                }
                                else {
                                    if (index > 0) {
                                        group.x = item.x.baseVal.value;
                                        group.y = item.y.baseVal.value;
                                        group.nestedSVG = true;
                                    }
                                }
                                const clipPath = Array.from(item.children).filter(path => path.tagName === 'clipPath');
                                [item, ...clipPath].forEach((shape, layerIndex) => {
                                    for (let i = 0; i < shape.children.length; i++) {
                                        const tagName = shape.children[i].tagName;
                                        const clipped = layerIndex > 0;
                                        switch (tagName) {
                                            case 'path': {
                                                const subitem = shape.children[i];
                                                const path = getPath(subitem, '', clipped);
                                                if (path) {
                                                    group.children.push(path);
                                                }
                                                break;
                                            }
                                            case 'line': {
                                                const subitem = shape.children[i];
                                                if (subitem.x1.baseVal.value !== 0 || subitem.y1.baseVal.value !== 0 || subitem.x2.baseVal.value !== 0 || subitem.y2.baseVal.value !== 0) {
                                                    const path = getPath(subitem, `M${subitem.x1.baseVal.value},${subitem.y1.baseVal.value} L${subitem.x2.baseVal.value},${subitem.y2.baseVal.value}`, clipped);
                                                    if (path && path.strokeColor) {
                                                        path.fillColor = '';
                                                        group.children.push(path);
                                                    }
                                                }
                                                break;
                                            }
                                            case 'rect': {
                                                const subitem = shape.children[i];
                                                if (subitem.width.baseVal.value > 0 && subitem.height.baseVal.value > 0) {
                                                    const x = subitem.x.baseVal.value;
                                                    const y = subitem.y.baseVal.value;
                                                    const path = getPath(subitem, `M${x},${y} H${x + subitem.width.baseVal.value} V${y + subitem.height.baseVal.value} H${x} L${x},${y}`, clipped);
                                                    if (path) {
                                                        group.children.push(path);
                                                    }
                                                }
                                                break;
                                            }
                                            case 'polyline':
                                            case 'polygon': {
                                                const subitem = shape.children[i];
                                                if (subitem.points.numberOfItems > 0) {
                                                    const d = [];
                                                    for (let j = 0; j < subitem.points.numberOfItems; j++) {
                                                        const point = subitem.points.getItem(j);
                                                        d.push(`${point.x},${point.y}`);
                                                    }
                                                    const path = getPath(subitem, `M${d.join(' ') + (tagName === 'polygon' ? 'z' : '')}`, clipped);
                                                    if (path) {
                                                        group.children.push(path);
                                                    }
                                                }
                                                break;
                                            }
                                            case 'circle': {
                                                const subitem = shape.children[i];
                                                const r = subitem.r.baseVal.value;
                                                if (r > 0) {
                                                    const path = getPath(subitem, `M${subitem.cx.baseVal.value},${subitem.cy.baseVal.value} m-${r},0 a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 -${r * 2},0`, clipped);
                                                    if (path) {
                                                        group.children.push(path);
                                                    }
                                                }
                                                break;
                                            }
                                            case 'ellipse': {
                                                const subitem = shape.children[i];
                                                const rx = subitem.rx.baseVal.value;
                                                const ry = subitem.ry.baseVal.value;
                                                if (rx > 0 && ry > 0) {
                                                    const path = getPath(subitem, `M${subitem.cx.baseVal.value - rx},${subitem.cy.baseVal.value}a${rx},${ry} 0 1,0 ${rx * 2},0a${rx},${ry} 0 1,0 -${rx * 2},0`, clipped);
                                                    if (path) {
                                                        group.children.push(path);
                                                    }
                                                }
                                                break;
                                            }
                                        }
                                    }
                                });
                                svg.children.push(group);
                            });
                            if (svg.children.length > 0) {
                                setElementCache(element, 'imageSource', svg);
                            }
                        }
                    }
                }
            });
        }
        setValueString() {
            function parseWhiteSpace(node, value) {
                if (node.multiLine && !node.renderParent.linearVertical) {
                    value = value.replace(/^\s*\n/, '');
                }
                switch (node.css('whiteSpace')) {
                    case 'nowrap':
                        value = value.replace(/\n/g, ' ');
                        break;
                    case 'pre':
                    case 'pre-wrap':
                        if (!node.renderParent.linearVertical) {
                            value = value.replace(/^\n/, '');
                        }
                        value = value.replace(/\n/g, '\\n');
                        value = value.replace(/\s/g, '&#160;');
                        break;
                    case 'pre-line':
                        value = value.replace(/\n/g, '\\n');
                        value = value.replace(/\s+/g, ' ');
                        break;
                    default:
                        if (isLineBreak(node.element.previousSibling)) {
                            value = value.replace(/^\s+/, '');
                        }
                        if (isLineBreak(node.element.nextSibling)) {
                            value = value.replace(/\s+$/, '');
                        }
                        return [value, false];
                }
                return [value, true];
            }
            this.cache.visible.forEach(node => {
                const element = node.element;
                if (!node.hasBit('excludeResource', NODE_RESOURCE.VALUE_STRING) && (!getElementCache(element, 'valueString') ||
                    this.settings.alwaysReevaluateResources)) {
                    let name = '';
                    let value = '';
                    let inlineTrim = false;
                    let performTrim = true;
                    if (element instanceof HTMLInputElement) {
                        switch (element.type) {
                            case 'text':
                            case 'number':
                            case 'email':
                            case 'search':
                            case 'submit':
                            case 'reset':
                            case 'button':
                                value = element.value.trim();
                                break;
                            default:
                                if (node.companion && !node.companion.visible) {
                                    value = node.companion.textContent.trim();
                                }
                                break;
                        }
                    }
                    else if (element instanceof HTMLTextAreaElement) {
                        value = element.value.trim();
                    }
                    else if (element instanceof HTMLElement) {
                        if (element.tagName === 'BUTTON') {
                            value = element.innerText;
                        }
                        else if (node.inlineText) {
                            name = node.textContent.trim();
                            value = replaceEntity(element.children.length > 0 || element.tagName === 'CODE' ? element.innerHTML : node.textContent);
                            [value, inlineTrim] = parseWhiteSpace(node, value);
                            value = value.replace(/\s*<br\s*\/?>\s*/g, '\\n');
                            value = value.replace(/\s+(class|style)=".*?"/g, '');
                        }
                        else if (element.innerText.trim() === '' && Resource.hasDrawableBackground(getElementCache(element, 'boxStyle'))) {
                            value = replaceEntity(element.innerText);
                            performTrim = false;
                        }
                    }
                    else if (node.plainText) {
                        name = node.textContent.trim();
                        value = replaceEntity(node.textContent);
                        value = value.replace(/&[A-Za-z]+;/g, match => match.replace('&', '&amp;'));
                        [value, inlineTrim] = parseWhiteSpace(node, value);
                    }
                    if (value !== '') {
                        if (performTrim) {
                            const previousSibling = node.previousSibling();
                            const nextSibling = node.nextSibling();
                            let previousSpaceEnd = false;
                            if (!previousSibling || previousSibling.multiLine || previousSibling.lineBreak) {
                                value = value.replace(/^\s+/, '');
                            }
                            else {
                                previousSpaceEnd = /\s+$/.test(previousSibling.element.innerText || previousSibling.element.textContent || '');
                            }
                            if (inlineTrim) {
                                const original = value;
                                value = value.trim();
                                if (previousSibling &&
                                    !previousSibling.block &&
                                    !previousSibling.lineBreak &&
                                    !previousSpaceEnd && /^\s+/.test(original)) {
                                    value = '&#160;' + value;
                                }
                                if (nextSibling && !nextSibling.lineBreak && /\s+$/.test(original)) {
                                    value = value + '&#160;';
                                }
                            }
                            else {
                                if (!/^\s+$/.test(value)) {
                                    value = value.replace(/^\s+/, (previousSibling && (previousSibling.block ||
                                        previousSibling.lineBreak ||
                                        (previousSibling.element instanceof HTMLElement && previousSibling.element.innerText.length > 1 && previousSpaceEnd) ||
                                        (node.multiLine && hasLineBreak(element))) ? '' : '&#160;'));
                                    value = value.replace(/\s+$/, nextSibling && nextSibling.lineBreak ? '' : '&#160;');
                                }
                                else if (value.length > 0) {
                                    value = '&#160;' + value.substring(1);
                                }
                            }
                        }
                        if (value !== '') {
                            setElementCache(element, 'valueString', { name, value });
                        }
                    }
                }
            });
        }
        setOptionArray() {
            this.cache.list.filter(node => node.visible &&
                node.tagName === 'SELECT' &&
                !node.hasBit('excludeResource', NODE_RESOURCE.OPTION_ARRAY))
                .forEach(node => {
                const element = node.element;
                if (!getElementCache(element, 'optionArray') || this.settings.alwaysReevaluateResources) {
                    const stringArray = [];
                    let numberArray = [];
                    let i = -1;
                    while (++i < element.children.length) {
                        const item = element.children[i];
                        const value = item.text.trim();
                        if (value !== '') {
                            if (numberArray && stringArray.length === 0 && isNumber(value)) {
                                numberArray.push(value);
                            }
                            else {
                                if (numberArray && numberArray.length > 0) {
                                    i = -1;
                                    numberArray = null;
                                    continue;
                                }
                                if (value !== '') {
                                    stringArray.push(value);
                                }
                            }
                        }
                    }
                    setElementCache(element, 'optionArray', {
                        stringArray: stringArray.length > 0 ? stringArray : null,
                        numberArray: numberArray && numberArray.length > 0 ? numberArray : null
                    });
                }
            });
        }
    }
    Resource.STORED = {
        strings: new Map(),
        arrays: new Map(),
        fonts: new Map(),
        colors: new Map(),
        styles: new Map(),
        dimens: new Map(),
        drawables: new Map(),
        images: new Map()
    };

    class File {
        constructor() {
            this.appName = '';
            this.queue = [];
        }
        static downloadToDisk(data, filename, mime = '') {
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
            setTimeout(() => window.URL.revokeObjectURL(url), 1);
        }
        addFile(pathname, filename, content, uri) {
            if (content !== '' || uri !== '') {
                const index = this.queue.findIndex(item => item.pathname === pathname && item.filename === filename);
                if (index !== -1) {
                    this.queue[index].content = content || '';
                    this.queue[index].uri = uri || '';
                }
                else {
                    this.queue.push({
                        pathname,
                        filename,
                        content,
                        uri
                    });
                }
            }
        }
        reset() {
            this.queue.length = 0;
        }
        saveToDisk(files) {
            if (!location.protocol.startsWith('http')) {
                alert('SERVER (required): See README for instructions');
                return;
            }
            if (Array.isArray(files) && files.length > 0) {
                files.push(...this.queue);
                fetch(`/api/savetodisk` +
                    `?directory=${encodeURIComponent(trimString(this.settings.outputDirectory, '/'))}` +
                    `&appname=${encodeURIComponent(this.appName.trim())}` +
                    `&filetype=${this.settings.outputArchiveFileType.toLowerCase()}` +
                    `&processingtime=${this.settings.outputMaxProcessingTime.toString().trim()}`, {
                    method: 'POST',
                    body: JSON.stringify(files),
                    headers: new Headers({ 'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json' })
                })
                    .then((response) => response.json())
                    .then((result) => {
                    if (result) {
                        if (result.zipname) {
                            fetch(`/api/downloadtobrowser?filename=${encodeURIComponent(result.zipname)}`)
                                .then((response2) => response2.blob())
                                .then((result2) => File.downloadToDisk(result2, lastIndexOf(result.zipname)));
                        }
                        else if (result.system) {
                            alert(`${result.application}\n\n${result.system}`);
                        }
                    }
                })
                    .catch(err => alert(`ERROR: ${err}`));
            }
        }
    }

    class Extension {
        constructor(name, framework, tagNames, options) {
            this.name = name;
            this.framework = framework;
            this.options = {};
            this.tagNames = [];
            this.documentRoot = false;
            this.dependencies = [];
            this.subscribers = new Set();
            this.subscribersChild = new Set();
            if (Array.isArray(tagNames)) {
                this.tagNames = tagNames.map(value => value.trim().toUpperCase());
            }
            if (options) {
                Object.assign(this.options, options);
            }
        }
        setTarget(node, parent, element) {
            this._node = node;
            this._parent = parent;
            this._element = element || (node && node.element);
        }
        is(node) {
            return node.styleElement && (this.tagNames.length === 0 || this.tagNames.includes(node.tagName));
        }
        require(value, init = false) {
            this.dependencies.push({ name: value, init });
        }
        included(element) {
            if (!element) {
                element = this.element;
            }
            return element ? includes(element.dataset.ext, this.name) : false;
        }
        beforeInit(internal = false) {
            if (!internal && this.included()) {
                this.dependencies.filter(item => item.init).forEach(item => {
                    const ext = this.application.getExtension(item.name);
                    if (ext) {
                        ext.setTarget(this.node, this.parent, this.element);
                        ext.beforeInit(true);
                    }
                });
            }
        }
        init(element) {
            return false;
        }
        afterInit(init = false) {
            if (!init && this.included()) {
                this.dependencies.filter(item => item.init).forEach(item => {
                    const ext = this.application.getExtension(item.name);
                    if (ext) {
                        ext.setTarget(this.node, this.parent, this.element);
                        ext.afterInit(true);
                    }
                });
            }
        }
        condition() {
            const node = this.node;
            if (node && isStyleElement(node.element)) {
                const ext = node.dataset.ext;
                if (!ext) {
                    return this.tagNames.length > 0;
                }
                else {
                    return this.included();
                }
            }
            return false;
        }
        processNode(mapX, mapY) {
            return { output: '', complete: false };
        }
        processChild(mapX, mapY) {
            return { output: '', complete: false };
        }
        afterRender() {
            return;
        }
        beforeInsert() {
            return;
        }
        afterInsert() {
            return;
        }
        finalize() {
            return;
        }
        getData() {
            const result = {};
            if (this.node && this.node.styleElement) {
                const element = this.node.element;
                const prefix = convertCamelCase(this.name, '\\.');
                for (const attr in element.dataset) {
                    if (attr.length > prefix.length && attr.startsWith(prefix)) {
                        result[capitalize(attr.substring(prefix.length), false)] = element.dataset[attr];
                    }
                }
            }
            return result;
        }
        get node() {
            return this._node;
        }
        get parent() {
            return this._parent;
        }
        get element() {
            return this._element;
        }
    }

    class Accessibility extends Extension {
        afterInit() {
            Array.from(this.application.cache.elements).forEach(node => {
                if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.ACCESSIBILITY)) {
                    const element = node.element;
                    if (element instanceof HTMLInputElement) {
                        switch (element.type) {
                            case 'radio':
                            case 'checkbox':
                                [node.nextElementSibling, node.previousElementSibling].some((sibling) => {
                                    const label = getNodeFromElement(sibling);
                                    const labelParent = sibling && sibling.parentElement && sibling.parentElement.tagName === 'LABEL' ? getNodeFromElement(sibling.parentElement) : null;
                                    if (label && label.visible && label.pageflow) {
                                        if (hasValue(sibling.htmlFor) && sibling.htmlFor === element.id) {
                                            node.companion = label;
                                        }
                                        else if (label.textElement && labelParent) {
                                            node.companion = label;
                                            labelParent.renderAs = node;
                                        }
                                        if (node.companion) {
                                            if (this.options && !this.options.showLabel) {
                                                label.hide();
                                            }
                                            return true;
                                        }
                                    }
                                    return false;
                                });
                                break;
                        }
                    }
                }
            });
        }
    }

    class Button extends Extension {
        is(node) {
            return (super.is(node) && (node.tagName !== 'INPUT' ||
                ['button', 'file', 'image', 'reset', 'search', 'submit'].includes(node.element.type)));
        }
        condition() {
            return this.included();
        }
    }

    class Custom extends Extension {
        constructor(name, framework, tagNames, options) {
            super(name, framework, tagNames, options);
            this.require(EXT_NAME.EXTERNAL, true);
        }
        processNode() {
            const node = this.node;
            const parent = this.parent;
            const data = this.getData();
            let output = '';
            if (data.tag) {
                if (node.children.length > 0) {
                    output = this.application.viewController.renderGroup(node, parent, data.tag);
                }
                else {
                    output = this.application.viewController.renderNode(node, parent, data.tag);
                }
                node.nodeType = node.blockStatic ? NODE_STANDARD.BLOCK : NODE_STANDARD.INLINE;
            }
            if (data.tagChild) {
                node.each(item => {
                    if (item.styleElement) {
                        item.dataset.ext = this.name;
                        item.dataset.andromeCustomTag = data.tagChild;
                    }
                });
            }
            return { output, complete: false };
        }
    }

    class External extends Extension {
        beforeInit(init = false) {
            if (this.element && (init || this.included())) {
                if (!getElementCache(this.element, 'andromeExternalDisplay')) {
                    const display = [];
                    let current = this.element;
                    while (current) {
                        display.push(getStyle(current).display);
                        current.style.display = 'block';
                        current = current.parentElement;
                    }
                    setElementCache(this.element, 'andromeExternalDisplay', display);
                }
            }
        }
        init(element) {
            if (this.included(element)) {
                this.application.elements.add(element);
            }
            return false;
        }
        afterInit(init = false) {
            if (this.element && (init || this.included())) {
                const data = getElementCache(this.element, 'andromeExternalDisplay');
                if (data) {
                    const display = data;
                    let current = this.element;
                    let i = 0;
                    while (current) {
                        current.style.display = display[i];
                        current = current.parentElement;
                        i++;
                    }
                    deleteElementCache(this.element, 'andromeExternalDisplay');
                }
            }
        }
        is() {
            return false;
        }
        condition() {
            return false;
        }
    }

    class Grid extends Extension {
        condition() {
            const node = this.node;
            return (this.included() ||
                (node.children.length > 1 && ((node.display === 'table' && node.children.every(item => item.display === 'table-row' && item.children.every(child => child.display === 'table-cell'))) ||
                    (node.children.every(item => item.pageflow && !item.has('backgroundColor') && !item.has('backgroundImage') && (item.borderTopWidth + item.borderRightWidth + item.borderBottomWidth + item.borderLeftWidth === 0) && (!item.inlineElement || item.blockStatic)) && (node.css('listStyle') === 'none' ||
                        node.children.every(item => item.display === 'list-item' && item.css('listStyleType') === 'none') ||
                        (!hasValue(node.dataset.ext) && !node.flex.enabled && node.children.length > 1 && node.children.some(item => item.children.length > 1) && !node.children.some(item => item.display === 'list-item' || item.textElement)))))));
        }
        processNode(mapX) {
            const node = this.node;
            const parent = this.parent;
            const columnBalance = this.options.columnBalance === true || false;
            let output = '';
            let columns = [];
            const mainData = {
                padding: getBoxRect(),
                columnEnd: [],
                columnCount: 0
            };
            if (columnBalance) {
                const dimensions = [];
                node.each((item, index) => {
                    dimensions[index] = [];
                    for (let l = 0; l < item.children.length; l++) {
                        dimensions[index].push(item.children[l].bounds.width);
                    }
                    columns.push(item.children.slice());
                });
                const base = columns[dimensions.findIndex(item => {
                    const column = dimensions.reduce((a, b) => {
                        if (a.length === b.length) {
                            const sumA = a.reduce((c, d) => c + d, 0);
                            const sumB = b.reduce((c, d) => c + d, 0);
                            return sumA < sumB ? a : b;
                        }
                        else {
                            return a.length < b.length ? a : b;
                        }
                    });
                    return item === column;
                })];
                if (base && base.length > 1) {
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
                                    const result = columns[m].findIndex((item, index) => index >= l && Math.floor(item.bounds.width) === Math.floor(bounds.width) && index < columns[m].length - 1);
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
                                    columns[m][assigned[m] + (every ? 1 : 0)].data(EXT_NAME.GRID, 'siblings', [...removed]);
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
                                        columns[m][assigned[m] + (every ? 1 : 0)].data(EXT_NAME.GRID, 'siblings', [...removed]);
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
                function getRowIndex(current) {
                    return columns[0].findIndex(item => withinFraction(item.linear.top, current.linear.top) || (current.linear.top >= item.linear.top && current.linear.bottom <= item.linear.bottom));
                }
                const nextMapX = mapX[node.depth + 2];
                const nextCoordsX = nextMapX ? Object.keys(nextMapX) : [];
                const columnEnd = [];
                if (nextCoordsX.length > 1) {
                    const columnRight = [];
                    for (let l = 0; l < nextCoordsX.length; l++) {
                        const nextAxisX = sortAsc(nextMapX[parseInt(nextCoordsX[l])].filter(item => item.documentParent.documentParent.id === node.id), 'linear.top');
                        if (l === 0 && nextAxisX.length === 0) {
                            return { output: '', complete: false };
                        }
                        columnRight[l] = l === 0 ? 0 : columnRight[l - 1];
                        for (let m = 0; m < nextAxisX.length; m++) {
                            const nextX = nextAxisX[m];
                            let [left, right] = [nextX.linear.left, nextX.linear.right];
                            let index = l;
                            if (index > 0 && isStyleElement(nextX.element) && nextX.float === 'right') {
                                nextX.element.style.cssFloat = 'left';
                                const bounds = nextX.element.getBoundingClientRect();
                                if (bounds.left - nextX.marginLeft !== left) {
                                    [left, right] = [bounds.left - nextX.marginLeft, bounds.right + nextX.marginRight];
                                    for (let n = 1; n < columnRight.length; n++) {
                                        index = n;
                                        if (left > columnRight[n - 1]) {
                                            break;
                                        }
                                    }
                                }
                                nextX.element.style.cssFloat = 'right';
                            }
                            if (index === 0 || left >= columnRight[index - 1]) {
                                if (columns[index] == null) {
                                    columns[index] = [];
                                }
                                if (index === 0 || columns[0].length === nextAxisX.length) {
                                    columns[index][m] = nextX;
                                }
                                else {
                                    const row = getRowIndex(nextX);
                                    if (row !== -1) {
                                        columns[index][row] = nextX;
                                    }
                                }
                            }
                            else {
                                const current = columns.length - 1;
                                if (columns[current]) {
                                    const minLeft = columns[current].reduce((a, b) => Math.min(a, b.linear.left), Number.MAX_VALUE);
                                    const maxRight = columns[current].reduce((a, b) => Math.max(a, b.linear.right), 0);
                                    if (left > minLeft && right > maxRight) {
                                        const filtered = columns.filter(item => item);
                                        const rowIndex = getRowIndex(nextX);
                                        if (rowIndex !== -1 && filtered[filtered.length - 1][rowIndex] == null) {
                                            columns[current].length = 0;
                                        }
                                    }
                                }
                            }
                            columnRight[l] = Math.max(nextX.linear.right, columnRight[l]);
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
                        if (columns[l]) {
                            columnEnd.push(columnRight[l]);
                        }
                    }
                    columns = columns.filter(item => item && item.length > 0);
                    const columnLength = columns.reduce((a, b) => Math.max(a, b.length), 0);
                    for (let l = 0; l < columnLength; l++) {
                        for (let m = 0; m < columns.length; m++) {
                            if (columns[m][l] == null) {
                                columns[m][l] = { spacer: 1 };
                            }
                        }
                    }
                }
                if (columnEnd.length > 0) {
                    mainData.columnEnd = columnEnd;
                    mainData.columnEnd[mainData.columnEnd.length - 1] = node.box.right;
                }
            }
            if (columns.length > 1 && columns[0].length === node.children.length) {
                mainData.columnCount = columnBalance ? columns[0].length : columns.length;
                output = this.application.writeGridLayout(node, parent, mainData.columnCount);
                node.children.slice().forEach(item => {
                    node.remove(item);
                    item.hide();
                });
                for (let l = 0, count = 0; l < columns.length; l++) {
                    let spacer = 0;
                    for (let m = 0, start = 0; m < columns[l].length; m++) {
                        const item = columns[l][m];
                        if (!item.spacer) {
                            item.parent = node;
                            const data = {
                                inherit: true,
                                rowSpan: 0,
                                columnSpan: 0,
                                index: -1,
                                cellFirst: false,
                                cellLast: false,
                                rowEnd: false,
                                rowStart: false
                            };
                            if (columnBalance) {
                                data.rowStart = m === 0;
                                data.rowEnd = m === columns[l].length - 1;
                                data.cellFirst = l === 0 && m === 0;
                                data.cellLast = l === columns.length - 1 && data.rowEnd;
                                data.index = m;
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
                                data.rowSpan = rowSpan;
                                data.columnSpan = columnSpan;
                                data.rowStart = start++ === 0;
                                data.rowEnd = columnSpan + l === columns.length;
                                data.cellFirst = count++ === 0;
                                data.cellLast = data.rowEnd && m === columns[l].length - 1;
                                data.index = l;
                                spacer = 0;
                            }
                            item.data(EXT_NAME.GRID, 'cellData', data);
                        }
                        else if (item.spacer === 1) {
                            spacer++;
                        }
                    }
                }
                sortAsc(node.children, 'documentParent.siblingIndex', 'siblingIndex');
                if (node.display === 'table') {
                    if (node.css('borderCollapse') === 'collapse') {
                        node.modifyBox(BOX_STANDARD.PADDING_TOP, null);
                        node.modifyBox(BOX_STANDARD.PADDING_RIGHT, null);
                        node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, null);
                        node.modifyBox(BOX_STANDARD.PADDING_LEFT, null);
                    }
                }
                node.data(EXT_NAME.GRID, 'mainData', mainData);
                node.render(parent);
            }
            return { output, complete: true };
        }
        processChild() {
            const node = this.node;
            const parent = this.parent;
            const mainData = parent.data(EXT_NAME.GRID, 'mainData');
            const cellData = node.data(EXT_NAME.GRID, 'cellData');
            let output = '';
            if (mainData && cellData) {
                let siblings;
                if (this.options.columnBalance) {
                    siblings = node.data(EXT_NAME.GRID, 'siblings');
                }
                else {
                    const columnEnd = mainData.columnEnd[Math.min(cellData.index + (cellData.columnSpan - 1), mainData.columnEnd.length - 1)];
                    siblings = Array.from(node.documentParent.element.children).map(element => {
                        const item = getNodeFromElement(element);
                        return (item &&
                            item.visible &&
                            !item.excluded &&
                            !item.rendered &&
                            item.linear.left >= node.linear.right &&
                            item.linear.right <= columnEnd ? item : null);
                    })
                        .filter(item => item);
                }
                if (siblings && siblings.length > 0) {
                    siblings.unshift(node);
                    const [linearX, linearY] = [NodeList.linearX(siblings), NodeList.linearY(siblings)];
                    const group = this.application.viewController.createGroup(parent, node, siblings);
                    if (linearX || linearY) {
                        output = this.application.writeLinearLayout(group, parent, linearX);
                        group.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                    }
                    else {
                        output = this.application.writeConstraintLayout(group, parent);
                    }
                    return { output, parent: group, complete: true };
                }
            }
            return { output, complete: true };
        }
    }

    class List extends Extension {
        condition() {
            const children = this.node.children;
            return (super.condition() &&
                children.length > 0 && (children.every(item => item.blockStatic) ||
                children.every(item => item.inlineElement) ||
                (children.every(item => item.floating) && NodeList.floated(children).size === 1) ||
                children.every((item, index) => !item.floating && (index === 0 || index === children.length - 1 || item.blockStatic || (item.inlineElement && children[index - 1].blockStatic && children[index + 1].blockStatic)))) && (children.some((item) => item.display === 'list-item' && (item.css('listStyleType') !== 'none' || this.hasSingleImage(item))) ||
                children.every((item) => item.tagName !== 'LI' && item.styleMap.listStyleType === 'none' && this.hasSingleImage(item))));
        }
        processNode() {
            const node = this.node;
            const parent = this.parent;
            let output = '';
            if (NodeList.linearY(node.children)) {
                output = this.application.writeGridLayout(node, parent, node.children.some(item => item.css('listStylePosition') === 'inside') ? 3 : 2);
            }
            else {
                output = this.application.writeLinearLayout(node, parent, true);
            }
            let i = 0;
            node.each((item) => {
                const mainData = {
                    ordinal: '',
                    imageSrc: '',
                    imagePosition: ''
                };
                if (item.display === 'list-item' || item.has('listStyleType') || this.hasSingleImage(item)) {
                    let src = item.css('listStyleImage');
                    if (src && src !== 'none') {
                        mainData.imageSrc = src;
                    }
                    else {
                        switch (item.css('listStyleType')) {
                            case 'disc':
                                mainData.ordinal = '●';
                                break;
                            case 'square':
                                mainData.ordinal = '■';
                                break;
                            case 'decimal':
                                mainData.ordinal = `${(i + 1).toString()}.`;
                                break;
                            case 'decimal-leading-zero':
                                mainData.ordinal = `${(i < 9 ? '0' : '') + (i + 1).toString()}.`;
                                break;
                            case 'lower-alpha':
                            case 'lower-latin':
                                mainData.ordinal = `${convertAlpha(i).toLowerCase()}.`;
                                break;
                            case 'upper-alpha':
                            case 'upper-latin':
                                mainData.ordinal = `${convertAlpha(i)}.`;
                                break;
                            case 'lower-roman':
                                mainData.ordinal = `${convertRoman(i + 1).toLowerCase()}.`;
                                break;
                            case 'upper-roman':
                                mainData.ordinal = `${convertRoman(i + 1)}.`;
                                break;
                            case 'none':
                                src = '';
                                let position = '';
                                const repeat$$1 = item.css('backgroundRepeat');
                                if (repeat$$1 === 'no-repeat') {
                                    src = item.css('backgroundImage');
                                    position = item.css('backgroundPosition');
                                }
                                if (src && src !== 'none') {
                                    mainData.imageSrc = src;
                                    mainData.imagePosition = position;
                                    item.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
                                }
                                break;
                            default:
                                mainData.ordinal = '○';
                                break;
                        }
                    }
                    i++;
                }
                item.data(EXT_NAME.LIST, 'mainData', mainData);
            });
            return { output, complete: true };
        }
        afterRender() {
            for (const node of this.subscribers) {
                node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
                node.modifyBox(BOX_STANDARD.PADDING_LEFT, null);
            }
        }
        hasSingleImage(node) {
            return node.css('backgroundImage') !== 'none' && node.css('backgroundRepeat') === 'no-repeat';
        }
    }

    class Nav extends Extension {
        constructor(name, framework, tagNames, options) {
            super(name, framework, tagNames, options);
            this.require(EXT_NAME.EXTERNAL, true);
        }
        init(element) {
            if (this.included(element)) {
                let valid = false;
                if (element.children.length > 0) {
                    const tagName = element.children[0].tagName;
                    valid = Array.from(element.children).every(item => item.tagName === tagName);
                    let current = element.parentElement;
                    while (current) {
                        if (current.tagName === 'NAV' && this.application.elements.has(current)) {
                            valid = false;
                            break;
                        }
                        current = current.parentElement;
                    }
                }
                if (valid) {
                    Array.from(element.querySelectorAll('NAV')).forEach((item) => {
                        if (getStyle(element).display === 'none') {
                            setElementCache(item, 'andromeExternalDisplay', 'none');
                            item.style.display = 'block';
                        }
                    });
                    this.application.elements.add(element);
                }
            }
            return false;
        }
        afterRender() {
            const node = this.node;
            if (this.included(node.element)) {
                Array.from(node.element.querySelectorAll('NAV')).forEach((item) => {
                    const display = getElementCache(item, 'andromeExternalDisplay');
                    if (display) {
                        item.style.display = display;
                        deleteElementCache(item, 'andromeExternalDisplay');
                    }
                });
            }
        }
    }

    class Origin extends Extension {
        afterInit() {
            function modifyMarginLeft(node, offset, parent = false) {
                node.bounds.left -= offset;
                node.bounds.width += Math.max(node.marginLeft < 0 ? node.marginLeft + offset : offset, 0);
                node.css('marginLeft', formatPX(node.marginLeft + (offset * (parent ? -1 : 1))));
                node.setBounds(true);
            }
            Array.from(this.application.cache.elements).forEach(node => {
                const outside = node.children.some(current => {
                    if (current.pageflow) {
                        return (current.float !== 'right' &&
                            current.marginLeft < 0 &&
                            node.marginLeft >= Math.abs(current.marginLeft) &&
                            (Math.abs(current.marginLeft) >= current.bounds.width || node.documentRoot));
                    }
                    else {
                        const left = current.toInt('left');
                        const right = current.toInt('right');
                        return (left < 0 && node.marginLeft >= Math.abs(left)) || (right < 0 && Math.abs(right) >= current.bounds.width);
                    }
                });
                if (outside) {
                    const marginLeft = [];
                    const marginRight = [];
                    node.each((current) => {
                        let leftType = 0;
                        if (current.pageflow) {
                            const left = current.marginLeft;
                            if (left < 0 && node.marginLeft >= Math.abs(left)) {
                                leftType = 1;
                            }
                        }
                        else {
                            const left = convertInt(current.left) + current.marginLeft;
                            const right = convertInt(current.right);
                            if (left < 0) {
                                if (node.marginLeft >= Math.abs(left)) {
                                    leftType = 2;
                                }
                            }
                            else if (right < 0) {
                                if (Math.abs(right) >= current.bounds.width) {
                                    marginRight.push(current);
                                }
                            }
                        }
                        marginLeft.push(leftType);
                    });
                    if (marginRight.length > 0) {
                        const [sectionLeft, sectionRight] = new androme.lib.base.NodeList(node.children).partition((item) => !marginRight.includes(item));
                        if (sectionLeft.length > 0 && sectionRight.length > 0) {
                            if (node.style.marginLeft && node.autoMarginLeft) {
                                node.css('marginLeft', node.style.marginLeft);
                            }
                            node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, null);
                            const widthLeft = node.has('width', CSS_STANDARD.UNIT) ? node.toInt('width') : Math.max.apply(null, sectionRight.list.map(item => item.bounds.width));
                            const widthRight = Math.max.apply(null, sectionRight.list.map(item => Math.abs(item.toInt('right'))));
                            sectionLeft.each(item => {
                                if (item.pageflow && !item.hasWidth) {
                                    item.css(item.textElement ? 'maxWidth' : 'width', formatPX(widthLeft));
                                }
                            });
                            node.css('width', formatPX(widthLeft + widthRight));
                        }
                    }
                    const marginLeftType = Math.max.apply(null, marginLeft);
                    if (marginLeftType > 0) {
                        node.each((current, index) => {
                            if (marginLeft[index] === 2) {
                                const left = current.toInt('left') + node.marginLeft;
                                current.css('left', formatPX(Math.max(left, 0)));
                                if (left < 0) {
                                    current.css('marginLeft', formatPX(current.marginLeft + left));
                                    modifyMarginLeft(current, left);
                                }
                            }
                            else if (marginLeftType === 2 || (current.pageflow && !current.plainText && marginLeft.includes(1))) {
                                modifyMarginLeft(current, node.marginLeft);
                            }
                        });
                        if (node.has('width', CSS_STANDARD.UNIT)) {
                            node.css('width', formatPX(node.toInt('width') + node.marginLeft));
                        }
                        modifyMarginLeft(node, node.marginLeft, true);
                    }
                }
            });
        }
    }

    class Table extends Extension {
        processNode() {
            function setAutoWidth(td) {
                td.data(EXT_NAME.TABLE, 'percent', `${Math.round((td.bounds.width / node.bounds.width) * 100)}%`);
                td.data(EXT_NAME.TABLE, 'expand', true);
            }
            function setBoundsWidth(td) {
                td.css('width', formatPX(td.bounds.width));
            }
            const node = this.node;
            const parent = this.parent;
            const table = [];
            const thead = node.children.filter(item => item.tagName === 'THEAD');
            const tbody = node.children.filter(item => item.tagName === 'TBODY');
            const tfoot = node.children.filter(item => item.tagName === 'TFOOT');
            const colgroup = Array.from(node.element.children).find(element => element.tagName === 'COLGROUP');
            const tableWidth = node.css('width');
            if (thead.length > 0) {
                thead[0].cascade()
                    .filter(item => item.tagName === 'TH' || item.tagName === 'TD')
                    .forEach(item => item.inherit(thead[0], 'styleMap'));
                table.push(...thead[0].children);
                thead.forEach(item => item.hide());
            }
            if (tbody.length > 0) {
                tbody.forEach(item => {
                    table.push(...item.children);
                    item.hide();
                });
            }
            if (tfoot.length > 0) {
                tfoot[0].cascade()
                    .filter(item => item.tagName === 'TH' || item.tagName === 'TD')
                    .forEach(item => item.inherit(tfoot[0], 'styleMap'));
                table.push(...tfoot[0].children);
                tfoot.forEach(item => item.hide());
            }
            const tableFixed = node.css('tableLayout') === 'fixed';
            const borderCollapse = node.css('borderCollapse') === 'collapse';
            const [horizontal, vertical] = borderCollapse ? [0, 0] : node.css('borderSpacing').split(' ').map(value => parseInt(value));
            if (horizontal > 0) {
                node.modifyBox(BOX_STANDARD.PADDING_LEFT, horizontal);
                node.modifyBox(BOX_STANDARD.PADDING_RIGHT, horizontal);
            }
            else {
                node.modifyBox(BOX_STANDARD.PADDING_LEFT, null);
                node.modifyBox(BOX_STANDARD.PADDING_RIGHT, null);
            }
            if (vertical > 0) {
                node.modifyBox(BOX_STANDARD.PADDING_TOP, vertical);
                node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, vertical);
            }
            else {
                node.modifyBox(BOX_STANDARD.PADDING_TOP, null);
                node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, null);
            }
            const spacingWidth = formatPX(horizontal > 1 ? Math.round(horizontal / 2) : horizontal);
            const spacingHeight = formatPX(vertical > 1 ? Math.round(vertical / 2) : vertical);
            const mapWidth = [];
            const mapBounds = [];
            let columnIndex = new Array(table.length).fill(0);
            let multiLine = false;
            for (let i = 0; i < table.length; i++) {
                const tr = table[i];
                for (let j = 0; j < tr.children.length; j++) {
                    const td = tr.children[j];
                    const element = tr.children[j].element;
                    for (let k = 0; k < element.rowSpan - 1; k++) {
                        const l = (i + 1) + k;
                        if (columnIndex[l] != null) {
                            columnIndex[l] += element.colSpan;
                        }
                    }
                    if (!td.has('background') && !td.has('backgroundColor')) {
                        const item = td.element;
                        if (colgroup) {
                            const style = getStyle(colgroup.children[columnIndex[i]]);
                            if (style.background) {
                                item.style.background = style.background;
                            }
                            else if (style.backgroundColor) {
                                item.style.backgroundColor = style.backgroundColor;
                            }
                        }
                        else {
                            let value = cssInherit(item, 'background', ['rgba(0, 0, 0, 0)', 'transparent'], ['TABLE']);
                            if (value !== '') {
                                item.style.background = value;
                            }
                            else {
                                value = cssInherit(item, 'backgroundColor', ['rgba(0, 0, 0, 0)', 'transparent'], ['TABLE']);
                                if (value !== '') {
                                    item.style.backgroundColor = value;
                                }
                            }
                        }
                    }
                    const columnWidth = td.styleMap.width;
                    const m = columnIndex[i];
                    if (i === 0 || mapWidth[m] == null || !tableFixed) {
                        if (!columnWidth || columnWidth === 'auto') {
                            if (mapWidth[m] == null) {
                                mapWidth[m] = columnWidth || '0px';
                                mapBounds[m] = 0;
                            }
                        }
                        else {
                            const percentColumnWidth = isPercent(columnWidth);
                            const unitMapWidth = isUnit(mapWidth[m]);
                            if (mapWidth[m] == null ||
                                td.bounds.width < mapBounds[m] ||
                                (td.bounds.width === mapBounds[m] && ((mapWidth[m] === 'auto' && (percentColumnWidth || unitMapWidth)) ||
                                    (percentColumnWidth && unitMapWidth) ||
                                    (percentColumnWidth && isPercent(mapWidth[m]) && convertFloat(columnWidth) > convertFloat(mapWidth[m])) ||
                                    (unitMapWidth && isUnit(columnWidth) && convertInt(columnWidth) > convertInt(mapWidth[m]))))) {
                                mapWidth[m] = columnWidth;
                            }
                            if (element.colSpan === 1) {
                                mapBounds[m] = td.bounds.width;
                            }
                        }
                    }
                    td.css({
                        marginTop: i === 0 ? '0px' : spacingHeight,
                        marginRight: j < tr.children.length - 1 ? spacingWidth : '0px',
                        marginBottom: i + element.rowSpan - 1 >= table.length - 1 ? '0px' : spacingHeight,
                        marginLeft: columnIndex[i] === 0 ? '0px' : spacingWidth
                    });
                    if (!multiLine) {
                        multiLine = td.multiLine;
                    }
                    columnIndex[i] += element.colSpan;
                }
            }
            const columnCount = Math.max.apply(null, columnIndex);
            let rowCount = table.length;
            if (mapWidth.every(value => isPercent(value)) && mapWidth.reduce((a, b) => a + parseFloat(b), 0) > 1) {
                let percentTotal = 100;
                mapWidth.forEach((value, index) => {
                    const percent = parseFloat(value);
                    if (percentTotal <= 0) {
                        mapWidth[index] = '0px';
                    }
                    else if (percentTotal - percent < 0) {
                        mapWidth[index] = `${percentTotal}%`;
                    }
                    percentTotal -= percent;
                });
            }
            else if (mapWidth.every(value => isUnit(value))) {
                const pxWidth = mapWidth.reduce((a, b) => a + parseInt(b), 0);
                if ((isPercent(tableWidth) && tableWidth !== '100%') || pxWidth < node.viewWidth) {
                    mapWidth.filter(value => value !== '0px').forEach((value, index) => mapWidth[index] = `${(parseInt(value) / pxWidth) * 100}%`);
                }
                else if (tableWidth === 'auto') {
                    mapWidth.filter(value => value !== '0px').forEach((value, index) => mapWidth[index] = mapBounds[index] == null ? 'undefined' : `${(mapBounds[index] / node.bounds.width) * 100}%`);
                }
                else if (pxWidth > node.viewWidth) {
                    node.css('width', 'auto');
                    if (!tableFixed) {
                        node.cascade().forEach(item => item.css('width', 'auto'));
                    }
                }
            }
            const mapPercent = mapWidth.reduce((a, b) => a + (isPercent(b) ? parseFloat(b) : 0), 0);
            const typeWidth = (() => {
                if (mapWidth.some(value => isPercent(value)) || mapWidth.every(value => isUnit(value) && value !== '0px')) {
                    return 3;
                }
                if (mapWidth.every(value => value === mapWidth[0])) {
                    if (multiLine) {
                        return node.children.some(td => td.has('height')) ? 2 : 3;
                    }
                    if (mapWidth[0] === 'auto') {
                        return node.has('width') ? 3 : 0;
                    }
                    if (node.hasWidth) {
                        return 2;
                    }
                }
                if (mapWidth.every(value => value === 'auto' || (isUnit(value) && value !== '0px'))) {
                    return 1;
                }
                return 0;
            })();
            if (multiLine || (typeWidth === 2 && !node.hasWidth)) {
                node.data(EXT_NAME.TABLE, 'expand', true);
            }
            const caption = node.children.find(item => item.tagName === 'CAPTION');
            node.children.length = 0;
            if (caption) {
                if (!caption.has('textAlign', CSS_STANDARD.LEFT)) {
                    caption.css('textAlign', 'center');
                }
                rowCount++;
                caption.data(EXT_NAME.TABLE, 'colSpan', columnCount);
                caption.parent = node;
            }
            columnIndex = new Array(table.length).fill(0);
            let borderInside = 0;
            for (let i = 0; i < table.length; i++) {
                const tr = table[i];
                const children = tr.children.slice();
                for (let j = 0; j < children.length; j++) {
                    const td = children[j];
                    const element = td.element;
                    for (let k = 0; k < element.rowSpan - 1; k++) {
                        const l = (i + 1) + k;
                        if (columnIndex[l] != null) {
                            columnIndex[l] += element.colSpan;
                        }
                    }
                    if (element.rowSpan > 1) {
                        td.data(EXT_NAME.TABLE, 'rowSpan', element.rowSpan);
                    }
                    if (element.colSpan > 1) {
                        td.data(EXT_NAME.TABLE, 'colSpan', element.colSpan);
                    }
                    if (!td.has('verticalAlign')) {
                        td.css('verticalAlign', 'middle');
                    }
                    if (i === 0) {
                        if (td.has('borderTopStyle') && convertInt(td.css('borderTopWidth')) > 0) {
                            borderInside |= 2;
                        }
                    }
                    if (j === 0) {
                        if (td.has('borderLeftStyle') && convertInt(td.css('borderLeftWidth')) > 0) {
                            borderInside |= 4;
                        }
                    }
                    if (j === children.length - 1) {
                        if (td.has('borderRightStyle') && convertInt(td.css('borderRightWidth')) > 0) {
                            borderInside |= 8;
                        }
                    }
                    if (i === table.length - 1) {
                        if (td.has('borderBottomStyle') && convertInt(td.css('borderBottomWidth')) > 0) {
                            borderInside |= 16;
                        }
                    }
                    const columnWidth = mapWidth[columnIndex[i]];
                    if (columnWidth !== 'undefined') {
                        switch (typeWidth) {
                            case 3:
                                if (columnWidth === 'auto') {
                                    if (mapPercent >= 1) {
                                        setBoundsWidth(td);
                                        td.data(EXT_NAME.TABLE, 'exceed', true);
                                        td.data(EXT_NAME.TABLE, 'downsized', true);
                                    }
                                    else {
                                        setAutoWidth(td);
                                    }
                                }
                                else if (isPercent(columnWidth)) {
                                    td.data(EXT_NAME.TABLE, 'percent', columnWidth);
                                    td.data(EXT_NAME.TABLE, 'expand', true);
                                }
                                else if (isUnit(columnWidth) && parseInt(columnWidth) > 0) {
                                    if (td.bounds.width >= parseInt(columnWidth)) {
                                        setBoundsWidth(td);
                                        td.data(EXT_NAME.TABLE, 'expand', false);
                                        td.data(EXT_NAME.TABLE, 'downsized', false);
                                    }
                                    else {
                                        if (tableFixed) {
                                            setAutoWidth(td);
                                            td.data(EXT_NAME.TABLE, 'downsized', true);
                                        }
                                        else {
                                            setBoundsWidth(td);
                                            td.data(EXT_NAME.TABLE, 'expand', false);
                                        }
                                    }
                                }
                                else {
                                    if (!td.has('width') || td.has('width', CSS_STANDARD.PERCENT)) {
                                        setBoundsWidth(td);
                                    }
                                    td.data(EXT_NAME.TABLE, 'expand', false);
                                }
                                break;
                            case 2:
                                td.css('width', '0px');
                                break;
                            case 1:
                                if (columnWidth === 'auto') {
                                    td.css('width', '0px');
                                }
                                else {
                                    if (tableFixed) {
                                        td.data(EXT_NAME.TABLE, 'downsized', true);
                                    }
                                    else {
                                        setBoundsWidth(td);
                                    }
                                    td.data(EXT_NAME.TABLE, 'expand', false);
                                }
                                break;
                        }
                    }
                    columnIndex[i] += element.colSpan;
                    td.parent = node;
                }
                if (columnIndex[i] < columnCount) {
                    const td = children[children.length - 1];
                    td.data(EXT_NAME.TABLE, 'spaceSpan', columnCount - columnIndex[i]);
                }
                tr.hide();
            }
            if (borderCollapse && borderInside !== 0) {
                node.css({
                    borderTopWidth: hasBit(borderInside, 2) ? '0px' : '',
                    borderRightWidth: hasBit(borderInside, 8) ? '0px' : '',
                    borderBottomWidth: hasBit(borderInside, 16) ? '0px' : '',
                    borderLeftWidth: hasBit(borderInside, 4) ? '0px' : ''
                });
            }
            const output = this.application.writeGridLayout(node, parent, columnCount, rowCount);
            return { output, complete: true };
        }
    }

    let main;
    let framework;
    exports.settings = {};
    exports.system = {};
    function setFramework(module, cached = false) {
        if (framework !== module) {
            const appBase = cached ? module.cached() : module.create();
            if (main || Object.keys(exports.settings).length === 0) {
                exports.settings = appBase.settings;
            }
            else {
                exports.settings = Object.assign(appBase.settings, exports.settings);
            }
            main = appBase.application;
            main.settings = exports.settings;
            if (Array.isArray(exports.settings.builtInExtensions)) {
                const register = new Set();
                const extensions = main.builtInExtensions;
                for (let namespace of exports.settings.builtInExtensions) {
                    namespace = namespace.trim();
                    if (extensions[namespace]) {
                        register.add(extensions[namespace]);
                    }
                    else {
                        for (const ext in extensions) {
                            if (ext.startsWith(`${namespace}.`)) {
                                register.add(extensions[ext]);
                            }
                        }
                    }
                }
                for (const ext of register) {
                    main.registerExtension(ext);
                }
            }
            framework = module;
            exports.system = module.system;
        }
        reset();
    }
    function parseDocument(...elements) {
        if (main && !main.closed) {
            return main.parseDocument(...elements);
        }
        return { then: (...args) => { } };
    }
    function registerExtension(ext) {
        if (main && ext instanceof Extension && isString(ext.name) && Array.isArray(ext.tagNames)) {
            main.registerExtension(ext);
        }
    }
    function configureExtension(name, options) {
        if (main) {
            const ext = main.getExtension(name);
            if (ext && typeof options === 'object') {
                Object.assign(ext.options, options);
            }
        }
    }
    function getExtension(name) {
        return main && main.getExtension(name);
    }
    function ext(name, options) {
        if (typeof name === 'object') {
            registerExtension(name);
        }
        else if (isString(name)) {
            if (typeof options === 'object') {
                configureExtension(name, options);
            }
            else {
                return getExtension(name);
            }
        }
    }
    function ready() {
        return main && !main.loading && !main.closed;
    }
    function close() {
        if (main && !main.loading && main.size > 0) {
            main.finalize();
        }
    }
    function reset() {
        if (main) {
            main.reset();
        }
    }
    function saveAllToDisk() {
        if (main && !main.loading && main.size > 0) {
            if (!main.closed) {
                main.finalize();
            }
            main.saveAllToDisk();
        }
    }
    function toString() {
        return main ? main.toString() : '';
    }
    const lib = {
        base: {
            Node,
            NodeList,
            NodeGroup,
            Application,
            Controller,
            Resource,
            File,
            Extension,
            extensions: {
                Accessibility,
                Button,
                Custom,
                External,
                Grid,
                List,
                Nav,
                Origin,
                Table
            }
        },
        enumeration,
        constant,
        util,
        dom,
        xml,
        color
    };

    exports.setFramework = setFramework;
    exports.parseDocument = parseDocument;
    exports.registerExtension = registerExtension;
    exports.configureExtension = configureExtension;
    exports.getExtension = getExtension;
    exports.ext = ext;
    exports.ready = ready;
    exports.close = close;
    exports.reset = reset;
    exports.saveAllToDisk = saveAllToDisk;
    exports.toString = toString;
    exports.lib = lib;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
