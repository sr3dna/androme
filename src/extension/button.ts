import Node from '../base/node';
import Extension from '../base/extension';

export default abstract class <T extends Node> extends Extension<T> {
    protected constructor(name: string, framework: number, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
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