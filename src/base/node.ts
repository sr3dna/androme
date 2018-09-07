import { BoxModel, ClientRect, Flexbox, Null, ObjectMap, Point, StringMap } from '../lib/types';
import { IExtension } from '../extension/lib/types';
import { convertCamelCase, convertInt, hasValue, hasBit, isPercent, search, sortAsc, sortDesc } from '../lib/util';
import { assignBounds, getElementCache, getNodeFromElement, getRangeClientRect, hasFreeFormText, isPlainText, setElementCache } from '../lib/dom';
import { INLINE_ELEMENT, NODE_ALIGNMENT, NODE_PROCEDURE, NODE_RESOURCE, OVERFLOW_ELEMENT } from '../lib/constants';

type T = Node;

export default abstract class Node implements BoxModel {
    public style: CSSStyleDeclaration;
    public styleMap: StringMap = {};
    public originalStyleMap: StringMap = {};
    public nodeId: string;
    public nodeType = 0;
    public alignmentType = NODE_ALIGNMENT.NONE;
    public depth = -1;
    public renderIndex = -1;
    public siblingIndex = Number.MAX_VALUE;
    public box: ClientRect;
    public bounds: ClientRect;
    public linear: ClientRect;
    public excludeProcedure = NODE_PROCEDURE.NONE;
    public excludeResource = NODE_RESOURCE.NONE;
    public renderExtension: IExtension[] = [];
    public renderExtensionChild: IExtension[] = [];
    public documentRoot = false;
    public renderAs: T;
    public companion: T;
    public visible = true;
    public rendered = false;
    public isolated = false;
    public relocated = false;

    public abstract readonly renderChildren: T[];
    public abstract children: T[];
    public abstract constraint: ObjectMap<any>;

    protected _controlName: string;
    protected _renderParent: T;
    protected _documentParent: T;
    protected _boxAdjustment: BoxModel = {
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0
    };
    protected _boxReset: BoxModel = {
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0
    };

    protected abstract _namespaces: Set<string>;

    private _element: Element;
    private _parent: T;
    private _nodeName: string;
    private _renderDepth: number;
    private _pageflow: boolean;
    private _multiLine: boolean;
    private _lineHeight: number;
    private _data: ObjectMap<any> = {};
    private _initialized = false;

    constructor(
        public readonly id: number,
        element?: Element)
    {
        if (element != null) {
            this.element = element;
            this.init();
        }
    }

    public abstract setNodeType(viewName: string): void;
    public abstract setLayout(width?: number, height?: number): void;
    public abstract setAlignment(): void;
    public abstract setBoxSpacing(): void;
    public abstract setAccessibility(): void;
    public abstract applyCustomizations(overwrite: boolean): void;
    public abstract applyOptimizations(options: ObjectMap<any>): void;
    public abstract modifyBox(region: number, offset: number | null, negative?: boolean, bounds?: boolean): void;
    public abstract valueBox(region: number): string[];
    public abstract clone(id?: number, children?: boolean): T;

    public abstract set controlName(value: string);
    public abstract get controlName();
    public abstract set documentParent(value: T);
    public abstract get documentParent(): T;
    public abstract set renderParent(value: T);
    public abstract get renderParent(): T;
    public abstract get linearHorizontal(): boolean;
    public abstract get linearVertical(): boolean;

    public init() {
        if (!this._initialized) {
            const element = this.element;
            if (element instanceof HTMLElement) {
                const styleMap = getElementCache(element, 'styleMap') || {};
                for (const inline of Array.from(element.style)) {
                    styleMap[convertCamelCase(inline)] = (<any> element.style)[inline];
                }
                this.style = (<CSSStyleDeclaration> getElementCache(element, 'style')) || getComputedStyle(element);
                this.styleMap = styleMap;
                this.originalStyleMap = Object.assign({}, styleMap);
            }
            if (this.id !== 0) {
                setElementCache(element, 'node', this);
            }
            this._initialized = true;
        }
    }

    public is(...views: number[]) {
        for (const value of views) {
            if (this.nodeType === value) {
                return true;
            }
        }
        return false;
    }

    public of(nodeType: number, ...alignmentType: number[]) {
        if (this.nodeType === nodeType) {
            for (const value of alignmentType) {
                if (this.hasBit('alignmentType', value)) {
                    return true;
                }
            }
        }
        return false;
    }

