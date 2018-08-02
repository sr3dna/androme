import { Null, ObjectIndex, ViewData } from '../lib/types';
import Node from './node';
import NodeList from './nodelist';
import { repeat } from '../lib/util';

export default abstract class Controller<T extends Node, U extends NodeList<T>> {
    public cache: U;

    private before: ObjectIndex<string[]> = {};
    private after: ObjectIndex<string[]> = {};

    constructor() {
    }

    public abstract addXmlNs(name: string, uri: string): void;
    public abstract setConstraints(): void;
    public abstract setDimensions(data: ViewData<T>): void;
    public abstract parseDimensions(content: string): string;
    public abstract setAttributes(data: ViewData<T>): void;
    public abstract insertAttributes(output: string, node: T): string;
    public abstract renderGroup(node: T, parent: T, nodeName: number | string, options?: {}): string;
    public abstract renderNode(node: T, parent: T, nodeName: number | string): string;
    public abstract renderNodeStatic(tagName: number | string, depth: number, options?: {}, width?: string, height?: string, node?: Null<T>, children?: boolean): string;
    public abstract renderInclude(node: T, parent: T, name: string): string;
    public abstract renderIncludeContent(name: string, content: string[]): string;
    public abstract getIncludeRenderDepth(name: string): number;
    public abstract createGroup(node: T, parent: T, children: T[]): T;

    public abstract get supportInline(): string[];
    public abstract get supportInclude(): boolean;

    public reset() {
        this.before = {};
        this.after = {};
    }

    public insertAuxillaryViews(output: string) {
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

    public hasAppendProcessing(id: number) {
        return (this.before[id] != null || this.after[id] != null);
    }

    protected getEnclosingTag(depth: number, tagName: string, id: number, xml = '', preXml = '', postXml = '') {
        const indent = repeat(Math.max(0, depth));
        let output = preXml +
                     `{<${id}}`;
        if (xml !== '') {
            output += indent + `<${tagName}${(depth === 0 ? '{#0}' : '')}{@${id}}>\n` +
                               xml +
                      indent + `</${tagName}>\n`;
        }
        else {
            output += indent + `<${tagName}${(depth === 0 ? '{#0}' : '')}{@${id}} />\n`;
        }
        output += `{>${id}}` +
                  postXml;
        return output;
    }
}