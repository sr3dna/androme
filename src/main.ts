import { IExtension, Null, StringMap } from './lib/types';
import Application from './base/application';
import Extension from './base/extension';
import { convertWord, optional } from './lib/util';
import { EXT_NAME } from './extension/lib/constants';
import SETTINGS from './settings';

import External from './extension/external';

import ViewController from './android/viewcontroller';
import ResourceView from './android/resource-view';
import FileView from './android/file-view';
import View from './android/view';
import ViewList from './android/viewlist';
import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';
import API_ANDROID from './android/customizations';

import Custom from './android/extension/custom';
import List from './android/extension/list';
import Grid from './android/extension/grid';
import Table from './android/extension/table';
import Button from './android/extension/widget/floatingactionbutton';
import Menu from './android/extension/widget/menu';
import Coordinator from './android/extension/widget/coodinator';
import Toolbar from './android/extension/widget/toolbar';
import BottomNavigation from './android/extension/widget/bottomnavigation';
import Drawer from './android/extension/widget/drawer';
import { WIDGET_NAME } from './android/extension/lib/constants';

type T = View;
type U = ViewList<T>;

let LOADING = false;
const ROOT_CACHE: Set<HTMLElement> = new Set();
const EXTENSIONS = {
    [EXT_NAME.EXTERNAL]: new External(EXT_NAME.EXTERNAL),
    [EXT_NAME.CUSTOM]: new Custom(EXT_NAME.CUSTOM),
    [EXT_NAME.LIST]: new List(EXT_NAME.LIST, ['UL', 'OL']),
    [EXT_NAME.TABLE]: new Table(EXT_NAME.TABLE, ['TABLE']),
    [EXT_NAME.GRID]: new Grid(EXT_NAME.GRID, ['FORM', 'UL', 'OL', 'DL', 'DIV', 'TABLE', 'NAV', 'SECTION', 'ASIDE', 'MAIN', 'HEADER', 'FOOTER', 'P', 'ARTICLE', 'FIELDSET', 'SPAN']),
    [WIDGET_NAME.FAB]: new Button(WIDGET_NAME.FAB, ['BUTTON', 'INPUT', 'IMG']),
    [WIDGET_NAME.MENU]: new Menu(WIDGET_NAME.MENU, ['NAV']),
    [WIDGET_NAME.COORDINATOR]: new Coordinator(WIDGET_NAME.COORDINATOR),
    [WIDGET_NAME.TOOLBAR]: new Toolbar(WIDGET_NAME.TOOLBAR),
    [WIDGET_NAME.BOTTOM_NAVIGATION]: new BottomNavigation(WIDGET_NAME.BOTTOM_NAVIGATION),
    [WIDGET_NAME.DRAWER]: new Drawer(WIDGET_NAME.DRAWER)
};

const Node = View;
const NodeList = ViewList;
const Controller = new ViewController();
const File = new FileView();
const Resource = new ResourceView(File);

const main = new Application<T, U>(Node, NodeList);
main.registerController(Controller);
main.registerResource(Resource);

(() => {
    const load = new Set<IExtension>();
    for (let name of SETTINGS.builtInExtensions) {
        name = name.toLowerCase().trim();
        for (const extension in EXTENSIONS) {
            if (name === extension || extension.startsWith(`${name}.`)) {
                load.add(<IExtension> EXTENSIONS[extension]);
            }
        }
    }
    load.forEach(item => main.registerExtension(item));
})();

export function parseDocument(...elements: Null<string | HTMLElement>[]) {
    if (main.closed) {
        return;
    }
    LOADING = false;
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
    let __THEN: () => void;
    function parseResume() {
        LOADING = false;
        main.elements.forEach(element => {
            if (main.appName === '') {
                if (element.id === '') {
                    element.id = 'untitled';
                }
                main.appName = element.id;
            }
            else {
                if (element.id === '') {
                    element.id = `view_${main.size}`;
                }
            }
            const filename = optional(element, 'dataset.filename').trim().replace(/\.xml$/, '') || element.id;
            element.dataset.views = (optional(element, 'dataset.views', 'number') + 1).toString();
            element.dataset.viewName = convertWord((element.dataset.views !== '1' ? `${filename}_${element.dataset.views}` : filename));
            if (main.createNodeCache(element)) {
                main.createLayoutXml();
                main.setResources();
                main.setConstraints();
                ROOT_CACHE.add(element);
            }
        });
        if (typeof __THEN === 'function') {
            __THEN.call(main);
        }
    }
    const images: HTMLImageElement[] = Array.from(main.elements).map((element: HTMLElement) => <HTMLImageElement[]> Array.from(element.querySelectorAll('IMG'))).reduce((a, b) => a.concat(b), []).filter(element => !element.complete);
    if (images.length === 0) {
        parseResume();
    }
    else {
        LOADING = true;
        const queue = images.map(image => {
            return new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });
        });
        Promise.all(queue).then(() => parseResume());
    }
    return {
        then: (resolve: () => void) => {
            if (LOADING) {
                __THEN = resolve;
            }
            else {
                resolve();
            }
        }
    };
}

export function registerExtension(extension: IExtension) {
    if (extension instanceof Extension && extension.name !== '' && Array.isArray(extension.tagNames)) {
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

export function ext(name: any, options: {}) {
    if (typeof name === 'object') {
        registerExtension(name);
    }
    else if (options != null) {
        configureExtension(name, options);
    }
    else if (name !== '') {
        return getExtension(name);
    }
}

export function ready() {
    return (!LOADING && !main.closed);
}

export function close() {
    if (!LOADING && main.size > 0) {
        main.finalize();
    }
}

export function reset() {
    ROOT_CACHE.forEach(element => {
        delete element.dataset.views;
        delete element.dataset.viewName;
    });
    ROOT_CACHE.clear();
    main.reset();
}

export function saveAllToDisk() {
    if (!LOADING && main.size > 0) {
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

export function writeResourceDimenXml(saveToDisk = false) {
    autoClose();
    if (main.closed) {
        return main.resourceHandler.file.resourceDimenToXml(saveToDisk);
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

export function customize(build: number, widget: string, options: StringMap) {
    if (API_ANDROID[build] != null) {
        const customizations = API_ANDROID[build].customizations;
        if (customizations[widget] == null) {
            customizations[widget] = {};
        }
        Object.assign(customizations[widget], options);
    }
}

export function addXmlNs(name: string, uri: string) {
    main.addXmlNs(name, uri);
}

export function toString() {
    return main.toString();
}

function autoClose() {
    if (SETTINGS.autoCloseOnWrite && !LOADING && !main.closed) {
        main.finalize();
    }
}

export { BUILD_ANDROID as build, DENSITY_ANDROID as density, SETTINGS as settings, Extension };