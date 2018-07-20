import { ArrayIndex, IExtension, Null, ObjectIndex, ObjectMap, PlainFile, StringMap, ViewData } from '../lib/types';
import Controller from './controller';
import Resource from './resource';
import Node from './node';
import NodeList from './nodelist';
import { hasValue, convertCamelCase, includesEnum, isNumber, optional, resetId, sortAsc, trim } from '../lib/util';
import { placeIndent, removePlaceholders, replaceDP, replaceTab } from '../lib/xml';
import { hasFreeFormText, getStyle, isVisible } from '../lib/dom';
import { convertRGB, getByColorName, parseRGBA } from '../lib/color';
import { BLOCK_ELEMENT, MAP_ELEMENT, NODE_PROCEDURE, NODE_STANDARD, OVERFLOW_ELEMENT } from '../lib/constants';
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
        this.cacheInternal.visible.forEach(node => {
            if (!node.companion) {
                if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.LAYOUT)) {
                    node.setLayout();
                }
                if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.ALIGNMENT)) {
                    node.setAlignment();
                }
            }
        });
        this.controllerHandler.adjustBoxSpacing(this.viewData);
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

    public setResources() {
        this.resourceHandler.setFontStyle();
        this.resourceHandler.setBoxSpacing();
        this.resourceHandler.setBoxStyle();
        this.resourceHandler.setValueString(this.controllerHandler.inlineExclude);
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
                        attributes.add(convertCamelCase(attr));
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
                            attributes.add(convertCamelCase(attr));
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
            item.setTarget(<T> {}, null, root);
            item.beforeInit();
        });
        const rootNode = this.insertNode(root);
        if (rootNode != null) {
            rootNode.parent = new this.TypeT(0, SETTINGS.targetAPI, root.parentElement || document.body);
            rootNode.documentRoot = true;
            this.cache.parent = rootNode;
        }
        else {
            return false;
        }
        for (const element of (<HTMLElement[]> Array.from(elements))) {
            if (!this.elements.has(element)) {
                this.orderExt(extensions, element).some(item => item.init(element));
                if (!this.elements.has(element)) {
                    const inlineExclude = this.controllerHandler.inlineExclude;
                    if (element.parentElement != null && inlineExclude.includes(element.tagName) && (MAP_ELEMENT[element.parentElement.tagName] != null || inlineExclude.includes(element.parentElement.tagName))) {
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
        if (this.cache.length > 0) {
            const preAlignment: ObjectIndex<ObjectMap<Null<string>>> = {};
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
                if (node.overflow !== OVERFLOW_ELEMENT.NONE) {
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
                        let elementParent = false;
                        if (child.element.parentElement === parent.element) {
                            child.parent = parent;
                            parent.children.push(child);
                            elementParent = true;
                        }
                        if ((child.css('position') === 'fixed' || (elementParent && child.css('position') === 'absolute' && parent.css('position') !== 'relative')) && child.box.left >= parent.linear.left && child.box.right <= parent.linear.right && child.box.top >= parent.linear.top && child.box.bottom <= parent.linear.bottom) {
                            if (parents[child.id] == null) {
                                parents[child.id] = [];
                            }
                            parents[child.id].push(parent);
                        }
                    }
                });
            });
            this.cache.list.forEach(node => {
                const nodes: Set<T> = new Set(parents[node.id]);
                if (nodes.size > 0) {
                    nodes.add(<T> node.parent);
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
                    if (closest != null && node.parent !== closest) {
                        node.parent.children = node.parent.children.filter(child => child !== node);
                        node.parent = closest;
                    }
                }
                const inlineExclude = this.controllerHandler.inlineExclude;
                if (node.element.children.length > 0 && (inlineExclude.length === 0 || node.children.some(current => !inlineExclude.includes(current.tagName)))) {
                    Array.from(node.element.childNodes).forEach((element: HTMLElement) => {
                        if (element.nodeName === '#text' && optional(element, 'textContent').trim() !== '') {
                            this.insertNode(element, node);
                        }
                    });
                }
            });
            this.cache.list.forEach(node => {
                const style = preAlignment[node.id];
                if (style != null) {
                    for (const attr in style) {
                        node.element.style[attr] = style[attr];
                    }
                }
            });
            extensions.forEach(item => {
                item.setTarget(rootNode);
                item.afterInit();
            });
            this.cache.sortAsc('depth', 'parent.id', 'parentIndex', 'id');
            this.cache.list.forEach(node => {
                if (node.hasElement) {
                    let i = 0;
                    Array.from(node.element.childNodes).forEach((element: HTMLElement) => {
                        const child = (<T> (<any> element).__node);
                        if (child && child.parent.element === node.element) {
                            child.parentIndex = i++;
                        }
                    });
                    sortAsc(node.children, 'parentIndex');
                }
            });
            this.addLayout(<string> root.dataset.viewName);
            return true;
        }
        return false;
    }

    public createLayoutXml() {
        let output = `<?xml version="1.0" encoding="utf-8"?>\n{:0}`;
        let empty = true;
        const mapX: ArrayIndex<ObjectIndex<T[]>> = [];
        const mapY: ArrayIndex<ObjectIndex<T[]>> = [];
        const extensions = this.extensions;
        this.cache.list.forEach(node => {
            const x = Math.floor(node.linear.left);
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
            const application = this;
            function renderXml(node: T, parent: T, xml: string) {
                if (xml !== '') {
                    if (node.dataset.target != null) {
                        const target = application.findByDomId(node.dataset.target, true);
                        if (target == null || target !== parent) {
                            application.addInsertQueue(node.dataset.target, [xml]);
                            return;
                        }
                    }
                    else if (parent.dataset.target != null) {
                        node.dataset.target = parent.nodeId;
                        application.addInsertQueue(parent.nodeId, [xml]);
                        return;
                    }
                    if (!partial.has(parent.id)) {
                        partial.set(parent.id, []);
                    }
                    partial.get(parent.id).push(xml);
                }
            }
            for (let j = 0; j < coordsY.length; j++) {
                const axisY: T[] = [];
                const layers: T[] = [];
                for (const node of (<T[]> mapY[i][coordsY[j]])) {
                    if (node.pageflow) {
                        axisY.push(node);
                    }
                    else {
                        layers.push(node);
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
                    if (!nodeY.documentRoot && this.elements.has(nodeY.element)) {
                        continue;
                    }
                    let parent = (<T> nodeY.parent);
                    if (!nodeY.renderParent) {
                        if (!includesEnum(nodeY.excludeProcedure, NODE_PROCEDURE.CUSTOMIZATION)) {
                            nodeY.applyCustomizations();
                        }
                        const renderExtension = (<IExtension> parent.renderExtension);
                        if (renderExtension != null) {
                            renderExtension.setTarget(nodeY, parent);
                            const result = renderExtension.processChild();
                            renderXml(nodeY, parent, result.xml);
                            if (result.parent) {
                                parent = (<T> result.parent);
                            }
                            if (result.proceed) {
                                continue;
                            }
                        }
                        const rendered: IExtension[] = [];
                        let proceed = false;
                        this.orderExt(extensions, nodeY.element).some(item => {
                            if (item.is(nodeY)) {
                                item.setTarget(nodeY, parent);
                                if (item.condition()) {
                                    const result =  item.processNode(mapX, mapY);
                                    if (result.xml !== '') {
                                        renderXml(nodeY, parent, result.xml);
                                    }
                                    if (result.parent) {
                                        parent = (<T> result.parent);
                                    }
                                    if (result.xml !== '' || result.proceed) {
                                        rendered.push(item);
                                    }
                                    if (result.proceed) {
                                        proceed = true;
                                        return true;
                                    }
                                }
                            }
                            return false;
                        });
                        if (nodeY.renderExtension == null && rendered.length > 0) {
                            nodeY.renderExtension = rendered[0];
                        }
                        if (proceed) {
                            continue;
                        }
                        if (!nodeY.renderParent) {
                            let xml = '';
                            if (nodeY.nodeName === '') {
                                const inlineExclude = this.controllerHandler.inlineExclude;
                                if (nodeY.children.length === 0 || (!nodeY.documentRoot && inlineExclude.length > 0 && nodeY.cascade().every(node => inlineExclude.includes(node.element.tagName)))) {
                                    if (hasFreeFormText(nodeY.element) || (!SETTINGS.collapseUnattributedElements && !BLOCK_ELEMENT.includes(nodeY.element.tagName))) {
                                        xml += this.writeNode(nodeY, parent, NODE_STANDARD.TEXT);
                                    }
                                    else {
                                        if (SETTINGS.collapseUnattributedElements && nodeY.viewWidth === 0 && nodeY.viewHeight === 0) {
                                            continue;
                                        }
                                        else if (!nodeY.documentRoot) {
                                            xml += this.writeFrameLayout(nodeY, parent);
                                        }
                                    }
                                }
                                else {
                                    if (nodeY.flex.enabled || nodeY.children.some(node => !node.pageflow)) {
                                        xml += this.writeDefaultLayout(nodeY, parent);
                                    }
                                    else {
                                        if (nodeY.children.length === 1) {
                                            if (SETTINGS.collapseUnattributedElements && nodeY.viewWidth === 0 && nodeY.viewHeight === 0 && nodeY.marginTop === 0 && nodeY.marginRight === 0 && nodeY.marginBottom === 0 && nodeY.marginLeft === 0 && nodeY.paddingTop === 0 && nodeY.paddingRight === 0 && nodeY.paddingBottom === 0 && nodeY.paddingLeft === 0 && parseRGBA(nodeY.css('background')).length === 0 && Object.keys(nodeY.styleMap).length === 0 && !this.controllerHandler.hasAppendProcessing(nodeY.id)) {
                                                const child = nodeY.children[0];
                                                child.documentRoot = nodeY.documentRoot;
                                                child.parent = parent;
                                                nodeY.cascade().forEach(item => item.renderDepth--);
                                                nodeY.hide();
                                                axisY[k] = (<T> child);
                                                k--;
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
                                xml += this.writeNode(nodeY, parent, nodeY.nodeName);
                            }
                            renderXml(nodeY, parent, xml);
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
        if (extension == null || !hasValue(root.dataset.target)) {
            const pathname = trim(optional(root, 'dataset.folder').trim(), '/');
            this.updateLayout(pathname, (!empty ? output : ''), (extension != null && extension.documentRoot));
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
        if (node.children.length === 0) {
            return this.controllerHandler.renderNode(node, parent, NODE_STANDARD.FRAME);
        }
        else {
            return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.FRAME);
        }
    }

    public writeLinearLayout(node: T, parent: T, vertical: boolean) {
        return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.LINEAR, { vertical });
    }

    public writeGridLayout(node: T, parent: T, columns: number, rows: number = 0) {
        return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.GRID, { columns, rows });
    }

    public writeRelativeLayout(node: T, parent: T) {
        return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.RELATIVE);
    }

    public writeConstraintLayout(node: T, parent: T) {
        return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.CONSTRAINT);
    }

    public writeNode(node: T, parent: T, nodeName: number | string) {
        return this.controllerHandler.renderNode(node, parent, nodeName);
    }

    public writeDefaultLayout(node: T, parent: T) {
        if (SETTINGS.useConstraintLayout || node.flex.enabled) {
            return this.writeConstraintLayout(node, parent);
        }
        else {
            return this.writeRelativeLayout(node, parent);
        }
    }

    public addInsertQueue(id: string, views: string[]) {
        if (this.insert[id] == null) {
            this.insert[id] = [];
        }
        this.insert[id].push(...views);
    }

    public insertAuxillaryViews() {
        this.cacheInternal.list.forEach(node => {
            const extension = node.renderExtension;
            if (extension != null) {
                extension.setTarget(node);
                extension.beforeInsert();
            }
        });
        const template: StringMap = {};
        for (const id in this.insert) {
            let replaceId = id;
            if (!isNumber(id)) {
                const target = this.findByDomId(id);
                if (target != null) {
                    replaceId = target.id.toString();
                }
            }
            let output = this.insert[id].join('\n');
            if (replaceId !== id) {
                const target = this.cacheInternal.find(parseInt(replaceId));
                if (target != null) {
                    const depth = target.renderDepth + 1;
                    output = placeIndent(output, depth);
                    const pattern = /{@([0-9]+)}/g;
                    let match: Null<RegExpExecArray> = null;
                    let i = 0;
                    while ((match = pattern.exec(output)) != null) {
                        const node = this.cacheInternal.find(parseInt(match[1]));
                        if (node != null) {
                            if (i++ === 0) {
                                node.renderDepth = depth;
                            }
                            else {
                                node.renderDepth = node.parent.renderDepth + 1;
                            }
                        }
                    }
                }
            }
            template[replaceId] = output;
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

    public updateLayout(pathname = '', content: string, documentRoot = false) {
        pathname = pathname || 'res/layout';
        if (documentRoot && this.views.length > 0 && this.views[0].content === '') {
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
               !parent.flex.enabled &&
               (
                   !children.some(node => node.floating && node.css('clear') !== 'none') &&
                   (children.every(node => node.css('float') !== 'right') || children.every(node => node.css('float') === 'right')) &&
                   children.every(node => node.pageflow)
               );
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

    public addXmlNs(name: string, uri: string) {
        this.controllerHandler.addXmlNs(name, uri);
    }

    public findByDomId(id: string, current = false): Null<T> {
        return (current ? this.cache : this.cacheInternal).list.find(node => node.element.id === id || node.nodeId === id);
    }

    public toString() {
        return (this.views.length > 0 ? this.views[0].content : '');
    }

    private insertNode(element: HTMLElement, parent?: T) {
        let node: Null<T> = null;
        if (element.nodeName === '#text') {
            if (optional(element, 'textContent', 'string').trim() !== '') {
                node = new this.TypeT(this.cache.nextId, SETTINGS.targetAPI, element);
                node.tagName = 'PLAINTEXT';
                if (parent != null) {
                    node.parent = parent;
                    node.inherit(parent, 'style');
                    parent.children.push(node);
                }
                node.setBounds(false, element);
            }
        }
        else if (isVisible(element)) {
            node = new this.TypeT(this.cache.nextId, SETTINGS.targetAPI, element);
            if ((<any> element).__nodeIsolated) {
                node.isolated = true;
            }
            node.setExcludeProcedure();
            node.setExcludeResource();
        }
        if (node != null) {
            this.cache.list.push(node);
        }
        return node;
    }

    private orderExt(available: IExtension[], element: HTMLElement) {
        let extensions: string[] = [];
        let current: Null<HTMLElement> = element;
        while (current != null) {
            extensions = [...extensions, ...optional(current, 'dataset.ext').split(',').map(value => value.trim())];
            current = current.parentElement;
        }
        extensions = extensions.filter(value => value);
        if (extensions.length > 0) {
            const tagged: IExtension[] = [];
            const untagged: IExtension[] = [];
            available.forEach(item => {
                const index = extensions.indexOf(item.name);
                if (index !== -1) {
                    tagged[index] = item;
                }
                else {
                    untagged.push(item);
                }
            });
            return [...tagged.filter(item => item), ...untagged];
        }
        else {
            return available;
        }
    }

    set appName(value) {
        if (this.resourceHandler != null) {
            this.resourceHandler.file.appName = value;
        }
    }
    get appName() {
        return (this.resourceHandler != null ? this.resourceHandler.file.appName : '');
    }

    set current(value) {
        this.views[this.currentIndex] = value;
    }
    get current() {
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

    get viewData(): ViewData<T> {
        return { cache: this.cacheInternal.list, views: this.views, includes: this.includes };
    }

    get size() {
        return this.views.length + this.includes.length;
    }
}