import { ExtensionResult } from '../../../lib/types';
import Extension from '../../../base/extension';
import View from '../../view';
import ViewList from '../../viewlist';
import { optional } from '../../../lib/util';
import { findNestedExtension, findNestedMenu, overwriteDefault } from '../lib/util';
import { NODE_RESOURCE } from '../../../lib/constants';
import { EXT_NAME } from '../../../extension/lib/constants';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';
import parseRTL from '../../localization';
import SETTINGS from '../../../settings';

import EXTENSION_DRAWER_TMPL from '../../template/extension/drawer';

type T = View;
type U = ViewList<T>;

export default class Drawer extends Extension<T, U> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
        this.documentRoot = true;
        this.require(EXT_NAME.EXTERNAL, true);
        this.require(WIDGET_NAME.MENU);
        this.require(WIDGET_NAME.COORDINATOR);
    }

    public init(element: HTMLElement) {
        if (this.included(element) && element.children.length > 0) {
            Array.from(element.children).forEach((item: HTMLElement) => {
                if (item.tagName === 'NAV' && item.dataset.ext == null) {
                    item.dataset.ext = EXT_NAME.EXTERNAL;
                }
            });
            this.application.elements.add(element);
            return true;
        }
        return false;
    }

    public condition() {
        return (super.condition() && this.included());
    }

    public processNode(): ExtensionResult {
        const application = this.application;
        const controller = application.controllerHandler;
        const node = (<T> this.node);
        let depth = node.depth + node.renderDepth;
        const optionsDrawer = Object.assign({}, this.options.drawer);
        let menu = findNestedMenu(node);
        if (menu != null) {
            overwriteDefault(optionsDrawer, 'android', 'fitsSystemWindows', 'true');
        }
        let xml = controller.getNodeStatic(VIEW_SUPPORT.DRAWER, depth, optionsDrawer, 'match_parent', 'match_parent', node, true);
        const filename = `${node.nodeId}_content`;
        let include = '';
        if (this.options.includes == null || this.options.includes) {
            include = controller.getNodeStatic('include', depth + 1, { layout: `@layout/${filename}` });
            depth = -1;
        }
        const coordinator = new View(application.cache.nextId, SETTINGS.targetAPI, node.element);
        coordinator.parent = node;
        coordinator.inheritBase(node);
        coordinator.renderExtension = application.findExtension(WIDGET_NAME.COORDINATOR);
        coordinator.isolated = true;
        coordinator.excludeResource |= NODE_RESOURCE.ALL;
        application.cache.list.push(coordinator);
        const content = controller.getNodeStatic(VIEW_SUPPORT.COORDINATOR, depth + 1, { android: { id: `${node.stringId}_content` } }, 'match_parent', 'match_parent', coordinator, true);
        const optionsNavigation = Object.assign({}, this.options.navigation);
        overwriteDefault(optionsNavigation, 'android', 'layout_gravity', parseRTL('left'));
        if (menu != null) {
            this.createResourceTheme();
            overwriteDefault(optionsNavigation, 'android', 'id', `${node.stringId}_view`);
            overwriteDefault(optionsNavigation, 'android', 'fitsSystemWindows', 'true');
            overwriteDefault(optionsNavigation, 'app', 'menu', `@menu/{${node.id}:${WIDGET_NAME.DRAWER}:menu}`);
            overwriteDefault(optionsNavigation, 'app', 'headerLayout', `@layout/{${node.id}:${WIDGET_NAME.DRAWER}:headerLayout}`);
            const navigation = controller.getNodeStatic(VIEW_SUPPORT.NAVIGATION_VIEW, node.depth + 1, optionsNavigation, 'wrap_content', 'match_parent');
            xml = xml.replace(`{:${node.id}}`, (include !== '' ? include : content) + navigation);
        }
        else {
            const navView = node.children[node.children.length - 1];
            navView.android('layout_gravity', optionsNavigation.android.layout_gravity);
            navView.android('layout_height', 'match_parent');
            navView.isolated = true;
            controller.prependBefore(navView.id, (include !== '' ? include : content));
            menu = navView.element;
        }
        node.children.forEach(item => {
            if ((<any> menu).__node !== item) {
                item.parent = coordinator;
                coordinator.children.push(item);
            }
        });
        if (include !== '') {
            application.addInclude(filename, content);
        }
        node.renderParent = true;
        node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
        return { xml };
    }

    public afterInsert() {
        const headerLayout = findNestedExtension(this.node, EXT_NAME.EXTERNAL);
        if (headerLayout != null) {
            const node = (<T> (<any> headerLayout).__node);
            if (node.viewHeight === 0) {
                node.android('layout_height', 'wrap_content');
            }
        }
    }

    public finalize() {
        const node = (<T> this.node);
        const menu = optional(findNestedExtension(node, WIDGET_NAME.MENU), 'dataset.currentId');
        const headerLayout = optional(findNestedExtension(node, EXT_NAME.EXTERNAL), 'dataset.currentId');
        if (menu !== '') {
            this.application.layouts.forEach(view => view.content = view.content.replace(`{${node.id}:${WIDGET_NAME.DRAWER}:menu}`, menu));
        }
        if (headerLayout !== '') {
            this.application.layouts.forEach(view => view.content = view.content.replace(`{${node.id}:${WIDGET_NAME.DRAWER}:headerLayout}`, headerLayout));
        }
    }

    private createResourceTheme() {
        const options = Object.assign({}, this.options.resource);
        overwriteDefault(options, '', 'appTheme', 'AppTheme');
        overwriteDefault(options, '', 'parentTheme', 'Theme.AppCompat.Light.NoActionBar');
        const data = {
            '0': [{
                'appTheme': options.appTheme,
                'parentTheme': options.parentTheme,
                '1': []
            }]
        };
        overwriteDefault(options, 'output', 'path', 'res/values-v21');
        overwriteDefault(options, 'output', 'file', `${WIDGET_NAME.DRAWER}.xml`);
        this.application.resourceHandler.addResourceTheme(EXTENSION_DRAWER_TMPL, data, options);
    }
}