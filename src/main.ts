import { Image, Null, ObjectMap } from './lib/types';
import Application from './base/application';
import Extension from './base/extension';
import { convertCamelCase, convertPX, convertWord, hasValue, isPercent, optional  } from './lib/util';
import { getElementCache, getStyle, parseBackgroundUrl, setElementCache } from './lib/dom';
import { convertRGB, getByColorName } from './lib/color';
import { EXT_NAME } from './extension/lib/constants';
import SETTINGS from './settings';

import ViewController from './android/viewcontroller';
import ResourceView from './android/resource-view';
import FileView from './android/file-view';
import View from './android/view';
import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';
import API_ANDROID from './android/customizations';

import External from './extension/external';

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

let LOADING = false;
const ROOT_CACHE: Set<HTMLElement> = new Set();
const IMAGE_CACHE: Map<string, Image> = new Map();
const EXTENSIONS: ObjectMap<Extension<T>> = {
    [EXT_NAME.EXTERNAL]: new External(EXT_NAME.EXTERNAL),
    [EXT_NAME.CUSTOM]: new Custom(EXT_NAME.CUSTOM),
    [EXT_NAME.LIST]: new List(EXT_NAME.LIST, ['UL', 'OL', 'DL', 'DIV']),
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
const Controller = new ViewController();
const File = new FileView();
const Resource = new ResourceView(File);

const main = new Application<T>(Node);
main.registerController(Controller);
main.registerResource(Resource);

(() => {
    const extension = new Set<Extension<T>>();
    for (let name of SETTINGS.builtInExtensions) {
        name = name.toLowerCase().trim();
        for (const ext in EXTENSIONS) {
            if (ext === name || ext.startsWith(`${name}.`)) {
                extension.add(EXTENSIONS[ext]);
            }
        }
    }
    for (const ext of extension) {
        main.registerExtension(ext);
    }
})();

function setStyleMap() {
    let warning = false;
    for (let i = 0; i < document.styleSheets.length; i++) {
        const styleSheet = <CSSStyleSheet> document.styleSheets[i];
        if (styleSheet.cssRules) {
            for (let j = 0; j < styleSheet.cssRules.length; j++) {
                try {
                    const cssRule = <CSSStyleRule> styleSheet.cssRules[j];
                    const attrs: Set<string> = new Set();
                    for (const attr of Array.from(cssRule.style)) {
                        attrs.add(convertCamelCase(attr));
                    }
                    const elements = document.querySelectorAll(cssRule.selectorText);
                    Array.from(elements).forEach((element: HTMLElement) => {
                        for (const attr of Array.from(element.style)) {
                            attrs.add(convertCamelCase(attr));
                        }
                        const style = getStyle(element);
                        const styleMap = {};
                        for (const attr of attrs) {
                            if (attr.toLowerCase().indexOf('color') !== -1) {
                                const color = getByColorName(cssRule.style[attr]);
                                if (color !== '') {
                                    cssRule.style[attr] = convertRGB(color);
                                }
                            }
                            const cssStyle = cssRule.style[attr];
                            if (element.style[attr]) {
                                styleMap[attr] = element.style[attr];
                            }
                            else if (style[attr] === cssStyle) {
                                styleMap[attr] = style[attr];
                            }
                            else if (cssStyle) {
                                switch (attr) {
                                    case 'width':
                                    case 'height':
                                    case 'lineHeight':
                                    case 'verticalAlign':
                                    case 'fontSize':
                                    case 'marginTop':
                                    case 'marginRight':
                                    case 'marginBottom':
                                    case 'marginLeft':
                                    case 'paddingTop':
                                    case 'paddingRight':
                                    case 'paddingBottom':
                                    case 'paddingLeft':
                                        styleMap[attr] = (/^[A-Za-z\-]+$/.test(<string> cssStyle) || isPercent(cssStyle) ? cssStyle : convertPX(cssStyle));
                                        break;
                                    default:
                                        if (styleMap[attr] == null) {
                                            styleMap[attr] = cssStyle;
                                        }
                                        break;
                                }
                            }
                        }
                        if (SETTINGS.preloadImages && styleMap['backgroundImage'] != null && styleMap['backgroundImage'] !== 'initial') {
                            styleMap['backgroundImage'].split(',').map(value => value.trim()).forEach(value => {
                                const url = parseBackgroundUrl(value);
                                if (url !== '' && !IMAGE_CACHE.has(url)) {
                                    IMAGE_CACHE.set(url, { width: 0, height: 0, url });
                                }
                            });
                        }
                        const data = getElementCache(element, 'styleMap');
                        if (data) {
                            Object.assign(data, styleMap);
                        }
                        else {
                            setElementCache(element, 'style', style);
                            setElementCache(element, 'styleMap', styleMap);
                        }
                    });
                }
                catch (error) {
                    if (!warning) {
                        alert('External CSS files cannot be parsed when loading this program from your hard drive with Chrome 64+ (file://). Either use a local web ' +
                              'server (http://), embed your CSS files into a <style> tag, or use a different browser. See the README for further instructions.\n\n' +
                              `${styleSheet.href}\n\n${error}`);
                        warning = true;
                    }
                }
            }
        }
    }
}

function setImageCache(element: HTMLImageElement) {
    if (!IMAGE_CACHE.has(element.src)) {
        IMAGE_CACHE.set(element.src, {
            width: element.naturalWidth,
            height: element.naturalHeight,
            url: element.src
        });
    }
}

export function parseDocument(...elements: Null<string | HTMLElement>[]) {
    if (main.closed) {
        return;
    }
    LOADING = false;
    setStyleMap();
    main.elements.clear();
    if (main.appName === '' && elements.length === 0) {
        elements.push(document.body);
    }
    let rootElement: Null<HTMLElement> = null;
    for (let element of elements) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element instanceof HTMLElement) {
            if (rootElement == null) {
                rootElement = element;
            }
            main.elements.add(element);
        }
    }
    let __THEN: () => void;
    function parseResume() {
        LOADING = false;
        if (SETTINGS.preloadImages && rootElement != null) {
            Array.from(rootElement.getElementsByClassName('androme.preload')).forEach(element => rootElement && rootElement.removeChild(element));
        }
        main.resourceHandler.imageDimensions = IMAGE_CACHE;
        for (const element of main.elements) {
            if (main.appName === '') {
                if (element.id === '') {
                    element.id = 'untitled';
                }
                main.appName = element.id;
            }
            else {
                if (element.id === '') {
                    element.id = `content_${main.size}`;
                }
            }
            const filename = (optional(element, 'dataset.filename') as string).trim().replace(/\.xml$/, '') || element.id;
            element.dataset.views = ((optional(element, 'dataset.views', 'number') as number) + 1).toString();
            element.dataset.viewName = convertWord(element.dataset.views !== '1' ? `${filename}_${element.dataset.views}` : filename);
            if (main.createNodeCache(element)) {
                main.createLayoutXml();
                main.setConstraints();
                main.setResources();
                ROOT_CACHE.add(element);
            }
        }
        if (typeof __THEN === 'function') {
            __THEN.call(main);
        }
    }
    if (SETTINGS.preloadImages && rootElement != null) {
        for (const image of IMAGE_CACHE.values()) {
            if (image.width === 0 && image.height === 0) {
                const imageElement = <HTMLImageElement> document.createElement('IMG');
                imageElement.src = image.url;
                if (imageElement.complete && imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
                    image.width = imageElement.naturalWidth;
                    image.height = imageElement.naturalHeight;
                }
                else {
                    imageElement.style.display = 'none';
                    imageElement.className = 'androme.preload';
                    rootElement.appendChild(imageElement);
                }
            }
        }
    }
    const images: HTMLImageElement[] =
        Array.from(main.elements).map(element => {
            const queue: HTMLImageElement[] = [];
            Array.from(element.querySelectorAll('IMG')).forEach((image: HTMLImageElement) => {
                if (image.complete) {
                    setImageCache(image);
                }
                else {
                    queue.push(image);
                }
            });
            return queue;
        }).reduce((a, b) => a.concat(b), []);
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
        Promise
            .all(queue)
            .then(result => {
                result.forEach((image: HTMLImageElement) => setImageCache(image));
                parseResume();
            })
            .catch((err: Event) => {
                const message = (err.srcElement != null ? (<HTMLImageElement> err.srcElement).src : '');
                if (!hasValue(message) || confirm(`FAIL: ${message}`)) {
                    parseResume();
                }
            });
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

