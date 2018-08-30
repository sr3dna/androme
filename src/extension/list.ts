import { ExtensionResult } from './lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { convertAlpha, convertRoman } from '../lib/util';
import { EXT_NAME } from './lib/constants';
import { BOX_STANDARD, NODE_RESOURCE } from '../lib/constants';

export default abstract class List<T extends Node> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public condition() {
        const children = this.node.children;
        return (super.condition() && children.length > 0 && (children.every(node => node.inlineElement || node.display === 'list-item') || children.every(node => !node.inlineElement)) && (
                    children.some((node: T) => node.display === 'list-item' && (node.css('listStyleType') !== 'none' || this.hasSingleImage(node))) ||
                    children.every((node: T) => node.element.tagName !== 'LI' && node.styleMap.listStyleType === 'none' && this.hasSingleImage(node))
               ));
    }

    public processNode(): ExtensionResult {
        let xml = '';
        const parent = this.parent;
        if (parent) {
            const node = this.node;
            const vertical = (!node.children.some(item => item.floating) && (NodeList.linearY(node.children) || node.children.every(item => !item.inlineElement)));
            if (vertical) {
                xml = this.application.writeGridLayout(node, parent, (node.children.some(item => item.css('listStylePosition') === 'inside') ? 3 : 2));
            }
            else {
                xml = this.application.writeLinearLayout(node, parent, true);
            }
            let i = 0;
            node.each((item: T) => {
                let ordinal: any = '0';
                if (item.display === 'list-item' || item.has('listStyleType')) {
                    let image = item.css('listStyleImage');
                    if (image && image !== 'none') {
                        ordinal = { image, position: '' };
                    }
                    else {
                        switch (item.css('listStyleType')) {
                            case 'disc':
                                ordinal = '●';
                                break;
                            case 'square':
                                ordinal = '■';
                                break;
                            case 'decimal':
                                ordinal = `${(i + 1).toString()}.`;
                                break;
                            case 'decimal-leading-zero':
                                ordinal = `${(i < 9 ? '0' : '') + (i + 1).toString()}.`;
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
                                image = '';
                                let position = '';
                                const repeat = item.css('backgroundRepeat');
                                if (repeat === 'no-repeat') {
                                    image = item.css('backgroundImage');
                                    position = item.css('backgroundPosition');
                                }
                                if (image && image !== 'none') {
                                    ordinal = { image, position };
                                    item.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
                                }
                                break;
                            default:
                                ordinal = '○';
                                break;
                        }
                    }
                    i++;
                }
                item.data(EXT_NAME.LIST, 'listStyleType', ordinal);
            });
        }
        return { xml };
    }

    public beforeInsert() {
        this.node.modifyBox(BOX_STANDARD.MARGIN_LEFT, 0);
        this.node.modifyBox(BOX_STANDARD.PADDING_LEFT, 0);
    }

    private hasSingleImage(node: T) {
        return (node.css('backgroundImage') !== 'none' && node.css('backgroundRepeat') === 'no-repeat');
    }
}