    public attr(obj: string, attr: string, value = '', overwrite = true) {
        const name = `_${obj || '_'}`;
        if (hasValue(value)) {
            if (this[name] == null) {
                this._namespaces.add(obj);
                this[name] = {};
            }
            if (!overwrite && this[name][attr] != null) {
                return;
            }
            this[name][attr] = value;
        }
    }

    public get(obj: string): StringMap {
        const name = `_${obj || '_'}`;
        return (this[name] != null ? this[name] : {});
    }

    public delete(obj: string, ...attrs: string[]) {
        const name = `_${obj || '_'}`;
        if (this[name] != null) {
            for (const attr of attrs) {
                if (attr.indexOf('*') !== -1) {
                    for (const [key] of search(this[name], attr)) {
                        delete this[name][key];
                    }
                }
                else {
                    delete this[name][attr];
                }
            }
        }
    }

    public apply(options = {}) {
        for (const obj in options) {
            const attrs = options[obj];
            if (typeof attrs === 'object') {
                for (const attr in attrs) {
                    this.attr(obj, attr, attrs[attr]);
                }
                delete options[obj];
            }
        }
    }

    public each(predicate: (value: T, index?: number) => void, rendered = false) {
        (rendered ? this.renderChildren : this.children).forEach(predicate);
        return this;
    }

    public render(parent?: T) {
        if (parent) {
            this.renderParent = parent;
            this.renderDepth = (parent === this || this.documentRoot || parent.isSet('dataset', 'target') ? 0 : parent.renderDepth + 1);
            this.rendered = true;
        }
    }

    public hide() {
        this.rendered = true;
        this.visible = false;
    }

    public data(obj: string, attr: string, value?: any, overwrite = true) {
        if (hasValue(value)) {
            if (this._data[obj] == null) {
                this._data[obj] = {};
            }
            if (overwrite || this._data[obj][attr] == null) {
                this._data[obj][attr] = value;
            }
        }
        return (this._data[obj] != null ? this._data[obj][attr] : null);
    }

    public ascend(element = false) {
        const result: T[] = [];
        const attr = (element ? 'documentParent' : 'parent');
        let current: T = this[attr];
        while (current != null && current.id !== 0) {
            result.push(current);
            current = current[attr];
        }
        return result;
    }

    public cascade() {
        function cascade(node: T) {
            const current = [...node.children];
            for (const item of node.children) {
                current.push(...cascade(item));
            }
            return current;
        }
        return cascade(this);
    }

    public inherit(node: T, ...props: string[]) {
        for (const type of props) {
            switch (type) {
                case 'base':
                    this.style = node.style;
                    this.bounds = node.bounds;
                    this.linear = node.linear;
                    this.box = node.box;
                    break;
                case 'data':
                    for (const obj in this._data) {
                        for (const name in this._data[obj]) {
                            const source = this._data[obj][name];
                            if (typeof source === 'object' && source.inherit === true) {
                                const destination = node.data(obj, name);
                                if (destination) {
                                    for (const attr in source) {
                                        switch (typeof source[attr]) {
                                            case 'number':
                                                destination[attr] += source[attr];
                                                break;
                                            case 'boolean':
                                                if (source[attr] === true) {
                                                    destination[attr] = true;
                                                }
                                                break;
                                            default:
                                                destination[attr] = source[attr];
                                                break;
                                        }
                                    }
                                }
                                else {
                                    node.data(obj, name, source);
                                }
                                delete this._data[obj][name];
                            }
                        }
                    }
                    break;
                case 'style':
                    const style = { whiteSpace: node.css('whiteSpace') };
                    for (const attr in node.style) {
                        if (attr.startsWith('font') || attr.startsWith('color')) {
                            const key = convertCamelCase(attr);
                            style[key] = node.style[key];
                        }
                    }
                    this.css(style);
                    break;
                case 'styleMap':
                    for (const attr in node.styleMap) {
                        if (this.styleMap[attr] == null) {
                            this.css(attr, node.styleMap[attr]);
                        }
                    }
                    break;
            }
        }
    }

    public intersect(rect: ClientRect, dimension = 'linear') {
        const top = (rect.top > this[dimension].top && rect.top < this[dimension].bottom);
        const right = (Math.floor(rect.right) > Math.ceil(this[dimension].left) && rect.right < this[dimension].right);
        const bottom = (Math.floor(rect.bottom) > Math.ceil(this[dimension].top) && rect.bottom < this[dimension].bottom);
        const left = (rect.left > this[dimension].left && rect.left < this[dimension].right);
        return (top && (left || right)) || (bottom && (left || right));
    }

