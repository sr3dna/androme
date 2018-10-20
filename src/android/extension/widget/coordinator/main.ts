import WIDGET_NAME from '../namespace';

import Coordinator from './coodinator';

const coordinator = new Coordinator(WIDGET_NAME.COORDINATOR, 2);

if (androme) {
    androme.registerExtension(coordinator);
}

export default coordinator;