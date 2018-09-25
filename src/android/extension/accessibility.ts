import { Null } from '../../lib/types';
import Accessibility from '../../extension/accessibility';
import View from '../view';
import { NODE_PROCEDURE } from '../../lib/constants';
import { NODE_ANDROID } from '../constants';

export default class AccessibilityAndroid<T extends View> extends Accessibility<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public afterRender() {
        for (const node of this.application.cache.elements) {
            if (!node.hasBit('excludeProcedure', NODE_PROCEDURE.ACCESSIBILITY)) {
                const element = node.element;
                switch (node.controlName) {
                    case NODE_ANDROID.EDIT:
                        if (node.companion == null) {
                            let label: Null<T> = null;
                            let parent = node.renderParent;
                            let current = node as T;
                            while (parent instanceof View && parent.length > 0) {
                                const index = parent.renderChildren.findIndex(item => item === current);
                                if (index > 0) {
                                    label = parent.renderChildren[index - 1] as T;
                                    break;
                                }
                                current = parent as T;
                                parent = parent.renderParent;
                            }
                            if (label && label.textElement && (<HTMLLabelElement> label.element).htmlFor === node.element.id) {
                                label.android('labelFor', node.stringId);
                            }
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