    public intersectX(rect: ClientRect, dimension = 'linear') {
        return (
            (rect.top >= this[dimension].top && rect.top < this[dimension].bottom) ||
            (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom) ||
            (this[dimension].top >= rect.top && this[dimension].bottom <= rect.bottom) ||
            (rect.top >= this[dimension].top && rect.bottom <= this[dimension].bottom)
        );
    }

    public intersectY(rect: ClientRect, dimension = 'linear') {
        return (
            (rect.left >= this[dimension].left && rect.left < this[dimension].right) ||
            (rect.right > this[dimension].left && rect.right <= this[dimension].right) ||
            (this[dimension].left >= rect.left && this[dimension].right <= rect.right) ||
            (rect.left >= this[dimension].left && rect.right <= this[dimension].right)
        );
    }

    public withinX(rect: ClientRect, dimension = 'linear') {
        return (this[dimension].top >= rect.top && this[dimension].bottom <= rect.bottom);
    }

    public withinY(rect: ClientRect, dimension = 'linear') {
        return (this[dimension].left >= rect.left && this[dimension].right <= rect.right);
    }

    public css(attr: string | object, value = ''): string {
        if (typeof attr === 'object') {
            Object.assign(this.styleMap, attr);
            return '';
        }
        else {
            if (arguments.length === 2) {
                this.styleMap[attr] = (hasValue(value) ? value : '');
            }
            return this.styleMap[attr] || (this.style && this.style[attr]) || '';
        }
    }

    public cssOriginal(attr: string, complete = false) {
        return this.originalStyleMap[attr] || (complete ? this.css(attr) : '');
    }

    public cssParent(attr: string, includeChild = false) {
        let result = '';
        let current = (includeChild ? this : getNodeFromElement(this.element.parentElement));
        while (current != null) {
            result = current.originalStyleMap[attr] || '';
            if (current.documentBody || result) {
                break;
            }
            current = getNodeFromElement(current.element.parentElement);
        }
        return result;
    }

    public has(attr: string) {
        return this.isSet('styleMap', attr);
    }

    public hasBit(attr: string, bit: number) {
        if (this[attr] != null) {
            return hasBit(this[attr], bit);
        }
        return false;
    }

    public toInt(attr: string, defaultValue = 0) {
        return parseInt(this.styleMap[attr]) || defaultValue;
    }

    public setExclusions() {
        if (this.hasElement) {
            [['excludeProcedure', NODE_PROCEDURE], ['excludeResource', NODE_RESOURCE]].forEach((item: [string, any]) => {
                let exclude = this.dataset[item[0]] || '';
                if (this.element.parentElement != null) {
                    exclude += '|' + (this.element.parentElement.dataset[`${item[0]}Child`] || '');
                }
                exclude.split('|').map(value => value.toUpperCase().trim()).forEach(value => {
                    if (item[1][value] != null) {
                        this[item[0]] |= item[1][value];
                    }
                });
            });
        }
    }

    public setBounds(calibrate = false) {
        if (!calibrate) {
            let bounds: ClientRect;
            if (this.hasElement) {
                bounds = assignBounds(<ClientRect> this.element.getBoundingClientRect());
            }
            else {
                [bounds] = getRangeClientRect(this.element);
            }
            this.bounds = bounds;
        }
        if (this.bounds != null) {
            if (this.companion != null) {
                const outerBounds = this.companion.bounds;
                this.bounds.left = Math.min(this.bounds.left, outerBounds.left);
                this.bounds.right = Math.max(this.bounds.right, outerBounds.right);
                this.bounds.width = this.bounds.right - this.bounds.left;
            }
            const linear: ClientRect = {
                top: this.bounds.top - (this.marginTop > 0 ? this.marginTop : 0),
                right: this.bounds.right + this.marginRight,
                bottom: this.bounds.bottom + this.marginBottom,
                left: this.bounds.left - (this.marginLeft > 0 ? this.marginLeft : 0),
                width: 0,
                height: 0
            };
            if (this.linear != null) {
                Object.assign(this.linear, linear);
            }
            else {
                this.linear = linear;
            }
            const box: ClientRect = {
                top: this.bounds.top + (this.paddingTop + this.borderTopWidth),
                right: this.bounds.right - (this.paddingRight + this.borderRightWidth),
                bottom: this.bounds.bottom - (this.paddingBottom + this.borderBottomWidth),
                left: this.bounds.left + (this.paddingLeft + this.borderLeftWidth),
                width: 0,
                height: 0
            };
            if (this.box != null) {
                Object.assign(this.box, box);
            }
            else {
                this.box = box;
            }
            this.setDimensions();
        }
    }

