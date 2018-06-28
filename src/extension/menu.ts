import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';
import { BLOCK_CHROME } from '../lib/constants';
import { getStyle } from '../lib/dom';

type T = Node;
type U = NodeList<T>;

export default abstract class Menu extends Extension<T, U> {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
        this.require('androme.external');
    }

    public init(element: HTMLElement) {
        if (this.included(element) || this.is(element.tagName)) {
            let valid = false;
            if (element.children.length > 0) {
                const tagName = element.children[0].tagName;
                valid = (BLOCK_CHROME.includes(tagName) && Array.from(element.children).every((item: HTMLElement) => item.tagName === tagName && !(item.style.display === 'inline' || item.style.cssFloat === 'left' || item.style.cssFloat === 'right')));
                let current = element.parentElement;
                while (current != null) {
                    if (current.tagName === 'NAV' && this.application.elements.has(current)) {
                        valid = false;
                        break;
                    }
                    current = current.parentElement;
                }
            }
            if (valid) {
                Array.from(element.querySelectorAll('NAV')).forEach((item: HTMLElement) => {
                    const style = getStyle(element);
                    if (style.display === 'none') {
                        (<any> item).__andromeExternalDisplay = 'none';
                        item.style.display = 'block';
                    }
                });
                this.application.elements.add(element);
                return true;
            }
        }
        return false;
    }

    public afterRender() {
        if (this.node != null && this.included(this.node.element)) {
            Array.from(this.node.element.querySelectorAll('NAV')).forEach((item: HTMLElement) => {
                const display = (<any> item).__andromeExternalDisplay;
                if (display != null) {
                    item.style.display = display;
                }
            });
        }
    }
}