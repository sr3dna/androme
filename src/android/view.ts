import Element from '../base/element';
import Widget from './widget';
import Layout from './layout';
import WidgetList from './widgetlist';
import { convertPX, padLeft } from '../lib/util';
import { getBoxSpacing } from '../lib/dom';
import parseRTL from './localization';
import SETTINGS from '../settings';
import { OVERFLOW_CHROME, NODE_STANDARD } from '../lib/constants';
import { BOX_ANDROID, NODE_ANDROID, XMLNS_ANDROID } from './constants';

export default class View<T extends Widget, U extends WidgetList<T>> extends Element<T, U> {
    public cache: U;

    constructor(
        public before: (id: number, xml: string, index?: number) => void,
        public after: (id: number, xml: string, index?: number) => void)
    {
        super();
    }

    public renderLayout(node: T, parent: T, tagName: number, options?) {
        let preXml = '';
        let postXml = '';
        let renderParent = parent;
        node.setAndroidId(Widget.getTagName(tagName));
        if (node.overflow !== OVERFLOW_CHROME.NONE) {
            const scrollView: string[] = [];
            if (node.overflowX) {
                scrollView.push(NODE_ANDROID.SCROLL_HORIZONTAL);
            }
            if (node.overflowY) {
                scrollView.push((node.ascend().some((item: T) => item.overflow !== OVERFLOW_CHROME.NONE) ? NODE_ANDROID.SCROLL_NESTED : NODE_ANDROID.SCROLL_VERTICAL));
            }
            let current = node;
            let scrollDepth = parent.renderDepth + scrollView.length;
            scrollView
                .map(nodeName => {
                    const layout = new Layout(this.cache.nextId, current, null, [current]);
                    const widget: T = <Widget> layout as T;
                    layout.setAndroidId(nodeName);
                    layout.setBounds();
                    layout.inheritGrid(current);
                    layout.android('fadeScrollbars', 'false');
                    this.cache.push(widget);
                    switch (nodeName) {
                        case NODE_ANDROID.SCROLL_HORIZONTAL:
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
                    preXml = indent + `<${nodeName}{@${layout.id}}>\n` + preXml;
                    postXml += indent + `</${nodeName}>\n`;
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
        return this.getEnclosingTag(node.renderDepth, Widget.getTagName(tagName), node.id, `{${node.id}}`, preXml, postXml);
    }

    public renderTag(node: T, parent: T, tagName: number, recursive = false) {
        const element: any = node.element;
        node.setAndroidId(Widget.getTagName(tagName));
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
        switch (node.nodeName) {
            case NODE_ANDROID.EDIT:
                node.android('inputType', 'text');
                break;
            case NODE_ANDROID.BUTTON:
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
                    const result = <U> node.parentOriginal.children.filter((radio: T) => ((<HTMLInputElement> radio.element).type === 'radio' && (<HTMLInputElement> radio.element).name === element.name));
                    let xml = '';
                    if (result.length > 1) {
                        const layout = new Layout(this.cache.nextId, node, parent, result);
                        const widget = <Widget> layout as T;
                        let checked: T | null = null;
                        this.cache.push(widget);
                        layout.setAndroidId(NODE_ANDROID.RADIO_GROUP);
                        layout.render(parent);
                        for (const radio of result) {
                            layout.inheritGrid(radio);
                            if ((<HTMLInputElement> radio.element).checked) {
                                checked = radio;
                            }
                            radio.parent = layout;
                            radio.render(layout);
                            xml += this.renderTag(radio, widget, NODE_STANDARD.RADIO, true);
                        }
                        layout.android('orientation', (<U> layout.children).linearX ? 'horizontal' : 'vertical');
                        if (checked != null) {
                            layout.android('checkedButton', checked.stringId);
                        }
                        layout.setBounds();
                        this.setGridSpace(widget);
                        return this.getEnclosingTag(layout.renderDepth, NODE_ANDROID.RADIO_GROUP, layout.id, xml);
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
        node.cascade().forEach((item: Widget) => item.hide());
        this.setGridSpace(node);
        return this.getEnclosingTag(node.renderDepth, node.nodeName, node.id);
    }

    public createWrapper(node: T, parent: T, children: U) {
        const layout = new Layout(this.cache.nextId, node, parent, children);
        for (const child of children) {
            child.parent = layout;
            layout.inheritGrid(child);
        }
        layout.setBounds();
        return <Widget> layout as T;
    }

    public getStaticTag(tagName: number, depth: number, options: {}, width = 'wrap_content', height = 'wrap_content') {
        const node = new Widget(0, SETTINGS.targetAPI);
        node.setAndroidId(Widget.getTagName(tagName));
        let attributes = '';
        if (SETTINGS.showAttributes) {
            node.apply(options);
            node.android('id', node.stringId);
            node.android('layout_width', width);
            node.android('layout_height', height);
            const indent = padLeft(depth + 1);
            attributes = node.combine().map(value => `\n${indent + value}`).join('');
        }
        return [this.getEnclosingTag(depth, node.nodeName, 0).replace('{@0}', attributes), node.stringId];
    }

    public replaceInlineAttributes(output: string, node: T, options: {}) {
        node.setAndroidDimensions();
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
        if (node.parent.is(NODE_STANDARD.GRID)) {
            const dimensions: any = getBoxSpacing(<HTMLElement> node.parentOriginal.element, true);
            const options = {
                android: {
                    layout_columnSpan: node.renderParent.gridColumnCount
                }
            };
            if (node.gridFirst) {
                const heightTop = dimensions.paddingTop + dimensions.marginTop;
                if (heightTop > 0) {
                    this.before(node.id, this.getStaticTag(NODE_STANDARD.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightTop))[0]);
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
                    this.after(node.id, this.getStaticTag(NODE_STANDARD.SPACE, node.renderDepth, options, 'match_parent', convertPX(heightBottom))[0]);
                }
                if (marginRight > 0) {
                    marginRight = convertPX(marginRight + node.marginRight);
                    node.css('marginRight', marginRight);
                    node.android(parseRTL(BOX_ANDROID.MARGIN_RIGHT), marginRight);
                }
            }
        }
    }
}