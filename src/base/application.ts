import { LayoutMapX, LayoutMapY, Null, ObjectIndex, ObjectMap, PlainFile, ViewData } from '../lib/types';
import { IExtension } from '../extension/lib/types';
import Controller from './controller';
import Resource from './resource';
import Node from './node';
import NodeList from './nodelist';
import { convertInt, formatPX, hasBit, isNumber, optional, sortAsc, trim } from '../lib/util';
import { getPlaceholder, modifyIndent, replacePlaceholder } from '../lib/xml';
import { cssParent, deleteElementCache, getElementCache, getNodeFromElement, getStyle, hasFreeFormText, isElementVisible, isLineBreak, isPlainText, setElementCache } from '../lib/dom';
import { BOX_STANDARD, NODE_ALIGNMENT, NODE_PROCEDURE, NODE_RESOURCE, NODE_STANDARD, OVERFLOW_ELEMENT } from '../lib/constants';
import SETTINGS from '../settings';

export default class Application<T extends Node> {
    public cache: NodeList<T>;
    public cacheInternal: NodeList<T>;
    public controllerHandler: Controller<T>;
    public resourceHandler: Resource<T>;
    public elements: Set<HTMLElement> = new Set();
    public lateInsert: ObjectIndex<string[]> = {};
    public extensions: IExtension[] = [];
    public processing: T[];
    public closed = false;

    private _views: PlainFile[] = [];
    private _includes: PlainFile[] = [];
    private _sorted: ObjectMap<number[]> = {};
    private _currentIndex = -1;

