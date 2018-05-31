(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.android = {})));
}(this, (function (exports) { 'use strict';

    const WIDGET_ANDROID =
    {
        FRAME: 'FrameLayout',
        LINEAR: 'LinearLayout',
        CONSTRAINT: 'android.support.constraint.ConstraintLayout',
        RELATIVE: 'RelativeLayout',
        GRID: 'GridLayout',
        SCROLL_VERTICAL: 'ScrollView',
        SCROLL_HORIZONTAL: 'HorizontalScrollView',
        SCROLL_NESTED: 'NestedScrollView',
        RADIO_GROUP: 'RadioGroup',
        TEXT: 'TextView',
        EDIT: 'EditText',
        IMAGE: 'ImageView',
        SPINNER: 'Spinner',
        CHECKBOX: 'CheckBox',
        RADIO: 'RadioButton',
        BUTTON: 'Button',
        VIEW: 'View',
        SPACE: 'Space'
    };

    const FIXED_ANDROID =
    [
        WIDGET_ANDROID.EDIT,
        WIDGET_ANDROID.SPINNER,
        WIDGET_ANDROID.CHECKBOX,
        WIDGET_ANDROID.RADIO,
        WIDGET_ANDROID.BUTTON
    ];

    const MAPPING_CHROME =
    {
        'TEXT': WIDGET_ANDROID.TEXT,
        'LABEL': WIDGET_ANDROID.TEXT,
        'P': WIDGET_ANDROID.TEXT,
        'HR': WIDGET_ANDROID.VIEW,
        'IMG': WIDGET_ANDROID.IMAGE,
        'SELECT': WIDGET_ANDROID.SPINNER,
        'INPUT' : {
            'text': WIDGET_ANDROID.EDIT,
            'password': WIDGET_ANDROID.EDIT,
            'checkbox': WIDGET_ANDROID.CHECKBOX,
            'radio': WIDGET_ANDROID.RADIO,
            'button': WIDGET_ANDROID.BUTTON,
            'submit': WIDGET_ANDROID.BUTTON
        },
        'BUTTON': WIDGET_ANDROID.BUTTON,
        'TEXTAREA': WIDGET_ANDROID.EDIT
    };

    const BLOCK_CHROME =
    [
        'DIV',
        'LI',
        'TD',
        'SECTION',
        'SPAN'
    ];

    const INLINE_CHROME =
    [
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

    const INHERIT_ANDROID =
    {
        'TextView': {
            'fontFamily': 'android:fontFamily="{0}"',
            'fontSize': 'android:textSize="{0}"',
            'fontWeight': 'android:fontWeight="{0}"',
            'fontStyle': 'android:textStyle="{0}"',
            'color': 'android:textColor="{0}"'
        }
    };

    const DENSITY_ANDROID =
    {
        LDPI: 120,
        MDPI: 160,
        HDPI: 240,
        XHDPI: 320,
        XXHDPI: 480,
        XXXHDPI: 640
    };

    const BUILD_ANDROID =
    {
        OREO_1: 27,
        OREO: 26,
        NOUGAT_1: 25,
        NOUGAT: 24,
        MARSHMALLOW: 23,
        LOLLIPOP_1: 22,
        LOLLIPOP: 21,
        KITKAT_1: 20,
        KITKAT: 19,
        JELLYBEAN_2: 18,   
        JELLYBEAN_1: 17,
        JELLYBEAN: 16,
        ICE_CREAM_SANDWICH_1: 15,
        ICE_CREAM_SANDWICH: 14,
        HONEYCOMB_2: 13,
        HONEYCOMB_1: 12,
        HONEYCOMB: 11
    };

    BUILD_ANDROID.LATEST = BUILD_ANDROID.OREO_1;

    const API_ANDROID = {
        [BUILD_ANDROID.OREO]: {
            android: ['fontWeight'],
            customizations: {}
        },
        [BUILD_ANDROID.JELLYBEAN_1]: {
            android: ['labelFor'],
            customizations: {}
        },
        [BUILD_ANDROID.LOLLIPOP]: {
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

    const STRING_ANDROID =
    {
        XML_DECLARATION: '<?xml version="1.0" encoding="utf-8"?>'
    };

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
        }
        while (true)
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

    function convertToPX(value, unit = true) {
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

    function convertToDP(value, dpi = 160, unit = true, font = false) {
        if (hasValue(value)) {
            value = convertToPX(value, false);
            value = value / (dpi / 160);
            value = parseFloat(value.toFixed(2));
            if (!isNaN(value)) {
                return value + (unit ? (font ? 'sp' : 'dp') : 0);
            }
        }
        return (unit ? '0dp' : 0);
    }

    function convertToSP(value, dpi, unit = true) {
        return convertToDP(value, dpi, unit, true);
    }

    function insetToDP(xml, dpi, font = false) {
        return xml.replace(/("|>)([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + convertToDP(capture[1], dpi, true, font) + capture[2]);
    }

    function convertToInt(value) {
        return parseInt(value) || 0;
    }

    function search(obj, value) {
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

    function indexOf(value, ...terms) {
        for (const term of terms) {
            const index = value.indexOf(term);
            if (index != -1) {
                return index;
            }
        }
        return -1;
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
            return [convertToInt(current1), convertToInt(current2)];
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
        return parseFloat(start == 0 ? 0 : (end == 0 ? 1 : (start / (start + end)).toFixed(2)));
    }

    function hasValue(value) {
        return (typeof value !== 'undefined' && value !== null && value !== '');
    }

    function withinRange(a, b, n = 1) {
        return (b >= (a - n) && b <= (a + n));
    }

    function withinFraction(left, right) {
        return (left == right || Math.ceil(left) == Math.floor(right));
    }

    function isNumber(value) {
        return /^[0-9.]+$/.test(value.trim());
    }

    const X11_CSS3 =
    {
        'Pink':                 { 'hex': '#FFC0CB' },
        'LightPink':            { 'hex': '#FFB6C1' },
        'HotPink':              { 'hex': '#FF69B4' },
        'DeepPink':             { 'hex': '#FF1493' },
        'PaleVioletRed':        { 'hex': '#DB7093' },
        'MediumVioletRed':      { 'hex': '#C71585' },
        'LightSalmon':          { 'hex': '#FFA07A' },
        'Salmon':               { 'hex': '#FA8072' },
        'DarkSalmon':           { 'hex': '#E9967A' },
        'LightCoral':           { 'hex': '#F08080' },
        'IndianRed':            { 'hex': '#CD5C5C' },
        'Crimson':              { 'hex': '#DC143C' },
        'Firebrick':            { 'hex': '#B22222' },
        'DarkRed':              { 'hex': '#8B0000' },
        'Red':                  { 'hex': '#FF0000' },
        'OrangeRed':            { 'hex': '#FF4500' },
        'Tomato':               { 'hex': '#FF6347' },
        'Coral':                { 'hex': '#FF7F50' },
        'Orange':               { 'hex': '#FFA500' },
        'DarkOrange':           { 'hex': '#FF8C00' },
        'Yellow':               { 'hex': '#FFFF00' },
        'LightYellow':          { 'hex': '#FFFFE0' },
        'LemonChiffon':         { 'hex': '#FFFACD' },
        'LightGoldenrodYellow': { 'hex': '#FAFAD2' },
        'PapayaWhip':           { 'hex': '#FFEFD5' },
        'Moccasin':             { 'hex': '#FFE4B5' },
        'PeachPuff':            { 'hex': '#FFDAB9' },
        'PaleGoldenrod':        { 'hex': '#EEE8AA' },
        'Khaki':                { 'hex': '#F0E68C' },
        'DarkKhaki':            { 'hex': '#BDB76B' },
        'Gold':                 { 'hex': '#FFD700' },
        'Cornsilk':             { 'hex': '#FFF8DC' },
        'BlanchedAlmond':       { 'hex': '#FFEBCD' },
        'Bisque':               { 'hex': '#FFE4C4' },
        'NavajoWhite':          { 'hex': '#FFDEAD' },
        'Wheat':                { 'hex': '#F5DEB3' },
        'Burlywood':            { 'hex': '#DEB887' },
        'Tan':                  { 'hex': '#D2B48C' },
        'RosyBrown':            { 'hex': '#BC8F8F' },
        'SandyBrown':           { 'hex': '#F4A460' },
        'Goldenrod':            { 'hex': '#DAA520' },
        'DarkGoldenrod':        { 'hex': '#B8860B' },
        'Peru':                 { 'hex': '#CD853F' },
        'Chocolate':            { 'hex': '#D2691E' },
        'SaddleBrown':          { 'hex': '#8B4513' },
        'Sienna':               { 'hex': '#A0522D' },
        'Brown':                { 'hex': '#A52A2A' },
        'Maroon':               { 'hex': '#800000' },
        'DarkOliveGreen':       { 'hex': '#556B2F' },
        'Olive':                { 'hex': '#808000' },
        'OliveDrab':            { 'hex': '#6B8E23' },
        'YellowGreen':          { 'hex': '#9ACD32' },
        'LimeGreen':            { 'hex': '#32CD32' },
        'Lime':                 { 'hex': '#00FF00' },
        'LawnGreen':            { 'hex': '#7CFC00' },
        'Chartreuse':           { 'hex': '#7FFF00' },
        'GreenYellow':          { 'hex': '#ADFF2F' },
        'SpringGreen':          { 'hex': '#00FF7F' },
        'MediumSpringGreen':    { 'hex': '#00FA9A' },
        'LightGreen':           { 'hex': '#90EE90' },
        'PaleGreen':            { 'hex': '#98FB98' },
        'DarkSeaGreen':         { 'hex': '#8FBC8F' },
        'MediumAquamarine':     { 'hex': '#66CDAA' },
        'MediumSeaGreen':       { 'hex': '#3CB371' },
        'SeaGreen':             { 'hex': '#2E8B57' },
        'ForestGreen':          { 'hex': '#228B22' },
        'Green':                { 'hex': '#008000' },
        'DarkGreen':            { 'hex': '#006400' },
        'Aqua':                 { 'hex': '#00FFFF' },
        'Cyan':                 { 'hex': '#00FFFF' },
        'LightCyan':            { 'hex': '#E0FFFF' },
        'PaleTurquoise':        { 'hex': '#AFEEEE' },
        'Aquamarine':           { 'hex': '#7FFFD4' },
        'Turquoise':            { 'hex': '#40E0D0' },
        'DarkTurquoise':        { 'hex': '#00CED1' },
        'MediumTurquoise':      { 'hex': '#48D1CC' },
        'LightSeaGreen':        { 'hex': '#20B2AA' },
        'CadetBlue':            { 'hex': '#5F9EA0' },
        'DarkCyan':             { 'hex': '#008B8B' },
        'Teal':                 { 'hex': '#008080' },
        'LightSteelBlue':       { 'hex': '#B0C4DE' },
        'PowderBlue':           { 'hex': '#B0E0E6' },
        'LightBlue':            { 'hex': '#ADD8E6' },
        'SkyBlue':              { 'hex': '#87CEEB' },
        'LightSkyBlue':         { 'hex': '#87CEFA' },
        'DeepSkyBlue':          { 'hex': '#00BFFF' },
        'DodgerBlue':           { 'hex': '#1E90FF' },
        'Cornflower':           { 'hex': '#6495ED' },
        'SteelBlue':            { 'hex': '#4682B4' },
        'RoyalBlue':            { 'hex': '#4169E1' },
        'Blue':                 { 'hex': '#0000FF' },
        'MediumBlue':           { 'hex': '#0000CD' },
        'DarkBlue':             { 'hex': '#00008B' },
        'Navy':                 { 'hex': '#000080' },
        'MidnightBlue':         { 'hex': '#191970' },
        'Lavender':             { 'hex': '#E6E6FA' },
        'Thistle':              { 'hex': '#D8BFD8' },
        'Plum':                 { 'hex': '#DDA0DD' },
        'Violet':               { 'hex': '#EE82EE' },
        'Orchid':               { 'hex': '#DA70D6' },
        'Fuchsia':              { 'hex': '#FF00FF' },
        'Magenta':              { 'hex': '#FF00FF' },
        'MediumOrchid':         { 'hex': '#BA55D3' },
        'MediumPurple':         { 'hex': '#9370DB' },
        'BlueViolet':           { 'hex': '#8A2BE2' },
        'DarkViolet':           { 'hex': '#9400D3' },
        'DarkOrchid':           { 'hex': '#9932CC' },
        'DarkMagenta':          { 'hex': '#8B008B' },
        'Purple':               { 'hex': '#800080' },
        'RebeccaPurple':        { 'hex': '#663399' },
        'Indigo':               { 'hex': '#4B0082' },
        'DarkSlateBlue':        { 'hex': '#483D8B' },
        'SlateBlue':            { 'hex': '#6A5ACD' },
        'MediumSlateBlue':      { 'hex': '#7B68EE' },
        'White':                { 'hex': '#FFFFFF' },
        'Snow':                 { 'hex': '#FFFAFA' },
        'Honeydew':             { 'hex': '#F0FFF0' },
        'MintCream':            { 'hex': '#F5FFFA' },
        'Azure':                { 'hex': '#F0FFFF' },
        'AliceBlue':            { 'hex': '#F0F8FF' },
        'GhostWhite':           { 'hex': '#F8F8FF' },
        'WhiteSmoke':           { 'hex': '#F5F5F5' },
        'Seashell':             { 'hex': '#FFF5EE' },
        'Beige':                { 'hex': '#F5F5DC' },
        'OldLace':              { 'hex': '#FDF5E6' },
        'FloralWhite':          { 'hex': '#FFFAF0' },
        'Ivory':                { 'hex': '#FFFFF0' },
        'AntiqueWhite':         { 'hex': '#FAEBD7' },
        'Linen':                { 'hex': '#FAF0E6' },
        'LavenderBlush':        { 'hex': '#FFF0F5' },
        'MistyRose':            { 'hex': '#FFE4E1' },
        'Gainsboro':            { 'hex': '#DCDCDC' },
        'LightGray':            { 'hex': '#D3D3D3' },
        'Silver':               { 'hex': '#C0C0C0' },
        'DarkGray':             { 'hex': '#A9A9A9' },
        'Gray':                 { 'hex': '#808080' },
        'DimGray':              { 'hex': '#696969' },
        'LightSlateGray':       { 'hex': '#778899' },
        'SlateGray':            { 'hex': '#708090' },
        'DarkSlateGray':        { 'hex': '#2F4F4F' },
        'Black':                { 'hex': '#000000' }
    };
        
    const HSL_SORTED = [];
    for (const i in X11_CSS3) {
        const x11 = X11_CSS3[i];
        for (const j in x11) {
            x11.rgb = convertHextoRGB(x11[j]);
            x11.hsl = convertRGBtoHSL(x11.rgb.r, x11.rgb.g, x11.rgb.b);
            HSL_SORTED.push({ name: i, hex: x11.hex, hsl: x11.hsl });
        }
    }
    HSL_SORTED.sort(sortHSL);

    function convertRGBtoHex(n) {
        const hex = '0123456789ABCDEF';
        n = parseInt(n);
        if (isNaN(n)) {
            return '00';
        }
        n = Math.max(0, Math.min(n, 255));
        return hex.charAt((n - (n % 16)) / 16) + hex.charAt(n % 16);
    }

    function convertHextoRGB(value) {
        value = value.replace('#', '').trim();
        if (value.length == 3) {
            value = value.charAt(0).repeat(2) + value.charAt(1).repeat(2) + value.charAt(2).repeat(2);
        }
        if (value.length == 6) {
            return { r: parseInt(value.substring(0, 2), 16), g: parseInt(value.substring(2, 4), 16), b: parseInt(value.substring(4), 16) };
        }
        return null;
    }

    function convertHextoHSL(value) {
        const rgb = convertHextoRGB(value);
        if (rgb != null) {
            return convertRGBtoHSL(rgb.r, rgb.g, rgb.b);
        }
        return null;
    }

    function convertRGBtoHSL(r, g, b) {
        r = parseInt(r) / 255;
        g = parseInt(g) / 255;
        b = parseInt(b) / 255;
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max == min) {
            h = 0;
            s = 0;
        }
        else {
            const d = max - min;
            s = (l > 0.5 ? d / (2 - max - min) : d / (max + min));
            switch(max) {
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
        if (c == d) {
            [c, d] = [a.hsl.s, b.hsl.s];
            if (c == d) {
                [c, d] = [a.hsl.l, b.hsl.l];
            }
        }
        return (c >= d ? 1 : -1);
    }

    function findNearestColor(value) {
        const hsl = convertHextoHSL(value);
        if (hsl) {
            const result = HSL_SORTED.slice();
            result.push({ name: '', hsl });
            result.sort(sortHSL);
            const index = result.findIndex(item => item.name == '');
            return result[Math.min(index + 1, result.length - 1)];
        }
        return null;
    }

    function getByColorName(value) {
        for (const color in X11_CSS3) {
            if (color.toLowerCase() == value.toLowerCase()) {
                return X11_CSS3[color];
            }
        }
        return null;
    }

    function convertToRGB({ rgb }) {
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    function parseRGBA(value) {
        const match = value.match(/rgb(?:a)?\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})(?:, ([0-9]{1,3}))?\)/);
        if (match != null && match.length >= 4) {
            return [match[0], `#${convertRGBtoHex(match[1])}${convertRGBtoHex(match[2])}${convertRGBtoHex(match[3])}`, parseInt((match[4] != null ? match[4] : 1))];
        }
        return null;
    }

    function getStyle(element) {
        return (element.androidNode != null ? element.androidNode.style : getComputedStyle(element));
    }

    function getBoxSpacing(node, rtl = false, complete = false) {
        const result = {};
        ['padding', 'margin'].forEach(border => {
            ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
                const attr = border + side;
                const value = parseInt(node.css(attr));
                if (complete || value != 0) {
                    result[(rtl ? attr.replace('Left', 'Start').replace('Right', 'End') : attr)] = value;
                }
            });
        });
        return result;
    }

    function hasFreeFormText(element) {
        return Array.from(element.childNodes).some(item => (item.nodeName == '#text' && item.textContent.trim() != ''));
    }

    function isVisible(element) {
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

    const SETTINGS = {
        targetAPI: BUILD_ANDROID.OREO,
        density: DENSITY_ANDROID.MDPI,
        showAttributes: true,
        useConstraintLayout: true,
        useConstraintChain: true,
        useGridLayout: true,
        useLayoutWeight: true,
        useUnitDP: true,
        useRTL: true,
        numberResourceValue: false,
        whitespaceHorizontalOffset: 4,
        constraintBiasBoxOffset: 14,
        chainPackedHorizontalOffset: 4,
        chainPackedVerticalOffset: 14
    };

    const RESOURCE = {
        string: new Map(),
        array: new Map(),
        color: new Map(),
        image: new Map(),
        drawable: new Map(),
        style: new Map()
    };

    const XMLNS_ANDROID =
    {
        ANDROID: 'xmlns:android="http://schemas.android.com/apk/res/android"',
        APP: 'xmlns:app="http://schemas.android.com/apk/res-auto"',
        TOOLS: 'xmlns:tools="http://schemas.android.com/tools"'
    };

    const PROPERTY_ANDROID =
    {
        'backgroundStyle': {
            'backgroundColor': 'android:background="@drawable/{0}"'
        },
        'computedStyle': {
            'fontFamily': 'android:fontFamily="{0}"',
            'fontSize': 'android:textSize="{0}"',
            'fontWeight': 'android:fontWeight="{0}"',
            'fontStyle': 'android:textStyle="{0}"',
            'color': 'android:textColor="{0}"',
            'backgroundColor': 'android:background="{0}"'
        },
        'boxSpacing': {
            'margin': 'android:layout_margin="{0}"',
            'marginTop': 'android:layout_marginTop="{0}"',
            'marginRight': 'android:layout_marginRight="{0}"',
            'marginEnd': 'android:layout_marginEnd="{0}"',
            'marginBottom': 'android:layout_marginBottom="{0}"',
            'marginLeft': 'android:layout_marginLeft="{0}"',
            'marginStart': 'android:layout_marginStart="{0}"',
            'padding': 'android:padding="{0}"',
            'paddingTop': 'android:paddingTop="{0}"',
            'paddingRight': 'android:paddingRight="{0}"',
            'paddingEnd': 'android:paddingEnd="{0}"',
            'paddingBottom': 'android:paddingBottom="{0}"',
            'paddingLeft': 'android:paddingLeft="{0}"',
            'paddingStart': 'android:paddingStart="{0}"'
        },
        'resourceString': {
            'text': 'android:text="{0}"'
        },
        'resourceStringArray': {
            'entries': 'android:entries="@array/{0}"'
        }
    };

    const ACTION_ANDROID =
    {
        'FrameLayout': {
            'androidId': 'android:id="@+id/{0}"',
            'setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
        },
        'LinearLayout': {
            'androidId': 'android:id="@+id/{0}"',
            'setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
        },
        'RelativeLayout': {
            'androidId': 'android:id="@+id/{0}"',
            'setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
        },
        'android.support.constraint.ConstraintLayout': {
            'androidId': 'android:id="@+id/{0}"',
            'setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
        },
        'GridLayout': {
            'androidId': 'android:id="@+id/{0}"',
            'setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
        },
        'ScrollView': {
            'androidId': 'android:id="@+id/{0}"'
        },
        'HorizontalScrollView': {
            'androidId': 'android:id="@+id/{0}"'
        },
        'NestedScrollView': {
            'androidId': 'android:id="@+id/{0}"'
        },
        'RadioGroup': {
            'androidId': 'android:id="@+id/{0}"'
        },
        'RadioButton': {
            'androidId': 'android:id="@+id/{0}"',
            'setComputedStyle': PROPERTY_ANDROID['computedStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
        },
        'CheckBox': {
            'androidId': 'android:id="@+id/{0}"',
            'setComputedStyle': PROPERTY_ANDROID['computedStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
        },
        'Spinner': {
            'androidId': 'android:id="@+id/{0}"',
            'setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
            'setComputedStyle': PROPERTY_ANDROID['computedStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
            'addResourceStringArray': PROPERTY_ANDROID['resourceStringArray']
        },
        'TextView': {
            'androidId': 'android:id="@+id/{0}"',
            'setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
            'setComputedStyle': PROPERTY_ANDROID['computedStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
            'addResourceString': PROPERTY_ANDROID['resourceString']
        },
        'EditText': {
            'androidId': 'android:id="@+id/{0}"',
            'setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
            'setComputedStyle': PROPERTY_ANDROID['computedStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
            'addResourceString': PROPERTY_ANDROID['resourceString']
        },
        'View': {
            'androidId': 'android:id="@+id/{0}"',
            'setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
        },
        'Button': {
            'androidId': 'android:id="@+id/{0}"',
            'setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
            'setComputedStyle': PROPERTY_ANDROID['computedStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
            'addResourceString': PROPERTY_ANDROID['resourceString']
        },
        'ImageView': {
            'androidId': 'android:id="@+id/{0}"',
            'androidSrc': 'android:src="@drawable/{0}"',
            'setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
            'setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
        }
    };

    function insertResourceAsset$1(resource, name, value) {
        let resourceName = null;
        if (hasValue(value)) {
            let i = 0;
            do {
                resourceName = name;
                if (i > 0) {
                    resourceName += i;
                }
                if (!resource.has(resourceName)) {
                    resource.set(resourceName, value);
                }
                i++;
            }
            while (resource.has(resourceName) && resource.get(resourceName) != value)
        }
        return resourceName;
    }

    function parseBorderStyle(value) {
        let stroke = value.match(/(none|dotted|dashed|solid)/);
        let width = value.match(/([0-9\.]+(?:px|pt|em))/);
        let color = parseRGBA(value);
        if (stroke != null) {
            stroke = stroke[1];
        }
        if (width != null) {
            width = convertToPX(width[1]);
        }
        if (color != null) {
            color = color[1];
        }
        return [stroke || 'solid', width || '1px', color || '#000'];
    }

    function parseBoxDimensions(value) {
        const match = value.match(/^([0-9]+(?:px|pt|em)) ([0-9]+(?:px|pt|em)) ([0-9]+(?:px|pt|em)) ([0-9]+(?:px|pt|em))$/);
        if (match != null && match.length == 5) {
            if (match[1] == match[2] && match[2] == match[3] && match[3] == match[4]) {
                return [convertToPX(match[1])];
            }
            else if (match[1] == match[3] && match[2] == match[4]) {
                return [convertToPX(match[1]), convertToPX(match[2])];
            }
            else {
                return [convertToPX(match[1]), convertToPX(match[2]), convertToPX(match[3]), convertToPX(match[4])];
            }
        }
        return null;
    }

    function addResourceString(node, value) {
        const element = (node != null ? node.element : null);
        let name = value;
        if (value == null) {
            if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA') {
                name = element.value;
                value = name;
            }
            else if (element.nodeName == '#text') {
                name = element.textContent.trim();
                value = name;
            }
            else {
                name = element.innerText;
                value = element.innerHTML;
            }
        }
        if (hasValue(value)) {
            if (node != null) {
                if (node.isView(WIDGET_ANDROID.TEXT)) {
                    const match = (node.style.textDecoration != null ? node.style.textDecoration.match(/(underline|line-through)/) : null);
                    if (match != null) {
                        switch (match[0]) {
                            case 'underline':
                                value = `<u>${value}</u>`;
                                break;
                            case 'line-through':
                                value = `<strike>${value}</strike>`;
                                break;
                        }
                    }
                }
            }
            const number = isNumber(value);
            if (SETTINGS.numberResourceValue || !number) {
                value = value.replace(/\s*style=""/g, '');
                for (const [name, resourceValue] in RESOURCE['string'].entries()) {
                    if (resourceValue == value) {
                        return { text: name };
                    }
                }
                name = name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').split('_').slice(0, 5).join('_').replace(/_+$/g, '');
                if (number) {
                    name = `number_${name}`;
                }
                else if (/^[0-9]/.test(value)) {
                    name = `__${name}`;
                }
                else if (!/[a-zA-Z0-9]+/.test(name) && node != null) {
                    name = node.androidId;
                }
                name = insertResourceAsset$1(RESOURCE['string'], name, value);
            }
            if (element != null && element.nodeName == '#text') {
                const prevSibling = element.previousSibling;
                if (prevSibling != null) {
                    const prevNode = prevSibling.androidNode;
                    switch (prevNode.widgetName) {
                        case WIDGET_ANDROID.CHECKBOX:
                        case WIDGET_ANDROID.RADIO:
                            prevNode.android('text', (!SETTINGS.numberResourceValue && number ? name : `@string/${name}`));
                            prevNode.label = node;
                            node.hide();
                            break;
                    }
                }
            }
            return { text: name };
        }
        return null;
    }

    function addResourceStringArray(node) {
        const element = node.element;
        const stringArray = new Map();
        let numberArray = new Map();
        for (let i = 0; i < element.children.length; i++) {
            const item = element.children[i];
            let value = item.text.trim() || item.value.trim();
            if (value != '') {
                if (numberArray != null && !stringArray.size && isNumber(value)) {
                    numberArray.set(value, false);
                }
                else {
                    if (numberArray != null && numberArray.size > 0) {
                        i = -1;
                        numberArray = null;
                        continue;
                    }
                    stringArray.set(addResourceString(null, value).text, true);
                }
            }
        }
        if (stringArray.size > 0 || numberArray.size > 0) {
            const name = insertResourceAsset$1(RESOURCE['array'], `${element.androidNode.androidId}_array`, (stringArray.size ? stringArray : numberArray));
            return { entries: name };
        }
        return null;
    }

    function addResourceColor(value) {
        value = value.toUpperCase().trim();
        if (value != '') {
            let colorName = '';
            if (!RESOURCE['color'].has(value)) {
                const color = findNearestColor(value);
                if (color != null) {
                    color.name = cameltoLowerCase(color.name);
                    if (value.toUpperCase().trim() == color.hex) {
                        colorName = color.name;
                    }
                    else {
                        colorName = generateId('color', `${color.name}_1`);
                    }
                }
                if (colorName != '') {
                    RESOURCE['color'].set(value, colorName);
                }
            }
            else {
                colorName = RESOURCE['color'].get(value);
            }
            if (colorName != '') {
                return `@color/${colorName}`;
            }
        }
        return value;
    }

    function setBackgroundStyle(node) {
        const element = node.element;
        const attributes = {
            border: parseBorderStyle,
            borderTop: parseBorderStyle,
            borderRight: parseBorderStyle,
            borderBottom: parseBorderStyle,
            borderLeft: parseBorderStyle,
            borderRadius: parseBoxDimensions,
            backgroundColor: parseRGBA
        };
        let backgroundParent = [];
        if (element.parentNode != null) {
            backgroundParent = parseRGBA(getStyle(element.parentNode).backgroundColor);
        }
        const style = getStyle(element);
        for (const i in attributes) {
            attributes[i] = attributes[i](style[i]);
        }
        if (attributes.border[0] != 'none' || attributes.borderRadius != null) {
            attributes.border[2] = addResourceColor(attributes.border[2]);
            if (backgroundParent[0] == attributes.backgroundColor[0] || attributes.backgroundColor[4] == 0) {
                attributes.backgroundColor = null;
            }
            else {
                attributes.backgroundColor[1] = addResourceColor(attributes.backgroundColor[1]);
            }
            const borderStyle = {
                black: 'android:color="@android:color/black"',
                solid: `android:color="${attributes.border[2]}"`
            };
            borderStyle.dotted = `${borderStyle.solid} android:dashWidth="3px" android:dashGap="1px"`;
            borderStyle.dashed = `${borderStyle.solid} android:dashWidth="1px" android:dashGap="1px"`;
            borderStyle.default = borderStyle[attributes.border[0]] || borderStyle.black;
            let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
            if (attributes.border[0] != 'none' && attributes.borderRadius != null) {
                xml += `<shape ${XMLNS_ANDROID.ANDROID} android:shape="rectangle">\n` +
                       `\t<stroke android:width="${attributes.border[1]}" ${borderStyle.default} />\n` +
                       (attributes.backgroundColor ? `\t<solid android:color="${attributes.backgroundColor[1]}" />\n` : '');
                if (attributes.borderRadius.length == 1) {
                    xml += `\t<corners android:radius="${attributes.borderRadius[0]}" />\n`;
                }
                else {
                    if (attributes.borderRadius.length == 2) {
                        attributes.borderRadius.push(...attributes.borderRadius.slice());
                    }
                    xml += '\t<corners';
                    attributes.borderRadius.forEach((value, index) => xml += ` android:${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius="${value}"`);
                }
                xml += ' />\n' +
                       '</shape>';
            }
            else if (attributes.border[0] != 'none' && attributes.backgroundColor == null) {
                xml += `<shape ${XMLNS_ANDROID.ANDROID} android:shape="rectangle">\n` +
                       `\t<stroke android:width="${attributes.border[1]}" ${borderStyle.default} />\n` +
                       '</shape>';
            }
            else {
                xml += `<layer-list ${XMLNS_ANDROID.ANDROID}>\n`;
                if (attributes.backgroundColor != null) {
                    xml += '\t<item>\n' +
                           '\t\t<shape android:shape="rectangle">\n' +
                           `\t\t\t<solid android:color="${attributes.backgroundColor[1]}" />\n` +
                           '\t\t</shape>\n' +
                           '\t</item>\n';
                }
                if (attributes.border[0] != 'none') {
                    xml += '\t<item>\n' +
                           '\t\t<shape android:shape="rectangle">\n' +
                           `\t\t\t<stroke android:width="${attributes.border[1]}" ${borderStyle.default} />\n` +
                           '\t\t</shape>\n' +
                           '\t</item>\n';
                }
                else {
                    [attributes.borderTopWidth, attributes.borderRightWidth, attributes.borderBottomWidth, attributes.borderLeftWidth].forEach((item, index) => {
                        xml += `\t<item android:${['top', 'right', 'bottom', 'left'][index]}="${item[2]}">\n` +
                               '\t\t<shape android:shape="rectangle">\n' +
                               `\t\t\t<stroke android:width="${item[1]}" ${borderStyle[item[0]] || borderStyle.black} />\n` +
                               '\t\t</shape>\n' +
                               '\t</item>\n';
                    });
                }
                xml += '</layer-list>';
            }
            let drawableName = null;
            for (const [i, j] of RESOURCE['drawable'].entries()) {
                if (j == xml) {
                    drawableName = i;
                    break;
                }
            }
            if (drawableName == null) {
                drawableName = `${node.tagName.toLowerCase()}_${node.androidId}`;
                RESOURCE['drawable'].set(drawableName, xml);
            }
            node.drawable = drawableName;
            return { backgroundColor: drawableName };
        }
        return null;
    }

    function setComputedStyle(node) {
        return getStyle(node.element);
    }

    function setBoxSpacing(node) {
        const result = getBoxSpacing(node, SETTINGS.useRTL);
        for (const i in result) {
            result[i] += 'px';
        }
        return result;
    }

    function getViewAttributes(node) {
        let output = '';
        const attributes = node.combine();
        if (attributes.length > 0) {
            for (let i = 0; i < attributes.length; i++) {
                if (attributes[i].startsWith('android:id=')) {
                    attributes.unshift(...attributes.splice(i, 1));
                    break;
                }
            }
            const indent = padLeft(node.renderDepth + 1);
            if (node.renderDepth == 0) {
                if (SETTINGS.useConstraintLayout) {
                    attributes.unshift(XMLNS_ANDROID.APP);    
                }
                attributes.unshift(XMLNS_ANDROID.ANDROID);
            }
            output = attributes.map(value => `\n${indent + value}`).join('');
        }
        return output;
    }

    function parseStyleAttribute(value) {
        const rgb = parseRGBA(value);
        if (rgb != null) {
            const name = addResourceColor(rgb[1]);
            return value.replace(rgb[0], name);
        }
        const match = value.match(/#[A-Z0-9]{6}/);
        if (match != null) {
            const name = addResourceColor(match[0]);
            return value.replace(match[0], name);
        }
        return value;
    }

    var Resource = /*#__PURE__*/Object.freeze({
        RESOURCE: RESOURCE,
        XMLNS_ANDROID: XMLNS_ANDROID,
        ACTION_ANDROID: ACTION_ANDROID,
        addResourceString: addResourceString,
        addResourceStringArray: addResourceStringArray,
        addResourceColor: addResourceColor,
        setBackgroundStyle: setBackgroundStyle,
        setComputedStyle: setComputedStyle,
        setBoxSpacing: setBoxSpacing,
        getViewAttributes: getViewAttributes,
        parseStyleAttribute: parseStyleAttribute
    });

    class Node {
        constructor(id, element, api, options = {}) {
            let style = {};
            let styleMap = {};
            if (element != null) {
                style = window.getComputedStyle(element);
                styleMap = element.styleMap || {};
                for (const inline of element.style) {
                    styleMap[hyphenToCamelCase(inline)] = element.style[inline];
                }
            }
            else {
                element = {};
            }
            this.id = id;
            this.element = element;
            this.children = new NodeList(null, this);
            this.api = api;
            this.depth = 0;
            this.style = style;
            this.styleMap = styleMap;
            this.visible = true;
            this.linearRows = new NodeList(null, this);
            this.renderChildren = new NodeList(null, this);
            this.styleAttributes = [];
            this.label = null;
            this.constraint = {};
            this.wrapNode = null;
            this.parentIndex = Number.MAX_VALUE;

            this._tagName = null;
            this._parent = null;
            this._parentOriginal = null;
            this._flex = null;
            this._overflow = null;
            this._namespaces = new Set();

            Object.assign(this, options);

            if (options.element != null || arguments[1] != null) {
                this.element.androidNode = this;
            }
        }

        add(obj, attr, value, overwrite = true) {
            const name = `_${obj || '_'}`;
            if (this[name] == null) {
                this._namespaces.add(obj);
                this[name] = {};
            }
            if (hasValue(value)) {
                if (!this.supported(obj, attr)) {
                    return false;
                }
                if (!overwrite && this[name][attr] != null) {
                    return null;
                }
                this[name][attr] = value;
            }
            return this[name][attr];
        }
        delete(obj, ...attributes) {
            const name = `_${obj}`;
            if (this[name] != null) {
                if (typeof attributes[0] == 'object') {
                    for (const key in attributes[0]) {
                        delete this[name][attributes[0][key]];
                    }
                }
                else {
                    for (const attr of attributes) {
                        if (attr.indexOf('*') != -1) {
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
        attr(value, overwrite = true) {
            const match = value.match(/^(?:([a-z]+):)?([a-zA-Z_]+)="((?:@+?[a-z]+\/)?.+)"$/);
            if (match != null) {
                this.add(match[1] || '_', match[2], match[3], overwrite);
            }
            return this;
        }
        android(attr, value, overwrite = true) {
            if (arguments.length == 0) {
                return this._android;
            }
            else {
                const result = this.add('android', attr, value, overwrite);
                if (arguments.length >= 2) {
                    return this;
                }
                else {
                    return result;
                }
            }
        }
        app(attr, value, overwrite = true) {
            if (arguments.length == 0) {
                return this._app;
            }
            else {
                const result = this.add('app', attr, value, overwrite);
                if (arguments.length >= 2) {
                    return this;
                }
                else {
                    return result;
                }
            }
            return this;
        }
        combine() {
            const result = [];
            const namespaces = {};
            this._namespaces.forEach(value => {
                const obj = this[`_${value}`];
                for (const attr in obj) {
                    if (value != '_') {
                        result.push(`${value}:${attr}="${obj[attr]}"`);
                    }
                    else {
                        result.push(`${attr}="${obj[attr]}"`);
                    }
                }
            });
            result.sort();
            return result;
        }
        css(attr, value) {
            if (arguments.length == 2) {
                if (hasValue(value)) {
                    this.styleMap[attr] = value;
                }
                return this;
            }
            else {
                return (this.styleMap[attr] || this.style[attr]);
            }
        }
        supported(obj, attr) {
            for (let i = this.api + 1; i < BUILD_ANDROID.LATEST; i++) {
                const version = API_ANDROID[i];
                if (version != null && version[obj] != null && version[obj].includes(attr)) {
                    return false;
                }
            }
            return true;
        }
        applyCustomizations() {
            const api = API_ANDROID[this.api];
            if (api != null) {
                const customizations = api.customizations[this.widgetName];
                if (customizations != null) {
                    for (const obj in customizations) {
                        for (const attr in customizations[obj]) {
                            this.add(obj, attr, customizations[obj][attr], false);
                        }
                    }
                }
            }
        }
        render(parent) {
            if (Node.is(parent)) {
                if (parent.isView(WIDGET_ANDROID.LINEAR)) {
                    switch (this.widgetName) {
                        case WIDGET_ANDROID.LINEAR:
                        case WIDGET_ANDROID.RADIO_GROUP:
                            parent.linearRows.push(this);
                            break;
                    }
                }
                this.renderParent = parent;
                this.renderDepth = (parent.id == 0 ? 0 : parent.renderDepth + 1);
            }
        }
        hide() {
            this.renderParent = true;
            this.visible = false;
        }
        ascend() {
            const result = [];
            let current = this.parent;
            while (current != null) {
                if (current.id != 0) {
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
        expandToFit() {
            let [width, height] = [this.children.reduce((a, b) => Math.max(a, b.linear.right), 0), this.children.reduce((a, b) => Math.max(a, b.linear.bottom), 0)];
            switch (this.style.position) {
                case 'static':
                case 'relative':
                    width -= this.linear.left;
                    height -= this.linear.top;
                    break;
            }
            width += (this.paddingRight + convertToInt(this.css('borderRightWidth')));
            height += (this.paddingBottom + convertToInt(this.css('borderBottomWidth')));
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
                if (this.parent.id != 0 && this.parentOriginal.bounds.width > width) {
                    this.constraint.minWidth = 'match_parent';
                }
                else {
                    this.constraint.minWidth = `${Math.ceil(width)}px`;
                }
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
                if (this.parent.id != 0 && this.parentOriginal.bounds.height > height) {
                    this.constraint.minHeight = 'match_parent';
                }
                else {
                    this.constraint.minHeight = `${Math.ceil(height)}px`;
                }
            }
            if (calibrate) {
                this.setBounds(null, true);
            }
        }
        inheritGrid(node) {
            for (const prop in node) {
                if (prop.startsWith('grid')) {
                    if (node[prop] !== false) {
                        this[prop] = node[prop];
                    }
                    delete node[prop];
                }
            }
        }
        intersect(rect, dimension = 'bounds') {
            const top = (rect.top >= this[dimension].top && rect.top < this[dimension].bottom);
            const bottom = (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom);
            const left = (rect.left >= this[dimension].left && rect.left < this[dimension].right);
            const right = (rect.right > this[dimension].left && rect.right <= this[dimension].right);
            return (top && (left || right)) || (bottom && (left || right));
        }
        withinX(rect, dimension = 'linear') {
            return (
                (rect.top >= this[dimension].top && rect.top < this[dimension].bottom) ||
                (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom) ||
                (this[dimension].top >= rect.top && this[dimension].bottom <= rect.bottom) ||
                (rect.top >= this[dimension].top && rect.bottom <= this[dimension].bottom)
            );
        }
        withinY(rect, dimension = 'linear') {
            return (
                (rect.left >= this[dimension].left && rect.left < this[dimension].right) ||
                (rect.right > this[dimension].left && rect.right <= this[dimension].right) ||
                (this[dimension].left >= rect.left && this[dimension].right <= rect.right) ||
                (rect.left >= this[dimension].left && rect.right <= this[dimension].right)
            );
        }
        isHorizontal() {
            return (this._android.orientation == 'horizontal');
        }
        isView(...views) {
            for (const viewName of views) {
                if (this.widgetName == viewName) {
                    return true;
                }
            }
            return false;
        }

        setAndroidId(widgetName) {
            this.androidWidgetName = widgetName || this.widgetName;
            if (this.androidId == null) {
                this.androidId = generateId('android', this.element.id || this.element.name || `${this.androidWidgetName.substring(this.androidWidgetName.lastIndexOf('.') + 1).toLowerCase()}_1`);
            }
        }
        setAndroidDimensions() {
            if (this.visible) {
                const styleMap = this.styleMap;
                let parent = null;
                let width = 0;
                let height = 0;
                let requireWrap = false;
                if (this.wrapNode != null) {
                    parent = this.wrapNode.parentOriginal;
                    [width, height] = this.childrenBox;
                    requireWrap = this.parent.isView(WIDGET_ANDROID.CONSTRAINT, WIDGET_ANDROID.GRID);
                }
                else {
                    parent = this.parent;
                    width = this.element.offsetWidth + this.marginLeft + this.marginRight;
                    height = this.element.offsetHeight + this.marginTop + this.marginBottom;
                    requireWrap = parent.isView(WIDGET_ANDROID.CONSTRAINT, WIDGET_ANDROID.GRID);
                }
                const parentWidth = (parent.id != 0 ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + convertToInt(parent.style.borderLeftWidth) + convertToInt(parent.style.borderRightWidth)) : Number.MAX_VALUE);
                const parentHeight = (parent.id != 0 ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + convertToInt(parent.style.borderTopWidth) + convertToInt(parent.style.borderBottomWidth)) : Number.MAX_VALUE);
                if (this.overflow != 0 && !this.isView(WIDGET_ANDROID.TEXT)) {
                    this.android('layout_width', (this.isHorizontal() ? 'wrap_content' : 'match_parent'))
                        .android('layout_height', (this.isHorizontal() ? 'match_parent' : 'wrap_content'));
                }
                else {
                    if (this.android('layout_width') != '0px') {
                        if (styleMap.width != null) {
                            this.android('layout_width', convertToPX(styleMap.width));
                        }
                        if (styleMap.minWidth != null) {
                            this.android('minWidth', convertToPX(styleMap.minWidth), false)
                                .android('layout_width', 'wrap_content', false);
                        }
                        if (styleMap.maxWidth != null) {
                            this.android('maxWidth', convertToPX(styleMap.maxWidth), false);
                        }
                    }
                    if (this.constraint.minWidth != null) {
                        if (this.constraint.layoutWidth || this.constraint.minWidth == 'match_parent') {
                            this.android('layout_width', this.constraint.minWidth);
                        }
                        else {
                            this.android('minWidth', this.constraint.minWidth)
                                .android('layout_width', 'wrap_content', false);
                        }
                    }
                    else if (this.android('layout_width') == null) {
                        if (requireWrap) {
                            this.android('layout_width', 'wrap_content');
                        }
                        else {
                            if (FIXED_ANDROID.includes(this.widgetName)) {
                                this.android('layout_width', 'wrap_content');
                            }
                            else {
                                if (parent.overflow == 0 && width >= parentWidth) {
                                    this.android('layout_width', 'match_parent');
                                }
                                else {
                                    const display = (this.style != null ? this.style.display : '');
                                    switch (display) {
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
                    if (this.android('layout_height') != '0px') {
                        if (styleMap.height != null) {
                            this.android('layout_height', convertToPX(styleMap.height));
                        }
                        if (styleMap.minHeight != null) {
                            this.android('minHeight', convertToPX(styleMap.minHeight), false)
                                .android('layout_height', 'wrap_content', false);
                        }
                        if (styleMap.maxHeight != null) {
                            this.android('maxHeight', convertToPX(styleMap.maxHeight), false);
                        }
                    }
                    if (this.constraint.minHeight != null) {
                        if (this.constraint.layoutHeight || this.constraint.minHeight == 'match_parent') {
                            this.android('layout_height', this.constraint.minHeight, true);
                        }
                        else {
                            this.android('minHeight', `${this.constraint.minHeight}px`)
                                .android('layout_height', 'wrap_content', false);
                        }
                    }
                    else if (this.android('layout_height') == null) {
                        switch (this.widgetName) {
                            case WIDGET_ANDROID.TEXT:
                            case WIDGET_ANDROID.EDIT:
                            case WIDGET_ANDROID.SPINNER:
                            case WIDGET_ANDROID.CHECKBOX:
                            case WIDGET_ANDROID.RADIO:
                            case WIDGET_ANDROID.BUTTON:
                                this.android('layout_height', 'wrap_content');
                                break;
                            default:
                                if (parent.overflow == 0 && !requireWrap && height >= parentHeight) {
                                    this.android('layout_height', 'match_parent');
                                }
                                else {
                                    this.android('layout_height', 'wrap_content');
                                }
                        }
                    }
                }
            }
        }
        setAttributes(...actions) {
            const widget = ACTION_ANDROID[this.widgetName];
            const element = this.element;
            const result = {};
            if (element.tagName == 'INPUT' && element.id != '') {
                const nextElement = element.nextElementSibling;
                if (nextElement != null && nextElement.htmlFor == element.id) {
                    const node = nextElement.androidNode;
                    node.setAttributes(4);
                    node.setAndroidId(WIDGET_ANDROID.TEXT);
                    const attributes = node.combine();
                    if (attributes.length > 0) {
                        result[4] = attributes;
                    }
                    this.css('marginRight', node.style.marginRight);
                    this.css('paddingRight', node.style.paddingRight);
                    this.label = node;
                    node.hide();
                }
            }
            if (widget != null) {
                if (this.actions != null) {
                    actions = this.actions;
                }
                let i = -1;
                for (const action in widget) {
                    i++;
                    if (result[action] != null || (actions != null && actions.length > 0 && !actions.includes(i))) {
                        continue;
                    }
                    if (hasValue(this[action])) {
                        result[action] = formatString(widget[action], this[action]);
                    }
                    else if (typeof Resource[action] == 'function') {
                        const data = Resource[action](this);
                        if (data != null) {
                            const output = [];
                            for (const j in widget[action]) {
                                if (result[j] != null) {
                                    continue;
                                }
                                let value = data[j];
                                if (hasValue(value)) {
                                    value = Node.parseStyle(element, j, value);
                                    if (value != null) {
                                        switch (action) {
                                            case 'setComputedStyle':
                                                if (!this.supported.apply(this, widget[action][j].split('=')[0].split(':'))) {
                                                    continue;
                                                }
                                                break;
                                            case 'addResourceString':
                                                value = isNumber(value) ? value : `@string/${value}`;
                                                break;
                                        }
                                        output.push(formatString(widget[action][j], value));
                                    }
                                }
                            }
                            if (output.length > 0) {
                                switch (action) {
                                    case 'setComputedStyle':
                                        this.styleAttributes = output;
                                        break;
                                    default:
                                        result[i] = output;
                                }
                            }
                        }
                    }
                }
            }
            for (const i in result) {
                let value = result[i];
                if (hasValue(value)) {
                    if (!Array.isArray(value)) {
                        value = [value];
                    }
                    value.forEach(attr => this.attr(attr, false));
                }
            }
        }
        setBounds(element, calibrate = false) {
            if (this.wrapNode == null) {
                if (!calibrate) {
                    this.bounds = (element != null ?  Node.getRangeBounds(element) : JSON.parse(JSON.stringify(this.element.getBoundingClientRect())));
                }
                this.linear = {
                    top: this.bounds.top - this.marginTop,
                    right: this.bounds.right + this.marginRight,
                    bottom: this.bounds.bottom + this.marginBottom,
                    left: this.bounds.left - this.marginLeft
                };
                this.box = {
                    top: this.bounds.top + (this.paddingTop + convertToInt(this.css('borderTopWidth'))),
                    right: this.bounds.right - (this.paddingRight + convertToInt(this.css('borderRightWidth'))),
                    bottom: this.bounds.bottom - (this.paddingBottom + convertToInt(this.css('borderBottomWidth'))),
                    left: this.bounds.left + (this.paddingLeft + convertToInt(this.css('borderLeftWidth')))
                };
            }
            else {
                const nodes = this.outerNodes;
                if (!calibrate) {
                    this.bounds = {
                        top: nodes.top[0].bounds.top,
                        right: nodes.right[0].bounds.right,
                        bottom: nodes.bottom[0].bounds.bottom,
                        left: nodes.left[0].bounds.left,
                        x: nodes.left[0].bounds.x,
                        y: nodes.top[0].bounds.y
                    };
                    this.bounds.width = this.bounds.right - this.bounds.left;
                    this.bounds.height = this.bounds.bottom - this.bounds.top;
                }
                this.linear = {
                    top: nodes.top[0].linear.top,
                    right: nodes.right[0].linear.right,
                    bottom: nodes.bottom[0].linear.bottom,
                    left: nodes.left[0].linear.left
                };
                this.box = {
                    top: nodes.top[0].box.top,
                    right: nodes.right[0].box.right,
                    bottom: nodes.bottom[0].box.bottom,
                    left: nodes.left[0].box.left
                };
            }
            const linear = this.linear;
            linear.width = linear.right - linear.left;
            linear.height = linear.bottom - linear.top;
            const box = this.box;
            box.width = box.right - box.left;
            box.height = box.bottom - box.top;
        }
        setGravity() {
            if (this.wrapNode == null) {
                const verticalAlign = this.styleMap.verticalAlign;
                let textAlign = null;
                let element = this.element;
                while (element != null && element.styleMap != null) {
                    textAlign = element.styleMap.textAlign || textAlign;
                    const float = (element != this.element ? element.styleMap.float : '');
                    if (float == 'left' || float == 'right' || hasValue(textAlign)) {
                        break;
                    }
                    element = element.parentNode;
                }
                if (hasValue(verticalAlign) || hasValue(textAlign)) {
                    let horizontal = null;
                    let vertical = null;
                    let layoutGravity = [];
                    switch (textAlign) {
                        case 'start':
                            horizontal = 'start';
                            break;
                        case 'right':
                            horizontal = getLTR('right', 'end');
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
                            if (this.style.height == this.style.lineHeight || convertToInt(this.style.lineHeight) == (this.box.bottom - this.box.top)) {
                                vertical = 'center_vertical';
                            }
                    }
                    const parentTextAlign = (this.styleMap.textAlign != textAlign && !this.renderParent.floating && !this.floating);
                    switch (this.renderParent.widgetName) {
                        case WIDGET_ANDROID.RADIO_GROUP:
                        case WIDGET_ANDROID.LINEAR:
                            if (parentTextAlign && this.parent.wrapNode != null) {
                                this.renderParent.android('gravity', horizontal);
                            }
                            break;
                        case WIDGET_ANDROID.CONSTRAINT:
                        case WIDGET_ANDROID.RELATIVE:
                            this.android('gravity', [vertical, horizontal].join('|'));
                            horizontal = null;
                            vertical = null;
                            break;
                        case WIDGET_ANDROID.GRID:
                            if (parentTextAlign) {
                                layoutGravity.push(horizontal);
                            }
                            break;
                    }
                    if (vertical != null || layoutGravity.length > 0) {
                        layoutGravity.push(vertical);
                        this.android('layout_gravity', layoutGravity.join('|'));
                    }
                    if (horizontal != null) {
                        this.android('gravity', horizontal);
                    }
                }
            }
        }

        get horizontalBias() {
            const parent = this.renderParent;
            if (parent != null && parent.visible) {
                const left = this.linear.left - parent.box.left;
                const right = parent.box.right - this.linear.right;
                return calculateBias(left, right);
            }
            return 0.5;
        }
        get verticalBias() {
            const parent = this.renderParent;
            if (parent != null && parent.visible) {
                const top = this.linear.top - parent.box.top;
                const bottom = parent.box.bottom - this.linear.bottom;
                return calculateBias(top, bottom);
            }
            return 0.5;
        }
        get widgetName() {
            if (this.androidWidgetName != null) {
                return this.androidWidgetName;
            }
            else {
                let widgetName = MAPPING_CHROME[this.tagName];
                if (typeof widgetName == 'object') {
                    widgetName = widgetName[this.element.type];
                }
                return widgetName;
            }
        }
        set parent(value) {
            if (!Node.is(value) || value == this._parent) {
                return;
            }
            if (this._parent != null && this._parentOriginal == null) {
                this._parentOriginal = this._parent;
            }
            this._parent = value;
            if (this.depth == 0) {
                this.depth = value.depth + 1;
            }
        }
        get parent() {
            return (this._parent != null ? this._parent : new Node(0));
        }
        set parentOriginal(value) {
            if (Node.is(value)) {
                this._parentOriginal = value;
            }
        }
        get parentOriginal() {
            return (this._parentOriginal || this._parent);
        }
        get parentElement() {
            return this.element.parentNode;
        }
        set renderParent(value) {
            if (Node.is(value) && value.visible) {
                value.renderChildren.push(this);
            }
            this._renderParent = value;
        }
        get renderParent() {
            return this._renderParent;
        }
        get childrenBox() {
            let minLeft = Number.MAX_VALUE;
            let maxRight = Number.MIN_VALUE;
            let minTop = Number.MAX_VALUE;
            let maxBottom = Number.MIN_VALUE;
            this.children.forEach(node => {
                minLeft = Math.min(node.bounds.left, minLeft);
                maxRight = Math.max(node.bounds.right, maxRight);
                minTop = Math.min(node.bounds.top, minTop);
                maxBottom = Math.max(node.bounds.bottom, maxBottom);
            });
            return [maxRight - minLeft, maxBottom - minTop];
        }
        get outerNodes() {
            const children = this.children;
            let top = [children[0]];
            let right = [children[0]];
            let bottom = [children[0]];
            let left = [children[0]];
            for (let i = 1; i < children.length; i++) {
                const node = children[i];
                const nodeRight = node.label || node;
                if (top[0].bounds.top == node.bounds.top) {
                    top.push(node);
                }
                else if (node.bounds.top < top[0].bounds.top) {
                    top = [node];
                }
                if (right[0].bounds.right == nodeRight.bounds.right) {
                    right.push(nodeRight);
                }
                else if (nodeRight.bounds.right > right[0].bounds.right) {
                    right = [nodeRight];
                }
                if (bottom[0].bounds.bottom == node.bounds.bottom) {
                    bottom.push(node);
                }
                else if (node.bounds.bottom > bottom[0].bounds.bottom) {
                    bottom = [node];
                }
                if (left[0].bounds.left == node.bounds.left) {
                    left.push(node);
                }
                else if (node.bounds.left < left[0].bounds.left) {
                    left = [node];
                }
            }
            return { top, right, bottom, left, children };
        }
        set tagName(value) {
            this._tagName = value;
        }
        get tagName() {
            return (this._tagName != null ? this._tagName : this.element.tagName);
        }
        get flex() {
            if (this._flex == null) {
                let parent = (this.parentElement != null ? this.parentElement.androidNode : null);
                this._flex = {
                    parent,
                    enabled: (this.style.display != null && this.style.display.indexOf('flex') != -1),
                    direction: this.style.flexDirection,
                    basis: this.style.flexBasis,
                    grow: convertToInt(this.style.flexGrow),
                    shrink: convertToInt(this.style.flexShrink),
                    wrap: this.style.flexWrap,
                    alignSelf: (parent != null && this.styleMap.alignSelf == null && this.style.alignSelf == 'auto' ? parent.styleMap.alignItems : this.style.alignSelf),
                    justifyContent: this.style.justifyContent
                };
            }
            return this._flex;
        }
        get floating() {
            return (this.styleMap.float == 'left' || this.styleMap.float == 'right');
        }
        get fixed() {
            return (this.style.display == 'fixed');
        }
        get overflow() {
            if (this._overflow == null) {
                let value = 0;
                if (this.style.overflow == 'scroll' || (this.style.overflowX == 'auto' && this.element.clientWidth != this.element.scrollWidth)) {
                    value |= 2;
                }
                if (this.style.overflow == 'scroll' || (this.style.overflowY == 'auto' && this.element.clientHeight != this.element.scrollHeight)) {
                    value |= 4;
                }
                this._overflow = value;
            }
            return this._overflow;
        }
        get overflowX() {
            return ((this._overflow & 2) == 2);
        }
        get overflowY() {
            return ((this._overflow & 4) == 4);
        }
        get anchors() {
            return (this.constraint.horizontal ? 1 : 0) + (this.constraint.vertical ? 1 : 0);
        }
        get viewWidth() {
            return convertToInt(this.styleMap.width || this.styleMap.minWidth);
        }
        get viewHeight() {
            return convertToInt(this.styleMap.height || this.styleMap.minHeight);
        }
        get marginTop() {
            return convertToInt(this.css('marginTop'));
        }
        get marginBottom() {
            return convertToInt(this.css('marginBottom'));
        }
        get marginLeft() {
            return convertToInt(this.css('marginLeft'));
        }
        get marginRight() {
            return convertToInt(this.css('marginRight'));
        }
        get paddingTop() {
            return convertToInt(this.css('paddingTop'));
        }
        get paddingBottom() {
            return convertToInt(this.css('paddingBottom'));
        }
        get paddingLeft() {
            return convertToInt(this.css('paddingLeft'));
        }
        get paddingRight() {
            return convertToInt(this.css('paddingRight'));
        }
        get center() {
            return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2)};
        }
        get stringId() {
            return (this.androidId != null ? `@+id/${this.androidId}` : '');
        }

        static is(node) {
            return (node != null && node instanceof Node);
        }
        static createWrapNode(id, node, parent, children, api, actions = null) {
            const options = {
                wrapNode: node,
                children,
                parentOriginal: node.parentOriginal,
                depth: node.depth,
                parent,
                actions
            };
            return new Node(id, null, api, options);
        }
        static createTextNode(id, element, api, parent, actions = null) {
            const node = new Node(id, null, api, { element, parent, actions, tagName: 'TEXT' });
            node.setAndroidId(WIDGET_ANDROID.TEXT);
            node.setBounds(element);
            if (parent != null) {
                const inherit = INHERIT_ANDROID[WIDGET_ANDROID.TEXT];
                const style = [];
                for (const prop in inherit) {
                    let value = parent.style[prop]; 
                    node.style[prop] = value;
                    value = Node.parseStyle(null, prop, value);
                    if (value != null) {
                        style.push(formatString(inherit[prop], value));
                    }
                }
                node.styleAttributes = style;
            }
            element.children = [];
            return node;
        }
        static getRangeBounds(element) {
            const range = document.createRange();
            range.selectNodeContents(element);
            const domRect = range.getClientRects();
            const bounds = JSON.parse(JSON.stringify(domRect[domRect.length - 1]));
            if (domRect.length > 1) {
                bounds.x = Array.from(domRect).reduce((a, b) => Math.min(a, b.x), Number.MAX_VALUE);
                bounds.left = bounds.x;
                bounds.width = Array.from(domRect).reduce((a, b) => a + b.width, 0);
            }
            return bounds;
        }
        static parseStyle(element, name, value) {
            if (name == 'backgroundColor') {
                if (element != null && element.parentNode != null && value == getStyle(element.parentNode).backgroundColor) {
                    return null;
                }
            }
            else if (/(pt|em)$/.test(value)) {
                value = convertToPX(value);
            }
            return value;
        }
    }

    class NodeList extends Array {
        constructor(nodes, parent = null) {
            super();
            if (Array.isArray(nodes)) {
                for (const node of nodes) {
                    this.push(node);
                }
            }
            this.parent = parent;
        }
        push(...value) {
            if (value.length > 0 && Node.is(value[0])) {
                super.push(...value);
            }
        }

        android(name, value, overwrite = true) {
            this.forEach(node => node.android(name, value, overwrite));
        }
        intersect(dimension = 'linear') {
            for (const node of this) {
                if (this.some(item => (item != node && node.intersect(item[dimension])))) {
                    return true;
                }
            }
            return false;
        }
        sortAsc(...attr) {
            return sortAsc(this, ...attr);
        }
        sortDesc(...attr) {
            return sortDesc(this, ...attr);
        }

        get first() {
            return (this.length > 0 ? this[0] : null);
        }
        get last() {
            return (this.length > 0 ? this[this.length - 1] : null);
        }
        set parent(value) {
            if (Node.is(value)) {
                this._parent = value;
            }
        }
        get parent() {
            return this._parent;
        }
        get linearX() {
            if (this.length > 0 && !this.intersect()) {
                if (this.length > 1) {
                    const minBottom = this.reduce((a, b) => Math.min(a, b.linear.bottom), Number.MAX_VALUE);
                    return !this.some(item => (item.linear.top >= minBottom));
                }
                return true;
            }
            return false;
        }
        get linearY() {
            if (this.length > 0 && !this.intersect()) {
                if (this.length > 1) {
                    const minRight = this.reduce((a, b) => Math.min(a, b.linear.right), Number.MAX_VALUE);
                    return !this.some(item => (item.linear.left >= minRight));
                }
                return true;
            }
            return false;
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

        static is(nodes) {
            return (nodes != null && nodes instanceof NodeList);
        }
    }

    const NODE_CACHE = new NodeList();

    function getRTL(value) {
        if (SETTINGS.useRTL && SETTINGS.targetAPI >= BUILD_ANDROID.JELLYBEAN_1) {
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

    function writeFrameLayout(node, parent) {
        return renderViewLayout(node, parent, WIDGET_ANDROID.FRAME);
    }

    function writeLinearLayout(node, parent, vertical) {
        node.android('orientation', (vertical ? 'vertical' : 'horizontal'));
        return renderViewLayout(node, parent, WIDGET_ANDROID.LINEAR);
    }

    function writeRelativeLayout(node, parent) {
        return renderViewLayout(node, parent, WIDGET_ANDROID.RELATIVE);
    }

    function writeConstraintLayout(node, parent) {
        return renderViewLayout(node, parent, WIDGET_ANDROID.CONSTRAINT);
    }

    function writeGridLayout(node, parent, columnCount = 2) {
        node.android('columnCount', columnCount);
        return renderViewLayout(node, parent, WIDGET_ANDROID.GRID);
    }

    function writeDefaultLayout(node, parent) {
        if (SETTINGS.useConstraintLayout || node.flex.enabled) {
            return writeConstraintLayout(node, parent);
        }
        else {
            return writeRelativeLayout(node, parent);
        }
    }

    function renderViewLayout(node, parent, tagName) {
        let preXml = '';
        let postXml = '';
        let renderParent = parent;
        node.setAndroidId(tagName);
        if (node.overflow != 0) {
            const scrollView = [];
            if (node.overflowX) {
                scrollView.push(WIDGET_ANDROID.SCROLL_HORIZONTAL);
            }
            if (node.overflowY) {
                scrollView.push((node.ascend().some(item => item.overflow != 0) ? WIDGET_ANDROID.SCROLL_NESTED : WIDGET_ANDROID.SCROLL_VERTICAL));
            }
            let current = node;
            let scrollDepth = parent.renderDepth + scrollView.length;
            scrollView
                .map((widgetName, index) => {
                    const wrapNode = Node.createWrapNode(generateNodeId(), current, null, [current], SETTINGS.targetAPI);
                    wrapNode.setAndroidId(widgetName);
                    wrapNode.setBounds();
                    wrapNode.android('fadeScrollbars', 'false');
                    wrapNode.setAttributes();
                    NODE_CACHE.push(wrapNode);
                    switch (widgetName) {
                        case WIDGET_ANDROID.SCROLL_HORIZONTAL:
                            wrapNode
                                .css('width', node.styleMap.width)
                                .css('minWidth', node.styleMap.minWidth)
                                .css('overflowX', node.styleMap.overflowX);
                            break;
                        default:
                            wrapNode
                                .css('height', node.styleMap.height)
                                .css('minHeight', node.styleMap.minHeight)
                                .css('overflowY', node.styleMap.overflowY);
                            break;
                    }
                    const indent = padLeft(scrollDepth--);
                    preXml = indent + `<${widgetName}{@${wrapNode.id}}>\n` + preXml;
                    postXml += indent + `</${widgetName}>\n`;
                    if (current == node) {
                        node.parent = wrapNode;
                        renderParent = wrapNode;
                    }
                    current = wrapNode;
                    return wrapNode;
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
        node.setAttributes();
        node.applyCustomizations();
        node.render(renderParent);
        node.setGravity();
        return getEnclosingTag(node.renderDepth, tagName, node.id, `{${node.id}}`, insertGridSpace(node), preXml, postXml);
    }

    function renderViewTag(node, parent, tagName, recursive = false) {
        const element = node.element;
        let preXml = '';
        let postXml = '';
        node.setAndroidId(tagName);
        switch (node.widgetName) {
            case WIDGET_ANDROID.EDIT:
                node.android('inputType', 'text');
                break;
            case WIDGET_ANDROID.BUTTON:
                if (node.viewWidth == 0) {
                    node.android('minWidth', '0px');
                }
                if (node.viewHeight == 0) {
                    node.android('minHeight', '0px');
                }
                break;
        }
        if (node.overflow != 0) {
            let scrollbars = [];
            if (node.overflowX) {
                scrollbars.push('horizontal');
            }
            if (node.overflowY) {
                scrollbars.push('vertical');
            }
            node.android('scrollbars', scrollbars.join('|'));
        }
        switch (element.tagName) {
            case 'IMG':
                const image = element.src.substring(element.src.lastIndexOf('/') + 1);
                const format = image.substring(image.lastIndexOf('.') + 1).toLowerCase();
                let src = image.replace(/.\w+$/, '');
                switch (format) {
                    case 'bmp':
                    case 'gif':
                    case 'jpg':
                    case 'png':
                    case 'webp':
                        src = insertResourceAsset(RESOURCE['image'], src, element.src);
                        break;
                    default:
                        src = `(UNSUPPORTED: ${image})`;
                }
                node.androidSrc = src;
                break;
            case 'TEXTAREA':
                node.android('minLines', 2);
                if (element.rows > 2) {
                    node.android('maxLines', element.rows);
                }
                if (element.maxlength != null) {
                    node.android('maxLength', parseInt(element.maxlength));
                }
                node.android('hint', element.placeholder)
                    .android('scrollbars', 'vertical')
                    .android('inputType', 'textMultiLine');
                if (node.styleMap.overflowX == 'scroll') {
                    node.android('scrollHorizontally', 'true');
                }
                break;
        }
        switch (element.type) {
            case 'password':
                node.android('inputType', 'textPassword');
                break;
        }
        node.setAttributes();
        node.applyCustomizations();
        if (node.visible) {
            node.render(parent);
            node.setGravity();
            node.cascade().forEach(item => item.hide());
            return getEnclosingTag(node.renderDepth, node.widgetName, node.id, '', insertGridSpace(node));
        }
    }

    function getEnclosingTag(depth, tagName, id, content, space = ['', ''], preXml = '', postXml = '') {
        const indent = padLeft(depth);
        let xml = space[0] +
                  preXml;
        if (hasValue(content)) {
            xml += indent + `<${tagName}{@${id}}>\n` +
                            content +
                   indent + `</${tagName}>\n`;
        }
        else {
            xml += indent + `<${tagName}{@${id}} />\n`;
        }
        xml += postXml +
               space[1];
        return xml;
    }

    function insetAttributes(output) {
        for (const node of NODE_CACHE) {
            node.setAndroidDimensions();
            output = output.replace(`{@${node.id}}`, getViewAttributes(node));
        }
        return output;
    }

    function setNodePosition(current, name, adjacent) {
        const value = (adjacent.androidId != 'parent' ? adjacent.stringId : 'parent');
        if (current.renderParent.isView(WIDGET_ANDROID.CONSTRAINT)) {
            current.app(name, value, false);
        }
        else {
            current.android(name, value, false);
        }
    }

    function setConstraints() {
        const LAYOUT_MAP = {
            relative: {
                top: 'layout_alignTop',
                right: getRTL('layout_alignRight'),
                bottom: 'layout_alignBottom',
                left: getRTL('layout_alignLeft'),
                baseline: 'layout_alignBaseline',
                bottomTop: 'layout_above',
                topBottom: 'layout_below',
                rightLeft: getRTL('layout_toLeftOf'),
                leftRight: getRTL('layout_toRightOf'),
                parentLeft: getRTL('layout_alignParentLeft'),
                parentRight: getRTL('layout_alignParentRight'),
                parentTop: 'layout_alignParentTop',
                parentBottom: 'layout_alignParentBottom'
            },
            constraint: {
                top: 'layout_constraintTop_toTopOf',
                right: getRTL('layout_constraintRight_toRightOf'),
                bottom: 'layout_constraintBottom_toBottomOf',
                left: getRTL('layout_constraintLeft_toLeftOf'),
                baseline: 'layout_constraintBaseline_toBaselineOf',
                bottomTop: 'layout_constraintBottom_toTopOf',
                topBottom: 'layout_constraintTop_toBottomOf',
                rightLeft: getRTL('layout_constraintRight_toLeftOf'),
                leftRight: getRTL('layout_constraintLeft_toRightOf')
            }
        };
        for (const node of NODE_CACHE) {
            const constraint = node.isView(WIDGET_ANDROID.CONSTRAINT);
            const relative = node.isView(WIDGET_ANDROID.RELATIVE);
            const flex = node.flex;
            const LAYOUT = LAYOUT_MAP[(relative ? 'relative' : 'constraint')];
            if (constraint || relative || flex.enabled) {
                const nodes = node.renderChildren;
                if (!flex.enabled) {
                    node.expandToFit();
                    for (const current of nodes) {
                        if (withinRange(parseFloat(current.horizontalBias), 0.5, 0.01) && withinRange(parseFloat(current.verticalBias), 0.5, 0.01)) {
                            if (constraint) {
                                current
                                    .app(LAYOUT['top'], 'parent')
                                    .app(LAYOUT['right'], 'parent')
                                    .app(LAYOUT['bottom'], 'parent')
                                    .app(LAYOUT['left'], 'parent')
                                    .app('layout_constraintHorizontal_bias', 0.5)
                                    .app('layout_constraintVertical_bias', 0.5);
                            }
                            else {
                                current.android('layout_centerInParent', 'true');
                            }
                            node.constraint.layoutWidth = true;
                            node.constraint.layoutHeight = true;
                            current.constraint.horizontal = true;
                            current.constraint.vertical = true;
                        }
                    }
                    nodes.unshift(node);
                    for (let current of nodes) {
                        for (let adjacent of nodes) {
                            if (current == adjacent || (relative && current == node)) {
                                continue;
                            }
                            else if (relative && adjacent == node) {
                                if (current.linear.left == node.box.left) {
                                    current
                                        .android(LAYOUT['parentLeft'], 'true')
                                        .constraint.horizontal = true;
                                }
                                else if (current.linear.right == node.box.right) {
                                    current
                                        .android(LAYOUT['parentRight'], 'true')
                                        .constraint.horizontal = true;
                                }
                                if (current.linear.top == node.box.top) {
                                    current
                                        .android(LAYOUT['parentTop'], 'true')
                                        .constraint.vertical = true;
                                }
                                else if (current.linear.bottom == node.box.bottom) {
                                    current
                                        .android(LAYOUT['parentBottom'], 'true')
                                        .constraint.vertical = true;
                                }
                            }
                            else {
                                let parent = false;
                                let dimension = 'linear';
                                if (current == node || adjacent == node) {
                                    if (current == node) {
                                        current = adjacent;
                                    }
                                    adjacent = Object.assign({}, node);
                                    adjacent.androidId = 'parent';
                                    dimension = 'box';
                                    parent = true;
                                }
                                const withinY = (adjacent.androidId != 'parent' && current.withinY(adjacent.linear));
                                if (!current.constraint.horizontal) {
                                    if (withinFraction(current.linear.right, adjacent[dimension].left) || (withinY && withinRange(current.linear.right, adjacent[dimension].left, SETTINGS.whitespaceHorizontalOffset))) {
                                        setNodePosition(current, LAYOUT['rightLeft'], adjacent);
                                        if (parent) {
                                            current.constraint.horizontal = true;
                                        }
                                    }
                                    else if (withinFraction(current.linear.left, adjacent[dimension].right) || (withinY && withinRange(current.linear.left, adjacent[dimension].right, SETTINGS.whitespaceHorizontalOffset))) {
                                        setNodePosition(current, LAYOUT['leftRight'], adjacent);
                                        if (parent) {
                                            current.constraint.horizontal = true;
                                        }
                                    }
                                    if (current.linear.left == adjacent[dimension].left) {
                                        setNodePosition(current, LAYOUT['left'], adjacent);
                                        if (parent) {
                                            current.constraint.horizontal = true;
                                        }
                                    }
                                    else if (current.linear.right == adjacent[dimension].right) {
                                        setNodePosition(current, LAYOUT['right'], adjacent);
                                        if (parent) {
                                            current.constraint.horizontal = true;
                                        }
                                    }
                                }
                                if (!current.constraint.vertical) {
                                    if (!parent) {
                                        if (current.linear.bottom == adjacent.linear.top) {
                                            setNodePosition(current, LAYOUT['bottomTop'], adjacent);
                                        }
                                        else if (current.linear.top == adjacent.linear.bottom) {
                                            setNodePosition(current, LAYOUT['topBottom'], adjacent);
                                        }
                                    }
                                    if (current.linear.top == adjacent[dimension].top) {
                                        if (!parent && current.isView(WIDGET_ANDROID.TEXT) && adjacent.isView(WIDGET_ANDROID.TEXT) && current.style.verticalAlign == 'baseline' && adjacent.style.verticalAlign == 'baseline') {
                                            setNodePosition(current, LAYOUT['baseline'], adjacent);
                                        }
                                        else {
                                            setNodePosition(current, LAYOUT['top'], adjacent);
                                        }
                                        if (parent) {
                                            current.constraint.vertical = true;
                                        }
                                    }
                                    else if (current.linear.bottom == adjacent[dimension].bottom) {
                                        setNodePosition(current, LAYOUT['bottom'], adjacent);
                                        if (parent) {
                                            current.constraint.vertical = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    nodes.shift();
                    const anchored = ['parent', ...nodes.filter(item => (item.anchors == 2)).map(item => item.stringId)];
                    do {
                        let restart = false;
                        for (const current of nodes) {
                            if (!anchored.includes(current.stringId)) {
                                const result = (constraint ? search(current.app(), '*constraint*') : search(current.android(), LAYOUT));
                                if (result.length > 1) {
                                    const anchors = [];
                                    for (let i = 0; i < result.length; i++) {
                                        const item = result[i];
                                        if (anchored.includes(item[1])) {
                                            anchors.push(item);
                                        }
                                    }
                                    if (anchors.length >= 2) {
                                        anchored.push(current.stringId);
                                        if (constraint) {
                                            current.delete('app', '*constraint*');
                                        }
                                        else {
                                            current.delete('android', LAYOUT);
                                        }
                                        for (let i = 0; i < anchors.length; i++) {
                                            current[(constraint ? 'app' : 'android')].apply(current, anchors[i]);
                                        }
                                        restart = true;
                                    }
                                }
                            }
                        }
                        if (!restart) {
                            break;
                        }
                    }
                    while (true)
                    for (const current of nodes) {
                        if (!anchored.includes(current.stringId)) {
                            if (constraint) {
                                current.delete('app', '*constraint*');
                            }
                            else {
                                current.delete('android', LAYOUT);
                            }
                        }
                    }
                }
                if (flex.enabled || (constraint && SETTINGS.useConstraintChain && !nodes.intersect())) {
                    const CHAIN_MAP = {
                        chain: ['horizontalChain', 'verticalChain'],
                        leftTop: ['left', 'top'],
                        rightBottom: ['right', 'bottom'],
                        rightLeftBottomTop: ['rightLeft', 'bottomTop'],
                        leftRightTopBottom: ['leftRight', 'topBottom'],
                        widthHeight: ['Width', 'Height'],
                        horizontalVertical: ['Horizontal', 'Vertical']
                    };
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
                        flexNodes = [{ constraint: { horizontalChain, verticalChain }}];
                    }
                    else {
                        nodes.forEach(current => {
                            let horizontalChain = nodes.filter(item => (item != current && same(current, item, 'bounds.top')));
                            if (horizontalChain.length == 0) {
                                horizontalChain = nodes.filter(item => (item != current && same(current, item, 'bounds.bottom')));
                            }
                            if (horizontalChain.length > 0) {
                                horizontalChain.sortAsc('bounds.x');
                            }
                            let verticalChain = nodes.filter(item => (item != current && same(current, item, 'bounds.left')));
                            if (verticalChain.length == 0) {
                                verticalChain = nodes.filter(item => (item != current && same(current, item, 'bounds.right')));
                            }
                            if (verticalChain.length > 0) {
                                verticalChain.sortAsc('bounds.y');
                            }
                            current.constraint.horizontalChain = horizontalChain;
                            current.constraint.verticalChain = verticalChain;
                        });
                    }
                    CHAIN_MAP.chain.forEach((value, index) => {
                        const chainNodes = flexNodes || nodes.slice().sort((a, b) => (a.constraint[value].length >= b.constraint[value].length ? -1 : 1));
                        chainNodes.forEach(current => {
                            const chainDirection = current.constraint[value];
                            if (chainDirection != null && (flex.enabled || (chainDirection.length > 1 && chainDirection.map(item => parseInt((item.constraint[value] || [{ id: 0 }]).map(chain => chain.id).join(''))).reduce((a, b) => (a == b ? a : 0)) > 0))) {
                                chainDirection.parent = node;
                                const HV = CHAIN_MAP['horizontalVertical'][index];
                                const VH = CHAIN_MAP['horizontalVertical'][(index == 0 ? 1 : 0)];
                                const WH = CHAIN_MAP['widthHeight'][index];
                                const LAYOUT_WH = `layout_${WH.toLowerCase()}`;
                                const leftTop = CHAIN_MAP['leftTop'][index];
                                const rightBottom = CHAIN_MAP['rightBottom'][index];
                                const firstNode = chainDirection.first;
                                const lastNode = chainDirection.last;
                                firstNode
                                    .app(LAYOUT[leftTop], 'parent')
                                    .constraint[HV.toLowerCase()] = true;
                                lastNode
                                    .app(LAYOUT[rightBottom], 'parent')
                                    .constraint[HV.toLowerCase()] = true;
                                let maxOffset = -1;
                                const unassigned = new NodeList();
                                for (let i = 0; i < chainDirection.length; i++) {
                                    const chain = chainDirection[i];
                                    const chainNext = chainDirection[i + 1];
                                    const chainPrev = chainDirection[i - 1];
                                    const chainWidthHeight = chain.styleMap[LAYOUT_WH];
                                    if (chainNext != null) {
                                        chain.app(LAYOUT[CHAIN_MAP['rightLeftBottomTop'][index]], chainNext.stringId);
                                        maxOffset = Math.max(chainNext.linear[leftTop] - chain.linear[rightBottom], maxOffset);
                                    }
                                    if (chainPrev != null) {
                                        chain.app(LAYOUT[CHAIN_MAP['leftRightTopBottom'][index]], chainPrev.stringId);
                                    }
                                    if (chain[`view${WH}`] == null) {
                                        chain.android(LAYOUT_WH, '0px');
                                        const min = chain.styleMap[`min${WH}`];
                                        const max = chain.styleMap[`max${WH}`];
                                        if (min != null) {
                                            chain.app(`layout_constraint${WH}_min`, convertToPX(min));
                                        }
                                        if (max != null) {
                                            chain.app(`layout_constraint${WH}_max`, convertToPX(max));
                                        }
                                        else {
                                            unassigned.push(chain);
                                        }
                                    }
                                    if (flex.enabled) {
                                        const CONSTRAINT = LAYOUT_MAP.constraint;
                                        const LAYOUT_VH = VH.toLowerCase();
                                        chain.app(`layout_constraint${HV}_weight`, chain.flex.grow);
                                        if (chain[`view${WH}`] == null && chain.flex.grow == 0 && chain.flex.shrink <= 1) {
                                            chain.android(LAYOUT_WH, 'wrap_content');
                                        }
                                        else if (chain.flex.grow > 0) {
                                            chain.android(LAYOUT_WH, '0px');
                                        }
                                        if (chain.flex.shrink == 0) {
                                            chain.app(`layout_constrained${WH}`, 'true');
                                        }
                                        switch (chain.flex.alignSelf) {
                                            case 'flex-start':
                                                chain
                                                    .app((index == 0 ? CONSTRAINT['top'] : getRTL(CONSTRAINT['left'])), 'parent')
                                                    .constraint[LAYOUT_VH] = true;
                                                break;
                                            case 'flex-end':
                                                chain
                                                    .app((index == 0 ? CONSTRAINT['bottom'] : getRTL(CONSTRAINT['right'])), 'parent')
                                                    .constraint[LAYOUT_VH] = true;
                                                break;
                                            case 'baseline':
                                                chain
                                                    .app(CONSTRAINT['baseline'], 'parent')
                                                    .constraint.vertical = true;
                                                break;
                                            case 'center':
                                            case 'stretch':
                                                if (chain.flex.alignSelf == 'center') {
                                                    chain.app(`layout_constraint${VH}_bias`, 0.5);
                                                }
                                                else {
                                                    chain.android(`layout_${CHAIN_MAP['widthHeight'][(index == 0 ? 1 : 0)].toLowerCase()}`, '0px');
                                                }
                                                chain
                                                    .app(CONSTRAINT[(index == 0 ? 'top' : 'left')], 'parent')
                                                    .app(CONSTRAINT[(index == 0 ? 'bottom' : 'right')], 'parent')
                                                    .constraint[LAYOUT_VH] = true;
                                                break;
                                        }
                                        if (chain.flex.basis != 'auto') {
                                            if (/(100|[1-9][0-9]?)%/.test(chain.flex.basis)) {
                                                chain.app(`layout_constraint${WH}_percent`, parseInt(chain.flex.basis));
                                            }
                                            else {
                                                const width = convertToPX(chain.flex.basis);
                                                if (width != '0px') {
                                                    chain.app(`layout_constraintWidth_min`, width);
                                                }
                                            }
                                        }
                                    }
                                }
                                const chainStyle = `layout_constraint${HV}_chainStyle`;
                                if (flex.enabled && flex.justifyContent != 'normal' && chainDirection.reduce((a, b) => Math.max(a, b.flex.grow), -1) == 0) {
                                    switch (flex.justifyContent) {
                                        case 'space-between':
                                            firstNode.app(chainStyle, 'spread_inside');
                                            unassigned.android(LAYOUT_WH, 'wrap_content');
                                            break;
                                        case 'space-evenly':
                                            setConstraintPercent(node, chainDirection, (index == 0));
                                            break;
                                        case 'space-around':
                                            firstNode.app(chainStyle, 'spread');
                                            chainDirection.forEach(item => item.app(`layout_constraint${HV}_weight`, item.flex.grow || 1));
                                            unassigned.android(LAYOUT_WH, 'wrap_content');
                                            break;
                                        default:
                                            let bias = 0.5;
                                            let justifyContent = flex.justifyContent;
                                            if (flex.direction == 'row-reverse' || flex.direction == 'column-reverse') {
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
                                                .app(`layout_constraint${HV}_bias`, bias, false);
                                            unassigned.android(LAYOUT_WH, 'wrap_content');
                                    }
                                }
                                else {
                                    if (withinFraction(node.box.left, firstNode.linear.left) && withinFraction(lastNode.linear.right, node.box.right)) {
                                        firstNode.app(chainStyle, 'spread_inside');
                                    }
                                    else if (maxOffset <= SETTINGS[`chainPacked${HV}Offset`]) {
                                        firstNode
                                            .app(chainStyle, 'packed')
                                            .app(`layout_constraint${HV}_bias`, chainDirection[`${HV.toLowerCase()}Bias`]);
                                        unassigned.android(LAYOUT_WH, 'wrap_content');
                                    }
                                    else {
                                        setConstraintPercent(node, chainDirection, (index == 0));
                                    }
                                    if (!flex.enabled) {
                                        chainDirection.forEach(item => {
                                            item.constraint.horizontalChain = [];
                                            item.constraint.verticalChain = [];
                                        });
                                    }
                                }
                            }
                        });
                    });
                }
                if (!flex.enabled) {
                    const anchored = nodes.filter(item => (item.anchors == 2));
                    if (constraint) {
                        if (anchored.length == 0) {
                            const unbound = nodes.reduce((a, b) => (a.anchors >= b.anchors ? a : b), nodes[0]);
                            unbound.delete('app', '*constraint*');
                            unbound
                                .delete('app', LAYOUT['left'], LAYOUT['right'])
                                .app(LAYOUT['left'], 'parent')
                                .app(LAYOUT['right'], 'parent')
                                .app('layout_constraintHorizontal_bias', unbound.horizontalBias)
                                .constraint.horizontal = true;
                            unbound
                                .delete('app', LAYOUT['top'], LAYOUT['bottom'], LAYOUT['baseline'])
                                .app(LAYOUT['top'], 'parent')
                                .app(LAYOUT['bottom'], 'parent')
                                .app('layout_constraintVertical_bias', unbound.verticalBias)
                                .constraint.vertical = true;
                            anchored.push(unbound);
                            node.constraint.layoutWidth = true;
                            node.constraint.layoutHeight = true;
                        }
                    }
                    do {
                        let restart = false;
                        nodes.forEach(current => {
                            if (current.anchors < 2) {
                                const result = (constraint ? search(current.app(), '*constraint*') : search(current.android(), LAYOUT));
                                for (const [key, value] of result) {
                                    if (value != 'parent') {
                                        if (anchored.find(anchor => anchor.stringId == value) != null) {
                                            if (!current.constraint.horizontal && indexOf(key, getRTL('Left'), getRTL('Right')) != -1) {
                                                current.constraint.horizontal = true;
                                            }
                                            if (!current.constraint.vertical && indexOf(key, 'Top', 'Bottom', 'Baseline', 'above', 'below') != -1) {
                                                current.constraint.vertical = true;
                                            }
                                        }
                                    }
                                }
                                if (current.anchors == 2) {
                                    anchored.push(current);
                                    restart = true;
                                }
                            }
                        });
                        if (!restart) {
                            break;
                        }
                    }
                    while (true)
                    if (constraint) {
                        nodes.forEach(opposite => {
                            if (opposite.anchors < 2) {
                                const adjacent = nodes.find(item => (item.anchors == 2));
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
                                    .delete('app', 'layout_constraint*')
                                    .app('layout_constraintCircle', adjacent.stringId)
                                    .app('layout_constraintCircleRadius', `${radius}px`)
                                    .app('layout_constraintCircleAngle', degrees);
                                opposite.constraint.vertical = true;
                                opposite.constraint.horizontal = true;
                            }
                        });
                        for (const current of nodes) {
                            if (current.app(LAYOUT['right']) == 'parent') {
                                node.constraint.layoutWidth = true;
                            }
                            if (current.app(LAYOUT['bottom']) == 'parent') {
                                node.constraint.layoutHeight = true;
                            }
                        }
                    }
                    else {
                        for (const current of nodes) {
                            if (!anchored.includes(current)) {
                                current.delete('android', LAYOUT);
                                current
                                    .android(LAYOUT['parentTop'], 'true')
                                    .android(LAYOUT['parentLeft'], 'true');
                                const top = `${Math.floor(current.bounds.top - node.box.top)}px`;
                                const left = `${Math.floor(current.bounds.left - node.box.left)}px`;
                                current
                                    .css('marginTop', top)
                                    .css(getRTL('marginLeft'), left)
                                    .android('layout_marginTop', top)
                                    .android(getRTL('layout_marginLeft'), left);
                                current.constraint.vertical = true;
                                current.constraint.horizontal = true;
                            }
                            if (current.android(LAYOUT['parentRight']) != null) {
                                node.constraint.layoutWidth = true;
                            }
                            if (current.android(LAYOUT['parentBottom']) != null) {
                                node.constraint.layoutHeight = true;
                            }
                        }
                    }
                }
            }
        }
    }

    function setConstraintPercent(parent, nodes, width, full) {
        nodes[0].app(`layout_constraint${(width ? 'Horizontal' : 'Vertical')}_chainStyle`, 'spread');
        let percentTotal = 0;
        for (let i = 0; i < nodes.length; i++) {
            const chain = nodes[i];
            const chainPrev = nodes[i - 1];
            let percent = ((chain.linear.right - parent.box.left) - (chainPrev != null ? chainPrev.linear.right - parent.box.left : 0)) / parent.box.width;
            percent = (full && i == nodes.length - 1 ? 1 - percentTotal : parseFloat(percent.toFixed(2)));
            chain
                .android(`layout_${(width ? 'width' : 'height')}`, '0px')
                .app(`layout_constraint${(width ? 'Width' : 'Height')}_percent`, percent);
            percentTotal += percent;
        }
    }

    function insertGridSpace(node) {
        let preXml = '';
        let postXml = '';
        if (node.parent.isView(WIDGET_ANDROID.GRID)) {
            const dimensions = getBoxSpacing(node.parentOriginal, SETTINGS.useRTL, true);
            if (node.gridFirst) {
                const heightTop = dimensions.paddingTop + dimensions.marginTop;
                if (heightTop > 0) {
                    preXml += getSpaceTag(node.renderDepth, 'match_parent', convertToPX(heightTop), node.renderParent.gridColumnCount, 1);
                }
            }
            if (node.gridRowStart) {
                let marginLeft = dimensions[getRTL('marginLeft')] + dimensions[getRTL('paddingLeft')];
                if (marginLeft > 0) {
                    marginLeft = convertToPX(marginLeft + node.marginLeft);
                    node.android(getRTL('layout_marginLeft'), marginLeft)
                        .css('marginLeft', marginLeft);
                }
            }
            if (node.gridRowEnd) {
                const heightBottom = dimensions.marginBottom + dimensions.paddingBottom + (!node.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
                let marginRight = dimensions[getRTL('marginRight')] + dimensions[getRTL('paddingRight')];
                if (heightBottom > 0) {
                    postXml += getSpaceTag(node.renderDepth, 'match_parent', convertToPX(heightBottom), node.renderParent.gridColumnCount, 1);
                }
                if (marginRight > 0) {
                    marginRight = convertToPX(marginRight + node.marginRight);
                    node.android(getRTL('layout_marginRight'), marginRight)
                        .css('marginRight', marginRight);
                }
            }
        }
        return [preXml, postXml];
    }

    function getSpaceTag(depth, width, height, columnSpan, columnWeight = 0) {
        let attributes = '';
        if (SETTINGS.showAttributes) {
            const node = new Node(0, null, SETTINGS.targetAPI);
            node.android('layout_width', width)
                .android('layout_height', height)
                .android('layout_columnSpan', columnSpan)
                .android('layout_columnWeight', columnWeight);
            const indent = padLeft(depth + 1);
            for (const attr of node.combine()) {
                attributes += `\n${indent + attr}`;
            }
        }
        return getEnclosingTag(depth, WIDGET_ANDROID.SPACE, 0, '').replace('{@0}', attributes);
    }

    function deleteStyleAttribute(sorted, attributes, nodeIds) {
        attributes.split(';').forEach(value => {
            for (let i = 0; i < sorted.length; i++) {
                if (sorted[i] != null) {
                    let index = -1;
                    let key = '';
                    for (const j in sorted[i]) {
                        if (j == value) {
                            index = i;
                            key = j;
                            i = sorted.length;
                            break;
                        }
                    }
                    if (index != -1) {
                        sorted[index][key] = sorted[index][key].filter(value => !nodeIds.includes(value));
                        if (sorted[index][key].length == 0) {
                            delete sorted[index][key];
                        }
                        break;
                    }
                }
            }
        });
    }

    function setStyleMap() {
        for (const styleSheet of document.styleSheets) {
            for (const rule of styleSheet.rules) {
                const elements = document.querySelectorAll(rule.selectorText);
                const attributes = new Set();
                for (const i of rule.styleMap) {
                    attributes.add(hyphenToCamelCase(i[0]));
                }
                for (const element of elements) {
                    for (const i of element.style) {
                        attributes.add(hyphenToCamelCase(i));
                    }
                    const style = getStyle(element);
                    const styleMap = {};
                    for (const name of attributes) {
                        if (name.toLowerCase().indexOf('color') != -1) {
                            const color = getByColorName(rule.style[name]);
                            if (color != null) {
                                rule.style[name] = convertToRGB(color);
                            }
                        }
                        if (hasValue(element.style[name])) {
                            styleMap[name] = element.style[name];
                        }
                        else if (style[name] == rule.style[name]) {
                            styleMap[name] = style[name];
                        }
                    }
                    element.styleMap = styleMap;
                }
            }
        }
    }

    function setResourceStyle() {
        const cache = {};
        const style = {};
        const layout = {};
        for (const node of NODE_CACHE) {
            if (node.styleAttributes.length > 0) {
                if (cache[node.tagName] == null) {
                    cache[node.tagName] = [];
                }
                cache[node.tagName].push(node);
            }
        }
        for (const tag in cache) {
            const nodes = cache[tag];
            let sorted = Array.from({ length: nodes.reduce((a, b) => Math.max(a, b.styleAttributes.length), 0) }, value => value = {});
            for (const node of nodes) {
                for (let i = 0; i < node.styleAttributes.length; i++) {
                    const attr = parseStyleAttribute(node.styleAttributes[i]);
                    if (sorted[i][attr] == null) {
                        sorted[i][attr] = [];
                    }
                    sorted[i][attr].push(node.id);
                }
            }
            style[tag] = {};
            layout[tag] = {};
            do {
                if (sorted.length == 1) {
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
                            if (ids == null) {
                                continue;
                            }
                            else if (ids.length == nodes.length) {
                                styleKey[attr1] = ids;
                                sorted[i] = null;
                                revalidate = true;
                            }
                            else if (ids.length == 1) {
                                layoutKey[attr1] = ids;
                                sorted[i] = null;
                                revalidate = true;
                            }
                            if (!revalidate) {
                                const found = {};
                                for (let j = 0; j < sorted.length; j++) {
                                    if (i != j) {
                                        for (const attr in sorted[j]) {
                                            const compare$$1 = sorted[j][attr];
                                            for (let k = 0; k < ids.length; k++) {
                                                if (compare$$1.includes(ids[k])) {
                                                    if (found[attr] == null) {
                                                        found[attr] = [];
                                                    }
                                                    found[attr].push(ids[k]);
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
                                if (attr1 != attr2 && filtered[attr1].join('') == filtered[attr2].join('')) {
                                    const shared = filtered[attr1].join(',');
                                    if (combined[shared] != null) {
                                        combined[shared] = new Set([...combined[shared], ...attr2.split(';')]);
                                    }
                                    else {
                                        combined[shared] = new Set([...attr1.split(';'), ...attr2.split(';')]);
                                    }
                                    deleteKeys.add(attr1).add(attr2);
                                }
                            }
                        }
                        deleteKeys.forEach(value => delete filtered[value]);
                        for (const attributes in filtered) {
                            deleteStyleAttribute(sorted, attributes, filtered[attributes]);
                            style[tag][attributes] = filtered[attributes];
                        }
                        for (const ids in combined) {
                            const attributes = Array.from(combined[ids]).sort().join(';');
                            const nodeIds = ids.split(',').map(id => parseInt(id));
                            deleteStyleAttribute(sorted, attributes, nodeIds);
                            style[tag][attributes] = nodeIds;
                        }
                    }
                    const combined = Object.keys(styleKey);
                    if (combined.length > 0) {
                        style[tag][combined.join(';')] = styleKey[combined[0]];
                    }
                    for (const attribute in layoutKey) {
                        layout[tag][attribute] = layoutKey[attribute];
                    }
                    for (let i = 0; i < sorted.length; i++) {
                        if (sorted[i] != null && Object.keys(sorted[i]).length == 0) {
                            delete sorted[i];
                        }
                    }
                    sorted = sorted.filter(item => item);
                }
            }
            while (sorted.length > 0)
        }
        const resource = new Map();
        for (const name in style) {
            const tag = style[name];
            const tagData = [];
            for (const attributes in tag) {
                tagData.push({ attributes, ids: tag[attributes]});
            }
            tagData.sort((a, b) => {
                let [c, d] = [a.ids.length, b.ids.length];
                if (c == d) {
                    [c, d] = [a.attributes.split(';').length, b.attributes.split(';').length];
                }
                return (c >= d ? -1 : 1);
            });
            tagData.forEach((item, index) => item.name = `${name.charAt(0) + name.substring(1).toLowerCase()}_${(index + 1)}`);
            resource.set(name, tagData);
        }
        const inherit = new Set();
        for (const node of NODE_CACHE) {
            if (node.visible) {
                const tagName = node.tagName;
                if (resource.has(tagName)) {
                    const styles = [];
                    for (const tag of resource.get(tagName)) {
                        if (tag.ids.includes(node.id)) {
                            styles.push(tag.name);
                        }
                    }
                    if (styles.length > 0) {
                        inherit.add(styles.join('.'));
                        node.androidStyle = styles.pop();
                        if (node.androidStyle != '') {
                            node.attr(`style="@style/${node.androidStyle}"`);
                        }
                    }
                }
                const tag = layout[tagName];
                if (tag != null) {
                    for (const attr in tag) {
                        if (tag[attr].includes(node.id)) {
                            node.attr((SETTINGS.useUnitDP ? insetToDP(attr, SETTINGS.density, true) : attr));
                        }
                    }
                }
            }
        }
        inherit.forEach(styles => {
            let parent = null;
            styles.split('.').forEach((value, index) => {
                const match = value.match(/^(\w+)_([0-9]+)$/);
                if (match != null) {
                    const style = resource.get(match[1].toUpperCase())[parseInt(match[2] - 1)];
                    RESOURCE['style'].set(value, { parent, attributes: style.attributes });
                    parent = value;
                }
            });
        });
    }

    function setAccessibility() {
        for (const node of NODE_CACHE) {
            if (node.visible) {
                switch (node.widgetName) {
                    case WIDGET_ANDROID.EDIT:
                        let parent = node.renderParent;
                        let current = node;
                        let label = null;
                        while (parent != null && typeof parent == 'object') {
                            const index = parent.renderChildren.findIndex(item => item == current);
                            if (index > 0) {
                                label = parent.renderChildren[index - 1];
                                break;
                            }
                            current = parent;
                            parent = parent.renderParent;
                        }
                        if (label != null && label.isView(WIDGET_ANDROID.TEXT)) {
                            label.android('labelFor', node.stringId);
                        }
                    case WIDGET_ANDROID.SPINNER:
                    case WIDGET_ANDROID.CHECKBOX:
                    case WIDGET_ANDROID.RADIO:
                    case WIDGET_ANDROID.BUTTON:
                        node.android('focusable', 'true');
                        break;
                }
            }
        }
    }

    function setMarginPadding() {
        for (const node of NODE_CACHE) {
            if (node.isView(WIDGET_ANDROID.LINEAR, WIDGET_ANDROID.RADIO_GROUP)) {
                if (node.android('orientation') == 'vertical') {
                    let current = node.box.top + node.paddingTop;
                    node.renderChildren.sortAsc('linear.top').forEach(item => {
                        const height = Math.ceil(item.linear.top - current);
                        if (height > 0) {
                            item.android('layout_marginTop', `${node.marginTop + height}px`);
                        }
                        current = item.linear.bottom;
                    });
                }
                else {
                    let current = node.box.left + node.paddingLeft;
                    node.renderChildren.sortAsc('linear.left').forEach(item => {
                        if (!item.floating) {
                            const width = Math.ceil(item.linear.left - current);
                            if (width > 0) {
                                item.android(getRTL('layout_marginLeft'), `${node.marginLeft + width}px`);
                            }
                        }
                        current = (item.label || item).linear.right;
                    });
                }
            }
            if (SETTINGS.targetAPI >= BUILD_ANDROID.OREO) {
                if (node.visible) {
                    const marginLeft_RTL = getRTL('layout_marginLeft');
                    const marginRight_RTL = getRTL('layout_marginRight');
                    const paddingLeft_RTL = getRTL('paddingLeft');
                    const paddingRight_RTL = getRTL('paddingRight');
                    const marginTop = convertToInt(node.android('layout_marginTop'));
                    const marginRight = convertToInt(node.android(marginRight_RTL));
                    const marginBottom = convertToInt(node.android('layout_marginBottom'));
                    const marginLeft = convertToInt(node.android(marginLeft_RTL));
                    if (marginTop != 0 && marginTop == marginBottom && marginBottom == marginLeft && marginLeft == marginRight) {
                        node.delete('android', 'layout_margin*')
                            .android('layout_margin', `${marginTop}px`);
                    }
                    else {
                        if (marginTop != 0 && marginTop == marginBottom) {
                            node.delete('android', 'layout_marginTop', 'layout_marginBottom')
                                .android('layout_marginVertical', `${marginTop}px`);
                        }
                        if (marginLeft != 0 && marginLeft == marginRight) {
                            node.delete('android', marginLeft_RTL, marginRight_RTL)
                                .android('layout_marginHorizontal', `${marginLeft}px`);
                        }
                    }
                    const paddingTop = convertToInt(node.android('paddingTop'));
                    const paddingRight = convertToInt(node.android(paddingRight_RTL));
                    const paddingBottom = convertToInt(node.android('paddingBottom'));
                    const paddingLeft = convertToInt(node.android(paddingLeft_RTL));
                    if (paddingTop != 0 && paddingTop == paddingBottom && paddingBottom == paddingLeft && paddingLeft == paddingRight) {
                        node.delete('android', 'padding*')
                            .android('padding', `${paddingTop}px`);
                    }
                    else {
                        if (paddingTop != 0 && paddingTop == paddingBottom) {
                            node.delete('android', 'paddingTop', 'paddingBottom')
                                .android('paddingVertical', `${paddingTop}px`);
                        }
                        if (paddingLeft != 0 && paddingLeft == paddingRight) {
                            node.delete('android', paddingLeft_RTL, paddingRight_RTL)
                                .android('paddingHorizontal', `${paddingLeft}px`);
                        }
                    }
                }
            }
        }
    }

    function setLayoutWeight() {
        for (const node of NODE_CACHE) {
            const rows = node.linearRows;
            if (rows.length > 1) {
                const columnLength = rows[0].renderChildren.length;
                if (rows.reduce((a, b) => (a && a == b.renderChildren.length ? a: 0), columnLength) > 0) {
                    const horizontal = !node.isHorizontal();
                    const columnDimension = new Array(columnLength).fill(Number.MIN_VALUE);
                    rows.forEach(row => {
                        for (let i = 0; i < row.renderChildren.length; i++) {
                            columnDimension[i] = Math.max(row.renderChildren[i].linear[(horizontal ? 'width' : 'height')], columnDimension[i]);
                        }
                    });
                    const total = columnDimension.reduce((a, b) => a + b);
                    const percent = columnDimension.map(value => Math.floor((value * 100) / total));
                    percent[percent.length - 1] += 100 - percent.reduce((a, b) => a + b);
                    rows.forEach(row => {
                        for (let i = 0; i < row.renderChildren.length; i++) {
                            const column = row.renderChildren[i];
                            column
                                .android(`layout_${(horizontal ? 'width' : 'height')}`, '0px')
                                .android('layout_weight', (percent[i] / 100).toFixed(2));
                        }
                    });
                }
            }
        }
    }

    function generateNodeId() {
        return NODE_CACHE.length + 1;
    }

    function setNodeCache() {
        let nodeTotal = 0;
        document.body.childNodes.forEach(element => {
            if (element.nodeName == '#text') {
                if (element.textContent.trim() != '') {
                    nodeTotal++;
                }
            }
            else {
                if (isVisible(element)) {
                    nodeTotal++;
                }   
            }
        });
        const elements = document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *'));
        for (const i in elements) {
            const element = elements[i];
            if (INLINE_CHROME.includes(element.tagName) && (MAPPING_CHROME[element.parentNode.tagName] != null || INLINE_CHROME.includes(element.parentNode.tagName))) {
                continue;
            }
            
            if (isVisible(element)) {
                const node = new Node(generateNodeId(), element, SETTINGS.targetAPI);
                NODE_CACHE.push(node);
            }
        }
        const preAlignment = {};
        for (const node of NODE_CACHE) {
            preAlignment[node.id] = {};
            const style = preAlignment[node.id];
            switch (node.style.textAlign) {
                case 'center':
                case 'right':
                case 'end':
                    style.textAlign = node.style.textAlign;
                    node.element.style.textAlign = '';
                    break
            }
            style.verticalAlign = node.styleMap.verticalAlign || '';
            node.element.style.verticalAlign = 'top';
            if (node.overflow != 0) {
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
        }
        const parentNodes = {};
        const textNodes = [];
        for (const parent of NODE_CACHE) {
            if (parent.bounds == null) {
                parent.setBounds();
            }
            for (const child of NODE_CACHE) {
                if (parent != child) {
                    if (child.bounds == null) {
                        child.setBounds();
                    }
                    if ((!child.fixed && child.parentElement == parent.element) || (child.fixed && child.box.left >= parent.linear.left && child.box.right <= parent.linear.right && child.box.top >= parent.linear.top && child.box.bottom <= parent.linear.bottom)) {
                        if (parentNodes[child.id] == null) {
                            parentNodes[child.id] = [];
                        }
                        parentNodes[child.id].push(parent);
                        parent.children.push(child);
                    }
                }
            }
        }
        NODE_CACHE.forEach(node => {
            const nodes = parentNodes[node.id];
            if (nodes != null) {
                let parent = node.parentElement.androidNode;
                if (node.fixed) {
                    if (nodes.length > 1) {
                        let minArea = Number.MAX_VALUE;
                        nodes.forEach(item => {
                            const area = (item.box.left - node.linear.left) + (item.box.right - node.linear.right) + (item.box.top - node.linear.top) + (item.box.bottom - node.linear.bottom);
                            if (area < minArea) {
                                parent = item;
                                minArea = area;
                            }
                            else if (area == minArea) {
                                if (item.element == node.parentElement) {
                                    parent = item;
                                }
                            }
                        });
                        node.parent = parent;
                    }
                    else {
                        node.parent = nodes[0];
                    }
                }
                else {
                    node.parent = parent;
                }
            }
            if (node.element.children.length > 1) {
                node.element.childNodes.forEach(element => {
                    if (element.nodeName == '#text' && element.textContent.trim() != '') {
                        const textNode = Node.createTextNode(generateNodeId() + textNodes.length, element, SETTINGS.targetAPI, node, [0, 4]);
                        textNodes.push(textNode);
                        node.children.push(textNode);
                    }
                });
            }
        });
        NODE_CACHE.push(...textNodes);
        for (const node in preAlignment) {
            for (const attr in node.style) {
                node.element.style[attr] = node.style[attr];
            }
        }
        sortAsc(NODE_CACHE, 'depth', 'parent.id', 'parentIndex', 'id');
        for (const node of NODE_CACHE) {
            let i = 0;
            Array.from(node.element.childNodes).forEach(item => {
                if (item.androidNode != null && item.androidNode.parent.element == node.element) {
                    item.androidNode.parentIndex = i++;
                }
            });
            node.children.sortAsc('parentIndex');
        }
    }

    function writeResourceStringXml() {
        const resource = new Map([...RESOURCE['string'].entries()].sort());
        if (resource.size > 0) {
            const xml = [STRING_ANDROID.XML_DECLARATION,
                         '<resources>'];
            for (const [name, value] of resource.entries()) {
                xml.push(`\t<string name="${name}">${value}</string>`);
            }
            xml.push('</resources>',
                     '<!-- filename: res/values/string.xml -->\n');
            return xml.join('\n');
        }
        return '';
    }

    function writeResourceArrayXml() {
        const resource = new Map([...RESOURCE['array'].entries()].sort());
        if (resource.size > 0) {
            const xml = [STRING_ANDROID.XML_DECLARATION,
                         '<resources>'];
            for (const [name, values] of resource.entries()) {
                xml.push(`\t<string-array name="${name}">`);
                for (const [name, value] of values.entries()) {
                    xml.push(`\t\t<item>${(value ? `@string/` : '') + name}</item>`);
                }
                xml.push('\t</string-array>');
            }
            xml.push('</resources>',
                     '<!-- filename: res/values/string_array.xml -->\n');
            return xml.join('\n');
        }
        return '';
    }

    function writeResourceStyleXml() {
        if (RESOURCE['style'].size > 0) {
            let xml = [STRING_ANDROID.XML_DECLARATION,
                       '<resources>'];
            for (const [name, style] of RESOURCE['style'].entries()) {
                xml.push(`\t<style name="${name}"${(style.parent != null ? ` parent="${style.parent}"` : '')}>`);
                style.attributes.split(';').sort().forEach(value => {
                    const [name, setting] = value.split('=');
                    xml.push(`\t\t<item name="${name}">${setting.replace(/"/g, '')}</item>`);
                });
                xml.push('\t</style>');
            }
            xml.push('</resources>',
                     '<!-- filename: res/values/styles.xml -->\n');
            xml = xml.join('\n');
            if (SETTINGS.useUnitDP) {
                xml = insetToDP(xml, SETTINGS.density, true);
            }
            return xml;
        }
        return '';
    }

    function writeResourceColorXml() {
        if (RESOURCE['color'].size > 0) {
            const resource = new Map([...RESOURCE['color'].entries()].sort());
            const xml = [STRING_ANDROID.XML_DECLARATION,
                         '<resources>'];
            for (const [name, value] of resource.entries()) {
                xml.push(`\t<color name="${value}">${name}</color>`);
            }
            xml.push('</resources>',
                     '<!-- filename: res/values/colors.xml -->\n');
            return xml.join('\n');
        }
        return '';
    }

    function writeResourceDrawableXml() {
        if (RESOURCE['drawable'].size > 0 || RESOURCE['image'].size > 0) {
            let xml = [];
            for (const [name, value] of RESOURCE['drawable'].entries()) {
                xml.push(value,
                         `<!-- filename: res/drawable/${name}.xml -->\n`);
            }
            for (const [name, value] of RESOURCE['image'].entries()) {
                xml.push(`<!-- image: ${value} -->`,
                         `<!-- filename: res/drawable/${name + value.substring(value.lastIndexOf('.'))} -->\n`);
            }
            xml = xml.join('\n');
            if (SETTINGS.useUnitDP) {
                xml = insetToDP(xml, SETTINGS.density);
            }
            return xml;
        }
        return '';
    }

    function parseDocument() {
        let output = `${STRING_ANDROID.XML_DECLARATION}\n{0}`;
        const mapX = [];
        const mapY = [];
        setStyleMap();
        setNodeCache();
        for (const node of NODE_CACHE) {
            const x = Math.floor(node.bounds.x);
            const y = node.parent.id;
            if (mapX[node.depth] == null) {
                mapX[node.depth] = {};
            }
            if (mapY[node.depth] == null) {
                mapY[node.depth] = {};
            }
            if (mapX[node.depth][x] == null) {
                mapX[node.depth][x] = new NodeList();
            }
            if (mapY[node.depth][y] == null) {
                mapY[node.depth][y] = new NodeList();
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
                mapY[i][coordsY[j]].forEach(item => {
                    switch (item.style.position) {
                        case 'absolute':
                        case 'relative':
                        case 'fixed':
                            layers.push(item);
                            break;
                        default:
                            axisY.push(item);
                    }
                });
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
                        let tagName = nodeY.widgetName;
                        let restart = false;
                        let xml = '';
                        if (tagName == null) {
                            if ((nodeY.children.length == 0 && hasFreeFormText(nodeY.element)) || nodeY.children.every(item => INLINE_CHROME.includes(item.tagName))) {
                                tagName = WIDGET_ANDROID.TEXT;
                            }
                            else if (nodeY.children.length > 0) {
                                const rows = nodeY.children;
                                if (SETTINGS.useGridLayout && !nodeY.flex.enabled && rows.length > 1 && rows.every(item => (BLOCK_CHROME.includes(item.tagName) && item.children.length > 0))) {
                                    let columns = [];
                                    let columnEnd = [];
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
                                        const base = columns[
                                            dimensions.findIndex(item => {
                                                return (item == dimensions.reduce((a, b) => {
                                                    if (a.length == b.length) {
                                                        return (a.reduce((c, d) => c + d, 0) < b.reduce((c, d) => c + d, 0) ? a : b);
                                                    }
                                                    else {
                                                        return (a.length < b.length ? a : b);
                                                    }
                                                }))
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
                                                        if (columns[m] == base) {
                                                            found.push(l);
                                                        }
                                                        else {
                                                            const index = columns[m].findIndex((item, index) => (index >= l && item.bounds.width == bounds.width && index < columns[m].length - 1));
                                                            if (index != -1) {
                                                                found.push(index);
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
                                                if (found.length == columns.length) {
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
                                                columnRight[l] = (l == 0 ? Number.MIN_VALUE : columnRight[l - 1]);
                                                for (let m = 0; m < nextAxisX.length; m++) {
                                                    const nextX = nextAxisX[m];
                                                    if (nextX.parent.parent != null && nodeY.id == nextX.parent.parent.id) {
                                                        const [left, right] = [nextX.bounds.left, nextX.bounds.right];
                                                        if (l == 0 || left >= columnRight[l - 1]) {
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
                                                if (m == -1 && columns[l] == null) {
                                                    m = l - 1;
                                                }
                                                else if (columns[l] == null) {
                                                    if (m != -1 && l == columnRight.length - 1) {
                                                        columnRight[m] = columnRight[l];
                                                    }
                                                    continue;
                                                }
                                                else if (m != -1) {
                                                    columnRight[m] = columnRight[l - 1];
                                                    m = -1;
                                                }
                                            }
                                            for (let l = 0; l < columns.length; l++) {
                                                if (columns[l] != null) {
                                                    columnEnd.push(columnRight[l]);
                                                }
                                            }
                                            columns = columns.filter(nodes => nodes);
                                            const columnLength = columns.reduce((a, b) => Math.max(a, b.length), 0);
                                            for (let l = 0; l < columnLength; l++) {
                                                let top = null;
                                                for (let m = 0; m < columns.length; m++) {
                                                    const nodeX = columns[m][l];
                                                    if (nodeX != null) {
                                                        if (top == null) {
                                                            top = nodeX.bounds.top;
                                                        }
                                                        else if (nodeX.bounds.top != top) {
                                                            const nextRowX = columns[m - 1][l + 1];
                                                            if (columns[m][l - 1] == null || (nextRowX != null && nextRowX.bounds.top == nodeX.bounds.top)) {
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
                                        xml += writeGridLayout(nodeY, parent, nodeY.gridColumnCount);
                                        for (let l = 0, count = 0; l < columns.length; l++) {
                                            let spacer = 0;
                                            for (let m = 0, start = 0; m < columns[l].length; m++) {
                                                const node = columns[l][m];
                                                if (!node.spacer) {
                                                    node.parent.hide();
                                                    node.parent = nodeY;
                                                    if (SETTINGS.useLayoutWeight) {
                                                        node.gridRowStart = (m == 0);
                                                        node.gridRowEnd = (m == columns[l].length - 1);
                                                        node.gridFirst = (l == 0 && m == 0);
                                                        node.gridLast = (l == columns.length - 1 && node.gridRowEnd);
                                                        node.gridIndex = m;
                                                    }
                                                    else {
                                                        let rowSpan = 1;
                                                        let columnSpan = 1 + spacer;
                                                        for (let n = l + 1; n < columns.length; n++) {
                                                            if (columns[n][m].spacer == 1) {
                                                                columnSpan++;
                                                                columns[n][m].spacer = 2;
                                                            }
                                                            else {
                                                                break;
                                                            }
                                                        }
                                                        if (columnSpan == 1) {
                                                            for (let n = m + 1; n < columns[l].length; n++) {
                                                                if (columns[l][n].spacer == 1) {
                                                                    rowSpan++;
                                                                    columns[l][n].spacer = 2;
                                                                }
                                                                else {
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                        if (rowSpan > 1) {
                                                            node.android('layout_rowSpan', rowSpan);
                                                        }
                                                        if (columnSpan > 1) {
                                                            node.android('layout_columnSpan', columnSpan);
                                                        }
                                                        node.gridRowStart = (start++ == 0);
                                                        node.gridRowEnd = (columnSpan + l == columns.length);
                                                        node.gridFirst = (count++ == 0);
                                                        node.gridLast = (node.gridRowEnd && m == columns[l].length - 1);
                                                        node.gridIndex = l;
                                                        spacer = 0;
                                                    }
                                                }
                                                else if (node.spacer == 1) {
                                                    spacer++;
                                                }
                                            }
                                        }
                                    }
                                }
                                if (!nodeY.renderParent) {
                                    const [linearX, linearY] = [nodeY.children.linearX, nodeY.children.linearY];
                                    if (linearX && linearY) {
                                        xml += writeFrameLayout(nodeY, parent);
                                    }
                                    else if (!nodeY.flex.enabled && (linearX || linearY)) {
                                        xml += writeLinearLayout(nodeY, parent, linearY);
                                    }
                                    else {
                                        xml += writeDefaultLayout(nodeY, parent);
                                    }
                                }
                            }
                            else {
                                continue;
                            }
                        }
                        if (!nodeY.renderParent) {
                            if (parent.isView(WIDGET_ANDROID.GRID)) {
                                let siblings = null;
                                if (SETTINGS.useLayoutWeight) {
                                    siblings = new NodeList(nodeY.gridSiblings);
                                }
                                else {
                                    const columnEnd = parent.gridColumnEnd[nodeY.gridIndex + (nodeY.android('layout_columnSpan') || 1) - 1];
                                    siblings = nodeY.parentOriginal.children.filter(item => !item.renderParent && item.bounds.left >= nodeY.bounds.right && item.bounds.right <= columnEnd);
                                }
                                if (siblings.length > 0) {
                                    siblings.unshift(nodeY);
                                    siblings.sortAsc('bounds.x');
                                    const renderParent = parent;
                                    const wrapNode = Node.createWrapNode(generateNodeId(), nodeY, parent, siblings, SETTINGS.targetAPI, [0]);
                                    const rowSpan = nodeY.android('layout_rowSpan');
                                    const columnSpan = nodeY.android('layout_columnSpan');
                                    if (rowSpan > 1) {
                                        nodeY.delete('android', 'layout_rowSpan');
                                        wrapNode.android('layout_rowSpan', rowSpan);
                                    }
                                    if (columnSpan > 1) {
                                        nodeY.delete('android', 'layout_columnSpan');
                                        wrapNode.android('layout_columnSpan', columnSpan);
                                    }
                                    siblings.forEach(item => {
                                        item.parent = wrapNode;
                                        wrapNode.inheritGrid(item);
                                    });
                                    wrapNode.setBounds();
                                    if (siblings.linearX || siblings.linearY) {
                                        xml += writeLinearLayout(wrapNode, renderParent, siblings.linearY);
                                    }
                                    else {
                                        xml += writeDefaultLayout(wrapNode, renderParent);
                                    }
                                    k--;
                                    restart = true;
                                    NODE_CACHE.push(wrapNode);
                                }
                            }
                            if (!nodeY.renderParent && !restart) {
                                const element = nodeY.element;
                                switch (element.tagName) {
                                    case 'INPUT':
                                        if (element.type == 'radio') {
                                            const result = nodeY.parentOriginal.children.filter(item => (item.element.type == 'radio' && item.element.name == element.name));
                                            let radioXml = '';
                                            if (result.length > 1) {
                                                let rowSpan = 1;
                                                let columnSpan = 1;
                                                let checked = null;
                                                const wrapNode = Node.createWrapNode(generateNodeId(), nodeY, parent, result, SETTINGS.targetAPI);
                                                wrapNode.setAndroidId(WIDGET_ANDROID.RADIO_GROUP);
                                                wrapNode.render(parent);
                                                NODE_CACHE.push(wrapNode);
                                                for (const item of result) {
                                                    rowSpan += (convertToInt(item.android('layout_rowSpan')) || 1) - 1;
                                                    columnSpan += (convertToInt(item.android('layout_columnSpan')) || 1) - 1;
                                                    wrapNode.inheritGrid(item);
                                                    if (item.element.checked) {
                                                        checked = item;
                                                    }
                                                    item.parent = wrapNode;
                                                    item.render(wrapNode);
                                                    radioXml += renderViewTag(item, wrapNode, WIDGET_ANDROID.RADIO, true);
                                                }
                                                if (rowSpan > 1) {
                                                    wrapNode.android('layout_rowSpan', rowSpan);
                                                }
                                                if (columnSpan > 1) {
                                                    wrapNode.android('layout_columnSpan', columnSpan);
                                                }
                                                wrapNode
                                                    .android('orientation', (result.linearX ? 'horizontal' : 'vertical'))
                                                    .android('checkedButton', checked.stringId);
                                                wrapNode.setBounds();
                                                wrapNode.setAttributes();
                                                xml += getEnclosingTag(wrapNode.renderDepth, WIDGET_ANDROID.RADIO_GROUP, wrapNode.id, radioXml, insertGridSpace(wrapNode));
                                            }
                                            break;
                                        }
                                    default:
                                        xml += renderViewTag(nodeY, parent, tagName);
                                }
                            }
                        }
                        if (xml != '') {
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
        setResourceStyle();
        if (SETTINGS.showAttributes) {
            setMarginPadding();
            if (SETTINGS.useLayoutWeight) {
                setLayoutWeight();
            }
            setAccessibility();
            setConstraints();
            output = insetAttributes(output);
        }
        else {
            output = output.replace(/{@[0-9]+}/g, '');
        }
        if (SETTINGS.useUnitDP) {
            output = insetToDP(output, SETTINGS.density);
        }
        return output;
    }

    const settings = SETTINGS;
    const build = BUILD_ANDROID;
    const density = DENSITY_ANDROID;

    exports.writeResourceStringXml = writeResourceStringXml;
    exports.writeResourceArrayXml = writeResourceArrayXml;
    exports.writeResourceStyleXml = writeResourceStyleXml;
    exports.writeResourceColorXml = writeResourceColorXml;
    exports.writeResourceDrawableXml = writeResourceDrawableXml;
    exports.parseDocument = parseDocument;
    exports.settings = settings;
    exports.build = build;
    exports.density = density;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=chrome-android-layout.js.map
