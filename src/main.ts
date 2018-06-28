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
import Drawer from './android/extension/drawer';

let MAIN: any;
const CACHE: Set<HTMLElement> = new Set();

const EXTENSIONS: any = {
    'androme.external': new External('androme.external', []),
    'androme.list': new List('androme.list', ['UL', 'OL']),
    'androme.table': new Table('androme.table', ['TABLE']),
    'androme.grid': new Grid('androme.grid', [], { balanceColumns: true }),
    'androme.menu': new Menu('androme.menu', ['NAV'], { nsAppCompat: true }),
    'androme.drawer': new Drawer('androme.drawer', [])
};

function __app(object: any) {
    type T = View;
    type U = ViewList<T>;
    const app: Application<T, U> = object;
    return app;
}

export function parseDocument(...elements: (string | HTMLElement | null)[]) {
    type T = View;
    type U = ViewList<T>;
    let main: Application<T, U>;
    if (MAIN == null) {
        const Node = View;
        const NodeList = ViewList;
        const Controller = new ViewController();
        const File = new FileRes();
        const Resource = new ResourceView(File);
        main = new Application<T, U>(Node, NodeList);
        main.registerController(Controller);
        main.registerResource(Resource);
        for (const name of SETTINGS.builtInExtensions) {
            const extension: Extension<T, U> = EXTENSIONS[name.toLowerCase().trim()];
            if (extension != null) {
                main.registerExtension(extension);
            }
        }
        MAIN = main;
    }
    else {
        main = MAIN;
        main.resetController();
    }
    if (main.closed) {
        return;
    }
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
        element.dataset.views = (element.dataset.views ? parseInt(element.dataset.views) + 1 : '1').toString();
        element.dataset.currentId = (element.dataset.views !== '1' ? `${element.id}_${element.dataset.views}` : element.id).replace(/-/g, '_');
        if (main.createNodeCache(element) && main.createLayoutXml()) {
            main.setResources();
            if (SETTINGS.showAttributes) {
                main.setMarginPadding();
                main.setConstraints();
                main.replaceInlineAttributes();
            }
            main.replaceAppended();
            CACHE.add(element);
        }
        else {
            delete element.dataset.views;
            delete element.dataset.currentId;
        }
    });
}

export function registerExtension(extension: any) {
    const main = __app(MAIN);
    if (main != null) {
        if (extension instanceof Extension) {
            main.registerExtension(extension);
        }
    }
}

export function configureExtension(name: string, options: {}) {
    const main = __app(MAIN);
    if (main != null && options != null) {
        main.extensions.some(item => {
            if (item.name === name) {
                Object.assign(item.options, options);
                return true;
            }
            return false;
        });
    }
}

export function ready() {
    const main = __app(MAIN);
    return (main == null || !main.closed);
}

export function close() {
    const main = __app(MAIN);
    if (main != null && main.length > 0) {
        main.finalize();
    }
}

export function reset() {
    const main = __app(MAIN);
    if (main != null) {
        CACHE.forEach((element: HTMLElement) => {
            delete element.dataset.views;
            delete element.dataset.currentId;
        });
        CACHE.clear();
        main.reset();
    }
}

export function saveAllToDisk() {
    const main = __app(MAIN);
    if (main && main.length > 0) {
        if (!main.closed) {
            main.finalize();
        }
        main.resourceHandler.file.saveAllToDisk(main.viewData);
    }
}

export function writeLayoutAllXml(saveToDisk = false) {
    const main = __app(MAIN);
    if (main != null) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.layoutAllToXml(main.viewData, saveToDisk);
        }
    }
    return '';
}

export function writeResourceAllXml(saveToDisk = false) {
    const main = __app(MAIN);
    if (main != null) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceAllToXml(saveToDisk);
        }
    }
    return '';
}

export function writeResourceStringXml(saveToDisk = false) {
    if (MAIN != null) {
        autoClose();
        if (MAIN.closed) {
            return MAIN.resourceHandler.file.resourceStringToXml(saveToDisk);
        }
    }
    return '';
}

export function writeResourceArrayXml(saveToDisk = false) {
    const main = __app(MAIN);
    if (main != null) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceStringArrayToXml(saveToDisk);
        }
    }
    return '';
}

export function writeResourceFontXml(saveToDisk = false) {
    const main = __app(MAIN);
    if (main != null) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceFontToXml(saveToDisk);
        }
    }
    return '';
}

export function writeResourceColorXml(saveToDisk = false) {
    const main = __app(MAIN);
    if (main && main.closed) {
        return MAIN.resourceHandler.file.resourceColorToXml(saveToDisk);
    }
    return '';
}

export function writeResourceStyleXml(saveToDisk = false) {
    const main = __app(MAIN);
    if (main != null) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceStyleToXml(saveToDisk);
        }
    }
    return '';
}

export function writeResourceDrawableXml(saveToDisk = false) {
    const main = __app(MAIN);
    if (main != null) {
        autoClose();
        if (main.closed) {
            return main.resourceHandler.file.resourceDrawableToXml(saveToDisk);
        }
    }
    return '';
}

export function toString() {
    const main = __app(MAIN);
    return (main != null ? main.toString() : '');
}

function autoClose() {
    const main = __app(MAIN);
    if (SETTINGS.autoCloseOnWrite && main && !main.closed) {
        main.finalize();
    }
}

export { API_ANDROID as api, BUILD_ANDROID as build, DENSITY_ANDROID as density, SETTINGS as settings };