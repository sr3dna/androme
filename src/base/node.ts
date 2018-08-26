import { BoxModel, ClientRect, Flexbox, Null, ObjectMap, Point, StringMap } from '../lib/types';
import { IExtension } from '../extension/lib/types';
import { convertCamelCase, convertInt, hasValue, includesEnum, isPercent, search } from '../lib/util';
import { assignBounds, getCache, getNode, getRangeBounds, hasFreeFormText, hasLineBreak, setCache } from '../lib/dom';
import { INLINE_ELEMENT, NODE_PROCEDURE, NODE_RESOURCE, OVERFLOW_ELEMENT, NODE_ALIGNMENT } from '../lib/constants';

type T = Node;

export default abstract class Node implements BoxModel {
    public style: CSSStyleDeclaration;
    public styleMap: StringMap = {};
    public originalStyleMap: StringMap = {};
    public nodeId: string;
    public nodeType = 0;
    public depth = -1;
    public renderDepth = 0;
    public siblingIndex = Number.MAX_VALUE;
    public bounds: ClientRect;
    public linear: ClientRect;
    public box: ClientRect;
    public renderExtension?: IExtension;
    public excludeProcedure = NODE_PROCEDURE.NONE;
    public excludeResource = NODE_RESOURCE.NONE;
    public documentRoot = false;
    public companion: T;
    public visible = true;
    public rendered = false;
    public isolated = false;
    public relocated = false;
    public alignmentType = NODE_ALIGNMENT.NONE;

    public abstract constraint: ObjectMap<any>;
    public abstract children: T[];
    public abstract renderChildren: T[];

    protected _namespaces = new Set<string>();
    protected _nodeName: string;
    protected _renderParent: T;
    protected _documentParent: T;

    private _element: HTMLElement;
    private _parent: T;
    private _tagName: string;
    private _data: ObjectMap<any> = {};
    private _multiLine: boolean;

    constructor(
        public id: number,
        element?: HTMLElement)
    {
        if (element != null) {
            if (element instanceof HTMLElement) {
                const styleMap = getCache(element, 'styleMap') || {};
                for (const inline of Array.from(element.style)) {
                    styleMap[convertCamelCase(inline)] = (<any> element.style)[inline];
                }
                this.style = (<CSSStyleDeclaration> getCache(element, 'style')) || getComputedStyle(element);
                this.styleMap = styleMap;
                this.originalStyleMap = Object.assign({}, styleMap);
            }
            setCache(element, 'node', this);
            this._element = element;
        }
    }

    public abstract setNodeId(viewName: string): void;
    public abstract setLayout(width?: number, height?: number): void;
    public abstract setAlignment(): void;
    public abstract setAccessibility(): void;
    public abstract applyCustomizations(overwrite: boolean): void;
    public abstract applyOptimizations(options: ObjectMap<any>): void;
    public abstract modifyBox(area: number, offset: number, bounds?: boolean): void;
    public abstract boxValue(area: number): string[];
    public abstract clone(): T;

