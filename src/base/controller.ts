import Node from './node';
import NodeList from './nodelist';
import { hasValue, padLeft } from '../lib/util';

interface ViewAppend {
    [id: number]: string[];
}

export default abstract class Controller<T extends Node, U extends NodeList<T>> {
    public cache: U;

    private before: ViewAppend = {};
    private after: ViewAppend = {};

    constructor() {
    }

    public abstract setConstraints(): void;
    public abstract setLayoutWeight(): void;
    public abstract setMarginPadding(): void;
    public abstract renderGroup(node: T, parent: T, viewName: number, options?: {}): string;
    public abstract renderView(node: T, parent: T, viewName: number | string): string;
    public abstract createGroup(node: T, parent: T, children: T[]): T;
    public abstract getViewStatic(tagName: number, depth: number, options?: {}, width?: string, height?: string): string[];
    public abstract getViewName(value: number): string;
    public abstract getRootAttributes(options: {}): string;
    public abstract replaceInlineAttributes(output: string, node: T, namespaces?: {}): string;

    public reset() {
        this.before = {};
        this.after = {};
    }

    public replaceAppended(output: string) {
        for (const id in this.before) {
            output = output.replace(`{<${id}}`, this.before[id].join(''));
        }
        for (const id in this.after) {
            output = output.replace(`{>${id}}`, this.after[id].join(''));
        }
        return output;
    }

    public prependBefore(id: number, xml: string, index = -1) {
        if (this.before[id] == null) {
            this.before[id] = [];
        }
        if (index !== -1 && index < this.before[id].length) {
            this.before[id].splice(index, 0, xml);
        }
        else {
            this.before[id].push(xml);
        }
    }

    public appendAfter(id: number, xml: string, index = -1) {
        if (this.after[id] == null) {
            this.after[id] = [];
        }
        if (index !== -1 && index < this.after[id].length) {
            this.after[id].splice(index, 0, xml);
        }
        else {
            this.after[id].push(xml);
        }
    }

    protected getEnclosingTag(depth: number, tagName: string, id: number, xml = '', preXml = '', postXml = '') {
        const indent = padLeft(depth);
        let output = preXml +
                     `{<${id}}`;
        if (hasValue(xml)) {
            output += indent + `<${tagName}{@${id}}{&${id}}>\n` +
                               xml +
                      indent + `</${tagName}>\n`;
        }
        else {
            output += indent + `<${tagName}{@${id}}{&${id}} />\n`;
        }
        output += `{>${id}}` +
                  postXml;
        return output;
    }
}