import { IStringMap } from '../lib/types';
import Node from '../base/node';
import { BOX_ANDROID, BUILD_ANDROID, FIXED_ANDROID, VIEW_ANDROID } from './constants';
import parseRTL from './localization';
import API_ANDROID from './customizations';
import { BOX_STANDARD, MAPPING_CHROME, VIEW_STANDARD, OVERFLOW_CHROME } from '../lib/constants';
import { averageInt, calculateBias, convertInt, convertPX, formatPX, generateId, getFileExt, hasValue, isPercent } from '../lib/util';

type T = Widget;

export default class Widget extends Node {
    public static getViewName(tagName: number): string {
        return VIEW_ANDROID[VIEW_STANDARD[tagName]];
    }

    public constraint: any = {};
    public labelFor: T;
    public children: T[] = [];
    public renderChildren: T[] = [];
    public linearRows: T[] = [];

    private _android: IStringMap;
    private _app: IStringMap;
    private _label: T;

    constructor(
        public id: number,
        public api: number,
        element?: HTMLElement | null,
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

    public android(attr: string = '', value: string = '', overwrite = true) {
        switch (arguments.length) {
            case 0:
                return this._android;
            case 1:
                return this._android && this._android[attr];
            default:
                this.add('android', attr, value, overwrite);
        }
    }

    public app(attr: string = '', value: string = '', overwrite = true) {
        switch (arguments.length) {
            case 0:
                return this._app;
            case 1:
                return this._app && this._app[attr];
            default:
                this.add('app', attr, value, overwrite);
        }
    }

    public attr(value: string, overwrite = true) {
        const match = value.match(/^(?:([a-z]+):)?(\w+)="((?:@+?[a-z]+\/)?.+)"$/);
        if (match != null) {
            this.add(match[1] || '_', match[2], match[3], overwrite);
        }
    }

    public render(parent: T) {
        if (parent.is(VIEW_STANDARD.LINEAR)) {
            switch (this.viewName) {
                case VIEW_ANDROID.LINEAR:
                case VIEW_ANDROID.RADIO_GROUP:
                    parent.linearRows.push(this);
                    break;
            }
        }
        super.render(parent);
    }

    public anchor(position: string, adjacent: IStringMap = {}, orientation = '') {
        const overwrite = (adjacent.stringId === 'parent');
        switch (this.renderParent.viewName) {
            case VIEW_ANDROID.CONSTRAINT:
                if (arguments.length === 1) {
                    return this.app(position);
                }
                this.app(position, adjacent.stringId, overwrite);
                break;
            case VIEW_ANDROID.RELATIVE:
                if (arguments.length === 1) {
                    return this.android(position);
                }
                this.android(position, adjacent.stringId, overwrite);
                break;
        }
        if (orientation !== '') {
            this.constraint[orientation] = true;
        }
    }

    public modifyBox(area: number, offset: number) {
        for (const key of Object.keys(BOX_STANDARD)) {
            if ((area & BOX_STANDARD[key]) === BOX_STANDARD[key]) {
                const dimension = parseRTL(BOX_ANDROID[key]);
                const total = formatPX(offset + convertInt(this.android(dimension)));
                this.css(dimension, total);
                this.android(dimension, total);
            }
        }
        this.setBounds(true);
    }

    public supported(obj: string, attr: string) {
        for (let i = this.api + 1; i < BUILD_ANDROID.LATEST; i++) {
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
            const customizations = api.customizations[this.viewName];
            if (customizations != null) {
                for (const obj in customizations) {
                    for (const attr in customizations[obj]) {
                        this.add(obj, attr, customizations[obj][attr], false);
                    }
                }
            }
        }
    }

    public is(...views: number[]) {
        for (const value of views) {
            if (this.viewName === Widget.getViewName(value)) {
                return true;
            }
        }
        return false;
    }

    public setViewId(viewName: string) {
        super.viewName = viewName || this.viewName;
        if (this.viewId == null) {
            const element = (<HTMLInputElement> (this.element || {}));
            this.viewId = generateId('android', element.id || element.name || `${getFileExt(this.viewName).toLowerCase()}_1`);
            this.android('id', this.stringId);
        }
    }

    public setViewLayout(options?: any) {
        const styleMap = this.styleMap;
        let parent: T;
        let width: number;
        let height: number;
        let wrapContent: boolean;
        if (options != null) {
            parent = options.parent;
            [width, height] = [options.width, options.height];
            wrapContent = options.wrapContent;
        }
        else {
            parent = (<T> this.parent);
            width = (this.element != null ? this.element.offsetWidth + this.marginLeft + this.marginRight : 0);
            height = (this.element != null ? this.element.offsetHeight + this.marginTop + this.marginBottom : 0);
            wrapContent = parent.is(VIEW_STANDARD.CONSTRAINT, VIEW_STANDARD.GRID);
        }
        const parentWidth = (parent.element != null ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + convertInt(parent.style.borderLeftWidth) + convertInt(parent.style.borderRightWidth)) : Number.MAX_VALUE);
        const parentHeight = (parent.element != null ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + convertInt(parent.style.borderTopWidth) + convertInt(parent.style.borderBottomWidth)) : Number.MAX_VALUE);
        if (this.overflow !== OVERFLOW_CHROME.NONE && !this.is(VIEW_STANDARD.TEXT)) {
            this.android('layout_width', (this.horizontal ? 'wrap_content' : 'match_parent'));
            this.android('layout_height', (this.horizontal ? 'match_parent' : 'wrap_content'));
        }
        else {
            if (this.android('layout_width') !== '0px') {
                if (hasValue(styleMap.width)) {
                    if (isPercent(styleMap.width)) {
                        if (this.renderParent.tagName === 'TABLE') {
                            this.android('layout_columnWeight', (convertInt(styleMap.width) / 100).toFixed(2));
                            this.android('layout_width', '0px');
                        }
                        else {
                            this.android('layout_width', 'wrap_content');
                        }
                    }
                    else {
                        this.android('layout_width', convertPX(styleMap.width));
                    }
                }
                if (hasValue(styleMap.minWidth) && !isPercent(styleMap.minWidth)) {
                    this.android('layout_width', 'wrap_content', false);
                    this.android('minWidth', convertPX(styleMap.minWidth), false);
                }
                if (hasValue(styleMap.maxWidth) && !isPercent(styleMap.maxWidth)) {
                    this.android('maxWidth', convertPX(styleMap.maxWidth), false);
                }
            }
            if ((!this.flex.enabled || this.constraint.expand) && this.constraint.layoutWidth != null) {
                if (this.constraint.layoutWidth) {
                    this.android('layout_width', (this.renderChildren.some((node: T) => node.css('float') === 'right') || convertInt(this.bounds.minWidth) >= parentWidth ? 'match_parent' : this.bounds.minWidth));
                }
                else {
                    this.android('layout_width', 'wrap_content', false);
                }
            }
            else if (this.android('layout_width') == null) {
                if (wrapContent) {
                    this.android('layout_width', 'wrap_content');
                }
                else {
                    if (FIXED_ANDROID.includes(this.viewName)) {
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
                if (hasValue(styleMap.height) || hasValue(styleMap.lineHeight)) {
                    if (isPercent(styleMap.height) || isPercent(styleMap.lineHeight)) {
                        if (this.renderParent.tagName === 'TABLE') {
                            this.android('layout_rowWeight', (convertInt(styleMap.height || styleMap.lineHeight) / 100).toFixed(2));
                            this.android('layout_height', '0px');
                        }
                        else {
                            this.android('layout_height', 'wrap_content');
                        }
                    }
                    else {
                        this.android('layout_height', convertPX(styleMap.height || styleMap.lineHeight));
                    }
                }
                if (hasValue(styleMap.minHeight) && !isPercent(styleMap.minHeight)) {
                    this.android('layout_height', 'wrap_content', false);
                    this.android('minHeight', convertPX(styleMap.minHeight), false);
                }
                if (hasValue(styleMap.maxHeight) && !isPercent(styleMap.maxHeight)) {
                    this.android('maxHeight', convertPX(styleMap.maxHeight), false);
                }
            }
            if ((!this.flex.enabled || this.constraint.expand) && this.constraint.layoutHeight != null) {
                this.android('layout_height', (this.constraint.layoutHeight ? this.bounds.minHeight : 'wrap_content'), this.constraint.layoutHeight);
            }
            else if (this.android('layout_height') == null) {
                this.android('layout_height', (!wrapContent && (parent.id !== 0 && parent.overflow === OVERFLOW_CHROME.NONE) && height >= parentHeight && !FIXED_ANDROID.includes(this.viewName) ? 'match_parent' : 'wrap_content'));
            }
        }
        if (this.gridRowSpan > 1) {
            this.android('layout_rowSpan', this.gridRowSpan.toString());
        }
        if (this.gridColumnSpan > 1) {
            this.android('layout_columnSpan', this.gridColumnSpan.toString());
        }
        if (this.gridPadding) {
            if (this.gridPadding.top > 0) {
                this.modifyBox(BOX_STANDARD.PADDING_TOP, this.gridPadding.top);
            }
            if (this.gridPadding.right.length > 0) {
                this.modifyBox(BOX_STANDARD.PADDING_RIGHT, averageInt(this.gridPadding.right));
            }
            if (this.gridPadding.bottom > 0) {
                this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, this.gridPadding.bottom);
            }
            if (this.gridPadding.left.length > 0) {
                this.modifyBox(BOX_STANDARD.PADDING_LEFT, averageInt(this.gridPadding.left));
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
                    this.delete('android', `${value}*`);
                    this.android(value, formatPX(top));
                }
                else {
                    if (top !== 0 && top === bottom) {
                        this.delete('android', `${value}Top`, `${value}Bottom`);
                        this.android(`${value}Vertical`, formatPX(top));
                    }
                    if (left !== 0 && left === right) {
                        this.delete('android', leftRtl, rightRtl);
                        this.android(`${value}Horizontal`, formatPX(left));
                    }
                }
            });
        }
    }

    public setGravity() {
        const verticalAlign = this.styleMap.verticalAlign;
        let textAlign = '';
        let node: T = this;
        while (node != null) {
            textAlign = node.styleMap.textAlign || textAlign;
            const float = (node !== this ? node.styleMap.float : '');
            if (float === 'left' || float === 'right' || hasValue(textAlign)) {
                break;
            }
            node = (<T> node.parentOriginal);
        }
        if (hasValue(verticalAlign) || hasValue(textAlign)) {
            let horizontal = '';
            let vertical = '';
            let gravity: string[] = [];
            let layoutGravity: string[] = [];
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
            const parentTextAlign = (this.styleMap.textAlign !== textAlign && !this.renderParent.floating && !this.floating && this.renderParent.tagName !== 'TABLE');
            switch (this.renderParent.viewName) {
                case VIEW_ANDROID.RADIO_GROUP:
                case VIEW_ANDROID.LINEAR:
                    if (parentTextAlign) {
                        this.renderParent.android('gravity', horizontal);
                        horizontal = '';
                    }
                    else {
                        gravity.push(vertical);
                        vertical = '';
                    }
                    break;
                case VIEW_ANDROID.CONSTRAINT:
                case VIEW_ANDROID.RELATIVE:
                    gravity.push(horizontal, vertical);
                    horizontal = '';
                    vertical = '';
                    break;
                case VIEW_ANDROID.GRID:
                    if (parentTextAlign) {
                        layoutGravity.push(horizontal, vertical);
                    }
                    else {
                        gravity.push(horizontal, vertical);
                    }
                    if (this.renderParent.tagName === 'TABLE') {
                        this.android('layout_gravity', 'fill');
                    }
                    horizontal = '';
                    vertical = '';
                    break;
            }
            gravity = gravity.filter(value => value !== '');
            layoutGravity = layoutGravity.filter(value => value !== '');
            if (layoutGravity.length > 0) {
                this.android('layout_gravity', (layoutGravity.length === 2 ? 'center' : layoutGravity[0]), false);
            }
            else if (gravity.length > 0) {
                this.android('gravity', (gravity.length === 2 ? 'center' : gravity[0]));
            }
            else if (horizontal !== '') {
                this.android('gravity', horizontal);
            }
        }
    }

    public distributeWeight(horizontal: boolean, percent: number) {
        this.android(`layout_${(horizontal ? 'width' : 'height')}`, '0px');
        this.android('layout_weight', (percent / 100).toFixed(2));
    }

    public setAccessibility() {
        const element: any = this.element;
        const nextElement = (<HTMLLabelElement> element.nextElementSibling);
        let labeled = false;
        if (element.tagName === 'INPUT' && nextElement && nextElement.htmlFor === element.id) {
            const node = (<any> nextElement).__node;
            node.setViewId(VIEW_ANDROID.TEXT);
            this.css('marginRight', node.style.marginRight);
            this.css('paddingRight', node.style.paddingRight);
            this.label = node;
            node.hide();
            node.labelFor = this;
            labeled = true;
        }
        switch (this.viewName) {
            case VIEW_ANDROID.EDIT:
                if (!labeled) {
                    let parent: T = this.renderParent;
                    let current: T = this;
                    let label: T | null = null;
                    while (parent && parent.renderChildren != null) {
                        const index = parent.renderChildren.findIndex((item: T) => item === current);
                        if (index > 0) {
                            label = parent.renderChildren[index - 1];
                            break;
                        }
                        current = parent;
                        parent = parent.renderParent;
                    }
                    if (label && label.is(VIEW_STANDARD.TEXT)) {
                        label.android('labelFor', this.stringId);
                    }
                }
            case VIEW_ANDROID.SELECT:
            case VIEW_ANDROID.CHECKBOX:
            case VIEW_ANDROID.RADIO:
            case VIEW_ANDROID.BUTTON:
                this.android('focusable', 'true');
                break;
        }
    }

    get stringId() {
        return (hasValue(this.viewId) ? `@+id/${this.viewId}` : '');
    }
    get viewName() {
        if (this._viewName != null) {
            return super.viewName;
        }
        else {
            let value: number | object = MAPPING_CHROME[this.tagName];
            if (typeof value === 'object') {
                value = value[(<HTMLInputElement> this.element).type];
            }
            return (value != null ? Widget.getViewName((<number> value)) : '');
        }
    }
    set label(value: T) {
        this._label = value;
        value.companion = true;
        value.labelFor = this;
    }
    get label() {
        return this._label;
    }
    get anchored() {
        return (this.constraint.horizontal && this.constraint.vertical);
    }
    get horizontal() {
        return (this._android && this._android.orientation === 'horizontal');
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