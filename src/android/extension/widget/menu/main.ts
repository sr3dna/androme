import WIDGET_NAME from '../namespace';

import Menu from './menu';

const menu = new Menu(WIDGET_NAME.MENU, 2, ['NAV']);

if (androme) {
    androme.registerExtension(menu);
}

export default menu;