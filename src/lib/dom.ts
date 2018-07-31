import { BoxModel, ClientRect, Null } from './types';
import { convertInt, optional } from './util';
import { BLOCK_ELEMENT } from './constants';

export function previousNode(element: HTMLElement) {
    let previous: Null<HTMLElement>;
    do {
        previous = (<HTMLElement> element.previousSibling);
        if (previous != null && (<any> previous).__node != null) {
            return (<any> previous).__node;
        }
    }
    while (previous != null);
    return null;
}

export function getRangeBounds(element: HTMLElement): [ClientRect, boolean] {
    let multiLine = false;
    const range = document.createRange();
    range.selectNodeContents(element);
    const domRect = Array.from(range.getClientRects());
    const result = (<ClientRect> JSON.parse(JSON.stringify(domRect[0])));
    const top = new Set([result.top]);
    const bottom = new Set([result.bottom]);
    for (let i = 1 ; i < domRect.length; i++) {
        const rect = domRect[i];
        top.add(rect.top);
        bottom.add(rect.bottom);
        result.width += rect.width;
        result.right = Math.max(rect.right, result.right);
    }
    if (top.size > 1 && bottom.size > 1) {
        result.top = Math.min.apply(null, Array.from(top));
        result.bottom = Math.max.apply(null, Array.from(bottom));
        result.height = result.bottom - result.top;
        multiLine = true;
    }
    return [assignBounds(<ClientRect> result), multiLine];
}

export function assignBounds(bounds: ClientRect): ClientRect {
    return {
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height
    };
}

export function getStyle(element: Null<HTMLElement>, cache = true): CSSStyleDeclaration {
    if (element != null) {
        const object: any = element;
        if (cache) {
            if (object.__style != null) {
                return object.__style;
            }
            else if (object.__node != null && object.__node.style != null) {
                return object.__node.style;
            }
        }
        if (element.nodeName !== '#text') {
            const style = getComputedStyle(element);
            object.__style = style;
            return style;
        }
    }
    return (<CSSStyleDeclaration> {});
}

export function sameAsParent(element: HTMLElement, attr: string) {
    if (element.parentElement != null) {
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
        ['Top', 'Left', 'Right', 'Bottom'].forEach(direction => {
            const attr = border + direction;
            const value = convertInt(node != null ? node[attr] : style[attr]);
            if (complete || value !== 0) {
                result[attr] = value;
            }
        });
    });
    return result;
}

export function hasFreeFormText(element: HTMLElement) {
    return (element && element.childNodes && Array.from(element.childNodes).some((item: HTMLElement) => item.nodeName === '#text' && optional(item, 'textContent').trim() !== ''));
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
        if (bounds.width !== 0 && bounds.height !== 0 || (getStyle(element).display !== 'none' && BLOCK_ELEMENT.includes(element.tagName))) {
            return true;
        }
        else {
            let current = (<HTMLElement> element.parentElement);
            let valid = true;
            while (current != null) {
                if (getStyle(current).display === 'none') {
                    valid = false;
                    break;
                }
                current = (<HTMLElement> current.parentElement);
            }
            if (valid && element.children.length > 0) {
                return Array.from(element.children).some((item: HTMLElement) => {
                    const style = getStyle(item);
                    const float = (<any> style).float;
                    return ((style.position !== 'static' && style.position !== 'initial') || float === 'left' || float === 'right');
                });
            }
        }
    }
    return false;
}