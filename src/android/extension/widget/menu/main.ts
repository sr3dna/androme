import WIDGET_NAME from '../namespace';

import Menu from './menu';

const menu = new Menu(WIDGET_NAME.MENU, WIDGET_NAME.__FRAMEWORK, ['NAV']);

if (androme) {
    androme.registerExtensionAsync(menu);
}

export default menu;