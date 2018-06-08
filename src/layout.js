import { WIDGET_ANDROID, BLOCK_CHROME, INLINE_CHROME, MAPPING_CHROME, XMLNS_ANDROID, BUILD_ANDROID, DENSITY_ANDROID } from './lib/constants';
import { API_ANDROID } from './customizations';
import { NODE_CACHE, generateNodeId } from './cache';
import * as Util from './lib/util';
import * as Color from './lib/color';
import * as Element from './lib/element';
import { setConstraints } from './constraint';
import { setResourceStyle, getViewAttributes, writeResourceStringXml, writeResourceArrayXml, writeResourceStyleXml, writeResourceFontXml, writeResourceColorXml, writeResourceDrawableXml } from './resource';
import { renderViewLayout, renderViewTag, insertViewBeforeAfter } from './render';
import Node from './node';
import NodeList from './nodelist';
import parseRTL from './localization';
import SETTINGS from './settings';

function writeFrameLayout(node, parent) {
    return renderViewLayout(node, parent, WIDGET_ANDROID.FRAME);
}

function writeLinearLayout(node, parent, vertical) {
    node.android('orientation', (vertical ? 'vertical' : 'horizontal'));
    return renderViewLayout(node, parent, WIDGET_ANDROID.LINEAR);
}

function writeRelativeLayout(node, parent) {
    return renderViewLayout(node, parent, WIDGET_ANDROID.RELATIVE);
}

function writeConstraintLayout(node, parent) {
    return renderViewLayout(node, parent, WIDGET_ANDROID.CONSTRAINT);
}

function writeGridLayout(node, parent, columnCount) {
    node.android('columnCount', columnCount);
    return renderViewLayout(node, parent, WIDGET_ANDROID.GRID);
}

function writeDefaultLayout(node, parent) {
    if (SETTINGS.useConstraintLayout || node.flex.enabled) {
        return writeConstraintLayout(node, parent);
    }
    else {
        return writeRelativeLayout(node, parent);
    }
}

function setInlineAttributes(output) {
    const namespaces = {};
    for (const node of NODE_CACHE.visible) {
        node.setAndroidDimensions();
        node.namespaces.forEach(value => namespaces[value] = true);
        output = output.replace(`{@${node.id}}`, getViewAttributes(node));
    }
    return output.replace('{@0}', Object.keys(namespaces).sort().map(value => `\n\t${XMLNS_ANDROID[value.toUpperCase()]}`).join(''));
}

function setStyleMap() {
    for (const styleSheet of document.styleSheets) {
        for (const rule of styleSheet.rules) {
            const elements = document.querySelectorAll(rule.selectorText);
            const attributes = new Set();
            for (const i of rule.styleMap) {
                attributes.add(Util.hyphenToCamelCase(i[0]));
            }
            for (const element of elements) {
                for (const i of element.style) {
                    attributes.add(Util.hyphenToCamelCase(i));
                }
                const style = getComputedStyle(element);
                const styleMap = {};
                for (const name of attributes) {
                    if (name.toLowerCase().indexOf('color') != -1) {
                        const color = Color.getByColorName(rule.style[name]);
                        if (color != null) {
                            rule.style[name] = Color.convertRGB(color);
                        }
                    }
                    if (Util.hasValue(element.style[name])) {
                        styleMap[name] = element.style[name];
                    }
                    else if (style[name] == rule.style[name]) {
                        styleMap[name] = style[name];
                    }
                }
                if (element.styleMap != null) {
                    Object.assign(element.styleMap, styleMap);
                }
                else {
                    element.styleMap = styleMap;
                }
            }
        }
    }
}

