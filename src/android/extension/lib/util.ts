import { Null } from '../../../lib/types';
import View from '../../view';
import { includes } from '../../../lib/util';
import { NODE_RESOURCE } from '../../../base/lib/constants';

type T = View;

export function createPlaceholder(nextId: number, node: T, children: T[] = []) {
    const placeholder = new View(nextId);
    placeholder.init();
    placeholder.api = node.api;
    for (const item of children) {
        item.parent = placeholder;
    }
    placeholder.inherit(node, 'dimensions');
    placeholder.auto = false;
    placeholder.excludeResource |= NODE_RESOURCE.ALL;
    return placeholder;
}

export function locateExtension(node: T, extension: string): Null<HTMLElement> {
    return (
        Array
            .from(node.element.children)
            .find((element: HTMLElement) => includes(element.dataset.ext, extension)) as HTMLElement
    );
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