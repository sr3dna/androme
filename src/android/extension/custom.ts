import { SettingsAndroid } from '../lib/types';
import View from '../view';
import ResourceHandler from '../resourcehandler';

export default class CustomAndroid<T extends View> extends lib.base.extensions.Custom<T> {
    constructor(name: string, framework = 0, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
    }

    public afterInsert() {
        const node = this.node;
        const options = Object.assign({}, this.options[node.element.id]);
        node.apply(ResourceHandler.formatOptions(options, <SettingsAndroid> this.application.settings));
    }
}