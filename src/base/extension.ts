import { LayoutMap, ObjectMap, StringMap } from '../lib/types';
import { ExtensionDependency, ExtensionResult, IExtension } from '../extension/lib/types';
import Application from './application';
import Node from './node';
import { capitalize, convertCamelCase, includes, optional } from '../lib/util';

export default abstract class Extension<T extends Node> implements IExtension {
    public application: Application<T>;
    public node: T;
    public parent?: T;
    public element?: HTMLElement;
    public options: ObjectMap<any> = {};
    public tagNames: string[] = [];
    public enabled = true;
    public dependencies: ExtensionDependency[] = [];
    public documentRoot = false;

    constructor(
        public name: string,
        tagNames?: string[],
        options?: {})
    {
        if (Array.isArray(tagNames)) {
            this.tagNames = tagNames.map(value => value.trim().toUpperCase());
        }
        if (options != null) {
            Object.assign(this.options, options);
        }
    }

    public setTarget(node: T, parent?: T, element?: HTMLElement) {
        this.node = node;
        this.parent = parent;
        this.element = (element == null && this.node != null ? this.node.element : element);
    }

    public is(node: T) {
        return (node.hasElement && (this.tagNames.length === 0 || this.tagNames.includes(node.element.tagName)));
    }

    public require(value: string, init = false) {
        this.dependencies.push({ name: value, init });
    }

    public included(element?: HTMLElement) {
        if (element == null) {
            element = <HTMLElement> this.element;
        }
        return includes(optional(element, 'dataset.ext'), this.name);
    }

    public beforeInit(internal = false) {
        if (!internal && this.included()) {
            this.dependencies.filter(item => item.init).forEach(item => {
                const extension = this.application.findExtension(item.name);
                if (extension != null) {
                    extension.setTarget(this.node, this.parent, this.element);
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
            this.dependencies.filter(item => item.init).forEach(item => {
                const extension = this.application.findExtension(item.name);
                if (extension != null) {
                    extension.setTarget(this.node, this.parent, this.element);
                    extension.afterInit(true);
                }
            });
        }
    }

    public condition() {
        if (this.node && this.node.hasElement) {
            const extension: string = optional(this.node.element, 'dataset.ext');
            if (extension === '') {
                return (this.tagNames.length > 0);
            }
            else {
                return this.included();
            }
        }
        return false;
    }

    public processNode(mapX?: LayoutMap<T>, mapY?: LayoutMap<T>): ExtensionResult {
        return { xml: '' };
    }

    public processChild(mapX?: LayoutMap<T>, mapY?: LayoutMap<T>): ExtensionResult {
        return { xml: '' };
    }

    public afterRender() {
        return;
    }

    public beforeInsert() {
        return;
    }

    public afterInsert() {
        return;
    }

    public finalize() {
        return;
    }

    public getData(): StringMap {
        const element = this.element;
        const result = {};
        if (element != null) {
            const prefix = convertCamelCase(this.name, '\\.');
            for (const attr in element.dataset) {
                if (attr.length > prefix.length && attr.startsWith(prefix)) {
                    result[capitalize(attr.substring(prefix.length), false)] = element.dataset[attr];
                }
            }
        }
        return result;
    }
}