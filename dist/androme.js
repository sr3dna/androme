/* androme 1.8.28
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
    function convertWord(value) {
        return (value != null ? value.replace(/[^\w]/g, '_').trim() : '');
    }
    function capitalize(value, upper = true) {
        return value.charAt(0)[(upper ? 'toUpperCase' : 'toLowerCase')]() + value.substring(1)[(upper ? 'toLowerCase' : 'toString')]();
    }
    function averageInt(values) {
        return Math.floor(values.reduce((a, b) => a + b) / values.length);
    }
    function convertInt(value) {
        return (value && parseInt(value)) || 0;
    }
    function convertFloat(value) {
        return (value && parseFloat(value)) || 0;
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
    function isNumber(value) {
        return /^-?[0-9]+(\.[0-9]+)?$/.test(value.toString().trim());
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
    function same(obj1, obj2, ...attrs) {
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
        return (lower === upper || Math.floor(lower) === Math.floor(upper) || Math.ceil(lower) === Math.floor(upper) || Math.floor(lower) === Math.ceil(upper));
    }
    function caseInsensitve(a, b) {
        return (a.toString().toLowerCase() >= b.toString().toLowerCase() ? 1 : -1);
    }
    function sortAsc(list, ...attrs) {
        return sort(list, 0, ...attrs);
    }
    function sortDesc(list, ...attrs) {
        return sort(list, 1, ...attrs);
    }

    class NodeList {
        constructor(nodes, parent) {
            this.parent = parent;
            this.currentId = 0;
            this._list = [];
            if (Array.isArray(nodes)) {
                this._list = nodes;
            }
            this.parent = parent;
        }
        static cleared(list) {
            const result = new Set();
            const floats = new Set();
            list.forEach(node => {
                if (node.floating) {
                    floats.add(node.float);
                }
                const clear = node.css('clear');
                if (floats.size > 0 && (clear === 'both' || floats.has(clear))) {
                    result.add(node);
                    floats.clear();
                }
            });
            return result;
        }
        static linearX(list, offset = 0) {
            const nodes = list.filter(node => node.pageflow);
            switch (nodes.length) {
                case 0:
                    return false;
                case 1:
                    return true;
                default:
                    if (NodeList.cleared(nodes).size === 0) {
                        return nodes.every((node, index) => (node.inlineElement || node.floating) && !node.autoMargin && (index === 0 || node.linear.top < nodes[index - 1].linear.bottom));
                    }
                    return false;
            }
        }
        static linearY(list) {
            const nodes = list.filter(node => node.pageflow && !node.floating);
            switch (nodes.length) {
                case 0:
                    return false;
                case 1:
                    return true;
                default:
                    const minRight = Math.min.apply(null, nodes.map(node => node.linear.right));
                    const maxRight = Math.max.apply(null, nodes.map(node => node.linear.right));
                    return nodes.every((node, index) => {
                        if (node.linear.left < minRight) {
                            return true;
                        }
                        else {
                            const previous = nodes[index - 1];
                            if ((previous == null || (previous.pageflow && previous.inlineElement && previous.linear.right !== maxRight)) && node.inlineElement && node.pageflow && node.linear.right !== maxRight) {
                                return true;
                            }
                        }
                        return false;
                    });
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
            this.currentId = 0;
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
        partition(predicate) {
            const valid = [];
            const invalid = [];
            this._list.forEach((node) => {
                if (predicate(node)) {
                    valid.push(node);
                }
                else {
                    invalid.push(node);
                }
            });
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
            this._list = [];
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
            return ++this.currentId;
        }
        get linearX() {
            return NodeList.linearX(this._list);
        }
        get linearY() {
            return NodeList.linearY(this._list);
        }
        get top() {
            return Math.max.apply(null, this._list.map(node => node.linear.top));
        }
        get bottom() {
            return Math.max.apply(null, this._list.map(node => node.linear.bottom));
        }
        get right() {
            return Math.max.apply(null, this._list.map(node => node.linear.right));
        }
        get left() {
            return Math.max.apply(null, this._list.map(node => node.linear.left));
        }
    }

    function removePlaceholders(value) {
        return value.replace(/{[<:@>]{1}[0-9]+}/g, '').trim();
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
    function replaceTab(value, spaces = 4, preserve = false) {
        if (spaces > 0) {
            if (preserve) {
                value = value.split('\n').map(line => {
                    const match = line.match(/^(\t+)(.*)$/);
                    if (match != null) {
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
        value = value.replace(/&#(\d+);/g, (match, capture) => String.fromCharCode(capture));
        value = value.replace(/&nbsp;/g, '&#160;');
        return value;
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

    function setCache(element, attr, data) {
        if (element != null) {
            element[`__${attr}`] = data;
        }
    }
    function getCache(element, attr) {
        return (element != null ? element[`__${attr}`] : null);
    }
    function deleteCache(element, ...attrs) {
        if (element != null) {
            for (const attr of attrs) {
                delete element[`__${attr}`];
            }
        }
    }
    function getNode(element) {
        return getCache(element, 'node');
    }
    function previousNode(element) {
        let previous;
        do {
            previous = element.previousSibling;
            if (previous != null && getNode(previous)) {
                return getNode(previous);
            }
        } while (previous != null);
        return null;
    }
    function getRangeBounds(element) {
        let multiLine = false;
        const range = document.createRange();
        range.selectNodeContents(element);
        const domRect = Array.from(range.getClientRects());
        const result = JSON.parse(JSON.stringify(domRect[0]));
        const top = new Set([result.top]);
        const bottom = new Set([result.bottom]);
        for (let i = 1; i < domRect.length; i++) {
            const rect = domRect[i];
            top.add(rect.top);
            bottom.add(rect.bottom);
            result.width += rect.width;
            result.right = Math.max(rect.right, result.right);
        }
        if (top.size > 1 && bottom.size > 1) {
            result.top = Math.min.apply(null, Array.from(top));
            result.bottom = Math.max.apply(null, Array.from(bottom));
            result.height = result.bottom - result.top;
            multiLine = true;
        }
        return [assignBounds(result), multiLine];
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
                const node = getNode(element);
                const style = getCache(element, 'style');
                if (style != null) {
                    return style;
                }
                else if (node && node.style != null) {
                    return node.style;
                }
            }
            if (element.nodeName !== '#text') {
                const style = getComputedStyle(element);
                setCache(element, 'style', style);
                return style;
            }
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
        const node = getNode(element);
        const style = getStyle(element);
        ['padding', 'margin'].forEach(border => {
            ['Top', 'Left', 'Right', 'Bottom'].forEach(direction => {
                const attr = border + direction;
                const value = convertInt(node ? node[attr] : style[attr]);
                if (complete || value !== 0) {
                    result[attr] = value;
                }
            });
        });
        return result;
    }
    function hasFreeFormText(element, maxDepth = 0) {
        let valid = false;
        let depth = -1;
        function findFreeForm(elements) {
            if (depth === maxDepth) {
                return true;
            }
            return elements.some((item) => {
                if (item.nodeName === '#text' && optional(item, 'textContent').trim() !== '') {
                    valid = true;
                    return true;
                }
                else if (item.childNodes && item.childNodes.length > 0) {
                    depth++;
                    return findFreeForm(Array.from(item.childNodes));
                }
                return false;
            });
        }
        findFreeForm(Array.from(element.childNodes));
        return valid;
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
            if (bounds.width !== 0 && bounds.height !== 0 || hasValue(element.dataset.ext)) {
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
                        const float = style.cssFloat;
                        const position = style.position;
                        return ((position !== 'static' && position !== 'initial') || float === 'left' || float === 'right');
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
            const rgb = convertHextoRGB(x11[j]);
            if (rgb != null) {
                x11.rgb = rgb;
                x11.hsl = convertRGBtoHSL(x11.rgb.r, x11.rgb.g, x11.rgb.b);
            }
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
    function findNearestColor(value) {
        const result = HSL_SORTED.slice();
        let index = result.findIndex(item => item.hex === value);
        if (index !== -1) {
            return result[index];
        }
        else {
            const hsl = convertHextoHSL(value);
            if (hsl != null) {
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

    var NODE_STANDARD;
    (function (NODE_STANDARD) {
        NODE_STANDARD[NODE_STANDARD["NONE"] = 0] = "NONE";
        NODE_STANDARD[NODE_STANDARD["SELECT"] = 1] = "SELECT";
        NODE_STANDARD[NODE_STANDARD["RANGE"] = 2] = "RANGE";
        NODE_STANDARD[NODE_STANDARD["CHECKBOX"] = 3] = "CHECKBOX";
        NODE_STANDARD[NODE_STANDARD["RADIO"] = 4] = "RADIO";
        NODE_STANDARD[NODE_STANDARD["BUTTON"] = 5] = "BUTTON";
        NODE_STANDARD[NODE_STANDARD["EDIT"] = 6] = "EDIT";
        NODE_STANDARD[NODE_STANDARD["INLINE"] = 7] = "INLINE";
        NODE_STANDARD[NODE_STANDARD["TEXT"] = 8] = "TEXT";
        NODE_STANDARD[NODE_STANDARD["IMAGE"] = 9] = "IMAGE";
        NODE_STANDARD[NODE_STANDARD["LINE"] = 10] = "LINE";
        NODE_STANDARD[NODE_STANDARD["SPACE"] = 11] = "SPACE";
        NODE_STANDARD[NODE_STANDARD["BLOCK"] = 12] = "BLOCK";
        NODE_STANDARD[NODE_STANDARD["FRAME"] = 13] = "FRAME";
        NODE_STANDARD[NODE_STANDARD["LINEAR"] = 14] = "LINEAR";
        NODE_STANDARD[NODE_STANDARD["RADIO_GROUP"] = 15] = "RADIO_GROUP";
        NODE_STANDARD[NODE_STANDARD["GRID"] = 16] = "GRID";
        NODE_STANDARD[NODE_STANDARD["SCROLL_VERTICAL"] = 17] = "SCROLL_VERTICAL";
        NODE_STANDARD[NODE_STANDARD["SCROLL_HORIZONTAL"] = 18] = "SCROLL_HORIZONTAL";
        NODE_STANDARD[NODE_STANDARD["SCROLL_NESTED"] = 19] = "SCROLL_NESTED";
        NODE_STANDARD[NODE_STANDARD["RELATIVE"] = 20] = "RELATIVE";
        NODE_STANDARD[NODE_STANDARD["CONSTRAINT"] = 21] = "CONSTRAINT";
        NODE_STANDARD[NODE_STANDARD["WEB_VIEW"] = 22] = "WEB_VIEW";
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
        NODE_PROCEDURE[NODE_PROCEDURE["OPTIMIZE"] = 8] = "OPTIMIZE";
        NODE_PROCEDURE[NODE_PROCEDURE["CUSTOMIZATION"] = 16] = "CUSTOMIZATION";
        NODE_PROCEDURE[NODE_PROCEDURE["ACCESSIBILITY"] = 32] = "ACCESSIBILITY";
        NODE_PROCEDURE[NODE_PROCEDURE["ALL"] = 62] = "ALL";
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
        FRAME: 'FrameLayout',
        LINEAR: 'LinearLayout',
        CONSTRAINT: 'android.support.constraint.ConstraintLayout',
        RELATIVE: 'RelativeLayout',
        GRID: 'GridLayout',
        SCROLL_VERTICAL: 'ScrollView',
        SCROLL_HORIZONTAL: 'HorizontalScrollView',
        SCROLL_NESTED: 'android.support.v4.widget.NestedScrollView',
        RADIO_GROUP: 'RadioGroup',
        WEB_VIEW: 'WebView',
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
        excludeTextColor: ['#000000'],
        excludeBackgroundColor: ['#FFFFFF'],
        collapseUnattributedElements: false,
        horizontalPerspective: true,
        constraintPercentAccuracy: 4,
        constraintChainDisabled: false,
        constraintWhitespaceHorizontalOffset: 4,
        constraintWhitespaceVerticalOffset: 16,
        constraintChainPackedHorizontalOffset: 4,
        constraintChainPackedVerticalOffset: 16,
        constraintCirclePositionAbsolute: false,
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
        constructor(TypeT) {
            this.TypeT = TypeT;
            this.elements = new Set();
            this.insert = {};
            this.closed = false;
            this.sorted = {};
            this.views = [];
            this.includes = [];
            this.currentIndex = -1;
            this._extensions = [];
            this.cache = new NodeList();
            this.cacheInternal = new NodeList();
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
            const visible = this.cacheInternal.visible;
            for (const node of visible) {
                if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.LAYOUT)) {
                    node.setLayout();
                }
                if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.ALIGNMENT)) {
                    node.setAlignment();
                }
            }
            for (const node of visible) {
                if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.OPTIMIZE)) {
                    node.optimizeLayout();
                }
                if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.CUSTOMIZATION)) {
                    node.applyCustomizations(SETTINGS.customizationsOverwritePrivilege);
                }
            }
            this.controllerHandler.setDimensions(this.viewData);
            this.insertAuxillaryViews();
            this.resourceHandler.finalize(this.viewData);
            this.resourceHandler.filterStyles(this.viewData);
            if (SETTINGS.showAttributes) {
                this.setAttributes();
            }
            this.controllerHandler.finalize(this.layouts);
            this.closed = true;
        }
        reset() {
            for (const node of this.cacheInternal) {
                deleteCache(node.element, 'style', 'styleMap', 'boxSpacing', 'boxStyle', 'fontStyle', 'imageSource', 'optionArray', 'valueString');
            }
            this.cache.reset();
            this.cacheInternal.reset();
            this.resetController();
            this.resetResource();
            this.appName = '';
            this.sorted = {};
            this.views = [];
            this.includes = [];
            this.insert = {};
            this.currentIndex = -1;
            this.closed = false;
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
            this.resourceHandler.setBoxStyle();
            this.resourceHandler.setFontStyle();
            this.resourceHandler.setBoxSpacing();
            this.resourceHandler.setValueString(this.controllerHandler.supportInline);
            this.resourceHandler.setOptionArray();
            this.resourceHandler.setImageSource();
        }
        setStyleMap() {
            let warning = false;
            for (let i = 0; i < document.styleSheets.length; i++) {
                const styleSheet = document.styleSheets[i];
                if (styleSheet.cssRules != null) {
                    for (let j = 0; j < styleSheet.cssRules.length; j++) {
                        try {
                            const cssRule = styleSheet.cssRules[j];
                            const attrs = new Set();
                            for (const attr of Array.from(cssRule.style)) {
                                attrs.add(convertCamelCase(attr));
                            }
                            const elements = document.querySelectorAll(cssRule.selectorText);
                            if (this.appName !== '') {
                                Array.from(elements).forEach((element) => deleteCache(element, 'style', 'styleMap'));
                            }
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
                                            case 'width':
                                            case 'height':
                                            case 'marginTop':
                                            case 'marginRight':
                                            case 'marginBottom':
                                            case 'marginLeft':
                                                styleMap[attr] = (/^[\-A-za-z]+$/.test(cssStyle) || isPercent(cssStyle) ? cssStyle : convertPX(cssStyle));
                                                break;
                                        }
                                    }
                                }
                                const data = getCache(element, 'styleMap');
                                if (data != null) {
                                    Object.assign(data, styleMap);
                                }
                                else {
                                    setCache(element, 'style', style);
                                    setCache(element, 'styleMap', styleMap);
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
            for (const extension of extensions) {
                extension.setTarget({}, undefined, root);
                extension.beforeInit();
            }
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
                        const supportInline = this.controllerHandler.supportInline;
                        const styleMap = getCache(element, 'styleMap');
                        if ((!styleMap || Object.keys(styleMap).length === 0) && supportInline.includes(element.tagName) && element.parentElement && Array.from(element.parentElement.children).every(item => item.children.length === 0 && supportInline.includes(item.tagName))) {
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
                for (const node of this.cache) {
                    const element = node.element;
                    preAlignment[node.id] = {};
                    const style = preAlignment[node.id];
                    const textAlign = node.css('textAlign');
                    switch (textAlign) {
                        case 'center':
                            if (element.tagName !== 'BUTTON' && element.type === 'button') {
                                break;
                            }
                        case 'right':
                        case 'end':
                            style.textAlign = textAlign;
                            element.style.textAlign = 'left';
                            break;
                    }
                    if (node.position === 'relative') {
                        ['top', 'right', 'bottom', 'left'].forEach(value => {
                            if (node.styleMap[value] != null) {
                                style[value] = node.styleMap[value];
                                element.style[value] = '0px';
                            }
                        });
                    }
                    style.verticalAlign = node.styleMap.verticalAlign || '';
                    element.style.verticalAlign = 'top';
                    if (node.overflow !== 0 /* NONE */) {
                        if (node.isSet('styleMap', 'width')) {
                            style.width = node.styleMap.width;
                            element.style.width = 'auto';
                        }
                        if (node.isSet('styleMap', 'height')) {
                            style.height = node.styleMap.height;
                            element.style.height = 'auto';
                        }
                        style.overflow = node.style.overflow;
                        element.style.overflow = 'visible';
                    }
                    node.setBounds();
                }
                for (const node of this.cache) {
                    if (node.pageflow) {
                        const element = node.element;
                        if (element.tagName === 'INPUT' && !includesEnum(node.excludeProcedure, NODE_PROCEDURE.ACCESSIBILITY)) {
                            switch (element.type) {
                                case 'radio':
                                case 'checkbox':
                                    const found = [element.previousElementSibling, element.nextElementSibling].some((sibling) => {
                                        if (sibling && sibling.htmlFor !== '' && sibling.htmlFor === element.id) {
                                            const label = getNode(sibling);
                                            if (label && label.pageflow) {
                                                node.companion = label;
                                                node.setBounds();
                                                label.hide();
                                                return true;
                                            }
                                        }
                                        return false;
                                    });
                                    if (!found) {
                                        const label = getNode(element.parentElement);
                                        if (label && label.element.tagName === 'LABEL' && label.element.children.length === 1) {
                                            node.companion = label;
                                            node.setBounds();
                                            label.hide();
                                        }
                                    }
                                    break;
                            }
                        }
                    }
                }
                const visible = this.cache.visible;
                for (const node of visible) {
                    if (!node.documentRoot) {
                        let parent = getNode(node.element.parentElement);
                        if (parent) {
                            if (!node.pageflow) {
                                let found = false;
                                let previous = null;
                                while (parent && parent.id !== 0) {
                                    if (node.position === 'absolute') {
                                        const position = parent.position;
                                        if (!(position === 'static' || position === 'initial')) {
                                            found = true;
                                            break;
                                        }
                                    }
                                    else {
                                        if ((node.withinX(parent.box) && node.withinY(parent.box)) || (previous != null && ((node.linear.top >= parent.linear.top && node.linear.top < previous.linear.top) || (node.linear.right <= parent.linear.right && node.linear.right > previous.linear.right) || (node.linear.bottom <= parent.linear.bottom && node.linear.bottom > previous.linear.bottom) || (node.linear.left >= parent.linear.left && node.linear.left < previous.linear.left)))) {
                                            found = true;
                                            break;
                                        }
                                    }
                                    previous = parent;
                                    parent = getNode(parent.element.parentElement);
                                }
                                if (!found) {
                                    parent = this.cache.parent;
                                }
                            }
                            else {
                                if (parent === node.companion) {
                                    const container = getNode(parent.element.parentElement);
                                    if (container) {
                                        parent = container;
                                    }
                                }
                            }
                            node.parent = parent;
                            parent.children.push(node);
                        }
                    }
                }
                for (const node of visible) {
                    const supportInline = this.controllerHandler.supportInline;
                    const text = [];
                    let valid = true;
                    Array.from(node.element.childNodes).forEach((element) => {
                        if (element.nodeName === '#text') {
                            if (optional(element, 'textContent').trim() !== '') {
                                text.push(element);
                            }
                        }
                        else if (!supportInline.includes(element.tagName) || getNode(element)) {
                            valid = false;
                        }
                    });
                    if (!valid) {
                        text.forEach(element => this.insertNode(element, node));
                    }
                    if (node.children.some(current => current.float !== 'right' && (current.marginLeft < 0 && node.marginLeft >= Math.abs(current.marginLeft))) || node.children.some(current => !current.pageflow && (convertInt(current.left) < 0 && node.marginLeft >= Math.abs(convertInt(current.left))))) {
                        const marginLeft = [];
                        node.each(current => {
                            let left = current.marginLeft;
                            let leftType = 0;
                            if (left < 0 && node.marginLeft >= left) {
                                leftType = 1;
                            }
                            if (!current.pageflow) {
                                if (leftType === 0) {
                                    left = convertInt(current.left);
                                    if (left < 0 && node.marginLeft >= left) {
                                        current.css('left', formatPX(left + node.marginLeft));
                                        leftType = 2;
                                    }
                                }
                            }
                            marginLeft.push(leftType);
                        });
                        const marginLeftType = Math.max.apply(null, marginLeft);
                        node.each((current, index) => {
                            if (marginLeftType && marginLeft[index] !== 2 && ((marginLeftType === 1 && marginLeft[index] === 1) || marginLeftType === 2)) {
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + node.marginLeft, true);
                            }
                        });
                        if (marginLeftType) {
                            node.box.left -= node.marginLeft;
                            node.css('marginLeft', '0px');
                        }
                        node.setDimensions(['box']);
                    }
                    if (!node.pageflow && node.children.length > 0) {
                        let calibrate = false;
                        if (node.viewWidth === 0) {
                            const maxRight = Math.max.apply(null, node.cascade().map(item => item.linear.right));
                            node.bounds.right = maxRight + node.paddingRight + node.borderRightWidth;
                            node.bounds.width = node.bounds.right - node.bounds.left;
                            calibrate = true;
                        }
                        if (node.viewHeight === 0) {
                            const maxBottom = Math.max.apply(null, node.cascade().map(item => item.linear.bottom));
                            node.bounds.bottom = maxBottom + node.paddingBottom + node.borderBottomWidth;
                            node.bounds.height = node.bounds.bottom - node.bounds.top;
                            calibrate = true;
                        }
                        if (calibrate) {
                            node.setBounds(true);
                        }
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
                for (const extension of extensions) {
                    extension.setTarget(rootNode);
                    extension.afterInit();
                }
                for (const node of this.cache.elements) {
                    let i = 0;
                    Array.from(node.element.childNodes).forEach((element) => {
                        const child = getNode(element);
                        if (child && child.visible) {
                            child.siblingIndex = i++;
                        }
                    });
                    sortAsc(node.children, 'siblingIndex');
                }
                this.cache.sortAsc('depth', 'parent.id', 'siblingIndex', 'id');
                this.addLayout(root.dataset.viewName);
                return true;
            }
            return false;
        }
        createLayoutXml() {
            const application = this;
            const extensions = this.extensions;
            const mapX = [];
            const mapY = [];
            let output = `<?xml version="1.0" encoding="utf-8"?>\n{:0}`;
            let empty = true;
            for (const node of this.cache.visible) {
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
            }
            for (let i = 0; i < mapY.length; i++) {
                const coordsY = Object.keys(mapY[i]);
                const partial = new Map();
                const external = new Map();
                function renderXml(node, parent, xml, current = '') {
                    if (xml !== '') {
                        if (current === '' && !application.elements.has(node.element)) {
                            if (node.isSet('dataset', 'target')) {
                                const target = application.findByDomId(node.dataset.target, true);
                                if (target == null || target !== parent) {
                                    application.addInsertQueue(node.dataset.target, [xml]);
                                    node.relocated = true;
                                    return;
                                }
                            }
                            else if (parent.isSet('dataset', 'target')) {
                                application.addInsertQueue(parent.nodeId, [xml]);
                                node.dataset.target = parent.nodeId;
                                return;
                            }
                        }
                        if (current !== '') {
                            if (!external.has(current)) {
                                external.set(current, []);
                            }
                            external.get(current).push(xml);
                        }
                        else {
                            if (!partial.has(parent.id)) {
                                partial.set(parent.id, []);
                            }
                            partial.get(parent.id).push(xml);
                        }
                    }
                }
                for (let j = 0; j < coordsY.length; j++) {
                    const axisY = [];
                    const below = [];
                    const middle = [];
                    const above = [];
                    let parent = this.cache.locate('id', parseInt(coordsY[j]));
                    for (const node of mapY[i][coordsY[j]]) {
                        const zIndex = convertInt(node.css('zIndex'));
                        const documentParent = (node.parent.element === node.element.parentElement);
                        if (node.documentRoot) {
                            axisY.push(node);
                        }
                        else if (node.pageflow || (zIndex === 0 && documentParent)) {
                            middle.push(node);
                        }
                        else {
                            if (zIndex > 0 || !documentParent) {
                                above.push(node);
                            }
                            else {
                                below.push(node);
                            }
                        }
                    }
                    if (parent != null) {
                        this.sortLayout(parent, middle);
                    }
                    axisY.push(...sortAsc(below, 'style.zIndex', 'siblingIndex'));
                    axisY.push(...middle);
                    axisY.push(...sortAsc(above, 'style.zIndex', 'siblingIndex'));
                    const includes$$1 = [];
                    let current = '';
                    for (let k = 0; k < axisY.length; k++) {
                        const nodeY = axisY[k];
                        if (!nodeY.documentRoot && this.elements.has(nodeY.element)) {
                            continue;
                        }
                        parent = nodeY.parent;
                        if (this.controllerHandler.supportInclude) {
                            const filename = optional(nodeY, 'dataset.include').trim();
                            if (filename !== '' && includes$$1.indexOf(filename) === -1) {
                                renderXml(nodeY, parent, this.controllerHandler.renderInclude(nodeY, parent, filename), (includes$$1.length > 0 ? includes$$1[includes$$1.length - 1] : ''));
                                includes$$1.push(filename);
                            }
                            current = (includes$$1.length > 0 ? includes$$1[includes$$1.length - 1] : '');
                            if (current !== '') {
                                const cloneParent = parent.clone();
                                cloneParent.renderDepth = this.controllerHandler.getIncludeRenderDepth(current);
                                nodeY.parent = cloneParent;
                                parent = cloneParent;
                            }
                        }
                        if (!nodeY.rendered) {
                            const renderExtension = parent.renderExtension;
                            if (renderExtension != null) {
                                renderExtension.setTarget(nodeY, parent);
                                const result = renderExtension.processChild();
                                if (result.xml !== '') {
                                    renderXml(nodeY, parent, result.xml, current);
                                }
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
                                            renderXml(nodeY, parent, result.xml, current);
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
                            const cleared = NodeList.cleared(axisY.slice(k));
                            if (!nodeY.rendered) {
                                if (SETTINGS.horizontalPerspective) {
                                    if (nodeY.pageflow && !nodeY.inlineWrap && !hasValue(nodeY.dataset.target) && !parent.flex.enabled && !parent.inlineWrap && parent.styleMap.columnCount == null && (parent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE) || (parent.is(NODE_STANDARD.LINEAR) && !parent.horizontal))) {
                                        const horizontal = [nodeY];
                                        let vertical = [nodeY];
                                        for (let l = k + 1; l < axisY.length; l++) {
                                            const adjacent = axisY[l];
                                            if (adjacent.pageflow) {
                                                const previous = adjacent.previousSibling;
                                                if (previous && (cleared.has(adjacent) ||
                                                    (!previous.floating && previous.autoMargin) ||
                                                    (!adjacent.floating && (!previous.inlineElement || previous.autoMargin)) ||
                                                    (!previous.floating && adjacent.autoMargin) ||
                                                    (vertical.length > horizontal.length && NodeList.linearY([...horizontal.slice(), ...[adjacent]])))) {
                                                    if (horizontal.length > 1 || !parent.is(NODE_STANDARD.CONSTRAINT) || vertical[0].autoMargin || adjacent.autoMargin) {
                                                        break;
                                                    }
                                                    vertical.push(adjacent);
                                                }
                                                else {
                                                    if (vertical.length > 1 || (adjacent.element.previousElementSibling && (adjacent.element.previousElementSibling.tagName === 'BR' || (BLOCK_ELEMENT.includes(adjacent.element.previousElementSibling.tagName) && !getNode(adjacent.element.previousElementSibling))))) {
                                                        break;
                                                    }
                                                    if (!cleared.has(adjacent)) {
                                                        const target = hasValue(adjacent.dataset.target);
                                                        if (!target) {
                                                            horizontal.push(adjacent);
                                                        }
                                                        if (previous == null || (((previous.inlineElement || previous.floating) && adjacent.inlineElement) || (previous.floating && !adjacent.inlineElement))) {
                                                            continue;
                                                        }
                                                        if (!NodeList.linearX(horizontal)) {
                                                            if (parent.is(NODE_STANDARD.CONSTRAINT) && NodeList.linearY(horizontal)) {
                                                                vertical = horizontal.slice();
                                                                horizontal.length = 1;
                                                            }
                                                            else {
                                                                if (!target) {
                                                                    horizontal.pop();
                                                                }
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        let group = null;
                                        let groupXml = '';
                                        if (horizontal.length > 1) {
                                            if (parent.is(NODE_STANDARD.RELATIVE) && horizontal.length === parent.children.length) {
                                                parent.inlineWrap = true;
                                            }
                                            else {
                                                group = this.controllerHandler.createGroup(nodeY, horizontal, parent);
                                                if (horizontal.some(item => item.multiLine)) {
                                                    groupXml = this.writeRelativeLayout(group, parent);
                                                    group.inlineWrap = true;
                                                }
                                                else if (horizontal.some(item => item.floating || item.position === 'relative')) {
                                                    groupXml = this.writeFrameLayoutGroup(group, parent, horizontal);
                                                    parent.children = parent.children.filter((item) => !horizontal.includes(item));
                                                    group.inlineWrap = true;
                                                }
                                                else {
                                                    groupXml = this.writeLinearLayout(group, parent, true);
                                                    this.sortLayout(group, group.children, true);
                                                }
                                            }
                                        }
                                        else if (vertical.length > 1) {
                                            group = this.controllerHandler.createGroup(nodeY, vertical, parent);
                                            groupXml = this.writeLinearLayout(group, parent, false);
                                            this.sortLayout(group, group.children, true);
                                        }
                                        if (group != null) {
                                            renderXml(group, parent, groupXml, current);
                                            parent = nodeY.parent;
                                        }
                                    }
                                }
                                let xml = '';
                                if (nodeY.nodeName === '') {
                                    const untargeted = nodeY.children.filter(node => !node.isSet('dataset', 'target'));
                                    if (untargeted.length === 0) {
                                        if (hasFreeFormText(nodeY.element, 1) || (!SETTINGS.collapseUnattributedElements && !BLOCK_ELEMENT.includes(nodeY.element.tagName))) {
                                            xml = this.writeNode(nodeY, parent, NODE_STANDARD.TEXT);
                                        }
                                        else {
                                            if (SETTINGS.collapseUnattributedElements && nodeY.viewWidth === 0 && nodeY.viewHeight === 0) {
                                                continue;
                                            }
                                            else if (!nodeY.documentRoot) {
                                                xml = this.writeFrameLayout(nodeY, parent);
                                            }
                                        }
                                    }
                                    else {
                                        if (nodeY.flex.enabled || untargeted.some(node => !node.pageflow) || nodeY.styleMap.columnCount != null) {
                                            xml = this.writeConstraintLayout(nodeY, parent);
                                        }
                                        else {
                                            if (untargeted.length === 1) {
                                                if (SETTINGS.collapseUnattributedElements && Object.keys(nodeY.styleMap).length === 0 && !this.controllerHandler.hasAppendProcessing(nodeY.id)) {
                                                    const child = untargeted[0];
                                                    child.documentRoot = nodeY.documentRoot;
                                                    child.parent = parent;
                                                    nodeY.hide();
                                                    axisY[k] = child;
                                                    k--;
                                                }
                                                else {
                                                    xml = this.writeFrameLayout(nodeY, parent);
                                                }
                                            }
                                            else {
                                                const linearX = NodeList.linearX(nodeY.children);
                                                if (!parent.flex.enabled && nodeY.children.every(node => node.pageflow)) {
                                                    const float = new Set(nodeY.children.map(node => node.float));
                                                    if (linearX) {
                                                        if (float.size === 1 && !nodeY.children.some(node => node.multiLine)) {
                                                            xml = this.writeLinearLayout(nodeY, parent, true);
                                                        }
                                                        else if (nodeY.children.some(node => node.floating)) {
                                                            const group = this.controllerHandler.createGroup(nodeY, nodeY.children, parent, nodeY.element);
                                                            xml = this.writeFrameLayoutGroup(group, parent, nodeY.children);
                                                            group.inlineWrap = true;
                                                        }
                                                    }
                                                    else {
                                                        const blockClear = NodeList.cleared(nodeY.children);
                                                        if (nodeY.children.some((node) => !node.inlineElement || blockClear.has(node)) && !nodeY.children.some(node => node.autoMargin)) {
                                                            xml = this.writeLinearLayout(nodeY, parent, false);
                                                        }
                                                    }
                                                }
                                                if (xml === '') {
                                                    if (SETTINGS.horizontalPerspective && nodeY.children.every((node) => node.pageflow && node.inlineElement && !cleared.has(node))) {
                                                        xml = this.writeRelativeLayout(nodeY, parent);
                                                    }
                                                    else {
                                                        xml = this.writeConstraintLayout(nodeY, parent);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    xml = this.writeNode(nodeY, parent, nodeY.nodeName);
                                }
                                renderXml(nodeY, parent, xml, current);
                            }
                        }
                        if (this.controllerHandler.supportInclude) {
                            if (includes$$1.length > 0 && optional(nodeY, 'dataset.includeEnd') === 'true') {
                                includes$$1.pop();
                            }
                        }
                    }
                }
                for (const [id, views] of partial.entries()) {
                    const content = [];
                    if (this.sorted[id] != null) {
                        const parsed = [];
                        this.sorted[id].forEach(value => {
                            const result = views.find((view) => view.indexOf(`{@${value}}`) !== -1);
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
                    const placeholder = `{:${id}}`;
                    if (output.indexOf(placeholder) !== -1) {
                        output = output.replace(placeholder, content.join('') + placeholder);
                        empty = false;
                    }
                    else {
                        this.addInsertQueue(id, views);
                    }
                }
                for (const [current, views] of external.entries()) {
                    const xml = this.controllerHandler.renderIncludeContent(current, views);
                    this.addInclude(current, xml);
                }
            }
            const root = this.cache.parent;
            if (root.renderExtension == null || !root.isSet('dataset', 'target')) {
                const pathname = trim(optional(root, 'dataset.folder').trim(), '/');
                this.updateLayout(pathname, (!empty ? output : ''), (root.renderExtension != null && root.renderExtension.documentRoot));
            }
            else {
                this.views.pop();
            }
            if (!empty) {
                for (const extension of extensions) {
                    extension.setTarget(root);
                    extension.afterRender();
                }
            }
            else if (root.renderExtension == null) {
                root.visible = false;
            }
            this.cacheInternal.append(...this.cache);
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
        writeFrameLayoutGroup(group, parent, nodes) {
            let xml = '';
            const [floated, pageflow] = new NodeList(nodes).partition(item => item.floating || item.styleMap.marginLeft === 'auto' || item.styleMap.marginRight === 'auto');
            const [right, left] = new NodeList(floated.list).partition(item => item.float === 'right' || item.styleMap.marginLeft === 'auto');
            const [linearX, linearY] = [pageflow.linearX, pageflow.linearY];
            if (pageflow.length > 1 && !linearX && !linearY) {
                xml = this.writeConstraintLayout(group, parent);
                group.inlineWrap = true;
            }
            else {
                const merged = [...left.list, ...pageflow.list];
                if (merged.length === nodes.length) {
                    xml = this.writeLinearLayout(group, parent, true);
                    this.sortLayout(group, group.children, true);
                }
                else {
                    xml = this.writeFrameLayout(group, parent, true);
                    const placeholder = `{:${group.id}}`;
                    [merged, right.list].forEach((item, index) => {
                        if (item.length > 1) {
                            const linearGroup = this.controllerHandler.createGroup(item[0], item, group);
                            xml = xml.replace(placeholder, (index === 0 ? '' : placeholder) + this.writeLinearLayout(linearGroup, group, true) + (index === 0 ? placeholder : ''));
                            this.sortLayout(linearGroup, item, true);
                        }
                        else if (item.length > 0) {
                            item[0].inlineWrap = true;
                        }
                    });
                }
            }
            return xml;
        }
        addInsertQueue(id, views) {
            if (this.insert[id] == null) {
                this.insert[id] = [];
            }
            this.insert[id].push(...views);
        }
        insertAuxillaryViews() {
            for (const node of this.cacheInternal) {
                const extension = node.renderExtension;
                if (extension != null) {
                    extension.setTarget(node);
                    extension.beforeInsert();
                }
            }
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
                    const target = this.cacheInternal.locate('id', parseInt(replaceId));
                    if (target != null) {
                        const depth = target.renderDepth + 1;
                        output = placeIndent(output, depth);
                        const pattern = /{@([0-9]+)}/g;
                        let match = null;
                        let i = 0;
                        while ((match = pattern.exec(output)) != null) {
                            const node = this.cacheInternal.locate('id', parseInt(match[1]));
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
                        template[inner] = template[inner].replace(`{:${outer}}`, template[outer]);
                        template[outer] = template[outer].replace(`{:${inner}}`, template[inner]);
                    }
                }
            }
            for (const value of this.layouts) {
                for (const id in template) {
                    value.content = value.content.replace(`{:${id}}`, template[id]);
                }
                value.content = this.controllerHandler.insertAuxillaryViews(value.content);
            }
            for (const node of this.cacheInternal) {
                const extension = node.renderExtension;
                if (extension != null) {
                    extension.setTarget(node);
                    extension.afterInsert();
                }
            }
        }
        setAttributes() {
            this.controllerHandler.setAttributes(this.viewData);
            for (const node of this.cacheInternal) {
                const extension = node.renderExtension;
                if (extension != null) {
                    extension.setTarget(node);
                    extension.finalize();
                }
            }
        }
        addLayout(value) {
            this.currentIndex = this.views.length;
            this.views.push({
                filename: value,
                pathname: '',
                content: ''
            });
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
        sortLayout(parent, children, save = false) {
            let sorted = false;
            switch (parent.nodeType) {
                case NODE_STANDARD.CONSTRAINT:
                    children.sort((a, b) => {
                        const indexA = a.css('zIndex');
                        const indexB = b.css('zIndex');
                        if ((indexA === 'auto' || indexA === '' || indexA === '0') && (indexB === 'auto' || indexB === '' || indexB === '0')) {
                            return (a.siblingIndex < b.siblingIndex ? -1 : 1);
                        }
                        else {
                            return (convertInt(indexA) <= convertInt(indexB) ? -1 : 1);
                        }
                    });
                    sorted = true;
                    break;
                case NODE_STANDARD.LINEAR:
                    if (parent.horizontal) {
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
                    break;
            }
            if (save && sorted) {
                this.sorted[parent.id] = children.map(item => item.id);
            }
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
            return (current ? this.cache : this.cacheInternal).locate(node => node.element.id === id || node.nodeId === id);
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
                    node.styleMap.cssFloat = 'none';
                    node.styleMap.clear = 'none';
                    if (parent != null) {
                        node.parent = parent;
                        node.inherit(parent, 'style');
                        parent.children.push(node);
                    }
                    node.setBounds();
                }
            }
            else if (isVisible(element)) {
                node = new this.TypeT(this.cache.nextId, SETTINGS.targetAPI, element);
                if (getCache(element, 'nodeIsolated')) {
                    node.isolated = true;
                }
                node.setExcludeProcedure();
                node.setExcludeResource();
            }
            if (node != null) {
                this.cache.append(node);
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
        get extensions() {
            return this._extensions.filter(item => item.enabled);
        }
        get viewData() {
            return { cache: this.cacheInternal, views: this.views, includes: this.includes };
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
                const extension = optional(this.node.element, 'dataset.ext');
                if (extension === '') {
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
                    if (getCache(this.element, 'andromeExternalDisplay') == null) {
                        const display = [];
                        let current = this.element;
                        while (current != null) {
                            display.push(getStyle(current).display);
                            current.style.display = 'block';
                            current = current.parentElement;
                        }
                        setCache(this.element, 'andromeExternalDisplay', display);
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
                    const data = getCache(this.element, 'andromeExternalDisplay');
                    if (data != null) {
                        const display = data;
                        let current = this.element;
                        let i = 0;
                        while (current != null) {
                            current.style.display = display[i];
                            current = current.parentElement;
                            i++;
                        }
                        deleteCache(this.element, 'andromeExternalDisplay');
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
            if (xml !== '') {
                output += indent + `<${tagName}${(depth === 0 ? '{#0}' : '')}{@${id}}>\n` +
                    xml +
                    indent + `</${tagName}>\n`;
            }
            else {
                output += indent + `<${tagName}${(depth === 0 ? '{#0}' : '')}{@${id}} />\n`;
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
            this.cache.elements.filter(node => !includesEnum(node.excludeResource, NODE_RESOURCE.BOX_SPACING)).each(node => {
                if (getCache(node.element, 'boxSpacing') == null || SETTINGS.alwaysReevaluateResources) {
                    const result = getBoxSpacing(node.element);
                    const formatted = {};
                    const inlineChild = (node.renderChildren.length > 0 && node.renderChildren.every(item => item.inline));
                    for (const attr in result) {
                        if ((node.inline && (attr === 'marginTop' || attr === 'marginBottom')) || (inlineChild && (attr === 'paddingTop' || attr === 'paddingBottom'))) {
                            formatted[attr] = '0px';
                        }
                        else {
                            formatted[attr] = convertPX(result[attr]);
                        }
                    }
                    setCache(node.element, 'boxSpacing', formatted);
                }
            });
        }
        setBoxStyle() {
            this.cache.elements.filter(node => !includesEnum(node.excludeResource, NODE_RESOURCE.BOX_STYLE)).each(node => {
                if (getCache(node.element, 'boxStyle') == null || SETTINGS.alwaysReevaluateResources) {
                    const result = {
                        borderTop: this.parseBorderStyle,
                        borderRight: this.parseBorderStyle,
                        borderBottom: this.parseBorderStyle,
                        borderLeft: this.parseBorderStyle,
                        borderRadius: this.parseBorderRadius,
                        backgroundColor: this.parseBackgroundColor,
                        backgroundImage: (!includesEnum(node.excludeResource, NODE_RESOURCE.IMAGE_SOURCE) ? this.parseBackgroundImage : ''),
                        backgroundSize: this.parseBoxDimensions,
                        backgroundRepeat: this.parseBackgroundRepeat,
                        backgroundPosition: this.parseBackgroundPosition
                    };
                    for (const i in result) {
                        if (typeof result[i] === 'function') {
                            result[i] = result[i](node.css(i), node, i);
                        }
                    }
                    if (result.backgroundColor.length > 0 && ((SETTINGS.excludeBackgroundColor.includes(result.backgroundColor[0]) && result.backgroundColor[1] !== node.styleMap.backgroundColor) || (node.styleMap.backgroundColor == null && node.documentParent.visible && sameAsParent(node.element, 'backgroundColor')))) {
                        result.backgroundColor = [];
                    }
                    const borderTop = JSON.stringify(result.borderTop);
                    if (borderTop === JSON.stringify(result.borderRight) && borderTop === JSON.stringify(result.borderBottom) && borderTop === JSON.stringify(result.borderLeft)) {
                        result.border = result.borderTop;
                    }
                    setCache(node.element, 'boxStyle', result);
                }
            });
        }
        setFontStyle() {
            this.cache.filter(node => node.visible && !includesEnum(node.excludeResource, NODE_RESOURCE.FONT_STYLE)).each(node => {
                if (getCache(node.element, 'fontStyle') == null || SETTINGS.alwaysReevaluateResources) {
                    if (node.renderChildren.length > 0 || node.element.tagName === 'IMG' || node.element.tagName === 'HR') {
                        return;
                    }
                    else {
                        let color = parseRGBA(node.css('color'), node.css('opacity'));
                        if (color.length > 0 && SETTINGS.excludeTextColor.includes(color[0]) && (node.element.nodeName === '#text' || color[1] !== node.styleMap.color)) {
                            color = [];
                        }
                        let backgroundColor = parseRGBA(node.css('backgroundColor'), node.css('opacity'));
                        if (backgroundColor.length > 0 && (this.hasDrawableBackground(getCache(node.element, 'boxStyle')) || (SETTINGS.excludeBackgroundColor.includes(backgroundColor[0]) && (node.element.nodeName === '#text' || backgroundColor[1] !== node.styleMap.backgroundColor)) || (node.styleMap.backgroundColor == null && sameAsParent(node.element, 'backgroundColor')))) {
                            backgroundColor = [];
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
                            color,
                            backgroundColor
                        };
                        setCache(node.element, 'fontStyle', result);
                    }
                }
            });
        }
        setOptionArray() {
            this.cache.filter(node => node.visible && node.element.tagName === 'SELECT' && !includesEnum(node.excludeResource, NODE_RESOURCE.OPTION_ARRAY)).each(node => {
                const element = node.element;
                if (getCache(element, 'optionArray') == null || SETTINGS.alwaysReevaluateResources) {
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
                    setCache(element, 'optionArray', { stringArray: (stringArray.length > 0 ? stringArray : null), numberArray: (numberArray && numberArray.length > 0 ? numberArray : null) });
                }
            });
        }
        setValueString(supportInline) {
            this.cache.filter(node => node.visible && !includesEnum(node.excludeResource, NODE_RESOURCE.VALUE_STRING)).each(node => {
                const element = node.element;
                if (getCache(element, 'valueString') == null || SETTINGS.alwaysReevaluateResources) {
                    let name = '';
                    let value = '';
                    let inlineTrim = false;
                    if (element.tagName === 'INPUT') {
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
                                    value = node.companion.element.innerText.trim();
                                }
                                break;
                        }
                    }
                    else if (element.tagName === 'TEXTAREA') {
                        value = element.value.trim();
                    }
                    else if (element.nodeName === '#text') {
                        value = element.textContent;
                        if (element.previousSibling && element.previousSibling.tagName === 'BR') {
                            value = value.replace(/^\s+/g, '');
                        }
                        inlineTrim = true;
                    }
                    else if (node.hasElement) {
                        if (node.children.length === 0 && hasFreeFormText(element)) {
                            name = (element.innerText || element.textContent || '').trim();
                            value = replaceEntity(element.children.length > 0 || element.tagName === 'CODE' ? element.innerHTML : element.innerText || element.textContent || '');
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
                                    value = value.replace(/\s+/g, ' ');
                                default:
                                    value = value.replace(/^\s+/g, '');
                                    inlineTrim = true;
                                    break;
                            }
                            value = value.replace(/<br\s*\/?>/g, '\\n');
                            value = value.replace(/\s+(class|style)=".*?"/g, '');
                        }
                    }
                    if (inlineTrim) {
                        const previousSibling = node.previousSibling;
                        const nextSibling = node.nextSibling;
                        const original = value;
                        value = value.trim();
                        if (previousSibling && previousSibling.display !== 'block' && !/\s+$/.test((previousSibling.element.innerText || previousSibling.element.textContent)) && /^\s+/.test(original)) {
                            value = '&#160;' + value;
                        }
                        if (nextSibling && /\s+$/.test(original)) {
                            value = value + '&#160;';
                        }
                    }
                    if (value !== '') {
                        setCache(element, 'valueString', { name, value });
                    }
                }
            });
        }
        borderVisible(border) {
            return (border != null && !(border.style === 'none' || border.width === '0px'));
        }
        hasDrawableBackground(object) {
            return (object && (this.borderVisible(object.borderTop) || this.borderVisible(object.borderRight) || this.borderVisible(object.borderBottom) || this.borderVisible(object.borderLeft) || object.backgroundImage !== '' || object.borderRadius.length > 0));
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
        parseBorderStyle(value, node, attr) {
            const style = node.css(`${attr}Style`) || 'none';
            let width = node.css(`${attr}Width`) || '1px';
            const color = (style !== 'none' ? parseRGBA(node.css(`${attr}Color`), node.css('opacity')) : []);
            if (style === 'inset' && width === '0px') {
                width = '1px';
            }
            return { style, width, color: (color.length > 0 ? color : ['#000000', '', '1']) };
        }
        parseBackgroundImage(value) {
            return value;
        }
        parseBorderRadius(value, node) {
            const [radiusTop, radiusRight, radiusBottom, radiusLeft] = [node.css('borderTopLeftRadius'), node.css('borderTopRightRadius'), node.css('borderBottomLeftRadius'), node.css('borderBottomRightRadius')];
            if (radiusTop === radiusRight && radiusRight === radiusBottom && radiusBottom === radiusLeft) {
                return (radiusTop === '' || radiusTop === '0px' ? [] : [radiusTop]);
            }
            else {
                return [radiusTop, radiusRight, radiusBottom, radiusLeft];
            }
        }
        parseBackgroundColor(value, node) {
            return parseRGBA(value, node.css('opacity'));
        }
        parseBackgroundRepeat(value) {
            return value;
        }
        parseBackgroundPosition(value) {
            return value;
        }
        parseBoxDimensions(value) {
            if (value !== 'auto') {
                const match = value.match(/^([0-9]+(?:px|pt|em|%)|auto)(?: ([0-9]+(?:px|pt|em|%)|auto))?(?: ([0-9]+(?:px|pt|em)))?(?: ([0-9]+(?:px|pt|em)))?$/);
                if (match != null) {
                    if ((match[1] === '0px' && match[2] == null) || (match[1] === 'auto' && match[2] === 'auto')) {
                        return [];
                    }
                    if (match[1] === 'auto' || match[2] === 'auto') {
                        return [(match[1] === 'auto' ? '' : convertPX(match[1])), (match[2] === 'auto' ? '' : convertPX(match[2]))];
                    }
                    else if (isPercent(match[1]) && match[3] == null) {
                        return [match[1], match[2]];
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
            this.nodeType = 0;
            this.depth = -1;
            this.renderDepth = 0;
            this.siblingIndex = Number.MAX_VALUE;
            this.excludeProcedure = 0;
            this.excludeResource = 0;
            this.documentRoot = false;
            this.visible = true;
            this.rendered = false;
            this.isolated = false;
            this.relocated = false;
            this.inlineWrap = false;
            this.multiLine = false;
            this._namespaces = new Set();
            this._data = {};
            if (element != null) {
                if (element instanceof HTMLElement) {
                    const styleMap = getCache(element, 'styleMap') || {};
                    for (const inline of Array.from(element.style)) {
                        styleMap[convertCamelCase(inline)] = element.style[inline];
                    }
                    this.style = getCache(element, 'style') || getComputedStyle(element);
                    this.styleMap = styleMap;
                }
                setCache(element, 'node', this);
                this._element = element;
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
                    return;
                }
                this[name][attr] = value;
            }
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
                        this.add(obj, attr, attrs[attr]);
                    }
                    delete options[obj];
                }
            }
        }
        each(predicate) {
            this.children.forEach(predicate);
            return this;
        }
        render(parent) {
            this.renderParent = parent;
            this.renderDepth = (parent === this || this.documentRoot || parent.isSet('dataset', 'target') ? 0 : parent.renderDepth + 1);
            this.rendered = true;
        }
        hide() {
            this.rendered = true;
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
                node.each(item => current.push(...cascade(item)));
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
        toLeftOf(node, offset) {
            return (this.withinX(node.linear) || node.withinX(this.linear)) && (node.linear.left + offset <= this.linear.right);
        }
        toRightOf(node, offset) {
            return (this.withinX(node.linear) || node.withinX(this.linear)) && (node.linear.right + offset >= this.linear.left);
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
        setBounds(calibrate = false) {
            if (!calibrate) {
                let bounds;
                if (this.hasElement) {
                    bounds = assignBounds(this.element.getBoundingClientRect());
                }
                else {
                    const [rangeBounds, multiLine] = getRangeBounds(this.element);
                    bounds = rangeBounds;
                    this.multiLine = multiLine;
                }
                if (bounds != null) {
                    this.bounds = bounds;
                    if (this.companion != null) {
                        const outerBounds = assignBounds(this.companion.element.getBoundingClientRect());
                        this.bounds.left = Math.min(bounds.left, outerBounds.left);
                        this.bounds.right = Math.max(bounds.right, outerBounds.right);
                        this.bounds.width = this.bounds.right - this.bounds.left;
                    }
                }
            }
            if (this.bounds != null) {
                const linear = {
                    top: this.bounds.top - (this.marginTop > 0 ? this.marginTop : 0),
                    right: this.bounds.right + this.marginRight,
                    bottom: this.bounds.bottom + this.marginBottom,
                    left: this.bounds.left - (this.marginLeft > 0 ? this.marginLeft : 0),
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
        isSet(obj, attr) {
            return (this[obj] && this[obj][attr] != null ? hasValue(this[obj][attr]) : false);
        }
        setBoundsMin() {
            if (this._element !== document.body) {
                const nodes = this.children.filter(node => !node.pageflow);
                if (nodes.length > 0) {
                    const [right, bottom] = [Math.max.apply(null, this.children.map(node => node.linear.right)), Math.max.apply(null, this.children.map(node => node.linear.bottom))];
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
                dimen.width = dimen.right - dimen.left;
                dimen.height = dimen.bottom - dimen.top;
            }
        }
        append(node) {
            this.renderChildren.push(node);
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
        set element(value) {
            this._element = value;
        }
        get element() {
            return this._element || {};
        }
        get parentElement() {
            return this._element && this._element.parentElement;
        }
        get hasElement() {
            return (this._element instanceof HTMLElement);
        }
        get documentBody() {
            return (this.element === document.body);
        }
        get dataset() {
            return (this.hasElement ? this.element.dataset : {});
        }
        get extension() {
            return (hasValue(this.dataset.ext) ? this.dataset.ext.split(',')[0].trim() : '');
        }
        get flex() {
            const parent = this.documentParent;
            const style = this.style;
            if (style != null && parent !== this) {
                return {
                    enabled: (style.display.indexOf('flex') !== -1),
                    direction: style.flexDirection,
                    basis: style.flexBasis,
                    grow: convertInt(style.flexGrow),
                    shrink: convertInt(style.flexShrink),
                    wrap: style.flexWrap,
                    alignSelf: (parent.isSet('styleMap', 'alignItems') && (this.styleMap.alignSelf == null || style.alignSelf === 'auto') ? parent.styleMap.alignItems : style.alignSelf),
                    justifyContent: style.justifyContent,
                    order: convertInt(style.order)
                };
            }
            return { enabled: false };
        }
        get viewWidth() {
            return convertInt(this.styleMap.width) || convertInt(this.styleMap.minWidth);
        }
        get viewHeight() {
            return convertInt(this.styleMap.height) || this.lineHeight || convertInt(this.styleMap.minHeight);
        }
        get lineHeight() {
            return (BLOCK_ELEMENT.includes(this.element.tagName) ? convertInt(this.styleMap.lineHeight) : 0);
        }
        get display() {
            return this.css('display') || '';
        }
        get position() {
            return this.css('position') || '';
        }
        get top() {
            const top = this.styleMap.top;
            return (!top || top === 'auto' ? null : convertInt(top));
        }
        get right() {
            const right = this.styleMap.right;
            return (!right || right === 'auto' ? null : convertInt(right));
        }
        get bottom() {
            const bottom = this.styleMap.bottom;
            return (!bottom || bottom === 'auto' ? null : convertInt(bottom));
        }
        get left() {
            const left = this.styleMap.left;
            return (!left || left === 'auto' ? null : convertInt(left));
        }
        get marginTop() {
            return (this.inline ? 0 : convertInt(this.css('marginTop')));
        }
        get marginRight() {
            let node = this;
            if (this.companion != null && this.companion.bounds.right > this.bounds.right) {
                node = this.companion;
            }
            return convertInt(node.css('marginRight'));
        }
        get marginBottom() {
            return (this.inline ? 0 : convertInt(this.css('marginBottom')));
        }
        get marginLeft() {
            let node = this;
            if (this.companion != null && this.companion.bounds.left < this.bounds.left) {
                node = this.companion;
            }
            return convertInt(node.css('marginLeft'));
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
            let node = this;
            if (this.companion != null && this.companion.bounds.right > this.bounds.right) {
                node = this.companion;
            }
            return convertInt(node.css('paddingRight'));
        }
        get paddingBottom() {
            return convertInt(this.css('paddingBottom'));
        }
        get paddingLeft() {
            let node = this;
            if (this.companion != null && this.companion.bounds.left < this.bounds.left) {
                node = this.companion;
            }
            return convertInt(node.css('paddingLeft'));
        }
        get pageflow() {
            const position = this.position;
            return (position === 'static' || position === 'initial' || position === 'relative' || this.tagName === 'PLAINTEXT' || this.alignMargin);
        }
        get inline() {
            return (this.display === 'inline');
        }
        get inlineElement() {
            return (this.tagName === 'PLAINTEXT' || this.display.indexOf('inline') !== -1 || this.floating || ((this.display === 'initial' || this.alignMargin) && INLINE_ELEMENT.includes(this.element.tagName)));
        }
        get alignMargin() {
            return (this.top == null && this.right == null && this.bottom == null && this.left == null);
        }
        get autoMargin() {
            return (this.styleMap.marginLeft === 'auto' || this.styleMap.marginRight === 'auto');
        }
        get floating() {
            const float = this.css('cssFloat');
            return (this.position !== 'absolute' ? (float === 'left' || float === 'right') : false);
        }
        get float() {
            return (this.floating ? this.css('cssFloat') : null) || 'none';
        }
        get overflow() {
            let value = 0 /* NONE */;
            if (this.hasElement) {
                const [overflow, overflowX, overflowY] = [this.css('overflow'), this.css('overflowX'), this.css('overflowY')];
                if (overflow === 'scroll' || overflowX === 'scroll' || (overflowX === 'auto' && this.element.clientWidth !== this.element.scrollWidth)) {
                    value |= 2 /* HORIZONTAL */;
                }
                if (overflow === 'scroll' || overflowY === 'scroll' || (overflowY === 'auto' && this.element.clientHeight !== this.element.scrollHeight)) {
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
        get previousSibling() {
            let element = this.element.previousSibling;
            while (element != null) {
                const node = getNode(element);
                if (node) {
                    return node;
                }
                element = element.previousSibling;
            }
            return null;
        }
        get nextSibling() {
            let element = this.element.nextSibling;
            while (element != null) {
                const node = getNode(element);
                if (node) {
                    return node;
                }
                element = element.nextSibling;
            }
            return null;
        }
        get firstChild() {
            let result = null;
            if (this.hasElement) {
                Array.from(this.element.childNodes).some((element) => {
                    result = getNode(element);
                    return (result != null);
                });
            }
            return result;
        }
        get center() {
            return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2) };
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
    function stripId(value) {
        return value.replace(/@\+?id\//, '');
    }
    function convertDP(value, dpi = 160, font = false) {
        if (value) {
            value = parseFloat(value);
            if (!isNaN(value)) {
                value /= (dpi / 160);
                value = (value >= 1 || value === 0 ? Math.floor(value) : value.toFixed(2));
                return value + (font ? 'sp' : 'dp');
            }
        }
        return '0dp';
    }
    function delimitDimen(tagName, attr, size) {
        return (SETTINGS.dimensResourceValue ? `{%${tagName.toLowerCase()},${attr},${size}}` : size);
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
                        layout_marginTop: '4px'
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
            this.constraint = { current: {} };
            this.children = [];
            this.renderChildren = [];
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
        static getNodeName(tagName) {
            return NODE_ANDROID[NODE_STANDARD[tagName]];
        }
        add(obj, attr, value = '', overwrite = true) {
            if (!this.supported(obj, attr)) {
                return;
            }
            super.add(obj, attr, value, overwrite);
        }
        android(attr = '', value = '', overwrite = true) {
            if (hasValue(value)) {
                this.add('android', attr, value, overwrite);
            }
            else {
                return (this._android && this._android[attr] != null ? this._android[attr] : null);
            }
        }
        app(attr = '', value = '', overwrite = true) {
            if (hasValue(value)) {
                this.add('app', attr, value, overwrite);
            }
            else {
                return (this._app && this._app[attr] != null ? this._app[attr] : null);
            }
        }
        apply(options = {}) {
            const local = Object.assign({}, options);
            super.apply(local);
            for (const obj in local) {
                this.attr(`${obj}="${local[obj]}"`);
            }
        }
        attr(value, overwrite = true) {
            const match = value.match(/^(?:([a-z]+):)?(\w+)="((?:@+?[a-z]+\/)?.+)"$/);
            if (match != null) {
                this.add(match[1] || '_', match[2], match[3], overwrite);
            }
        }
        anchor(position, adjacent, orientation, overwrite) {
            if (arguments.length === 1 || this.constraint.current[position] == null || !this.constraint.current[position].overwrite || (orientation && !this.constraint[orientation])) {
                if (overwrite == null) {
                    overwrite = (adjacent === 'parent' || adjacent === 'true');
                }
                this[(this.renderParent.nodeName === NODE_ANDROID.RELATIVE ? 'android' : 'app')](position, adjacent, overwrite);
                if (orientation) {
                    this.constraint[orientation] = true;
                }
                this.constraint.current[position] = { adjacent, orientation, overwrite };
            }
        }
        alignParent(position) {
            if (this.renderParent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE)) {
                const relative = (this.renderParent.nodeName === NODE_ANDROID.RELATIVE);
                position = capitalize(position);
                position = (relative ? `layout_alignParent${position}` : `layout_constraint${position}_to${position}Of`);
                return (this[(relative ? 'android' : 'app')](parseRTL(position)) === (relative ? 'true' : 'parent'));
            }
            return false;
        }
        modifyBox(area, offset, styleMap = false) {
            const value = convertEnum(BOX_STANDARD, BOX_ANDROID, area);
            if (value !== '') {
                const dimension = parseRTL(value);
                const total = formatPX(offset);
                if (total !== '0px') {
                    this.android(dimension, total);
                }
                else {
                    this.delete('android', dimension);
                }
                if (styleMap) {
                    this.css(value.replace('layout_', ''), total);
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
            this._namespaces.forEach(value => {
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
        applyCustomizations(overwrite = false) {
            [API_ANDROID[this.api], API_ANDROID[0]].forEach(build => {
                if (build && build.customizations != null) {
                    [this.element.tagName, this.nodeName].forEach(nodeName => {
                        const customizations = build.customizations[nodeName];
                        if (customizations != null) {
                            for (const obj in customizations) {
                                for (const attr in customizations[obj]) {
                                    this.add(obj, attr, customizations[obj][attr], overwrite);
                                }
                            }
                        }
                    });
                }
            });
        }
        clone() {
            const node = new View(this.id, this.api, this.element);
            node.nodeId = this.nodeId;
            node.nodeType = this.nodeType;
            node.nodeName = this.nodeName;
            node.depth = this.depth;
            node.rendered = this.rendered;
            node.renderDepth = this.renderDepth;
            node.renderParent = this.renderParent;
            node.renderExtension = this.renderExtension;
            node.visible = this.visible;
            node.documentRoot = this.documentRoot;
            node.documentParent = this.documentParent;
            node.children = this.children.slice();
            node.inherit(this, 'base', 'style', 'styleMap');
            return node;
        }
        is(...views) {
            for (const value of views) {
                if (this.nodeType === value) {
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
                let name = (element.id || element.name || '').trim();
                if (name && RESERVED_JAVA.includes(name)) {
                    name += '_1';
                }
                this.nodeId = convertWord(generateId('android', (name || `${lastIndexOf(this.nodeName, '.').toLowerCase()}_1`)));
            }
            this.android('id', this.stringId);
        }
        setLayout(width, height) {
            if (width == null) {
                width = (this.hasElement ? this.element.clientWidth + this.borderLeftWidth + this.borderRightWidth + this.marginLeft + this.marginRight : 0);
            }
            if (height == null) {
                height = (this.hasElement ? this.element.clientHeight + this.borderTopWidth + this.borderBottomWidth + this.marginTop + this.marginBottom : 0);
            }
            const styleMap = this.styleMap;
            const constraint = this.constraint;
            const parent = this.documentParent;
            const renderParent = this.renderParent;
            const widthParent = parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + parent.borderLeftWidth + parent.borderRightWidth);
            const heightParent = parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + parent.borderTopWidth + parent.borderBottomWidth);
            if ((this.documentRoot && !this.flex.enabled && this.is(NODE_STANDARD.FRAME, NODE_STANDARD.SCROLL_VERTICAL, NODE_STANDARD.SCROLL_HORIZONTAL, NODE_STANDARD.SCROLL_NESTED, NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE)) || this.documentBody) {
                if (this.viewWidth === 0 && !constraint.layoutHorizontal) {
                    this.android('layout_width', 'match_parent', false);
                }
                if (this.viewHeight === 0 && !constraint.layoutHeight && !constraint.layoutVertical) {
                    this.android('layout_height', 'match_parent', false);
                }
            }
            if (this.overflow !== 0 /* NONE */ && this.nodeType >= NODE_STANDARD.BLOCK) {
                if (this.nodeName === NODE_ANDROID.SCROLL_HORIZONTAL) {
                    this.android('layout_width', 'wrap_content');
                    this.android('layout_height', 'match_parent');
                }
                else {
                    this.android('layout_width', 'match_parent');
                    this.android('layout_height', 'wrap_content');
                }
            }
            if (this.renderParent.is(NODE_STANDARD.SCROLL_HORIZONTAL)) {
                this.android('layout_width', 'wrap_content');
            }
            else {
                if (this.android('layout_width') !== '0px') {
                    if (this.isSet('styleMap', 'width')) {
                        if (isPercent(styleMap.width)) {
                            if (renderParent.element.tagName === 'TABLE') {
                                this.android('layout_columnWeight', (convertInt(styleMap.width) / 100).toFixed(2));
                                this.android('layout_width', '0px');
                            }
                            else if (styleMap.width === '100%') {
                                this.android('layout_width', 'match_parent');
                                if (styleMap.height == null) {
                                    switch (this.nodeName) {
                                        case NODE_ANDROID.IMAGE:
                                            this.android('layout_height', 'match_parent');
                                            break;
                                    }
                                }
                            }
                            else {
                                const widthPercent = Math.floor(this.bounds.width * (convertInt(styleMap.width) / 100));
                                this.android('layout_width', (widthPercent > 0 ? formatPX(widthPercent) : 'wrap_content'), false);
                            }
                        }
                        else if (convertInt(styleMap.width) > 0) {
                            let contentWidth = this.paddingLeft + this.paddingRight;
                            if (this.renderChildren.length > 0) {
                                switch (this.nodeName) {
                                    case NODE_ANDROID.LINEAR:
                                    case NODE_ANDROID.RADIO_GROUP:
                                        contentWidth += this.renderChildren.reduce((a, b) => (this.horizontal ? a + b.viewWidth : Math.max(a, b.viewWidth)), 0);
                                        break;
                                    case NODE_ANDROID.CONSTRAINT:
                                    case NODE_ANDROID.RELATIVE:
                                        contentWidth += this.renderChildren.reduce((a, b) => a + (b.alignParent('top') ? b.viewWidth : 0), 0);
                                        break;
                                }
                            }
                            this.android('layout_width', (!this.overflowX && ((contentWidth > this.viewWidth) || this.inline) ? 'wrap_content' : styleMap.width));
                        }
                        else if (styleMap.width === 'auto') {
                            this.android('layout_width', (!this.inlineElement && this.pageflow && BLOCK_ELEMENT.includes(this.element.tagName) && !this.autoMargin ? 'match_parent' : 'wrap_content'), false);
                        }
                    }
                    if (this.isSet('styleMap', 'minWidth') && !isPercent(styleMap.minWidth) && !constraint.minWidth) {
                        this.android('layout_width', 'wrap_content', false);
                        this.android('minWidth', styleMap.minWidth, false);
                    }
                    if (this.isSet('styleMap', 'maxWidth') && !isPercent(styleMap.maxWidth) && !constraint.maxWidth) {
                        this.android('maxWidth', styleMap.maxWidth, false);
                    }
                }
                if (constraint.layoutWidth) {
                    if (constraint.layoutHorizontal) {
                        this.android('layout_width', (this.documentRoot || this.documentParent.viewWidth > 0 ? 'match_parent' : 'wrap_content'), false);
                    }
                    else {
                        this.android('layout_width', (this.bounds.width >= widthParent ? 'match_parent' : formatPX(this.bounds.width)), false);
                    }
                }
                else if (this.android('layout_width') == null) {
                    const widthRoot = (parent.documentRoot ? parent.viewWidth : this.ascend().reduce((a, b) => Math.max(a, b.viewWidth), 0));
                    if (this.inlineWrap && this.is(NODE_STANDARD.FRAME)) {
                        if (widthRoot > 0) {
                            this.android('layout_width', 'match_parent');
                        }
                        else {
                            const valid = this.renderParent.renderChildren.some(item => {
                                if ((item.nodeType > NODE_STANDARD.FRAME || (item.nodeType === NODE_STANDARD.FRAME && item.inlineElement && item.viewWidth > 0)) && withinRange(this.linear.right, item.linear.right)) {
                                    this.android('layout_width', 'match_parent');
                                    return true;
                                }
                                return false;
                            });
                            if (!valid) {
                                this.android('layout_width', formatPX(this.bounds.width));
                            }
                        }
                    }
                    else {
                        const linearParent = renderParent.is(NODE_STANDARD.LINEAR);
                        let right = 0;
                        let rightParent = 0;
                        if (linearParent && !renderParent.horizontal) {
                            right = Math.floor(this.cascade().filter(node => node.visible).reduce((a, b) => Math.max(a, b.bounds.right), 0));
                            rightParent = Math.floor(parent.cascade().filter((node) => node.visible && !parent.children.includes(node)).reduce((a, b) => Math.max(a, b.bounds.right), 0));
                        }
                        const wrap = (this.nodeType <= NODE_STANDARD.INLINE || this.inlineElement || !this.pageflow || this.display === 'table' || parent.flex.enabled || (renderParent.inlineElement && renderParent.viewWidth === 0 && !this.inlineElement && this.nodeType > NODE_STANDARD.BLOCK) || renderParent.is(NODE_STANDARD.GRID) || (linearParent && renderParent.horizontal));
                        if (convertFloat(this.android('layout_columnWeight')) > 0) {
                            this.android('layout_width', '0px');
                        }
                        else if (!wrap && ((this.display === 'block') ||
                            (parent.overflow === 0 /* NONE */ && (widthRoot > 0 || this.documentParent.documentBody) && width >= widthParent) ||
                            (!this.inlineElement && !this.floating && (this.renderChildren.length === 0 || (right !== 0 && right < rightParent))) ||
                            (this.is(NODE_STANDARD.LINEAR) && !this.horizontal && this.renderChildren.some(node => !node.inlineElement && !node.floating)))) {
                            this.android('layout_width', 'match_parent');
                        }
                        else {
                            this.android('layout_width', 'wrap_content');
                        }
                    }
                }
            }
            if (this.renderParent.is(NODE_STANDARD.SCROLL_VERTICAL, NODE_STANDARD.SCROLL_NESTED)) {
                this.android('layout_height', 'wrap_content');
            }
            else {
                if (this.android('layout_height') !== '0px') {
                    const contentHeight = convertInt(styleMap.height || this.lineHeight);
                    if (contentHeight > 0) {
                        const percentHeight = (styleMap.height !== 'auto' ? styleMap.height : null) || styleMap.lineHeight;
                        if (isPercent(percentHeight)) {
                            if (renderParent.element.tagName === 'TABLE') {
                                this.android('layout_rowWeight', (contentHeight / 100).toFixed(2));
                                this.android('layout_height', '0px');
                            }
                            else if (percentHeight === '100%') {
                                this.android('layout_height', 'match_parent');
                                if (styleMap.width == null) {
                                    switch (this.nodeName) {
                                        case NODE_ANDROID.IMAGE:
                                            this.android('layout_width', 'match_parent');
                                            break;
                                    }
                                }
                            }
                            else {
                                this.android('layout_height', 'wrap_content', false);
                            }
                        }
                        else if (contentHeight > 0) {
                            if (this.display === 'inline-block' && this.css('overflow') === 'visible') {
                                this.android('minHeight', formatPX(contentHeight));
                                this.android('layout_height', 'wrap_content');
                            }
                            else {
                                this.android('layout_height', (this.inline && !this.overflowY && !this.is(NODE_STANDARD.IMAGE) ? 'wrap_content' : formatPX(contentHeight)));
                            }
                        }
                        else if (styleMap.height === 'auto') {
                            this.android('layout_height', 'wrap_content', false);
                        }
                    }
                    if (this.isSet('styleMap', 'minHeight') && !isPercent(styleMap.minHeight) && !constraint.minHeight) {
                        this.android('layout_height', 'wrap_content', false);
                        this.android('minHeight', styleMap.minHeight, false);
                    }
                    if (this.isSet('styleMap', 'maxHeight') && !isPercent(styleMap.maxHeight) && !constraint.maxHeight) {
                        this.android('maxHeight', styleMap.maxHeight, false);
                    }
                    if (constraint.layoutHeight) {
                        if (constraint.layoutVertical) {
                            this.android('layout_height', 'wrap_content', false);
                        }
                        else if (this.documentRoot) {
                            const bottomHeight = Math.max.apply(null, [0, ...this.renderChildren.filter(node => node.pageflow).map(node => node.linear.bottom)]);
                            this.android('layout_height', (bottomHeight > 0 ? formatPX(bottomHeight + this.paddingBottom + this.borderBottomWidth) : 'match_parent'), false);
                        }
                        else {
                            this.android('layout_height', (this.bounds.height < heightParent ? formatPX(this.bounds.height) : 'match_parent'), false);
                        }
                    }
                    else if (this.android('layout_height') == null) {
                        if (height >= heightParent && parent.overflow === 0 /* NONE */ && parent.viewHeight > 0 && !(this.inlineElement && this.nodeType < NODE_STANDARD.INLINE) && !(renderParent.is(NODE_STANDARD.RELATIVE) && renderParent.android('layout_height') === 'wrap_content')) {
                            this.android('layout_height', 'match_parent');
                        }
                        else {
                            this.android('layout_height', 'wrap_content');
                        }
                    }
                }
            }
        }
        setAlignment() {
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
            let textAlign = this.styleMap.textAlign;
            let textAlignParent = '';
            const verticalAlign = this.styleMap.verticalAlign;
            if (!this.floating || this.is(NODE_STANDARD.TEXT)) {
                let parent = this.documentParent;
                do {
                    textAlignParent = parent.styleMap.textAlign;
                    if (parent.id === 0 || textAlignParent) {
                        break;
                    }
                    parent = parent.documentParent;
                } while (true);
            }
            if (textAlign === '' && this.element.tagName === 'TH') {
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
                    const lineHeight = convertInt(this.styleMap.lineHeight);
                    if (lineHeight > 0 && lineHeight >= this.viewHeight) {
                        vertical = 'center_vertical';
                    }
            }
            if (renderParent.element.tagName === 'TABLE') {
                this.android('layout_gravity', 'fill');
            }
            else {
                switch (renderParent.nodeName) {
                    case NODE_ANDROID.LINEAR:
                        if (this.renderChildren.length > 0) {
                            if (this.renderParent.horizontal) {
                                if (this.renderChildren.every(item => item.float === 'right')) {
                                    this.android('gravity', right);
                                }
                            }
                        }
                        else {
                            if (!this.renderParent.horizontal) {
                                if (this.float === 'right') {
                                    this.android('layout_gravity', right);
                                }
                            }
                        }
                        break;
                    case NODE_ANDROID.FRAME:
                        if (this.styleMap.marginLeft === 'auto' && this.styleMap.marginRight === 'auto') {
                            this.android('layout_gravity', 'center_horizontal');
                        }
                        else {
                            this.android('layout_gravity', (this.float === 'right' || this.styleMap.marginLeft === 'auto' || (this.is(NODE_STANDARD.LINEAR) && this.renderChildren.some(node => node.float === 'right')) ? right : left));
                        }
                        break;
                }
            }
            if (this.nodeType <= NODE_STANDARD.IMAGE) {
                let fromParent = false;
                if (horizontal === '') {
                    horizontal = horizontalParent;
                    if (!this.is(NODE_STANDARD.IMAGE)) {
                        fromParent = true;
                    }
                }
                if (!fromParent && horizontal !== '') {
                    if (!this.floating && !this.autoMargin) {
                        if (renderParent.is(NODE_STANDARD.FRAME)) {
                            this.android('layout_gravity', horizontal);
                            horizontal = '';
                        }
                    }
                }
            }
            else {
                if (horizontal !== '') {
                    if (this.is(NODE_STANDARD.FRAME, NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP, NODE_STANDARD.RELATIVE)) {
                        if (this.renderChildren.length > 0 && this.renderChildren.some(node => !node.inlineElement || node.floating)) {
                            horizontal = '';
                        }
                    }
                    else {
                        horizontal = '';
                    }
                }
            }
            const gravity = [horizontal, vertical].filter(value => value);
            if (gravity.length > 0) {
                this.android('gravity', gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|'));
            }
        }
        mergeBoxSpacing() {
            if (!includesEnum(this.excludeResource, NODE_RESOURCE.BOX_SPACING)) {
                ['layout_margin', 'padding'].forEach((value, index) => {
                    const leftRtl = parseRTL(`${value}Left`);
                    const rightRtl = parseRTL(`${value}Right`);
                    const inline = (this.display === 'inline' || this.tagName === 'PLAINTEXT');
                    let top = (index === 0 && inline ? 0 : convertInt(this.android(`${value}Top`)));
                    let right = convertInt(this.android(rightRtl));
                    let bottom = (index === 0 && inline ? 0 : convertInt(this.android(`${value}Bottom`)));
                    let left = convertInt(this.android(leftRtl));
                    if (index === 1) {
                        if (this.viewWidth === 0) {
                            if (this.borderLeftWidth > 0) {
                                left += this.borderLeftWidth;
                            }
                            if (this.borderRightWidth > 0) {
                                right += this.borderRightWidth;
                            }
                        }
                        if (this.viewHeight === 0) {
                            if (this.borderTopWidth > 0) {
                                top += this.borderBottomWidth;
                            }
                            if (this.borderBottomWidth > 0) {
                                bottom += this.borderBottomWidth;
                            }
                        }
                    }
                    if (this.api >= exports.build.OREO) {
                        if (top !== 0 && top === bottom && bottom === left && left === right) {
                            this.delete('android', `${value}*`);
                            this.android(value, formatPX(top));
                        }
                        else {
                            if (index !== 0 || !this.renderParent.is(NODE_STANDARD.GRID)) {
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
                    }
                });
            }
        }
        optimizeLayout() {
            this.adjustBoxSpacing();
            const viewWidth = convertInt(this.android('layout_width'));
            const viewHeight = convertInt(this.android('layout_height'));
            switch (this.nodeName) {
                case NODE_ANDROID.FRAME: {
                    if (!this.inlineWrap && this.viewWidth === 0) {
                        const gravity = new Set();
                        this.renderChildren.forEach(node => gravity.add(node.android('layout_gravity') || parseRTL('left')));
                        if (gravity.size === 1) {
                            this.android('layout_width', 'wrap_content');
                        }
                    }
                    break;
                }
                case NODE_ANDROID.LINEAR: {
                    if (this.display !== 'block') {
                        [[this.horizontal, this.inlineElement, 'layout_width'], [!this.horizontal, true, 'layout_height']].forEach((value) => {
                            if (value[0] && value[1] && this.android(value[2]) !== 'wrap_content') {
                                if (this.renderChildren.every(node => node.android(value[2]) === 'wrap_content')) {
                                    this.android(value[2], 'wrap_content');
                                }
                            }
                        });
                    }
                    if (this.horizontal) {
                        if (this.renderChildren.some(node => node.floating) || this.renderChildren.some(node => node.pageflow && ['fixed', 'absolute'].includes(node.position) && node.alignMargin)) {
                            this.android('baselineAligned', 'false');
                        }
                    }
                    break;
                }
                case NODE_ANDROID.SELECT:
                case NODE_ANDROID.CHECKBOX:
                case NODE_ANDROID.RADIO:
                case NODE_ANDROID.BUTTON:
                case NODE_ANDROID.EDIT:
                case NODE_ANDROID.TEXT: {
                    if (viewWidth > 0 || viewHeight > 0) {
                        const boxStyle = getCache(this.element, 'boxStyle');
                        if (boxStyle != null) {
                            if (viewWidth > 0) {
                                this.android('layout_width', formatPX(viewWidth + this.paddingLeft + this.paddingRight + this.borderLeftWidth + this.borderRightWidth));
                            }
                            if (viewHeight > 0) {
                                if (this.marginTop >= this.borderTopWidth) {
                                    this.modifyBox(BOX_STANDARD.MARGIN_TOP, this.marginTop - this.borderTopWidth);
                                }
                                this.android('layout_height', formatPX(viewHeight + this.paddingTop + this.paddingBottom + this.borderTopWidth + this.borderBottomWidth));
                            }
                        }
                    }
                    break;
                }
                case NODE_ANDROID.IMAGE: {
                    const boxStyle = getCache(this.element, 'boxStyle');
                    if (boxStyle != null) {
                        let width = 0;
                        let height = 0;
                        const border = {
                            top: convertInt(boxStyle.borderTop.width),
                            right: convertInt(boxStyle.borderRight.width),
                            bottom: convertInt(boxStyle.borderBottom.width),
                            left: convertInt(boxStyle.borderLeft.width)
                        };
                        if (border.top > 0 && (this.nodeType > NODE_STANDARD.INLINE || this.paddingTop > 0)) {
                            this.modifyBox(BOX_STANDARD.PADDING_TOP, this.paddingTop + border.top);
                            height += border.top;
                        }
                        if (border.right > 0 && (this.nodeType > NODE_STANDARD.INLINE || this.paddingRight > 0)) {
                            this.modifyBox(BOX_STANDARD.PADDING_RIGHT, this.paddingRight + border.right);
                            width += border.right;
                        }
                        if (border.bottom > 0 && (this.nodeType > NODE_STANDARD.INLINE || this.paddingBottom > 0)) {
                            this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, this.paddingBottom + border.bottom);
                            height += border.bottom;
                        }
                        if (border.left > 0 && (this.nodeType > NODE_STANDARD.INLINE || this.paddingLeft > 0)) {
                            this.modifyBox(BOX_STANDARD.PADDING_LEFT, this.paddingLeft + border.left);
                            width += border.left;
                        }
                        if (viewWidth > 0 && width > 0) {
                            this.android('layout_width', formatPX(viewWidth + width));
                        }
                        if (viewHeight > 0 && height > 0) {
                            this.android('layout_height', formatPX(viewWidth + height));
                        }
                    }
                    break;
                }
            }
            if (this.position === 'relative') {
                if (convertInt(this.top) !== 0) {
                    this.modifyBox(BOX_STANDARD.MARGIN_TOP, convertInt(this.android('layout_marginTop')) + convertInt(this.top));
                }
                if (convertInt(this.left) !== 0) {
                    if (this.float === 'right' || (this.position === 'relative' && this.styleMap.marginLeft === 'auto')) {
                        this.modifyBox(BOX_STANDARD.MARGIN_RIGHT, convertInt(this.android(parseRTL('layout_marginRight'))) + (convertInt(this.left) * -1));
                    }
                    else {
                        this.modifyBox(BOX_STANDARD.MARGIN_LEFT, convertInt(this.android(parseRTL('layout_marginLeft'))) + convertInt(this.left));
                    }
                }
            }
            if (this.inline) {
                const offsetTop = convertInt(this.css('verticalAlign'));
                if (offsetTop !== 0) {
                    this.modifyBox(BOX_STANDARD.MARGIN_TOP, (offsetTop * -1));
                }
            }
            if (this.css('visibility') === 'hidden') {
                this.android('visibility', 'invisible');
            }
        }
        setAccessibility() {
            const node = this;
            const element = this.element;
            switch (this.nodeName) {
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
        alignBaseline(nodes) {
            let childIndex = -1;
            nodes.some((item, index) => {
                if (item.is(NODE_STANDARD.LINEAR) && item.android('baselineAlignedChildIndex') != null) {
                    childIndex = index;
                }
                else if (item.nodeType <= NODE_STANDARD.TEXT) {
                    switch (item.css('verticalAlign')) {
                        case 'baseline':
                        case 'sub':
                        case 'super':
                            if (childIndex === -1 && item.nodeType <= NODE_STANDARD.BUTTON) {
                                childIndex = index;
                            }
                            break;
                        default:
                            childIndex = -1;
                            return true;
                    }
                }
                return false;
            });
            if (childIndex !== -1) {
                this.android('baselineAlignedChildIndex', childIndex.toString());
                if (this.renderParent.is(NODE_STANDARD.LINEAR) && this.renderParent.horizontal) {
                    this.renderParent.alignBaseline(this.renderParent.renderChildren);
                }
            }
        }
        append(node) {
            super.append(node);
            switch (this.nodeName) {
                case NODE_ANDROID.LINEAR:
                    if (this.horizontal) {
                        this.alignBaseline(this.renderChildren);
                    }
                    break;
            }
        }
        adjustBoxSpacing() {
            if (this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP)) {
                switch (this.android('orientation')) {
                    case AXIS_ANDROID.HORIZONTAL:
                        let left = this.box.left;
                        sortAsc(this.renderChildren, 'linear.left').forEach(node => {
                            if (!node.floating) {
                                const width = Math.ceil(node.linear.left - left);
                                if (width >= 1) {
                                    node.modifyBox(BOX_STANDARD.MARGIN_LEFT, node.marginLeft + width, true);
                                }
                            }
                            left = node.linear.right;
                        });
                        break;
                    case AXIS_ANDROID.VERTICAL:
                        let top = this.box.top;
                        sortAsc(this.renderChildren, 'linear.top').forEach(node => {
                            const height = Math.ceil(node.linear.top - top);
                            if (height >= 1) {
                                node.modifyBox(BOX_STANDARD.MARGIN_TOP, node.marginTop + height, true);
                            }
                            top = node.linear.bottom;
                        });
                        break;
                }
            }
        }
        get stringId() {
            return (this.nodeId ? `@+id/${this.nodeId}` : '');
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
                return (value != null ? View.getNodeName(value) : '');
            }
        }
        set documentParent(value) {
            this._documentParent = value;
        }
        get documentParent() {
            const position = this.position;
            if (this._documentParent != null) {
                return this._documentParent;
            }
            else if (this.id === 0) {
                return this;
            }
            else if (position !== 'fixed') {
                const absolute = (position === 'absolute');
                let parent = this.element.parentElement;
                while (parent != null) {
                    const node = (!absolute || getStyle(parent).position !== 'static' ? getNode(parent) : null);
                    if (node) {
                        return node;
                    }
                    parent = parent.parentElement;
                }
            }
            return View.documentBody();
        }
        set renderParent(value) {
            if (value !== this && value.renderChildren.indexOf(this) === -1) {
                value.append(this);
            }
            this._renderParent = value;
        }
        get renderParent() {
            if (this._renderParent != null) {
                return this._renderParent;
            }
            else {
                return View.documentBody();
            }
        }
        get anchored() {
            return (this.constraint.horizontal && this.constraint.vertical);
        }
        get horizontal() {
            return (this._android && this._android.orientation === AXIS_ANDROID.HORIZONTAL);
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
        constructor(id, node, parent, children, element) {
            super(id, node.api);
            this.documentParent = node.documentParent;
            this.baseNode = node;
            if (parent != null) {
                this.parent = parent;
            }
            if (children != null) {
                this.children = children;
            }
            if (element != null) {
                this.element = element;
                this.tagName = node.tagName;
                this.inherit(node, 'base', 'style', 'styleMap');
                this.documentRoot = node.documentRoot;
                this.excludeProcedure = node.excludeProcedure;
                this.excludeResource = node.excludeResource;
                this.renderExtension = node.renderExtension;
            }
            else {
                this.tagName = `${node.tagName}_GROUP`;
            }
            this.depth = node.depth;
            this.css('direction', this.documentParent.dir);
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
        get pageflow() {
            return this.children.some(node => node.pageflow);
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
                if (top[0].linear.top === node.linear.top) {
                    top.push(node);
                }
                else if (node.linear.top < top[0].linear.top) {
                    top = [node];
                }
                if (right[0].linear.right === node.linear.right) {
                    right.push(node);
                }
                else if (node.linear.right > right[0].linear.right) {
                    right = [node];
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
        get previousSibling() {
            return this.parent.previousSibling;
        }
        get nextSibling() {
            return this.parent.nextSibling;
        }
        get firstChild() {
            return this.baseNode;
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
        '!7',
        '	<item>',
        '		<bitmap android:src="@drawable/{image}" android:gravity="{@gravity}" android:tileMode="{@tileMode}" android:tileModeX="{@tileModeX}" android:tileModeY="{@tileModeY}" />',
        '	</item>',
        '!7',
        '</layer-list>',
        '!0'
    ];
    var LAYERLIST_TMPL = template$1.join('\n');

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
            this.file.stored = Resource.STORED;
        }
        static addString(value, name = '') {
            if (value != null && value !== '') {
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
                    if (numeric || /^[0-9]/.test(value) || RESERVED_JAVA.includes(name)) {
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
                const filePath = element.src.substring(0, element.src.lastIndexOf('/') + 1);
                srcset.split(',').forEach(value => {
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
                }
            }
            return src;
        }
        static addImageURL(value, prefix = '') {
            const match = value.match(/^url\("?(.*?)"?\)$/);
            if (match != null) {
                return ResourceView.addImage({ 'mdpi': resolvePath(match[1]) }, prefix);
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
        reset() {
            super.reset();
            this.file.reset();
            this.tagStyle = {};
            this.tagCount = {};
        }
        finalize(viewData) {
            this.processFontStyle(viewData);
        }
        filterStyles(viewData) {
            const styles = {};
            for (const node of viewData.cache) {
                const children = node.renderChildren.filter(child => child.visible && !child.isolated && !child.relocated);
                if (children.length > 1) {
                    const map = {};
                    let style = '';
                    let valid = true;
                    for (let i = 0; i < children.length; i++) {
                        const child = children[i];
                        let found = false;
                        child.combine('_', 'android').forEach(value => {
                            if (value.startsWith('style=')) {
                                if (i === 0) {
                                    style = value;
                                }
                                else {
                                    if (value !== style) {
                                        valid = false;
                                    }
                                }
                                found = true;
                            }
                            if (map[value] == null) {
                                map[value] = 0;
                            }
                            map[value]++;
                        });
                        if (style !== '' && !found) {
                            valid = false;
                        }
                    }
                    if (valid) {
                        for (const attr in map) {
                            if (map[attr] !== children.length) {
                                delete map[attr];
                            }
                        }
                        if (Object.keys(map).length > 1) {
                            if (style !== '') {
                                style = trim(style.substring(style.indexOf('/') + 1), '"');
                            }
                            const common = [];
                            for (const attr in map) {
                                const match = attr.match(/(\w+):(\w+)="(.*?)"/);
                                if (match != null) {
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
                                name = (style !== '' ? `${style}.` : '') + node.nodeId;
                                styles[name] = common;
                            }
                            children.forEach(child => child.add('_', 'style', `@style/${name}`));
                        }
                    }
                }
            }
            if (Object.keys(styles).length > 0) {
                for (const name in styles) {
                    Resource.STORED.STYLES.set(name, { attributes: styles[name].join(';') });
                }
            }
        }
        setBoxSpacing() {
            super.setBoxSpacing();
            this.cache.elements.filter(node => !includesEnum(node.excludeResource, NODE_RESOURCE.BOX_SPACING)).each(node => {
                const stored = getCache(node.element, 'boxSpacing');
                if (stored != null) {
                    if (convertInt(stored.marginLeft) > 0 && stored.marginLeft === stored.marginRight) {
                        if (node.alignParent('left') && node.alignParent('right')) {
                            if (node.android('layout_width') !== 'match_parent') {
                                delete stored.marginLeft;
                                delete stored.marginRight;
                            }
                        }
                    }
                    if (node.styleMap.marginLeft === 'auto') {
                        delete stored.marginLeft;
                    }
                    if (node.styleMap.marginRight === 'auto') {
                        delete stored.marginRight;
                    }
                    if (node.float === 'right' && convertInt(stored.marginLeft) < 0) {
                        delete stored.marginLeft;
                    }
                    const method = METHOD_ANDROID['boxSpacing'];
                    for (const attr in stored) {
                        if (stored[attr] !== '0px') {
                            node.attr(formatString(parseRTL(method[attr]), node.styleMap[attr] || stored[attr]), (node.renderExtension == null));
                        }
                    }
                }
            });
        }
        setBoxStyle() {
            super.setBoxStyle();
            this.cache.elements.filter(node => !includesEnum(node.excludeResource, NODE_RESOURCE.BOX_STYLE)).each(node => {
                const stored = getCache(node.element, 'boxStyle');
                if (stored != null) {
                    if (stored.backgroundColor && stored.backgroundColor.length > 0) {
                        stored.backgroundColor = ResourceView.addColor(stored.backgroundColor[0], stored.backgroundColor[2]);
                    }
                    stored.backgroundImage = ResourceView.addImageURL(stored.backgroundImage);
                    [stored.borderTop, stored.borderRight, stored.borderBottom, stored.borderLeft].forEach((item) => {
                        if (item.color && item.color.length > 0) {
                            item.color = ResourceView.addColor(item.color[0], item.color[2]);
                        }
                    });
                    const method = METHOD_ANDROID['boxStyle'];
                    const companion = node.companion;
                    if (companion && !sameAsParent(companion.element, 'backgroundColor')) {
                        const boxStyle = getCache(companion.element, 'boxStyle');
                        if (boxStyle && Array.isArray(boxStyle.backgroundColor)) {
                            stored.backgroundColor = ResourceView.addColor(boxStyle.backgroundColor[0], boxStyle.backgroundColor[2]);
                        }
                    }
                    if (this.borderVisible(stored.borderTop) || this.borderVisible(stored.borderRight) || this.borderVisible(stored.borderBottom) || this.borderVisible(stored.borderLeft) || stored.backgroundImage !== '' || stored.borderRadius.length > 0) {
                        let template = null;
                        let data;
                        let resourceName = '';
                        let gravity = '';
                        let tileMode = '';
                        let tileModeX = '';
                        let tileModeY = '';
                        switch (stored.backgroundRepeat) {
                            case 'repeat-x':
                                tileModeX = 'repeat';
                                break;
                            case 'repeat-y':
                                tileModeY = 'repeat';
                                break;
                            case 'no-repeat':
                                tileMode = 'disabled';
                                break;
                            case 'repeat':
                                tileMode = 'repeat';
                        }
                        switch (stored.backgroundPosition) {
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
                        }
                        if (stored.backgroundSize.length > 0) {
                            if (isPercent(stored.backgroundSize[0]) || isPercent(stored.backgroundSize[1])) {
                                if (stored.backgroundSize[0] === '100%' && stored.backgroundSize[1] === '100%') {
                                    tileMode = '';
                                    tileModeX = '';
                                    tileModeY = '';
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
                        const image6 = [];
                        const image7 = [];
                        if (stored.backgroundImage !== '') {
                            if (gravity !== '' || tileMode !== '' || tileModeX !== '' || tileModeY !== '') {
                                image7[0] = { image: stored.backgroundImage, gravity, tileMode, tileModeX, tileModeY };
                            }
                            else {
                                image6[0] = { image: stored.backgroundImage, width: (stored.backgroundSize.length > 0 ? stored.backgroundSize[0] : ''), height: (stored.backgroundSize.length > 0 ? stored.backgroundSize[1] : '') };
                            }
                        }
                        const backgroundColor = this.getShapeAttribute(stored, 'backgroundColor');
                        const radius = this.getShapeAttribute(stored, 'radius');
                        const radiusInit = this.getShapeAttribute(stored, 'radiusInit');
                        if (stored.border != null) {
                            if (stored.backgroundImage === '') {
                                template = parseTemplate(SHAPERECTANGLE_TMPL);
                                data = {
                                    '0': [{
                                            '1': this.getShapeAttribute(stored, 'stroke'),
                                            '2': (stored.backgroundColor.length > 0 || stored.borderRadius.length > 0 ? [{
                                                    '3': backgroundColor,
                                                    '4': radius,
                                                    '5': radiusInit
                                                }] : false)
                                        }]
                                };
                                if (stored.borderRadius.length > 1) {
                                    const shape = getTemplateLevel(data, '0', '2');
                                    const borderRadius = this.getShapeAttribute(stored, 'radiusAll');
                                    shape['5'].push(borderRadius);
                                }
                            }
                            else if (stored.backgroundImage !== '' && (stored.border.style === 'none' || stored.border.width === '0px')) {
                                template = parseTemplate(LAYERLIST_TMPL);
                                data = {
                                    '0': [{
                                            '1': [{
                                                    '2': false,
                                                    '3': backgroundColor,
                                                    '4': false,
                                                    '5': false
                                                }],
                                            '6': (image6.length > 0 ? image6 : false),
                                            '7': (image7.length > 0 ? image7 : false)
                                        }]
                                };
                            }
                            else {
                                template = parseTemplate(LAYERLIST_TMPL);
                                data = {
                                    '0': [{
                                            '1': [{
                                                    '2': this.getShapeAttribute(stored, 'stroke'),
                                                    '3': backgroundColor,
                                                    '4': radius,
                                                    '5': radiusInit
                                                }],
                                            '6': (image6.length > 0 ? image6 : false),
                                            '7': (image7.length > 0 ? image7 : false)
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
                                        '6': (image6.length > 0 ? image6 : false),
                                        '7': (image7.length > 0 ? image7 : false)
                                    }]
                            };
                            const root = getTemplateLevel(data, '0');
                            const borders = [stored.borderTop, stored.borderRight, stored.borderBottom, stored.borderLeft];
                            let valid = true;
                            let width = '';
                            let borderStyle = '';
                            let radiusSize = '';
                            borders.some((item, index) => {
                                if (this.borderVisible(item)) {
                                    if ((width !== '' && width !== item.width) || (borderStyle !== '' && borderStyle !== this.getBorderStyle(item)) || (radiusSize !== '' && radiusSize !== stored.borderRadius[index])) {
                                        valid = false;
                                        return true;
                                    }
                                    [width, borderStyle, radiusSize] = [item.width, this.getBorderStyle(item), stored.borderRadius[index]];
                                }
                                return false;
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
                            root['1'].push({ '2': false, '3': backgroundColor, '4': false, '5': false });
                            if (valid) {
                                const hideWidth = `-${formatPX(parseInt(width) * 2)}`;
                                const layerList = {
                                    'top': (this.borderVisible(stored.borderTop) ? '' : hideWidth),
                                    'right': (this.borderVisible(stored.borderRight) ? '' : hideWidth),
                                    'bottom': (this.borderVisible(stored.borderBottom) ? '' : hideWidth),
                                    'left': (this.borderVisible(stored.borderLeft) ? '' : hideWidth),
                                    '2': [{ width, borderStyle }],
                                    '3': false,
                                    '4': radius,
                                    '5': radiusInit
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
                                            '3': false,
                                            '4': radius,
                                            '5': radiusInit
                                        };
                                        layerList[['top', 'right', 'bottom', 'left'][index]] = '';
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
                            for (const [name, value] of Resource.STORED.DRAWABLES.entries()) {
                                if (value === xml) {
                                    resourceName = name;
                                    break;
                                }
                            }
                            if (resourceName === '') {
                                resourceName = `${node.tagName.toLowerCase()}_${node.nodeId}`;
                                Resource.STORED.DRAWABLES.set(resourceName, xml);
                            }
                        }
                        node.attr(formatString(method['background'], resourceName), (node.renderExtension == null));
                    }
                    else if (getCache(node.element, 'fontStyle') == null && stored.backgroundColor.length > 0) {
                        node.attr(formatString(method['backgroundColor'], stored.backgroundColor), (node.renderExtension == null));
                    }
                }
            });
        }
        setFontStyle() {
            super.setFontStyle();
            const tagName = {};
            this.cache.filter(node => node.visible && !includesEnum(node.excludeResource, NODE_RESOURCE.FONT_STYLE)).each(node => {
                if (getCache(node.element, 'fontStyle') != null) {
                    if (tagName[node.tagName] == null) {
                        tagName[node.tagName] = [];
                    }
                    tagName[node.tagName].push(node);
                }
            });
            for (const tag in tagName) {
                const nodes = new NodeList(tagName[tag]);
                const sorted = [];
                for (let node of nodes) {
                    let system = false;
                    let labelFor = null;
                    if (node.companion != null) {
                        labelFor = node;
                        node = node.companion;
                    }
                    const element = node.element;
                    const nodeId = (labelFor || node).id;
                    const stored = Object.assign({}, getCache(element, 'fontStyle'));
                    if (stored.backgroundColor && stored.backgroundColor.length > 0) {
                        stored.backgroundColor = `@color/${ResourceView.addColor(stored.backgroundColor[0], stored.backgroundColor[2])}`;
                    }
                    if (stored.fontFamily != null) {
                        let fontFamily = stored.fontFamily.toLowerCase().split(',')[0].replace(/"/g, '').trim();
                        let fontStyle = '';
                        let fontWeight = '';
                        if (stored.color && stored.color.length > 0) {
                            stored.color = `@color/${ResourceView.addColor(stored.color[0], stored.color[2])}`;
                        }
                        if (SETTINGS.fontAliasResourceValue && FONTREPLACE_ANDROID[fontFamily] != null) {
                            fontFamily = FONTREPLACE_ANDROID[fontFamily];
                        }
                        if ((FONT_ANDROID[fontFamily] && SETTINGS.targetAPI >= FONT_ANDROID[fontFamily]) || (SETTINGS.fontAliasResourceValue && FONTALIAS_ANDROID[fontFamily] && SETTINGS.targetAPI >= FONT_ANDROID[FONTALIAS_ANDROID[fontFamily]])) {
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
                if (tagStyle != null) {
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
            this.cache.filter(node => node.visible && (node.element.tagName === 'IMG' || (node.element.tagName === 'INPUT' && node.element.type === 'image')) && !includesEnum(node.excludeResource, NODE_RESOURCE.IMAGE_SOURCE)).each(node => {
                const element = node.element;
                if (getCache(element, 'imageSource') == null || SETTINGS.alwaysReevaluateResources) {
                    const result = (node.element.tagName === 'IMG' ? ResourceView.addImageSrcSet(element) : ResourceView.addImage({ 'mdpi': element.src }));
                    if (result !== '') {
                        const method = METHOD_ANDROID['imageSource'];
                        node.attr(formatString(method['src'], result), (node.renderExtension == null));
                        setCache(element, 'imageSource', result);
                    }
                }
            });
        }
        setOptionArray() {
            super.setOptionArray();
            this.cache.filter(node => node.visible && node.element.tagName === 'SELECT' && !includesEnum(node.excludeResource, NODE_RESOURCE.OPTION_ARRAY)).each(node => {
                const stored = getCache(node.element, 'optionArray');
                if (stored != null) {
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
                    node.attr(formatString(method['entries'], arrayName), (node.renderExtension == null));
                }
            });
        }
        setValueString(supportInline) {
            super.setValueString(supportInline);
            this.cache.filter(node => node.visible && !includesEnum(node.excludeResource, NODE_RESOURCE.VALUE_STRING)).each(node => {
                const stored = getCache(node.element, 'valueString');
                if (stored != null) {
                    if (node.is(NODE_STANDARD.TEXT) && node.style != null) {
                        const match = node.style.textDecoration.match(/(underline|line-through)/);
                        if (match != null) {
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
                        node.attr(formatString(method['text'], (isNaN(parseInt(name)) || parseInt(name).toString() !== name ? `@string/${name}` : name)), (node.renderExtension == null));
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
                const node = viewData.cache.locate('id', parseInt(id));
                if (node != null) {
                    const styles = map[id].styles;
                    const attrs = map[id].attributes;
                    if (styles.length > 0) {
                        inherit.add(styles.join('.'));
                        node.add('_', 'style', `@style/${styles.pop()}`);
                    }
                    if (attrs.length > 0) {
                        attrs.sort().forEach(value => node.attr(replaceUnit(value, true), false));
                    }
                }
            }
            for (const styles of inherit) {
                let parent = '';
                styles.split('.').forEach((value) => {
                    const match = value.match(/^(\w*?)(?:_([0-9]+))?$/);
                    if (match != null) {
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
                    return (stored.backgroundColor.length > 0 ? [{ color: stored.backgroundColor }] : false);
                case 'radius':
                    return (stored.borderRadius.length === 1 && stored.borderRadius[0] !== '0px' ? [{ radius: stored.borderRadius[0] }] : false);
                case 'radiusInit':
                    return (stored.borderRadius.length > 1 ? [] : false);
                case 'radiusAll':
                    const result = {};
                    stored.borderRadius.forEach((value, index) => result[`${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius`] = value);
                    return result;
            }
            return false;
        }
    }

    function createPlaceholder(nextId, node, children = []) {
        const placeHolder = new View(nextId, node.api, node.element);
        placeHolder.depth = node.depth;
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
                    if (object[attr]) {
                        let value = object[attr].toString();
                        switch (namespace) {
                            case 'android':
                                switch (attr) {
                                    case 'text':
                                        if (!value.startsWith('@string/')) {
                                            if (SETTINGS.numberResourceValue || !isNumber(value)) {
                                                value = ResourceView.addString(value);
                                                if (value !== '') {
                                                    object[attr] = `@string/${value}`;
                                                    continue;
                                                }
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
    function findNestedExtension(node, extension) {
        return Array.from(node.element.children).find((element) => includes(optional(element, 'dataset.ext'), extension));
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
        const parent = node.documentParent;
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
            this.merge = {};
            resetId();
        }
        finalize(layouts) {
            for (const value of layouts) {
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
            this.merge = {};
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
            for (const node of this.cache.visible) {
                const nodes = new NodeList(node.renderChildren.filter(item => !item.isolated), node);
                const constraint = node.is(NODE_STANDARD.CONSTRAINT);
                const relative = node.is(NODE_STANDARD.RELATIVE);
                const flex = node.flex;
                if (nodes.length > 0 && (constraint || relative || flex.enabled)) {
                    node.constraint.guideline = {};
                    const mapLayout = MAP_LAYOUT[(relative ? 'relative' : 'constraint')];
                    const relativeParent = MAP_LAYOUT.relativeParent;
                    function mapParent(item, direction) {
                        if (constraint) {
                            return (item.app(mapLayout[direction]) === 'parent');
                        }
                        else {
                            return (item.android(relativeParent[direction]) === 'true');
                        }
                    }
                    function mapView(item, direction) {
                        if (constraint) {
                            return item.app(mapLayout[direction]);
                        }
                        else {
                            return item.android(mapLayout[direction]);
                        }
                    }
                    function mapDelete(item, ...direction) {
                        item.delete((constraint ? 'app' : 'android'), ...direction.map(value => mapLayout[value]));
                    }
                    function resolveAnchor(item, orientation) {
                        if (!item.constraint[orientation]) {
                            let parent = item;
                            while (parent != null) {
                                const stringId = mapView(parent, (orientation === AXIS_ANDROID.HORIZONTAL ? 'leftRight' : 'topBottom'));
                                if (stringId != null) {
                                    parent = nodes.locate('nodeId', stripId(stringId));
                                    if (parent != null && parent.constraint[orientation]) {
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
                    function anchored(list) {
                        return list.filter(current => current.anchored);
                    }
                    if (relative && (node.inlineWrap || nodes.list.some(item => item.inlineWrap))) {
                        const baseline = [];
                        function adjustBaseline() {
                            if (baseline.length > 1) {
                                const images = baseline.filter(item => item.element.tagName === 'IMG');
                                const tallest = (images.length > 0 ? images : baseline).sort((a, b) => (a.linear.height >= b.linear.height ? -1 : 1))[0];
                                let topParent = false;
                                for (const item of baseline) {
                                    if (item !== tallest) {
                                        item.android(mapLayout[(images.length > 0 ? 'bottom' : 'baseline')], tallest.stringId);
                                        if (images.length > 0 && mapParent(item, 'top')) {
                                            item.delete('android', relativeParent['top']);
                                            topParent = true;
                                        }
                                    }
                                }
                                if (topParent) {
                                    tallest.android(relativeParent['top'], 'true');
                                }
                            }
                        }
                        const rows = [];
                        const multiLine = nodes.list.some(item => item.multiLine);
                        let previousRowBottom = null;
                        for (let i = 0, width = 0; i < nodes.length; i++) {
                            const current = nodes.get(i);
                            const dimension = current[(current.multiLine ? 'bounds' : 'linear')];
                            if (i === 0) {
                                current.android(relativeParent['top'], 'true');
                                current.android(relativeParent['left'], 'true');
                                width += dimension.width;
                                rows[rows.length] = [current];
                            }
                            else {
                                const group = (current instanceof ViewGroup);
                                const previous = nodes.get(i - 1);
                                if ((node.inlineWrap && group) || (multiLine && (Math.floor(width - current.marginLeft) + dimension.width > node.box.width)) || (!multiLine && (current.linear.top >= previous.linear.bottom))) {
                                    const items = rows[rows.length - 1];
                                    previousRowBottom = items[0];
                                    for (let j = 1; j < items.length; j++) {
                                        if (items[j].linear.bottom > previousRowBottom.linear.bottom) {
                                            previousRowBottom = items[j];
                                        }
                                    }
                                    if (group) {
                                        current.constraint.marginVertical = previousRowBottom.stringId;
                                    }
                                    current.android(mapLayout['topBottom'], previousRowBottom.stringId);
                                    current.android(relativeParent['left'], 'true');
                                    width = (current.multiLine ? dimension.right - dimension.left : dimension.width);
                                    adjustBaseline();
                                    baseline.length = 0;
                                    rows[rows.length] = [current];
                                }
                                else {
                                    current.android(mapLayout['leftRight'], previous.stringId);
                                    if (previousRowBottom != null) {
                                        current.android(mapLayout['topBottom'], previousRowBottom.stringId);
                                    }
                                    width += dimension.width;
                                    rows[rows.length - 1].push(current);
                                }
                            }
                            if (current.nodeType <= NODE_STANDARD.IMAGE) {
                                baseline.push(current);
                            }
                        }
                        adjustBaseline();
                        for (let i = 0; i < rows.length; i++) {
                            const current = rows[i][0];
                            if (current.is(NODE_STANDARD.TEXT) && Math.ceil(current.linear.right) >= node.box.right) {
                                current.android('singleLine', 'true');
                            }
                        }
                    }
                    else {
                        const [pageflow, fixed] = nodes.partition(item => item.pageflow);
                        const linearX = pageflow.linearX;
                        const verticalPerspective = (!SETTINGS.horizontalPerspective && !flex.enabled && !pageflow.list.some(item => item.floating));
                        if (pageflow.length > 0) {
                            pageflow.prepend(node);
                            for (let current of pageflow) {
                                for (const adjacent of pageflow) {
                                    if (current === adjacent) {
                                        continue;
                                    }
                                    else {
                                        let linear1 = current.linear;
                                        let linear2 = adjacent.linear;
                                        let stringId = adjacent.stringId;
                                        const horizontal = (resolveAnchor(adjacent, AXIS_ANDROID.HORIZONTAL) ? AXIS_ANDROID.HORIZONTAL : '');
                                        const vertical = (resolveAnchor(adjacent, AXIS_ANDROID.VERTICAL) ? AXIS_ANDROID.VERTICAL : '');
                                        const intersectY = current.intersectY(adjacent.linear);
                                        const alignMargin = (current.alignMargin && adjacent.alignMargin);
                                        if (constraint) {
                                            if (current === node || adjacent === node) {
                                                if (current === node) {
                                                    current = adjacent;
                                                }
                                                linear1 = current.linear;
                                                linear2 = node.box;
                                                stringId = 'parent';
                                            }
                                            if (current.styleMap.width != null && current.styleMap.marginLeft === 'auto' && current.styleMap.marginRight === 'auto') {
                                                this.setAlignParent(current, AXIS_ANDROID.HORIZONTAL);
                                            }
                                            else {
                                                if (stringId === 'parent') {
                                                    if (linear1.left <= linear2.left || withinFraction(linear1.left, linear2.left)) {
                                                        current.anchor(mapLayout['left'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                                    }
                                                    if (linear1.right >= linear2.right || withinRange(linear1.right, linear2.right, SETTINGS.constraintWhitespaceHorizontalOffset)) {
                                                        current.anchor(mapLayout['right'], 'parent', (node.viewWidth > 0 || current.float === 'right' || current.inlineWrap || current.styleMap.marginLeft === 'auto' ? AXIS_ANDROID.HORIZONTAL : ''));
                                                    }
                                                }
                                                else {
                                                    if (current.viewWidth === 0 && linear1.left === linear2.left && linear1.right === linear2.right) {
                                                        if (!mapParent(current, 'right')) {
                                                            current.anchor(mapLayout['left'], stringId);
                                                        }
                                                        if (!mapParent(current, 'left')) {
                                                            current.anchor(mapLayout['right'], stringId);
                                                        }
                                                    }
                                                    else if (verticalPerspective) {
                                                        if (linear1.left === linear2.left) {
                                                            current.anchor(mapLayout['left'], stringId);
                                                        }
                                                        else if (linear1.right === linear2.right) {
                                                            current.anchor(mapLayout['right'], stringId);
                                                        }
                                                    }
                                                    if (withinRange(linear1.left, linear2.right, (alignMargin ? SETTINGS.constraintWhitespaceHorizontalOffset : 0))) {
                                                        if (current.float !== 'right') {
                                                            current.anchor(mapLayout['leftRight'], stringId, horizontal, current.withinX(linear2));
                                                        }
                                                        else {
                                                            current.constraint.marginHorizontal = adjacent.stringId;
                                                        }
                                                    }
                                                    if (withinRange(linear1.right, linear2.left, (alignMargin ? SETTINGS.constraintWhitespaceHorizontalOffset : 0))) {
                                                        if (current.float !== 'left') {
                                                            current.anchor(mapLayout['rightLeft'], stringId, horizontal, current.withinX(linear2));
                                                        }
                                                    }
                                                }
                                            }
                                            let topParent = mapParent(current, 'top');
                                            const bottomParent = mapParent(current, 'bottom');
                                            if (stringId === 'parent') {
                                                if (linear1.top <= linear2.top || withinFraction(linear1.top, linear2.top)) {
                                                    current.anchor(mapLayout['top'], 'parent', AXIS_ANDROID.VERTICAL);
                                                    topParent = true;
                                                }
                                                if (linear1.bottom >= linear2.bottom || withinFraction(linear1.bottom, linear2.bottom)) {
                                                    if (!(topParent && current.inlineWrap)) {
                                                        current.anchor(mapLayout['bottom'], 'parent', (node.viewHeight > 0 ? AXIS_ANDROID.VERTICAL : ''));
                                                    }
                                                }
                                            }
                                            else {
                                                if (withinRange(linear1.top, linear2.bottom, (alignMargin ? SETTINGS.constraintWhitespaceVerticalOffset : 0))) {
                                                    if (intersectY || !bottomParent) {
                                                        current.anchor(mapLayout['topBottom'], stringId, vertical, intersectY);
                                                    }
                                                }
                                                else if (withinRange(linear1.bottom, linear2.top, (alignMargin ? SETTINGS.constraintWhitespaceVerticalOffset : 0))) {
                                                    if (intersectY || !topParent) {
                                                        current.anchor(mapLayout['bottomTop'], stringId, vertical, intersectY);
                                                    }
                                                }
                                                if (linear1.top === linear2.top && !topParent && !bottomParent) {
                                                    current.anchor(mapLayout['top'], stringId, vertical);
                                                }
                                                if (linear1.bottom === linear2.bottom && !topParent && !bottomParent) {
                                                    current.anchor(mapLayout['bottom'], stringId, vertical);
                                                }
                                            }
                                        }
                                        else if (relative) {
                                            if (current === node) {
                                                continue;
                                            }
                                            else if (adjacent === node) {
                                                if (current.linear.left <= node.box.left || withinFraction(current.linear.left, node.box.left)) {
                                                    current.anchor(relativeParent['left'], 'true', AXIS_ANDROID.HORIZONTAL);
                                                }
                                                else if (current.linear.right >= node.box.right || withinFraction(current.linear.right, node.box.right)) {
                                                    current.anchor(relativeParent['right'], 'true', AXIS_ANDROID.HORIZONTAL);
                                                }
                                                if (current.linear.top <= node.box.top || withinFraction(current.linear.top, node.box.top)) {
                                                    current.anchor(relativeParent['top'], 'true', AXIS_ANDROID.VERTICAL);
                                                }
                                                else if (current.linear.bottom >= node.box.bottom || withinFraction(current.linear.bottom, node.box.bottom)) {
                                                    current.anchor(relativeParent['bottom'], 'true', AXIS_ANDROID.VERTICAL);
                                                }
                                            }
                                            else {
                                                if (current.css('width') != null && current.styleMap.marginRight === 'auto' && current.styleMap.marginLeft === 'auto') {
                                                    current.android('layout_centerHorizontal', 'true');
                                                    current.constraint.horizontal = true;
                                                }
                                                else {
                                                    if ((linear1.top === linear2.top || linear1.bottom === linear2.bottom) && withinRange(linear1.left, linear2.right, SETTINGS.constraintWhitespaceHorizontalOffset)) {
                                                        if (current.float === 'right') {
                                                            adjacent.anchor(mapLayout['rightLeft'], current.stringId, horizontal);
                                                        }
                                                        else {
                                                            current.anchor(mapLayout['leftRight'], stringId, horizontal);
                                                            if (adjacent.constraint.horizontal) {
                                                                current.delete('android', relativeParent['right']);
                                                            }
                                                        }
                                                    }
                                                }
                                                if (withinRange(linear1.top, linear2.bottom, SETTINGS.constraintWhitespaceVerticalOffset)) {
                                                    current.anchor(mapLayout['topBottom'], stringId, vertical, intersectY);
                                                    if (adjacent.constraint.vertical) {
                                                        current.delete('android', relativeParent['bottom']);
                                                    }
                                                }
                                                else if (withinRange(linear1.bottom, linear2.top, SETTINGS.constraintWhitespaceVerticalOffset)) {
                                                    if (!mapParent(current, 'top')) {
                                                        current.anchor(mapLayout['bottomTop'], stringId, vertical, intersectY);
                                                    }
                                                }
                                                if (adjacent.constraint.horizontal) {
                                                    if (linear1.bottom === linear2.bottom) {
                                                        if (!linearX && !current.floating && !current.constraint.vertical) {
                                                            current.anchor(mapLayout['bottom'], stringId, vertical);
                                                            if (adjacent.constraint.vertical) {
                                                                current.delete('android', relativeParent['bottom']);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            pageflow.remove(0);
                        }
                        if (fixed.length > 0) {
                            node.setBoundsMin();
                            for (const current of fixed) {
                                const map = (constraint ? mapLayout : relativeParent);
                                const stringId = (constraint ? 'parent' : 'true');
                                if (current.top != null && convertInt(current.top) === 0) {
                                    current.anchor(map['top'], stringId, AXIS_ANDROID.VERTICAL);
                                }
                                if (current.right != null && convertInt(current.right) >= 0) {
                                    current.anchor(map['right'], stringId, AXIS_ANDROID.HORIZONTAL);
                                }
                                if (current.bottom != null && convertInt(current.bottom) >= 0) {
                                    current.anchor(map['bottom'], stringId, AXIS_ANDROID.VERTICAL);
                                }
                                if (current.left != null && convertInt(current.left) === 0) {
                                    current.anchor(map['left'], stringId, AXIS_ANDROID.HORIZONTAL);
                                }
                                if (current.left === 0 && current.right === 0) {
                                    if (!current.floating) {
                                        current.android('layout_width', 'match_parent');
                                    }
                                }
                                if (current.top === 0 && current.bottom === 0) {
                                    current.android('layout_height', 'match_parent');
                                }
                            }
                        }
                        for (const current of nodes) {
                            const leftRight = mapView(current, 'leftRight');
                            if (leftRight != null) {
                                if (!current.constraint.horizontal) {
                                    current.constraint.horizontal = flex.enabled || resolveAnchor(current, AXIS_ANDROID.HORIZONTAL);
                                }
                                current.constraint.marginHorizontal = leftRight;
                            }
                            const topBottom = mapView(current, 'topBottom');
                            if (topBottom != null) {
                                if (!current.constraint.vertical) {
                                    current.constraint.vertical = flex.enabled || resolveAnchor(current, AXIS_ANDROID.VERTICAL);
                                }
                                current.constraint.marginVertical = topBottom;
                                mapDelete(current, 'top');
                            }
                            if (mapParent(current, 'left') && mapParent(current, 'right')) {
                                if (current.styleMap.marginLeft === 'auto' || current.styleMap.marginRight === 'auto') {
                                    if (current.styleMap.marginLeft === 'auto' && current.styleMap.marginRight !== 'auto') {
                                        mapDelete(current, 'left');
                                    }
                                    if (current.styleMap.marginLeft !== 'auto' && current.styleMap.marginRight === 'auto') {
                                        mapDelete(current, 'right');
                                    }
                                    if (current.marginLeft === current.marginRight) {
                                        if (node.viewWidth > 0) {
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
                                        }
                                    }
                                    else {
                                        mapDelete(current, 'right');
                                    }
                                }
                                else {
                                    mapDelete(current, 'right');
                                }
                            }
                            if (constraint) {
                                if (mapView(current, 'bottomTop') != null) {
                                    mapDelete(current, 'bottom');
                                }
                            }
                            else {
                                if (mapView(current, 'topBottom') != null) {
                                    mapDelete(current, 'bottomTop');
                                }
                            }
                        }
                        for (let i = 0; i < pageflow.length; i++) {
                            const current = pageflow.get(i);
                            if (!current.anchored) {
                                const result = (constraint ? search(current.get('app'), '*constraint*') : search(current.get('android'), mapLayout));
                                for (const [key, value] of result) {
                                    if (value !== 'parent' && anchored(pageflow).locate('stringId', value) != null) {
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
                        if (flex.enabled || (!SETTINGS.constraintChainDisabled && constraint && pageflow.length > 1)) {
                            let flexbox = null;
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
                                    flexbox = [{ constraint: { horizontalChain, verticalChain } }];
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
                                    flexbox = [];
                                    for (const n of levels) {
                                        flexbox.push({ constraint: { horizontalChain: new NodeList(map[n]), verticalChain: new NodeList() } });
                                    }
                                }
                            }
                            else {
                                const horizontal = pageflow.list.filter(current => !current.constraint.horizontal);
                                const vertical = pageflow.list.filter(current => !current.constraint.vertical);
                                pageflow.list.some((current) => {
                                    let horizontalChain = [];
                                    let verticalChain = [];
                                    if (horizontal.length > 0) {
                                        horizontalChain = this.partitionChain(node, current, pageflow, AXIS_ANDROID.HORIZONTAL);
                                        current.constraint.horizontalChain = new NodeList(sortAsc(horizontalChain, 'linear.left'));
                                    }
                                    if (vertical.length > 0) {
                                        verticalChain = this.partitionChain(node, current, pageflow, AXIS_ANDROID.VERTICAL);
                                        current.constraint.verticalChain = new NodeList(sortAsc(verticalChain, 'linear.top'));
                                    }
                                    return (horizontalChain.length === pageflow.length || verticalChain.length === pageflow.length);
                                });
                            }
                            const direction = MAP_CHAIN.direction.slice();
                            if (verticalPerspective) {
                                direction.reverse();
                            }
                            direction.forEach((value, index) => {
                                const connected = (flex.enabled ? flexbox : pageflow.clone().list.sort((a, b) => (a.constraint[value] != null ? a.constraint[value].length : 0) >= (b.constraint[value] != null ? b.constraint[value].length : 0) ? -1 : 1));
                                if (connected != null) {
                                    if (verticalPerspective) {
                                        index = (index === 0 ? 1 : 0);
                                    }
                                    const inverse = (index === 0 ? 1 : 0);
                                    connected.filter(current => current.constraint[value]).forEach((current, level) => {
                                        const chainable = current.constraint[value];
                                        if (chainable.length > (flex.enabled ? 0 : 1)) {
                                            chainable.parent = node;
                                            if (flex.enabled && chainable.list.some(item => item.flex.order > 0)) {
                                                chainable[(flex.direction.indexOf('reverse') !== -1 ? 'sortDesc' : 'sortAsc')]('flex.order');
                                            }
                                            const [HV, VH] = [MAP_CHAIN['horizontalVertical'][index], MAP_CHAIN['horizontalVertical'][inverse]];
                                            const [LT, TL] = [MAP_CHAIN['leftTop'][index], MAP_CHAIN['leftTop'][inverse]];
                                            const [RB, BR] = [MAP_CHAIN['rightBottom'][index], MAP_CHAIN['rightBottom'][inverse]];
                                            const [WH, HW] = [MAP_CHAIN['widthHeight'][index], MAP_CHAIN['widthHeight'][inverse]];
                                            const orientation = HV.toLowerCase();
                                            const orientationInverse = VH.toLowerCase();
                                            const dimension = WH.toLowerCase();
                                            const first = chainable.get(0);
                                            const last = chainable.get();
                                            let maxOffset = -1;
                                            let disconnected = false;
                                            let marginDelete = false;
                                            const attrs = (index === 0 ? [AXIS_ANDROID.HORIZONTAL, 'left', 'leftRight', 'top', AXIS_ANDROID.VERTICAL, 'viewWidth', 'right', 'marginHorizontal'] : [AXIS_ANDROID.VERTICAL, 'top', 'topBottom', 'left', AXIS_ANDROID.HORIZONTAL, 'viewHeight', 'bottom', 'marginVertical']);
                                            for (let i = 0; i < chainable.length; i++) {
                                                const item = chainable.get(i);
                                                if (i === 0) {
                                                    if (!mapParent(item, attrs[1])) {
                                                        disconnected = true;
                                                        break;
                                                    }
                                                }
                                                else {
                                                    if (mapView(item, attrs[2]) == null) {
                                                        disconnected = true;
                                                        break;
                                                    }
                                                }
                                            }
                                            if (!disconnected) {
                                                if (chainable.list.every(item => same(first, item, `linear.${attrs[3]}`))) {
                                                    for (let j = 1; j < chainable.length; j++) {
                                                        const item = chainable.get(j);
                                                        if (!item.constraint[attrs[4]]) {
                                                            item.anchor(mapLayout[attrs[3]], first.stringId, attrs[4]);
                                                        }
                                                    }
                                                }
                                                if (!flex.enabled && node[attrs[5]] === 0) {
                                                    mapDelete(last, attrs[6]);
                                                    last.constraint[attrs[7]] = mapView(last, attrs[2]);
                                                }
                                            }
                                            first.anchor(mapLayout[LT], 'parent', orientation);
                                            last.anchor(mapLayout[RB], 'parent', orientation);
                                            if (verticalPerspective) {
                                                if (mapView(first, 'leftRight') != null) {
                                                    if (!mapParent(first, 'left')) {
                                                        mapDelete(first, 'left');
                                                    }
                                                }
                                                if (mapView(first, 'rightLeft') != null) {
                                                    mapDelete(first, 'right');
                                                }
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
                                                else {
                                                    if (verticalPerspective) {
                                                        if (mapParent(chain, 'right') && mapView(chain, 'leftRight') != null) {
                                                            mapDelete(chain, 'right');
                                                        }
                                                        if (chain !== first) {
                                                            if (mapView(chain, 'left') != null || mapView(chain, 'right') != null) {
                                                                mapDelete(chain, 'leftRight', 'rightLeft');
                                                                delete chain.constraint.marginHorizontal;
                                                            }
                                                        }
                                                    }
                                                }
                                                if (next != null) {
                                                    chain.anchor(mapLayout[MAP_CHAIN['rightLeftBottomTop'][index]], next.stringId);
                                                    maxOffset = Math.max(next.linear[LT] - chain.linear[RB], maxOffset);
                                                }
                                                if (previous != null) {
                                                    chain.anchor(mapLayout[MAP_CHAIN['leftRightTopBottom'][index]], previous.stringId);
                                                    chain.constraint[`margin${HV}`] = previous.stringId;
                                                }
                                                chain.constraint[`chain${HV}`] = true;
                                                if (!chain.isSet('styleMap', dimension)) {
                                                    const minW = chain.styleMap[`min${WH}`];
                                                    const minH = chain.styleMap[`min${HW}`];
                                                    const maxW = chain.styleMap[`max${WH}`];
                                                    const maxH = chain.styleMap[`max${HW}`];
                                                    if (minW) {
                                                        chain.app(`layout_constraint${WH}_min`, minW);
                                                        chain.constraint[`min${WH}`] = true;
                                                    }
                                                    if (maxW) {
                                                        chain.app(`layout_constraint${WH}_max`, maxW);
                                                        chain.constraint[`max${WH}`] = true;
                                                    }
                                                    if (minH) {
                                                        chain.app(`layout_constraint${HW}_min`, minH);
                                                        chain.constraint[`min${HW}`] = true;
                                                    }
                                                    if (maxH) {
                                                        chain.app(`layout_constraint${HW}_max`, maxH);
                                                        chain.constraint[`max${HW}`] = true;
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
                                                                    if (mapView(item, 'top') === chain.stringId) {
                                                                        mapDelete(item, 'top');
                                                                    }
                                                                    if (mapView(item, 'bottom') === chain.stringId) {
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
                                                            this.setAlignParent(chain, orientationInverse);
                                                            break;
                                                    }
                                                    if (chain.flex.basis !== 'auto') {
                                                        if (isPercent(chain.flex.basis)) {
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
                                                        this.addGuideline(first, node, orientation, true, false);
                                                        this.addGuideline(last, node, orientation, true, true);
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
                                                marginDelete = true;
                                            }
                                            else {
                                                const alignLeft = withinFraction(node.box.left, first.linear.left);
                                                const alignRight = withinFraction(last.linear.right, node.box.right);
                                                const alignTop = withinFraction(node.box.top, first.linear.top);
                                                const alignBottom = withinFraction(last.linear.bottom, node.box.bottom);
                                                if ((orientation === AXIS_ANDROID.HORIZONTAL && alignLeft && alignRight) || (orientation === AXIS_ANDROID.VERTICAL && alignTop && alignBottom)) {
                                                    if (chainable.length > 2 || flex.enabled) {
                                                        if (!flex.enabled && (node.inlineElement || node.floating)) {
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
                                                        if (chainable.list.every(upper => same(first, upper, `linear.${opposing[0]}`) && chainable.list.some(lower => !same(first, lower, `linear.${opposing[1]}`)))) {
                                                            for (const chain of chainable) {
                                                                mapDelete(chain, opposing[1]);
                                                            }
                                                        }
                                                    });
                                                    for (const inner of chainable) {
                                                        for (const outer of pageflow) {
                                                            const horizontal = outer.constraint.horizontalChain;
                                                            const vertical = outer.constraint.verticalChain;
                                                            if (horizontal && horizontal.length > 0 && horizontal.locate('id', inner.id) != null) {
                                                                horizontal.clear();
                                                            }
                                                            if (vertical && vertical.length > 0 && vertical.locate('id', inner.id) != null) {
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
                                        }
                                    });
                                }
                            });
                        }
                        for (const current of pageflow) {
                            current.constraint.horizontal = resolveAnchor(current, AXIS_ANDROID.HORIZONTAL);
                            current.constraint.vertical = resolveAnchor(current, AXIS_ANDROID.VERTICAL);
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
                                                const topBottom = mapView(adjacent, value);
                                                if (topBottom != null) {
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
                            function deleteConstraints(item, stringId = '', parent = false) {
                                const obj = (constraint ? 'app' : 'android');
                                for (const attr in mapLayout) {
                                    const value = item[obj](mapLayout[attr]);
                                    if ((value !== 'parent' || parent) && (stringId === '' || value === stringId)) {
                                        item.delete(obj, mapLayout[attr]);
                                    }
                                }
                                item.constraint.horizontal = (mapParent(item, 'left') || mapParent(item, 'right'));
                                item.constraint.vertical = (mapParent(item, 'top') || mapParent(item, 'bottom'));
                            }
                            if (constraint) {
                                for (const current of pageflow) {
                                    [['top', 'bottom', 'topBottom'], ['bottom', 'top', 'bottomTop']].forEach(direction => {
                                        if (mapParent(current, direction[1]) && mapView(current, direction[2]) == null) {
                                            ['leftRight', 'rightLeft'].forEach(value => {
                                                const stringId = mapView(current, value);
                                                if (stringId != null) {
                                                    const aligned = pageflow.locate('stringId', stringId);
                                                    if (aligned && mapView(aligned, direction[2]) != null) {
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
                                const unbound = pageflow.filter(current => !current.anchored && (mapParent(current, 'top') || mapParent(current, 'right') || mapParent(current, 'bottom') || mapParent(current, 'left')));
                                if (anchored(nodes).length === 0 && unbound.length === 0) {
                                    unbound.append(nodes.get(0));
                                }
                                for (const current of unbound) {
                                    this.addGuideline(current, node, '', false, false);
                                }
                                const [adjacent, unanchored] = nodes.partition(item => item.anchored);
                                for (const current of unanchored) {
                                    adjacent.each(item => deleteConstraints(item, current.stringId));
                                    if (withinRange(current.horizontalBias, 0.5, 0.01) && withinRange(current.verticalBias, 0.5, 0.01)) {
                                        deleteConstraints(current);
                                        this.setAlignParent(current);
                                    }
                                    else if (SETTINGS.constraintCirclePositionAbsolute && adjacent.length > 0) {
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
                                        current.app('layout_constraintCircleRadius', delimitDimen(`${current.tagName}`, 'constraintcircleradius', formatPX(radius)));
                                        current.app('layout_constraintCircleAngle', degrees.toString());
                                        current.constraint.horizontal = true;
                                        current.constraint.vertical = true;
                                    }
                                    else {
                                        deleteConstraints(current);
                                        this.addGuideline(current, node);
                                    }
                                }
                            }
                            else {
                                for (const current of nodes) {
                                    if (!current.anchored) {
                                        if (withinRange(current.horizontalBias, 0.5, 0.01) && withinRange(current.verticalBias, 0.5, 0.01)) {
                                            deleteConstraints(current);
                                            current.android('layout_centerInParent', 'true');
                                            continue;
                                        }
                                        if (!current.constraint.horizontal) {
                                            nodes.list.some(adjacent => {
                                                if (adjacent !== current && adjacent.constraint.horizontal) {
                                                    if (withinFraction(current.linear.left, adjacent.linear.left)) {
                                                        current.anchor(mapLayout['left'], adjacent.stringId, AXIS_ANDROID.HORIZONTAL);
                                                        return true;
                                                    }
                                                }
                                                return false;
                                            });
                                            if (!current.constraint.horizontal) {
                                                const left = formatPX(Math.max(0, current.bounds.left - node.box.left));
                                                if (left !== '0px') {
                                                    current.css(parseRTL('marginLeft'), left);
                                                    current.android(parseRTL('layout_marginLeft'), left);
                                                }
                                                current.anchor(relativeParent['left'], 'true', AXIS_ANDROID.HORIZONTAL);
                                            }
                                        }
                                        if (!current.constraint.vertical) {
                                            nodes.list.some(adjacent => {
                                                if (adjacent !== current && adjacent.constraint.vertical) {
                                                    if (withinFraction(current.linear.top, adjacent.linear.top)) {
                                                        current.anchor(mapLayout['top'], adjacent.stringId, AXIS_ANDROID.VERTICAL);
                                                        return true;
                                                    }
                                                }
                                                return false;
                                            });
                                            if (!current.constraint.vertical) {
                                                const top = formatPX(Math.max(0, current.bounds.top - node.box.top));
                                                if (top !== '0px') {
                                                    current.css('marginTop', top);
                                                    current.android('layout_marginTop', top);
                                                }
                                                current.anchor(relativeParent['top'], 'true', AXIS_ANDROID.VERTICAL);
                                            }
                                        }
                                    }
                                    const topBottom = mapView(current, 'topBottom');
                                    if (topBottom != null) {
                                        const adjacent = nodes.locate('stringId', topBottom);
                                        if (adjacent != null) {
                                            if (mapView(adjacent, 'bottomTop') === current.stringId) {
                                                mapDelete(adjacent, 'bottomTop');
                                            }
                                        }
                                    }
                                }
                            }
                            let bottomParent = null;
                            let rightParent = null;
                            const bottomMax = nodes.bottom;
                            const connected = {};
                            for (const current of nodes) {
                                const top = mapParent(current, 'top');
                                const right = mapParent(current, 'right');
                                const bottom = mapParent(current, 'bottom');
                                const left = mapParent(current, 'left');
                                connected[current.stringId] = {
                                    leftRight: mapView(current, 'leftRight'),
                                    rightLeft: mapView(current, 'rightLeft'),
                                    topBottom: mapView(current, 'topBottom'),
                                    bottomTop: mapView(current, 'bottomTop'),
                                };
                                if (current.pageflow) {
                                    [[left, right, 'rightLeft', 'leftRight', 'right', 'left', 'Horizontal'], [top, bottom, 'bottomTop', 'topBottom', 'bottom', 'top', 'Vertical']].forEach((value, index) => {
                                        if (value[0] || value[1]) {
                                            let adjacent = current;
                                            let valid = (value[0] && value[1]);
                                            if (!valid) {
                                                do {
                                                    const stringId = mapView(adjacent, (value[0] ? value[2] : value[3]));
                                                    if (stringId != null) {
                                                        adjacent = this.findByStringId(stringId);
                                                        if (adjacent && ((value[0] && mapParent(adjacent, value[4])) || (value[1] && mapParent(adjacent, value[5])))) {
                                                            valid = true;
                                                            break;
                                                        }
                                                    }
                                                    else {
                                                        adjacent = null;
                                                    }
                                                } while (adjacent != null);
                                            }
                                            if (valid) {
                                                node.constraint[`layout${value[6]}`] = true;
                                            }
                                            if (!current.constraint[`chain${value[6]}`]) {
                                                if (value[0] && value[1]) {
                                                    if (!current.autoMargin) {
                                                        current.android(`layout_${(index === 0 ? 'width' : 'height')}`, 'match_parent', false);
                                                    }
                                                }
                                                else if (value[1]) {
                                                    if (valid) {
                                                        const below = this.findByStringId(mapView(current, value[3]));
                                                        if (below && below.marginBottom === 0) {
                                                            mapDelete(current, value[4]);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    if (top && bottom && current.linear.bottom < bottomMax) {
                                        mapDelete(current, 'bottom');
                                    }
                                    if (right) {
                                        if (!rightParent) {
                                            rightParent = false;
                                            rightParent = resolveAnchor(current, AXIS_ANDROID.HORIZONTAL);
                                        }
                                    }
                                    if (bottom) {
                                        if (!bottomParent) {
                                            bottomParent = false;
                                            bottomParent = resolveAnchor(current, AXIS_ANDROID.VERTICAL);
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
                                    if (right && convertInt(current.right) > 0) {
                                        current.modifyBox(BOX_STANDARD.MARGIN_RIGHT, current.marginRight + convertInt(current.right));
                                    }
                                    if (bottom && convertInt(current.bottom) > 0) {
                                        current.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, current.marginBottom + convertInt(current.bottom));
                                    }
                                }
                            }
                            function deleteChain(item, value) {
                                mapDelete(item, value);
                                connected[item.stringId][value] = null;
                            }
                            for (const left in connected) {
                                for (const right in connected) {
                                    if (left !== right) {
                                        ['leftRight', 'rightLeft', 'bottomTop', 'topBottom'].forEach(value => {
                                            if (connected[left][value] && connected[left][value] === connected[right][value]) {
                                                const conflict = nodes.locate('stringId', connected[left][value]);
                                                if (conflict != null) {
                                                    [nodes.locate('stringId', left), nodes.locate('stringId', right)].some((item, index) => {
                                                        if (item != null) {
                                                            const stringId = (index === 0 ? left : right);
                                                            switch (value) {
                                                                case 'leftRight':
                                                                case 'rightLeft':
                                                                    if ((mapView(item, 'left') != null || mapView(item, 'right') != null) && mapView(conflict, (value === 'rightLeft' ? 'leftRight' : 'rightLeft')) !== stringId) {
                                                                        deleteChain(item, value);
                                                                        return true;
                                                                    }
                                                                    break;
                                                                case 'bottomTop':
                                                                case 'topBottom':
                                                                    if ((mapView(item, 'top') != null || mapView(item, 'bottom') != null) && mapView(conflict, (value === 'topBottom' ? 'bottomTop' : 'topBottom')) !== stringId) {
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
                    for (const current of nodes) {
                        if (current.constraint.marginHorizontal != null) {
                            const item = this.findByStringId(current.constraint.marginHorizontal);
                            if (item != null) {
                                const offset = current.linear.left - item.linear.right;
                                if (offset >= 1) {
                                    current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + offset, true);
                                }
                            }
                        }
                        if (current.constraint.marginVertical != null) {
                            const item = this.findByStringId(current.constraint.marginVertical);
                            if (item != null) {
                                const offset = current.linear.top - item.linear.bottom;
                                if (offset >= 1) {
                                    current.modifyBox(BOX_STANDARD.MARGIN_TOP, current.marginTop + offset, true);
                                }
                            }
                        }
                    }
                }
            }
        }
        renderGroup(node, parent, viewName, options) {
            const target = (node.isSet('dataset', 'target') && !node.isSet('dataset', 'include'));
            let preXml = '';
            let postXml = '';
            let renderParent = parent;
            if (typeof viewName === 'number') {
                viewName = View.getNodeName(viewName);
            }
            switch (viewName) {
                case NODE_ANDROID.LINEAR:
                    options = { android: { orientation: (options && options.horizontal ? AXIS_ANDROID.HORIZONTAL : AXIS_ANDROID.VERTICAL) } };
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
                    .map(nodeName => {
                    const container = new View(this.cache.nextId, SETTINGS.targetAPI, node.element);
                    container.excludeResource |= NODE_RESOURCE.ALL;
                    container.setBounds();
                    container.setNodeId(nodeName);
                    this.cache.append(container);
                    switch (nodeName) {
                        case NODE_ANDROID.SCROLL_HORIZONTAL:
                            container.css({
                                width: node.styleMap.width,
                                minWidth: node.styleMap.minWidth,
                                maxWidth: node.styleMap.maxWidth,
                                overflowX: node.css('overflowX')
                            });
                            break;
                        default:
                            container.css({
                                height: node.styleMap.height,
                                minHeight: node.styleMap.minHeight,
                                maxHeight: node.styleMap.maxHeight,
                                overflowY: node.css('overflowY')
                            });
                    }
                    const indent = repeat(scrollDepth--);
                    preXml = indent + `<${nodeName}{@${container.id}}>\n` + preXml;
                    postXml += indent + `</${nodeName}>\n`;
                    if (current === node) {
                        node.parent = container;
                        renderParent = container;
                    }
                    current = container;
                    return container;
                })
                    .reverse()
                    .forEach((item, index) => {
                    switch (index) {
                        case 0:
                            item.parent = parent;
                            item.render(parent);
                            item.excludeProcedure = node.excludeProcedure;
                            item.excludeResource = node.excludeResource;
                            parent.children.push(item);
                            break;
                        case 1:
                            item.parent = current;
                            item.render(current);
                            current.children.push(item);
                            break;
                    }
                    current = item;
                });
                node.excludeResource |= NODE_RESOURCE.ALL;
            }
            node.apply(options);
            node.render((target ? node : renderParent));
            return this.getEnclosingTag((target || parent.isSet('dataset', 'target') || (node.renderDepth === 0 && !node.documentRoot) ? -1 : node.renderDepth), viewName, node.id, `{:${node.id}}`, preXml, postXml);
        }
        renderNode(node, parent, tagName, recursive = false) {
            const target = (node.isSet('dataset', 'target') && !node.isSet('dataset', 'include'));
            if (typeof tagName === 'number') {
                tagName = View.getNodeName(tagName);
            }
            node.setNodeId(tagName);
            const element = node.element;
            switch (element.tagName) {
                case 'IMG':
                    if (isPercent(node.css('width')) || isPercent(node.css('height'))) {
                        node.android('scaleType', 'fitXY');
                    }
                    switch (node.css('objectFit')) {
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
                    if (node.viewWidth > 0 && (node.paddingLeft > 0 || node.paddingRight > 0)) {
                        node.css('width', formatPX(node.viewWidth + node.paddingLeft + node.paddingRight));
                    }
                    if (node.viewHeight > 0 && (node.paddingTop > 0 || node.paddingBottom > 0)) {
                        node.css('height', formatPX(node.viewHeight + node.paddingTop + node.paddingBottom));
                    }
                    if ((node.isSet('styleMap', 'width') && !node.isSet('styleMap', 'height')) || (!node.isSet('styleMap', 'width') && node.isSet('styleMap', 'height'))) {
                        node.android('adjustViewBounds', 'true');
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
                    node.android('scrollbars', AXIS_ANDROID.VERTICAL);
                    node.android('inputType', 'textMultiLine');
                    if (node.overflowX) {
                        node.android('scrollHorizontally', 'true');
                    }
                    break;
                case 'INPUT':
                    switch (element.type) {
                        case 'radio':
                            if (!recursive) {
                                const result = parent.children.filter(item => item.element.type === 'radio' && item.element.name === element.name);
                                let xml = '';
                                if (result.length > 1) {
                                    const group = this.createGroup(node, sortAsc(result, 'linear.left'), parent);
                                    group.setNodeId(NODE_ANDROID.RADIO_GROUP);
                                    group.render(parent);
                                    let checked = '';
                                    for (const item of result) {
                                        if (item.element.checked) {
                                            checked = item.stringId;
                                        }
                                        xml += this.renderNode(item, group, NODE_STANDARD.RADIO, true);
                                    }
                                    group.android('orientation', NodeList.linearX(group.children) ? AXIS_ANDROID.HORIZONTAL : AXIS_ANDROID.VERTICAL);
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
                    break;
            }
            switch (node.nodeName) {
                case NODE_ANDROID.TEXT:
                    if (node.overflow !== 0 /* NONE */) {
                        const scrollbars = [];
                        if (node.overflowX) {
                            scrollbars.push(AXIS_ANDROID.HORIZONTAL);
                        }
                        if (node.overflowY) {
                            scrollbars.push(AXIS_ANDROID.VERTICAL);
                        }
                        node.android('scrollbars', scrollbars.join('|'));
                    }
                    if (node.multiLine && parent.viewWidth === 0) {
                        node.android('singleLine', 'true');
                    }
                    break;
                case NODE_ANDROID.LINE:
                    if (node.viewHeight === 0) {
                        node.android('layout_height', formatPX((convertInt(node.css('borderWidth')) || 1) + 1));
                    }
                    break;
            }
            node.cascade().forEach(item => item.hide());
            node.render((target ? node : parent));
            if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.ACCESSIBILITY)) {
                node.setAccessibility();
            }
            return this.getEnclosingTag((target || parent.isSet('dataset', 'target') || (node.renderDepth === 0 && !node.documentRoot) ? -1 : node.renderDepth), node.nodeName, node.id);
        }
        renderNodeStatic(tagName, depth, options = {}, width = '', height = '', node, children) {
            if (node == null) {
                node = new View(0, SETTINGS.targetAPI);
            }
            const renderDepth = Math.max(0, depth);
            const viewName = (typeof tagName === 'number' ? View.getNodeName(tagName) : tagName);
            tagName = (node.hasElement ? node.tagName : viewName);
            switch (viewName) {
                case 'include':
                case 'merge':
                case 'menu':
                    break;
                default:
                    node.setNodeId(viewName);
            }
            if (hasValue(width)) {
                if (!isNaN(parseInt(width))) {
                    width = delimitDimen(tagName, 'width', width);
                }
                node.android('layout_width', width);
            }
            if (hasValue(height)) {
                if (!isNaN(parseInt(height))) {
                    height = delimitDimen(tagName, 'height', height);
                }
                node.android('layout_height', height);
            }
            node.renderDepth = renderDepth;
            if (options != null) {
                node.apply(formatResource(options));
            }
            let output = this.getEnclosingTag((depth === 0 && !node.documentRoot ? -1 : depth), viewName, node.id, (children ? `{:${node.id}}` : ''));
            if (SETTINGS.showAttributes && node.id === 0) {
                const indent = repeat(renderDepth + 1);
                const attrs = node.combine().map(value => `\n${indent + value}`).join('');
                output = output.replace(`{@${node.id}}`, attrs);
            }
            options.stringId = node.stringId;
            return output;
        }
        renderInclude(node, parent, name) {
            this.merge[name] = (node.dataset.includeMerge === 'true');
            node.documentRoot = !this.merge[name];
            return this.renderNodeStatic('include', parent.renderDepth + 1, { layout: `@layout/${name}` });
        }
        renderIncludeContent(name, content) {
            let xml = content.join('');
            if (this.merge[name]) {
                const node = new View(0, 0);
                node.documentRoot = true;
                xml = this.renderNodeStatic('merge', 0, {}, '', '', node, true).replace('{:0}', xml);
            }
            return xml;
        }
        getIncludeRenderDepth(name) {
            return (this.merge[name] ? 0 : -1);
        }
        createGroup(node, children, parent, element) {
            const group = new ViewGroup(this.cache.nextId, node, parent, children, element);
            for (const item of children) {
                item.parent = group;
                item.inherit(group, 'data');
            }
            if (parent != null) {
                parent.children = parent.children.filter((item) => !children.includes(item));
                parent.children.push(group);
            }
            this.cache.append(group);
            if (element != null) {
                node.hide();
            }
            else {
                group.setBounds();
            }
            return group;
        }
        setAttributes(data) {
            const cache = data.cache.visible.list.map(node => ({ pattern: `{@${node.id}}`, attributes: this.parseAttributes(node) }));
            [...data.views, ...data.includes].forEach(value => {
                cache.forEach(item => value.content = value.content.replace(item.pattern, item.attributes));
                value.content = value.content.replace(`{#0}`, this.getRootNamespace(value.content));
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
                node.mergeBoxSpacing();
                if (SETTINGS.dimensResourceValue) {
                    const tagName = node.tagName.toLowerCase();
                    if (groups[tagName] == null) {
                        groups[tagName] = {};
                    }
                    for (const key of Object.keys(BOX_STANDARD)) {
                        const result = node.boxValue(parseInt(key));
                        if (result[0] !== '' && result[1] !== '0px') {
                            const name = `${BOX_STANDARD[key].toLowerCase()},${result[0]},${result[1]}`;
                            addToGroup(tagName, node, name);
                        }
                    }
                    ['android:layout_width:width',
                        'android:layout_height:height',
                        'android:minWidth:minwidth',
                        'android:minHeight:minheight',
                        'app:layout_constraintWidth_min:constraintwidth_min',
                        'app:layout_constraintHeight_min:constraintheight_min'].forEach(value => {
                        const [obj, attr, dimen] = value.split(':');
                        addToGroup(tagName, node, dimen, attr, node[obj](attr));
                    });
                }
            }
            if (SETTINGS.dimensResourceValue) {
                const resource = Resource.STORED.DIMENS;
                for (const tagName in groups) {
                    const group = groups[tagName];
                    for (const name in group) {
                        const [dimen, attr, value] = name.split(',');
                        const key = this.getDimenResourceKey(resource, `${tagName}_${parseRTL(dimen)}`, value);
                        group[name].forEach(node => node[(attr.indexOf('constraint') !== -1 ? 'app' : 'android')](attr, `@dimen/${key}`));
                        resource.set(key, value);
                    }
                }
            }
        }
        parseDimensions(content) {
            const resource = Resource.STORED.DIMENS;
            const pattern = /\s+\w+:\w+="({%(\w+),(\w+),(-?\w+)})"/g;
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
            if (node.dir === 'rtl') {
                switch (node.nodeName) {
                    case NODE_ANDROID.CHECKBOX:
                    case NODE_ANDROID.RADIO:
                        node.android('layoutDirection', 'rtl');
                        break;
                    default:
                        if (node.renderChildren.length === 0) {
                            node.android('textDirection', 'rtl');
                        }
                }
            }
            for (const name in node.dataset) {
                if (/^attr[A-Z]+/.test(name)) {
                    const obj = capitalize(name.substring(4), false);
                    node.dataset[name].split(';').forEach(values => {
                        const [key, value] = values.split('::');
                        if (hasValue(key) && hasValue(value)) {
                            node.add(obj, key, value);
                        }
                    });
                }
            }
            const indent = repeat(node.renderDepth + 1);
            const output = node.combine().map((value) => `\n${indent + value}`).join('');
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
        partitionChain(parent, node, nodes, orientation) {
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
                const sameXY = sortAsc(nodes.list.filter(item => same(node, item, value)), coordinate[0]);
                if (sameXY.length > 1) {
                    if (orientation === AXIS_ANDROID.HORIZONTAL && convertInt(parent.css('columnCount')) === sameXY.length) {
                        const marginLeft = convertInt(parent.css('columnGap'));
                        if (marginLeft > 0) {
                            for (let i = 1; i < sameXY.length; i++) {
                                sameXY[i].android(`layout_${parseRTL('marginLeft')}`, formatPX(sameXY[i].marginLeft + marginLeft));
                            }
                        }
                        return sameXY;
                    }
                    else if (!sameXY.some(item => item.floating) && sameXY[0].app(mapParent[0]) === 'parent' && sameXY[sameXY.length - 1].app(mapParent[1]) === 'parent') {
                        return sameXY;
                    }
                    else {
                        const chained = new Set([node]);
                        let valid;
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
            }).reduce((a, b) => a.length >= b.length ? a : b);
            return result;
        }
        addGuideline(node, parent, orientation = '', percent, opposite) {
            const map = MAP_LAYOUT.constraint;
            if (node.pageflow) {
                if (opposite == null) {
                    opposite = (node.float === 'right' || (node.left == null && node.right != null) || (node.is(NODE_STANDARD.TEXT) && node.css('textAlign') === 'right') || node.app(MAP_LAYOUT.constraint['right']) === 'parent');
                }
                if (percent == null && opposite === true) {
                    percent = true;
                }
            }
            if (node.dataset.constraintPercent != null) {
                percent = (node.dataset.constraintPercent === 'true');
            }
            const beginPercent = `layout_constraintGuide_${(percent ? 'percent' : 'begin')}`;
            [AXIS_ANDROID.HORIZONTAL, AXIS_ANDROID.VERTICAL].forEach((value, index) => {
                if (!node.constraint[value] && (orientation === '' || value === orientation)) {
                    let LT = '';
                    let RB = '';
                    let LTRB = '';
                    let RBLT = '';
                    switch (index) {
                        case 0:
                            LT = (!opposite ? 'left' : 'right');
                            RB = (!opposite ? 'right' : 'left');
                            LTRB = (!opposite ? 'leftRight' : 'rightLeft');
                            RBLT = (!opposite ? 'rightLeft' : 'leftRight');
                            break;
                        case 1:
                            LT = (!opposite ? 'top' : 'bottom');
                            RB = (!opposite ? 'bottom' : 'top');
                            LTRB = (!opposite ? 'topBottom' : 'bottomTop');
                            RBLT = (!opposite ? 'bottomTop' : 'topBottom');
                            break;
                    }
                    const dimension = 'bounds';
                    let bounds = node[dimension];
                    const previousSibling = node.previousSibling;
                    if (index === 0 && !opposite && previousSibling != null) {
                        if (previousSibling.float === 'left' && !['left', 'both'].includes(previousSibling.css('clear')) && !['left', 'both'].includes(node.css('clear')) && node.linear.left < previousSibling.linear.right) {
                            const firstChild = node.firstChild;
                            if (firstChild && firstChild.linear.left >= previousSibling.linear.right) {
                                bounds = firstChild[dimension];
                            }
                        }
                    }
                    const position = (percent ? Math.abs(bounds[LT] - (parent.documentBody ? 0 : parent.box[LT])) / parent.box[(index === 0 ? 'width' : 'height')] : 0);
                    let found = false;
                    if (!percent) {
                        found = parent.renderChildren.some(item => {
                            if (item.constraint[value] && !item.constraint[`chain${capitalize(value)}`]) {
                                if (withinFraction(node.linear[LT], item.linear[RB])) {
                                    node.anchor(map[LTRB], item.stringId, value, true);
                                    return true;
                                }
                                else if (withinFraction(node.linear[RB], item.linear[LT])) {
                                    node.anchor(map[RBLT], item.stringId, value, true);
                                    return true;
                                }
                                else if (withinFraction(node.linear[LT], item.linear[LT])) {
                                    node.anchor(map[LT], item.stringId, value, true);
                                    return true;
                                }
                                else if (withinFraction(node.linear[RB], item.linear[RB])) {
                                    node.anchor(map[RB], item.stringId, value, true);
                                    return true;
                                }
                            }
                            return false;
                        });
                    }
                    if (!found) {
                        const guideline = parent.constraint.guideline;
                        const options = {
                            android: {
                                orientation: (index === 0 ? AXIS_ANDROID.VERTICAL : AXIS_ANDROID.HORIZONTAL)
                            },
                            app: {
                                [beginPercent]: (percent ? parseFloat(Math.abs(position - (!opposite ? 0 : 1)).toFixed(SETTINGS.constraintPercentAccuracy))
                                    : delimitDimen(node.tagName, 'constraintguide_begin', formatPX((opposite ? node[dimension][LT] - parent.box[RB] : bounds[LT] - (parent.documentBody ? 0 : parent.box[LT])))))
                            }
                        };
                        const anchors = optional(guideline, `${value}.${beginPercent}.${LT}`, 'object');
                        if (anchors != null) {
                            for (const stringId in anchors) {
                                if (options.app[beginPercent] === anchors[stringId]) {
                                    node.anchor(map[LT], stringId, value, true);
                                    node.delete('app', map[RB]);
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (!found) {
                            const xml = this.renderNodeStatic(NODE_ANDROID.GUIDELINE, node.renderDepth, options, 'wrap_content', 'wrap_content');
                            const stringId = options.stringId;
                            this.appendAfter(node.id, xml);
                            node.anchor(map[LT], stringId, value, true);
                            node.delete('app', map[RB]);
                            if (guideline[value] == null) {
                                guideline[value] = {};
                            }
                            if (guideline[value][beginPercent] == null) {
                                guideline[value][beginPercent] = {};
                            }
                            if (guideline[value][beginPercent][LT] == null) {
                                guideline[value][beginPercent][LT] = {};
                            }
                            guideline[value][beginPercent][LT][stringId] = options.app[beginPercent];
                        }
                    }
                }
            });
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
    }

    class File {
        constructor(directory, processingTime, compression) {
            this.directory = directory;
            this.processingTime = processingTime;
            this.appName = '';
            this.queue = [];
            this.compression = 'zip';
            if (compression) {
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
            if (files && files.length > 0) {
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
                xml = replaceTab(xml, SETTINGS.insertSpaces, true);
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

    class Custom extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
            this.require(EXT_NAME.EXTERNAL, true);
        }
        processNode() {
            const node = this.node;
            const parent = this.parent;
            const data = this.getData();
            let xml = '';
            if (data.tag) {
                if (node.children.length > 0) {
                    xml = this.application.controllerHandler.renderGroup(node, parent, data.tag);
                }
                else {
                    xml = this.application.controllerHandler.renderNode(node, parent, data.tag);
                }
                node.nodeType = (BLOCK_ELEMENT.includes(node.element.tagName) ? NODE_STANDARD.BLOCK : NODE_STANDARD.INLINE);
            }
            if (data.tagChild) {
                node.each(item => {
                    item.element.dataset.ext = this.name;
                    item.element.dataset.andromeCustomTag = data.tagChild;
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
                (this.node.children.some(node => node.display === 'list-item' && node.css('listStyleType') !== 'none') && (NodeList.linearX(this.node.children) || NodeList.linearY(this.node.children))));
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
                if (item.display === 'list-item') {
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
                            if (node.element.tagName === 'OL') {
                                ordinal = `${(listStyle === 'decimal-leading-zero' && j < 9 ? '0' : '') + (j + 1).toString()}.`;
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
            const parent = this.parent;
            const controller = this.application.controllerHandler;
            const listStyle = node.data(`${EXT_NAME.LIST}:listStyle`);
            if (listStyle != null) {
                controller.prependBefore(node.id, controller.renderNodeStatic((listStyle !== '0' ? NODE_STANDARD.TEXT : NODE_STANDARD.SPACE), parent.renderDepth + 1, {
                    android: {
                        gravity: parseRTL('right'),
                        layout_columnWeight: '0',
                        layout_marginTop: (node.marginTop > 0 ? delimitDimen(node.tagName, parseRTL('margin_top'), formatPX(node.marginTop)) : null),
                        [parseRTL('layout_marginRight')]: delimitDimen(node.tagName, parseRTL('margin_right'), '8px'),
                        [parseRTL('layout_marginLeft')]: (node.marginLeft > 0 ? delimitDimen(node.tagName, parseRTL('margin_left'), formatPX(node.marginLeft)) : null),
                        text: (listStyle !== '0' ? listStyle : '')
                    }
                }, 'wrap_content', 'wrap_content'));
                node.android('layout_columnWeight', '1');
                if (node.viewWidth === 0) {
                    node.android('layout_width', 'wrap_content');
                }
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
                (!hasValue(node.dataset.ext) && !node.flex.enabled && node.children.length > 1 && BLOCK_ELEMENT.includes(node.children[0].tagName) && node.children.some(item => item.children.length > 1) && node.children.every(item => !item.flex.enabled && node.children[0].element.tagName === item.element.tagName && NodeList.linearX(item.children))));
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
                            if (index > 0 && nextX.float === 'right') {
                                const style = nextX.element.style;
                                style.cssFloat = 'left';
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
                                style.cssFloat = 'right';
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
                                if (columns[current] != null) {
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
            const gridData = parent.data(`${EXT_NAME.GRID}:gridData`);
            const gridCellData = node.data(`${EXT_NAME.GRID}:gridCellData`);
            let xml = '';
            if (gridData != null && gridCellData != null) {
                let siblings;
                if (this.options.balanceColumns) {
                    siblings = node.data(`${EXT_NAME.GRID}:gridSiblings`);
                }
                else {
                    const columnEnd = gridData.columnEnd[Math.min(gridCellData.index + (gridCellData.columnSpan - 1), gridData.columnEnd.length - 1)];
                    siblings = node.documentParent.children.filter(item => !item.rendered && item.linear.left >= node.linear.right && item.linear.right <= columnEnd);
                }
                if (siblings && siblings.length > 0) {
                    siblings.unshift(node);
                    const group = this.application.controllerHandler.createGroup(node, siblings, parent);
                    const [linearX, linearY] = [NodeList.linearX(siblings), NodeList.linearY(siblings)];
                    if (linearX || linearY) {
                        xml = this.application.writeLinearLayout(group, parent, linearX);
                        this.application.sortLayout(group, group.children, true);
                    }
                    else {
                        xml = this.application.writeConstraintLayout(group, parent);
                    }
                    return { xml, parent: group };
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
            this.application.cache.each((node) => {
                if (node.renderExtension === this) {
                    extended.push(node);
                }
                else {
                    const parent = node.renderParent;
                    if (parent.is(NODE_STANDARD.GRID)) {
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
                                        controller.appendAfter(node.id, controller.renderNodeStatic(NODE_STANDARD.SPACE, node.renderDepth, { android: { layout_columnSpan: gridData.columnCount } }, 'match_parent', formatPX(heightBottom)));
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
            for (const node of extended) {
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
            }
        }
    }

    class Table extends Extension {
        constructor(name, tagNames, options) {
            super(name, tagNames, options);
        }
        processNode() {
            const node = this.node;
            const tableRows = [];
            const thead = node.children.find(item => item.element.tagName === 'THEAD');
            const tbody = node.children.find(item => item.element.tagName === 'TBODY');
            const tfoot = node.children.find(item => item.element.tagName === 'TFOOT');
            if (thead != null) {
                thead.cascade().filter(item => item.element.tagName === 'TH' || item.element.tagName === 'TD').forEach(item => item.inherit(thead, 'styleMap'));
                tableRows.push(...thead.children);
                thead.hide();
            }
            if (tbody != null) {
                tableRows.push(...tbody.children);
                tbody.hide();
            }
            if (tfoot != null) {
                tfoot.cascade().filter(item => item.element.tagName === 'TH' || item.element.tagName === 'TD').forEach(item => item.inherit(tfoot, 'styleMap'));
                tableRows.push(...tfoot.children);
                tfoot.hide();
            }
            const rowCount = tableRows.length;
            let columnCount = 0;
            const [width, height] = (node.css('borderCollapse') === 'collapse' ? ['0px', '0px'] : node.css('borderSpacing').split(' '));
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
                    delete td.styleMap.margin;
                    td.styleMap.marginTop = height;
                    td.styleMap.marginRight = width;
                    td.styleMap.marginBottom = height;
                    td.styleMap.marginLeft = width;
                    td.parent = node;
                }
            }
            const caption = node.children.find(item => item.element.tagName === 'CAPTION');
            if (caption != null) {
                if (caption.styleMap.textAlign == null) {
                    caption.styleMap.textAlign = 'center';
                }
                caption.data(`${EXT_NAME.TABLE}:columnSpan`, columnCount);
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
            if (rowSpan > 1) {
                node.android('layout_rowSpan', rowSpan.toString());
            }
            if (columnSpan > 1) {
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
                setCache(element, 'nodeIsolated', (position !== 'static' && position !== 'initial'));
            }
            return false;
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
            if (includesEnum(node.excludeProcedure, NODE_PROCEDURE.ACCESSIBILITY)) {
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
                            setCache(item, 'andromeExternalDisplay', 'none');
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
                    const display = getCache(item, 'andromeExternalDisplay');
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
        condition() {
            return this.included();
        }
        processNode() {
            const node = this.node;
            node.documentRoot = true;
            const xml = this.application.controllerHandler.renderNodeStatic(VIEW_NAVIGATION.MENU, 0, {}, '', '', node, true);
            node.rendered = true;
            node.cascade().forEach(item => item.renderExtension = this);
            node.nodeType = NODE_STANDARD.BLOCK;
            node.excludeResource |= NODE_RESOURCE.ALL;
            return { xml };
        }
        processChild() {
            const node = this.node;
            const parent = this.parent;
            const element = node.element;
            if (element.nodeName === '#text') {
                node.hide();
                return { xml: '', proceed: true };
            }
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
                                if (item.textContent && item.textContent.trim() !== '') {
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
                    node.each(item => item.element.tagName !== 'NAV' && item.hide());
                }
                else if (node.element.tagName === 'NAV') {
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
                        let src = ResourceView.addImageURL(element.style.backgroundImage, DRAWABLE_PREFIX.MENU);
                        if (src !== '') {
                            options.android.icon = `@drawable/${src}`;
                        }
                        else {
                            const image = node.children.find(item => item.element.tagName === 'IMG');
                            if (image != null) {
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
            if (node.android('title') == null) {
                if (title !== '') {
                    const name = ResourceView.addString(title);
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
            const xml = this.application.controllerHandler.renderNodeStatic(nodeName, parent.renderDepth + 1, options, '', '', node, layout);
            node.rendered = true;
            node.excludeResource |= NODE_RESOURCE.ALL;
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
            const controller = this.application.controllerHandler;
            const node = this.node;
            const xml = controller.renderGroup(node, this.parent, VIEW_SUPPORT.COORDINATOR);
            node.apply(this.options[node.element.id]);
            node.nodeType = NODE_STANDARD.BLOCK;
            node.excludeResource |= NODE_RESOURCE.ASSET;
            if (node.children.filter(item => !item.isolated).length > 0) {
                const toolbar = this.getToolbar(node);
                if (toolbar != null) {
                    const extension = this.application.findExtension(WIDGET_NAME.TOOLBAR);
                    if (extension != null) {
                        const collapsingToolbar = (extension.options[toolbar.element.id] != null ? extension.options[toolbar.element.id].collapsingToolbar : null);
                        if (collapsingToolbar != null) {
                            node.android('fitsSystemWindows', 'true');
                        }
                    }
                }
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
            return getNode(toolbar);
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
                if (hasValue(element.dataset.target)) {
                    const target = document.getElementById(element.dataset.target);
                    if (target != null && element.parentElement !== target && !includes(optional(target, 'dataset.ext'), WIDGET_NAME.COORDINATOR)) {
                        this.application.elements.add(element);
                    }
                }
                if (includes(optional(element, 'parentElement.dataset.ext'), WIDGET_NAME.COORDINATOR)) {
                    setCache(element, 'nodeIsolated', true);
                }
            }
            return false;
        }
        processNode() {
            const application = this.application;
            const controller = application.controllerHandler;
            const node = this.node;
            const target = node.isSet('dataset', 'target');
            const options = Object.assign({}, this.options[node.element.id]);
            const optionsToolbar = Object.assign({}, options.toolbar);
            const optionsAppBar = Object.assign({}, options.appBar);
            const optionsCollapsingToolbar = Object.assign({}, options.collapsingToolbar);
            const appBarChildren = [];
            const collapsingToolbarChildren = [];
            const hasMenu = (findNestedExtension(node, WIDGET_NAME.MENU) != null);
            const backgroundImage = node.css('backgroundImage');
            let depth = (target ? 0 : node.depth);
            let children = node.children.filter(item => !item.isolated).length;
            Array.from(node.element.children).forEach((element) => {
                if (element.tagName === 'IMG') {
                    if (element.dataset.navigationIcon != null) {
                        const result = ResourceView.addImageSrcSet(element, DRAWABLE_PREFIX.MENU);
                        if (result !== '') {
                            overwriteDefault(toolbar, 'app', 'navigationIcon', `@drawable/${result}`);
                            if (getStyle(element).display !== 'none') {
                                children--;
                            }
                        }
                    }
                    if (element.dataset.collapseIcon != null) {
                        const result = ResourceView.addImageSrcSet(element, DRAWABLE_PREFIX.MENU);
                        if (result !== '') {
                            overwriteDefault(toolbar, 'app', 'collapseIcon', `@drawable/${result}`);
                            if (getStyle(element).display !== 'none') {
                                children--;
                            }
                        }
                    }
                }
                if (!hasValue(element.dataset.target)) {
                    const targetNode = getNode(element);
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
                overwriteDefault(appBar ? optionsAppBar : optionsToolbar, 'android', 'fitsSystemWindows', 'true');
                overwriteDefault(optionsToolbar, 'app', 'popupTheme', '@style/ThemeOverlay.AppCompat.Light');
                if (backgroundImage !== 'none') {
                    overwriteDefault(appBarChildren.length > 0 ? optionsAppBar : optionsToolbar, 'android', 'background', `@drawable/${ResourceView.addImageURL(backgroundImage)}`);
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
            const renderDepth = depth + (appBar ? 1 : 0) + (collapsingToolbar ? 1 : 0);
            let xml = controller.renderNodeStatic(VIEW_SUPPORT.TOOLBAR, renderDepth, optionsToolbar, 'match_parent', 'wrap_content', node, (children > 0));
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
                    overwriteDefault(optionsBackgroundImage, 'android', 'src', `@drawable/${ResourceView.addImageURL(backgroundImage)}`);
                    overwriteDefault(optionsBackgroundImage, 'android', 'scaleType', scaleType);
                    overwriteDefault(optionsBackgroundImage, 'android', 'fitsSystemWindows', 'true');
                    overwriteDefault(optionsBackgroundImage, 'app', 'layout_collapseMode', 'parallax');
                    xml = controller.renderNodeStatic(NODE_ANDROID.IMAGE, renderDepth, optionsBackgroundImage, 'match_parent', 'match_parent') + xml;
                    node.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
                }
            }
            let outer = '';
            let appBarNode = null;
            let collapsingToolbarNode = null;
            if (appBar) {
                overwriteDefault(optionsAppBar, 'android', 'id', `${node.stringId}_appbar`);
                overwriteDefault(optionsAppBar, 'android', 'layout_height', (node.viewHeight > 0 ? delimitDimen('appbar', 'height', formatPX(node.viewHeight)) : 'wrap_content'));
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
                appBarNode.nodeId = stripId(optionsAppBar.android.id);
                appBarNode.each(item => item.dataset.target = appBarNode.nodeId);
                application.cache.append(appBarNode);
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
                    collapsingToolbarNode.each(item => item.dataset.target = collapsingToolbarNode.nodeId);
                    application.cache.append(collapsingToolbarNode);
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
                node.renderDepth = renderDepth;
            }
            node.nodeType = NODE_STANDARD.BLOCK;
            node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
            return { xml };
        }
        processChild() {
            const node = this.node;
            if (node.element.tagName === 'IMG' && (node.dataset.navigationIcon != null || node.dataset.collapseIcon != null)) {
                node.hide();
                return { xml: '', proceed: true };
            }
            return { xml: '' };
        }
        beforeInsert() {
            const node = this.node;
            const menu = optional(findNestedExtension(node, WIDGET_NAME.MENU), 'dataset.viewName');
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
            node.cascade().forEach(item => item.renderExtension = this);
            node.render(parent);
            node.nodeType = NODE_STANDARD.BLOCK;
            node.excludeResource |= NODE_RESOURCE.ASSET;
            this.createResourceTheme();
            return { xml };
        }
        beforeInsert() {
            const node = this.node;
            const menu = optional(findNestedExtension(node, WIDGET_NAME.MENU), 'dataset.viewName');
            if (menu !== '') {
                const options = Object.assign({}, this.options[node.element.id]);
                overwriteDefault(options, 'app', 'menu', `@menu/${menu}`);
                node.app('menu', options.app.menu);
            }
        }
        afterInsert() {
            const node = this.node;
            if (node.renderParent.viewHeight === 0) {
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
            const application = this.application;
            const controller = application.controllerHandler;
            const node = this.node;
            node.documentRoot = true;
            const options = Object.assign({}, this.options.drawer);
            if (findNestedExtension(node, WIDGET_NAME.MENU) != null) {
                overwriteDefault(options, 'android', 'fitsSystemWindows', 'true');
                this.createResourceTheme();
            }
            else {
                const optionsNavigation = Object.assign({}, this.options.navigation);
                overwriteDefault(optionsNavigation, 'android', 'layout_gravity', parseRTL('left'));
                const navView = node.children[node.children.length - 1];
                navView.android('layout_gravity', optionsNavigation.android.layout_gravity);
                navView.android('layout_height', 'match_parent');
                navView.isolated = true;
            }
            const xml = controller.renderNodeStatic(VIEW_SUPPORT.DRAWER, node.depth, options, 'match_parent', 'match_parent', node, true);
            node.rendered = true;
            node.nodeType = NODE_STANDARD.BLOCK;
            node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
            return { xml };
        }
        beforeInsert() {
            const application = this.application;
            const node = this.node;
            if (application.insert[node.nodeId] != null) {
                const target = application.cacheInternal.locate(item => item.isolated && item.parent === node.parent && item.nodeName === VIEW_SUPPORT.COORDINATOR);
                if (target != null) {
                    application.insert[target.nodeId] = application.insert[node.nodeId];
                    delete application.insert[node.nodeId];
                }
            }
            const menu = optional(findNestedExtension(node, WIDGET_NAME.MENU), 'dataset.viewName');
            const headerLayout = optional(findNestedExtension(node, EXT_NAME.EXTERNAL), 'dataset.viewName');
            const options = Object.assign({}, this.options.navigation);
            if (menu !== '') {
                overwriteDefault(options, 'app', 'menu', `@menu/${menu}`);
            }
            if (headerLayout !== '') {
                overwriteDefault(options, 'app', 'headerLayout', `@layout/${headerLayout}`);
            }
            if (menu !== '' || headerLayout !== '') {
                overwriteDefault(options, 'android', 'id', `${node.stringId}_view`);
                overwriteDefault(options, 'android', 'fitsSystemWindows', 'true');
                overwriteDefault(options, 'android', 'layout_gravity', parseRTL('left'));
                const xml = application.controllerHandler.renderNodeStatic(VIEW_SUPPORT.NAVIGATION_VIEW, node.depth + 1, options, 'wrap_content', 'match_parent');
                application.addInsertQueue(node.id.toString(), [xml]);
            }
        }
        afterInsert() {
            const headerLayout = findNestedExtension(this.node, EXT_NAME.EXTERNAL);
            if (headerLayout != null) {
                const node = getNode(headerLayout);
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
    const EXTENSIONS = {
        [EXT_NAME.EXTERNAL]: new External(EXT_NAME.EXTERNAL),
        [EXT_NAME.CUSTOM]: new CustomAndroid(EXT_NAME.CUSTOM),
        [EXT_NAME.LIST]: new ListAndroid(EXT_NAME.LIST, ['UL', 'OL', 'DIV']),
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
        const extensions = new Set();
        for (let name of SETTINGS.builtInExtensions) {
            name = name.toLowerCase().trim();
            for (const extension in EXTENSIONS) {
                if (name === extension || extension.startsWith(`${name}.`)) {
                    extensions.add(EXTENSIONS[extension]);
                }
            }
        }
        for (const extension of extensions) {
            main.registerExtension(extension);
        }
    })();
    function parseDocument(...elements) {
        if (main.closed) {
            return;
        }
        LOADING = false;
        main.setStyleMap();
        main.elements.clear();
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
        let __THEN;
        function parseResume() {
            LOADING = false;
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
        const images = Array.from(main.elements).map(element => Array.from(element.querySelectorAll('IMG'))).reduce((a, b) => a.concat(b), []).filter(element => !element.complete);
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
                .then(() => parseResume())
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
