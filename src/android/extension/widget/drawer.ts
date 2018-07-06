import { ExtensionResult, ObjectMap } from '../../../lib/types';
import View from '../../view';
import ViewList from '../../viewlist';
import Extension from '../../../base/extension';
import Resource from '../../../base/resource';
import { setDefaultOption } from '../../../lib/util';
import { getTemplateLevel, insertTemplateData, parseTemplate } from '../../../lib/xml';
import { parseHex } from '../../../lib/color';
import { VIEW_RESOURCE } from '../../../lib/constants';
import { VIEW_SUPPORT } from '../lib/constants';
import parseRTL from '../../localization';
import SETTINGS from '../../../settings';

import EXTENSION_DRAWER_TMPL from '../../template/extension/drawer';

type T = View;
type U = ViewList<T>;

export default class Drawer extends Extension<T, U> {
    constructor(name: string, tagNames: string[] = [], options?: {}) {
        super(name, tagNames, options);
        this.activityMain = true;
        this.require('androme.external', true);
        this.require('androme.widget.menu');
        this.require('androme.widget.coordinator');
    }

    public init(element: HTMLElement) {
        if (this.included(element) && element.children.length > 0) {
            Array.from(element.children).forEach((item: HTMLElement) => {
                if (item.tagName === 'NAV' && item.dataset.ext == null) {
                    item.dataset.ext = 'androme.external';
                }
            });
            this.application.elements.add(element);
            return true;
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
        coordinator.parent = node;
        coordinator.inheritBase(node);
        coordinator.renderExtension = application.findExtension('androme.widget.coordinator');
        coordinator.ignoreResource = VIEW_RESOURCE.ALL;
        coordinator.isolated = true;
        application.cache.list.push(coordinator);
        const content = controller.getViewStatic(VIEW_SUPPORT.COORDINATOR, depth + 1, { android: { id: (include === '' ? `${node.stringId}_content` : '') } }, 'match_parent', 'match_parent', coordinator, true);
        options = Object.assign({}, this.options.navigationView);
        setDefaultOption(options, 'android', 'layout_gravity', parseRTL('left'));
        if (menu != null) {
            this.createResources();
            setDefaultOption(options, 'android', 'id', `${node.stringId}_view`);
            setDefaultOption(options, 'android', 'fitsSystemWindows', 'true');
            setDefaultOption(options, 'app', 'menu', `@menu/{${node.id}:${this.name}:menu}`);
            setDefaultOption(options, 'app', 'headerLayout', `@layout/{${node.id}:${this.name}:headerLayout}`);
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
        node.applyCustomizations();
        return { xml };
    }

    public finalize() {
        const application = this.application;
        const node = (<T> this.node);
        if (this.getMenu(node) != null) {
            let menu = '';
            let headerLayout = '';
            application.elements.forEach(item => {
                if (item.parentElement === node.element) {
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
                views[i].content = views[i].content.replace(`{${node.id}:${this.name}:menu}`, menu);
                views[i].content = views[i].content.replace(`{${node.id}:${this.name}:headerLayout}`, headerLayout);
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
                'appTheme': options.resource.appTheme,
                'parentTheme': options.resource.parentTheme,
                '1': []
            }]
        };
        if (options.item != null) {
            const root = getTemplateLevel(data, '0');
            for (const name in options.item) {
                let value = options.item[name];
                const hex = parseHex(value);
                if (hex !== '') {
                    value = `@color/${Resource.addColor(hex)}`;
                }
                root['1'].push({ name, value });
            }
        }
        setDefaultOption(options, 'output', 'path', 'res/values-v21');
        setDefaultOption(options, 'output', 'file', `${this.name}.xml`);
        const xml = insertTemplateData(template, data);
        this.application.resourceHandler.addFile(options.output.path, options.output.file, xml);
    }
}