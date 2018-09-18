import { ExtensionResult } from './lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import { convertFloat, convertInt, formatPX, isPercent, isUnit } from '../lib/util';
import { EXT_NAME } from './lib/constants';
import { cssInherit, getStyle } from '../lib/dom';
import { BOX_STANDARD, CSS_STANDARD } from '../lib/constants';

export default class Table<T extends Node> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        let xml = '';
        const node = this.node;
        const parent = this.parent as T;
        const table: T[] = [];
        const thead = node.children.filter(item => item.tagName === 'THEAD');
        const tbody = node.children.filter(item => item.tagName === 'TBODY');
        const tfoot = node.children.filter(item => item.tagName === 'TFOOT');
        const colgroup = Array.from(node.element.children).find(element => element.tagName === 'COLGROUP');
        const tableWidth = node.css('width');
        if (thead.length > 0) {
            thead[0].cascade().filter(item => item.tagName === 'TH' || item.tagName === 'TD').forEach(item => item.inherit(thead[0], 'styleMap'));
            table.push(...thead[0].children as T[]);
            thead.forEach(item => item.hide());
        }
        if (tbody.length > 0) {
            tbody.forEach(item => {
                table.push(...item.children as T[]);
                item.hide();
            });
        }
        if (tfoot.length > 0) {
            tfoot[0].cascade().filter(item => item.tagName === 'TH' || item.tagName === 'TD').forEach(item => item.inherit(tfoot[0], 'styleMap'));
            table.push(...tfoot[0].children as T[]);
            tfoot.forEach(item => item.hide());
        }
        const borderCollapse = (node.css('borderCollapse') === 'collapse');
        const [width, height] = (borderCollapse ? [0, 0] : node.css('borderSpacing').split(' ').map(value => parseInt(value)));
        if (width > 0) {
            node.modifyBox(BOX_STANDARD.PADDING_LEFT, width);
            node.modifyBox(BOX_STANDARD.PADDING_RIGHT, width);
        }
        if (height > 0) {
            node.modifyBox(BOX_STANDARD.PADDING_TOP, height);
            node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, height);
        }
        const spacingWidth = formatPX((width > 1 ? Math.round(width / 2) : width));
        const spacingHeight = formatPX((height > 1 ? Math.round(height / 2) : width));
        const mapWidth: string[] = [];
        const mapBounds: number[] = [];
        const fixedTable = (node.css('tableLayout') === 'fixed');
        let columnIndex = new Array(table.length).fill(0);
        let multiLine = false;
        for (let i = 0; i < table.length; i++) {
            const tr = table[i];
            for (let j = 0; j < tr.children.length; j++) {
                const td = tr.children[j];
                const element = <HTMLTableCellElement> tr.children[j].element;
                for (let k = 0; k < element.rowSpan - 1; k++)  {
                    const l = (i + 1) + k;
                    if (columnIndex[l] != null) {
                        columnIndex[l] += element.colSpan;
                    }
                }
                if (!td.has('background') && !td.has('backgroundColor')) {
                    const item = <HTMLElement> td.element;
                    if (colgroup != null) {
                        const style = getStyle(colgroup.children[columnIndex[i]]);
                        if (style.background) {
                            item.style.background = style.background;
                        }
                        else if (style.backgroundColor) {
                            item.style.backgroundColor = style.backgroundColor;
                        }
                    }
                    else {
                        let value = cssInherit(item, 'background', 'TABLE', ['rgba(0, 0, 0, 0)']);
                        if (value !== '') {
                            item.style.background = value;
                        }
                        else {
                            value = cssInherit(item, 'backgroundColor', 'TABLE', ['rgba(0, 0, 0, 0)']);
                            if (value !== '') {
                                item.style.backgroundColor = value;
                            }
                        }
                    }
                }
                const columnWidth = td.styleMap.width;
                const m = columnIndex[i];
                if (i === 0 || mapWidth[m] == null || !fixedTable) {
                    if (columnWidth == null || columnWidth === 'auto') {
                        if (mapWidth[m] == null) {
                            mapWidth[m] = columnWidth || '0px';
                            mapBounds[m] = 0;
                        }
                    }
                    else {
                        const percentColumnWidth = isPercent(columnWidth);
                        const unitMapWidth = isUnit(mapWidth[m]);
                        if (mapWidth[m] == null || td.bounds.width > mapBounds[m] || (td.bounds.width === mapBounds[m] && ((mapWidth[m] === 'auto' && (percentColumnWidth || unitMapWidth)) || (percentColumnWidth && unitMapWidth) || (percentColumnWidth && isPercent(mapWidth[m]) && convertFloat(columnWidth) > convertFloat(mapWidth[m])) || (isUnit(columnWidth) && unitMapWidth && convertInt(columnWidth) > convertInt(mapWidth[m]))))) {
                            mapWidth[m] = columnWidth;
                        }
                        if (element.colSpan === 1) {
                            mapBounds[m] = td.bounds.width;
                        }
                    }
                }
                td.css({
                    marginTop: (i === 0 ? '0px' : spacingHeight),
                    marginRight: (j < tr.children.length - 1 ? spacingWidth : '0px'),
                    marginBottom: (i + element.rowSpan - 1 >= table.length - 1 ? '0px' : spacingHeight),
                    marginLeft: (columnIndex[i] === 0 ? '0px' : spacingWidth)
                });
                if (!multiLine) {
                    multiLine = td.multiLine;
                }
                columnIndex[i] += element.colSpan;
            }
        }
        const columnCount: number = Math.max.apply(null, columnIndex);
        let rowCount = table.length;
        let borderInside = false;
        if (mapWidth.every(value => isPercent(value)) && mapWidth.reduce((a, b) => a + parseFloat(b), 0) > 1) {
            let percentTotal = 100;
            mapWidth.forEach((value, index) => {
                const percent = parseFloat(value);
                if (percentTotal <= 0) {
                    mapWidth[index] = '0px';
                }
                else if (percentTotal - percent < 0) {
                    mapWidth[index] = `${percentTotal}%`;
                }
                percentTotal -= percent;
            });
        }
        else if (mapWidth.every(value => isUnit(value))) {
            const pxWidth = mapWidth.reduce((a, b) => a + parseInt(b), 0);
            if (isPercent(tableWidth) || pxWidth < node.viewWidth) {
                mapWidth.filter(value => value !== '0px').forEach((value, index) => mapWidth[index] = `${(parseInt(value) / pxWidth) * 100}%`);
            }
            else if (tableWidth === 'auto') {
                mapWidth.filter(value => value !== '0px').forEach((value, index) => mapWidth[index] = (mapBounds[index] == null ? 'undefined' : `${(mapBounds[index] / node.bounds.width) * 100}%`));
            }
            else if (pxWidth > node.viewWidth) {
                node.css('width', 'auto');
                if (!fixedTable) {
                    node.cascade().forEach(item => item.css('width', 'auto'));
                }
            }
        }
        const mapPercent = mapWidth.reduce((a, b) => a + (isPercent(b) ? parseFloat(b) : 0), 0);
        const typeWidth = (() => {
            const sameWidth = mapWidth.every(value => value === mapWidth[0]);
            if (sameWidth && node.has('width', CSS_STANDARD.AUTO, { map: 'initial' }) && !multiLine) {
                return 0;
            }
            else if ((sameWidth && mapWidth[0] === 'auto') || mapWidth.some(value => isPercent(value))) {
                return 3;
            }
            else if (sameWidth && (node.viewWidth > 0 || node.has('width', CSS_STANDARD.PERCENT) || multiLine)) {
                return 2;
            }
            else if (mapWidth.every(value => isUnit(value) || value === 'auto')) {
                return 1;
            }
            else {
                return 0;
            }
        })();
        if ((typeWidth === 2 && node.viewWidth === 0) || multiLine) {
            node.data(EXT_NAME.TABLE, 'expand', true);
        }
        const caption = node.children.find(item => item.tagName === 'CAPTION');
        node.children.length = 0;
        if (caption) {
            if (!caption.has('textAlign', CSS_STANDARD.LEFT)) {
                caption.css('textAlign', 'center');
            }
            rowCount++;
            caption.data(EXT_NAME.TABLE, 'colSpan', columnCount);
            caption.parent = node;
        }
        columnIndex = new Array(table.length).fill(0);
        function setAutoWidth(td: T) {
            td.data(EXT_NAME.TABLE, 'percent', `${Math.round((td.bounds.width / node.bounds.width) * 100)}%`);
            td.data(EXT_NAME.TABLE, 'expand', true);
        }
        function setBoundsWidth(td: T) {
            const boundsWidth = td.bounds.width - (td.borderLeftWidth + td.borderRightWidth);
            td.css('width', formatPX(boundsWidth));
        }
        for (let i = 0; i < table.length; i++) {
            const tr = table[i];
            const children = tr.children.slice();
            for (let j = 0; j < children.length; j++) {
                const td = children[j] as T;
                const element = <HTMLTableCellElement> td.element;
                for (let k = 0; k < element.rowSpan - 1; k++)  {
                    const l = (i + 1) + k;
                    if (columnIndex[l] != null) {
                        columnIndex[l] += element.colSpan;
                    }
                }
                if (element.rowSpan > 1) {
                    td.data(EXT_NAME.TABLE, 'rowSpan', element.rowSpan);
                }
                if (element.colSpan > 1) {
                    td.data(EXT_NAME.TABLE, 'colSpan', element.colSpan);
                }
                if (!td.has('verticalAlign')) {
                    td.css('verticalAlign', 'middle');
                }
                if (convertInt(td.css('borderWidth')) > 0 && td.css('borderStyle') !== 'none') {
                    borderInside = true;
                }
                const columnWidth = mapWidth[columnIndex[i]];
                if (columnWidth !== 'undefined') {
                    switch (typeWidth) {
                        case 3:
                            if (columnWidth === 'auto') {
                                if (mapPercent >= 1) {
                                    setBoundsWidth(td);
                                    td.data(EXT_NAME.TABLE, 'exceed', true);
                                    td.data(EXT_NAME.TABLE, 'downsized', true);
                                }
                                else {
                                    setAutoWidth(td as T);
                                }
                            }
                            else if (isPercent(columnWidth)) {
                                td.data(EXT_NAME.TABLE, 'percent', columnWidth);
                                td.data(EXT_NAME.TABLE, 'expand', true);
                            }
                            else if (convertInt(columnWidth) > 0) {
                                if (td.bounds.width >= parseInt(columnWidth)) {
                                    td.css('width', columnWidth);
                                    td.data(EXT_NAME.TABLE, 'expand', false);
                                    td.data(EXT_NAME.TABLE, 'downsized', false);
                                }
                                else {
                                    if (fixedTable) {
                                        setAutoWidth(td as T);
                                        td.data(EXT_NAME.TABLE, 'downsized', true);
                                    }
                                    else {
                                        setBoundsWidth(td);
                                        td.data(EXT_NAME.TABLE, 'expand', false);
                                    }
                                }
                            }
                            else {
                                td.data(EXT_NAME.TABLE, 'expand', false);
                            }
                            break;
                        case 2:
                            td.css('width', '0px');
                            break;
                        case 1:
                            if (columnWidth === 'auto') {
                                td.css('width', '0px');
                            }
                            else {
                                if (fixedTable) {
                                    td.data(EXT_NAME.TABLE, 'downsized', true);
                                }
                                else {
                                    setBoundsWidth(td);
                                }
                                td.data(EXT_NAME.TABLE, 'expand', false);
                            }
                            break;

                    }
                }
                columnIndex[i] += element.colSpan;
                td.parent = node;
            }
            if (columnIndex[i] < columnCount) {
                const td = children[children.length - 1];
                td.data(EXT_NAME.TABLE, 'spaceSpan', columnCount - columnIndex[i]);
            }
            tr.hide();
        }
        if (borderCollapse && borderInside) {
            node.css({
                borderTopWidth: '0px',
                borderRightWidth: '0px',
                borderBottomWidth: '0px',
                borderLeftWidth: '0px'
            });
        }
        node.data(EXT_NAME.TABLE, 'boundsWidth', mapBounds.reduce((a, b) => a + b, 0));
        xml = this.application.writeGridLayout(node, parent, columnCount, rowCount);
        return { xml, complete: true };
    }
}