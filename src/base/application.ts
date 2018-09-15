import { LayoutMapX, LayoutMapY, Null, ObjectIndex, ObjectMap, PlainFile, ViewData } from '../lib/types';
import { IExtension } from '../extension/lib/types';
import Controller from './controller';
import Resource from './resource';
import Node from './node';
import NodeList from './nodelist';
import { convertInt, formatPX, hasBit, hasValue, isNumber, optional, sortAsc, trim, isPercent, isUnit } from '../lib/util';
import { getPlaceholder, modifyIndent, replacePlaceholder } from '../lib/xml';
import { cssParent, deleteElementCache, getElementCache, getNodeFromElement, getStyle, hasFreeFormText, isElementVisible, isLineBreak, isPlainText, setElementCache, getElementsBetweenSiblings } from '../lib/dom';
import { BOX_STANDARD, NODE_ALIGNMENT, NODE_PROCEDURE, NODE_RESOURCE, NODE_STANDARD, CSS_STANDARD } from '../lib/constants';
import SETTINGS from '../settings';

export default class Application<T extends Node> {
    public readonly cache: NodeList<T> = new NodeList<T>();
    public readonly cacheSession: NodeList<T> = new NodeList<T>();
    public readonly elements: Set<HTMLElement> = new Set();
    public readonly extensions: IExtension[] = [];
    public controllerHandler: Controller<T>;
    public resourceHandler: Resource<T>;
    public renderQueue: ObjectIndex<string[]> = {};
    public closed = false;

    private readonly _views: PlainFile[] = [];
    private readonly _includes: PlainFile[] = [];
    private _sorted: ObjectMap<number[]> = {};
    private _currentIndex = -1;

