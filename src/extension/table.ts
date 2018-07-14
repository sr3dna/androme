import { ExtensionResult } from '../lib/types';
import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { EXT_NAME } from './lib/constants';

type T = Node;
type U = NodeList<T>;

export default class Table extends Extension<T, U> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const tableRows: T[] = [];
        const thead = node.children.find(item => item.tagName === 'THEAD');
        const tbody = node.children.find(item => item.tagName === 'TBODY');
        const tfoot = node.children.find(item => item.tagName === 'TFOOT');
        if (thead != null) {
            thead.cascade().filter(item => item.tagName === 'TH' || item.tagName === 'TD').forEach(item => item.inheritStyleMap(thead));
            tableRows.push(...(<T[]> thead.children));
            thead.hide();
        }
        if (tbody != null) {
            tableRows.push(...(<T[]> tbody.children));
            tbody.hide();
        }
        if (tfoot != null) {
            tfoot.cascade().filter(item => item.tagName === 'TH' || item.tagName === 'TD').forEach(item => item.inheritStyleMap(tfoot));
            tableRows.push(...(<T[]> tfoot.children));
            tfoot.hide();
        }
        const rowCount = tableRows.length;
        let columnCount = 0;
        for (let i = 0; i < tableRows.length; i++) {
            const tr = tableRows[i];
            tr.hide();
            columnCount = Math.max(tr.children.map(item => item.element).reduce((a, b: HTMLTableDataCellElement) => a + b.colSpan, 0), columnCount);
            for (let j = 0; j < tr.children.length; j++) {
                const td = tr.children[j];
                const style = td.element.style;
                const element = (<HTMLTableCellElement> td.element);
                if (element.rowSpan > 1) {
                    td.data(`${EXT_NAME.TABLE}:rowSpan`, element.rowSpan);
                }
                if (element.colSpan > 1) {
                    td.data(`${EXT_NAME.TABLE}:columnSpan`, element.colSpan);
                }
                if (td.styleMap.textAlign == null && !(style.textAlign === 'left' || style.textAlign === 'start')) {
                    td.styleMap.textAlign = (<string> style.textAlign);
                }
                if (td.styleMap.verticalAlign == null && style.verticalAlign === '') {
                    td.styleMap.verticalAlign = 'middle';
                }
                const [width, height] = (node.style.borderCollapse === 'collapse' ? ['0px', '0px'] : (<string> node.style.borderSpacing).split(' '));
                delete td.styleMap.margin;
                td.styleMap.marginTop = height;
                td.styleMap.marginRight = width;
                td.styleMap.marginBottom = height;
                td.styleMap.marginLeft = width;
                td.parent = node;
            }
        }
        const xml = this.application.writeGridLayout(node, (<T> this.parent), columnCount, rowCount);
        return { xml };
    }
}