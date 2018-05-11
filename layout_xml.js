var DEFAULT_ANDROID = {
    TEXT: 'TextView',
    LINEAR: 'LinearLayout',
    CONSTRAINT: 'ConstraintLayout',
    GRID: 'GridLayout'
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
        'padding': 'android:layout_padding="{0}"',
        'paddingTop': 'android:layout_paddingTop="{0}"',
        'paddingRight': 'android:layout_paddingRight="{0}"',
        'paddingBottom': 'android:layout_paddingBottom="{0}"',
        'paddingLeft': 'android:layout_paddingLeft="{0}"',
        'paddingHorizontal': 'android:layout_paddingHorizontal="{0}"',
        'paddingVertical': 'android:layout_paddingVertical="{0}"'
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
    'RadioGroup': {
        'androidId': 'android:id="@+id/{0}"'
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
             `<!-- filename: res/values/string.xml -->\n`);
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
             `<!-- filename: res/values/string_array.xml -->\n`);
    return xml.join('\n');
}

function writeResourceStyleXML() {
    var xml = ['<?xml version="1.0" encoding="utf-8"?>',
               '<resources>'];
    for (var i in RESOURCE_STYLE) {
        for (var j of RESOURCE_STYLE[i]) {
            xml.push(`\t<style name="${j.name}">`);
            j.properties.split(';').forEach(value => {
                var [property, setting] = value.split('=');
                xml.push(`\t\t<item name="${property}">${setting.replace(/"/g, '')}</item>`);
            });
            xml.push('\t<style>');
        }
    }
    xml.push('</resources>',
             '<!-- filename: res/values/styles.xml -->\n');
    return xml.join('\n');
}

