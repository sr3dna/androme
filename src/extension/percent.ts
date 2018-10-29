import { CSS_STANDARD, NODE_ALIGNMENT, NODE_STANDARD } from '../lib/enumeration';

import Node from '../base/node';
import Extension from '../base/extension';

export default abstract class Percent<T extends Node> extends Extension<T> {
    public condition() {
        const node = this.node;
        const parent = this.parent as T;
        return this.included() || (
            node.alignmentType === NODE_ALIGNMENT.NONE &&
            node.pageflow &&
            node.has('width', CSS_STANDARD.PERCENT, { not: '100%' }) &&
            (parent.linearVertical || (parent.is(NODE_STANDARD.FRAME) && node.singleChild)) &&
            !node.imageElement
        );
    }

    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        const controller = this.application.viewController;
        const group = controller.createGroup(parent, node, [node]);
        const renderOutput = this.application.writeGridLayout(group, parent, 2, 1);
        group.alignmentType |= NODE_ALIGNMENT.PERCENT;
        controller[node.float === 'right' || node.autoMarginLeft ? 'prependBefore' : 'appendAfter'](node.id, controller.renderColumnSpace(group.renderDepth + 1, `${100 - node.toInt('width')}%`));
        return { output: '', parent: group, renderAs: group, renderOutput, complete: true };
    }
}