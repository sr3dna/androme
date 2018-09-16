import { ControllerSettings, ObjectIndex, ViewData } from '../lib/types';
import Node from './node';
import NodeList from './nodelist';
import { repeat } from '../lib/util';

export default abstract class Controller<T extends Node> {
    public cache: NodeList<T>;

    private _before: ObjectIndex<string[]> = {};
    private _after: ObjectIndex<string[]> = {};

    constructor() {
    }

    public abstract addXmlNs(name: string, uri: string): void;
    public abstract createGroup(parent: T, node: T, children: T[]): T;
    public abstract renderGroup(node: T, parent: T, nodeName: number | string, options?: {}): string;
    public abstract renderNode(node: T, parent: T, nodeName: number | string): string;
    public abstract renderNodeStatic(nodeName: number | string, depth: number, options?: {}, width?: string, height?: string, node?: T, children?: boolean): string;
    public abstract renderInclude(node: T, parent: T, name: string): string;
    public abstract renderMerge(name: string, content: string[]): string;
    public abstract baseRenderDepth(name: string): number;
    public abstract setConstraints(): void;
    public abstract setDimensions(data: ViewData<NodeList<T>>): void;
    public abstract getEmptySpacer(nodeType: number, depth: number, width?: string, height?: string, columnSpan?: number): string;
    public abstract finalize(data: ViewData<NodeList<T>>): void;

    public abstract get supportInline(): string[];
    public abstract get supportInclude(): boolean;
    public abstract get settings(): ControllerSettings;

    public reset() {
        this._before = {};
        this._after = {};
    }

    public appendRenderQueue(output: string) {
        for (const id in this._before) {
            output = output.replace(`{<${id}}`, this._before[id].join(''));
        }
        for (const id in this._after) {
            output = output.replace(`{>${id}}`, this._after[id].join(''));
        }
        return output;
    }

    public prependBefore(id: number, xml: string, index = -1) {
        if (this._before[id] == null) {
            this._before[id] = [];
        }
        if (index !== -1 && index < this._before[id].length) {
            this._before[id].splice(index, 0, xml);
        }
        else {
            this._before[id].push(xml);
        }
    }

    public appendAfter(id: number, xml: string, index = -1) {
        if (this._after[id] == null) {
            this._after[id] = [];
        }
        if (index !== -1 && index < this._after[id].length) {
            this._after[id].splice(index, 0, xml);
        }
        else {
            this._after[id].push(xml);
        }
    }

    public hasAppendProcessing(id: number) {
        return (this._before[id] != null || this._after[id] != null);
    }

    protected getEnclosingTag(depth: number, controlName: string, id: number, xml = '', preXml = '', postXml = '') {
        const indent = repeat(Math.max(0, depth));
        let output = preXml +
                     `{<${id}}`;
        if (xml !== '') {
            output += indent + `<${controlName}${(depth === 0 ? '{#0}' : '')}{@${id}}>\n` +
                               xml +
                      indent + `</${controlName}>\n`;
        }
        else {
            output += indent + `<${controlName}${(depth === 0 ? '{#0}' : '')}{@${id}} />\n`;
        }
        output += `{>${id}}` +
                  postXml;
        return output;
    }
}