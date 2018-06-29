import { ExtensionResult, ObjectMap } from '../../lib/types';
import View from '../view';
import Drawer from '../../extension/drawer';
import { VIEW_RESOURCE } from '../../lib/constants';
import parseRTL from '../localization';
import { getDataLevel, parseTemplateData, parseTemplateMatch } from '../../lib/xml';

import EXTENSION_DRAWER_TMPL from '../template/extension/drawer';

const enum VIEW_STATIC {
    DRAWER = 'android.support.v4.widget.DrawerLayout',
    NAVIGATION = 'android.support.design.widget.NavigationView'
}

export default class DrawerAndroid<T extends View> extends Drawer {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const controller = this.application.controllerHandler;
        const node = (<T> this.node);
        node.setViewId(VIEW_STATIC.DRAWER);
        let xml = controller.getViewStatic(VIEW_STATIC.DRAWER, node.depth, {}, '', '', node.id, true)[0];
        node.android('layout_width', (this.options.layout_width || 'match_parent'));
        node.android('layout_height', (this.options.layout_height || 'match_parent'));
        node.android('fitsSystemWindows', (this.options.fitsSystemWindows || 'true'));
        node.renderDepth = 0;
        node.renderParent = true;
        node.ignoreResource = VIEW_RESOURCE.ALL;
        this.createResources();
        const options = {
            android: {
                id: `${node.stringId}_view`,
                layout_gravity: parseRTL(this.options.layout_gravity || 'left'),
                fitsSystemWindows: (this.options.fitsSystemWindows || 'true')
            },
            app: {
                menu: `@menu/{androme.drawer:menu:${node.id}}`,
                headerLayout: `@layout/{androme.drawer:headerLayout:${node.id}}`
            }
        };
        const navigation = controller.getViewStatic(VIEW_STATIC.NAVIGATION, node.depth + 1, options, 'wrap_content', 'match_parent')[0];
        xml = xml.replace(`{:${node.id}}`, navigation);
        return [xml, false];
    }

    public finalize() {
        let menu = '';
        let headerLayout = '';
        this.application.elements.forEach(item => {
            if (item.parentElement === this.element) {
                switch (item.dataset.extension) {
                    case 'androme.external':
                        headerLayout = (<string> item.dataset.currentId);
                        break;
                    case 'androme.menu':
                        menu = (<string> item.dataset.currentId);
                        break;
                }
            }
        });
        const views = this.application.views;
        for (let i = 0; i < views.length; i++) {
            views[i] = views[i].replace(`{androme.drawer:menu:${this.node.id}}`, menu);
            views[i] = views[i].replace(`{androme.drawer:headerLayout:${this.node.id}}`, headerLayout);
        }
    }

    private createResources() {
        const template: ObjectMap<string> = parseTemplateMatch(EXTENSION_DRAWER_TMPL);
        const data: ObjectMap<any> = {
            '0': [{
                'appTheme': this.options.appTheme || 'AppTheme',
                'parentTheme': this.options.parentTheme || 'Theme.AppCompat.Light.NoActionBar',
                '1': []
            }]
        };
        if (this.options.item != null) {
            const root = getDataLevel(data, '0');
            for (const name in this.options.item) {
                root['1'].push({
                    name,
                    value: this.options.item[name]
                });
            }
        }
        const pathname = (this.options.output && this.options.output.path != null ? this.options.output.path : 'res/values-v21');
        const filename = (this.options.output && this.options.output.file != null ? this.options.output.file : 'androme.drawer.xml');
        const xml = parseTemplateData(template, data);
        this.application.resourceHandler.addFile(pathname, filename, xml);
    }
}