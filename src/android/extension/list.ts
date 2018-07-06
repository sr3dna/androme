import { ExtensionResult } from '../../lib/types';
import View from '../view';
import List from '../../extension/list';
import { formatDimen } from '../../lib/xml';
import parseRTL from '../localization';
import { VIEW_STANDARD } from '../../lib/constants';

export default class ListAndroid<T extends View> extends List {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const node = (<T> this.node);
        const controllerHandler = this.application.controllerHandler;
        const listStyle = node.data(`${this.name}:listStyle`);
        if (listStyle != null) {
            controllerHandler.prependBefore(
                node.id,
                controllerHandler.getViewStatic(
                    (listStyle !== '0' ? VIEW_STANDARD.TEXT : VIEW_STANDARD.SPACE),
                    node.depth + node.renderDepth, {
                        android: {
                            gravity: parseRTL('right'),
                            layout_gravity: 'fill',
                            layout_columnWeight: '0',
                            [parseRTL('layout_marginRight')]: formatDimen(node.tagName, parseRTL('margin_right'), '8px'),
                            text: (listStyle !== '0' ? listStyle : '')
                        }
                    }
                )
            );
            node.android('layout_columnWeight', '1');
        }
        return { xml: '' };
    }
}