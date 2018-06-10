import { IBoxModel, IClientRect } from './types';
import { convertPX } from './util';
import parseRTL from './localization';

export function getRangeBounds(element: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const domRect = range.getClientRects();
    const bounds: IClientRect = JSON.parse(JSON.stringify(domRect[domRect.length - 1]));
    if (domRect.length > 1) {
        bounds.x = Array.from(domRect).reduce((a: number, b: any) => Math.min(a, b.x), Number.MAX_VALUE);
        bounds.left = bounds.x;
        bounds.width = Array.from(domRect).reduce((a: number, b: any) => a + b.width, 0);
    }
    return bounds;
}

export function getStyle(element: any) {
    return (element.__node != null ? element.__node.style : getComputedStyle(element));
}

export function parseStyle(element: HTMLElement, attr: string, value: string) {
    if (attr == 'backgroundColor') {
        if (element != null && element.parentNode != null && value == getStyle(element.parentNode).backgroundColor) {
            return null;
        }
    }
    else if (/(pt|em)$/.test(value)) {
        value = convertPX(value);
    }
    return value;
}

export function getBoxSpacing(element: HTMLElement, complete = false) {
    const result: IBoxModel = {};
    ['padding', 'margin'].forEach(border => {
        ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
            const attr = border + side;
            const value = parseInt(getStyle(element)[attr]) || 0;
            if (complete || value != 0) {
                result[parseRTL(attr)] = value;
            }
        });
    });
    return result;
}

export function hasFreeFormText(element: HTMLElement) {
    return Array.from(element.childNodes).some(item => (item.nodeName == '#text' && item.textContent.trim() != ''));
}

export function isVisible(element: HTMLElement) {
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