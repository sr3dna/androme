import { ExtensionResult } from '../../../lib/types';
import View from '../../view';
import ViewList from '../../viewlist';
import Extension from '../../../base/extension';
import { getMenu, setDefaultOption } from '../lib/util';
import { VIEW_RESOURCE, VIEW_STANDARD } from '../../../lib/constants';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

type T = View;
type U = ViewList<T>;

export default class BottomNavigation extends Extension<T, U> {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
        this.require(WIDGET_NAME.MENU);
    }

    public processNode(): ExtensionResult {
        const node = (<T> this.node);
        const parent = (<T> this.parent);
        const options = Object.assign({}, this.options[node.element.id]);
        setDefaultOption(options, 'android', 'background', `?android:attr/windowBackground`);
        setDefaultOption(options, 'app', 'menu', `@menu/{${node.id}:${WIDGET_NAME.BOTTOM_NAVIGATION}:menu}`);
        const xml = this.application.controllerHandler.getViewStatic(VIEW_SUPPORT.BOTTOM_NAVIGATION, node.depth, options, (parent.is(VIEW_STANDARD.CONSTRAINT) ? '0px' : 'match_parent'), 'wrap_content', node);
        for (let i = 5; i < node.children.length; i++) {
            node.children[i].hide();
            node.children[i].cascade().forEach(item => item.hide());
        }
        node.cascade().forEach(item => item.renderExtension = this);
        node.ignoreResource = VIEW_RESOURCE.ASSET;
        node.applyCustomizations();
        node.render(parent);
        return { xml };
    }

    public finalize() {
        const node = (<T> this.node);
        if (getMenu(node) != null) {
            let menu = '';
            this.application.elements.forEach(item => {
                if (item.parentElement === node.element) {
                    switch (item.dataset.ext) {
                        case WIDGET_NAME.MENU:
                            menu = (<string> item.dataset.currentId);
                            break;
                    }
                }
            });
            this.application.layouts.forEach(view => view.content = view.content.replace(`{${node.id}:${WIDGET_NAME.BOTTOM_NAVIGATION}:menu}`, menu));
        }
    }
}