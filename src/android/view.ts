import { DisplaySettings, Null, StringMap } from '../lib/types';
import { Constraint } from './lib/types';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { capitalize, convertEnum, convertFloat, convertInt, convertWord, formatPX, lastIndexOf, isString, withinFraction } from '../lib/util';
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
    public constraint: Constraint<T>;

    protected _namespaces = new Set(['android', 'app']);

    private _android: StringMap = {};
    private _app: StringMap = {};

    constructor(
        public readonly id: number,
        public api: number,
        element?: Element)
    {
        super(id, element);
        this.constraint = { current: {} } as any;
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
        if (arguments.length === 1 ||
            this.constraint.current[position] == null ||
            !this.constraint.current[position].overwrite ||
            (orientation && !this.constraint[orientation]))
        {
            if (overwrite == null) {
                overwrite = adjacent === 'parent' || adjacent === 'true';
            }
            this[this.renderParent.controlName === NODE_ANDROID.RELATIVE ? 'android' : 'app'](position, adjacent, overwrite);
            if (orientation) {
                this.constraint[orientation] = true;
            }
            this.constraint.current[position] = { adjacent, orientation, overwrite };
        }
    }

    public alignParent(position: string) {
        if (this.renderParent.is(NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE)) {
            const constraint = this.renderParent.controlName === NODE_ANDROID.CONSTRAINT;
            const direction = capitalize(parseRTL(position));
            const attr = constraint ? `layout_constraint${direction}_to${direction}Of` : `layout_alignParent${direction}`;
            return this[constraint ? 'app' : 'android'](attr) === (constraint ? 'parent' : 'true');
        }
        return false;
    }

    public modifyBox(region: number | string, offset: number | null, negative = false) {
        const name = typeof region === 'number' ? convertEnum(region, BOX_STANDARD, BOX_ANDROID) : '';
        if (offset !== 0 && (name !== '' || isString(region))) {
            const attr = isString(region) ? region : name.replace('layout_', '');
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
        return (
            result.sort((a, b) => {
                if (a.startsWith('android:id=')) {
                    return -1;
                }
                else if (b.startsWith('android:id=')) {
                    return 1;
                }
                else {
                    return a > b ? 1 : -1;
                }
            })
        );
    }

    public applyCustomizations(overwrite = false) {
        for (const build of [API_ANDROID[this.api], API_ANDROID[0]]) {
            if (build && build.customizations != null) {
                for (const nodeName of [this.tagName, this.controlName]) {
                    const customizations = build.customizations[nodeName];
                    if (customizations != null) {
                        for (const obj in customizations) {
                            for (const attr in customizations[obj]) {
                                this.attr(obj, attr, customizations[obj][attr], overwrite);
                            }
                        }
                    }
                }
            }
        }
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
        node.inherit(this, 'initial', 'base', 'style', 'styleMap');
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
            this.android('layout_width', this.nodeType === NODE_STANDARD.SCROLL_HORIZONTAL && this.has('width', CSS_STANDARD.UNIT) ? this.css('width') : 'wrap_content');
            this.android('layout_height', this.nodeType === NODE_STANDARD.SCROLL_VERTICAL && this.has('height', CSS_STANDARD.UNIT) ? this.css('height') : 'wrap_content');
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
            const parent = this.documentParent;
            const renderParent = this.renderParent;
            const renderChildren = this.renderChildren;
            const widthParent = (parent.initial.box != null ? parent.initial.box.width
                                                            : (parent.element instanceof HTMLElement ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + parent.borderLeftWidth + parent.borderRightWidth)
                                                                                                     : 0));
            const heightParent = (parent.initial.box != null ? parent.initial.box.height
                                                             : (parent.element instanceof HTMLElement ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + parent.borderTopWidth + parent.borderBottomWidth)
                                                                                                      : 0));
            const styleMap = this.styleMap;
            const constraint = this.constraint;
            const tableElement = (this.tagName === 'TABLE');
            if (width == null) {
                width = (this.linear != null ? this.linear.width
                                             : (this.hasElement ? this.element.clientWidth + this.borderLeftWidth + this.borderRightWidth + this.marginLeft + this.marginRight
                                                                : 0));
            }
            if (height == null) {
                height = (this.linear != null ? this.linear.height
                                              : (this.hasElement ? this.element.clientHeight + this.borderTopWidth + this.borderBottomWidth + this.marginTop + this.marginBottom
                                                                 : 0));
            }
            if (this.documentBody || (this.documentRoot && !this.flex.enabled && this.is(NODE_STANDARD.FRAME, NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE))) {
                if (!this.hasWidth &&
                    this.block &&
                    !constraint.layoutHorizontal)
                {
                    this.android('layout_width', 'match_parent', false);
                }
                if (!this.hasHeight &&
                    this.cascade().some(node => !node.pageflow) &&
                    !constraint.layoutHeight &&
                    !constraint.layoutVertical)
                {
                    this.android('layout_height', 'match_parent', false);
                }
            }
            if (this.of(NODE_STANDARD.GRID, NODE_ALIGNMENT.PERCENT)) {
                this.android('layout_width', 'match_parent');
            }
            else {
                if (this.android('layout_width') !== '0px') {
                    if (this.toInt('width') > 0 && (
                            !this.inlineStatic ||
                            renderParent.is(NODE_STANDARD.GRID) ||
                            !this.has('width', 0, { map: 'initial' })
                       ))
                    {
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
                            this.android('layout_width', convertInt(parent.android('layout_width')) > 0 && parent.viewWidth > 0 && this.viewWidth >= parent.viewWidth ? 'match_parent' : styleMap.width, renderParent.tagName !== 'TABLE');
                        }
                    }
                    if (constraint.layoutWidth) {
                        if (constraint.layoutHorizontal) {
                            this.android('layout_width', parent.hasWidth ? 'match_parent' : 'wrap_content', false);
                        }
                        else {
                            this.android('layout_width', this.bounds.width >= widthParent ? 'match_parent' : formatPX(this.bounds.width), false);
                        }
                    }
                    if (this.has('minWidth', CSS_STANDARD.UNIT)) {
                        this.android('layout_width', 'wrap_content', false);
                        this.android('minWidth', styleMap.minWidth, false);
                    }
                    if (!this.documentBody &&
                        this.has('maxWidth', CSS_STANDARD.UNIT) &&
                        this.layoutVertical)
                    {
                        const maxWidth = this.css('maxWidth');
                        for (const node of renderChildren) {
                            if (node.is(NODE_STANDARD.TEXT) && !node.has('maxWidth')) {
                                node.android('maxWidth', maxWidth);
                            }
                        }
                    }
                }
                if (this.android('layout_width') === '') {
                    const widthDefined = renderChildren.filter(node => !node.autoMargin && node.has('width', CSS_STANDARD.UNIT, { map: 'initial' }));
                    if (convertFloat(this.app('layout_columnWeight')) > 0) {
                        this.android('layout_width', '0px');
                    }
                    else if (
                        widthDefined.length > 0 &&
                        widthDefined.some(node => node.bounds.width >= this.box.width))
                    {
                        this.android('layout_width', 'wrap_content');
                    }
                    else if (
                        (this.blockStatic && this.hasAlign(NODE_ALIGNMENT.VERTICAL)) ||
                        (!this.documentRoot && renderChildren.some(node => node.hasAlign(NODE_ALIGNMENT.VERTICAL) && !node.has('width'))))
                    {
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
                            (renderParent.inlineElement && !renderParent.hasWidth && !this.inlineElement && this.nodeType > NODE_STANDARD.BLOCK) ||
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
                                    this.ascend().every(node => node.blockStatic) ||
                                    (this.documentParent.blockStatic && this.nodeType <= NODE_STANDARD.LINEAR && ((previousSibling == null || !previousSibling.floating) && (nextSibling == null || !nextSibling.floating)))
                                )) ||
                                (this.is(NODE_STANDARD.FRAME) && renderChildren.some(node => node.blockStatic && (node.autoMarginHorizontal || node.autoMarginLeft))) ||
                                (!this.hasElement && this.length > 0 && renderChildren.some(item => item.linear.width >= this.documentParent.box.width) && !renderChildren.some(item => item.plainText && item.multiLine)))
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
                        this.android('layout_height', this.css('overflow') === 'hidden' && this.toInt('height') < this.box.height ? 'wrap_content' : styleMap.height);
                    }
                }
                if (constraint.layoutHeight) {
                    if (constraint.layoutVertical) {
                        this.android('layout_height', 'wrap_content', false);
                    }
                    else if (this.documentRoot) {
                        const bottomHeight: number = Math.max.apply(null, renderChildren.filter(node => node.pageflow).map(node => node.linear.bottom)) || 0;
                        this.android('layout_height', bottomHeight > 0 ? formatPX(bottomHeight + this.paddingBottom + this.borderBottomWidth) : 'match_parent', false);
                    }
                    else {
                        this.android('layout_height', this.actualHeight < heightParent ? formatPX(this.actualHeight) : 'match_parent', false);
                    }
                }
                if (this.has('minHeight', CSS_STANDARD.UNIT)) {
                    this.android('layout_height', 'wrap_content', false);
                    this.android('minHeight', styleMap.minHeight, false);
                }
                if (!this.documentBody &&
                    this.has('maxHeight', CSS_STANDARD.UNIT) &&
                    this.layoutHorizontal)
                {
                    const maxHeight = this.css('maxHeight');
                    for (const node of renderChildren) {
                        if (node.is(NODE_STANDARD.TEXT) && !node.has('maxWidth')) {
                            node.android('maxWidth', maxHeight);
                        }
                    }
                }
            }
            if (this.android('layout_height') === '') {
                if (height >= heightParent &&
                    parent.hasHeight &&
                    !(this.inlineElement && this.nodeType < NODE_STANDARD.INLINE) &&
                    !(renderParent.is(NODE_STANDARD.RELATIVE) && renderParent.inlineHeight))
                {
                    this.android('layout_height', 'match_parent');
                }
                else {
                    if (this.lineHeight > 0 &&
                        !this.plainText &&
                        !renderParent.linearHorizontal)
                    {
                        const boundsHeight = this.actualHeight + renderParent.paddingTop + renderParent.paddingBottom;
                        if (this.inlineElement && boundsHeight > 0 && this.lineHeight >= boundsHeight) {
                            this.android('layout_height', formatPX(boundsHeight));
                            this.modifyBox(BOX_STANDARD.PADDING_TOP, null);
                            this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, null);
                        }
                        else if (
                            this.block &&
                            this.box.height > 0 &&
                            this.lineHeight === this.box.height)
                        {
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
        const textAlignParent = this.cssParent('textAlign');
        const obj = renderParent.is(NODE_STANDARD.GRID) ? 'app' : 'android';
        const left = parseRTL('left');
        const right = parseRTL('right');
        let textAlign = this.styleMap.textAlign || '';
        let verticalAlign = '';
        let floating = '';
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
                    const merged = gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|');
                    return (
                        merged !== '' ? z !== '' ? `${merged}|${z}` : merged
                                      : z
                    );
            }
        }
        function setAutoMargin(node: T) {
            if (!node.blockWidth) {
                const alignment: string[] = [];
                const marginLeft = node.css('marginLeft') === 'auto';
                const marginRight = node.css('marginRight') === 'auto';
                const marginTop = node.css('marginTop') === 'auto';
                const marginBottom = node.css('marginBottom') === 'auto';
                if (marginLeft && marginRight) {
                    alignment.push('center_horizontal');
                }
                else if (marginLeft && !marginRight) {
                    alignment.push(right);
                }
                else if (!marginLeft && marginRight) {
                    alignment.push(left);
                }
                if (marginTop && marginBottom) {
                    alignment.push('center_vertical');
                }
                else if (marginTop && !marginBottom) {
                    alignment.push('bottom');
                }
                else if (!marginTop && marginBottom) {
                    alignment.push('top');
                }
                if (alignment.length > 0) {
                    const gravity = node.blockWidth ? 'gravity' : 'layout_gravity';
                    node[obj](gravity, mergeGravity(node[obj](gravity), ...alignment));
                    return true;
                }
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
        function setTextAlign(value: string) {
            if (textAlign === '' || value === right) {
                return value;
            }
            return textAlign;
        }
        if (!(this.floating || renderParent.of(NODE_STANDARD.RELATIVE, NODE_ALIGNMENT.MULTILINE))) {
            switch (this.styleMap.verticalAlign) {
                case 'top':
                case 'text-top':
                    verticalAlign = 'top';
                    if (renderParent.linearHorizontal && this.inlineHeight) {
                        this.android('layout_height', 'match_parent');
                    }
                    break;
                case 'middle':
                    if (this.inline ||
                        this.documentParent.css('display') === 'table-cell' ||
                        (this.inlineStatic && this.documentParent.lineHeight > 0))
                    {
                        verticalAlign = 'center_vertical';
                    }
                    break;
                case 'bottom':
                case 'text-bottom':
                    verticalAlign = 'bottom';
                    break;
            }
        }
        if (verticalAlign === '' &&
            this.lineHeight > 0 &&
            !this.blockHeight)
        {
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
        if (this.hasAlign(NODE_ALIGNMENT.FLOAT)) {
            if (this.hasAlign(NODE_ALIGNMENT.RIGHT) || this.renderChildren.some(node => node.hasAlign(NODE_ALIGNMENT.RIGHT))) {
                floating = right;
            }
            else if (this.hasAlign(NODE_ALIGNMENT.LEFT) || this.renderChildren.some(node => node.hasAlign(NODE_ALIGNMENT.LEFT))) {
                floating = left;
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
        if (renderParent.is(NODE_STANDARD.FRAME)) {
            if (!setAutoMargin(this)) {
                floating = floating || this.float;
                if (floating !== 'none') {
                    if (renderParent.inlineWidth || (this.singleChild && !renderParent.documentRoot)) {
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
            if (this.is(NODE_STANDARD.LINEAR)) {
                if (this.blockWidth) {
                    textAlign = setTextAlign(floating);
                }
                else {
                    this[obj]('layout_gravity', mergeGravity(this[obj]('layout_gravity'), floating));
                }
            }
            else if (renderParent.hasAlign(NODE_ALIGNMENT.VERTICAL)) {
                textAlign = setTextAlign(floating);
            }
        }
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
        if (this.documentRoot && (this.blockWidth || this.is(NODE_STANDARD.FRAME))) {
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
                    if (top !== 0 &&
                        top === bottom &&
                        bottom === left &&
                        left === right)
                    {
                        this.delete('android', `${value}*`);
                        this.android(value, formatPX(top));
                    }
                    else {
                        if (!(this.renderParent.is(NODE_STANDARD.GRID) && index === 0)) {
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
        if (this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP)) {
            const linearHorizontal = this.linearHorizontal;
            if (this.blockWidth && !this.blockStatic) {
                [[linearHorizontal, this.inlineElement, 'width'], [!linearHorizontal, true, 'height']].forEach((value: [boolean, boolean, string]) => {
                    const attr = `inline${capitalize(value[2])}`;
                    if (value[0] &&
                        value[1] &&
                        !this[attr] && renderChildren.every(node => node[attr]))
                    {
                        this.android(`layout_${value[2]}`, 'wrap_content');
                    }
                });
            }
            if (linearHorizontal) {
                if (!renderChildren.some(node => node.imageElement && node.baseline) && (
                        this.hasAlign(NODE_ALIGNMENT.FLOAT) ||
                        renderChildren.some(node => node.floating || !node.siblingflow)
                   ))
                {
                    this.android('baselineAligned', 'false');
                }
                else {
                    if (renderChildren.some(node => !node.alignOrigin || !node.baseline) ||
                        renderParent.android('baselineAlignedChildIndex') !== '' ||
                        (renderChildren.some(node => node.nodeType < NODE_STANDARD.TEXT) && renderChildren.some(node => node.textElement && node.baseline)) ||
                        (renderParent.is(NODE_STANDARD.GRID) && !renderChildren.some(node => node.textElement && node.baseline)))
                    {
                        const baseline = NodeList.textBaseline(renderChildren);
                        if (baseline.length > 0) {
                            this.android('baselineAlignedChildIndex', renderChildren.indexOf(baseline[0]).toString());
                        }
                    }
                }
                if (settings.ellipsisOnTextOverflow &&
                    this.length > 1 &&
                    renderChildren.every(node => node.textElement && !node.floating))
                {
                    const node = renderChildren[renderChildren.length - 1];
                    if (node.textElement && !node.multiLine && node.textContent.trim().split(String.fromCharCode(32)).length > 1) {
                        node.android('singleLine', 'true');
                    }
                }
            }
        }
        if (this.linearHorizontal || this.of(NODE_STANDARD.RELATIVE, NODE_ALIGNMENT.HORIZONTAL)) {
            const pageflow = renderChildren.filter(node => !node.floating && (node.hasElement || node.renderChildren.length === 0));
            if (pageflow.length > 0 &&
                pageflow.some(node => node.imageElement && node.toInt('verticalAlign') > 0) &&
                pageflow.every(node => node.baseline || node.has('verticalAlign', CSS_STANDARD.UNIT)))
            {
                const marginTop: number = Math.max.apply(null, pageflow.map(node => node.toInt('verticalAlign')));
                const tallest: T[] = [];
                let offsetTop = 0;
                if (marginTop > 0) {
                    pageflow.forEach(node => {
                        const offset = node.toInt('verticalAlign');
                        const offsetHeight = (node.imageElement ? node.bounds.height : 0) + (offset > 0 ? offset : 0);
                        if (offsetHeight >= offsetTop) {
                            if (offsetHeight > offsetTop) {
                                tallest.length = 0;
                            }
                            tallest.push(node);
                            offsetTop = offsetHeight;
                        }
                    });
                    tallest.sort(a => a.imageElement ? -1 : 1);
                    pageflow.forEach(node => {
                        if (!tallest.includes(node)) {
                            const offset = node.toInt('verticalAlign');
                            if (marginTop > 0) {
                                node.modifyBox(BOX_STANDARD.MARGIN_TOP, offsetTop - (tallest[0].imageElement ? node.bounds.height : 0));
                            }
                            if (offset !== 0) {
                                node.modifyBox(BOX_STANDARD.MARGIN_TOP, offset * -1, true);
                                node.css('verticalAlign', '0px');
                            }
                        }
                    });
                    tallest.forEach(node => node.css('verticalAlign', '0px'));
                }
            }
        }
        if (this.inline && !this.floating) {
            const offset = this.toInt('verticalAlign');
            if (offset !== 0) {
                this.modifyBox(BOX_STANDARD.MARGIN_TOP, offset * -1, true);
                if (offset < 0 &&
                    renderParent.layoutHorizontal &&
                    renderParent.inlineHeight)
                {
                    renderParent.android('layout_height', formatPX(renderParent.bounds.height));
                }
            }
        }
        if (this.pageflow) {
            if (!renderParent.documentBody && renderParent.blockStatic && this.documentParent === renderParent) {
                [['firstElementChild', 'Top', BOX_STANDARD.MARGIN_TOP, BOX_STANDARD.PADDING_TOP], ['lastElementChild', 'Bottom', BOX_STANDARD.MARGIN_BOTTOM, BOX_STANDARD.PADDING_BOTTOM]].forEach((item: [string, string, number, number], index: number) => {
                    const node = getNodeFromElement(renderParent[item[0]]);
                    if (node &&
                        !node.lineBreak &&
                        (node === this || node === this.renderChildren[index === 0 ? 0 : this.renderChildren.length - 1]))
                    {
                        const marginOffset = renderParent[`margin${item[1]}`];
                        if (marginOffset > 0 &&
                            renderParent[`padding${item[1]}`] === 0 &&
                            renderParent[`border${item[1]}Width`] === 0)
                        {
                            node.modifyBox(item[2], null);
                        }
                    }
                });
            }
            if (this.hasElement && this.blockStatic) {
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
            let layoutWidth = convertInt(this.android('layout_width'));
            let layoutHeight = convertInt(this.android('layout_height'));
            let borderWidth = false;
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
                    if (layoutWidth > 0) {
                        this.android('layout_width', formatPX(layoutWidth + width));
                    }
                    else {
                        layoutWidth = convertInt(renderParent.android('layout_width'));
                        if (layoutWidth > 0 && this.singleChild) {
                            renderParent.android('layout_width', formatPX(layoutWidth + this.marginLeft + width));
                        }
                    }
                }
                if (height > 0) {
                    if (layoutHeight > 0) {
                        this.android('layout_height', formatPX(layoutHeight + height));
                    }
                    else {
                        layoutHeight = convertInt(renderParent.android('layout_height'));
                        if (layoutHeight > 0 && this.singleChild) {
                            renderParent.android('layout_height', formatPX(layoutHeight + this.marginTop + height));
                        }
                    }
                }
            }
            else if (this.is(NODE_STANDARD.BUTTON) && layoutHeight === 0) {
                this.android('layout_height', formatPX(this.bounds.height + (this.css('borderStyle') === 'outset' ? convertInt(this.css('borderWidth')) : 0)));
            }
            else if (this.is(NODE_STANDARD.LINE)) {
                if (layoutHeight > 0 &&
                    this.has('height', 0, { map: 'initial' }) &&
                    this.tagName !== 'HR')
                {
                    this.android('layout_height', formatPX(layoutHeight + this.borderTopWidth + this.borderBottomWidth));
                }
            }
            else if (this.tagName === 'TABLE') {
                const width = convertInt(this.android('layout_width'));
                if (width > 0) {
                    if (this.bounds.width > width) {
                        this.android('layout_width', formatPX(this.bounds.width));
                    }
                    if (this.has('width', CSS_STANDARD.AUTO, { map: 'initial' }) && renderChildren.every(node => node.inlineWidth)) {
                        for (const node of renderChildren) {
                            node.android('layout_width', '0px');
                            node.app('layout_columnWeight', '1');
                        }
                    }
                }
                borderWidth = this.css('boxSizing') === 'content-box';
            }
            else {
                if (this.hasElement && !this.hasBit('excludeResource', NODE_RESOURCE.BOX_SPACING)) {
                    if (!(renderParent.tagName === 'TABLE' || this.css('boxSizing') === 'border-box')) {
                        const minWidth = convertInt(this.android('minWidth'));
                        const minHeight = convertInt(this.android('minHeight'));
                        const paddedWidth = this.paddingLeft + this.paddingRight + this.borderLeftWidth + this.borderRightWidth;
                        const paddedHeight = this.paddingTop + this.paddingBottom + this.borderTopWidth + this.borderBottomWidth;
                        if (layoutWidth > 0 &&
                            this.toInt('width', 0, { map: 'initial' }) > 0 &&
                            paddedWidth > 0)
                        {
                            this.android('layout_width', formatPX(layoutWidth + paddedWidth));
                        }
                        if (layoutHeight > 0 &&
                            this.toInt('height', 0, { map: 'initial' }) > 0 &&
                            paddedHeight > 0 && (
                                this.lineHeight === 0 ||
                                this.lineHeight < this.box.height ||
                                this.lineHeight === this.toInt('height')
                           ))
                        {
                            this.android('layout_height', formatPX(layoutHeight + paddedHeight));
                        }
                        if (minWidth > 0 && paddedWidth > 0) {
                            this.android('minWidth', formatPX(minWidth + paddedWidth));
                        }
                        if (minHeight > 0 && paddedHeight > 0) {
                            this.android('minHeight', formatPX(minHeight + paddedHeight));
                        }
                    }
                    borderWidth = true;
                }
            }
            if (borderWidth) {
                this.modifyBox(BOX_STANDARD.PADDING_TOP, this.borderTopWidth);
                this.modifyBox(BOX_STANDARD.PADDING_RIGHT, this.borderRightWidth);
                this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, this.borderBottomWidth);
                this.modifyBox(BOX_STANDARD.PADDING_LEFT, this.borderLeftWidth);
            }
        }
        if (this.position === 'relative' || renderParent.is(NODE_STANDARD.FRAME)) {
            const top = this.toInt('top');
            const bottom = this.toInt('bottom');
            const left = this.toInt('left');
            if (top !== 0) {
                if (top < 0 &&
                    renderParent.is(NODE_STANDARD.RELATIVE, NODE_STANDARD.LINEAR) &&
                    this.floating &&
                    !!this.data('RESOURCE', 'backgroundImage'))
                {
                    let found = false;
                    renderParent.renderChildren.some((node: T) => {
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
                if (this.float === 'right' || (this.position === 'relative' && this.autoMarginLeft)) {
                    this.modifyBox(BOX_STANDARD.MARGIN_RIGHT, left * -1, true);
                }
                else {
                    this.modifyBox(BOX_STANDARD.MARGIN_LEFT, left, true);
                }
            }
        }
        if (!this.plainText && !renderParent.linearHorizontal) {
            const offset = (this.lineHeight + this.toInt('verticalAlign')) - this.actualHeight;
            if (offset > 0) {
                this.modifyBox(BOX_STANDARD.MARGIN_TOP, Math.floor(offset / 2));
                this.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, Math.ceil(offset / 2));
            }
        }
    }

    private bindWhiteSpace() {
        if (!this.hasAlign(NODE_ALIGNMENT.FLOAT) && (
            this.linearHorizontal ||
            this.of(NODE_STANDARD.RELATIVE, NODE_ALIGNMENT.HORIZONTAL, NODE_ALIGNMENT.MULTILINE) ||
            this.of(NODE_STANDARD.CONSTRAINT, NODE_ALIGNMENT.HORIZONTAL)
           ))
        {
            const textAlign = this.css('textAlign');
            const textIndent = this.toInt('textIndent');
            const valueBox = this.valueBox(BOX_STANDARD.PADDING_LEFT);
            const relative = this.is(NODE_STANDARD.RELATIVE);
            let right = this.box.left + (textIndent > 0 ? this.toInt('textIndent')
                                                        : textIndent < 0 && valueBox[0] === 1 ? valueBox[0] : 0);
            this.each((node: T, index) => {
                if (!(node.floating || (relative && node.alignParent('left')) || (index === 0 && (textAlign !== 'left' || node.plainText)) || ['SUP', 'SUB'].includes(node.tagName))) {
                    const width = Math.round(node.actualLeft() - right);
                    if (width >= 1) {
                        node.modifyBox(BOX_STANDARD.MARGIN_LEFT, width);
                    }
                }
                right = node.actualRight();
            }, true);
        }
        else if (this.linearVertical) {
            this.each((node: T) => {
                const previous = (() => {
                    let sibling: Null<T> = node;
                    do {
                        sibling = sibling.previousSibling(true, false, false) as T;
                    }
                    while (sibling && !this.initial.children.includes(sibling));
                    return sibling;
                })();
                if (getElementsBetweenSiblings(
                        previous != null ? previous.length > 0 && !previous.hasElement ? previous.lastElementChild : previous.baseElement
                                         : null,
                        node.baseElement)
                            .some(element => {
                                const item = getNodeFromElement(element);
                                if (item && (item.lineBreak || (item.excluded && item.blockStatic))) {
                                    return true;
                                }
                                return false;
                            }
                        )
                    )
                {
                    let bottom: number;
                    if (previous == null) {
                        bottom = this.box.top;
                    }
                    else {
                        bottom = (() => {
                            if (previous.layoutHorizontal &&
                                previous.length > 0 &&
                                previous.renderChildren.some(item => !item.floating))
                            {
                                return (
                                    previous.renderChildren
                                        .filter(item => !item.floating)
                                        .sort((a, b) => a.linear.bottom < b.linear.bottom ? 1 : -1)[0]
                                        .linear.bottom
                                );
                            }
                            return previous.linear.bottom;
                        })();
                    }
                    const height = Math.round(node.linear.top - bottom);
                    if (height >= 1) {
                        node.modifyBox(BOX_STANDARD.MARGIN_TOP, height);
                    }
                }
            }, true);
        }
    }

    get stringId() {
        return this.nodeId ? `@+id/${this.nodeId}` : '';
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
            return value != null ? View.getControlName(value) : '';
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
        return this.constraint.horizontal && this.constraint.vertical;
    }

    get layoutHorizontal() {
        return this.linearHorizontal || (this.is(NODE_STANDARD.FRAME) && this.nodes.every(node => node.domElement)) || this.hasAlign(NODE_ALIGNMENT.HORIZONTAL) || NodeList.linearX(this.nodes);
    }
    get layoutVertical() {
        return this.linearVertical || (this.is(NODE_STANDARD.FRAME) && this.nodes.some(node => node.linearVertical)) || this.hasAlign(NODE_ALIGNMENT.VERTICAL) || NodeList.linearY(this.nodes);
    }

    get linearHorizontal() {
        return this._android.orientation === AXIS_ANDROID.HORIZONTAL && this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP);
    }
    get linearVertical() {
        return this._android.orientation === AXIS_ANDROID.VERTICAL && this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP);
    }

    get inlineWidth() {
        return this._android.layout_width === 'wrap_content';
    }
    get inlineHeight() {
        return this._android.layout_height === 'wrap_content';
    }

    get blockWidth() {
        return this._android.layout_width === 'match_parent';
    }
    get blockHeight() {
        return this._android.layout_height === 'match_parent';
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