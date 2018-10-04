import Node from './node';
import NodeList from './nodelist';
import { assignBounds, getNodeFromElement } from '../lib/dom';
import { NODE_ALIGNMENT, NODE_STANDARD } from './lib/constants';

export default abstract class NodeGroup<T extends Node> extends Node {
    constructor(
        id: number,
        element?: Element)
    {
        super(id, element);
    }

    public init() {
        super.init();
        this.children.forEach(item => {
            this.siblingIndex = Math.min(this.siblingIndex, item.siblingIndex);
            item.parent = this;
        });
        this.parent.sort();
        this.initial.children.push(...this.children.slice());
        this.setBounds();
        this.css('direction', this.documentParent.dir);
    }

    public setBounds(calibrate = false) {
        if (!calibrate) {
            const nodes = NodeList.outerRegion(this.children);
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
        this.box = assignBounds(this.bounds);
        this.setDimensions();
    }

    public previousSibling(pageflow = false, lineBreak = true, excluded = true) {
        return this.children.length > 0 ? this.children[0].previousSibling(pageflow, lineBreak, excluded) : null;
    }

    public nextSibling(pageflow = false, lineBreak = true, excluded = true) {
        return this.children.length > 0 ? this.children[this.children.length - 1].nextSibling(pageflow, lineBreak, excluded) : null;
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
        return this.hasAlign(NODE_ALIGNMENT.SEGMENTED);
    }

    get inlineStatic() {
        return this.children.every(node => node.inlineStatic);
    }

    get blockStatic() {
        return this.children.every(node => node.blockStatic);
    }

    get floating() {
        return this.hasAlign(NODE_ALIGNMENT.FLOAT);
    }

    get float() {
        if (this.floating) {
            return this.hasAlign(NODE_ALIGNMENT.RIGHT) ? 'right' : 'left';
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
            return (
                this.of(NODE_STANDARD.CONSTRAINT, NODE_ALIGNMENT.PERCENT) || this.children.every(node => node.blockStatic) ? 'block'
                                                                                                                           : this.children.every(node => node.inline) ? 'inline' : 'inline-block'
            );
        }
    }

    get baseElement() {
        function cascade(nodes: T[]) {
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
}