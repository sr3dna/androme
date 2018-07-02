import { ExtensionResult } from '../../lib/types';
import View from '../view';
import Toolbar from '../../extension/widget/toolbar';
import { padLeft, removePlaceholders, setDefaultOption } from '../../lib/util';
import Resource from '../../base/resource';
import { VIEW_RESOURCE } from '../../lib/constants';
import { getStyle } from '../../lib/dom';

const enum VIEW_STATIC {
    TOOLBAR = 'android.support.v7.widget.Toolbar'
}

export default class ToolbarAndroid<T extends View> extends Toolbar {
    constructor(name: string, tagNames: string[] = [], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const controller = this.application.controllerHandler;
        const node = (<T> this.node);
        node.ignoreResource = VIEW_RESOURCE.FONT_STYLE;
        const options = Object.assign({}, (this.element != null ? this.options[this.element.id] : {}));
        setDefaultOption(options, 'app', 'menu', `@menu/{!androme.widget.toolbar:menu:${node.id}}`);
        let children = 0;
        Array.from(node.element.childNodes).forEach((element: HTMLElement) => {
            if (element.tagName === 'IMG') {
                const prefix = 'ic_menu_';
                if (element.dataset.navigationIcon != null) {
                    const result = Resource.addImageSrcSet(<HTMLImageElement> element, prefix);
                    if (result !== '') {
                        setDefaultOption(options, 'app', 'navigationIcon', `@drawable/${result}`);
                        if (getStyle(element).display !== 'none') {
                            children++;
                        }
                    }
                }
                if (element.dataset.collapseIcon != null) {
                    const result = Resource.addImageSrcSet(<HTMLImageElement> element, prefix);
                    if (result !== '') {
                        setDefaultOption(options, 'app', 'collapseIcon', `@drawable/${result}`);
                        if (getStyle(element).display !== 'none') {
                            children++;
                        }
                    }
                }
            }
        });
        const actionBar = (node.element.dataset.extActionBarFor != null);
        if (actionBar) {
            setDefaultOption(options, 'android', 'layout_width', 'match_parent');
            setDefaultOption(options, 'android', 'layout_height', 'wrap_content');
            setDefaultOption(options, 'android', 'minHeight', '?attr/actionBarSize');
            setDefaultOption(options, 'android', 'background', '?attr/colorPrimaryLight');
            setDefaultOption(options, 'android', 'elevation', '4px');
        }
        setDefaultOption(options, 'app', 'theme', '@style/ThemeOverlay.AppCompat.Dark.ActionBar');
        let xml = controller.getViewStatic(VIEW_STATIC.TOOLBAR, (actionBar ? 0 : node.depth + node.renderDepth), { android: options.android, app: options.app }, '', '', node, (node.children.length - children > 0));
        if (actionBar) {
            node.options('androme.widget.toolbar:insert', xml);
            node.renderParent = true;
            xml = '';
        }
        else {
            node.applyCustomizations();
            node.render(<T> this.parent);
            node.setGravity();
        }
        return [xml, false, false];
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
        const actionBar = (<string> this.node.element.dataset.extActionBarFor);
        const menu = (<HTMLElement> Array.from(this.node.element.childNodes).find((element: HTMLElement) => element.tagName === 'NAV' && element.dataset.currentId != null));
        if (actionBar != null) {
            const parent = this.application.findByDomId(actionBar);
            if (parent != null) {
                let xml = (<string> this.node.options('androme.widget.toolbar:insert')) || '';
                xml = xml.replace(/>>>>/g, padLeft(parent.renderDepth + 2));
                if (menu != null) {
                    xml = removePlaceholders(xml.replace(`{!androme.widget.toolbar:menu:${this.node.id}}`, <string> menu.dataset.currentId)).replace(/\s*$/g, '');
                }
                const views = this.application.views;
                for (let i = 0; i < views.length; i++) {
                    views[i] = views[i].replace(`{!androme.widget.drawer:toolbar:${parent.id}}`, xml + '\n');
                }
            }
        }
        else {
            const views = this.application.views;
            for (let i = 0; i < views.length; i++) {
                views[i] = views[i].replace(`{!androme.widget.toolbar:menu:${this.node.id}}`, <string> menu.dataset.currentId);
            }
        }
    }
}