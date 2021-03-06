import { NODE_ANDROID } from '../lib/constant';

import View from '../view';

import $enum = androme.lib.enumeration;
import $util = androme.lib.util;
import $dom = androme.lib.dom;

export default class <T extends View> extends androme.lib.base.extensions.Accessibility<T> {
    public afterRender() {
        Array.from(this.application.cacheProcessing.elements).forEach(node => {
            if (!node.hasBit('excludeProcedure', $enum.NODE_PROCEDURE.ACCESSIBILITY)) {
                const element = node.element;
                switch (node.controlName) {
                    case NODE_ANDROID.EDIT:
                        if (!node.companion) {
                            [node.nextElementSibling, node.previousElementSibling].some((sibling: HTMLLabelElement) => {
                                const label = $dom.getNodeFromElement(sibling) as T;
                                const labelParent = sibling && sibling.parentElement && sibling.parentElement.tagName === 'LABEL' ? $dom.getNodeFromElement(sibling.parentElement) as T : null;
                                if (label && label.visible && label.pageflow) {
                                    if ($util.hasValue(sibling.htmlFor) && sibling.htmlFor === element.id) {
                                        label.android('labelFor', node.stringId);
                                        return true;
                                    }
                                    else if (label.textElement && labelParent) {
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
        });
    }
}