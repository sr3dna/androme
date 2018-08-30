import Extension from '../base/extension';
import Node from '../base/node';
import { deleteElementCache, getElementCache, getStyle, setElementCache } from '../lib/dom';

export default class External<T extends Node> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public beforeInit(init = false) {
        if (init || this.included()) {
            if (this.element != null) {
                if (getElementCache(this.element, 'andromeExternalDisplay') == null) {
                    const display: string[] = [];
                    let current = this.element;
                    while (current != null) {
                        display.push(<string> getStyle(current).display);
                        current.style.display = 'block';
                        current = <HTMLElement> current.parentElement;
                    }
                    setElementCache(this.element, 'andromeExternalDisplay', display);
                }
            }
        }
    }

    public init(element: HTMLElement) {
        if (this.included(element)) {
            this.application.elements.add(element);
        }
        return false;
    }

    public afterInit(init = false) {
        if (init || this.included()) {
            if (this.element != null) {
                const data = getElementCache(this.element, 'andromeExternalDisplay');
                if (data) {
                    const display: string[] = data;
                    let current = this.element;
                    let i = 0;
                    while (current != null) {
                        current.style.display = display[i];
                        current = <HTMLElement> current.parentElement;
                        i++;
                    }
                    deleteElementCache(this.element, 'andromeExternalDisplay');
                }
            }
        }
    }

    public is() {
        return false;
    }

    public condition() {
        return false;
    }
}