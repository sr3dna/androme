import { WIDGET_ANDROID } from './lib/constants';
import View from './android/view';
import Widget from './android/widget';
import NODE_CACHE from './cache';
import SETTINGS from './settings';

const VIEW_BEFORE = {};
const VIEW_AFTER = {};

export const viewHandler = new View(NODE_CACHE, addViewBefore, addViewAfter);

function addViewBefore(id: number, xml: string, index = -1) {
    if (VIEW_BEFORE[id] == null) {
        VIEW_BEFORE[id] = [];
    }
    if (index !== -1 && index < VIEW_BEFORE[id].length) {
        VIEW_BEFORE[id].splice(index, 0, xml);
    }
    else {
        VIEW_BEFORE[id].push(xml);
    }
}

function addViewAfter(id: number, xml: string, index = -1) {
    if (VIEW_AFTER[id] == null) {
        VIEW_AFTER[id] = [];
    }
    if (index !== -1 && index < VIEW_AFTER[id].length) {
        VIEW_AFTER[id].splice(index, 0, xml);
    }
    else {
        VIEW_AFTER[id].push(xml);
    }
}

export function writeFrameLayout(node: Widget, parent: Widget) {
    return viewHandler.renderLayout(node, parent, WIDGET_ANDROID.FRAME);
}

export function writeLinearLayout(node: Widget, parent: Widget, vertical: boolean) {
    node.android('orientation', (vertical ? 'vertical' : 'horizontal'));
    return viewHandler.renderLayout(node, parent, WIDGET_ANDROID.LINEAR);
}

export function writeGridLayout(node: Widget, parent: Widget, columnCount: number) {
    node.android('columnCount', columnCount.toString());
    return viewHandler.renderLayout(node, parent, WIDGET_ANDROID.GRID);
}

export function writeRelativeLayout(node: Widget, parent: Widget) {
    return viewHandler.renderLayout(node, parent, WIDGET_ANDROID.RELATIVE);
}

export function writeConstraintLayout(node: Widget, parent: Widget) {
    return viewHandler.renderLayout(node, parent, WIDGET_ANDROID.CONSTRAINT);
}

export function writeDefaultLayout(node: Widget, parent: Widget) {
    if (SETTINGS.useConstraintLayout || node.flex.enabled) {
        return writeConstraintLayout(node, parent);
    }
    else {
        return writeRelativeLayout(node, parent);
    }
}

export function writeViewTag(node: Widget, parent: Widget, tagName: string) {
    return viewHandler.renderTag(node, parent, tagName);
}

export function insertViewBeforeAfter(output: string) {
    for (const id in VIEW_BEFORE) {
        output = output.replace(`{<${id}}`, VIEW_BEFORE[id].join(''));
    }
    for (const id in VIEW_AFTER) {
        output = output.replace(`{>${id}}`, VIEW_AFTER[id].join(''));
    }
    return output;
}