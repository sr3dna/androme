import { ObjectIndex } from '../lib/types';
import Controller from './controller';
import Extension from './extension';
import Resource from './resource';
import Node from './node';
import NodeList from './nodelist';
import { INLINE_CHROME, MAPPING_CHROME, VIEW_STANDARD, OVERFLOW_CHROME } from '../lib/constants';
import { hasValue, hyphenToCamelCase, replaceDP, resetId, sortAsc } from '../lib/util';
import { convertRGB, getByColorName } from '../lib/color';
import { hasFreeFormText, isVisible } from '../lib/dom';
import SETTINGS from '../settings';

export default class Application<T extends Node, U extends NodeList<T>> {
    public cache: U;
    public controllerHandler: Controller<T, U>;
    public resourceHandler: Resource<T>;

    private cacheInternal: U;
    private ids: string[] = [];
    private views: string[] = [];
    private _extensions: Array<Extension<T, U>> = [];
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

    public registerExtension(extension: Extension<T, U>) {
        this._extensions.push(extension);
    }

    public finalize() {
        this.resourceHandler.finalize(this.viewData);
        const views = this.resourceHandler.views;
        for (let i = 0; i < views.length; i++) {
            let output = views[i].replace(/{[<@&>]{1}[0-9]+}/g, '');
            if (SETTINGS.useUnitDP) {
                output = replaceDP(output, SETTINGS.density);
            }
            this.views[i] = output;
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
        this.ids = [];
        this.views = [];
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
                    const parent = (<T> nodeY.parent);
                    if (!nodeY.renderParent) {
                        let xml = '';
                        this.extensions.filter(item => item.enabled).some(item => {
                            if (item.is(nodeY.tagName)) {
                                item.application = this;
                                item.node = nodeY;
                                item.parent = parent;
                                if (item.condition()) {
                                    const result = item.render(mapX, mapY);
                                    if (result !== '') {
                                        xml += result;
                                        if (item.processNode()) {
                                            k--;
                                        }
                                    }
                                    nodeY.renderExtension = item;
                                    return true;
                                }
                            }
                            return false;
                        });
                        if (parent.renderExtension != null && parent.renderExtension instanceof Extension) {
                            const [result, restart] = parent.renderExtension.processChild(nodeY);
                            if (result !== '') {
                                xml += result;
                                if (restart) {
                                    k--;
                                }
                            }
                        }
                        if (xml === '') {
                            let tagName = nodeY.viewName;
                            if (tagName === '') {
                                if (nodeY.children.length > 0 && nodeY.children.some(node => !INLINE_CHROME.includes(node.tagName))) {
                                    const [linearX, linearY] = [NodeList.linearX(nodeY.children), NodeList.linearY(nodeY.children)];
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
                                    if (nodeY.children.length === 0 && nodeY.element && !hasFreeFormText(nodeY.element)) {
                                        continue;
                                    }
                                    tagName = this.controllerHandler.getViewName(VIEW_STANDARD.TEXT);
                                }
                            }
                            if (!nodeY.renderParent) {
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

    public writeFrameLayout(node: T, parent: T) {
        return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.FRAME);
    }

    public writeLinearLayout(node: T, parent: T, vertical: boolean) {
        return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.LINEAR, { android: { orientation: (vertical ? 'vertical' : 'horizontal') } });
    }

    public writeGridLayout(node: T, parent: T, columnCount: number, rowCount: number = 0) {
        return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.GRID, { android: { columnCount: columnCount.toString(), rowCount: (rowCount > 0 ? rowCount.toString() : '') } });
    }

    public writeRelativeLayout(node: T, parent: T) {
        return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.RELATIVE);
    }

    public writeConstraintLayout(node: T, parent: T) {
        return this.controllerHandler.renderGroup(node, parent, VIEW_STANDARD.CONSTRAINT);
    }

    public writeView(node: T, parent: T, viewName: number | string) {
        return this.controllerHandler.renderView(node, parent, viewName);
    }

    public writeDefaultLayout(node: T, parent: T) {
        if (SETTINGS.useConstraintLayout || node.flex.enabled) {
            return this.writeConstraintLayout(node, parent);
        }
        else {
            return this.writeRelativeLayout(node, parent);
        }
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
        return (this.views.length > 0 ? this.views[0] : '');
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
        this.views[this.views.length - 1] = value;
    }
    private get current() {
        return this.views[this.views.length - 1];
    }

    protected set currentId(value: string) {
        if (this.ids.length === this.views.length) {
            this.ids.push(value);
        }
    }
    protected get currentId() {
        return this.ids[this.ids.length - 1] || '';
    }

    private set create(value) {
        if (this.views.length < this.ids.length) {
            this.views.push(value);
        }
    }

    get closed() {
        return this._closed;
    }

    get extensions() {
        return this._extensions;
    }

    public get viewData() {
        return { cache: this.cacheInternal, ids: this.ids, views: this.views };
    }

    public get length() {
        return this.views.length;
    }
}