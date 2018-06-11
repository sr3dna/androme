import Widget from './widget';
import WidgetList from './widgetlist';
import { WIDGET_ANDROID } from '../lib/constants';

export default class Layout extends Widget {
    constructor(id: number, node: Widget, parent: Widget | null, children: Widget[], actions?: number[]) {
        const options = {
            parent,
            depth: node.depth,
            parentOriginal: node.parentOriginal,
            actions
        };
        super(id, node.api, null, options);
        if (children != null) {
            this.children = new WidgetList(children);
        }
    }

    public setAndroidDimensions() {
        const [width, height] = this.childrenBox;
        const options = {
            parent: this.parentOriginal,
            width,
            height,
            requireWrap: this.parent.is(WIDGET_ANDROID.CONSTRAINT, WIDGET_ANDROID.GRID)
        };
        super.setAndroidDimensions(options);
    }
    public setBounds(calibrate = false) {
        const nodes = this.outerRegion;
        if (!calibrate) {
            this.bounds = {
                x: nodes.left[0].bounds.x,
                y: nodes.top[0].bounds.y,
                top: nodes.top[0].bounds.top,
                right: nodes.right[0].bounds.right,
                bottom: nodes.bottom[0].bounds.bottom,
                left: nodes.left[0].bounds.left,
                width: 0,
                height: 0
            };
            this.bounds.width = this.bounds.right - this.bounds.left;
            this.bounds.height = this.bounds.bottom - this.bounds.top;
        }
        this.linear = {
            top: nodes.top[0].linear.top,
            right: nodes.right[0].linear.right,
            bottom: nodes.bottom[0].linear.bottom,
            left: nodes.left[0].linear.left,
            width: 0,
            height: 0
        };
        this.box = {
            top: nodes.top[0].box.top,
            right: nodes.right[0].box.right,
            bottom: nodes.bottom[0].box.bottom,
            left: nodes.left[0].box.left,
            width: 0,
            height: 0
        };
        this.setDimensions();
    }
    public inheritGrid(node: Widget) {
        for (const attr in node) {
            if (attr.startsWith('grid')) {
                if (typeof node[attr] === 'number') {
                    this[attr] += node[attr];
                    node[attr] = 0;
                }
                else {
                    if (node[attr] !== false) {
                        this[attr] = node[attr];
                        node[attr] = false;
                    }
                }
            }
        }
    }

    get childrenBox() {
        let minLeft = Number.MAX_VALUE;
        let maxRight = Number.MIN_VALUE;
        let minTop = Number.MAX_VALUE;
        let maxBottom = Number.MIN_VALUE;
        for (const node of this.children) {
            minLeft = Math.min(node.bounds.left, minLeft);
            maxRight = Math.max(node.bounds.right, maxRight);
            minTop = Math.min(node.bounds.top, minTop);
            maxBottom = Math.max(node.bounds.bottom, maxBottom);
        }
        return [maxRight - minLeft, maxBottom - minTop];
    }
    get outerRegion() {
        const children = this.children;
        let top = [children[0]];
        let right = [children[0]];
        let bottom = [children[0]];
        let left = [children[0]];
        for (let i = 1; i < children.length; i++) {
            const node = children[i] as Widget;
            const nodeRight = node.label || node;
            if (top[0].bounds.top === node.bounds.top) {
                top.push(node);
            }
            else if (node.bounds.top < top[0].bounds.top) {
                top = [node];
            }
            if (right[0].bounds.right === nodeRight.bounds.right) {
                right.push(nodeRight);
            }
            else if (nodeRight.bounds.right > right[0].bounds.right) {
                right = [nodeRight];
            }
            if (bottom[0].bounds.bottom === node.bounds.bottom) {
                bottom.push(node);
            }
            else if (node.bounds.bottom > bottom[0].bounds.bottom) {
                bottom = [node];
            }
            if (left[0].bounds.left === node.bounds.left) {
                left.push(node);
            }
            else if (node.bounds.left < left[0].bounds.left) {
                left = [node];
            }
        }
        return { top, right, bottom, left, children };
    }
}