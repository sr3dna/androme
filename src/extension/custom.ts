import Node from '../base/node';
import Extension from '../base/extension';
import { NODE_STANDARD } from '../lib/enumeration';
import { EXT_NAME } from '../lib/constant';

export default abstract class Custom<T extends Node> extends Extension<T> {
    constructor(name: string, framework: number, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
        this.require(EXT_NAME.EXTERNAL, true);
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        const data = this.getData();
        let output = '';
        if (data.tag) {
            if (node.children.length > 0) {
                output = this.application.viewController.renderGroup(node, parent, data.tag);
            }
            else {
                output = this.application.viewController.renderNode(node, parent, data.tag);
            }
            node.nodeType = node.blockStatic ? NODE_STANDARD.BLOCK : NODE_STANDARD.INLINE;
        }
        if (data.tagChild) {
            node.each(item => {
                if (item.hasElement) {
                    item.dataset.ext = this.name;
                    item.dataset.andromeCustomTag = data.tagChild;
                }
            });
        }
        return { output, complete: false };
    }
}