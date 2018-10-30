import { SettingsAndroid, ViewAttribute } from './types/local';

import { AXIS_ANDROID, NODE_ANDROID, WEBVIEW_ANDROID, XMLNS_ANDROID } from './lib/constant';

import BASE_TMPL from './template/base';

import View from './view';
import ViewGroup from './viewgroup';
import NodeList = androme.lib.base.NodeList;

import { delimitUnit, getXmlNs, parseRTL, replaceUnit, resetId, stripId } from './lib/util';

import $enum = androme.lib.enumeration;
import $util = androme.lib.util;
import $dom = androme.lib.dom;
import $xml = androme.lib.xml;

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
    leftTop: ['left', 'top'],
    rightBottom: ['right', 'bottom'],
    rightLeftBottomTop: ['rightLeft', 'bottomTop'],
    leftRightTopBottom: ['leftRight', 'topBottom'],
    widthHeight: ['Width', 'Height'],
    horizontalVertical: ['Horizontal', 'Vertical']
};

function setAlignParent(node: View, orientation = '', bias = false) {
    [AXIS_ANDROID.HORIZONTAL, AXIS_ANDROID.VERTICAL].forEach((value, index) => {
        if (!node.constraint[value] && (orientation === '' || value === orientation)) {
            node.app(MAP_LAYOUT.constraint[index === 0 ? 'left' : 'top'], 'parent');
            node.app(MAP_LAYOUT.constraint[index === 0 ? 'right' : 'bottom'], 'parent');
            node.constraint[value] = true;
            if (bias) {
                node.app(`layout_constraint${value.charAt(0).toUpperCase() + value.substring(1)}_bias`, node[`${value}Bias`]);
            }
        }
    });
}

export default class ViewController<T extends View> extends androme.lib.base.Controller<T> {
    public static getEnclosingTag(depth: number, controlName: string, id: number, xml = '', preXml = '', postXml = '') {
        const indent = $util.repeat(Math.max(0, depth));
        let output = preXml +
                     `{<${id}}`;
        if (xml !== '') {
            output += indent + `<${controlName}${depth === 0 ? '{#0}' : ''}{@${id}}>\n` +
                               xml +
                      indent + `</${controlName}>\n`;
        }
        else {
            output += indent + `<${controlName}${depth === 0 ? '{#0}' : ''}{@${id}} />\n`;
        }
        output += `{>${id}}` +
                  postXml;
        return output;
    }

    public settings: SettingsAndroid;
    public readonly settingsInternal: SettingsInternal = {
        includes: true,
        baseTemplate: BASE_TMPL,
        layout: {
            pathName: 'res/layout',
            fileExtension: 'xml'
        },
        inline: {
            always: ['BR'],
            tagName: WEBVIEW_ANDROID,
        },
        unsupported: {
            tagName: ['OPTION', 'MAP', 'AREA']
        }
    };

    private _merge = {};

    public finalize(data: ViewData<NodeList<T>>, callbackArray: ArrayObject<FunctionVoid>) {
        this.setAttributes(data);
        for (const value of [...data.views, ...data.includes]) {
            if (Array.isArray(callbackArray)) {
                callbackArray.forEach(callbackfn => callbackfn(data));
            }
            value.content = replaceUnit(value.content, this.settings);
            value.content = $xml.replaceTab(value.content, this.settings);
            value.content = $xml.removePlaceholderAll(value.content).replace(/\n\n/g, '\n');
        }
    }

    public reset() {
        super.reset();
        resetId();
        this._merge = {};
    }

