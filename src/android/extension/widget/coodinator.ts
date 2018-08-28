import { ExtensionResult } from '../../../extension/lib/types';
import Extension from '../../../base/extension';
import View from '../../view';
import { locateExtension } from '../lib/util';
import { getNode } from '../../../lib/dom';
import { NODE_RESOURCE, NODE_STANDARD } from '../../../lib/constants';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

type T = View;

export default class Coordinator extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const node = this.node as T;
        const xml = this.application.controllerHandler.renderGroup(node, <T> this.parent, VIEW_SUPPORT.COORDINATOR);
        node.apply(this.options[node.element.id]);
        node.nodeType = NODE_STANDARD.BLOCK;
        node.excludeResource |= NODE_RESOURCE.ASSET;
        if (node.children.filter(item => !item.isolated).length > 0) {
            const toolbar = getNode(locateExtension(node, WIDGET_NAME.TOOLBAR));
            if (toolbar) {
                const extension = this.application.getExtension(WIDGET_NAME.TOOLBAR);
                if (extension) {
                    const collapsingToolbar = (extension.options[toolbar.element.id] != null ? extension.options[toolbar.element.id].collapsingToolbar : null);
                    if (collapsingToolbar != null) {
                        node.android('fitsSystemWindows', 'true');
                    }
                }
            }
        }
        return { xml };
    }

    public afterInsert() {
        const node = this.node as T;
        if (node.documentRoot) {
            node.android('layout_width', 'match_parent');
            node.android('layout_height', 'match_parent');
        }
    }
}