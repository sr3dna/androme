import { LayoutMap, Null, ObjectIndex, ObjectMap, PlainFile, ViewData } from '../lib/types';
import { IExtension } from '../extension/lib/types';
import Controller from './controller';
import Resource from './resource';
import Node from './node';
import NodeList from './nodelist';
import { convertCamelCase, convertInt, convertPX, formatPX, includesEnum, isNumber, isPercent, optional, sortAsc, trim } from '../lib/util';
import { placeIndent } from '../lib/xml';
import { cssParent, deleteCache, getCache, getNode, getStyle, hasFreeFormText, isLineBreak, isVisible, setCache } from '../lib/dom';
import { convertRGB, getByColorName } from '../lib/color';
import { BOX_STANDARD, NODE_ALIGNMENT, NODE_PROCEDURE, NODE_RESOURCE, NODE_STANDARD, OVERFLOW_ELEMENT } from '../lib/constants';
import SETTINGS from '../settings';

export default class Application<T extends Node> {
    public cache: NodeList<T>;
    public cacheInternal: NodeList<T>;
    public controllerHandler: Controller<T>;
    public resourceHandler: Resource<T>;
    public elements: Set<HTMLElement> = new Set();
    public extensions: IExtension[] = [];
    public insert: ObjectIndex<string[]> = {};
    public closed = false;

    private _views: PlainFile[] = [];
    private _includes: PlainFile[] = [];
    private _sorted: ObjectMap<number[]> = {};
    private _currentIndex = -1;

