import { WIDGET_ANDROID } from './lib/constants';
import { convertPX, formatPX, indexOf, same, search, withinFraction, withinRange } from './lib/util';
import { NODE_CACHE } from './cache';
import { addViewAfter, getStaticTag } from './render';
import Widget from './android/widget';
import parseRTL from './lib/localization';
import SETTINGS from './settings';

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

function setAlignParent(node: Widget, orientation = '', bias = false) {
    const map = LAYOUT_MAP.constraint;
    ['horizontal', 'vertical'].forEach((value, index) => {
        if (orientation === '' || value === orientation) {
            node.app(map[(index === 0 ? 'left' : 'top')], 'parent')
                .app(map[(index === 0 ? 'right' : 'bottom')], 'parent')
                .constraint[value] = true;
            if (bias) {
                node.app(`layout_constraint${value.charAt(0).toUpperCase() + value.substring(1)}_bias`, node[`${value}Bias`]);
            }
        }
    });
}

function createGuideline(parent: Widget, node: Widget, orientation = '', opposite = false, percent = -1) {
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
            const [xml, id] = getStaticTag(WIDGET_ANDROID.GUIDELINE, node.renderDepth, options);
            addViewAfter(node.id, xml);
            node.app(map[LRTB], id)
                .delete('app', map[RLBT])
                .constraint[value] = true;
        }
    });
}

function deleteConstraints(node: Widget, orientation = '') {
    const map = LAYOUT_MAP.constraint;
    if (orientation === '' || orientation === 'horizontal') {
        node.delete('app', map['leftRight'], map['rightLeft'])
            .constraint.horizontal = false;
    }
    if (orientation === '' || orientation === 'vertical') {
        node.delete('app', map['bottomTop'], map['topBottom'], map['baseline'])
            .constraint.vertical = false;
    }
}

function findByAndroidId(id: string) {
    return NODE_CACHE.find(node => node.android('id') === id);
}

function adjustMargins(nodes: Widget[]) {
    for (const node of nodes) {
        if (node.constraint.marginHorizontal != null) {
            const offset = node.linear.left - findByAndroidId(node.constraint.marginHorizontal).linear.right;
            if (offset >= 1) {
                node.modifyBox('layout_marginLeft', offset);
            }
        }
        if (node.constraint.marginVertical != null) {
            const offset = node.linear.top - findByAndroidId(node.constraint.marginVertical).linear.bottom;
            if (offset >= 1) {
                node.modifyBox('layout_marginTop', offset);
            }
        }
    }
}

