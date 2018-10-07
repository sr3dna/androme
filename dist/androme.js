/* androme 1.10.1
   https://github.com/anpham6/androme */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.androme = {})));
}(this, (function (exports) { 'use strict';

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
        return source ? source
            .split(delimiter)
            .map(segment => segment.trim())
            .includes(value)
            : false;
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
            } while (result != null && ++i < attrs.length && typeof result !== 'string' && typeof result !== 'number' && typeof result !== 'boolean');
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
    function repeat(n, value = '\t') {
        return value.repeat(n);
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
    function hasValue(value) {
        return typeof value !== 'undefined' && value !== null && value.toString().trim() !== '';
    }
    function sortAsc(list, ...attrs) {
        return sort(list, 0, ...attrs);
    }
    function sortDesc(list, ...attrs) {
        return sort(list, 1, ...attrs);
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
    function parseBackgroundUrl(value) {
        const match = value.match(/^url\("?(.*?)"?\)$/);
        if (match) {
            return resolvePath(match[1]);
        }
        return '';
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
        if (element &&
            element.nodeName === '#text' &&
            element.textContent) {
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
                    if ((bounds.width !== 0 && bounds.height !== 0) ||
                        hasValue(element.dataset.ext) ||
                        getStyle(element).clear !== 'none') {
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
                                return (Array
                                    .from(element.children)
                                    .some((item) => {
                                    const style = getStyle(item);
                                    const float = style.cssFloat;
                                    const position = style.position;
                                    return ((position !== 'static' && position !== 'initial') ||
                                        float === 'left' ||
                                        float === 'right');
                                }));
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

    class NodeList {
        constructor(nodes, parent) {
            this.parent = parent;
            this._currentId = 0;
            this._list = [];
            if (Array.isArray(nodes)) {
                this._list = nodes;
            }
        }
        static siblingIndex(a, b) {
            return a.siblingIndex <= b.siblingIndex ? -1 : 1;
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
                baseline =
                    list.filter(node => node.baseline)
                        .sort((a, b) => {
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
                    return (result.length === list.length ? result.filter(node => node.hasElement) : result).filter(node => node.baseline);
                }
                baseline =
                    list.filter(node => node.baselineInside)
                        .sort((a, b) => {
                        const fontSizeA = convertInt(a.css('fontSize'));
                        const fontSizeB = convertInt(b.css('fontSize'));
                        const heightA = a.bounds.height;
                        const heightB = b.bounds.height;
                        if (a.imageElement && b.imageElement) {
                            return heightA >= heightB ? -1 : 1;
                        }
                        else if (a.nodeType !== b.nodeType && (a.nodeType < NODE_STANDARD.TEXT || b.nodeType < NODE_STANDARD.TEXT)) {
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
                                if (a.hasElement && !b.hasElement) {
                                    return -1;
                                }
                                else if (!a.hasElement && b.hasElement) {
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
                        return heightA >= heightB ? -1 : 1;
                    });
            }
            let fontFamily;
            let fontSize;
            let fontWeight;
            return (baseline.filter((node, index) => {
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
            }));
        }
        static linearX(list, traverse = true) {
            const nodes = list.filter(node => node.pageflow);
            switch (nodes.length) {
                case 0:
                    return false;
                case 1:
                    return true;
                default:
                    const parent = this.documentParent(nodes);
                    let horizontal = false;
                    if (traverse) {
                        if (nodes.every(node => node.documentParent === parent || (node.companion && node.companion.documentParent === parent))) {
                            const cleared = NodeList.cleared(Array
                                .from(parent.baseElement.children)
                                .map(node => getNodeFromElement(node))
                                .filter(node => node));
                            horizontal =
                                nodes
                                    .slice()
                                    .sort(NodeList.siblingIndex)
                                    .every((node, index) => {
                                    if (index > 0) {
                                        if (node.companion && node.companion.documentParent === parent) {
                                            node = node.companion;
                                        }
                                        const previous = node.previousSibling();
                                        if (previous) {
                                            return !node.alignedVertically(previous, cleared);
                                        }
                                    }
                                    return true;
                                });
                        }
                    }
                    if (horizontal || !traverse) {
                        return nodes.every(node => {
                            return !nodes.some(sibling => {
                                if (sibling !== node &&
                                    node.linear.top >= sibling.linear.bottom &&
                                    node.intersectY(sibling.linear)) {
                                    return true;
                                }
                                return false;
                            });
                        });
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
                        const cleared = NodeList.cleared(Array
                            .from(parent.baseElement.children)
                            .map(node => getNodeFromElement(node))
                            .filter(node => node));
                        return (nodes
                            .slice()
                            .sort(NodeList.siblingIndex)
                            .every((node, index) => {
                            if (index > 0 && !node.lineBreak) {
                                if (node.companion && node.companion.documentParent === parent) {
                                    node = node.companion;
                                }
                                const previous = node.previousSibling();
                                if (previous) {
                                    return node.alignedVertically(previous, cleared);
                                }
                            }
                            return true;
                        }));
                    }
                    return false;
            }
        }
        static documentParent(nodes) {
            for (const node of nodes) {
                if (!node.companion && node.domElement) {
                    return node.documentParent;
                }
            }
            return nodes[0].documentParent;
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
        const placeholder = typeof id === 'number' ? formatPlaceholder(id) : id;
        return value.replace(placeholder, (before ? placeholder : '') + content + (before ? '' : placeholder));
    }
    function replaceIndent(value, depth) {
        if (depth >= 0) {
            let indent = -1;
            return (value
                .split('\n')
                .map(line => {
                const match = /^({.*?})(\t*)(<.*)/.exec(line);
                if (match) {
                    if (indent === -1) {
                        indent = match[2].length;
                    }
                    return match[1] + repeat(depth + (match[2].length - indent)) + match[3];
                }
                return line;
            })
                .join('\n'));
        }
        return value;
    }

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
            this._sorted = {};
            this._currentIndex = -1;
            this._views = [];
            this._includes = [];
        }
        registerController(controller) {
            controller.application = this;
            controller.settings = this.settings;
            controller.cache = this.cache;
            this.viewController = controller;
        }
        registerResource(resource) {
            resource.application = this;
            resource.settings = this.settings;
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
            const visible = this.cacheSession.visible.list.filter(node => !node.hasAlign(NODE_ALIGNMENT.SPACE));
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
            for (const ext of this.extensions) {
                ext.subscribers.clear();
                ext.subscribersChild.clear();
            }
            this.closed = false;
        }
        setConstraints() {
            this.viewController.setConstraints();
        }
        resetController() {
            this.viewController.reset();
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
        initCache(rootElement) {
            let nodeTotal = 0;
            if (rootElement === document.body) {
                Array
                    .from(document.body.childNodes)
                    .some((item) => isElementVisible(item) && ++nodeTotal > 1);
            }
            const elements = rootElement !== document.body ? rootElement.querySelectorAll('*')
                : document.querySelectorAll(nodeTotal > 1 ? 'body, body *' : 'body *');
            this.cache.parent = undefined;
            this.cache.delegateAppend = undefined;
            this.cache.clear();
            for (const ext of this.extensions) {
                ext.setTarget({}, undefined, rootElement);
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
            const supportInline = this.settings.renderInlineText ? ['BR'] : this.viewController.supportInline;
            function inlineElement(element) {
                const styleMap = getElementCache(element, 'styleMap');
                return ((!styleMap || Object.keys(styleMap).length === 0) &&
                    element.children.length === 0 &&
                    supportInline.includes(element.tagName));
            }
            for (const element of Array.from(elements)) {
                if (!this.elements.has(element)) {
                    this.prioritizeExtensions(this.extensions, element).some(item => item.init(element));
                    if (!this.elements.has(element)) {
                        if (inlineElement(element) && element.parentElement && Array.from(element.parentElement.children).every(item => inlineElement(item))) {
                            setElementCache(element, 'supportInline', true);
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
                    Array
                        .from(node.element.childNodes)
                        .forEach((element) => {
                        if (element.nodeName === '#text') {
                            if (node.tagName !== 'SELECT') {
                                nodes.push(element);
                            }
                        }
                        else if (element.tagName !== 'BR') {
                            const elementNode = getNodeFromElement(element);
                            if (!supportInline.includes(element.tagName) || (elementNode && !elementNode.excluded)) {
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
                    if (node.hasElement) {
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
                    if (node.hasElement) {
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
                    let i = 0;
                    Array
                        .from(node.element.childNodes)
                        .forEach((element) => {
                        const item = getNodeFromElement(element);
                        if (item && !item.excluded && item.pageflow) {
                            item.siblingIndex = i++;
                        }
                    });
                    node.children.sort(NodeList.siblingIndex);
                    node.initial.children.push(...node.children.slice());
                }
                this.cache.sortAsc('depth', 'id');
                for (const ext of this.extensions) {
                    ext.setTarget(rootNode);
                    ext.afterInit();
                }
                this.createLayout(rootElement.dataset.layoutName);
                return true;
            }
            return false;
        }
        createDocument() {
            const application = this;
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
                    node.cascade().forEach((child) => {
                        deleteMapY(child.id);
                        setMapY((child.initial.depth * -1) - 2, child.id, child);
                    });
                });
            };
            for (const depth of mapY.values()) {
                const partial = new Map();
                const external = new Map();
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
                function renderNode(node, parent, output, current = '', group = false) {
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
                            if (!application.elements.has(node.element)) {
                                if (hasValue(node.dataset.target)) {
                                    const target = document.getElementById(node.dataset.target);
                                    if (target && target !== parent.element) {
                                        application.addRenderQueue(node.dataset.target, [output]);
                                        node.auto = false;
                                        return;
                                    }
                                }
                                else if (hasValue(parent.dataset.target)) {
                                    const target = document.getElementById(parent.dataset.target);
                                    if (target) {
                                        application.addRenderQueue(parent.nodeId, [output]);
                                        node.dataset.target = parent.nodeId;
                                        return;
                                    }
                                }
                            }
                            insertNodeTemplate(partial, node, parent.id.toString(), output, current);
                        }
                    }
                }
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
                        if (!nodeY.visible || (!nodeY.documentRoot && this.elements.has(nodeY.element))) {
                            continue;
                        }
                        let parentY = nodeY.parent;
                        if (!nodeY.hasBit('excludeSection', APP_SECTION.INCLUDE) && this.viewController.supportInclude) {
                            const filename = trimNull(nodeY.dataset.include);
                            if (filename !== '' && includes$$1.indexOf(filename) === -1) {
                                renderNode(nodeY, parentY, this.viewController.renderInclude(nodeY, parentY, filename), includes$$1.length > 0 ? includes$$1[includes$$1.length - 1] : '');
                                includes$$1.push(filename);
                            }
                            current = includes$$1.length > 0 ? includes$$1[includes$$1.length - 1] : '';
                            if (current !== '') {
                                const cloneParent = parentY.clone();
                                cloneParent.renderDepth = this.viewController.baseRenderDepth(current);
                                nodeY.parent = cloneParent;
                                parentY = cloneParent;
                            }
                        }
                        if (nodeY.renderAs) {
                            parentY.remove(nodeY);
                            nodeY.hide();
                            nodeY = nodeY.renderAs;
                        }
                        if (!nodeY.hasBit('excludeSection', APP_SECTION.DOM_TRAVERSE) &&
                            axisY.length > 1 &&
                            k < axisY.length - 1) {
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
                                forloop1: {
                                    for (; l < axisY.length; l++, m++) {
                                        const adjacent = axisY[l];
                                        if (adjacent.pageflow) {
                                            if (cleared.has(adjacent)) {
                                                const float = cleared.get(adjacent);
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
                                                            if (floatedOpen.size > 0 && !clearedDirection.has('both') && (maxBottom == null || adjacent.bounds.top < maxBottom)) {
                                                                if (clearedPartial.has(adjacent)) {
                                                                    const clear = clearedPartial.has(adjacent) ? clearedPartial.get(adjacent) : 'none';
                                                                    if (clear !== 'none') {
                                                                        if (floatedOpen.size < 2 &&
                                                                            floated.size === 2 &&
                                                                            !adjacent.floating) {
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
                                                                    break forloop1;
                                                                }
                                                                else if (!verticalAlign) {
                                                                    horizontal.push(adjacent);
                                                                    continue;
                                                                }
                                                                if (floated.size === 1 && (!adjacent.floating || floatedOpen.has(adjacent.float))) {
                                                                    horizontal.push(adjacent);
                                                                    continue;
                                                                }
                                                            }
                                                        }
                                                        break forloop1;
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
                                                        break forloop1;
                                                    }
                                                    horizontal.push(adjacent);
                                                }
                                            }
                                            else {
                                                break forloop1;
                                            }
                                        }
                                    }
                                }
                                let group = null;
                                let groupOutput = '';
                                if (horizontal.length > 1) {
                                    const clearedPartial = NodeList.cleared(horizontal);
                                    if (this.isFrameHorizontal(horizontal, clearedPartial)) {
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
                                            else if (this.isRelativeHorizontal(horizontal, clearedPartial)) {
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
                            forloop2: {
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
                                        renderNode(nodeY, parentY, result.output, current);
                                    }
                                    if (result.parent) {
                                        parentY = result.parent;
                                    }
                                    next = result.next || false;
                                    if (result.complete || result.next) {
                                        break forloop2;
                                    }
                                }
                            }
                            if (next) {
                                continue;
                            }
                            if (nodeY.element instanceof HTMLElement) {
                                const processed = [];
                                this.prioritizeExtensions(this.extensions, nodeY.element).some(item => {
                                    if (item.is(nodeY)) {
                                        item.setTarget(nodeY, parentY);
                                        if (item.condition()) {
                                            const result = item.processNode(mapX, mapY);
                                            if (result.output !== '') {
                                                renderNode(nodeY, parentY, result.output, current);
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
                                nodeY.has('width', CSS_STANDARD.PERCENT, { not: '100%' }) &&
                                !nodeY.imageElement && (parentY.linearVertical ||
                                (parentY.is(NODE_STANDARD.FRAME) && nodeY.singleChild))) {
                                const group = this.viewController.createGroup(parentY, nodeY, [nodeY]);
                                const groupOutput = this.writeGridLayout(group, parentY, 2, 1);
                                group.alignmentType |= NODE_ALIGNMENT.PERCENT;
                                renderNode(group, parentY, groupOutput, current);
                                this.viewController[nodeY.float === 'right' || nodeY.autoMarginLeft ? 'prependBefore' : 'appendAfter'](nodeY.id, this.getEmptySpacer(NODE_STANDARD.GRID, group.renderDepth + 1, `${(100 - nodeY.toInt('width'))}%`));
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
                                    if (nodeY.flex.enabled ||
                                        nodeY.children.some(node => !node.pageflow) ||
                                        nodeY.has('columnCount')) {
                                        output = this.writeConstraintLayout(nodeY, parentY);
                                    }
                                    else {
                                        if (nodeY.children.length === 1) {
                                            const targeted = nodeY.children.filter(node => {
                                                if (hasValue(node.dataset.target)) {
                                                    const element = document.getElementById(node.dataset.target);
                                                    return (element && hasValue(element.dataset.ext) && element !== parentY.element);
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
                                                        else if (this.isRelativeHorizontal(children)) {
                                                            output = this.writeRelativeLayout(nodeY, parentY);
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                        }
                                                    }
                                                    if (output === '') {
                                                        if (floated.size === 0 || !floated.has('right')) {
                                                            if (this.isRelativeHorizontal(children)) {
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
                                                            if (previous && node.alignedVertically(previous, clearedInside)) {
                                                                return true;
                                                            }
                                                            return false;
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
                                                    if (this.isFrameHorizontal(children, clearedInside, true)) {
                                                        output = this.writeFrameLayoutHorizontal(nodeY, parentY, children, clearedInside);
                                                    }
                                                    else {
                                                        output = this.writeRelativeLayout(nodeY, parentY);
                                                        if (getElementsBetweenSiblings(children[0].baseElement, children[children.length - 1].baseElement)
                                                            .filter(element => isLineBreak(element))
                                                            .length === 0) {
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
                            renderNode(nodeY, parentY, output, current);
                        }
                        if (!nodeY.hasBit('excludeSection', APP_SECTION.INCLUDE) && this.viewController.supportInclude) {
                            if (includes$$1.length > 0 && optional(nodeY, 'dataset.includeEnd') === 'true') {
                                includes$$1.pop();
                            }
                        }
                    }
                }
                for (let [id, templates] of partial.entries()) {
                    const content = [];
                    const [parentId, position] = id.split(':');
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
                        id = parentId + (position ? `:${position}` : '');
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
                if (this.viewController.supportInclude) {
                    for (const [current, views] of external.entries()) {
                        const templates = Array.from(views.values());
                        if (templates.length > 0) {
                            const output = this.viewController.renderMerge(current, templates);
                            this.addInclude(current, output);
                        }
                    }
                }
            }
            const root = this.cache.parent;
            if (!hasValue(root.dataset.target) || root.renderExtension.size === 0) {
                const pathname = trimString(trimNull(root.dataset.folder), '/');
                this.updateLayout(empty ? '' : baseTemplate, pathname, root.renderExtension.size > 0 && Array.from(root.renderExtension).some(item => item.documentRoot));
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
            else if (root.renderExtension.size === 0) {
                root.hide();
            }
            this.cache.list.sort((a, b) => {
                if (!a.visible) {
                    return 1;
                }
                else if (!b.visible) {
                    return -1;
                }
                else if (a.renderDepth !== b.renderDepth) {
                    return (a.renderDepth < b.renderDepth ? -1 : 1);
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
                        return (a.documentParent.id < b.documentParent.id ? -1 : 1);
                    }
                    else {
                        return (a.renderIndex < b.renderIndex ? -1 : 1);
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
        writeGridLayout(node, parent, columns, rows = 0) {
            return this.viewController.renderGroup(node, parent, NODE_STANDARD.GRID, { columns, rows });
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
                    if (this.isRelativeHorizontal(nodes, cleared)) {
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
                        if (this.isRelativeHorizontal(subgroup, cleared)) {
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
                    layers = layers.filter((item) => item && item.length > 0);
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
                            if (this.isRelativeHorizontal(section, NodeList.cleared(section))) {
                                groupOutput = this.writeRelativeLayout(subgroup, basegroup);
                                subgroup.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                            }
                            else {
                                groupOutput = this.writeLinearLayout(subgroup, basegroup, NodeList.linearX(section));
                                if (floatRight && subgroup.children.some(node => node.marginLeft < 0)) {
                                    const sorted = [];
                                    let marginRight = 0;
                                    subgroup.children
                                        .slice()
                                        .forEach((node) => {
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
                            basegroup.renderAppend(subgroup);
                        }
                        else if (section.length > 0) {
                            const single = section[0];
                            single.alignmentType |= NODE_ALIGNMENT.SINGLE;
                            if (single.float === 'right') {
                                single.alignmentType |= NODE_ALIGNMENT.RIGHT;
                            }
                            single.renderPosition = index;
                            output = replacePlaceholder(output, basegroup.id, `{:${basegroup.id}:${index}}`);
                            basegroup.renderAppend(single);
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
        getEmptySpacer(nodeType, depth, width, height, columnSpan) {
            return this.viewController.getEmptySpacer(nodeType, depth, width, height, columnSpan);
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
            pathname = pathname || this.viewController.settingsInternal.layout.directory;
            if (documentRoot &&
                this._views.length > 0 &&
                this._views[0].content === '') {
                const current = this._views.pop();
                Object.assign(this._views[0], {
                    pathname,
                    filename: current.filename,
                    content
                });
                this._currentIndex = 0;
            }
            else {
                this.layoutProcessing.pathname = pathname;
                this.layoutProcessing.content = content;
            }
        }
        addInclude(filename, content) {
            this._includes.push({
                pathname: this.viewController.settingsInternal.layout.directory,
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
                        const indexA = a.css('zIndex');
                        const indexB = b.css('zIndex');
                        if ((indexA === 'auto' || indexA === '' || indexA === '0') &&
                            (indexB === 'auto' || indexB === '' || indexB === '0')) {
                            return a.siblingIndex <= b.siblingIndex ? -1 : 1;
                        }
                        else {
                            return convertInt(indexA) <= convertInt(indexB) ? -1 : 1;
                        }
                    });
                    sorted = true;
                }
            }
            if (preserve && sorted && parent) {
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
        toString() {
            return this._views.length > 0 ? this._views[0].content : '';
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
            else if (element instanceof HTMLElement) {
                switch (element.tagName) {
                    case 'OPTION':
                    case 'MAP':
                    case 'AREA':
                        return null;
                }
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
        prioritizeExtensions(available, element) {
            let extensions = [];
            let current = element;
            while (current) {
                extensions = [
                    ...extensions,
                    ...trimNull(current.dataset.ext)
                        .split(',')
                        .map(value => value.trim())
                ];
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
        isFrameHorizontal(nodes, cleared, lineBreak = false) {
            const floated = NodeList.floated(nodes);
            const margin = nodes.filter(node => node.autoMargin);
            const br = lineBreak ? getElementsBetweenSiblings(nodes[0].baseElement, nodes[nodes.length - 1].baseElement).filter(element => element.tagName === 'BR').length : 0;
            return (br === 0 && (floated.has('right') ||
                cleared.size > 0 ||
                margin.length > 0 ||
                !NodeList.linearX(nodes)));
        }
        isRelativeHorizontal(nodes, cleared = new Map()) {
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
                if (linearX && cleared.size === 0) {
                    return false;
                }
                return true;
            }
            return (cleared.size === 0 &&
                !floated.has('right') &&
                (pageflow.length === 0 || floating.length === 0 || floatIndex < flowIndex) &&
                visible.every(node => {
                    const verticalAlign = node.css('verticalAlign');
                    return (node.toInt('top') >= 0 &&
                        (['baseline', 'initial', 'unset', 'top', 'middle', 'sub', 'super'].includes(verticalAlign) || (isUnit(verticalAlign) && parseInt(verticalAlign) >= 0)));
                }) && (visible.some(node => ((node.textElement || node.imageElement) && node.baseline) || (node.plainText && node.multiLine)) ||
                (!linearX && nodes.every(node => node.pageflow && node.inlineElement))));
        }
        set appName(value) {
            if (this.resourceHandler) {
                this.resourceHandler.file.appName = value;
            }
        }
        get appName() {
            return this.resourceHandler ? this.resourceHandler.file.appName : '';
        }
        set layoutProcessing(value) {
            this._views[this._currentIndex] = value;
        }
        get layoutProcessing() {
            return this._views[this._currentIndex];
        }
        get layouts() {
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
            this.node = node;
            this.parent = parent;
            this.element = element || this.node.element;
        }
        is(node) {
            return node.hasElement && (this.tagNames.length === 0 || this.tagNames.includes(node.tagName));
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
                this.dependencies
                    .filter(item => item.init)
                    .forEach(item => {
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
        afterInit(internal = false) {
            if (!internal && this.included()) {
                this.dependencies
                    .filter(item => item.init)
                    .forEach(item => {
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
            if (node && node.element instanceof HTMLElement) {
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
            HSL_SORTED.push({
                name: i,
                rgb: x11.rgb,
                hex: x11.hex,
                hsl: x11.hsl
            });
        }
    }
    HSL_SORTED.sort(sortHSL);
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
            h: (h * 360),
            s: (s * 100),
            l: (l * 100)
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
    function getByColorName(value) {
        for (const color in X11_CSS3) {
            if (color.toLowerCase() === value.trim().toLowerCase()) {
                return X11_CSS3[color];
            }
        }
        return '';
    }
    function formatRGB({ rgb }) {
        return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';
    }
    function convertHextoRGB(value) {
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

    let main;
    exports.settings = {};
    exports.system = {};
    let framework;
    const cacheRoot = new Set();
    const cacheImage = new Map();
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
                        Array
                            .from(document.querySelectorAll(cssRule.selectorText))
                            .forEach((element) => {
                            for (const attr of Array.from(element.style)) {
                                attrs.add(convertCamelCase(attr));
                            }
                            const style = getStyle(element);
                            const styleMap = {};
                            for (const attr of attrs) {
                                if (attr.toLowerCase().indexOf('color') !== -1) {
                                    const color = getByColorName(cssRule.style[attr]);
                                    if (color !== '') {
                                        cssRule.style[attr] = formatRGB(color);
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
                                            styleMap[attr] = /^[A-Za-z\-]+$/.test(cssStyle) || isPercent(cssStyle) ? cssStyle
                                                : convertPX(cssStyle, style.fontSize);
                                            break;
                                        default:
                                            if (styleMap[attr] == null) {
                                                styleMap[attr] = cssStyle;
                                            }
                                            break;
                                    }
                                }
                            }
                            if (main.settings.preloadImages &&
                                hasValue(styleMap['backgroundImage']) &&
                                styleMap['backgroundImage'] !== 'initial') {
                                styleMap['backgroundImage']
                                    .split(',')
                                    .map(value => value.trim())
                                    .forEach(value => {
                                    const url = parseBackgroundUrl(value);
                                    if (url !== '' && !cacheImage.has(url)) {
                                        cacheImage.set(url, { width: 0, height: 0, url });
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
    function setImageCache(element) {
        if (element && hasValue(element.src)) {
            cacheImage.set(element.src, {
                width: element.naturalWidth,
                height: element.naturalHeight,
                url: element.src
            });
        }
    }
    function setFramework(module, cached = false) {
        if (framework !== module) {
            const appBase = cached ? module.cached() : module.create();
            if (main || Object.keys(exports.settings).length === 0) {
                exports.settings = appBase.settings;
            }
            else {
                exports.settings = Object.assign(appBase.settings, exports.settings);
            }
            main = new Application(appBase.framework);
            main.settings = exports.settings;
            main.builtInExtensions = appBase.builtInExtensions;
            main.nodeObject = appBase.nodeObject;
            main.registerController(appBase.viewController);
            main.registerResource(appBase.resourceHandler);
            if (Array.isArray(exports.settings.builtInExtensions)) {
                const register = new Set();
                const extensions = main.builtInExtensions;
                for (let namespace of exports.settings.builtInExtensions) {
                    namespace = namespace.toLowerCase().trim();
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
        if (!main || main.closed) {
            return;
        }
        let __THEN;
        main.elements.clear();
        main.loading = false;
        setStyleMap();
        if (main.appName === '' && elements.length === 0) {
            elements.push(document.body);
        }
        for (let element of elements) {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            if (element instanceof HTMLElement) {
                main.elements.add(element);
            }
        }
        const rootElement = main.elements.values().next().value;
        function parseResume() {
            main.loading = false;
            if (main.settings.preloadImages && rootElement) {
                Array
                    .from(rootElement.getElementsByClassName('androme.preload'))
                    .forEach(element => rootElement.removeChild(element));
            }
            main.resourceHandler.imageDimensions = cacheImage;
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
                const filename = trimNull(element.dataset.filename).replace(new RegExp(`\.${main.viewController.settingsInternal.layout.fileExtension}$`), '') || element.id;
                const iteration = convertInt(element.dataset.iteration) + 1;
                element.dataset.iteration = iteration.toString();
                element.dataset.layoutName = convertWord(iteration > 1 ? `${filename}_${iteration}` : filename);
                if (main.initCache(element)) {
                    main.createDocument();
                    main.setConstraints();
                    main.setResources();
                    cacheRoot.add(element);
                }
            }
            if (typeof __THEN === 'function') {
                __THEN.call(main);
            }
        }
        if (main.settings.preloadImages && rootElement) {
            for (const image of cacheImage.values()) {
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
        const images = Array
            .from(main.elements)
            .map(element => {
            const queue = [];
            Array
                .from(element.querySelectorAll('IMG'))
                .forEach((image) => {
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
            main.loading = true;
            const queue = images.map(image => {
                return (new Promise((resolve, reject) => {
                    image.onload = resolve;
                    image.onerror = reject;
                }));
            });
            Promise
                .all(queue)
                .then((result) => {
                if (Array.isArray(result)) {
                    result.forEach(item => {
                        try {
                            setImageCache(item.srcElement);
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
                if (main.loading) {
                    __THEN = resolve;
                }
                else {
                    resolve();
                }
            }
        };
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
            for (const element of cacheRoot) {
                delete element.dataset.iteration;
                delete element.dataset.layoutName;
            }
            cacheRoot.clear();
            main.reset();
        }
    }
    function saveAllToDisk() {
        if (main && !main.loading && main.size > 0) {
            if (!main.closed) {
                main.finalize();
            }
            main.resourceHandler.file.saveAllToDisk(main.viewData);
        }
    }
    function toString() {
        return main ? main.toString() : '';
    }

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
    exports.Extension = Extension;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
