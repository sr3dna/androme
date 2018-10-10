import { convertInt, hasValue, includes, resolvePath, withinFraction } from './util';

export function getBoxRect(): BoxRect {
    return {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    };
}

export function getClientRect(): BoxDimensions {
    return Object.assign({ width: 0, height: 0 }, getBoxRect());
}

export function getBoxModel(): BoxModel {
    return {
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0
    };
}

export function setElementCache(element: Null<Element>, attr: string, data: any) {
    if (element) {
        element[`__${attr}`] = data;
    }
}

export function getElementCache(element: Null<Element>, attr: string) {
    return element ? element[`__${attr}`] : null;
}

export function deleteElementCache(element: Null<Element>, ...attrs: string[]) {
    if (element) {
        for (const attr of attrs) {
            delete element[`__${attr}`];
        }
    }
}

export function getNodeFromElement<T extends androme.lib.base.Node>(element: Null<Element>): Null<T> {
    return getElementCache(element, 'node');
}

export function getRangeClientRect(element: Element): [Null<BoxDimensions>, boolean] {
    const range = document.createRange();
    range.selectNodeContents(element);
    const domRect =
        Array
            .from(range.getClientRects())
            .filter(item => !(Math.round(item.width) === 0 && withinFraction(item.left, item.right)));
    let result: BoxDimensions = getClientRect();
    let multiLine = false;
    if (domRect.length > 0) {
        result = assignBounds(domRect[0]);
        const top = new Set([result.top]);
        const bottom = new Set([result.bottom]);
        for (let i = 1 ; i < domRect.length; i++) {
            const rect = domRect[i];
            top.add(rect.top);
            bottom.add(rect.bottom);
            result.width += rect.width;
            result.right = Math.max(rect.right, result.right);
            result.height = Math.max(rect.height, result.height);
        }
        if (top.size > 1 && bottom.size > 1) {
            result.top = Math.min.apply(null, Array.from(top));
            result.bottom = Math.max.apply(null, Array.from(bottom));
            if (domRect[domRect.length - 1].top >= domRect[0].bottom && element.textContent && (element.textContent.trim() !== '' || /^\s*\n/.test(element.textContent))) {
                multiLine = true;
            }
        }
    }
    return [result, multiLine];
}

