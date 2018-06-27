import { StringMap } from '../../lib/types';
import View from '../view';
import Menu from '../../extension/menu';
import Resource from '../../base/resource';
import { BLOCK_CHROME, VIEW_RESOURCE } from '../../lib/constants';

enum VIEW_STATIC {
    MENU = 'menu',
    ITEM = 'item',
    GROUP = 'group'
}

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

export default class MenuAndroid<T extends View> extends Menu {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode() {
        const node = (<T> this.node);
        node.setViewId(VIEW_STATIC.MENU);
        let xml = '';
        xml = this.application.controllerHandler.getViewStatic(VIEW_STATIC.MENU, node.depth, {}, '', '', node.id, true)[0];
        node.renderDepth = 0;
        node.renderParent = true;
        node.cascade().forEach(item => item.renderExtension = this);
        node.ignoreResource = VIEW_RESOURCE.ALL;
        return [xml, false];
    }

    public processChild() {
        const parent = (<T> this.parent);
        const node = (<T> this.node);
        node.ignoreResource = VIEW_RESOURCE.ALL;
        node.renderDepth = parent.renderDepth + 1;
        node.renderParent = true;
        const element = node.element;
        const options: any = { android: {}, app: {} };
        let viewName = VIEW_STATIC.ITEM;
        let children = false;
        let title = '';
        if (node.children.some(item => BLOCK_CHROME.includes(item.tagName))) {
            if (node.children.some(item => item.tagName === 'NAV')) {
                node.children.some(item => {
                    const child = item.element;
                    if (child != null) {
                        if (child.nodeName === '#text' && child.textContent != null && child.textContent.trim() !== '') {
                            title = child.textContent.trim();
                            item.hide();
                            return true;
                        }
                        else if (child.tagName !== 'NAV') {
                            title = child.innerText.trim();
                            item.hide();
                            return true;
                        }
                    }
                    return false;
                });
            }
            else if (node.tagName === 'NAV') {
                viewName = VIEW_STATIC.MENU;
            }
            else {
                viewName = VIEW_STATIC.GROUP;
                let checkable = '';
                if (node.children.every((item: T) => this.hasInputType(item, 'radio'))) {
                    checkable = 'single';
                }
                else if (node.children.every((item: T) => this.hasInputType(item, 'checkbox'))) {
                    checkable = 'all';
                }
                options.android.checkableBehavior = checkable;
            }
            children = true;
        }
        else {
            if (parent.android('checkableBehavior') == null) {
                if (this.hasInputType(node, 'checkbox')) {
                    options.android.checkable = 'true';
                }
            }
            if (element.nodeName === '#text') {
                node.hide();
                return ['', false];
            }
            else {
                title = element.innerText.trim();
            }
        }
        switch (viewName) {
            case VIEW_STATIC.ITEM:
                this.parseDataSet(VALIDATE_ITEM, element, options);
                if (node.android('icon') == null) {
                    const image = node.children.find(item => item.element.tagName === 'IMG');
                    if (image != null) {
                        const object = (<any> image.element);
                        object.__imageSourcePrefix = 'ic_menu_';
                        object.__imageSourceTarget = { node, namespace: 'android', attribute: 'icon' };
                    }
                }
                break;
            case VIEW_STATIC.GROUP:
                this.parseDataSet(VALIDATE_GROUP, element, options);
                break;
        }
        if (node.android('title') == null) {
            if (title !== '') {
                Resource.addString(title);
                if (Resource.STORED.STRINGS.has(title)) {
                    title = `@string/${Resource.STORED.STRINGS.get(title)}`;
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
        node.apply(options);
        const xml = this.application.controllerHandler.getViewStatic(viewName, node.depth, {}, '', '', node.id, children)[0];
        return [xml, false];
    }

    public afterRender() {
        super.afterRender();
        if (this.included(this.node.element)) {
            this.application.pathnames[this.application.pathnames.length - 1] = 'res/menu';
        }
    }

    private parseDataSet(validator: {}, element: HTMLElement, options: StringMap) {
        for (const attr in element.dataset) {
            const value = element.dataset[attr];
            if (value != null && validator[attr] != null) {
                const match = value.match(validator[attr]);
                if (match != null) {
                    const namespace = (this.options && this.options.nsAppCompat && NAMESPACE_APP.includes(attr) ? 'app' : 'android');
                    options[namespace][attr] = Array.from(new Set(match)).join('|');
                }
            }
        }
    }

    private hasInputType(node: T, value: string) {
        return (node.children.length > 0 && node.children.some(item => (<HTMLInputElement> item.element).type === value));
    }
}