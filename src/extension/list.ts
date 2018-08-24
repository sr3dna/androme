import { ExtensionResult } from './lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { convertAlpha, convertRoman } from '../lib/util';
import { EXT_NAME } from './lib/constants';
import { BOX_STANDARD, NODE_RESOURCE } from '../lib/constants';

type T = Node;

export default abstract class List extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public condition() {
        return (super.condition() && (
                    this.node.children.some(node => node.element.tagName === 'LI' && node.display === 'list-item' && (node.css('listStyleType') !== 'none' || this.hasSingleImage(node))) ||
                    this.node.children.every(node => node.element.tagName !== 'LI' && node.styleMap.listStyleType === 'none' && this.hasSingleImage(node))
               ));
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        let xml = '';
        if (!node.children.some(item => item.floating) && NodeList.linearY(node.children)) {
            xml = this.application.writeGridLayout(node, parent, 2);
        }
        else {
            xml = this.application.writeLinearLayout(node, parent, true);
        }
        let i = 0;
        let marginLeft = 0;
        node.each((item: T) => {
            let ordinal: any = '0';
            if (item.display === 'list-item' || item.styleMap.listStyleType != null) {
                const type = item.css('listStyleType');
                switch (type) {
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
                    case 'none':
                        let image = item.css('listStyleImage');
                        let position = '';
                        if (image === 'none') {
                            const repeat = item.css('backgroundRepeat');
                            if (repeat === 'no-repeat') {
                                image = item.css('backgroundImage');
                                position = item.css('backgroundPosition');
                            }
                        }
                        if (image !== 'none') {
                            ordinal = { image, position };
                            item.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
                        }
                        break;
                    default:
                        if (node.element.tagName === 'OL') {
                            ordinal = `${(type === 'decimal-leading-zero' && i < 9 ? '0' : '') + (i + 1).toString()}.`;
                        }
                        else {
                            ordinal = '○';
                        }
                        break;
                }
                marginLeft = Math.min(item.marginLeft);
                i++;
            }
            item.data(`${EXT_NAME.LIST}:listStyleType`, ordinal);
        });
        if (marginLeft < 0) {
            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, node.marginLeft + marginLeft);
        }
        return { xml };
    }

    private hasSingleImage(node: T) {
        return (node.css('backgroundImage') !== 'none' && node.css('backgroundRepeat') === 'no-repeat');
    }
}