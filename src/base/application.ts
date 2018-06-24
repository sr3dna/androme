import { ObjectIndex } from '../lib/types';
import Controller from './controller';
import Resource from './resource';
import Node from './node';
import NodeList from './nodelist';
import { BLOCK_CHROME, INLINE_CHROME, MAPPING_CHROME, VIEW_STANDARD, OVERFLOW_CHROME } from '../lib/constants';
import { convertAlpha, convertRoman, hasValue, hyphenToCamelCase, replaceDP, resetId, sortAsc } from '../lib/util';
import { convertRGB, getByColorName } from '../lib/color';
import { hasFreeFormText, isVisible } from '../lib/dom';
import SETTINGS from '../settings';

export default class Application<T extends Node, U extends NodeList<T>> {
    public controllerHandler: Controller<T, U>;
    public resourceHandler: Resource<T>;

    private cacheInternal: U;
    private cache: U;
    private _ids: string[] = [];
    private _views: string[] = [];
    private _closed: boolean = false;

    constructor(
        private TypeT: { new (id: number, api: number, element?: HTMLElement, options?: any): T },
        private TypeU: { new (nodes?: T[], parent?: T): U })
    {
        this.cache = new this.TypeU();
        this.cacheInternal = new this.TypeU();
    }

    public registerController(controllerHandler: Controller<T, U>) {
        controllerHandler.cache = this.cache;
        this.controllerHandler = controllerHandler;
    }

    public registerResource(resource: Resource<T>) {
        resource.cache = this.cache;
        this.resourceHandler = resource;
    }

    public finalize() {
        this.resourceHandler.finalize(this.viewData);
        const views = this.resourceHandler.views;
        for (let i = 0; i < views.length; i++) {
            let output = views[i].replace(/{[<@&>]{1}[0-9]+}/g, '');
            if (SETTINGS.useUnitDP) {
                output = replaceDP(output, SETTINGS.density);
            }
            this._views[i] = output;
        }
        this._closed = true;
    }

    public reset() {
        resetId();
        this.cacheInternal.list.forEach(node => {
            const element: any = node.element;
            if (element != null) {
                delete element.__boxSpacing;
                delete element.__boxStyle;
                delete element.__fontStyle;
                delete element.__imageSource;
                delete element.__optionArray;
                delete element.__valueString;
            }
        });
        this.cache.reset();
        this.cacheInternal.reset();
        this.resetController();
        this.resetResource();
        this.appName = '';
        this._ids = [];
        this._views = [];
        this._closed = false;
    }

    public resetController() {
        this.controllerHandler.reset();
    }

    public resetResource() {
        this.resourceHandler.reset();
    }

    public setConstraints() {
        this.controllerHandler.setConstraints();
    }

    public setMarginPadding() {
        this.controllerHandler.setMarginPadding();
    }

    public setLayoutWeight() {
        this.controllerHandler.setLayoutWeight();
    }

    public setResources() {
        this.resourceHandler.setFontStyle();
        this.resourceHandler.setBoxSpacing();
        this.resourceHandler.setBoxStyle();
        this.resourceHandler.setValueString();
        this.resourceHandler.setOptionArray();
        this.resourceHandler.setImageSource();
    }

