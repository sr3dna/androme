import { ExtensionResult } from '../lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { convertAlpha, convertRoman } from '../lib/util';
import { EXT_NAME } from '../extension/lib/constants';

type T = Node;
type U = NodeList<T>;

export default abstract class List extends Extension<T, U> {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public condition() {
        return (
            super.condition() &&
            (this.node.children.every(node => node.tagName === 'LI') && this.node.children.some(node => node.css('display') === 'list-item' && node.css('listStyleType') !== 'none') && (NodeList.linearX(this.node.children) || NodeList.linearY(this.node.children)))
        );
    }

    public processNode(): ExtensionResult {
        let xml = '';
        if (NodeList.linearY(this.node.children)) {
            xml = this.application.writeGridLayout(this.node, (<T> this.parent), 2);
        }
        else {
            xml = this.application.writeLinearLayout(this.node, (<T> this.parent), NodeList.linearY(this.node.children));
        }
        for (let i = 0, j = 0; i < this.node.children.length; i++) {
            const node = this.node.children[i];
            let ordinal = '0';
            if (node.css('display') === 'list-item') {
                const listStyle = node.css('listStyleType');
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
                        if (this.node.tagName === 'OL') {
                            ordinal = `${(listStyle === 'decimal-leading-zero' && j < 9 ? '0' : '') && (j + 1).toString()}.`;
                        }
                        else {
                            ordinal = '○';
                        }
                }
                j++;
            }
            node.data(`${EXT_NAME.LIST}:listStyle`, ordinal);
        }
        return { xml };
    }
}