    constructor(private _TypeT: { new (id: number, api: number, element?: HTMLElement, options?: {}): T }) {
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
        const found = this.getExtension(extension.name);
        if (found) {
            if (Array.isArray(extension.tagNames)) {
                found.tagNames = extension.tagNames;
            }
            Object.assign(found.options, extension.options);
        }
        else {
            if (extension.dependencies.every(item => this.getExtension(item.name) != null)) {
                extension.application = this;
                this.extensions.push(extension);
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
        this.resourceHandler.combineStyles(this.viewData);
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
        this.insert = {};
        this._sorted = {};
        this._views = [];
        this._includes = [];
        this._currentIndex = -1;
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
        this.resourceHandler.setValueString();
        this.resourceHandler.setOptionArray();
        this.resourceHandler.setImageSource();
    }

    public setStyleMap() {
        let warning = false;
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = <CSSStyleSheet> document.styleSheets[i];
            if (styleSheet.cssRules) {
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
                                        case 'lineHeight':
                                        case 'verticalAlign':
                                        case 'fontSize':
                                        case 'marginTop':
                                        case 'marginRight':
                                        case 'marginBottom':
                                        case 'marginLeft':
                                        case 'paddingTop':
                                        case 'paddingRight':
                                        case 'paddingBottom':
                                        case 'paddingLeft':
                                            styleMap[attr] = (/^[A-Za-z\-]+$/.test(<string> cssStyle) || isPercent(cssStyle) ? cssStyle : convertPX(cssStyle));
                                            break;
                                        default:
                                            if (styleMap[attr] == null) {
                                                styleMap[attr] = cssStyle;
                                            }
                                            break;
                                    }
                                }
                            }
                            const data = getCache(element, 'styleMap');
                            if (data) {
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
                    if ((optional(item, 'textContent') as string).trim() !== '') {
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
        for (const ext of this.extensions) {
            ext.setTarget(<T> {}, undefined, root);
            ext.beforeInit();
        }
        const rootNode = this.insertNode(root);
        if (rootNode) {
            rootNode.parent = new this._TypeT(0, SETTINGS.targetAPI, root.parentElement || document.body);
            rootNode.documentRoot = true;
            this.cache.parent = rootNode;
        }
        else {
            return false;
        }
        const supportInline = this.controllerHandler.supportInline;
        function inlineElement(element: Element) {
            const styleMap = getCache(element, 'styleMap');
            return ((!styleMap || Object.keys(styleMap).length === 0) && supportInline.includes(element.tagName) && element.children.length === 0);
        }
        for (const element of Array.from(elements) as HTMLElement[]) {
            if (!this.elements.has(element)) {
                this.orderExt(this.extensions, element).some(item => item.init(element));
                if (!this.elements.has(element)) {
                    if (inlineElement(element) && element.parentElement && Array.from(element.parentElement.children).every(item => inlineElement(item))) {
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
                        if (element.tagName === 'BUTTON' || (<HTMLInputElement> element).type === 'button') {
                            break;
                        }
                    case 'right':
                    case 'end':
                        style.textAlign = textAlign;
                        element.style.textAlign = 'left';
                        break;
                }
                if (node.marginTop < 0) {
                    style.marginTop = node.css('marginTop');
                    element.style.marginTop = '0px';
                }
                if (node.position === 'relative') {
                    ['top', 'right', 'bottom', 'left'].forEach(value => {
                        if (node.styleMap[value] != null) {
                            style[value] = node.styleMap[value];
                            element.style[value] = 'auto';
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
                                            node.setBounds(false);
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
                                        node.setBounds(false);
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
                    let parent = node.parentElementNode;
                    if (parent == null) {
                        parent = this.cache.parent;
                    }
                    node.parent = parent;
                    node.documentParent = parent;
                }
            }
            for (const node of visible) {
                let valid = true;
                const text: HTMLElement[] = [];
                Array.from(node.element.childNodes).forEach((element: HTMLElement) => {
                    if (element.nodeName === '#text') {
                        if (node.element.tagName !== 'SELECT') {
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
                if (node.children.length === 1) {
                    const firstChild = node.children[0];
                    if (!firstChild.pageflow && convertInt(firstChild.top) === 0 && convertInt(firstChild.right) === 0 && convertInt(firstChild.bottom) === 0 && convertInt(firstChild.left) === 0) {
                        firstChild.pageflow = true;
                    }
                }
                if (node.children.some((current: T) => {
                        if (current.pageflow) {
                            return (current.float !== 'right' && !['center', 'right'].includes(current.inheritCss('textAlign')) && (current.marginLeft < 0 && node.marginLeft >= Math.abs(current.marginLeft)));
                        }
                        else {
                            return ((convertInt(current.left) < 0 && node.marginLeft >= Math.abs(convertInt(current.left))) || (convertInt(current.right) < 0 && Math.abs(convertInt(current.right)) >= current.bounds.width));
                        }
                    }))
                {
                    const marginLeft: number[] = [];
                    const marginRight: T[] = [];
                    node.each((current: T) => {
                        let leftType = 0;
                        if (current.pageflow) {
                            const left = current.marginLeft;
                            if (left < 0 && node.marginLeft >= left) {
                                leftType = 1;
                            }
                        }
                        else {
                            const left = convertInt(current.left);
                            const right = convertInt(current.right);
                            if (left < 0) {
                                if (node.marginLeft >= left) {
                                    current.css('left', formatPX(left + node.marginLeft));
                                    leftType = 2;
                                }
                            }
                            else if (right < 0) {
                                if (Math.abs(right) >= current.bounds.width) {
                                    marginRight.push(current);
                                }
                            }
                        }
                        marginLeft.push(leftType);
                    });
                    if (marginRight.length > 0) {
                        const [panelLeft, panelRight] = new NodeList<T>(<T[]> node.children).partition((item: T) => !marginRight.includes(item));
                        if (panelLeft.length > 0 && panelRight.length > 0) {
                            if (node.cssOriginal('marginLeft') === 'auto') {
                                node.css('marginLeft', <string> node.style.marginLeft);
                            }
                            node.css('marginRight', '0px');
                            const widthLeft = (node.styleMap.width != null ? convertInt(node.styleMap.width) : Math.max.apply(null, panelLeft.list.map(item => item.linear.width)));
                            const widthRight = Math.max.apply(null, panelRight.list.map(item => Math.abs(convertInt(item.right))));
                            panelLeft.each((item: T) => {
                                if (item.pageflow && item.viewWidth === 0) {
                                    item.css('maxWidth', formatPX(widthLeft));
                                }
                            });
                            node.css('width', formatPX(widthLeft + widthRight));
                        }
                    }
                    const marginLeftType = Math.max.apply(null, marginLeft);
                    node.each((current: T, index: number) => {
                        if (marginLeftType && marginLeft[index] !== 2 && ((current.pageflow && !current.plainText && marginLeft.includes(1)) || marginLeftType === 2)) {
                            current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + node.marginLeft, true);
                        }
                    });
                    if (marginLeftType > 0) {
                        const width = convertInt(node.styleMap.width);
                        if (width > 0) {
                            node.css('width', formatPX(width + node.marginLeft));
                        }
                        node.bounds.left -= node.marginLeft;
                        node.modifyBox(BOX_STANDARD.MARGIN_LEFT, 0, true);
                    }
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
            for (const ext of this.extensions) {
                ext.setTarget(rootNode);
                ext.afterInit();
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
                    if (current !== '') {
                        if (!external.has(current)) {
                            external.set(current, []);
                        }
                        external.get(current).push(xml);
                    }
                    else {
                        if (!application.elements.has(node.element)) {
                            if (node.isSet('dataset', 'target')) {
                                const target = application.findByDomId(<string> node.dataset.target, true);
                                if (!target || target !== parent) {
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
                        const id = parent.id + (node.renderIndex !== -1 ? `:${node.renderIndex}` : '');
                        if (!partial.has(id)) {
                            partial.set(id, []);
                        }
                        partial.get(id).push(xml);
                    }
                }
            }
            for (let j = 0; j < coordsY.length; j++) {
                const axisY: T[] = [];
                const below: T[] = [];
                const middle: T[] = [];
                const above: T[] = [];
                let parent = this.cache.locate('id', parseInt(coordsY[j])) as T;
                for (const node of mapY[i][coordsY[j]] as T[]) {
                    if (node.documentRoot) {
                        axisY.push(node);
                    }
                    else if (node.pageflow || node.alignMargin) {
                        middle.push(node);
                    }
                    else {
                        if (convertInt(node.css('zIndex')) >= 0 || node.parent.element !== node.element.parentElement) {
                            above.push(node);
                        }
                        else {
                            below.push(node);
                        }
                    }
                }
                if (parent) {
                    this.sortLayout(parent, middle);
                }
                axisY.push(...sortAsc(below, 'style.zIndex', 'siblingIndex'));
                axisY.push(...middle);
                axisY.push(...sortAsc(above, 'style.zIndex', 'siblingIndex'));
                const cleared = NodeList.cleared(axisY.slice());
                const includes: string[] = [];
                let current = '';
                for (let k = 0; k < axisY.length; k++) {
                    let nodeY = axisY[k];
                    if (!nodeY.documentRoot && this.elements.has(nodeY.element)) {
                        continue;
                    }
                    parent = nodeY.parent as T;
                    if (this.controllerHandler.supportInclude) {
                        const filename = (optional(nodeY, 'dataset.include') as string).trim();
                        if (filename !== '' && includes.indexOf(filename) === -1) {
                            renderXml(nodeY, parent, this.controllerHandler.renderInclude(nodeY, parent, filename), (includes.length > 0 ? includes[includes.length - 1] : ''));
                            includes.push(filename);
                        }
                        current = (includes.length > 0 ? includes[includes.length - 1] : '');
                        if (current !== '') {
                            const cloneParent = parent.clone() as T;
                            cloneParent.renderDepth = this.controllerHandler.currentRenderDepth(current);
                            nodeY.parent = cloneParent;
                            parent = cloneParent;
                        }
                    }
                    if (!nodeY.rendered) {
                        const renderExtension = parent.renderExtension;
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
                        this.orderExt(this.extensions, nodeY.element).some(item => {
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
                        if (!nodeY.rendered) {
                            const linearVertical = parent.linearVertical;
                            if (nodeY.pageflow && nodeY.alignmentType <= NODE_ALIGNMENT.OPEN && !parent.flex.enabled && parent.styleMap.columnCount == null && parent.alignmentType <= NODE_ALIGNMENT.OPEN && (parent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE) || linearVertical)) {
                                const horizontal = [nodeY];
                                let vertical = [nodeY];
                                const floatSize = new Set(axisY.map(node => node.float)).size;
                                for (let l = k + 1; l < axisY.length; l++) {
                                    const adjacent = axisY[l];
                                    if (adjacent.pageflow) {
                                        let lineBreak = false;
                                        const previous = <Null<T>> (() => {
                                            let node = adjacent.previousSibling;
                                            while (node) {
                                                if (isLineBreak(<Element> node.element.nextSibling, 'next')) {
                                                    lineBreak = true;
                                                    break;
                                                }
                                                if (!node.pageflow) {
                                                    node = node.previousSibling;
                                                }
                                                else {
                                                    break;
                                                }
                                            }
                                            return node;
                                        })();
                                        if (lineBreak) {
                                            break;
                                        }
                                        if (previous) {
                                            const alignVertical = (adjacent.plainText && adjacent.multiLine && !parent.is(NODE_STANDARD.RELATIVE)) ||
                                                                  (horizontal.length > 1 && isLineBreak(<Element> adjacent.element.previousSibling)) ||
                                                                  (!previous.floating && (!previous.inlineElement || previous.autoMargin || !adjacent.inlineElement || adjacent.autoMargin)) ||
                                                                  (!adjacent.floating && ((!previous.inlineElement && !previous.floating) || previous.autoMargin)) ||
                                                                  (floatSize === 1 && previous.floating && adjacent.floating && adjacent.linear.top >= previous.linear.bottom);
                                            if (cleared.has(adjacent)) {
                                                const floated = new Set(['both', ...horizontal.map(item => item.float)]);
                                                if (!floated.has(adjacent.css('clear')) && !alignVertical) {
                                                    horizontal.push(adjacent);
                                                    continue;
                                                }
                                                if (horizontal.length === 1) {
                                                    if (vertical[vertical.length - 1] !== previous) {
                                                        break;
                                                    }
                                                    vertical.push(adjacent);
                                                    continue;
                                                }
                                            }
                                            if (cleared.has(adjacent) || alignVertical) {
                                                if (horizontal.length > 1) {
                                                    if (linearVertical) {
                                                        for (let m = 1; m < horizontal.length; m++) {
                                                            if (isLineBreak(<Element> horizontal[m].element.previousSibling)) {
                                                                horizontal.length = m;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    break;
                                                }
                                                if (vertical[vertical.length - 1] !== previous) {
                                                    break;
                                                }
                                                else {
                                                    if (linearVertical) {
                                                        const previousAbove = vertical[vertical.length - 1];
                                                        if (previousAbove.parent.linearVertical) {
                                                            adjacent.parent = previousAbove.parent;
                                                            continue;
                                                        }
                                                    }
                                                    vertical.push(adjacent);
                                                    continue;
                                                }
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
                                                    if (vertical[vertical.length - 1] !== previous) {
                                                        break;
                                                    }
                                                    else {
                                                        vertical.push(adjacent);
                                                        continue;
                                                    }
                                                }
                                            }
                                        }
                                        if ((previous && cleared.has(previous) && previous.float !== adjacent.float) || horizontal[horizontal.length - 1] !== previous) {
                                            break;
                                        }
                                        else {
                                            horizontal.push(adjacent);
                                            if (!previous || ((previous.inlineElement && adjacent.inlineElement) || (previous.floating && !adjacent.inlineElement))) {
                                                continue;
                                            }
                                            if (!NodeList.linearX(horizontal)) {
                                                if (parent.is(NODE_STANDARD.CONSTRAINT) && NodeList.linearY(horizontal)) {
                                                    vertical = horizontal.slice();
                                                    horizontal.length = 1;
                                                }
                                                else {
                                                    horizontal.pop();
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                                let group: Null<T> = null;
                                let groupXml = '';
                                if (horizontal.length > 1) {
                                    if (horizontal.some(node => node.floating)) {
                                        group = this.controllerHandler.createGroup(nodeY, horizontal, parent);
                                        groupXml = this.writeFrameLayoutGroup(group, parent, horizontal);
                                    }
                                    else {
                                        if (horizontal.length === parent.children.length) {
                                            parent.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                            if (parent.is(NODE_STANDARD.RELATIVE)) {
                                                this.sortLayout(parent, axisY, NODE_ALIGNMENT.HORIZONTAL);
                                                this.sortLayout(parent, <T[]> parent.children, NODE_ALIGNMENT.HORIZONTAL, true);
                                                nodeY = axisY[k];
                                            }
                                        }
                                        else {
                                            group = this.controllerHandler.createGroup(nodeY, horizontal, parent);
                                            if (horizontal.some(node => node.multiLine) || !NodeList.linearX(horizontal)) {
                                                groupXml = this.writeRelativeLayout(group, parent);
                                                group.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP;
                                            }
                                            else {
                                                groupXml = this.writeLinearLayout(group, parent, true);
                                                this.sortLayout(group, <T[]> group.children, NODE_ALIGNMENT.HORIZONTAL, true);
                                            }
                                        }
                                    }
                                }
                                else if (vertical.length > 1) {
                                    if (vertical.length === parent.children.length) {
                                        parent.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                    }
                                    else {
                                        group = this.controllerHandler.createGroup(nodeY, vertical, parent);
                                        groupXml = this.writeLinearLayout(group, parent, false);
                                    }
                                }
                                if (group != null) {
                                    renderXml(group, parent, groupXml, current);
                                    parent = nodeY.parent as T;
                                }
                            }
                            let xml = '';
                            if (nodeY.nodeName === '') {
                                const untargeted = nodeY.children.filter(node => !node.isSet('dataset', 'target'));
                                if (untargeted.length === 0) {
                                    const freeFormText = hasFreeFormText(nodeY.element, 1);
                                    if (SETTINGS.collapseUnattributedElements && !freeFormText && Object.keys(nodeY.styleMap).length === 0 && nodeY.viewWidth === 0 && nodeY.viewHeight === 0) {
                                        parent.remove(nodeY);
                                        nodeY.hide();
                                        continue;
                                    }
                                    else {
                                        if (freeFormText || nodeY.inline) {
                                            xml = this.writeNode(nodeY, parent, NODE_STANDARD.TEXT);
                                        }
                                        else if (!nodeY.inlineElement && (nodeY.borderTopWidth + nodeY.borderBottomWidth > 0 || nodeY.paddingTop + nodeY.paddingBottom > 0)) {
                                            xml = this.writeNode(nodeY, parent, NODE_STANDARD.LINE);
                                        }
                                        else if (!nodeY.inlineText && /url(.*?)/.test(nodeY.css('backgroundImage')) && nodeY.css('backgroundRepeat') === 'no-repeat') {
                                            nodeY.alignmentType |= NODE_ALIGNMENT.SINGLE;
                                            nodeY.excludeResource |= NODE_RESOURCE.FONT_STYLE;
                                            xml = this.writeNode(nodeY, parent, NODE_STANDARD.IMAGE);
                                        }
                                        else {
                                            if (!nodeY.documentRoot) {
                                                xml = this.writeFrameLayout(nodeY, parent);
                                            }
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
                                            const children = nodeY.children;
                                            const [linearX, linearY] = [NodeList.linearX(children), NodeList.linearY(children)];
                                            if (!parent.flex.enabled && children.every(node => node.pageflow)) {
                                                const float = new Set(children.map(node => node.float));
                                                if (linearX) {
                                                    if (float.size === 1 && float.has('none') && children.some(node => node.hasElement && !['baseline', 'initial', 'top', 'middle', 'bottom', 'sub', 'sup'].includes(node.css('verticalAlign'))) && children.every(node => convertInt(node.css('verticalAlign')) === 0)) {
                                                        xml = this.writeConstraintLayout(nodeY, parent);
                                                        nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                        this.sortLayout(nodeY, <T[]> children, nodeY.alignmentType, true);
                                                    }
                                                    else if (((float.size === 1 || !float.has('right')) && !children.some(node => node.multiLine)) || children.some(node => !['baseline', 'initial', 'sub', 'sup'].includes(node.css('verticalAlign')))) {
                                                        xml = this.writeLinearLayout(nodeY, parent, true);
                                                    }
                                                    else if ((float.has('left') || float.has('none')) && float.has('right')) {
                                                        const group = this.controllerHandler.createGroup(nodeY, <T[]> children, parent, nodeY.element);
                                                        xml = this.writeFrameLayoutGroup(group, parent, <T[]> group.children);
                                                    }
                                                }
                                                else {
                                                    const clearedBlock = NodeList.cleared(children);
                                                    if (linearY || (children.some(node => !node.inlineElement || clearedBlock.has(node)) && !children.some(node => node.autoMargin))) {
                                                        xml = this.writeLinearLayout(nodeY, parent, false);
                                                    }
                                                }
                                            }
                                            if (xml === '') {
                                                if (children.every((node: T) => node.pageflow && node.inlineElement && !cleared.has(node))) {
                                                    xml = this.writeRelativeLayout(nodeY, parent);
                                                    nodeY.alignmentType |= NODE_ALIGNMENT.OPEN;
                                                }
                                                else {
                                                    xml = this.writeConstraintLayout(nodeY, parent);
                                                    if (!linearX && linearY) {
                                                        nodeY.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP;
                                                    }
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
                        if (includes.length > 0 && (optional(nodeY, 'dataset.includeEnd') as string) === 'true') {
                            includes.pop();
                        }
                    }
                }
            }
            for (let [id, views] of partial.entries()) {
                const content: string[] = [];
                const [parentId, renderIndex] = id.split(':');
                if (this._sorted[parentId] != null) {
                    const parsed: string[] = [];
                    this._sorted[parentId].forEach(value => {
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
                id = parentId + (renderIndex != null ? `:${renderIndex}` : '');
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
            const pathname = trim((optional(root, 'dataset.folder') as string).trim(), '/');
            this.updateLayout(pathname, (!empty ? output : ''), (root.renderExtension != null && root.renderExtension.documentRoot));
        }
        else {
            this._views.pop();
        }
        if (!empty) {
            for (const ext of this.extensions) {
                ext.setTarget(root);
                ext.afterRender();
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
        const [floated, pageflow] = new NodeList(nodes).partition(item => item.floating || item.autoMargin);
        const [right, left] = new NodeList(floated.list).partition(item => item.float === 'right' || item.cssOriginal('marginLeft') === 'auto');
        let layers: NodeList<T>[];
        if (right.length === 0) {
            xml = this.writeLinearLayout(group, parent, true);
            layers = [left, pageflow];
        }
        else {
            xml = this.writeFrameLayout(group, parent, true);
            layers = [pageflow, left, right];
        }
        const placeholder = `{:${group.id}}`;
        layers.forEach((item, index) => {
            if (item.length > 1) {
                const subgroup = this.controllerHandler.createGroup(item.list[0], item.list, group);
                let content = '';
                if (!item.linearX || (item.list.some(node => node.multiLine) && !item.list.some(node => node.floating))) {
                    content = this.writeRelativeLayout(subgroup, group);
                    subgroup.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP | NODE_ALIGNMENT.SEGMENTED;
                }
                else {
                    content = this.writeLinearLayout(subgroup, group, true);
                    this.sortLayout(subgroup, <T[]> subgroup.children, NODE_ALIGNMENT.HORIZONTAL, true);
                    subgroup.alignmentType |= NODE_ALIGNMENT.HORIZONTAL | NODE_ALIGNMENT.SEGMENTED;
                }
                if (index === 0 || index === 2) {
                    subgroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                }
                xml = xml.replace(placeholder, content + placeholder);
                group.append(subgroup);
            }
            else if (item.length > 0) {
                const single = item.list[0];
                single.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP;
                single.renderIndex = index;
                xml = xml.replace(placeholder, `{:${group.id}:${index}}` + placeholder);
                group.append(single);
            }
        });
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
            const ext = node.renderExtension;
            if (ext != null) {
                ext.setTarget(node);
                ext.beforeInsert();
            }
        }
        const template = {};
        for (const id in this.insert) {
            const [originalId] = id.split(':');
            let replaceId = originalId;
            if (!isNumber(replaceId)) {
                const target = this.findByDomId(replaceId);
                if (target) {
                    replaceId = target.id.toString();
                }
            }
            let output = this.insert[id].join('\n');
            if (replaceId !== originalId) {
                const target = this.cacheInternal.locate('id', parseInt(replaceId));
                if (target) {
                    const depth = target.renderDepth + 1;
                    output = placeIndent(output, depth);
                    const pattern = /{@([0-9]+)}/g;
                    let match: Null<RegExpExecArray> = null;
                    let i = 0;
                    while ((match = pattern.exec(output)) != null) {
                        const node = this.cacheInternal.locate('id', parseInt(match[1]));
                        if (node) {
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
            const ext = node.renderExtension;
            if (ext != null) {
                ext.setTarget(node);
                ext.afterInsert();
            }
        }
    }

    public setAttributes() {
        this.controllerHandler.setAttributes(this.viewData);
        for (const node of this.cacheInternal) {
            const ext = node.renderExtension;
            if (ext != null) {
                ext.setTarget(node);
                ext.finalize();
            }
        }
    }

    public addLayout(filename: string) {
        this._currentIndex = this._views.length;
        this._views.push({
            filename,
            pathname: '',
            content: ''
        });
    }

    public updateLayout(pathname = '', content: string, documentRoot = false) {
        pathname = pathname || 'res/layout';
        if (documentRoot && this._views.length > 0 && this._views[0].content === '') {
            const view = this._views[0];
            const current = <PlainFile> this._views.pop();
            view.pathname = pathname;
            view.filename = current.filename;
            view.content = content;
            this._currentIndex = 0;
        }
        else {
            const view = this.current;
            view.pathname = pathname;
            view.content = content;
        }
    }

    public sortLayout(parent: T, children: T[], alignmentType = NODE_ALIGNMENT.NONE, save = false) {
        let sorted = false;
        if (alignmentType === NODE_ALIGNMENT.NONE) {
            if (parent.linearHorizontal) {
                alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
            }
            else if (parent.is(NODE_STANDARD.CONSTRAINT)) {
                alignmentType |= NODE_ALIGNMENT.ABSOLUTE;
            }
        }
        if (includesEnum(alignmentType, NODE_ALIGNMENT.HORIZONTAL)) {
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
        if (includesEnum(alignmentType, NODE_ALIGNMENT.ABSOLUTE)) {
            if (children.some(node => convertInt(node.css('zIndex')) !== 0)) {
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
            }
        }
        if (save && sorted) {
            this._sorted[parent.id.toString()] = children.map(item => item.id);
        }
    }

    public addInclude(filename: string, content: string) {
        this._includes.push({
            pathname: 'res/layout',
            filename,
            content
        });
    }

    public getExtension(name: string) {
        return this.extensions.find(item => item.name === name);
    }

    public addXmlNs(name: string, uri: string) {
        this.controllerHandler.addXmlNs(name, uri);
    }

    public findByDomId(id: string, current = false) {
        return (current ? this.cache : this.cacheInternal).locate(node => node.element.id === id || node.nodeId === id);
    }

    public toString() {
        return (this._views.length > 0 ? this._views[0].content : '');
    }

    private insertNode(element: HTMLElement, parent?: T) {
        let node: Null<T> = null;
        if (element.nodeName === '#text') {
            if ((optional(element, 'textContent') as string).trim() !== '' || cssParent(element, 'whiteSpace', 'pre', 'pre-wrap')) {
                node = new this._TypeT(this.cache.nextId, SETTINGS.targetAPI, element);
                node.tagName = 'PLAINTEXT';
                if (parent != null) {
                    node.parent = parent;
                    node.inherit(parent, 'style');
                }
                else {
                    node.css('whiteSpace', (element.parentElement ? getStyle(element.parentElement).whiteSpace : null) || 'normal');
                }
                node.css({
                    display: 'inline',
                    clear: 'none',
                    cssFloat: 'none',
                    verticalAlign: 'baseline'
                });
                node.setBounds();
            }
        }
        else if (isVisible(element)) {
            node = new this._TypeT(this.cache.nextId, SETTINGS.targetAPI, element);
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
            extensions = [...extensions, ...(optional(current, 'dataset.ext') as string).split(',').map(value => value.trim())];
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
        this._views[this._currentIndex] = value;
    }
    get current() {
        return this._views[this._currentIndex];
    }

    get layouts() {
        return [...this._views, ...this._includes];
    }

    get viewData(): ViewData<NodeList<T>> {
        return { cache: this.cacheInternal, views: this._views, includes: this._includes };
    }

    get size() {
        return this._views.length + this._includes.length;
    }
}