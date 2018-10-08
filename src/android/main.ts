
import { SettingsAndroid } from './lib/types';
import View from './view';
import ViewController from './viewcontroller';
import ResourceHandler from './resourcehandler';
import FileHandler from './filehandler';
import Settings from './settings';
import API_ANDROID from './customizations';
import { XMLNS_ANDROID } from './lib/constant';
import { WIDGET_NAME } from './extension/lib/constant';

import External from './extension/external';
import Origin from './extension/origin';
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

let application: androme.lib.base.Application<T>;
let viewController: ViewController<T>;
let fileHandler: FileHandler<T>;
let resourceHandler: ResourceHandler<T>;

let settings: SettingsAndroid;
let builtInExtensions: ObjectMap<androme.lib.base.Extension<T>>;

const framework: number = androme.lib.enumeration.APP_FRAMEWORK.ANDROID;

const appBase: AppFramework<T> = {
    create() {
        const EXT_NAME = androme.lib.constant.EXT_NAME;
        settings = Object.assign({}, Settings);
        application = new androme.lib.base.Application(framework);
        viewController = new ViewController<T>();
        fileHandler = new FileHandler<T>(settings);
        resourceHandler = new ResourceHandler<T>(fileHandler);
        builtInExtensions = {
            [EXT_NAME.EXTERNAL]: new External(EXT_NAME.EXTERNAL, framework),
            [EXT_NAME.ORIGIN]: new Origin(EXT_NAME.ORIGIN, framework),
            [EXT_NAME.CUSTOM]: new Custom(EXT_NAME.CUSTOM, framework),
            [EXT_NAME.ACCESSIBILITY]: new Accessibility(EXT_NAME.ACCESSIBILITY, framework),
            [EXT_NAME.LIST]: new List(EXT_NAME.LIST, framework, ['UL', 'OL', 'DL', 'DIV']),
            [EXT_NAME.TABLE]: new Table(EXT_NAME.TABLE, framework, ['TABLE']),
            [EXT_NAME.GRID]: new Grid(EXT_NAME.GRID, framework, ['FORM', 'UL', 'OL', 'DL', 'DIV', 'TABLE', 'NAV', 'SECTION', 'ASIDE', 'MAIN', 'HEADER', 'FOOTER', 'P', 'ARTICLE', 'FIELDSET', 'SPAN']),
            [WIDGET_NAME.FAB]: new Button(WIDGET_NAME.FAB, framework, ['BUTTON', 'INPUT', 'IMG']),
            [WIDGET_NAME.MENU]: new Menu(WIDGET_NAME.MENU, framework, ['NAV']),
            [WIDGET_NAME.COORDINATOR]: new Coordinator(WIDGET_NAME.COORDINATOR, framework),
            [WIDGET_NAME.TOOLBAR]: new Toolbar(WIDGET_NAME.TOOLBAR, framework),
            [WIDGET_NAME.BOTTOM_NAVIGATION]: new BottomNavigation(WIDGET_NAME.BOTTOM_NAVIGATION, framework),
            [WIDGET_NAME.DRAWER]: new Drawer(WIDGET_NAME.DRAWER, framework)
        };
        initialized = true;
        return {
            framework,
            application,
            viewController,
            resourceHandler,
            nodeObject: View,
            builtInExtensions,
            settings
        };
    },
    cached() {
        if (initialized) {
            return {
                framework,
                application,
                viewController,
                resourceHandler,
                nodeObject: View,
                builtInExtensions,
                settings
            };
        }
        return appBase.create();
    },
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
    }
};

export default appBase;