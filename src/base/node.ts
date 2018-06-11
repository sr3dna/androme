import { IClientRect, IBoxModel, IPoint } from '../lib/types';
import { OVERFLOW_CHROME } from '../lib/constants';
import { convertInt, formatPX, hasValue, hyphenToCamelCase, search } from '../lib/util';
import { getRangeBounds } from '../lib/dom';

export default abstract class Node implements IBoxModel {
    public depth: number = -1;
    public style: any = {};
    public styleMap: any = {};
    public visible: boolean = true;
    public parentIndex: number = Number.MAX_VALUE;
    public bounds: IClientRect;
    public linear: IClientRect;
    public box: IClientRect;
    public renderDepth: number;

    public abstract children: Node[];
    public abstract renderChildren: Node[];

    public gridRowSpan: number;
    public gridColumnSpan: number;
    public gridColumnCount: number;
    public gridFirst: boolean;
    public gridLast: boolean;
    public gridRowEnd: boolean;
    public gridRowStart: boolean;
    public gridSiblings: Node[];

    private _flex: any;
    private _namespaces = new Set<string>();
    private _overflow: OVERFLOW_CHROME;
    private _parent: Node;
    private _parentOriginal: Node;
    private _renderParent: any;
    private _tagName: string;

    constructor(
        public id: number,
        public element?: HTMLElement,
        options?: {})
    {
        Object.assign(this, options);
        if (element != null || (options != null && (<any> options).element != null)) {
            const style = getComputedStyle(this.element);
            const styleMap = (<any> this.element).__styleMap || {};
            for (const inline of <any> this.element.style) {
                styleMap[hyphenToCamelCase(inline)] = this.element.style[inline];
            }
            this.style = style;
            this.styleMap = styleMap;
            (<any> this.element).__node = this;
        }
    }

