import Node from './node';
import { sortAsc, sortDesc } from '../lib/util';
import { NODE_STANDARD } from '../lib/constants';
import { getNode, isLineBreak } from '../lib/dom';

export type FindPredicate<T> = (value: T, index?: number) => boolean;

export default class NodeList<T extends Node> implements Iterable<T> {
    public static cleared<T extends Node>(list: T[]) {
        const result: Set<T> = new Set();
        const floats = new Set();
        list.forEach(node => {
            const clear = node.css('clear');
            if (floats.size > 0 && (clear === 'both' || floats.has(clear))) {
                result.add(node);
                floats.clear();
            }
            if (node.floating) {
                floats.add(node.float);
            }
        });
        return result;
    }

    public static baselineText<T extends Node>(list: T[], text = false, parent?: T) {
        const images = (!text ? list.filter(node => node.is(NODE_STANDARD.IMAGE) && node.baseline) : []);
        const baseline = (images.length > 0 ? images : list.filter(node => node.is(NODE_STANDARD.TEXT) && node.baseline && !node.multiLine)).sort((a, b) => Math.max(a.bounds.height, a.lineHeight) >= Math.max(b.bounds.height, b.lineHeight) ? -1 : 1)[0];
        const nodeType = (text ? NODE_STANDARD.TEXT : NODE_STANDARD.IMAGE);
        if (baseline == null && parent != null) {
            const valid = Array.from(parent.element.children).some(element => {
                const node = getNode(element);
                if (node) {
                    return ((node.nodeType <= nodeType && node.baseline) || (node.linearHorizontal && node.children.some(item => item.nodeType <= nodeType && item.baseline)));
                }
                return false;
            });
            if (valid) {
                return list.slice().sort((a, b) => a.nodeType >= b.nodeType ? -1 : 1).find(node => node.nodeType <= nodeType && node.baseline);
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
                if (nodes.every((node, index) => node.inlineElement && (index === 0 || !isLineBreak(<HTMLElement> node.element.previousElementSibling)))) {
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

    private _currentId = 0;
    private _list: T[] = [];

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
        this._list = [];
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

    get top() {
        return Math.max.apply(null, this._list.map(node => node.linear.top));
    }
    get bottom() {
        return Math.max.apply(null, this._list.map(node => node.linear.bottom));
    }
    get right() {
        return Math.max.apply(null, this._list.map(node => node.linear.right));
    }
    get left() {
        return Math.max.apply(null, this._list.map(node => node.linear.left));
    }
}