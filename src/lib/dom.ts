import { BoxModel, ClientRect } from './types';
import { convertInt } from './util';

export function getRangeBounds(element: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const domRect = range.getClientRects();
    const bounds = assignBounds(domRect[domRect.length - 1]);
    if (domRect.length > 1) {
        bounds.x = Math.min.apply(null, Array.from(domRect).map((item: ClientRect) => item.x));
        bounds.left = (<number> bounds.x);
        bounds.width = Array.from(domRect).reduce((a: number, b: ClientRect) => a + b.width, 0);
    }
    return bounds;
}

export function assignBounds(bounds: ClientRect): ClientRect {
    return {
        x: bounds.x,
        y: bounds.y,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height
    };
}

export function getStyle(element: HTMLElement, cache = true): CSSStyleDeclaration {
    const object = (<any> element);
    if (cache) {
        if (object.__style != null) {
            return object.__style;
        }
        else if (object.__node != null && object.__node.style != null) {
            return object.__node.style;
        }
    }
    else if (element.nodeName !== '#text') {
        const style = getComputedStyle(element);
        object.__style = style;
        return style;
    }
    return (<CSSStyleDeclaration> {});
}

export function sameAsParent(element: HTMLElement, attr: string) {
    if (element && element.parentElement != null) {
        const style = getStyle(element);
        return (style && style[attr] === getStyle(element.parentElement)[attr]);
    }
    return false;
}

export function getBoxSpacing(element: HTMLElement, complete = false) {
    const result: BoxModel = {};
    const style = getStyle(element);
    const node = (<any> element).__node;
    ['padding', 'margin'].forEach(border => {
        ['Top', 'Left', 'Right', 'Bottom'].forEach(side => {
            const attr = border + side;
            const value = convertInt((node != null ? node[attr] : style[attr]));
            if (complete || value !== 0) {
                result[attr] = value;
            }
        });
    });
    return result;
}

export function hasFreeFormText(element: HTMLElement) {
    return Array.from(element.childNodes).some((item: HTMLElement) => item.nodeName === '#text' && item.textContent != null && item.textContent.trim() !== '');
}

export function isVisible(element: HTMLElement) {
    switch (element.tagName) {
        case 'BR':
        case 'OPTION':
        case 'AREA':
            return false;
    }
    if (typeof element.getBoundingClientRect === 'function') {
        const bounds = element.getBoundingClientRect();
        if (bounds.width !== 0 && bounds.height !== 0) {
            return true;
        }
        else {
            let current = (<HTMLElement> element.parentElement);
            let valid = true;
            while (current != null) {
                const style = getStyle(current);
                if (style.display === 'none') {
                    valid = false;
                    break;
                }
                current = (<HTMLElement> current.parentElement);
            }
            if (valid && element.children.length > 0) {
                return Array.from(element.children).some((item: HTMLElement) => {
                    const style: any = getComputedStyle(item);
                    return (style.position !== 'static' || style.float === 'left' || style.float === 'right');
                });
            }
        }
    }
    return false;
}