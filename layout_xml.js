var LAYOUT_ANDROID = {
    TEXT: 'TextView',
    EDIT: 'EditText',
    LINEAR: 'LinearLayout',
    CONSTRAINT: 'ConstraintLayout',
    RELATIVE: 'RelativeLayout',
    GRID: 'GridLayout',
    SCROLL_VERTICAL: 'ScrollView',
    SCROLL_HORIZONTAL: 'HorizontalScrollView',
    SCROLL_NESTED: 'NestedScrollView',
    RADIO: 'RadioButton',
    RADIO_GROUP: 'RadioGroup'
};

var MAPPING_ANDROID = {
    'SPAN': 'TextView',
    'LABEL': 'TextView',
    'A': 'TextView',
    'B': 'TextView',
    'I': 'TextView',
    'PRE': 'TextView',
    'HR': 'View',
    'SELECT': 'Spinner',
    'INPUT' : {
        'text': 'EditText',
        'password': 'EditText',
        'checkbox': 'CheckBox',
        'radio': 'RadioButton',
        'button': 'Button',
        'submit': 'Button'
    },
    'BUTTON': 'Button',
    'TEXTAREA': 'EditText',
    'IMG': 'ImageView'
};

var PROPERTY_ANDROID = {
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
        'marginBottom': 'android:layout_marginBottom="{0}"',
        'marginLeft': 'android:layout_marginLeft="{0}"',
        'marginHorizontal': 'android:layout_marginHorizontal="{0}"',
        'marginVertical': 'android:layout_marginVertical="{0}"',
        'padding': 'android:padding="{0}"',
        'paddingTop': 'android:paddingTop="{0}"',
        'paddingRight': 'android:paddingRight="{0}"',
        'paddingBottom': 'android:paddingBottom="{0}"',
        'paddingLeft': 'android:paddingLeft="{0}"',
        'paddingHorizontal': 'android:paddingHorizontal="{0}"',
        'paddingVertical': 'android:paddingVertical="{0}"'
    },
    'resourceString': {
        'text': 'android:text="@string/{0}"'
    },
    'resourceStringArray': {
        'entries': 'android:entries="@array/{0}"'
    }
};

var WIDGET_ANDROID = {
    'ConstraintLayout': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'LinearLayout': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'GridLayout': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'ScrollView': {
        'androidId': 'android:id="@+id/{0}"'
    },
    'HorizonatalView': {
        'androidId': 'android:id="@+id/{0}"'
    },
    'NestedScrollView': {
        'androidId': 'android:id="@+id/{0}"'
    },
    'RadioGroup': {
        'androidId': 'android:id="@+id/{0}"',
        'androidCheckedButton': 'android:checkedButton="@id+/{0}"'
    },
    'RadioButton': {
        'androidId': 'android:id="@+id/{0}"',
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'CheckBox': {
        'androidId': 'android:id="@+id/{0}"',
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'Spinner': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceStringArray': PROPERTY_ANDROID['resourceStringArray']
    },
    'TextView': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceString': PROPERTY_ANDROID['resourceString']
    },
    'EditText': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceString': PROPERTY_ANDROID['resourceString']
    },
    'View': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'Button': {
        'androidId': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceString': PROPERTY_ANDROID['resourceString']
    },
    'ImageView': {
        'androidId': 'android:id="@+id/{0}"',
        'androidSrc': 'android:src="@drawable/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    }
};

var STRING_ANDROID = {
    XMLNS: 'xmlns:android="http://schemas.android.com/apk/res/android"'
};

var DENSITY_ANDROID = {
    LDPI: 120,
    MDPI: 160,
    HDPI: 240,
    XHDPI: 320,
    XXHDPI: 480,
    XXXHDPI: 640
};

var SETTINGS = {
    density: DENSITY_ANDROID.MDPI,
    defaultLayout: LAYOUT_ANDROID.RELATIVE,
    showAttributes: true,
    showAndroidXMLNamespace: false,
    boundsOffset: 3,
    whitespaceOffset: 4
};

var NODE_CACHE = [];
var RENDER_AFTER = {};
var GENERATE_ID = { '__current': [] };

var RESOURCE_STRING = new Map();
var RESOURCE_ARRAY = new Map();
var RESOURCE_STYLE = new Map();
var RESOURCE_COLOR = new Map();
var RESOURCE_IMAGE = new Map();

function writeResourceStringXML() {
    var resource = new Map([...RESOURCE_STRING.entries()].sort());
    var xml = ['<?xml version="1.0" encoding="utf-8"?>',
               '<resources>'];
    for (var [i, j] of resource.entries()) {
        xml.push(`\t<string name="${i}">${j}</string>`);
    }
    xml.push('</resources>',
             '<!-- filename: res/values/string.xml -->\n');
    return xml.join('\n');
}

function writeResourceArrayXML() {
    var resource = new Map([...RESOURCE_ARRAY.entries()].sort());
    var xml = ['<?xml version="1.0" encoding="utf-8"?>',
               '<resources>'];
    for (var [i, j] of resource.entries()) {
        xml.push(`\t<array name="${i}">`);
        for (var [k, l] of j.entries()) {
            xml.push(`\t\t<item${(l != '' ? ` name="${k}"` : '')}>${(l != '' ? `@string/${l}` : `${k}`)}</item>`);
        }
        xml.push('\t</array>');
    }
    xml.push('</resources>',
             '<!-- filename: res/values/string_array.xml -->\n');
    return xml.join('\n');
}

function writeResourceStyleXML() {
    var xml = ['<?xml version="1.0" encoding="utf-8"?>',
               '<resources>'];
    for (var i in RESOURCE_STYLE) {
        for (var j of RESOURCE_STYLE[i]) {
            xml.push(`\t<style name="${j.name}">`);
            j.attributes.split(';').forEach(value => {
                var [name, setting] = value.split('=');
                xml.push(`\t\t<item name="${name}">${setting.replace(/"/g, '')}</item>`);
            });
            xml.push('\t<style>');
        }
    }
    xml.push('</resources>',
             '<!-- filename: res/values/styles.xml -->\n');
    return xml.join('\n');
}

function writeResourceColorXML() {
    var resource = new Map([...RESOURCE_COLOR.entries()].sort());
    var xml = ['<?xml version="1.0" encoding="utf-8"?>',
               '<resources>'];
    for (var [i, j] of resource.entries()) {
        xml.push(`\t<color name="${i}">${j}</color>`);
    }
    xml.push('</resources>',
             '<!-- filename: res/values/colors.xml -->\n');
    return xml.join('\n');
}

function writeResourceDrawableXML() {
    var xml = [];
    for (var item of NODE_CACHE) {
        if (item.drawable) {
            xml.push(`${item.drawable}`,
                     `<!-- filename: res/drawable/${item.tagName.toLowerCase()}_${item.androidId}.xml -->\n`);
        }
    }
    if (RESOURCE_IMAGE.size) {
        for (var [i, j] of RESOURCE_IMAGE.entries()) {
            xml.push(`<!-- image: ${j} -->`,
                     `<!-- filename: res/drawable/${i + j.substring(j.lastIndexOf('.'))} -->\n`);
        }
    }
    return xml.join('\n');
}

