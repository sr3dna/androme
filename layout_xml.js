var DEFAULT_ANDROID = {
    TEXT: 'TextView',
    LINEAR: 'LinearLayout',
    CONSTRAINT: 'ConstraintLayout',
    RELATIVE: 'RelativeLayout',
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
    'P': 'TextView',
    'LABEL': 'TextView',
    'HR': 'View',
    'SPAN': 'TextView',
    'BUTTON': 'Button',
    'INPUT' : {
        'text': 'EditText',
        'checkbox': 'CheckBox',
        'radio': 'RadioButton',
        'button': 'Button',
        'submit': 'Button'
    },
    'SELECT': 'Spinner'
};
var PROPERTIES_ANDROID = {
    'ConstraintLayout': {
        'id': 'android:id="@+id/{0}"',
    },
    'LinearLayout': {
        'id': 'android:id="@+id/{0}"',
    },
    'RelativeLayout': {
        'id': 'android:id="@+id/{0}"',
    },
    'GridLayout': {
        'id': 'android:id="@+id/{0}"',
    },
    'Button': {
        'id': 'android:id="@+id/{0}"',
        'innerText': 'android:text="@string/{0}"',
        'value': 'android:text="@string/{0}"'
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
        'id': 'android:id="@+id/{0}"',
        'window.getComputedStyle': {
            'fontFamily': 'android:fontFamily="{0}"',
            'fontSize': 'android:textSize="{0}px"',
            'fontStyle': 'android:textStyle="{0}"',
            'color': 'android:textColor="{0}"',
            'letterSpacing': 'android:letterSpacing="{0}"'
        }
    },
    'Spinner': {
        'id': 'android:id="@+id/{0}"',
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
        'innerText': 'android:text="@string/{0}"',
        'window.getComputedStyle': {
            'fontFamily': 'android:fontFamily="{0}"',
            'fontSize': 'android:textSize="{0}px"',
            'fontStyle': 'android:textStyle="{0}"',
            'color': 'android:textColor="{0}"',
            'letterSpacing': 'android:letterSpacing="{0}"'
        }
    },
    'EditText': {
        'id': 'android:id="@+id/{0}"',
        'innerText': 'android:text="@string/{0}"',
        'window.getComputedStyle': {
            'fontFamily': 'android:fontFamily="{0}"',
            'fontSize': 'android:textSize="{0}px"',
            'fontStyle': 'android:textStyle="{0}"',
            'color': 'android:textColor="{0}"',
            'letterSpacing': 'android:letterSpacing="{0}"'
        }
    }
};

