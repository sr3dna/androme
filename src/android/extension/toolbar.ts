import { ExtensionResult } from '../../lib/types';
import View from '../view';
import Toolbar from '../../extension/widget/toolbar';
import Resource from '../../base/resource';
import { repeat, setDefaultOption } from '../../lib/util';
import { removePlaceholders } from '../../lib/xml';
import { getStyle } from '../../lib/dom';
import { VIEW_RESOURCE } from '../../lib/constants';
import { DRAWABLE_PREFIX, VIEW_SUPPORT } from './lib/constants';

export default class ToolbarAndroid<T extends View> extends Toolbar {
    constructor(name: string, tagNames: string[] = [], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const controller = this.application.controllerHandler;
        const node = (<T> this.node);
        node.ignoreResource = VIEW_RESOURCE.FONT_STYLE;
        const actionBar = (node.element.dataset.extFor != null);
        const depth = (actionBar ? 0 : node.depth + node.renderDepth);
        const options = Object.assign({}, (this.element != null ? this.options[this.element.id] : {}));
        const toolbar = Object.assign({}, options.toolbar);
        let children = 0;
        Array.from(node.element.children).forEach((element: HTMLElement) => {
            if (element.tagName === 'IMG') {
                if (element.dataset.navigationIcon != null) {
                    const result = Resource.addImageSrcSet(<HTMLImageElement> element, DRAWABLE_PREFIX.MENU);
                    if (result !== '') {
                        setDefaultOption(toolbar, 'app', 'navigationIcon', `@drawable/${result}`);
                        if (getStyle(element).display !== 'none') {
                            children++;
                        }
                    }
                }
                if (element.dataset.collapseIcon != null) {
                    const result = Resource.addImageSrcSet(<HTMLImageElement> element, DRAWABLE_PREFIX.MENU);
                    if (result !== '') {
                        setDefaultOption(toolbar, 'app', 'collapseIcon', `@drawable/${result}`);
                        if (getStyle(element).display !== 'none') {
                            children++;
                        }
                    }
                }
            }
        });
        if (actionBar) {
            setDefaultOption(toolbar, 'android', 'layout_height', '?attr/actionBarSize');
            setDefaultOption(toolbar, 'android', 'background', '?attr/colorPrimary');
            setDefaultOption(toolbar, 'app', 'popupTheme', '@style/ThemeOverlay.AppCompat.Light');
        }
        if (this.getMenu(node) != null) {
            setDefaultOption(toolbar, 'app', 'menu', `@menu/{!androme.widget.toolbar:menu:${node.id}}`);
        }
        let xml = controller.getViewStatic(VIEW_SUPPORT.TOOLBAR, depth + 1, { android: toolbar.android, app: toolbar.app }, 'match_parent', 'wrap_content', node, (node.children.length - children > 0));
        if (actionBar || this.options.appBar != null) {
            const appBar = Object.assign({}, options.appBar);
            setDefaultOption(appBar, 'android', 'id', `${node.stringId}_appbar`);
            setDefaultOption(appBar, 'app', 'theme', '@style/ThemeOverlay.AppCompat.Dark.ActionBar');
            xml = controller.getViewStatic(VIEW_SUPPORT.APPBAR, depth, { android: appBar.android, app: appBar.app }, 'match_parent', 'wrap_content', null, true).replace(`{:0}`, xml);
        }
        if (actionBar) {
            node.options('androme.widget.toolbar:insert', xml);
            node.hide();
            return ['', false, true];
        }
        else {
            node.applyCustomizations();
            node.render(<T> this.parent);
            node.setGravity();
            return [xml, false, false];
        }
    }

    public processChild(): ExtensionResult {
        const element = this.element;
        if (element != null) {
            if (element.tagName === 'IMG') {
                if (element.dataset.navigationIcon != null || element.dataset.collapseIcon != null) {
                    this.node.hide();
                }
            }
        }
        return ['', false, false];
    }

    public finalize() {
        const actionBar = (<string> this.node.element.dataset.extFor);
        const menu = this.getMenu(<T> this.node);
        const layouts = this.application.layouts;
        if (actionBar != null) {
            const parent = this.application.findByDomId(actionBar);
            if (parent != null) {
                let xml = (<string> this.node.options('androme.widget.toolbar:insert')) || '';
                xml = xml.replace(/>>>>/g, repeat(parent.renderDepth + 2));
                if (menu != null) {
                    xml = removePlaceholders(xml.replace(`{!androme.widget.toolbar:menu:${this.node.id}}`, <string> menu.dataset.currentId)).replace(/\s*$/g, '');
                }
                for (let i = 0; i < layouts.length; i++) {
                    layouts[i].content = layouts[i].content.replace(`{!androme.widget.drawer:toolbar:${parent.id}}`, xml + '\n');
                }
            }
        }
        else if (menu != null) {
            for (let i = 0; i < layouts.length; i++) {
                layouts[i].content = layouts[i].content.replace(`{!androme.widget.toolbar:menu:${this.node.id}}`, <string> menu.dataset.currentId);
            }
        }
    }

    private getMenu(node: T) {
        return (<HTMLElement> Array.from(node.element.children).find((element: HTMLElement) => element.tagName === 'NAV' && element.dataset.ext != null && element.dataset.ext.indexOf('androme.widget.menu') !== -1));
    }
}