import { ExtensionResult } from '../../../lib/types';
import Extension from '../../../base/extension';
import View from '../../view';
import ViewList from '../../viewlist';
import { hasValue, includes, optional } from '../../../lib/util';
import { stripId } from '../../../lib/xml';
import { createPlaceholder, findNestedExtension, findNestedMenu, overwriteDefault } from '../lib/util';
import { NODE_RESOURCE } from '../../../lib/constants';
import { EXT_NAME } from '../../../extension/lib/constants';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';
import parseRTL from '../../localization';

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
                if (item.tagName === 'NAV' && !includes(item.dataset.ext || '', EXT_NAME.EXTERNAL)) {
                    item.dataset.ext = (hasValue(item.dataset.ext) ? `${item.dataset.ext}, ` : '') + EXT_NAME.EXTERNAL;
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
        const optionsCoordinator = Object.assign({}, this.options.coordinator);
        let menu = findNestedMenu(node);
        if (menu != null) {
            overwriteDefault(optionsDrawer, 'android', 'fitsSystemWindows', 'true');
        }
        let xml = controller.renderNodeStatic(VIEW_SUPPORT.DRAWER, depth, optionsDrawer, 'match_parent', 'match_parent', node, true);
        const filename = `${node.nodeId}_content`;
        let include = '';
        if (this.options.includes == null || this.options.includes) {
            include = controller.renderNodeStatic('include', depth + 1, { layout: `@layout/${filename}` });
            depth = -1;
        }
        const coordinatorNode = createPlaceholder(application.cache.nextId, node);
        application.cache.list.push(coordinatorNode);
        overwriteDefault(optionsCoordinator, 'android', 'id', `${node.stringId}_content`);
        coordinatorNode.nodeId = stripId(optionsCoordinator.android.id);
        const content = controller.renderNodeStatic(VIEW_SUPPORT.COORDINATOR, depth + 1, optionsCoordinator, 'match_parent', 'match_parent', coordinatorNode, true);
        const optionsNavigation = Object.assign({}, this.options.navigation);
        overwriteDefault(optionsNavigation, 'android', 'layout_gravity', parseRTL('left'));
        if (menu != null) {
            this.createResourceTheme();
            overwriteDefault(optionsNavigation, 'android', 'id', `${node.stringId}_view`);
            overwriteDefault(optionsNavigation, 'android', 'fitsSystemWindows', 'true');
            overwriteDefault(optionsNavigation, 'app', 'menu', `@menu/{${node.id}:${WIDGET_NAME.DRAWER}:menu}`);
            overwriteDefault(optionsNavigation, 'app', 'headerLayout', `@layout/{${node.id}:${WIDGET_NAME.DRAWER}:headerLayout}`);
            const navigation = controller.renderNodeStatic(VIEW_SUPPORT.NAVIGATION_VIEW, node.depth + 1, optionsNavigation, 'wrap_content', 'match_parent');
            xml = xml.replace(`{:${node.id}}`, (include !== '' ? include : content) + navigation + `{:${node.id}}`);
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
                item.parent = coordinatorNode;
                coordinatorNode.children.push(item);
            }
        });
        if (include !== '') {
            application.addInclude(filename, content);
        }
        node.renderParent = true;
        node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
        return { xml };
    }

    public beforeInsert() {
        const application = this.application;
        const node = (<T> this.node);
        if (application.insert[node.nodeId] != null) {
            const target = application.cacheInternal.list.find(item => item.isolated && item.parent === node.parent && item.nodeName === VIEW_SUPPORT.COORDINATOR);
            if (target != null) {
                application.insert[target.nodeId] = application.insert[node.nodeId];
                delete application.insert[node.nodeId];
            }
        }
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
        const menu = optional(findNestedExtension(node, WIDGET_NAME.MENU), 'dataset.viewName');
        const headerLayout = optional(findNestedExtension(node, EXT_NAME.EXTERNAL), 'dataset.viewName');
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