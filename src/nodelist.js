import { sortAsc, sortDesc, calculateBias } from './lib/util';
import Node from './node';

export default class NodeList extends Array {
    constructor(nodes, parent = null) {
        super();
        if (Array.isArray(nodes)) {
            this.push(...nodes);
        }
        this.parent = parent;
    }
    push(...value) {
        for (const node of value) {
            if (Node.is(node)) {
                if (node.children == null) {
                    node.children = new NodeList(null, node);
                }
                if (node.linearRows == null) {
                    node.linearRows = new NodeList(null, node);
                }
                if (node.renderChildren == null) {
                    node.renderChildren = new NodeList(null, node);
                }
                super.push(node);
            }
        }
        return this.length;
    }

    android(name, value, overwrite = true) {
        this.forEach(node => node.android(name, value, overwrite));
    }
    intersect(dimension = 'linear') {
        for (const node of this) {
            if (this.some(item => (item != node && node.intersect(item[dimension])))) {
                return true;
            }
        }
        return false;
    }
    findById(androidId) {
        return this.find(node => node.android('id') == androidId);
    }
    sortAsc(...attr) {
        return sortAsc(this, ...attr);
    }
    sortDesc(...attr) {
        return sortDesc(this, ...attr);
    }

    get first() {
        return (this.length > 0 ? this[0] : null);
    }
    get last() {
        return (this.length > 0 ? this[this.length - 1] : null);
    }
    set parent(value) {
        if (Node.is(value)) {
            this._parent = value;
        }
    }
    get parent() {
        return this._parent;
    }
    get visible () {
        return this.filter(node => node.visible);
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
    get anchors() {
        return this.filter(node => node.anchored);
    }
    get horizontalBias() {
        if (this.parent != null) {
            const left = this.first.linear.left - this.parent.box.left;
            const right = this.parent.box.right - this.last.linear.right;
            return calculateBias(left, right);
        }
        return 0.5;
    }
    get verticalBias() {
        if (this.parent != null) {
            const top = this.first.linear.top - this.parent.box.top;
            const bottom = this.parent.box.bottom - this.last.linear.bottom;
            return calculateBias(top, bottom);
        }
        return 0.5;
    }

    static is(nodes) {
        return (nodes != null && nodes instanceof NodeList);
    }
}