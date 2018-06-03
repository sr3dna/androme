import { WIDGET_ANDROID, FIXED_ANDROID } from './lib/constants';
import parseRTL from './localization';
import { convertPX, convertInt, formatPX, search, indexOf, same, withinFraction, withinRange } from './lib/util';
import NodeList from './nodelist';
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

function setNodePosition(current, position, adjacent) {
    let androidId = (adjacent.androidId != 'parent' ? adjacent.stringId : 'parent');
    const overwrite = (androidId == 'parent');
    if (current.renderParent.isView(WIDGET_ANDROID.CONSTRAINT)) {
        current.app(LAYOUT_MAP.constraint[position], androidId, overwrite);
    }
    else {
        current.android(LAYOUT_MAP.relative[position], androidId, overwrite);
    }
    current.constraint[position] = androidId;
    adjacent.constraint[position] = current.stringId;
}

function setConstraintPercent(parent, nodes, index) {
    let percentTotal = 0;
    let full = false;
    switch (index) {
        case 0:
            full = (nodes.last.linear.right >= parent.flex.right);
            break;
        case 1:
            full = (nodes.last.linear.bottom >= parent.box.bottom);
            break;
    }
    nodes[0].app(`layout_constraint${(index ? 'Horizontal' : 'Vertical')}_chainStyle`, 'spread');
    for (let i = 0; i < nodes.length; i++) {
        const current = nodes[i];
        const previous = nodes[i - 1];
        let percent = ((current.linear.right - parent.box.left) - (previous != null ? previous.linear.right - parent.box.left : 0)) / parent.box.width;
        percent = (full && i == nodes.length - 1 ? 1 - percentTotal : parseFloat(percent.toFixed(2)));
        current
            .android(`layout_${(index == 0 ? 'width' : 'height')}`, (FIXED_ANDROID.includes(current.widgetName) ? 'wrap_content' : '0px'))
            .app(`layout_constraint${(index == 0 ? 'Width' : 'Height')}_percent`, percent);
        percentTotal += percent;
    }
}

