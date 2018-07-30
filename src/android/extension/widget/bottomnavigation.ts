import { ExtensionResult } from '../../../lib/types';
import Extension from '../../../base/extension';
import View from '../../view';
import ViewList from '../../viewlist';
import { optional } from '../../../lib/util';
import { findNestedExtension, overwriteDefault } from '../lib/util';
import { NODE_RESOURCE, NODE_STANDARD } from '../../../lib/constants';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

import EXTENSION_GENERIC_TMPL from '../../template/extension/generic';

type T = View;
type U = ViewList<T>;

export default class BottomNavigation extends Extension<T, U> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
        this.require(WIDGET_NAME.MENU);
    }

    public processNode(): ExtensionResult {
        const node = (<T> this.node);
        const parent = (<T> this.parent);
        const options = Object.assign({}, this.options[node.element.id]);
        overwriteDefault(options, 'android', 'background', `?android:attr/windowBackground`);
        const xml = this.application.controllerHandler.renderNodeStatic(VIEW_SUPPORT.BOTTOM_NAVIGATION, node.depth, options, (parent.is(NODE_STANDARD.CONSTRAINT) ? '0px' : 'match_parent'), 'wrap_content', node);
        for (let i = 5; i < node.children.length; i++) {
            node.children[i].hide();
            node.children[i].cascade().forEach(item => item.hide());
        }
        node.cascade().forEach(item => item.renderExtension = this);
        node.render(parent);
        node.nodeType = NODE_STANDARD.BLOCK;
        node.excludeResource |= NODE_RESOURCE.ASSET;
        this.createResourceTheme();
        return { xml };
    }

    public beforeInsert() {
        const node = (<T> this.node);
        const menu: string = optional(findNestedExtension(node, WIDGET_NAME.MENU), 'dataset.viewName');
        if (menu !== '') {
            const options = Object.assign({}, this.options[node.element.id]);
            overwriteDefault(options, 'app', 'menu', `@menu/${menu}`);
            node.app('menu', options.app.menu);
        }
    }

    public afterInsert() {
        const node = (<T> this.node);
        if (node.renderParent.viewHeight === 0) {
            node.renderParent.android('layout_height', 'match_parent');
        }
    }

    private createResourceTheme() {
        const options = Object.assign({}, this.options.resource);
        overwriteDefault(options, '', 'appTheme', 'AppTheme');
        overwriteDefault(options, '', 'parentTheme', 'Theme.AppCompat.Light.DarkActionBar');
        const data = {
            '0': [{
                'appTheme': options.appTheme,
                'parentTheme': options.parentTheme,
                '1': []
            }]
        };
        overwriteDefault(options, 'output', 'path', 'res/values');
        overwriteDefault(options, 'output', 'file', `${WIDGET_NAME.BOTTOM_NAVIGATION}.xml`);
        this.application.resourceHandler.addTheme(EXTENSION_GENERIC_TMPL, data, options);
    }
}