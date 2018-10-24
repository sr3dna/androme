import { NODE_PROCEDURE } from '../lib/enumeration';

import Node from '../base/node';
import Extension from '../base/extension';

import { hasValue } from '../lib/util';
import { getNodeFromElement } from '../lib/dom';

export default abstract class Accessibility<T extends Node> extends Extension<T> {
    public afterInit() {
        Array.from(this.application.cacheProcessing.elements).forEach(node => {
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.ACCESSIBILITY)) {
                const element = node.element;
                if (element instanceof HTMLInputElement) {
                    switch (element.type) {
                        case 'radio':
                        case 'checkbox':
                            [node.nextElementSibling, node.previousElementSibling].some((sibling: HTMLLabelElement) => {
                                const label = getNodeFromElement(sibling) as T;
                                const labelParent = sibling && sibling.parentElement && sibling.parentElement.tagName === 'LABEL' ? getNodeFromElement(sibling.parentElement) as T : null;
                                if (label && label.visible && label.pageflow) {
                                    if (hasValue(sibling.htmlFor) && sibling.htmlFor === element.id) {
                                        node.companion = label;
                                    }
                                    else if (label.textElement && labelParent) {
                                        node.companion = label;
                                        labelParent.renderAs = node;
                                    }
                                    if (node.companion) {
                                        if (this.options && !this.options.showLabel) {
                                            label.hide();
                                        }
                                        return true;
                                    }
                                }
                                return false;
                            });
                            break;
                    }
                }
            }
        });
    }
}