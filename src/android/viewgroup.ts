import { Null } from '../lib/types';
import View from './view';

type T = View;

export default class ViewGroup extends View {
    constructor(
        id: number,
        node: T,
        parent: Null<T>,
        children: T[])
    {
        const options = {
            parent,
            depth: node.depth,
            parentOriginal: node.parentOriginal
        };
        super(id, node.api, null, options);
        if (children != null) {
            this.children = children;
        }
    }

    public setViewLayout() {
        super.setViewLayout.apply(this, this.childrenBox);
    }

    public setBounds(calibrate = false) {
        const nodes = this.outerRegion;
        if (!calibrate) {
            this.bounds = {
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

    public inheritGrid(node: T) {
        for (const attr in node) {
            if (attr.startsWith('grid')) {
                switch (typeof node[attr]) {
                    case 'number':
                        this[attr] += node[attr];
                        node[attr] = 0;
                        break;
                    case 'boolean':
                        if (node[attr] !== false) {
                            this[attr] = node[attr];
                            node[attr] = false;
                        }
                        break;
                    case 'object':
                        this[attr] = node[attr];
                        if (Array.isArray(node[attr])) {
                            node[attr] = [];
                        }
                        else {
                            node[attr] = null;
                        }
                        break;
                }
            }
        }
    }

    get childrenBox() {
        let minLeft = Number.MAX_VALUE;
        let maxRight = 0;
        let minTop = Number.MAX_VALUE;
        let maxBottom = 0;
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
            const node = children[i];
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