import { ExtensionResult, ObjectMap } from '../../lib/types';
import View from '../view';
import Drawer from '../../extension/widget/drawer';
import { VIEW_RESOURCE } from '../../lib/constants';
import { removePlaceholders, setDefaultOption } from '../../lib/util';
import { VIEW_ANDROID } from '../constants';
import parseRTL from '../localization';
import { getDataLevel, parseTemplateData, parseTemplateMatch } from '../../lib/xml';

import EXTENSION_DRAWER_TMPL from '../template/extension/drawer';

const enum VIEW_STATIC {
    DRAWER = 'android.support.v4.widget.DrawerLayout',
    NAVIGATION = 'android.support.design.widget.NavigationView'
}

export default class DrawerAndroid<T extends View> extends Drawer {
    constructor(name: string, tagNames: string[] = [], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const controller = this.application.controllerHandler;
        const node = (<T> this.node);
        const depth = node.depth + node.renderDepth;
        const hasNavView = this.haNavView(node);
        let options = Object.assign({}, this.options.drawerLayout);
        if (hasNavView) {
            setDefaultOption(options, 'android', 'fitsSystemWindows', 'true');
        }
        let xml = controller.getViewStatic(VIEW_STATIC.DRAWER, depth, { android: options.android, app: options.app }, 'match_parent', 'match_parent', node, true);
        node.renderParent = true;
        node.ignoreResource = VIEW_RESOURCE.ALL;
        let layout = controller.getViewStatic(VIEW_ANDROID.LINEAR, depth + 1, { android: { id: `${node.stringId}_content`, orientation: 'vertical' } }, 'match_parent', 'match_parent', null, true);
        if (hasNavView) {
            this.createResources();
            options = Object.assign({}, this.options.navigationView);
            setDefaultOption(options, 'android', 'id', `${node.stringId}_view`);
            setDefaultOption(options, 'android', 'layout_gravity', parseRTL('left'));
            setDefaultOption(options, 'android', 'fitsSystemWindows', 'true');
            setDefaultOption(options, 'app', 'menu', `@menu/{!androme.widget.drawer:menu:${node.id}}`);
            setDefaultOption(options, 'app', 'headerLayout', `@layout/{!androme.widget.drawer:headerLayout:${node.id}}`);
            layout = removePlaceholders(layout.replace('{:0}', `{!androme.widget.drawer:toolbar:${node.id}}`), false);
            const navigation = controller.getViewStatic(VIEW_STATIC.NAVIGATION, node.depth + 1, { android: options.android, app: options.app }, 'wrap_content', 'match_parent');
            xml = xml.replace(`{:${node.id}}`, layout + navigation);
        }
        else {
            const navView = node.children[node.children.length - 1];
            options = this.options.navigationView;
            if (node.children.length === 1) {
                this.application.controllerHandler.prependBefore(navView.id, layout);
            }
            navView.android('layout_gravity', parseRTL((options && options.layout_gravity != null ? options.layout_gravity : 'left')));
        }
        return [xml, false, false];
    }

    public finalize() {
        const node = (<T> this.node);
        if (this.haNavView(node)) {
            let menu = '';
            let headerLayout = '';
            this.application.elements.forEach(item => {
                if (item.parentElement === this.element) {
                    switch (item.dataset.ext) {
                        case 'androme.external':
                            headerLayout = (<string> item.dataset.currentId);
                            break;
                        case 'androme.widget.menu':
                            menu = (<string> item.dataset.currentId);
                            break;
                    }
                }
            });
            const views = this.application.views;
            for (let i = 0; i < views.length; i++) {
                views[i] = views[i].replace(`{!androme.widget.drawer:menu:${this.node.id}}`, menu);
                views[i] = views[i].replace(`{!androme.widget.drawer:headerLayout:${this.node.id}}`, headerLayout);
            }
        }
    }

    private haNavView(node: T) {
        return Array.from(node.element.children).some((element: HTMLElement) => element.tagName === 'NAV' && element.dataset.ext != null && element.dataset.ext.indexOf('androme.widget.menu') !== -1);
    }

    private createResources() {
        const options = Object.assign({}, this.options.resource);
        setDefaultOption(options, 'resource', 'appTheme', 'AppTheme');
        setDefaultOption(options, 'resource', 'parentTheme', 'Theme.AppCompat.Light.NoActionBar');
        const template: ObjectMap<string> = parseTemplateMatch(EXTENSION_DRAWER_TMPL);
        const data: ObjectMap<any> = {
            '0': [{
                'appTheme': this.options.resource.appTheme,
                'parentTheme': this.options.resource.parentTheme,
                '1': []
            }]
        };
        if (options.item != null) {
            const root = getDataLevel(data, '0');
            for (const name in options.item) {
                root['1'].push({ name, value: options.item[name] });
            }
        }
        setDefaultOption(options, 'output', 'path', 'res/values-v21');
        setDefaultOption(options, 'output', 'file', 'androme.widget.drawer.xml');
        const xml = parseTemplateData(template, data);
        this.application.resourceHandler.addFile(options.output.path, options.output.file, xml);
    }
}