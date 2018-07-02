import Extension from '../../base/extension';
import Node from '../../base/node';
import NodeList from '../../base/nodelist';

type T = Node;
type U = NodeList<T>;

export default abstract class Drawer extends Extension<T, U> {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
        this.activityMain = true;
        this.require('androme.external', true);
        this.require('androme.widget.menu');
    }

    public init(element: HTMLElement) {
        if (this.included(element) && element.children.length > 0) {
            Array.from(element.children).forEach((item: HTMLElement) => {
                if (item.tagName === 'NAV' && item.dataset.ext == null) {
                    item.dataset.ext = 'androme.external';
                }
            });
            this.application.elements.add(element);
            return true;
        }
        return false;
    }

    public condition() {
        return (super.condition() && this.included());
    }
}