import WIDGET_NAME from '../namespace';

import Drawer from './drawer';

const drawer = new Drawer(WIDGET_NAME.DRAWER, 2);

if (androme) {
    androme.registerExtension(drawer);
}

export default drawer;