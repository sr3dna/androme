import { Null } from '../../../lib/types';
import { ExtensionResult } from '../../../extension/lib/types';
import Extension from '../../../base/extension';
import ResourceView from '../../resource-view';
import View from '../../view';
import { formatPX, hasValue, includes, optional } from '../../../lib/util';
import { createPlaceholder, locateExtension, overwriteDefault } from '../lib/util';
import { delimitDimens, stripId } from '../../lib/util';
import { getNodeFromElement, getStyle, setElementCache } from '../../../lib/dom';
import { replacePlaceholder } from '../../../lib/xml';
import { NODE_PROCEDURE, NODE_RESOURCE, NODE_STANDARD } from '../../../lib/constants';
import { NODE_ANDROID } from '../../constants';
import { EXT_NAME } from '../../../extension/lib/constants';
import { DRAWABLE_PREFIX, VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

import EXTENSION_APPBAR_TMPL from '../../template/extension/appbar';

export default class Toolbar<T extends View> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
        this.require(WIDGET_NAME.MENU);
    }

    public init(element: HTMLElement) {
        if (this.included(element)) {
            Array.from(element.children).some((item: HTMLElement) => {
                if (item.tagName === 'NAV' && !includes(item.dataset.ext, EXT_NAME.EXTERNAL)) {
                    item.dataset.ext = (hasValue(item.dataset.ext) ? `${item.dataset.ext}, ` : '') + EXT_NAME.EXTERNAL;
                    return true;
                }
                return false;
            });
            if (hasValue(element.dataset.target)) {
                const target = document.getElementById(<string> element.dataset.target);
                if (target && element.parentElement !== target && !includes(<string> optional(target, 'dataset.ext'), WIDGET_NAME.COORDINATOR)) {
                    this.application.elements.add(element);
                }
            }
            if (includes(<string> optional(element, 'parentElement.dataset.ext'), WIDGET_NAME.COORDINATOR)) {
                setElementCache(element, 'nodeIsolated', true);
            }
        }
        return false;
    }

    public processNode(): ExtensionResult {
        let xml = '';
        const node = this.node;
        const target = node.isSet('dataset', 'target');
        const options = Object.assign({}, this.options[node.element.id]);
        const optionsToolbar = Object.assign({}, options.toolbar);
        const optionsAppBar = Object.assign({}, options.appBar);
        const optionsCollapsingToolbar = Object.assign({}, options.collapsingToolbar);
        const appBarChildren: T[] = [];
        const collapsingToolbarChildren: T[] = [];
        const hasMenu = (locateExtension(node, WIDGET_NAME.MENU) != null);
        const backgroundImage = node.css('backgroundImage');
        let depth = (target ? 0 : node.depth);
        let children = node.children.filter(item => !item.isolated).length;
        Array.from(node.element.children).forEach((element: HTMLElement) => {
            if (element.tagName === 'IMG') {
                if (hasValue(element.dataset.navigationIcon)) {
                    const result = ResourceView.addImageSrcSet(<HTMLImageElement> element, DRAWABLE_PREFIX.MENU);
                    if (result !== '') {
                        overwriteDefault(toolbar, 'app', 'navigationIcon', `@drawable/${result}`);
                        if (getStyle(element).display !== 'none') {
                            children--;
                        }
                    }
                }
                if (hasValue(element.dataset.collapseIcon)) {
                    const result = ResourceView.addImageSrcSet(<HTMLImageElement> element, DRAWABLE_PREFIX.MENU);
                    if (result !== '') {
                        overwriteDefault(toolbar, 'app', 'collapseIcon', `@drawable/${result}`);
                        if (getStyle(element).display !== 'none') {
                            children--;
                        }
                    }
                }
            }
            if (!hasValue(element.dataset.target)) {
                const targetNode = getNodeFromElement(element) as T;
                if (targetNode) {
                    switch (element.dataset.targetModule) {
                        case 'appBar':
                            appBarChildren.push(targetNode);
                            children--;
                            break;
                        case 'collapsingToolbar':
                            collapsingToolbarChildren.push(targetNode);
                            children--;
                            break;
                    }
                }
            }
        });
        const collapsingToolbar = (options.collapsingToolbar != null || collapsingToolbarChildren.length > 0);
        const appBar = (options.appBar != null || appBarChildren.length > 0 || collapsingToolbar);
        let appBarOverlay = '';
        let popupOverlay = '';
        if (collapsingToolbar) {
            overwriteDefault(optionsToolbar, 'app', 'layout_collapseMode', 'pin');
        }
        else {
            overwriteDefault(appBar ? optionsAppBar : optionsToolbar, 'android', 'fitsSystemWindows', 'true');
            overwriteDefault(optionsToolbar, 'app', 'popupTheme', '@style/ThemeOverlay.AppCompat.Light');
            if (backgroundImage !== 'none') {
                overwriteDefault(appBarChildren.length > 0 ? optionsAppBar : optionsToolbar, 'android', 'background', `@drawable/${ResourceView.addImageURL(backgroundImage)}`);
                node.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
            }
            else {
                overwriteDefault(optionsToolbar, 'app', 'layout_scrollFlags', 'scroll|enterAlways');
            }
        }
        if (appBarChildren.length > 0) {
            overwriteDefault(optionsAppBar, 'android', 'layout_height', '?android:attr/actionBarSize');
        }
        else {
            overwriteDefault(optionsToolbar, 'android', 'layout_height', '?android:attr/actionBarSize');
            node.excludeProcedure |= NODE_PROCEDURE.LAYOUT;
        }
        if (hasMenu) {
            if (appBar) {
                if (optionsToolbar.app.popupTheme != null) {
                    popupOverlay = optionsToolbar.app.popupTheme.replace('@style/', '');
                }
                optionsToolbar.app.popupTheme = '@style/AppTheme.PopupOverlay';
            }
        }
        const renderDepth = depth + (appBar ? 1 : 0) + (collapsingToolbar ? 1 : 0);
        xml = this.application.controllerHandler.renderNodeStatic(VIEW_SUPPORT.TOOLBAR, renderDepth, optionsToolbar, 'match_parent', 'wrap_content', node, (children > 0));
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
                overwriteDefault(optionsBackgroundImage, 'android', 'src', `@drawable/${ResourceView.addImageURL(backgroundImage)}`);
                overwriteDefault(optionsBackgroundImage, 'android', 'scaleType', scaleType);
                overwriteDefault(optionsBackgroundImage, 'android', 'fitsSystemWindows', 'true');
                overwriteDefault(optionsBackgroundImage, 'app', 'layout_collapseMode', 'parallax');
                xml = this.application.controllerHandler.renderNodeStatic(NODE_ANDROID.IMAGE, renderDepth, optionsBackgroundImage, 'match_parent', 'match_parent') + xml;
                node.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
            }
        }
        let outer = '';
        let appBarNode: Null<T> = null;
        let collapsingToolbarNode: Null<T> = null;
        if (appBar) {
            overwriteDefault(optionsAppBar, 'android', 'id', `${node.stringId}_appbar`);
            overwriteDefault(optionsAppBar, 'android', 'layout_height', (node.viewHeight > 0 ? delimitDimens('appbar', 'height', formatPX(node.viewHeight)) : 'wrap_content'));
            if (collapsingToolbar) {
                overwriteDefault(optionsAppBar, 'android', 'fitsSystemWindows', 'true');
            }
            if (hasMenu) {
                if (optionsAppBar.android.theme != null) {
                    appBarOverlay = optionsAppBar.android.theme;
                }
                optionsAppBar.android.theme = '@style/AppTheme.AppBarOverlay';
                this.createResourceTheme(appBarOverlay, popupOverlay);
            }
            else {
                overwriteDefault(optionsAppBar, 'android', 'theme', '@style/ThemeOverlay.AppCompat.Dark.ActionBar');
            }
            appBarNode = createPlaceholder(this.application.cache.nextId, node, appBarChildren);
            appBarNode.nodeId = stripId(optionsAppBar.android.id);
            appBarNode.each(item => item.dataset.target = (appBarNode as T).nodeId);
            this.application.cache.append(appBarNode);
            outer = this.application.controllerHandler.renderNodeStatic(VIEW_SUPPORT.APPBAR, (target ? -1 : depth), optionsAppBar, 'match_parent', 'wrap_content', appBarNode, true);
            appBarNode.rendered = true;
            if (collapsingToolbar) {
                depth++;
                overwriteDefault(optionsCollapsingToolbar, 'android', 'id', `${node.stringId}_collapsingtoolbar`);
                overwriteDefault(optionsCollapsingToolbar, 'android', 'fitsSystemWindows', 'true');
                if (backgroundImage === 'none') {
                    overwriteDefault(optionsCollapsingToolbar, 'app', 'contentScrim', '?attr/colorPrimary');
                }
                overwriteDefault(optionsCollapsingToolbar, 'app', 'layout_scrollFlags', 'scroll|exitUntilCollapsed');
                overwriteDefault(optionsCollapsingToolbar, 'app', 'toolbarId', node.stringId);
                collapsingToolbarNode = createPlaceholder(this.application.cache.nextId, node, collapsingToolbarChildren);
                collapsingToolbarNode.each(item => item.dataset.target = (collapsingToolbarNode as T).nodeId);
                this.application.cache.append(collapsingToolbarNode);
                const content = this.application.controllerHandler.renderNodeStatic(VIEW_SUPPORT.COLLAPSING_TOOLBAR, depth, optionsCollapsingToolbar, 'match_parent', 'match_parent', collapsingToolbarNode, true);
                collapsingToolbarNode.rendered = true;
                outer = replacePlaceholder(outer, appBarNode.id, content);
            }
        }
        if (appBarNode) {
            xml = (collapsingToolbarNode ? replacePlaceholder(outer, collapsingToolbarNode.id, xml) : replacePlaceholder(outer, appBarNode.id, xml));
            if (collapsingToolbarNode == null) {
                node.parent = appBarNode;
            }
            else {
                collapsingToolbarNode.parent = appBarNode;
            }
            node.data(WIDGET_NAME.TOOLBAR, 'outerParent', appBarNode.stringId);
        }
        else if (collapsingToolbarNode) {
            node.parent = collapsingToolbarNode;
        }
        if (target) {
            node.render(node);
        }
        else {
            node.render(this.parent);
            node.renderDepth = renderDepth;
        }
        node.nodeType = NODE_STANDARD.BLOCK;
        node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
        return { xml };
    }

    public processChild(): ExtensionResult {
        const node = this.node;
        if (node.element.tagName === 'IMG' && (node.dataset.navigationIcon != null || node.dataset.collapseIcon != null)) {
            node.hide();
            return { xml: '', proceed: true };
        }
        return { xml: '' };
    }

    public beforeInsert() {
        const node = this.node;
        const menu: string = optional(locateExtension(node, WIDGET_NAME.MENU), 'dataset.viewName');
        if (menu !== '') {
            const options = Object.assign({}, this.options[node.element.id]);
            const optionsToolbar = Object.assign({}, options.toolbar);
            overwriteDefault(optionsToolbar, 'app', 'menu', `@menu/${menu}`);
            node.app('menu', optionsToolbar.app.menu);
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
        this.application.resourceHandler.addTheme(EXTENSION_APPBAR_TMPL, data, options);
    }
}