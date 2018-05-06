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
var ELEMENT_ANDROID = {
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
        'window.getComputedStyle': {
            'fontFamily': 'android:fontFamily="{0}"',
            'fontSize': 'android:textSize="{0}px"',
            'fontStyle': 'android:textStyle="{0}"',
            'color': 'android:textColor="{0}"',
            'letterSpacing': 'android:letterSpacing="{0}"'
        }
    },
    'CheckBox': {
        'id|name': 'android:id="@+id/{0}"',
        'window.getComputedStyle': {
            'fontFamily': 'android:fontFamily="{0}"',
            'fontSize': 'android:textSize="{0}px"',
            'fontStyle': 'android:textStyle="{0}"',
            'color': 'android:textColor="{0}"',
            'letterSpacing': 'android:letterSpacing="{0}"'
        }
    },
    'Spinner': {
        'id|name': 'android:id="@+id/{0}"',
        'window.getComputedStyle': {
            'fontFamily': 'android:fontFamily="{0}"',
            'fontSize': 'android:textSize="{0}px"',
            'fontStyle': 'android:textStyle="{0}"',
            'color': 'android:textColor="{0}"',
            'letterSpacing': 'android:letterSpacing="{0}"'
        }
    },
    'TextView': {
        'id': 'android:id="@+id/{0}"',
        'window.getComputedStyle': {
            'fontFamily': 'android:fontFamily="{0}"',
            'fontSize': 'android:textSize="{0}px"',
            'fontStyle': 'android:textStyle="{0}"',
            'color': 'android:textColor="{0}"',
            'letterSpacing': 'android:letterSpacing="{0}"'
        },
        'window.addResourceString': {
            'innerText': 'android:text="@string/{0}"'
        }
    },
    'EditText': {
        'id|name': 'android:id="@+id/{0}"',
        'window.getComputedStyle': {
            'fontFamily': 'android:fontFamily="{0}"',
            'fontSize': 'android:textSize="{0}px"',
            'fontStyle': 'android:textStyle="{0}"',
            'color': 'android:textColor="{0}"',
            'letterSpacing': 'android:letterSpacing="{0}"'
        },
        'window.addResourceString': {
            'innerText': 'android:text="@string/{0}"'
        }
    },
    'Button': {
        'id|name': 'android:id="@+id/{0}"',
        'window.addResourceString': {
            'innerText': 'android:text="@string/{0}"'
        }
    }
};
var GENERATE_ID = {};
var RESOURCE_STRING = {};