export function setConstraints() {
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
    for (const node of NODE_CACHE.visible) {
        const constraint = node.is(WIDGET_ANDROID.CONSTRAINT);
        const relative = node.is(WIDGET_ANDROID.RELATIVE);
        const flex = node.flex;
        if (constraint || relative || flex.enabled) {
            node.expandDimensions();
            if (node.is(WIDGET_ANDROID.LINEAR)) {
                if (node.renderChildren.some((item: Widget) => item.flex.direction.indexOf('row') !== -1)) {
                    node.constraint.layoutWidth = true;
                    node.constraint.expand = true;
                }
                if (node.renderChildren.some((item: Widget) => item.flex.direction.indexOf('column') !== -1)) {
                    node.constraint.layoutHeight = true;
                    node.constraint.expand = true;
                }
                continue;
            }
            const LAYOUT = LAYOUT_MAP[(relative ? 'relative' : 'constraint')];
            const nodes = node.renderChildren;
            if (!flex.enabled) {
                for (const current of nodes) {
                    if (withinRange(parseFloat(current.horizontalBias), 0.5, 0.01) && withinRange(parseFloat(current.verticalBias), 0.5, 0.01)) {
                        if (constraint) {
                            setAlignParent(current);
                        }
                        else {
                            current.android('layout_centerInParent', 'true');
                            current.constraint.horizontal = true;
                            current.constraint.vertical = true;
                        }
                        node.constraint.layoutWidth = true;
                        node.constraint.layoutHeight = true;
                    }
                }
                nodes.unshift(node);
                for (let current of nodes) {
                    for (let adjacent of nodes) {
                        if (current === adjacent) {
                            continue;
                        }
                        else if (constraint) {
                            let bounds1 = current.bounds;
                            let bounds2 = adjacent.bounds;
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
                                    const baseline = (current.is(WIDGET_ANDROID.TEXT) && current.style.verticalAlign === 'baseline' && adjacent.is(WIDGET_ANDROID.TEXT) && adjacent.style.verticalAlign === 'baseline');
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
                                continue;
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
                                const bounds1 = current.bounds;
                                const bounds2 = adjacent.bounds;
                                if ((bounds1.top === bounds2.top || bounds1.bottom === bounds2.bottom) && withinRange(bounds1.left, bounds2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                    current.anchor(LAYOUT['leftRight'], adjacent, (adjacent.constraint.horizontal ? 'horizontal' : null));
                                    if (adjacent.constraint.horizontal) {
                                        current.delete('android', parseRTL('layout_alignParentRight'));
                                    }
                                }
                                if (adjacent.constraint.vertical && withinRange(bounds1.top, bounds2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                    current.anchor(LAYOUT['topBottom'], adjacent, (adjacent.constraint.vertical ? 'vertical' : null));
                                    if (adjacent.constraint.vertical) {
                                        current.delete('android', 'layout_alignParentBottom');
                                    }
                                }
                                if (adjacent.constraint.horizontal) {
                                    if (bounds1.bottom === bounds2.bottom) {
                                        current.anchor(LAYOUT['bottom'], adjacent, (adjacent.constraint.vertical ? 'vertical' : null));
                                        if (adjacent.constraint.vertical) {
                                            current.delete('android', 'layout_alignParentBottom');
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                nodes.shift();
                for (const current of nodes) {
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
                        const position = [];
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
                }
            }
            if (flex.enabled || (constraint && SETTINGS.useConstraintChain && !nodes.intersect())) {
                let flexNodes: Array<{}> = null;
                if (flex.enabled) {
                    let horizontalChain: Widget[] = nodes.slice();
                    let verticalChain: Widget[] = nodes.slice();
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
                    for (const current of nodes) {
                        let horizontalChain = nodes.filter((item: Widget) => same(current, item, 'bounds.top'));
                        if (horizontalChain.length === 0) {
                            horizontalChain = nodes.filter((item: Widget) => same(current, item, 'bounds.bottom'));
                        }
                        if (horizontalChain.length > 0) {
                            horizontalChain.sortAsc('bounds.x');
                        }
                        let verticalChain = nodes.filter((item: Widget) => same(current, item, 'bounds.left'));
                        if (verticalChain.length === 0) {
                            verticalChain = nodes.filter((item: Widget) => same(current, item, 'bounds.right'));
                        }
                        if (verticalChain.length > 0) {
                            verticalChain.sortAsc('bounds.y');
                        }
                        current.constraint.horizontalChain = horizontalChain;
                        current.constraint.verticalChain = verticalChain;
                    }
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
                    const chainNodes = flexNodes || nodes.slice().sort((a: Widget, b: Widget) => (a.constraint[value].length >= b.constraint[value].length ? -1 : 1));
                    for (const current of chainNodes) {
                        const chainDirection = current.constraint[value];
                        if (chainDirection != null && chainDirection.length > 0 && (flex.enabled || chainDirection.map((item: Widget) => parseInt((item.constraint[value] || [{ id: 0 }]).map((result: any) => result.id).join(''))).reduce((a: number, b: number) => (a === b ? a : 0)) > 0)) {
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
                            chainDirection.parent = node;
                            for (let i = 0; i < chainDirection.length; i++) {
                                const chain = chainDirection[i];
                                const next = chainDirection[i + 1];
                                const previous = chainDirection[i - 1];
                                if (node.flex.enabled) {
                                    if (chain.linear[TL] === node.box[TL] && chain.linear[BR] === node.box[BR]) {
                                        setAlignParent(chain, orientationInverse);
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
                                    if (min != null) {
                                        chain.app(`layout_constraint${WH}_min`, convertPX(min));
                                        chain.styleMap[`min${WH}`] = null;
                                    }
                                    if (max != null) {
                                        chain.app(`layout_constraint${WH}_max`, convertPX(max));
                                        chain.styleMap[`max${WH}`] = null;
                                    }
                                }
                                if (flex.enabled) {
                                    const map = LAYOUT_MAP.constraint;
                                    chain.app(`layout_constraint${HV}_weight`, chain.flex.grow);
                                    if (chain[`view${WH}`] == null && chain.flex.grow === 0 && chain.flex.shrink <= 1) {
                                        chain.android(`layout_${dimension}`, 'wrap_content');
                                    }
                                    else if (chain.flex.grow > 0) {
                                        chain.android(`layout_${dimension}`, (node.renderParent.is(WIDGET_ANDROID.LINEAR) && node.renderParent.constraint.expand && node.flex.direction.indexOf('row') !== -1 ? 'wrap_content' : '0px'));
                                    }
                                    if (chain.flex.shrink === 0) {
                                        chain.app(`layout_constrained${WH}`, 'true');
                                    }
                                    switch (chain.flex.alignSelf) {
                                        case 'flex-start':
                                            chain
                                                .app(map[TL], 'parent')
                                                .constraint[orientationInverse] = true;
                                            break;
                                        case 'flex-end':
                                            chain
                                                .app(map[BR], 'parent')
                                                .constraint[orientationInverse] = true;
                                            break;
                                        case 'baseline':
                                            chain
                                                .app(map['baseline'], 'parent')
                                                .constraint.vertical = true;
                                            break;
                                        case 'center':
                                        case 'stretch':
                                            if (chain.flex.alignSelf === 'center') {
                                                chain.app(`layout_constraint${VH}_bias`, 0.5);
                                            }
                                            else {
                                                chain.android(`layout_${HW.toLowerCase()}`, '0px');
                                            }
                                            setAlignParent(chain, orientationInverse);
                                            break;
                                    }
                                    if (chain.flex.basis !== 'auto') {
                                        if (/(100|[1-9][0-9]?)%/.test(chain.flex.basis)) {
                                            chain.app(`layout_constraint${WH}_percent`, parseInt(chain.flex.basis));
                                        }
                                        else {
                                            const width = convertPX(chain.flex.basis);
                                            if (width !== '0px') {
                                                chain.app(`layout_constraintWidth_min`, width);
                                                chain.styleMap.minWidth = null;
                                            }
                                        }
                                    }
                                }
                            }
                            firstNode
                                .app(LAYOUT[LT], 'parent')
                                .constraint[orientation] = true;
                            lastNode
                                .app(LAYOUT[RB], 'parent')
                                .constraint[orientation] = true;
                            const chainStyle = `layout_constraint${HV}_chainStyle`;
                            if (flex.enabled && flex.justifyContent !== 'normal' && Math.max.apply(null, chainDirection.map((item: Widget) => item.flex.grow)) === 0) {
                                switch (flex.justifyContent) {
                                    case 'space-between':
                                        firstNode.app(chainStyle, 'spread_inside');
                                        break;
                                    case 'space-evenly':
                                        firstNode.app(chainStyle, 'spread');
                                        chainDirection.forEach((item: Widget) => item.app(`layout_constraint${HV}_weight`, item.flex.grow || 1));
                                        break;
                                    case 'space-around':
                                        const leftTop = (index === 0 ? 'left' : 'top');
                                        const percent = (firstNode.bounds[leftTop] - node.box[leftTop]) / node.box[dimension];
                                        firstNode.app(`layout_constraint${HV}_chainStyle`, 'spread_inside');
                                        createGuideline(node, firstNode, orientation, false, parseFloat(percent.toFixed(2)));
                                        createGuideline(node, lastNode, orientation, true, parseFloat((1 - percent).toFixed(2)));
                                        break;
                                    default:
                                        let bias = 0.5;
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
                                        switch (justifyContent) {
                                            case 'flex-start':
                                                bias = 0;
                                                break;
                                            case 'flex-end':
                                                bias = 1;
                                                break;
                                        }
                                        firstNode
                                            .app(chainStyle, 'packed')
                                            .app(`layout_constraint${HV}_bias`, bias);
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
                                    adjustMargins(chainDirection);
                                }
                                else {
                                    firstNode.app(chainStyle, 'spread');
                                }
                                if (requireBias) {
                                    firstNode.app(`layout_constraint${HV}_bias`, firstNode[`${orientation}Bias`]);
                                }
                                if (!flex.enabled) {
                                    for (const chain of chainDirection) {
                                        chain.constraint.horizontalChain = [];
                                        chain.constraint.verticalChain = [];
                                    }
                                }
                            }
                        }
                    }
                });
            }
            if (!flex.enabled) {
                const anchors = nodes.anchors;
                if (constraint) {
                    if (anchors.length === 0) {
                        const unbound = nodes.sortAsc('bounds.x', 'bounds.y')[0];
                        if (SETTINGS.useConstraintGuideline) {
                            createGuideline(node, unbound);
                        }
                        else {
                            setAlignParent(unbound, '', true);
                        }
                        anchors.push(unbound);
                    }
                }
                do {
                    let restart = false;
                    for (const current of nodes) {
                        if (!current.anchored) {
                            const result = (constraint ? search(current.app(), '*constraint*') : search(current.android(), LAYOUT));
                            for (const [key, value] of result) {
                                if (value !== 'parent') {
                                    if (anchors.find((item: Widget) => item.stringId === value) != null) {
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
                    }
                    if (!restart) {
                        break;
                    }
                }
                while (true);
                if (constraint) {
                    for (const opposite of nodes) {
                        if (!opposite.anchored) {
                            deleteConstraints(node);
                            if (SETTINGS.useConstraintGuideline) {
                                createGuideline(node, opposite);
                            }
                            else {
                                const adjacent = nodes.anchors[0];
                                const center1 = opposite.center;
                                const center2 = adjacent.center;
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
                                opposite
                                    .app('layout_constraintCircle', adjacent.stringId)
                                    .app('layout_constraintCircleRadius', formatPX(radius))
                                    .app('layout_constraintCircleAngle', degrees);
                                opposite.constraint.vertical = true;
                                opposite.constraint.horizontal = true;
                            }
                        }
                    }
                    nodes.forEach((current: Widget) => {
                        if (current.app(LAYOUT['right']) === 'parent' && current.app(LAYOUT['leftRight']) == null) {
                            node.constraint.layoutWidth = true;
                        }
                        if (current.app(LAYOUT['bottom']) === 'parent' && current.app(LAYOUT['topBottom']) == null) {
                            node.constraint.layoutHeight = true;
                        }
                    });
                }
                else {
                    for (const current of nodes) {
                        const parentRight = current.android(parseRTL('layout_alignParentRight'));
                        const parentBottom = current.android('layout_alignParentBottom');
                        if (!anchors.includes(current)) {
                            const parentLeft = parseRTL('layout_alignParentLeft');
                            current.delete('android', LAYOUT);
                            if (current.android(parentLeft) !== 'true') {
                                const left = formatPX(current.bounds.left - node.box.left);
                                current
                                    .css(parseRTL('marginLeft'), left)
                                    .android(parentLeft, 'true')
                                    .android(parseRTL('layout_marginLeft'), left);
                            }
                            if (parentBottom !== 'true') {
                                const top = formatPX(current.bounds.top - node.box.top);
                                current
                                    .css('marginTop', top)
                                    .android('layout_alignParentTop', 'true')
                                    .android('layout_marginTop', top);
                            }
                            current.constraint.vertical = true;
                            current.constraint.horizontal = true;
                        }
                        else {
                            adjustMargins([current]);
                        }
                        if (parentRight === 'true' && current.android(LAYOUT['leftRight']) == null) {
                            node.constraint.layoutWidth = true;
                        }
                        if (parentBottom === 'true' && current.android(LAYOUT['topBottom']) == null) {
                            node.constraint.layoutHeight = true;
                        }
                    }
                }
            }
        }
    }
}