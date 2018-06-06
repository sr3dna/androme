/* androme 1.2.13
   https://github.com/anpham6/androme */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.androme = {})));
}(this, (function (exports) { 'use strict';

    const WIDGET_ANDROID =
    {
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

    const XMLNS_ANDROID =
    {
        ANDROID: 'xmlns:android="http://schemas.android.com/apk/res/android"',
        APP: 'xmlns:app="http://schemas.android.com/apk/res-auto"',
        TOOLS: 'xmlns:tools="http://schemas.android.com/tools"'
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
        while (true);
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

    function convertSP(value, dpi, unit = true) {
        return convertDP(value, dpi, unit, true);
    }

    function insetDP(xml, dpi, font = false) {
        return xml.replace(/("|>)([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + convertDP(capture[1], dpi, true, font) + capture[2]);
    }

    function convertInt(value) {
        return parseInt(value) || 0;
    }

    function isNumber(value) {
        return /^[0-9]\d*(\.\d+)?/.test(value.trim());
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
        return Math.max(parseFloat(start == 0 ? 0 : (end == 0 ? 1 : (start / (start + end)).toFixed(2))), 0);
    }

    function hasValue(value) {
        return (typeof value !== 'undefined' && value !== null && value !== '');
    }

    function withinRange(a, b, n = 1) {
        return (b >= (a - n) && b <= (a + n));
    }

    function withinFraction(lower, upper) {
        return (lower == upper || Math.ceil(lower) == Math.floor(upper));
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
            x11.rgb = HextoRGB(x11[j]);
            x11.hsl = RGBtoHSL(x11.rgb.r, x11.rgb.g, x11.rgb.b);
            HSL_SORTED.push({ name: i, hex: x11.hex, hsl: x11.hsl });
        }
    }
    HSL_SORTED.sort(sortHSL);

    function RGBtoHex(n) {
        const hex = '0123456789ABCDEF';
        n = parseInt(n);
        if (isNaN(n)) {
            return '00';
        }
        n = Math.max(0, Math.min(n, 255));
        return hex.charAt((n - (n % 16)) / 16) + hex.charAt(n % 16);
    }

    function HextoRGB(value) {
        value = value.replace('#', '').trim();
        if (value.length == 3) {
            value = value.charAt(0).repeat(2) + value.charAt(1).repeat(2) + value.charAt(2).repeat(2);
        }
        if (value.length == 6) {
            return { r: parseInt(value.substring(0, 2), 16), g: parseInt(value.substring(2, 4), 16), b: parseInt(value.substring(4), 16) };
        }
        return null;
    }

    function HextoHSL(value) {
        const rgb = HextoRGB(value);
        if (rgb != null) {
            return RGBtoHSL(rgb.r, rgb.g, rgb.b);
        }
        return null;
    }

    function RGBtoHSL(r, g, b) {
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
        const hsl = HextoHSL(value);
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

    function convertRGB({ rgb }) {
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    function parseRGBA(value) {
        const match = value.match(/rgb(?:a)?\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})(?:, ([0-9]{1,3}))?\)/);
        if (match != null && match.length >= 4) {
            return [match[0], `#${RGBtoHex(match[1])}${RGBtoHex(match[2])}${RGBtoHex(match[3])}`, parseInt((match[4] != null ? match[4] : 1))];
        }
        return null;
    }

    function getRangeBounds(element) {
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

    function getStyle(element) {
        return (element.androidNode != null ? element.androidNode.style : getComputedStyle(element));
    }

    function parseStyle(element, name, value) {
        if (name == 'backgroundColor') {
            if (element != null && element.parentNode != null && value == getStyle(element.parentNode).backgroundColor) {
                return null;
            }
        }
        else if (/(pt|em)$/.test(value)) {
            value = convertPX(value);
        }
        return value;
    }

    function getBoxSpacing(element, rtl = false, complete = false) {
        const result = {};
        ['padding', 'margin'].forEach(border => {
            ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
                const attr = border + side;
                const value = parseInt(getStyle(element)[attr]) || 0;
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

    function getDataLevel(data, ...levels) {
        let current = data;
        for (const level of levels) {
            let [index, array] = level.split('-');
            if (array == null) {
                array = 0;
            }
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
                    result[index] = result[index].replace(new RegExp(match[0], 'g'), `{${match[2]}}`);
                }
                result[match[2]] = segment;
                characters -= match[0].length;
            }
            if (match == null || characters == 0) {
                template = result[section++];
                if (!hasValue(template)) {
                    break;
                }
                characters = template.length;
                match = null;
            }
            if (!match) {
                pattern = new RegExp(/(!([0-9]+)\n?)[\w\W]*\1/g);
            }
            match = pattern.exec(template);
        }
        while (true);
        return result;
    }

    function parseTemplateData(template, data, index) {
        let output = (index != null ? template[index] : '');
        for (const i in data) {
            let value = '';
            if (data[i] === false) {
                output = output.replace(`{${i}}`, '');
                continue;
            }
            else if (Array.isArray(data[i])) {
                for (const j in data[i]) {
                    value += parseTemplateData(template, data[i][j], i);
                }
            }
            else {
                value = data[i];
            }
            if (hasValue(value)) {
                output = (index != null ? output.replace(new RegExp(`{[@&]*${i}}`), value) : value.trim());
            }
            else if (new RegExp(`\\{${i}\\}`).test(output) || value === false) {
                output = output.replace(`{${i}}`, '');
            }
            else if (new RegExp(`{&${i}}`).test(output)) {
                output = '';
            }
        }
        return output.replace(/\s+[\w:]+="{@\w+}"/g, '');
    }

    const SETTINGS = {
        targetAPI: BUILD_ANDROID.OREO,
        density: DENSITY_ANDROID.MDPI,
        showAttributes: true,
        horizontalPerspective: true,
        useConstraintLayout: true,
        useConstraintChain: true,
        useConstraintGuideline: true,
        useGridLayout: true,
        useLayoutWeight: true,
        useUnitDP: true,
        supportRTL: true,
        numberResourceValue: false,
        whitespaceHorizontalOffset: 4,
        whitespaceVerticalOffset: 14,
        chainPackedHorizontalOffset: 4,
        chainPackedVerticalOffset: 14
    };

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
    '	<style name="{name}" parent="{@parent}">',
        '!2',
    '		<item name="{name}">{value}</item>',
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
    '<resources>',
    '!1',
    '	<color name="{value}">{name}</color>',
    '!1',
    '</resources>',
    '<!-- filename: res/values/colors.xml -->',
    '!0'
    ];

    var COLOR_TMPL = template$3.join('\n');

    const template$4 = [
    '!0',
    '{value}',
    '<!-- filename: {name} -->',
    '!0'
    ];

    var DRAWABLE_TMPL = template$4.join('\n');

    const template$5 = [
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

    var SHAPERECTANGLE_TMPL = template$5.join('\n');

    const template$6 = [
    '!0',
    '<?xml version="1.0" encoding="utf-8"?>',
    '<layer-list xmlns:android="http://schemas.android.com/apk/res/android">',
    '!1',
    '	<item>',
    '		<shape android:shape="rectangle">',
    '		    <solid android:color="{&color}" />',
    '		</shape>',
    '	</item>',
    '!1',
    '!2',
    '	<item android:top="{@top}" android:right="{@right}" android:bottom="{@bottom}" android:left="{@left}">',
    '		<shape android:shape="rectangle">',
    '		    <stroke android:width="{&width}" {borderStyle} />',
    '		</shape>',
    '	</item>',
    '!2',
    '</layer-list>',
    '!0'
    ];

    var LAYERLIST_TMPL = template$6.join('\n');

    const PROPERTY_ANDROID =
    {
        'backgroundStyle': {
            'background': 'android:background="@drawable/{0}"',
            'backgroundColor': 'android:background="{0}"'
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

    const RESOURCE = {
        STRING: new Map(),
        ARRAY: new Map(),
        COLOR: new Map(),
        IMAGE: new Map(),
        DRAWABLE: new Map(),
        STYLE: new Map()
    };

    function parseBorderStyle(value) {
        let stroke = value.match(/(none|dotted|dashed|solid)/);
        let width = value.match(/([0-9.]+(?:px|pt|em))/);
        let color = parseRGBA(value);
        if (stroke != null) {
            stroke = stroke[1];
        }
        if (width != null) {
            width = convertPX(width[1]);
        }
        if (color != null) {
            color = color[1];
        }
        return [stroke || 'solid', width || '1px', color || '#000'];
    }

    function parseBoxDimensions(value) {
        const match = value.match(/^([0-9]+(?:px|pt|em))( [0-9]+(?:px|pt|em))?( [0-9]+(?:px|pt|em))?( [0-9]+(?:px|pt|em))?$/);
        if (match != null) {
            if (match[1] == '0px' && match[2] == null) {
                return null;
            }
            if (match[2] == null || (match[1] == match[2] && match[2] == match[3] && match[3] == match[4])) {
                return [convertPX(match[1])];
            }
            else if (match[3] == null || (match[1] == match[3] && match[2] == match[4])) {
                return [convertPX(match[1]), convertPX(match[2])];
            }
            else {
                return [convertPX(match[1]), convertPX(match[2]), convertPX(match[3]), convertPX(match[4])];
            }
        }
        return null;
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

    function setResourceStyle(NODE_CACHE) {
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
            let sorted = Array.from({ length: nodes.reduce((a, b) => Math.max(a, b.styleAttributes.length), 0) }, value => {
                value = {};
                return value;
            });
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
            while (sorted.length > 0);
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
        for (const node of NODE_CACHE.visible) {
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
                        node.attr((SETTINGS.useUnitDP ? insetDP(attr, SETTINGS.density, true) : attr));
                    }
                }
            }
        }
        inherit.forEach(styles => {
            let parent = null;
            styles.split('.').forEach(value => {
                const match = value.match(/^(\w+)_([0-9]+)$/);
                if (match != null) {
                    const style = resource.get(match[1].toUpperCase())[parseInt(match[2] - 1)];
                    RESOURCE.STYLE.set(value, { parent, attributes: style.attributes });
                    parent = value;
                }
            });
        });
    }

    function getResource(name) {
        return RESOURCE[name];
    }

    function insertResourceAsset(resource, name, value) {
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
            while (resource.has(resourceName) && resource.get(resourceName) != value);
        }
        return resourceName;
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
                value = value.replace(/\s*style=".*?">/g, '>');
                for (const [name, resourceValue] in RESOURCE.STRING.entries()) {
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
                else if (!/\w+/.test(name) && node != null) {
                    name = node.androidId;
                }
                name = insertResourceAsset(RESOURCE.STRING, name, value);
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
            const name = insertResourceAsset(RESOURCE.ARRAY, `${element.androidNode.androidId}_array`, (stringArray.size ? stringArray : numberArray));
            return { entries: name };
        }
        return null;
    }

    function addResourceColor(value) {
        value = value.toUpperCase().trim();
        if (value != '') {
            let colorName = '';
            if (!RESOURCE.COLOR.has(value)) {
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
                    RESOURCE.COLOR.set(value, colorName);
                }
            }
            else {
                colorName = RESOURCE.COLOR.get(value);
            }
            if (colorName != '') {
                return `@color/${colorName}`;
            }
        }
        return value;
    }

    function setComputedStyle(node) {
        return getStyle(node.element);
    }

    function setBoxSpacing(node) {
        const result = getBoxSpacing(node.element, SETTINGS.supportRTL);
        for (const i in result) {
            result[i] += 'px';
        }
        return result;
    }

    function getViewAttributes(node) {
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
            output = (node.renderDepth == 0 ? '{@0}' : '') + attributes.map(value => `\n${indent + value}`).join('');
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
        if (attributes.border[0] != 'none') {
            let template = null;
            let data = null;
            let resourceName = null;
            if (attributes.borderRadius != null) {
                template = parseTemplateMatch(SHAPERECTANGLE_TMPL);
                data = {
                    '0': [{
                        '1': [{ width: attributes.border[1], borderStyle: borderStyle.default }],
                        '2': [{
                            '3': [{ color: (attributes.backgroundColor ? attributes.backgroundColor[1] : '') }],
                            '4': [{ radius: (attributes.borderRadius.length == 1 ? attributes.borderRadius[0] : '') }],
                            '5': [{ topLeftRadius: '' }]
                        }]
                    }]
                };
                if (attributes.borderRadius.length > 1) {
                    if (attributes.borderRadius.length == 2) {
                        attributes.borderRadius.push(...attributes.borderRadius.slice());
                    }
                    const borderRadiusItem = getDataLevel(data, '0', '2', '5');
                    attributes.borderRadius.forEach((value, index) => borderRadiusItem[`${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius`] = value);
                }
            }
            else if (attributes.backgroundColor == null) {
                template = parseTemplateMatch(SHAPERECTANGLE_TMPL);
                data = {
                    '0': [{
                        '1': [{ width: attributes.border[1], borderStyle: borderStyle.default }],
                        '2': false
                    }]
                };
            }
            else {
                template = parseTemplateMatch(LAYERLIST_TMPL);
                data = {
                    '0': [{
                        '1': [],
                        '2': []
                    }]
                };
                const rootItem = getDataLevel(data, '0');
                rootItem['1'].push({ color: (attributes.backgroundColor != null ? attributes.backgroundColor[1] : false) });
                if (attributes.border[0] != 'none') {
                    rootItem['2'].push({
                        width: attributes.border[1],
                        borderStyle: borderStyle.default
                    });
                }
                else {
                    [attributes.borderTopWidth, attributes.borderRightWidth, attributes.borderBottomWidth, attributes.borderLeftWidth].forEach((item, index) => {
                        rootItem['2'].push({
                            [['top', 'right', 'bottom', 'left'][index]]: item[2],
                            width: item[1],
                            borderStyle: borderStyle[item[0]] || borderStyle.black
                        });
                    });
                }
            }
            let xml = parseTemplateData(template, data);
            for (const [name, value] of RESOURCE.DRAWABLE.entries()) {
                if (value == xml) {
                    resourceName = name;
                    break;
                }
            }
            if (resourceName == null) {
                resourceName = `${node.tagName.toLowerCase()}_${node.androidId}`;
                RESOURCE.DRAWABLE.set(resourceName, xml);
            }
            node.drawable = resourceName;
            return { background: resourceName };
        }
        else if (attributes.backgroundColor != null) {
            return { backgroundColor: attributes.backgroundColor[1] };
        }
        return null;
    }

    function writeResourceStringXml() {
        RESOURCE.STRING = new Map([...RESOURCE.STRING.entries()].sort());
        let xml = '';
        if (RESOURCE.STRING.size > 0) {
            const template = parseTemplateMatch(STRING_TMPL);
            const data = {
                '0': [{
                    '1': []
                }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name, value] of RESOURCE.STRING.entries()) {
                rootItem['1'].push({ name, value });
            }
            xml = parseTemplateData(template, data);
        }
        return xml;
    }

    function writeResourceArrayXml() {
        RESOURCE.ARRAY = new Map([...RESOURCE.ARRAY.entries()].sort());
        let xml = '';
        if (RESOURCE.ARRAY.size > 0) {
            const template = parseTemplateMatch(STRINGARRAY_TMPL);
            const data = {
                '0': [{
                    '1': []
                }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name, values] of RESOURCE.ARRAY.entries()) {
                const arrayItem = {
                    name,
                    '2': []
                };
                const item = arrayItem['2'];
                for (const [name, value] of values.entries()) {
                    item.push({ value: (value ? `@string/` : '') + name });
                }
                rootItem['1'].push(arrayItem);
            }
            xml = parseTemplateData(template, data);
        }
        return xml;
    }

    function writeResourceStyleXml() {
        let xml = '';
        if (RESOURCE.STYLE.size > 0) {
            const template = parseTemplateMatch(STYLE_TMPL);
            const data = {
                '0': [{
                    '1': []
                }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name, style] of RESOURCE.STYLE.entries()) {
                const styleItem = {
                    name,
                    parent: style.parent || '',
                    '2': []
                };
                style.attributes.split(';').sort().forEach(attr => {
                    const [name, value] = attr.split('=');
                    styleItem['2'].push({ name, value: value.replace(/"/g, '') });
                });
                rootItem['1'].push(styleItem);
            }
            xml = parseTemplateData(template, data);
        }
        return xml;
    }

    function writeResourceColorXml() {
        let xml = '';
        if (RESOURCE.COLOR.size > 0) {
            RESOURCE.COLOR = new Map([...RESOURCE.COLOR.entries()].sort());
            const template = parseTemplateMatch(COLOR_TMPL);
            const data = {
                '0': [{
                    '1': []
                }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name, value] of RESOURCE.COLOR.entries()) {
                rootItem['1'].push({ name, value });
            }
            xml = parseTemplateData(template, data);
        }
        return xml;
    }

    function writeResourceDrawableXml() {
        let xml = '';
        if (RESOURCE.DRAWABLE.size > 0 || RESOURCE.IMAGE.size > 0) {
            const template = parseTemplateMatch(DRAWABLE_TMPL);
            const data = {
                '0': []
            };
            const rootItem = data['0'];
            for (const [name, value] of RESOURCE.DRAWABLE.entries()) {
                rootItem.push({ name: `res/drawable/${name}.xml`, value});
            }
            for (const [name, value] of RESOURCE.IMAGE.entries()) {
                rootItem.push({ name: `res/drawable/${name + value.substring(value.lastIndexOf('.'))}`, value: `<!-- image: ${value} -->` });
            }
            xml = parseTemplateData(template, data);
            if (SETTINGS.useUnitDP) {
                xml = insetDP(xml, SETTINGS.density);
            }
        }
        return xml;
    }

    var Resource = /*#__PURE__*/Object.freeze({
        ACTION_ANDROID: ACTION_ANDROID,
        RESOURCE: RESOURCE,
        setResourceStyle: setResourceStyle,
        getResource: getResource,
        insertResourceAsset: insertResourceAsset,
        addResourceString: addResourceString,
        addResourceStringArray: addResourceStringArray,
        addResourceColor: addResourceColor,
        setComputedStyle: setComputedStyle,
        setBoxSpacing: setBoxSpacing,
        getViewAttributes: getViewAttributes,
        parseStyleAttribute: parseStyleAttribute,
        setBackgroundStyle: setBackgroundStyle,
        writeResourceStringXml: writeResourceStringXml,
        writeResourceArrayXml: writeResourceArrayXml,
        writeResourceStyleXml: writeResourceStyleXml,
        writeResourceColorXml: writeResourceColorXml,
        writeResourceDrawableXml: writeResourceDrawableXml
    });

    function parseRTL(value) {
        if (SETTINGS.supportRTL && SETTINGS.targetAPI >= BUILD_ANDROID.JELLYBEAN_1) {
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

    class Node {
        constructor(id, element, api, options = {}) {
            let style = {};
            let styleMap = {};
            if (element != null) {
                style = getComputedStyle(element);
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
            this.api = api;
            this.depth = 0;
            this.style = style;
            this.styleMap = styleMap;
            this.visible = true;
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
            if (hasValue(value)) {
                if (!this.supported(obj, attr)) {
                    return false;
                }
                if (this[name] == null) {
                    this._namespaces.add(obj);
                    this[name] = {};
                }
                if (!overwrite && this[name][attr] != null) {
                    return null;
                }
                this[name][attr] = value;
            }
            return (this[name] != null ? this[name][attr] : null);
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
        apply(options) {
            for (const namespace in options) {
                const obj = options[namespace];
                for (const attr in obj) {
                    this.add(namespace, attr, obj[attr]);
                }
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
        }
        combine() {
            const result = [];
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
                if (parent.isView(WIDGET_ANDROID.LINEAR) && parent.id != 0) {
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
        expandDimensions() {
            let [width, height] = [this.children.reduce((a, b) => Math.max(a, b.linear.right), 0), this.children.reduce((a, b) => Math.max(a, b.linear.bottom), 0)];
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
                this.constraint.minWidth = formatPX(width);
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
                this.constraint.minHeight = formatPX(height);
            }
            if (calibrate) {
                this.setBounds(true);
            }
        }
        anchor(position, adjacent = {}, orientation = '') {
            const overwrite = (adjacent.stringId == 'parent');
            switch (this.renderParent.widgetName) {
                case WIDGET_ANDROID.CONSTRAINT:
                    if (arguments.length == 1) {
                        return this.app(position);
                    }
                    this.app(position, adjacent.stringId, overwrite);
                    break;
                case WIDGET_ANDROID.RELATIVE:
                    if (arguments.length == 1) {
                        return this.android(position);
                    }
                    this.android(position, adjacent.stringId, overwrite);
                    break;
            }
            if (orientation != '') {
                this.constraint[orientation] = true;
            }
            return this;
        }
        modifyBox(dimension, offset) {
            dimension = parseRTL(dimension);
            const total = formatPX(offset + convertInt(this.android(dimension)));
            this.android(dimension, total)
                .css(dimension, total);
            this.setBounds(true);
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
            const parentWidth = (parent.id != 0 ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + convertInt(parent.style.borderLeftWidth) + convertInt(parent.style.borderRightWidth)) : Number.MAX_VALUE);
            const parentHeight = (parent.id != 0 ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + convertInt(parent.style.borderTopWidth) + convertInt(parent.style.borderBottomWidth)) : Number.MAX_VALUE);
            if (this.overflow != 0 && !this.isView(WIDGET_ANDROID.TEXT)) {
                this.android('layout_width', (this.isHorizontal() ? 'wrap_content' : 'match_parent'))
                    .android('layout_height', (this.isHorizontal() ? 'match_parent' : 'wrap_content'));
            }
            else {
                if (this.android('layout_width') != '0px') {
                    if (styleMap.width != null) {
                        this.android('layout_width', convertPX(styleMap.width));
                    }
                    if (styleMap.minWidth != null) {
                        this.android('layout_width', 'wrap_content', false)
                            .android('minWidth', convertPX(styleMap.minWidth), false);
                    }
                    if (styleMap.maxWidth != null) {
                        this.android('maxWidth', convertPX(styleMap.maxWidth), false);
                    }
                }
                if ((!this.flex.enabled || this.constraint.expand) && this.constraint.layoutWidth != null) {
                    this.android('layout_width', (this.constraint.layoutWidth ? this.constraint.minWidth : 'wrap_content'), this.constraint.layoutWidth);
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
                    if (styleMap.height != null || styleMap.lineHeight != null) {
                        this.android('layout_height', convertPX(styleMap.height || styleMap.lineHeight));
                    }
                    if (styleMap.minHeight != null) {
                        this.android('layout_height', 'wrap_content', false)
                            .android('minHeight', convertPX(styleMap.minHeight), false);
                    }
                    if (styleMap.maxHeight != null) {
                        this.android('maxHeight', convertPX(styleMap.maxHeight), false);
                    }
                }
                if ((!this.flex.enabled || this.constraint.expand) && this.constraint.layoutHeight != null) {
                    this.android('layout_height', (this.constraint.layoutHeight ? this.constraint.minHeight : 'wrap_content'), this.constraint.layoutHeight);
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
                            if (!requireWrap && parent.overflow == 0 && height >= parentHeight) {
                                this.android('layout_height', 'match_parent');
                            }
                            else {
                                this.android('layout_height', 'wrap_content');
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
                                    value = parseStyle(element, j, value);
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
        setBounds(calibrate = false, element = null) {
            if (this.wrapNode == null) {
                if (!calibrate) {
                    this.bounds = (element != null ?  getRangeBounds(element) : JSON.parse(JSON.stringify(this.element.getBoundingClientRect())));
                }
                this.linear = {
                    top: this.bounds.top - this.marginTop,
                    right: this.bounds.right + this.marginRight,
                    bottom: this.bounds.bottom + this.marginBottom,
                    left: this.bounds.left - this.marginLeft
                };
                this.box = {
                    top: this.bounds.top + (this.paddingTop + this.borderTopWidth),
                    right: this.bounds.right - (this.paddingRight + this.borderRightWidth),
                    bottom: this.bounds.bottom - (this.paddingBottom + this.borderBottomWidth),
                    left: this.bounds.left + (this.paddingLeft + this.borderLeftWidth)
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
                            horizontal = parseRTL('right', 'end');
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
                            if (this.style.height == this.style.lineHeight || convertInt(this.style.lineHeight) == (this.box.bottom - this.box.top)) {
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
                            const gravity = [vertical, horizontal].filter(value => value);
                            this.android('gravity', (gravity.length == 2 ? 'center' : gravity[0]));
                            horizontal = null;
                            vertical = null;
                            break;
                        case WIDGET_ANDROID.GRID:
                            if (parentTextAlign && horizontal != null) {
                                layoutGravity.push(horizontal);
                            }
                            break;
                    }
                    if (vertical != null || layoutGravity.length > 0) {
                        layoutGravity.push(vertical);
                        this.android('layout_gravity', (layoutGravity.length == 2 ? 'center' : layoutGravity[0]));
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
            if (Node.is(value) && value.visible && value.renderChildren != null) {
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
            for (const node of this.children) {
                minLeft = Math.min(node.bounds.left, minLeft);
                maxRight = Math.max(node.bounds.right, maxRight);
                minTop = Math.min(node.bounds.top, minTop);
                maxBottom = Math.max(node.bounds.bottom, maxBottom);
            }
            return [maxRight - minLeft, maxBottom - minTop];
        }
        get namespaces() {
            const result = [];
            for (const obj of this._namespaces) {
                const name = obj.replace(/^_+/, '');
                if (name != '') {
                    result.push(name);
                }
            }
            return result;
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
                    grow: convertInt(this.style.flexGrow),
                    shrink: convertInt(this.style.flexShrink),
                    wrap: this.style.flexWrap,
                    alignSelf: (parent != null && parent.styleMap.alignItems != null && (this.styleMap.alignSelf == null || this.style.alignSelf == 'auto') ? parent.styleMap.alignItems : this.style.alignSelf),
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
            return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2)};
        }
        get stringId() {
            return (this.androidId != null ? `@+id/${this.androidId}` : '');
        }

        static is(node) {
            return (node != null && node instanceof Node);
        }
        static createWrapNode(id, node, api, parent, children, actions = null) {
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
            node.setBounds(false, element);
            if (parent != null) {
                const inherit = INHERIT_ANDROID[WIDGET_ANDROID.TEXT];
                const style = [];
                for (const prop in inherit) {
                    let value = parent.style[prop]; 
                    node.style[prop] = value;
                    value = parseStyle(null, prop, value);
                    if (value != null) {
                        style.push(formatString(inherit[prop], value));
                    }
                }
                node.styleAttributes = style;
            }
            element.children = [];
            return node;
        }
    }

    class NodeList$1 extends Array {
        constructor(nodes, parent = null) {
            super();
            if (Array.isArray(nodes)) {
                this.push(...nodes);
            }
            this.parent = parent;
        }
        push(...value) {
            for (const node of value) {
                if (Node.is(node)) {
                    if (node.children == null) {
                        node.children = new NodeList$1(null, node);
                    }
                    if (node.linearRows == null) {
                        node.linearRows = new NodeList$1(null, node);
                    }
                    if (node.renderChildren == null) {
                        node.renderChildren = new NodeList$1(null, node);
                    }
                    super.push(node);
                }
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
        findById(androidId) {
            return this.find(node => node.android('id') == androidId);
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
        get visible () {
            return this.filter(node => node.visible);
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
        get anchored() {
            return this.filter(node => (node.anchors == 2));
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
            return (nodes != null && nodes instanceof NodeList$1);
        }
    }

    const NODE_CACHE = new NodeList$1();

    function generateNodeId() {
        return NODE_CACHE.length + 1;
    }

    const VIEW_BEFORE = {};
    const VIEW_AFTER = {};

    function getEnclosingTag(depth, tagName, id, content, space = ['', '']) {
        const indent = padLeft(depth);
        let xml = space[0] +
                  `{<${id}}`;
        if (hasValue(content)) {
            xml += indent + `<${tagName}{@${id}}>\n` +
                            content +
                   indent + `</${tagName}>\n`;
        }
        else {
            xml += indent + `<${tagName}{@${id}} />\n`;
        }
        xml += `{>${id}}` +
               space[1];
        return xml;
    }

    function getGridSpace(node) {
        let preXml = '';
        let postXml = '';
        if (node.parent.isView(WIDGET_ANDROID.GRID)) {
            const dimensions = getBoxSpacing(node.parentOriginal.element, SETTINGS.supportRTL, true);
            const options = {
                android: {
                    layout_columnSpan: node.renderParent.gridColumnSpan,
                    layout_columnWeight: 1
                }
            };
            if (node.gridFirst) {
                const heightTop = dimensions.paddingTop + dimensions.marginTop;
                if (heightTop > 0) {
                    addViewBefore(node.id, getStaticTag(WIDGET_ANDROID.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightTop))[0]);
                }
            }
            if (node.gridRowStart) {
                let marginLeft = dimensions[parseRTL('marginLeft')] + dimensions[parseRTL('paddingLeft')];
                if (marginLeft > 0) {
                    marginLeft = convertPX(marginLeft + node.marginLeft);
                    node.android(parseRTL('layout_marginLeft'), marginLeft)
                        .css('marginLeft', marginLeft);
                }
            }
            if (node.gridRowEnd) {
                const heightBottom = dimensions.marginBottom + dimensions.paddingBottom + (!node.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
                let marginRight = dimensions[parseRTL('marginRight')] + dimensions[parseRTL('paddingRight')];
                if (heightBottom > 0) {
                    addViewAfter(node.id, getStaticTag(WIDGET_ANDROID.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightBottom))[0]);
                }
                if (marginRight > 0) {
                    marginRight = convertPX(marginRight + node.marginRight);
                    node.android(parseRTL('layout_marginRight'), marginRight)
                        .css('marginRight', marginRight);
                }
            }
        }
        return [preXml, postXml];
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
                .map(widgetName => {
                    const wrapNode = Node.createWrapNode(generateNodeId(), current, SETTINGS.targetAPI, null, new NodeList([current]));
                    NODE_CACHE.push(wrapNode);
                    wrapNode.setAndroidId(widgetName);
                    wrapNode.setBounds();
                    wrapNode.android('fadeScrollbars', 'false');
                    wrapNode.setAttributes();
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
        return getEnclosingTag(node.renderDepth, tagName, node.id, `{${node.id}}`, getGridSpace(node), preXml, postXml);
    }

    function renderViewTag(node, parent, tagName, recursive) {
        const element = node.element;
        node.setAndroidId(tagName);
        switch (element.tagName) {
            case 'IMG': {
                const image = element.src.substring(element.src.lastIndexOf('/') + 1);
                const format = image.substring(image.lastIndexOf('.') + 1).toLowerCase();
                let src = image.replace(/.\w+$/, '');
                switch (format) {
                    case 'bmp':
                    case 'gif':
                    case 'jpg':
                    case 'png':
                    case 'webp':
                        src = insertResourceAsset(getResource('IMAGE'), src, element.src);
                        break;
                    default:
                        src = `(UNSUPPORTED: ${image})`;
                }
                node.androidSrc = src;
                break;
            }
            case 'TEXTAREA': {
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
        }
        switch (node.widgetName) {
            case WIDGET_ANDROID.EDIT:
                node.android('inputType', 'text');
                break;
            case WIDGET_ANDROID.BUTTON: {
                if (node.viewWidth == 0) {
                    node.android('minWidth', '0px');
                }
                if (node.viewHeight == 0) {
                    node.android('minHeight', '0px');
                }
                break;
            }
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
        switch (element.type) {
            case 'radio':
                if (!recursive) {
                    const result = node.parentOriginal.children.filter(item => (item.element.type == 'radio' && item.element.name == element.name));
                    let xml = '';
                    if (result.length > 1) {
                        let rowSpan = 1;
                        let columnSpan = 1;
                        let checked = null;
                        const wrapNode = Node.createWrapNode(generateNodeId(), node, SETTINGS.targetAPI, parent, result);
                        NODE_CACHE.push(wrapNode);
                        wrapNode.setAndroidId(WIDGET_ANDROID.RADIO_GROUP);
                        wrapNode.render(parent);
                        for (const radio of result) {
                            rowSpan += (convertInt(radio.android('layout_rowSpan')) || 1) - 1;
                            columnSpan += (convertInt(radio.android('layout_columnSpan')) || 1) - 1;
                            wrapNode.inheritGrid(radio);
                            if (radio.element.checked) {
                                checked = radio;
                            }
                            radio.parent = wrapNode;
                            radio.render(wrapNode);
                            xml += renderViewTag(radio, wrapNode, WIDGET_ANDROID.RADIO, true);
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
                        return getEnclosingTag(wrapNode.renderDepth, WIDGET_ANDROID.RADIO_GROUP, wrapNode.id, xml, getGridSpace(wrapNode));
                    }
                }
                break;
            case 'password':
                node.android('inputType', 'textPassword');
                break;
        }
        node.setAttributes();
        node.applyCustomizations();
        node.render(parent);
        node.setGravity();
        node.cascade().forEach(item => item.hide());
        return getEnclosingTag(node.renderDepth, node.widgetName, node.id, '', getGridSpace(node));
    }

    function getStaticTag(widgetName, depth, options, width = 'wrap_content', height = 'wrap_content') {
        let attributes = '';
        const node = new Node(0, null, SETTINGS.targetAPI);
        node.setAndroidId(widgetName);
        if (SETTINGS.showAttributes) {
            node.apply(options)
                .android('id', node.stringId)
                .android('layout_width', width)
                .android('layout_height', height);
            const indent = padLeft(depth + 1);
            for (const attr of node.combine()) {
                attributes += `\n${indent + attr}`;
            }
        }
        return [getEnclosingTag(depth, widgetName, 0, '').replace('{@0}', attributes), node.stringId];
    }

    function addViewBefore(id, xml, index = -1) {
        if (VIEW_BEFORE[id] == null) {
            VIEW_BEFORE[id] = [];
        }
        if (index != -1 && index < VIEW_BEFORE[id].length) {
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
        if (index != -1 && index < VIEW_AFTER[id].length) {
            VIEW_AFTER[id].splice(index, 0, xml);
        }
        else {
            VIEW_AFTER[id].push(xml);
        }
    }

    function insertViewBeforeAfter(output) {
        for (const id in VIEW_BEFORE) {
            output = output.replace(`{<${id}}`, VIEW_BEFORE[id].join(''));
        }
        for (const id in VIEW_AFTER) {
            output = output.replace(`{>${id}}`, VIEW_AFTER[id].join(''));
        }
        return output;
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
        orientation: ['horizontalChain', 'verticalChain'],
        leftTop: ['left', 'top'],
        rightBottom: ['right', 'bottom'],
        rightLeftBottomTop: ['rightLeft', 'bottomTop'],
        leftRightTopBottom: ['leftRight', 'topBottom'],
        widthHeight: ['Width', 'Height'],
        horizontalVertical: ['Horizontal', 'Vertical']
    };

    function setAlignParent(node, orientation = '', bias = false) {
        const map = LAYOUT_MAP.constraint;
        if (orientation == '' || orientation == 'horizontal') {
            node.app(map['left'], 'parent')
                .app(map['right'], 'parent')
                .constraint.horizontal = true;
            if (bias) {
                node.app('layout_constraintHorizontal_bias', node.horizontalBias);
            }
        }
        if (orientation == '' || orientation == 'vertical') {
            node.app(map['top'], 'parent')
                .app(map['bottom'], 'parent')
                .constraint.vertical = true;
            if (bias) {
                node.app('layout_constraintVertical_bias', node.verticalBias);
            }
        }
    }

    function deleteConstraints(node, orientation = '') {
        if (orientation == '' || orientation == 'horizontal') {
            node.delete('app', `*constraint${parseRTL('Left')}*`, `*constraint${parseRTL('Right')}*`);
        }
        if (orientation == '' || orientation == 'vertical') {
            node.delete('app', '*constraintTop*', '*constraintBottom*', '*constraintBaseline*');
        }
    }

    function setChainBias(nodes, index) {
        const widthHeight = (index == 0 ? 'width' : 'height');
        const horizontalVertical = (index == 0 ? 'Horizontal' : 'Vertical');
        for (const node of nodes) {
            const bias = parseFloat(((node.bounds.left - nodes.parent.box.left) + (node.bounds[widthHeight] / 2)) / nodes.parent.box[widthHeight]).toFixed(2);
            deleteConstraints(node, horizontalVertical.toLowerCase());
            setAlignParent(node, horizontalVertical.toLowerCase());
            node.app(`layout_constraint${horizontalVertical}_bias`, bias);
        }
    }

    function createGuideline(parent, node, orientation = '', percent) {
        const map = LAYOUT_MAP.constraint;
        const beginPercent = `layout_constraintGuide_${(percent != null ? 'percent' : 'begin')}`;
        if (!node.constraint.horizontal && (orientation == '' || orientation == 'horizontal')) {
            const options = {
                android: {
                    orientation: 'vertical'
                },
                app: {
                    [beginPercent]: (percent != null ? percent : formatPX(Math.max(node.bounds.left - parent.box.left, 0)))
                }
            };
            let [xml, id] = getStaticTag(WIDGET_ANDROID.GUIDELINE, node.renderDepth, options);
            addViewAfter(node.id, xml);
            node.app(map['left'], id)
                .delete('app', map['right'])
                .constraint.horizontal = true;
        }
        if (!node.constraint.vertical && (orientation == '' || orientation == 'vertical')) {
            const options = {
                android: {
                    orientation: 'horizontal'
                },
                app: {
                    [beginPercent]: (percent != null ? percent : formatPX(Math.max(node.bounds.top - parent.box.top, 0)))
                }
            };
            let [xml, id] = getStaticTag(WIDGET_ANDROID.GUIDELINE, node.renderDepth, options);
            addViewAfter(node.id, xml);
            node.app(map['top'], id)
                .delete('app', map['bottom'])
                .constraint.vertical = true;
        }
    }

    function adjustMargins(nodes) {
        for (const node of nodes) {
            if (node.constraint.marginHorizontal != null) {
                let offset = node.linear.left - NODE_CACHE.findById(node.constraint.marginHorizontal).linear.right;
                if (offset >= 1) {
                    node.modifyBox('layout_marginLeft', offset);
                }
            }
            if (node.constraint.marginVertical != null) {
                let offset = node.linear.top - NODE_CACHE.findById(node.constraint.marginVertical).linear.bottom;
                if (offset >= 1) {
                    node.modifyBox('layout_marginTop', offset);
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
            const constraint = node.isView(WIDGET_ANDROID.CONSTRAINT);
            const relative = node.isView(WIDGET_ANDROID.RELATIVE);
            const flex = node.flex;
            if (constraint || relative || flex.enabled) {
                node.expandDimensions();
                if (flex.enabled && node.isView(WIDGET_ANDROID.LINEAR)) {
                    if (node.renderChildren.some(item => item.flex.direction.indexOf('row') != -1)) {
                        node.constraint.layoutWidth = true;
                        node.constraint.expand = true;
                    }
                    if (node.renderChildren.some(item => item.flex.direction.indexOf('column') != -1)) {
                        node.constraint.layoutHeight = true;
                        node.constraint.expand = true;
                    }
                    continue;
                }
                const LAYOUT = LAYOUT_MAP[(relative ? 'relative' : 'constraint')];
                const nodes = node.renderChildren;
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
                            if (current == adjacent) {
                                continue;
                            }
                            else if (constraint) {
                                let bounds1 = current.bounds;
                                let bounds2 = adjacent.bounds;
                                let parent = false;
                                if (current == node || adjacent == node) {
                                    if (current == node) {
                                        current = adjacent;
                                    }
                                    adjacent = { stringId: 'parent' };
                                    bounds1 = current.linear;
                                    bounds2 = node.box;
                                    parent = true;
                                }
                                if (parent) {
                                    if (bounds1.left == bounds2.left) {
                                        current.anchor(LAYOUT['left'], adjacent, 'horizontal');
                                    }
                                    if (withinRange(bounds1.right, bounds2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['right'], adjacent, 'horizontal');
                                    }
                                }
                                else {
                                    if (current.viewWidth == 0 && bounds1.left == bounds2.left && bounds1.right == bounds2.right) {
                                        current.anchor(LAYOUT['left'], adjacent);
                                        current.anchor(LAYOUT['right'], adjacent);
                                    }
                                    else if (!SETTINGS.horizontalPerspective) {
                                        if (bounds1.left == bounds2.left) {
                                            current.anchor(LAYOUT['left'], adjacent);
                                        }
                                        else if (bounds1.right == bounds2.right) {
                                            current.anchor(LAYOUT['right'], adjacent);
                                        }
                                    }
                                    const withinY = (bounds1.top == bounds2.top || bounds1.bottom == bounds2.bottom);
                                    if (withinY && withinRange(bounds1.left, bounds2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['leftRight'], adjacent);
                                    }
                                    if (withinY && withinRange(bounds1.right, bounds2.left, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['rightLeft'], adjacent);
                                    }
                                }
                                if (parent) {
                                    if (bounds1.top == bounds2.top) {
                                        current.anchor(LAYOUT['top'], adjacent, 'vertical');
                                    }
                                    if (bounds1.bottom == bounds2.bottom) {
                                        current.anchor(LAYOUT['bottom'], adjacent, 'vertical');
                                    }
                                }
                                else {
                                    if (current.viewHeight == 0 && bounds1.top == bounds2.top && bounds1.bottom == bounds2.bottom) {
                                        const baseline = (current.isView(WIDGET_ANDROID.TEXT) && current.style.verticalAlign == 'baseline' && adjacent.isView(WIDGET_ANDROID.TEXT) && adjacent.style.verticalAlign == 'baseline');
                                        current.anchor(LAYOUT[(baseline ? 'baseline' : 'top')], adjacent);
                                        current.anchor(LAYOUT['bottom'], adjacent);
                                    }
                                    if (withinRange(bounds1.top, bounds2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                        current.anchor(LAYOUT['topBottom'], adjacent);
                                    }
                                }
                            }
                            else {
                                if (current == node) {
                                    continue;
                                }
                                if (adjacent == node) {
                                    adjacent = { stringId: 'true' };
                                    if (current.linear.left == node.box.left) {
                                        current.anchor(parseRTL('layout_alignParentLeft'), adjacent, 'horizontal');
                                    }
                                    if (current.linear.right == node.box.right) {
                                        current.anchor(parseRTL('layout_alignParentRight'), adjacent, 'horizontal');
                                    }
                                    if (current.linear.top == node.box.top) {
                                        current.anchor('layout_alignParentTop', adjacent, 'vertical');
                                    }
                                    if (current.linear.bottom == node.box.bottom) {
                                        current.anchor('layout_alignParentBottom', adjacent, 'vertical');
                                    }
                                }
                                else {
                                    const bounds1 = current.bounds;
                                    const bounds2 = adjacent.bounds;
                                    if ((bounds1.top == bounds2.top || bounds1.bottom == bounds2.bottom) && withinRange(bounds1.left, bounds2.right, SETTINGS.whitespaceHorizontalOffset)) {
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
                                        if (bounds1.bottom == bounds2.bottom) {
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
                    for (let current of nodes) {
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
                                if (current.anchor(LAYOUT['left']) != 'parent') {
                                    position.push(LAYOUT['left']);
                                }
                                if (current.anchor(LAYOUT['right']) != 'parent') {
                                    position.push(LAYOUT['right']);
                                }
                            }
                            if (current.constraint.vertical) {
                                if (current.anchor(LAYOUT['top']) != 'parent') {
                                    position.push(LAYOUT['top']);
                                }
                                if (current.anchor(LAYOUT['bottom']) != 'parent') {
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
                            let horizontalChain = nodes.filter(item => same(current, item, 'bounds.top'));
                            if (horizontalChain.length == 0) {
                                horizontalChain = nodes.filter(item => same(current, item, 'bounds.bottom'));
                            }
                            if (horizontalChain.length > 0) {
                                horizontalChain.sortAsc('bounds.x');
                            }
                            let verticalChain = nodes.filter(item => same(current, item, 'bounds.left'));
                            if (verticalChain.length == 0) {
                                verticalChain = nodes.filter(item => same(current, item, 'bounds.right'));
                            }
                            if (verticalChain.length > 0) {
                                verticalChain.sortAsc('bounds.y');
                            }
                            current.constraint.horizontalChain = horizontalChain;
                            current.constraint.verticalChain = verticalChain;
                        }
                    }
                    const orientation = CHAIN_MAP.orientation.slice();
                    if (!SETTINGS.horizontalPerspective) {
                        orientation.reverse();
                    }
                    orientation.forEach((value, index) => {
                        if (!SETTINGS.horizontalPerspective) {
                            index = (index == 0 ? 1 : 0);
                        }
                        const chainNodes = flexNodes || nodes.slice().sort((a, b) => (a.constraint[value].length >= b.constraint[value].length ? -1 : 1));
                        for (const current of chainNodes) {
                            const chainDirection = current.constraint[value];
                            if (chainDirection != null && chainDirection.length > 0 && (flex.enabled || chainDirection.map(item => parseInt((item.constraint[value] || [{ id: 0 }]).map(item => item.id).join(''))).reduce((a, b) => (a == b ? a : 0)) > 0)) {
                                const [HV, VH] = [CHAIN_MAP['horizontalVertical'][index], CHAIN_MAP['horizontalVertical'][(index == 0 ? 1 : 0)]];
                                const [LT, TL] = [CHAIN_MAP['leftTop'][index], CHAIN_MAP['leftTop'][(index == 0 ? 1 : 0)]];
                                const [RB, BR] = [CHAIN_MAP['rightBottom'][index], CHAIN_MAP['rightBottom'][(index == 0 ? 1 : 0)]];
                                const [WH, HW] = [CHAIN_MAP['widthHeight'][index], CHAIN_MAP['widthHeight'][(index == 0 ? 1 : 0)]];
                                const orientation = HV.toLowerCase();
                                const firstNode = chainDirection.first;
                                const lastNode = chainDirection.last;
                                let maxOffset = -1;
                                chainDirection.parent = node;
                                for (let i = 0; i < chainDirection.length; i++) {
                                    const current = chainDirection[i];
                                    const next = chainDirection[i + 1];
                                    const previous = chainDirection[i - 1];
                                    if (node.flex.enabled) {
                                        if (current.linear[TL] == node.box[TL] && current.linear[BR] == node.box[BR]) {
                                            setAlignParent(current, VH.toLowerCase());
                                        }
                                    }
                                    if (next != null) {
                                        current.app(LAYOUT[CHAIN_MAP['rightLeftBottomTop'][index]], next.stringId);
                                        maxOffset = Math.max(next.linear[LT] - current.linear[RB], maxOffset);
                                    }
                                    if (previous != null) {
                                        current.app(LAYOUT[CHAIN_MAP['leftRightTopBottom'][index]], previous.stringId);
                                    }
                                    if (current.styleMap[WH.toLowerCase()] == null) {
                                        const min = current.styleMap[`min${WH}`];
                                        const max = current.styleMap[`max${WH}`];
                                        if (min != null) {
                                            current.app(`layout_constraint${WH}_min`, convertPX(min));
                                            current.styleMap[`min${WH}`] = null;
                                        }
                                        if (max != null) {
                                            current.app(`layout_constraint${WH}_max`, convertPX(max));
                                            current.styleMap[`max${WH}`] = null;
                                        }
                                    }
                                    if (flex.enabled) {
                                        const map = LAYOUT_MAP.constraint;
                                        current.app(`layout_constraint${HV}_weight`, current.flex.grow);
                                        if (current[`view${WH}`] == null && current.flex.grow == 0 && current.flex.shrink <= 1) {
                                            current.android(`layout_${WH.toLowerCase()}`, 'wrap_content');
                                        }
                                        else if (current.flex.grow > 0) {
                                            current.android(`layout_${WH.toLowerCase()}`, '0px');
                                        }
                                        if (current.flex.shrink == 0) {
                                            current.app(`layout_constrained${WH}`, 'true');
                                        }
                                        switch (current.flex.alignSelf) {
                                            case 'flex-start':
                                                current
                                                    .app(map[TL], 'parent')
                                                    .constraint[VH.toLowerCase()] = true;
                                                break;
                                            case 'flex-end':
                                                current
                                                    .app(map[BR], 'parent')
                                                    .constraint[VH.toLowerCase()] = true;
                                                break;
                                            case 'baseline':
                                                current
                                                    .app(map['baseline'], 'parent')
                                                    .constraint.vertical = true;
                                                break;
                                            case 'center':
                                            case 'stretch':
                                                if (current.flex.alignSelf == 'center') {
                                                    current.app(`layout_constraint${VH}_bias`, 0.5);
                                                }
                                                else {
                                                    current.android(`layout_${HW.toLowerCase()}`, '0px');
                                                }
                                                setAlignParent(current, VH.toLowerCase());
                                                break;
                                        }
                                        if (current.flex.basis != 'auto') {
                                            if (/(100|[1-9][0-9]?)%/.test(current.flex.basis)) {
                                                current.app(`layout_constraint${WH}_percent`, parseInt(current.flex.basis));
                                            }
                                            else {
                                                const width = convertPX(current.flex.basis);
                                                if (width != '0px') {
                                                    current.app(`layout_constraintWidth_min`, width);
                                                    current.styleMap.minWidth = null;
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
                                if (flex.enabled && flex.justifyContent != 'normal' && chainDirection.reduce((a, b) => Math.max(a, b.flex.grow), -1) == 0) {
                                    switch (flex.justifyContent) {
                                        case 'space-between':
                                            firstNode.app(chainStyle, 'spread_inside');
                                            break;
                                        case 'space-evenly':
                                            setChainBias(chainDirection, index);
                                            break;
                                        case 'space-around':
                                            firstNode.app(chainStyle, 'spread');
                                            chainDirection.forEach(item => item.app(`layout_constraint${HV}_weight`, item.flex.grow || 1));
                                            break;
                                        default:
                                            let bias = 0.5;
                                            let justifyContent = flex.justifyContent;
                                            if (flex.direction.indexOf('reverse') != -1) {
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
                                        for (const current of chainDirection) {
                                            current.constraint.horizontalChain = [];
                                            current.constraint.verticalChain = [];
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
                if (!flex.enabled) {
                    const anchored = nodes.anchored;
                    if (constraint) {
                        if (anchored.length == 0) {
                            const unbound = nodes.sortAsc('bounds.x', 'bounds.y')[0];
                            if (SETTINGS.useConstraintGuideline) {
                                createGuideline(node, unbound);
                            }
                            else {
                                setAlignParent(unbound, '', true);
                            }
                            anchored.push(unbound);
                        }
                    }
                    do {
                        let restart = false;
                        for (const current of nodes) {
                            if (current.anchors < 2) {
                                const result = (constraint ? search(current.app(), '*constraint*') : search(current.android(), LAYOUT));
                                for (const [key, value] of result) {
                                    if (value != 'parent') {
                                        if (anchored.find(anchor => anchor.stringId == value) != null) {
                                            if (!current.constraint.horizontal && indexOf(key, parseRTL('Left'), parseRTL('Right')) != -1) {
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
                        }
                        if (!restart) {
                            break;
                        }
                    }
                    while (true);
                    if (constraint) {
                        for (const opposite of nodes) {
                            if (opposite.anchors < 2) {
                                if (SETTINGS.useConstraintGuideline) {
                                    createGuideline(node, opposite);
                                }
                                else {
                                    const adjacent = nodes.anchored[0];
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
                                        .app('layout_constraintCircleRadius', formatPX(radius))
                                        .app('layout_constraintCircleAngle', degrees);
                                    opposite.constraint.vertical = true;
                                    opposite.constraint.horizontal = true;
                                }
                                nodes.anchored.forEach(current => {
                                    if (current.anchor(LAYOUT['right']) == 'parent') {
                                        node.constraint.layoutWidth = true;
                                    }
                                    if (current.anchor(LAYOUT['bottom']) == 'parent') {
                                        node.constraint.layoutHeight = true;
                                    }
                                });
                            }
                        }
                    }
                    else {
                        for (const current of nodes) {
                            const parentBottom = current.android('layout_alignParentBottom');
                            if (!anchored.includes(current)) {
                                const parentLeft = parseRTL('layout_alignParentLeft');
                                current.delete('android', LAYOUT);
                                if (parentBottom != 'true') {
                                    const top = formatPX(current.bounds.top - node.box.top);
                                    current
                                        .android('layout_alignParentTop', 'true')
                                        .android('layout_marginTop', top)
                                        .css('marginTop', top);
                                }
                                if (current.android(parentLeft) != 'true') {
                                    const left = formatPX(current.bounds.left - node.box.left);
                                    current
                                        .android(parentLeft, 'true')
                                        .android(parseRTL('layout_marginLeft'), left)
                                        .css(parseRTL('marginLeft'), left);
                                }
                                current.constraint.vertical = true;
                                current.constraint.horizontal = true;
                            }
                            else {
                                adjustMargins([current]);
                            }
                            if (current.android(parseRTL('layout_alignParentRight')) == 'true') {
                                node.constraint.layoutWidth = true;
                            }
                            if (parentBottom == 'true') {
                                node.constraint.layoutHeight = true;
                            }
                        }
                    }
                }
            }
        }
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

    function insetAttributes(output) {
        const namespaces = {};
        for (const node of NODE_CACHE.visible) {
            node.setAndroidDimensions();
            node.namespaces.forEach(value => namespaces[value] = true);
            output = output.replace(`{@${node.id}}`, getViewAttributes(node));
        }
        return output.replace('{@0}', Object.keys(namespaces).sort().map(value => `\n\t${XMLNS_ANDROID[value.toUpperCase()]}`).join(''));
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
                    const style = getComputedStyle(element);
                    const styleMap = {};
                    for (const name of attributes) {
                        if (name.toLowerCase().indexOf('color') != -1) {
                            const color = getByColorName(rule.style[name]);
                            if (color != null) {
                                rule.style[name] = convertRGB(color);
                            }
                        }
                        if (hasValue(element.style[name])) {
                            styleMap[name] = element.style[name];
                        }
                        else if (style[name] == rule.style[name]) {
                            styleMap[name] = style[name];
                        }
                    }
                    if (element.styleMap != null) {
                        Object.assign(element.styleMap, styleMap);
                    }
                    else {
                        element.styleMap = styleMap;
                    }
                }
            }
        }
    }

    function setAccessibility() {
        for (const node of NODE_CACHE.visible) {
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

    function setMarginPadding() {
        for (const node of NODE_CACHE) {
            if (node.isView(WIDGET_ANDROID.LINEAR, WIDGET_ANDROID.RADIO_GROUP)) {
                switch (node.android('orientation')) {
                    case 'horizontal':
                        let left = node.box.left + node.paddingLeft;
                        node.renderChildren.sortAsc('linear.left').forEach(item => {
                            if (!item.floating) {
                                const width = Math.ceil(item.linear.left - left);
                                if (width >= 1) {
                                    item.modifyBox('layout_marginLeft', width);
                                }
                            }
                            left = (item.label || item).linear.right;
                        });
                        break;
                    case 'vertical':
                        let top = node.box.top + node.paddingTop;
                        node.renderChildren.sortAsc('linear.top').forEach(item => {
                            const height = Math.ceil(item.linear.top - top);
                            if (height >= 1) {
                                item.modifyBox('layout_marginTop', height);
                            }
                            top = item.linear.bottom;
                        });
                        break;
                }
            }
            if (SETTINGS.targetAPI >= BUILD_ANDROID.OREO) {
                if (node.visible) {
                    const marginLeft_RTL = parseRTL('layout_marginLeft');
                    const marginRight_RTL = parseRTL('layout_marginRight');
                    const paddingLeft_RTL = parseRTL('paddingLeft');
                    const paddingRight_RTL = parseRTL('paddingRight');
                    const marginTop = convertInt(node.android('layout_marginTop'));
                    const marginRight = convertInt(node.android(marginRight_RTL));
                    const marginBottom = convertInt(node.android('layout_marginBottom'));
                    const marginLeft = convertInt(node.android(marginLeft_RTL));
                    if (marginTop != 0 && marginTop == marginBottom && marginBottom == marginLeft && marginLeft == marginRight) {
                        node.delete('android', 'layout_margin*')
                            .android('layout_margin', formatPX(marginTop));
                    }
                    else {
                        if (marginTop != 0 && marginTop == marginBottom) {
                            node.delete('android', 'layout_marginTop', 'layout_marginBottom')
                                .android('layout_marginVertical', formatPX(marginTop));
                        }
                        if (marginLeft != 0 && marginLeft == marginRight) {
                            node.delete('android', marginLeft_RTL, marginRight_RTL)
                                .android('layout_marginHorizontal', formatPX(marginLeft));
                        }
                    }
                    const paddingTop = convertInt(node.android('paddingTop'));
                    const paddingRight = convertInt(node.android(paddingRight_RTL));
                    const paddingBottom = convertInt(node.android('paddingBottom'));
                    const paddingLeft = convertInt(node.android(paddingLeft_RTL));
                    if (paddingTop != 0 && paddingTop == paddingBottom && paddingBottom == paddingLeft && paddingLeft == paddingRight) {
                        node.delete('android', 'padding*')
                            .android('padding', formatPX(paddingTop));
                    }
                    else {
                        if (paddingTop != 0 && paddingTop == paddingBottom) {
                            node.delete('android', 'paddingTop', 'paddingBottom')
                                .android('paddingVertical', formatPX(paddingTop));
                        }
                        if (paddingLeft != 0 && paddingLeft == paddingRight) {
                            node.delete('android', paddingLeft_RTL, paddingRight_RTL)
                                .android('paddingHorizontal', formatPX(paddingLeft));
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
                            column
                                .android(`layout_${(horizontal ? 'width' : 'height')}`, '0px')
                                .android('layout_weight', (percent[i] / 100).toFixed(2));
                        }
                    }
                }
            }
        }
    }

    function createNode(element) {
        if (isVisible(element)) {
            const node = new Node(generateNodeId(), element, SETTINGS.targetAPI);
            NODE_CACHE.push(node);
        }
    }

    function setNodeCache(element) {
        let nodeTotal = 0;
        (element || document.body).childNodes.forEach(element => {
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
        const elements = (element != null ? element.querySelectorAll('*') : document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *')));
        if (element != null) {
            createNode(element);
        }
        for (const i in elements) {
            if (INLINE_CHROME.includes(elements[i].tagName) && (MAPPING_CHROME[elements[i].parentNode.tagName] != null || INLINE_CHROME.includes(elements[i].parentNode.tagName))) {
                continue;
            }
            createNode(elements[i]);
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
                    break;
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
        const textNodes = new NodeList$1();
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
        for (const node of NODE_CACHE) {
            const nodes = parentNodes[node.id];
            if (nodes != null) {
                let parent = node.parentElement.androidNode;
                if (node.fixed) {
                    if (nodes.length > 1) {
                        let minArea = Number.MAX_VALUE;
                        for (const current of nodes) {
                            const area = (current.box.left - node.linear.left) + (current.box.right - node.linear.right) + (current.box.top - node.linear.top) + (current.box.bottom - node.linear.bottom);
                            if (area < minArea) {
                                parent = current;
                                minArea = area;
                            }
                            else if (area == minArea) {
                                if (current.element == node.parentElement) {
                                    parent = current;
                                }
                            }
                        }
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
        }
        NODE_CACHE.push(...textNodes);
        for (const node of NODE_CACHE) {
            const style = preAlignment[node.id];
            if (style != null) {
                for (const attr in style) {
                    node.element.style[attr] = style[attr];
                }
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

    function parseDocument(element) {
        if (typeof element == 'string') {
            element = document.getElementById(element);
        }
        let output = `<?xml version="1.0" encoding="utf-8"?>\n{0}`;
        const mapX = [];
        const mapY = [];
        setStyleMap();
        setNodeCache(element);
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
                mapX[node.depth][x] = new NodeList$1();
            }
            if (mapY[node.depth][y] == null) {
                mapY[node.depth][y] = new NodeList$1();
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
                        let tagName = nodeY.widgetName;
                        let restart = false;
                        let xml = '';
                        if (tagName == null) {
                            if ((nodeY.children.length == 0 && hasFreeFormText(nodeY.element)) || nodeY.children.every(item => INLINE_CHROME.includes(item.tagName))) {
                                tagName = WIDGET_ANDROID.TEXT;
                            }
                            else if (nodeY.children.length > 0) {
                                const rows = nodeY.children;
                                if (SETTINGS.useGridLayout && !nodeY.flex.enabled && rows.length > 1 && rows.every(item => !item.flex.enabled && (BLOCK_CHROME.includes(item.tagName) && item.children.length > 0))) {
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
                                        nodeY.gridColumnSpan = (SETTINGS.useLayoutWeight ? columns[0].length : columns.length);
                                        xml += writeGridLayout(nodeY, parent, nodeY.gridColumnSpan);
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
                                    if (!nodeY.flex.enabled && linearX && linearY) {
                                        xml += writeFrameLayout(nodeY, parent);
                                    }
                                    else if ((!nodeY.flex.enabled || nodeY.children.every(item => item.flex.enabled)) && (linearX || linearY)) {
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
                                    siblings = new NodeList$1(nodeY.gridSiblings);
                                }
                                else {
                                    const columnEnd = parent.gridColumnEnd[nodeY.gridIndex + (nodeY.android('layout_columnSpan') || 1) - 1];
                                    siblings = nodeY.parentOriginal.children.filter(item => !item.renderParent && item.bounds.left >= nodeY.bounds.right && item.bounds.right <= columnEnd);
                                }
                                if (siblings.length > 0) {
                                    siblings.unshift(nodeY);
                                    siblings.sortAsc('bounds.x');
                                    const renderParent = parent;
                                    const wrapNode = Node.createWrapNode(generateNodeId(), nodeY, SETTINGS.targetAPI, parent, siblings, [0]);
                                    NODE_CACHE.push(wrapNode);
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
                                    for (const node of siblings) {
                                        node.parent = wrapNode;
                                        wrapNode.inheritGrid(node);
                                    }
                                    wrapNode.setBounds();
                                    if (siblings.linearX || siblings.linearY) {
                                        xml += writeLinearLayout(wrapNode, renderParent, siblings.linearY);
                                    }
                                    else {
                                        xml += writeDefaultLayout(wrapNode, renderParent);
                                    }
                                    k--;
                                    restart = true;
                                }
                            }
                            if (!nodeY.renderParent && !restart) {
                                xml += renderViewTag(nodeY, parent, tagName);
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
        setResourceStyle(NODE_CACHE);
        if (SETTINGS.showAttributes) {
            setMarginPadding();
            if (SETTINGS.useLayoutWeight) {
                setLayoutWeight();
            }
            setAccessibility();
            setConstraints();
            output = insetAttributes(output);
        }
        output = insertViewBeforeAfter(output);
        output = output.replace(/{[<@>]{1}[0-9]+}/g, '');
        if (SETTINGS.useUnitDP) {
            output = insetDP(output, SETTINGS.density);
        }
        return output;
    }

    const settings = SETTINGS;

    exports.parseDocument = parseDocument;
    exports.settings = settings;
    exports.BUILD_ANDROID = BUILD_ANDROID;
    exports.DENSITY_ANDROID = DENSITY_ANDROID;
    exports.API_ANDROID = API_ANDROID;
    exports.writeResourceDrawableXml = writeResourceDrawableXml;
    exports.writeResourceColorXml = writeResourceColorXml;
    exports.writeResourceStyleXml = writeResourceStyleXml;
    exports.writeResourceArrayXml = writeResourceArrayXml;
    exports.writeResourceStringXml = writeResourceStringXml;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