    public setBoundsMin() {
        if (this.element !== document.body) {
            const nodes = this.children.filter(node => !node.pageflow);
            if (nodes.length > 0) {
                const [right, bottom] = [Math.max.apply(null, this.children.map(node => node.linear.right)), Math.max.apply(null, this.children.map(node => node.linear.bottom))];
                let calibrate = false;
                if (right > this.box.right) {
                    this.bounds.right = right + (this.paddingRight + this.borderRightWidth);
                    this.bounds.width = this.bounds.right - this.bounds.left;
                    calibrate = true;
                }
                if (bottom > this.box.bottom) {
                    this.bounds.bottom = bottom + (this.paddingBottom + this.borderBottomWidth);
                    this.bounds.height = this.bounds.bottom - this.bounds.top;
                    calibrate = true;
                }
                if (calibrate) {
                    this.setBounds(true);
                }
            }
        }
    }

    public setDimensions(bounds = ['linear', 'box']) {
        for (const dimension of bounds) {
            const dimen = this[dimension];
            dimen.width = (this.multiLine ? this.bounds.width : dimen.right - dimen.left);
            dimen.height = dimen.bottom - dimen.top;
        }
    }

    public setMultiLine() {
        if (this._element != null) {
            this._multiLine = false;
            switch (this._element.tagName) {
                case 'IMG':
                case 'INPUT':
                case 'BUTTON':
                case 'TEXTAREA':
                case 'HR':
                case 'IFRAME':
                    return;
                default:
                    if (this.viewWidth === 0 && this.inlineElement && !this.floating && (this.inlineText || this.plainText)) {
                        this._multiLine = getRangeClientRect(this.element)[1];
                    }
                    break;
            }
        }
        else {
            this._multiLine = false;
        }
    }

    public getParentElementAsNode(negative = false) {
        let parent = getNodeFromElement(this.element.parentElement);
        if (!this.pageflow) {
            let found = false;
            let previous: Null<T> = null;
            let relativeParent: Null<T> = null;
            while (parent && parent.id !== 0) {
                if (relativeParent == null && this.position === 'absolute') {
                    if (!['static', 'initial'].includes(parent.position)) {
                        const top = convertInt(this.top);
                        const left = convertInt(this.left);
                        if ((top >= 0 && left >= 0) || !negative || (negative && Math.abs(top) <= parent.marginTop && Math.abs(left) <= parent.marginLeft) || this.imageElement) {
                            found = true;
                            break;
                        }
                        relativeParent = parent;
                    }
                }
                else {
                    if ((this.withinX(parent.box) && this.withinY(parent.box)) || (previous && ((this.linear.top >= parent.linear.top && this.linear.top < previous.linear.top) || (this.linear.right <= parent.linear.right && this.linear.right > previous.linear.right) || (this.linear.bottom <= parent.linear.bottom && this.linear.bottom > previous.linear.bottom) || (this.linear.left >= parent.linear.left && this.linear.left < previous.linear.left)))) {
                        found = true;
                        break;
                    }
                }
                previous = parent;
                parent = getNodeFromElement(parent.element.parentElement);
            }
            if (!found)  {
                parent = relativeParent;
            }
        }
        return parent;
    }

    public remove(node: T) {
        this.children = this.children.filter(child => child !== node);
    }

    public renderAppend(node: T) {
        if (this.renderChildren.indexOf(node) === -1) {
            this.renderChildren.push(node);
        }
    }

    public isSet(obj: string, attr: string) {
        return (this[obj] && this[obj][attr] != null ? hasValue(this[obj][attr]) : false);
    }