    constructor(private readonly _Node: { new (id: number, api: number, element?: Element): T }) {
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
        const visible = this.cacheSession.visible;
        for (const node of visible) {
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.LAYOUT)) {
                node.setLayout();
            }
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.ALIGNMENT)) {
                node.setAlignment();
            }
        }
        for (const node of visible) {
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.OPTIMIZATION)) {
                node.applyOptimizations(SETTINGS);
            }
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.CUSTOMIZATION)) {
                node.applyCustomizations(SETTINGS.customizationsOverwritePrivilege);
            }
        }
        this.appendRenderQueue();
        this.controllerHandler.setDimensions(this.viewData);
        for (const node of this.cacheSession) {
            for (const ext of node.renderExtension) {
                ext.setTarget(node);
                ext.finalize();
            }
        }
        this.resourceHandler.finalize(this.viewData);
        this.controllerHandler.finalize(this.viewData);
        this.closed = true;
    }

    public reset() {
        for (const node of this.cacheSession) {
            deleteElementCache(node.element, 'node', 'style', 'styleMap', 'supportInline', 'boxSpacing', 'boxStyle', 'fontStyle', 'imageSource', 'optionArray', 'valueString');
        }
        this.cache.reset();
        this.cacheSession.reset();
        this.resetController();
        this.resetResource();
        this._views.length = 0;
        this._includes.length = 0;
        this._sorted = {};
        this._currentIndex = -1;
        this.appName = '';
        this.renderQueue = {};
        this.closed = false;
    }

    public setConstraints() {
        this.controllerHandler.setConstraints();
    }

    public resetController() {
        this.controllerHandler.reset();
    }

    public setResources() {
        this.resourceHandler.setBoxStyle();
        this.resourceHandler.setFontStyle();
        this.resourceHandler.setBoxSpacing();
        this.resourceHandler.setValueString();
        this.resourceHandler.setOptionArray();
        this.resourceHandler.setImageSource();
    }

    public resetResource() {
        this.resourceHandler.reset();
    }

    public createNodeCache(rootElement: HTMLElement) {
        let nodeTotal = 0;
        if (rootElement === document.body) {
            Array.from(document.body.childNodes).some((item: Element) => isElementVisible(item) && ++nodeTotal > 1);
        }
        const elements = (rootElement !== document.body ? rootElement.querySelectorAll('*') : document.querySelectorAll((nodeTotal > 1 ? 'body, body *' : 'body *')));
        this.cache.parent = undefined;
        this.cache.delegateAppend = undefined;
        this.cache.clear();
        for (const ext of this.extensions) {
            ext.setTarget({} as T, undefined, rootElement);
            ext.beforeInit();
        }
        const rootNode = this.insertNode(rootElement);
        if (rootNode) {
            rootNode.parent = new this._Node(0, SETTINGS.targetAPI, (rootElement === document.body ? rootElement : rootElement.parentElement) || document.body);
            rootNode.documentRoot = true;
            this.cache.parent = rootNode;
        }
        else {
            return false;
        }
        const supportInline = (SETTINGS.renderInlineText ? ['BR'] : this.controllerHandler.supportInline);
        function inlineElement(element: Element) {
            const styleMap = getElementCache(element, 'styleMap');
            return ((styleMap == null || Object.keys(styleMap).length === 0) && supportInline.includes(element.tagName) && element.children.length === 0);
        }
        for (const element of Array.from(elements) as HTMLElement[]) {
            if (!this.elements.has(element)) {
                this.prioritizeExtOrder(this.extensions, element).some(item => item.init(element));
                if (!this.elements.has(element)) {
                    if (inlineElement(element) && element.parentElement && Array.from(element.parentElement.children).every(item => inlineElement(item))) {
                        setElementCache(element, 'supportInline', true);
                    }
                    let valid = true;
                    let current = element.parentElement;
                    while (current != null) {
                        if (current === rootElement) {
                            break;
                        }
                        else if (current !== rootElement && this.elements.has(current)) {
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
        for (const node of this.cache) {
            let valid = true;
            const text: Element[] = [];
            Array.from(node.element.childNodes).forEach((element: Element) => {
                if (element.nodeName === '#text') {
                    if (node.tagName !== 'SELECT') {
                        text.push(element);
                    }
                }
                else if (element.tagName !== 'BR') {
                    const elementNode = getNodeFromElement(element);
                    if (!supportInline.includes(element.tagName) || (elementNode && !elementNode.excluded)) {
                        valid = false;
                    }
                }
            });
            if (!valid) {
                text.forEach(element => this.insertNode(element, node));
            }
        }
        if (this.cache.length > 0) {
            const preAlignment: ObjectIndex<ObjectMap<Null<string>>> = {};
            for (const node of this.cache.elements) {
                const element = <HTMLElement> node.element;
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
                if (node.marginLeft < 0) {
                    style.marginLeft = node.css('marginLeft');
                    element.style.marginLeft = '0px';
                }
                if (node.marginTop < 0) {
                    style.marginTop = node.css('marginTop');
                    element.style.marginTop = '0px';
                }
                if (node.position === 'relative') {
                    ['top', 'right', 'bottom', 'left'].forEach(value => {
                        if (node.has(value)) {
                            style[value] = node.styleMap[value];
                            element.style[value] = 'auto';
                        }
                    });
                }
                if (node.overflowX || node.overflowY) {
                    if (node.has('width')) {
                        style.width = node.styleMap.width;
                        element.style.width = 'auto';
                    }
                    if (node.has('height')) {
                        style.height = node.styleMap.height;
                        element.style.height = 'auto';
                    }
                    style.overflow = node.style.overflow;
                    element.style.overflow = 'visible';
                }
            }
            for (const node of this.cache) {
                node.setBounds();
            }
            for (const node of this.cache) {
                const style = preAlignment[node.id];
                if (style != null) {
                    for (const attr in style) {
                        (<HTMLElement> node.element).style[attr] = style[attr];
                    }
                }
            }
            for (const node of this.cache) {
                node.setMultiLine();
                if (node.pageflow) {
                    const element = <HTMLInputElement> node.element;
                    if (element.tagName === 'INPUT' && !node.hasBit('excludeProcedure', NODE_PROCEDURE.ACCESSIBILITY)) {
                        switch (element.type) {
                            case 'radio':
                            case 'checkbox':
                                [node.nextElementSibling, node.previousElementSibling].some((sibling: HTMLLabelElement) => {
                                    const label = getNodeFromElement(sibling);
                                    const labelParent = (sibling && sibling.parentElement && sibling.parentElement.tagName === 'LABEL' ? getNodeFromElement(sibling.parentElement) : null);
                                    if (label && label.visible && label.pageflow) {
                                        if (sibling.htmlFor !== '' && sibling.htmlFor === element.id) {
                                            node.companion = label;
                                        }
                                        else if (labelParent && label.textElement) {
                                            node.companion = labelParent;
                                            labelParent.renderAs = node;
                                        }
                                        if (node.companion != null) {
                                            label.hide();
                                            node.setBounds(false);
                                            return true;
                                        }
                                    }
                                    return false;
                                });
                                break;
                        }
                    }
                }
            }
            const visible = this.cache.visible;
            for (const node of visible) {
                if (!node.documentRoot) {
                    let parent: Null<T> = node.getParentElementAsNode(SETTINGS.constraintSupportNegativeLeftTop) as T;
                    if (parent == null && !node.pageflow) {
                        parent = this.cache.parent;
                    }
                    if (parent != null) {
                        node.parent = parent;
                        node.documentParent = parent;
                    }
                    else {
                        node.hide();
                    }
                }
            }
            for (const node of visible) {
                if (node.children.length === 1) {
                    const firstChild = node.children[0];
                    if (!firstChild.pageflow &&
                        firstChild.toInt('top') === 0 &&
                        firstChild.toInt('right') === 0 &&
                        firstChild.toInt('bottom') === 0 &&
                        firstChild.toInt('left') === 0)
                    {
                        firstChild.pageflow = true;
                    }
                }
                if (node.children.some((current: T) => {
                        if (current.pageflow) {
                            return (
                                current.float !== 'right' &&
                                current.marginLeft < 0 &&
                                node.marginLeft >= Math.abs(current.marginLeft) &&
                                Math.abs(current.marginLeft) >= current.bounds.width
                            );
                        }
                        else {
                            const left = current.toInt('left');
                            const right = current.toInt('right');
                            return ((left < 0 && node.marginLeft >= Math.abs(left)) || (right < 0 && Math.abs(right) >= current.bounds.width));
                        }
                    }))
                {
                    const marginLeft: number[] = [];
                    const marginRight: T[] = [];
                    node.each((current: T) => {
                        let leftType = 0;
                        if (current.pageflow) {
                            const left = current.marginLeft;
                            if (left < 0 && node.marginLeft >= Math.abs(left)) {
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
                        const [sectionLeft, sectionRight] = new NodeList<T>(node.children as T[]).partition((item: T) => !marginRight.includes(item));
                        if (sectionLeft.length > 0 && sectionRight.length > 0) {
                            if (node.autoLeftMargin) {
                                node.css('marginLeft', node.style.marginLeft as string);
                            }
                            node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, null);
                            const widthLeft: number = (node.has('width') ? node.toInt('width') : Math.max.apply(null, sectionRight.list.map(item => item.linear.width)));
                            const widthRight: number = Math.max.apply(null, sectionRight.list.map(item => Math.abs(item.toInt('right'))));
                            sectionLeft.each((item: T) => {
                                if (item.pageflow && item.viewWidth === 0) {
                                    item.css((item.inlineStatic || item.textElement ? 'maxWidth' : 'width'), formatPX(widthLeft));
                                }
                            });
                            node.css('width', formatPX(widthLeft + widthRight));
                        }
                    }
                    const marginLeftType: number = Math.max.apply(null, marginLeft);
                    node.each((current: T, index: number) => {
                        if (marginLeftType && marginLeft[index] !== 2 && ((current.pageflow && !current.plainText && marginLeft.includes(1)) || marginLeftType === 2)) {
                            if (marginLeft[index] === 1) {
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + node.marginLeft, false, true);
                            }
                            else {
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, node.marginLeft, false, true);
                            }
                        }
                    });
                    if (marginLeftType > 0) {
                        const width = node.toInt('width');
                        if (width > 0) {
                            node.css('width', formatPX(width + node.marginLeft));
                        }
                        node.bounds.left -= node.marginLeft;
                        node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null, false, true);
                    }
                }
                if (!node.pageflow && node.children.length > 0) {
                    let calibrate = false;
                    if (node.viewWidth === 0) {
                        const maxRight: number = Math.max.apply(null, node.cascade().map(item => item.linear.right)) || 0;
                        node.bounds.right = maxRight + node.paddingRight + node.borderRightWidth;
                        node.bounds.width = node.bounds.right - node.bounds.left;
                        calibrate = true;
                    }
                    if (node.viewHeight === 0) {
                        const maxBottom: number = Math.max.apply(null, node.cascade().map(item => item.linear.bottom)) || 0;
                        node.bounds.bottom = maxBottom + node.paddingBottom + node.borderBottomWidth;
                        node.bounds.height = node.bounds.bottom - node.bounds.top;
                        calibrate = true;
                    }
                    if (calibrate) {
                        node.setBounds(true);
                    }
                }
            }
            for (const ext of this.extensions) {
                ext.setTarget(rootNode);
                ext.afterInit();
            }
            for (const node of this.cache.elements) {
                let i = 0;
                Array.from(node.element.childNodes).forEach((element: Element) => {
                    const child = getNodeFromElement(element);
                    if (child && child.visible && !child.excluded && child.pageflow) {
                        child.siblingIndex = i++;
                    }
                });
                sortAsc(node.children, 'siblingIndex');
            }
            this.cache.sortAsc('depth', 'id');
            this.createLayout(rootElement.dataset.viewName as string);
            return true;
        }
        return false;
    }

    public createLayoutXml() {
        const application = this;
        const mapX: LayoutMapX<T> = [];
        const mapY: LayoutMapY<T> = new Map<number, Map<number, T>>();
        let output = `<?xml version="1.0" encoding="utf-8"?>\n{:0}`;
        let empty = true;
        function setMapY(depth: number, id: number, node: T) {
            if (!mapY.has(depth)) {
                mapY.set(depth, new Map<number, T>());
            }
            const indexY = mapY.get(depth);
            if (indexY != null) {
                indexY.set(id, node);
            }
        }
        if (this.cache.parent != null) {
            setMapY(-1, 0, <T> this.cache.parent.parent);
        }
        for (const node of this.cache.visible) {
            const x = Math.floor(node.linear.left);
            if (mapX[node.depth] == null) {
                mapX[node.depth] = {};
            }
            if (mapX[node.depth][x] == null) {
                mapX[node.depth][x] = [];
            }
            mapX[node.depth][x].push(node);
            setMapY(node.depth, node.id, node);
        }
        this.cache.delegateAppend = (nodes: T[]) => {
            nodes.forEach(node => {
                setMapY(-2, node.id, node);
                node.children.forEach((child: T) => {
                    const indexY = mapY.get(child.depth);
                    if (indexY && indexY.has(child.id)) {
                        indexY.delete(child.id);
                    }
                    setMapY(-3, child.id, child);
                });
            });
        };
        for (const depth of mapY.values()) {
            const partial = new Map<string, Map<number, string>>();
            const external = new Map<string, Map<number, string>>();
            function insertViewTemplate(data: Map<string, Map<number, string>>, node: T, parentId: string, value: string, current: string) {
                const key = parentId + (current === '' && node.renderPosition !== -1 ? `:${node.renderPosition}` : '');
                if (!data.has(key)) {
                    data.set(key, new Map<number, string>());
                }
                (data.get(key) as Map<number, string>).set(node.id, value);
            }
            function renderXml(node: T, parent: T, xml: string, current = '', group = false) {
                if (xml !== '') {
                    if (group) {
                        node.each((item: T) => {
                            [partial, external].some(data => {
                                for (const views of partial.values()) {
                                    let template = views.get(item.id);
                                    if (template) {
                                        const indent = node.renderDepth + 1;
                                        if (item.renderDepth !== indent) {
                                            template = modifyIndent(template, indent);
                                            item.renderDepth = indent;
                                        }
                                        insertViewTemplate(data, item, node.id.toString(), template, current);
                                        views.delete(item.id);
                                        return true;
                                    }
                                }
                                return false;
                            });
                        });
                    }
                    if (current !== '') {
                        insertViewTemplate(external, node, current, xml, current);
                    }
                    else {
                        if (!application.elements.has(<HTMLElement> node.element)) {
                            if (node.isSet('dataset', 'target')) {
                                const target = document.getElementById(node.dataset.target as string);
                                if (target != null && target !== parent.element) {
                                    application.addRenderQueue(node.dataset.target as string, [xml]);
                                    node.auto = false;
                                    return;
                                }
                            }
                            else if (parent.isSet('dataset', 'target')) {
                                const target = document.getElementById(parent.dataset.target as string);
                                if (target != null) {
                                    application.addRenderQueue(parent.nodeId, [xml]);
                                    node.dataset.target = parent.nodeId;
                                    return;
                                }
                            }
                        }
                        insertViewTemplate(partial, node, parent.id.toString(), xml, current);
                    }
                }
            }
            for (const parent of depth.values()) {
                if (parent.children.length === 0 || parent.renderAs != null) {
                    continue;
                }
                const axisY: T[] = [];
                const below: T[] = [];
                const middle: T[] = [];
                const above: T[] = [];
                for (const node of parent.children as T[]) {
                    if (node.documentRoot) {
                        axisY.push(node);
                    }
                    else if (node.pageflow || node.alignOrigin) {
                        middle.push(node);
                    }
                    else {
                        if (node.toInt('zIndex') >= 0 || node.parent.element !== node.element.parentElement) {
                            above.push(node);
                        }
                        else {
                            below.push(node);
                        }
                    }
                }
                this.sortByAlignment(middle, parent);
                axisY.push(...sortAsc(below, 'style.zIndex', 'id'));
                axisY.push(...middle);
                axisY.push(...sortAsc(above, 'style.zIndex', 'id'));
                const cleared = NodeList.cleared(axisY);
                const includes: string[] = [];
                let current = '';
                let k = -1;
                while (++k < axisY.length) {
                    let nodeY = axisY[k];
                    if (!nodeY.documentRoot && this.elements.has(<HTMLElement> nodeY.element)) {
                        continue;
                    }
                    let parentY = nodeY.parent as T;
                    if (this.controllerHandler.supportInclude) {
                        const filename = (optional(nodeY, 'dataset.include') as string).trim();
                        if (filename !== '' && includes.indexOf(filename) === -1) {
                            renderXml(nodeY, parentY, this.controllerHandler.renderInclude(nodeY, parentY, filename), (includes.length > 0 ? includes[includes.length - 1] : ''));
                            includes.push(filename);
                        }
                        current = (includes.length > 0 ? includes[includes.length - 1] : '');
                        if (current !== '') {
                            const cloneParent = parentY.clone() as T;
                            cloneParent.renderDepth = this.controllerHandler.baseRenderDepth(current);
                            nodeY.parent = cloneParent;
                            parentY = cloneParent;
                        }
                    }
                    if (nodeY.renderAs != null) {
                        parentY.remove(nodeY);
                        nodeY.hide();
                        nodeY = nodeY.renderAs as T;
                        nodeY.parent = parentY;
                    }
                    if (!nodeY.rendered) {
                        let next = false;
                        for (const ext of [...parentY.renderExtension, ...nodeY.renderExtensionChild]) {
                            ext.setTarget(nodeY, parentY);
                            const result = ext.processChild();
                            if (result.xml !== '') {
                                renderXml(nodeY, parentY, result.xml, current);
                            }
                            if (result.parent) {
                                parentY = result.parent as T;
                            }
                            next = result.next || false;
                            if (result.complete || result.next) {
                                break;
                            }
                        }
                        if (next) {
                            continue;
                        }
                        const processed: IExtension[] = [];
                        this.prioritizeExtOrder(this.extensions, nodeY.element).some(item => {
                            if (item.is(nodeY)) {
                                item.setTarget(nodeY, parentY);
                                if (item.condition()) {
                                    const result =  item.processNode(mapX, mapY);
                                    if (result.xml !== '') {
                                        renderXml(nodeY, parentY, result.xml, current);
                                    }
                                    if (result.parent) {
                                        parentY = result.parent as T;
                                    }
                                    if (result.xml !== '' || result.include) {
                                        processed.push(item);
                                    }
                                    next = result.next || false;
                                    if (result.complete || result.next) {
                                        return true;
                                    }
                                }
                            }
                            return false;
                        });
                        if (processed.length > 0) {
                            nodeY.renderExtension.push(...processed);
                        }
                        if (next) {
                            continue;
                        }
                        const linearVertical = parentY.linearVertical;
                        if (nodeY.alignmentType === NODE_ALIGNMENT.NONE &&
                            nodeY.pageflow &&
                            parentY.alignmentType === NODE_ALIGNMENT.NONE &&
                            (linearVertical || parentY.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE)) &&
                            !parentY.flex.enabled &&
                            !parentY.has('columnCount') &&
                            current === '')
                        {
                            const horizontal: T[] = [nodeY];
                            const vertical: T[] = [nodeY];
                            let previousNodeSibling = nodeY;
                            for (let l = k + 1; l < axisY.length; l++) {
                                const adjacent = axisY[l];
                                if (adjacent.pageflow) {
                                    const previousSibling = adjacent.previousSibling() as T;
                                    if (previousSibling != null) {
                                        if (adjacent.alignedVertical(previousSibling, cleared) || (cleared.has(previousSibling) && previousSibling.floating)) {
                                            if (horizontal.length > 1) {
                                                if (linearVertical) {
                                                    for (let m = 1; m < horizontal.length; m++) {
                                                        const previous = horizontal[m].previousSibling();
                                                        if (previous && previous.lineBreak) {
                                                            horizontal.length = m;
                                                            break;
                                                        }
                                                    }
                                                }
                                                break;
                                            }
                                            if (linearVertical && vertical.length > 0) {
                                                const previousAbove = vertical[vertical.length - 1];
                                                if (previousAbove.linearVertical) {
                                                    adjacent.parent = previousAbove;
                                                    continue;
                                                }
                                            }
                                            if (vertical.length > 0 && vertical[vertical.length - 1] !== previousNodeSibling) {
                                                vertical.length = 0;
                                                break;
                                            }
                                            else {
                                                previousNodeSibling = adjacent;
                                                vertical.push(adjacent);
                                                continue;
                                            }
                                        }
                                        if (previousSibling.lineBreak) {
                                            if (!linearVertical) {
                                                if (horizontal.length > 1) {
                                                    break;
                                                }
                                                else {
                                                    if (vertical.length > 0 && vertical[vertical.length - 1] !== previousNodeSibling) {
                                                        vertical.length = 0;
                                                        break;
                                                    }
                                                    else {
                                                        previousNodeSibling = adjacent;
                                                        vertical.push(adjacent);
                                                        continue;
                                                    }
                                                }
                                            }
                                        }
                                        if (horizontal.length > 0 && horizontal[horizontal.length - 1] !== previousNodeSibling) {
                                            horizontal.length = 0;
                                            break;
                                        }
                                        previousNodeSibling = adjacent;
                                        horizontal.push(adjacent);
                                    }
                                }
                            }
                            let group: Null<T> = null;
                            let groupXml = '';
                            if (horizontal.length > 1) {
                                if (this.isFrameHorizontal(horizontal, cleared)) {
                                    group = this.controllerHandler.createGroup(nodeY, horizontal, parentY);
                                    groupXml = this.writeFrameLayoutHorizontal(group, parentY, horizontal);
                                }
                                else {
                                    if (horizontal.length === axisY.length) {
                                        parentY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                        if (parentY.is(NODE_STANDARD.RELATIVE)) {
                                            this.sortByAlignment(axisY, parentY, NODE_ALIGNMENT.HORIZONTAL);
                                            nodeY = axisY[k];
                                        }
                                    }
                                    else {
                                        if (new Set(horizontal.map(node => node.float)).size === 1 && horizontal.some(node => isPercent(node.css('width'))) && horizontal.every(node => isPercent(node.css('width')) || isUnit(node.css('width')))) {
                                            group = this.controllerHandler.createGroup(nodeY, horizontal, parentY);
                                            groupXml = this.writeConstraintLayout(group, parentY);
                                            group.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP;
                                        }
                                        else if (this.isRelativeHorizontal(horizontal)) {
                                            group = this.controllerHandler.createGroup(nodeY, horizontal, parentY);
                                            groupXml = this.writeRelativeLayout(group, parentY);
                                            group.alignmentType |= (horizontal.some(node => node.plainText && node.multiLine) ? NODE_ALIGNMENT.INLINE_WRAP : NODE_ALIGNMENT.HORIZONTAL);
                                        }
                                        else if (horizontal.some(node => !node.parent.linearHorizontal)) {
                                            group = this.controllerHandler.createGroup(nodeY, horizontal, parentY);
                                            groupXml = this.writeLinearLayout(group, parentY, true);
                                            group.alignmentType |= (horizontal.every(node => node.float === 'right' || node.autoLeftMargin) ? NODE_ALIGNMENT.RIGHT : NODE_ALIGNMENT.LEFT);
                                        }
                                    }
                                }
                            }
                            else if (vertical.length > 1) {
                                if (!parentY.is(NODE_STANDARD.CONSTRAINT) && vertical.some(node => cleared.has(node) && node !== vertical[0]) && !vertical.every((node, index) => index === 0 || cleared.has(node))) {
                                    group = this.controllerHandler.createGroup(nodeY, vertical, parentY);
                                    groupXml = this.writeFrameLayoutVertical(group, parentY, vertical, cleared);
                                }
                                else {
                                    if (vertical.length === axisY.length) {
                                        parentY.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                    }
                                    else {
                                        group = this.controllerHandler.createGroup(nodeY, vertical, parentY);
                                        groupXml = this.writeLinearLayout(group, parentY, false);
                                        group.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                    }
                                }
                            }
                            if (group != null) {
                                renderXml(group, parentY, groupXml, '', true);
                                parentY = nodeY.parent as T;
                            }
                        }
                        if (!nodeY.rendered) {
                            let xml = '';
                            if (nodeY.alignmentType === NODE_ALIGNMENT.NONE && nodeY.has('width', CSS_STANDARD.PERCENT, { not: '100%' }) && !nodeY.imageElement && (parentY.linearVertical || (parentY.is(NODE_STANDARD.FRAME) && nodeY.singleChild))) {
                                const group = this.controllerHandler.createGroup(nodeY, [nodeY], parentY);
                                const groupXml = this.writeGridLayout(group, parentY, 2, 1);
                                group.alignmentType |= NODE_ALIGNMENT.PERCENT;
                                renderXml(group, parentY, groupXml, current);
                                this.controllerHandler[(nodeY.float === 'right' || nodeY.autoLeftMargin ? 'prependBefore' : 'appendAfter')](nodeY.id, this.getEmptySpacer(NODE_STANDARD.GRID, group.renderDepth + 1, `${(100 - nodeY.toInt('width'))}%`));
                                parentY = group;
                            }
                            if (nodeY.controlName === '') {
                                const borderVisible = (nodeY.borderTopWidth > 0 || nodeY.borderBottomWidth > 0 || nodeY.borderRightWidth > 0 || nodeY.borderLeftWidth > 0);
                                const backgroundImage = /url(.*?)/.test(nodeY.css('backgroundImage'));
                                const backgroundColor = nodeY.has('backgroundColor');
                                const backgroundVisible = (borderVisible || backgroundImage || backgroundColor);
                                if (nodeY.children.length === 0) {
                                    const freeFormText = hasFreeFormText(nodeY.element, (SETTINGS.renderInlineText ? 0 : 1));
                                    if (freeFormText || (borderVisible && nodeY.element.textContent && nodeY.element.textContent.length > 0)) {
                                        xml = this.writeNode(nodeY, parentY, NODE_STANDARD.TEXT);
                                    }
                                    else if ((!nodeY.inlineText || (nodeY.toInt('textIndent') + nodeY.bounds.width) < 0) && backgroundImage && nodeY.css('backgroundRepeat') === 'no-repeat') {
                                        nodeY.alignmentType |= NODE_ALIGNMENT.SINGLE;
                                        nodeY.excludeResource |= NODE_RESOURCE.FONT_STYLE | NODE_RESOURCE.VALUE_STRING;
                                        xml = this.writeNode(nodeY, parentY, NODE_STANDARD.IMAGE);
                                    }
                                    else if ((backgroundColor || backgroundImage) && (borderVisible || (nodeY.paddingTop + nodeY.paddingRight + nodeY.paddingRight + nodeY.paddingLeft) > 0)) {
                                        xml = this.writeNode(nodeY, parentY, NODE_STANDARD.LINE);
                                    }
                                    else if (!nodeY.documentRoot) {
                                        if (SETTINGS.collapseUnattributedElements &&
                                            nodeY.bounds.height === 0 &&
                                            !backgroundVisible &&
                                            !hasValue(nodeY.element.id) &&
                                            !hasValue(nodeY.dataset.ext))
                                        {
                                            deleteElementCache(nodeY.element, 'node');
                                            parentY.remove(nodeY);
                                            nodeY.hide();
                                        }
                                        else if (backgroundVisible) {
                                            xml = this.writeNode(nodeY, parentY, NODE_STANDARD.TEXT);
                                        }
                                        else {
                                            xml = this.writeFrameLayout(nodeY, parentY);
                                        }
                                    }
                                }
                                else {
                                    if (nodeY.flex.enabled || nodeY.children.some(node => !node.pageflow) || nodeY.has('columnCount')) {
                                        xml = this.writeConstraintLayout(nodeY, parentY);
                                    }
                                    else {
                                        if (nodeY.children.length === 1) {
                                            const targeted =
                                                nodeY.children.filter(node => {
                                                    const element = document.getElementById(node.dataset.target as string);
                                                    return (element != null && hasValue(element.dataset.ext) && element !== parentY.element);
                                                });
                                            if ((SETTINGS.collapseUnattributedElements &&
                                                !nodeY.documentRoot &&
                                                !hasValue(nodeY.element.id) &&
                                                !hasValue(nodeY.dataset.ext) &&
                                                !hasValue(nodeY.dataset.target) &&
                                                nodeY.toInt('width') === 0 &&
                                                nodeY.toInt('height') === 0 &&
                                                !backgroundVisible &&
                                                !nodeY.has('textAlign') && !nodeY.has('verticalAlign') &&
                                                nodeY.float !== 'right' && !nodeY.autoMargin && nodeY.alignOrigin &&
                                                !this.controllerHandler.hasAppendProcessing(nodeY.id)) ||
                                                (nodeY.documentRoot && targeted.length === 1))
                                            {
                                                const child = nodeY.children[0];
                                                child.documentRoot = nodeY.documentRoot;
                                                child.siblingIndex = nodeY.siblingIndex;
                                                if (parentY.id !== 0) {
                                                    child.parent = parentY;
                                                }
                                                if (targeted.length === 0) {
                                                    nodeY.resetBox(BOX_STANDARD.MARGIN, child, true);
                                                    child.modifyBox(BOX_STANDARD.MARGIN_TOP, nodeY.paddingTop);
                                                    child.modifyBox(BOX_STANDARD.MARGIN_RIGHT, nodeY.paddingRight);
                                                    child.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, nodeY.paddingBottom);
                                                    child.modifyBox(BOX_STANDARD.MARGIN_LEFT, nodeY.paddingLeft);
                                                }
                                                nodeY.hide();
                                                axisY[k] = child as T;
                                                k--;
                                                continue;
                                            }
                                            else {
                                                xml = this.writeFrameLayout(nodeY, parentY);
                                            }
                                        }
                                        else {
                                            const children = nodeY.children as T[];
                                            const [linearX, linearY] = [NodeList.linearX(children), NodeList.linearY(children)];
                                            if (!parentY.flex.enabled && children.every(node => node.pageflow)) {
                                                const float = new Set(children.map(node => node.float));
                                                if (linearX) {
                                                    if (float.size === 1 && float.has('none') && children.every(node => node.toInt('verticalAlign') === 0)) {
                                                        if (children.some(node => ['text-top', 'text-bottom'].includes(node.css('verticalAlign')))) {
                                                            xml = this.writeConstraintLayout(nodeY, parentY);
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                        }
                                                        else if (this.isRelativeHorizontal(children) && children.every(node => ['baseline', 'initial', 'unset', 'top', 'middle', 'sub', 'super'].includes(node.css('verticalAlign')))) {
                                                            xml = this.writeRelativeLayout(nodeY, parentY);
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                        }
                                                    }
                                                    if (xml === '') {
                                                        if ((float.size === 1 || !float.has('right'))) {
                                                            if (children.some(node => node.plainText && node.multiLine)) {
                                                                xml = this.writeRelativeLayout(nodeY, parentY);
                                                                nodeY.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP;
                                                            }
                                                            else {
                                                                xml = this.writeLinearLayout(nodeY, parentY, true);
                                                            }
                                                        }
                                                        else if ((float.has('left') || float.has('none')) && float.has('right')) {
                                                            xml = this.writeFrameLayoutHorizontal(nodeY, parentY, nodeY.children as T[]);
                                                        }
                                                    }
                                                }
                                                else {
                                                    const clearedBlock = NodeList.cleared(children);
                                                    if (linearY || (children.some(node => node.blockStatic || clearedBlock.has(node)) && !children.some(node => node.autoMargin))) {
                                                        xml = this.writeLinearLayout(nodeY, parentY, false);
                                                        if (linearY) {
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                                        }
                                                    }
                                                }
                                            }
                                            if (xml === '') {
                                                if (children.every(node => node.pageflow && node.inlineElement)) {
                                                    if (this.isFrameHorizontal(children, cleared)) {
                                                        xml = this.writeFrameLayoutHorizontal(nodeY, parentY, children);
                                                    }
                                                    else {
                                                        xml = this.writeRelativeLayout(nodeY, parentY);
                                                        if (getElementsBetweenSiblings(children[0].element, children[children.length - 1].element).filter(element => isLineBreak(element, '')).length === 0) {
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP;
                                                        }
                                                    }
                                                }
                                                else {
                                                    xml = this.writeConstraintLayout(nodeY, parentY);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                xml = this.writeNode(nodeY, parentY, nodeY.controlName);
                            }
                            renderXml(nodeY, parentY, xml, current);
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
                const [parentId, renderPosition] = id.split(':');
                const templates = Array.from(views.values());
                if (templates.length > 0) {
                    if (this._sorted[parentId] != null) {
                        const parsed: string[] = [];
                        this._sorted[parentId].forEach(value => {
                            const result = templates.find(view => view.indexOf(getPlaceholder(value, '@')) !== -1);
                            if (result) {
                                parsed.push(result);
                            }
                        });
                        if (parsed.length === templates.length) {
                            content.push(...parsed);
                        }
                    }
                    if (content.length === 0) {
                        content.push(...templates);
                    }
                    id = parentId + (renderPosition != null ? `:${renderPosition}` : '');
                    const placeholder = getPlaceholder(id);
                    if (output.indexOf(placeholder) !== -1) {
                        output = replacePlaceholder(output, placeholder, content.join(''));
                        empty = false;
                    }
                    else {
                        this.addRenderQueue(id, templates);
                    }
                }
            }
            if (this.controllerHandler.supportInclude) {
                for (const [current, views] of external.entries()) {
                    const templates = Array.from(views.values());
                    if (templates.length > 0) {
                        const xml = this.controllerHandler.renderMerge(current, templates);
                        this.addInclude(current, xml);
                    }
                }
            }
        }
        const root = this.cache.parent as T;
        if (root.renderExtension.length === 0 || !root.isSet('dataset', 'target')) {
            const pathname = trim((optional(root, 'dataset.folder') as string).trim(), '/');
            this.updateLayout((!empty ? output : ''), pathname, (root.renderExtension.length > 0 && root.renderExtension.some(item => item.documentRoot)));
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
        else if (root.renderExtension.length === 0) {
            root.hide();
        }
        this.cache.list.sort((a: T, b: T) => {
            if (!a.visible) {
                return 1;
            }
            else if (!b.visible) {
                return -1;
            }
            else if (a.renderDepth === 0 && b.renderDepth === 0) {
                return (a.id < b.id ? -1 : 1);
            }
            else if (a.renderDepth !== b.renderDepth) {
                return (a.renderDepth < b.renderDepth ? -1 : 1);
            }
            else if (a.documentParent.renderIndex !== b.documentParent.renderIndex) {
                return (a.documentParent.renderIndex < b.documentParent.renderIndex ? -1 : 1);
            }
            else {
                return (a.renderIndex < b.renderIndex ? -1 : 1);
            }
        });
        this.cacheSession.list.push(...this.cache.list);
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

    public writeFrameLayoutHorizontal(group: T, parent: T, nodes: T[]) {
        let xml = '';
        const [floated, pageflow] = new NodeList(nodes).partition(node => node.floating);
        const inline = pageflow.filter(node => !node.autoMargin);
        const center = pageflow.filter(node => node.centerMarginHorizontal);
        const [right, left] = new NodeList(floated.list).partition(node => node.float === 'right');
        right.list.push(...pageflow.list.filter(node => node.autoLeftMargin));
        left.list.push(...pageflow.list.filter(node => node.autoRightMargin));
        let layers: Null<NodeList<T> | NodeList<T>[]>[];
        if (inline.length === nodes.length) {
            if (this.isRelativeHorizontal(inline.list)) {
                xml = this.writeRelativeLayout(group, parent);
                group.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                return xml;
            }
            else {
                xml = this.writeLinearLayout(group, parent, true);
                return xml;
            }
        }
        else if (right.length === nodes.length) {
            xml = this.writeLinearLayout(group, parent, true);
            group.alignmentType |= NODE_ALIGNMENT.FLOAT | NODE_ALIGNMENT.RIGHT;
            return xml;
        }
        else if (center.length === 0 && right.length === 0 && NodeList.linearX(inline.list)) {
            if (left.length > 0) {
                group.alignmentType |= NODE_ALIGNMENT.FLOAT | NODE_ALIGNMENT.LEFT;
            }
            const sorted = this.sortByAlignment([...left.list, ...inline.list], undefined, NODE_ALIGNMENT.HORIZONTAL, false);
            if (left.linearX && inline.linearX && !sorted[sorted.length - 1].blockStatic && this.isRelativeHorizontal(sorted)) {
                xml = this.writeRelativeLayout(group, parent);
                group.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                return xml;
            }
            else {
                xml = this.writeLinearLayout(group, parent, true);
                layers = [left, inline];
            }
        }
        else {
            xml = this.writeFrameLayout(group, parent, true);
            let sublayer: Null<NodeList<T> | NodeList<T>[]>;
            if (left.length === 0) {
                sublayer = inline;
            }
            else if (inline.length === 0) {
                sublayer = left;
            }
            else {
                sublayer = [left, inline];
            }
            layers = [sublayer, null, center, right];
            group.alignmentType |= NODE_ALIGNMENT.FLOAT | NODE_ALIGNMENT.LEFT | NODE_ALIGNMENT.RIGHT;
        }
        function setAlignment(subgroup: T, index: number) {
            switch (index) {
                case 0:
                case 1:
                    subgroup.alignmentType |= NODE_ALIGNMENT.LEFT;
                    break;
                case 3:
                    subgroup.alignmentType |= NODE_ALIGNMENT.RIGHT;
                    break;
            }
        }
        layers.forEach((item, index) => {
            if (item != null) {
                if (Array.isArray(item)) {
                    const layer = [...item[0], ...item[1]];
                    const leftgroup = this.controllerHandler.createGroup(layer[0], layer, group);
                    xml = replacePlaceholder(xml, group.id, this.writeLinearLayout(leftgroup, group, true));
                    leftgroup.alignmentType |= NODE_ALIGNMENT.FLOAT | NODE_ALIGNMENT.LEFT;
                    group = leftgroup;
                }
                (Array.isArray(item) ? item : [item]).forEach(section => {
                    if (section.length > 1) {
                        let content = '';
                        const subgroup = this.controllerHandler.createGroup(section.list[0], section.list, group);
                        if (index <= 1 && this.isRelativeHorizontal(section.list)) {
                            content = this.writeRelativeLayout(subgroup, group);
                            subgroup.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                        }
                        else {
                            content = this.writeLinearLayout(subgroup, group, true);
                            this.sortByAlignment(subgroup.children, subgroup, NODE_ALIGNMENT.HORIZONTAL);
                            if (index === 3) {
                                if (subgroup.children.some(node => node.marginLeft < 0)) {
                                    let marginRight = 0;
                                    const sorted: T[] = [];
                                    subgroup.children.slice().reverse().forEach((node: T) => {
                                        let prepend = false;
                                        if (marginRight < 0) {
                                            if (Math.abs(marginRight) > node.bounds.width) {
                                                marginRight += node.bounds.width;
                                                node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, node.bounds.width * -1, true);
                                                prepend = true;
                                            }
                                            else {
                                                if (Math.abs(marginRight) >= node.marginRight) {
                                                    node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, Math.ceil(Math.abs(marginRight) - node.marginRight));
                                                    node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, null);
                                                }
                                                else {
                                                    node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, marginRight, true);
                                                }
                                            }
                                        }
                                        if (node.marginLeft < 0) {
                                            marginRight += Math.max(node.marginLeft, node.bounds.width * -1);
                                            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
                                        }
                                        if (prepend) {
                                            sorted.splice(sorted.length - 1, 0, node);
                                        }
                                        else {
                                            sorted.push(node);
                                        }
                                    });
                                    subgroup.children = sorted.reverse();
                                    this.saveSortOrder(subgroup.id, <T[]> subgroup.children);
                                }
                            }
                        }
                        if (index === 0 || index === 3) {
                            subgroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                        }
                        subgroup.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                        setAlignment(subgroup, index);
                        xml = replacePlaceholder(xml, group.id, content);
                        group.renderAppend(subgroup);
                    }
                    else if (section.length > 0) {
                        const single = section.list[0];
                        single.alignmentType |= NODE_ALIGNMENT.SINGLE;
                        setAlignment(single, index);
                        single.renderPosition = index;
                        xml = replacePlaceholder(xml, group.id, `{:${group.id}:${index}}`);
                        group.renderAppend(single);
                    }
                });
            }
        });
        return xml;
    }

    public writeFrameLayoutVertical(group: T, parent: T, nodes: T[], cleared: Set<T>) {
        let xml = this.writeLinearLayout(group, parent, false);
        if (group.blockStatic) {
            group.alignmentType |= NODE_ALIGNMENT.VERTICAL;
        }
        const rowsCurrent: T[][] = [];
        const rowsFloated: T[][] = [];
        const current: T[] = [];
        const floated: T[] = [];
        let leadingMargin = 0;
        let clearReset = false;
        let linearVertical = true;
        nodes.some(node => {
            if (!node.floating) {
                leadingMargin += node.linear.height;
                return true;
            }
            return false;
        });
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (i > 0 && cleared.has(node)) {
                if (!node.floating) {
                    node.modifyBox(BOX_STANDARD.MARGIN_TOP, null);
                    rowsCurrent.push(current.slice());
                    current.length = 0;
                    rowsFloated.push(floated.slice());
                    floated.length = 0;
                }
                else {
                    clearReset = true;
                }
            }
            if (node.floating) {
                floated.push(node);
            }
            else {
                if (clearReset && !cleared.has(node)) {
                    linearVertical = false;
                }
                current.push(node);
            }
        }
        if (floated.length > 0) {
            rowsFloated.push(floated);
        }
        if (current.length > 0) {
            rowsCurrent.push(current);
        }
        if (!linearVertical) {
            let content = '';
            for (let i = 0; i < Math.max(rowsFloated.length, rowsCurrent.length); i++) {
                const floating = rowsFloated[i] || [];
                const pageflow = rowsCurrent[i] || [];
                if (pageflow.length > 0 || floating.length > 0) {
                    const baseNode = floating[0] || pageflow[0];
                    const basegroup = this.controllerHandler.createGroup(baseNode, undefined, group);
                    const children: T[] = [];
                    let subgroup: Null<T> = null;
                    if (floating.length > 1) {
                        subgroup = this.controllerHandler.createGroup(floating[0], floating, basegroup);
                        basegroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                    }
                    else if (floating.length > 0) {
                        subgroup = floating[0];
                        subgroup.parent = basegroup;
                        basegroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                    }
                    if (subgroup != null) {
                        children.push(subgroup);
                        if (i === 0 && leadingMargin > 0) {
                            subgroup.modifyBox(BOX_STANDARD.MARGIN_TOP, leadingMargin);
                        }
                        subgroup = null;
                    }
                    if (pageflow.length > 1) {
                        subgroup = this.controllerHandler.createGroup(pageflow[0], pageflow, basegroup);
                    }
                    else if (pageflow.length > 0) {
                        subgroup = pageflow[0];
                        subgroup.parent = basegroup;
                    }
                    if (subgroup != null) {
                        children.push(subgroup);
                    }
                    if (group.blockStatic) {
                        basegroup.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                    }
                    basegroup.init();
                    content += this.writeFrameLayout(basegroup, group, true);
                    children.forEach((node, index) => {
                        if (nodes.includes(node)) {
                            content = replacePlaceholder(content, basegroup.id, `{:${basegroup.id}:${index}}`);
                        }
                        else {
                            content = replacePlaceholder(content, basegroup.id, this.writeLinearLayout(node, basegroup, false));
                            node.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                            if (group.blockStatic) {
                                node.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                            }
                        }
                    });
                }
            }
            xml = replacePlaceholder(xml, group.id, content);
        }
        return xml;
    }

    public appendRenderQueue() {
        for (const node of this.cacheSession) {
            for (const ext of node.renderExtension) {
                ext.setTarget(node);
                ext.beforeInsert();
            }
        }
        const template = {};
        for (const id in this.renderQueue) {
            const [originalId] = id.split(':');
            let replaceId = originalId;
            if (!isNumber(replaceId)) {
                const target = getNodeFromElement(document.getElementById(replaceId));
                if (target) {
                    replaceId = target.id.toString();
                }
            }
            let output = this.renderQueue[id].join('\n');
            if (replaceId !== originalId) {
                const target = this.cacheSession.locate('id', parseInt(replaceId));
                if (target) {
                    const depth = target.renderDepth + 1;
                    output = modifyIndent(output, depth);
                    const pattern = /{@([0-9]+)}/g;
                    let match: Null<RegExpExecArray> = null;
                    let i = 0;
                    while ((match = pattern.exec(output)) != null) {
                        const node = this.cacheSession.locate('id', parseInt(match[1]));
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
                    template[inner] = template[inner].replace(getPlaceholder(outer), template[outer]);
                    template[outer] = template[outer].replace(getPlaceholder(inner), template[inner]);
                }
            }
        }
        for (const value of this.everyLayout) {
            for (const id in template) {
                value.content = value.content.replace(getPlaceholder(id), template[id]);
            }
            value.content = this.controllerHandler.appendRenderQueue(value.content);
        }
        for (const node of this.cacheSession) {
            for (const ext of node.renderExtension) {
                ext.setTarget(node);
                ext.afterInsert();
            }
        }
    }

    public getEmptySpacer(nodeType: number, depth: number, width?: string, height?: string, columnSpan?: number) {
        return this.controllerHandler.getEmptySpacer(nodeType, depth, width, height, columnSpan);
    }

    public createLayout(filename: string) {
        this._currentIndex = this._views.length;
        this._views.push({
            filename,
            pathname: '',
            content: ''
        });
    }

    public updateLayout(content: string, pathname = '', documentRoot = false) {
        pathname = pathname || this.controllerHandler.settings.folderLayout;
        if (documentRoot && this._views.length > 0 && this._views[0].content === '') {
            const current = <PlainFile> this._views.pop();
            Object.assign(this._views[0], {
                pathname,
                filename: current.filename,
                content
            });
            this._currentIndex = 0;
        }
        else {
            this.currentLayout.pathname = pathname;
            this.currentLayout.content = content;
        }
    }

    public addInclude(filename: string, content: string) {
        this._includes.push({
            pathname: this.controllerHandler.settings.folderLayout,
            filename,
            content
        });
    }

    public addRenderQueue(id: string, views: string[]) {
        if (this.renderQueue[id] == null) {
            this.renderQueue[id] = [];
        }
        this.renderQueue[id].push(...views);
    }

    public sortByAlignment<T extends Node>(children: T[], parent?: T, alignmentType = NODE_ALIGNMENT.NONE, preserve = true) {
        let sorted = false;
        if (parent && alignmentType === NODE_ALIGNMENT.NONE) {
            if (parent.linearHorizontal) {
                alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
            }
            else if (parent.is(NODE_STANDARD.CONSTRAINT) && children.some(node => !node.pageflow)) {
                alignmentType |= NODE_ALIGNMENT.ABSOLUTE;
            }
        }
        if (hasBit(alignmentType, NODE_ALIGNMENT.HORIZONTAL)) {
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
        if (hasBit(alignmentType, NODE_ALIGNMENT.ABSOLUTE)) {
            if (children.some(node => node.toInt('zIndex') !== 0)) {
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
        if (parent && preserve && sorted) {
            this.saveSortOrder(parent.id, children);
        }
        return children;
    }

    public saveSortOrder<T extends Node>(id: string | number, nodes: T[]) {
        this._sorted[id.toString()] = nodes.map(node => node.id);
    }

    public getExtension(name: string) {
        return this.extensions.find(item => item.name === name);
    }

    public addXmlNs(name: string, uri: string) {
        this.controllerHandler.addXmlNs(name, uri);
    }

    public toString() {
        return (this._views.length > 0 ? this._views[0].content : '');
    }

    private insertNode(element: Element, parent?: T) {
        let node: Null<T> = null;
        if (element.nodeName.charAt(0) === '#') {
            if (element.nodeName === '#text') {
                if (isPlainText(element, true) || cssParent(element, 'whiteSpace', 'pre', 'pre-wrap')) {
                    node = new this._Node(this.cache.nextId, SETTINGS.targetAPI, element);
                    node.nodeName = 'PLAINTEXT';
                    if (parent) {
                        node.parent = parent;
                        node.inherit(parent, 'style');
                    }
                    else {
                        node.css('whiteSpace', (element.parentElement ? getStyle(element.parentElement).whiteSpace : null) || 'normal');
                    }
                    node.css({
                        position: 'static',
                        display: 'inline',
                        clear: 'none',
                        cssFloat: 'none',
                        verticalAlign: 'baseline'
                    });
                }
            }
        }
        else if (element instanceof HTMLElement) {
            switch (element.tagName) {
                case 'OPTION':
                case 'MAP':
                case 'AREA':
                    return null;
            }
            const elementNode = new this._Node(this.cache.nextId, SETTINGS.targetAPI, element);
            if (isElementVisible(element)) {
                node = elementNode;
                node.setExclusions();
                node.setOverflow();
            }
            else {
                elementNode.excluded = true;
                elementNode.visible = false;
            }
        }
        if (node != null) {
            this.cache.append(node);
        }
        return node;
    }

    private prioritizeExtOrder(available: IExtension[], element: Element) {
        let extensions: string[] = [];
        let current: Null<Element> = element;
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

    private isFrameHorizontal(nodes: T[], cleared: Set<T>) {
        return nodes.some(node => node.floating) && !nodes.every((node, index) => nodes[0].float === node.float && (index === 0 || !cleared.has(node)));
    }

    private isRelativeHorizontal(nodes: T[]) {
        return nodes.some(node => node.plainText && node.multiLine) || (nodes.some(node => node.imageElement) && nodes.some(node => node.textElement)) || nodes.every(node => node.textElement && !node.floating && node.alignOrigin && node.toInt('verticalAlign') >= 0) || !NodeList.linearX(nodes);
    }

    set appName(value) {
        if (this.resourceHandler != null) {
            this.resourceHandler.file.appName = value;
        }
    }
    get appName() {
        return (this.resourceHandler != null ? this.resourceHandler.file.appName : '');
    }

    set currentLayout(value) {
        this._views[this._currentIndex] = value;
    }
    get currentLayout() {
        return this._views[this._currentIndex];
    }

    get everyLayout() {
        return [...this._views, ...this._includes];
    }

    get viewData(): ViewData<NodeList<T>> {
        return { cache: this.cacheSession, views: this._views, includes: this._includes };
    }

    get size() {
        return this._views.length + this._includes.length;
    }
}