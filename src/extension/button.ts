import Extension from '../base/extension';
import Node from '../base/node';

export default abstract class Button<T extends Node> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public is(node: T) {
        return (
            super.is(node) && (
                node.tagName !== 'INPUT' ||
                ['button', 'file', 'image', 'reset', 'search', 'submit'].includes((<HTMLInputElement> node.element).type)
            )
        );
    }

    public condition() {
        return this.included();
    }
}