import Node from './node';
import { convertInt, convertPX, sortAsc, sortDesc } from '../lib/util';
import { NODE_STANDARD } from '../lib/constants';
import { getNodeFromElement, isLineBreak } from '../lib/dom';

export type FindPredicate<T> = (value: T, index?: number) => boolean;

export default class NodeList<T extends Node> implements Iterable<T> {
    public static cleared<T extends Node>(list: T[]) {
        const nodes: Set<T> = new Set();
        const floats = new Set();
        list.forEach(node => {
            const clear = node.css('clear');
            if (floats.size > 0 && (clear === 'both' || floats.has(clear))) {
                nodes.add(node);
                floats.clear();
            }
            if (node.floating) {
                floats.add(node.float);
            }
        });
        return nodes;
    }

    public static textBaseline<T extends Node>(list: T[], text = false, parent?: T) {
        const images = (!text ? list.filter(node => node.imageElement && node.baseline) : []);
        if (parent == null && images.length === 0 && list.every(node => node.lineHeight === list[0].lineHeight && node.css('fontSize') === list[0].css('fontSize'))) {
            return null;
        }
        const baseline = (images.length > 0 ? images : list.filter(node => node.textElement && node.baseline && !node.multiLine)).sort((a, b) => {
            const fontSizeA = convertInt(convertPX(a.css('fontSize')));
            const fontSizeB = convertInt(convertPX(b.css('fontSize')));
            const heightA = a.bounds.height;
            const heightB = b.bounds.height;
            if (a.lineHeight > heightB && b.lineHeight === 0) {
                return -1;
            }
            else if (b.lineHeight > heightA && a.lineHeight === 0) {
                return 1;
            }
            else if (fontSizeA === fontSizeB && heightA === heightB) {
                if (a.hasElement && !b.hasElement) {
                    return -1;
                }
                else if (!a.hasElement && b.hasElement) {
                    return 1;
                }
                else {
                    return (a.siblingIndex < b.siblingIndex ? -1 : 1);
                }
            }
            else if (fontSizeA !== fontSizeB && fontSizeA !== 0 && fontSizeB !== 0) {
                return (fontSizeA > fontSizeB ? -1 : 1);
            }
            else {
                return (heightA >= heightB ? -1 : 1);
            }
        })[0];
        const nodeType = (text ? NODE_STANDARD.TEXT : NODE_STANDARD.IMAGE);
        if (baseline == null && parent != null) {
            const valid = Array.from(parent.element.children).some(element => {
                const node = getNodeFromElement(element);
                if (node) {
                    return ((node.nodeType <= nodeType && node.baseline) || (node.linearHorizontal && node.children.some(item => item.nodeType <= nodeType && item.baseline)));
                }
                return false;
            });
            if (valid) {
                return list.filter(node => node.baseline).sort((a, b) => {
                    let nodeTypeA = a.nodeType;
                    let nodeTypeB = b.nodeType;
                    if (a.linearHorizontal) {
                        nodeTypeA = Math.min.apply(null, a.children.map(item => (item.nodeType > 0 ? item.nodeType : NODE_STANDARD.INLINE)));
                    }
                    if (b.linearHorizontal) {
                        nodeTypeB = Math.min.apply(null, b.children.map(item => (item.nodeType > 0 ? item.nodeType : NODE_STANDARD.INLINE)));
                    }
                    return (nodeTypeA <= nodeTypeB ? -1 : 1);
                })[0];
            }
        }
        return baseline;
    }

