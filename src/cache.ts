import WidgetList from './android/widgetlist';

export const NODE_CACHE = new WidgetList();

export function generateNodeId() {
    return NODE_CACHE.length + 1;
}