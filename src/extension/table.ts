import { ExtensionResult } from './lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import { isPercent, convertInt } from '../lib/util';
import { EXT_NAME } from './lib/constants';

type T = Node;

export default class Table extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const tableRows: T[] = [];
        const thead = node.children.find(item => item.element.tagName === 'THEAD');
        const tbody = node.children.find(item => item.element.tagName === 'TBODY');
        const tfoot = node.children.find(item => item.element.tagName === 'TFOOT');
        if (thead) {
            thead.cascade().filter(item => item.element.tagName === 'TH' || item.element.tagName === 'TD').forEach(item => item.inherit(thead, 'styleMap'));
            tableRows.push(...<T[]> thead.children);
            thead.hide();
        }
        if (tbody) {
            tableRows.push(...<T[]> tbody.children);
            tbody.hide();
        }
        if (tfoot) {
            tfoot.cascade().filter(item => item.element.tagName === 'TH' || item.element.tagName === 'TD').forEach(item => item.inherit(tfoot, 'styleMap'));
            tableRows.push(...<T[]> tfoot.children);
            tfoot.hide();
        }
        const rowCount = tableRows.length;
        let columnCount = 0;
        const [width, height] = (node.css('borderCollapse') === 'collapse' ? ['0px', '0px'] : node.css('borderSpacing').split(' '));
        for (let i = 0; i < tableRows.length; i++) {
            const tr = tableRows[i];
            columnCount = Math.max(tr.children.map(item => item.element).reduce((a, b: HTMLTableDataCellElement) => a + b.colSpan, 0), columnCount);
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
                        if (convertInt(td.styleMap.width) === 0) {
                            td.css('width', `${(--percentCount === 0 ? 100 - percent : remainder)}%`);
                            percent += remainder;
                        }
                    });
                }
            }
            tr.each(td => {
                const element = <HTMLTableCellElement> td.element;
                if (element.rowSpan > 1) {
                    td.data(`${EXT_NAME.TABLE}:rowSpan`, element.rowSpan);
                }
                if (element.colSpan > 1) {
                    td.data(`${EXT_NAME.TABLE}:columnSpan`, element.colSpan);
                }
                if (!td.isSet('styleMap', 'verticalAlign')) {
                    td.css('verticalAlign', 'middle');
                }
                delete td.styleMap.margin;
                td.css({
                    marginTop: height,
                    marginRight: width,
                    marginBottom: height,
                    marginLeft: width
                });
            });
            tr.children.slice().forEach(td => td.parent = node);
            tr.hide();
        }
        const caption = node.children.find(item => item.element.tagName === 'CAPTION');
        if (caption) {
            if (!caption.isSet('styleMap', 'textAlign')) {
                caption.css('textAlign', 'center');
            }
            caption.data(`${EXT_NAME.TABLE}:columnSpan`, columnCount);
        }
        const xml = this.application.writeGridLayout(node, <T> this.parent, columnCount, rowCount);
        return { xml };
    }
}