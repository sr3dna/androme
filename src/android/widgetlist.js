import { calculateBias } from '../lib/util';
import NodeList from '../base/nodelist';

export default class WidgetList extends NodeList {
    constructor(nodes, parent = null) {
        super(nodes, parent);
    }

    push(...value) {
        for (const node of value) {
            if (node.children == null) {
                node.children = new WidgetList(null, node);
            }
            if (node.linearRows == null) {
                node.linearRows = new WidgetList(null, node);
            }
            if (node.renderChildren == null) {
                node.renderChildren = new WidgetList(null, node);
            }
        }
        return super.push(...value);
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