import Node from './node';
import { sortAsc, sortDesc } from '../lib/util';

export default abstract class NodeList<T extends Node> {
    public static intersect<T extends Node>(list: T[], dimension = 'linear') {
        list.forEach(node => {
            if (list.some(item => (item !== node && node.intersect(item[dimension])))) {
                return true;
            }
        });
        return false;
    }

    public static linearX<T extends Node>(list: T[]) {
        const nodes = list.filter(node => !node.isolated);
        if (nodes.length > 0 && !NodeList.intersect(nodes)) {
            if (nodes.length > 1) {
                const minBottom = Math.min.apply(null, nodes.map(node => node.linear.bottom));
                return !nodes.some(node => node.linear.top >= minBottom);
            }
            return true;
        }
        return false;
    }

    public static linearY<T extends Node>(list: T[]) {
        const nodes = list.filter(node => !node.isolated);
        if (nodes.length > 0 && !NodeList.intersect(nodes)) {
            if (nodes.length > 1) {
                const minRight = Math.min.apply(null, nodes.map(node => node.linear.right));
                return !nodes.some(node => node.linear.left >= minRight);
            }
            return true;
        }
        return false;
    }

    private static currentId: number = 0;
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

    public find(id: number) {
        return this._list.find(node => node.id === id) || null;
    }

    public reset() {
        NodeList.currentId = 0;
        this.clear();
    }

    public clear() {
        this._list = [];
    }

    public sortAsc(...attr: string[]) {
        return sortAsc<T>(this._list, ...attr);
    }

    public sortDesc(...attr: string[]) {
        return sortDesc<T>(this._list, ...attr);
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
        return this._list.filter(node => node.visible);
    }

    get elements() {
        return this._list.filter(node => node.hasElement);
    }

    get first() {
        return this._list[0];
    }
    get last() {
        return this._list[this._list.length - 1];
    }

    get nextId() {
        return ++NodeList.currentId;
    }

    get linearX() {
        return NodeList.linearX(this._list);
    }
    get linearY() {
        return NodeList.linearY(this._list);
    }
}