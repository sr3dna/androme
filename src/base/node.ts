import { BoxModel, BoxRect, ClientRect, Point, StringMap } from '../lib/types';
import { convertInt, formatPX, hasValue, hyphenToCamelCase, search } from '../lib/util';
import { assignBounds, getRangeBounds } from '../lib/dom';
import { OVERFLOW_CHROME } from '../lib/constants';

type T = Node;

export default abstract class Node implements BoxModel {
    public depth: number = -1;
    public style: CSSStyleDeclaration;
    public styleMap: StringMap = {};
    public visible: boolean = true;
    public companion: boolean = false;
    public parentIndex: number = Number.MAX_VALUE;
    public bounds: ClientRect;
    public linear: ClientRect;
    public box: ClientRect;
    public renderDepth: number;
    public viewId: string;
    public renderExtension: any;
    public ignoreResource: number = 0;

    public gridRowSpan: number = 0;
    public gridColumnSpan: number = 0;
    public gridColumnEnd: number[];
    public gridIndex: number;
    public gridFirst: boolean;
    public gridLast: boolean;
    public gridRowEnd: boolean;
    public gridRowStart: boolean;
    public gridSiblings: T[];
    public gridColumnCount: number;
    public gridPadding: BoxRect = { top: 0, right: [], bottom: 0, left: [] };

    public abstract children: T[];
    public abstract renderChildren: T[];

    protected _viewName: string;

    private _element: HTMLElement;
    private _flex: any;
    private _namespaces = new Set<string>();
    private _overflow: OVERFLOW_CHROME;
    private _parent: T;
    private _parentOriginal: T;
    private _renderParent: T | boolean;
    private _tagName: string;
    private _options: {} = {};

    constructor(
        public id: number,
        element?: HTMLElement | null,
        options?: {})
    {
        Object.assign(this, options);
        if (element != null) {
            const object: any = element;
            if (element instanceof HTMLElement) {
                const styleMap = object.__styleMap || {};
                for (const inline of Array.from(element.style)) {
                    styleMap[hyphenToCamelCase(inline)] = element.style[inline];
                }
                this.style = object.__style || getComputedStyle(element);
                this.styleMap = styleMap;
            }
            this._element = element;
            object.__node = this;
        }
    }

    public abstract is(...views: number[]): boolean;
    public abstract setViewId(viewName: string): void;
    public abstract setViewLayout(options?: any): void;
    public abstract applyCustomizations(): void;
    public abstract modifyBox(area: number, offset: number): void;

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

    public get(obj: string, attr: string): string {
        const name = `_${obj || '_'}`;
        return (this[name] && this[name][attr] != null ? this[name][attr] : '');
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
    }

    public apply(options: {}) {
        if (options != null) {
            for (const namespace in options) {
                const obj = options[namespace];
                for (const attr in obj) {
                    this.add(namespace, attr, obj[attr]);
                }
            }
        }
    }

    public render(parent: T) {
        this.renderParent = parent;
        this.renderDepth = (parent.id === 0 ? 0 : parent.renderDepth + 1);
    }

    public hide() {
        this.renderParent = true;
        this.visible = false;
    }

