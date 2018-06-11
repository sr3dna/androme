import { hasValue, padLeft } from '../lib/util';

export default abstract class Element<T> {
    constructor() {
    }

    public abstract renderLayout(node: T, parent: T, tagName: string): string;
    public abstract renderTag(node: T, parent: T, tagName: string): string;
    public abstract getStaticTag(nodeName: string, depth: number, options: {}, width: any, height: any): any;

    protected getEnclosingTag(depth: number, tagName: string, id: number, content = '', preXml = '', postXml = '') {
        const indent = padLeft(depth);
        let xml = preXml +
                  `{<${id}}`;
        if (hasValue(content)) {
            xml += indent + `<${tagName}{@${id}}>\n` +
                            content +
                   indent + `</${tagName}>\n`;
        }
        else {
            xml += indent + `<${tagName}{@${id}} />\n`;
        }
        xml += `{>${id}}` +
               postXml;
        return xml;
    }
}