import { hasValue, padLeft } from '../lib/util';

export default abstract class Element<T> {
    constructor() {
    }

    public abstract renderLayout(node: T, parent: T, tagName: string): string;
    public abstract renderTag(node: T, parent: T, tagName: string): string;
    public abstract getStaticTag(nodeName: string, depth: number, options: {}, width: any, height: any): any;

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