function addResourceString(element, value) {
    var name = value;
    if (value == null) {
        if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA') {
            name = element.value;
            value = element.value;
        }
        else {
            name = element.innerText;
            value = element.innerHTML;
        }
    }
    if (value != '') {
        if (element != null) {
            var item = element.cacheData;
            if (isView(item, LAYOUT_ANDROID.TEXT)) {
                var match = item.style.textDecoration.match(/(underline|line-through)/);
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
        for (var [i, j] in RESOURCE_STRING.entries()) {
            if (j == value) {
                return { text: i };
            }
        }
        name = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').split('_').slice(0, 5).join('_').replace(/_+$/g, '');
        var resourceName = insertResourceAsset(RESOURCE_STRING, name, value);
        return { text: resourceName };
    }
    return null;
}

function addResourceStringArray(element) {
    var stringArray = new Map();
    var integerArray = new Map();
    for (var i = 0; i < element.children.length; i++) {
        var item = element.children[i];
        var value = item.value.trim();
        var text = item.text.trim();
        if (text != '') {
            if (integerArray != null && !stringArray.size && /^\d+$/.test(text) && !/^(^0+)\d+$/.test(text)) {
                integerArray.set(value, '');
            }
            else {
                if (integerArray != null && integerArray.size) {
                    i = -1;
                    stringArray = new Map();
                    integerArray = null;
                    continue;
                }
                stringArray.set(value, addResourceString(null, text).text);
            }
        }
    }
    if (stringArray.size || integerArray.size) {
        var resourceName = insertResourceAsset(RESOURCE_ARRAY, `${element.cacheData.androidId}_array`, (stringArray.size ? stringArray : integerArray));
        return { entries: resourceName };
    }
    return null;
}

function addResourceColor(value) {
    value = value.toUpperCase().trim();
    if (value != '') {
        var colorName = '';
        if (!RESOURCE_COLOR.has(value)) {
            var color = findNearestColor(value);
            if (color != null) {
                color.name = cameltoLowerCase(color.name);
                if (value.toUpperCase().trim() == color.hex) {
                    colorName = color.name;
                }
                else {
                    var className = `__color${color.name}`;
                    if (GENERATE_ID[className] == null) {
                        GENERATE_ID[className] = 1;
                    }
                    colorName = color.name + GENERATE_ID[className]++;
                }
            }
            if (colorName != '') {
                RESOURCE_COLOR.set(value, colorName);
            }
        }
        else {
            colorName = RESOURCE_COLOR.get(value);
        }
        if (colorName != '') {
            return `@color/${colorName}`;
        }
    }
    return value;
}

function setBackgroundStyle(element) {
    var properties = {
        border: parseBorderStyle,
        borderTop: parseBorderStyle,
        borderRight: parseBorderStyle,
        borderBottom: parseBorderStyle,
        borderLeft: parseBorderStyle,
        borderRadius: parseBoxDimensions,
        backgroundColor: parseRGBA
    };
    var backgroundParent = [];
    if (element.parentNode != null) {
        backgroundParent = parseRGBA(getElementStyle(element.parentNode).backgroundColor);
    }
    var style = getElementStyle(element);
    for (var i in properties) {
        properties[i] = properties[i](style[i]);
    }
    if (properties.border[0] != 'none' || properties.borderRadius != null) {
        properties.border[2] = addResourceColor(properties.border[2]);
        if (backgroundParent[0] == properties.backgroundColor[0] || properties.backgroundColor[4] == 0) {
            properties.backgroundColor = null;
        }
        else {
            properties.backgroundColor[1] = addResourceColor(properties.backgroundColor[1]);
        }
        var borderStyle = {
            default: 'android:color="@android:color/black"',
            solid: `android:color="${properties.border[2]}"`,
            dotted: `android:color="${properties.border[2]}" android:dashWidth="3dp" android:dashGap="1dp"`,
            dashed: `android:color="${properties.border[2]}" android:dashWidth="1dp" android:dashGap="1dp"`
        };
        var xml = '<?xml version="1.0" encoding="utf-8"?>\n';
        if (properties.borderRadius != null) {
            xml += `<shape${getXMLNS()} android:shape="rectangle">\n` +
                   `\t<stroke android:width="${properties.border[1] || '1dp'}" ${borderStyle[properties.border[1] || 'default']} />\n` +
                   (properties.backgroundColor ? `\t<solid android:color="${properties.backgroundColor[1]}" />\n` : '');
            if (properties.borderRadius.length == 1) {
                xml += `\t<corners android:radius="${properties.borderRadius[0]}" />\n`;
            }
            else {
                if (properties.borderRadius.length == 2) {
                    properties.borderRadius.push(...properties.borderRadius.slice());
                }
                xml += '\t<corners';
                properties.borderRadius.forEach((value, index) => xml += ` android:${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius="${value}"`);
            }
            xml += ' />\n' +
                   '</shape>';
        }
        else if (properties.border[0] != 'none' && properties.backgroundColor == null) {
            xml += `<shape${getXMLNS()} android:shape="rectangle">\n` +
                   `\t<stroke android:width="${properties.border[1]}" ${borderStyle[properties.border[0]]} />\n` +
                   '</shape>';
        }
        else {
            xml += `<layer-list${getXMLNS()}>\n`;
            if (properties.backgroundColor != null) {
                xml += '\t<item>\n' +
                       '\t\t<shape android:shape="rectangle">\n' +
                       `\t\t\t<solid android:color="${properties.backgroundColor[1]}" />\n` +
                       '\t\t</shape>\n' +
                       '\t</item>\n';
            }
            if (properties.border[0] != 'none') {
                xml += '\t<item>\n' +
                       '\t\t<shape android:shape="rectangle">\n' +
                       `\t\t\t<stroke android:width="${properties.border[1]}" ${borderStyle[properties.border[0]]} />\n` +
                       '\t\t</shape>\n' +
                       '\t</item>\n';
            }
            else {
                [properties.borderTopWidth, properties.borderRightWidth, properties.borderBottomWidth, properties.borderLeftWidth].forEach((item, index) => {
                    xml += `\t<item android:${['top', 'right', 'bottom', 'left'][index]}="${item[2]}">\n` +
                           '\t\t<shape android:shape="rectangle">\n' +
                           `\t\t\t<stroke android:width="${item[1]}" ${borderStyle[item[0]]} />\n` +
                           '\t\t</shape>\n' +
                           '\t</item>\n';
                });
            }
            xml += '</layer-list>';
        }
        var item = element.cacheData;
        item.drawable = xml;
        GENERATE_ID['__current'].push(`${item.tagName.toLowerCase()}_${item.androidId}`);
        return { backgroundColor: `${element.tagName.toLowerCase()}_{id}` };
    }
    return null;
}

function setBoxSpacing(element) {
    var result = getBoxSpacing(element);
    if (result.paddingTop != null && result.paddingTop == result.paddingBottom) {
        result.paddingVertical = result.paddingTop;
        delete result.paddingTop;
        delete result.paddingBottom;
    }
    if (result.paddingLeft != null && result.paddingLeft == result.paddingRight) {
        result.paddingHorizontal = result.paddingLeft;
        delete result.paddingLeft;
        delete result.paddingRight;
    }
    if (result.marginTop != null && result.marginTop == result.marginBottom) {
        result.marginVertical = result.marginTop;
        delete result.marginTop;
        delete result.marginBottom;
    }
    if (result.marginLeft != null && result.marginLeft == result.marginRight) {
        result.marginHorizontal = result.marginLeft;
        delete result.marginLeft;
        delete result.marginRight;
    }
    return result;
}

function getBoxSpacing(element, complete) {
    var result = {};
    ['padding', 'margin'].forEach(border => {
        ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
            var prop = `${border + side}`;
            var dimension = getElementStyle(element)[prop];
            dimension = (complete ? parseInt(dimension) : convertToDP(dimension));
            if (complete || (dimension != 0 && dimension != '0dp')) {
                result[prop] = dimension;
            }
        });
    });
    return result;
}

function parseBoxDimensions(value) {
    var match = value.match(/^([0-9]+(?:px|pt)) ([0-9]+(?:px|pt)) ([0-9]+(?:px|pt)) ([0-9]+(?:px|pt))$/);
    if (match != null && match.length == 5) {
        if (match[1] == match[2] && match[2] == match[3] && match[3] == match[4]) {
            return [convertToDP(match[1])];
        }
        else if (match[1] == match[3] && match[2] == match[4]) {
            return [convertToDP(match[1]), convertToDP(match[2])];
        }
        else {
            return [convertToDP(match[1]), convertToDP(match[2]), convertToDP(match[3]), convertToDP(match[4])];
        }
    }
    return null;
}

function parseBorderStyle(value) {
    var stroke = value.match(/(none|dotted|dashed|solid)/);
    var width = value.match(/([0-9]+(?:px|pt))/);
    var color = parseRGBA(value);
    if (stroke != null) {
        stroke = stroke[1];
    }
    if (width != null) {
        width = width[1];
    }
    if (color != null) {
        color = color[1];
    }
    return [stroke || 'solid', convertToDP(width || 1), color || '#000'];
}

function parseRGBA(value) {
    var match = value.match(/rgb(?:a)?\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})(?:, ([0-9]{1,3}))?\)/);
    if (match != null && match.length >= 4) {
        return [match[0], `#${convertRGBtoHex(match[1]) + convertRGBtoHex(match[2]) + convertRGBtoHex(match[3])}`, parseInt((match[4] != null ? match[4] : 1))];
    }
    return null;
}

