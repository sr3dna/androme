import Application from './base/application';
import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';
import View from './android/view';
import Widget from './android/widget';
import WidgetList from './android/widgetlist';
import { ResourceWidget, writeResourceArrayXml, writeResourceColorXml, writeResourceDrawableXml, writeResourceFontXml, writeResourceStringXml, writeResourceStyleXml } from './android/resource-widget';
import API_ANDROID from './android/customizations';
import { hasValue, hyphenToCamelCase, replaceDP } from './lib/util';
import { convertRGB, getByColorName } from './lib/color';
import SETTINGS from './settings';

function setStyleMap() {
    for (const styleSheet of <any> Array.from(document.styleSheets)) {
        for (const rule of styleSheet.rules) {
            const elements = document.querySelectorAll(rule.selectorText);
            const attributes: Set<string> = new Set();
            for (const style of rule.styleMap) {
                attributes.add(hyphenToCamelCase(style[0]));
            }
            Array.from(elements).forEach((element: HTMLElement) => {
                for (const attr of Array.from(element.style)) {
                    attributes.add(hyphenToCamelCase(attr));
                }
                const style = getComputedStyle(element);
                const styleMap = {};
                for (const name of attributes) {
                    if (name.toLowerCase().indexOf('color') !== -1) {
                        const color = getByColorName(rule.style[name]);
                        if (color != null) {
                            rule.style[name] = convertRGB(color);
                        }
                    }
                    if (hasValue(element.style[name])) {
                        styleMap[name] = element.style[name];
                    }
                    else if (style[name] === rule.style[name]) {
                        styleMap[name] = style[name];
                    }
                }
                const object = (<any> element);
                if (object.__styleMap != null) {
                    Object.assign(object.__styleMap, styleMap);
                }
                else {
                    object.__style = style;
                    object.__styleMap = styleMap;
                }
            });
        }
    }
}

export function parseDocument(element?: any) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    setStyleMap();
    let output = '';
    const app = new Application<Widget, WidgetList<Widget>>(Widget, WidgetList, new View(), new ResourceWidget());
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
    output = output.replace(/{[<@>]{1}[0-9]+}/g, '');
    if (SETTINGS.useUnitDP) {
        output = replaceDP(output, SETTINGS.density);
    }
    return output;
}

export { API_ANDROID as api, BUILD_ANDROID as build, DENSITY_ANDROID as density, SETTINGS as settings };
export { writeResourceArrayXml, writeResourceColorXml, writeResourceDrawableXml, writeResourceFontXml, writeResourceStringXml, writeResourceStyleXml };