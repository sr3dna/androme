import { SettingsAndroid } from '../../lib/types';
import View from '../../view';
import ResourceHandler from '../../resourcehandler';
import { parseRTL } from '../../lib/util';
import { DRAWABLE_PREFIX, VIEW_SUPPORT, WIDGET_NAME } from '../lib/constant';

import $enum = androme.lib.enumeration;
import $util = androme.lib.util;
import $color = androme.lib.color;

export default class FloatingActionButton<T extends View> extends androme.lib.base.extensions.Button<T> {
    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        const target = $util.hasValue(node.dataset.target);
        const element = node.element;
        const options = Object.assign({}, this.options[element.id]);
        const backgroundColor = $color.parseRGBA(node.css('backgroundColor'), node.css('opacity'));
        $util.overwriteDefault(options, 'android', 'backgroundTint', backgroundColor.length > 0 ? `@color/${ResourceHandler.addColor(backgroundColor[0], backgroundColor[2])}` : '?attr/colorAccent');
        if (node.hasBit('excludeProcedure', $enum.NODE_PROCEDURE.ACCESSIBILITY)) {
            $util.overwriteDefault(options, 'android', 'focusable', 'false');
        }
        let src = '';
        switch (element.tagName) {
            case 'IMG':
                src = ResourceHandler.addImageSrcSet(<HTMLImageElement> element, DRAWABLE_PREFIX.DIALOG);
                break;
            case 'INPUT':
                if ((<HTMLInputElement> element).type === 'image') {
                    src = ResourceHandler.addImage({ 'mdpi': (<HTMLInputElement> element).src }, DRAWABLE_PREFIX.DIALOG);
                }
                else {
                    src = ResourceHandler.addImageURL(node.css('backgroundImage'), DRAWABLE_PREFIX.DIALOG);
                }
                break;
            case 'BUTTON':
                src = ResourceHandler.addImageURL(node.css('backgroundImage'), DRAWABLE_PREFIX.DIALOG);
                break;
        }
        if (src !== '') {
            $util.overwriteDefault(options, 'app', 'srcCompat', `@drawable/${src}`);
        }
        const output = this.application.viewController.renderNodeStatic(
            VIEW_SUPPORT.FLOATING_ACTION_BUTTON,
            target ? -1 : parent.renderDepth + 1,
            options,
            'wrap_content',
            'wrap_content',
            node
        );
        node.nodeType = $enum.NODE_STANDARD.BUTTON;
        node.excludeResource |= $enum.NODE_RESOURCE.BOX_STYLE | $enum.NODE_RESOURCE.ASSET;
        if (!node.pageflow || target) {
            node.auto = false;
            this.setFrameGravity(node);
            if (target) {
                let anchor = parent.stringId;
                if (parent.controlName === VIEW_SUPPORT.TOOLBAR) {
                    const outerParent = parent.data(WIDGET_NAME.TOOLBAR, 'outerParent') as string;
                    if (outerParent) {
                        anchor = outerParent;
                    }
                }
                node.app('layout_anchor', anchor);
                node.app('layout_anchorGravity', node.android('layout_gravity'));
                node.delete('android', 'layout_gravity');
                node.excludeProcedure |= $enum.NODE_PROCEDURE.ALIGNMENT;
                node.render(node);
            }
            else {
                node.render(parent);
            }
        }
        else {
            node.render(parent);
        }
        return { output, complete: true };
    }

    public afterInsert() {
        const node = this.node;
        node.android('layout_width', 'wrap_content');
        node.android('layout_height', 'wrap_content');
    }

    private setFrameGravity<T extends View>(node: T) {
        const settings = <SettingsAndroid> this.application.settings;
        const parent = node.documentParent;
        const horizontalBias = node.horizontalBias(settings);
        const verticalBias = node.verticalBias(settings);
        const gravity: string[] = [];
        if (horizontalBias < 0.5) {
            gravity.push(parseRTL('left', settings));
        }
        else if (horizontalBias > 0.5) {
            gravity.push(parseRTL('right', settings));
        }
        else {
            gravity.push('center_horizontal');
        }
        if (verticalBias < 0.5) {
            gravity.push('top');
            node.app('layout_dodgeInsetEdges', 'top');
        }
        else if (verticalBias > 0.5) {
            gravity.push('bottom');
        }
        else {
            gravity.push('center_vertical');
        }
        node.android('layout_gravity', gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|'));
        if (horizontalBias > 0 && horizontalBias < 1 && horizontalBias !== 0.5) {
            if (horizontalBias < 0.5) {
                node.css('marginLeft', $util.formatPX(Math.floor(node.bounds.left - parent.box.left)));
            }
            else {
                node.css('marginRight', $util.formatPX(Math.floor(parent.box.right - node.bounds.right)));
            }
        }
        if (verticalBias > 0 && verticalBias < 1 && verticalBias !== 0.5) {
            if (verticalBias < 0.5) {
                node.css('marginTop', $util.formatPX(Math.floor(node.bounds.top - parent.box.top)));
            }
            else {
                node.css('marginBottom', $util.formatPX(Math.floor(parent.box.bottom - node.bounds.bottom)));
            }
        }
    }
}