import { WIDGET_ANDROID } from './lib/constants';
import { generateId, cameltoLowerCase, convertPX, insetDP, isNumber, padLeft, hasValue } from './lib/util';
import { parseRGBA, findNearestColor } from './lib/color';
import { getStyle, getBoxSpacing } from './lib/element';
import { getDataLevel, parseTemplateMatch, parseTemplateData } from './lib/xml';
import SETTINGS from './settings';

import STRING_TMPL from './tmpl/resources/string';
import STRINGARRAY_TMPL from './tmpl/resources/string-array';
import STYLE_TMPL from './tmpl/resources/style';
import COLOR_TMPL from './tmpl/resources/color';
import DRAWABLE_TMPL from './tmpl/resources/drawable';
import SHAPERECTANGLE_TMPL from './tmpl/resources/shape-rectangle';
import LAYERLIST_TMPL from './tmpl/resources/layer-list';

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

export const RESOURCE = {
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

export function setResourceStyle(NODE_CACHE) {
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
                                        const compare = sorted[j][attr];
                                        for (let k = 0; k < ids.length; k++) {
                                            if (compare.includes(ids[k])) {
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

export function getResource(name) {
    return RESOURCE[name];
}

export function insertResourceAsset(resource, name, value) {
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

export function addResourceString(node, value) {
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

export function addResourceStringArray(node) {
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

export function addResourceColor(value) {
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

export function setComputedStyle(node) {
    return getStyle(node.element);
}

export function setBoxSpacing(node) {
    const result = getBoxSpacing(node.element, SETTINGS.supportRTL);
    for (const i in result) {
        result[i] += 'px';
    }
    return result;
}

export function getViewAttributes(node) {
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

export function parseStyleAttribute(value) {
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

export function setBackgroundStyle(node) {
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

export function writeResourceStringXml() {
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

export function writeResourceArrayXml() {
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

export function writeResourceStyleXml() {
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

export function writeResourceColorXml() {
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

export function writeResourceDrawableXml() {
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