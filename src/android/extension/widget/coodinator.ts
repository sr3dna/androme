import { ExtensionResult } from '../../../extension/lib/types';
import Extension from '../../../base/extension';
import View from '../../view';
import { locateExtension } from '../lib/util';
import { getNode } from '../../../lib/dom';
import { NODE_RESOURCE, NODE_STANDARD } from '../../../lib/constants';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

export default class Coordinator<T extends View> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        let xml = '';
        const parent = this.parent;
        if (parent) {
            const node = this.node;
            xml = this.application.controllerHandler.renderGroup(node, parent, VIEW_SUPPORT.COORDINATOR);
            node.apply(this.options[node.element.id]);
            node.nodeType = NODE_STANDARD.BLOCK;
            node.excludeResource |= NODE_RESOURCE.ASSET;
            if (node.children.filter(item => !item.isolated).length > 0) {
                const toolbar = getNode(locateExtension(node, WIDGET_NAME.TOOLBAR));
                if (toolbar) {
                    const ext = this.application.getExtension(WIDGET_NAME.TOOLBAR);
                    if (ext) {
                        const collapsingToolbar = (ext.options[toolbar.element.id] != null ? ext.options[toolbar.element.id].collapsingToolbar : null);
                        if (collapsingToolbar != null) {
                            node.android('fitsSystemWindows', 'true');
                        }
                    }
                }
            }
        }
        return { xml };
    }

    public afterInsert() {
        if (this.node.documentRoot) {
            this.node.android('layout_width', 'match_parent');
            this.node.android('layout_height', 'match_parent');
        }
    }
}