import { ArrayIndex, Null, ObjectIndex, ObjectMap, PlainFile, ViewData } from '../lib/types';
import { IExtension } from '../extension/lib/types';
import Controller from './controller';
import Resource from './resource';
import Node from './node';
import NodeList from './nodelist';
import { convertCamelCase, convertInt, formatPX, hasValue, includesEnum, isNumber, optional, sortAsc, trim } from '../lib/util';
import { placeIndent } from '../lib/xml';
import { getStyle, hasFreeFormText, isVisible } from '../lib/dom';
import { convertRGB, getByColorName, parseRGBA } from '../lib/color';
import { BLOCK_ELEMENT, BOX_STANDARD, NODE_PROCEDURE, NODE_STANDARD, OVERFLOW_ELEMENT } from '../lib/constants';
import SETTINGS from '../settings';

export default class Application<T extends Node, U extends NodeList<T>> {
    public cache: U;
    public cacheInternal: U;
    public controllerHandler: Controller<T, U>;
    public resourceHandler: Resource<T>;
    public elements: Set<HTMLElement> = new Set();
    public insert: ObjectIndex<string[]> = {};
    public closed = false;

    private views: PlainFile[] = [];
    private includes: PlainFile[] = [];
    private currentIndex = -1;
    private _extensions: IExtension[] = [];

