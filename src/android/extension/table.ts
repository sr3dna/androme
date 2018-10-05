
import { ExtensionResult } from '../../extension/lib/types';
import Table from '../../extension/table';
import View from '../view';
import { convertFloat, convertInt, formatPX, trimEnd } from '../../lib/util';
import { NODE_STANDARD } from '../../base/lib/constants';
import { EXT_NAME } from '../../extension/lib/constants';

export default class TableAndroid<T extends View> extends Table<T> {
    constructor(name: string, framework = 0, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const result = super.processNode();
        const node = this.node;
        const columnCount = convertInt(node.app('columnCount'));
        if (columnCount > 1) {
            let requireWidth = !!node.data(EXT_NAME.TABLE, 'expand');
            node.each((item: T) => {
                if (item.css('width') === '0px') {
                    item.android('layout_width', '0px');
                    item.app('layout_columnWeight', ((<HTMLTableCellElement> item.element).colSpan || 1).toString());
                }
                else {
                    const expand: boolean | null = item.data(EXT_NAME.TABLE, 'expand');
                    const exceed: boolean = !!item.data(EXT_NAME.TABLE, 'exceed');
                    const downsized: boolean = !!item.data(EXT_NAME.TABLE, 'downsized');
                    if (expand != null) {
                        if (expand) {
                            const percent = convertFloat(item.data(EXT_NAME.TABLE, 'percent')) / 100;
                            if (percent > 0) {
                                item.android('layout_width', '0px');
                                item.app('layout_columnWeight', trimEnd(percent.toFixed(3), '0'));
                                requireWidth = true;
                            }
                        }
                        else {
                            item.app('layout_columnWeight', '0');
                        }
                    }
                    if (downsized) {
                        if (exceed) {
                            item.app('layout_columnWeight', '0.01');
                        }
                        else {
                            if (item.textElement) {
                                item.android('maxLines', '1');
                            }
                            if (item.has('width') && item.toInt('width') < item.bounds.width) {
                                item.android('layout_width', formatPX(item.bounds.width));
                            }
                        }
                    }
                }
            });
            if (requireWidth && !node.hasWidth) {
                let widthParent = 0;
                node.ascend()
                    .some(item => {
                        if (item.hasWidth) {
                            widthParent = item.bounds.width;
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
            this.application.viewController.appendAfter(
                node.id,
                this.application.viewController.renderNodeStatic(
                    NODE_STANDARD.SPACE,
                    parent.renderDepth + 1,
                    {
                        app: { layout_columnSpan: spaceSpan.toString() }
                    },
                    'wrap_content',
                    'wrap_content'
                )
            );
        }
        return { xml: '', complete: true };
    }
}