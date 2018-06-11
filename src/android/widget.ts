import { BUILD_ANDROID, FIXED_ANDROID, MAPPING_CHROME, OVERFLOW_CHROME, WIDGET_ANDROID } from '../lib/constants';
import API_ANDROID from '../android/customizations';
import { calculateBias, convertInt, convertPX, formatPX, formatString, generateId, hasValue, isNumber } from '../lib/util';
import { parseStyle } from '../lib/dom';
import * as Resource from '../resource';
import parseRTL from '../lib/localization';
import Node from '../base/node';

export default class Widget extends Node {
    public constraint: any = {};
    public labelFor: Widget;
    public children: Widget[] = [];
    public renderChildren: Widget[] = [];
    public linearRows: Widget[] = [];
    public styleAttributes: string[] = [];

    public androidId: string;
    public androidWidgetName: string;
    public androidSrc: string;

    private actions: number[];
    private _android: any;
    private _app: any;
    private _label: Widget;

    constructor(
        public id: number,
        public api: number,
        element?: HTMLElement,
        options?: any)
    {
        super(id, element, options);
    }

    public add(obj: string, attr: string, value = '', overwrite = true) {
        if (hasValue(attr) && !this.supported(obj, attr)) {
            return false;
        }
        return super.add(obj, attr, value, overwrite);
    }
    public android(attr: string, value: string = '', overwrite = true) {
        switch (arguments.length) {
            case 0:
                return this._android;
            case 1:
                return this._android && this._android[attr];
            default:
                this.add('android', attr, value, overwrite);
                return this;
        }
    }
    public app(attr: string, value: string = '', overwrite = true) {
        switch (arguments.length) {
            case 0:
                return this._app;
            case 1:
                return this._app && this._app[attr];
            default:
                this.add('app', attr, value, overwrite);
                return this;
        }
    }
    public attr(value: string, overwrite = true) {
        const match = value.match(/^(?:([a-z]+):)?(\w+)="((?:@+?[a-z]+\/)?.+)"$/);
        if (match != null) {
            this.add(match[1] || '_', match[2], match[3], overwrite);
        }
        return this;
    }
    public render(parent: Widget) {
        if (parent.is(WIDGET_ANDROID.LINEAR)) {
            switch (this.nodeName) {
                case WIDGET_ANDROID.LINEAR:
                case WIDGET_ANDROID.RADIO_GROUP:
                    parent.linearRows.push(this);
                    break;
            }
        }
        super.render(parent);
        return this;
    }
    public anchor(position: string, adjacent: any = {}, orientation = '') {
        const overwrite = (adjacent.stringId === 'parent');
        switch (this.renderParent.nodeName) {
            case WIDGET_ANDROID.CONSTRAINT:
                if (arguments.length === 1) {
                    return this.app(position);
                }
                this.app(position, adjacent.stringId, overwrite);
                break;
            case WIDGET_ANDROID.RELATIVE:
                if (arguments.length === 1) {
                    return this.android(position);
                }
                this.android(position, adjacent.stringId, overwrite);
                break;
        }
        if (orientation !== '') {
            this.constraint[orientation] = true;
        }
        return this;
    }
    public modifyBox(dimension: string, offset: number) {
        dimension = parseRTL(dimension);
        const total = formatPX(offset + convertInt(this.android(dimension)));
        this.css(dimension, total)
            .android(dimension, total);
        this.setBounds(true);
        return this;
    }
    public supported(obj: string, attr: string) {
        for (let i = this.api + 1; i < BUILD_ANDROID.OREO_1; i++) {
            const version = API_ANDROID[i];
            if (version && version[obj] && version[obj].includes(attr)) {
                return false;
            }
        }
        return true;
    }
    public combine() {
        const result: string[] = [];
        this.namespaces.forEach(value => {
            const obj: {} = this[`_${value}`];
            for (const attr in obj) {
                if (value !== '_') {
                    result.push(`${value}:${attr}="${obj[attr]}"`);
                }
                else {
                    result.push(`${attr}="${obj[attr]}"`);
                }
            }
        });
        return result.sort();
    }
    public applyCustomizations() {
        const api = API_ANDROID[this.api];
        if (api != null) {
            const customizations = api.customizations[this.nodeName];
            if (customizations != null) {
                for (const obj in customizations) {
                    for (const attr in customizations[obj]) {
                        this.add(obj, attr, customizations[obj][attr], false);
                    }
                }
            }
        }
    }
    public inheritStyle(node: Widget) {
        const inherit = Resource.ACTION_ANDROID[this.nodeName]['setComputedStyle'];
        for (const attr in inherit) {
            let value = node.style[attr];
            this.style[attr] = value;
            value = parseStyle(null, attr, value);
            if (hasValue(value)) {
                this.styleAttributes.push(formatString(inherit[attr], value));
            }
        }
    }

