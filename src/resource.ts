import { WIDGET_ANDROID, BUILD_ANDROID } from './lib/constants';
import Widget from './android/widget';
import WidgetList from './android/widgetlist';
import { cameltoLowerCase, convertPX, generateId, hasValue, isNumber, padLeft, remove, replaceDP } from './lib/util';
import { convertRGBtoHex, findNearestColor, parseRGBA } from './lib/color';
import { getBoxSpacing, getStyle } from './lib/dom';
import { getDataLevel, parseTemplateData, parseTemplateMatch } from './lib/xml';
import SETTINGS from './settings';

import STRING_TMPL from './tmpl/resources/string';
import STRINGARRAY_TMPL from './tmpl/resources/string-array';
import STYLE_TMPL from './tmpl/resources/style';
import FONT_TMPL from './tmpl/resources/font';
import COLOR_TMPL from './tmpl/resources/color';
import DRAWABLE_TMPL from './tmpl/resources/drawable';
import SHAPERECTANGLE_TMPL from './tmpl/resources/shape-rectangle';
import LAYERLIST_TMPL from './tmpl/resources/layer-list';

const RESOURCE = {
    STRING: new Map(),
    ARRAY: new Map(),
    COLOR: new Map(),
    FONT: new Map(),
    IMAGE: new Map(),
    DRAWABLE: new Map(),
    STYLE: new Map()
};

