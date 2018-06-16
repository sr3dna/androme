import Node from './node';
import NodeList from './nodelist';
import { hasValue, padLeft } from '../lib/util';

interface IViewAppend {
    [id: number]: string[];
}

export default abstract class View<T extends Node, U extends NodeList<T>> {
    public abstract cache: U;

    private before: IViewAppend = {};
    private after: IViewAppend = {};

    constructor() {
    }

    public abstract setConstraints(): void;
    public abstract setLayoutWeight(): void;
    public abstract setMarginPadding(): void;
    public abstract renderLayout(node: T, parent: T, viewName: number, options?: {}): string;
    public abstract renderTag(node: T, parent: T, viewName: number | string): string;
    public abstract createBundle(node: T, parent: T, children: U): T;
    public abstract getStaticTag(tagName: number, depth: number, options: {}, width: any, height: any): string[];
    public abstract getViewName(value: number): string;
    public abstract getRootAttributes(options: {}): string;
    public abstract replaceInlineAttributes(output: string, node: T, namespaces?: {}): string;

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
            output += indent + `<${tagName}{@${id}}>\n` +
                               xml +
                      indent + `</${tagName}>\n`;
        }
        else {
            output += indent + `<${tagName}{@${id}} />\n`;
        }
        output += `{>${id}}` +
                  postXml;
        return output;
    }
}