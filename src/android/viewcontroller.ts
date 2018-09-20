import { ControllerSettings, Null, ObjectIndex, ObjectMap, StringMap, ViewData } from '../lib/types';
import Controller from '../base/controller';
import NodeList from '../base/nodelist';
import Resource from '../base/resource';
import View from './view';
import ViewGroup from './viewgroup';
import { capitalize, convertInt, convertEnum, convertPX, formatPX, hasValue, indexOf, isPercent, isUnit, optional, repeat, sameValue, search, sortAsc, withinFraction, withinRange } from '../lib/util';
import { delimitDimens, generateId, replaceUnit, resetId, stripId } from './lib/util';
import { formatResource } from './extension/lib/util';
import { getElementsBetweenSiblings, getRangeClientRect, hasLineBreak, isLineBreak } from '../lib/dom';
import { formatPlaceholder, removePlaceholders, replaceTab } from '../lib/xml';
import { BOX_STANDARD, CSS_STANDARD, NODE_ALIGNMENT, NODE_PROCEDURE, NODE_RESOURCE, NODE_STANDARD } from '../lib/constants';
import { AXIS_ANDROID, BOX_ANDROID, NODE_ANDROID, WEBVIEW_ANDROID, XMLNS_ANDROID } from './constants';
import parseRTL from './localization';
import SETTINGS from '../settings';

const MAP_LAYOUT = {
    relativeParent: {
        top: 'layout_alignParentTop',
        bottom: 'layout_alignParentBottom'
    },
    relative: {
        top: 'layout_alignTop',
        bottom: 'layout_alignBottom',
        baseline: 'layout_alignBaseline',
        bottomTop: 'layout_above',
        topBottom: 'layout_below'
    },
    constraint: {
        top: 'layout_constraintTop_toTopOf',
        bottom: 'layout_constraintBottom_toBottomOf',
        baseline: 'layout_constraintBaseline_toBaselineOf',
        bottomTop: 'layout_constraintBottom_toTopOf',
        topBottom: 'layout_constraintTop_toBottomOf'
    }
};

const MAP_CHAIN = {
    direction: ['horizontalChain', 'verticalChain'],
    leftTop: ['left', 'top'],
    rightBottom: ['right', 'bottom'],
    rightLeftBottomTop: ['rightLeft', 'bottomTop'],
    leftRightTopBottom: ['leftRight', 'topBottom'],
    widthHeight: ['Width', 'Height'],
    horizontalVertical: ['Horizontal', 'Vertical']
};

export default class ViewController<T extends View> extends Controller<T> {
    private _merge = {};

    constructor() {
        super();
        resetId();
    }

    public finalize(data: ViewData<NodeList<T>>) {
        this.setAttributes(data);
        for (const value of [...data.views, ...data.includes]) {
            value.content = removePlaceholders(value.content).replace(/\n\n/g, '\n');
            if (SETTINGS.dimensResourceValue) {
                value.content = this.parseDimensions(value.content);
            }
            value.content = replaceUnit(value.content);
            value.content = replaceTab(value.content, SETTINGS.insertSpaces);
        }
    }

    public reset() {
        super.reset();
        resetId();
        this._merge = {};
    }

