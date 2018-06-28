import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { getStyle } from '../lib/dom';

type T = Node;
type U = NodeList<T>;

export default class External extends Extension<T, U> {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public beforeInit(init = false) {
        if (init || this.included()) {
            if (this.element != null) {
                const object = (<any> this.element);
                if (object.__andromeExternalDisplay == null) {
                    object.__andromeExternalDisplay = getStyle(this.element).display;
                }
                this.element.style.display = 'block';
            }
        }
    }

    public init(element: HTMLElement) {
        if (this.included(element) && element.dataset.extension != null && element.dataset.extension.split(',').length <= 1) {
            this.application.elements.add(element);
            return true;
        }
        return false;
    }

    public afterInit(init = false) {
        if (init || this.included()) {
            if (this.element != null) {
                const object = (<any> this.element);
                if (object.__andromeExternalDisplay != null) {
                    this.element.style.display = object.__andromeExternalDisplay;
                }
            }
        }
    }
}