    public static linearX<T extends Node>(list: T[]) {
        const nodes = list.filter(node => node.pageflow);
        switch (nodes.length) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                if (NodeList.cleared(nodes).size === 0) {
                    const horizontal = nodes.filter(node => node.float !== 'left');
                    let valid = (horizontal.length > 1);
                    for (let i = 1; i < horizontal.length; i++) {
                        const previous = horizontal[i - 1];
                        const current = horizontal[i];
                        if (!(previous.inlineElement && current.inlineElement && previous.bounds.right <= current.bounds.left) || !previous.inlineElement) {
                            valid = false;
                            break;
                        }
                    }
                    if (valid) {
                        return true;
                    }
                    const left = Math.min.apply(null, nodes.map(node => node.bounds.left));
                    const right = Math.min.apply(null, nodes.map(node => node.bounds.right));
                    if (nodes.filter(node => node.bounds.left === left).length > 1 || nodes.filter(node => node.bounds.right === right).length > 1) {
                        return false;
                    }
                    const bottom = Math.min.apply(null, nodes.map(node => node.bounds.bottom));
                    return nodes.every(node => node.inlineElement && !node.autoMargin && node.bounds.top < bottom);
                }
                return false;
        }
    }

    public static linearY<T extends Node>(list: T[]) {
        let nodes = list.filter(node => node.pageflow);
        switch (nodes.length) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                if (nodes.every(node => node.block && !node.floating)) {
                    return true;
                }
                if (nodes.every((node, index) => node.inlineElement && (index === 0 || !isLineBreak(node.element.previousElementSibling)))) {
                    return false;
                }
                nodes = nodes.filter(node => !node.floating);
                const minRight = Math.min.apply(null, nodes.map(node => node.bounds.right));
                const maxRight = Math.max.apply(null, nodes.map(node => node.bounds.right));
                return nodes.every((node, index) => {
                    if (node.bounds.left < minRight) {
                        return true;
                    }
                    else {
                        const previous = nodes[index - 1];
                        if ((previous == null || (previous.inlineElement && previous.bounds.right !== maxRight)) && node.inlineElement && node.bounds.right !== maxRight) {
                            return true;
                        }
                    }
                    return false;
                });
        }
    }

    public delegateAppend?: (nodes: T[]) => void;

    private readonly _list: T[] = [];
    private _currentId = 0;

    constructor(
        nodes?: T[],
        public parent?: T)
    {
        if (Array.isArray(nodes)) {
            this._list = nodes;
        }
    }

    public [Symbol.iterator]() {
        const list = this._list;
        let i = 0;
        return {
            next(): IteratorResult<T> {
                if (i < list.length) {
                    return { done: false, value: list[i++] };
                }
                else {
                    return { done: true, value: undefined } as any;
                }
            }
        };
    }

    public reset() {
        this._currentId = 0;
        this.clear();
    }

    public get(index?: number): T {
        if (index == null) {
            return this._list[this._list.length - 1];
        }
        return this._list[index];
    }

    public append(...nodes: T[]) {
        this._list.push(...nodes);
        if (this.delegateAppend != null) {
            this.delegateAppend.call(this, nodes);
        }
    }

    public prepend(...nodes: T[]) {
        this._list.unshift(...nodes);
    }

    public remove(start: number, deleteCount = 1) {
        return this._list.splice(start, deleteCount);
    }

    public clone(): NodeList<T> {
        return new NodeList<T>(this._list.slice());
    }

    public filter(predicate: (value: T) => boolean) {
        return new NodeList<T>(this._list.filter(predicate));
    }

    public sort(predicate: (a: T, b: T) => number) {
        return new NodeList<T>(this._list.slice().sort(predicate));
    }

    public partition(predicate: (value: T) => boolean) {
        const valid: T[] = [];
        const invalid: T[] = [];
        this._list.forEach((node: T) => {
            if (predicate(node)) {
                valid.push(node);
            }
            else {
                invalid.push(node);
            }
        });
        return [new NodeList<T>(valid), new NodeList<T>(invalid)];
    }

    public each(predicate: (value: T, index?: number) => void) {
        this._list.forEach(predicate);
    }

    public locate(attr: string | FindPredicate<T>, value?: any) {
        if (typeof attr === 'string') {
            return this._list.find(node => node[attr] === value);
        }
        return this._list.find(attr);
    }

    public clear() {
        this._list.length = 0;
    }

    public sortAsc(...attrs: string[]) {
        sortAsc<T>(this._list, ...attrs);
        return this;
    }

    public sortDesc(...attrs: string[]) {
        sortDesc<T>(this._list, ...attrs);
        return this;
    }

    get length() {
        return this._list.length;
    }

    get list() {
        return this._list;
    }

    get visible() {
        return new NodeList<T>(this._list.filter(node => node.visible));
    }

    get elements() {
        return new NodeList<T>(this._list.filter(node => node.visible && node.hasElement));
    }

    get nextId() {
        return ++this._currentId;
    }

    get linearX() {
        return NodeList.linearX(this._list);
    }
    get linearY() {
        return NodeList.linearY(this._list);
    }
}