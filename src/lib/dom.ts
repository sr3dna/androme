import { BoxModel, ClientRect, Null } from './types';
import Node from '../base/node';
import { convertInt, hasValue, resolvePath } from './util';

export function setElementCache(element: Null<Element>, attr: string, data: any) {
    if (element != null) {
        element[`__${attr}`] = data;
    }
}

export function getElementCache(element: Null<Element>, attr: string) {
    return (element != null ? element[`__${attr}`] : null);
}

export function deleteElementCache(element: Null<Element>, ...attrs: string[]) {
    if (element != null) {
        for (const attr of attrs) {
            delete element[`__${attr}`];
        }
    }
}

export function getNodeFromElement<T extends Node>(element: Null<Element>): Null<T> {
    return getElementCache(element, 'node');
}

export function getRangeClientRect(element: Element): [ClientRect, boolean] {
    const range = document.createRange();
    range.selectNodeContents(element);
    const domRect = Array.from(range.getClientRects());
    const result = assignBounds(<ClientRect> domRect[0]);
    const top = new Set([result.top]);
    const bottom = new Set([result.bottom]);
    let multiLine = false;
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
        if (domRect[domRect.length - 1].top >= domRect[0].bottom && element.textContent && (element.textContent.trim() !== '' || /^\s*\n/.test(element.textContent))) {
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

export function getStyle(element: Null<Element>, cache = true): CSSStyleDeclaration {
    if (element != null) {
        if (cache) {
            const node = getNodeFromElement(element);
            const style = getElementCache(element, 'style');
            if (style) {
                return style;
            }
            else if (node) {
                if (node.style != null) {
                    return node.style;
                }
                else if (node.plainText) {
                    return <any> node.styleMap;
                }
            }
        }
        if (element.nodeName.charAt(0) !== '#') {
            const style = getComputedStyle(element);
            setElementCache(element, 'style', style);
            return style;
        }
    }
    return <CSSStyleDeclaration> {};
}

export function getBoxSpacing(element: Element, complete = false, merge = false) {
    const result = {};
    const node = getNodeFromElement(element);
    const style = getStyle(element);
    ['Top', 'Left', 'Right', 'Bottom'].forEach(direction => {
        let total = 0;
        ['padding', 'margin'].forEach(region => {
            const attr = region + direction;
            const value = convertInt((node || style)[attr]);
            if (complete || value !== 0) {
                result[attr] = value;
            }
            total += value;
        });
        if (merge) {
            result[`padding${direction}`] = total;
            if (complete) {
                result[`margin${direction}`] = 0;
            }
            else {
                delete result[`margin${direction}`];
            }
        }
    });
    return <BoxModel> result;
}

export function parseBackgroundUrl(value: string) {
    const match = value.match(/^url\("?(.*?)"?\)$/);
    if (match) {
        return resolvePath(match[1]);
    }
    return '';
}

export function cssInherit(element: Element, attr: string, tagName = '', exclude?: string[]) {
    let result = '';
    let current: Null<Element> = element.parentElement;
    while (current != null && current.tagName !== tagName) {
        result = getStyle(current)[attr] || '';
        if (exclude && exclude.some(value => result.indexOf(value) !== -1)) {
            result = '';
        }
        if (current === document.body || result) {
            break;
        }
        current = current.parentElement;
    }
    return result;
}

export function cssParent(element: Element, attr: string, ...styles: string[]) {
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

export function cssFromParent(element: Element, attr: string) {
    if (element && element.parentElement != null) {
        const node = getNodeFromElement(element);
        const style = getStyle(element);
        return (style && style[attr] === getStyle(element.parentElement)[attr] && (node == null || node.styleMap[attr] == null));
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
        return elements.some((item: Element) => {
            if (item.nodeName === '#text') {
                if (isPlainText(item) || cssParent(item, 'whiteSpace', 'pre', 'pre-wrap')) {
                    valid = true;
                    return true;
                }
            }
            else if (item instanceof HTMLElement && item.childNodes.length > 0) {
                depth++;
                return findFreeForm(Array.from(item.childNodes));
            }
            return false;
        });
    }
    findFreeForm(Array.from(element.childNodes));
    return valid;
}

export function isPlainText(element: Null<Element>) {
    return (element != null && element.nodeName === '#text' && (element.textContent || '').trim() !== '');
}

export function hasLineBreak(element: Null<Element>) {
    const node = getNodeFromElement(element);
    let whiteSpace = '';
    let styleMap = false;
    if (node) {
        whiteSpace = node.css('whiteSpace');
        styleMap = node.has('whiteSpace');
    }
    else {
        whiteSpace = getStyle(element).whiteSpace || '';
    }
    return (element instanceof HTMLElement && element.children.length > 0 && Array.from(element.children).some(item => item.tagName === 'BR')) || (element != null && ((['pre', 'pre-wrap'].includes(whiteSpace) || (!styleMap && cssParent(element, 'whiteSpace', 'pre', 'pre-wrap'))) && /\n/.test(element.textContent || '')));
}

export function isLineBreak(element: Null<Element>, direction = 'previous', includeNode = true) {
    let found = false;
    while (element != null) {
        if (element.nodeName === '#text') {
            if (isPlainText(element) || direction === '') {
                break;
            }
            else {
                element = element[`${direction}Sibling`];
            }
        }
        else {
            const styleMap = getElementCache(element, 'styleMap');
            found = (element.tagName === 'BR' || (includeNode && getStyle(element).display === 'block' && (!getNodeFromElement(element) || (styleMap && convertInt(styleMap.height || styleMap.lineHeight) > 0 && element.innerHTML.trim() === ''))));
            break;
        }
    }
    return found;
}

export function getElementsBetweenSiblings(firstElement: Null<Element>, secondElement: Element, cacheNode = false, whiteSpace = false) {
    if (firstElement == null || firstElement.parentElement === secondElement.parentElement) {
        const parentElement = secondElement.parentElement;
        if (parentElement != null) {
            const firstIndex = (firstElement != null ? Array.from(parentElement.childNodes).findIndex((element: Element) => element === firstElement) : 0);
            const secondIndex = Array.from(parentElement.childNodes).findIndex((element: Element) => element === secondElement);
            if (firstIndex !== -1 && secondIndex !== -1 && firstIndex !== secondIndex) {
                let elements = <Element[]> Array.from(parentElement.childNodes).slice(Math.min(firstIndex, secondIndex) + 1, Math.max(firstIndex, secondIndex));
                if (!whiteSpace) {
                    elements = elements.filter((element: Element) => {
                        if (element.nodeName.charAt(0) === '#') {
                            return isPlainText(element);
                        }
                        return true;
                    });
                }
                if (cacheNode) {
                    elements = elements.filter((element: Element) => getNodeFromElement(element));
                }
                return elements;
            }
        }
    }
    return [];
}

export function isElementVisible(element: Element) {
    if (element instanceof HTMLElement) {
        switch (element.tagName) {
            case 'BR':
            case 'OPTION':
            case 'MAP':
            case 'AREA':
                return false;
        }
        if (typeof element.getBoundingClientRect === 'function') {
            const bounds = element.getBoundingClientRect();
            if (bounds.width !== 0 && bounds.height !== 0 || hasValue(element.dataset.ext) || getStyle(element).clear !== 'none') {
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
                if (valid) {
                    if (element.children.length > 0) {
                        return Array.from(element.children).some((item: Element) => {
                            const style = getStyle(item);
                            const float = style.cssFloat;
                            const position = style.position;
                            return ((position !== 'static' && position !== 'initial') || float === 'left' || float === 'right');
                        });
                    }
                }
            }
        }
        return false;
    }
    else {
        return isPlainText(element);
    }
}