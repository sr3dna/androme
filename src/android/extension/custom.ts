import Custom from '../../extension/custom';
import View from '../view';
import { formatResource } from './lib/util';

export default class CustomAndroid<T extends View> extends Custom<T> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public afterInsert() {
        const options = Object.assign({}, this.options[this.node.element.id]);
        this.node.apply(formatResource(options));
    }
}