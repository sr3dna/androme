import Application from './base/application';
import Widget from './android/widget';
import WidgetList from './android/widgetlist';
import { ResourceWidget, writeResourceArrayXml, writeResourceColorXml, writeResourceDrawableXml, writeResourceFontXml, writeResourceStringXml, writeResourceStyleXml } from './android/resource-widget';
import { hasValue, hyphenToCamelCase, replaceDP } from './lib/util';
import { convertRGB, getByColorName } from './lib/color';
import { setConstraints } from './android/constraint';
import { replaceViewsBeforeAfter, viewHandler } from './render';
import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';
import API_ANDROID from './android/customizations';
import SETTINGS from './settings';
import NODE_CACHE from './cache';

function setStyleMap() {
    for (const styleSheet of <any> Array.from(document.styleSheets)) {
        for (const rule of styleSheet.rules) {
            const elements = document.querySelectorAll(rule.selectorText);
            const attributes = new Set();
            for (const style of rule.styleMap) {
                attributes.add(hyphenToCamelCase(style[0]));
            }
            for (const element of Array.from(elements)) {
                for (const attr of element.style) {
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
                if (element.__styleMap != null) {
                    Object.assign(element.__styleMap, styleMap);
                }
                else {
                    element.__styleMap = styleMap;
                }
            }
        }
    }
}

export function parseDocument(element?: any) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    setStyleMap();
    const app = new Application<Widget, WidgetList<Widget>>(NODE_CACHE, viewHandler, new ResourceWidget(NODE_CACHE), Widget, WidgetList);
    app.setNodeCache(element);
    let output = app.getLayoutXml();
    output = replaceViewsBeforeAfter(output);
    app.setResources();
    if (SETTINGS.showAttributes) {
        app.setMarginPadding();
        if (SETTINGS.useLayoutWeight) {
            app.setLayoutWeight();
        }
        setConstraints();
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