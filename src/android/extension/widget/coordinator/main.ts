import WIDGET_NAME from '../namespace';

import Coordinator from './coodinator';

const coodinator = new Coordinator(WIDGET_NAME.COORDINATOR, 2);

if (androme) {
    androme.registerExtension(coodinator);
}

export default coodinator;