import { StringMap } from '../../../lib/types';

export const WIDGET_NAME: StringMap = {
    FAB: 'androme.widget.floatingactionbutton',
    MENU: 'androme.widget.menu',
    COORDINATOR: 'androme.widget.coordinator',
    TOOLBAR: 'androme.widget.toolbar',
    DRAWER: 'androme.widget.drawer'
};

export const VIEW_SUPPORT: StringMap = {
    DRAWER: 'android.support.v4.widget.DrawerLayout',
    NAVIGATION_VIEW: 'android.support.design.widget.NavigationView',
    COORDINATOR: 'android.support.design.widget.CoordinatorLayout',
    APPBAR: 'android.support.design.widget.AppBarLayout',
    COLLAPSING_TOOLBAR: 'android.support.design.widget.CollapsingToolbarLayout',
    TOOLBAR: 'android.support.v7.widget.Toolbar',
    FLOATING_ACTION_BUTTON: 'android.support.design.widget.FloatingActionButton'
};

export const DRAWABLE_PREFIX: StringMap = {
    MENU: 'ic_menu_',
    DIALOG: 'ic_dialog_'
};