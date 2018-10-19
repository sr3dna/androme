import WIDGET_NAME from '../namespace';

import FloatingActionButton from './floatingactionbutton';

const fab = new FloatingActionButton(WIDGET_NAME.FAB, 2, ['BUTTON', 'INPUT', 'IMG']);

if (androme) {
    androme.registerExtension(fab);
}

export default fab;