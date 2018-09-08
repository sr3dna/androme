import { Null, ObjectMap, StringMap } from '../lib/types';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { capitalize, convertEnum, convertFloat, convertInt, convertWord, formatPX, hasValue, isPercent, isUnit, lastIndexOf, withinFraction } from '../lib/util';
import { calculateBias, generateId, stripId } from './lib/util';
import { getElementCache, getElementsBetweenSiblings, getNodeFromElement, getStyle } from '../lib/dom';
import API_ANDROID from './customizations';
import parseRTL from './localization';
import { BOX_STANDARD, MAP_ELEMENT, NODE_ALIGNMENT, NODE_PROCEDURE, NODE_RESOURCE, NODE_STANDARD } from '../lib/constants';
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
            return;
        }
        super.attr(obj, attr, value, overwrite);
    }

    public android(attr: string, value = '', overwrite = true) {
        if (hasValue(value)) {
            this.attr('android', attr, value, overwrite);
        }
        else {
            return (this._android[attr] != null ? this._android[attr] : null);
        }
    }

    public app(attr: string, value = '', overwrite = true) {
        if (hasValue(value)) {
            this.attr('app', attr, value, overwrite);
        }
        else {
            return (this._app[attr] != null ? this._app[attr] : null);
        }
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

    public modifyBox(region: number, offset: number | null, negative = false, bounds = false) {
        const name = convertEnum(region, BOX_STANDARD, BOX_ANDROID);
        if (name !== '' && offset !== 0) {
            const attr = name.replace('layout_', '');
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
                this.setDimensions([(attr.indexOf('margin') ? 'linear' : 'box')]);
            }
        }
    }

    public valueBox(region: string | number) {
        const name = convertEnum(parseInt(<string> region), BOX_STANDARD, BOX_ANDROID);
        if (name !== '') {
            const attr = parseRTL(name);
            return [attr, this.android(attr) || '0px'];
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
        node.inherit(this, 'base', 'style', 'styleMap');
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
        if (this.android('id') != null) {
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
            const widthParent = (parent.box ? parent.box.width : (parent.element instanceof HTMLElement ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + parent.borderLeftWidth + parent.borderRightWidth) : 0));
            const heightParent = (parent.box ? parent.box.height : (parent.element instanceof HTMLElement ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + parent.borderTopWidth + parent.borderBottomWidth) : 0));
            if (width == null) {
                width = (this.linear ? this.linear.width : (this.hasElement ? this.element.clientWidth + this.borderLeftWidth + this.borderRightWidth + this.marginLeft + this.marginRight : 0));
            }
            if (height == null) {
                height = (this.linear ? this.linear.height : (this.hasElement ? this.element.clientHeight + this.borderTopWidth + this.borderBottomWidth + this.marginTop + this.marginBottom : 0));
            }
            if ((this.documentRoot && !this.flex.enabled && this.is(NODE_STANDARD.FRAME, NODE_STANDARD.CONSTRAINT, NODE_STANDARD.RELATIVE)) || this.documentBody) {
                if (this.viewWidth === 0 && this.block && !constraint.layoutHorizontal) {
                    if (this.centerMarginHorizontal) {
                        this.android('layout_width', 'wrap_content', false);
                    }
                    else {
                        this.android('layout_width', 'match_parent', false);
                    }
                }
                if (this.viewHeight === 0 && this.cascade().some(node => !node.pageflow) && !constraint.layoutHeight && !constraint.layoutVertical) {
                    this.android('layout_height', 'match_parent', false);
                }
            }
            if (this.android('layout_width') !== '0px') {
                if (!this.inlineStatic) {
                    if (this.toInt('width') > 0) {
                        if (isPercent(styleMap.width)) {
                            if (styleMap.width === '100%') {
                                this.android('layout_width', 'match_parent', false);
                            }
                            else {
                                this.android('layout_width', formatPX(Math.ceil(this.bounds.width)), false);
                            }
                        }
                        else {
                            this.android('layout_width', styleMap.width);
                        }
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
            }
            if (this.has('minWidth') && !isPercent(styleMap.minWidth)) {
                this.android('layout_width', 'wrap_content', false);
                this.android('minWidth', styleMap.minWidth, false);
            }
            if (this.has('maxWidth') && !isPercent(styleMap.maxWidth)) {
                this.android('maxWidth', styleMap.maxWidth, false);
            }
            if (this.android('layout_width') == null) {
                if (convertFloat(this.app('layout_columnWeight')) > 0) {
                    this.android('layout_width', '0px');
                }
                else {
                    const wrap = (this.nodeType < NODE_STANDARD.INLINE || this.inlineElement || !this.pageflow || this.display === 'table' || parent.flex.enabled || (renderParent.inlineElement && renderParent.viewWidth === 0 && !this.inlineElement && this.nodeType > NODE_STANDARD.BLOCK) || renderParent.is(NODE_STANDARD.GRID));
                    if (!wrap || this.blockStatic) {
                        const inlineRight = Math.max.apply(null, [0, ...this.renderChildren.filter(node => node.inlineElement && node.float !== 'right').map(node => node.linear.right)]);
                        const previousSibling = this.previousSibling;
                        const nextSibling = this.nextSibling;
                        if ((this.hasElement && this.blockStatic && (
                                this.ascend(true).every(node => node.blockStatic) ||
                                (this.documentParent.blockStatic && this.nodeType <= NODE_STANDARD.LINEAR && ((previousSibling === null || !previousSibling.floating) && (nextSibling === null || !nextSibling.floating)))
                            )) ||
                            (!this.hasElement && this.renderChildren.length > 0 && this.renderChildren.some(item => item.linear.width >= this.documentParent.box.width)) ||
                            (width >= widthParent && (parent.documentBody || renderParent.documentRoot || this.nodeType < NODE_STANDARD.BLOCK) || this.ascend(true).reduce((a: number, b: T) => Math.max(a, b.toInt('width')), 0) > 0) ||
                            (inlineRight > 0 && ((this.is(NODE_STANDARD.FRAME) || this.linearVertical) && !withinFraction(inlineRight, this.box.right))))
                        {
                            this.android('layout_width', 'match_parent');
                        }
                        else if (renderParent.linearVertical && (!this.inlineElement || this.blockStatic) && (this.is(NODE_STANDARD.TEXT) || renderParent.blockWidth)) {
                            const widest: T[] = [];
                            let widestRight = 0;
                            for (const node of renderParent.children) {
                                const inside = node.cascade().filter(item => item.visible).reduce((a: number, b: T) => Math.max(a, b.linear.right), 0) + node.paddingRight + node.borderRightWidth + node.marginRight;
                                if (inside > widestRight) {
                                    widest.length = 0;
                                    widest.push(node);
                                    widestRight = inside;
                                }
                                else if (inside === widestRight) {
                                    widest.push(node);
                                }
                            }
                            if (!widest.includes(this)) {
                                this.android('layout_width', 'match_parent');
                            }
                        }
                    }
                    if (this.android('layout_width') == null) {
                        this.android('layout_width', 'wrap_content');
                    }
                }
            }
            if (this.android('layout_height') !== '0px') {
                if (!this.inlineStatic) {
                    if (this.toInt('height') > 0) {
                        if (isPercent(styleMap.height)) {
                            if (styleMap.height === '100%') {
                                this.android('layout_height', 'match_parent', false);
                            }
                            else {
                                this.android('layout_height', formatPX(Math.ceil(this.bounds.height)), false);
                            }
                        }
                        else {
                            this.android('layout_height', (this.css('overflow') === 'hidden' && this.toInt('height') < this.box.height ? 'wrap_content' : styleMap.height));
                        }
                    }
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
            }
            if (this.has('minHeight') && !isPercent(styleMap.minHeight)) {
                this.android('layout_height', 'wrap_content', false);
                this.android('minHeight', styleMap.minHeight, false);
            }
            if (this.has('maxHeight') && !isPercent(styleMap.maxHeight)) {
                this.android('maxHeight', styleMap.maxHeight, false);
            }
            if (this.android('layout_height') == null) {
                if (height >= heightParent && parent.viewHeight > 0 && !(this.inlineElement && this.nodeType < NODE_STANDARD.INLINE) && !(renderParent.is(NODE_STANDARD.RELATIVE) && renderParent.inlineHeight)) {
                    this.android('layout_height', 'match_parent');
                }
                else {
                    if (this.inlineElement && this.bounds.height > 0 && this.lineHeight >= this.bounds.height) {
                        this.android('layout_height', formatPX(this.bounds.height));
                        this.modifyBox(BOX_STANDARD.PADDING_TOP, null);
                        this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, null);
                    }
                    else if (this.block && this.box.height > 0 && this.lineHeight === this.box.height) {
                        this.android('layout_height', formatPX(this.bounds.height));
                    }
                    else {
                        this.android('layout_height', 'wrap_content');
                    }
                }
            }
            if (this.blockWidth && parent.block && parent.has('maxWidth')) {
                this.android('maxWidth', parent.css('maxWidth'), false);
            }
        }
        if (this.cssParent('visibility', true) === 'hidden') {
            this.android('visibility', 'invisible');
        }
    }

    public setAlignment() {
        const renderParent = this.renderParent;
        const obj = (this.renderParent.is(NODE_STANDARD.GRID) ? 'app' : 'android');
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
            if (node.centerMarginVertical) {
                alignment.push('center_vertical');
            }
            else if (node.css('marginTop') === 'auto') {
                alignment.push('bottom');
            }
            if (alignment.length > 0) {
                node[obj]('layout_gravity', mergeGravity(node[obj]('layout_gravity'), ...alignment));
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
                    if (this.documentParent.css('display') === 'table-cell' || (this.inlineStatic && this.documentParent.lineHeight > 0) || renderParent.of(NODE_STANDARD.LINEAR, NODE_ALIGNMENT.HORIZONTAL)) {
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
        if (renderParent.linearVertical || (this.documentRoot && this.inlineWidth)) {
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
            if (renderParent.is(NODE_STANDARD.FRAME) && this.singleChild && !this.floating && !this.autoMargin) {
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

    public applyOptimizations(options: ObjectMap<any>) {
        const renderParent = this.renderParent;
        const renderChildren = this.renderChildren;
        const renderEvery = (this.hasElement && Array.from(this.element.children).every(element => renderChildren.includes(getNodeFromElement(element) as T)));
        if (this.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP)) {
            if (this.display !== 'block') {
                [[this.linearHorizontal, this.inlineElement, 'width'], [this.linearVertical, true, 'height']].forEach((value: [boolean, boolean, string]) => {
                    const attr = `inline${capitalize(value[2])}`;
                    if (value[0] && value[1] && !this[attr] && renderChildren.every(node => node[attr])) {
                        this.android(`layout_${value[2]}`, 'wrap_content');
                    }
                });
            }
            if (this.linearHorizontal) {
                if (renderChildren.some(node => node.floating || !node.siblingflow || (node.imageElement && node.baseline)) || this.hasBit('alignmentType', NODE_ALIGNMENT.FLOAT)) {
                    this.android('baselineAligned', 'false');
                }
                else if ((renderParent.is(NODE_STANDARD.GRID) || renderChildren.some(node => node.toInt('verticalAlign') !== 0 || !node.alignMargin) || renderParent.android('baselineAlignedChildIndex') != null) && renderChildren.some(node => node.nodeType <= NODE_STANDARD.TEXT)) {
                    const baseline = NodeList.textBaseline(renderChildren, false, (renderParent.is(NODE_STANDARD.GRID) || !renderChildren.some(node => node.textElement)));
                    if (baseline != null) {
                        this.android('baselineAlignedChildIndex', renderChildren.indexOf(baseline).toString());
                    }
                }
                if (renderEvery) {
                    const inline = renderChildren.filter(node => !node.floating);
                    if (inline.every(node => node.baseline || isUnit(node.css('verticalAlign')))) {
                        const marginTop = Math.max.apply(null, inline.map(node => node.toInt('verticalAlign')));
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
            }
        }
        if (this.pageflow) {
            if (!renderParent.documentBody && renderParent.blockStatic && this.documentParent === renderParent) {
                [['firstElementChild', 'Top', BOX_STANDARD.MARGIN_TOP, BOX_STANDARD.PADDING_TOP], ['lastElementChild', 'Bottom', BOX_STANDARD.MARGIN_BOTTOM, BOX_STANDARD.PADDING_BOTTOM]].forEach((item: [string, string, number, number], index: number) => {
                    const firstNode = getNodeFromElement(renderParent[item[0]]);
                    if (firstNode && (firstNode === this || firstNode === this.renderChildren[(index === 0 ? 0 : this.renderChildren.length - 1)])) {
                        const marginOffset = renderParent[`margin${item[1]}`];
                        if (marginOffset > 0 && renderParent[`padding${item[1]}`] === 0 && renderParent[`border${item[1]}Width`] === 0) {
                            firstNode.modifyBox(item[2], null);
                        }
                    }
                });
            }
            if (this.blockStatic && renderChildren.every(node => renderChildren[0].documentParent === node.documentParent)) {
                const lastIndex = renderChildren.length - 1;
                for (let i = 0; i < renderChildren.length; i++) {
                    const current = renderChildren[i];
                    if (current.blockStatic) {
                        const previousSibling = current.previousSibling;
                        if (previousSibling != null) {
                            const marginTop = convertInt(current.cssOriginal('marginTop', true));
                            const marginBottom = convertInt(previousSibling.cssOriginal('marginBottom', true));
                            if (marginBottom > 0 && marginTop > 0) {
                                if (marginTop <= marginBottom) {
                                    current.modifyBox(BOX_STANDARD.MARGIN_TOP, null);
                                }
                                else {
                                    previousSibling.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, null);
                                }
                            }
                        }
                    }
                    [current.element.previousElementSibling, (i === lastIndex ? current.element.nextElementSibling : null)].forEach((item, index) => {
                        if (!getNodeFromElement(item)) {
                            const styleMap: StringMap = getElementCache(item, 'styleMap');
                            if (styleMap) {
                                const offset = Math.min(convertInt(styleMap.marginTop), convertInt(styleMap.marginBottom));
                                if (offset < 0) {
                                    if (index === 0) {
                                        current.modifyBox(BOX_STANDARD.MARGIN_TOP, offset, true);
                                    }
                                    else {
                                        current.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, offset, true);
                                    }
                                }
                            }
                        }
                    });
                }
            }
        }
        this.bindWhiteSpace();
        if (options.autoSizePaddingAndBorderWidth && !this.hasBit('excludeProcedure', NODE_PROCEDURE.AUTOFIT)) {
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
                if (viewHeight > 0 && this.cssOriginal('height') !== '' && this.cssOriginal('height') !== 'auto') {
                    this.android('layout_height', formatPX(viewHeight + this.borderTopWidth + this.borderBottomWidth));
                }
            }
            else {
                if (this.hasElement && !this.hasBit('excludeResource', NODE_RESOURCE.BOX_SPACING)) {
                    const tableElement = (this.tagName === 'TABLE');
                    const borderCollapse = ((renderParent.display === 'table' || renderParent.tagName === 'TABLE') && renderParent.css('borderCollapse') === 'collapse');
                    let resizedWidth = false;
                    let resizedHeight = false;
                    if (!(tableElement && isPercent(this.cssOriginal('width')))) {
                        if (viewWidth > 0 && convertInt(this.cssOriginal('width')) > 0) {
                            const paddedWidth = this.paddingLeft + this.paddingRight + (!borderCollapse ? this.borderLeftWidth + this.borderRightWidth : 0);
                            if (!tableElement && paddedWidth > 0) {
                                this.android('layout_width', formatPX(viewWidth + paddedWidth));
                            }
                            resizedWidth = true;
                        }
                        const borderLeft = this.borderLeftWidth - (tableElement && resizedWidth ? this.paddingLeft : 0);
                        const borderRight = this.borderRightWidth - (tableElement && resizedWidth ? this.paddingRight : 0);
                        if (borderLeft > 0) {
                            this.modifyBox(BOX_STANDARD.PADDING_LEFT, borderLeft);
                        }
                        if (borderRight > 0) {
                            this.modifyBox(BOX_STANDARD.PADDING_RIGHT, borderRight);
                        }
                    }
                    if (!(tableElement && isPercent(this.cssOriginal('height')))) {
                        if (viewHeight > 0 && convertInt(this.cssOriginal('height')) > 0) {
                            if (this.lineHeight === 0 || this.lineHeight < this.box.height || this.lineHeight === this.toInt('height')) {
                                const paddedHeight = this.paddingTop + this.paddingBottom + (!borderCollapse ? this.borderTopWidth + this.borderBottomWidth : 0);
                                if (!tableElement) {
                                    this.android('layout_height', formatPX(viewHeight + paddedHeight));
                                }
                                resizedHeight = true;
                            }
                        }
                        const borderTop = this.borderTopWidth - (tableElement && resizedHeight ? this.paddingTop : 0);
                        const borderBottom = this.borderBottomWidth - (tableElement && resizedHeight ? this.paddingBottom : 0);
                        if (borderTop > 0) {
                            this.modifyBox(BOX_STANDARD.PADDING_TOP, borderTop);
                        }
                        if (borderBottom > 0) {
                            this.modifyBox(BOX_STANDARD.PADDING_BOTTOM, borderBottom);
                        }
                    }
                }
            }
        }
        if (!renderParent.linearHorizontal) {
            const offset = this.lineHeight - this.bounds.height;
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
                this.modifyBox(BOX_STANDARD.MARGIN_TOP, top, true);
            }
            else if (bottom !== 0) {
                this.modifyBox(BOX_STANDARD.MARGIN_TOP, bottom * -1, true);
            }
            if (left !== 0) {
                if (this.float === 'right' || (this.position === 'relative' && this.cssOriginal('marginLeft') === 'auto')) {
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
                    renderParent.android('layout_height', formatPX(renderParent.bounds.height + Math.abs(verticalAlign)));
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
        if (this.linearHorizontal) {
            if (!this.hasBit('alignmentType', NODE_ALIGNMENT.FLOAT)) {
                let left = this.box.left;
                this.each((node: T) => {
                    if (!node.floating) {
                        const width = Math.round(node.linear.left - left);
                        if (width >= 1) {
                            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, width);
                        }
                    }
                    left = node.linear.right;
                }, true);
            }
        }
        else if (this.linearVertical) {
            let top = this.box.top;
            let previous: Null<T> = null;
            this.each((node: T) => {
                if (previous && !previous.hasElement && previous.renderChildren.includes(node.previousSibling as T)) {
                    previous = node.previousSibling as T;
                }
                if ((!node.hasElement && !node.plainText) || getElementsBetweenSiblings((previous != null ? previous.element : null), node.element).filter(element => element.tagName === 'BR' || (!getNodeFromElement(element) && getStyle(element).display === 'block')).length > 0) {
                    const height = Math.round(node.linear.top - top);
                    if (height >= 1) {
                        node.modifyBox(BOX_STANDARD.MARGIN_TOP, height);
                    }
                }
                top = (() => {
                    if (node.linearHorizontal && node.renderChildren.some(item => !item.floating)) {
                        return node.renderChildren.filter(item => !item.floating).sort((a, b) => (a.linear.bottom < b.linear.bottom ? 1 : -1))[0].linear.bottom;
                    }
                    return node.linear.bottom;
                })();
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