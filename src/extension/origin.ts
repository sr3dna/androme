import { BOX_STANDARD, CSS_STANDARD } from '../lib/enumeration';

import Node from '../base/node';
import Extension from '../base/extension';

import { convertInt, formatPX } from '../lib/util';

export default class Origin<T extends Node> extends Extension<T> {
    public afterInit() {
        function modifyMarginLeft(node: T, offset: number, parent = false) {
            node.bounds.left -= offset;
            node.bounds.width += Math.max(node.marginLeft < 0 ? node.marginLeft + offset : offset, 0);
            node.css('marginLeft', formatPX(node.marginLeft + (offset * (parent ? -1 : 1))));
            node.setBounds(true);
        }
        Array.from(this.application.cache.elements).forEach(node => {
            const outside = node.children.some(current => {
                if (current.pageflow) {
                    return (
                        current.float !== 'right' &&
                        current.marginLeft < 0 &&
                        node.marginLeft >= Math.abs(current.marginLeft) &&
                        (Math.abs(current.marginLeft) >= current.bounds.width || node.documentRoot)
                    );
                }
                else {
                    const left = current.toInt('left');
                    const right = current.toInt('right');
                    return (left < 0 && node.marginLeft >= Math.abs(left)) || (right < 0 && Math.abs(right) >= current.bounds.width);
                }
            });
            if (outside) {
                const marginLeft: number[] = [];
                const marginRight: T[] = [];
                node.each((current: T) => {
                    let leftType = 0;
                    if (current.pageflow) {
                        const left = current.marginLeft;
                        if (left < 0 && node.marginLeft >= Math.abs(left)) {
                            leftType = 1;
                        }
                    }
                    else {
                        const left = convertInt(current.left) + current.marginLeft;
                        const right = convertInt(current.right);
                        if (left < 0) {
                            if (node.marginLeft >= Math.abs(left)) {
                                leftType = 2;
                            }
                        }
                        else if (right < 0) {
                            if (Math.abs(right) >= current.bounds.width) {
                                marginRight.push(current);
                            }
                        }
                    }
                    marginLeft.push(leftType);
                });
                if (marginRight.length > 0) {
                    const [sectionLeft, sectionRight] = new androme.lib.base.NodeList(node.children).partition((item: T) => !marginRight.includes(item));
                    if (sectionLeft.length > 0 && sectionRight.length > 0) {
                        if (node.style.marginLeft && node.autoMarginLeft) {
                            node.css('marginLeft', node.style.marginLeft);
                        }
                        node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, null);
                        const widthLeft: number = node.has('width', CSS_STANDARD.UNIT) ? node.toInt('width') : Math.max.apply(null, sectionRight.list.map(item => item.bounds.width));
                        const widthRight: number = Math.max.apply(null, sectionRight.list.map(item => Math.abs(item.toInt('right'))));
                        sectionLeft.each(item => {
                            if (item.pageflow && !item.hasWidth) {
                                item.css(item.textElement ? 'maxWidth' : 'width', formatPX(widthLeft));
                            }
                        });
                        node.css('width', formatPX(widthLeft + widthRight));
                    }
                }
                const marginLeftType: number = Math.max.apply(null, marginLeft);
                if (marginLeftType > 0) {
                    node.each((current: T, index: number) => {
                        if (marginLeft[index] === 2) {
                            const left = current.toInt('left') + node.marginLeft;
                            current.css('left', formatPX(Math.max(left, 0)));
                            if (left < 0) {
                                current.css('marginLeft', formatPX(current.marginLeft + left));
                                modifyMarginLeft(current, left);
                            }
                        }
                        else if (marginLeftType === 2 || (current.pageflow && !current.plainText && marginLeft.includes(1))) {
                            modifyMarginLeft(current, node.marginLeft);
                        }
                    });
                    if (node.has('width', CSS_STANDARD.UNIT)) {
                        node.css('width', formatPX(node.toInt('width') + node.marginLeft));
                    }
                    modifyMarginLeft(node, node.marginLeft, true);
                }
            }
        });
    }
}