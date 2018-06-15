import { IClientRect, IPoint } from '../lib/types';
import Element from '../base/element';
import Widget from './widget';
import Layout from './layout';
import WidgetList from './widgetlist';
import { convertPX, formatPX, hasValue, indexOf, padLeft, same, search, sortAsc, withinFraction, withinRange } from '../lib/util';
import { getBoxSpacing } from '../lib/dom';
import parseRTL from './localization';
import SETTINGS from '../settings';
import { BOX_STANDARD, OVERFLOW_CHROME, VIEW_STANDARD } from '../lib/constants';
import { BOX_ANDROID, VIEW_ANDROID, XMLNS_ANDROID } from './constants';

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

export default class View<T extends Widget, U extends WidgetList<T>> extends Element<T, U> {
    public cache: U;

    constructor()
    {
        super();
    }

    public getViewName(value: number) {
        return Widget.getViewName(value);
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
        this.cache.visible.forEach((node: T) => {
            const nodes: U = (<U> new WidgetList(node.renderChildren, node));
            const constraint = node.is(VIEW_STANDARD.CONSTRAINT);
            const relative = node.is(VIEW_STANDARD.RELATIVE);
            const flex = node.flex;
            if (nodes.length > 0 && (constraint || relative || flex.enabled)) {
                node.expandDimensions();
                if (node.is(VIEW_STANDARD.LINEAR)) {
                    if (node.renderChildren.some((item: T) => item.flex.direction.indexOf('row') !== -1)) {
                        node.constraint.layoutWidth = true;
                        node.constraint.expand = true;
                    }
                    if (node.renderChildren.some((item: T) => item.flex.direction.indexOf('column') !== -1)) {
                        node.constraint.layoutHeight = true;
                        node.constraint.expand = true;
                    }
                    return;
                }
                const LAYOUT = LAYOUT_MAP[(relative ? 'relative' : 'constraint')];
                if (!flex.enabled) {
                    nodes.forEach((current: T) => {
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
                    nodes.unshift(node);
                    nodes.forEach((current: T) => {
                        nodes.forEach((adjacent: any) => {
                            if (current === adjacent) {
                                return;
                            }
                            else if (constraint) {
                                let bounds1: IClientRect = current.bounds;
                                let bounds2: IClientRect = adjacent.bounds;
                                let parent = false;
                                if (current === node || adjacent === node) {
                                    if (current === node) {
                                        current = adjacent;
                                    }
                                    adjacent = { stringId: 'parent' };
                                    bounds1 = current.linear;
                                    bounds2 = node.box;
                                    parent = true;
                                }
                                if (parent) {
                                    if (bounds1.left === bounds2.left) {
                                        current.anchor(LAYOUT['left'], adjacent, 'horizontal');
                                    }
                                    if (withinRange(bounds1.right, bounds2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['right'], adjacent, 'horizontal');
                                    }
                                }
                                else {
                                    if (current.viewWidth === 0 && bounds1.left === bounds2.left && bounds1.right === bounds2.right) {
                                        current.anchor(LAYOUT['left'], adjacent);
                                        current.anchor(LAYOUT['right'], adjacent);
                                    }
                                    else if (!SETTINGS.horizontalPerspective) {
                                        if (bounds1.left === bounds2.left) {
                                            current.anchor(LAYOUT['left'], adjacent);
                                        }
                                        else if (bounds1.right === bounds2.right) {
                                            current.anchor(LAYOUT['right'], adjacent);
                                        }
                                    }
                                    const withinY = (bounds1.top === bounds2.top || bounds1.bottom === bounds2.bottom);
                                    if (withinY && withinRange(bounds1.left, bounds2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['leftRight'], adjacent);
                                    }
                                    if (withinY && withinRange(bounds1.right, bounds2.left, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['rightLeft'], adjacent);
                                    }
                                }
                                if (parent) {
                                    if (bounds1.top === bounds2.top) {
                                        current.anchor(LAYOUT['top'], adjacent, 'vertical');
                                    }
                                    if (bounds1.bottom === bounds2.bottom) {
                                        current.anchor(LAYOUT['bottom'], adjacent, 'vertical');
                                    }
                                }
                                else {
                                    if (current.viewHeight === 0 && bounds1.top === bounds2.top && bounds1.bottom === bounds2.bottom) {
                                        const baseline = (current.is(VIEW_STANDARD.TEXT) && current.style.verticalAlign === 'baseline' && adjacent.is(VIEW_STANDARD.TEXT) && adjacent.style.verticalAlign === 'baseline');
                                        current.anchor(LAYOUT[(baseline ? 'baseline' : 'top')], adjacent);
                                        current.anchor(LAYOUT['bottom'], adjacent);
                                    }
                                    if (withinRange(bounds1.top, bounds2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                        current.anchor(LAYOUT['topBottom'], adjacent);
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
                                    if (current.linear.bottom === node.box.bottom) {
                                        current.anchor('layout_alignParentBottom', adjacent, 'vertical');
                                    }
                                }
                                else {
                                    const bounds1: IClientRect = current.bounds;
                                    const bounds2: IClientRect = adjacent.bounds;
                                    if ((bounds1.top === bounds2.top || bounds1.bottom === bounds2.bottom) && withinRange(bounds1.left, bounds2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                        current.anchor(LAYOUT['leftRight'], adjacent, (adjacent.constraint.horizontal ? 'horizontal' : ''));
                                        if (adjacent.constraint.horizontal) {
                                            current.delete('android', parseRTL('layout_alignParentRight'));
                                        }
                                    }
                                    if (adjacent.constraint.vertical && withinRange(bounds1.top, bounds2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                        current.anchor(LAYOUT['topBottom'], adjacent, (adjacent.constraint.vertical ? 'vertical' : ''));
                                        if (adjacent.constraint.vertical) {
                                            current.delete('android', 'layout_alignParentBottom');
                                        }
                                    }
                                    if (adjacent.constraint.horizontal) {
                                        if (bounds1.bottom === bounds2.bottom) {
                                            current.anchor(LAYOUT['bottom'], adjacent, (adjacent.constraint.vertical ? 'vertical' : ''));
                                            if (adjacent.constraint.vertical) {
                                                current.delete('android', 'layout_alignParentBottom');
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    });
                    nodes.shift();
                    nodes.forEach((current: T) => {
                        const leftRight = current.anchor(LAYOUT['leftRight']);
                        if (leftRight != null) {
                            current.constraint.horizontal = true;
                            current.constraint.marginHorizontal = leftRight;
                        }
                        const topBottom = current.anchor(LAYOUT['topBottom']);
                        if (topBottom != null) {
                            current.constraint.vertical = true;
                            current.constraint.marginVertical = topBottom;
                        }
                        if (constraint) {
                            const position: string[] = [];
                            if (current.constraint.horizontal) {
                                if (current.anchor(LAYOUT['left']) !== 'parent') {
                                    position.push(LAYOUT['left']);
                                }
                                if (current.anchor(LAYOUT['right']) !== 'parent') {
                                    position.push(LAYOUT['right']);
                                }
                            }
                            if (current.constraint.vertical) {
                                if (current.anchor(LAYOUT['top']) !== 'parent') {
                                    position.push(LAYOUT['top']);
                                }
                                if (current.anchor(LAYOUT['bottom']) !== 'parent') {
                                    position.push(LAYOUT['bottom']);
                                }
                            }
                            current.delete((relative ? 'android' : 'app'), ...position);
                        }
                    });
                }
                if (flex.enabled || (constraint && SETTINGS.useConstraintChain && !nodes.intersect())) {
                    let flexNodes: any = null;
                    if (flex.enabled) {
                        let horizontalChain: U | null = (<U> nodes.slice());
                        let verticalChain: U | null = (<U> nodes.slice());
                        switch (flex.direction) {
                            case 'row-reverse':
                                horizontalChain.reverse();
                            case 'row':
                                verticalChain = null;
                                break;
                            case 'column-reverse':
                                verticalChain.reverse();
                            case 'column':
                                horizontalChain = null;
                                break;
                        }
                        flexNodes = [{ constraint: { horizontalChain, verticalChain } }];
                    }
                    else {
                        nodes.forEach((current: T) => {
                            let horizontalChain = nodes.filter((item: T) => same(current, item, 'bounds.top'));
                            if (horizontalChain.length === 0) {
                                horizontalChain = nodes.filter((item: T) => same(current, item, 'bounds.bottom'));
                            }
                            if (horizontalChain.length > 0) {
                                (<U> horizontalChain).sortAsc('bounds.x');
                            }
                            let verticalChain = nodes.filter((item: T) => same(current, item, 'bounds.left'));
                            if (verticalChain.length === 0) {
                                verticalChain = nodes.filter((item: T) => same(current, item, 'bounds.right'));
                            }
                            if (verticalChain.length > 0) {
                                (<U> verticalChain).sortAsc('bounds.y');
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
                        const chainNodes = flexNodes || nodes.slice().sort((a: T, b: T) => (a.constraint[value].length >= b.constraint[value].length ? -1 : 1));
                        chainNodes.forEach((current: T) => {
                            const chainDirection: U = current.constraint[value];
                            if (chainDirection && chainDirection.length > 0 && (flex.enabled || chainDirection.map((item: T) => parseInt((item.constraint[value] || [{ id: 0 }]).map((result: any) => result.id).join(''))).reduce((a: number, b: number) => (a === b ? a : 0)) > 0)) {
                                chainDirection.parent = node;
                                if (flex.enabled && chainDirection.some((item: T) => item.flex.order > 0)) {
                                    chainDirection[(flex.direction.indexOf('reverse') !== -1 ? 'sortDesc' : 'sortAsc')]('flex.order');
                                }
                                const [HV, VH] = [CHAIN_MAP['horizontalVertical'][index], CHAIN_MAP['horizontalVertical'][inverse]];
                                const [LT, TL] = [CHAIN_MAP['leftTop'][index], CHAIN_MAP['leftTop'][inverse]];
                                const [RB, BR] = [CHAIN_MAP['rightBottom'][index], CHAIN_MAP['rightBottom'][inverse]];
                                const [WH, HW] = [CHAIN_MAP['widthHeight'][index], CHAIN_MAP['widthHeight'][inverse]];
                                const orientation = HV.toLowerCase();
                                const orientationInverse = VH.toLowerCase();
                                const dimension = WH.toLowerCase();
                                const firstNode: T = chainDirection.first;
                                const lastNode: T = chainDirection.last;
                                let maxOffset = -1;
                                for (let i = 0; i < chainDirection.length; i++) {
                                    const chain: T = chainDirection[i];
                                    const next: T = chainDirection[i + 1];
                                    const previous: T = chainDirection[i - 1];
                                    if (flex.enabled) {
                                        if (chain.linear[TL] === node.box[TL] && chain.linear[BR] === node.box[BR]) {
                                            this.setAlignParent(chain, orientationInverse);
                                        }
                                    }
                                    if (next != null) {
                                        chain.app(LAYOUT[CHAIN_MAP['rightLeftBottomTop'][index]], next.stringId);
                                        maxOffset = Math.max(next.linear[LT] - chain.linear[RB], maxOffset);
                                    }
                                    if (previous != null) {
                                        chain.app(LAYOUT[CHAIN_MAP['leftRightTopBottom'][index]], previous.stringId);
                                    }
                                    if (chain.styleMap[dimension] == null) {
                                        const min = chain.styleMap[`min${WH}`];
                                        const max = chain.styleMap[`max${WH}`];
                                        if (hasValue(min)) {
                                            chain.app(`layout_constraint${WH}_min`, convertPX(min));
                                            delete chain.styleMap[`min${WH}`];
                                        }
                                        if (hasValue(max)) {
                                            chain.app(`layout_constraint${WH}_max`, convertPX(max));
                                            delete chain.styleMap[`max${WH}`];
                                        }
                                    }
                                    if (flex.enabled) {
                                        const map = LAYOUT_MAP.constraint;
                                        chain.app(`layout_constraint${HV}_weight`, chain.flex.grow);
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
                                                chain.constraint.vertical = true;
                                                break;
                                            case 'center':
                                            case 'stretch':
                                                if (chain.flex.alignSelf === 'center') {
                                                    chain.app(`layout_constraint${VH}_bias`, '0.5');
                                                }
                                                else {
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
                                if (flex.enabled && flex.justifyContent !== 'normal' && Math.max.apply(null, chainDirection.map((item: T) => item.flex.grow)) === 0) {
                                    switch (flex.justifyContent) {
                                        case 'space-between':
                                            firstNode.app(chainStyle, 'spread_inside');
                                            break;
                                        case 'space-evenly':
                                            firstNode.app(chainStyle, 'spread');
                                            chainDirection.forEach((item: T) => item.app(`layout_constraint${HV}_weight`, item.flex.grow || 1));
                                            break;
                                        case 'space-around':
                                            const leftTop = (index === 0 ? 'left' : 'top');
                                            const percent = (firstNode.bounds[leftTop] - node.box[leftTop]) / node.box[dimension];
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
                                    let requireBias = true;
                                    if (flex.enabled && withinFraction(node.box.left, firstNode.linear.left) && withinFraction(lastNode.linear.right, node.box.right)) {
                                        firstNode.app(chainStyle, 'spread_inside');
                                        requireBias = false;
                                    }
                                    else if (maxOffset <= SETTINGS[`chainPacked${HV}Offset`]) {
                                        firstNode.app(chainStyle, 'packed');
                                        this.adjustMargins(chainDirection);
                                    }
                                    else {
                                        firstNode.app(chainStyle, 'spread');
                                    }
                                    if (requireBias) {
                                        firstNode.app(`layout_constraint${HV}_bias`, firstNode[`${orientation}Bias`]);
                                    }
                                    if (!flex.enabled) {
                                        chainDirection.forEach((chain: T) => {
                                            chain.constraint.horizontalChain = [];
                                            chain.constraint.verticalChain = [];
                                        });
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
                        nodes.forEach((current: T) => {
                            if (!current.anchored) {
                                const result = (constraint ? search((<object> current.app()), '*constraint*') : search((<object> current.android()), LAYOUT));
                                for (const [key, value] of result) {
                                    if (value !== 'parent') {
                                        if (anchors.find((item: T) => item.stringId === value) != null) {
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
                        nodes.forEach((opposite: T) => {
                            if (!opposite.anchored) {
                                this.deleteConstraints(node);
                                if (SETTINGS.useConstraintGuideline) {
                                    this.createGuideline(node, opposite);
                                }
                                else {
                                    const adjacent: T = nodes.anchors[0];
                                    const center1: IPoint = opposite.center;
                                    const center2: IPoint = adjacent.center;
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
                        nodes.forEach((current: T) => {
                            if (current.app(LAYOUT['right']) === 'parent' && current.app(LAYOUT['leftRight']) == null) {
                                node.constraint.layoutWidth = true;
                            }
                            if (current.app(LAYOUT['bottom']) === 'parent' && current.app(LAYOUT['topBottom']) == null) {
                                node.constraint.layoutHeight = true;
                            }
                        });
                    }
                    else {
                        nodes.forEach((current: T) => {
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

    public setLayoutWeight() {
        this.cache.forEach((node: T) => {
            const rows = node.linearRows;
            if (rows.length > 1) {
                const columnLength = rows[0].renderChildren.length;
                if (rows.every((item: T) => item.renderChildren.length === columnLength)) {
                    const horizontal = !node.horizontal;
                    const columnDimension = new Array(columnLength).fill(-1);
                    for (const row of rows) {
                        for (let i = 0; i < row.renderChildren.length; i++) {
                            columnDimension[i] = Math.max(row.renderChildren[i].linear[(horizontal ? 'width' : 'height')], columnDimension[i]);
                        }
                    }
                    const total = columnDimension.reduce((a, b) => a + b);
                    const percent = columnDimension.map(value => Math.floor((value * 100) / total));
                    percent[percent.length - 1] += 100 - percent.reduce((a, b) => a + b);
                    for (const row of rows) {
                        for (let i = 0; i < row.renderChildren.length; i++) {
                            const column = row.renderChildren[i];
                            column.distributeWeight(horizontal, percent[i]);
                        }
                    }
                }
            }
        });
    }

    public setMarginPadding() {
        this.cache.forEach((node: T) => {
            if (node.is(VIEW_STANDARD.LINEAR, VIEW_STANDARD.RADIO_GROUP)) {
                switch (node.android('orientation')) {
                    case 'horizontal':
                        let left = node.box.left;
                        sortAsc(node.renderChildren, 'linear.left').forEach((item: T) => {
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
                        sortAsc(node.renderChildren, 'linear.top').forEach((item: T) => {
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

    public renderLayout(node: T, parent: T, viewName: number, options?) {
        let preXml = '';
        let postXml = '';
        let renderParent = parent;
        node.setViewId(Widget.getViewName(viewName));
        if (node.overflow !== OVERFLOW_CHROME.NONE) {
            const scrollView: string[] = [];
            if (node.overflowX) {
                scrollView.push(VIEW_ANDROID.SCROLL_HORIZONTAL);
            }
            if (node.overflowY) {
                scrollView.push((node.ascend().some((item: T) => item.overflow !== OVERFLOW_CHROME.NONE) ? VIEW_ANDROID.SCROLL_NESTED : VIEW_ANDROID.SCROLL_VERTICAL));
            }
            let current = node;
            let scrollDepth = parent.renderDepth + scrollView.length;
            scrollView
                .map(scrollName => {
                    const layout = new Layout(this.cache.nextId, current, null, [current]);
                    const widget: T = (<Widget> layout) as T;
                    layout.setViewId(scrollName);
                    layout.setBounds();
                    layout.inheritGrid(current);
                    layout.android('fadeScrollbars', 'false');
                    this.cache.push(widget);
                    switch (scrollName) {
                        case VIEW_ANDROID.SCROLL_HORIZONTAL:
                            layout.css('width', node.styleMap.width);
                            layout.css('minWidth', node.styleMap.minWidth);
                            layout.css('overflowX', node.styleMap.overflowX);
                            break;
                        default:
                            layout.css('height', node.styleMap.height);
                            layout.css('minHeight', node.styleMap.minHeight);
                            layout.css('overflowY', node.styleMap.overflowY);
                    }
                    const indent = padLeft(scrollDepth--);
                    preXml = indent + `<${scrollName}{@${layout.id}}>\n` + preXml;
                    postXml += indent + `</${scrollName}>\n`;
                    if (current === node) {
                        node.parent = widget;
                        renderParent = widget;
                    }
                    current = widget;
                    return layout;
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
                    current = <Widget> item as T;
                });
        }
        node.apply(options);
        node.applyCustomizations();
        node.render(renderParent);
        node.setGravity();
        this.setGridSpace(node);
        return this.getEnclosingTag(node.renderDepth, Widget.getViewName(viewName), node.id, `{${node.id}}`, preXml, postXml);
    }

    public renderTag(node: T, parent: T, viewName: number | string, recursive = false) {
        const element: any = node.element;
        if (typeof viewName === 'number') {
            viewName = Widget.getViewName(viewName);
        }
        node.setViewId((<string> viewName));
        switch (element.tagName) {
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
        }
        switch (node.viewName) {
            case VIEW_ANDROID.EDIT:
                node.android('inputType', 'text');
                break;
            case VIEW_ANDROID.BUTTON:
                if (node.viewWidth === 0) {
                    node.android('minWidth', '0px');
                }
                if (node.viewHeight === 0) {
                    node.android('minHeight', '0px');
                }
                break;
        }
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
        switch (element.type) {
            case 'radio':
                if (!recursive) {
                    const result = (<U> node.parentOriginal.children.filter((radio: T) => ((<HTMLInputElement> radio.element).type === 'radio' && (<HTMLInputElement> radio.element).name === element.name)));
                    let xml = '';
                    if (result.length > 1) {
                        const layout = new Layout(this.cache.nextId, node, parent, result);
                        const widget = (<Widget> layout) as T;
                        let checked: string = '';
                        this.cache.push(widget);
                        layout.setViewId(VIEW_ANDROID.RADIO_GROUP);
                        layout.render(parent);
                        result.forEach((radio: T) => {
                            layout.inheritGrid(radio);
                            if ((<HTMLInputElement> radio.element).checked) {
                                checked = radio.stringId;
                            }
                            radio.parent = layout;
                            radio.render(layout);
                            xml += this.renderTag(radio, widget, VIEW_STANDARD.RADIO, true);
                        });
                        layout.android('orientation', (<U> layout.children).linearX ? 'horizontal' : 'vertical');
                        if (checked !== '') {
                            layout.android('checkedButton', checked);
                        }
                        layout.setBounds();
                        this.setGridSpace(widget);
                        return this.getEnclosingTag(layout.renderDepth, VIEW_ANDROID.RADIO_GROUP, layout.id, xml);
                    }
                }
                break;
            case 'password':
                node.android('inputType', 'textPassword');
                break;
        }
        node.applyCustomizations();
        node.render(parent);
        node.setGravity();
        node.setAccessibility();
        node.cascade().forEach((item: T) => item.hide());
        this.setGridSpace(node);
        return this.getEnclosingTag(node.renderDepth, node.viewName, node.id);
    }

    public createWrapper(node: T, parent: T, children: U) {
        const layout = new Layout(this.cache.nextId, node, parent, children);
        children.forEach((child: T) => {
            child.parent = layout;
            layout.inheritGrid(child);
        });
        layout.setBounds();
        return (<Widget> layout) as T;
    }

    public getStaticTag(tagName: number, depth: number, options: {}, width = 'wrap_content', height = 'wrap_content') {
        const node = new Widget(0, SETTINGS.targetAPI);
        node.setViewId(Widget.getViewName(tagName));
        let attributes = '';
        if (SETTINGS.showAttributes) {
            node.apply(options);
            node.android('id', node.stringId);
            node.android('layout_width', width);
            node.android('layout_height', height);
            const indent = padLeft(depth + 1);
            attributes = node.combine().map(value => `\n${indent + value}`).join('');
        }
        return [this.getEnclosingTag(depth, node.viewName, 0).replace('{@0}', attributes), node.stringId];
    }

    public replaceInlineAttributes(output: string, node: T, options: {}) {
        node.setViewLayout();
        node.namespaces.forEach((value: string) => options[value] = true);
        return output.replace(`{@${node.id}}`, this.parseAttributes(node));
    }

    public getRootAttributes(options: {}) {
        return Object.keys(options).sort().map(value => (XMLNS_ANDROID[value.toUpperCase()] != null ? `\n\t${XMLNS_ANDROID[value.toUpperCase()]}` : '')).join('');
    }

    private parseAttributes(node: T) {
        let output = '';
        const attributes = node.combine();
        if (attributes.length > 0) {
            const indent = padLeft(node.renderDepth + 1);
            for (let i = 0; i < attributes.length; i++) {
                if (attributes[i].startsWith('android:id=')) {
                    attributes.unshift(...attributes.splice(i, 1));
                    break;
                }
            }
            output = (node.renderDepth === 0 ? '{@0}' : '') + attributes.map((value: string) => `\n${indent + value}`).join('');
        }
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
                    this.prependBefore(node.id, this.getStaticTag(VIEW_STANDARD.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightTop))[0]);
                }
            }
            if (node.gridRowStart) {
                let marginLeft = dimensions.marginLeft + dimensions.paddingLeft;
                if (marginLeft > 0) {
                    marginLeft = convertPX(marginLeft + node.marginLeft);
                    node.css('marginLeft', marginLeft);
                    node.android(parseRTL(BOX_ANDROID.MARGIN_LEFT), marginLeft);
                }
            }
            if (node.gridRowEnd) {
                const heightBottom = dimensions.marginBottom + dimensions.paddingBottom + (!node.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
                let marginRight = dimensions.marginRight + dimensions.paddingRight;
                if (heightBottom > 0) {
                    this.appendAfter(node.id, this.getStaticTag(VIEW_STANDARD.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightBottom))[0]);
                }
                if (marginRight > 0) {
                    marginRight = convertPX(marginRight + node.marginRight);
                    node.css('marginRight', marginRight);
                    node.android(parseRTL(BOX_ANDROID.MARGIN_RIGHT), marginRight);
                }
            }
        }
    }

    private setAlignParent(node: T, orientation = '', bias = false) {
        const map = LAYOUT_MAP.constraint;
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
        const map = LAYOUT_MAP.constraint;
        const beginPercent = `layout_constraintGuide_${(percent !== -1 ? 'percent' : 'begin')}`;
        ['horizontal', 'vertical'].forEach((value, index) => {
            if ((orientation === '' && !node.constraint[value]) || orientation === value) {
                const position = (index === 0 ? 'left' : 'top');
                const options = {
                    android: {
                        orientation: (index === 0 ? 'vertical' : 'horizontal')
                    },
                    app: {
                        [beginPercent]: (percent !== -1 ? percent : formatPX(Math.max(node.bounds[position] - parent.box[position], 0)))
                    }
                };
                const LRTB = (index === 0 ? (!opposite ? 'left' : 'right') : (!opposite ? 'top' : 'bottom'));
                const RLBT = (index === 0 ? (!opposite ? 'right' : 'left') : (!opposite ? 'bottom' : 'top'));
                const [xml, id] = this.getStaticTag(VIEW_STANDARD.GUIDELINE, node.renderDepth, options);
                this.appendAfter(node.id, xml, -1);
                node.app(map[LRTB], id);
                node.delete('app', map[RLBT]);
                node.constraint[value] = true;
            }
        });
    }

    private deleteConstraints(node: T, orientation = '') {
        const map = LAYOUT_MAP.constraint;
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
        return this.cache.find(node => node.android('id') === id);
    }

    private adjustMargins(nodes: T[]) {
        for (const node of nodes) {
            if (node.constraint.marginHorizontal != null) {
                const offset = node.linear.left - this.findByAndroidId(node.constraint.marginHorizontal).linear.right;
                if (offset >= 1) {
                    node.modifyBox(BOX_STANDARD.MARGIN_LEFT, offset);
                }
            }
            if (node.constraint.marginVertical != null) {
                const offset = node.linear.top - this.findByAndroidId(node.constraint.marginVertical).linear.bottom;
                if (offset >= 1) {
                    node.modifyBox(BOX_STANDARD.MARGIN_TOP, offset);
                }
            }
        }
    }
}