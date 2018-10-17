import { ListData } from './types/data';

import { BOX_STANDARD, NODE_RESOURCE } from '../lib/enumeration';
import { EXT_NAME } from '../lib/constant';

import Node from '../base/node';
import NodeList from '../base/nodelist';
import Extension from '../base/extension';

import { convertAlpha, convertRoman } from '../lib/util';

export default abstract class List<T extends Node> extends Extension<T> {
    public condition() {
        const children = this.node.children;
        return (
            super.condition() &&
            children.length > 0 && (
                children.every(item => item.blockStatic) ||
                children.every(item => item.inlineElement) ||
                (children.every(item => item.floating) && NodeList.floated(children).size === 1) ||
                children.every((item, index) => !item.floating && (index === 0 || index === children.length - 1 || item.blockStatic || (item.inlineElement && children[index - 1].blockStatic && children[index + 1].blockStatic)))
            ) && (
                children.some((item: T) => item.display === 'list-item' && (item.css('listStyleType') !== 'none' || this.hasSingleImage(item))) ||
                children.every((item: T) => item.tagName !== 'LI' && item.styleMap.listStyleType === 'none' && this.hasSingleImage(item))
            )
        );
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        let output = '';
        if (NodeList.linearY(node.children)) {
            output = this.application.writeGridLayout(node, parent, node.children.some(item => item.css('listStylePosition') === 'inside') ? 3 : 2);
        }
        else {
            output = this.application.writeLinearLayout(node, parent, true);
        }
        let i = 0;
        node.each((item: T) => {
            const mainData: ListData = {
                ordinal: '',
                imageSrc: '',
                imagePosition: ''
            };
            if (item.display === 'list-item' || item.has('listStyleType') || this.hasSingleImage(item)) {
                let src = item.css('listStyleImage');
                if (src && src !== 'none') {
                    mainData.imageSrc = src;
                }
                else {
                    switch (item.css('listStyleType')) {
                        case 'disc':
                            mainData.ordinal = '●';
                            break;
                        case 'square':
                            mainData.ordinal = '■';
                            break;
                        case 'decimal':
                            mainData.ordinal = `${(i + 1).toString()}.`;
                            break;
                        case 'decimal-leading-zero':
                            mainData.ordinal = `${(i < 9 ? '0' : '') + (i + 1).toString()}.`;
                            break;
                        case 'lower-alpha':
                        case 'lower-latin':
                            mainData.ordinal = `${convertAlpha(i).toLowerCase()}.`;
                            break;
                        case 'upper-alpha':
                        case 'upper-latin':
                            mainData.ordinal = `${convertAlpha(i)}.`;
                            break;
                        case 'lower-roman':
                            mainData.ordinal = `${convertRoman(i + 1).toLowerCase()}.`;
                            break;
                        case 'upper-roman':
                            mainData.ordinal = `${convertRoman(i + 1)}.`;
                            break;
                        case 'none':
                            src = '';
                            let position = '';
                            const repeat = item.css('backgroundRepeat');
                            if (repeat === 'no-repeat') {
                                src = item.css('backgroundImage');
                                position = item.css('backgroundPosition');
                            }
                            if (src && src !== 'none') {
                                mainData.imageSrc = src;
                                mainData.imagePosition = position;
                                item.excludeResource |= NODE_RESOURCE.IMAGE_SOURCE;
                            }
                            break;
                        default:
                            mainData.ordinal = '○';
                            break;
                    }
                }
                i++;
            }
            item.data(EXT_NAME.LIST, 'mainData', mainData);
        });
        return { output, complete: true };
    }

    public afterRender() {
        for (const node of this.subscribers) {
            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
            node.modifyBox(BOX_STANDARD.PADDING_LEFT, null);
        }
    }

    private hasSingleImage(node: T) {
        return node.css('backgroundImage') !== 'none' && node.css('backgroundRepeat') === 'no-repeat';
    }
}