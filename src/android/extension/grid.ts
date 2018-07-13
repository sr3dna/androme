import View from '../view';
import Grid from '../../extension/grid';
import { averageInt } from '../../lib/util';
import { BOX_STANDARD } from '../../lib/constants';

export default class GridAndroid<T extends View> extends Grid {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public afterRender() {
        this.application.cache.list.forEach((node: T) => {
            if (node.gridRowSpan > 1) {
                node.android('layout_rowSpan', node.gridRowSpan.toString());
            }
            if (node.gridColumnSpan > 1) {
                node.android('layout_columnSpan', node.gridColumnSpan.toString());
            }
            if (node.gridPadding) {
                if (node.gridPadding.top > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_TOP, node.gridPadding.top);
                }
                if (node.gridPadding.right.length > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_RIGHT, averageInt(node.gridPadding.right));
                }
                if (node.gridPadding.bottom > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, node.gridPadding.bottom);
                }
                if (node.gridPadding.left.length > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_LEFT, averageInt(node.gridPadding.left));
                }
            }
        });
    }
}