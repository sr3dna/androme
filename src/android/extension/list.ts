import { ExtensionResult } from '../../extension/lib/types';
import ResourceView from '../../android/resource-view';
import List from '../../extension/list';
import View from '../view';
import { convertInt, formatPX } from '../../lib/util';
import { delimitDimens } from '../lib/util';
import { BOX_STANDARD, NODE_STANDARD } from '../../lib/constants';
import { EXT_NAME } from '../../extension/lib/constants';
import parseRTL from '../localization';

export default class ListAndroid<T extends View> extends List<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const parent = this.parent;
        if (parent) {
            const controller = this.application.controllerHandler;
            const node = this.node;
            const listStyle = this.node.data(EXT_NAME.LIST, 'listStyleType') || '0';
            const parentLeft = convertInt(parent.cssOriginal('paddingLeft', true)) + convertInt(parent.cssOriginal('marginLeft', true));
            let columnCount = 0;
            let paddingLeft = node.marginLeft;
            if (parent.is(NODE_STANDARD.GRID)) {
                columnCount = convertInt(parent.app('columnCount'));
                paddingLeft += parentLeft;
            }
            else if (parent.children[0] === node) {
                paddingLeft += parentLeft;
            }
            const floatItem = node.children.find(item => item.float === 'left' && convertInt(item.cssOriginal('marginLeft', true)) < 0 && Math.abs(convertInt(item.cssOriginal('marginLeft', true))) <= convertInt(item.documentParent.cssOriginal('marginLeft', true))) as T;
            if (floatItem && listStyle === '0') {
                floatItem.parent = parent;
                controller.prependBefore(
                    node.id,
                    (floatItem.inlineText || floatItem.children.length === 0 ? this.application.controllerHandler.renderNode(floatItem, parent, NODE_STANDARD.TEXT)
                                                                             : this.application.controllerHandler.renderGroup(floatItem, parent, NODE_STANDARD.CONSTRAINT))
                );
                if (columnCount === 3) {
                    node.app('layout_columnSpan', '2');
                }
                floatItem.android('minWidth', formatPX(paddingLeft));
            }
            else {
                const columnWeight = (columnCount > 0 ? '0' : '');
                const positionInside = (node.css('listStylePosition') === 'inside');
                const listStyleImage = !['', 'none'].includes(node.css('listStyleImage'));
                let image = '';
                let [left, top] = [0, 0];
                if (typeof listStyle === 'object') {
                    image = ResourceView.addImageURL(listStyle.image);
                    [left, top] = ResourceView.parseBackgroundPosition(listStyle.position).map(value => convertInt(value));
                }
                const gravity = (image !== '' && !listStyleImage ? '' : 'right');
                if (gravity === '') {
                    paddingLeft += node.paddingLeft;
                    node.modifyBox(BOX_STANDARD.PADDING_LEFT, 0);
                }
                if (left > 0 && paddingLeft > left) {
                    paddingLeft -= left;
                }
                const minWidth = (paddingLeft > 0 ? delimitDimens(node.tagName, parseRTL('minwidth'), formatPX(paddingLeft)) : '');
                const marginLeftValue = (left > 0 ? delimitDimens(node.tagName, parseRTL('margin_left'), formatPX(left)) : '');
                const paddingRightValue = (gravity === 'right' ? delimitDimens(node.tagName, parseRTL('margin_right'), formatPX(8)) : '');
                const options = {
                    android: {
                        layout_marginTop: (node.marginTop + top > 0 ? delimitDimens(node.tagName, 'margin_top', formatPX(node.marginTop + top)) : '')
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
                        minWidth: delimitDimens(node.tagName, parseRTL('minwidth'), formatPX(24))
                    });
                }
                else {
                    Object.assign(options.android, {
                        minWidth,
                        gravity: parseRTL(gravity),
                        [parseRTL('layout_marginLeft')]: marginLeftValue,
                        [parseRTL('paddingRight')]: paddingRightValue
                    });
                    if (columnCount === 3) {
                        node.app('layout_columnSpan', '2');
                    }
                }
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
            if (columnCount > 0) {
                node.app('layout_columnWeight', '1');
            }
            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, 0);
        }
        return { xml: '' };
    }

    public afterInsert() {
        if (this.node.is(NODE_STANDARD.GRID)) {
            this.node.android('layout_width', 'match_parent');
        }
    }
}