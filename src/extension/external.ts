import { Null } from '../lib/types';
import Node from '../base/node';
import Extension from '../base/extension';
import { deleteElementCache, getElementCache, getStyle, setElementCache } from '../lib/dom';

export default class External<T extends Node> extends Extension<T> {
    constructor(name: string, framework = 0, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
    }

    public beforeInit(init = false) {
        if (this.element && (init || this.included())) {
            if (!getElementCache(this.element, 'andromeExternalDisplay')) {
                const display: string[] = [];
                let current: Null<HTMLElement> = <HTMLElement> this.element;
                while (current) {
                    display.push(getStyle(current).display as string);
                    current.style.display = 'block';
                    current = current.parentElement;
                }
                setElementCache(this.element, 'andromeExternalDisplay', display);
            }
        }
    }

    public init(element: Element) {
        if (this.included(element)) {
            this.application.elements.add(<HTMLElement> element);
        }
        return false;
    }

    public afterInit(internal = false) {
        if (this.element && (internal || this.included())) {
            const data = getElementCache(this.element, 'andromeExternalDisplay');
            if (data) {
                const display: string[] = data;
                let current: Null<HTMLElement> = <HTMLElement> this.element;
                let i = 0;
                while (current) {
                    current.style.display = display[i];
                    current = current.parentElement;
                    i++;
                }
                deleteElementCache(this.element, 'andromeExternalDisplay');
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