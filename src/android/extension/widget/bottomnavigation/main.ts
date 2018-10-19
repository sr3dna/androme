import WIDGET_NAME from '../namespace';

import BottomNavigation from './bottomnavigation';

const bottomNavigation = new BottomNavigation(WIDGET_NAME.BOTTOM_NAVIGATION, 2);

if (androme) {
    androme.registerExtension(bottomNavigation);
}

export default bottomNavigation;