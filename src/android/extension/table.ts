
import { ExtensionResult } from '../../extension/lib/types';
import Table from '../../extension/table';
import View from '../view';
import { convertInt, formatPX } from '../../lib/util';
import { NODE_STANDARD } from '../../lib/constants';
import { EXT_NAME } from '../../extension/lib/constants';

export default class TableAndroid<T extends View> extends Table<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const result = super.processNode();
        const node = this.node;
        const columnCount = convertInt(node.app('columnCount'));
        if (columnCount > 1 && node.children.some(item => item.multiLine)) {
            let requireWidth = false;
            node.each((item: T) => {
                if (item.viewWidth === 0) {
                    item.android('layout_width', '0px');
                    item.app('layout_columnWeight', (<HTMLTableCellElement> item.element).colSpan.toString());
                    requireWidth = true;
                }
            });
            if (node.viewWidth === 0 && requireWidth) {
                let widthParent = 0;
                node.ascend(true).some(item => {
                    if (item.viewWidth > 0) {
                        widthParent = item.viewWidth;
                        return true;
                    }
                    return false;
                });
                if (node.bounds.width >= widthParent) {
                    node.android('layout_width', 'match_parent');
                }
                else {
                    node.css('width', formatPX(node.bounds.width));
                }
            }
        }
        else {
            node.each((item: T) => {
                if (item.styleMap.width === '0px') {
                    item.android('layout_width', '0px');
                    item.app('layout_columnWeight', (<HTMLTableCellElement> item.element).colSpan.toString());
                }
            });
        }
        return result;
    }

    public processChild(): ExtensionResult {
        const parent = this.parent as T;
        const node = this.node;
        const rowSpan = convertInt(node.data(EXT_NAME.TABLE, 'rowSpan'));
        const columnSpan = convertInt(node.data(EXT_NAME.TABLE, 'colSpan'));
        const spaceSpan = convertInt(node.data(EXT_NAME.TABLE, 'spaceSpan'));
        if (rowSpan > 1) {
            node.app('layout_rowSpan', rowSpan.toString());
        }
        if (columnSpan > 1) {
            node.app('layout_columnSpan', columnSpan.toString());
        }
        if (spaceSpan > 0) {
            this.application.controllerHandler.appendAfter(
                node.id,
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
        return { xml: '' };
    }
}