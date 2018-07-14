import { ExtensionResult } from '../../../lib/types';
import Extension from '../../../base/extension';
import Resource from '../../../base/resource';
import View from '../../view';
import ViewList from '../../viewlist';
import { convertPX, includes, optional } from '../../../lib/util';
import { findNestedMenu, overwriteDefault } from '../lib/util';
import { formatDimen, restoreIndent } from '../../../lib/xml';
import { getStyle } from '../../../lib/dom';
import { NODE_RESOURCE } from '../../../lib/constants';
import { NODE_ANDROID } from '../../constants';
import { EXT_NAME } from '../../../extension/lib/constants';
import { DRAWABLE_PREFIX, VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

import EXTENSION_COLLAPSINGTOOLBAR_TMPL from '../../template/extension/collapsingtoolbar';

type T = View;
type U = ViewList<T>;

export default class Toolbar extends Extension<T, U> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
        this.require(WIDGET_NAME.MENU);
    }

    public init(element: HTMLElement) {
        if (this.included(element)) {
            Array.from(element.children).forEach((item: HTMLElement) => {
                if (item.tagName === 'NAV' && item.dataset.ext == null) {
                    item.dataset.ext = EXT_NAME.EXTERNAL;
                }
            });
            if (element.dataset.target != null) {
                const target = document.getElementById(element.dataset.target);
                if (target != null && element.parentElement !== target && !includes(optional(target, 'dataset.ext'), WIDGET_NAME.COORDINATOR)) {
                    this.application.elements.add(element);
                }
            }
            if (includes(optional(element, 'parentElement.dataset.ext'), WIDGET_NAME.COORDINATOR)) {
                (<any> element).__nodeIsolated = true;
            }
        }
        return false;
    }

    public condition() {
        return (super.condition() && this.included());
    }

    public processNode(): ExtensionResult {
        const controller = this.application.controllerHandler;
        const node = (<T> this.node);
        const target = (node.hasElement && node.element.dataset.target != null && document.getElementById(node.element.dataset.target) !== node.parent.element);
        const backgroundImage = node.css('backgroundImage');
        const options = Object.assign({}, this.options[node.element.id]);
        const optionsAppBar = Object.assign({}, options.appBar);
        const optionsCollapsingToolbar = Object.assign({}, options.collapsingToolbar);
        const optionsToolbar = Object.assign({}, options.toolbar);
        const appBar = (target || options.appBar != null);
        const collapsingToolbar = (options.collapsingToolbar != null);
        let depth = (target ? 0 : node.depth + node.renderDepth);
        let children = node.children.filter(item => !item.isolated).length;
        Array.from(node.element.children).forEach((element: HTMLElement) => {
            if (element.tagName === 'IMG') {
                if (element.dataset.navigationIcon != null) {
                    const result = Resource.addImageSrcSet(<HTMLImageElement> element, DRAWABLE_PREFIX.MENU);
                    if (result !== '') {
                        overwriteDefault(toolbar, 'app', 'navigationIcon', `@drawable/${result}`);
                        if (getStyle(element).display !== 'none') {
                            children--;
                        }
                    }
                }
                if (element.dataset.collapseIcon != null) {
                    const result = Resource.addImageSrcSet(<HTMLImageElement> element, DRAWABLE_PREFIX.MENU);
                    if (result !== '') {
                        overwriteDefault(toolbar, 'app', 'collapseIcon', `@drawable/${result}`);
                        if (getStyle(element).display !== 'none') {
                            children--;
                        }
                    }
                }
            }
        });
        let appBarOverlay = '';
        let popupOverlay = '';
        if (target) {
            overwriteDefault(optionsToolbar, 'android', 'layout_height', '?attr/actionBarSize');
            if (backgroundImage === 'none') {
                overwriteDefault(optionsToolbar, 'android', 'background', '?attr/colorPrimary');
            }
        }
        if (collapsingToolbar) {
            overwriteDefault(optionsToolbar, 'app', 'layout_collapseMode', 'pin');
            if (optionsToolbar.app.popupTheme != null) {
                popupOverlay = optionsToolbar.app.popupTheme;
            }
            optionsToolbar.app.popupTheme = '@style/AppTheme.PopupOverlay';
        }
        else {
            overwriteDefault(optionsToolbar, 'app', 'popupTheme', '@style/ThemeOverlay.AppCompat.Light');
            if (children === 0) {
                overwriteDefault(optionsAppBar, 'android', 'layout_height', '?attr/actionBarSize');
            }
            if (backgroundImage !== 'none') {
                overwriteDefault(optionsAppBar, 'android', 'src', `@drawable/${Resource.addImageURL(backgroundImage)}`);
            }
        }
        if (findNestedMenu(node) != null) {
            overwriteDefault(optionsToolbar, 'app', 'menu', `@menu/{${node.id}:${WIDGET_NAME.TOOLBAR}:menu}`);
        }
        node.depth = depth + (appBar ? 1 : 0) + (options.collapsingToolbar ? 1 : 0);
        let xml = controller.getNodeStatic(VIEW_SUPPORT.TOOLBAR, node.depth, optionsToolbar, 'match_parent', 'wrap_content', node, (children > 0));
        if (collapsingToolbar) {
            if (backgroundImage !== 'none') {
                const optionsBackgroundImage = Object.assign({}, options.backgroundImage);
                let scaleType = 'center';
                switch (node.css('backgroundSize')) {
                    case 'cover':
                    case '100% auto':
                    case 'auto 100%':
                        scaleType = 'centerCrop';
                        break;
                    case 'contain':
                    case '100% 100%':
                        scaleType = 'fitXY';
                        break;
                    case 'auto':
                        scaleType = 'matrix';
                        break;
                }
                overwriteDefault(optionsBackgroundImage, 'android', 'id', `${node.stringId}_image`);
                overwriteDefault(optionsBackgroundImage, 'android', 'src', `@drawable/${Resource.addImageURL(backgroundImage)}`);
                overwriteDefault(optionsBackgroundImage, 'android', 'scaleType', scaleType);
                overwriteDefault(optionsBackgroundImage, 'android', 'fitsSystemWindows', 'true');
                overwriteDefault(optionsBackgroundImage, 'app', 'layout_collapseMode', 'parallax');
                xml += controller.getNodeStatic(NODE_ANDROID.IMAGE, node.depth, optionsBackgroundImage, 'match_parent', 'match_parent');
                node.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
            }
        }
        let outer = '';
        if (appBar) {
            overwriteDefault(optionsAppBar, 'android', 'id', `${node.stringId}_appbar`);
            overwriteDefault(optionsAppBar, 'android', 'layout_height', (node.viewHeight > 0 ? formatDimen('appbar', 'height', convertPX(node.viewHeight)) : 'wrap_content'));
            if (collapsingToolbar) {
                overwriteDefault(optionsAppBar, 'android', 'fitsSystemWindows', 'true');
                if (optionsAppBar.android.theme != null) {
                    appBarOverlay = optionsAppBar.android.theme;
                }
                optionsAppBar.android.theme = '@style/AppTheme.AppBarOverlay';
            }
            else {
                overwriteDefault(optionsAppBar, 'android', 'theme', '@style/ThemeOverlay.AppCompat.Dark.ActionBar');
            }
            outer = controller.getNodeStatic(VIEW_SUPPORT.APPBAR, (target ? -1 : depth), optionsAppBar, 'match_parent', 'wrap_content', null, true);
            if (collapsingToolbar) {
                overwriteDefault(optionsCollapsingToolbar, 'android', 'id', `${node.stringId}_collapsing`);
                overwriteDefault(optionsCollapsingToolbar, 'android', 'fitsSystemWindows', 'true');
                if (backgroundImage === 'none') {
                    overwriteDefault(optionsCollapsingToolbar, 'app', 'contentScrim', '?attr/colorPrimary');
                }
                overwriteDefault(optionsCollapsingToolbar, 'app', 'layout_scrollFlags', 'scroll|exitUntilCollapsed');
                overwriteDefault(optionsCollapsingToolbar, 'app', 'toolbarId', node.stringId);
                outer = outer.replace('{:0}', controller.getNodeStatic(VIEW_SUPPORT.COLLAPSING_TOOLBAR, ++depth, optionsCollapsingToolbar, 'match_parent', 'match_parent', null, true));
                this.createResourceTheme(appBarOverlay, popupOverlay);
            }
            node.nodeId = optionsAppBar.android.id.replace('@+id/', '');
        }
        if (outer !== '') {
            xml = outer.replace('{:0}', xml);
        }
        let proceed = false;
        if (target) {
            node.data(`${WIDGET_NAME.TOOLBAR}:insert`, xml);
            node.render(node);
            xml = '';
            proceed = true;
        }
        else {
            node.render(<T> this.parent);
            node.renderDepth = node.depth;
        }
        node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
        return { xml, proceed };
    }

    public processChild(): ExtensionResult {
        const element = this.element;
        if (element != null && element.tagName === 'IMG' && (element.dataset.navigationIcon != null || element.dataset.collapseIcon != null)) {
            this.node.hide();
            return { xml: '', proceed: true };
        }
        return { xml: '' };
    }

    public insert() {
        const application = this.application;
        const node = (<T> this.node);
        const id = optional(node, 'element.dataset.target');
        if (id !== '') {
            const parent = (<T> application.findByDomId(id));
            const coordinator = application.cacheInternal.list.find(item => item.isolated && item.parent === parent && item.nodeName === VIEW_SUPPORT.COORDINATOR);
            if (coordinator != null) {
                let xml = (<string> node.data(`${WIDGET_NAME.TOOLBAR}:insert`)) || '';
                if (xml !== '') {
                    xml = restoreIndent(xml, node.renderDepth);
                    node.renderDepth = node.depth + 1;
                    application.addInsertQueue(coordinator.id, [xml]);
                }
            }
        }
    }

    public afterInsert() {
        const node = (<T> this.node);
        node.android('layout_height', '?attr/actionBarSize');
    }

    public finalize() {
        const node = (<T> this.node);
        const menu = findNestedMenu(node);
        if (menu != null) {
            const layouts = this.application.layouts;
            for (let i = 0; i < layouts.length; i++) {
                layouts[i].content = layouts[i].content.replace(`{${node.id}:${WIDGET_NAME.TOOLBAR}:menu}`, <string> menu.dataset.viewName);
            }
        }
    }

    private createResourceTheme(appBarOverlay: string, popupOverlay: string) {
        const options = Object.assign({}, this.options.resource);
        overwriteDefault(options, '', 'appTheme', 'AppTheme');
        overwriteDefault(options, '', 'parentTheme', 'Theme.AppCompat.Light.DarkActionBar');
        const data = {
            '0': [{
                'appTheme': options.appTheme,
                'parentTheme': options.parentTheme,
                'appBarOverlay': appBarOverlay || 'ThemeOverlay.AppCompat.Dark.ActionBar',
                'popupOverlay': popupOverlay || 'ThemeOverlay.AppCompat.Light',
                '1': []
            }]
        };
        overwriteDefault(options, 'output', 'path', 'res/values');
        overwriteDefault(options, 'output', 'file', `${WIDGET_NAME.TOOLBAR}.xml`);
        this.application.resourceHandler.addResourceTheme(EXTENSION_COLLAPSINGTOOLBAR_TMPL, data, options);
    }
}