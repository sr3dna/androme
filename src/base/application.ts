import { APP_SECTION, BOX_STANDARD, CSS_STANDARD, NODE_ALIGNMENT, NODE_PROCEDURE, NODE_RESOURCE, NODE_STANDARD, USER_AGENT } from '../lib/enumeration';

import { DOM_REGEX } from '../lib/constant';

import Node from './node';
import NodeList from './nodelist';
import Controller from './controller';
import Resource from './resource';
import Extension from './extension';

import { convertCamelCase, convertInt, convertPX, convertWord, hasBit, hasValue, isNumber, isPercent, isUnit, sortAsc, trimNull, trimString } from '../lib/util';
import { cssParent, cssResolveUrl, deleteElementCache, getElementCache, getElementsBetweenSiblings, getNodeFromElement, getStyle, hasFreeFormText, isElementVisible, isLineBreak, isPlainText, isStyleElement, isUserAgent, setElementCache } from '../lib/dom';
import { formatPlaceholder, replaceIndent, replacePlaceholder } from '../lib/xml';

function prioritizeExtensions<T extends Node>(extensions: Extension<T>[], element: Element) {
    let result: string[] = [];
    let current: Null<HTMLElement> = <HTMLElement> element;
    while (current) {
        result = [
            ...result,
            ...trimNull(current.dataset.ext)
                .split(',')
                .map(value => value.trim())
        ];
        current = current.parentElement;
    }
    result = result.filter(value => value);
    if (result.length > 0) {
        const tagged: Extension<T>[] = [];
        const untagged: Extension<T>[] = [];
        for (const item of extensions) {
            const index = result.indexOf(item.name);
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
        return extensions;
    }
}

export default class Application<T extends Node> implements androme.lib.base.Application<T> {
    public static isFrameHorizontal<T extends Node>(nodes: T[], cleared: Map<T, string>, lineBreak = false) {
        const floated = NodeList.floated(nodes);
        const margin = nodes.filter(node => node.autoMargin);
        const br = lineBreak ? getElementsBetweenSiblings(nodes[0].baseElement, nodes[nodes.length - 1].baseElement).filter(element => element.tagName === 'BR').length : 0;
        return (
            br === 0 && (
                floated.has('right') ||
                cleared.size > 0 ||
                margin.length > 0 ||
                !NodeList.linearX(nodes)
            )
        );
    }

    public static isRelativeHorizontal<T extends Node>(nodes: T[], cleared = new Map<T, string>()) {
        const visible = nodes.filter(node => node.visible);
        const floated = NodeList.floated(nodes);
        const [floating, pageflow] = new NodeList(nodes).partition(node => node.floating);
        const flowIndex = pageflow.length > 0 ? Math.min.apply(null, pageflow.list.map(node => node.siblingIndex)) : Number.MAX_VALUE;
        const floatIndex = floating.length > 0 ? Math.max.apply(null, floating.list.map(node => node.siblingIndex)) : -1;
        const linearX = NodeList.linearX(nodes);
        if (visible.some(node => node.autoMarginHorizontal)) {
            return false;
        }
        if (floated.size === 1 && floating.length === nodes.length) {
            return !(linearX && cleared.size === 0);
        }
        return (
            cleared.size === 0 &&
            !floated.has('right') &&
            (pageflow.length === 0 || floating.length === 0 || floatIndex < flowIndex) &&
            visible.every(node => {
                const verticalAlign = node.css('verticalAlign');
                return (
                    node.toInt('top') >= 0 && (
                        ['baseline', 'initial', 'unset', 'top', 'middle', 'sub', 'super'].includes(verticalAlign) ||
                        (isUnit(verticalAlign) && parseInt(verticalAlign) >= 0)
                    )
                );
            }) && (
                visible.some(node => ((node.textElement || node.imageElement || node.svgElement) && node.baseline) || (node.plainText && node.multiLine)) ||
                (!linearX && nodes.every(node => node.pageflow && node.inlineElement))
            )
        );
    }

    public viewController: Controller<T>;
    public resourceHandler: Resource<T>;
    public nodeObject: NodeConstructor<T>;
    public builtInExtensions: ObjectMap<Extension<T>>;
    public renderQueue: ObjectMap<string[]> = {};
    public loading = false;
    public closed = false;
    public readonly cacheImage = new Map<string, Image>();
    public readonly cacheSession = new NodeList<T>();
    public readonly cacheProcessing = new NodeList<T>();
    public readonly elements = new Set<Element>();
    public readonly extensions: Extension<T>[] = [];

    private _cacheRoot = new Set<Element>();
    private _settings: Settings;
    private _sorted: ObjectMap<number[]> = {};
    private _currentIndex = -1;
    private readonly _views: PlainFile[] = [];
    private readonly _includes: PlainFile[] = [];

    constructor(public readonly framework: number) {
    }

    public registerController(controller: Controller<T>) {
        controller.application = this;
        controller.cache = this.cacheProcessing;
        this.viewController = controller;
    }

    public registerResource(resource: Resource<T>) {
        resource.application = this;
        resource.cache = this.cacheProcessing;
        this.resourceHandler = resource;
    }

    public registerExtension(ext: Extension<T>) {
        const found = this.getExtension(ext.name);
        if (found) {
            if (Array.isArray(ext.tagNames)) {
                found.tagNames = ext.tagNames;
            }
            Object.assign(found.options, ext.options);
            return true;
        }
        else {
            if ((ext.framework === 0 || hasBit(ext.framework, this.framework)) && ext.dependencies.every(item => !!this.getExtension(item.name))) {
                ext.application = this;
                this.extensions.push(ext);
                return true;
            }
        }
        return false;
    }

    public finalize() {
        const visible = this.cacheSession.visible.filter(node => !node.hasAlign(NODE_ALIGNMENT.SPACE));
        for (const node of visible) {
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.LAYOUT)) {
                node.setLayout();
            }
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.ALIGNMENT)) {
                node.setAlignment(this.settings);
            }
        }
        for (const node of visible) {
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.OPTIMIZATION)) {
                node.applyOptimizations(this.settings);
            }
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.CUSTOMIZATION)) {
                node.applyCustomizations(this.settings);
            }
        }
        this.viewController.setBoxSpacing(this.viewData);
        this.appendRenderQueue();
        this.viewController.setDimensions(this.viewData);
        this.resourceHandler.finalize(this.viewData);
        this.viewController.finalize(this.viewData);
        for (const ext of this.extensions) {
            for (const node of ext.subscribers) {
                ext.setTarget(node);
                ext.finalize();
            }
        }
        this.closed = true;
    }

    public saveAllToDisk() {
        this.resourceHandler.file.saveAllToDisk(this.viewData);
    }

    public reset() {
        for (const node of this.cacheSession) {
            deleteElementCache(node.element, 'node', 'style', 'styleMap', 'inlineSupport', 'boxSpacing', 'boxStyle', 'fontStyle', 'imageSource', 'optionArray', 'valueString');
        }
        for (const element of this._cacheRoot as Set<HTMLElement>) {
            delete element.dataset.iteration;
            delete element.dataset.layoutName;
        }
        this.appName = '';
        this.renderQueue = {};
        this.cacheImage.clear();
        this.cacheSession.reset();
        this.cacheProcessing.reset();
        this.viewController.reset();
        this.resourceHandler.reset();
        this._cacheRoot.clear();
        this._views.length = 0;
        this._includes.length = 0;
        this._sorted = {};
        this._currentIndex = -1;
        for (const ext of this.extensions) {
            ext.subscribers.clear();
            ext.subscribersChild.clear();
        }
        this.closed = false;
    }

    public setConstraints() {
        this.viewController.setConstraints();
    }

    public setResources() {
        this.resourceHandler.setBoxStyle();
        this.resourceHandler.setFontStyle();
        this.resourceHandler.setBoxSpacing();
        this.resourceHandler.setValueString();
        this.resourceHandler.setOptionArray();
        this.resourceHandler.setImageSource();
    }

    public setImageCache(element: HTMLImageElement) {
        if (element && hasValue(element.src)) {
            this.cacheImage.set(element.src, {
                width: element.naturalWidth,
                height: element.naturalHeight,
                uri: element.src
            });
        }
    }

    public parseDocument(...elements: any[]): FunctionMap<void> {
        let __THEN: () => void;
        this.elements.clear();
        this.loading = false;
        this.setStyleMap();
        if (this.appName === '' && elements.length === 0) {
            elements.push(document.body);
        }
        for (const item of elements) {
            const element = typeof item === 'string' ? document.getElementById(item) : item;
            if (element && isStyleElement(element)) {
                this.elements.add(element);
            }
        }
        const rootElement = this.elements.values().next().value;
        const parseResume = () => {
            this.loading = false;
            if (this.settings.preloadImages && rootElement) {
                Array.from(rootElement.getElementsByClassName('androme.preload')).forEach(element => rootElement.removeChild(element));
            }
            this.resourceHandler.imageDimensions = this.cacheImage;
            for (const element of this.elements as Set<HTMLElement>) {
                if (this.appName === '') {
                    if (element.id === '') {
                        element.id = 'untitled';
                    }
                    this.appName = element.id;
                }
                let filename = trimNull(element.dataset.filename).replace(new RegExp(`\.${this.viewController.settingsInternal.layout.fileExtension}$`), '');
                if (filename === '') {
                    if (element.id === '') {
                        element.id = `document_${this.size}`;
                    }
                    filename = element.id;
                }
                const iteration = convertInt(element.dataset.iteration) + 1;
                element.dataset.iteration = iteration.toString();
                element.dataset.layoutName = convertWord(iteration > 1 ? `${filename}_${iteration}` : filename);
                if (this.initCache(element)) {
                    this.createDocument();
                    this.setConstraints();
                    this.setResources();
                    this._cacheRoot.add(element);
                }
            }
            if (typeof __THEN === 'function') {
                __THEN.call(this);
            }
        };
        if (this.settings.preloadImages && rootElement) {
            for (const image of this.cacheImage.values()) {
                if (image.width === 0 && image.height === 0 && image.uri) {
                    const imageElement = <HTMLImageElement> document.createElement('IMG');
                    imageElement.src = image.uri;
                    if (imageElement.complete && imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
                        image.width = imageElement.naturalWidth;
                        image.height = imageElement.naturalHeight;
                    }
                    else {
                        imageElement.className = 'androme.preload';
                        imageElement.style.display = 'none';
                        rootElement.appendChild(imageElement);
                    }
                }
            }
        }
        const images: HTMLImageElement[] = Array.from(this.elements).map(element => {
            const queue: HTMLImageElement[] = [];
            Array.from(element.querySelectorAll('IMG')).forEach((image: HTMLImageElement) => {
                if (image.complete) {
                    this.setImageCache(image);
                }
                else {
                    queue.push(image);
                }
            });
            return queue;
        })
        .reduce((a, b) => a.concat(b), []);
        if (images.length === 0) {
            parseResume();
        }
        else {
            this.loading = true;
            const queue = images.map(image => {
                return new Promise((resolve, reject) => {
                    image.onload = resolve;
                    image.onerror = reject;
                });
            });
            Promise.all(queue).then((result: Event[]) => {
                if (Array.isArray(result)) {
                    result.forEach(item => {
                        try {
                            this.setImageCache(<HTMLImageElement> item.srcElement);
                        }
                        catch {
                        }
                    });
                }
                parseResume();
            })
            .catch((error: Event) => {
                const message = error.srcElement ? (<HTMLImageElement> error.srcElement).src : '';
                if (!hasValue(message) || confirm(`FAIL: ${message}`)) {
                    parseResume();
                }
            });
        }
        return {
            then: (resolve: () => void) => {
                if (this.loading) {
                    __THEN = resolve;
                }
                else {
                    resolve();
                }
            }
        };
    }

    public initCache(rootElement: HTMLElement) {
        let nodeTotal = 0;
        if (rootElement === document.body) {
            Array.from(document.body.childNodes).some((item: Element) => isElementVisible(item, this.settings.hideOffScreenElements) && ++nodeTotal > 1);
        }
        const elements = rootElement !== document.body ? rootElement.querySelectorAll('*') : document.querySelectorAll(nodeTotal > 1 ? 'body, body *' : 'body *');
        this.cacheProcessing.parent = undefined;
        this.cacheProcessing.delegateAppend = undefined;
        this.cacheProcessing.clear();
        for (const ext of this.extensions) {
            ext.setTarget(undefined, undefined, rootElement);
            ext.beforeInit();
        }
        const rootNode = this.insertNode(rootElement);
        if (rootNode) {
            rootNode.parent = new this.nodeObject(0, (rootElement === document.body ? rootElement : rootElement.parentElement) || document.body);
            rootNode.documentRoot = true;
            this.viewController.initNode(rootNode);
            this.cacheProcessing.parent = rootNode;
        }
        else {
            return false;
        }
        const inlineAlways = this.viewController.settingsInternal.inline.always;
        const inlineSupport = this.settings.renderInlineText ? [] : this.viewController.settingsInternal.inline.tagName;
        function inlineElement(element: Element) {
            const styleMap = getElementCache(element, 'styleMap');
            return (
                (!styleMap || Object.keys(styleMap).length === 0) &&
                element.children.length === 0 &&
                inlineSupport.includes(element.tagName)
            );
        }
        for (const element of Array.from(elements) as HTMLElement[]) {
            if (!this.elements.has(element)) {
                prioritizeExtensions(this.extensions, element).some(item => item.init(element));
                if (!this.elements.has(element)) {
                    if (inlineAlways.includes(element.tagName) || (
                            inlineElement(element) &&
                            element.parentElement &&
                            Array.from(element.parentElement.children).every(item => inlineElement(item))
                       ))
                    {
                        setElementCache(element, 'inlineSupport', true);
                    }
                    let valid = true;
                    let current = element.parentElement;
                    while (current) {
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
                        let styleMap = getElementCache(element, 'styleMap');
                        if (!styleMap) {
                            styleMap = {};
                            setElementCache(element, 'styleMap', styleMap);
                        }
                        switch (element.tagName) {
                            case 'SELECT':
                                if (styleMap.verticalAlign == null && (<HTMLSelectElement> element).size > 1) {
                                    styleMap.verticalAlign = 'text-bottom';
                                }
                                break;
                        }
                        this.insertNode(element);
                    }
                }
            }
        }
        if (this.cacheProcessing.length > 0) {
            for (const node of this.cacheProcessing) {
                const nodes: Element[] = [];
                let valid = false;
                Array.from(node.element.childNodes).forEach((element: Element) => {
                    if (element.nodeName === '#text') {
                        if (node.tagName !== 'SELECT') {
                            nodes.push(element);
                        }
                    }
                    else if (element.tagName !== 'BR') {
                        const elementNode = getNodeFromElement(element);
                        if (!inlineSupport.includes(element.tagName) || (elementNode && !elementNode.excluded)) {
                            valid = true;
                        }
                    }
                });
                if (valid) {
                    nodes.forEach(element => this.insertNode(element, node));
                }
            }
            const preAlignment: ObjectIndex<StringMap> = {};
            const direction: HTMLElement[] = [];
            for (const node of this.cacheProcessing) {
                if (node.styleElement) {
                    const element = <HTMLElement> node.element;
                    const textAlign = node.css('textAlign');
                    preAlignment[node.id] = {};
                    const attrs = preAlignment[node.id];
                    ['right', 'end', element.tagName !== 'BUTTON' && (<HTMLInputElement> element).type !== 'button' ? 'center' : ''].some(value => {
                        if (value === textAlign) {
                            attrs.textAlign = value;
                            element.style.textAlign = 'left';
                            return true;
                        }
                        return false;
                    });
                    if (node.marginLeft < 0) {
                        attrs.marginLeft = node.css('marginLeft');
                        element.style.marginLeft = '0px';
                    }
                    if (node.marginTop < 0) {
                        attrs.marginTop = node.css('marginTop');
                        element.style.marginTop = '0px';
                    }
                    if (node.position === 'relative') {
                        ['top', 'right', 'bottom', 'left'].forEach(value => {
                            if (node.has(value)) {
                                attrs[value] = node.styleMap[value];
                                element.style[value] = 'auto';
                            }
                        });
                    }
                    if (node.overflowX || node.overflowY) {
                        if (node.has('width')) {
                            attrs.width = node.styleMap.width;
                            element.style.width = 'auto';
                        }
                        if (node.has('height')) {
                            attrs.height = node.styleMap.height;
                            element.style.height = 'auto';
                        }
                        attrs.overflow = node.style.overflow || '';
                        element.style.overflow = 'visible';
                    }
                    if (element.dir === 'rtl') {
                        element.dir = 'ltr';
                        direction.push(element);
                    }
                    node.setBounds();
                }
                node.setMultiLine();
            }
            for (const node of this.cacheProcessing) {
                if (node.styleElement) {
                    const element = <HTMLElement> node.element;
                    const attrs = preAlignment[node.id];
                    if (attrs) {
                        for (const attr in attrs) {
                            element.style[attr] = attrs[attr];
                        }
                        if (direction.includes(element)) {
                            element.dir = 'rtl';
                        }
                    }
                }
                if (node.children.length === 1) {
                    const firstNode = node.children[0];
                    if (!firstNode.pageflow &&
                        firstNode.toInt('top') === 0 &&
                        firstNode.toInt('right') === 0 &&
                        firstNode.toInt('bottom') === 0 &&
                        firstNode.toInt('left') === 0)
                    {
                        firstNode.pageflow = true;
                    }
                }
            }
            for (const node of this.cacheProcessing) {
                if (!node.documentRoot) {
                    let parent: Null<T> = node.getParentElementAsNode(this.settings.supportNegativeLeftTop, this.cacheProcessing.parent) as T;
                    if (!parent && !node.pageflow) {
                        parent = this.cacheProcessing.parent;
                    }
                    if (parent) {
                        node.parent = parent;
                        node.documentParent = parent;
                    }
                    else {
                        node.hide();
                    }
                }
            }
            for (const node of this.cacheProcessing.elements) {
                if (node.htmlElement) {
                    let i = 0;
                    Array.from(node.element.childNodes).forEach((element: Element) => {
                        const item = getNodeFromElement(element);
                        if (item && !item.excluded && item.pageflow) {
                            item.siblingIndex = i++;
                        }
                    });
                    node.children.sort(NodeList.siblingIndex);
                    node.initial.children.push(...node.children.slice());
                }
            }
            this.cacheProcessing.sortAsc('depth', 'id');
            for (const ext of this.extensions) {
                ext.setTarget(rootNode);
                ext.afterInit();
            }
            return true;
        }
        return false;
    }

    public createDocument() {
        const mapX: LayoutMapX<T> = [];
        const mapY: LayoutMapY<T> = new Map<number, Map<number, T>>();
        let baseTemplate = this.viewController.baseTemplate;
        let empty = true;
        function setMapY(depth: number, id: number, node: T) {
            if (!mapY.has(depth)) {
                mapY.set(depth, new Map<number, T>());
            }
            const mapIndex = mapY.get(depth);
            if (mapIndex) {
                mapIndex.set(id, node);
            }
        }
        function deleteMapY(id: number) {
            for (const mapNode of mapY.values()) {
                for (const node of mapNode.values()) {
                    if (node.id === id) {
                        mapNode.delete(node.id);
                        return;
                    }
                }
            }
        }
        setMapY(-1, 0, (this.cacheProcessing.parent as T).parent as T);
        let maxDepth = 0;
        for (const node of this.cacheProcessing.visible) {
            const x = Math.floor(node.linear.left);
            if (mapX[node.depth] == null) {
                mapX[node.depth] = {};
            }
            if (mapX[node.depth][x] == null) {
                mapX[node.depth][x] = [];
            }
            mapX[node.depth][x].push(node);
            setMapY(node.depth, node.id, node);
            maxDepth = Math.max(node.depth, maxDepth);
        }
        for (let i = 0; i < maxDepth; i++) {
            mapY.set((i * -1) - 2, new Map<number, T>());
        }
        this.cacheProcessing.delegateAppend = (nodes: T[]) => {
            nodes.forEach(node => {
                deleteMapY(node.id);
                setMapY((node.initial.depth * -1) - 2, node.id, node);
                node.cascade().forEach((item: T) => {
                    deleteMapY(item.id);
                    setMapY((item.initial.depth * -1) - 2, item.id, item);
                });
            });
        };
        for (const depth of mapY.values()) {
            function insertNodeTemplate(data: Map<string, Map<number, string>>, node: T, parentId: string, value: string, current: string) {
                const key = parentId + (current === '' && node.renderPosition !== -1 ? `:${node.renderPosition}` : '');
                if (!data.has(key)) {
                    data.set(key, new Map<number, string>());
                }
                const template = data.get(key);
                if (template) {
                    template.set(node.id, value);
                }
            }
            const partial = new Map<string, Map<number, string>>();
            const external = new Map<string, Map<number, string>>();
            const renderNode = (node: T, parent: T, output: string, current = '', group = false) => {
                if (output !== '') {
                    if (group) {
                        node.each((item: T) => {
                            [partial, external].some(data => {
                                for (const views of partial.values()) {
                                    let template = views.get(item.id);
                                    if (template) {
                                        const indent = node.renderDepth + 1;
                                        if (item.renderDepth !== indent) {
                                            template = replaceIndent(template, indent);
                                            item.renderDepth = indent;
                                        }
                                        insertNodeTemplate(data, item, node.id.toString(), template, current);
                                        views.delete(item.id);
                                        return true;
                                    }
                                }
                                return false;
                            });
                        });
                    }
                    if (current !== '') {
                        insertNodeTemplate(external, node, current, output, current);
                    }
                    else {
                        if (!this.elements.has(node.element)) {
                            if (node.dataset.target) {
                                const target = document.getElementById(node.dataset.target);
                                if (target && target !== parent.element) {
                                    this.addRenderQueue(node.dataset.target, [output]);
                                    node.auto = false;
                                    return;
                                }
                            }
                            else if (parent.dataset.target) {
                                const target = document.getElementById(parent.dataset.target);
                                if (target) {
                                    this.addRenderQueue(parent.nodeId, [output]);
                                    node.dataset.target = parent.nodeId;
                                    return;
                                }
                            }
                        }
                        insertNodeTemplate(partial, node, parent.id.toString(), output, current);
                    }
                }
            };
            for (const parent of depth.values()) {
                if (parent.children.length === 0 || parent.renderAs) {
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
                NodeList.sortByAlignment(middle, NODE_ALIGNMENT.NONE, parent);
                axisY.push(...sortAsc(below, 'style.zIndex', 'id'));
                axisY.push(...middle);
                axisY.push(...sortAsc(above, 'style.zIndex', 'id'));
                const cleared = NodeList.cleared(axisY);
                const includes: string[] = [];
                let current = '';
                let k = -1;
                function getCurrent() {
                    return includes.length > 0 ? includes[includes.length - 1] : '';
                }
                while (++k < axisY.length) {
                    let nodeY = axisY[k];
                    if (!nodeY.visible || (!nodeY.documentRoot && this.elements.has(nodeY.element))) {
                        continue;
                    }
                    let parentY = nodeY.parent as T;
                    let currentY = '';
                    const includeSupport = this.viewController.settingsInternal.includes;
                    if (includeSupport) {
                        if (!nodeY.hasBit('excludeSection', APP_SECTION.INCLUDE)) {
                            const filename = trimNull(nodeY.dataset.include);
                            if (filename !== '' && includes.indexOf(filename) === -1) {
                                renderNode(nodeY, parentY, this.viewController.renderInclude(nodeY, parentY, filename), getCurrent());
                                includes.push(filename);
                            }
                            current = getCurrent();
                            if (current !== '') {
                                const cloneParent = parentY.clone() as T;
                                cloneParent.renderDepth = this.viewController.baseRenderDepth(current);
                                nodeY.parent = cloneParent;
                                parentY = cloneParent;
                            }
                            currentY = current;
                        }
                        else {
                            currentY = '';
                        }
                    }
                    if (nodeY.renderAs) {
                        parentY.removeChild(nodeY);
                        nodeY.hide();
                        nodeY = nodeY.renderAs as T;
                    }
                    if (!nodeY.hasBit('excludeSection', APP_SECTION.DOM_TRAVERSE) && axisY.length > 1 && k < axisY.length - 1) {
                        const linearVertical = parentY.linearVertical;
                        if (nodeY.pageflow &&
                            current === '' &&
                            !parentY.flex.enabled &&
                            !parentY.has('columnCount') &&
                            !parentY.is(NODE_STANDARD.GRID) && (
                                nodeY.hasAlign(NODE_ALIGNMENT.EXTENDABLE) ||
                                (nodeY.alignmentType === NODE_ALIGNMENT.NONE && parentY.alignmentType === NODE_ALIGNMENT.NONE)
                           ))
                        {
                            const horizontal: T[] = [];
                            const vertical: T[] = [];
                            const floatedOpen = new Set(['left', 'right']);
                            let verticalExtended = false;
                            let l = k;
                            let m = 0;
                            if (nodeY.hasAlign(NODE_ALIGNMENT.EXTENDABLE)) {
                                horizontal.push(nodeY);
                                l++;
                                m++;
                            }
                            mainloop: {
                                for ( ; l < axisY.length; l++, m++) {
                                    const adjacent = axisY[l];
                                    if (adjacent.pageflow) {
                                        const float = cleared.get(adjacent);
                                        if (float) {
                                            if (float === 'both') {
                                                floatedOpen.clear();
                                            }
                                            else {
                                                floatedOpen.delete(float);
                                            }
                                        }
                                        if (adjacent.floating) {
                                            floatedOpen.add(adjacent.float);
                                        }
                                        const previousSibling = adjacent.previousSibling() as T;
                                        const nextSibling = adjacent.nextSibling(true);
                                        if (m === 0 && nextSibling) {
                                            if (adjacent.blockStatic || nextSibling.alignedVertically(adjacent, cleared, true)) {
                                                vertical.push(adjacent);
                                            }
                                            else {
                                                horizontal.push(adjacent);
                                            }
                                        }
                                        else if (previousSibling) {
                                            const floated = NodeList.floated([...horizontal, ...vertical]);
                                            const pending = [...horizontal, ...vertical, adjacent];
                                            const clearedPartial = NodeList.cleared(pending);
                                            const clearedPrevious = new Map<T, string>();
                                            if (clearedPartial.has(previousSibling)) {
                                                clearedPrevious.set(previousSibling, previousSibling.css('clear'));
                                            }
                                            const verticalAlign = adjacent.alignedVertically(previousSibling, clearedPrevious);
                                            if (verticalAlign || clearedPartial.has(adjacent) || (this.settings.floatOverlapDisabled && previousSibling.floating && adjacent.blockStatic && floatedOpen.size === 2)) {
                                                if (horizontal.length > 0) {
                                                    if (!this.settings.floatOverlapDisabled && !previousSibling.lineBreak) {
                                                        const clearedDirection = new Set(pending.map(node => clearedPartial.get(node) || '').filter(value => value !== ''));
                                                        let maxBottom: Null<number> = null;
                                                        if (floated.size > 0) {
                                                            maxBottom = Math.max.apply(null, horizontal.filter(node => node.floating).map(node => node.bounds.bottom));
                                                        }
                                                        if (floatedOpen.size > 0 && !clearedDirection.has('both') && (maxBottom == null || adjacent.bounds.top < maxBottom)) {
                                                            if (clearedPartial.has(adjacent)) {
                                                                const clear = clearedPartial.has(adjacent) ? clearedPartial.get(adjacent) : 'none';
                                                                if (clear !== 'none') {
                                                                    if (floatedOpen.size < 2 && floated.size === 2 && !adjacent.floating) {
                                                                        adjacent.alignmentType |= NODE_ALIGNMENT.EXTENDABLE;
                                                                        verticalExtended = true;
                                                                        horizontal.push(adjacent);
                                                                        continue;
                                                                    }
                                                                }
                                                                else if (
                                                                    floated.size < 2 && (
                                                                        !adjacent.floating ||
                                                                        !floated.has(adjacent.float) ||
                                                                        adjacent.float === horizontal[horizontal.length - 1].float
                                                                   ))
                                                                {
                                                                    horizontal.push(adjacent);
                                                                    continue;
                                                                }
                                                                break mainloop;
                                                            }
                                                            else if (!verticalAlign) {
                                                                horizontal.push(adjacent);
                                                                continue;
                                                            }
                                                            if (floated.size === 1 && (!adjacent.floating || floatedOpen.has(adjacent.float))) {
                                                                horizontal.push(adjacent);
                                                                continue;
                                                            }
                                                        }
                                                    }
                                                    break mainloop;
                                                }
                                                if (linearVertical && vertical.length > 0) {
                                                    const previousAbove = vertical[vertical.length - 1];
                                                    if (previousAbove.linearVertical) {
                                                        adjacent.parent = previousAbove;
                                                        continue;
                                                    }
                                                }
                                                vertical.push(adjacent);
                                            }
                                            else {
                                                if (vertical.length > 0 || verticalExtended) {
                                                    break mainloop;
                                                }
                                                horizontal.push(adjacent);
                                            }
                                        }
                                        else {
                                            break mainloop;
                                        }
                                    }
                                }
                            }
                            let group: Null<T> = null;
                            let groupOutput = '';
                            if (horizontal.length > 1) {
                                const clearedPartial = NodeList.cleared(horizontal);
                                if (Application.isFrameHorizontal(horizontal, clearedPartial)) {
                                    group = this.viewController.createGroup(parentY, nodeY, horizontal);
                                    groupOutput = this.writeFrameLayoutHorizontal(group, parentY, horizontal, clearedPartial);
                                }
                                else {
                                    if (horizontal.length === axisY.length) {
                                        parentY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                    }
                                    else {
                                        const floated = NodeList.floated(horizontal);
                                        if (floated.size === 1 &&
                                            horizontal.some(node => node.has('width', CSS_STANDARD.PERCENT)) &&
                                            horizontal.every(node => node.has('width', CSS_STANDARD.UNIT | CSS_STANDARD.PERCENT)))
                                        {
                                            group = this.viewController.createGroup(parentY, nodeY, horizontal);
                                            groupOutput = this.writeConstraintLayout(group, parentY);
                                            group.alignmentType |= NODE_ALIGNMENT.PERCENT;
                                        }
                                        else if (Application.isRelativeHorizontal(horizontal, clearedPartial)) {
                                            group = this.viewController.createGroup(parentY, nodeY, horizontal);
                                            groupOutput = this.writeRelativeLayout(group, parentY);
                                            group.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                        }
                                        else {
                                            group = this.viewController.createGroup(parentY, nodeY, horizontal);
                                            groupOutput = this.writeLinearLayout(group, parentY, true);
                                            if (floated.size > 0) {
                                                group.alignmentType |= NODE_ALIGNMENT.FLOAT;
                                                group.alignmentType |= horizontal.every(node => node.float === 'right' || node.autoMarginLeft) ? NODE_ALIGNMENT.RIGHT : NODE_ALIGNMENT.LEFT;
                                            }
                                            else {
                                                group.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                            }
                                        }
                                    }
                                }
                            }
                            else if (vertical.length > 1) {
                                const floated = NodeList.floated(vertical);
                                const clearedPartial = NodeList.cleared(vertical);
                                if (floated.size > 0 &&
                                    clearedPartial.size > 0 &&
                                    !(floated.size === 1 && vertical.slice(1, vertical.length - 1).every(node => clearedPartial.has(node))))
                                {
                                    if (parentY.linearVertical) {
                                        group = nodeY;
                                        groupOutput = this.writeFrameLayoutVertical(null, parentY, vertical, clearedPartial);
                                    }
                                    else {
                                        group = this.viewController.createGroup(parentY, nodeY, vertical);
                                        groupOutput = this.writeFrameLayoutVertical(group, parentY, vertical, clearedPartial);
                                    }
                                }
                                else {
                                    if (vertical.length === axisY.length) {
                                        parentY.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                    }
                                    else if (!linearVertical) {
                                        group = this.viewController.createGroup(parentY, nodeY, vertical);
                                        groupOutput = this.writeLinearLayout(group, parentY, false);
                                        group.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                    }
                                }
                                if (vertical.length !== axisY.length) {
                                    const lastNode = vertical[vertical.length - 1];
                                    if (!lastNode.blockStatic && lastNode !== axisY[axisY.length - 1]) {
                                        lastNode.alignmentType |= NODE_ALIGNMENT.EXTENDABLE;
                                    }
                                }
                            }
                            if (group) {
                                renderNode(group, parentY, groupOutput, '', true);
                                parentY = nodeY.parent as T;
                            }
                            if (nodeY.hasAlign(NODE_ALIGNMENT.EXTENDABLE)) {
                                nodeY.alignmentType ^= NODE_ALIGNMENT.EXTENDABLE;
                            }
                        }
                    }
                    if (!nodeY.hasBit('excludeSection', APP_SECTION.EXTENSION) && !nodeY.rendered) {
                        let next = false;
                        for (const ext of [...parentY.renderExtension, ...this.extensions.filter(item => item.subscribersChild.has(nodeY))]) {
                            ext.setTarget(nodeY, parentY);
                            const result = ext.processChild();
                            if (result.output !== '') {
                                renderNode(nodeY, parentY, result.output, currentY);
                            }
                            if (result.parent) {
                                parentY = result.parent as T;
                            }
                            next = !!result.next;
                            if (result.complete || result.next) {
                                break;
                            }
                        }
                        if (next) {
                            continue;
                        }
                        if (nodeY.styleElement) {
                            const processed: Extension<T>[] = [];
                            prioritizeExtensions(this.extensions, nodeY.element).some(item => {
                                if (item.is(nodeY)) {
                                    item.setTarget(nodeY, parentY);
                                    if (item.condition()) {
                                        const result =  item.processNode(mapX, mapY);
                                        if (result.output !== '') {
                                            renderNode(nodeY, parentY, result.output, currentY);
                                        }
                                        if (result.parent) {
                                            parentY = result.parent as T;
                                        }
                                        if (result.output !== '' || result.include) {
                                            processed.push(item);
                                        }
                                        next = !!result.next;
                                        if (result.complete || result.next) {
                                            return true;
                                        }
                                    }
                                }
                                return false;
                            });
                            if (processed.length > 0) {
                                for (const ext of processed) {
                                    ext.subscribers.add(nodeY);
                                    nodeY.renderExtension.add(ext);
                                }
                            }
                            if (next) {
                                continue;
                            }
                        }
                    }
                    if (!nodeY.hasBit('excludeSection', APP_SECTION.RENDER) && !nodeY.rendered) {
                        let output = '';
                        if (nodeY.alignmentType === NODE_ALIGNMENT.NONE &&
                            !nodeY.imageElement &&
                            nodeY.has('width', CSS_STANDARD.PERCENT, { not: '100%' }) &&
                            (parentY.linearVertical || (parentY.is(NODE_STANDARD.FRAME) && nodeY.singleChild)))
                        {
                            const group = this.viewController.createGroup(parentY, nodeY, [nodeY]);
                            const groupOutput = this.writeGridLayout(group, parentY, 2, 1);
                            group.alignmentType |= NODE_ALIGNMENT.PERCENT;
                            renderNode(group, parentY, groupOutput, currentY);
                            this.viewController[nodeY.float === 'right' || nodeY.autoMarginLeft ? 'prependBefore' : 'appendAfter'](nodeY.id, this.viewController.renderColumnSpace(group.renderDepth + 1, `${100 - nodeY.toInt('width')}%`));
                            parentY = group;
                        }
                        if (nodeY.controlName === '') {
                            const borderVisible = nodeY.borderTopWidth > 0 || nodeY.borderBottomWidth > 0 || nodeY.borderRightWidth > 0 || nodeY.borderLeftWidth > 0;
                            const backgroundImage = DOM_REGEX.URL.test(nodeY.css('backgroundImage')) || DOM_REGEX.URL.test(nodeY.css('background'));
                            const backgroundColor = nodeY.has('backgroundColor');
                            const backgroundVisible = borderVisible || backgroundImage || backgroundColor;
                            if (nodeY.children.length === 0) {
                                const freeFormText = hasFreeFormText(nodeY.element, this.settings.renderInlineText ? 0 : 1);
                                if (freeFormText || (borderVisible && nodeY.textContent.length > 0)) {
                                    output = this.writeNode(nodeY, parentY, NODE_STANDARD.TEXT);
                                }
                                else if (
                                    backgroundImage &&
                                    nodeY.css('backgroundRepeat') === 'no-repeat' &&
                                    (!nodeY.inlineText || nodeY.toInt('textIndent') + nodeY.bounds.width < 0))
                                {
                                    nodeY.alignmentType |= NODE_ALIGNMENT.SINGLE;
                                    nodeY.excludeResource |= NODE_RESOURCE.FONT_STYLE | NODE_RESOURCE.VALUE_STRING;
                                    output = this.writeNode(nodeY, parentY, NODE_STANDARD.IMAGE);
                                }
                                else if (
                                    nodeY.block &&
                                    (backgroundColor || backgroundImage) &&
                                    (borderVisible || nodeY.paddingTop + nodeY.paddingRight + nodeY.paddingRight + nodeY.paddingLeft > 0))
                                {
                                    output = this.writeNode(nodeY, parentY, NODE_STANDARD.LINE);
                                }
                                else if (!nodeY.documentRoot) {
                                    if (this.settings.collapseUnattributedElements &&
                                        nodeY.bounds.height === 0 &&
                                        !hasValue(nodeY.element.id) &&
                                        !hasValue(nodeY.dataset.ext) &&
                                        !backgroundVisible)
                                    {
                                        parentY.removeChild(nodeY);
                                        nodeY.hide();
                                    }
                                    else if (backgroundVisible) {
                                        output = this.writeNode(nodeY, parentY, NODE_STANDARD.TEXT);
                                    }
                                    else {
                                        output = this.writeFrameLayout(nodeY, parentY);
                                    }
                                }
                            }
                            else {
                                if (nodeY.flex.enabled || nodeY.children.some(node => !node.pageflow) || nodeY.has('columnCount')) {
                                    output = this.writeConstraintLayout(nodeY, parentY);
                                }
                                else {
                                    if (nodeY.children.length === 1) {
                                        const targeted = nodeY.children.filter(node => {
                                            if (node.dataset.target) {
                                                const element = document.getElementById(node.dataset.target);
                                                return element != null && hasValue(element.dataset.ext) && element !== parentY.element;
                                            }
                                            return false;
                                        });
                                        if ((this.settings.collapseUnattributedElements &&
                                            !nodeY.documentRoot &&
                                            !hasValue(nodeY.element.id) &&
                                            !hasValue(nodeY.dataset.ext) &&
                                            !hasValue(nodeY.dataset.target) &&
                                            nodeY.toInt('width') === 0 &&
                                            nodeY.toInt('height') === 0 &&
                                            !backgroundVisible &&
                                            !nodeY.has('textAlign') && !nodeY.has('verticalAlign') &&
                                            nodeY.float !== 'right' && !nodeY.autoMargin && nodeY.alignOrigin &&
                                            !this.viewController.hasAppendProcessing(nodeY.id)) ||
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
                                            output = this.writeFrameLayout(nodeY, parentY);
                                        }
                                    }
                                    else {
                                        const children = nodeY.children as T[];
                                        const [linearX, linearY] = [NodeList.linearX(children), NodeList.linearY(children)];
                                        const clearedInside = NodeList.cleared(children);
                                        const relativeWrap = children.every(node => node.pageflow && node.inlineElement);
                                        if (!parentY.flex.enabled && children.every(node => node.pageflow)) {
                                            const floated = NodeList.floated(children);
                                            if (linearX && clearedInside.size === 0) {
                                                if (floated.size === 0 && children.every(node => node.toInt('verticalAlign') === 0)) {
                                                    if (children.some(node => ['text-top', 'text-bottom'].includes(node.css('verticalAlign')))) {
                                                        output = this.writeConstraintLayout(nodeY, parentY);
                                                        nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                    }
                                                    else if (Application.isRelativeHorizontal(children)) {
                                                        output = this.writeRelativeLayout(nodeY, parentY);
                                                        nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                    }
                                                }
                                                if (output === '') {
                                                    if (floated.size === 0 || !floated.has('right')) {
                                                        if (Application.isRelativeHorizontal(children)) {
                                                            output = this.writeRelativeLayout(nodeY, parentY);
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                        }
                                                        else {
                                                            output = this.writeLinearLayout(nodeY, parentY, true);
                                                            nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                        }
                                                    }
                                                }
                                            }
                                            else {
                                                if (linearY || (!relativeWrap && children.some(node => node.alignedVertically(node.previousSibling(), clearedInside)))) {
                                                    output = this.writeLinearLayout(nodeY, parentY, false);
                                                    if (linearY && !nodeY.documentRoot) {
                                                        nodeY.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                                                    }
                                                }
                                            }
                                        }
                                        if (output === '') {
                                            if (relativeWrap) {
                                                if (Application.isFrameHorizontal(children, clearedInside, true)) {
                                                    output = this.writeFrameLayoutHorizontal(nodeY, parentY, children, clearedInside);
                                                }
                                                else {
                                                    output = this.writeRelativeLayout(nodeY, parentY);
                                                    if (getElementsBetweenSiblings(children[0].baseElement, children[children.length - 1].baseElement)
                                                        .filter(element => isLineBreak(element)).length === 0)
                                                    {
                                                        nodeY.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                                                    }
                                                }
                                            }
                                            else {
                                                output = this.writeConstraintLayout(nodeY, parentY);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            output = this.writeNode(nodeY, parentY, nodeY.controlName);
                        }
                        renderNode(nodeY, parentY, output, currentY);
                    }
                    if (includeSupport && !nodeY.hasBit('excludeSection', APP_SECTION.INCLUDE)) {
                        if (includes.length > 0 && nodeY.dataset.includeEnd === 'true') {
                            includes.pop();
                        }
                    }
                }
            }
            for (const [key, templates] of partial.entries()) {
                const content: string[] = [];
                const [parentId, position] = key.split(':');
                const views = Array.from(templates.values());
                if (views.length > 0) {
                    if (this._sorted[parentId]) {
                        const parsed: string[] = [];
                        this._sorted[parentId].forEach(value => {
                            const result = views.find(view => view.indexOf(formatPlaceholder(value, '@')) !== -1);
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
                    const id = parentId + (position ? `:${position}` : '');
                    const placeholder = formatPlaceholder(id);
                    if (baseTemplate.indexOf(placeholder) !== -1) {
                        baseTemplate = replacePlaceholder(baseTemplate, placeholder, content.join(''));
                        empty = false;
                    }
                    else {
                        this.addRenderQueue(id, views);
                    }
                }
            }
            if (this.viewController.settingsInternal.includes) {
                for (const [filename, templates] of external.entries()) {
                    const content = Array.from(templates.values());
                    if (content.length > 0) {
                        const output = this.viewController.renderMerge(filename, content);
                        this.createIncludeFile(filename, output);
                    }
                }
            }
        }
        const root = this.cacheProcessing.parent as T;
        if (root.dataset.layoutName && (!hasValue(root.dataset.target) || root.renderExtension.size === 0)) {
            this.createLayoutFile(
                trimString(trimNull(root.dataset.pathname), '/'),
                root.dataset.layoutName,
                !empty ? baseTemplate : '',
                root.renderExtension.size > 0 && Array.from(root.renderExtension).some(item => item.documentRoot)
            );
        }
        if (!empty) {
            for (const ext of this.extensions) {
                ext.setTarget(root);
                ext.afterRender();
            }
        }
        else if (root.renderExtension.size === 0) {
            root.hide();
        }
        this.cacheProcessing.sort((a, b) => {
            if (!a.visible) {
                return 1;
            }
            else if (!b.visible) {
                return -1;
            }
            else if (a.renderDepth !== b.renderDepth) {
                return a.renderDepth < b.renderDepth ? -1 : 1;
            }
            else {
                if (!a.domElement) {
                    const nodeA = getNodeFromElement(a.baseElement);
                    if (nodeA) {
                        a = nodeA as T;
                    }
                    else {
                        return 1;
                    }
                }
                if (!b.domElement) {
                    const nodeB = getNodeFromElement(a.baseElement);
                    if (nodeB) {
                        b = nodeB as T;
                    }
                    else {
                        return -1;
                    }
                }
                if (a.documentParent !== b.documentParent) {
                    return a.documentParent.id < b.documentParent.id ? -1 : 1;
                }
                else {
                    return a.renderIndex < b.renderIndex ? -1 : 1;
                }
            }
        });
        this.cacheSession.list.push(...this.cacheProcessing.list);
    }

    public writeFrameLayout(node: T, parent: T, children = false) {
        if (!children && node.children.length === 0) {
            return this.viewController.renderNode(node, parent, NODE_STANDARD.FRAME);
        }
        else {
            return this.viewController.renderGroup(node, parent, NODE_STANDARD.FRAME);
        }
    }

    public writeLinearLayout(node: T, parent: T, horizontal: boolean) {
        return this.viewController.renderGroup(node, parent, NODE_STANDARD.LINEAR, { horizontal });
    }

    public writeGridLayout(node: T, parent: T, columnCount: number, rowCount: number = 0) {
        return this.viewController.renderGroup(node, parent, NODE_STANDARD.GRID, { columnCount, rowCount });
    }

    public writeRelativeLayout(node: T, parent: T) {
        return this.viewController.renderGroup(node, parent, NODE_STANDARD.RELATIVE);
    }

    public writeConstraintLayout(node: T, parent: T) {
        return this.viewController.renderGroup(node, parent, NODE_STANDARD.CONSTRAINT);
    }

    public writeNode(node: T, parent: T, nodeName: number | string) {
        return this.viewController.renderNode(node, parent, nodeName);
    }

    public writeFrameLayoutHorizontal(group: T, parent: T, nodes: T[], cleared: Map<T, string>) {
        type LayerIndex = ArrayObject<T[] | T[][]>;
        let output = '';
        let layers: LayerIndex = [];
        if (cleared.size === 0 && !nodes.some(node => node.autoMargin)) {
            const inline: T[] = [];
            const left: T[] = [];
            const right: T[] = [];
            for (const node of nodes) {
                if (node.floating) {
                    if (node.float === 'right') {
                        right.push(node);
                    }
                    else {
                        left.push(node);
                    }
                }
                else {
                    inline.push(node);
                }
            }
            if (inline.length === nodes.length || left.length === nodes.length || right.length === nodes.length) {
                group.alignmentType |= inline.length > 0 ? NODE_ALIGNMENT.HORIZONTAL : NODE_ALIGNMENT.FLOAT;
                if (right.length > 0) {
                    group.alignmentType |= NODE_ALIGNMENT.RIGHT;
                }
                if (Application.isRelativeHorizontal(nodes, cleared)) {
                    output = this.writeRelativeLayout(group, parent);
                    return output;
                }
                else {
                    output = this.writeLinearLayout(group, parent, true);
                    return output;
                }
            }
            else if (left.length === 0 || right.length === 0) {
                const subgroup = right.length === 0 ? [...left, ...inline] : [...inline, ...right];
                if (NodeList.linearY(subgroup)) {
                    output = this.writeLinearLayout(group, parent, false);
                    group.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                    return output;
                }
                else {
                    if (Application.isRelativeHorizontal(subgroup, cleared)) {
                        output = this.writeRelativeLayout(group, parent);
                        group.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                        if (right.length > 0) {
                            group.alignmentType |= NODE_ALIGNMENT.RIGHT;
                        }
                        return output;
                    }
                    else if (right.length === 0) {
                        if (!this.settings.floatOverlapDisabled) {
                            output = this.writeLinearLayout(group, parent, true);
                            layers = <LayerIndex> [left, inline];
                            group.alignmentType |= NODE_ALIGNMENT.FLOAT;
                        }
                    }
                }
            }
        }
        const inlineAbove: T[] = [];
        const inlineBelow: T[] = [];
        const leftAbove: T[] = [];
        const rightAbove: T[] = [];
        const leftBelow: T[] = [];
        const rightBelow: T[] = [];
        let leftSub: T[] | T[][] = [];
        let rightSub: T[] | T[][] = [];
        if (layers.length === 0) {
            let current = '';
            let pendingFloat = 0;
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (cleared.has(node)) {
                    const clear = cleared.get(node);
                    if (hasBit(pendingFloat, clear === 'right' ? 4 : 2) || (pendingFloat !== 0 && clear === 'both')) {
                        switch (clear) {
                            case 'left':
                                pendingFloat ^= 2;
                                current = 'left';
                                break;
                            case 'right':
                                pendingFloat ^= 4;
                                current = 'right';
                                break;
                            case 'both':
                                switch (pendingFloat) {
                                    case 2:
                                        current = 'left';
                                        break;
                                    case 4:
                                        current = 'right';
                                        break;
                                    default:
                                        current = 'both';
                                        break;
                                }
                                pendingFloat = 0;
                                break;
                        }
                    }
                }
                if (current === '') {
                    if (node.floating) {
                        if (node.float === 'right') {
                            rightAbove.push(node);
                            if (node.floating) {
                                pendingFloat |= 4;
                            }
                        }
                        else {
                            leftAbove.push(node);
                            if (node.floating) {
                                pendingFloat |= 2;
                            }
                        }
                    }
                    else if (node.autoMargin) {
                        if (node.autoMarginLeft) {
                            if (rightAbove.length > 0) {
                                rightBelow.push(node);
                            }
                            else {
                                rightAbove.push(node);
                            }
                        }
                        else if (node.autoMarginRight) {
                            if (leftAbove.length > 0) {
                                leftBelow.push(node);
                            }
                            else {
                                leftAbove.push(node);
                            }
                        }
                        else {
                            if (inlineAbove.length > 0) {
                                if (leftAbove.length === 0) {
                                    leftAbove.push(node);
                                }
                                else {
                                    rightAbove.push(node);
                                }
                            }
                            else {
                                inlineAbove.push(node);
                            }
                        }
                    }
                    else {
                        inlineAbove.push(node);
                    }
                }
                else {
                    if (node.floating) {
                        if (node.float === 'right') {
                            if (rightBelow.length === 0) {
                                pendingFloat |= 4;
                            }
                            if (!this.settings.floatOverlapDisabled && current !== 'right' && rightAbove.length > 0) {
                                rightAbove.push(node);
                            }
                            else {
                                rightBelow.push(node);
                            }
                        }
                        else {
                            if (leftBelow.length === 0) {
                                pendingFloat |= 2;
                            }
                            if (!this.settings.floatOverlapDisabled && current !== 'left' && leftAbove.length > 0) {
                                leftAbove.push(node);
                            }
                            else {
                                leftBelow.push(node);
                            }
                        }
                    }
                    else if (node.autoMargin) {
                        if (node.autoMarginLeft && rightBelow.length > 0) {
                            rightBelow.push(node);
                        }
                        else if (node.autoMarginRight && leftBelow.length > 0) {
                            leftBelow.push(node);
                        }
                        else {
                            inlineBelow.push(node);
                        }
                    }
                    else {
                        switch (current) {
                            case 'left':
                                leftBelow.push(node);
                                break;
                            case 'right':
                                rightBelow.push(node);
                                break;
                            default:
                                inlineBelow.push(node);
                                break;
                        }
                    }
                }
            }
            if (leftAbove.length > 0 && leftBelow.length > 0) {
                leftSub = [leftAbove, leftBelow];
                if (leftBelow.length > 1) {
                    leftBelow[0].alignmentType |= NODE_ALIGNMENT.EXTENDABLE;
                }
            }
            else if (leftAbove.length > 0) {
                leftSub = leftAbove;
            }
            else if (leftBelow.length > 0) {
                leftSub = leftBelow;
            }
            if (rightAbove.length > 0 && rightBelow.length > 0) {
                rightSub = [rightAbove, rightBelow];
                if (rightBelow.length > 1) {
                    rightBelow[0].alignmentType |= NODE_ALIGNMENT.EXTENDABLE;
                }
            }
            else if (rightAbove.length > 0) {
                rightSub = rightAbove;
            }
            else if (rightBelow.length > 0) {
                rightSub = rightBelow;
            }
            if (this.settings.floatOverlapDisabled) {
                if (parent.linearVertical) {
                    output = formatPlaceholder(group.id);
                    group.renderDepth--;
                }
                else {
                    output = this.writeLinearLayout(group, parent, false);
                }
                layers.push(inlineAbove, [leftAbove, rightAbove], inlineBelow);
            }
            else {
                if (inlineAbove.length === 0 &&
                    (leftSub.length === 0 || rightSub.length === 0)) {
                    output = this.writeLinearLayout(group, parent, false);
                    if (rightSub.length > 0) {
                        group.alignmentType |= NODE_ALIGNMENT.RIGHT;
                    }
                }
                else {
                    output = this.writeFrameLayout(group, parent, true);
                }
                if (inlineAbove.length > 0) {
                    if (rightBelow.length > 0) {
                        leftSub = [inlineAbove, leftAbove];
                        layers.push(leftSub, rightSub);
                    }
                    else if (leftBelow.length > 0) {
                        rightSub = [inlineAbove, rightAbove];
                        layers.push(rightSub, leftSub);
                    }
                    else {
                        layers.push(inlineAbove, leftSub, rightSub);
                    }
                    if (inlineAbove.length > 1) {
                        inlineAbove[0].alignmentType |= NODE_ALIGNMENT.EXTENDABLE;
                    }
                }
                else {
                    if ((leftSub === leftBelow && rightSub === rightAbove) || (leftSub === leftAbove && rightSub === rightBelow)) {
                        if (leftBelow.length === 0) {
                            layers.push([leftAbove, rightBelow]);
                        }
                        else {
                            layers.push([rightAbove, leftBelow]);
                        }
                    }
                    else {
                        layers.push(leftSub, rightSub);
                    }
                }
                layers = layers.filter(item => item && item.length > 0);
            }
            group.alignmentType |= NODE_ALIGNMENT.FLOAT;
        }
        if (layers.length > 0) {
            let floatgroup: Null<T> = null;
            layers.forEach((item, index) => {
                if (Array.isArray(item[0])) {
                    const grouping: T[] = [];
                    (item as T[][]).forEach(list => grouping.push(...list));
                    grouping.sort(NodeList.siblingIndex);
                    if (this.settings.floatOverlapDisabled) {
                        floatgroup = this.viewController.createGroup(group, grouping[0], grouping);
                        output = replacePlaceholder(output, group.id, this.writeFrameLayout(floatgroup, group, true));
                    }
                    else {
                        if (group.linearVertical) {
                            floatgroup = group;
                        }
                        else {
                            floatgroup = this.viewController.createGroup(group, grouping[0], grouping);
                            output = replacePlaceholder(output, group.id, this.writeLinearLayout(floatgroup, group, false));
                            if ((item as T[][]).some(list => list === rightSub || list === rightAbove)) {
                                floatgroup.alignmentType |= NODE_ALIGNMENT.RIGHT;
                            }
                        }
                    }
                    floatgroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                }
                else {
                    floatgroup = null;
                }
                ((Array.isArray(item[0]) ? item : [item]) as T[][]).forEach(section => {
                    let basegroup = group;
                    if (floatgroup && [inlineAbove, leftAbove, leftBelow, rightAbove, rightBelow].includes(section)) {
                        basegroup = floatgroup;
                    }
                    if (section.length > 1) {
                        let groupOutput = '';
                        const subgroup = this.viewController.createGroup(basegroup, section[0], section);
                        const floatLeft = section.some(node => node.float === 'left');
                        const floatRight = section.some(node => node.float === 'right');
                        if (Application.isRelativeHorizontal(section, NodeList.cleared(section))) {
                            groupOutput = this.writeRelativeLayout(subgroup, basegroup);
                            subgroup.alignmentType |= NODE_ALIGNMENT.HORIZONTAL;
                        }
                        else {
                            groupOutput = this.writeLinearLayout(subgroup, basegroup, NodeList.linearX(section));
                            if (floatRight && subgroup.children.some(node => node.marginLeft < 0)) {
                                const sorted: T[] = [];
                                let marginRight = 0;
                                subgroup.children.slice().forEach((node: T) => {
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
                                this.saveSortOrder(subgroup.id, subgroup.children as T[]);
                            }
                        }
                        subgroup.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                        if (floatLeft || floatRight) {
                            subgroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                            if (floatRight) {
                                subgroup.alignmentType |= NODE_ALIGNMENT.RIGHT;
                            }
                        }
                        output = replacePlaceholder(output, basegroup.id, groupOutput);
                        basegroup.appendRendered(subgroup);
                    }
                    else if (section.length > 0) {
                        const single = section[0];
                        single.alignmentType |= NODE_ALIGNMENT.SINGLE;
                        if (single.float === 'right') {
                            single.alignmentType |= NODE_ALIGNMENT.RIGHT;
                        }
                        single.renderPosition = index;
                        output = replacePlaceholder(output, basegroup.id, `{:${basegroup.id}:${index}}`);
                        basegroup.appendRendered(single);
                    }
                });
            });
        }
        return output;
    }

    public writeFrameLayoutVertical(group: Null<T>, parent: T, nodes: T[], cleared: Map<T, string>) {
        let output = '';
        if (!group) {
            group = parent;
            output = formatPlaceholder(group.id);
        }
        else {
            output = this.writeLinearLayout(group, parent, false);
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
        for (const node of nodes) {
            if (cleared.has(node)) {
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
                    const basegroup = this.viewController.createGroup(group, baseNode, []);
                    const children: T[] = [];
                    let subgroup: Null<T> = null;
                    if (floating.length > 1) {
                        subgroup = this.viewController.createGroup(basegroup, floating[0], floating);
                        basegroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                    }
                    else if (floating.length > 0) {
                        subgroup = floating[0];
                        subgroup.parent = basegroup;
                        basegroup.alignmentType |= NODE_ALIGNMENT.FLOAT;
                    }
                    if (subgroup) {
                        children.push(subgroup);
                        if (i === 0 && leadingMargin > 0) {
                            subgroup.modifyBox(BOX_STANDARD.MARGIN_TOP, leadingMargin);
                        }
                        subgroup = null;
                    }
                    if (pageflow.length > 1) {
                        subgroup = this.viewController.createGroup(basegroup, pageflow[0], pageflow);
                    }
                    else if (pageflow.length > 0) {
                        subgroup = pageflow[0];
                        subgroup.parent = basegroup;
                    }
                    if (subgroup) {
                        children.push(subgroup);
                    }
                    basegroup.init();
                    content += this.writeFrameLayout(basegroup, group, true);
                    basegroup.alignmentType |= NODE_ALIGNMENT.VERTICAL;
                    children.forEach((node, index) => {
                        if (nodes.includes(node)) {
                            content = replacePlaceholder(content, basegroup.id, `{:${basegroup.id}:${index}}`);
                        }
                        else {
                            content = replacePlaceholder(content, basegroup.id, this.writeLinearLayout(node, basegroup, false));
                            node.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                        }
                    });
                }
            }
            output = replacePlaceholder(output, group.id, content);
        }
        return output;
    }

    public appendRenderQueue() {
        for (const ext of this.extensions) {
            for (const node of ext.subscribers) {
                ext.setTarget(node);
                ext.beforeInsert();
            }
        }
        const template: StringMap = {};
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
                const target = this.cacheSession.find('id', parseInt(replaceId));
                if (target) {
                    const depth = target.renderDepth + 1;
                    output = replaceIndent(output, depth);
                    const pattern = /{@(\d+)}/g;
                    let match: Null<RegExpExecArray> = null;
                    let i = 0;
                    while ((match = pattern.exec(output)) != null) {
                        const node = this.cacheSession.find('id', parseInt(match[1]));
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
                    template[inner] = template[inner].replace(formatPlaceholder(outer), template[outer]);
                    template[outer] = template[outer].replace(formatPlaceholder(inner), template[inner]);
                }
            }
        }
        for (const value of this.layouts) {
            for (const id in template) {
                value.content = value.content.replace(formatPlaceholder(id), template[id]);
            }
            value.content = this.viewController.appendRenderQueue(value.content);
        }
        for (const ext of this.extensions) {
            for (const node of ext.subscribers) {
                ext.setTarget(node);
                ext.afterInsert();
            }
        }
    }

    public createLayoutFile(pathname: string, filename: string, content: string, documentRoot = false) {
        pathname = pathname || this.viewController.settingsInternal.layout.pathName;
        const layout: PlainFile = {
            pathname,
            filename,
            content
        };
        if (documentRoot && this._views.length > 0 && this._views[0].content === '') {
            this._views[0] = layout;
            this._currentIndex = 0;
        }
        else {
            this.layoutProcessing = layout;
        }
    }

    public createIncludeFile(filename: string, content: string) {
        this._includes.push({
            pathname: this.viewController.settingsInternal.layout.pathName,
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

    public saveSortOrder(id: string | number, nodes: T[]) {
        this._sorted[id.toString()] = nodes.map(node => node.id);
    }

    public insertNode(element: Element, parent?: T) {
        let node: Null<T> = null;
        if (element.nodeName.charAt(0) === '#') {
            if (element.nodeName === '#text') {
                if (isPlainText(element, true) || cssParent(element, 'whiteSpace', 'pre', 'pre-wrap')) {
                    node = new this.nodeObject(this.cacheProcessing.nextId, element);
                    this.viewController.initNode(node);
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
        else if (isStyleElement(element)) {
            const elementNode = new this.nodeObject(this.cacheProcessing.nextId, element);
            this.viewController.initNode(elementNode);
            if (isElementVisible(element, this.settings.hideOffScreenElements)) {
                node = elementNode;
                node.setExclusions();
            }
            else {
                elementNode.excluded = true;
                elementNode.visible = false;
            }
        }
        if (node) {
            this.cacheProcessing.append(node);
        }
        return node;
    }

    public getExtension(name: string) {
        return this.extensions.find(item => item.name === name);
    }

    public toString() {
        return this._views.length > 0 ? this._views[0].content : '';
    }

    private setStyleMap() {
        let warning = false;
        const clientFirefox = isUserAgent(USER_AGENT.FIREFOX);
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = <CSSStyleSheet> document.styleSheets[i];
            if (styleSheet.cssRules) {
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    try {
                        const rule = <CSSStyleRule> styleSheet.cssRules[j];
                        const attrs = new Set<string>();
                        for (const attr of Array.from(rule.style)) {
                            attrs.add(convertCamelCase(attr));
                        }
                        Array.from(document.querySelectorAll(rule.selectorText)).forEach((element: HTMLElement) => {
                            for (const attr of Array.from(element.style)) {
                                attrs.add(convertCamelCase(attr));
                            }
                            const style = getStyle(element);
                            const styleMap: StringMap = {};
                            for (const attr of attrs) {
                                const value: string = rule.style[attr];
                                if (element.style[attr]) {
                                    styleMap[attr] = element.style[attr];
                                }
                                else if (style[attr] === value) {
                                    styleMap[attr] = style[attr];
                                }
                                else if (value) {
                                    switch (attr) {
                                        case 'fontSize':
                                            styleMap[attr] = style[attr] || value;
                                            break;
                                        case 'width':
                                        case 'height':
                                        case 'lineHeight':
                                        case 'verticalAlign':
                                        case 'textIndent':
                                        case 'columnGap':
                                        case 'top':
                                        case 'right':
                                        case 'bottom':
                                        case 'left':
                                        case 'marginTop':
                                        case 'marginRight':
                                        case 'marginBottom':
                                        case 'marginLeft':
                                        case 'paddingTop':
                                        case 'paddingRight':
                                        case 'paddingBottom':
                                        case 'paddingLeft':
                                            styleMap[attr] = /^[A-Za-z\-]+$/.test(value) || isPercent(value) ? value : convertPX(value, style.fontSize);
                                            break;
                                        default:
                                            if (styleMap[attr] == null) {
                                                styleMap[attr] = value;
                                            }
                                            break;
                                    }
                                }
                            }
                            if (this.settings.preloadImages && hasValue(styleMap.backgroundImage) && styleMap.backgroundImage !== 'initial') {
                                styleMap.backgroundImage.split(',')
                                    .map((value: string) => value.trim())
                                    .forEach(value => {
                                        const uri = cssResolveUrl(value);
                                        if (uri !== '' && !this.cacheImage.has(uri)) {
                                            this.cacheImage.set(uri, { width: 0, height: 0, uri });
                                        }
                                    });
                            }
                            if (clientFirefox && styleMap.display == null) {
                                switch (element.tagName) {
                                    case 'INPUT':
                                    case 'TEXTAREA':
                                    case 'SELECT':
                                    case 'BUTTON':
                                        styleMap.display = 'inline-block';
                                        break;
                                }
                            }
                            const data = getElementCache(element, 'styleMap');
                            if (data) {
                                Object.assign(data, styleMap);
                            }
                            else {
                                setElementCache(element, 'style', style);
                                setElementCache(element, 'styleMap', styleMap);
                            }
                        });
                    }
                    catch (error) {
                        if (!warning) {
                            alert('External CSS files cannot be parsed when loading this program from your hard drive with Chrome 64+ (file://). ' +
                                  'Either use a local web server (http://), embed your CSS files into a <style> tag, or use a different browser. ' +
                                  'See the README for further instructions.\n\n' +
                                  `${styleSheet.href}\n\n${error}`);
                            warning = true;
                        }
                    }
                }
            }
        }
    }

    set appName(value) {
        if (this.resourceHandler) {
            this.resourceHandler.file.appName = value;
        }
    }
    get appName() {
        return this.resourceHandler ? this.resourceHandler.file.appName : '';
    }

    set settings(value) {
        this._settings = value;
        if (this.viewController) {
            this.viewController.settings = value;
        }
        if (this.resourceHandler) {
            this.resourceHandler.settings = value;
        }
    }
    get settings() {
        return this._settings ? this._settings : {} as Settings;
    }

    set layoutProcessing(value) {
        this._currentIndex = this._views.length;
        this._views.push(value);
    }
    get layoutProcessing() {
        return this._views[this._currentIndex];
    }

    get layouts() {
        return [...this._views, ...this._includes];
    }

    get viewData(): ViewData<NodeList<T>> {
        return {
            cache: this.cacheSession,
            views: this._views,
            includes: this._includes
        };
    }

    get size() {
        return this._views.length + this._includes.length;
    }
}