/* androme 1.9.16
   https://github.com/anpham6/androme */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.androme = {})));
}(this, (function (exports) { 'use strict';

    function sort(list, asc = 0, ...attrs) {
        return list.sort((a, b) => {
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
    function partition(list, predicate) {
        const valid = [];
        const invalid = [];
        list.forEach((node) => {
            if (predicate(node)) {
                valid.push(node);
            }
            else {
                invalid.push(node);
            }
        });
        return [valid, invalid];
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
        return (value ? value.replace(/[^\w]/g, '_').trim() : '');
    }
    function capitalize(value, upper = true) {
        return (value ? value.charAt(0)[(upper ? 'toUpperCase' : 'toLowerCase')]() + value.substring(1)[(upper ? 'toLowerCase' : 'toString')]() : '');
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
                        value *= convertInt(fontSize) || 16;
                        break;
                }
            }
            if (!isNaN(value)) {
                return `${value}px`;
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
        return `${(!isNaN(value) ? Math.ceil(value) : 0)}px`;
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
            result = (numerals[parseInt(digits.pop() || '') + (i * 10)] || '') + result;
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
        return ((value & type) === type);
    }
    function isNumber(value) {
        return /^-?[0-9]+(\.[0-9]+)?$/.test(value.toString().trim());
    }
    function isString(value) {
        return (typeof value === 'string' && value !== '');
    }
    function isUnit(value) {
        return /^-?[0-9\.]+(px|pt|em)$/.test((value || '').trim());
    }
    function isPercent(value) {
        return /^[0-9]+(\.[0-9]+)?%$/.test(value);
    }
    function includes(source, value, delimiter = ',') {
        return (source != null ? source.split(delimiter).map(segment => segment.trim()).includes(value) : false);
    }
    function optional(obj, value, type) {
        let valid = false;
        let result = null;
        if (obj != null) {
            const attrs = value.split('.');
            result = obj;
            let i = 0;
            do {
                result = (result[attrs[i]] != null ? result[attrs[i]] : null);
            } while (result != null && ++i < attrs.length && typeof result !== 'string' && typeof result !== 'number' && typeof result !== 'boolean');
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
    function trimString(value, char) {
        return trimStart(trimEnd(value, char), char);
    }
    function trimStart(value, char) {
        return value.replace(new RegExp(`^${char}+`, 'g'), '');
    }
    function trimEnd(value, char) {
        return value.replace(new RegExp(`${char}+$`, 'g'), '');
    }
    function repeat(n, value = '\t') {
        return value.repeat(n);
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
            const result = compare(obj1, obj2, attr);
            if (!result || result[0] !== result[1]) {
                return false;
            }
        }
        return true;
    }
    function search(obj, value) {
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
    function hasValue(value) {
        return (typeof value !== 'undefined' && value !== null && value.toString().trim() !== '');
    }
    function withinRange(a, b, n = 0) {
        return (b >= (a - n) && b <= (a + n));
    }
    function withinFraction(lower, upper) {
        return (lower === upper || Math.floor(lower) === Math.floor(upper) || Math.ceil(lower) === Math.ceil(upper) || Math.ceil(lower) === Math.floor(upper) || Math.floor(lower) === Math.ceil(upper));
    }
    function sortAsc(list, ...attrs) {
        return sort(list, 0, ...attrs);
    }
    function sortDesc(list, ...attrs) {
        return sort(list, 1, ...attrs);
    }

    var NODE_STANDARD;
    (function (NODE_STANDARD) {
        NODE_STANDARD[NODE_STANDARD["NONE"] = 0] = "NONE";
        NODE_STANDARD[NODE_STANDARD["CHECKBOX"] = 1] = "CHECKBOX";
        NODE_STANDARD[NODE_STANDARD["RADIO"] = 2] = "RADIO";
        NODE_STANDARD[NODE_STANDARD["EDIT"] = 3] = "EDIT";
        NODE_STANDARD[NODE_STANDARD["SELECT"] = 4] = "SELECT";
        NODE_STANDARD[NODE_STANDARD["RANGE"] = 5] = "RANGE";
        NODE_STANDARD[NODE_STANDARD["TEXT"] = 6] = "TEXT";
        NODE_STANDARD[NODE_STANDARD["IMAGE"] = 7] = "IMAGE";
        NODE_STANDARD[NODE_STANDARD["BUTTON"] = 8] = "BUTTON";
        NODE_STANDARD[NODE_STANDARD["INLINE"] = 9] = "INLINE";
        NODE_STANDARD[NODE_STANDARD["LINE"] = 10] = "LINE";
        NODE_STANDARD[NODE_STANDARD["SPACE"] = 11] = "SPACE";
        NODE_STANDARD[NODE_STANDARD["BLOCK"] = 12] = "BLOCK";
        NODE_STANDARD[NODE_STANDARD["WEB_VIEW"] = 13] = "WEB_VIEW";
        NODE_STANDARD[NODE_STANDARD["FRAME"] = 14] = "FRAME";
        NODE_STANDARD[NODE_STANDARD["LINEAR"] = 15] = "LINEAR";
        NODE_STANDARD[NODE_STANDARD["RADIO_GROUP"] = 16] = "RADIO_GROUP";
        NODE_STANDARD[NODE_STANDARD["GRID"] = 17] = "GRID";
        NODE_STANDARD[NODE_STANDARD["RELATIVE"] = 18] = "RELATIVE";
        NODE_STANDARD[NODE_STANDARD["CONSTRAINT"] = 19] = "CONSTRAINT";
        NODE_STANDARD[NODE_STANDARD["SCROLL_HORIZONTAL"] = 20] = "SCROLL_HORIZONTAL";
        NODE_STANDARD[NODE_STANDARD["SCROLL_VERTICAL"] = 21] = "SCROLL_VERTICAL";
    })(NODE_STANDARD || (NODE_STANDARD = {}));
    var NODE_ALIGNMENT;
    (function (NODE_ALIGNMENT) {
        NODE_ALIGNMENT[NODE_ALIGNMENT["NONE"] = 0] = "NONE";
        NODE_ALIGNMENT[NODE_ALIGNMENT["SINGLE"] = 2] = "SINGLE";
        NODE_ALIGNMENT[NODE_ALIGNMENT["HORIZONTAL"] = 4] = "HORIZONTAL";
        NODE_ALIGNMENT[NODE_ALIGNMENT["VERTICAL"] = 8] = "VERTICAL";
        NODE_ALIGNMENT[NODE_ALIGNMENT["ABSOLUTE"] = 16] = "ABSOLUTE";
        NODE_ALIGNMENT[NODE_ALIGNMENT["FLOAT"] = 32] = "FLOAT";
        NODE_ALIGNMENT[NODE_ALIGNMENT["INLINE_WRAP"] = 64] = "INLINE_WRAP";
        NODE_ALIGNMENT[NODE_ALIGNMENT["SEGMENTED"] = 128] = "SEGMENTED";
        NODE_ALIGNMENT[NODE_ALIGNMENT["PERCENT"] = 256] = "PERCENT";
        NODE_ALIGNMENT[NODE_ALIGNMENT["TOP"] = 512] = "TOP";
        NODE_ALIGNMENT[NODE_ALIGNMENT["RIGHT"] = 1024] = "RIGHT";
        NODE_ALIGNMENT[NODE_ALIGNMENT["BOTTOM"] = 2048] = "BOTTOM";
        NODE_ALIGNMENT[NODE_ALIGNMENT["LEFT"] = 4096] = "LEFT";
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
        CSS_STANDARD[CSS_STANDARD["UNIT"] = 1] = "UNIT";
        CSS_STANDARD[CSS_STANDARD["AUTO"] = 2] = "AUTO";
        CSS_STANDARD[CSS_STANDARD["LEFT"] = 3] = "LEFT";
        CSS_STANDARD[CSS_STANDARD["BASELINE"] = 4] = "BASELINE";
        CSS_STANDARD[CSS_STANDARD["PERCENT"] = 5] = "PERCENT";
    })(CSS_STANDARD || (CSS_STANDARD = {}));
    const MAP_ELEMENT = {
        INPUT: NODE_STANDARD.NONE,
        PLAINTEXT: NODE_STANDARD.TEXT,
        HR: NODE_STANDARD.LINE,
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

    function setElementCache(element, attr, data) {
        if (element != null) {
            element[`__${attr}`] = data;
        }
    }
    function getElementCache(element, attr) {
        return (element != null ? element[`__${attr}`] : null);
    }
    function deleteElementCache(element, ...attrs) {
        if (element != null) {
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
        const domRect = Array.from(range.getClientRects());
        const result = assignBounds(domRect[0]);
        const top = new Set([result.top]);
        const bottom = new Set([result.bottom]);
        let multiLine = false;
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
            if (domRect[domRect.length - 1].top >= domRect[0].bottom && element.textContent && (element.textContent.trim() !== '' || /^\s*\n/.test(element.textContent))) {
                multiLine = true;
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
        if (element != null) {
            if (cache) {
                const node = getNodeFromElement(element);
                const style = getElementCache(element, 'style');
                if (style) {
                    return style;
                }
                else if (node) {
                    if (node.style != null) {
                        return node.style;
                    }
                    else if (node.plainText) {
                        return node.styleMap;
                    }
                }
            }
            if (element.nodeName.charAt(0) !== '#') {
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
    function parseBackgroundUrl(value) {
        const match = value.match(/^url\("?(.*?)"?\)$/);
        if (match) {
            return resolvePath(match[1]);
        }
        return '';
    }
    function cssInherit(element, attr, tagName = '', exclude) {
        let result = '';
        let current = element.parentElement;
        while (current != null && current.tagName !== tagName) {
            result = getStyle(current)[attr] || '';
            if (exclude && exclude.some(value => result.indexOf(value) !== -1)) {
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
        if (element.parentElement != null) {
            return styles.includes(getStyle(element.parentElement)[attr]);
        }
        return false;
    }
    function cssFromParent(element, attr) {
        if (element && element.parentElement != null) {
            const node = getNodeFromElement(element);
            const style = getStyle(element);
            return (style && style[attr] === getStyle(element.parentElement)[attr] && (node == null || node.styleMap[attr] == null));
        }
        return false;
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
        if (element != null && element.nodeName === '#text' && element.textContent) {
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
                return (valid && value !== '');
            }
            else {
                return (element.textContent.trim() !== '');
            }
        }
        return false;
    }
    function hasLineBreak(element) {
        if (element != null) {
            const node = getNodeFromElement(element);
            const fromParent = (element.nodeName === '#text');
            let whiteSpace = '';
            if (node != null) {
                whiteSpace = node.css('whiteSpace');
            }
            else {
                whiteSpace = getStyle(element).whiteSpace || '';
            }
            return ((element instanceof HTMLElement && element.children.length > 0 && Array.from(element.children).some(item => item.tagName === 'BR')) ||
                (/\n/.test(element.textContent || '') && (['pre', 'pre-wrap'].includes(whiteSpace) ||
                    (fromParent && cssParent(element, 'whiteSpace', 'pre', 'pre-wrap')))));
        }
        return false;
    }
    function isLineBreak(element, excluded = true) {
        const node = getNodeFromElement(element);
        if (node != null) {
            return (node.tagName === 'BR' ||
                (excluded && node.block && (node.excluded ||
                    node.textContent.trim() === '')));
        }
        return false;
    }
    function getElementsBetweenSiblings(firstElement, secondElement, cacheNode = false, whiteSpace = false) {
        if (firstElement == null || firstElement.parentElement === secondElement.parentElement) {
            const parentElement = secondElement.parentElement;
            if (parentElement != null) {
                const elements = Array.from(parentElement.childNodes);
                const firstIndex = (firstElement != null ? elements.findIndex(element => element === firstElement) : 0);
                const secondIndex = elements.findIndex(element => element === secondElement);
                if (firstIndex !== -1 && secondIndex !== -1 && firstIndex !== secondIndex) {
                    let result = elements.slice(Math.min(firstIndex, secondIndex) + 1, Math.max(firstIndex, secondIndex));
                    if (!whiteSpace) {
                        result =
                            result.filter(element => {
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
    function isElementVisible(element) {
        if (!getElementCache(element, 'supportInline')) {
            if (element instanceof HTMLElement) {
                switch (element.tagName) {
                    case 'BR':
                    case 'OPTION':
                    case 'MAP':
                    case 'AREA':
                        return false;
                }
                if (typeof element.getBoundingClientRect === 'function') {
                    const bounds = element.getBoundingClientRect();
                    if ((bounds.width !== 0 && bounds.height !== 0) || hasValue(element.dataset.ext) || getStyle(element).clear !== 'none') {
                        return true;
                    }
                    else {
                        let current = element.parentElement;
                        let valid = true;
                        while (current != null) {
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
                                    return ((position !== 'static' && position !== 'initial') || float === 'left' || float === 'right');
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

    class NodeList {
        constructor(nodes, parent) {
            this.parent = parent;
            this._list = [];
            this._currentId = 0;
            if (Array.isArray(nodes)) {
                this._list = nodes;
            }
        }
        static siblingIndex(a, b) {
            return (a.siblingIndex <= b.siblingIndex ? -1 : 1);
        }
        static cleared(list) {
            const nodes = new Set();
            const floats = new Set();
            list.forEach(node => {
                const clear = node.css('clear');
                if (floats.size > 0 && (clear === 'both' || floats.has(clear))) {
                    nodes.add(node);
                    floats.clear();
                }
                if (node.floating) {
                    floats.add(node.float);
                }
            });
            return nodes;
        }
        static textBaseline(list, alignInput = false, excludeImage = false) {
            let baseline = list.filter(node => node.imageElement && node.baseline);
            if (!excludeImage && baseline.length > 0) {
                return baseline;
            }
            else if (alignInput) {
                baseline = list.filter(node => node.baseline).sort((a, b) => {
                    let nodeTypeA = a.nodeType;
                    let nodeTypeB = b.nodeType;
                    if (a.linearHorizontal) {
                        nodeTypeA = Math.min.apply(null, a.children.map(item => (item.nodeType > 0 ? item.nodeType : NODE_STANDARD.INLINE)));
                    }
                    if (b.linearHorizontal) {
                        nodeTypeB = Math.min.apply(null, b.children.map(item => (item.nodeType > 0 ? item.nodeType : NODE_STANDARD.INLINE)));
                    }
                    return (nodeTypeA <= nodeTypeB ? -1 : 1);
                });
            }
            else {
                const lineHeight = Math.max.apply(null, list.map(node => node.lineHeight));
                const boundsHeight = Math.max.apply(null, list.map(node => node.bounds.height));
                if (lineHeight > boundsHeight) {
                    const result = list.filter(node => node.lineHeight === lineHeight);
                    return (result.length === list.length ? result.filter(node => node.hasElement) : result).filter(node => node.baseline);
                }
                baseline = list.filter(node => node.baseline).sort((a, b) => {
                    const fontSizeA = convertInt(a.css('fontSize'));
                    const fontSizeB = convertInt(b.css('fontSize'));
                    const heightA = a.bounds.height;
                    const heightB = b.bounds.height;
                    if (a.imageElement && b.imageElement) {
                        return (heightA >= heightB ? -1 : 1);
                    }
                    else if ((a.lineHeight > heightB && b.lineHeight === 0) || b.imageElement) {
                        return -1;
                    }
                    else if ((b.lineHeight > heightA && a.lineHeight === 0) || a.imageElement) {
                        return 1;
                    }
                    else if (!a.imageElement && !b.imageElement) {
                        if (fontSizeA === fontSizeB && heightA === heightB) {
                            if (a.hasElement && !b.hasElement) {
                                return -1;
                            }
                            else if (!a.hasElement && b.hasElement) {
                                return 1;
                            }
                            else {
                                return (a.siblingIndex <= b.siblingIndex ? -1 : 1);
                            }
                        }
                        else if (fontSizeA !== fontSizeB && fontSizeA !== 0 && fontSizeB !== 0) {
                            return (fontSizeA > fontSizeB ? -1 : 1);
                        }
                    }
                    return (heightA >= heightB ? -1 : 1);
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
                    return (node.css('fontFamily') === fontFamily && node.css('fontSize') === fontSize && node.css('fontWeight') === fontWeight && ((node.lineHeight > 0 && node.lineHeight === baseline[0].lineHeight) || node.bounds.height === baseline[0].bounds.height) && node.nodeName === baseline[0].nodeName);
                }
            });
        }
        static documentParent(nodes) {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].companion == null) {
                    return nodes[i].documentParent;
                }
            }
            return nodes[0].documentParent;
        }
        static linearX(list) {
            const nodes = list.filter(node => node.pageflow);
            switch (nodes.length) {
                case 0:
                    return false;
                case 1:
                    return true;
                default:
                    const parent = this.documentParent(nodes);
                    if (nodes.every(node => node.documentParent === parent || (node.companion && node.companion.documentParent === parent))) {
                        const cleared = NodeList.cleared(Array.from(parent.element.children).map(node => getNodeFromElement(node)).filter(node => node));
                        const horizontal = nodes.slice().sort(NodeList.siblingIndex).every((node, index) => {
                            if (index > 0) {
                                if (node.companion && node.companion.documentParent === parent) {
                                    node = node.companion;
                                }
                                const previous = node.previousSibling();
                                if (previous != null) {
                                    return !node.alignedVertical(previous, cleared);
                                }
                            }
                            return true;
                        });
                        if (horizontal) {
                            return nodes.every(node => {
                                return !nodes.some(sibling => {
                                    if (sibling !== node && node.linear.top >= sibling.linear.bottom && node.intersectY(sibling.linear)) {
                                        return true;
                                    }
                                    return false;
                                });
                            });
                        }
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
                    const parent = this.documentParent(nodes);
                    if (nodes.every(node => node.documentParent === parent || (node.companion && node.companion.documentParent === parent))) {
                        const cleared = NodeList.cleared(Array.from(parent.element.children).map(node => getNodeFromElement(node)).filter(node => node));
                        return nodes.slice().sort(NodeList.siblingIndex).every((node, index) => {
                            if (index > 0 && !node.lineBreak) {
                                if (node.companion && node.companion.documentParent === parent) {
                                    node = node.companion;
                                }
                                const previous = node.previousSibling();
                                if (previous != null) {
                                    return node.alignedVertical(previous, cleared);
                                }
                            }
                            return true;
                        });
                    }
                    return false;
            }
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
            if (this.delegateAppend != null) {
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
        filter(predicate) {
            return new NodeList(this._list.filter(predicate));
        }
        sort(predicate) {
            return new NodeList(this._list.slice().sort(predicate));
        }
        partition(predicate) {
            const [valid, invalid] = partition(this._list, predicate);
            return [new NodeList(valid), new NodeList(invalid)];
        }
        each(predicate) {
            this._list.forEach(predicate);
        }
        locate(attr, value) {
            if (typeof attr === 'string') {
                return this._list.find(node => node[attr] === value);
            }
            return this._list.find(attr);
        }
        clear() {
            this._list.length = 0;
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
            return new NodeList(this._list.filter(node => node.visible));
        }
        get elements() {
            return new NodeList(this._list.filter(node => node.visible && node.hasElement));
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

    function formatPlaceholder(id, symbol = ':') {
        return `{${symbol + id.toString()}}`;
    }
    function replacePlaceholder(value, id, content, before = false) {
        const placeholder = (typeof id === 'number' ? formatPlaceholder(id) : id);
        return value.replace(placeholder, (before ? placeholder : '') + content + (before ? '' : placeholder));
    }
    function removePlaceholders(value) {
        return value.replace(/{[<:@>]{1}[0-9]+(\:[0-9]+)?}/g, '').trim();
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
            }).join('\n');
        }
        return value;
    }
    function replaceTab(value, spaces = 4, preserve = false) {
        if (spaces > 0) {
            if (preserve) {
                value = value.split('\n').map(line => {
                    const match = line.match(/^(\t+)(.*)$/);
                    if (match) {
                        return ' '.repeat(spaces * match[1].length) + match[2];
                    }
                    return line;
                }).join('\n');
            }
            else {
                value = value.replace(/\t/g, ' '.repeat(spaces));
            }
        }
        return value;
    }
    function replaceEntity(value) {
        value = value.replace(/&#([0-9]+);/g, (match, capture) => String.fromCharCode(parseInt(capture)));
        value = value.replace(/&nbsp;/g, '&#160;');
        return replaceWhiteSpace(value);
    }
    function getTemplateLevel(data, ...levels) {
        let current = data;
        for (const level of levels) {
            const [index, array = '0'] = level.split('-');
            current = current[index][array];
        }
        return current;
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
    function insertTemplateData(template, data, index, include, exclude) {
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
                    value += insertTemplateData(template, data[i][j], i, include, exclude);
                }
            }
            else {
                value = data[i];
            }
            if (value != null && value !== '') {
                output = (index != null ? output.replace(new RegExp(`{[%@&]*${i}}`, 'g'), value) : value.trim());
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
                    const attr = `{#${match[1]}=${match[2]}}`;
                    output = output.replace(attr, data[match[2]] || match[2]);
                }
                else if (exclude && exclude[match[1]]) {
                    output = output.replace(match[0], '');
                }
            }
        }
        return output.replace(/\s+[\w:]+="{@\w+}"/g, '');
    }

    (function (BUILD_ANDROID) {
        BUILD_ANDROID[BUILD_ANDROID["PIE"] = 28] = "PIE";
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
    const NODE_ANDROID = {
        CHECKBOX: 'CheckBox',
        RADIO: 'RadioButton',
        EDIT: 'EditText',
        SELECT: 'Spinner',
        RANGE: 'SeekBar',
        TEXT: 'TextView',
        IMAGE: 'ImageView',
        BUTTON: 'Button',
        LINE: 'View',
        SPACE: 'Space',
        WEB_VIEW: 'WebView',
        FRAME: 'FrameLayout',
        LINEAR: 'LinearLayout',
        RADIO_GROUP: 'RadioGroup',
        GRID: 'android.support.v7.widget.GridLayout',
        RELATIVE: 'RelativeLayout',
        CONSTRAINT: 'android.support.constraint.ConstraintLayout',
        SCROLL_HORIZONTAL: 'HorizontalScrollView',
        SCROLL_VERTICAL: 'android.support.v4.widget.NestedScrollView',
        GUIDELINE: 'android.support.constraint.Guideline'
    };
    const BOX_ANDROID = {
        MARGIN: 'layout_margin',
        MARGIN_VERTICAL: 'layout_marginVertical',
        MARGIN_HORIZONTAL: 'layout_marginHorizontal',
        MARGIN_TOP: 'layout_marginTop',
        MARGIN_RIGHT: 'layout_marginRight',
        MARGIN_BOTTOM: 'layout_marginBottom',
        MARGIN_LEFT: 'layout_marginLeft',
        PADDING: 'padding',
        PADDING_VERTICAL: 'paddingVertical',
        PADDING_HORIZONTAL: 'paddingHorizontal',
        PADDING_TOP: 'paddingTop',
        PADDING_RIGHT: 'paddingRight',
        PADDING_BOTTOM: 'paddingBottom',
        PADDING_LEFT: 'paddingLeft'
    };
    const AXIS_ANDROID = {
        HORIZONTAL: 'horizontal',
        VERTICAL: 'vertical'
    };
    const XMLNS_ANDROID = {
        'android': 'http://schemas.android.com/apk/res/android',
        'app': 'http://schemas.android.com/apk/res-auto',
        'tools': 'http://schemas.android.com/tools'
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
    const FONTREPLACE_ANDROID = {
        'ms shell dlg \\32': 'sans-serif',
        'system-ui': 'sans-serif',
        '-apple-system': 'sans-serif'
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
    const WEBVIEW_ANDROID = [
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
        'BR',
        'PLAINTEXT'
    ];
    const RESERVED_JAVA = [
        'abstract',
        'assert',
        'boolean',
        'break',
        'byte',
        'case',
        'catch',
        'char',
        'class',
        'const',
        'continue',
        'default',
        'double',
        'do',
        'else',
        'enum',
        'extends',
        'false',
        'final',
        'finally',
        'float',
        'for',
        'goto',
        'if',
        'implements',
        'import',
        'instanceof',
        'int',
        'interface',
        'long',
        'native',
        'new',
        'null',
        'package',
        'private',
        'protected',
        'public',
        'return',
        'short',
        'static',
        'strictfp',
        'super',
        'switch',
        'synchronized',
        'this',
        'throw',
        'throws',
        'transient',
        'true',
        'try',
        'void',
        'volatile',
        'while'
    ];

    const SETTINGS = {
        builtInExtensions: [
            'androme.external',
            'androme.custom',
            'androme.list',
            'androme.table',
            'androme.grid',
            'androme.widget'
        ],
        targetAPI: exports.build.OREO,
        density: exports.density.MDPI,
        supportRTL: true,
        dimensResourceValue: true,
        numberResourceValue: false,
        fontAliasResourceValue: true,
        alwaysReevaluateResources: true,
        renderInlineText: true,
        ellipsisOnTextOverflow: true,
        preloadImages: true,
        autoSizeBackgroundImage: true,
        autoSizePaddingAndBorderWidth: true,
        constraintChainDisabled: false,
        constraintWhitespaceHorizontalOffset: 4,
        constraintWhitespaceVerticalOffset: 16,
        constraintChainPackedHorizontalOffset: 4,
        constraintChainPackedVerticalOffset: 16,
        constraintCirclePositionAbsolute: false,
        constraintSupportNegativeLeftTop: true,
        constraintPercentAccuracy: 4,
        collapseUnattributedElements: true,
        showAttributes: true,
        customizationsOverwritePrivilege: false,
        autoCloseOnWrite: true,
        insertSpaces: 4,
        convertPixels: 'dp',
        outputDirectory: 'app/src/main',
        outputActivityMainFileName: 'activity_main.xml',
        outputArchiveFileType: 'zip',
        outputMaxProcessingTime: 30
    };

    class Application {
        constructor(_Node) {
            this._Node = _Node;
            this.cache = new NodeList();
            this.cacheSession = new NodeList();
            this.elements = new Set();
            this.extensions = [];
            this.renderQueue = {};
            this.closed = false;
            this._views = [];
            this._includes = [];
            this._sorted = {};
            this._currentIndex = -1;
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
            const found = this.getExtension(extension.name);
            if (found) {
                if (Array.isArray(extension.tagNames)) {
                    found.tagNames = extension.tagNames;
                }
                Object.assign(found.options, extension.options);
            }
            else {
                if (extension.dependencies.every(item => this.getExtension(item.name) != null)) {
                    extension.application = this;
                    this.extensions.push(extension);
                }
            }
        }
        finalize() {
            const visible = this.cacheSession.visible;
            for (const node of visible) {
                if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.LAYOUT)) {
                    node.setLayout();
                }
                if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.ALIGNMENT)) {
                    node.setAlignment();
                }
            }
            for (const node of visible) {
                if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.OPTIMIZATION)) {
                    node.applyOptimizations(SETTINGS);
                }
                if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.CUSTOMIZATION)) {
                    node.applyCustomizations(SETTINGS.customizationsOverwritePrivilege);
                }
            }
            this.appendRenderQueue();
            this.controllerHandler.setDimensions(this.viewData);
            for (const node of this.cacheSession) {
                for (const ext of node.renderExtension) {
                    ext.setTarget(node);
                    ext.finalize();
                }
            }
            this.resourceHandler.finalize(this.viewData);
            this.controllerHandler.finalize(this.viewData);
            this.closed = true;
        }
        reset() {
            for (const node of this.cacheSession) {
                deleteElementCache(node.element, 'node', 'style', 'styleMap', 'supportInline', 'boxSpacing', 'boxStyle', 'fontStyle', 'imageSource', 'optionArray', 'valueString');
            }
            this.cache.reset();
            this.cacheSession.reset();
            this.resetController();
            this.resetResource();
            this._views.length = 0;
            this._includes.length = 0;
            this._sorted = {};
            this._currentIndex = -1;
            this.appName = '';
            this.renderQueue = {};
            this.closed = false;
        }
        setConstraints() {
            this.controllerHandler.setConstraints();
        }
        resetController() {
            this.controllerHandler.reset();
        }
        setResources() {
            this.resourceHandler.setBoxStyle();
            this.resourceHandler.setFontStyle();
            this.resourceHandler.setBoxSpacing();
            this.resourceHandler.setValueString();
            this.resourceHandler.setOptionArray();
            this.resourceHandler.setImageSource();
        }
        resetResource() {
            this.resourceHandler.reset();
        }
        createNodeCache(rootElement) {
            let nodeTotal = 0;
            if (rootElement === document.body) {
                Array.from(document.body.childNodes).some((item) => isElementVisible(item) && ++nodeTotal > 1);
            }
            const elements = (rootElement !== document.body ? rootElement.querySelectorAll('*') : document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *')));
            this.cache.parent = undefined;
            this.cache.delegateAppend = undefined;
            this.cache.clear();
            for (const ext of this.extensions) {
                ext.setTarget({}, undefined, rootElement);
                ext.beforeInit();
            }
            const rootNode = this.insertNode(rootElement);
            if (rootNode != null) {
                rootNode.parent = new this._Node(0, SETTINGS.targetAPI, (rootElement === document.body ? rootElement : rootElement.parentElement) || document.body);
                rootNode.documentRoot = true;
                this.cache.parent = rootNode;
            }
            else {
                return false;
            }
            const supportInline = (SETTINGS.renderInlineText ? ['BR'] : this.controllerHandler.supportInline);
            function inlineElement(element) {
                const styleMap = getElementCache(element, 'styleMap');
                return ((styleMap == null || Object.keys(styleMap).length === 0) && supportInline.includes(element.tagName) && element.children.length === 0);
            }
            for (const element of Array.from(elements)) {
                if (!this.elements.has(element)) {
                    this.prioritizeExtOrder(this.extensions, element).some(item => item.init(element));
                    if (!this.elements.has(element)) {
                        if (inlineElement(element) && element.parentElement && Array.from(element.parentElement.children).every(item => inlineElement(item))) {
                            setElementCache(element, 'supportInline', true);
                        }
                        let valid = true;
                        let current = element.parentElement;
                        while (current != null) {
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
                            this.insertNode(element);
                        }
                    }
                }
            }
            for (const node of this.cache) {
                let valid = true;
                const text = [];
                Array.from(node.element.childNodes).forEach((element) => {
                    if (element.nodeName === '#text') {
                        if (node.tagName !== 'SELECT') {
                            text.push(element);
                        }
                    }
                    else if (element.tagName !== 'BR') {
                        const elementNode = getNodeFromElement(element);
                        if (!supportInline.includes(element.tagName) || (elementNode && !elementNode.excluded)) {
                            valid = false;
                        }
                    }
                });
                if (!valid) {
                    text.forEach(element => this.insertNode(element, node));
                }
            }
            if (this.cache.length > 0) {
                const preAlignment = {};
                for (const node of this.cache.elements) {
                    const element = node.element;
                    preAlignment[node.id] = {};
                    const style = preAlignment[node.id];
                    const textAlign = node.css('textAlign');
                    switch (textAlign) {
                        case 'center':
                            if (element.tagName === 'BUTTON' || element.type === 'button') {
                                break;
                            }
                        case 'right':
                        case 'end':
                            style.textAlign = textAlign;
                            element.style.textAlign = 'left';
                            break;
                    }
                    if (node.marginLeft < 0) {
                        style.marginLeft = node.css('marginLeft');
                        element.style.marginLeft = '0px';
                    }
                    if (node.marginTop < 0) {
                        style.marginTop = node.css('marginTop');
                        element.style.marginTop = '0px';
                    }
                    if (node.position === 'relative') {
                        ['top', 'right', 'bottom', 'left'].forEach(value => {
                            if (node.has(value)) {
                                style[value] = node.styleMap[value];
                                element.style[value] = 'auto';
                            }
                        });
                    }
                    if (node.overflowX || node.overflowY) {
                        if (node.has('width')) {
                            style.width = node.styleMap.width;
                            element.style.width = 'auto';
                        }
                        if (node.has('height')) {
                            style.height = node.styleMap.height;
                            element.style.height = 'auto';
                        }
                        style.overflow = node.style.overflow;
                        element.style.overflow = 'visible';
                    }
                }
                for (const node of this.cache) {
                    node.setBounds();
                }
                for (const node of this.cache) {
                    const style = preAlignment[node.id];
                    if (style != null) {
                        for (const attr in style) {
                            node.element.style[attr] = style[attr];
                        }
                    }
                }
                for (const node of this.cache) {
                    node.setMultiLine();
                    if (node.pageflow) {
                        const element = node.element;
                        if (element.tagName === 'INPUT' && !node.hasBit('excludeProcedure', NODE_PROCEDURE.ACCESSIBILITY)) {
                            switch (element.type) {
                                case 'radio':
                                case 'checkbox':
                                    [node.nextElementSibling, node.previousElementSibling].some((sibling) => {
                                        const label = getNodeFromElement(sibling);
                                        const labelParent = (sibling && sibling.parentElement && sibling.parentElement.tagName === 'LABEL' ? getNodeFromElement(sibling.parentElement) : null);
                                        if (label && label.visible && label.pageflow) {
                                            if (sibling.htmlFor !== '' && sibling.htmlFor === element.id) {
                                                node.companion = label;
                                            }
                                            else if (labelParent && label.textElement) {
                                                node.companion = labelParent;
                                                labelParent.renderAs = node;
                                            }
                                            if (node.companion != null) {
                                                label.hide();
                                                node.setBounds(false);
                                                return true;
                                            }
                                        }
                                        return false;
                                    });
                                    break;
                            }
                        }
                    }
                }
                const visible = this.cache.visible;
                for (const node of visible) {
                    if (!node.documentRoot) {
                        let parent = node.getParentElementAsNode(SETTINGS.constraintSupportNegativeLeftTop);
                        if (parent == null && !node.pageflow) {
                            parent = this.cache.parent;
                        }
                        if (parent != null) {
                            node.parent = parent;
                            node.documentParent = parent;
                        }
                        else {
                            node.hide();
                        }
                    }
                }
                for (const node of visible) {
                    if (node.children.length === 1) {
                        const firstChild = node.children[0];
                        if (!firstChild.pageflow &&
                            firstChild.toInt('top') === 0 &&
                            firstChild.toInt('right') === 0 &&
                            firstChild.toInt('bottom') === 0 &&
                            firstChild.toInt('left') === 0) {
                            firstChild.pageflow = true;
                        }
                    }
                    if (node.children.some((current) => {
                        if (current.pageflow) {
                            return (current.float !== 'right' &&
                                current.marginLeft < 0 &&
                                node.marginLeft >= Math.abs(current.marginLeft) &&
                                (Math.abs(current.marginLeft) >= current.bounds.width || node.documentRoot));
                        }
                        else {
                            const left = current.toInt('left');
                            const right = current.toInt('right');
                            return ((left < 0 && node.marginLeft >= Math.abs(left)) || (right < 0 && Math.abs(right) >= current.bounds.width));
                        }
                    })) {
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
                                const left = convertInt(current.left);
                                const right = convertInt(current.right);
                                if (left < 0) {
                                    if (node.marginLeft >= left) {
                                        current.css('left', formatPX(left + node.marginLeft));
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
                            const [sectionLeft, sectionRight] = new NodeList(node.children).partition((item) => !marginRight.includes(item));
                            if (sectionLeft.length > 0 && sectionRight.length > 0) {
                                if (node.autoLeftMargin) {
                                    node.css('marginLeft', node.style.marginLeft);
                                }
                                node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, null);
                                const widthLeft = (node.has('width') ? node.toInt('width') : Math.max.apply(null, sectionRight.list.map(item => item.linear.width)));
                                const widthRight = Math.max.apply(null, sectionRight.list.map(item => Math.abs(item.toInt('right'))));
                                sectionLeft.each((item) => {
                                    if (item.pageflow && item.viewWidth === 0) {
                                        item.css((item.inlineStatic || item.textElement ? 'maxWidth' : 'width'), formatPX(widthLeft));
                                    }
                                });
                                node.css('width', formatPX(widthLeft + widthRight));
                            }
                        }
                        const marginLeftType = Math.max.apply(null, marginLeft);
                        node.each((current, index) => {
                            if (marginLeftType && marginLeft[index] !== 2 && ((current.pageflow && !current.plainText && marginLeft.includes(1)) || marginLeftType === 2)) {
                                if (marginLeft[index] === 1) {
                                    current.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
                                    current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + node.marginLeft, false, true);
                                }
                                else {
                                    current.modifyBox(BOX_STANDARD.MARGIN_LEFT, node.marginLeft, false, true);
                                }
                            }
                        });
                        if (marginLeftType > 0) {
                            const width = node.toInt('width');
                            if (width > 0) {
                                node.css('width', formatPX(width + node.marginLeft));
                            }
                            node.bounds.left -= node.marginLeft;
                            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null, false, true);
                        }
                    }
                    if (!node.pageflow && node.children.length > 0) {
                        let calibrate = false;
                        if (node.viewWidth === 0) {
                            const maxRight = Math.max.apply(null, node.cascade().map(item => item.linear.right)) || 0;
                            node.bounds.right = maxRight + node.paddingRight + node.borderRightWidth;
                            node.bounds.width = node.bounds.right - node.bounds.left;
                            calibrate = true;
                        }
                        if (node.viewHeight === 0) {
                            const maxBottom = Math.max.apply(null, node.cascade().map(item => item.linear.bottom)) || 0;
                            node.bounds.bottom = maxBottom + node.paddingBottom + node.borderBottomWidth;
                            node.bounds.height = node.bounds.bottom - node.bounds.top;
                            calibrate = true;
                        }
                        if (calibrate) {
                            node.setBounds(true);
                        }
                    }
                }
                for (const ext of this.extensions) {
                    ext.setTarget(rootNode);
                    ext.afterInit();
                }
                for (const node of this.cache.elements) {
                    let i = 0;
                    Array.from(node.element.childNodes).forEach((element) => {
                        const child = getNodeFromElement(element);
                        if (child && child.visible && !child.excluded && child.pageflow) {
                            child.siblingIndex = i++;
                        }
                    });
                    node.sort();
                }
                this.cache.sortAsc('depth', 'id');
                this.createLayout(rootElement.dataset.viewName);
                return true;
            }
            return false;
        }
        createLayoutXml() {
            const application = this;
            const mapX = [];
            const mapY = new Map();
            let output = `<?xml version="1.0" encoding="utf-8"?>\n{:0}`;
            let empty = true;
            function setMapY(depth, id, node) {
                if (!mapY.has(depth)) {
                    mapY.set(depth, new Map());
                }
                const indexY = mapY.get(depth);
                if (indexY != null) {
                    indexY.set(id, node);
                }
            }
            if (this.cache.parent != null) {
                setMapY(-1, 0, this.cache.parent.parent);
            }
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
            }
            this.cache.delegateAppend = (nodes) => {
                nodes.forEach(node => {
                    setMapY(-2, node.id, node);
                    node.children.forEach((child) => {
                        const indexY = mapY.get(child.depth);
                        if (indexY && indexY.has(child.id)) {
                            indexY.delete(child.id);
                        }
                        setMapY(-3, child.id, child);
                    });
                });
            };
            for (const depth of mapY.values()) {
                const partial = new Map();
                const external = new Map();
                function insertViewTemplate(data, node, parentId, value, current) {
                    const key = parentId + (current === '' && node.renderPosition !== -1 ? `:${node.renderPosition}` : '');
                    if (!data.has(key)) {
                        data.set(key, new Map());
                    }
                    data.get(key).set(node.id, value);
                }
                function renderXml(node, parent, xml, current = '', group = false) {
                    if (xml !== '') {
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
                                            insertViewTemplate(data, item, node.id.toString(), template, current);
                                            views.delete(item.id);
                                            return true;
                                        }
                                    }
                                    return false;
                                });
                            });
                        }
                        if (current !== '') {
                            insertViewTemplate(external, node, current, xml, current);
                        }
                        else {
                            if (!application.elements.has(node.element)) {
                                if (node.isSet('dataset', 'target')) {
                                    const target = document.getElementById(node.dataset.target);
                                    if (target != null && target !== parent.element) {
                                        application.addRenderQueue(node.dataset.target, [xml]);
                                        node.auto = false;
                                        return;
                                    }
                                }
                                else if (parent.isSet('dataset', 'target')) {
                                    const target = document.getElementById(parent.dataset.target);
                                    if (target != null) {
                                        application.addRenderQueue(parent.nodeId, [xml]);
                                        node.dataset.target = parent.nodeId;
                                        return;
                                    }
                                }
                            }
                            insertViewTemplate(partial, node, parent.id.toString(), xml, current);
                        }
                    }
                }
                for (const parent of depth.values()) {
                    if (parent.children.length === 0 || parent.renderAs != null) {
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
                    this.sortByAlignment(middle, parent);
                    axisY.push(...sortAsc(below, 'style.zIndex', 'id'));
                    axisY.push(...middle);
                    axisY.push(...sortAsc(above, 'style.zIndex', 'id'));
                    const cleared = NodeList.cleared(axisY);
                    const includes$$1 = [];
                    let current = '';
                    let k = -1;
                    while (++k < axisY.length) {
                        let nodeY = axisY[k];
                        if (!nodeY.documentRoot && this.elements.has(nodeY.element)) {
                            continue;
                        }
                        let parentY = nodeY.parent;
                        if (this.controllerHandler.supportInclude) {
                            const filename = optional(nodeY, 'dataset.include').trim();
                            if (filename !== '' && includes$$1.indexOf(filename) === -1) {
                                renderXml(nodeY, parentY, this.controllerHandler.renderInclude(nodeY, parentY, filename), (includes$$1.length > 0 ? includes$$1[includes$$1.length - 1] : ''));
                                includes$$1.push(filename);
                            }
                            current = (includes$$1.length > 0 ? includes$$1[includes$$1.length - 1] : '');
                            if (current !== '') {
                                const cloneParent = parentY.clone();
                                cloneParent.renderDepth = this.controllerHandler.baseRenderDepth(current);
                                nodeY.parent = cloneParent;
                                parentY = cloneParent;
                            }
                        }
                        if (nodeY.renderAs != null) {
                            parentY.remove(nodeY);
                            nodeY.hide();
                            nodeY = nodeY.renderAs;
                            nodeY.parent = parentY;
                        }
                        if (!nodeY.rendered) {
                            let next = false;
                            for (const ext of [...parentY.renderExtension, ...nodeY.renderExtensionChild]) {
                                ext.setTarget(nodeY, parentY);
                                const result = ext.processChild();
                                if (result.xml !== '') {
                                    renderXml(nodeY, parentY, result.xml, current);
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
                            const processed = [];
                            this.prioritizeExtOrder(this.extensions, nodeY.element).some(item => {
                                if (item.is(nodeY)) {
                                    item.setTarget(nodeY, parentY);
                                    if (item.condition()) {
                                        const result = item.processNode(mapX, mapY);
                                        if (result.xml !== '') {
                                            renderXml(nodeY, parentY, result.xml, current);
                                        }
                                        if (result.parent) {
                                            parentY = result.parent;
                                        }
                                        if (result.xml !== '' || result.include) {
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
                                nodeY.renderExtension.push(...processed);
                            }
                            if (next) {
                                continue;
                            }
                            const linearVertical = parentY.linearVertical;
                            const extendHorizontal = (!nodeY.blockStatic && linearVertical && nodeY === parentY.children[parentY.children.length - 1]);
                            if (nodeY.alignmentType === NODE_ALIGNMENT.NONE &&
                                nodeY.pageflow && ((parentY.alignmentType === NODE_ALIGNMENT.NONE && (linearVertical || parentY.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE))) ||
                                extendHorizontal) &&
                                !parentY.flex.enabled &&
                                !parentY.has('columnCount') &&
                                current === '') {
                                const horizontal = [];
                                const vertical = [];
                                let l = k;
                                let m = 0;
                                if (extendHorizontal) {
                                    horizontal.push(nodeY);
                                    l++;
                                    m++;
                                }
                                for (; l < axisY.length; l++, m++) {
                                    const adjacent = axisY[l];
                                    if (adjacent.pageflow) {
                                        const previousSibling = adjacent.previousSibling();
                                        const nextSibling = adjacent.nextSibling();
                                        if (m === 0 && nextSibling != null) {
                                            if (adjacent.blockStatic || nextSibling.alignedVertical(adjacent, cleared, true)) {
                                                vertical.push(nodeY);
                                            }
                                            else {
                                                horizontal.push(nodeY);
                                            }
                                        }
                                        else if (previousSibling != null) {
                                            if (adjacent.alignedVertical(previousSibling, cleared)) {
                                                if (horizontal.length > 0) {
                                                    if (!adjacent.floating && cleared.has(adjacent) && horizontal.some(node => node.float === adjacent.css('clear'))) {
                                                        horizontal.push(adjacent);
                                                    }
                                                    break;
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
                                                if (vertical.length > 0) {
                                                    break;
                                                }
                                                horizontal.push(adjacent);
                                            }
                                        }
                                        else {
                                            break;
                                        }
                                    }
                                }
                                let group = null;
                                let groupXml = '';
                                if (horizontal.length > 1) {
                                    if (this.isFrameHorizontal(horizontal, cleared)) {
                                        group = this.controllerHandler.createGroup(parentY, nodeY, horizontal);
                                        groupXml = this.writeFrameLayoutHorizontal(group, parentY, horizontal, cleared);
                                    }
                                    else {
                                        if (horizontal.length === axisY.length) {
                                            parentY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                        }
                                        else {
                                            if (new Set(horizontal.map(node => node.float)).size === 1 && horizontal.some(node => isPercent(node.css('width'))) && horizontal.every(node => isPercent(node.css('width')) || isUnit(node.css('width')))) {
                                                group = this.controllerHandler.createGroup(parentY, nodeY, horizontal);
                                                groupXml = this.writeConstraintLayout(group, parentY);
                                                group.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP;
                                            }
                                            else if (this.isRelativeHorizontal(horizontal)) {
                                                group = this.controllerHandler.createGroup(parentY, nodeY, horizontal);
                                                groupXml = this.writeRelativeLayout(group, parentY);
                                                group.alignmentType |= (horizontal.some(node => node.plainText && node.multiLine) ? NODE_ALIGNMENT.INLINE_WRAP : NODE_ALIGNMENT.HORIZONTAL);
                                            }
                                            else if (horizontal.some(node => !node.parent.linearHorizontal)) {
                                                group = this.controllerHandler.createGroup(parentY, nodeY, horizontal);
                                                groupXml = this.writeLinearLayout(group, parentY, true);
                                                group.alignmentType |= (horizontal.every(node => node.float === 'right' || node.autoLeftMargin) ? NODE_ALIGNMENT.RIGHT : NODE_ALIGNMENT.LEFT);
                                            }
                                        }
                                    }
                                }
                                else if (vertical.length > 1) {
                                    if (!parentY.is(NODE_STANDARD.CONSTRAINT) && vertical.some(node => cleared.has(node) && node !== vertical[0]) && !vertical.every((node, index) => index === 0 || cleared.has(node))) {
                                        group = this.controllerHandler.createGroup(parentY, nodeY, vertical);
                                        groupXml = this.writeFrameLayoutVertical(group, parentY, vertical, cleared);
                                    }
                                    else {
                                        const lastNode = vertical[vertical.length - 1];
                                        const lastNextNode = lastNode.nextSibling();
                                        if (vertical.length === axisY.length) {
                                            parentY.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                        }
                                        else if (!(linearVertical && (lastNode.blockStatic || (lastNextNode && lastNextNode.lineBreak)))) {
                                            group = this.controllerHandler.createGroup(parentY, nodeY, vertical);
                                            groupXml = this.writeLinearLayout(group, parentY, false);
                                            group.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                        }
                                    }
                                }
                                if (group != null) {
                                    renderXml(group, parentY, groupXml, '', true);
                                    parentY = nodeY.parent;
                                }
                            }
                            if (!nodeY.rendered) {
                                let xml = '';
                                if (nodeY.alignmentType === NODE_ALIGNMENT.NONE && nodeY.has('width', CSS_STANDARD.PERCENT, { not: '100%' }) && !nodeY.imageElement && (parentY.linearVertical || (parentY.is(NODE_STANDARD.FRAME) && nodeY.singleChild))) {
                                    const group = this.controllerHandler.createGroup(parentY, nodeY, [nodeY]);
                                    const groupXml = this.writeGridLayout(group, parentY, 2, 1);
                                    group.alignmentType |= NODE_ALIGNMENT.PERCENT;
                                    renderXml(group, parentY, groupXml, current);
                                    this.controllerHandler[(nodeY.float === 'right' || nodeY.autoLeftMargin ? 'prependBefore' : 'appendAfter')](nodeY.id, this.getEmptySpacer(NODE_STANDARD.GRID, group.renderDepth + 1, `${(100 - nodeY.toInt('width'))}%`));
                                    parentY = group;
                                }
                                if (nodeY.controlName === '') {
                                    const borderVisible = (nodeY.borderTopWidth > 0 || nodeY.borderBottomWidth > 0 || nodeY.borderRightWidth > 0 || nodeY.borderLeftWidth > 0);
                                    const backgroundImage = /url(.*?)/.test(nodeY.css('backgroundImage'));
                                    const backgroundColor = nodeY.has('backgroundColor');
                                    const backgroundVisible = (borderVisible || backgroundImage || backgroundColor);
                                    if (nodeY.children.length === 0) {
                                        const freeFormText = hasFreeFormText(nodeY.element, (SETTINGS.renderInlineText ? 0 : 1));
                                        if (freeFormText || (borderVisible && nodeY.textContent.length > 0)) {
                                            xml = this.writeNode(nodeY, parentY, NODE_STANDARD.TEXT);
                                        }
                                        else if ((!nodeY.inlineText || (nodeY.toInt('textIndent') + nodeY.bounds.width) < 0) && backgroundImage && nodeY.css('backgroundRepeat') === 'no-repeat') {
                                            nodeY.alignmentType |= NODE_ALIGNMENT.SINGLE;
                                            nodeY.excludeResource |= NODE_RESOURCE.FONT_STYLE | NODE_RESOURCE.VALUE_STRING;
                                            xml = this.writeNode(nodeY, parentY, NODE_STANDARD.IMAGE);
                                        }
                                        else if (nodeY.block && (backgroundColor || backgroundImage) && (borderVisible || (nodeY.paddingTop + nodeY.paddingRight + nodeY.paddingRight + nodeY.paddingLeft) > 0)) {
                                            xml = this.writeNode(nodeY, parentY, NODE_STANDARD.LINE);
                                        }
                                        else if (!nodeY.documentRoot) {
                                            if (SETTINGS.collapseUnattributedElements &&
                                                nodeY.bounds.height === 0 &&
                                                !backgroundVisible &&
                                                !hasValue(nodeY.element.id) &&
                                                !hasValue(nodeY.dataset.ext)) {
                                                parentY.remove(nodeY);
                                                nodeY.hide();
                                            }
                                            else if (backgroundVisible) {
                                                xml = this.writeNode(nodeY, parentY, NODE_STANDARD.TEXT);
                                            }
                                            else {
                                                xml = this.writeFrameLayout(nodeY, parentY);
                                            }
                                        }
                                    }
                                    else {
                                        if (nodeY.flex.enabled || nodeY.children.some(node => !node.pageflow) || nodeY.has('columnCount')) {
                                            xml = this.writeConstraintLayout(nodeY, parentY);
                                        }
                                        else {
                                            if (nodeY.children.length === 1) {
                                                const targeted = nodeY.children.filter(node => {
                                                    const element = document.getElementById(node.dataset.target);
                                                    return (element != null && hasValue(element.dataset.ext) && element !== parentY.element);
                                                });
                                                if ((SETTINGS.collapseUnattributedElements &&
                                                    !nodeY.documentRoot &&
                                                    !hasValue(nodeY.element.id) &&
                                                    !hasValue(nodeY.dataset.ext) &&
                                                    !hasValue(nodeY.dataset.target) &&
                                                    nodeY.toInt('width') === 0 &&
                                                    nodeY.toInt('height') === 0 &&
                                                    !backgroundVisible &&
                                                    !nodeY.has('textAlign') && !nodeY.has('verticalAlign') &&
                                                    nodeY.float !== 'right' && !nodeY.autoMargin && nodeY.alignOrigin &&
                                                    !this.controllerHandler.hasAppendProcessing(nodeY.id)) ||
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
                                                    xml = this.writeFrameLayout(nodeY, parentY);
                                                }
                                            }
                                            else {
                                                const children = nodeY.children;
                                                const [linearX, linearY] = [NodeList.linearX(children), NodeList.linearY(children)];
                                                if (!parentY.flex.enabled && children.every(node => node.pageflow)) {
                                                    const float = new Set(children.map(node => node.float));
                                                    if (linearX) {
                                                        if (float.size === 1 && float.has('none') && children.every(node => node.toInt('verticalAlign') === 0)) {
                                                            if (children.some(node => ['text-top', 'text-bottom'].includes(node.css('verticalAlign')))) {
                                                                xml = this.writeConstraintLayout(nodeY, parentY);
                                                                nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                            }
                                                            else if (this.isRelativeHorizontal(children) && children.every(node => ['baseline', 'initial', 'unset', 'top', 'middle', 'sub', 'super'].includes(node.css('verticalAlign')))) {
                                                                xml = this.writeRelativeLayout(nodeY, parentY);
                                                                nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                            }
                                                        }
                                                        if (xml === '') {
                                                            if ((float.size === 1 || !float.has('right'))) {
                                                                if (children.some(node => node.plainText && node.multiLine)) {
                                                                    xml = this.writeRelativeLayout(nodeY, parentY);
                                                                    nodeY.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP;
                                                                }
                                                                else {
                                                                    xml = this.writeLinearLayout(nodeY, parentY, true);
                                                                }
                                                            }
                                                            else if ((float.has('left') || float.has('none')) && float.has('right')) {
                                                                xml = this.writeFrameLayoutHorizontal(nodeY, parentY, nodeY.children, cleared);
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        const clearedBlock = NodeList.cleared(children);
                                                        if (linearY || (children.some(node => node.blockStatic || clearedBlock.has(node)) && !children.some(node => node.autoMargin))) {
                                                            xml = this.writeLinearLayout(nodeY, parentY, false);
                                                            if (!nodeY.documentRoot && linearY) {
                                                                nodeY.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                                            }
                                                        }
                                                    }
                                                }
                                                if (xml === '') {
                                                    if (children.every(node => node.pageflow && node.inlineElement)) {
                                                        if (this.isFrameHorizontal(children, cleared)) {
                                                            xml = this.writeFrameLayoutHorizontal(nodeY, parentY, children, cleared);
                                                        }
                                                        else {
                                                            xml = this.writeRelativeLayout(nodeY, parentY);
                                                            if (getElementsBetweenSiblings(children[0].baseElement, children[children.length - 1].baseElement).filter(element => isLineBreak(element)).length === 0) {
                                                                nodeY.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP;
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        xml = this.writeConstraintLayout(nodeY, parentY);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    xml = this.writeNode(nodeY, parentY, nodeY.controlName);
                                }
                                renderXml(nodeY, parentY, xml, current);
                            }
                        }
                        if (this.controllerHandler.supportInclude) {
                            if (includes$$1.length > 0 && optional(nodeY, 'dataset.includeEnd') === 'true') {
                                includes$$1.pop();
                            }
                        }
                    }
                }
                for (let [id, views] of partial.entries()) {
                    const content = [];
                    const [parentId, renderPosition] = id.split(':');
                    const templates = Array.from(views.values());
                    if (templates.length > 0) {
                        if (this._sorted[parentId] != null) {
                            const parsed = [];
                            this._sorted[parentId].forEach(value => {
                                const result = templates.find(view => view.indexOf(formatPlaceholder(value, '@')) !== -1);
                                if (result) {
                                    parsed.push(result);
                                }
                            });
                            if (parsed.length === templates.length) {
                                content.push(...parsed);
                            }
                        }
                        if (content.length === 0) {
                            content.push(...templates);
                        }
                        id = parentId + (renderPosition != null ? `:${renderPosition}` : '');
                        const placeholder = formatPlaceholder(id);
                        if (output.indexOf(placeholder) !== -1) {
                            output = replacePlaceholder(output, placeholder, content.join(''));
                            empty = false;
                        }
                        else {
                            this.addRenderQueue(id, templates);
                        }
                    }
                }
                if (this.controllerHandler.supportInclude) {
                    for (const [current, views] of external.entries()) {
                        const templates = Array.from(views.values());
                        if (templates.length > 0) {
                            const xml = this.controllerHandler.renderMerge(current, templates);
                            this.addInclude(current, xml);
                        }
                    }
                }
            }
            const root = this.cache.parent;
            if (root.renderExtension.length === 0 || !root.isSet('dataset', 'target')) {
                const pathname = trimString(optional(root, 'dataset.folder').trim(), '/');
                this.updateLayout((!empty ? output : ''), pathname, (root.renderExtension.length > 0 && root.renderExtension.some(item => item.documentRoot)));
            }
            else {
                this._views.pop();
            }
            if (!empty) {
                for (const ext of this.extensions) {
                    ext.setTarget(root);
                    ext.afterRender();
                }
            }
            else if (root.renderExtension.length === 0) {
                root.hide();
            }
            this.cache.list.sort((a, b) => {
                if (!a.visible) {
                    return 1;
                }
                else if (!b.visible) {
                    return -1;
                }
                else if (a.renderDepth === 0 && b.renderDepth === 0) {
                    return (a.id < b.id ? -1 : 1);
                }
                else if (a.renderDepth !== b.renderDepth) {
                    return (a.renderDepth < b.renderDepth ? -1 : 1);
                }
                else if (a.documentParent.renderIndex !== b.documentParent.renderIndex) {
                    return (a.documentParent.renderIndex < b.documentParent.renderIndex ? -1 : 1);
                }
                else {
                    return (a.renderIndex < b.renderIndex ? -1 : 1);
                }
            });
            this.cacheSession.list.push(...this.cache.list);
        }
        writeFrameLayout(node, parent, children = false) {
            if (node.children.length === 0 && !children) {
                return this.controllerHandler.renderNode(node, parent, NODE_STANDARD.FRAME);
            }
            else {
                return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.FRAME);
            }
        }
        writeLinearLayout(node, parent, horizontal) {
            return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.LINEAR, { horizontal });
        }
        writeGridLayout(node, parent, columns, rows = 0) {
            return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.GRID, { columns, rows });
        }
        writeRelativeLayout(node, parent) {
            return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.RELATIVE);
        }
        writeConstraintLayout(node, parent) {
            return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.CONSTRAINT);
        }
        writeNode(node, parent, nodeName) {
            return this.controllerHandler.renderNode(node, parent, nodeName);
        }
        writeFrameLayoutHorizontal(group, parent, nodes, cleared) {
            let xml = '';
            const [floated, pageflow] = new NodeList(nodes).partition(node => node.floating);
            const inline = pageflow.filter(node => !node.autoMargin);
            const center = pageflow.filter(node => node.centerMarginHorizontal);
            const [right, left] = new NodeList(floated.list).partition(node => node.float === 'right');
            const [inlineRight, inlineLeft] = inline.partition(node => cleared.has(node) && node.css('clear') === 'right');
            right.list.push(...pageflow.list.filter(node => node.autoLeftMargin));
            left.list.push(...pageflow.list.filter(node => node.autoRightMargin));
            let layers;
            if (inline.length === nodes.length) {
                if (this.isRelativeHorizontal(inline.list)) {
                    xml = this.writeRelativeLayout(group, parent);
                    group.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                    return xml;
                }
                else {
                    xml = this.writeLinearLayout(group, parent, true);
                    return xml;
                }
            }
            else if (right.length === nodes.length) {
                xml = this.writeLinearLayout(group, parent, true);
                group.alignmentType |= NODE_ALIGNMENT.FLOAT | NODE_ALIGNMENT.RIGHT;
                return xml;
            }
            else if (center.length === 0 && right.length === 0) {
                const subleft = [...left.list, ...inline.list];
                if (NodeList.linearY(subleft) && subleft.some(node => cleared.has(node))) {
                    xml = this.writeLinearLayout(group, parent, false);
                    group.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                    return xml;
                }
                else {
                    if (!inline.list[inline.list.length - 1].blockStatic && this.isRelativeHorizontal(subleft)) {
                        xml = this.writeRelativeLayout(group, parent);
                        group.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                        return xml;
                    }
                    else {
                        xml = this.writeLinearLayout(group, parent, true);
                        layers = [left, inline];
                    }
                    if (left.length > 0) {
                        group.alignmentType |= NODE_ALIGNMENT.FLOAT | NODE_ALIGNMENT.LEFT;
                    }
                }
            }
            else {
                xml = this.writeFrameLayout(group, parent, true);
                let subleft;
                let subright;
                if (left.length === 0) {
                    subleft = inlineLeft;
                }
                else if (inlineLeft.length === 0) {
                    subleft = left;
                }
                else if (left.length > 0 && inlineLeft.length > 0) {
                    const leftIndex = (left.length > 0 ? Math.min.apply(null, left.list.map(item => item.siblingIndex)) : Number.MAX_VALUE);
                    const inlineIndex = (inlineLeft.length > 0 ? Math.min.apply(null, inlineLeft.list.map(item => (item.blockStatic ? item.siblingIndex : Number.MAX_VALUE))) : Number.MAX_VALUE);
                    if (inlineIndex < leftIndex) {
                        subleft = [inlineLeft, left];
                    }
                    else {
                        subleft = [left, inlineLeft];
                    }
                }
                if (right.length === 0) {
                    subright = inlineRight;
                }
                else if (inlineRight.length === 0) {
                    subright = right;
                }
                else if (right.length > 0 && inlineRight.length > 0) {
                    const rightIndex = Math.min.apply(null, right.list.map(item => item.siblingIndex));
                    const inlineIndex = Math.min.apply(null, inlineRight.list.map(item => (item.blockStatic ? item.siblingIndex : Number.MAX_VALUE)));
                    if (inlineIndex < rightIndex) {
                        subright = [inlineRight, right];
                    }
                    else {
                        subright = [right, inlineRight];
                    }
                }
                layers = [subleft, null, center, subright];
                group.alignmentType |= NODE_ALIGNMENT.FLOAT | NODE_ALIGNMENT.LEFT | NODE_ALIGNMENT.RIGHT;
            }
            function setAlignment(subgroup, index) {
                switch (index) {
                    case 0:
                    case 1:
                        subgroup.alignmentType |= NODE_ALIGNMENT.LEFT;
                        break;
                    case 3:
                        subgroup.alignmentType |= NODE_ALIGNMENT.RIGHT;
                        break;
                }
            }
            let floatgroup = null;
            layers.forEach((item, index) => {
                if (item != null) {
                    if (Array.isArray(item)) {
                        const layer = [...item[0], ...item[1]];
                        floatgroup = this.controllerHandler.createGroup(group, layer[0], layer);
                        xml = replacePlaceholder(xml, group.id, this.writeLinearLayout(floatgroup, group, !layer.some((node, subindex) => (subindex === 0 && !node.floating) || cleared.has(node))));
                        floatgroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                        if (item[0] === left || item[1] === left) {
                            floatgroup.alignmentType |= NODE_ALIGNMENT.LEFT;
                        }
                        if (item[0] === right || item[1] === right) {
                            floatgroup.alignmentType |= NODE_ALIGNMENT.RIGHT;
                        }
                    }
                    (Array.isArray(item) ? item : [item]).forEach(section => {
                        let basegroup = group;
                        if (floatgroup != null && (section === left || section === inlineLeft || section === right || section === inlineRight)) {
                            basegroup = floatgroup;
                        }
                        if (section.length > 1) {
                            let content = '';
                            const subgroup = this.controllerHandler.createGroup(basegroup, section.list[0], section.list);
                            if (index <= 1 && this.isRelativeHorizontal(section.list)) {
                                content = this.writeRelativeLayout(subgroup, basegroup);
                                subgroup.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                            }
                            else {
                                content = this.writeLinearLayout(subgroup, basegroup, true);
                                if (index === 3 && subgroup.children.some(node => node.marginLeft < 0)) {
                                    const children = this.sortByAlignment(subgroup.children.slice(), subgroup, NODE_ALIGNMENT.HORIZONTAL);
                                    const sorted = [];
                                    let marginRight = 0;
                                    children.reverse().forEach((node) => {
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
                            if (index === 0 || index === 3) {
                                subgroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                            }
                            subgroup.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                            setAlignment(subgroup, index);
                            xml = replacePlaceholder(xml, basegroup.id, content);
                            basegroup.renderAppend(subgroup);
                        }
                        else if (section.length > 0) {
                            const single = section.list[0];
                            single.alignmentType |= NODE_ALIGNMENT.SINGLE;
                            setAlignment(single, index);
                            single.renderPosition = index;
                            xml = replacePlaceholder(xml, basegroup.id, `{:${basegroup.id}:${index}}`);
                            basegroup.renderAppend(single);
                        }
                    });
                }
            });
            return xml;
        }
        writeFrameLayoutVertical(group, parent, nodes, cleared) {
            let xml = this.writeLinearLayout(group, parent, false);
            if (group.blockStatic) {
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
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (i > 0 && cleared.has(node)) {
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
                        const basegroup = this.controllerHandler.createGroup(group, baseNode, []);
                        const children = [];
                        let subgroup = null;
                        if (floating.length > 1) {
                            subgroup = this.controllerHandler.createGroup(basegroup, floating[0], floating);
                            basegroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                        }
                        else if (floating.length > 0) {
                            subgroup = floating[0];
                            subgroup.parent = basegroup;
                            basegroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                        }
                        if (subgroup != null) {
                            children.push(subgroup);
                            if (i === 0 && leadingMargin > 0) {
                                subgroup.modifyBox(BOX_STANDARD.MARGIN_TOP, leadingMargin);
                            }
                            subgroup = null;
                        }
                        if (pageflow.length > 1) {
                            subgroup = this.controllerHandler.createGroup(basegroup, pageflow[0], pageflow);
                        }
                        else if (pageflow.length > 0) {
                            subgroup = pageflow[0];
                            subgroup.parent = basegroup;
                        }
                        if (subgroup != null) {
                            children.push(subgroup);
                        }
                        if (group.blockStatic) {
                            basegroup.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                        }
                        basegroup.init();
                        content += this.writeFrameLayout(basegroup, group, true);
                        children.forEach((node, index) => {
                            if (nodes.includes(node)) {
                                content = replacePlaceholder(content, basegroup.id, `{:${basegroup.id}:${index}}`);
                            }
                            else {
                                content = replacePlaceholder(content, basegroup.id, this.writeLinearLayout(node, basegroup, false));
                                node.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                                if (group.blockStatic) {
                                    node.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                }
                            }
                        });
                    }
                }
                xml = replacePlaceholder(xml, group.id, content);
            }
            return xml;
        }
        appendRenderQueue() {
            for (const node of this.cacheSession) {
                for (const ext of node.renderExtension) {
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
                    const target = this.cacheSession.locate('id', parseInt(replaceId));
                    if (target) {
                        const depth = target.renderDepth + 1;
                        output = replaceIndent(output, depth);
                        const pattern = /{@([0-9]+)}/g;
                        let match = null;
                        let i = 0;
                        while ((match = pattern.exec(output)) != null) {
                            const node = this.cacheSession.locate('id', parseInt(match[1]));
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
            for (const value of this.everyLayout) {
                for (const id in template) {
                    value.content = value.content.replace(formatPlaceholder(id), template[id]);
                }
                value.content = this.controllerHandler.appendRenderQueue(value.content);
            }
            for (const node of this.cacheSession) {
                for (const ext of node.renderExtension) {
                    ext.setTarget(node);
                    ext.afterInsert();
                }
            }
        }
        getEmptySpacer(nodeType, depth, width, height, columnSpan) {
            return this.controllerHandler.getEmptySpacer(nodeType, depth, width, height, columnSpan);
        }
        createLayout(filename) {
            this._currentIndex = this._views.length;
            this._views.push({
                filename,
                pathname: '',
                content: ''
            });
        }
        updateLayout(content, pathname = '', documentRoot = false) {
            pathname = pathname || this.controllerHandler.settings.folderLayout;
            if (documentRoot && this._views.length > 0 && this._views[0].content === '') {
                const current = this._views.pop();
                Object.assign(this._views[0], {
                    pathname,
                    filename: current.filename,
                    content
                });
                this._currentIndex = 0;
            }
            else {
                this.currentLayout.pathname = pathname;
                this.currentLayout.content = content;
            }
        }
        addInclude(filename, content) {
            this._includes.push({
                pathname: this.controllerHandler.settings.folderLayout,
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
        sortByAlignment(children, parent, alignmentType = NODE_ALIGNMENT.NONE, preserve = false) {
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
                            return (a.float === 'left' ? -1 : 1);
                        }
                        else if (!a.floating && b.floating) {
                            return (b.float === 'left' ? 1 : -1);
                        }
                        else if (a.floating && b.floating) {
                            if (a.float !== b.float) {
                                return (a.float === 'left' ? -1 : 1);
                            }
                        }
                        return (a.linear.left <= b.linear.left ? -1 : 1);
                    });
                    sorted = true;
                }
            }
            if (hasBit(alignmentType, NODE_ALIGNMENT.ABSOLUTE)) {
                if (children.some(node => node.toInt('zIndex') !== 0)) {
                    children.sort((a, b) => {
                        const indexA = a.css('zIndex');
                        const indexB = b.css('zIndex');
                        if ((indexA === 'auto' || indexA === '' || indexA === '0') && (indexB === 'auto' || indexB === '' || indexB === '0')) {
                            return (a.siblingIndex <= b.siblingIndex ? -1 : 1);
                        }
                        else {
                            return (convertInt(indexA) <= convertInt(indexB) ? -1 : 1);
                        }
                    });
                    sorted = true;
                }
            }
            if (parent && preserve && sorted) {
                this.saveSortOrder(parent.id, children);
            }
            return children;
        }
        saveSortOrder(id, nodes) {
            this._sorted[id.toString()] = nodes.map(node => node.id);
        }
        getExtension(name) {
            return this.extensions.find(item => item.name === name);
        }
        addXmlNs(name, uri) {
            this.controllerHandler.addXmlNs(name, uri);
        }
        toString() {
            return (this._views.length > 0 ? this._views[0].content : '');
        }
        insertNode(element, parent) {
            let node = null;
            if (element.nodeName.charAt(0) === '#') {
                if (element.nodeName === '#text') {
                    if (isPlainText(element, true) || cssParent(element, 'whiteSpace', 'pre', 'pre-wrap')) {
                        node = new this._Node(this.cache.nextId, SETTINGS.targetAPI, element);
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
            else if (element instanceof HTMLElement) {
                switch (element.tagName) {
                    case 'OPTION':
                    case 'MAP':
                    case 'AREA':
                        return null;
                }
                const elementNode = new this._Node(this.cache.nextId, SETTINGS.targetAPI, element);
                if (isElementVisible(element)) {
                    node = elementNode;
                    node.setExclusions();
                    node.setOverflow();
                }
                else {
                    elementNode.excluded = true;
                    elementNode.visible = false;
                }
            }
            if (node != null) {
                this.cache.append(node);
            }
            return node;
        }
        prioritizeExtOrder(available, element) {
            let extensions = [];
            let current = element;
            while (current != null) {
                extensions = [...extensions, ...optional(current, 'dataset.ext').split(',').map(value => value.trim())];
                current = current.parentElement;
            }
            extensions = extensions.filter(value => value);
            if (extensions.length > 0) {
                const tagged = [];
                const untagged = [];
                for (const item of available) {
                    const index = extensions.indexOf(item.name);
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
                return available;
            }
        }
        isFrameHorizontal(nodes, cleared) {
            return nodes.some(node => node.floating) && !nodes.every((node, index) => nodes[0].float === node.float && (index === 0 || !cleared.has(node)));
        }
        isRelativeHorizontal(nodes) {
            return nodes.some(node => node.plainText && node.multiLine) || (nodes.some(node => node.imageElement) && nodes.some(node => node.textElement)) || nodes.every(node => node.textElement && !node.floating && node.alignOrigin && node.toInt('verticalAlign') >= 0);
        }
        set appName(value) {
            if (this.resourceHandler != null) {
                this.resourceHandler.file.appName = value;
            }
        }
        get appName() {
            return (this.resourceHandler != null ? this.resourceHandler.file.appName : '');
        }
        set currentLayout(value) {
            this._views[this._currentIndex] = value;
        }
        get currentLayout() {
            return this._views[this._currentIndex];
        }
        get everyLayout() {
            return [...this._views, ...this._includes];
        }
        get viewData() {
            return { cache: this.cacheSession, views: this._views, includes: this._includes };
        }
        get size() {
            return this._views.length + this._includes.length;
        }
    }

    class Extension {
        constructor(name, tagNames, options) {
            this.name = name;
            this.options = {};
            this.tagNames = [];
            this.dependencies = [];
            this.documentRoot = false;
            if (Array.isArray(tagNames)) {
                this.tagNames = tagNames.map(value => value.trim().toUpperCase());
            }
            if (options != null) {
                Object.assign(this.options, options);
            }
        }
        setTarget(node, parent, element) {
            this.node = node;
            this.parent = parent;
            this.element = element || this.node.element;
        }
        is(node) {
            return (node.hasElement && (this.tagNames.length === 0 || this.tagNames.includes(node.tagName)));
        }
        require(value, init = false) {
            this.dependencies.push({ name: value, init });
        }
        included(element) {
            if (element == null) {
                element = this.element;
            }
            return includes(optional(element, 'dataset.ext'), this.name);
        }
        beforeInit(internal = false) {
            if (!internal && this.included()) {
                this.dependencies.filter(item => item.init).forEach(item => {
                    const ext = this.application.getExtension(item.name);
                    if (ext != null) {
                        ext.setTarget(this.node, this.parent, this.element);
                        ext.beforeInit(true);
                    }
                });
            }
        }
        init(element) {
            return false;
        }
        afterInit(internal = false) {
            if (!internal && this.included()) {
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
            if (node && node.hasElement) {
                const ext = optional(node.element, 'dataset.ext');
                if (ext === '') {
                    return (this.tagNames.length > 0);
                }
                else {
                    return this.included();
                }
            }
            return false;
        }
        processNode(mapX, mapY) {
            return { xml: '', complete: false };
        }
        processChild(mapX, mapY) {
            return { xml: '', complete: false };
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
            if (this.element instanceof HTMLElement) {
                const prefix = convertCamelCase(this.name, '\\.');
                for (const attr in this.element.dataset) {
                    if (attr.length > prefix.length && attr.startsWith(prefix)) {
                        result[capitalize(attr.substring(prefix.length), false)] = this.element.dataset[attr];
                    }
                }
            }
            return result;
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
    for (const i in X11_CSS3) {
        const x11 = X11_CSS3[i];
        for (const j in x11) {
            const rgb = convertHextoRGB(x11[j]);
            if (rgb) {
                x11.rgb = rgb;
                x11.hsl = convertRGBtoHSL(x11.rgb.r, x11.rgb.g, x11.rgb.b);
            }
            HSL_SORTED.push({ name: i, rgb: x11.rgb, hex: x11.hex, hsl: x11.hsl });
        }
    }
    HSL_SORTED.sort(sortHSL);
    function convertHextoHSL(value) {
        const rgb = convertHextoRGB(value);
        if (rgb) {
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
        if (a.hsl != null && b.hsl != null) {
            let [c, d] = [a.hsl.h, b.hsl.h];
            if (c === d) {
                [c, d] = [a.hsl.s, b.hsl.s];
                if (c === d) {
                    [c, d] = [a.hsl.l, b.hsl.l];
                }
            }
            return (c >= d ? 1 : -1);
        }
        return 0;
    }
    function getColorNearest(value) {
        const result = HSL_SORTED.slice();
        let index = result.findIndex(item => item.hex === value);
        if (index !== -1) {
            return result[index];
        }
        else {
            const hsl = convertHextoHSL(value);
            if (hsl) {
                result.push({ name: '', hsl, rgb: { r: -1, g: -1, b: -1 }, hex: '' });
                result.sort(sortHSL);
                index = result.findIndex(item => item.name === '');
                return result[Math.min(index + 1, result.length - 1)];
            }
            return '';
        }
    }
    function getByColorName(value) {
        for (const color in X11_CSS3) {
            if (color.toLowerCase() === value.trim().toLowerCase()) {
                return X11_CSS3[color];
            }
        }
        return '';
    }
    function convertRGB({ rgb }) {
        return (rgb != null ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '');
    }
    function parseRGBA(value, opacity = '1') {
        if (value !== '') {
            const color = getByColorName(value);
            if (color !== '') {
                return [color.hex, convertRGB(color), '1'];
            }
            const match = value.match(/rgb(?:a)?\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})(?:, ([0-9\.]{1,3}))?\)/);
            if (match && match.length >= 4 && match[4] !== '0') {
                if (match[4] == null) {
                    match[4] = opacity;
                }
                return [`#${convertRGBtoHex(match[1])}${convertRGBtoHex(match[2])}${convertRGBtoHex(match[3])}`, match[0], (parseFloat(match[4]) < 1 ? parseFloat(match[4]).toFixed(2) : '1')];
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
                return (value.length === 4 ? parseRGBA(convertRGB({ rgb: convertHextoRGB(value) }))[0] : value);
            }
        }
        return '';
    }

    const EXT_NAME = {
        EXTERNAL: 'androme.external',
        CUSTOM: 'androme.custom',
        GRID: 'androme.grid',
        LIST: 'androme.list',
        TABLE: 'androme.table'
    };

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
        prependBefore(id, xml, index = -1) {
            if (this._before[id] == null) {
                this._before[id] = [];
            }
            if (index !== -1 && index < this._before[id].length) {
                this._before[id].splice(index, 0, xml);
            }
            else {
                this._before[id].push(xml);
            }
        }
        appendAfter(id, xml, index = -1) {
            if (this._after[id] == null) {
                this._after[id] = [];
            }
            if (index !== -1 && index < this._after[id].length) {
                this._after[id].splice(index, 0, xml);
            }
            else {
                this._after[id].push(xml);
            }
        }
        hasAppendProcessing(id) {
            return (this._before[id] != null || this._after[id] != null);
        }
        getEnclosingTag(depth, controlName, id, xml = '', preXml = '', postXml = '') {
            const indent = repeat(Math.max(0, depth));
            let output = preXml +
                `{<${id}}`;
            if (xml !== '') {
                output += indent + `<${controlName}${(depth === 0 ? '{#0}' : '')}{@${id}}>\n` +
                    xml +
                    indent + `</${controlName}>\n`;
            }
            else {
                output += indent + `<${controlName}${(depth === 0 ? '{#0}' : '')}{@${id}} />\n`;
            }
            output += `{>${id}}` +
                postXml;
            return output;
        }
    }

    class Resource {
        constructor(file) {
            this.file = file;
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
        addFile(pathname, filename, content = '', uri = '') {
            this.file.addFile(pathname, filename, content, uri);
        }
        reset() {
            Resource.STORED.STRINGS = new Map();
            Resource.STORED.ARRAYS = new Map();
            Resource.STORED.FONTS = new Map();
            Resource.STORED.STYLES = new Map();
            Resource.STORED.DRAWABLES = new Map();
            Resource.STORED.COLORS = new Map();
            Resource.STORED.DIMENS = new Map();
            Resource.STORED.IMAGES = new Map();
            this.file.reset();
        }
        setBoxSpacing() {
            this.cache.elements.each(node => {
                if (!node.hasBit('excludeResource', NODE_RESOURCE.BOX_SPACING) && (getElementCache(node.element, 'boxSpacing') == null || SETTINGS.alwaysReevaluateResources)) {
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
            this.cache.elements.each(node => {
                if (!node.hasBit('excludeResource', NODE_RESOURCE.BOX_STYLE) && (getElementCache(node.element, 'boxStyle') == null || SETTINGS.alwaysReevaluateResources)) {
                    const result = {
                        borderTop: this.parseBorderStyle,
                        borderRight: this.parseBorderStyle,
                        borderBottom: this.parseBorderStyle,
                        borderLeft: this.parseBorderStyle,
                        borderRadius: this.parseBorderRadius,
                        backgroundColor: this.parseBackgroundColor,
                        backgroundImage: !node.hasBit('excludeResource', NODE_RESOURCE.IMAGE_SOURCE),
                        backgroundSize: this.parseBoxDimensions,
                        backgroundRepeat: true,
                        backgroundPosition: true
                    };
                    for (const i in result) {
                        const value = node.css(i);
                        if (typeof result[i] === 'function') {
                            result[i] = result[i](value, node, i);
                        }
                        else if (result[i] === true) {
                            result[i] = value;
                        }
                        else {
                            result[i] = '';
                        }
                    }
                    if (result.backgroundColor.length > 0 && !node.has('backgroundColor') && (node.cssParent('backgroundColor', false, true) === result.backgroundColor[1] || (node.documentParent.visible && cssFromParent(node.element, 'backgroundColor')))) {
                        result.backgroundColor.length = 0;
                    }
                    if (result.borderTop.style !== 'none') {
                        const borderTop = JSON.stringify(result.borderTop);
                        if (borderTop === JSON.stringify(result.borderRight) && borderTop === JSON.stringify(result.borderBottom) && borderTop === JSON.stringify(result.borderLeft)) {
                            result.border = result.borderTop;
                        }
                    }
                    setElementCache(node.element, 'boxStyle', result);
                }
            });
        }
        setFontStyle() {
            this.cache.each(node => {
                if (!node.hasBit('excludeResource', NODE_RESOURCE.FONT_STYLE) && (getElementCache(node.element, 'fontStyle') == null || SETTINGS.alwaysReevaluateResources)) {
                    const backgroundImage = this.hasDrawableBackground(getElementCache(node.element, 'boxStyle'));
                    if (node.renderChildren.length > 0 ||
                        node.imageElement ||
                        node.tagName === 'HR' ||
                        (node.inlineText && !backgroundImage && node.element.innerHTML.trim() === '' && !['pre', 'pre-wrap'].includes(node.css('whiteSpace')))) {
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
                        let fontWeight = node.css('fontWeight');
                        let fontSize = node.css('fontSize');
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
                            fontFamily: node.css('fontFamily'),
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
        setOptionArray() {
            this.cache.filter(node => node.visible && node.tagName === 'SELECT' && !node.hasBit('excludeResource', NODE_RESOURCE.OPTION_ARRAY)).each(node => {
                const element = node.element;
                if (getElementCache(element, 'optionArray') == null || SETTINGS.alwaysReevaluateResources) {
                    const stringArray = [];
                    let numberArray = [];
                    for (let i = 0; i < element.children.length; i++) {
                        const item = element.children[i];
                        const value = item.text.trim();
                        if (value !== '') {
                            if (!SETTINGS.numberResourceValue && numberArray != null && stringArray.length === 0 && isNumber(value)) {
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
                    setElementCache(element, 'optionArray', { stringArray: (stringArray.length > 0 ? stringArray : null), numberArray: (numberArray && numberArray.length > 0 ? numberArray : null) });
                }
            });
        }
        setValueString() {
            function parseWhiteSpace(node, value) {
                if (node.multiLine) {
                    value = value.replace(/^\s*\n/, '');
                }
                switch (node.css('whiteSpace')) {
                    case 'nowrap':
                        value = value.replace(/\n/g, ' ');
                        break;
                    case 'pre':
                    case 'pre-wrap':
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
            this.cache.filter(node => node.visible && !node.hasBit('excludeResource', NODE_RESOURCE.VALUE_STRING)).each(node => {
                const element = node.element;
                if (getElementCache(element, 'valueString') == null || SETTINGS.alwaysReevaluateResources) {
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
                                if (node.companion != null) {
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
                        else if (element.innerText.trim() === '' && this.hasDrawableBackground(getElementCache(element, 'boxStyle'))) {
                            value = replaceEntity(element.innerText);
                            performTrim = false;
                        }
                    }
                    else if (node.plainText) {
                        name = node.textContent.trim();
                        value = replaceEntity(node.textContent);
                        value = value.replace(/&[A-Za-z]+;/g, (match => match.replace('&', '&amp;')));
                        [value, inlineTrim] = parseWhiteSpace(node, value);
                    }
                    if (value !== '') {
                        if (performTrim) {
                            const previousSibling = node.previousSibling();
                            const nextSibling = node.nextSibling();
                            let previousSpaceEnd = false;
                            if (previousSibling == null || previousSibling.multiLine || previousSibling.lineBreak) {
                                value = value.replace(/^\s+/, '');
                            }
                            else {
                                previousSpaceEnd = /\s+$/.test((previousSibling.element.innerText || previousSibling.element.textContent));
                            }
                            if (inlineTrim) {
                                const original = value;
                                value = value.trim();
                                if (previousSibling && !previousSibling.block && !previousSibling.lineBreak && !previousSpaceEnd && /^\s+/.test(original)) {
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
                                        (node.multiLine && (hasLineBreak(element) ||
                                            node.renderParent.renderParent.linearHorizontal))) ? '' : '&#160;'));
                                    value = value.replace(/\s+$/, (nextSibling == null || nextSibling.lineBreak ? '' : '&#160;'));
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
        borderVisible(border) {
            return (border && !(border.style === 'none' || border.width === '0px'));
        }
        hasDrawableBackground(object) {
            return (object && (this.borderVisible(object.borderTop) ||
                this.borderVisible(object.borderRight) ||
                this.borderVisible(object.borderBottom) ||
                this.borderVisible(object.borderLeft) ||
                (object.backgroundImage !== '' && object.backgroundImage !== 'none') ||
                object.borderRadius.length > 0));
        }
        getBorderStyle(border) {
            const result = { solid: `android:color="@color/${border.color}"` };
            Object.assign(result, {
                inset: result.solid,
                dotted: `${result.solid} android:dashWidth="3px" android:dashGap="1px"`,
                dashed: `${result.solid} android:dashWidth="1px" android:dashGap="1px"`
            });
            return result[border.style] || result.solid;
        }
        parseBorderStyle(value, node, attr) {
            let colorMap = node.css(`${attr}Color`);
            if (colorMap === 'initial') {
                colorMap = value;
            }
            const style = node.css(`${attr}Style`) || 'none';
            let width = node.css(`${attr}Width`) || '1px';
            const color = (style !== 'none' ? parseRGBA(colorMap, node.css('opacity')) : []);
            if (style === 'inset' && width === '0px') {
                width = '1px';
            }
            return { style, width, color: (color.length > 0 ? color : ['#000000', 'rgb(0, 0, 0)', '0']) };
        }
        parseBorderRadius(value, node) {
            const [top, right, bottom, left] = [
                node.css('borderTopLeftRadius'),
                node.css('borderTopRightRadius'),
                node.css('borderBottomLeftRadius'),
                node.css('borderBottomRightRadius')
            ];
            if (top === right && right === bottom && bottom === left) {
                return (top === '' || top === '0px' ? [] : [top]);
            }
            else {
                return [top, right, bottom, left];
            }
        }
        parseBackgroundColor(value, node) {
            return parseRGBA(value, node.css('opacity'));
        }
        parseBoxDimensions(value, node) {
            const fontSize = node.css('fontSize');
            if (value !== 'auto' && value !== 'initial') {
                const match = value.match(/^([0-9\.]+(?:px|pt|em|%)|auto)(?: ([0-9\.]+(?:px|pt|em|%)|auto))?(?: ([0-9\.]+(?:px|pt|em)))?(?: ([0-9\.]+(?:px|pt|em)))?$/);
                if (match) {
                    if ((match[1] === '0px' && match[2] == null) || (match[1] === 'auto' && match[2] === 'auto')) {
                        return [];
                    }
                    if (match[1] === 'auto' || match[2] === 'auto') {
                        return [(match[1] === 'auto' ? '' : convertPX(match[1], fontSize)), (match[2] === 'auto' ? '' : convertPX(match[2], fontSize))];
                    }
                    else if (isPercent(match[1]) && match[3] == null) {
                        return [match[1], match[2]];
                    }
                    else if (match[2] == null || (match[1] === match[2] && match[1] === match[3] && match[1] === match[4])) {
                        return [convertPX(match[1], fontSize)];
                    }
                    else if (match[3] == null || (match[1] === match[3] && match[2] === match[4])) {
                        return [convertPX(match[1], fontSize), convertPX(match[2], fontSize)];
                    }
                    else {
                        return [convertPX(match[1], fontSize), convertPX(match[2], fontSize), convertPX(match[3], fontSize), convertPX(match[4], fontSize)];
                    }
                }
            }
            return [];
        }
    }
    Resource.STORED = {
        STRINGS: new Map(),
        ARRAYS: new Map(),
        FONTS: new Map(),
        COLORS: new Map(),
        STYLES: new Map(),
        DIMENS: new Map(),
        DRAWABLES: new Map(),
        IMAGES: new Map()
    };

    class Node {
        constructor(id, element) {
            this.id = id;
            this.styleMap = {};
            this.originalStyleMap = {};
            this.nodeType = 0;
            this.alignmentType = NODE_ALIGNMENT.NONE;
            this.depth = -1;
            this.siblingIndex = Number.MAX_VALUE;
            this.renderIndex = Number.MAX_VALUE;
            this.renderPosition = -1;
            this.excludeProcedure = NODE_PROCEDURE.NONE;
            this.excludeResource = NODE_RESOURCE.NONE;
            this.renderExtension = [];
            this.renderExtensionChild = [];
            this.documentRoot = false;
            this.auto = true;
            this.visible = true;
            this.excluded = false;
            this.rendered = false;
            this._boxAdjustment = {
                marginTop: 0,
                marginRight: 0,
                marginBottom: 0,
                marginLeft: 0,
                paddingTop: 0,
                paddingRight: 0,
                paddingBottom: 0,
                paddingLeft: 0
            };
            this._boxReset = {
                marginTop: 0,
                marginRight: 0,
                marginBottom: 0,
                marginLeft: 0,
                paddingTop: 0,
                paddingRight: 0,
                paddingBottom: 0,
                paddingLeft: 0
            };
            this._data = {};
            this._initialized = false;
            if (element != null) {
                this._element = element;
                this.init();
            }
        }
        init() {
            if (!this._initialized) {
                const element = this._element;
                if (element instanceof HTMLElement) {
                    const styleMap = getElementCache(element, 'styleMap') || {};
                    for (const inline of Array.from(element.style)) {
                        styleMap[convertCamelCase(inline)] = element.style[inline];
                    }
                    this.style = getElementCache(element, 'style') || getComputedStyle(element);
                    this.styleMap = Object.assign({}, styleMap);
                    this.originalStyleMap = Object.assign({}, styleMap);
                }
                if (this.id !== 0) {
                    setElementCache(element, 'node', this);
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
                    if (this.hasBit('alignmentType', value)) {
                        return true;
                    }
                }
            }
            return false;
        }
        attr(obj, attr, value = '', overwrite = true) {
            const name = `_${obj || '_'}`;
            if (hasValue(value)) {
                if (!isString(value)) {
                    value = value.toString();
                }
                if (this[name] == null) {
                    this._namespaces.add(obj);
                    this[name] = {};
                }
                if (!overwrite && this[name][attr] != null) {
                    return '';
                }
                this[name][attr] = value;
            }
            return this[name][attr] || '';
        }
        get(obj) {
            const name = `_${obj || '_'}`;
            return (this[name] != null ? this[name] : {});
        }
        delete(obj, ...attrs) {
            const name = `_${obj || '_'}`;
            if (this[name] != null) {
                for (const attr of attrs) {
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
            if (parent) {
                this.renderParent = parent;
                this.renderDepth = (parent === this || this.documentRoot || parent.isSet('dataset', 'target') ? 0 : parent.renderDepth + 1);
                this.rendered = true;
            }
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
            return (this._data[obj] != null ? this._data[obj][attr] : null);
        }
        ascend(element = false) {
            const result = [];
            const attr = (element ? 'documentParent' : 'parent');
            let current = this[attr];
            while (current != null && current.id !== 0) {
                result.push(current);
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
            for (const type of props) {
                switch (type) {
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
                            this.originalStyleMap[attr] = node.cssOriginal(attr);
                        });
                        if (node.css('marginLeft') === 'auto') {
                            this.styleMap.marginLeft = 'auto';
                            this.originalStyleMap.marginLeft = 'auto';
                        }
                        if (node.css('marginRight') === 'auto') {
                            this.styleMap.marginRight = 'auto';
                            this.originalStyleMap.marginRight = 'auto';
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
                    case 'originalStyleMap':
                        for (const attr in node[type]) {
                            if (this[type][attr] == null) {
                                const value = node[type][attr];
                                this[type][attr] = value;
                            }
                        }
                        break;
                }
            }
        }
        alignedVertical(previous, cleared, firstNode = false) {
            if (this.documentParent === previous.documentParent) {
                const next = this.nextSibling();
                const inlineStatic = (!this.inlineElement && !this.floating);
                return (this.lineBreak ||
                    previous.lineBreak ||
                    cleared.has(this) ||
                    (cleared.has(previous) && previous.floating && this.blockStatic) ||
                    (previous.blockStatic && (this.blockStatic || inlineStatic || next == null || next.lineBreak || next.alignedVertical(this, cleared))) ||
                    (previous.plainText && previous.multiLine && !this.parent.is(NODE_STANDARD.RELATIVE)) ||
                    ((this.blockStatic || this.autoMargin) && (!previous.inlineElement || previous.autoMargin)) ||
                    (!previous.floating && (inlineStatic || this.autoMargin || this.blockStatic)) ||
                    (!firstNode && this.floating && previous.floating && this.linear.top >= previous.linear.bottom));
            }
            return false;
        }
        intersect(rect, dimension = 'linear') {
            const top = (rect.top > this[dimension].top && rect.top < this[dimension].bottom);
            const right = (Math.floor(rect.right) > Math.ceil(this[dimension].left) && rect.right < this[dimension].right);
            const bottom = (Math.floor(rect.bottom) > Math.ceil(this[dimension].top) && rect.bottom < this[dimension].bottom);
            const left = (rect.left > this[dimension].left && rect.left < this[dimension].right);
            return (top && (left || right)) || (bottom && (left || right));
        }
        intersectX(rect, dimension = 'linear') {
            return ((rect.top >= this[dimension].top && rect.top < this[dimension].bottom) ||
                (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom) ||
                (this[dimension].top >= rect.top && this[dimension].bottom <= rect.bottom) ||
                (rect.top >= this[dimension].top && rect.bottom <= this[dimension].bottom));
        }
        intersectY(rect, dimension = 'linear') {
            return ((rect.left >= this[dimension].left && rect.left < this[dimension].right) ||
                (rect.right > this[dimension].left && rect.right <= this[dimension].right) ||
                (this[dimension].left >= rect.left && this[dimension].right <= rect.right) ||
                (rect.left >= this[dimension].left && rect.right <= this[dimension].right));
        }
        withinX(rect, dimension = 'linear') {
            return (this[dimension].top >= rect.top && this[dimension].bottom <= rect.bottom);
        }
        withinY(rect, dimension = 'linear') {
            return (this[dimension].left >= rect.left && this[dimension].right <= rect.right);
        }
        css(attr, value = '') {
            if (typeof attr === 'object') {
                Object.assign(this.styleMap, attr);
                return '';
            }
            else {
                if (arguments.length === 2) {
                    this.styleMap[attr] = (hasValue(value) ? value : '');
                }
                return this.styleMap[attr] || (this.style && this.style[attr]) || '';
            }
        }
        cssOriginal(attr, complete = false) {
            return this.originalStyleMap[attr] || (complete ? this.css(attr) : '');
        }
        cssParent(attr, startChild = false, ignoreHidden = false) {
            let result = '';
            if (this._element != null) {
                let current = (startChild ? this : getNodeFromElement(this._element.parentElement));
                while (current != null) {
                    result = current.originalStyleMap[attr] || '';
                    if (current.documentBody || result) {
                        if (ignoreHidden && !current.visible) {
                            result = '';
                        }
                        break;
                    }
                    current = getNodeFromElement(current.element.parentElement);
                }
            }
            return result;
        }
        has(attr, checkType = 0, options) {
            const value = this[(options != null && options.map === 'original' ? 'originalStyleMap' : 'styleMap')][attr];
            if (hasValue(value)) {
                switch (value) {
                    case '0px':
                    case 'none':
                    case 'left':
                        if (checkType === CSS_STANDARD.LEFT) {
                            return true;
                        }
                    case 'baseline':
                        if (checkType === CSS_STANDARD.BASELINE) {
                            return true;
                        }
                    case 'auto':
                        if (checkType === CSS_STANDARD.AUTO) {
                            return true;
                        }
                    case 'initial':
                    case 'normal':
                    case 'transparent':
                    case 'rgba(0, 0, 0, 0)':
                        return false;
                    default:
                        if (options != null) {
                            if (value === options.not) {
                                return false;
                            }
                        }
                        switch (checkType) {
                            case CSS_STANDARD.UNIT:
                                return isUnit(value);
                            case CSS_STANDARD.PERCENT:
                                return isPercent(value);
                        }
                        return true;
                }
            }
            return false;
        }
        hasBit(attr, bit) {
            if (this[attr] != null) {
                return hasBit(this[attr], bit);
            }
            return false;
        }
        toInt(attr, defaultValue = 0) {
            const value = this.styleMap[attr];
            return parseInt(value) || defaultValue;
        }
        setExclusions() {
            if (this.hasElement) {
                [['excludeProcedure', NODE_PROCEDURE], ['excludeResource', NODE_RESOURCE]].forEach((item) => {
                    let exclude = this.dataset[item[0]] || '';
                    if (this._element.parentElement != null) {
                        exclude += '|' + (this._element.parentElement.dataset[`${item[0]}Child`] || '');
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
            if (this._element != null) {
                if (!calibrate) {
                    let bounds;
                    if (this.hasElement) {
                        bounds = assignBounds(this._element.getBoundingClientRect());
                    }
                    else {
                        [bounds] = getRangeClientRect(this._element);
                    }
                    this.bounds = bounds;
                }
            }
            if (this.bounds != null) {
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
        setMinBounds() {
            if (this.hasElement && this._element !== document.body) {
                const nodes = this.children.filter(node => !node.pageflow);
                if (nodes.length > 0) {
                    const right = Math.max.apply(null, this.children.map(node => node.linear.right));
                    const bottom = Math.max.apply(null, this.children.map(node => node.linear.bottom));
                    let calibrate = false;
                    if (right > this.box.right) {
                        this.bounds.right = right + (this.paddingRight + this.borderRightWidth);
                        this.bounds.width = this.bounds.right - this.bounds.left;
                        calibrate = true;
                    }
                    if (bottom > this.box.bottom) {
                        this.bounds.bottom = bottom + (this.paddingBottom + this.borderBottomWidth);
                        this.bounds.height = this.bounds.bottom - this.bounds.top;
                        calibrate = true;
                    }
                    if (calibrate) {
                        this.setBounds(true);
                    }
                }
            }
        }
        setDimensions(bounds = ['linear', 'box']) {
            for (const dimension of bounds) {
                const dimen = this[dimension];
                if (this.multiLine || this.plainText) {
                    dimen.width = this.bounds.width;
                    if (!this.plainText) {
                        switch (dimension) {
                            case 'linear':
                                dimen.width += (this.marginLeft > 0 ? this.marginLeft : 0) + this.marginRight;
                                break;
                            case 'box':
                                dimen.width += (this.paddingLeft + this.borderLeftWidth) - (this.paddingRight + this.borderRightWidth);
                                break;
                        }
                    }
                }
                else {
                    dimen.width = dimen.right - dimen.left;
                }
                dimen.height = dimen.bottom - dimen.top;
            }
        }
        setMultiLine() {
            if (this._element != null) {
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
                        if (this.viewWidth === 0 && !this.floating && this.inlineElement && this.textElement) {
                            const [bounds, multiLine] = getRangeClientRect(this._element);
                            if (this.plainText) {
                                this.bounds = bounds;
                                this.setDimensions();
                            }
                            this.multiLine = multiLine;
                        }
                        break;
                }
            }
            else {
                this._multiLine = false;
            }
        }
        setOverflow() {
            if (this.hasElement && this.overflow == null) {
                this.overflow = 0;
                const [overflow, overflowX, overflowY] = [this.css('overflow'), this.css('overflowX'), this.css('overflowY')];
                if (this.toInt('width') > 0 && (overflow === 'scroll' ||
                    overflowX === 'scroll' ||
                    (overflowX === 'auto' && this._element.clientWidth !== this._element.scrollWidth))) {
                    this.overflow |= 2 /* HORIZONTAL */;
                }
                if (this.toInt('height') > 0 && (overflow === 'scroll' ||
                    overflowY === 'scroll' ||
                    (overflowY === 'auto' && this._element.clientHeight !== this._element.scrollHeight))) {
                    this.overflow |= 4 /* VERTICAL */;
                }
            }
            return this.overflow;
        }
        sort() {
            this.children.sort((a, b) => a.siblingIndex <= b.siblingIndex ? -1 : 1);
        }
        getParentElementAsNode(negative = false) {
            if (this._element != null) {
                let parent = getNodeFromElement(this._element.parentElement);
                if (!this.pageflow) {
                    let found = false;
                    let previous = null;
                    let relativeParent = null;
                    while (parent && parent.id !== 0) {
                        if (relativeParent == null && this.position === 'absolute') {
                            if (!['static', 'initial'].includes(parent.position)) {
                                const top = convertInt(this.top);
                                const left = convertInt(this.left);
                                if ((top >= 0 && left >= 0) ||
                                    !negative ||
                                    (negative && Math.abs(top) <= parent.marginTop && Math.abs(left) <= parent.marginLeft) ||
                                    this.imageElement) {
                                    found = true;
                                    break;
                                }
                                relativeParent = parent;
                            }
                        }
                        else {
                            if ((previous && ((this.linear.top >= parent.linear.top && this.linear.top < previous.linear.top) ||
                                (this.linear.right <= parent.linear.right && this.linear.right > previous.linear.right) ||
                                (this.linear.bottom <= parent.linear.bottom && this.linear.bottom > previous.linear.bottom) ||
                                (this.linear.left >= parent.linear.left && this.linear.left < previous.linear.left))) ||
                                (this.withinX(parent.box) && this.withinY(parent.box))) {
                                found = true;
                                break;
                            }
                        }
                        previous = parent;
                        parent = getNodeFromElement(parent.element.parentElement);
                    }
                    if (!found) {
                        parent = relativeParent;
                    }
                }
                return parent;
            }
            return null;
        }
        remove(node) {
            this.children = this.children.filter(child => child !== node);
        }
        renderAppend(node) {
            if (this.renderChildren.indexOf(node) === -1) {
                node.renderIndex = this.renderChildren.length;
                this.renderChildren.push(node);
            }
        }
        resetBox(region, node, negative = false, bounds = false) {
            const attrs = [];
            if (hasBit(region, BOX_STANDARD.MARGIN)) {
                attrs.push('marginTop', 'marginRight', 'marginBottom', 'marginLeft');
            }
            if (hasBit(region, BOX_STANDARD.PADDING)) {
                attrs.push('paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft');
            }
            for (const attr of attrs) {
                this._boxReset[attr] = 1;
                if (node != null) {
                    node.modifyBox(attr, this[attr], negative, bounds);
                }
            }
        }
        removeElement() {
            this._element = undefined;
        }
        previousSibling(lineBreak = true) {
            let element = null;
            if (this._element != null) {
                element = this._element.previousSibling;
            }
            else if (this.children.length > 0) {
                const list = this.children.slice().filter(node => node.siblingflow).sort((a, b) => a.siblingIndex <= b.siblingIndex ? -1 : 1);
                element = (list.length > 0 ? list[0].element.previousSibling : null);
            }
            while (element != null) {
                const node = getNodeFromElement(element);
                if (node && node.siblingflow && (lineBreak || !node.lineBreak)) {
                    return node;
                }
                element = element.previousSibling;
            }
            return null;
        }
        nextSibling(lineBreak = true) {
            let element = null;
            if (this._element != null) {
                element = this._element.nextSibling;
            }
            else if (this.children.length > 0) {
                const list = this.children.slice().filter(node => node.siblingflow).sort((a, b) => a.siblingIndex <= b.siblingIndex ? 1 : -1);
                element = (list.length > 0 ? list[0].element.nextSibling : null);
            }
            while (element != null) {
                const node = getNodeFromElement(element);
                if (node && node.siblingflow && (lineBreak || !node.lineBreak)) {
                    return node;
                }
                element = element.nextSibling;
            }
            return null;
        }
        isSet(obj, attr) {
            return (this[obj] && this[obj][attr] != null ? hasValue(this[obj][attr]) : false);
        }
        boxDocument(region, direction) {
            const attr = region + direction;
            if (this.hasElement) {
                const value = this.css(attr);
                if (isPercent(value)) {
                    return (this.style[attr] && this.style[attr] !== value ? convertInt(this.style[attr]) : this.documentParent.box[(direction === 'Left' || direction === 'Right' ? 'width' : 'height')] * (convertInt(value) / 100));
                }
                else {
                    return convertInt(value);
                }
            }
            else {
                return convertInt(this.css(attr));
            }
        }
        set parent(value) {
            if (value !== this._parent) {
                if (this._parent != null) {
                    this._parent.children = this._parent.children.filter(node => node !== this);
                }
                this._parent = value;
            }
            if (value != null) {
                if (!value.children.includes(this)) {
                    value.children.push(this);
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
            return this._nodeName || (this.hasElement ? (this.tagName === 'INPUT' ? this._element.type.toUpperCase() : this.tagName) : '');
        }
        set element(value) {
            this._element = value;
        }
        get element() {
            return this._element || { dataset: {}, style: {} };
        }
        get baseElement() {
            return this.element;
        }
        get tagName() {
            return this._element && (this._element.tagName || '');
        }
        get hasElement() {
            return (this._element instanceof HTMLElement);
        }
        get documentBody() {
            return (this._element === document.body);
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
                    if (this.parent != null) {
                        this._renderDepth = this.parent.renderDepth + 1;
                    }
                }
            }
            return this._renderDepth || 0;
        }
        get dataset() {
            return (this._element instanceof HTMLElement ? this._element.dataset : {});
        }
        get extension() {
            return (hasValue(this.dataset.ext) ? this.dataset.ext.split(',')[0].trim() : '');
        }
        get flex() {
            const style = this.style;
            if (style != null) {
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
            return (this.inlineStatic || isPercent(this.styleMap.width) ? 0 : this.toInt('width') || this.toInt('minWidth'));
        }
        get viewHeight() {
            return (this.inlineStatic || isPercent(this.styleMap.height) ? 0 : this.toInt('height') || this.toInt('minHeight'));
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
            return (!value || value === 'auto' ? null : convertInt(value));
        }
        get right() {
            const value = this.styleMap.right;
            return (!value || value === 'auto' ? null : convertInt(value));
        }
        get bottom() {
            const value = this.styleMap.bottom;
            return (!value || value === 'auto' ? null : convertInt(value));
        }
        get left() {
            const value = this.styleMap.left;
            return (!value || value === 'auto' ? null : convertInt(value));
        }
        get marginTop() {
            return (this.inlineStatic ? 0 : this.boxDocument('margin', 'Top'));
        }
        get marginRight() {
            return this.boxDocument('margin', 'Right');
        }
        get marginBottom() {
            return (this.inlineStatic ? 0 : this.boxDocument('margin', 'Bottom'));
        }
        get marginLeft() {
            return this.boxDocument('margin', 'Left');
        }
        get borderTopWidth() {
            const value = this.css('borderTopStyle');
            return (value !== 'none' && (value !== 'inset' || this.tagName === 'HR') ? convertInt(this.css('borderTopWidth')) : 0);
        }
        get borderRightWidth() {
            const value = this.css('borderRightStyle');
            return (value !== 'none' && (value !== 'inset' || this.tagName === 'HR') ? convertInt(this.css('borderRightWidth')) : 0);
        }
        get borderBottomWidth() {
            const value = this.css('borderBottomStyle');
            return (value !== 'none' && (value !== 'inset' || this.tagName === 'HR') ? convertInt(this.css('borderBottomWidth')) : 0);
        }
        get borderLeftWidth() {
            const value = this.css('borderLeftStyle');
            return (value !== 'none' && (value !== 'inset' || this.tagName === 'HR') ? convertInt(this.css('borderLeftWidth')) : 0);
        }
        get paddingTop() {
            return this.boxDocument('padding', 'Top');
        }
        get paddingRight() {
            return this.boxDocument('padding', 'Right');
        }
        get paddingBottom() {
            return this.boxDocument('padding', 'Bottom');
        }
        get paddingLeft() {
            return this.boxDocument('padding', 'Left');
        }
        set pageflow(value) {
            this._pageflow = value;
        }
        get pageflow() {
            if (this._pageflow == null) {
                const value = this.position;
                return (value === 'static' || value === 'initial' || value === 'relative' || this.alignOrigin);
            }
            return this._pageflow;
        }
        get siblingflow() {
            const value = this.position;
            return !(value === 'absolute' || value === 'fixed');
        }
        get inline() {
            const value = this.display;
            return (value === 'inline' || (value === 'initial' && INLINE_ELEMENT.includes(this.tagName)));
        }
        get inlineElement() {
            const position = this.position;
            const display = this.display;
            return (this.inline || display.indexOf('inline') !== -1 || display === 'table-cell' || this.floating || ((position === 'absolute' || position === 'fixed') && this.alignOrigin));
        }
        get inlineStatic() {
            return (this.inline && !this.floating && this.tagName !== 'IMG');
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
                        this._inlineText = (this.hasElement &&
                            hasFreeFormText(this._element) &&
                            (this.children.length === 0 || this.children.every(node => !!getElementCache(node.element, 'supportInline'))) &&
                            (this._element.childNodes.length === 0 || !Array.from(this._element.childNodes).some((element) => {
                                const node = getNodeFromElement(element);
                                return (node != null && !node.lineBreak && (!node.excluded || !node.visible));
                            })));
                        break;
                }
            }
            return this._inlineText;
        }
        get plainText() {
            return (this.nodeName === 'PLAINTEXT');
        }
        get imageElement() {
            return (this.tagName === 'IMG');
        }
        get textElement() {
            return (this.plainText || this.inlineText);
        }
        get block() {
            const value = this.display;
            return (value === 'block' || value === 'list-item');
        }
        get blockStatic() {
            return (this.block && this.pageflow && this.siblingflow && (!this.floating || this.cssOriginal('width') === '100%'));
        }
        get alignOrigin() {
            return (this.top == null && this.right == null && this.bottom == null && this.left == null);
        }
        get alignNegative() {
            return (this.toInt('top') < 0 || this.toInt('left') < 0);
        }
        get autoMargin() {
            return (this.originalStyleMap.marginLeft === 'auto' || this.originalStyleMap.marginRight === 'auto');
        }
        get autoLeftMargin() {
            return (this.originalStyleMap.marginLeft === 'auto' && this.originalStyleMap.marginRight !== 'auto');
        }
        get autoRightMargin() {
            return (this.originalStyleMap.marginLeft !== 'auto' && this.originalStyleMap.marginRight === 'auto');
        }
        get centerMarginHorizontal() {
            return (this.originalStyleMap.marginLeft === 'auto' && this.originalStyleMap.marginRight === 'auto');
        }
        get centerMarginVertical() {
            return (this.originalStyleMap.marginTop === 'auto' && this.originalStyleMap.marginBottom === 'auto');
        }
        get floating() {
            const value = this.css('cssFloat');
            return (this.position !== 'absolute' ? (value === 'left' || value === 'right') : false);
        }
        get float() {
            return (this.floating ? this.css('cssFloat') : null) || 'none';
        }
        get textContent() {
            if (this._element != null) {
                if (this._element instanceof HTMLElement) {
                    return this._element.innerText || this._element.innerHTML;
                }
                else if (this._element.nodeName === '#text') {
                    return this._element.textContent || '';
                }
            }
            return '';
        }
        get lineBreak() {
            return (this.tagName === 'BR');
        }
        get overflowX() {
            return this.hasBit('overflow', 2 /* HORIZONTAL */);
        }
        get overflowY() {
            return this.hasBit('overflow', 4 /* VERTICAL */);
        }
        get baseline() {
            const value = this.css('verticalAlign');
            return ((value === 'baseline' || value === 'initial' || value === 'unset') && this.siblingflow);
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
        get actualHeight() {
            return (this.plainText ? this.bounds.bottom - this.bounds.top : this.bounds.height);
        }
        get dir() {
            switch (this.css('direction')) {
                case 'unset':
                case 'inherit':
                    let parent = this.documentParent;
                    do {
                        const dir = parent.dir;
                        if (dir !== '') {
                            return dir;
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
        get previousElementSibling() {
            if (this._element != null) {
                let element = this._element.previousSibling;
                while (element != null) {
                    if (isPlainText(element) || element instanceof HTMLElement || element.tagName === 'BR') {
                        return element;
                    }
                    element = element.previousSibling;
                }
            }
            return null;
        }
        get nextElementSibling() {
            if (this._element != null) {
                let element = this._element.nextSibling;
                while (element != null) {
                    if (isPlainText(element) || element instanceof HTMLElement || element.tagName === 'BR') {
                        return element;
                    }
                    element = element.nextSibling;
                }
            }
            return null;
        }
        get singleChild() {
            return (this.rendered ? (this.renderParent.renderChildren.length === 1) : (this.parent.children.length === 1));
        }
        get firstElementChild() {
            if (this.hasElement) {
                for (let i = 0; i < this._element.childNodes.length; i++) {
                    const element = this._element.childNodes[i];
                    if (element.nodeName.charAt(0) === '#') {
                        if (isPlainText(element)) {
                            return element;
                        }
                    }
                    else if (element instanceof Element) {
                        return element;
                    }
                }
            }
            return null;
        }
        get lastElementChild() {
            if (this.hasElement) {
                for (let i = this._element.childNodes.length - 1; i >= 0; i--) {
                    const element = this._element.childNodes[i];
                    if (element.nodeName.charAt(0) === '#') {
                        if (isPlainText(element)) {
                            return element;
                        }
                    }
                    else if (element instanceof Element) {
                        return element;
                    }
                }
            }
            return null;
        }
        get center() {
            return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.actualHeight / 2) };
        }
    }

    let ID;
    function resetId() {
        ID = {
            android: ['parent']
        };
    }
    function generateId(section, name) {
        let prefix = name;
        let i = 1;
        const match = name.match(/^(\w+)_([0-9]+)$/);
        if (match) {
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
    function stripId(value) {
        return (value != null ? value.replace(/@\+?id\//, '') : '');
    }
    function convertDP(value, dpi = 160, font = false) {
        if (value != null) {
            value = parseFloat(value);
            if (!isNaN(value)) {
                value /= (dpi / 160);
                value = (value >= 1 || value === 0 ? Math.floor(value) : value.toFixed(2));
                return value + (font ? 'sp' : 'dp');
            }
        }
        return '0dp';
    }
    function delimitDimens(nodeName, attr, size) {
        return (SETTINGS.dimensResourceValue ? `{%${nodeName.toLowerCase()},${attr},${size}}` : size);
    }
    function replaceUnit(value, font = false) {
        switch (SETTINGS.convertPixels) {
            case 'dp':
                return value.replace(/("|>)(-)?([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + (capture[1] || '') + convertDP(capture[2], SETTINGS.density, font) + capture[3]);
            default:
                return value;
        }
    }
    function calculateBias(start, end, accurracy) {
        if (accurracy == null) {
            accurracy = SETTINGS.constraintPercentAccuracy;
        }
        return parseFloat(Math.max(start === 0 ? 0 : (end === 0 ? 1 : (start / (start + end))), 0).toFixed(accurracy));
    }

    const API_ANDROID = {
        [exports.build.PIE]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.OREO_1]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.OREO]: {
            android: ['fontWeight', 'layout_marginHorizontal', 'layout_marginVertical', 'paddingHorizontal', 'paddingVertical'],
            app: [],
            customizations: {}
        },
        [exports.build.NOUGAT_1]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.NOUGAT]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.MARSHMALLOW]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.LOLLIPOP_1]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.LOLLIPOP]: {
            android: ['layout_columnWeight'],
            app: [],
            customizations: {}
        },
        [exports.build.KITKAT_1]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.KITKAT]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.JELLYBEAN_2]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.JELLYBEAN_1]: {
            android: ['labelFor'],
            app: [],
            customizations: {}
        },
        [exports.build.JELLYBEAN]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.ICE_CREAM_SANDWICH_1]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.ICE_CREAM_SANDWICH]: {
            android: [],
            app: [],
            customizations: {}
        },
        [exports.build.ALL]: {
            android: [],
            app: [],
            customizations: {
                SUB: {
                    android: {
                        layout_marginTop: '6px'
                    }
                },
                SUP: {
                    android: {
                        layout_marginTop: '-4px'
                    }
                }
            }
        }
    };

    function parseRTL(value) {
        if (SETTINGS.supportRTL && SETTINGS.targetAPI >= exports.build.JELLYBEAN_1) {
            value = value.replace(/left/g, 'start').replace(/right/g, 'end');
            value = value.replace(/Left/g, 'Start').replace(/Right/g, 'End');
        }
        return value;
    }

    class View extends Node {
        constructor(id, api, element) {
            super(id, element);
            this.id = id;
            this.api = api;
            this.renderChildren = [];
            this.children = [];
            this.constraint = { current: {} };
            this._namespaces = new Set(['android', 'app']);
            this._android = {};
            this._app = {};
        }
        static documentBody() {
            if (View._documentBody == null) {
                const body = new View(0, 0, document.body);
                body.hide();
                body.setBounds();
                View._documentBody = body;
            }
            return View._documentBody;
        }
        static getControlName(nodeType) {
            return NODE_ANDROID[NODE_STANDARD[nodeType]];
        }
        attr(obj, attr, value = '', overwrite = true) {
            if (!this.supported(obj, attr)) {
                return '';
            }
            return super.attr(obj, attr, value, overwrite);
        }
        android(attr, value = '', overwrite = true) {
            this.attr('android', attr, value, overwrite);
            return this._android[attr] || '';
        }
        app(attr, value = '', overwrite = true) {
            this.attr('app', attr, value, overwrite);
            return this._app[attr] || '';
        }
        apply(options = {}) {
            const local = Object.assign({}, options);
            super.apply(local);
            for (const obj in local) {
                this.formatted(`${obj}="${local[obj]}"`);
            }
        }
        formatted(value, overwrite = true) {
            const match = value.match(/^(?:([a-z]+):)?(\w+)="((?:@+?[a-z]+\/)?.+)"$/);
            if (match) {
                this.attr(match[1] || '_', match[2], match[3], overwrite);
            }
        }
        anchor(position, adjacent, orientation, overwrite) {
            if (arguments.length === 1 || this.constraint.current[position] == null || !this.constraint.current[position].overwrite || (orientation && !this.constraint[orientation])) {
                if (overwrite == null) {
                    overwrite = (adjacent === 'parent' || adjacent === 'true');
                }
                this[(this.renderParent.controlName === NODE_ANDROID.RELATIVE ? 'android' : 'app')](position, adjacent, overwrite);
                if (orientation) {
                    this.constraint[orientation] = true;
                }
                this.constraint.current[position] = { adjacent, orientation, overwrite };
            }
        }
        alignParent(position) {
            if (this.renderParent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE)) {
                const constraint = (this.renderParent.controlName === NODE_ANDROID.CONSTRAINT);
                const direction = capitalize(position);
                const attr = (constraint ? `layout_constraint${direction}_to${direction}Of` : `layout_alignParent${direction}`);
                return (this[(constraint ? 'app' : 'android')](parseRTL(attr)) === (constraint ? 'parent' : 'true'));
            }
            return false;
        }
        modifyBox(region, offset, negative = false, bounds = false) {
            const name = (typeof region === 'number' ? convertEnum(region, BOX_STANDARD, BOX_ANDROID) : '');
            if ((name !== '' || (typeof region === 'string' && region !== '')) && offset !== 0) {
                const attr = (typeof region === 'string' ? region : name.replace('layout_', ''));
                if (this._boxReset[attr] != null) {
                    if (offset == null) {
                        this._boxReset[attr] = 1;
                    }
                    else {
                        this._boxAdjustment[attr] += offset;
                        if (!negative) {
                            this._boxAdjustment[attr] = Math.max(0, this._boxAdjustment[attr]);
                        }
                    }
                    if (bounds && offset) {
                        switch (attr) {
                            case 'marginTop':
                                this.linear.top -= offset;
                                break;
                            case 'marginRight':
                                this.linear.right += offset;
                                break;
                            case 'marginBottom':
                                this.linear.bottom += offset;
                                break;
                            case 'marginLeft':
                                this.linear.left -= offset;
                                break;
                            case 'paddingTop':
                                this.box.top += offset;
                                break;
                            case 'paddingRight':
                                this.box.right -= offset;
                                break;
                            case 'paddingBottom':
                                this.box.bottom -= offset;
                                break;
                            case 'paddingLeft':
                                this.box.left += offset;
                                break;
                        }
                        this.setDimensions([(attr.indexOf('margin') !== -1 ? 'linear' : 'box')]);
                    }
                }
            }
        }
        valueBox(region) {
            const name = convertEnum(region, BOX_STANDARD, BOX_ANDROID);
            if (name !== '') {
                const attr = name.replace('layout_', '');
                return [this._boxReset[attr] || 0, this._boxAdjustment[attr] || 0];
            }
            return [0, 0];
        }
        supported(obj, attr) {
            if (this.api > 0) {
                for (let i = this.api + 1; i <= exports.build.LATEST; i++) {
                    const version = API_ANDROID[i];
                    if (version && version[obj] && version[obj].includes(attr)) {
                        return false;
                    }
                }
            }
            return true;
        }
        combine(...objs) {
            const result = [];
            for (const value of this._namespaces.values()) {
                const obj = this[`_${value}`];
                if (objs.length === 0 || objs.includes(value)) {
                    for (const attr in obj) {
                        if (value !== '_') {
                            result.push(`${value}:${attr}="${obj[attr]}"`);
                        }
                        else {
                            result.push(`${attr}="${obj[attr]}"`);
                        }
                    }
                }
            }
            return result.sort((a, b) => {
                if (a.startsWith('android:id=')) {
                    return -1;
                }
                else if (b.startsWith('android:id=')) {
                    return 1;
                }
                else {
                    return (a > b ? 1 : -1);
                }
            });
        }
        applyCustomizations(overwrite = false) {
            [API_ANDROID[this.api], API_ANDROID[0]].forEach(build => {
                if (build && build.customizations != null) {
                    [this.tagName, this.controlName].forEach(nodeName => {
                        const customizations = build.customizations[nodeName];
                        if (customizations != null) {
                            for (const obj in customizations) {
                                for (const attr in customizations[obj]) {
                                    this.attr(obj, attr, customizations[obj][attr], overwrite);
                                }
                            }
                        }
                    });
                }
            });
        }
        clone(id, children = false) {
            const node = new View(id || this.id, this.api, this.element);
            node.nodeId = this.nodeId;
            node.nodeType = this.nodeType;
            node.controlName = this.controlName;
            node.alignmentType = this.alignmentType;
            node.depth = this.depth;
            node.rendered = this.rendered;
            node.renderDepth = this.renderDepth;
            node.renderParent = this.renderParent;
            node.renderExtension = this.renderExtension;
            node.documentRoot = this.documentRoot;
            node.documentParent = this.documentParent;
            if (children) {
                node.children = this.children.slice();
            }
            node.inherit(this, 'base', 'styleMap');
            return node;
        }
        setNodeType(nodeName) {
            for (const type in NODE_ANDROID) {
                if (NODE_ANDROID[type] === nodeName && NODE_STANDARD[type] != null) {
                    this.nodeType = NODE_STANDARD[type];
                    break;
                }
            }
            this.controlName = nodeName;
            if (this.android('id') !== '') {
                this.nodeId = stripId(this.android('id'));
            }
            if (!this.nodeId) {
                const element = this.element;
                let name = (element.id || element.name || '').trim();
                if (RESERVED_JAVA.includes(name)) {
                    name += '_1';
                }
                this.nodeId = convertWord(generateId('android', (name || `${lastIndexOf(this.controlName, '.').toLowerCase()}_1`)));
                this.android('id', this.stringId);
            }
        }
        setLayout(width, height) {
            if (this.nodeType >= NODE_STANDARD.SCROLL_HORIZONTAL) {
                this.android('layout_width', (this.nodeType === NODE_STANDARD.SCROLL_HORIZONTAL && isUnit(this.css('width')) ? this.css('width') : 'wrap_content'));
                this.android('layout_height', (this.nodeType === NODE_STANDARD.SCROLL_VERTICAL && isUnit(this.css('height')) ? this.css('height') : 'wrap_content'));
            }
            else if (this.renderParent.nodeType >= NODE_STANDARD.SCROLL_HORIZONTAL) {
                if (this.renderParent.is(NODE_STANDARD.SCROLL_HORIZONTAL)) {
                    this.android('layout_width', 'wrap_content', false);
                    this.android('layout_height', 'match_parent', false);
                }
                else {
                    this.android('layout_width', 'match_parent', false);
                    this.android('layout_height', 'wrap_content', false);
                }
            }
            else {
                const styleMap = this.styleMap;
                const constraint = this.constraint;
                const parent = this.documentParent;
                const renderParent = this.renderParent;
                const widthParent = (parent.box ? parent.box.width
                    : (parent.element instanceof HTMLElement ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + parent.borderLeftWidth + parent.borderRightWidth)
                        : 0));
                const heightParent = (parent.box ? parent.box.height
                    : (parent.element instanceof HTMLElement ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + parent.borderTopWidth + parent.borderBottomWidth)
                        : 0));
                const tableElement = (this.tagName === 'TABLE');
                if (width == null) {
                    width = (this.linear ? this.linear.width
                        : (this.hasElement ? this.element.clientWidth + this.borderLeftWidth + this.borderRightWidth + this.marginLeft + this.marginRight
                            : 0));
                }
                if (height == null) {
                    height = (this.linear ? this.linear.height
                        : (this.hasElement ? this.element.clientHeight + this.borderTopWidth + this.borderBottomWidth + this.marginTop + this.marginBottom
                            : 0));
                }
                if (this.documentBody || (this.documentRoot && !this.flex.enabled && this.is(NODE_STANDARD.FRAME, NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE))) {
                    if (this.viewWidth === 0 && this.block && !constraint.layoutHorizontal) {
                        this.android('layout_width', 'match_parent', false);
                    }
                    if (this.viewHeight === 0 && this.cascade().some(node => !node.pageflow) && !constraint.layoutHeight && !constraint.layoutVertical) {
                        this.android('layout_height', 'match_parent', false);
                    }
                }
                if (this.of(NODE_STANDARD.GRID, NODE_ALIGNMENT.PERCENT)) {
                    this.android('layout_width', 'match_parent');
                }
                else {
                    if (this.android('layout_width') !== '0px') {
                        if (this.toInt('width') > 0 && (!this.inlineStatic || renderParent.is(NODE_STANDARD.GRID) || !this.has('width', 0, { map: 'original' }))) {
                            if (isPercent(styleMap.width)) {
                                if (styleMap.width === '100%') {
                                    this.android('layout_width', 'match_parent', false);
                                }
                                else if (renderParent.of(NODE_STANDARD.GRID, NODE_ALIGNMENT.PERCENT)) {
                                    this.android('layout_width', '0px');
                                    this.app('layout_columnWeight', (parseInt(styleMap.width) / 100).toFixed(2));
                                }
                                else {
                                    const widthPercent = Math.ceil(this.bounds.width) - (!tableElement ? this.paddingLeft + this.paddingRight + this.borderLeftWidth + this.borderRightWidth : 0);
                                    this.android('layout_width', formatPX(widthPercent), false);
                                }
                            }
                            else {
                                this.android('layout_width', styleMap.width);
                            }
                        }
                        if (constraint.layoutWidth) {
                            if (constraint.layoutHorizontal) {
                                this.android('layout_width', (parent.viewWidth > 0 ? 'match_parent' : 'wrap_content'), false);
                            }
                            else {
                                this.android('layout_width', (this.bounds.width >= widthParent ? 'match_parent' : formatPX(this.bounds.width)), false);
                            }
                        }
                        if (this.has('minWidth', CSS_STANDARD.UNIT)) {
                            this.android('layout_width', 'wrap_content', false);
                            this.android('minWidth', styleMap.minWidth, false);
                        }
                    }
                    if (this.android('layout_width') === '') {
                        const widthDefined = this.renderChildren.filter(node => (node.has('width', 0, { map: 'original' }) && !node.has('width', CSS_STANDARD.PERCENT) && !node.autoMargin));
                        if (convertFloat(this.app('layout_columnWeight')) > 0) {
                            this.android('layout_width', '0px');
                        }
                        else if (widthDefined.length > 0 && widthDefined.some(node => node.bounds.width >= this.box.width)) {
                            this.android('layout_width', 'wrap_content');
                        }
                        else if ((this.blockStatic && this.hasBit('alignmentType', NODE_ALIGNMENT.VERTICAL)) || (!this.documentRoot && this.renderChildren.some(node => node.hasBit('alignmentType', NODE_ALIGNMENT.VERTICAL) && !node.has('width')))) {
                            this.android('layout_width', 'match_parent');
                        }
                        else {
                            const inlineRight = Math.max.apply(null, this.renderChildren.filter(node => node.inlineElement && node.float !== 'right').map(node => node.linear.right)) || 0;
                            const wrap = (this.nodeType < NODE_STANDARD.INLINE ||
                                this.inlineElement ||
                                !this.pageflow ||
                                !this.siblingflow ||
                                this.display === 'table' ||
                                parent.flex.enabled ||
                                (renderParent.inlineElement && renderParent.viewWidth === 0 && !this.inlineElement && this.nodeType > NODE_STANDARD.BLOCK) ||
                                renderParent.is(NODE_STANDARD.GRID));
                            if (this.is(NODE_STANDARD.GRID) && withinFraction(inlineRight, this.box.right)) {
                                this.android('layout_width', 'wrap_content');
                            }
                            else if (!wrap || (this.blockStatic && !this.has('maxWidth'))) {
                                const previousSibling = this.previousSibling();
                                const nextSibling = this.nextSibling();
                                if (width >= widthParent ||
                                    (this.linearVertical && !this.floating && !this.autoMargin) ||
                                    (this.hasElement &&
                                        this.blockStatic && (this.documentParent.documentBody ||
                                        this.ascend(true).every(node => node.blockStatic) ||
                                        (this.documentParent.blockStatic && this.nodeType <= NODE_STANDARD.LINEAR && ((previousSibling == null || !previousSibling.floating) && (nextSibling == null || !nextSibling.floating))))) ||
                                    (this.is(NODE_STANDARD.FRAME) && this.renderChildren.some(node => node.blockStatic && (node.centerMarginHorizontal || node.autoLeftMargin))) ||
                                    (!this.hasElement && this.renderChildren.length > 0 && this.renderChildren.some(item => item.linear.width >= this.documentParent.box.width) && !this.renderChildren.some(item => item.plainText && item.multiLine))) {
                                    this.android('layout_width', 'match_parent');
                                }
                            }
                            this.android('layout_width', 'wrap_content', false);
                        }
                    }
                }
                if (this.android('layout_height') !== '0px') {
                    if (this.toInt('height') > 0 && (!this.inlineStatic || !this.has('height', 0, { map: 'original' }))) {
                        if (isPercent(styleMap.height)) {
                            if (styleMap.height === '100%') {
                                this.android('layout_height', 'match_parent', false);
                            }
                            else {
                                let heightPercent = Math.ceil(this.bounds.height);
                                if (!tableElement) {
                                    heightPercent -= this.paddingTop + this.paddingBottom + this.borderTopWidth + this.borderBottomWidth;
                                }
                                this.android('layout_height', formatPX(heightPercent), false);
                            }
                        }
                        else {
                            this.android('layout_height', (this.css('overflow') === 'hidden' && this.toInt('height') < this.box.height ? 'wrap_content' : styleMap.height));
                        }
                    }
                    if (constraint.layoutHeight) {
                        if (constraint.layoutVertical) {
                            this.android('layout_height', 'wrap_content', false);
                        }
                        else if (this.documentRoot) {
                            const bottomHeight = Math.max.apply(null, this.renderChildren.filter(node => node.pageflow).map(node => node.linear.bottom)) || 0;
                            this.android('layout_height', (bottomHeight > 0 ? formatPX(bottomHeight + this.paddingBottom + this.borderBottomWidth) : 'match_parent'), false);
                        }
                        else {
                            this.android('layout_height', (this.actualHeight < heightParent ? formatPX(this.actualHeight) : 'match_parent'), false);
                        }
                    }
                    if (this.has('minHeight', CSS_STANDARD.UNIT)) {
                        this.android('layout_height', 'wrap_content', false);
                        this.android('minHeight', styleMap.minHeight, false);
                    }
                }
                if (this.android('layout_height') === '') {
                    if (height >= heightParent &&
                        parent.viewHeight > 0 &&
                        !(this.inlineElement && this.nodeType < NODE_STANDARD.INLINE) &&
                        !(renderParent.is(NODE_STANDARD.RELATIVE) && renderParent.inlineHeight)) {
                        this.android('layout_height', 'match_parent');
                    }
                    else {
                        if (this.lineHeight > 0 && !this.plainText && !renderParent.linearHorizontal) {
                            const boundsHeight = this.actualHeight;
                            if (this.inlineElement && boundsHeight > 0 && this.lineHeight >= boundsHeight) {
                                this.android('layout_height', formatPX(boundsHeight));
                                this.modifyBox(BOX_STANDARD.PADDING_TOP, null);
                                this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, null);
                            }
                            else if (this.block && this.box.height > 0 && this.lineHeight === this.box.height) {
                                this.android('layout_height', formatPX(boundsHeight));
                            }
                        }
                        this.android('layout_height', 'wrap_content', false);
                    }
                }
            }
            if (this.cssParent('visibility', true) === 'hidden') {
                this.android('visibility', 'invisible');
            }
        }
        setAlignment() {
            const renderParent = this.renderParent;
            const obj = (renderParent.is(NODE_STANDARD.GRID) ? 'app' : 'android');
            const left = parseRTL('left');
            const right = parseRTL('right');
            let textAlign = this.styleMap.textAlign || '';
            let verticalAlign = '';
            function mergeGravity(original, ...alignment) {
                const direction = [...(original || '').split('|'), ...alignment].filter(value => value);
                switch (direction.length) {
                    case 0:
                        return '';
                    case 1:
                        return direction[0];
                    default:
                        let x = '';
                        let y = '';
                        let z = '';
                        for (let i = 0; i < direction.length; i++) {
                            const value = direction[i];
                            switch (value) {
                                case 'center':
                                    x = 'center_horizontal';
                                    y = 'center_vertical';
                                    break;
                                case 'left':
                                case 'start':
                                case 'right':
                                case 'end':
                                case 'center_horizontal':
                                    x = value;
                                    break;
                                case 'top':
                                case 'bottom':
                                case 'center_vertical':
                                    y = value;
                                    break;
                                default:
                                    z += (z !== '' ? '|' : '') + value;
                                    break;
                            }
                        }
                        const gravity = [x, y].filter(value => value);
                        const merged = (gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|'));
                        return (merged !== '' ? (z !== '' ? `${merged}|${z}` : merged) : z);
                }
            }
            function setAutoMargin(node) {
                const alignment = [];
                if (node.centerMarginHorizontal) {
                    alignment.push('center_horizontal');
                }
                else if (node.css('marginLeft') === 'auto') {
                    alignment.push(right);
                }
                else if (node.css('marginRight') === 'auto') {
                    alignment.push(left);
                }
                if (node.centerMarginVertical) {
                    alignment.push('center_vertical');
                }
                else if (node.css('marginTop') === 'auto') {
                    alignment.push('bottom');
                }
                else if (node.css('marginBottom') === 'auto') {
                    alignment.push('top');
                }
                if (alignment.length > 0) {
                    const gravity = (node.blockWidth ? 'gravity' : 'layout_gravity');
                    node[obj](gravity, mergeGravity(node[obj](gravity), ...alignment));
                    return true;
                }
                return false;
            }
            function convertHorizontal(value) {
                switch (value) {
                    case 'left':
                    case 'start':
                        return left;
                    case 'right':
                    case 'end':
                        return right;
                    case 'center':
                        return 'center_horizontal';
                    default:
                        return '';
                }
            }
            if (!(this.floating || renderParent.of(NODE_STANDARD.RELATIVE, NODE_ALIGNMENT.HORIZONTAL))) {
                switch (this.styleMap.verticalAlign) {
                    case 'top':
                    case 'text-top':
                        verticalAlign = 'top';
                        if (renderParent.linearHorizontal && this.inlineHeight) {
                            this.android('layout_height', 'match_parent');
                        }
                        break;
                    case 'middle':
                        if (this.documentParent.css('display') === 'table-cell' || (this.inlineStatic && this.documentParent.lineHeight > 0) || this.inline) {
                            verticalAlign = 'center_vertical';
                        }
                        break;
                    case 'bottom':
                    case 'text-bottom':
                        verticalAlign = 'bottom';
                        break;
                }
            }
            if (verticalAlign === '' && this.lineHeight > 0 && !this.blockHeight) {
                verticalAlign = 'center_vertical';
            }
            if (renderParent.linearVertical || (this.documentRoot && this.linearVertical)) {
                if (this.float === 'right') {
                    this[obj]('layout_gravity', right);
                }
                else {
                    setAutoMargin(this);
                }
            }
            let floating = '';
            if (this.hasBit('alignmentType', NODE_ALIGNMENT.SEGMENTED | NODE_ALIGNMENT.FLOAT) || this.linearHorizontal) {
                if (this.hasBit('alignmentType', NODE_ALIGNMENT.LEFT) || this.renderChildren.some(node => node.float === 'left' || node.hasBit('alignmentType', NODE_ALIGNMENT.LEFT))) {
                    floating = left;
                }
                else if (this.hasBit('alignmentType', NODE_ALIGNMENT.RIGHT) || this.renderChildren.some(node => node.float === 'right' || node.hasBit('alignmentType', NODE_ALIGNMENT.RIGHT))) {
                    floating = right;
                }
            }
            if (renderParent.tagName === 'TABLE') {
                this[obj]('layout_gravity', mergeGravity(this[obj]('layout_gravity'), 'fill'));
                if (textAlign === '' && this.tagName === 'TH') {
                    textAlign = 'center';
                }
                if (verticalAlign === '') {
                    verticalAlign = 'center_vertical';
                }
            }
            function setTextAlign(value) {
                if (textAlign === '' || value === right) {
                    return value;
                }
                return textAlign;
            }
            if (this.linearHorizontal) {
                if (this.blockWidth) {
                    textAlign = setTextAlign(floating);
                }
                else {
                    this[obj]('layout_gravity', mergeGravity(this[obj]('layout_gravity'), floating));
                }
            }
            else if (renderParent.is(NODE_STANDARD.FRAME)) {
                if (!setAutoMargin(this)) {
                    floating = floating || this.float;
                    if (floating !== 'none') {
                        if (renderParent.inlineWidth || this.singleChild) {
                            renderParent.android('layout_gravity', mergeGravity(renderParent.android('layout_gravity'), parseRTL(floating)));
                        }
                        else {
                            if (this.blockWidth) {
                                textAlign = setTextAlign(floating);
                            }
                            else {
                                this.android('layout_gravity', mergeGravity(this.android('layout_gravity'), parseRTL(floating)));
                            }
                        }
                    }
                }
            }
            else if (floating !== '') {
                if (renderParent.hasBit('alignmentType', NODE_ALIGNMENT.VERTICAL)) {
                    textAlign = setTextAlign(floating);
                }
            }
            const textAlignParent = this.cssParent('textAlign');
            if (textAlignParent !== '' && parseRTL(textAlignParent) !== left) {
                if (renderParent.is(NODE_STANDARD.FRAME) &&
                    this.singleChild &&
                    !this.floating &&
                    !this.autoMargin) {
                    this[obj]('layout_gravity', mergeGravity(this[obj]('layout_gravity'), convertHorizontal(textAlignParent)));
                }
                if (textAlign === '') {
                    textAlign = textAlignParent;
                }
            }
            if (renderParent.is(NODE_STANDARD.CONSTRAINT)) {
                const gravity = renderParent.android('gravity').split('|');
                if (gravity.length > 0 && gravity.some(value => value === 'center_horizontal' || value === 'center') && this.inlineWidth && this.alignParent('left')) {
                    this.anchor(parseRTL('layout_constraintRight_toRightOf'), 'parent');
                    if (textAlign === '') {
                        textAlign = 'center';
                    }
                }
            }
            if (verticalAlign !== '' && renderParent.linearHorizontal) {
                this[obj]('layout_gravity', mergeGravity(this[obj]('layout_gravity'), verticalAlign));
                verticalAlign = '';
            }
            if (this.documentRoot && this.blockWidth) {
                this.delete(obj, 'layout_gravity');
            }
            this.android('gravity', mergeGravity(this.android('gravity'), convertHorizontal(textAlign), verticalAlign));
        }
        setBoxSpacing() {
            if (!this.hasBit('excludeResource', NODE_RESOURCE.BOX_SPACING)) {
                ['padding', 'margin'].forEach(region => {
                    ['Top', 'Left', 'Right', 'Bottom'].forEach(direction => {
                        const dimension = region + direction;
                        const value = (this._boxReset[dimension] === 0 ? this[dimension] : 0) + this._boxAdjustment[dimension];
                        if (value !== 0) {
                            const attr = parseRTL(BOX_ANDROID[`${region.toUpperCase()}_${direction.toUpperCase()}`]);
                            this.android(attr, formatPX(value));
                        }
                    });
                });
                if (this.api >= exports.build.OREO) {
                    ['layout_margin', 'padding'].forEach((value, index) => {
                        const top = convertInt(this.android(`${value}Top`));
                        const right = convertInt(this.android(parseRTL(`${value}Right`)));
                        const bottom = convertInt(this.android(`${value}Bottom`));
                        const left = convertInt(this.android(parseRTL(`${value}Left`)));
                        if (top !== 0 && top === bottom && bottom === left && left === right) {
                            this.delete('android', `${value}*`);
                            this.android(value, formatPX(top));
                        }
                        else {
                            if (!(index === 0 && this.renderParent.is(NODE_STANDARD.GRID))) {
                                if (top !== 0 && top === bottom) {
                                    this.delete('android', `${value}Top`, `${value}Bottom`);
                                    this.android(`${value}Vertical`, formatPX(top));
                                }
                                if (left !== 0 && left === right) {
                                    this.delete('android', parseRTL(`${value}Left`), parseRTL(`${value}Right`));
                                    this.android(`${value}Horizontal`, formatPX(left));
                                }
                            }
                        }
                    });
                }
            }
        }
        applyOptimizations(settings) {
            const renderParent = this.renderParent;
            const renderChildren = this.renderChildren;
            const renderEvery = (this.hasElement && Array.from(this.element.children).every(element => renderChildren.includes(getNodeFromElement(element)) || element.tagName === 'BR'));
            if (this.is(NODE_STANDARD.LINEAR)) {
                const linearHorizontal = this.linearHorizontal;
                if (this.blockWidth && !this.blockStatic) {
                    [[linearHorizontal, this.inlineElement, 'width'], [!linearHorizontal, true, 'height']].forEach((value) => {
                        const attr = `inline${capitalize(value[2])}`;
                        if (value[0] && value[1] && !this[attr] && renderChildren.every(node => node[attr])) {
                            this.android(`layout_${value[2]}`, 'wrap_content');
                        }
                    });
                }
                if (linearHorizontal) {
                    if (!renderChildren.some(node => node.imageElement && node.baseline) && (renderChildren.some(node => node.floating || !node.siblingflow) || this.hasBit('alignmentType', NODE_ALIGNMENT.FLOAT))) {
                        this.android('baselineAligned', 'false');
                    }
                    else {
                        const alignInput = renderChildren.some(node => node.nodeType < NODE_STANDARD.TEXT);
                        if (renderChildren.some(node => !node.alignOrigin || !node.baseline) || renderParent.android('baselineAlignedChildIndex') !== '' || alignInput) {
                            const baseline = NodeList.textBaseline(renderChildren, alignInput);
                            if (baseline.length > 0) {
                                this.android('baselineAlignedChildIndex', renderChildren.indexOf(baseline[0]).toString());
                            }
                        }
                    }
                    if (renderEvery) {
                        const inline = renderChildren.filter(node => !node.floating);
                        if (inline.every(node => node.baseline || isUnit(node.css('verticalAlign')))) {
                            const marginTop = Math.max.apply(null, inline.map(node => node.toInt('verticalAlign')));
                            const marginBottom = Math.min.apply(null, inline.map(node => node.toInt('verticalAlign')));
                            if (marginTop > 0 && marginBottom < 0) {
                                inline.forEach(node => {
                                    const offset = node.toInt('verticalAlign');
                                    if (offset === 0) {
                                        node.modifyBox(BOX_STANDARD.PADDING_TOP, marginTop);
                                        node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, Math.abs(marginBottom));
                                    }
                                    else {
                                        node.modifyBox(BOX_STANDARD.MARGIN_TOP, offset * -1, true);
                                        node.css('verticalAlign', '0px');
                                    }
                                });
                            }
                        }
                    }
                    if (settings.ellipsisOnTextOverflow &&
                        renderChildren.length > 1 &&
                        renderChildren.every(node => node.textElement && !node.floating)) {
                        renderChildren[renderChildren.length - 1].android('singleLine', 'true');
                    }
                }
            }
            if (this.pageflow) {
                if (!renderParent.documentBody && renderParent.blockStatic && this.documentParent === renderParent) {
                    [['firstElementChild', 'Top', BOX_STANDARD.MARGIN_TOP, BOX_STANDARD.PADDING_TOP], ['lastElementChild', 'Bottom', BOX_STANDARD.MARGIN_BOTTOM, BOX_STANDARD.PADDING_BOTTOM]].forEach((item, index) => {
                        const firstNode = getNodeFromElement(renderParent[item[0]]);
                        if (firstNode && !firstNode.lineBreak && (firstNode === this || firstNode === this.renderChildren[(index === 0 ? 0 : this.renderChildren.length - 1)])) {
                            const marginOffset = renderParent[`margin${item[1]}`];
                            if (marginOffset > 0 && renderParent[`padding${item[1]}`] === 0 && renderParent[`border${item[1]}Width`] === 0) {
                                firstNode.modifyBox(item[2], null);
                            }
                        }
                    });
                }
                if (this.blockStatic && this.hasElement) {
                    for (let i = 0; i < this.element.children.length; i++) {
                        const element = this.element.children[i];
                        const node = getNodeFromElement(element);
                        if (node && node.pageflow && node.blockStatic && !node.lineBreak) {
                            const previous = node.previousSibling();
                            if (previous && previous.pageflow && !previous.lineBreak) {
                                const marginTop = convertInt(node.cssOriginal('marginTop', true));
                                const marginBottom = convertInt(previous.cssOriginal('marginBottom', true));
                                if (marginBottom > 0 && marginTop > 0) {
                                    if (marginTop <= marginBottom) {
                                        node.modifyBox(BOX_STANDARD.MARGIN_TOP, null);
                                    }
                                    else {
                                        previous.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, null);
                                    }
                                }
                            }
                            [element.previousElementSibling, element.nextElementSibling].forEach((item, index) => {
                                const adjacent = getNodeFromElement(item);
                                if (adjacent && adjacent.excluded) {
                                    const offset = Math.min(adjacent.marginTop, adjacent.marginBottom);
                                    if (offset < 0) {
                                        if (index === 0) {
                                            node.modifyBox(BOX_STANDARD.MARGIN_TOP, offset, true);
                                        }
                                        else {
                                            node.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, offset, true);
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            }
            this.bindWhiteSpace();
            if (settings.autoSizePaddingAndBorderWidth && !this.hasBit('excludeProcedure', NODE_PROCEDURE.AUTOFIT)) {
                let viewWidth = convertInt(this.android('layout_width'));
                let viewHeight = convertInt(this.android('layout_height'));
                if (this.imageElement) {
                    const top = this.borderTopWidth;
                    const right = this.borderRightWidth;
                    const bottom = this.borderBottomWidth;
                    const left = this.borderLeftWidth;
                    let width = 0;
                    let height = 0;
                    if (top > 0) {
                        this.modifyBox(BOX_STANDARD.PADDING_TOP, top);
                        height += top;
                    }
                    if (right > 0) {
                        this.modifyBox(BOX_STANDARD.PADDING_RIGHT, right);
                        width += right;
                    }
                    if (bottom > 0) {
                        this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, bottom);
                        height += bottom;
                    }
                    if (left > 0) {
                        this.modifyBox(BOX_STANDARD.PADDING_LEFT, left);
                        width += left;
                    }
                    height += this.paddingTop + this.paddingBottom;
                    width += this.paddingLeft + this.paddingRight;
                    if (width > 0) {
                        if (viewWidth > 0) {
                            this.android('layout_width', formatPX(viewWidth + width));
                        }
                        else {
                            viewWidth = convertInt(renderParent.android('layout_width'));
                            if (viewWidth > 0 && this.singleChild) {
                                renderParent.android('layout_width', formatPX(viewWidth + this.marginLeft + width));
                            }
                        }
                    }
                    if (height > 0) {
                        if (viewHeight > 0) {
                            this.android('layout_height', formatPX(viewHeight + height));
                        }
                        else {
                            viewHeight = convertInt(renderParent.android('layout_height'));
                            if (viewHeight > 0 && this.singleChild) {
                                renderParent.android('layout_height', formatPX(viewHeight + this.marginTop + height));
                            }
                        }
                    }
                }
                else if (this.is(NODE_STANDARD.BUTTON) && viewHeight === 0) {
                    this.android('layout_height', formatPX(this.bounds.height));
                }
                else if (this.is(NODE_STANDARD.LINE)) {
                    if (viewHeight > 0 && this.has('height', 0, { map: 'original' }) && this.tagName !== 'HR') {
                        this.android('layout_height', formatPX(viewHeight + this.borderTopWidth + this.borderBottomWidth));
                    }
                }
                else {
                    if (this.hasElement && !this.hasBit('excludeResource', NODE_RESOURCE.BOX_SPACING)) {
                        const tableElement = (this.tagName === 'TABLE');
                        const borderCollapse = ((renderParent.display === 'table' || renderParent.tagName === 'TABLE') && renderParent.css('borderCollapse') === 'collapse');
                        let resizedWidth = false;
                        let resizedHeight = false;
                        if (viewWidth > 0 &&
                            convertInt(this.cssOriginal('width')) > 0 &&
                            !(tableElement && isPercent(this.cssOriginal('width')))) {
                            const paddedWidth = this.paddingLeft + this.paddingRight + (!borderCollapse ? this.borderLeftWidth + this.borderRightWidth : 0);
                            if (!tableElement && paddedWidth > 0) {
                                this.android('layout_width', formatPX(viewWidth + paddedWidth));
                            }
                            resizedWidth = true;
                        }
                        const borderLeft = this.borderLeftWidth - (tableElement && resizedWidth ? this.paddingLeft : 0);
                        const borderRight = this.borderRightWidth - (tableElement && resizedWidth ? this.paddingRight : 0);
                        if (borderLeft > 0) {
                            this.modifyBox(BOX_STANDARD.PADDING_LEFT, borderLeft);
                        }
                        if (borderRight > 0) {
                            this.modifyBox(BOX_STANDARD.PADDING_RIGHT, borderRight);
                        }
                        if (viewHeight > 0 &&
                            convertInt(this.cssOriginal('height')) > 0 &&
                            !(tableElement && isPercent(this.cssOriginal('height'))) && (this.lineHeight === 0 ||
                            this.lineHeight < this.box.height ||
                            this.lineHeight === this.toInt('height'))) {
                            const paddedHeight = this.paddingTop + this.paddingBottom + (!borderCollapse ? this.borderTopWidth + this.borderBottomWidth : 0);
                            if (!tableElement && paddedHeight > 0) {
                                this.android('layout_height', formatPX(viewHeight + paddedHeight));
                            }
                            resizedHeight = true;
                        }
                        const borderTop = this.borderTopWidth - (tableElement && resizedHeight ? this.paddingTop : 0);
                        const borderBottom = this.borderBottomWidth - (tableElement && resizedHeight ? this.paddingBottom : 0);
                        if (borderTop > 0) {
                            this.modifyBox(BOX_STANDARD.PADDING_TOP, borderTop);
                        }
                        if (borderBottom > 0) {
                            this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, borderBottom);
                        }
                    }
                }
            }
            if (!renderParent.linearHorizontal && !this.plainText) {
                const offset = this.lineHeight - this.actualHeight;
                if (offset > 0) {
                    this.modifyBox(BOX_STANDARD.MARGIN_TOP, Math.floor(offset / 2));
                    this.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, Math.ceil(offset / 2));
                }
            }
            if (this.position === 'relative' || renderParent.is(NODE_STANDARD.FRAME)) {
                const top = this.toInt('top');
                const bottom = this.toInt('bottom');
                const left = this.toInt('left');
                if (top !== 0) {
                    if (top < 0 && renderParent.is(NODE_STANDARD.RELATIVE) && this.floating && !!this.data('RESOURCE', 'backgroundImage')) {
                        let found = false;
                        renderParent.renderChildren.some(node => {
                            if (node === this) {
                                found = true;
                            }
                            else {
                                if (node.android('layout_below') !== '') {
                                    return true;
                                }
                                else if (found) {
                                    node.modifyBox(BOX_STANDARD.MARGIN_TOP, Math.abs(top));
                                }
                            }
                            return false;
                        });
                    }
                    else {
                        this.modifyBox(BOX_STANDARD.MARGIN_TOP, top, true);
                    }
                }
                else if (bottom !== 0) {
                    this.modifyBox(BOX_STANDARD.MARGIN_TOP, bottom * -1, true);
                }
                if (left !== 0) {
                    if (this.float === 'right' || (this.position === 'relative' && this.autoLeftMargin)) {
                        this.modifyBox(BOX_STANDARD.MARGIN_RIGHT, left * -1, true);
                    }
                    else {
                        this.modifyBox(BOX_STANDARD.MARGIN_LEFT, left, true);
                    }
                }
            }
            if (this.inline && !this.floating) {
                const verticalAlign = this.toInt('verticalAlign');
                if (verticalAlign !== 0) {
                    this.modifyBox(BOX_STANDARD.MARGIN_TOP, verticalAlign * -1, true);
                    if (verticalAlign < 0 && renderParent.linearHorizontal && renderParent.inlineHeight && renderParent.renderChildren.every(node => node.baseline || node.linearHorizontal)) {
                        renderParent.android('layout_height', formatPX(renderParent.bounds.height + this.paddingLeft + this.paddingRight + this.borderLeftWidth + this.borderRightWidth));
                    }
                }
            }
            if (this.is(NODE_STANDARD.TEXT) && this.css('whiteSpace') === 'nowrap') {
                this.android('singleLine', 'true');
            }
            if (this.imageElement && (this.baseline || renderParent.linearHorizontal || renderParent.of(NODE_STANDARD.CONSTRAINT, NODE_ALIGNMENT.HORIZONTAL))) {
                this.android('baselineAlignBottom', 'true');
            }
        }
        setAccessibility() {
            const node = this;
            const element = this.element;
            switch (this.controlName) {
                case NODE_ANDROID.EDIT:
                    if (node.companion == null) {
                        let label = null;
                        let current = this;
                        let parent = this.renderParent;
                        while (parent instanceof View && parent.renderChildren.length > 0) {
                            const index = parent.renderChildren.findIndex(item => item === current);
                            if (index > 0) {
                                label = parent.renderChildren[index - 1];
                                break;
                            }
                            current = parent;
                            parent = parent.renderParent;
                        }
                        if (label && label.is(NODE_STANDARD.TEXT) && label.element.htmlFor === node.element.id) {
                            label.android('labelFor', this.stringId);
                        }
                    }
                case NODE_ANDROID.SELECT:
                case NODE_ANDROID.CHECKBOX:
                case NODE_ANDROID.RADIO:
                case NODE_ANDROID.BUTTON:
                    if (element.disabled) {
                        this.android('focusable', 'false');
                    }
                    break;
            }
        }
        bindWhiteSpace() {
            if (this.linearHorizontal || this.hasBit('alignmentType', NODE_ALIGNMENT.HORIZONTAL)) {
                if (!(this.hasBit('alignmentType', NODE_ALIGNMENT.FLOAT) || this.renderParent.hasBit('alignmentType', NODE_ALIGNMENT.FLOAT) && Array.from(this.documentParent.element.children).some(element => getStyle(element).cssFloat !== 'none'))) {
                    const textIndent = this.toInt('textIndent');
                    const valueBox = this.valueBox(BOX_STANDARD.PADDING_LEFT);
                    let right = this.box.left + (textIndent > 0 ? this.toInt('textIndent')
                        : (textIndent < 0 && valueBox[0] === 1 ? valueBox[0] : 0));
                    this.each((node) => {
                        if (!node.floating) {
                            const width = Math.round(node.linear.left - right);
                            if (width >= 1) {
                                node.modifyBox(BOX_STANDARD.MARGIN_LEFT, width);
                            }
                        }
                        right = (node.companion != null && !node.companion.visible ? Math.max(node.linear.right, node.companion.linear.right) : node.linear.right);
                    }, true);
                }
            }
            else if (this.linearVertical) {
                let bottom = this.box.top;
                let previous = null;
                const verified = new Set();
                function getMarginBottom(node) {
                    if (node.linearHorizontal && node.renderChildren.some(item => !item.floating)) {
                        return node.renderChildren.filter(item => !item.floating).sort((a, b) => (a.linear.bottom < b.linear.bottom ? 1 : -1))[0].linear.bottom;
                    }
                    return node.linear.bottom;
                }
                this.each((node) => {
                    let valid = false;
                    if (previous && !previous.hasElement) {
                        const previousSibling = (() => {
                            let current = node.previousSibling(false);
                            while (current != null) {
                                if (!current.excluded) {
                                    return current;
                                }
                                current = current.previousSibling(false);
                            }
                            return null;
                        })();
                        if (previousSibling && previous.children.includes(previousSibling)) {
                            previous = previousSibling;
                        }
                    }
                    getElementsBetweenSiblings((previous != null ? previous.baseElement : null), node.baseElement).forEach(element => {
                        const collapsed = getNodeFromElement(element);
                        if (element.tagName === 'BR' || (collapsed && collapsed.excluded && (!verified.has(collapsed) || collapsed.blockStatic))) {
                            if (collapsed != null) {
                                verified.add(collapsed);
                            }
                            valid = true;
                        }
                    });
                    if (valid || (!node.hasElement && !node.plainText)) {
                        const height = Math.round(node.linear.top - bottom);
                        if (height >= 1) {
                            node.modifyBox(BOX_STANDARD.MARGIN_TOP, height);
                        }
                    }
                    bottom = getMarginBottom(node);
                    previous = node;
                }, true);
            }
        }
        get stringId() {
            return (this.nodeId ? `@+id/${this.nodeId}` : '');
        }
        set controlName(value) {
            this._controlName = value;
        }
        get controlName() {
            if (this._controlName != null) {
                return this._controlName;
            }
            else {
                const value = MAP_ELEMENT[this.nodeName];
                return (value != null ? View.getControlName(value) : '');
            }
        }
        set documentParent(value) {
            this._documentParent = value;
        }
        get documentParent() {
            if (this._documentParent != null) {
                return this._documentParent;
            }
            else if (this.id === 0) {
                return this;
            }
            else {
                return this.getParentElementAsNode(false) || View.documentBody();
            }
        }
        set renderParent(value) {
            if (value !== this) {
                value.renderAppend(this);
            }
            this._renderParent = value;
        }
        get renderParent() {
            return this._renderParent || View.documentBody();
        }
        get anchored() {
            return (this.constraint.horizontal && this.constraint.vertical);
        }
        get layoutHorizontal() {
            return (this.linearHorizontal || this.is(NODE_STANDARD.FRAME) || this.hasBit('alignmentType', NODE_ALIGNMENT.HORIZONTAL) || new Set(this.renderChildren.map(node => node.linear.top)).size === 1);
        }
        get layoutVertical() {
            return (this.linearVertical || this.is(NODE_STANDARD.FRAME) || this.hasBit('alignmentType', NODE_ALIGNMENT.VERTICAL));
        }
        get linearHorizontal() {
            return (this._android.orientation === AXIS_ANDROID.HORIZONTAL && this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP));
        }
        get linearVertical() {
            return (this._android.orientation === AXIS_ANDROID.VERTICAL && this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP));
        }
        get inlineWidth() {
            return (this._android.layout_width === 'wrap_content');
        }
        get inlineHeight() {
            return (this._android.layout_height === 'wrap_content');
        }
        get blockWidth() {
            return (this._android.layout_width === 'match_parent');
        }
        get blockHeight() {
            return (this._android.layout_height === 'match_parent');
        }
        get horizontalBias() {
            const parent = this.documentParent;
            if (parent !== this) {
                const left = Math.max(0, this.linear.left - parent.box.left);
                const right = Math.max(0, parent.box.right - this.linear.right);
                return calculateBias(left, right);
            }
            return 0.5;
        }
        get verticalBias() {
            const parent = this.documentParent;
            if (parent !== this) {
                const top = Math.max(0, this.linear.top - parent.box.top);
                const bottom = Math.max(0, parent.box.bottom - this.linear.bottom);
                return calculateBias(top, bottom);
            }
            return 0.5;
        }
    }

    class ViewGroup extends View {
        constructor(id, node, parent, children) {
            super(id, node.api);
            this.baseNode = node;
            this.parent = parent;
            this.children = children;
            this.depth = node.depth;
            this.nodeName = `${node.nodeName}_GROUP`;
            this.documentParent = node.documentParent;
            if (children.length > 0) {
                this.init();
            }
        }
        init() {
            super.init();
            this.children.forEach(item => {
                this.siblingIndex = Math.min(this.siblingIndex, item.siblingIndex);
                item.parent = this;
            });
            this.parent.sort();
            this.setBounds();
            this.css('direction', this.documentParent.dir);
        }
        setLayout() {
            super.setLayout.apply(this, this.childrenBox);
        }
        setBounds(calibrate = false) {
            if (!calibrate) {
                const nodes = this.outerRegion();
                this.bounds = {
                    top: nodes.top[0].linear.top,
                    right: nodes.right[0].linear.right,
                    bottom: nodes.bottom[0].linear.bottom,
                    left: nodes.left[0].linear.left,
                    width: 0,
                    height: 0
                };
                this.bounds.width = this.bounds.right - this.bounds.left;
                this.bounds.height = this.bounds.bottom - this.bounds.top;
            }
            this.linear = assignBounds(this.bounds);
            this.box = assignBounds(this.bounds);
            this.setDimensions();
        }
        previousSibling(lineBreak = false) {
            return (this.children.length > 0 ? this.children[0].previousSibling(lineBreak) : null);
        }
        nextSibling(lineBreak = false) {
            return (this.children.length > 0 ? this.children[this.children.length - 1].nextSibling(lineBreak) : null);
        }
        get pageflow() {
            return this.children.some(node => node.pageflow);
        }
        get display() {
            if (this.has('display')) {
                return this.css('display');
            }
            else {
                return (this.of(NODE_STANDARD.CONSTRAINT, NODE_ALIGNMENT.INLINE_WRAP) || this.children.some(node => (node.block && !node.floating)) ? 'block' : (this.children.every(node => node.inline) ? 'inline' : 'inline-block'));
            }
        }
        get baseElement() {
            function cascade(nodes) {
                for (let i = 0; i < nodes.length; i++) {
                    const item = nodes[i];
                    if (item.hasElement || item.plainText) {
                        return item.element;
                    }
                    else if (item.children.length > 0) {
                        const element = cascade(item.children);
                        if (element != null) {
                            return element;
                        }
                    }
                }
                return null;
            }
            return cascade(this.children) || super.baseElement;
        }
        get inlineElement() {
            return this.hasBit('alignmentType', NODE_ALIGNMENT.SEGMENTED);
        }
        get childrenBox() {
            let minLeft = Number.MAX_VALUE;
            let maxRight = 0;
            let minTop = Number.MAX_VALUE;
            let maxBottom = 0;
            for (const node of this.children) {
                minLeft = Math.min(node.linear.left, minLeft);
                maxRight = Math.max(node.linear.right, maxRight);
                minTop = Math.min(node.linear.top, minTop);
                maxBottom = Math.max(node.linear.bottom, maxBottom);
            }
            return [maxRight - minLeft, maxBottom - minTop];
        }
        outerRegion(dimension = 'linear') {
            let top = [];
            let right = [];
            let bottom = [];
            let left = [];
            const nodes = this.children.slice();
            this.each(node => {
                if (node.companion != null) {
                    nodes.push(node.companion);
                }
            });
            nodes.forEach((node, index) => {
                if (index === 0) {
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
            });
            return { top, right, bottom, left };
        }
    }

    const template = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">',
        '!1',
        '	<stroke android:width="{&width}" {borderStyle} />',
        '!1',
        '!2',
        '	<solid android:color="@color/{&color}" />',
        '!2',
        '!3',
        '	<corners android:radius="{&radius}" />',
        '!3',
        '</shape>',
        '!0'
    ];
    var SHAPERECTANGLE_TMPL = template.join('\n');

    const template$1 = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<layer-list xmlns:android="http://schemas.android.com/apk/res/android">',
        '!1',
        '	<item>',
        '		<shape android:shape="rectangle">',
        '			<solid android:color="@color/{&color}" />',
        '		</shape>',
        '	</item>',
        '!1',
        '!2',
        '	<item android:top="{@top}" android:left="{@left}" android:drawable="@drawable/{image}" width="{@width}" height="{@height}" />',
        '!2',
        '!3',
        '	<item android:top="{@top}" android:left="{@left}">',
        '		<bitmap android:src="@drawable/{image}" android:gravity="{@gravity}" android:tileMode="{@tileMode}" android:tileModeX="{@tileModeX}" android:tileModeY="{@tileModeY}" />',
        '	</item>',
        '!3',
        '!4',
        '	<item android:top="{@top}" android:right="{@right}" android:bottom="{@bottom}" android:left="{@left}">',
        '		<shape android:shape="rectangle">',
        '!5',
        '			<stroke android:width="{&width}" {borderStyle} />',
        '!5',
        '!6',
        '			<corners android:radius="{@radius}" android:topLeftRadius="{@topLeftRadius}" android:topRightRadius="{@topRightRadius}" android:bottomRightRadius="{@bottomRightRadius}" android:bottomLeftRadius="{@bottomLeftRadius}" />',
        '!6',
        '		</shape>',
        '	</item>',
        '!4',
        '!7',
        '	<item>',
        '		<inset android:insetTop="{@top}" android:insetRight="{@right}" android:insetBottom="{@bottom}" android:insetLeft="{@left}">',
        '			<shape android:shape="rectangle">',
        '!8',
        '				<stroke android:width="{&width}" {borderStyle} />',
        '!8',
        '!9',
        '				<corners android:radius="{@radius}" android:topLeftRadius="{@topLeftRadius}" android:topRightRadius="{@topRightRadius}" android:bottomRightRadius="{@bottomRightRadius}" android:bottomLeftRadius="{@bottomLeftRadius}" />',
        '!9',
        '			</shape>',
        '		</inset>',
        '	</item>',
        '!7',
        '</layer-list>',
        '!0'
    ];
    var LAYERLIST_TMPL = template$1.join('\n');

    const METHOD_ANDROID = {
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
            this.file.stored = Resource.STORED;
        }
        static addString(value, name = '') {
            if (value !== '') {
                if (name === '') {
                    name = value;
                }
                const numeric = isNumber(value);
                if (SETTINGS.numberResourceValue || !numeric) {
                    for (const [resourceName, resourceValue] of Resource.STORED.STRINGS.entries()) {
                        if (resourceValue === value) {
                            return resourceName;
                        }
                    }
                    name = name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').split('_').slice(0, 4).join('_').replace(/_+$/g, '');
                    if (numeric || /^[0-9]/.test(name) || RESERVED_JAVA.includes(name)) {
                        name = `__${name}`;
                    }
                    else if (name === '') {
                        name = `__symbol${Math.ceil(Math.random() * 100000)}`;
                    }
                    if (Resource.STORED.STRINGS.has(name)) {
                        name = generateId('strings', `${name}_1`);
                    }
                    Resource.STORED.STRINGS.set(name, value);
                }
                return name;
            }
            return '';
        }
        static addImageSrcSet(element, prefix = '') {
            const srcset = element.srcset.trim();
            const images = {};
            if (srcset !== '') {
                const filepath = element.src.substring(0, element.src.lastIndexOf('/') + 1);
                srcset.split(',').forEach(value => {
                    const match = /^(.*?)\s*([0-9]+\.?[0-9]*x)?$/.exec(value.trim());
                    if (match) {
                        if (match[2] == null) {
                            match[2] = '1x';
                        }
                        const image = filepath + lastIndexOf(match[1]);
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
            return ResourceView.addImage(images, prefix);
        }
        static addImage(images, prefix = '') {
            let src = '';
            if (images && images['mdpi']) {
                src = lastIndexOf(images['mdpi']);
                const format = lastIndexOf(src, '.').toLowerCase();
                src = src.replace(/.\w+$/, '').replace(/-/g, '_');
                switch (format) {
                    case 'bmp':
                    case 'cur':
                    case 'gif':
                    case 'ico':
                    case 'jpg':
                    case 'png':
                        src = Resource.insertStoredAsset('IMAGES', prefix + src, images);
                        break;
                    default:
                        src = '';
                        break;
                }
            }
            return src;
        }
        static addImageURL(value, prefix = '') {
            const url = parseBackgroundUrl(value);
            if (url !== '') {
                return ResourceView.addImage({ 'mdpi': url }, prefix);
            }
            return '';
        }
        static addColor(value, opacity = '1') {
            value = value.toUpperCase().trim();
            const opaque = (parseFloat(opacity) < 1 ? `#${parseFloat(opacity).toFixed(2).substring(2) + value.substring(1)}` : value);
            if (value !== '') {
                let colorName = '';
                if (!Resource.STORED.COLORS.has(opaque)) {
                    const color = getColorNearest(value);
                    if (color !== '') {
                        color.name = cameltoLowerCase(color.name);
                        if (value === color.hex && value === opaque) {
                            colorName = color.name;
                        }
                        else {
                            colorName = generateId('color', `${color.name}_1`);
                        }
                        Resource.STORED.COLORS.set(opaque, colorName);
                    }
                }
                else {
                    colorName = Resource.STORED.COLORS.get(opaque);
                }
                return colorName;
            }
            return '';
        }
        static parseBackgroundPosition(value, fontSize) {
            const match = new RegExp(/([0-9]+[a-z]{2}) ([0-9]+[a-z]{2})/).exec(value);
            if (match) {
                return [convertPX(match[1], fontSize), convertPX(match[2], fontSize)];
            }
            return ['', ''];
        }
        reset() {
            super.reset();
            this.file.reset();
            this.tagStyle = {};
            this.tagCount = {};
        }
        finalize(viewData) {
            this.processFontStyle(viewData);
            const styles = {};
            for (const node of viewData.cache) {
                const children = node.renderChildren.filter(item => item.auto && item.visible);
                if (children.length > 1) {
                    const map = new Map();
                    let style = '';
                    let valid = true;
                    for (let i = 0; i < children.length; i++) {
                        let found = false;
                        children[i].combine('_', 'android').some(value => {
                            if (value.startsWith('style=')) {
                                if (i === 0) {
                                    style = value;
                                }
                                else {
                                    if (style === '' || value !== style) {
                                        valid = false;
                                        return true;
                                    }
                                }
                                found = true;
                            }
                            else {
                                if (!map.has(value)) {
                                    map.set(value, 0);
                                }
                                map.set(value, map.get(value) + 1);
                            }
                            return false;
                        });
                        if (!valid || (style !== '' && !found)) {
                            valid = false;
                            break;
                        }
                    }
                    if (valid) {
                        for (const attr of map.keys()) {
                            if (map.get(attr) !== children.length) {
                                map.delete(attr);
                            }
                        }
                        if (map.size > 1) {
                            if (style !== '') {
                                style = trimString(style.substring(style.indexOf('/') + 1), '"');
                            }
                            const common = [];
                            for (const attr of map.keys()) {
                                const match = attr.match(/(\w+):(\w+)="(.*?)"/);
                                if (match) {
                                    children.forEach(child => child.delete(match[1], match[2]));
                                    common.push(match[0]);
                                }
                            }
                            common.sort();
                            let name = '';
                            for (const index in styles) {
                                if (styles[index].join(';') === common.join(';')) {
                                    name = index;
                                    break;
                                }
                            }
                            if (!(name !== '' && style !== '' && name.startsWith(`${style}.`))) {
                                name = (style !== '' ? `${style}.` : '') + capitalize(node.nodeId);
                                styles[name] = common;
                            }
                            children.forEach(child => child.attr('_', 'style', `@style/${name}`));
                        }
                    }
                }
            }
            for (const name in styles) {
                Resource.STORED.STYLES.set(name, { attributes: styles[name].join(';') });
            }
        }
        setBoxSpacing() {
            super.setBoxSpacing();
            this.cache.elements.filter(node => !node.hasBit('excludeResource', NODE_RESOURCE.BOX_SPACING)).each(node => {
                const stored = getElementCache(node.element, 'boxSpacing');
                if (stored) {
                    if (stored.marginLeft === stored.marginRight && node.alignParent('left') && node.alignParent('right') && !node.blockWidth && !(node.position === 'relative' && node.alignNegative)) {
                        node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
                        node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, null);
                    }
                    if (node.css('marginLeft') === 'auto') {
                        node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
                    }
                    if (node.css('marginRight') === 'auto') {
                        node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, null);
                    }
                }
            });
        }
        setBoxStyle() {
            super.setBoxStyle();
            this.cache.elements.filter(node => !node.hasBit('excludeResource', NODE_RESOURCE.BOX_STYLE)).each(node => {
                const stored = getElementCache(node.element, 'boxStyle');
                if (stored) {
                    if (Array.isArray(stored.backgroundColor) && stored.backgroundColor.length > 0) {
                        stored.backgroundColor = ResourceView.addColor(stored.backgroundColor[0], stored.backgroundColor[2]);
                    }
                    let backgroundImage = stored.backgroundImage.split(',').map(value => value.trim());
                    let backgroundRepeat = stored.backgroundRepeat.split(',').map(value => value.trim());
                    let backgroundPosition = stored.backgroundPosition.split(',').map(value => value.trim());
                    const backgroundImageUrl = [];
                    const backgroundDimensions = [];
                    for (let i = 0; i < backgroundImage.length; i++) {
                        if (backgroundImage[i] !== '' && backgroundImage[i] !== 'none') {
                            backgroundImageUrl.push(backgroundImage[i]);
                            const image = this.imageDimensions.get(parseBackgroundUrl(backgroundImage[i]));
                            backgroundDimensions.push(image);
                            backgroundImage[i] = ResourceView.addImageURL(backgroundImage[i]);
                        }
                        else {
                            backgroundImage[i] = '';
                            backgroundRepeat[i] = '';
                            backgroundPosition[i] = '';
                        }
                    }
                    backgroundImage = backgroundImage.filter(value => value !== '');
                    backgroundRepeat = backgroundRepeat.filter(value => value !== '');
                    backgroundPosition = backgroundPosition.filter(value => value !== '');
                    const method = METHOD_ANDROID['boxStyle'];
                    const companion = node.companion;
                    if (companion && !cssFromParent(companion.element, 'backgroundColor')) {
                        const boxStyle = getElementCache(companion.element, 'boxStyle');
                        if (Array.isArray(boxStyle.backgroundColor) && boxStyle.backgroundColor.length > 0) {
                            stored.backgroundColor = ResourceView.addColor(boxStyle.backgroundColor[0], boxStyle.backgroundColor[2]);
                        }
                    }
                    const hasBorder = (this.borderVisible(stored.borderTop) ||
                        this.borderVisible(stored.borderRight) ||
                        this.borderVisible(stored.borderBottom) ||
                        this.borderVisible(stored.borderLeft) ||
                        stored.borderRadius.length > 0);
                    if (hasBorder || backgroundImage.length > 0) {
                        const borders = [
                            stored.borderTop,
                            stored.borderRight,
                            stored.borderBottom,
                            stored.borderLeft
                        ];
                        borders.forEach((item) => {
                            if (Array.isArray(item.color) && item.color.length > 0) {
                                item.color = ResourceView.addColor(item.color[0], item.color[2]);
                            }
                        });
                        let data;
                        const image2 = [];
                        const image3 = [];
                        let template = null;
                        let resourceName = '';
                        for (let i = 0; i < backgroundImage.length; i++) {
                            let gravity = '';
                            let tileMode = '';
                            let tileModeX = '';
                            let tileModeY = '';
                            let [left, top] = ResourceView.parseBackgroundPosition(backgroundPosition[i], node.css('fontSize'));
                            const image = backgroundDimensions[i];
                            switch (backgroundRepeat[i]) {
                                case 'repeat-x':
                                    if (image == null || image.width < node.bounds.width) {
                                        tileModeX = 'repeat';
                                    }
                                    break;
                                case 'repeat-y':
                                    if (image == null || image.height < node.bounds.height) {
                                        tileModeY = 'repeat';
                                    }
                                    break;
                                case 'no-repeat':
                                    tileMode = 'disabled';
                                    break;
                                case 'repeat':
                                    if (image == null || image.width < node.bounds.width || image.height < node.bounds.height) {
                                        tileMode = 'repeat';
                                    }
                                    break;
                            }
                            if (left === '') {
                                switch (backgroundPosition[i]) {
                                    case 'left top':
                                    case '0% 0%':
                                        gravity = 'left|top';
                                        break;
                                    case 'left center':
                                    case '0% 50%':
                                        gravity = 'left|center_vertical';
                                        break;
                                    case 'left bottom':
                                    case '0% 100%':
                                        gravity = 'left|bottom';
                                        break;
                                    case 'right top':
                                    case '100% 0%':
                                        gravity = 'right|top';
                                        break;
                                    case 'right center':
                                    case '100% 50%':
                                        gravity = 'right|center_vertical';
                                        break;
                                    case 'right bottom':
                                    case '100% 100%':
                                        gravity = 'right|bottom';
                                        break;
                                    case 'center top':
                                    case '50% 0%':
                                        gravity = 'center_horizontal|top';
                                        break;
                                    case 'center bottom':
                                    case '50% 100%':
                                        gravity = 'center_horizontal|bottom';
                                        break;
                                    case 'center center':
                                    case '50% 50%':
                                        gravity = 'center';
                                        break;
                                    default:
                                        const position = backgroundPosition[i].split(' ');
                                        if (position.length === 2) {
                                            function mergeGravity(original, alignment) {
                                                return original + (original !== '' ? '|' : '') + alignment;
                                            }
                                            position.forEach((value, index) => {
                                                if (isPercent(value)) {
                                                    switch (index) {
                                                        case 0:
                                                            if (value === '0%') {
                                                                gravity = mergeGravity(gravity, 'left');
                                                            }
                                                            else if (value === '100%') {
                                                                gravity = mergeGravity(gravity, 'right');
                                                            }
                                                            else {
                                                                left = formatPX(node.bounds.width * (convertInt(value) / 100));
                                                            }
                                                            break;
                                                        case 1:
                                                            if (value === '0%') {
                                                                gravity = mergeGravity(gravity, 'top');
                                                            }
                                                            else if (value === '100%') {
                                                                gravity = mergeGravity(gravity, 'bottom');
                                                            }
                                                            else {
                                                                top = formatPX(node.actualHeight * (convertInt(value) / 100));
                                                            }
                                                            break;
                                                    }
                                                }
                                                else if (/^[a-z]+$/.test(value)) {
                                                    gravity = mergeGravity(gravity, value);
                                                }
                                                else {
                                                    const xy = convertPX(value, node.css('fontSize'));
                                                    if (xy !== '0px') {
                                                        if (index === 0) {
                                                            left = xy;
                                                        }
                                                        else {
                                                            top = xy;
                                                        }
                                                    }
                                                    gravity = mergeGravity(gravity, (index === 0 ? 'left' : 'top'));
                                                }
                                            });
                                        }
                                        break;
                                }
                            }
                            if (stored.backgroundSize.length > 0) {
                                if (isPercent(stored.backgroundSize[0]) || isPercent(stored.backgroundSize[1])) {
                                    if (stored.backgroundSize[0] === '100%' && stored.backgroundSize[1] === '100%') {
                                        tileMode = '';
                                        tileModeX = '';
                                        tileModeY = '';
                                        gravity = '';
                                    }
                                    else if (stored.backgroundSize[0] === '100%') {
                                        tileModeX = '';
                                    }
                                    else if (stored.backgroundSize[1] === '100%') {
                                        tileModeY = '';
                                    }
                                    stored.backgroundSize = [];
                                }
                            }
                            if (node.of(NODE_STANDARD.IMAGE, NODE_ALIGNMENT.SINGLE) && backgroundPosition.length === 1) {
                                node.android('src', `@drawable/${backgroundImage[0]}`);
                                if (convertInt(left) > 0) {
                                    node.modifyBox(BOX_STANDARD.MARGIN_LEFT, convertInt(left));
                                }
                                if (convertInt(top) > 0) {
                                    node.modifyBox(BOX_STANDARD.MARGIN_TOP, convertInt(top));
                                }
                                let scaleType = '';
                                switch (gravity) {
                                    case 'left|top':
                                    case 'left|center_vertical':
                                    case 'left|bottom':
                                        scaleType = 'fitStart';
                                        break;
                                    case 'right|top':
                                    case 'right|center_vertical':
                                    case 'right|bottom':
                                        scaleType = 'fitEnd';
                                        break;
                                    case 'center':
                                    case 'center_horizontal|top':
                                    case 'center_horizontal|bottom':
                                        scaleType = 'center';
                                        break;
                                }
                                node.android('scaleType', scaleType);
                                if (!hasBorder) {
                                    return;
                                }
                                backgroundImage.length = 0;
                            }
                            else {
                                if (gravity !== '' || tileMode !== '' || tileModeX !== '' || tileModeY !== '') {
                                    image3.push({ image: backgroundImage[i], top, left, gravity, tileMode, tileModeX, tileModeY, width: '', height: '' });
                                }
                                else {
                                    image2.push({ image: backgroundImage[i], top, left, gravity, tileMode, tileModeX, tileModeY, width: (stored.backgroundSize.length > 0 ? stored.backgroundSize[0] : ''), height: (stored.backgroundSize.length > 0 ? stored.backgroundSize[1] : '') });
                                }
                            }
                        }
                        image3.sort((a, b) => {
                            if (!(a.tileModeX === 'repeat' || a.tileModeY === 'repeat' || a.tileMode === 'repeat')) {
                                return 1;
                            }
                            else if (!(b.tileModeX === 'repeat' || b.tileModeY === 'repeat' || b.tileMode === 'repeat')) {
                                return -1;
                            }
                            else {
                                if (a.tileMode === 'repeat') {
                                    return -1;
                                }
                                else if (b.tileMode === 'repeat') {
                                    return 1;
                                }
                                else {
                                    return (b.tileModeX === 'repeat' || b.tileModeY === 'repeat' ? 1 : -1);
                                }
                            }
                        });
                        const backgroundColor = this.getShapeAttribute(stored, 'backgroundColor');
                        const radius = this.getShapeAttribute(stored, 'radius');
                        if (stored.border != null && backgroundImage.length === 0) {
                            template = parseTemplate(SHAPERECTANGLE_TMPL);
                            data = {
                                '0': [{
                                        '1': this.getShapeAttribute(stored, 'stroke'),
                                        '2': backgroundColor,
                                        '3': radius
                                    }]
                            };
                        }
                        else {
                            template = parseTemplate(LAYERLIST_TMPL);
                            data = {
                                '0': [{
                                        '1': backgroundColor,
                                        '2': (image2.length > 0 ? image2 : false),
                                        '3': (image3.length > 0 ? image3 : false),
                                        '4': [],
                                        '7': []
                                    }]
                            };
                            const root = getTemplateLevel(data, '0');
                            if (stored.border && this.borderVisible(stored.border)) {
                                if (stored.border.style === 'inset') {
                                    root['7'].push({
                                        '8': this.getShapeAttribute(stored, 'stroke'),
                                        '9': radius
                                    });
                                }
                                else {
                                    root['4'].push({
                                        '5': this.getShapeAttribute(stored, 'stroke'),
                                        '6': radius
                                    });
                                }
                            }
                            else {
                                const borderVisible = borders.filter(item => this.borderVisible(item));
                                const borderWidth = new Set(borderVisible.map(item => item.width));
                                const borderStyle = new Set(borderVisible.map(item => this.getBorderStyle(item)));
                                const [borderStandard, borderInset] = partition(borders, (item) => item.style !== 'inset');
                                if (borderWidth.size === 1 && borderStyle.size === 1) {
                                    const width = borderWidth.values().next().value;
                                    const bottomRight = `-${width}`;
                                    const topLeft = `-${formatPX(parseInt(width) + 1)}`;
                                    root[(borderInset.length > 0 ? '7' : '4')].push({
                                        'top': (this.borderVisible(stored.borderTop) ? '' : topLeft),
                                        'right': (this.borderVisible(stored.borderRight) ? '' : bottomRight),
                                        'bottom': (this.borderVisible(stored.borderBottom) ? '' : bottomRight),
                                        'left': (this.borderVisible(stored.borderLeft) ? '' : topLeft),
                                        [(borderInset.length > 0 ? '8' : '5')]: [{ width, borderStyle: borderStyle.values().next().value }],
                                        [(borderInset.length > 0 ? '9' : '6')]: radius
                                    });
                                }
                                else {
                                    [borderStandard, borderInset].forEach((group, index) => {
                                        group.forEach((border, direction) => {
                                            if (this.borderVisible(border)) {
                                                const bottomRight = `-${border.width}`;
                                                const topLeft = `-${formatPX(parseInt(border.width) + 1)}`;
                                                const layer = {
                                                    'top': topLeft,
                                                    'right': bottomRight,
                                                    'bottom': bottomRight,
                                                    'left': topLeft,
                                                    [(index === 1 ? '8' : '5')]: [{ width: border.width, borderStyle: this.getBorderStyle(border) }],
                                                    [(index === 1 ? '9' : '6')]: radius
                                                };
                                                layer[['top', 'right', 'bottom', 'left'][direction]] = '';
                                                root[(index === 1 ? '7' : '4')].push(layer);
                                            }
                                        });
                                    });
                                }
                            }
                            if (root['4'].length === 0) {
                                root['4'] = false;
                            }
                            if (root['7'].length === 0) {
                                root['7'] = false;
                            }
                        }
                        if (template) {
                            const xml = insertTemplateData(template, data);
                            for (const [name, value] of Resource.STORED.DRAWABLES.entries()) {
                                if (value === xml) {
                                    resourceName = name;
                                    break;
                                }
                            }
                            if (resourceName === '') {
                                resourceName = `${node.nodeName.toLowerCase()}_${node.nodeId}`;
                                Resource.STORED.DRAWABLES.set(resourceName, xml);
                            }
                        }
                        node.formatted(formatString(method['background'], resourceName), (node.renderExtension.length === 0));
                        if (backgroundImage.length > 0) {
                            node.data('RESOURCE', 'backgroundImage', true);
                            if (SETTINGS.autoSizeBackgroundImage &&
                                !node.documentRoot &&
                                !node.imageElement &&
                                node.renderParent.tagName !== 'TABLE' &&
                                !node.hasBit('excludeProcedure', NODE_PROCEDURE.AUTOFIT)) {
                                const sizeParent = { width: 0, height: 0 };
                                backgroundDimensions.forEach(image => {
                                    if (image != null) {
                                        sizeParent.width = Math.max(sizeParent.width, image.width);
                                        sizeParent.height = Math.max(sizeParent.height, image.height);
                                    }
                                });
                                if (sizeParent.width === 0) {
                                    let current = node;
                                    while (current != null && !current.documentBody) {
                                        if (current.viewWidth > 0) {
                                            sizeParent.width = current.viewWidth;
                                        }
                                        if (current.viewHeight > 0) {
                                            sizeParent.height = current.viewHeight;
                                        }
                                        if (!current.pageflow || (sizeParent.width > 0 && sizeParent.height > 0)) {
                                            break;
                                        }
                                        current = current.documentParent;
                                    }
                                }
                                if (!node.has('width', CSS_STANDARD.UNIT)) {
                                    const width = node.bounds.width + (!node.is(NODE_STANDARD.LINE) ? node.borderLeftWidth + node.borderRightWidth : 0);
                                    if (sizeParent.width === 0 || (width > 0 && width < sizeParent.width)) {
                                        node.css('width', formatPX(width));
                                    }
                                }
                                if (!node.has('height', CSS_STANDARD.UNIT)) {
                                    const height = node.actualHeight + (!node.is(NODE_STANDARD.LINE) ? node.borderTopWidth + node.borderBottomWidth : 0);
                                    if (sizeParent.height === 0 || (height > 0 && height < sizeParent.height)) {
                                        node.css('height', formatPX(height));
                                        if (node.marginTop < 0) {
                                            node.modifyBox(BOX_STANDARD.MARGIN_TOP, null);
                                        }
                                        if (node.marginBottom < 0) {
                                            node.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, null);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else if (getElementCache(node.element, 'fontStyle') == null && stored.backgroundColor.length > 0) {
                        node.formatted(formatString(method['backgroundColor'], stored.backgroundColor), (node.renderExtension.length === 0));
                    }
                }
            });
        }
        setFontStyle() {
            super.setFontStyle();
            const tagName = {};
            this.cache.filter(node => node.visible && !node.hasBit('excludeResource', NODE_RESOURCE.FONT_STYLE)).each(node => {
                if (getElementCache(node.element, 'fontStyle')) {
                    if (tagName[node.nodeName] == null) {
                        tagName[node.nodeName] = [];
                    }
                    tagName[node.nodeName].push(node);
                }
                const match = node.css('textShadow').match(/(rgb(?:a)?\([0-9]{1,3}, [0-9]{1,3}, [0-9]{1,3}(?:, [0-9\.]+)?\)) ([0-9\.]+[a-z]{2}) ([0-9\.]+[a-z]{2}) ([0-9\.]+[a-z]{2})/);
                if (match) {
                    const color = parseRGBA(match[1]);
                    if (color.length > 0) {
                        node.android('shadowColor', `@color/${ResourceView.addColor(color[0], color[2])}`);
                    }
                    node.android('shadowDx', convertInt(match[2]).toString());
                    node.android('shadowDy', convertInt(match[3]).toString());
                    node.android('shadowRadius', convertInt(match[4]).toString());
                }
            });
            for (const tag in tagName) {
                const nodes = new NodeList(tagName[tag]);
                const sorted = [];
                for (let node of nodes) {
                    let system = false;
                    const nodeId = node.id;
                    if (node.companion != null && (node.companion.textElement || node.companion.tagName === 'LABEL')) {
                        node = node.companion;
                    }
                    const element = node.element;
                    const stored = Object.assign({}, getElementCache(element, 'fontStyle'));
                    if (Array.isArray(stored.backgroundColor) && stored.backgroundColor.length > 0) {
                        stored.backgroundColor = `@color/${ResourceView.addColor(stored.backgroundColor[0], stored.backgroundColor[2])}`;
                    }
                    if (stored.fontFamily) {
                        let fontFamily = stored.fontFamily.toLowerCase().split(',')[0].replace(/"/g, '').trim();
                        let fontStyle = '';
                        let fontWeight = '';
                        if (Array.isArray(stored.color) && stored.color.length > 0) {
                            stored.color = `@color/${ResourceView.addColor(stored.color[0], stored.color[2])}`;
                        }
                        if (SETTINGS.fontAliasResourceValue && FONTREPLACE_ANDROID[fontFamily] != null) {
                            fontFamily = FONTREPLACE_ANDROID[fontFamily];
                        }
                        if ((FONT_ANDROID[fontFamily] != null && SETTINGS.targetAPI >= FONT_ANDROID[fontFamily]) || (SETTINGS.fontAliasResourceValue && FONTALIAS_ANDROID[fontFamily] != null && SETTINGS.targetAPI >= FONT_ANDROID[FONTALIAS_ANDROID[fontFamily]])) {
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
                            fontFamily = convertWord(fontFamily);
                            stored.fontFamily = `@font/${fontFamily + (stored.fontStyle !== 'normal' ? `_${stored.fontStyle}` : '') + (stored.fontWeight !== '400' ? `_${FONTWEIGHT_ANDROID[stored.fontWeight] || stored.fontWeight}` : '')}`;
                            fontStyle = stored.fontStyle;
                            fontWeight = stored.fontWeight;
                            delete stored.fontStyle;
                            delete stored.fontWeight;
                        }
                        if (!system) {
                            const fonts = Resource.STORED.FONTS.get(fontFamily) || {};
                            Object.assign(fonts, { [`${fontStyle}-${fontWeight}`]: true });
                            Resource.STORED.FONTS.set(fontFamily, fonts);
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
                            if (node.supported('android', keys[i])) {
                                const attr = formatString(method[keys[i]], value);
                                if (sorted[i][attr] == null) {
                                    sorted[i][attr] = [];
                                }
                                sorted[i][attr].push(nodeId);
                            }
                        }
                    }
                }
                const tagStyle = this.tagStyle[tag];
                if (tagStyle) {
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
                    this.tagCount[tag] += nodes.visible.length;
                }
                else {
                    this.tagCount[tag] = nodes.visible.length;
                }
                this.tagStyle[tag] = sorted;
            }
        }
        setImageSource() {
            this.cache.filter(node => node.visible &&
                (node.imageElement || (node.tagName === 'INPUT' && node.element.type === 'image')) &&
                !node.hasBit('excludeResource', NODE_RESOURCE.IMAGE_SOURCE)).each(node => {
                const element = node.element;
                if (getElementCache(element, 'imageSource') == null || SETTINGS.alwaysReevaluateResources) {
                    const result = (node.imageElement ? ResourceView.addImageSrcSet(element) : ResourceView.addImage({ 'mdpi': element.src }));
                    if (result !== '') {
                        const method = METHOD_ANDROID['imageSource'];
                        node.formatted(formatString(method['src'], result), (node.renderExtension.length === 0));
                        setElementCache(element, 'imageSource', result);
                    }
                }
            });
        }
        setOptionArray() {
            super.setOptionArray();
            this.cache.filter(node => node.visible &&
                node.tagName === 'SELECT' &&
                !node.hasBit('excludeResource', NODE_RESOURCE.OPTION_ARRAY)).each(node => {
                const stored = getElementCache(node.element, 'optionArray');
                if (stored) {
                    const method = METHOD_ANDROID['optionArray'];
                    let result = [];
                    if (stored.stringArray != null) {
                        result = stored.stringArray.map(value => {
                            const name = ResourceView.addString(value);
                            return (name !== '' ? `@string/${name}` : '');
                        }).filter(name => name);
                    }
                    if (stored.numberArray != null) {
                        result = stored.numberArray;
                    }
                    let arrayName = '';
                    const arrayValue = result.join('-');
                    for (const [storedName, storedResult] of Resource.STORED.ARRAYS.entries()) {
                        if (arrayValue === storedResult.join('-')) {
                            arrayName = storedName;
                            break;
                        }
                    }
                    if (arrayName === '') {
                        arrayName = `${node.nodeId}_array`;
                        Resource.STORED.ARRAYS.set(arrayName, result);
                    }
                    node.formatted(formatString(method['entries'], arrayName), (node.renderExtension.length === 0));
                }
            });
        }
        setValueString() {
            super.setValueString();
            this.cache.filter(node => node.visible && !node.hasBit('excludeResource', NODE_RESOURCE.VALUE_STRING)).each(node => {
                const stored = getElementCache(node.element, 'valueString');
                if (stored) {
                    if (node.renderParent.of(NODE_STANDARD.RELATIVE, NODE_ALIGNMENT.INLINE_WRAP)) {
                        if (node.alignParent('left') && !cssParent(node.element, 'whiteSpace', 'pre', 'pre-wrap')) {
                            const value = node.textContent;
                            let leadingSpace = 0;
                            for (let i = 0; value.length; i++) {
                                switch (value.charCodeAt(i)) {
                                    case 32:
                                        continue;
                                    case 160:
                                        leadingSpace++;
                                        continue;
                                }
                                break;
                            }
                            if (leadingSpace === 0) {
                                stored.value = stored.value.replace(/^(\s|&#160;)+/, '');
                            }
                        }
                    }
                    if (node.hasElement && node.is(NODE_STANDARD.TEXT)) {
                        switch (node.css('fontVariant')) {
                            case 'small-caps':
                                stored.value = stored.value.toUpperCase();
                                break;
                        }
                        const match = node.css('textDecoration').match(/(underline|line-through)/);
                        if (match) {
                            switch (match[0]) {
                                case 'underline':
                                    stored.value = `<u>${stored.value}</u>`;
                                    break;
                                case 'line-through':
                                    stored.value = `<strike>${stored.value}</strike>`;
                                    break;
                            }
                        }
                    }
                    const name = ResourceView.addString(stored.value, stored.name);
                    if (name !== '') {
                        const method = METHOD_ANDROID['valueString'];
                        if ((node.toInt('textIndent') + node.bounds.width) > 0) {
                            node.formatted(formatString(method['text'], (isNaN(parseInt(name)) || parseInt(name).toString() !== name ? `@string/${name}` : name)), (node.renderExtension.length === 0));
                        }
                    }
                }
            });
        }
        addTheme(template, data, options) {
            const map = parseTemplate(template);
            if (options.item != null) {
                const root = getTemplateLevel(data, '0');
                for (const name in options.item) {
                    let value = options.item[name];
                    const hex = parseHex(value);
                    if (hex !== '') {
                        value = `@color/${ResourceView.addColor(hex)}`;
                    }
                    root['1'].push({ name, value });
                }
            }
            const xml = insertTemplateData(map, data);
            this.addFile(options.output.path, options.output.file, xml);
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
                        if (b[attr] != null) {
                            maxB = Math.max(b[attr].length, maxB);
                            countB += b[attr].length;
                        }
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
                                    sorted[i] = {};
                                    revalidate = true;
                                }
                                else if (ids.length === 1) {
                                    layoutKey[attr1] = ids;
                                    sorted[i][attr1] = [];
                                    revalidate = true;
                                }
                                if (!revalidate) {
                                    const found = {};
                                    let merged = false;
                                    for (let j = 0; j < sorted.length; j++) {
                                        if (i !== j) {
                                            for (const attr in sorted[j]) {
                                                const compare$$1 = sorted[j][attr];
                                                if (compare$$1.length > 0) {
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
                tagData.forEach((item, index) => item.name = capitalize(tagName) + (index > 0 ? `_${index}` : ''));
                resource[tagName] = tagData;
            }
            const inherit = new Set();
            const mapNode = {};
            for (const tagName in resource) {
                for (const group of resource[tagName]) {
                    for (const id of group.ids) {
                        if (mapNode[id] == null) {
                            mapNode[id] = { styles: [], attributes: [] };
                        }
                        mapNode[id].styles.push(group.name);
                    }
                }
                const tagData = layout[tagName];
                if (tagData != null) {
                    for (const attr in tagData) {
                        for (const id of tagData[attr]) {
                            if (mapNode[id] == null) {
                                mapNode[id] = { styles: [], attributes: [] };
                            }
                            mapNode[id].attributes.push(attr);
                        }
                    }
                }
            }
            for (const id in mapNode) {
                const node = viewData.cache.locate('id', parseInt(id));
                if (node) {
                    const styles = mapNode[id].styles;
                    const attrs = mapNode[id].attributes;
                    if (styles.length > 0) {
                        inherit.add(styles.join('.'));
                        node.attr('_', 'style', `@style/${styles.pop()}`);
                    }
                    if (attrs.length > 0) {
                        attrs.sort().forEach(value => node.formatted(replaceUnit(value, true), false));
                    }
                }
            }
            for (const styles of inherit) {
                let parent = '';
                styles.split('.').forEach((value) => {
                    const match = value.match(/^(\w*?)(?:_([0-9]+))?$/);
                    if (match) {
                        const tagData = resource[match[1].toUpperCase()][(match[2] == null ? 0 : parseInt(match[2]))];
                        Resource.STORED.STYLES.set(value, { parent, attributes: tagData.attributes });
                        parent = value;
                    }
                });
            }
        }
        deleteStyleAttribute(sorted, attrs, ids) {
            attrs.split(';').forEach(value => {
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
                    return (stored.border && stored.border.width !== '0px' ? [{ width: stored.border.width, borderStyle: this.getBorderStyle(stored.border) }] : false);
                case 'backgroundColor':
                    return (stored.backgroundColor.length !== 0 && stored.backgroundColor !== '' ? [{ color: stored.backgroundColor }] : false);
                case 'radius':
                    if (stored.borderRadius.length === 1) {
                        if (stored.borderRadius[0] !== '0px') {
                            return [{ radius: stored.borderRadius[0] }];
                        }
                    }
                    else if (stored.borderRadius.length > 1) {
                        const result = {};
                        stored.borderRadius.forEach((value, index) => result[`${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius`] = value);
                        return [result];
                    }
                    return false;
            }
            return false;
        }
    }

    function createPlaceholder(nextId, node, children = []) {
        const placeholder = new View(nextId, node.api, node.element);
        placeholder.parent = node.parent;
        for (const child of children) {
            child.parent = placeholder;
        }
        placeholder.inherit(node, 'base');
        placeholder.auto = false;
        placeholder.excludeResource |= NODE_RESOURCE.ALL;
        return placeholder;
    }
    function locateExtension(node, extension) {
        return Array.from(node.element.children).find((element) => includes(optional(element, 'dataset.ext'), extension));
    }
    function getTargetDepth(id) {
        const node = getNodeFromElement(document.getElementById(id));
        if (node) {
            if (hasValue(node.dataset.include)) {
                return (hasValue(node.dataset.includeMerge) ? 1 : 0);
            }
            else {
                return node.depth;
            }
        }
        return -1;
    }
    function formatResource(options) {
        for (const namespace in options) {
            const object = options[namespace];
            if (typeof object === 'object') {
                for (const attr in object) {
                    if (object[attr] != null) {
                        let value = object[attr].toString();
                        switch (namespace) {
                            case 'android':
                                switch (attr) {
                                    case 'text':
                                        if (!value.startsWith('@string/') && (SETTINGS.numberResourceValue || !isNumber(value))) {
                                            value = ResourceView.addString(value);
                                            if (value !== '') {
                                                object[attr] = `@string/${value}`;
                                                continue;
                                            }
                                        }
                                        break;
                                    case 'src':
                                        if (/^\w+:\/\//.test(value)) {
                                            value = ResourceView.addImage({ 'mdpi': value });
                                            if (value !== '') {
                                                object[attr] = `@drawable/${value}`;
                                                continue;
                                            }
                                        }
                                        break;
                                }
                                break;
                        }
                        const hex = parseHex(value);
                        if (hex !== '') {
                            object[attr] = `@color/${ResourceView.addColor(hex)}`;
                        }
                    }
                }
            }
        }
        return options;
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

    const MAP_LAYOUT = {
        relativeParent: {
            top: 'layout_alignParentTop',
            bottom: 'layout_alignParentBottom'
        },
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
    const MAP_CHAIN = {
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
            this._merge = {};
            resetId();
        }
        finalize(data) {
            this.setAttributes(data);
            for (const value of [...data.views, ...data.includes]) {
                value.content = removePlaceholders(value.content).replace(/\n\n/g, '\n');
                if (SETTINGS.dimensResourceValue) {
                    value.content = this.parseDimensions(value.content);
                }
                value.content = replaceUnit(value.content);
                value.content = replaceTab(value.content, SETTINGS.insertSpaces);
            }
        }
        reset() {
            super.reset();
            resetId();
            this._merge = {};
        }
        setConstraints() {
            Object.assign(MAP_LAYOUT.relativeParent, {
                left: parseRTL('layout_alignParentLeft'),
                right: parseRTL('layout_alignParentRight')
            });
            Object.assign(MAP_LAYOUT.relative, {
                left: parseRTL('layout_alignLeft'),
                right: parseRTL('layout_alignRight'),
                leftRight: parseRTL('layout_toRightOf'),
                rightLeft: parseRTL('layout_toLeftOf')
            });
            Object.assign(MAP_LAYOUT.constraint, {
                left: parseRTL('layout_constraintLeft_toLeftOf'),
                right: parseRTL('layout_constraintRight_toRightOf'),
                leftRight: parseRTL('layout_constraintLeft_toRightOf'),
                rightLeft: parseRTL('layout_constraintRight_toLeftOf')
            });
            const relativeParent = MAP_LAYOUT.relativeParent;
            let mapLayout;
            let constraint = false;
            let relative = false;
            function mapParent(node, direction) {
                if (constraint) {
                    return (node.app(mapLayout[direction]) === 'parent');
                }
                else {
                    return (node.android(relativeParent[direction]) === 'true');
                }
            }
            function mapSibling(node, direction) {
                return node[(constraint ? 'app' : 'android')](mapLayout[direction]);
            }
            function mapDelete(node, ...direction) {
                node.delete((constraint ? 'app' : 'android'), ...direction.map(value => mapLayout[value]));
            }
            function anchored(list) {
                return list.filter(node => node.anchored);
            }
            function resolveAnchor(node, nodes, orientation) {
                if (!node.constraint[orientation]) {
                    let parent = node;
                    while (parent != null) {
                        const stringId = mapSibling(parent, (orientation === AXIS_ANDROID.HORIZONTAL ? 'leftRight' : 'topBottom'));
                        if (stringId) {
                            parent = nodes.locate('nodeId', stripId(stringId));
                            if (parent && parent.constraint[orientation]) {
                                return true;
                            }
                        }
                        else {
                            parent = null;
                        }
                    }
                    return false;
                }
                return true;
            }
            function deleteConstraints(node, stringId = '', parent = false) {
                for (const attr in mapLayout) {
                    const value = node.app(mapLayout[attr]);
                    if ((value !== 'parent' || parent) && (stringId === '' || value === stringId)) {
                        node.delete('app', mapLayout[attr]);
                    }
                }
                node.constraint.horizontal = (mapParent(node, 'left') || mapParent(node, 'right'));
                node.constraint.vertical = (mapParent(node, 'top') || mapParent(node, 'bottom'));
            }
            function adjustBaseline(nodes) {
                if (nodes.length > 1) {
                    const baseline = NodeList.textBaseline(nodes);
                    if (baseline.length > 0) {
                        const unaligned = [];
                        for (const node of nodes) {
                            if (!baseline.includes(node)) {
                                if (node.baseline && (node.nodeType <= NODE_STANDARD.IMAGE || (node.linearHorizontal && node.renderChildren.some(item => item.nodeType <= NODE_STANDARD.IMAGE)))) {
                                    const alignWith = baseline[0];
                                    if (alignWith.alignOrigin) {
                                        node.android(mapLayout['baseline'], alignWith.stringId);
                                    }
                                    else {
                                        if (alignWith.position === 'relative' && node.bounds.height < alignWith.bounds.height && node.lineHeight === 0) {
                                            node.android(mapLayout[(convertInt(alignWith.top) > 0 ? 'top' : 'bottom')], alignWith.stringId);
                                        }
                                    }
                                }
                                else {
                                    unaligned.push(node);
                                }
                            }
                        }
                        if (unaligned.length > 0) {
                            const realign = unaligned.filter(node => node.toInt('verticalAlign') !== 0).sort((a, b) => (a.toInt('verticalAlign') >= b.toInt('verticalAlign') ? -1 : 1));
                            if (realign.length > 0 && realign[0].textElement) {
                                const verticalAlign = Math.abs(realign[0].toInt('verticalAlign'));
                                for (const item of baseline) {
                                    const marginTop = realign[0].bounds.height - (item.bounds.height + verticalAlign);
                                    item.modifyBox(BOX_STANDARD.MARGIN_TOP, marginTop, true);
                                }
                                for (let i = 0; i < realign.length; i++) {
                                    const item = realign[i];
                                    if (i > 0) {
                                        item.css('verticalAlign', (item.toInt('verticalAlign') + verticalAlign).toString());
                                    }
                                    else {
                                        item.css('verticalAlign', 'baseline');
                                    }
                                }
                            }
                        }
                    }
                }
            }
            for (const node of this.cache.visible) {
                constraint = node.is(NODE_STANDARD.CONSTRAINT);
                relative = node.is(NODE_STANDARD.RELATIVE);
                const flex = node.flex;
                if (constraint || relative || flex.enabled) {
                    const nodes = new NodeList(node.renderChildren.filter(item => item.auto), node);
                    if (relative) {
                        mapLayout = MAP_LAYOUT.relative;
                        const rows = [];
                        const baseline = [];
                        const textIndent = node.toInt('textIndent');
                        const floatAligned = nodes.list.some((item => item.floating));
                        let multiLine = nodes.list.some((item, index) => (index > 0 && node.linear.top >= nodes.get(index - 1).linear.bottom) || item.multiLine);
                        let boxWidth = node.box.width;
                        if (node.renderParent.overflowX) {
                            boxWidth = convertInt(node.renderParent.cssOriginal('width')) || node.viewWidth || boxWidth;
                            multiLine = true;
                        }
                        else if (node.renderParent.hasBit('alignmentType', NODE_ALIGNMENT.FLOAT)) {
                            const minLeft = Math.min.apply(null, nodes.list.map(item => item.linear.left));
                            const maxRight = Math.max.apply(null, nodes.list.map(item => item.linear.right));
                            boxWidth = maxRight - minLeft;
                        }
                        let rowWidth = 0;
                        let rowPaddingLeft = 0;
                        let rowPreviousLeft = null;
                        let rowPreviousBottom = null;
                        if (textIndent < 0 && Math.abs(textIndent) <= node.paddingLeft) {
                            rowPaddingLeft = Math.abs(textIndent);
                            node.modifyBox(BOX_STANDARD.PADDING_LEFT, node.paddingLeft + textIndent);
                            node.modifyBox(BOX_STANDARD.PADDING_LEFT, null);
                        }
                        for (let i = 0; i < nodes.length; i++) {
                            const current = nodes.get(i);
                            let dimension = current[(current.multiLine ? 'bounds' : 'linear')];
                            if (i === 0) {
                                current.android(relativeParent['left'], 'true');
                                rowWidth += dimension.width;
                                if (!node.inline && textIndent > 0) {
                                    current.modifyBox(BOX_STANDARD.MARGIN_LEFT, textIndent);
                                }
                                if (SETTINGS.ellipsisOnTextOverflow && rowPaddingLeft > 0) {
                                    current.android('singleLine', 'true');
                                }
                                if (!current.siblingflow || (current.floating && current.position === 'relative') || (current.multiLine && textIndent < 0)) {
                                    rowPreviousLeft = current;
                                }
                                rows[rows.length] = [current];
                            }
                            else {
                                const previous = nodes.get(i - 1);
                                const previousViewGroup = (previous instanceof ViewGroup || previous.is(NODE_STANDARD.LINEAR));
                                const viewGroup = (current instanceof ViewGroup || current.is(NODE_STANDARD.LINEAR));
                                const items = rows[rows.length - 1];
                                if (current.hasElement && current.multiLine) {
                                    dimension = getRangeClientRect(current.element)[0];
                                }
                                const siblings = getElementsBetweenSiblings(previous.baseElement, current.baseElement, false, true);
                                let connected = false;
                                if (i === 1 && previous.textElement && current.textElement) {
                                    connected = (siblings.length === 0 && !/\s+$/.test(previous.textContent) && !/^\s+/.test(current.textContent));
                                }
                                if (viewGroup ||
                                    (!multiLine && (current.linear.top >= previous.linear.bottom || withinFraction(current.linear.left, node.box.left))) ||
                                    (siblings.length > 0 && siblings.some(element => isLineBreak(element))) ||
                                    (!connected && ((multiLine && (!previous.floating || items.length > 1) && (Math.floor(rowWidth - current.marginLeft) + dimension.width > boxWidth)) ||
                                        (current.multiLine && hasLineBreak(current.element))))) {
                                    rowPreviousBottom = items.filter(item => !item.floating)[0] || items[0];
                                    for (let j = 0; j < items.length; j++) {
                                        if (items[j] !== rowPreviousBottom && ((items[j].floating && rowPreviousBottom.floating) || !items[j].floating) && items[j].linear.bottom > rowPreviousBottom.linear.bottom) {
                                            rowPreviousBottom = items[j];
                                        }
                                    }
                                    if (viewGroup || (previousViewGroup && i === nodes.length - 1)) {
                                        current.constraint.marginVertical = rowPreviousBottom.stringId;
                                    }
                                    current.anchor(mapLayout['topBottom'], rowPreviousBottom.stringId);
                                    if (rowPreviousLeft && current.linear.top < rowPreviousLeft.bounds.bottom && !withinRange(current.bounds.top, rowPreviousLeft.bounds.top, 1) && !withinRange(current.bounds.bottom, rowPreviousLeft.bounds.bottom, 1)) {
                                        current.anchor(mapLayout['leftRight'], rowPreviousLeft.stringId);
                                    }
                                    else {
                                        current.anchor(relativeParent['left'], 'true');
                                        rowPreviousLeft = null;
                                    }
                                    rowWidth = dimension.width;
                                    if (SETTINGS.ellipsisOnTextOverflow &&
                                        previous != null &&
                                        (rows[rows.length - 1].length > 2 || previous.linearHorizontal) &&
                                        i < nodes.length - 1) {
                                        let lastChild = previous;
                                        if (previous.linearHorizontal) {
                                            lastChild = previous.children[previous.children.length - 1];
                                        }
                                        if (lastChild.multiLine) {
                                            lastChild.android('singleLine', 'true');
                                        }
                                    }
                                    if (rowPaddingLeft > 0) {
                                        current.modifyBox(BOX_STANDARD.PADDING_LEFT, rowPaddingLeft);
                                    }
                                    if (!floatAligned) {
                                        adjustBaseline(baseline);
                                        baseline.length = 0;
                                    }
                                    rows.push([current]);
                                }
                                else {
                                    if (i === 1 && rowPaddingLeft > 0 && !previous.plainText) {
                                        current.anchor(relativeParent['left'], 'true');
                                        current.modifyBox(BOX_STANDARD.PADDING_LEFT, rowPaddingLeft);
                                    }
                                    else {
                                        current.anchor(mapLayout['leftRight'], previous.stringId);
                                    }
                                    if (rowPreviousBottom != null) {
                                        current.anchor(mapLayout['topBottom'], rowPreviousBottom.stringId);
                                    }
                                    rowWidth += dimension.width;
                                    items.push(current);
                                }
                            }
                            if (!floatAligned) {
                                baseline.push(current);
                            }
                        }
                        if (!floatAligned) {
                            adjustBaseline(baseline);
                        }
                        if (SETTINGS.ellipsisOnTextOverflow && (node.hasBit('alignmentType', NODE_ALIGNMENT.HORIZONTAL) || rows.length === 1)) {
                            for (let i = 1; i < nodes.length; i++) {
                                const item = nodes.get(i);
                                if (!item.multiLine && !item.floating && (!item.alignParent('left') || rows.length === 1)) {
                                    item.android('singleLine', 'true');
                                }
                            }
                        }
                    }
                    else {
                        mapLayout = MAP_LAYOUT.constraint;
                        if (node.hasBit('alignmentType', NODE_ALIGNMENT.HORIZONTAL)) {
                            const optimal = NodeList.textBaseline(nodes.list, false, true)[0];
                            const baseline = nodes.list.filter(item => item.textElement && item.baseline);
                            const image = nodes.list.filter(item => item.imageElement && item.baseline);
                            if (image.length > 0) {
                                baseline.forEach(item => item.app(mapLayout['baseline'], image[0].stringId));
                            }
                            for (let i = 0; i < nodes.length; i++) {
                                const current = nodes.get(i);
                                let alignWith = optimal;
                                if (i === 0) {
                                    current.app(mapLayout['left'], 'parent');
                                }
                                else {
                                    const previous = nodes.get(i - 1);
                                    current.app(mapLayout['leftRight'], previous.stringId);
                                    current.constraint.marginHorizontal = previous.stringId;
                                }
                                if (image.length > 0 && baseline.includes(current)) {
                                    continue;
                                }
                                const verticalAlign = current.css('verticalAlign');
                                if (alignWith == null || verticalAlign.startsWith('text') || optimal === current) {
                                    baseline.some(item => {
                                        if (item !== current) {
                                            alignWith = item;
                                            return true;
                                        }
                                        return false;
                                    });
                                    if (alignWith == null) {
                                        nodes.list.slice().sort((a, b) => (a.nodeType <= b.nodeType ? -1 : 1)).some(item => {
                                            if (item !== current) {
                                                alignWith = item;
                                                return true;
                                            }
                                            return false;
                                        });
                                    }
                                }
                                switch (verticalAlign) {
                                    case 'text-top':
                                        if (alignWith != null) {
                                            current.app(mapLayout['top'], alignWith.stringId);
                                        }
                                        break;
                                    case 'top':
                                        current.app(mapLayout['top'], 'parent');
                                        break;
                                    case 'middle':
                                        this.setAlignParent(current, AXIS_ANDROID.VERTICAL);
                                        break;
                                    case 'baseline':
                                        if (alignWith != null) {
                                            current.app(mapLayout['baseline'], alignWith.stringId);
                                        }
                                        break;
                                    case 'text-bottom':
                                        if (alignWith != null) {
                                            current.app(mapLayout['bottom'], alignWith.stringId);
                                        }
                                        break;
                                    case 'bottom':
                                        current.app(mapLayout['bottom'], 'parent');
                                        break;
                                }
                            }
                        }
                        else {
                            const [absolute, pageflow] = nodes.partition(item => !item.pageflow || (item.position === 'relative' && item.alignNegative));
                            const columnCount = node.toInt('columnCount');
                            const inlineWrap = node.hasBit('alignmentType', NODE_ALIGNMENT.INLINE_WRAP);
                            if (inlineWrap) {
                                node.android('layout_width', 'match_parent');
                            }
                            else {
                                if (pageflow.length > 0 && (columnCount <= 1 || flex.enabled)) {
                                    for (const current of pageflow) {
                                        const parent = current.documentParent;
                                        if (current.centerMarginHorizontal) {
                                            this.setAlignParent(current, AXIS_ANDROID.HORIZONTAL);
                                        }
                                        else {
                                            if (current.linear.left <= parent.box.left || withinFraction(current.linear.left, parent.box.left)) {
                                                current.anchor(mapLayout['left'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                            }
                                            if (current.linear.right >= parent.box.right || withinFraction(current.linear.right, parent.box.right)) {
                                                current.anchor(mapLayout['right'], 'parent', (parent.viewWidth > 0 || current.float === 'right' || current.autoLeftMargin ? AXIS_ANDROID.HORIZONTAL : ''));
                                            }
                                        }
                                        if (current.linear.top <= parent.box.top || withinFraction(current.linear.top, parent.box.top)) {
                                            current.anchor(mapLayout['top'], 'parent', AXIS_ANDROID.VERTICAL);
                                        }
                                        else if (current.linear.bottom >= parent.box.bottom || withinFraction(current.linear.bottom, parent.box.bottom)) {
                                            current.anchor(mapLayout['bottom'], 'parent', (parent.viewHeight > 0 ? AXIS_ANDROID.VERTICAL : ''));
                                        }
                                        for (const adjacent of pageflow) {
                                            if (current !== adjacent) {
                                                const stringId = adjacent.stringId;
                                                const horizontal = (resolveAnchor(adjacent, nodes, AXIS_ANDROID.HORIZONTAL) ? AXIS_ANDROID.HORIZONTAL : '');
                                                const vertical = (resolveAnchor(adjacent, nodes, AXIS_ANDROID.VERTICAL) ? AXIS_ANDROID.VERTICAL : '');
                                                const intersectY = current.intersectY(adjacent.linear);
                                                const alignOrigin = (current.alignOrigin && adjacent.alignOrigin);
                                                if (current.viewWidth === 0 && current.linear.left === adjacent.linear.left && current.linear.right === adjacent.linear.right) {
                                                    if (!mapParent(current, 'right')) {
                                                        current.anchor(mapLayout['left'], stringId);
                                                    }
                                                    if (!mapParent(current, 'left')) {
                                                        current.anchor(mapLayout['right'], stringId);
                                                    }
                                                }
                                                if (!current.centerMarginHorizontal) {
                                                    if ((!current.constraint.horizontal && alignOrigin && withinRange(current.linear.left, adjacent.linear.right, SETTINGS.constraintWhitespaceHorizontalOffset)) || withinFraction(current.linear.left, adjacent.linear.right)) {
                                                        if (current.float !== 'right' || current.float === adjacent.float) {
                                                            current.anchor(mapLayout['leftRight'], stringId, horizontal, current.withinX(adjacent.linear));
                                                        }
                                                    }
                                                    if ((!current.constraint.horizontal && alignOrigin && withinRange(current.linear.right, adjacent.linear.left, SETTINGS.constraintWhitespaceHorizontalOffset)) || withinFraction(current.linear.right, adjacent.linear.left)) {
                                                        current.anchor(mapLayout['rightLeft'], stringId, horizontal, current.withinX(adjacent.linear));
                                                    }
                                                }
                                                const topParent = mapParent(current, 'top');
                                                const bottomParent = mapParent(current, 'bottom');
                                                const blockElement = (!flex.enabled && !current.inlineElement);
                                                if ((alignOrigin && withinRange(current.linear.top, adjacent.linear.bottom, SETTINGS.constraintWhitespaceVerticalOffset)) || withinFraction(current.linear.top, adjacent.linear.bottom)) {
                                                    if (intersectY || !bottomParent || blockElement) {
                                                        current.anchor(mapLayout['topBottom'], stringId, vertical, intersectY);
                                                    }
                                                }
                                                if ((alignOrigin && withinRange(current.linear.bottom, adjacent.linear.top, SETTINGS.constraintWhitespaceVerticalOffset)) || withinFraction(current.linear.bottom, adjacent.linear.top)) {
                                                    if (intersectY || !topParent || blockElement) {
                                                        current.anchor(mapLayout['bottomTop'], stringId, vertical, intersectY);
                                                    }
                                                }
                                                if (!topParent && !bottomParent) {
                                                    if (current.linear.top === adjacent.linear.top) {
                                                        current.anchor(mapLayout['top'], stringId, vertical);
                                                    }
                                                    if (current.linear.bottom === adjacent.linear.bottom) {
                                                        current.anchor(mapLayout['bottom'], stringId, vertical);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                if (absolute.length > 0) {
                                    node.setMinBounds();
                                    for (const current of absolute) {
                                        if (current.top != null && current.toInt('top') === 0) {
                                            current.anchor(mapLayout['top'], 'parent', AXIS_ANDROID.VERTICAL);
                                        }
                                        if (current.right != null && current.toInt('right') >= 0) {
                                            current.anchor(mapLayout['right'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                            if (current.centerMarginHorizontal && current.toInt('left') > 0) {
                                                current.anchor(mapLayout['left'], 'parent');
                                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.toInt('left'));
                                            }
                                        }
                                        if (current.bottom != null && current.toInt('bottom') >= 0) {
                                            current.anchor(mapLayout['bottom'], 'parent', AXIS_ANDROID.VERTICAL);
                                        }
                                        if (current.left != null && current.toInt('left') === 0) {
                                            current.anchor(mapLayout['left'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                            if (current.centerMarginHorizontal && current.toInt('right') > 0) {
                                                current.anchor(mapLayout['right'], 'parent');
                                                current.modifyBox(BOX_STANDARD.MARGIN_RIGHT, current.toInt('right'));
                                            }
                                        }
                                        if (current.left === 0 && current.right === 0 && !current.floating && !isPercent(current.css('width'))) {
                                            current.android('layout_width', 'match_parent');
                                        }
                                        if (current.top === 0 && current.bottom === 0) {
                                            current.android('layout_height', 'match_parent');
                                        }
                                    }
                                }
                                for (const current of nodes) {
                                    const leftRight = mapSibling(current, 'leftRight');
                                    if (leftRight) {
                                        if (!current.constraint.horizontal) {
                                            current.constraint.horizontal = flex.enabled || resolveAnchor(current, nodes, AXIS_ANDROID.HORIZONTAL);
                                        }
                                        current.constraint.marginHorizontal = leftRight;
                                    }
                                    const topBottom = mapSibling(current, 'topBottom');
                                    if (topBottom) {
                                        if (!current.constraint.vertical) {
                                            current.constraint.vertical = flex.enabled || resolveAnchor(current, nodes, AXIS_ANDROID.VERTICAL);
                                        }
                                        current.constraint.marginVertical = topBottom;
                                        mapDelete(current, 'top');
                                    }
                                    if (mapParent(current, 'left') && mapParent(current, 'right')) {
                                        if (current.autoMargin) {
                                            if (current.autoLeftMargin) {
                                                mapDelete(current, 'left');
                                            }
                                            if (current.autoRightMargin) {
                                                mapDelete(current, 'right');
                                            }
                                            if (current.centerMarginHorizontal) {
                                                if (node.viewWidth > 0 && !isPercent(current.css('width'))) {
                                                    current.android('layout_width', 'match_parent');
                                                }
                                                else if (current.inlineElement && current.viewWidth === 0) {
                                                    current.android('layout_width', 'wrap_content');
                                                }
                                            }
                                        }
                                        else if (current.floating) {
                                            mapDelete(current, (current.float === 'right' ? 'left' : 'right'));
                                        }
                                        else if (current.inlineElement) {
                                            if (current.nodeType <= NODE_STANDARD.IMAGE) {
                                                switch (current.css('textAlign')) {
                                                    case 'center':
                                                        break;
                                                    case 'right':
                                                    case 'end':
                                                        mapDelete(current, 'left');
                                                        break;
                                                    default:
                                                        mapDelete(current, 'right');
                                                        break;
                                                }
                                            }
                                            else {
                                                mapDelete(current, 'right');
                                            }
                                        }
                                        else {
                                            mapDelete(current, 'right');
                                            current.android('layout_width', 'match_parent');
                                        }
                                    }
                                    if (mapSibling(current, 'bottomTop')) {
                                        mapDelete(current, 'bottom');
                                    }
                                }
                                for (let i = 0; i < pageflow.length; i++) {
                                    const current = pageflow.get(i);
                                    if (!current.anchored) {
                                        const result = search(current.get('app'), '*constraint*');
                                        for (const [key, value] of result) {
                                            if (value !== 'parent' && anchored(pageflow).locate('stringId', value)) {
                                                if (indexOf(key, parseRTL('Left'), parseRTL('Right')) !== -1) {
                                                    current.constraint.horizontal = true;
                                                }
                                                if (indexOf(key, 'Top', 'Bottom', 'Baseline', 'above', 'below') !== -1) {
                                                    current.constraint.vertical = true;
                                                }
                                            }
                                        }
                                        if (current.anchored) {
                                            i = -1;
                                        }
                                    }
                                }
                            }
                            if (flex.enabled || columnCount > 1 || (!SETTINGS.constraintChainDisabled && pageflow.length > 1)) {
                                const flexbox = [];
                                if (flex.enabled) {
                                    if (flex.wrap === 'nowrap') {
                                        const horizontalChain = pageflow.clone();
                                        const verticalChain = pageflow.clone();
                                        switch (flex.direction) {
                                            case 'row-reverse':
                                                horizontalChain.list.reverse();
                                            case 'row':
                                                verticalChain.clear();
                                                break;
                                            case 'column-reverse':
                                                verticalChain.list.reverse();
                                            case 'column':
                                                horizontalChain.clear();
                                                break;
                                        }
                                        flexbox.push({ constraint: { horizontalChain, verticalChain } });
                                    }
                                    else {
                                        const sorted = pageflow.clone();
                                        switch (flex.direction) {
                                            case 'row-reverse':
                                            case 'column-reverse':
                                                sorted.list.reverse();
                                                break;
                                        }
                                        const map = {};
                                        const levels = [];
                                        for (const item of sorted) {
                                            const y = item.linear.top;
                                            if (map[y] == null) {
                                                map[y] = [];
                                                levels.push(y);
                                            }
                                            map[y].push(item);
                                        }
                                        function reverseMap() {
                                            for (const y in map) {
                                                map[y].reverse();
                                            }
                                        }
                                        switch (flex.wrap) {
                                            case 'wrap':
                                                if (flex.direction === 'column-reverse') {
                                                    reverseMap();
                                                }
                                                break;
                                            case 'wrap-reverse':
                                                if (flex.direction.indexOf('row') !== -1) {
                                                    levels.reverse();
                                                }
                                                else if (flex.direction === 'column') {
                                                    reverseMap();
                                                }
                                                break;
                                        }
                                        for (const n of levels) {
                                            flexbox.push({ constraint: { horizontalChain: new NodeList(map[n]) } });
                                        }
                                    }
                                }
                                else if (columnCount > 1) {
                                    const columns = [];
                                    const perRowCount = Math.ceil(pageflow.length / Math.min(columnCount, pageflow.length));
                                    for (let i = 0, j = 0; i < pageflow.length; i++) {
                                        const item = pageflow.list[i];
                                        if ((i % perRowCount) === 0) {
                                            if (i > 0) {
                                                j++;
                                            }
                                            if (columns[j] == null) {
                                                columns[j] = [];
                                            }
                                        }
                                        columns[j].push(item);
                                    }
                                    const row = [];
                                    const marginLeft = convertInt(convertPX(node.css('columnGap'), node.css('fontSize'))) || 16;
                                    const marginTotal = columns.map(list => Math.max.apply(null, list.map(item => item.marginLeft + item.marginRight)) || 0).reduce((a, b) => a + b, 0);
                                    const marginPercent = ((marginTotal + (marginLeft * (columnCount - 1))) / node.box.width) / columnCount;
                                    for (let i = 0; i < columns.length; i++) {
                                        const column = columns[i];
                                        const first = column[0];
                                        if (i > 0) {
                                            first.android(`layout_${parseRTL('marginLeft')}`, formatPX(first.marginLeft + marginLeft));
                                        }
                                        row.push(first);
                                        column.forEach(item => {
                                            if (item.viewWidth === 0) {
                                                item.android('layout_width', '0px');
                                                item.app('layout_constraintWidth_percent', ((1 / columnCount) - marginPercent).toFixed(2));
                                            }
                                        });
                                        flexbox.push({ constraint: { verticalChain: new NodeList(column) } });
                                    }
                                    flexbox.push({ constraint: { horizontalChain: new NodeList(row) } });
                                }
                                else {
                                    const horizontal = pageflow.list.filter(current => !current.constraint.horizontal);
                                    const vertical = pageflow.list.filter(current => !current.constraint.vertical);
                                    pageflow.list.some((current) => {
                                        const horizontalChain = [];
                                        const verticalChain = [];
                                        if (horizontal.length > 0) {
                                            horizontalChain.push(...this.partitionChain(current, pageflow, AXIS_ANDROID.HORIZONTAL, !inlineWrap));
                                            current.constraint.horizontalChain = new NodeList(sortAsc(horizontalChain, 'linear.left'));
                                        }
                                        if (vertical.length > 0 && !inlineWrap) {
                                            verticalChain.push(...this.partitionChain(current, pageflow, AXIS_ANDROID.VERTICAL, true));
                                            current.constraint.verticalChain = new NodeList(sortAsc(verticalChain, 'linear.top'));
                                        }
                                        return (horizontalChain.length === pageflow.length || verticalChain.length === pageflow.length);
                                    });
                                }
                                MAP_CHAIN.direction.forEach((value, index) => {
                                    const connected = (flexbox.length > 0 ? flexbox
                                        : pageflow.list.slice().sort((a, b) => (a.constraint[value] != null ? a.constraint[value].length : 0) >= (b.constraint[value] != null ? b.constraint[value].length : 0) ? -1 : 1));
                                    if (connected.length > 0) {
                                        const connectedRows = [];
                                        const mapId = new Set();
                                        connected.filter((current) => {
                                            if (current.constraint[value] instanceof NodeList) {
                                                const id = current.constraint[value].list.map(item => item.id).join('-');
                                                if (!mapId.has(id)) {
                                                    mapId.add(id);
                                                    return true;
                                                }
                                            }
                                            return false;
                                        }).forEach((current, level) => {
                                            const chainable = current.constraint[value];
                                            if (chainable.length > (flex.enabled ? 0 : 1)) {
                                                const inverse = (index === 0 ? 1 : 0);
                                                const [HV, VH] = [MAP_CHAIN['horizontalVertical'][index], MAP_CHAIN['horizontalVertical'][inverse]];
                                                const [LT, TL] = [MAP_CHAIN['leftTop'][index], MAP_CHAIN['leftTop'][inverse]];
                                                const [RB, BR] = [MAP_CHAIN['rightBottom'][index], MAP_CHAIN['rightBottom'][inverse]];
                                                const [WH, HW] = [MAP_CHAIN['widthHeight'][index], MAP_CHAIN['widthHeight'][inverse]];
                                                const orientation = HV.toLowerCase();
                                                const orientationInverse = VH.toLowerCase();
                                                const dimension = WH.toLowerCase();
                                                if (flex.enabled) {
                                                    if (chainable.list.some(item => item.flex.order > 0)) {
                                                        chainable[(flex.direction.indexOf('reverse') !== -1 ? 'sortDesc' : 'sortAsc')]('flex.order');
                                                    }
                                                }
                                                else if (!(inlineWrap || columnCount > 1)) {
                                                    if (chainable.list.every(item => resolveAnchor(item, nodes, orientation))) {
                                                        return;
                                                    }
                                                }
                                                chainable.parent = node;
                                                const first = chainable.get(0);
                                                const last = chainable.get();
                                                let maxOffset = -1;
                                                let disconnected = false;
                                                let marginDelete = false;
                                                const attrs = (index === 0 ? [AXIS_ANDROID.HORIZONTAL, 'left', 'leftRight', 'top', AXIS_ANDROID.VERTICAL, 'viewWidth', 'right', 'marginHorizontal']
                                                    : [AXIS_ANDROID.VERTICAL, 'top', 'topBottom', 'left', AXIS_ANDROID.HORIZONTAL, 'viewHeight', 'bottom', 'marginVertical']);
                                                for (let i = 0; i < chainable.length; i++) {
                                                    const item = chainable.get(i);
                                                    if (i === 0) {
                                                        if (!mapParent(item, attrs[1])) {
                                                            disconnected = true;
                                                            break;
                                                        }
                                                    }
                                                    else {
                                                        if (mapSibling(item, attrs[2]) == null) {
                                                            disconnected = true;
                                                            break;
                                                        }
                                                    }
                                                }
                                                if (!disconnected) {
                                                    if (chainable.list.every(item => sameValue(first, item, `linear.${attrs[3]}`))) {
                                                        for (let j = 1; j < chainable.length; j++) {
                                                            const item = chainable.get(j);
                                                            if (!item.constraint[attrs[4]]) {
                                                                item.anchor(mapLayout[attrs[3]], first.stringId, attrs[4]);
                                                            }
                                                        }
                                                    }
                                                    if (!flex.enabled && node[attrs[5]] === 0) {
                                                        mapDelete(last, attrs[6]);
                                                        last.constraint[attrs[7]] = mapSibling(last, attrs[2]);
                                                    }
                                                }
                                                if (inlineWrap) {
                                                    first.anchor(mapLayout[LT], 'parent', orientation);
                                                    last.anchor(mapLayout[RB], 'parent', orientation);
                                                    if (!node.renderParent.centerMarginHorizontal) {
                                                        if (first.float === 'right' && last.float === 'right') {
                                                            first.app(`layout_constraint${HV}_bias`, '1');
                                                        }
                                                        else {
                                                            first.app(`layout_constraint${HV}_bias`, '0');
                                                        }
                                                    }
                                                }
                                                else {
                                                    first.anchor(mapLayout[LT], 'parent', orientation);
                                                    last.anchor(mapLayout[RB], 'parent', orientation);
                                                }
                                                for (let i = 0; i < chainable.length; i++) {
                                                    const chain = chainable.get(i);
                                                    const next = chainable.get(i + 1);
                                                    const previous = chainable.get(i - 1);
                                                    if (flex.enabled) {
                                                        if (chain.linear[TL] === node.box[TL] && chain.linear[BR] === node.box[BR]) {
                                                            this.setAlignParent(chain, orientationInverse);
                                                        }
                                                        const rowNext = connected[level + 1];
                                                        if (rowNext && rowNext.constraint[value] != null) {
                                                            const chainNext = rowNext.constraint[value].get(i);
                                                            if (chainNext && chain.withinY(chainNext.linear)) {
                                                                chain.anchor(mapLayout['bottomTop'], chainNext.stringId);
                                                                if (!mapParent(chain, 'bottom')) {
                                                                    mapDelete(chain, 'bottom');
                                                                }
                                                            }
                                                        }
                                                    }
                                                    else if (inlineWrap) {
                                                        if (connectedRows.length === 0) {
                                                            chain.anchor(mapLayout['top'], 'parent');
                                                        }
                                                        else {
                                                            const previousRow = connectedRows[connectedRows.length - 1];
                                                            const bottom = Math.max.apply(null, previousRow.list.map(item => item.linear.bottom));
                                                            let anchorAbove;
                                                            if (chainable.length === previousRow.length) {
                                                                anchorAbove = previousRow.get(i);
                                                            }
                                                            else {
                                                                anchorAbove = previousRow.list.find(item => item.linear.bottom === bottom);
                                                            }
                                                            if (anchorAbove != null) {
                                                                chain.anchor(mapLayout['topBottom'], anchorAbove.stringId);
                                                            }
                                                        }
                                                        const width = chain.css('width');
                                                        if (isPercent(width)) {
                                                            chain.android('layout_width', '0px');
                                                            chain.app(`layout_constraint${WH}_percent`, (parseInt(width) / 100).toFixed(2));
                                                        }
                                                        chain.constraint.horizontal = true;
                                                        chain.constraint.vertical = true;
                                                    }
                                                    else if (columnCount > 1) {
                                                        if (index === 0) {
                                                            chain.app(`layout_constraint${VH}_bias`, '0');
                                                        }
                                                        if (index === 1 && i > 0) {
                                                            chain.anchor(mapLayout['left'], first.stringId);
                                                        }
                                                        chain.constraint.horizontal = true;
                                                        chain.constraint.vertical = true;
                                                    }
                                                    if (next) {
                                                        chain.anchor(mapLayout[MAP_CHAIN['rightLeftBottomTop'][index]], next.stringId);
                                                        maxOffset = Math.max(next.linear[LT] - chain.linear[RB], maxOffset);
                                                    }
                                                    if (previous) {
                                                        chain.anchor(mapLayout[MAP_CHAIN['leftRightTopBottom'][index]], previous.stringId);
                                                        chain.constraint[`margin${HV}`] = previous.stringId;
                                                    }
                                                    chain.constraint[`chain${HV}`] = true;
                                                    if (!chain.has(dimension) || isPercent(chain.css(dimension))) {
                                                        const minWH = chain.styleMap[`min${WH}`];
                                                        const maxWH = chain.styleMap[`max${WH}`];
                                                        if (isUnit(minWH)) {
                                                            chain.app(`layout_constraint${WH}_min`, minWH);
                                                            chain.android(`layout_${dimension}`, '0px');
                                                        }
                                                        if (isUnit(maxWH)) {
                                                            chain.app(`layout_constraint${WH}_max`, maxWH);
                                                            chain.android(`layout_${dimension}`, '0px');
                                                        }
                                                    }
                                                    if (flex.enabled) {
                                                        chain.app(`layout_constraint${HV}_weight`, chain.flex.grow.toString());
                                                        if (chain[`view${WH}`] == null && chain.flex.grow === 0 && chain.flex.shrink <= 1) {
                                                            chain.android(`layout_${dimension}`, 'wrap_content');
                                                        }
                                                        else if (chain.flex.grow > 0) {
                                                            chain.android(`layout_${dimension}`, '0px');
                                                        }
                                                        if (chain.flex.shrink === 0) {
                                                            chain.app(`layout_constrained${WH}`, 'true');
                                                        }
                                                        switch (chain.flex.alignSelf) {
                                                            case 'flex-start':
                                                                chain.anchor(mapLayout[TL], 'parent', orientationInverse);
                                                                break;
                                                            case 'flex-end':
                                                                chain.anchor(mapLayout[BR], 'parent', orientationInverse);
                                                                break;
                                                            case 'baseline':
                                                                const valid = chainable.list.some(adjacent => {
                                                                    if (adjacent !== chain && adjacent.nodeType <= NODE_STANDARD.TEXT) {
                                                                        chain.anchor(mapLayout['baseline'], adjacent.stringId);
                                                                        return true;
                                                                    }
                                                                    return false;
                                                                });
                                                                if (valid) {
                                                                    mapDelete(chain, 'top', 'bottom');
                                                                    for (const item of chainable) {
                                                                        if (mapSibling(item, 'top') === chain.stringId) {
                                                                            mapDelete(item, 'top');
                                                                        }
                                                                        if (mapSibling(item, 'bottom') === chain.stringId) {
                                                                            mapDelete(item, 'bottom');
                                                                        }
                                                                    }
                                                                    chain.constraint.vertical = true;
                                                                }
                                                                break;
                                                            case 'center':
                                                            case 'stretch':
                                                                if (chain.flex.alignSelf !== 'center') {
                                                                    chain.android(`layout_${HW.toLowerCase()}`, '0px');
                                                                }
                                                                chain.constraint[orientationInverse] = false;
                                                                this.setAlignParent(chain, orientationInverse);
                                                                break;
                                                        }
                                                        if (chain.flex.basis !== 'auto') {
                                                            const basis = convertInt(chain.flex.basis);
                                                            if (basis > 0) {
                                                                if (isPercent(chain.flex.basis)) {
                                                                    chain.app(`layout_constraint${WH}_percent`, (basis / 100).toFixed(2));
                                                                }
                                                                else {
                                                                    chain.app(`layout_constraint${WH}_min`, formatPX(basis));
                                                                    chain.constraint[`min${WH}`] = true;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                const chainStyle = `layout_constraint${HV}_chainStyle`;
                                                if (flex.enabled && flex.justifyContent !== 'normal' && Math.max.apply(null, chainable.list.map(item => item.flex.grow)) === 0) {
                                                    switch (flex.justifyContent) {
                                                        case 'space-between':
                                                            first.app(chainStyle, 'spread_inside');
                                                            break;
                                                        case 'space-evenly':
                                                            first.app(chainStyle, 'spread');
                                                            for (const item of chainable) {
                                                                item.app(`layout_constraint${HV}_weight`, (item.flex.grow || 1).toString());
                                                            }
                                                            break;
                                                        case 'space-around':
                                                            first.app(`layout_constraint${HV}_chainStyle`, 'spread_inside');
                                                            first.constraint[orientation] = false;
                                                            last.constraint[orientation] = false;
                                                            this.addGuideline(first, orientation, true, false);
                                                            this.addGuideline(last, orientation, true, true);
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
                                                            first.app(chainStyle, 'packed');
                                                            first.app(`layout_constraint${HV}_bias`, bias);
                                                            break;
                                                    }
                                                    marginDelete = true;
                                                }
                                                else if (inlineWrap) {
                                                    first.app(chainStyle, 'packed');
                                                }
                                                else if (!flex.enabled && columnCount > 1) {
                                                    first.app(chainStyle, (index === 0 ? 'spread_inside' : 'packed'));
                                                }
                                                else {
                                                    const alignLeft = withinFraction(node.box.left, first.linear.left);
                                                    const alignRight = withinFraction(last.linear.right, node.box.right);
                                                    const alignTop = withinFraction(node.box.top, first.linear.top);
                                                    const alignBottom = withinFraction(last.linear.bottom, node.box.bottom);
                                                    if ((orientation === AXIS_ANDROID.HORIZONTAL && alignLeft && alignRight) || (orientation === AXIS_ANDROID.VERTICAL && alignTop && alignBottom)) {
                                                        if (chainable.length > 2 || flex.enabled) {
                                                            if (!flex.enabled && node.inlineElement) {
                                                                first.app(chainStyle, 'packed');
                                                                first.app(`layout_constraint${HV}_bias`, (index === 0 && node.float === 'right' ? '1' : '0'));
                                                            }
                                                            else {
                                                                first.app(chainStyle, 'spread_inside');
                                                                marginDelete = true;
                                                            }
                                                        }
                                                        else if (maxOffset > SETTINGS[`constraintChainPacked${HV}Offset`]) {
                                                            if (mapParent(first, LT)) {
                                                                mapDelete(first, MAP_CHAIN['rightLeftBottomTop'][index]);
                                                            }
                                                            if (mapParent(last, RB)) {
                                                                mapDelete(last, MAP_CHAIN['leftRightTopBottom'][index]);
                                                            }
                                                        }
                                                    }
                                                    else if ((maxOffset <= SETTINGS[`chainPacked${HV}Offset`] || node.flex.wrap !== 'nowrap') || (orientation === AXIS_ANDROID.HORIZONTAL && (alignLeft || alignRight))) {
                                                        first.app(chainStyle, 'packed');
                                                        let bias = '';
                                                        if (orientation === AXIS_ANDROID.HORIZONTAL) {
                                                            if (alignLeft) {
                                                                bias = '0';
                                                            }
                                                            else if (alignRight) {
                                                                bias = '1';
                                                            }
                                                        }
                                                        if (bias === '') {
                                                            bias = chainable[`${orientation}Bias`];
                                                        }
                                                        first.app(`layout_constraint${HV}_bias`, bias);
                                                    }
                                                    else {
                                                        first.app(chainStyle, 'spread');
                                                        marginDelete = true;
                                                    }
                                                    if (!flex.enabled) {
                                                        (index === 0 ? [[TL, BR], [BR, TL]] : [[LT, RB], [RB, LT]]).forEach(opposing => {
                                                            if (chainable.list.every(upper => sameValue(first, upper, `linear.${opposing[0]}`) && chainable.list.some(lower => !sameValue(first, lower, `linear.${opposing[1]}`)))) {
                                                                for (const chain of chainable) {
                                                                    mapDelete(chain, opposing[1]);
                                                                }
                                                            }
                                                        });
                                                        for (const inner of chainable) {
                                                            for (const outer of pageflow) {
                                                                const horizontal = outer.constraint.horizontalChain;
                                                                const vertical = outer.constraint.verticalChain;
                                                                if (horizontal && horizontal.length > 0 && horizontal.locate('id', inner.id)) {
                                                                    horizontal.clear();
                                                                }
                                                                if (vertical && vertical.length > 0 && vertical.locate('id', inner.id)) {
                                                                    vertical.clear();
                                                                }
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        marginDelete = true;
                                                    }
                                                }
                                                if (marginDelete) {
                                                    for (const item of chainable) {
                                                        delete item.constraint.marginHorizontal;
                                                        delete item.constraint.marginVertical;
                                                    }
                                                }
                                                connectedRows.push(chainable);
                                            }
                                        });
                                    }
                                });
                            }
                            for (const current of pageflow) {
                                current.constraint.horizontal = resolveAnchor(current, nodes, AXIS_ANDROID.HORIZONTAL);
                                current.constraint.vertical = resolveAnchor(current, nodes, AXIS_ANDROID.VERTICAL);
                            }
                            if (flex.enabled) {
                                if (flex.wrap !== 'nowrap') {
                                    ['topBottom', 'bottomTop'].forEach((value, index) => {
                                        for (const current of pageflow) {
                                            if (mapParent(current, (index === 0 ? 'bottom' : 'top'))) {
                                                const chain = [current];
                                                let valid = false;
                                                let adjacent = current;
                                                while (adjacent != null) {
                                                    const topBottom = mapSibling(adjacent, value);
                                                    if (topBottom) {
                                                        adjacent = nodes.locate('nodeId', stripId(topBottom));
                                                        if (adjacent && current.withinY(adjacent.linear)) {
                                                            chain.push(adjacent);
                                                            valid = mapParent(adjacent, (index === 0 ? 'top' : 'bottom'));
                                                            if (valid) {
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        adjacent = null;
                                                    }
                                                }
                                                if (!valid) {
                                                    for (const item of chain) {
                                                        pageflow.list.some(next => {
                                                            if (item !== next && next.linear.top === item.linear.top && next.linear.bottom === item.linear.bottom) {
                                                                mapDelete(item, 'topBottom', 'bottomTop');
                                                                item.app(mapLayout['top'], next.stringId);
                                                                item.app(mapLayout['bottom'], next.stringId);
                                                                return true;
                                                            }
                                                            return false;
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                            else {
                                for (const current of pageflow) {
                                    [['top', 'bottom', 'topBottom'], ['bottom', 'top', 'bottomTop']].forEach(direction => {
                                        if (mapParent(current, direction[1]) && mapSibling(current, direction[2]) == null) {
                                            ['leftRight', 'rightLeft'].forEach(value => {
                                                const stringId = mapSibling(current, value);
                                                if (stringId) {
                                                    const aligned = pageflow.locate('stringId', stringId);
                                                    if (aligned && mapSibling(aligned, direction[2])) {
                                                        if (withinFraction(current.linear[direction[0]], aligned.linear[direction[0]])) {
                                                            current.anchor(mapLayout[direction[0]], aligned.stringId);
                                                        }
                                                        if (withinFraction(current.linear[direction[1]], aligned.linear[direction[1]])) {
                                                            current.anchor(mapLayout[direction[1]], aligned.stringId);
                                                        }
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                                const unbound = pageflow.filter(current => !current.anchored && (mapParent(current, 'top') ||
                                    mapParent(current, 'right') ||
                                    mapParent(current, 'bottom') ||
                                    mapParent(current, 'left')));
                                if (anchored(nodes).length === 0 && unbound.length === 0) {
                                    unbound.append(nodes.get(0));
                                }
                                for (const current of unbound) {
                                    this.addGuideline(current, '', false, false);
                                }
                                const [adjacent, unanchored] = nodes.partition(item => item.anchored);
                                for (const current of unanchored) {
                                    if (withinRange(current.horizontalBias, 0.5, 0.01) && withinRange(current.verticalBias, 0.5, 0.01)) {
                                        this.setAlignParent(current);
                                    }
                                    else if (SETTINGS.constraintCirclePositionAbsolute && adjacent.length > 0 && !current.constraint.horizontal && !current.constraint.vertical) {
                                        deleteConstraints(current, '', true);
                                        const opposite = adjacent.get(0);
                                        const center1 = current.center;
                                        const center2 = opposite.center;
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
                                        current.app('layout_constraintCircle', opposite.stringId);
                                        current.app('layout_constraintCircleRadius', delimitDimens(`${current.nodeName}`, 'constraintcircleradius', formatPX(radius)));
                                        current.app('layout_constraintCircleAngle', degrees.toString());
                                        current.constraint.horizontal = true;
                                        current.constraint.vertical = true;
                                    }
                                    else {
                                        this.addGuideline(current);
                                    }
                                }
                                let bottomParent = null;
                                let rightParent = null;
                                const maxBottom = Math.max.apply(null, nodes.list.map(item => item.linear.bottom));
                                const connected = {};
                                function deleteChain(item, value) {
                                    mapDelete(item, value);
                                    connected[item.stringId][value] = null;
                                }
                                for (const current of nodes) {
                                    const top = mapParent(current, 'top');
                                    const right = mapParent(current, 'right');
                                    let bottom = mapParent(current, 'bottom');
                                    const left = mapParent(current, 'left');
                                    connected[current.stringId] = {
                                        leftRight: mapSibling(current, 'leftRight'),
                                        rightLeft: mapSibling(current, 'rightLeft'),
                                        topBottom: mapSibling(current, 'topBottom'),
                                        bottomTop: mapSibling(current, 'bottomTop'),
                                    };
                                    if ((top && bottom && (current.cssOriginal('marginTop') !== 'auto' && current.linear.bottom < maxBottom)) || (bottom && mapSibling(current, 'topBottom') && current.viewHeight > 0)) {
                                        mapDelete(current, 'bottom');
                                        bottom = false;
                                    }
                                    if (current.pageflow) {
                                        [[left, right, 'rightLeft', 'leftRight', 'right', 'left', 'Horizontal'], [top, bottom, 'bottomTop', 'topBottom', 'bottom', 'top', 'Vertical']].forEach((value, index) => {
                                            if (value[0] || value[1]) {
                                                let valid = (value[0] && value[1]);
                                                let next = current;
                                                if (!valid) {
                                                    do {
                                                        const stringId = mapSibling(next, (value[0] ? value[2] : value[3]));
                                                        if (stringId) {
                                                            next = this.findByStringId(stringId);
                                                            if (next && ((value[0] && mapParent(next, value[4])) || (value[1] && mapParent(next, value[5])))) {
                                                                valid = true;
                                                                break;
                                                            }
                                                        }
                                                        else {
                                                            next = null;
                                                        }
                                                    } while (next != null);
                                                }
                                                if (valid) {
                                                    node.constraint[`layout${value[6]}`] = true;
                                                }
                                                if (!current.constraint[`chain${value[6]}`]) {
                                                    if (value[0] && value[1]) {
                                                        if (!current.autoMargin && !current.linearVertical) {
                                                            current.android(`layout_${(index === 0 ? 'width' : 'height')}`, 'match_parent', false);
                                                        }
                                                    }
                                                    else if (value[1]) {
                                                        if (valid) {
                                                            const below = this.findByStringId(mapSibling(current, value[3]));
                                                            if (below && below.marginBottom === 0) {
                                                                mapDelete(current, value[4]);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        });
                                        if (right) {
                                            if (!rightParent) {
                                                rightParent = false;
                                                rightParent = resolveAnchor(current, nodes, AXIS_ANDROID.HORIZONTAL);
                                            }
                                        }
                                        else if (left) {
                                            if (current.is(NODE_STANDARD.TEXT) && current.cssParent('textAlign', true) === 'center') {
                                                current.anchor(mapLayout['right'], 'parent');
                                            }
                                            if (current.textElement &&
                                                current.viewWidth === 0 &&
                                                current.toInt('maxWidth') === 0 &&
                                                current.multiLine &&
                                                !hasLineBreak(current.element) &&
                                                !nodes.list.some(item => mapSibling(item, 'rightLeft') === current.stringId)) {
                                                current.android('layout_width', 'match_parent');
                                            }
                                        }
                                        if (bottom) {
                                            if (!bottomParent) {
                                                bottomParent = false;
                                                bottomParent = resolveAnchor(current, nodes, AXIS_ANDROID.VERTICAL);
                                            }
                                        }
                                    }
                                    else {
                                        if (left && right && current.right == null && current.viewWidth > 0) {
                                            mapDelete(current, 'right');
                                        }
                                        if (top && bottom && current.bottom == null && current.viewHeight > 0) {
                                            mapDelete(current, 'bottom');
                                        }
                                        if (left && right && node.viewWidth === 0) {
                                            node.constraint.layoutWidth = true;
                                        }
                                        if (top && bottom && node.viewHeight === 0) {
                                            node.constraint.layoutHeight = true;
                                        }
                                        if (right && current.toInt('right') > 0) {
                                            current.modifyBox(BOX_STANDARD.MARGIN_RIGHT, current.toInt('right'));
                                        }
                                        if (bottom && current.toInt('bottom') > 0) {
                                            current.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, current.toInt('bottom'));
                                        }
                                        if (right && bottom) {
                                            if (node.documentRoot) {
                                                if (node.viewWidth === 0) {
                                                    node.constraint.layoutWidth = false;
                                                    node.constraint.layoutHorizontal = false;
                                                }
                                                if (node.viewHeight === 0) {
                                                    node.constraint.layoutHeight = false;
                                                    node.constraint.layoutVertical = false;
                                                }
                                            }
                                        }
                                    }
                                }
                                for (const left in connected) {
                                    for (const right in connected) {
                                        if (left !== right) {
                                            ['leftRight', 'rightLeft', 'bottomTop', 'topBottom'].forEach(value => {
                                                if (connected[left][value] && connected[left][value] === connected[right][value]) {
                                                    const conflict = nodes.locate('stringId', connected[left][value]);
                                                    if (conflict) {
                                                        [nodes.locate('stringId', left), nodes.locate('stringId', right)].some((item, index) => {
                                                            if (item) {
                                                                const stringId = (index === 0 ? left : right);
                                                                switch (value) {
                                                                    case 'leftRight':
                                                                    case 'rightLeft':
                                                                        if ((mapSibling(item, 'left') || mapSibling(item, 'right')) && mapSibling(conflict, (value === 'rightLeft' ? 'leftRight' : 'rightLeft')) !== stringId) {
                                                                            deleteChain(item, value);
                                                                            return true;
                                                                        }
                                                                        break;
                                                                    case 'bottomTop':
                                                                    case 'topBottom':
                                                                        if ((mapSibling(item, 'top') || mapSibling(item, 'bottom')) && mapSibling(conflict, (value === 'topBottom' ? 'bottomTop' : 'topBottom')) !== stringId) {
                                                                            deleteChain(item, value);
                                                                            return true;
                                                                        }
                                                                        break;
                                                                }
                                                            }
                                                            return false;
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    }
                                }
                                if (rightParent === false) {
                                    node.constraint.layoutWidth = true;
                                }
                                if (bottomParent === false) {
                                    node.constraint.layoutHeight = true;
                                }
                            }
                        }
                    }
                    for (const current of nodes) {
                        if (current.constraint.marginHorizontal != null) {
                            const item = this.findByStringId(current.constraint.marginHorizontal);
                            if (item) {
                                const offset = current.linear.left - (item.companion != null && !item.companion.visible ? Math.max(item.linear.right, item.companion.linear.right) : item.linear.right);
                                if (offset >= 1) {
                                    current.modifyBox(BOX_STANDARD.MARGIN_LEFT, offset);
                                }
                            }
                        }
                        if (current.constraint.marginVertical != null) {
                            const item = this.findByStringId(current.constraint.marginVertical);
                            if (item) {
                                const offset = current.linear.top - item.linear.bottom;
                                if (offset >= 1) {
                                    current.modifyBox(BOX_STANDARD.MARGIN_TOP, offset);
                                }
                            }
                        }
                    }
                }
                else {
                    if (node.linearHorizontal) {
                        this.adjustLineHeight(node.renderChildren, node);
                    }
                }
            }
        }
        getEmptySpacer(nodeType, depth, width, height, columnSpan = 1) {
            let xml = '';
            const percent = (width != null && isPercent(width) ? (parseInt(width) / 100).toFixed(2) : '');
            switch (nodeType) {
                case NODE_STANDARD.GRID:
                    xml = this.renderNodeStatic(NODE_STANDARD.SPACE, depth, {
                        app: {
                            layout_columnWeight: percent,
                            layout_columnSpan: columnSpan.toString()
                        }
                    }, (percent !== '' ? '0px' : 'wrap_content'), (!height ? 'wrap_content' : formatPX(height)));
                    break;
            }
            return xml;
        }
        createGroup(parent, node, children) {
            const group = new ViewGroup(this.cache.nextId, node, parent, children);
            if (children.length > 0) {
                children.forEach(item => item.inherit(group, 'data'));
            }
            this.cache.append(group);
            return group;
        }
        renderGroup(node, parent, viewName, options) {
            const target = (node.isSet('dataset', 'target') && !node.isSet('dataset', 'include'));
            let preXml = '';
            let postXml = '';
            if (typeof viewName === 'number') {
                viewName = View.getControlName(viewName);
            }
            switch (viewName) {
                case NODE_ANDROID.LINEAR:
                    options = {
                        android: {
                            orientation: (options && options.horizontal ? AXIS_ANDROID.HORIZONTAL : AXIS_ANDROID.VERTICAL)
                        }
                    };
                    break;
                case NODE_ANDROID.GRID:
                    options = {
                        app: {
                            columnCount: (options && options.columns ? options.columns.toString() : '2'),
                            rowCount: (options && options.rows > 0 ? options.rows.toString() : '')
                        }
                    };
                    break;
                default:
                    options = {};
                    break;
            }
            node.setNodeType(viewName);
            if (node.overflowX || node.overflowY) {
                const scrollType = [];
                if (node.overflowX && node.overflowY) {
                    scrollType.push(NODE_ANDROID.SCROLL_HORIZONTAL, NODE_ANDROID.SCROLL_VERTICAL);
                }
                else {
                    if (node.overflowX) {
                        scrollType.push(NODE_ANDROID.SCROLL_HORIZONTAL);
                    }
                    if (node.overflowY) {
                        scrollType.push(NODE_ANDROID.SCROLL_VERTICAL);
                    }
                }
                let previous = null;
                const scrollView = scrollType.map((nodeName, index) => {
                    const container = new View(this.cache.nextId, SETTINGS.targetAPI, (index === 0 ? node.element : undefined));
                    container.nodeName = node.nodeName;
                    container.documentParent = node.documentParent;
                    container.setNodeType(nodeName);
                    if (index === 0) {
                        container.inherit(node, 'base', 'data', 'originalStyleMap', 'styleMap');
                        container.parent = parent;
                        container.render(parent);
                    }
                    else {
                        container.inherit(node, 'dimensions');
                        container.inherit(node, 'originalStyleMap', 'styleMap');
                        if (previous != null) {
                            previous.css('overflow', 'visible scroll');
                            previous.css('overflowX', 'scroll');
                            previous.css('overflowY', 'visible');
                            previous.overflow = 2 /* HORIZONTAL */;
                            container.parent = previous;
                            container.render(previous);
                        }
                        container.css('overflow', 'scroll visible');
                        container.css('overflowX', 'visible');
                        container.css('overflowY', 'scroll');
                        container.overflow = 4 /* VERTICAL */;
                        if (node.has('width', CSS_STANDARD.UNIT)) {
                            container.css('width', formatPX(node.toInt('width') + node.paddingLeft + node.paddingRight));
                        }
                    }
                    container.resetBox(BOX_STANDARD.PADDING);
                    const indent = repeat(container.renderDepth);
                    preXml += `{<${container.id}}${indent}<${nodeName}{@${container.id}}>\n` +
                        `{:${container.id}}`;
                    postXml = `${indent}</${nodeName}>\n{>${container.id}}` + (index === 1 ? '\n' : '') + postXml;
                    previous = container;
                    this.cache.append(container);
                    return container;
                });
                if (scrollView.length === 2) {
                    node.android('layout_width', 'wrap_content');
                    node.android('layout_height', 'wrap_content');
                }
                else {
                    scrollView[0].overflow = node.overflow;
                    node.android((node.overflowX ? 'layout_width' : 'layout_height'), 'wrap_content');
                }
                node.removeElement();
                node.resetBox(BOX_STANDARD.MARGIN);
                node.parent = scrollView[scrollView.length - 1];
                node.render(node.parent);
            }
            else {
                node.render((target ? node : parent));
            }
            node.apply(options);
            return this.getEnclosingTag((target || parent.isSet('dataset', 'target') || (node.renderDepth === 0 && !node.documentRoot) ? -1 : node.renderDepth), viewName, node.id, formatPlaceholder(node.id), preXml, postXml);
        }
        renderNode(node, parent, nodeName, recursive = false) {
            const target = (node.isSet('dataset', 'target') && !node.isSet('dataset', 'include'));
            if (typeof nodeName === 'number') {
                nodeName = View.getControlName(nodeName);
            }
            node.setNodeType(nodeName);
            switch (node.tagName) {
                case 'IMG': {
                    if (!recursive) {
                        const element = node.element;
                        let width = node.toInt('width');
                        let height = node.toInt('height');
                        const top = node.toInt('top');
                        const left = node.toInt('left');
                        const percentWidth = isPercent(node.css('width'));
                        const percentHeight = isPercent(node.css('height'));
                        let scaleType = '';
                        if (percentWidth || percentHeight) {
                            scaleType = (percentWidth && percentHeight ? 'fitXY' : 'fitCenter');
                        }
                        else {
                            if (width === 0) {
                                const match = /width="([0-9]+)"/.exec(element.outerHTML);
                                if (match) {
                                    width = parseInt(match[1]);
                                    node.css('width', formatPX(match[1]));
                                }
                            }
                            if (height === 0) {
                                const match = /height="([0-9]+)"/.exec(element.outerHTML);
                                if (match) {
                                    height = parseInt(match[1]);
                                    node.css('height', formatPX(match[1]));
                                }
                            }
                            switch (node.css('objectFit')) {
                                case 'contain':
                                    scaleType = 'centerInside';
                                    break;
                                case 'cover':
                                    scaleType = 'centerCrop';
                                    break;
                                case 'scale-down':
                                    scaleType = 'fitCenter';
                                    break;
                                case 'none':
                                    scaleType = 'matrix';
                                    break;
                                default:
                                    scaleType = 'fitXY';
                                    break;
                            }
                        }
                        if (scaleType !== '') {
                            node.android('scaleType', scaleType);
                        }
                        if ((width > 0 && height === 0) || (width === 0 && height > 0)) {
                            node.android('adjustViewBounds', 'true');
                        }
                        if (top < 0 || left < 0) {
                            const container = new View(this.cache.nextId, SETTINGS.targetAPI, node.element);
                            container.excludeProcedure |= NODE_PROCEDURE.ALL;
                            container.excludeResource |= NODE_RESOURCE.ALL;
                            container.android('layout_width', (width > 0 ? formatPX(width) : 'wrap_content'));
                            container.android('layout_height', (height > 0 ? formatPX(height) : 'wrap_content'));
                            container.setBounds();
                            container.setNodeType(NODE_ANDROID.FRAME);
                            container.render(parent);
                            if (left < 0) {
                                node.modifyBox(BOX_STANDARD.MARGIN_LEFT, left, true);
                                container.css('left', '0px');
                            }
                            if (top < 0) {
                                node.modifyBox(BOX_STANDARD.MARGIN_TOP, top, true);
                                container.css('top', '0px');
                            }
                            node.parent = container;
                            this.cache.append(container);
                            return this.getEnclosingTag(container.renderDepth, NODE_ANDROID.FRAME, container.id, this.renderNode(node, container, nodeName, true));
                        }
                    }
                    break;
                }
                case 'TEXTAREA': {
                    const element = node.element;
                    node.android('minLines', '2');
                    if (element.rows > 2) {
                        node.android('maxLines', element.rows.toString());
                    }
                    if (element.maxLength > 0) {
                        node.android('maxLength', element.maxLength.toString());
                    }
                    if (node.viewWidth === 0) {
                        const cols = convertInt(element.cols);
                        if (cols > 0) {
                            node.css('width', formatPX(cols * 10));
                        }
                    }
                    node.android('hint', element.placeholder);
                    node.android('scrollbars', AXIS_ANDROID.VERTICAL);
                    node.android('inputType', 'textMultiLine');
                    if (node.overflowX) {
                        node.android('scrollHorizontally', 'true');
                    }
                    break;
                }
                case 'INPUT': {
                    const element = node.element;
                    switch (element.type) {
                        case 'radio':
                            if (!recursive) {
                                const radiogroup = parent.children.map(item => {
                                    if (item.renderAs != null) {
                                        item = item.renderAs;
                                    }
                                    const input = item.element;
                                    if (item.visible && !item.rendered && input.type === 'radio' && input.name === element.name) {
                                        return item;
                                    }
                                    return null;
                                })
                                    .filter(item => item);
                                if (radiogroup.length > 1) {
                                    let xml = '';
                                    const group = this.createGroup(parent, node, radiogroup);
                                    group.setNodeType(NODE_ANDROID.RADIO_GROUP);
                                    group.inherit(node, 'alignment');
                                    group.render(parent);
                                    let checked = '';
                                    for (const item of group.children) {
                                        if (item.element.checked) {
                                            checked = item.stringId;
                                        }
                                        xml += this.renderNode(item, group, NODE_STANDARD.RADIO, true);
                                    }
                                    group.android('orientation', (NodeList.linearX(radiogroup) ? AXIS_ANDROID.HORIZONTAL : AXIS_ANDROID.VERTICAL));
                                    group.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                                    if (checked !== '') {
                                        group.android('checkedButton', checked);
                                    }
                                    return this.getEnclosingTag(group.renderDepth, NODE_ANDROID.RADIO_GROUP, group.id, xml);
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
                    switch (element.type) {
                        case 'text':
                        case 'search':
                        case 'tel':
                        case 'url':
                        case 'email':
                        case 'password':
                            if (node.viewWidth === 0) {
                                const size = convertInt(element.size);
                                if (size > 0) {
                                    node.css('width', formatPX(size * 10));
                                }
                            }
                            break;
                    }
                    break;
                }
            }
            switch (node.controlName) {
                case NODE_ANDROID.TEXT:
                    const scrollbars = [];
                    if (node.overflowX) {
                        scrollbars.push(AXIS_ANDROID.HORIZONTAL);
                    }
                    if (node.overflowY) {
                        scrollbars.push(AXIS_ANDROID.VERTICAL);
                    }
                    if (scrollbars.length > 0) {
                        node.android('scrollbars', scrollbars.join('|'));
                    }
                    if (node.has('maxWidth', CSS_STANDARD.UNIT)) {
                        node.android('maxWidth', node.css('maxWidth'));
                    }
                    if (node.has('maxHeight', CSS_STANDARD.UNIT)) {
                        node.android('maxHeight', node.css('maxHeight'));
                    }
                    break;
                case NODE_ANDROID.LINE:
                    if (node.viewHeight === 0) {
                        node.android('layout_height', formatPX((node.borderTopWidth + node.borderBottomWidth + node.paddingTop + node.paddingBottom) || 1));
                    }
                    break;
            }
            node.render((target ? node : parent));
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.ACCESSIBILITY)) {
                node.setAccessibility();
            }
            return this.getEnclosingTag((target || parent.isSet('dataset', 'target') || (node.renderDepth === 0 && !node.documentRoot) ? -1 : node.renderDepth), node.controlName, node.id);
        }
        renderNodeStatic(nodeName, depth, options = {}, width = '', height = '', node, children) {
            if (node == null) {
                node = new View(0, SETTINGS.targetAPI);
            }
            node.apply(formatResource(options));
            const renderDepth = Math.max(0, depth);
            const viewName = (typeof nodeName === 'number' ? View.getControlName(nodeName) : nodeName);
            switch (viewName) {
                case 'include':
                case 'merge':
                case 'menu':
                    break;
                default:
                    node.setNodeType(viewName);
                    break;
            }
            const displayName = (node.hasElement ? node.nodeName : viewName);
            if (hasValue(width)) {
                if (!isNaN(parseInt(width))) {
                    width = delimitDimens(displayName, 'width', width);
                }
                node.android('layout_width', width, false);
            }
            if (hasValue(height)) {
                if (!isNaN(parseInt(height))) {
                    height = delimitDimens(displayName, 'height', height);
                }
                node.android('layout_height', height, false);
            }
            node.renderDepth = renderDepth;
            let output = this.getEnclosingTag((depth === 0 && !node.documentRoot ? -1 : depth), viewName, node.id, (children ? formatPlaceholder(node.id) : ''));
            if (SETTINGS.showAttributes && node.id === 0) {
                const indent = repeat(renderDepth + 1);
                const attrs = node.combine().map(value => `\n${indent + value}`).join('');
                output = output.replace(formatPlaceholder(node.id, '@'), attrs);
            }
            options['stringId'] = node.stringId;
            return output;
        }
        renderInclude(node, parent, name) {
            this._merge[name] = (node.dataset.includeMerge === 'true');
            node.documentRoot = !this._merge[name];
            return this.renderNodeStatic('include', parent.renderDepth + 1, { layout: `@layout/${name}` });
        }
        renderMerge(name, value) {
            let xml = value.join('');
            if (this._merge[name]) {
                const node = new View(0, 0);
                node.documentRoot = true;
                xml = this.renderNodeStatic('merge', 0, {}, '', '', node, true).replace('{:0}', xml);
            }
            return xml;
        }
        baseRenderDepth(name) {
            return (this._merge[name] ? 0 : -1);
        }
        addXmlNs(name, uri) {
            XMLNS_ANDROID[name] = uri;
        }
        setDimensions(data) {
            function addToGroup(nodeName, node, dimen, attr, value) {
                const group = groups[nodeName];
                let name = dimen;
                if (arguments.length === 5) {
                    if (value != null && /(px|dp|sp)$/.test(value)) {
                        name = `${dimen},${attr},${value}`;
                    }
                    else {
                        return;
                    }
                }
                if (group[name] == null) {
                    group[name] = [];
                }
                group[name].push(node);
            }
            const groups = {};
            for (const node of data.cache.visible) {
                node.setBoxSpacing();
                if (SETTINGS.dimensResourceValue) {
                    const nodeName = node.nodeName.toLowerCase();
                    if (groups[nodeName] == null) {
                        groups[nodeName] = {};
                    }
                    for (const key of Object.keys(BOX_STANDARD)) {
                        const result = this.valueBox(node, key);
                        if (result[0] !== '' && result[1] !== '0px') {
                            const name = `${BOX_STANDARD[key].toLowerCase()},${result[0]},${result[1]}`;
                            addToGroup(nodeName, node, name);
                        }
                    }
                    ['android:layout_width:width',
                        'android:layout_height:height',
                        'android:minWidth:min_width',
                        'android:minHeight:min_height',
                        'app:layout_constraintWidth_min:constraint_width_min',
                        'app:layout_constraintHeight_min:constraint_height_min'].forEach(value => {
                        const [obj, attr, dimen] = value.split(':');
                        addToGroup(nodeName, node, dimen, attr, node[obj](attr));
                    });
                }
            }
            if (SETTINGS.dimensResourceValue) {
                const resource = Resource.STORED.DIMENS;
                for (const nodeName in groups) {
                    const group = groups[nodeName];
                    for (const name in group) {
                        const [dimen, attr, value] = name.split(',');
                        const key = this.getDimensResourceKey(resource, `${nodeName}_${parseRTL(dimen)}`, value);
                        group[name].forEach(node => node[(attr.indexOf('constraint') !== -1 ? 'app' : 'android')](attr, `@dimen/${key}`));
                        resource.set(key, value);
                    }
                }
            }
        }
        valueBox(node, region) {
            const name = convertEnum(parseInt(region), BOX_STANDARD, BOX_ANDROID);
            if (name !== '') {
                const attr = parseRTL(name);
                return [attr, node.android(attr) || '0px'];
            }
            return ['', '0px'];
        }
        parseDimensions(content) {
            const resource = Resource.STORED.DIMENS;
            const pattern = /\s+\w+:\w+="({%(\w+),(\w+),(-?\w+)})"/g;
            let match;
            while ((match = pattern.exec(content)) != null) {
                const key = this.getDimensResourceKey(resource, `${match[2]}_${parseRTL(match[3])}`, match[4]);
                resource.set(key, match[4]);
                content = content.replace(new RegExp(match[1], 'g'), `@dimen/${key}`);
            }
            return content;
        }
        setAttributes(data) {
            if (SETTINGS.showAttributes) {
                const cache = data.cache.visible.list.map(node => ({ pattern: formatPlaceholder(node.id, '@'), attributes: this.parseAttributes(node) }));
                [...data.views, ...data.includes].forEach(value => {
                    cache.forEach(item => value.content = value.content.replace(item.pattern, item.attributes));
                    value.content = value.content.replace(`{#0}`, this.getRootNamespace(value.content));
                });
            }
        }
        parseAttributes(node) {
            if (node.dir === 'rtl') {
                switch (node.controlName) {
                    case NODE_ANDROID.RADIO:
                    case NODE_ANDROID.CHECKBOX:
                        node.android('layoutDirection', 'rtl');
                        break;
                    default:
                        if (node.renderChildren.length === 0) {
                            node.android('textDirection', 'rtl');
                        }
                        break;
                }
            }
            for (const name in node.dataset) {
                if (/^attr[A-Z]+/.test(name)) {
                    const obj = capitalize(name.substring(4), false);
                    node.dataset[name].split(';').forEach(values => {
                        const [key, value] = values.split('::');
                        if (hasValue(key) && hasValue(value)) {
                            node.attr(obj, key, value);
                        }
                    });
                }
            }
            const indent = repeat(node.renderDepth + 1);
            return node.combine().map(value => `\n${indent + value}`).join('');
        }
        getRootNamespace(content) {
            let output = '';
            for (const namespace in XMLNS_ANDROID) {
                if (new RegExp(`\\s+${namespace}:`).test(content)) {
                    output += `\n\txmlns:${namespace}="${XMLNS_ANDROID[namespace]}"`;
                }
            }
            return output;
        }
        getDimensResourceKey(resource, key, value) {
            if (resource.has(key) && resource.get(key) !== value) {
                key = generateId('dimens', `${key}_1`);
            }
            return key;
        }
        setAlignParent(node, orientation = '', bias = false) {
            const map = MAP_LAYOUT.constraint;
            [AXIS_ANDROID.HORIZONTAL, AXIS_ANDROID.VERTICAL].forEach((value, index) => {
                if (!node.constraint[value] && (orientation === '' || value === orientation)) {
                    node.app(map[(index === 0 ? 'left' : 'top')], 'parent');
                    node.app(map[(index === 0 ? 'right' : 'bottom')], 'parent');
                    node.constraint[value] = true;
                    if (bias) {
                        node.app(`layout_constraint${value.charAt(0).toUpperCase() + value.substring(1)}_bias`, node[`${value}Bias`]);
                    }
                }
            });
        }
        partitionChain(node, nodes, orientation, validate) {
            const map = MAP_LAYOUT.constraint;
            const mapParent = [];
            const coordinate = [];
            const connected = [];
            switch (orientation) {
                case AXIS_ANDROID.HORIZONTAL:
                    mapParent.push(map['left'], map['right']);
                    coordinate.push('linear.top', 'linear.bottom');
                    connected.push(map['leftRight'], map['rightLeft']);
                    break;
                case AXIS_ANDROID.VERTICAL:
                    mapParent.push(map['top'], map['bottom']);
                    coordinate.push('linear.left', 'linear.right');
                    connected.push(map['topBottom'], map['bottomTop']);
                    break;
            }
            const result = coordinate.map(value => {
                const sameXY = sortAsc(nodes.list.filter(item => sameValue(node, item, value)), coordinate[0]);
                if (sameXY.length > 1) {
                    if (!validate || (!sameXY.some(item => item.floating) && sameXY[0].app(mapParent[0]) === 'parent' && sameXY[sameXY.length - 1].app(mapParent[1]) === 'parent')) {
                        return sameXY;
                    }
                    else {
                        let valid;
                        const chained = new Set([node]);
                        do {
                            valid = false;
                            Array.from(chained).some(item => {
                                return sameXY.some(adjacent => {
                                    if (!chained.has(adjacent) && (adjacent.app(connected[0]) === item.stringId || adjacent.app(connected[1]) === item.stringId)) {
                                        chained.add(adjacent);
                                        valid = true;
                                    }
                                    return valid;
                                });
                            });
                        } while (valid);
                        return Array.from(chained);
                    }
                }
                return [];
            })
                .reduce((a, b) => a.length >= b.length ? a : b);
            return result;
        }
        addGuideline(node, orientation = '', percent, opposite) {
            const map = MAP_LAYOUT.constraint;
            if (node.pageflow) {
                if (opposite == null) {
                    opposite = (node.float === 'right' ||
                        (node.left == null && node.right != null) ||
                        (node.is(NODE_STANDARD.TEXT) && node.css('textAlign') === 'right') ||
                        node.alignParent('right'));
                }
                if (percent == null && opposite === true) {
                    percent = true;
                }
            }
            if (node.dataset.constraintPercent != null) {
                percent = (node.dataset.constraintPercent === 'true');
            }
            const parent = node.documentParent;
            const beginPercent = `layout_constraintGuide_${(percent ? 'percent' : 'begin')}`;
            [AXIS_ANDROID.HORIZONTAL, AXIS_ANDROID.VERTICAL].forEach((value, index) => {
                if (!node.constraint[value] && (orientation === '' || value === orientation)) {
                    let LT = '';
                    let RB = '';
                    let LTRB = '';
                    let RBLT = '';
                    let found = false;
                    let offset = 0;
                    switch (index) {
                        case 0:
                            LT = (!opposite ? 'left' : 'right');
                            RB = (!opposite ? 'right' : 'left');
                            LTRB = (!opposite ? 'leftRight' : 'rightLeft');
                            RBLT = (!opposite ? 'rightLeft' : 'leftRight');
                            if (node.position === 'relative' && node.toInt('left') < 0) {
                                offset = node.toInt('left');
                            }
                            break;
                        case 1:
                            LT = (!opposite ? 'top' : 'bottom');
                            RB = (!opposite ? 'bottom' : 'top');
                            LTRB = (!opposite ? 'topBottom' : 'bottomTop');
                            RBLT = (!opposite ? 'bottomTop' : 'topBottom');
                            if (node.position === 'relative' && node.toInt('top') < 0) {
                                offset = node.toInt('top');
                            }
                            break;
                    }
                    const dimension = (node.pageflow ? 'bounds' : 'linear');
                    const position = (percent ? Math.abs((node[dimension][LT] + offset) - (parent.documentBody ? 0 : parent.box[LT])) / parent.box[(index === 0 ? 'width' : 'height')] : 0);
                    if (!percent) {
                        found = parent.renderChildren.some(item => {
                            if (item.constraint[value] && (!item.constraint[`chain${capitalize(value)}`] || item.constraint[`margin${capitalize(value)}`] != null)) {
                                if (withinFraction(node.linear[LT] + offset, item.linear[RB])) {
                                    node.anchor(map[LTRB], item.stringId, value, true);
                                    return true;
                                }
                                else if (withinFraction(node.linear[RB] + offset, item.linear[LT])) {
                                    node.anchor(map[RBLT], item.stringId, value, true);
                                    return true;
                                }
                                if (withinFraction(node.bounds[LT] + offset, item.bounds[LT])) {
                                    node.anchor(map[(index === 1 &&
                                        node.is(NODE_STANDARD.TEXT) &&
                                        node.baseline &&
                                        item.is(NODE_STANDARD.TEXT) &&
                                        item.baseline ? 'baseline' : LT)], item.stringId, value, true);
                                    return true;
                                }
                                else if (withinFraction(node.bounds[RB] + offset, item.bounds[RB])) {
                                    node.anchor(map[RB], item.stringId, value, true);
                                    return true;
                                }
                            }
                            return false;
                        });
                    }
                    if (!found) {
                        const guideline = parent.constraint.guideline || {};
                        let location = (percent ? parseFloat(Math.abs(position - (!opposite ? 0 : 1)).toFixed(SETTINGS.constraintPercentAccuracy))
                            : (!opposite ? (node[dimension][LT] + offset) - parent.box[LT]
                                : (node[dimension][LT] + offset) - parent.box[RB]));
                        if (!percent && !opposite) {
                            if (location < 0) {
                                const padding = parent[`padding${capitalize(LT)}`];
                                if (padding >= Math.abs(location)) {
                                    location = 0;
                                }
                                else {
                                    location = Math.abs(location) - padding;
                                }
                            }
                            else {
                                if (parent.documentBody) {
                                    location = node[dimension][LT] + offset;
                                }
                            }
                        }
                        if (location === 0) {
                            node.anchor(map[LT], 'parent', value, true);
                        }
                        else {
                            const options = {
                                android: {
                                    orientation: (index === 0 ? AXIS_ANDROID.VERTICAL : AXIS_ANDROID.HORIZONTAL)
                                },
                                app: {
                                    [beginPercent]: location.toString()
                                }
                            };
                            const anchors = optional(guideline, `${value}.${beginPercent}.${LT}`, 'object');
                            if (anchors) {
                                for (const stringId in anchors) {
                                    if (anchors[stringId] === location) {
                                        node.anchor(map[LT], stringId, value, true);
                                        node.delete('app', map[RB]);
                                        found = true;
                                        break;
                                    }
                                }
                            }
                            if (!found) {
                                if (!percent) {
                                    options.app[beginPercent] = delimitDimens(node.nodeName, 'constraintguide_begin', formatPX(location));
                                }
                                const xml = this.renderNodeStatic(NODE_ANDROID.GUIDELINE, node.renderDepth, options, 'wrap_content', 'wrap_content');
                                const stringId = options.stringId;
                                this.appendAfter(node.id, xml);
                                node.anchor(map[LT], stringId, value, true);
                                node.delete('app', map[RB]);
                                node.constraint[`${value}Guideline`] = stringId;
                                if (guideline[value] == null) {
                                    guideline[value] = {};
                                }
                                if (guideline[value][beginPercent] == null) {
                                    guideline[value][beginPercent] = {};
                                }
                                if (guideline[value][beginPercent][LT] == null) {
                                    guideline[value][beginPercent][LT] = {};
                                }
                                guideline[value][beginPercent][LT][stringId] = location;
                                parent.constraint.guideline = guideline;
                            }
                        }
                    }
                }
            });
        }
        adjustLineHeight(nodes, parent) {
            const lineHeight = Math.max.apply(null, nodes.map(node => node.toInt('lineHeight')));
            if (lineHeight > 0) {
                let minHeight = Number.MAX_VALUE;
                let offsetTop = 0;
                const valid = nodes.every(node => {
                    const offset = lineHeight - node.bounds.height;
                    if (offset > 0) {
                        minHeight = Math.min(offset, minHeight);
                        if (lineHeight === node.toInt('lineHeight')) {
                            offsetTop = Math.max((node.toInt('top') < 0 ? Math.abs(node.toInt('top')) : 0), offsetTop);
                        }
                        return true;
                    }
                    return false;
                });
                if (valid) {
                    parent.modifyBox(BOX_STANDARD.PADDING_TOP, Math.floor(minHeight / 2));
                    parent.modifyBox(BOX_STANDARD.PADDING_BOTTOM, Math.ceil(minHeight / 2) + offsetTop);
                }
            }
        }
        findByStringId(id) {
            return this.cache.locate('stringId', id);
        }
        get supportInline() {
            return WEBVIEW_ANDROID;
        }
        get supportInclude() {
            return true;
        }
        get settings() {
            return {
                folderLayout: 'res/layout'
            };
        }
    }

    class File {
        constructor(_directory, _processingTime, compression) {
            this._directory = _directory;
            this._processingTime = _processingTime;
            this.appName = '';
            this.queue = [];
            this._compression = 'zip';
            if (compression) {
                this._compression = compression;
            }
        }
        addFile(pathname, filename, content, uri) {
            if (content !== '' || uri !== '') {
                const index = this.queue.findIndex(item => item.pathname === pathname && item.filename === filename);
                if (index !== -1) {
                    this.queue[index].content = content || '';
                    this.queue[index].uri = uri || '';
                }
                else {
                    this.queue.push({ pathname, filename, content, uri });
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
                fetch(`/api/savetodisk?directory=${encodeURIComponent(trimString(this._directory, '/'))}&appname=${encodeURIComponent(this.appName.trim())}&filetype=${this._compression.toLocaleLowerCase()}&processingtime=${this._processingTime.toString().trim()}`, {
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
                                .then(blob => this.downloadToDisk(blob, lastIndexOf(json.zipname)));
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
        '<font-family xmlns:android="http://schemas.android.com/apk/res/android" xmlns:app="{#app=http://schemas.android.com/apk/res-auto}">',
        '!1',
        '	<font android:fontStyle="{style}" android:fontWeight="{weight}" android:font="{font}" app:fontStyle="{#app=style}" app:fontWeight="{#app=weight}" app:font="{#app=font}" />',
        '!1',
        '</font-family>',
        '<!-- filename: res/font/{name}.xml -->',
        '!0'
    ];
    var FONT_TMPL = template$4.join('\n');

    const template$5 = [
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
    var COLOR_TMPL = template$5.join('\n');

    const template$6 = [
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
    var STYLE_TMPL = template$6.join('\n');

    const template$7 = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '!1',
        '	<dimen name="{name}">{value}</dimen>',
        '!1',
        '</resources>',
        '<!-- filename: res/values/dimens.xml -->',
        '!0'
    ];
    var DIMEN_TMPL = template$7.join('\n');

    const template$8 = [
        '!0',
        '{value}',
        '<!-- filename: {name} -->',
        '!0'
    ];
    var DRAWABLE_TMPL = template$8.join('\n');

    function caseInsensitve(a, b) {
        return (a.toString().toLowerCase() >= b.toString().toLowerCase() ? 1 : -1);
    }
    class FileView extends File {
        constructor() {
            super(SETTINGS.outputDirectory, SETTINGS.outputMaxProcessingTime, SETTINGS.outputArchiveFileType);
        }
        saveAllToDisk(data) {
            const files = [];
            const views = [...data.views, ...data.includes];
            for (let i = 0; i < views.length; i++) {
                const view = views[i];
                files.push(this.getLayoutFile(view.pathname, (i === 0 ? SETTINGS.outputActivityMainFileName : `${view.filename}.xml`), view.content));
            }
            const xml = this.resourceDrawableToXml();
            files.push(...this.parseFileDetails(this.resourceStringToXml()));
            files.push(...this.parseFileDetails(this.resourceStringArrayToXml()));
            files.push(...this.parseFileDetails(this.resourceFontToXml()));
            files.push(...this.parseFileDetails(this.resourceColorToXml()));
            files.push(...this.parseFileDetails(this.resourceStyleToXml()));
            files.push(...this.parseFileDetails(this.resourceDimenToXml()));
            files.push(...this.parseImageDetails(xml), ...this.parseFileDetails(xml));
            this.saveToDisk(files);
        }
        layoutAllToXml(data, saveToDisk = false) {
            const result = {};
            const files = [];
            const views = [...data.views, ...data.includes];
            for (let i = 0; i < views.length; i++) {
                const view = views[i];
                result[view.filename] = view.content;
                if (saveToDisk) {
                    files.push(this.getLayoutFile(view.pathname, (i === 0 ? SETTINGS.outputActivityMainFileName : `${view.filename}.xml`), view.content));
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
                dimen: this.resourceDimenToXml(),
                drawable: this.resourceDrawableToXml()
            };
            for (const resource in result) {
                if (result[resource] === '') {
                    delete result[resource];
                }
            }
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
            let xml = '';
            this.stored.STRINGS = new Map([...this.stored.STRINGS.entries()].sort(caseInsensitve));
            if (this.stored.STRINGS.size > 0) {
                const template = parseTemplate(STRING_TMPL);
                const data = {
                    '0': [{
                            '1': []
                        }]
                };
                const root = getTemplateLevel(data, '0');
                if (this.appName !== '' && !this.stored.STRINGS.has('app_name')) {
                    root['1'].push({ name: 'app_name', value: this.appName });
                }
                for (const [name, value] of this.stored.STRINGS.entries()) {
                    root['1'].push({ name, value });
                }
                xml = insertTemplateData(template, data);
                xml = replaceTab(xml, SETTINGS.insertSpaces, true);
                if (saveToDisk) {
                    this.saveToDisk(this.parseFileDetails(xml));
                }
            }
            return xml;
        }
        resourceStringArrayToXml(saveToDisk = false) {
            let xml = '';
            this.stored.ARRAYS = new Map([...this.stored.ARRAYS.entries()].sort());
            if (this.stored.ARRAYS.size > 0) {
                const template = parseTemplate(STRINGARRAY_TMPL);
                const data = {
                    '0': [{
                            '1': []
                        }]
                };
                const root = getTemplateLevel(data, '0');
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
                xml = insertTemplateData(template, data);
                xml = replaceTab(xml, SETTINGS.insertSpaces, true);
                if (saveToDisk) {
                    this.saveToDisk(this.parseFileDetails(xml));
                }
            }
            return xml;
        }
        resourceFontToXml(saveToDisk = false) {
            let xml = '';
            this.stored.FONTS = new Map([...this.stored.FONTS.entries()].sort());
            if (this.stored.FONTS.size > 0) {
                const template = parseTemplate(FONT_TMPL);
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
                    const root = getTemplateLevel(data, '0');
                    for (const attr in font) {
                        const [style, weight] = attr.split('-');
                        root['1'].push({
                            style,
                            weight,
                            font: `@font/${name + (style === 'normal' && weight === '400' ? `_${style}`
                            : (style !== 'normal' ? `_${style}` : '') + (weight !== '400' ? `_${FONTWEIGHT_ANDROID[weight] || weight}`
                                : ''))}`
                        });
                    }
                    xml += '\n\n' + insertTemplateData(template, data);
                }
                xml = replaceTab(xml, SETTINGS.insertSpaces);
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
                const template = parseTemplate(COLOR_TMPL);
                const data = {
                    '0': [{
                            '1': []
                        }]
                };
                const root = getTemplateLevel(data, '0');
                for (const [name, value] of this.stored.COLORS.entries()) {
                    root['1'].push({ name, value });
                }
                xml = insertTemplateData(template, data);
                xml = replaceTab(xml, SETTINGS.insertSpaces);
                if (saveToDisk) {
                    this.saveToDisk(this.parseFileDetails(xml));
                }
            }
            return xml;
        }
        resourceStyleToXml(saveToDisk = false) {
            let xml = '';
            if (this.stored.STYLES.size > 0) {
                this.stored.STYLES = new Map([...this.stored.STYLES.entries()].sort(caseInsensitve));
                const template = parseTemplate(STYLE_TMPL);
                const data = {
                    '0': [{
                            '1': []
                        }]
                };
                const root = getTemplateLevel(data, '0');
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
                xml = insertTemplateData(template, data);
                xml = replaceUnit(xml, true);
                xml = replaceTab(xml, SETTINGS.insertSpaces);
                if (saveToDisk) {
                    this.saveToDisk(this.parseFileDetails(xml));
                }
            }
            return xml;
        }
        resourceDimenToXml(saveToDisk = false) {
            let xml = '';
            this.stored.DIMENS = new Map([...this.stored.DIMENS.entries()].sort());
            if (this.stored.DIMENS.size > 0) {
                const template = parseTemplate(DIMEN_TMPL);
                const data = {
                    '0': [{
                            '1': []
                        }]
                };
                const root = getTemplateLevel(data, '0');
                for (const [name, value] of this.stored.DIMENS.entries()) {
                    root['1'].push({ name, value });
                }
                xml = insertTemplateData(template, data);
                xml = replaceUnit(xml);
                xml = replaceTab(xml, SETTINGS.insertSpaces);
                if (saveToDisk) {
                    this.saveToDisk(this.parseFileDetails(xml));
                }
            }
            return xml;
        }
        resourceDrawableToXml(saveToDisk = false) {
            let xml = '';
            if (this.stored.DRAWABLES.size > 0 || this.stored.IMAGES.size > 0) {
                const template = parseTemplate(DRAWABLE_TMPL);
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
                            root.push({ name: `res/drawable-${dpi}/${name}.${lastIndexOf(images[dpi], '.')}`, value: `<!-- image: ${images[dpi]} -->` });
                        }
                    }
                    else if (images['mdpi'] != null) {
                        root.push({ name: `res/drawable/${name}.${lastIndexOf(images['mdpi'], '.')}`, value: `<!-- image: ${images['mdpi']} -->` });
                    }
                }
                xml = insertTemplateData(template, data);
                xml = replaceUnit(xml);
                xml = replaceTab(xml, SETTINGS.insertSpaces);
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
                    filename: match[3],
                    content: ''
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
                    if (getElementCache(this.element, 'andromeExternalDisplay') == null) {
                        const display = [];
                        let current = this.element;
                        while (current != null) {
                            display.push(getStyle(current).display);
                            current.style.display = 'block';
                            current = current.parentElement;
                        }
                        setElementCache(this.element, 'andromeExternalDisplay', display);
                    }
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
            if (init || this.included()) {
                if (this.element != null) {
                    const data = getElementCache(this.element, 'andromeExternalDisplay');
                    if (data) {
                        const display = data;
                        let current = this.element;
                        let i = 0;
                        while (current != null) {
                            current.style.display = display[i];
                            current = current.parentElement;
                            i++;
                        }
                        deleteElementCache(this.element, 'andromeExternalDisplay');
                    }
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

    class Custom extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
            this.require(EXT_NAME.EXTERNAL, true);
        }
        processNode() {
            let xml = '';
            const node = this.node;
            const parent = this.parent;
            const data = this.getData();
            if (data.tag) {
                if (node.children.length > 0) {
                    xml = this.application.controllerHandler.renderGroup(node, parent, data.tag);
                }
                else {
                    xml = this.application.controllerHandler.renderNode(node, parent, data.tag);
                }
                node.nodeType = (node.blockStatic ? NODE_STANDARD.BLOCK : NODE_STANDARD.INLINE);
            }
            if (data.tagChild) {
                node.each(item => {
                    if (item.element instanceof HTMLElement) {
                        item.element.dataset.ext = this.name;
                        item.element.dataset.andromeCustomTag = data.tagChild;
                    }
                });
            }
            return { xml, complete: false };
        }
    }

    class CustomAndroid extends Custom {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        afterInsert() {
            const node = this.node;
            const options = Object.assign({}, this.options[node.element.id]);
            node.apply(formatResource(options));
        }
    }

    class List extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        condition() {
            const children = this.node.children;
            const floated = new Set(children.slice(1).map(node => node.float));
            return (super.condition() && children.length > 0 && (children.every(node => node.blockStatic) ||
                children.every(node => node.inlineElement) ||
                children.every((node, index) => !node.floating && (index === 0 || index === children.length - 1 || node.blockStatic || (node.inlineElement && children[index - 1].blockStatic && children[index + 1].blockStatic))) ||
                (children.every(node => node.float !== 'none' && node.float === children[0].float) && floated.size === 1 && (floated.has('none') || floated.has(children[0].float)))) && (children.some((node) => node.display === 'list-item' && (node.css('listStyleType') !== 'none' || this.hasSingleImage(node))) ||
                children.every((node) => node.tagName !== 'LI' && node.styleMap.listStyleType === 'none' && this.hasSingleImage(node))));
        }
        processNode() {
            let xml = '';
            const node = this.node;
            const parent = this.parent;
            if (NodeList.linearY(node.children)) {
                xml = this.application.writeGridLayout(node, parent, (node.children.some(item => item.css('listStylePosition') === 'inside') ? 3 : 2));
            }
            else {
                xml = this.application.writeLinearLayout(node, parent, true);
            }
            let i = 0;
            node.each((item) => {
                let ordinal = '0';
                if (item.display === 'list-item' || item.has('listStyleType') || this.hasSingleImage(item)) {
                    let image = item.css('listStyleImage');
                    if (image && image !== 'none') {
                        ordinal = { image, position: '' };
                    }
                    else {
                        switch (item.css('listStyleType')) {
                            case 'disc':
                                ordinal = '●';
                                break;
                            case 'square':
                                ordinal = '■';
                                break;
                            case 'decimal':
                                ordinal = `${(i + 1).toString()}.`;
                                break;
                            case 'decimal-leading-zero':
                                ordinal = `${(i < 9 ? '0' : '') + (i + 1).toString()}.`;
                                break;
                            case 'lower-alpha':
                            case 'lower-latin':
                                ordinal = `${convertAlpha(i).toLowerCase()}.`;
                                break;
                            case 'upper-alpha':
                            case 'upper-latin':
                                ordinal = `${convertAlpha(i)}.`;
                                break;
                            case 'lower-roman':
                                ordinal = `${convertRoman(i + 1).toLowerCase()}.`;
                                break;
                            case 'upper-roman':
                                ordinal = `${convertRoman(i + 1)}.`;
                                break;
                            case 'none':
                                image = '';
                                let position = '';
                                const repeat$$1 = item.css('backgroundRepeat');
                                if (repeat$$1 === 'no-repeat') {
                                    image = item.css('backgroundImage');
                                    position = item.css('backgroundPosition');
                                }
                                if (image && image !== 'none') {
                                    ordinal = { image, position };
                                    item.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
                                }
                                break;
                            default:
                                ordinal = '○';
                                break;
                        }
                    }
                    i++;
                }
                item.data(EXT_NAME.LIST, 'listStyleType', ordinal);
            });
            return { xml, complete: true };
        }
        beforeInsert() {
            const node = this.node;
            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
            node.modifyBox(BOX_STANDARD.PADDING_LEFT, null);
        }
        hasSingleImage(node) {
            return (node.css('backgroundImage') !== 'none' && node.css('backgroundRepeat') === 'no-repeat');
        }
    }

    class ListAndroid extends List {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processChild() {
            const controller = this.application.controllerHandler;
            const node = this.node;
            const parent = this.parent;
            const listStyle = this.node.data(EXT_NAME.LIST, 'listStyleType') || '0';
            const parentLeft = convertInt(parent.css('paddingLeft')) + convertInt(parent.cssOriginal('marginLeft', true));
            let columnCount = 0;
            let paddingLeft = node.marginLeft;
            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
            if (parent.is(NODE_STANDARD.GRID)) {
                columnCount = convertInt(parent.app('columnCount'));
                paddingLeft += parentLeft;
            }
            else if (parent.children[0] === node) {
                paddingLeft += parentLeft;
            }
            const floatItem = node.children.find(item => item.float === 'left' &&
                convertInt(item.cssOriginal('marginLeft', true)) < 0 &&
                Math.abs(convertInt(item.cssOriginal('marginLeft', true))) <= convertInt(item.documentParent.cssOriginal('marginLeft', true)));
            if (floatItem && listStyle === '0') {
                floatItem.parent = parent;
                let xml = '';
                if (floatItem.inlineText || floatItem.children.length === 0) {
                    xml = controller.renderNode(floatItem, parent, NODE_STANDARD.TEXT);
                }
                else if (floatItem.children.every(item => item.pageflow && !item.floating)) {
                    xml = controller.renderGroup(floatItem, parent, NODE_STANDARD.RELATIVE);
                    floatItem.alignmentType = NODE_ALIGNMENT.INLINE_WRAP;
                }
                else {
                    xml = controller.renderGroup(floatItem, parent, NODE_STANDARD.CONSTRAINT);
                }
                controller.prependBefore(node.id, xml);
                if (columnCount === 3) {
                    node.app('layout_columnSpan', '2');
                }
                paddingLeft += floatItem.marginLeft;
                floatItem.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
                if (floatItem.viewWidth === 0 && paddingLeft > 0) {
                    floatItem.android('minWidth', formatPX(paddingLeft));
                }
            }
            else {
                const columnWeight = (columnCount > 0 ? '0' : '');
                const positionInside = (node.css('listStylePosition') === 'inside');
                const listStyleImage = !['', 'none'].includes(node.css('listStyleImage'));
                let image = '';
                let [left, top] = [0, 0];
                if (typeof listStyle === 'object') {
                    image = ResourceView.addImageURL(listStyle.image);
                    [left, top] = ResourceView.parseBackgroundPosition(listStyle.position, node.css('fontSize')).map(value => convertInt(value));
                }
                const gravity = ((image !== '' && !listStyleImage) || (parentLeft === 0 && node.marginLeft === 0) ? '' : 'right');
                if (gravity === '') {
                    paddingLeft += node.paddingLeft;
                    node.modifyBox(BOX_STANDARD.PADDING_LEFT, null);
                }
                if (left > 0 && paddingLeft > left) {
                    paddingLeft -= left;
                }
                paddingLeft = Math.max(paddingLeft, 20);
                const minWidth = (paddingLeft > 0 ? delimitDimens(node.nodeName, parseRTL('min_width'), formatPX(paddingLeft)) : '');
                const paddingRight = (() => {
                    if (paddingLeft <= 24) {
                        return 6;
                    }
                    else if (paddingLeft <= 32) {
                        return 8;
                    }
                    else {
                        return 10;
                    }
                })();
                const paddingLeftValue = (gravity === '' && image === '' ? delimitDimens(node.nodeName, parseRTL('padding_left'), formatPX(paddingRight)) : '');
                const paddingRightValue = (gravity === 'right' ? delimitDimens(node.nodeName, parseRTL('padding_right'), formatPX(paddingRight)) : '');
                const marginLeftValue = (left > 0 ? delimitDimens(node.nodeName, parseRTL('margin_left'), formatPX(left)) : '');
                const options = {
                    android: {
                        layout_marginTop: (node.marginTop + top > 0 ? delimitDimens(node.nodeName, 'margin_top', formatPX(node.marginTop + top)) : '')
                    },
                    app: {
                        layout_columnWeight: columnWeight
                    }
                };
                if (positionInside) {
                    controller.prependBefore(node.id, controller.renderNodeStatic(NODE_STANDARD.SPACE, parent.renderDepth + 1, {
                        android: {
                            minWidth,
                            [parseRTL('layout_marginLeft')]: marginLeftValue,
                            [parseRTL('paddingLeft')]: paddingLeftValue,
                            [parseRTL('paddingRight')]: paddingRightValue
                        },
                        app: {
                            layout_columnWeight: columnWeight
                        }
                    }, 'wrap_content', 'wrap_content'));
                    Object.assign(options.android, {
                        minWidth: delimitDimens(node.nodeName, parseRTL('min_width'), formatPX(24))
                    });
                }
                else {
                    Object.assign(options.android, {
                        minWidth,
                        gravity: parseRTL(gravity),
                        [parseRTL('layout_marginLeft')]: marginLeftValue,
                        [parseRTL('paddingLeft')]: paddingLeftValue,
                        [parseRTL('paddingRight')]: paddingRightValue
                    });
                    if (columnCount === 3) {
                        node.app('layout_columnSpan', '2');
                    }
                }
                if (node.tagName === 'DT' && image === '') {
                    node.app('layout_columnSpan', columnCount.toString());
                }
                else {
                    if (image !== '') {
                        Object.assign(options.android, {
                            src: `@drawable/${image}`,
                            baselineAlignBottom: 'true',
                            scaleType: (!positionInside && gravity === 'right' ? 'fitEnd' : 'fitStart')
                        });
                    }
                    else {
                        Object.assign(options.android, {
                            text: (listStyle !== '0' ? listStyle : '')
                        });
                    }
                    controller.prependBefore(node.id, controller.renderNodeStatic((image !== '' ? NODE_STANDARD.IMAGE
                        : (listStyle !== '0' ? NODE_STANDARD.TEXT : NODE_STANDARD.SPACE)), parent.renderDepth + 1, options, 'wrap_content', 'wrap_content'));
                }
            }
            if (columnCount > 0) {
                node.app('layout_columnWeight', '1');
            }
            return { xml: '', complete: true };
        }
        afterInsert() {
            const node = this.node;
            if (node.is(NODE_STANDARD.GRID)) {
                node.android('layout_width', 'match_parent');
            }
        }
    }

    class Grid extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        condition() {
            const node = this.node;
            return (this.included() ||
                (node.children.length > 1 && ((node.display === 'table' && node.children.every(item => item.display === 'table-row' && item.children.every(child => child.display === 'table-cell'))) ||
                    (node.children.every(item => item.pageflow && !item.has('backgroundColor') && !item.has('backgroundImage') && (item.borderTopWidth + item.borderRightWidth + item.borderBottomWidth + item.borderLeftWidth === 0) && (!item.inlineElement || item.blockStatic)) && (node.css('listStyle') === 'none' ||
                        node.children.every(item => item.display === 'list-item' && item.css('listStyleType') === 'none') ||
                        (!hasValue(node.dataset.ext) && !node.flex.enabled && node.children.length > 1 && node.children.some(item => item.children.length > 1) && !node.children.some(item => item.display === 'list-item' || item.textElement)))))));
        }
        processNode(mapX) {
            let xml = '';
            const node = this.node;
            const parent = this.parent;
            const columnBalance = this.options.columnBalance;
            let columns = [];
            const mainData = {
                columnEnd: [],
                columnCount: 0,
                padding: { top: 0, right: 0, bottom: 0, left: 0 }
            };
            if (columnBalance) {
                const dimensions = [];
                node.each((item, index) => {
                    const children = item.children;
                    dimensions[index] = [];
                    for (let l = 0; l < children.length; l++) {
                        dimensions[index].push(children[l].bounds.width);
                    }
                    columns.push(children);
                });
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
                                    columns[m][assigned[m] + (every ? 1 : 0)].data(EXT_NAME.GRID, 'gridSiblings', [...removed]);
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
                                        columns[m][assigned[m] + (every ? 1 : 0)].data(EXT_NAME.GRID, 'gridSiblings', [...removed]);
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
                const nextMapX = mapX[node.depth + 2];
                const nextCoordsX = (nextMapX ? Object.keys(nextMapX) : []);
                const columnEnd = [];
                if (nextCoordsX.length > 1) {
                    const columnRight = [];
                    for (let l = 0; l < nextCoordsX.length; l++) {
                        const nextAxisX = sortAsc(nextMapX[parseInt(nextCoordsX[l])].filter(item => item.documentParent.documentParent.id === node.id), 'linear.top');
                        if (l === 0 && nextAxisX.length === 0) {
                            return { xml: '', complete: false };
                        }
                        columnRight[l] = (l === 0 ? 0 : columnRight[l - 1]);
                        for (let m = 0; m < nextAxisX.length; m++) {
                            const nextX = nextAxisX[m];
                            let [left, right] = [nextX.linear.left, nextX.linear.right];
                            let index = l;
                            if (index > 0 && nextX.element instanceof HTMLElement && nextX.float === 'right') {
                                nextX.element.style.cssFloat = 'left';
                                const bounds = nextX.element.getBoundingClientRect();
                                if ((bounds.left - nextX.marginLeft) !== left) {
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
                            function findRowIndex() {
                                return columns[0].findIndex(item => withinFraction(item.linear.top, nextX.linear.top) ||
                                    (nextX.linear.top >= item.linear.top && nextX.linear.bottom <= item.linear.bottom));
                            }
                            if (index === 0 || left >= columnRight[index - 1]) {
                                if (columns[index] == null) {
                                    columns[index] = [];
                                }
                                if (index === 0 || columns[0].length === nextAxisX.length) {
                                    columns[index][m] = nextX;
                                }
                                else {
                                    const row = findRowIndex();
                                    if (row !== -1) {
                                        columns[index][row] = nextX;
                                    }
                                }
                            }
                            else {
                                const current = columns.length - 1;
                                if (columns[current] != null) {
                                    const minLeft = columns[current].reduce((a, b) => Math.min(a, b.linear.left), Number.MAX_VALUE);
                                    const maxRight = columns[current].reduce((a, b) => Math.max(a, b.linear.right), 0);
                                    if (left > minLeft && right > maxRight) {
                                        const filtered = columns.filter(item => item);
                                        const row = findRowIndex();
                                        if (row !== -1 && filtered[filtered.length - 1][row] == null) {
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
                        if (columns[l] != null) {
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
                mainData.columnCount = (columnBalance ? columns[0].length : columns.length);
                xml = this.application.writeGridLayout(node, parent, mainData.columnCount);
                node.children.length = 0;
                for (let l = 0, count = 0; l < columns.length; l++) {
                    let spacer = 0;
                    for (let m = 0, start = 0; m < columns[l].length; m++) {
                        const item = columns[l][m];
                        if (!item.spacer) {
                            item.parent.hide();
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
                                data.rowStart = (m === 0);
                                data.rowEnd = (m === columns[l].length - 1);
                                data.cellFirst = (l === 0 && m === 0);
                                data.cellLast = (l === columns.length - 1 && data.rowEnd);
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
                                data.rowStart = (start++ === 0);
                                data.rowEnd = (columnSpan + l === columns.length);
                                data.cellFirst = (count++ === 0);
                                data.cellLast = (data.rowEnd && m === columns[l].length - 1);
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
            return { xml, complete: true };
        }
        processChild() {
            let xml = '';
            const node = this.node;
            const parent = this.parent;
            const mainData = parent.data(EXT_NAME.GRID, 'mainData');
            const cellData = node.data(EXT_NAME.GRID, 'cellData');
            if (mainData && cellData) {
                let siblings;
                if (this.options.columnBalance) {
                    siblings = node.data(EXT_NAME.GRID, 'gridSiblings');
                }
                else {
                    const columnEnd = mainData.columnEnd[Math.min(cellData.index + (cellData.columnSpan - 1), mainData.columnEnd.length - 1)];
                    siblings =
                        Array.from(node.documentParent.element.children).map(element => {
                            const item = getNodeFromElement(element);
                            return (item && item.visible && !item.excluded && !item.rendered && item.linear.left >= node.linear.right && item.linear.right <= columnEnd ? item : null);
                        })
                            .filter(item => item);
                }
                if (siblings && siblings.length > 0) {
                    siblings.unshift(node);
                    const [linearX, linearY] = [NodeList.linearX(siblings), NodeList.linearY(siblings)];
                    const group = this.application.controllerHandler.createGroup(parent, node, siblings);
                    if (linearX || linearY) {
                        xml = this.application.writeLinearLayout(group, parent, linearX);
                        group.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                    }
                    else {
                        xml = this.application.writeConstraintLayout(group, parent);
                    }
                    return { xml, parent: group, complete: true };
                }
            }
            return { xml, complete: true };
        }
    }

    class GridAndroid extends Grid {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processChild() {
            const node = this.node;
            const data = node.data(EXT_NAME.GRID, 'cellData');
            if (data) {
                if (data.rowSpan > 1) {
                    node.app('layout_rowSpan', data.rowSpan.toString());
                }
                if (data.columnSpan > 1) {
                    node.app('layout_columnSpan', data.columnSpan.toString());
                }
                if (node.parent.display === 'table' && node.display === 'table-cell') {
                    node.app('layout_gravity', 'fill');
                }
            }
            return super.processChild();
        }
        afterRender() {
            const extended = [];
            this.application.cache.each((node) => {
                if (node.renderExtension.includes(this)) {
                    extended.push(node);
                }
                else {
                    const parent = node.renderParent;
                    if (parent.is(NODE_STANDARD.GRID) && !(parent.display === 'table' && parent.css('borderCollapse') === 'collapse')) {
                        const mainData = parent.data(EXT_NAME.GRID, 'mainData');
                        const cellData = node.data(EXT_NAME.GRID, 'cellData');
                        if (mainData && cellData) {
                            const dimensions = getBoxSpacing(node.documentParent.element, true);
                            const padding = mainData.padding;
                            if (cellData.cellFirst) {
                                padding.top = dimensions.paddingTop + dimensions.marginTop;
                            }
                            if (cellData.rowStart) {
                                padding.left = Math.max(dimensions.marginLeft + dimensions.paddingLeft, padding.left);
                            }
                            if (cellData.rowEnd) {
                                const heightBottom = dimensions.marginBottom + dimensions.paddingBottom + (!cellData.cellLast ? dimensions.marginTop + dimensions.paddingTop : 0);
                                if (heightBottom > 0) {
                                    if (cellData.cellLast) {
                                        padding.bottom = heightBottom;
                                    }
                                    else {
                                        this.application.controllerHandler.appendAfter(node.id, this.application.controllerHandler.renderNodeStatic(NODE_STANDARD.SPACE, node.renderDepth, {
                                            app: {
                                                layout_columnSpan: mainData.columnCount.toString()
                                            }
                                        }, 'match_parent', formatPX(heightBottom)));
                                    }
                                }
                                padding.right = Math.max(dimensions.marginRight + dimensions.paddingRight, padding.right);
                            }
                        }
                    }
                }
            });
            for (const node of extended) {
                const data = node.data(EXT_NAME.GRID, 'mainData');
                if (data) {
                    node.modifyBox(BOX_STANDARD.PADDING_TOP, data.padding.top);
                    node.modifyBox(BOX_STANDARD.PADDING_RIGHT, data.padding.right);
                    node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, data.padding.bottom);
                    node.modifyBox(BOX_STANDARD.PADDING_LEFT, data.padding.left);
                }
            }
        }
    }

    class Table extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processNode() {
            let xml = '';
            const node = this.node;
            const parent = this.parent;
            const table = [];
            const thead = node.children.filter(item => item.tagName === 'THEAD');
            const tbody = node.children.filter(item => item.tagName === 'TBODY');
            const tfoot = node.children.filter(item => item.tagName === 'TFOOT');
            const colgroup = Array.from(node.element.children).find(element => element.tagName === 'COLGROUP');
            const tableWidth = node.css('width');
            if (thead.length > 0) {
                thead[0].cascade().filter(item => item.tagName === 'TH' || item.tagName === 'TD').forEach(item => item.inherit(thead[0], 'styleMap'));
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
                tfoot[0].cascade().filter(item => item.tagName === 'TH' || item.tagName === 'TD').forEach(item => item.inherit(tfoot[0], 'styleMap'));
                table.push(...tfoot[0].children);
                tfoot.forEach(item => item.hide());
            }
            const borderCollapse = (node.css('borderCollapse') === 'collapse');
            const [width, height] = (borderCollapse ? [0, 0] : node.css('borderSpacing').split(' ').map(value => parseInt(value)));
            if (width > 0) {
                node.modifyBox(BOX_STANDARD.PADDING_LEFT, width);
                node.modifyBox(BOX_STANDARD.PADDING_RIGHT, width);
            }
            if (height > 0) {
                node.modifyBox(BOX_STANDARD.PADDING_TOP, height);
                node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, height);
            }
            const spacingWidth = formatPX((width > 1 ? Math.round(width / 2) : width));
            const spacingHeight = formatPX((height > 1 ? Math.round(height / 2) : width));
            const mapWidth = [];
            const mapBounds = [];
            const fixedTable = (node.css('tableLayout') === 'fixed');
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
                        if (colgroup != null) {
                            const style = getStyle(colgroup.children[columnIndex[i]]);
                            if (style.background) {
                                item.style.background = style.background;
                            }
                            else if (style.backgroundColor) {
                                item.style.backgroundColor = style.backgroundColor;
                            }
                        }
                        else {
                            let value = cssInherit(item, 'background', 'TABLE', ['rgba(0, 0, 0, 0)']);
                            if (value !== '') {
                                item.style.background = value;
                            }
                            else {
                                value = cssInherit(item, 'backgroundColor', 'TABLE', ['rgba(0, 0, 0, 0)']);
                                if (value !== '') {
                                    item.style.backgroundColor = value;
                                }
                            }
                        }
                    }
                    const columnWidth = td.styleMap.width;
                    const m = columnIndex[i];
                    if (i === 0 || mapWidth[m] == null || !fixedTable) {
                        if (columnWidth == null || columnWidth === 'auto') {
                            if (mapWidth[m] == null) {
                                mapWidth[m] = columnWidth || '0px';
                                mapBounds[m] = 0;
                            }
                        }
                        else {
                            const percentColumnWidth = isPercent(columnWidth);
                            const unitMapWidth = isUnit(mapWidth[m]);
                            if (mapWidth[m] == null || td.bounds.width > mapBounds[m] || (td.bounds.width === mapBounds[m] && ((mapWidth[m] === 'auto' && (percentColumnWidth || unitMapWidth)) || (percentColumnWidth && unitMapWidth) || (percentColumnWidth && isPercent(mapWidth[m]) && convertFloat(columnWidth) > convertFloat(mapWidth[m])) || (isUnit(columnWidth) && unitMapWidth && convertInt(columnWidth) > convertInt(mapWidth[m]))))) {
                                mapWidth[m] = columnWidth;
                            }
                            if (element.colSpan === 1) {
                                mapBounds[m] = td.bounds.width;
                            }
                        }
                    }
                    td.css({
                        marginTop: (i === 0 ? '0px' : spacingHeight),
                        marginRight: (j < tr.children.length - 1 ? spacingWidth : '0px'),
                        marginBottom: (i + element.rowSpan - 1 >= table.length - 1 ? '0px' : spacingHeight),
                        marginLeft: (columnIndex[i] === 0 ? '0px' : spacingWidth)
                    });
                    if (!multiLine) {
                        multiLine = td.multiLine;
                    }
                    columnIndex[i] += element.colSpan;
                }
            }
            const columnCount = Math.max.apply(null, columnIndex);
            let rowCount = table.length;
            let borderInside = false;
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
                if (isPercent(tableWidth) || pxWidth < node.viewWidth) {
                    mapWidth.forEach((value, index) => mapWidth[index] = `${(parseInt(value) / pxWidth) * 100}%`);
                }
                else if (tableWidth === 'auto') {
                    mapWidth.forEach((value, index) => mapWidth[index] = (mapBounds[index] == null ? 'undefined' : `${(mapBounds[index] / node.bounds.width) * 100}%`));
                }
                else if (pxWidth > node.viewWidth) {
                    node.css('width', 'auto');
                    if (!fixedTable) {
                        node.cascade().forEach(item => item.css('width', 'auto'));
                    }
                }
            }
            const mapPercent = mapWidth.reduce((a, b) => a + (isPercent(b) ? parseFloat(b) : 0), 0);
            const typeWidth = (() => {
                const auto = mapWidth.every(value => value === 'auto');
                const zeroWidth = mapWidth.every(value => value === '0px');
                if ((auto || zeroWidth) && (node.cssOriginal('width') === 'auto' || !node.has('width')) && !multiLine) {
                    return 0;
                }
                else if (auto || mapWidth.some(value => isPercent(value))) {
                    return 3;
                }
                else if (mapWidth.every(value => value === '0px' || mapWidth[0] === value) && (node.viewWidth > 0 || isPercent(node.css('width')) || multiLine)) {
                    return 2;
                }
                else if (mapWidth.every(value => isUnit(value) || value === 'auto')) {
                    return 1;
                }
                else {
                    return 0;
                }
            })();
            if ((typeWidth === 2 && node.viewWidth === 0) || multiLine) {
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
            function setAutoWidth(td) {
                td.data(EXT_NAME.TABLE, 'percent', `${Math.round((td.bounds.width / node.bounds.width) * 100)}%`);
                td.data(EXT_NAME.TABLE, 'expand', true);
            }
            function setBoundsWidth(td) {
                const boundsWidth = td.bounds.width - (td.borderLeftWidth + td.borderRightWidth);
                td.css('width', formatPX(boundsWidth));
            }
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
                    if (convertInt(td.css('borderWidth')) > 0 && td.css('borderStyle') !== 'none') {
                        borderInside = true;
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
                                else if (convertInt(columnWidth) > 0) {
                                    if (td.bounds.width >= parseInt(columnWidth)) {
                                        td.css('width', columnWidth);
                                        td.data(EXT_NAME.TABLE, 'expand', false);
                                        td.data(EXT_NAME.TABLE, 'downsized', false);
                                    }
                                    else {
                                        if (fixedTable) {
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
                                    if (fixedTable) {
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
            if (borderCollapse && borderInside) {
                node.css({
                    borderTopWidth: '0px',
                    borderRightWidth: '0px',
                    borderBottomWidth: '0px',
                    borderLeftWidth: '0px'
                });
            }
            node.data(EXT_NAME.TABLE, 'boundsWidth', mapBounds.reduce((a, b) => a + b, 0));
            xml = this.application.writeGridLayout(node, parent, columnCount, rowCount);
            return { xml, complete: true };
        }
    }

    class TableAndroid extends Table {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processNode() {
            const result = super.processNode();
            const node = this.node;
            const columnCount = convertInt(node.app('columnCount'));
            if (columnCount > 1) {
                let requireWidth = node.data(EXT_NAME.TABLE, 'expand') || false;
                node.each((item) => {
                    if (item.css('width') === '0px') {
                        item.android('layout_width', '0px');
                        item.app('layout_columnWeight', (item.element.colSpan || 1).toString());
                    }
                    else {
                        const expand = item.data(EXT_NAME.TABLE, 'expand');
                        const exceed = !!item.data(EXT_NAME.TABLE, 'exceed');
                        const downsized = !!item.data(EXT_NAME.TABLE, 'downsized');
                        if (expand != null) {
                            if (expand) {
                                const percent = convertFloat(item.data(EXT_NAME.TABLE, 'percent')) / 100;
                                if (percent > 0) {
                                    item.android('layout_width', '0px');
                                    item.app('layout_columnWeight', trimEnd(percent.toFixed(3), '0'));
                                    requireWidth = true;
                                }
                            }
                            else {
                                item.app('layout_columnWeight', '0');
                            }
                        }
                        if (downsized) {
                            if (exceed) {
                                item.app('layout_columnWeight', '0.01');
                            }
                            else {
                                if (item.textElement) {
                                    item.android('maxLines', '1');
                                }
                            }
                        }
                    }
                });
                if (requireWidth && (node.viewWidth === 0 && !isPercent(node.css('width')))) {
                    let widthParent = 0;
                    node.ascend(true).some(item => {
                        if (item.viewWidth > 0) {
                            widthParent = item.viewWidth;
                            return true;
                        }
                        return false;
                    });
                    if (node.bounds.width >= widthParent) {
                        node.android('layout_width', 'match_parent');
                    }
                    else {
                        node.css('width', formatPX(node.bounds.width));
                    }
                }
            }
            return result;
        }
        processChild() {
            const parent = this.parent;
            const node = this.node;
            const rowSpan = convertInt(node.data(EXT_NAME.TABLE, 'rowSpan'));
            const columnSpan = convertInt(node.data(EXT_NAME.TABLE, 'colSpan'));
            const spaceSpan = convertInt(node.data(EXT_NAME.TABLE, 'spaceSpan'));
            if (rowSpan > 1) {
                node.app('layout_rowSpan', rowSpan.toString());
            }
            if (columnSpan > 1) {
                node.app('layout_columnSpan', columnSpan.toString());
            }
            if (spaceSpan > 0) {
                this.application.controllerHandler.appendAfter(node.id, this.application.controllerHandler.renderNodeStatic(NODE_STANDARD.SPACE, parent.renderDepth + 1, {
                    app: {
                        layout_columnSpan: spaceSpan.toString()
                    }
                }, 'wrap_content', 'wrap_content'));
            }
            return { xml: '', complete: true };
        }
        beforeInsert() {
            const node = this.node;
            const tableWidth = node.toInt('width');
            const boundsWidth = node.data(EXT_NAME.TABLE, 'boundsWidth');
            if (!node.blockWidth && tableWidth > 0 && boundsWidth > tableWidth) {
                node.android('layout_width', formatPX(boundsWidth));
            }
        }
    }

    class Button extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        is(node) {
            return (super.is(node) && (node.tagName !== 'INPUT' || ['button', 'file', 'image', 'reset', 'search', 'submit'].includes(node.element.type)));
        }
        condition() {
            return this.included();
        }
    }

    const WIDGET_NAME = {
        FAB: 'androme.widget.floatingactionbutton',
        MENU: 'androme.widget.menu',
        COORDINATOR: 'androme.widget.coordinator',
        TOOLBAR: 'androme.widget.toolbar',
        DRAWER: 'androme.widget.drawer',
        BOTTOM_NAVIGATION: 'androme.widget.bottomnavigation'
    };
    const VIEW_SUPPORT = {
        DRAWER: 'android.support.v4.widget.DrawerLayout',
        NAVIGATION_VIEW: 'android.support.design.widget.NavigationView',
        COORDINATOR: 'android.support.design.widget.CoordinatorLayout',
        APPBAR: 'android.support.design.widget.AppBarLayout',
        COLLAPSING_TOOLBAR: 'android.support.design.widget.CollapsingToolbarLayout',
        TOOLBAR: 'android.support.v7.widget.Toolbar',
        FLOATING_ACTION_BUTTON: 'android.support.design.widget.FloatingActionButton',
        BOTTOM_NAVIGATION: 'android.support.design.widget.BottomNavigationView'
    };
    const VIEW_NAVIGATION = {
        MENU: 'menu',
        ITEM: 'item',
        GROUP: 'group'
    };
    const DRAWABLE_PREFIX = {
        MENU: 'ic_menu_',
        DIALOG: 'ic_dialog_'
    };

    class FloatingActionButton extends Button {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processNode() {
            const node = this.node;
            const parent = this.parent;
            const element = node.element;
            const options = Object.assign({}, this.options[element.id]);
            const backgroundColor = parseRGBA(node.css('backgroundColor'), node.css('opacity'));
            overwriteDefault(options, 'android', 'backgroundTint', (backgroundColor.length > 0 ? `@color/${ResourceView.addColor(backgroundColor[0], backgroundColor[2])}` : '?attr/colorAccent'));
            if (node.hasBit('excludeProcedure', NODE_PROCEDURE.ACCESSIBILITY)) {
                overwriteDefault(options, 'android', 'focusable', 'false');
            }
            let src = '';
            switch (element.tagName) {
                case 'IMG':
                    src = ResourceView.addImageSrcSet(element, DRAWABLE_PREFIX.DIALOG);
                    break;
                case 'INPUT':
                    if (element.type === 'image') {
                        src = ResourceView.addImage({ 'mdpi': element.src }, DRAWABLE_PREFIX.DIALOG);
                    }
                    else {
                        src = ResourceView.addImageURL(node.css('backgroundImage'), DRAWABLE_PREFIX.DIALOG);
                    }
                    break;
                case 'BUTTON':
                    src = ResourceView.addImageURL(node.css('backgroundImage'), DRAWABLE_PREFIX.DIALOG);
                    break;
            }
            if (src !== '') {
                overwriteDefault(options, 'app', 'srcCompat', `@drawable/${src}`);
            }
            const target = node.isSet('dataset', 'target');
            const xml = this.application.controllerHandler.renderNodeStatic(VIEW_SUPPORT.FLOATING_ACTION_BUTTON, (target ? -1 : parent.renderDepth + 1), options, 'wrap_content', 'wrap_content', node);
            node.nodeType = NODE_STANDARD.BUTTON;
            node.excludeResource |= NODE_RESOURCE.BOX_STYLE | NODE_RESOURCE.ASSET;
            if (!node.pageflow || target) {
                node.auto = false;
                this.setFrameGravity(node);
                if (target) {
                    let anchor = parent.stringId;
                    if (parent.controlName === VIEW_SUPPORT.TOOLBAR) {
                        const outerParent = parent.data(WIDGET_NAME.TOOLBAR, 'outerParent');
                        if (outerParent) {
                            anchor = outerParent;
                        }
                    }
                    node.app('layout_anchor', anchor);
                    node.app('layout_anchorGravity', node.android('layout_gravity'));
                    node.delete('android', 'layout_gravity');
                    node.excludeProcedure |= NODE_PROCEDURE.ALIGNMENT;
                    node.render(node);
                }
                else {
                    node.render(parent);
                }
            }
            else {
                node.render(parent);
            }
            return { xml, complete: true };
        }
        afterInsert() {
            const node = this.node;
            node.android('layout_width', 'wrap_content');
            node.android('layout_height', 'wrap_content');
        }
        setFrameGravity(node) {
            const parent = node.documentParent;
            const horizontalBias = node.horizontalBias;
            const verticalBias = node.verticalBias;
            const gravity = [];
            if (horizontalBias < 0.5) {
                gravity.push(parseRTL('left'));
            }
            else if (horizontalBias > 0.5) {
                gravity.push(parseRTL('right'));
            }
            else {
                gravity.push('center_horizontal');
            }
            if (verticalBias < 0.5) {
                gravity.push('top');
                node.app('layout_dodgeInsetEdges', 'top');
            }
            else if (verticalBias > 0.5) {
                gravity.push('bottom');
            }
            else {
                gravity.push('center_vertical');
            }
            node.android('layout_gravity', (gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|')));
            if (horizontalBias > 0 && horizontalBias < 1 && horizontalBias !== 0.5) {
                if (horizontalBias < 0.5) {
                    node.css('marginLeft', formatPX(Math.floor(node.bounds.left - parent.box.left)));
                }
                else {
                    node.css('marginRight', formatPX(Math.floor(parent.box.right - node.bounds.right)));
                }
            }
            if (verticalBias > 0 && verticalBias < 1 && verticalBias !== 0.5) {
                if (verticalBias < 0.5) {
                    node.css('marginTop', formatPX(Math.floor(node.bounds.top - parent.box.top)));
                }
                else {
                    node.css('marginBottom', formatPX(Math.floor(parent.box.bottom - node.bounds.bottom)));
                }
            }
        }
    }

    class Menu extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
            this.require(EXT_NAME.EXTERNAL, true);
        }
        init(element) {
            if (this.included(element)) {
                let valid = false;
                if (element.children.length > 0) {
                    const tagName = element.children[0].tagName;
                    valid = Array.from(element.children).every(item => item.tagName === tagName);
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
    class Menu$1 extends Menu {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        condition() {
            return this.included();
        }
        processNode() {
            const node = this.node;
            const xml = this.application.controllerHandler.renderNodeStatic(VIEW_NAVIGATION.MENU, 0, {}, '', '', node, true);
            node.documentRoot = true;
            node.nodeType = NODE_STANDARD.BLOCK;
            node.excludeResource |= NODE_RESOURCE.ALL;
            node.excludeProcedure |= NODE_PROCEDURE.ALL;
            node.rendered = true;
            node.cascade().forEach(item => item.renderExtensionChild.push(this));
            return { xml, complete: true };
        }
        processChild() {
            const node = this.node;
            const parent = this.parent;
            if (node.plainText) {
                node.hide();
                return { xml: '', complete: true, next: true };
            }
            const element = node.element;
            const options = { android: {}, app: {} };
            let next = false;
            let nodeName = VIEW_NAVIGATION.ITEM;
            let title = '';
            let layout = false;
            if (node.children.some(item => (!item.inlineElement || !item.blockStatic) && item.children.length > 0)) {
                if (node.children.some(item => item.tagName === 'NAV')) {
                    if (element.title !== '') {
                        title = element.title.trim();
                    }
                    else {
                        Array.from(node.element.childNodes).some((item) => {
                            if (item.nodeName === '#text') {
                                title = optional(item, 'textContent').trim();
                                if (title !== '') {
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
                    node.each(item => item.tagName !== 'NAV' && item.hide());
                }
                else if (node.tagName === 'NAV') {
                    nodeName = VIEW_NAVIGATION.MENU;
                    next = true;
                }
                else {
                    nodeName = VIEW_NAVIGATION.GROUP;
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
                if (parent.android('checkableBehavior') === '') {
                    if (this.hasInputType(node, 'checkbox')) {
                        options.android.checkable = 'true';
                    }
                }
                title = (element.title || element.innerText).trim();
            }
            switch (nodeName) {
                case VIEW_NAVIGATION.ITEM:
                    this.parseDataSet(VALIDATE_ITEM, element, options);
                    if (node.android('icon') === '') {
                        let src = ResourceView.addImageURL(element.style.backgroundImage, DRAWABLE_PREFIX.MENU);
                        if (src !== '') {
                            options.android.icon = `@drawable/${src}`;
                        }
                        else {
                            const image = node.children.find(item => item.imageElement);
                            if (image) {
                                src = ResourceView.addImageSrcSet(image.element, DRAWABLE_PREFIX.MENU);
                                if (src !== '') {
                                    options.android.icon = `@drawable/${src}`;
                                }
                            }
                        }
                    }
                    break;
                case VIEW_NAVIGATION.GROUP:
                    this.parseDataSet(VALIDATE_GROUP, element, options);
                    break;
            }
            if (node.android('title') === '') {
                if (title !== '') {
                    const name = ResourceView.addString(title);
                    if (name !== '') {
                        title = `@string/${name}`;
                    }
                    options.android.title = title;
                }
            }
            if (!options.android.id) {
                node.setNodeType(nodeName);
            }
            else {
                node.controlName = nodeName;
            }
            const xml = this.application.controllerHandler.renderNodeStatic(nodeName, parent.renderDepth + 1, options, '', '', node, layout);
            node.excludeResource |= NODE_RESOURCE.ALL;
            node.excludeProcedure |= NODE_PROCEDURE.ALL;
            node.rendered = true;
            return { xml, complete: true, next };
        }
        afterRender() {
            super.afterRender();
            if (this.included(this.node.element)) {
                this.application.currentLayout.pathname = 'res/menu';
            }
        }
        parseDataSet(validator, element, options) {
            for (const attr in element.dataset) {
                const value = element.dataset[attr];
                if (value != null && validator[attr] != null) {
                    const match = value.match(validator[attr]);
                    if (match) {
                        const namespace = ((this.options.appCompat == null || this.options.appCompat) && NAMESPACE_APP.includes(attr) ? 'app' : 'android');
                        options[namespace][attr] = Array.from(new Set(match)).join('|');
                    }
                }
            }
        }
        hasInputType(node, value) {
            return (node.children.length > 0 && node.children.some(item => item.element.type === value));
        }
    }

    class Coordinator extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processNode() {
            const node = this.node;
            const parent = this.parent;
            const xml = this.application.controllerHandler.renderGroup(node, parent, VIEW_SUPPORT.COORDINATOR);
            node.apply(this.options[node.element.id]);
            node.nodeType = NODE_STANDARD.BLOCK;
            node.excludeResource |= NODE_RESOURCE.ASSET;
            const toolbar = getNodeFromElement(locateExtension(node, WIDGET_NAME.TOOLBAR));
            if (toolbar) {
                const ext = this.application.getExtension(WIDGET_NAME.TOOLBAR);
                if (ext) {
                    const collapsingToolbar = (ext.options[toolbar.element.id] != null ? ext.options[toolbar.element.id].collapsingToolbar : null);
                    if (collapsingToolbar != null) {
                        node.android('fitsSystemWindows', 'true');
                    }
                }
            }
            return { xml, complete: false };
        }
        afterInsert() {
            const node = this.node;
            if (node.documentRoot) {
                node.android('layout_width', 'match_parent');
                node.android('layout_height', 'match_parent');
            }
        }
    }

    const template$9 = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '	<style name="{@appTheme}" parent="{@parentTheme}">',
        '!1',
        '		<item name="{name}">{value}</item>',
        '!1',
        '	</style>',
        '	<style name="{@appTheme}.NoActionBar">',
        '		<item name="windowActionBar">false</item>',
        '		<item name="windowNoTitle">true</item>',
        '	</style>',
        '	<style name="AppTheme.AppBarOverlay" parent="{@appBarOverlay}" />',
        '	<style name="AppTheme.PopupOverlay" parent="{@popupOverlay}" />',
        '</resources>',
        '!0'
    ];
    var EXTENSION_APPBAR_TMPL = template$9.join('\n');

    class Toolbar extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
            this.require(WIDGET_NAME.MENU);
        }
        init(element) {
            if (this.included(element)) {
                Array.from(element.children).some((item) => {
                    if (item.tagName === 'NAV' && !includes(item.dataset.ext, EXT_NAME.EXTERNAL)) {
                        item.dataset.ext = (hasValue(item.dataset.ext) ? `${item.dataset.ext}, ` : '') + EXT_NAME.EXTERNAL;
                        return true;
                    }
                    return false;
                });
                if (hasValue(element.dataset.target)) {
                    const target = document.getElementById(element.dataset.target);
                    if (target && element.parentElement !== target && !includes(optional(target, 'dataset.ext'), WIDGET_NAME.COORDINATOR)) {
                        this.application.elements.add(element);
                    }
                }
            }
            return false;
        }
        processNode() {
            let xml = '';
            const controller = this.application.controllerHandler;
            const node = this.node;
            const parent = this.parent;
            const target = node.isSet('dataset', 'target');
            const options = Object.assign({}, this.options[node.element.id]);
            const optionsToolbar = Object.assign({}, options.toolbar);
            const optionsAppBar = Object.assign({}, options.appBar);
            const optionsCollapsingToolbar = Object.assign({}, options.collapsingToolbar);
            const appBarChildren = [];
            const collapsingToolbarChildren = [];
            const hasMenu = (locateExtension(node, WIDGET_NAME.MENU) != null);
            const backgroundImage = node.has('backgroundImage');
            let depth = (target ? 0 : node.depth);
            let children = node.children.filter(item => item.auto).length;
            Array.from(node.element.children).forEach((element) => {
                if (element.tagName === 'IMG') {
                    if (hasValue(element.dataset.navigationIcon)) {
                        const result = ResourceView.addImageSrcSet(element, DRAWABLE_PREFIX.MENU);
                        if (result !== '') {
                            overwriteDefault(toolbar, 'app', 'navigationIcon', `@drawable/${result}`);
                            if (getStyle(element).display !== 'none') {
                                children--;
                            }
                        }
                    }
                    if (hasValue(element.dataset.collapseIcon)) {
                        const result = ResourceView.addImageSrcSet(element, DRAWABLE_PREFIX.MENU);
                        if (result !== '') {
                            overwriteDefault(toolbar, 'app', 'collapseIcon', `@drawable/${result}`);
                            if (getStyle(element).display !== 'none') {
                                children--;
                            }
                        }
                    }
                }
                if (hasValue(element.dataset.target)) {
                    children--;
                }
                else {
                    const targetNode = getNodeFromElement(element);
                    if (targetNode) {
                        switch (element.dataset.targetModule) {
                            case 'appBar':
                                appBarChildren.push(targetNode);
                                children--;
                                break;
                            case 'collapsingToolbar':
                                collapsingToolbarChildren.push(targetNode);
                                children--;
                                break;
                        }
                    }
                }
            });
            const collapsingToolbar = (options.collapsingToolbar != null || collapsingToolbarChildren.length > 0);
            const appBar = (options.appBar != null || appBarChildren.length > 0 || collapsingToolbar);
            let appBarOverlay = '';
            let popupOverlay = '';
            if (collapsingToolbar) {
                overwriteDefault(optionsToolbar, 'app', 'layout_collapseMode', 'pin');
            }
            else {
                if (!appBar) {
                    overwriteDefault(optionsToolbar, 'android', 'fitsSystemWindows', 'true');
                }
                overwriteDefault(optionsToolbar, 'app', 'popupTheme', '@style/ThemeOverlay.AppCompat.Light');
                if (backgroundImage) {
                    overwriteDefault(appBarChildren.length > 0 ? optionsAppBar : optionsToolbar, 'android', 'background', `@drawable/${ResourceView.addImageURL(node.css('backgroundImage'))}`);
                    node.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
                }
                else {
                    overwriteDefault(optionsToolbar, 'app', 'layout_scrollFlags', 'scroll|enterAlways');
                }
            }
            if (appBarChildren.length > 0) {
                overwriteDefault(optionsAppBar, 'android', 'layout_height', '?android:attr/actionBarSize');
            }
            else {
                overwriteDefault(optionsToolbar, 'android', 'layout_height', '?android:attr/actionBarSize');
                node.excludeProcedure |= NODE_PROCEDURE.LAYOUT;
            }
            if (hasMenu) {
                if (appBar) {
                    if (optionsToolbar.app.popupTheme != null) {
                        popupOverlay = optionsToolbar.app.popupTheme.replace('@style/', '');
                    }
                    optionsToolbar.app.popupTheme = '@style/AppTheme.PopupOverlay';
                }
            }
            const innerDepth = depth + (appBar ? 1 : 0) + (collapsingToolbar ? 1 : 0);
            xml =
                controller.renderNodeStatic(VIEW_SUPPORT.TOOLBAR, innerDepth, optionsToolbar, 'match_parent', 'wrap_content', node, (children > 0));
            if (collapsingToolbar) {
                if (backgroundImage) {
                    const optionsBackgroundImage = Object.assign({}, options.backgroundImage);
                    let scaleType = 'center';
                    switch (node.css('backgroundSize')) {
                        case 'cover':
                        case '100% auto':
                        case 'auto 100%':
                            scaleType = 'centerCrop';
                            break;
                        case 'contain':
                        case '100% 100%':
                            scaleType = 'fitXY';
                            break;
                        case 'auto':
                            scaleType = 'matrix';
                            break;
                    }
                    overwriteDefault(optionsBackgroundImage, 'android', 'id', `${node.stringId}_image`);
                    overwriteDefault(optionsBackgroundImage, 'android', 'src', `@drawable/${ResourceView.addImageURL(node.css('backgroundImage'))}`);
                    overwriteDefault(optionsBackgroundImage, 'android', 'scaleType', scaleType);
                    overwriteDefault(optionsBackgroundImage, 'android', 'fitsSystemWindows', 'true');
                    overwriteDefault(optionsBackgroundImage, 'app', 'layout_collapseMode', 'parallax');
                    xml =
                        controller.renderNodeStatic(NODE_ANDROID.IMAGE, innerDepth, optionsBackgroundImage, 'match_parent', 'match_parent')
                            + xml;
                    node.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
                }
            }
            let outer = '';
            let appBarNode = null;
            let collapsingToolbarNode = null;
            if (appBar) {
                overwriteDefault(optionsAppBar, 'android', 'id', `${node.stringId}_appbar`);
                overwriteDefault(optionsAppBar, 'android', 'layout_height', (node.viewHeight > 0 ? delimitDimens('appbar', 'height', formatPX(node.viewHeight)) : 'wrap_content'));
                overwriteDefault(optionsAppBar, 'android', 'fitsSystemWindows', 'true');
                if (hasMenu) {
                    if (optionsAppBar.android.theme != null) {
                        appBarOverlay = optionsAppBar.android.theme;
                    }
                    optionsAppBar.android.theme = '@style/AppTheme.AppBarOverlay';
                    this.createResourceTheme(appBarOverlay, popupOverlay);
                }
                else {
                    overwriteDefault(optionsAppBar, 'android', 'theme', '@style/ThemeOverlay.AppCompat.Dark.ActionBar');
                }
                appBarNode = createPlaceholder(this.application.cache.nextId, node, appBarChildren);
                appBarNode.nodeId = stripId(optionsAppBar.android.id);
                this.application.cache.append(appBarNode);
                outer =
                    controller.renderNodeStatic(VIEW_SUPPORT.APPBAR, (target ? -1 : depth), optionsAppBar, 'match_parent', 'wrap_content', appBarNode, true);
                if (collapsingToolbar) {
                    depth++;
                    overwriteDefault(optionsCollapsingToolbar, 'android', 'id', `${node.stringId}_collapsingtoolbar`);
                    overwriteDefault(optionsCollapsingToolbar, 'android', 'fitsSystemWindows', 'true');
                    if (!backgroundImage) {
                        overwriteDefault(optionsCollapsingToolbar, 'app', 'contentScrim', '?attr/colorPrimary');
                    }
                    overwriteDefault(optionsCollapsingToolbar, 'app', 'layout_scrollFlags', 'scroll|exitUntilCollapsed');
                    overwriteDefault(optionsCollapsingToolbar, 'app', 'toolbarId', node.stringId);
                    collapsingToolbarNode = createPlaceholder(this.application.cache.nextId, node, collapsingToolbarChildren);
                    collapsingToolbarNode.each(item => item.dataset.target = collapsingToolbarNode.nodeId);
                    this.application.cache.append(collapsingToolbarNode);
                    const content = controller.renderNodeStatic(VIEW_SUPPORT.COLLAPSING_TOOLBAR, (target && !appBar ? -1 : depth), optionsCollapsingToolbar, 'match_parent', 'match_parent', collapsingToolbarNode, true);
                    outer = replacePlaceholder(outer, appBarNode.id, content);
                }
            }
            if (appBarNode != null) {
                xml = (collapsingToolbarNode != null ? replacePlaceholder(outer, collapsingToolbarNode.id, xml) : replacePlaceholder(outer, appBarNode.id, xml));
                appBarNode.render((target ? appBarNode : parent));
                if (collapsingToolbarNode == null) {
                    node.parent = appBarNode;
                }
                else {
                    collapsingToolbarNode.parent = appBarNode;
                    collapsingToolbarNode.render(appBarNode);
                    node.parent = collapsingToolbarNode;
                }
                node.data(WIDGET_NAME.TOOLBAR, 'outerParent', appBarNode.stringId);
                node.render(node.parent);
            }
            else if (collapsingToolbarNode != null) {
                collapsingToolbarNode.render((target ? collapsingToolbarNode : parent));
                node.parent = collapsingToolbarNode;
                node.render(collapsingToolbarNode);
            }
            else {
                node.render((target ? node : parent));
            }
            node.nodeType = NODE_STANDARD.BLOCK;
            node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
            return { xml, complete: false };
        }
        processChild() {
            const node = this.node;
            if (node.imageElement && (hasValue(node.dataset.navigationIcon) || hasValue(node.dataset.collapseIcon))) {
                node.hide();
                return { xml: '', complete: true, next: true };
            }
            return { xml: '', complete: false };
        }
        beforeInsert() {
            const node = this.node;
            const menu = optional(locateExtension(node, WIDGET_NAME.MENU), 'dataset.viewName');
            if (menu !== '') {
                const options = Object.assign({}, this.options[node.element.id]);
                const optionsToolbar = Object.assign({}, options.toolbar);
                overwriteDefault(optionsToolbar, 'app', 'menu', `@menu/${menu}`);
                node.app('menu', optionsToolbar.app.menu);
            }
        }
        createResourceTheme(appBarOverlay, popupOverlay) {
            const options = Object.assign({}, this.options.resource);
            overwriteDefault(options, '', 'appTheme', 'AppTheme');
            overwriteDefault(options, '', 'parentTheme', 'Theme.AppCompat.Light.DarkActionBar');
            const data = {
                '0': [{
                        'appTheme': options.appTheme,
                        'parentTheme': options.parentTheme,
                        'appBarOverlay': appBarOverlay || 'ThemeOverlay.AppCompat.Dark.ActionBar',
                        'popupOverlay': popupOverlay || 'ThemeOverlay.AppCompat.Light',
                        '1': []
                    }]
            };
            overwriteDefault(options, 'output', 'path', 'res/values');
            overwriteDefault(options, 'output', 'file', `${WIDGET_NAME.TOOLBAR}.xml`);
            this.application.resourceHandler.addTheme(EXTENSION_APPBAR_TMPL, data, options);
        }
    }

    const template$a = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '	<style name="{@appTheme}" parent="{@parentTheme}">',
        '!1',
        '		<item name="{name}">{value}</item>',
        '!1',
        '	</style>',
        '</resources>',
        '!0'
    ];
    var EXTENSION_GENERIC_TMPL = template$a.join('\n');

    class BottomNavigation extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
            this.require(WIDGET_NAME.MENU);
        }
        processNode() {
            const node = this.node;
            const parent = this.parent;
            const options = Object.assign({}, this.options[node.element.id]);
            overwriteDefault(options, 'android', 'background', `?android:attr/windowBackground`);
            const xml = this.application.controllerHandler.renderNodeStatic(VIEW_SUPPORT.BOTTOM_NAVIGATION, node.depth, options, (parent.is(NODE_STANDARD.CONSTRAINT) ? '0px' : 'match_parent'), 'wrap_content', node);
            for (let i = 5; i < node.children.length; i++) {
                node.children[i].hide();
                node.children[i].cascade().forEach(item => item.hide());
            }
            node.cascade().forEach(item => item.renderExtensionChild.push(this));
            node.render(parent);
            node.nodeType = NODE_STANDARD.BLOCK;
            node.excludeResource |= NODE_RESOURCE.ASSET;
            this.createResourceTheme();
            return { xml, complete: true };
        }
        beforeInsert() {
            const node = this.node;
            const menu = optional(locateExtension(node, WIDGET_NAME.MENU), 'dataset.viewName');
            if (menu !== '') {
                const options = Object.assign({}, this.options[node.element.id]);
                overwriteDefault(options, 'app', 'menu', `@menu/${menu}`);
                node.app('menu', options.app.menu);
            }
        }
        afterInsert() {
            const node = this.node;
            if (!node.renderParent.has('width')) {
                node.renderParent.android('layout_width', 'match_parent');
            }
            if (!node.renderParent.has('height')) {
                node.renderParent.android('layout_height', 'match_parent');
            }
        }
        createResourceTheme() {
            const options = Object.assign({}, this.options.resource);
            overwriteDefault(options, '', 'appTheme', 'AppTheme');
            overwriteDefault(options, '', 'parentTheme', 'Theme.AppCompat.Light.DarkActionBar');
            const data = {
                '0': [{
                        'appTheme': options.appTheme,
                        'parentTheme': options.parentTheme,
                        '1': []
                    }]
            };
            overwriteDefault(options, 'output', 'path', 'res/values');
            overwriteDefault(options, 'output', 'file', `${WIDGET_NAME.BOTTOM_NAVIGATION}.xml`);
            this.application.resourceHandler.addTheme(EXTENSION_GENERIC_TMPL, data, options);
        }
    }

    const template$b = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '	<style name="{@appTheme}" parent="{@parentTheme}">',
        '		<item name="android:windowDrawsSystemBarBackgrounds">true</item>',
        '		<item name="android:statusBarColor">@android:color/transparent</item>',
        '		<item name="android:windowTranslucentStatus">true</item>',
        '!1',
        '		<item name="{name}">{value}</item>',
        '!1',
        '	</style>',
        '</resources>',
        '!0'
    ];
    var EXTENSION_DRAWER_TMPL = template$b.join('\n');

    class Drawer extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
            this.documentRoot = true;
            this.require(EXT_NAME.EXTERNAL, true);
            this.require(WIDGET_NAME.MENU);
            this.require(WIDGET_NAME.COORDINATOR);
        }
        init(element) {
            if (this.included(element) && element.children.length > 0) {
                Array.from(element.children).forEach((item) => {
                    if (item.tagName === 'NAV' && !includes(item.dataset.ext || '', EXT_NAME.EXTERNAL)) {
                        item.dataset.ext = (hasValue(item.dataset.ext) ? `${item.dataset.ext}, ` : '') + EXT_NAME.EXTERNAL;
                    }
                });
                this.application.elements.add(element);
                return true;
            }
            return false;
        }
        processNode() {
            const node = this.node;
            const options = Object.assign({}, this.options.drawer);
            if (locateExtension(node, WIDGET_NAME.MENU)) {
                overwriteDefault(options, 'android', 'fitsSystemWindows', 'true');
                this.createResourceTheme();
            }
            else {
                const optionsNavigation = Object.assign({}, this.options.navigation);
                overwriteDefault(optionsNavigation, 'android', 'layout_gravity', parseRTL('left'));
                const navView = node.children[node.children.length - 1];
                navView.android('layout_gravity', optionsNavigation.android.layout_gravity);
                navView.android('layout_height', 'match_parent');
                navView.auto = false;
            }
            const xml = this.application.controllerHandler.renderNodeStatic(VIEW_SUPPORT.DRAWER, node.depth, options, 'match_parent', 'match_parent', node, true);
            node.documentRoot = true;
            node.rendered = true;
            node.nodeType = NODE_STANDARD.BLOCK;
            node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
            return { xml, complete: true };
        }
        beforeInsert() {
            const application = this.application;
            const node = this.node;
            if (application.renderQueue[node.nodeId] != null) {
                const target = application.cacheSession.locate(item => item.parent === node.parent && item.controlName === VIEW_SUPPORT.COORDINATOR);
                if (target) {
                    application.renderQueue[target.nodeId] = application.renderQueue[node.nodeId];
                    delete application.renderQueue[node.nodeId];
                }
            }
            const menu = optional(locateExtension(node, WIDGET_NAME.MENU), 'dataset.viewName');
            const headerLayout = optional(locateExtension(node, EXT_NAME.EXTERNAL), 'dataset.viewName');
            const options = Object.assign({}, this.options.navigation);
            if (menu !== '') {
                overwriteDefault(options, 'app', 'menu', `@menu/${menu}`);
            }
            if (headerLayout !== '') {
                overwriteDefault(options, 'app', 'headerLayout', `@layout/${headerLayout}`);
            }
            if (menu !== '' || headerLayout !== '') {
                overwriteDefault(options, 'android', 'id', `${node.stringId}_navigation`);
                overwriteDefault(options, 'android', 'fitsSystemWindows', 'true');
                overwriteDefault(options, 'android', 'layout_gravity', parseRTL('left'));
                const xml = application.controllerHandler.renderNodeStatic(VIEW_SUPPORT.NAVIGATION_VIEW, node.depth + 1, options, 'wrap_content', 'match_parent');
                application.addRenderQueue(node.id.toString(), [xml]);
            }
        }
        afterInsert() {
            const headerLayout = locateExtension(this.node, EXT_NAME.EXTERNAL);
            if (headerLayout) {
                const node = getNodeFromElement(headerLayout);
                if (node && node.viewHeight === 0) {
                    node.android('layout_height', 'wrap_content');
                }
            }
        }
        createResourceTheme() {
            const options = Object.assign({}, this.options.resource);
            overwriteDefault(options, '', 'appTheme', 'AppTheme');
            overwriteDefault(options, '', 'parentTheme', 'Theme.AppCompat.Light.NoActionBar');
            const data = {
                '0': [{
                        'appTheme': options.appTheme,
                        'parentTheme': options.parentTheme,
                        '1': []
                    }]
            };
            overwriteDefault(options, 'output', 'path', 'res/values-v21');
            overwriteDefault(options, 'output', 'file', `${WIDGET_NAME.DRAWER}.xml`);
            this.application.resourceHandler.addTheme(EXTENSION_DRAWER_TMPL, data, options);
        }
    }

    let LOADING = false;
    const ROOT_CACHE = new Set();
    const IMAGE_CACHE = new Map();
    const EXTENSIONS = {
        [EXT_NAME.EXTERNAL]: new External(EXT_NAME.EXTERNAL),
        [EXT_NAME.CUSTOM]: new CustomAndroid(EXT_NAME.CUSTOM),
        [EXT_NAME.LIST]: new ListAndroid(EXT_NAME.LIST, ['UL', 'OL', 'DL', 'DIV']),
        [EXT_NAME.TABLE]: new TableAndroid(EXT_NAME.TABLE, ['TABLE']),
        [EXT_NAME.GRID]: new GridAndroid(EXT_NAME.GRID, ['FORM', 'UL', 'OL', 'DL', 'DIV', 'TABLE', 'NAV', 'SECTION', 'ASIDE', 'MAIN', 'HEADER', 'FOOTER', 'P', 'ARTICLE', 'FIELDSET', 'SPAN']),
        [WIDGET_NAME.FAB]: new FloatingActionButton(WIDGET_NAME.FAB, ['BUTTON', 'INPUT', 'IMG']),
        [WIDGET_NAME.MENU]: new Menu$1(WIDGET_NAME.MENU, ['NAV']),
        [WIDGET_NAME.COORDINATOR]: new Coordinator(WIDGET_NAME.COORDINATOR),
        [WIDGET_NAME.TOOLBAR]: new Toolbar(WIDGET_NAME.TOOLBAR),
        [WIDGET_NAME.BOTTOM_NAVIGATION]: new BottomNavigation(WIDGET_NAME.BOTTOM_NAVIGATION),
        [WIDGET_NAME.DRAWER]: new Drawer(WIDGET_NAME.DRAWER)
    };
    const Node$1 = View;
    const Controller$1 = new ViewController();
    const File$1 = new FileView();
    const Resource$1 = new ResourceView(File$1);
    const main = new Application(Node$1);
    main.registerController(Controller$1);
    main.registerResource(Resource$1);
    (() => {
        const extension = new Set();
        for (let name of SETTINGS.builtInExtensions) {
            name = name.toLowerCase().trim();
            for (const ext in EXTENSIONS) {
                if (ext === name || ext.startsWith(`${name}.`)) {
                    extension.add(EXTENSIONS[ext]);
                }
            }
        }
        for (const ext of extension) {
            main.registerExtension(ext);
        }
    })();
    function setStyleMap() {
        let warning = false;
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = document.styleSheets[i];
            if (styleSheet.cssRules) {
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    try {
                        const cssRule = styleSheet.cssRules[j];
                        const attrs = new Set();
                        for (const attr of Array.from(cssRule.style)) {
                            attrs.add(convertCamelCase(attr));
                        }
                        const elements = document.querySelectorAll(cssRule.selectorText);
                        Array.from(elements).forEach((element) => {
                            for (const attr of Array.from(element.style)) {
                                attrs.add(convertCamelCase(attr));
                            }
                            const style = getStyle(element);
                            const styleMap = {};
                            for (const attr of attrs) {
                                if (attr.toLowerCase().indexOf('color') !== -1) {
                                    const color = getByColorName(cssRule.style[attr]);
                                    if (color !== '') {
                                        cssRule.style[attr] = convertRGB(color);
                                    }
                                }
                                const cssStyle = cssRule.style[attr];
                                if (element.style[attr]) {
                                    styleMap[attr] = element.style[attr];
                                }
                                else if (style[attr] === cssStyle) {
                                    styleMap[attr] = style[attr];
                                }
                                else if (cssStyle) {
                                    switch (attr) {
                                        case 'fontSize':
                                            styleMap[attr] = style[attr];
                                            break;
                                        case 'width':
                                        case 'height':
                                        case 'lineHeight':
                                        case 'verticalAlign':
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
                                            styleMap[attr] = (/^[A-Za-z\-]+$/.test(cssStyle) || isPercent(cssStyle) ? cssStyle : convertPX(cssStyle, style.fontSize));
                                            break;
                                        default:
                                            if (styleMap[attr] == null) {
                                                styleMap[attr] = cssStyle;
                                            }
                                            break;
                                    }
                                }
                            }
                            if (SETTINGS.preloadImages && styleMap['backgroundImage'] != null && styleMap['backgroundImage'] !== 'initial') {
                                styleMap['backgroundImage'].split(',').map(value => value.trim()).forEach(value => {
                                    const url = parseBackgroundUrl(value);
                                    if (url !== '' && !IMAGE_CACHE.has(url)) {
                                        IMAGE_CACHE.set(url, { width: 0, height: 0, url });
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
                            alert('External CSS files cannot be parsed when loading this program from your hard drive with Chrome 64+ (file://). Either use a local web ' +
                                'server (http://), embed your CSS files into a <style> tag, or use a different browser. See the README for further instructions.\n\n' +
                                `${styleSheet.href}\n\n${error}`);
                            warning = true;
                        }
                    }
                }
            }
        }
    }
    function setImageCache(element) {
        if (element && hasValue(element.src)) {
            IMAGE_CACHE.set(element.src, {
                width: element.naturalWidth,
                height: element.naturalHeight,
                url: element.src
            });
        }
    }
    function parseDocument(...elements) {
        if (main.closed) {
            return;
        }
        LOADING = false;
        setStyleMap();
        main.elements.clear();
        if (main.appName === '' && elements.length === 0) {
            elements.push(document.body);
        }
        let rootElement = null;
        for (let element of elements) {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            if (element instanceof HTMLElement) {
                if (rootElement == null) {
                    rootElement = element;
                }
                main.elements.add(element);
            }
        }
        let __THEN;
        function parseResume() {
            LOADING = false;
            if (SETTINGS.preloadImages && rootElement != null) {
                Array.from(rootElement.getElementsByClassName('androme.preload')).forEach(element => rootElement && rootElement.removeChild(element));
            }
            main.resourceHandler.imageDimensions = IMAGE_CACHE;
            for (const element of main.elements) {
                if (main.appName === '') {
                    if (element.id === '') {
                        element.id = 'untitled';
                    }
                    main.appName = element.id;
                }
                else {
                    if (element.id === '') {
                        element.id = `content_${main.size}`;
                    }
                }
                const filename = optional(element, 'dataset.filename').trim().replace(/\.xml$/, '') || element.id;
                element.dataset.views = (optional(element, 'dataset.views', 'number') + 1).toString();
                element.dataset.viewName = convertWord(element.dataset.views !== '1' ? `${filename}_${element.dataset.views}` : filename);
                if (main.createNodeCache(element)) {
                    main.createLayoutXml();
                    main.setConstraints();
                    main.setResources();
                    ROOT_CACHE.add(element);
                }
            }
            if (typeof __THEN === 'function') {
                __THEN.call(main);
            }
        }
        if (SETTINGS.preloadImages && rootElement != null) {
            for (const image of IMAGE_CACHE.values()) {
                if (image.url && image.width === 0 && image.height === 0) {
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
        const images = Array.from(main.elements).map(element => {
            const queue = [];
            Array.from(element.querySelectorAll('IMG')).forEach((image) => {
                if (image.complete) {
                    setImageCache(image);
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
            LOADING = true;
            const queue = images.map(image => {
                return new Promise((resolve, reject) => {
                    image.onload = resolve;
                    image.onerror = reject;
                });
            });
            Promise
                .all(queue)
                .then(result => {
                try {
                    result.forEach((evt) => setImageCache(evt.srcElement));
                }
                catch (e) {
                }
                parseResume();
            })
                .catch((err) => {
                const message = (err.srcElement != null ? err.srcElement.src : '');
                if (!hasValue(message) || confirm(`FAIL: ${message}`)) {
                    parseResume();
                }
            });
        }
        return {
            then: (resolve) => {
                if (LOADING) {
                    __THEN = resolve;
                }
                else {
                    resolve();
                }
            }
        };
    }
    function registerExtension(ext) {
        if (ext instanceof Extension && ext.name !== '' && Array.isArray(ext.tagNames)) {
            main.registerExtension(ext);
        }
    }
    function configureExtension(name, options) {
        if (options != null) {
            const ext = main.getExtension(name);
            if (ext != null) {
                Object.assign(ext.options, options);
            }
        }
    }
    function getExtension(name) {
        return main.getExtension(name);
    }
    function ext(name, options) {
        if (typeof name === 'object') {
            registerExtension(name);
        }
        else if (options != null) {
            configureExtension(name, options);
        }
        else if (name !== '') {
            return getExtension(name);
        }
    }
    function ready() {
        return (!LOADING && !main.closed);
    }
    function close() {
        if (!LOADING && main.size > 0) {
            main.finalize();
        }
    }
    function reset() {
        for (const element of ROOT_CACHE) {
            delete element.dataset.views;
            delete element.dataset.viewName;
        }
        ROOT_CACHE.clear();
        main.reset();
    }
    function saveAllToDisk() {
        if (!LOADING && main.size > 0) {
            if (!main.closed) {
                main.finalize();
            }
            main.resourceHandler.file.saveAllToDisk(main.viewData);
        }
    }
    function writeLayoutAllXml(saveToDisk = false) {
        if (main.closed || autoClose()) {
            return main.resourceHandler.file.layoutAllToXml(main.viewData, saveToDisk);
        }
        return '';
    }
    function writeResourceAllXml(saveToDisk = false) {
        if (main.closed || autoClose()) {
            return main.resourceHandler.file.resourceAllToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceStringXml(saveToDisk = false) {
        if (main.closed || autoClose()) {
            return main.resourceHandler.file.resourceStringToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceArrayXml(saveToDisk = false) {
        if (main.closed || autoClose()) {
            return main.resourceHandler.file.resourceStringArrayToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceFontXml(saveToDisk = false) {
        if (main.closed || autoClose()) {
            return main.resourceHandler.file.resourceFontToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceColorXml(saveToDisk = false) {
        if (main.closed || autoClose()) {
            return main.resourceHandler.file.resourceColorToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceStyleXml(saveToDisk = false) {
        if (main.closed || autoClose()) {
            return main.resourceHandler.file.resourceStyleToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceDimenXml(saveToDisk = false) {
        if (main.closed || autoClose()) {
            return main.resourceHandler.file.resourceDimenToXml(saveToDisk);
        }
        return '';
    }
    function writeResourceDrawableXml(saveToDisk = false) {
        if (main.closed || autoClose()) {
            return main.resourceHandler.file.resourceDrawableToXml(saveToDisk);
        }
        return '';
    }
    function customize(build, widget, options) {
        if (API_ANDROID[build] != null) {
            const customizations = API_ANDROID[build].customizations;
            if (customizations[widget] == null) {
                customizations[widget] = {};
            }
            Object.assign(customizations[widget], options);
        }
    }
    function addXmlNs(name, uri) {
        main.addXmlNs(name, uri);
    }
    function toString() {
        return main.toString();
    }
    function autoClose() {
        if (SETTINGS.autoCloseOnWrite && !LOADING && !main.closed) {
            main.finalize();
            return true;
        }
        return false;
    }

    exports.parseDocument = parseDocument;
    exports.registerExtension = registerExtension;
    exports.configureExtension = configureExtension;
    exports.getExtension = getExtension;
    exports.ext = ext;
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
    exports.writeResourceDimenXml = writeResourceDimenXml;
    exports.writeResourceDrawableXml = writeResourceDrawableXml;
    exports.customize = customize;
    exports.addXmlNs = addXmlNs;
    exports.toString = toString;
    exports.settings = SETTINGS;
    exports.Extension = Extension;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
