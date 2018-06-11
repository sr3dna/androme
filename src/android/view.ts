import Element from '../base/element';
import Widget from './widget';
import WidgetList from './widgetlist';
import Layout from './layout';
import { OVERFLOW_CHROME, WIDGET_ANDROID } from '../lib/constants';
import { convertPX, hasValue, padLeft } from '../lib/util';
import { getBoxSpacing } from '../lib/dom';
import { addResourceImage } from '../resource';
import parseRTL from '../lib/localization';
import SETTINGS from '../settings';

export default class View<T extends Widget> extends Element<T> {
    constructor(
        private cache: WidgetList<T>,
        public before: (id: number, xml: string, index: number) => void,
        public after: (id: number, xml: string, index: number) => void)
    {
        super();
    }

    public renderLayout(node: T, parent: T, tagName: string) {
        let preXml = '';
        let postXml = '';
        let renderParent = parent;
        node.setAndroidId(tagName);
        if (node.overflow !== OVERFLOW_CHROME.NONE) {
            const scrollView = [];
            if (node.overflowX) {
                scrollView.push(WIDGET_ANDROID.SCROLL_HORIZONTAL);
            }
            if (node.overflowY) {
                scrollView.push((node.ascend().some((item: T) => item.overflow !== OVERFLOW_CHROME.NONE) ? WIDGET_ANDROID.SCROLL_NESTED : WIDGET_ANDROID.SCROLL_VERTICAL));
            }
            let current = <Widget> node as T;
            let scrollDepth = parent.renderDepth + scrollView.length;
            scrollView
                .map(nodeName => {
                    const layout = <Widget> new Layout(this.cache.nextId, current, null, [current]) as T;
                    this.cache.push(layout);
                    layout.setAndroidId(nodeName);
                    layout.setBounds();
                    layout.android('fadeScrollbars', 'false');
                    layout.setAttributes();
                    switch (nodeName) {
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
                    preXml = indent + `<${nodeName}{@${layout.id}}>\n` + preXml;
                    postXml += indent + `</${nodeName}>\n`;
                    if (current === node) {
                        node.parent = layout;
                        renderParent = <Widget> layout as T;
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
        this.setGridSpace(node);
        return this.getEnclosingTag(node.renderDepth, tagName, node.id, `{${node.id}}`, preXml, postXml);
    }
    public renderTag(node: T, parent: T, tagName: string, recursive = false) {
        const element: any = node.element;
        node.setAndroidId(tagName);
        switch (element.tagName) {
            case 'IMG':
                let image = addResourceImage(element.src);
                if (image == null) {
                    image = `(UNSUPPORTED: ${element.src})`;
                }
                node.androidSrc = image;
                break;
            case 'TEXTAREA':
                node.android('minLines', '2');
                if (element.rows > 2) {
                    node.android('maxLines', element.rows);
                }
                if (element.maxlength != null) {
                    node.android('maxLength', element.maxlength);
                }
                node.android('hint', element.placeholder)
                    .android('scrollbars', 'vertical')
                    .android('inputType', 'textMultiLine');
                if (node.overflowX) {
                    node.android('scrollHorizontally', 'true');
                }
                break;
        }
        switch (node.nodeName) {
            case WIDGET_ANDROID.EDIT:
                node.android('inputType', 'text');
                break;
            case WIDGET_ANDROID.BUTTON:
                if (node.viewWidth === 0) {
                    node.android('minWidth', '0px');
                }
                if (node.viewHeight === 0) {
                    node.android('minHeight', '0px');
                }
                break;
        }
        if (node.overflow !== OVERFLOW_CHROME.NONE) {
            const scrollbars = [];
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
                    const result = node.parentOriginal.children.filter((radio: T) => ((<HTMLInputElement> radio.element).type === 'radio' && (<HTMLInputElement> radio.element).name === element.name)) as T[];
                    let xml = '';
                    if (result.length > 1) {
                        const layout = new Layout(this.cache.nextId, node, parent, result);
                        const widget = <Widget> layout as T;
                        let checked: T = null;
                        this.cache.push(widget);
                        layout.setAndroidId(WIDGET_ANDROID.RADIO_GROUP);
                        layout.render(parent);
                        for (const radio of result) {
                            layout.inheritGrid(radio);
                            if ((<HTMLInputElement> radio.element).checked) {
                                checked = radio;
                            }
                            radio.parent = layout;
                            radio.render(layout);
                            xml += this.renderTag(radio, widget, WIDGET_ANDROID.RADIO, true);
                        }
                        layout
                            .android('orientation', (layout.children as WidgetList<T>).linearX ? 'horizontal' : 'vertical')
                            .android('checkedButton', checked.stringId);
                        layout.setBounds();
                        layout.setAttributes();
                        this.setGridSpace(widget);
                        return this.getEnclosingTag(layout.renderDepth, WIDGET_ANDROID.RADIO_GROUP, layout.id, xml);
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
        node.setAccessibility();
        node.cascade().forEach((item: Widget) => item.hide());
        this.setGridSpace(node);
        return this.getEnclosingTag(node.renderDepth, node.nodeName, node.id);
    }
    public getStaticTag(nodeName: string, depth: number, options: {}, width = 'wrap_content', height = 'wrap_content') {
        const node = new Widget(0, SETTINGS.targetAPI);
        node.setAndroidId(nodeName);
        let attributes = '';
        if (SETTINGS.showAttributes) {
            node.apply(options)
                .android('id', node.stringId)
                .android('layout_width', width)
                .android('layout_height', height);
            const indent = padLeft(depth + 1);
            attributes = node.combine().map(value => `\n${indent + value}`).join('');
        }
        return [this.getEnclosingTag(depth, nodeName, 0).replace('{@0}', attributes), node.stringId];
    }

    private setGridSpace(node: T) {
        if (node.parent.is(WIDGET_ANDROID.GRID)) {
            const dimensions = getBoxSpacing(node.parentOriginal.element, true);
            const options = {
                android: {
                    layout_columnSpan: node.renderParent.gridColumnCount
                }
            };
            if (node.gridFirst) {
                const heightTop = dimensions.paddingTop + dimensions.marginTop;
                if (heightTop > 0) {
                    this.before(node.id, this.getStaticTag(WIDGET_ANDROID.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightTop))[0], -1);
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
                    this.after(node.id, this.getStaticTag(WIDGET_ANDROID.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightBottom))[0], -1);
                }
                if (marginRight > 0) {
                    marginRight = convertPX(marginRight + node.marginRight);
                    node.css('marginRight', marginRight)
                        .android(parseRTL('layout_marginRight'), marginRight);
                }
            }
        }
    }
}