function getProperties(item, tagName, layout = false) {
    var properties = PROPERTIES_ANDROID[tagName];
    var element = item.element;
    var result = [];
    if (properties != null) {
        for (var i in properties) {
            if (element[i] != '' && element[i] != null) {
                result.push(properties[i].replace('{0}', element[i]));
            }
            else if (i.indexOf('.') != -1) {
                var objectNames = i.split('.');
                var method = window;
                for (var j of objectNames) {
                    if (j == 'window') {
                        continue;
                    }
                    else if (method[j]) {
                        method = method[j];
                    }
                }
                if (typeof method == 'function') {
                    var data = method(element);
                    for (var k in properties[i]) {
                        var property = data[k];
                        if (property != '' && property != null) {
                            var rgb = getRGB(property);
                            if (rgb) {
                                property = property.replace(rgb[0], rgb[1]);
                            }
                            result.push(properties[i][k].replace('{0}', property.replace(/(pt|px)$/, '')));
                        }
                    }
                }
            }
        }
    }
    if (result.length) {
        var nextElement = element.nextElementSibling;
        if (element.tagName == 'INPUT' && element.id != '' && nextElement && element.id == nextElement.htmlFor) {
            var subproperties = getProperties(nextElement.cacheData, MAPPING_ANDROID[nextElement.tagName]);
            if (subproperties.length) {
                subproperties.forEach(value => {
                    if (value != '') {
                        var property = value.substring(0, value.indexOf('='));
                        var index = result.findIndex(value => value.indexOf(property) != -1);
                        if (index != 1) {
                            result[index] = value;
                        }
                    }
                });
            }
            nextElement.cacheData.render = true;
        }
    }
    if (layout || !item.siblingsWrap) {
        if (item.rowspan > 1) {
            result.push(`android:layout_rowSpan="${item.rowspan}"`);
        }
        if (item.colspan > 1) {
            result.push(`android:layout_columnSpan="${item.colspan}"`);
        }
    }
    return result;
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
function parentRelative(item) {
    return (item.parent && item.parent.androidTagName == DEFAULT_ANDROID.CONSTRAINT);
}
function getAndroidTagName(item) {
    var result = MAPPING_ANDROID[item.tagName];
    if (typeof result == 'object') {
        result = result[item.element.type];
    }
    return result;
}
function getLinearTemplate(item, depth) {
    var indent = setIndent(depth);
    item.androidTagName = DEFAULT_ANDROID.LINEAR;
    return indent + `<${DEFAULT_ANDROID.LINEAR} ID="${item.id}"` +
                    `${displayProperties(getProperties(item, DEFAULT_ANDROID.LINEAR, true), depth + 1)}>\n` +
                    `{${item.id}}` +
           indent + `</${DEFAULT_ANDROID.LINEAR}>\n`;
}
function getConstraintTemplate(item, depth) {
    var indent = setIndent(depth);
    item.androidTagName = DEFAULT_ANDROID.CONSTRAINT;
    return indent + `<${DEFAULT_ANDROID.CONSTRAINT} ID="${item.id}"` +
                    `${displayProperties(getProperties(item, DEFAULT_ANDROID.CONSTRAINT, true), depth + 1)}>\n` +
                    `{${item.id}}` +
           indent + `</${DEFAULT_ANDROID.CONSTRAINT}>\n`;
}
function getRelativeTemplate(item, depth) {
    var indent = setIndent(depth);
    item.androidTagName = DEFAULT_ANDROID.RELATIVE;
    return indent + `<${DEFAULT_ANDROID.RELATIVE} ID="${item.id}"` +
                    `${displayProperties(getProperties(item, DEFAULT_ANDROID.RELATIVE, true), depth + 1)}>\n` +
                    `{${item.id}}` +
           indent + `</${DEFAULT_ANDROID.RELATIVE}>\n`;
}
function getGridTemplate(item, depth, columnCount = 2) {
    var indent = setIndent(depth);
    item.androidTagName = DEFAULT_ANDROID.GRID;
    return indent + `<${DEFAULT_ANDROID.GRID} android:columnCount="${columnCount}" ID="${item.id}"` +
                    `${displayProperties(getProperties(item, DEFAULT_ANDROID.GRID, true), depth + 1)}>\n` +
                    `{${item.id}}` +
           indent + `</${DEFAULT_ANDROID.GRID}>\n`;
}
function getTagTemplate(item, depth, tagName) {
    item.androidTagName = tagName || getAndroidTagName(item);
    return `${setIndent(depth)}<${item.androidTagName} ID="${item.id}"${displayProperties(getProperties(item, item.androidTagName), depth + 1)} />\n`;
}
function getChildrenDepthLength(item) {
    var index = {};
    item.children.forEach(item => index[item.depth] = true);
    return Object.keys(index).length;
}
function setIndent(n, value = '\t') {
    return value.repeat(n);
}
function withinRange(a, b, n = 1) {
    return (b >= (a - n) && b <= (a + n));
}

var elements = document.querySelectorAll('body *');
var cache = [];
var id = 1;

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
                depth: 0,
                render: false,
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
            if (!itemY.render) {
                var xml = '';
                var tagName = getAndroidTagName(itemY);
                if (tagName == null) {
                    if (itemY.children.length) {
                        if (itemY.children.findIndex(item => (item.depth == itemY.depth + 1) && MAPPING_ANDROID[item.tagName]) == -1) {
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
                                        if (itemY.id == nextAxisX[m].parent.parent.id) {
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
                                for (var l = 0; l < columns.length; l++) {
                                    columns[l].sort((a, b) => {
                                        var [x, y] = [a.bounds.y, b.bounds.y];
                                        if (x == y) {
                                            [x, y] = [a.id, b.id];
                                        }
                                        return (x >= y ? 1 : -1);
                                    });
                                    columnLength = Math.max(columns[l].length, columnLength);
                                }
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
                                    xml += getGridTemplate(itemY, itemY.depth, columns.length);
                                    for (var l = 0; l < columns.length; l++) {
                                        columnStart[l] = Number.MAX_VALUE;
                                        columnEnd[l] = 0;
                                        for (var m = 0; m < columns[l].length; m++) {
                                            var itemX = columns[l][m];
                                            if (!itemX.spacer) {
                                                columnStart[l] = Math.min(itemX.bounds.left, columnStart[l]);
                                                columnEnd[l] = Math.max(itemX.bounds.right, columnEnd[l]);
                                                var prevDepth = itemX.depth;
                                                itemX.depth = itemY.depth + 1;
                                                if (itemX.children.length) {
                                                    var offsetDepth = prevDepth - itemX.depth;
                                                    itemX.children.forEach(item => item.depth -= offsetDepth);
                                                }
                                                itemX.prevParentId = itemX.parent.id;
                                                itemX.parent.render = true;
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
                                    itemY.render = true;
                                }
                            }
                        }
                        if (!itemY.render) {
                            if (coordsX.length == 1 && coordsY.length == 1 && axisX.map(item => item.id).sort().join('') == axisY.map(item => item.id).sort().join('')) {
                                xml += getLinearTemplate(itemY, itemY.depth);
                            }
                            else {
                                xml += getConstraintTemplate(itemY, itemY.depth);
                            }
                            itemY.render = true;
                        }
                    }
                    else if (itemY.element.innerText.trim() != '') {
                        tagName = DEFAULT_ANDROID.TEXT;
                    }
                    else {
                        continue;
                    }
                }
                if (!itemY.render) {
                    var element = itemY.element;
                    if (itemY.parent && itemY.parent.androidTagName == DEFAULT_ANDROID.GRID && itemY.prevParentId) {
                        var prevParent = itemY.parent.children.find(item => item.id == itemY.prevParentId);
                        if (prevParent) {
                            var siblingsPrev = prevParent.children.filter(item => !item.render && prevParent.id == item.parent.id && item.bounds.right <= itemY.bounds.left && item.bounds.left >= itemY.parent.columnStart[itemY.columnIndex]);
                            var siblingsNext = prevParent.children.filter(item => !item.render && prevParent.id == item.parent.id && item.bounds.left >= itemY.bounds.right && item.bounds.right <= itemY.parent.columnEnd[itemY.columnIndex]);
                            if (siblingsNext.length) {
                                itemY.depth++;
                                siblingsNext.unshift(itemY);
                                var partialXml = siblingsNext.map(item => {
                                    item.depth = itemY.depth;
                                    item.prevParentId = item.parent.id;
                                    item.parent = itemY.parent;
                                    item.render = true;
                                    item.siblingsWrap = (item == itemY);
                                    if (item != itemY && item.children.length) {
                                        return getConstraintTemplate(item, itemY.depth);
                                    }
                                    else {
                                        return getTagTemplate(item, itemY.depth);
                                    }
                                }).join('');
                                xml += getConstraintTemplate(itemY, itemY.depth - 1).replace(`{${itemY.id}}`, partialXml);
                            }
                            siblingsPrev.forEach(item => {
                                item.depth = itemY.depth;
                                item.children.forEach(child => child.depth = item.depth + 1);
                                item.prevParentId = item.parent.id;
                                item.parent = itemY.parent;
                                item.render = true;
                                if (item.children.length) {
                                    xml += getConstraintTemplate(item, item.depth);
                                }
                                else {
                                    xml += getTagTemplate(item, item.depth);
                                }
                            });
                        }
                    }
                    if (!itemY.render) {
                        xml += getTagTemplate(itemY, itemY.depth, tagName);
                        itemY.render = true;
                    }
                }
                if (xml != '') {
                    var parentId = (itemY.parent ? itemY.parent.id : 0);
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