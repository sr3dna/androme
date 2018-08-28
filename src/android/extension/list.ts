import { ExtensionResult } from '../../extension/lib/types';
import ResourceView from '../../android/resource-view';
import List from '../../extension/list';
import View from '../view';
import { delimitDimens } from '../lib/util';
import { NODE_STANDARD, BOX_STANDARD } from '../../lib/constants';
import { EXT_NAME } from '../../extension/lib/constants';
import parseRTL from '../localization';
import { formatPX, convertInt } from '../../lib/util';

export default class ListAndroid<T extends View> extends List {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const node = this.node as T;
        const parent = this.parent as T;
        const controller = this.application.controllerHandler;
        const listStyle = node.data(`${EXT_NAME.LIST}:listStyleType`);
        if (listStyle) {
            let columnCount = 0;
            let paddingLeft = 0;
            if (parent.is(NODE_STANDARD.GRID)) {
                columnCount = convertInt(parent.app('columnCount'));
                paddingLeft = convertInt(parent.cssOriginal('paddingLeft'));
                if (parent.paddingLeft === paddingLeft) {
                    paddingLeft = 0;
                }
            }
            const floatItem = node.children.find(item => item.float === 'left' && convertInt(item.cssOriginal('marginLeft')) < 0 && Math.abs(convertInt(item.cssOriginal('marginLeft'))) <= convertInt(item.documentParent.cssOriginal('marginLeft')));
            if (listStyle === '0' && floatItem != null) {
                floatItem.parent = parent;
                controller.prependBefore(
                    node.id,
                    (floatItem.inlineText || floatItem.children.length === 0 ? this.application.controllerHandler.renderNode(floatItem, parent, NODE_STANDARD.TEXT)
                                                                             : this.application.controllerHandler.renderGroup(floatItem, parent, NODE_STANDARD.CONSTRAINT))
                );
                if (columnCount === 3) {
                    node.app('layout_columnSpan', '2');
                }
            }
            else {
                const inside = (node.css('listStylePosition') === 'inside');
                const columnWeight = (columnCount > 0 ? '0' : '');
                const marginLeft = Math.max(node.marginLeft, 0);
                let image = '';
                let [left, top] = ['0px', '0px'];
                if (typeof listStyle === 'object') {
                    image = ResourceView.addImageURL(listStyle.image);
                    [left, top] = ResourceView.parseBackgroundPosition(listStyle.position);
                }
                if (inside) {
                    controller.prependBefore(
                        node.id,
                        controller.renderNodeStatic(
                            NODE_STANDARD.SPACE,
                            parent.renderDepth + 1, {
                                android: {
                                    [parseRTL('layout_marginLeft')]: (marginLeft > 0 ? delimitDimens(node.tagName, parseRTL('margin_left'), formatPX(marginLeft)) : '')
                                },
                                app: {
                                    layout_columnWeight: columnWeight
                                }
                            },
                            'wrap_content',
                            'wrap_content'
                        )
                    );
                }
                const options = {
                    android: {
                        layout_marginTop: (node.marginTop > 0 || convertInt(top) > 0 ? delimitDimens(node.tagName, parseRTL('margin_top'), formatPX(Math.max(node.marginTop, 0) + convertInt(top))) : ''),
                        [parseRTL('layout_marginRight')]: delimitDimens(node.tagName, parseRTL('margin_right'), '4px'),
                        [parseRTL('layout_marginLeft')]: (!inside && (marginLeft > 0 || convertInt(left) > 0) ? delimitDimens(node.tagName, parseRTL('margin_left'), formatPX(marginLeft + convertInt(left))) : ''),
                    },
                    app: {
                        layout_columnWeight: columnWeight
                    }
                };
                if (image !== '') {
                    let minWidth = 0;
                    if (paddingLeft === 0) {
                        minWidth = node.paddingLeft;
                        node.modifyBox(BOX_STANDARD.PADDING_LEFT, 0);
                    }
                    else {
                        minWidth = paddingLeft;
                        node.modifyBox(BOX_STANDARD.PADDING_LEFT, node.paddingLeft - paddingLeft);
                    }
                    Object.assign(options.android, {
                        src: `@drawable/${image}`,
                        minWidth: (minWidth > 0 ? formatPX(minWidth) : ''),
                        baselineAlignBottom: 'true'
                    });
                }
                else {
                    Object.assign(options.android, {
                        gravity: parseRTL('right'),
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
                if (columnCount === 3 && !inside) {
                    node.app('layout_columnSpan', '2');
                }
            }
            if (columnCount > 0) {
                node.app('layout_columnWeight', '1');
            }
            if (paddingLeft !== 0 && node.marginLeft < 0) {
                node.modifyBox(BOX_STANDARD.MARGIN_LEFT, node.marginLeft + paddingLeft);
            }
            else {
                node.modifyBox(BOX_STANDARD.MARGIN_LEFT, 0);
            }
        }
        return { xml: '' };
    }

    public afterInsert() {
        const node = this.node as T;
        if (node.is(NODE_STANDARD.GRID)) {
            node.android('layout_width', 'match_parent');
        }
    }
}