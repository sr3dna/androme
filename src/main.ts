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
            const extensions = main.builtInExtensions;
            for (let namespace of settings.builtInExtensions) {
                namespace = namespace.trim();
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
        system = module.system;
    }
    reset();
}

export function parseDocument(...elements: Null<string | Element>[]): FunctionMap<void> {
    if (main && !main.closed) {
        return main.parseDocument(...elements);
    }
    return { then: (...args: any[]) => {} };
}

export function registerExtension(ext: Extension<T>) {
    if (main && ext instanceof Extension && util.isString(ext.name) && Array.isArray(ext.tagNames)) {
        main.registerExtension(ext);
    }
}

export function configureExtension(name: string, options: {}) {
    if (main) {
        const ext = main.getExtension(name);
        if (ext && typeof options === 'object') {
            Object.assign(ext.options, options);
        }
    }
}

export function getExtension(name: string) {
    return main && main.getExtension(name);
}

export function ext(name: any, options?: {}) {
    if (typeof name === 'object') {
        registerExtension(name);
    }
    else if (util.isString(name)) {
        if (typeof options === 'object') {
            configureExtension(name, options);
        }
        else {
            return getExtension(name);
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