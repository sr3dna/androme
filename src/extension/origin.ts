import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { convertInt, formatPX } from '../lib/util';
import { BOX_STANDARD, CSS_STANDARD } from '../lib/constants';

export default class Origin<T extends Node> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public afterInit() {
        for (const node of this.application.cache.elements) {
            if (node.children.some((current: T) => {
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
                        return (
                            (left < 0 && node.marginLeft >= Math.abs(left)) ||
                            (right < 0 && Math.abs(right) >= current.bounds.width)
                        );
                    }
                }))
            {
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
                        const left = convertInt(current.left);
                        const right = convertInt(current.right);
                        if (left < 0) {
                            if (node.marginLeft >= left) {
                                current.css('left', formatPX(left + node.marginLeft));
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
                    const [sectionLeft, sectionRight] = new NodeList<T>(node.children as T[]).partition((item: T) => !marginRight.includes(item));
                    if (sectionLeft.length > 0 && sectionRight.length > 0) {
                        if (node.autoMarginLeft) {
                            node.css('marginLeft', node.style.marginLeft as string);
                        }
                        node.modifyBox(BOX_STANDARD.MARGIN_RIGHT, null);
                        const widthLeft: number = node.has('width', CSS_STANDARD.UNIT) ? node.toInt('width')
                                                                                       : Math.max.apply(null, sectionRight.list.map(item => item.bounds.width));
                        const widthRight: number = Math.max.apply(null, sectionRight.list.map(item => Math.abs(item.toInt('right'))));
                        sectionLeft.each((item: T) => {
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
                        if (marginLeft[index] !== 2 && (marginLeftType === 2 || (current.pageflow && !current.plainText && marginLeft.includes(1)))) {
                            if (marginLeft[index] === 1) {
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, current.marginLeft + node.marginLeft, false, true);
                            }
                            else {
                                current.modifyBox(BOX_STANDARD.MARGIN_LEFT, node.marginLeft, false, true);
                            }
                        }
                    });
                    const width = node.toInt('width');
                    if (width > 0) {
                        node.css('width', formatPX(width + node.marginLeft));
                    }
                    node.bounds.left -= node.marginLeft;
                    node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null, false, true);
                }
            }
            if (!node.pageflow && node.children.length > 0 && node.children.some(item => !item.pageflow)) {
                let calibrate = false;
                if (!node.hasWidth) {
                    const maxRight: number = Math.max.apply(null, node.cascade().map(item => item.linear.right));
                    node.bounds.right = Math.max(maxRight + node.paddingRight + node.borderRightWidth, node.bounds.right);
                    node.bounds.width = Math.max(node.bounds.right - node.bounds.left, node.bounds.width);
                    calibrate = true;
                }
                if (!node.hasHeight) {
                    const maxBottom: number = Math.max.apply(null, node.cascade().map(item => item.linear.bottom));
                    node.bounds.bottom = Math.max(maxBottom + node.paddingBottom + node.borderBottomWidth, node.bounds.bottom);
                    node.bounds.height = Math.max(node.bounds.bottom - node.bounds.top, node.bounds.height);
                    calibrate = true;
                }
                if (calibrate) {
                    node.setBounds(true);
                }
            }
        }
    }
}