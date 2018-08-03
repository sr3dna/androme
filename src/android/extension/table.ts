
import { ExtensionResult } from '../../extension/lib/types';
import Table from '../../extension/table';
import View from '../view';
import { EXT_NAME } from '../../extension/lib/constants';

export default class TableAndroid<T extends View> extends Table {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const node = (<T> this.node);
        const rowSpan = (<number> node.data(`${EXT_NAME.TABLE}:rowSpan`));
        const columnSpan = (<number> node.data(`${EXT_NAME.TABLE}:columnSpan`));
        if (rowSpan != null && rowSpan > 1) {
            node.android('layout_rowSpan', rowSpan.toString());
        }
        if (columnSpan != null && columnSpan > 1) {
            node.android('layout_columnSpan', columnSpan.toString());
        }
        return { xml: '' };
    }
}