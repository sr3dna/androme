import { WIDGET_ANDROID } from './lib/constants';
import { NODE_CACHE, generateNodeId } from './cache';
import { convertPX, convertInt, padLeft, hasValue } from './lib/util';
import { getBoxSpacing } from './lib/element';
import { getResource, insertResourceAsset } from './resource';
import Widget from './android/widget';
import WidgetList from './android/widgetlist';
import Layout from './android/layout';
import parseRTL from './localization';
import SETTINGS from './settings';

const VIEW_BEFORE = {};
const VIEW_AFTER = {};

function getEnclosingTag(depth, tagName, id, content = '', preXml = '', postXml = '') {
    const indent = padLeft(depth);
    let xml = preXml +
              `{<${id}}`;
    if (hasValue(content)) {
        xml += indent + `<${tagName}{@${id}}>\n` +
                        content +
               indent + `</${tagName}>\n`;
    }
    else {
        xml += indent + `<${tagName}{@${id}} />\n`;
    }
    xml += `{>${id}}` +
           postXml;
    return xml;
}

function setGridSpace(node) {
    if (node.parent.is(WIDGET_ANDROID.GRID)) {
        const dimensions = getBoxSpacing(node.parentOriginal.element, SETTINGS.supportRTL, true);
        const options = {
            android: {
                layout_columnSpan: node.renderParent.gridColumnSpan,
                layout_columnWeight: 1
            }
        };
        if (node.gridFirst) {
            const heightTop = dimensions.paddingTop + dimensions.marginTop;
            if (heightTop > 0) {
                addViewBefore(node.id, getStaticTag(WIDGET_ANDROID.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightTop))[0]);
            }
        }
        if (node.gridRowStart) {
            let marginLeft = dimensions[parseRTL('marginLeft')] + dimensions[parseRTL('paddingLeft')];
            if (marginLeft > 0) {
                marginLeft = convertPX(marginLeft + node.marginLeft);
                node.css('marginLeft', marginLeft)
                    .android(parseRTL('layout_marginLeft'), marginLeft);
            }
        }
        if (node.gridRowEnd) {
            const heightBottom = dimensions.marginBottom + dimensions.paddingBottom + (!node.gridLast ? dimensions.marginTop + dimensions.paddingTop : 0);
            let marginRight = dimensions[parseRTL('marginRight')] + dimensions[parseRTL('paddingRight')];
            if (heightBottom > 0) {
                addViewAfter(node.id, getStaticTag(WIDGET_ANDROID.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightBottom))[0]);
            }
            if (marginRight > 0) {
                marginRight = convertPX(marginRight + node.marginRight);
                node.css('marginRight', marginRight)
                    .android(parseRTL('layout_marginRight'), marginRight);
            }
        }
    }
}

export function renderViewLayout(node, parent, tagName) {
    let preXml = '';
    let postXml = '';
    let renderParent = parent;
    node.setAndroidId(tagName);
    if (node.overflow != 0) {
        const scrollView = [];
        if (node.overflowX) {
            scrollView.push(WIDGET_ANDROID.SCROLL_HORIZONTAL);
        }
        if (node.overflowY) {
            scrollView.push((node.ascend().some(item => item.overflow != 0) ? WIDGET_ANDROID.SCROLL_NESTED : WIDGET_ANDROID.SCROLL_VERTICAL));
        }
        let current = node;
        let scrollDepth = parent.renderDepth + scrollView.length;
        scrollView
            .map(widgetName => {
                const layout = new Layout(generateNodeId(), current, SETTINGS.targetAPI, null, new WidgetList([current]));
                NODE_CACHE.push(layout);
                layout.setAndroidId(widgetName);
                layout.setBounds();
                layout.android('fadeScrollbars', 'false');
                layout.setAttributes();
                switch (widgetName) {
                    case WIDGET_ANDROID.SCROLL_HORIZONTAL:
                        layout
                            .css('width', node.styleMap.width)
                            .css('minWidth', node.styleMap.minWidth)
                            .css('overflowX', node.styleMap.overflowX);
                        break;
                    default:
                        layout
                            .css('height', node.styleMap.height)
                            .css('minHeight', node.styleMap.minHeight)
                            .css('overflowY', node.styleMap.overflowY);
                }
                const indent = padLeft(scrollDepth--);
                preXml = indent + `<${widgetName}{@${layout.id}}>\n` + preXml;
                postXml += indent + `</${widgetName}>\n`;
                if (current == node) {
                    node.parent = layout;
                    renderParent = layout;
                }
                current = layout;
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
                current = item;
            });
    }
    node.setAttributes();
    node.applyCustomizations();
    node.render(renderParent);
    node.setGravity();
    setGridSpace(node);
    return getEnclosingTag(node.renderDepth, tagName, node.id, `{${node.id}}`, preXml, postXml);
}

