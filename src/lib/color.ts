interface Color {
    name: string;
    hex: string;
    rgb?: {
        r: number;
        g: number;
        b: number;
    };
    hsl?: {
        h: number;
        s: number;
        l: number;
    };
}

const X11_CSS3 = {
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

const HSL_SORTED: Color[] = [];
for (const i in X11_CSS3) {
    const x11: Color = X11_CSS3[i];
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

function convertHextoHSL(value: string) {
    const rgb = convertHextoRGB(value);
    if (rgb != null) {
        return convertRGBtoHSL(rgb.r, rgb.g, rgb.b);
    }
    return null;
}

function convertRGBtoHSL(r: number, g: number, b: number) {
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

function sortHSL(a: Color, b: Color) {
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

export function findNearestColor(value: string) {
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

export function getByColorName(value: string) {
    for (const color in X11_CSS3) {
        if (color.toLowerCase() === value.trim().toLowerCase()) {
            return X11_CSS3[color];
        }
    }
    return '';
}

export function convertRGB({ rgb }: Color) {
    return (rgb != null ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '');
}

export function parseRGBA(value: string, opacity = '1'): string[] {
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

export function convertRGBtoHex(value: string) {
    const hex = '0123456789ABCDEF';
    let rgb = parseInt(value);
    if (isNaN(rgb)) {
        return '00';
    }
    rgb = Math.max(0, Math.min(rgb, 255));
    return hex.charAt((rgb - (rgb % 16)) / 16) + hex.charAt(rgb % 16);
}

export function convertHextoRGB(value: string) {
    value = value.replace('#', '').trim();
    if (value.length === 3) {
        value = value.charAt(0).repeat(2) + value.charAt(1).repeat(2) + value.charAt(2).repeat(2);
    }
    if (value.length === 6) {
        return { r: parseInt(value.substring(0, 2), 16), g: parseInt(value.substring(2, 4), 16), b: parseInt(value.substring(4), 16) };
    }
    return null;
}

export function parseHex(value: string) {
    if (value !== '') {
        value = value.trim();
        const color = parseRGBA(value);
        if (color.length > 0) {
            value = color[0];
        }
        if (value.charAt(0) === '#' && /^#[a-zA-Z0-9]{3,6}$/.test(value)) {
            return (value.length === 4 ? parseRGBA(convertRGB(<Color> { rgb: convertHextoRGB(value) }))[0] : value);
        }
    }
    return '';
}