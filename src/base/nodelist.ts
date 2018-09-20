import Node from './node';
import { convertInt, partition, sortAsc, sortDesc } from '../lib/util';
import { NODE_STANDARD } from '../lib/constants';
import { getNodeFromElement } from '../lib/dom';

export type FindPredicate<T> = (value: T, index?: number) => boolean;

export default class NodeList<T extends Node> implements Iterable<T> {
    public static siblingIndex<T extends Node>(a: T, b: T) {
        return (a.siblingIndex <= b.siblingIndex ? -1 : 1);
    }

    public static cleared<T extends Node>(list: T[]) {
        const nodes = new Map<T, string>();
        const floats = new Set();
        list.forEach(node => {
            const clear = node.css('clear');
            if (floats.size > 0) {
                if (clear === 'both') {
                    nodes.set(node, (floats.size === 2 ? 'both' : floats.values().next().value));
                    floats.clear();
                }
                else if (floats.has(clear)) {
                    floats.delete(clear);
                    nodes.set(node, clear);
                }
            }
            if (node.floating) {
                floats.add(node.float);
            }
        });
        return nodes;
    }

    public static textBaseline<T extends Node>(list: T[], alignInput = false, excludeImage = false) {
        let baseline: T[] = list.filter(node => node.imageElement && node.baseline);
        if (!excludeImage && baseline.length > 0) {
            return baseline;
        }
        else if (alignInput) {
            baseline = list.filter(node => node.baseline).sort((a, b) => {
                let nodeTypeA = a.nodeType;
                let nodeTypeB = b.nodeType;
                if (a.linearHorizontal) {
                    nodeTypeA = Math.min.apply(null, a.children.map(item => (item.nodeType > 0 ? item.nodeType : NODE_STANDARD.INLINE)));
                }
                if (b.linearHorizontal) {
                    nodeTypeB = Math.min.apply(null, b.children.map(item => (item.nodeType > 0 ? item.nodeType : NODE_STANDARD.INLINE)));
                }
                return (nodeTypeA <= nodeTypeB ? -1 : 1);
            });
        }
        else {
            const lineHeight: number = Math.max.apply(null, list.map(node => node.lineHeight));
            const boundsHeight: number = Math.max.apply(null, list.map(node => node.bounds.height));
            if (lineHeight > boundsHeight) {
                const result = list.filter(node => node.lineHeight === lineHeight);
                return (result.length === list.length ? result.filter(node => node.hasElement) : result).filter(node => node.baseline);
            }
            baseline = list.filter(node => node.baseline).sort((a, b) => {
                const fontSizeA = convertInt(a.css('fontSize'));
                const fontSizeB = convertInt(b.css('fontSize'));
                const heightA = a.bounds.height;
                const heightB = b.bounds.height;
                if (a.imageElement && b.imageElement) {
                    return (heightA >= heightB ? -1 : 1);
                }
                else if ((a.lineHeight > heightB && b.lineHeight === 0) || b.imageElement) {
                    return -1;
                }
                else if ((b.lineHeight > heightA && a.lineHeight === 0) || a.imageElement) {
                    return 1;
                }
                else if (!a.imageElement && !b.imageElement) {
                    if (fontSizeA === fontSizeB && heightA === heightB) {
                        if (a.hasElement && !b.hasElement) {
                            return -1;
                        }
                        else if (!a.hasElement && b.hasElement) {
                            return 1;
                        }
                        else {
                            return (a.siblingIndex <= b.siblingIndex ? -1 : 1);
                        }
                    }
                    else if (fontSizeA !== fontSizeB && fontSizeA !== 0 && fontSizeB !== 0) {
                        return (fontSizeA > fontSizeB ? -1 : 1);
                    }
                }
                return (heightA >= heightB ? -1 : 1);
            });
        }
        let fontFamily: string;
        let fontSize: string;
        let fontWeight: string;
        return baseline.filter((node, index) => {
            if (index === 0) {
                fontFamily = node.css('fontFamily');
                fontSize = node.css('fontSize');
                fontWeight = node.css('fontWeight');
                return true;
            }
            else {
                return (node.css('fontFamily') === fontFamily && node.css('fontSize') === fontSize && node.css('fontWeight') === fontWeight && ((node.lineHeight > 0 && node.lineHeight === baseline[0].lineHeight) || node.bounds.height === baseline[0].bounds.height) && node.nodeName === baseline[0].nodeName);
            }
        });
    }

    public static documentParent<T extends Node>(nodes: T[]) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].companion == null) {
                return nodes[i].documentParent;
            }
        }
        return nodes[0].documentParent;
    }

    public static linearX<T extends Node>(list: T[], traverse = true) {
        const nodes = list.filter(node => node.pageflow);
        switch (nodes.length) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                const parent = this.documentParent(nodes);
                let horizontal = false;
                if (traverse) {
                    if (nodes.every(node => node.documentParent === parent || (node.companion && node.companion.documentParent === parent))) {
                        const cleared = NodeList.cleared(Array.from(parent.element.children).map(node => getNodeFromElement(node) as T).filter(node => node));
                        horizontal = nodes.slice().sort(NodeList.siblingIndex).every((node, index) => {
                            if (index > 0) {
                                if (node.companion && node.companion.documentParent === parent) {
                                    node = node.companion as T;
                                }
                                const previous = node.previousSibling();
                                if (previous != null) {
                                    return !node.alignedVertically(previous, cleared);
                                }
                            }
                            return true;
                        });
                    }
                }
                if (horizontal || !traverse) {
                    return nodes.every(node => {
                        return !nodes.some(sibling => {
                            if (sibling !== node && node.linear.top >= sibling.linear.bottom && node.intersectY(sibling.linear)) {
                                return true;
                            }
                            return false;
                        });
                    });
                }
                return false;
        }
    }

    public static linearY<T extends Node>(list: T[]) {
        const nodes = list.filter(node => node.pageflow);
        switch (nodes.length) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                const parent = this.documentParent(nodes);
                if (nodes.every(node => node.documentParent === parent || (node.companion && node.companion.documentParent === parent))) {
                    const cleared = NodeList.cleared(Array.from(parent.element.children).map(node => getNodeFromElement(node) as T).filter(node => node));
                    return nodes.slice().sort(NodeList.siblingIndex).every((node, index) => {
                        if (index > 0 && !node.lineBreak) {
                            if (node.companion && node.companion.documentParent === parent) {
                                node = node.companion as T;
                            }
                            const previous = node.previousSibling();
                            if (previous != null) {
                                return node.alignedVertically(previous, cleared);
                            }
                        }
                        return true;
                    });
                }
                return false;
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
        const [valid, invalid]: T[][] = partition(this._list, predicate);
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