    public setStyleMap() {
        let cssWarning = false;
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = (<CSSStyleSheet> document.styleSheets[i]);
            try {
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    const cssRule = (<CSSStyleRule> styleSheet.cssRules[j]);
                    const attributes: Set<string> = new Set();
                    for (const attr of Array.from(cssRule.style)) {
                        attributes.add(hyphenToCamelCase(attr));
                    }
                    const elements = document.querySelectorAll(cssRule.selectorText);
                    if (this.appName !== '') {
                        Array.from(elements).forEach((element: HTMLElement) => {
                            const object = (<any> element);
                            delete object.__style;
                            delete object.__styleMap;
                        });
                    }
                    Array.from(elements).forEach((element: HTMLElement) => {
                        for (const attr of Array.from(element.style)) {
                            attributes.add(hyphenToCamelCase(attr));
                        }
                        const style = getComputedStyle(element);
                        const styleMap = {};
                        for (const name of attributes) {
                            if (name.toLowerCase().indexOf('color') !== -1) {
                                const color = getByColorName(cssRule.style[name]);
                                if (color !== '') {
                                    cssRule.style[name] = convertRGB(color);
                                }
                            }
                            if (hasValue(element.style[name])) {
                                styleMap[name] = element.style[name];
                            }
                            else if (style[name] === cssRule.style[name]) {
                                styleMap[name] = style[name];
                            }
                        }
                        const object = (<any> element);
                        if (object.__styleMap != null) {
                            Object.assign(object.__styleMap, styleMap);
                        }
                        else {
                            object.__style = style;
                            object.__styleMap = styleMap;
                        }
                    });
                }
            }
            catch (error) {
                if (!cssWarning) {
                    alert('External CSS files cannot be parsed when loading this program from your hard drive with Chrome 64+ (file://). Either use a local web ' +
                          'server (http://), embed your CSS files into a <style> tag, or use a different browser. See the README for further instructions.\n\n' +
                          `${styleSheet.href}\n\n${error}`);
                    cssWarning = true;
                }
            }
        }
    }

    public setNodeCache(layoutRoot: HTMLElement) {
        let nodeTotal = 0;
        if (layoutRoot === document.body) {
            Array.from(document.body.childNodes).forEach((item: HTMLElement) => {
                if (item.nodeName === '#text') {
                    if (item.textContent && item.textContent.trim() !== '') {
                        nodeTotal++;
                    }
                }
                else {
                    if (isVisible(item)) {
                        nodeTotal++;
                    }
                }
            });
        }
        const elements = (layoutRoot !== document.body ? layoutRoot.querySelectorAll('*') : document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *')));
        this.cache.clear();
        if (layoutRoot != null) {
            const node = this.insertNode(layoutRoot);
            if (node != null) {
                node.parent = new this.TypeT(0, 0);
            }
        }
        for (const element of (<HTMLElement[]> Array.from(elements))) {
            if (INLINE_CHROME.includes(element.tagName) && element.parentElement && (MAPPING_CHROME[element.parentElement.tagName] != null || INLINE_CHROME.includes(element.parentElement.tagName))) {
                continue;
            }
            this.insertNode(element);
        }
        const preAlignment = {};
        this.cache.list.forEach(node => {
            const element = node.element;
            if (element != null) {
                preAlignment[node.id] = {};
                const style = preAlignment[node.id];
                switch (node.styleMap.textAlign) {
                    case 'center':
                    case 'right':
                    case 'end':
                        style.textAlign = node.style.textAlign;
                        element.style.textAlign = '';
                        break;
                }
                style.verticalAlign = node.styleMap.verticalAlign || '';
                element.style.verticalAlign = 'top';
                if (node.overflow !== OVERFLOW_CHROME.NONE) {
                    if (hasValue(node.styleMap.width)) {
                        style.width = node.styleMap.width;
                        element.style.width = '';
                    }
                    if (hasValue(node.styleMap.height)) {
                        style.height = node.styleMap.height;
                        element.style.height = '';
                    }
                    style.overflow = node.style.overflow;
                    element.style.overflow = 'visible';
                }
            }
            node.setBounds();
        });
        const parents = {};
        this.cache.list.forEach(parent => {
            this.cache.list.forEach(child => {
                if (parent !== child) {
                    if (child.element && child.element.parentElement === parent.element) {
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
            });
        });
        this.cache.list.forEach(node => {
            const nodes: T[] = parents[node.id];
            if (nodes != null) {
                nodes.push((<T> node.parent));
                let minArea = Number.MAX_VALUE;
                let closest: T | null = null;
                nodes.forEach(current => {
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
                });
                if (closest != null) {
                    node.parent = closest;
                }
            }
            if (node.element && node.element.children.length > 0 && !node.children.every((current: T) => INLINE_CHROME.includes(current.tagName))) {
                Array.from(node.element.childNodes).forEach((element: HTMLElement) => {
                    if (element.nodeName === '#text' && element.textContent && element.textContent.trim() !== '') {
                        this.insertNode(element, node);
                    }
                });
            }
        });
        this.cache.list.forEach(node => {
            if (node.element != null) {
                const style = preAlignment[node.id];
                if (style != null) {
                    for (const attr in style) {
                        node.element.style[attr] = style[attr];
                    }
                }
            }
        });
        this.cache.sortAsc('depth', 'parent.id', 'parentIndex', 'id');
        this.cache.list.forEach(node => {
            if (node.element != null) {
                let i = 0;
                Array.from(node.element.childNodes).forEach((element: any) => {
                    if (element.__node != null && (element.__node.parent.element === node.element)) {
                        element.__node.parentIndex = i++;
                    }
                });
                sortAsc(node.children, 'parentIndex');
            }
        });
        this.currentId = (<string> layoutRoot.dataset.currentId);
        this.cacheInternal.list.push(...this.cache.list);
    }

    public insertNode(element: HTMLElement, parent?: T) {
        let node: T | null = null;
        if (element.nodeName === '#text') {
            if (element.textContent && element.textContent.trim() !== '') {
                node = new this.TypeT(this.cache.nextId, SETTINGS.targetAPI, undefined, { element, parent, tagName: 'PLAINTEXT' });
                node.setBounds(false, element);
                if (parent != null) {
                    node.inheritStyle(parent);
                    parent.children.push(node);
                }
            }
        }
        else if (isVisible(element)) {
            node = new this.TypeT(this.cache.nextId, SETTINGS.targetAPI, element);
        }
        if (node != null) {
            this.cache.list.push(node);
        }
        return node;
    }

    public setLayoutXml() {
        let output = `<?xml version="1.0" encoding="utf-8"?>\n{0}`;
        const mapX: ObjectIndex = [];
        const mapY: ObjectIndex = [];
        this.cache.list.forEach(node => {
            const x = Math.floor((<number> node.bounds.x));
            const y = node.parent.id;
            if (mapX[node.depth] == null) {
                mapX[node.depth] = {};
            }
            if (mapY[node.depth] == null) {
                mapY[node.depth] = {};
            }
            if (mapX[node.depth][x] == null) {
                mapX[node.depth][x] = new this.TypeU();
            }
            if (mapY[node.depth][y] == null) {
                mapY[node.depth][y] = new this.TypeU();
            }
            mapX[node.depth][x].list.push(node);
            mapY[node.depth][y].list.push(node);
        });
        for (let i = 0; i < mapY.length; i++) {
            const coordsY = Object.keys(mapY[i]);
            const partial = new Map();
            for (let j = 0; j < coordsY.length; j++) {
                const axisY: T[] = [];
                const layers: T[] = [];
                for (const node of (<T[]> mapY[i][coordsY[j]].list)) {
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
                axisY.sort((a: T, b: T) => {
                    if (a.linear.left !== b.linear.left && !a.parent.flex.enabled && !b.parent.flex.enabled && a.withinX(b.linear)) {
                        return (a.linear.left > b.linear.left ? 1 : -1);
                    }
                    return (a.parentIndex > b.parentIndex ? 1 : -1);
                });
                axisY.push(...sortAsc(layers, 'style.zIndex', 'parentIndex'));
                for (let k = 0; k < axisY.length; k++) {
                    const nodeY = axisY[k];
                    if (!nodeY.renderParent) {
                        const parent = (<T> nodeY.parent);
                        let tagName = nodeY.viewName;
                        let restart = false;
                        let xml = '';
                        if (tagName === '') {
                            if (nodeY.children.length > 0 && nodeY.children.some(node => !INLINE_CHROME.includes(node.tagName))) {
                                const [linearX, linearY] = [NodeList.linearX(nodeY.children), NodeList.linearY(nodeY.children)];
                                if (nodeY.tagName === 'TABLE') {
                                    const tableRows: T[] = [];
                                    const thead = nodeY.children.find(node => node.tagName === 'THEAD');
                                    const tbody = nodeY.children.find(node => node.tagName === 'TBODY');
                                    const tfoot = nodeY.children.find(node => node.tagName === 'TFOOT');
                                    if (thead != null) {
                                        thead.cascade().filter(node => node.tagName === 'TH' || node.tagName === 'TD').forEach(node => node.inheritStyleMap(thead));
                                        tableRows.push(...(<T[]> thead.children));
                                        thead.hide();
                                    }
                                    if (tbody != null) {
                                        tableRows.push(...(<T[]> tbody.children));
                                        tbody.hide();
                                    }
                                    if (tfoot != null) {
                                        tfoot.cascade().filter(node => node.tagName === 'TH' || node.tagName === 'TD').forEach(node => node.inheritStyleMap(tfoot));
                                        tableRows.push(...(<T[]> tfoot.children));
                                        tfoot.hide();
                                    }
                                    const rowCount = tableRows.length;
                                    let columnCount = 0;
                                    for (let l = 0; l < tableRows.length; l++) {
                                        const tr = tableRows[l];
                                        tr.hide();
                                        columnCount = Math.max(tr.children.map(node => (<HTMLTableDataCellElement> node.element)).reduce((a, b) => a + b.colSpan, 0), columnCount);
                                        for (let m = 0; m < tr.children.length; m++) {
                                            const td = tr.children[m];
                                            if (td.element != null) {
                                                const style = td.element.style;
                                                const element = (<HTMLTableCellElement> td.element);
                                                if (element.rowSpan > 1) {
                                                    td.gridRowSpan = element.rowSpan;
                                                }
                                                if (element.colSpan > 1) {
                                                    td.gridColumnSpan = element.colSpan;
                                                }
                                                if (td.styleMap.textAlign == null && !(style.textAlign === 'left' || style.textAlign === 'start')) {
                                                    td.styleMap.textAlign = (<string> style.textAlign);
                                                }
                                                if (td.styleMap.verticalAlign == null && style.verticalAlign === '') {
                                                    td.styleMap.verticalAlign = 'middle';
                                                }
                                                const [width, height] = (nodeY.style.borderCollapse === 'collapse' ? ['0px', '0px'] : nodeY.style.borderSpacing.split(' '));
                                                delete td.styleMap.margin;
                                                td.styleMap.marginTop = height;
                                                td.styleMap.marginRight = width;
                                                td.styleMap.marginBottom = height;
                                                td.styleMap.marginLeft = width;
                                                td.parent = nodeY;
                                            }
                                        }
                                    }
                                    xml += this.writeGridLayout(nodeY, parent, columnCount, rowCount);
                                }
                                else if ((nodeY.tagName === 'UL' || nodeY.tagName === 'OL') && nodeY.children.every(node => node.tagName === 'LI') && nodeY.children.some(node => node.css('display') === 'list-item' && node.css('listStyleType') !== 'none') && (linearX || linearY)) {
                                    if (linearY) {
                                        xml += this.writeGridLayout(nodeY, parent, 2);
                                    }
                                    else {
                                        xml += this.writeLinearLayout(nodeY, parent, linearY);
                                    }
                                    for (let l = 0, m = 0; l < nodeY.children.length; l++) {
                                        const node = nodeY.children[l];
                                        let ordinal = '0';
                                        if (node.css('display') === 'list-item') {
                                            const listStyle = node.css('listStyleType');
                                            switch (listStyle) {
                                                case 'disc':
                                                    ordinal = '●';
                                                    break;
                                                case 'square':
                                                    ordinal = '■';
                                                    break;
                                                case 'lower-alpha':
                                                case 'lower-latin':
                                                    ordinal = `${convertAlpha(m).toLowerCase()}.`;
                                                    break;
                                                case 'upper-alpha':
                                                case 'upper-latin':
                                                    ordinal = `${convertAlpha(m)}.`;
                                                    break;
                                                case 'lower-roman':
                                                    ordinal = `${convertRoman(m + 1).toLowerCase()}.`;
                                                    break;
                                                case 'upper-roman':
                                                    ordinal = `${convertRoman(m + 1)}.`;
                                                    break;
                                                default:
                                                    if (nodeY.tagName === 'OL') {
                                                        ordinal = `${(listStyle === 'decimal-leading-zero' && m < 9 ? '0' : '') && (m + 1).toString()}.`;
                                                    }
                                                    else {
                                                        ordinal = '○';
                                                    }
                                            }
                                            m++;
                                        }
                                        node.listStyle = ordinal;
                                    }
                                }
                                else if (SETTINGS.useGridLayout && !nodeY.flex.enabled && nodeY.children.length > 1 && nodeY.children.every(node => !node.flex.enabled && nodeY.children[0].tagName === node.tagName && BLOCK_CHROME.includes(node.tagName) && node.children.length > 1 && node.children.every(child => child.css('float') !== 'right'))) {
                                    let columns: any[][] = [];
                                    const columnEnd: number[] = [];
                                    if (SETTINGS.useLayoutWeight) {
                                        const dimensions: number[][] = [];
                                        for (let l = 0; l < nodeY.children.length; l++) {
                                            const children = nodeY.children[l].children;
                                            dimensions[l] = [];
                                            for (let m = 0; m < children.length; m++) {
                                                dimensions[l].push(children[m].bounds.width);
                                            }
                                            columns.push(children);
                                        }
                                        const base = columns[
                                            dimensions.findIndex((item: number[]) => {
                                                return (item === dimensions.reduce((a, b) => {
                                                    if (a.length === b.length) {
                                                        return (a.reduce((c, d) => c + d, 0) < b.reduce((c, d) => c + d, 0) ? a : b);
                                                    }
                                                    else {
                                                        return (a.length < b.length ? a : b);
                                                    }
                                                }));
                                            })];
                                        if (base.length > 1) {
                                            let maxIndex = -1;
                                            let assigned: number[] = [];
                                            let every = false;
                                            for (let l = 0; l < base.length; l++) {
                                                const bounds = base[l].bounds;
                                                const found: number[] = [];
                                                if (l < base.length - 1) {
                                                    for (let m = 0; m < columns.length; m++) {
                                                        if (columns[m] === base) {
                                                            found.push(l);
                                                        }
                                                        else {
                                                            const result = columns[m].findIndex((item: T, index) => (index >= l && Math.floor(item.bounds.width) === Math.floor(bounds.width) && index < columns[m].length - 1));
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
                                                columnRight[l] = (l === 0 ? 0 : columnRight[l - 1]);
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
                                                let top: number | null = null;
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
                                        xml += this.writeGridLayout(nodeY, parent, nodeY.gridColumnCount);
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
                                    if (nodeY.children.length === 1 && linearX && linearY) {
                                        xml += this.writeFrameLayout(nodeY, parent);
                                    }
                                    else if ((linearX || linearY) && (!nodeY.flex.enabled || nodeY.children.every(node => node.flex.enabled)) && (!nodeY.children.some(node => node.css('float') === 'right') || nodeY.children.every(node => node.css('float') === 'right'))) {
                                        xml += this.writeLinearLayout(nodeY, parent, linearY);
                                    }
                                    else {
                                        xml += this.writeDefaultLayout(nodeY, parent);
                                    }
                                }
                            }
                            else {
                                if (nodeY.element && !hasFreeFormText(nodeY.element)) {
                                    continue;
                                }
                                tagName = this.controllerHandler.getViewName(VIEW_STANDARD.TEXT);
                            }
                        }
                        if (!nodeY.renderParent) {
                            if (parent.is(VIEW_STANDARD.GRID)) {
                                let siblings: U;
                                if (SETTINGS.useLayoutWeight) {
                                    siblings = new this.TypeU(<T[]> nodeY.gridSiblings);
                                }
                                else {
                                    const columnEnd = parent.gridColumnEnd[nodeY.gridIndex + nodeY.gridColumnSpan];
                                    siblings = new this.TypeU(<T[]> nodeY.parentOriginal.children.filter(node => !node.renderParent && node.bounds.left >= nodeY.bounds.right && node.bounds.right <= columnEnd));
                                }
                                if (siblings != null && siblings.length > 0) {
                                    siblings.list.unshift(nodeY);
                                    siblings.sortAsc('bounds.x');
                                    const renderParent = parent;
                                    const viewGroup = this.controllerHandler.createGroup(nodeY, parent, siblings.list);
                                    this.cache.list.push(viewGroup);
                                    if (siblings.linearX || siblings.linearY) {
                                        xml += this.writeLinearLayout(viewGroup, renderParent, siblings.linearY);
                                    }
                                    else {
                                        xml += this.writeDefaultLayout(viewGroup, renderParent);
                                    }
                                    k--;
                                    restart = true;
                                }
                            }
                            if (!nodeY.renderParent && !restart) {
                                xml += this.writeView(nodeY, parent, tagName);
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
        this.create = output;
    }

    public replaceInlineAttributes() {
        const options = {};
        let output = this.current;
        this.cache.visible.forEach(node => output = this.controllerHandler.replaceInlineAttributes(output, node, options));
        output = output.replace('{@0}', this.controllerHandler.getRootAttributes(options));
        this.current = output;
    }

    public replaceAppended() {
        const output = this.controllerHandler.replaceAppended(this.current);
        this.current = output;
    }

    public toString() {
        return (this._views.length > 0 ? this._views[0] : '');
    }

    public set appName(value) {
        if (this.resourceHandler != null) {
            this.resourceHandler.file.appName = value;
        }
    }
    public get appName() {
        return (this.resourceHandler != null ? this.resourceHandler.file.appName : '');
    }

    private set current(value) {
        this._views[this._views.length - 1] = value;
    }
    private get current() {
        return this._views[this._views.length - 1];
    }

    protected set currentId(value: string) {
        if (this._ids.length === this._views.length) {
            this._ids.push(value);
        }
    }
    protected get currentId() {
        return this._ids[this._ids.length - 1] || '';
    }

    private set create(value) {
        if (this._views.length < this._ids.length) {
            this._views.push(value);
        }
    }

    get closed() {
        return this._closed;
    }

    public get viewData() {
        return { cache: this.cacheInternal, ids: this._ids, views: this._views };
    }

    public get length() {
        return this._views.length;
    }

    private writeFrameLayout(node: T, parent: T) {
        return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.FRAME);
    }

    private writeLinearLayout(node: T, parent: T, vertical: boolean) {
        return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.LINEAR, { android: { orientation: (vertical ? 'vertical' : 'horizontal') } });
    }

    private writeGridLayout(node: T, parent: T, columnCount: number, rowCount: number = 0) {
        return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.GRID, { android: { columnCount: columnCount.toString(), rowCount: (rowCount > 0 ? rowCount.toString() : '') } });
    }

    private writeRelativeLayout(node: T, parent: T) {
        return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.RELATIVE);
    }

    private writeConstraintLayout(node: T, parent: T) {
        return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.CONSTRAINT);
    }

    private writeView(node: T, parent: T, viewName: number | string) {
        return this.controllerHandler.renderView(node, parent, viewName);
    }

    private writeDefaultLayout(node: T, parent: T) {
        if (SETTINGS.useConstraintLayout || node.flex.enabled) {
            return this.writeConstraintLayout(node, parent);
        }
        else {
            return this.writeRelativeLayout(node, parent);
        }
    }
}