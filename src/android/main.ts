import { SettingsAndroid } from './types/local';

import { XMLNS_ANDROID } from './lib/constant';
import SETTINGS from './settings';
import API_ANDROID from './customizations';

import View from './view';
import ViewController from './viewcontroller';
import ResourceHandler from './resourcehandler';
import FileHandler from './filehandler';

import External from './extension/external';
import Origin from './extension/origin';
import Custom from './extension/custom';
import Accessibility from './extension/accessibility';
import List from './extension/list';
import Grid from './extension/grid';
import Table from './extension/table';

import * as enumeration from './lib/enumeration';
import * as constant from './lib/constant';
import * as util from './lib/util';

const lib = {
    base: {
        View,
        Resource: ResourceHandler
    },
    enumeration,
    constant,
    util
};

function autoClose() {
    const main = viewController.application;
    if (main.settings.autoCloseOnWrite && !main.loading && !main.closed) {
        main.finalize();
        return true;
    }
    return false;
}

type T = View;

let initialized = false;

let application: androme.lib.base.Application<T>;
let viewController: ViewController<T>;
let resourceHandler: ResourceHandler<T>;

let settings: SettingsAndroid;
const framework: number = androme.lib.enumeration.APP_FRAMEWORK.ANDROID;

const appBase: AppFramework<T> = {
    lib,
    system: {
        customize(build: number, widget: string, options: {}) {
            if (API_ANDROID[build]) {
                const customizations = API_ANDROID[build].customizations;
                if (customizations[widget] == null) {
                    customizations[widget] = {};
                }
                Object.assign(customizations[widget], options);
            }
        },
        addXmlNs(name: string, uri: string) {
            XMLNS_ANDROID[name] = uri;
        },
        writeLayoutAllXml(saveToDisk = false) {
            if (initialized) {
                const main = viewController.application;
                if (main.closed || autoClose()) {
                    return resourceHandler.file.layoutAllToXml(main.viewData, saveToDisk);
                }
            }
            return '';
        },
        writeResourceAllXml(saveToDisk = false) {
            if (initialized) {
                const main = viewController.application;
                if (main.closed || autoClose()) {
                    return resourceHandler.file.resourceAllToXml(saveToDisk);
                }
            }
            return '';
        },
        writeResourceStringXml(saveToDisk = false) {
            if (initialized) {
                const main = viewController.application;
                if (main.closed || autoClose()) {
                    return resourceHandler.file.resourceStringToXml(saveToDisk);
                }
            }
            return '';
        },
        writeResourceArrayXml(saveToDisk = false) {
            if (initialized) {
                const main = viewController.application;
                if (main.closed || autoClose()) {
                    return resourceHandler.file.resourceStringArrayToXml(saveToDisk);
                }
            }
            return '';
        },
        writeResourceFontXml(saveToDisk = false) {
            if (initialized) {
                const main = viewController.application;
                if (main.closed || autoClose()) {
                    return resourceHandler.file.resourceFontToXml(saveToDisk);
                }
            }
            return '';
        },
        writeResourceColorXml(saveToDisk = false) {
            if (initialized) {
                const main = viewController.application;
                if (main.closed || autoClose()) {
                    return resourceHandler.file.resourceColorToXml(saveToDisk);
                }
            }
            return '';
        },
        writeResourceStyleXml(saveToDisk = false) {
            if (initialized) {
                const main = viewController.application;
                if (main.closed || autoClose()) {
                    return resourceHandler.file.resourceStyleToXml(saveToDisk);
                }
            }
            return '';
        },
        writeResourceDimenXml(saveToDisk = false) {
            if (initialized) {
                const main = viewController.application;
                if (main.closed || autoClose()) {
                    return resourceHandler.file.resourceDimenToXml(saveToDisk);
                }
            }
            return '';
        },
        writeResourceDrawableXml(saveToDisk = false) {
            if (initialized) {
                const main = viewController.application;
                if (main.closed || autoClose()) {
                    return resourceHandler.file.resourceDrawableToXml(saveToDisk);
                }
            }
            return '';
        }
    },
    create() {
        const EXT_NAME = androme.lib.constant.EXT_NAME;
        settings = Object.assign({}, SETTINGS);
        const fileHandler = new FileHandler<T>(settings);
        application = new androme.lib.base.Application(framework);
        viewController = new ViewController<T>();
        resourceHandler = new ResourceHandler<T>(fileHandler);
        application.registerController(viewController);
        application.registerResource(resourceHandler);
        application.nodeObject = View;
        application.builtInExtensions = {
            [EXT_NAME.EXTERNAL]: new External(EXT_NAME.EXTERNAL, framework),
            [EXT_NAME.ORIGIN]: new Origin(EXT_NAME.ORIGIN, framework),
            [EXT_NAME.CUSTOM]: new Custom(EXT_NAME.CUSTOM, framework),
            [EXT_NAME.ACCESSIBILITY]: new Accessibility(EXT_NAME.ACCESSIBILITY, framework),
            [EXT_NAME.LIST]: new List(EXT_NAME.LIST, framework, ['UL', 'OL', 'DL', 'DIV']),
            [EXT_NAME.TABLE]: new Table(EXT_NAME.TABLE, framework, ['TABLE']),
            [EXT_NAME.GRID]: new Grid(EXT_NAME.GRID, framework, ['FORM', 'UL', 'OL', 'DL', 'DIV', 'TABLE', 'NAV', 'SECTION', 'ASIDE', 'MAIN', 'HEADER', 'FOOTER', 'P', 'ARTICLE', 'FIELDSET', 'SPAN'])
        };
        initialized = true;
        return {
            application,
            framework,
            settings
        };
    },
    cached() {
        if (initialized) {
            return {
                application,
                framework,
                settings
            };
        }
        return appBase.create();
    }
};

export default appBase;