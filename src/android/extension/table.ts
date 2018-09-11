
import { ExtensionResult } from '../../extension/lib/types';
import Table from '../../extension/table';
import View from '../view';
import { convertFloat, convertInt, formatPX, isPercent, trimEnd } from '../../lib/util';
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
        if (columnCount > 1) {
            let requireWidth = node.data(EXT_NAME.TABLE, 'expand') || false;
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
                        }
                    }
                }
            });
            if (requireWidth && (node.viewWidth === 0 && !isPercent(node.css('width')))) {
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
                    parent.renderDepth + 1,
                    {
                        app: {
                            layout_columnSpan: spaceSpan.toString()
                        }
                    },
                    'wrap_content',
                    'wrap_content'
                )
            );
        }
        return { xml: '', complete: true };
    }

    public beforeInsert() {
        const node = this.node;
        const tableWidth = node.toInt('width');
        const boundsWidth = node.data(EXT_NAME.TABLE, 'boundsWidth');
        if (!node.blockWidth && tableWidth > 0 && boundsWidth > tableWidth) {
            node.android('layout_width', formatPX(boundsWidth));
        }
    }
}