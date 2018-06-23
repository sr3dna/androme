import Application from './base/application';
import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';
import Layout from './android/layout';
import View from './android/view';
import ViewList from './android/viewlist';
import ResourceView from './android/resource-view';
import FileRes from './android/fileres';
import API_ANDROID from './android/customizations';
import SETTINGS from './settings';

let MAIN;
const PARSED: Set<HTMLElement> = new Set();

export function parseDocument(...elements) {
    type T = View;
    type U = ViewList<T>;
    let main: Application<T, U>;
    if (MAIN == null) {
        const Node = View;
        const NodeList = ViewList;
        const Controller = new Layout();
        const File = new FileRes();
        const Resource = new ResourceView(File);
        main = new Application<T, U>(Node, NodeList);
        main.registerController(Controller);
        main.registerResource(Resource);
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
    if (main.appName === '' && elements.length === 0) {
        elements.push(document.body);
    }
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (!(element instanceof HTMLElement)) {
            continue;
        }
        if (main.appName === '') {
            if (element.id === '') {
                element.id = 'androme';
            }
            main.appName = element.id;
        }
        else {
            if (element.id === '') {
                element.id = `view${main.length}`;
            }
        }
        element.dataset.views = (element.dataset.views ? parseInt(element.dataset.views) + 1 : '1').toString();
        element.dataset.currentId = (element.dataset.views !== '1' ? `${element.id}_${element.dataset.views}` : element.id).replace(/-/g, '_');
        main.setNodeCache(element);
        main.setLayoutXml();
        main.setResources();
        if (SETTINGS.showAttributes) {
            main.setMarginPadding();
            if (SETTINGS.useLayoutWeight) {
                main.setLayoutWeight();
            }
            main.setConstraints();
            main.replaceInlineAttributes();
        }
        main.replaceAppended();
        PARSED.add(element);
    }
}

export function ready() {
    return (MAIN == null || !MAIN.closed);
}

export function close() {
    if (MAIN != null && MAIN.length > 0) {
        MAIN.finalize();
    }
}

export function reset() {
    if (MAIN != null) {
        PARSED.forEach((element: HTMLElement) => {
            delete element.dataset.views;
            delete element.dataset.currentId;
        });
        PARSED.clear();
        MAIN.reset();
    }
}

export function saveAllToDisk() {
    if (MAIN && MAIN.length > 0) {
        if (!MAIN.closed) {
            MAIN.finalize();
        }
        MAIN.resourceHandler.file.saveAllToDisk(MAIN.viewData);
    }
}

export function writeLayoutAllXml(saveToDisk = false) {
    if (MAIN != null) {
        autoClose();
        if (MAIN.closed) {
            return MAIN.resourceHandler.file.layoutAllToXml(MAIN.viewData, saveToDisk);
        }
    }
    return '';
}

export function writeResourceAllXml(saveToDisk = false) {
    if (MAIN != null) {
        autoClose();
        if (MAIN.closed) {
            return MAIN.resourceHandler.file.resourceAllToXml(saveToDisk);
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
    if (MAIN != null) {
        autoClose();
        if (MAIN.closed) {
            return MAIN.resourceHandler.file.resourceStringArrayToXml(saveToDisk);
        }
    }
    return '';
}

export function writeResourceFontXml(saveToDisk = false) {
    if (MAIN != null) {
        autoClose();
        if (MAIN.closed) {
            return MAIN.resourceHandler.file.resourceFontToXml(saveToDisk);
        }
    }
    return '';
}

export function writeResourceColorXml(saveToDisk = false) {
    if (MAIN && MAIN.closed) {
        return MAIN.resourceHandler.file.resourceColorToXml(saveToDisk);
    }
    return '';
}

export function writeResourceStyleXml(saveToDisk = false) {
    if (MAIN != null) {
        autoClose();
        if (MAIN.closed) {
            return MAIN.resourceHandler.file.resourceStyleToXml(saveToDisk);
        }
    }
    return '';
}

export function writeResourceDrawableXml(saveToDisk = false) {
    if (MAIN != null) {
        autoClose();
        if (MAIN.closed) {
            return MAIN.resourceHandler.file.resourceDrawableToXml(saveToDisk);
        }
    }
    return '';
}

export function toString() {
    return (MAIN != null ? MAIN.toString() : '');
}

function autoClose() {
    if (SETTINGS.autoCloseOnWrite && MAIN && !MAIN.closed) {
        MAIN.finalize();
    }
}

export { API_ANDROID as api, BUILD_ANDROID as build, DENSITY_ANDROID as density, SETTINGS as settings };