import View from '../view';
import Lists from '../../extension/lists';
import { VIEW_STANDARD } from '../../lib/constants';
import parseRTL from '../localization';

export default class ListsExt<T extends View> extends Lists {
    constructor(tagNames: string[], extension = '', options = {}) {
        super(tagNames, extension, options);
    }

    public processChild(node: T) {
        const controllerHandler = this.application.controllerHandler;
        const options = node.options('extension.lists');
        if (options && options.listStyle != null) {
            controllerHandler.prependBefore(
                node.id,
                controllerHandler.getViewStatic(
                    (options.listStyle !== '0' ? VIEW_STANDARD.TEXT : VIEW_STANDARD.SPACE),
                    node.depth,
                    { android: { gravity: parseRTL('right'), layout_gravity: 'fill', layout_columnWeight: '0', [parseRTL('layout_marginRight')]: '8px', text: (options.listStyle !== '0' ? options.listStyle : '') } }
                )[0]
            );
            node.android('layout_columnWeight', '1');
        }
        return ['', false];
    }
}