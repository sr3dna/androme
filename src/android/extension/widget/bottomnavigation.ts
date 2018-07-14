import { ExtensionResult } from '../../../lib/types';
import Extension from '../../../base/extension';
import View from '../../view';
import ViewList from '../../viewlist';
import { includes, optional } from '../../../lib/util';
import { findNestedMenu, overwriteDefault } from '../lib/util';
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
        overwriteDefault(options, 'app', 'menu', `@menu/{${node.id}:${WIDGET_NAME.BOTTOM_NAVIGATION}:menu}`);
        const xml = this.application.controllerHandler.getNodeStatic(VIEW_SUPPORT.BOTTOM_NAVIGATION, node.depth, options, (parent.is(NODE_STANDARD.CONSTRAINT) ? '0px' : 'match_parent'), 'wrap_content', node);
        for (let i = 5; i < node.children.length; i++) {
            node.children[i].hide();
            node.children[i].cascade().forEach(item => item.hide());
        }
        node.cascade().forEach(item => item.renderExtension = this);
        node.excludeResource |= NODE_RESOURCE.ASSET;
        node.render(parent);
        this.createResourceTheme();
        return { xml };
    }

    public afterInsert() {
        const node = (<T> this.node);
        if (node.renderParent.viewHeight === 0) {
            node.renderParent.android('layout_height', 'match_parent');
        }
    }

    public finalize() {
        const node = (<T> this.node);
        if (findNestedMenu(node) != null) {
            let menu = '';
            Array.from(this.application.elements).some(item => {
                if (item.parentElement === node.element && includes(optional(item, 'dataset.ext'), WIDGET_NAME.MENU)) {
                    menu = (<string> item.dataset.viewName);
                    return true;
                }
                return false;
            });
            if (menu !== '') {
                this.application.layouts.forEach(view => view.content = view.content.replace(`{${node.id}:${WIDGET_NAME.BOTTOM_NAVIGATION}:menu}`, menu));
            }
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
        this.application.resourceHandler.addResourceTheme(EXTENSION_GENERIC_TMPL, data, options);
    }
}