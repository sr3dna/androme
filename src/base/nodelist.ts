import Node from './node';
import { sortAsc, sortDesc, withinRange } from '../lib/util';

export type FindPredicate<T> = (value: T, index?: number) => boolean;

export default class NodeList<T extends Node> implements Iterable<T> {
    public static intersect<T extends Node>(list: T[], dimension = 'linear') {
        return list.some(node => {
            if (list.some(item => item !== node && node.intersect(item[dimension]))) {
                return true;
            }
            return false;
        });
    }

    public static linearX<T extends Node>(list: T[], offset = 0) {
        const nodes = list.filter(node => !node.isolated);
        switch (nodes.length) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                const float = new Set();
                const valid = !nodes.some((node, index) => {
                    if (node.floating) {
                        float.add(node.float);
                    }
                    const clear = node.css('clear');
                    return (index > 0 && float.size > 0 && (clear === 'both' || float.has(clear)));
                });
                if (valid) {
                    const minTop = Math.min.apply(null, nodes.map(node => node.linear.top));
                    const maxBottom = Math.max.apply(null, nodes.filter(node => withinRange(node.linear.top, minTop, offset)).map(node => node.linear.bottom));
                    return nodes.every(node => node.linear.height > 0 && node.linear.top >= minTop && node.linear.bottom <= maxBottom);
                }
                return false;
        }
    }

    public static linearY<T extends Node>(list: T[]) {
        const nodes = list.filter(node => node.pageflow && !node.floating && !node.isolated);
        switch (nodes.length) {
            case 0:
                return false;
            case 1:
                return true;
            default:
                const minRight = Math.min.apply(null, nodes.map(node => node.linear.right));
                const maxRight = Math.max.apply(null, nodes.map(node => node.linear.right));
                return nodes.every((node, index) => {
                    if (node.linear.left < minRight) {
                        return true;
                    }
                    else {
                        const previous = nodes[index - 1];
                        if ((previous == null || (previous.pageflow && previous.inlineElement && previous.linear.right !== maxRight)) && node.inlineElement && node.pageflow && node.linear.right !== maxRight) {
                            return true;
                        }
                    }
                    return false;
                });
        }
    }

    private currentId = 0;
    private _list: T[] = [];

    constructor(
        nodes?: T[],
        public parent?: T)
    {
        if (Array.isArray(nodes)) {
            this._list = nodes;
        }
        this.parent = parent;
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
        this.currentId = 0;
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

    public intersect(dimension = 'linear') {
        return NodeList.intersect(this._list, dimension);
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
        return ++this.currentId;
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