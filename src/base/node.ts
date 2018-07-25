import { BoxModel, ClientRect, Flexbox, IExtension, Null, ObjectMap, Point, StringMap } from '../lib/types';
import { convertInt, hasValue, convertCamelCase, includesEnum, search } from '../lib/util';
import { assignBounds, getRangeBounds } from '../lib/dom';
import { INLINE_ELEMENT, NODE_RESOURCE, OVERFLOW_ELEMENT, NODE_PROCEDURE } from '../lib/constants';

type T = Node;

export default abstract class Node implements BoxModel {
    public style: CSSStyleDeclaration;
    public styleMap: StringMap = {};
    public nodeId: string;
    public nodeType = 0;
    public depth = -1;
    public renderDepth = 0;
    public parentIndex = Number.MAX_VALUE;
    public bounds: ClientRect;
    public linear: ClientRect;
    public box: ClientRect;
    public renderExtension: Null<IExtension>;
    public excludeProcedure = 0;
    public excludeResource = 0;
    public documentRoot = false;
    public companion: T;
    public visible = true;
    public isolated = false;
    public relocated = false;

    public abstract children: T[];
    public abstract renderChildren: T[];

    protected _nodeName: string;

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
    public abstract setNodeId(viewName: string): void;
    public abstract setLayout(width?: number, height?: number): void;
    public abstract setAlignment(): void;
    public abstract setAccessibility(): void;
    public abstract applyCustomizations(): void;
    public abstract modifyBox(area: number, offset: number): void;
    public abstract boxValue(area: number): string[];
    public abstract clone(): T;

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

    public apply(options = {}): void | {} {
        const excluded = {};
        for (const ns in options) {
            const obj = options[ns];
            if (typeof obj === 'object') {
                for (const attr in obj) {
                    this.add(ns, attr, obj[attr]);
                }
            }
            else if (hasValue(obj)) {
                excluded[ns] = obj;
            }
        }
        return excluded;
    }

    public render(parent: T) {
        this.renderParent = parent;
        this.renderDepth = (parent === this || this.documentRoot || hasValue(parent.dataset.target) ? 0 : parent.renderDepth + 1);
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
                            if (inherit != null) {
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
                    const style: StringMap = {};
                    for (const attr in node.style) {
                        if (attr.startsWith('font') || attr.startsWith('color')) {
                            const key = convertCamelCase(attr);
                            style[key] = node.style[key];
                        }
                    }
                    Object.assign(this.styleMap, style);
                    break;
                case 'styleMap':
                    for (const attr in node.styleMap) {
                        if (this.styleMap[attr] == null) {
                            this.styleMap[attr] = node.styleMap[attr];
                        }
                    }
                    break;
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
        return this.styleMap[attr] || (this.style && this.style[attr]) || '';
    }

    public setExcludeProcedure(exclude?: string) {
        if (exclude == null && this.hasElement) {
            exclude = this.dataset.excludeProcedure || '';
            if (this.parentElement != null) {
                exclude += '|' + (this.parentElement.dataset.excludeProcedureChild || '');
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
            if (this.parentElement != null) {
                exclude += '|' + (this.parentElement.dataset.excludeResourceChild || '');
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

    public setBounds(calibrate = false, element?: HTMLElement) {
        if (!calibrate) {
            const bounds = (element != null ? getRangeBounds(element) : (this.hasElement ? assignBounds(<ClientRect> this.element.getBoundingClientRect()) : null));
            if (bounds != null) {
                this.bounds = bounds;
                if (this.companion != null) {
                    const outerBounds = assignBounds(<ClientRect> this.companion.element.getBoundingClientRect());
                    this.bounds.left = Math.min(bounds.left, outerBounds.left);
                    this.bounds.right = Math.max(bounds.right, outerBounds.right);
                    this.bounds.width = this.bounds.right - this.bounds.left;
                }
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
        this._parent = value;
        this.depth = value.depth + 1;
    }
    get parent() {
        return this._parent;
    }

    set documentParent(value: T) {
        this._documentParent = value;
    }

    get documentParent(): T {
        return this._documentParent || (this.element && this.element.parentElement != null ? (<any> this.element.parentElement).__node : null) || this._parent;
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

    set renderParent(value: T | boolean) {
        if (value instanceof Node && value !== this && value.renderChildren.indexOf(this) === -1) {
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

    get dataset(): DOMStringMap {
        return (this.hasElement ? this.element.dataset : {});
    }

    get extension() {
        return (this.dataset.ext != null ? this.dataset.ext.split(',')[0].trim() : '');
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
                alignSelf: (<string> (parent && parent.styleMap.alignItems != null && (this.styleMap.alignSelf == null || style.alignSelf === 'auto') ? parent.styleMap.alignItems : style.alignSelf)),
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

    get overflow() {
        let value = OVERFLOW_ELEMENT.NONE;
        if (this.hasElement) {
            if (this.css('overflow') === 'scroll' || this.css('overflowX') === 'scroll' || (this.css('overflowX') === 'auto' && this.element.clientWidth !== this.element.scrollWidth)) {
                value |= OVERFLOW_ELEMENT.HORIZONTAL;
            }
            if (this.css('overflow') === 'scroll' || this.css('overflowY') === 'scroll' || (this.css('overflowY') === 'auto' && this.element.clientHeight !== this.element.scrollHeight)) {
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

    get viewWidth() {
        return convertInt(this.styleMap.width || this.styleMap.minWidth);
    }
    get viewHeight() {
        return convertInt(this.styleMap.height || this.styleMap.lineHeight || this.styleMap.minHeight);
    }

    get marginTop() {
        return (this.inline ? 0 : convertInt(this.css('marginTop')));
    }
    get marginRight() {
        let node = (<T> this);
        if (this.companion != null && this.companion.bounds.right > this.bounds.right) {
            node = this.companion;
        }
        return convertInt(node.css('marginRight'));
    }
    get marginBottom() {
        return (this.inline ? 0 : convertInt(this.css('marginBottom')));
    }
    get marginLeft() {
        let node = (<T> this);
        if (this.companion != null && this.companion.bounds.left < this.bounds.left) {
            node = this.companion;
        }
        return convertInt(node.css('marginLeft'));
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
        let node = (<T> this);
        if (this.companion != null && this.companion.bounds.right > this.bounds.right) {
            node = this.companion;
        }
        return convertInt(node.css('paddingRight'));
    }
    get paddingBottom() {
        return convertInt(this.css('paddingBottom'));
    }
    get paddingLeft() {
        let node = (<T> this);
        if (this.companion != null && this.companion.bounds.left < this.bounds.left) {
            node = this.companion;
        }
        return convertInt(node.css('paddingLeft'));
    }

    get pageflow() {
        const position = this.css('position');
        return (position === 'static' || position === 'initial' || this.tagName === 'PLAINTEXT' || (position === 'relative' && convertInt(this.css('top')) === 0 && convertInt(this.css('right')) === 0 && convertInt(this.css('bottom')) === 0 && convertInt(this.css('left')) === 0));
    }

    get inline() {
        return (!this.floating && (this.css('display') === 'inline' || (this.css('display') === 'initial' && INLINE_ELEMENT.includes(this.element.tagName))));
    }

    get dir() {
        switch (this.css('direction')) {
            case 'unset':
            case 'inherit':
                let parent = this.documentParent;
                while (parent != null) {
                    const dir = parent.dir;
                    if (dir !== '') {
                        return dir;
                    }
                    parent = parent.documentParent;
                }
                return '';
            case 'rtl':
                return 'rtl';
            default:
                return 'ltr';
        }
    }

    get center(): Point {
        return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2)};
    }
}