function addResourceString(element) {
    var value = (element.innerText || element.value).trim();
    if (value != '') {
        for (var i in RESOURCE_STRING) {
            if (RESOURCE_STRING[i] == value) {
                return { innerText: i };
            }
        }
        var name = value.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace('__', '_').replace(/_+$/, '').split('_').slice(0, 4).join('_');
        RESOURCE_STRING[name] = value;
        return { innerText: name };
    }
    return null;
}
function getProperties(item, tagName, layout = false, subproperty = false) {
    var properties = ELEMENT_ANDROID[tagName];
    var element = item.element;
    var result = [];
    if (properties != null) {
        for (var i in properties) {
            var options = i.split('|');
            for (var j of options) {
                if (element && element[j] != '' && element[j] != null) {
                    result.push(properties[i].replace('{0}', element[j]));
                    break;
                }
                else if (j.indexOf('.') != -1) {
                    var objectNames = j.split('.');
                    var method = window;
                    for (var k of objectNames) {
                        if (k == 'window') {
                            continue;
                        }
                        else if (method[k]) {
                            method = method[k];
                        }
                    }
                    if (typeof method == 'function') {
                        var data = method(element);
                        if (data != null) {
                            for (var k in properties[i]) {
                                var property = data[k];
                                if (property != '' && property != null) {
                                    if (properties[i][k].indexOf('rgb') != -1) {
                                        var rgb = getRGB(property);
                                        if (rgb) {
                                            property = property.replace(rgb[0], rgb[1]);
                                        }
                                    }
                                    result.push(properties[i][k].replace('{0}', property.replace(/(pt|px)$/, '')));
                                }
                            }
                            break;
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
    item.androidId = tagName + GENERATE_ID[tagName]++;
    return item.androidId;
}
function getRGB(value) {
    var result = value.match(/rgb\(([0-9]{1,3}), ([0-9]{1,3}), ([0-9]{1,3})\)/);
    if (result && result.length == 4) {
        return [result[0], `#${getHex(result[1]) + getHex(result[2]) + getHex(result[3])}`];
    }
    return null;
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
function displayProperties(properties, indent = 0) {
    return properties.map(value => `\n${setIndent(indent) + value}`).join('');
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
        'android:orientation="{0}"': (vertical ? "vertical" : "horizontal")
    });
    return indent + `<${DEFAULT_ANDROID.LINEAR}` +
                    `${displayProperties(getProperties(item, DEFAULT_ANDROID.LINEAR, true), depth + 1)}>\n` +
                    `{${item.id}}` +
            indent + `</${DEFAULT_ANDROID.LINEAR}>\n`;
}
function getConstraintTemplate(item, depth, parent) {
    var indent = setIndent(depth);
    item.androidTagName = DEFAULT_ANDROID.CONSTRAINT,
    item.renderParent = parent;
    Object.assign(item.properties, {
    });
    return indent + `<${DEFAULT_ANDROID.CONSTRAINT}` +
                    `${displayProperties(getProperties(item, DEFAULT_ANDROID.CONSTRAINT, true), depth + 1)}>\n` +
                    `{${item.id}}` +
            indent + `</${DEFAULT_ANDROID.CONSTRAINT}>\n`;
}
function getGridTemplate(item, depth, parent, columnCount = 2) {
    var indent = setIndent(depth);
    item.androidTagName = DEFAULT_ANDROID.GRID;
    item.renderParent = parent;
    Object.assign(item.properties, {
        'android:columnCount="{0}"': columnCount
    });
    return indent + `<${DEFAULT_ANDROID.GRID}` +
                    `${displayProperties(getProperties(item, DEFAULT_ANDROID.GRID, true), depth + 1)}>\n` +
                    `{${item.id}}` +
            indent + `</${DEFAULT_ANDROID.GRID}>\n`;
}
function getTagTemplate(item, depth, parent, tagName, recursive) {
    var element = item.element;
    var indent = setIndent(depth);
    item.androidTagName = tagName || getAndroidTagName(item);
    if (!recursive) {
        if (item.androidTagName == 'RadioButton' && element.name != '') {
            var result = cache.filter(input => (input.element.tagName == 'INPUT' && input.element.type == 'radio' && input.element.name == element.name && !input.parentRender && ((item.prevDepth || item.depth) == (input.prevDepth || input.depth))));
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
                                `${displayProperties(getProperties({ children: result, element: { id: '' }, }, 'RadioGroup', true), depth + 1)}>\n` +
                                xml +
                        indent + '</RadioGroup>\n';
                return xml;
            }
        }
    }
    item.renderParent = parent;
    return `${indent}<${item.androidTagName}${displayProperties(getProperties(item, item.androidTagName), depth + 1)} />\n`;
}
function setIndent(n, value = '\t') {
    return value.repeat(n);
}
function withinRange(a, b, n = 1) {
    return (b >= (a - n) && b <= (a + n));
}
function resetParent(item) {
    if (item.prevParent) {
        item.parent = item.prevParent;
        item.prevParent = null;
        item.prevParentId = null;
    }
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
var depthX = new Set();
var depthY = new Set();
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
    depthX.add(item.x);
    depthY.add(item.y);
});

var rankX = Array.from(depthX).sort((a, b) => (a > b ? 1 : -1));
var rankY = Array.from(depthY).sort((a, b) => (a > b ? 1 : -1));
cache.forEach(item => {
    item.rankX = rankX.indexOf(item.x);
    item.rankY = rankY.indexOf(item.y);
    var minX = null;
    var minY = null;
    var nextDepth = item.children.filter(child => (child.depth == item.depth + 1));
    nextDepth.forEach(item => {
        if (minX == null) {
            minX = item.x;
        }
        else if (withinRange(minX, item.x, 3)) {
            minX = Math.min(minX, item.x);
        }
        else {
            minX = -1;
        }
        if (minY == null) {
            minY = item.y;
        }
        else if (withinRange(minY, item.y, 3)) {
            minY = Math.min(minY, item.y);
        }
        else {
            minY = -1;
        }
    });
    if (minX != -1) {
        nextDepth.forEach(item => item.linearX = minX);
    }
    if (minY != -1) {
        nextDepth.forEach(item => item.linearY = minY);
    }
});

var output = '<?xml version="1.0" encoding="utf-8"?>\n{0}';

for (var i = 0; i < mapX.length; i++) {
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
                                    xml += getGridTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent, columns.length);
                                    for (var l = 0; l < columns.length; l++) {
                                        columnStart[l] = Number.MAX_VALUE;
                                        columnEnd[l] = 0;
                                        for (var m = 0; m < columns[l].length; m++) {
                                            var itemX = columns[l][m];
                                            if (!itemX.spacer) {
                                                columnStart[l] = Math.min(itemX.bounds.left, columnStart[l]);
                                                columnEnd[l] = Math.max(itemX.bounds.right, columnEnd[l]);
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
                                    itemY.columnStart = columnStart;
                                    itemY.columnEnd = columnEnd;
                                    itemY.columnCount = columns.length;
                                }
                            }
                        }
                        if (!itemY.renderParent) {
                            var linearX = itemY.children.filter(item => (item.depth == itemY.depth + 1) && item.linearX != null);
                            var linearY = itemY.children.filter(item => (item.depth == itemY.depth + 1) && item.linearY != null);
                            if (linearX.length || linearY.length) {
                                if (linearX.length > 1 || linearY.length > 1) {
                                    xml += getLinearTemplate(itemY, itemY.depth + itemY.depthIndent, itemY.parent, (linearX.length > linearY.length));
                                }
                                else {
                                    xml += `{${itemY.id}}`;
                                    itemY.children.forEach(item => item.depthIndent -= 1);
                                    itemY.renderParent = true;
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
                    partial[parentId] += xml;
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

var resource_string_output = '<?xml version="1.0" encoding="utf-8"?>\n' +
                                '<resources>\n';
for (var i in RESOURCE_STRING) {
    resource_string_output += `\t<string name="${i}">${RESOURCE_STRING[i]}</string>\n`;
}
resource_string_output += '</resources>';