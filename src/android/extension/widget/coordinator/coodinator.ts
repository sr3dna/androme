import WIDGET_NAME from '../namespace';

import View = android.lib.base.View;

import $enum = androme.lib.enumeration;
import $const_android = android.lib.constant;
import $dom = androme.lib.dom;

export default class Coordinator<T extends View> extends androme.lib.base.Extension<T> {
    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        const output = this.application.viewController.renderGroup(node, parent, $const_android.VIEW_SUPPORT.COORDINATOR);
        node.apply(this.options[node.element.id]);
        node.nodeType = $enum.NODE_STANDARD.BLOCK;
        node.excludeResource |= $enum.NODE_RESOURCE.ASSET;
        const toolbar = $dom.getNodeFromElement($dom.findNestedExtension(node.element, WIDGET_NAME.TOOLBAR)) as T;
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