    public setConstraints() {
        Object.assign(MAP_LAYOUT.relativeParent, {
            left: parseRTL('layout_alignParentLeft'),
            right: parseRTL('layout_alignParentRight')
        });
        Object.assign(MAP_LAYOUT.relative, {
            left: parseRTL('layout_alignLeft'),
            right: parseRTL('layout_alignRight'),
            leftRight: parseRTL('layout_toRightOf'),
            rightLeft: parseRTL('layout_toLeftOf')
        });
        Object.assign(MAP_LAYOUT.constraint, {
            left: parseRTL('layout_constraintLeft_toLeftOf'),
            right: parseRTL('layout_constraintRight_toRightOf'),
            leftRight: parseRTL('layout_constraintLeft_toRightOf'),
            rightLeft: parseRTL('layout_constraintRight_toLeftOf')
        });
        const relativeParent = MAP_LAYOUT.relativeParent;
        let mapLayout;
        let constraint = false;
        let relative = false;
        function mapParent(node: T, direction: string) {
            if (constraint) {
                return (node.app(mapLayout[direction]) === 'parent');
            }
            else {
                return (node.android(relativeParent[direction]) === 'true');
            }
        }
        function mapSibling(node: T, direction: string) {
            return node[(constraint ? 'app' : 'android')](mapLayout[direction]);
        }
        function mapDelete(node: T, ...direction: string[]) {
            node.delete((constraint ? 'app' : 'android'), ...direction.map(value => mapLayout[value]));
        }
        function anchored(list: NodeList<T>) {
            return list.filter(node => node.anchored);
        }
        function resolveAnchor(node: T, nodes: NodeList<T>, orientation: string) {
            if (!node.constraint[orientation]) {
                let parent: Null<T> = node;
                while (parent != null) {
                    const stringId = mapSibling(parent, (orientation === AXIS_ANDROID.HORIZONTAL ? 'leftRight' : 'topBottom'));
                    if (stringId) {
                        parent = nodes.locate('nodeId', stripId(stringId));
                        if (parent && parent.constraint[orientation]) {
                            return true;
                        }
                    }
                    else {
                        parent = null;
                    }
                }
                return false;
            }
            return true;
        }
        function deleteConstraints(node: T, stringId = '', parent = false) {
            for (const attr in mapLayout) {
                const value = node.app(mapLayout[attr]);
                if ((value !== 'parent' || parent) && (stringId === '' || value === stringId)) {
                    node.delete('app', mapLayout[attr]);
                }
            }
            node.constraint.horizontal = (mapParent(node, 'left') || mapParent(node, 'right'));
            node.constraint.vertical = (mapParent(node, 'top') || mapParent(node, 'bottom'));
        }
        function adjustBaseline(nodes: T[]) {
            if (nodes.length > 1) {
                const baseline = NodeList.textBaseline(nodes);
                if (baseline.length > 0) {
                    const unaligned: T[] = [];
                    for (const node of nodes) {
                        if (!baseline.includes(node)) {
                            if (node.baseline && (node.nodeType <= NODE_STANDARD.IMAGE || (node.linearHorizontal && node.renderChildren.some(item => item.nodeType <= NODE_STANDARD.IMAGE)))) {
                                const alignWith = baseline[0];
                                if (alignWith.alignOrigin) {
                                    node.android(mapLayout['baseline'], alignWith.stringId);
                                }
                                else {
                                    if (alignWith.position === 'relative' && node.bounds.height < alignWith.bounds.height && node.lineHeight === 0) {
                                        node.android(mapLayout[(convertInt(alignWith.top) > 0 ? 'top' : 'bottom')], alignWith.stringId);
                                    }
                                }
                            }
                            else {
                                unaligned.push(node);
                            }
                        }
                    }
                    if (unaligned.length > 0) {
                        const realign = unaligned.filter(node => node.toInt('verticalAlign') !== 0).sort((a, b) => (a.toInt('verticalAlign') >= b.toInt('verticalAlign') ? -1 : 1));
                        if (realign.length > 0 && realign[0].textElement) {
                            const verticalAlign = Math.abs(realign[0].toInt('verticalAlign'));
                            for (const item of baseline) {
                                const marginTop = realign[0].bounds.height - (item.bounds.height + verticalAlign);
                                item.modifyBox(BOX_STANDARD.MARGIN_TOP, marginTop, true);
                            }
                            for (let i = 0; i < realign.length; i++) {
                                const item = realign[i];
                                if (i > 0) {
                                    item.css('verticalAlign', (item.toInt('verticalAlign') + verticalAlign).toString());
                                }
                                else {
                                    item.css('verticalAlign', 'baseline');
                                }
                            }
                        }
                    }
                }
            }
        }
        for (const node of this.cache.visible) {
            constraint = node.is(NODE_STANDARD.CONSTRAINT);
            relative = node.is(NODE_STANDARD.RELATIVE);
            const flex = node.flex;
            if (constraint || relative || flex.enabled) {
                const nodes = new NodeList<T>(node.renderChildren.filter(item => item.auto) as T[], node);
                if (relative) {
                    mapLayout = MAP_LAYOUT.relative;
                    const rows: T[][] = [];
                    const baseline: T[] = [];
                    const textIndent = node.toInt('textIndent');
                    const floatAligned = nodes.list.some((item => item.floating));
                    let multiLine = nodes.list.some((item, index) => (index > 0 && node.linear.top >= nodes.get(index - 1).linear.bottom) || item.multiLine);
                    let boxWidth = node.box.width;
                    if (node.renderParent.overflowX) {
                        boxWidth = node.renderParent.toInt('width', 0, { map: 'initial' }) || node.viewWidth || boxWidth;
                        multiLine = true;
                    }
                    else if (node.renderParent.hasBit('alignmentType', NODE_ALIGNMENT.FLOAT)) {
                        const minLeft: number = Math.min.apply(null, nodes.list.map(item => item.linear.left));
                        const maxRight: number = Math.max.apply(null, nodes.list.map(item => item.linear.right));
                        boxWidth = maxRight - minLeft;
                    }
                    let rowWidth = 0;
                    let rowPaddingLeft = 0;
                    let rowPreviousLeft: Null<T> = null;
                    let rowPreviousBottom: Null<T> = null;
                    if (textIndent < 0 && Math.abs(textIndent) <= node.paddingLeft) {
                        rowPaddingLeft = Math.abs(textIndent);
                        node.modifyBox(BOX_STANDARD.PADDING_LEFT, node.paddingLeft + textIndent);
                        node.modifyBox(BOX_STANDARD.PADDING_LEFT, null);
                    }
                    for (let i = 0; i < nodes.length; i++) {
                        const current = nodes.get(i);
                        let dimension = current.bounds;
                        if (i === 0) {
                            current.android(relativeParent['left'], 'true');
                            rowWidth += dimension.width;
                            if (!node.inline && textIndent > 0) {
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, textIndent);
                            }
                            if (SETTINGS.ellipsisOnTextOverflow && rowPaddingLeft > 0) {
                                current.android('singleLine', 'true');
                            }
                            if (!current.siblingflow || (current.floating && current.position === 'relative') || (current.multiLine && textIndent < 0)) {
                                rowPreviousLeft = current;
                            }
                            rows[rows.length] = [current];
                        }
                        else {
                            const previous = nodes.get(i - 1);
                            const previousViewGroup = (previous instanceof ViewGroup || previous.is(NODE_STANDARD.LINEAR));
                            const viewGroup = (current instanceof ViewGroup || current.is(NODE_STANDARD.LINEAR));
                            const items = rows[rows.length - 1];
                            if (current.hasElement && current.multiLine) {
                                dimension = getRangeClientRect(current.element)[0];
                            }
                            const siblings = getElementsBetweenSiblings(previous.baseElement, current.baseElement, false, true);
                            let connected = false;
                            if (i === 1 && previous.textElement && current.textElement) {
                                connected = (siblings.length === 0 && !/\s+$/.test(previous.textContent) && !/^\s+/.test(current.textContent));
                            }
                            if (viewGroup ||
                                (!multiLine && (current.linear.top >= previous.linear.bottom || withinFraction(current.linear.left, node.box.left))) ||
                                (siblings.length > 0 && siblings.some(element => isLineBreak(element))) ||
                                (!connected && (
                                    (multiLine && (!previous.floating || items.length > 1) && (rowWidth + dimension.width) > boxWidth) ||
                                    (current.multiLine && hasLineBreak(current.element))
                               )))
                            {
                                rowPreviousBottom = items.filter(item => !item.floating)[0] || items[0];
                                for (let j = 0; j < items.length; j++) {
                                    if (items[j] !== rowPreviousBottom && ((items[j].floating && rowPreviousBottom.floating) || !items[j].floating) && items[j].linear.bottom > rowPreviousBottom.linear.bottom) {
                                        rowPreviousBottom = items[j];
                                    }
                                }
                                if (viewGroup || (previousViewGroup && i === nodes.length - 1)) {
                                    current.constraint.marginVertical = rowPreviousBottom.stringId;
                                }
                                current.anchor(mapLayout['topBottom'], rowPreviousBottom.stringId);
                                if (rowPreviousLeft && current.linear.top < rowPreviousLeft.bounds.bottom && !withinRange(current.bounds.top, rowPreviousLeft.bounds.top, 1) && !withinRange(current.bounds.bottom, rowPreviousLeft.bounds.bottom, 1)) {
                                    current.anchor(mapLayout['leftRight'], rowPreviousLeft.stringId);
                                }
                                else {
                                    current.anchor(relativeParent['left'], 'true');
                                    rowPreviousLeft = null;
                                }
                                rowWidth = dimension.width;
                                if (SETTINGS.ellipsisOnTextOverflow &&
                                    previous != null &&
                                    (rows[rows.length - 1].length > 2 || previous.linearHorizontal) &&
                                    i < nodes.length - 1)
                                {
                                    let lastChild = previous;
                                    if (previous.linearHorizontal) {
                                        lastChild = previous.children[previous.children.length - 1] as T;
                                    }
                                    if (lastChild.multiLine) {
                                        lastChild.android('singleLine', 'true');
                                    }
                                }
                                if (rowPaddingLeft > 0) {
                                    current.modifyBox(BOX_STANDARD.PADDING_LEFT, rowPaddingLeft);
                                }
                                if (!floatAligned) {
                                    adjustBaseline(baseline);
                                    baseline.length = 0;
                                }
                                rows.push([current]);
                            }
                            else {
                                if (i === 1 && rowPaddingLeft > 0 && !previous.plainText) {
                                    current.anchor(relativeParent['left'], 'true');
                                    current.modifyBox(BOX_STANDARD.PADDING_LEFT, rowPaddingLeft);
                                }
                                else {
                                    current.anchor(mapLayout['leftRight'], previous.stringId);
                                }
                                if (rowPreviousBottom != null) {
                                    current.anchor(mapLayout['topBottom'], rowPreviousBottom.stringId);
                                }
                                rowWidth += dimension.width;
                                items.push(current);
                            }
                        }
                        if (!floatAligned) {
                            baseline.push(current);
                        }
                    }
                    if (!floatAligned) {
                        adjustBaseline(baseline);
                    }
                    if (SETTINGS.ellipsisOnTextOverflow && (node.hasBit('alignmentType', NODE_ALIGNMENT.HORIZONTAL) || rows.length === 1)) {
                        for (let i = 1; i < nodes.length; i++) {
                            const item = nodes.get(i);
                            if (!item.multiLine && !item.floating && (!item.alignParent('left') || rows.length === 1)) {
                                item.android('singleLine', 'true');
                            }
                        }
                    }
                }
                else {
                    mapLayout = MAP_LAYOUT.constraint;
                    if (node.hasBit('alignmentType', NODE_ALIGNMENT.HORIZONTAL)) {
                        const optimal =  NodeList.textBaseline(nodes.list, false, true)[0];
                        const baseline = nodes.list.filter(item => item.textElement && item.baseline);
                        const image = nodes.list.filter(item => item.imageElement && item.baseline);
                        if (image.length > 0) {
                            baseline.forEach(item => item.app(mapLayout['baseline'], image[0].stringId));
                        }
                        for (let i = 0; i < nodes.length; i++) {
                            const current = nodes.get(i);
                            let alignWith = optimal;
                            if (i === 0) {
                                current.app(mapLayout['left'], 'parent');
                            }
                            else {
                                const previous = nodes.get(i - 1);
                                current.app(mapLayout['leftRight'], previous.stringId);
                                current.constraint.marginHorizontal = previous.stringId;
                            }
                            if (image.length > 0 && baseline.includes(current)) {
                                continue;
                            }
                            const verticalAlign = current.css('verticalAlign');
                            if (alignWith == null || verticalAlign.startsWith('text') || optimal === current) {
                                baseline.some(item => {
                                    if (item !== current) {
                                        alignWith = item;
                                        return true;
                                    }
                                    return false;
                                });
                                if (alignWith == null) {
                                    nodes.list.slice().sort((a, b) => (a.nodeType <= b.nodeType ? -1 : 1)).some(item => {
                                        if (item !== current) {
                                            alignWith = item;
                                            return true;
                                        }
                                        return false;
                                    });
                                }
                            }
                            switch (verticalAlign) {
                                case 'text-top':
                                    if (alignWith != null) {
                                        current.app(mapLayout['top'], alignWith.stringId);
                                    }
                                    break;
                                case 'top':
                                    current.app(mapLayout['top'], 'parent');
                                    break;
                                case 'middle':
                                    this.setAlignParent(current, AXIS_ANDROID.VERTICAL);
                                    break;
                                case 'baseline':
                                    if (alignWith != null) {
                                        current.app(mapLayout['baseline'], alignWith.stringId);
                                    }
                                    break;
                                case 'text-bottom':
                                    if (alignWith != null) {
                                        current.app(mapLayout['bottom'], alignWith.stringId);
                                    }
                                    break;
                                case 'bottom':
                                    current.app(mapLayout['bottom'], 'parent');
                                    break;
                            }
                        }
                    }
                    else {
                        const [absolute, pageflow] = nodes.partition(item => !item.pageflow || (item.position === 'relative' && item.alignNegative));
                        const columnCount = node.toInt('columnCount');
                        const inlineWrap = node.hasBit('alignmentType', NODE_ALIGNMENT.INLINE_WRAP);
                        if (inlineWrap) {
                            node.android('layout_width', 'match_parent');
                        }
                        else {
                            if (pageflow.length > 0 && (columnCount <= 1 || flex.enabled)) {
                                for (const current of pageflow) {
                                    const parent = current.documentParent;
                                    if (current.centerMarginHorizontal) {
                                        this.setAlignParent(current, AXIS_ANDROID.HORIZONTAL);
                                    }
                                    else {
                                        if (current.linear.left <= parent.box.left || withinFraction(current.linear.left, parent.box.left)) {
                                            current.anchor(mapLayout['left'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                        }
                                        if (current.linear.right >= parent.box.right || withinFraction(current.linear.right, parent.box.right)) {
                                            current.anchor(mapLayout['right'], 'parent', (parent.viewWidth > 0 || current.float === 'right' || current.autoLeftMargin ? AXIS_ANDROID.HORIZONTAL : ''));
                                        }
                                    }
                                    if (current.linear.top <= parent.box.top || withinFraction(current.linear.top, parent.box.top)) {
                                        current.anchor(mapLayout['top'], 'parent', AXIS_ANDROID.VERTICAL);
                                    }
                                    else if (current.linear.bottom >= parent.box.bottom || withinFraction(current.linear.bottom, parent.box.bottom)) {
                                        current.anchor(mapLayout['bottom'], 'parent', (parent.viewHeight > 0 ? AXIS_ANDROID.VERTICAL : ''));
                                    }
                                    for (const adjacent of pageflow) {
                                        if (current !== adjacent) {
                                            const stringId = adjacent.stringId;
                                            const horizontal = (resolveAnchor(adjacent, nodes, AXIS_ANDROID.HORIZONTAL) ? AXIS_ANDROID.HORIZONTAL : '');
                                            const vertical = (resolveAnchor(adjacent, nodes, AXIS_ANDROID.VERTICAL) ? AXIS_ANDROID.VERTICAL : '');
                                            const intersectY = current.intersectY(adjacent.linear);
                                            const alignOrigin = (current.alignOrigin && adjacent.alignOrigin);
                                            if (current.viewWidth === 0 && current.linear.left === adjacent.linear.left && current.linear.right === adjacent.linear.right) {
                                                if (!mapParent(current, 'right')) {
                                                    current.anchor(mapLayout['left'], stringId);
                                                }
                                                if (!mapParent(current, 'left')) {
                                                    current.anchor(mapLayout['right'], stringId);
                                                }
                                            }
                                            if (!current.centerMarginHorizontal) {
                                                if ((!current.constraint.horizontal && alignOrigin && withinRange(current.linear.left, adjacent.linear.right, SETTINGS.constraintWhitespaceHorizontalOffset)) || withinFraction(current.linear.left, adjacent.linear.right)) {
                                                    if (current.float !== 'right' || current.float === adjacent.float) {
                                                        current.anchor(mapLayout['leftRight'], stringId, horizontal, current.withinX(adjacent.linear));
                                                    }
                                                }
                                                if ((!current.constraint.horizontal && alignOrigin && withinRange(current.linear.right, adjacent.linear.left, SETTINGS.constraintWhitespaceHorizontalOffset)) || withinFraction(current.linear.right, adjacent.linear.left)) {
                                                    current.anchor(mapLayout['rightLeft'], stringId, horizontal, current.withinX(adjacent.linear));
                                                }
                                            }
                                            const topParent = mapParent(current, 'top');
                                            const bottomParent = mapParent(current, 'bottom');
                                            const blockElement = (!flex.enabled && !current.inlineElement);
                                            if ((alignOrigin && withinRange(current.linear.top, adjacent.linear.bottom, SETTINGS.constraintWhitespaceVerticalOffset)) || withinFraction(current.linear.top, adjacent.linear.bottom)) {
                                                if (intersectY || !bottomParent || blockElement) {
                                                    current.anchor(mapLayout['topBottom'], stringId, vertical, intersectY);
                                                }
                                            }
                                            if ((alignOrigin && withinRange(current.linear.bottom, adjacent.linear.top, SETTINGS.constraintWhitespaceVerticalOffset)) || withinFraction(current.linear.bottom, adjacent.linear.top)) {
                                                if (intersectY || !topParent || blockElement) {
                                                    current.anchor(mapLayout['bottomTop'], stringId, vertical, intersectY);
                                                }
                                            }
                                            if (!topParent && !bottomParent) {
                                                if (current.linear.top === adjacent.linear.top) {
                                                    current.anchor(mapLayout['top'], stringId, vertical);
                                                }
                                                if (current.linear.bottom === adjacent.linear.bottom) {
                                                    current.anchor(mapLayout['bottom'], stringId, vertical);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            if (absolute.length > 0) {
                                node.extendBounds();
                                for (const current of absolute) {
                                    if (current.top != null && current.toInt('top') === 0) {
                                        current.anchor(mapLayout['top'], 'parent', AXIS_ANDROID.VERTICAL);
                                    }
                                    if (current.right != null && current.toInt('right') >= 0) {
                                        current.anchor(mapLayout['right'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                        if (current.centerMarginHorizontal && current.toInt('left') > 0) {
                                            current.anchor(mapLayout['left'], 'parent');
                                            current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.toInt('left'));
                                        }
                                    }
                                    if (current.bottom != null && current.toInt('bottom') >= 0) {
                                        current.anchor(mapLayout['bottom'], 'parent', AXIS_ANDROID.VERTICAL);
                                    }
                                    if (current.left != null && current.toInt('left') === 0) {
                                        current.anchor(mapLayout['left'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                        if (current.centerMarginHorizontal && current.toInt('right') > 0) {
                                            current.anchor(mapLayout['right'], 'parent');
                                            current.modifyBox(BOX_STANDARD.MARGIN_RIGHT, current.toInt('right'));
                                        }
                                    }
                                    if (current.left === 0 && current.right === 0 && !current.floating && !current.has('width', CSS_STANDARD.PERCENT)) {
                                        current.android('layout_width', 'match_parent');
                                    }
                                    if (current.top === 0 && current.bottom === 0) {
                                        current.android('layout_height', 'match_parent');
                                    }
                                }
                            }
                            for (const current of nodes) {
                                if (current.pageflow) {
                                    const leftRight = mapSibling(current, 'leftRight');
                                    if (leftRight) {
                                        if (!current.constraint.horizontal) {
                                            current.constraint.horizontal = flex.enabled || resolveAnchor(current, nodes, AXIS_ANDROID.HORIZONTAL);
                                        }
                                        current.constraint.marginHorizontal = leftRight;
                                    }
                                    const topBottom = mapSibling(current, 'topBottom');
                                    if (topBottom) {
                                        if (!current.constraint.vertical) {
                                            current.constraint.vertical = flex.enabled || resolveAnchor(current, nodes, AXIS_ANDROID.VERTICAL);
                                        }
                                        current.constraint.marginVertical = topBottom;
                                        mapDelete(current, 'top');
                                    }
                                    if (mapParent(current, 'left') && mapParent(current, 'right')) {
                                        if (current.autoMargin) {
                                            if (current.autoLeftMargin) {
                                                mapDelete(current, 'left');
                                            }
                                            if (current.autoRightMargin) {
                                                mapDelete(current, 'right');
                                            }
                                            if (current.centerMarginHorizontal) {
                                                if (node.viewWidth > 0 && !current.has('width', CSS_STANDARD.PERCENT)) {
                                                    current.android('layout_width', 'match_parent');
                                                }
                                                else if (current.inlineElement && current.viewWidth === 0) {
                                                    current.android('layout_width', 'wrap_content');
                                                }
                                            }
                                        }
                                        else if (current.floating) {
                                            mapDelete(current, (current.float === 'right' ? 'left' : 'right'));
                                        }
                                        else if (current.inlineElement) {
                                            if (current.nodeType <= NODE_STANDARD.IMAGE) {
                                                switch (current.css('textAlign')) {
                                                    case 'center':
                                                        break;
                                                    case 'right':
                                                    case 'end' :
                                                        mapDelete(current, 'left');
                                                        break;
                                                    default:
                                                        mapDelete(current, 'right');
                                                        break;
                                                }
                                            }
                                            else {
                                                mapDelete(current, 'right');
                                            }
                                        }
                                        else {
                                            mapDelete(current, 'right');
                                            current.android('layout_width', 'match_parent');
                                        }
                                    }
                                    if (mapSibling(current, 'bottomTop')) {
                                        mapDelete(current, 'bottom');
                                    }
                                }
                                if (!flex.enabled && columnCount <= 1 && ((current.viewWidth > 0 && current.alignOrigin) || current.plainText)) {
                                    const textAlign = current.cssParent('textAlign', true);
                                    if (textAlign === 'right') {
                                        current.anchor(mapLayout['right'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                        current.constraint.horizontal = true;
                                    }
                                    else if (textAlign === 'center') {
                                        current.constraint.horizontal = false;
                                        this.setAlignParent(current, AXIS_ANDROID.HORIZONTAL);
                                    }
                                }
                            }
                            for (let i = 0; i < pageflow.length; i++) {
                                const current = pageflow.get(i);
                                if (!current.anchored) {
                                    const result = search(current.get('app'), '*constraint*');
                                    for (const [key, value] of result) {
                                        if (value !== 'parent' && anchored(pageflow).locate('stringId', value)) {
                                            if (indexOf(key, parseRTL('Left'), parseRTL('Right')) !== -1) {
                                                current.constraint.horizontal = true;
                                            }
                                            if (indexOf(key, 'Top', 'Bottom', 'Baseline', 'above', 'below') !== -1) {
                                                current.constraint.vertical = true;
                                            }
                                        }
                                    }
                                    if (current.anchored) {
                                        i = -1;
                                    }
                                }
                            }
                        }
                        if (flex.enabled || columnCount > 1 || (!SETTINGS.constraintChainDisabled && pageflow.length > 1)) {
                            const flexbox: any[] = [];
                            if (flex.enabled) {
                                if (flex.wrap === 'nowrap') {
                                    const horizontalChain = pageflow.clone();
                                    const verticalChain = pageflow.clone();
                                    switch (flex.direction) {
                                        case 'row-reverse':
                                            horizontalChain.list.reverse();
                                        case 'row':
                                            verticalChain.clear();
                                            break;
                                        case 'column-reverse':
                                            verticalChain.list.reverse();
                                        case 'column':
                                            horizontalChain.clear();
                                            break;
                                    }
                                    flexbox.push({ constraint: { horizontalChain, verticalChain } });
                                }
                                else {
                                    const sorted = pageflow.clone();
                                    switch (flex.direction) {
                                        case 'row-reverse':
                                        case 'column-reverse':
                                            sorted.list.reverse();
                                            break;
                                    }
                                    const map: ObjectIndex<T[]> = {};
                                    const levels: number[] = [];
                                    for (const item of sorted) {
                                        const y = item.linear.top;
                                        if (map[y] == null) {
                                            map[y] = [];
                                            levels.push(y);
                                        }
                                        map[y].push(item);
                                    }
                                    function reverseMap() {
                                        for (const y in map) {
                                            map[y].reverse();
                                        }
                                    }
                                    switch (flex.wrap) {
                                        case 'wrap':
                                            if (flex.direction === 'column-reverse') {
                                                reverseMap();
                                            }
                                            break;
                                        case 'wrap-reverse':
                                            if (flex.direction.indexOf('row') !== -1) {
                                                levels.reverse();
                                            }
                                            else if (flex.direction === 'column') {
                                                reverseMap();
                                            }
                                            break;
                                    }
                                    for (const n of levels) {
                                        flexbox.push({ constraint: { horizontalChain: new NodeList<T>(map[n]) } });
                                    }
                                }
                            }
                            else if (columnCount > 1) {
                                const columns: T[][] = [];
                                const perRowCount = Math.ceil(pageflow.length / Math.min(columnCount, pageflow.length));
                                for (let i = 0, j = 0; i < pageflow.length; i++) {
                                    const item = pageflow.list[i];
                                    if ((i % perRowCount) === 0) {
                                        if (i > 0) {
                                            j++;
                                        }
                                        if (columns[j] == null) {
                                            columns[j] = [];
                                        }
                                    }
                                    columns[j].push(item);
                                }
                                const row: T[] = [];
                                const marginLeft = convertInt(convertPX(node.css('columnGap'), node.css('fontSize'))) || 16;
                                const marginTotal: number = columns.map(list => Math.max.apply(null, list.map(item => item.marginLeft + item.marginRight)) || 0).reduce((a: number, b: number) => a + b, 0);
                                const marginPercent = ((marginTotal + (marginLeft * (columnCount - 1))) / node.box.width) / columnCount;
                                for (let i = 0; i < columns.length; i++) {
                                    const column = columns[i];
                                    const first = column[0];
                                    if (i > 0) {
                                        first.android(`layout_${parseRTL('marginLeft')}`, formatPX(first.marginLeft + marginLeft));
                                    }
                                    row.push(first);
                                    column.forEach(item => {
                                        if (item.viewWidth === 0) {
                                            item.android('layout_width', '0px');
                                            item.app('layout_constraintWidth_percent', ((1 / columnCount) - marginPercent).toFixed(2));
                                        }
                                    });
                                    flexbox.push({ constraint: { verticalChain: new NodeList<T>(column) } });
                                }
                                flexbox.push({ constraint: { horizontalChain: new NodeList<T>(row) } });
                            }
                            else {
                                const horizontal = pageflow.list.filter(current => !current.constraint.horizontal);
                                const vertical = pageflow.list.filter(current => !current.constraint.vertical);
                                pageflow.list.some((current: T) => {
                                    const horizontalChain: T[] = [];
                                    const verticalChain: T[] = [];
                                    if (horizontal.length > 0) {
                                        horizontalChain.push(...this.partitionChain(current, pageflow, AXIS_ANDROID.HORIZONTAL, !inlineWrap));
                                        current.constraint.horizontalChain = new NodeList<T>(sortAsc(horizontalChain, 'linear.left'));
                                    }
                                    if (vertical.length > 0 && !inlineWrap) {
                                        verticalChain.push(...this.partitionChain(current, pageflow, AXIS_ANDROID.VERTICAL, true));
                                        current.constraint.verticalChain = new NodeList<T>(sortAsc(verticalChain, 'linear.top'));
                                    }
                                    return (horizontalChain.length === pageflow.length || verticalChain.length === pageflow.length);
                                });
                            }
                            MAP_CHAIN.direction.forEach((value, index) => {
                                const connected = (flexbox.length > 0 ? flexbox
                                                                      : pageflow.list.slice().sort((a, b) => (a.constraint[value] != null ? a.constraint[value].length : 0) >= (b.constraint[value] != null ? b.constraint[value].length : 0) ? -1 : 1));
                                if (connected.length > 0) {
                                    const connectedRows: NodeList<T>[]  = [];
                                    const mapId = new Set<string>();
                                    connected.filter((current: T) => {
                                        if (current.constraint[value] instanceof NodeList) {
                                            const id = (<NodeList<T>> current.constraint[value]).list.map(item => item.id).join('-');
                                            if (!mapId.has(id)) {
                                                mapId.add(id);
                                                return true;
                                            }
                                        }
                                        return false;
                                    })
                                    .forEach((current, level) => {
                                        const chainable: NodeList<T> = current.constraint[value];
                                        if (chainable.length > (flex.enabled ? 0 : 1)) {
                                            const inverse = (index === 0 ? 1 : 0);
                                            const [HV, VH] = [MAP_CHAIN['horizontalVertical'][index], MAP_CHAIN['horizontalVertical'][inverse]];
                                            const [LT, TL] = [MAP_CHAIN['leftTop'][index], MAP_CHAIN['leftTop'][inverse]];
                                            const [RB, BR] = [MAP_CHAIN['rightBottom'][index], MAP_CHAIN['rightBottom'][inverse]];
                                            const [WH, HW] = [MAP_CHAIN['widthHeight'][index], MAP_CHAIN['widthHeight'][inverse]];
                                            const orientation = HV.toLowerCase();
                                            const orientationInverse = VH.toLowerCase();
                                            const dimension = WH.toLowerCase();
                                            if (flex.enabled) {
                                                if (chainable.list.some(item => item.flex.order > 0)) {
                                                    chainable[(flex.direction.indexOf('reverse') !== -1 ? 'sortDesc' : 'sortAsc')]('flex.order');
                                                }
                                            }
                                            else if (!(inlineWrap || columnCount > 1)) {
                                                if (chainable.list.every(item => resolveAnchor(item, nodes, orientation))) {
                                                    return;
                                                }
                                            }
                                            chainable.parent = node;
                                            const first = chainable.get(0);
                                            const last = chainable.get();
                                            let maxOffset = -1;
                                            let disconnected = false;
                                            let marginDelete = false;
                                            const attrs = (index === 0 ? [AXIS_ANDROID.HORIZONTAL, 'left', 'leftRight', 'top', AXIS_ANDROID.VERTICAL, 'viewWidth', 'right', 'marginHorizontal']
                                                                       : [AXIS_ANDROID.VERTICAL, 'top', 'topBottom', 'left', AXIS_ANDROID.HORIZONTAL, 'viewHeight', 'bottom', 'marginVertical']);
                                            for (let i = 0; i < chainable.length; i++) {
                                                const item = chainable.get(i);
                                                if (i === 0) {
                                                    if (!mapParent(item, attrs[1])) {
                                                        disconnected = true;
                                                        break;
                                                    }
                                                }
                                                else {
                                                    if (mapSibling(item, attrs[2]) == null) {
                                                        disconnected = true;
                                                        break;
                                                    }
                                                }
                                            }
                                            if (!disconnected) {
                                                if (chainable.list.every(item => sameValue(first, item, `linear.${attrs[3]}`))) {
                                                    for (let j = 1; j < chainable.length; j++) {
                                                        const item = chainable.get(j);
                                                        if (!item.constraint[attrs[4]]) {
                                                            item.anchor(mapLayout[attrs[3]], first.stringId, attrs[4]);
                                                        }
                                                    }
                                                }
                                                if (!flex.enabled && node[attrs[5]] === 0) {
                                                    mapDelete(last, attrs[6]);
                                                    last.constraint[attrs[7]] = mapSibling(last, attrs[2]);
                                                }
                                            }
                                            if (inlineWrap) {
                                                first.anchor(mapLayout[LT], 'parent', orientation);
                                                last.anchor(mapLayout[RB], 'parent', orientation);
                                                if (!node.renderParent.centerMarginHorizontal) {
                                                    if (first.float === 'right' && last.float === 'right') {
                                                        first.app(`layout_constraint${HV}_bias`, '1');
                                                    }
                                                    else {
                                                        first.app(`layout_constraint${HV}_bias`, '0');
                                                    }
                                                }
                                            }
                                            else {
                                                first.anchor(mapLayout[LT], 'parent', orientation);
                                                last.anchor(mapLayout[RB], 'parent', orientation);
                                            }
                                            for (let i = 0; i < chainable.length; i++) {
                                                const chain = chainable.get(i);
                                                const next = chainable.get(i + 1);
                                                const previous = chainable.get(i - 1);
                                                if (flex.enabled) {
                                                    if (chain.linear[TL] === node.box[TL] && chain.linear[BR] === node.box[BR]) {
                                                        this.setAlignParent(chain, orientationInverse);
                                                    }
                                                    const rowNext = connected[level + 1];
                                                    if (rowNext && rowNext.constraint[value] != null) {
                                                        const chainNext = (<NodeList<T>> rowNext.constraint[value]).get(i);
                                                        if (chainNext && chain.withinY(chainNext.linear)) {
                                                            chain.anchor(mapLayout['bottomTop'], chainNext.stringId);
                                                            if (!mapParent(chain, 'bottom')) {
                                                                mapDelete(chain, 'bottom');
                                                            }
                                                        }
                                                    }
                                                }
                                                else if (inlineWrap) {
                                                    if (connectedRows.length === 0) {
                                                        chain.anchor(mapLayout['top'], 'parent');
                                                    }
                                                    else {
                                                        const previousRow = connectedRows[connectedRows.length - 1];
                                                        const bottom = Math.max.apply(null, previousRow.list.map(item => item.linear.bottom));
                                                        let anchorAbove: Null<T>;
                                                        if (chainable.length === previousRow.length) {
                                                            anchorAbove = previousRow.get(i);
                                                        }
                                                        else {
                                                            anchorAbove = previousRow.list.find(item => item.linear.bottom === bottom);
                                                        }
                                                        if (anchorAbove != null) {
                                                            chain.anchor(mapLayout['topBottom'], anchorAbove.stringId);
                                                        }
                                                    }
                                                    const width = chain.css('width');
                                                    if (isPercent(width)) {
                                                        chain.android('layout_width', '0px');
                                                        chain.app(`layout_constraint${WH}_percent`, (parseInt(width) / 100).toFixed(2));
                                                    }
                                                    chain.constraint.horizontal = true;
                                                    chain.constraint.vertical = true;
                                                }
                                                else if (columnCount > 1) {
                                                    if (index === 0) {
                                                        chain.app(`layout_constraint${VH}_bias`, '0');
                                                    }
                                                    if (index === 1 && i > 0) {
                                                        chain.anchor(mapLayout['left'], first.stringId);
                                                    }
                                                    chain.constraint.horizontal = true;
                                                    chain.constraint.vertical = true;
                                                }
                                                if (next) {
                                                    chain.anchor(mapLayout[MAP_CHAIN['rightLeftBottomTop'][index]], next.stringId);
                                                    maxOffset = Math.max(next.linear[LT] - chain.linear[RB], maxOffset);
                                                }
                                                if (previous) {
                                                    chain.anchor(mapLayout[MAP_CHAIN['leftRightTopBottom'][index]], previous.stringId);
                                                    chain.constraint[`margin${HV}`] = previous.stringId;
                                                }
                                                chain.constraint[`chain${HV}`] = true;
                                                if (!chain.has(dimension) || chain.has(dimension, CSS_STANDARD.PERCENT)) {
                                                    const minWH = chain.styleMap[`min${WH}`];
                                                    const maxWH = chain.styleMap[`max${WH}`];
                                                    if (isUnit(minWH)) {
                                                        chain.app(`layout_constraint${WH}_min`, minWH);
                                                        chain.android(`layout_${dimension}`, '0px');
                                                    }
                                                    if (isUnit(maxWH)) {
                                                        chain.app(`layout_constraint${WH}_max`, maxWH);
                                                        chain.android(`layout_${dimension}`, '0px');
                                                    }
                                                }
                                                if (flex.enabled) {
                                                    chain.app(`layout_constraint${HV}_weight`, chain.flex.grow.toString());
                                                    if (chain[`view${WH}`] == null && chain.flex.grow === 0 && chain.flex.shrink <= 1) {
                                                        chain.android(`layout_${dimension}`, 'wrap_content');
                                                    }
                                                    else if (chain.flex.grow > 0) {
                                                        chain.android(`layout_${dimension}`, '0px');
                                                    }
                                                    if (chain.flex.shrink === 0) {
                                                        chain.app(`layout_constrained${WH}`, 'true');
                                                    }
                                                    switch (chain.flex.alignSelf) {
                                                        case 'flex-start':
                                                            chain.anchor(mapLayout[TL], 'parent', orientationInverse);
                                                            break;
                                                        case 'flex-end':
                                                            chain.anchor(mapLayout[BR], 'parent', orientationInverse);
                                                            break;
                                                        case 'baseline':
                                                            const valid =
                                                                chainable.list.some(adjacent => {
                                                                    if (adjacent !== chain && adjacent.nodeType <= NODE_STANDARD.TEXT) {
                                                                        chain.anchor(mapLayout['baseline'], adjacent.stringId);
                                                                        return true;
                                                                    }
                                                                    return false;
                                                                });
                                                            if (valid) {
                                                                mapDelete(chain, 'top', 'bottom');
                                                                for (const item of chainable) {
                                                                    if (mapSibling(item, 'top') === chain.stringId) {
                                                                        mapDelete(item, 'top');
                                                                    }
                                                                    if (mapSibling(item, 'bottom') === chain.stringId) {
                                                                        mapDelete(item, 'bottom');
                                                                    }
                                                                }
                                                                chain.constraint.vertical = true;
                                                            }
                                                            break;
                                                        case 'center':
                                                        case 'stretch':
                                                            if (chain.flex.alignSelf !== 'center') {
                                                                chain.android(`layout_${HW.toLowerCase()}`, '0px');
                                                            }
                                                            chain.constraint[orientationInverse] = false;
                                                            this.setAlignParent(chain, orientationInverse);
                                                            break;
                                                    }
                                                    if (chain.flex.basis !== 'auto') {
                                                        const basis = convertInt(chain.flex.basis);
                                                        if (basis > 0) {
                                                            if (isPercent(chain.flex.basis)) {
                                                                chain.app(`layout_constraint${WH}_percent`, (basis / 100).toFixed(2));
                                                            }
                                                            else {
                                                                chain.app(`layout_constraint${WH}_min`, formatPX(basis));
                                                                chain.constraint[`min${WH}`] = true;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            const chainStyle = `layout_constraint${HV}_chainStyle`;
                                            if (flex.enabled && flex.justifyContent !== 'normal' && (Math.max.apply(null, chainable.list.map(item => item.flex.grow)) as number) === 0) {
                                                switch (flex.justifyContent) {
                                                    case 'space-between':
                                                        first.app(chainStyle, 'spread_inside');
                                                        break;
                                                    case 'space-evenly':
                                                        first.app(chainStyle, 'spread');
                                                        for (const item of chainable) {
                                                            item.app(`layout_constraint${HV}_weight`, (item.flex.grow || 1).toString());
                                                        }
                                                        break;
                                                    case 'space-around':
                                                        first.app(`layout_constraint${HV}_chainStyle`, 'spread_inside');
                                                        first.constraint[orientation] = false;
                                                        last.constraint[orientation] = false;
                                                        this.addGuideline(first, orientation, true, false);
                                                        this.addGuideline(last, orientation, true, true);
                                                        break;
                                                    default:
                                                        let justifyContent = flex.justifyContent;
                                                        if (flex.direction.indexOf('reverse') !== -1) {
                                                            switch (flex.justifyContent) {
                                                                case 'flex-start':
                                                                    justifyContent = 'flex-end';
                                                                    break;
                                                                case 'flex-end':
                                                                    justifyContent = 'flex-start';
                                                                    break;
                                                            }
                                                        }
                                                        let bias = '0.5';
                                                        switch (justifyContent) {
                                                            case 'flex-start':
                                                                bias = '0';
                                                                break;
                                                            case 'flex-end':
                                                                bias = '1';
                                                                break;
                                                        }
                                                        first.app(chainStyle, 'packed');
                                                        first.app(`layout_constraint${HV}_bias`, bias);
                                                        break;
                                                }
                                                marginDelete = true;
                                            }
                                            else if (inlineWrap) {
                                                first.app(chainStyle, 'packed');
                                            }
                                            else if (!flex.enabled && columnCount > 1) {
                                                first.app(chainStyle, (index === 0 ? 'spread_inside' : 'packed'));
                                            }
                                            else {
                                                const alignLeft = withinFraction(node.box.left, first.linear.left);
                                                const alignRight = withinFraction(last.linear.right, node.box.right);
                                                const alignTop = withinFraction(node.box.top, first.linear.top);
                                                const alignBottom = withinFraction(last.linear.bottom, node.box.bottom);
                                                if ((orientation === AXIS_ANDROID.HORIZONTAL && alignLeft && alignRight) || (orientation === AXIS_ANDROID.VERTICAL && alignTop && alignBottom)) {
                                                    if (chainable.length > 2 || flex.enabled) {
                                                        if (!flex.enabled && node.inlineElement) {
                                                            first.app(chainStyle, 'packed');
                                                            first.app(`layout_constraint${HV}_bias`, (index === 0 && node.float === 'right' ? '1' : '0'));
                                                        }
                                                        else {
                                                            first.app(chainStyle, 'spread_inside');
                                                            marginDelete = true;
                                                        }
                                                    }
                                                    else if (maxOffset > SETTINGS[`constraintChainPacked${HV}Offset`]) {
                                                        if (mapParent(first, LT)) {
                                                            mapDelete(first, MAP_CHAIN['rightLeftBottomTop'][index]);
                                                        }
                                                        if (mapParent(last, RB)) {
                                                            mapDelete(last, MAP_CHAIN['leftRightTopBottom'][index]);
                                                        }
                                                    }
                                                }
                                                else if ((maxOffset <= SETTINGS[`chainPacked${HV}Offset`] || node.flex.wrap !== 'nowrap') || (orientation === AXIS_ANDROID.HORIZONTAL && (alignLeft || alignRight))) {
                                                    first.app(chainStyle, 'packed');
                                                    let bias = '';
                                                    if (orientation === AXIS_ANDROID.HORIZONTAL) {
                                                        if (alignLeft) {
                                                            bias = '0';
                                                        }
                                                        else if (alignRight) {
                                                            bias = '1';
                                                        }
                                                    }
                                                    if (bias === '') {
                                                        bias = chainable[`${orientation}Bias`];
                                                    }
                                                    first.app(`layout_constraint${HV}_bias`, bias);
                                                }
                                                else {
                                                    first.app(chainStyle, 'spread');
                                                    marginDelete = true;
                                                }
                                                if (!flex.enabled) {
                                                    (index === 0 ? [[TL, BR], [BR, TL]] : [[LT, RB], [RB, LT]]).forEach(opposing => {
                                                        if (chainable.list.every(upper => sameValue(first, upper, `linear.${opposing[0]}`) && chainable.list.some(lower => !sameValue(first, lower, `linear.${opposing[1]}`)))) {
                                                            for (const chain of chainable) {
                                                                mapDelete(chain, opposing[1]);
                                                            }
                                                        }
                                                    });
                                                    for (const inner of chainable) {
                                                        for (const outer of pageflow) {
                                                            const horizontal: NodeList<T> = outer.constraint.horizontalChain;
                                                            const vertical: NodeList<T> = outer.constraint.verticalChain;
                                                            if (horizontal && horizontal.length > 0 && horizontal.locate('id', inner.id)) {
                                                                horizontal.clear();
                                                            }
                                                            if (vertical && vertical.length > 0 && vertical.locate('id', inner.id)) {
                                                                vertical.clear();
                                                            }
                                                        }
                                                    }
                                                }
                                                else {
                                                    marginDelete = true;
                                                }
                                            }
                                            if (marginDelete) {
                                                for (const item of chainable) {
                                                    delete item.constraint.marginHorizontal;
                                                    delete item.constraint.marginVertical;
                                                }
                                            }
                                            connectedRows.push(chainable);
                                        }
                                    });
                                }
                            });
                        }
                        for (const current of pageflow) {
                            current.constraint.horizontal = resolveAnchor(current, nodes, AXIS_ANDROID.HORIZONTAL);
                            current.constraint.vertical = resolveAnchor(current, nodes, AXIS_ANDROID.VERTICAL);
                        }
                        if (flex.enabled) {
                            if (flex.wrap !== 'nowrap') {
                                ['topBottom', 'bottomTop'].forEach((value, index) => {
                                    for (const current of pageflow) {
                                        if (mapParent(current, (index === 0 ? 'bottom' : 'top'))) {
                                            const chain: T[] = [current];
                                            let valid = false;
                                            let adjacent: Null<T> = current;
                                            while (adjacent != null) {
                                                const topBottom = mapSibling(adjacent, value);
                                                if (topBottom) {
                                                    adjacent = nodes.locate('nodeId', stripId(topBottom));
                                                    if (adjacent && current.withinY(adjacent.linear)) {
                                                        chain.push(adjacent);
                                                        valid = mapParent(adjacent, (index === 0 ? 'top' : 'bottom'));
                                                        if (valid) {
                                                            break;
                                                        }
                                                    }
                                                }
                                                else {
                                                    adjacent = null;
                                                }
                                            }
                                            if (!valid) {
                                                for (const item of chain) {
                                                    pageflow.list.some(next => {
                                                        if (item !== next && next.linear.top === item.linear.top && next.linear.bottom === item.linear.bottom) {
                                                            mapDelete(item, 'topBottom', 'bottomTop');
                                                            item.app(mapLayout['top'], next.stringId);
                                                            item.app(mapLayout['bottom'], next.stringId);
                                                            return true;
                                                        }
                                                        return false;
                                                    });
                                                }
                                            }
                                        }
                                    }
                                });
                            }
                        }
                        else if (columnCount <= 1) {
                            for (const current of pageflow) {
                                [['top', 'bottom', 'topBottom'], ['bottom', 'top', 'bottomTop']].forEach(direction => {
                                    if (mapParent(current, direction[1]) && mapSibling(current, direction[2]) == null) {
                                        ['leftRight', 'rightLeft'].forEach(value => {
                                            const stringId = mapSibling(current, value);
                                            if (stringId) {
                                                const aligned = pageflow.locate('stringId', stringId);
                                                if (aligned && mapSibling(aligned, direction[2])) {
                                                    if (withinFraction(current.linear[direction[0]], aligned.linear[direction[0]])) {
                                                        current.anchor(mapLayout[direction[0]], aligned.stringId);
                                                    }
                                                    if (withinFraction(current.linear[direction[1]], aligned.linear[direction[1]])) {
                                                        current.anchor(mapLayout[direction[1]], aligned.stringId);
                                                    }
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                            const unbound =
                                pageflow.filter(current =>
                                    !current.anchored && (
                                        mapParent(current, 'top') ||
                                        mapParent(current, 'right') ||
                                        mapParent(current, 'bottom') ||
                                        mapParent(current, 'left')
                                    )
                                );
                            if (anchored(nodes).length === 0 && unbound.length === 0) {
                                unbound.append(nodes.get(0));
                            }
                            for (const current of unbound) {
                                this.addGuideline(current, '', false, false);
                            }
                            const [adjacent, unanchored] = nodes.partition(item => item.anchored);
                            for (const current of unanchored) {
                                if (withinRange(current.horizontalBias, 0.5, 0.01) && withinRange(current.verticalBias, 0.5, 0.01)) {
                                    this.setAlignParent(current);
                                }
                                else if (SETTINGS.constraintCirclePositionAbsolute && adjacent.length > 0 && !current.constraint.horizontal && !current.constraint.vertical) {
                                    deleteConstraints(current, '', true);
                                    const opposite = adjacent.get(0);
                                    const center1 = current.center;
                                    const center2 = opposite.center;
                                    const x = Math.abs(center1.x - center2.x);
                                    const y = Math.abs(center1.y - center2.y);
                                    let degrees = Math.round(Math.atan(Math.min(x, y) / Math.max(x, y)) * (180 / Math.PI));
                                    const radius = Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
                                    if (center1.y > center2.y) {
                                        if (center1.x > center2.x) {
                                            if (x > y) {
                                                degrees += 90;
                                            }
                                            else {
                                                degrees = 180 - degrees;
                                            }
                                        }
                                        else {
                                            if (x > y) {
                                                degrees = 270 - degrees;
                                            }
                                            else {
                                                degrees += 180;
                                            }
                                        }
                                    }
                                    else if (center1.y < center2.y) {
                                        if (center2.x > center1.x) {
                                            if (x > y) {
                                                degrees += 270;
                                            }
                                            else {
                                                degrees = 360 - degrees;
                                            }
                                        }
                                        else {
                                            if (x > y) {
                                                degrees = 90 - degrees;
                                            }
                                        }
                                    }
                                    else {
                                        degrees = (center1.x > center2.x ? 90 : 270);
                                    }
                                    current.app('layout_constraintCircle', opposite.stringId);
                                    current.app('layout_constraintCircleRadius', delimitDimens(`${current.nodeName}`, 'constraintcircleradius', formatPX(radius)));
                                    current.app('layout_constraintCircleAngle', degrees.toString());
                                    current.constraint.horizontal = true;
                                    current.constraint.vertical = true;
                                }
                                else {
                                    this.addGuideline(current);
                                }
                            }
                            let bottomParent: Null<boolean> = null;
                            let rightParent: Null<boolean> = null;
                            const maxBottom: number = Math.max.apply(null, nodes.list.map(item => item.linear.bottom));
                            const connected = {};
                            function deleteChain(item: T, value: string) {
                                mapDelete(item, value);
                                connected[item.stringId][value] = null;
                            }
                            for (const current of nodes) {
                                const top = mapParent(current, 'top');
                                const right = mapParent(current, 'right');
                                let bottom = mapParent(current, 'bottom');
                                const left = mapParent(current, 'left');
                                connected[current.stringId] = {
                                    leftRight: mapSibling(current, 'leftRight'),
                                    rightLeft: mapSibling(current, 'rightLeft'),
                                    topBottom: mapSibling(current, 'topBottom'),
                                    bottomTop: mapSibling(current, 'bottomTop'),
                                };
                                if ((top && bottom && (!current.has('marginTop', CSS_STANDARD.AUTO) && current.linear.bottom < maxBottom)) || (bottom && mapSibling(current, 'topBottom') && current.viewHeight > 0)) {
                                    mapDelete(current, 'bottom');
                                    bottom = false;
                                }
                                if (current.pageflow) {
                                    [[left, right, 'rightLeft', 'leftRight', 'right', 'left', 'Horizontal'], [top, bottom, 'bottomTop', 'topBottom', 'bottom', 'top', 'Vertical']].forEach((value: [boolean, boolean, string, string, string, string, string], index) => {
                                        if (value[0] || value[1]) {
                                            let valid = (value[0] && value[1]);
                                            let next: Null<T> = current;
                                            if (!valid) {
                                                do {
                                                    const stringId = mapSibling(next, (value[0] ? value[2] : value[3]));
                                                    if (stringId) {
                                                        next = this.findByStringId(stringId);
                                                        if (next && ((value[0] && mapParent(next, value[4])) || (value[1] && mapParent(next, value[5])))) {
                                                            valid = true;
                                                            break;
                                                        }
                                                    }
                                                    else {
                                                        next = null;
                                                    }
                                                }
                                                while (next != null);
                                            }
                                            if (valid) {
                                                node.constraint[`layout${value[6]}`] = true;
                                            }
                                            if (!current.constraint[`chain${value[6]}`]) {
                                                if (value[0] && value[1]) {
                                                    if (!current.autoMargin && !current.linearVertical) {
                                                        current.android(`layout_${(index === 0 ? 'width' : 'height')}`, 'match_parent', false);
                                                    }
                                                }
                                                else if (value[1]) {
                                                    if (valid) {
                                                        const below = this.findByStringId(mapSibling(current, value[3]) as string);
                                                        if (below && below.marginBottom === 0) {
                                                            mapDelete(current, value[4]);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    if (right) {
                                        if (!rightParent) {
                                            rightParent = false;
                                            rightParent = resolveAnchor(current, nodes, AXIS_ANDROID.HORIZONTAL);
                                        }
                                    }
                                    else if (left) {
                                        if (current.is(NODE_STANDARD.TEXT) && current.cssParent('textAlign', true) === 'center') {
                                            current.anchor(mapLayout['right'], 'parent');
                                        }
                                        if (current.textElement &&
                                            current.viewWidth === 0 &&
                                            current.toInt('maxWidth') === 0 &&
                                            current.multiLine &&
                                            !hasLineBreak(current.element) &&
                                            !nodes.list.some(item => mapSibling(item, 'rightLeft') === current.stringId))
                                        {
                                            current.android('layout_width', 'match_parent');
                                        }
                                    }
                                    if (bottom) {
                                        if (!bottomParent) {
                                            bottomParent = false;
                                            bottomParent = resolveAnchor(current, nodes, AXIS_ANDROID.VERTICAL);
                                        }
                                    }
                                }
                                else {
                                    if (left && right && current.right == null && current.viewWidth > 0) {
                                        switch (current.cssParent('textAlign', true)) {
                                            case 'center':
                                            case 'right':
                                            case 'end':
                                                break;
                                            default:
                                                mapDelete(current, 'right');
                                                break;
                                        }
                                    }
                                    if (top && bottom && current.bottom == null && current.viewHeight > 0) {
                                        switch (current.css('verticalAlign')) {
                                            case 'bottom':
                                            case 'text-bottom':
                                            case 'middle':
                                                break;
                                            default:
                                                mapDelete(current, 'bottom');
                                                break;
                                        }
                                    }
                                    if (left && right && node.viewWidth === 0) {
                                        node.constraint.layoutWidth = true;
                                    }
                                    if (top && bottom && node.viewHeight === 0) {
                                        node.constraint.layoutHeight = true;
                                    }
                                    if (right && current.toInt('right') > 0) {
                                        current.modifyBox(BOX_STANDARD.MARGIN_RIGHT, Math.max(current.toInt('right') - node.paddingRight, 0));
                                    }
                                    if (bottom && current.toInt('bottom') > 0) {
                                        current.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, Math.max(current.toInt('bottom') - node.paddingBottom, 0));
                                    }
                                    if (right && bottom) {
                                        if (node.documentRoot) {
                                            if (node.viewWidth === 0) {
                                                node.constraint.layoutWidth = false;
                                                node.constraint.layoutHorizontal = false;
                                            }
                                            if (node.viewHeight === 0) {
                                                node.constraint.layoutHeight = false;
                                                node.constraint.layoutVertical = false;
                                            }
                                        }
                                    }
                                }
                            }
                            for (const left in connected) {
                                for (const right in connected) {
                                    if (left !== right) {
                                        ['leftRight', 'rightLeft', 'bottomTop', 'topBottom'].forEach(value => {
                                            if (connected[left][value] && connected[left][value] === connected[right][value]) {
                                                const conflict = nodes.locate('stringId', connected[left][value]);
                                                if (conflict) {
                                                    [nodes.locate('stringId', left), nodes.locate('stringId', right)].some((item, index) => {
                                                        if (item) {
                                                            const stringId = (index === 0 ? left : right);
                                                            switch (value) {
                                                                case 'leftRight':
                                                                case 'rightLeft':
                                                                    if ((mapSibling(item, 'left') || mapSibling(item, 'right')) && mapSibling(conflict, (value === 'rightLeft' ? 'leftRight' : 'rightLeft')) !== stringId) {
                                                                        deleteChain(item, value);
                                                                        return true;
                                                                    }
                                                                    break;
                                                                case 'bottomTop':
                                                                case 'topBottom':
                                                                    if ((mapSibling(item, 'top') || mapSibling(item, 'bottom')) && mapSibling(conflict, (value === 'topBottom' ? 'bottomTop' : 'topBottom')) !== stringId) {
                                                                        deleteChain(item, value);
                                                                        return true;
                                                                    }
                                                                    break;
                                                            }
                                                        }
                                                        return false;
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                            if (rightParent === false) {
                                node.constraint.layoutWidth = true;
                            }
                            if (bottomParent === false) {
                                node.constraint.layoutHeight = true;
                            }
                        }
                    }
                }
                for (const current of nodes) {
                    if (current.constraint.marginHorizontal != null) {
                        const item = this.findByStringId(current.constraint.marginHorizontal);
                        if (item) {
                            const offset = current.linear.left - item.actualRight();
                            if (offset >= 1) {
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, offset);
                            }
                        }
                    }
                    if (current.constraint.marginVertical != null) {
                        const item = this.findByStringId(current.constraint.marginVertical);
                        if (item) {
                            const offset = current.linear.top - item.linear.bottom;
                            if (offset >= 1) {
                                current.modifyBox(BOX_STANDARD.MARGIN_TOP, offset);
                            }
                        }
                    }
                }
            }
            else {
                if (node.linearHorizontal) {
                    this.adjustLineHeight(node.renderChildren, node);
                }
            }
        }
    }

    public getEmptySpacer(nodeType: number, depth: number, width?: string, height?: string, columnSpan = 1) {
        let xml = '';
        const percent = (width != null && isPercent(width) ? (parseInt(width) / 100).toFixed(2) : '');
        switch (nodeType) {
            case NODE_STANDARD.GRID:
                xml = this.renderNodeStatic(
                        NODE_STANDARD.SPACE,
                        depth,
                        {
                            app: {
                                layout_columnWeight: percent,
                                layout_columnSpan: columnSpan.toString()
                            }
                        },
                        (percent !== '' ? '0px' : 'wrap_content'),
                        (!height ? 'wrap_content' : formatPX(height))
                    );
                break;
        }
        return xml;
    }

    public createGroup(parent: T, node: T, children: T[]): T {
        const group = <View> new ViewGroup(this.cache.nextId, node, parent, children) as T;
        if (children.length > 0) {
            children.forEach(item => item.inherit(group, 'data'));
        }
        this.cache.append(group);
        return group;
    }

    public renderGroup(node: T, parent: T, viewName: number | string, options?: ObjectMap<any>) {
        const target = (node.isSet('dataset', 'target') && !node.isSet('dataset', 'include'));
        let preXml = '';
        let postXml = '';
        if (typeof viewName === 'number') {
            viewName = View.getControlName(viewName);
        }
        switch (viewName) {
            case NODE_ANDROID.LINEAR:
                options = {
                    android: {
                        orientation: (options && options.horizontal ? AXIS_ANDROID.HORIZONTAL : AXIS_ANDROID.VERTICAL)
                    }
                };
                break;
            case NODE_ANDROID.GRID:
                options = {
                    app: {
                        columnCount: (options && options.columns ? options.columns.toString() : '2'),
                        rowCount: (options && options.rows > 0 ? options.rows.toString() : '')
                    }
                };
                break;
            default:
                options = {};
                break;
        }
        node.setNodeType(viewName);
        if (node.overflowX || node.overflowY) {
            const scrollType: string[] = [];
            if (node.overflowX && node.overflowY) {
                scrollType.push(NODE_ANDROID.SCROLL_HORIZONTAL, NODE_ANDROID.SCROLL_VERTICAL);
            }
            else {
                if (node.overflowX) {
                    scrollType.push(NODE_ANDROID.SCROLL_HORIZONTAL);
                }
                if (node.overflowY) {
                    scrollType.push(NODE_ANDROID.SCROLL_VERTICAL);
                }
            }
            let previous: Null<T> = null;
            const scrollView = scrollType.map((nodeName, index) => {
                const container = new View(this.cache.nextId, SETTINGS.targetAPI, (index === 0 ? node.element : undefined)) as T;
                container.nodeName = node.nodeName;
                container.documentParent = node.documentParent;
                container.setNodeType(nodeName);
                if (index === 0) {
                    container.inherit(node, 'initial', 'base', 'data', 'style', 'styleMap');
                    container.parent = parent;
                    container.render(parent);
                }
                else {
                    container.init();
                    container.inherit(node, 'dimensions');
                    container.inherit(node, 'initial', 'style', 'styleMap');
                    if (previous != null) {
                        previous.css('overflow', 'visible scroll');
                        previous.css('overflowX', 'scroll');
                        previous.css('overflowY', 'visible');
                        container.parent = previous;
                        container.render(previous);
                    }
                    container.css('overflow', 'scroll visible');
                    container.css('overflowX', 'visible');
                    container.css('overflowY', 'scroll');
                    if (node.has('height', CSS_STANDARD.UNIT)) {
                        container.css('height', formatPX(node.toInt('height') + node.paddingTop + node.paddingBottom));
                    }
                }
                container.resetBox(BOX_STANDARD.PADDING);
                const indent = repeat(container.renderDepth);
                preXml += `{<${container.id}}${indent}<${nodeName}{@${container.id}}>\n` +
                          `{:${container.id}}`;
                postXml = `${indent}</${nodeName}>\n{>${container.id}}` + (index === 1 ? '\n' : '') + postXml;
                previous = container;
                this.cache.append(container);
                return container;
            });
            if (scrollView.length === 2) {
                node.android('layout_width', 'wrap_content');
                node.android('layout_height', 'wrap_content');
            }
            else {
                node.android((node.overflowX ? 'layout_width' : 'layout_height'), 'wrap_content');
            }
            node.removeElement();
            node.resetBox(BOX_STANDARD.MARGIN);
            node.parent = scrollView[scrollView.length - 1];
            node.render(node.parent);
        }
        else {
            node.render((target ? node : parent));
        }
        node.apply(options);
        return this.getEnclosingTag(
                (target || parent.isSet('dataset', 'target') || (node.renderDepth === 0 && !node.documentRoot) ? -1 : node.renderDepth),
                viewName,
                node.id,
                formatPlaceholder(node.id),
                preXml,
                postXml
            );
    }

    public renderNode(node: T, parent: T, nodeName: number | string, recursive = false) {
        const target = (node.isSet('dataset', 'target') && !node.isSet('dataset', 'include'));
        if (typeof nodeName === 'number') {
            nodeName = View.getControlName(nodeName);
        }
        node.setNodeType(nodeName);
        switch (node.tagName) {
            case 'IMG': {
                if (!recursive) {
                    const element = <HTMLImageElement> node.element;
                    let width = node.toInt('width');
                    let height = node.toInt('height');
                    const top = node.toInt('top');
                    const left = node.toInt('left');
                    const percentWidth = node.has('width', CSS_STANDARD.PERCENT);
                    const percentHeight = node.has('height', CSS_STANDARD.PERCENT);
                    let scaleType = '';
                    if (percentWidth || percentHeight) {
                        scaleType = (percentWidth && percentHeight ? 'fitXY' : 'fitCenter');
                    }
                    else {
                        if (width === 0) {
                            const match = /width="([0-9]+)"/.exec(element.outerHTML);
                            if (match) {
                                width = parseInt(match[1]);
                                node.css('width', formatPX(match[1]));
                            }
                        }
                        if (height === 0) {
                            const match = /height="([0-9]+)"/.exec(element.outerHTML);
                            if (match) {
                                height = parseInt(match[1]);
                                node.css('height', formatPX(match[1]));
                            }
                        }
                        switch (node.css('objectFit')) {
                            case 'contain':
                                scaleType = 'centerInside';
                                break;
                            case 'cover':
                                scaleType = 'centerCrop';
                                break;
                            case 'scale-down':
                                scaleType = 'fitCenter';
                                break;
                            case 'none':
                                scaleType = 'matrix';
                                break;
                            default:
                                scaleType = 'fitXY';
                                break;
                        }
                    }
                    if (scaleType !== '') {
                        node.android('scaleType', scaleType);
                    }
                    if ((width > 0 && height === 0) || (width === 0 && height > 0)) {
                        node.android('adjustViewBounds', 'true');
                    }
                    if (top < 0 || left < 0) {
                        const container = new View(this.cache.nextId, SETTINGS.targetAPI, node.element) as T;
                        container.excludeProcedure |= NODE_PROCEDURE.ALL;
                        container.excludeResource |= NODE_RESOURCE.ALL;
                        container.android('layout_width', (width > 0 ? formatPX(width) : 'wrap_content'));
                        container.android('layout_height', (height > 0 ? formatPX(height) : 'wrap_content'));
                        container.setBounds();
                        container.setNodeType(NODE_ANDROID.FRAME);
                        container.render(parent);
                        if (left < 0) {
                            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, left, true);
                            container.css('left', '0px');
                        }
                        if (top < 0) {
                            node.modifyBox(BOX_STANDARD.MARGIN_TOP, top, true);
                            container.css('top', '0px');
                        }
                        node.parent = container;
                        this.cache.append(container);
                        return this.getEnclosingTag(container.renderDepth, NODE_ANDROID.FRAME, container.id, this.renderNode(node, container, nodeName, true));
                    }
                }
                break;
            }
            case 'TEXTAREA': {
                const element = <HTMLTextAreaElement> node.element;
                node.android('minLines', '2');
                if (element.rows > 2) {
                    node.android('maxLines', element.rows.toString());
                }
                if (element.maxLength > 0) {
                    node.android('maxLength', element.maxLength.toString());
                }
                if (node.viewWidth === 0) {
                    const cols = convertInt(element.cols);
                    if (cols > 0) {
                        node.css('width', formatPX(cols * 10));
                    }
                }
                node.android('hint', element.placeholder);
                node.android('scrollbars', AXIS_ANDROID.VERTICAL);
                node.android('inputType', 'textMultiLine');
                if (node.overflowX) {
                    node.android('scrollHorizontally', 'true');
                }
                break;
            }
            case 'INPUT': {
                const element = <HTMLInputElement> node.element;
                switch (element.type) {
                    case 'radio':
                        if (!recursive) {
                            const radiogroup =
                                parent.children.map(item => {
                                    if (item.renderAs != null) {
                                        item = item.renderAs as T;
                                    }
                                    const input = <HTMLInputElement> item.element;
                                    if (item.visible && !item.rendered && input.type === 'radio' && input.name === element.name) {
                                        return item;
                                    }
                                    return null;
                                })
                                .filter(item => item) as T[];
                            if (radiogroup.length > 1) {
                                let xml = '';
                                const group = this.createGroup(parent, node, radiogroup);
                                group.setNodeType(NODE_ANDROID.RADIO_GROUP);
                                group.inherit(node, 'alignment');
                                group.render(parent);
                                let checked = '';
                                for (const item of group.children) {
                                    if ((<HTMLInputElement> item.element).checked) {
                                        checked = item.stringId;
                                    }
                                    xml += this.renderNode(item as T, group, NODE_STANDARD.RADIO, true);
                                }
                                group.android('orientation', (NodeList.linearX(radiogroup, false) ? AXIS_ANDROID.HORIZONTAL : AXIS_ANDROID.VERTICAL));
                                group.alignmentType |= NODE_ALIGNMENT.SEGMENTED;
                                if (checked !== '') {
                                    group.android('checkedButton', checked);
                                }
                                return this.getEnclosingTag(group.renderDepth, NODE_ANDROID.RADIO_GROUP, group.id, xml);
                            }
                        }
                        break;
                    case 'password':
                        node.android('inputType', 'textPassword');
                        break;
                    case 'text':
                        node.android('inputType', 'text');
                        break;
                    case 'range':
                        if (hasValue(element.min)) {
                            node.android('min', element.min);
                        }
                        if (hasValue(element.max)) {
                            node.android('max', element.max);
                        }
                        if (hasValue(element.value)) {
                            node.android('progess', element.value);
                        }
                        break;
                }
                switch (element.type) {
                    case 'text':
                    case 'search':
                    case 'tel':
                    case 'url':
                    case 'email':
                    case 'password':
                        if (node.viewWidth === 0) {
                            const size = convertInt(element.size);
                            if (size > 0) {
                                node.css('width', formatPX(size * 10));
                            }
                        }
                        break;
                }
                break;
            }
        }
        switch (node.controlName) {
            case NODE_ANDROID.TEXT:
                const scrollbars: string[] = [];
                if (node.overflowX) {
                    scrollbars.push(AXIS_ANDROID.HORIZONTAL);
                }
                if (node.overflowY) {
                    scrollbars.push(AXIS_ANDROID.VERTICAL);
                }
                if (scrollbars.length > 0) {
                    node.android('scrollbars', scrollbars.join('|'));
                }
                if (node.has('maxWidth', CSS_STANDARD.UNIT)) {
                    node.android('maxWidth', node.css('maxWidth'));
                }
                if (node.has('maxHeight', CSS_STANDARD.UNIT)) {
                    node.android('maxHeight', node.css('maxHeight'));
                }
                break;
            case NODE_ANDROID.LINE:
                if (node.viewHeight === 0) {
                    node.android('layout_height', formatPX((node.borderTopWidth + node.borderBottomWidth + node.paddingTop + node.paddingBottom) || 1));
                }
                break;
        }
        node.render((target ? node : parent));
        if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.ACCESSIBILITY)) {
            node.setAccessibility();
        }
        return this.getEnclosingTag(
                (target || parent.isSet('dataset', 'target') || (node.renderDepth === 0 && !node.documentRoot) ? -1 : node.renderDepth),
                node.controlName,
                node.id
            );
    }

    public renderNodeStatic(nodeName: number | string, depth: number, options = {}, width = '', height = '', node?: T, children?: boolean) {
        if (node == null) {
            node = new View(0, SETTINGS.targetAPI) as T;
        }
        node.apply(formatResource(options));
        const renderDepth = Math.max(0, depth);
        const viewName = (typeof nodeName === 'number' ? View.getControlName(nodeName) : nodeName);
        switch (viewName) {
            case 'include':
            case 'merge':
            case 'menu':
                break;
            default:
                node.setNodeType(viewName);
                break;
        }
        const displayName = (node.hasElement ? node.nodeName : viewName);
        if (hasValue(width)) {
            if (!isNaN(parseInt(width))) {
                width = delimitDimens(displayName, 'width', width);
            }
            node.android('layout_width', width, false);
        }
        if (hasValue(height)) {
            if (!isNaN(parseInt(height))) {
                height = delimitDimens(displayName, 'height', height);
            }
            node.android('layout_height', height, false);
        }
        node.renderDepth = renderDepth;
        let output =
            this.getEnclosingTag(
                (depth === 0 && !node.documentRoot ? -1 : depth),
                viewName,
                node.id,
                (children ? formatPlaceholder(node.id) : '')
            );
        if (SETTINGS.showAttributes && node.id === 0) {
            const indent = repeat(renderDepth + 1);
            const attrs = node.combine().map(value => `\n${indent + value}`).join('');
            output = output.replace(formatPlaceholder(node.id, '@'), attrs);
        }
        options['stringId'] = node.stringId;
        return output;
    }

    public renderInclude(node: T, parent: T, name: string) {
        this._merge[name] = (node.dataset.includeMerge === 'true');
        node.documentRoot = !this._merge[name];
        return this.renderNodeStatic('include', parent.renderDepth + 1, { layout: `@layout/${name}` });
    }

    public renderMerge(name: string, value: string[]) {
        let xml = value.join('');
        if (this._merge[name]) {
            const node = new View(0, 0);
            node.documentRoot = true;
            xml = this.renderNodeStatic('merge', 0, {}, '', '', <T> node, true).replace('{:0}', xml);
        }
        return xml;
    }

    public baseRenderDepth(name: string) {
        return (this._merge[name] ? 0 : -1);
    }

    public addXmlNs(name: string, uri: string) {
        XMLNS_ANDROID[name] = uri;
    }

    public setDimensions(data: ViewData<NodeList<T>>) {
        function addToGroup(nodeName: string, node: T, dimen: string, attr?: string, value?: string) {
            const group: ObjectMap<T[]> = groups[nodeName];
            let name = dimen;
            if (arguments.length === 5) {
                if (value != null && /(px|dp|sp)$/.test(value)) {
                    name = `${dimen},${attr},${value}`;
                }
                else {
                    return;
                }
            }
            if (group[name] == null) {
                group[name] = [];
            }
            group[name].push(node);
        }
        const groups = {};
        for (const node of data.cache.visible) {
            node.setBoxSpacing();
            if (SETTINGS.dimensResourceValue) {
                const nodeName = node.nodeName.toLowerCase();
                if (groups[nodeName] == null) {
                    groups[nodeName] = {};
                }
                for (const key of Object.keys(BOX_STANDARD)) {
                    const result = this.valueBox(node, key);
                    if (result[0] !== '' && result[1] !== '0px') {
                        const name = `${BOX_STANDARD[key].toLowerCase()},${result[0]},${result[1]}`;
                        addToGroup(nodeName, node, name);
                    }
                }
                ['android:layout_width:width',
                 'android:layout_height:height',
                 'android:minWidth:min_width',
                 'android:minHeight:min_height',
                 'app:layout_constraintWidth_min:constraint_width_min',
                 'app:layout_constraintHeight_min:constraint_height_min'].forEach(value => {
                    const [obj, attr, dimen] = value.split(':');
                    addToGroup(nodeName, node, dimen, attr, node[obj](attr));
                });
            }
        }
        if (SETTINGS.dimensResourceValue) {
            const resource = <Map<string, string>> Resource.STORED.DIMENS;
            for (const nodeName in groups) {
                const group: ObjectMap<T[]> = groups[nodeName];
                for (const name in group) {
                    const [dimen, attr, value] = name.split(',');
                    const key = this.getDimensResourceKey(resource, `${nodeName}_${parseRTL(dimen)}`, value);
                    group[name].forEach(node => node[(attr.indexOf('constraint') !== -1 ? 'app' : 'android')](attr, `@dimen/${key}`));
                    resource.set(key, value);
                }
            }
        }
    }

    private valueBox(node: T, region: string | number) {
        const name = convertEnum(parseInt(region as string), BOX_STANDARD, BOX_ANDROID);
        if (name !== '') {
            const attr = parseRTL(name);
            return [attr, node.android(attr) || '0px'];
        }
        return ['', '0px'];
    }

    private parseDimensions(content: string) {
        const resource = <Map<string, string>> Resource.STORED.DIMENS;
        const pattern = /\s+\w+:\w+="({%(\w+),(\w+),(-?\w+)})"/g;
        let match: Null<RegExpExecArray>;
        while ((match = pattern.exec(content)) != null) {
            const key = this.getDimensResourceKey(resource, `${match[2]}_${parseRTL(match[3])}`, match[4]);
            resource.set(key, match[4]);
            content = content.replace(new RegExp(match[1], 'g'), `@dimen/${key}`);
        }
        return content;
    }

    private setAttributes(data: ViewData<NodeList<T>>) {
        if (SETTINGS.showAttributes) {
            const cache: StringMap[] = data.cache.visible.list.map(node => ({ pattern: formatPlaceholder(node.id, '@'), attributes: this.parseAttributes(node) }));
            [...data.views, ...data.includes].forEach(value => {
                cache.forEach(item => value.content = value.content.replace(item.pattern, item.attributes));
                value.content = value.content.replace(`{#0}`, this.getRootNamespace(value.content));
            });
        }
    }

    private parseAttributes(node: T) {
        if (node.dir === 'rtl') {
            if (node.nodeType < NODE_STANDARD.INLINE) {
                node.android('textDirection', 'rtl');
            }
            else if (node.length > 0) {
                node.android('layoutDirection', 'rtl');
            }
        }
        for (const name in node.dataset) {
            if (/^attr[A-Z]+/.test(name)) {
                const obj = capitalize(name.substring(4), false);
                (node.dataset[name] as string).split(';').forEach(values => {
                    const [key, value] = values.split('::');
                    if (hasValue(key) && hasValue(value)) {
                        node.attr(obj, key, value);
                    }
                });
            }
        }
        const indent = repeat(node.renderDepth + 1);
        return node.combine().map(value => `\n${indent + value}`).join('');
    }

    private getRootNamespace(content: string) {
        let output = '';
        for (const namespace in XMLNS_ANDROID) {
            if (new RegExp(`\\s+${namespace}:`).test(content)) {
                output += `\n\txmlns:${namespace}="${XMLNS_ANDROID[namespace]}"`;
            }
        }
        return output;
    }

    private getDimensResourceKey(resource: Map<string, string>, key: string, value: string) {
        if (resource.has(key) && resource.get(key) !== value) {
            key = generateId('dimens', `${key}_1`);
        }
        return key;
    }

    private setAlignParent(node: T, orientation = '', bias = false) {
        const map = MAP_LAYOUT.constraint;
        [AXIS_ANDROID.HORIZONTAL, AXIS_ANDROID.VERTICAL].forEach((value, index) => {
            if (!node.constraint[value] && (orientation === '' || value === orientation)) {
                node.app(map[(index === 0 ? 'left' : 'top')], 'parent');
                node.app(map[(index === 0 ? 'right' : 'bottom')], 'parent');
                node.constraint[value] = true;
                if (bias) {
                    node.app(`layout_constraint${value.charAt(0).toUpperCase() + value.substring(1)}_bias`, node[`${value}Bias`]);
                }
            }
        });
    }

    private partitionChain(node: T, nodes: NodeList<T>, orientation: string, validate: boolean) {
        const map = MAP_LAYOUT.constraint;
        const mapParent: string[] = [];
        const coordinate: string[] = [];
        const connected: string[] = [];
        switch (orientation) {
            case AXIS_ANDROID.HORIZONTAL:
                mapParent.push(map['left'], map['right']);
                coordinate.push('linear.top', 'linear.bottom');
                connected.push(map['leftRight'], map['rightLeft']);
                break;
            case AXIS_ANDROID.VERTICAL:
                mapParent.push(map['top'], map['bottom']);
                coordinate.push('linear.left', 'linear.right');
                connected.push(map['topBottom'], map['bottomTop']);
                break;
        }
        const result =
            coordinate.map(value => {
                const sameXY = sortAsc(nodes.list.filter(item => sameValue(node, item, value)), coordinate[0]);
                if (sameXY.length > 1) {
                    if (!validate || (!sameXY.some(item => item.floating) && sameXY[0].app(mapParent[0]) === 'parent' && sameXY[sameXY.length - 1].app(mapParent[1]) === 'parent')) {
                        return sameXY;
                    }
                    else {
                        let valid;
                        const chained: Set<T> = new Set([node]);
                        do {
                            valid = false;
                            Array.from(chained).some(item => {
                                return sameXY.some(adjacent => {
                                    if (!chained.has(adjacent) && (adjacent.app(connected[0]) === item.stringId || adjacent.app(connected[1]) === item.stringId)) {
                                        chained.add(adjacent);
                                        valid = true;
                                    }
                                    return valid;
                                });
                            });
                        }
                        while (valid);
                        return Array.from(chained);
                    }
                }
                return [];
            })
            .reduce((a, b) => a.length >= b.length ? a : b);
        return result;
    }

    private addGuideline(node: T, orientation = '', percent?: boolean, opposite?: boolean) {
        const map = MAP_LAYOUT.constraint;
        if (node.pageflow) {
            if (opposite == null) {
                opposite = (
                    node.float === 'right' ||
                    (node.left == null && node.right != null) ||
                    (node.is(NODE_STANDARD.TEXT) && node.css('textAlign') === 'right') ||
                    node.alignParent('right')
                );
            }
            if (percent == null && opposite === true) {
                percent = true;
            }
        }
        if (node.dataset.constraintPercent != null) {
            percent = (node.dataset.constraintPercent === 'true');
        }
        const parent = node.documentParent;
        const beginPercent = `layout_constraintGuide_${(percent ? 'percent' : 'begin')}`;
        [AXIS_ANDROID.HORIZONTAL, AXIS_ANDROID.VERTICAL].forEach((value, index) => {
            if (!node.constraint[value] && (orientation === '' || value === orientation)) {
                let LT = '';
                let RB = '';
                let LTRB = '';
                let RBLT = '';
                let found = false;
                let offset = 0;
                switch (index) {
                    case 0:
                        LT = (!opposite ? 'left' : 'right');
                        RB = (!opposite ? 'right' : 'left');
                        LTRB = (!opposite ? 'leftRight' : 'rightLeft');
                        RBLT = (!opposite ? 'rightLeft' : 'leftRight');
                        if (node.position === 'relative' && node.toInt('left') < 0) {
                            offset = node.toInt('left');
                        }
                        break;
                    case 1:
                        LT = (!opposite ? 'top' : 'bottom');
                        RB = (!opposite ? 'bottom' : 'top');
                        LTRB = (!opposite ? 'topBottom' : 'bottomTop');
                        RBLT = (!opposite ? 'bottomTop' : 'topBottom');
                        if (node.position === 'relative' && node.toInt('top') < 0) {
                            offset = node.toInt('top');
                        }
                        break;
                }
                const dimension = (node.pageflow ? 'bounds' : 'linear');
                const position = (percent ? Math.abs((node[dimension][LT] + offset) - (parent.documentBody ? 0 : parent.box[LT])) / parent.box[(index === 0 ? 'width' : 'height')] : 0);
                if (!percent) {
                    found = parent.renderChildren.some(item => {
                        if (item.constraint[value] && (!item.constraint[`chain${capitalize(value)}`] || item.constraint[`margin${capitalize(value)}`] != null)) {
                            if (withinFraction(node.linear[LT] + offset, item.linear[RB])) {
                                node.anchor(map[LTRB], item.stringId, value, true);
                                return true;
                            }
                            else if (withinFraction(node.linear[RB] + offset, item.linear[LT])) {
                                node.anchor(map[RBLT], item.stringId, value, true);
                                return true;
                            }
                            if (withinFraction(node.bounds[LT] + offset, item.bounds[LT])) {
                                node.anchor(map[(
                                    index === 1 &&
                                    node.is(NODE_STANDARD.TEXT) &&
                                    node.baseline &&
                                    item.is(NODE_STANDARD.TEXT) &&
                                    item.baseline ? 'baseline' : LT)], item.stringId, value, true);
                                return true;
                            }
                            else if (withinFraction(node.bounds[RB] + offset, item.bounds[RB])) {
                                node.anchor(map[RB], item.stringId, value, true);
                                return true;
                            }
                        }
                        return false;
                    });
                }
                if (!found) {
                    const guideline = parent.constraint.guideline || {};
                    let location = (percent ? parseFloat(Math.abs(position - (!opposite ? 0 : 1)).toFixed(SETTINGS.constraintPercentAccuracy))
                                            : (!opposite ? (node[dimension][LT] + offset) - parent.box[LT]
                                                         : (node[dimension][LT] + offset) - parent.box[RB]));
                    if (!percent && !opposite) {
                        if (location < 0) {
                            const padding = parent[`padding${capitalize(LT)}`];
                            if (padding >= Math.abs(location)) {
                                location = 0;
                            }
                            else {
                                location = Math.abs(location) - padding;
                            }
                        }
                        else {
                            if (parent.documentBody) {
                                location = node[dimension][LT] + offset;
                            }
                        }
                    }
                    if (location === 0) {
                        node.anchor(map[LT], 'parent', value, true);
                    }
                    else {
                        const options = {
                            android: {
                                orientation: (index === 0 ? AXIS_ANDROID.VERTICAL : AXIS_ANDROID.HORIZONTAL)
                            },
                            app: {
                                [beginPercent]: location.toString()
                            }
                        };
                        const anchors: {} = optional(guideline, `${value}.${beginPercent}.${LT}`, 'object');
                        if (anchors) {
                            for (const stringId in anchors) {
                                if (anchors[stringId] === location) {
                                    node.anchor(map[LT], stringId, value, true);
                                    node.delete('app', map[RB]);
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (!found) {
                            if (!percent) {
                                options.app[beginPercent] = delimitDimens(node.nodeName, 'constraintguide_begin', formatPX(location));
                            }
                            const xml =
                                this.renderNodeStatic(
                                    NODE_ANDROID.GUIDELINE,
                                    node.renderDepth,
                                    options,
                                    'wrap_content',
                                    'wrap_content'
                                );
                            const stringId = (<any> options).stringId;
                            this.appendAfter(node.id, xml);
                            node.anchor(map[LT], stringId, value, true);
                            node.delete('app', map[RB]);
                            node.constraint[`${value}Guideline`] = stringId;
                            if (guideline[value] == null) {
                                guideline[value] = {};
                            }
                            if (guideline[value][beginPercent] == null) {
                                guideline[value][beginPercent] = {};
                            }
                            if (guideline[value][beginPercent][LT] == null) {
                                guideline[value][beginPercent][LT] = {};
                            }
                            guideline[value][beginPercent][LT][stringId] = location;
                            parent.constraint.guideline = guideline;
                        }
                    }
                }
            }
        });
    }

    private adjustLineHeight<T extends View>(nodes: T[], parent: T) {
        const lineHeight: number = Math.max.apply(null, nodes.map(node => node.toInt('lineHeight')));
        if (lineHeight > 0) {
            let minHeight = Number.MAX_VALUE;
            let offsetTop = 0;
            const valid =
                nodes.every(node => {
                    const offset = lineHeight - node.bounds.height;
                    if (offset > 0) {
                        minHeight = Math.min(offset, minHeight);
                        if (lineHeight === node.toInt('lineHeight')) {
                            offsetTop = Math.max((node.toInt('top') < 0 ? Math.abs(node.toInt('top')) : 0), offsetTop);
                        }
                        return true;
                    }
                    return false;
                });
            if (valid) {
                parent.modifyBox(BOX_STANDARD.PADDING_TOP, Math.floor(minHeight / 2));
                parent.modifyBox(BOX_STANDARD.PADDING_BOTTOM, Math.ceil(minHeight / 2) + offsetTop);
            }
        }
    }

    private findByStringId(id: string) {
        return this.cache.locate('stringId', id);
    }

    get supportInline() {
        return WEBVIEW_ANDROID;
    }

    get supportInclude() {
        return true;
    }

    get settings(): ControllerSettings {
        return {
            folderLayout: 'res/layout'
        };
    }
}