import { BLOCK_CHROME, BUILD_ANDROID, DENSITY_ANDROID, INLINE_CHROME, MAPPING_CHROME, OVERFLOW_CHROME, WIDGET_ANDROID } from './lib/constants';
import Widget from './android/widget';
import WidgetList from './android/widgetlist';
import Layout from './android/layout';
import { hasValue, hyphenToCamelCase, formatPX, replaceDP, sortAsc } from './lib/util';
import { convertRGB, getByColorName } from './lib/color';
import { hasFreeFormText, isVisible } from './lib/dom';
import NODE_CACHE from './cache';
import { setResourceStyle, writeResourceArrayXml, writeResourceColorXml, writeResourceDrawableXml, writeResourceFontXml, writeResourceStringXml, writeResourceStyleXml } from './resource';
import { setConstraints } from './constraint';
import { insertViewBeforeAfter, setInlineAttributes, writeFrameLayout, writeLinearLayout, writeGridLayout, writeDefaultLayout, writeViewTag } from './render';
import API_ANDROID from './android/customizations';
import SETTINGS from './settings';

function setStyleMap() {
    for (const styleSheet of Array.from(document.styleSheets) as any) {
        for (const rule of styleSheet.rules) {
            const elements = document.querySelectorAll(rule.selectorText);
            const attributes = new Set();
            for (const style of rule.styleMap) {
                attributes.add(hyphenToCamelCase(style[0]));
            }
            for (const element of Array.from(elements)) {
                for (const attr of element.style) {
                    attributes.add(hyphenToCamelCase(attr));
                }
                const style = getComputedStyle(element);
                const styleMap = {};
                for (const name of attributes) {
                    if (name.toLowerCase().indexOf('color') !== -1) {
                        const color = getByColorName(rule.style[name]);
                        if (color != null) {
                            rule.style[name] = convertRGB(color);
                        }
                    }
                    if (hasValue(element.style[name])) {
                        styleMap[name] = element.style[name];
                    }
                    else if (style[name] === rule.style[name]) {
                        styleMap[name] = style[name];
                    }
                }
                if (element.__styleMap != null) {
                    Object.assign(element.__styleMap, styleMap);
                }
                else {
                    element.__styleMap = styleMap;
                }
            }
        }
    }
}

