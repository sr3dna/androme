import { IExtension, Null, ObjectIndex, ObjectMap, PlainFile, StringMap, ViewData } from '../lib/types';
import Controller from './controller';
import Resource from './resource';
import Node from './node';
import NodeList from './nodelist';
import { hasValue, hyphenToCamelCase, optional, resetId, sortAsc, trim } from '../lib/util';
import { placeIndent, removePlaceholders, replaceDP, replaceTab } from '../lib/xml';
import { hasFreeFormText, getStyle, isVisible } from '../lib/dom';
import { convertRGB, getByColorName, parseRGBA } from '../lib/color';
import { INLINE_CHROME, MAPPING_CHROME, VIEW_STANDARD, OVERFLOW_CHROME } from '../lib/constants';
import SETTINGS from '../settings';

export default class Application<T extends Node, U extends NodeList<T>> {
    public cache: U;
    public cacheInternal: U;
    public controllerHandler: Controller<T, U>;
    public resourceHandler: Resource<T>;
    public elements: Set<HTMLElement> = new Set();
    public insert: ObjectIndex<string[]> = {};

    private views: PlainFile[] = [];
    private includes: PlainFile[] = [];
    private currentIndex = -1;
    private _extensions: IExtension[] = [];
    private _closed = false;

    constructor(
        private TypeT: { new (id: number, api: number, element?: HTMLElement, options?: ObjectMap<any>): T },
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

    public registerExtension(extension: IExtension) {
        const found = this.findExtension(extension.name);
        if (found != null) {
            if (Array.isArray(extension.tagNames)) {
                found.tagNames = extension.tagNames;
            }
            Object.assign(found.options, extension.options);
        }
        else {
            if (extension.dependencies.every(item => this.findExtension(item.name) != null)) {
                extension.application = this;
                this._extensions.push(extension);
            }
        }
    }

    public finalize() {
        this.controllerHandler.setDimensions(this.viewData);
        this.insertAuxillaryViews();
        this.resourceHandler.finalize(this.viewData);
        if (SETTINGS.showAttributes) {
            this.setAttributes();
        }
        this.layouts.forEach(layout => {
            layout.content = removePlaceholders(layout.content).replace(/\n\n/g, '\n');
            if (SETTINGS.dimensResourceValue) {
                layout.content = this.controllerHandler.parseDimensions(layout.content);
            }
            layout.content = replaceDP(layout.content);
            layout.content = replaceTab(layout.content);
        });
        this._closed = true;
    }

    public reset() {
        resetId();
        this.cacheInternal.list.forEach(node => {
            const element: any = node.element;
            delete element.__boxSpacing;
            delete element.__boxStyle;
            delete element.__fontStyle;
            delete element.__imageSource;
            delete element.__optionArray;
            delete element.__valueString;
        });
        this.cache.reset();
        this.cacheInternal.reset();
        this.resetController();
        this.resetResource();
        this.appName = '';
        this.views = [];
        this.includes = [];
        this.insert = {};
        this.currentIndex = -1;
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
                            const object: any = element;
                            delete object.__style;
                            delete object.__styleMap;
                        });
                    }
                    Array.from(elements).forEach((element: HTMLElement) => {
                        for (const attr of Array.from(element.style)) {
                            attributes.add(hyphenToCamelCase(attr));
                        }
                        const style = getStyle(element);
                        const styleMap: StringMap = {};
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
                        const object: any = element;
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

    public createNodeCache(root: HTMLElement) {
        let nodeTotal = 0;
        if (root === document.body) {
            Array.from(document.body.childNodes).forEach((item: HTMLElement) => {
                if (item.nodeName === '#text') {
                    if (optional(item, 'textContent').trim() !== '') {
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
        const elements = (root !== document.body ? root.querySelectorAll('*') : document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *')));
        this.cache.parent = undefined;
        this.cache.clear();
        const extensions = this.extensions;
        extensions.forEach(item => {
            item.setTarget((<T> {}), null, root);
            item.beforeInit();
        });
        if (root != null) {
            const node = this.insertNode(root);
            if (node != null) {
                node.parent = new this.TypeT(0, 0);
                this.cache.parent = node;
            }
        }
        extensions.forEach(item => item.setTarget((<T> this.cache.parent)));
        for (const element of (<HTMLElement[]> Array.from(elements))) {
            if (!this.elements.has(element)) {
                let handled = false;
                extensions.some(item => {
                    if (item.init(element)) {
                        handled = true;
                        return true;
                    }
                    return false;
                });
                if (!handled) {
                    if (INLINE_CHROME.includes(element.tagName) && element.parentElement && (MAPPING_CHROME[element.parentElement.tagName] != null || INLINE_CHROME.includes(element.parentElement.tagName))) {
                        continue;
                    }
                    let valid = true;
                    let current = element.parentElement;
                    while (current != null) {
                        if (current === root) {
                            break;
                        }
                        else if (current !== root && this.elements.has(current)) {
                            valid = false;
                            break;
                        }
                        current = current.parentElement;
                    }
                    if (valid) {
                        this.insertNode(element);
                    }
                }
            }
        }
        if (this.cache.list.length > 0) {
            const preAlignment = {};
            this.cache.list.forEach(node => {
                const element = node.element;
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
                node.setBounds();
            });
            const parents: ObjectIndex<T[]> = {};
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
                    let closest: Null<T> = null;
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
                        if (element.nodeName === '#text' && optional(element, 'textContent').trim() !== '') {
                            this.insertNode(element, node);
                        }
                    });
                }
            });
            this.cache.list.forEach(node => {
                if (node.hasElement) {
                    const style = preAlignment[node.id];
                    if (style != null) {
                        for (const attr in style) {
                            node.element.style[attr] = style[attr];
                        }
                    }
                }
            });
            extensions.forEach(item => {
                item.setTarget((<T> this.cache.parent), null, root);
                item.afterInit();
            });
            this.cache.sortAsc('depth', 'parent.id', 'parentIndex', 'id');
            this.cache.list.forEach(node => {
                if (node.hasElement) {
                    let i = 0;
                    Array.from(node.element.childNodes).forEach((element: any) => {
                        if (element.__node != null && (element.__node.parent.element === node.element)) {
                            element.__node.parentIndex = i++;
                        }
                    });
                    sortAsc(node.children, 'parentIndex');
                }
            });
            this.addLayout((<string> root.dataset.currentId));
            return true;
        }
        return false;
    }

    public createLayoutXml() {
        let output = `<?xml version="1.0" encoding="utf-8"?>\n{:0}`;
        let empty = true;
        const mapX: any = [];
        const mapY: any = [];
        const extensions = this.extensions;
        this.cache.list.forEach(node => {
            const x = Math.floor(node.bounds.left);
            const y = node.parent.id;
            if (mapX[node.depth] == null) {
                mapX[node.depth] = {};
            }
            if (mapY[node.depth] == null) {
                mapY[node.depth] = {};
            }
            if (mapX[node.depth][x] == null) {
                mapX[node.depth][x] = [];
            }
            if (mapY[node.depth][y] == null) {
                mapY[node.depth][y] = [];
            }
            mapX[node.depth][x].push(node);
            mapY[node.depth][y].push(node);
        });
        for (let i = 0; i < mapY.length; i++) {
            const coordsY = Object.keys(mapY[i]);
            const partial = new Map();
            for (let j = 0; j < coordsY.length; j++) {
                const axisY: T[] = [];
                const layers: T[] = [];
                for (const node of (<T[]> mapY[i][coordsY[j]])) {
                    switch (node.css('position')) {
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
                    if (a.linear.left !== b.linear.left && !a.parent.flex.enabled && !b.parent.flex.enabled && a.withinX(b.linear)) {
                        return (a.linear.left > b.linear.left ? 1 : -1);
                    }
                    return (a.parentIndex > b.parentIndex ? 1 : -1);
                });
                axisY.push(...sortAsc(layers, 'style.zIndex', 'parentIndex'));
                for (let k = 0; k < axisY.length; k++) {
                    const nodeY = axisY[k];
                    let parent = (<T> nodeY.parent);
                    if (!nodeY.renderParent) {
                        let xml = '';
                        let proceed = false;
                        const renderExtension = (<IExtension> parent.renderExtension);
                        if (renderExtension != null) {
                            renderExtension.setTarget(nodeY, parent);
                            const result = renderExtension.processChild();
                            if (result.xml !== '') {
                                xml += result.xml;
                                if (result.parent != null) {
                                    parent = (<T> result.parent);
                                }
                                if (result.restart) {
                                    k--;
                                }
                            }
                            if (result.proceed) {
                                continue;
                            }
                        }
                        extensions.some(item => {
                            if (nodeY.renderExtension == null && item.is(nodeY)) {
                                item.setTarget(nodeY, parent);
                                if (item.condition()) {
                                    const result =  item.processNode(mapX, mapY);
                                    if (result.xml !== '') {
                                        xml += result.xml;
                                        if (result.parent != null) {
                                            parent = (<T> result.parent);
                                        }
                                        if (result.restart && nodeY === axisY[k]) {
                                            k--;
                                        }
                                    }
                                    if (result.proceed != null) {
                                        proceed = result.proceed;
                                    }
                                    nodeY.renderExtension = item;
                                    return true;
                                }
                            }
                            return false;
                        });
                        if (proceed) {
                            continue;
                        }
                        if (xml === '') {
                            let tagName = nodeY.viewName;
                            if (tagName === '') {
                                if (nodeY.children.length > 0 && nodeY.cascade().some(node => MAPPING_CHROME[node.tagName] != null || !INLINE_CHROME.includes(node.tagName))) {
                                    if (!nodeY.renderParent) {
                                        if (nodeY.children.some(node => !node.pageflow)) {
                                            xml += this.writeDefaultLayout(nodeY, parent);
                                        }
                                        else {
                                            if (nodeY.children.length === 1) {
                                                if (nodeY.viewWidth === 0 && nodeY.viewHeight === 0 && nodeY.marginTop === 0 && nodeY.marginRight === 0 && nodeY.marginBottom === 0 && nodeY.marginLeft === 0 && nodeY.paddingTop === 0 && nodeY.paddingRight === 0 && nodeY.paddingBottom === 0 && nodeY.paddingLeft === 0 && parseRGBA(nodeY.css('background')).length === 0 && !this.controllerHandler.hasAppendProcessing(nodeY.id)) {
                                                    nodeY.children[0].parent = parent;
                                                    nodeY.cascade().forEach(item => item.renderDepth--);
                                                    nodeY.hide();
                                                    continue;
                                                }
                                                else {
                                                    xml += this.writeFrameLayout(nodeY, parent);
                                                }
                                            }
                                            else {
                                                const [linearX, linearY] = [NodeList.linearX(nodeY.children), NodeList.linearY(nodeY.children)];
                                                if (this.isLinearXY(linearX, linearY, nodeY, <T[]> nodeY.children)) {
                                                    xml += this.writeLinearLayout(nodeY, parent, linearY);
                                                }
                                                else {
                                                    xml += this.writeDefaultLayout(nodeY, parent);
                                                }
                                            }
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
                const placeholder = `{:${id}}`;
                if (output.indexOf(placeholder) !== -1) {
                    output = output.replace(placeholder, views.join('') + placeholder);
                    empty = false;
                }
                else {
                    this.addInsertQueue(id, views);
                }
            }
        }
        const root = (<T> this.cache.parent);
        const extension = (<IExtension> root.renderExtension);
        if (extension == null || root.data(`${extension.name}:insert`) == null) {
            const pathname = trim(optional(root, 'element.dataset.pathname').trim(), '/');
            this.setLayout(pathname, (!empty ? output : ''), (root.renderExtension != null && root.renderExtension.activityMain));
        }
        else {
            this.views.pop();
        }
        if (!empty) {
            extensions.forEach(item => {
                item.setTarget(root);
                item.afterRender();
            });
        }
        else if (extension == null) {
            root.visible = false;
        }
        this.cacheInternal.list.push(...this.cache.list);
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

    public addInsertQueue(id: number, views: string[]) {
        if (this.insert[id] == null) {
            this.insert[id] = [];
        }
        this.insert[id].push(...views);
    }

    public insertAuxillaryViews() {
        this.cacheInternal.list.forEach(node => {
            const extension = node.renderExtension;
            if (extension != null) {
                const insert = `${extension.name}:insert`;
                let output = (<string> node.data(insert));
                if (output) {
                    output = this.controllerHandler.insertAuxillaryViews(output);
                    const children = this.insert[node.id];
                    if (children != null) {
                        output = output.replace(`{:${node.id}}`, children.join(''));
                    }
                    output = placeIndent(output.trim());
                    node.data(insert, output);
                    extension.setTarget(node);
                    extension.insert();
                }
            }
        });
        const template = {};
        for (const id in this.insert) {
            template[id] = this.insert[id].join('\n');
        }
        for (const inner in template) {
            for (const outer in template) {
                if (inner !== outer) {
                    template[inner] = template[inner].replace(`{:${outer}}`, template[inner]);
                    template[outer] = template[outer].replace(`{:${inner}}`, template[inner]);
                }
            }
        }
        this.layouts.forEach(view => {
            for (const id in template) {
                view.content = view.content.replace(`{:${id}}`, template[id]);
            }
            view.content = this.controllerHandler.insertAuxillaryViews(view.content);
        });
        this.cacheInternal.list.forEach(node => {
            const extension = node.renderExtension;
            if (extension != null) {
                extension.setTarget(node);
                extension.afterInsert();
            }
        });
    }

    public setAttributes() {
        this.controllerHandler.setAttributes(this.viewData);
        this.cacheInternal.list.forEach(node => {
            const extension = node.renderExtension;
            if (extension != null) {
                extension.setTarget(node);
                extension.finalize();
            }
        });
    }

    public addLayout(value: string) {
        const layout: PlainFile = {
            filename: value,
            pathname: '',
            content: ''
        };
        this.currentIndex = this.views.length;
        this.views.push(layout);
    }

    public setLayout(pathname = '', content: string, activityMain = false) {
        pathname = pathname || 'res/layout';
        if (activityMain && this.views.length > 0 && this.views[0].content === '') {
            const view = this.views[0];
            const current = (<PlainFile> this.views.pop());
            view.pathname = pathname;
            view.filename = current.filename;
            view.content = content;
            this.currentIndex = 0;
        }
        else {
            const view = this.current;
            view.pathname = pathname;
            view.content = content;
        }
    }

    public isLinearXY(linearX: boolean, linearY: boolean, parent: T, children: T[]) {
        return (linearX || linearY) &&
               (!parent.flex.enabled || (linearX && children.every(node => node.flex.enabled))) &&
               (!children.some(node => node.floating && node.css('clear') !== 'none') &&
               (children.every(node => node.css('float') !== 'right') || children.every(node => node.css('float') === 'right')) &&
               children.every(node => node.pageflow));
    }

    public addInclude(filename: string, content: string) {
        this.includes.push({
            pathname: 'res/layout',
            filename,
            content
        });
    }

    public findExtension(name: string) {
        return this._extensions.find(item => item.name === name);
    }

    public addXmlNamespace(name: string, uri: string) {
        this.controllerHandler.addXmlNamespace(name, uri);
    }

    public findByDomId(id: string) {
        return this.cacheInternal.list.find(node => node.element.id === id);
    }

    public toString() {
        return (this.views.length > 0 ? this.views[0].content : '');
    }

    private insertNode(element: HTMLElement, parent?: T) {
        let node: Null<T> = null;
        if (element.nodeName === '#text') {
            if (optional(element, 'textContent', 'string').trim() !== '') {
                node = new this.TypeT(this.cache.nextId, SETTINGS.targetAPI, element, { parent, tagName: 'PLAINTEXT' });
                node.setBounds(false, element);
                if (parent != null) {
                    node.inheritStyle(parent);
                    parent.children.push(node);
                }
            }
        }
        else if (isVisible(element)) {
            node = new this.TypeT(this.cache.nextId, SETTINGS.targetAPI, element);
            if ((<any> element).__nodeIsolated) {
                node.isolated = true;
            }
        }
        if (node != null) {
            this.cache.list.push(node);
        }
        return node;
    }

    public set appName(value) {
        if (this.resourceHandler != null) {
            this.resourceHandler.file.appName = value;
        }
    }
    public get appName() {
        return (this.resourceHandler != null ? this.resourceHandler.file.appName : '');
    }

    public set current(value) {
        this.views[this.currentIndex] = value;
    }
    public get current() {
        return this.views[this.currentIndex];
    }

    get layouts() {
        return [...this.views, ...this.includes];
    }

    get closed() {
        return this._closed;
    }

    get extensions() {
        return this._extensions.filter(item => item.enabled);
    }

    public get viewData(): ViewData<T> {
        return { cache: this.cacheInternal.list, views: this.views, includes: this.includes };
    }

    public get size() {
        return this.views.length + this.includes.length;
    }
}