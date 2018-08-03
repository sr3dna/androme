import NodeList from '../base/nodelist';
import View from './view';
import { calculateBias } from './lib/util';

export default class ViewList<T extends View> extends NodeList<T> {
    constructor(
        nodes?: T[],
        parent?: T)
    {
        super(nodes, parent);
    }

    public slice() {
        return new ViewList(this.list.slice.apply(this.list, arguments));
    }

    public filter(callback: (item: T) => boolean) {
        return new ViewList(this.list.filter.call(this.list, callback));
    }

    get anchors() {
        return this.list.filter(node => node.anchored);
    }

    get horizontalBias() {
        if (this.parent != null && this.length > 0) {
            const left = Math.max(0, this.first.linear.left - this.parent.box.left);
            const right = Math.max(0, this.parent.box.right - this.last.linear.right);
            return calculateBias(left, right);
        }
        return 0.5;
    }
    get verticalBias() {
        if (this.parent != null && this.length > 0) {
            const top = Math.max(0, this.first.linear.top - this.parent.box.top);
            const bottom = Math.max(0, this.parent.box.bottom - this.last.linear.bottom);
            return calculateBias(top, bottom);
        }
        return 0.5;
    }
}