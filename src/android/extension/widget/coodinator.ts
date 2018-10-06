import { ExtensionResult } from '../../../extension/lib/types';
import Extension from '../../../base/extension';
import View from '../../view';
import { locateExtension } from '../lib/util';
import { getNodeFromElement } from '../../../lib/dom';
import { NODE_RESOURCE, NODE_STANDARD } from '../../../base/lib/constants';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

export default class Coordinator<T extends View> extends Extension<T> {
    constructor(name: string, framework = 0, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        const output = this.application.viewController.renderGroup(node, parent, VIEW_SUPPORT.COORDINATOR);
        node.apply(this.options[node.element.id]);
        node.nodeType = NODE_STANDARD.BLOCK;
        node.excludeResource |= NODE_RESOURCE.ASSET;
        const toolbar = getNodeFromElement(locateExtension(node, WIDGET_NAME.TOOLBAR));
        if (toolbar) {
            const ext = this.application.getExtension(WIDGET_NAME.TOOLBAR);
            if (ext) {
                if (ext.options[toolbar.element.id] && ext.options[toolbar.element.id].collapsingToolbar) {
                    node.android('fitsSystemWindows', 'true');
                }
            }
        }
        return { output, complete: false };
    }

    public afterInsert() {
        const node = this.node;
        if (node.documentRoot) {
            node.android('layout_width', 'match_parent');
            node.android('layout_height', 'match_parent');
        }
    }
}