function setMarginPadding() {
    for (const node of NODE_CACHE as Widget[]) {
        if (node.is(WIDGET_ANDROID.LINEAR, WIDGET_ANDROID.RADIO_GROUP)) {
            switch (node.android('orientation')) {
                case 'horizontal':
                    let left = node.box.left;
                    sortAsc(node.renderChildren, 'linear.left').forEach((item: Widget) => {
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
                    sortAsc(node.renderChildren, 'linear.top').forEach((item: Widget) => {
                        const height = Math.ceil(item.linear.top - top);
                        if (height >= 1) {
                            item.modifyBox('layout_marginTop', height);
                        }
                        top = item.linear.bottom;
                    });
                    break;
            }
        }
    }
}

function setLayoutWeight() {
    for (const node of NODE_CACHE as Widget[]) {
        const rows = node.linearRows;
        if (rows.length > 1) {
            const columnLength = rows[0].renderChildren.length;
            if (rows.every((item: Widget) => item.renderChildren.length === columnLength)) {
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

function insertNode(element: HTMLElement, parent?: Widget) {
    let node: Widget = null;
    switch (element.nodeName) {
        case '#text':
            if (element.textContent.trim() !== '') {
                node = new Widget(NODE_CACHE.nextId, SETTINGS.targetAPI, null, { element, parent, actions: [0, 4], tagName: 'TEXT' });
                node.setAndroidId(WIDGET_ANDROID.TEXT);
                node.setBounds(false, element);
                node.inheritStyle(parent);
                parent.children.push(node);
            }
            break;
        default:
            if (isVisible(element)) {
                node = new Widget(NODE_CACHE.nextId, SETTINGS.targetAPI, element);
            }
    }
    if (node != null) {
        NODE_CACHE.push(node);
    }
    return node;
}

function setNodeCache(documentRoot: HTMLElement) {
    let nodeTotal = 0;
    Array.from((documentRoot || document.body).childNodes).forEach((item: HTMLElement) => {
        if (item.nodeName === '#text') {
            if (item.textContent.trim() !== '') {
                nodeTotal++;
            }
        }
        else {
            if (isVisible(item)) {
                nodeTotal++;
            }
        }
    });
    const elements: any = (documentRoot != null ? documentRoot.querySelectorAll('*') : document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *')));
    if (documentRoot != null) {
        const node = insertNode(documentRoot);
        node.parent = new Widget(0, 0);
    }
    for (const i in elements) {
        if (INLINE_CHROME.includes(elements[i].tagName) && (MAPPING_CHROME[elements[i].parentNode.tagName] != null || INLINE_CHROME.includes(elements[i].parentNode.tagName))) {
            continue;
        }
        insertNode(elements[i]);
    }
    const preAlignment = {};
    for (const node of NODE_CACHE as Widget[]) {
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
        if (node.overflow !== OVERFLOW_CHROME.NONE) {
            if (hasValue(node.styleMap.width)) {
                style.width = node.styleMap.width;
                node.element.style.width = '';
            }
            if (hasValue(node.styleMap.height)) {
                style.height = node.styleMap.height;
                node.element.style.height = '';
            }
            style.overflow = node.style.overflow;
            node.element.style.overflow = 'visible';
        }
        node.setBounds();
    }
    const parents = {};
    for (const parent of NODE_CACHE as Widget[]) {
        for (const child of NODE_CACHE as Widget[]) {
            if (parent !== child) {
                if (child.element.parentNode === parent.element) {
                    child.parent = parent;
                    parent.children.push(child);
                }
                if (child.fixed && child.box.left >= parent.linear.left && child.box.right <= parent.linear.right && child.box.top >= parent.linear.top && child.box.bottom <= parent.linear.bottom) {
                    if (parents[child.id] == null) {
                        parents[child.id] = [];
                    }
                    parents[child.id].push(parent);
                }
            }
        }
    }
    for (const node of NODE_CACHE as Widget[]) {
        const nodes: Widget[] = parents[node.id];
        if (nodes != null) {
            nodes.push(<Widget> node.parent);
            let minArea = Number.MAX_VALUE;
            let closest: Widget = null;
            for (const current of nodes) {
                const area = (current.box.left - node.linear.left) + (current.box.right - node.linear.right) + (current.box.top - node.linear.top) + (current.box.bottom - node.linear.bottom);
                if (area < minArea) {
                    closest = current;
                    minArea = area;
                }
                else if (area === minArea) {
                    if (current.element === node.parent.element) {
                        closest = current;
                    }
                }
            }
            if (closest != null) {
                node.parent = closest;
            }
        }
        if (node.element.children && node.element.children.length > 1) {
            Array.from(node.element.childNodes).forEach((element: HTMLElement) => {
                if (element.nodeName === '#text' && element.textContent.trim() !== '') {
                    insertNode(element, node);
                }
            });
        }
    }
    for (const node of NODE_CACHE) {
        const style = preAlignment[node.id];
        if (style != null) {
            for (const attr in style) {
                node.element.style[attr] = style[attr];
            }
        }
    }
    sortAsc(NODE_CACHE, 'depth', 'parent.id', 'parentIndex', 'id');
    for (const node of NODE_CACHE as Widget[]) {
        let i = 0;
        Array.from(node.element.childNodes).forEach((element: any) => {
            if (element.__node != null && (element.__node.parent.element === node.element)) {
                element.__node.parentIndex = i++;
            }
        });
        sortAsc(node.children, 'parentIndex');
    }
}

export function parseDocument(element?: any) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    let output = `<?xml version="1.0" encoding="utf-8"?>\n{0}`;
    const mapX = [];
    const mapY = [];
    setStyleMap();
    setNodeCache(element);
    for (const node of NODE_CACHE as Widget[]) {
        const x = Math.floor(node.bounds.x);
        const y = node.parent.id;
        if (mapX[node.depth] == null) {
            mapX[node.depth] = {};
        }
        if (mapY[node.depth] == null) {
            mapY[node.depth] = {};
        }
        if (mapX[node.depth][x] == null) {
            mapX[node.depth][x] = new WidgetList();
        }
        if (mapY[node.depth][y] == null) {
            mapY[node.depth][y] = new WidgetList();
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
            axisY.push(...sortAsc(layers, 'style.zIndex', 'parentIndex'));
            for (let k = 0; k < axisY.length; k++) {
                const nodeY = axisY[k];
                if (!nodeY.renderParent) {
                    const parent = nodeY.parent;
                    let tagName = nodeY.nodeName;
                    let restart = false;
                    let xml = '';
                    if (tagName == null) {
                        if ((nodeY.children.length === 0 && hasFreeFormText(nodeY.element)) || nodeY.children.every((item: Widget) => INLINE_CHROME.includes(item.tagName))) {
                            tagName = WIDGET_ANDROID.TEXT;
                        }
                        else if (nodeY.children.length > 0) {
                            const rows = nodeY.children;
                            if (SETTINGS.useGridLayout && !nodeY.flex.enabled && rows.length > 1 && rows.every((item: Widget) => !item.flex.enabled && (BLOCK_CHROME.includes(item.tagName) && item.children.length > 0))) {
                                let columns: any[][] = [];
                                const columnEnd = [];
                                if (SETTINGS.useLayoutWeight) {
                                    const dimensions: number[][] = [];
                                    for (let l = 0; l < rows.length; l++) {
                                        const children = rows[l].children;
                                        dimensions[l] = [];
                                        for (let m = 0; m < children.length; m++) {
                                            dimensions[l].push(children[m].bounds.width);
                                        }
                                        columns.push(children);
                                    }
                                    const base = columns[
                                        dimensions.findIndex((item: number[]) => {
                                            return (item === dimensions.reduce((a: number[], b: number[]) => {
                                                if (a.length === b.length) {
                                                    return (a.reduce((c: number, d: number) => c + d, 0) < b.reduce((c: number, d: number) => c + d, 0) ? a : b);
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
                                                    if (columns[m] === base) {
                                                        found.push(l);
                                                    }
                                                    else {
                                                        const result = columns[m].findIndex((item: Widget, index: number) => (index >= l && item.bounds.width === bounds.width && index < columns[m].length - 1));
                                                        if (result !== -1) {
                                                            found.push(result);
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
                                            if (found.length === columns.length) {
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
                                        const columnRight: number[] = [];
                                        for (let l = 0; l < nextCoordsX.length; l++) {
                                            const nextAxisX = nextMapX[nextCoordsX[l]].sortAsc('bounds.top');
                                            columnRight[l] = (l === 0 ? Number.MIN_VALUE : columnRight[l - 1]);
                                            for (let m = 0; m < nextAxisX.length; m++) {
                                                const nextX = nextAxisX[m];
                                                if (nextX.parent.parent && nodeY.id === nextX.parent.parent.id) {
                                                    const [left, right] = [nextX.bounds.left, nextX.bounds.right];
                                                    if (l === 0 || left >= columnRight[l - 1]) {
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
                                            if (m === -1 && columns[l] == null) {
                                                m = l - 1;
                                            }
                                            else if (columns[l] == null) {
                                                if (m !== -1 && l === columnRight.length - 1) {
                                                    columnRight[m] = columnRight[l];
                                                }
                                                continue;
                                            }
                                            else if (m !== -1) {
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
                                            let top: number = null;
                                            for (let m = 0; m < columns.length; m++) {
                                                const nodeX = columns[m][l];
                                                if (nodeX != null) {
                                                    if (top == null) {
                                                        top = nodeX.bounds.top;
                                                    }
                                                    else if (nodeX.bounds.top !== top) {
                                                        const nextRowX = columns[m - 1][l + 1];
                                                        if (columns[m][l - 1] == null || (nextRowX && nextRowX.bounds.top === nodeX.bounds.top)) {
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
                                    nodeY.gridColumnCount = (SETTINGS.useLayoutWeight ? columns[0].length : columns.length);
                                    xml += writeGridLayout(nodeY, parent, nodeY.gridColumnCount);
                                    for (let l = 0, count = 0; l < columns.length; l++) {
                                        let spacer = 0;
                                        for (let m = 0, start = 0; m < columns[l].length; m++) {
                                            const node = columns[l][m];
                                            if (!node.spacer) {
                                                node.parent.hide();
                                                node.parent = nodeY;
                                                if (SETTINGS.useLayoutWeight) {
                                                    node.gridRowStart = (m === 0);
                                                    node.gridRowEnd = (m === columns[l].length - 1);
                                                    node.gridFirst = (l === 0 && m === 0);
                                                    node.gridLast = (l === columns.length - 1 && node.gridRowEnd);
                                                    node.gridIndex = m;
                                                }
                                                else {
                                                    let rowSpan = 1;
                                                    let columnSpan = 1 + spacer;
                                                    for (let n = l + 1; n < columns.length; n++) {
                                                        if (columns[n][m].spacer === 1) {
                                                            columnSpan++;
                                                            columns[n][m].spacer = 2;
                                                        }
                                                        else {
                                                            break;
                                                        }
                                                    }
                                                    if (columnSpan === 1) {
                                                        for (let n = m + 1; n < columns[l].length; n++) {
                                                            if (columns[l][n].spacer === 1) {
                                                                rowSpan++;
                                                                columns[l][n].spacer = 2;
                                                            }
                                                            else {
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if (rowSpan > 1) {
                                                        node.gridRowSpan = rowSpan;
                                                    }
                                                    if (columnSpan > 1) {
                                                        node.gridColumnSpan = columnSpan;
                                                    }
                                                    node.gridRowStart = (start++ === 0);
                                                    node.gridRowEnd = (columnSpan + l === columns.length);
                                                    node.gridFirst = (count++ === 0);
                                                    node.gridLast = (node.gridRowEnd && m === columns[l].length - 1);
                                                    node.gridIndex = l;
                                                    spacer = 0;
                                                }
                                            }
                                            else if (node.spacer === 1) {
                                                spacer++;
                                            }
                                        }
                                    }
                                }
                            }
                            if (!nodeY.renderParent) {
                                const children = new WidgetList(nodeY.children);
                                const [linearX, linearY] = [children.linearX, children.linearY];
                                if (!nodeY.flex.enabled && linearX && linearY) {
                                    xml += writeFrameLayout(nodeY, parent);
                                }
                                else if ((!nodeY.flex.enabled || nodeY.children.every((item: Widget) => item.flex.enabled)) && (linearX || linearY)) {
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
                            let siblings: WidgetList<Widget>;
                            if (SETTINGS.useLayoutWeight) {
                                siblings = new WidgetList(nodeY.gridSiblings);
                            }
                            else {
                                const columnEnd = parent.gridColumnEnd[nodeY.gridIndex + nodeY.gridColumnSpan];
                                siblings = nodeY.parentOriginal.children.filter((item: Widget) => !item.renderParent && item.bounds.left >= nodeY.bounds.right && item.bounds.right <= columnEnd);
                            }
                            if (siblings.length > 0) {
                                siblings.unshift(nodeY);
                                siblings.sortAsc('bounds.x');
                                const renderParent = parent;
                                const layout = new Layout(NODE_CACHE.nextId, nodeY, parent, siblings, [0]);
                                NODE_CACHE.push(layout);
                                for (const node of siblings) {
                                    node.parent = layout;
                                    layout.inheritGrid(node);
                                }
                                layout.setBounds();
                                if (siblings.linearX || siblings.linearY) {
                                    xml += writeLinearLayout(layout, renderParent, siblings.linearY);
                                }
                                else {
                                    xml += writeDefaultLayout(layout, renderParent);
                                }
                                k--;
                                restart = true;
                            }
                        }
                        if (!nodeY.renderParent && !restart) {
                            xml += writeViewTag(nodeY, parent, tagName);
                        }
                    }
                    if (xml !== '') {
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
        setConstraints();
        output = setInlineAttributes(output);
    }
    output = insertViewBeforeAfter(output);
    output = output.replace(/{[<@>]{1}[0-9]+}/g, '');
    if (SETTINGS.useUnitDP) {
        output = replaceDP(output, SETTINGS.density);
    }
    return output;
}

export { API_ANDROID as api, BUILD_ANDROID as build, DENSITY_ANDROID as density, SETTINGS as settings };
export { writeResourceArrayXml, writeResourceColorXml, writeResourceDrawableXml, writeResourceFontXml, writeResourceStringXml, writeResourceStyleXml };