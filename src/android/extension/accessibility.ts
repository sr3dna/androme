import Accessibility from '../../extension/accessibility';
import View from '../view';
import { hasValue } from '../../lib/util';
import { getNodeFromElement } from '../../lib/dom';
import { NODE_PROCEDURE } from '../../base/lib/constants';
import { NODE_ANDROID } from '../constants';

export default class AccessibilityAndroid<T extends View> extends Accessibility<T> {
    constructor(name: string, framework = 0, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
    }

    public afterRender() {
        for (const node of this.application.cache.elements) {
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.ACCESSIBILITY)) {
                const element = node.element;
                switch (node.controlName) {
                    case NODE_ANDROID.EDIT:
                        if (node.companion == null) {
                            [node.nextElementSibling, node.previousElementSibling].some((sibling: HTMLLabelElement) => {
                                const label = getNodeFromElement(sibling) as T;
                                const labelParent = sibling && sibling.parentElement && sibling.parentElement.tagName === 'LABEL' ? getNodeFromElement(sibling.parentElement) as T : null;
                                if (label && label.visible && label.pageflow) {
                                    if (hasValue(sibling.htmlFor) && sibling.htmlFor === element.id) {
                                        label.android('labelFor', node.stringId);
                                        return true;
                                    }
                                    else if (label.textElement && labelParent != null) {
                                        labelParent.android('labelFor', node.stringId);
                                        return true;
                                    }
                                }
                                return false;
                            });
                        }
                    case NODE_ANDROID.SELECT:
                    case NODE_ANDROID.CHECKBOX:
                    case NODE_ANDROID.RADIO:
                    case NODE_ANDROID.BUTTON:
                        if ((<HTMLInputElement> element).disabled) {
                            node.android('focusable', 'false');
                        }
                        break;
                }
            }
        }
    }
}