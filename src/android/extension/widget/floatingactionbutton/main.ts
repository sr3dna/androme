import WIDGET_NAME from '../namespace';

import FloatingActionButton from './floatingactionbutton';

const fab = new FloatingActionButton(WIDGET_NAME.FAB, WIDGET_NAME.__FRAMEWORK, ['BUTTON', 'INPUT', 'IMG']);

if (androme) {
    androme.registerExtensionAsync(fab);
}

export default fab;