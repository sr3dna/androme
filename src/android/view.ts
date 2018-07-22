import { Null, ObjectMap, StringMap } from '../lib/types';
import Node from '../base/node';
import { calculateBias, convertEnum, convertInt, convertPX, convertWord, formatPX, generateId, hasValue, isPercent, lastIndexOf, optional } from '../lib/util';
import API_ANDROID from './customizations';
import parseRTL from './localization';
import { BLOCK_ELEMENT, BOX_STANDARD, MAP_ELEMENT, NODE_STANDARD, OVERFLOW_ELEMENT } from '../lib/constants';
import { BOX_ANDROID, BUILD_ANDROID, FIXED_ANDROID, NODE_ANDROID } from './constants';

type T = View;

export default class View extends Node {
    public static getViewName(tagName: number): string {
        return NODE_ANDROID[NODE_STANDARD[tagName]];
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
        element?: Null<HTMLElement>)
    {
        super(id, element);
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

    public apply(options = {}) {
        const excluded = (<{}> super.apply(options));
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

    public anchor(position: string, adjacent?: string, orientation?: string, overwrite?: boolean) {
        if (overwrite == null) {
            overwrite = (adjacent === 'parent' || adjacent === 'true');
        }
        switch (this.renderParent.nodeName) {
            case NODE_ANDROID.CONSTRAINT:
                if (arguments.length === 1) {
                    return this.app(position);
                }
                this.app(position, adjacent, overwrite);
                break;
            case NODE_ANDROID.RELATIVE:
                if (arguments.length === 1) {
                    return this.android(position);
                }
                this.android(position, adjacent, overwrite);
                break;
        }
        if (hasValue(orientation)) {
            this.constraint[<string> orientation] = true;
        }
    }

    public modifyBox(area: number, offset: number, styleMap = false) {
        const value = convertEnum(BOX_STANDARD, BOX_ANDROID, area);
        if (value !== '') {
            const dimension = parseRTL(value);
            const total = formatPX(offset);
            this.android(dimension, total);
            if (styleMap) {
                this.css(dimension.replace('layout_', ''), total);
                this.setBounds(true);
            }
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

    public combine(...objs: string[]) {
        const result: string[] = [];
        this.namespaces.forEach(value => {
            const ns: StringMap = this[`_${value}`];
            if (objs.length === 0 || objs.includes(value)) {
                for (const attr in ns) {
                    if (value !== '_') {
                        result.push(`${value}:${attr}="${ns[attr]}"`);
                    }
                    else {
                        result.push(`${attr}="${ns[attr]}"`);
                    }
                }
            }
        });
        return result.sort((a, b) => {
            if (a.startsWith('android:id=')) {
                return -1;
            }
            else if (b.startsWith('android:id=')) {
                return 1;
            }
            else {
                return (a > b ? 1 : -1);
            }
        });
    }

    public applyCustomizations() {
        [API_ANDROID[this.api], API_ANDROID[0]].forEach(item => {
            if (item && item.customizations != null) {
                const customizations = item.customizations[this.nodeName];
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
            if (this.nodeName === View.getViewName(value)) {
                return true;
            }
        }
        return false;
    }

    public setNodeId(nodeName: string) {
        for (const type in NODE_ANDROID) {
            if (NODE_ANDROID[type] === nodeName && NODE_STANDARD[type] != null) {
                this.nodeType = NODE_STANDARD[type];
                break;
            }
        }
        super.nodeName = nodeName || this.nodeName;
        if (this.nodeId == null) {
            const element = (<HTMLInputElement> this.element);
            this.nodeId = convertWord(generateId('android', (element.id || element.name || `${lastIndexOf(this.nodeName, '.').toLowerCase()}_1`)));
        }
        this.android('id', this.stringId);
    }

    public setLayout(width?: number, height?: number) {
        if (!(this.renderParent instanceof View)) {
            return;
        }
        if (width == null) {
            width = (this.hasElement ? this.element.clientWidth + this.borderLeftWidth + this.borderRightWidth + this.marginLeft + this.marginRight : 0);
        }
        if (height == null) {
            height = (this.hasElement ? this.element.clientHeight + this.borderTopWidth + this.borderBottomWidth + this.marginTop + this.marginBottom : 0);
        }
        const parent = (<T> this.documentParent);
        const renderParent = (<T> this.renderParent);
        const widthParent = parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + parent.borderLeftWidth + parent.borderRightWidth);
        const heightParent = parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + parent.borderTopWidth + parent.borderBottomWidth);
        const wrapContent = parent.flex.enabled || parent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.GRID) || (parent.is(NODE_STANDARD.LINEAR) && parent.horizontal) || this.is(NODE_STANDARD.IMAGE);
        const styleMap = this.styleMap;
        const constraint = this.constraint;
        if (this.documentRoot && !this.flex.enabled && this.is(NODE_STANDARD.FRAME, NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE)) {
            if (this.viewWidth === 0 && !constraint.layoutWidth) {
                this.android('layout_width', 'match_parent', false);
            }
            if (this.viewHeight === 0 && !constraint.layoutHeight) {
                this.android('layout_height', 'match_parent', false);
            }
        }
        if (this.overflow !== OVERFLOW_ELEMENT.NONE && !this.is(NODE_STANDARD.TEXT)) {
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
            if (constraint.layoutWidth) {
                this.android('layout_width', (this.renderChildren.some(node => node.css('float') === 'right') || this.bounds.width >= widthParent ? 'match_parent' : formatPX(this.bounds.width)));
            }
            else if (this.android('layout_width') == null) {
                let maxRight = 0;
                let maxRightParent = 0;
                const parentMaxWidth = (parent.documentRoot ? parent.viewWidth : this.ascend().reduce((a: number, b: T) => Math.max(a, b.viewWidth), 0));
                if (parent.is(NODE_STANDARD.LINEAR) && !parent.horizontal) {
                    maxRight = Math.ceil(this.cascade().reduce((a: number, b: T) => Math.max(a, b.linear.right), 0));
                    maxRightParent = Math.floor(parent.cascade().reduce((a: number, b: T) => Math.max(a, b.linear.right), 0));
                }
                if (convertInt(this.android('layout_columnWeight')) > 0) {
                    this.android('layout_width', '0px');
                }
                else if (!wrapContent && (parent.overflow === OVERFLOW_ELEMENT.NONE && parentMaxWidth > 0 && width >= widthParent) || (!this.floating && (this.renderChildren.length === 0 || (maxRight !== 0 && maxRight >= maxRightParent)) && optional(this, 'style.display').indexOf('inline') === -1) && BLOCK_ELEMENT.includes(this.tagName)) {
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
            if (constraint.layoutHeight) {
                this.android('layout_height', (this.bounds.height >= heightParent ? 'match_parent' : formatPX(this.bounds.height)));
            }
            else if (this.android('layout_height') == null) {
                let layoutHeight = 'wrap_content';
                if (height >= heightParent) {
                    if ((parent.overflow === OVERFLOW_ELEMENT.NONE && parent.viewHeight && !FIXED_ANDROID.includes(this.nodeName) && (!renderParent.is(NODE_STANDARD.RELATIVE) && renderParent.android('layout_height') !== 'wrap_content'))) {
                        layoutHeight = 'match_parent';
                    }
                }
                this.android('layout_height', layoutHeight);
            }
        }
    }

    public setAlignment() {
        if (!(this.renderParent instanceof View)) {
            return;
        }
        const left = parseRTL('left');
        const right = parseRTL('right');
        function convertHorizontal(value: string) {
            switch (value) {
                case 'left':
                case 'start':
                    return left;
                case 'right':
                case 'end':
                    return right;
                case 'center':
                    return 'center_horizontal';
                default:
                    return '';
            }
        }
        const renderParent = (<T> this.renderParent);
        const textView = this.is(NODE_STANDARD.TEXT);
        let textAlign = this.styleMap.textAlign;
        let textAlignParent = '';
        const verticalAlign = this.styleMap.verticalAlign;
        if (!this.floating || textView) {
            let node: T = (<T> this.documentParent);
            while (node != null) {
                textAlignParent = node.styleMap.textAlign || textAlignParent;
                if (node.floating || hasValue(textAlign)) {
                    break;
                }
                node = (<T> node.documentParent);
            }
        }
        if (textAlign === '' && this.tagName === 'TH') {
            textAlign = 'center';
        }
        const horizontalParent = convertHorizontal(textAlignParent);
        let horizontal = convertHorizontal(textAlign);
        let vertical = '';
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
                if (this.hasElement && this.styleMap.lineHeight != null && (this.style.height === this.styleMap.lineHeight || convertInt(this.styleMap.lineHeight) === (this.box.bottom - this.box.top))) {
                    vertical = 'center_vertical';
                }
        }
        if (renderParent.tagName === 'TABLE') {
            this.android('layout_gravity', 'fill');
        }
        else {
            const gravityParent = (<string> (this.renderParent.android('gravity') || ''));
            let horizontalFloat = (this.css('float') === 'right' && gravityParent !== right ? right : '');
            let verticalFloat = '';
            if (horizontalFloat === '' && gravityParent.indexOf(horizontalParent) === -1 && !textView) {
                horizontalFloat = horizontal;
                horizontal = '';
            }
            if (vertical !== '' && renderParent instanceof View && renderParent.is(NODE_STANDARD.LINEAR, NODE_STANDARD.GRID, NODE_STANDARD.FRAME)) {
                verticalFloat = vertical;
                vertical = '';
            }
            const layoutGravity = [horizontalFloat, verticalFloat].filter(value => value).join('|');
            if (layoutGravity !== '') {
                this.android('layout_gravity', layoutGravity);
            }
        }
        if (this.renderChildren.length > 0 && !this.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE) && (this.renderChildren.every(item => item.css('float') === 'right') || (this.css('textAlign') === 'right' && this.renderChildren.every(item => item.css('display').indexOf('inline') !== -1)))) {
            this.android('gravity', right);
        }
        else {
            const gravity = [horizontal, vertical].filter(value => value);
            if (gravity.length > 0) {
                this.android('gravity', gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|'));
            }
        }
        if (this.android('layout_gravity') == null) {
            const marginLeft = this.css('marginLeft');
            const marginRight = this.css('marginRight');
            const margin = this.css('margin').split(' ');
            if ((marginLeft === 'auto' && marginRight === 'auto') || (marginLeft !== '0px' && marginLeft === marginRight && marginLeft === margin[1])) {
                this.android('layout_gravity', 'center_horizontal');
            }
        }
    }

    public mergeBoxSpacing() {
        if (this.api >= BUILD_ANDROID.OREO) {
            ['layout_margin', 'padding'].forEach((value, index) => {
                const leftRtl = parseRTL(`${value}Left`);
                const rightRtl = parseRTL(`${value}Right`);
                const top = (index === 0 && this.inline ? 0 : convertInt(this.android(`${value}Top`)));
                const right = convertInt(this.android(rightRtl));
                const bottom = (index === 0 && this.inline ? 0 : convertInt(this.android(`${value}Bottom`)));
                const left = convertInt(this.android(leftRtl));
                if (top !== 0 && top === bottom && bottom === left && left === right) {
                    this.delete('android', `${value}*`);
                    this.android(value, formatPX(top));
                }
                else {
                    if (index !== 0 || (this.renderParent instanceof View && !this.renderParent.is(NODE_STANDARD.GRID))) {
                        if (top !== 0 && top === bottom) {
                            this.delete('android', `${value}Top`, `${value}Bottom`);
                            this.android(`${value}Vertical`, formatPX(top));
                        }
                        if (left !== 0 && left === right) {
                            this.delete('android', leftRtl, rightRtl);
                            this.android(`${value}Horizontal`, formatPX(left));
                        }
                    }
                }
            });
        }
    }

    public setAccessibility() {
        const element = this.element;
        const nextElement = (<HTMLLabelElement> element.nextElementSibling);
        let labeled = false;
        if (nextElement && nextElement.htmlFor === element.id && element.tagName === 'INPUT') {
            const node = (<any> nextElement).__node;
            if (node.children.length === 0) {
                node.setNodeId(NODE_ANDROID.TEXT);
                this.css('marginRight', node.style.marginRight);
                this.css('paddingRight', node.style.paddingRight);
                this.label = node;
                node.hide();
                node.labelFor = this;
                labeled = true;
            }
        }
        switch (this.nodeName) {
            case NODE_ANDROID.EDIT:
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
                    if (label && label.is(NODE_STANDARD.TEXT)) {
                        label.android('labelFor', this.stringId);
                    }
                }
            case NODE_ANDROID.SELECT:
            case NODE_ANDROID.CHECKBOX:
            case NODE_ANDROID.RADIO:
            case NODE_ANDROID.BUTTON:
                if ((<HTMLInputElement> this.element).disabled) {
                    this.android('focusable', 'false');
                }
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
        return (hasValue(this.nodeId) ? `@+id/${this.nodeId}` : '');
    }

    set nodeName(value) {
        this._nodeName = value;
    }
    get nodeName() {
        if (this._nodeName != null) {
            return super.nodeName;
        }
        else {
            const value: number = MAP_ELEMENT[this.tagName];
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