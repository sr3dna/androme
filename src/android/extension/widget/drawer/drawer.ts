import { SettingsAndroid } from '../../../types/local';

import WIDGET_NAME from '../namespace';

import EXTENSION_DRAWER_TMPL from '../__template/drawer';

import View = android.lib.base.View;

import $enum = androme.lib.enumeration;
import $const = androme.lib.constant;
import $const_android = android.lib.constant;
import $util = androme.lib.util;
import $util_android = android.lib.util;
import $dom = androme.lib.dom;
import $resource_android = android.lib.base.Resource;

export default class Drawer<T extends View> extends androme.lib.base.Extension<T> {
    constructor(
        name: string,
        framework: number,
        tagNames?: string[],
        options?: {})
    {
        super(name, framework, tagNames, options);
        this.documentRoot = true;
        this.require($const.EXT_NAME.EXTERNAL, true);
        this.require(WIDGET_NAME.MENU);
        this.require(WIDGET_NAME.COORDINATOR);
    }

    public init(element: HTMLElement) {
        if (this.included(element) && element.children.length > 0) {
            Array.from(element.children).forEach((item: HTMLElement) => {
                if (item.tagName === 'NAV' && !$util.includes(item.dataset.ext, $const.EXT_NAME.EXTERNAL)) {
                    item.dataset.ext = ($util.hasValue(item.dataset.ext) ? `${item.dataset.ext}, ` : '') + $const.EXT_NAME.EXTERNAL;
                }
            });
            this.application.elements.add(element);
            return true;
        }
        return false;
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const options = Object.assign({}, this.options.self);
        if ($dom.findNestedExtension(node.element, WIDGET_NAME.MENU)) {
            $util.overwriteDefault(options, 'android', 'fitsSystemWindows', 'true');
            this.createResourceTheme();
        }
        else {
            const optionsNavigationView = Object.assign({}, this.options.navigationView);
            $util.overwriteDefault(optionsNavigationView, 'android', 'layout_gravity', $util_android.parseRTL('left', this.application.settings));
            const navView = node.children[node.children.length - 1] as T;
            navView.android('layout_gravity', optionsNavigationView.android.layout_gravity);
            navView.android('layout_height', 'match_parent');
            navView.auto = false;
        }
        const output = this.application.viewController.renderNodeStatic(
            $const_android.VIEW_SUPPORT.DRAWER,
            node.depth,
            $resource_android.formatOptions(options, <SettingsAndroid> this.application.settings),
            'match_parent',
            'match_parent',
            node,
            true
        );
        node.documentRoot = true;
        node.rendered = true;
        node.nodeType = $enum.NODE_STANDARD.BLOCK;
        node.excludeResource |= $enum.NODE_RESOURCE.FONT_STYLE;
        return { output, complete: true };
    }

    public beforeInsert() {
        const application = this.application;
        const node = this.node;
        if (application.renderQueue[node.nodeId]) {
            const target = application.cacheSession.find(item => item.parent === node.parent && item.controlName === $const_android.VIEW_SUPPORT.COORDINATOR);
            if (target) {
                application.renderQueue[target.nodeId] = application.renderQueue[node.nodeId];
                delete application.renderQueue[node.nodeId];
            }
        }
        const menu: string = $util.optional($dom.findNestedExtension(node.element, WIDGET_NAME.MENU), 'dataset.layoutName');
        const headerLayout: string = $util.optional($dom.findNestedExtension(node.element, $const.EXT_NAME.EXTERNAL), 'dataset.layoutName');
        const options: {} = Object.assign({}, this.options.navigation);
        if (menu !== '') {
            $util.overwriteDefault(options, 'app', 'menu', `@menu/${menu}`);
        }
        if (headerLayout !== '') {
            $util.overwriteDefault(options, 'app', 'headerLayout', `@layout/${headerLayout}`);
        }
        if (menu !== '' || headerLayout !== '') {
            $util.overwriteDefault(options, 'android', 'id', `${node.stringId}_navigation`);
            $util.overwriteDefault(options, 'android', 'fitsSystemWindows', 'true');
            $util.overwriteDefault(options, 'android', 'layout_gravity', $util_android.parseRTL('left', this.application.settings));
            const output = application.viewController.renderNodeStatic(
                $const_android.VIEW_SUPPORT.NAVIGATION_VIEW,
                node.depth + 1,
                $resource_android.formatOptions(options, <SettingsAndroid> this.application.settings),
                'wrap_content',
                'match_parent'
            );
            application.addRenderQueue(node.id.toString(), [output]);
        }
    }

    public afterInsert() {
        const element = $dom.findNestedExtension(this.node.element, $const.EXT_NAME.EXTERNAL);
        if (element) {
            const header = $dom.getNodeFromElement(element) as T;
            if (header && !header.hasHeight) {
                header.android('layout_height', 'wrap_content');
            }
        }
    }

    private createResourceTheme() {
        const options = Object.assign({}, this.options.resource);
        $util.overwriteDefault(options, '', 'appTheme', 'AppTheme');
        $util.overwriteDefault(options, '', 'parentTheme', 'Theme.AppCompat.Light.NoActionBar');
        const data = {
            'appTheme': options.appTheme,
            'parentTheme': options.parentTheme,
            '1': []
        };
        $util.overwriteDefault(options, 'output', 'path', 'res/values-v21');
        $util.overwriteDefault(options, 'output', 'file', `${WIDGET_NAME.DRAWER}.xml`);
        (<android.lib.base.Resource<T>> this.application.resourceHandler).addTheme(EXTENSION_DRAWER_TMPL, data, options);
    }
}