import { ExtensionResult, ObjectIndex } from '../lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { BLOCK_CHROME } from '../lib/constants';
import { sortAsc } from '../lib/util';

type T = Node;
type U = NodeList<T>;

export default class Grid extends Extension<T, U> {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public condition() {
        return (
            this.included() ||
            ((this.node.element.dataset == null || this.node.element.dataset.extension == null) && !this.node.flex.enabled && this.node.children.length > 1 && this.node.children.every(node => !node.flex.enabled && this.node.children[0].tagName === node.tagName && BLOCK_CHROME.includes(node.tagName) && node.children.length > 1 && node.children.every(child => child.css('float') !== 'right')))
        );
    }

    public processNode(mapX: ObjectIndex<{}>, mapY: ObjectIndex<{}>): ExtensionResult {
        let xml = '';
        let columns: any[][] = [];
        const columnEnd: number[] = [];
        const balanceColumns = this.options.balanceColumns;
        if (balanceColumns) {
            const dimensions: number[][] = [];
            for (let l = 0; l < this.node.children.length; l++) {
                const children = this.node.children[l].children;
                dimensions[l] = [];
                for (let m = 0; m < children.length; m++) {
                    dimensions[l].push(children[m].bounds.width);
                }
                columns.push(children);
            }
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
                                const result = columns[m].findIndex((item: T, index) => (index >= l && Math.floor(item.bounds.width) === Math.floor(bounds.width) && index < columns[m].length - 1));
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
                                columns[m][assigned[m] + (every ? 1 : 0)].gridSiblings = [...removed];
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
                                    columns[m][assigned[m]].gridSiblings = [...removed];
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
            const nextMapX = mapX[this.node.depth + 2];
            const nextCoordsX = (nextMapX ? Object.keys(nextMapX) : []);
            if (nextCoordsX.length > 1) {
                const columnRight: number[] = [];
                for (let l = 0; l < nextCoordsX.length; l++) {
                    const nextAxisX = nextMapX[nextCoordsX[l]].sortAsc('bounds.top');
                    columnRight[l] = (l === 0 ? 0 : columnRight[l - 1]);
                    for (let m = 0; m < nextAxisX.length; m++) {
                        const nextX = nextAxisX[m];
                        if (nextX.parent.parent && this.node.id === nextX.parent.parent.id) {
                            const [left, right] = [nextX.bounds.left, nextX.bounds.right];
                            if (l === 0 || left >= columnRight[l - 1]) {
                                if (columns[l] == null) {
                                    columns[l] = [];
                                }
                                columns[l].push(nextX);
                            }
                            columnRight[l] = Math.max(right, columnRight[l]);
                        }
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
                    let top: number | null = null;
                    for (let m = 0; m < columns.length; m++) {
                        const nodeX = columns[m][l];
                        if (nodeX != null) {
                            if (top == null) {
                                top = nodeX.bounds.top;
                            }
                            else if (nodeX.bounds.top !== top) {
                                const nextRowX = columns[m - 1][l + 1];
                                if (columns[m][l - 1] == null || (nextRowX && nextRowX.bounds.top === nodeX.bounds.top)) {
                                    columns[m].splice(l, 0, { spacer: 1 });
                                }
                                else if (columns[m][l + 1] == null) {
                                    columns[m][l + 1] = nodeX;
                                    columns[m][l] = { spacer: 1 };
                                }
                            }
                        }
                        else {
                            columns[m].splice(l, 0, { spacer: 1 });
                        }
                    }
                }
            }
        }
        if (columns.length > 1) {
            this.node.gridColumnEnd = columnEnd;
            this.node.gridColumnCount = (balanceColumns ? columns[0].length : columns.length);
            xml = this.application.writeGridLayout(this.node, (<T> this.parent), this.node.gridColumnCount);
            for (let l = 0, count = 0; l < columns.length; l++) {
                let spacer = 0;
                for (let m = 0, start = 0; m < columns[l].length; m++) {
                    const node = columns[l][m];
                    if (!node.spacer) {
                        node.parent.hide();
                        node.parent = this.node;
                        if (balanceColumns) {
                            node.gridRowStart = (m === 0);
                            node.gridRowEnd = (m === columns[l].length - 1);
                            node.gridFirst = (l === 0 && m === 0);
                            node.gridLast = (l === columns.length - 1 && node.gridRowEnd);
                            node.gridIndex = m;
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
                            if (rowSpan > 1) {
                                node.gridRowSpan = rowSpan;
                            }
                            if (columnSpan > 1) {
                                node.gridColumnSpan = columnSpan;
                            }
                            node.gridRowStart = (start++ === 0);
                            node.gridRowEnd = (columnSpan + l === columns.length);
                            node.gridFirst = (count++ === 0);
                            node.gridLast = (node.gridRowEnd && m === columns[l].length - 1);
                            node.gridIndex = l;
                            spacer = 0;
                        }
                    }
                    else if (node.spacer === 1) {
                        spacer++;
                    }
                }
            }
        }
        return [xml, false];
    }

    public processChild(): ExtensionResult {
        let xml = '';
        let siblings: T[];
        const parent = (<T> this.parent);
        if (this.options.balanceColumns) {
            siblings = this.node.gridSiblings;
        }
        else {
            const columnEnd = parent.gridColumnEnd[this.node.gridIndex + this.node.gridColumnSpan];
            siblings = this.node.parentOriginal.children.filter(item => !item.renderParent && item.bounds.left >= this.node.bounds.right && item.bounds.right <= columnEnd);
        }
        if (siblings != null && siblings.length > 0) {
            siblings.unshift(this.node);
            sortAsc(siblings, 'bounds.x');
            const viewGroup = this.application.controllerHandler.createGroup(this.node, parent, siblings);
            this.application.cache.list.push(viewGroup);
            const [linearX, linearY] = [NodeList.linearX(siblings), NodeList.linearY(siblings)];
            if (linearX || linearY) {
                xml = this.application.writeLinearLayout(viewGroup, parent, linearY);
            }
            else {
                xml = this.application.writeDefaultLayout(viewGroup, parent);
            }
            return [xml, true];
        }
        return ['', false];
    }
}