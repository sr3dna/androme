import { ExtensionResult } from '../../extension/lib/types';
import { GridCellData, GridData } from '../../extension/lib/types';
import Grid from '../../extension/grid';
import View from '../view';
import { convertInt, formatPX } from '../../lib/util';
import { getBoxSpacing } from '../../lib/dom';
import { BOX_STANDARD, NODE_STANDARD } from '../../lib/constants';
import { EXT_NAME } from '../../extension/lib/constants';

export default class GridAndroid<T extends View> extends Grid {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const node = this.node as T;
        const data = <GridCellData> node.data(`${EXT_NAME.GRID}:gridCellData`);
        if (data) {
            if (data.rowSpan > 1) {
                node.app('layout_rowSpan', data.rowSpan.toString());
            }
            if (data.columnSpan > 1) {
                node.app('layout_columnSpan', data.columnSpan.toString());
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
                const parent = node.renderParent as T;
                if (parent.is(NODE_STANDARD.GRID)) {
                    const gridData = <GridData> parent.data(`${EXT_NAME.GRID}:gridData`);
                    const gridCellData = <GridCellData> node.data(`${EXT_NAME.GRID}:gridCellData`);
                    if (gridData && gridCellData) {
                        const dimensions = getBoxSpacing(node.documentParent.element, true);
                        const padding = gridData.padding;
                        if (gridCellData.cellFirst) {
                            const heightTop = convertInt(dimensions.paddingTop) + convertInt(dimensions.marginTop);
                            if (heightTop > 0) {
                                padding.top = heightTop;
                            }
                        }
                        if (gridCellData.rowStart) {
                            const marginLeft = convertInt(dimensions.marginLeft) + convertInt(dimensions.paddingLeft);
                            if (marginLeft > 0) {
                                padding.left = Math.max(marginLeft, padding.left);
                            }
                        }
                        if (gridCellData.rowEnd) {
                            const heightBottom = convertInt(dimensions.marginBottom) + convertInt(dimensions.paddingBottom) + (!gridCellData.cellLast ? convertInt(dimensions.marginTop) + convertInt(dimensions.paddingTop) : 0);
                            if (heightBottom > 0) {
                                if (gridCellData.cellLast) {
                                    padding.bottom = heightBottom;
                                }
                                else {
                                    this.application.controllerHandler.appendAfter(node.id, this.application.controllerHandler.renderNodeStatic(NODE_STANDARD.SPACE, node.renderDepth, { app: { layout_columnSpan: gridData.columnCount } }, 'match_parent', formatPX(heightBottom)));
                                }
                            }
                            const marginRight = convertInt(dimensions.marginRight) + convertInt(dimensions.paddingRight);
                            if (marginRight > 0) {
                                padding.right = Math.max(marginRight, padding.right);
                            }
                        }
                    }
                }
            }
        });
        for (const node of extended) {
            const data = <GridData> node.data(`${EXT_NAME.GRID}:gridData`);
            if (data) {
                const padding = data.padding;
                if (padding.top > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_TOP, node.paddingTop + padding.top);
                }
                if (padding.right > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_RIGHT, node.paddingRight + padding.right);
                }
                if (padding.bottom > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, node.paddingBottom + padding.bottom);
                }
                if (padding.left > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_LEFT, node.paddingLeft + padding.left);
                }
            }
        }
    }
}