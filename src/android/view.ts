import { Null, ObjectMap, StringMap } from '../lib/types';
import Node from '../base/node';
import { capitalize, convertEnum, convertFloat, convertInt, convertWord, formatPX, hasValue, includesEnum, isPercent, lastIndexOf, sortAsc, withinFraction } from '../lib/util';
import { calculateBias, generateId } from './lib/util';
import { getNode, getStyle } from '../lib/dom';
import API_ANDROID from './customizations';
import parseRTL from './localization';
import { BLOCK_ELEMENT, BOX_STANDARD, MAP_ELEMENT, NODE_RESOURCE, NODE_STANDARD } from '../lib/constants';
import { AXIS_ANDROID, BOX_ANDROID, BUILD_ANDROID, NODE_ANDROID, RESERVED_JAVA } from './constants';

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

    public static getNodeName(tagName: number): string {
        return NODE_ANDROID[NODE_STANDARD[tagName]];
    }

    private static _documentBody: T;

    public constraint: ObjectMap<any> = { current: {} };
    public children: T[] = [];
    public renderChildren: T[] = [];

    private _android: StringMap;
    private _app: StringMap;

    constructor(
        public id: number,
        public api: number,
        element?: HTMLElement)
    {
        super(id, element);
    }

    public add(obj: string, attr: string, value = '', overwrite = true) {
        if (!this.supported(obj, attr)) {
            return;
        }
        super.add(obj, attr, value, overwrite);
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
        const local = Object.assign({}, options);
        super.apply(local);
        for (const obj in local) {
            this.attr(`${obj}="${local[obj]}"`);
        }
    }

    public attr(value: string, overwrite = true) {
        const match = value.match(/^(?:([a-z]+):)?(\w+)="((?:@+?[a-z]+\/)?.+)"$/);
        if (match != null) {
            this.add(match[1] || '_', match[2], match[3], overwrite);
        }
    }

    public anchor(position: string, adjacent?: string, orientation?: string, overwrite?: boolean) {
        if (arguments.length === 1 || this.constraint.current[position] == null || !this.constraint.current[position].overwrite || (orientation && !this.constraint[orientation])) {
            if (overwrite == null) {
                overwrite = (adjacent === 'parent' || adjacent === 'true');
            }
            this[(this.renderParent.nodeName === NODE_ANDROID.RELATIVE ? 'android' : 'app')](position, adjacent, overwrite);
            if (orientation) {
                this.constraint[orientation] = true;
            }
            this.constraint.current[position] = { adjacent, orientation, overwrite };
        }
    }

    public alignParent(position: string) {
        if (this.renderParent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE)) {
            const relative = (this.renderParent.nodeName === NODE_ANDROID.RELATIVE);
            position = capitalize(position);
            position = (relative ? `layout_alignParent${position}` : `layout_constraint${position}_to${position}Of`);
            return (this[(relative ? 'android' : 'app')](parseRTL(position)) === (relative ? 'true' : 'parent'));
        }
        return false;
    }

    public modifyBox(area: number, offset: number, bounds = false) {
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
            this.css(value.replace('layout_', ''), total);
            if (bounds) {
                this.setBounds(true);
            }
        }
    }

    public boxValue(area: number) {
        const value = convertEnum(BOX_STANDARD, BOX_ANDROID, area);
        if (value !== '') {
            const dimen = parseRTL(value);
            return [dimen, this.android(dimen) || '0px'];
        }
        return ['', '0px'];
    }

    public supported(obj: string, attr: string) {
        if (this.api > 0) {
            for (let i = this.api + 1; i <= BUILD_ANDROID.LATEST; i++) {
                const version = API_ANDROID[i];
                if (version && version[obj] && version[obj].includes(attr)) {
                    return false;
                }
            }
        }
        return true;
    }

    public combine(...objs: string[]) {
        const result: string[] = [];
        this._namespaces.forEach(value => {
            const obj: StringMap = this[`_${value}`];
            if (objs.length === 0 || objs.includes(value)) {
                for (const attr in obj) {
                    if (value !== '_') {
                        result.push(`${value}:${attr}="${obj[attr]}"`);
                    }
                    else {
                        result.push(`${attr}="${obj[attr]}"`);
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

    public applyCustomizations(overwrite = false) {
        [API_ANDROID[this.api], API_ANDROID[0]].forEach(build => {
            if (build && build.customizations != null) {
                [this.element.tagName, this.nodeName].forEach(nodeName => {
                    const customizations = build.customizations[nodeName];
                    if (customizations != null) {
                        for (const obj in customizations) {
                            for (const attr in customizations[obj]) {
                                this.add(obj, attr, customizations[obj][attr], overwrite);
                            }
                        }
                    }
                });
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
        node.children = this.children.slice();
        node.inherit(this, 'base', 'style', 'styleMap');
        return node;
    }

    public is(...views: number[]) {
        for (const value of views) {
            if (this.nodeType === value) {
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
            const element = <HTMLInputElement> this.element;
            let name = (element.id || element.name || '').trim();
            if (name && RESERVED_JAVA.includes(name)) {
                name += '_1';
            }
            this.nodeId = convertWord(generateId('android', (name || `${lastIndexOf(this.nodeName, '.').toLowerCase()}_1`)));
        }
        this.android('id', this.stringId);
    }

    public setLayout(width?: number, height?: number) {
        if (this.nodeType >= NODE_STANDARD.SCROLL_HORIZONTAL) {
            if (this.is(NODE_STANDARD.SCROLL_HORIZONTAL)) {
                this.android('layout_width', this.styleMap.width);
                this.android('layout_height', 'wrap_content');
            }
            else {
                this.android('layout_width', 'wrap_content');
                this.android('layout_height', this.styleMap.height);
            }
        }
        else if (this.renderParent.nodeType >= NODE_STANDARD.SCROLL_HORIZONTAL) {
            if (this.renderParent.is(NODE_STANDARD.SCROLL_HORIZONTAL)) {
                this.android('layout_width', 'wrap_content', false);
                this.android('layout_height', 'match_parent', false);
            }
            else {
                this.android('layout_width', 'match_parent', false);
                this.android('layout_height', 'wrap_content', false);
            }
        }
        else {
            const styleMap = this.styleMap;
            const constraint = this.constraint;
            const parent = this.documentParent;
            const renderParent = this.renderParent;
            const widthParent = (parent.box ? parent.box.width : (parent.hasElement ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + parent.borderLeftWidth + parent.borderRightWidth) : 0));
            const heightParent = (parent.box ? parent.box.height : (parent.hasElement ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + parent.borderTopWidth + parent.borderBottomWidth) : 0));
            if (width == null) {
                width = (this.linear ? this.linear.width : (this.hasElement ? this.element.clientWidth + this.borderLeftWidth + this.borderRightWidth + this.marginLeft + this.marginRight : 0));
            }
            if (height == null) {
                height = (this.linear ? this.linear.height : (this.hasElement ? this.element.clientHeight + this.borderTopWidth + this.borderBottomWidth + this.marginTop + this.marginBottom : 0));
            }
            if ((this.documentRoot && !this.flex.enabled && this.is(NODE_STANDARD.FRAME, NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE)) || this.documentBody) {
                if (this.viewWidth === 0 && !constraint.layoutHorizontal) {
                    this.android('layout_width', 'match_parent', false);
                }
                if (this.viewHeight === 0 && !constraint.layoutHeight && !constraint.layoutVertical) {
                    this.android('layout_height', 'match_parent', false);
                }
            }
            if (this.android('layout_width') !== '0px') {
                if (this.isSet('styleMap', 'width')) {
                    if (isPercent(styleMap.width)) {
                        if (renderParent.element.tagName === 'TABLE') {
                            this.android('layout_columnWeight', (convertInt(styleMap.width) / 100).toFixed(2));
                            this.android('layout_width', '0px');
                        }
                        else if (styleMap.width === '100%') {
                            this.android('layout_width', 'match_parent');
                            if (styleMap.height == null) {
                                switch (this.nodeName) {
                                    case NODE_ANDROID.IMAGE:
                                        this.android('layout_height', 'match_parent');
                                        break;
                                }
                            }
                        }
                        else {
                            this.android('layout_width', this.style.width || 'wrap_content');
                        }
                    }
                    else if (convertInt(styleMap.width) > 0) {
                        this.android('layout_width', styleMap.width);
                    }
                    else if (styleMap.width === 'auto') {
                        this.android('layout_width', (!this.inlineElement && this.pageflow && BLOCK_ELEMENT.includes(this.element.tagName) && !this.autoMargin ? 'match_parent' : 'wrap_content'), false);
                    }
                }
                if (this.isSet('styleMap', 'minWidth') && !isPercent(styleMap.minWidth) && !constraint.minWidth) {
                    this.android('layout_width', 'wrap_content', false);
                    this.android('minWidth', styleMap.minWidth, false);
                }
                if (this.isSet('styleMap', 'maxWidth') && !isPercent(styleMap.maxWidth) && !constraint.maxWidth) {
                    this.android('maxWidth', styleMap.maxWidth, false);
                }
            }
            if (constraint.layoutWidth) {
                if (constraint.layoutHorizontal) {
                    this.android('layout_width', (this.documentParent.viewWidth > 0 ? 'match_parent' : 'wrap_content'), false);
                }
                else {
                    this.android('layout_width', (this.bounds.width >= widthParent ? 'match_parent' : formatPX(this.bounds.width)), false);
                }
            }
            else if (this.android('layout_width') == null) {
                const widthRoot = (parent.documentRoot ? parent.viewWidth : this.ascend().reduce((a: number, b: T) => Math.max(a, b.viewWidth), 0));
                const rightInline = Math.max.apply(null, [0, ...this.renderChildren.filter(node => node.inlineElement).map(node => node.linear.right)]);
                const blockElement = (!this.inlineElement || (this.display === 'block' && !this.floating));
                const wrap = (this.nodeType <= NODE_STANDARD.INLINE || this.inlineElement || !this.pageflow || this.display === 'table' || parent.flex.enabled || (renderParent.inlineElement && renderParent.viewWidth === 0 && !this.inlineElement && this.nodeType > NODE_STANDARD.BLOCK) || renderParent.is(NODE_STANDARD.GRID) || renderParent.linearHorizontal);
                const widestChild: T[] = [];
                if (blockElement && renderParent.linearVertical) {
                    let widest = 0;
                    renderParent.children.forEach(node => {
                        const widthInside = node.cascade().filter(item => item.visible).reduce((a: number, b: T) => Math.max(a, b.linear.right), 0) + node.paddingRight + node.borderRightWidth + node.marginRight;
                        if (widthInside > widest) {
                            widestChild.length = 0;
                            widestChild.push(node);
                            widest = widthInside;
                        }
                        else if (widthInside === widest) {
                            widestChild.push(node);
                        }
                    });
                }
                if (convertFloat(this.android('layout_columnWeight')) > 0) {
                    this.android('layout_width', '0px');
                }
                else if (!wrap && (
                            (blockElement && (this.is(NODE_STANDARD.TEXT) || !widestChild.includes(this) || this.renderParent.android('layout_width') === 'match_parent')) ||
                            ((widthRoot > 0 || this.documentParent.documentBody || this.renderParent.documentRoot) && width >= widthParent) ||
                            (rightInline > 0 && ((this.is(NODE_STANDARD.FRAME) || this.linearVertical) && !withinFraction(rightInline, this.box.right)))
                        ))
                {
                    this.android('layout_width', 'match_parent');
                }
                else {
                    this.android('layout_width', 'wrap_content');
                }
            }
            if (this.android('layout_height') !== '0px') {
                const contentHeight = convertInt(styleMap.height || this.lineHeight);
                if (contentHeight > 0) {
                    const percentHeight = (styleMap.height !== 'auto' ? styleMap.height : null) || styleMap.lineHeight;
                    if (isPercent(percentHeight)) {
                        if (renderParent.element.tagName === 'TABLE') {
                            this.android('layout_rowWeight', (contentHeight / 100).toFixed(2));
                            this.android('layout_height', '0px');
                        }
                        else if (percentHeight === '100%') {
                            this.android('layout_height', 'match_parent');
                            if (styleMap.width == null) {
                                switch (this.nodeName) {
                                    case NODE_ANDROID.IMAGE:
                                        this.android('layout_width', 'match_parent');
                                        break;
                                }
                            }
                        }
                        else {
                            this.android('layout_height', this.style.height || 'wrap_content');
                        }
                    }
                    else if (contentHeight > 0) {
                        if (!this.isSet('styleMap', 'minHeight') && ((this.display === 'inline-block' && this.css('overflow') === 'visible') || (Math.max.apply(null, [0, ...this.renderChildren.map(node => node.linear.bottom)]) - this.box.top > contentHeight))) {
                            this.android('minHeight', formatPX(contentHeight));
                            this.android('layout_height', 'wrap_content');
                        }
                        else {
                            this.android('layout_height', (this.inline && !this.overflowY && !this.is(NODE_STANDARD.IMAGE) ? 'wrap_content' : formatPX(contentHeight)));
                        }
                    }
                    else if (styleMap.height === 'auto') {
                        this.android('layout_height', 'wrap_content', false);
                    }
                }
                if (this.isSet('styleMap', 'minHeight') && !isPercent(styleMap.minHeight) && !constraint.minHeight) {
                    this.android('layout_height', 'wrap_content', false);
                    this.android('minHeight', styleMap.minHeight, false);
                }
                if (this.isSet('styleMap', 'maxHeight') && !isPercent(styleMap.maxHeight) && !constraint.maxHeight) {
                    this.android('maxHeight', styleMap.maxHeight, false);
                }
                if (constraint.layoutHeight) {
                    if (constraint.layoutVertical) {
                        this.android('layout_height', 'wrap_content', false);
                    }
                    else if (this.documentRoot) {
                        const bottomHeight = Math.max.apply(null, [0, ...this.renderChildren.filter(node => node.pageflow).map(node => node.linear.bottom)]);
                        this.android('layout_height', (bottomHeight > 0 ? formatPX(bottomHeight + this.paddingBottom + this.borderBottomWidth) : 'match_parent'), false);
                    }
                    else {
                        this.android('layout_height', (this.bounds.height < heightParent ? formatPX(this.bounds.height) : 'match_parent'), false);
                    }
                }
                else if (this.android('layout_height') == null) {
                    if (height >= heightParent && parent.viewHeight > 0 && !(this.inlineElement && this.nodeType < NODE_STANDARD.INLINE) && !(renderParent.is(NODE_STANDARD.RELATIVE) && renderParent.android('layout_height') === 'wrap_content')) {
                        this.android('layout_height', 'match_parent');
                    }
                    else {
                        this.android('layout_height', 'wrap_content');
                    }
                }
            }
        }
    }

    public setAlignment() {
        const left = parseRTL('left');
        const right = parseRTL('right');
        function setAutoMargin(node: T) {
            if (node.centerMargin) {
                node.android('layout_gravity', 'center_horizontal');
                return true;
            }
            else if (node.styleMap.marginLeft === 'auto') {
                node.android('layout_gravity', right);
                return true;
            }
            return false;
        }
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
        const renderParent = this.renderParent;
        let textAlign = this.styleMap.textAlign;
        let textAlignParent = '';
        const verticalAlign = this.styleMap.verticalAlign;
        if (!this.floating || this.is(NODE_STANDARD.TEXT)) {
            textAlignParent = this.inheritCss('textAlign');
        }
        if (textAlign === '' && this.element.tagName === 'TH') {
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
                if (this.linearHorizontal) {
                    if (this.viewHeight === 0 && this.renderChildren.some(node => node.is(NODE_STANDARD.IMAGE))) {
                        vertical = 'bottom';
                    }
                }
                else {
                    const lineHeight = convertInt(this.styleMap.lineHeight);
                    if (lineHeight > 0 && lineHeight >= this.viewHeight) {
                        vertical = 'center_vertical';
                    }
                }
                break;
        }
        if (renderParent.element.tagName === 'TABLE') {
            this.android('layout_gravity', 'fill');
        }
        else {
            const floatRight = (this.linearHorizontal && this.renderChildren.every(node => node.float === 'right'));
            if (renderParent.linearVertical) {
                if (this.float === 'right') {
                    this.android('layout_gravity', right);
                }
                else {
                    setAutoMargin(this);
                }
            }
            switch (renderParent.nodeName) {
                case NODE_ANDROID.FRAME:
                    if (!setAutoMargin(this)) {
                        if (this.float === 'right' || floatRight) {
                            if (renderParent.renderChildren.length === 1) {
                                renderParent.android('layout_gravity', right);
                            }
                            else {
                                this.android('layout_gravity', right);
                            }
                        }
                    }
                    break;
            }
            if (floatRight) {
                horizontal = right;
            }
        }
        if (this.nodeType <= NODE_STANDARD.IMAGE) {
            let fromParent = false;
            if (horizontal === '' && horizontalParent !== '') {
                horizontal = horizontalParent;
                fromParent = !this.is(NODE_STANDARD.IMAGE);
            }
            if (horizontal !== '' && (!fromParent || this.renderParent.renderChildren.length === 1)) {
                if (renderParent.is(NODE_STANDARD.FRAME)) {
                    if (!this.floating && !this.autoMargin) {
                        this.android('layout_gravity', horizontal);
                    }
                }
            }
        }
        const gravity = [horizontal, vertical].filter(value => value);
        if (gravity.length > 0) {
            this.android('gravity', gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|'));
        }
    }

    public mergeBoxSpacing() {
        if (!includesEnum(this.excludeResource, NODE_RESOURCE.BOX_SPACING)) {
            ['layout_margin', 'padding'].forEach((value, index) => {
                const leftRtl = parseRTL(`${value}Left`);
                const rightRtl = parseRTL(`${value}Right`);
                const inline = (this.inline || this.plainText);
                let top = (index === 0 && inline ? 0 : convertInt(this.android(`${value}Top`)));
                let right = convertInt(this.android(rightRtl));
                let bottom = (index === 0 && inline ? 0 : convertInt(this.android(`${value}Bottom`)));
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
    }

    public applyOptimizations(options: ObjectMap<any>) {
        const renderParent = this.renderParent;
        this.alignBoxSpacing();
        switch (this.nodeName) {
            case NODE_ANDROID.LINEAR:
                if (this.display !== 'block') {
                    [[this.linearHorizontal, this.inlineElement, 'layout_width'], [this.linearVertical, true, 'layout_height']].forEach((value: [boolean, boolean, string]) => {
                        if (value[0] && value[1] && this.android(value[2]) !== 'wrap_content') {
                            if (this.renderChildren.every(node => node.android(value[2]) === 'wrap_content')) {
                                this.android(value[2], 'wrap_content');
                            }
                        }
                    });
                }
                if (this.linearHorizontal) {
                    if (this.renderChildren.some(node => node.floating) || this.renderChildren.some(node => node.pageflow && ['fixed', 'absolute'].includes(node.position) && node.alignMargin)) {
                        this.android('baselineAligned', 'false');
                    }
                    this.alignBaseline(this.renderChildren);
                }
                break;
        }
        if (options.autoSizePaddingAndBorderWidth) {
            let viewWidth = convertInt(this.android('layout_width'));
            let viewHeight = convertInt(this.android('layout_height'));
            if (this.is(NODE_STANDARD.IMAGE)) {
                const top = this.paddingTop + this.borderTopWidth;
                const right = this.paddingRight + this.borderRightWidth;
                const bottom = this.paddingBottom + this.borderBottomWidth;
                const left = this.paddingLeft + this.borderLeftWidth;
                let width = 0;
                let height = 0;
                if (top > 0) {
                    this.modifyBox(BOX_STANDARD.PADDING_TOP, top);
                    height += top;
                }
                if (right > 0) {
                    this.modifyBox(BOX_STANDARD.PADDING_RIGHT, right);
                    width += right;
                }
                if (bottom > 0) {
                    this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, bottom);
                    height += bottom;
                }
                if (left > 0) {
                    this.modifyBox(BOX_STANDARD.PADDING_LEFT, left);
                    width += left;
                }
                if (width > 0) {
                    if (viewWidth > 0) {
                        this.android('layout_width', formatPX(viewWidth + width));
                    }
                    else {
                        viewWidth = convertInt(renderParent.android('layout_width'));
                        if (viewWidth > 0 && renderParent.renderChildren.length === 1) {
                            renderParent.android('layout_width', formatPX(viewWidth + width));
                        }
                    }
                }
                if (height > 0) {
                    if (viewHeight > 0) {
                        this.android('layout_height', formatPX(viewHeight + height));
                    }
                    else {
                        viewHeight = convertInt(renderParent.android('layout_height'));
                        if (viewHeight > 0 && renderParent.renderChildren.length === 1) {
                            renderParent.android('layout_height', formatPX(viewHeight + height));
                        }
                    }
                }
            }
            else {
                if (viewWidth > 0 || viewHeight > 0) {
                    if (viewWidth > 0) {
                        if (this.element.tagName !== 'TABLE') {
                            this.android('layout_width', formatPX(viewWidth + this.paddingLeft + this.paddingRight + this.borderLeftWidth + this.borderRightWidth));
                        }
                    }
                    if (viewHeight > 0) {
                        if (this.borderTopWidth > 0 && this.marginTop >= this.borderTopWidth) {
                            this.modifyBox(BOX_STANDARD.MARGIN_TOP, this.marginTop - this.borderTopWidth);
                        }
                        this.android('layout_height', formatPX(viewHeight + this.paddingTop + this.paddingBottom + this.borderTopWidth + this.borderBottomWidth));
                    }
                }
            }
            const lineHeight = convertInt(this.styleMap.lineHeight);
            if (lineHeight > 0) {
                const offsetTop = lineHeight - this.bounds.height;
                if (offsetTop > 0) {
                    this.modifyBox(BOX_STANDARD[(this.inline ? 'MARGIN_TOP' : 'PADDING_TOP')], this[(this.inline ? 'marginTop' : 'paddingTop')] + Math.ceil(offsetTop / 2));
                    this.modifyBox(BOX_STANDARD[(this.inline ? 'MARGIN_BOTTOM' : 'PADDING_BOTTOM')], this[(this.inline ? 'marginBottom' : 'paddingBottom')] + Math.floor(offsetTop / 2));
                }
            }
        }
        if (this.position === 'relative') {
            if (convertInt(this.top) !== 0) {
                this.modifyBox(BOX_STANDARD.MARGIN_TOP, this.marginTop + convertInt(this.top));
            }
            else if (convertInt(this.bottom) !== 0) {
                this.modifyBox(BOX_STANDARD.MARGIN_TOP, this.marginTop + (convertInt(this.bottom) * -1));
            }
            if (convertInt(this.left) !== 0) {
                if (this.float === 'right' || (this.position === 'relative' && this.styleMap.marginLeft === 'auto')) {
                    this.modifyBox(BOX_STANDARD.MARGIN_RIGHT, this.marginRight + (convertInt(this.left) * -1));
                }
                else {
                    this.modifyBox(BOX_STANDARD.MARGIN_LEFT, this.marginLeft + convertInt(this.left));
                }
            }
        }
        if (this.inline) {
            const verticalAlign = convertInt(this.css('verticalAlign'));
            if (verticalAlign !== 0) {
                this.modifyBox(BOX_STANDARD.MARGIN_TOP, this.marginTop + (verticalAlign * -1));
            }
        }
        if (this.css('visibility') === 'hidden') {
            this.android('visibility', 'invisible');
        }
    }

    public setAccessibility() {
        const node = this as T;
        const element = this.element;
        switch (this.nodeName) {
            case NODE_ANDROID.EDIT:
                if (node.companion == null) {
                    let label: Null<T> = null;
                    let current = this as T;
                    let parent = this.renderParent;
                    while (parent instanceof View && parent.renderChildren.length > 0) {
                        const index = parent.renderChildren.findIndex(item => item === current);
                        if (index > 0) {
                            label = parent.renderChildren[index - 1];
                            break;
                        }
                        current = parent;
                        parent = parent.renderParent;
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
            else if (item.plainText) {
                if (childIndex === -1) {
                    childIndex = index;
                }
            }
            else {
                if (item.nodeType <= NODE_STANDARD.TEXT) {
                    const verticalAlign = item.css('verticalAlign');
                    if (verticalAlign !== '') {
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
                }
            }
            return false;
        });
        if (childIndex !== -1) {
            this.android('baselineAlignedChildIndex', childIndex.toString());
            if (this.renderParent.linearHorizontal) {
                this.renderParent.alignBaseline(this.renderParent.renderChildren);
            }
        }
    }

    private alignBoxSpacing() {
        if (this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP)) {
            switch (this.android('orientation')) {
                case AXIS_ANDROID.HORIZONTAL:
                    let left = this.box.left;
                    sortAsc(this.renderChildren, 'linear.left').forEach(node => {
                        if (!node.floating) {
                            const width = Math.ceil(node.linear.left - left);
                            if (width >= 1) {
                                node.modifyBox(BOX_STANDARD.MARGIN_LEFT, node.marginLeft + width);
                            }
                        }
                        left = node.linear.right;
                    });
                    break;
                case AXIS_ANDROID.VERTICAL:
                    let top = this.box.top;
                    sortAsc(this.renderChildren, 'linear.top').forEach(node => {
                        const height = Math.ceil(node.linear.top - top);
                        if (height >= 1) {
                            node.modifyBox(BOX_STANDARD.MARGIN_TOP, node.marginTop + height);
                        }
                        top = node.linear.bottom;
                    });
                    break;
            }
        }
    }

    get stringId() {
        return (this.nodeId ? `@+id/${this.nodeId}` : '');
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
            return (value != null ? View.getNodeName(value) : '');
        }
    }

    set documentParent(value: T) {
        this._documentParent = value;
    }
    get documentParent() {
        const position = this.position;
        if (this._documentParent != null) {
            return this._documentParent as T;
        }
        else if (this.id === 0) {
            return this;
        }
        else if (position !== 'fixed') {
            const absolute = (position === 'absolute');
            let parent = this.element.parentElement;
            while (parent != null) {
                const node = (!absolute || getStyle(parent).position !== 'static' ? getNode(parent) : null);
                if (node) {
                    return node as T;
                }
                parent = parent.parentElement;
            }
        }
        return View.documentBody();
    }

    set renderParent(value: T) {
        if (value !== this && value.renderChildren.indexOf(this) === -1) {
            value.append(this);
        }
        this._renderParent = value;
    }
    get renderParent() {
        if (this._renderParent != null) {
            return this._renderParent as T;
        }
        else {
            return View.documentBody();
        }
    }

    get anchored(): boolean {
        return (this.constraint.horizontal && this.constraint.vertical);
    }

    get linearHorizontal() {
        return (this._android && this._android.orientation === AXIS_ANDROID.HORIZONTAL && this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP));
    }
    get linearVertical() {
        return (this._android && this._android.orientation === AXIS_ANDROID.VERTICAL && this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP));
    }

    get horizontalBias() {
        const parent = this.documentParent;
        if (parent !== this) {
            const left = Math.max(0, this.linear.left - parent.box.left);
            const right = Math.max(0, parent.box.right - this.linear.right);
            return calculateBias(left, right);
        }
        return 0.5;
    }
    get verticalBias() {
        const parent = this.documentParent;
        if (parent !== this) {
            const top = Math.max(0, this.linear.top - parent.box.top);
            const bottom = Math.max(0, parent.box.bottom - this.linear.bottom);
            return calculateBias(top, bottom);
        }
        return 0.5;
    }
}