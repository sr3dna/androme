import { IClientRect, IBoxModel } from '../lib/types';
import { convertInt, formatPX, hasValue, hyphenToCamelCase, search } from '../lib/util';
import { getRangeBounds } from '../lib/element';

export default abstract class Node implements IBoxModel {
    public static is(object: any) {
        return (object instanceof Node);
    }

    public depth: number;
    public style: any;
    public styleMap: any;
    public visible: boolean;
    public parentIndex: number;
    public bounds: IClientRect;
    public linear: IClientRect;
    public box: IClientRect;
    public renderDepth: number;

    public children: Node[];
    public renderChildren: Node[];

    public gridFirst: boolean;
    public gridLast: boolean;
    public gridRowEnd: boolean;
    public gridRowStart: boolean;
    public gridSiblings: Node[];

    private _flex: any;
    private _namespaces: Set<string>;
    private _overflow: number;
    private _parent: Node;
    private _parentOriginal: Node;
    private _renderParent: any;
    private _tagName: string;

    constructor(public id: number, public element: any = null, public api = 0, options = {}) {
        let style = {};
        let styleMap = {};
        if (element != null) {
            style = getComputedStyle(element);
            styleMap = element.styleMap || {};
            for (const inline of element.style) {
                styleMap[hyphenToCamelCase(inline)] = element.style[inline];
            }
        }
        else {
            element = {};
        }
        this.id = id;
        this.element = element;
        this.api = api;
        this.depth = 0;
        this.style = style;
        this.styleMap = styleMap;
        this.visible = true;
        this.parentIndex = Number.MAX_VALUE;

        this._tagName = null;
        this._parent = null;
        this._parentOriginal = null;
        this._flex = null;
        this._overflow = null;
        this._namespaces = new Set();

        Object.assign(this, options);
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
        return (this[name] != null ? this[name][attr] : null);
    }
    public delete(obj: string, ...attributes: any[]) {
        const name = `_${obj || '_'}`;
        if (this[name] != null) {
            if (typeof attributes[0] == 'object') {
                for (const key in attributes[0]) {
                    delete this[name][attributes[0][key]];
                }
            }
            else {
                for (const attr of attributes) {
                    if (attr.indexOf('*') != -1) {
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
    public render(parent: Node): Node {
        this.renderParent = parent;
        this.renderDepth = (parent.id == 0 ? 0 : parent.renderDepth + 1);
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
            if (current.id != 0) {
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
        if (arguments.length == 2) {
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
            left: this.bounds.left - this.marginLeft
        };
        this.box = {
            top: this.bounds.top + (this.paddingTop + this.borderTopWidth),
            right: this.bounds.right - (this.paddingRight + this.borderRightWidth),
            bottom: this.bounds.bottom - (this.paddingBottom + this.borderBottomWidth),
            left: this.bounds.left + (this.paddingLeft + this.borderLeftWidth)
        };
        this.setDimensions();
    }
    public setDimensions() {
        const linear = this.linear;
        linear.width = linear.right - linear.left;
        linear.height = linear.bottom - linear.top;
        const box = this.box;
        box.width = box.right - box.left;
        box.height = box.bottom - box.top;
    }
    public expandDimensions() {
        let [width, height] = [this.children.reduce((a: number, b: Node) => Math.max(a, b.linear.right), 0), this.children.reduce((a: number, b: Node) => Math.max(a, b.linear.bottom), 0)];
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

    set parent(value) {
        if (!Node.is(value) || value == this._parent) {
            return;
        }
        if (this._parent != null && this._parentOriginal == null) {
            this._parentOriginal = this._parent;
        }
        this._parent = value;
        if (this.depth == 0) {
            this.depth = value.depth + 1;
        }
    }
    get parent() {
        return this._parent;
    }
    set parentOriginal(value) {
        if (Node.is(value)) {
            this._parentOriginal = value;
        }
    }
    get parentOriginal() {
        return this._parentOriginal || this._parent;
    }
    get parentElement() {
        return this.element.parentNode;
    }
    set renderParent(value: any) {
        if (Node.is(value) && value.visible && value.renderChildren != null) {
            value.renderChildren.push(this);
        }
        this._renderParent = value;
    }
    get renderParent() {
        return this._renderParent;
    }
    get childrenBox() {
        let minLeft = Number.MAX_VALUE;
        let maxRight = Number.MIN_VALUE;
        let minTop = Number.MAX_VALUE;
        let maxBottom = Number.MIN_VALUE;
        for (const node of this.children) {
            minLeft = Math.min(node.bounds.left, minLeft);
            maxRight = Math.max(node.bounds.right, maxRight);
            minTop = Math.min(node.bounds.top, minTop);
            maxBottom = Math.max(node.bounds.bottom, maxBottom);
        }
        return [maxRight - minLeft, maxBottom - minTop];
    }
    get namespaces() {
        return Array.from(this._namespaces);
    }
    set tagName(value) {
        this._tagName = value;
    }
    get tagName() {
        return (this._tagName != null ? this._tagName : this.element.tagName);
    }
    get flex() {
        if (this._flex == null) {
            const parent = (this.parentElement != null ? this.parentElement.__node : null);
            this._flex = {
                parent,
                enabled: (this.style.display != null && this.style.display.indexOf('flex') != -1),
                direction: this.style.flexDirection,
                basis: this.style.flexBasis,
                grow: convertInt(this.style.flexGrow),
                shrink: convertInt(this.style.flexShrink),
                wrap: this.style.flexWrap,
                alignSelf: (parent != null && parent.styleMap.alignItems != null && (this.styleMap.alignSelf == null || this.style.alignSelf == 'auto') ? parent.styleMap.alignItems : this.style.alignSelf),
                justifyContent: this.style.justifyContent
            };
        }
        return this._flex;
    }
    get floating() {
        return (this.styleMap.float == 'left' || this.styleMap.float == 'right');
    }
    get fixed() {
        return (this.style.display == 'fixed');
    }
    get overflow() {
        if (this._overflow == null) {
            let value = 0;
            if (this.style.overflow == 'scroll' || (this.style.overflowX == 'auto' && this.element.clientWidth != this.element.scrollWidth)) {
                value |= 2;
            }
            if (this.style.overflow == 'scroll' || (this.style.overflowY == 'auto' && this.element.clientHeight != this.element.scrollHeight)) {
                value |= 4;
            }
            this._overflow = value;
        }
        return this._overflow;
    }
    get overflowX() {
        return ((this._overflow & 2) == 2);
    }
    get overflowY() {
        return ((this._overflow & 4) == 4);
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
    get center() {
        return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2)};
    }
}