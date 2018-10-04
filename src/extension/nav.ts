import Extension from '../base/extension';
import Node from '../base/node';
import { deleteElementCache, getElementCache, getStyle, setElementCache } from '../lib/dom';
import { EXT_NAME } from './lib/constants';

export default abstract class Menu<T extends Node> extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
        this.require(EXT_NAME.EXTERNAL, true);
    }

    public init(element: Element) {
        if (this.included(element)) {
            let valid = false;
            if (element.children.length > 0) {
                const tagName = element.children[0].tagName;
                valid =
                    Array
                        .from(element.children)
                        .every(item => item.tagName === tagName);
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
                Array
                    .from(element.querySelectorAll('NAV'))
                    .forEach((item: HTMLElement) => {
                        const style = getStyle(element);
                        if (style.display === 'none') {
                            setElementCache(item, 'andromeExternalDisplay', 'none');
                            item.style.display = 'block';
                        }
                    });
                this.application.elements.add(<HTMLElement> element);
            }
        }
        return false;
    }

    public afterRender() {
        const node = this.node;
        if (this.included(node.element)) {
            Array
                .from(node.element.querySelectorAll('NAV'))
                .forEach((item: HTMLElement) => {
                    const display = getElementCache(item, 'andromeExternalDisplay');
                    if (display) {
                        item.style.display = display;
                        deleteElementCache(item, 'andromeExternalDisplay');
                    }
                });
        }
    }
}