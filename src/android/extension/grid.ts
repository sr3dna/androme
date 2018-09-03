import { ExtensionResult } from '../../extension/lib/types';
import { GridCellData, GridData } from '../../extension/lib/types';
import Grid from '../../extension/grid';
import View from '../view';
import { formatPX } from '../../lib/util';
import { getBoxSpacing } from '../../lib/dom';
import { BOX_STANDARD, NODE_STANDARD } from '../../lib/constants';
import { EXT_NAME } from '../../extension/lib/constants';

export default class GridAndroid<T extends View> extends Grid<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const node = this.node;
        const data = <GridCellData> node.data(EXT_NAME.GRID, 'gridCellData');
        if (data) {
            if (data.rowSpan > 1) {
                node.app('layout_rowSpan', data.rowSpan.toString());
            }
            if (data.columnSpan > 1) {
                node.app('layout_columnSpan', data.columnSpan.toString());
            }
            if (node.parent.display === 'table' && node.display === 'table-cell') {
                node.app('layout_gravity', 'fill');
            }
        }
        return super.processChild();
    }

    public afterRender() {
        const extended: T[] = [];
        this.application.cache.each((node: T) => {
            if (node.renderExtension === this) {
                extended.push(node);
            }
            else {
                const parent = node.renderParent;
                if (parent.is(NODE_STANDARD.GRID) && !(parent.display === 'table' && parent.css('borderCollapse') === 'collapse')) {
                    const gridData = <GridData> parent.data(EXT_NAME.GRID, 'gridData');
                    const gridCellData = <GridCellData> node.data(EXT_NAME.GRID, 'gridCellData');
                    if (gridData && gridCellData) {
                        const dimensions = getBoxSpacing(node.documentParent.element, true);
                        const padding = gridData.padding;
                        if (gridCellData.cellFirst) {
                            const heightTop = dimensions.paddingTop + dimensions.marginTop;
                            if (heightTop > 0) {
                                padding.top = heightTop;
                            }
                        }
                        if (gridCellData.rowStart) {
                            const marginLeft = dimensions.marginLeft + dimensions.paddingLeft;
                            if (marginLeft > 0) {
                                padding.left = Math.max(marginLeft, padding.left);
                            }
                        }
                        if (gridCellData.rowEnd) {
                            const heightBottom = dimensions.marginBottom + dimensions.paddingBottom + (!gridCellData.cellLast ? dimensions.marginTop + dimensions.paddingTop : 0);
                            if (heightBottom > 0) {
                                if (gridCellData.cellLast) {
                                    padding.bottom = heightBottom;
                                }
                                else {
                                    this.application.controllerHandler.appendAfter(node.id, this.application.controllerHandler.renderNodeStatic(NODE_STANDARD.SPACE, node.renderDepth, { app: { layout_columnSpan: gridData.columnCount } }, 'match_parent', formatPX(heightBottom)));
                                }
                            }
                            const marginRight = dimensions.marginRight + dimensions.paddingRight;
                            if (marginRight > 0) {
                                padding.right = Math.max(marginRight, padding.right);
                            }
                        }
                    }
                }
            }
        });
        for (const node of extended) {
            const data = <GridData> node.data(EXT_NAME.GRID, 'gridData');
            if (data) {
                const padding = data.padding;
                if (padding.top > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_TOP, padding.top);
                }
                if (padding.right > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_RIGHT, padding.right);
                }
                if (padding.bottom > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, padding.bottom);
                }
                if (padding.left > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_LEFT, padding.left);
                }
            }
        }
    }
}