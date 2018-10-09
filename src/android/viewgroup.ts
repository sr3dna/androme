import View from './view';
import ViewBase from './viewbase';

type T = View;

export default class ViewGroup extends ViewBase(androme.lib.base.NodeGroup) {
    constructor(
        id: number,
        node: T,
        parent: T,
        children: T[])
    {
        super(id);
        this.api = node.api;
        this.parent = parent;
        this.depth = node.depth;
        this.nodeName = `${node.nodeName}_GROUP`;
        this.documentParent = node.documentParent;
        if (Array.isArray(children) && children.length > 0) {
            this.children = children;
            this.init();
        }
    }
}