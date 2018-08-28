import { Null, StringMap } from '../../../lib/types';
import ResourceView from '../../resource-view';
import View from '../../view';
import { formatPX, includes, isNumber, optional } from '../../../lib/util';
import { parseHex } from '../../../lib/color';
import { NODE_RESOURCE } from '../../../lib/constants';
import parseRTL from '../../localization';
import SETTINGS from '../../../settings';

type T = View;

export function createPlaceholder(nextId: number, node: T, children: T[] = []) {
    const placeHolder = new View(nextId, node.api, node.element);
    placeHolder.parent = node.parent;
    placeHolder.children = children;
    placeHolder.inherit(node, 'base');
    placeHolder.isolated = true;
    placeHolder.excludeResource |= NODE_RESOURCE.ALL;
    return placeHolder;
}

export function formatResource(options: {}) {
    for (const namespace in options) {
        const object: StringMap = options[namespace];
        if (typeof object === 'object') {
            for (const attr in object) {
                if (object[attr]) {
                    let value = object[attr].toString();
                    switch (namespace) {
                        case 'android':
                            switch (attr) {
                                case 'text':
                                    if (!value.startsWith('@string/') && (SETTINGS.numberResourceValue || !isNumber(value))) {
                                        value = ResourceView.addString(value);
                                        if (value !== '') {
                                            object[attr] = `@string/${value}`;
                                            continue;
                                        }
                                    }
                                    break;
                                case 'src':
                                    if (/^\w+:\/\//.test(value)) {
                                        value = ResourceView.addImage({ 'mdpi': value });
                                        if (value !== '') {
                                            object[attr] = `@drawable/${value}`;
                                            continue;
                                        }
                                    }
                                    break;
                            }
                            break;
                    }
                    const hex = parseHex(value);
                    if (hex !== '') {
                        object[attr] = `@color/${ResourceView.addColor(hex)}`;
                    }
                }
            }
        }
    }
    return options;
}

export function locateExtension(node: T, extension: string): Null<HTMLElement> {
    return <HTMLElement> Array.from(node.element.children).find((element: HTMLElement) => includes(<string> optional(element, 'dataset.ext'), extension));
}

export function overwriteDefault(options: {}, namespace: string, attr: string, value: string) {
    if (namespace !== '') {
        if (options[namespace] == null) {
            options[namespace] = {};
        }
        if (options[namespace][attr] == null) {
            options[namespace][attr] = value;
        }
    }
    else {
        if (options[attr] == null) {
            options[attr] = value;
        }
    }
}

export function positionIsolated(node: T) {
    const horizontalBias = node.horizontalBias;
    const verticalBias = node.verticalBias;
    const gravity: string[] = [];
    if (horizontalBias < 0.5) {
        gravity.push(parseRTL('left'));
    }
    else if (horizontalBias > 0.5) {
        gravity.push(parseRTL('right'));
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
    node.android('layout_gravity', (gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|')));
    const parent = node.documentParent as T;
    if (horizontalBias > 0 && horizontalBias < 1 && horizontalBias !== 0.5) {
        if (horizontalBias < 0.5) {
            node.css('marginLeft', formatPX(Math.floor(node.bounds.left - parent.box.left)));
        }
        else {
            node.css('marginRight', formatPX(Math.floor(parent.box.right - node.bounds.right)));
        }
    }
    if (verticalBias > 0 && verticalBias < 1 && verticalBias !== 0.5) {
        if (verticalBias < 0.5) {
            node.css('marginTop', formatPX(Math.floor(node.bounds.top - parent.box.top)));
        }
        else {
            node.css('marginBottom', formatPX(Math.floor(parent.box.bottom - node.bounds.bottom)));
        }
    }
}