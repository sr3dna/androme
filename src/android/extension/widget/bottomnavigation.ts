import View from '../../view';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constant';

import $enum = androme.lib.enumeration;
import $util = androme.lib.util;
import $dom = androme.lib.dom;

import EXTENSION_GENERIC_TMPL from '../../template/extension/generic';

export default class BottomNavigation<T extends View> extends androme.lib.base.Extension<T> {
    constructor(name: string, framework = 0, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
        this.require(WIDGET_NAME.MENU);
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        const options = Object.assign({}, this.options[node.element.id]);
        $util.overwriteDefault(options, 'android', 'background', `?android:attr/windowBackground`);
        const output =
            this.application.viewController.renderNodeStatic(
                VIEW_SUPPORT.BOTTOM_NAVIGATION,
                node.depth,
                options,
                parent.is($enum.NODE_STANDARD.CONSTRAINT) ? '0px' : 'match_parent',
                'wrap_content',
                node
            );
        for (let i = 5; i < node.children.length; i++) {
            node.children[i].hide();
            node.children[i].cascade().forEach(item => item.hide());
        }
        node.cascade().forEach(item => this.subscribersChild.add(item as T));
        node.render(parent);
        node.nodeType = $enum.NODE_STANDARD.BLOCK;
        node.excludeResource |= $enum.NODE_RESOURCE.ASSET;
        this.createResourceTheme();
        return { output, complete: true };
    }

    public beforeInsert() {
        const node = this.node;
        const menu: string = $util.optional($dom.findNestedExtension(node.element, WIDGET_NAME.MENU), 'dataset.layoutName');
        if (menu !== '') {
            const options = Object.assign({}, this.options[node.element.id]);
            $util.overwriteDefault(options, 'app', 'menu', `@menu/${menu}`);
            node.app('menu', options.app.menu);
        }
    }

    public afterInsert() {
        const node = this.node;
        if (!node.renderParent.has('width')) {
            node.renderParent.android('layout_width', 'match_parent');
        }
        if (!node.renderParent.has('height')) {
            node.renderParent.android('layout_height', 'match_parent');
        }
    }

    private createResourceTheme() {
        const options = Object.assign({}, this.options.resource);
        $util.overwriteDefault(options, '', 'appTheme', 'AppTheme');
        $util.overwriteDefault(options, '', 'parentTheme', 'Theme.AppCompat.Light.DarkActionBar');
        const data = {
            '0': [{
                'appTheme': options.appTheme,
                'parentTheme': options.parentTheme,
                '1': []
            }]
        };
        $util.overwriteDefault(options, 'output', 'path', 'res/values');
        $util.overwriteDefault(options, 'output', 'file', `${WIDGET_NAME.BOTTOM_NAVIGATION}.xml`);
        this.application.resourceHandler.addTheme(EXTENSION_GENERIC_TMPL, data, options);
    }
}