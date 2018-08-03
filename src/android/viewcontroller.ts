import { ArrayIndex, Null, ObjectIndex, ObjectMap, PlainFile, Point, StringMap, ViewData } from '../lib/types';
import Controller from '../base/controller';
import NodeList from '../base/nodelist';
import Resource from '../base/resource';
import View from './view';
import ViewGroup from './viewgroup';
import ViewList from './viewlist';
import { capitalize, convertPX, formatPX, hasValue, includesEnum, indexOf, isPercent, repeat, same, search, sortAsc, withinFraction, withinRange, convertInt } from '../lib/util';
import { formatDimen, generateId, replaceDP, resetId, stripId } from './lib/util';
import { formatResource } from './extension/lib/util';
import { removePlaceholders, replaceTab } from '../lib/xml';
import { BOX_STANDARD, OVERFLOW_ELEMENT, NODE_PROCEDURE, NODE_STANDARD } from '../lib/constants';
import { AXIS_ANDROID, NODE_ANDROID, WEBVIEW_ANDROID, XMLNS_ANDROID } from './constants';
import parseRTL from './localization';
import SETTINGS from '../settings';

const LAYOUT_MAP = {
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

const CHAIN_MAP = {
    direction: ['horizontalChain', 'verticalChain'],
    leftTop: ['left', 'top'],
    rightBottom: ['right', 'bottom'],
    rightLeftBottomTop: ['rightLeft', 'bottomTop'],
    leftRightTopBottom: ['leftRight', 'topBottom'],
    widthHeight: ['Width', 'Height'],
    horizontalVertical: ['Horizontal', 'Vertical']
};

export default class ViewController<T extends View, U extends ViewList<T>> extends Controller<T, U> {
    private merge = {};

    constructor() {
        super();
        resetId();
    }

    public finalize(layouts: PlainFile[]) {
        layouts.forEach(layout => {
            layout.content = removePlaceholders(layout.content).replace(/\n\n/g, '\n');
            if (SETTINGS.dimensResourceValue) {
                layout.content = this.parseDimensions(layout.content);
            }
            layout.content = replaceDP(layout.content);
            layout.content = replaceTab(layout.content, SETTINGS.insertSpaces);
        });
    }

    public reset() {
        super.reset();
        resetId();
        this.merge = {};
    }

    public setConstraints() {
        Object.assign(LAYOUT_MAP.relativeParent, {
            left: parseRTL('layout_alignParentLeft'),
            right: parseRTL('layout_alignParentRight')
        });
        Object.assign(LAYOUT_MAP.relative, {
            left: parseRTL('layout_alignLeft'),
            right: parseRTL('layout_alignRight'),
            leftRight: parseRTL('layout_toRightOf'),
            rightLeft: parseRTL('layout_toLeftOf')
        });
        Object.assign(LAYOUT_MAP.constraint, {
            left: parseRTL('layout_constraintLeft_toLeftOf'),
            right: parseRTL('layout_constraintRight_toRightOf'),
            leftRight: parseRTL('layout_constraintLeft_toRightOf'),
            rightLeft: parseRTL('layout_constraintRight_toLeftOf')
        });
        this.cache.visible.forEach(node => {
            const nodes = (<U> new ViewList(node.renderChildren.filter(item => !item.isolated), node));
            const pageflow = (<U> new ViewList(nodes.list.filter(item => item.pageflow), node));
            const constraint = node.is(NODE_STANDARD.CONSTRAINT);
            const relative = node.is(NODE_STANDARD.RELATIVE);
            const flex = node.flex;
            if (nodes.length > 0 && (constraint || relative || flex.enabled)) {
                const layoutMap = LAYOUT_MAP[(relative ? 'relative' : 'constraint')];
                const relativeParent = LAYOUT_MAP.relativeParent;
                function mapParent(item: T, direction: string) {
                    if (constraint) {
                        return (item.app(layoutMap[direction]) === 'parent');
                    }
                    else {
                        return (item.android(relativeParent[direction]) === 'true');
                    }
                }
                function mapDelete(item: T, ...direction: string[]) {
                    for (const attr of direction) {
                        item.delete((constraint ? 'app' : 'android'), layoutMap[attr]);
                    }
                }
                function resolveAnchor(item: T, orientation: string) {
                    if (!item.constraint[orientation]) {
                        let parent: Null<T> = item;
                        while (parent != null) {
                            const stringId = parent.anchor(layoutMap[(orientation === AXIS_ANDROID.HORIZONTAL ? 'leftRight' : 'topBottom')]);
                            if (hasValue(stringId)) {
                                parent = nodes.findByNodeId(stripId(<string> stringId));
                                if (parent != null && parent.constraint[orientation]) {
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
                if (relative && node.inlineWrap) {
                    const baseline: T[] = [];
                    function adjustBaseline() {
                        if (baseline.length > 1) {
                            const tallest = baseline.sort((a, b) => (a.linear.height >= b.linear.height ? -1 : 1))[0];
                            baseline.forEach(item => {
                                if (item !== tallest) {
                                    item.android(layoutMap['baseline'], tallest.stringId);
                                }
                            });
                        }
                    }
                    const rows: ArrayIndex<T[]> = [];
                    for (let i = 0, width = 0; i < nodes.length; i++) {
                        const current = nodes.list[i];
                        const dimension = (current.multiLine ? 'bounds' : 'linear');
                        if (i === 0) {
                            current.android(relativeParent['top'], 'true');
                            current.android(relativeParent['left'], 'true');
                            if (current.nodeType <= NODE_STANDARD.TEXT) {
                                baseline.push(current);
                            }
                            width += current[dimension].width;
                            rows[rows.length] = [current];
                        }
                        else {
                            const previous = nodes.list[i - 1];
                            const viewGroup = (current instanceof ViewGroup);
                            if (viewGroup || Math.floor(width + current[dimension].width) > node.box.width) {
                                current.android(layoutMap['topBottom'], previous.stringId);
                                current.android(relativeParent['left'], 'true');
                                if (viewGroup) {
                                    current.constraint.marginVertical = previous.stringId;
                                }
                                width = current[dimension].width;
                                adjustBaseline();
                                baseline.length = 0;
                                baseline.push(current);
                                rows[rows.length] = [current];
                            }
                            else {
                                current.android(layoutMap['leftRight'], previous.stringId);
                                if (current.nodeType <= NODE_STANDARD.TEXT) {
                                    baseline.push(current);
                                }
                                width += current[dimension].width;
                                rows[rows.length - 1].push(current);
                            }
                        }
                    }
                    adjustBaseline();
                    for (let i = 0; i < rows.length; i++) {
                        if (rows[i].length === 1) {
                            const current = rows[i][0];
                            if (current.is(NODE_STANDARD.TEXT) && withinFraction(current.linear.right, node.box.right)) {
                                current.android('singleLine', 'true');
                            }
                        }
                    }
                }
                else {
                    const linearX = pageflow.linearX;
                    const adjusted = node.setBoundsMin();
                    const verticalPerspective = (!SETTINGS.horizontalPerspective && !flex.enabled && !pageflow.list.some(item => item.floating));
                    nodes.list.unshift(node);
                    nodes.list.forEach(current => {
                        nodes.list.forEach(adjacent => {
                            if (current === adjacent || ((!current.pageflow || !adjacent.pageflow) && current.intersect(adjacent.linear))) {
                                return;
                            }
                            else {
                                let linear1 = current.linear;
                                let linear2 = adjacent.linear;
                                let stringId = adjacent.stringId;
                                const horizontal = (resolveAnchor(adjacent, AXIS_ANDROID.HORIZONTAL) ? AXIS_ANDROID.HORIZONTAL : '');
                                const vertical = (resolveAnchor(adjacent, AXIS_ANDROID.VERTICAL) ? AXIS_ANDROID.VERTICAL : '');
                                const intersectY = current.intersectY(adjacent.linear);
                                if (constraint) {
                                    const alignParent = (current.pageflow || node.viewHeight === 0 || node.viewWidth === 0);
                                    let alignContent = false;
                                    if (current === node || adjacent === node) {
                                        if (current === node) {
                                            current = adjacent;
                                        }
                                        linear1 = current.linear;
                                        linear2 = node.box;
                                        stringId = 'parent';
                                    }
                                    else {
                                        alignContent = (current.pageflow && adjacent.pageflow);
                                    }
                                    if (current.css('width') != null && current.styleMap.marginRight === 'auto' && current.styleMap.marginLeft === 'auto') {
                                        this.setAlignParent(current, AXIS_ANDROID.HORIZONTAL);
                                    }
                                    else {
                                        if (stringId === 'parent') {
                                            if (alignParent || current.left === 0) {
                                                if (linear1.left <= linear2.left || withinFraction(linear1.left, linear2.left)) {
                                                    current.anchor(layoutMap['left'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                                    current.constraint.parentLeft = true;
                                                }
                                            }
                                            if (alignParent || current.right === 0) {
                                                if (linear1.right >= linear2.right || withinRange(linear1.right, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                                    current.anchor(layoutMap['right'], 'parent', (node.viewWidth > 0 || current.float === 'right' || current.inlineWrap || adjusted.horizontal ? AXIS_ANDROID.HORIZONTAL : ''));
                                                    current.constraint.parentRight = true;
                                                }
                                            }
                                        }
                                        else {
                                            const horizontalOffset = (alignContent ? SETTINGS.whitespaceHorizontalOffset : 0);
                                            if (current.viewWidth === 0 && linear1.left === linear2.left && linear1.right === linear2.right) {
                                                if (!mapParent(current, 'right')) {
                                                    current.anchor(layoutMap['left'], stringId);
                                                }
                                                if (!mapParent(current, 'left')) {
                                                    current.anchor(layoutMap['right'], stringId);
                                                }
                                            }
                                            else if (verticalPerspective) {
                                                if (current.pageflow === adjacent.pageflow) {
                                                    if (linear1.left === linear2.left) {
                                                        current.anchor(layoutMap['left'], stringId);
                                                    }
                                                    else if (linear1.right === linear2.right) {
                                                        current.anchor(layoutMap['right'], stringId);
                                                    }
                                                }
                                            }
                                            if (withinRange(linear1.left, linear2.right, horizontalOffset)) {
                                                if (current.float !== 'right') {
                                                    current.anchor(layoutMap['leftRight'], stringId, horizontal, current.withinX(linear2));
                                                }
                                                else {
                                                    current.constraint.marginHorizontal = adjacent.stringId;
                                                }
                                            }
                                            if (withinRange(linear1.right, linear2.left, horizontalOffset)) {
                                                if (current.float !== 'left') {
                                                    current.anchor(layoutMap['rightLeft'], stringId, horizontal, current.withinX(linear2));
                                                }
                                            }
                                        }
                                    }
                                    if (stringId === 'parent') {
                                        if (alignParent || current.top === 0) {
                                            if (linear1.top <= linear2.top || withinFraction(linear1.top, linear2.top)) {
                                                current.anchor(layoutMap['top'], 'parent', AXIS_ANDROID.VERTICAL);
                                                current.constraint.topParent = true;
                                            }
                                        }
                                        if (alignParent || current.bottom === 0) {
                                            if (linear1.bottom >= linear2.bottom || withinFraction(linear1.bottom, linear2.bottom) || ((current.floating || (flex.direction === 'column' && flex.wrap !== 'nowrap')) && withinRange(linear1.bottom, linear2.bottom, (current.pageflow ? SETTINGS.whitespaceHorizontalOffset : 0)))) {
                                                if (current.pageflow || (!current.pageflow && node.viewHeight === 0) || (current.top === null && convertInt(current.bottom) >= 0)) {
                                                    current.anchor(layoutMap['bottom'], 'parent', (node.viewHeight > 0 || adjusted.vertical ? AXIS_ANDROID.VERTICAL : ''));
                                                    current.constraint.bottomParent = true;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        const topParent = mapParent(current, 'top');
                                        const bottomParent = mapParent(current, 'bottom');
                                        const verticalOffset = (alignContent ? SETTINGS.whitespaceVerticalOffset : 0);
                                        if (withinRange(linear1.top, linear2.bottom, verticalOffset)) {
                                            if (intersectY || !bottomParent) {
                                                current.anchor(layoutMap['topBottom'], stringId, vertical, intersectY);
                                            }
                                        }
                                        else if (withinRange(linear1.bottom, linear2.top, verticalOffset)) {
                                            if (intersectY || !topParent) {
                                                current.anchor(layoutMap['bottomTop'], stringId, vertical, intersectY);
                                            }
                                        }
                                        if (current.pageflow === adjacent.pageflow) {
                                            if (linear1.top === linear2.top && !topParent && !bottomParent) {
                                                current.anchor(layoutMap['top'], stringId, vertical);
                                            }
                                            if (linear1.bottom === linear2.bottom && !topParent && !bottomParent) {
                                                current.anchor(layoutMap['bottom'], stringId, vertical);
                                            }
                                        }
                                    }
                                }
                                else if (relative) {
                                    if (current === node) {
                                        return;
                                    }
                                    else if (adjacent === node) {
                                        if (current.linear.left <= node.box.left || withinFraction(current.linear.left, node.box.left)) {
                                            current.anchor(relativeParent['left'], 'true', AXIS_ANDROID.HORIZONTAL);
                                            current.constraint.parentLeft = true;
                                        }
                                        else if (current.linear.right >= node.box.right || withinFraction(current.linear.right, node.box.right)) {
                                            current.anchor(relativeParent['right'], 'true', AXIS_ANDROID.HORIZONTAL);
                                            current.constraint.parentRight = true;
                                        }
                                        if (current.linear.top <= node.box.top || withinFraction(current.linear.top, node.box.top)) {
                                            current.anchor(relativeParent['top'], 'true', AXIS_ANDROID.VERTICAL);
                                            current.constraint.topParent = true;
                                        }
                                        else if ((current.linear.bottom >= node.box.bottom || withinFraction(current.linear.bottom, node.box.bottom) || ((current.floating || (flex.direction === 'column' && flex.wrap !== 'nowrap')) && withinRange(current.linear.bottom, node.box.bottom, SETTINGS.whitespaceHorizontalOffset)))) {
                                            current.anchor(relativeParent['bottom'], 'true', AXIS_ANDROID.VERTICAL);
                                            current.constraint.bottomParent = true;
                                        }
                                    }
                                    else {
                                        if (current.css('width') != null && current.styleMap.marginRight === 'auto' && current.styleMap.marginLeft === 'auto') {
                                            current.android('layout_centerHorizontal', 'true');
                                            current.constraint.horizontal = true;
                                        }
                                        else {
                                            if ((linear1.top === linear2.top || linear1.bottom === linear2.bottom) && withinRange(linear1.left, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                                if (current.float === 'right') {
                                                    adjacent.anchor(layoutMap['rightLeft'], current.stringId, horizontal);
                                                }
                                                else {
                                                    current.anchor(layoutMap['leftRight'], stringId, horizontal);
                                                    if (adjacent.constraint.horizontal) {
                                                        current.delete('android', relativeParent['right']);
                                                    }
                                                }
                                            }
                                        }
                                        if (withinRange(linear1.top, linear2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                            current.anchor(layoutMap['topBottom'], stringId, vertical, intersectY);
                                            if (adjacent.constraint.vertical) {
                                                current.delete('android', relativeParent['bottom']);
                                            }
                                        }
                                        else if (withinRange(linear1.bottom, linear2.top, SETTINGS.whitespaceVerticalOffset)) {
                                            if (!mapParent(current, 'top')) {
                                                current.anchor(layoutMap['bottomTop'], stringId, vertical, intersectY);
                                            }
                                        }
                                        if (adjacent.constraint.horizontal) {
                                            if (linear1.bottom === linear2.bottom) {
                                                if (!linearX && (!current.floating && !current.constraint.vertical)) {
                                                    current.anchor(layoutMap['bottom'], stringId, vertical);
                                                    if (adjacent.constraint.vertical) {
                                                        current.delete('android', relativeParent['bottom']);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                        if (!current.pageflow) {
                            if (current.top === 0) {
                                mapParent(current, 'top');
                                current.constraint.vertical = true;
                            }
                            if (current.right === 0) {
                                mapParent(current, 'right');
                                current.constraint.horizontal = true;
                            }
                            if (current.bottom === 0) {
                                mapParent(current, 'bottom');
                                current.constraint.vertical = true;
                            }
                            if (current.left === 0) {
                                mapParent(current, 'left');
                                current.constraint.horizontal = true;
                            }
                            if (current.left === 0 && current.right === 0) {
                                if (!current.floating) {
                                    current.android('layout_width', 'match_parent');
                                }
                            }
                            if (current.top === 0 && current.bottom === 0) {
                                current.android('layout_height', 'match_parent');
                            }
                        }
                    });
                    nodes.list.shift();
                    nodes.list.forEach(current => {
                        const leftRight = current.anchor(layoutMap['leftRight']);
                        if (leftRight != null) {
                            if (!current.constraint.horizontal) {
                                current.constraint.horizontal = flex.enabled || resolveAnchor(current, AXIS_ANDROID.HORIZONTAL);
                            }
                            current.constraint.marginHorizontal = leftRight;
                        }
                        const topBottom = current.anchor(layoutMap['topBottom']);
                        if (topBottom != null) {
                            if (!current.constraint.vertical) {
                                current.constraint.vertical = flex.enabled || resolveAnchor(current, AXIS_ANDROID.VERTICAL);
                            }
                            current.constraint.marginVertical = topBottom;
                            mapDelete(current, 'top');
                        }
                        if (constraint) {
                            if (mapParent(current, 'left') && mapParent(current, 'right')) {
                                const textAlign = current.css('textAlign');
                                switch (textAlign) {
                                    case 'left':
                                    case 'start' :
                                        mapDelete(current, 'right');
                                        break;
                                    case 'right':
                                    case 'end' :
                                        mapDelete(current, 'left');
                                        break;
                                }
                                if (current.floating) {
                                    mapDelete(current, (current.float === 'right' ? 'left' : 'right'));
                                }
                                current.android('layout_width', 'match_parent');
                            }
                            if (current.app(layoutMap['bottomTop']) != null) {
                                mapDelete(current, 'bottom');
                            }
                        }
                        else {
                            if (current.android(layoutMap['topBottom'])) {
                                mapDelete(current, 'bottomTop');
                            }
                        }
                    });
                    for (let i = 0; i < pageflow.length; i++) {
                        const current = pageflow.list[i];
                        if (!current.anchored) {
                            const result = (constraint ? search(current.get('app'), '*constraint*') : search(current.get('android'), layoutMap));
                            for (const [key, value] of result) {
                                if (value !== 'parent' && pageflow.anchors.find(item => item.stringId === value) != null) {
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
                    if (flex.enabled || (SETTINGS.useConstraintChain && constraint && pageflow.length > 1 && !pageflow.intersect())) {
                        let flexbox: Null<any[]> = null;
                        if (flex.enabled) {
                            if (flex.wrap === 'nowrap') {
                                let horizontalChain = pageflow.list.slice();
                                let verticalChain = pageflow.list.slice();
                                switch (flex.direction) {
                                    case 'row-reverse':
                                        horizontalChain.reverse();
                                    case 'row':
                                        verticalChain = [];
                                        break;
                                    case 'column-reverse':
                                        verticalChain.reverse();
                                    case 'column':
                                        horizontalChain = [];
                                        break;
                                }
                                flexbox = [{ constraint: { horizontalChain: new ViewList(horizontalChain), verticalChain: new ViewList(verticalChain) } }];
                            }
                            else {
                                const sorted = pageflow.list.slice();
                                switch (flex.direction) {
                                    case 'row-reverse':
                                    case 'column-reverse':
                                    sorted.reverse();
                                }
                                const map: ObjectIndex<T[]> = {};
                                const levels: number[] = [];
                                sorted.forEach(item => {
                                    const y = item.linear.top;
                                    if (map[y] == null) {
                                        map[y] = [];
                                        levels.push(y);
                                    }
                                    map[y].push(item);
                                });
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
                                flexbox = [];
                                for (const n of levels) {
                                    flexbox.push({ constraint: { horizontalChain: new ViewList(map[n]), verticalChain: new ViewList() } });
                                }
                            }
                        }
                        else {
                            const horizontal = pageflow.list.filter(current => !current.constraint.horizontal);
                            const vertical = pageflow.list.filter(current => !current.constraint.vertical);
                            pageflow.list.some(current => {
                                let horizontalChain: T[] = [];
                                let verticalChain: T[] = [];
                                if (horizontal.length > 0) {
                                    horizontalChain = this.partitionChain(node, current, pageflow.list, AXIS_ANDROID.HORIZONTAL);
                                    current.constraint.horizontalChain = new ViewList(sortAsc(horizontalChain, 'linear.left'));
                                }
                                if (vertical.length > 0) {
                                    verticalChain = this.partitionChain(node, current, pageflow.list, AXIS_ANDROID.VERTICAL);
                                    current.constraint.verticalChain = new ViewList(sortAsc(verticalChain, 'linear.top'));
                                }
                                return (horizontalChain.length === pageflow.length || verticalChain.length === pageflow.length);
                            });
                        }
                        const direction = CHAIN_MAP.direction.slice();
                        if (verticalPerspective) {
                            direction.reverse();
                        }
                        direction.forEach((value, index) => {
                            const connected = (flex.enabled ? flexbox : pageflow.slice().list.sort((a, b) => (a.constraint[value] != null ? a.constraint[value].length : 0) >= (b.constraint[value] != null ? b.constraint[value].length : 0) ? -1 : 1));
                            if (connected != null) {
                                if (verticalPerspective) {
                                    index = (index === 0 ? 1 : 0);
                                }
                                const inverse = (index === 0 ? 1 : 0);
                                connected.filter(current => current.constraint[value]).forEach((current, level) => {
                                    const chainable: U = current.constraint[value];
                                    if (chainable.length > (flex.enabled ? 0 : 1)) {
                                        chainable.parent = node;
                                        if (flex.enabled && chainable.list.some(item => item.flex.order > 0)) {
                                            chainable[(flex.direction.indexOf('reverse') !== -1 ? 'sortDesc' : 'sortAsc')]('flex.order');
                                        }
                                        const [HV, VH] = [CHAIN_MAP['horizontalVertical'][index], CHAIN_MAP['horizontalVertical'][inverse]];
                                        const [LT, TL] = [CHAIN_MAP['leftTop'][index], CHAIN_MAP['leftTop'][inverse]];
                                        const [RB, BR] = [CHAIN_MAP['rightBottom'][index], CHAIN_MAP['rightBottom'][inverse]];
                                        const [WH, HW] = [CHAIN_MAP['widthHeight'][index], CHAIN_MAP['widthHeight'][inverse]];
                                        const orientation = HV.toLowerCase();
                                        const orientationInverse = VH.toLowerCase();
                                        const dimension = WH.toLowerCase();
                                        const first = chainable.first;
                                        const last = chainable.last;
                                        let maxOffset = -1;
                                        let disconnected = false;
                                        let deleteMarginFlex = false;
                                        const attrs = (index === 0 ? [AXIS_ANDROID.HORIZONTAL, 'left', 'leftRight', 'top', AXIS_ANDROID.VERTICAL, 'viewWidth', 'right', 'marginHorizontal'] : [AXIS_ANDROID.VERTICAL, 'top', 'topBottom', 'left', AXIS_ANDROID.HORIZONTAL, 'viewHeight', 'bottom', 'marginVertical']);
                                        for (let i = 0; i < chainable.length; i++) {
                                            if (i === 0) {
                                                if (!mapParent(first, attrs[1])) {
                                                    disconnected = true;
                                                    break;
                                                }
                                            }
                                            else {
                                                if (chainable.list[i].app(layoutMap[attrs[2]]) == null) {
                                                    disconnected = true;
                                                    break;
                                                }
                                            }
                                        }
                                        if (!disconnected) {
                                            if (chainable.list.every(item => same(first, item, `linear.${attrs[3]}`))) {
                                                for (let j = 1; j < chainable.length; j++) {
                                                    const adjacent = chainable.list[j];
                                                    if (!adjacent.constraint[attrs[4]]) {
                                                        adjacent.app(layoutMap[attrs[3]], first.stringId);
                                                        adjacent.constraint[attrs[4]] = true;
                                                    }
                                                }
                                            }
                                            if (!flex.enabled && node[attrs[5]] === 0) {
                                                mapDelete(last, attrs[6]);
                                                last.constraint[attrs[7]] = last.app(layoutMap[attrs[2]]);
                                            }
                                        }
                                        first.app(layoutMap[LT], 'parent');
                                        last.app(layoutMap[RB], 'parent');
                                        if (verticalPerspective) {
                                            if (first.app(layoutMap['leftRight']) != null) {
                                                if (!mapParent(first, 'left')) {
                                                    mapDelete(first, 'left');
                                                }
                                            }
                                            if (first.app(layoutMap['rightLeft']) != null) {
                                                mapDelete(first, 'right');
                                            }
                                        }
                                        for (let i = 0; i < chainable.length; i++) {
                                            const chain = chainable.list[i];
                                            const next = chainable.list[i + 1];
                                            const previous = chainable.list[i - 1];
                                            if (flex.enabled) {
                                                if (chain.linear[TL] === node.box[TL] && chain.linear[BR] === node.box[BR]) {
                                                    this.setAlignParent(chain, orientationInverse);
                                                }
                                                const nextLevel = connected[level + 1];
                                                if (nextLevel && nextLevel.constraint[value] && nextLevel.constraint[value].list[i] != null) {
                                                    const nextChain = nextLevel.constraint[value].list[i];
                                                    if (chain.withinY(nextChain.linear)) {
                                                        chain.anchor(layoutMap['bottomTop'], nextChain.stringId);
                                                        if (!mapParent(chain, 'bottom')) {
                                                            mapDelete(chain, 'bottom');
                                                        }
                                                    }
                                                }
                                            }
                                            else {
                                                if (verticalPerspective) {
                                                    if (mapParent(chain, 'right') && chain.app(layoutMap['leftRight']) != null) {
                                                        mapDelete(chain, 'right');
                                                    }
                                                    if (chain !== first) {
                                                        if (chain.app(layoutMap['left']) != null || chain.app(layoutMap['right']) != null) {
                                                            mapDelete(chain, 'leftRight', 'rightLeft');
                                                            delete chain.constraint.marginHorizontal;
                                                        }
                                                    }
                                                }
                                            }
                                            if (next != null) {
                                                chain.app(layoutMap[CHAIN_MAP['rightLeftBottomTop'][index]], next.stringId);
                                                maxOffset = Math.max(<number> next.linear[LT] - <number> chain.linear[RB], maxOffset);
                                            }
                                            if (previous != null) {
                                                chain.app(layoutMap[CHAIN_MAP['leftRightTopBottom'][index]], previous.stringId);
                                                chain.constraint[`margin${HV}`] = previous.stringId;
                                            }
                                            chain.constraint[orientation] = true;
                                            chain.constraint[`chain${HV}`] = true;
                                            if (!chain.isSet('styleMap', dimension)) {
                                                const minW = chain.styleMap[`min${WH}`];
                                                const minH = chain.styleMap[`min${HW}`];
                                                const maxW = chain.styleMap[`max${WH}`];
                                                const maxH = chain.styleMap[`max${HW}`];
                                                if (hasValue(minW)) {
                                                    chain.app(`layout_constraint${WH}_min`, convertPX(minW));
                                                    chain.constraint[`min${WH}`] = true;
                                                }
                                                if (hasValue(maxW)) {
                                                    chain.app(`layout_constraint${WH}_max`, convertPX(maxW));
                                                    chain.constraint[`max${WH}`] = true;
                                                }
                                                if (hasValue(minH)) {
                                                    chain.app(`layout_constraint${HW}_min`, convertPX(minH));
                                                    chain.constraint[`min${HW}`] = true;
                                                }
                                                if (hasValue(maxH)) {
                                                    chain.app(`layout_constraint${HW}_max`, convertPX(maxH));
                                                    chain.constraint[`max${HW}`] = true;
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
                                                        chain.app(layoutMap[TL], 'parent');
                                                        chain.constraint[orientationInverse] = true;
                                                        break;
                                                    case 'flex-end':
                                                        chain.app(layoutMap[BR], 'parent');
                                                        chain.constraint[orientationInverse] = true;
                                                        break;
                                                    case 'baseline':
                                                        const valid = chainable.list.some(adjacent => {
                                                            if (adjacent !== chain && adjacent.nodeType <= NODE_STANDARD.TEXT) {
                                                                chain.app(layoutMap['baseline'], adjacent.stringId);
                                                                return true;
                                                            }
                                                            return false;
                                                        });
                                                        if (valid) {
                                                            mapDelete(chain, 'top', 'bottom');
                                                            chainable.list.forEach(item => {
                                                                if (item.app(layoutMap['top']) === chain.stringId) {
                                                                    mapDelete(item, 'top');
                                                                }
                                                                if (item.app(layoutMap['bottom']) === chain.stringId) {
                                                                    mapDelete(item, 'bottom');
                                                                }
                                                            });
                                                            chain.constraint.vertical = true;
                                                        }
                                                        break;
                                                    case 'center':
                                                    case 'stretch':
                                                        if (chain.flex.alignSelf !== 'center') {
                                                            chain.android(`layout_${HW.toLowerCase()}`, '0px');
                                                        }
                                                        this.setAlignParent(chain, orientationInverse);
                                                        break;
                                                }
                                                if (chain.flex.basis !== 'auto') {
                                                    if (/(100|[1-9][0-9]?)%/.test(chain.flex.basis)) {
                                                        chain.app(`layout_constraint${WH}_percent`, chain.flex.basis);
                                                    }
                                                    else {
                                                        const width = convertPX(chain.flex.basis);
                                                        if (width !== '0px') {
                                                            chain.app(`layout_constraintWidth_min`, width);
                                                            delete chain.styleMap.minWidth;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        const chainStyle = `layout_constraint${HV}_chainStyle`;
                                        if (flex.enabled && flex.justifyContent !== 'normal' && Math.max.apply(null, chainable.list.map(item => item.flex.grow)) === 0) {
                                            switch (flex.justifyContent) {
                                                case 'space-between':
                                                    first.app(chainStyle, 'spread_inside');
                                                    break;
                                                case 'space-evenly':
                                                    first.app(chainStyle, 'spread');
                                                    chainable.list.forEach(item => item.app(`layout_constraint${HV}_weight`, (item.flex.grow || 1).toString()));
                                                    break;
                                                case 'space-around':
                                                    first.app(`layout_constraint${HV}_chainStyle`, 'spread_inside');
                                                    first.constraint[orientation] = false;
                                                    last.constraint[orientation] = false;
                                                    this.addGuideline(node, first, orientation, false, true);
                                                    this.addGuideline(node, last, orientation, true, true);
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
                                            }
                                            deleteMarginFlex = true;
                                        }
                                        else {
                                            const alignLeft = withinFraction(node.box.left, first.linear.left);
                                            const alignRight = withinFraction(last.linear.right, node.box.right);
                                            const alignTop = withinFraction(node.box.top, first.linear.top);
                                            const alignBottom = withinFraction(last.linear.bottom, node.box.bottom);
                                            if ((orientation === AXIS_ANDROID.HORIZONTAL && alignLeft && alignRight) || (orientation === AXIS_ANDROID.VERTICAL && alignTop && alignBottom)) {
                                                if (chainable.length > 2 || flex.enabled) {
                                                    if (!flex.enabled && (node.inline || node.floating)) {
                                                        first.app(chainStyle, 'packed');
                                                        first.app(`layout_constraint${HV}_bias`, (index === 0 && node.float === 'right' ? '1' : '0'));
                                                    }
                                                    else {
                                                        first.app(chainStyle, 'spread_inside');
                                                        deleteMarginFlex = true;
                                                    }
                                                }
                                                else if (maxOffset > SETTINGS[`chainPacked${HV}Offset`]) {
                                                    if (mapParent(first, LT)) {
                                                        mapDelete(first, CHAIN_MAP['rightLeftBottomTop'][index]);
                                                    }
                                                    if (mapParent(last, RB)) {
                                                        mapDelete(last, CHAIN_MAP['leftRightTopBottom'][index]);
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
                                                deleteMarginFlex = true;
                                            }
                                            if (!flex.enabled) {
                                                (index === 0 ? [[TL, BR], [BR, TL]] : [[LT, RB], [RB, LT]]).forEach(opposing => {
                                                    if (chainable.list.every(upper => same(first, upper, `linear.${opposing[0]}`) && chainable.list.some(lower => !same(first, lower, `linear.${opposing[1]}`)))) {
                                                        chainable.list.forEach(chain => mapDelete(chain, opposing[1]));
                                                    }
                                                });
                                                chainable.list.forEach(inner => {
                                                    pageflow.list.forEach(outer => {
                                                        const horizontal: U = outer.constraint.horizontalChain;
                                                        const vertical: U = outer.constraint.verticalChain;
                                                        if (horizontal && horizontal.length > 0 && horizontal.find(inner.id) != null) {
                                                            horizontal.clear();
                                                        }
                                                        if (vertical && vertical.length > 0 && vertical.find(inner.id) != null) {
                                                            vertical.clear();
                                                        }
                                                    });
                                                });
                                            }
                                            else {
                                                deleteMarginFlex = true;
                                            }
                                        }
                                        if (deleteMarginFlex) {
                                            chainable.list.forEach(item => {
                                                delete item.constraint.marginHorizontal;
                                                delete item.constraint.marginVertical;
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                    nodes.list.forEach(current => {
                        if (!current.constraint.horizontal) {
                            current.constraint.horizontal = resolveAnchor(current, AXIS_ANDROID.HORIZONTAL);
                        }
                        if (!current.constraint.vertical) {
                            current.constraint.vertical = resolveAnchor(current, AXIS_ANDROID.VERTICAL);
                        }
                    });
                    if (flex.enabled) {
                        if (flex.wrap !== 'nowrap') {
                            ['topBottom', 'bottomTop'].forEach((value, index) => {
                                pageflow.list.forEach(current => {
                                    if (mapParent(current, (index === 0 ? 'bottom' : 'top'))) {
                                        const chain: T[] = [current];
                                        let valid = false;
                                        let adjacent: Null<T> = current;
                                        while (adjacent != null) {
                                            const topBottom = (<string> adjacent.app(layoutMap[value]));
                                            if (topBottom != null) {
                                                adjacent = (<T> nodes.findByNodeId(stripId(topBottom)));
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
                                            chain.forEach(item => {
                                                pageflow.list.some(next => {
                                                    if (item !== next && next.linear.top === item.linear.top && next.linear.bottom === item.linear.bottom) {
                                                        mapDelete(item, 'topBottom', 'bottomTop');
                                                        item.app(layoutMap['top'], next.stringId);
                                                        item.app(layoutMap['bottom'], next.stringId);
                                                        return true;
                                                    }
                                                    return false;
                                                });
                                            });
                                        }
                                    }
                                });
                            });
                        }
                    }
                    else {
                        function deleteConstraints(item: T, stringId = '') {
                            const obj = (constraint ? 'app' : 'android');
                            for (const attr in layoutMap) {
                                const value = item[obj](layoutMap[attr]);
                                if (value !== 'parent' && (stringId === '' || value === stringId)) {
                                    item.delete(obj, layoutMap[attr]);
                                }
                            }
                            item.constraint.horizontal = (mapParent(item, 'left') || mapParent(item, 'right'));
                            item.constraint.vertical = (mapParent(item, 'top') || mapParent(item, 'bottom'));
                        }
                        if (constraint) {
                            pageflow.list.forEach(current => {
                                [['top', 'bottom', 'topBottom'], ['bottom', 'top', 'bottomTop']].forEach(direction => {
                                    if (mapParent(current, direction[1]) && current.app(layoutMap[direction[2]]) == null) {
                                        ['leftRight', 'rightLeft'].forEach(value => {
                                            const stringId = current.app(layoutMap[value]);
                                            if (stringId != null) {
                                                const aligned = pageflow.list.find(item => item.stringId === stringId);
                                                if (aligned && aligned.app(layoutMap[direction[2]]) != null) {
                                                    if (withinFraction(current.linear[direction[0]], aligned.linear[direction[0]])) {
                                                        current.app(layoutMap[direction[0]], aligned.stringId, true);
                                                    }
                                                    if (withinFraction(current.linear[direction[1]], aligned.linear[direction[1]])) {
                                                        current.app(layoutMap[direction[1]], aligned.stringId, true);
                                                    }
                                                }
                                            }
                                        });
                                        current.constraint.vertical = true;
                                    }
                                });
                            });
                            const unbound = nodes.list.filter(current => !current.anchored && (mapParent(current, 'top') || mapParent(current, 'right') || mapParent(current, 'bottom') || mapParent(current, 'left')));
                            if (pageflow.anchors.length === 0 && unbound.length === 0) {
                                unbound.push(sortAsc(nodes.list.slice(), 'linear.left', 'linear.top')[0]);
                            }
                            unbound.forEach(current => {
                                if (SETTINGS.useConstraintGuideline) {
                                    this.addGuideline(node, current);
                                }
                                else {
                                    this.setAlignParent(current, '', true);
                                }
                            });
                            const adjacent = nodes.anchors[0];
                            nodes.list.filter(current => !current.anchored).forEach(opposite => {
                                deleteConstraints(opposite);
                                nodes.anchors.forEach(item => deleteConstraints(item, opposite.stringId));
                                if (withinRange(opposite.horizontalBias, 0.5, 0.01) && withinRange(opposite.verticalBias, 0.5, 0.01)) {
                                    this.setAlignParent(opposite);
                                }
                                else if (SETTINGS.useConstraintGuideline) {
                                    this.addGuideline(node, opposite);
                                }
                                else if (adjacent != null) {
                                    const center1: Point = opposite.center;
                                    const center2: Point = adjacent.center;
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
                                    opposite.app('layout_constraintCircle', adjacent.stringId);
                                    opposite.app('layout_constraintCircleRadius', formatDimen(`${opposite.tagName}`, 'constraintcircleradius', formatPX(radius)));
                                    opposite.app('layout_constraintCircleAngle', degrees.toString());
                                    opposite.constraint.horizontal = true;
                                    opposite.constraint.vertical = true;
                                }
                            });
                        }
                        else {
                            nodes.list.forEach(current => {
                                if (!current.anchored) {
                                    if (withinRange(current.horizontalBias, 0.5, 0.01) && withinRange(current.verticalBias, 0.5, 0.01)) {
                                        deleteConstraints(current);
                                        current.android('layout_centerInParent', 'true');
                                        return;
                                    }
                                    if (!current.constraint.horizontal) {
                                        current.constraint.horizontal = nodes.list.some(adjacent => {
                                            if (adjacent !== current && adjacent.constraint.horizontal) {
                                                if (current.linear.left === adjacent.linear.left) {
                                                    current.android(layoutMap['left'], adjacent.stringId);
                                                    return true;
                                                }
                                            }
                                            return false;
                                        });
                                        if (!current.constraint.horizontal) {
                                            const left = formatPX(Math.max(0, current.bounds.left - node.box.left));
                                            if (left !== '0px') {
                                                current.css(parseRTL('marginLeft'), left);
                                                current.android(parseRTL('layout_marginLeft'), left);
                                            }
                                            current.android(relativeParent['left'], 'true');
                                            current.constraint.horizontal = true;
                                        }
                                    }
                                    if (!current.constraint.vertical) {
                                        current.constraint.vertical = nodes.list.some(adjacent => {
                                            if (adjacent !== current && adjacent.constraint.vertical) {
                                                if (current.linear.top === adjacent.linear.top) {
                                                    current.android(layoutMap['top'], adjacent.stringId);
                                                    return true;
                                                }
                                            }
                                            return false;
                                        });
                                        if (!current.constraint.vertical) {
                                            const top = formatPX(Math.max(0, current.bounds.top - node.box.top));
                                            if (top !== '0px') {
                                                current.css('marginTop', top);
                                                current.android('layout_marginTop', top);
                                            }
                                            current.android(relativeParent['top'], 'true');
                                            current.constraint.vertical = true;
                                        }
                                    }
                                }
                            });
                        }
                        nodes.list.forEach(current => {
                            [['left', 'right', 'leftRight', 'Width', 'Horizontal'], ['top', 'bottom', 'topBottom', 'Height', 'Vertical']].forEach(value => {
                                const lower = mapParent(current, value[0]);
                                const upper = mapParent(current, value[1]);
                                if (!lower && upper) {
                                    if (current.anchor(layoutMap[value[2]]) == null) {
                                        if (node[`view${value[3]}`] === 0) {
                                            node.constraint[`layout${value[3]}`] = true;
                                        }
                                    }
                                    else {
                                        if (node[`view${value[3]}`] > 0 && !current.constraint[`chain${value[4]}`]) {
                                            mapDelete(current, value[1]);
                                        }
                                    }
                                }
                                else if (lower && upper) {
                                    if (current.constraint[`parent${capitalize(value[0])}`] && current.constraint[`parent${capitalize(value[1])}`]) {
                                        current.android(`layout_${capitalize(value[3], false)}`, 'match_parent');
                                    }
                                }
                            });
                        });
                    }
                }
                pageflow.list.forEach(current => {
                    if (current.constraint.marginHorizontal != null) {
                        const item = this.findByStringId(current.constraint.marginHorizontal);
                        if (item != null) {
                            const offset = current.linear.left - item.linear.right;
                            if (offset >= 1) {
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + offset, true);
                            }
                        }
                    }
                    if (current.constraint.marginVertical != null) {
                        const item = this.findByStringId(current.constraint.marginVertical);
                        if (item != null) {
                            const offset = current.linear.top - item.linear.bottom;
                            if (offset >= 1) {
                                current.modifyBox(BOX_STANDARD.MARGIN_TOP, current.marginTop + offset, true);
                            }
                        }
                    }
                });
            }
        });
    }

    public renderGroup(node: T, parent: T, viewName: number | string, options?: ObjectMap<any>) {
        const target = (node.isSet('dataset', 'target') && !node.isSet('dataset', 'include'));
        let preXml = '';
        let postXml = '';
        let renderParent = parent;
        if (typeof viewName === 'number') {
            viewName = View.getViewName(viewName);
        }
        switch (viewName) {
            case NODE_ANDROID.LINEAR:
                options = { android: { orientation: (options && options.horizontal ? AXIS_ANDROID.HORIZONTAL : AXIS_ANDROID.VERTICAL) } };
                break;
            case NODE_ANDROID.GRID:
                options = { android: { columnCount: (options && options.columns ? options.columns.toString() : '2'), rowCount: (options && options.rows > 0 ? options.rows.toString() : '') } };
                break;
            default:
                options = {};
        }
        node.setNodeId(viewName);
        if (node.overflow !== OVERFLOW_ELEMENT.NONE) {
            const scrollView: string[] = [];
            if (node.overflowX) {
                scrollView.push(NODE_ANDROID.SCROLL_HORIZONTAL);
            }
            if (node.overflowY) {
                scrollView.push((node.ascend().some(item => item.overflow !== OVERFLOW_ELEMENT.NONE) ? NODE_ANDROID.SCROLL_NESTED : NODE_ANDROID.SCROLL_VERTICAL));
            }
            let current = node;
            let scrollDepth = parent.renderDepth + scrollView.length;
            scrollView
                .map(scrollName => {
                    const viewGroup = new ViewGroup(this.cache.nextId, current, null, [current]);
                    const view = (<View> viewGroup) as T;
                    viewGroup.setNodeId(scrollName);
                    viewGroup.setBounds();
                    current.inherit(viewGroup, 'data');
                    viewGroup.android('fadeScrollbars', 'false');
                    this.cache.list.push(view);
                    switch (scrollName) {
                        case NODE_ANDROID.SCROLL_HORIZONTAL:
                            viewGroup.css('width', node.styleMap.width);
                            viewGroup.css('minWidth', node.styleMap.minWidth);
                            viewGroup.css('maxWidth', node.styleMap.maxWidth);
                            viewGroup.css('overflowX', node.css('overflowX'));
                            break;
                        default:
                            viewGroup.css('height', node.styleMap.height);
                            viewGroup.css('minHeight', node.styleMap.minHeight);
                            viewGroup.css('maxHeight', node.styleMap.maxHeight);
                            viewGroup.css('overflowY', node.css('overflowY'));
                    }
                    const indent = repeat(scrollDepth--);
                    preXml = indent + `<${scrollName}{@${viewGroup.id}}>\n` + preXml;
                    postXml += indent + `</${scrollName}>\n`;
                    if (current === node) {
                        node.parent = view;
                        renderParent = view;
                    }
                    current = view;
                    return viewGroup;
                })
                .reverse()
                .forEach((item, index) => {
                    switch (index) {
                        case 0:
                            item.parent = parent;
                            item.render(parent);
                            break;
                        case 1:
                            item.parent = current;
                            item.render(current);
                            break;
                    }
                    current = <View> item as T;
                });
        }
        node.apply(options);
        node.render((target ? node : renderParent));
        return this.getEnclosingTag((target || parent.isSet('dataset', 'target') || (node.renderDepth === 0 && !node.documentRoot) ? -1 : node.renderDepth), viewName, node.id, `{:${node.id}}`, preXml, postXml);
    }

    public renderNode(node: T, parent: T, nodeName: number | string, recursive = false) {
        const target = (node.isSet('dataset', 'target') && !node.isSet('dataset', 'include'));
        if (typeof nodeName === 'number') {
            nodeName = View.getViewName(nodeName);
        }
        node.setNodeId(nodeName);
        const element: any = node.element;
        switch (element.tagName) {
            case 'IMG':
                if (isPercent(node.css('width')) || isPercent(node.css('height'))) {
                    node.android('scaleType', 'fitXY');
                }
                switch (node.css('objectFit')) {
                    case 'contain':
                        node.android('scaleType', 'centerInside');
                        break;
                    case 'cover':
                        node.android('scaleType', 'centerCrop');
                        break;
                    case 'fill':
                        node.android('scaleType', 'fitXY');
                        break;
                    case 'scale-down':
                        node.android('scaleType', 'fitCenter');
                        break;
                }
                if (node.viewWidth > 0 && (node.paddingLeft > 0 || node.paddingRight > 0)) {
                    node.css('width', formatPX(node.viewWidth + node.paddingLeft + node.paddingRight));
                }
                if (node.viewHeight > 0 && (node.paddingTop > 0 || node.paddingBottom > 0)) {
                    node.css('height', formatPX(node.viewHeight + node.paddingTop + node.paddingBottom));
                }
                if ((node.isSet('styleMap', 'width') && !node.isSet('styleMap', 'height')) || (!node.isSet('styleMap', 'width') && node.isSet('styleMap', 'height'))) {
                    node.android('adjustViewBounds', 'true');
                }
                break;
            case 'TEXTAREA':
                node.android('minLines', '2');
                if (element.rows > 2) {
                    node.android('maxLines', element.rows.toString());
                }
                if (element.maxLength > 0) {
                    node.android('maxLength', element.maxLength.toString());
                }
                node.android('hint', element.placeholder);
                node.android('scrollbars', AXIS_ANDROID.VERTICAL);
                node.android('inputType', 'textMultiLine');
                if (node.overflowX) {
                    node.android('scrollHorizontally', 'true');
                }
                break;
            case 'INPUT':
                switch (element.type) {
                    case 'radio':
                        if (!recursive) {
                            const result = (<T[]> parent.children.filter(item => (<HTMLInputElement> item.element).type === 'radio' && (<HTMLInputElement> item.element).name === element.name));
                            let xml = '';
                            if (result.length > 1) {
                                const viewGroup = this.createGroup(node, parent, result);
                                viewGroup.setNodeId(NODE_ANDROID.RADIO_GROUP);
                                viewGroup.render(parent);
                                let checked: string = '';
                                result.forEach(item => {
                                    if ((<HTMLInputElement> item.element).checked) {
                                        checked = item.stringId;
                                    }
                                    xml += this.renderNode(item, (<View> viewGroup) as T, NODE_STANDARD.RADIO, true);
                                });
                                viewGroup.android('orientation', NodeList.linearX(viewGroup.children) ? AXIS_ANDROID.HORIZONTAL : AXIS_ANDROID.VERTICAL);
                                if (checked !== '') {
                                    viewGroup.android('checkedButton', checked);
                                }
                                viewGroup.setBounds();
                                return this.getEnclosingTag(viewGroup.renderDepth, NODE_ANDROID.RADIO_GROUP, viewGroup.id, xml);
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
                break;
        }
        switch (node.nodeName) {
            case NODE_ANDROID.TEXT:
                if (node.overflow !== OVERFLOW_ELEMENT.NONE) {
                    const scrollbars: string[] = [];
                    if (node.overflowX) {
                        scrollbars.push(AXIS_ANDROID.HORIZONTAL);
                    }
                    if (node.overflowY) {
                        scrollbars.push(AXIS_ANDROID.VERTICAL);
                    }
                    node.android('scrollbars', scrollbars.join('|'));
                }
                if (node.multiLine) {
                    node.android('singleLine', 'true');
                }
                break;
            case NODE_ANDROID.LINE:
                if (node.viewHeight === 0) {
                    node.android('layout_height', formatPX((convertInt(node.css('borderWidth')) || 1) + 1));
                }
                break;
        }
        node.render((target ? node : parent));
        if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.ACCESSIBILITY)) {
            node.setAccessibility();
        }
        node.cascade().forEach(item => item.hide());
        return this.getEnclosingTag((target || parent.isSet('dataset', 'target') || (node.renderDepth === 0 && !node.documentRoot) ? -1 : node.renderDepth), node.nodeName, node.id);
    }

    public renderNodeStatic(tagName: number | string, depth: number, options: ObjectMap<any> = {}, width = '', height = '', node: Null<T> = null, children = false) {
        if (node == null) {
            node = (<T> new View(0, SETTINGS.targetAPI));
        }
        const renderDepth = Math.max(0, depth);
        const viewName = (typeof tagName === 'number' ? View.getViewName(tagName) : tagName);
        tagName = (node.hasElement ? node.tagName : viewName);
        switch (viewName) {
            case 'include':
            case 'merge':
            case 'menu':
                break;
            default:
                node.setNodeId(viewName);
        }
        if (hasValue(width)) {
            if (!isNaN(parseInt(width))) {
                width = formatDimen(tagName, 'width', width);
            }
            node.android('layout_width', width);
        }
        if (hasValue(height)) {
            if (!isNaN(parseInt(height))) {
                height = formatDimen(tagName, 'height', height);
            }
            node.android('layout_height', height);
        }
        node.renderDepth = renderDepth;
        if (options != null) {
            node.apply(formatResource(options));
        }
        let output = this.getEnclosingTag((depth === 0 && !node.documentRoot ? -1 : depth), viewName, node.id, (children ? `{:${node.id}}` : ''));
        if (SETTINGS.showAttributes && node.id === 0) {
            const indent = repeat(renderDepth + 1);
            const attrs = node.combine().map(value => `\n${indent + value}`).join('');
            output = output.replace(`{@${node.id}}`, attrs);
        }
        options.stringId = node.stringId;
        return output;
    }

    public renderInclude(node: T, parent: T, name: string) {
        this.merge[name] = (node.dataset.includeMerge === 'true');
        node.documentRoot = !this.merge[name];
        return this.renderNodeStatic('include', parent.renderDepth + 1, { layout: `@layout/${name}` });
    }

    public renderIncludeContent(name: string, content: string[]) {
        let xml = content.join('');
        if (this.merge[name]) {
            const node = new View(0, 0);
            node.documentRoot = true;
            xml = this.renderNodeStatic('merge', 0, {}, '', '', <T> node, true).replace('{:0}', xml);
        }
        return xml;
    }

    public getIncludeRenderDepth(name: string) {
        return (this.merge[name] ? 0 : -1);
    }

    public createGroup(node: T, parent: T, children: T[]) {
        const group = new ViewGroup(this.cache.nextId, node, parent, children);
        children.forEach(item => {
            item.parent = group;
            item.inherit(group, 'data');
        });
        group.setBounds();
        parent.children = parent.children.filter((item: T) => !children.includes(item));
        parent.children.push(group);
        this.cache.list.push(<View> group as T);
        return (<View> group as T);
    }

    public setAttributes(data: ViewData<T>) {
        const cache: StringMap[] = data.cache.filter(node => node.visible).map(node => ({ pattern: `{@${node.id}}`, attributes: this.parseAttributes(node) }));
        [...data.views, ...data.includes].forEach(value => {
            cache.forEach(item => value.content = value.content.replace(item.pattern, item.attributes));
            value.content = value.content.replace(`{#0}`, this.getRootNamespace(value.content));
        });
    }

    public insertAttributes(output: string, node: T) {
        return output.replace(`{@${node.id}}`, this.parseAttributes(node));
    }

    public setDimensions(data: ViewData<T>) {
        function addToGroup(tagName: string, node: T, dimen: string, attr?: string, value?: string) {
            const group: ObjectMap<T[]> = groups[tagName];
            let name = dimen;
            if (arguments.length === 5) {
                if (value && /(px|dp|sp)$/.test(value)) {
                    name = `${dimen}-${attr}-${value}`;
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
        data.cache.filter(node => node.visible).forEach(node => {
            node.mergeBoxSpacing();
            if (SETTINGS.dimensResourceValue) {
                const tagName = node.tagName.toLowerCase();
                if (groups[tagName] == null) {
                    groups[tagName] = {};
                }
                for (const key of Object.keys(BOX_STANDARD)) {
                    const result = node.boxValue(parseInt(key));
                    if (result[0] !== '' && result[1] !== '0px') {
                        const name = `${BOX_STANDARD[key].toLowerCase()}-${result[0]}-${result[1]}`;
                        addToGroup(tagName, node, name);
                    }
                }
                ['android:layout_width:width',
                 'android:layout_height:height',
                 'android:minWidth:minwidth',
                 'android:minHeight:minheight',
                 'app:layout_constraintWidth_min:constraintwidth_min',
                 'app:layout_constraintHeight_min:constraintheight_min'].forEach(value => {
                    const [obj, attr, dimen] = value.split(':');
                    addToGroup(tagName, node, dimen, attr, <string> node[obj](attr));
                });
            }
        });
        if (SETTINGS.dimensResourceValue) {
            const resource = (<Map<string, string>> Resource.STORED.DIMENS);
            for (const tagName in groups) {
                const group: ObjectMap<T[]> = groups[tagName];
                for (const name in group) {
                    const [dimen, attr, value] = name.split('-');
                    const key = this.getDimenResourceKey(resource, `${tagName}_${parseRTL(dimen)}`, value);
                    group[name].forEach(node => node[(attr.indexOf('constraint') !== -1 ? 'app' : 'android')](attr, `@dimen/${key}`));
                    resource.set(key, value);
                }
            }
        }
    }

    public parseDimensions(content: string) {
        const resource = (<Map<string, string>> Resource.STORED.DIMENS);
        const pattern = /\s+\w+:\w+="({%(\w+)-(\w+)-(\w+)})"/g;
        let match: Null<RegExpExecArray>;
        while ((match = pattern.exec(content)) != null) {
            const key = this.getDimenResourceKey(resource, `${match[2]}_${parseRTL(match[3])}`, match[4]);
            resource.set(key, match[4]);
            content = content.replace(new RegExp(match[1], 'g'), `@dimen/${key}`);
        }
        return content;
    }

    public addXmlNs(name: string, uri: string) {
        XMLNS_ANDROID[name] = uri;
    }

    private parseAttributes(node: T) {
        if (node.dir === 'rtl') {
            switch (node.nodeName) {
                case NODE_ANDROID.CHECKBOX:
                case NODE_ANDROID.RADIO:
                    node.android('layoutDirection', 'rtl');
                    break;
                default:
                    if (node.renderChildren.length === 0) {
                        node.android('textDirection', 'rtl');
                    }
            }
        }
        for (const name in node.dataset) {
            if (/^attr[A-Z]+/.test(name)) {
                const obj = capitalize(name.substring(4), false);
                (<string> node.dataset[name]).split(';').forEach(values => {
                    const [key, value] = values.split('::');
                    if (hasValue(key) && hasValue(value)) {
                        node.add(obj, key, value);
                    }
                });
            }
        }
        const indent = repeat(node.renderDepth + 1);
        const output = node.combine().map((value: string) => `\n${indent + value}`).join('');
        return output;
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

    private getDimenResourceKey(resource: Map<string, string>, key: string, value: string) {
        if (resource.has(key) && resource.get(key) !== value) {
            key = generateId('dimens', `${key}_1`);
        }
        return key;
    }

    private setAlignParent(node: T, orientation = '', bias = false) {
        const map = LAYOUT_MAP.constraint;
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

    private partitionChain(parent: T, node: T, nodes: T[], orientation: string) {
        const map = LAYOUT_MAP.constraint;
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
        const result = coordinate.map(value => {
            const sameXY = sortAsc(nodes.filter(item => same(node, item, value)), coordinate[0]);
            if (sameXY.length > 1) {
                if (orientation === AXIS_ANDROID.HORIZONTAL && convertInt(parent.css('columnCount')) === sameXY.length) {
                    const marginLeft = convertInt(parent.css('columnGap'));
                    if (marginLeft > 0) {
                        for (let i = 1; i < sameXY.length; i++) {
                            sameXY[i].android(`layout_${parseRTL('marginLeft')}`, formatPX(sameXY[i].marginLeft + marginLeft));
                        }
                    }
                    return sameXY;
                }
                else if (!sameXY.some(item => item.floating) && sameXY[0].app(mapParent[0]) === 'parent' && sameXY[sameXY.length - 1].app(mapParent[1]) === 'parent') {
                    return sameXY;
                }
                else {
                    const chained: Set<T> = new Set([node]);
                    let valid;
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
        }).reduce((a, b) => a.length >= b.length ? a : b);
        return result;
    }

    private addGuideline(parent: T, node: T, orientation = '', opposite?: boolean, percent?: boolean) {
        const map = LAYOUT_MAP.constraint;
        if (node.pageflow) {
            if (opposite == null) {
                opposite = (node.float === 'right' || (node.left == null && node.right != null) || (node.is(NODE_STANDARD.TEXT) && node.css('textAlign') === 'right') || (node.app(LAYOUT_MAP.constraint['right']) === 'parent' && node.children.some(item => item.float === 'right')));
            }
            if (percent == null && opposite === true) {
                percent = true;
            }
        }
        const beginPercent = `layout_constraintGuide_${(percent ? 'percent' : 'begin')}`;
        [AXIS_ANDROID.HORIZONTAL, AXIS_ANDROID.VERTICAL].forEach((value, index) => {
            if (!node.constraint[value] && (orientation === '' || value === orientation)) {
                const LRTB = (index === 0 ? (!opposite ? 'left' : 'right') : (!opposite ? 'top' : 'bottom'));
                const RLBT = (index === 0 ? (!opposite ? 'right' : 'left') : (!opposite ? 'bottom' : 'top'));
                const position = (percent ? Math.abs(node.linear[LRTB] - parent.box[LRTB]) / parent.box[(index === 0 ? 'width' : 'height')] : 0);
                const options = {
                    android: {
                        orientation: (index === 0 ? AXIS_ANDROID.VERTICAL : AXIS_ANDROID.HORIZONTAL)
                    },
                    app: {
                        [beginPercent]: (percent ? parseFloat(Math.abs(position - (!opposite ? 0 : 1)).toFixed(SETTINGS.constraintPercentAccuracy))
                                                 : formatDimen(node.tagName, 'constraintguide_begin', formatPX((opposite ? node.linear[LRTB] - parent.box[RLBT] : node.linear[LRTB] - parent.box[LRTB]))))
                    }
                };
                const xml = this.renderNodeStatic(NODE_ANDROID.GUIDELINE, node.renderDepth, options, 'wrap_content', 'wrap_content');
                this.appendAfter(node.id, xml);
                node.app(map[LRTB], (<any> options).stringId);
                node.delete('app', map[RLBT]);
                node.constraint[value] = true;
            }
        });
    }

    private findByStringId(id: string) {
        return this.cache.list.find(node => node.stringId === id);
    }

    get supportInline() {
        return WEBVIEW_ANDROID;
    }

    get supportInclude() {
        return true;
    }
}