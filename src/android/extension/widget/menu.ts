import { ObjectMap, StringMap } from '../../../lib/types';
import { ExtensionResult } from '../../../extension/lib/types';
import Nav from '../../../extension/nav';
import ResourceView from '../../resource-view';
import View from '../../view';
import { optional } from '../../../lib/util';
import { NODE_RESOURCE, NODE_STANDARD, NODE_PROCEDURE } from '../../../lib/constants';
import { DRAWABLE_PREFIX, VIEW_NAVIGATION } from '../lib/constants';

const VALIDATE_ITEM = {
    id: /^@\+id\/\w+$/,
    title: /^.+$/,
    titleCondensed: /^.+$/,
    icon: /^@drawable\/.+$/,
    onClick: /^.+$/,
    showAsAction: /^(ifRoom|never|withText|always|collapseActionView)$/,
    actionLayout: /^@layout\/.+$/,
    actionViewClass: /^.+$/,
    actionProviderClass: /^.+$/,
    alphabeticShortcut: /^[a-zA-Z]+$/,
    alphabeticModifiers: /(META|CTRL|ALT|SHIFT|SYM|FUNCTION)+/g,
    numericShortcut: /^[0-9]+$/,
    numericModifiers: /(META|CTRL|ALT|SHIFT|SYM|FUNCTION)+/g,
    checkable: /^(true|false)$/,
    visible: /^(true|false)$/,
    enabled: /^(true|false)$/,
    menuCategory: /^(container|system|secondary|alternative)$/,
    orderInCategory: /^[0-9]+$/
};

const VALIDATE_GROUP = {
    id: /^@\+id\/\w+$/,
    checkableBehavior: /^(none|all|single)$/,
    visible: /^(true|false)$/,
    enabled: /^(true|false)$/,
    menuCategory: /^(container|system|secondary|alternative)$/,
    orderInCategory: /^[0-9]+$/
};

const NAMESPACE_APP = ['showAsAction', 'actionViewClass', 'actionProviderClass'];

export default class Menu<T extends View> extends Nav<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public condition() {
        return this.included();
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const xml = this.application.controllerHandler.renderNodeStatic(VIEW_NAVIGATION.MENU, 0, {}, '', '', node, true);
        node.documentRoot = true;
        node.rendered = true;
        node.cascade().forEach(item => item.renderExtensionChild.push(this));
        node.nodeType = NODE_STANDARD.BLOCK;
        node.excludeResource |= NODE_RESOURCE.ALL;
        node.excludeProcedure |= NODE_PROCEDURE.ALL;
        return { xml };
    }

    public processChild(): ExtensionResult {
        let xml = '';
        let proceed = false;
        const node = this.node;
        const parent = this.parent as T;
        if (node.plainText) {
            node.hide();
            return { xml, proceed: true };
        }
        const element = <HTMLElement> node.element;
        const options: ObjectMap<StringMap> = { android: {}, app: {} };
        let nodeName = VIEW_NAVIGATION.ITEM;
        let title = '';
        let layout = false;
        if (node.children.some(item => (!item.inlineElement || !item.blockStatic) && item.children.length > 0)) {
            if (node.children.some(item => item.tagName === 'NAV')) {
                if (element.title !== '') {
                    title = element.title.trim();
                }
                else {
                    Array.from(node.element.childNodes).some((item: HTMLElement) => {
                        if (item.nodeName === '#text') {
                            title = (optional(item, 'textContent') as string).trim();
                            if (title !== '') {
                                return true;
                            }
                            return false;
                        }
                        else if (item.tagName !== 'NAV') {
                            title = item.innerText.trim();
                            return true;
                        }
                        return false;
                    });
                }
                node.each(item => item.tagName !== 'NAV' && item.hide());
            }
            else if (node.tagName === 'NAV') {
                nodeName = VIEW_NAVIGATION.MENU;
                proceed = true;
            }
            else {
                nodeName = VIEW_NAVIGATION.GROUP;
                let checkable = '';
                if (node.children.every((item: T) => this.hasInputType(item, 'radio'))) {
                    checkable = 'single';
                }
                else if (node.children.every((item: T) => this.hasInputType(item, 'checkbox'))) {
                    checkable = 'all';
                }
                options.android.checkableBehavior = checkable;
            }
            layout = true;
        }
        else {
            if (parent.android('checkableBehavior') == null) {
                if (this.hasInputType(node, 'checkbox')) {
                    options.android.checkable = 'true';
                }
            }
            title = (element.title || element.innerText).trim();
        }
        switch (nodeName) {
            case VIEW_NAVIGATION.ITEM:
                this.parseDataSet(VALIDATE_ITEM, element, options);
                if (node.android('icon') == null) {
                    let src = ResourceView.addImageURL(<string> element.style.backgroundImage, DRAWABLE_PREFIX.MENU);
                    if (src !== '') {
                        options.android.icon = `@drawable/${src}`;
                    }
                    else {
                        const image = node.children.find(item => item.imageElement);
                        if (image) {
                            src = ResourceView.addImageSrcSet(<HTMLImageElement> image.element, DRAWABLE_PREFIX.MENU);
                            if (src !== '') {
                                options.android.icon = `@drawable/${src}`;
                            }
                        }
                    }
                }
                break;
            case VIEW_NAVIGATION.GROUP:
                this.parseDataSet(VALIDATE_GROUP, element, options);
                break;
        }
        if (node.android('title') == null) {
            if (title !== '') {
                const name = ResourceView.addString(title);
                if (name !== '') {
                    title = `@string/${name}`;
                }
                options.android.title = title;
            }
        }
        if (options.android.id == null) {
            node.setNodeType(nodeName);
        }
        else {
            node.controlName = nodeName;
        }
        xml = this.application.controllerHandler.renderNodeStatic(nodeName, parent.renderDepth + 1, options, '', '', node, layout);
        node.rendered = true;
        node.excludeResource |= NODE_RESOURCE.ALL;
        node.excludeProcedure |= NODE_PROCEDURE.ALL;
        return { xml, proceed };
    }

    public afterRender() {
        super.afterRender();
        if (this.included(this.node.element)) {
            this.application.currentLayout.pathname = 'res/menu';
        }
    }

    private parseDataSet(validator: ObjectMap<RegExp>, element: HTMLElement, options: {}) {
        for (const attr in element.dataset) {
            const value = element.dataset[attr];
            if (value != null && validator[attr] != null) {
                const match = value.match(validator[attr]);
                if (match) {
                    const namespace = ((this.options.appCompat == null || this.options.appCompat) && NAMESPACE_APP.includes(attr) ? 'app' : 'android');
                    options[namespace][attr] = Array.from(new Set(match)).join('|');
                }
            }
        }
    }

    private hasInputType(node: T, value: string) {
        return (node.children.length > 0 && node.children.some(item => (<HTMLInputElement> item.element).type === value));
    }
}