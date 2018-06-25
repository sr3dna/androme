import { ObjectIndex } from '../lib/types';
import Node from './node';
import NodeList from './nodelist';
import Application from './application';

export default abstract class Extension<T extends Node, U extends NodeList<T>> {
    public application: Application<T, U>;
    public node: T;
    public parent: T;
    public enabled: boolean = true;

    protected tagNames: string[];

    constructor(
        tagNames: string[],
        public extension?: string,
        public options?: any)
    {
        this.tagNames = tagNames.map(value => value.toUpperCase());
    }

    public abstract render(mapX?: ObjectIndex, mapY?: ObjectIndex): string;

    public is(tagName: string) {
        return (this.tagNames.length === 0 || this.tagNames.includes(tagName));
    }

    public condition() {
        return (this.node.element && this.node.element.dataset != null ? (this.node.element.dataset.extension == null || this.node.element.dataset.extension === this.extension) : false);
    }

    public processNode() {
        return false;
    }

    public processChild(node: T): any[] {
        return ['', false];
    }

    get linearX() {
        return NodeList.linearX(this.node.children);
    }

    get linearY() {
        return NodeList.linearY(this.node.children);
    }
}