function setAccessibility() {
    for (const node of NODE_CACHE.visible) {
        switch (node.widgetName) {
            case WIDGET_ANDROID.EDIT:
                let parent = node.renderParent;
                let current = node;
                let label = null;
                while (parent != null && typeof parent == 'object') {
                    const index = parent.renderChildren.findIndex(item => item == current);
                    if (index > 0) {
                        label = parent.renderChildren[index - 1];
                        break;
                    }
                    current = parent;
                    parent = parent.renderParent;
                }
                if (label != null && label.is(WIDGET_ANDROID.TEXT)) {
                    label.android('labelFor', node.stringId);
                }
            case WIDGET_ANDROID.SPINNER:
            case WIDGET_ANDROID.CHECKBOX:
            case WIDGET_ANDROID.RADIO:
            case WIDGET_ANDROID.BUTTON:
                node.android('focusable', 'true');
                break;
        }
    }
}

function setMarginPadding() {
    for (const node of NODE_CACHE) {
        if (node.is(WIDGET_ANDROID.LINEAR, WIDGET_ANDROID.RADIO_GROUP)) {
            switch (node.android('orientation')) {
                case 'horizontal':
                    let left = node.box.left;
                    node.renderChildren.sortAsc('linear.left').forEach(item => {
                        if (!item.floating) {
                            const width = Math.ceil(item.linear.left - left);
                            if (width >= 1) {
                                item.modifyBox('layout_marginLeft', width);
                            }
                        }
                        left = (item.label || item).linear.right;
                    });
                    break;
                case 'vertical':
                    let top = node.box.top;
                    node.renderChildren.sortAsc('linear.top').forEach(item => {
                        const height = Math.ceil(item.linear.top - top);
                        if (height >= 1) {
                            item.modifyBox('layout_marginTop', height);
                        }
                        top = item.linear.bottom;
                    });
                    break;
            }
        }
        if (SETTINGS.targetAPI >= BUILD_ANDROID.OREO) {
            if (node.visible) {
                const marginLeft_RTL = parseRTL('layout_marginLeft');
                const marginRight_RTL = parseRTL('layout_marginRight');
                const paddingLeft_RTL = parseRTL('paddingLeft');
                const paddingRight_RTL = parseRTL('paddingRight');
                const marginTop = Util.convertInt(node.android('layout_marginTop'));
                const marginRight = Util.convertInt(node.android(marginRight_RTL));
                const marginBottom = Util.convertInt(node.android('layout_marginBottom'));
                const marginLeft = Util.convertInt(node.android(marginLeft_RTL));
                if (marginTop != 0 && marginTop == marginBottom && marginBottom == marginLeft && marginLeft == marginRight) {
                    node.delete('android', 'layout_margin*')
                        .android('layout_margin', Util.formatPX(marginTop));
                }
                else {
                    if (marginTop != 0 && marginTop == marginBottom) {
                        node.delete('android', 'layout_marginTop', 'layout_marginBottom')
                            .android('layout_marginVertical', Util.formatPX(marginTop));
                    }
                    if (marginLeft != 0 && marginLeft == marginRight) {
                        node.delete('android', marginLeft_RTL, marginRight_RTL)
                            .android('layout_marginHorizontal', Util.formatPX(marginLeft));
                    }
                }
                const paddingTop = Util.convertInt(node.android('paddingTop'));
                const paddingRight = Util.convertInt(node.android(paddingRight_RTL));
                const paddingBottom = Util.convertInt(node.android('paddingBottom'));
                const paddingLeft = Util.convertInt(node.android(paddingLeft_RTL));
                if (paddingTop != 0 && paddingTop == paddingBottom && paddingBottom == paddingLeft && paddingLeft == paddingRight) {
                    node.delete('android', 'padding*')
                        .android('padding', Util.formatPX(paddingTop));
                }
                else {
                    if (paddingTop != 0 && paddingTop == paddingBottom) {
                        node.delete('android', 'paddingTop', 'paddingBottom')
                            .android('paddingVertical', Util.formatPX(paddingTop));
                    }
                    if (paddingLeft != 0 && paddingLeft == paddingRight) {
                        node.delete('android', paddingLeft_RTL, paddingRight_RTL)
                            .android('paddingHorizontal', Util.formatPX(paddingLeft));
                    }
                }
            }
        }
    }
}

