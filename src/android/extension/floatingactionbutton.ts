import { ExtensionResult } from '../../lib/types';
import View from '../view';
import Button from '../../extension/widget/button';
import Resource from '../../base/resource';
import { parseRGBA } from '../../lib/color';
import { VIEW_RESOURCE } from '../../lib/constants';
import { DRAWABLE_PREFIX, VIEW_SUPPORT } from './lib/constants';
import { setDefaultOption, withinRange } from '../../lib/util';
import parseRTL from '../localization';

interface LayoutGravity {
    node: View;
    horizontalBias: number;
    verticalBias: number;
}

export default class FloatingActionButton<T extends View> extends Button {
    private position: LayoutGravity[] = [];

    constructor(name: string, tagNames: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public beforeInit() {
        super.beforeInit();
        this.position = [];
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
        const xml = this.application.controllerHandler.getViewStatic(VIEW_SUPPORT.FLOATING_ACTION_BUTTON, node.depth, options, 'wrap_content', 'wrap_content', node);
        node.ignoreResource = VIEW_RESOURCE.BOX_STYLE | VIEW_RESOURCE.FONT_STYLE | VIEW_RESOURCE.IMAGE_SOURCE;
        if (node.isolated && node.parent.viewName === VIEW_SUPPORT.COORDINATOR) {
            node.renderParent = node.parentOriginal;
            this.position.push({ node, horizontalBias: node.horizontalBias, verticalBias: node.verticalBias });
            node.render(node.parent);
        }
        else {
            node.render(node.parent);
            node.setGravity();
        }
        node.applyCustomizations();
        return [xml, false, false];
    }

    public finalize() {
        const node = (<T> this.node);
        if (node.isolated && node.parent.viewName === VIEW_SUPPORT.COORDINATOR) {
            const location = this.position.find(item => item.node === node);
            let gone = true;
            if (location != null) {
                const gravity = [];
                const absoluteBias = this.options.absoluteBias || 0.05;
                if (location.horizontalBias <= absoluteBias) {
                    gravity.push(parseRTL('left'));
                }
                else if (location.horizontalBias >= (1 - absoluteBias)) {
                    gravity.push(parseRTL('right'));
                }
                else if (withinRange(location.horizontalBias, 0.5, absoluteBias)) {
                    gravity.push('center_horizontal');
                }
                if (location.verticalBias <= absoluteBias) {
                    gravity.push('top');
                }
                else if (location.verticalBias >= (1 - absoluteBias)) {
                    gravity.push('bottom');
                }
                else if (withinRange(location.verticalBias, 0.5, absoluteBias)) {
                    gravity.push('center_vertical');
                }
                if (gravity.length > 0) {
                    node.android('layout_gravity', (gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|')));
                    if (gravity.length < 2) {
                        const horizontal: LayoutGravity[] = [];
                        const vertical: LayoutGravity[] = [];
                        this.position.forEach(item => {
                            if (item.node !== location.node) {
                                if (item.horizontalBias === location.horizontalBias) {
                                    horizontal.push(item);
                                }
                                if (item.verticalBias === location.verticalBias) {
                                    vertical.push(item);
                                }
                            }
                        });
                        if (horizontal.length > 0) {
                            const nearest = horizontal.map(item => ({ position: item, bias: Math.abs(location.verticalBias - item.verticalBias) })).sort((a, b) => (a.bias >= b.bias ? 1 : -1))[0];
                            if (location.verticalBias < nearest.position.verticalBias) {
                                node.app('layout_anchor', nearest.position.node.stringId);
                                node.app('layout_anchorGravity', 'top');
                                gone = false;
                            }
                        }
                        if (vertical.length > 0) {
                            const nearest = vertical.map(item => ({ position: item, bias: Math.abs(location.horizontalBias - item.horizontalBias) })).sort((a, b) => (a.bias >= b.bias ? 1 : -1))[0];
                            if (location.horizontalBias < nearest.position.horizontalBias) {
                                node.app('layout_anchor', nearest.position.node.stringId);
                                node.app('layout_anchorGravity', parseRTL('left'));
                                gone = false;
                            }
                        }
                    }
                    else {
                        gone = false;
                    }
                }
            }
            if (gone) {
                node.android('visibility', 'gone');
            }
        }
        node.android('layout_width', 'wrap_content');
        node.android('layout_height', 'wrap_content');
    }
}