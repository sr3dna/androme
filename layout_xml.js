var DEFAULT_ANDROID = {
    TEXT: 'TextView',
    LINEAR: 'LinearLayout',
    CONSTRAINT: 'ConstraintLayout',
    GRID: 'GridLayout'
};
var MAPPING_ANDROID = {
    'H1': 'TextView',
    'H2': 'TextView',
    'H3': 'TextView',
    'H4': 'TextView',
    'H5': 'TextView',
    'H6': 'TextView',
    'A': 'TextView',
    'B': 'TextView',
    'LABEL': 'TextView',
    'SPAN': 'TextView',
    'HR': 'View',
    'SELECT': 'Spinner',
    'INPUT' : {
        'text': 'EditText',
        'checkbox': 'CheckBox',
        'radio': 'RadioButton',
        'button': 'Button',
        'submit': 'Button'
    },
    'BUTTON': 'Button'
};
var PROPERTY_ANDROID = {
    'backgroundStyle': {
        'backgroundColor': 'android:background="@drawable/{0}"'
    },
    'computedStyle': {
        'fontFamily': 'android:fontFamily="{0}"',
        'fontSize': 'android:textSize="{0}"',
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
        'id': 'android:id="@+id/{0}"',
    },
    'LinearLayout': {
        'id': 'android:id="@+id/{0}"',
    },
    'GridLayout': {
        'id': 'android:id="@+id/{0}"',
    },
    'RadioGroup': {
        'id': 'android:id="@+id/{0}"'
    },
    'RadioButton': {
        'id': 'android:id="@+id/{0}"',
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'CheckBox': {
        'id|name': 'android:id="@+id/{0}"',
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing']
    },
    'Spinner': {
        'id|name': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceStringArray': PROPERTY_ANDROID['resourceStringArray']
    },
    'TextView': {
        'id': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceString': PROPERTY_ANDROID['resourceString']
    },
    'EditText': {
        'id|name': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceString': PROPERTY_ANDROID['resourceString']
    },
    'Button': {
        'id|name': 'android:id="@+id/{0}"',
        'window.setBackgroundStyle': PROPERTY_ANDROID['backgroundStyle'],
        'window.getComputedStyle': PROPERTY_ANDROID['computedStyle'],
        'window.setBoxSpacing': PROPERTY_ANDROID['boxSpacing'],
        'window.addResourceString': PROPERTY_ANDROID['resourceString']
    }
};

var GENERATE_ID = {};
var RESOURCE_STRING = new Map();
var RESOURCE_ARRAY = new Map();
var RESOURCE_STYLE = new Map();

function addResourceString(element, value) {
    if (value == null) {
        value = (element.innerText || element.value).trim();
    }
    if (value != '') {
        for (var i in RESOURCE_STRING) {
            var resource = RESOURCE_STRING.get(i);
            if (resource == value) {
                return { text: resource };
            }
        }
        var name = value.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').split('_').slice(0, 5).join('_').replace(/_+$/g, '');
        RESOURCE_STRING.set(name, value);
        return { text: name };
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
                    continue;
                }
                stringArray.set(value, addResourceString(null, text).text);
            }
        }
    }
    if (stringArray.size || integerArray.size) {
        var name = `${element.id || element.name}_array`;
        RESOURCE_ARRAY.set(name, (stringArray.size ? stringArray : integerArray));
        return { entries: name };
    }
    return null;
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
    for (var i in style) {
        style[i] = style[i](properties[i]);
    }
    var borderStyle = {
        default: 'android:color="#000"',
        solid: `android:color="${style.border[2]}"`,
        dotted: 'android:dashWidth="3dp" android:dashGap="1dp"',
        dashed: 'android:dashWidth="1dp" android:dashGap="1dp"'
    };
    if (style.border[0] != 'none' || style.borderRadius) {
        var xml = '<?xml version="1.0" encoding="utf-8"?>\n';
        if (style.borderRadius) {
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
                style.borderRadius.forEach((value, index) => {
                    if (value) {
                        xml += ` android:${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius="${value}"`;
                    }
                });
            }
            xml += ' />\n' +
                   '</shape>\n';
        }
        else if (style.border && !style.backgroundColor) {
            xml += '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n' +
                   `\t<stroke android:width="${style.border[1]}" ${borderStyle[style.border[0]]} />\n` +
                   '</shape>\n';
        }
        else {
            xml += '<layer-list xmlns:android="http://schemas.android.com/apk/res/android">' +  '\n';
            if (style.backgroundColor) {
                xml += '\t<item>\n' +
                       '\t\t<shape android:shape="rectangle">\n' +
                       `\t\t\t<solid android:color="${style.backgroundColor[1]}" />\n` +
                       '\t\t</shape>\n' +
                       '\t</item>\n';
            }
            if (style.border) {
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
    var properties = getComputedStyle(element);
    var result = {};
    ['padding', 'margin'].forEach(value => {
        ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
            var width = convertToDP(properties[`${value + side}`]);
            if (width != 0) {
                result[`${value + side}`] = width;
            }
        });
    });
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