function setXmlAttributes(item, tagName, depth, actions) {
    var widget = WIDGET_ANDROID[tagName];
    var element = item.element;
    var result = {};
    if (widget != null) {
        var j = 0;
        if (actions == null && item.actions != null) {
            actions = item.actions;
        }
        for (var i in widget) {
            if (result[i] != null || (actions != null && !actions.includes(j++))) {
                continue;
            }
            if (hasValue(item[i])) {
                result[i] = widget[i].replace('{0}', item[i]);
            }
            else if (i.indexOf('.') != -1) {
                var objectNames = i.split('.');
                var method = window;
                var methodName = '';
                for (var k of objectNames) {
                    if (k == 'window') {
                        continue;
                    }
                    else if (method[k] != null) {
                        method = method[k];
                        methodName = k;
                    }
                }
                if (typeof method == 'function') {
                    var data = method(element);
                    if (data != null) {
                        var output = [];
                        for (var k in widget[i]) {
                            if (result[k] != null) {
                                continue;
                            }
                            var value = data[k];
                            if (hasValue(value)) {
                                if (value.startsWith('rgb')) {
                                    var rgb = parseRGBA(value);
                                    if (k == 'backgroundColor') {
                                        var backgroundParent = [];
                                        if (element.parentNode != null) {
                                            backgroundParent = parseRGBA(getElementStyle(element.parentNode).backgroundColor);
                                        }
                                        if (backgroundParent[0] == rgb[0]) {
                                            continue;
                                        }
                                    }
                                    if (rgb != null) {
                                        value = addResourceColor(value.replace(rgb[0], rgb[1]));
                                    }
                                }
                                else if (/(px|pt)$/.test(value)) {
                                    value = (value.toLowerCase().indexOf('font') != -1 ? convertToSP(value) : convertToDP(value));
                                }
                                output.push(widget[i][k].replace('{0}', value));
                            }
                        }
                        if (output.length > 0) {
                            if (methodName == 'getComputedStyle') {
                                if (!RESOURCE_STYLE.has(item.tagName)) {
                                    RESOURCE_STYLE.set(item.tagName, []);
                                }
                                RESOURCE_STYLE.get(item.tagName).push({ id: item.id, attributes: output });
                            }
                            else {
                                result[i] = output;
                            }
                        }
                    }
                }
            }
        }
    }
    for (var i in item.android) {
        var value = item.android[i];
        if (hasValue(value)) {
            result[i] = `android:${i}="${value}"`;
        }
    }
    if (element.tagName == 'INPUT' && element.id != '') {
        var nextElement = element.nextElementSibling;
        if (nextElement && nextElement.htmlFor == element.id) {
            var itemNext = nextElement.cacheData;
            setXmlAttributes(itemNext, getTagName(itemNext), depth, [4]);
            if (isView(item, LAYOUT_ANDROID.RADIO)) {
                itemNext.depthIndent++;
            }
            var attributes = itemNext.attributes;
            for (var name in attributes) {
                var value = attributes[name];
                if (result[name] == null && hasValue(value)) {
                    result[name] = value;
                }
            }
            item.label = itemNext;
            itemNext.invisible = true;
            itemNext.renderParent = true;
        }
    }
    for (var i in result) {
        var value = result[i];
        if (hasValue(value)) {
            if (Array.isArray(value)) {
                item.attributes.push(...value);
            }
            else {
                item.attributes.push(value);
            }
        }
    }
    item.depthAttribute = depth;
}

function hasValue(value) {
    return (value != null && value != '');
}

function isView(item, viewName) {
    return (item.androidTagName == viewName);
}

function getXMLNS() {
    return (SETTINGS.showAndroidXMLNamespace ? ` ${STRING_ANDROID.XMLNS}` : '');
}

function setAndroidAttributes(item, tagName) {
    var element = item.element;
    if (!tagName) {
        tagName = getTagName(item);
    }
    if (GENERATE_ID[tagName] == null) {
        GENERATE_ID[tagName] = 1;
    }
    item.androidTagName = tagName;
    if (item.androidId == null) {
        do {
            item.androidId = (item.androidId != -1 ? element.id || element.name : (tagName.toLowerCase() + GENERATE_ID[tagName]++));
            if (GENERATE_ID['__current'].includes(item.androidId)) {
                item.androidId = -1;
            }
            else {
                GENERATE_ID['__current'].push(item.androidId);
            }
        }
        while (!item.androidId || item.androidId == -1)
    }
}

function writeAttributes(output) {
    for (var item of NODE_CACHE) {
        var attrs = item.attributes;
        if (attrs.length > 0) {
            attrs.sort((a, b) => {
                if (a.startsWith('android:id=')) {
                    return -1;
                }
                return (a > b);
            });
            if (SETTINGS.showAndroidXMLNamespace) {
                attrs.unshift(STRING_ANDROID.XMLNS);
            }
            var xml = attrs.map(value => `\n${setIndent(item.depthAttribute) + value}`).join('').replace('{id}', item.androidId);
            output = output.replace(`{@${item.id}}`, xml);
        }
    }
    return output;
}

function writeTemplate(item, depth, parent, tagName) {
    var indent = setIndent(depth);
    setAndroidAttributes(item, tagName);
    if (item.wrapper == null) {
        setAndroidDimensions(item);
    }
    item.renderParent = parent;
    var beforeXml = '';
    var afterXml = '';
    if (item.scroll.overflow) {
        item.depthIndent++;
        item.children.forEach(item => item.depthIndent++);
        item.scrollView = true;
        var node = insertNode(item, parent, [item]);
        var scrollView = (isHorizontalScroll(item) ? LAYOUT_ANDROID.SCROLL_HORIZONTAL : (item.scroll.nested ? LAYOUT_ANDROID.SCROLL_NESTED : LAYOUT_ANDROID.SCROLL_VERTICAL));
        setAndroidAttributes(node, scrollView);
        setAndroidDimensions({ element: item.element, styleMap: item.styleMap, android: node.android, scroll: {} });
        setXmlAttributes(node, scrollView, depth + 1);
        node.renderParent = parent;
        beforeXml = indent + `<${scrollView}{@${node.id}}{#${node.id}}>\n`;
        afterXml =  indent + `</${scrollView}>\n`;
        indent = setIndent(++depth);
    }
    setXmlAttributes(item, tagName, depth + 1);
    return setGridSpacing(item, depth) + beforeXml + getEnclosingTag(indent, tagName, item.id, `{${item.id}}`) + afterXml;
}

function writeDefaultTemplate() {
    switch (SETTINGS.defaultLayout) {
        case LAYOUT_ANDROID.CONSTRAINT:
            return writeConstraintTemplate.apply(null, arguments);
        case LAYOUT_ANDROID.RELATIVE:
            return writeRelativeTemplate.apply(null, arguments);
    }
}

function writeLinearTemplate(item, depth, parent, vertical) {
    item.android.orientation = (vertical ? 'vertical' : 'horizontal');
    return writeTemplate(item, depth, parent, LAYOUT_ANDROID.LINEAR);
}

function writeRelativeTemplate(item, depth, parent) {
    return writeTemplate(item, depth, parent, LAYOUT_ANDROID.RELATIVE);
}

