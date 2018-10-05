import { ExtensionResult } from '../../../extension/lib/types';
import Extension from '../../../base/extension';
import View from '../../view';
import { optional } from '../../../lib/util';
import { locateExtension, overwriteDefault } from '../lib/util';
import { NODE_RESOURCE, NODE_STANDARD } from '../../../base/lib/constants';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

import EXTENSION_GENERIC_TMPL from '../../template/extension/generic';

export default class BottomNavigation<T extends View> extends Extension<T> {
    constructor(name: string, framework = 0, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
        this.require(WIDGET_NAME.MENU);
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        const options = Object.assign({}, this.options[node.element.id]);
        overwriteDefault(options, 'android', 'background', `?android:attr/windowBackground`);
        const xml =
            this.application.viewController.renderNodeStatic(
                VIEW_SUPPORT.BOTTOM_NAVIGATION,
                node.depth,
                options,
                parent.is(NODE_STANDARD.CONSTRAINT) ? '0px' : 'match_parent',
                'wrap_content',
                node
            );
        for (let i = 5; i < node.children.length; i++) {
            node.children[i].hide();
            node.children[i].cascade().forEach(item => item.hide());
        }
        node.cascade().forEach(item => this.subscribersChild.add(item as T));
        node.render(parent);
        node.nodeType = NODE_STANDARD.BLOCK;
        node.excludeResource |= NODE_RESOURCE.ASSET;
        this.createResourceTheme();
        return { xml, complete: true };
    }

    public beforeInsert() {
        const node = this.node;
        const menu: string = optional(locateExtension(node, WIDGET_NAME.MENU), 'dataset.layoutName');
        if (menu !== '') {
            const options = Object.assign({}, this.options[node.element.id]);
            overwriteDefault(options, 'app', 'menu', `@menu/${menu}`);
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