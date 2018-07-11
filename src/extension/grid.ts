import { ExtensionResult, ObjectIndex } from '../lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { sortAsc, withinFraction } from '../lib/util';
import { BLOCK_CHROME } from '../lib/constants';

type T = Node;
type U = NodeList<T>;

export default class Grid extends Extension<T, U> {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public condition() {
        const node = (<T> this.node);
        return (
            this.included() ||
            (node.hasElement && node.element.dataset.ext == null && !node.flex.enabled && node.children.length > 1 && BLOCK_CHROME.includes(node.children[0].tagName) && node.children.some(item => item.children.length > 1) && node.children.every(item => !item.flex.enabled && node.children[0].tagName === item.tagName && NodeList.linearX(item.children)))
        );
    }

    public processNode(mapX: ObjectIndex<ObjectIndex<T[]>>, mapY: ObjectIndex<ObjectIndex<T[]>>): ExtensionResult {
        const node = (<T> this.node);
        const parent = (<T> this.parent);
        let xml = '';
        let columns: any[] = [];
        const balanceColumns = this.options.balanceColumns;
        if (balanceColumns) {
            const dimensions: number[][] = [];
            for (let l = 0; l < node.children.length; l++) {
                const children = node.children[l].children;
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
                        if (index > 0 && nextX.css('float') === 'right') {
                            const style: any = nextX.element.style;
                            style.float = 'left';
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
                            style.float = 'right';
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
                node.gridColumnEnd = columnEnd;
                node.gridColumnEnd[node.gridColumnEnd.length - 1] = node.box.right;
            }
        }
        if (columns.length > 1) {
            node.gridColumnCount = (balanceColumns ? columns[0].length : columns.length);
            xml = this.application.writeGridLayout(node, parent, node.gridColumnCount);
            for (let l = 0, count = 0; l < columns.length; l++) {
                let spacer = 0;
                for (let m = 0, start = 0; m < columns[l].length; m++) {
                    const item = columns[l][m];
                    if (!item.spacer) {
                        item.parent.hide();
                        item.parent = node;
                        if (balanceColumns) {
                            item.gridRowStart = (m === 0);
                            item.gridRowEnd = (m === columns[l].length - 1);
                            item.gridFirst = (l === 0 && m === 0);
                            item.gridLast = (l === columns.length - 1 && item.gridRowEnd);
                            item.gridIndex = m;
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
                            item.gridRowSpan = rowSpan;
                            item.gridColumnSpan = columnSpan;
                            item.gridRowStart = (start++ === 0);
                            item.gridRowEnd = (columnSpan + l === columns.length);
                            item.gridFirst = (count++ === 0);
                            item.gridLast = (item.gridRowEnd && m === columns[l].length - 1);
                            item.gridIndex = l;
                            spacer = 0;
                        }
                    }
                    else if (item.spacer === 1) {
                        spacer++;
                    }
                }
            }
            node.render(parent);
        }
        return { xml };
    }

    public processChild(): ExtensionResult {
        const node = (<T> this.node);
        const parent = (<T> this.parent);
        let siblings: T[];
        let xml = '';
        if (this.options.balanceColumns) {
            siblings = node.gridSiblings;
        }
        else {
            const columnEnd = parent.gridColumnEnd[Math.min(node.gridIndex + (node.gridColumnSpan - 1), parent.gridColumnEnd.length - 1)];
            siblings = node.documentParent.children.filter(item => !item.renderParent && item.linear.left >= node.linear.right && item.linear.right <= columnEnd);
        }
        if (siblings != null && siblings.length > 0) {
            siblings.unshift(node);
            sortAsc(siblings, 'linear.left');
            const viewGroup = this.application.controllerHandler.createGroup(node, parent, siblings);
            const [linearX, linearY] = [NodeList.linearX(siblings), NodeList.linearY(siblings)];
            if (linearX || linearY) {
                xml = this.application.writeLinearLayout(viewGroup, parent, linearY);
            }
            else {
                xml = this.application.writeDefaultLayout(viewGroup, parent);
            }
            return { xml, parent: viewGroup };
        }
        return { xml };
    }
}