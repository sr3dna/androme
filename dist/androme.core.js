/* androme 1.10.1
   https://github.com/anpham6/androme */

var androme = (function (exports) {
    'use strict';

    const [$util, $dom] = [lib.util, lib.dom];
    let main;
    let framework;
    exports.settings = {};
    exports.system = {};
    const cacheRoot = new Set();
    const cacheImage = new Map();
    function setStyleMap() {
        let warning = false;
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = document.styleSheets[i];
            if (styleSheet.cssRules) {
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    try {
                        const cssRule = styleSheet.cssRules[j];
                        const attrs = new Set();
                        for (const attr of Array.from(cssRule.style)) {
                            attrs.add($util.convertCamelCase(attr));
                        }
                        Array
                            .from(document.querySelectorAll(cssRule.selectorText))
                            .forEach((element) => {
                            for (const attr of Array.from(element.style)) {
                                attrs.add($util.convertCamelCase(attr));
                            }
                            const style = $dom.getStyle(element);
                            const styleMap = {};
                            for (const attr of attrs) {
                                const cssStyle = cssRule.style[attr];
                                if (element.style[attr]) {
                                    styleMap[attr] = element.style[attr];
                                }
                                else if (style[attr] === cssStyle) {
                                    styleMap[attr] = style[attr];
                                }
                                else if (cssStyle) {
                                    switch (attr) {
                                        case 'fontSize':
                                            styleMap[attr] = style[attr];
                                            break;
                                        case 'width':
                                        case 'height':
                                        case 'lineHeight':
                                        case 'verticalAlign':
                                        case 'columnGap':
                                        case 'top':
                                        case 'right':
                                        case 'bottom':
                                        case 'left':
                                        case 'marginTop':
                                        case 'marginRight':
                                        case 'marginBottom':
                                        case 'marginLeft':
                                        case 'paddingTop':
                                        case 'paddingRight':
                                        case 'paddingBottom':
                                        case 'paddingLeft':
                                            styleMap[attr] = /^[A-Za-z\-]+$/.test(cssStyle) || $util.isPercent(cssStyle) ? cssStyle
                                                : $util.convertPX(cssStyle, style.fontSize);
                                            break;
                                        default:
                                            if (styleMap[attr] == null) {
                                                styleMap[attr] = cssStyle;
                                            }
                                            break;
                                    }
                                }
                            }
                            if (main.settings.preloadImages &&
                                $util.hasValue(styleMap['backgroundImage']) &&
                                styleMap['backgroundImage'] !== 'initial') {
                                styleMap['backgroundImage']
                                    .split(',')
                                    .map(value => value.trim())
                                    .forEach(value => {
                                    const url = $dom.parseBackgroundUrl(value);
                                    if (url !== '' && !cacheImage.has(url)) {
                                        cacheImage.set(url, { width: 0, height: 0, url });
                                    }
                                });
                            }
                            const data = $dom.getElementCache(element, 'styleMap');
                            if (data) {
                                Object.assign(data, styleMap);
                            }
                            else {
                                $dom.setElementCache(element, 'style', style);
                                $dom.setElementCache(element, 'styleMap', styleMap);
                            }
                        });
                    }
                    catch (error) {
                        if (!warning) {
                            alert('External CSS files cannot be parsed when loading this program from your hard drive with Chrome 64+ (file://). ' +
                                'Either use a local web server (http://), embed your CSS files into a <style> tag, or use a different browser. ' +
                                'See the README for further instructions.\n\n' +
                                `${styleSheet.href}\n\n${error}`);
                            warning = true;
                        }
                    }
                }
            }
        }
    }
    function setImageCache(element) {
        if (element && $util.hasValue(element.src)) {
            cacheImage.set(element.src, {
                width: element.naturalWidth,
                height: element.naturalHeight,
                url: element.src
            });
        }
    }
    function setFramework(module, cached = false) {
        if (framework !== module) {
            const appBase = cached ? module.cached() : module.create();
            if (main || Object.keys(exports.settings).length === 0) {
                exports.settings = appBase.settings;
            }
            else {
                exports.settings = Object.assign(appBase.settings, exports.settings);
            }
            main = appBase.application ? appBase.application : new lib.base.Application(appBase.framework);
            main.settings = exports.settings;
            main.builtInExtensions = appBase.builtInExtensions;
            main.nodeObject = appBase.nodeObject;
            main.registerController(appBase.viewController);
            main.registerResource(appBase.resourceHandler);
            if (Array.isArray(exports.settings.builtInExtensions)) {
                const register = new Set();
                const extensions = main.builtInExtensions;
                for (let namespace of exports.settings.builtInExtensions) {
                    namespace = namespace.toLowerCase().trim();
                    if (extensions[namespace]) {
                        register.add(extensions[namespace]);
                    }
                    else {
                        for (const ext in extensions) {
                            if (ext.startsWith(`${namespace}.`)) {
                                register.add(extensions[ext]);
                            }
                        }
                    }
                }
                for (const ext of register) {
                    main.registerExtension(ext);
                }
            }
            framework = module;
            exports.system = module.system;
        }
        reset();
    }
    function parseDocument(...elements) {
        if (!main || main.closed) {
            return;
        }
        let __THEN;
        main.elements.clear();
        main.loading = false;
        setStyleMap();
        if (main.appName === '' && elements.length === 0) {
            elements.push(document.body);
        }
        for (let element of elements) {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }
            if (element instanceof HTMLElement) {
                main.elements.add(element);
            }
        }
        const rootElement = main.elements.values().next().value;
        function parseResume() {
            main.loading = false;
            if (main.settings.preloadImages && rootElement) {
                Array
                    .from(rootElement.getElementsByClassName('androme.preload'))
                    .forEach(element => rootElement.removeChild(element));
            }
            main.resourceHandler.imageDimensions = cacheImage;
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
                const filename = $util.trimNull(element.dataset.filename).replace(new RegExp(`\.${main.viewController.settingsInternal.layout.fileExtension}$`), '') || element.id;
                const iteration = $util.convertInt(element.dataset.iteration) + 1;
                element.dataset.iteration = iteration.toString();
                element.dataset.layoutName = $util.convertWord(iteration > 1 ? `${filename}_${iteration}` : filename);
                if (main.initCache(element)) {
                    main.createDocument();
                    main.setConstraints();
                    main.setResources();
                    cacheRoot.add(element);
                }
            }
            if (typeof __THEN === 'function') {
                __THEN.call(main);
            }
        }
        if (main.settings.preloadImages && rootElement) {
            for (const image of cacheImage.values()) {
                if (image.width === 0 && image.height === 0 && image.url) {
                    const imageElement = document.createElement('IMG');
                    imageElement.src = image.url;
                    if (imageElement.complete && imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
                        image.width = imageElement.naturalWidth;
                        image.height = imageElement.naturalHeight;
                    }
                    else {
                        imageElement.className = 'androme.preload';
                        imageElement.style.display = 'none';
                        rootElement.appendChild(imageElement);
                    }
                }
            }
        }
        const images = Array
            .from(main.elements)
            .map(element => {
            const queue = [];
            Array
                .from(element.querySelectorAll('IMG'))
                .forEach((image) => {
                if (image.complete) {
                    setImageCache(image);
                }
                else {
                    queue.push(image);
                }
            });
            return queue;
        })
            .reduce((a, b) => a.concat(b), []);
        if (images.length === 0) {
            parseResume();
        }
        else {
            main.loading = true;
            const queue = images.map(image => {
                return (new Promise((resolve, reject) => {
                    image.onload = resolve;
                    image.onerror = reject;
                }));
            });
            Promise
                .all(queue)
                .then((result) => {
                if (Array.isArray(result)) {
                    result.forEach(item => {
                        try {
                            setImageCache(item.srcElement);
                        }
                        catch (_a) {
                        }
                    });
                }
                parseResume();
            })
                .catch((error) => {
                const message = error.srcElement ? error.srcElement.src : '';
                if (!$util.hasValue(message) || confirm(`FAIL: ${message}`)) {
                    parseResume();
                }
            });
        }
        return {
            then: (resolve) => {
                if (main.loading) {
                    __THEN = resolve;
                }
                else {
                    resolve();
                }
            }
        };
    }
    function registerExtension(ext) {
        if (main && $util.isString(ext.name) && Array.isArray(ext.tagNames)) {
            main.registerExtension(ext);
        }
    }
    function configureExtension(name, options) {
        if (main) {
            const ext = main.getExtension(name);
            if (ext && typeof options === 'object') {
                Object.assign(ext.options, options);
            }
        }
    }
    function getExtension(name) {
        return main && main.getExtension(name);
    }
    function ext(name, options) {
        if (typeof name === 'object') {
            registerExtension(name);
        }
        else if ($util.isString(name)) {
            if (typeof options === 'object') {
                configureExtension(name, options);
            }
            else {
                return getExtension(name);
            }
        }
    }
    function ready() {
        return main && !main.loading && !main.closed;
    }
    function close() {
        if (main && !main.loading && main.size > 0) {
            main.finalize();
        }
    }
    function reset() {
        if (main) {
            for (const element of cacheRoot) {
                delete element.dataset.iteration;
                delete element.dataset.layoutName;
            }
            cacheRoot.clear();
            main.reset();
        }
    }
    function saveAllToDisk() {
        if (main && !main.loading && main.size > 0) {
            if (!main.closed) {
                main.finalize();
            }
            main.resourceHandler.file.saveAllToDisk(main.viewData);
        }
    }
    function toString() {
        return main ? main.toString() : '';
    }

    exports.setFramework = setFramework;
    exports.parseDocument = parseDocument;
    exports.registerExtension = registerExtension;
    exports.configureExtension = configureExtension;
    exports.getExtension = getExtension;
    exports.ext = ext;
    exports.ready = ready;
    exports.close = close;
    exports.reset = reset;
    exports.saveAllToDisk = saveAllToDisk;
    exports.toString = toString;
    exports.lib = lib;

    return exports;

}({}));
