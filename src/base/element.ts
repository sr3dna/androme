import Node from './node';
import NodeList from './nodelist';
import { hasValue, padLeft } from '../lib/util';

export default abstract class Element<T extends Node, U extends NodeList<T>> {
    public abstract cache: U;

    constructor() {
    }

    public abstract renderLayout(node: T, parent: T, tagName: string): string;
    public abstract renderTag(node: T, parent: T, tagName: string): string;
    public abstract createWrapper(node: T, parent: T, children: U): T;
    public abstract getStaticTag(nodeName: string, depth: number, options: {}, width: any, height: any): string[];
    public abstract setInlineAttributes(output: string, node: T, namespaces?: {}): string;

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