function setLayoutWeight() {
    for (const node of NODE_CACHE) {
        const rows = node.linearRows;
        if (rows.length > 1) {
            const columnLength = rows[0].renderChildren.length;
            if (rows.reduce((a, b) => (a && a == b.renderChildren.length ? a: 0), columnLength) > 0) {
                const horizontal = !node.horizontal;
                const columnDimension = new Array(columnLength).fill(Number.MIN_VALUE);
                for (const row of rows) {
                    for (let i = 0; i < row.renderChildren.length; i++) {
                        columnDimension[i] = Math.max(row.renderChildren[i].linear[(horizontal ? 'width' : 'height')], columnDimension[i]);
                    }
                }
                const total = columnDimension.reduce((a, b) => a + b);
                const percent = columnDimension.map(value => Math.floor((value * 100) / total));
                percent[percent.length - 1] += 100 - percent.reduce((a, b) => a + b);
                for (const row of rows) {
                    for (let i = 0; i < row.renderChildren.length; i++) {
                        const column = row.renderChildren[i];
                        column
                            .android(`layout_${(horizontal ? 'width' : 'height')}`, '0px')
                            .android('layout_weight', (percent[i] / 100).toFixed(2));
                    }
                }
            }
        }
    }
}

function createNode(element) {
    if (Element.isVisible(element)) {
        const node = new Node(generateNodeId(), element, SETTINGS.targetAPI);
        NODE_CACHE.push(node);
    }
}

