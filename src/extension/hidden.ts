import Extension from '../base/extension';
import Node from '../base/node';
import NodeList from '../base/nodelist';

type T = Node;
type U = NodeList<T>;

export default class Hidden extends Extension<T, U> {
    constructor(tagNames: string[], extension?: string, options?: {}) {
        super(tagNames, extension, options);
    }

    public beforeInit() {
        if (this.included('androme.hidden')) {
            if (this.element != null) {
                this.element.style.display = '';
            }
        }
    }

    public init(element: HTMLElement) {
        if (this.application != null) {
            if (this.included('androme.hidden', element) && element.style.display === 'none') {
                this.application.elements.add(element);
                return true;
            }
        }
        return false;
    }

    public afterInit() {
        if (this.included('androme.hidden')) {
            if (this.element != null) {
                this.element.style.display = 'none';
            }
        }
    }

    public render() {
        return '';
    }
}