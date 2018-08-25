import { LayoutMap, ObjectIndex } from '../lib/types';
import { ExtensionResult } from './lib/types';
import { GridCellData, GridData } from './lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { hasValue, sortAsc, withinFraction } from '../lib/util';
import { BLOCK_ELEMENT, NODE_ALIGNMENT } from '../lib/constants';
import { EXT_NAME } from './lib/constants';

type T = Node;

export default class Grid extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public condition() {
        const node = this.node;
        return (
            this.included() ||
            (!hasValue(node.dataset.ext) && !node.flex.enabled && node.children.length > 1 && BLOCK_ELEMENT.includes(node.children[0].tagName) && node.children.some(item => item.children.length > 1) && node.children.every(item => !item.flex.enabled && node.children[0].element.tagName === item.element.tagName && NodeList.linearX(item.children)))
        );
    }

    public processNode(mapX: LayoutMap<T>, mapY: LayoutMap<T>): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        const balanceColumns = this.options.balanceColumns;
        let xml = '';
        let columns: any[] = [];
        const gridData: GridData = {
            columnEnd: [],
            columnCount: 0,
            padding: { top: 0, right: [], bottom: 0, left: [] }
        };
        if (balanceColumns) {
            const dimensions: number[][] = [];
            node.each((item: T, index: number) => {
                const children = item.children;
                dimensions[index] = [];
                for (let l = 0; l < children.length; l++) {
                    dimensions[index].push(children[l].bounds.width);
                }
                columns.push(children);
            });
            const base = columns[
                dimensions.findIndex((item: number[]) => {
                    return (item === dimensions.reduce((a, b) => {
                        if (a.length === b.length) {
                            return (a.reduce((c, d) => c + d, 0) < b.reduce((c, d) => c + d, 0) ? a : b);
                        }
                        else {
                            return (a.length < b.length ? a : b);
                        }
                    }));
                })];
            if (base.length > 1) {
                let maxIndex = -1;
                let assigned: number[] = [];
                let every = false;
                for (let l = 0; l < base.length; l++) {
                    const bounds = base[l].bounds;
                    const found: number[] = [];
                    if (l < base.length - 1) {
                        for (let m = 0; m < columns.length; m++) {
                            if (columns[m] === base) {
                                found.push(l);
                            }
                            else {
                                const result = columns[m].findIndex((item: T, index) => index >= l && Math.floor(item.bounds.width) === Math.floor(bounds.width) && index < columns[m].length - 1);
                                if (result !== -1) {
                                    found.push(result);
                                }
                                else {
                                    found.length = 0;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        for (let m = 0; m < columns.length; m++) {
                            if (columns[m].length > base.length) {
                                const removed = columns[m].splice(assigned[m] + (every ? 2 : 1), columns[m].length - base.length);
                                columns[m][assigned[m] + (every ? 1 : 0)].data(`${EXT_NAME.GRID}:gridSiblings`, [...removed]);
                            }
                        }
                    }
                    if (found.length === columns.length) {
                        const minIndex = found.reduce((a, b) => Math.min(a, b));
                        maxIndex = found.reduce((a, b) => Math.max(a, b));
                        if (maxIndex > minIndex) {
                            for (let m = 0; m < columns.length; m++) {
                                if (found[m] > minIndex) {
                                    const removed = columns[m].splice(minIndex, found[m] - minIndex);
                                    columns[m][assigned[m] + (every ? 1 : 0)].data(`${EXT_NAME.GRID}:gridSiblings`, [...removed]);
                                }
                            }
                        }
                        assigned = found;
                        every = true;
                    }
                    else {
                        assigned = new Array(columns.length).fill(l);
                        every = false;
                    }
                }
            }
            else {
                columns.length = 0;
            }
        }
        else {
            const nextMapX: ObjectIndex<T[]> = mapX[node.depth + 2];
            const nextCoordsX = (nextMapX ? Object.keys(nextMapX) : []);
            const columnEnd: number[] = [];
            if (nextCoordsX.length > 1) {
                const columnRight: number[] = [];
                for (let l = 0; l < nextCoordsX.length; l++) {
                    const nextAxisX = sortAsc(nextMapX[parseInt(nextCoordsX[l])].filter(item => item.parent.parent && item.parent.parent.id === node.id), 'linear.top');
                    columnRight[l] = (l === 0 ? 0 : columnRight[l - 1]);
                    for (let m = 0; m < nextAxisX.length; m++) {
                        const nextX = nextAxisX[m];
                        let [left, right] = [nextX.linear.left, nextX.linear.right];
                        let index = l;
                        if (index > 0 && nextX.float === 'right') {
                            const style = nextX.element.style;
                            style.cssFloat = 'left';
                            const bounds = nextX.element.getBoundingClientRect();
                            if (left !== (bounds.left - node.marginLeft)) {
                                [left, right] = [bounds.left - node.marginLeft, bounds.right + node.marginRight];
                                for (let n = 1; n < columnRight.length; n++) {
                                    index = n;
                                    if (left > columnRight[n - 1]) {
                                        break;
                                    }
                                }
                            }
                            style.cssFloat = 'right';
                        }
                        function findRowIndex() {
                            return columns[0].findIndex(item => withinFraction(item.linear.top, nextX.linear.top) || (nextX.linear.top >= item.linear.top && nextX.linear.bottom <= item.linear.bottom));
                        }
                        if (index === 0 || left >= columnRight[index - 1]) {
                            if (columns[index] == null) {
                                columns[index] = [];
                            }
                            if (index === 0 || columns[0].length === nextAxisX.length) {
                                columns[index][m] = nextX;
                            }
                            else {
                                const row = findRowIndex();
                                if (row !== -1) {
                                    columns[index][row] = nextX;
                                }
                            }
                        }
                        else {
                            const current = columns.length - 1;
                            if (columns[current] != null) {
                                const minLeft = columns[current].reduce((a: number, b: T) => Math.min(a, b.linear.left), Number.MAX_VALUE);
                                const maxRight = columns[current].reduce((a: number, b: T) => Math.max(a, b.linear.right), 0);
                                if (left > minLeft && right > maxRight) {
                                    const filtered = columns.filter(item => item);
                                    const row = findRowIndex();
                                    if (row !== -1 && filtered[filtered.length - 1][row] == null) {
                                        columns[current] = null;
                                    }
                                }
                            }
                        }
                        columnRight[l] = Math.max(nextX.linear.right, columnRight[l]);
                    }
                }
                for (let l = 0, m = -1; l < columnRight.length; l++) {
                    if (m === -1 && columns[l] == null) {
                        m = l - 1;
                    }
                    else if (columns[l] == null) {
                        if (m !== -1 && l === columnRight.length - 1) {
                            columnRight[m] = columnRight[l];
                        }
                        continue;
                    }
                    else if (m !== -1) {
                        columnRight[m] = columnRight[l - 1];
                        m = -1;
                    }
                }
                for (let l = 0; l < columns.length; l++) {
                    if (columns[l] != null) {
                        columnEnd.push(columnRight[l]);
                    }
                }
                columns = columns.filter(item => item);
                const columnLength = columns.reduce((a, b) => Math.max(a, b.length), 0);
                for (let l = 0; l < columnLength; l++) {
                    for (let m = 0; m < columns.length; m++) {
                        if (columns[m][l] == null) {
                            columns[m][l] = { spacer: 1 };
                        }
                    }
                }
            }
            if (columnEnd.length > 0) {
                gridData.columnEnd = columnEnd;
                gridData.columnEnd[gridData.columnEnd.length - 1] = node.box.right;
            }
        }
        if (columns.length > 1) {
            gridData.columnCount = (balanceColumns ? columns[0].length : columns.length);
            xml = this.application.writeGridLayout(node, parent, gridData.columnCount);
            for (let l = 0, count = 0; l < columns.length; l++) {
                let spacer = 0;
                for (let m = 0, start = 0; m < columns[l].length; m++) {
                    const item = columns[l][m] as T;
                    if (!(<any> item).spacer) {
                        item.parent.hide();
                        item.parent = node;
                        const data: GridCellData = {
                            inherit: true,
                            rowSpan: 0,
                            columnSpan: 0,
                            index: -1,
                            cellFirst: false,
                            cellLast: false,
                            rowEnd: false,
                            rowStart: false
                        };
                        if (balanceColumns) {
                            data.rowStart = (m === 0);
                            data.rowEnd = (m === columns[l].length - 1);
                            data.cellFirst = (l === 0 && m === 0);
                            data.cellLast = (l === columns.length - 1 && data.rowEnd);
                            data.index = m;
                        }
                        else {
                            let rowSpan = 1;
                            let columnSpan = 1 + spacer;
                            for (let n = l + 1; n < columns.length; n++) {
                                if (columns[n][m].spacer === 1) {
                                    columnSpan++;
                                    columns[n][m].spacer = 2;
                                }
                                else {
                                    break;
                                }
                            }
                            if (columnSpan === 1) {
                                for (let n = m + 1; n < columns[l].length; n++) {
                                    if (columns[l][n].spacer === 1) {
                                        rowSpan++;
                                        columns[l][n].spacer = 2;
                                    }
                                    else {
                                        break;
                                    }
                                }
                            }
                            data.rowSpan = rowSpan;
                            data.columnSpan = columnSpan;
                            data.rowStart = (start++ === 0);
                            data.rowEnd = (columnSpan + l === columns.length);
                            data.cellFirst = (count++ === 0);
                            data.cellLast = (data.rowEnd && m === columns[l].length - 1);
                            data.index = l;
                            spacer = 0;
                        }
                        item.data(`${EXT_NAME.GRID}:gridCellData`, data);
                    }
                    else if ((<any> item).spacer === 1) {
                        spacer++;
                    }
                }
            }
            node.data(`${EXT_NAME.GRID}:gridData`, gridData);
            node.render(parent);
        }
        return { xml };
    }

    public processChild(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        const gridData = <GridData> parent.data(`${EXT_NAME.GRID}:gridData`);
        const gridCellData = <GridCellData> node.data(`${EXT_NAME.GRID}:gridCellData`);
        let xml = '';
        if (gridData && gridCellData) {
            let siblings: T[];
            if (this.options.balanceColumns) {
                siblings = node.data(`${EXT_NAME.GRID}:gridSiblings`);
            }
            else {
                const columnEnd = gridData.columnEnd[Math.min(gridCellData.index + (gridCellData.columnSpan - 1), gridData.columnEnd.length - 1)];
                siblings = node.documentParent.children.filter(item => !item.rendered && item.linear.left >= node.linear.right && item.linear.right <= columnEnd);
            }
            if (siblings && siblings.length > 0) {
                siblings.unshift(node);
                const [linearX, linearY] = [NodeList.linearX(siblings), NodeList.linearY(siblings)];
                const group = this.application.controllerHandler.createGroup(node, siblings, parent);
                if (linearX || linearY) {
                    const horizontal = !(linearY && !linearX);
                    xml = this.application.writeLinearLayout(group, parent, horizontal);
                    group.alignmentType = (horizontal ? NODE_ALIGNMENT.HORIZONTAL : NODE_ALIGNMENT.VERTICAL);
                    this.application.sortLayout(group, group.children, group.alignmentType, true);
                }
                else {
                    xml = this.application.writeConstraintLayout(group, parent);
                }
                return { xml, parent: group };
            }
        }
        return { xml };
    }
}