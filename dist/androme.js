/* androme 1.8.7
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
    function convertCamelCase(value, character = '-') {
        value = value.replace(new RegExp(`^${character}+`), '');
        const result = value.match(new RegExp(`(${character}{1}[a-z]{1})`, 'g'));
        if (result != null) {
            for (const match of result) {
                value = value.replace(match, match[1].toUpperCase());
            }
        }
        return value;
    }
    function capitalize(value, upper = true) {
        return value.charAt(0)[(upper ? 'toUpperCase' : 'toLowerCase')]() + value.substring(1)[(upper ? 'toLowerCase' : 'toString')]();
    }
    function averageInt(values) {
        return Math.floor(values.reduce((a, b) => a + b) / values.length);
    }
    function convertInt(value) {
        return parseInt(value) || 0;
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
                value /= (dpi / 160);
                value = (value >= 1 || value === 0 ? Math.floor(value) : value.toFixed(2));
                return value + (font ? 'sp' : 'dp');
            }
        }
        return '0dp';
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
    function convertEnum(base, derived, value) {
        for (const key of Object.keys(base)) {
            const index = base[key];
            if (value === index) {
                return derived[key];
            }
        }
        return '';
    }
    function includesEnum(value, type) {
        return ((value & type) === type);
    }
    function formatPX(value) {
        value = parseFloat(value);
        return `${(!isNaN(value) ? Math.ceil(value) : 0)}px`;
    }
    function convertWord(value) {
        return (value != null ? value.replace(/[^\w]/g, '_').trim() : '');
    }
    function isNumber(value) {
        return /^[0-9]+\.?[0-9]*$/.test(value.toString().trim());
    }
    function isPercent(value) {
        return /^[0-9]+%$/.test(value);
    }
    function includes(source, value, delimiter = ',') {
        return source.split(delimiter).map(segment => segment.trim()).includes(value);
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
    function trim(value, character) {
        return value.replace(new RegExp(`^${character}+`, 'g'), '').replace(new RegExp(`${character}+$`, 'g'), '');
    }
    function repeat(n, value = '\t') {
        return value.repeat(n);
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
    function lastIndexOf(value, character = '/') {
        return value.substring(value.lastIndexOf(character) + 1);
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
        return (lower === upper || Math.floor(lower) === Math.floor(upper) || Math.ceil(lower) === Math.floor(upper) || Math.floor(lower) === Math.ceil(upper));
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
                if (list.some(item => item !== node && node.intersect(item[dimension]))) {
                    return true;
                }
            });
            return false;
        }
        static linearX(list) {
            const nodes = list.filter(node => !node.isolated);
            if (nodes.length > 0 && !NodeList.intersect(nodes)) {
                if (nodes.length > 1) {
                    const minBottom = Math.min.apply(null, nodes.map(node => node.linear.bottom));
                    return !nodes.some(node => node.linear.top >= minBottom);
                }
                return true;
            }
            return false;
        }
        static linearY(list) {
            const nodes = list.filter(node => !node.isolated);
            if (nodes.length > 0 && !NodeList.intersect(nodes)) {
                if (nodes.length > 1) {
                    const minRight = Math.min.apply(null, nodes.map(node => node.linear.right));
                    return !nodes.some(node => node.linear.left >= minRight);
                }
                return true;
            }
            return false;
        }
        find(id) {
            return this._list.find(node => node.id === id) || null;
        }
        findByNodeId(id) {
            return this._list.find(node => node.nodeId === id) || null;
        }
        reset() {
            NodeList.currentId = 0;
            this.clear();
        }
        clear() {
            this._list = [];
        }
        sortAsc(...attr) {
            sortAsc(this._list, ...attr);
            return this;
        }
        sortDesc(...attr) {
            sortDesc(this._list, ...attr);
            return this;
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
            return this._list.filter(node => node.visible || node.companion);
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
    const NODE_ANDROID = {
        FRAME: 'FrameLayout',
        LINEAR: 'LinearLayout',
        CONSTRAINT: 'android.support.constraint.ConstraintLayout',
        RELATIVE: 'RelativeLayout',
        GRID: 'GridLayout',
        SCROLL_VERTICAL: 'ScrollView',
        SCROLL_HORIZONTAL: 'HorizontalScrollView',
        SCROLL_NESTED: 'android.support.v4.widget.NestedScrollView',
        RADIO_GROUP: 'RadioGroup',
        TEXT: 'TextView',
        EDIT: 'EditText',
        IMAGE: 'ImageView',
        SELECT: 'Spinner',
        RANGE: 'SeekBar',
        CHECKBOX: 'CheckBox',
        RADIO: 'RadioButton',
        BUTTON: 'Button',
        LINE: 'View',
        SPACE: 'Space',
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
    const FIXED_ANDROID = [
        NODE_ANDROID.EDIT,
        NODE_ANDROID.SELECT,
        NODE_ANDROID.CHECKBOX,
        NODE_ANDROID.RADIO,
        NODE_ANDROID.BUTTON,
        NODE_ANDROID.IMAGE
    ];
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
        'PLAINTEXT'
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
        useConstraintLayout: true,
        useConstraintGuideline: true,
        useConstraintChain: true,
        useUnitDP: true,
        useFontAlias: true,
        supportRTL: true,
        dimensResourceValue: true,
        numberResourceValue: false,
        alwaysReevaluateResources: true,
        excludeTextColor: ['#000000'],
        excludeBackgroundColor: ['#FFFFFF'],
        collapseUnattributedElements: false,
        horizontalPerspective: true,
        whitespaceHorizontalOffset: 4,
        whitespaceVerticalOffset: 14,
        chainPackedHorizontalOffset: 4,
        chainPackedVerticalOffset: 14,
        showAttributes: true,
        autoCloseOnWrite: true,
        insertSpaces: 4,
        outputDirectory: 'app/src/main',
        outputActivityMainFileName: 'activity_main.xml',
        outputArchiveFileType: 'zip',
        outputMaxProcessingTime: 30
    };

    function removePlaceholders(value, extension = true) {
        value = value.replace(/{[<:@&>]{1}[0-9]+}/g, '');
        if (extension) {
            value = value.replace(/{[0-9]+:.*?}/g, '');
        }
        return value.trim();
    }
    function placeIndent(value, depth) {
        return value.split('\n').map(line => {
            const match = /^({.*?})(.*)/g.exec(line);
            const indent = repeat(depth);
            if (match != null) {
                return (match[2] !== '' ? match[1] + indent + match[2] : '');
            }
            else {
                return indent + line;
            }
        }).join('\n');
    }
    function stripId(value) {
        return value.replace(/@\+?id\//, '');
    }
    function replaceDP(xml, font = false) {
        return (SETTINGS.useUnitDP ? xml.replace(/("|>)(-)?([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + (capture[1] || '') + convertDP(capture[2], SETTINGS.density, font) + capture[3]) : xml);
    }
    function replaceTab(xml, preserve = false) {
        if (SETTINGS.insertSpaces > 0) {
            if (preserve) {
                xml = xml.split('\n').map(value => {
                    const match = value.match(/^(\t+)(.*)$/);
                    if (match != null) {
                        return ' '.repeat(SETTINGS.insertSpaces * match[1].length) + match[2];
                    }
                    return value;
                }).join('\n');
            }
            else {
                xml = xml.replace(/\t/g, ' '.repeat(SETTINGS.insertSpaces));
            }
        }
        return xml;
    }
    function formatDimen(tagName, attr, size) {
        return (SETTINGS.dimensResourceValue ? `{%${tagName.toLowerCase()}-${attr}-${size}}` : size);
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
            if (hasValue(value)) {
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

    var NODE_STANDARD;
    (function (NODE_STANDARD) {
        NODE_STANDARD[NODE_STANDARD["NONE"] = 0] = "NONE";
        NODE_STANDARD[NODE_STANDARD["TEXT"] = 1] = "TEXT";
        NODE_STANDARD[NODE_STANDARD["EDIT"] = 2] = "EDIT";
        NODE_STANDARD[NODE_STANDARD["IMAGE"] = 3] = "IMAGE";
        NODE_STANDARD[NODE_STANDARD["SELECT"] = 4] = "SELECT";
        NODE_STANDARD[NODE_STANDARD["RANGE"] = 5] = "RANGE";
        NODE_STANDARD[NODE_STANDARD["CHECKBOX"] = 6] = "CHECKBOX";
        NODE_STANDARD[NODE_STANDARD["RADIO"] = 7] = "RADIO";
        NODE_STANDARD[NODE_STANDARD["BUTTON"] = 8] = "BUTTON";
        NODE_STANDARD[NODE_STANDARD["LINE"] = 9] = "LINE";
        NODE_STANDARD[NODE_STANDARD["SPACE"] = 10] = "SPACE";
        NODE_STANDARD[NODE_STANDARD["FRAME"] = 11] = "FRAME";
        NODE_STANDARD[NODE_STANDARD["LINEAR"] = 12] = "LINEAR";
        NODE_STANDARD[NODE_STANDARD["CONSTRAINT"] = 13] = "CONSTRAINT";
        NODE_STANDARD[NODE_STANDARD["RELATIVE"] = 14] = "RELATIVE";
        NODE_STANDARD[NODE_STANDARD["GRID"] = 15] = "GRID";
        NODE_STANDARD[NODE_STANDARD["SCROLL_VERTICAL"] = 16] = "SCROLL_VERTICAL";
        NODE_STANDARD[NODE_STANDARD["SCROLL_HORIZONTAL"] = 17] = "SCROLL_HORIZONTAL";
        NODE_STANDARD[NODE_STANDARD["SCROLL_NESTED"] = 18] = "SCROLL_NESTED";
        NODE_STANDARD[NODE_STANDARD["RADIO_GROUP"] = 19] = "RADIO_GROUP";
    })(NODE_STANDARD || (NODE_STANDARD = {}));
    var NODE_RESOURCE;
    (function (NODE_RESOURCE) {
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
        NODE_PROCEDURE[NODE_PROCEDURE["LAYOUT"] = 2] = "LAYOUT";
        NODE_PROCEDURE[NODE_PROCEDURE["ALIGNMENT"] = 4] = "ALIGNMENT";
        NODE_PROCEDURE[NODE_PROCEDURE["CUSTOMIZATION"] = 16] = "CUSTOMIZATION";
        NODE_PROCEDURE[NODE_PROCEDURE["ACCESSIBILITY"] = 32] = "ACCESSIBILITY";
        NODE_PROCEDURE[NODE_PROCEDURE["ALL"] = 54] = "ALL";
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
    const MAP_ELEMENT = {
        'INPUT': NODE_STANDARD.NONE,
        'PLAINTEXT': NODE_STANDARD.TEXT,
        'HR': NODE_STANDARD.LINE,
        'IMG': NODE_STANDARD.IMAGE,
        'SELECT': NODE_STANDARD.SELECT,
        'RANGE': NODE_STANDARD.RANGE,
        'TEXT': NODE_STANDARD.EDIT,
        'PASSWORD': NODE_STANDARD.EDIT,
        'NUMBER': NODE_STANDARD.EDIT,
        'EMAIL': NODE_STANDARD.EDIT,
        'SEARCH': NODE_STANDARD.EDIT,
        'URL': NODE_STANDARD.EDIT,
        'CHECKBOX': NODE_STANDARD.CHECKBOX,
        'RADIO': NODE_STANDARD.RADIO,
        'BUTTON': NODE_STANDARD.BUTTON,
        'SUBMIT': NODE_STANDARD.BUTTON,
        'RESET': NODE_STANDARD.BUTTON,
        'TEXTAREA': NODE_STANDARD.EDIT
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
        'TABLE',
        'TFOOT',
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

    function getRangeBounds(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const domRect = range.getClientRects();
        const bounds = assignBounds(domRect[domRect.length - 1]);
        if (domRect.length > 1) {
            bounds.left = Math.min.apply(null, Array.from(domRect).map((item) => item.left));
            bounds.width = Array.from(domRect).reduce((a, b) => a + b.width, 0);
        }
        return bounds;
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
        const object = element;
        if (cache) {
            if (object.__style != null) {
                return object.__style;
            }
            else if (object.__node != null && object.__node.style != null) {
                return object.__node.style;
            }
        }
        if (element.nodeName !== '#text') {
            const style = getComputedStyle(element);
            object.__style = style;
            return style;
        }
        return {};
    }
    function sameAsParent(element, attr) {
        if (element.parentElement != null) {
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
        return (element && element.childNodes && Array.from(element.childNodes).some((item) => item.nodeName === '#text' && optional(item, 'textContent').trim() !== ''));
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
            if (bounds.width !== 0 && bounds.height !== 0 || (getStyle(element).display !== 'none' && BLOCK_ELEMENT.includes(element.tagName))) {
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
                if (valid && element.children.length > 0) {
                    return Array.from(element.children).some((item) => {
                        const style = getStyle(item);
                        const float = style.float;
                        return ((style.position !== 'static' && style.position !== 'initial') || float === 'left' || float === 'right');
                    });
                }
            }
        }
        return false;
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
    function parseRGBA(value, opacity = '1') {
        if (value != null) {
            const color = getByColorName(value);
            if (color !== '') {
                return [color.hex, convertRGB(color), '1'];
            }
            const match = value.match(/rgb(?:a)?\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})(?:, ([0-9]{1,3}))?\)/);
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
        return { r: -1, g: -1, b: -1 };
    }
    function parseHex(value) {
        if (value != null) {
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

    class Application {
        constructor(TypeT, TypeU) {
            this.TypeT = TypeT;
            this.TypeU = TypeU;
            this.elements = new Set();
            this.insert = {};
            this.views = [];
            this.includes = [];
            this.currentIndex = -1;
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
                if (Array.isArray(extension.tagNames)) {
                    found.tagNames = extension.tagNames;
                }
                Object.assign(found.options, extension.options);
            }
            else {
                if (extension.dependencies.every(item => this.findExtension(item.name) != null)) {
                    extension.application = this;
                    this._extensions.push(extension);
                }
            }
        }
        finalize() {
            this.cacheInternal.visible.forEach(node => {
                if (!node.companion) {
                    if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.LAYOUT)) {
                        node.setLayout();
                    }
                    if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.ALIGNMENT)) {
                        node.setAlignment();
                    }
                }
            });
            this.controllerHandler.adjustBoxSpacing(this.viewData);
            this.controllerHandler.setDimensions(this.viewData);
            this.insertAuxillaryViews();
            this.resourceHandler.finalize(this.viewData);
            if (SETTINGS.showAttributes) {
                this.setAttributes();
            }
            this.layouts.forEach(layout => {
                layout.content = removePlaceholders(layout.content).replace(/\n\n/g, '\n');
                if (SETTINGS.dimensResourceValue) {
                    layout.content = this.controllerHandler.parseDimensions(layout.content);
                }
                layout.content = replaceDP(layout.content);
                layout.content = replaceTab(layout.content);
            });
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
            this.views = [];
            this.includes = [];
            this.insert = {};
            this.currentIndex = -1;
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
        setResources() {
            this.resourceHandler.setFontStyle();
            this.resourceHandler.setBoxSpacing();
            this.resourceHandler.setBoxStyle();
            this.resourceHandler.setValueString(this.controllerHandler.inlineExclude);
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
                            attributes.add(convertCamelCase(attr));
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
                                attributes.add(convertCamelCase(attr));
                            }
                            const style = getStyle(element);
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
        createNodeCache(root) {
            let nodeTotal = 0;
            if (root === document.body) {
                Array.from(document.body.childNodes).forEach((item) => {
                    if (item.nodeName === '#text') {
                        if (optional(item, 'textContent').trim() !== '') {
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
            const elements = (root !== document.body ? root.querySelectorAll('*') : document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *')));
            this.cache.parent = undefined;
            this.cache.clear();
            const extensions = this.extensions;
            extensions.forEach(item => {
                item.setTarget({}, null, root);
                item.beforeInit();
            });
            const rootNode = this.insertNode(root);
            if (rootNode != null) {
                rootNode.parent = new this.TypeT(0, SETTINGS.targetAPI, root.parentElement || document.body);
                rootNode.documentRoot = true;
                this.cache.parent = rootNode;
            }
            else {
                return false;
            }
            for (const element of Array.from(elements)) {
                if (!this.elements.has(element)) {
                    this.orderExt(extensions, element).some(item => item.init(element));
                    if (!this.elements.has(element)) {
                        const inlineExclude = this.controllerHandler.inlineExclude;
                        if (element.parentElement != null && inlineExclude.includes(element.tagName) && (MAP_ELEMENT[element.parentElement.tagName] != null || inlineExclude.includes(element.parentElement.tagName))) {
                            continue;
                        }
                        let valid = true;
                        let current = element.parentElement;
                        while (current != null) {
                            if (current === root) {
                                break;
                            }
                            else if (current !== root && this.elements.has(current)) {
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
            if (this.cache.length > 0) {
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
                            let elementParent = false;
                            if (child.element.parentElement === parent.element) {
                                child.parent = parent;
                                parent.children.push(child);
                                elementParent = true;
                            }
                            if ((child.css('position') === 'fixed' || (elementParent && child.css('position') === 'absolute' && parent.css('position') !== 'relative')) && child.box.left >= parent.linear.left && child.box.right <= parent.linear.right && child.box.top >= parent.linear.top && child.box.bottom <= parent.linear.bottom) {
                                if (parents[child.id] == null) {
                                    parents[child.id] = [];
                                }
                                parents[child.id].push(parent);
                            }
                        }
                    });
                });
                this.cache.list.forEach(node => {
                    const nodes = new Set(parents[node.id]);
                    if (nodes.size > 0) {
                        nodes.add(node.parent);
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
                        if (closest != null && node.parent !== closest) {
                            node.parent.children = node.parent.children.filter(child => child !== node);
                            node.parent = closest;
                        }
                    }
                    const inlineExclude = this.controllerHandler.inlineExclude;
                    if (node.element.children.length > 0 && (inlineExclude.length === 0 || node.children.some(current => !inlineExclude.includes(current.tagName)))) {
                        Array.from(node.element.childNodes).forEach((element) => {
                            if (element.nodeName === '#text' && optional(element, 'textContent').trim() !== '') {
                                this.insertNode(element, node);
                            }
                        });
                    }
                });
                this.cache.list.forEach(node => {
                    const style = preAlignment[node.id];
                    if (style != null) {
                        for (const attr in style) {
                            node.element.style[attr] = style[attr];
                        }
                    }
                });
                extensions.forEach(item => {
                    item.setTarget(rootNode);
                    item.afterInit();
                });
                this.cache.sortAsc('depth', 'parent.id', 'parentIndex', 'id');
                this.cache.list.forEach(node => {
                    if (node.hasElement) {
                        let i = 0;
                        Array.from(node.element.childNodes).forEach((element) => {
                            const child = element.__node;
                            if (child && child.parent.element === node.element) {
                                child.parentIndex = i++;
                            }
                        });
                        sortAsc(node.children, 'parentIndex');
                    }
                });
                this.addLayout(root.dataset.viewName);
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
                const x = Math.floor(node.linear.left);
                const y = node.parent.id;
                if (mapX[node.depth] == null) {
                    mapX[node.depth] = {};
                }
                if (mapY[node.depth] == null) {
                    mapY[node.depth] = {};
                }
                if (mapX[node.depth][x] == null) {
                    mapX[node.depth][x] = [];
                }
                if (mapY[node.depth][y] == null) {
                    mapY[node.depth][y] = [];
                }
                mapX[node.depth][x].push(node);
                mapY[node.depth][y].push(node);
            });
            for (let i = 0; i < mapY.length; i++) {
                const coordsY = Object.keys(mapY[i]);
                const partial = new Map();
                const application = this;
                function renderXml(node, parent, xml) {
                    if (xml !== '') {
                        if (node.dataset.target != null) {
                            const target = application.findByDomId(node.dataset.target, true);
                            if (target == null || target !== parent) {
                                application.addInsertQueue(node.dataset.target, [xml]);
                                return;
                            }
                        }
                        else if (parent.dataset.target != null) {
                            node.dataset.target = parent.nodeId;
                            application.addInsertQueue(parent.nodeId, [xml]);
                            return;
                        }
                        if (!partial.has(parent.id)) {
                            partial.set(parent.id, []);
                        }
                        partial.get(parent.id).push(xml);
                    }
                }
                for (let j = 0; j < coordsY.length; j++) {
                    const axisY = [];
                    const layers = [];
                    for (const node of mapY[i][coordsY[j]]) {
                        if (node.pageflow) {
                            axisY.push(node);
                        }
                        else {
                            layers.push(node);
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
                        if (!nodeY.documentRoot && this.elements.has(nodeY.element)) {
                            continue;
                        }
                        let parent = nodeY.parent;
                        if (!nodeY.renderParent) {
                            if (!includesEnum(nodeY.excludeProcedure, NODE_PROCEDURE.CUSTOMIZATION)) {
                                nodeY.applyCustomizations();
                            }
                            const renderExtension = parent.renderExtension;
                            if (renderExtension != null) {
                                renderExtension.setTarget(nodeY, parent);
                                const result = renderExtension.processChild();
                                renderXml(nodeY, parent, result.xml);
                                if (result.parent) {
                                    parent = result.parent;
                                }
                                if (result.proceed) {
                                    continue;
                                }
                            }
                            const rendered = [];
                            let proceed = false;
                            this.orderExt(extensions, nodeY.element).some(item => {
                                if (item.is(nodeY)) {
                                    item.setTarget(nodeY, parent);
                                    if (item.condition()) {
                                        const result = item.processNode(mapX, mapY);
                                        if (result.xml !== '') {
                                            renderXml(nodeY, parent, result.xml);
                                        }
                                        if (result.parent) {
                                            parent = result.parent;
                                        }
                                        if (result.xml !== '' || result.proceed) {
                                            rendered.push(item);
                                        }
                                        if (result.proceed) {
                                            proceed = true;
                                            return true;
                                        }
                                    }
                                }
                                return false;
                            });
                            if (nodeY.renderExtension == null && rendered.length > 0) {
                                nodeY.renderExtension = rendered[0];
                            }
                            if (proceed) {
                                continue;
                            }
                            if (!nodeY.renderParent) {
                                let xml = '';
                                if (nodeY.nodeName === '') {
                                    const inlineExclude = this.controllerHandler.inlineExclude;
                                    if (nodeY.children.length === 0 || (!nodeY.documentRoot && inlineExclude.length > 0 && nodeY.cascade().every(node => inlineExclude.includes(node.element.tagName)))) {
                                        if (hasFreeFormText(nodeY.element) || (!SETTINGS.collapseUnattributedElements && !BLOCK_ELEMENT.includes(nodeY.element.tagName))) {
                                            xml += this.writeNode(nodeY, parent, NODE_STANDARD.TEXT);
                                        }
                                        else {
                                            if (SETTINGS.collapseUnattributedElements && nodeY.viewWidth === 0 && nodeY.viewHeight === 0) {
                                                continue;
                                            }
                                            else if (!nodeY.documentRoot) {
                                                xml += this.writeFrameLayout(nodeY, parent);
                                            }
                                        }
                                    }
                                    else {
                                        if (nodeY.flex.enabled || nodeY.children.some(node => !node.pageflow)) {
                                            xml += this.writeDefaultLayout(nodeY, parent);
                                        }
                                        else {
                                            if (nodeY.children.length === 1) {
                                                if (SETTINGS.collapseUnattributedElements && nodeY.viewWidth === 0 && nodeY.viewHeight === 0 && nodeY.marginTop === 0 && nodeY.marginRight === 0 && nodeY.marginBottom === 0 && nodeY.marginLeft === 0 && nodeY.paddingTop === 0 && nodeY.paddingRight === 0 && nodeY.paddingBottom === 0 && nodeY.paddingLeft === 0 && parseRGBA(nodeY.css('background')).length === 0 && Object.keys(nodeY.styleMap).length === 0 && !this.controllerHandler.hasAppendProcessing(nodeY.id)) {
                                                    const child = nodeY.children[0];
                                                    child.documentRoot = nodeY.documentRoot;
                                                    child.parent = parent;
                                                    nodeY.cascade().forEach(item => item.renderDepth--);
                                                    nodeY.hide();
                                                    axisY[k] = child;
                                                    k--;
                                                }
                                                else {
                                                    xml += this.writeFrameLayout(nodeY, parent);
                                                }
                                            }
                                            else {
                                                const [linearX, linearY] = [NodeList.linearX(nodeY.children), NodeList.linearY(nodeY.children)];
                                                if (this.isLinearXY(linearX, linearY, nodeY, nodeY.children)) {
                                                    xml += this.writeLinearLayout(nodeY, parent, linearY);
                                                }
                                                else {
                                                    xml += this.writeDefaultLayout(nodeY, parent);
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    xml += this.writeNode(nodeY, parent, nodeY.nodeName);
                                }
                                renderXml(nodeY, parent, xml);
                            }
                        }
                    }
                }
                for (const [id, views] of partial.entries()) {
                    const placeholder = `{:${id}}`;
                    if (output.indexOf(placeholder) !== -1) {
                        output = output.replace(placeholder, views.join('') + placeholder);
                        empty = false;
                    }
                    else {
                        this.addInsertQueue(id, views);
                    }
                }
            }
            const root = this.cache.parent;
            const extension = root.renderExtension;
            if (extension == null || !hasValue(root.dataset.target)) {
                const pathname = trim(optional(root, 'dataset.folder').trim(), '/');
                this.updateLayout(pathname, (!empty ? output : ''), (extension != null && extension.documentRoot));
            }
            else {
                this.views.pop();
            }
            if (!empty) {
                extensions.forEach(item => {
                    item.setTarget(root);
                    item.afterRender();
                });
            }
            else if (extension == null) {
                root.visible = false;
            }
            this.cacheInternal.list.push(...this.cache.list);
        }
        writeFrameLayout(node, parent) {
            if (node.children.length === 0) {
                return this.controllerHandler.renderNode(node, parent, NODE_STANDARD.FRAME);
            }
            else {
                return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.FRAME);
            }
        }
        writeLinearLayout(node, parent, vertical) {
            return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.LINEAR, { vertical });
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
        writeDefaultLayout(node, parent) {
            if (SETTINGS.useConstraintLayout || node.flex.enabled) {
                return this.writeConstraintLayout(node, parent);
            }
            else {
                return this.writeRelativeLayout(node, parent);
            }
        }
        addInsertQueue(id, views) {
            if (this.insert[id] == null) {
                this.insert[id] = [];
            }
            this.insert[id].push(...views);
        }
        insertAuxillaryViews() {
            this.cacheInternal.list.forEach(node => {
                const extension = node.renderExtension;
                if (extension != null) {
                    extension.setTarget(node);
                    extension.beforeInsert();
                }
            });
            const template = {};
            for (const id in this.insert) {
                let replaceId = id;
                if (!isNumber(id)) {
                    const target = this.findByDomId(id);
                    if (target != null) {
                        replaceId = target.id.toString();
                    }
                }
                let output = this.insert[id].join('\n');
                if (replaceId !== id) {
                    const target = this.cacheInternal.find(parseInt(replaceId));
                    if (target != null) {
                        const depth = target.renderDepth + 1;
                        output = placeIndent(output, depth);
                        const pattern = /{@([0-9]+)}/g;
                        let match = null;
                        let i = 0;
                        while ((match = pattern.exec(output)) != null) {
                            const node = this.cacheInternal.find(parseInt(match[1]));
                            if (node != null) {
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
                        template[inner] = template[inner].replace(`{:${outer}}`, template[inner]);
                        template[outer] = template[outer].replace(`{:${inner}}`, template[inner]);
                    }
                }
            }
            this.layouts.forEach(view => {
                for (const id in template) {
                    view.content = view.content.replace(`{:${id}}`, template[id]);
                }
                view.content = this.controllerHandler.insertAuxillaryViews(view.content);
            });
            this.cacheInternal.list.forEach(node => {
                const extension = node.renderExtension;
                if (extension != null) {
                    extension.setTarget(node);
                    extension.afterInsert();
                }
            });
        }
        setAttributes() {
            this.controllerHandler.setAttributes(this.viewData);
            this.cacheInternal.list.forEach(node => {
                const extension = node.renderExtension;
                if (extension != null) {
                    extension.setTarget(node);
                    extension.finalize();
                }
            });
        }
        addLayout(value) {
            const layout = {
                filename: value,
                pathname: '',
                content: ''
            };
            this.currentIndex = this.views.length;
            this.views.push(layout);
        }
        updateLayout(pathname = '', content, documentRoot = false) {
            pathname = pathname || 'res/layout';
            if (documentRoot && this.views.length > 0 && this.views[0].content === '') {
                const view = this.views[0];
                const current = this.views.pop();
                view.pathname = pathname;
                view.filename = current.filename;
                view.content = content;
                this.currentIndex = 0;
            }
            else {
                const view = this.current;
                view.pathname = pathname;
                view.content = content;
            }
        }
        isLinearXY(linearX, linearY, parent, children) {
            return (linearX || linearY) &&
                !parent.flex.enabled &&
                (!children.some(node => node.floating && node.css('clear') !== 'none') &&
                    (children.every(node => node.css('float') !== 'right') || children.every(node => node.css('float') === 'right')) &&
                    children.every(node => node.pageflow));
        }
        addInclude(filename, content) {
            this.includes.push({
                pathname: 'res/layout',
                filename,
                content
            });
        }
        findExtension(name) {
            return this._extensions.find(item => item.name === name);
        }
        addXmlNs(name, uri) {
            this.controllerHandler.addXmlNs(name, uri);
        }
        findByDomId(id, current = false) {
            return (current ? this.cache : this.cacheInternal).list.find(node => node.element.id === id || node.nodeId === id);
        }
        toString() {
            return (this.views.length > 0 ? this.views[0].content : '');
        }
        insertNode(element, parent) {
            let node = null;
            if (element.nodeName === '#text') {
                if (optional(element, 'textContent', 'string').trim() !== '') {
                    node = new this.TypeT(this.cache.nextId, SETTINGS.targetAPI, element);
                    node.tagName = 'PLAINTEXT';
                    if (parent != null) {
                        node.parent = parent;
                        node.inherit(parent, 'style');
                        parent.children.push(node);
                    }
                    node.setBounds(false, element);
                }
            }
            else if (isVisible(element)) {
                node = new this.TypeT(this.cache.nextId, SETTINGS.targetAPI, element);
                if (element.__nodeIsolated) {
                    node.isolated = true;
                }
                node.setExcludeProcedure();
                node.setExcludeResource();
            }
            if (node != null) {
                this.cache.list.push(node);
            }
            return node;
        }
        orderExt(available, element) {
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
                available.forEach(item => {
                    const index = extensions.indexOf(item.name);
                    if (index !== -1) {
                        tagged[index] = item;
                    }
                    else {
                        untagged.push(item);
                    }
                });
                return [...tagged.filter(item => item), ...untagged];
            }
            else {
                return available;
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
            this.views[this.currentIndex] = value;
        }
        get current() {
            return this.views[this.currentIndex];
        }
        get layouts() {
            return [...this.views, ...this.includes];
        }
        get closed() {
            return this._closed;
        }
        get extensions() {
            return this._extensions.filter(item => item.enabled);
        }
        get viewData() {
            return { cache: this.cacheInternal.list, views: this.views, includes: this.includes };
        }
        get size() {
            return this.views.length + this.includes.length;
        }
    }

    class Extension {
        constructor(name, tagNames, options) {
            this.name = name;
            this.options = {};
            this.tagNames = [];
            this.enabled = true;
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
            this.element = (element == null && this.node != null ? this.node.element : element);
        }
        is(node) {
            return (node.hasElement && (this.tagNames.length === 0 || this.tagNames.includes(node.element.tagName)));
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
                    const extension = this.application.findExtension(item.name);
                    if (extension != null) {
                        extension.setTarget(this.node, this.parent, this.element);
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
                this.dependencies.filter(item => item.init).forEach(item => {
                    const extension = this.application.findExtension(item.name);
                    if (extension != null) {
                        extension.setTarget(this.node, this.parent, this.element);
                        extension.afterInit(true);
                    }
                });
            }
        }
        condition() {
            if (this.node && this.node.hasElement) {
                const ext = optional(this.node.element, 'dataset.ext');
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
            return { xml: '' };
        }
        processChild(mapX, mapY) {
            return { xml: '' };
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
            const element = this.element;
            const result = {};
            if (element != null) {
                const prefix = convertCamelCase(this.name, '\\.');
                for (const attr in element.dataset) {
                    if (attr.length > prefix.length && attr.startsWith(prefix)) {
                        result[capitalize(attr.substring(prefix.length), false)] = element.dataset[attr];
                    }
                }
            }
            return result;
        }
    }

    const EXT_NAME = {
        EXTERNAL: 'androme.external',
        CUSTOM: 'androme.custom',
        GRID: 'androme.grid',
        LIST: 'androme.list',
        TABLE: 'androme.table'
    };

    class External extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        beforeInit(init = false) {
            if (init || this.included()) {
                if (this.element != null) {
                    const object = this.element;
                    if (object.__andromeExternalDisplay == null) {
                        const display = [];
                        let current = this.element;
                        while (current != null) {
                            display.push(getStyle(current).display);
                            current.style.display = 'block';
                            current = current.parentElement;
                        }
                        object.__andromeExternalDisplay = display;
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
                    const object = this.element;
                    if (object.__andromeExternalDisplay != null) {
                        const display = object.__andromeExternalDisplay;
                        let current = this.element;
                        let i = 0;
                        while (current != null) {
                            current.style.display = display[i];
                            current = current.parentElement;
                            i++;
                        }
                        delete object.__andromeExternalDisplay;
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

    class Controller {
        constructor() {
            this.before = {};
            this.after = {};
        }
        reset() {
            this.before = {};
            this.after = {};
        }
        insertAuxillaryViews(output) {
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
        hasAppendProcessing(id) {
            return (this.before[id] != null || this.after[id] != null);
        }
        getEnclosingTag(depth, tagName, id, xml = '', preXml = '', postXml = '') {
            const indent = repeat(Math.max(0, depth));
            let output = preXml +
                `{<${id}}`;
            if (hasValue(xml)) {
                output += indent + `<${tagName}${(depth === 0 ? '{#0}' : '')}{@${id}}{&${id}}>\n` +
                    xml +
                    indent + `</${tagName}>\n`;
            }
            else {
                output += indent + `<${tagName}${(depth === 0 ? '{#0}' : '')}{@${id}}{&${id}} />\n`;
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
        static addString(value, name = '') {
            if (hasValue(value)) {
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
                    if (numeric || /^[0-9]/.test(value)) {
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
            if (hasValue(srcset)) {
                const filePath = element.src.substring(0, element.src.lastIndexOf('/') + 1);
                srcset.split(',').forEach((value) => {
                    const match = /^(.*?)\s*([0-9]+\.?[0-9]*x)?$/.exec(value.trim());
                    if (match != null) {
                        if (match[2] == null) {
                            match[2] = '1x';
                        }
                        const image = filePath + lastIndexOf(match[1]);
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
            return Resource.addImage(images, prefix);
        }
        static addImage(images, prefix = '') {
            let src = '';
            if (images['mdpi'] != null && hasValue(images['mdpi'])) {
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
                }
            }
            return src;
        }
        static addImageURL(value, prefix = '') {
            const match = value.match(/^url\("?(.*?)"?\)$/);
            if (match != null) {
                return Resource.addImage({ 'mdpi': resolvePath(match[1]) }, prefix);
            }
            return '';
        }
        static addColor(value, opacity = '1') {
            value = value.toUpperCase().trim();
            const opaque = (parseFloat(opacity) < 1 ? `#${opacity.substring(2) + value.substring(1)}` : value);
            if (value !== '') {
                let colorName = '';
                if (!Resource.STORED.COLORS.has(opaque)) {
                    const color = findNearestColor(value);
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
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.BOX_SPACING)) {
                    const element = node.element;
                    const object = element;
                    if (!hasValue(object.__boxSpacing) || SETTINGS.alwaysReevaluateResources) {
                        const result = getBoxSpacing(element);
                        for (const i in result) {
                            if (node.inline && (i === 'marginTop' || i === 'marginBottom')) {
                                result[i] = '0px';
                            }
                            else {
                                result[i] += 'px';
                            }
                        }
                        object.__boxSpacing = result;
                    }
                }
            });
        }
        setBoxStyle() {
            this.cache.visible.forEach(node => {
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.BOX_STYLE)) {
                    const element = node.element;
                    const object = element;
                    if (!hasValue(object.__boxStyle) || SETTINGS.alwaysReevaluateResources) {
                        const result = {
                            borderTop: this.parseBorderStyle,
                            borderRight: this.parseBorderStyle,
                            borderBottom: this.parseBorderStyle,
                            borderLeft: this.parseBorderStyle,
                            borderRadius: this.parseBorderRadius,
                            backgroundColor: this.parseBackgroundColor,
                            backgroundImage: (!includesEnum(node.excludeResource, NODE_RESOURCE.IMAGE_SOURCE) ? this.parseBackgroundImage : ''),
                            backgroundSize: this.parseBoxDimensions
                        };
                        for (const i in result) {
                            if (typeof result[i] === 'function') {
                                result[i] = result[i](node.css(i), node, i);
                            }
                        }
                        if (result.backgroundColor.length > 0) {
                            if ((SETTINGS.excludeBackgroundColor.includes(result.backgroundColor[0]) && result.backgroundColor[1] !== node.styleMap.backgroundColor) || (node.styleMap.backgroundColor == null && node.documentParent.visible && sameAsParent(element, 'backgroundColor'))) {
                                result.backgroundColor = [];
                            }
                            else {
                                result.backgroundColor[0] = Resource.addColor(result.backgroundColor[0], result.backgroundColor[2]);
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
            this.cache.visible.forEach(node => {
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.FONT_STYLE)) {
                    const element = node.element;
                    const object = element;
                    if (!hasValue(object.__fontStyle) || SETTINGS.alwaysReevaluateResources) {
                        if (node.renderChildren.length > 0 || node.tagName === 'IMG' || node.tagName === 'HR') {
                            return;
                        }
                        else {
                            let color = parseRGBA(node.css('color'), node.css('opacity'));
                            if (color.length > 0) {
                                if (SETTINGS.excludeTextColor.includes(color[0]) && (element.nodeName === '#text' || color[1] !== node.styleMap.color)) {
                                    color = [];
                                }
                                else {
                                    color[0] = Resource.addColor(color[0], color[2]);
                                }
                            }
                            let backgroundColor = parseRGBA(node.css('backgroundColor'), node.css('opacity'));
                            if (backgroundColor.length > 0) {
                                if ((SETTINGS.excludeBackgroundColor.includes(backgroundColor[0]) && (element.nodeName === '#text' || backgroundColor[1] !== node.styleMap.backgroundColor)) || (node.styleMap.backgroundColor == null && sameAsParent(element, 'backgroundColor'))) {
                                    backgroundColor = [];
                                }
                                else {
                                    backgroundColor[0] = Resource.addColor(backgroundColor[0], backgroundColor[2]);
                                }
                            }
                            let fontWeight = node.css('fontWeight');
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
                                }
                            }
                            const result = {
                                fontFamily: node.css('fontFamily'),
                                fontStyle: node.css('fontStyle'),
                                fontSize: node.css('fontSize'),
                                fontWeight,
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
            this.cache.elements.filter(node => node.tagName === 'IMG' || (node.tagName === 'INPUT' && node.element.type === 'image')).forEach(node => {
                const element = node.element;
                const object = element;
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.IMAGE_SOURCE)) {
                    if (!hasValue(object.__imageSource) || SETTINGS.alwaysReevaluateResources) {
                        const result = (node.tagName === 'IMG' ? Resource.addImageSrcSet(element) : Resource.addImage({ 'mdpi': element.src }));
                        object.__imageSource = result;
                    }
                }
            });
        }
        setOptionArray() {
            this.cache.visible.filter(node => node.tagName === 'SELECT').forEach(node => {
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.OPTION_ARRAY)) {
                    const element = node.element;
                    const object = element;
                    if (!hasValue(object.__optionArray) || SETTINGS.alwaysReevaluateResources) {
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
        setValueString(inlineExclude) {
            this.cache.visible.forEach(node => {
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.VALUE_STRING)) {
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
                            value = optional(element, 'textContent').trim();
                        }
                        else if (element.tagName === 'BUTTON' || (node.hasElement && ((element.children.length === 0 && MAP_ELEMENT[node.tagName] == null) || (element.children.length > 0 && Array.from(element.children).every((child) => MAP_ELEMENT[child.tagName] == null && inlineExclude.includes(child.tagName)))))) {
                            name = element.innerText.trim();
                            value = element.innerHTML.trim();
                        }
                        if (hasValue(value)) {
                            const result = Resource.addString(value, name);
                            object.__valueString = result;
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
            const color = (style !== 'none' ? parseRGBA(node.css(`${attribute}Color`), node.css('opacity')) : []);
            if (color.length > 0) {
                color[0] = Resource.addColor(color[0], color[2]);
            }
            if (style === 'inset' && width === '0px') {
                width = '1px';
            }
            return { style, width, color: (color.length > 0 ? color[0] : '#000000') };
        }
        parseBackgroundImage(value, node, attribute) {
            return Resource.addImageURL(value);
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
        parseBackgroundColor(value, node, attribute) {
            return parseRGBA(value, node.css('opacity'));
        }
        parseBoxDimensions(value, node, attribute) {
            if (value !== 'auto') {
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
            }
            return [];
        }
    }
    Resource.STORED = {
        STRINGS: new Map(),
        COLORS: new Map(),
        DIMENS: new Map(),
        IMAGES: new Map()
    };

    class Node {
        constructor(id, element) {
            this.id = id;
            this.styleMap = {};
            this.nodeType = 0;
            this.depth = -1;
            this.renderDepth = 0;
            this.parentIndex = Number.MAX_VALUE;
            this.excludeProcedure = 0;
            this.excludeResource = 0;
            this.documentRoot = false;
            this.visible = true;
            this.companion = false;
            this.isolated = false;
            this._namespaces = new Set();
            this._data = {};
            if (element != null) {
                const object = element;
                if (element instanceof HTMLElement) {
                    const styleMap = object.__styleMap || {};
                    for (const inline of Array.from(element.style)) {
                        styleMap[convertCamelCase(inline)] = element.style[inline];
                    }
                    this.style = object.__style || getComputedStyle(element);
                    this.styleMap = styleMap;
                }
                this._element = element;
                object.__node = this;
            }
        }
        add(ns, attr, value = '', overwrite = true) {
            const name = `_${ns || '_'}`;
            if (hasValue(value)) {
                if (this[name] == null) {
                    this._namespaces.add(ns);
                    this[name] = {};
                }
                if (!overwrite && this[name][attr] != null) {
                    return null;
                }
                this[name][attr] = value;
            }
            return this[name] && this[name][attr];
        }
        get(ns, attr) {
            const name = `_${ns || '_'}`;
            return (this[name] && this[name][attr] != null ? this[name][attr] : '');
        }
        delete(ns, ...attrs) {
            const name = `_${ns || '_'}`;
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
        apply(options) {
            const excluded = {};
            if (options != null) {
                for (const namespace in options) {
                    const obj = options[namespace];
                    if (typeof obj === 'object') {
                        for (const attr in obj) {
                            this.add(namespace, attr, obj[attr]);
                        }
                    }
                    else if (hasValue(obj)) {
                        excluded[namespace] = obj;
                    }
                }
            }
            return excluded;
        }
        render(parent) {
            this.renderParent = parent;
            this.renderDepth = (parent === this || this.documentRoot || hasValue(parent.dataset.target) ? 0 : parent.renderDepth + 1);
        }
        hide() {
            this.renderParent = true;
            this.visible = false;
        }
        data(attr, value, overwrite = true) {
            if (hasValue(value) && (overwrite || this._data[attr] == null)) {
                this._data[attr] = value;
            }
            return this._data[attr];
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
        inherit(node, ...props) {
            for (const type of props) {
                switch (type) {
                    case 'base':
                        this.style = node.style;
                        this.bounds = node.bounds;
                        this.linear = node.linear;
                        this.box = node.box;
                        break;
                    case 'data':
                        for (const attr in this._data) {
                            const data = this._data[attr];
                            if (typeof data === 'object' && data.inherit === true) {
                                const inherit = node.data(attr);
                                if (inherit != null) {
                                    switch (typeof node[attr]) {
                                        case 'number':
                                            inherit[attr] += data[attr];
                                            break;
                                        case 'boolean':
                                            if (data[attr] !== false) {
                                                inherit[attr] = true;
                                            }
                                            break;
                                        default:
                                            inherit[attr] = data[attr];
                                    }
                                }
                                else {
                                    node.data(attr, data);
                                }
                                delete this._data[attr];
                            }
                        }
                        break;
                    case 'style':
                        const style = {};
                        for (const attr in node.style) {
                            if (attr.startsWith('font') || attr.startsWith('color')) {
                                const key = convertCamelCase(attr);
                                style[key] = node.style[key];
                            }
                        }
                        Object.assign(this.styleMap, style);
                        break;
                    case 'styleMap':
                        for (const attr in node.styleMap) {
                            if (this.styleMap[attr] == null) {
                                this.styleMap[attr] = node.styleMap[attr];
                            }
                        }
                        break;
                }
            }
        }
        intersect(rect, dimension = 'linear') {
            const top = (rect.top > this[dimension].top && rect.top < this[dimension].bottom);
            const right = (rect.right > this[dimension].left && rect.right < this[dimension].right);
            const bottom = (rect.bottom > this[dimension].top && rect.bottom < this[dimension].bottom);
            const left = (rect.left > this[dimension].left && rect.left < this[dimension].right);
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
        setExcludeProcedure(exclude) {
            if (exclude == null && this.hasElement) {
                exclude = this.dataset.excludeProcedure || '';
                if (this.parentElement != null) {
                    exclude += '|' + (this.parentElement.dataset.excludeProcedureChild || '');
                }
            }
            if (exclude != null) {
                exclude.split('|').map(value => value.toUpperCase().trim()).forEach(value => {
                    if (value !== '' && NODE_PROCEDURE[value] != null) {
                        this.excludeProcedure |= NODE_PROCEDURE[value];
                    }
                });
            }
        }
        setExcludeResource(exclude) {
            if (exclude == null) {
                exclude = this.dataset.excludeResource;
                if (this.parentElement != null) {
                    exclude += '|' + (this.parentElement.dataset.excludeResourceChild || '');
                }
            }
            if (this.hasElement && exclude != null) {
                exclude.split('|').map(value => value.toUpperCase().trim()).forEach(value => {
                    if (value !== '' && NODE_RESOURCE[value] != null) {
                        this.excludeResource |= NODE_RESOURCE[value];
                    }
                });
            }
        }
        setBounds(calibrate = false, element) {
            if (!calibrate) {
                const bounds = (element != null ? getRangeBounds(element) : (this.hasElement ? assignBounds(this.element.getBoundingClientRect()) : null));
                if (bounds != null) {
                    this.bounds = bounds;
                }
            }
            if (this.bounds != null) {
                const linear = {
                    top: this.bounds.top - this.marginTop,
                    right: this.bounds.right + this.marginRight,
                    bottom: this.bounds.bottom + this.marginBottom,
                    left: this.bounds.left - this.marginLeft,
                    width: 0,
                    height: 0
                };
                if (this.linear != null) {
                    Object.assign(this.linear, linear);
                }
                else {
                    this.linear = linear;
                }
                const box = {
                    top: this.bounds.top + (this.paddingTop + this.borderTopWidth),
                    right: this.bounds.right - (this.paddingRight + this.borderRightWidth),
                    bottom: this.bounds.bottom - (this.paddingBottom + this.borderBottomWidth),
                    left: this.bounds.left + (this.paddingLeft + this.borderLeftWidth),
                    width: 0,
                    height: 0
                };
                if (this.box != null) {
                    Object.assign(this.box, box);
                }
                else {
                    this.box = box;
                }
                this.setDimensions();
            }
        }
        setBoundsMin() {
            const nodes = this.children.filter(node => !node.pageflow);
            if (nodes.length > 0) {
                const [right, bottom] = [Math.max.apply(null, this.children.map(node => node.linear.right)), Math.max.apply(null, this.children.map(node => node.linear.bottom))];
                if (nodes.some(node => node.linear.right === right || node.linear.bottom === bottom)) {
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
        setDimensions() {
            const linear = this.linear;
            linear.width = linear.right - linear.left;
            linear.height = linear.bottom - linear.top;
            const box = this.box;
            box.width = box.right - box.left;
            box.height = box.bottom - box.top;
        }
        set parent(value) {
            if (value == null || value === this._parent) {
                return;
            }
            this._parent = value;
            this.depth = value.depth + 1;
        }
        get parent() {
            return this._parent;
        }
        set documentParent(value) {
            this._documentParent = value;
        }
        get documentParent() {
            return this._documentParent || (this.element && this.element.parentElement != null ? this.element.parentElement.__node : null) || this._parent;
        }
        set tagName(value) {
            this._tagName = value;
        }
        get tagName() {
            return this._tagName || (this.hasElement ? (this.element.tagName === 'INPUT' ? this.element.type.toUpperCase() : this.element.tagName) : '');
        }
        set nodeName(value) {
            this._nodeName = value;
        }
        get nodeName() {
            return this._nodeName;
        }
        set renderParent(value) {
            if (value instanceof Node && value !== this) {
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
            return (this._element instanceof HTMLElement);
        }
        get parentElement() {
            return this._element && this._element.parentElement;
        }
        get namespaces() {
            return Array.from(this._namespaces);
        }
        get dataset() {
            return (this.hasElement ? this.element.dataset : {});
        }
        get extension() {
            return (this.dataset.ext != null ? this.dataset.ext.split(',')[0].trim() : '');
        }
        get flex() {
            const style = this.style;
            if (style != null) {
                const parent = this.documentParent;
                return {
                    enabled: (style.display.indexOf('flex') !== -1),
                    direction: style.flexDirection,
                    basis: style.flexBasis,
                    grow: convertInt(style.flexGrow),
                    shrink: convertInt(style.flexShrink),
                    wrap: style.flexWrap,
                    alignSelf: (parent && parent.styleMap.alignItems != null && (this.styleMap.alignSelf == null || style.alignSelf === 'auto') ? parent.styleMap.alignItems : style.alignSelf),
                    justifyContent: style.justifyContent,
                    order: convertInt(style.order)
                };
            }
            return {};
        }
        get floating() {
            const float = (this.style != null ? this.style.float : '');
            return (float === 'left' || float === 'right');
        }
        get overflow() {
            let value = 0 /* NONE */;
            if (this.hasElement) {
                if (this.css('overflow') === 'scroll' || this.css('overflowX') === 'scroll' || (this.css('overflowX') === 'auto' && this.element.clientWidth !== this.element.scrollWidth)) {
                    value |= 2 /* HORIZONTAL */;
                }
                if (this.css('overflow') === 'scroll' || this.css('overflowY') === 'scroll' || (this.css('overflowY') === 'auto' && this.element.clientHeight !== this.element.scrollHeight)) {
                    value |= 4 /* VERTICAL */;
                }
            }
            return value;
        }
        get overflowX() {
            return includesEnum(this.overflow, 2 /* HORIZONTAL */);
        }
        get overflowY() {
            return includesEnum(this.overflow, 4 /* VERTICAL */);
        }
        get viewWidth() {
            return convertInt(this.styleMap.width || this.styleMap.minWidth);
        }
        get viewHeight() {
            return convertInt(this.styleMap.height || this.styleMap.lineHeight || this.styleMap.minHeight);
        }
        get marginTop() {
            return (this.inline ? 0 : convertInt(this.css('marginTop')));
        }
        get marginRight() {
            return convertInt(this.css('marginRight'));
        }
        get marginBottom() {
            return (this.inline ? 0 : convertInt(this.css('marginBottom')));
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
        get pageflow() {
            const position = this.css('position');
            return (position === 'static' || position === 'initial' || this.tagName === 'PLAINTEXT' || (position === 'relative' && convertInt(this.css('top')) === 0 && convertInt(this.css('right')) === 0 && convertInt(this.css('bottom')) === 0 && convertInt(this.css('left')) === 0));
        }
        get inline() {
            return (!this.floating && (this.css('display') === 'inline' || (this.css('display') === 'initial' && INLINE_ELEMENT.includes(this.element.tagName))));
        }
        get center() {
            return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2) };
        }
    }

    const API_ANDROID = {
        [exports.build.P]: {
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
            customizations: {}
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
            this.constraint = {};
            this.children = [];
            this.renderChildren = [];
        }
        static getViewName(tagName) {
            return NODE_ANDROID[NODE_STANDARD[tagName]];
        }
        add(ns, attr, value = '', overwrite = true) {
            if (!this.supported(ns, attr)) {
                return false;
            }
            return super.add(ns, attr, value, overwrite);
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
        apply(options = {}) {
            const excluded = super.apply(options);
            for (const obj in excluded) {
                this.attr(`${obj}="${excluded[obj]}"`);
            }
        }
        attr(value, overwrite = true) {
            const match = value.match(/^(?:([a-z]+):)?(\w+)="((?:@+?[a-z]+\/)?.+)"$/);
            if (match != null) {
                this.add(match[1] || '_', match[2], match[3], overwrite);
            }
        }
        anchor(position, adjacent, orientation, overwrite) {
            if (overwrite == null) {
                overwrite = (adjacent === 'parent' || adjacent === 'true');
            }
            switch (this.renderParent.nodeName) {
                case NODE_ANDROID.CONSTRAINT:
                    if (arguments.length === 1) {
                        return this.app(position);
                    }
                    this.app(position, adjacent, overwrite);
                    break;
                case NODE_ANDROID.RELATIVE:
                    if (arguments.length === 1) {
                        return this.android(position);
                    }
                    this.android(position, adjacent, overwrite);
                    break;
            }
            if (hasValue(orientation)) {
                this.constraint[orientation] = true;
            }
        }
        modifyBox(area, offset, styleMap = false) {
            const value = convertEnum(BOX_STANDARD, BOX_ANDROID, area);
            if (value !== '') {
                const dimension = parseRTL(value);
                const total = formatPX(offset);
                this.android(dimension, total);
                if (styleMap) {
                    this.css(dimension.replace('layout_', ''), total);
                    this.setBounds(true);
                }
            }
        }
        boxValue(area) {
            const value = convertEnum(BOX_STANDARD, BOX_ANDROID, area);
            if (value !== '') {
                const dimen = parseRTL(value);
                return [dimen, this.android(dimen) || '0px'];
            }
            return ['', '0px'];
        }
        supported(ns, attr) {
            if (this.api > 0) {
                for (let i = this.api + 1; i <= exports.build.LATEST; i++) {
                    const version = API_ANDROID[i];
                    if (version && version[ns] && version[ns].includes(attr)) {
                        return false;
                    }
                }
            }
            return true;
        }
        combine() {
            const result = [];
            this.namespaces.forEach(value => {
                const ns = this[`_${value}`];
                for (const attr in ns) {
                    if (value !== '_') {
                        result.push(`${value}:${attr}="${ns[attr]}"`);
                    }
                    else {
                        result.push(`${attr}="${ns[attr]}"`);
                    }
                }
            });
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
        applyCustomizations() {
            [API_ANDROID[this.api], API_ANDROID[0]].forEach(item => {
                if (item && item.customizations != null) {
                    const customizations = item.customizations[this.nodeName];
                    if (customizations != null) {
                        for (const ns in customizations) {
                            for (const attr in customizations[ns]) {
                                this.add(ns, attr, customizations[ns][attr], false);
                            }
                        }
                    }
                }
            });
        }
        is(...views) {
            for (const value of views) {
                if (this.nodeName === View.getViewName(value)) {
                    return true;
                }
            }
            return false;
        }
        setNodeId(nodeName) {
            for (const type in NODE_ANDROID) {
                if (NODE_ANDROID[type] === nodeName && NODE_STANDARD[type] != null) {
                    this.nodeType = NODE_STANDARD[type];
                    break;
                }
            }
            super.nodeName = nodeName || this.nodeName;
            if (this.nodeId == null) {
                const element = this.element;
                this.nodeId = convertWord(generateId('android', (element.id || element.name || `${lastIndexOf(this.nodeName, '.').toLowerCase()}_1`)));
            }
            this.android('id', this.stringId);
        }
        setLayout(width, height) {
            if (!(this.renderParent instanceof View)) {
                return;
            }
            if (width == null) {
                width = (this.hasElement ? this.element.clientWidth + this.borderLeftWidth + this.borderRightWidth + this.marginLeft + this.marginRight : 0);
            }
            if (height == null) {
                height = (this.hasElement ? this.element.clientHeight + this.borderTopWidth + this.borderBottomWidth + this.marginTop + this.marginBottom : 0);
            }
            const parent = this.documentParent;
            const renderParent = this.renderParent;
            const widthParent = parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + parent.borderLeftWidth + parent.borderRightWidth);
            const heightParent = parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + parent.borderTopWidth + parent.borderBottomWidth);
            const wrapContent = parent.flex.enabled || parent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.GRID) || (parent.is(NODE_STANDARD.LINEAR) && parent.horizontal) || this.is(NODE_STANDARD.IMAGE);
            const styleMap = this.styleMap;
            const constraint = this.constraint;
            if (this.documentRoot && !this.flex.enabled && this.is(NODE_STANDARD.FRAME, NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE)) {
                if (this.viewWidth === 0 && !constraint.layoutWidth) {
                    this.android('layout_width', 'match_parent', false);
                }
                if (this.viewHeight === 0 && !constraint.layoutHeight) {
                    this.android('layout_height', 'match_parent', false);
                }
            }
            if (this.overflow !== 0 /* NONE */ && !this.is(NODE_STANDARD.TEXT)) {
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
                if (constraint.layoutWidth) {
                    this.android('layout_width', (this.renderChildren.some(node => node.css('float') === 'right') || this.bounds.width >= widthParent ? 'match_parent' : formatPX(this.bounds.width)));
                }
                else if (this.android('layout_width') == null) {
                    let maxRight = 0;
                    let maxRightParent = 0;
                    const parentMaxWidth = (parent.documentRoot ? parent.viewWidth : this.ascend().reduce((a, b) => Math.max(a, b.viewWidth), 0));
                    if (parent.is(NODE_STANDARD.LINEAR) && !parent.horizontal) {
                        maxRight = Math.ceil(this.cascade().reduce((a, b) => Math.max(a, b.linear.right), 0));
                        maxRightParent = Math.floor(parent.cascade().reduce((a, b) => Math.max(a, b.linear.right), 0));
                    }
                    if (convertInt(this.android('layout_columnWeight')) > 0) {
                        this.android('layout_width', '0px');
                    }
                    else if (!wrapContent && (parent.overflow === 0 /* NONE */ && parentMaxWidth > 0 && width >= widthParent) || (!this.floating && (this.renderChildren.length === 0 || (maxRight !== 0 && maxRight >= maxRightParent)) && optional(this, 'style.display').indexOf('inline') === -1) && BLOCK_ELEMENT.includes(this.tagName)) {
                        this.android('layout_width', 'match_parent');
                    }
                    else {
                        this.android('layout_width', 'wrap_content');
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
                if (constraint.layoutHeight) {
                    this.android('layout_height', (this.bounds.height >= heightParent ? 'match_parent' : formatPX(this.bounds.height)));
                }
                else if (this.android('layout_height') == null) {
                    let layoutHeight = 'wrap_content';
                    if (height >= heightParent) {
                        if ((parent.overflow === 0 /* NONE */ && parent.viewHeight && !FIXED_ANDROID.includes(this.nodeName) && (!renderParent.is(NODE_STANDARD.RELATIVE) && renderParent.android('layout_height') !== 'wrap_content'))) {
                            layoutHeight = 'match_parent';
                        }
                    }
                    this.android('layout_height', layoutHeight);
                }
            }
        }
        setAlignment() {
            if (!(this.renderParent instanceof View)) {
                return;
            }
            const left = parseRTL('left');
            const right = parseRTL('right');
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
            const renderParent = this.renderParent;
            const textView = this.is(NODE_STANDARD.TEXT);
            let textAlign = this.styleMap.textAlign;
            let textAlignParent = '';
            const verticalAlign = this.styleMap.verticalAlign;
            if (!this.floating || textView) {
                let node = this.documentParent;
                while (node != null) {
                    textAlignParent = node.styleMap.textAlign || textAlignParent;
                    if (node.floating || hasValue(textAlign)) {
                        break;
                    }
                    node = node.documentParent;
                }
            }
            if (textAlign === '' && this.tagName === 'TH') {
                textAlign = 'center';
            }
            const horizontalParent = convertHorizontal(textAlignParent);
            let horizontal = convertHorizontal(textAlign);
            let vertical = '';
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
                    if (this.hasElement && this.styleMap.lineHeight != null && (this.style.height === this.styleMap.lineHeight || convertInt(this.styleMap.lineHeight) === (this.box.bottom - this.box.top))) {
                        vertical = 'center_vertical';
                    }
            }
            if (renderParent.tagName === 'TABLE') {
                this.android('layout_gravity', 'fill');
            }
            else {
                const gravityParent = (this.renderParent.android('gravity') || '');
                let horizontalFloat = (this.css('float') === 'right' && gravityParent !== right ? right : '');
                let verticalFloat = '';
                if (horizontalFloat === '' && gravityParent.indexOf(horizontalParent) === -1 && !textView) {
                    horizontalFloat = horizontal;
                    horizontal = '';
                }
                if (vertical !== '' && renderParent instanceof View && renderParent.is(NODE_STANDARD.LINEAR, NODE_STANDARD.GRID, NODE_STANDARD.FRAME)) {
                    verticalFloat = vertical;
                    vertical = '';
                }
                const layoutGravity = [horizontalFloat, verticalFloat].filter(value => value).join('|');
                if (layoutGravity !== '') {
                    this.android('layout_gravity', layoutGravity);
                }
            }
            if (this.renderChildren.length > 0 && !this.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE) && (this.renderChildren.every(item => item.css('float') === 'right') || (this.css('textAlign') === 'right' && this.renderChildren.every(item => item.css('display').indexOf('inline') !== -1)))) {
                this.android('gravity', right);
            }
            else {
                const gravity = [horizontal, vertical].filter(value => value);
                if (gravity.length > 0) {
                    this.android('gravity', gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|'));
                }
            }
            if (this.android('layout_gravity') == null) {
                const marginLeft = this.css('marginLeft');
                const marginRight = this.css('marginRight');
                const margin = this.css('margin').split(' ');
                if ((marginLeft === 'auto' && marginRight === 'auto') || (marginLeft !== '0px' && marginLeft === marginRight && marginLeft === margin[1])) {
                    this.android('layout_gravity', 'center_horizontal');
                }
            }
        }
        mergeBoxSpacing() {
            if (this.api >= exports.build.OREO) {
                ['layout_margin', 'padding'].forEach((value, index) => {
                    const leftRtl = parseRTL(`${value}Left`);
                    const rightRtl = parseRTL(`${value}Right`);
                    const top = (index === 0 && this.inline ? 0 : convertInt(this.android(`${value}Top`)));
                    const right = convertInt(this.android(rightRtl));
                    const bottom = (index === 0 && this.inline ? 0 : convertInt(this.android(`${value}Bottom`)));
                    const left = convertInt(this.android(leftRtl));
                    if (top !== 0 && top === bottom && bottom === left && left === right) {
                        this.delete('android', `${value}*`);
                        this.android(value, formatPX(top));
                    }
                    else {
                        if (index !== 0 || (this.renderParent instanceof View && !this.renderParent.is(NODE_STANDARD.GRID))) {
                            if (top !== 0 && top === bottom) {
                                this.delete('android', `${value}Top`, `${value}Bottom`);
                                this.android(`${value}Vertical`, formatPX(top));
                            }
                            if (left !== 0 && left === right) {
                                this.delete('android', leftRtl, rightRtl);
                                this.android(`${value}Horizontal`, formatPX(left));
                            }
                        }
                    }
                });
            }
        }
        setAccessibility() {
            const element = this.element;
            const nextElement = element.nextElementSibling;
            let labeled = false;
            if (nextElement && nextElement.htmlFor === element.id && element.tagName === 'INPUT') {
                const node = nextElement.__node;
                if (node.children.length === 0) {
                    node.setNodeId(NODE_ANDROID.TEXT);
                    this.css('marginRight', node.style.marginRight);
                    this.css('paddingRight', node.style.paddingRight);
                    this.label = node;
                    node.hide();
                    node.labelFor = this;
                    labeled = true;
                }
            }
            switch (this.nodeName) {
                case NODE_ANDROID.EDIT:
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
                        if (label && label.is(NODE_STANDARD.TEXT)) {
                            label.android('labelFor', this.stringId);
                        }
                    }
                case NODE_ANDROID.SELECT:
                case NODE_ANDROID.CHECKBOX:
                case NODE_ANDROID.RADIO:
                case NODE_ANDROID.BUTTON:
                    if (this.element.disabled) {
                        this.android('focusable', 'false');
                    }
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
            return (hasValue(this.nodeId) ? `@+id/${this.nodeId}` : '');
        }
        set nodeName(value) {
            this._nodeName = value;
        }
        get nodeName() {
            if (this._nodeName != null) {
                return super.nodeName;
            }
            else {
                const value = MAP_ELEMENT[this.tagName];
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
            if (parent instanceof View && parent.visible) {
                const left = this.linear.left - parent.box.left;
                const right = parent.box.right - this.linear.right;
                return calculateBias(left, right);
            }
            return 0.5;
        }
        get verticalBias() {
            const parent = this.renderParent;
            if (parent instanceof View && parent.visible) {
                const top = this.linear.top - parent.box.top;
                const bottom = parent.box.bottom - this.linear.bottom;
                return calculateBias(top, bottom);
            }
            return 0.5;
        }
    }

    class ViewGroup extends View {
        constructor(id, node, parent, children) {
            super(id, node.api);
            this.documentParent = node.documentParent;
            if (parent != null) {
                this.parent = parent;
            }
            if (children != null) {
                this.children = children;
            }
            this.depth = node.depth;
        }
        setLayout() {
            super.setLayout.apply(this, this.childrenBox);
        }
        setBounds(calibrate = false) {
            const nodes = this.outerRegion;
            if (!calibrate) {
                this.bounds = {
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
                if (top[0].linear.top === node.linear.top) {
                    top.push(node);
                }
                else if (node.linear.top < top[0].linear.top) {
                    top = [node];
                }
                if (right[0].linear.right === nodeRight.linear.right) {
                    right.push(nodeRight);
                }
                else if (nodeRight.linear.right > right[0].linear.right) {
                    right = [nodeRight];
                }
                if (bottom[0].linear.bottom === node.linear.bottom) {
                    bottom.push(node);
                }
                else if (node.linear.bottom > bottom[0].linear.bottom) {
                    bottom = [node];
                }
                if (left[0].linear.left === node.linear.left) {
                    left.push(node);
                }
                else if (node.linear.left < left[0].linear.left) {
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
            if (this.parent != null && this.length > 0) {
                const left = this.first.linear.left - this.parent.box.left;
                const right = this.parent.box.right - this.last.linear.right;
                return calculateBias(left, right);
            }
            return 0.5;
        }
        get verticalBias() {
            if (this.parent != null && this.length > 0) {
                const top = this.first.linear.top - this.parent.box.top;
                const bottom = this.parent.box.bottom - this.last.linear.bottom;
                return calculateBias(top, bottom);
            }
            return 0.5;
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

    function createPlaceholder(nextId, node, children = []) {
        const placeHolder = new View(nextId, node.api, node.element);
        placeHolder.parent = node.parent;
        placeHolder.inherit(node, 'base');
        placeHolder.excludeResource |= NODE_RESOURCE.ALL;
        placeHolder.children = children;
        placeHolder.isolated = true;
        return placeHolder;
    }
    function formatResource(options) {
        for (const namespace in options) {
            const object = options[namespace];
            if (typeof object === 'object') {
                for (const attr in object) {
                    if (hasValue(object[attr])) {
                        let value = object[attr].toString();
                        switch (namespace) {
                            case 'android':
                                switch (attr) {
                                    case 'text':
                                        if (!value.startsWith('@string/')) {
                                            if (SETTINGS.numberResourceValue || !isNumber(value)) {
                                                value = Resource.addString(value);
                                                if (value !== '') {
                                                    object[attr] = `@string/${value}`;
                                                    continue;
                                                }
                                            }
                                        }
                                        break;
                                    case 'src':
                                        if (/^\w+:\/\//.test(value)) {
                                            value = Resource.addImage({ 'mdpi': value });
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
                            object[attr] = `@color/${Resource.addColor(hex)}`;
                        }
                    }
                }
            }
        }
        return options;
    }
    function findNestedMenu(node, requireExt = true) {
        return Array.from(node.element.children).find((element) => element.tagName === 'NAV' && (!requireExt || includes(optional(element, 'dataset.ext', 'string'), WIDGET_NAME.MENU)));
    }
    function findNestedExtension(node, extension) {
        return Array.from(node.element.children).find((element) => includes(optional(element, 'dataset.ext', 'string'), extension));
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
    function positionIsolated(node) {
        const renderParent = node.renderParent;
        const parent = node.documentParent;
        node.renderParent = parent;
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
                node.css('marginLeft', convertPX(Math.floor(node.bounds.left - parent.box.left)));
            }
            else {
                node.css('marginRight', convertPX(Math.floor(parent.box.right - node.bounds.right)));
            }
        }
        if (verticalBias > 0 && verticalBias < 1 && verticalBias !== 0.5) {
            if (verticalBias < 0.5) {
                node.css('marginTop', convertPX(Math.floor(node.bounds.top - parent.box.top)));
            }
            else {
                node.css('marginBottom', convertPX(Math.floor(parent.box.bottom - node.bounds.bottom)));
            }
        }
        node.renderParent = renderParent;
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
                const nodes = new ViewList(node.renderChildren.filter(item => !item.isolated), node);
                const pageflow = new ViewList(nodes.list.filter(item => item.pageflow), node);
                const constraint = node.is(NODE_STANDARD.CONSTRAINT);
                const relative = node.is(NODE_STANDARD.RELATIVE);
                const flex = node.flex;
                if (nodes.length > 0 && (constraint || relative || flex.enabled)) {
                    node.setBoundsMin();
                    const LAYOUT = LAYOUT_MAP[(relative ? 'relative' : 'constraint')];
                    const linearX = pageflow.linearX;
                    const verticalPerspective = (!SETTINGS.horizontalPerspective && !flex.enabled && !pageflow.list.some(item => item.floating));
                    function mapParent(item, direction) {
                        if (constraint) {
                            return (item.app(LAYOUT[direction]) === 'parent');
                        }
                        else {
                            return (item.android(`layout_alignParent${capitalize(parseRTL(direction))}`) === 'true');
                        }
                    }
                    function mapDelete(item, ...direction) {
                        for (const attr of direction) {
                            item.delete((constraint ? 'app' : 'android'), LAYOUT[attr]);
                        }
                    }
                    if (relative || pageflow.length === 1) {
                        pageflow.list.forEach(current => {
                            if (withinRange(current.horizontalBias, 0.5, 0.01) && withinRange(current.verticalBias, 0.5, 0.01)) {
                                if (constraint) {
                                    this.setAlignParent(current);
                                    node.constraint.layoutWidth = true;
                                    node.constraint.layoutHeight = true;
                                }
                                else {
                                    current.android('layout_centerInParent', 'true');
                                    current.constraint.horizontal = true;
                                    current.constraint.vertical = true;
                                }
                            }
                        });
                    }
                    nodes.list.unshift(node);
                    nodes.list.forEach(current => {
                        nodes.list.forEach(adjacent => {
                            if (current === adjacent || current.intersect(adjacent.linear)) {
                                return;
                            }
                            else {
                                let linear1 = current.linear;
                                let linear2 = adjacent.linear;
                                let stringId = adjacent.stringId;
                                const horizontal = (adjacent.constraint.horizontal ? 'horizontal' : '');
                                const vertical = (adjacent.constraint.vertical ? 'vertical' : '');
                                const withinY = current.withinY(adjacent.linear);
                                if (constraint) {
                                    if (current === node || adjacent === node) {
                                        if (current === node) {
                                            current = adjacent;
                                        }
                                        linear1 = current.linear;
                                        linear2 = node.box;
                                        stringId = 'parent';
                                    }
                                    if (current.css('width') != null && current.styleMap.marginRight === 'auto' && current.styleMap.marginLeft === 'auto') {
                                        this.setAlignParent(current, 'horizontal');
                                    }
                                    else {
                                        if (stringId === 'parent') {
                                            if (linear1.left <= linear2.left || withinFraction(linear1.left, linear2.left)) {
                                                current.anchor(LAYOUT['left'], 'parent', 'horizontal');
                                            }
                                            if (linear1.right >= linear2.right || withinRange(linear1.right, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                                current.anchor(LAYOUT['right'], 'parent', 'horizontal');
                                            }
                                        }
                                        else {
                                            if (current.viewWidth === 0 && linear1.left === linear2.left && linear1.right === linear2.right) {
                                                current.anchor(LAYOUT['left'], stringId);
                                                current.anchor(LAYOUT['right'], stringId);
                                            }
                                            else if (verticalPerspective) {
                                                if (linear1.left === linear2.left) {
                                                    current.anchor(LAYOUT['left'], stringId);
                                                }
                                                else if (linear1.right === linear2.right) {
                                                    current.anchor(LAYOUT['right'], stringId);
                                                }
                                            }
                                            if (withinRange(linear1.left, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                                if (current.css('float') !== 'right') {
                                                    current.anchor(LAYOUT['leftRight'], stringId, horizontal, current.withinX(linear2));
                                                }
                                                else {
                                                    current.constraint.marginHorizontal = adjacent.stringId;
                                                }
                                            }
                                            if (withinRange(linear1.right, linear2.left, SETTINGS.whitespaceHorizontalOffset)) {
                                                if (current.css('float') !== 'left') {
                                                    current.anchor(LAYOUT['rightLeft'], stringId, horizontal, current.withinX(linear2));
                                                }
                                            }
                                        }
                                    }
                                    if (stringId === 'parent') {
                                        if (linear1.top <= linear2.top || withinFraction(linear1.top, linear2.top)) {
                                            current.anchor(LAYOUT['top'], 'parent', 'vertical');
                                        }
                                        if (linear1.bottom >= linear2.bottom || withinFraction(linear1.bottom, linear2.bottom) || ((current.floating || (flex.direction === 'column' && flex.wrap !== 'nowrap')) && withinRange(linear1.bottom, linear2.bottom, SETTINGS.whitespaceHorizontalOffset))) {
                                            current.anchor(LAYOUT['bottom'], 'parent', 'vertical');
                                        }
                                    }
                                    else {
                                        const parentTop = mapParent(current, 'top');
                                        const parentBottom = mapParent(current, 'bottom');
                                        if (withinRange(linear1.top, linear2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                            if (withinY || !parentBottom) {
                                                current.anchor(LAYOUT['topBottom'], stringId, vertical, withinY);
                                            }
                                        }
                                        else if (withinRange(linear1.bottom, linear2.top, SETTINGS.whitespaceVerticalOffset)) {
                                            if (withinY || !parentTop) {
                                                current.anchor(LAYOUT['bottomTop'], stringId, vertical, withinY);
                                            }
                                        }
                                        if (linear1.top === linear2.top && !parentTop && !parentBottom) {
                                            current.anchor(LAYOUT['top'], stringId, vertical);
                                        }
                                        if (linear1.bottom === linear2.bottom && !parentTop && !parentBottom) {
                                            current.anchor(LAYOUT['bottom'], stringId, vertical);
                                        }
                                    }
                                }
                                else if (relative) {
                                    if (current === node) {
                                        return;
                                    }
                                    else if (adjacent === node) {
                                        if (current.linear.left <= node.box.left || withinFraction(current.linear.left, node.box.left)) {
                                            current.anchor(parseRTL('layout_alignParentLeft'), 'true', 'horizontal');
                                        }
                                        else if (current.linear.right >= node.box.right || withinFraction(current.linear.right, node.box.right)) {
                                            current.anchor(parseRTL('layout_alignParentRight'), 'true', 'horizontal');
                                        }
                                        if (current.linear.top <= node.box.top || withinFraction(current.linear.top, node.box.top)) {
                                            current.anchor('layout_alignParentTop', 'true', 'vertical');
                                        }
                                        else if (current.linear.bottom >= node.box.bottom || withinFraction(current.linear.bottom, node.box.bottom) || ((current.floating || (flex.direction === 'column' && flex.wrap !== 'nowrap')) && withinRange(current.linear.bottom, node.box.bottom, SETTINGS.whitespaceHorizontalOffset))) {
                                            current.anchor('layout_alignParentBottom', 'true', 'vertical');
                                        }
                                    }
                                    else {
                                        if (current.css('width') != null && current.styleMap.marginRight === 'auto' && current.styleMap.marginLeft === 'auto') {
                                            current.android('layout_centerHorizontal', 'true');
                                            current.constraint.horizontal = true;
                                        }
                                        else {
                                            if ((linear1.top === linear2.top || linear1.bottom === linear2.bottom) && withinRange(linear1.left, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                                if (current.css('float') === 'right') {
                                                    adjacent.anchor(LAYOUT['rightLeft'], current.stringId, horizontal);
                                                }
                                                else {
                                                    current.anchor(LAYOUT['leftRight'], stringId, horizontal);
                                                    if (adjacent.constraint.horizontal) {
                                                        current.delete('android', parseRTL('layout_alignParentRight'));
                                                    }
                                                }
                                            }
                                        }
                                        if (withinRange(linear1.top, linear2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                            current.anchor(LAYOUT['topBottom'], stringId, vertical, withinY);
                                            if (adjacent.constraint.vertical) {
                                                current.delete('android', 'layout_alignParentBottom');
                                            }
                                        }
                                        else if (withinRange(linear1.bottom, linear2.top, SETTINGS.whitespaceVerticalOffset)) {
                                            if (!mapParent(current, 'top')) {
                                                current.anchor(LAYOUT['bottomTop'], stringId, vertical, withinY);
                                            }
                                        }
                                        if (adjacent.constraint.horizontal) {
                                            if (linear1.bottom === linear2.bottom) {
                                                if (!linearX && (!current.floating || !current.constraint.vertical)) {
                                                    current.anchor(LAYOUT['bottom'], stringId, vertical);
                                                    if (adjacent.constraint.vertical) {
                                                        current.delete('android', 'layout_alignParentBottom');
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    });
                    nodes.list.shift();
                    pageflow.list.forEach(current => {
                        const leftRight = current.anchor(LAYOUT['leftRight']);
                        if (leftRight != null) {
                            if (flex.enabled) {
                                current.constraint.horizontal = true;
                            }
                            current.constraint.marginHorizontal = leftRight;
                        }
                        const topBottom = current.anchor(LAYOUT['topBottom']);
                        if (topBottom != null) {
                            if (flex.enabled) {
                                current.constraint.vertical = true;
                            }
                            current.constraint.marginVertical = topBottom;
                            mapDelete(current, 'top');
                        }
                        if (constraint) {
                            if (mapParent(current, 'left') && mapParent(current, 'right')) {
                                const textAlign = current.css('textAlign');
                                switch (textAlign) {
                                    case 'left':
                                    case 'start':
                                        mapDelete(current, 'right');
                                        break;
                                    case 'right':
                                    case 'end':
                                        mapDelete(current, 'left');
                                        break;
                                }
                                if (current.floating) {
                                    mapDelete(current, (current.css('float') === 'right' ? 'left' : 'right'));
                                }
                                current.android('layout_width', 'match_parent');
                            }
                            if (current.app(LAYOUT['bottomTop']) != null) {
                                mapDelete(current, 'bottom');
                            }
                        }
                        else {
                            if (current.android(LAYOUT['topBottom'])) {
                                mapDelete(current, 'bottomTop');
                            }
                        }
                    });
                    const anchors = pageflow.anchors;
                    do {
                        let restart = false;
                        pageflow.list.forEach(current => {
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
                    if (flex.enabled || (SETTINGS.useConstraintChain && constraint && pageflow.length > 1 && !pageflow.intersect())) {
                        let flexbox = null;
                        if (flex.enabled) {
                            if (flex.wrap === 'nowrap') {
                                let horizontalChain = pageflow.list.slice();
                                let verticalChain = pageflow.list.slice();
                                switch (flex.direction) {
                                    case 'row-reverse':
                                        horizontalChain.reverse();
                                    case 'row':
                                        verticalChain = [];
                                        break;
                                    case 'column-reverse':
                                        verticalChain.reverse();
                                    case 'column':
                                        horizontalChain = [];
                                        break;
                                }
                                flexbox = [{ constraint: { horizontalChain: new ViewList(horizontalChain), verticalChain: new ViewList(verticalChain) } }];
                            }
                            else {
                                const sorted = pageflow.list.slice();
                                switch (flex.direction) {
                                    case 'row-reverse':
                                    case 'column-reverse':
                                        sorted.reverse();
                                }
                                const map = {};
                                const levels = [];
                                sorted.forEach(item => {
                                    const y = item.linear.top;
                                    if (map[y] == null) {
                                        map[y] = [];
                                        levels.push(y);
                                    }
                                    map[y].push(item);
                                });
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
                                flexbox = [];
                                for (const n of levels) {
                                    flexbox.push({ constraint: { horizontalChain: new ViewList(map[n]), verticalChain: new ViewList() } });
                                }
                            }
                        }
                        else {
                            pageflow.list.forEach(current => {
                                const horizontalChain = this.partitionChain(pageflow, current, ['linear.top', 'linear.bottom'], [LAYOUT['leftRight'], LAYOUT['rightLeft']]);
                                const verticalChain = this.partitionChain(pageflow, current, ['linear.left', 'linear.right'], [LAYOUT['topBottom'], LAYOUT['bottomTop']]);
                                current.constraint.horizontalChain = new ViewList(sortAsc(horizontalChain, 'linear.left'));
                                current.constraint.verticalChain = new ViewList(sortAsc(verticalChain, 'linear.top'));
                            });
                        }
                        const direction = CHAIN_MAP.direction.slice();
                        if (verticalPerspective) {
                            direction.reverse();
                        }
                        direction.forEach((value, index) => {
                            const connected = (flex.enabled ? flexbox : pageflow.slice().list.sort((a, b) => a.constraint[value].length >= b.constraint[value].length ? -1 : 1));
                            if (connected != null) {
                                if (verticalPerspective) {
                                    index = (index === 0 ? 1 : 0);
                                }
                                const inverse = (index === 0 ? 1 : 0);
                                connected.forEach((current, level) => {
                                    const chainable = current.constraint[value];
                                    if (chainable != null && chainable.length > (flex.enabled ? 0 : 1)) {
                                        chainable.parent = node;
                                        if (flex.enabled && chainable.list.some(item => item.flex.order > 0)) {
                                            chainable[(flex.direction.indexOf('reverse') !== -1 ? 'sortDesc' : 'sortAsc')]('flex.order');
                                        }
                                        const [HV, VH] = [CHAIN_MAP['horizontalVertical'][index], CHAIN_MAP['horizontalVertical'][inverse]];
                                        const [LT, TL] = [CHAIN_MAP['leftTop'][index], CHAIN_MAP['leftTop'][inverse]];
                                        const [RB, BR] = [CHAIN_MAP['rightBottom'][index], CHAIN_MAP['rightBottom'][inverse]];
                                        const [WH, HW] = [CHAIN_MAP['widthHeight'][index], CHAIN_MAP['widthHeight'][inverse]];
                                        const orientation = HV.toLowerCase();
                                        const orientationInverse = VH.toLowerCase();
                                        const dimension = WH.toLowerCase();
                                        const first = chainable.first;
                                        const last = chainable.last;
                                        let maxOffset = -1;
                                        if (verticalPerspective) {
                                            if (first.app(LAYOUT['leftRight']) != null) {
                                                if (!mapParent(first, 'left')) {
                                                    mapDelete(first, 'left');
                                                }
                                            }
                                            if (first.app(LAYOUT['rightLeft']) != null) {
                                                mapDelete(first, 'right');
                                            }
                                        }
                                        for (let i = 0; i < chainable.length; i++) {
                                            const chain = chainable.list[i];
                                            const next = chainable.list[i + 1];
                                            const previous = chainable.list[i - 1];
                                            if (flex.enabled) {
                                                if (chain.linear[TL] === node.box[TL] && chain.linear[BR] === node.box[BR]) {
                                                    this.setAlignParent(chain, orientationInverse);
                                                }
                                                const nextLevel = connected[level + 1];
                                                if (nextLevel && nextLevel.constraint[value] && nextLevel.constraint[value].list[i] != null) {
                                                    const nextChain = nextLevel.constraint[value].list[i];
                                                    if (chain.withinY(nextChain.linear)) {
                                                        chain.anchor(LAYOUT['bottomTop'], nextChain.stringId);
                                                        if (!mapParent(chain, 'bottom')) {
                                                            mapDelete(chain, 'bottom');
                                                        }
                                                    }
                                                }
                                            }
                                            else {
                                                if (verticalPerspective) {
                                                    if (mapParent(chain, 'right') && chain.app(LAYOUT['leftRight']) != null) {
                                                        mapDelete(chain, 'right');
                                                    }
                                                    if (chain !== first) {
                                                        if (chain.app(LAYOUT['left']) != null || chain.app(LAYOUT['right']) != null) {
                                                            mapDelete(chain, 'leftRight', 'rightLeft');
                                                            delete chain.constraint.marginHorizontal;
                                                        }
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
                                                    chain.android(`layout_${dimension}`, '0px');
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
                                                        mapDelete(chain, 'top', 'bottom');
                                                        chainable.list.forEach(item => {
                                                            if (item.app(map['top']) === chain.stringId) {
                                                                mapDelete(item, 'top');
                                                            }
                                                            if (item.app(map['bottom']) === chain.stringId) {
                                                                mapDelete(item, 'bottom');
                                                            }
                                                        });
                                                        chain.constraint.vertical = true;
                                                        break;
                                                    case 'center':
                                                    case 'stretch':
                                                        if (chain.flex.alignSelf !== 'center') {
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
                                        first.app(LAYOUT[LT], 'parent');
                                        first.constraint[orientation] = true;
                                        last.app(LAYOUT[RB], 'parent');
                                        last.constraint[orientation] = true;
                                        const chainStyle = `layout_constraint${HV}_chainStyle`;
                                        if (flex.enabled && flex.justifyContent !== 'normal' && Math.max.apply(null, chainable.list.map(item => item.flex.grow)) === 0) {
                                            switch (flex.justifyContent) {
                                                case 'space-between':
                                                    first.app(chainStyle, 'spread_inside');
                                                    break;
                                                case 'space-evenly':
                                                    first.app(chainStyle, 'spread');
                                                    chainable.list.forEach(item => item.app(`layout_constraint${HV}_weight`, (item.flex.grow || 1).toString()));
                                                    break;
                                                case 'space-around':
                                                    const leftTop = (index === 0 ? 'left' : 'top');
                                                    const percent = (first.linear[leftTop] - node.box[leftTop]) / node.box[dimension];
                                                    first.app(`layout_constraint${HV}_chainStyle`, 'spread_inside');
                                                    first.constraint[orientation] = false;
                                                    last.constraint[orientation] = false;
                                                    this.addGuideline(node, first, orientation, false, parseFloat(percent.toFixed(2)));
                                                    this.addGuideline(node, last, orientation, true, parseFloat((1 - percent).toFixed(2)));
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
                                            }
                                            chainable.list.forEach(item => delete item.constraint.marginHorizontal);
                                        }
                                        else {
                                            if ((orientation === 'horizontal' && withinFraction(node.box.left, first.linear.left) && withinFraction(last.linear.right, node.box.right)) || (orientation === 'vertical' && withinFraction(node.box.top, first.linear.top) && withinFraction(last.linear.bottom, node.box.bottom))) {
                                                if (chainable.length > 2 || flex.enabled) {
                                                    first.app(chainStyle, 'spread_inside');
                                                }
                                                else {
                                                    mapDelete(first, CHAIN_MAP['rightLeftBottomTop'][index]);
                                                    mapDelete(last, CHAIN_MAP['leftRightTopBottom'][index]);
                                                }
                                            }
                                            else if ((maxOffset <= SETTINGS[`chainPacked${HV}Offset`] || node.flex.wrap !== 'nowrap') || (orientation === 'horizontal' && (first.linear.left === node.box.left || last.linear.right === node.box.right))) {
                                                first.app(chainStyle, 'packed');
                                                let bias = '';
                                                if (withinFraction(node.box.left, first.linear.left)) {
                                                    bias = '0';
                                                }
                                                else if (withinFraction(last.linear.right, node.box.right)) {
                                                    bias = '1';
                                                }
                                                else {
                                                    bias = first[`${orientation}Bias`];
                                                }
                                                first.app(`layout_constraint${HV}_bias`, bias);
                                            }
                                            else {
                                                first.app(chainStyle, 'spread');
                                            }
                                            if (!flex.enabled) {
                                                chainable.list.forEach(inner => {
                                                    pageflow.list.forEach(outer => {
                                                        const horizontal = outer.constraint.horizontalChain;
                                                        const vertical = outer.constraint.verticalChain;
                                                        if (horizontal.length > 0 && horizontal.find(inner.id) != null) {
                                                            horizontal.clear();
                                                        }
                                                        if (vertical.length > 0 && vertical.find(inner.id) != null) {
                                                            vertical.clear();
                                                        }
                                                    });
                                                });
                                            }
                                        }
                                    }
                                    else if (chainable.length > 0) {
                                        const first = chainable.first;
                                        if (mapParent(first, 'left')) {
                                            mapDelete(first, 'rightLeft');
                                        }
                                        if (mapParent(first, 'right')) {
                                            mapDelete(first, 'leftRight');
                                            delete first.constraint.marginHorizontal;
                                        }
                                    }
                                });
                            }
                        });
                    }
                    if (flex.enabled) {
                        if (flex.wrap !== 'nowrap') {
                            ['topBottom', 'bottomTop'].forEach((value, index) => {
                                pageflow.list.forEach(current => {
                                    if (mapParent(current, (index === 0 ? 'bottom' : 'top'))) {
                                        const chain = [current];
                                        let valid = false;
                                        let adjacent = current;
                                        while (adjacent != null) {
                                            const topBottom = adjacent.app(LAYOUT[value]);
                                            if (topBottom != null) {
                                                adjacent = pageflow.findByNodeId(stripId(topBottom));
                                                if (adjacent != null && current.withinY(adjacent.linear)) {
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
                                            chain.forEach(item => {
                                                pageflow.list.some(next => {
                                                    if (item !== next && next.linear.top === item.linear.top && next.linear.bottom === item.linear.bottom) {
                                                        mapDelete(item, 'topBottom', 'bottomTop');
                                                        item.app(LAYOUT['top'], next.stringId);
                                                        item.app(LAYOUT['bottom'], next.stringId);
                                                        return true;
                                                    }
                                                    return false;
                                                });
                                            });
                                        }
                                    }
                                });
                            });
                        }
                    }
                    else {
                        function deleteConstraints(item, stringId = '') {
                            const namespace = (constraint ? 'app' : 'android');
                            for (const attr in LAYOUT) {
                                const value = item[namespace](LAYOUT[attr]);
                                if (value !== 'parent' && (stringId === '' || value === stringId)) {
                                    item.delete(namespace, LAYOUT[attr]);
                                }
                            }
                            item.constraint.horizontal = (mapParent(item, 'left') || mapParent(item, 'right'));
                            item.constraint.vertical = (mapParent(item, 'top') || mapParent(item, 'bottom'));
                        }
                        if (constraint) {
                            pageflow.list.forEach(current => {
                                [['top', 'bottom', 'topBottom'], ['bottom', 'top', 'bottomTop']].forEach(direction => {
                                    if (mapParent(current, direction[1]) && current.app(LAYOUT[direction[2]]) == null) {
                                        ['leftRight', 'rightLeft'].forEach(value => {
                                            const stringId = current.app(LAYOUT[value]);
                                            if (stringId != null) {
                                                const aligned = pageflow.list.find(item => item.stringId === stringId);
                                                if (aligned != null && aligned.app(LAYOUT[direction[2]]) != null) {
                                                    if (withinFraction(current.linear[direction[0]], aligned.linear[direction[0]])) {
                                                        current.app(LAYOUT[direction[0]], aligned.stringId, true);
                                                    }
                                                    if (withinFraction(current.linear[direction[1]], aligned.linear[direction[1]])) {
                                                        current.app(LAYOUT[direction[1]], aligned.stringId, true);
                                                    }
                                                }
                                            }
                                        });
                                    }
                                });
                            });
                            const unbound = nodes.list.filter(current => !current.anchored && (mapParent(current, 'top') || mapParent(current, 'right') || mapParent(current, 'bottom') || mapParent(current, 'left')));
                            if (anchors.length === 0 && unbound.length === 0) {
                                unbound.push(sortAsc(nodes.list.slice(), 'linear.left', 'linear.top')[0]);
                            }
                            unbound.forEach(current => {
                                if (SETTINGS.useConstraintGuideline) {
                                    this.addGuideline(node, current);
                                }
                                else {
                                    this.setAlignParent(current, '', true);
                                }
                            });
                            const adjacent = nodes.anchors[0];
                            nodes.list.filter(current => !current.anchored).forEach(opposite => {
                                deleteConstraints(opposite);
                                nodes.anchors.forEach(item => deleteConstraints(item, opposite.stringId));
                                if (SETTINGS.useConstraintGuideline) {
                                    this.addGuideline(node, opposite);
                                }
                                else if (adjacent != null) {
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
                                    opposite.app('layout_constraintCircleRadius', formatDimen(`${opposite.tagName}`, 'constraintcircleradius', formatPX(radius)));
                                    opposite.app('layout_constraintCircleAngle', degrees.toString());
                                    opposite.constraint.horizontal = true;
                                    opposite.constraint.vertical = true;
                                }
                            });
                            nodes.list.forEach(current => {
                                if (mapParent(current, 'right') && !mapParent(current, 'left') && current.app(LAYOUT['leftRight']) == null) {
                                    node.constraint.layoutWidth = true;
                                }
                                if (mapParent(current, 'bottom') && !mapParent(current, 'top') && current.app(LAYOUT['topBottom']) == null) {
                                    node.constraint.layoutHeight = true;
                                }
                            });
                        }
                        else {
                            nodes.list.forEach(current => {
                                if (!anchors.includes(current)) {
                                    deleteConstraints(current);
                                    if (!current.constraint.horizontal) {
                                        const left = formatPX(Math.max(0, current.linear.left - node.box.left));
                                        if (left !== '0px') {
                                            current.css(parseRTL('marginLeft'), left);
                                            current.android(parseRTL('layout_marginLeft'), left);
                                        }
                                        current.android(parseRTL('layout_alignParentLeft'), 'true');
                                        current.constraint.horizontal = true;
                                    }
                                    if (!current.constraint.vertical) {
                                        const top = formatPX(Math.max(0, current.linear.top - node.box.top));
                                        if (top !== '0px') {
                                            current.css('marginTop', top);
                                            current.android('layout_marginTop', top);
                                        }
                                        current.android('layout_alignParentTop', 'true');
                                        current.constraint.vertical = true;
                                    }
                                }
                                if (mapParent(current, 'right') && current.android(LAYOUT['leftRight']) == null) {
                                    node.constraint.layoutWidth = true;
                                }
                                if (mapParent(current, 'bottom') && current.android(LAYOUT['topBottom']) == null) {
                                    node.constraint.layoutHeight = true;
                                }
                            });
                        }
                    }
                    pageflow.list.forEach(current => {
                        if (current.constraint.marginHorizontal != null) {
                            const item = this.findByAndroidId(current.constraint.marginHorizontal);
                            if (item != null) {
                                const offset = current.linear.left - item.linear.right;
                                if (offset >= 1) {
                                    current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + offset, true);
                                }
                            }
                        }
                        if (current.constraint.marginVertical != null) {
                            const item = this.findByAndroidId(current.constraint.marginVertical);
                            if (item != null) {
                                const offset = current.linear.top - item.linear.bottom;
                                if (offset >= 1) {
                                    current.modifyBox(BOX_STANDARD.MARGIN_TOP, current.marginTop + offset, true);
                                }
                            }
                        }
                    });
                }
            });
        }
        adjustBoxSpacing(data) {
            data.cache.forEach(node => {
                if (node.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP)) {
                    switch (node.android('orientation')) {
                        case 'horizontal':
                            let left = node.box.left;
                            sortAsc(node.renderChildren, 'linear.left').forEach((item, index) => {
                                let valid = true;
                                if (index === 0) {
                                    const gravity = node.android('gravity');
                                    if (gravity != null || gravity !== parseRTL('left')) {
                                        valid = false;
                                    }
                                }
                                if (valid && !item.floating) {
                                    const width = Math.ceil(item.linear.left - left);
                                    if (width >= 1) {
                                        item.modifyBox(BOX_STANDARD.MARGIN_LEFT, item.marginLeft + width, true);
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
                                    item.modifyBox(BOX_STANDARD.MARGIN_TOP, item.marginTop + height, true);
                                }
                                top = item.linear.bottom;
                            });
                            break;
                    }
                }
            });
        }
        renderGroup(node, parent, viewName, options) {
            const target = hasValue(node.dataset.target);
            let preXml = '';
            let postXml = '';
            let renderParent = parent;
            if (typeof viewName === 'number') {
                viewName = View.getViewName(viewName);
            }
            switch (viewName) {
                case NODE_ANDROID.LINEAR:
                    options = { android: { orientation: (options && options.vertical ? 'vertical' : 'horizontal') } };
                    break;
                case NODE_ANDROID.GRID:
                    options = { android: { columnCount: (options && options.columns ? options.columns.toString() : '2'), rowCount: (options && options.rows > 0 ? options.rows.toString() : '') } };
                    break;
                default:
                    options = {};
            }
            node.setNodeId(viewName);
            if (node.overflow !== 0 /* NONE */) {
                const scrollView = [];
                if (node.overflowX) {
                    scrollView.push(NODE_ANDROID.SCROLL_HORIZONTAL);
                }
                if (node.overflowY) {
                    scrollView.push((node.ascend().some(item => item.overflow !== 0 /* NONE */) ? NODE_ANDROID.SCROLL_NESTED : NODE_ANDROID.SCROLL_VERTICAL));
                }
                let current = node;
                let scrollDepth = parent.renderDepth + scrollView.length;
                scrollView
                    .map(scrollName => {
                    const viewGroup = new ViewGroup(this.cache.nextId, current, null, [current]);
                    const view = viewGroup;
                    viewGroup.setNodeId(scrollName);
                    viewGroup.setBounds();
                    current.inherit(viewGroup, 'data');
                    viewGroup.android('fadeScrollbars', 'false');
                    this.cache.list.push(view);
                    switch (scrollName) {
                        case NODE_ANDROID.SCROLL_HORIZONTAL:
                            viewGroup.css('width', node.styleMap.width);
                            viewGroup.css('minWidth', node.styleMap.minWidth);
                            viewGroup.css('overflowX', node.styleMap.overflowX);
                            break;
                        default:
                            viewGroup.css('height', node.styleMap.height);
                            viewGroup.css('minHeight', node.styleMap.minHeight);
                            viewGroup.css('overflowY', node.styleMap.overflowY);
                    }
                    const indent = repeat(scrollDepth--);
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
            node.render((target ? node : renderParent));
            return this.getEnclosingTag((target || hasValue(parent.dataset.target) ? -1 : node.renderDepth), viewName, node.id, `{:${node.id}}`, preXml, postXml);
        }
        renderNode(node, parent, nodeName, recursive = false) {
            const element = node.element;
            const target = hasValue(node.dataset.target);
            if (typeof nodeName === 'number') {
                nodeName = View.getViewName(nodeName);
            }
            node.setNodeId(nodeName);
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
                                const result = node.documentParent.children.filter(item => item.element.type === 'radio' && item.element.name === element.name);
                                let xml = '';
                                if (result.length > 1) {
                                    const viewGroup = new ViewGroup(this.cache.nextId, node, parent, result);
                                    const view = viewGroup;
                                    let checked = '';
                                    this.cache.list.push(view);
                                    viewGroup.setNodeId(NODE_ANDROID.RADIO_GROUP);
                                    viewGroup.render(parent);
                                    result.forEach(item => {
                                        item.inherit(viewGroup, 'data');
                                        if (item.element.checked) {
                                            checked = item.stringId;
                                        }
                                        item.parent = viewGroup;
                                        item.render(viewGroup);
                                        xml += this.renderNode(item, view, NODE_STANDARD.RADIO, true);
                                    });
                                    viewGroup.android('orientation', NodeList.linearX(viewGroup.children) ? 'horizontal' : 'vertical');
                                    if (checked !== '') {
                                        viewGroup.android('checkedButton', checked);
                                    }
                                    viewGroup.setBounds();
                                    return this.getEnclosingTag(viewGroup.renderDepth, NODE_ANDROID.RADIO_GROUP, viewGroup.id, xml);
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
            switch (node.nodeName) {
                case NODE_ANDROID.TEXT:
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
            node.render((target ? node : parent));
            if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.ACCESSIBILITY)) {
                node.setAccessibility();
            }
            node.cascade().forEach(item => item.hide());
            return this.getEnclosingTag((target || hasValue(parent.dataset.target) ? -1 : node.renderDepth), node.nodeName, node.id);
        }
        renderNodeStatic(tagName, depth, options = {}, width = '', height = '', node = null, children = false) {
            let minimal = false;
            if (node == null) {
                node = new View(0, SETTINGS.targetAPI);
                minimal = true;
            }
            const renderDepth = Math.max(0, depth);
            const viewName = (typeof tagName === 'number' ? View.getViewName(tagName) : tagName);
            tagName = (node.hasElement ? node.tagName : viewName);
            node.setNodeId(viewName);
            if (hasValue(width)) {
                if (!isNaN(parseInt(width))) {
                    width = formatDimen(tagName, 'width', width);
                }
                node.android('layout_width', width);
            }
            if (hasValue(height)) {
                if (!isNaN(parseInt(height))) {
                    height = formatDimen(tagName, 'height', height);
                }
                node.android('layout_height', height);
            }
            node.renderDepth = renderDepth;
            if (options != null) {
                node.apply(formatResource(options));
            }
            let output = this.getEnclosingTag((depth === 0 && minimal ? -1 : depth), viewName, node.id, (children ? `{:${node.id}}` : ''));
            if (SETTINGS.showAttributes && node.id === 0) {
                const indent = repeat(renderDepth + 1);
                const attributes = node.combine().map(value => `\n${indent + value}`).join('');
                output = output.replace(`{@${node.id}}`, attributes);
            }
            options.stringId = node.stringId;
            return output;
        }
        createGroup(node, parent, children) {
            const group = new ViewGroup(this.cache.nextId, node, parent, children);
            children.forEach(item => {
                item.parent = group;
                item.inherit(group, 'data');
            });
            group.setBounds();
            this.cache.list.push(group);
            return group;
        }
        setAttributes(data) {
            const cache = data.cache.filter(node => node.visible).map(node => ({ pattern: `{@${node.id}}`, attributes: this.parseAttributes(node) }));
            [...data.views, ...data.includes].forEach(view => {
                cache.forEach(item => view.content = view.content.replace(item.pattern, item.attributes));
                view.content = view.content.replace(`{#0}`, this.getRootNamespace(view.content));
            });
        }
        insertAttributes(output, node) {
            return output.replace(`{@${node.id}}`, this.parseAttributes(node));
        }
        setDimensions(data) {
            function addToGroup(tagName, node, dimen, attr, value) {
                const group = groups[tagName];
                let name = dimen;
                if (arguments.length === 5) {
                    if (value && /(px|dp|sp)$/.test(value)) {
                        name = `${dimen}-${attr}-${value}`;
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
            data.cache.filter(node => node.visible).forEach(node => {
                node.mergeBoxSpacing();
                if (SETTINGS.dimensResourceValue) {
                    const tagName = node.tagName.toLowerCase();
                    if (groups[tagName] == null) {
                        groups[tagName] = {};
                    }
                    for (const key of Object.keys(BOX_STANDARD)) {
                        const result = node.boxValue(parseInt(key));
                        if (result[0] !== '' && result[1] !== '0px') {
                            const name = `${BOX_STANDARD[key].toLowerCase()}-${result[0]}-${result[1]}`;
                            addToGroup(tagName, node, name);
                        }
                    }
                    ['android:layout_width:width', 'android:layout_height:height', 'android:minWidth:minwidth', 'android:minHeight:minheight', 'app:layout_constraintWidth_min:constraintwidth_min', 'app:layout_constraintHeight_min:constraintheight_min'].forEach(value => {
                        const [namespace, attr, dimen] = value.split(':');
                        addToGroup(tagName, node, dimen, attr, node[namespace](attr));
                    });
                }
            });
            if (SETTINGS.dimensResourceValue) {
                const resource = Resource.STORED.DIMENS;
                for (const tagName in groups) {
                    const group = groups[tagName];
                    for (const name in group) {
                        const [dimen, attr, value] = name.split('-');
                        const key = this.getDimenResourceKey(resource, `${tagName}_${parseRTL(dimen)}`, value);
                        group[name].forEach(node => node[(attr.indexOf('constraint') !== -1 ? 'app' : 'android')](attr, `@dimen/${key}`));
                        resource.set(key, value);
                    }
                }
            }
        }
        parseDimensions(content) {
            const resource = Resource.STORED.DIMENS;
            const pattern = /\s+\w+:\w+="({%(\w+)-(\w+)-(\w+)})"/g;
            let match;
            while ((match = pattern.exec(content)) != null) {
                const key = this.getDimenResourceKey(resource, `${match[2]}_${parseRTL(match[3])}`, match[4]);
                resource.set(key, match[4]);
                content = content.replace(new RegExp(match[1], 'g'), `@dimen/${key}`);
            }
            return content;
        }
        addXmlNs(name, uri) {
            XMLNS_ANDROID[name] = uri;
        }
        parseAttributes(node) {
            const attributes = node.combine();
            const indent = repeat(node.renderDepth + 1);
            const output = attributes.map((value) => `\n${indent + value}`).join('');
            return output;
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
        getDimenResourceKey(resource, key, value) {
            if (resource.has(key) && resource.get(key) !== value) {
                key = generateId('dimens', `${key}_1`);
            }
            return key;
        }
        setAlignParent(node, orientation = '', bias = false) {
            const map = LAYOUT_MAP.constraint;
            ['horizontal', 'vertical'].forEach((value, index) => {
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
        partitionChain(nodes, node, coordinate, connected) {
            const result = coordinate.map(value => {
                const chained = new Set();
                chained.add(node);
                const sameY = nodes.list.filter(item => same(node, item, value));
                let valid;
                do {
                    valid = false;
                    Array.from(chained).some(item => {
                        return sameY.some(adjacent => {
                            if (!chained.has(adjacent) && (adjacent.app(connected[0]) === item.stringId || adjacent.app(connected[1]) === item.stringId)) {
                                chained.add(adjacent);
                                valid = true;
                                return true;
                            }
                            return false;
                        });
                    });
                } while (valid);
                return Array.from(chained);
            }).reduce((a, b) => a.length >= b.length ? a : b);
            return result;
        }
        addGuideline(parent, node, orientation = '', opposite = false, percent = -1) {
            const map = LAYOUT_MAP.constraint;
            const beginPercent = `layout_constraintGuide_${(percent !== -1 ? 'percent' : 'begin')}`;
            ['horizontal', 'vertical'].forEach((value, index) => {
                if (!node.constraint[value] && (orientation === '' || value === orientation)) {
                    const position = (index === 0 ? 'left' : 'top');
                    const options = {
                        android: {
                            orientation: (index === 0 ? 'vertical' : 'horizontal')
                        },
                        app: {
                            [beginPercent]: (percent !== -1 ? percent : formatDimen(node.tagName, 'constraintguide_begin', formatPX(Math.max(node.linear[position] - parent.box[position], 0))))
                        }
                    };
                    const LRTB = (index === 0 ? (!opposite ? 'left' : 'right') : (!opposite ? 'top' : 'bottom'));
                    const RLBT = (index === 0 ? (!opposite ? 'right' : 'left') : (!opposite ? 'bottom' : 'top'));
                    const xml = this.renderNodeStatic(NODE_ANDROID.GUIDELINE, node.renderDepth, options, 'wrap_content', 'wrap_content');
                    this.appendAfter(node.id, xml);
                    node.app(map[LRTB], options.stringId);
                    node.delete('app', map[RLBT]);
                    node.constraint[value] = true;
                }
            });
        }
        findByAndroidId(id) {
            return this.cache.list.find(node => node.android('id') === id);
        }
        get inlineExclude() {
            return WEBVIEW_ANDROID;
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
        STRINGS: new Map(),
        ARRAYS: new Map(),
        FONTS: new Map(),
        COLORS: new Map(),
        STYLES: new Map(),
        DIMENS: new Map(),
        DRAWABLES: new Map(),
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
            STORED.STYLES = new Map();
            STORED.DRAWABLES = new Map();
            Object.assign(STORED, Resource.STORED);
            this.file.reset();
            this.tagStyle = {};
            this.tagCount = {};
        }
        setBoxSpacing() {
            super.setBoxSpacing();
            this.cache.elements.forEach(node => {
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.BOX_SPACING)) {
                    const stored = node.element.__boxSpacing;
                    if (stored != null) {
                        const method = METHOD_ANDROID['boxSpacing'];
                        for (const i in stored) {
                            node.attr(formatString(parseRTL(method[i]), stored[i]), (node.renderExtension == null));
                        }
                    }
                }
            });
        }
        setBoxStyle() {
            super.setBoxStyle();
            this.cache.elements.forEach(node => {
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.BOX_STYLE)) {
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
                            let template = null;
                            let data;
                            let resourceName = '';
                            if (stored.border != null) {
                                if (stored.backgroundImage === '') {
                                    template = parseTemplate(SHAPERECTANGLE_TMPL);
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
                                        const shape = getTemplateLevel(data, '0', '2');
                                        const borderRadius = this.getShapeAttribute(stored, 'radiusAll');
                                        shape['5'].push(borderRadius);
                                    }
                                }
                                else if (stored.backgroundImage !== '' && (stored.border.style === 'none' || stored.border.size === '0px')) {
                                    resourceName = stored.backgroundImage;
                                }
                                else {
                                    template = parseTemplate(LAYERLIST_TMPL);
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
                                        const shape = getTemplateLevel(data, '0', '1');
                                        const borderRadius = this.getShapeAttribute(stored, 'radiusAll');
                                        shape['5'].push(borderRadius);
                                    }
                                }
                            }
                            else {
                                template = parseTemplate(LAYERLIST_TMPL);
                                data = {
                                    '0': [{
                                            '1': [],
                                            '6': (stored.backgroundImage !== '' ? [{ image: stored.backgroundImage, width: stored.backgroundSize[0], height: stored.backgroundSize[1] }] : false)
                                        }]
                                };
                                const root = getTemplateLevel(data, '0');
                                const borders = [stored.borderTop, stored.borderRight, stored.borderBottom, stored.borderLeft];
                                let valid = true;
                                let width = '';
                                let borderStyle = '';
                                let radius = '';
                                borders.some((item, index) => {
                                    if (this.borderVisible(item)) {
                                        if (width !== '' && width !== item.width && borderStyle !== '' && borderStyle !== this.getBorderStyle(item) && radius !== '' && radius !== stored.borderRadius[index]) {
                                            valid = false;
                                            return false;
                                        }
                                        [width, borderStyle, radius] = [item.width, this.getBorderStyle(item), stored.borderRadius[index]];
                                    }
                                    return true;
                                });
                                const borderRadius = {};
                                if (stored.borderRadius.length > 1) {
                                    Object.assign(borderRadius, {
                                        topLeftRadius: stored.borderRadius[0],
                                        topRightRadius: stored.borderRadius[1],
                                        bottomRightRadius: stored.borderRadius[2],
                                        bottomLeftRadius: stored.borderRadius[3]
                                    });
                                }
                                if (valid) {
                                    const hideWidth = `-${formatPX(parseInt(width) * 2)}`;
                                    const layerList = {
                                        'top': (this.borderVisible(stored.borderTop) ? '' : hideWidth),
                                        'right': (this.borderVisible(stored.borderRight) ? '' : hideWidth),
                                        'bottom': (this.borderVisible(stored.borderBottom) ? '' : hideWidth),
                                        'left': (this.borderVisible(stored.borderLeft) ? '' : hideWidth),
                                        '2': [{ width, borderStyle }],
                                        '3': this.getShapeAttribute(stored, 'backgroundColor'),
                                        '4': this.getShapeAttribute(stored, 'radius'),
                                        '5': this.getShapeAttribute(stored, 'radiusInit')
                                    };
                                    if (stored.borderRadius.length > 1) {
                                        layerList['5'].push(borderRadius);
                                    }
                                    root['1'].push(layerList);
                                }
                                else {
                                    borders.forEach((item, index) => {
                                        if (this.borderVisible(item)) {
                                            const hideWidth = `-${item.width}`;
                                            const layerList = {
                                                'top': hideWidth,
                                                'right': hideWidth,
                                                'bottom': hideWidth,
                                                'left': hideWidth,
                                                '2': [{ width: item.width, borderStyle: this.getBorderStyle(item) }],
                                                '3': this.getShapeAttribute(stored, 'backgroundColor'),
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
                                }
                                if (root['1'].length === 0) {
                                    root['1'] = false;
                                }
                            }
                            if (template != null) {
                                const xml = insertTemplateData(template, data);
                                for (const [name, value] of STORED.DRAWABLES.entries()) {
                                    if (value === xml) {
                                        resourceName = name;
                                        break;
                                    }
                                }
                                if (resourceName === '') {
                                    resourceName = `${node.tagName.toLowerCase()}_${node.nodeId}`;
                                    STORED.DRAWABLES.set(resourceName, xml);
                                }
                            }
                            node.attr(formatString(method['background'], resourceName), (node.renderExtension == null));
                        }
                        else if (object.__fontStyle == null && stored.backgroundColor.length > 0) {
                            node.attr(formatString(method['backgroundColor'], stored.backgroundColor[0]), (node.renderExtension == null));
                        }
                    }
                }
            });
        }
        setFontStyle() {
            super.setFontStyle();
            const tagName = {};
            this.cache.list.forEach(node => {
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.FONT_STYLE)) {
                    if (node.element.__fontStyle != null) {
                        if (tagName[node.tagName] == null) {
                            tagName[node.tagName] = [];
                        }
                        tagName[node.tagName].push(node);
                    }
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
                        let fontFamily = stored.fontFamily.toLowerCase().split(',')[0].replace(/"/g, '').trim();
                        let fontStyle = '';
                        let fontWeight = '';
                        if (SETTINGS.useFontAlias && FONTREPLACE_ANDROID[fontFamily] != null) {
                            fontFamily = FONTREPLACE_ANDROID[fontFamily];
                        }
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
                            fontFamily = convertWord(fontFamily);
                            stored.fontFamily = `@font/${fontFamily + (stored.fontStyle !== 'normal' ? `_${stored.fontStyle}` : '') + (stored.fontWeight !== '400' ? `_${FONTWEIGHT_ANDROID[stored.fontWeight] || stored.fontWeight}` : '')}`;
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
                            if (node.supported('android', keys[i])) {
                                const attr = formatString(method[keys[i]], value);
                                if (sorted[i][attr] == null) {
                                    sorted[i][attr] = [];
                                }
                                sorted[i][attr].push(nodeId);
                            }
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
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.IMAGE_SOURCE)) {
                    const object = node.element;
                    const stored = object.__imageSource;
                    if (stored != null) {
                        const method = METHOD_ANDROID['imageSource'];
                        node.attr(formatString(method['src'], stored), (node.renderExtension == null));
                    }
                }
            });
        }
        setOptionArray() {
            super.setOptionArray();
            this.cache.list.filter(node => node.tagName === 'SELECT').forEach(node => {
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.OPTION_ARRAY)) {
                    const stored = node.element.__optionArray;
                    const method = METHOD_ANDROID['optionArray'];
                    let result = [];
                    if (stored.stringArray != null) {
                        result = stored.stringArray.map(value => `@string/${value}`);
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
                        arrayName = `${node.nodeId}_array`;
                        STORED.ARRAYS.set(arrayName, result);
                    }
                    node.attr(formatString(method['entries'], arrayName), (node.renderExtension == null));
                }
            });
        }
        setValueString(inlineExclude) {
            super.setValueString(inlineExclude);
            this.cache.list.forEach(node => {
                if (!includesEnum(node.excludeResource, NODE_RESOURCE.VALUE_STRING)) {
                    const element = (node.label != null ? node.label.element : node.element);
                    const stored = element.__valueString;
                    if (stored != null) {
                        const method = METHOD_ANDROID['valueString'];
                        let value = STORED.STRINGS.get(stored);
                        if (node.is(NODE_STANDARD.TEXT) && node.style != null) {
                            const match = node.style.textDecoration.match(/(underline|line-through)/);
                            if (match != null) {
                                switch (match[0]) {
                                    case 'underline':
                                        value = `<u>${value}</u>`;
                                        break;
                                    case 'line-through':
                                        value = `<strike>${value}</strike>`;
                                        break;
                                }
                                STORED.STRINGS.set(stored, value);
                            }
                        }
                        node.attr(formatString(method['text'], ((parseInt(stored) || '').toString() !== stored ? `@string/${stored}` : stored)), (node.renderExtension == null));
                    }
                }
            });
        }
        addResourceTheme(template, data, options) {
            const map = parseTemplate(template);
            if (options.item != null) {
                const root = getTemplateLevel(data, '0');
                for (const name in options.item) {
                    let value = options.item[name];
                    const hex = parseHex(value);
                    if (hex !== '') {
                        value = `@color/${Resource.addColor(hex)}`;
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
                let sorted = this.tagStyle[tag].filter(item => Object.keys(item).length > 0).sort((a, b) => {
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
                tagData.forEach((item, index) => item.name = capitalize(tagName) + (index > 0 ? `_${index}` : ''));
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
                    const indent = repeat(node.renderDepth + 1);
                    let append = '';
                    if (styles.length > 0) {
                        inherit.add(styles.join('.'));
                        append += `\n${indent + (node.nodeType >= 11 ? 'android:theme="' : 'style="')}@style/${styles.pop()}"`;
                    }
                    if (attributes.length > 0) {
                        attributes.sort().forEach((value) => append += `\n${indent}${replaceDP(value, true)}`);
                    }
                    const layouts = [...viewData.views, ...viewData.includes];
                    for (let i = 0; i < layouts.length; i++) {
                        const output = layouts[i].content;
                        const pattern = `{&${id}}`;
                        if (output.indexOf(pattern) !== -1) {
                            layouts[i].content = output.replace(pattern, append);
                            break;
                        }
                    }
                }
            }
            for (const styles of inherit) {
                let parent = '';
                styles.split('.').forEach(value => {
                    const match = value.match(/^(\w*?)(?:_([0-9]+))?$/);
                    if (match != null) {
                        const tagData = resource[match[1].toUpperCase()][(match[2] == null ? 0 : parseInt(match[2]))];
                        STORED.STYLES.set(value, { parent, attributes: tagData.attributes });
                        parent = value;
                    }
                });
            }
        }
        deleteStyleAttribute(sorted, attributes, ids) {
            attributes.split(';').forEach(value => {
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
            this.stored.STRINGS = new Map([...this.stored.STRINGS.entries()].sort(caseInsensitve));
            let xml = '';
            if (this.stored.STRINGS.size > 0) {
                const template = parseTemplate(STRING_TMPL);
                const data = {
                    '0': [{
                            '1': []
                        }]
                };
                const root = getTemplateLevel(data, '0');
                if (hasValue(this.appName) && !this.stored.STRINGS.has('app_name')) {
                    root['1'].push({ name: 'app_name', value: this.appName });
                }
                for (const [name, value] of this.stored.STRINGS.entries()) {
                    root['1'].push({ name, value });
                }
                xml = insertTemplateData(template, data);
                xml = replaceTab(xml, true);
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
                xml = replaceTab(xml, true);
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
                            font: `@font/${name + (style === 'normal' && weight === '400' ? `_${style}` : (style !== 'normal' ? `_${style}` : '') + (weight !== '400' ? `_${FONTWEIGHT_ANDROID[weight] || weight}` : ''))}`
                        });
                    }
                    xml += '\n\n' + insertTemplateData(template, data);
                }
                xml = replaceTab(xml);
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
                xml = replaceTab(xml);
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
                xml = replaceDP(xml, true);
                xml = replaceTab(xml);
                if (saveToDisk) {
                    this.saveToDisk(this.parseFileDetails(xml));
                }
            }
            return xml;
        }
        resourceDimenToXml(saveToDisk = false) {
            this.stored.DIMENS = new Map([...this.stored.DIMENS.entries()].sort());
            let xml = '';
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
                xml = replaceDP(xml);
                xml = replaceTab(xml);
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
                xml = replaceDP(xml);
                xml = replaceTab(xml);
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

    class Custom extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
            this.require(EXT_NAME.EXTERNAL, true);
        }
        processNode() {
            const node = this.node;
            const parent = this.parent;
            const controller = this.application.controllerHandler;
            const data = this.getData();
            let xml = '';
            if (data.tag) {
                if (node.children.length > 0) {
                    xml = controller.renderGroup(node, parent, data.tag);
                }
                else {
                    xml = controller.renderNode(node, parent, data.tag);
                }
            }
            if (data.tagChild) {
                node.children.forEach(item => {
                    const element = item.element;
                    element.dataset.ext = this.name;
                    element.dataset.andromeCustomTag = data.tagChild;
                });
            }
            return { xml };
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
            return (super.condition() &&
                (this.node.children.every(node => node.tagName === 'LI') && this.node.children.some(node => node.css('display') === 'list-item' && node.css('listStyleType') !== 'none') && (NodeList.linearX(this.node.children) || NodeList.linearY(this.node.children))));
        }
        processNode() {
            const node = this.node;
            const parent = this.parent;
            let xml = '';
            if (NodeList.linearY(node.children)) {
                xml = this.application.writeGridLayout(node, parent, 2);
            }
            else {
                xml = this.application.writeLinearLayout(node, parent, NodeList.linearY(node.children));
            }
            for (let i = 0, j = 0; i < node.children.length; i++) {
                const item = node.children[i];
                let ordinal = '0';
                if (item.css('display') === 'list-item') {
                    const listStyle = item.css('listStyleType');
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
                            if (node.tagName === 'OL') {
                                ordinal = `${(listStyle === 'decimal-leading-zero' && j < 9 ? '0' : '') && (j + 1).toString()}.`;
                            }
                            else {
                                ordinal = '○';
                            }
                    }
                    j++;
                }
                item.data(`${EXT_NAME.LIST}:listStyle`, ordinal);
            }
            return { xml };
        }
    }

    class ListAndroid extends List {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processChild() {
            const node = this.node;
            const controller = this.application.controllerHandler;
            const listStyle = node.data(`${EXT_NAME.LIST}:listStyle`);
            if (listStyle != null) {
                controller.prependBefore(node.id, controller.renderNodeStatic((listStyle !== '0' ? NODE_STANDARD.TEXT : NODE_STANDARD.SPACE), node.depth + node.renderDepth, {
                    android: {
                        gravity: parseRTL('right'),
                        layout_gravity: 'fill',
                        layout_columnWeight: '0',
                        [parseRTL('layout_marginRight')]: formatDimen(node.tagName, parseRTL('margin_right'), '8px'),
                        text: (listStyle !== '0' ? listStyle : '')
                    }
                }, 'wrap_content', 'wrap_content'));
                node.android('layout_columnWeight', '1');
            }
            return { xml: '' };
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
                (node.dataset.ext == null && !node.flex.enabled && node.children.length > 1 && BLOCK_ELEMENT.includes(node.children[0].tagName) && node.children.some(item => item.children.length > 1) && node.children.every(item => !item.flex.enabled && node.children[0].tagName === item.tagName && NodeList.linearX(item.children))));
        }
        processNode(mapX, mapY) {
            const node = this.node;
            const parent = this.parent;
            const balanceColumns = this.options.balanceColumns;
            let xml = '';
            let columns = [];
            const gridData = {
                columnEnd: [],
                columnCount: 0,
                padding: { top: 0, right: [], bottom: 0, left: [] }
            };
            if (balanceColumns) {
                const dimensions = [];
                for (let l = 0; l < node.children.length; l++) {
                    const children = node.children[l].children;
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
                                    columns[m][assigned[m] + (every ? 1 : 0)].data(`${EXT_NAME.GRID}:gridSiblings`, [...removed]);
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
                                        columns[m][assigned[m] + (every ? 1 : 0)].data(`${EXT_NAME.GRID}:gridSiblings`, [...removed]);
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
                        const nextAxisX = sortAsc(nextMapX[parseInt(nextCoordsX[l])].filter(item => item.parent.parent && item.parent.parent.id === node.id), 'linear.top');
                        columnRight[l] = (l === 0 ? 0 : columnRight[l - 1]);
                        for (let m = 0; m < nextAxisX.length; m++) {
                            const nextX = nextAxisX[m];
                            let [left, right] = [nextX.linear.left, nextX.linear.right];
                            let index = l;
                            if (index > 0 && nextX.css('float') === 'right') {
                                const style = nextX.element.style;
                                style.float = 'left';
                                const bounds = nextX.element.getBoundingClientRect();
                                if (left !== (bounds.left - node.marginLeft)) {
                                    [left, right] = [bounds.left - node.marginLeft, bounds.right + node.marginRight];
                                    for (let n = 1; n < columnRight.length; n++) {
                                        index = n;
                                        if (left > columnRight[n - 1]) {
                                            break;
                                        }
                                    }
                                }
                                style.float = 'right';
                            }
                            function findRowIndex() {
                                return columns[0].findIndex(item => withinFraction(item.linear.top, nextX.linear.top) || (nextX.linear.top >= item.linear.top && nextX.linear.bottom <= item.linear.bottom));
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
                                const minLeft = columns[current].reduce((a, b) => Math.min(a, b.linear.left), Number.MAX_VALUE);
                                const maxRight = columns[current].reduce((a, b) => Math.max(a, b.linear.right), 0);
                                if (left > minLeft && right > maxRight) {
                                    const filtered = columns.filter(item => item);
                                    const row = findRowIndex();
                                    if (row !== -1 && filtered[filtered.length - 1][row] == null) {
                                        columns[current] = null;
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
                    columns = columns.filter(item => item);
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
                    gridData.columnEnd = columnEnd;
                    gridData.columnEnd[gridData.columnEnd.length - 1] = node.box.right;
                }
            }
            if (columns.length > 1) {
                gridData.columnCount = (balanceColumns ? columns[0].length : columns.length);
                xml = this.application.writeGridLayout(node, parent, gridData.columnCount);
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
                            if (balanceColumns) {
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
                            item.data(`${EXT_NAME.GRID}:gridCellData`, data);
                        }
                        else if (item.spacer === 1) {
                            spacer++;
                        }
                    }
                }
                node.data(`${EXT_NAME.GRID}:gridData`, gridData);
                node.render(parent);
            }
            return { xml };
        }
        processChild() {
            const node = this.node;
            const parent = this.parent;
            let xml = '';
            const gridData = parent.data(`${EXT_NAME.GRID}:gridData`);
            const gridCellData = node.data(`${EXT_NAME.GRID}:gridCellData`);
            if (gridData != null && gridCellData != null) {
                let siblings;
                if (this.options.balanceColumns) {
                    siblings = node.data(`${EXT_NAME.GRID}:gridSiblings`);
                }
                else {
                    const columnEnd = gridData.columnEnd[Math.min(gridCellData.index + (gridCellData.columnSpan - 1), gridData.columnEnd.length - 1)];
                    siblings = node.documentParent.children.filter(item => !item.renderParent && item.linear.left >= node.linear.right && item.linear.right <= columnEnd);
                }
                if (siblings != null && siblings.length > 0) {
                    siblings.unshift(node);
                    sortAsc(siblings, 'linear.left');
                    const viewGroup = this.application.controllerHandler.createGroup(node, parent, siblings);
                    const [linearX, linearY] = [NodeList.linearX(siblings), NodeList.linearY(siblings)];
                    if (linearX || linearY) {
                        xml = this.application.writeLinearLayout(viewGroup, parent, linearY);
                    }
                    else {
                        xml = this.application.writeDefaultLayout(viewGroup, parent);
                    }
                    return { xml, parent: viewGroup };
                }
            }
            return { xml };
        }
    }

    class GridAndroid extends Grid {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processChild() {
            const node = this.node;
            const data = node.data(`${EXT_NAME.GRID}:gridCellData`);
            if (data != null) {
                if (data.rowSpan > 1) {
                    node.android('layout_rowSpan', data.rowSpan.toString());
                }
                if (data.columnSpan > 1) {
                    node.android('layout_columnSpan', data.columnSpan.toString());
                }
            }
            return super.processChild();
        }
        afterRender() {
            const extended = [];
            this.application.cache.list.forEach((node) => {
                if (node.renderExtension === this) {
                    extended.push(node);
                }
                else {
                    const parent = node.renderParent;
                    if (parent instanceof View && parent.is(NODE_STANDARD.GRID)) {
                        const gridData = parent.data(`${EXT_NAME.GRID}:gridData`);
                        const gridCellData = node.data(`${EXT_NAME.GRID}:gridCellData`);
                        if (gridData != null && gridCellData != null) {
                            const dimensions = getBoxSpacing(node.documentParent.element, true);
                            if (gridCellData.cellFirst) {
                                const heightTop = convertInt(dimensions.paddingTop) + convertInt(dimensions.marginTop);
                                if (heightTop > 0) {
                                    gridData.padding.top = heightTop;
                                }
                            }
                            if (gridCellData.rowStart) {
                                const marginLeft = convertInt(dimensions.marginLeft) + convertInt(dimensions.paddingLeft);
                                if (marginLeft > 0) {
                                    gridData.padding.left.push(marginLeft);
                                }
                            }
                            if (gridCellData.rowEnd) {
                                const heightBottom = convertInt(dimensions.marginBottom) + convertInt(dimensions.paddingBottom) + (!gridCellData.cellLast ? convertInt(dimensions.marginTop) + convertInt(dimensions.paddingTop) : 0);
                                if (heightBottom > 0) {
                                    if (gridCellData.cellLast) {
                                        gridData.padding.bottom = heightBottom;
                                    }
                                    else {
                                        const controller = this.application.controllerHandler;
                                        controller.appendAfter(node.id, controller.renderNodeStatic(NODE_STANDARD.SPACE, node.renderDepth, { android: { layout_columnSpan: gridData.columnCount } }, 'match_parent', convertPX(heightBottom)));
                                    }
                                }
                                const marginRight = convertInt(dimensions.marginRight) + convertInt(dimensions.paddingRight);
                                if (marginRight > 0) {
                                    gridData.padding.right.push(marginRight);
                                }
                            }
                        }
                    }
                }
            });
            extended.forEach(node => {
                const data = node.data(`${EXT_NAME.GRID}:gridData`);
                if (data != null) {
                    if (data.padding.top > 0) {
                        node.modifyBox(BOX_STANDARD.PADDING_TOP, node.paddingTop + data.padding.top);
                    }
                    if (data.padding.right.length > 0) {
                        node.modifyBox(BOX_STANDARD.PADDING_RIGHT, node.paddingRight + averageInt(data.padding.right));
                    }
                    if (data.padding.bottom > 0) {
                        node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, node.paddingBottom + data.padding.bottom);
                    }
                    if (data.padding.left.length > 0) {
                        node.modifyBox(BOX_STANDARD.PADDING_LEFT, node.paddingLeft + averageInt(data.padding.left));
                    }
                }
            });
        }
    }

    class Table extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processNode() {
            const node = this.node;
            const tableRows = [];
            const thead = node.children.find(item => item.tagName === 'THEAD');
            const tbody = node.children.find(item => item.tagName === 'TBODY');
            const tfoot = node.children.find(item => item.tagName === 'TFOOT');
            if (thead != null) {
                thead.cascade().filter(item => item.tagName === 'TH' || item.tagName === 'TD').forEach(item => item.inherit(thead, 'styleMap'));
                tableRows.push(...thead.children);
                thead.hide();
            }
            if (tbody != null) {
                tableRows.push(...tbody.children);
                tbody.hide();
            }
            if (tfoot != null) {
                tfoot.cascade().filter(item => item.tagName === 'TH' || item.tagName === 'TD').forEach(item => item.inherit(tfoot, 'styleMap'));
                tableRows.push(...tfoot.children);
                tfoot.hide();
            }
            const rowCount = tableRows.length;
            let columnCount = 0;
            for (let i = 0; i < tableRows.length; i++) {
                const tr = tableRows[i];
                tr.hide();
                columnCount = Math.max(tr.children.map(item => item.element).reduce((a, b) => a + b.colSpan, 0), columnCount);
                for (let j = 0; j < tr.children.length; j++) {
                    const td = tr.children[j];
                    const style = td.element.style;
                    const element = td.element;
                    if (element.rowSpan > 1) {
                        td.data(`${EXT_NAME.TABLE}:rowSpan`, element.rowSpan);
                    }
                    if (element.colSpan > 1) {
                        td.data(`${EXT_NAME.TABLE}:columnSpan`, element.colSpan);
                    }
                    if (td.styleMap.textAlign == null && !(style.textAlign === 'left' || style.textAlign === 'start')) {
                        td.styleMap.textAlign = style.textAlign;
                    }
                    if (td.styleMap.verticalAlign == null && style.verticalAlign === '') {
                        td.styleMap.verticalAlign = 'middle';
                    }
                    const [width, height] = (node.style.borderCollapse === 'collapse' ? ['0px', '0px'] : node.style.borderSpacing.split(' '));
                    delete td.styleMap.margin;
                    td.styleMap.marginTop = height;
                    td.styleMap.marginRight = width;
                    td.styleMap.marginBottom = height;
                    td.styleMap.marginLeft = width;
                    td.parent = node;
                }
            }
            const xml = this.application.writeGridLayout(node, this.parent, columnCount, rowCount);
            return { xml };
        }
    }

    class TableAndroid extends Table {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processChild() {
            const node = this.node;
            const rowSpan = node.data(`${EXT_NAME.TABLE}:rowSpan`);
            const columnSpan = node.data(`${EXT_NAME.TABLE}:columnSpan`);
            if (rowSpan != null && rowSpan > 1) {
                node.android('layout_rowSpan', rowSpan.toString());
            }
            if (columnSpan != null && columnSpan > 1) {
                node.android('layout_columnSpan', columnSpan.toString());
            }
            return { xml: '' };
        }
    }

    class Button extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        is(node) {
            return (super.is(node) && (node.element.tagName !== 'INPUT' || ['button', 'file', 'image', 'reset', 'search', 'submit'].includes(node.element.type)));
        }
        init(element) {
            if (this.included(element)) {
                const position = getStyle(element).position;
                element.__nodeIsolated = (position !== 'static' && position !== 'initial');
            }
            return false;
        }
        condition() {
            return (super.condition() && this.included());
        }
    }

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
            overwriteDefault(options, 'android', 'backgroundTint', (backgroundColor.length > 0 ? `@color/${Resource.addColor(backgroundColor[0], backgroundColor[2])}` : '?attr/colorAccent'));
            if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.ACCESSIBILITY)) {
                overwriteDefault(options, 'android', 'focusable', 'true');
            }
            let src = '';
            switch (element.tagName) {
                case 'IMG':
                    src = Resource.addImageSrcSet(element, DRAWABLE_PREFIX.DIALOG);
                    break;
                case 'INPUT':
                    if (element.type === 'image') {
                        src = Resource.addImage({ 'mdpi': element.src }, DRAWABLE_PREFIX.DIALOG);
                    }
                    else {
                        src = Resource.addImageURL(node.css('backgroundImage'), DRAWABLE_PREFIX.DIALOG);
                    }
                    break;
                case 'BUTTON':
                    src = Resource.addImageURL(node.css('backgroundImage'), DRAWABLE_PREFIX.DIALOG);
                    break;
            }
            if (src !== '') {
                overwriteDefault(options, 'app', 'srcCompat', `@drawable/${src}`);
            }
            const target = hasValue(node.dataset.target);
            node.depth = (target ? node.depth : node.parent.renderDepth + 1);
            const xml = this.application.controllerHandler.renderNodeStatic(VIEW_SUPPORT.FLOATING_ACTION_BUTTON, (target ? -1 : node.depth), options, 'wrap_content', 'wrap_content', node);
            node.excludeResource |= NODE_RESOURCE.BOX_STYLE | NODE_RESOURCE.ASSET;
            if (node.isolated) {
                positionIsolated(node);
                if (target) {
                    let anchor = parent.stringId;
                    if (parent.nodeName === VIEW_SUPPORT.TOOLBAR) {
                        const outerParent = parent.data(`${WIDGET_NAME.TOOLBAR}:outerParent`);
                        if (outerParent != null) {
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
            return { xml };
        }
        afterInsert() {
            const node = this.node;
            node.android('layout_width', 'wrap_content');
            node.android('layout_height', 'wrap_content');
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
                    valid = (BLOCK_ELEMENT.includes(tagName) && Array.from(element.children).every(item => item.tagName === tagName));
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
        processNode() {
            const node = this.node;
            const xml = this.application.controllerHandler.renderNodeStatic(VIEW_NAVIGATION.MENU, 0, {}, '', '', node, true);
            node.renderParent = true;
            node.cascade().forEach(item => item.renderExtension = this);
            node.excludeResource |= NODE_RESOURCE.ALL;
            return { xml };
        }
        processChild() {
            const node = this.node;
            const element = node.element;
            if (element.nodeName === '#text') {
                node.hide();
                return { xml: '', proceed: true };
            }
            const parent = this.parent;
            node.renderDepth = parent.renderDepth + 1;
            node.renderParent = true;
            node.excludeResource |= NODE_RESOURCE.ALL;
            const options = { android: {}, app: {} };
            const children = Array.from(node.element.children);
            let nodeName = VIEW_NAVIGATION.ITEM;
            let title = '';
            let layout = false;
            let proceed = false;
            if (children.some(item => BLOCK_ELEMENT.includes(item.tagName) && item.children.length > 0)) {
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
                    nodeName = VIEW_NAVIGATION.MENU;
                    proceed = true;
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
                if (parent.android('checkableBehavior') == null) {
                    if (this.hasInputType(node, 'checkbox')) {
                        options.android.checkable = 'true';
                    }
                }
                title = (element.title !== '' ? element.title : element.innerText).trim();
            }
            switch (nodeName) {
                case VIEW_NAVIGATION.ITEM:
                    this.parseDataSet(VALIDATE_ITEM, element, options);
                    if (node.android('icon') == null) {
                        let src = Resource.addImageURL(element.style.backgroundImage, DRAWABLE_PREFIX.MENU);
                        if (src !== '') {
                            options.android.icon = `@drawable/${src}`;
                        }
                        else {
                            const image = node.children.find(item => item.element.tagName === 'IMG');
                            if (image != null) {
                                src = Resource.addImageSrcSet(image.element, DRAWABLE_PREFIX.MENU);
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
            if (node.android('title') == null) {
                if (title !== '') {
                    const name = Resource.addString(title);
                    if (name !== '') {
                        title = `@string/${name}`;
                    }
                    options.android.title = title;
                }
            }
            if (options.android.id == null) {
                node.setNodeId(nodeName);
            }
            else {
                node.nodeName = nodeName;
            }
            const xml = this.application.controllerHandler.renderNodeStatic(nodeName, node.depth, options, '', '', node, layout);
            return { xml, proceed };
        }
        afterRender() {
            super.afterRender();
            if (this.included(this.node.element)) {
                const view = this.application.current;
                view.pathname = 'res/menu';
            }
        }
        parseDataSet(validator, element, options) {
            for (const attr in element.dataset) {
                const value = element.dataset[attr];
                if (value != null && validator[attr] != null) {
                    const match = value.match(validator[attr]);
                    if (match != null) {
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
            const application = this.application;
            const controller = this.application.controllerHandler;
            const node = this.node;
            const parent = this.parent;
            let xml = controller.renderGroup(node, parent, VIEW_SUPPORT.COORDINATOR);
            node.apply(this.options[node.element.id]);
            node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
            const nodes = node.children.filter(item => !item.isolated);
            if (nodes.length > 0) {
                const toolbar = this.getToolbar(node);
                let offsetX = 0;
                let offsetHeight = 0;
                let collapsingToolbar = null;
                if (toolbar != null) {
                    const extension = this.application.findExtension(WIDGET_NAME.TOOLBAR);
                    if (extension != null) {
                        offsetX = toolbar.linear.bottom;
                        offsetHeight = toolbar.bounds.height;
                        if (Math.floor(toolbar.linear.top) === node.box.top) {
                            node.bounds.bottom -= offsetHeight;
                            node.setBounds(true);
                        }
                        collapsingToolbar = (extension.options[toolbar.element.id] != null ? extension.options[toolbar.element.id].collapsingToolbar : null);
                    }
                }
                const filename = `${node.nodeId}_content`;
                let include = '';
                let contentNode = null;
                if (this.options.includes == null || this.options.includes) {
                    include = controller.renderNodeStatic('include', node.depth + 1, { layout: `@layout/${filename}` });
                    contentNode = createPlaceholder(application.cache.nextId, node, nodes);
                    contentNode.children.forEach(item => {
                        item.parent = contentNode;
                        item.depth++;
                        if (offsetHeight > 0 && item.linear.top >= offsetX) {
                            this.adjustBounds(item, offsetHeight);
                            item.cascade().forEach((child) => this.adjustBounds(child, offsetHeight));
                        }
                    });
                    application.cache.list.push(contentNode);
                    node.children = node.children.filter(item => item.isolated);
                }
                const options = { android: {} };
                const optionsCollapsingToolbar = Object.assign({}, collapsingToolbar);
                const [linearX, linearY] = [ViewList.linearX(nodes), ViewList.linearY(nodes)];
                let viewName = '';
                if (application.isLinearXY(linearX, linearY, node, nodes)) {
                    viewName = NODE_ANDROID.LINEAR;
                    options.android.orientation = (linearY ? 'vertical' : 'horizontal');
                }
                else {
                    viewName = NODE_ANDROID.CONSTRAINT;
                }
                if (collapsingToolbar != null) {
                    overwriteDefault(optionsCollapsingToolbar, 'app', 'layout_behavior', '@string/appbar_scrolling_view_behavior');
                    node.android('fitsSystemWindows', 'true');
                }
                overwriteDefault((collapsingToolbar != null ? optionsCollapsingToolbar : options), 'android', 'id', `${node.stringId}_content`);
                const depth = (include !== '' ? 0 : node.depth + 1);
                let content = (include !== '' ? controller.renderNodeStatic(viewName, depth + (collapsingToolbar ? 1 : 0), options, 'match_parent', 'wrap_content', contentNode, true) : '');
                if (collapsingToolbar != null) {
                    content = controller.renderNodeStatic(NODE_ANDROID.SCROLL_NESTED, depth, optionsCollapsingToolbar, 'match_parent', 'match_parent', new View(0, node.api), true).replace('{:0}', content);
                }
                if (include !== '') {
                    application.addInclude(filename, content);
                    content = include;
                }
                xml = xml.replace(`{:${node.id}}`, `${content}{:${node.id}}`);
            }
            return { xml };
        }
        afterInsert() {
            const node = this.node;
            if (node.documentRoot) {
                node.android('layout_width', 'match_parent');
                node.android('layout_height', 'match_parent');
            }
        }
        getToolbar(node) {
            const toolbar = Array.from(node.element.children).find((element) => includes(optional(element, 'dataset.ext'), WIDGET_NAME.TOOLBAR));
            return (toolbar != null ? toolbar.__node : null);
        }
        adjustBounds(node, offsetHeight) {
            node.bounds.top -= offsetHeight;
            node.bounds.bottom -= offsetHeight;
            node.setBounds(true);
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
                Array.from(element.children).forEach((item) => {
                    if (item.tagName === 'NAV' && !includes(item.dataset.ext || '', EXT_NAME.EXTERNAL)) {
                        item.dataset.ext = (hasValue(item.dataset.ext) ? `${item.dataset.ext}, ` : '') + EXT_NAME.EXTERNAL;
                    }
                });
                if (element.dataset.target != null) {
                    const target = document.getElementById(element.dataset.target);
                    if (target != null && element.parentElement !== target && !includes(optional(target, 'dataset.ext'), WIDGET_NAME.COORDINATOR)) {
                        this.application.elements.add(element);
                    }
                }
                if (includes(optional(element, 'parentElement.dataset.ext'), WIDGET_NAME.COORDINATOR)) {
                    element.__nodeIsolated = true;
                }
            }
            return false;
        }
        condition() {
            return (super.condition() && this.included());
        }
        processNode() {
            const application = this.application;
            const controller = application.controllerHandler;
            const node = this.node;
            const target = hasValue(node.dataset.target);
            const options = Object.assign({}, this.options[node.element.id]);
            const optionsToolbar = Object.assign({}, options.toolbar);
            const optionsAppBar = Object.assign({}, options.appBar);
            const optionsCollapsingToolbar = Object.assign({}, options.collapsingToolbar);
            const appBarChildren = [];
            const collapsingToolbarChildren = [];
            const hasMenu = (findNestedMenu(node) != null);
            const backgroundImage = node.css('backgroundImage');
            let depth = (target ? 0 : node.depth + node.renderDepth);
            let children = node.children.filter(item => !item.isolated).length;
            Array.from(node.element.children).forEach((element) => {
                if (element.tagName === 'IMG') {
                    if (element.dataset.navigationIcon != null) {
                        const result = Resource.addImageSrcSet(element, DRAWABLE_PREFIX.MENU);
                        if (result !== '') {
                            overwriteDefault(toolbar, 'app', 'navigationIcon', `@drawable/${result}`);
                            if (getStyle(element).display !== 'none') {
                                children--;
                            }
                        }
                    }
                    if (element.dataset.collapseIcon != null) {
                        const result = Resource.addImageSrcSet(element, DRAWABLE_PREFIX.MENU);
                        if (result !== '') {
                            overwriteDefault(toolbar, 'app', 'collapseIcon', `@drawable/${result}`);
                            if (getStyle(element).display !== 'none') {
                                children--;
                            }
                        }
                    }
                }
                if (!hasValue(element.dataset.target)) {
                    const targetNode = element.__node;
                    if (targetNode != null) {
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
                overwriteDefault((appBar ? optionsAppBar : optionsToolbar), 'android', 'fitsSystemWindows', 'true');
                overwriteDefault(optionsToolbar, 'app', 'popupTheme', '@style/ThemeOverlay.AppCompat.Light');
                if (backgroundImage !== 'none') {
                    overwriteDefault((appBarChildren.length > 0 ? optionsAppBar : optionsToolbar), 'android', 'background', `@drawable/${Resource.addImageURL(backgroundImage)}`);
                    node.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
                }
                else {
                    overwriteDefault(optionsToolbar, 'app', 'layout_scrollFlags', 'scroll|enterAlways');
                }
            }
            if (appBarChildren.length > 0) {
                overwriteDefault(optionsAppBar, 'android', 'layout_height', '?attr/actionBarSize');
            }
            else {
                overwriteDefault(optionsToolbar, 'android', 'layout_height', '?attr/actionBarSize');
                node.excludeProcedure |= NODE_PROCEDURE.LAYOUT;
            }
            if (hasMenu) {
                overwriteDefault(optionsToolbar, 'app', 'menu', `@menu/{${node.id}:${WIDGET_NAME.TOOLBAR}:menu}`);
                if (appBar) {
                    if (optionsToolbar.app.popupTheme != null) {
                        popupOverlay = optionsToolbar.app.popupTheme.replace('@style/', '');
                    }
                    optionsToolbar.app.popupTheme = '@style/AppTheme.PopupOverlay';
                }
            }
            node.depth = depth + (appBar ? 1 : 0) + (collapsingToolbar ? 1 : 0);
            let xml = controller.renderNodeStatic(VIEW_SUPPORT.TOOLBAR, node.depth, optionsToolbar, 'match_parent', 'wrap_content', node, (children > 0));
            if (collapsingToolbar) {
                if (backgroundImage !== 'none') {
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
                    overwriteDefault(optionsBackgroundImage, 'android', 'src', `@drawable/${Resource.addImageURL(backgroundImage)}`);
                    overwriteDefault(optionsBackgroundImage, 'android', 'scaleType', scaleType);
                    overwriteDefault(optionsBackgroundImage, 'android', 'fitsSystemWindows', 'true');
                    overwriteDefault(optionsBackgroundImage, 'app', 'layout_collapseMode', 'parallax');
                    xml = controller.renderNodeStatic(NODE_ANDROID.IMAGE, node.depth, optionsBackgroundImage, 'match_parent', 'match_parent') + xml;
                    node.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
                }
            }
            let outer = '';
            let appBarNode = null;
            let collapsingToolbarNode = null;
            if (appBar) {
                overwriteDefault(optionsAppBar, 'android', 'id', `${node.stringId}_appbar`);
                overwriteDefault(optionsAppBar, 'android', 'layout_height', (node.viewHeight > 0 ? formatDimen('appbar', 'height', convertPX(node.viewHeight)) : 'wrap_content'));
                if (collapsingToolbar) {
                    overwriteDefault(optionsAppBar, 'android', 'fitsSystemWindows', 'true');
                }
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
                appBarNode = createPlaceholder(application.cache.nextId, node, appBarChildren);
                appBarNode.depth = depth;
                appBarNode.nodeId = stripId(optionsAppBar.android.id);
                appBarNode.children.forEach(item => {
                    item.depth = depth + 1;
                    item.element.dataset.target = appBarNode.nodeId;
                });
                application.cache.list.push(appBarNode);
                outer = controller.renderNodeStatic(VIEW_SUPPORT.APPBAR, (target ? -1 : depth), optionsAppBar, 'match_parent', 'wrap_content', appBarNode, true);
                if (collapsingToolbar) {
                    depth++;
                    overwriteDefault(optionsCollapsingToolbar, 'android', 'id', `${node.stringId}_collapsingtoolbar`);
                    overwriteDefault(optionsCollapsingToolbar, 'android', 'fitsSystemWindows', 'true');
                    if (backgroundImage === 'none') {
                        overwriteDefault(optionsCollapsingToolbar, 'app', 'contentScrim', '?attr/colorPrimary');
                    }
                    overwriteDefault(optionsCollapsingToolbar, 'app', 'layout_scrollFlags', 'scroll|exitUntilCollapsed');
                    overwriteDefault(optionsCollapsingToolbar, 'app', 'toolbarId', node.stringId);
                    collapsingToolbarNode = createPlaceholder(application.cache.nextId, node, collapsingToolbarChildren);
                    appBarNode.depth = depth;
                    collapsingToolbarNode.children.forEach(item => {
                        item.depth = depth + 1;
                        item.element.dataset.target = collapsingToolbarNode.nodeId;
                    });
                    application.cache.list.push(collapsingToolbarNode);
                    outer = outer.replace(`{:${appBarNode.id}}`, controller.renderNodeStatic(VIEW_SUPPORT.COLLAPSING_TOOLBAR, depth, optionsCollapsingToolbar, 'match_parent', 'match_parent', collapsingToolbarNode, true) + `{:${appBarNode.id}}`);
                }
            }
            if (appBarNode != null) {
                xml = (collapsingToolbarNode != null ? outer.replace(`{:${collapsingToolbarNode.id}}`, xml + `{:${collapsingToolbarNode.id}}`) : outer.replace(`{:${appBarNode.id}}`, xml + `{:${appBarNode.id}}`));
            }
            if (appBarNode != null) {
                if (collapsingToolbarNode == null) {
                    node.parent = appBarNode;
                }
                else {
                    collapsingToolbarNode.parent = appBarNode;
                }
                node.data(`${WIDGET_NAME.TOOLBAR}:outerParent`, appBarNode.stringId);
            }
            else if (collapsingToolbarNode != null) {
                node.parent = collapsingToolbarNode;
            }
            if (target) {
                node.render(node);
            }
            else {
                node.render(this.parent);
                node.renderDepth = node.depth;
            }
            node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
            return { xml };
        }
        processChild() {
            const element = this.element;
            if (element != null && element.tagName === 'IMG' && (element.dataset.navigationIcon != null || element.dataset.collapseIcon != null)) {
                this.node.hide();
                return { xml: '', proceed: true };
            }
            return { xml: '' };
        }
        finalize() {
            const node = this.node;
            const menu = findNestedMenu(node);
            if (menu != null) {
                const layouts = this.application.layouts;
                for (let i = 0; i < layouts.length; i++) {
                    layouts[i].content = layouts[i].content.replace(`{${node.id}:${WIDGET_NAME.TOOLBAR}:menu}`, menu.dataset.viewName);
                }
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
            this.application.resourceHandler.addResourceTheme(EXTENSION_APPBAR_TMPL, data, options);
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
            overwriteDefault(options, 'app', 'menu', `@menu/{${node.id}:${WIDGET_NAME.BOTTOM_NAVIGATION}:menu}`);
            const xml = this.application.controllerHandler.renderNodeStatic(VIEW_SUPPORT.BOTTOM_NAVIGATION, node.depth, options, (parent.is(NODE_STANDARD.CONSTRAINT) ? '0px' : 'match_parent'), 'wrap_content', node);
            for (let i = 5; i < node.children.length; i++) {
                node.children[i].hide();
                node.children[i].cascade().forEach(item => item.hide());
            }
            node.cascade().forEach(item => item.renderExtension = this);
            node.excludeResource |= NODE_RESOURCE.ASSET;
            node.render(parent);
            this.createResourceTheme();
            return { xml };
        }
        afterInsert() {
            const node = this.node;
            if (node.renderParent.viewHeight === 0) {
                node.renderParent.android('layout_height', 'match_parent');
            }
        }
        finalize() {
            const node = this.node;
            if (findNestedMenu(node) != null) {
                let menu = '';
                Array.from(this.application.elements).some(element => {
                    if (element.parentElement === node.element && includes(optional(element, 'dataset.ext'), WIDGET_NAME.MENU)) {
                        menu = element.dataset.viewName;
                        return true;
                    }
                    return false;
                });
                if (menu !== '') {
                    this.application.layouts.forEach(view => view.content = view.content.replace(`{${node.id}:${WIDGET_NAME.BOTTOM_NAVIGATION}:menu}`, menu));
                }
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
            this.application.resourceHandler.addResourceTheme(EXTENSION_GENERIC_TMPL, data, options);
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
        condition() {
            return (super.condition() && this.included());
        }
        processNode() {
            const application = this.application;
            const controller = application.controllerHandler;
            const node = this.node;
            let depth = node.depth + node.renderDepth;
            const optionsDrawer = Object.assign({}, this.options.drawer);
            const optionsCoordinator = Object.assign({}, this.options.coordinator);
            let menu = findNestedMenu(node);
            if (menu != null) {
                overwriteDefault(optionsDrawer, 'android', 'fitsSystemWindows', 'true');
            }
            let xml = controller.renderNodeStatic(VIEW_SUPPORT.DRAWER, depth, optionsDrawer, 'match_parent', 'match_parent', node, true);
            const filename = `${node.nodeId}_content`;
            let include = '';
            if (this.options.includes == null || this.options.includes) {
                include = controller.renderNodeStatic('include', depth + 1, { layout: `@layout/${filename}` });
                depth = -1;
            }
            const coordinatorNode = createPlaceholder(application.cache.nextId, node);
            application.cache.list.push(coordinatorNode);
            overwriteDefault(optionsCoordinator, 'android', 'id', `${node.stringId}_content`);
            coordinatorNode.nodeId = stripId(optionsCoordinator.android.id);
            const content = controller.renderNodeStatic(VIEW_SUPPORT.COORDINATOR, depth + 1, optionsCoordinator, 'match_parent', 'match_parent', coordinatorNode, true);
            const optionsNavigation = Object.assign({}, this.options.navigation);
            overwriteDefault(optionsNavigation, 'android', 'layout_gravity', parseRTL('left'));
            if (menu != null) {
                this.createResourceTheme();
                overwriteDefault(optionsNavigation, 'android', 'id', `${node.stringId}_view`);
                overwriteDefault(optionsNavigation, 'android', 'fitsSystemWindows', 'true');
                overwriteDefault(optionsNavigation, 'app', 'menu', `@menu/{${node.id}:${WIDGET_NAME.DRAWER}:menu}`);
                overwriteDefault(optionsNavigation, 'app', 'headerLayout', `@layout/{${node.id}:${WIDGET_NAME.DRAWER}:headerLayout}`);
                const navigation = controller.renderNodeStatic(VIEW_SUPPORT.NAVIGATION_VIEW, node.depth + 1, optionsNavigation, 'wrap_content', 'match_parent');
                xml = xml.replace(`{:${node.id}}`, (include !== '' ? include : content) + navigation + `{:${node.id}}`);
            }
            else {
                const navView = node.children[node.children.length - 1];
                navView.android('layout_gravity', optionsNavigation.android.layout_gravity);
                navView.android('layout_height', 'match_parent');
                navView.isolated = true;
                controller.prependBefore(navView.id, (include !== '' ? include : content));
                menu = navView.element;
            }
            node.children.forEach(item => {
                if (menu.__node !== item) {
                    item.parent = coordinatorNode;
                    coordinatorNode.children.push(item);
                }
            });
            if (include !== '') {
                application.addInclude(filename, content);
            }
            node.renderParent = true;
            node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
            return { xml };
        }
        beforeInsert() {
            const application = this.application;
            const node = this.node;
            if (application.insert[node.nodeId] != null) {
                const target = application.cacheInternal.list.find(item => item.isolated && item.parent === node.parent && item.nodeName === VIEW_SUPPORT.COORDINATOR);
                if (target != null) {
                    application.insert[target.nodeId] = application.insert[node.nodeId];
                    delete application.insert[node.nodeId];
                }
            }
        }
        afterInsert() {
            const headerLayout = findNestedExtension(this.node, EXT_NAME.EXTERNAL);
            if (headerLayout != null) {
                const node = headerLayout.__node;
                if (node.viewHeight === 0) {
                    node.android('layout_height', 'wrap_content');
                }
            }
        }
        finalize() {
            const node = this.node;
            const menu = optional(findNestedExtension(node, WIDGET_NAME.MENU), 'dataset.viewName');
            const headerLayout = optional(findNestedExtension(node, EXT_NAME.EXTERNAL), 'dataset.viewName');
            if (menu !== '') {
                this.application.layouts.forEach(view => view.content = view.content.replace(`{${node.id}:${WIDGET_NAME.DRAWER}:menu}`, menu));
            }
            if (headerLayout !== '') {
                this.application.layouts.forEach(view => view.content = view.content.replace(`{${node.id}:${WIDGET_NAME.DRAWER}:headerLayout}`, headerLayout));
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
            this.application.resourceHandler.addResourceTheme(EXTENSION_DRAWER_TMPL, data, options);
        }
    }

    let LOADING = false;
    const ROOT_CACHE = new Set();
    const EXTENSIONS = {
        [EXT_NAME.EXTERNAL]: new External(EXT_NAME.EXTERNAL),
        [EXT_NAME.CUSTOM]: new CustomAndroid(EXT_NAME.CUSTOM),
        [EXT_NAME.LIST]: new ListAndroid(EXT_NAME.LIST, ['UL', 'OL']),
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
    const NodeList$1 = ViewList;
    const Controller$1 = new ViewController();
    const File$1 = new FileView();
    const Resource$1 = new ResourceView(File$1);
    const main = new Application(Node$1, NodeList$1);
    main.registerController(Controller$1);
    main.registerResource(Resource$1);
    (() => {
        const load = new Set();
        for (let name of SETTINGS.builtInExtensions) {
            name = name.toLowerCase().trim();
            for (const extension in EXTENSIONS) {
                if (name === extension || extension.startsWith(`${name}.`)) {
                    load.add(EXTENSIONS[extension]);
                }
            }
        }
        load.forEach(item => main.registerExtension(item));
    })();
    function parseDocument(...elements) {
        if (main.closed) {
            return;
        }
        LOADING = false;
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
        let __THEN;
        function parseResume() {
            LOADING = false;
            main.elements.forEach(element => {
                if (main.appName === '') {
                    if (element.id === '') {
                        element.id = 'untitled';
                    }
                    main.appName = element.id;
                }
                else {
                    if (element.id === '') {
                        element.id = `view_${main.size}`;
                    }
                }
                const filename = optional(element, 'dataset.filename').trim().replace(/\.xml$/, '') || element.id;
                element.dataset.views = (optional(element, 'dataset.views', 'number') + 1).toString();
                element.dataset.viewName = convertWord((element.dataset.views !== '1' ? `${filename}_${element.dataset.views}` : filename));
                if (main.createNodeCache(element)) {
                    main.createLayoutXml();
                    main.setResources();
                    main.setConstraints();
                    ROOT_CACHE.add(element);
                }
            });
            if (typeof __THEN === 'function') {
                __THEN.call(main);
            }
        }
        const images = Array.from(main.elements).map((element) => Array.from(element.querySelectorAll('IMG'))).reduce((a, b) => a.concat(b), []).filter(element => !element.complete);
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
            Promise.all(queue).then(() => parseResume());
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
    function registerExtension(extension) {
        if (extension instanceof Extension && extension.name !== '' && Array.isArray(extension.tagNames)) {
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
    function getExtension(name) {
        return main.findExtension(name);
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
        ROOT_CACHE.forEach(element => {
            delete element.dataset.views;
            delete element.dataset.viewName;
        });
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
    function writeResourceDimenXml(saveToDisk = false) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceDimenToXml(saveToDisk);
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
        }
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
