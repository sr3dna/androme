import { ExtensionResult } from '../../extension/lib/types';
import ResourceView from '../../android/resource-view';
import List from '../../extension/list';
import View from '../view';
import { convertInt, formatPX } from '../../lib/util';
import { delimitDimens } from '../lib/util';
import { BOX_STANDARD, NODE_ALIGNMENT, NODE_STANDARD } from '../../lib/constants';
import { EXT_NAME } from '../../extension/lib/constants';
import parseRTL from '../localization';

export default class ListAndroid<T extends View> extends List<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const controller = this.application.controllerHandler;
        const node = this.node;
        const parent = this.parent as T;
        const listStyle = this.node.data(EXT_NAME.LIST, 'listStyleType') || '0';
        const parentLeft = convertInt(parent.css('paddingLeft')) + convertInt(parent.cssOriginal('marginLeft', true));
        let columnCount = 0;
        let paddingLeft = node.marginLeft;
        node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
        if (parent.is(NODE_STANDARD.GRID)) {
            columnCount = convertInt(parent.app('columnCount'));
            paddingLeft += parentLeft;
        }
        else if (parent.children[0] === node) {
            paddingLeft += parentLeft;
        }
        const floatItem =
            node.children.find(item =>
                item.float === 'left' &&
                convertInt(item.cssOriginal('marginLeft', true)) < 0 &&
                Math.abs(convertInt(item.cssOriginal('marginLeft', true))) <= convertInt(item.documentParent.cssOriginal('marginLeft', true))
            ) as T;
        if (floatItem && listStyle === '0') {
            floatItem.parent = parent;
            let xml = '';
            if (floatItem.inlineText || floatItem.children.length === 0) {
                xml = controller.renderNode(floatItem, parent, NODE_STANDARD.TEXT);
            }
            else if (floatItem.children.every(item => item.pageflow && !item.floating)) {
                xml = controller.renderGroup(floatItem, parent, NODE_STANDARD.RELATIVE);
                floatItem.alignmentType = NODE_ALIGNMENT.INLINE_WRAP;
            }
            else {
                xml = controller.renderGroup(floatItem, parent, NODE_STANDARD.CONSTRAINT);
            }
            controller.prependBefore(node.id, xml);
            if (columnCount === 3) {
                node.app('layout_columnSpan', '2');
            }
            paddingLeft += floatItem.marginLeft;
            floatItem.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
            if (floatItem.viewWidth === 0 && paddingLeft > 0) {
                floatItem.android('minWidth', formatPX(paddingLeft));
            }
        }
        else {
            const columnWeight = (columnCount > 0 ? '0' : '');
            const positionInside = (node.css('listStylePosition') === 'inside');
            const listStyleImage = !['', 'none'].includes(node.css('listStyleImage'));
            let image = '';
            let [left, top] = [0, 0];
            if (typeof listStyle === 'object') {
                image = ResourceView.addImageURL(listStyle.image);
                [left, top] = ResourceView.parseBackgroundPosition(listStyle.position, node.css('fontSize')).map(value => convertInt(value));
            }
            const gravity = ((image !== '' && !listStyleImage) || (parentLeft === 0 && node.marginLeft === 0) ? '' : 'right');
            if (gravity === '') {
                paddingLeft += node.paddingLeft;
                node.modifyBox(BOX_STANDARD.PADDING_LEFT, null);
            }
            if (left > 0 && paddingLeft > left) {
                paddingLeft -= left;
            }
            paddingLeft = Math.max(paddingLeft, 20);
            const minWidth = (paddingLeft > 0 ? delimitDimens(node.nodeName, parseRTL('min_width'), formatPX(paddingLeft)) : '');
            const paddingRight = (() => {
                if (paddingLeft <= 24) {
                    return 6;
                }
                else if (paddingLeft <= 32) {
                    return 8;
                }
                else {
                    return 10;
                }
            })();
            const paddingLeftValue = (gravity === '' && image === '' ? delimitDimens(node.nodeName, parseRTL('padding_left'), formatPX(paddingRight)) : '');
            const paddingRightValue = (gravity === 'right' ? delimitDimens(node.nodeName, parseRTL('padding_right'), formatPX(paddingRight)) : '');
            const marginLeftValue = (left > 0 ? delimitDimens(node.nodeName, parseRTL('margin_left'), formatPX(left)) : '');
            const options = {
                android: {
                    layout_marginTop: (node.marginTop + top > 0 ? delimitDimens(node.nodeName, 'margin_top', formatPX(node.marginTop + top)) : '')
                },
                app: {
                    layout_columnWeight: columnWeight
                }
            };
            if (positionInside) {
                controller.prependBefore(
                    node.id,
                    controller.renderNodeStatic(
                        NODE_STANDARD.SPACE,
                        parent.renderDepth + 1, {
                            android: {
                                minWidth,
                                [parseRTL('layout_marginLeft')]: marginLeftValue,
                                [parseRTL('paddingLeft')]: paddingLeftValue,
                                [parseRTL('paddingRight')]: paddingRightValue
                            },
                            app: {
                                layout_columnWeight: columnWeight
                            }
                        },
                        'wrap_content',
                        'wrap_content'
                    )
                );
                Object.assign(options.android, {
                    minWidth: delimitDimens(node.nodeName, parseRTL('min_width'), formatPX(24))
                });
            }
            else {
                Object.assign(options.android, {
                    minWidth,
                    gravity: parseRTL(gravity),
                    [parseRTL('layout_marginLeft')]: marginLeftValue,
                    [parseRTL('paddingLeft')]: paddingLeftValue,
                    [parseRTL('paddingRight')]: paddingRightValue
                });
                if (columnCount === 3) {
                    node.app('layout_columnSpan', '2');
                }
            }
            if (node.tagName === 'DT' && image === '') {
                node.app('layout_columnSpan', columnCount.toString());
            }
            else {
                if (image !== '') {
                    Object.assign(options.android, {
                        src: `@drawable/${image}`,
                        baselineAlignBottom: 'true',
                        scaleType: (!positionInside && gravity === 'right' ? 'fitEnd' : 'fitStart')
                    });
                }
                else {
                    Object.assign(options.android, {
                        text: (listStyle !== '0' ? listStyle : '')
                    });
                }
                controller.prependBefore(
                    node.id,
                    controller.renderNodeStatic(
                        (image !== '' ? NODE_STANDARD.IMAGE
                                      : (listStyle !== '0' ? NODE_STANDARD.TEXT : NODE_STANDARD.SPACE)),
                        parent.renderDepth + 1,
                        options,
                        'wrap_content',
                        'wrap_content'
                    )
                );
            }
        }
        if (columnCount > 0) {
            node.app('layout_columnWeight', '1');
        }
        return { xml: '', complete: true };
    }

    public afterInsert() {
        const node = this.node;
        if (node.is(NODE_STANDARD.GRID)) {
            node.android('layout_width', 'match_parent');
        }
    }
}