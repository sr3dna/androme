import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { convertAlpha, convertRoman } from '../lib/util';

type T = Node;
type U = NodeList<T>;

export default abstract class Lists extends Extension<T, U> {
    constructor(tagNames: string[], extension: string, options: {}) {
        super(tagNames, extension, options);
    }

    public condition(): boolean {
        return (
            super.condition() &&
            (this.node.children.every(node => node.tagName === 'LI') && this.node.children.some(node => node.css('display') === 'list-item' && node.css('listStyleType') !== 'none') && (this.linearX || this.linearY))
        );
    }

    public render(): string {
        let xml = '';
        if (this.linearY) {
            xml = this.application.writeGridLayout(this.node, this.parent, 2);
        }
        else {
            xml = this.application.writeLinearLayout(this.node, this.parent, this.linearY);
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
            node.options('extension.lists', { listStyle: ordinal });
        }
        return xml;
    }
}