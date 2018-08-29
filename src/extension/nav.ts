import Extension from '../base/extension';
import Node from '../base/node';
import { deleteCache, getCache, getStyle, setCache } from '../lib/dom';
import { BLOCK_ELEMENT } from '../lib/constants';
import { EXT_NAME } from './lib/constants';

type T = Node;

export default abstract class Menu extends Extension<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
        this.require(EXT_NAME.EXTERNAL, true);
    }

    public init(element: HTMLElement) {
        if (this.included(element)) {
            let valid = false;
            if (element.children.length > 0) {
                const tagName = element.children[0].tagName;
                valid = (BLOCK_ELEMENT.includes(tagName) && Array.from(element.children).every(item => item.tagName === tagName));
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
                        setCache(item, 'andromeExternalDisplay', 'none');
                        item.style.display = 'block';
                    }
                });
                this.application.elements.add(element);
            }
        }
        return false;
    }

    public afterRender() {
        const element = this.node.element;
        if (this.included(element)) {
            Array.from(element.querySelectorAll('NAV')).forEach((item: HTMLElement) => {
                const display = getCache(item, 'andromeExternalDisplay');
                if (display) {
                    item.style.display = display;
                    deleteCache(item, 'andromeExternalDisplay');
                }
            });
        }
    }
}