    public setConstraints() {
        Object.assign(MAP_LAYOUT.relativeParent, {
            left: parseRTL('layout_alignParentLeft', this.settings),
            right: parseRTL('layout_alignParentRight', this.settings)
        });
        Object.assign(MAP_LAYOUT.relative, {
            left: parseRTL('layout_alignLeft', this.settings),
            right: parseRTL('layout_alignRight', this.settings),
            leftRight: parseRTL('layout_toRightOf', this.settings),
            rightLeft: parseRTL('layout_toLeftOf', this.settings)
        });
        Object.assign(MAP_LAYOUT.constraint, {
            left: parseRTL('layout_constraintLeft_toLeftOf', this.settings),
            right: parseRTL('layout_constraintRight_toRightOf', this.settings),
            leftRight: parseRTL('layout_constraintLeft_toRightOf', this.settings),
            rightLeft: parseRTL('layout_constraintRight_toLeftOf', this.settings)
        });
        const relativeParent: StringMap = MAP_LAYOUT.relativeParent;
        let mapLayout: StringMap;
        let constraint = false;
        let relative = false;
        function mapParent(node: T, direction: string) {
            if (constraint) {
                return node.app(mapLayout[direction]) === 'parent';
            }
            else {
                return node.android(relativeParent[direction]) === 'true';
            }
        }
        function mapSibling(node: T, direction: string) {
            return node[constraint ? 'app' : 'android'](mapLayout[direction]);
        }
        function mapDelete(node: T, ...direction: string[]) {
            node.delete(constraint ? 'app' : 'android', ...direction.map(value => mapLayout[value]));
        }
        function anchoredSibling(node: T, nodes: NodeList<T>, orientation: string) {
            if (!node.constraint[orientation]) {
                const connected: string[] = [];
                let parent: Null<T> = node;
                while (parent && !connected.includes(parent.stringId)) {
                    connected.push(parent.stringId);
                    const stringId = mapSibling(parent, orientation === AXIS_ANDROID.HORIZONTAL ? 'leftRight' : 'topBottom');
                    if (stringId) {
                        parent = nodes.find('nodeId', stripId(stringId));
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
        this.cache.visible.forEach(node => {
            relative = node.is($enum.NODE_STANDARD.RELATIVE);
            constraint = node.is($enum.NODE_STANDARD.CONSTRAINT);
            const flex = node.flex;
            if (relative || constraint || flex.enabled) {
                const nodes = new NodeList(node.renderChildren.filter(item => item.auto) as T[], node);
                if (nodes.length === 0) {
                    return;
                }
                const cleared = NodeList.cleared(node.initial.children);
                if (relative) {
                    function checkSingleLine(item: T, nowrap = false, flexParent = false) {
                        if (item && item.textElement && (
                                nowrap ||
                                flexParent ||
                                (!item.hasWidth && !item.multiLine && item.textContent.trim().split(String.fromCharCode(32)).length > 1)
                           ))
                        {
                            item.android('singleLine', 'true');
                        }
                    }
                    function adjustBaseline(siblings: T[]) {
                        if (nodes.length > 1) {
                            const textBaseline = NodeList.textBaseline(siblings.filter(item => item.baseline && item.toInt('top') === 0 && item.toInt('bottom') === 0));
                            if (textBaseline.length > 0) {
                                const alignWith = textBaseline[0];
                                const images: T[] = [];
                                let baseExcluded: Null<T> = null;
                                for (const current of siblings) {
                                    if (current !== alignWith) {
                                        if (current.baseline && (
                                                current.nodeType <= $enum.NODE_STANDARD.INLINE ||
                                                (current.linearHorizontal && current.renderChildren.some(item => item.baseline && item.nodeType <= $enum.NODE_STANDARD.INLINE))
                                           ))
                                        {
                                            if (!alignWith.imageElement && current.imageElement) {
                                                images.push(current);
                                            }
                                            else if (current.alignOrigin) {
                                                current.android(MAP_LAYOUT.relative[current.imageElement || current.is($enum.NODE_STANDARD.BUTTON) ? 'bottom' : 'baseline'], alignWith.stringId);
                                            }
                                            else if (
                                                alignWith.position === 'relative' &&
                                                current.bounds.height < alignWith.bounds.height &&
                                                current.lineHeight === 0)
                                            {
                                                current.android(MAP_LAYOUT.relative[$util.convertInt(alignWith.top) > 0 ? 'top' : 'bottom'], alignWith.stringId);
                                            }
                                        }
                                        if (alignWith.imageElement && (!baseExcluded || current.bounds.height > baseExcluded.bounds.height)) {
                                            baseExcluded = current;
                                        }
                                    }
                                }
                                if (images.length > 0) {
                                    images.sort((a, b) => a.bounds.height >= b.bounds.height ? -1 : 1);
                                    for (let i = 0; i < images.length; i++) {
                                        if (i === 0) {
                                            alignWith.android(mapLayout['bottom'], images[i].stringId);
                                        }
                                        else {
                                            images[i].android(mapLayout['bottom'], images[0].stringId);
                                        }
                                    }
                                    baseExcluded = null;
                                }
                                if (baseExcluded) {
                                    if (!baseExcluded.imageElement) {
                                        baseExcluded.delete('android', mapLayout['baseline']);
                                    }
                                    else if (baseExcluded.bounds.height > alignWith.bounds.height) {
                                        baseExcluded.delete('android', mapLayout['bottom']);
                                    }
                                    else {
                                        baseExcluded = null;
                                    }
                                    if (baseExcluded) {
                                        alignWith.android(mapLayout['bottom'], baseExcluded.stringId);
                                    }
                                }
                            }
                        }
                    }
                    mapLayout = MAP_LAYOUT.relative;
                    const rows: T[][] = [];
                    const baseline: T[] = [];
                    const textIndent = node.toInt('textIndent');
                    const noWrap = node.css('whiteSpace') === 'nowrap';
                    let boxWidth = node.box.width;
                    if (node.renderParent.overflowX) {
                        boxWidth = node.viewWidth || boxWidth || node.renderParent.toInt('width', 0, { map: 'initial' });
                    }
                    else if (node.renderParent.hasAlign($enum.NODE_ALIGNMENT.FLOAT)) {
                        const minLeft: number = Math.min.apply(null, nodes.list.map(item => item.linear.left));
                        const maxRight: number = Math.max.apply(null, nodes.list.map(item => item.linear.right));
                        boxWidth = maxRight - minLeft;
                    }
                    else {
                        const floatEnd = Math.max.apply(null, node.documentParent.initial.children.filter(item => item.float === 'left' && item.siblingIndex < node.siblingIndex).map(item => item.linear.right));
                        if (nodes.list.some(item => item.linear.left === floatEnd)) {
                            boxWidth = node.box.right - floatEnd;
                        }
                    }
                    boxWidth = Math.ceil(boxWidth);
                    let rowWidth = 0;
                    let rowPaddingLeft = 0;
                    let rowPreviousLeft: Null<T> = null;
                    let rowPreviousBottom: Null<T> = null;
                    if (textIndent < 0 && Math.abs(textIndent) <= node.paddingLeft) {
                        rowPaddingLeft = Math.abs(textIndent);
                        node.modifyBox($enum.BOX_STANDARD.PADDING_LEFT, node.paddingLeft + textIndent);
                        node.modifyBox($enum.BOX_STANDARD.PADDING_LEFT, null);
                    }
                    const rangeMultiLine: T[] = [];
                    const edgeOrFirefox = $dom.isUserAgent($enum.USER_AGENT.EDGE | $enum.USER_AGENT.FIREFOX);
                    for (let i = 0; i < nodes.length; i++) {
                        const current = nodes.get(i);
                        const previous = nodes.get(i - 1);
                        let dimension = current.bounds;
                        if (current.inlineText && !current.hasWidth) {
                            const [bounds, multiLine] = $dom.getRangeClientRect(current.element);
                            if (bounds && (multiLine || bounds.width < current.box.width)) {
                                dimension = bounds;
                                if (edgeOrFirefox && multiLine && !/^\s*\n+/.test(current.textContent)) {
                                    rangeMultiLine.push(current);
                                }
                            }
                        }
                        const sideParent = relativeParent[current.float === 'right' ? 'right' : 'left'];
                        const sideSibling = mapLayout[current.float === 'right' ? 'rightLeft' : 'leftRight'];
                        if (i === 0) {
                            current.android(sideParent, 'true');
                            if (!node.inline && textIndent > 0) {
                                current.modifyBox($enum.BOX_STANDARD.MARGIN_LEFT, textIndent);
                            }
                            if (!current.siblingflow || (current.floating && current.position === 'relative') || (current.multiLine && textIndent < 0)) {
                                rowPreviousLeft = current;
                            }
                            rows[rows.length] = [current];
                        }
                        else {
                            const items = rows[rows.length - 1];
                            const siblings = $dom.getElementsBetweenSiblings(previous.baseElement, current.baseElement, false, true);
                            const viewGroup = current instanceof ViewGroup && !current.hasAlign($enum.NODE_ALIGNMENT.SEGMENTED);
                            const previousSibling = current.previousSibling();
                            const baseWidth = rowWidth + current.marginLeft + dimension.width - (edgeOrFirefox ? current.borderRightWidth : 0);
                            let connected = false;
                            if (i === 1 && previous.textElement && current.textElement) {
                                connected = siblings.length === 0 && !/\s+$/.test(previous.textContent) && !/^\s+/.test(current.textContent);
                            }
                            if (!noWrap &&
                                !connected &&
                                !['SUP', 'SUB'].includes(current.tagName) &&
                                (previous.float !== 'left' || current.linear.top >= previous.linear.bottom) && (
                                    (current.float !== 'right' && Math.floor(baseWidth) - (current.styleElement && current.inlineStatic ? current.paddingLeft + current.paddingRight : 0) > boxWidth) ||
                                    (current.multiLine && $dom.hasLineBreak(current.element)) ||
                                    (previous.multiLine && previous.textContent.trim() !== '' && !/^\s*\n+/.test(previous.textContent) && !/\n+\s*$/.test(previous.textContent) && $dom.hasLineBreak(previous.element)) ||
                                    (previousSibling && previousSibling.lineBreak) ||
                                    (current.preserveWhiteSpace && /^\n+/.test(current.textContent)) ||
                                    current.blockStatic ||
                                    viewGroup ||
                                    cleared.has(current) ||
                                    rangeMultiLine.includes(previous) ||
                                    (siblings.length > 0 && siblings.some(element => $dom.isLineBreak(element))) ||
                                    (current.floating && (
                                        (current.float === 'left' && $util.withinFraction(current.linear.left, node.box.left)) ||
                                        (current.float === 'right' && $util.withinFraction(current.linear.right, node.box.right)) ||
                                        current.linear.top >= previous.linear.bottom
                                    ))
                               ))
                            {
                                rowPreviousBottom = items.filter(item => !item.floating)[0] || items[0];
                                for (let j = 0; j < items.length; j++) {
                                    if (items[j] !== rowPreviousBottom &&
                                        items[j].linear.bottom > rowPreviousBottom.linear.bottom &&
                                        (!items[j].floating || (items[j].floating && rowPreviousBottom.floating)))
                                    {
                                        rowPreviousBottom = items[j];
                                    }
                                }
                                if (viewGroup || (previous instanceof ViewGroup && i === nodes.length - 1)) {
                                    current.constraint.marginVertical = rowPreviousBottom.stringId;
                                }
                                current.anchor(mapLayout['topBottom'], rowPreviousBottom.stringId);
                                if (rowPreviousLeft &&
                                    current.linear.top < rowPreviousLeft.bounds.bottom &&
                                    !$util.withinRange(current.bounds.top, rowPreviousLeft.bounds.top, 1) &&
                                    !$util.withinRange(current.bounds.bottom, rowPreviousLeft.bounds.bottom, 1))
                                {
                                    current.anchor(sideSibling, rowPreviousLeft.stringId);
                                }
                                else {
                                    current.anchor(sideParent, 'true');
                                    rowPreviousLeft = null;
                                }
                                if (this.settings.ellipsisOnTextOverflow && previous.linearHorizontal) {
                                    checkSingleLine(previous.children[previous.children.length - 1] as T, true);
                                }
                                if (rowPaddingLeft > 0) {
                                    if (this.settings.ellipsisOnTextOverflow &&
                                        rows.length === 1 &&
                                        rows[0].length === 1 &&
                                        rows[0][0].textElement)
                                    {
                                        checkSingleLine(rows[0][0], true);
                                    }
                                    current.modifyBox($enum.BOX_STANDARD.PADDING_LEFT, rowPaddingLeft);
                                }
                                adjustBaseline(baseline);
                                node.alignmentType ^= $enum.NODE_ALIGNMENT.HORIZONTAL;
                                node.alignmentType |= $enum.NODE_ALIGNMENT.MULTILINE;
                                rowWidth = 0;
                                baseline.length = 0;
                                rows.push([current]);
                            }
                            else {
                                if (i === 1 && rowPaddingLeft > 0 && !previous.plainText) {
                                    current.anchor(sideParent, 'true');
                                    current.modifyBox($enum.BOX_STANDARD.PADDING_LEFT, rowPaddingLeft);
                                }
                                else {
                                    current.anchor(sideSibling, previous.stringId);
                                }
                                if (connected || baseWidth > boxWidth) {
                                    checkSingleLine(current);
                                }
                                if (rowPreviousBottom) {
                                    current.anchor(mapLayout['topBottom'], rowPreviousBottom.stringId);
                                }
                                items.push(current);
                            }
                        }
                        rowWidth += dimension.width + current.marginLeft + current.marginRight + (
                                        previous && !previous.floating && !previous.plainText && !previous.preserveWhiteSpace &&
                                        previous.textContent.trim() !== '' && !/\s+$/.test(previous.textContent) &&
                                        !current.floating && !current.plainText && !current.preserveWhiteSpace &&
                                        current.textContent.trim() !== '' && !/^\s+/.test(current.textContent) ? this.settings.whitespaceHorizontalOffset : 0
                                    );
                        if (!current.floating) {
                            baseline.push(current);
                        }
                    }
                    adjustBaseline(baseline);
                    if (node.marginTop < 0 && nodes.get(0).position === 'relative') {
                        rows[0].forEach((item, index) => item.modifyBox($enum.BOX_STANDARD.MARGIN_TOP, node.marginTop * (index === 0 ? 1 : -1), true));
                    }
                    if (node.baseline && rows.length === 1) {
                        rows[0].forEach(item => {
                            switch (item.css('verticalAlign')) {
                                case 'top':
                                    item.anchor(relativeParent['top'], 'true');
                                    break;
                                case 'middle':
                                    rows[0].forEach(sibling => sibling.bounds.height <= item.bounds.height && sibling.anchor('layout_centerVertical', 'true'));
                                    break;
                            }
                        });
                    }
                    if (this.settings.ellipsisOnTextOverflow) {
                        const widthParent = !node.ascend().some(parent => parent.hasWidth);
                        if (!node.ascend(true).some(item => item.is($enum.NODE_STANDARD.GRID)) && (
                                rows.length === 1 ||
                                node.hasAlign($enum.NODE_ALIGNMENT.HORIZONTAL)
                           ))
                        {
                            for (let i = 1; i < nodes.length; i++) {
                                const item = nodes.get(i);
                                if (!item.multiLine && !item.floating && !item.alignParent('left', this.settings)) {
                                    checkSingleLine(item, false, widthParent);
                                }
                            }
                        }
                        else {
                            for (const row of rows) {
                                if (row.length > 1) {
                                    const item = row[row.length - 1];
                                    if (item.inlineText) {
                                        checkSingleLine(item, false, widthParent);
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    mapLayout = MAP_LAYOUT.constraint;
                    if (node.hasAlign($enum.NODE_ALIGNMENT.HORIZONTAL)) {
                        function boundsHeight(a: T, b: T) {
                            return a.bounds.height >= b.bounds.height ? -1 : 1;
                        }
                        const optimal = NodeList.textBaseline(nodes.list)[0];
                        const baseline = nodes.list.filter(item => item.textElement && item.baseline).sort(boundsHeight);
                        let images = nodes.list.filter(item => item.imageElement && item.baseline).sort(boundsHeight);
                        if (images.length > 0) {
                            const tallest = images[0];
                            images.forEach((item, index) => index > 0 && item.app(mapLayout['baseline'], tallest.stringId));
                            if (!optimal.imageElement) {
                                optimal.app(mapLayout['bottom'], tallest.stringId);
                            }
                            images = images.filter(item => item !== tallest);
                        }
                        for (let i = 0; i < nodes.length; i++) {
                            const current = nodes.get(i);
                            let alignWith: Null<T> = optimal;
                            if (i === 0) {
                                current.app(mapLayout['left'], 'parent');
                            }
                            else {
                                const previous = nodes.get(i - 1);
                                current.app(mapLayout['leftRight'], previous.stringId);
                                if (!previous.floating && !current.floating) {
                                    current.constraint.marginHorizontal = previous.stringId;
                                }
                            }
                            if (images.includes(current)) {
                                continue;
                            }
                            let verticalAlign = current.css('verticalAlign');
                            if (verticalAlign === 'baseline' && current.tagName === 'TEXTAREA') {
                                verticalAlign = 'text-bottom';
                            }
                            if (!alignWith || verticalAlign.startsWith('text') || alignWith === current) {
                                alignWith = null;
                                baseline.some(item => {
                                    if (item !== current) {
                                        alignWith = item;
                                        return true;
                                    }
                                    return false;
                                });
                                if (!alignWith) {
                                    nodes.list.slice().sort((a, b) => a.nodeType <= b.nodeType ? -1 : 1).some(item => {
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
                                    if (alignWith) {
                                        current.app(mapLayout['top'], alignWith.stringId);
                                    }
                                    break;
                                case 'top':
                                    current.app(mapLayout['top'], 'parent');
                                    break;
                                case 'middle':
                                    setAlignParent(current, AXIS_ANDROID.VERTICAL);
                                    break;
                                case 'baseline':
                                    if (alignWith) {
                                        current.app(mapLayout['baseline'], alignWith.stringId);
                                    }
                                    break;
                                case 'text-bottom':
                                    if (alignWith) {
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
                        const percentage = node.hasAlign($enum.NODE_ALIGNMENT.PERCENT);
                        const columnCount = node.toInt('columnCount');
                        if (percentage) {
                            node.android('layout_width', 'match_parent');
                        }
                        else if (columnCount === 0) {
                            pageflow.each(current => {
                                const parent = node.renderParent.is($enum.NODE_STANDARD.GRID) && !node.styleElement ? node : current.documentParent;
                                if (current.autoMarginHorizontal) {
                                    setAlignParent(current, AXIS_ANDROID.HORIZONTAL);
                                }
                                else {
                                    if (current.linear.left <= parent.box.left || $util.withinFraction(current.linear.left, parent.box.left)) {
                                        current.anchor(mapLayout['left'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                    }
                                    if (current.linear.right >= parent.box.right || $util.withinFraction(current.linear.right, parent.box.right)) {
                                        current.anchor(mapLayout['right'], 'parent', parent.hasWidth || current.float === 'right' || current.autoMarginLeft ? AXIS_ANDROID.HORIZONTAL : '');
                                    }
                                }
                                if (current.linear.top <= parent.box.top || $util.withinFraction(current.linear.top, parent.box.top)) {
                                    current.anchor(mapLayout['top'], 'parent', AXIS_ANDROID.VERTICAL);
                                }
                                else if (current.linear.bottom >= parent.box.bottom || $util.withinFraction(current.linear.bottom, parent.box.bottom)) {
                                    current.anchor(mapLayout['bottom'], 'parent', parent.hasHeight ? AXIS_ANDROID.VERTICAL : '');
                                }
                                pageflow.each(adjacent => {
                                    if (current !== adjacent) {
                                        const stringId = adjacent.stringId;
                                        const horizontal = anchoredSibling(adjacent, nodes, AXIS_ANDROID.HORIZONTAL) ? AXIS_ANDROID.HORIZONTAL : '';
                                        const vertical = anchoredSibling(adjacent, nodes, AXIS_ANDROID.VERTICAL) ? AXIS_ANDROID.VERTICAL : '';
                                        const intersectY = current.intersectY(adjacent.linear);
                                        const alignOrigin = current.alignOrigin && adjacent.alignOrigin;
                                        if (!current.hasWidth && current.linear.left === adjacent.linear.left && current.linear.right === adjacent.linear.right) {
                                            if (!mapParent(current, 'right')) {
                                                current.anchor(mapLayout['left'], stringId);
                                            }
                                            if (!mapParent(current, 'left')) {
                                                current.anchor(mapLayout['right'], stringId);
                                            }
                                        }
                                        if ($util.withinFraction(current.linear.left, adjacent.linear.right) ||
                                            (alignOrigin && $util.withinRange(current.linear.left, adjacent.linear.right, this.settings.whitespaceHorizontalOffset)))
                                        {
                                            if (current.float !== 'right' || current.float === adjacent.float) {
                                                current.anchor(mapLayout['leftRight'], stringId, horizontal, current.withinX(adjacent.linear));
                                            }
                                        }
                                        if ($util.withinFraction(current.linear.right, adjacent.linear.left) ||
                                            (alignOrigin && $util.withinRange(current.linear.right, adjacent.linear.left, this.settings.whitespaceHorizontalOffset)))
                                        {
                                            current.anchor(mapLayout['rightLeft'], stringId, horizontal, current.withinX(adjacent.linear));
                                        }
                                        const topParent = mapParent(current, 'top');
                                        const bottomParent = mapParent(current, 'bottom');
                                        const blockElement = !flex.enabled && !current.inlineElement;
                                        if ($util.withinFraction(current.linear.top, adjacent.linear.bottom) ||
                                            (alignOrigin && intersectY && $util.withinRange(current.linear.top, adjacent.linear.bottom, this.settings.whitespaceVerticalOffset)))
                                        {
                                            if (intersectY || !bottomParent || blockElement) {
                                                current.anchor(mapLayout['topBottom'], stringId, vertical, intersectY);
                                            }
                                        }
                                        if ($util.withinFraction(current.linear.bottom, adjacent.linear.top) ||
                                            (alignOrigin && intersectY && $util.withinRange(current.linear.bottom, adjacent.linear.top, this.settings.whitespaceVerticalOffset)))
                                        {
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
                                });
                            })
                            .each(current => {
                                const leftRight = mapSibling(current, 'leftRight');
                                if (leftRight) {
                                    if (!current.constraint.horizontal) {
                                        current.constraint.horizontal = flex.enabled || anchoredSibling(current, pageflow, AXIS_ANDROID.HORIZONTAL);
                                    }
                                    current.constraint.marginHorizontal = leftRight;
                                }
                                const topBottom = mapSibling(current, 'topBottom');
                                if (topBottom) {
                                    if (!current.constraint.vertical) {
                                        current.constraint.vertical = flex.enabled || anchoredSibling(current, pageflow, AXIS_ANDROID.VERTICAL);
                                    }
                                    current.constraint.marginVertical = topBottom;
                                    mapDelete(current, 'top');
                                }
                                if (mapParent(current, 'left') && mapParent(current, 'right')) {
                                    if (current.autoMargin) {
                                        if (current.autoMarginLeft) {
                                            mapDelete(current, 'left');
                                        }
                                        if (current.autoMarginRight) {
                                            mapDelete(current, 'right');
                                        }
                                        if (current.autoMarginHorizontal) {
                                            if (node.hasWidth && !current.has('width', $enum.CSS_STANDARD.PERCENT)) {
                                                current.android('layout_width', 'match_parent');
                                            }
                                            else if (current.inlineElement && !current.hasWidth) {
                                                current.android('layout_width', 'wrap_content');
                                            }
                                        }
                                    }
                                    else if (current.floating) {
                                        mapDelete(current, current.float === 'right' ? 'left' : 'right');
                                    }
                                    else if (current.inlineElement) {
                                        if (current.nodeType <= $enum.NODE_STANDARD.IMAGE) {
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
                                if (current.plainText || (!current.styleElement && current.renderChildren.some(item => item.textElement))) {
                                    const textAlign = current.cssParent('textAlign');
                                    if (textAlign === 'right') {
                                        current.anchor(mapLayout['right'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                        current.constraint.horizontal = true;
                                    }
                                    else if (textAlign === 'center') {
                                        current.constraint.horizontal = false;
                                        setAlignParent(current, AXIS_ANDROID.HORIZONTAL);
                                    }
                                }
                            });
                            for (let i = 0; i < pageflow.length; i++) {
                                const current = pageflow.get(i);
                                if (!current.anchored) {
                                    const result = $util.searchObject(current.get('app'), '*constraint*');
                                    for (const [key, value] of result) {
                                        if (value !== 'parent' && pageflow.list.filter(item => item.anchored).find(item => item.stringId === value)) {
                                            if ($util.indexOf(key, parseRTL('Left', this.settings), parseRTL('Right', this.settings)) !== -1) {
                                                current.constraint.horizontal = true;
                                            }
                                            if ($util.indexOf(key, 'Top', 'Bottom', 'Baseline', 'above', 'below') !== -1) {
                                                current.constraint.vertical = true;
                                            }
                                        }
                                    }
                                    if (current.anchored) {
                                        i = -1;
                                    }
                                }
                            }
                            if (absolute.length > 0) {
                                absolute.each(current => {
                                    let alignMarginLeft = false;
                                    if (current.right != null && current.toInt('right') >= 0) {
                                        current.anchor(mapLayout['right'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                        if (current.toInt('left') > 0) {
                                            current.anchor(mapLayout['left'], 'parent');
                                            current.modifyBox($enum.BOX_STANDARD.MARGIN_LEFT, current.toInt('left'));
                                            alignMarginLeft = true;
                                        }
                                    }
                                    if (!alignMarginLeft && current.left != null && current.toInt('left') === 0) {
                                        current.anchor(mapLayout['left'], 'parent', AXIS_ANDROID.HORIZONTAL);
                                        if (current.toInt('right') > 0) {
                                            current.anchor(mapLayout['right'], 'parent');
                                            current.modifyBox($enum.BOX_STANDARD.MARGIN_RIGHT, current.toInt('right'));
                                        }
                                    }
                                    if (current.top != null && current.toInt('top') === 0) {
                                        current.anchor(mapLayout['top'], 'parent', AXIS_ANDROID.VERTICAL);
                                    }
                                    if (current.bottom != null && current.toInt('bottom') >= 0) {
                                        current.anchor(mapLayout['bottom'], 'parent', AXIS_ANDROID.VERTICAL);
                                    }
                                    if (current.left === 0 &&
                                        current.right === 0 &&
                                        !current.floating &&
                                        !current.has('width', $enum.CSS_STANDARD.PERCENT))
                                    {
                                        current.android('layout_width', 'match_parent');
                                    }
                                    if (current.top === 0 && current.bottom === 0) {
                                        current.android('layout_height', 'match_parent');
                                    }
                                });
                            }
                        }
                        if (flex.enabled || columnCount > 0 || (!this.settings.constraintChainDisabled && pageflow.length > 1)) {
                            const horizontal: NodeList<T>[] = [];
                            const vertical: NodeList<T>[] = [];
                            if (flex.enabled) {
                                if (flex.wrap === 'nowrap') {
                                    switch (flex.direction) {
                                        case 'row-reverse':
                                            const row = pageflow.clone();
                                            row.list.reverse();
                                            horizontal.push(row);
                                            break;
                                        case 'row':
                                            horizontal.push(pageflow.clone());
                                            break;
                                        case 'column-reverse':
                                            const column = pageflow.clone();
                                            column.list.reverse();
                                            vertical.push(column);
                                            break;
                                        case 'column':
                                            vertical.push(pageflow.clone());
                                            break;
                                    }
                                }
                                else {
                                    const sorted = pageflow.clone();
                                    const map: ObjectIndex<T[]> = {};
                                    const levels: number[] = [];
                                    function reverseMap() {
                                        for (const y in map) {
                                            map[y].reverse();
                                        }
                                    }
                                    switch (flex.direction) {
                                        case 'row-reverse':
                                        case 'column-reverse':
                                            sorted.list.reverse();
                                            break;
                                    }
                                    sorted.each(item => {
                                        const y = item.linear.top;
                                        if (map[y] == null) {
                                            map[y] = [];
                                            levels.push(y);
                                        }
                                        map[y].push(item);
                                    });
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
                                    levels.forEach(value => horizontal.push(new NodeList(map[value])));
                                }
                            }
                            else if (columnCount > 0) {
                                const columns: T[][] = [];
                                const perRowCount = Math.ceil(pageflow.length / Math.min(columnCount, pageflow.length));
                                for (let i = 0, j = 0; i < pageflow.length; i++) {
                                    const item = pageflow.get(i);
                                    if (i % perRowCount === 0) {
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
                                const marginLeft = $util.convertInt(node.css('columnGap')) || 16;
                                const marginTotal: number = columns.map(list => Math.max.apply(null, list.map(item => item.marginLeft + item.marginRight))).reduce((a: number, b: number) => a + b, 0);
                                const marginPercent = Math.max(((marginTotal + (marginLeft * (columnCount - 1))) / node.box.width) / columnCount, 0.01);
                                for (let i = 0; i < columns.length; i++) {
                                    const column = columns[i];
                                    const first = column[0];
                                    if (i > 0) {
                                        first.android(`layout_${parseRTL('marginLeft', this.settings)}`, $util.formatPX(first.marginLeft + marginLeft));
                                    }
                                    row.push(first);
                                    column.forEach(item => {
                                        if (!item.hasWidth) {
                                            item.android('layout_width', '0px');
                                            item.app('layout_constraintWidth_percent', ((1 / columnCount) - marginPercent).toFixed(2));
                                        }
                                    });
                                    vertical.push(new NodeList(column));
                                }
                                horizontal.push(new NodeList(row));
                            }
                            else {
                                function partitionChain<T extends View>(current: T, siblings: NodeList<T>, orientation: string, validate: boolean) {
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
                                    return coordinate.map(value => {
                                        const sameXY = $util.sortAsc(siblings.list.filter(item => $util.sameValue(current, item, value) && item[orientation === AXIS_ANDROID.HORIZONTAL ? 'intersectX' : 'intersectY'](current.linear)), coordinate[0]);
                                        if (sameXY.length > 1) {
                                            if (!validate || (sameXY.every(item => !item.floating) && sameXY[0].app(mapParent[0]) === 'parent' && sameXY[sameXY.length - 1].app(mapParent[1]) === 'parent')) {
                                                return sameXY;
                                            }
                                            else {
                                                const chained = new Set([current]);
                                                let valid: boolean;
                                                do {
                                                    valid = false;
                                                    Array.from(chained).some(item =>
                                                        sameXY.some(adjacent => {
                                                            if (!chained.has(adjacent) && (
                                                                    adjacent.app(connected[0]) === item.stringId ||
                                                                    adjacent.app(connected[1]) === item.stringId
                                                               ))
                                                            {
                                                                chained.add(adjacent);
                                                                valid = true;
                                                            }
                                                            return valid;
                                                        })
                                                    );
                                                }
                                                while (valid);
                                                return Array.from(chained);
                                            }
                                        }
                                        return [];
                                    })
                                    .reduce((a, b) => a.length >= b.length ? a : b);
                                }
                                const mapId = new Set<string>();
                                const horizontalChain = pageflow.list.filter(current => !current.constraint.horizontal);
                                const verticalChain = pageflow.list.filter(current => !current.constraint.vertical);
                                function availableChain(list: T[]) {
                                    const id = list.map(item => item.id).sort().join('-');
                                    return !mapId.has(id) && mapId.add(id) != null;
                                }
                                pageflow.list.some(current => {
                                    const horizontalOutput: T[] = [];
                                    const verticalOutput: T[] = [];
                                    if (horizontalChain.includes(current)) {
                                        horizontalOutput.push(...partitionChain(current, pageflow, AXIS_ANDROID.HORIZONTAL, !percentage));
                                        if (horizontalOutput.length > 1 && availableChain(horizontalOutput)) {
                                            horizontal.push(new NodeList(horizontalOutput).sortAsc('linear.left'));
                                        }
                                    }
                                    if (verticalChain.includes(current) && !percentage) {
                                        verticalOutput.push(...partitionChain(current, pageflow, AXIS_ANDROID.VERTICAL, true));
                                        if (verticalOutput.length > 1 && availableChain(verticalOutput)) {
                                            vertical.push(new NodeList(verticalOutput).sortAsc('linear.top'));
                                        }
                                    }
                                    return horizontalOutput.length === pageflow.length || verticalOutput.length === pageflow.length;
                                });
                                horizontal.sort((a, b) => a.length >= b.length ? -1 : 1);
                                vertical.sort((a, b) => a.length >= b.length ? -1 : 1);
                            }
                            [horizontal, vertical].forEach((connected, index) => {
                                if (connected.length > 0) {
                                    const inverse = index === 0 ? 1 : 0;
                                    const connectedRows: NodeList<T>[] = [];
                                    connected.forEach((chainable, level) => {
                                        if (chainable.length > 0) {
                                            const [HV, VH] = [MAP_CHAIN['horizontalVertical'][index], MAP_CHAIN['horizontalVertical'][inverse]];
                                            const [LT, TL] = [MAP_CHAIN['leftTop'][index], MAP_CHAIN['leftTop'][inverse]];
                                            const [RB, BR] = [MAP_CHAIN['rightBottom'][index], MAP_CHAIN['rightBottom'][inverse]];
                                            const [WH, HW] = [MAP_CHAIN['widthHeight'][index], MAP_CHAIN['widthHeight'][inverse]];
                                            const orientation = HV.toLowerCase();
                                            const orientationInverse = VH.toLowerCase();
                                            const dimension = WH.toLowerCase();
                                            if (flex.enabled) {
                                                if (chainable.list.some(item => item.flex.order > 0)) {
                                                    chainable[flex.direction.indexOf('reverse') !== -1 ? 'sortDesc' : 'sortAsc']('flex.order');
                                                }
                                            }
                                            else if (!percentage && columnCount === 0) {
                                                if (chainable.list.every(item => anchoredSibling(item, nodes, orientation))) {
                                                    return;
                                                }
                                            }
                                            chainable.parent = node;
                                            const first = chainable.get(0);
                                            const last = chainable.get();
                                            let disconnected = false;
                                            let marginDelete = false;
                                            let maxOffset = -1;
                                            const attrs = index === 0 ? ['left', 'leftRight', 'top', AXIS_ANDROID.VERTICAL, 'hasWidth', 'right', 'marginHorizontal']
                                                                      : ['top', 'topBottom', 'left', AXIS_ANDROID.HORIZONTAL, 'hasHeight', 'bottom', 'marginVertical'];
                                            for (let i = 0; i < chainable.length; i++) {
                                                const item = chainable.get(i);
                                                if (i === 0) {
                                                    if (!mapParent(item, attrs[0])) {
                                                        disconnected = true;
                                                        break;
                                                    }
                                                }
                                                else {
                                                    if (!mapSibling(item, attrs[1])) {
                                                        disconnected = true;
                                                        break;
                                                    }
                                                }
                                            }
                                            if (!disconnected) {
                                                if (chainable.list.every(item => $util.sameValue(first, item, `linear.${attrs[2]}`))) {
                                                    for (let j = 1; j < chainable.length; j++) {
                                                        const item = chainable.get(j);
                                                        if (!item.constraint[attrs[3]]) {
                                                            item.anchor(mapLayout[attrs[2]], first.stringId, attrs[3]);
                                                        }
                                                    }
                                                }
                                                if (!flex.enabled && node[attrs[4]] === 0) {
                                                    mapDelete(last, attrs[5]);
                                                    last.constraint[attrs[6]] = mapSibling(last, attrs[1]);
                                                }
                                            }
                                            if (percentage) {
                                                first.anchor(mapLayout[LT], 'parent', orientation);
                                                last.anchor(mapLayout[RB], 'parent', orientation);
                                                if (!node.renderParent.autoMarginHorizontal) {
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
                                                        setAlignParent(chain, orientationInverse);
                                                    }
                                                    const rowNext = connected[level + 1];
                                                    if (rowNext) {
                                                        const chainNext = rowNext.get(i);
                                                        if (chainNext && chain.withinY(chainNext.linear)) {
                                                            chain.anchor(mapLayout['bottomTop'], chainNext.stringId);
                                                            if (!mapParent(chain, 'bottom')) {
                                                                mapDelete(chain, 'bottom');
                                                            }
                                                        }
                                                    }
                                                }
                                                else if (percentage) {
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
                                                        if (anchorAbove) {
                                                            chain.anchor(mapLayout['topBottom'], anchorAbove.stringId);
                                                        }
                                                    }
                                                    const width = chain.css('width');
                                                    if ($util.isPercent(width)) {
                                                        chain.android('layout_width', '0px');
                                                        chain.app(`layout_constraint${WH}_percent`, (parseInt(width) / 100).toFixed(2));
                                                    }
                                                    chain.constraint.horizontal = true;
                                                    chain.constraint.vertical = true;
                                                }
                                                else if (columnCount > 0) {
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
                                                if (!chain.has(dimension) || chain.has(dimension, $enum.CSS_STANDARD.PERCENT)) {
                                                    const minWH = chain.styleMap[`min${WH}`];
                                                    const maxWH = chain.styleMap[`max${WH}`];
                                                    if ($util.isUnit(minWH)) {
                                                        chain.app(`layout_constraint${WH}_min`, minWH);
                                                        chain.android(`layout_${dimension}`, '0px');
                                                    }
                                                    if ($util.isUnit(maxWH)) {
                                                        chain.app(`layout_constraint${WH}_max`, maxWH);
                                                        chain.android(`layout_${dimension}`, '0px');
                                                    }
                                                }
                                                if (flex.enabled) {
                                                    chain.app(`layout_constraint${HV}_weight`, chain.flex.grow.toString());
                                                    if (chain[`view${WH}`] === 0 && chain.flex.grow === 0 && chain.flex.shrink <= 1) {
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
                                                            const valid = chainable.list.some(adjacent => {
                                                                if (adjacent !== chain && adjacent.nodeType <= $enum.NODE_STANDARD.TEXT) {
                                                                    chain.anchor(mapLayout['baseline'], adjacent.stringId);
                                                                    return true;
                                                                }
                                                                return false;
                                                            });
                                                            if (valid) {
                                                                mapDelete(chain, 'top', 'bottom');
                                                                chainable.each(item => {
                                                                    if (mapSibling(item, 'top') === chain.stringId) {
                                                                        mapDelete(item, 'top');
                                                                    }
                                                                    if (mapSibling(item, 'bottom') === chain.stringId) {
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
                                                            chain.constraint[orientationInverse] = false;
                                                            setAlignParent(chain, orientationInverse);
                                                            break;
                                                    }
                                                    if (chain.flex.basis !== 'auto') {
                                                        const basis = $util.convertInt(chain.flex.basis);
                                                        if (basis > 0) {
                                                            if ($util.isPercent(chain.flex.basis)) {
                                                                chain.app(`layout_constraint${WH}_percent`, (basis / 100).toFixed(2));
                                                            }
                                                            else {
                                                                chain.app(`layout_constraint${WH}_min`, $util.formatPX(basis));
                                                                chain.constraint[`min${WH}`] = true;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            const chainStyle = `layout_constraint${HV}_chainStyle`;
                                            if (flex.enabled &&
                                                flex.justifyContent !== 'normal' &&
                                                Math.max.apply(null, chainable.list.map(item => item.flex.grow)) === 0)
                                            {
                                                switch (flex.justifyContent) {
                                                    case 'space-between':
                                                        first.app(chainStyle, 'spread_inside');
                                                        break;
                                                    case 'space-evenly':
                                                        first.app(chainStyle, 'spread');
                                                        chainable.each(item => item.app(`layout_constraint${HV}_weight`, (item.flex.grow || 1).toString()));
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
                                            else if (percentage) {
                                                first.app(chainStyle, 'packed');
                                            }
                                            else if (!flex.enabled && columnCount > 0) {
                                                first.app(chainStyle, index === 0 ? 'spread_inside' : 'packed');
                                                marginDelete = index === 0;
                                            }
                                            else {
                                                const alignLeft = $util.withinFraction(node.box.left, first.linear.left);
                                                const alignRight = $util.withinFraction(last.linear.right, node.box.right);
                                                const alignTop = $util.withinFraction(node.box.top, first.linear.top);
                                                const alignBottom = $util.withinFraction(last.linear.bottom, node.box.bottom);
                                                if ((orientation === AXIS_ANDROID.HORIZONTAL && alignLeft && alignRight) ||
                                                    (orientation === AXIS_ANDROID.VERTICAL && alignTop && alignBottom))
                                                {
                                                    if (flex.enabled || chainable.length > 2) {
                                                        if (!flex.enabled && node.inlineElement) {
                                                            first.app(chainStyle, 'packed');
                                                            first.app(`layout_constraint${HV}_bias`, index === 0 && node.float === 'right' ? '1' : '0');
                                                        }
                                                        else {
                                                            first.app(chainStyle, 'spread_inside');
                                                            marginDelete = true;
                                                        }
                                                    }
                                                    else if (maxOffset > this.settings[`constraintChainPacked${HV}Offset`]) {
                                                        if (mapParent(first, LT)) {
                                                            mapDelete(first, MAP_CHAIN['rightLeftBottomTop'][index]);
                                                        }
                                                        if (mapParent(last, RB)) {
                                                            mapDelete(last, MAP_CHAIN['leftRightTopBottom'][index]);
                                                        }
                                                    }
                                                }
                                                else if (
                                                    (maxOffset <= this.settings[`chainPacked${HV}Offset`] || node.flex.wrap !== 'nowrap') ||
                                                    (orientation === AXIS_ANDROID.HORIZONTAL && (alignLeft || alignRight)))
                                                {
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
                                                        if (chainable.list.some(lower => !$util.sameValue(first, lower, `linear.${opposing[1]}`)) &&
                                                            chainable.list.every(upper => $util.sameValue(first, upper, `linear.${opposing[0]}`)))
                                                        {
                                                            chainable.each(item => mapDelete(item, opposing[1]));
                                                        }
                                                    });
                                                    chainable.each(item => {
                                                        for (const list of connected) {
                                                            if (list.find('id', item.id)) {
                                                                list.clear();
                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                            if (marginDelete) {
                                                chainable.each(item => {
                                                    delete item.constraint.marginHorizontal;
                                                    delete item.constraint.marginVertical;
                                                });
                                            }
                                            connectedRows.push(chainable);
                                        }
                                    });
                                }
                            });
                        }
                        pageflow.each(current => {
                            current.constraint.horizontal = anchoredSibling(current, nodes, AXIS_ANDROID.HORIZONTAL);
                            current.constraint.vertical = anchoredSibling(current, nodes, AXIS_ANDROID.VERTICAL);
                        });
                        if (flex.enabled) {
                            if (flex.wrap !== 'nowrap') {
                                ['topBottom', 'bottomTop'].forEach((value, index) => {
                                    pageflow.each(current => {
                                        if (mapParent(current, index === 0 ? 'bottom' : 'top')) {
                                            const chain: T[] = [current];
                                            let valid = false;
                                            let adjacent: Null<T> = current;
                                            while (adjacent) {
                                                const topBottom = mapSibling(adjacent, value);
                                                if (topBottom) {
                                                    adjacent = nodes.find('nodeId', stripId(topBottom));
                                                    if (adjacent && current.withinY(adjacent.linear)) {
                                                        chain.push(adjacent);
                                                        if (mapParent(adjacent, index === 0 ? 'top' : 'bottom')) {
                                                            valid = true;
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
                                    });
                                });
                            }
                        }
                        else if (columnCount === 0) {
                            pageflow.each(current => {
                                [['top', 'bottom', 'topBottom'], ['bottom', 'top', 'bottomTop']].forEach(direction => {
                                    if (mapParent(current, direction[1]) && !mapSibling(current, direction[2])) {
                                        ['leftRight', 'rightLeft'].forEach(value => {
                                            const stringId = mapSibling(current, value);
                                            if (stringId) {
                                                const aligned = pageflow.find('stringId', stringId);
                                                if (aligned && mapSibling(aligned, direction[2])) {
                                                    if ($util.withinFraction(current.linear[direction[0]], aligned.linear[direction[0]])) {
                                                        current.anchor(mapLayout[direction[0]], aligned.stringId);
                                                    }
                                                    if ($util.withinFraction(current.linear[direction[1]], aligned.linear[direction[1]])) {
                                                        current.anchor(mapLayout[direction[1]], aligned.stringId);
                                                    }
                                                }
                                            }
                                        });
                                    }
                                });
                            });
                            const unbound = pageflow.list.filter(current =>
                                !current.anchored && (
                                    mapParent(current, 'top') ||
                                    mapParent(current, 'right') ||
                                    mapParent(current, 'bottom') ||
                                    mapParent(current, 'left')
                                )
                            );
                            if (nodes.list.filter(item => item.anchored).length === 0 && unbound.length === 0) {
                                unbound.push(nodes.get(0));
                            }
                            unbound.forEach(current => this.addGuideline(current, '', false, false));
                            const [adjacent, unanchored] = nodes.partition(item => item.anchored);
                            unanchored.each(current => {
                                if ($util.withinRange(current.horizontalBias(this.settings), 0.5, 0.01) && $util.withinRange(current.verticalBias(this.settings), 0.5, 0.01)) {
                                    setAlignParent(current);
                                }
                                else if (
                                    this.settings.constraintCirclePositionAbsolute &&
                                    adjacent.length > 0 &&
                                    !current.constraint.horizontal &&
                                    !current.constraint.vertical)
                                {
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
                                        degrees = center1.x > center2.x ? 90 : 270;
                                    }
                                    current.delete('app', 'layout_constraint*');
                                    current.app('layout_constraintCircle', opposite.stringId);
                                    current.app('layout_constraintCircleRadius', delimitUnit(`${current.nodeName}`, 'constraintcircleradius', $util.formatPX(radius), this.settings));
                                    current.app('layout_constraintCircleAngle', degrees.toString());
                                    current.constraint.horizontal = true;
                                    current.constraint.vertical = true;
                                }
                                else {
                                    this.addGuideline(current);
                                }
                            });
                            let bottomParent: Null<boolean> = null;
                            let rightParent: Null<boolean> = null;
                            const maxBottom: number = Math.max.apply(null, nodes.list.map(item => item.linear.bottom));
                            const connected: ObjectMapNested<string> = {};
                            function deleteChain(item: T, value: string) {
                                mapDelete(item, value);
                                delete connected[item.stringId][value];
                            }
                            for (let i = 0; i < nodes.length; i++) {
                                const current = nodes.get(i);
                                const top = mapParent(current, 'top');
                                const right = mapParent(current, 'right');
                                let bottom = mapParent(current, 'bottom');
                                const left = mapParent(current, 'left');
                                connected[current.stringId] = {
                                    leftRight: mapSibling(current, 'leftRight'),
                                    rightLeft: mapSibling(current, 'rightLeft'),
                                    topBottom: mapSibling(current, 'topBottom'),
                                    bottomTop: mapSibling(current, 'bottomTop')
                                };
                                if ((bottom && mapSibling(current, 'topBottom') && current.hasHeight) ||
                                    (top && bottom && current.linear.bottom < maxBottom && !current.has('marginTop', $enum.CSS_STANDARD.AUTO)))
                                {
                                    mapDelete(current, 'bottom');
                                    bottom = false;
                                }
                                if (current.pageflow) {
                                    [
                                        [left, right, 'rightLeft', 'leftRight', 'right', 'left', 'Horizontal'],
                                        [top, bottom, 'bottomTop', 'topBottom', 'bottom', 'top', 'Vertical']
                                    ]
                                    .forEach((value: [boolean, boolean, string, string, string, string, string], index) => {
                                        if (value[0] || value[1]) {
                                            let valid = value[0] && value[1];
                                            let next: Null<T> = current;
                                            if (!valid) {
                                                do {
                                                    const stringId = mapSibling(next, value[0] ? value[2] : value[3]);
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
                                                while (next);
                                            }
                                            if (valid) {
                                                node.constraint[`layout${value[6]}`] = true;
                                            }
                                            if (!current.constraint[`chain${value[6]}`]) {
                                                if (value[0] && value[1]) {
                                                    if (!current.autoMargin && !current.linearVertical) {
                                                        current.android(`layout_${index === 0 ? 'width' : 'height'}`, 'match_parent', false);
                                                    }
                                                }
                                                else if (value[1]) {
                                                    if (valid) {
                                                        const below = this.findByStringId(mapSibling(current, value[3]));
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
                                            rightParent = anchoredSibling(current, nodes, AXIS_ANDROID.HORIZONTAL);
                                        }
                                    }
                                    else if (left) {
                                        if (current.is($enum.NODE_STANDARD.TEXT) && current.cssParent('textAlign', true) === 'center') {
                                            current.anchor(mapLayout['right'], 'parent');
                                        }
                                        if (current.textElement &&
                                            !current.hasWidth &&
                                            current.toInt('maxWidth') === 0 &&
                                            current.multiLine &&
                                            !$dom.hasLineBreak(current.element) &&
                                            !nodes.list.some(item => mapSibling(item, 'rightLeft') === current.stringId))
                                        {
                                            current.android('layout_width', 'match_parent');
                                        }
                                    }
                                    if (bottom) {
                                        if (!bottomParent) {
                                            bottomParent = false;
                                            bottomParent = anchoredSibling(current, nodes, AXIS_ANDROID.VERTICAL);
                                        }
                                    }
                                }
                                else {
                                    if (left && right && current.right == null && current.hasWidth) {
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
                                    if (top && bottom && current.bottom == null && current.hasHeight) {
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
                                    if (left && right && !node.hasWidth) {
                                        node.constraint.layoutWidth = true;
                                    }
                                    if (top && bottom && !node.hasHeight) {
                                        node.constraint.layoutHeight = true;
                                    }
                                    if (right && current.toInt('right') > 0) {
                                        current.modifyBox($enum.BOX_STANDARD.MARGIN_RIGHT, Math.max(current.toInt('right') - node.paddingRight, 0));
                                    }
                                    if (bottom && current.toInt('bottom') > 0) {
                                        current.modifyBox($enum.BOX_STANDARD.MARGIN_BOTTOM, Math.max(current.toInt('bottom') - node.paddingBottom, 0));
                                    }
                                    if (right && bottom) {
                                        if (node.documentRoot) {
                                            if (!node.hasWidth) {
                                                node.constraint.layoutWidth = false;
                                                node.constraint.layoutHorizontal = false;
                                            }
                                            if (!node.hasHeight) {
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
                                                const conflict = nodes.find('stringId', connected[left][value]);
                                                if (conflict) {
                                                    [nodes.find('stringId', left), nodes.find('stringId', right)].some((item, index) => {
                                                        if (item) {
                                                            const stringId = index === 0 ? left : right;
                                                            switch (value) {
                                                                case 'leftRight':
                                                                case 'rightLeft':
                                                                    if ((mapSibling(item, 'left') || mapSibling(item, 'right')) &&
                                                                        mapSibling(conflict, value === 'rightLeft' ? 'leftRight' : 'rightLeft') !== stringId)
                                                                    {
                                                                        deleteChain(item, value);
                                                                        return true;
                                                                    }
                                                                    break;
                                                                case 'bottomTop':
                                                                case 'topBottom':
                                                                    if ((mapSibling(item, 'top') || mapSibling(item, 'bottom')) &&
                                                                        mapSibling(conflict, value === 'topBottom' ? 'bottomTop' : 'topBottom') !== stringId)
                                                                    {
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
                nodes.each(current => {
                    if (current.constraint.marginHorizontal) {
                        const previous = this.findByStringId(current.constraint.marginHorizontal);
                        if (previous) {
                            const offset = current.linear.left - previous.actualRight();
                            if (offset >= 1) {
                                current.modifyBox($enum.BOX_STANDARD.MARGIN_LEFT, offset);
                            }
                        }
                    }
                    if (current.constraint.marginVertical) {
                        const previous = this.findByStringId(current.constraint.marginVertical);
                        if (previous) {
                            const offset = current.linear.top - previous.linear.bottom;
                            if (offset >= 1) {
                                current.modifyBox($enum.BOX_STANDARD.MARGIN_TOP, offset);
                            }
                        }
                    }
                });
            }
            else {
                if (node.linearHorizontal) {
                    const lineHeight: number = Math.max.apply(null, node.renderChildren.map(item => item.toInt('lineHeight')));
                    if (lineHeight > 0) {
                        let minHeight = Number.MAX_VALUE;
                        let offsetTop = 0;
                        const valid = node.renderChildren.every(item => {
                            const offset = lineHeight - item.bounds.height;
                            if (offset > 0) {
                                minHeight = Math.min(offset, minHeight);
                                if (lineHeight === item.toInt('lineHeight')) {
                                    offsetTop = Math.max(item.toInt('top') < 0 ? Math.abs(item.toInt('top')) : 0, offsetTop);
                                }
                                return true;
                            }
                            return false;
                        });
                        if (valid) {
                            node.modifyBox($enum.BOX_STANDARD.PADDING_TOP, Math.floor(minHeight / 2));
                            node.modifyBox($enum.BOX_STANDARD.PADDING_BOTTOM, Math.ceil(minHeight / 2) + offsetTop);
                        }
                    }
                }
            }
        });
    }

    public createGroup(parent: T, node: T, children: T[]) {
        const group = new ViewGroup(this.cache.nextId, node, parent, children) as T;
        if (children.length > 0) {
            children.forEach(item => item.inherit(group, 'data'));
        }
        this.cache.append(group);
        return group;
    }

    public renderGroup(node: T, parent: T, nodeType: number | string, options?: ObjectMap<StringMap>) {
        const target = $util.hasValue(node.dataset.target) && !$util.hasValue(node.dataset.include);
        if (typeof nodeType === 'number') {
            node.nodeType = nodeType;
            nodeType = View.getControlName(nodeType);
        }
        switch (nodeType) {
            case NODE_ANDROID.LINEAR:
                options = {
                    android: {
                        orientation: options && options.horizontal ? AXIS_ANDROID.HORIZONTAL : AXIS_ANDROID.VERTICAL
                    }
                };
                break;
            case NODE_ANDROID.GRID:
                options = {
                    android: {
                        columnCount: options && $util.convertInt(options.columnCount) > 0 ? options.columnCount.toString() : '2',
                        rowCount: options && $util.convertInt(options.rowCount) > 0 ? options.rowCount.toString() : ''
                    }
                };
                break;
            default:
                options = {};
                break;
        }
        node.setNodeType(nodeType);
        let preXml = '';
        let postXml = '';
        if (node.overflowX || node.overflowY) {
            const overflow: string[] = [];
            if (node.overflowX && node.overflowY) {
                overflow.push(NODE_ANDROID.SCROLL_HORIZONTAL, NODE_ANDROID.SCROLL_VERTICAL);
            }
            else {
                if (node.overflowX) {
                    overflow.push(NODE_ANDROID.SCROLL_HORIZONTAL);
                }
                if (node.overflowY) {
                    overflow.push(NODE_ANDROID.SCROLL_VERTICAL);
                }
            }
            let previous: Null<T> = null;
            const scrollView = overflow.map((controlName, index) => {
                const container = new View(this.cache.nextId, index === 0 ? node.element : undefined) as T;
                container.api = node.api;
                container.nodeName = node.nodeName;
                container.setNodeType(controlName);
                if (index === 0) {
                    container.inherit(node, 'initial', 'base', 'data', 'style', 'styleMap');
                    parent.replaceChild(node, container);
                    container.render(parent);
                }
                else {
                    container.init();
                    container.documentParent = node.documentParent;
                    container.inherit(node, 'dimensions');
                    container.inherit(node, 'initial', 'style', 'styleMap');
                    if (previous) {
                        previous.css('overflow', 'visible scroll');
                        previous.css('overflowX', 'scroll');
                        previous.css('overflowY', 'visible');
                        container.parent = previous;
                        container.render(previous);
                    }
                    container.css('overflow', 'scroll visible');
                    container.css('overflowX', 'visible');
                    container.css('overflowY', 'scroll');
                    if (node.has('height', $enum.CSS_STANDARD.UNIT)) {
                        container.css('height', $util.formatPX(node.toInt('height') + node.paddingTop + node.paddingBottom));
                    }
                }
                container.resetBox($enum.BOX_STANDARD.PADDING);
                const indent = $util.repeat(container.renderDepth);
                preXml += `{<${container.id}}${indent}<${controlName}{@${container.id}}>\n` +
                          `{:${container.id}}`;
                postXml = `${indent}</${controlName}>\n{>${container.id}}` + (index === 1 ? '\n' : '') + postXml;
                previous = container;
                this.cache.append(container);
                return container;
            });
            if (scrollView.length === 2) {
                node.android('layout_width', 'wrap_content');
                node.android('layout_height', 'wrap_content');
            }
            else {
                node.android(node.overflowX ? 'layout_width' : 'layout_height', 'wrap_content');
            }
            node.removeElement();
            node.resetBox($enum.BOX_STANDARD.MARGIN);
            node.parent = scrollView[scrollView.length - 1];
            node.render(node.parent);
        }
        else {
            node.render(target ? node : parent);
        }
        node.apply(options);
        return ViewController.getEnclosingTag(
            target || $util.hasValue(parent.dataset.target) || (node.renderDepth === 0 && !node.documentRoot) ? -1 : node.renderDepth,
            nodeType,
            node.id,
            $xml.formatPlaceholder(node.id),
            preXml,
            postXml
        );
    }

    public renderNode(node: T, parent: T, nodeType: number | string, recursive = false): string {
        const target = $util.hasValue(node.dataset.target) && !$util.hasValue(node.dataset.include);
        if (typeof nodeType === 'number') {
            node.nodeType = nodeType;
            nodeType = View.getControlName(nodeType);
        }
        node.setNodeType(nodeType);
        switch (node.tagName) {
            case 'IMG': {
                if (!recursive) {
                    const element = <HTMLImageElement> node.element;
                    const percentWidth = node.has('width', $enum.CSS_STANDARD.PERCENT);
                    const percentHeight = node.has('height', $enum.CSS_STANDARD.PERCENT);
                    let width = node.toInt('width');
                    let height = node.toInt('height');
                    let scaleType = '';
                    if (percentWidth || percentHeight) {
                        scaleType = percentWidth && percentHeight ? 'fitXY' : 'fitCenter';
                    }
                    else {
                        if (width === 0) {
                            const match = /width="(\d+)"/.exec(element.outerHTML);
                            if (match) {
                                width = parseInt(match[1]);
                                node.css('width', $util.formatPX(match[1]));
                            }
                        }
                        if (height === 0) {
                            const match = /height="(\d+)"/.exec(element.outerHTML);
                            if (match) {
                                height = parseInt(match[1]);
                                node.css('height', $util.formatPX(match[1]));
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
                    if (!node.pageflow) {
                        const left = node.toInt('left');
                        const top = node.toInt('top');
                        if (left < 0 || top < 0) {
                            const container = new View(this.cache.nextId, node.element) as T;
                            container.api = this.settings.targetAPI;
                            container.excludeProcedure |= $enum.NODE_PROCEDURE.ALL;
                            container.excludeResource |= $enum.NODE_RESOURCE.ALL;
                            container.android('layout_width', width > 0 ? $util.formatPX(width) : 'wrap_content');
                            container.android('layout_height', height > 0 ? $util.formatPX(height) : 'wrap_content');
                            container.setBounds();
                            container.setNodeType(NODE_ANDROID.FRAME);
                            container.render(parent);
                            if (left < 0) {
                                node.modifyBox($enum.BOX_STANDARD.MARGIN_LEFT, left, true);
                                container.css('left', '0px');
                            }
                            if (top < 0) {
                                node.modifyBox($enum.BOX_STANDARD.MARGIN_TOP, top, true);
                                container.css('top', '0px');
                            }
                            node.parent = container;
                            this.cache.append(container);
                            return ViewController.getEnclosingTag(
                                container.renderDepth,
                                NODE_ANDROID.FRAME,
                                container.id,
                                this.renderNode(node, container, nodeType, true)
                            );
                        }
                    }
                    else {
                        if (parent.layoutHorizontal && node.baseline) {
                            node.android('baselineAlignBottom', 'true');
                        }
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
                if (!node.hasWidth) {
                    const cols = $util.convertInt(element.cols);
                    if (cols > 0) {
                        node.css('width', $util.formatPX(cols * 10));
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
                            const radiogroup = parent.children.map(item => {
                                if (item.renderAs) {
                                    item = item.renderAs as T;
                                }
                                const input = <HTMLInputElement> item.element;
                                if (item.visible &&
                                    !item.rendered &&
                                    input.type === 'radio' &&
                                    input.name === element.name)
                                {
                                    return item;
                                }
                                return null;
                            })
                            .filter(item => item) as T[];
                            if (radiogroup.length > 1) {
                                const group = this.createGroup(parent, node, radiogroup);
                                group.setNodeType(NODE_ANDROID.RADIO_GROUP);
                                group.inherit(node, 'alignment');
                                group.render(parent);
                                let xml = '';
                                let checked = '';
                                for (const item of group.children) {
                                    if ((<HTMLInputElement> item.element).checked) {
                                        checked = item.stringId;
                                    }
                                    xml += this.renderNode(item as T, group, $enum.NODE_STANDARD.RADIO, true);
                                }
                                group.android('orientation', NodeList.linearX(radiogroup, radiogroup.every(item => item.documentParent === radiogroup[0].documentParent)) ? AXIS_ANDROID.HORIZONTAL : AXIS_ANDROID.VERTICAL);
                                group.alignmentType |= $enum.NODE_ALIGNMENT.SEGMENTED;
                                if (checked !== '') {
                                    group.android('checkedButton', checked);
                                }
                                return ViewController.getEnclosingTag(group.renderDepth, NODE_ANDROID.RADIO_GROUP, group.id, xml);
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
                        if ($util.hasValue(element.min)) {
                            node.android('min', element.min);
                        }
                        if ($util.hasValue(element.max)) {
                            node.android('max', element.max);
                        }
                        if ($util.hasValue(element.value)) {
                            node.android('progress', element.value);
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
                        if (!node.hasWidth) {
                            const size = $util.convertInt(element.size);
                            if (size > 0) {
                                node.css('width', $util.formatPX(size * 10));
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
                if (node.has('maxWidth', $enum.CSS_STANDARD.UNIT)) {
                    node.android('maxWidth', node.css('maxWidth'));
                }
                if (node.has('maxHeight', $enum.CSS_STANDARD.UNIT)) {
                    node.android('maxHeight', node.css('maxHeight'));
                }
                if (node.css('whiteSpace') === 'nowrap') {
                    node.android('singleLine', 'true');
                }
                break;
            case NODE_ANDROID.LINE:
                if (!node.hasHeight) {
                    node.android('layout_height', $util.formatPX(node.borderTopWidth + node.borderBottomWidth + node.paddingTop + node.paddingBottom || 1));
                }
                break;
        }
        node.render(target ? node : parent);
        return ViewController.getEnclosingTag(
            target || $util.hasValue(parent.dataset.target) || (node.renderDepth === 0 && !node.documentRoot) ? -1 : node.renderDepth,
            node.controlName,
            node.id
        );
    }

    public renderNodeStatic(nodeType: number | string, depth: number, options = {}, width = '', height = '', node?: T, children?: boolean) {
        if (!node) {
            node = new View() as T;
            node.api = this.settings.targetAPI;
        }
        node.apply(options);
        const renderDepth = Math.max(0, depth);
        let viewName =  '';
        if (typeof nodeType === 'number') {
            node.nodeType = nodeType;
            viewName = View.getControlName(nodeType);
        }
        else {
            viewName = nodeType;
        }
        switch (viewName) {
            case 'include':
            case 'merge':
            case 'menu':
                break;
            default:
                node.setNodeType(viewName);
                break;
        }
        const displayName = node.styleElement ? node.nodeName : viewName;
        if ($util.hasValue(width)) {
            if (!isNaN(parseInt(width))) {
                width = delimitUnit(displayName, 'width', width, this.settings);
            }
            node.android('layout_width', width, false);
        }
        if ($util.hasValue(height)) {
            if (!isNaN(parseInt(height))) {
                height = delimitUnit(displayName, 'height', height, this.settings);
            }
            node.android('layout_height', height, false);
        }
        node.renderDepth = renderDepth;
        let output = ViewController.getEnclosingTag(
            !node.documentRoot && depth === 0 ? -1 : depth,
            viewName,
            node.id,
            children ? $xml.formatPlaceholder(node.id) : ''
        );
        if (this.settings.showAttributes && node.id === 0) {
            const indent = $util.repeat(renderDepth + 1);
            const attrs = node.combine().map(value => `\n${indent + value}`).join('');
            output = output.replace($xml.formatPlaceholder(node.id, '@'), attrs);
        }
        options['stringId'] = node.stringId;
        return output;
    }

    public renderInclude(node: T, parent: T, name: string) {
        this._merge[name] = node.dataset.includeMerge === 'true';
        node.documentRoot = !this._merge[name];
        return this.renderNodeStatic(
            'include',
            parent.renderDepth + 1,
            {
                layout: `@layout/${name}`
            }
        );
    }

    public renderMerge(name: string, value: string[]) {
        let xml = value.join('');
        if (this._merge[name]) {
            const node = new View() as T;
            node.api = this.settings.targetAPI;
            node.documentRoot = true;
            xml = this.renderNodeStatic(
                'merge',
                0,
                {},
                '',
                '',
                node,
                true
            )
            .replace('{:0}', xml);
        }
        return xml;
    }

    public renderColumnSpace(depth: number, width: string, height = '', columnSpan = 1) {
        let percent = '';
        if ($util.isPercent(width)) {
            percent = (parseInt(width) / 100).toFixed(2);
            width = '0px';
        }
        return this.renderNodeStatic(
            $enum.NODE_STANDARD.SPACE,
            depth,
            {
                android: {
                    layout_columnWeight: percent,
                    layout_columnSpan: columnSpan.toString()
                }
            },
            width,
            $util.hasValue(height) ? height : 'wrap_content'
        );
    }

    public baseRenderDepth(name: string) {
        return this._merge[name] ? 0 : -1;
    }

    public setBoxSpacing(data: ViewData<NodeList<T>>) {
        data.cache.visible.forEach(node => node.rendered && node.setBoxSpacing(this.settings));
    }

    protected addGuideline(node: T, orientation = '', percent?: boolean, opposite?: boolean) {
        const map = MAP_LAYOUT.constraint;
        if (node.pageflow) {
            if (opposite == null) {
                opposite = (
                    node.float === 'right' ||
                    (node.left == null && node.right != null) ||
                    (node.textElement && node.css('textAlign') === 'right') ||
                    node.alignParent('right', this.settings)
                );
            }
            if (percent == null && opposite === true) {
                percent = true;
            }
        }
        if (node.dataset.constraintPercent) {
            percent = node.dataset.constraintPercent === 'true';
        }
        const parent = node.documentParent;
        const beginPercent = `layout_constraintGuide_${percent ? 'percent' : 'begin'}`;
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
                        LT = !opposite ? 'left' : 'right';
                        RB = !opposite ? 'right' : 'left';
                        LTRB = !opposite ? 'leftRight' : 'rightLeft';
                        RBLT = !opposite ? 'rightLeft' : 'leftRight';
                        if (node.position === 'relative' && node.toInt('left') < 0) {
                            offset = node.toInt('left');
                        }
                        break;
                    case 1:
                        LT = !opposite ? 'top' : 'bottom';
                        RB = !opposite ? 'bottom' : 'top';
                        LTRB = !opposite ? 'topBottom' : 'bottomTop';
                        RBLT = !opposite ? 'bottomTop' : 'topBottom';
                        if (node.position === 'relative' && node.toInt('top') < 0) {
                            offset = node.toInt('top');
                        }
                        break;
                }
                const dimension = node.pageflow ? 'bounds' : 'linear';
                const position = percent ? Math.abs((node[dimension][LT] + offset) - (parent.documentBody ? 0 : parent.box[LT])) / parent.box[index === 0 ? 'width' : 'height'] : 0;
                if (!percent && node.alignOrigin) {
                    found = parent.renderChildren.some(item => {
                        if (item !== node && item.constraint[value] && (
                                !item.constraint[`chain${$util.capitalize(value)}`] || item.constraint[`margin${$util.capitalize(value)}`]
                           ))
                        {
                            if ($util.withinFraction(node.linear[LT] + offset, item.linear[RB])) {
                                node.anchor(map[LTRB], item.stringId, value, true);
                                return true;
                            }
                            else if ($util.withinFraction(node.linear[RB] + offset, item.linear[LT])) {
                                node.anchor(map[RBLT], item.stringId, value, true);
                                return true;
                            }
                            if ($util.withinFraction(node.bounds[LT] + offset, item.bounds[LT])) {
                                node.anchor(
                                    map[
                                        index === 1 &&
                                        node.textElement &&
                                        node.baseline &&
                                        item.textElement &&
                                        item.baseline ? 'baseline' : LT
                                    ],
                                    item.stringId,
                                    value,
                                    true
                                );
                                return true;
                            }
                            else if ($util.withinFraction(node.bounds[RB] + offset, item.bounds[RB])) {
                                node.anchor(map[RB], item.stringId, value, true);
                                return true;
                            }
                        }
                        return false;
                    });
                }
                if (!found) {
                    const guideline = parent.constraint.guideline || {};
                    let location = percent ? parseFloat(Math.abs(position - (!opposite ? 0 : 1)).toFixed(this.settings.constraintPercentAccuracy))
                                           : (!opposite ? (node[dimension][LT] + offset) - parent.box[LT] : (node[dimension][LT] + offset) - parent.box[RB]);
                    if (!percent && !opposite) {
                        if (location < 0) {
                            const padding = parent[`padding${$util.capitalize(LT)}`];
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
                        const options: ViewAttribute = {
                            android: {
                                orientation: index === 0 ? AXIS_ANDROID.VERTICAL : AXIS_ANDROID.HORIZONTAL
                            },
                            app: {
                                [beginPercent]: location.toString()
                            }
                        };
                        const anchors: {} = $util.optional(guideline, `${value}.${beginPercent}.${LT}`, 'object');
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
                                options.app[beginPercent] = delimitUnit(node.nodeName, 'constraintguide_begin', $util.formatPX(location), this.settings);
                            }
                            this.appendAfter(
                                node.id,
                                this.renderNodeStatic(
                                    NODE_ANDROID.GUIDELINE,
                                    node.renderDepth,
                                    options,
                                    'wrap_content',
                                    'wrap_content'
                                )
                            );
                            const stringId: string = options['stringId'];
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

    private setAttributes(data: ViewData<NodeList<T>>) {
        if (this.settings.showAttributes) {
            function parseAttributes(node: T) {
                if (node.dir === 'rtl') {
                    if (node.nodeType < $enum.NODE_STANDARD.INLINE) {
                        node.android('textDirection', 'rtl');
                    }
                    else if (node.length > 0) {
                        node.android('layoutDirection', 'rtl');
                    }
                }
                for (const name in node.dataset) {
                    if (/^attr[A-Z]+/.test(name)) {
                        const obj = $util.capitalize(name.substring(4), false);
                        (node.dataset[name] as string).split(';').forEach(values => {
                            const [key, value] = values.split('::');
                            if ($util.hasValue(key) && $util.hasValue(value)) {
                                node.attr(obj, key, value);
                            }
                        });
                    }
                }
                const indent = $util.repeat(node.renderDepth + 1);
                return node.combine().map(value => `\n${indent + value}`).join('');
            }
            function getRootNamespace(content: string) {
                let output = '';
                for (const namespace in XMLNS_ANDROID) {
                    if (new RegExp(`\\s+${namespace}:`).test(content)) {
                        output += `\n\t${getXmlNs(namespace)}`;
                    }
                }
                return output;
            }
            const cache: StringMap[] = data.cache.visible.map(node => ({ pattern: $xml.formatPlaceholder(node.id, '@'), attributes: parseAttributes(node) }));
            for (const value of [...data.views, ...data.includes]) {
                cache.forEach(item => value.content = value.content.replace(item.pattern, item.attributes));
                value.content = value.content.replace(`{#0}`, getRootNamespace(value.content));
            }
        }
    }

    private findByStringId(id: string) {
        return this.cache.find('stringId', id);
    }

    public get delegateNodeInit(): SelfWrapped<T> {
        return (self: T) => {
            self.api = this.settings.targetAPI;
        };
    }
}