import View from './android/view';

const VIEW_BEFORE = {};
const VIEW_AFTER = {};

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

export function appendViewsBeforeAfter(output: string) {
    for (const id in VIEW_BEFORE) {
        output = output.replace(`{<${id}}`, VIEW_BEFORE[id].join(''));
    }
    for (const id in VIEW_AFTER) {
        output = output.replace(`{>${id}}`, VIEW_AFTER[id].join(''));
    }
    return output;
}

export const viewHandler = new View(addViewBefore, addViewAfter);