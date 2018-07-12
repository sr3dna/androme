import { ExtensionDependency, ExtensionResult, IExtension, Null, ObjectIndex, ObjectMap, StringMap } from '../lib/types';
import Application from './application';
import Node from './node';
import NodeList from './nodelist';
import { capitalize, convertCamelCase, includes, optional } from '../lib/util';
import { VIEW_RESOURCE } from '../lib/constants';

export default abstract class Extension<T extends Node, U extends NodeList<T>> implements IExtension {
    public application: Application<T, U>;
    public node: T;
    public parent: Null<T>;
    public element: Null<HTMLElement>;
    public options: ObjectMap<any> = {};
    public tagNames: string[] = [];
    public enabled = true;
    public dependencies: ExtensionDependency[] = [];
    public activityMain = false;

    constructor(
        public name: string,
        tagNames?: string[],
        options?: ObjectMap<any>)
    {
        if (Array.isArray(tagNames)) {
            this.tagNames = tagNames.map(value => value.trim().toUpperCase());
        }
        if (options != null) {
            Object.assign(this.options, options);
        }
    }

    public setTarget(node: T, parent?: Null<T>, element?: Null<HTMLElement>) {
        this.node = (<T> node);
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
            element = (<HTMLElement> this.element);
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
            const ext = optional(this.node.element, 'dataset.ext');
            if (ext === '') {
                return (this.tagNames.length > 0);
            }
            else {
                return this.included();
            }
        }
        return false;
    }

    public processNode(mapX?: ObjectIndex<ObjectIndex<T[]>>, mapY?: ObjectIndex<ObjectIndex<T[]>>): ExtensionResult {
        return { xml: '' };
    }

    public processChild(mapX?: ObjectIndex<ObjectIndex<T[]>>, mapY?: ObjectIndex<ObjectIndex<T[]>>): ExtensionResult {
        return { xml: '' };
    }

    public afterRender() {
        return;
    }

    public insert() {
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

    public getIgnoreResource() {
        const element = this.element;
        let result = 0;
        if (element != null && element.dataset.ignoreResource != null) {
            element.dataset.ignoreResource.split('|').map(value => value.toUpperCase().trim()).forEach(value => {
                if (VIEW_RESOURCE[value] != null) {
                    result |= VIEW_RESOURCE[value];
                }
            });
        }
        return result;
    }
}