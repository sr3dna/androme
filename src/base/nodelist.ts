import Node from './node';
import { sortAsc, sortDesc } from '../lib/util';

export default abstract class NodeList<T extends Node> extends Array {
    constructor(
        nodes?: T[],
        public parent?: T)
    {
        super();
        if (Array.isArray(nodes)) {
            this.push(...nodes);
        }
        this.parent = parent;
    }

    public push(...value: T[]) {
        for (const node of value) {
            super.push(node);
        }
        return this.length;
    }

    public sortAsc(...attr: string[]) {
        return sortAsc<T>(this, ...attr);
    }

    public sortDesc(...attr: string[]) {
        return sortDesc<T>(this, ...attr);
    }

    public intersect(dimension = 'linear') {
        for (const node of this) {
            if (this.some(item => (item !== node && node.intersect(item[dimension])))) {
                return true;
            }
        }
        return false;
    }

    get visible() {
        return this.filter(node => node.visible);
    }
    get elements() {
        return this.filter(node => node.element != null);
    }
    get first() {
        return (this.length > 0 ? this[0] : null);
    }
    get last() {
        return (this.length > 0 ? this[this.length - 1] : null);
    }
    get nextId() {
        return this.length + 1;
    }
    get linearX() {
        if (this.length > 0 && !this.intersect()) {
            if (this.length > 1) {
                const minBottom = Math.min.apply(null, this.map((item: Node) => item.linear.bottom));
                return !this.some(item => item.linear.top >= minBottom);
            }
            return true;
        }
        return false;
    }
    get linearY() {
        if (this.length > 0 && !this.intersect()) {
            if (this.length > 1) {
                const minRight = Math.min.apply(null, this.map((item: Node) => item.linear.right));
                return !this.some(item => item.linear.left >= minRight);
            }
            return true;
        }
        return false;
    }
}