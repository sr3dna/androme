import WIDGET_NAME from '../namespace';

import Toolbar from './toolbar';

const toolbar = new Toolbar(WIDGET_NAME.TOOLBAR, 2);

if (androme) {
    androme.registerExtension(toolbar);
}

export default toolbar;