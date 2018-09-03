import { ExtensionResult } from './lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import { convertInt, formatPX, isPercent } from '../lib/util';
import { EXT_NAME } from './lib/constants';
import { cssInherit, getStyle } from '../lib/dom';
import { BOX_STANDARD } from '../lib/constants';

export default class Table<T extends Node> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        let xml = '';
        const node = this.node;
        const parent = this.parent as T;
        const table: T[] = [];
        const thead = node.children.filter(item => item.element.tagName === 'THEAD');
        const tbody = node.children.filter(item => item.element.tagName === 'TBODY');
        const tfoot = node.children.filter(item => item.element.tagName === 'TFOOT');
        const colgroup = Array.from(node.element.children).find(element => element.tagName === 'COLGROUP');
        if (thead.length > 0) {
            thead[0].cascade().filter(item => item.element.tagName === 'TH' || item.element.tagName === 'TD').forEach(item => item.inherit(thead[0], 'styleMap'));
            table.push(...<T[]> thead[0].children);
            thead.forEach(item => item.hide());
        }
        if (tbody.length > 0) {
            tbody.forEach(item => {
                table.push(...<T[]> item.children);
                item.hide();
            });
        }
        if (tfoot.length > 0) {
            tfoot[0].cascade().filter(item => item.element.tagName === 'TH' || item.element.tagName === 'TD').forEach(item => item.inherit(tfoot[0], 'styleMap'));
            table.push(...<T[]> tfoot[0].children);
            tfoot.forEach(item => item.hide());
        }
        const collapse = (node.css('borderCollapse') === 'collapse');
        const [width, height] = (collapse ? [0, 0] : node.css('borderSpacing').split(' ').map(value => parseInt(value)));
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
        const columnIndex = new Array(table.length).fill(0);
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
                        else {
                            if (style.backgroundColor) {
                                item.style.backgroundColor = style.backgroundColor;
                            }
                        }
                    }
                    else {
                        let value = cssInherit(item, 'background', ['rgba(0, 0, 0, 0)']);
                        if (value !== '') {
                            item.style.background = value;
                        }
                        else {
                            value = cssInherit(item, 'backgroundColor', ['rgba(0, 0, 0, 0)']);
                            if (value !== '') {
                                item.style.backgroundColor = value;
                            }
                        }
                    }
                }
                td.css({
                    marginTop: (i === 0 ? '0px' : spacingHeight),
                    marginRight: (j < tr.children.length - 1 ? spacingWidth : '0px'),
                    marginBottom: (i + element.rowSpan - 1 >= table.length - 1 ? '0px' : spacingHeight),
                    marginLeft: (columnIndex[i] === 0 ? '0px' : spacingWidth)
                });
                columnIndex[i] += element.colSpan;
            }
        }
        let rowCount = table.length;
        const columnCount = Math.max.apply(null, columnIndex);
        let borderInside = false;
        const caption = node.children.find(item => item.element.tagName === 'CAPTION');
        if (caption) {
            if (!caption.has('textAlign')) {
                caption.css('textAlign', 'center');
            }
            rowCount++;
            caption.data(EXT_NAME.TABLE, 'colSpan', columnCount);
        }
        node.children.length = 0;
        if (caption) {
            node.children.push(caption);
        }
        for (let i = 0; i < table.length; i++) {
            const tr = table[i];
            const columnWeight = (tr.children.length > 1 ? tr.children.every((td: T) => !td.has('width') || td.css('width') === tr.children[tr.children.length - 1].css('width')) : false);
            tr.each((td: T) => {
                const element = <HTMLTableCellElement> td.element;
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
                if (columnWeight) {
                    td.css('width', '0px');
                }
            });
            if (columnIndex[i] < columnCount) {
                const td = tr.children[tr.children.length - 1];
                td.data(EXT_NAME.TABLE, 'spaceSpan', columnCount - columnIndex[i]);
            }
            else {
                let percent = 0;
                let percentCount = 0;
                tr.each(td => {
                    const percentWidth = td.styleMap.width;
                    if (convertInt(percentWidth) > 0) {
                        if (isPercent(percentWidth)) {
                            percent += convertInt(percentWidth);
                        }
                        percentCount++;
                    }
                });
                if (percentCount > 0 && percentCount < tr.children.length && percent < 100) {
                    const remainder = Math.floor((100 - percent) / (tr.children.length - percentCount));
                    if (remainder >= 1) {
                        tr.each(td => {
                            if (td.toInt('width') === 0) {
                                td.css('width', `${(--percentCount === 0 ? 100 - percent : remainder)}%`);
                                percent += remainder;
                            }
                        });
                    }
                }
            }
            tr.children.slice().forEach(td => td.parent = node);
            tr.hide();
        }
        if (collapse && borderInside) {
            node.css({
                borderTopWidth: '0px',
                borderRightWidth: '0px',
                borderBottomWidth: '0px',
                borderLeftWidth: '0px'
            });
        }
        xml = this.application.writeGridLayout(node, parent, columnCount, rowCount);
        return { xml };
    }
}