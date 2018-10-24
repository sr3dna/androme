import WIDGET_NAME from '../namespace';

import Drawer from './drawer';

const drawer = new Drawer(WIDGET_NAME.DRAWER, WIDGET_NAME.__FRAMEWORK);

if (androme) {
    androme.registerExtensionAsync(drawer);
}

export default drawer;