export function assignBounds(bounds: BoxDimensions | DOMRect): BoxDimensions {
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
    if (element) {
        if (cache) {
            const node = getNodeFromElement(element);
            const style = getElementCache(element, 'style');
            if (style) {
                return style;
            }
            else if (node) {
                if (node.style) {
                    return node.style;
                }
                else if (node.plainText) {
                    return <any> node.styleMap;
                }
            }
        }
        if (element.nodeName && element.nodeName.charAt(0) !== '#') {
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

export function cssResolveUrl(value: string) {
    const match = value.match(/^url\("?(.*?)"?\)$/);
    if (match) {
        return resolvePath(match[1]);
    }
    return '';
}

export function cssInherit(element: Element, attr: string, tagName = '', exclude?: string[]) {
    let result = '';
    let current: Null<Element> = element.parentElement;
    while (current && current.tagName !== tagName) {
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
    if (element.parentElement) {
        return styles.includes(getStyle(element.parentElement)[attr]);
    }
    return false;
}

export function cssFromParent(element: Element, attr: string) {
    if (element instanceof HTMLElement && element.parentElement) {
        const node = getNodeFromElement(element);
        const style = getStyle(element);
        return (style && style[attr] === getStyle(element.parentElement)[attr] && (!node || !node.styleMap[attr]));
    }
    return false;
}

export function hasFreeFormText(element: Element, maxDepth = 0, whiteSpace = true) {
    let valid = false;
    let depth = -1;
    function findFreeForm(elements: any[]) {
        if (depth++ === maxDepth) {
            return true;
        }
        return elements.some((item: Element) => {
            if (item.nodeName === '#text') {
                if (isPlainText(item, whiteSpace) || (cssParent(item, 'whiteSpace', 'pre', 'pre-wrap') && item.textContent && item.textContent !== '')) {
                    valid = true;
                    return true;
                }
            }
            else if (item instanceof HTMLElement && item.childNodes.length > 0) {
                return findFreeForm(Array.from(item.childNodes));
            }
            return false;
        });
    }
    if (element.nodeName === '#text') {
        maxDepth = 0;
        findFreeForm([element]);
    }
    else {
        findFreeForm(Array.from(element.childNodes));
    }
    return valid;
}

export function isPlainText(element: Null<Element>, whiteSpace = false) {
    if (element &&
        element.nodeName === '#text' &&
        element.textContent)
    {
        if (whiteSpace) {
            const value = element.textContent;
            let valid = false;
            for (let i = 0; i < value.length; i++) {
                switch (value.charCodeAt(i)) {
                    case 9:
                    case 10:
                    case 13:
                    case 32:
                        continue;
                    default:
                        valid = true;
                        break;
                }
            }
            return valid && value !== '';
        }
        else {
            return element.textContent.trim() !== '';
        }
    }
    return false;
}

export function hasLineBreak(element: Null<Element>) {
    if (element) {
        const node = getNodeFromElement(element);
        const fromParent = element.nodeName === '#text';
        let whiteSpace = '';
        if (node) {
            whiteSpace = node.css('whiteSpace');
        }
        else {
            whiteSpace = getStyle(element).whiteSpace || '';
        }
        return (
            (element instanceof HTMLElement && element.children.length > 0 && Array.from(element.children).some(item => item.tagName === 'BR')) ||
            (/\n/.test(element.textContent || '') && (
                ['pre', 'pre-wrap'].includes(whiteSpace) ||
                (fromParent && cssParent(element, 'whiteSpace', 'pre', 'pre-wrap'))
            ))
        );
    }
    return false;
}

export function isLineBreak(element: Null<Element>, excluded = true) {
    const node = getNodeFromElement(element);
    if (node) {
        return (
            node.tagName === 'BR' ||
            (excluded && node.block && (
                node.excluded ||
                node.textContent.trim() === '')
            )
        );
    }
    return false;
}

export function getElementsBetweenSiblings(firstElement: Null<Element>, secondElement: Element, cacheNode = false, whiteSpace = false) {
    if (!firstElement || firstElement.parentElement === secondElement.parentElement) {
        const parentElement = secondElement.parentElement;
        if (parentElement) {
            const elements = <Element[]> Array.from(parentElement.childNodes);
            const firstIndex = firstElement ? elements.findIndex(element => element === firstElement) : 0;
            const secondIndex = elements.findIndex(element => element === secondElement);
            if (firstIndex !== -1 && secondIndex !== -1 && firstIndex !== secondIndex) {
                let result = elements.slice(Math.min(firstIndex, secondIndex) + 1, Math.max(firstIndex, secondIndex));
                if (!whiteSpace) {
                    result =
                        result.filter(element => {
                            if (element.nodeName.charAt(0) === '#') {
                                return isPlainText(element);
                            }
                            return true;
                        });
                }
                else {
                    result = result.filter(element => element.nodeName !== '#comment');
                }
                if (cacheNode) {
                    result = result.filter(element => getNodeFromElement(element));
                }
                return result;
            }
        }
    }
    return [];
}

export function isElementVisible(element: Element) {
    if (!getElementCache(element, 'supportInline')) {
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
                if ((bounds.width !== 0 && bounds.height !== 0) ||
                    hasValue(element.dataset.ext) ||
                    getStyle(element).clear !== 'none')
                {
                    return true;
                }
                else {
                    let current = element.parentElement;
                    let valid = true;
                    while (current) {
                        if (getStyle(current).display === 'none') {
                            valid = false;
                            break;
                        }
                        current = current.parentElement;
                    }
                    if (valid) {
                        if (element.children.length > 0) {
                            return (
                                Array
                                    .from(element.children)
                                    .some((item: Element) => {
                                        const style = getStyle(item);
                                        const float = style.cssFloat;
                                        const position = style.position;
                                        return (
                                            (position !== 'static' && position !== 'initial') ||
                                            float === 'left' ||
                                            float === 'right'
                                        );
                                    })
                            );
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
    return false;
}

export function findNestedExtension(element: Element, name: string): Null<HTMLElement> {
    if (element instanceof HTMLElement) {
        return (
            Array
                .from(element.children)
                .find((item: HTMLElement) => includes(item.dataset.ext, name)) as HTMLElement
        );
    }
    return null;
}