    public options(attr: string, value?: any, overwrite = true) {
        if (hasValue(value)) {
            if (!overwrite && this._options[attr] != null) {
                return null;
            }
            this._options[attr] = value;
        }
        return this._options[attr];
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
            node.children.forEach(item => current.push(...cascade(item)));
            return current;
        }
        return cascade(this);
    }

    public inheritStyle(node: T) {
        const style = this.style || this.styleMap;
        for (const attr in node.style) {
            if (attr.startsWith('font') || attr.startsWith('color')) {
                const key = hyphenToCamelCase(attr);
                style[key] = node.style[key];
            }
        }
    }

    public inheritStyleMap(node: T) {
        for (const attr in node.styleMap) {
            if (this.styleMap[attr] == null) {
                this.styleMap[attr] = node.styleMap[attr];
            }
        }
    }

    public intersect(rect: ClientRect, dimension = 'bounds') {
        const top = (rect.top >= this[dimension].top && rect.top < this[dimension].bottom);
        const right = (rect.right > this[dimension].left && rect.right <= this[dimension].right);
        const bottom = (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom);
        const left = (rect.left >= this[dimension].left && rect.left < this[dimension].right);
        return (top && (left || right)) || (bottom && (left || right));
    }

    public withinX(rect: ClientRect, dimension = 'linear') {
        return (
            (rect.top >= this[dimension].top && rect.top < this[dimension].bottom) ||
            (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom) ||
            (this[dimension].top >= rect.top && this[dimension].bottom <= rect.bottom) ||
            (rect.top >= this[dimension].top && rect.bottom <= this[dimension].bottom)
        );
    }

    public withinY(rect: ClientRect, dimension = 'linear') {
        return (
            (rect.left >= this[dimension].left && rect.left < this[dimension].right) ||
            (rect.right > this[dimension].left && rect.right <= this[dimension].right) ||
            (this[dimension].left >= rect.left && this[dimension].right <= rect.right) ||
            (rect.left >= this[dimension].left && rect.right <= this[dimension].right)
        );
    }

    public css(attr: string, value = '') {
        if (arguments.length === 2) {
            this.styleMap[attr] = (hasValue(value) ? value : '');
        }
        return this.styleMap[attr] || (this.style && this.style[attr]) || '';
    }

    public setBounds(calibrate: boolean = false, element?: HTMLElement) {
        if (!calibrate) {
            const bounds = (element != null ? getRangeBounds(element) : (this.hasElement ? assignBounds(this.element.getBoundingClientRect()) : null));
            if (bounds != null) {
                this.bounds = bounds;
            }
        }
        if (this.bounds != null) {
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
    }

    public expandDimensions() {
        let [width, height] = [Math.max.apply(null, this.children.map(node => node.linear.right)), Math.max.apply(null, this.children.map(node => node.linear.bottom))];
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

    set tagName(value) {
        this._tagName = value;
    }
    get tagName() {
        return this._tagName || (this.hasElement ? (this.element.tagName === 'INPUT' ? (<HTMLInputElement> this.element).type.toUpperCase() : this.element.tagName) : '');
    }

    set viewName(value) {
        this._viewName = value;
    }
    get viewName() {
        return this._viewName;
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

    get element() {
        return this._element || {};
    }

    get hasElement() {
        return (this._element != null);
    }

    get parentElement() {
        return this._element && this._element.parentElement;
    }

    get namespaces() {
        return Array.from(this._namespaces);
    }

    get flex() {
        if (this._flex == null) {
            const style = this.style;
            if (style != null) {
                const parent = this.parentOriginal;
                this._flex = {
                    enabled: (style.display && style.display.indexOf('flex') !== -1),
                    direction: style.flexDirection,
                    basis: style.flexBasis,
                    grow: convertInt(style.flexGrow),
                    shrink: convertInt(style.flexShrink),
                    wrap: style.flexWrap,
                    alignSelf: (parent.styleMap.alignItems != null && (this.styleMap.alignSelf == null || style.alignSelf === 'auto') ? parent.styleMap.alignItems : style.alignSelf),
                    justifyContent: style.justifyContent,
                    order: convertInt(style.order)
                };
            }
        }
        return this._flex || {};
    }

    get floating() {
        const float = (this.style != null ? (<any> this.style).float : '');
        return (float === 'left' || float === 'right');
    }

    get fixed() {
        return (this.style.display === 'fixed');
    }

    get overflow() {
        if (this._overflow == null) {
            let value = OVERFLOW_CHROME.NONE;
            if (this.hasElement) {
                if (this.css('overflow') === 'scroll' || (this.css('overflowX') === 'auto' && this.element.clientWidth !== this.element.scrollWidth)) {
                    value |= OVERFLOW_CHROME.HORIZONTAL;
                }
                if (this.css('overflow') === 'scroll' || (this.css('overflowY') === 'auto' && this.element.clientHeight !== this.element.scrollHeight)) {
                    value |= OVERFLOW_CHROME.VERTICAL;
                }
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
    get marginRight() {
        return convertInt(this.css('marginRight'));
    }
    get marginBottom() {
        return convertInt(this.css('marginBottom'));
    }
    get marginLeft() {
        return convertInt(this.css('marginLeft'));
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
    get paddingRight() {
        return convertInt(this.css('paddingRight'));
    }
    get paddingBottom() {
        return convertInt(this.css('paddingBottom'));
    }
    get paddingLeft() {
        return convertInt(this.css('paddingLeft'));
    }

    get center(): Point {
        return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2)};
    }
}