function writetResourceColorXML() {
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
        if (element.tagName == 'INPUT') {
            name = element.value;
            value = element.value;
        }
        else {
            name = element.innerText.trim();
            value = element.innerHTML.trim();
        }
    }
    if (value != '') {
        if (element != null) {
            if (element.cacheData.androidTagName == 'TextView') {
                var match = getComputedStyle(element).textDecoration.match(/(underline|line-through)/);
                if (match) {
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
            var color = getNearestColor(value);
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
    var style = {
        border: parseBorderStyle,
        borderTop: parseBorderStyle,
        borderRight: parseBorderStyle,
        borderBottom: parseBorderStyle,
        borderLeft: parseBorderStyle,
        borderRadius: parseBoxDimensions,
        backgroundColor: parseRGBA
    };
    var properties = getComputedStyle(element);
    var backgroundParent = [];
    if (element.parentNode != null) {
        backgroundParent = parseRGBA(getComputedStyle(element.parentNode)['backgroundColor']);
    }
    for (var i in style) {
        style[i] = style[i](properties[i]);
    }
    if (style.border[0] != 'none' || style.borderRadius != null) {
        style.border[2] = addResourceColor(style.border[2]);
        if (backgroundParent[0] == style.backgroundColor[0] || style.backgroundColor[4] == 0) {
            style.backgroundColor = null;
        }
        else {
            style.backgroundColor[1] = addResourceColor(style.backgroundColor[1]);
        }
        var borderStyle = {
            default: 'android:color="@android:color/black"',
            solid: `android:color="${style.border[2]}"`,
            dotted: 'android:dashWidth="3dp" android:dashGap="1dp"',
            dashed: 'android:dashWidth="1dp" android:dashGap="1dp"'
        };
        var xml = '<?xml version="1.0" encoding="utf-8"?>\n';
        if (style.borderRadius != null) {
            xml += '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n' +
                   `\t<stroke android:width="${style.border[1] || '1dp'}" ${borderStyle[style.border[1] || 'default']} />\n` +
                   (style.backgroundColor ? `\t<solid android:color="${style.backgroundColor[1]}" />\n` : '');
            if (style.borderRadius.length == 1) {
                xml += `\t<corners android:radius="${style.borderRadius[0]}" />\n`;
            }
            else {
                if (style.borderRadius.length == 2) {
                    style.borderRadius.push(...style.borderRadius.slice());
                }
                xml += '\t<corners';
                style.borderRadius.forEach((value, index) => xml += ` android:${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius="${value}"`);
            }
            xml += ' />\n' +
                   '</shape>';
        }
        else if (style.border[0] != 'none' && style.backgroundColor == null) {
            xml += '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n' +
                   `\t<stroke android:width="${style.border[1]}" ${borderStyle[style.border[0]]} />\n` +
                   '</shape>';
        }
        else {
            xml += '<layer-list xmlns:android="http://schemas.android.com/apk/res/android">' +  '\n';
            if (style.backgroundColor != null) {
                xml += '\t<item>\n' +
                       '\t\t<shape android:shape="rectangle">\n' +
                       `\t\t\t<solid android:color="${style.backgroundColor[1]}" />\n` +
                       '\t\t</shape>\n' +
                       '\t</item>\n';
            }
            if (style.border[0] != 'none') {
                xml += '\t<item>\n' +
                       '\t\t<shape android:shape="rectangle">\n' +
                       `\t\t\t<stroke android:width="${style.border[1]}" ${borderStyle[style.border[0]]} />\n` +
                       '\t\t</shape>\n' +
                       '\t</item>\n';
            }
            else {
                [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].forEach((item, index) => {
                    xml += `\t<item android:${['top', 'right', 'bottom', 'left'][index]}="${item[2]}">\n` +
                           '\t\t<shape android:shape="rectangle">\n' +
                           `\t\t\t<stroke android:width="${item[1]}" ${borderStyle[item[0]]} />\n` +
                           '\t\t</shape>\n' +
                           '\t</item>\n';
                });
            }
            xml += '</layer-list>';
        }
        element.cacheData.drawable = xml;
        return { backgroundColor: `${element.tagName.toLowerCase()}_{id}` };
    }
    return null;
}

function setBoxSpacing(element) {
    var result = getBoxSpacing(element);
    var grid = element.cacheData.grid;
    if (grid != null) {
        if (grid.paddingTop > 0) {
            result.paddingTop = `${(parseInt(result.paddingTop) || 0) + grid.paddingTop}dp`;
        }
        if (grid.paddingBottom > 0) {
            result.paddingBottom = `${(parseInt(result.paddingBottom) || 0) + grid.paddingBottom}dp`;
        }
        if (grid.paddingLeft > 0) {
            result.paddingLeft = `${(parseInt(result.paddingLeft) || 0) + grid.paddingLeft}dp`;
        }
        if (grid.paddingRight > 0) {
            result.paddingRight = `${(parseInt(result.paddingRight) || 0) + grid.paddingRight}dp`;
        }
    }
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
    var properties = getComputedStyle(element);
    var result = {};
    ['padding', 'margin'].forEach(style => {
        ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
            var dimension = properties[`${style + side}`];
            dimension = (complete ? parseInt(dimension) : convertToDP(dimension));
            if (complete || (dimension != 0 && dimension != '0dp')) {
                result[`${style + side}`] = dimension;
            }
        });
    });
    return result;
}

function parseBoxDimensions(value) {
    var box = value.match(/^([0-9]+(?:px|pt)) ([0-9]+(?:px|pt)) ([0-9]+(?:px|pt)) ([0-9]+(?:px|pt))$/);
    if (box && box.length == 5) {
        if (box[1] == box[2] && box[2] == box[3] && box[3] == box[4]) {
            return [convertToDP(box[1])];
        }
        else if (box[1] == box[3] && box[2] == box[4]) {
            return [convertToDP(box[1]), convertToDP(box[2])];
        }
        else {
            return [convertToDP(box[1]), convertToDP(box[2]), convertToDP(box[3]), convertToDP(box[4])];
        }
    }
    return null;
}

function parseBorderStyle(value) {
    var stroke = value.match(/(none|dotted|dashed|solid)/);
    var width = value.match(/([0-9]+(?:px|pt))/);
    var color = parseRGBA(value);
    if (stroke) {
        stroke = stroke[1];
    }
    if (width) {
        width = width[1];
    }
    if (color) {
        color = color[1];
    }
    return [stroke || 'solid', convertToDP(width || 1), color || '#000'];
}

function parseRGBA(value) {
    var rgba = value.match(/rgb(?:a)?\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})(?:, ([0-9]{1,3}))?\)/);
    if (rgba && rgba.length >= 4) {
        return [rgba[0], `#${convertRGBtoHex(rgba[1]) + convertRGBtoHex(rgba[2]) + convertRGBtoHex(rgba[3])}`, parseInt((rgba[4] != null ? rgba[4] : 1))];
    }
    return null;
}

