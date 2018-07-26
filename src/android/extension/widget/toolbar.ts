import { ExtensionResult, Null } from '../../../lib/types';
import Extension from '../../../base/extension';
import Resource from '../../../base/resource';
import View from '../../view';
import ViewList from '../../viewlist';
import { convertPX, hasValue, includes, optional } from '../../../lib/util';
import { createPlaceholder, findNestedExtension, overwriteDefault } from '../lib/util';
import { formatDimen, stripId } from '../../../lib/xml';
import { getStyle } from '../../../lib/dom';
import { NODE_PROCEDURE, NODE_RESOURCE } from '../../../lib/constants';
import { NODE_ANDROID } from '../../constants';
import { EXT_NAME } from '../../../extension/lib/constants';
import { DRAWABLE_PREFIX, VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

import EXTENSION_APPBAR_TMPL from '../../template/extension/appbar';

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
                if (item.tagName === 'NAV' && !includes(item.dataset.ext || '', EXT_NAME.EXTERNAL)) {
                    item.dataset.ext = (hasValue(item.dataset.ext) ? `${item.dataset.ext}, ` : '') + EXT_NAME.EXTERNAL;
                }
            });
            if (hasValue(element.dataset.target)) {
                const target = document.getElementById(<string> element.dataset.target);
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
        const application = this.application;
        const controller = application.controllerHandler;
        const node = (<T> this.node);
        const target = hasValue(node.dataset.target);
        const options = Object.assign({}, this.options[node.element.id]);
        const optionsToolbar = Object.assign({}, options.toolbar);
        const optionsAppBar = Object.assign({}, options.appBar);
        const optionsCollapsingToolbar = Object.assign({}, options.collapsingToolbar);
        const appBarChildren: T[] = [];
        const collapsingToolbarChildren: T[] = [];
        const hasMenu = (findNestedExtension(node, WIDGET_NAME.MENU) != null);
        const backgroundImage = node.css('backgroundImage');
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
            if (!hasValue(element.dataset.target)) {
                const targetNode = (<any> element).__node;
                if (targetNode != null) {
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
                overwriteDefault(appBarChildren.length > 0 ? optionsAppBar : optionsToolbar, 'android', 'background', `@drawable/${Resource.addImageURL(backgroundImage)}`);
                node.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
            }
            else {
                overwriteDefault(optionsToolbar, 'app', 'layout_scrollFlags', 'scroll|enterAlways');
            }
        }
        if (appBarChildren.length > 0) {
            overwriteDefault(optionsAppBar, 'android', 'layout_height', '?attr/actionBarSize');
        }
        else {
            overwriteDefault(optionsToolbar, 'android', 'layout_height', '?attr/actionBarSize');
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
        node.depth = depth + (appBar ? 1 : 0) + (collapsingToolbar ? 1 : 0);
        let xml = controller.renderNodeStatic(VIEW_SUPPORT.TOOLBAR, node.depth, optionsToolbar, 'match_parent', 'wrap_content', node, (children > 0));
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
                xml = controller.renderNodeStatic(NODE_ANDROID.IMAGE, node.depth, optionsBackgroundImage, 'match_parent', 'match_parent') + xml;
                node.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
            }
        }
        let outer = '';
        let appBarNode: Null<T> = null;
        let collapsingToolbarNode: Null<T> = null;
        if (appBar) {
            overwriteDefault(optionsAppBar, 'android', 'id', `${node.stringId}_appbar`);
            overwriteDefault(optionsAppBar, 'android', 'layout_height', (node.viewHeight > 0 ? formatDimen('appbar', 'height', convertPX(node.viewHeight)) : 'wrap_content'));
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
            appBarNode = createPlaceholder(application.cache.nextId, node, appBarChildren);
            appBarNode.depth = depth;
            appBarNode.nodeId = stripId(optionsAppBar.android.id);
            appBarNode.children.forEach(item => {
                item.depth = depth + 1;
                item.element.dataset.target = (<T> appBarNode).nodeId;
            });
            application.cache.list.push(appBarNode);
            outer = controller.renderNodeStatic(VIEW_SUPPORT.APPBAR, (target ? -1 : depth), optionsAppBar, 'match_parent', 'wrap_content', appBarNode, true);
            if (collapsingToolbar) {
                depth++;
                overwriteDefault(optionsCollapsingToolbar, 'android', 'id', `${node.stringId}_collapsingtoolbar`);
                overwriteDefault(optionsCollapsingToolbar, 'android', 'fitsSystemWindows', 'true');
                if (backgroundImage === 'none') {
                    overwriteDefault(optionsCollapsingToolbar, 'app', 'contentScrim', '?attr/colorPrimary');
                }
                overwriteDefault(optionsCollapsingToolbar, 'app', 'layout_scrollFlags', 'scroll|exitUntilCollapsed');
                overwriteDefault(optionsCollapsingToolbar, 'app', 'toolbarId', node.stringId);
                collapsingToolbarNode = createPlaceholder(application.cache.nextId, node, collapsingToolbarChildren);
                appBarNode.depth = depth;
                collapsingToolbarNode.children.forEach(item => {
                    item.depth = depth + 1;
                    item.element.dataset.target = (<T> collapsingToolbarNode).nodeId;
                });
                application.cache.list.push(collapsingToolbarNode);
                outer = outer.replace(`{:${appBarNode.id}}`, controller.renderNodeStatic(VIEW_SUPPORT.COLLAPSING_TOOLBAR, depth, optionsCollapsingToolbar, 'match_parent', 'match_parent', collapsingToolbarNode, true) + `{:${appBarNode.id}}`);
            }
        }
        if (appBarNode != null) {
            xml = (collapsingToolbarNode != null ? outer.replace(`{:${collapsingToolbarNode.id}}`, xml + `{:${collapsingToolbarNode.id}}`) : outer.replace(`{:${appBarNode.id}}`, xml + `{:${appBarNode.id}}`));
        }
        if (appBarNode != null) {
            if (collapsingToolbarNode == null) {
                node.parent = appBarNode;
            }
            else {
                collapsingToolbarNode.parent = appBarNode;
            }
            node.data(`${WIDGET_NAME.TOOLBAR}:outerParent`, appBarNode.stringId);
        }
        else if (collapsingToolbarNode != null) {
            node.parent = collapsingToolbarNode;
        }
        if (target) {
            node.render(node);
        }
        else {
            node.render(<T> this.parent);
            node.renderDepth = node.depth;
        }
        node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
        return { xml };
    }

    public processChild(): ExtensionResult {
        const element = this.element;
        if (element && element.tagName === 'IMG' && (element.dataset.navigationIcon != null || element.dataset.collapseIcon != null)) {
            this.node.hide();
            return { xml: '', proceed: true };
        }
        return { xml: '' };
    }

    public beforeInsert() {
        const node = (<T> this.node);
        const menu: string = optional(findNestedExtension(node, WIDGET_NAME.MENU), 'dataset.viewName');
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