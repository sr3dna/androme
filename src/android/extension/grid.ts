import { ExtensionResult } from '../../lib/types';
import { GridCellData, GridData } from '../../extension/lib/types';
import Grid from '../../extension/grid';
import View from '../view';
import { averageInt, convertInt, convertPX } from '../../lib/util';
import { getBoxSpacing } from '../../lib/dom';
import { BOX_STANDARD, NODE_STANDARD } from '../../lib/constants';
import { EXT_NAME } from '../../extension/lib/constants';

export default class GridAndroid<T extends View> extends Grid {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const node = (<T> this.node);
        const data = (<GridCellData> node.data(`${EXT_NAME.GRID}:gridCellData`));
        if (data != null) {
            if (data.rowSpan > 1) {
                node.android('layout_rowSpan', data.rowSpan.toString());
            }
            if (data.columnSpan > 1) {
                node.android('layout_columnSpan', data.columnSpan.toString());
            }
        }
        return super.processChild();
    }

    public afterRender() {
        const extended: T[] = [];
        this.application.cache.list.forEach((node: T) => {
            if (node.renderExtension === this) {
                extended.push(node);
            }
            else {
                const parent = (<T> node.renderParent);
                if (parent instanceof View && parent.is(NODE_STANDARD.GRID)) {
                    const gridData = (<GridData> parent.data(`${EXT_NAME.GRID}:gridData`));
                    const gridCellData = (<GridCellData> node.data(`${EXT_NAME.GRID}:gridCellData`));
                    if (gridData != null && gridCellData != null) {
                        const dimensions = getBoxSpacing(<HTMLElement> node.documentParent.element, true);
                        if (gridCellData.cellFirst) {
                            const heightTop = convertInt(dimensions.paddingTop) + convertInt(dimensions.marginTop);
                            if (heightTop > 0) {
                                gridData.padding.top = heightTop;
                            }
                        }
                        if (gridCellData.rowStart) {
                            const marginLeft = convertInt(dimensions.marginLeft) + convertInt(dimensions.paddingLeft);
                            if (marginLeft > 0) {
                                gridData.padding.left.push(marginLeft);
                            }
                        }
                        if (gridCellData.rowEnd) {
                            const heightBottom = convertInt(dimensions.marginBottom) + convertInt(dimensions.paddingBottom) + (!gridCellData.cellLast ? convertInt(dimensions.marginTop) + convertInt(dimensions.paddingTop) : 0);
                            if (heightBottom > 0) {
                                if (gridCellData.cellLast) {
                                    gridData.padding.bottom = heightBottom;
                                }
                                else {
                                    const controller = this.application.controllerHandler;
                                    controller.appendAfter(node.id, controller.renderNodeStatic(NODE_STANDARD.SPACE, node.renderDepth, { android: { layout_columnSpan: gridData.columnCount } }, 'match_parent', convertPX(heightBottom)));
                                }
                            }
                            const marginRight = convertInt(dimensions.marginRight) + convertInt(dimensions.paddingRight);
                            if (marginRight > 0) {
                                gridData.padding.right.push(marginRight);
                            }
                        }
                    }
                }
            }
        });
        extended.forEach(node => {
            const data = (<GridData> node.data(`${EXT_NAME.GRID}:gridData`));
            if (data != null) {
                if (data.padding.top > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_TOP, data.padding.top);
                }
                if (data.padding.right.length > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_RIGHT, averageInt(data.padding.right));
                }
                if (data.padding.bottom > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, data.padding.bottom);
                }
                if (data.padding.left.length > 0) {
                    node.modifyBox(BOX_STANDARD.PADDING_LEFT, averageInt(data.padding.left));
                }
            }
        });
    }
}