function setProperties(item, tagName, actions) {
    var widget = WIDGET_ANDROID[tagName];
    var element = item.element;
    var result = {};
    if (widget != null) {
        var j = 0;
        for (var i in widget) {
            if (result[i] != null || (actions != null && !actions.includes(j++))) {
                continue;
            }
            if (item[i] != null) {
                result[i] = widget[i].replace('{0}', item[i]);
            }
            else if (i.indexOf('.') != -1) {
                var objectNames = i.split('.');
                var method = window;
                var methodName = null;
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
                            var property = data[k];
                            if (property != null && property != '') {
                                if (property.startsWith('rgb')) {
                                    var rgb = parseRGBA(property);
                                    if (k == 'backgroundColor') {
                                        var backgroundParent = [];
                                        if (element.parentNode) {
                                            backgroundParent = parseRGBA(getComputedStyle(element.parentNode)['backgroundColor']);
                                        }
                                        if (backgroundParent[0] == rgb[0]) {
                                            continue;
                                        }
                                    }
                                    if (rgb) {
                                        property = addResourceColor(property.replace(rgb[0], rgb[1]));
                                    }
                                }
                                else if (/(px|pt)$/.test(property)) {
                                    property = convertToDP(property);
                                }
                                output.push(widget[i][k].replace('{0}', property));
                            }
                        }
                        if (output.length > 0) {
                            if (methodName == 'getComputedStyle') {
                                if (!RESOURCE_STYLE.has(item.tagName)) {
                                    RESOURCE_STYLE.set(item.tagName, []);
                                }
                                RESOURCE_STYLE.get(item.tagName).push({ id: item.id, properties: output });
                                result[i] = `{@${item.id}}`;
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
    if (actions == null) {
        for (var i in item.android) {
            var property = item.android[i];
            if (property != null && property != '') {
                if (typeof property == 'object') {
                    for (var j in property) {
                        result[j] = `android:${i}="@${j}+/${property[j]}"`;
                    }
                }
                else {
                    result[i] = `android:${i}="${property}"`;
                }
            }
        }
        if (element.tagName == 'INPUT' && element.id != '') {
            var nextElement = element.nextElementSibling;
            if (nextElement && nextElement.htmlFor == element.id) {
                var properties = setProperties(nextElement.cacheData, getTagName(nextElement.cacheData), [2, 5]);
                if (item.androidTagName == 'RadioButton') {
                    nextElement.cacheData.depthIndent++;
                }
                for (var name in properties) {
                    var value = properties[name];
                    if (value != '') {
                        result[name] = value;
                    }
                }
                nextElement.cacheData.renderParent = true;
            }
        }
    }
    return result;
}

function writeProperties(item, properties, indent = 0) {
    var result = [];
    for (var name in properties) {
        var value = properties[name];
        if (value != '') {
            if (Array.isArray(value)) {
                result.push(...value);
            }
            else {
                result.push(value);
            }
        }
    }
    var output = result.map(value => `\n${setIndent(indent) + value}`).join('');
    if (item != null) {
        output = output.replace('{id}', item.androidId);
    }
    return output;
}

function getTagName(item) {
    var tagName = MAPPING_ANDROID[item.tagName];
    if (typeof tagName == 'object') {
        tagName = tagName[item.element.type];
    }
    return tagName;
}

function setAndroidProperties(item, tagName) {
    var element = item.element;
    if (!tagName) {
        tagName = getTagName(item);
    }
    if (GENERATE_ID[tagName] == null) {
        GENERATE_ID[tagName] = 1;
    }
    item.androidTagName = tagName;
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

function writeTemplate(item, depth, parent, tagName) {
    var indent = setIndent(depth);
    setAndroidDimensions(item);
    setAndroidProperties(item, tagName);
    item.renderParent = parent;
    return getGridSpacing(item, depth) +
           indent + `<${tagName}` +
                    `${writeProperties(item, setProperties(item, tagName), depth + 1)}>\n` +
                    `{${item.id}}` +
           indent + `</${tagName}>\n` +
                    `{:${item.id}}`;
}

function writeLinearTemplate(item, depth, parent, vertical) {
    item.android.orientation = (vertical ? 'vertical' : 'horizontal');
    return writeTemplate(item, depth, parent, DEFAULT_ANDROID.LINEAR);
}

function writeConstraintTemplate(item, depth, parent) {
    return writeTemplate(item, depth, parent, DEFAULT_ANDROID.CONSTRAINT);
}

function writeGridTemplate(item, depth, parent, columnCount = 2) {
    item.android.columnCount = columnCount;
    return writeTemplate(item, depth, parent, DEFAULT_ANDROID.GRID);
}

function setAndroidDimensions(item) {
    var element = item.element;
    var parent = element.parentNode;
    var parentStyle = getComputedStyle(parent);
    var parentWidth = parent.offsetWidth - (parseInt(parentStyle.paddingLeft) + parseInt(parentStyle.paddingRight));
    var parentHeight = parent.offsetHeight - (parseInt(parentStyle.paddingTop) + parseInt(parentStyle.paddingBottom));
    var elementStyle = getComputedStyle(element);
    var elementWidth = element.offsetWidth + parseInt(elementStyle.marginLeft) + parseInt(elementStyle.marginLeft);
    var elementHeight = element.offsetHeight + parseInt(elementStyle.marginTop) + parseInt(elementStyle.marginBottom);
    if (withinRange(parentWidth, elementWidth, 3)) {
        item.android.layout_width = 'match_parent';
    }
    else {
        item.android.layout_width = 'wrap_content';
    }
    if (withinRange(parentHeight, elementHeight, 3) || elementHeight > parentHeight) {
        item.android.layout_height = 'match_parent';
    }
    else {
        item.android.layout_height = 'wrap_content';
    }
    if (MAPPING_ANDROID[element.tagName]) {
        switch (elementStyle.display) {
            case 'line-item':
            case 'block':
            case 'inherit':
                item.android.layout_width = 'match_parent';
                break;
        }
    }
}

function writeTagTemplate(item, depth, parent, tagName = '', recursive = false) {
    var element = item.element;
    var indent = setIndent(depth);
    setAndroidDimensions(item);
    setAndroidProperties(item, tagName);
    if (!recursive) {
        if (element.type == 'radio') {
            var result = NODE_CACHE.filter(input => (input.element.tagName == 'INPUT' && input.element.type == 'radio' && input.element.name == element.name && !input.renderParent && ((item.previous.depth || item.depth) == (input.previous.depth || input.depth))));
            var xml = '';
            if (result.length > 1) {
                var data = {
                    children: result,
                    element: { id: '' },
                    android: {}
                };
                var checked = '';
                var rowEndId = item.id;
                var rowSpan = 1;
                var columnSpan = 1;
                for (var input of result) {
                    rowSpan += (input.layout_rowSpan || 1) - 1;
                    columnSpan += (input.layout_columnSpan || 1) - 1;
                    input.depthIndent++;
                    if (input.element.checked) {
                        checked = input.androidId;
                    }
                    xml += writeTagTemplate(input, depth + 1, parent, tagName, true);
                    if (input.rowEnd) {
                        rowEndId = input.id;
                    }
                }
                data.android.checkedButton = { id: checked };
                if (rowSpan > 1) {
                    data.android.layout_rowSpan = rowSpan;
                }
                if (columnSpan > 1) {
                    data.android.layout_columnSpan = columnSpan;
                }
                xml = indent + '<RadioGroup' +
                               `${writeProperties(null, setProperties(data, 'RadioGroup'), depth + 1)}>\n` +
                               xml +
                      indent + '</RadioGroup>\n' +
                               `{:${rowEndId}}`;
                return xml;
            }
        }
        else if (element.type == 'password') {
            item.android.inputType = 'textPassword';
        }
        else if (element.tagName == 'IMG') {
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
                break;
            }
            item.androidSrc = src;
        }
    }
    item.renderParent = parent;
    return getGridSpacing(item, depth) +
           indent + `<${item.androidTagName}${writeProperties(item, setProperties(item, item.androidTagName), depth + 1)} />\n` +
                    (!item.siblingWrap ? `{:${item.id}}` : '');
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

function getGridSpacing(item, depth = 0) {
    var indent = setIndent(depth);
    var xml = '';
    if (item.previous.parent != null && item.previous.parent.invisible) {
        var dimensions = getBoxSpacing(item.previous.parent.element, true);
        item.grid = {};
        if (item.rowStart) {
            item.grid.paddingLeft = dimensions.marginLeft + dimensions.paddingLeft;
            item.grid.paddingRight = dimensions.marginRight + dimensions.paddingRight;
        }
        var spaceXml = `${indent}<Space android:layout_width="match_parent" android:layout_height="{0}dp" android:layout_columnSpan="${item.renderParent.columnCount}" />\n`;
        if (item.rowEnd) {
            var heightBottom =  dimensions.marginBottom + dimensions.paddingBottom + (!item.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
            if (heightBottom > 0) {
                if (RENDER_AFTER[item.id] == null) {
                    RENDER_AFTER[item.id] = [];
                }
                RENDER_AFTER[item.id].push(formatString(spaceXml, heightBottom));
            }
            item.grid.paddingTop = dimensions.marginTop + dimensions.paddingTop;
            item.grid.paddingBottom = dimensions.marginBottom + dimensions.paddingBottom;
        }
        if (item.gridFirst) {
            var heightTop = dimensions.paddingTop + dimensions.marginTop;
            if (heightTop > 0) {
                xml += formatString(spaceXml, heightTop);
            }
        }
    }
    return xml;
}

function getLinearXY(siblings) {
    var maxLeft = Number.MIN_VALUE;
    var minRight = Number.MAX_VALUE;
    var maxTop = Number.MIN_VALUE;
    var minBottom = Number.MAX_VALUE;
    var linearBoundsX = true;
    var linearBoundsY = true;
    if (siblings.length > 1) {
        siblings.sort((a, b) => (a.bounds.x >= b.bounds.x ? 1 : -1)).forEach(item => {
            var bounds = item.bounds;
            if (bounds.bottom < maxTop || bounds.top > minBottom) {
                linearBoundsX = false;
            }
            maxTop = Math.max(bounds.top, maxTop);
            minBottom = Math.min(bounds.bottom, minBottom);
        });
        siblings.sort((a, b) => (a.bounds.y >= b.bounds.y ? 1 : -1)).forEach(item => {
            var bounds = item.bounds;
            if (bounds.right < maxLeft || bounds.left > minRight) {
                linearBoundsY = false;
            }
            maxLeft = Math.max(bounds.left, maxLeft);
            minRight = Math.min(bounds.right, minRight);
        });
    }
    return [linearBoundsX, linearBoundsY];
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

function setIndent(n, value = '\t') {
    return value.repeat(n);
}

function convertToDP(value, font = false) {
    value = parseInt(value);
    if (!isNaN(value)) {
        return value + (font ? 'sp' : 'dp');
    }
    return 0;
}

function convertToSP(value) {
    return convertToDP(value, true);
}

function withinRange(a, b, n = 1) {
    return (b >= (a - n) && b <= (a + n));
}

function deleteStyleProperty(sorted, cacheIds, property) {
    var properties = property.split(';');
    for (var property of properties) {
        for (var j = 0; j < sorted.length; j++) {
            if (sorted[j] != null) {
                var index = -1;
                var key = null;
                for (var k in sorted[j]) {
                    if (k == property) {
                        index = j;
                        key = k;
                        j = sorted.length;
                        break;
                    }
                }
                if (index != -1) {
                    sorted[index][key] = sorted[index][key].filter(value => !cacheIds.includes(value));
                    if (sorted[index][key].length == 0) {
                        delete sorted[index][key];
                    }
                    break;
                }
            }
        }
    }
}

function setResourceStyle(xml) {
    var style = {};
    var layout = {};
    for (var [i, j] of RESOURCE_STYLE.entries()) {
        var sorted = Array.from({ length: j.reduce((a, b) => Math.max(a, b.properties.length), 0) }, v => v = {});
        for (var k of j) {
            for (var l = 0; l < k.properties.length; l++) {
                var property = k.properties[l];
                if (sorted[l][property] == null) {
                    sorted[l][property] = [];
                }
                sorted[l][property].push(k.id);
            }
        }
        style[i] = {};
        layout[i] = {}
        do {
            if (sorted.length == 1) {
                for (var k in sorted[0]) {
                    var property = sorted[0][k];
                    if (property.length > 2) {
                        style[i][k] = property;
                    }
                    else {
                        layout[i][k] = property;
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
                        var property = sorted[k][l];
                        var revalidate = false;
                        if (property.length == j.length) {
                            styleKey[l] = property;
                            sorted[k] = null;
                            revalidate = true;
                        }
                        else if (property.length == 1) {
                            layoutKey[l] = property;
                            sorted[k] = null;
                            revalidate = true;
                        }
                        if (!revalidate) {
                            var found = {};
                            for (var m = 0; m < sorted.length; m++) {
                                if (k != m) {
                                    for (var n in sorted[m]) {
                                        var compare = sorted[m][n];
                                        for (var o = 0; o < property.length; o++) {
                                            if (compare.includes(property[o])) {
                                                if (found[n] == null) {
                                                    found[n] = [];
                                                }
                                                found[n].push(property[o]);
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
                        deleteStyleProperty(sorted, filtered[l], l);
                        style[i][l] = filtered[l];
                    }
                    for (var l in combined) {
                        var ids = l.split(',').map(m => parseInt(m));
                        var property = Array.from(combined[l]).sort().join(';');
                        deleteStyleProperty(sorted, ids, property);
                        style[i][property] = ids;
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
        for (var properties in style[tag]) {
            resource[tag].push({ properties, ids: style[tag][properties]});
        }
        resource[tag].sort((a, b) => {
            var [c, d] = [a.ids.length, b.ids.length];
            if (c == d) {
                [c, d] = [a.properties.split(';').length, b.properties.split(';').length];
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
        var styleXml = '';
        var layoutXml = '';
        var indent = setIndent(item.depth + item.depthIndent + 1);
        if (styleTag != null) {
            var styles = [];
            for (var tag of styleTag) {
                if (tag.ids.includes(item.id)) {
                    styles.push(tag.name);
                }
            }
            item.androidStyle = styles.join('.');
            if (item.androidStyle != '') {
                styleXml = `${indent}style="@style/${item.androidStyle}"\n`;
            }
        }
        if (layoutTag != null) {
            for (var tag in layoutTag) {
                if (layoutTag[tag].includes(item.id)) {
                    layoutXml += `${indent + tag}\n`;
                }
            }
        }
        if (styleXml != '' || layoutXml != '') {
            xml = xml.replace(new RegExp(`\t*{@${item.id}}\n*`), styleXml + layoutXml);
        }
    }
    return xml;
}

function parseDocument() {
    var elements = document.querySelectorAll('body > *');
    var selector = 'body *';
    var output = '<?xml version="1.0" encoding="utf-8"?>\n{0}';
    var mapX = [];
    var mapY = [];
    var id = 1;
    for (var i in elements) {
        if (MAPPING_ANDROID[elements[i].tagName]) {
            selector = 'body, body *';
            break;
        }
    }
    elements = document.querySelectorAll(selector);
    for (var i in elements) {
        var element = elements[i];
        if (element.getBoundingClientRect) {
            var bounds = element.getBoundingClientRect();
            if (bounds.width != 0 && bounds.height != 0) {
                var data = {
                    id: id++,
                    element: element,
                    tagName: element.tagName,
                    bounds,
                    renderParent: null,
                    depth: 0,
                    depthIndent: 0,
                    android: {},
                    previous: {},
                    children: []
                };
                NODE_CACHE.push(data);
                element.cacheData = data;
            }
        }
    }
    for (var parent of NODE_CACHE) {
        for (var child of NODE_CACHE) {
            if (parent != child && child.bounds.x >= parent.bounds.x && child.bounds.right <= parent.bounds.right && child.bounds.y >= parent.bounds.y && child.bounds.bottom <= parent.bounds.bottom) {
                child.parent = parent;
                child.depth = parent.depth + 1;
                parent.children.push(child);
            }
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
        item.x = x;
        item.y = Math.floor(item.bounds.y);
    }
    for (var i = 0; i < mapY.length; i++) {
        var coordsX = Object.keys(mapX[i]);
        var coordsY = Object.keys(mapY[i]);
        var partial = {};
        for (var j = 0; j < coordsY.length; j++) {
            var axisX = mapX[i][coordsX[j]];
            var axisY = mapY[i][coordsY[j]];
            for (var k = 0; k < axisY.length; k++) {
                var itemY = axisY[k];
                if (!itemY.renderParent) {
                    var parentId = itemY.parent.id;
                    var tagName = getTagName(itemY);
                    var xml = '';
                    if (tagName == null) {
                        if (itemY.children.length > 0) {
                            if (itemY.children.findIndex(item => getTagName(item) && (item.depth == itemY.depth + 1)) == -1) {
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
                                            var valid = true;
                                            if (itemX != null) {
                                                if (y == -1) {
                                                    y = itemX.bounds.y;
                                                }
                                                else if (!withinRange(y, itemX.bounds.y, 3)) {
                                                    var nextRowX = columns[m - 1][l + 1];
                                                    if (columns[m][l + 1] == null || (nextRowX && withinRange(nextRowX.bounds.y, itemX.bounds.y, 3))) {
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
                                                    itemX.columnIndex = l;
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
                                                    itemX.rowEnd = (columnSpan + l == columns.length);
                                                    itemX.gridFirst = (count++ == 0);
                                                    itemX.gridLast = (itemX.rowEnd && m == columns[l].length - 1);
                                                    if (rowStart[m] == null) {
                                                        itemX.rowStart = true;
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
                                        itemY.columnStart = columnStart;
                                        itemY.columnEnd = columnEnd;
                                        itemY.columnCount = columns.length;
                                    }
                                }
                            }
                            if (!itemY.renderParent) {
                                var [linearBoundsX, linearBoundsY] = getLinearXY(itemY.children.filter(item => (item.depth == itemY.depth + 1)));
                                if (linearBoundsX || linearBoundsY) {
                                    if (itemY.children.length > 1 && linearBoundsX && linearBoundsY) {
                                        xml += `{${itemY.id}}`;
                                        itemY.children.forEach(item => item.depthIndent -= 1);
                                        itemY.renderParent = true;
                                    }
                                    else {
                                        xml += writeLinearTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent, linearBoundsY);
                                    }
                                }
                                else {
                                    xml += writeConstraintTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent);
                                }
                            }
                        }
                        else if (itemY.element.innerText.trim() != '') {
                            tagName = DEFAULT_ANDROID.TEXT;
                        }
                        else {
                            continue;
                        }
                    }
                    if (!itemY.renderParent) {
                        var element = itemY.element;
                        if (itemY.parent && itemY.parent.androidTagName == DEFAULT_ANDROID.GRID && itemY.previous.parentId) {
                            var prevParent = itemY.parent.children.find(item => item.id == itemY.previous.parentId);
                            if (prevParent) {
                                var siblingsPrev = prevParent.children.filter(item => !item.renderParent && prevParent.id == item.parent.id && item.bounds.right <= itemY.bounds.left && item.bounds.left >= itemY.parent.columnStart[itemY.columnIndex]);
                                var siblingsNext = prevParent.children.filter(item => !item.renderParent && prevParent.id == item.parent.id && item.bounds.left >= itemY.bounds.right && item.bounds.right <= itemY.parent.columnEnd[itemY.columnIndex]);
                                if (siblingsNext.length > 0) {
                                    itemY.previous.depth = itemY.depth;
                                    itemY.depth++;
                                    siblingsNext.unshift(itemY);
                                    var rowEnd = false;
                                    var template = siblingsNext.map(item => {
                                        if (!item.renderParent) {
                                            item.previous.depth = itemY.depth;
                                            item.depth = itemY.depth;
                                            item.siblingWrap = true;
                                            if (item.rowEnd) {
                                                item.rowEnd = false;
                                                rowEnd = true;
                                            }
                                            if (item != itemY && item.children.length > 0) {
                                                return writeConstraintTemplate(item, itemY.depth + itemY.depthIndent, itemY);
                                            }
                                            else {
                                                return writeTagTemplate(item, itemY.depth + itemY.depthIndent, itemY);
                                            }
                                        }
                                        return '';
                                    }).join('');
                                    if (rowEnd) {
                                        itemY.rowEnd = true;
                                    }
                                    xml += writeConstraintTemplate(itemY, itemY.depth + itemY.depthIndent - 1, itemY.parent).replace(`{${itemY.id}}`, template);
                                }
                                for (var item of siblingsPrev) {
                                    item.previous.depth = itemY.depth;
                                    item.depth = itemY.depth;
                                    item.children.forEach(child => child.depth = itemY.depth + 1);
                                    if (item.children.length > 0) {
                                        xml += writeConstraintTemplate(item, item.depth + item.depthIndent, itemY.parent);
                                    }
                                    else {
                                        xml += writeTagTemplate(item, item.depth + item.depthIndent, itemY.parent);
                                    }
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
                                RENDER_AFTER[itemY.renderAfterId] = []
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
    output = output.replace(/{:[0-9]+}/g, '');
    output = setResourceStyle(output);
    return output;
}