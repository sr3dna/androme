import { ExtensionResult } from './lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { convertAlpha, convertRoman } from '../lib/util';
import { EXT_NAME } from './lib/constants';

type T = Node;
type U = NodeList<T>;

export default abstract class List extends Extension<T, U> {
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
        const parent = (<T> this.parent);
        let xml = '';
        if (NodeList.linearY(node.children)) {
            xml = this.application.writeGridLayout(node, parent, 2);
        }
        else {
            xml = this.application.writeLinearLayout(node, parent, NodeList.linearY(node.children));
        }
        for (let i = 0, j = 0; i < node.children.length; i++) {
            const item = node.children[i];
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
                        ordinal = `${convertAlpha(j).toLowerCase()}.`;
                        break;
                    case 'upper-alpha':
                    case 'upper-latin':
                        ordinal = `${convertAlpha(j)}.`;
                        break;
                    case 'lower-roman':
                        ordinal = `${convertRoman(j + 1).toLowerCase()}.`;
                        break;
                    case 'upper-roman':
                        ordinal = `${convertRoman(j + 1)}.`;
                        break;
                    default:
                        if (node.tagName === 'OL') {
                            ordinal = `${(listStyle === 'decimal-leading-zero' && j < 9 ? '0' : '') + (j + 1).toString()}.`;
                        }
                        else {
                            ordinal = '○';
                        }
                }
                j++;
            }
            item.data(`${EXT_NAME.LIST}:listStyle`, ordinal);
        }
        return { xml };
    }
}