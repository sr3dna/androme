import { ExtensionResult } from './lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import { BLOCK_ELEMENT, NODE_STANDARD } from '../lib/constants';
import { EXT_NAME } from './lib/constants';

type T = Node;

export default class Custom extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
        this.require(EXT_NAME.EXTERNAL, true);
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = (<T> this.parent);
        const data = this.getData();
        let xml = '';
        if (data.tag) {
            if (node.children.length > 0) {
                xml = this.application.controllerHandler.renderGroup(node, parent, data.tag);
            }
            else {
                xml = this.application.controllerHandler.renderNode(node, parent, data.tag);
            }
            node.nodeType = (BLOCK_ELEMENT.includes(node.tagName) ? NODE_STANDARD.BLOCK : NODE_STANDARD.INLINE);
        }
        if (data.tagChild) {
            node.each(item => {
                item.element.dataset.ext = this.name;
                item.element.dataset.andromeCustomTag = data.tagChild;
            });
        }
        return { xml };
    }
}