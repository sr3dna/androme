import { ExtensionResult } from '../../../lib/types';
import Resource from '../../../base/resource';
import View from '../../view';
import Button from '../../../extension/button';
import { optional } from '../../../lib/util';
import { positionIsolated, overwriteDefault } from '../lib/util';
import { restoreIndent } from '../../../lib/xml';
import { parseRGBA } from '../../../lib/color';
import { VIEW_RESOURCE } from '../../../lib/constants';
import { DRAWABLE_PREFIX, VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

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
        overwriteDefault(options, 'android', 'backgroundTint', (backgroundColor ? `@color/${Resource.addColor(parseRGBA(backgroundColor)[0])}` : '?attr/colorAccent'));
        overwriteDefault(options, 'android', 'focusable', 'true');
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
            overwriteDefault(options, 'app', 'srcCompat', `@drawable/${src}`);
        }
        let insert = false;
        if (node.isolated) {
            const id = optional(node, 'parent.element.dataset.extFor', 'string');
            if (id !== '' && node.parent.viewName !== VIEW_SUPPORT.COORDINATOR) {
                const coordinator = document.getElementById(id);
                if (coordinator != null) {
                    insert = true;
                }
            }
        }
        node.depth = (insert ? 0 : node.parent.renderDepth + 1);
        let xml = this.application.controllerHandler.getViewStatic(VIEW_SUPPORT.FLOATING_ACTION_BUTTON, (insert ? -1 : node.parent.renderDepth + 1), options, 'wrap_content', 'wrap_content', node);
        node.ignoreResource = VIEW_RESOURCE.BOX_STYLE | VIEW_RESOURCE.ASSET;
        let proceed = false;
        if (node.isolated) {
            positionIsolated(node);
            if (insert) {
                node.app('layout_anchor', parent.stringId);
                node.app('layout_anchorGravity', <string> node.android('layout_gravity'));
                node.delete('android', 'layout_gravity');
                node.data(`${WIDGET_NAME.FAB}:insert`, xml);
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
        const node = (<T> this.node);
        const id = optional(node, 'parent.element.dataset.extFor', 'string');
        if (id !== '') {
            const parent = this.application.findByDomId(id);
            if (parent != null && parent.viewName === VIEW_SUPPORT.COORDINATOR) {
                let xml = (<string> node.data(`${WIDGET_NAME.FAB}:insert`)) || '';
                if (xml !== '') {
                    node.renderDepth = parent.renderDepth + 1;
                    xml = restoreIndent(xml, node.renderDepth);
                }
                this.application.addInsertQueue(parent.id, [xml]);
            }
        }
    }

    public afterInsert() {
        const node = (<T> this.node);
        node.android('layout_width', 'wrap_content');
        node.android('layout_height', 'wrap_content');
    }
}