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
            const columnCount = convertInt(parent.android('columnCount'));
            let image = '';
            let [left, top] = ['0px', '0px'];
            if (typeof listStyle === 'object') {
                image = ResourceView.addImageURL(listStyle.image);
                [left, top] = ResourceView.parseBackgroundPosition(listStyle.position);
            }
            const floatItem = node.children.find(item => item.float === 'left' && convertInt(item.cssOriginal('marginLeft')) < 0 && Math.abs(convertInt(item.cssOriginal('marginLeft'))) <= convertInt(item.documentParent.cssOriginal('marginLeft')));
            if (listStyle === '0' && floatItem != null) {
                floatItem.parent = parent;
                controller.prependBefore(
                    node.id,
                    (floatItem.inlineText || floatItem.children.length === 0 ? this.application.controllerHandler.renderNode(floatItem, parent, NODE_STANDARD.TEXT) : this.application.controllerHandler.renderGroup(floatItem, parent, NODE_STANDARD.CONSTRAINT))
                );
                if (columnCount === 3) {
                    node.android('layout_columnSpan', '2');
                }
            }
            else {
                const inside = (node.css('listStylePosition') === 'inside');
                if (inside) {
                    controller.prependBefore(
                        node.id,
                        controller.renderNodeStatic(
                            NODE_STANDARD.SPACE,
                            parent.renderDepth + 1, {
                                android: {
                                    layout_columnWeight: '0',
                                    [parseRTL('layout_marginLeft')]: (node.marginLeft > 0 || convertInt(left) > 0 ? delimitDimens(node.tagName, parseRTL('margin_left'), formatPX(Math.max(node.marginLeft, 0) + convertInt(left))) : '')
                                }
                            },
                            'wrap_content',
                            'wrap_content'
                        )
                    );
                }
                controller.prependBefore(
                    node.id,
                    controller.renderNodeStatic(
                        (image !== '' ? NODE_STANDARD.IMAGE
                                      : (listStyle !== '0' ? NODE_STANDARD.TEXT : NODE_STANDARD.SPACE)),
                        parent.renderDepth + 1, {
                            android: {
                                gravity: parseRTL('right'),
                                layout_columnWeight: '0',
                                layout_marginTop: (node.marginTop > 0 || convertInt(top) > 0 ? delimitDimens(node.tagName, parseRTL('margin_top'), formatPX(Math.max(node.marginTop, 0) + convertInt(top))) : ''),
                                [parseRTL('layout_marginRight')]: delimitDimens(node.tagName, parseRTL('margin_right'), '4px'),
                                [parseRTL('layout_marginLeft')]: (!inside && (node.marginLeft > 0 || convertInt(left) > 0) ? delimitDimens(node.tagName, parseRTL('margin_left'), formatPX(Math.max(node.marginLeft, 0) + convertInt(left))) : ''),
                                text: (image === '' && listStyle !== '0' ? listStyle : ''),
                                src: (image !== '' ? `@drawable/${image}` : ''),
                                baselineAlignBottom: (image !== '' ? 'true' : '')
                            }
                        },
                        'wrap_content',
                        'wrap_content'
                    )
                );
                if (columnCount === 3 && !inside) {
                    node.android('layout_columnSpan', '2');
                }
            }
            if (node.viewWidth === 0) {
                node.android('layout_width', 'wrap_content');
            }
            node.android('layout_columnWeight', '1');
            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, 0);
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