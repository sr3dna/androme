import { ExtensionResult, IExtension, ObjectIndex, ObjectMap } from '../lib/types';
import Application from './application';
import Node from './node';
import NodeList from './nodelist';

export default abstract class Extension<T extends Node, U extends NodeList<T>> implements IExtension {
    public application: Application<T, U>;
    public node: T;
    public parent: T | undefined;
    public element: HTMLElement | undefined;
    public tagNames: string[] = [];
    public enabled: boolean = true;
    public dependencies: Set<string> = new Set();

    constructor(
        public name: string,
        tagNames: string[] = [],
        public options: ObjectMap<any> = {})
    {
        this.tagNames = tagNames.map(value => value.trim().toUpperCase());
    }

    public is(tagName: string) {
        return (this.tagNames.length === 0 || this.tagNames.includes(tagName));
    }

    public included(element?: HTMLElement) {
        if (element == null) {
            element = this.element;
        }
        return (element != null && element.dataset && element.dataset.extension != null ? element.dataset.extension.split(',').map(value => value.trim()).includes(this.name) : false);
    }

    public beforeInit() {
        this.dependencies.forEach(value => {
            const extension = this.application.extensions.find(item => item.name === value);
            if (extension != null) {
                extension.application = this.application;
                extension.element = this.element;
                extension.parent = this.parent;
                extension.beforeInit();
            }
        });
    }

    public init(element: HTMLElement) {
        return false;
    }

    public afterInit() {
        this.dependencies.forEach(value => {
            const extension = this.application.extensions.find(item => item.name === value);
            if (extension != null) {
                extension.application = this.application;
                extension.element = this.element;
                extension.parent = this.parent;
                extension.afterInit();
            }
        });
    }

    public afterRender() {
        return;
    }

    public condition() {
        if (this.node.element.dataset != null) {
            if (!this.node.element.dataset.extension) {
                return (this.tagNames.length > 0);
            }
            else {
                const extensions = this.node.element.dataset.extension.split(',');
                return (this.tagNames.length === 0 && extensions.length > 1 ? false : this.included());
            }
        }
        return false;
    }

    public processNode(mapX?: ObjectIndex<{}>, mapY?: ObjectIndex<{}>): ExtensionResult {
        return ['', false];
    }

    public processChild(mapX?: ObjectIndex<{}>, mapY?: ObjectIndex<{}>): ExtensionResult {
        return ['', false];
    }

    public require(value: string) {
        this.dependencies.add(value.trim());
    }

    public finalize(views: string[]) {
        return;
    }

    get linearX() {
        return (this.node != null ? NodeList.linearX(this.node.children) : false);
    }

    get linearY() {
        return (this.node != null ? NodeList.linearY(this.node.children) : false);
    }
}