    private boxDocument(region: string, direction: string) {
        const attr = region + direction;
        if (this.hasElement) {
            let node: T = this;
            const horizontal = (direction === 'Left' || direction === 'Right');
            if (horizontal) {
                if (this.companion != null) {
                    let valid = false;
                    const side = direction.toLowerCase();
                    switch (side) {
                        case 'Left':
                            valid = (this.companion.linear[side] < this.linear[side]);
                            break;
                        case 'Right':
                            valid = (this.companion.linear[side] > this.linear[side]);
                            break;
                    }
                    if (valid) {
                        node = this.companion;
                    }
                }
            }
            const value = node.css(attr);
            if (isPercent(value)) {
                return (node.style[attr] ? convertInt(node.style[attr]) : node.documentParent.box[(horizontal ? 'width' : 'height')] * (convertInt(value) / 100));
            }
            else {
                return convertInt(value);
            }
        }
        else {
            return convertInt(this.css(attr));
        }
    }

    set parent(value) {
        if (value == null || value === this._parent) {
            return;
        }
        if (this._parent != null) {
            this._parent.children = this._parent.children.filter(node => node !== this);
        }
        this._parent = value;
        if (value.children.indexOf(this) === -1) {
            value.children.push(this);
        }
        this.depth = value.depth + 1;
    }
    get parent() {
        return this._parent;
    }

    set nodeName(value) {
        this._nodeName = value;
    }
    get nodeName() {
        return this._nodeName || (this.hasElement ? (this.tagName === 'INPUT' ? (<HTMLInputElement> this.element).type.toUpperCase() : this.tagName) : '');
    }

    set element(value) {
        this._element = value;
    }
    get element() {
        return this._element || {};
    }

    get tagName() {
        return this._element && (this._element.tagName || '');
    }

    get hasElement() {
        return (this.element instanceof HTMLElement);
    }

    get documentBody() {
        return (this.element === document.body);
    }

    set renderDepth(value) {
        this._renderDepth = value;
    }
    get renderDepth() {
        if (this._renderDepth == null) {
            if (this.documentRoot) {
                this._renderDepth = 0;
            }
            else {
                if (this.parent != null) {
                    this._renderDepth = this.parent.renderDepth + 1;
                }
            }
        }
        return this._renderDepth || 0;
    }

    get dataset(): DOMStringMap {
        return (this.element instanceof HTMLElement ? this.element.dataset : {});
    }

    get extension() {
        return (hasValue(this.dataset.ext) ? (this.dataset.ext as string).split(',')[0].trim() : '');
    }

    get flex(): Flexbox {
        const style = this.style;
        if (style != null) {
            const parent = this.documentParent;
            return {
                enabled: ((style.display as string).indexOf('flex') !== -1),
                direction: <string> style.flexDirection,
                basis: <string> style.flexBasis,
                grow: convertInt(style.flexGrow),
                shrink: convertInt(style.flexShrink),
                wrap: <string> style.flexWrap,
                alignSelf: <string> (parent.has('alignItems') && (!this.has('alignSelf') || style.alignSelf === 'auto') ? parent.css('alignItems') : style.alignSelf),
                justifyContent: <string> style.justifyContent,
                order: convertInt(style.order)
            };
        }
        return <Flexbox> { enabled: false };
    }

    get viewWidth() {
        return (this.inlineStatic || isPercent(this.styleMap.width) ? 0 : this.toInt('width') || this.toInt('minWidth'));
    }
    get viewHeight() {
        return (this.inlineStatic || isPercent(this.styleMap.height) ? 0 : this.toInt('height') || this.toInt('minHeight'));
    }

    get lineHeight() {
        if (this.rendered) {
            if (this._lineHeight == null) {
                this._lineHeight = 0;
                if (this.children.length === 0 && !this.renderParent.linearHorizontal) {
                    const lineHeight = this.toInt('lineHeight');
                    if (this.inlineElement) {
                        this._lineHeight = lineHeight || this.documentParent.toInt('lineHeight');
                    }
                    else {
                        this._lineHeight = lineHeight;
                    }
                }
            }
            return this._lineHeight;
        }
        return 0;
    }

    get display() {
        return this.css('display') || '';
    }

    get position() {
        return this.css('position') || '';
    }

    get top() {
        const top = this.styleMap.top;
        return (!top || top === 'auto' ? null : convertInt(top));
    }
    get right() {
        const right = this.styleMap.right;
        return (!right || right === 'auto' ? null : convertInt(right));
    }
    get bottom() {
        const bottom = this.styleMap.bottom;
        return (!bottom || bottom === 'auto' ? null : convertInt(bottom));
    }
    get left() {
        const left = this.styleMap.left;
        return (!left || left === 'auto' ? null : convertInt(left));
    }

