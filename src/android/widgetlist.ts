import { calculateBias } from '../lib/util';
import Node from '../base/node';
import NodeList from '../base/nodelist';

export default class WidgetList<T extends Node> extends NodeList<T> {
    constructor(nodes: T[] = null, parent: T = null) {
        super(nodes, parent);
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
}