    public abstract set documentParent(value: T);
    public abstract get documentParent(): T;
    public abstract set renderParent(value: T);
    public abstract get renderParent(): T;
    public abstract get linearHorizontal(): boolean;
    public abstract get linearVertical(): boolean;

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
                if (this.alignmentType === value) {
                    return true;
                }
            }
        }
        return false;
    }

    public add(obj: string, attr: string, value = '', overwrite = true) {
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
                    this.add(obj, attr, attrs[attr]);
                }
                delete options[obj];
            }
        }
    }

    public each(predicate: (value: T, index?: number) => void, rendered = false) {
        (rendered ? this.renderChildren : this.children).forEach(predicate);
        return this;
    }

    public render(parent: T) {
        this.renderParent = parent;
        this.renderDepth = (parent === this || this.documentRoot || parent.isSet('dataset', 'target') ? 0 : parent.renderDepth + 1);
        this.rendered = true;
    }

    public hide() {
        this.rendered = true;
        this.visible = false;
    }

    public data(attr: string, value?: any, overwrite = true) {
        if (hasValue(value) && (overwrite || this._data[attr] == null)) {
            this._data[attr] = value;
        }
        return this._data[attr];
    }

    public ascend() {
        const result: T[] = [];
        let current = this.parent;
        while (current != null) {
            if (current.id !== 0) {
                result.push(current);
                current = current.parent;
            }
            else {
                break;
            }
        }
        return result;
    }

    public cascade() {
        function cascade(node: T) {
            const current = [...node.children];
            node.each(item => current.push(...cascade(item)));
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
                    for (const attr in this._data) {
                        const data = this._data[attr];
                        if (typeof data === 'object' && data.inherit === true) {
                            const inherit = node.data(attr);
                            if (inherit) {
                                switch (typeof node[attr]) {
                                    case 'number':
                                        inherit[attr] += data[attr];
                                        break;
                                    case 'boolean':
                                        if (data[attr] !== false) {
                                            inherit[attr] = true;
                                        }
                                        break;
                                    default:
                                        inherit[attr] = data[attr];
                                        break;
                                }
                            }
                            else {
                                node.data(attr, data);
                            }
                            delete this._data[attr];
                        }
                    }
                    break;
                case 'style':
                    const style = {
                        whiteSpace: node.style.whiteSpace
                    };
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

    public inheritCss(attr: string) {
        let result = '';
        let parent = this.documentParent;
        do {
            result = parent.styleMap[attr];
            if (parent.id === 0 || result) {
                break;
            }
            parent = parent.documentParent;
        }
        while (true);
        return result;
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

    public setExcludeProcedure(exclude?: string) {
        if (exclude == null && this.hasElement) {
            exclude = this.dataset.excludeProcedure || '';
            if (this.element.parentElement != null) {
                exclude += '|' + (this.element.parentElement.dataset.excludeProcedureChild || '');
            }
        }
        if (exclude != null) {
            exclude.split('|').map(value => value.toUpperCase().trim()).forEach(value => {
                if (value !== '' && NODE_PROCEDURE[value] != null) {
                    this.excludeProcedure |= NODE_PROCEDURE[value];
                }
            });
        }
    }

    public setExcludeResource(exclude?: string) {
        if (exclude == null) {
            exclude = this.dataset.excludeResource;
            if (this.element.parentElement != null) {
                exclude += '|' + (this.element.parentElement.dataset.excludeResourceChild || '');
            }
        }
        if (this.hasElement && exclude != null) {
            exclude.split('|').map(value => value.toUpperCase().trim()).forEach(value => {
                if (value !== '' && NODE_RESOURCE[value] != null) {
                    this.excludeResource |= NODE_RESOURCE[value];
                }
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
                const [rangeBounds, multiLine] = getRangeBounds(this.element);
                bounds = rangeBounds;
                this.multiLine = multiLine;
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

    public isSet(obj: string, attr: string) {
        return (this[obj] && this[obj][attr] != null ? hasValue(this[obj][attr]) : false);
    }

    public setBoundsMin() {
        if (this._element !== document.body) {
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

    public remove(node: T) {
        this.children = this.children.filter(child => child !== node);
    }

    public append(node: T) {
        if (this.renderChildren.indexOf(node) === -1) {
            this.renderChildren.push(node);
        }
    }

    private boxDimension(area: string, side: string) {
        const attr = area + side;
        if (this.hasElement) {
            let node: T = this;
            const horizontal = (side === 'Left' || side === 'Right');
            if (horizontal) {
                if (this.companion != null) {
                    let valid = false;
                    const direction = side.toLowerCase();
                    switch (side) {
                        case 'Left':
                            valid = (this.companion.linear[direction] < this.linear[direction]);
                            break;
                        case 'Right':
                            valid = (this.companion.linear[direction] > this.linear[direction]);
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

    set tagName(value) {
        this._tagName = value;
    }
    get tagName() {
        return this._tagName || (this.hasElement ? (this.element.tagName === 'INPUT' ? (<HTMLInputElement> this.element).type.toUpperCase() : this.element.tagName) : '');
    }

    set nodeName(value) {
        this._nodeName = value;
    }
    get nodeName() {
        return this._nodeName;
    }

    set element(value) {
        this._element = value;
    }
    get element() {
        return this._element || {};
    }

    get hasElement() {
        return (this._element instanceof HTMLElement);
    }

    get documentBody() {
        return (this.element === document.body);
    }

    get dataset(): DOMStringMap {
        return (this.hasElement ? this.element.dataset : {});
    }

    get extension() {
        return (hasValue(this.dataset.ext) ? (this.dataset.ext as string).split(',')[0].trim() : '');
    }

    get flex(): Flexbox {
        const parent = this.documentParent;
        const style = this.style;
        if (style != null && parent !== this) {
            return {
                enabled: ((style.display as string).indexOf('flex') !== -1),
                direction: <string> style.flexDirection,
                basis: <string> style.flexBasis,
                grow: convertInt(style.flexGrow),
                shrink: convertInt(style.flexShrink),
                wrap: <string> style.flexWrap,
                alignSelf: <string> (parent.isSet('styleMap', 'alignItems') && (this.styleMap.alignSelf == null || style.alignSelf === 'auto') ? parent.styleMap.alignItems : style.alignSelf),
                justifyContent: <string> style.justifyContent,
                order: convertInt(style.order)
            };
        }
        return (<Flexbox> { enabled: false });
    }

    get viewWidth() {
        return (isPercent(this.styleMap.width) ? 0 : convertInt(this.styleMap.width) || convertInt(this.styleMap.minWidth));
    }
    get viewHeight() {
        return (isPercent(this.styleMap.height) ? 0 : convertInt(this.styleMap.height) || convertInt(this.styleMap.minHeight));
    }
    get lineHeight() {
        if (this.children.length === 0 && !this.renderParent.linearHorizontal) {
            const lineHeight = convertInt(this.styleMap.lineHeight);
            if (this.inlineElement) {
                return lineHeight || convertInt(this.documentParent.styleMap.lineHeight);
            }
            else {
                return lineHeight;
            }
        }
        return 0;
    }

    get parentElementNode() {
        let parent = getNode(this.element.parentElement);
        if (parent) {
            if (!this.pageflow) {
                let found = false;
                let previous: Null<T> = null;
                while (parent && parent.id !== 0) {
                    if (this.position === 'absolute') {
                        if (!['static', 'initial'].includes(parent.position)) {
                            found = true;
                            break;
                        }
                    }
                    else {
                        if ((this.withinX(parent.box) && this.withinY(parent.box)) || (previous && ((this.linear.top >= parent.linear.top && this.linear.top < previous.linear.top) || (this.linear.right <= parent.linear.right && this.linear.right > previous.linear.right) || (this.linear.bottom <= parent.linear.bottom && this.linear.bottom > previous.linear.bottom) || (this.linear.left >= parent.linear.left && this.linear.left < previous.linear.left)))) {
                            found = true;
                            break;
                        }
                    }
                    previous = parent as T;
                    parent = getNode(parent.element.parentElement) as T;
                }
                if (!found)  {
                    parent = null;
                }
            }
            else {
                if (parent === this.companion) {
                    const container = getNode(parent.element.parentElement);
                    if (container) {
                        parent = container;
                    }
                }
            }
        }
        return parent;
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
        if (this.inline) {
            return 0;
        }
        return this.boxDimension('margin', 'Top');
    }
    get marginRight() {
        return this.boxDimension('margin', 'Right');
    }
    get marginBottom() {
        if (this.inline) {
            return 0;
        }
        return this.boxDimension('margin', 'Bottom');
    }
    get marginLeft() {
        return this.boxDimension('margin', 'Left');
    }

    get borderTopWidth() {
        return convertInt(this.css('borderTopWidth'));
    }
    get borderRightWidth() {
        return convertInt(this.css('borderRightWidth'));
    }
    get borderBottomWidth() {
        return convertInt(this.css('borderBottomWidth'));
    }
    get borderLeftWidth() {
        return convertInt(this.css('borderLeftWidth'));
    }

    get paddingTop() {
        return this.boxDimension('padding', 'Top');
    }
    get paddingRight() {
        return this.boxDimension('padding', 'Right');
    }
    get paddingBottom() {
        return this.boxDimension('padding', 'Bottom');
    }
    get paddingLeft() {
        return this.boxDimension('padding', 'Left');
    }

    get pageflow() {
        const position = this.position;
        return (position === 'static' || position === 'initial' || position === 'relative' || this.plainText || this.alignMargin);
    }

    get inline() {
        return (this.display === 'inline' || (this.display === 'initial' && INLINE_ELEMENT.includes(this.element.tagName)));
    }

    get inlineElement() {
        const position = this.position;
        const display = this.display;
        return (this.inline || display.indexOf('inline') !== -1 || display === 'table-cell' || this.floating || ((position === 'absolute' || position === 'fixed') && this.alignMargin));
    }

    get inlineText() {
        return (this.hasElement && !['SELECT', 'IMG'].includes(this.element.tagName) && this.children.length === 0 && (hasFreeFormText(this.element) || Array.from(this.element.children).every((item: HTMLElement) => getCache(item, 'supportInline'))));
    }

    get plainText() {
        return (this.tagName === 'PLAINTEXT');
    }

    get alignMargin() {
        return (this.top == null && this.right == null && this.bottom == null && this.left == null);
    }

    get autoMargin() {
        return (this.styleMap.marginLeft === 'auto' || this.styleMap.marginRight === 'auto');
    }

    get centerMargin() {
        return (this.styleMap.marginLeft === 'auto' && this.styleMap.marginRight === 'auto');
    }

    get floating() {
        const float = this.css('cssFloat');
        return (this.position !== 'absolute' ? (float === 'left' || float === 'right') : false);
    }

    get float() {
        return (this.floating ? this.css('cssFloat') : null) || 'none';
    }

    get overflow() {
        let value = OVERFLOW_ELEMENT.NONE;
        if (this.hasElement) {
            const [overflow, overflowX, overflowY] = [this.css('overflow'), this.css('overflowX'), this.css('overflowY')];
            if (convertInt(this.styleMap.width) > 0 && (overflow === 'scroll' || overflowX === 'scroll' || (overflowX === 'auto' && this.element.clientWidth !== this.element.scrollWidth))) {
                value |= OVERFLOW_ELEMENT.HORIZONTAL;
            }
            if (convertInt(this.styleMap.height) > 0 && (overflow === 'scroll' || overflowY === 'scroll' || (overflowY === 'auto' && this.element.clientHeight !== this.element.scrollHeight))) {
                value |= OVERFLOW_ELEMENT.VERTICAL;
            }
        }
        return value;
    }
    get overflowX() {
        return includesEnum(this.overflow, OVERFLOW_ELEMENT.HORIZONTAL);
    }
    get overflowY() {
        return includesEnum(this.overflow, OVERFLOW_ELEMENT.VERTICAL);
    }

    get baseline() {
        return (this.css('verticalAlign') === 'baseline');
    }

    set multiLine(value) {
        this._multiLine = value;
    }
    get multiLine() {
        if (this._multiLine == null) {
            if (this.inlineElement && this.inlineText && !this.floating && this.viewWidth === 0) {
                this._multiLine = hasLineBreak(this.element);
            }
            else {
                this._multiLine = false;
            }
        }
        return this._multiLine;
    }

    get inlineWrap() {
        return (this.alignmentType === NODE_ALIGNMENT.INLINE_WRAP);
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
        let element = this.element.previousSibling;
        while (element != null) {
            const node = getNode(<Element> element);
            if (node) {
                return node;
            }
            element = element.previousSibling;
        }
        return null;
    }
    get nextSibling() {
        let element = this.element.nextSibling;
        while (element != null) {
            const node = getNode(<Element> element);
            if (node) {
                return node;
            }
            element = element.nextSibling;
        }
        return null;
    }

    get firstChild(): Null<T> {
        let result: any = null;
        if (this.hasElement) {
            Array.from(this.element.childNodes).some((element: HTMLElement) => {
                result = getNode(element);
                return (result != null);
            });
        }
        return result;
    }

    get center(): Point {
        return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2)};
    }
}