import { BoxModel, ClientRect, Null } from './types';
import Node from '../base/node';
import { convertInt, optional, hasValue } from './util';

export function setCache(element: Null<Element>, attr: string, data: any) {
    if (element != null) {
        element[`__${attr}`] = data;
    }
}

export function getCache(element: Null<Element>, attr: string) {
    return (element != null ? element[`__${attr}`] : null);
}

export function deleteCache(element: Null<Element>, ...attrs: string[]) {
    if (element != null) {
        for (const attr of attrs) {
            delete element[`__${attr}`];
        }
    }
}

export function getNode<T extends Node>(element: Null<Element>): Null<T> {
    return getCache(element, 'node');
}

export function previousNode(element: Element) {
    let previous: Null<Element>;
    do {
        previous = <Element> element.previousSibling;
        if (previous != null && getNode(previous)) {
            return getNode(previous);
        }
    }
    while (previous != null);
    return null;
}

export function getRangeBounds(element: Element): [ClientRect, boolean] {
    let multiLine = false;
    const range = document.createRange();
    range.selectNodeContents(element);
    const domRect = Array.from(range.getClientRects());
    const result = assignBounds(<ClientRect> domRect[0]);
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
        if (element.textContent && (!/^\s+$/.test(element.textContent) || /^\s*\n/.test(element.textContent))) {
            multiLine = true;
        }
    }
    return [result, multiLine];
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

export function getStyle(element: HTMLElement, cache = true): CSSStyleDeclaration {
    if (element != null) {
        if (cache) {
            const node = getNode(element);
            const style = getCache(element, 'style');
            if (style != null) {
                return style;
            }
            else if (node && node.style != null) {
                return node.style;
            }
        }
        if (element.nodeName.charAt(0) !== '#') {
            const style = getComputedStyle(element);
            setCache(element, 'style', style);
            return style;
        }
    }
    return {} as CSSStyleDeclaration;
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
    const node = getNode(element);
    const style = getStyle(element);
    ['padding', 'margin'].forEach(area => {
        ['Top', 'Left', 'Right', 'Bottom'].forEach(direction => {
            const attr = area + direction;
            const value = convertInt((node || style)[attr]);
            if (complete || value !== 0) {
                result[attr] = value;
            }
        });
    });
    return result;
}

export function cssParent(element: HTMLElement, attr: string, ...styles: string[]) {
    if (element.nodeName.charAt(0) !== '#') {
        if (styles.includes(getStyle(element)[attr])) {
            return true;
        }
    }
    if (element.parentElement != null) {
        return styles.includes(getStyle(element.parentElement)[attr]);
    }
    return false;
}

export function hasFreeFormText(element: Element, maxDepth = 0) {
    let valid = false;
    let depth = -1;
    function findFreeForm(elements: any[]) {
        if (depth === maxDepth) {
            return true;
        }
        return elements.some((item: HTMLElement) => {
            if (item.nodeName === '#text') {
                if (optional(item, 'textContent').trim() !== '' || cssParent(item, 'whiteSpace', 'pre', 'pre-wrap')) {
                    valid = true;
                    return true;
                }
            }
            else if (item.childNodes && item.childNodes.length > 0) {
                depth++;
                return findFreeForm(Array.from(item.childNodes));
            }
            return false;
        });
    }
    findFreeForm(Array.from(element.childNodes));
    return valid;
}

export function hasLineBreak(element: HTMLElement) {
    return (element instanceof HTMLElement && ((element.children.length > 0 && Array.from(element.children).some(item => item.tagName === 'BR')) || ['pre', 'pre-wrap'].includes(<string> getStyle(element).whiteSpace) && /\n/.test(element.textContent || '')));
}

export function isLineBreak(element: Null<Element>, direction = 'previous') {
    let found = false;
    while (element != null) {
        if (element.nodeName === '#text') {
            if (element.textContent && element.textContent.trim() !== '') {
                break;
            }
            else {
                element = element[`${direction}Sibling`];
            }
        }
        else {
            const styleMap = getCache(element, 'styleMap');
            found = (element.tagName === 'BR' || (getStyle(<HTMLElement> element).display === 'block' && (!getNode(element) || (styleMap && convertInt(styleMap.height || styleMap.lineHeight) > 0 && element.innerHTML.trim() === ''))));
            break;
        }
    }
    return found;
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
        if (bounds.width !== 0 && bounds.height !== 0 || hasValue(element.dataset.ext)) {
            return true;
        }
        else {
            let current = element.parentElement;
            let valid = true;
            while (current != null) {
                if (getStyle(current).display === 'none') {
                    valid = false;
                    break;
                }
                current = current.parentElement;
            }
            if (valid && element.children.length > 0) {
                return Array.from(element.children).some((item: HTMLElement) => {
                    const style = getStyle(item);
                    const float = style.cssFloat;
                    const position = style.position;
                    return ((position !== 'static' && position !== 'initial') || float === 'left' || float === 'right');
                });
            }
        }
    }
    return false;
}