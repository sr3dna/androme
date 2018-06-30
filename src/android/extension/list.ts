import { ExtensionResult, ObjectMap } from '../../lib/types';
import View from '../view';
import List from '../../extension/list';
import { VIEW_STANDARD } from '../../lib/constants';
import parseRTL from '../localization';

export default class ListAndroid<T extends View> extends List {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const node = (<T> this.node);
        const controllerHandler = this.application.controllerHandler;
        const options: ObjectMap<any> = node.options(this.name);
        if (options && options.listStyle != null) {
            controllerHandler.prependBefore(
                node.id,
                controllerHandler.getViewStatic(
                    (options.listStyle !== '0' ? VIEW_STANDARD.TEXT : VIEW_STANDARD.SPACE),
                    node.depth + node.renderDepth,
                    { android: { gravity: parseRTL('right'), layout_gravity: 'fill', layout_columnWeight: '0', [parseRTL('layout_marginRight')]: '8px', text: (options.listStyle !== '0' ? options.listStyle : '') } }
                )[0]
            );
            node.android('layout_columnWeight', '1');
        }
        return ['', false, false];
    }
}