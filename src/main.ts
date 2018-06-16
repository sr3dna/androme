import Application from './base/application';
import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';
import Layout from './android/layout';
import Widget from './android/widget';
import WidgetList from './android/widgetlist';
import { ResourceWidget, writeResourceArrayXml, writeResourceColorXml, writeResourceDrawableXml, writeResourceFontXml, writeResourceStringXml, writeResourceStyleXml } from './android/resource-widget';
import API_ANDROID from './android/customizations';
import SETTINGS from './settings';

export function parseDocument(element?: any) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    let output = '';
    const app = new Application<Widget, WidgetList<Widget>>(Widget, WidgetList);
    app.registerView(new Layout());
    app.registerResource(new ResourceWidget());
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

export { API_ANDROID as api, BUILD_ANDROID as build, DENSITY_ANDROID as density, SETTINGS as settings };
export { writeResourceArrayXml, writeResourceColorXml, writeResourceDrawableXml, writeResourceFontXml, writeResourceStringXml, writeResourceStyleXml };