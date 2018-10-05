
import { AppFramework } from '../base/lib/types';
import { ObjectMap } from '../lib/types';
import { IExtension } from '../extension/lib/types';
import { SettingsAndroid } from './lib/types';
import View from './view';
import ViewController from './viewcontroller';
import ResourceHandler from './resourcehandler';
import FileHandler from './filehandler';
import Settings from './settings';
import API_ANDROID from './customizations';
import { APP_FRAMEWORK } from '../base/lib/constants';
import { XMLNS_ANDROID } from './constants';

import { EXT_NAME } from '../extension/lib/constants';
import { WIDGET_NAME } from './extension/lib/constants';

import External from '../extension/external';
import Origin from '../extension/origin';
import Custom from './extension/custom';
import Accessibility from './extension/accessibility';
import List from './extension/list';
import Grid from './extension/grid';
import Table from './extension/table';
import Button from './extension/widget/floatingactionbutton';
import Menu from './extension/widget/menu';
import Coordinator from './extension/widget/coodinator';
import Toolbar from './extension/widget/toolbar';
import BottomNavigation from './extension/widget/bottomnavigation';
import Drawer from './extension/widget/drawer';

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

let viewController: ViewController<T>;
let fileHandler: FileHandler<T>;
let resourceHandler: ResourceHandler<T>;

let settings: SettingsAndroid;
let builtInExtensions: ObjectMap<IExtension>;

const appBase: AppFramework<T> = {
    create() {
        viewController = new ViewController<T>();
        fileHandler = new FileHandler<T>(Settings);
        resourceHandler = new ResourceHandler<T>(fileHandler);
        builtInExtensions = {
            [EXT_NAME.EXTERNAL]: new External(EXT_NAME.EXTERNAL, APP_FRAMEWORK.ANDROID),
            [EXT_NAME.ORIGIN]: new Origin(EXT_NAME.ORIGIN, APP_FRAMEWORK.ANDROID),
            [EXT_NAME.CUSTOM]: new Custom(EXT_NAME.CUSTOM, APP_FRAMEWORK.ANDROID),
            [EXT_NAME.ACCESSIBILITY]: new Accessibility(EXT_NAME.ACCESSIBILITY, APP_FRAMEWORK.ANDROID),
            [EXT_NAME.LIST]: new List(EXT_NAME.LIST, APP_FRAMEWORK.ANDROID, ['UL', 'OL', 'DL', 'DIV']),
            [EXT_NAME.TABLE]: new Table(EXT_NAME.TABLE, APP_FRAMEWORK.ANDROID, ['TABLE']),
            [EXT_NAME.GRID]: new Grid(EXT_NAME.GRID, APP_FRAMEWORK.ANDROID, ['FORM', 'UL', 'OL', 'DL', 'DIV', 'TABLE', 'NAV', 'SECTION', 'ASIDE', 'MAIN', 'HEADER', 'FOOTER', 'P', 'ARTICLE', 'FIELDSET', 'SPAN']),
            [WIDGET_NAME.FAB]: new Button(WIDGET_NAME.FAB, APP_FRAMEWORK.ANDROID, ['BUTTON', 'INPUT', 'IMG']),
            [WIDGET_NAME.MENU]: new Menu(WIDGET_NAME.MENU, APP_FRAMEWORK.ANDROID, ['NAV']),
            [WIDGET_NAME.COORDINATOR]: new Coordinator(WIDGET_NAME.COORDINATOR, APP_FRAMEWORK.ANDROID),
            [WIDGET_NAME.TOOLBAR]: new Toolbar(WIDGET_NAME.TOOLBAR, APP_FRAMEWORK.ANDROID),
            [WIDGET_NAME.BOTTOM_NAVIGATION]: new BottomNavigation(WIDGET_NAME.BOTTOM_NAVIGATION, APP_FRAMEWORK.ANDROID),
            [WIDGET_NAME.DRAWER]: new Drawer(WIDGET_NAME.DRAWER, APP_FRAMEWORK.ANDROID)
        };
        settings = Object.assign({}, Settings);
        initialized = true;
        return {
            settings,
            nodeObject: View,
            viewController,
            resourceHandler,
            builtInExtensions
        };
    },
    cached() {
        if (initialized) {
            return {
                settings,
                nodeObject: View,
                viewController,
                resourceHandler,
                builtInExtensions
            };
        }
        return appBase.create();
    },
    system: {
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
        },
        addXmlNs(name: string, uri: string) {
            XMLNS_ANDROID[name] = uri;
        },
        customize(build: number, widget: string, options: {}) {
            if (API_ANDROID[build]) {
                const customizations = API_ANDROID[build].customizations;
                if (customizations[widget] == null) {
                    customizations[widget] = {};
                }
                Object.assign(customizations[widget], options);
            }
        }
    }
};

export default appBase;