export function positionViews(node) {
    Object.assign(LAYOUT_MAP.relative, {
        right: parseRTL('layout_alignRight'),
        left: parseRTL('layout_alignLeft'),
        rightLeft: parseRTL('layout_toLeftOf'),
        leftRight: parseRTL('layout_toRightOf')
    });
    Object.assign(LAYOUT_MAP.constraint, {
        right: parseRTL('layout_constraintRight_toRightOf'),
        left: parseRTL('layout_constraintLeft_toLeftOf'),
        rightLeft: parseRTL('layout_constraintRight_toLeftOf'),
        leftRight: parseRTL('layout_constraintLeft_toRightOf')
    });
    const constraint = node.isView(WIDGET_ANDROID.CONSTRAINT);
    const relative = node.isView(WIDGET_ANDROID.RELATIVE);
    const flex = node.flex;
    if (constraint || relative || flex.enabled) {
        const LAYOUT = LAYOUT_MAP[(relative ? 'relative' : 'constraint')];
        const nodes = node.renderChildren;
        if (!flex.enabled) {
            node.expandToFit();
            for (const current of nodes) {
                if (withinRange(parseFloat(current.horizontalBias), 0.5, 0.01) && withinRange(parseFloat(current.verticalBias), 0.5, 0.01)) {
                    if (constraint) {
                        current
                            .app(LAYOUT['top'], 'parent')
                            .app(LAYOUT['right'], 'parent')
                            .app(LAYOUT['bottom'], 'parent')
                            .app(LAYOUT['left'], 'parent');
                    }
                    else {
                        current.android('layout_centerInParent', 'true');
                    }
                    node.constraint.layoutWidth = true;
                    node.constraint.layoutHeight = true;
                    current.constraint.horizontal = true;
                    current.constraint.vertical = true;
                }
            }
            nodes.unshift(node);
            for (let current of nodes) {
                for (let adjacent of nodes) {
                    if (current == adjacent || (relative && current == node)) {
                        continue;
                    }
                    else if (relative && adjacent == node) {
                        if (current.linear.left == node.box.left) {
                            current
                                .android(parseRTL('layout_alignParentLeft'), 'true')
                                .constraint.horizontal = true;
                        }
                        if (withinRange(current.linear.right, node.box.right, SETTINGS.whitespaceHorizontalOffset)) {
                            current
                                .android(parseRTL('layout_alignParentRight'), 'true')
                                .constraint.horizontal = true;
                        }
                        if (current.linear.top == node.box.top) {
                            current
                                .android('layout_alignParentTop', 'true')
                                .constraint.vertical = true;
                        }
                        if (current.linear.bottom == node.box.bottom) {
                            current
                                .android('layout_alignParentBottom', 'true')
                                .constraint.vertical = true;
                        }
                    }
                    else {
                        let parent = false;
                        let dimCur = 'bounds';
                        let dimAdj = 'bounds';
                        if (current == node || adjacent == node) {
                            if (current == node) {
                                current = adjacent;
                            }
                            adjacent = Object.assign({}, node);
                            adjacent.androidId = 'parent';
                            dimCur = 'linear';
                            dimAdj = 'box';
                            parent = true;
                        }
                        if (parent) {
                            if (current[dimCur].left == adjacent[dimAdj].left) {
                                setNodePosition(current, 'left', adjacent);
                                current.constraint.horizontal = true;
                            }
                            if (withinRange(current[dimCur].right, adjacent[dimAdj].right, SETTINGS.whitespaceHorizontalOffset)) {
                                setNodePosition(current, 'right', adjacent);
                                current.constraint.horizontal = true;
                            }
                        }
                        else if (!current.constraint.horizontal) {
                            if (current.viewWidth == 0 && current[dimCur].left == adjacent[dimAdj].left && current[dimCur].right == adjacent[dimAdj].right) {
                                setNodePosition(current, 'left', adjacent);
                                setNodePosition(current, 'right', adjacent);
                            }
                            const withinY = (SETTINGS.horizontalPerspective && (current[dimCur].top == adjacent[dimAdj].top || current[dimCur].bottom == adjacent[dimAdj].bottom));
                            if (withinFraction(current[dimCur].right, adjacent[dimAdj].left) || (withinY && withinRange(current[dimCur].right, adjacent[dimAdj].left, SETTINGS.whitespaceHorizontalOffset))) {
                                setNodePosition(current, 'rightLeft', adjacent);
                            }
                            if (withinFraction(adjacent[dimAdj].right, current[dimCur].left) || (withinY && withinRange(current[dimCur].left, adjacent[dimAdj].right, SETTINGS.whitespaceHorizontalOffset))) {
                                setNodePosition(current, 'leftRight', adjacent);
                            }
                        }
                        if (parent) {
                            if (current[dimCur].top == adjacent[dimAdj].top) {
                                setNodePosition(current, 'top', adjacent);
                                current.constraint.vertical = true;
                            }
                            if (current[dimCur].bottom == adjacent[dimAdj].bottom) {
                                setNodePosition(current, 'bottom', adjacent);
                                current.constraint.vertical = true;
                            }
                        }
                        else if (!current.constraint.vertical) {
                            if (current.viewHeight == 0 && current[dimCur].top == adjacent[dimAdj].top && current[dimCur].bottom == adjacent[dimAdj].bottom) {
                                const baseline = (current.isView(WIDGET_ANDROID.TEXT) && current.style.verticalAlign == 'baseline' && adjacent.isView(WIDGET_ANDROID.TEXT) && adjacent.style.verticalAlign == 'baseline');
                                setNodePosition(current, (baseline ? 'baseline' : 'top'), adjacent);
                                setNodePosition(current, 'bottom', adjacent);
                            }
                            const withinX = (!SETTINGS.horizontalPerspective && (current[dimCur].left == adjacent[dimAdj].left || current[dimCur].right == adjacent[dimAdj].right));
                            if (current[dimCur].bottom == adjacent[dimAdj].top || (withinX && withinRange(current[dimCur].bottom, adjacent[dimAdj].top, SETTINGS.whitespaceVerticalOffset))) {
                                setNodePosition(current, 'bottomTop', adjacent);
                            }
                            if (current[dimCur].top == adjacent[dimAdj].bottom || (withinX && withinRange(current[dimCur].top, adjacent[dimAdj].bottom, SETTINGS.whitespaceVerticalOffset))) {
                                setNodePosition(current, 'topBottom', adjacent);
                            }
                        }
                    }
                }
            }
            nodes.shift();
        }
        if (flex.enabled || (constraint && SETTINGS.useConstraintChain && !nodes.intersect())) {
            let flexNodes = null;
            if (flex.enabled) {
                let horizontalChain = nodes.slice();
                let verticalChain = nodes.slice();
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
                flexNodes = [{ constraint: { horizontalChain, verticalChain }}];
            }
            else {
                for (const current of nodes) {
                    let horizontalChain = nodes.filter(item => same(current, item, 'bounds.top'));
                    if (horizontalChain.length == 0) {
                        horizontalChain = nodes.filter(item => same(current, item, 'bounds.bottom'));
                    }
                    if (horizontalChain.length > 0) {
                        horizontalChain.sortAsc('bounds.x');
                    }
                    let verticalChain = nodes.filter(item => same(current, item, 'bounds.left'));
                    if (verticalChain.length == 0) {
                        verticalChain = nodes.filter(item => same(current, item, 'bounds.right'));
                    }
                    if (verticalChain.length > 0) {
                        verticalChain.sortAsc('bounds.y');
                    }
                    current.constraint.horizontalChain = horizontalChain;
                    current.constraint.verticalChain = verticalChain;
                }
            }
            CHAIN_MAP.direction.forEach((value, index) => {
                const chainNodes = flexNodes || nodes.slice().sort((a, b) => (a.constraint[value].length >= b.constraint[value].length ? -1 : 1));
                for (const current of chainNodes) {
                    const chainDirection = current.constraint[value];
                    if (chainDirection != null && chainDirection.length > 1 && (flex.enabled || chainDirection.map(item => parseInt((item.constraint[value] || [{ id: 0 }]).map(item => item.id).join(''))).reduce((a, b) => (a == b ? a : 0)) > 0)) {
                        chainDirection.parent = node;
                        const HV = CHAIN_MAP['horizontalVertical'][index];
                        const VH = CHAIN_MAP['horizontalVertical'][(index == 0 ? 1 : 0)];
                        const WH = CHAIN_MAP['widthHeight'][index];
                        const LAYOUT_WH = `layout_${WH.toLowerCase()}`;
                        const leftTop = CHAIN_MAP['leftTop'][index];
                        const rightBottom = CHAIN_MAP['rightBottom'][index];
                        const firstNode = chainDirection.first;
                        const lastNode = chainDirection.last;
                        let maxOffset = -1;
                        const unassigned = new NodeList();
                        for (let i = 0; i < chainDirection.length; i++) {
                            const current = chainDirection[i];
                            const next = chainDirection[i + 1];
                            const previous = chainDirection[i - 1];
                            if (index == 0) {
                                current.delete('app', `*constraint${parseRTL('Left')}*`, `*constraint${parseRTL('Right')}*`);
                            }
                            else {
                                current.delete('app', '*constraintTop*', '*constraintBottom*', '*constraintBaseline*');
                            }
                            if (next != null) {
                                current.app(LAYOUT[CHAIN_MAP['rightLeftBottomTop'][index]], next.stringId);
                                maxOffset = Math.max(next.linear[leftTop] - current.linear[rightBottom], maxOffset);
                            }
                            if (previous != null) {
                                current.app(LAYOUT[CHAIN_MAP['leftRightTopBottom'][index]], previous.stringId);
                            }
                            if (current[`view${WH}`] == null) {
                                current.android(LAYOUT_WH, '0px');
                                const min = current.styleMap[`min${WH}`];
                                const max = current.styleMap[`max${WH}`];
                                if (min != null) {
                                    current.app(`layout_constraint${WH}_min`, convertPX(min));
                                }
                                if (max != null) {
                                    current.app(`layout_constraint${WH}_max`, convertPX(max));
                                }
                                else {
                                    unassigned.push(current);
                                }
                            }
                            if (flex.enabled) {
                                const CONSTRAINT = LAYOUT_MAP.constraint;
                                const LAYOUT_VH = VH.toLowerCase();
                                current.app(`layout_constraint${HV}_weight`, current.flex.grow);
                                if (current[`view${WH}`] == null && current.flex.grow == 0 && current.flex.shrink <= 1) {
                                    current.android(LAYOUT_WH, 'wrap_content');
                                }
                                else if (current.flex.grow > 0) {
                                    current.android(LAYOUT_WH, '0px');
                                }
                                if (current.flex.shrink == 0) {
                                    current.app(`layout_constrained${WH}`, 'true');
                                }
                                switch (current.flex.alignSelf) {
                                    case 'flex-start':
                                        current
                                            .app((index == 0 ? CONSTRAINT['top'] : parseRTL(CONSTRAINT['left'])), 'parent')
                                            .constraint[LAYOUT_VH] = true;
                                        break;
                                    case 'flex-end':
                                        current
                                            .app((index == 0 ? CONSTRAINT['bottom'] : parseRTL(CONSTRAINT['right'])), 'parent')
                                            .constraint[LAYOUT_VH] = true;
                                        break;
                                    case 'baseline':
                                        current
                                            .app(CONSTRAINT['baseline'], 'parent')
                                            .constraint.vertical = true;
                                        break;
                                    case 'center':
                                    case 'stretch':
                                        if (current.flex.alignSelf == 'center') {
                                            current.app(`layout_constraint${VH}_bias`, 0.5);
                                        }
                                        else {
                                            current.android(`layout_${CHAIN_MAP['widthHeight'][(index == 0 ? 1 : 0)].toLowerCase()}`, '0px');
                                        }
                                        current
                                            .app(CONSTRAINT[(index == 0 ? 'top' : 'left')], 'parent')
                                            .app(CONSTRAINT[(index == 0 ? 'bottom' : 'right')], 'parent')
                                            .constraint[LAYOUT_VH] = true;
                                        break;
                                }
                                if (current.flex.basis != 'auto') {
                                    if (/(100|[1-9][0-9]?)%/.test(current.flex.basis)) {
                                        current.app(`layout_constraint${WH}_percent`, parseInt(current.flex.basis));
                                    }
                                    else {
                                        const width = convertPX(current.flex.basis);
                                        if (width != '0px') {
                                            current.app(`layout_constraintWidth_min`, width);
                                        }
                                    }
                                }
                            }
                        }
                        firstNode
                            .app(LAYOUT[leftTop], 'parent')
                            .constraint[HV.toLowerCase()] = true;
                        lastNode
                            .app(LAYOUT[rightBottom], 'parent')
                            .constraint[HV.toLowerCase()] = true;
                        const chainStyle = `layout_constraint${HV}_chainStyle`;
                        if (flex.enabled && flex.justifyContent != 'normal' && chainDirection.reduce((a, b) => Math.max(a, b.flex.grow), -1) == 0) {
                            switch (flex.justifyContent) {
                                case 'space-between':
                                    firstNode.app(chainStyle, 'spread_inside');
                                    unassigned.android(LAYOUT_WH, 'wrap_content');
                                    break;
                                case 'space-evenly':
                                    setConstraintPercent(node, chainDirection, index);
                                    break;
                                case 'space-around':
                                    firstNode.app(chainStyle, 'spread');
                                    chainDirection.forEach(item => item.app(`layout_constraint${HV}_weight`, item.flex.grow || 1));
                                    unassigned.android(LAYOUT_WH, 'wrap_content');
                                    break;
                                default:
                                    let bias = 0.5;
                                    let justifyContent = flex.justifyContent;
                                    if (flex.direction == 'row-reverse' || flex.direction == 'column-reverse') {
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
                                        .app(`layout_constraint${HV}_bias`, bias, false);
                                    unassigned.android(LAYOUT_WH, 'wrap_content');
                            }
                        }
                        else {
                            let adjustMargins = false;
                            if (flex.enabled && withinFraction(node.box.left, firstNode.linear.left) && withinFraction(lastNode.linear.right, node.box.right)) {
                                firstNode.app(chainStyle, 'spread_inside');
                            }
                            else if (maxOffset <= SETTINGS[`chainPacked${HV}Offset`]) {
                                adjustMargins = true;
                            }
                            else if (chainDirection.anchored.length == 0) {
                                setConstraintPercent(node, chainDirection, index);
                            }
                            else {
                                adjustMargins = true;
                            }
                            if (adjustMargins) {
                                const bias = chainDirection[`${HV.toLowerCase()}Bias`];
                                firstNode
                                    .app(chainStyle, 'packed')
                                    .app(`layout_constraint${HV}_bias`, bias);
                                for (let i = 1; i < chainDirection.length; i++) {
                                    const current = chainDirection[i];
                                    let offset = (index == 0 ? current.linear.left - chainDirection[i - 1].linear.right : current.linear.top - chainDirection[i - 1].linear.bottom);
                                    if (offset > 0) {
                                        const margin = (index == 0 ? parseRTL('layout_marginLeft') : 'layout_marginTop');
                                        offset += convertInt(current.android(margin));
                                        current.android(margin, formatPX(offset));
                                    }
                                }
                                if (index == 0) {
                                    if (!firstNode.constraint.vertical) {
                                        firstNode
                                            .app(LAYOUT['top'], 'parent')
                                            .app(LAYOUT['bottom'], 'parent')
                                            .app(`layout_constraintVertical_bias`, firstNode.verticalBias);
                                    }
                                    if (bias == 1) {
                                        node.constraint.minWidth = formatPX(node.bounds.width);
                                        node.constraint.layoutWidth = true;
                                    }
                                }
                                else {
                                    if (!firstNode.constraint.horizontal) {
                                        firstNode
                                            .app(LAYOUT['left'], 'parent')
                                            .app(LAYOUT['right'], 'parent')
                                            .app(`layout_constraintHorizontal_bias`, firstNode.horizontalBias);
                                    }
                                    if (bias == 1) {
                                        node.constraint.minHeight = formatPX(node.bounds.height);
                                        node.constraint.layoutHeight = true;
                                    }
                                }
                                firstNode.constraint.horizontal = true;
                                firstNode.constraint.vertical = true;
                                unassigned.android(LAYOUT_WH, 'wrap_content');
                            }
                            if (!flex.enabled) {
                                for (const current of chainDirection) {
                                    current.constraint.horizontalChain = [];
                                    current.constraint.verticalChain = [];
                                }
                            }
                        }
                    }
                }
            });
        }
        if (!flex.enabled) {
            const anchored = nodes.anchored;
            if (constraint) {
                if (anchored.length == 0) {
                    const unbound = nodes.reduce((a, b) => (a.anchors >= b.anchors ? a : b), nodes[0]);
                    unbound.delete('app', '*constraint*');
                    unbound
                        .app(LAYOUT['left'], 'parent')
                        .app(LAYOUT['right'], 'parent')
                        .app('layout_constraintHorizontal_bias', unbound.horizontalBias)
                        .constraint.horizontal = true;
                    unbound
                        .app(LAYOUT['top'], 'parent')
                        .app(LAYOUT['bottom'], 'parent')
                        .app('layout_constraintVertical_bias', unbound.verticalBias)
                        .constraint.vertical = true;
                    anchored.push(unbound);
                    node.constraint.layoutWidth = true;
                    node.constraint.layoutHeight = true;
                }
            }
            do {
                let restart = false;
                for (const current of nodes) {
                    if (current.anchors < 2) {
                        const result = (constraint ? search(current.app(), '*constraint*') : search(current.android(), LAYOUT));
                        for (const [key, value] of result) {
                            if (value != 'parent') {
                                if (anchored.find(anchor => anchor.stringId == value) != null) {
                                    if (!current.constraint.horizontal && indexOf(key, parseRTL('Left'), parseRTL('Right')) != -1) {
                                        current.constraint.horizontal = true;
                                    }
                                    if (!current.constraint.vertical && indexOf(key, 'Top', 'Bottom', 'Baseline', 'above', 'below') != -1) {
                                        current.constraint.vertical = true;
                                    }
                                }
                            }
                        }
                        if (current.anchors == 2) {
                            anchored.push(current);
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
                    if (opposite.anchors < 2) {
                        const adjacent = nodes.anchored[0];
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
                            .delete('app', 'layout_constraint*')
                            .app('layout_constraintCircle', adjacent.stringId)
                            .app('layout_constraintCircleRadius', formatPX(radius))
                            .app('layout_constraintCircleAngle', degrees);
                        opposite.constraint.vertical = true;
                        opposite.constraint.horizontal = true;
                    }
                    if (opposite.constraint['right'] == 'parent') {
                        node.constraint.layoutWidth = true;
                    }
                    if (opposite.constraint['bottom'] == 'parent') {
                        node.constraint.layoutHeight = true;
                    }
                }
            }
            else {
                for (const current of nodes) {
                    const parentBottom = current.android('layout_alignParentBottom');
                    if (!anchored.includes(current)) {
                        const parentLeft = parseRTL('layout_alignParentLeft');
                        current.delete('android', LAYOUT);
                        if (parentBottom != 'true') {
                            const top = formatPX(current.bounds.top - node.box.top);
                            current
                                .android('layout_alignParentTop', 'true')
                                .android('layout_marginTop', top)
                                .css('marginTop', top);
                        }
                        if (current.android(parentLeft) != 'true') {
                            const left = formatPX(current.bounds.left - node.box.left);
                            current
                                .android(parentLeft, 'true')
                                .android(parseRTL('layout_marginLeft'), left)
                                .css(parseRTL('marginLeft'), left);
                        }
                        current.constraint.vertical = true;
                        current.constraint.horizontal = true;
                    }
                    if (current.android(parseRTL('layout_alignParentRight')) == 'true') {
                        node.constraint.layoutWidth = true;
                    }
                    if (parentBottom == 'true') {
                        node.constraint.layoutHeight = true;
                    }
                }
            }
        }
    }
}