import { ExtensionResult } from '../../../lib/types';
import View from '../../view';
import Button from '../../../extension/button';
import Resource from '../../../base/resource';
import { parseRGBA } from '../../../lib/color';
import { VIEW_RESOURCE } from '../../../lib/constants';
import { DRAWABLE_PREFIX, VIEW_SUPPORT } from '../lib/constants';
import { setDefaultOption } from '../../../lib/util';

export default class FloatingActionButton<T extends View> extends Button {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const node = (<T> this.node);
        const element = node.element;
        const options = Object.assign({}, this.options[element.id]);
        const backgroundColor = node.css('backgroundColor');
        setDefaultOption(options, 'app', 'backgroundTint', (backgroundColor ? `@color/${Resource.addColor(parseRGBA(backgroundColor)[0])}` : '?colorAccent'));
        setDefaultOption(options, 'android', 'focusable', 'true');
        let src = '';
        switch (element.tagName) {
            case 'IMG':
                src = Resource.addImageSrcSet(<HTMLImageElement> element, DRAWABLE_PREFIX.DIALOG);
                break;
            case 'INPUT':
                if ((<HTMLInputElement> element).type === 'image') {
                    src = Resource.addImage({ 'mdpi': (<HTMLInputElement> element).src }, DRAWABLE_PREFIX.DIALOG);
                }
                else {
                    src = Resource.addImageURL(node.css('backgroundImage'), DRAWABLE_PREFIX.DIALOG);
                }
                break;
            case 'BUTTON':
                src = Resource.addImageURL(node.css('backgroundImage'), DRAWABLE_PREFIX.DIALOG);
                break;
        }
        if (src !== '') {
            setDefaultOption(options, 'app', 'srcCompat', `@drawable/${src}`);
        }
        const xml = this.application.controllerHandler.getViewStatic(VIEW_SUPPORT.FLOATING_ACTION_BUTTON, node.parent.renderDepth + 1, options, 'wrap_content', 'wrap_content', node);
        node.ignoreResource = VIEW_RESOURCE.BOX_STYLE | VIEW_RESOURCE.FONT_STYLE | VIEW_RESOURCE.IMAGE_SOURCE;
        node.render(node.parent);
        if (!node.isolated) {
            node.setGravity();
        }
        node.applyCustomizations();
        return [xml, false, false];
    }

    public finalize() {
        const node = (<T> this.node);
        node.android('layout_width', 'wrap_content');
        node.android('layout_height', 'wrap_content');
    }
}