export function renderViewTag(node, parent, tagName, recursive) {
    const element = node.element;
    node.setAndroidId(tagName);
    switch (element.tagName) {
        case 'IMG': {
            const image = element.src.substring(element.src.lastIndexOf('/') + 1);
            const format = image.substring(image.lastIndexOf('.') + 1).toLowerCase();
            let src = image.replace(/.\w+$/, '');
            switch (format) {
                case 'bmp':
                case 'gif':
                case 'jpg':
                case 'png':
                case 'webp':
                    src = insertResourceAsset(getResource('IMAGE'), src, element.src);
                    break;
                default:
                    src = `(UNSUPPORTED: ${image})`;
            }
            node.androidSrc = src;
            break;
        }
        case 'TEXTAREA': {
            node.android('minLines', 2);
            if (element.rows > 2) {
                node.android('maxLines', element.rows);
            }
            if (element.maxlength != null) {
                node.android('maxLength', parseInt(element.maxlength));
            }
            node.android('hint', element.placeholder)
                .android('scrollbars', 'vertical')
                .android('inputType', 'textMultiLine');
            if (node.styleMap.overflowX == 'scroll') {
                node.android('scrollHorizontally', 'true');
            }
            break;
        }
    }
    switch (node.widgetName) {
        case WIDGET_ANDROID.EDIT:
            node.android('inputType', 'text');
            break;
        case WIDGET_ANDROID.BUTTON: {
            if (node.viewWidth == 0) {
                node.android('minWidth', '0px');
            }
            if (node.viewHeight == 0) {
                node.android('minHeight', '0px');
            }
            break;
        }
    }
    if (node.overflow != 0) {
        let scrollbars = [];
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
                const result = node.parentOriginal.children.filter(item => (item.element.type == 'radio' && item.element.name == element.name));
                let content = '';
                if (result.length > 1) {
                    let rowSpan = 1;
                    let columnSpan = 1;
                    let checked = null;
                    const layout = new Layout(generateNodeId(), node, SETTINGS.targetAPI, parent, result);
                    NODE_CACHE.push(layout);
                    layout.setAndroidId(WIDGET_ANDROID.RADIO_GROUP);
                    layout.render(parent);
                    for (const radio of result) {
                        rowSpan += (convertInt(radio.android('layout_rowSpan')) || 1) - 1;
                        columnSpan += (convertInt(radio.android('layout_columnSpan')) || 1) - 1;
                        layout.inheritGrid(radio);
                        if (radio.element.checked) {
                            checked = radio;
                        }
                        radio.parent = layout;
                        radio.render(layout);
                        content += renderViewTag(radio, layout, WIDGET_ANDROID.RADIO, true);
                    }
                    if (rowSpan > 1) {
                        layout.android('layout_rowSpan', rowSpan);
                    }
                    if (columnSpan > 1) {
                        layout.android('layout_columnSpan', columnSpan);
                    }
                    layout
                        .android('orientation', (result.linearX ? 'horizontal' : 'vertical'))
                        .android('checkedButton', checked.stringId);
                    layout.setBounds();
                    layout.setAttributes();
                    setGridSpace(layout);
                    return getEnclosingTag(layout.renderDepth, WIDGET_ANDROID.RADIO_GROUP, layout.id, content);
                }
            }
            break;
        case 'password':
            node.android('inputType', 'textPassword');
            break;
    }
    node.setAttributes();
    node.applyCustomizations();
    node.render(parent);
    node.setGravity();
    node.cascade().forEach(item => item.hide());
    setGridSpace(node);
    return getEnclosingTag(node.renderDepth, node.widgetName, node.id);
}

export function getStaticTag(widgetName, depth, options, width = 'wrap_content', height = 'wrap_content') {
    let attributes = '';
    const node = new Widget(0, null, SETTINGS.targetAPI);
    node.setAndroidId(widgetName);
    if (SETTINGS.showAttributes) {
        node.apply(options)
            .android('id', node.stringId)
            .android('layout_width', width)
            .android('layout_height', height);
        const indent = padLeft(depth + 1);
        for (const attr of node.combine()) {
            attributes += `\n${indent + attr}`;
        }
    }
    return [getEnclosingTag(depth, widgetName, 0).replace('{@0}', attributes), node.stringId];
}

export function addViewBefore(id, xml, index = -1) {
    if (VIEW_BEFORE[id] == null) {
        VIEW_BEFORE[id] = [];
    }
    if (index != -1 && index < VIEW_BEFORE[id].length) {
        VIEW_BEFORE[id].splice(index, 0, xml);
    }
    else {
        VIEW_BEFORE[id].push(xml);
    }
}

export function addViewAfter(id, xml, index = -1) {
    if (VIEW_AFTER[id] == null) {
        VIEW_AFTER[id] = [];
    }
    if (index != -1 && index < VIEW_AFTER[id].length) {
        VIEW_AFTER[id].splice(index, 0, xml);
    }
    else {
        VIEW_AFTER[id].push(xml);
    }
}

export function insertViewBeforeAfter(output) {
    for (const id in VIEW_BEFORE) {
        output = output.replace(`{<${id}}`, VIEW_BEFORE[id].join(''));
    }
    for (const id in VIEW_AFTER) {
        output = output.replace(`{>${id}}`, VIEW_AFTER[id].join(''));
    }
    return output;
}