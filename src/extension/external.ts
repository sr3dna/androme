import { Null } from '../lib/types';
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
                    let current: Null<HTMLElement> = <HTMLElement> this.element;
                    while (current != null) {
                        display.push(<string> getStyle(current).display);
                        current.style.display = 'block';
                        current = current.parentElement;
                    }
                    setElementCache(this.element, 'andromeExternalDisplay', display);
                }
            }
        }
    }

    public init(element: Element) {
        if (this.included(element)) {
            this.application.elements.add(<HTMLElement> element);
        }
        return false;
    }

    public afterInit(init = false) {
        if (init || this.included()) {
            if (this.element != null) {
                const data = getElementCache(this.element, 'andromeExternalDisplay');
                if (data) {
                    const display: string[] = data;
                    let current: Null<HTMLElement> = <HTMLElement> this.element;
                    let i = 0;
                    while (current != null) {
                        current.style.display = display[i];
                        current = current.parentElement;
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