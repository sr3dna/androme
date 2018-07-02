import { ExtensionResult, ObjectMap } from '../../lib/types';
import View from '../view';
import Drawer from '../../extension/widget/drawer';
import { VIEW_RESOURCE } from '../../lib/constants';
import { VIEW_SUPPORT } from './lib/constants';
import { setDefaultOption } from '../../lib/util';
import parseRTL from '../localization';
import { getDataLevel, parseTemplateData, parseTemplateMatch } from '../../lib/xml';
import SETTINGS from '../../settings';

import EXTENSION_DRAWER_TMPL from '../template/extension/drawer';

export default class DrawerAndroid<T extends View> extends Drawer {
    constructor(name: string, tagNames: string[] = [], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const controller = this.application.controllerHandler;
        const node = (<T> this.node);
        node.ignoreResource = VIEW_RESOURCE.FONT_STYLE;
        let depth = node.depth + node.renderDepth;
        const menu = this.getMenu(node);
        let options = Object.assign({}, this.options.drawerLayout);
        if (menu != null) {
            setDefaultOption(options, 'android', 'fitsSystemWindows', 'true');
        }
        let drawer = controller.getViewStatic(VIEW_SUPPORT.DRAWER, depth, { android: options.android, app: options.app }, 'match_parent', 'match_parent', node, true);
        let include = '';
        const filename = `${node.viewId}_content`;
        if (this.options.includes == null || this.options.includes) {
            include = controller.getViewStatic('include', depth + 1, { layout: `@layout/${filename}` });
            depth = -1;
        }
        let coordinator = controller.getViewStatic(VIEW_SUPPORT.COORDINATOR, depth + 1, { android: { id: (include === '' ? `${node.stringId}_content` : '') } }, 'match_parent', 'match_parent', new View(0, SETTINGS.targetAPI), true);
        if (menu != null) {
            this.createResources();
            options = Object.assign({}, this.options.navigationView);
            setDefaultOption(options, 'android', 'id', `${node.stringId}_view`);
            setDefaultOption(options, 'android', 'layout_gravity', parseRTL('left'));
            setDefaultOption(options, 'android', 'fitsSystemWindows', 'true');
            setDefaultOption(options, 'app', 'menu', `@menu/{!androme.widget.drawer:menu:${node.id}}`);
            setDefaultOption(options, 'app', 'headerLayout', `@layout/{!androme.widget.drawer:headerLayout:${node.id}}`);
            coordinator = coordinator.replace('{:0}', `{!androme.widget.drawer:toolbar:${node.id}}`);
            const navigation = controller.getViewStatic(VIEW_SUPPORT.NAVIGATION_VIEW, node.depth + 1, { android: options.android, app: options.app }, 'wrap_content', 'match_parent');
            drawer = drawer.replace(`{:${node.id}}`, (include !== '' ? include : coordinator) + navigation);
        }
        else {
            const navView = node.children[node.children.length - 1];
            options = this.options.navigationView;
            if (node.children.length === 1) {
                this.application.controllerHandler.prependBefore(navView.id, (include !== '' ? include : coordinator));
            }
            navView.android('layout_gravity', parseRTL((options && options.layout_gravity != null ? options.layout_gravity : 'left')));
        }
        if (include !== '') {
            this.application.addInclude(filename, coordinator);
        }
        node.renderParent = true;
        return [drawer, false, false];
    }

    public finalize() {
        const node = (<T> this.node);
        if (this.getMenu(node) != null) {
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
            const views = this.application.viewData.views;
            for (let i = 0; i < views.length; i++) {
                views[i].content = views[i].content.replace(`{!androme.widget.drawer:menu:${this.node.id}}`, menu);
                views[i].content = views[i].content.replace(`{!androme.widget.drawer:headerLayout:${this.node.id}}`, headerLayout);
            }
        }
    }

    private getMenu(node: T) {
        return (<HTMLElement> Array.from(node.element.children).find((element: HTMLElement) => element.tagName === 'NAV' && element.dataset.ext != null && element.dataset.ext.indexOf('androme.widget.menu') !== -1));
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