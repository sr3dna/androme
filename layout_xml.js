var DEFAULT_ANDROID = {
    TEXT: 'TextView',
    LINEAR: 'LinearLayout',
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

function getProperties(element, tagName) {
    var properties = PROPERTIES_ANDROID[tagName];
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
            var subproperties = getProperties(nextElement, MAPPING_ANDROID[nextElement.tagName]);
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
    return (item.parent && item.parent.androidTagName == DEFAULT_ANDROID.RELATIVE);
}
function getAndroidTagName(item) {
    var result = MAPPING_ANDROID[item.tagName];
    if (typeof result == 'object') {
        result = result[item.element.type];
    }
    return result;
}
function getLinearTemplate(id, depth) {
    var indent = setIndent(depth);
    return indent + `<${DEFAULT_ANDROID.LINEAR} ID="${id}">\n` +
                    `{${id}}` +
           indent + `</${DEFAULT_ANDROID.LINEAR}>\n`;
}
function getRelativeTemplate(id, depth) {
    var indent = setIndent(depth);
    return indent + `<${DEFAULT_ANDROID.RELATIVE} ID="${id}">\n` +
                    `{${id}}` +
           indent + `</${DEFAULT_ANDROID.RELATIVE}>\n`;
}
function getGridTemplate(id, depth, columnCount) {
    var indent = setIndent(depth);
    return indent + `<${DEFAULT_ANDROID.GRID} android:layout_width="match_parent" android:layout_height="wrap_content" android:columnCount="${columnKeys.length}" ID="${id}">\n` +
                    `{${id}}` +
           indent + `</${DEFAULT_ANDROID.GRID}>\n`;
}
function getTagTemplate(tagName, item, depth) {
    return `${setIndent(depth)}<${tagName} ID="${item.id}"${displayProperties(getProperties(item.element, tagName), depth + 1)} />\n`;
}
function getChildrenDepthLength(item) {
    var index = {};
    item.children.forEach(item => index[item.depth] = true);
    return Object.keys(index).length;
}
function setIndent(n, value = '\t') {
    return value.repeat(n);
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
                tagName: element.tagName.toUpperCase(),
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
                        var nextMapX = mapX[itemY.depth + 2];
                        var nextCoordsX = (nextMapX ? Object.keys(nextMapX) : []);
                        if (nextCoordsX.length > 1) {
                            var columns = [];
                            var columnKeys = [];
                            var columnCount = 0;
                            for (var l = 0; l < nextCoordsX.length; l++) {
                                var nextAxisX = nextMapX[nextCoordsX[l]];
                                for (var m = 0; m < nextAxisX.length; m++) {
                                    if (itemY.id == nextAxisX[m].parent.parent.id) {
                                        if (columns[l] == null) {
                                            if (l != 0 && columns[l - 1] == null) {
                                                break;
                                            }
                                            columns[l] = [];
                                        }
                                        columns[l].push(nextAxisX[m]);
                                    }
                                }
                            }
                            var columnLength = 0;
                            for (var l in columns) {
                                if (columns[l].length > 1) {
                                    if (!columnKeys.length) {
                                        columnLength = columns[l].length;
                                        columnKeys.push(l);
                                    }
                                    else if (columns[l].length == columnLength) {
                                        columnKeys.push(l);
                                    }
                                }
                                else {
                                    break;
                                }
                            }
                            if (columnKeys.length > 1) {
                                xml += getGridTemplate(itemY.id, itemY.depth, columnCount);
                                for (var l = 0; l < columnKeys.length; l++) {
                                    var key = columnKeys[l];
                                    for (var m = 0; m < columns[key].length; m++) {
                                        var columnX = columns[key][m];
                                        var prevDepth = columnX.depth;
                                        columnX.parent.render = true;
                                        columnX.depth = itemY.depth + 1;
                                        if (columnX.children.length) {
                                            var offsetDepth = prevDepth - columnX.depth;
                                            columnX.children.forEach(item => item.depth -= offsetDepth);
                                        }
                                        columnX.columnIndex = l;
                                        columnX.prevParentId = columnX.parent.id;
                                        columnX.parent = itemY;
                                    }
                                }
                                tagName = DEFAULT_ANDROID.GRID;
                                itemY.render = true;
                                itemY.columnCount = columnKeys.length;
                            }
                        }
                        if (tagName == null) {
                            if (coordsX.length == 1 && coordsY.length == 1 && axisX.map(item => item.id).sort().join('') == axisY.map(item => item.id).sort().join('')) {
                                xml += getLinearTemplate(itemY.id, itemY.depth);
                                tagName = DEFAULT_ANDROID.LINEAR;
                            }
                            else {
                                xml += getRelativeTemplate(itemY.id, itemY.depth);
                                tagName = DEFAULT_ANDROID.RELATIVE;
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
                    if (itemY.parent && itemY.parent.androidTagName == DEFAULT_ANDROID.GRID && itemY.prevParentId && itemY.parent.columnCount == itemY.columnIndex + 1) {
                        var actualParent = itemY.parent.children.find(item => item.id == itemY.prevParentId);
                        if (actualParent) {
                            var siblings = actualParent.children.filter(item => actualParent.id == item.parent.id);
                            if (siblings.length) {
                                itemY.depth++;
                                siblings.unshift(itemY);
                                var partialXml = siblings.map(item => {
                                    item.depth = itemY.depth;
                                    item.prevParentId = item.parent.id;
                                    item.parent = itemY.parent;
                                    item.render = true;
                                    if (item != itemY && item.children.length) {
                                        return getRelativeTemplate(item.id, itemY.depth);
                                    }
                                    else {
                                        return getTagTemplate(getAndroidTagName(item), item, itemY.depth);
                                    }
                                }).join('');
                                xml += getRelativeTemplate(itemY.id, itemY.depth - 1).replace(`{${itemY.id}}`, partialXml);
                            }
                        }
                    }
                    if (!itemY.render) {
                        xml += getTagTemplate(tagName, itemY, itemY.depth);
                        itemY.render = true;
                    }
                }
                if (xml != '') {
                    var parentId = (itemY.parent ? itemY.parent.id : 0);
                    if (partial[parentId] == null) {
                        partial[parentId] = '';
                    }
                    partial[parentId] += xml;
                    itemY.androidTagName = tagName;
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