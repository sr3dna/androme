import { Null, ObjectMap, StringMap } from '../lib/types';
import Node from '../base/node';
import { calculateBias, convertEnum, convertFloat, convertInt, convertPX, convertWord, formatPX, generateId, hasValue, isPercent, lastIndexOf } from '../lib/util';
import API_ANDROID from './customizations';
import parseRTL from './localization';
import { BLOCK_ELEMENT, BOX_STANDARD, MAP_ELEMENT, NODE_STANDARD, OVERFLOW_ELEMENT } from '../lib/constants';
import { AXIS_ANDROID, BOX_ANDROID, BUILD_ANDROID, FIXED_ANDROID, NODE_ANDROID } from './constants';

type T = View;

export default class View extends Node {
    public static documentBody() {
        if (View._documentBody == null) {
            const body = new View(0, 0, document.body);
            body.hide();
            body.setBounds();
            View._documentBody = body;
        }
        return View._documentBody;
    }

    public static getViewName(tagName: number): string {
        return NODE_ANDROID[NODE_STANDARD[tagName]];
    }

    private static _documentBody: T;

    public constraint: ObjectMap<any> = {};
    public children: T[] = [];
    public renderChildren: T[] = [];

    private _android: StringMap;
    private _app: StringMap;

    constructor(
        public id: number,
        public api: number,
        element?: Null<HTMLElement>)
    {
        super(id, element);
    }

    public add(ns: string, attr: string, value = '', overwrite = true) {
        if (!this.supported(ns, attr)) {
            return;
        }
        super.add(ns, attr, value, overwrite);
    }

    public android(attr: string = '', value: string = '', overwrite = true) {
        if (hasValue(value)) {
            this.add('android', attr, value, overwrite);
        }
        else {
            return (this._android && this._android[attr] != null ? this._android[attr] : null);
        }
    }