export function registerExtension(ext: Extension<T>) {
    if (ext instanceof Extension && ext.name !== '' && Array.isArray(ext.tagNames)) {
        main.registerExtension(ext);
    }
}

export function configureExtension(name: string, options: {}) {
    if (options != null) {
        const ext = main.getExtension(name);
        if (ext != null) {
            Object.assign(ext.options, options);
        }
    }
}

export function getExtension(name: string) {
    return main.getExtension(name);
}

export function ext(name: any, options?: {}) {
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
    for (const element of ROOT_CACHE) {
        delete element.dataset.views;
        delete element.dataset.viewName;
    }
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
    if (main.closed || autoClose()) {
        return main.resourceHandler.file.layoutAllToXml(main.viewData, saveToDisk);
    }
    return '';
}

export function writeResourceAllXml(saveToDisk = false) {
    if (main.closed || autoClose()) {
        return main.resourceHandler.file.resourceAllToXml(saveToDisk);
    }
    return '';
}

export function writeResourceStringXml(saveToDisk = false) {
    if (main.closed || autoClose()) {
        return main.resourceHandler.file.resourceStringToXml(saveToDisk);
    }
    return '';
}

export function writeResourceArrayXml(saveToDisk = false) {
    if (main.closed || autoClose()) {
        return main.resourceHandler.file.resourceStringArrayToXml(saveToDisk);
    }
    return '';
}

export function writeResourceFontXml(saveToDisk = false) {
    if (main.closed || autoClose()) {
        return main.resourceHandler.file.resourceFontToXml(saveToDisk);
    }
    return '';
}

export function writeResourceColorXml(saveToDisk = false) {
    if (main.closed || autoClose()) {
        return main.resourceHandler.file.resourceColorToXml(saveToDisk);
    }
    return '';
}

export function writeResourceStyleXml(saveToDisk = false) {
    if (main.closed || autoClose()) {
        return main.resourceHandler.file.resourceStyleToXml(saveToDisk);
    }
    return '';
}

export function writeResourceDimenXml(saveToDisk = false) {
    if (main.closed || autoClose()) {
        return main.resourceHandler.file.resourceDimenToXml(saveToDisk);
    }
    return '';
}

export function writeResourceDrawableXml(saveToDisk = false) {
    if (main.closed || autoClose()) {
        return main.resourceHandler.file.resourceDrawableToXml(saveToDisk);
    }
    return '';
}

export function customize(build: number, widget: string, options: {}) {
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
        return true;
    }
    return false;
}

export { BUILD_ANDROID as build, DENSITY_ANDROID as density, SETTINGS as settings, Extension };