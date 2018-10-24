/* android.widget 2.0.2
   https://github.com/anpham6/androme */

this.android = this.android || {};
this.android.widget = this.android.widget || {};
this.android.widget.bottomnavigation = (function () {
    'use strict';

    var WIDGET_NAME = {
        __FRAMEWORK: 2,
        FAB: 'android.widget.floatingactionbutton',
        MENU: 'android.widget.menu',
        COORDINATOR: 'android.widget.coordinator',
        TOOLBAR: 'android.widget.toolbar',
        DRAWER: 'android.widget.drawer',
        BOTTOM_NAVIGATION: 'android.widget.bottomnavigation'
    };

    const template = [
        '!0',
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '	<style name="{@appTheme}" parent="{@parentTheme}">',
        '!1',
        '		<item name="{name}">{value}</item>',
        '!1',
        '	</style>',
        '</resources>',
        '!0'
    ];
    var EXTENSION_GENERIC_TMPL = template.join('\n');

    var $enum = androme.lib.enumeration;
    var $const_android = android.lib.constant;
    var $util = androme.lib.util;
    var $dom = androme.lib.dom;
    class BottomNavigation extends androme.lib.base.Extension {
        constructor(name, framework, tagNames, options) {
            super(name, framework, tagNames, options);
            this.require(WIDGET_NAME.MENU);
        }
        processNode() {
            const node = this.node;
            const parent = this.parent;
            const options = Object.assign({}, this.options[node.element.id]);
            $util.overwriteDefault(options, 'android', 'background', `?android:attr/windowBackground`);
            const output = this.application.viewController.renderNodeStatic($const_android.VIEW_SUPPORT.BOTTOM_NAVIGATION, node.depth, options, parent.is($enum.NODE_STANDARD.CONSTRAINT) ? '0px' : 'match_parent', 'wrap_content', node);
            for (let i = 5; i < node.children.length; i++) {
                node.children[i].hide();
                node.children[i].cascade().forEach(item => item.hide());
            }
            node.cascade().forEach(item => this.subscribersChild.add(item));
            node.render(parent);
            node.nodeType = $enum.NODE_STANDARD.BLOCK;
            node.excludeResource |= $enum.NODE_RESOURCE.ASSET;
            this.createResourceTheme();
            return { output, complete: true };
        }
        beforeInsert() {
            const node = this.node;
            const menu = $util.optional($dom.findNestedExtension(node.element, WIDGET_NAME.MENU), 'dataset.layoutName');
            if (menu !== '') {
                const options = Object.assign({}, this.options[node.element.id]);
                $util.overwriteDefault(options, 'app', 'menu', `@menu/${menu}`);
                node.app('menu', options.app.menu);
            }
        }
        afterInsert() {
            const node = this.node;
            const renderParent = node.renderParent;
            if (!renderParent.has('width')) {
                renderParent.android('layout_width', 'match_parent');
            }
            if (!renderParent.has('height')) {
                renderParent.android('layout_height', 'match_parent');
            }
        }
        createResourceTheme() {
            const options = Object.assign({}, this.options.resource);
            $util.overwriteDefault(options, '', 'appTheme', 'AppTheme');
            $util.overwriteDefault(options, '', 'parentTheme', 'Theme.AppCompat.Light.DarkActionBar');
            const data = {
                '0': [{
                        'appTheme': options.appTheme,
                        'parentTheme': options.parentTheme,
                        '1': []
                    }]
            };
            $util.overwriteDefault(options, 'output', 'path', 'res/values');
            $util.overwriteDefault(options, 'output', 'file', `${WIDGET_NAME.BOTTOM_NAVIGATION}.xml`);
            this.application.resourceHandler.addTheme(EXTENSION_GENERIC_TMPL, data, options);
        }
    }

    const bottomNavigation = new BottomNavigation(WIDGET_NAME.BOTTOM_NAVIGATION, WIDGET_NAME.__FRAMEWORK);
    if (androme) {
        androme.registerExtensionAsync(bottomNavigation);
    }

    return bottomNavigation;

}());
