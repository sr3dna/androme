import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { optional } from '../lib/util';
import { getStyle } from '../lib/dom';

type T = Node;
type U = NodeList<T>;

export default class External extends Extension<T, U> {
    constructor(name: string, tagNames: string[] = [], options?: {}) {
        super(name, tagNames, options);
    }

    public beforeInit(init = false) {
        if (init || this.included()) {
            if (this.element != null) {
                const object: any = this.element;
                if (object.__andromeExternalDisplay == null) {
                    const display: string[] = [];
                    let current = this.element;
                    while (current != null) {
                        display.push(<string> getStyle(current).display);
                        current.style.display = 'block';
                        current = (<HTMLElement> current.parentElement);
                    }
                    object.__andromeExternalDisplay = display;
                }
            }
        }
    }

    public init(element: HTMLElement) {
        if (this.included(element) && optional(element, 'dataset.ext').split(',').length <= 1) {
            this.application.elements.add(element);
            return true;
        }
        return false;
    }

    public afterInit(init = false) {
        if (init || this.included()) {
            if (this.element != null) {
                const object: any = this.element;
                if (object.__andromeExternalDisplay != null) {
                    const display: string[] = object.__andromeExternalDisplay;
                    let current = this.element;
                    let i = 0;
                    while (current != null) {
                        current.style.display = display[i];
                        current = (<HTMLElement> current.parentElement);
                        i++;
                    }
                    delete object.__andromeExternalDisplay;
                }
            }
        }
    }
}