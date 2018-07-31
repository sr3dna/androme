import Node from './node';
import { sortAsc, sortDesc } from '../lib/util';

export default abstract class NodeList<T extends Node> {
    public static intersect<T extends Node>(list: T[], dimension = 'linear') {
        list.forEach(node => {
            if (list.some(item => item !== node && node.intersect(item[dimension]))) {
                return true;
            }
        });
        return false;
    }

    public static linearX<T extends Node>(list: T[]) {
        const nodes = sortAsc(list.filter(node => !node.isolated), 'linear.top');
        if (nodes.length > 0 && !NodeList.intersect(nodes)) {
            if (nodes.length > 1) {
                const minTop = Math.min.apply(null, nodes.map(node => node.linear.top));
                const maxBottom = Math.max.apply(null, nodes.filter(node => node.linear.top === minTop).map(node => node.linear.bottom));
                return !nodes.some(node => !(node.linear.top >= minTop && node.linear.bottom <= maxBottom));
            }
            return true;
        }
        return false;
    }

    public static linearY<T extends Node>(list: T[]) {
        const nodes = sortAsc(list.filter(node => !node.isolated), 'linear.left');
        if (nodes.length > 0 && !NodeList.intersect(nodes)) {
            let valid = true;
            if (nodes.length > 1) {
                const minRight = Math.min.apply(null, nodes.map(node => node.linear.right));
                const maxRight = Math.max.apply(null, nodes.map(node => node.linear.right));
                nodes.forEach((node, index) => {
                    if (node.linear.left < minRight) {
                        return;
                    }
                    else {
                        const previous = nodes[index - 1];
                        if ((previous == null || (previous.pageflow && previous.inline && previous.linear.right !== maxRight)) && node.inline && node.pageflow && node.linear.right !== maxRight) {
                            return;
                        }
                    }
                    valid = false;
                });
            }
            return valid;
        }
        return false;
    }

    private static currentId = 0;
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

    public findByNodeId(id: string) {
        return this._list.find(node => node.nodeId === id) || null;
    }

    public reset() {
        NodeList.currentId = 0;
        this.clear();
    }

    public clear() {
        this._list = [];
    }

    public sortAsc(...attr: string[]) {
        sortAsc<T>(this._list, ...attr);
        return this;
    }

    public sortDesc(...attr: string[]) {
        sortDesc<T>(this._list, ...attr);
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
        return this._list.filter(node => node.visible);
    }

    get elements() {
        return this._list.filter(node => node.visible && node.hasElement);
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