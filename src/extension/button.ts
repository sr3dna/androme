import Extension from '../base/extension';
import Node from '../base/node';
import { getStyle, setElementCache } from '../lib/dom';

export default abstract class Button<T extends Node> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public is(node: T) {
        return (super.is(node) && (node.element.tagName !== 'INPUT' || ['button', 'file', 'image', 'reset', 'search', 'submit'].includes((<HTMLInputElement> node.element).type)));
    }

    public init(element: HTMLElement) {
        if (this.included(element)) {
            const position = getStyle(element).position;
            setElementCache(element, 'nodeIsolated', (position !== 'static' && position !== 'initial'));
        }
        return false;
    }

    public condition() {
        return this.included();
    }
}