function parseBoxDimensions(value) {
    var dimensions = value.match(/^([0-9]+(px|pt)) ([0-9]+(px|pt)) ([0-9]+(px|pt)) ([0-9]+(px|pt))$/);
    if (dimensions && dimensions.length >= 5) {
        if (dimensions[1] == dimensions[3] && dimensions[3] == dimensions[5] && dimensions[5] == dimensions[7]) {
            return [convertToDP(dimensions[1])];
        }
        else if (dimensions[1] == dimensions[5] && dimensions[3] == dimensions[7]) {
            return [convertToDP(dimensions[1]), convertToDP(dimensions[3])];
        }
        else {
            return [convertToDP(dimensions[1]), convertToDP(dimensions[3]), convertToDP(dimensions[5]), convertToDP(dimensions[7])];
        }
    }
    return null;
}

function parseBorderStyle(value) {
    var stroke = value.match(/(none|dotted|dashed|solid)/);
    var width = value.match(/([0-9]+(px|pt))/);
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
    return [stroke || 'solid', convertToDP(width || '1px'), color || '#000'];
}

function parseRGBA(value) {
    var result = value.match(/rgb(?:a)?\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})(?:, ([0-9]{1,3}))?\)/);
    if (result && result.length >= 4) {
        return [result[0], `#${getHex(result[1]) + getHex(result[2]) + getHex(result[3])}`, result[4]];
    }
    return null;
}

function convertToDP(value, font) {
    if (/[0-9]+(px|pt)$/.test(value.trim())) {
        var height = parseInt(value.replace(/[a-z]/g, ''));
        if (height > 0) {
            return height + (font ? 'sp' : 'dp');
        }
    }
    return 0;
}

function convertToSP(value) {
    return convertToDP(value, true);
}

