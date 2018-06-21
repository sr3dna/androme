import Application from './base/application';
import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';
import Layout from './android/layout';
import Widget from './android/widget';
import WidgetList from './android/widgetlist';
import ResourceWidget from './android/resource-widget';
import FileRes from './android/fileres';
import API_ANDROID from './android/customizations';
import SETTINGS from './settings';

let APP;

export function parseDocument(...elements) {
    type T = Widget;
    type U = WidgetList<T>;
    let app: Application<T, U>;
    if (APP == null) {
        const Node = Widget;
        const NodeList = WidgetList;
        const View = new Layout();
        const File = new FileRes();
        const Resource = new ResourceWidget(File);
        app = new Application(Node, NodeList);
        app.registerView(View);
        app.registerResource(Resource);
        APP = app;
    }
    else {
        app = (<Application<T, U>> APP);
        app.resetView();
    }
    if (app.ready) {
        return false;
    }
    app.setStyleMap();
    if (app.name === '' && elements.length === 0) {
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
        if (app.name === '') {
            if (element.id === '') {
                element.id = 'androme';
            }
            app.name = element.id;
        }
        else {
            if (element.id === '') {
                element.id = `view${app.length}`;
            }
        }
        element.dataset.views = (element.dataset.views ? parseInt(element.dataset.views) + 1 : '1').toString();
        element.dataset.currentId = (element.dataset.views !== '1' ? `${element.id}-${element.dataset.views}` : element.id);
        app.setNodeCache(element);
        app.setLayoutXml();
        app.setResources();
        if (SETTINGS.showAttributes) {
            app.setMarginPadding();
            if (SETTINGS.useLayoutWeight) {
                app.setLayoutWeight();
            }
            app.setConstraints();
            app.replaceInlineAttributes();
        }
        app.replaceAppended();
    }
}

export function toString() {
    if (APP && APP.ready) {
        return APP.toString();
    }
}

export function close() {
    if (APP != null) {
        APP.finalize();
    }
}

export function reset() {
    if (APP != null) {
        APP.reset();
    }
}

export function saveAllToDisk() {
    if (APP && APP.ready) {
        APP.resourceHandler.file.saveAllToDisk(APP.viewData);
    }
}

export function writeLayoutAllXml(saveToDisk = false) {
    if (APP && APP.ready) {
        return APP.resourceHandler.file.layoutAllToXml(APP.viewData, saveToDisk);
    }
    return '';
}

export function writeResourceAllXml(saveToDisk = false) {
    if (APP && APP.ready) {
        return APP.resourceHandler.file.resourceAllToXml(saveToDisk);
    }
    return '';
}

export function writeResourceStringXml(saveToDisk = false) {
    if (APP && APP.ready) {
        return APP.resourceHandler.file.resourceStringToXml(saveToDisk);
    }
    return '';
}

export function writeResourceArrayXml(saveToDisk = false) {
    if (APP && APP.ready) {
        return APP.resourceHandler.file.resourceStringArrayToXml(saveToDisk);
    }
    return '';
}

export function writeResourceFontXml(saveToDisk = false) {
    if (APP && APP.ready) {
        return APP.resourceHandler.file.resourceFontToXml(saveToDisk);
    }
    return '';
}

export function writeResourceColorXml(saveToDisk = false) {
    if (APP && APP.ready) {
        return APP.resourceHandler.file.resourceColorToXml(saveToDisk);
    }
    return '';
}

export function writeResourceStyleXml(saveToDisk = false) {
    if (APP && APP.ready) {
        return APP.resourceHandler.file.resourceStyleToXml(saveToDisk);
    }
    return '';
}

export function writeResourceDrawableXml(saveToDisk = false) {
    if (APP && APP.ready) {
        return APP.resourceHandler.file.resourceDrawableToXml(saveToDisk);
    }
    return '';
}

export { API_ANDROID as api, BUILD_ANDROID as build, DENSITY_ANDROID as density, SETTINGS as settings };