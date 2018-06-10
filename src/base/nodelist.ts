import { sortAsc, sortDesc } from '../lib/util';
import Node from './node';

export default class NodeList extends Array {
    private _parent: Node;

    constructor(nodes: Node[], parent: Node = null) {
        super();
        if (Array.isArray(nodes)) {
            this.push(...nodes);
        }
        this.parent = parent;
    }

    public push(...value: Node[]) {
        for (const node of value) {
            if (Node.is(node)) {
                super.push(node);
            }
        }
        return this.length;
    }

    public intersect(dimension = 'linear') {
        for (const node of this) {
            if (this.some(item => (item != node && node.intersect(item[dimension])))) {
                return true;
            }
        }
        return false;
    }
    public sortAsc(...attr: string[]) {
        return sortAsc(this, ...attr);
    }
    public sortDesc(...attr: string[]) {
        return sortDesc(this, ...attr);
    }

    set parent(value) {
        if (Node.is(value)) {
            this._parent = value;
        }
    }
    get parent() {
        return this._parent;
    }
    get visible() {
        return this.filter(node => node.visible);
    }
    get first() {
        return (this.length > 0 ? this[0] : null);
    }
    get last() {
        return (this.length > 0 ? this[this.length - 1] : null);
    }
    get linearX() {
        if (this.length > 0 && !this.intersect()) {
            if (this.length > 1) {
                const minBottom = this.reduce((a, b) => Math.min(a, b.linear.bottom), Number.MAX_VALUE);
                return !this.some(item => item.linear.top >= minBottom);
            }
            return true;
        }
        return false;
    }
    get linearY() {
        if (this.length > 0 && !this.intersect()) {
            if (this.length > 1) {
                const minRight = this.reduce((a, b) => Math.min(a, b.linear.right), Number.MAX_VALUE);
                return !this.some(item => item.linear.left >= minRight);
            }
            return true;
        }
        return false;
    }
}