function writeRelativeLayout(output) {
    var nodeIndex = {};
    function addNodeLayout(position, id, viewId = true) {
        if (nodeIndex[id][position] == null) {
            nodeIndex[id][position] = viewId;
        }
    }
    for (var item of NODE_CACHE) {
        if (isView(item, LAYOUT_ANDROID.RELATIVE)) {
            var children = NODE_CACHE.filter(node => (node.renderParent == item));
            for (var i of children) {
                nodeIndex[i.id] = {};
                var centerVertical = false;
                var centerHorizontal = false;
                if (i.linear.top == item.linear.top) {
                    addNodeLayout('layout_alignParentTop', i.id);
                }
                else if (i.linear.bottom == item.linear.bottom) {
                    addNodeLayout('layout_alignParentBottom', i.id);
                }
                else {
                    centerVertical = withinRange(item.linear.top - i.linear.top, item.linear.bottom - i.linear.bottom, SETTINGS.boundsOffset);
                }
                if (i.linear.left == item.linear.left) {
                    addNodeLayout('layout_alignParentStart', i.id);
                }
                else if (i.linear.right == item.linear.right) {
                    addNodeLayout('layout_alignParentEnd', i.id);
                }
                else {
                    centerHorizontal = withinRange(i.linear.left - item.linear.left, item.linear.right - i.linear.right, SETTINGS.boundsOffset);
                }
                if (centerVertical && centerHorizontal) {
                    addNodeLayout('layout_centerInParent', i.id);
                }
                else if (centerVertical) {
                    addNodeLayout('layout_centerVertical', i.id);
                }
                else if (centerHorizontal) {
                    addNodeLayout('layout_centerHorizontal', i.id);
                }
            }
            for (var i of children) {
                for (var j of children) {
                    if (i != j) {
                        if (i.linear.bottom == j.linear.top) {
                            addNodeLayout('layout_above', i.id, j.androidId);
                        }
                        else if (i.linear.top == j.linear.bottom) {
                            addNodeLayout('layout_below', i.id, j.androidId);
                        }
                        if (i.linear.top == j.linear.top) {
                            addNodeLayout('layout_alignTop', i.id, j.androidId);
                        }
                        else if (i.linear.bottom == j.linear.bottom) {
                            addNodeLayout('layout_alignBottom', i.id, j.androidId);
                        }
                        if (i.linear.left == j.linear.left) {
                            addNodeLayout('layout_alignStart', i.id, j.androidId);
                        }
                        else if (i.linear.right == j.linear.right) {
                            addNodeLayout('layout_alignEnd', i.id, j.androidId);
                        }
                        if (withinRange(i.linear.right, j.linear.left, SETTINGS.whitespaceOffset)) {
                            addNodeLayout('layout_toStartOf', i.id, j.androidId);
                            if (i.linear.right != j.linear.left) {
                                replaceAttribute(i, 'android:layout_marginRight', convertToDP(j.linear.left - i.linear.right), true);
                            }
                        }
                        else if (withinRange(i.linear.left, j.linear.right, SETTINGS.whitespaceOffset)) {
                            addNodeLayout('layout_toEndOf', i.id, j.androidId);
                        }
                    }
                }
            }
            var indent = setIndent(item.depthAttribute + 1);
            for (var i in nodeIndex) {
                var node = nodeIndex[i];
                var position = Object.keys(nodeIndex[i]).sort();
                var result = [];
                for (var j of position) {
                    if (node[j] == true) {
                        result.push(`android:${j}="true"`);
                    }
                    else {
                        result.push(`android:${j}="@+id/${node[j]}"`);
                    }
                }
                var xml = result.map(value => `\n${indent + value}`).join('');
                output = output.replace(`{#${i}}`, xml);
            }
        }
    }
    return output;
}

function replaceAttribute(item, name, value, merge = false) {
    var index = -1;
    for (var i = 0; i < item.attributes.length; i++) {
        var attr = item.attributes[i];
        if (attr.startsWith(name)) {
            if (merge && !isNaN(parseInt(value))) {
                var match = attr.match(/([0-9]+)([a-zA-Z]+)/);
                if (match != null) {
                    value = `${parseInt(match[1]) + parseInt(value)}${match[2]}`;
                }
            }
            index = i;
            break;
        }
    }
    var attribute = `${name}="${value}"`;
    if (index != -1) {
        item.attributes[i] = attribute;
    }
    else {
        item.attributes.push(attribute);
    }
}

function writeConstraintTemplate(item, depth, parent) {
    return writeTemplate(item, depth, parent, LAYOUT_ANDROID.CONSTRAINT);
}

function writeGridTemplate(item, depth, parent, columnCount = 2) {
    item.android.columnCount = columnCount;
    parent.gridLayout = item;
    return writeTemplate(item, depth, parent, LAYOUT_ANDROID.GRID);
}

function writeTagTemplate(item, depth, parent, tagName = '', recursive = false) {
    var element = item.element;
    var indent = setIndent(depth);
    setAndroidAttributes(item, tagName);
    setAndroidDimensions(item);
    if (!recursive) {
        switch (element.type) {
            case 'radio':
                var result = NODE_CACHE.filter(input => (input.element.tagName == 'INPUT' && input.element.type == 'radio' && input.element.name == element.name && !input.renderParent && ((item.previous.depth || item.depth) == (input.previous.depth || input.depth))));
                var xml = '';
                if (result.length > 1) {
                    var rowSpan = 1;
                    var columnSpan = 1;
                    var rowEndId = item.id;
                    var checked = '';
                    var node = insertNode(item, parent, result);
                    node.linearSkip = true;
                    setAndroidAttributes(node, LAYOUT_ANDROID.RADIO_GROUP);
                    item.radioGroupId = node.id;
                    item.radioGroup = [];
                    for (var input of result) {
                        rowSpan += (input.layout_rowSpan || 1) - 1;
                        columnSpan += (input.layout_columnSpan || 1) - 1;
                        if (input != item) {
                            input.previous.parent = input.parent;
                            input.previous.depth = input.depth;
                            input.parent = item.parent;
                            input.depth = item.depth;
                            item.radioGroup.push(input);
                        }
                        input.depthIndent++;
                        input.siblingWrap = true;
                        if (input.element.checked) {
                            checked = input.androidId;
                        }
                        xml += writeTagTemplate(input, depth + 1, parent, tagName, true);
                        if (input.gridRowEnd) {
                            rowEndId = input.id;
                        }
                    }
                    node.androidCheckedButton = checked;
                    if (rowSpan > 1) {
                        node.android.layout_rowSpan = rowSpan;
                    }
                    if (columnSpan > 1) {
                        node.android.layout_columnSpan = columnSpan;
                    }
                    setXmlAttributes(node, LAYOUT_ANDROID.RADIO_GROUP, depth + 1);
                    node.renderParent = parent;
                    return getEnclosingTag(indent, LAYOUT_ANDROID.RADIO_GROUP, node.id, xml);
                }
                break;
            case 'password':
                item.android.inputType = 'textPassword';
                break;
        }
        switch (element.tagName) {
            case 'IMG':
                var image = element.src.substring(element.src.lastIndexOf('/') + 1);
                var format = image.substring(image.lastIndexOf('.') + 1).toLowerCase();
                var src = image.replace(/.\w+$/, '');
                switch (format) {
                    case 'bmp':
                    case 'gif':
                    case 'jpg':
                    case 'png':
                    case 'webp':
                        src = insertResourceAsset(RESOURCE_IMAGE, src, element.src);
                        break;
                    default:
                        src = `(UNSUPPORTED: ${image})`;
                }
                item.androidSrc = src;
                break;
            case 'TEXTAREA':
                item.android.minLines = 2;
                if (element.rows > 2) {
                    item.android.maxLines = element.rows;
                }
                if (element.maxlength != null) {
                    item.android.maxLength = parseInt(element.maxlength);
                }
                item.android.hint = element.placeholder;
                item.android.scrollbars = 'vertical'
                item.android.inputType = 'textMultiLine';
                if (item.styleMap.overflowX == 'scroll') {
                    item.android.scrollHorizontally = 'true';
                }
                break;
        }
        switch (item.androidTagName) {
            case LAYOUT_ANDROID.TEXT:
                if (item.scroll.overflow) {
                    item.android.scrollbars = (isHorizontalScroll(item) ? 'horizontal' : 'vertical');
                }
            case LAYOUT_ANDROID.EDIT:
                var textAlign = item.styleMap.textAlign;
                var verticalAlign = item.styleMap.verticalAlign;
                if (isView(item, LAYOUT_ANDROID.GRID)) {
                    var container = item.previous.parent || item.parent;
                    if (textAlign == null) {
                        textAlign = container.styleMap.textAlign;
                    }
                    if (verticalAlign == null) {
                        verticalAlign = container.styleMap.verticalAlign;
                    }
                }
                if (textAlign || verticalAlign) {
                    var gravity = '';
                    switch (textAlign) {
                        case 'right':
                            gravity += 'end';
                            break;
                        case 'center':
                            gravity += 'center_horizontal';
                            break;
                        default:
                            gravity += 'start';
                    }
                    gravity += '|';
                    switch (verticalAlign) {
                        case 'middle':
                            gravity += 'center_vertical';
                            break;
                        case 'bottom':
                        case 'text-bottom':
                            gravity += 'bottom';
                            break;
                        default:
                            gravity += 'top';
                    }
                    item.android.gravity = gravity;
                }
                break;
        }
    }
    setXmlAttributes(item, item.androidTagName, depth + 1);
    item.renderParent = parent;
    return setGridSpacing(item, depth) + `${indent}<${item.androidTagName}{@${item.id}}{#${item.id}} />\n` +
                                         (!item.siblingWrap ? `{:${item.id}}` : '');
}

