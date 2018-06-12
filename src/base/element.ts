import Node from './node';
import NodeList from './nodelist';
import { hasValue, padLeft } from '../lib/util';

export default abstract class Element<T extends Node, U extends NodeList<T>> {
    public abstract cache: U;

    constructor() {
    }

    public abstract renderLayout(node: T, parent: T, tagName: number, options?: {}): string;
    public abstract renderTag(node: T, parent: T, tagName: number): string;
    public abstract createWrapper(node: T, parent: T, children: U): T;
    public abstract getStaticTag(tagName: number, depth: number, options: {}, width: any, height: any): string[];
    public abstract replaceInlineAttributes(output: string, node: T, namespaces?: {}): string;
    public abstract getRootAttributes(options: {}): string;

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