    public setAndroidId(nodeName: string) {
        this.androidWidgetName = nodeName || this.nodeName;
        if (this.androidId == null) {
            const element: any = this.element || {};
            this.androidId = generateId('android', element.id || element.name || `${this.androidWidgetName.substring(this.androidWidgetName.lastIndexOf('.') + 1).toLowerCase()}_1`);
        }
    }
    public setAndroidDimensions(options?: any) {
        const styleMap = this.styleMap;
        let parent: Widget;
        let width: number;
        let height: number;
        let requireWrap: boolean;
        if (options != null) {
            parent = options.parent;
            [width, height] = [options.width, options.height];
            requireWrap = options.requireWrap;
        }
        else {
            parent = this.parent as Widget;
            width = this.element.offsetWidth + this.marginLeft + this.marginRight;
            height = this.element.offsetHeight + this.marginTop + this.marginBottom;
            requireWrap = parent.is(WIDGET_ANDROID.CONSTRAINT, WIDGET_ANDROID.GRID);
        }
        const parentWidth = (parent.element != null ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + convertInt(parent.style.borderLeftWidth) + convertInt(parent.style.borderRightWidth)) : Number.MAX_VALUE);
        const parentHeight = (parent.element != null ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + convertInt(parent.style.borderTopWidth) + convertInt(parent.style.borderBottomWidth)) : Number.MAX_VALUE);
        if (this.overflow !== OVERFLOW_CHROME.NONE && !this.is(WIDGET_ANDROID.TEXT)) {
            this.android('layout_width', (this.horizontal ? 'wrap_content' : 'match_parent'))
                .android('layout_height', (this.horizontal ? 'match_parent' : 'wrap_content'));
        }
        else {
            if (this.android('layout_width') !== '0px') {
                if (hasValue(styleMap.width)) {
                    this.android('layout_width', convertPX(styleMap.width));
                }
                if (hasValue(styleMap.minWidth)) {
                    this.android('layout_width', 'wrap_content', false)
                        .android('minWidth', convertPX(styleMap.minWidth), false);
                }
                if (hasValue(styleMap.maxWidth)) {
                    this.android('maxWidth', convertPX(styleMap.maxWidth), false);
                }
            }
            if ((!this.flex.enabled || this.constraint.expand) && this.constraint.layoutWidth != null) {
                if (this.constraint.layoutWidth) {
                    this.android('layout_width', (this.renderChildren.some((node: Widget) => node.css('float') === 'right') || convertInt(this.bounds.minWidth) >= parentWidth ? 'match_parent' : this.bounds.minWidth));
                }
                else {
                    this.android('layout_width', 'wrap_content', false);
                }
            }
            else if (this.android('layout_width') == null) {
                if (requireWrap) {
                    this.android('layout_width', 'wrap_content');
                }
                else {
                    if (FIXED_ANDROID.includes(this.nodeName)) {
                        this.android('layout_width', 'wrap_content');
                    }
                    else {
                        if (parent.overflow === OVERFLOW_CHROME.NONE && width >= parentWidth) {
                            this.android('layout_width', 'match_parent');
                        }
                        else {
                            switch (this.style.display) {
                                case 'line-item':
                                case 'block':
                                case 'inherit':
                                    this.android('layout_width', 'match_parent');
                                    break;
                                default:
                                    this.android('layout_width', 'wrap_content');
                            }
                        }
                    }
                }
            }
            if (this.android('layout_height') !== '0px') {
                if (styleMap.height != null || styleMap.lineHeight != null) {
                    this.android('layout_height', convertPX(styleMap.height || styleMap.lineHeight));
                }
                if (hasValue(styleMap.minHeight)) {
                    this.android('layout_height', 'wrap_content', false)
                        .android('minHeight', convertPX(styleMap.minHeight), false);
                }
                if (hasValue(styleMap.maxHeight)) {
                    this.android('maxHeight', convertPX(styleMap.maxHeight), false);
                }
            }
            if ((!this.flex.enabled || this.constraint.expand) && this.constraint.layoutHeight != null) {
                this.android('layout_height', (this.constraint.layoutHeight ? this.bounds.minHeight : 'wrap_content'), this.constraint.layoutHeight);
            }
            else if (this.android('layout_height') == null) {
                this.android('layout_height', (!requireWrap && (parent.id !== 0 && parent.overflow === OVERFLOW_CHROME.NONE) && height >= parentHeight && !FIXED_ANDROID.includes(this.nodeName) ? 'match_parent' : 'wrap_content'));
            }
        }
        if (this.api >= BUILD_ANDROID.OREO) {
            ['layout_margin', 'padding'].forEach(value => {
                const leftRtl = parseRTL(`${value}Left`);
                const rightRtl = parseRTL(`${value}Right`);
                const top = convertInt(this.android(`${value}Top`));
                const right = convertInt(this.android(rightRtl));
                const bottom = convertInt(this.android(`${value}Bottom`));
                const left = convertInt(this.android(leftRtl));
                if (top !== 0 && top === bottom && bottom === left && left === right) {
                    this.delete('android', `${value}*`)
                        .android(value, formatPX(top));
                }
                else {
                    if (top !== 0 && top === bottom) {
                        this.delete('android', `${value}Top`, `${value}Bottom`)
                            .android(`${value}Vertical`, formatPX(top));
                    }
                    if (left !== 0 && left === right) {
                        this.delete('android', leftRtl, rightRtl)
                            .android(`${value}Horizontal`, formatPX(left));
                    }
                }
            });
        }
    }
    public setAttributes(actions?: number[]) {
        const widget = Resource.ACTION_ANDROID[this.nodeName];
        const element = this.element;
        const result = {};
        if (element != null && element.tagName === 'INPUT' && element.id !== '') {
            const nextElement = <HTMLLabelElement> element.nextElementSibling;
            if (nextElement && nextElement.htmlFor === element.id) {
                const node = (<any> nextElement).__node;
                node.setAttributes([2, 4]);
                node.setAndroidId(WIDGET_ANDROID.TEXT);
                const attributes = node.combine();
                if (attributes.length > 0) {
                    result[4] = attributes;
                }
                this.css('marginRight', node.style.marginRight)
                    .css('paddingRight', node.style.paddingRight)
                    .label = node;
                node.hide();
            }
        }
        if (widget != null) {
            if (this.actions != null) {
                actions = this.actions;
            }
            let i = -1;
            for (const action in widget) {
                i++;
                if (result[action] != null || (actions && actions.length > 0 && !actions.includes(i))) {
                    continue;
                }
                if (hasValue(this[action])) {
                    result[action] = formatString(widget[action], this[action]);
                }
                else if (typeof Resource[action] === 'function') {
                    const data = Resource[action](this);
                    if (data != null) {
                        const output = [];
                        for (const j in widget[action]) {
                            if (result[j] != null) {
                                continue;
                            }
                            let value = data[j];
                            if (hasValue(value)) {
                                value = parseStyle(element, j, value);
                                if (value != null) {
                                    switch (action) {
                                        case 'setComputedStyle':
                                            if (!this.supported.apply(this, widget[action][j].split('=')[0].split(':'))) {
                                                continue;
                                            }
                                            break;
                                        case 'addResourceString':
                                            value = isNumber(value) ? value : `@string/${value}`;
                                            break;
                                    }
                                    output.push(formatString(widget[action][j], value));
                                }
                            }
                        }
                        if (output.length > 0) {
                            switch (action) {
                                case 'setComputedStyle':
                                    this.styleAttributes = output;
                                    break;
                                default:
                                    result[i] = output;
                            }
                        }
                    }
                }
            }
        }
        if (this.gridRowSpan > 1) {
            this.android('layout_rowSpan', this.gridRowSpan.toString());
        }
        if (this.gridColumnSpan > 1) {
            this.android('layout_columnSpan', this.gridColumnSpan.toString());
        }
        for (const i in result) {
            let value = result[i];
            if (hasValue(value)) {
                if (!Array.isArray(value)) {
                    value = [value];
                }
                value.forEach((attr: string) => this.attr(attr, false));
            }
        }
    }
    public setGravity() {
        const verticalAlign = this.styleMap.verticalAlign;
        let textAlign = '';
        let element: any = this.element;
        while (element && element.__styleMap != null) {
            textAlign = element.__styleMap.textAlign || textAlign;
            const float = (element !== this.element ? element.__styleMap.float : '');
            if (float === 'left' || float === 'right' || hasValue(textAlign)) {
                break;
            }
            element = element.parentNode;
        }
        if (hasValue(verticalAlign) || hasValue(textAlign)) {
            let horizontal = '';
            let vertical = '';
            const layoutGravity = [];
            switch (textAlign) {
                case 'start':
                    horizontal = 'start';
                    break;
                case 'right':
                    horizontal = parseRTL('right');
                    break;
                case 'end':
                    horizontal = 'end';
                    break;
                case 'center':
                    horizontal = 'center_horizontal';
                    break;
            }
            switch (verticalAlign) {
                case 'top':
                    vertical = 'top';
                    break;
                case 'middle':
                    vertical = 'center_vertical';
                    break;
                case 'bottom':
                case 'text-bottom':
                    vertical = 'bottom';
                    break;
                default:
                    if (this.style.height === this.style.lineHeight || convertInt(this.style.lineHeight) === (this.box.bottom - this.box.top)) {
                        vertical = 'center_vertical';
                    }
            }
            const parentTextAlign = (this.styleMap.textAlign !== textAlign && !this.renderParent.floating && !this.floating);
            switch (this.renderParent.nodeName) {
                case WIDGET_ANDROID.RADIO_GROUP:
                case WIDGET_ANDROID.LINEAR:
                    if (parentTextAlign) {
                        this.renderParent.android('gravity', horizontal);
                    }
                    break;
                case WIDGET_ANDROID.CONSTRAINT:
                case WIDGET_ANDROID.RELATIVE:
                    const gravity = [vertical, horizontal].filter(value => value);
                    this.android('gravity', (gravity.length === 2 ? 'center' : gravity[0]));
                    horizontal = '';
                    vertical = '';
                    break;
                case WIDGET_ANDROID.GRID:
                    if (parentTextAlign && horizontal !== '') {
                        layoutGravity.push(horizontal);
                    }
                    break;
            }
            if (vertical !== '' || layoutGravity.length > 0) {
                layoutGravity.push(vertical);
                this.android('layout_gravity', (layoutGravity.length === 2 ? 'center' : layoutGravity[0]));
            }
            if (horizontal !== '') {
                this.android('gravity', horizontal);
            }
        }
    }
    public setAccessibility() {
        switch (this.nodeName) {
            case WIDGET_ANDROID.EDIT:
                let parent: Widget = this.renderParent;
                let current: Widget = this;
                let label: Widget = null;
                while (parent && parent.renderChildren != null) {
                    const index = parent.renderChildren.findIndex((item: Widget) => item === current);
                    if (index > 0) {
                        label = parent.renderChildren[index - 1];
                        break;
                    }
                    current = parent;
                    parent = parent.renderParent;
                }
                if (label && label.is(WIDGET_ANDROID.TEXT)) {
                    label.android('labelFor', this.stringId);
                }
            case WIDGET_ANDROID.SPINNER:
            case WIDGET_ANDROID.CHECKBOX:
            case WIDGET_ANDROID.RADIO:
            case WIDGET_ANDROID.BUTTON:
                this.android('focusable', 'true');
                break;
        }
    }

    get stringId() {
        return (this.androidId != null ? `@+id/${this.androidId}` : '');
    }
    get nodeName() {
        if (this.androidWidgetName != null) {
            return this.androidWidgetName;
        }
        else {
            let nodeName = MAPPING_CHROME[this.tagName];
            if (typeof nodeName === 'object') {
                nodeName = nodeName[(<HTMLInputElement> this.element).type];
            }
            return nodeName;
        }
    }
    set label(value: Widget) {
        this._label = value;
        value.labelFor = this;
    }
    get label() {
        return this._label;
    }
    get horizontal() {
        return (this._android && this._android.orientation === 'horizontal');
    }
    get anchored() {
        return (this.constraint.horizontal && this.constraint.vertical);
    }
    get horizontalBias() {
        const parent = this.renderParent;
        if (parent && parent.visible) {
            const left = this.linear.left - parent.box.left;
            const right = parent.box.right - this.linear.right;
            return calculateBias(left, right);
        }
        return 0.5;
    }
    get verticalBias() {
        const parent = this.renderParent;
        if (parent && parent.visible) {
            const top = this.linear.top - parent.box.top;
            const bottom = parent.box.bottom - this.linear.bottom;
            return calculateBias(top, bottom);
        }
        return 0.5;
    }
}