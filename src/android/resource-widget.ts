import { IStringMap } from '../lib/types';
import Resource from '../base/resource';
import Widget from './widget';
import { formatString, hasValue, replaceDP } from '../lib/util';
import { sameAsParent } from '../lib/dom';
import { getDataLevel, parseTemplateData, parseTemplateMatch } from '../lib/xml';
import parseRTL from './localization';
import SETTINGS from '../settings';
import { NODE_STANDARD } from '../lib/constants';
import { BUILD_ANDROID } from './constants';

import STRING_TMPL from './tmpl/resources/string';
import STRINGARRAY_TMPL from './tmpl/resources/string-array';
import STYLE_TMPL from './tmpl/resources/style';
import FONT_TMPL from './tmpl/resources/font';
import COLOR_TMPL from './tmpl/resources/color';
import DRAWABLE_TMPL from './tmpl/resources/drawable';
import SHAPERECTANGLE_TMPL from './tmpl/resources/shape-rectangle';
import LAYERLIST_TMPL from './tmpl/resources/layer-list';

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
    'sans-serif': BUILD_ANDROID.ICE_CREAM_SANDWICH,
    'sans-serif-thin': BUILD_ANDROID.JELLYBEAN,
    'sans-serif-light': BUILD_ANDROID.JELLYBEAN,
    'sans-serif-condensed': BUILD_ANDROID.JELLYBEAN,
    'sans-serif-condensed-light': BUILD_ANDROID.JELLYBEAN,
    'sans-serif-medium': BUILD_ANDROID.LOLLIPOP,
    'sans-serif-black': BUILD_ANDROID.LOLLIPOP,
    'sans-serif-smallcaps': BUILD_ANDROID.LOLLIPOP,
    'serif-monospace' : BUILD_ANDROID.LOLLIPOP,
    'serif': BUILD_ANDROID.LOLLIPOP,
    'casual' : BUILD_ANDROID.LOLLIPOP,
    'cursive': BUILD_ANDROID.LOLLIPOP,
    'monospace': BUILD_ANDROID.LOLLIPOP,
    'sans-serif-condensed-medium': BUILD_ANDROID.OREO
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

type T = Widget;

export class ResourceWidget extends Resource<T> {
    constructor() {
        super();
    }

    public setBoxSpacing() {
        super.setBoxSpacing();
        this.cache.elements.forEach((node: T) => {
            const stored = (<any> node.element).__boxSpacing;
            if (stored != null) {
                const method = METHOD_ANDROID['boxSpacing'];
                for (const i in stored) {
                    node.attr(formatString(parseRTL(method[i]), stored[i]));
                }
            }
        });
    }

    public setBoxStyle() {
        super.setBoxStyle();
        this.cache.elements.forEach((node: T) => {
            const stored = (<any> node.element).__boxStyle;
            if (stored != null) {
                const method = METHOD_ANDROID['boxStyle'];
                const borderStyle: IStringMap = {
                    black: 'android:color="@android:color/black"',
                    solid: `android:color="@color/${stored.border[2]}"`
                };
                borderStyle.dotted = `${borderStyle.solid} android:dashWidth="3px" android:dashGap="1px"`;
                borderStyle.dashed = `${borderStyle.solid} android:dashWidth="1px" android:dashGap="1px"`;
                borderStyle.default = borderStyle[stored.border[0]] || borderStyle.black;
                if (stored.border[0] !== 'none') {
                    let template: {};
                    let data: {};
                    let resourceName = '';
                    if (stored.backgroundColor === '' && stored.backgroundImage === '' && stored.borderRadius.length === 0) {
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
                                    '3': (stored.backgroundColor !== '' ? [{ color: `@color/${stored.backgroundColor[0]}` }] : false),
                                    '4': (stored.borderRadius.length === 1 ? [{ radius: stored.borderRadius[0] }] : false),
                                    '5': (stored.borderRadius.length > 1 ? [{ topLeftRadius: '' }] : false)
                                }],
                                '6': (stored.backgroundImage !== '' ? [{ image: stored.backgroundImage, width: stored.backgroundSize[0], height: stored.backgroundSize[1] }] : false)
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
                            stored.borderRadius.forEach((value: string, index: number) => borderRadiusItem[`${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius`] = value);
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
                else if (stored.backgroundColor !== '') {
                    node.attr(formatString(method['backgroundColor'], stored.backgroundColor[0]));
                }
            }
        });
    }

