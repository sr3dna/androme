import { ExtensionResult } from '../../extension/lib/types';
import List from '../../extension/list';
import View from '../view';
import { delimitDimen } from '../lib/util';
import { NODE_STANDARD } from '../../lib/constants';
import { EXT_NAME } from '../../extension/lib/constants';
import parseRTL from '../localization';
import { formatPX } from '../../lib/util';

export default class ListAndroid<T extends View> extends List {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const node = this.node as T;
        const parent = this.parent as T;
        const controller = this.application.controllerHandler;
        const listStyle = node.data(`${EXT_NAME.LIST}:listStyle`);
        if (listStyle != null) {
            controller.prependBefore(
                node.id,
                controller.renderNodeStatic(
                    (listStyle !== '0' ? NODE_STANDARD.TEXT : NODE_STANDARD.SPACE),
                    parent.renderDepth + 1, {
                        android: {
                            gravity: parseRTL('right'),
                            layout_columnWeight: '0',
                            layout_marginTop: (node.marginTop > 0 ? delimitDimen(node.tagName, parseRTL('margin_top'), formatPX(node.marginTop)) : null),
                            [parseRTL('layout_marginRight')]: delimitDimen(node.tagName, parseRTL('margin_right'), '8px'),
                            [parseRTL('layout_marginLeft')]: (node.marginLeft > 0 ? delimitDimen(node.tagName, parseRTL('margin_left'), formatPX(node.marginLeft)) : null),
                            text: (listStyle !== '0' ? listStyle : '')
                        }
                    },
                    'wrap_content',
                    'wrap_content'
                )
            );
            node.android('layout_columnWeight', '1');
            if (node.viewWidth === 0) {
                node.android('layout_width', 'wrap_content');
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