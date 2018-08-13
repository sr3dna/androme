import { LayoutMap, Null, ObjectIndex, ObjectMap, PlainFile, ViewData } from '../lib/types';
import { IExtension } from '../extension/lib/types';
import Controller from './controller';
import Resource from './resource';
import Node from './node';
import NodeList from './nodelist';
import { convertCamelCase, convertInt, convertPX, formatPX, hasValue, includesEnum, isNumber, isPercent, optional, sortAsc, trim } from '../lib/util';
import { placeIndent } from '../lib/xml';
import { deleteCache, getCache, getNode, getStyle, hasFreeFormText, isLineBreak, isVisible, setCache } from '../lib/dom';
import { convertRGB, getByColorName } from '../lib/color';
import { BLOCK_ELEMENT, BOX_STANDARD, NODE_PROCEDURE, NODE_STANDARD, OVERFLOW_ELEMENT } from '../lib/constants';
import SETTINGS from '../settings';

export default class Application<T extends Node> {
    public cache: NodeList<T>;
    public cacheInternal: NodeList<T>;
    public controllerHandler: Controller<T>;
    public resourceHandler: Resource<T>;
    public elements: Set<HTMLElement> = new Set();
    public insert: ObjectIndex<string[]> = {};
    public closed = false;

    private sorted: ObjectIndex<number[]> = {};
    private views: PlainFile[] = [];
    private includes: PlainFile[] = [];
    private currentIndex = -1;
    private _extensions: IExtension[] = [];

    constructor(private TypeT: { new (id: number, api: number, element?: HTMLElement, options?: {}): T }) {
        this.cache = new NodeList<T>();
        this.cacheInternal = new NodeList<T>();
    }