function getEnclosingTag(indent, tagName, id, content = '') {
    return indent + `<${tagName}{@${id}}{#${id}}>\n` +
                    content +
           indent + `</${tagName}>\n` +
                    `{:${id}}`;
}

function getElementStyle(element) {
    return (element.cacheData != null ? element.cacheData.style : getComputedStyle(element));
}

function setAndroidDimensions(item) {
    var element = item.element;
    if (element != null) {
        var style = getElementStyle(element);
        var width = element.offsetWidth + parseInt(style.marginLeft) + parseInt(style.marginLeft);
        var height = element.offsetHeight + parseInt(style.marginTop) + parseInt(style.marginBottom);
        var parent = element.parentNode;
        var parentStyle = getElementStyle(parent);
        var parentWidth = parent.offsetWidth - (parseInt(parentStyle.paddingLeft) + parseInt(parentStyle.paddingRight));
        var parentHeight = parent.offsetHeight - (parseInt(parentStyle.paddingTop) + parseInt(parentStyle.paddingBottom));
        var parentScrollable = (parent.cacheData && parent.cacheData.scroll.overflow != '');
        var parentGridLayout = (item.parent && isView(item.parent, LAYOUT_ANDROID.GRID));
        if (!isView(item, LAYOUT_ANDROID.TEXT) && item.scroll.overflow) {
            item.android.layout_width = 'match_parent';
        }
        else if (item.styleMap.width != null) {
            item.android.layout_width = convertToDP(item.styleMap.width);
        }
        else {
            switch (item.tagName) {
                case 'INPUT':
                case 'SELECT':
                case 'BUTTON':
                    item.android.layout_width = 'wrap_content';
                    break;
                default:
                    if (!parentScrollable && !parentGridLayout && withinRange(parentWidth, width, SETTINGS.boundsOffset)) {
                        item.android.layout_width = 'match_parent';
                    }
                    else {
                        item.android.layout_width = 'wrap_content';
                        if (MAPPING_ANDROID[element.tagName] != null && !parentGridLayout) {
                            switch (style.display) {
                                case 'line-item':
                                case 'block':
                                case 'inherit':
                                    item.android.layout_width = 'match_parent';
                                    break;
                            }
                        }
                    }
            }
        }
        if (!isView(item, LAYOUT_ANDROID.TEXT) && item.scroll.overflow) {
            item.android.layout_height = 'match_parent';
        }
        else if (item.styleMap.height != null) {
            item.android.layout_height = convertToDP(item.styleMap.height);
        }
        else {
            switch (item.tagName) {
                case 'INPUT':
                case 'SELECT':
                case 'BUTTON':
                    item.android.layout_height = 'wrap_content';
                    break;
                default:
                    if (!parentScrollable && !parentGridLayout && (withinRange(parentHeight, height, SETTINGS.boundsOffset) || height > parentHeight)) {
                        item.android.layout_height = 'match_parent';
                    }
                    else {
                        item.android.layout_height = 'wrap_content';
                    }
            }
        }
    }
}

function insertNode(item, parent, children, actions) {
    var data = {
        id: NODE_CACHE.length + 1,
        element: { id: '' },
        wrapper: item,
        children,
        bounds: item.bounds,
        depth: parent.depth,
        depthIndent: parent.depthIndent,
        parent: parent,
        renderParent: null,
        styleMap: item.styleMap,
        linear: item.linear,
        android: {},
        attributes: [],
        scroll: {},
        previous: {},
        actions
    };
    NODE_CACHE.push(data);
    return data;
}

function getTagName(item) {
    var tagName = MAPPING_ANDROID[item.tagName];
    if (typeof tagName == 'object') {
        tagName = tagName[item.element.type];
    }
    return tagName;
}

function isHorizontalScroll({ styleMap }) {
    return (styleMap.width && styleMap.overflowX == 'auto' || styleMap.overflowX == 'scroll');
}

function insertResourceAsset(resource, name, value = '') {
    var resourceName = null;
    var i = 0;
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
    return resourceName;
}

