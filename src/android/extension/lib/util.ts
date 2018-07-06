import View from '../../view';
import { convertPX } from '../../../lib/util';
import parseRTL from '../../localization';

type T = View;

export function positionLayoutGravity(node: T) {
    const renderParent = node.renderParent;
    const parent = node.parentOriginal;
    node.renderParent = parent;
    const horizontalBias = node.horizontalBias;
    const verticalBias = node.verticalBias;
    const gravity: string[] = [];
    if (horizontalBias < 0.5) {
        gravity.push(parseRTL('left'));
    }
    else if (horizontalBias > 0.5) {
        gravity.push(parseRTL('right'));
    }
    else {
        gravity.push('center_horizontal');
    }
    if (verticalBias < 0.5) {
        gravity.push('top');
        node.app('layout_dodgeInsetEdges', 'top');
    }
    else if (verticalBias > 0.5) {
        gravity.push('bottom');
    }
    else {
        gravity.push('center_vertical');
    }
    node.android('layout_gravity', (gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|')));
    if (horizontalBias > 0 && horizontalBias < 1 && horizontalBias !== 0.5) {
        if (horizontalBias < 0.5) {
            node.css('marginLeft', convertPX(Math.floor(node.bounds.left - parent.box.left)));
        }
        else {
            node.css('marginRight', convertPX(Math.floor(parent.box.right - node.bounds.right)));
        }
    }
    if (verticalBias > 0 && verticalBias < 1 && verticalBias !== 0.5) {
        if (verticalBias < 0.5) {
            node.css('marginTop', convertPX(Math.floor(node.bounds.top - parent.box.top)));
        }
        else {
            node.css('marginBottom', convertPX(Math.floor(parent.box.bottom - node.bounds.bottom)));
        }
    }
    node.renderParent = renderParent;
}