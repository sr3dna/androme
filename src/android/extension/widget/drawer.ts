import View from '../../view';
import { parseRTL } from '../../lib/util';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constant';

import $enum = androme.lib.enumeration;
import $const = androme.lib.constant;
import $util = androme.lib.util;
import $dom = androme.lib.dom;

import EXTENSION_DRAWER_TMPL from '../../template/extension/drawer';

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
            $util.overwriteDefault(optionsNavigationView, 'android', 'layout_gravity', parseRTL('left', this.application.settings));
            const navView = node.children[node.children.length - 1];
            navView.android('layout_gravity', optionsNavigationView.android.layout_gravity);
            navView.android('layout_height', 'match_parent');
            navView.auto = false;
        }
        const output = this.application.viewController.renderNodeStatic(
            VIEW_SUPPORT.DRAWER,
            node.depth,
            options,
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
            const target = application.cacheSession.find(item => item.parent === node.parent && item.controlName === VIEW_SUPPORT.COORDINATOR);
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
            $util.overwriteDefault(options, 'android', 'layout_gravity', parseRTL('left', this.application.settings));
            const output = application.viewController.renderNodeStatic(
                VIEW_SUPPORT.NAVIGATION_VIEW,
                node.depth + 1,
                options,
                'wrap_content',
                'match_parent'
            );
            application.addRenderQueue(node.id.toString(), [output]);
        }
    }

    public afterInsert() {
        const element = $dom.findNestedExtension(this.node.element, $const.EXT_NAME.EXTERNAL);
        if (element) {
            const header = $dom.getNodeFromElement<T>(element);
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
            '0': [{
                    'appTheme': options.appTheme,
                    'parentTheme': options.parentTheme,
                    '1': []
                }]
        };
        $util.overwriteDefault(options, 'output', 'path', 'res/values-v21');
        $util.overwriteDefault(options, 'output', 'file', `${WIDGET_NAME.DRAWER}.xml`);
        this.application.resourceHandler.addTheme(EXTENSION_DRAWER_TMPL, data, options);
    }
}