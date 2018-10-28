import Node from './base/node';
import NodeList from './base/nodelist';
import NodeGroup from './base/nodegroup';
import Application from './base/application';
import Controller from './base/controller';
import Resource from './base/resource';
import File from './base/file';
import Extension from './base/extension';

import Accessibility from './extension/accessibility';
import Button from './extension/button';
import Custom from './extension/custom';
import External from './extension/external';
import Grid from './extension/grid';
import List from './extension/list';
import Nav from './extension/nav';
import Origin from './extension/origin';
import Sprite from './extension/sprite';
import Table from './extension/table';

import * as enumeration from './lib/enumeration';
import * as constant from './lib/constant';
import * as util from './lib/util';
import * as dom from './lib/dom';
import * as xml from './lib/xml';
import * as color from './lib/color';

type T = Node;

let main: androme.lib.base.Application<T>;
let framework: AppFramework<T>;
let settings: Settings = {} as any;
let system: FunctionMap<any> = {} as any;

const extensionsAsync = new Set<Extension<T>>();
const optionsAsync = new Map<string, {}>();

export function setFramework(module: AppFramework<T>, cached = false) {
    if (framework !== module) {
        const appBase: AppBase<T> = cached ? module.cached() : module.create();
        if (main || Object.keys(settings).length === 0) {
            settings = appBase.settings;
        }
        else {
            settings = Object.assign(appBase.settings, settings);
        }
        main = appBase.application;
        main.settings = settings;
        if (Array.isArray(settings.builtInExtensions)) {
            const register = new Set<androme.lib.base.Extension<T>>();
            for (let namespace of settings.builtInExtensions) {
                namespace = namespace.trim();
                if (main.builtInExtensions[namespace]) {
                    register.add(main.builtInExtensions[namespace]);
                }
                else {
                    for (const ext in main.builtInExtensions) {
                        if (ext.startsWith(`${namespace}.`)) {
                            register.add(main.builtInExtensions[ext]);
                        }
                    }
                }
            }
            register.forEach(item => main.registerExtension(item));
        }
        framework = module;
        system = module.system;
    }
    reset();
}

export function parseDocument(...elements: Null<string | Element>[]): FunctionMap<void> {
    if (main && !main.closed) {
        if (settings.handleExtensionsAsync) {
            extensionsAsync.forEach(item => main.registerExtension(item));
            for (const [name, options] of optionsAsync.entries()) {
                configureExtension(name, options);
            }
            extensionsAsync.clear();
            optionsAsync.clear();
        }
        return main.parseDocument(...elements);
    }
    return {
        then: (callback: () => void) => {
            if (!main) {
                alert('ERROR: Framework not installed.');
            }
            else if (main.closed) {
                if (confirm('ERROR: Document is closed. Reset and rerun?')) {
                    main.reset();
                    parseDocument.apply(null, arguments).then(callback);
                }
            }
        }
    };
}

export function registerExtension(ext: Extension<T>) {
    if (main && ext instanceof Extension) {
        return main.registerExtension(ext);
    }
    return false;
}

export function registerExtensionAsync(ext: Extension<T>) {
    if (registerExtension(ext)) {
        return true;
    }
    else if (ext instanceof Extension) {
        extensionsAsync.add(ext);
        if (settings.handleExtensionsAsync) {
            return true;
        }
    }
    return false;
}

export function configureExtension(module: Extension<T> | string, options: {}) {
    if (typeof options === 'object') {
        if (module instanceof Extension) {
            Object.assign(module.options, options);
            return true;
        }
        else if (util.isString(module)) {
            if (main) {
                const ext = main.getExtension(module) || Array.from(extensionsAsync).find(item => item.name === module);
                if (ext) {
                    Object.assign(ext.options, options);
                    return true;
                }
                else {
                    optionsAsync.set(module, options);
                    if (settings.handleExtensionsAsync) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

export function getExtension(name: string) {
    return main && main.getExtension(name);
}

export function ext(module: Extension<T> | string, options?: {}) {
    if (module instanceof Extension) {
        return registerExtension(module);
    }
    else if (util.isString(module)) {
        if (typeof options === 'object') {
            return configureExtension(module, options);
        }
        else {
            return getExtension(module);
        }
    }
}

export function ready() {
    return main && !main.loading && !main.closed;
}

export function close() {
    if (main && !main.loading && main.size > 0) {
        main.finalize();
    }
}

export function reset() {
    if (main) {
        main.reset();
    }
}

export function saveAllToDisk() {
    if (main && !main.loading && main.size > 0) {
        if (!main.closed) {
            main.finalize();
        }
        main.saveAllToDisk();
    }
}

export function toString() {
    return main ? main.toString() : '';
}

const lib = {
    base: {
        Node,
        NodeList,
        NodeGroup,
        Application,
        Controller,
        Resource,
        File,
        Extension,
        extensions: {
            Accessibility,
            Button,
            Custom,
            External,
            Grid,
            List,
            Nav,
            Origin,
            Sprite,
            Table
        }
    },
    enumeration,
    constant,
    util,
    dom,
    xml,
    color
};

export { lib, system, settings };