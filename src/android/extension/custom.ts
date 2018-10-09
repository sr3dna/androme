import { SettingsAndroid } from '../lib/types';
import View from '../view';
import ResourceHandler from '../resourcehandler';

export default class <T extends View> extends androme.lib.base.extensions.Custom<T> {
    public afterInsert() {
        const node = this.node;
        const options = Object.assign({}, this.options[node.element.id]);
        node.apply(ResourceHandler.formatOptions(options, <SettingsAndroid> this.application.settings));
    }
}