import { Null, ObjectMap, StringMap } from '../lib/types';
import Node from '../base/node';
import { averageInt, calculateBias, convertEnum, convertInt, convertPX, convertWord, formatPX, generateId, hasValue, isPercent, lastIndexOf } from '../lib/util';
import API_ANDROID from './customizations';
import parseRTL from './localization';
import { BLOCK_CHROME, BOX_STANDARD, MAPPING_CHROME, VIEW_STANDARD, OVERFLOW_CHROME } from '../lib/constants';
import { BOX_ANDROID, BUILD_ANDROID, FIXED_ANDROID, VIEW_ANDROID } from './constants';

type T = View;

export default class View extends Node {
    public static getViewName(tagName: number): string {
        return VIEW_ANDROID[VIEW_STANDARD[tagName]];
    }

    public constraint: ObjectMap<any> = {};
    public labelFor: T;
    public children: T[] = [];
    public renderChildren: T[] = [];

    private _android: StringMap;
    private _app: StringMap;
    private _label: T;

    constructor(
        public id: number,
        public api: number,
        element?: Null<HTMLElement>,
        options?: ObjectMap<any>)
    {
        super(id, element, options);
    }

    public add(ns: string, attr: string, value = '', overwrite = true) {
        if (!this.supported(ns, attr)) {
            return false;
        }
        return super.add(ns, attr, value, overwrite);
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

    public apply(options: ObjectMap<any> = {}) {
        const excluded = (<ObjectMap<any>> super.apply(options));
        for (const obj in excluded) {
            this.attr(`${obj}="${excluded[obj]}"`);
        }
    }

    public attr(value: string, overwrite = true) {
        const match = value.match(/^(?:([a-z]+):)?(\w+)="((?:@+?[a-z]+\/)?.+)"$/);
        if (match != null) {
            this.add(match[1] || '_', match[2], match[3], overwrite);
        }
    }

    public anchor(position: string, adjacent: StringMap = {}, orientation = '', overwrite?: boolean) {
        if (overwrite == null) {
            overwrite = (adjacent.stringId === 'parent');
        }
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
        const value = convertEnum(BOX_STANDARD, BOX_ANDROID, area);
        if (value !== '') {
            const dimen = parseRTL(value);
            const total = formatPX(offset + convertInt(this.android(dimen)));
            this.css(dimen, total);
            this.android(dimen, total);
            this.setBounds(true);
        }
    }

    public boxValue(area: number) {
        const value = convertEnum(BOX_STANDARD, BOX_ANDROID, area);
        if (value !== '') {
            const dimen = parseRTL(value);
            return [dimen, (<string> this.android(dimen)) || '0px'];
        }
        return ['', '0px'];
    }

    public supported(ns: string, attr: string) {
        if (this.api > 0) {
            for (let i = this.api + 1; i <= BUILD_ANDROID.LATEST; i++) {
                const version = API_ANDROID[i];
                if (version && version[ns] && version[ns].includes(attr)) {
                    return false;
                }
            }
        }
        return true;
    }

    public combine() {
        const result: string[] = [];
        this.namespaces.forEach(value => {
            const ns: StringMap = this[`_${value}`];
            for (const attr in ns) {
                if (value !== '_') {
                    result.push(`${value}:${attr}="${ns[attr]}"`);
                }
                else {
                    result.push(`${attr}="${ns[attr]}"`);
                }
            }
        });
        return result.sort((a, b) => {
            if (a.startsWith('android:id=')) {
                return -1;
            }
            else {
                return (a > b ? 1 : -1);
            }
        });
    }

    public applyCustomizations() {
        [API_ANDROID[this.api], API_ANDROID[0]].forEach(item => {
            if (item && item.customizations != null) {
                const customizations = item.customizations[this.viewName];
                if (customizations != null) {
                    for (const ns in customizations) {
                        for (const attr in customizations[ns]) {
                            this.add(ns, attr, customizations[ns][attr], false);
                        }
                    }
                }
            }
        });
    }

    public is(...views: number[]) {
        for (const value of views) {
            if (this.viewName === View.getViewName(value)) {
                return true;
            }
        }
        return false;
    }

    public setViewId(viewName: string) {
        super.viewName = viewName || this.viewName;
        if (this.viewId == null) {
            const element = (<HTMLInputElement> this.element);
            this.viewId = convertWord(generateId('android', (element.id || element.name || `${lastIndexOf(this.viewName, '.').toLowerCase()}_1`)));
        }
        this.android('id', this.stringId);
    }

    public setViewLayout(options?: ObjectMap<any>) {
        const styleMap = this.styleMap;
        let parent: T;
        let width: number;
        let height: number;
        let wrapContent: boolean;
        const renderParent = this.renderParent;
        if (renderParent == null || renderParent === true) {
            return;
        }
        const constraint = this.constraint;
        if (options != null) {
            parent = options.parent;
            [width, height] = [options.width, options.height];
            wrapContent = options.wrapContent;
        }
        else {
            parent = (<T> this.parent);
            width = (this.hasElement ? this.element.clientWidth + this.marginLeft + this.marginRight + this.borderLeftWidth + this.borderRightWidth : 0);
            height = (this.hasElement ? this.element.clientHeight + this.marginTop + this.marginBottom + this.borderTopWidth + this.borderBottomWidth : 0);
            wrapContent = parent.is(VIEW_STANDARD.CONSTRAINT, VIEW_STANDARD.GRID);
        }
        const parentWidth = (!this.documentRoot ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + parent.borderLeftWidth + parent.borderRightWidth) : Number.MAX_VALUE);
        const parentHeight = (!this.documentRoot ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + parent.borderTopWidth + parent.borderBottomWidth) : Number.MAX_VALUE);
        if (this.documentRoot && this.viewWidth === 0 && this.viewHeight === 0 && this.is(VIEW_STANDARD.CONSTRAINT, VIEW_STANDARD.RELATIVE, VIEW_STANDARD.FRAME)) {
            this.android('layout_width', 'match_parent');
            this.android('layout_height', 'match_parent');
        }
        else if (this.overflow !== OVERFLOW_CHROME.NONE && !this.is(VIEW_STANDARD.TEXT)) {
            this.android('layout_width', (this.horizontal ? 'wrap_content' : 'match_parent'));
            this.android('layout_height', (this.horizontal ? 'match_parent' : 'wrap_content'));
        }
        else {
            if (this.android('layout_width') !== '0px') {
                if (hasValue(styleMap.width)) {
                    if (isPercent(styleMap.width)) {
                        if (renderParent.tagName === 'TABLE') {
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
                if (hasValue(styleMap.minWidth) && !isPercent(styleMap.minWidth) && !constraint.minWidth) {
                    this.android('layout_width', 'wrap_content', false);
                    this.android('minWidth', convertPX(styleMap.minWidth), false);
                }
                if (hasValue(styleMap.maxWidth) && !isPercent(styleMap.maxWidth) && !constraint.maxWidth) {
                    this.android('maxWidth', convertPX(styleMap.maxWidth), false);
                }
            }
            if (constraint.layoutWidth && (!this.flex.enabled || constraint.expand)) {
                if (constraint.layoutWidth) {
                    this.android('layout_width', (this.renderChildren.some(node => node.css('float') === 'right') || this.bounds.width >= parentWidth ? 'match_parent' : formatPX(this.bounds.width)));
                }
                else {
                    this.android('layout_width', 'wrap_content', false);
                }
            }
            else if (this.android('layout_width') == null) {
                if (!wrapContent && !(parent.is(VIEW_STANDARD.LINEAR) && parent.horizontal) && ((parent.overflow === OVERFLOW_CHROME.NONE && width > 0 && width >= parentWidth) || (this.hasElement && BLOCK_CHROME.includes(this.tagName) && (<any> this.style).display.indexOf('inline') === -1 && !this.floating))) {
                    this.android('layout_width', 'match_parent');
                }
                else {
                    this.android('layout_width',  'wrap_content');
                }
            }
            if (this.android('layout_height') !== '0px') {
                if (hasValue(styleMap.height) || hasValue(styleMap.lineHeight)) {
                    if (isPercent(styleMap.height) || isPercent(styleMap.lineHeight)) {
                        if (renderParent.tagName === 'TABLE') {
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
                if (hasValue(styleMap.minHeight) && !isPercent(styleMap.minHeight) && !constraint.minHeight) {
                    this.android('layout_height', 'wrap_content', false);
                    this.android('minHeight', convertPX(styleMap.minHeight), false);
                }
                if (hasValue(styleMap.maxHeight) && !isPercent(styleMap.maxHeight) && !constraint.maxHeight) {
                    this.android('maxHeight', convertPX(styleMap.maxHeight), false);
                }
            }
            if (constraint.layoutHeight && (!this.flex.enabled || constraint.expand)) {
                this.android('layout_height', (constraint.layoutHeight ? formatPX(this.bounds.height) : 'wrap_content'), constraint.layoutHeight);
            }
            else if (this.android('layout_height') == null) {
                let layoutHeight = 'wrap_content';
                if (height >= parentHeight) {
                    if (!wrapContent) {
                        if (parent.hasElement && parent.overflow === OVERFLOW_CHROME.NONE && !FIXED_ANDROID.includes(this.viewName) && (!renderParent.is(VIEW_STANDARD.RELATIVE) && renderParent.android('layout_height') !== 'wrap_content')) {
                            layoutHeight = 'match_parent';
                        }
                        else if (this.parentOriginal.flex.enabled) {
                            layoutHeight = '0px';
                        }
                    }
                }
                this.android('layout_height', layoutHeight);
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
        this.setGravity();
    }

    public setGravity() {
        const renderParent = this.renderParent;
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
        if (textAlign === '' && this.tagName === 'TH') {
            textAlign = 'center';
        }
        if (this.renderChildren.length > 0 && this.floating) {
            textAlign = this.css('float');
        }
        if (hasValue(verticalAlign) || hasValue(textAlign)) {
            let horizontal = '';
            let vertical = '';
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
                    if (this.hasElement && (this.style.height === this.style.lineHeight || convertInt(this.style.lineHeight) === (this.box.bottom - this.box.top))) {
                        vertical = 'center_vertical';
                    }
            }
            switch (renderParent.viewName) {
                case VIEW_ANDROID.GRID:
                    if (renderParent.tagName === 'TABLE') {
                        this.android('layout_gravity', 'fill');
                    }
                    else {
                        if (this.viewName !== VIEW_ANDROID.TEXT && (!this.floating || parseRTL(this.css('float')) === horizontal)) {
                            if (horizontal !== '') {
                                this.android('layout_gravity', horizontal);
                                horizontal = '';
                            }
                            if (vertical !== '') {
                                this.android('layout_gravity', vertical);
                                vertical = '';
                            }
                        }
                    }
                    break;
            }
            const gravity = [horizontal, vertical].filter(value => value !== '');
            if (gravity.length > 0) {
                this.android('gravity', (gravity.length === 2 ? 'center' : gravity[0]));
            }
            if (this.renderChildren.length > 0 && !this.is(VIEW_STANDARD.CONSTRAINT, VIEW_STANDARD.RELATIVE)) {
                if (this.renderChildren.every(item => item.css('float') === 'right')) {
                    this.android('gravity', parseRTL('right'));
                }
                else if (horizontal !== '' && horizontal !== 'start') {
                    this.android('gravity', horizontal);
                }
            }
        }
    }

    public setAccessibility() {
        const element = this.element;
        const nextElement = (<HTMLLabelElement> element.nextElementSibling);
        let labeled = false;
        if (nextElement && nextElement.htmlFor === element.id && element.tagName === 'INPUT') {
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
                    let label: Null<T> = null;
                    while (parent && parent.renderChildren != null) {
                        const index = parent.renderChildren.findIndex(node => node === current);
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

    set label(value: T) {
        this._label = value;
        value.companion = true;
        value.labelFor = this;
    }
    get label() {
        return this._label;
    }

    get stringId() {
        return (hasValue(this.viewId) ? `@+id/${this.viewId}` : '');
    }

    set viewName(value) {
        this._viewName = value;
    }
    get viewName() {
        if (this._viewName != null) {
            return super.viewName;
        }
        else {
            const value: number = MAPPING_CHROME[this.tagName];
            return (value != null ? View.getViewName(value) : '');
        }
    }

    get anchored() {
        return (this.constraint.horizontal && this.constraint.vertical);
    }

    get horizontal() {
        return (this._android && this._android.orientation === 'horizontal');
    }

    get horizontalBias() {
        const parent = this.renderParent;
        if (parent instanceof View && parent.visible) {
            const left = this.linear.left - parent.box.left;
            const right = parent.box.right - this.linear.right;
            return calculateBias(left, right);
        }
        return 0.5;
    }
    get verticalBias() {
        const parent = this.renderParent;
        if (parent instanceof View && parent.visible) {
            const top = this.linear.top - parent.box.top;
            const bottom = parent.box.bottom - this.linear.bottom;
            return calculateBias(top, bottom);
        }
        return 0.5;
    }
}