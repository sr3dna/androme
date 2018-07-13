import { ExtensionResult } from '../lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { formatResource } from './lib/util';
import { EXT_NAME } from './lib/constants';

type T = Node;
type U = NodeList<T>;

export default class Custom extends Extension<T, U> {
    constructor(name: string, tagNames: string[] = [], options?: {}) {
        super(name, tagNames, options);
        this.require(EXT_NAME.EXTERNAL, true);
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = (<T> this.parent);
        const controller = this.application.controllerHandler;
        const data = this.getData();
        let xml = '';
        if (data.tag) {
            if (node.children.length > 0) {
                xml = controller.renderGroup(node, parent, data.tag);
            }
            else {
                xml = controller.renderNode(node, parent, data.tag);
            }
        }
        return { xml };
    }

    public afterInsert() {
        const node = this.node;
        const options = Object.assign({}, this.options[node.element.id]);
        node.apply(formatResource(options));
    }
}