    constructor(
        private TypeT: { new (id: number, api: number, element?: HTMLElement, options?: {}): T },
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
            if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.LAYOUT)) {
                node.setLayout();
            }
            if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.ALIGNMENT)) {
                node.setAlignment();
            }
        });
        this.cacheInternal.visible.forEach(node => {
            if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.OPTIMIZE)) {
                node.optimizeLayout();
            }
        });
        this.controllerHandler.setDimensions(this.viewData);
        this.insertAuxillaryViews();
        this.resourceHandler.finalize(this.viewData);
        this.resourceHandler.filterStyles(this.viewData);
        if (SETTINGS.showAttributes) {
            this.setAttributes();
        }
        this.controllerHandler.finalize(this.layouts);
        this.closed = true;
    }

    public reset() {
        this.cacheInternal.list.forEach(node => {
            const object: any = node.element;
            delete object.__style;
            delete object.__styleMap;
            delete object.__boxSpacing;
            delete object.__boxStyle;
            delete object.__fontStyle;
            delete object.__imageSource;
            delete object.__optionArray;
            delete object.__valueString;
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
        this.closed = false;
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
        this.resourceHandler.setBoxStyle();
        this.resourceHandler.setFontStyle();
        this.resourceHandler.setBoxSpacing();
        this.resourceHandler.setValueString(this.controllerHandler.supportInline);
        this.resourceHandler.setOptionArray();
        this.resourceHandler.setImageSource();
    }

    public setStyleMap() {
        let warning = false;
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = (<CSSStyleSheet> document.styleSheets[i]);
            if (styleSheet.cssRules != null) {
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    try {
                        const cssRule = (<CSSStyleRule> styleSheet.cssRules[j]);
                        const attrs: Set<string> = new Set();
                        for (const attr of Array.from(cssRule.style)) {
                            attrs.add(convertCamelCase(attr));
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
                                attrs.add(convertCamelCase(attr));
                            }
                            const style = getStyle(element);
                            const styleMap = {};
                            for (const attr of attrs) {
                                if (attr.toLowerCase().indexOf('color') !== -1) {
                                    const color = getByColorName(cssRule.style[attr]);
                                    if (color !== '') {
                                        cssRule.style[attr] = convertRGB(color);
                                    }
                                }
                                if (hasValue(element.style[attr])) {
                                    styleMap[attr] = element.style[attr];
                                }
                                else if (style[attr] === cssRule.style[attr]) {
                                    styleMap[attr] = style[attr];
                                }
                                else if (hasValue(cssRule.style[attr])) {
                                    switch (attr) {
                                        case 'width':
                                        case 'height':
                                            styleMap[attr] = cssRule.style[attr];
                                            break;
                                    }
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
                    catch (error) {
                        if (!warning) {
                            alert('External CSS files cannot be parsed when loading this program from your hard drive with Chrome 64+ (file://). Either use a local web ' +
                                  'server (http://), embed your CSS files into a <style> tag, or use a different browser. See the README for further instructions.\n\n' +
                                  `${styleSheet.href}\n\n${error}`);
                            warning = true;
                        }
                    }
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
                    const supportInline = this.controllerHandler.supportInline;
                    if (supportInline.includes(element.tagName) && ((element.children.length === 0 && !hasFreeFormText(element)) || (element.parentElement != null  && supportInline.includes(element.parentElement.tagName) && getStyle(element).display === 'inline' && getStyle(element.parentElement).display === 'inline'))) {
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
                const textAlign = node.css('textAlign');
                switch (textAlign) {
                    case 'center':
                        if (node.tagName !== 'BUTTON' && (<HTMLInputElement> element).type === 'button') {
                            break;
                        }
                    case 'right':
                    case 'end':
                        style.textAlign = textAlign;
                        element.style.textAlign = 'left';
                        break;
                }
                style.verticalAlign = node.styleMap.verticalAlign || '';
                element.style.verticalAlign = 'top';
                if (node.overflow !== OVERFLOW_ELEMENT.NONE) {
                    if (node.isSet('styleMap', 'width')) {
                        style.width = node.styleMap.width;
                        element.style.width = '';
                    }
                    if (node.isSet('styleMap', 'height')) {
                        style.height = node.styleMap.height;
                        element.style.height = '';
                    }
                    style.overflow = node.style.overflow;
                    element.style.overflow = 'visible';
                }
                node.setBounds();
            });
            this.cache.list.forEach(node => {
                const element = (<HTMLInputElement> node.element);
                if (element.tagName === 'INPUT' && !includesEnum(node.excludeProcedure, NODE_PROCEDURE.ACCESSIBILITY)) {
                    switch (element.type) {
                        case 'radio':
                        case 'checkbox':
                            [element.previousElementSibling, element.nextElementSibling].some((sibling: HTMLLabelElement) => {
                                if (sibling && sibling.htmlFor !== '' && sibling.htmlFor === element.id) {
                                    const label = (<any> sibling).__node;
                                    if (label != null) {
                                        node.companion = label;
                                        node.setBounds();
                                        label.hide();
                                        return true;
                                    }
                                }
                                return false;
                            });
                            break;
                    }
                }
            });
            const visible = this.cache.visible;
            visible.forEach(parent => {
                visible.forEach(child => {
                    if (parent !== child) {
                        const parentElement = child.element.parentElement;
                        if (parentElement === parent.element) {
                            child.parent = parent;
                            parent.children.push(child);
                        }
                    }
                });
            });
            visible.forEach(node => {
                const supportInline = this.controllerHandler.supportInline;
                if (supportInline.length === 0 || node.children.some(item => item.children.length > 0 || !item.pageflow || !supportInline.includes(item.tagName))) {
                    Array.from(node.element.childNodes).forEach((element: HTMLElement) => {
                        if (element.nodeName === '#text' && optional(element, 'textContent').trim() !== '') {
                            this.insertNode(element, node);
                        }
                    });
                }
                if (node.children.some(current => current.float !== 'right' && (current.marginLeft < 0 && node.marginLeft >= Math.abs(current.marginLeft))) || node.children.some(current => !current.pageflow && (convertInt(current.left) < 0 && node.marginLeft >= Math.abs(convertInt(current.left))))) {
                    const marginLeft: number[] = [];
                    node.children.forEach(current => {
                        let left = current.marginLeft;
                        let leftType = 0;
                        if (left < 0 && node.marginLeft >= left) {
                            leftType = 1;
                        }
                        if (!current.pageflow) {
                            if (leftType === 0) {
                                left = convertInt(current.left);
                                if (left < 0 && node.marginLeft >= left) {
                                    current.css('left', formatPX(left + node.marginLeft));
                                    leftType = 2;
                                }
                            }
                        }
                        marginLeft.push(leftType);
                    });
                    const marginLeftType = Math.max.apply(null, marginLeft);
                    node.children.forEach((current, index) => {
                        if (marginLeftType && marginLeft[index] !== 2 && ((marginLeftType === 1 && marginLeft[index] === 1) || marginLeftType === 2)) {
                            current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + node.marginLeft);
                        }
                    });
                    if (marginLeftType) {
                        node.box.left -= node.marginLeft;
                        node.css('marginLeft', '0px');
                    }
                    node.setDimensions(['box']);
                }
                if (!node.pageflow && node.children.length > 0) {
                    let calibrate = false;
                    if (node.viewWidth === 0) {
                        const maxRight = Math.max.apply(null, node.cascade().map(item => item.linear.right));
                        node.bounds.right = maxRight + node.paddingRight + node.borderRightWidth;
                        node.bounds.width = node.bounds.right - node.bounds.left;
                        calibrate = true;
                    }
                    if (node.viewHeight === 0) {
                        const maxBottom = Math.max.apply(null, node.cascade().map(item => item.linear.bottom));
                        node.bounds.bottom = maxBottom + node.paddingBottom + node.borderBottomWidth;
                        node.bounds.height = node.bounds.bottom - node.bounds.top;
                        calibrate = true;
                    }
                    if (calibrate) {
                        node.setBounds(true);
                    }
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
            this.cache.elements.forEach(node => {
                let i = 0;
                Array.from(node.element.childNodes).forEach((element: HTMLElement) => {
                    const child = (<T> (<any> element).__node);
                    if (child && child.visible && child.parent.element === node.element) {
                        child.parentIndex = i++;
                    }
                });
                sortAsc(node.children, 'parentIndex');
            });
            this.cache.sortAsc('depth', 'parent.id', 'parentIndex', 'id');
            this.addLayout(<string> root.dataset.viewName);
            return true;
        }
        return false;
    }

    public createLayoutXml() {
        const application = this;
        const extensions = this.extensions;
        const mapX: ArrayIndex<ObjectIndex<T[]>> = [];
        const mapY: ArrayIndex<ObjectIndex<T[]>> = [];
        let output = `<?xml version="1.0" encoding="utf-8"?>\n{:0}`;
        let empty = true;
        this.cache.visible.forEach(node => {
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
            const external = new Map();
            function renderXml(node: T, parent: T, xml: string, current = '') {
                if (xml !== '') {
                    if (current === '' && !application.elements.has(node.element)) {
                        if (node.isSet('dataset', 'target')) {
                            const target = application.findByDomId(<string> node.dataset.target, true);
                            if (target == null || target !== parent) {
                                application.addInsertQueue(<string> node.dataset.target, [xml]);
                                node.relocated = true;
                                return;
                            }
                        }
                        else if (parent.isSet('dataset', 'target')) {
                            application.addInsertQueue(parent.nodeId, [xml]);
                            node.dataset.target = parent.nodeId;
                            return;
                        }
                    }
                    if (current !== '') {
                        if (!external.has(current)) {
                            external.set(current, []);
                        }
                        external.get(current).push(xml);
                    }
                    else {
                        if (!partial.has(parent.id)) {
                            partial.set(parent.id, []);
                        }
                        partial.get(parent.id).push(xml);
                    }
                }
            }
            for (let j = 0; j < coordsY.length; j++) {
                const axisY: T[] = [];
                const layers: T[] = [];
                for (const node of (<T[]> mapY[i][coordsY[j]])) {
                    if (!node.pageflow && convertInt(node.css('zIndex')) > 0) {
                        layers.push(node);
                    }
                    else {
                        axisY.push(node);
                    }
                }
                if (!axisY.some(node => node.multiLine)) {
                    axisY.sort((a, b) => {
                        if (!a.parent.flex.enabled && !b.parent.flex.enabled) {
                            if (a.intersectX(b.linear)) {
                                return (a.linear.left <= b.linear.left ? -1 : 1);
                            }
                            else {
                                return (a.linear.top <= b.linear.top ? -1 : 1);
                            }
                        }
                        return (a.parentIndex < b.parentIndex ? -1 : 1);
                    });
                }
                axisY.push(...sortAsc(layers, 'style.zIndex', 'parentIndex'));
                const includes: string[] = [];
                let current = '';
                for (let k = 0; k < axisY.length; k++) {
                    const nodeY = axisY[k];
                    if (!nodeY.documentRoot && this.elements.has(nodeY.element)) {
                        continue;
                    }
                    let parent = (<T> nodeY.parent);
                    if (SETTINGS.horizontalPerspective && nodeY.pageflow && !parent.flex.enabled && (parent.is(NODE_STANDARD.CONSTRAINT) || (parent.is(NODE_STANDARD.RELATIVE) && !parent.inlineWrap) || (parent.is(NODE_STANDARD.LINEAR) && !parent.horizontal))) {
                        const nodes = [nodeY];
                        if (nodeY.element.nextSibling == null || (<Element> nodeY.element.nextSibling).tagName !== 'BR') {
                            const float = nodeY.float;
                            for (let l = k + 1; l < axisY.length; l++) {
                                const adjacent = axisY[l];
                                const previous = nodes[nodes.length - 1];
                                if (!previous.inline && !adjacent.inline && !adjacent.floating) {
                                    break;
                                }
                                const nextTo = adjacent[(float === 'right' ? 'toLeftOf' : 'toRightOf')](previous, SETTINGS.whitespaceHorizontalOffset);
                                if ((adjacent.pageflow && float === adjacent.float) || nextTo) {
                                    nodes.push(adjacent);
                                    if (adjacent.element.nextSibling && (<Element> adjacent.element.nextSibling).tagName === 'BR') {
                                        break;
                                    }
                                    else if (!nextTo && ((!adjacent.inline && !adjacent.floating) || (nodes.every(item => item.hasElement) && !NodeList.linearX(nodes, SETTINGS.linearHorizontalTopOffset)))) {
                                        nodes.pop();
                                        break;
                                    }
                                }
                            }
                        }
                        if (parent.inlineWrap || nodes.length > 1) {
                            if (parent.is(NODE_STANDARD.RELATIVE) && nodes.length === parent.children.length) {
                                parent.inlineWrap = true;
                            }
                            else {
                                if (nodes.length > 1) {
                                    let xml = '';
                                    const viewGroup = this.controllerHandler.createGroup(nodeY, parent, nodes);
                                    if (nodes.some(item => item.multiLine)) {
                                        viewGroup.inlineWrap = true;
                                        xml = this.writeRelativeLayout(viewGroup, parent);
                                    }
                                    else {
                                        xml = this.writeLinearLayout(viewGroup, parent, true);
                                        viewGroup.inlineWrap = (nodeY.float === 'right');
                                    }
                                    renderXml(viewGroup, parent, xml, current);
                                    parent = viewGroup;
                                }
                                else {
                                    nodeY.multiLine = false;
                                }
                            }
                        }
                    }
                    if (this.controllerHandler.supportInclude) {
                        const filename: string = optional(nodeY, 'dataset.include').trim();
                        if (filename !== '' && includes.indexOf(filename) === -1) {
                            renderXml(nodeY, parent, this.controllerHandler.renderInclude(nodeY, parent, filename), (includes.length > 0 ? includes[includes.length - 1] : ''));
                            includes.push(filename);
                        }
                        current = (includes.length > 0 ? includes[includes.length - 1] : '');
                        if (current !== '') {
                            const cloneParent = (<T> parent.clone());
                            cloneParent.renderDepth = this.controllerHandler.getIncludeRenderDepth(current);
                            nodeY.parent = cloneParent;
                            parent = cloneParent;
                        }
                    }
                    if (!nodeY.rendered) {
                        if (!includesEnum(nodeY.excludeProcedure, NODE_PROCEDURE.CUSTOMIZATION)) {
                            nodeY.applyCustomizations();
                        }
                        const renderExtension = (<IExtension> parent.renderExtension);
                        if (renderExtension != null) {
                            renderExtension.setTarget(nodeY, parent);
                            const result = renderExtension.processChild();
                            if (result.xml !== '') {
                                renderXml(nodeY, parent, result.xml, current);
                            }
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
                                        renderXml(nodeY, parent, result.xml, current);
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
                        if (!nodeY.rendered) {
                            let xml = '';
                            if (nodeY.nodeName === '') {
                                const supportInline = this.controllerHandler.supportInline;
                                if (nodeY.untargeted.length === 0 || (!nodeY.documentRoot && supportInline.length > 0 && nodeY.children.every(node => node.inline && node.children.length === 0 && supportInline.includes(node.tagName)))) {
                                    if (hasFreeFormText(nodeY.element, 1) || (!SETTINGS.collapseUnattributedElements && !BLOCK_ELEMENT.includes(nodeY.tagName))) {
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
                                    if (nodeY.flex.enabled || nodeY.untargeted.some(node => !node.pageflow)) {
                                        xml += this.writeDefaultLayout(nodeY, parent);
                                    }
                                    else {
                                        if (nodeY.untargeted.length === 1) {
                                            if (SETTINGS.collapseUnattributedElements && nodeY.viewWidth === 0 && nodeY.viewHeight === 0 && nodeY.marginTop === 0 && nodeY.marginRight === 0 && nodeY.marginBottom === 0 && nodeY.marginLeft === 0 && nodeY.paddingTop === 0 && nodeY.paddingRight === 0 && nodeY.paddingBottom === 0 && nodeY.paddingLeft === 0 && parseRGBA(nodeY.css('background')).length === 0 && Object.keys(nodeY.styleMap).length === 0 && !this.controllerHandler.hasAppendProcessing(nodeY.id)) {
                                                const child = nodeY.untargeted[0];
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
                                            const [linearX, linearY] = [NodeList.linearX(nodeY.children, SETTINGS.linearHorizontalTopOffset), NodeList.linearY(nodeY.children)];
                                            if (this.isLinearXY(linearX, linearY, nodeY, <T[]> nodeY.children)) {
                                                xml += this.writeLinearLayout(nodeY, parent, linearX);
                                            }
                                            else if (SETTINGS.horizontalPerspective && nodeY.children.every(node => node.pageflow && node.inline)) {
                                                xml += this.writeRelativeLayout(nodeY, parent);
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
                            renderXml(nodeY, parent, xml, current);
                        }
                    }
                    if (this.controllerHandler.supportInclude) {
                        if (includes.length > 0 && optional(nodeY, 'dataset.includeEnd') === 'true') {
                            includes.pop();
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
            for (const [current, views] of external.entries()) {
                const xml = this.controllerHandler.renderIncludeContent(current, views);
                this.addInclude(current, xml);
            }
        }
        const root = (<T> this.cache.parent);
        const extension = (<IExtension> root.renderExtension);
        if (extension == null || !root.isSet('dataset', 'target')) {
            const pathname: string = trim(optional(root, 'dataset.folder').trim(), '/');
            this.updateLayout(pathname, (!empty ? output : ''), (extension && extension.documentRoot));
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

    public writeLinearLayout(node: T, parent: T, horizontal: boolean) {
        return this.controllerHandler.renderGroup(node, parent, NODE_STANDARD.LINEAR, { horizontal });
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
        const template = {};
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
                    template[inner] = template[inner].replace(`{:${outer}}`, template[outer]);
                    template[outer] = template[outer].replace(`{:${inner}}`, template[inner]);
                }
            }
        }
        this.layouts.forEach(value => {
            for (const id in template) {
                value.content = value.content.replace(`{:${id}}`, template[id]);
            }
            value.content = this.controllerHandler.insertAuxillaryViews(value.content);
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
        return ((linearX || linearY) && !parent.flex.enabled && children.every(node => node.pageflow && !node.multiLine) && children.every(node => children[0].float === node.float));
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
                node.setBounds();
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