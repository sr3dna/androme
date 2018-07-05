import { ExtensionResult, ObjectMap } from '../../lib/types';
import View from '../view';
import Drawer from '../../extension/widget/drawer';
import { setDefaultOption } from '../../lib/util';
import { getTemplateLevel, insertTemplateData, parseTemplate } from '../../lib/xml';
import { VIEW_RESOURCE } from '../../lib/constants';
import { VIEW_SUPPORT } from './lib/constants';
import parseRTL from '../localization';
import SETTINGS from '../../settings';

import EXTENSION_DRAWER_TMPL from '../template/extension/drawer';

export default class DrawerAndroid<T extends View> extends Drawer {
    constructor(name: string, tagNames: string[] = [], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const application = this.application;
        const controller = application.controllerHandler;
        const node = (<T> this.node);
        node.ignoreResource = VIEW_RESOURCE.FONT_STYLE;
        let depth = node.depth + node.renderDepth;
        let options = Object.assign({}, this.options.drawerLayout);
        let menu = this.getMenu(node);
        if (menu != null) {
            setDefaultOption(options, 'android', 'fitsSystemWindows', 'true');
        }
        let xml = controller.getViewStatic(VIEW_SUPPORT.DRAWER, depth, { android: options.android, app: options.app }, 'match_parent', 'match_parent', node, true);
        const filename = `${node.viewId}_content`;
        let include = '';
        if (this.options.includes == null || this.options.includes) {
            include = controller.getViewStatic('include', depth + 1, { layout: `@layout/${filename}` });
            depth = -1;
        }
        const coordinator = new View(application.cache.nextId, SETTINGS.targetAPI, null, { depth: 0 });
        coordinator.parent = node.parent;
        coordinator.inheritBase(node);
        coordinator.renderExtension = application.findExtension('androme.widget.coordinator');
        coordinator.ignoreResource = VIEW_RESOURCE.ALL;
        application.cache.list.push(coordinator);
        let content = controller.getViewStatic(VIEW_SUPPORT.COORDINATOR, depth + 1, { android: { id: (include === '' ? `${node.stringId}_content` : '') } }, 'match_parent', 'match_parent', coordinator, true);
        options = Object.assign({}, this.options.navigationView);
        setDefaultOption(options, 'android', 'layout_gravity', parseRTL('left'));
        if (menu != null) {
            this.createResources();
            setDefaultOption(options, 'android', 'id', `${node.stringId}_view`);
            setDefaultOption(options, 'android', 'fitsSystemWindows', 'true');
            setDefaultOption(options, 'app', 'menu', `@menu/{${node.id}:androme.widget.drawer:menu}`);
            setDefaultOption(options, 'app', 'headerLayout', `@layout/{${node.id}:androme.widget.drawer:headerLayout}`);
            content = content.replace(`{:${coordinator.id}}`, `{${node.id}:androme.widget.drawer:toolbar}`);
            const navigation = controller.getViewStatic(VIEW_SUPPORT.NAVIGATION_VIEW, node.depth + 1, { android: options.android, app: options.app }, 'wrap_content', 'match_parent');
            xml = xml.replace(`{:${node.id}}`, (include !== '' ? include : content) + navigation);
        }
        else {
            const navView = node.children[node.children.length - 1];
            navView.android('layout_gravity', options.android.layout_gravity);
            navView.isolated = true;
            application.controllerHandler.prependBefore(navView.id, (include !== '' ? include : content));
            menu = navView.element;
        }
        node.children.forEach(item => {
            if ((<any> menu).__node !== item) {
                item.parent = coordinator;
                coordinator.children.push(item);
            }
        });
        if (include !== '') {
            application.addInclude(filename, content);
        }
        node.renderParent = true;
        return [xml, false, false];
    }

    public finalize() {
        const application = this.application;
        const node = (<T> this.node);
        if (this.getMenu(node) != null) {
            let menu = '';
            let headerLayout = '';
            application.elements.forEach(item => {
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
            const views = application.viewData.views;
            for (let i = 0; i < views.length; i++) {
                views[i].content = views[i].content.replace(`{${this.node.id}:androme.widget.drawer:menu}`, menu);
                views[i].content = views[i].content.replace(`{${this.node.id}:androme.widget.drawer:headerLayout}`, headerLayout);
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
        const template: ObjectMap<string> = parseTemplate(EXTENSION_DRAWER_TMPL);
        const data: ObjectMap<any> = {
            '0': [{
                'appTheme': this.options.resource.appTheme,
                'parentTheme': this.options.resource.parentTheme,
                '1': []
            }]
        };
        if (options.item != null) {
            const root = getTemplateLevel(data, '0');
            for (const name in options.item) {
                root['1'].push({ name, value: options.item[name] });
            }
        }
        setDefaultOption(options, 'output', 'path', 'res/values-v21');
        setDefaultOption(options, 'output', 'file', 'androme.widget.drawer.xml');
        const xml = insertTemplateData(template, data);
        this.application.resourceHandler.addFile(options.output.path, options.output.file, xml);
    }
}