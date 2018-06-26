import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { getStyle } from '../lib/dom';

type T = Node;
type U = NodeList<T>;

export default class Hidden extends Extension<T, U> {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public beforeInit() {
        if (this.included()) {
            if (this.element != null) {
                const object = (<any> this.element);
                if (object.__andromeHiddenDisplay == null) {
                    object.__andromeHiddenDisplay = this.element.style.display;
                }
                this.element.style.display = 'block';
            }
        }
    }

    public init(element: HTMLElement) {
        const style = getStyle(element);
        if (this.included(element) && style.display === 'none' && element.dataset.extension != null && element.dataset.extension.split(',').length <= 1) {
            this.application.elements.add(element);
            return true;
        }
        return false;
    }

    public afterInit() {
        if (this.included()) {
            if (this.element != null) {
                const object = (<any> this.element);
                if (object.__andromeHiddenDisplay != null) {
                    this.element.style.display = object.__andromeHiddenDisplay;
                }
            }
        }
    }
}