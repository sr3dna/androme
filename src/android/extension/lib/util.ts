import { Null, StringMap } from '../../../lib/types';
import ResourceView from '../../resource-view';
import View from '../../view';
import { includes, isNumber, optional } from '../../../lib/util';
import { parseHex } from '../../../lib/color';
import { NODE_RESOURCE } from '../../../lib/constants';
import SETTINGS from '../../../settings';

type T = View;

export function createPlaceholder(nextId: number, node: T, children: T[] = []) {
    const placeholder = new View(nextId, node.api, node.element);
    placeholder.parent = node.parent;
    for (const child of children) {
        child.parent = placeholder;
    }
    placeholder.inherit(node, 'dimensions');
    placeholder.auto = false;
    placeholder.excludeResource |= NODE_RESOURCE.ALL;
    return placeholder;
}

export function locateExtension(node: T, extension: string): Null<Element> {
    return <Element> Array.from(node.element.children).find((element: Element) => includes(optional(element, 'dataset.ext'), extension));
}

export function formatResource(options: {}) {
    for (const namespace in options) {
        const object: StringMap = options[namespace];
        if (typeof object === 'object') {
            for (const attr in object) {
                if (object[attr] != null) {
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