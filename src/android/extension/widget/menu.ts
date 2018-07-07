import { ExtensionResult, ObjectMap } from '../../../lib/types';
import View from '../../view';
import Nav from '../../../extension/nav';
import Resource from '../../../base/resource';
import { BLOCK_CHROME, VIEW_RESOURCE } from '../../../lib/constants';
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

export default class Menu<T extends View> extends Nav {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const node = (<T> this.node);
        const xml = this.application.controllerHandler.getViewStatic(VIEW_NAVIGATION.MENU, 0, {}, '', '', node, true);
        node.renderParent = true;
        node.cascade().forEach(item => item.renderExtension = this);
        node.ignoreResource = VIEW_RESOURCE.ALL;
        return { xml };
    }

    public processChild(): ExtensionResult {
        const node = (<T> this.node);
        const element = node.element;
        if (element.nodeName === '#text') {
            node.hide();
            return { xml: '' };
        }
        const parent = (<T> this.parent);
        node.ignoreResource = VIEW_RESOURCE.ALL;
        node.renderDepth = parent.renderDepth + 1;
        node.renderParent = true;
        const options: ObjectMap<any> = { android: {}, app: {} };
        let viewName = VIEW_NAVIGATION.ITEM;
        let layout = false;
        let title = '';
        const children = (<HTMLElement[]> Array.from(node.element.children));
        if (children.some(item => BLOCK_CHROME.includes(item.tagName) && item.children.length > 0)) {
            if (children.some(item => item.tagName === 'NAV')) {
                if (element.title !== '') {
                    title = element.title.trim();
                }
                else {
                    Array.from(node.element.childNodes).some((item: HTMLElement) => {
                        if (item.nodeName === '#text') {
                            if (item.textContent != null && item.textContent.trim() !== '') {
                                title = item.textContent.trim();
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
                node.children.forEach(item => item.tagName !== 'NAV' && item.hide());
            }
            else if (node.tagName === 'NAV') {
                viewName = VIEW_NAVIGATION.MENU;
            }
            else {
                viewName = VIEW_NAVIGATION.GROUP;
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
            title = (element.title !== '' ? element.title : element.innerText).trim();
        }
        switch (viewName) {
            case VIEW_NAVIGATION.ITEM:
                this.parseDataSet(VALIDATE_ITEM, element, options);
                if (node.android('icon') == null) {
                    let src = Resource.addImageURL(<string> element.style.backgroundImage, DRAWABLE_PREFIX.MENU);
                    if (src !== '') {
                        options.android.icon = `@drawable/${src}`;
                    }
                    else {
                        const image = node.children.find(item => item.element.tagName === 'IMG');
                        if (image != null) {
                            src = Resource.addImageSrcSet(<HTMLImageElement> image.element, DRAWABLE_PREFIX.MENU);
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
                const name = Resource.addString(title);
                if (name !== '') {
                    title = `@string/${name}`;
                }
                options.android.title = title;
            }
        }
        if (options.android.id == null) {
            node.setViewId(viewName);
        }
        else {
            node.viewName = viewName;
        }
        const xml = this.application.controllerHandler.getViewStatic(viewName, node.depth, options, '', '', node, layout);
        return { xml };
    }

    public afterRender() {
        super.afterRender();
        if (this.included(this.node.element)) {
            const view = this.application.current;
            view.pathname = 'res/menu';
        }
    }

    private parseDataSet(validator: ObjectMap<RegExp>, element: HTMLElement, options: ObjectMap<any>) {
        for (const attr in element.dataset) {
            const value = element.dataset[attr];
            if (value != null && validator[attr] != null) {
                const match = value.match(validator[attr]);
                if (match != null) {
                    const namespace = (this.options.appCompat && NAMESPACE_APP.includes(attr) ? 'app' : 'android');
                    options[namespace][attr] = Array.from(new Set(match)).join('|');
                }
            }
        }
    }

    private hasInputType(node: T, value: string) {
        return (node.children.length > 0 && node.children.some(item => (<HTMLInputElement> item.element).type === value));
    }
}