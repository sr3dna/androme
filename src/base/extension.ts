import { IExtension, ObjectIndex } from '../lib/types';
import Node from './node';
import NodeList from './nodelist';
import Application from './application';

export default abstract class Extension<T extends Node, U extends NodeList<T>> implements IExtension {
    public application: Application<T, U>;
    public node: T;
    public parent: T;
    public element: HTMLElement | undefined;
    public enabled: boolean = true;
    public tagNames: string[] = [];

    constructor(
        tagNames: string[] = [],
        public extension?: string,
        public options?: any)
    {
        this.tagNames = tagNames.map(value => value.toUpperCase());
    }

    public abstract render(mapX?: ObjectIndex, mapY?: ObjectIndex): string;

    public is(tagName: string) {
        return (this.tagNames.length === 0 || this.tagNames.includes(tagName));
    }

    public included(name?: string, element?: HTMLElement) {
        if (element == null) {
            element = this.element;
        }
        const extension = (this.extension || name || '').trim();
        return (element && element.dataset.extension && extension ? element.dataset.extension.split(',').map(value => value.trim()).includes(extension) : false);
    }

    public beforeInit() {
        return;
    }

    public init(element: HTMLElement) {
        return false;
    }

    public afterInit() {
        return;
    }

    public condition() {
        return (this.node.element && this.node.element.dataset && this.extension ? this.included(this.extension) : false);
    }

    public processNode() {
        return false;
    }

    public processChild(node: T): any[] {
        return ['', false];
    }

    get linearX() {
        return (this.node != null ? NodeList.linearX(this.node.children) : false);
    }

    get linearY() {
        return (this.node != null ? NodeList.linearY(this.node.children) : false);
    }
}