const PROPERTY_ANDROID =
{
    'backgroundStyle': {
        'background': 'android:background="@drawable/{0}"',
        'backgroundColor': 'android:background="{0}"'
    },
    'computedStyle': {
        'fontWeight': 'android:fontWeight="{0}"',
        'fontStyle': 'android:textStyle="{0}"',
        'fontFamily': 'android:fontFamily="{0}"',
        'fontSize': 'android:textSize="{0}"',
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

export const ACTION_ANDROID =
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

function parseBorderStyle(value: string) {
    const stroke = value.match(/(none|dotted|dashed|solid)/);
    const width = value.match(/([0-9.]+(?:px|pt|em))/);
    const color = parseRGBA(value);
    return [(stroke != null ? stroke[1] : 'solid'), (width != null ? convertPX(width[1]) : '1px'), (color != null ? color[1] : '#000')];
}

function parseImageURL(value: string) {
    const match = value.match(/^url\("(.*?)"\)$/);
    if (match != null) {
        return addResourceImage(match[1]);
    }
    return null;
}

function parseBoxDimensions(value: string) {
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

function deleteStyleAttribute(sorted: any, attributes: string, ids: number[]) {
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

export function setResourceStyle(cache: WidgetList<Widget>) {
    const tagName = {};
    const style = {};
    const layout = {};
    for (const node of cache) {
        if (node.styleAttributes.length > 0) {
            if (tagName[node.tagName] == null) {
                tagName[node.tagName] = [];
            }
            tagName[node.tagName].push(node);
        }
    }
    for (const tag in tagName) {
        const nodes = tagName[tag];
        let sorted = Array.from({ length: Math.max.apply(null, nodes.map((item: Widget) => item.styleAttributes.length)) }, value => {
            value = {};
            return value;
        });
        for (let node of nodes) {
            if (node.labelFor != null) {
                continue;
            }
            let system = false;
            let fontName = '';
            let fontWeight: string[] = [];
            let fontStyle: string[] = [];
            let labelFor: Widget = null;
            if (node.label != null) {
                labelFor = node;
                node = node.label;
            }
            const id = (labelFor || node).id;
            for (let i = 0; i < node.styleAttributes.length; i++) {
                let value = node.styleAttributes[i];
                let match: any = null;
                switch (i) {
                    case 0:
                        if ((match = value.match(/fontWeight="(.*?)"$/)) != null) {
                            fontWeight = [value, match[1]];
                        }
                        break;
                    case 1:
                        if ((match = value.match(/textStyle="(.*?)"$/)) != null) {
                            fontStyle = [value, match[1]];
                        }
                        break;
                    case 2:
                        if ((match = value.match(/fontFamily=("+(.*?)"+)$/)) != null) {
                            fontName = match[2].toLowerCase().split(',')[0].replace(/"/g, '').trim();
                            if ((FONT_ANDROID[fontName] && SETTINGS.targetAPI >= FONT_ANDROID[fontName]) || (SETTINGS.useFontAlias && FONTALIAS_ANDROID[fontName] && SETTINGS.targetAPI >= FONT_ANDROID[FONTALIAS_ANDROID[fontName]])) {
                                system = true;
                                value = value.replace(match[1], `"${fontName}"`);
                            }
                            else {
                                value = value.replace(match[1], `"@font/${fontName.replace(/ /g, '_') + (fontStyle[1] !== 'normal' ? `_${fontStyle[1]}` : '') + (fontWeight[1] !== '400' ? `_${FONTWEIGHT_ANDROID[fontWeight[1]] || fontWeight[1]}` : '')}"`);
                                remove(sorted[0][fontWeight[0]], id);
                                remove(sorted[1][fontStyle[0]], id);
                            }
                        }
                        break;
                    case 4:
                        if ((match = parseRGBA(value)) != null) {
                            if (SETTINGS.excludeTextColor && SETTINGS.excludeTextColor.includes(match[1].toString())) {
                                continue;
                            }
                            const name = addResourceColor(match[1].toString());
                            value = value.replace(match[0], name);
                        }
                        break;
                    case 5:
                        if (labelFor != null) {
                            value = labelFor.styleAttributes[i];
                        }
                        if (hasValue(value) && (match = parseRGBA(value)) != null) {
                            if (SETTINGS.excludeBackgroundColor && SETTINGS.excludeBackgroundColor.includes(match[1].toString())) {
                                continue;
                            }
                            const name = addResourceColor(match[1].toString());
                            value = value.replace(match[0], name);
                        }
                        break;
                }
                if (hasValue(value)) {
                    if (sorted[i][value] == null) {
                        sorted[i][value] = [];
                    }
                    sorted[i][value].push(id);
                }
            }
            if (!system) {
                if (!RESOURCE.FONT.has(fontName)) {
                    RESOURCE.FONT.set(fontName, {});
                }
                RESOURCE.FONT.get(fontName)[`${fontStyle[1]}-${fontWeight[1]}`] = true;
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
                const shared = Object.keys(styleKey);
                if (shared.length > 0) {
                    style[tag][shared.join(';')] = styleKey[shared[0]];
                }
                for (const attribute in layoutKey) {
                    layout[tag][attribute] = layoutKey[attribute];
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
    const resource = new Map();
    for (const name in style) {
        const tag = style[name];
        const tagData: any = [];
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
        resource.set(name, tagData);
    }
    const inherit = new Set();
    for (const node of cache.visible) {
        if (resource.has(node.tagName)) {
            const styles: string[] = [];
            for (const item of resource.get(node.tagName)) {
                if (item.ids.includes(node.id)) {
                    styles.push(item.name);
                }
            }
            if (styles.length > 0) {
                inherit.add(styles.join('.'));
                node.attr(`style="@style/${styles.pop()}"`);
            }
        }
        const tag: {} = layout[node.tagName];
        if (tag != null) {
            for (const attr in tag) {
                if (tag[attr].includes(node.id)) {
                    node.attr((SETTINGS.useUnitDP ? replaceDP(attr, SETTINGS.density, true) : attr));
                }
            }
        }
    }
    inherit.forEach(styles => {
        let parent: string = null;
        styles.split('.').forEach((value: string) => {
            const match = value.match(/^(\w+)_([0-9]+)$/);
            if (match != null) {
                const item = resource.get(match[1].toUpperCase())[parseInt(match[2]) - 1];
                RESOURCE.STYLE.set(value, { parent, attributes: item.attributes });
                parent = value;
            }
        });
    });
}

export function getResource(module: string) {
    return RESOURCE[module];
}

export function insertResourceAsset(resource: Map<string, any>, name: string, value: any) {
    let resourceName = '';
    if (isNumber(name)) {
        name = `__${name}`;
    }
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
        while (resource.has(resourceName) && resource.get(resourceName) !== value);
    }
    return resourceName;
}

export function addResourceString(node: Widget, value: string) {
    const element = node && node.element;
    let name = value;
    if (value == null) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            name = element.value;
            value = name;
        }
        else if (element.nodeName === '#text') {
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
            if (node.is(WIDGET_ANDROID.TEXT)) {
                const match = node.style.textDecoration && node.style.textDecoration.match(/(underline|line-through)/);
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
        const num = isNumber(value);
        if (SETTINGS.numberResourceValue || !num) {
            value = value.replace(/\s*style=".*?">/g, '>');
            for (const [resourceName, resourceValue] of RESOURCE.STRING.entries()) {
                if (resourceValue === value) {
                    return { text: resourceName };
                }
            }
            name = name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').split('_').slice(0, 5).join('_').replace(/_+$/g, '');
            if (num || /^[0-9]/.test(value)) {
                name = `__${name}`;
            }
            else if (!/\w+/.test(name) && node != null) {
                name = node.androidId;
            }
            name = insertResourceAsset(RESOURCE.STRING, name, value);
        }
        if (element && element.nodeName === '#text') {
            const prevSibling = element.previousSibling;
            if (prevSibling != null) {
                const prevNode = prevSibling.__node;
                switch (prevNode.nodeName) {
                    case WIDGET_ANDROID.CHECKBOX:
                    case WIDGET_ANDROID.RADIO:
                        prevNode.android('text', (!SETTINGS.numberResourceValue && num ? name : `@string/${name}`));
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

export function addResourceImage(value: string) {
    const image = value.substring(value.lastIndexOf('/') + 1);
    const format = image.substring(image.lastIndexOf('.') + 1).toLowerCase();
    let src = image.replace(/.\w+$/, '');
    switch (format) {
        case 'bmp':
        case 'gif':
        case 'jpg':
        case 'png':
        case 'webp':
            src = insertResourceAsset(RESOURCE.IMAGE, src, value);
            break;
        default:
            src = null;
    }
    return src;
}

export function addResourceStringArray(node: Widget) {
    const element = node.element;
    const stringArray = new Map();
    let numberArray = new Map();
    for (let i = 0; i < element.children.length; i++) {
        const item = element.children[i];
        const value = item.text.trim() || item.value.trim();
        if (value !== '') {
            if (numberArray && !stringArray.size && isNumber(value)) {
                numberArray.set(value, false);
            }
            else {
                if (numberArray && numberArray.size > 0) {
                    i = -1;
                    numberArray = null;
                    continue;
                }
                stringArray.set(addResourceString(null, value).text, true);
            }
        }
    }
    if (stringArray.size > 0 || numberArray.size > 0) {
        const name = insertResourceAsset(RESOURCE.ARRAY, `${node.androidId}_array`, (stringArray.size ? stringArray : numberArray));
        return { entries: name };
    }
    return null;
}

export function addResourceColor(value: string) {
    value = value.toUpperCase().trim();
    if (value !== '') {
        let colorName = '';
        if (!RESOURCE.COLOR.has(value)) {
            const color = findNearestColor(value);
            if (color != null) {
                color.name = cameltoLowerCase(color.name);
                if (value.toUpperCase().trim() === color.hex) {
                    colorName = color.name;
                }
                else {
                    colorName = generateId('color', `${color.name}_1`);
                }
            }
            if (colorName !== '') {
                RESOURCE.COLOR.set(value, colorName);
            }
        }
        else {
            colorName = RESOURCE.COLOR.get(value);
        }
        if (colorName !== '') {
            return `@color/${colorName}`;
        }
    }
    return value;
}

export function setComputedStyle(node: Widget) {
    return getStyle(node.element);
}

export function setBoxSpacing(node: Widget) {
    const result = getBoxSpacing(node.element);
    for (const i in result) {
        result[i] += 'px';
    }
    return result;
}

export function setBackgroundStyle(node: Widget) {
    const element = node.element;
    const attributes: any = {
        border: parseBorderStyle,
        borderTop: parseBorderStyle,
        borderRight: parseBorderStyle,
        borderBottom: parseBorderStyle,
        borderLeft: parseBorderStyle,
        borderRadius: parseBoxDimensions,
        backgroundColor: parseRGBA,
        backgroundImage: parseImageURL,
        backgroundSize: parseBoxDimensions
    };
    let backgroundParent: string[] = [];
    if (element.parentNode != null) {
        backgroundParent = parseRGBA(getStyle(element.parentNode).backgroundColor);
    }
    const style = getStyle(element);
    for (const i in attributes) {
        attributes[i] = attributes[i](style[i]);
    }
    attributes.border[2] = addResourceColor(attributes.border[2]);
    if (backgroundParent[0] === attributes.backgroundColor[0] || attributes.backgroundColor[4] === 0 || (SETTINGS.excludeBackgroundColor && SETTINGS.excludeBackgroundColor.includes(convertRGBtoHex(attributes.backgroundColor[0])))) {
        attributes.backgroundColor = null;
    }
    else {
        attributes.backgroundColor = (!SETTINGS.excludeBackgroundColor.includes(attributes.backgroundColor[1]) ? addResourceColor(attributes.backgroundColor[1]) : null);
    }
    const borderStyle: any = {
        black: 'android:color="@android:color/black"',
        solid: `android:color="${attributes.border[2]}"`
    };
    borderStyle.dotted = `${borderStyle.solid} android:dashWidth="3px" android:dashGap="1px"`;
    borderStyle.dashed = `${borderStyle.solid} android:dashWidth="1px" android:dashGap="1px"`;
    borderStyle.default = borderStyle[attributes.border[0]] || borderStyle.black;
    if (attributes.border[0] !== 'none') {
        let template: {} = null;
        let data: {} = null;
        let resourceName = '';
        if (attributes.backgroundColor == null && attributes.backgroundImage == null && attributes.borderRadius.length === 0) {
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
                    '1': [{
                        '2': [{ width: attributes.border[1], borderStyle: borderStyle.default }],
                        '3': (attributes.backgroundColor != null ? [{ color: attributes.backgroundColor }] : false),
                        '4': (attributes.borderRadius.length === 1 ? [{ radius: attributes.borderRadius[0] }] : false),
                        '5': (attributes.borderRadius.length > 1 ? [{ topLeftRadius: '' }] : false)
                    }],
                    '6': (attributes.backgroundImage != null ? [{ image: attributes.backgroundImage, width: attributes.backgroundSize[0], height: attributes.backgroundSize[1] }] : false)
                }]
            };
            const rootItem = getDataLevel(data, '0');
            [attributes.borderTopWidth, attributes.borderRightWidth, attributes.borderBottomWidth, attributes.borderLeftWidth].forEach((item, index) => {
                rootItem[['top', 'right', 'bottom', 'left'][index]] = item && item[2];
            });
            if (attributes.borderRadius.length > 1) {
                if (attributes.borderRadius.length === 2) {
                    attributes.borderRadius.push(...attributes.borderRadius.slice());
                }
                const borderRadiusItem = getDataLevel(data, '0', '1', '5');
                attributes.borderRadius.forEach((value: string, index: number) => borderRadiusItem[`${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius`] = value);
            }
        }
        const xml = parseTemplateData(template, data);
        for (const [name, value] of RESOURCE.DRAWABLE.entries()) {
            if (value === xml) {
                resourceName = name;
                break;
            }
        }
        if (resourceName === '') {
            resourceName = `${node.tagName.toLowerCase()}_${node.androidId}`;
            RESOURCE.DRAWABLE.set(resourceName, xml);
        }
        return { background: resourceName };
    }
    else if (attributes.backgroundColor != null) {
        return { backgroundColor: attributes.backgroundColor };
    }
    return null;
}

export function getViewAttributes(node: Widget) {
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
        output = (node.renderDepth === 0 ? '{@0}' : '') + attributes.map((value: string) => `\n${indent + value}`).join('');
    }
    return output;
}

export function writeResourceStringXml() {
    RESOURCE.STRING = new Map([...RESOURCE.STRING.entries()].sort());
    let xml = '';
    if (RESOURCE.STRING.size > 0) {
        const template = parseTemplateMatch(STRING_TMPL);
        const data: {} = {
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

export function writeResourceArrayXml() {
    RESOURCE.ARRAY = new Map([...RESOURCE.ARRAY.entries()].sort());
    let xml = '';
    if (RESOURCE.ARRAY.size > 0) {
        const template = parseTemplateMatch(STRINGARRAY_TMPL);
        const data: {} = {
            '0': [{
                '1': []
            }]
        };
        const rootItem = getDataLevel(data, '0');
        for (const [name, values] of RESOURCE.ARRAY.entries()) {
            const arrayItem: {} = {
                name,
                '2': []
            };
            const item = arrayItem['2'];
            for (const [text, value] of values.entries()) {
                item.push({ value: (value ? `@string/` : '') + text });
            }
            rootItem['1'].push(arrayItem);
        }
        xml = parseTemplateData(template, data);
    }
    return xml;
}

export function writeResourceStyleXml() {
    let xml = '';
    if (RESOURCE.STYLE.size > 0) {
        const template = parseTemplateMatch(STYLE_TMPL);
        const data: {} = {
            '0': [{
                '1': []
            }]
        };
        const rootItem = getDataLevel(data, '0');
        for (const [name1, style] of RESOURCE.STYLE.entries()) {
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
    RESOURCE.FONT = new Map([...RESOURCE.FONT.entries()].sort());
    let xml = '';
    if (RESOURCE.FONT.size > 0) {
        const template = parseTemplateMatch(FONT_TMPL);
        for (const [name, font] of RESOURCE.FONT.entries()) {
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
    if (RESOURCE.COLOR.size > 0) {
        RESOURCE.COLOR = new Map([...RESOURCE.COLOR.entries()].sort());
        const template = parseTemplateMatch(COLOR_TMPL);
        const data: {} = {
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

export function writeResourceDrawableXml() {
    let xml = '';
    if (RESOURCE.DRAWABLE.size > 0 || RESOURCE.IMAGE.size > 0) {
        const template = parseTemplateMatch(DRAWABLE_TMPL);
        const data: {} = {
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
            xml = replaceDP(xml, SETTINGS.density);
        }
    }
    return xml;
}