    get marginTop() {
        return (this.inlineStatic ? 0 : this.boxDocument('margin', 'Top'));
    }
    get marginRight() {
        return this.boxDocument('margin', 'Right');
    }
    get marginBottom() {
        return (this.inlineStatic ? 0 : this.boxDocument('margin', 'Bottom'));
    }
    get marginLeft() {
        return this.boxDocument('margin', 'Left');
    }

    get borderTopWidth() {
        return (this.css('borderTopStyle') !== 'none' ? convertInt(this.css('borderTopWidth')) : 0);
    }
    get borderRightWidth() {
        return (this.css('borderRightStyle') !== 'none' ? convertInt(this.css('borderRightWidth')) : 0);
    }
    get borderBottomWidth() {
        return (this.css('borderBottomStyle') !== 'none' ? convertInt(this.css('borderBottomWidth')) : 0);
    }
    get borderLeftWidth() {
        return (this.css('borderLeftStyle') !== 'none' ? convertInt(this.css('borderLeftWidth')) : 0);
    }

    get paddingTop() {
        return this.boxDocument('padding', 'Top');
    }
    get paddingRight() {
        return this.boxDocument('padding', 'Right');
    }
    get paddingBottom() {
        return this.boxDocument('padding', 'Bottom');
    }
    get paddingLeft() {
        return this.boxDocument('padding', 'Left');
    }

    set pageflow(value) {
        this._pageflow = value;
    }
    get pageflow() {
        if (this._pageflow == null) {
            const position = this.position;
            return (position === 'static' || position === 'initial' || position === 'relative' || this.alignMargin);
        }
        return this._pageflow;
    }

    get siblingflow() {
        const position = this.position;
        return !(position === 'absolute' || position === 'fixed');
    }

    get inline() {
        const display = this.display;
        return (display === 'inline' || (display === 'initial' && INLINE_ELEMENT.includes(this.tagName)));
    }

    get inlineElement() {
        const position = this.position;
        const display = this.display;
        return (this.inline || display.indexOf('inline') !== -1 || display === 'table-cell' || this.floating || ((position === 'absolute' || position === 'fixed') && this.alignMargin));
    }

    get inlineStatic() {
        return (this.inline && !this.floating && this.tagName !== 'IMG');
    }

    get inlineText() {
        return (this.hasElement && !['INPUT', 'IMG', 'SELECT', 'TEXTAREA'].includes(this.tagName) && this.children.length === 0 && (hasFreeFormText(this.element) || (this.element.children.length > 0 && Array.from(this.element.children).every((item: Element) => getElementCache(item, 'supportInline'))) || (this.element.children.length === 0 && (this.borderTopWidth > 0 || this.borderBottomWidth > 0 || this.borderRightWidth > 0 || this.borderLeftWidth > 0))));
    }

    get plainText() {
        return (this.nodeName === 'PLAINTEXT');
    }

    get imageElement() {
        return (this.tagName === 'IMG');
    }

    get block() {
        const display = this.display;
        return (display === 'block' || display === 'list-item');
    }

    get blockStatic() {
        return (this.block && this.pageflow && this.siblingflow && (!this.floating || this.css('width') === '100%'));
    }

    get alignMargin() {
        return (this.top == null && this.right == null && this.bottom == null && this.left == null);
    }

    get autoMargin() {
        return (this.originalStyleMap.marginLeft === 'auto' || this.originalStyleMap.marginRight === 'auto');
    }

    get centerMarginHorizontal() {
        return (this.originalStyleMap.marginLeft === 'auto' && this.originalStyleMap.marginRight === 'auto');
    }

    get centerMarginVertical() {
        return (this.originalStyleMap.marginTop === 'auto' && this.originalStyleMap.marginBottom === 'auto');
    }

    get floating() {
        const float = this.css('cssFloat');
        return (this.position !== 'absolute' ? (float === 'left' || float === 'right') : false);
    }

    get float() {
        return (this.floating ? this.css('cssFloat') : null) || 'none';
    }

    get relativeWrap() {
        return (this.plainText || this.inlineText) && !this.floating && this.siblingflow && this.alignMargin;
    }

