import { ExtensionResult, IExtension, ObjectIndex, ObjectMap } from '../lib/types';
import Application from './application';
import Node from './node';
import NodeList from './nodelist';

export default abstract class Extension<T extends Node, U extends NodeList<T>> implements IExtension {
    public application: Application<T, U>;
    public node: T;
    public parent: T | null;
    public element: HTMLElement | null;
    public tagNames: string[] = [];
    public enabled = true;
    public dependences: {}[] = [];
    public activityMain = false;

    constructor(
        public name: string,
        tagNames: string[] = [],
        public options: ObjectMap<any> = {})
    {
        this.tagNames = tagNames.map(value => value.trim().toUpperCase());
    }

    public is(node: T) {
        return (this.tagNames.length === 0 || (this.tagNames.includes(node.tagName)));
    }

    public included(element?: HTMLElement) {
        if (element == null) {
            element = (<HTMLElement> this.element);
        }
        return (element != null && element.dataset && element.dataset.ext != null ? element.dataset.ext.split(',').map(value => value.trim()).includes(this.name) : false);
    }

    public beforeInit(internal = false) {
        if (!internal && this.included()) {
            this.dependences.filter((item: ObjectMap<boolean>) => item.init).forEach((item: any) => {
                const extension = this.application.findExtension(item.name);
                if (extension != null) {
                    extension.parent = this.parent;
                    extension.node = this.node;
                    extension.element = this.element;
                    extension.beforeInit(true);
                }
            });
        }
    }

    public init(element: HTMLElement) {
        return false;
    }

    public afterInit(internal = false) {
        if (!internal && this.included()) {
            this.dependences.filter((item: ObjectMap<boolean>) => item.init).forEach((item: any) => {
                const extension = this.application.findExtension(item.name);
                if (extension != null) {
                    extension.parent = this.parent;
                    extension.node = this.node;
                    extension.element = this.element;
                    extension.afterInit(true);
                }
            });
        }
    }

    public afterRender() {
        return;
    }

    public condition() {
        if (this.node && this.node.element.dataset != null) {
            if (!this.node.element.dataset.ext) {
                return (this.tagNames.length > 0);
            }
            else {
                const extensions = this.node.element.dataset.ext.split(',');
                return (this.tagNames.length === 0 && extensions.length > 1 ? false : this.included());
            }
        }
        return false;
    }

    public processNode(mapX?: ObjectIndex<{}>, mapY?: ObjectIndex<{}>): ExtensionResult {
        return ['', false, false];
    }

    public processChild(mapX?: ObjectIndex<{}>, mapY?: ObjectIndex<{}>): ExtensionResult {
        return ['', false, this.application.elements.has(this.node.element)];
    }

    public require(value: string, init = false) {
        this.dependences.push({ name: value, init });
    }

    public finalize() {
        return;
    }

    get linearX() {
        return (this.node != null ? NodeList.linearX(this.node.children) : false);
    }

    get linearY() {
        return (this.node != null ? NodeList.linearY(this.node.children) : false);
    }
}