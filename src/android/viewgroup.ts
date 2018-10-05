import { Constructor } from '../lib/types';
import Node from '../base/node';
import NodeGroup from '../base/nodegroup';
import View from './view';
import ViewBase from './viewbase';

type T = View;

export default class ViewGroup extends ViewBase(NodeGroup as Constructor<Node>) {
    constructor(
        id: number,
        node: T,
        parent: T,
        children: T[])
    {
        super(id);
        this.api = node.api;
        this.parent = parent;
        this.children = children;
        this.depth = node.depth;
        this.nodeName = `${node.nodeName}_GROUP`;
        this.documentParent = node.documentParent;
        if (children.length > 0) {
            this.init();
        }
    }
}