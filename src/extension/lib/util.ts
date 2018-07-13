import { StringMap } from '../../lib/types';
import Resource from '../../base/resource';
import { hasValue, isNumber } from '../../lib/util';
import { parseHex } from '../../lib/color';
import SETTINGS from '../../settings';

export function formatResource(options: {}) {
    for (const namespace in options) {
        const object: StringMap = options[namespace];
        for (const attr in object) {
            if (hasValue(object[attr])) {
                let value = object[attr].toString();
                switch (namespace) {
                    case 'android':
                        switch (attr) {
                            case 'text':
                                if (!value.startsWith('@string/')) {
                                    if (SETTINGS.numberResourceValue || !isNumber(value)) {
                                        value = Resource.addString(value);
                                        if (value !== '') {
                                            object[attr] = `@string/${value}`;
                                        }
                                    }
                                }
                                break;
                            case 'background':
                                const hex = parseHex(value);
                                if (hex !== '') {
                                    object[attr] = `@color/${Resource.addColor(hex)}`;
                                    break;
                                }
                            case 'src':
                                if (/^\w+:\/\//.test(value)) {
                                    value = Resource.addImage({ 'mdpi': value });
                                    if (value !== '') {
                                        object[attr] = `@drawable/${value}`;
                                    }
                                }
                                break;
                        }
                        break;
                }
                if (attr.toLowerCase().indexOf('color') !== -1) {
                    const hex = parseHex(value);
                    if (hex !== '') {
                        object[attr] = `@color/${Resource.addColor(hex)}`;
                    }
                }
            }
        }
    }
    return options;
}