function setGridSpacing(item, depth = 0) {
    var indent = setIndent(depth);
    var xml = '';
    if (item.previous.parent != null && item.previous.parent.invisible) {
        var template = `${indent}<Space android:layout_width="match_parent" android:layout_height="{0}dp" android:layout_columnSpan="${item.renderParent.gridColumnCount}" />\n`;
        var dimensions = getBoxSpacing(item.previous.parent.element, true);
        item.grid = {};
        if (item.gridRowStart) {
            item.grid.paddingLeft = dimensions.marginLeft + dimensions.paddingLeft;
            item.grid.paddingRight = dimensions.marginRight + dimensions.paddingRight;
        }
        if (item.gridRowEnd) {
            var heightBottom =  dimensions.marginBottom + dimensions.paddingBottom + (!item.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
            if (heightBottom > 0) {
                if (RENDER_AFTER[item.id] == null) {
                    RENDER_AFTER[item.id] = [];
                }
                RENDER_AFTER[item.id].push(formatString(template, heightBottom));
            }
            item.grid.paddingTop = dimensions.marginTop + dimensions.paddingTop;
            item.grid.paddingBottom = dimensions.marginBottom + dimensions.paddingBottom;
        }
        if (item.gridFirst) {
            var heightTop = dimensions.paddingTop + dimensions.marginTop;
            if (heightTop > 0) {
                xml += formatString(template, heightTop);
            }
        }
    }
    return xml;
}

function isLinearXY(siblings) {
    var linearX = true;
    var linearY = true;
    if (siblings.length > 1) {
        var elements = siblings.slice();
        var minBottom = elements.reduce((a, b) => Math.min(a, b.linear.bottom), Number.MAX_VALUE);
        elements.some(item => {
            if (item.linear.top >= minBottom) {
                linearX = false;
                return true;
            }
        });
        var minRight = elements.reduce((a, b) => Math.min(a, b.linear.right), Number.MAX_VALUE);
        elements.some(item => {
            if (item.linear.left >= minRight) {
                linearY = false;
                return true;
            }
        });
    }
    return [linearX, linearY];
}

function formatString(value, ...params) {
    for (var i = 0; i < params.length; i++) {
        value = value.replace(`{${i}}`, params[i]);
    }
    return value;
}

function cameltoLowerCase(value) {
    value = value.charAt(0).toLowerCase() + value.substring(1);
    var result = value.match(/([a-z]{1}[A-Z]{1})/g);
    if (result != null) {
        for (var match of result) {
            value = value.replace(match, `${match[0]}_${match[1].toLowerCase()}`);
        }
    }
    return value;
}

function hyphenToCamelCase(value) {
    value = value.replace(/$-+/, '');
    var result = value.match(/(-{1}[a-z]{1})/g);
    if (result != null) {
        for (var match of result) {
            value = value.replace(match, match[1].toUpperCase());
        }
    }
    return value;
}

function setIndent(n, value = '\t') {
    return value.repeat(n);
}

function convertToDP(value, font = false) {
    if (value != null) {
        if (typeof value == 'number') {
            value += 'px';
        }
        var match = value.match(/(px|pt)/);
        value = parseInt(value);
        if (match != null) {
            if (match[0] == 'pt') {
                value *= (4 / 3);
            }
            value = (value / (SETTINGS.density / 160));
            if (value >= 1) {
                value = Math.floor(value);
            }
            else if (value > 0) {
                value = value.toFixed(2);
            }
        }
        if (!isNaN(value)) {
            return value + (font ? 'sp' : 'dp');
        }
    }
    return '0dp';
}

function convertToSP(value) {
    return convertToDP(value, true);
}

function withinRange(a, b, n = 1) {
    return (b >= (a - n) && b <= (a + n));
}

function deleteStyleAttribute(sorted, attributes, nodeIds) {
    attributes.split(';').forEach(value => {
        for (var j = 0; j < sorted.length; j++) {
            if (sorted[j] != null) {
                var index = -1;
                var key = '';
                for (var k in sorted[j]) {
                    if (k == value) {
                        index = j;
                        key = k;
                        j = sorted.length;
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
    for (var styleSheet of document.styleSheets) {
        for (var rule of styleSheet.rules) {
            var elements = document.querySelectorAll(rule.selectorText);
            var attributes = new Set();
            for (var i of rule.styleMap) {
                attributes.add(hyphenToCamelCase(i[0]));
            }
            for (var element of elements) {
                for (var i of element.style) {
                    attributes.add(hyphenToCamelCase(i));
                }
                var style = getElementStyle(element);
                var styleMap = {};
                for (var name of attributes) {
                    if (name.toLowerCase().indexOf('color') != -1) {
                        var color = getColorByName(rule.style[name]);
                        if (color != null) {
                            rule.style[name] = convertColorToRGB(color);
                        }
                    }
                    if (element.style[name] != null && element.style[name] != '') {
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
    var style = {};
    var layout = {};
    for (var [i, j] of RESOURCE_STYLE.entries()) {
        var sorted = Array.from({ length: j.reduce((a, b) => Math.max(a, b.attributes.length), 0) }, v => v = {});
        for (var k of j) {
            for (var l = 0; l < k.attributes.length; l++) {
                var name = k.attributes[l];
                if (sorted[l][name] == null) {
                    sorted[l][name] = [];
                }
                sorted[l][name].push(k.id);
            }
        }
        style[i] = {};
        layout[i] = {};
        do {
            if (sorted.length == 1) {
                for (var k in sorted[0]) {
                    var value = sorted[0][k];
                    if (value.length > 2) {
                        style[i][k] = value;
                    }
                    else {
                        layout[i][k] = value;
                    }
                }
                sorted.length = 0;
            }
            else {
                var styleKey = {};
                var layoutKey = {}
                for (var k = 0; k < sorted.length; k++) {
                    var filtered = {};
                    for (var l in sorted[k]) {
                        if (sorted[k] == null) {
                            continue;
                        }
                        var ids = sorted[k][l];
                        var revalidate = false;
                        if (ids == null) {
                            continue;
                        }
                        else if (ids.length == j.length) {
                            styleKey[l] = ids;
                            sorted[k] = null;
                            revalidate = true;
                        }
                        else if (ids.length == 1) {
                            layoutKey[l] = ids;
                            sorted[k] = null;
                            revalidate = true;
                        }
                        if (!revalidate) {
                            var found = {};
                            for (var m = 0; m < sorted.length; m++) {
                                if (k != m) {
                                    for (var n in sorted[m]) {
                                        var compare = sorted[m][n];
                                        for (var o = 0; o < ids.length; o++) {
                                            if (compare.includes(ids[o])) {
                                                if (found[n] == null) {
                                                    found[n] = [];
                                                }
                                                found[n].push(ids[o]);
                                            }
                                        }
                                    }
                                }
                            }
                            for (var m in found) {
                                if (found[m].length > 1) {
                                    filtered[[l, m].sort().join(';')] = found[m];
                                }
                            }
                        }
                    }
                    var combined = {};
                    var deleteKeys = new Set();
                    for (var l in filtered) {
                        for (var m in filtered) {
                            if (l != m && filtered[l].join('') == filtered[m].join('')) {
                                var shared = filtered[l].join(',');
                                if (combined[shared] != null) {
                                    combined[shared] = new Set([...combined[shared], ...m.split(';')]);
                                }
                                else {
                                    combined[shared] = new Set([...l.split(';'), ...m.split(';')]);
                                }
                                deleteKeys.add(l).add(m);
                            }
                        }
                    }
                    deleteKeys.forEach(value => delete filtered[value]);
                    for (var l in filtered) {
                        deleteStyleAttribute(sorted, l, filtered[l]);
                        style[i][l] = filtered[l];
                    }
                    for (var l in combined) {
                        var attr = Array.from(combined[l]).sort().join(';');
                        var nodeIds = l.split(',').map(m => parseInt(m));
                        deleteStyleAttribute(sorted, attr, nodeIds);
                        style[i][attr] = nodeIds;
                    }
                }
                var combined = Object.keys(styleKey);
                if (combined.length > 0) {
                    style[i][combined.join(';')] = styleKey[combined[0]];
                }
                for (var k in layoutKey) {
                    layout[i][k] = layoutKey[k];
                }
                for (var k = 0; k < sorted.length; k++) {
                    if (sorted[k] != null && Object.keys(sorted[k]).length == 0) {
                        delete sorted[k];
                    }
                }
                sorted = sorted.filter(item => item);
            }
        }
        while (sorted.length > 0)
    }
    var resource = {};
    for (var tag in style) {
        resource[tag] = [];
        for (var attributes in style[tag]) {
            resource[tag].push({ attributes, ids: style[tag][attributes]});
        }
        resource[tag].sort((a, b) => {
            var [c, d] = [a.ids.length, b.ids.length];
            if (c == d) {
                [c, d] = [a.attributes.split(';').length, b.attributes.split(';').length];
            }
            return (c >= d ? -1 : 1);
        });
        resource[tag].forEach((item, index) => item.name = `${tag.charAt(0) + tag.substring(1).toLowerCase()}_${(index + 1)}`);
    }
    RESOURCE_STYLE = resource;
    for (var item of NODE_CACHE) {
        var tagName = item.tagName;
        var styleTag = resource[tagName];
        var layoutTag = layout[tagName];
        if (styleTag != null) {
            var styles = [];
            for (var tag of styleTag) {
                if (tag.ids.includes(item.id)) {
                    styles.push(tag.name);
                }
            }
            item.androidStyle = styles.join('.');
            if (item.androidStyle != '') {
                item.attributes.push(`style="@style/${item.androidStyle}"`);
            }
        }
        if (layoutTag != null) {
            for (var tag in layoutTag) {
                if (layoutTag[tag].includes(item.id)) {
                    item.attributes.push(tag);
                }
            }
        }
    }
}

function setLinearRect(item) {
    var bounds = item.bounds;
    var linear = {
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        left: bounds.left
    };
    if (item.style.marginTop != '0px') {
        linear.top -= parseInt(item.style.marginTop);
    }
    if (item.style.marginBottom != '0px') {
        linear.bottom += parseInt(item.style.marginBottom);
    }
    if (item.style.marginLeft != '0px') {
        linear.left -= parseInt(item.style.marginLeft);
    }
    if (item.style.marginRight != '0px') {
        linear.right += parseInt(item.style.marginRight);
    }
    item.linear = linear;
}

function setLinearMargins() {
    for (var item of NODE_CACHE) {
        if (isView(item, LAYOUT_ANDROID.LINEAR)) {
            var children = NODE_CACHE.filter(node => (node.renderParent == item && !node.scrollView && !node.linearSkip));
            if (item.android.orientation == 'vertical') {
                var current = item.bounds.top + (item.style != null ? parseInt(item.style.paddingTop) : 0);
                children.sort((a, b) => (a.bounds.top > b.bounds.top ? 1 : -1)).forEach(node => {
                    var height = node.bounds.top - current;
                    if (height > 0) {
                        if (node.invisible && node.gridLayout != null) {
                            node = node.gridLayout;
                        }
                        replaceAttribute(node, 'android:layout_marginTop', convertToDP(height));
                    }
                    if (node.style == null) {
                        node = node.wrapper;
                    }
                    current = node.bounds.bottom + parseInt(node.style.marginBottom);
                });
            }
            else {
                var current = item.bounds.left + (item.style != null ? parseInt(item.style.paddingLeft) : 0);
                children.sort((a, b) => (a.bounds.left > b.bounds.left ? 1 : -1)).forEach(node => {
                    var width = node.bounds.left - current;
                    if (width > 0) {
                        if (node.invisible && node.gridLayout != null) {
                            node = node.gridLayout;
                        }
                        replaceAttribute(node, 'android:layout_marginLeft', convertToDP(width));
                    }
                    if (node.label != null) {
                        node = node.label;
                    }
                    else if (node.style == null) {
                        node = node.wrapper;
                    }
                    current = node.bounds.right + (node.style != null ? parseInt(node.style.marginRight) : 0);
                });
            }
        }
    }
}

function setNodeCache() {
    var elements = document.querySelectorAll('body > *');
    var selector = 'body *';
    for (var i in elements) {
        if (MAPPING_ANDROID[elements[i].tagName] != null) {
            selector = 'body, body *';
            break;
        }
    }
    elements = document.querySelectorAll(selector);
    for (var i in elements) {
        var element = elements[i];
        if (typeof element.getBoundingClientRect == 'function') {
            var bounds = element.getBoundingClientRect();
            if (bounds.width != 0 && bounds.height != 0) {
                var style = getComputedStyle(element);
                var styleMap = element.styleMap || {};
                var overflow = ((style.overflow == 'auto' || style.overflow == 'scroll') && (element.clientHeight != element.scrollHeight || element.clientWidth != element.scrollWidth) ? style.overflow : '');
                for (var i of element.style) {
                    styleMap[hyphenToCamelCase(i)] = element.style[i];
                }
                var data = {
                    id: NODE_CACHE.length + 1,
                    element: element,
                    tagName: element.tagName,
                    children: [],
                    renderParent: null,
                    depth: 0,
                    depthIndent: 0,
                    style,
                    styleMap,
                    android: {},
                    attributes: [],
                    previous: {},
                    scroll: {
                        width: styleMap.width || '',
                        height: styleMap.height || '',
                        overflow,
                        bottom: bounds.bottom + (overflow != '' ? (element.scrollHeight - element.offsetHeight) : 0),
                        right: bounds.right + (overflow != '' ? (element.scrollWidth - element.offsetWidth) : 0),
                        nested: false
                    }
                };
                element.cacheData = data;
                NODE_CACHE.push(data);
            }
        }
    }
    for (var item of NODE_CACHE) {
        if (item.scroll.overflow != '') {
            if (item.scroll.width != '') {
                item.element.style.width = '';
            }
            if (item.scroll.height != '') {
                item.element.style.height = '';
            }
            item.element.style.overflow = 'visible';
            item.children.forEach(item => item.scroll.nested = (item.scroll.overflow != ''));
        }
    }
    for (var parent of NODE_CACHE) {
        if (parent.bounds == null) {
            parent.bounds = parent.element.getBoundingClientRect();
            setLinearRect(parent);
        }
        for (var child of NODE_CACHE) {
            if (parent != child) {
                if (child.bounds == null) {
                    child.bounds = child.element.getBoundingClientRect();
                    setLinearRect(child);
                }
                if (child.bounds.left >= parent.bounds.left && child.bounds.right <= parent.bounds.right && child.bounds.top >= parent.bounds.top && child.bounds.bottom <= parent.bounds.bottom) {
                    child.parent = parent;
                    child.depth = parent.depth + 1;
                    parent.children.push(child);
                }
            }
        }
    }
    for (var item of NODE_CACHE) {
        if (item.scroll.overflow != '') {
            if (item.scroll.width != '') {
                item.element.style.width = item.scroll.width;
            }
            if (item.scroll.height != '') {
                item.element.style.height = item.scroll.height;
            }
            item.element.style.overflow = item.scroll.overflow;
        }
    }
    for (var item of NODE_CACHE) {
        if (item.parent == null) {
            item.parent = { id: 0 };
        }
        item.children.sort((a, b) => {
            var [x, y] = [a.depth, b.depth];
            if (x == y) {
                [x, y] = [a.id, b.id];
            }
            return (x >= y ? 1 : -1);
        });
    }
    NODE_CACHE.sort((a, b) => {
        var [x, y] = [a.depth, b.depth];
        if (x == y) {
            [x, y] = [a.bounds.x, b.bounds.x];
            if (x == y) {
                [x, y] = [a.id, b.id];
            }
        }
        return (x >= y ? 1 : -1);
    });
}

function parseDocument() {
    var output = '<?xml version="1.0" encoding="utf-8"?>\n{0}';
    var mapX = [];
    var mapY = [];
    setStyleMap();
    setNodeCache();
    for (var item of NODE_CACHE) {
        var x = Math.floor(item.bounds.x);
        var y = (item.parent ? item.parent.id : 0);
        if (mapX[item.depth] == null) {
            mapX[item.depth] = {};
        }
        if (mapY[item.depth] == null) {
            mapY[item.depth] = {};
        }
        if (mapX[item.depth][x] == null) {
            mapX[item.depth][x] = [];
        }
        if (mapY[item.depth][y] == null) {
            mapY[item.depth][y] = [];
        }
        mapX[item.depth][x].push(item);
        mapY[item.depth][y].push(item);
    }
    for (var i = 0; i < mapY.length; i++) {
        var coordsX = Object.keys(mapX[i]);
        var coordsY = Object.keys(mapY[i]);
        var partial = {};
        for (var j = 0; j < coordsY.length; j++) {
            var axisX = mapX[i][coordsX[j]];
            var axisY = mapY[i][coordsY[j]];
            axisY.sort((a, b) => (a.id > b.id ? 1 : -1));
            for (var k = 0; k < axisY.length; k++) {
                var itemY = axisY[k];
                if (!itemY.renderParent) {
                    var parentId = itemY.parent.id;
                    var tagName = getTagName(itemY);
                    var xml = '';
                    if (tagName == null) {
                        if (itemY.children.length > 0) {
                            if (itemY.children.findIndex(item => getTagName(item) != null && (item.depth == itemY.depth + 1)) == -1) {
                                var nextMapX = mapX[itemY.depth + 2];
                                var nextCoordsX = (nextMapX ? Object.keys(nextMapX) : []);
                                if (nextCoordsX.length > 1) {
                                    var columns = [];
                                    var rightMax = [];
                                    var currentMax = 0;
                                    for (var l = 0; l < nextCoordsX.length; l++) {
                                        var nextAxisX = nextMapX[nextCoordsX[l]];
                                        rightMax[l] = currentMax;
                                        for (var m = 0; m < nextAxisX.length; m++) {
                                            if (nextAxisX[m].parent.parent && itemY.id == nextAxisX[m].parent.parent.id) {
                                                if (l == 0 || nextAxisX[m].bounds.left >= (rightMax[l - 1] || currentMax)) {
                                                    if (columns[l] == null) {
                                                        columns[l] = [];
                                                    }
                                                    columns[l].push(nextAxisX[m]);
                                                }
                                                rightMax[l] = Math.max(nextAxisX[m].bounds.right, rightMax[l]);
                                                currentMax = Math.max(rightMax[l], currentMax);
                                            }
                                        }
                                    }
                                    columns = columns.filter(n => n);
                                    var columnLength = 0;
                                    for (var item of columns) {
                                        item.sort((a, b) => {
                                            var [x, y] = [a.bounds.y, b.bounds.y];
                                            if (x == y) {
                                                [x, y] = [a.id, b.id];
                                            }
                                            return (x >= y ? 1 : -1);
                                        });
                                        columnLength = Math.max(item.length, columnLength);
                                    }
                                    for (var l = 0; l < columnLength; l++) {
                                        var y = -1;
                                        for (var m = 0; m < columns.length; m++) {
                                            var itemX = columns[m][l];
                                            if (itemX != null) {
                                                if (y == -1) {
                                                    y = itemX.bounds.y;
                                                }
                                                else if (!withinRange(y, itemX.bounds.y, SETTINGS.boundsOffset)) {
                                                    var nextRowX = columns[m - 1][l + 1];
                                                    if (columns[m][l + 1] == null || (nextRowX && withinRange(nextRowX.bounds.y, itemX.bounds.y, SETTINGS.boundsOffset))) {
                                                        columns[m].splice(l, 0, { spacer: 1 });
                                                    }
                                                }
                                            }
                                            else {
                                                columns[m].splice(l, 0, { spacer: 1 });
                                            }
                                        }
                                    }
                                    if (columns.length > 1) {
                                        var columnStart = []
                                        var columnEnd = [];
                                        var columnRender = [];
                                        var rowStart = [];
                                        xml += writeGridTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent, columns.length);
                                        for (var l = 0, count = 0; l < columns.length; l++) {
                                            columnStart[l] = Number.MAX_VALUE;
                                            columnEnd[l] = Number.MIN_VALUE;
                                            var spacer = 0;
                                            for (var m = 0; m < columns[l].length; m++) {
                                                if (columnRender[m] == null) {
                                                    columnRender[m] = new Set();
                                                }
                                                var itemX = columns[l][m];
                                                if (!itemX.spacer) {
                                                    columnStart[l] = Math.min(itemX.bounds.left, columnStart[l]);
                                                    columnEnd[l] = Math.max(itemX.bounds.right, columnEnd[l]);
                                                    columnRender[m].add(itemX.parent.id);
                                                    itemX.previous.depth = itemX.depth;
                                                    itemX.depth = itemY.depth + 1;
                                                    if (itemX.children.length > 0) {
                                                        var offsetDepth = itemX.previous.depth - itemX.depth;
                                                        itemX.children.forEach(item => item.depth -= offsetDepth);
                                                    }
                                                    itemX.previous.parent = itemX.parent;
                                                    itemX.previous.parentId = itemX.parent.id;
                                                    itemX.parent.renderParent = itemX.parent;
                                                    itemX.parent.invisible = true;
                                                    itemX.parent = itemY;
                                                    itemX.gridIndex = l;
                                                    var rowSpan = 1;
                                                    var columnSpan = 1 + spacer;
                                                    for (var n = l + 1; n < columns.length; n++) {
                                                        if (columns[n][m].spacer == 1) {
                                                            columnSpan++;
                                                            columns[n][m].spacer = 2;
                                                        }
                                                        else {
                                                            break;
                                                        }
                                                    }
                                                    if (columnSpan == 1) {
                                                        for (var n = m + 1; n < columns[l].length; n++) {
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
                                                        itemX.android.layout_rowSpan = rowSpan;
                                                    }
                                                    if (columnSpan > 1) {
                                                        itemX.android.layout_columnSpan = columnSpan;
                                                    }
                                                    itemX.gridRowEnd = (columnSpan + l == columns.length);
                                                    itemX.gridFirst = (count++ == 0);
                                                    itemX.gridLast = (itemX.gridRowEnd && m == columns[l].length - 1);
                                                    if (rowStart[m] == null) {
                                                        itemX.gridRowStart = true;
                                                        rowStart[m] = itemX;
                                                    }
                                                    spacer = 0;
                                                }
                                                else if (itemX.spacer == 1) {
                                                    spacer++;
                                                }
                                            }
                                        }
                                        columnRender.forEach((item, index) => {
                                            var minId = Array.from(item).reduce((a, b) => Math.min(a, b));
                                            var renderId = null;
                                            if (item.size > 1) {
                                                for (var l = 0; l < columns.length; l++) {
                                                    if (columns[l][index].previous.parentId == minId) {
                                                        renderId = columns[l][index].id;
                                                    }
                                                }
                                                for (var l = 0; l < columns.length; l++) {
                                                    if (columns[l][index].id != renderId) {
                                                        columns[l][index].renderAfterId = renderId;
                                                    }
                                                }
                                            }
                                        });
                                        itemY.gridColumnCount = columns.length;
                                        itemY.gridColumnStart = columnStart;
                                        itemY.gridColumnEnd = columnEnd;
                                    }
                                }
                            }
                            if (!itemY.renderParent) {
                                var [linearX, linearY] = isLinearXY(itemY.children.filter(item => (item.depth == itemY.depth + 1)));
                                if (linearX || linearY) {
                                    if (itemY.children.length > 1 && linearX && linearY) {
                                        xml += `{${itemY.id}}`;
                                        itemY.children.forEach(item => item.depthIndent -= 1);
                                        itemY.invisible = true;
                                        itemY.renderParent = itemY.parent;
                                    }
                                    else {
                                        xml += writeLinearTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent, linearY);
                                    }
                                }
                                else {
                                    xml += writeDefaultTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent);
                                }
                            }
                        }
                        else if (itemY.element.innerText.trim() != '') {
                            tagName = LAYOUT_ANDROID.TEXT;
                        }
                        else {
                            continue;
                        }
                    }
                    if (!itemY.renderParent) {
                        var element = itemY.element;
                        if (itemY.parent && isView(itemY.parent, LAYOUT_ANDROID.GRID) && itemY.previous.parentId) {
                            var prevParent = itemY.parent.children.find(item => item.id == itemY.previous.parentId);
                            if (prevParent != null) {
                                var siblings = prevParent.children.filter(item => !item.renderParent && item.bounds.left >= itemY.bounds.right && item.bounds.right <= itemY.parent.gridColumnEnd[itemY.gridIndex]).sort((a, b) => (a.bounds.x >= b.bounds.x ? 1 : -1));
                                if (siblings.length > 0) {
                                    siblings.unshift(itemY);
                                    var [linearX, linearY] = isLinearXY(siblings);
                                    var node = insertNode(itemY, itemY.parent, siblings, [0]);
                                    setAndroidAttributes(node, (linearX || linearY ? LAYOUT_ANDROID.LINEAR : LAYOUT_ANDROID.CONSTRAINT));
                                    if (itemY.android.layout_rowSpan > 1) {
                                        node.android.layout_rowSpan = itemY.android.layout_rowSpan;
                                        delete itemY.android.layout_rowSpan;
                                    }
                                    if (itemY.android.layout_columnSpan > 1) {
                                        node.android.layout_columnSpan = itemY.android.layout_columnSpan;
                                        delete itemY.android.layout_columnSpan;
                                    }
                                    var rowEnd = false;
                                    var template = siblings.map(item => {
                                        if (!item.renderParent) {
                                            var children = item.element.children;
                                            var invisible = false;
                                            if (children.length > 0) {
                                                invisible = true;
                                                for (var l = 0; l < children.length; l++) {
                                                    if (!siblings.includes(children[l].cacheData)) {
                                                        invisible = false;
                                                        break;
                                                    }
                                                }
                                            }
                                            if (invisible) {
                                                item.invisible = true;
                                                item.renderParent = true;
                                                return '';
                                            }
                                            item.parent = node;
                                            item.depthIndent++;
                                            item.siblingWrap = true;
                                            if (item.gridRowEnd) {
                                                item.gridRowEnd = false;
                                                rowEnd = true;
                                            }
                                            if (item.children.length > 0) {
                                                return writeDefaultTemplate(item, itemY.depth + itemY.depthIndent, node);
                                            }
                                            else {
                                                return writeTagTemplate(item, itemY.depth + itemY.depthIndent, node);
                                            }
                                        }
                                        return '';
                                    }).join('');
                                    if (rowEnd) {
                                        itemY.gridRowEnd = true;
                                    }
                                    if (linearX || linearY) {
                                        xml += writeLinearTemplate(node, itemY.depth + itemY.depthIndent - 1, itemY.previous.parent, linearY);
                                    }
                                    else {
                                        xml += writeDefaultTemplate(node, itemY.depth + itemY.depthIndent - 1, itemY.previous.parent);
                                    }
                                    xml = xml.replace(`{${node.id}}`, template);
                                }
                            }
                        }
                        if (!itemY.renderParent) {
                            xml += writeTagTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent, tagName);
                        }
                    }
                    if (xml != '') {
                        if (partial[parentId] == null) {
                            partial[parentId] = [];
                        }
                        if (itemY.renderAfterId == null) {
                            partial[parentId].push(xml);
                        }
                        else {
                            if (RENDER_AFTER[itemY.renderAfterId] == null) {
                                RENDER_AFTER[itemY.renderAfterId] = [];
                            }
                            RENDER_AFTER[itemY.renderAfterId].push(xml);
                        }
                    }
                }
            }
        }
        for (var id in partial) {
            if (partial[id] != '') {
                output = output.replace(`{${id}}`, partial[id].join(''));
            }
        }
    }
    for (var i in RENDER_AFTER) {
        output = output.replace(`{:${i}}`, RENDER_AFTER[i].join(''));
    }
    setResourceStyle();
    if (SETTINGS.defaultLayout == LAYOUT_ANDROID.RELATIVE) {
        output = writeRelativeLayout(output);
    }
    setLinearMargins();
    if (SETTINGS.showAttributes) {
        output = writeAttributes(output);
    }
    output = output.replace(/{[:@#]{1}[0-9]+}/g, '');
    return output;
}