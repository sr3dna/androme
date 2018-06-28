import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';

type T = Node;
type U = NodeList<T>;

export default abstract class Drawer extends Extension<T, U> {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
        this.require('androme.external');
        this.require('androme.menu');
    }

    public init(element: HTMLElement) {
        if (this.included(element)) {
            Array.from(element.children).forEach((item: HTMLElement) => {
                if (item.tagName !== 'NAV' && item.dataset.extension == null) {
                    item.dataset.extension = 'androme.external';
                }
            });
            this.application.elements.add(element);
            return true;
        }
        return false;
    }
}