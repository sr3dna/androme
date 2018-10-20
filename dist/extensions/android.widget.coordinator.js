/* android.widget 2.0.2
   https://github.com/anpham6/androme */

this.android = this.android || {};
this.android.widget = this.android.widget || {};
this.android.widget.coordinator = (function () {
    'use strict';

    var WIDGET_NAME = {
        FAB: 'android.widget.floatingactionbutton',
        MENU: 'android.widget.menu',
        COORDINATOR: 'android.widget.coordinator',
        TOOLBAR: 'android.widget.toolbar',
        DRAWER: 'android.widget.drawer',
        BOTTOM_NAVIGATION: 'android.widget.bottomnavigation'
    };

    var $enum = androme.lib.enumeration;
    var $const_android = android.lib.constant;
    var $dom = androme.lib.dom;
    class Coordinator extends androme.lib.base.Extension {
        processNode() {
            const node = this.node;
            const parent = this.parent;
            const output = this.application.viewController.renderGroup(node, parent, $const_android.VIEW_SUPPORT.COORDINATOR);
            node.apply(this.options[node.element.id]);
            node.nodeType = $enum.NODE_STANDARD.BLOCK;
            node.excludeResource |= $enum.NODE_RESOURCE.ASSET;
            const toolbar = $dom.getNodeFromElement($dom.findNestedExtension(node.element, WIDGET_NAME.TOOLBAR));
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
        afterInsert() {
            const node = this.node;
            if (node.documentRoot) {
                node.android('layout_width', 'match_parent');
                node.android('layout_height', 'match_parent');
            }
        }
    }

    const coordinator = new Coordinator(WIDGET_NAME.COORDINATOR, 2);
    if (androme) {
        androme.registerExtension(coordinator);
    }

    return coordinator;

}());
