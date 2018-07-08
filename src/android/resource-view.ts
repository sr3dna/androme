import { ArrayMap, BorderAttribute, Null, ObjectMap, ResourceMap, StringMap, ViewData } from '../lib/types';
import Resource from '../base/resource';
import File from '../base/file';
import View from './view';
import { capitalize, formatString, hasValue, repeat } from '../lib/util';
import { getTemplateLevel, placeIndent, insertTemplateData, parseTemplate, replaceDP } from '../lib/xml';
import { sameAsParent } from '../lib/dom';
import { parseHex } from '../lib/color';
import { VIEW_STANDARD } from '../lib/constants';
import { FONT_ANDROID, FONTALIAS_ANDROID, FONTWEIGHT_ANDROID } from './constants';
import parseRTL from './localization';
import SETTINGS from '../settings';

import SHAPERECTANGLE_TMPL from './template/resource/shape-rectangle';
import LAYERLIST_TMPL from './template/resource/layer-list';

const STORED: ResourceMap = {
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

interface TagStyle {
    name?: string;
    attributes: string;
    ids: number[];
}

export default class ResourceView<T extends View> extends Resource<T> {
    private tagStyle: ObjectMap<any> = {};
    private tagCount: ObjectMap<number> = {};

    constructor(file: File<T>) {
        super(file);
        this.file.stored = STORED;
    }

    public finalize(viewData: ViewData<T>) {
        this.processFontStyle(viewData);
    }

    public reset() {
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

    public setBoxSpacing() {
        super.setBoxSpacing();
        this.cache.elements.forEach(node => {
            const stored = (<any> node.element).__boxSpacing;
            if (stored != null) {
                const method: StringMap = METHOD_ANDROID['boxSpacing'];
                for (const i in stored) {
                    node.attr(formatString(parseRTL(method[i]), stored[i]), (node.renderExtension == null));
                }
            }
        });
    }

    public setBoxStyle() {
        super.setBoxStyle();
        this.cache.elements.forEach(node => {
            const element = node.element;
            const object: any = element;
            const stored = object.__boxStyle;
            if (stored != null) {
                const method = METHOD_ANDROID['boxStyle'];
                const label = node.label;
                if (label && !sameAsParent(label.element, 'backgroundColor')) {
                    stored.backgroundColor = (<any> label.element).__boxStyle.backgroundColor;
                }
                if (this.borderVisible(stored.borderTop) || this.borderVisible(stored.borderRight) || this.borderVisible(stored.borderBottom) || this.borderVisible(stored.borderLeft) || stored.backgroundImage !== '' || stored.borderRadius.length > 0) {
                    let template: Null<ObjectMap<string>> = null;
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
                        const borderRadius = {};
                        if (stored.borderRadius.length > 1) {
                            Object.assign(borderRadius, {
                                topLeftRadius: stored.borderRadius[0],
                                topRightRadius: stored.borderRadius[1],
                                bottomRightRadius: stored.borderRadius[2],
                                bottomLeftRadius: stored.borderRadius[3]
                            });
                        }
                        [stored.borderTop, stored.borderRight, stored.borderBottom, stored.borderLeft].forEach((item: BorderAttribute, index) => {
                            if (this.borderVisible(item)) {
                                const hideWidth = `-${item.width}`;
                                const layerList: ObjectMap<any> = {
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
                            resourceName = `${node.tagName.toLowerCase()}_${node.viewId}`;
                            STORED.DRAWABLES.set(resourceName, xml);
                        }
                    }
                    node.attr(formatString(method['background'], resourceName), (node.renderExtension == null));
                }
                else if (object.__fontStyle == null && stored.backgroundColor.length > 0) {
                    node.attr(formatString(method['backgroundColor'], stored.backgroundColor[0]), (node.renderExtension == null));
                }
            }
        });
    }

    public setFontStyle() {
        super.setFontStyle();
        const tagName: ObjectMap<T[]> = {};
        this.cache.list.forEach(node => {
            if ((<any> node.element).__fontStyle != null) {
                if (tagName[node.tagName] == null) {
                    tagName[node.tagName] = [];
                }
                tagName[node.tagName].push(node);
            }
        });
        for (const tag in tagName) {
            const nodes: T[] = tagName[tag];
            const sorted: any[] = [];
            nodes.forEach(node => {
                if (node.labelFor != null) {
                    return;
                }
                let system = false;
                let labelFor: Null<T> = null;
                if (node.label != null) {
                    labelFor = node;
                    node = (<T> node.label);
                }
                const element = node.element;
                const nodeId = (labelFor || node).id;
                const stored = Object.assign({}, (<any> element).__fontStyle);
                if (stored.fontFamily != null) {
                    const fontFamily: string = stored.fontFamily.toLowerCase().split(',')[0].replace(/"/g, '').trim();
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
                    if (!system) {
                        const fonts = STORED.FONTS.get(fontFamily) || {};
                        Object.assign(fonts, { [`${fontStyle}-${fontWeight}`]: true });
                        STORED.FONTS.set(fontFamily, fonts);
                    }
                }
                const method: StringMap = METHOD_ANDROID['fontStyle'];
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
                        sorted[i][attr].push(nodeId);
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

    public setImageSource() {
        super.setImageSource();
        this.cache.list.filter(node => node.tagName === 'IMG').forEach(node => {
            const object: any = node.element;
            const stored = object.__imageSource;
            if (stored != null) {
                const method = METHOD_ANDROID['imageSource'];
                node.attr(formatString(method['src'], stored), (node.renderExtension == null));
            }
        });
    }

    public setOptionArray() {
        super.setOptionArray();
        this.cache.list.filter(node => node.tagName === 'SELECT').forEach(node => {
            const stored: ArrayMap<string> = (<any> node.element).__optionArray;
            const method = METHOD_ANDROID['optionArray'];
            let result: string[] = [];
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
                arrayName = `${node.viewId}_array`;
                STORED.ARRAYS.set(arrayName, result);
            }
            node.attr(formatString(method['entries'], arrayName), (node.renderExtension == null));
        });
    }

    public setValueString() {
        super.setValueString();
        this.cache.list.forEach(node => {
            const element = (node.label != null ? node.label.element : node.element);
            const stored = (<any> element).__valueString;
            if (stored != null) {
                const method = METHOD_ANDROID['valueString'];
                let value = (<string> STORED.STRINGS.get(stored));
                if (node.is(VIEW_STANDARD.TEXT) && node.style != null) {
                    const match = (<any> node.style).textDecoration.match(/(underline|line-through)/);
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
        });
    }

    public addResourceTheme(template: string, data: ObjectMap<any>, options: ObjectMap<any>) {
        const map: ObjectMap<string> = parseTemplate(template);
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

    private processFontStyle(viewData: ViewData<T>) {
        const style: ObjectMap<any> = {};
        const layout: ObjectMap<any> = {};
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
                    maxB = Math.max(b[attr].length, maxB);
                    countB += b[attr].length;
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
                    const styleKey: ObjectMap<number[]> = {};
                    const layoutKey: ObjectMap<number[]> = {};
                    for (let i = 0; i < sorted.length; i++) {
                        const filtered: ObjectMap<number[]> = {};
                        const combined: ObjectMap<Set<string>> = {};
                        const deleteKeys = new Set();
                        for (const attr1 in sorted[i]) {
                            if (sorted[i] == null) {
                                continue;
                            }
                            const ids: number[] = sorted[i][attr1];
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
                                const found: ObjectMap<number[]> = {};
                                let merged = false;
                                for (let j = 0; j < sorted.length; j++) {
                                    if (i !== j) {
                                        for (const attr in sorted[j]) {
                                            const compare = sorted[j][attr];
                                            for (const nodeId of ids) {
                                                if (compare.includes(nodeId)) {
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
                            const ids = index.split(',').map((value: string) => parseInt(value));
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
                    sorted = sorted.filter((item: number[]) => item && item.length > 0);
                }
            }
            while (sorted.length > 0);
        }
        const resource: ObjectMap<TagStyle[]> = {};
        for (const tagName in style) {
            const tag = style[tagName];
            const tagData: TagStyle[] = [];
            for (const attributes in tag) {
                tagData.push({ attributes, ids: tag[attributes]});
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
            for (const item of (<TagStyle[]> resource[tagName])) {
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
                    for (const id of (<number[]> tagData[attr])) {
                        if (attr.startsWith('android:background=')) {
                            const node: Null<T> = viewData.cache.find(item => item.id === id);
                            if (node && node.android('backround') != null) {
                                continue;
                            }
                        }
                        if (map[id] == null) {
                            map[id] = { styles: [], attributes: [] };
                        }
                        map[id].attributes.push(attr);
                    }
                }
            }
        }
        for (const id in map) {
            const node: Null<T> = viewData.cache.find(item => item.id === parseInt(id));
            if (node != null) {
                const styles = map[id].styles;
                const attributes = map[id].attributes;
                const indent = repeat(node.renderDepth + 1);
                let append = '';
                if (styles.length > 0) {
                    inherit.add(styles.join('.'));
                    append += `\n${indent}style="@style/${styles.pop()}"`;
                }
                if (attributes.length > 0) {
                    attributes.sort().forEach((value: string) => append += `\n${indent}${replaceDP(value, true)}`);
                }
                let replaced = false;
                [node, node.parent].some(item => {
                    if (item.renderExtension != null) {
                        const attr = `${item.renderExtension.name}:insert`;
                        let output = (<string> item.data(attr));
                        if (output) {
                            const pattern = `{&${id}}`;
                            if (output.indexOf(pattern) !== -1) {
                                output = output.replace(`{&${id}}`, placeIndent(append));
                                item.data(attr, output);
                                replaced = true;
                                return true;
                            }
                        }
                    }
                    return false;
                });
                if (!replaced) {
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
        }
        for (const styles of inherit) {
            let parent = '';
            (<string> styles).split('.').forEach(value => {
                const match = value.match(/^(\w*?)(?:_([0-9]+))?$/);
                if (match != null) {
                    const tagData = resource[match[1].toUpperCase()][(match[2] == null ? 0 : parseInt(match[2]))];
                    STORED.STYLES.set(value, { parent, attributes: tagData.attributes });
                    parent = value;
                }
            });
        }
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

    private getShapeAttribute(stored: ObjectMap<any>, name: string) {
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
                const result: StringMap = {};
                stored.borderRadius.forEach((value: string, index: number) => result[`${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius`] = value);
                return result;
        }
    }
}