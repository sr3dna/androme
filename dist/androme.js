/* androme 1.5.1
   https://github.com/anpham6/androme */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.androme = {})));
}(this, (function (exports) { 'use strict';

    const ID = {
        android: ['parent']
    };
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
    function generateId(section, name) {
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
    function padLeft(n, value = '\t') {
        return value.repeat(n);
    }
    function formatPX(value) {
        value = parseFloat(value);
        return `${(!isNaN(value) ? Math.ceil(value) : 0)}px`;
    }
    function convertPX(value, unit = true) {
        if (hasValue(value)) {
            if (typeof value === 'number') {
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
                return (unit ? `${value}px` : value);
            }
        }
        return (unit ? '0px' : 0);
    }
    function convertDP(value, dpi = 160, unit = true, font = false) {
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
    function convertSP(value, dpi = 160, unit = true) {
        return convertDP(value, dpi, unit, true);
    }
    function replaceDP(xml, dpi = 160, font = false) {
        return xml.replace(/("|>)([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + convertDP(capture[1], dpi, true, font) + capture[2]);
    }
    function convertInt(value) {
        return parseInt(value) || 0;
    }
    function isNumber(value) {
        return /^[0-9]+\.?[0-9]*$/.test(value.toString().trim());
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
            let filter = null;
            if (/^\*.+\*$/.test(value)) {
                filter = (a) => a.indexOf(value.replace(/\*/g, '')) !== -1;
            }
            else if (/^\*/.test(value)) {
                filter = (a) => a.endsWith(value.replace(/\*/, ''));
            }
            else if (/\*$/.test(value)) {
                filter = (a) => a.startsWith(value.replace(/\*/, ''));
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
    function remove(list, value) {
        const index = list.indexOf(value);
        if (index !== -1) {
            list.splice(index, 1);
        }
        return list;
    }
    function sortAsc(list, ...attributes) {
        return sort(list, 0, ...attributes);
    }
    function sortDesc(list, ...attributes) {
        return sort(list, 1, ...attributes);
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

    function getRangeBounds(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const domRect = range.getClientRects();
        const bounds = JSON.parse(JSON.stringify(domRect[domRect.length - 1]));
        if (domRect.length > 1) {
            bounds.x = Math.min.apply(null, Array.from(domRect).map((item) => item.x));
            bounds.left = bounds.x;
            bounds.width = Array.from(domRect).reduce((a, b) => a + b.width, 0);
        }
        return bounds;
    }
    function getStyle(element) {
        return (element.__node != null ? element.__node.style : getComputedStyle(element));
    }
    function sameAsParent(element, attr) {
        if (element.parentElement != null) {
            return (getStyle(element)[attr] === getStyle(element.parentElement)[attr]);
        }
        return false;
    }
    function getBoxSpacing(element, complete = false) {
        const result = {};
        const style = getStyle(element);
        ['padding', 'margin'].forEach(border => {
            ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
                const attr = border + side;
                const value = convertInt(style[attr]);
                if (complete || value !== 0) {
                    result[attr] = value;
                }
            });
        });
        return result;
    }
    function hasFreeFormText(element) {
        return Array.from(element.childNodes).some(item => (item.nodeName === '#text' && item.textContent.trim() !== ''));
    }
    function isVisible(element) {
        if (typeof element.getBoundingClientRect === 'function') {
            const bounds = element.getBoundingClientRect();
            if (bounds.width !== 0 && bounds.height !== 0) {
                return true;
            }
            else if (element.children.length > 0) {
                return Array.from(element.children).some(item => {
                    const style = getComputedStyle(item);
                    return !(style.position === '' || style.position === 'static');
                });
            }
        }
        return false;
    }

    (function (BUILD_ANDROID) {
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
        NODE_ANDROID.EDIT,
        NODE_ANDROID.SELECT,
        NODE_ANDROID.CHECKBOX,
        NODE_ANDROID.RADIO,
        NODE_ANDROID.BUTTON
    ];
    const XMLNS_ANDROID = {
        'ANDROID': 'xmlns:android="http://schemas.android.com/apk/res/android"',
        'APP': 'xmlns:app="http://schemas.android.com/apk/res-auto"',
        'TOOLS': 'xmlns:tools="http://schemas.android.com/tools"'
    };

    var SETTINGS = {
        targetAPI: exports.build.OREO,
        density: exports.density.MDPI,
        showAttributes: true,
        horizontalPerspective: true,
        useConstraintLayout: true,
        useConstraintChain: true,
        useConstraintGuideline: true,
        useGridLayout: true,
        useLayoutWeight: true,
        useUnitDP: true,
        useFontAlias: false,
        supportRTL: true,
        numberResourceValue: false,
        excludeTextColor: ['#000000'],
        excludeBackgroundColor: ['#FFFFFF'],
        whitespaceHorizontalOffset: 4,
        whitespaceVerticalOffset: 14,
        chainPackedHorizontalOffset: 4,
        chainPackedVerticalOffset: 14
    };

    var NODE_STANDARD;
    (function (NODE_STANDARD) {
        NODE_STANDARD[NODE_STANDARD["FRAME"] = 1] = "FRAME";
        NODE_STANDARD[NODE_STANDARD["LINEAR"] = 2] = "LINEAR";
        NODE_STANDARD[NODE_STANDARD["CONSTRAINT"] = 3] = "CONSTRAINT";
        NODE_STANDARD[NODE_STANDARD["GUIDELINE"] = 4] = "GUIDELINE";
        NODE_STANDARD[NODE_STANDARD["RELATIVE"] = 5] = "RELATIVE";
        NODE_STANDARD[NODE_STANDARD["GRID"] = 6] = "GRID";
        NODE_STANDARD[NODE_STANDARD["SCROLL_VERTICAL"] = 7] = "SCROLL_VERTICAL";
        NODE_STANDARD[NODE_STANDARD["SCROLL_HORIZONTAL"] = 8] = "SCROLL_HORIZONTAL";
        NODE_STANDARD[NODE_STANDARD["SCROLL_NESTED"] = 9] = "SCROLL_NESTED";
        NODE_STANDARD[NODE_STANDARD["RADIO_GROUP"] = 10] = "RADIO_GROUP";
        NODE_STANDARD[NODE_STANDARD["TEXT"] = 11] = "TEXT";
        NODE_STANDARD[NODE_STANDARD["EDIT"] = 12] = "EDIT";
        NODE_STANDARD[NODE_STANDARD["IMAGE"] = 13] = "IMAGE";
        NODE_STANDARD[NODE_STANDARD["SELECT"] = 14] = "SELECT";
        NODE_STANDARD[NODE_STANDARD["CHECKBOX"] = 15] = "CHECKBOX";
        NODE_STANDARD[NODE_STANDARD["RADIO"] = 16] = "RADIO";
        NODE_STANDARD[NODE_STANDARD["BUTTON"] = 17] = "BUTTON";
        NODE_STANDARD[NODE_STANDARD["VIEW"] = 18] = "VIEW";
        NODE_STANDARD[NODE_STANDARD["SPACE"] = 19] = "SPACE";
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
    })(BOX_STANDARD || (BOX_STANDARD = {}));
    const MAPPING_CHROME = {
        'TEXT': NODE_STANDARD.TEXT,
        'LABEL': NODE_STANDARD.TEXT,
        'P': NODE_STANDARD.TEXT,
        'HR': NODE_STANDARD.VIEW,
        'IMG': NODE_STANDARD.IMAGE,
        'SELECT': NODE_STANDARD.SELECT,
        'INPUT': {
            'text': NODE_STANDARD.EDIT,
            'password': NODE_STANDARD.EDIT,
            'checkbox': NODE_STANDARD.CHECKBOX,
            'radio': NODE_STANDARD.RADIO,
            'button': NODE_STANDARD.BUTTON,
            'submit': NODE_STANDARD.BUTTON
        },
        'BUTTON': NODE_STANDARD.BUTTON,
        'TEXTAREA': NODE_STANDARD.EDIT
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
        'TEXT'
    ];

    class Application {
        constructor(cache, viewHandler, resource, NODE, NODELIST) {
            this.cache = cache;
            this.viewHandler = viewHandler;
            this.resource = resource;
            this.NODE = NODE;
            this.NODELIST = NODELIST;
            this.viewHandler.cache = cache;
        }
        setNodeCache(documentRoot) {
            let nodeTotal = 0;
            Array.from((documentRoot || document.body).childNodes).forEach((item) => {
                if (item.nodeName === '#text') {
                    if (item.textContent.trim() !== '') {
                        nodeTotal++;
                    }
                }
                else {
                    if (isVisible(item)) {
                        nodeTotal++;
                    }
                }
            });
            const elements = (documentRoot != null ? documentRoot.querySelectorAll('*') : document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *')));
            if (documentRoot != null) {
                const node = this.insertNode(documentRoot);
                node.parent = new this.NODE(0, 0);
            }
            for (const element of Array.from(elements)) {
                if (INLINE_CHROME.includes(element.tagName) && (MAPPING_CHROME[element.parentElement.tagName] != null || INLINE_CHROME.includes(element.parentElement.tagName))) {
                    continue;
                }
                this.insertNode(element);
            }
            const preAlignment = {};
            for (const node of this.cache) {
                preAlignment[node.id] = {};
                const style = preAlignment[node.id];
                switch (node.style.textAlign) {
                    case 'center':
                    case 'right':
                    case 'end':
                        style.textAlign = node.style.textAlign;
                        node.element.style.textAlign = '';
                        break;
                }
                style.verticalAlign = node.styleMap.verticalAlign || '';
                node.element.style.verticalAlign = 'top';
                if (node.overflow !== 0 /* NONE */) {
                    if (hasValue(node.styleMap.width)) {
                        style.width = node.styleMap.width;
                        node.element.style.width = '';
                    }
                    if (hasValue(node.styleMap.height)) {
                        style.height = node.styleMap.height;
                        node.element.style.height = '';
                    }
                    style.overflow = node.style.overflow;
                    node.element.style.overflow = 'visible';
                }
                node.setBounds();
            }
            const parents = {};
            for (const parent of this.cache) {
                for (const child of this.cache) {
                    if (parent !== child) {
                        if (child.element.parentElement === parent.element) {
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
                }
            }
            for (const node of this.cache) {
                const nodes = parents[node.id];
                if (nodes != null) {
                    nodes.push(node.parent);
                    let minArea = Number.MAX_VALUE;
                    let closest = null;
                    for (const current of nodes) {
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
                    }
                    if (closest != null) {
                        node.parent = closest;
                    }
                }
                if (node.element.children && node.element.children.length > 1) {
                    Array.from(node.element.childNodes).forEach((element) => {
                        if (element.nodeName === '#text' && element.textContent.trim() !== '') {
                            this.insertNode(element, node);
                        }
                    });
                }
            }
            for (const node of this.cache) {
                const style = preAlignment[node.id];
                if (style != null) {
                    for (const attr in style) {
                        node.element.style[attr] = style[attr];
                    }
                }
            }
            sortAsc(this.cache, 'depth', 'parent.id', 'parentIndex', 'id');
            for (const node of this.cache) {
                let i = 0;
                Array.from(node.element.childNodes).forEach((element) => {
                    if (element.__node != null && (element.__node.parent.element === node.element)) {
                        element.__node.parentIndex = i++;
                    }
                });
                sortAsc(node.children, 'parentIndex');
            }
        }
        setMarginPadding() {
            for (const node of this.cache) {
                if (node.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP)) {
                    switch (node.android('orientation')) {
                        case 'horizontal':
                            let left = node.box.left;
                            sortAsc(node.renderChildren, 'linear.left').forEach((item) => {
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
                            sortAsc(node.renderChildren, 'linear.top').forEach((item) => {
                                const height = Math.ceil(item.linear.top - top);
                                if (height >= 1) {
                                    item.modifyBox(BOX_STANDARD.MARGIN_TOP, height);
                                }
                                top = item.linear.bottom;
                            });
                            break;
                    }
                }
            }
        }
        setLayoutWeight() {
            for (const node of this.cache) {
                const rows = node.linearRows;
                if (rows.length > 1) {
                    const columnLength = rows[0].renderChildren.length;
                    if (rows.every((item) => item.renderChildren.length === columnLength)) {
                        const horizontal = !node.horizontal;
                        const columnDimension = new Array(columnLength).fill(Number.MIN_VALUE);
                        for (const row of rows) {
                            for (let i = 0; i < row.renderChildren.length; i++) {
                                columnDimension[i] = Math.max(row.renderChildren[i].linear[(horizontal ? 'width' : 'height')], columnDimension[i]);
                            }
                        }
                        const total = columnDimension.reduce((a, b) => a + b);
                        const percent = columnDimension.map(value => Math.floor((value * 100) / total));
                        percent[percent.length - 1] += 100 - percent.reduce((a, b) => a + b);
                        for (const row of rows) {
                            for (let i = 0; i < row.renderChildren.length; i++) {
                                const column = row.renderChildren[i];
                                column.distributeWeight(horizontal, percent[i]);
                            }
                        }
                    }
                }
            }
        }
        insertNode(element, parent) {
            let node = null;
            if (element.nodeName === '#text') {
                if (element.textContent.trim() !== '') {
                    node = new this.NODE(this.cache.nextId, SETTINGS.targetAPI, null, { element, parent, tagName: 'TEXT' });
                    node.setBounds(false, element);
                    node.inheritStyle(parent);
                    parent.children.push(node);
                }
            }
            else if (isVisible(element)) {
                node = new this.NODE(this.cache.nextId, SETTINGS.targetAPI, element);
            }
            if (node != null) {
                this.cache.push(node);
            }
            return node;
        }
        getLayoutXml() {
            let output = `<?xml version="1.0" encoding="utf-8"?>\n{0}`;
            const mapX = [];
            const mapY = [];
            for (const node of this.cache) {
                const x = Math.floor(node.bounds.x);
                const y = node.parent.id;
                if (mapX[node.depth] == null) {
                    mapX[node.depth] = {};
                }
                if (mapY[node.depth] == null) {
                    mapY[node.depth] = {};
                }
                if (mapX[node.depth][x] == null) {
                    mapX[node.depth][x] = new this.NODELIST();
                }
                if (mapY[node.depth][y] == null) {
                    mapY[node.depth][y] = new this.NODELIST();
                }
                mapX[node.depth][x].push(node);
                mapY[node.depth][y].push(node);
            }
            for (let i = 0; i < mapY.length; i++) {
                const coordsY = Object.keys(mapY[i]);
                const partial = new Map();
                for (let j = 0; j < coordsY.length; j++) {
                    const axisY = [];
                    const layers = [];
                    for (const node of mapY[i][coordsY[j]]) {
                        switch (node.style.position) {
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
                        if (!a.parent.flex.enabled && !b.parent.flex.enabled && a.withinX(b.linear)) {
                            return (a.linear.left > b.linear.left ? 1 : -1);
                        }
                        return (a.parentIndex > b.parentIndex ? 1 : -1);
                    });
                    axisY.push(...sortAsc(layers, 'style.zIndex', 'parentIndex'));
                    for (let k = 0; k < axisY.length; k++) {
                        const nodeY = axisY[k];
                        if (!nodeY.renderParent) {
                            const parent = nodeY.parent;
                            let tagName = nodeY.nodeName;
                            let restart = false;
                            let xml = '';
                            if (tagName == null) {
                                if ((nodeY.children.length === 0 && hasFreeFormText(nodeY.element)) || nodeY.children.every((item) => INLINE_CHROME.includes(item.tagName))) {
                                    tagName = NODE_STANDARD.TEXT;
                                }
                                else if (nodeY.children.length > 0) {
                                    const rows = nodeY.children;
                                    if (SETTINGS.useGridLayout && !nodeY.flex.enabled && rows.length > 1 && rows.every((item) => !item.flex.enabled && (BLOCK_CHROME.includes(item.tagName) && item.children.length > 0))) {
                                        let columns = [];
                                        const columnEnd = [];
                                        if (SETTINGS.useLayoutWeight) {
                                            const dimensions = [];
                                            for (let l = 0; l < rows.length; l++) {
                                                const children = rows[l].children;
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
                                                                const result = columns[m].findIndex((item, index) => (index >= l && item.bounds.width === bounds.width && index < columns[m].length - 1));
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
                                            const nextMapX = mapX[nodeY.depth + 2];
                                            const nextCoordsX = (nextMapX ? Object.keys(nextMapX) : []);
                                            if (nextCoordsX.length > 1) {
                                                const columnRight = [];
                                                for (let l = 0; l < nextCoordsX.length; l++) {
                                                    const nextAxisX = nextMapX[nextCoordsX[l]].sortAsc('bounds.top');
                                                    columnRight[l] = (l === 0 ? Number.MIN_VALUE : columnRight[l - 1]);
                                                    for (let m = 0; m < nextAxisX.length; m++) {
                                                        const nextX = nextAxisX[m];
                                                        if (nextX.parent.parent && nodeY.id === nextX.parent.parent.id) {
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
                                            nodeY.gridColumnEnd = columnEnd;
                                            nodeY.gridColumnCount = (SETTINGS.useLayoutWeight ? columns[0].length : columns.length);
                                            xml += this.writeGridLayout(nodeY, parent, nodeY.gridColumnCount);
                                            for (let l = 0, count = 0; l < columns.length; l++) {
                                                let spacer = 0;
                                                for (let m = 0, start = 0; m < columns[l].length; m++) {
                                                    const node = columns[l][m];
                                                    if (!node.spacer) {
                                                        node.parent.hide();
                                                        node.parent = nodeY;
                                                        if (SETTINGS.useLayoutWeight) {
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
                                    }
                                    if (!nodeY.renderParent) {
                                        const children = new this.NODELIST(nodeY.children);
                                        const [linearX, linearY] = [children.linearX, children.linearY];
                                        if (!nodeY.flex.enabled && linearX && linearY) {
                                            xml += this.writeFrameLayout(nodeY, parent);
                                        }
                                        else if ((!nodeY.flex.enabled || nodeY.children.every((item) => item.flex.enabled)) && (linearX || linearY)) {
                                            xml += this.writeLinearLayout(nodeY, parent, linearY);
                                        }
                                        else {
                                            xml += this.writeDefaultLayout(nodeY, parent);
                                        }
                                    }
                                }
                                else {
                                    continue;
                                }
                            }
                            if (!nodeY.renderParent) {
                                if (parent.is(NODE_STANDARD.GRID)) {
                                    let siblings;
                                    if (SETTINGS.useLayoutWeight) {
                                        siblings = new this.NODELIST(nodeY.gridSiblings);
                                    }
                                    else {
                                        const columnEnd = parent.gridColumnEnd[nodeY.gridIndex + nodeY.gridColumnSpan];
                                        siblings = nodeY.parentOriginal.children.filter((item) => !item.renderParent && item.bounds.left >= nodeY.bounds.right && item.bounds.right <= columnEnd);
                                    }
                                    if (siblings.length > 0) {
                                        siblings.unshift(nodeY);
                                        siblings.sortAsc('bounds.x');
                                        const renderParent = parent;
                                        const wrapper = this.viewHandler.createWrapper(nodeY, parent, siblings);
                                        this.cache.push(wrapper);
                                        if (siblings.linearX || siblings.linearY) {
                                            xml += this.writeLinearLayout(wrapper, renderParent, siblings.linearY);
                                        }
                                        else {
                                            xml += this.writeDefaultLayout(wrapper, renderParent);
                                        }
                                        k--;
                                        restart = true;
                                    }
                                }
                                if (!nodeY.renderParent && !restart) {
                                    xml += this.writeViewTag(nodeY, parent, tagName);
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
                    output = output.replace(`{${id}}`, views.join(''));
                }
            }
            return output;
        }
        setResources() {
            this.resource.setBoxSpacing();
            this.resource.setBoxStyle();
            this.resource.setFontStyle();
            this.resource.setValueString();
            this.resource.setOptionArray();
            this.resource.setImageSource();
        }
        replaceInlineAttributes(output) {
            const options = {};
            for (const node of this.cache.visible) {
                output = this.viewHandler.replaceInlineAttributes(output, node, options);
            }
            return output.replace('{@0}', this.viewHandler.getRootAttributes(options));
        }
        writeFrameLayout(node, parent) {
            return this.viewHandler.renderLayout(node, parent, NODE_STANDARD.FRAME);
        }
        writeLinearLayout(node, parent, vertical) {
            return this.viewHandler.renderLayout(node, parent, NODE_STANDARD.LINEAR, { android: { orientation: (vertical ? 'vertical' : 'horizontal') } });
        }
        writeGridLayout(node, parent, columnCount) {
            return this.viewHandler.renderLayout(node, parent, NODE_STANDARD.GRID, { android: { columnCount: columnCount.toString() } });
        }
        writeRelativeLayout(node, parent) {
            return this.viewHandler.renderLayout(node, parent, NODE_STANDARD.RELATIVE);
        }
        writeConstraintLayout(node, parent) {
            return this.viewHandler.renderLayout(node, parent, NODE_STANDARD.CONSTRAINT);
        }
        writeDefaultLayout(node, parent) {
            if (SETTINGS.useConstraintLayout || node.flex.enabled) {
                return this.writeConstraintLayout(node, parent);
            }
            else {
                return this.writeRelativeLayout(node, parent);
            }
        }
        writeViewTag(node, parent, tagName) {
            return this.viewHandler.renderTag(node, parent, tagName);
        }
    }

    class Node {
        constructor(id, element, options) {
            this.id = id;
            this.element = element;
            this.depth = -1;
            this.style = {};
            this.styleMap = {};
            this.visible = true;
            this.parentIndex = Number.MAX_VALUE;
            this._namespaces = new Set();
            Object.assign(this, options);
            if (element != null || (options != null && options.element != null)) {
                if (this.element instanceof HTMLElement) {
                    const style = getComputedStyle(this.element);
                    const styleMap = this.element.__styleMap || {};
                    for (const inline of this.element.style) {
                        styleMap[hyphenToCamelCase(inline)] = this.element.style[inline];
                    }
                    this.style = style;
                    this.styleMap = styleMap;
                }
                this.element.__node = this;
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
            return this;
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
            return this;
        }
        render(parent) {
            this.renderParent = parent;
            this.renderDepth = (parent.id === 0 ? 0 : parent.renderDepth + 1);
            return this;
        }
        hide() {
            this.renderParent = true;
            this.visible = false;
            return this;
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
                node.children.forEach((item) => current.push(...cascade(item)));
                return current;
            }
            return cascade(this);
        }
        intersect(rect, dimension = 'bounds') {
            const top = (rect.top >= this[dimension].top && rect.top < this[dimension].bottom);
            const bottom = (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom);
            const left = (rect.left >= this[dimension].left && rect.left < this[dimension].right);
            const right = (rect.right > this[dimension].left && rect.right <= this[dimension].right);
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
                this.styleMap[attr] = (hasValue(value) ? value : null);
                return this;
            }
            else {
                return this.styleMap[attr] || this.style[attr];
            }
        }
        setBounds(calibrate = false, element = null) {
            if (!calibrate) {
                this.bounds = (element != null ? getRangeBounds(element) : JSON.parse(JSON.stringify(this.element.getBoundingClientRect())));
            }
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
        expandDimensions() {
            let [width, height] = [Math.max.apply(null, this.children.map((item) => item.linear.right)), Math.max.apply(null, this.children.map((item) => item.linear.bottom))];
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
        get parentElement() {
            return this.element.parentElement;
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
        get namespaces() {
            return Array.from(this._namespaces);
        }
        set tagName(value) {
            this._tagName = value;
        }
        get tagName() {
            return this._tagName || (this.element != null ? this.element.tagName : '');
        }
        get nodeName() {
            return this.tagName;
        }
        get flex() {
            if (this._flex == null) {
                const parent = this.element && this.element.parentElement.__node;
                this._flex = {
                    parent,
                    enabled: (this.style.display && this.style.display.indexOf('flex') !== -1),
                    direction: this.style.flexDirection,
                    basis: this.style.flexBasis,
                    grow: convertInt(this.style.flexGrow),
                    shrink: convertInt(this.style.flexShrink),
                    wrap: this.style.flexWrap,
                    alignSelf: (parent && parent.styleMap.alignItems != null && (this.styleMap.alignSelf == null || this.style.alignSelf === 'auto') ? parent.styleMap.alignItems : this.style.alignSelf),
                    justifyContent: this.style.justifyContent,
                    order: convertInt(this.style.order)
                };
            }
            return this._flex;
        }
        get floating() {
            return (this.styleMap.float === 'left' || this.styleMap.float === 'right');
        }
        get fixed() {
            return (this.style.display === 'fixed');
        }
        get overflow() {
            if (this._overflow == null) {
                let value = 0 /* NONE */;
                if (this.style.overflow === 'scroll' || (this.style.overflowX === 'auto' && this.element.clientWidth !== this.element.scrollWidth)) {
                    value |= 2 /* HORIZONTAL */;
                }
                if (this.style.overflow === 'scroll' || (this.style.overflowY === 'auto' && this.element.clientHeight !== this.element.scrollHeight)) {
                    value |= 4 /* VERTICAL */;
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
        get marginBottom() {
            return convertInt(this.css('marginBottom'));
        }
        get marginLeft() {
            return convertInt(this.css('marginLeft'));
        }
        get marginRight() {
            return convertInt(this.css('marginRight'));
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
        get paddingBottom() {
            return convertInt(this.css('paddingBottom'));
        }
        get paddingLeft() {
            return convertInt(this.css('paddingLeft'));
        }
        get paddingRight() {
            return convertInt(this.css('paddingRight'));
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

    var API_ANDROID = {
        [exports.build.OREO]: {
            android: ['fontWeight'],
            customizations: {}
        },
        [exports.build.JELLYBEAN_1]: {
            android: ['labelFor'],
            customizations: {}
        },
        [exports.build.LOLLIPOP]: {
            android: ['layout_columnWeight'],
            customizations: {
                'Button': {
                    android: {
                        textAllCaps: 'false'
                    }
                }
            }
        }
    };

    class Widget extends Node {
        constructor(id, api, element, options) {
            super(id, element, options);
            this.id = id;
            this.api = api;
            this.constraint = {};
            this.children = [];
            this.renderChildren = [];
            this.linearRows = [];
        }
        static getTagName(tagName) {
            return NODE_ANDROID[NODE_STANDARD[tagName]];
        }
        add(obj, attr, value = '', overwrite = true) {
            if (hasValue(attr) && !this.supported(obj, attr)) {
                return false;
            }
            return super.add(obj, attr, value, overwrite);
        }
        android(attr, value = '', overwrite = true) {
            switch (arguments.length) {
                case 0:
                    return this._android;
                case 1:
                    return this._android && this._android[attr];
                default:
                    this.add('android', attr, value, overwrite);
                    return this;
            }
        }
        app(attr, value = '', overwrite = true) {
            switch (arguments.length) {
                case 0:
                    return this._app;
                case 1:
                    return this._app && this._app[attr];
                default:
                    this.add('app', attr, value, overwrite);
                    return this;
            }
        }
        attr(value, overwrite = true) {
            const match = value.match(/^(?:([a-z]+):)?(\w+)="((?:@+?[a-z]+\/)?.+)"$/);
            if (match != null) {
                this.add(match[1] || '_', match[2], match[3], overwrite);
            }
            return this;
        }
        render(parent) {
            if (parent.is(NODE_STANDARD.LINEAR)) {
                switch (this.nodeName) {
                    case NODE_ANDROID.LINEAR:
                    case NODE_ANDROID.RADIO_GROUP:
                        parent.linearRows.push(this);
                        break;
                }
            }
            super.render(parent);
            return this;
        }
        anchor(position, adjacent = {}, orientation = '') {
            const overwrite = (adjacent.stringId === 'parent');
            switch (this.renderParent.nodeName) {
                case NODE_ANDROID.CONSTRAINT:
                    if (arguments.length === 1) {
                        return this.app(position);
                    }
                    this.app(position, adjacent.stringId, overwrite);
                    break;
                case NODE_ANDROID.RELATIVE:
                    if (arguments.length === 1) {
                        return this.android(position);
                    }
                    this.android(position, adjacent.stringId, overwrite);
                    break;
            }
            if (orientation !== '') {
                this.constraint[orientation] = true;
            }
            return this;
        }
        modifyBox(area, offset) {
            for (const key of Object.keys(BOX_STANDARD)) {
                if ((area & BOX_STANDARD[key]) === BOX_STANDARD[key]) {
                    const dimension = parseRTL(BOX_ANDROID[key]);
                    const total = formatPX(offset + convertInt(this.android(dimension)));
                    this.css(dimension, total)
                        .android(dimension, total);
                }
            }
            this.setBounds(true);
            return this;
        }
        supported(obj, attr) {
            for (let i = this.api + 1; i < exports.build.OREO_1; i++) {
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
            return result.sort();
        }
        applyCustomizations() {
            const api = API_ANDROID[this.api];
            if (api != null) {
                const customizations = api.customizations[this.nodeName];
                if (customizations != null) {
                    for (const obj in customizations) {
                        for (const attr in customizations[obj]) {
                            this.add(obj, attr, customizations[obj][attr], false);
                        }
                    }
                }
            }
        }
        inheritStyle(node) {
            const style = [];
            for (const attr in node.style) {
                if (indexOf(attr.toLowerCase(), 'font', 'color')) {
                    this.style[attr] = node.style[attr];
                }
            }
        }
        is(...views) {
            for (const value of views) {
                if (this.nodeName === Widget.getTagName(value)) {
                    return true;
                }
            }
            return false;
        }
        setAndroidId(nodeName) {
            this.androidWidgetName = nodeName || this.nodeName;
            if (this.androidId == null) {
                const element = this.element || {};
                this.androidId = generateId('android', element.id || element.name || `${this.androidWidgetName.substring(this.androidWidgetName.lastIndexOf('.') + 1).toLowerCase()}_1`);
                this.android('id', this.stringId);
            }
        }
        setAndroidDimensions(options) {
            const styleMap = this.styleMap;
            let parent;
            let width;
            let height;
            let requireWrap;
            if (options != null) {
                parent = options.parent;
                [width, height] = [options.width, options.height];
                requireWrap = options.requireWrap;
            }
            else {
                parent = this.parent;
                width = this.element.offsetWidth + this.marginLeft + this.marginRight;
                height = this.element.offsetHeight + this.marginTop + this.marginBottom;
                requireWrap = parent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.GRID);
            }
            const parentWidth = (parent.element != null ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + convertInt(parent.style.borderLeftWidth) + convertInt(parent.style.borderRightWidth)) : Number.MAX_VALUE);
            const parentHeight = (parent.element != null ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + convertInt(parent.style.borderTopWidth) + convertInt(parent.style.borderBottomWidth)) : Number.MAX_VALUE);
            if (this.overflow !== 0 /* NONE */ && !this.is(NODE_STANDARD.TEXT)) {
                this.android('layout_width', (this.horizontal ? 'wrap_content' : 'match_parent'))
                    .android('layout_height', (this.horizontal ? 'match_parent' : 'wrap_content'));
            }
            else {
                if (this.android('layout_width') !== '0px') {
                    if (hasValue(styleMap.width)) {
                        this.android('layout_width', convertPX(styleMap.width));
                    }
                    if (hasValue(styleMap.minWidth)) {
                        this.android('layout_width', 'wrap_content', false)
                            .android('minWidth', convertPX(styleMap.minWidth), false);
                    }
                    if (hasValue(styleMap.maxWidth)) {
                        this.android('maxWidth', convertPX(styleMap.maxWidth), false);
                    }
                }
                if ((!this.flex.enabled || this.constraint.expand) && this.constraint.layoutWidth != null) {
                    if (this.constraint.layoutWidth) {
                        this.android('layout_width', (this.renderChildren.some((node) => node.css('float') === 'right') || convertInt(this.bounds.minWidth) >= parentWidth ? 'match_parent' : this.bounds.minWidth));
                    }
                    else {
                        this.android('layout_width', 'wrap_content', false);
                    }
                }
                else if (this.android('layout_width') == null) {
                    if (requireWrap) {
                        this.android('layout_width', 'wrap_content');
                    }
                    else {
                        if (FIXED_ANDROID.includes(this.nodeName)) {
                            this.android('layout_width', 'wrap_content');
                        }
                        else {
                            if (parent.overflow === 0 /* NONE */ && width >= parentWidth) {
                                this.android('layout_width', 'match_parent');
                            }
                            else {
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
                    if (styleMap.height != null || styleMap.lineHeight != null) {
                        this.android('layout_height', convertPX(styleMap.height || styleMap.lineHeight));
                    }
                    if (hasValue(styleMap.minHeight)) {
                        this.android('layout_height', 'wrap_content', false)
                            .android('minHeight', convertPX(styleMap.minHeight), false);
                    }
                    if (hasValue(styleMap.maxHeight)) {
                        this.android('maxHeight', convertPX(styleMap.maxHeight), false);
                    }
                }
                if ((!this.flex.enabled || this.constraint.expand) && this.constraint.layoutHeight != null) {
                    this.android('layout_height', (this.constraint.layoutHeight ? this.bounds.minHeight : 'wrap_content'), this.constraint.layoutHeight);
                }
                else if (this.android('layout_height') == null) {
                    this.android('layout_height', (!requireWrap && (parent.id !== 0 && parent.overflow === 0 /* NONE */) && height >= parentHeight && !FIXED_ANDROID.includes(this.nodeName) ? 'match_parent' : 'wrap_content'));
                }
            }
            if (this.gridRowSpan > 1) {
                this.android('layout_rowSpan', this.gridRowSpan.toString());
            }
            if (this.gridColumnSpan > 1) {
                this.android('layout_columnSpan', this.gridColumnSpan.toString());
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
                        this.delete('android', `${value}*`)
                            .android(value, formatPX(top));
                    }
                    else {
                        if (top !== 0 && top === bottom) {
                            this.delete('android', `${value}Top`, `${value}Bottom`)
                                .android(`${value}Vertical`, formatPX(top));
                        }
                        if (left !== 0 && left === right) {
                            this.delete('android', leftRtl, rightRtl)
                                .android(`${value}Horizontal`, formatPX(left));
                        }
                    }
                });
            }
        }
        setGravity() {
            const verticalAlign = this.styleMap.verticalAlign;
            let textAlign = '';
            let element = this.element;
            while (element && element.__styleMap != null) {
                textAlign = element.__styleMap.textAlign || textAlign;
                const float = (element !== this.element ? element.__styleMap.float : '');
                if (float === 'left' || float === 'right' || hasValue(textAlign)) {
                    break;
                }
                element = element.parentElement;
            }
            if (hasValue(verticalAlign) || hasValue(textAlign)) {
                let horizontal = '';
                let vertical = '';
                const layoutGravity = [];
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
                const parentTextAlign = (this.styleMap.textAlign !== textAlign && !this.renderParent.floating && !this.floating);
                switch (this.renderParent.nodeName) {
                    case NODE_ANDROID.RADIO_GROUP:
                    case NODE_ANDROID.LINEAR:
                        if (parentTextAlign) {
                            this.renderParent.android('gravity', horizontal);
                        }
                        break;
                    case NODE_ANDROID.CONSTRAINT:
                    case NODE_ANDROID.RELATIVE:
                        const gravity = [vertical, horizontal].filter(value => value);
                        this.android('gravity', (gravity.length === 2 ? 'center' : gravity[0]));
                        horizontal = '';
                        vertical = '';
                        break;
                    case NODE_ANDROID.GRID:
                        if (parentTextAlign && horizontal !== '') {
                            layoutGravity.push(horizontal);
                        }
                        break;
                }
                if (vertical !== '' || layoutGravity.length > 0) {
                    layoutGravity.push(vertical);
                    this.android('layout_gravity', (layoutGravity.length === 2 ? 'center' : layoutGravity[0]));
                }
                if (horizontal !== '') {
                    this.android('gravity', horizontal);
                }
            }
        }
        distributeWeight(horizontal, percent) {
            this.android(`layout_${(horizontal ? 'width' : 'height')}`, '0px')
                .android('layout_weight', (percent / 100).toFixed(2));
        }
        setAccessibility() {
            const element = this.element;
            const nextElement = element.nextElementSibling;
            let labeled = false;
            if (element.tagName === 'INPUT' && nextElement && nextElement.htmlFor === element.id) {
                const node = nextElement.__node;
                node.setAndroidId(NODE_ANDROID.TEXT);
                this.css('marginRight', node.style.marginRight)
                    .css('paddingRight', node.style.paddingRight)
                    .label = node;
                node.hide()
                    .labelFor = this;
                labeled = true;
            }
            switch (this.nodeName) {
                case NODE_ANDROID.EDIT:
                    if (!labeled) {
                        let parent = this.renderParent;
                        let current = this;
                        let label = null;
                        while (parent && parent.renderChildren != null) {
                            const index = parent.renderChildren.findIndex((item) => item === current);
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
                    this.android('focusable', 'true');
                    break;
            }
        }
        get stringId() {
            return (this.androidId != null ? `@+id/${this.androidId}` : '');
        }
        get nodeName() {
            if (this.androidWidgetName != null) {
                return this.androidWidgetName;
            }
            else {
                let value = MAPPING_CHROME[this.tagName];
                if (typeof value === 'object') {
                    value = value[this.element.type];
                }
                return Widget.getTagName(value);
            }
        }
        set label(value) {
            this._label = value;
            value.labelFor = this;
        }
        get label() {
            return this._label;
        }
        get horizontal() {
            return (this._android && this._android.orientation === 'horizontal');
        }
        get anchored() {
            return (this.constraint.horizontal && this.constraint.vertical);
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

    class NodeList extends Array {
        constructor(nodes, parent = null) {
            super();
            this.parent = parent;
            if (Array.isArray(nodes)) {
                this.push(...nodes);
            }
            this.parent = parent;
        }
        push(...value) {
            for (const node of value) {
                super.push(node);
            }
            return this.length;
        }
        sortAsc(...attr) {
            return sortAsc(this, ...attr);
        }
        sortDesc(...attr) {
            return sortDesc(this, ...attr);
        }
        intersect(dimension = 'linear') {
            for (const node of this) {
                if (this.some(item => (item !== node && node.intersect(item[dimension])))) {
                    return true;
                }
            }
            return false;
        }
        get visible() {
            return this.filter(node => node.visible);
        }
        get elements() {
            return this.filter(node => node.element != null);
        }
        get first() {
            return (this.length > 0 ? this[0] : null);
        }
        get last() {
            return (this.length > 0 ? this[this.length - 1] : null);
        }
        get nextId() {
            return this.length + 1;
        }
        get linearX() {
            if (this.length > 0 && !this.intersect()) {
                if (this.length > 1) {
                    const minBottom = Math.min.apply(null, this.map((item) => item.linear.bottom));
                    return !this.some(item => item.linear.top >= minBottom);
                }
                return true;
            }
            return false;
        }
        get linearY() {
            if (this.length > 0 && !this.intersect()) {
                if (this.length > 1) {
                    const minRight = Math.min.apply(null, this.map((item) => item.linear.right));
                    return !this.some(item => item.linear.left >= minRight);
                }
                return true;
            }
            return false;
        }
    }

    class WidgetList extends NodeList {
        constructor(nodes, parent) {
            super(nodes, parent);
        }
        get anchors() {
            return this.filter(node => node.anchored);
        }
        get horizontalBias() {
            if (this.parent != null) {
                const left = this.first.linear.left - this.parent.box.left;
                const right = this.parent.box.right - this.last.linear.right;
                return calculateBias(left, right);
            }
            return 0.5;
        }
        get verticalBias() {
            if (this.parent != null) {
                const top = this.first.linear.top - this.parent.box.top;
                const bottom = this.parent.box.bottom - this.last.linear.bottom;
                return calculateBias(top, bottom);
            }
            return 0.5;
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
        const hsl = convertHextoHSL(value);
        if (hsl != null) {
            const result = HSL_SORTED.slice();
            result.push({ name: '', hsl });
            result.sort(sortHSL);
            const index = result.findIndex((item) => item.name === '');
            return result[Math.min(index + 1, result.length - 1)];
        }
        return null;
    }
    function getByColorName(value) {
        for (const color in X11_CSS3) {
            if (color.toLowerCase() === value.toLowerCase()) {
                return X11_CSS3[color];
            }
        }
        return null;
    }
    function convertRGB({ rgb }) {
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
    function parseRGBA(value) {
        const match = value.match(/rgb(?:a)?\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})(?:, ([0-9]{1,3}))?\)/);
        if (match && match.length >= 4) {
            return [match[0], `#${convertRGBtoHex(match[1])}${convertRGBtoHex(match[2])}${convertRGBtoHex(match[3])}`, match[4] || '1'];
        }
        return null;
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

    class Resource {
        constructor(cache) {
            this.cache = cache;
        }
        static addResourceString(value, name) {
            if (!hasValue(name)) {
                name = value;
            }
            if (hasValue(value)) {
                const num = isNumber(value);
                if (SETTINGS.numberResourceValue || !num) {
                    for (const [storedValue, storedName] of Resource.STORED.STRINGS.entries()) {
                        if (storedValue === value) {
                            return storedValue;
                        }
                    }
                    name = name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').split('_').slice(0, 5).join('_').replace(/_+$/g, '');
                    if (num || /^[0-9].*/.test(value)) {
                        name = `__${name}`;
                    }
                    Resource.STORED.STRINGS.set(value, name);
                }
                return value;
            }
            return null;
        }
        static addResourceImage(value) {
            if (hasValue(value)) {
                const image = value.substring(value.lastIndexOf('/') + 1);
                const format = image.substring(image.lastIndexOf('.') + 1).toLowerCase();
                let src = image.replace(/.\w+$/, '');
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
                        src = Resource.insertStoredAsset('IMAGES', src, value);
                        break;
                    default:
                        src = null;
                }
                return src;
            }
            return null;
        }
        static addResourceColor(value, hex = true) {
            value = value.toUpperCase().trim();
            if (value !== '') {
                let colorName = '';
                if (!Resource.STORED.COLORS.has(value)) {
                    const color = findNearestColor(value);
                    if (color != null) {
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
                return (hex ? [colorName, value] : colorName);
            }
            return null;
        }
        static insertStoredAsset(asset, name, value) {
            const stored = Resource.STORED[asset];
            if (stored != null) {
                let storedName = '';
                if (isNumber(name)) {
                    name = `__${name}`;
                }
                if (hasValue(value)) {
                    let i = 0;
                    do {
                        storedName = name;
                        if (i > 0) {
                            storedName += i;
                        }
                        if (!stored.has(storedName)) {
                            stored.set(storedName, value);
                        }
                        i++;
                    } while (stored.has(storedName) && stored.get(storedName) !== value);
                }
                return storedName;
            }
            return null;
        }
        setBoxSpacing() {
            for (const node of this.cache.elements) {
                const element = node.element;
                const result = getBoxSpacing(element);
                for (const i in result) {
                    result[i] += 'px';
                }
                element.__boxSpacing = result;
            }
        }
        setBoxStyle() {
            for (const node of this.cache.elements) {
                const element = node.element;
                const result = {
                    border: this.parseBorderStyle,
                    borderTop: this.parseBorderStyle,
                    borderRight: this.parseBorderStyle,
                    borderBottom: this.parseBorderStyle,
                    borderLeft: this.parseBorderStyle,
                    borderRadius: this.parseBoxDimensions,
                    backgroundColor: parseRGBA,
                    backgroundImage: this.parseImageURL,
                    backgroundSize: this.parseBoxDimensions
                };
                let backgroundParent = [];
                if (element.parentElement != null) {
                    backgroundParent = parseRGBA(getStyle(element.parentElement).backgroundColor);
                }
                const style = getStyle(element);
                for (const i in result) {
                    result[i] = result[i](style[i]);
                }
                result.border[2] = Resource.addResourceColor(result.border[2], false);
                if (backgroundParent[0] === result.backgroundColor[0] || result.backgroundColor[4] === 0 || (SETTINGS.excludeBackgroundColor && SETTINGS.excludeBackgroundColor.includes(convertRGBtoHex(result.backgroundColor[0])))) {
                    result.backgroundColor = null;
                }
                else {
                    result.backgroundColor = (!SETTINGS.excludeBackgroundColor.includes(result.backgroundColor[1]) ? Resource.addResourceColor(result.backgroundColor[1]) : null);
                }
                element.__boxStyle = result;
            }
        }
        setFontStyle() {
            for (const node of this.cache.elements) {
                if ((node.visible || node.labelFor != null) && node.renderChildren.length === 0) {
                    const element = node.element;
                    const style = getStyle(element);
                    const color = parseRGBA(style.color);
                    const backgroundColor = parseRGBA(style.backgroundColor);
                    const result = {
                        fontFamily: style.fontFamily,
                        fontStyle: style.fontStyle,
                        fontSize: style.fontSize,
                        fontWeight: style.fontWeight,
                        color: (color != null ? Resource.addResourceColor(color[1]) : null),
                        backgroundColor: (color != null ? Resource.addResourceColor(backgroundColor[1]) : null)
                    };
                    element.__fontStyle = result;
                }
            }
        }
        setImageSource() {
            for (const node of this.cache.filter((item) => item.tagName === 'IMG')) {
                const element = node.element;
                const result = Resource.addResourceImage(element.src);
                element.__imageSource = result;
            }
        }
        setOptionArray() {
            for (const node of this.cache.filter((item) => item.tagName === 'SELECT')) {
                const element = node.element;
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
                            const result = Resource.addResourceString(value);
                            if (result != null) {
                                stringArray.push(result);
                            }
                        }
                    }
                }
                element.__optionArray = { stringArray: (stringArray.length > 0 ? stringArray : null), numberArray: (numberArray != null && numberArray.length > 0 ? numberArray : null) };
            }
        }
        setValueString() {
            for (const node of this.cache.elements) {
                const element = node.element;
                let name = '';
                let value = '';
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    value = element.value.trim();
                }
                else if (element.nodeName === '#text') {
                    value = element.textContent.trim();
                }
                else if (element.children.length === 0 || Array.from(element.children).every((item) => INLINE_CHROME.includes(item.tagName))) {
                    name = element.innerText.trim();
                    value = element.innerHTML.trim();
                }
                if (hasValue(value)) {
                    Resource.addResourceString(value, name);
                    element.__valueString = value;
                }
            }
        }
        parseBorderStyle(value) {
            const stroke = value.match(/(none|dotted|dashed|solid)/);
            const width = value.match(/([0-9.]+(?:px|pt|em))/);
            const color = parseRGBA(value);
            return [(stroke != null ? stroke[1] : 'solid'), (width != null ? convertPX(width[1]) : '1px'), (color != null ? color[1] : '#000')];
        }
        parseBoxDimensions(value) {
            const match = value.match(/^([0-9]+(?:px|pt|em))( [0-9]+(?:px|pt|em))?( [0-9]+(?:px|pt|em))?( [0-9]+(?:px|pt|em))?$/);
            if (match != null) {
                if (match[1] === '0px' && match[2] == null) {
                    return [];
                }
                if (match[2] == null || (match[1] === match[2] && match[2] === match[3] && match[3] === match[4])) {
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
        parseImageURL(value) {
            const match = value.match(/^url\("(.*?)"\)$/);
            if (match != null) {
                return Resource.addResourceImage(match[1]);
            }
            return null;
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
            match = pattern.exec(template);
        } while (true);
        return result;
    }
    function parseTemplateData(template, data, index = null, include = {}, exclude = {}) {
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
            let match = null;
            while ((match = pattern.exec(output)) != null) {
                if (include[match[1]]) {
                    const attribute = `{#${match[1]}=${match[2]}}`;
                    if (data[match[2]] != null) {
                        output = output.replace(attribute, data[match[2]]);
                    }
                    else {
                        output = output.replace(attribute, match[2]);
                    }
                }
                else if (exclude[match[1]]) {
                    output = output.replace(match[0], '');
                }
            }
        }
        return output.replace(/\s+[\w:]+="{@\w+}"/g, '');
    }

    const template = [
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
    var STRING_TMPL = template.join('\n');

    const template$1 = [
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
    var STRINGARRAY_TMPL = template$1.join('\n');

    const template$2 = [
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
    var STYLE_TMPL = template$2.join('\n');

    const template$3 = [
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
    var FONT_TMPL = template$3.join('\n');

    const template$4 = [
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
    var COLOR_TMPL = template$4.join('\n');

    const template$5 = [
        '!0',
        '{value}',
        '<!-- filename: {name} -->',
        '!0'
    ];
    var DRAWABLE_TMPL = template$5.join('\n');

    const template$6 = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">',
        '!1',
        '	<stroke android:width="{&width}" {borderStyle} />',
        '!1',
        '!2',
        '!3',
        '	<solid android:color="{&color}" />',
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
    var SHAPERECTANGLE_TMPL = template$6.join('\n');

    const template$7 = [
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
        '			<solid android:color="{&color}" />',
        '!3',
        '!4',
        '			<corners android:radius="{&radius}" />',
        '!4',
        '!5',
        '			<corners android:topLeftRadius="{&topLeftRadius}" android:topRightRadius="{&topRightRadius}" android:bottomRightRadius="{&bottomRightRadius}" android:bottomLeftRadius="{&bottomLeftRadius}" />',
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
    var LAYERLIST_TMPL = template$7.join('\n');

    const STORED = {
        ARRAYS: new Map(),
        FONTS: new Map(),
        DRAWABLES: new Map(),
        STYLES: new Map()
    };
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
            'paddingLeft': 'android:paddingLeft="{0}"',
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
    class ResourceWidget extends Resource {
        constructor(cache) {
            super(cache);
        }
        setBoxSpacing() {
            super.setBoxSpacing();
            for (const node of this.cache.elements) {
                const element = node.element;
                if (element.__boxSpacing != null) {
                    const stored = Object.assign({}, element.__boxSpacing);
                    const method = METHOD_ANDROID['boxSpacing'];
                    for (const i in stored) {
                        node.attr(formatString(parseRTL(method[i]), stored[i]));
                    }
                }
            }
        }
        setBoxStyle() {
            super.setBoxStyle();
            for (const node of this.cache.elements) {
                const element = node.element;
                if (element.__boxStyle != null) {
                    const stored = Object.assign({}, element.__boxStyle);
                    const method = METHOD_ANDROID['boxStyle'];
                    const borderStyle = {
                        black: 'android:color="@android:color/black"',
                        solid: `android:color="@color/${stored.border[2]}"`
                    };
                    borderStyle.dotted = `${borderStyle.solid} android:dashWidth="3px" android:dashGap="1px"`;
                    borderStyle.dashed = `${borderStyle.solid} android:dashWidth="1px" android:dashGap="1px"`;
                    borderStyle.default = borderStyle[stored.border[0]] || borderStyle.black;
                    if (stored.border[0] !== 'none') {
                        let template = null;
                        let data = null;
                        let resourceName = '';
                        if (stored.backgroundColor == null && stored.backgroundImage == null && stored.borderRadius.length === 0) {
                            template = parseTemplateMatch(SHAPERECTANGLE_TMPL);
                            data = {
                                '0': [{
                                        '1': [{ width: stored.border[1], borderStyle: borderStyle.default }],
                                        '2': false
                                    }]
                            };
                        }
                        else {
                            template = parseTemplateMatch(LAYERLIST_TMPL);
                            data = {
                                '0': [{
                                        '1': [{
                                                '2': [{ width: stored.border[1], borderStyle: borderStyle.default }],
                                                '3': (stored.backgroundColor != null ? [{ color: `@color/${stored.backgroundColor[0]}` }] : false),
                                                '4': (stored.borderRadius.length === 1 ? [{ radius: stored.borderRadius[0] }] : false),
                                                '5': (stored.borderRadius.length > 1 ? [{ topLeftRadius: '' }] : false)
                                            }],
                                        '6': (stored.backgroundImage != null ? [{ image: stored.backgroundImage, width: stored.backgroundSize[0], height: stored.backgroundSize[1] }] : false)
                                    }]
                            };
                            const rootItem = getDataLevel(data, '0');
                            [stored.borderTopWidth, stored.borderRightWidth, stored.borderBottomWidth, stored.borderLeftWidth].forEach((item, index) => {
                                rootItem[['top', 'right', 'bottom', 'left'][index]] = item && item[2];
                            });
                            if (stored.borderRadius.length > 1) {
                                if (stored.borderRadius.length === 2) {
                                    stored.borderRadius.push(...stored.borderRadius.slice());
                                }
                                const borderRadiusItem = getDataLevel(data, '0', '1', '5');
                                stored.borderRadius.forEach((value, index) => borderRadiusItem[`${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius`] = value);
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
                            resourceName = `${node.tagName.toLowerCase()}_${node.androidId}`;
                            STORED.DRAWABLES.set(resourceName, xml);
                        }
                        node.attr(formatString(method['background'], resourceName));
                    }
                    else if (stored.backgroundColor != null) {
                        node.attr(formatString(method['backgroundColor'], stored.backgroundColor[0]));
                    }
                }
            }
        }
        setFontStyle() {
            super.setFontStyle();
            const tagName = {};
            const style = {};
            const layout = {};
            for (const node of this.cache.elements) {
                if (node.element.__fontStyle != null) {
                    if (tagName[node.tagName] == null) {
                        tagName[node.tagName] = [];
                    }
                    tagName[node.tagName].push(node);
                }
            }
            for (const tag in tagName) {
                const nodes = tagName[tag];
                let sorted = [];
                for (let node of nodes) {
                    if (node.labelFor != null) {
                        continue;
                    }
                    let system = false;
                    let labelFor = null;
                    if (node.label != null) {
                        labelFor = node;
                        node = node.label;
                    }
                    const element = node.element;
                    const id = (labelFor || node).id;
                    const stored = Object.assign({}, element.__fontStyle);
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
                    if (stored.color != null) {
                        if (SETTINGS.excludeTextColor && SETTINGS.excludeTextColor.includes(stored.color[1])) {
                            delete stored.color;
                        }
                        else {
                            stored.color = `@color/${stored.color[0]}`;
                        }
                    }
                    if (stored.backgroundColor != null) {
                        if (labelFor != null) {
                            stored.backgroundColor = labelFor.element.__fontStyle.backgroundColor;
                        }
                        if (SETTINGS.excludeBackgroundColor && SETTINGS.excludeBackgroundColor.includes(stored.backgroundColor[1]) || sameAsParent(element, 'backgroundColor')) {
                            delete stored.backgroundColor;
                        }
                        else {
                            stored.backgroundColor = `@color/${stored.backgroundColor[0]}`;
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
                            sorted[i][attr].push(id);
                        }
                    }
                    if (!system) {
                        if (!STORED.FONTS.has(fontFamily)) {
                            STORED.FONTS.set(fontFamily, {});
                        }
                        STORED.FONTS.get(fontFamily)[`${fontStyle}-${fontWeight}`] = true;
                    }
                }
                style[tag] = {};
                layout[tag] = {};
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
                            for (const attr1 in sorted[i]) {
                                if (sorted[i] == null) {
                                    continue;
                                }
                                const ids = sorted[i][attr1];
                                let revalidate = false;
                                if (ids == null || ids.length === 0) {
                                    continue;
                                }
                                else if (ids.length === nodes.length) {
                                    styleKey[attr1] = ids;
                                    sorted[i] = null;
                                    revalidate = true;
                                }
                                else if (ids.length === 1) {
                                    layoutKey[attr1] = ids;
                                    sorted[i] = null;
                                    revalidate = true;
                                }
                                if (!revalidate) {
                                    const found = {};
                                    for (let j = 0; j < sorted.length; j++) {
                                        if (i !== j) {
                                            for (const attr in sorted[j]) {
                                                const compare$$1 = sorted[j][attr];
                                                for (const id of ids) {
                                                    if (compare$$1.includes(id)) {
                                                        if (found[attr] == null) {
                                                            found[attr] = [];
                                                        }
                                                        found[attr].push(id);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    for (const attr2 in found) {
                                        if (found[attr2].length > 1) {
                                            filtered[[attr1, attr2].sort().join(';')] = found[attr2];
                                        }
                                    }
                                }
                            }
                            const combined = {};
                            const deleteKeys = new Set();
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
                            style[tag][shared.join(';')] = styleKey[shared[0]];
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
            for (const name in style) {
                const tag = style[name];
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
                tagData.forEach((item, index) => item.name = `${name.charAt(0) + name.substring(1).toLowerCase()}_${(index + 1)}`);
                resource[name] = tagData;
            }
            const inherit = new Set();
            for (const node of this.cache.elements) {
                if (resource[node.tagName] != null) {
                    const styles = [];
                    for (const item of resource[node.tagName]) {
                        if (item.ids.includes(node.id)) {
                            styles.push(item.name);
                        }
                    }
                    if (styles.length > 0) {
                        inherit.add(styles.join('.'));
                        node.attr(`style="@style/${styles.pop()}"`);
                    }
                }
                const tagData = layout[node.tagName];
                if (tagData != null) {
                    for (const attr in tagData) {
                        if (tagData[attr].includes(node.id)) {
                            node.attr(attr);
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
        }
        setImageSource() {
            super.setImageSource();
            for (const node of this.cache.filter((item) => item.tagName === 'IMG')) {
                const element = node.element;
                if (element.__imageSource != null) {
                    const stored = element.__imageSource;
                    const method = METHOD_ANDROID['imageSource'];
                    node.attr(formatString(method['src'], stored));
                }
            }
        }
        setOptionArray() {
            super.setOptionArray();
            for (const node of this.cache.filter((item) => item.tagName === 'SELECT')) {
                const element = node.element;
                const stringArray = element.__optionArray.stringArray;
                const numberArray = element.__optionArray.numberArray;
                const method = METHOD_ANDROID['optionArray'];
                let result = [];
                if (stringArray != null) {
                    for (const value of stringArray) {
                        const name = Resource.STORED.STRINGS.get(value);
                        result.push((name != null ? `@string/${name}` : value));
                    }
                }
                if (numberArray != null) {
                    result = numberArray;
                }
                const arrayName = `${node.androidId}_array`;
                STORED.ARRAYS.set(arrayName, result);
                node.attr(formatString(method['entries'], arrayName));
            }
        }
        setValueString() {
            super.setValueString();
            for (const node of this.cache.elements) {
                const element = (node.label != null ? node.label.element : node.element);
                if (element.__valueString != null) {
                    const stored = element.__valueString;
                    const method = METHOD_ANDROID['valueString'];
                    const name = Resource.STORED.STRINGS.get(stored);
                    if (node.is(NODE_STANDARD.TEXT)) {
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
                            Resource.STORED.STRINGS.delete(stored);
                            Resource.STORED.STRINGS.set(value, name);
                        }
                    }
                    node.attr(formatString(method['text'], (name != null ? `@string/${name}` : stored)));
                }
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
    }
    function writeResourceStringXml() {
        Resource.STORED.STRINGS = new Map([...Resource.STORED.STRINGS.entries()].sort());
        let xml = '';
        if (Resource.STORED.STRINGS.size > 0) {
            const template = parseTemplateMatch(STRING_TMPL);
            const data = {
                '0': [{
                        '1': []
                    }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name, value] of Resource.STORED.STRINGS.entries()) {
                rootItem['1'].push({ name: value, value: name });
            }
            xml = parseTemplateData(template, data);
        }
        return xml;
    }
    function writeResourceArrayXml() {
        STORED.ARRAYS = new Map([...STORED.ARRAYS.entries()].sort());
        let xml = '';
        if (STORED.ARRAYS.size > 0) {
            const template = parseTemplateMatch(STRINGARRAY_TMPL);
            const data = {
                '0': [{
                        '1': []
                    }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name, values] of STORED.ARRAYS.entries()) {
                const arrayItem = {
                    name,
                    '2': []
                };
                const item = arrayItem['2'];
                for (const text of values) {
                    item.push({ value: text });
                }
                rootItem['1'].push(arrayItem);
            }
            xml = parseTemplateData(template, data);
        }
        return xml;
    }
    function writeResourceStyleXml() {
        let xml = '';
        if (STORED.STYLES.size > 0) {
            const template = parseTemplateMatch(STYLE_TMPL);
            const data = {
                '0': [{
                        '1': []
                    }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name1, style] of STORED.STYLES.entries()) {
                const styleItem = {
                    name1,
                    parent: style.parent || '',
                    '2': []
                };
                style.attributes.split(';').sort().forEach((attr) => {
                    const [name2, value] = attr.split('=');
                    styleItem['2'].push({ name2, value: value.replace(/"/g, '') });
                });
                rootItem['1'].push(styleItem);
            }
            xml = parseTemplateData(template, data);
            if (SETTINGS.useUnitDP) {
                xml = replaceDP(xml, SETTINGS.density, true);
            }
        }
        return xml;
    }
    function writeResourceFontXml() {
        STORED.FONTS = new Map([...STORED.FONTS.entries()].sort());
        let xml = '';
        if (STORED.FONTS.size > 0) {
            const template = parseTemplateMatch(FONT_TMPL);
            for (const [name, font] of STORED.FONTS.entries()) {
                const data = {
                    '#include': {},
                    '#exclude': {},
                    '0': [{
                            name,
                            '1': []
                        }]
                };
                data[(SETTINGS.targetAPI < exports.build.OREO ? '#include' : '#exclude')]['app'] = true;
                const rootItem = getDataLevel(data, '0');
                for (const attr in font) {
                    const [style, weight] = attr.split('-');
                    rootItem['1'].push({
                        style,
                        weight,
                        font: `@font/${name + (style === 'normal' && weight === '400' ? `_${style}` : (style !== 'normal' ? `_${style}` : '') + (weight !== '400' ? `_${FONTWEIGHT_ANDROID[weight] || weight}` : ''))}`
                    });
                }
                xml += '\n\n' + parseTemplateData(template, data);
            }
        }
        return xml.trim();
    }
    function writeResourceColorXml() {
        let xml = '';
        if (Resource.STORED.COLORS.size > 0) {
            Resource.STORED.COLORS = new Map([...Resource.STORED.COLORS.entries()].sort());
            const template = parseTemplateMatch(COLOR_TMPL);
            const data = {
                '0': [{
                        '1': []
                    }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name, value] of Resource.STORED.COLORS.entries()) {
                rootItem['1'].push({ name, value });
            }
            xml = parseTemplateData(template, data);
        }
        return xml;
    }
    function writeResourceDrawableXml() {
        let xml = '';
        if (STORED.DRAWABLES.size > 0 || Resource.STORED.IMAGES.size > 0) {
            const template = parseTemplateMatch(DRAWABLE_TMPL);
            const data = {
                '0': []
            };
            const rootItem = data['0'];
            for (const [name, value] of STORED.DRAWABLES.entries()) {
                rootItem.push({ name: `res/drawable/${name}.xml`, value });
            }
            for (const [name, value] of Resource.STORED.IMAGES.entries()) {
                rootItem.push({ name: `res/drawable/${name + value.substring(value.lastIndexOf('.'))}`, value: `<!-- image: ${value} -->` });
            }
            xml = parseTemplateData(template, data);
            if (SETTINGS.useUnitDP) {
                xml = replaceDP(xml, SETTINGS.density);
            }
        }
        return xml;
    }

    class Element {
        constructor() {
        }
        getEnclosingTag(depth, tagName, id, xml = '', preXml = '', postXml = '') {
            const indent = padLeft(depth);
            let output = preXml +
                `{<${id}}`;
            if (hasValue(xml)) {
                output += indent + `<${tagName}{@${id}}>\n` +
                    xml +
                    indent + `</${tagName}>\n`;
            }
            else {
                output += indent + `<${tagName}{@${id}} />\n`;
            }
            output += `{>${id}}` +
                postXml;
            return output;
        }
    }

    class Layout extends Widget {
        constructor(id, node, parent, children) {
            const options = {
                parent,
                depth: node.depth,
                parentOriginal: node.parentOriginal
            };
            super(id, node.api, null, options);
            if (children != null) {
                this.children = new WidgetList(children);
            }
        }
        setAndroidDimensions() {
            const [width, height] = this.childrenBox;
            const options = {
                parent: this.parentOriginal,
                width,
                height,
                requireWrap: this.parent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.GRID)
            };
            super.setAndroidDimensions(options);
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
            let maxRight = Number.MIN_VALUE;
            let minTop = Number.MAX_VALUE;
            let maxBottom = Number.MIN_VALUE;
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

    class View extends Element {
        constructor(before, after) {
            super();
            this.before = before;
            this.after = after;
        }
        renderLayout(node, parent, tagName, options) {
            let preXml = '';
            let postXml = '';
            let renderParent = parent;
            node.setAndroidId(Widget.getTagName(tagName));
            if (node.overflow !== 0 /* NONE */) {
                const scrollView = [];
                if (node.overflowX) {
                    scrollView.push(NODE_ANDROID.SCROLL_HORIZONTAL);
                }
                if (node.overflowY) {
                    scrollView.push((node.ascend().some((item) => item.overflow !== 0 /* NONE */) ? NODE_ANDROID.SCROLL_NESTED : NODE_ANDROID.SCROLL_VERTICAL));
                }
                let current = node;
                let scrollDepth = parent.renderDepth + scrollView.length;
                scrollView
                    .map(nodeName => {
                    const layout = new Layout(this.cache.nextId, current, null, [current]);
                    const widget = layout;
                    layout.setAndroidId(nodeName);
                    layout.setBounds();
                    layout.inheritGrid(current);
                    layout.android('fadeScrollbars', 'false');
                    this.cache.push(widget);
                    switch (nodeName) {
                        case NODE_ANDROID.SCROLL_HORIZONTAL:
                            layout
                                .css('width', node.styleMap.width)
                                .css('minWidth', node.styleMap.minWidth)
                                .css('overflowX', node.styleMap.overflowX);
                            break;
                        default:
                            layout
                                .css('height', node.styleMap.height)
                                .css('minHeight', node.styleMap.minHeight)
                                .css('overflowY', node.styleMap.overflowY);
                    }
                    const indent = padLeft(scrollDepth--);
                    preXml = indent + `<${nodeName}{@${layout.id}}>\n` + preXml;
                    postXml += indent + `</${nodeName}>\n`;
                    if (current === node) {
                        node.parent = widget;
                        renderParent = widget;
                    }
                    current = widget;
                    return layout;
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
            return this.getEnclosingTag(node.renderDepth, Widget.getTagName(tagName), node.id, `{${node.id}}`, preXml, postXml);
        }
        renderTag(node, parent, tagName, recursive = false) {
            let element = node.element;
            node.setAndroidId(Widget.getTagName(tagName));
            switch (element.tagName) {
                case 'TEXTAREA':
                    element = element;
                    node.android('minLines', '2');
                    if (element.rows > 2) {
                        node.android('maxLines', element.rows.toString());
                    }
                    if (element.maxLength > 0) {
                        node.android('maxLength', element.maxLength.toString());
                    }
                    node.android('hint', element.placeholder)
                        .android('scrollbars', 'vertical')
                        .android('inputType', 'textMultiLine');
                    if (node.overflowX) {
                        node.android('scrollHorizontally', 'true');
                    }
                    break;
            }
            switch (node.nodeName) {
                case NODE_ANDROID.EDIT:
                    node.android('inputType', 'text');
                    break;
                case NODE_ANDROID.BUTTON:
                    if (node.viewWidth === 0) {
                        node.android('minWidth', '0px');
                    }
                    if (node.viewHeight === 0) {
                        node.android('minHeight', '0px');
                    }
                    break;
            }
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
            switch (element.type) {
                case 'radio':
                    if (!recursive) {
                        const result = node.parentOriginal.children.filter((radio) => (radio.element.type === 'radio' && radio.element.name === element.name));
                        let xml = '';
                        if (result.length > 1) {
                            const layout = new Layout(this.cache.nextId, node, parent, result);
                            const widget = layout;
                            let checked = null;
                            this.cache.push(widget);
                            layout.setAndroidId(NODE_ANDROID.RADIO_GROUP);
                            layout.render(parent);
                            for (const radio of result) {
                                layout.inheritGrid(radio);
                                if (radio.element.checked) {
                                    checked = radio;
                                }
                                radio.parent = layout;
                                radio.render(layout);
                                xml += this.renderTag(radio, widget, NODE_STANDARD.RADIO, true);
                            }
                            layout
                                .android('orientation', layout.children.linearX ? 'horizontal' : 'vertical')
                                .android('checkedButton', checked.stringId);
                            layout.setBounds();
                            this.setGridSpace(widget);
                            return this.getEnclosingTag(layout.renderDepth, NODE_ANDROID.RADIO_GROUP, layout.id, xml);
                        }
                    }
                    break;
                case 'password':
                    node.android('inputType', 'textPassword');
                    break;
            }
            node.applyCustomizations();
            node.render(parent);
            node.setGravity();
            node.setAccessibility();
            node.cascade().forEach((item) => item.hide());
            this.setGridSpace(node);
            return this.getEnclosingTag(node.renderDepth, node.nodeName, node.id);
        }
        createWrapper(node, parent, children) {
            const layout = new Layout(this.cache.nextId, node, parent, children);
            for (const child of children) {
                child.parent = layout;
                layout.inheritGrid(child);
            }
            layout.setBounds();
            return layout;
        }
        getStaticTag(tagName, depth, options, width = 'wrap_content', height = 'wrap_content') {
            const node = new Widget(0, SETTINGS.targetAPI);
            node.setAndroidId(Widget.getTagName(tagName));
            let attributes = '';
            if (SETTINGS.showAttributes) {
                node.apply(options)
                    .android('id', node.stringId)
                    .android('layout_width', width)
                    .android('layout_height', height);
                const indent = padLeft(depth + 1);
                attributes = node.combine().map(value => `\n${indent + value}`).join('');
            }
            return [this.getEnclosingTag(depth, node.nodeName, 0).replace('{@0}', attributes), node.stringId];
        }
        replaceInlineAttributes(output, node, options) {
            node.setAndroidDimensions();
            node.namespaces.forEach((value) => options[value] = true);
            return output.replace(`{@${node.id}}`, this.parseAttributes(node));
        }
        getRootAttributes(options) {
            return Object.keys(options).sort().map(value => (XMLNS_ANDROID[value.toUpperCase()] != null ? `\n\t${XMLNS_ANDROID[value.toUpperCase()]}` : '')).join('');
        }
        parseAttributes(node) {
            let output = '';
            const attributes = node.combine();
            if (attributes.length > 0) {
                const indent = padLeft(node.renderDepth + 1);
                for (let i = 0; i < attributes.length; i++) {
                    if (attributes[i].startsWith('android:id=')) {
                        attributes.unshift(...attributes.splice(i, 1));
                        break;
                    }
                }
                output = (node.renderDepth === 0 ? '{@0}' : '') + attributes.map((value) => `\n${indent + value}`).join('');
            }
            return output;
        }
        setGridSpace(node) {
            if (node.parent.is(NODE_STANDARD.GRID)) {
                const dimensions = getBoxSpacing(node.parentOriginal.element, true);
                const options = {
                    android: {
                        layout_columnSpan: node.renderParent.gridColumnCount
                    }
                };
                if (node.gridFirst) {
                    const heightTop = dimensions.paddingTop + dimensions.marginTop;
                    if (heightTop > 0) {
                        this.before(node.id, this.getStaticTag(NODE_STANDARD.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightTop))[0]);
                    }
                }
                if (node.gridRowStart) {
                    let marginLeft = dimensions.marginLeft + dimensions.paddingLeft;
                    if (marginLeft > 0) {
                        marginLeft = convertPX(marginLeft + node.marginLeft);
                        node.css('marginLeft', marginLeft)
                            .android(parseRTL(BOX_ANDROID.MARGIN_LEFT), marginLeft);
                    }
                }
                if (node.gridRowEnd) {
                    const heightBottom = dimensions.marginBottom + dimensions.paddingBottom + (!node.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
                    let marginRight = dimensions.marginRight + dimensions.paddingRight;
                    if (heightBottom > 0) {
                        this.after(node.id, this.getStaticTag(NODE_STANDARD.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightBottom))[0]);
                    }
                    if (marginRight > 0) {
                        marginRight = convertPX(marginRight + node.marginRight);
                        node.css('marginRight', marginRight)
                            .android(parseRTL(BOX_ANDROID.MARGIN_RIGHT), marginRight);
                    }
                }
            }
        }
    }

    const VIEW_BEFORE = {};
    const VIEW_AFTER = {};
    function addViewBefore(id, xml, index = -1) {
        if (VIEW_BEFORE[id] == null) {
            VIEW_BEFORE[id] = [];
        }
        if (index !== -1 && index < VIEW_BEFORE[id].length) {
            VIEW_BEFORE[id].splice(index, 0, xml);
        }
        else {
            VIEW_BEFORE[id].push(xml);
        }
    }
    function addViewAfter(id, xml, index = -1) {
        if (VIEW_AFTER[id] == null) {
            VIEW_AFTER[id] = [];
        }
        if (index !== -1 && index < VIEW_AFTER[id].length) {
            VIEW_AFTER[id].splice(index, 0, xml);
        }
        else {
            VIEW_AFTER[id].push(xml);
        }
    }
    function replaceViewsBeforeAfter(output) {
        for (const id in VIEW_BEFORE) {
            output = output.replace(`{<${id}}`, VIEW_BEFORE[id].join(''));
        }
        for (const id in VIEW_AFTER) {
            output = output.replace(`{>${id}}`, VIEW_AFTER[id].join(''));
        }
        return output;
    }
    const viewHandler = new View(addViewBefore, addViewAfter);

    var NODE_CACHE = new WidgetList();

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
    function setAlignParent(node, orientation = '', bias = false) {
        const map = LAYOUT_MAP.constraint;
        ['horizontal', 'vertical'].forEach((value, index) => {
            if (orientation === '' || value === orientation) {
                node.app(map[(index === 0 ? 'left' : 'top')], 'parent')
                    .app(map[(index === 0 ? 'right' : 'bottom')], 'parent')
                    .constraint[value] = true;
                if (bias) {
                    node.app(`layout_constraint${value.charAt(0).toUpperCase() + value.substring(1)}_bias`, node[`${value}Bias`]);
                }
            }
        });
    }
    function createGuideline(parent, node, orientation = '', opposite = false, percent = -1) {
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
                const [xml, id] = viewHandler.getStaticTag(NODE_STANDARD.GUIDELINE, node.renderDepth, options);
                viewHandler.after(node.id, xml, -1);
                node.app(map[LRTB], id)
                    .delete('app', map[RLBT])
                    .constraint[value] = true;
            }
        });
    }
    function deleteConstraints(node, orientation = '') {
        const map = LAYOUT_MAP.constraint;
        if (orientation === '' || orientation === 'horizontal') {
            node.delete('app', map['leftRight'], map['rightLeft'])
                .constraint.horizontal = false;
        }
        if (orientation === '' || orientation === 'vertical') {
            node.delete('app', map['bottomTop'], map['topBottom'], map['baseline'])
                .constraint.vertical = false;
        }
    }
    function findByAndroidId(id) {
        return NODE_CACHE.find(node => node.android('id') === id);
    }
    function adjustMargins(nodes) {
        for (const node of nodes) {
            if (node.constraint.marginHorizontal != null) {
                const offset = node.linear.left - findByAndroidId(node.constraint.marginHorizontal).linear.right;
                if (offset >= 1) {
                    node.modifyBox(BOX_STANDARD.MARGIN_LEFT, offset);
                }
            }
            if (node.constraint.marginVertical != null) {
                const offset = node.linear.top - findByAndroidId(node.constraint.marginVertical).linear.bottom;
                if (offset >= 1) {
                    node.modifyBox(BOX_STANDARD.MARGIN_TOP, offset);
                }
            }
        }
    }
    function setConstraints() {
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
        for (const node of NODE_CACHE.visible) {
            const nodes = new WidgetList(node.renderChildren, node);
            const constraint = node.is(NODE_STANDARD.CONSTRAINT);
            const relative = node.is(NODE_STANDARD.RELATIVE);
            const flex = node.flex;
            if (nodes.length > 0 && (constraint || relative || flex.enabled)) {
                node.expandDimensions();
                if (node.is(NODE_STANDARD.LINEAR)) {
                    if (node.renderChildren.some((item) => item.flex.direction.indexOf('row') !== -1)) {
                        node.constraint.layoutWidth = true;
                        node.constraint.expand = true;
                    }
                    if (node.renderChildren.some((item) => item.flex.direction.indexOf('column') !== -1)) {
                        node.constraint.layoutHeight = true;
                        node.constraint.expand = true;
                    }
                    continue;
                }
                const LAYOUT = LAYOUT_MAP[(relative ? 'relative' : 'constraint')];
                if (!flex.enabled) {
                    for (const current of nodes) {
                        if (withinRange(parseFloat(current.horizontalBias), 0.5, 0.01) && withinRange(parseFloat(current.verticalBias), 0.5, 0.01)) {
                            if (constraint) {
                                setAlignParent(current);
                            }
                            else {
                                current.android('layout_centerInParent', 'true');
                                current.constraint.horizontal = true;
                                current.constraint.vertical = true;
                            }
                            node.constraint.layoutWidth = true;
                            node.constraint.layoutHeight = true;
                        }
                    }
                    nodes.unshift(node);
                    for (let current of nodes) {
                        for (let adjacent of nodes) {
                            if (current === adjacent) {
                                continue;
                            }
                            else if (constraint) {
                                let bounds1 = current.bounds;
                                let bounds2 = adjacent.bounds;
                                let parent = false;
                                if (current === node || adjacent === node) {
                                    if (current === node) {
                                        current = adjacent;
                                    }
                                    adjacent = { stringId: 'parent' };
                                    bounds1 = current.linear;
                                    bounds2 = node.box;
                                    parent = true;
                                }
                                if (parent) {
                                    if (bounds1.left === bounds2.left) {
                                        current.anchor(LAYOUT['left'], adjacent, 'horizontal');
                                    }
                                    if (withinRange(bounds1.right, bounds2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['right'], adjacent, 'horizontal');
                                    }
                                }
                                else {
                                    if (current.viewWidth === 0 && bounds1.left === bounds2.left && bounds1.right === bounds2.right) {
                                        current.anchor(LAYOUT['left'], adjacent);
                                        current.anchor(LAYOUT['right'], adjacent);
                                    }
                                    else if (!SETTINGS.horizontalPerspective) {
                                        if (bounds1.left === bounds2.left) {
                                            current.anchor(LAYOUT['left'], adjacent);
                                        }
                                        else if (bounds1.right === bounds2.right) {
                                            current.anchor(LAYOUT['right'], adjacent);
                                        }
                                    }
                                    const withinY = (bounds1.top === bounds2.top || bounds1.bottom === bounds2.bottom);
                                    if (withinY && withinRange(bounds1.left, bounds2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['leftRight'], adjacent);
                                    }
                                    if (withinY && withinRange(bounds1.right, bounds2.left, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['rightLeft'], adjacent);
                                    }
                                }
                                if (parent) {
                                    if (bounds1.top === bounds2.top) {
                                        current.anchor(LAYOUT['top'], adjacent, 'vertical');
                                    }
                                    if (bounds1.bottom === bounds2.bottom) {
                                        current.anchor(LAYOUT['bottom'], adjacent, 'vertical');
                                    }
                                }
                                else {
                                    if (current.viewHeight === 0 && bounds1.top === bounds2.top && bounds1.bottom === bounds2.bottom) {
                                        const baseline = (current.is(NODE_STANDARD.TEXT) && current.style.verticalAlign === 'baseline' && adjacent.is(NODE_STANDARD.TEXT) && adjacent.style.verticalAlign === 'baseline');
                                        current.anchor(LAYOUT[(baseline ? 'baseline' : 'top')], adjacent);
                                        current.anchor(LAYOUT['bottom'], adjacent);
                                    }
                                    if (withinRange(bounds1.top, bounds2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                        current.anchor(LAYOUT['topBottom'], adjacent);
                                    }
                                }
                            }
                            else if (relative) {
                                if (current === node) {
                                    continue;
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
                                    if (current.linear.bottom === node.box.bottom) {
                                        current.anchor('layout_alignParentBottom', adjacent, 'vertical');
                                    }
                                }
                                else {
                                    const bounds1 = current.bounds;
                                    const bounds2 = adjacent.bounds;
                                    if ((bounds1.top === bounds2.top || bounds1.bottom === bounds2.bottom) && withinRange(bounds1.left, bounds2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['leftRight'], adjacent, (adjacent.constraint.horizontal ? 'horizontal' : null));
                                        if (adjacent.constraint.horizontal) {
                                            current.delete('android', parseRTL('layout_alignParentRight'));
                                        }
                                    }
                                    if (adjacent.constraint.vertical && withinRange(bounds1.top, bounds2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                        current.anchor(LAYOUT['topBottom'], adjacent, (adjacent.constraint.vertical ? 'vertical' : null));
                                        if (adjacent.constraint.vertical) {
                                            current.delete('android', 'layout_alignParentBottom');
                                        }
                                    }
                                    if (adjacent.constraint.horizontal) {
                                        if (bounds1.bottom === bounds2.bottom) {
                                            current.anchor(LAYOUT['bottom'], adjacent, (adjacent.constraint.vertical ? 'vertical' : null));
                                            if (adjacent.constraint.vertical) {
                                                current.delete('android', 'layout_alignParentBottom');
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    nodes.shift();
                    for (const current of nodes) {
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
                    }
                }
                if (flex.enabled || (constraint && SETTINGS.useConstraintChain && !nodes.intersect())) {
                    let flexNodes = null;
                    if (flex.enabled) {
                        let horizontalChain = nodes.slice();
                        let verticalChain = nodes.slice();
                        switch (flex.direction) {
                            case 'row-reverse':
                                horizontalChain.reverse();
                            case 'row':
                                verticalChain = null;
                                break;
                            case 'column-reverse':
                                verticalChain.reverse();
                            case 'column':
                                horizontalChain = null;
                                break;
                        }
                        flexNodes = [{ constraint: { horizontalChain, verticalChain } }];
                    }
                    else {
                        for (const current of nodes) {
                            let horizontalChain = nodes.filter((item) => same(current, item, 'bounds.top'));
                            if (horizontalChain.length === 0) {
                                horizontalChain = nodes.filter((item) => same(current, item, 'bounds.bottom'));
                            }
                            if (horizontalChain.length > 0) {
                                horizontalChain.sortAsc('bounds.x');
                            }
                            let verticalChain = nodes.filter((item) => same(current, item, 'bounds.left'));
                            if (verticalChain.length === 0) {
                                verticalChain = nodes.filter((item) => same(current, item, 'bounds.right'));
                            }
                            if (verticalChain.length > 0) {
                                verticalChain.sortAsc('bounds.y');
                            }
                            current.constraint.horizontalChain = horizontalChain;
                            current.constraint.verticalChain = verticalChain;
                        }
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
                        const chainNodes = flexNodes || nodes.slice().sort((a, b) => (a.constraint[value].length >= b.constraint[value].length ? -1 : 1));
                        for (const current of chainNodes) {
                            const chainDirection = current.constraint[value];
                            if (chainDirection && chainDirection.length > 0 && (flex.enabled || chainDirection.map((item) => parseInt((item.constraint[value] || [{ id: 0 }]).map((result) => result.id).join(''))).reduce((a, b) => (a === b ? a : 0)) > 0)) {
                                chainDirection.parent = node;
                                if (flex.enabled && chainDirection.some((item) => item.flex.order > 0)) {
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
                                for (let i = 0; i < chainDirection.length; i++) {
                                    const chain = chainDirection[i];
                                    const next = chainDirection[i + 1];
                                    const previous = chainDirection[i - 1];
                                    if (flex.enabled) {
                                        if (chain.linear[TL] === node.box[TL] && chain.linear[BR] === node.box[BR]) {
                                            setAlignParent(chain, orientationInverse);
                                        }
                                    }
                                    if (next != null) {
                                        chain.app(LAYOUT[CHAIN_MAP['rightLeftBottomTop'][index]], next.stringId);
                                        maxOffset = Math.max(next.linear[LT] - chain.linear[RB], maxOffset);
                                    }
                                    if (previous != null) {
                                        chain.app(LAYOUT[CHAIN_MAP['leftRightTopBottom'][index]], previous.stringId);
                                    }
                                    if (chain.styleMap[dimension] == null) {
                                        const min = chain.styleMap[`min${WH}`];
                                        const max = chain.styleMap[`max${WH}`];
                                        if (hasValue(min)) {
                                            chain.app(`layout_constraint${WH}_min`, convertPX(min));
                                            chain.styleMap[`min${WH}`] = null;
                                        }
                                        if (hasValue(max)) {
                                            chain.app(`layout_constraint${WH}_max`, convertPX(max));
                                            chain.styleMap[`max${WH}`] = null;
                                        }
                                    }
                                    if (flex.enabled) {
                                        const map = LAYOUT_MAP.constraint;
                                        chain.app(`layout_constraint${HV}_weight`, chain.flex.grow);
                                        if (chain[`view${WH}`] == null && chain.flex.grow === 0 && chain.flex.shrink <= 1) {
                                            chain.android(`layout_${dimension}`, 'wrap_content');
                                        }
                                        else if (chain.flex.grow > 0) {
                                            chain.android(`layout_${dimension}`, (node.renderParent.is(NODE_STANDARD.LINEAR) && node.renderParent.constraint.expand && node.flex.direction.indexOf('row') !== -1 ? 'wrap_content' : '0px'));
                                        }
                                        if (chain.flex.shrink === 0) {
                                            chain.app(`layout_constrained${WH}`, 'true');
                                        }
                                        switch (chain.flex.alignSelf) {
                                            case 'flex-start':
                                                chain
                                                    .app(map[TL], 'parent')
                                                    .constraint[orientationInverse] = true;
                                                break;
                                            case 'flex-end':
                                                chain
                                                    .app(map[BR], 'parent')
                                                    .constraint[orientationInverse] = true;
                                                break;
                                            case 'baseline':
                                                chain
                                                    .app(map['baseline'], 'parent')
                                                    .constraint.vertical = true;
                                                break;
                                            case 'center':
                                            case 'stretch':
                                                if (chain.flex.alignSelf === 'center') {
                                                    chain.app(`layout_constraint${VH}_bias`, 0.5);
                                                }
                                                else {
                                                    chain.android(`layout_${HW.toLowerCase()}`, '0px');
                                                }
                                                setAlignParent(chain, orientationInverse);
                                                break;
                                        }
                                        if (chain.flex.basis !== 'auto') {
                                            if (/(100|[1-9][0-9]?)%/.test(chain.flex.basis)) {
                                                chain.app(`layout_constraint${WH}_percent`, parseInt(chain.flex.basis));
                                            }
                                            else {
                                                const width = convertPX(chain.flex.basis);
                                                if (width !== '0px') {
                                                    chain.app(`layout_constraintWidth_min`, width);
                                                    chain.styleMap.minWidth = null;
                                                }
                                            }
                                        }
                                    }
                                }
                                firstNode
                                    .app(LAYOUT[LT], 'parent')
                                    .constraint[orientation] = true;
                                lastNode
                                    .app(LAYOUT[RB], 'parent')
                                    .constraint[orientation] = true;
                                const chainStyle = `layout_constraint${HV}_chainStyle`;
                                if (flex.enabled && flex.justifyContent !== 'normal' && Math.max.apply(null, chainDirection.map((item) => item.flex.grow)) === 0) {
                                    switch (flex.justifyContent) {
                                        case 'space-between':
                                            firstNode.app(chainStyle, 'spread_inside');
                                            break;
                                        case 'space-evenly':
                                            firstNode.app(chainStyle, 'spread');
                                            chainDirection.forEach((item) => item.app(`layout_constraint${HV}_weight`, item.flex.grow || 1));
                                            break;
                                        case 'space-around':
                                            const leftTop = (index === 0 ? 'left' : 'top');
                                            const percent = (firstNode.bounds[leftTop] - node.box[leftTop]) / node.box[dimension];
                                            firstNode.app(`layout_constraint${HV}_chainStyle`, 'spread_inside');
                                            createGuideline(node, firstNode, orientation, false, parseFloat(percent.toFixed(2)));
                                            createGuideline(node, lastNode, orientation, true, parseFloat((1 - percent).toFixed(2)));
                                            break;
                                        default:
                                            let bias = 0.5;
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
                                            switch (justifyContent) {
                                                case 'flex-start':
                                                    bias = 0;
                                                    break;
                                                case 'flex-end':
                                                    bias = 1;
                                                    break;
                                            }
                                            firstNode
                                                .app(chainStyle, 'packed')
                                                .app(`layout_constraint${HV}_bias`, bias);
                                    }
                                }
                                else {
                                    let requireBias = true;
                                    if (flex.enabled && withinFraction(node.box.left, firstNode.linear.left) && withinFraction(lastNode.linear.right, node.box.right)) {
                                        firstNode.app(chainStyle, 'spread_inside');
                                        requireBias = false;
                                    }
                                    else if (maxOffset <= SETTINGS[`chainPacked${HV}Offset`]) {
                                        firstNode.app(chainStyle, 'packed');
                                        adjustMargins(chainDirection);
                                    }
                                    else {
                                        firstNode.app(chainStyle, 'spread');
                                    }
                                    if (requireBias) {
                                        firstNode.app(`layout_constraint${HV}_bias`, firstNode[`${orientation}Bias`]);
                                    }
                                    if (!flex.enabled) {
                                        for (const chain of chainDirection) {
                                            chain.constraint.horizontalChain = [];
                                            chain.constraint.verticalChain = [];
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
                if (!flex.enabled) {
                    const anchors = nodes.anchors;
                    if (constraint) {
                        if (anchors.length === 0) {
                            const unbound = nodes.sortAsc('bounds.x', 'bounds.y')[0];
                            if (SETTINGS.useConstraintGuideline) {
                                createGuideline(node, unbound);
                            }
                            else {
                                setAlignParent(unbound, '', true);
                            }
                            anchors.push(unbound);
                        }
                    }
                    do {
                        let restart = false;
                        for (const current of nodes) {
                            if (!current.anchored) {
                                const result = (constraint ? search(current.app(), '*constraint*') : search(current.android(), LAYOUT));
                                for (const [key, value] of result) {
                                    if (value !== 'parent') {
                                        if (anchors.find((item) => item.stringId === value) != null) {
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
                        }
                        if (!restart) {
                            break;
                        }
                    } while (true);
                    if (constraint) {
                        for (const opposite of nodes) {
                            if (!opposite.anchored) {
                                deleteConstraints(node);
                                if (SETTINGS.useConstraintGuideline) {
                                    createGuideline(node, opposite);
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
                                    opposite
                                        .app('layout_constraintCircle', adjacent.stringId)
                                        .app('layout_constraintCircleRadius', formatPX(radius))
                                        .app('layout_constraintCircleAngle', degrees);
                                    opposite.constraint.vertical = true;
                                    opposite.constraint.horizontal = true;
                                }
                            }
                        }
                        nodes.forEach((current) => {
                            if (current.app(LAYOUT['right']) === 'parent' && current.app(LAYOUT['leftRight']) == null) {
                                node.constraint.layoutWidth = true;
                            }
                            if (current.app(LAYOUT['bottom']) === 'parent' && current.app(LAYOUT['topBottom']) == null) {
                                node.constraint.layoutHeight = true;
                            }
                        });
                    }
                    else {
                        for (const current of nodes) {
                            const parentRight = current.android(parseRTL('layout_alignParentRight'));
                            const parentBottom = current.android('layout_alignParentBottom');
                            if (!anchors.includes(current)) {
                                const parentLeft = parseRTL('layout_alignParentLeft');
                                current.delete('android', LAYOUT);
                                if (current.android(parentLeft) !== 'true') {
                                    const left = formatPX(current.bounds.left - node.box.left);
                                    current
                                        .css(parseRTL('marginLeft'), left)
                                        .android(parentLeft, 'true')
                                        .android(parseRTL('layout_marginLeft'), left);
                                }
                                if (parentBottom !== 'true') {
                                    const top = formatPX(current.bounds.top - node.box.top);
                                    current
                                        .css('marginTop', top)
                                        .android('layout_alignParentTop', 'true')
                                        .android('layout_marginTop', top);
                                }
                                current.constraint.vertical = true;
                                current.constraint.horizontal = true;
                            }
                            else {
                                adjustMargins([current]);
                            }
                            if (parentRight === 'true' && current.android(LAYOUT['leftRight']) == null) {
                                node.constraint.layoutWidth = true;
                            }
                            if (parentBottom === 'true' && current.android(LAYOUT['topBottom']) == null) {
                                node.constraint.layoutHeight = true;
                            }
                        }
                    }
                }
            }
        }
    }

    function setStyleMap() {
        for (const styleSheet of Array.from(document.styleSheets)) {
            for (const rule of styleSheet.rules) {
                const elements = document.querySelectorAll(rule.selectorText);
                const attributes = new Set();
                for (const style of rule.styleMap) {
                    attributes.add(hyphenToCamelCase(style[0]));
                }
                for (const element of Array.from(elements)) {
                    for (const attr of element.style) {
                        attributes.add(hyphenToCamelCase(attr));
                    }
                    const style = getComputedStyle(element);
                    const styleMap = {};
                    for (const name of attributes) {
                        if (name.toLowerCase().indexOf('color') !== -1) {
                            const color = getByColorName(rule.style[name]);
                            if (color != null) {
                                rule.style[name] = convertRGB(color);
                            }
                        }
                        if (hasValue(element.style[name])) {
                            styleMap[name] = element.style[name];
                        }
                        else if (style[name] === rule.style[name]) {
                            styleMap[name] = style[name];
                        }
                    }
                    if (element.__styleMap != null) {
                        Object.assign(element.__styleMap, styleMap);
                    }
                    else {
                        element.__styleMap = styleMap;
                    }
                }
            }
        }
    }
    function parseDocument(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        setStyleMap();
        const app = new Application(NODE_CACHE, viewHandler, new ResourceWidget(NODE_CACHE), Widget, WidgetList);
        app.setNodeCache(element);
        let output = app.getLayoutXml();
        output = replaceViewsBeforeAfter(output);
        app.setResources();
        if (SETTINGS.showAttributes) {
            app.setMarginPadding();
            if (SETTINGS.useLayoutWeight) {
                app.setLayoutWeight();
            }
            setConstraints();
            output = app.replaceInlineAttributes(output);
        }
        output = output.replace(/{[<@>]{1}[0-9]+}/g, '');
        if (SETTINGS.useUnitDP) {
            output = replaceDP(output, SETTINGS.density);
        }
        return output;
    }

    exports.parseDocument = parseDocument;
    exports.api = API_ANDROID;
    exports.settings = SETTINGS;
    exports.writeResourceArrayXml = writeResourceArrayXml;
    exports.writeResourceColorXml = writeResourceColorXml;
    exports.writeResourceDrawableXml = writeResourceDrawableXml;
    exports.writeResourceFontXml = writeResourceFontXml;
    exports.writeResourceStringXml = writeResourceStringXml;
    exports.writeResourceStyleXml = writeResourceStyleXml;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
