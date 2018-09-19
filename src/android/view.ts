import { DisplaySettings, Null, ObjectMap, StringMap } from '../lib/types';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { capitalize, convertEnum, convertFloat, convertInt, convertWord, formatPX, lastIndexOf, withinFraction } from '../lib/util';
import { calculateBias, generateId, stripId } from './lib/util';
import { getElementsBetweenSiblings, getNodeFromElement } from '../lib/dom';
import API_ANDROID from './customizations';
import parseRTL from './localization';
import { BOX_STANDARD, CSS_STANDARD, MAP_ELEMENT, NODE_ALIGNMENT, NODE_PROCEDURE, NODE_RESOURCE, NODE_STANDARD } from '../lib/constants';
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

    public static getControlName(nodeType: number): string {
        return NODE_ANDROID[NODE_STANDARD[nodeType]];
    }

    private static _documentBody: T;

    public readonly renderChildren: T[] = [];
    public children: T[] = [];
    public constraint: ObjectMap<any> = { current: {} };

    protected _namespaces = new Set(['android', 'app']);

    private _android: StringMap = {};
    private _app: StringMap = {};

    constructor(
        public readonly id: number,
        public api: number,
        element?: Element)
    {
        super(id, element);
    }

    public attr(obj: string, attr: string, value = '', overwrite = true) {
        if (!this.supported(obj, attr)) {
            return '';
        }
        return super.attr(obj, attr, value, overwrite);
    }

    public android(attr: string, value = '', overwrite = true) {
        this.attr('android', attr, value, overwrite);
        return this._android[attr] || '';
    }

    public app(attr: string, value = '', overwrite = true) {
        this.attr('app', attr, value, overwrite);
        return this._app[attr] || '';
    }

    public apply(options = {}) {
        const local = Object.assign({}, options);
        super.apply(local);
        for (const obj in local) {
            this.formatted(`${obj}="${local[obj]}"`);
        }
    }

    public formatted(value: string, overwrite = true) {
        const match = value.match(/^(?:([a-z]+):)?(\w+)="((?:@+?[a-z]+\/)?.+)"$/);
        if (match) {
            this.attr(match[1] || '_', match[2], match[3], overwrite);
        }
    }

    public anchor(position: string, adjacent?: string, orientation?: string, overwrite?: boolean) {
        if (arguments.length === 1 || this.constraint.current[position] == null || !this.constraint.current[position].overwrite || (orientation && !this.constraint[orientation])) {
            if (overwrite == null) {
                overwrite = (adjacent === 'parent' || adjacent === 'true');
            }
            this[(this.renderParent.controlName === NODE_ANDROID.RELATIVE ? 'android' : 'app')](position, adjacent, overwrite);
            if (orientation) {
                this.constraint[orientation] = true;
            }
            this.constraint.current[position] = { adjacent, orientation, overwrite };
        }
    }

    public alignParent(position: string) {
        if (this.renderParent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE)) {
            const constraint = (this.renderParent.controlName === NODE_ANDROID.CONSTRAINT);
            const direction = capitalize(position);
            const attr = (constraint ? `layout_constraint${direction}_to${direction}Of` : `layout_alignParent${direction}`);
            return (this[(constraint ? 'app' : 'android')](parseRTL(attr)) === (constraint ? 'parent' : 'true'));
        }
        return false;
    }

    public modifyBox(region: number | string, offset: number | null, negative = false, bounds = false) {
        const name = (typeof region === 'number' ? convertEnum(region, BOX_STANDARD, BOX_ANDROID) : '');
        if ((name !== '' || (typeof region === 'string' && region !== '')) && offset !== 0) {
            const attr = (typeof region === 'string' ? region : name.replace('layout_', ''));
            if (this._boxReset[attr] != null) {
                if (offset == null) {
                    this._boxReset[attr] = 1;
                }
                else {
                    this._boxAdjustment[attr] += offset;
                    if (!negative) {
                        this._boxAdjustment[attr] = Math.max(0, this._boxAdjustment[attr]);
                    }
                }
                if (bounds && offset) {
                    switch (attr) {
                        case 'marginTop':
                            this.linear.top -= offset;
                            break;
                        case 'marginRight':
                            this.linear.right += offset;
                            break;
                        case 'marginBottom':
                            this.linear.bottom += offset;
                            break;
                        case 'marginLeft':
                            this.linear.left -= offset;
                            break;
                        case 'paddingTop':
                            this.box.top += offset;
                            break;
                        case 'paddingRight':
                            this.box.right -= offset;
                            break;
                        case 'paddingBottom':
                            this.box.bottom -= offset;
                            break;
                        case 'paddingLeft':
                            this.box.left += offset;
                            break;
                    }
                    this.setDimensions([(attr.indexOf('margin') !== -1 ? 'linear' : 'box')]);
                }
            }
        }
    }

    public valueBox(region: number) {
        const name = convertEnum(region, BOX_STANDARD, BOX_ANDROID);
        if (name !== '') {
            const attr = name.replace('layout_', '');
            return [this._boxReset[attr] || 0, this._boxAdjustment[attr] || 0];
        }
        return [0, 0];
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
        for (const value of this._namespaces.values()) {
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
        }
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
                [this.tagName, this.controlName].forEach(nodeName => {
                    const customizations = build.customizations[nodeName];
                    if (customizations != null) {
                        for (const obj in customizations) {
                            for (const attr in customizations[obj]) {
                                this.attr(obj, attr, customizations[obj][attr], overwrite);
                            }
                        }
                    }
                });
            }
        });
    }

    public clone(id?: number, children = false): T {
        const node = new View(id || this.id, this.api, this.element);
        node.nodeId = this.nodeId;
        node.nodeType = this.nodeType;
        node.controlName = this.controlName;
        node.alignmentType = this.alignmentType;
        node.depth = this.depth;
        node.rendered = this.rendered;
        node.renderDepth = this.renderDepth;
        node.renderParent = this.renderParent;
        node.renderExtension = this.renderExtension;
        node.documentRoot = this.documentRoot;
        node.documentParent = this.documentParent;
        if (children) {
            node.children = this.children.slice();
        }
        node.inherit(this, 'base', 'styleMap');
        return node;
    }

    public setNodeType(nodeName: string) {
        for (const type in NODE_ANDROID) {
            if (NODE_ANDROID[type] === nodeName && NODE_STANDARD[type] != null) {
                this.nodeType = NODE_STANDARD[type];
                break;
            }
        }
        this.controlName = nodeName;
        if (this.android('id') !== '') {
            this.nodeId = stripId(this.android('id'));
        }
        if (!this.nodeId) {
            const element = <HTMLInputElement> this.element;
            let name = (element.id || element.name || '').trim();
            if (RESERVED_JAVA.includes(name)) {
                name += '_1';
            }
            this.nodeId = convertWord(generateId('android', (name || `${lastIndexOf(this.controlName, '.').toLowerCase()}_1`)));
            this.android('id', this.stringId);
        }
    }

    public setLayout(width?: number, height?: number) {
        if (this.nodeType >= NODE_STANDARD.SCROLL_HORIZONTAL) {
            this.android('layout_width', (this.nodeType === NODE_STANDARD.SCROLL_HORIZONTAL && this.has('width', CSS_STANDARD.UNIT) ? this.css('width') : 'wrap_content'));
            this.android('layout_height', (this.nodeType === NODE_STANDARD.SCROLL_VERTICAL && this.has('height', CSS_STANDARD.UNIT) ? this.css('height') : 'wrap_content'));
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
            const renderChildren = this.renderChildren;
            const widthParent = (parent.initial.box != null ? parent.initial.box.width
                                                            : (parent.element instanceof HTMLElement ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + parent.borderLeftWidth + parent.borderRightWidth) : 0));
            const heightParent = (parent.initial.box != null ? parent.initial.box.height
                                                             : (parent.element instanceof HTMLElement ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + parent.borderTopWidth + parent.borderBottomWidth) : 0));
            const tableElement = (this.tagName === 'TABLE');
            if (width == null) {
                width = (this.linear ? this.linear.width
                                     : (this.hasElement ? this.element.clientWidth + this.borderLeftWidth + this.borderRightWidth + this.marginLeft + this.marginRight
                                                        : 0));
            }
            if (height == null) {
                height = (this.linear ? this.linear.height
                                      : (this.hasElement ? this.element.clientHeight + this.borderTopWidth + this.borderBottomWidth + this.marginTop + this.marginBottom
                                                         : 0));
            }
            if (this.documentBody || (this.documentRoot && !this.flex.enabled && this.is(NODE_STANDARD.FRAME, NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE))) {
                if (this.viewWidth === 0 && this.block && !constraint.layoutHorizontal) {
                    this.android('layout_width', 'match_parent', false);
                }
                if (this.viewHeight === 0 && this.cascade().some(node => !node.pageflow) && !constraint.layoutHeight && !constraint.layoutVertical) {
                    this.android('layout_height', 'match_parent', false);
                }
            }
            if (this.of(NODE_STANDARD.GRID, NODE_ALIGNMENT.PERCENT)) {
                this.android('layout_width', 'match_parent');
            }
            else {
                if (this.android('layout_width') !== '0px') {
                    if (this.toInt('width') > 0 && (!this.inlineStatic || renderParent.is(NODE_STANDARD.GRID) || !this.has('width', 0, { map: 'initial' }))) {
                        if (this.has('width', CSS_STANDARD.PERCENT)) {
                            if (styleMap.width === '100%') {
                                this.android('layout_width', 'match_parent', false);
                            }
                            else if (renderParent.of(NODE_STANDARD.GRID, NODE_ALIGNMENT.PERCENT)) {
                                this.android('layout_width', '0px');
                                this.app('layout_columnWeight', (parseInt(styleMap.width) / 100).toFixed(2));
                            }
                            else {
                                const widthPercent = Math.ceil(this.bounds.width) - (!tableElement ? this.paddingLeft + this.paddingRight + this.borderLeftWidth + this.borderRightWidth : 0);
                                this.android('layout_width', formatPX(widthPercent), false);
                            }
                        }
                        else {
                            this.android('layout_width', (this.css('overflow') === 'visible' && renderChildren.length === 1 && !renderChildren[0].has('width', CSS_STANDARD.PERCENT) && renderChildren[0].toInt('width') >= this.toInt('width') ? renderChildren[0].styleMap.width : styleMap.width));
                        }
                    }
                    if (constraint.layoutWidth) {
                        if (constraint.layoutHorizontal) {
                            this.android('layout_width', (parent.viewWidth > 0 ? 'match_parent' : 'wrap_content'), false);
                        }
                        else {
                            this.android('layout_width', (this.bounds.width >= widthParent ? 'match_parent' : formatPX(this.bounds.width)), false);
                        }
                    }
                    if (this.has('minWidth', CSS_STANDARD.UNIT)) {
                        this.android('layout_width', 'wrap_content', false);
                        this.android('minWidth', styleMap.minWidth, false);
                    }
                    if (!this.documentBody && this.has('maxWidth', CSS_STANDARD.UNIT) && this.layoutVertical) {
                        const maxWidth = this.css('maxWidth');
                        renderChildren.forEach(node => {
                            if (node.is(NODE_STANDARD.TEXT) && !node.has('maxWidth')) {
                                node.android('maxWidth', maxWidth);
                            }
                        });
                    }
                }
                if (this.android('layout_width') === '') {
                    const widthDefined = renderChildren.filter(node => (node.has('width', 0, { map: 'initial' }) && !node.has('width', CSS_STANDARD.PERCENT) && !node.autoMargin));
                    if (convertFloat(this.app('layout_columnWeight')) > 0) {
                        this.android('layout_width', '0px');
                    }
                    else if (widthDefined.length > 0 && widthDefined.some(node => node.bounds.width >= this.box.width)) {
                        this.android('layout_width', 'wrap_content');
                    }
                    else if ((this.blockStatic && this.hasBit('alignmentType', NODE_ALIGNMENT.VERTICAL)) || (!this.documentRoot && renderChildren.some(node => node.hasBit('alignmentType', NODE_ALIGNMENT.VERTICAL) && !node.has('width')))) {
                        this.android('layout_width', 'match_parent');
                    }
                    else {
                        const inlineRight: number = Math.max.apply(null, renderChildren.filter(node => node.inlineElement && node.float !== 'right').map(node => node.linear.right)) || 0;
                        const wrap = (
                            this.nodeType < NODE_STANDARD.INLINE ||
                            this.inlineElement ||
                            !this.pageflow ||
                            !this.siblingflow ||
                            this.display === 'table' ||
                            parent.flex.enabled ||
                            (renderParent.inlineElement && renderParent.viewWidth === 0 && !this.inlineElement && this.nodeType > NODE_STANDARD.BLOCK) ||
                            renderParent.is(NODE_STANDARD.GRID)
                        );
                        if (this.is(NODE_STANDARD.GRID) && withinFraction(inlineRight, this.box.right)) {
                            this.android('layout_width', 'wrap_content');
                        }
                        else if (!wrap || (this.blockStatic && !this.has('maxWidth'))) {
                            const previousSibling = this.previousSibling();
                            const nextSibling = this.nextSibling();
                            if (width >= widthParent ||
                                (this.linearVertical && !this.floating && !this.autoMargin) ||
                                (this.hasElement && this.blockStatic && (
                                    this.documentParent.documentBody ||
                                    this.ascend(true).every(node => node.blockStatic) ||
                                    (this.documentParent.blockStatic && this.nodeType <= NODE_STANDARD.LINEAR && ((previousSibling == null || !previousSibling.floating) && (nextSibling == null || !nextSibling.floating))))
                                ) ||
                                (this.is(NODE_STANDARD.FRAME) && renderChildren.some(node => node.blockStatic && (node.centerMarginHorizontal || node.autoLeftMargin))) ||
                                (!this.hasElement && renderChildren.length > 0 && renderChildren.some(item => item.linear.width >= this.documentParent.box.width) && !renderChildren.some(item => item.plainText && item.multiLine)))
                            {
                                this.android('layout_width', 'match_parent');
                            }
                        }
                        this.android('layout_width', 'wrap_content', false);
                    }
                }
            }
            if (this.android('layout_height') !== '0px') {
                if (this.toInt('height') > 0 && (!this.inlineStatic || !this.has('height', 0, { map: 'initial' }))) {
                    if (this.has('height', CSS_STANDARD.PERCENT)) {
                        if (styleMap.height === '100%') {
                            this.android('layout_height', 'match_parent', false);
                        }
                        else {
                            let heightPercent = Math.ceil(this.bounds.height);
                            if (!tableElement) {
                                heightPercent -= this.paddingTop + this.paddingBottom + this.borderTopWidth + this.borderBottomWidth;
                            }
                            this.android('layout_height', formatPX(heightPercent), false);
                        }
                    }
                    else {
                        this.android('layout_height', (this.css('overflow') === 'hidden' && this.toInt('height') < this.box.height ? 'wrap_content' : styleMap.height));
                    }
                }
                if (constraint.layoutHeight) {
                    if (constraint.layoutVertical) {
                        this.android('layout_height', 'wrap_content', false);
                    }
                    else if (this.documentRoot) {
                        const bottomHeight: number = Math.max.apply(null, renderChildren.filter(node => node.pageflow).map(node => node.linear.bottom)) || 0;
                        this.android('layout_height', (bottomHeight > 0 ? formatPX(bottomHeight + this.paddingBottom + this.borderBottomWidth) : 'match_parent'), false);
                    }
                    else {
                        this.android('layout_height', (this.actualHeight < heightParent ? formatPX(this.actualHeight) : 'match_parent'), false);
                    }
                }
                if (this.has('minHeight', CSS_STANDARD.UNIT)) {
                    this.android('layout_height', 'wrap_content', false);
                    this.android('minHeight', styleMap.minHeight, false);
                }
                if (!this.documentBody && this.has('maxHeight', CSS_STANDARD.UNIT) && this.layoutHorizontal) {
                    const maxHeight = this.css('maxHeight');
                    renderChildren.forEach(node => {
                        if (node.is(NODE_STANDARD.TEXT) && !node.has('maxWidth')) {
                            node.android('maxWidth', maxHeight);
                        }
                    });
                }
            }
            if (this.android('layout_height') === '') {
                if (height >= heightParent &&
                    parent.viewHeight > 0 &&
                    !(this.inlineElement && this.nodeType < NODE_STANDARD.INLINE) &&
                    !(renderParent.is(NODE_STANDARD.RELATIVE) && renderParent.inlineHeight))
                {
                    this.android('layout_height', 'match_parent');
                }
                else {
                    if (this.lineHeight > 0 && !this.plainText && !renderParent.linearHorizontal) {
                        const boundsHeight = this.actualHeight + renderParent.paddingTop + renderParent.paddingBottom;
                        if (this.inlineElement && boundsHeight > 0 && this.lineHeight >= boundsHeight) {
                            this.android('layout_height', formatPX(boundsHeight));
                            this.modifyBox(BOX_STANDARD.PADDING_TOP, null);
                            this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, null);
                        }
                        else if (this.block && this.box.height > 0 && this.lineHeight === this.box.height) {
                            this.android('layout_height', formatPX(boundsHeight));
                        }
                    }
                    this.android('layout_height', 'wrap_content', false);
                }
            }
        }
        if (this.cssParent('visibility', true) === 'hidden') {
            this.android('visibility', 'invisible');
        }
    }

    public setAlignment() {
        const renderParent = this.renderParent;
        const obj = (renderParent.is(NODE_STANDARD.GRID) ? 'app' : 'android');
        const left = parseRTL('left');
        const right = parseRTL('right');
        let textAlign = this.styleMap.textAlign || '';
        let verticalAlign = '';
        function mergeGravity(original?: Null<string>, ...alignment: string[]) {
            const direction = [...(original || '').split('|'), ...alignment].filter(value => value);
            switch (direction.length) {
                case 0:
                    return '';
                case 1:
                    return direction[0];
                default:
                    let x = '';
                    let y = '';
                    let z = '';
                    for (let i = 0; i < direction.length; i++) {
                        const value = direction[i];
                        switch (value) {
                            case 'center':
                                x = 'center_horizontal';
                                y = 'center_vertical';
                                break;
                            case 'left':
                            case 'start':
                            case 'right':
                            case 'end':
                            case 'center_horizontal':
                                x = value;
                                break;
                            case 'top':
                            case 'bottom':
                            case 'center_vertical':
                                y = value;
                                break;
                            default:
                                z += (z !== '' ? '|' : '') + value;
                                break;
                        }
                    }
                    const gravity = [x, y].filter(value => value);
                    const merged = (gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|'));
                    return (merged !== '' ? (z !== '' ? `${merged}|${z}` : merged) : z);
            }
        }
        function setAutoMargin(node: T) {
            const alignment: string[] = [];
            if (node.centerMarginHorizontal) {
                alignment.push('center_horizontal');
            }
            else if (node.css('marginLeft') === 'auto') {
                alignment.push(right);
            }
            else if (node.css('marginRight') === 'auto') {
                alignment.push(left);
            }
            if (node.centerMarginVertical) {
                alignment.push('center_vertical');
            }
            else if (node.css('marginTop') === 'auto') {
                alignment.push('bottom');
            }
            else if (node.css('marginBottom') === 'auto') {
                alignment.push('top');
            }
            if (alignment.length > 0) {
                const gravity = (node.blockWidth ? 'gravity' : 'layout_gravity');
                node[obj](gravity, mergeGravity(node[obj](gravity), ...alignment));
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
        if (!(this.floating || renderParent.of(NODE_STANDARD.RELATIVE, NODE_ALIGNMENT.HORIZONTAL))) {
            switch (this.styleMap.verticalAlign) {
                case 'top':
                case 'text-top':
                    verticalAlign = 'top';
                    if (renderParent.linearHorizontal && this.inlineHeight) {
                        this.android('layout_height', 'match_parent');
                    }
                    break;
                case 'middle':
                    if (this.documentParent.css('display') === 'table-cell' || (this.inlineStatic && this.documentParent.lineHeight > 0) || this.inline) {
                        verticalAlign = 'center_vertical';
                    }
                    break;
                case 'bottom':
                case 'text-bottom':
                    verticalAlign = 'bottom';
                    break;
            }
        }
        if (verticalAlign === '' && this.lineHeight > 0 && !this.blockHeight) {
            verticalAlign = 'center_vertical';
        }
        if (renderParent.linearVertical || (this.documentRoot && this.linearVertical)) {
            if (this.float === 'right') {
                this[obj]('layout_gravity', right);
            }
            else {
                setAutoMargin(this);
            }
        }
        let floating = '';
        if (this.hasBit('alignmentType', NODE_ALIGNMENT.SEGMENTED | NODE_ALIGNMENT.FLOAT) || this.linearHorizontal) {
            if (this.hasBit('alignmentType', NODE_ALIGNMENT.LEFT) || this.renderChildren.some(node => node.float === 'left' || node.hasBit('alignmentType', NODE_ALIGNMENT.LEFT))) {
                floating = left;
            }
            else if (this.hasBit('alignmentType', NODE_ALIGNMENT.RIGHT) || this.renderChildren.some(node => node.float === 'right' || node.hasBit('alignmentType', NODE_ALIGNMENT.RIGHT))) {
                floating = right;
            }
        }
        if (renderParent.tagName === 'TABLE') {
            this[obj]('layout_gravity', mergeGravity(this[obj]('layout_gravity'), 'fill'));
            if (textAlign === '' && this.tagName === 'TH') {
                textAlign = 'center';
            }
            if (verticalAlign === '') {
                verticalAlign = 'center_vertical';
            }
        }
        function setTextAlign(value: string) {
            if (textAlign === '' || value === right) {
                return value;
            }
            return textAlign;
        }
        if (this.linearHorizontal) {
            if (this.blockWidth) {
                textAlign = setTextAlign(floating);
            }
            else {
                this[obj]('layout_gravity', mergeGravity(this[obj]('layout_gravity'), floating));
            }
        }
        else if (renderParent.is(NODE_STANDARD.FRAME)) {
            if (!setAutoMargin(this)) {
                floating = floating || this.float;
                if (floating !== 'none') {
                    if (renderParent.inlineWidth || this.singleChild) {
                        renderParent.android('layout_gravity', mergeGravity(renderParent.android('layout_gravity'), parseRTL(floating)));
                    }
                    else {
                        if (this.blockWidth) {
                            textAlign = setTextAlign(floating);
                        }
                        else {
                            this.android('layout_gravity', mergeGravity(this.android('layout_gravity'), parseRTL(floating)));
                        }
                    }
                }
            }
        }
        else if (floating !== '') {
            if (renderParent.hasBit('alignmentType', NODE_ALIGNMENT.VERTICAL)) {
                textAlign = setTextAlign(floating);
            }
        }
        const textAlignParent = this.cssParent('textAlign');
        if (textAlignParent !== '' && parseRTL(textAlignParent) !== left) {
            if (renderParent.is(NODE_STANDARD.FRAME) &&
                this.singleChild &&
                !this.floating &&
                !this.autoMargin)
            {
                this[obj]('layout_gravity', mergeGravity(this[obj]('layout_gravity'), convertHorizontal(textAlignParent)));
            }
            if (textAlign === '') {
                textAlign = textAlignParent;
            }
        }
        if (verticalAlign !== '' && renderParent.linearHorizontal) {
            this[obj]('layout_gravity', mergeGravity(this[obj]('layout_gravity'), verticalAlign));
            verticalAlign = '';
        }
        if (this.documentRoot && this.blockWidth) {
            this.delete(obj, 'layout_gravity');
        }
        this.android('gravity', mergeGravity(this.android('gravity'), convertHorizontal(textAlign), verticalAlign));
    }

    public setBoxSpacing() {
        if (!this.hasBit('excludeResource', NODE_RESOURCE.BOX_SPACING)) {
            ['padding', 'margin'].forEach(region => {
                ['Top', 'Left', 'Right', 'Bottom'].forEach(direction => {
                    const dimension = region + direction;
                    const value: number = (this._boxReset[dimension] === 0 ? this[dimension] : 0) + this._boxAdjustment[dimension];
                    if (value !== 0) {
                        const attr = parseRTL(BOX_ANDROID[`${region.toUpperCase()}_${direction.toUpperCase()}`]);
                        this.android(attr, formatPX(value));
                    }
                });
            });
            if (this.api >= BUILD_ANDROID.OREO) {
                ['layout_margin', 'padding'].forEach((value, index) => {
                    const top = convertInt(this.android(`${value}Top`));
                    const right = convertInt(this.android(parseRTL(`${value}Right`)));
                    const bottom = convertInt(this.android(`${value}Bottom`));
                    const left = convertInt(this.android(parseRTL(`${value}Left`)));
                    if (top !== 0 && top === bottom && bottom === left && left === right) {
                        this.delete('android', `${value}*`);
                        this.android(value, formatPX(top));
                    }
                    else {
                        if (!(index === 0 && this.renderParent.is(NODE_STANDARD.GRID))) {
                            if (top !== 0 && top === bottom) {
                                this.delete('android', `${value}Top`, `${value}Bottom`);
                                this.android(`${value}Vertical`, formatPX(top));
                            }
                            if (left !== 0 && left === right) {
                                this.delete('android', parseRTL(`${value}Left`), parseRTL(`${value}Right`));
                                this.android(`${value}Horizontal`, formatPX(left));
                            }
                        }
                    }
                });
            }
        }
    }

    public applyOptimizations(settings: DisplaySettings) {
        const renderParent = this.renderParent;
        const renderChildren = this.renderChildren;
        const renderEvery = (this.hasElement && Array.from(this.element.children).every(element => renderChildren.includes(getNodeFromElement(element) as T) || element.tagName === 'BR'));
        if (this.is(NODE_STANDARD.LINEAR)) {
            const linearHorizontal = this.linearHorizontal;
            if (this.blockWidth && !this.blockStatic) {
                [[linearHorizontal, this.inlineElement, 'width'], [!linearHorizontal, true, 'height']].forEach((value: [boolean, boolean, string]) => {
                    const attr = `inline${capitalize(value[2])}`;
                    if (value[0] && value[1] && !this[attr] && renderChildren.every(node => node[attr])) {
                        this.android(`layout_${value[2]}`, 'wrap_content');
                    }
                });
            }
            if (linearHorizontal) {
                if (!renderChildren.some(node => node.imageElement && node.baseline) && (renderChildren.some(node => node.floating || !node.siblingflow) || this.hasBit('alignmentType', NODE_ALIGNMENT.FLOAT))) {
                    this.android('baselineAligned', 'false');
                }
                else {
                    const alignInput = renderChildren.some(node => node.nodeType < NODE_STANDARD.TEXT);
                    if (renderChildren.some(node => !node.alignOrigin || !node.baseline) || renderParent.android('baselineAlignedChildIndex') !== '' || alignInput) {
                        const baseline = NodeList.textBaseline(renderChildren, alignInput);
                        if (baseline.length > 0) {
                            this.android('baselineAlignedChildIndex', renderChildren.indexOf(baseline[0]).toString());
                        }
                    }
                }
                if (renderEvery) {
                    const inline = renderChildren.filter(node => !node.floating);
                    if (inline.every(node => node.baseline || node.has('verticalAlign', CSS_STANDARD.UNIT))) {
                        const marginTop: number = Math.max.apply(null, inline.map(node => node.toInt('verticalAlign')));
                        const marginBottom = Math.min.apply(null, inline.map(node => node.toInt('verticalAlign')));
                        if (marginTop > 0 && marginBottom < 0) {
                            inline.forEach(node => {
                                const offset = node.toInt('verticalAlign');
                                if (offset === 0) {
                                    node.modifyBox(BOX_STANDARD.PADDING_TOP, marginTop);
                                    node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, Math.abs(marginBottom));
                                }
                                else {
                                    node.modifyBox(BOX_STANDARD.MARGIN_TOP, offset * -1, true);
                                    node.css('verticalAlign', '0px');
                                }
                            });
                        }
                    }
                }
                if (settings.ellipsisOnTextOverflow &&
                    renderChildren.length > 1 &&
                    renderChildren.every(node => node.textElement && !node.floating))
                {
                    renderChildren[renderChildren.length - 1].android('singleLine', 'true');
                }
            }
        }
        if (this.pageflow) {
            if (!renderParent.documentBody && renderParent.blockStatic && this.documentParent === renderParent) {
                [['firstElementChild', 'Top', BOX_STANDARD.MARGIN_TOP, BOX_STANDARD.PADDING_TOP], ['lastElementChild', 'Bottom', BOX_STANDARD.MARGIN_BOTTOM, BOX_STANDARD.PADDING_BOTTOM]].forEach((item: [string, string, number, number], index: number) => {
                    const firstNode = getNodeFromElement(renderParent[item[0]]);
                    if (firstNode && !firstNode.lineBreak && (firstNode === this || firstNode === this.renderChildren[(index === 0 ? 0 : this.renderChildren.length - 1)])) {
                        const marginOffset = renderParent[`margin${item[1]}`];
                        if (marginOffset > 0 && renderParent[`padding${item[1]}`] === 0 && renderParent[`border${item[1]}Width`] === 0) {
                            firstNode.modifyBox(item[2], null);
                        }
                    }
                });
            }
            if (this.blockStatic && this.hasElement) {
                for (let i = 0; i < this.element.children.length; i++) {
                    const element = this.element.children[i];
                    const node = getNodeFromElement(element);
                    if (node && node.pageflow && node.blockStatic && !node.lineBreak) {
                        const previous = node.previousSibling();
                        if (previous && previous.pageflow && !previous.lineBreak) {
                            const marginTop = convertInt(node.cssInitial('marginTop', true));
                            const marginBottom = convertInt(previous.cssInitial('marginBottom', true));
                            if (marginBottom > 0 && marginTop > 0) {
                                if (marginTop <= marginBottom) {
                                    node.modifyBox(BOX_STANDARD.MARGIN_TOP, null);
                                }
                                else {
                                    previous.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, null);
                                }
                            }
                        }
                        [element.previousElementSibling, element.nextElementSibling].forEach((item, index) => {
                            const adjacent = getNodeFromElement(item);
                            if (adjacent && adjacent.excluded) {
                                const offset = Math.min(adjacent.marginTop, adjacent.marginBottom);
                                if (offset < 0) {
                                    if (index === 0) {
                                        node.modifyBox(BOX_STANDARD.MARGIN_TOP, offset, true);
                                    }
                                    else {
                                        node.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, offset, true);
                                    }
                                }
                            }
                        });
                    }
                }
            }
        }
        this.bindWhiteSpace();
        if (settings.autoSizePaddingAndBorderWidth && !this.hasBit('excludeProcedure', NODE_PROCEDURE.AUTOFIT)) {
            let viewWidth = convertInt(this.android('layout_width'));
            let viewHeight = convertInt(this.android('layout_height'));
            if (this.imageElement) {
                const top = this.borderTopWidth;
                const right = this.borderRightWidth;
                const bottom = this.borderBottomWidth;
                const left = this.borderLeftWidth;
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
                height += this.paddingTop + this.paddingBottom;
                width += this.paddingLeft + this.paddingRight;
                if (width > 0) {
                    if (viewWidth > 0) {
                        this.android('layout_width', formatPX(viewWidth + width));
                    }
                    else {
                        viewWidth = convertInt(renderParent.android('layout_width'));
                        if (viewWidth > 0 && this.singleChild) {
                            renderParent.android('layout_width', formatPX(viewWidth + this.marginLeft + width));
                        }
                    }
                }
                if (height > 0) {
                    if (viewHeight > 0) {
                        this.android('layout_height', formatPX(viewHeight + height));
                    }
                    else {
                        viewHeight = convertInt(renderParent.android('layout_height'));
                        if (viewHeight > 0 && this.singleChild) {
                            renderParent.android('layout_height', formatPX(viewHeight + this.marginTop + height));
                        }
                    }
                }
            }
            else if (this.is(NODE_STANDARD.BUTTON) && viewHeight === 0) {
                this.android('layout_height', formatPX(this.bounds.height));
            }
            else if (this.is(NODE_STANDARD.LINE)) {
                if (viewHeight > 0 && this.has('height', 0, { map: 'initial' }) && this.tagName !== 'HR') {
                    this.android('layout_height', formatPX(viewHeight + this.borderTopWidth + this.borderBottomWidth));
                }
            }
            else {
                if (this.hasElement && !this.hasBit('excludeResource', NODE_RESOURCE.BOX_SPACING)) {
                    const minWidth = convertInt(this.android('minWidth'));
                    const minHeight = convertInt(this.android('minHeight'));
                    const tableElement = (this.tagName === 'TABLE');
                    const borderCollapse = ((renderParent.display === 'table' || renderParent.tagName === 'TABLE') && renderParent.css('borderCollapse') === 'collapse');
                    const paddedWidth = this.paddingLeft + this.paddingRight + (!borderCollapse ? this.borderLeftWidth + this.borderRightWidth : 0);
                    const paddedHeight = this.paddingTop + this.paddingBottom + (!borderCollapse ? this.borderTopWidth + this.borderBottomWidth : 0);
                    let resizedWidth = false;
                    let resizedHeight = false;
                    if (viewWidth > 0 &&

                        this.toInt('width', 0, { map: 'initial' }) > 0 &&
                        !(tableElement && this.has('width', CSS_STANDARD.PERCENT, { map: 'initial' })))
                    {
                        if (!tableElement && paddedWidth > 0) {
                            this.android('layout_width', formatPX(viewWidth + paddedWidth));
                        }
                        resizedWidth = true;
                    }
                    if (viewHeight > 0 &&
                        this.toInt('height', 0, { map: 'initial' }) > 0 &&
                        !(tableElement && this.has('height', CSS_STANDARD.PERCENT, { map: 'initial' })) && (
                            this.lineHeight === 0 ||
                            this.lineHeight < this.box.height ||
                            this.lineHeight === this.toInt('height')
                       ))
                    {
                        if (!tableElement && paddedHeight > 0) {
                            this.android('layout_height', formatPX(viewHeight + paddedHeight));
                        }
                        resizedHeight = true;
                    }
                    if (minWidth > 0 && !tableElement && paddedWidth > 0) {
                        this.android('minWidth', formatPX(minWidth + paddedWidth));
                    }
                    if (minHeight > 0 && !tableElement && paddedHeight > 0) {
                        this.android('minHeight', formatPX(minHeight + paddedHeight));
                    }
                    this.modifyBox(BOX_STANDARD.PADDING_TOP, this.borderTopWidth - (tableElement && resizedHeight ? this.paddingTop : 0));
                    this.modifyBox(BOX_STANDARD.PADDING_RIGHT, this.borderBottomWidth - (tableElement && resizedHeight ? this.paddingBottom : 0));
                    this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, this.borderRightWidth - (tableElement && resizedWidth ? this.paddingRight : 0));
                    this.modifyBox(BOX_STANDARD.PADDING_LEFT, this.borderLeftWidth - (tableElement && resizedWidth ? this.paddingLeft : 0));
                }
            }
        }
        if (!renderParent.linearHorizontal && !this.plainText) {
            const offset = this.lineHeight - this.actualHeight;
            if (offset > 0) {
                this.modifyBox(BOX_STANDARD.MARGIN_TOP, Math.floor(offset / 2));
                this.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, Math.ceil(offset / 2));
            }
        }
        if (this.position === 'relative' || renderParent.is(NODE_STANDARD.FRAME)) {
            const top = this.toInt('top');
            const bottom = this.toInt('bottom');
            const left = this.toInt('left');
            if (top !== 0) {
                if (top < 0 && renderParent.is(NODE_STANDARD.RELATIVE) && this.floating && !!this.data('RESOURCE', 'backgroundImage')) {
                    let found = false;
                    renderParent.renderChildren.some(node => {
                        if (node === this) {
                            found = true;
                        }
                        else {
                            if (node.android('layout_below') !== '') {
                                return true;
                            }
                            else if (found) {
                                node.modifyBox(BOX_STANDARD.MARGIN_TOP, Math.abs(top));
                            }
                        }
                        return false;
                    });
                }
                else {
                    this.modifyBox(BOX_STANDARD.MARGIN_TOP, top, true);
                }
            }
            else if (bottom !== 0) {
                this.modifyBox(BOX_STANDARD.MARGIN_TOP, bottom * -1, true);
            }
            if (left !== 0) {
                if (this.float === 'right' || (this.position === 'relative' && this.autoLeftMargin)) {
                    this.modifyBox(BOX_STANDARD.MARGIN_RIGHT, left * -1, true);
                }
                else {
                    this.modifyBox(BOX_STANDARD.MARGIN_LEFT, left, true);
                }
            }
        }
        if (this.inline && !this.floating) {
            const verticalAlign = this.toInt('verticalAlign');
            if (verticalAlign !== 0) {
                this.modifyBox(BOX_STANDARD.MARGIN_TOP, verticalAlign * -1, true);
                if (verticalAlign < 0 && renderParent.linearHorizontal && renderParent.inlineHeight && renderParent.renderChildren.every(node => node.baseline || node.linearHorizontal)) {
                    renderParent.android('layout_height', formatPX(renderParent.bounds.height + this.paddingLeft + this.paddingRight + this.borderLeftWidth + this.borderRightWidth));
                }
            }
        }
        if (this.is(NODE_STANDARD.TEXT) && this.css('whiteSpace') === 'nowrap') {
            this.android('singleLine', 'true');
        }
        if (this.imageElement && (this.baseline || renderParent.linearHorizontal || renderParent.of(NODE_STANDARD.CONSTRAINT, NODE_ALIGNMENT.HORIZONTAL))) {
            this.android('baselineAlignBottom', 'true');
        }
    }

    public setAccessibility() {
        const node = this;
        const element = this.element;
        switch (this.controlName) {
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

    private bindWhiteSpace() {
        if (this.linearHorizontal || this.hasBit('alignmentType', NODE_ALIGNMENT.HORIZONTAL)) {
            if (!this.hasBit('alignmentType', NODE_ALIGNMENT.FLOAT)) {
                const textIndent = this.toInt('textIndent');
                const textAlign = this.css('textAlign');
                const valueBox = this.valueBox(BOX_STANDARD.PADDING_LEFT);
                let right = this.box.left + (textIndent > 0 ? this.toInt('textIndent')
                                                            : (textIndent < 0 && valueBox[0] === 1 ? valueBox[0] : 0));
                this.each((node: T, index) => {
                    if (!(node.floating || (index === 0 && textAlign !== 'left'))) {
                        const width = Math.round(node.actualLeft() - right);
                        if (width >= 1) {
                            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, width);
                        }
                    }
                    right = node.actualRight();
                }, true);
            }
        }
        else if (this.linearVertical) {
            let bottom = this.box.top;
            let previous: Null<T> = null;
            const verified = new Set<T>();
            function getMarginBottom(node: T) {
                if (node.linearHorizontal && node.renderChildren.some(item => !item.floating)) {
                    return node.renderChildren.filter(item => !item.floating).sort((a, b) => (a.linear.bottom < b.linear.bottom ? 1 : -1))[0].linear.bottom;
                }
                return node.linear.bottom;
            }
            this.each((node: T) => {
                let valid = false;
                if (previous && !previous.hasElement) {
                    const previousSibling = (() => {
                        let current = node.previousSibling(false, false);
                        while (current != null) {
                            if (!current.excluded) {
                                return current;
                            }
                            current = current.previousSibling(false, false);
                        }
                        return null;
                    })();
                    if (previousSibling && previous.children.includes(previousSibling as T)) {
                        previous = previousSibling as T;
                    }
                }
                getElementsBetweenSiblings((previous != null ? previous.baseElement : null), node.baseElement).forEach(element => {
                    const collapsed = getNodeFromElement(element) as T;
                    if (element.tagName === 'BR' || (collapsed && collapsed.excluded && (!verified.has(collapsed) || collapsed.blockStatic))) {
                        if (collapsed != null) {
                            verified.add(collapsed);
                        }
                        valid = true;
                    }
                });
                if (valid || (!node.hasElement && !node.plainText)) {
                    const height = Math.round(node.linear.top - bottom);
                    if (height >= 1) {
                        node.modifyBox(BOX_STANDARD.MARGIN_TOP, height);
                    }
                }
                bottom = getMarginBottom(node);
                previous = node;
            }, true);
        }
    }

    get stringId() {
        return (this.nodeId ? `@+id/${this.nodeId}` : '');
    }

    set controlName(value: string) {
        this._controlName = value;
    }
    get controlName() {
        if (this._controlName != null) {
            return this._controlName;
        }
        else {
            const value: number = MAP_ELEMENT[this.nodeName];
            return (value != null ? View.getControlName(value) : '');
        }
    }

    set documentParent(value: T) {
        this._documentParent = value;
    }
    get documentParent() {
        if (this._documentParent != null) {
            return this._documentParent as T;
        }
        else if (this.id === 0) {
            return this;
        }
        else {
            return this.getParentElementAsNode(false) as T || View.documentBody();
        }
    }

    set renderParent(value: T) {
        if (value !== this) {
            value.renderAppend(this);
        }
        this._renderParent = value;
    }
    get renderParent() {
        return this._renderParent as T || View.documentBody();
    }

    get anchored(): boolean {
        return (this.constraint.horizontal && this.constraint.vertical);
    }

    get layoutHorizontal() {
        return this.linearHorizontal || this.is(NODE_STANDARD.FRAME) || this.hasBit('alignmentType', NODE_ALIGNMENT.HORIZONTAL) || (this.renderChildren.length > 1 && new Set(this.renderChildren.map(node => node.linear.top)).size === 1);
    }
    get layoutVertical() {
        return this.linearVertical || this.is(NODE_STANDARD.FRAME) || this.hasBit('alignmentType', NODE_ALIGNMENT.VERTICAL) || (this.renderChildren.length > 1 && new Set(this.renderChildren.map(node => node.linear.left)).size === 1);
    }

    get linearHorizontal() {
        return (this._android.orientation === AXIS_ANDROID.HORIZONTAL && this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP));
    }
    get linearVertical() {
        return (this._android.orientation === AXIS_ANDROID.VERTICAL && this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP));
    }

    get inlineWidth() {
        return (this._android.layout_width === 'wrap_content');
    }
    get inlineHeight() {
        return (this._android.layout_height === 'wrap_content');
    }

    get blockWidth() {
        return (this._android.layout_width === 'match_parent');
    }
    get blockHeight() {
        return (this._android.layout_height === 'match_parent');
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