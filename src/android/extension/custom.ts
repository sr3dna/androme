import Custom from '../../extension/custom';
import View from '../view';
import { formatResource } from './lib/util';

export default class CustomAndroid<T extends View> extends Custom {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public afterInsert() {
        const node = this.node;
        const options = Object.assign({}, this.options[node.element.id]);
        node.apply(formatResource(options));
    }
}