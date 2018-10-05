import { ObjectMap, StringMap } from '../../../lib/types';
import { ExtensionResult } from '../../../extension/lib/types';
import { SettingsAndroid } from '../../lib/types';
import Nav from '../../../extension/nav';
import View from '../../view';
import ResourceHandler from '../../resourcehandler';
import { NODE_RESOURCE, NODE_STANDARD, NODE_PROCEDURE } from '../../../base/lib/constants';
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
    constructor(name: string, framework = 0, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
    }

    public condition() {
        return this.included();
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const output =
            this.application.viewController.renderNodeStatic(
                VIEW_NAVIGATION.MENU,
                0,
                {},
                '',
                '',
                node,
                true
            );
        node.documentRoot = true;
        node.nodeType = NODE_STANDARD.BLOCK;
        node.excludeResource |= NODE_RESOURCE.ALL;
        node.excludeProcedure |= NODE_PROCEDURE.ALL;
        node.rendered = true;
        node.cascade().forEach(item => this.subscribersChild.add(item as T));
        return { output, complete: true };
    }

    public processChild(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        if (node.plainText) {
            node.hide();
            return { output: '', complete: true, next: true };
        }
        const element = <HTMLElement> node.element;
        const options: ObjectMap<StringMap> = { android: {}, app: {} };
        let next = false;
        let nodeName = VIEW_NAVIGATION.ITEM;
        let title = '';
        let layout = false;
        if (node.children.some(item => (!item.inlineElement || !item.blockStatic) && item.children.length > 0)) {
            if (node.children.some(item => item.tagName === 'NAV')) {
                if (element.title !== '') {
                    title = element.title.trim();
                }
                else {
                    Array
                        .from(node.element.childNodes)
                        .some((item: HTMLElement) => {
                            if (item.nodeName === '#text') {
                                if (item.textContent) {
                                    title = item.textContent.trim();
                                    if (title !== '') {
                                        return true;
                                    }
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
                next = true;
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
            if (parent.android('checkableBehavior') === '') {
                if (this.hasInputType(node, 'checkbox')) {
                    options.android.checkable = 'true';
                }
            }
            title = (element.title || element.innerText).trim();
        }
        switch (nodeName) {
            case VIEW_NAVIGATION.ITEM:
                this.parseDataSet(VALIDATE_ITEM, element, options);
                if (node.android('icon') === '') {
                    let src = ResourceHandler.addImageURL(element.style.backgroundImage as string, DRAWABLE_PREFIX.MENU);
                    if (src !== '') {
                        options.android.icon = `@drawable/${src}`;
                    }
                    else {
                        const image = node.children.find(item => item.imageElement);
                        if (image) {
                            src = ResourceHandler.addImageSrcSet(<HTMLImageElement> image.element, DRAWABLE_PREFIX.MENU);
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
        if (node.android('title') === '') {
            if (title !== '') {
                const name = ResourceHandler.addString(title, '', <SettingsAndroid> this.application.settings);
                if (name !== '') {
                    title = `@string/${name}`;
                }
                options.android.title = title;
            }
        }
        if (!options.android.id) {
            node.setNodeType(nodeName);
        }
        else {
            node.controlName = nodeName;
        }
        const output =
            this.application.viewController.renderNodeStatic(
                nodeName,
                parent.renderDepth + 1,
                options,
                '',
                '',
                node,
                layout
            );
        node.excludeResource |= NODE_RESOURCE.ALL;
        node.excludeProcedure |= NODE_PROCEDURE.ALL;
        node.rendered = true;
        return { output, complete: true, next };
    }

    public afterRender() {
        super.afterRender();
        if (this.included(<HTMLElement> this.node.element)) {
            this.application.layoutProcessing.pathname = 'res/menu';
        }
    }

    private parseDataSet(validator: ObjectMap<RegExp>, element: HTMLElement, options: {}) {
        for (const attr in element.dataset) {
            const value = element.dataset[attr];
            if (value && validator[attr]) {
                const match = value.match(validator[attr]);
                if (match) {
                    const namespace = (this.options.appCompat == null || this.options.appCompat === true) && NAMESPACE_APP.includes(attr) ? 'app' : 'android';
                    options[namespace][attr] =
                        Array
                            .from(new Set(match))
                            .join('|');
                }
            }
        }
    }

    private hasInputType(node: T, value: string) {
        return node.children.length > 0 && node.children.some(item => (<HTMLInputElement> item.element).type === value);
    }
}