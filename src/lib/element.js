import { convertPX } from './util';

export function getRangeBounds(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const domRect = range.getClientRects();
    const bounds = JSON.parse(JSON.stringify(domRect[domRect.length - 1]));
    if (domRect.length > 1) {
        bounds.x = Array.from(domRect).reduce((a, b) => Math.min(a, b.x), Number.MAX_VALUE);
        bounds.left = bounds.x;
        bounds.width = Array.from(domRect).reduce((a, b) => a + b.width, 0);
    }
    return bounds;
}

export function getStyle(element) {
    return (element.__Node != null ? element.__Node.style : getComputedStyle(element));
}

export function parseStyle(element, name, value) {
    if (name == 'backgroundColor') {
        if (element != null && element.parentNode != null && value == getStyle(element.parentNode).backgroundColor) {
            return null;
        }
    }
    else if (/(pt|em)$/.test(value)) {
        value = convertPX(value);
    }
    return value;
}

export function getBoxSpacing(element, rtl = false, complete = false) {
    const result = {};
    ['padding', 'margin'].forEach(border => {
        ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
            const attr = border + side;
            const value = parseInt(getStyle(element)[attr]) || 0;
            if (complete || value != 0) {
                result[(rtl ? attr.replace('Left', 'Start').replace('Right', 'End') : attr)] = value;
            }
        });
    });
    return result;
}

export function hasFreeFormText(element) {
    return Array.from(element.childNodes).some(item => (item.nodeName == '#text' && item.textContent.trim() != ''));
}

export function isVisible(element) {
    if (typeof element.getBoundingClientRect == 'function') {
        const bounds = element.getBoundingClientRect();
        if (bounds.width != 0 && bounds.height != 0) {
            return true;
        }
        else if (element.children.length > 0) {
            return Array.from(element.children).some(item => {
                const style = getComputedStyle(item);
                return !(style.position == '' || style.position == 'static');
            });
        }
    }
    return false;
}