    public app(attr: string = '', value: string = '', overwrite = true) {
        if (hasValue(value)) {
            this.add('app', attr, value, overwrite);
        }
        else {
            return (this._app && this._app[attr] != null ? this._app[attr] : null);
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
            if (total !== '0px') {
                this.android(dimension, total);
            }
            else {
                this.delete('android', dimension);
            }
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

    public clone(): T {
        const node = new View(this.id, this.api, this.element);
        node.nodeId = this.nodeId;
        node.nodeType = this.nodeType;
        node.nodeName = this.nodeName;
        node.depth = this.depth;
        node.rendered = this.rendered;
        node.renderDepth = this.renderDepth;
        node.renderParent = this.renderParent;
        node.renderExtension = this.renderExtension;
        node.visible = this.visible;
        node.documentRoot = this.documentRoot;
        node.documentParent = this.documentParent;
        node.children = this.children;
        node.inherit(this, 'base', 'style', 'styleMap');
        return node;
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
        if (width == null) {
            width = (this.hasElement ? this.element.clientWidth + this.borderLeftWidth + this.borderRightWidth + this.marginLeft + this.marginRight : 0);
        }
        if (height == null) {
            height = (this.hasElement ? this.element.clientHeight + this.borderTopWidth + this.borderBottomWidth + this.marginTop + this.marginBottom : 0);
        }
        const styleMap = this.styleMap;
        const constraint = this.constraint;
        const parent = (<T> this.documentParent);
        const widthParent = parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + parent.borderLeftWidth + parent.borderRightWidth);
        const heightParent = parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + parent.borderTopWidth + parent.borderBottomWidth);
        const renderParent = (<T> this.renderParent);
        if ((this.documentRoot && !this.flex.enabled && this.is(NODE_STANDARD.FRAME, NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE, NODE_STANDARD.SCROLL_VERTICAL, NODE_STANDARD.SCROLL_HORIZONTAL, NODE_STANDARD.SCROLL_NESTED)) || this.element === document.body) {
            if (this.viewWidth === 0) {
                this.android('layout_width', 'match_parent', false);
            }
            if (this.viewHeight === 0 && !constraint.layoutHeight) {
                this.android('layout_height', 'match_parent', false);
            }
        }
        if (this.overflow !== OVERFLOW_ELEMENT.NONE && this.nodeType >= NODE_STANDARD.BLOCK) {
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
                this.android('layout_width', (this.renderChildren.some(node => node.float === 'right') || this.bounds.width >= widthParent ? 'match_parent' : formatPX(this.bounds.width)), false);
            }
            else if (this.android('layout_width') == null) {
                let maxRight = 0;
                let maxRightParent = 0;
                const maxWidthParent = (parent.documentRoot ? parent.viewWidth : this.ascend().reduce((a: number, b: T) => Math.max(a, b.viewWidth), 0));
                const linearParent = renderParent.is(NODE_STANDARD.LINEAR);
                if (linearParent && !renderParent.horizontal) {
                    maxRight = Math.floor(this.cascade().filter(node => node.visible).reduce((a: number, b: T) => Math.max(a, b.bounds.right), 0));
                    maxRightParent = Math.floor(parent.cascade().filter((node: T) => node.visible && !parent.children.includes(node)).reduce((a: number, b: T) => Math.max(a, b.bounds.right), 0));
                }
                const display = this.css('display');
                const wrapContent = (this.nodeType <= NODE_STANDARD.INLINE || display === 'table' || display.indexOf('inline') !== -1) || (renderParent.android('layout_width') === 'wrap_content' && this.inline) || parent.flex.enabled || renderParent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.GRID) || (linearParent && renderParent.horizontal);
                if (convertFloat(this.android('layout_columnWeight')) > 0) {
                    this.android('layout_width', '0px', false);
                }
                else if (!wrapContent && ((parent.overflow === OVERFLOW_ELEMENT.NONE && (maxWidthParent > 0 || this.parentElement === document.body) && width >= widthParent) || (!this.floating && display.indexOf('inline') === -1) && BLOCK_ELEMENT.includes(this.tagName) && (this.renderChildren.length === 0 || (maxRight !== 0 && maxRight < maxRightParent)))) {
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
                this.android('layout_height', (this.bounds.height >= heightParent ? 'match_parent' : formatPX(this.bounds.height)), false);
            }
            else if (this.android('layout_height') == null) {
                if (height >= heightParent && parent.overflow === OVERFLOW_ELEMENT.NONE && parent.viewHeight && !FIXED_ANDROID.includes(this.nodeName) && !renderParent.is(NODE_STANDARD.RELATIVE) && renderParent.android('layout_height') !== 'wrap_content') {
                    this.android('layout_height', 'match_parent');
                }
                else {
                    this.android('layout_height', 'wrap_content');
                }
            }
        }
    }

    public setAlignment() {
        const right = parseRTL('right');
        function convertHorizontal(value: string) {
            switch (value) {
                case 'left':
                case 'start':
                    return parseRTL('left');
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
            let parent: T = (<T> this.documentParent);
            do {
                textAlignParent = parent.styleMap.textAlign;
                if (parent.id === 0 || parent.floating || hasValue(textAlignParent)) {
                    break;
                }
                parent = (<T> parent.documentParent);
            }
            while (true);
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
        const constraintRight = (renderParent.app(parseRTL('layout_constraintRight_toRightOf')) === 'parent');
        if (renderParent.tagName === 'TABLE') {
            this.android('layout_gravity', 'fill');
        }
        else {
            let horizontalFloat = '';
            let verticalFloat = '';
            if (!constraintRight) {
                const gravityParent = (<string> (renderParent.android('gravity') || ''));
                horizontalFloat = ((this.float === 'right' && gravityParent !== right) || (!this.floating && this.dir === 'rtl') ? right : '');
                if (horizontalFloat === '' && !textView && gravityParent.indexOf(horizontalParent) === -1) {
                    horizontalFloat = horizontal;
                    horizontal = '';
                }
            }
            if (vertical !== '' && renderParent.is(NODE_STANDARD.LINEAR, NODE_STANDARD.GRID, NODE_STANDARD.FRAME)) {
                verticalFloat = vertical;
                vertical = '';
            }
            const layoutGravity = [horizontalFloat, verticalFloat].filter(value => value).join('|');
            if (layoutGravity !== '') {
                this.android('layout_gravity', layoutGravity);
            }
        }
        if (this.renderChildren.length > 0 && !constraintRight && !this.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE) && (this.renderChildren.every(item => item.float === 'right') || (this.css('textAlign') === 'right' && this.renderChildren.every(item => item.css('display').indexOf('inline') !== -1)))) {
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
            if ((marginLeft === 'auto' && marginRight === 'auto') || (this.is(NODE_STANDARD.LINE) && marginLeft !== '0px' && marginLeft === marginRight && marginLeft === margin[1])) {
                this.android('layout_gravity', 'center_horizontal');
            }
        }
    }

    public mergeBoxSpacing() {
        ['layout_margin', 'padding'].forEach((value, index) => {
            const leftRtl = parseRTL(`${value}Left`);
            const rightRtl = parseRTL(`${value}Right`);
            let top = (index === 0 && this.inline ? 0 : convertInt(this.android(`${value}Top`)));
            let right = convertInt(this.android(rightRtl));
            let bottom = (index === 0 && this.inline ? 0 : convertInt(this.android(`${value}Bottom`)));
            let left = convertInt(this.android(leftRtl));
            if (index === 1) {
                if (this.viewWidth === 0) {
                    if (this.borderLeftWidth > 0) {
                        left += this.borderLeftWidth;
                    }
                    if (this.borderRightWidth > 0) {
                        right += this.borderRightWidth;
                    }
                }
                if (this.viewHeight === 0) {
                    if (this.borderTopWidth > 0) {
                        top += this.borderBottomWidth;
                    }
                    if (this.borderBottomWidth > 0) {
                        bottom += this.borderBottomWidth;
                    }
                }
            }
            if (this.api >= BUILD_ANDROID.OREO) {
                if (top !== 0 && top === bottom && bottom === left && left === right) {
                    this.delete('android', `${value}*`);
                    this.android(value, formatPX(top));
                }
                else {
                    if (index !== 0 || !this.renderParent.is(NODE_STANDARD.GRID)) {
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
            }
        });
    }

    public setAccessibility() {
        const node = (<T> this);
        const element = this.element;
        switch (this.nodeName) {
            case NODE_ANDROID.EDIT:
                if (node.companion == null) {
                    let parent = (<T> this.renderParent);
                    let current = (<T> this);
                    let label: Null<T> = null;
                    while (parent instanceof View && parent.renderChildren.length > 0) {
                        const index = parent.renderChildren.findIndex(item => item === current);
                        if (index > 0) {
                            label = parent.renderChildren[index - 1];
                            break;
                        }
                        current = parent;
                        parent = (<T> parent.renderParent);
                    }
                    if (label && label.is(NODE_STANDARD.TEXT) && (<HTMLLabelElement> label.element).htmlFor === node.element.id) {
                        label.android('labelFor', this.stringId);
                    }
                }
            case NODE_ANDROID.SELECT:
            case NODE_ANDROID.CHECKBOX:
            case NODE_ANDROID.RADIO:
            case NODE_ANDROID.BUTTON:
                if ((<HTMLInputElement> element).disabled) {
                    this.android('focusable', 'false');
                }
                break;
        }
    }

    public alignBaseline(nodes: T[]) {
        let childIndex = -1;
        nodes.some((item: T, index) => {
            if (item.is(NODE_STANDARD.LINEAR) && item.android('baselineAlignedChildIndex') != null) {
                childIndex = index;
            }
            else if (item.nodeType <= NODE_STANDARD.TEXT) {
                switch (item.css('verticalAlign')) {
                    case 'baseline':
                    case 'sub':
                    case 'super':
                        if (childIndex === -1 && item.nodeType <= NODE_STANDARD.BUTTON) {
                            childIndex = index;
                        }
                        break;
                    default:
                        childIndex = -1;
                        return true;
                }
            }
            return false;
        });
        if (childIndex !== -1) {
            this.android('baselineAlignedChildIndex', childIndex.toString());
            if (this.renderParent.is(NODE_STANDARD.LINEAR) && this.renderParent.horizontal) {
                this.renderParent.alignBaseline(this.renderParent.renderChildren);
            }
        }
    }

    protected appendChild(node: T) {
        super.appendChild(node);
        switch (this.nodeName) {
            case NODE_ANDROID.LINEAR:
                if (this.horizontal) {
                    this.alignBaseline(this.renderChildren);
                }
                break;
        }
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

    set documentParent(value: T) {
        this._documentParent = value;
    }
    get documentParent() {
        if (this._documentParent != null) {
            return (<T> this._documentParent);
        }
        else if (this.id === 0) {
            return this;
        }
        else if (this.absolute) {
            return (<T> this.parent);
        }
        else {
            let parent: Null<HTMLElement> = this.element.parentElement;
            while (parent != null) {
                const node: T = (<any> parent).__node;
                if (node != null) {
                    return node;
                }
                parent = parent.parentElement;
            }
        }
        return View.documentBody();
    }

    set renderParent(value: T) {
        if (value !== this && value.renderChildren.indexOf(this) === -1) {
            value.appendChild(this);
        }
        this._renderParent = value;
    }
    get renderParent() {
        if (this._renderParent != null) {
            return (<T> this._renderParent);
        }
        else {
            const node = new View(0, this.api);
            node.hide();
            return node;
        }
    }

    get anchored() {
        return (this.constraint.horizontal && this.constraint.vertical);
    }

    get horizontal() {
        return (this._android && this._android.orientation === AXIS_ANDROID.HORIZONTAL);
    }

    get horizontalBias() {
        const parent = this.documentParent;
        if (parent !== this) {
            const left = this.linear.left - parent.box.left;
            const right = parent.box.right - this.linear.right;
            return calculateBias(left, right);
        }
        return 0.5;
    }
    get verticalBias() {
        const parent = this.documentParent;
        if (parent !== this) {
            const top = this.linear.top - parent.box.top;
            const bottom = parent.box.bottom - this.linear.bottom;
            return calculateBias(top, bottom);
        }
        return 0.5;
    }
}