function getProperties(item, tagName, layout, subproperty) {
    var properties = WIDGET_ANDROID[tagName];
    var element = item.element;
    var result = [];
    if (properties != null) {
        var appended = {};
        for (var i in properties) {
            if (appended[i] != null) {
                continue;
            }
            var options = i.split('|');
            for (var j of options) {
                if (element && element[j] != '' && element[j] != null) {
                    result.push(properties[i].replace('{0}', element[j]));
                    if (j == 'id' || j == 'name') {
                        item.androidId = element[j];
                    }
                    appended[i] = element[j];
                    break;
                }
                else if (j.indexOf('.') != -1) {
                    var objectNames = j.split('.');
                    var method = window;
                    var methodName = null;
                    for (var k of objectNames) {
                        if (k == 'window') {
                            continue;
                        }
                        else if (method[k]) {
                            method = method[k];
                            methodName = k;
                        }
                    }
                    if (typeof method == 'function') {
                        var data = method(element);
                        if (data != null) {
                            var output = [];
                            for (var k in properties[i]) {
                                if (appended[k] != null) {
                                    continue;
                                }
                                var property = data[k];
                                if (property != '' && property != null) {
                                    if (property.startsWith('rgb')) {
                                        var rgb = parseRGBA(property);
                                        if (rgb) {
                                            property = property.replace(rgb[0], rgb[1]);
                                        }
                                    }
                                    else if (/(px|pt)$/.test(property)) {
                                        property = convertToDP(property);
                                    }
                                    output.push(properties[i][k].replace('{0}', property));
                                    appended[k] = property;
                                }
                            }
                            if (output.length) {
                                if (methodName == 'getComputedStyle') {
                                    if (!RESOURCE_STYLE.has(item.tagName)) {
                                        RESOURCE_STYLE.set(item.tagName, []);
                                    }
                                    RESOURCE_STYLE.get(item.tagName).push(output);
                                }
                                result.push(...output);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    for (var i in item.properties) {
        result.push(i.replace('{0}', item.properties[i]));
    }
    if (result.length) {
        var nextElement = element.nextElementSibling;
        if (element.tagName == 'INPUT' && element.id != '' && nextElement && nextElement.htmlFor == element.id) {
            var label = getProperties(nextElement.cacheData, MAPPING_ANDROID[nextElement.tagName], false, true);
            if (label.length) {
                label.forEach(value => {
                    if (value != '') {
                        var property = value.substring(0, value.indexOf('='));
                        var index = result.findIndex(value => value.indexOf(property) != -1);
                        if (index != 1) {
                            result[index] = value;
                        }
                    }
                });
            }
            nextElement.cacheData.renderParent = true;
        }
    }
    if (!subproperty) {
        if (layout || !item.siblingsWrap) {
            if (item.rowspan > 1) {
                result.push(`android:layout_rowSpan="${item.rowspan}"`);
            }
            if (item.colspan > 1) {
                result.push(`android:layout_columnSpan="${item.colspan}"`);
            }
        }
        if (element.id == '' && (!result.length || result[0].indexOf('android:id') != 0)) {
            tagName = tagName || item.androidTagName;
            generateAndroidId(item, tagName);
            result.unshift(`android:id="id+/${item.androidId}"`);
        }
        else if (element.id != '') {
            item.androidId = element.id;
        }
    }
    return result;
}

function generateAndroidId(item, tagName) {
    if (GENERATE_ID[tagName] == null) {
        GENERATE_ID[tagName] = 1;
    }
    item.androidId = tagName.toLowerCase() + GENERATE_ID[tagName]++;
    return item.androidId;
}

function getHex(n) {
    var hex = '0123456789ABCDEF';
    n = parseInt(n);
    if (isNaN(n)) {
        return '00'
    };
    n = Math.max(0, Math.min(n, 255));
    return hex.charAt((n - (n % 16)) / 16) + hex.charAt(n % 16);
}

function displayProperties(item, properties, indent = 0) {
    var output = properties.map(value => `\n${setIndent(indent) + value}`).join('')
    if (item != null) {
        output = output.replace('{id}', item.androidId);
    }
    return output;
}

function parentConstraint(item) {
    return (item.parent && item.parent.androidTagName == DEFAULT_ANDROID.CONSTRAINT);
}

function getAndroidTagName(item) {
    var result = MAPPING_ANDROID[item.tagName];
    if (typeof result == 'object') {
        result = result[item.element.type];
    }
    return result;
}

function getLinearTemplate(item, depth, parent, vertical) {
    var indent = setIndent(depth);
    item.androidTagName = DEFAULT_ANDROID.LINEAR;
    item.renderParent = parent;
    Object.assign(item.properties, {
        'android:orientation="{0}"': (vertical ? 'vertical' : 'horizontal')
    });
    return indent + `<${DEFAULT_ANDROID.LINEAR}` +
                    `${displayProperties(item, getProperties(item, DEFAULT_ANDROID.LINEAR, true), depth + 1)}>\n` +
                    `{${item.id}}` +
           indent + `</${DEFAULT_ANDROID.LINEAR}>\n` +
                    `{${item.id}-0}`;
}

function getConstraintTemplate(item, depth, parent) {
    var indent = setIndent(depth);
    item.androidTagName = DEFAULT_ANDROID.CONSTRAINT,
    item.renderParent = parent;
    return indent + `<${DEFAULT_ANDROID.CONSTRAINT}` +
                    `${displayProperties(item, getProperties(item, DEFAULT_ANDROID.CONSTRAINT, true), depth + 1)}>\n` +
                    `{${item.id}}` +
           indent + `</${DEFAULT_ANDROID.CONSTRAINT}>\n` +
                    `{${item.id}-0}`;
}

function getGridTemplate(item, depth, parent, columnCount = 2) {
    var indent = setIndent(depth);
    item.androidTagName = DEFAULT_ANDROID.GRID;
    item.renderParent = parent;
    Object.assign(item.properties, {
        'android:columnCount="{0}"': columnCount
    });
    return indent + `<${DEFAULT_ANDROID.GRID}` +
                    `${displayProperties(item, getProperties(item, DEFAULT_ANDROID.GRID, true), depth + 1)}>\n` +
                    `{${item.id}}` +
           indent + `</${DEFAULT_ANDROID.GRID}>\n` +
                    `{${item.id}-0}`;
}

function getTagTemplate(item, depth, parent, tagName, recursive) {
    var element = item.element;
    var indent = setIndent(depth);
    item.androidTagName = tagName || getAndroidTagName(item);
    if (!recursive) {
        if (item.androidTagName == 'RadioButton' && element.name != '') {
            var result = cache.filter(input => (input.element.tagName == 'INPUT' && input.element.type == 'radio' && input.element.name == element.name && !input.renderParent && ((item.prevDepth || item.depth) == (input.prevDepth || input.depth))));
            var xml = '';
            if (result.length > 1) {
                var rowspan = 1;
                var colspan = 1;
                var checked = '';
                result.forEach(input => {
                    rowspan += (input.rowspan || 1) - 1;
                    colspan += (input.colspan || 1) - 1;
                    input.siblingsWrap = true;
                    if (input.element.checked) {
                        checked = input.element.id || generateAndroidId(input, getAndroidTagName(item));
                    }
                    xml += getTagTemplate(input, depth + 1, parent, tagName, true)
                });
                Object.assign(item.properties, {
                    'android:layout_rowSpan="{0}"': rowspan,
                    'android:layout_columnSpan="{0}"': colspan,
                    'android:checkedButton="@+id/{0}"': checked
                });
                xml = indent + '<RadioGroup' +
                               `${displayProperties(null, getProperties({ children: result, element: { id: '' }, }, 'RadioGroup', true), depth + 1)}>\n` +
                               xml +
                      indent + '</RadioGroup>\n';
                return xml;
            }
        }
    }
    item.renderParent = parent;
    return `${indent}<${item.androidTagName}${displayProperties(item, getProperties(item, item.androidTagName), depth + 1)} />\n`;
}

function setIndent(n, value = '\t') {
    return value.repeat(n);
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

function withinRange(a, b, n = 1) {
    return (b >= (a - n) && b <= (a + n));
}

function getResourceStringXML() {
    var resource = new Map([...RESOURCE_STRING.entries()].sort());
    var output = '<?xml version="1.0" encoding="utf-8"?>\n' +
                 '<resources>\n';
    for (var [i, j] of resource.entries()) {
        output += `\t<string name="${i}">${j}</string>\n`;
    }
    output += '</resources>';
    return output;
}

function getResourceArrayXML() {
    var resource = new Map([...RESOURCE_ARRAY.entries()].sort());
    var output = '<?xml version="1.0" encoding="utf-8"?>\n' +
                 '<resources>\n';
    for (var [i, j] of resource.entries()) {
        output += `\t<array name="${i}">\n`;
        for (var [k, l] of j.entries()) {
            output += `\t\t<item${(l != '' ? ` name="${k}"` : '')}>${(l != '' ? `@string/${l}` : `${k}`)}</item>\n`;
        }
        output += '\t</array>\n';
    }
    output += '</resources>';
    return output;
}

function getResourceDrawableXML() {
    var output = '';
    cache.forEach(item => {
        if (item.drawable) {
            output += `### filename: res/drawable/${item.tagName.toLowerCase()}_${item.androidId}.xml ###\n` +
                      `${item.drawable}\n\n`;
        }
    })
    return output;
}

var elements = document.querySelectorAll('body > *');
var cache = [];
var id = 1;
var selector = 'body *';

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
                properties: {},
                children: []
            };
            cache.push(data);
            element.cacheData = data;
        }
    }
}

for (var i = 0; i < cache.length; i++) {
    var parent = cache[i];
    for (var j = 0; j < cache.length; j++) {
        var child = cache[j];
        if (parent != child && child.bounds.x >= parent.bounds.x && child.bounds.right <= parent.bounds.right && child.bounds.y >= parent.bounds.y && child.bounds.bottom <= parent.bounds.bottom) {
            child.parent = parent;
            child.depth = parent.depth + 1;
            parent.children.push(child);
        }
    }
}

cache.forEach(item => {
    if (!item.parent) {
        item.parent = { id: 0 };
    }
    item.children.sort((a, b) => {
        var [x, y] = [a.depth, b.depth];
        if (x == y) {
            [x, y] = [a.id, b.id];
        }
        return (x >= y ? 1 : -1);
    });
});

cache.sort((a, b) => {
    var [x, y] = [a.depth, b.depth];
    if (x == y) {
        [x, y] = [a.bounds.x, b.bounds.x];
        if (x == y) {
            [x, y] = [a.id, b.id];
        }
    }
    return (x >= y ? 1 : -1);
});

var mapX = [];
var mapY = [];

cache.forEach(item => {
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
});

var output = '<?xml version="1.0" encoding="utf-8"?>\n{0}';
var renderAfter = {};

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
                var tagName = getAndroidTagName(itemY);
                var xml = '';
                if (tagName == null) {
                    if (itemY.children.length) {
                        if (itemY.children.findIndex(item => MAPPING_ANDROID[item.tagName] && (item.depth == itemY.depth + 1)) == -1) {
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
                                columns.forEach(item => {
                                    item.sort((a, b) => {
                                        var [x, y] = [a.bounds.y, b.bounds.y];
                                        if (x == y) {
                                            [x, y] = [a.id, b.id];
                                        }
                                        return (x >= y ? 1 : -1);
                                    });
                                    columnLength = Math.max(item.length, columnLength);
                                });
                                for (var l = 0; l < columnLength; l++) {
                                    var y = -1;
                                    for (var m = 0; m < columns.length; m++) {
                                        var itemX = columns[m][l];
                                        var valid = true;
                                        if (itemX) {
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
                                    xml += getGridTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent, columns.length);
                                    for (var l = 0; l < columns.length; l++) {
                                        columnStart[l] = Number.MAX_VALUE;
                                        columnEnd[l] = 0;
                                        for (var m = 0; m < columns[l].length; m++) {
                                            if (columnRender[m] == null) {
                                                columnRender[m] = new Set();
                                            }
                                            var itemX = columns[l][m];
                                            if (!itemX.spacer) {
                                                columnStart[l] = Math.min(itemX.bounds.left, columnStart[l]);
                                                columnEnd[l] = Math.max(itemX.bounds.right, columnEnd[l]);
                                                columnRender[m].add(itemX.parent.id);
                                                itemX.prevDepth = itemX.depth;
                                                itemX.depth = itemY.depth + 1;
                                                if (itemX.children.length) {
                                                    var offsetDepth = itemX.prevDepth - itemX.depth;
                                                    itemX.children.forEach(item => item.depth -= offsetDepth);
                                                }
                                                itemX.prevParentId = itemX.parent.id;
                                                itemX.parent.renderParent = itemX.parent;
                                                itemX.parent = itemY;
                                                itemX.columnIndex = l;
                                                itemX.colspan = 1;
                                                for (var n = l + 1; n < columns.length; n++) {
                                                    if (columns[n][m].spacer == 1) {
                                                        itemX.colspan++;
                                                        columns[n][m].spacer = 2;
                                                    }
                                                    else {
                                                        break;
                                                    }
                                                }
                                                if (itemX.colspan == 1) {
                                                    for (var n = m + 1; n < columns[l].length; n++) {
                                                        if (columns[l][n].spacer == 1) {
                                                            itemX.rowspan++;
                                                            columns[l][n].spacer = 2;
                                                        }
                                                        else {
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    columnRender.forEach((item, index) => {
                                        var minId = Array.from(item).reduce((a, b) => Math.min(a, b));
                                        var renderId = null;
                                        if (item.size > 1) {
                                            for (var l = 0; l < columns.length; l++) {
                                                if (columns[l][index].prevParentId == minId) {
                                                    renderId = columns[l][index].id;
                                                }
                                            }
                                            for (var l = 0; l < columns.length; l++) {
                                                if (columns[l][index].id != renderId) {
                                                    columns[l][index].renderAfter = renderId;
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
                                if (linearBoundsX && linearBoundsY) {
                                    xml += `{${itemY.id}}`;
                                    itemY.children.forEach(item => item.depthIndent -= 1);
                                    itemY.renderParent = true;
                                }
                                else {
                                    xml += getLinearTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent, linearBoundsX);
                                }
                            }
                            else {
                                xml += getConstraintTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent);
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
                    if (itemY.parent && itemY.parent.androidTagName == DEFAULT_ANDROID.GRID && itemY.prevParentId) {
                        var prevParent = itemY.parent.children.find(item => item.id == itemY.prevParentId);
                        if (prevParent) {
                            var siblingsPrev = prevParent.children.filter(item => !item.renderParent && prevParent.id == item.parent.id && item.bounds.right <= itemY.bounds.left && item.bounds.left >= itemY.parent.columnStart[itemY.columnIndex]);
                            var siblingsNext = prevParent.children.filter(item => !item.renderParent && prevParent.id == item.parent.id && item.bounds.left >= itemY.bounds.right && item.bounds.right <= itemY.parent.columnEnd[itemY.columnIndex]);
                            if (siblingsNext.length) {
                                itemY.prevDepth = itemY.depth;
                                itemY.depth++;
                                siblingsNext.unshift(itemY);
                                var template = siblingsNext.map(item => {
                                    if (!item.renderParent) {
                                        item.prevDepth = itemY.depth;
                                        item.depth = itemY.depth;
                                        item.siblingsWrap = (item == itemY);
                                        if (item != itemY && item.children.length) {
                                            return getConstraintTemplate(item, itemY.depth + itemY.depthIndent, itemY);
                                        }
                                        else {
                                            return getTagTemplate(item, itemY.depth + itemY.depthIndent, itemY);
                                        }
                                    }
                                    return '';
                                }).join('');
                                xml += getConstraintTemplate(itemY, itemY.depth + itemY.depthIndent - 1, itemY.parent).replace(`{${itemY.id}}`, template);
                            }
                            siblingsPrev.forEach(item => {
                                item.prevDepth = itemY.depth;
                                item.depth = itemY.depth;
                                item.children.forEach(child => child.depth = itemY.depth + 1);
                                if (item.children.length) {
                                    xml += getConstraintTemplate(item, item.depth + item.depthIndent, itemY.parent);
                                }
                                else {
                                    xml += getTagTemplate(item, item.depth + item.depthIndent, itemY.parent);
                                }
                            });
                        }
                    }
                    if (!itemY.renderParent) {
                        xml += getTagTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent, tagName);
                    }
                }
                if (xml != '') {
                    if (partial[parentId] == null) {
                        partial[parentId] = '';
                    }
                    if (itemY.renderAfter == null) {
                        partial[parentId] += xml;
                    }
                    else {
                        if (renderAfter[itemY.renderAfter] == null) {
                            renderAfter[itemY.renderAfter] = ''
                        }
                        renderAfter[itemY.renderAfter] += xml;
                    }
                }
            }
        }
    }
    for (var id in partial) {
        if (partial[id] != '') {
            output = output.replace(`{${id}}`, partial[id]);
        }
    }
}

for (var i in renderAfter) {
    output = output.replace(`{${i}-0}`, renderAfter[i]);
}

output = output.replace(/{[0-9]+-0}/g, '');

console.log(output);
console.log(getResourceStringXML());
console.log(getResourceArrayXML());
console.log(getResourceDrawableXML());