
import { ExtensionResult } from '../../extension/lib/types';
import Table from '../../extension/table';
import View from '../view';
import { convertInt } from '../../lib/util';
import { NODE_STANDARD } from '../../lib/constants';
import { EXT_NAME } from '../../extension/lib/constants';

export default class TableAndroid<T extends View> extends Table<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const parent = this.parent;
        if (parent) {
            const rowSpan = convertInt(this.node.data(`${EXT_NAME.TABLE}:rowSpan`));
            const columnSpan = convertInt(this.node.data(`${EXT_NAME.TABLE}:colSpan`));
            const spaceSpan = convertInt(this.node.data(`${EXT_NAME.TABLE}:spaceSpan`));
            if (rowSpan > 1) {
                this.node.app('layout_rowSpan', rowSpan.toString());
            }
            if (columnSpan > 1) {
                this.node.app('layout_columnSpan', columnSpan.toString());
            }
            if (spaceSpan > 0) {
                this.application.controllerHandler.appendAfter(
                    this.node.id,
                    this.application.controllerHandler.renderNodeStatic(
                        NODE_STANDARD.SPACE,
                        parent.renderDepth + 1, {
                            app: {
                                layout_columnSpan: spaceSpan.toString()
                            }
                        },
                        'wrap_content',
                        'wrap_content'
                    )
                );
            }
        }
        return { xml: '' };
    }
}