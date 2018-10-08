import Node from './node';
import Application from './application';
import { capitalize, convertCamelCase, includes } from '../lib/util';

export default abstract class Extension<T extends Node> implements androme.lib.base.Extension<T> {
    public application: Application<T>;
    public node: T;
    public parent?: T;
    public element?: Element;
    public options: ObjectMap<any> = {};
    public tagNames: string[] = [];
    public documentRoot = false;
    public readonly dependencies: ExtensionDependency[] = [];
    public readonly subscribers = new Set<T>();
    public readonly subscribersChild = new Set<T>();

    protected constructor(
        public readonly name: string,
        public readonly framework: number,
        tagNames?: string[],
        options?: {})
    {
        if (Array.isArray(tagNames)) {
            this.tagNames = tagNames.map(value => value.trim().toUpperCase());
        }
        if (options) {
            Object.assign(this.options, options);
        }
    }

    public setTarget(node: T, parent?: T, element?: HTMLElement) {
        this.node = node;
        this.parent = parent;
        this.element = element || this.node.element;
    }

    public is(node: T) {
        return node.hasElement && (this.tagNames.length === 0 || this.tagNames.includes(node.tagName));
    }

    public require(value: string, init = false) {
        this.dependencies.push({ name: value, init });
    }

    public included(element?: HTMLElement) {
        if (!element) {
            element = <HTMLElement> this.element;
        }
        return element ? includes(element.dataset.ext, this.name) : false;
    }

    public beforeInit(internal = false) {
        if (!internal && this.included()) {
            this.dependencies
                .filter(item => item.init)
                .forEach(item => {
                    const ext = this.application.getExtension(item.name);
                    if (ext) {
                        ext.setTarget(this.node, this.parent, <HTMLElement> this.element);
                        ext.beforeInit(true);
                    }
                });
        }
    }

    public init(element: HTMLElement) {
        return false;
    }

    public afterInit(internal = false) {
        if (!internal && this.included()) {
            this.dependencies
                .filter(item => item.init)
                .forEach(item => {
                    const ext = this.application.getExtension(item.name);
                    if (ext) {
                        ext.setTarget(this.node, this.parent, <HTMLElement> this.element);
                        ext.afterInit(true);
                    }
                });
        }
    }

    public condition() {
        const node = this.node;
        if (node && node.element instanceof HTMLElement) {
            const ext = node.dataset.ext;
            if (!ext) {
                return this.tagNames.length > 0;
            }
            else {
                return this.included();
            }
        }
        return false;
    }

    public processNode(mapX?: LayoutMapX<T>, mapY?: LayoutMapY<T>): ExtensionResult {
        return { output: '', complete: false };
    }

    public processChild(mapX?: LayoutMapX<T>, mapY?: LayoutMapY<T>): ExtensionResult {
        return { output: '', complete: false };
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
        const result = {};
        if (this.element instanceof HTMLElement) {
            const prefix = convertCamelCase(this.name, '\\.');
            for (const attr in this.element.dataset) {
                if (attr.length > prefix.length && attr.startsWith(prefix)) {
                    result[capitalize(attr.substring(prefix.length), false)] = this.element.dataset[attr];
                }
            }
        }
        return result;
    }
}