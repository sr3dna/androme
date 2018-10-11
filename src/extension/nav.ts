import Node from '../base/node';
import Extension from '../base/extension';
import { deleteElementCache, getElementCache, getStyle, setElementCache } from '../lib/dom';
import { EXT_NAME } from '../lib/constant';

export default abstract class Nav<T extends Node> extends Extension<T> {
    protected constructor(
        name: string,
        framework: number,
        tagNames?: string[],
        options?: {})
    {
        super(name, framework, tagNames, options);
        this.require(EXT_NAME.EXTERNAL, true);
    }

    public init(element: HTMLElement) {
        if (this.included(element)) {
            let valid = false;
            if (element.children.length > 0) {
                const tagName = element.children[0].tagName;
                valid = Array.from(element.children).every(item => item.tagName === tagName);
                let current = element.parentElement;
                while (current) {
                    if (current.tagName === 'NAV' && this.application.elements.has(current)) {
                        valid = false;
                        break;
                    }
                    current = current.parentElement;
                }
            }
            if (valid) {
                Array.from(element.querySelectorAll('NAV')).forEach((item: HTMLElement) => {
                    if (getStyle(element).display === 'none') {
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
        if (this.included(<HTMLElement> node.element)) {
            Array.from(node.element.querySelectorAll('NAV')).forEach((item: HTMLElement) => {
                const display = getElementCache(item, 'andromeExternalDisplay');
                if (display) {
                    item.style.display = display;
                    deleteElementCache(item, 'andromeExternalDisplay');
                }
            });
        }
    }
}