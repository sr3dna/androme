import { Null } from '../lib/types';
import View from './view';
import { NODE_ALIGNMENT, NODE_STANDARD } from '../lib/constants';
import { assignBounds, getNodeFromElement } from '../lib/dom';

export default class ViewGroup<T extends View> extends View {
    public baseNode: T;

    constructor(
        id: number,
        node: T,
        parent: T,
        children: T[])
    {
        super(id, node.api);
        this.baseNode = node;
        this.parent = parent;
        this.children = children;
        this.depth = node.depth;
        this.nodeName = `${node.nodeName}_GROUP`;
        this.documentParent = node.documentParent;
        if (children.length > 0) {
            this.init();
        }
    }

    public init() {
        super.init();
        this.children.forEach(item => {
            this.siblingIndex = Math.min(this.siblingIndex, item.siblingIndex);
            item.parent = this;
        });
        this.parent.sort();
        this.setBounds();
        this.css('direction', this.documentParent.dir);
    }

    public setLayout() {
        super.setLayout.apply(this, this.childrenBox);
    }

    public setBounds(calibrate = false) {
        if (!calibrate) {
            const nodes = this.outerRegion();
            this.bounds = {
                top: nodes.top[0].linear.top,
                right: nodes.right[0].linear.right,
                bottom: nodes.bottom[0].linear.bottom,
                left: nodes.left[0].linear.left,
                width: 0,
                height: 0
            };
            this.bounds.width = this.bounds.right - this.bounds.left;
            this.bounds.height = this.bounds.bottom - this.bounds.top;
        }
        this.linear = assignBounds(this.bounds);
        this.box  = assignBounds(this.bounds);
        this.setDimensions();
    }

    public previousSibling(pageflow = false, lineBreak = false) {
        return (this.children.length > 0 ? this.children[0].previousSibling(pageflow, lineBreak) : null);
    }

    public nextSibling(pageflow = false, lineBreak = false) {
        return (this.children.length > 0 ? this.children[this.children.length - 1].nextSibling(pageflow, lineBreak) : null);
    }

    get inline() {
        return this.children.every(node => node.inline);
    }

    get pageflow() {
        return this.children.every(node => node.pageflow);
    }

    get siblingflow() {
        return this.children.every(node => node.siblingflow);
    }

    get inlineElement() {
        return this.hasBit('alignmentType', NODE_ALIGNMENT.SEGMENTED);
    }

    get inlineStatic() {
        return this.children.every(node => node.inlineStatic);
    }

    get blockStatic() {
        return this.children.every(node => node.blockStatic);
    }

    get floating() {
        return this.hasBit('alignmentType', NODE_ALIGNMENT.FLOAT);
    }

    get float() {
        if (this.floating) {
            return (this.hasBit('alignmentType', NODE_ALIGNMENT.RIGHT) ? 'right' : 'left');
        }
        return 'none';
    }

    get baseline() {
        return this.children.every(node => node.baseline);
    }

    get multiLine() {
        return this.children.some(node => node.multiLine);
    }

    get display() {
        if (this.has('display')) {
            return this.css('display');
        }
        else {
            return (this.of(NODE_STANDARD.CONSTRAINT, NODE_ALIGNMENT.INLINE_WRAP) || this.children.some(node => (node.block && !node.floating)) ? 'block' : (this.children.every(node => node.inline) ? 'inline' : 'inline-block'));
        }
    }

    get baseElement() {
        function cascade(nodes: T[]): Null<Element> {
            for (let i = 0; i < nodes.length; i++) {
                const item = nodes[i] as T;
                if (item.hasElement || item.plainText) {
                    return item.element;
                }
                else if (item.length > 0) {
                    const element = cascade(item.nodes as T[]);
                    if (element != null) {
                        return element;
                    }
                }
            }
            return null;
        }
        return cascade(this.nodes as T[]) || super.baseElement;
    }

    get firstElementChild() {
        const element = this.documentParent.element;
        if (element instanceof HTMLElement) {
            for (let i = 0; i < element.childNodes.length; i++) {
                const childElement = <Element> element.childNodes[i];
                if (this.nodes.includes(getNodeFromElement(childElement) as T)) {
                    return childElement;
                }
            }
        }
        return null;
    }

    get lastElementChild() {
        const element = this.baseElement;
        if (element instanceof HTMLElement) {
            for (let i = element.childNodes.length - 1; i >= 0; i--) {
                const childElement = <Element> element.childNodes[i];
                if (this.nodes.includes(getNodeFromElement(childElement) as T)) {
                    return childElement;
                }
            }
        }
        return null;
    }

    get childrenBox() {
        let minLeft = Number.MAX_VALUE;
        let maxRight = 0;
        let minTop = Number.MAX_VALUE;
        let maxBottom = 0;
        for (const node of this.children) {
            minLeft = Math.min(node.linear.left, minLeft);
            maxRight = Math.max(node.linear.right, maxRight);
            minTop = Math.min(node.linear.top, minTop);
            maxBottom = Math.max(node.linear.bottom, maxBottom);
        }
        return [maxRight - minLeft, maxBottom - minTop];
    }

    public outerRegion(dimension = 'linear') {
        let top: T[] = [];
        let right: T[] = [];
        let bottom: T[] = [];
        let left: T[] = [];
        const nodes = this.children.slice();
        this.each(node => {
            if (node.companion != null) {
                nodes.push(node.companion as T);
            }
        });
        nodes.forEach((node: T, index) => {
            if (index === 0) {
                top.push(node);
                right.push(node);
                bottom.push(node);
                left.push(node);
            }
            else {
                if (top[0][dimension].top === node[dimension].top) {
                    top.push(node);
                }
                else if (node[dimension].top < top[0][dimension].top) {
                    top = [node];
                }
                if (right[0][dimension].right === node[dimension].right) {
                    right.push(node);
                }
                else if (node[dimension].right > right[0][dimension].right) {
                    right = [node];
                }
                if (bottom[0][dimension].bottom === node[dimension].bottom) {
                    bottom.push(node);
                }
                else if (node[dimension].bottom > bottom[0][dimension].bottom) {
                    bottom = [node];
                }
                if (left[0][dimension].left === node[dimension].left) {
                    left.push(node);
                }
                else if (node[dimension].left < left[0][dimension].left) {
                    left = [node];
                }
            }
        });
        return { top, right, bottom, left };
    }
}