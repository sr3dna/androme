import { WIDGET_ANDROID, XMLNS_ANDROID } from './lib/constants';
import { generateId, cameltoLowerCase, convertPX, insetDP, isNumber, padLeft, hasValue } from './lib/util';
import { parseRGBA, findNearestColor } from './lib/color';
import { getStyle, getBoxSpacing } from './lib/element';
import { parseTemplateMatch, parseTemplateData } from './lib/xml';
import SETTINGS from './settings';

import STRING_TEMPLATE from './template/resources/string';
import STRINGARRAY_TEMPLATE from './template/resources/string-array';
import STYLE_TEMPLATE from './template/resources/style';
import COLOR_TEMPLATE from './template/resources/color';
import DRAWABLE_TEMPLATE from './template/resources/drawable';

export const RESOURCE = {
    string: new Map(),
    array: new Map(),
    color: new Map(),
    image: new Map(),
    drawable: new Map(),
    style: new Map()
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
    const match = value.match(/^([0-9]+(?:px|pt|em)) ([0-9]+(?:px|pt|em)) ([0-9]+(?:px|pt|em)) ([0-9]+(?:px|pt|em))$/);
    if (match != null && match.length == 5) {
        if (match[1] == match[2] && match[2] == match[3] && match[3] == match[4]) {
            return [convertPX(match[1])];
        }
        else if (match[1] == match[3] && match[2] == match[4]) {
            return [convertPX(match[1]), convertPX(match[2])];
        }
        else {
            return [convertPX(match[1]), convertPX(match[2]), convertPX(match[3]), convertPX(match[4])];
        }
    }
    return null;
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
            else if (!/\w+/.test(name) && node != null) {
                name = node.androidId;
            }
            name = insertResourceAsset(RESOURCE['string'], name, value);
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
        const name = insertResourceAsset(RESOURCE['array'], `${element.androidNode.androidId}_array`, (stringArray.size ? stringArray : numberArray));
        return { entries: name };
    }
    return null;
}

export function addResourceColor(value) {
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

export function setComputedStyle(node) {
    return getStyle(node.element);
}

export function setBoxSpacing(node) {
    const result = getBoxSpacing(node.element, SETTINGS.useRTL);
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

export function writeResourceStringXml() {
    const resource = new Map([...RESOURCE['string'].entries()].sort());
    if (resource.size > 0) {
        const template = parseTemplateMatch(STRING_TEMPLATE);
        const data = {
            '0': [{ '1': [] }]
        };
        for (const [name, value] of resource.entries()) {
            data['0'][0]['1'].push({ name, value });
        }
        return parseTemplateData(template, data);
    }
    return '';
}

export function writeResourceArrayXml() {
    const resource = new Map([...RESOURCE['array'].entries()].sort());
    if (resource.size > 0) {
        const template = parseTemplateMatch(STRINGARRAY_TEMPLATE);
        const data = {
            '0': [{ '1': [] }]
        };
        for (const [name, values] of resource.entries()) {
            const stringArrayItem = {
                name,
                '2': []
            };
            const item = stringArrayItem['2'];
            for (const [name, value] of values.entries()) {
                item.push({ value: (value ? `@string/` : '') + name });
            }
            data['0'][0]['1'].push(stringArrayItem);
        }
        return parseTemplateData(template, data);
    }
    return '';
}

export function writeResourceStyleXml() {
    if (RESOURCE['style'].size > 0) {
        const template = parseTemplateMatch(STYLE_TEMPLATE);
        const data = {
            '0': [{ '1': [] }]
        };
        for (const [name, style] of RESOURCE['style'].entries()) {
            const styleItem = {
                name,
                parent: style.parent || '',
                '2': []
            };
            const item = styleItem['2'];
            style.attributes.split(';').sort().forEach(attr => {
                const [name, value] = attr.split('=');
                item.push({ name, value: value.replace(/"/g, '') });
            });
            data['0'][0]['1'].push(styleItem);
        }
        return parseTemplateData(template, data);
    }
    return '';
}

export function writeResourceColorXml() {
    if (RESOURCE['color'].size > 0) {
        const resource = new Map([...RESOURCE['color'].entries()].sort());
        const template = parseTemplateMatch(COLOR_TEMPLATE);
        const data = {
            '0': [{ '1': [] }]
        };
        for (const [name, value] of resource.entries()) {
            data['0'][0]['1'].push({ name, value });
        }
        return parseTemplateData(template, data);
    }
    return '';
}

export function writeResourceDrawableXml() {
    if (RESOURCE['drawable'].size > 0 || RESOURCE['image'].size > 0) {
        const template = parseTemplateMatch(DRAWABLE_TEMPLATE);
        const data = {
            '0': []
        };
        for (const [name, value] of RESOURCE['drawable'].entries()) {
            data['0'].push({ name: `res/drawable/${name}.xml`, value});
        }
        for (const [name, value] of RESOURCE['image'].entries()) {
            data['0'].push({ name: `res/drawable/${name + value.substring(value.lastIndexOf('.'))}`, value: `<!-- image: ${value} -->` });
        }
        let xml = parseTemplateData(template, data);
        if (SETTINGS.useUnitDP) {
            xml = insetDP(xml, SETTINGS.density);
        }
        return xml;
    }
    return '';
}