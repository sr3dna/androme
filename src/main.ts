import { Null } from './lib/types';
import Application from './base/application';
import Extension from './base/extension';
import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';
import ViewController from './android/viewcontroller';
import View from './android/view';
import ViewList from './android/viewlist';
import ResourceView from './android/resource-view';
import FileRes from './android/fileres';
import API_ANDROID from './android/customizations';
import SETTINGS from './settings';

import External from './extension/external';
import List from './android/extension/list';
import Table from './extension/table';
import Grid from './extension/grid';
import Menu from './android/extension/menu';
import Toolbar from './android/extension/toolbar';
import Drawer from './android/extension/drawer';

type T = View;
type U = ViewList<T>;

const ROOT_CACHE: Set<HTMLElement> = new Set();
const EXTENSIONS: any = {
    'androme.external': new External('androme.external'),
    'androme.list': new List('androme.list', ['UL', 'OL']),
    'androme.table': new Table('androme.table', ['TABLE']),
    'androme.grid': new Grid('androme.grid', [], { balanceColumns: true }),
    'androme.widget.menu': new Menu('androme.widget.menu', ['NAV'], { appCompat: true }),
    'androme.widget.toolbar': new Toolbar('androme.widget.toolbar'),
    'androme.widget.drawer': new Drawer('androme.widget.drawer')
};

const Node = View;
const NodeList = ViewList;
const Controller = new ViewController();
const File = new FileRes();
const Resource = new ResourceView(File);

const main = new Application<T, U>(Node, NodeList);
main.registerController(Controller);
main.registerResource(Resource);

(() => {
    const load = new Set<Extension<T, U>>();
    for (let name of SETTINGS.builtInExtensions) {
        name = name.toLowerCase().trim();
        for (const ext in EXTENSIONS) {
            if (name === ext || ext.startsWith(`${name}.`)) {
                load.add(EXTENSIONS[ext]);
            }
        }
    }
    load.forEach(item => main.registerExtension(item));
})();

export function parseDocument(...elements: (Null<string | HTMLElement>)[]) {
    if (main.closed) {
        return;
    }
    main.resetController();
    main.setStyleMap();
    main.elements.clear();
    if (main.appName === '' && elements.length === 0) {
        elements.push(document.body);
    }
    elements.forEach(element => {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element instanceof HTMLElement) {
            main.elements.add(element);
        }
    });
    main.elements.forEach(element => {
        if (main.appName === '') {
            if (element.id === '') {
                element.id = 'androme';
            }
            main.appName = element.id;
        }
        else {
            if (element.id === '') {
                element.id = `view_${main.length}`;
            }
        }
        element.dataset.views = (element.dataset.views != null ? parseInt(element.dataset.views) + 1 : 1).toString();
        element.dataset.currentId = (element.dataset.views !== '1' ? `${element.id}_${element.dataset.views}` : element.id).replace(/[^\w]/g, '_');
        if (main.createNodeCache(element)) {
            main.createLayoutXml();
            main.setResources();
            if (SETTINGS.showAttributes) {
                main.setMarginPadding();
                main.setConstraints();
                main.replaceInlineAttributes();
            }
            main.replaceAppended();
            ROOT_CACHE.add(element);
        }
    });
}

export function registerExtension(extension: any) {
    if (extension instanceof Extension) {
        main.registerExtension(extension);
    }
}

export function configureExtension(name: string, options: {}) {
    if (options != null) {
        const extension = main.findExtension(name);
        if (extension != null) {
            Object.assign(extension.options, options);
        }
    }
}

export function getExtension(name: string) {
    return main.findExtension(name);
}

export function ready() {
    return !main.closed;
}

export function close() {
    if (main.length > 0) {
        main.finalize();
    }
}

export function reset() {
    ROOT_CACHE.forEach((element: HTMLElement) => {
        delete element.dataset.views;
        delete element.dataset.currentId;
    });
    ROOT_CACHE.clear();
    main.reset();
}

export function saveAllToDisk() {
    if (main.length > 0) {
        if (!main.closed) {
            main.finalize();
        }
        main.resourceHandler.file.saveAllToDisk(main.viewData);
    }
}

export function writeLayoutAllXml(saveToDisk = false) {
    autoClose();
    if (main.closed) {
        return main.resourceHandler.file.layoutAllToXml(main.viewData, saveToDisk);
    }
    return '';
}

export function writeResourceAllXml(saveToDisk = false) {
    autoClose();
    if (main.closed) {
        return main.resourceHandler.file.resourceAllToXml(saveToDisk);
    }
    return '';
}

export function writeResourceStringXml(saveToDisk = false) {
    autoClose();
    if (main.closed) {
        return main.resourceHandler.file.resourceStringToXml(saveToDisk);
    }
    return '';
}

export function writeResourceArrayXml(saveToDisk = false) {
    autoClose();
    if (main.closed) {
        return main.resourceHandler.file.resourceStringArrayToXml(saveToDisk);
    }
    return '';
}

export function writeResourceFontXml(saveToDisk = false) {
    autoClose();
    if (main.closed) {
        return main.resourceHandler.file.resourceFontToXml(saveToDisk);
    }
    return '';
}

export function writeResourceColorXml(saveToDisk = false) {
    if (main.closed) {
        return main.resourceHandler.file.resourceColorToXml(saveToDisk);
    }
    return '';
}

export function writeResourceStyleXml(saveToDisk = false) {
    autoClose();
    if (main.closed) {
        return main.resourceHandler.file.resourceStyleToXml(saveToDisk);
    }
    return '';
}

export function writeResourceDrawableXml(saveToDisk = false) {
    autoClose();
    if (main.closed) {
        return main.resourceHandler.file.resourceDrawableToXml(saveToDisk);
    }
    return '';
}

export function toString() {
    return main.toString();
}

function autoClose() {
    if (SETTINGS.autoCloseOnWrite && !main.closed) {
        main.finalize();
    }
}

export { API_ANDROID as api, BUILD_ANDROID as build, DENSITY_ANDROID as density, SETTINGS as settings };