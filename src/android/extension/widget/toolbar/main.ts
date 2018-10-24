import WIDGET_NAME from '../namespace';

import Toolbar from './toolbar';

const toolbar = new Toolbar(WIDGET_NAME.TOOLBAR, WIDGET_NAME.__FRAMEWORK);

if (androme) {
    androme.registerExtensionAsync(toolbar);
}

export default toolbar;