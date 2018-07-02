import { ClientRect, Null, ObjectMap, Point, StringMap } from '../lib/types';
import Controller from '../base/controller';
import NodeList from '../base/nodelist';
import View from './view';
import ViewGroup from './viewgroup';
import ViewList from './viewlist';
import { convertPX, formatPX, hasValue, indexOf, padLeft, same, search, sortAsc, withinFraction, withinRange } from '../lib/util';
import { getBoxSpacing } from '../lib/dom';
import parseRTL from './localization';
import SETTINGS from '../settings';
import { BOX_STANDARD, OVERFLOW_CHROME, VIEW_STANDARD } from '../lib/constants';
import { VIEW_ANDROID, XMLNS_ANDROID } from './constants';

const LAYOUT_MAP = {
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
    constructor() {
        super();
    }

    public setConstraints() {
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
            const nodes = (<U> new ViewList(node.renderChildren, node));
            const constraint = node.is(VIEW_STANDARD.CONSTRAINT);
            const relative = node.is(VIEW_STANDARD.RELATIVE);
            const flex = node.flex;
            if (nodes.list.length > 0 && (constraint || relative || flex.enabled)) {
                node.expandDimensions();
                if (node.is(VIEW_STANDARD.LINEAR)) {
                    if (node.renderChildren.some(item => item.flex.direction.indexOf('row') !== -1)) {
                        node.constraint.layoutWidth = true;
                        node.constraint.expand = true;
                    }
                    if (node.renderChildren.some(item => item.flex.direction.indexOf('column') !== -1)) {
                        node.constraint.layoutHeight = true;
                        node.constraint.expand = true;
                    }
                    return;
                }
                const LAYOUT: StringMap = LAYOUT_MAP[(relative ? 'relative' : 'constraint')];
                const linearX = nodes.linearX;
                function mapParent(item: T, direction: string) {
                    return (item.app(LAYOUT[direction]) === 'parent');
                }
                function mapDelete(item: T, ...direction: string[]) {
                    for (const attr of direction) {
                        item.delete('app', LAYOUT[attr]);
                    }
                }
                if (relative || nodes.list.length === 1) {
                    nodes.list.forEach(current => {
                        if (withinRange(current.horizontalBias, 0.5, 0.01) && withinRange(current.verticalBias, 0.5, 0.01)) {
                            if (constraint) {
                                this.setAlignParent(current);
                            }
                            else {
                                current.android('layout_centerInParent', 'true');
                                current.constraint.horizontal = true;
                                current.constraint.vertical = true;
                            }
                            node.constraint.layoutWidth = true;
                            node.constraint.layoutHeight = true;
                        }
                    });
                }
                nodes.list.unshift(node);
                nodes.list.forEach(current => {
                    nodes.list.forEach((adjacent: any) => {
                        if (current === adjacent) {
                            return;
                        }
                        else if (constraint) {
                            let linear1: ClientRect = current.linear;
                            let linear2: ClientRect = adjacent.linear;
                            let parent = false;
                            if (current === node || adjacent === node) {
                                if (current === node) {
                                    current = adjacent;
                                }
                                adjacent = { stringId: 'parent' };
                                linear1 = current.linear;
                                linear2 = node.box;
                                parent = true;
                            }
                            if (current.css('width') != null && current.styleMap.marginTop === '0px' && current.styleMap.marginRight === 'auto' && current.styleMap.marginBottom === '0px' && current.styleMap.marginLeft === 'auto') {
                                this.setAlignParent(current, 'horizontal');
                            }
                            else {
                                if (parent) {
                                    if (linear1.left === linear2.left) {
                                        current.anchor(LAYOUT['left'], adjacent, 'horizontal');
                                    }
                                    if (withinRange(linear1.right, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['right'], adjacent, 'horizontal');
                                    }
                                }
                                else {
                                    if (current.viewWidth === 0 && linear1.left === linear2.left && linear1.right === linear2.right) {
                                        current.anchor(LAYOUT['left'], adjacent);
                                        current.anchor(LAYOUT['right'], adjacent);
                                    }
                                    else if (!SETTINGS.horizontalPerspective) {
                                        if (linear1.left === linear2.left) {
                                            current.anchor(LAYOUT['left'], adjacent);
                                        }
                                        else if (linear1.right === linear2.right) {
                                            current.anchor(LAYOUT['right'], adjacent);
                                        }
                                    }
                                    if (withinRange(linear1.left, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                        if (current.css('float') !== 'right') {
                                            current.anchor(LAYOUT['leftRight'], adjacent, '', current.withinX(linear2));
                                        }
                                        else {
                                            current.constraint.marginHorizontal = adjacent.stringId;
                                        }
                                    }
                                    if (withinRange(linear1.right, linear2.left, SETTINGS.whitespaceHorizontalOffset)) {
                                        if (current.css('float') !== 'left') {
                                            current.anchor(LAYOUT['rightLeft'], adjacent, '', current.withinX(linear2));
                                        }
                                    }
                                }
                            }
                            if (parent) {
                                if (linear1.top === linear2.top) {
                                    current.anchor(LAYOUT['top'], adjacent, 'vertical');
                                }
                                if (withinRange(linear1.bottom, linear2.bottom, SETTINGS.whitespaceHorizontalOffset)) {
                                    current.anchor(LAYOUT['bottom'], adjacent, 'vertical');
                                }
                            }
                            else {
                                const parentBottom = mapParent(current, 'bottom');
                                const adjacentVertical = (adjacent.constraint.vertical ? 'vertical' : '');
                                if (withinRange(linear1.top, linear2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                    if (current.withinY(linear2)) {
                                        if (!parentBottom || adjacent.constraint.vertical) {
                                            current.anchor(LAYOUT['topBottom'], adjacent, adjacentVertical, (linear1.left === linear2.left || linear2.right === linear2.right));
                                        }
                                        if (adjacent.constraint.vertical) {
                                            mapDelete(current, 'top', 'bottom');
                                        }
                                    }
                                }
                                if (linear1.top === linear2.top && linear1.bottom === linear2.bottom) {
                                    if (current.app(LAYOUT['topBottom']) == null && current.app(LAYOUT['bottomTop']) == null) {
                                        if (current.floating) {
                                            if (parentBottom) {
                                                if (adjacent.app(LAYOUT['topBottom']) != null) {
                                                    current.anchor(LAYOUT['top'], adjacent, adjacentVertical);
                                                }
                                                current.anchor(LAYOUT['bottom'], adjacent, adjacentVertical, (adjacent.app(LAYOUT['topBottom']) != null));
                                            }
                                        }
                                        else {
                                            if (!current.constraint.vertical) {
                                                if (parentBottom) {
                                                    current.anchor(LAYOUT['top'], adjacent, adjacentVertical);
                                                    mapDelete(current, 'bottom');
                                                }
                                                else {
                                                    current.anchor(LAYOUT['bottom'], adjacent, adjacentVertical);
                                                    mapDelete(current, 'top');
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else if (relative) {
                            if (current === node) {
                                return;
                            }
                            else if (adjacent === node) {
                                adjacent = { stringId: 'true' };
                                if (current.linear.left === node.box.left) {
                                    current.anchor(parseRTL('layout_alignParentLeft'), adjacent, 'horizontal');
                                }
                                if (current.linear.right === node.box.right) {
                                    current.anchor(parseRTL('layout_alignParentRight'), adjacent, 'horizontal');
                                }
                                if (current.linear.top === node.box.top) {
                                    current.anchor('layout_alignParentTop', adjacent, 'vertical');
                                }
                                if (withinRange(current.linear.bottom, node.box.bottom, SETTINGS.whitespaceHorizontalOffset)) {
                                    current.anchor('layout_alignParentBottom', adjacent, 'vertical');
                                }
                            }
                            else {
                                const linear1: ClientRect = current.linear;
                                const linear2: ClientRect = adjacent.linear;
                                if (current.css('width') != null && current.styleMap.marginTop === '0px' && current.styleMap.marginRight === 'auto' && current.styleMap.marginBottom === '0px' && current.styleMap.marginLeft === 'auto') {
                                    current.android('layout_centerHorizontal', 'true');
                                    current.constraint.horizontal = true;
                                }
                                else {
                                    if ((linear1.top === linear2.top || linear1.bottom === linear2.bottom) && withinRange(linear1.left, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                        if (current.css('float') === 'right') {
                                            adjacent.anchor(LAYOUT['rightLeft'], current, (current.constraint.horizontal ? 'horizontal' : ''));
                                        }
                                        else {
                                            current.anchor(LAYOUT['leftRight'], adjacent, (adjacent.constraint.horizontal ? 'horizontal' : ''));
                                            if (adjacent.constraint.horizontal) {
                                                current.delete('android', parseRTL('layout_alignParentRight'));
                                            }
                                        }
                                    }
                                }
                                if (withinRange(linear1.top, linear2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                    current.anchor(LAYOUT['topBottom'], adjacent, (adjacent.constraint.vertical ? 'vertical' : ''));
                                    if (adjacent.constraint.vertical) {
                                        current.delete('android', 'layout_alignParentBottom');
                                    }
                                }
                                if (adjacent.constraint.horizontal) {
                                    if (linear1.bottom === linear2.bottom) {
                                        if (!linearX && (!current.floating || !current.constraint.vertical)) {
                                            current.anchor(LAYOUT['bottom'], adjacent, (adjacent.constraint.vertical ? 'vertical' : ''));
                                            if (adjacent.constraint.vertical) {
                                                current.delete('android', 'layout_alignParentBottom');
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                });
                nodes.list.shift();
                nodes.list.forEach(current => {
                    const leftRight = current.anchor(LAYOUT['leftRight']);
                    if (leftRight != null) {
                        if (flex.enabled) {
                            current.constraint.horizontal = true;
                        }
                        current.constraint.marginHorizontal = leftRight;
                    }
                    const topBottom = current.anchor(LAYOUT['topBottom']);
                    if (topBottom != null) {
                        if (flex.enabled) {
                            current.constraint.vertical = true;
                        }
                        current.constraint.marginVertical = topBottom;
                    }
                });
                if (flex.enabled || (constraint && SETTINGS.useConstraintChain && !nodes.intersect()) && !nodes.list.some(item => item.floating)) {
                    let flexNodes: Null<any[]> = null;
                    if (flex.enabled) {
                        const directionNodes = nodes.list.slice();
                        if (flex.wrap === 'nowrap') {
                            let horizontalChain = (<Null<U>> nodes.slice());
                            let verticalChain = (<Null<U>> nodes.slice());
                            switch (flex.direction) {
                                case 'row-reverse':
                                    (<U> horizontalChain).list.reverse();
                                case 'row':
                                    verticalChain = null;
                                    break;
                                case 'column-reverse':
                                    (<U> verticalChain).list.reverse();
                                case 'column':
                                    horizontalChain = null;
                                    break;
                            }
                            flexNodes = [{ constraint: { horizontalChain, verticalChain }}];
                        }
                        else {
                            switch (flex.direction) {
                                case 'row-reverse':
                                case 'column-reverse':
                                    directionNodes.reverse();
                            }
                            const map: any = {};
                            const levels: number[] = [];
                            directionNodes.forEach(item => {
                                const y = item.linear.top;
                                if (map[y] == null) {
                                    map[y] = [];
                                    levels.push(y);
                                }
                                map[y].push(item);
                            });
                            if (flex.wrap === 'wrap-reverse') {
                                if (flex.direction.indexOf('column') !== -1) {
                                    for (const y in map) {
                                        map[y].reverse();
                                    }
                                }
                                else {
                                    levels.reverse();
                                }
                            }
                            flexNodes = [];
                            for (const n of levels) {
                                flexNodes.push({ constraint: { horizontalChain: new ViewList(map[n], node), verticalChain: null } });
                            }
                        }
                    }
                    else {
                        nodes.list.forEach(current => {
                            let horizontalChain = nodes.filter((item: T) => same(current, item, 'linear.top'));
                            if (horizontalChain.list.length === 0) {
                                horizontalChain = nodes.filter((item: T) => same(current, item, 'linear.bottom'));
                            }
                            if (horizontalChain.list.length > 0) {
                                horizontalChain.sortAsc('linear.x');
                            }
                            let verticalChain = nodes.filter((item: T) => same(current, item, 'linear.left'));
                            if (verticalChain.list.length === 0) {
                                verticalChain = nodes.filter((item: T) => same(current, item, 'linear.right'));
                            }
                            if (verticalChain.list.length > 0) {
                                verticalChain.sortAsc('linear.y');
                            }
                            current.constraint.horizontalChain = horizontalChain;
                            current.constraint.verticalChain = verticalChain;
                        });
                    }
                    const direction = CHAIN_MAP.direction.slice();
                    if (!SETTINGS.horizontalPerspective) {
                        direction.reverse();
                    }
                    direction.forEach((value, index) => {
                        if (!SETTINGS.horizontalPerspective) {
                            index = (index === 0 ? 1 : 0);
                        }
                        const inverse = (index === 0 ? 1 : 0);
                        const chainNodes = flexNodes || nodes.slice().list.sort((a, b) => (a.constraint[value].length >= b.constraint[value].length ? -1 : 1));
                        chainNodes.forEach((current, level) => {
                            const chainDirection: U = current.constraint[value];
                            if (chainDirection != null) {
                                if (chainDirection.length > 1 && (flex.enabled || chainDirection.list.map(item => parseInt((item.constraint[value].list || [{ id: 0 }]).map((result: any) => result.id).join(''))).reduce((a, b) => (a === b ? a : 0)) > 0)) {
                                    chainDirection.parent = node;
                                    if (flex.enabled && chainDirection.list.some(item => item.flex.order > 0)) {
                                        chainDirection[(flex.direction.indexOf('reverse') !== -1 ? 'sortDesc' : 'sortAsc')]('flex.order');
                                    }
                                    const [HV, VH] = [CHAIN_MAP['horizontalVertical'][index], CHAIN_MAP['horizontalVertical'][inverse]];
                                    const [LT, TL] = [CHAIN_MAP['leftTop'][index], CHAIN_MAP['leftTop'][inverse]];
                                    const [RB, BR] = [CHAIN_MAP['rightBottom'][index], CHAIN_MAP['rightBottom'][inverse]];
                                    const [WH, HW] = [CHAIN_MAP['widthHeight'][index], CHAIN_MAP['widthHeight'][inverse]];
                                    const orientation = HV.toLowerCase();
                                    const orientationInverse = VH.toLowerCase();
                                    const dimension = WH.toLowerCase();
                                    const firstNode = chainDirection.first;
                                    const lastNode = chainDirection.last;
                                    let maxOffset = -1;
                                    for (let i = 0; i < chainDirection.list.length; i++) {
                                        const chain = chainDirection.list[i];
                                        const next = chainDirection.list[i + 1];
                                        const previous = chainDirection.list[i - 1];
                                        if (flex.enabled) {
                                            if (chain.linear[TL] === node.box[TL] && chain.linear[BR] === node.box[BR]) {
                                                this.setAlignParent(chain, orientationInverse);
                                            }
                                            const nextLevel = chainNodes[level + 1];
                                            if (nextLevel != null && nextLevel.constraint[value] != null && nextLevel.constraint[value].list[i] != null) {
                                                const nextChain = nextLevel.constraint[value].list[i];
                                                if (chain.withinY(nextChain.linear) && !mapParent(chain, 'top')) {
                                                    chain.app(LAYOUT['bottomTop'], nextChain.stringId);
                                                    mapDelete(chain, 'top', 'bottom');
                                                }
                                            }
                                        }
                                        if (next != null) {
                                            chain.app(LAYOUT[CHAIN_MAP['rightLeftBottomTop'][index]], next.stringId);
                                            maxOffset = Math.max(<number> next.linear[LT] - <number> chain.linear[RB], maxOffset);
                                        }
                                        if (previous != null) {
                                            chain.app(LAYOUT[CHAIN_MAP['leftRightTopBottom'][index]], previous.stringId);
                                            chain.constraint[`margin${HV}`] = previous.stringId;
                                        }
                                        if (chain.styleMap[dimension] == null) {
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
                                            const map: StringMap = LAYOUT_MAP.constraint;
                                            chain.app(`layout_constraint${HV}_weight`, chain.flex.grow.toString());
                                            if (chain[`view${WH}`] == null && chain.flex.grow === 0 && chain.flex.shrink <= 1) {
                                                chain.android(`layout_${dimension}`, 'wrap_content');
                                            }
                                            else if (chain.flex.grow > 0) {
                                                chain.android(`layout_${dimension}`, (node.renderParent.is(VIEW_STANDARD.LINEAR) && node.renderParent.constraint.expand && node.flex.direction.indexOf('row') !== -1 ? 'wrap_content' : '0px'));
                                            }
                                            if (chain.flex.shrink === 0) {
                                                chain.app(`layout_constrained${WH}`, 'true');
                                            }
                                            switch (chain.flex.alignSelf) {
                                                case 'flex-start':
                                                    chain.app(map[TL], 'parent');
                                                    chain.constraint[orientationInverse] = true;
                                                    break;
                                                case 'flex-end':
                                                    chain.app(map[BR], 'parent');
                                                    chain.constraint[orientationInverse] = true;
                                                    break;
                                                case 'baseline':
                                                    chain.app(map['baseline'], 'parent');
                                                    mapDelete(chain, 'top', 'bottom');
                                                    chainDirection.list.forEach(item => {
                                                        if (item.app(map['top']) === chain.stringId) {
                                                            mapDelete(item, 'top');
                                                        }
                                                        if (item.app(map['bottom']) === chain.stringId) {
                                                            mapDelete(item, 'bottom');
                                                        }
                                                    });
                                                    chain.constraint.vertical = true;
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
                                    firstNode.app(LAYOUT[LT], 'parent');
                                    firstNode.constraint[orientation] = true;
                                    lastNode.app(LAYOUT[RB], 'parent');
                                    lastNode.constraint[orientation] = true;
                                    const chainStyle = `layout_constraint${HV}_chainStyle`;
                                    if (flex.enabled && flex.justifyContent !== 'normal' && Math.max.apply(null, chainDirection.list.map(item => item.flex.grow)) === 0) {
                                        switch (flex.justifyContent) {
                                            case 'space-between':
                                                firstNode.app(chainStyle, 'spread_inside');
                                                break;
                                            case 'space-evenly':
                                                firstNode.app(chainStyle, 'spread');
                                                chainDirection.list.forEach(item => item.app(`layout_constraint${HV}_weight`, (item.flex.grow || 1).toString()));
                                                break;
                                            case 'space-around':
                                                const leftTop = (index === 0 ? 'left' : 'top');
                                                const percent = (firstNode.bounds[leftTop] - node.box[leftTop]) / (<number> node.box[dimension]);
                                                firstNode.app(`layout_constraint${HV}_chainStyle`, 'spread_inside');
                                                this.createGuideline(node, firstNode, orientation, false, parseFloat(percent.toFixed(2)));
                                                this.createGuideline(node, lastNode, orientation, true, parseFloat((1 - percent).toFixed(2)));
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
                                                firstNode.app(chainStyle, 'packed');
                                                firstNode.app(`layout_constraint${HV}_bias`, bias);
                                        }
                                    }
                                    else {
                                        if (flex.enabled && withinFraction(node.box.left, firstNode.linear.left) && withinFraction(lastNode.linear.right, node.box.right)) {
                                            firstNode.app(chainStyle, 'spread_inside');
                                        }
                                        else if ((maxOffset <= SETTINGS[`chainPacked${HV}Offset`] || node.flex.wrap !== 'nowrap') || firstNode.linear.left === node.box.left || lastNode.linear.right === node.box.right) {
                                            firstNode.app(chainStyle, 'packed');
                                            let bias = '';
                                            if (withinFraction(node.box.left, firstNode.linear.left)) {
                                                bias = '0';
                                            }
                                            else if (withinFraction(lastNode.linear.right, node.box.right)) {
                                                bias = '1';
                                            }
                                            else {
                                                bias = firstNode[`${orientation}Bias`];
                                            }
                                            firstNode.app(`layout_constraint${HV}_bias`, bias);
                                            this.adjustMargins(chainDirection.list);
                                        }
                                        else {
                                            firstNode.app(chainStyle, 'spread');
                                        }
                                        if (!flex.enabled) {
                                            chainDirection.list.forEach(item => {
                                                item.constraint.horizontalChain = [];
                                                item.constraint.verticalChain = [];
                                            });
                                        }
                                    }
                                }
                                else if (chainDirection.length > 0) {
                                    const firstNode = chainDirection.first;
                                    if (mapParent(firstNode, 'left')) {
                                        mapDelete(firstNode, 'rightLeft');
                                    }
                                    if (mapParent(firstNode, 'right')) {
                                        mapDelete(firstNode, 'leftRight');
                                    }
                                }
                            }
                        });
                    });
                }
                if (!flex.enabled) {
                    const anchors = nodes.anchors;
                    if (constraint) {
                        if (anchors.length === 0) {
                            const unbound = nodes.sortAsc('bounds.x', 'bounds.y')[0];
                            if (SETTINGS.useConstraintGuideline) {
                                this.createGuideline(node, unbound);
                            }
                            else {
                                this.setAlignParent(unbound, '', true);
                            }
                            anchors.push(unbound);
                        }
                    }
                    do {
                        let restart = false;
                        nodes.list.forEach(current => {
                            if (!current.anchored) {
                                const result = (constraint ? search(<ObjectMap<string>> current.app(), '*constraint*') : search(<ObjectMap<string>> current.android(), LAYOUT));
                                for (const [key, value] of result) {
                                    if (value !== 'parent') {
                                        if (anchors.find(item => item.stringId === value) != null) {
                                            if (!current.constraint.horizontal && indexOf(key, parseRTL('Left'), parseRTL('Right')) !== -1) {
                                                current.constraint.horizontal = true;
                                            }
                                            if (!current.constraint.vertical && indexOf(key, 'Top', 'Bottom', 'Baseline', 'above', 'below') !== -1) {
                                                current.constraint.vertical = true;
                                            }
                                        }
                                    }
                                }
                                if (current.anchored) {
                                    anchors.push(current);
                                    restart = true;
                                }
                            }
                        });
                        if (!restart) {
                            break;
                        }
                    }
                    while (true);
                    if (constraint) {
                        nodes.list.forEach(opposite => {
                            if (!opposite.anchored) {
                                this.deleteConstraints(node);
                                if (SETTINGS.useConstraintGuideline) {
                                    this.createGuideline(node, opposite);
                                }
                                else {
                                    const adjacent = nodes.anchors[0];
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
                                    opposite.app('layout_constraintCircleRadius', formatPX(radius));
                                    opposite.app('layout_constraintCircleAngle', degrees.toString());
                                    opposite.constraint.horizontal = true;
                                    opposite.constraint.vertical = true;
                                }
                            }
                        });
                        nodes.list.forEach(current => {
                            if (mapParent(current, 'right') && !mapParent(current, 'left') && current.app(LAYOUT['leftRight']) == null) {
                                node.constraint.layoutWidth = true;
                            }
                            if (mapParent(current, 'bottom') && !mapParent(current, 'top') && current.app(LAYOUT['topBottom']) == null) {
                                node.constraint.layoutHeight = true;
                            }
                        });
                    }
                    else {
                        nodes.list.forEach(current => {
                            const parentRight = current.android(parseRTL('layout_alignParentRight'));
                            const parentBottom = current.android('layout_alignParentBottom');
                            if (!anchors.includes(current)) {
                                const parentLeft = parseRTL('layout_alignParentLeft');
                                current.delete('android', LAYOUT);
                                if (current.android(parentLeft) !== 'true') {
                                    const left = formatPX(current.bounds.left - node.box.left);
                                    current.css(parseRTL('marginLeft'), left);
                                    current.android(parentLeft, 'true');
                                    current.android(parseRTL('layout_marginLeft'), left);
                                }
                                if (parentBottom !== 'true') {
                                    const top = formatPX(current.bounds.top - node.box.top);
                                    current.css('marginTop', top);
                                    current.android('layout_alignParentTop', 'true');
                                    current.android('layout_marginTop', top);
                                }
                                current.constraint.horizontal = true;
                                current.constraint.vertical = true;
                            }
                            else {
                                this.adjustMargins([current]);
                            }
                            if (parentRight === 'true' && current.android(LAYOUT['leftRight']) == null) {
                                node.constraint.layoutWidth = true;
                            }
                            if (parentBottom === 'true' && current.android(LAYOUT['topBottom']) == null) {
                                node.constraint.layoutHeight = true;
                            }
                        });
                    }
                }
            }
        });
    }

    public setMarginPadding() {
        this.cache.list.forEach(node => {
            if (node.is(VIEW_STANDARD.LINEAR, VIEW_STANDARD.RADIO_GROUP)) {
                switch (node.android('orientation')) {
                    case 'horizontal':
                        let left = node.box.left;
                        sortAsc(node.renderChildren, 'linear.left').forEach(item => {
                            if (!item.floating) {
                                const width = Math.ceil(item.linear.left - left);
                                if (width >= 1) {
                                    item.modifyBox(BOX_STANDARD.MARGIN_LEFT, width);
                                }
                            }
                            left = (item.label || item).linear.right;
                        });
                        break;
                    case 'vertical':
                        let top = node.box.top;
                        sortAsc(node.renderChildren, 'linear.top').forEach(item => {
                            const height = Math.ceil(item.linear.top - top);
                            if (height >= 1) {
                                item.modifyBox(BOX_STANDARD.MARGIN_TOP, height);
                            }
                            top = item.linear.bottom;
                        });
                        break;
                }
            }
        });
    }

    public renderGroup(node: T, parent: T, viewName: number, options: ObjectMap<any> = {}) {
        let preXml = '';
        let postXml = '';
        let renderParent = parent;
        node.setViewId(View.getViewName(viewName));
        if (node.overflow !== OVERFLOW_CHROME.NONE) {
            const scrollView: string[] = [];
            if (node.overflowX) {
                scrollView.push(VIEW_ANDROID.SCROLL_HORIZONTAL);
            }
            if (node.overflowY) {
                scrollView.push((node.ascend().some(item => item.overflow !== OVERFLOW_CHROME.NONE) ? VIEW_ANDROID.SCROLL_NESTED : VIEW_ANDROID.SCROLL_VERTICAL));
            }
            let current = node;
            let scrollDepth = parent.renderDepth + scrollView.length;
            scrollView
                .map(scrollName => {
                    const viewGroup = new ViewGroup(this.cache.nextId, current, null, [current]);
                    const view = (<View> viewGroup) as T;
                    viewGroup.setViewId(scrollName);
                    viewGroup.setBounds();
                    viewGroup.inheritGrid(current);
                    viewGroup.android('fadeScrollbars', 'false');
                    this.cache.list.push(view);
                    switch (scrollName) {
                        case VIEW_ANDROID.SCROLL_HORIZONTAL:
                            viewGroup.css('width', node.styleMap.width);
                            viewGroup.css('minWidth', node.styleMap.minWidth);
                            viewGroup.css('overflowX', node.styleMap.overflowX);
                            break;
                        default:
                            viewGroup.css('height', node.styleMap.height);
                            viewGroup.css('minHeight', node.styleMap.minHeight);
                            viewGroup.css('overflowY', node.styleMap.overflowY);
                    }
                    const indent = padLeft(scrollDepth--);
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
        node.applyCustomizations();
        node.render(renderParent);
        node.setGravity();
        this.setGridSpace(node);
        return this.getEnclosingTag(node.renderDepth, View.getViewName(viewName), node.id, `{:${node.id}}`, preXml, postXml);
    }

    public renderView(node: T, parent: T, viewName: number | string, recursive = false) {
        const element: any = node.element;
        if (typeof viewName === 'number') {
            viewName = View.getViewName(viewName);
        }
        node.setViewId(viewName);
        switch (element.tagName) {
            case 'IMG':
                switch (element.style.objectFit) {
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
                node.android('scrollbars', 'vertical');
                node.android('inputType', 'textMultiLine');
                if (node.overflowX) {
                    node.android('scrollHorizontally', 'true');
                }
                break;
            case 'INPUT':
                switch (element.type) {
                    case 'radio':
                        if (!recursive) {
                            const result = (<T[]> node.parentOriginal.children.filter(item => ((<HTMLInputElement> item.element).type === 'radio' && (<HTMLInputElement> item.element).name === element.name)));
                            let xml = '';
                            if (result.length > 1) {
                                const viewGroup = new ViewGroup(this.cache.nextId, node, parent, result);
                                const view = (<View> viewGroup) as T;
                                let checked: string = '';
                                this.cache.list.push(view);
                                viewGroup.setViewId(VIEW_ANDROID.RADIO_GROUP);
                                viewGroup.render(parent);
                                result.forEach(item => {
                                    viewGroup.inheritGrid(item);
                                    if ((<HTMLInputElement> item.element).checked) {
                                        checked = item.stringId;
                                    }
                                    item.parent = viewGroup;
                                    item.render(viewGroup);
                                    xml += this.renderView(item, view, VIEW_STANDARD.RADIO, true);
                                });
                                viewGroup.android('orientation', NodeList.linearX(viewGroup.children) ? 'horizontal' : 'vertical');
                                if (checked !== '') {
                                    viewGroup.android('checkedButton', checked);
                                }
                                viewGroup.setBounds();
                                this.setGridSpace(view);
                                return this.getEnclosingTag(viewGroup.renderDepth, VIEW_ANDROID.RADIO_GROUP, viewGroup.id, xml);
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
        switch (node.viewName) {
            case VIEW_ANDROID.TEXT:
                if (node.overflow !== OVERFLOW_CHROME.NONE) {
                    const scrollbars: string[] = [];
                    if (node.overflowX) {
                        scrollbars.push('horizontal');
                    }
                    if (node.overflowY) {
                        scrollbars.push('vertical');
                    }
                    node.android('scrollbars', scrollbars.join('|'));
                }
                break;
        }
        node.applyCustomizations();
        node.render(parent);
        node.setGravity();
        node.setAccessibility();
        node.cascade().forEach(item => item.hide());
        this.setGridSpace(node);
        return this.getEnclosingTag(node.renderDepth, node.viewName, node.id);
    }

    public createGroup(node: T, parent: T, children: T[]) {
        const viewGroup = (<View> new ViewGroup(this.cache.nextId, node, parent, children) as T);
        children.forEach(item => {
            item.parent = viewGroup;
            viewGroup.inheritGrid(item);
        });
        viewGroup.setBounds();
        this.cache.list.push(viewGroup);
        return viewGroup;
    }

    public getViewStatic(tagName: number | string, depth: number, options: ObjectMap<any> = {}, width = 'wrap_content', height = 'wrap_content', node: Null<T> = null, children = false) {
        if (node == null) {
            node = (<T> new View(0, SETTINGS.targetAPI));
        }
        const viewName = (typeof tagName === 'number' ? View.getViewName(tagName) : tagName);
        node.setViewId(viewName);
        if (hasValue(width)) {
            node.android('layout_width', width);
        }
        if (hasValue(height)) {
            node.android('layout_height', height);
        }
        for (const obj in options) {
            if (options[obj] != null) {
                this.namespaces.add(obj);
            }
        }
        node.apply(options);
        let output = this.getEnclosingTag(depth, viewName, node.id, (children ? `{:${node.id}}` : ''));
        if (SETTINGS.showAttributes && node.id === 0) {
            const indent = padLeft(depth + 1);
            const attributes = node.combine().map(value => `\n${indent + value}`).join('');
            output = output.replace(`{@${node.id}}`, attributes);
        }
        options.stringId = node.stringId;
        return output;
    }

    public replaceInlineAttributes(output: string, node: T, options: ObjectMap<boolean> = {}) {
        node.setViewLayout();
        node.namespaces.forEach((value: string) => options[value] = true);
        return output.replace(`{@${node.id}}`, this.parseAttributes(node));
    }

    public getRootAttributes(options: {}) {
        for (const obj in options) {
            this.namespaces.add(obj);
        }
        return Array.from(this.namespaces).sort().map(value => (XMLNS_ANDROID[value.toUpperCase()] != null ? `\n\t${XMLNS_ANDROID[value.toUpperCase()]}` : '')).join('');
    }

    public getViewName(value: number) {
        return View.getViewName(value);
    }

    private parseAttributes(node: T) {
        let output = '';
        const attributes = node.combine();
        const indent = padLeft(node.renderDepth + 1);
        output = (node.renderDepth === 0 ? '{@0}' : '') + attributes.map((value: string) => `\n${indent + value}`).join('');
        return output;
    }

    private setGridSpace(node: T) {
        if (node.parent.is(VIEW_STANDARD.GRID)) {
            const dimensions: any = getBoxSpacing((<HTMLElement> node.parentOriginal.element), true);
            const options = {
                android: {
                    layout_columnSpan: node.renderParent.gridColumnCount
                }
            };
            if (node.gridFirst) {
                const heightTop = dimensions.paddingTop + dimensions.marginTop;
                if (heightTop > 0) {
                    node.parent.gridPadding.top = heightTop;
                }
            }
            if (node.gridRowStart) {
                const marginLeft = dimensions.marginLeft + dimensions.paddingLeft;
                if (marginLeft > 0) {
                    node.parent.gridPadding.left.push(marginLeft);
                }
            }
            if (node.gridRowEnd) {
                const heightBottom = dimensions.marginBottom + dimensions.paddingBottom + (!node.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
                if (heightBottom > 0) {
                    if (node.gridLast) {
                        node.parent.gridPadding.bottom = heightBottom;
                    }
                    else {
                        this.appendAfter(node.id, this.getViewStatic(VIEW_STANDARD.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightBottom)));
                    }
                }
                const marginRight = dimensions.marginRight + dimensions.paddingRight;
                if (marginRight > 0) {
                    node.parent.gridPadding.right.push(marginRight);
                }
            }
        }
    }

    private setAlignParent(node: T, orientation = '', bias = false) {
        const map: any = LAYOUT_MAP.constraint;
        ['horizontal', 'vertical'].forEach((value, index) => {
            if (orientation === '' || value === orientation) {
                node.app(map[(index === 0 ? 'left' : 'top')], 'parent');
                node.app(map[(index === 0 ? 'right' : 'bottom')], 'parent');
                node.constraint[value] = true;
                if (bias) {
                    node.app(`layout_constraint${value.charAt(0).toUpperCase() + value.substring(1)}_bias`, node[`${value}Bias`]);
                }
            }
        });
    }

    private createGuideline(parent: T, node: T, orientation = '', opposite = false, percent = -1) {
        const map: any = LAYOUT_MAP.constraint;
        const beginPercent = `layout_constraintGuide_${(percent !== -1 ? 'percent' : 'begin')}`;
        ['horizontal', 'vertical'].forEach((value, index) => {
            if ((orientation === '' && !node.constraint[value]) || orientation === value) {
                const position = (index === 0 ? 'left' : 'top');
                const options: ObjectMap<any> = {
                    android: {
                        orientation: (index === 0 ? 'vertical' : 'horizontal')
                    },
                    app: {
                        [beginPercent]: (percent !== -1 ? percent : formatPX(Math.max(node.bounds[position] - parent.box[position], 0)))
                    }
                };
                const LRTB = (index === 0 ? (!opposite ? 'left' : 'right') : (!opposite ? 'top' : 'bottom'));
                const RLBT = (index === 0 ? (!opposite ? 'right' : 'left') : (!opposite ? 'bottom' : 'top'));
                const xml = this.getViewStatic(VIEW_STANDARD.GUIDELINE, node.renderDepth, options);
                this.appendAfter(node.id, xml, -1);
                node.app(map[LRTB], options.stringId);
                node.delete('app', map[RLBT]);
                node.constraint[value] = true;
            }
        });
    }

    private deleteConstraints(node: T, orientation = '') {
        const map: any = LAYOUT_MAP.constraint;
        if (orientation === '' || orientation === 'horizontal') {
            node.delete('app', map['leftRight'], map['rightLeft']);
            node.constraint.horizontal = false;
        }
        if (orientation === '' || orientation === 'vertical') {
            node.delete('app', map['bottomTop'], map['topBottom'], map['baseline']);
            node.constraint.vertical = false;
        }
    }

    private findByAndroidId(id: string) {
        return this.cache.list.find(node => node.android('id') === id);
    }

    private adjustMargins(nodes: T[]) {
        for (const node of nodes) {
            if (node.constraint.marginHorizontal != null) {
                const item = this.findByAndroidId(node.constraint.marginHorizontal);
                if (item != null) {
                    const offset = node.linear.left - item.linear.right;
                    if (offset >= 1) {
                        node.modifyBox(BOX_STANDARD.MARGIN_LEFT, offset);
                    }
                }
            }
            if (node.constraint.marginVertical != null) {
                const item = this.findByAndroidId(node.constraint.marginVertical);
                if (item != null) {
                    const offset = node.linear.top - item.linear.bottom;
                    if (offset >= 1) {
                        node.modifyBox(BOX_STANDARD.MARGIN_TOP, offset);
                    }
                }
            }
        }
    }
}