    constructor(private _Node: { new (id: number, api: number, element?: Element, options?: {}): T }) {
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
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.LAYOUT)) {
                node.setLayout();
            }
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.ALIGNMENT)) {
                node.setAlignment();
            }
        }
        for (const node of visible) {
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.OPTIMIZATION)) {
                node.applyOptimizations({ autoSizePaddingAndBorderWidth: SETTINGS.autoSizePaddingAndBorderWidth });
            }
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.CUSTOMIZATION)) {
                node.applyCustomizations(SETTINGS.customizationsOverwritePrivilege);
            }
        }
        this.appendLateInsert();
        this.controllerHandler.setDimensions(this.viewData);
        for (const node of this.cacheInternal) {
            const ext = node.renderExtension;
            if (ext != null) {
                ext.setTarget(node);
                ext.finalize();
            }
        }
        this.resourceHandler.finalize(this.viewData);
        this.controllerHandler.finalize(this.viewData);
        this.closed = true;
    }

    public reset() {
        for (const node of this.cacheInternal) {
            deleteElementCache(node.element, 'style', 'styleMap', 'boxSpacing', 'boxStyle', 'fontStyle', 'imageSource', 'optionArray', 'valueString');
        }
        this.cache.reset();
        this.cacheInternal.reset();
        this.resetController();
        this.resetResource();
        this.appName = '';
        this.lateInsert = {};
        this._views = [];
        this._includes = [];
        this._sorted = {};
        this._currentIndex = -1;
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
            Array.from(document.body.childNodes).some((item: Element) => (isElementVisible(item) && ++nodeTotal > 1));
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
        const supportInline = this.controllerHandler.supportInline;
        function inlineElement(element: Element) {
            const styleMap = getElementCache(element, 'styleMap');
            return ((!styleMap || Object.keys(styleMap).length === 0) && supportInline.includes(element.tagName) && element.children.length === 0);
        }
        for (const element of Array.from(elements) as HTMLElement[]) {
            if (!this.elements.has(element)) {
                this.prioritizeExt(this.extensions, element).some(item => item.init(element));
                if (!this.elements.has(element)) {
                    if (inlineElement(element) && element.parentElement && Array.from(element.parentElement.children).every(item => inlineElement(item))) {
                        setElementCache(element, 'supportInline', true);
                        continue;
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
                    if (node.element.tagName !== 'SELECT') {
                        text.push(element);
                    }
                }
                else if (!supportInline.includes(element.tagName) || getNodeFromElement(element)) {
                    valid = false;
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
                style.verticalAlign = node.styleMap.verticalAlign || '';
                element.style.verticalAlign = 'top';
                if (node.overflow !== OVERFLOW_ELEMENT.NONE) {
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
            this.cache.each(node => node.setBounds());
            for (const node of this.cache) {
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
                                        else if (labelParent && (label.plainText || label.inlineText)) {
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
                    if (!firstChild.pageflow && firstChild.toInt('top') === 0 && firstChild.toInt('right') === 0 && firstChild.toInt('bottom') === 0 && firstChild.toInt('left') === 0) {
                        firstChild.pageflow = true;
                    }
                }
                if (node.children.some((current: T) => {
                        if (current.pageflow) {
                            return (current.float !== 'right' && (Math.abs(current.marginLeft) >= current.bounds.width || !['center', 'right', 'end'].includes(current.cssParent('textAlign', true))) && (current.marginLeft < 0 && node.marginLeft >= Math.abs(current.marginLeft)));
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
                            if (node.cssOriginal('marginLeft') === 'auto') {
                                node.css('marginLeft', <string> node.style.marginLeft);
                            }
                            node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, null);
                            const widthLeft = (node.has('width') ? node.toInt('width') : Math.max.apply(null, sectionRight.list.map(item => item.linear.width)));
                            const widthRight = Math.max.apply(null, sectionRight.list.map(item => Math.abs(item.toInt('right'))));
                            sectionLeft.each((item: T) => {
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
                        (<HTMLElement> node.element).style[attr] = style[attr];
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
                    if (child && child.visible) {
                        child.siblingIndex = i++;
                    }
                });
                sortAsc(node.children, 'siblingIndex');
            }
            this.cache.sortAsc('depth', 'parent.siblingIndex', 'siblingIndex', 'id');
            this.createLayout(<string> rootElement.dataset.viewName);
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
            nodes.forEach(node => setMapY(-2, node.id, node));
        };
        for (const indexId of mapY.values()) {
            const partial = new Map<string, Map<number, string>>();
            const external = new Map<string, Map<number, string>>();
            function insertViewTemplate(data: Map<string, Map<number, string>>, node: T, parentId: string, value: string, current: string) {
                const key = parentId + (current === '' && node.renderIndex !== -1 ? `:${node.renderIndex}` : '');
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
                                const target = application.findByDomId(<string> node.dataset.target, true);
                                if (!target || target !== parent) {
                                    application.addLateInsert(<string> node.dataset.target, [xml]);
                                    node.relocated = true;
                                    return;
                                }
                            }
                            else if (parent.isSet('dataset', 'target')) {
                                application.addLateInsert(parent.nodeId, [xml]);
                                node.dataset.target = parent.nodeId;
                                return;
                            }
                        }
                        insertViewTemplate(partial, node, parent.id.toString(), xml, current);
                    }
                }
            }
            for (const parentNode of indexId.values()) {
                if (parentNode.children.length === 0) {
                    continue;
                }
                const axisY: T[] = [];
                const below: T[] = [];
                const middle: T[] = [];
                const above: T[] = [];
                for (const node of parentNode.children as T[]) {
                    if (node.documentRoot) {
                        axisY.push(node);
                    }
                    else if (node.pageflow || node.alignMargin) {
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
                this.sortByAlignment(middle, parentNode);
                axisY.push(...sortAsc(below, 'style.zIndex', 'siblingIndex'));
                axisY.push(...middle);
                axisY.push(...sortAsc(above, 'style.zIndex', 'siblingIndex'));
                this.processing = axisY;
                const cleared = NodeList.cleared(axisY);
                const includes: string[] = [];
                let current = '';
                for (let k = 0; k < axisY.length; k++) {
                    let nodeY = axisY[k];
                    if (!nodeY.documentRoot && this.elements.has(<HTMLElement> nodeY.element)) {
                        continue;
                    }
                    let parent = nodeY.parent as T;
                    if (this.controllerHandler.supportInclude) {
                        const filename = (optional(nodeY, 'dataset.include') as string).trim();
                        if (filename !== '' && includes.indexOf(filename) === -1) {
                            renderXml(nodeY, parent, this.controllerHandler.renderInclude(nodeY, parent, filename), (includes.length > 0 ? includes[includes.length - 1] : ''));
                            includes.push(filename);
                        }
                        current = (includes.length > 0 ? includes[includes.length - 1] : '');
                        if (current !== '') {
                            const cloneParent = parent.clone() as T;
                            cloneParent.renderDepth = this.controllerHandler.baseRenderDepth(current);
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
                        const processed: IExtension[] = [];
                        let proceed = false;
                        this.prioritizeExt(this.extensions, nodeY.element).some(item => {
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
                                        processed.push(item);
                                    }
                                    if (result.proceed) {
                                        proceed = true;
                                        return true;
                                    }
                                }
                            }
                            return false;
                        });
                        if (nodeY.renderExtension == null && processed.length > 0) {
                            nodeY.renderExtension = processed[0];
                        }
                        if (proceed) {
                            continue;
                        }
                        const linearVertical = parent.linearVertical;
                        if (nodeY.pageflow && nodeY.alignmentType <= NODE_ALIGNMENT.OPEN && !parent.flex.enabled && !parent.has('columnCount') && parent.alignmentType <= NODE_ALIGNMENT.OPEN && (parent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE) || linearVertical) && current === '') {
                            const horizontal = [nodeY];
                            const vertical = [nodeY];
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
                                                              (cleared.has(previous) && adjacent.blockStatic) ||
                                                              (floatSize === 1 && previous.floating && adjacent.floating && adjacent.linear.top >= previous.linear.bottom);
                                        if (cleared.has(adjacent)) {
                                            const floated = new Set(['both', ...horizontal.map(item => item.float)]);
                                            if (horizontal.length >= vertical.length && !floated.has(adjacent.css('clear')) && !alignVertical) {
                                                horizontal.push(adjacent);
                                                continue;
                                            }
                                            if (horizontal.length === 1) {
                                                if (vertical[vertical.length - 1] !== previous) {
                                                    vertical.length = 0;
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
                                            if (linearVertical) {
                                                const previousAbove = vertical[vertical.length - 1];
                                                if (previousAbove.linearVertical) {
                                                    adjacent.parent = previousAbove;
                                                    continue;
                                                }
                                            }
                                            if (vertical[vertical.length - 1] !== previous) {
                                                vertical.length = 0;
                                                break;
                                            }
                                            else {
                                                vertical.push(adjacent);
                                                continue;
                                            }
                                        }
                                    }
                                    if (isLineBreak(<Element> adjacent.element.previousSibling)) {
                                        if (!linearVertical) {
                                            if (horizontal.length > 1) {
                                                break;
                                            }
                                            else {
                                                if (vertical[vertical.length - 1] !== previous) {
                                                    vertical.length = 0;
                                                    break;
                                                }
                                                else {
                                                    vertical.push(adjacent);
                                                    continue;
                                                }
                                            }
                                        }
                                    }
                                    if (horizontal[horizontal.length - 1] !== previous) {
                                        horizontal.length = 0;
                                        break;
                                    }
                                    horizontal.push(adjacent);
                                }
                            }
                            let group: Null<T> = null;
                            let groupXml = '';
                            if (horizontal.length > 1) {
                                if (horizontal.some(node => node.floating) && !horizontal.every(node => horizontal[0].float === node.float && !cleared.has(node))) {
                                    group = this.controllerHandler.createGroup(nodeY, horizontal, parent);
                                    groupXml = this.writeFrameLayoutHorizontal(group, parent, horizontal);
                                    group.alignmentType |= NODE_ALIGNMENT.HORIZONTAL | NODE_ALIGNMENT.FLOAT;
                                }
                                else {
                                    if (horizontal.length === axisY.length) {
                                        parent.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                        if (parent.is(NODE_STANDARD.RELATIVE)) {
                                            this.sortByAlignment(axisY, parent, NODE_ALIGNMENT.HORIZONTAL);
                                            this.sortByAlignment(parent.children, parent, NODE_ALIGNMENT.HORIZONTAL, true);
                                            nodeY = axisY[k];
                                        }
                                    }
                                    else {
                                        if (horizontal.some(node => node.multiLine) || !NodeList.linearX(horizontal)) {
                                            group = this.controllerHandler.createGroup(nodeY, horizontal, parent);
                                            groupXml = this.writeRelativeLayout(group, parent);
                                            group.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP;
                                        }
                                        else if (horizontal.some(node => !node.parent.linearHorizontal)) {
                                            group = this.controllerHandler.createGroup(nodeY, horizontal, parent);
                                            groupXml = this.writeLinearLayout(group, parent, true);
                                            this.sortByAlignment(group.children, group, NODE_ALIGNMENT.HORIZONTAL, true);
                                        }
                                    }
                                }
                            }
                            else if (vertical.length > 1) {
                                if (!parent.is(NODE_STANDARD.CONSTRAINT) && vertical.some(node => cleared.has(node) && node !== vertical[vertical.length - 1]) && !vertical.every(node => cleared.has(node))) {
                                    group = this.controllerHandler.createGroup(nodeY, vertical, parent);
                                    groupXml = this.writeFrameLayoutVertical(group, vertical, cleared);
                                }
                                else {
                                    if (vertical.length === axisY.length) {
                                        parent.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                    }
                                    else if (vertical.some(node => !node.parent.linearVertical)) {
                                        group = this.controllerHandler.createGroup(nodeY, vertical, parent);
                                        groupXml = this.writeLinearLayout(group, parent, false);
                                    }
                                }
                            }
                            if (group != null) {
                                renderXml(group, parent, groupXml, '', true);
                                parent = nodeY.parent as T;
                            }
                        }
                        if (!nodeY.rendered) {
                            let xml = '';
                            if (nodeY.nodeName === '') {
                                const untargeted = nodeY.children.filter(node => !node.isSet('dataset', 'target'));
                                if (untargeted.length === 0) {
                                    const freeFormText = hasFreeFormText(nodeY.element, 1);
                                    if (SETTINGS.collapseUnattributedElements && !freeFormText && Object.keys(nodeY.styleMap).length === 0 && nodeY.viewWidth === 0 && nodeY.viewHeight === 0) {
                                        parent.remove(nodeY);
                                        nodeY.hide();
                                    }
                                    else {
                                        if ((!nodeY.inlineText || (nodeY.toInt('textIndent') + nodeY.bounds.width < 0)) && /url(.*?)/.test(nodeY.css('backgroundImage')) && nodeY.css('backgroundRepeat') === 'no-repeat' && !nodeY.has('backgroundColor')) {
                                            nodeY.alignmentType |= NODE_ALIGNMENT.SINGLE;
                                            nodeY.excludeResource |= NODE_RESOURCE.FONT_STYLE | NODE_RESOURCE.VALUE_STRING;
                                            xml = this.writeNode(nodeY, parent, NODE_STANDARD.IMAGE);
                                        }
                                        else if (freeFormText || nodeY.inline) {
                                            xml = this.writeNode(nodeY, parent, NODE_STANDARD.TEXT);
                                        }
                                        else if (!nodeY.inlineElement && (nodeY.borderTopWidth + nodeY.borderBottomWidth > 0 || nodeY.paddingTop + nodeY.paddingBottom > 0)) {
                                            xml = this.writeNode(nodeY, parent, NODE_STANDARD.LINE);
                                        }
                                        else if (!nodeY.documentRoot) {
                                            xml = this.writeFrameLayout(nodeY, parent);
                                        }
                                    }
                                }
                                else {
                                    if (nodeY.flex.enabled || untargeted.some(node => !node.pageflow) || nodeY.has('columnCount')) {
                                        xml = this.writeConstraintLayout(nodeY, parent);
                                    }
                                    else {
                                        if (untargeted.length === 1) {
                                            if (SETTINGS.collapseUnattributedElements && Object.keys(nodeY.styleMap).length === 0 && !this.controllerHandler.hasAppendProcessing(nodeY.id)) {
                                                const child = untargeted[0] as T;
                                                child.documentRoot = nodeY.documentRoot;
                                                child.parent = parent;
                                                nodeY.hide();
                                            }
                                            else {
                                                xml = this.writeFrameLayout(nodeY, parent);
                                            }
                                        }
                                        else {
                                            const children = nodeY.children as T[];
                                            const [linearX, linearY] = [NodeList.linearX(children), NodeList.linearY(children)];
                                            if (!parent.flex.enabled && children.every(node => node.pageflow)) {
                                                const float = new Set(children.map(node => node.float));
                                                if (linearX) {
                                                    const horizontalAlign = children.some(node => !['baseline', 'initial', 'sub', 'sup'].includes(node.css('verticalAlign')));
                                                    if (float.size === 1 && float.has('none') && children.some(node => node.hasElement && !['baseline', 'initial', 'top', 'middle', 'bottom', 'sub', 'sup'].includes(node.css('verticalAlign'))) && children.every(node => node.toInt('verticalAlign') === 0)) {
                                                        xml = this.writeConstraintLayout(nodeY, parent);
                                                        nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                        this.sortByAlignment(children, nodeY, nodeY.alignmentType, true);
                                                    }
                                                    else if (((float.size === 1 || !float.has('right')) && !children.some(node => node.multiLine)) || horizontalAlign) {
                                                        xml = this.writeLinearLayout(nodeY, parent, true);
                                                        if (children.some(node => node.plainText) || horizontalAlign) {
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                        }
                                                    }
                                                    else if ((float.has('left') || float.has('none')) && float.has('right')) {
                                                        const group = this.controllerHandler.createGroup(nodeY, children, parent, <HTMLElement> nodeY.element);
                                                        const groupXml = this.writeFrameLayoutHorizontal(group, parent, <T[]> group.children);
                                                        renderXml(group, parent, groupXml, current, true);
                                                        continue;
                                                    }
                                                }
                                                else {
                                                    const clearedBlock = NodeList.cleared(children);
                                                    if (linearY || (children.some(node => node.blockStatic || clearedBlock.has(node)) && !children.some(node => node.autoMargin))) {
                                                        xml = this.writeLinearLayout(nodeY, parent, false);
                                                        if (children.every(node => node.blockStatic)) {
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                                        }
                                                    }
                                                }
                                            }
                                            if (xml === '') {
                                                if (children.every(node => node.pageflow && node.inlineElement && !cleared.has(node))) {
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
                const templates = Array.from(views.values());
                if (templates.length > 0) {
                    if (this._sorted[parentId] != null) {
                        const parsed: string[] = [];
                        this._sorted[parentId].forEach(value => {
                            const result = templates.find((view: string) => view.indexOf(getPlaceholder(value, '@')) !== -1);
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
                    id = parentId + (renderIndex != null ? `:${renderIndex}` : '');
                    const placeholder = getPlaceholder(id);
                    if (output.indexOf(placeholder) !== -1) {
                        output = replacePlaceholder(output, placeholder, content.join(''));
                        empty = false;
                    }
                    else {
                        this.addLateInsert(id, templates);
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
        if (root.renderExtension == null || !root.isSet('dataset', 'target')) {
            const pathname = trim((optional(root, 'dataset.folder') as string).trim(), '/');
            this.updateLayout((!empty ? output : ''), pathname, (root.renderExtension != null && root.renderExtension.documentRoot));
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

    public writeFrameLayoutHorizontal(group: T, parent: T, nodes: T[]) {
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
        layers.forEach((item, index) => {
            if (item.length > 1) {
                let content = '';
                const subgroup = this.controllerHandler.createGroup(item.list[0], item.list, group);
                if (index !== 2 && (!item.linearX || item.list.some(node => node.plainText && node.multiLine))) {
                    content = this.writeRelativeLayout(subgroup, group);
                    subgroup.alignmentType |= NODE_ALIGNMENT.INLINE_WRAP;
                }
                else {
                    content = this.writeLinearLayout(subgroup, group, true);
                    this.sortByAlignment(subgroup.children, subgroup, NODE_ALIGNMENT.HORIZONTAL, true);
                    if (index === 2 && subgroup.children.some(node => node.marginLeft < 0)) {
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
                        this.preserveSortOrder(subgroup.id, <T[]> subgroup.children);
                    }
                    subgroup.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                }
                if (floated.length > 0) {
                    subgroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                }
                subgroup.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                subgroup.alignmentType |= (index < 2 ? NODE_ALIGNMENT.LEFT : NODE_ALIGNMENT.RIGHT);
                xml = replacePlaceholder(xml, group.id, content);
                group.renderAppend(subgroup);
            }
            else if (item.length > 0) {
                const single = item.list[0];
                single.alignmentType |= NODE_ALIGNMENT.SINGLE;
                single.alignmentType |= (index < 2 ? NODE_ALIGNMENT.LEFT : NODE_ALIGNMENT.RIGHT);
                single.renderIndex = index;
                xml = replacePlaceholder(xml, group.id, `{:${group.id}:${index}}`);
                group.renderAppend(single);
            }
        });
        return xml;
    }

    public writeFrameLayoutVertical(parent: T, nodes: T[], cleared: Set<T>) {
        let xml = '';
        const rowsCurrent: T[][] = [];
        const rowsFloated: T[][] = [];
        const current: T[] = [];
        const floated: T[] = [];
        let leadingMargin = 0;
        let clearReset = false;
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
                floated.push(node);
                if (!node.floating) {
                    node.modifyBox(BOX_STANDARD.MARGIN_TOP, null);
                    rowsCurrent.push(current.slice());
                    current.length = 0;
                }
                rowsFloated.push(floated.slice());
                floated.length = 0;
                clearReset = true;
            }
            else {
                if (node.floating) {
                    if (clearReset) {
                        rowsCurrent.push(current.slice());
                        current.length = 0;
                        clearReset = false;
                    }
                    floated.push(node);
                }
                else {
                    current.push(node);
                }
            }
        }
        rowsFloated.push(floated);
        rowsCurrent.push(current);
        for (let i = 0; i < Math.max(rowsFloated.length, rowsCurrent.length); i++) {
            const floating = rowsFloated[i] || [];
            const pageflow = rowsCurrent[i] || [];
            if (pageflow.length > 0 || floating.length > 0) {
                const baseNode = floating[0] || pageflow[0];
                const group = this.controllerHandler.createGroup(baseNode, undefined, parent);
                const children: T[] = [];
                let subgroup: Null<T> = null;
                if (floating.length > 1) {
                    subgroup = this.controllerHandler.createGroup(floating[0], floating, group);
                }
                else if (floating.length > 0) {
                    subgroup = floating[0];
                }
                if (subgroup != null) {
                    children.push(subgroup);
                    if (i === 0 && leadingMargin > 0) {
                        subgroup.modifyBox(BOX_STANDARD.MARGIN_TOP, leadingMargin);
                    }
                    subgroup = null;
                }
                if (pageflow.length > 1) {
                    subgroup = this.controllerHandler.createGroup(pageflow[0], pageflow, group);
                }
                else if (pageflow.length > 0) {
                    subgroup = pageflow[0];
                }
                if (subgroup != null) {
                    children.push(subgroup);
                }
                group.children = children;
                group.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                group.init();
                xml += this.writeFrameLayout(group, parent, true);
                children.forEach((item, index) => {
                    item.parent = group;
                    if (nodes.includes(item)) {
                        xml = replacePlaceholder(xml, group.id, `{:${group.id}:${index}}`);
                    }
                    else {
                        xml = replacePlaceholder(xml, group.id, this.writeLinearLayout(item, group, false));
                        item.alignmentType |= NODE_ALIGNMENT.VERTICAL | NODE_ALIGNMENT.SEGMENTED;
                    }
                });
            }
        }
        return xml;
    }

    public appendLateInsert() {
        for (const node of this.cacheInternal) {
            const ext = node.renderExtension;
            if (ext != null) {
                ext.setTarget(node);
                ext.beforeInsert();
            }
        }
        const template = {};
        for (const id in this.lateInsert) {
            const [originalId] = id.split(':');
            let replaceId = originalId;
            if (!isNumber(replaceId)) {
                const target = this.findByDomId(replaceId);
                if (target) {
                    replaceId = target.id.toString();
                }
            }
            let output = this.lateInsert[id].join('\n');
            if (replaceId !== originalId) {
                const target = this.cacheInternal.locate('id', parseInt(replaceId));
                if (target) {
                    const depth = target.renderDepth + 1;
                    output = modifyIndent(output, depth);
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
                    template[inner] = template[inner].replace(getPlaceholder(outer), template[outer]);
                    template[outer] = template[outer].replace(getPlaceholder(inner), template[inner]);
                }
            }
        }
        for (const value of this.everyLayout) {
            for (const id in template) {
                value.content = value.content.replace(getPlaceholder(id), template[id]);
            }
            value.content = this.controllerHandler.appendLateInsert(value.content);
        }
        for (const node of this.cacheInternal) {
            const ext = node.renderExtension;
            if (ext != null) {
                ext.setTarget(node);
                ext.afterInsert();
            }
        }
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

    public addLateInsert(id: string, views: string[]) {
        if (this.lateInsert[id] == null) {
            this.lateInsert[id] = [];
        }
        this.lateInsert[id].push(...views);
    }

    public sortByAlignment<T extends Node>(children: T[], parent?: T, alignmentType = NODE_ALIGNMENT.NONE, preserve = false) {
        let sorted = false;
        if (parent) {
            if (alignmentType === NODE_ALIGNMENT.NONE) {
                if (parent.linearHorizontal) {
                    alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                }
                else if (parent.is(NODE_STANDARD.CONSTRAINT)) {
                    alignmentType |= NODE_ALIGNMENT.ABSOLUTE;
                }
            }
        }
        if (!sorted) {
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
        }
        if (parent && preserve && sorted) {
            this.preserveSortOrder(parent.id, children);
        }
        return children;
    }

    public preserveSortOrder<T extends Node>(id: string | number, nodes: T[]) {
        this._sorted[id.toString()] = nodes.map(node => node.id);
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

    private insertNode(element: Element, parent?: T) {
        let node: Null<T> = null;
        if (element.nodeName === '#text') {
            if (isPlainText(element) || cssParent(element, 'whiteSpace', 'pre', 'pre-wrap')) {
                node = new this._Node(this.cache.nextId, SETTINGS.targetAPI, element);
                node.tagName = 'PLAINTEXT';
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
        else if (isElementVisible(element)) {
            node = new this._Node(this.cache.nextId, SETTINGS.targetAPI, element);
            if (getElementCache(element, 'nodeIsolated')) {
                node.isolated = true;
            }
            node.setExclusions();
        }
        if (node != null) {
            node.setMultiLine();
            this.cache.append(node);
        }
        return node;
    }

    private prioritizeExt(available: IExtension[], element: Element) {
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
        return { cache: this.cacheInternal, views: this._views, includes: this._includes };
    }

    get size() {
        return this._views.length + this._includes.length;
    }
}