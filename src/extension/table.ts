import { ExtensionResult } from './lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import { convertInt, isPercent } from '../lib/util';
import { EXT_NAME } from './lib/constants';

export default class Table<T extends Node> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        let xml = '';
        const parent = this.parent;
        if (parent) {
            const node = this.node;
            const table: T[] = [];
            const thead = node.children.filter(item => item.element.tagName === 'THEAD');
            const tbody = node.children.filter(item => item.element.tagName === 'TBODY');
            const tfoot = node.children.filter(item => item.element.tagName === 'TFOOT');
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
            const columnIndex = new Array(table.length).fill(0);
            for (let i = 0; i < table.length; i++) {
                const tr = table[i];
                for (let j = 0; j < tr.children.length; j++) {
                    const element = <HTMLTableCellElement> tr.children[j].element;
                    for (let k = 0; k < element.rowSpan - 1; k++)  {
                        const l = (i + 1) + k;
                        if (columnIndex[l] != null) {
                            columnIndex[l] += element.colSpan;
                        }
                    }
                    columnIndex[i] += element.colSpan;
                }
            }
            const rowCount = table.length;
            const columnCount = Math.max.apply(null, columnIndex);
            const collapse = (node.css('borderCollapse') === 'collapse');
            const [width, height] = (collapse ? ['0px', '0px'] : node.css('borderSpacing').split(' '));
            let borderInside = false;
            node.children.length = 0;
            for (let i = 0; i < table.length; i++) {
                const tr = table[i];
                tr.each(td => {
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
                    if (convertInt(td.css('border-width')) > 0 && td.css('borderStyle') !== 'none') {
                        borderInside = true;
                    }
                    delete td.styleMap.margin;
                    td.css({
                        marginTop: height,
                        marginRight: width,
                        marginBottom: height,
                        marginLeft: width
                    });
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
            const caption = node.children.find(item => item.element.tagName === 'CAPTION');
            if (caption) {
                if (!caption.has('textAlign')) {
                    caption.css('textAlign', 'center');
                }
                caption.data(EXT_NAME.TABLE, 'colSpan', columnCount);
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
        }
        return { xml };
    }
}