    public registerController(controllerHandler: Controller<T>) {
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
        const visible = this.cacheInternal.visible;
        for (const node of visible) {
            if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.LAYOUT)) {
                node.setLayout();
            }
            if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.ALIGNMENT)) {
                node.setAlignment();
            }
        }
        for (const node of visible) {
            if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.OPTIMIZATION)) {
                node.applyOptimizations({ autoSizePaddingAndBorderWidth: SETTINGS.autoSizePaddingAndBorderWidth });
            }
            if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.CUSTOMIZATION)) {
                node.applyCustomizations(SETTINGS.customizationsOverwritePrivilege);
            }
        }
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
        for (const node of this.cacheInternal) {
            deleteCache(node.element, 'style', 'styleMap', 'boxSpacing', 'boxStyle', 'fontStyle', 'imageSource', 'optionArray', 'valueString');
        }
        this.cache.reset();
        this.cacheInternal.reset();
        this.resetController();
        this.resetResource();
        this.appName = '';
        this.sorted = {};
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
            const styleSheet = <CSSStyleSheet> document.styleSheets[i];
            if (styleSheet.cssRules != null) {
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    try {
                        const cssRule = <CSSStyleRule> styleSheet.cssRules[j];
                        const attrs: Set<string> = new Set();
                        for (const attr of Array.from(cssRule.style)) {
                            attrs.add(convertCamelCase(attr));
                        }
                        const elements = document.querySelectorAll(cssRule.selectorText);
                        if (this.appName !== '') {
                            Array.from(elements).forEach((element: HTMLElement) => deleteCache(element, 'style', 'styleMap'));
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
                                const cssStyle = cssRule.style[attr];
                                if (element.style[attr]) {
                                    styleMap[attr] = element.style[attr];
                                }
                                else if (style[attr] === cssStyle) {
                                    styleMap[attr] = style[attr];
                                }
                                else if (cssStyle) {
                                    switch (attr) {
                                        case 'width':
                                        case 'height':
                                        case 'marginTop':
                                        case 'marginRight':
                                        case 'marginBottom':
                                        case 'marginLeft':
                                            styleMap[attr] = (/^[\-A-za-z]+$/.test(<string> cssStyle) || isPercent(cssStyle) ? cssStyle : convertPX(cssStyle));
                                            break;
                                    }
                                }
                            }
                            const data = getCache(element, 'styleMap');
                            if (data != null) {
                                Object.assign(data, styleMap);
                            }
                            else {
                                setCache(element, 'style', style);
                                setCache(element, 'styleMap', styleMap);
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
        for (const extension of extensions) {
            extension.setTarget({} as T, undefined, root);
            extension.beforeInit();
        }
        const rootNode = this.insertNode(root);
        if (rootNode != null) {
            rootNode.parent = new this.TypeT(0, SETTINGS.targetAPI, root.parentElement || document.body);
            rootNode.documentRoot = true;
            this.cache.parent = rootNode;
        }
        else {
            return false;
        }
        for (const element of Array.from(elements) as HTMLElement[]) {
            if (!this.elements.has(element)) {
                this.orderExt(extensions, element).some(item => item.init(element));
                if (!this.elements.has(element)) {
                    const supportInline = this.controllerHandler.supportInline;
                    const styleMap = getCache(element, 'styleMap');
                    if ((!styleMap || Object.keys(styleMap).length === 0) && supportInline.includes(element.tagName) && element.parentElement && Array.from(element.parentElement.children).every(item => item.children.length === 0 && supportInline.includes(item.tagName))) {
                        setCache(element, 'supportInline', true);
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
            for (const node of this.cache) {
                const element = node.element;
                preAlignment[node.id] = {};
                const style = preAlignment[node.id];
                const textAlign = node.css('textAlign');
                switch (textAlign) {
                    case 'center':
                        if (element.tagName !== 'BUTTON' && (<HTMLInputElement> element).type === 'button') {
                            break;
                        }
                    case 'right':
                    case 'end':
                        style.textAlign = textAlign;
                        element.style.textAlign = 'left';
                        break;
                }
                if (node.position === 'relative') {
                    ['top', 'right', 'bottom', 'left'].forEach(value => {
                        if (node.styleMap[value] != null) {
                            style[value] = node.styleMap[value];
                            element.style[value] = '0px';
                        }
                    });
                }
                style.verticalAlign = node.styleMap.verticalAlign || '';
                element.style.verticalAlign = 'top';
                if (node.overflow !== OVERFLOW_ELEMENT.NONE) {
                    if (node.isSet('styleMap', 'width')) {
                        style.width = node.styleMap.width;
                        element.style.width = 'auto';
                    }
                    if (node.isSet('styleMap', 'height')) {
                        style.height = node.styleMap.height;
                        element.style.height = 'auto';
                    }
                    style.overflow = node.style.overflow;
                    element.style.overflow = 'visible';
                }
                node.setBounds();
            }
            for (const node of this.cache) {
                if (node.pageflow) {
                    const element = <HTMLInputElement> node.element;
                    if (element.tagName === 'INPUT' && !includesEnum(node.excludeProcedure, NODE_PROCEDURE.ACCESSIBILITY)) {
                        switch (element.type) {
                            case 'radio':
                            case 'checkbox':
                                const found = [element.previousElementSibling, element.nextElementSibling].some((sibling: HTMLLabelElement) => {
                                    if (sibling && sibling.htmlFor !== '' && sibling.htmlFor === element.id) {
                                        const label = getNode(sibling);
                                        if (label && label.pageflow) {
                                            node.companion = label;
                                            node.setBounds();
                                            label.hide();
                                            return true;
                                        }
                                    }
                                    return false;
                                });
                                if (!found) {
                                    const label = getNode(element.parentElement);
                                    if (label && label.element.tagName === 'LABEL' && label.element.children.length === 1) {
                                        node.companion = label;
                                        node.setBounds();
                                        label.hide();
                                    }
                                }
                                break;
                        }
                    }
                }
            }
            const visible = this.cache.visible;
            for (const node of visible) {
                if (!node.documentRoot) {
                    let parent = getNode(node.element.parentElement);
                    if (parent) {
                        if (!node.pageflow) {
                            let found = false;
                            let previous: Null<T> = null;
                            while (parent && parent.id !== 0) {
                                if (node.position === 'absolute') {
                                    const position = parent.position;
                                    if (!(position === 'static' || position === 'initial')) {
                                        found = true;
                                        break;
                                    }
                                }
                                else {
                                    if ((node.withinX(parent.box) && node.withinY(parent.box)) || (previous != null && ((node.linear.top >= parent.linear.top && node.linear.top < previous.linear.top) || (node.linear.right <= parent.linear.right && node.linear.right > previous.linear.right) || (node.linear.bottom <= parent.linear.bottom && node.linear.bottom > previous.linear.bottom) || (node.linear.left >= parent.linear.left && node.linear.left < previous.linear.left)))) {
                                        found = true;
                                        break;
                                    }
                                }
                                previous = parent as T;
                                parent = getNode(parent.element.parentElement) as T;
                            }
                            if (!found)  {
                                parent = this.cache.parent;
                            }
                        }
                        else {
                            if (parent === node.companion) {
                                const container = getNode(parent.element.parentElement);
                                if (container) {
                                    parent = container;
                                }
                            }
                        }
                        node.parent = parent;
                        parent.children.push(node);
                    }
                }
            }
            for (const node of visible) {
                const supportInline = this.controllerHandler.supportInline;
                const text: HTMLElement[] = [];
                let valid = true;
                Array.from(node.element.childNodes).forEach((element: HTMLElement) => {
                    if (element.nodeName === '#text') {
                        if (optional(element, 'textContent').trim() !== '') {
                            text.push(element);
                        }
                    }
                    else if (!supportInline.includes(element.tagName) || getNode(element)) {
                        valid = false;
                    }
                });
                if (!valid) {
                    text.forEach(element => this.insertNode(element, node));
                }
                if (node.children.some(current => current.pageflow && current.float !== 'right' && !['center', 'right'].includes(current.inheritCss('textAlign')) && (current.marginLeft < 0 && node.marginLeft >= Math.abs(current.marginLeft))) || node.children.some(current => !current.pageflow && (convertInt(current.left) < 0 && node.marginLeft >= Math.abs(convertInt(current.left))))) {
                    const marginLeft: number[] = [];
                    node.each(current => {
                        let left = current.marginLeft;
                        let leftType = 0;
                        if (current.pageflow) {
                            if (left < 0 && node.marginLeft >= left) {
                                leftType = 1;
                            }
                        }
                        else {
                            left = convertInt(current.left);
                            if (left < 0 && node.marginLeft >= left) {
                                current.css('left', formatPX(left + node.marginLeft));
                                leftType = 2;
                            }
                        }
                        marginLeft.push(leftType);
                    });
                    node.each((current, index: number) => {
                        if (current.pageflow) {
                            if (marginLeft.includes(1)) {
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + node.marginLeft, true);
                            }
                        }
                        else {
                            if (marginLeft[index] === 2) {
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + node.marginLeft, true);
                            }
                        }
                    });
                    if (Math.max.apply(null, marginLeft) > 0) {
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
            }
            for (const node of this.cache) {
                const style = preAlignment[node.id];
                if (style != null) {
                    for (const attr in style) {
                        node.element.style[attr] = style[attr];
                    }
                }
            }
            for (const extension of extensions) {
                extension.setTarget(rootNode);
                extension.afterInit();
            }
            for (const node of this.cache.elements) {
                let i = 0;
                Array.from(node.element.childNodes).forEach((element: HTMLElement) => {
                    const child = getNode(element);
                    if (child && child.visible) {
                        child.siblingIndex = i++;
                    }
                });
                sortAsc(node.children, 'siblingIndex');
            }
            this.cache.sortAsc('depth', 'parent.id', 'siblingIndex', 'id');
            this.addLayout(<string> root.dataset.viewName);
            return true;
        }
        return false;
    }

    public createLayoutXml() {
        const application = this;
        const extensions = this.extensions;
        const mapX: LayoutMap<T> = [];
        const mapY: LayoutMap<T> = [];
        let output = `<?xml version="1.0" encoding="utf-8"?>\n{:0}`;
        let empty = true;
        for (const node of this.cache.visible) {
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
        }
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
                const below: T[] = [];
                const middle: T[] = [];
                const above: T[] = [];
                let parent = (<T> this.cache.locate('id', parseInt(coordsY[j])));
                for (const node of mapY[i][coordsY[j]] as T[]) {
                    const zIndex = convertInt(node.css('zIndex'));
                    const documentParent = (node.parent.element === node.element.parentElement);
                    if (node.documentRoot) {
                        axisY.push(node);
                    }
                    else if (node.pageflow || (zIndex === 0 && documentParent)) {
                        middle.push(node);
                    }
                    else {
                        if (zIndex > 0 || !documentParent) {
                            above.push(node);
                        }
                        else {
                            below.push(node);
                        }
                    }
                }
                if (parent != null) {
                    this.sortLayout(parent, middle);
                }
                axisY.push(...sortAsc(below, 'style.zIndex', 'siblingIndex'));
                axisY.push(...middle);
                axisY.push(...sortAsc(above, 'style.zIndex', 'siblingIndex'));
                const includes: string[] = [];
                let current = '';
                for (let k = 0; k < axisY.length; k++) {
                    const nodeY = axisY[k];
                    if (!nodeY.documentRoot && this.elements.has(nodeY.element)) {
                        continue;
                    }
                    parent = nodeY.parent as T;
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
                        const renderExtension = (<IExtension> parent.renderExtension);
                        if (renderExtension != null) {
                            renderExtension.setTarget(nodeY, parent);
                            const result = renderExtension.processChild();
                            if (result.xml !== '') {
                                renderXml(nodeY, parent, result.xml, current);
                            }
                            if (result.parent) {
                                parent = result.parent as T;
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
                                        parent = result.parent as T;
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
                        const cleared = NodeList.cleared(axisY.slice(k));
                        if (!nodeY.rendered) {
                            if (SETTINGS.horizontalPerspective) {
                                const linearVertical = (parent.is(NODE_STANDARD.LINEAR) && !parent.horizontal);
                                if (nodeY.pageflow && !nodeY.inlineWrap && !hasValue(nodeY.dataset.target) && !parent.flex.enabled && !parent.inlineWrap && parent.styleMap.columnCount == null && (parent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE) || linearVertical)) {
                                    const horizontal = [nodeY];
                                    let vertical = [nodeY];
                                    for (let l = k + 1; l < axisY.length; l++) {
                                        const adjacent = axisY[l];
                                        if (adjacent.pageflow) {
                                            const previous = adjacent.previousSibling;
                                            if (previous != null) {
                                                if (isLineBreak(<Element> previous.element.nextSibling, 'next')) {
                                                    break;
                                                }
                                                else if (cleared.has(adjacent) ||
                                                        (adjacent.multiLine && !parent.is(NODE_STANDARD.RELATIVE)) ||
                                                        (horizontal.length > 1 && isLineBreak(<Element> adjacent.element.previousSibling)) ||
                                                        (!previous.floating && (previous.autoMargin || !adjacent.inlineElement)) ||
                                                        (!adjacent.floating && ((!previous.inlineElement && !previous.floating) || previous.autoMargin)) ||
                                                        (!previous.floating && adjacent.autoMargin) ||
                                                        (vertical.length > horizontal.length && NodeList.linearY([...vertical.slice(), ...[adjacent]])))
                                                {
                                                    if (horizontal.length > 1) {
                                                        if (linearVertical) {
                                                            for (let m = 1; m < horizontal.length; m++) {
                                                                if (isLineBreak(<Element> horizontal[m].element.previousSibling)) {
                                                                    horizontal.length = 1;
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                        break;
                                                    }
                                                    else if (linearVertical) {
                                                        break;
                                                    }
                                                    vertical.push(adjacent);
                                                    continue;
                                                }
                                            }
                                            if (isLineBreak(<Element> adjacent.element.previousSibling)) {
                                                if (!linearVertical) {
                                                    if (horizontal.length > 1) {
                                                        if (NodeList.linearY(horizontal)) {
                                                            vertical = horizontal.slice();
                                                            horizontal.length = 1;
                                                            continue;
                                                        }
                                                        else {
                                                            break;
                                                        }
                                                    }
                                                    else {
                                                        vertical.push(adjacent);
                                                        continue;
                                                    }
                                                }
                                            }
                                            if (!cleared.has(adjacent)) {
                                                const target = hasValue(adjacent.dataset.target);
                                                if (!target) {
                                                    horizontal.push(adjacent);
                                                }
                                                if (previous == null || ((previous.inlineElement && adjacent.inlineElement) || (previous.floating && !adjacent.inlineElement))) {
                                                    continue;
                                                }
                                                if (!NodeList.linearX(horizontal)) {
                                                    if (parent.is(NODE_STANDARD.CONSTRAINT) && NodeList.linearY(horizontal)) {
                                                        vertical = horizontal.slice();
                                                        horizontal.length = 1;
                                                    }
                                                    else {
                                                        if (!target) {
                                                            horizontal.pop();
                                                        }
                                                        break;
                                                    }
                                                }
                                            }
                                            else {
                                                break;
                                            }
                                        }
                                    }
                                    let group: Null<T> = null;
                                    let groupXml = '';
                                    if (horizontal.length > 1) {
                                        if (horizontal.length === parent.children.length) {
                                            parent.inlineWrap = true;
                                        }
                                        else {
                                            group = this.controllerHandler.createGroup(nodeY, horizontal, parent);
                                            if (horizontal.some(item => item.multiLine)) {
                                                groupXml = this.writeRelativeLayout(group, parent);
                                                group.inlineWrap = true;
                                            }
                                            else if (horizontal.some(item => item.floating || item.position === 'relative')) {
                                                groupXml = this.writeFrameLayoutGroup(group, parent, horizontal);
                                                parent.children = parent.children.filter((item: T) => !horizontal.includes(item));
                                                group.inlineWrap = true;
                                            }
                                            else {
                                                groupXml = this.writeLinearLayout(group, parent, true);
                                                this.sortLayout(group, <T[]> group.children, true);
                                            }
                                        }
                                    }
                                    else if (vertical.length > 1) {
                                        if (vertical.length === parent.children.length) {
                                            parent.inlineWrap = true;
                                        }
                                        else {
                                            group = this.controllerHandler.createGroup(nodeY, vertical, parent);
                                            groupXml = this.writeLinearLayout(group, parent, false);
                                            this.sortLayout(group, <T[]> group.children, true);
                                        }
                                    }
                                    if (group != null) {
                                        renderXml(group, parent, groupXml, current);
                                        parent = nodeY.parent as T;
                                    }
                                }
                            }
                            let xml = '';
                            if (nodeY.nodeName === '') {
                                const untargeted = nodeY.children.filter(node => !node.isSet('dataset', 'target'));
                                if (untargeted.length === 0) {
                                    if (hasFreeFormText(nodeY.element, 1) || (!SETTINGS.collapseUnattributedElements && !BLOCK_ELEMENT.includes(nodeY.element.tagName))) {
                                        xml = this.writeNode(nodeY, parent, NODE_STANDARD.TEXT);
                                    }
                                    else {
                                        if (SETTINGS.collapseUnattributedElements && nodeY.viewWidth === 0 && nodeY.viewHeight === 0) {
                                            continue;
                                        }
                                        else if (!nodeY.documentRoot) {
                                            xml = this.writeFrameLayout(nodeY, parent);
                                        }
                                    }
                                }
                                else {
                                    if (nodeY.flex.enabled || untargeted.some(node => !node.pageflow) || nodeY.styleMap.columnCount != null) {
                                        xml = this.writeConstraintLayout(nodeY, parent);
                                    }
                                    else {
                                        if (untargeted.length === 1) {
                                            if (SETTINGS.collapseUnattributedElements && Object.keys(nodeY.styleMap).length === 0 && !this.controllerHandler.hasAppendProcessing(nodeY.id)) {
                                                const child = untargeted[0];
                                                child.documentRoot = nodeY.documentRoot;
                                                child.parent = parent;
                                                nodeY.hide();
                                                axisY[k] = child as T;
                                                k--;
                                            }
                                            else {
                                                xml = this.writeFrameLayout(nodeY, parent);
                                            }
                                        }
                                        else {
                                            const [linearX, linearY] = [NodeList.linearX(nodeY.children), NodeList.linearY(nodeY.children)];
                                            if (!parent.flex.enabled && nodeY.children.every(node => node.pageflow)) {
                                                const float = new Set(nodeY.children.map(node => node.float));
                                                if (linearX) {
                                                    if (float.size === 1 && !nodeY.children.some(node => node.multiLine)) {
                                                        xml = this.writeLinearLayout(nodeY, parent, true);
                                                    }
                                                    else if (nodeY.children.some(node => node.floating)) {
                                                        const group = this.controllerHandler.createGroup(nodeY, <T[]> nodeY.children, parent, nodeY.element);
                                                        xml = this.writeFrameLayoutGroup(group, parent, <T[]> nodeY.children);
                                                        group.inlineWrap = true;
                                                    }
                                                }
                                                else {
                                                    const blockClear = NodeList.cleared(nodeY.children);
                                                    if ((linearY && nodeY.children.every(node => node.pageflow)) || nodeY.children.some((node: T) => !node.inlineElement || blockClear.has(node)) && !nodeY.children.some(node => node.autoMargin)) {
                                                        xml = this.writeLinearLayout(nodeY, parent, false);
                                                    }
                                                }
                                            }
                                            if (xml === '') {
                                                if (SETTINGS.horizontalPerspective && nodeY.children.every((node: T) => node.pageflow && node.inlineElement && !cleared.has(node))) {
                                                    xml = this.writeRelativeLayout(nodeY, parent);
                                                }
                                                else {
                                                    xml = this.writeConstraintLayout(nodeY, parent);
                                                    nodeY.inlineWrap = (!linearX && linearY);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                xml = this.writeNode(nodeY, parent, nodeY.nodeName);
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
                const content: string[] = [];
                if (this.sorted[id] != null) {
                    const parsed: string[] = [];
                    this.sorted[id].forEach(value => {
                        const result: string = views.find((view: string) => view.indexOf(`{@${value}}`) !== -1);
                        if (result) {
                            parsed.push(result);
                        }
                    });
                    if (parsed.length === views.length) {
                        content.push(...parsed);
                    }
                }
                if (content.length === 0) {
                    content.push(...views);
                }
                const placeholder = `{:${id}}`;
                if (output.indexOf(placeholder) !== -1) {
                    output = output.replace(placeholder, content.join('') + placeholder);
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
        const root = this.cache.parent as T;
        if (root.renderExtension == null || !root.isSet('dataset', 'target')) {
            const pathname: string = trim(optional(root, 'dataset.folder').trim(), '/');
            this.updateLayout(pathname, (!empty ? output : ''), (root.renderExtension != null && root.renderExtension.documentRoot));
        }
        else {
            this.views.pop();
        }
        if (!empty) {
            for (const extension of extensions) {
                extension.setTarget(root);
                extension.afterRender();
            }
        }
        else if (root.renderExtension == null) {
            root.visible = false;
        }
        this.cacheInternal.append(...this.cache);
    }

    public writeFrameLayout(node: T, parent: T, children = false) {
        if (node.children.length === 0 && !children) {
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

    public writeFrameLayoutGroup(group: T, parent: T, nodes: T[]) {
        let xml = '';
        const [floated, pageflow] = new NodeList(nodes).partition(item => item.floating || item.styleMap.marginLeft === 'auto' || item.styleMap.marginRight === 'auto');
        const [right, left] = new NodeList(floated.list).partition(item => item.float === 'right' || item.styleMap.marginLeft === 'auto');
        const [linearX, linearY] = [pageflow.linearX, pageflow.linearY];
        if (pageflow.length > 1 && !linearX && !linearY) {
            xml = this.writeConstraintLayout(group, parent);
            group.inlineWrap = true;
        }
        else {
            const merged: T[] = [...left.list, ...pageflow.list];
            if (merged.length === nodes.length) {
                xml = this.writeLinearLayout(group, parent, true);
                this.sortLayout(group, <T[]> group.children, true);
            }
            else {
                xml = this.writeFrameLayout(group, parent, true);
                const placeholder = `{:${group.id}}`;
                [merged, right.list].forEach((item, index) => {
                    if (item.length > 1) {
                        const linearGroup = this.controllerHandler.createGroup(item[0], item, group);
                        xml = xml.replace(placeholder, (index === 0 ? '' : placeholder) + this.writeLinearLayout(linearGroup, group, item.every(node => node.inlineElement)) + (index === 0 ? placeholder : ''));
                        this.sortLayout(linearGroup, item, true);
                    }
                    else if (item.length > 0) {
                        item[0].inlineWrap = true;
                    }
                });
            }
        }
        return xml;
    }

    public addInsertQueue(id: string, views: string[]) {
        if (this.insert[id] == null) {
            this.insert[id] = [];
        }
        this.insert[id].push(...views);
    }

    public insertAuxillaryViews() {
        for (const node of this.cacheInternal) {
            const extension = node.renderExtension;
            if (extension != null) {
                extension.setTarget(node);
                extension.beforeInsert();
            }
        }
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
                const target = this.cacheInternal.locate('id', parseInt(replaceId));
                if (target != null) {
                    const depth = target.renderDepth + 1;
                    output = placeIndent(output, depth);
                    const pattern = /{@([0-9]+)}/g;
                    let match: Null<RegExpExecArray> = null;
                    let i = 0;
                    while ((match = pattern.exec(output)) != null) {
                        const node = this.cacheInternal.locate('id', parseInt(match[1]));
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
        for (const value of this.layouts) {
            for (const id in template) {
                value.content = value.content.replace(`{:${id}}`, template[id]);
            }
            value.content = this.controllerHandler.insertAuxillaryViews(value.content);
        }
        for (const node of this.cacheInternal) {
            const extension = node.renderExtension;
            if (extension != null) {
                extension.setTarget(node);
                extension.afterInsert();
            }
        }
    }

    public setAttributes() {
        this.controllerHandler.setAttributes(this.viewData);
        for (const node of this.cacheInternal) {
            const extension = node.renderExtension;
            if (extension != null) {
                extension.setTarget(node);
                extension.finalize();
            }
        }
    }

    public addLayout(value: string) {
        this.currentIndex = this.views.length;
        this.views.push({
            filename: value,
            pathname: '',
            content: ''
        });
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

    public sortLayout(parent: T, children: T[], save = false) {
        let sorted = false;
        switch (parent.nodeType) {
            case NODE_STANDARD.CONSTRAINT:
                children.sort((a, b) => {
                    const indexA = a.css('zIndex');
                    const indexB = b.css('zIndex');
                    if ((indexA === 'auto' || indexA === '' || indexA === '0') && (indexB === 'auto' || indexB === '' || indexB === '0')) {
                        return (a.siblingIndex < b.siblingIndex ? -1 : 1);
                    }
                    else {
                        return (convertInt(indexA) <= convertInt(indexB) ? -1 : 1);
                    }
                });
                sorted = true;
                break;
            case NODE_STANDARD.LINEAR:
                if (parent.horizontal) {
                    if (children.some(node => node.floating)) {
                        children.sort((a, b) => {
                            if (a.floating && !b.floating) {
                                return (a.float === 'left' ? -1 : 1);
                            }
                            else if (!a.floating && b.floating) {
                                return (b.float === 'left' ? 1 : -1);
                            }
                            else if (a.floating && b.floating) {
                                if (a.float !== b.float) {
                                    return (a.float === 'left' ? -1 : 1);
                                }
                            }
                            return (a.linear.left <= b.linear.left ? -1 : 1);
                        });
                        sorted = true;
                    }
                }
                break;
        }
        if (save && sorted) {
            this.sorted[parent.id] = children.map(item => item.id);
        }
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

    public findByDomId(id: string, current = false) {
        return (current ? this.cache : this.cacheInternal).locate(node => node.element.id === id || node.nodeId === id);
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
                node.styleMap.cssFloat = 'none';
                node.styleMap.clear = 'none';
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
            if (getCache(element, 'nodeIsolated')) {
                node.isolated = true;
            }
            node.setExcludeProcedure();
            node.setExcludeResource();
        }
        if (node != null) {
            this.cache.append(node);
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
            for (const item of available) {
                const index = extensions.indexOf(item.name);
                if (index !== -1) {
                    tagged[index] = item;
                }
                else {
                    untagged.push(item);
                }
            }
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

    get viewData(): ViewData<NodeList<T>> {
        return { cache: this.cacheInternal, views: this.views, includes: this.includes };
    }

    get size() {
        return this.views.length + this.includes.length;
    }
}