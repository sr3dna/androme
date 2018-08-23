import { ExtensionResult } from './lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { convertAlpha, convertRoman } from '../lib/util';
import { EXT_NAME } from './lib/constants';

type T = Node;

export default abstract class List extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public condition() {
        return (
            super.condition() &&
            (this.node.children.some(node => node.display === 'list-item' && node.css('listStyleType') !== 'none') && (NodeList.linearX(this.node.children) || NodeList.linearY(this.node.children)))
        );
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        let xml = '';
        if (NodeList.linearY(node.children)) {
            xml = this.application.writeGridLayout(node, parent, 2);
        }
        else {
            xml = this.application.writeLinearLayout(node, parent, NodeList.linearY(node.children));
        }
        let i = 0;
        node.each((item: T) => {
            let ordinal = '0';
            if (item.display === 'list-item') {
                const listStyle = item.css('listStyleType');
                switch (listStyle) {
                    case 'disc':
                        ordinal = '●';
                        break;
                    case 'square':
                        ordinal = '■';
                        break;
                    case 'lower-alpha':
                    case 'lower-latin':
                        ordinal = `${convertAlpha(i).toLowerCase()}.`;
                        break;
                    case 'upper-alpha':
                    case 'upper-latin':
                        ordinal = `${convertAlpha(i)}.`;
                        break;
                    case 'lower-roman':
                        ordinal = `${convertRoman(i + 1).toLowerCase()}.`;
                        break;
                    case 'upper-roman':
                        ordinal = `${convertRoman(i + 1)}.`;
                        break;
                    default:
                        if (node.element.tagName === 'OL') {
                            ordinal = `${(listStyle === 'decimal-leading-zero' && i < 9 ? '0' : '') + (i + 1).toString()}.`;
                        }
                        else {
                            ordinal = '○';
                        }
                        break;
                }
                i++;
            }
            item.data(`${EXT_NAME.LIST}:listStyle`, ordinal);
        });
        return { xml };
    }
}