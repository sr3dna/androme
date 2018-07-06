import { ExtensionResult } from '../../../lib/types';
import View from '../../view';
import Button from '../../../extension/button';
import Resource from '../../../base/resource';
import { setDefaultOption } from '../../../lib/util';
import { restoreIndent } from '../../../lib/xml';
import { parseRGBA } from '../../../lib/color';
import { positionLayoutGravity } from '../lib/util';
import { VIEW_RESOURCE } from '../../../lib/constants';
import { DRAWABLE_PREFIX, VIEW_SUPPORT } from '../lib/constants';

export default class FloatingActionButton<T extends View> extends Button {
    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const node = (<T> this.node);
        const parent = (<T> this.parent);
        const element = node.element;
        const options = Object.assign({}, this.options[element.id]);
        const backgroundColor = node.css('backgroundColor');
        setDefaultOption(options, 'android', 'backgroundTint', (backgroundColor ? `@color/${Resource.addColor(parseRGBA(backgroundColor)[0])}` : '?attr/colorAccent'));
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
        let insert = false;
        if (node.isolated) {
            const extFor = (node.parent.hasElement ? node.parent.element.dataset.extFor : null);
            if (extFor != null && node.parent.viewName !== VIEW_SUPPORT.COORDINATOR) {
                const coordinator = document.getElementById(extFor);
                if (coordinator != null) {
                    insert = true;
                }
            }
        }
        node.depth = (insert ? 0 : node.parent.renderDepth + 1);
        let xml = this.application.controllerHandler.getViewStatic(VIEW_SUPPORT.FLOATING_ACTION_BUTTON, (insert ? -1 : node.parent.renderDepth + 1), options, 'wrap_content', 'wrap_content', node);
        node.ignoreResource = VIEW_RESOURCE.BOX_STYLE | VIEW_RESOURCE.FONT_STYLE | VIEW_RESOURCE.IMAGE_SOURCE;
        let proceed = false;
        if (node.isolated) {
            positionLayoutGravity(node);
            if (insert) {
                node.app('layout_anchor', parent.stringId);
                node.app('layout_anchorGravity', <string> node.android('layout_gravity'));
                node.delete('android', 'layout_gravity');
                node.data(`${this.name}:insert`, xml);
                node.render(node);
                xml = '';
                proceed = true;
            }
            else {
                node.render(parent);
            }
        }
        else {
            node.render(parent);
            node.setGravity();
        }
        node.applyCustomizations();
        return { xml, proceed };
    }

    public insert() {
        const application = this.application;
        const node = (<T> this.node);
        const extFor = node.parent.element.dataset.extFor;
        if (extFor != null) {
            const parent = application.findByDomId(extFor);
            if (parent != null && parent.viewName === VIEW_SUPPORT.COORDINATOR) {
                let xml = (<string> node.data(`${this.name}:insert`)) || '';
                if (xml !== '') {
                    node.renderDepth = parent.renderDepth + 1;
                    xml = restoreIndent(xml, node.renderDepth);
                }
                application.addInsertQueue(parent.id, [xml]);
            }
        }
    }

    public afterInsert() {
        const node = (<T> this.node);
        node.android('layout_width', 'wrap_content');
        node.android('layout_height', 'wrap_content');
    }
}