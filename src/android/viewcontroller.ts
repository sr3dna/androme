import { Null, ObjectIndex, ObjectMap, Point, StringMap, ViewData } from '../lib/types';
import Controller from '../base/controller';
import NodeList from '../base/nodelist';
import Resource from '../base/resource';
import View from './view';
import ViewGroup from './viewgroup';
import ViewList from './viewlist';
import { capitalize, convertPX, formatPX, generateId, hasValue, includesEnum, indexOf, repeat, same, search, sortAsc, withinFraction, withinRange } from '../lib/util';
import { formatResource } from './extension/lib/util';
import { formatDimen, stripId } from '../lib/xml';
import { BOX_STANDARD, OVERFLOW_ELEMENT, NODE_PROCEDURE, NODE_STANDARD } from '../lib/constants';
import { NODE_ANDROID, WEBVIEW_ANDROID, XMLNS_ANDROID } from './constants';
import parseRTL from './localization';
import SETTINGS from '../settings';

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
            const nodes = (<U> new ViewList(node.renderChildren.filter(item => !item.isolated), node));
            const pageflow = (<U> new ViewList(nodes.list.filter(item => item.pageflow), node));
            const constraint = node.is(NODE_STANDARD.CONSTRAINT);
            const relative = node.is(NODE_STANDARD.RELATIVE);
            const flex = node.flex;
            if (nodes.length > 0 && (constraint || relative || flex.enabled)) {
                node.setBoundsMin();
                const LAYOUT: StringMap = LAYOUT_MAP[(relative ? 'relative' : 'constraint')];
                const linearX = pageflow.linearX;
                const verticalPerspective = (!SETTINGS.horizontalPerspective && !flex.enabled && !pageflow.list.some(item => item.floating));
                function mapParent(item: T, direction: string) {
                    if (constraint) {
                        return (item.app(LAYOUT[direction]) === 'parent');
                    }
                    else {
                        return (item.android(`layout_alignParent${capitalize(parseRTL(direction))}`) === 'true');
                    }
                }
                function mapDelete(item: T, ...direction: string[]) {
                    for (const attr of direction) {
                        item.delete((constraint ? 'app' : 'android'), LAYOUT[attr]);
                    }
                }
                if (relative || pageflow.length === 1) {
                    pageflow.list.forEach(current => {
                        if (withinRange(current.horizontalBias, 0.5, 0.01) && withinRange(current.verticalBias, 0.5, 0.01)) {
                            if (constraint) {
                                this.setAlignParent(current);
                                node.constraint.layoutWidth = true;
                                node.constraint.layoutHeight = true;
                            }
                            else {
                                current.android('layout_centerInParent', 'true');
                                current.constraint.horizontal = true;
                                current.constraint.vertical = true;
                            }
                        }
                    });
                }
                nodes.list.unshift(node);
                nodes.list.forEach(current => {
                    nodes.list.forEach(adjacent => {
                        if (current === adjacent || current.intersect(adjacent.linear)) {
                            return;
                        }
                        else {
                            let linear1 = current.linear;
                            let linear2 = adjacent.linear;
                            let stringId = adjacent.stringId;
                            const horizontal = (adjacent.constraint.horizontal ? 'horizontal' : '');
                            const vertical = (adjacent.constraint.vertical ? 'vertical' : '');
                            const withinY = current.withinY(adjacent.linear);
                            if (constraint) {
                                if (current === node || adjacent === node) {
                                    if (current === node) {
                                        current = adjacent;
                                    }
                                    linear1 = current.linear;
                                    linear2 = node.box;
                                    stringId = 'parent';
                                }
                                if (current.css('width') != null && current.styleMap.marginRight === 'auto' && current.styleMap.marginLeft === 'auto') {
                                    this.setAlignParent(current, 'horizontal');
                                }
                                else {
                                    if (stringId === 'parent') {
                                        if (linear1.left <= linear2.left || withinFraction(linear1.left, linear2.left)) {
                                            current.anchor(LAYOUT['left'], 'parent', 'horizontal');
                                        }
                                        if (linear1.right >= linear2.right || withinRange(linear1.right, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                            current.anchor(LAYOUT['right'], 'parent', 'horizontal');
                                        }
                                    }
                                    else {
                                        if (current.viewWidth === 0 && linear1.left === linear2.left && linear1.right === linear2.right) {
                                            current.anchor(LAYOUT['left'], stringId);
                                            current.anchor(LAYOUT['right'], stringId);
                                        }
                                        else if (verticalPerspective) {
                                            if (linear1.left === linear2.left) {
                                                current.anchor(LAYOUT['left'], stringId);
                                            }
                                            else if (linear1.right === linear2.right) {
                                                current.anchor(LAYOUT['right'], stringId);
                                            }
                                        }
                                        if (withinRange(linear1.left, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                            if (current.css('float') !== 'right') {
                                                current.anchor(LAYOUT['leftRight'], stringId, horizontal, current.withinX(linear2));
                                            }
                                            else {
                                                current.constraint.marginHorizontal = adjacent.stringId;
                                            }
                                        }
                                        if (withinRange(linear1.right, linear2.left, SETTINGS.whitespaceHorizontalOffset)) {
                                            if (current.css('float') !== 'left') {
                                                current.anchor(LAYOUT['rightLeft'], stringId, horizontal, current.withinX(linear2));
                                            }
                                        }
                                    }
                                }
                                if (stringId === 'parent') {
                                    if (linear1.top <= linear2.top || withinFraction(linear1.top, linear2.top)) {
                                        current.anchor(LAYOUT['top'], 'parent', 'vertical');
                                    }
                                    if (linear1.bottom >= linear2.bottom || withinFraction(linear1.bottom, linear2.bottom) || ((current.floating || (flex.direction === 'column' && flex.wrap !== 'nowrap')) && withinRange(linear1.bottom, linear2.bottom, SETTINGS.whitespaceHorizontalOffset))) {
                                        current.anchor(LAYOUT['bottom'], 'parent', 'vertical');
                                    }
                                }
                                else {
                                    const parentTop = mapParent(current, 'top');
                                    const parentBottom = mapParent(current, 'bottom');
                                    if (withinRange(linear1.top, linear2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                        if (withinY || !parentBottom) {
                                            current.anchor(LAYOUT['topBottom'], stringId, vertical, withinY);
                                        }
                                    }
                                    else if (withinRange(linear1.bottom, linear2.top, SETTINGS.whitespaceVerticalOffset)) {
                                        if (withinY || !parentTop) {
                                            current.anchor(LAYOUT['bottomTop'], stringId, vertical, withinY);
                                        }
                                    }
                                    if (linear1.top === linear2.top && !parentTop && !parentBottom) {
                                        current.anchor(LAYOUT['top'], stringId, vertical);
                                    }
                                    if (linear1.bottom === linear2.bottom && !parentTop && !parentBottom) {
                                        current.anchor(LAYOUT['bottom'], stringId, vertical);
                                    }
                                }
                            }
                            else if (relative) {
                                if (current === node) {
                                    return;
                                }
                                else if (adjacent === node) {
                                    if (current.linear.left <= node.box.left || withinFraction(current.linear.left, node.box.left)) {
                                        current.anchor(parseRTL('layout_alignParentLeft'), 'true', 'horizontal');
                                    }
                                    else if (current.linear.right >= node.box.right || withinFraction(current.linear.right, node.box.right)) {
                                        current.anchor(parseRTL('layout_alignParentRight'), 'true', 'horizontal');
                                    }
                                    if (current.linear.top <= node.box.top || withinFraction(current.linear.top, node.box.top)) {
                                        current.anchor('layout_alignParentTop', 'true', 'vertical');
                                    }
                                    else if (current.linear.bottom >= node.box.bottom || withinFraction(current.linear.bottom, node.box.bottom) || ((current.floating || (flex.direction === 'column' && flex.wrap !== 'nowrap')) && withinRange(current.linear.bottom, node.box.bottom, SETTINGS.whitespaceHorizontalOffset))) {
                                        current.anchor('layout_alignParentBottom', 'true', 'vertical');
                                    }
                                }
                                else {
                                    if (current.css('width') != null && current.styleMap.marginRight === 'auto' && current.styleMap.marginLeft === 'auto') {
                                        current.android('layout_centerHorizontal', 'true');
                                        current.constraint.horizontal = true;
                                    }
                                    else {
                                        if ((linear1.top === linear2.top || linear1.bottom === linear2.bottom) && withinRange(linear1.left, linear2.right, SETTINGS.whitespaceHorizontalOffset)) {
                                            if (current.css('float') === 'right') {
                                                adjacent.anchor(LAYOUT['rightLeft'], current.stringId, horizontal);
                                            }
                                            else {
                                                current.anchor(LAYOUT['leftRight'], stringId, horizontal);
                                                if (adjacent.constraint.horizontal) {
                                                    current.delete('android', parseRTL('layout_alignParentRight'));
                                                }
                                            }
                                        }
                                    }
                                    if (withinRange(linear1.top, linear2.bottom, SETTINGS.whitespaceVerticalOffset)) {
                                        current.anchor(LAYOUT['topBottom'], stringId, vertical, withinY);
                                        if (adjacent.constraint.vertical) {
                                            current.delete('android', 'layout_alignParentBottom');
                                        }
                                    }
                                    else if (withinRange(linear1.bottom, linear2.top, SETTINGS.whitespaceVerticalOffset)) {
                                        if (!mapParent(current, 'top')) {
                                            current.anchor(LAYOUT['bottomTop'], stringId, vertical, withinY);
                                        }
                                    }
                                    if (adjacent.constraint.horizontal) {
                                        if (linear1.bottom === linear2.bottom) {
                                            if (!linearX && (!current.floating || !current.constraint.vertical)) {
                                                current.anchor(LAYOUT['bottom'], stringId, vertical);
                                                if (adjacent.constraint.vertical) {
                                                    current.delete('android', 'layout_alignParentBottom');
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                });
                nodes.list.shift();
                pageflow.list.forEach(current => {
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
                                mapDelete(current, (current.css('float') === 'right' ? 'left' : 'right'));
                            }
                            current.android('layout_width', 'match_parent');
                        }
                        if (current.app(LAYOUT['bottomTop']) != null) {
                            mapDelete(current, 'bottom');
                        }
                    }
                    else {
                        if (current.android(LAYOUT['topBottom'])) {
                            mapDelete(current, 'bottomTop');
                        }
                    }
                });
                const anchors = pageflow.anchors;
                do {
                    let restart = false;
                    pageflow.list.forEach(current => {
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
                        pageflow.list.forEach(current => {
                            const horizontalChain = this.partitionChain(pageflow, current, ['linear.top', 'linear.bottom'], [LAYOUT['leftRight'], LAYOUT['rightLeft']]);
                            const verticalChain = this.partitionChain(pageflow, current, ['linear.left', 'linear.right'], [LAYOUT['topBottom'], LAYOUT['bottomTop']]);
                            current.constraint.horizontalChain = new ViewList(sortAsc(horizontalChain, 'linear.left'));
                            current.constraint.verticalChain = new ViewList(sortAsc(verticalChain, 'linear.top'));
                        });
                    }
                    const direction = CHAIN_MAP.direction.slice();
                    if (verticalPerspective) {
                        direction.reverse();
                    }
                    direction.forEach((value, index) => {
                        const connected = (flex.enabled ? flexbox : pageflow.slice().list.sort((a, b) => a.constraint[value].length >= b.constraint[value].length ? -1 : 1));
                        if (connected != null) {
                            if (verticalPerspective) {
                                index = (index === 0 ? 1 : 0);
                            }
                            const inverse = (index === 0 ? 1 : 0);
                            connected.forEach((current, level) => {
                                const chainable: U = current.constraint[value];
                                if (chainable && chainable.length > (flex.enabled ? 0 : 1)) {
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
                                    if (verticalPerspective) {
                                        if (first.app(LAYOUT['leftRight']) != null) {
                                            if (!mapParent(first, 'left')) {
                                                mapDelete(first, 'left');
                                            }
                                        }
                                        if (first.app(LAYOUT['rightLeft']) != null) {
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
                                                    chain.anchor(LAYOUT['bottomTop'], nextChain.stringId);
                                                    if (!mapParent(chain, 'bottom')) {
                                                        mapDelete(chain, 'bottom');
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (verticalPerspective) {
                                                if (mapParent(chain, 'right') && chain.app(LAYOUT['leftRight']) != null) {
                                                    mapDelete(chain, 'right');
                                                }
                                                if (chain !== first) {
                                                    if (chain.app(LAYOUT['left']) != null || chain.app(LAYOUT['right']) != null) {
                                                        mapDelete(chain, 'leftRight', 'rightLeft');
                                                        delete chain.constraint.marginHorizontal;
                                                    }
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
                                                chain.android(`layout_${dimension}`, '0px');
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
                                                    chainable.list.forEach(item => {
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
                                    first.app(LAYOUT[LT], 'parent');
                                    first.constraint[orientation] = true;
                                    last.app(LAYOUT[RB], 'parent');
                                    last.constraint[orientation] = true;
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
                                                const leftTop = (index === 0 ? 'left' : 'top');
                                                const percent = (first.linear[leftTop] - node.box[leftTop]) / (<number> node.box[dimension]);
                                                first.app(`layout_constraint${HV}_chainStyle`, 'spread_inside');
                                                first.constraint[orientation] = false;
                                                last.constraint[orientation] = false;
                                                this.addGuideline(node, first, orientation, false, parseFloat(percent.toFixed(2)));
                                                this.addGuideline(node, last, orientation, true, parseFloat((1 - percent).toFixed(2)));
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
                                        chainable.list.forEach(item => delete item.constraint.marginHorizontal);
                                    }
                                    else {
                                        if ((orientation === 'horizontal' && withinFraction(node.box.left, first.linear.left) && withinFraction(last.linear.right, node.box.right)) || (orientation === 'vertical' && withinFraction(node.box.top, first.linear.top) && withinFraction(last.linear.bottom, node.box.bottom))) {
                                            if (chainable.length > 2 || flex.enabled) {
                                                first.app(chainStyle, 'spread_inside');
                                            }
                                            else {
                                                mapDelete(first, CHAIN_MAP['rightLeftBottomTop'][index]);
                                                mapDelete(last, CHAIN_MAP['leftRightTopBottom'][index]);
                                            }
                                        }
                                        else if ((maxOffset <= SETTINGS[`chainPacked${HV}Offset`] || node.flex.wrap !== 'nowrap') || (orientation === 'horizontal' && (first.linear.left === node.box.left || last.linear.right === node.box.right))) {
                                            first.app(chainStyle, 'packed');
                                            let bias = '';
                                            if (withinFraction(node.box.left, first.linear.left)) {
                                                bias = '0';
                                            }
                                            else if (withinFraction(last.linear.right, node.box.right)) {
                                                bias = '1';
                                            }
                                            else {
                                                bias = first[`${orientation}Bias`];
                                            }
                                            first.app(`layout_constraint${HV}_bias`, bias);
                                        }
                                        else {
                                            first.app(chainStyle, 'spread');
                                        }
                                        if (!flex.enabled) {
                                            chainable.list.forEach(inner => {
                                                pageflow.list.forEach(outer => {
                                                    const horizontal: U = outer.constraint.horizontalChain;
                                                    const vertical: U = outer.constraint.verticalChain;
                                                    if (horizontal.length > 0 && horizontal.find(inner.id) != null) {
                                                        horizontal.clear();
                                                    }
                                                    if (vertical.length > 0 && vertical.find(inner.id) != null) {
                                                        vertical.clear();
                                                    }
                                                });
                                            });
                                        }
                                    }
                                }
                                else if (chainable.length > 0) {
                                    const first = chainable.first;
                                    if (mapParent(first, 'left')) {
                                        mapDelete(first, 'rightLeft');
                                    }
                                    if (mapParent(first, 'right')) {
                                        mapDelete(first, 'leftRight');
                                        delete first.constraint.marginHorizontal;
                                    }
                                }
                            });
                        }
                    });
                }
                if (flex.enabled) {
                    if (flex.wrap !== 'nowrap') {
                        ['topBottom', 'bottomTop'].forEach((value, index) => {
                            pageflow.list.forEach(current => {
                                if (mapParent(current, (index === 0 ? 'bottom' : 'top'))) {
                                    const chain: T[] = [current];
                                    let valid = false;
                                    let adjacent: Null<T> = current;
                                    while (adjacent != null) {
                                        const topBottom = (<string> adjacent.app(LAYOUT[value]));
                                        if (topBottom != null) {
                                            adjacent = (<T> pageflow.findByNodeId(stripId(topBottom)));
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
                                                    item.app(LAYOUT['top'], next.stringId);
                                                    item.app(LAYOUT['bottom'], next.stringId);
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
                        const namespace = (constraint ? 'app' : 'android');
                        for (const attr in LAYOUT) {
                            const value = item[namespace](LAYOUT[attr]);
                            if (value !== 'parent' && (stringId === '' || value === stringId)) {
                                item.delete(namespace, LAYOUT[attr]);
                            }
                        }
                        item.constraint.horizontal = (mapParent(item, 'left') || mapParent(item, 'right'));
                        item.constraint.vertical = (mapParent(item, 'top') || mapParent(item, 'bottom'));
                    }
                    if (constraint) {
                        pageflow.list.forEach(current => {
                            [['top', 'bottom', 'topBottom'], ['bottom', 'top', 'bottomTop']].forEach(direction => {
                                if (mapParent(current, direction[1]) && current.app(LAYOUT[direction[2]]) == null) {
                                    ['leftRight', 'rightLeft'].forEach(value => {
                                        const stringId = current.app(LAYOUT[value]);
                                        if (stringId != null) {
                                            const aligned = pageflow.list.find(item => item.stringId === stringId);
                                            if (aligned && aligned.app(LAYOUT[direction[2]]) != null) {
                                                if (withinFraction(current.linear[direction[0]], aligned.linear[direction[0]])) {
                                                    current.app(LAYOUT[direction[0]], aligned.stringId, true);
                                                }
                                                if (withinFraction(current.linear[direction[1]], aligned.linear[direction[1]])) {
                                                    current.app(LAYOUT[direction[1]], aligned.stringId, true);
                                                }
                                            }
                                        }
                                    });
                                }
                            });
                        });
                        const unbound = nodes.list.filter(current => !current.anchored && (mapParent(current, 'top') || mapParent(current, 'right') || mapParent(current, 'bottom') || mapParent(current, 'left')));
                        if (anchors.length === 0 && unbound.length === 0) {
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
                            if (SETTINGS.useConstraintGuideline) {
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
                            if (!anchors.includes(current)) {
                                deleteConstraints(current);
                                if (!current.constraint.horizontal) {
                                    const left = formatPX(Math.max(0, current.linear.left - node.box.left));
                                    if (left !== '0px') {
                                        current.css(parseRTL('marginLeft'), left);
                                        current.android(parseRTL('layout_marginLeft'), left);
                                    }
                                    current.android(parseRTL('layout_alignParentLeft'), 'true');
                                    current.constraint.horizontal = true;
                                }
                                if (!current.constraint.vertical) {
                                    const top = formatPX(Math.max(0, current.linear.top - node.box.top));
                                    if (top !== '0px') {
                                        current.css('marginTop', top);
                                        current.android('layout_marginTop', top);
                                    }
                                    current.android('layout_alignParentTop', 'true');
                                    current.constraint.vertical = true;
                                }
                            }
                            if (mapParent(current, 'right') && current.android(LAYOUT['leftRight']) == null) {
                                node.constraint.layoutWidth = true;
                            }
                            if (mapParent(current, 'bottom') && current.android(LAYOUT['topBottom']) == null) {
                                node.constraint.layoutHeight = true;
                            }
                        });
                    }
                }
                pageflow.list.forEach(current => {
                    if (current.constraint.marginHorizontal != null) {
                        const item = this.findById(current.constraint.marginHorizontal);
                        if (item != null) {
                            const offset = current.linear.left - item.linear.right;
                            if (offset >= 1) {
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + offset, true);
                            }
                        }
                    }
                    if (current.constraint.marginVertical != null) {
                        const item = this.findById(current.constraint.marginVertical);
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

    public adjustBoxSpacing(data: ViewData<T>) {
        data.cache.forEach(node => {
            if (node.is(NODE_STANDARD.LINEAR, NODE_STANDARD.RADIO_GROUP)) {
                switch (node.android('orientation')) {
                    case 'horizontal':
                        let left = node.box.left;
                        sortAsc(node.renderChildren.slice(), 'linear.left').forEach((item, index) => {
                            let valid = true;
                            if (index === 0) {
                                const gravity = node.android('gravity');
                                if (gravity != null && gravity !== parseRTL('left')) {
                                    valid = false;
                                }
                            }
                            if (valid && !item.floating) {
                                const width = Math.ceil(item.linear.left - left);
                                if (width >= 1) {
                                    item.modifyBox(BOX_STANDARD.MARGIN_LEFT, item.marginLeft + width, true);
                                }
                            }
                            left = item.linear.right;
                        });
                        break;
                    case 'vertical':
                        let top = node.box.top;
                        sortAsc(node.renderChildren.slice(), 'linear.top').forEach(item => {
                            const height = Math.ceil(item.linear.top - top);
                            if (height >= 1) {
                                item.modifyBox(BOX_STANDARD.MARGIN_TOP, item.marginTop + height, true);
                            }
                            top = item.linear.bottom;
                        });
                        break;
                }
            }
        });
    }

    public renderGroup(node: T, parent: T, viewName: number | string, options?: ObjectMap<any>) {
        const target = hasValue(node.dataset.target);
        let preXml = '';
        let postXml = '';
        let renderParent = parent;
        if (typeof viewName === 'number') {
            viewName = View.getViewName(viewName);
        }
        switch (viewName) {
            case NODE_ANDROID.LINEAR:
                options = { android: { orientation: (options && options.vertical ? 'vertical' : 'horizontal') } };
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
                            viewGroup.css('overflowX', node.styleMap.overflowX);
                            break;
                        default:
                            viewGroup.css('height', node.styleMap.height);
                            viewGroup.css('minHeight', node.styleMap.minHeight);
                            viewGroup.css('overflowY', node.styleMap.overflowY);
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
        return this.getEnclosingTag((target || hasValue(parent.dataset.target) ? -1 : node.renderDepth), viewName, node.id, `{:${node.id}}`, preXml, postXml);
    }

    public renderNode(node: T, parent: T, nodeName: number | string, recursive = false) {
        const element: any = node.element;
        const target = hasValue(node.dataset.target);
        if (typeof nodeName === 'number') {
            nodeName = View.getViewName(nodeName);
        }
        node.setNodeId(nodeName);
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
                                viewGroup.android('orientation', NodeList.linearX(viewGroup.children) ? 'horizontal' : 'vertical');
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
                        scrollbars.push('horizontal');
                    }
                    if (node.overflowY) {
                        scrollbars.push('vertical');
                    }
                    node.android('scrollbars', scrollbars.join('|'));
                }
                break;
        }
        node.render((target ? node : parent));
        if (!includesEnum(node.excludeProcedure, NODE_PROCEDURE.ACCESSIBILITY)) {
            node.setAccessibility();
        }
        node.cascade().forEach(item => item.hide());
        return this.getEnclosingTag((target || hasValue(parent.dataset.target) ? -1 : node.renderDepth), node.nodeName, node.id);
    }

    public renderNodeStatic(tagName: number | string, depth: number, options: ObjectMap<any> = {}, width = '', height = '', node: Null<T> = null, children = false) {
        let minimal = false;
        if (node == null) {
            node = (<T> new View(0, SETTINGS.targetAPI));
            minimal = true;
        }
        const renderDepth = Math.max(0, depth);
        const viewName = (typeof tagName === 'number' ? View.getViewName(tagName) : tagName);
        tagName = (node.hasElement ? node.tagName : viewName);
        node.setNodeId(viewName);
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
        let output = this.getEnclosingTag((depth === 0 && minimal ? -1 : depth), viewName, node.id, (children ? `{:${node.id}}` : ''));
        if (SETTINGS.showAttributes && node.id === 0) {
            const indent = repeat(renderDepth + 1);
            const attributes = node.combine().map(value => `\n${indent + value}`).join('');
            output = output.replace(`{@${node.id}}`, attributes);
        }
        options.stringId = node.stringId;
        return output;
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
        [...data.views, ...data.includes].forEach(view => {
            cache.forEach(item => view.content = view.content.replace(item.pattern, item.attributes));
            view.content = view.content.replace(`{#0}`, this.getRootNamespace(view.content));
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
                ['android:layout_width:width', 'android:layout_height:height', 'android:minWidth:minwidth', 'android:minHeight:minheight', 'app:layout_constraintWidth_min:constraintwidth_min', 'app:layout_constraintHeight_min:constraintheight_min'].forEach(value => {
                    const [namespace, attr, dimen] = value.split(':');
                    addToGroup(tagName, node, dimen, attr, <string> node[namespace](attr));
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
        if (node.renderChildren.length === 0 && node.dir === 'rtl') {
            switch (node.nodeName) {
                case NODE_ANDROID.CHECKBOX:
                case NODE_ANDROID.RADIO:
                    node.android('layoutDirection', 'rtl');
                    break;
                default:
                    node.android('textDirection', 'rtl');
            }
        }
        const attributes = node.combine();
        const indent = repeat(node.renderDepth + 1);
        const output = attributes.map((value: string) => `\n${indent + value}`).join('');
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
        const map: StringMap = LAYOUT_MAP.constraint;
        ['horizontal', 'vertical'].forEach((value, index) => {
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

    private partitionChain(nodes: U, node: T, coordinate: string[], connected: string[]) {
        const result = coordinate.map(value => {
            const chained: Set<T> = new Set();
            chained.add(node);
            const sameY = nodes.list.filter(item => same(node, item, value));
            let valid;
            do {
                valid = false;
                Array.from(chained).some(item => {
                    return sameY.some(adjacent => {
                        if (!chained.has(adjacent) && (adjacent.app(connected[0]) === item.stringId || adjacent.app(connected[1]) === item.stringId)) {
                            chained.add(adjacent);
                            valid = true;
                            return true;
                        }
                        return false;
                    });
                });
            }
            while (valid);
            return Array.from(chained);
        }).reduce((a, b) => a.length >= b.length ? a : b);
        return result;
    }

    private addGuideline(parent: T, node: T, orientation = '', opposite = false, percent = -1) {
        const map: StringMap = LAYOUT_MAP.constraint;
        const beginPercent = `layout_constraintGuide_${(percent !== -1 ? 'percent' : 'begin')}`;
        ['horizontal', 'vertical'].forEach((value, index) => {
            if (!node.constraint[value] && (orientation === '' || value === orientation)) {
                const position = (index === 0 ? 'left' : 'top');
                const options: ObjectMap<any> = {
                    android: {
                        orientation: (index === 0 ? 'vertical' : 'horizontal')
                    },
                    app: {
                        [beginPercent]: (percent !== -1 ? percent : formatDimen(node.tagName, 'constraintguide_begin', formatPX(Math.max(node.linear[position] - parent.box[position], 0))))
                    }
                };
                const LRTB = (index === 0 ? (!opposite ? 'left' : 'right') : (!opposite ? 'top' : 'bottom'));
                const RLBT = (index === 0 ? (!opposite ? 'right' : 'left') : (!opposite ? 'bottom' : 'top'));
                const xml = this.renderNodeStatic(NODE_ANDROID.GUIDELINE, node.renderDepth, options, 'wrap_content', 'wrap_content');
                this.appendAfter(node.id, xml);
                node.app(map[LRTB], options.stringId);
                node.delete('app', map[RLBT]);
                node.constraint[value] = true;
            }
        });
    }

    private findById(id: string) {
        return this.cache.list.find(node => node.android('id') === id);
    }

    get inlineExclude() {
        return WEBVIEW_ANDROID;
    }
}