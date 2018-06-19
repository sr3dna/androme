import Application from './base/application';
import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';
import Layout from './android/layout';
import Widget from './android/widget';
import WidgetList from './android/widgetlist';
import ResourceWidget from './android/resource-widget';
import FileRes from './android/fileres';
import API_ANDROID from './android/customizations';
import SETTINGS from './settings';

type T = Widget;
type U = WidgetList<Widget>;

let app: Application<T, U>;

export function parseDocument(element?: any) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    let output = '';
    app = new Application(Widget, WidgetList);
    app.registerView(new Layout());
    app.registerResource(new ResourceWidget(new FileRes(element.id)));
    app.setStyleMap();
    app.setNodeCache(element);
    output = app.getLayoutXml();
    app.setResources();
    output = app.replaceAppended(output);
    if (SETTINGS.showAttributes) {
        app.setMarginPadding();
        if (SETTINGS.useLayoutWeight) {
            app.setLayoutWeight();
        }
        app.setConstraints();
        output = app.replaceInlineAttributes(output);
    }
    output = app.cleanAttributes(output);
    return output;
}

export function writeLayoutMainXml(saveToDisk = false) {
    if (app != null) {
        if (saveToDisk) {
            app.resourceHandler.file.layoutMainToDisk(app.toString());
        }
        return app.toString();
    }
    return '';
}

export function writeResourceAllXml(saveToDisk = false, layoutMain = false) {
    if (app != null) {
        return app.resourceHandler.file.resourceAllToXml(saveToDisk, (layoutMain ? app.toString() : ''));
    }
    return '';
}

export function writeResourceStringXml(saveToDisk = false) {
    if (app != null) {
        return app.resourceHandler.file.resourceStringToXml(saveToDisk);
    }
    return '';
}

export function writeResourceArrayXml(saveToDisk = false) {
    if (app != null) {
        return app.resourceHandler.file.resourceStringArrayToXml(saveToDisk);
    }
    return '';
}

export function writeResourceFontXml(saveToDisk = false) {
    if (app != null) {
        return app.resourceHandler.file.resourceFontToXml(saveToDisk);
    }
    return '';
}

export function writeResourceColorXml(saveToDisk = false) {
    if (app != null) {
        return app.resourceHandler.file.resourceColorToXml(saveToDisk);
    }
    return '';
}

export function writeResourceStyleXml(saveToDisk = false) {
    if (app != null) {
        return app.resourceHandler.file.resourceStyleToXml(saveToDisk);
    }
    return '';
}

export function writeResourceDrawableXml(saveToDisk = false) {
    if (app != null) {
        return app.resourceHandler.file.resourceDrawableToXml(saveToDisk);
    }
    return '';
}

export { API_ANDROID as api, BUILD_ANDROID as build, DENSITY_ANDROID as density, SETTINGS as settings };