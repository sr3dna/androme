import { ExtensionResult } from '../../../extension/lib/types';
import Extension from '../../../base/extension';
import View from '../../view';
import { includes, optional } from '../../../lib/util';
import { getNode } from '../../../lib/dom';
import { NODE_RESOURCE, NODE_STANDARD } from '../../../lib/constants';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

type T = View;

export default class Coordinator extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const controller = this.application.controllerHandler;
        const node = this.node as T;
        const xml = controller.renderGroup(node, <T> this.parent, VIEW_SUPPORT.COORDINATOR);
        node.apply(this.options[node.element.id]);
        node.nodeType = NODE_STANDARD.BLOCK;
        node.excludeResource |= NODE_RESOURCE.ASSET;
        if (node.children.filter(item => !item.isolated).length > 0) {
            const toolbar = this.getToolbar(node);
            if (toolbar != null) {
                const extension = this.application.findExtension(WIDGET_NAME.TOOLBAR);
                if (extension != null) {
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

    private getToolbar(node: T) {
        const toolbar = <HTMLElement> Array.from(node.element.children).find((element: HTMLElement) => includes(optional(element, 'dataset.ext'), WIDGET_NAME.TOOLBAR));
        return getNode(toolbar);
    }
}