function setNodeCache(element) {
    let nodeTotal = 0;
    (element || document.body).childNodes.forEach(element => {
        if (element.nodeName == '#text') {
            if (element.textContent.trim() != '') {
                nodeTotal++;
            }
        }
        else {
            if (Element.isVisible(element)) {
                nodeTotal++;
            }
        }
    });
    const elements = (element != null ? element.querySelectorAll('*') : document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *')));
    if (element != null) {
        createNode(element);
    }
    for (const i in elements) {
        if (INLINE_CHROME.includes(elements[i].tagName) && (MAPPING_CHROME[elements[i].parentNode.tagName] != null || INLINE_CHROME.includes(elements[i].parentNode.tagName))) {
            continue;
        }
        createNode(elements[i]);
    }
    const preAlignment = {};
    for (const node of NODE_CACHE) {
        preAlignment[node.id] = {};
        const style = preAlignment[node.id];
        switch (node.style.textAlign) {
            case 'center':
            case 'right':
            case 'end':
                style.textAlign = node.style.textAlign;
                node.element.style.textAlign = '';
                break;
        }
        style.verticalAlign = node.styleMap.verticalAlign || '';
        node.element.style.verticalAlign = 'top';
        if (node.overflow != 0) {
            if (Util.hasValue(node.styleMap.width)) {
                style.width = node.styleMap.width;
                node.element.style.width = '';
            }
            if (Util.hasValue(node.styleMap.height)) {
                style.height = node.styleMap.height;
                node.element.style.height = '';
            }
            style.overflow = node.style.overflow;
            node.element.style.overflow = 'visible';
        }
    }
    const parentNodes = {};
    const textNodes = new NodeList();
    for (const parent of NODE_CACHE) {
        if (parent.bounds == null) {
            parent.setBounds();
        }
        for (const child of NODE_CACHE) {
            if (parent != child) {
                if (child.bounds == null) {
                    child.setBounds();
                }
                if ((!child.fixed && child.parentElement == parent.element) || (child.fixed && child.box.left >= parent.linear.left && child.box.right <= parent.linear.right && child.box.top >= parent.linear.top && child.box.bottom <= parent.linear.bottom)) {
                    if (parentNodes[child.id] == null) {
                        parentNodes[child.id] = [];
                    }
                    parentNodes[child.id].push(parent);
                    parent.children.push(child);
                }
            }
        }
    }
    for (const node of NODE_CACHE) {
        const nodes = parentNodes[node.id];
        if (nodes != null) {
            let parent = node.parentElement.androidNode;
            if (node.fixed) {
                if (nodes.length > 1) {
                    let minArea = Number.MAX_VALUE;
                    for (const current of nodes) {
                        const area = (current.box.left - node.linear.left) + (current.box.right - node.linear.right) + (current.box.top - node.linear.top) + (current.box.bottom - node.linear.bottom);
                        if (area < minArea) {
                            parent = current;
                            minArea = area;
                        }
                        else if (area == minArea) {
                            if (current.element == node.parentElement) {
                                parent = current;
                            }
                        }
                    }
                    node.parent = parent;
                }
                else {
                    node.parent = nodes[0];
                }
            }
            else {
                node.parent = parent;
            }
        }
        if (node.element.children.length > 1) {
            node.element.childNodes.forEach(element => {
                if (element.nodeName == '#text' && element.textContent.trim() != '') {
                    const textNode = Node.createTextNode(generateNodeId() + textNodes.length, element, SETTINGS.targetAPI, node, [0, 4]);
                    textNodes.push(textNode);
                    node.children.push(textNode);
                }
            });
        }
    }
    NODE_CACHE.push(...textNodes);
    for (const node of NODE_CACHE) {
        const style = preAlignment[node.id];
        if (style != null) {
            for (const attr in style) {
                node.element.style[attr] = style[attr];
            }
        }
    }
    Util.sortAsc(NODE_CACHE, 'depth', 'parent.id', 'parentIndex', 'id');
    for (const node of NODE_CACHE) {
        let i = 0;
        Array.from(node.element.childNodes).forEach(item => {
            if (item.androidNode != null && item.androidNode.parent.element == node.element) {
                item.androidNode.parentIndex = i++;
            }
        });
        node.children.sortAsc('parentIndex');
    }
}

export function parseDocument(element) {
    if (typeof element == 'string') {
        element = document.getElementById(element);
    }
    let output = `<?xml version="1.0" encoding="utf-8"?>\n{0}`;
    const mapX = [];
    const mapY = [];
    setStyleMap();
    setNodeCache(element);
    for (const node of NODE_CACHE) {
        const x = Math.floor(node.bounds.x);
        const y = node.parent.id;
        if (mapX[node.depth] == null) {
            mapX[node.depth] = {};
        }
        if (mapY[node.depth] == null) {
            mapY[node.depth] = {};
        }
        if (mapX[node.depth][x] == null) {
            mapX[node.depth][x] = new NodeList();
        }
        if (mapY[node.depth][y] == null) {
            mapY[node.depth][y] = new NodeList();
        }
        mapX[node.depth][x].push(node);
        mapY[node.depth][y].push(node);
    }
    for (let i = 0; i < mapY.length; i++) {
        const coordsY = Object.keys(mapY[i]);
        const partial = new Map();
        for (let j = 0; j < coordsY.length; j++) {
            const axisY = [];
            const layers = [];
            for (const node of mapY[i][coordsY[j]]) {
                switch (node.style.position) {
                    case 'absolute':
                    case 'relative':
                    case 'fixed':
                        layers.push(node);
                        break;
                    default:
                        axisY.push(node);
                }
            }
            axisY.sort((a, b) => {
                if (!a.parent.flex.enabled && !b.parent.flex.enabled && a.withinX(b.linear)) {
                    return (a.linear.left > b.linear.left ? 1 : -1);
                }
                return (a.parentIndex > b.parentIndex ? 1 : -1);
            });
            axisY.push(...Util.sortAsc(layers, 'style.zIndex', 'parentIndex'));
            for (let k = 0; k < axisY.length; k++) {
                const nodeY = axisY[k];
                if (!nodeY.renderParent) {
                    const parent = nodeY.parent;
                    let tagName = nodeY.widgetName;
                    let restart = false;
                    let xml = '';
                    if (tagName == null) {
                        if ((nodeY.children.length == 0 && Element.hasFreeFormText(nodeY.element)) || nodeY.children.every(item => INLINE_CHROME.includes(item.tagName))) {
                            tagName = WIDGET_ANDROID.TEXT;
                        }
                        else if (nodeY.children.length > 0) {
                            const rows = nodeY.children;
                            if (SETTINGS.useGridLayout && !nodeY.flex.enabled && rows.length > 1 && rows.every(item => !item.flex.enabled && (BLOCK_CHROME.includes(item.tagName) && item.children.length > 0))) {
                                let columns = [];
                                let columnEnd = [];
                                if (SETTINGS.useLayoutWeight) {
                                    const dimensions = [];
                                    for (let l = 0; l < rows.length; l++) {
                                        const children = rows[l].children;
                                        dimensions[l] = [];
                                        for (let m = 0; m < children.length; m++) {
                                            dimensions[l].push(children[m].bounds.width);
                                        }
                                        columns.push(children);
                                    }
                                    const base = columns[
                                        dimensions.findIndex(item => {
                                            return (item == dimensions.reduce((a, b) => {
                                                if (a.length == b.length) {
                                                    return (a.reduce((c, d) => c + d, 0) < b.reduce((c, d) => c + d, 0) ? a : b);
                                                }
                                                else {
                                                    return (a.length < b.length ? a : b);
                                                }
                                            }));
                                        })];
                                    if (base.length > 1) {
                                        let maxIndex = -1;
                                        let assigned = [];
                                        let every = false;
                                        for (let l = 0; l < base.length; l++) {
                                            const bounds = base[l].bounds;
                                            const found = [];
                                            if (l < base.length - 1) {
                                                for (let m = 0; m < columns.length; m++) {
                                                    if (columns[m] == base) {
                                                        found.push(l);
                                                    }
                                                    else {
                                                        const index = columns[m].findIndex((item, index) => (index >= l && item.bounds.width == bounds.width && index < columns[m].length - 1));
                                                        if (index != -1) {
                                                            found.push(index);
                                                        }
                                                        else {
                                                            found.length = 0;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                            else {
                                                for (let m = 0; m < columns.length; m++) {
                                                    if (columns[m].length > base.length) {
                                                        const removed = columns[m].splice(assigned[m] + (every ? 2 : 1), columns[m].length - base.length);
                                                        columns[m][assigned[m] + (every ? 1 : 0)].gridSiblings = [...removed];
                                                    }
                                                }
                                            }
                                            if (found.length == columns.length) {
                                                const minIndex = found.reduce((a, b) => Math.min(a, b));
                                                maxIndex = found.reduce((a, b) => Math.max(a, b));
                                                if (maxIndex > minIndex) {
                                                    for (let m = 0; m < columns.length; m++) {
                                                        if (found[m] > minIndex) {
                                                            const removed = columns[m].splice(minIndex, found[m] - minIndex);
                                                            columns[m][assigned[m]].gridSiblings = [...removed];
                                                        }
                                                    }
                                                }
                                                assigned = found;
                                                every = true;
                                            }
                                            else {
                                                assigned = new Array(columns.length).fill(l);
                                                every = false;
                                            }
                                        }
                                    }
                                    else {
                                        columns.length = 0;
                                    }
                                }
                                else {
                                    const nextMapX = mapX[nodeY.depth + 2];
                                    const nextCoordsX = (nextMapX ? Object.keys(nextMapX) : []);
                                    if (nextCoordsX.length > 1) {
                                        const columnRight = [];
                                        for (let l = 0; l < nextCoordsX.length; l++) {
                                            const nextAxisX = nextMapX[nextCoordsX[l]].sortAsc('bounds.top');
                                            columnRight[l] = (l == 0 ? Number.MIN_VALUE : columnRight[l - 1]);
                                            for (let m = 0; m < nextAxisX.length; m++) {
                                                const nextX = nextAxisX[m];
                                                if (nextX.parent.parent != null && nodeY.id == nextX.parent.parent.id) {
                                                    const [left, right] = [nextX.bounds.left, nextX.bounds.right];
                                                    if (l == 0 || left >= columnRight[l - 1]) {
                                                        if (columns[l] == null) {
                                                            columns[l] = [];
                                                        }
                                                        columns[l].push(nextX);
                                                    }
                                                    columnRight[l] = Math.max(right, columnRight[l]);
                                                }
                                            }
                                        }
                                        for (let l = 0, m = -1; l < columnRight.length; l++) {
                                            if (m == -1 && columns[l] == null) {
                                                m = l - 1;
                                            }
                                            else if (columns[l] == null) {
                                                if (m != -1 && l == columnRight.length - 1) {
                                                    columnRight[m] = columnRight[l];
                                                }
                                                continue;
                                            }
                                            else if (m != -1) {
                                                columnRight[m] = columnRight[l - 1];
                                                m = -1;
                                            }
                                        }
                                        for (let l = 0; l < columns.length; l++) {
                                            if (columns[l] != null) {
                                                columnEnd.push(columnRight[l]);
                                            }
                                        }
                                        columns = columns.filter(item => item);
                                        const columnLength = columns.reduce((a, b) => Math.max(a, b.length), 0);
                                        for (let l = 0; l < columnLength; l++) {
                                            let top = null;
                                            for (let m = 0; m < columns.length; m++) {
                                                const nodeX = columns[m][l];
                                                if (nodeX != null) {
                                                    if (top == null) {
                                                        top = nodeX.bounds.top;
                                                    }
                                                    else if (nodeX.bounds.top != top) {
                                                        const nextRowX = columns[m - 1][l + 1];
                                                        if (columns[m][l - 1] == null || (nextRowX != null && nextRowX.bounds.top == nodeX.bounds.top)) {
                                                            columns[m].splice(l, 0, { spacer: 1 });
                                                        }
                                                        else if (columns[m][l + 1] == null) {
                                                            columns[m][l + 1] = nodeX;
                                                            columns[m][l] = { spacer: 1 };
                                                        }
                                                    }
                                                }
                                                else {
                                                    columns[m].splice(l, 0, { spacer: 1 });
                                                }
                                            }
                                        }
                                    }
                                }
                                if (columns.length > 1) {
                                    nodeY.gridColumnEnd = columnEnd;
                                    nodeY.gridColumnSpan = (SETTINGS.useLayoutWeight ? columns[0].length : columns.length);
                                    xml += writeGridLayout(nodeY, parent, nodeY.gridColumnSpan);
                                    for (let l = 0, count = 0; l < columns.length; l++) {
                                        let spacer = 0;
                                        for (let m = 0, start = 0; m < columns[l].length; m++) {
                                            const node = columns[l][m];
                                            if (!node.spacer) {
                                                node.parent.hide();
                                                node.parent = nodeY;
                                                if (SETTINGS.useLayoutWeight) {
                                                    node.gridRowStart = (m == 0);
                                                    node.gridRowEnd = (m == columns[l].length - 1);
                                                    node.gridFirst = (l == 0 && m == 0);
                                                    node.gridLast = (l == columns.length - 1 && node.gridRowEnd);
                                                    node.gridIndex = m;
                                                }
                                                else {
                                                    let rowSpan = 1;
                                                    let columnSpan = 1 + spacer;
                                                    for (let n = l + 1; n < columns.length; n++) {
                                                        if (columns[n][m].spacer == 1) {
                                                            columnSpan++;
                                                            columns[n][m].spacer = 2;
                                                        }
                                                        else {
                                                            break;
                                                        }
                                                    }
                                                    if (columnSpan == 1) {
                                                        for (let n = m + 1; n < columns[l].length; n++) {
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
                                                        node.android('layout_rowSpan', rowSpan);
                                                    }
                                                    if (columnSpan > 1) {
                                                        node.android('layout_columnSpan', columnSpan);
                                                    }
                                                    node.gridRowStart = (start++ == 0);
                                                    node.gridRowEnd = (columnSpan + l == columns.length);
                                                    node.gridFirst = (count++ == 0);
                                                    node.gridLast = (node.gridRowEnd && m == columns[l].length - 1);
                                                    node.gridIndex = l;
                                                    spacer = 0;
                                                }
                                            }
                                            else if (node.spacer == 1) {
                                                spacer++;
                                            }
                                        }
                                    }
                                }
                            }
                            if (!nodeY.renderParent) {
                                const [linearX, linearY] = [nodeY.children.linearX, nodeY.children.linearY];
                                if (!nodeY.flex.enabled && linearX && linearY) {
                                    xml += writeFrameLayout(nodeY, parent);
                                }
                                else if ((!nodeY.flex.enabled || nodeY.children.every(item => item.flex.enabled)) && (linearX || linearY)) {
                                    xml += writeLinearLayout(nodeY, parent, linearY);
                                }
                                else {
                                    xml += writeDefaultLayout(nodeY, parent);
                                }
                            }
                        }
                        else {
                            continue;
                        }
                    }
                    if (!nodeY.renderParent) {
                        if (parent.is(WIDGET_ANDROID.GRID)) {
                            let siblings = null;
                            if (SETTINGS.useLayoutWeight) {
                                siblings = new NodeList(nodeY.gridSiblings);
                            }
                            else {
                                const columnEnd = parent.gridColumnEnd[nodeY.gridIndex + (nodeY.android('layout_columnSpan') || 1) - 1];
                                siblings = nodeY.parentOriginal.children.filter(item => !item.renderParent && item.bounds.left >= nodeY.bounds.right && item.bounds.right <= columnEnd);
                            }
                            if (siblings.length > 0) {
                                siblings.unshift(nodeY);
                                siblings.sortAsc('bounds.x');
                                const renderParent = parent;
                                const wrapNode = Node.createWrapNode(generateNodeId(), nodeY, SETTINGS.targetAPI, parent, siblings, [0]);
                                NODE_CACHE.push(wrapNode);
                                const rowSpan = nodeY.android('layout_rowSpan');
                                const columnSpan = nodeY.android('layout_columnSpan');
                                if (rowSpan > 1) {
                                    nodeY.delete('android', 'layout_rowSpan');
                                    wrapNode.android('layout_rowSpan', rowSpan);
                                }
                                if (columnSpan > 1) {
                                    nodeY.delete('android', 'layout_columnSpan');
                                    wrapNode.android('layout_columnSpan', columnSpan);
                                }
                                for (const node of siblings) {
                                    node.parent = wrapNode;
                                    wrapNode.inheritGrid(node);
                                }
                                wrapNode.setBounds();
                                if (siblings.linearX || siblings.linearY) {
                                    xml += writeLinearLayout(wrapNode, renderParent, siblings.linearY);
                                }
                                else {
                                    xml += writeDefaultLayout(wrapNode, renderParent);
                                }
                                k--;
                                restart = true;
                            }
                        }
                        if (!nodeY.renderParent && !restart) {
                            xml += renderViewTag(nodeY, parent, tagName);
                        }
                    }
                    if (xml != '') {
                        if (!partial.has(parent.id)) {
                            partial.set(parent.id, []);
                        }
                        partial.get(parent.id).push(xml);
                    }
                }
            }
        }
        for (const [id, views] of partial.entries()) {
            output = output.replace(`{${id}}`, views.join(''));
        }
    }
    setResourceStyle(NODE_CACHE);
    if (SETTINGS.showAttributes) {
        setMarginPadding();
        if (SETTINGS.useLayoutWeight) {
            setLayoutWeight();
        }
        setAccessibility();
        setConstraints();
        output = setInlineAttributes(output);
    }
    output = insertViewBeforeAfter(output);
    output = output.replace(/{[<@>]{1}[0-9]+}/g, '');
    if (SETTINGS.useUnitDP) {
        output = Util.replaceDP(output, SETTINGS.density);
    }
    return output;
}

export const settings = SETTINGS;
export { BUILD_ANDROID, DENSITY_ANDROID, API_ANDROID };
export { writeResourceStringXml, writeResourceArrayXml, writeResourceStyleXml, writeResourceFontXml, writeResourceColorXml, writeResourceDrawableXml };