    get overflow() {
        let value = OVERFLOW_ELEMENT.NONE;
        if (this.hasElement) {
            const [overflow, overflowX, overflowY] = [this.css('overflow'), this.css('overflowX'), this.css('overflowY')];
            if (this.toInt('width') > 0 && (overflow === 'scroll' || overflowX === 'scroll' || (overflowX === 'auto' && this.element.clientWidth !== this.element.scrollWidth))) {
                value |= OVERFLOW_ELEMENT.HORIZONTAL;
            }
            if (this.toInt('height') > 0 && (overflow === 'scroll' || overflowY === 'scroll' || (overflowY === 'auto' && this.element.clientHeight !== this.element.scrollHeight))) {
                value |= OVERFLOW_ELEMENT.VERTICAL;
            }
        }
        return value;
    }
    get overflowX() {
        return this.hasBit('overflow', OVERFLOW_ELEMENT.HORIZONTAL);
    }
    get overflowY() {
        return this.hasBit('overflow', OVERFLOW_ELEMENT.VERTICAL);
    }

    get baseline() {
        return (this.css('verticalAlign') === 'baseline');
    }

    set multiLine(value) {
        this._multiLine = value;
    }
    get multiLine() {
        if (this._multiLine == null) {
            this.setMultiLine();
        }
        return this._multiLine;
    }

    get dir() {
        switch (this.css('direction')) {
            case 'unset':
            case 'inherit':
                let parent = this.documentParent;
                do {
                    const dir = parent.dir;
                    if (dir !== '') {
                        return dir;
                    }
                    parent = parent.documentParent;
                }
                while (parent.id !== 0);
                return '';
            case 'rtl':
                return 'rtl';
            default:
                return 'ltr';
        }
    }

    get previousSibling() {
        let element: Null<Element> = null;
        if (this._element != null)  {
            element = <Element> this.element.previousSibling;
        }
        else if (this.children.length > 0) {
            element = <Element> sortAsc(this.children.slice(), 'siblingIndex')[0].previousSibling;
        }
        while (element != null) {
            const node = getNodeFromElement(element);
            if (node && node.siblingflow) {
                return node;
            }
            element = <Element> element.previousSibling;
        }
        return null;
    }
    get nextSibling() {
        let element: Null<Element> = null;
        if (this._element != null)  {
            element = <Element> this.element.nextSibling;
        }
        else if (this.children.length > 0) {
            element = <Element> sortDesc(this.children.slice(), 'siblingIndex')[0].nextSibling;
        }
        while (element != null) {
            const node = getNodeFromElement(element);
            if (node && node.siblingflow) {
                return node;
            }
            element = <Element> element.nextSibling;
        }
        return null;
    }

    get previousElementSibling() {
        if (this._element != null)  {
            let element: Null<Element> = <Element> this.element.previousSibling;
            while (element != null) {
                if (isPlainText(element) || element instanceof HTMLElement || element.tagName === 'BR') {
                    return element;
                }
                element = <Element> element.previousSibling;
            }
        }
        return null;
    }
    get nextElementSibling() {
        if (this._element != null)  {
            let element: Null<Element> = <Element> this.element.nextSibling;
            while (element != null) {
                if (isPlainText(element) || element instanceof HTMLElement || element.tagName === 'BR') {
                    return element;
                }
                element = <Element> element.nextSibling;
            }
        }
        return null;
    }

    get singleChild() {
        return (this.rendered ? (this.renderParent.renderChildren.length === 1) : (this.parent.children.length === 1));
    }

    get firstElementChild(): Null<Element> {
        if (this.hasElement) {
            for (let i = 0; i < this.element.childNodes.length; i++) {
                const element = <Element> this.element.childNodes[i];
                if (element.nodeName.charAt(0) === '#') {
                    if (isPlainText(element)) {
                        return element;
                    }
                }
                else {
                    return element;
                }
            }
        }
        return null;
    }

    get lastElementChild(): Null<Element> {
        if (this.hasElement) {
            for (let i = this.element.childNodes.length - 1; i >= 0; i--) {
                const element = <Element> this.element.childNodes[i];
                if (element.nodeName.charAt(0) === '#') {
                    if (isPlainText(element)) {
                        return element;
                    }
                }
                else {
                    return element;
                }
            }
        }
        return null;
    }

    get center(): Point {
        return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2)};
    }
}