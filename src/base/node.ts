import { BoxModel, BoxRect, ClientRect, Flexbox, IExtension, Null, ObjectMap, Point, StringMap } from '../lib/types';
import { convertInt, hasValue, convertCamelCase, includesEnum, search } from '../lib/util';
import { assignBounds, getRangeBounds } from '../lib/dom';
import { OVERFLOW_CHROME } from '../lib/constants';

type T = Node;

export default abstract class Node implements BoxModel {
    public style: CSSStyleDeclaration;
    public styleMap: StringMap = {};
    public viewId: string;
    public depth = -1;
    public renderDepth = 0;
    public parentIndex = Number.MAX_VALUE;
    public bounds: ClientRect;
    public linear: ClientRect;
    public box: ClientRect;
    public renderExtension: Null<IExtension>;
    public ignoreResource = 0;
    public documentRoot = false;
    public visible = true;
    public companion = false;
    public isolated = false;

    public gridRowSpan = 0;
    public gridColumnSpan = 0;
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
    private _namespaces = new Set<string>();
    private _parent: T;
    private _documentParent: T;
    private _renderParent: T | boolean;
    private _tagName: string;
    private _data: ObjectMap<any> = {};

    constructor(
        public id: number,
        element?: Null<HTMLElement>)
    {
        if (element != null) {
            const object: any = element;
            if (element instanceof HTMLElement) {
                const styleMap = object.__styleMap || {};
                for (const inline of Array.from(element.style)) {
                    styleMap[convertCamelCase(inline)] = (<any> element.style)[inline];
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
    public abstract setViewLayout(width?: number, height?: number): void;
    public abstract applyCustomizations(): void;
    public abstract modifyBox(area: number, offset: number): void;
    public abstract boxValue(area: number): string[];

    public add(ns: string, attr: string, value = '', overwrite = true) {
        const name = `_${ns || '_'}`;
        if (hasValue(value)) {
            if (this[name] == null) {
                this._namespaces.add(ns);
                this[name] = {};
            }
            if (!overwrite && this[name][attr] != null) {
                return null;
            }
            this[name][attr] = value;
        }
        return this[name] && this[name][attr];
    }

    public get(ns: string, attr: string): string {
        const name = `_${ns || '_'}`;
        return (this[name] && this[name][attr] != null ? this[name][attr] : '');
    }

    public delete(ns: string, ...attrs: string[]) {
        const name = `_${ns || '_'}`;
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

    public apply(options: ObjectMap<any>): ObjectMap<any> | void  {
        const excluded: ObjectMap<any> = {};
        if (options != null) {
            for (const namespace in options) {
                const obj = options[namespace];
                if (typeof obj === 'object') {
                    for (const attr in obj) {
                        this.add(namespace, attr, obj[attr]);
                    }
                }
                else if (hasValue(obj)) {
                    excluded[namespace] = obj;
                }
            }
        }
        return excluded;
    }

    public render(parent: T) {
        this.renderParent = parent;
        this.renderDepth = (parent === this ? this.depth : (this.documentRoot ? 0 : parent.renderDepth + 1));
    }

    public hide() {
        this.renderParent = true;
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
            node.children.forEach(item => current.push(...cascade(item)));
            return current;
        }
        return cascade(this);
    }

    public inheritBase(node: T) {
        this.style = node.style;
        this.bounds = node.bounds;
        this.linear = node.linear;
        this.box = node.box;
    }

    public inheritStyle(node: T) {
        const style: StringMap = {};
        for (const attr in node.style) {
            if (attr.startsWith('font') || attr.startsWith('color')) {
                const key = convertCamelCase(attr);
                style[key] = node.style[key];
            }
        }
        Object.assign(this.styleMap, style);
    }

    public inheritStyleMap(node: T) {
        for (const attr in node.styleMap) {
            if (this.styleMap[attr] == null) {
                this.styleMap[attr] = node.styleMap[attr];
            }
        }
    }

    public intersect(rect: ClientRect, dimension = 'linear') {
        const top = (rect.top > this[dimension].top && rect.top < this[dimension].bottom);
        const right = (rect.right > this[dimension].left && rect.right < this[dimension].right);
        const bottom = (rect.bottom > this[dimension].top && rect.bottom < this[dimension].bottom);
        const left = (rect.left > this[dimension].left && rect.left < this[dimension].right);
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
        return this.styleMap[attr] || (this.style && (<any> this.style)[attr]) || '';
    }

    public setBounds(calibrate = false, element?: HTMLElement) {
        if (!calibrate) {
            const bounds = (element != null ? getRangeBounds(element) : (this.hasElement ? assignBounds(<ClientRect> this.element.getBoundingClientRect()) : null));
            if (bounds != null) {
                this.bounds = bounds;
            }
        }
        if (this.bounds != null) {
            const linear: ClientRect = {
                top: this.bounds.top - this.marginTop,
                right: this.bounds.right + this.marginRight,
                bottom: this.bounds.bottom + this.marginBottom,
                left: this.bounds.left - this.marginLeft,
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
        const nodes = this.children.filter(node => !node.pageflow);
        if (nodes.length > 0) {
            const [right, bottom] = [Math.max.apply(null, this.children.map(node => node.linear.right)), Math.max.apply(null, this.children.map(node => node.linear.bottom))];
            if (nodes.some(node => node.linear.right === right || node.linear.bottom === bottom)) {
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

    protected setDimensions() {
        const linear = this.linear;
        linear.width = linear.right - linear.left;
        linear.height = linear.bottom - linear.top;
        const box = this.box;
        box.width = box.right - box.left;
        box.height = box.bottom - box.top;
    }

    set parent(value) {
        if (value == null || value === this._parent) {
            return;
        }
        if (this._parent && this._documentParent == null) {
            this._documentParent = this._parent;
        }
        this._parent = value;
        this.depth = value.depth + 1;
    }
    get parent() {
        return this._parent;
    }

    get documentParent() {
        return this._documentParent || this._parent;
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
        return (this._element instanceof HTMLElement);
    }

    get parentElement() {
        return this._element && this._element.parentElement;
    }

    get namespaces() {
        return Array.from(this._namespaces);
    }

    get extension() {
        return (this.hasElement && this.element.dataset.ext != null ? this.element.dataset.ext.split(',')[0].trim() : '');
    }

    get flex(): Flexbox {
        const style = this.style;
        if (style != null) {
            const parent = this.documentParent;
            return {
                enabled: ((<string> style.display).indexOf('flex') !== -1),
                direction: (<string> style.flexDirection),
                basis: (<string> style.flexBasis),
                grow: convertInt(style.flexGrow),
                shrink: convertInt(style.flexShrink),
                wrap: (<string> style.flexWrap),
                alignSelf: (<string> (parent.styleMap.alignItems != null && (this.styleMap.alignSelf == null || style.alignSelf === 'auto') ? parent.styleMap.alignItems : style.alignSelf)),
                justifyContent: (<string> style.justifyContent),
                order: convertInt(style.order)
            };
        }
        return (<Flexbox> {});
    }

    get floating() {
        const float = (this.style != null ? (<any> this.style).float : '');
        return (float === 'left' || float === 'right');
    }

    get fixed() {
        return (this.style && this.style.display === 'fixed');
    }

    get overflow() {
        let value = OVERFLOW_CHROME.NONE;
        if (this.hasElement) {
            if (this.css('overflow') === 'scroll' || this.css('overflowX') === 'scroll' || (this.css('overflowX') === 'auto' && this.element.clientWidth !== this.element.scrollWidth)) {
                value |= OVERFLOW_CHROME.HORIZONTAL;
            }
            if (this.css('overflow') === 'scroll' || this.css('overflowY') === 'scroll' || (this.css('overflowY') === 'auto' && this.element.clientHeight !== this.element.scrollHeight)) {
                value |= OVERFLOW_CHROME.VERTICAL;
            }
        }
        return value;
    }
    get overflowX() {
        return includesEnum(this.overflow, OVERFLOW_CHROME.HORIZONTAL);
    }
    get overflowY() {
        return includesEnum(this.overflow, OVERFLOW_CHROME.VERTICAL);
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

    get pageflow() {
        const position = this.css('position');
        return (position === 'static' || position === 'initial' || this.tagName === 'PLAINTEXT' || (position === 'relative' && convertInt(this.css('top')) === 0 && convertInt(this.css('right')) === 0 && convertInt(this.css('bottom')) === 0 && convertInt(this.css('left')) === 0));
    }

    get center(): Point {
        return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2)};
    }
}