    public setFontStyle() {
        super.setFontStyle();
        const tagName = {};
        const style = {};
        const layout = {};
        this.cache.elements.forEach((node: T) => {
            if ((<any> node.element).__fontStyle != null) {
                if (tagName[node.tagName] == null) {
                    tagName[node.tagName] = [];
                }
                tagName[node.tagName].push(node);
            }
        });
        for (const tag in tagName) {
            const nodes = tagName[tag];
            let sorted: any[] = [];
            nodes.forEach((node: T) => {
                if (node.labelFor != null) {
                    return;
                }
                let system = false;
                let labelFor: T | null = null;
                if (node.label != null) {
                    labelFor = node;
                    node = node.label;
                }
                const element = node.element;
                if (element != null) {
                    const id = (labelFor || node).id;
                    const stored = Object.assign({}, (<any> element).__fontStyle);
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
                    if (stored.color !== '') {
                        if (SETTINGS.excludeTextColor && SETTINGS.excludeTextColor.includes(stored.color[1])) {
                            delete stored.color;
                        }
                        else {
                            stored.color = `@color/${stored.color[0]}`;
                        }
                    }
                    if (stored.backgroundColor !== '') {
                        if (labelFor != null) {
                            stored.backgroundColor = (<any> labelFor.element).__fontStyle.backgroundColor;
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
            });
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
                                            const compare = sorted[j][attr];
                                            for (const id of ids) {
                                                if (compare.includes(id)) {
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
                            const ids = index.split(',').map((value: string) => parseInt(value));
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
                    sorted = sorted.filter((item: number[]) => item && item.length > 0);
                }
            }
            while (sorted.length > 0);
        }
        const resource = {};
        for (const name in style) {
            const tag = style[name];
            const tagData: any[] = [];
            for (const attributes in tag) {
                tagData.push({ attributes, ids: tag[attributes]});
            }
            tagData.sort((a: any, b: any) => {
                let [c, d] = [a.ids.length, b.ids.length];
                if (c === d) {
                    [c, d] = [a.attributes.split(';').length, b.attributes.split(';').length];
                }
                return (c >= d ? -1 : 1);
            });
            tagData.forEach((item: any, index: number) => item.name = `${name.charAt(0) + name.substring(1).toLowerCase()}_${(index + 1)}`);
            resource[name] = tagData;
        }
        const inherit = new Set();
        this.cache.elements.forEach((node: T) => {
            if (resource[node.tagName] != null) {
                const styles: string[] = [];
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
            const tagData: {} = layout[node.tagName];
            if (tagData != null) {
                for (const attr in tagData) {
                    if (tagData[attr].includes(node.id)) {
                        node.attr(attr);
                    }
                }
            }
        });
        for (const styles of inherit) {
            let parent = '';
            styles.split('.').forEach((value: string) => {
                const match = value.match(/^(\w+)_([0-9]+)$/);
                if (match != null) {
                    const tagData = resource[match[1].toUpperCase()][parseInt(match[2]) - 1];
                    STORED.STYLES.set(value, { parent, attributes: tagData.attributes });
                    parent = value;
                }
            });
        }
    }

    public setImageSource() {
        super.setImageSource();
        this.cache.filter((item: T) => item.tagName === 'IMG').forEach((node: T) => {
            const stored = (<any> node.element).__imageSource;
            if (stored != null) {
                const method = METHOD_ANDROID['imageSource'];
                node.attr(formatString(method['src'], stored));
            }
        });
    }

    public setOptionArray() {
        super.setOptionArray();
        this.cache.filter((item: T) => item.tagName === 'SELECT').forEach((node: T) => {
            const stored = (<any> node.element).__optionArray;
            const method = METHOD_ANDROID['optionArray'];
            let result: string[] = [];
            if (stored.stringArray != null) {
                for (const value of stored.stringArray) {
                    const name = Resource.STORED.STRINGS.get(value);
                    result.push((name != null ? `@string/${name}` : value));
                }
            }
            if (stored.numberArray != null) {
                result = stored.numberArray;
            }
            const arrayName = `${node.androidId}_array`;
            STORED.ARRAYS.set(arrayName, result);
            node.attr(formatString(method['entries'], arrayName));
        });
    }

    public setValueString() {
        super.setValueString();
        this.cache.elements.forEach((node: T) => {
            const element = (node.label != null ? node.label.element : node.element);
            const stored = (<any> element).__valueString;
            if (stored != null) {
                const method = METHOD_ANDROID['valueString'];
                const name = Resource.STORED.STRINGS.get(stored);
                if (node.is(NODE_STANDARD.TEXT) && element instanceof HTMLElement) {
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
        });
    }

    private deleteStyleAttribute(sorted: any, attributes: string, ids: number[]) {
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
                        sorted[index][key] = sorted[index][key].filter((id: number) => !ids.includes(id));
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

export function writeResourceStringXml() {
    Resource.STORED.STRINGS = new Map([...Resource.STORED.STRINGS.entries()].sort());
    let xml = '';
    if (Resource.STORED.STRINGS.size > 0) {
        const template = parseTemplateMatch(STRING_TMPL);
        const data: {} = {
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

export function writeResourceArrayXml() {
    STORED.ARRAYS = new Map([...STORED.ARRAYS.entries()].sort());
    let xml = '';
    if (STORED.ARRAYS.size > 0) {
        const template = parseTemplateMatch(STRINGARRAY_TMPL);
        const data: {} = {
            '0': [{
                '1': []
            }]
        };
        const rootItem = getDataLevel(data, '0');
        for (const [name, values] of STORED.ARRAYS.entries()) {
            const arrayItem: {} = {
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

export function writeResourceStyleXml() {
    let xml = '';
    if (STORED.STYLES.size > 0) {
        const template = parseTemplateMatch(STYLE_TMPL);
        const data: {} = {
            '0': [{
                '1': []
            }]
        };
        const rootItem = getDataLevel(data, '0');
        for (const [name1, style] of STORED.STYLES.entries()) {
            const styleItem: {} = {
                name1,
                parent: style.parent || '',
                '2': []
            };
            style.attributes.split(';').sort().forEach((attr: string) => {
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

export function writeResourceFontXml() {
    STORED.FONTS = new Map([...STORED.FONTS.entries()].sort());
    let xml = '';
    if (STORED.FONTS.size > 0) {
        const template = parseTemplateMatch(FONT_TMPL);
        for (const [name, font] of STORED.FONTS.entries()) {
            const data: {} = {
                '#include': {},
                '#exclude': {},
                '0': [{
                    name,
                    '1': []
                }]
            };
            data[(SETTINGS.targetAPI < BUILD_ANDROID.OREO ? '#include' : '#exclude')]['app'] = true;
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

export function writeResourceColorXml() {
    let xml = '';
    if (Resource.STORED.COLORS.size > 0) {
        Resource.STORED.COLORS = new Map([...Resource.STORED.COLORS.entries()].sort());
        const template = parseTemplateMatch(COLOR_TMPL);
        const data: {} = {
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

export function writeResourceDrawableXml() {
    let xml = '';
    if (STORED.DRAWABLES.size > 0 || Resource.STORED.IMAGES.size > 0) {
        const template = parseTemplateMatch(DRAWABLE_TMPL);
        const data: {} = {
            '0': []
        };
        const rootItem = data['0'];
        for (const [name, value] of STORED.DRAWABLES.entries()) {
            rootItem.push({ name: `res/drawable/${name}.xml`, value});
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