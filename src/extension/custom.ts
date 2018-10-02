import { ExtensionResult } from './lib/types';
import Node from '../base/node';
import Extension from '../base/extension';
import { NODE_STANDARD } from '../lib/constants';
import { EXT_NAME } from './lib/constants';

export default abstract class Custom<T extends Node> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
        this.require(EXT_NAME.EXTERNAL, true);
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        const data = this.getData();
        let xml = '';
        if (data.tag) {
            if (node.children.length > 0) {
                xml = this.application.Controller.renderGroup(node, parent, data.tag);
            }
            else {
                xml = this.application.Controller.renderNode(node, parent, data.tag);
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
        return { xml, complete: false };
    }
}