    public add(obj: string, attr: string, value = '', overwrite = true) {
        const name = `_${obj || '_'}`;
        if (hasValue(value)) {
            if (this[name] == null) {
                this._namespaces.add(obj);
                this[name] = {};
            }
            if (!overwrite && this[name][attr] != null) {
                return null;
            }
            this[name][attr] = value;
        }
        return this[name] && this[name][attr];
    }
    public delete(obj: string, ...attributes: any[]) {
        const name = `_${obj || '_'}`;
        if (this[name] != null) {
            if (typeof attributes[0] === 'object') {
                for (const key in attributes[0]) {
                    delete this[name][attributes[0][key]];
                }
            }
            else {
                for (const attr of attributes) {
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
        return this;
    }
    public apply(options: {}) {
        for (const namespace in options) {
            const obj = options[namespace];
            for (const attr in obj) {
                this.add(namespace, attr, obj[attr]);
            }
        }
        return this;
    }
    public render(parent: Node) {
        this.renderParent = parent;
        this.renderDepth = (parent.id === 0 ? 0 : parent.renderDepth + 1);
        return this;
    }
    public hide() {
        this.renderParent = true;
        this.visible = false;
        return this;
    }
    public ascend() {
        const result = [];
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
        function cascade(node: Node) {
            const current = [...node.children];
            node.children.forEach((item: Node) => current.push(...cascade(item)));
            return current;
        }
        return cascade(this);
    }
    public intersect(rect: IClientRect, dimension = 'bounds') {
        const top = (rect.top >= this[dimension].top && rect.top < this[dimension].bottom);
        const bottom = (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom);
        const left = (rect.left >= this[dimension].left && rect.left < this[dimension].right);
        const right = (rect.right > this[dimension].left && rect.right <= this[dimension].right);
        return (top && (left || right)) || (bottom && (left || right));
    }
    public withinX(rect: IClientRect, dimension = 'linear') {
        return (
            (rect.top >= this[dimension].top && rect.top < this[dimension].bottom) ||
            (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom) ||
            (this[dimension].top >= rect.top && this[dimension].bottom <= rect.bottom) ||
            (rect.top >= this[dimension].top && rect.bottom <= this[dimension].bottom)
        );
    }
    public withinY(rect: IClientRect, dimension = 'linear') {
        return (
            (rect.left >= this[dimension].left && rect.left < this[dimension].right) ||
            (rect.right > this[dimension].left && rect.right <= this[dimension].right) ||
            (this[dimension].left >= rect.left && this[dimension].right <= rect.right) ||
            (rect.left >= this[dimension].left && rect.right <= this[dimension].right)
        );
    }
    public css(attr: string, value = '') {
        if (arguments.length === 2) {
            this.styleMap[attr] = (hasValue(value) ? value : null);
            return this;
        }
        else {
            return this.styleMap[attr] || this.style[attr];
        }
    }

    public setBounds(calibrate: boolean = false, element: HTMLElement = null) {
        if (!calibrate) {
            this.bounds = (element != null ?  getRangeBounds(element) : JSON.parse(JSON.stringify(this.element.getBoundingClientRect())));
        }
        this.linear = {
            top: this.bounds.top - this.marginTop,
            right: this.bounds.right + this.marginRight,
            bottom: this.bounds.bottom + this.marginBottom,
            left: this.bounds.left - this.marginLeft,
            width: 0,
            height: 0
        };
        this.box = {
            top: this.bounds.top + (this.paddingTop + this.borderTopWidth),
            right: this.bounds.right - (this.paddingRight + this.borderRightWidth),
            bottom: this.bounds.bottom - (this.paddingBottom + this.borderBottomWidth),
            left: this.bounds.left + (this.paddingLeft + this.borderLeftWidth),
            width: 0,
            height: 0
        };
        this.setDimensions();
    }
    public expandDimensions() {
        let [width, height] = [Math.max.apply(null, this.children.map((item: Node) => item.linear.right)), Math.max.apply(null, this.children.map((item: Node) => item.linear.bottom))];
        switch (this.style.position) {
            case 'static':
            case 'relative':
                width -= this.linear.left;
                height -= this.linear.top;
                break;
        }
        width += this.paddingRight + this.borderRightWidth;
        height += this.paddingBottom + this.borderBottomWidth;
        let calibrate = false;
        if (this.viewWidth < width) {
            if (this.bounds.width < width) {
                this.bounds.width = width;
                this.bounds.right = this.bounds.left + this.bounds.width;
                calibrate = true;
            }
            else {
                width = this.bounds.width;
            }
            this.bounds.minWidth = formatPX(width);
        }
        if (this.viewHeight < height) {
            if (this.bounds.height < height) {
                this.bounds.height = height;
                this.bounds.bottom = this.bounds.top + this.bounds.height;
                calibrate = true;
            }
            else {
                height = this.bounds.height;
            }
            this.bounds.minHeight = formatPX(height);
        }
        if (calibrate) {
            this.setBounds(true);
        }
    }
    public is(...views: string[]) {
        for (const name of views) {
            if (this.nodeName === name) {
                return true;
            }
        }
        return false;
    }

    protected setDimensions() {
        const linear = this.linear;
        linear.width = linear.right - linear.left;
        linear.height = linear.bottom - linear.top;
        const box = this.box;
        box.width = box.right - box.left;
        box.height = box.bottom - box.top;
    }

    set parent(value) {
        if (value === this._parent) {
            return;
        }
        if (this._parent && this._parentOriginal == null) {
            this._parentOriginal = this._parent;
        }
        this._parent = value;
        if (this.depth === -1) {
            this.depth = value.depth + 1;
        }
    }
    get parent() {
        return this._parent;
    }
    set parentOriginal(value) {
        this._parentOriginal = value;
    }
    get parentOriginal() {
        return this._parentOriginal || this._parent;
    }
    get parentElement() {
        return this.element.parentNode;
    }
    set renderParent(value: any) {
        if (value instanceof Node) {
            value.renderChildren.push(this);
        }
        this._renderParent = value;
    }
    get renderParent() {
        return this._renderParent;
    }
    get namespaces() {
        return Array.from(this._namespaces);
    }
    get tagName() {
        return (this.element != null ? this.element.tagName : '');
    }
    get nodeName() {
        return this.tagName;
    }
    get flex() {
        if (this._flex == null) {
            const parent = this.element && (<any> this.element.parentNode).__node;
            this._flex = {
                parent,
                enabled: (this.style.display && this.style.display.indexOf('flex') !== -1),
                direction: this.style.flexDirection,
                basis: this.style.flexBasis,
                grow: convertInt(this.style.flexGrow),
                shrink: convertInt(this.style.flexShrink),
                wrap: this.style.flexWrap,
                alignSelf: (parent && parent.styleMap.alignItems != null && (this.styleMap.alignSelf == null || this.style.alignSelf === 'auto') ? parent.styleMap.alignItems : this.style.alignSelf),
                justifyContent: this.style.justifyContent,
                order: convertInt(this.style.order)
            };
        }
        return this._flex;
    }
    get floating() {
        return (this.styleMap.float === 'left' || this.styleMap.float === 'right');
    }
    get fixed() {
        return (this.style.display === 'fixed');
    }
    get overflow() {
        if (this._overflow == null) {
            let value = OVERFLOW_CHROME.NONE;
            if (this.style.overflow === 'scroll' || (this.style.overflowX === 'auto' && this.element.clientWidth !== this.element.scrollWidth)) {
                value |= OVERFLOW_CHROME.HORIZONTAL;
            }
            if (this.style.overflow === 'scroll' || (this.style.overflowY === 'auto' && this.element.clientHeight !== this.element.scrollHeight)) {
                value |= OVERFLOW_CHROME.VERTICAL;
            }
            this._overflow = value;
        }
        return this._overflow;
    }
    get overflowX() {
        return ((this._overflow & OVERFLOW_CHROME.HORIZONTAL) === OVERFLOW_CHROME.HORIZONTAL);
    }
    get overflowY() {
        return ((this._overflow & OVERFLOW_CHROME.VERTICAL) === OVERFLOW_CHROME.VERTICAL);
    }
    get viewWidth() {
        return convertInt(this.styleMap.width || this.styleMap.minWidth);
    }
    get viewHeight() {
        return convertInt(this.styleMap.height || this.styleMap.lineHeight || this.styleMap.minHeight);
    }
    get marginTop() {
        return convertInt(this.css('marginTop'));
    }
    get marginBottom() {
        return convertInt(this.css('marginBottom'));
    }
    get marginLeft() {
        return convertInt(this.css('marginLeft'));
    }
    get marginRight() {
        return convertInt(this.css('marginRight'));
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
        return convertInt(this.css('paddingTop'));
    }
    get paddingBottom() {
        return convertInt(this.css('paddingBottom'));
    }
    get paddingLeft() {
        return convertInt(this.css('paddingLeft'));
    }
    get paddingRight() {
        return convertInt(this.css('paddingRight'));
    }
    get center(): IPoint {
        return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2)};
    }
}