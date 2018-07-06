import { Null, ObjectMap } from './types';
import { convertDP, hasValue, repeat } from './util';
import SETTINGS from '../settings';

export function removePlaceholders(value: string, extension = true) {
    value = value.replace(/{[<:@&>]{1}[0-9]+}/g, '');
    if (extension) {
        value = value.replace(/{[0-9]+:.*?}/g, '');
    }
    return value.trim();
}

export function placeIndent(value: string) {
    return value.split('\n').map(line => {
        const match = /^({.*?})(.*)/g.exec(line);
        if (match != null) {
            return `${match[1]}>>>>${match[2]}`;
        }
        else {
            return `>>>>${line}`;
        }
    }).join('\n');
}

export function restoreIndent(value: string, depth: number) {
    return value.replace(/>>>>/g, repeat(depth)).replace(/\s*$/, '');
}

export function replaceDP(xml: string, dpi = 160, font = false) {
    return xml.replace(/("|>)([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + convertDP(capture[1], dpi, font) + capture[2]);
}

export function formatDimen(tagName: string, attr: string, size: string) {
    return (SETTINGS.dimensResourceValue ? `{%${tagName.toLowerCase()}-${attr}-${size}}` : size);
}

export function getTemplateLevel(data: {}, ...levels: string[]) {
    let current = data;
    for (const level of levels) {
        const [index, array = '0'] = level.split('-');
        current = current[index][array];
    }
    return current;
}

export function parseTemplate(template: string) {
    const result: ObjectMap<string> = {};
    let pattern: Null<RegExp> = null;
    let match: Null<RegExpExecArray> | boolean = false;
    let section = 0;
    let characters = template.length;
    do {
        if (match) {
            const segment: string = match[0].replace(new RegExp(match[1], 'g'), '');
            for (const index in result) {
                result[index] = result[index].replace(new RegExp(match[0], 'g'), `{%${match[2]}}`);
            }
            result[match[2]] = segment;
            characters -= match[0].length;
        }
        if (match == null || characters === 0) {
            template = result[section++];
            if (!hasValue(template)) {
                break;
            }
            characters = template.length;
            match = null;
        }
        if (!match) {
            pattern = /(!([0-9]+)\n?)[\w\W]*\1/g;
        }
        if (pattern != null) {
            match = pattern.exec(template);
        }
        else {
            break;
        }
    }
    while (true);
    return result;
}

export function insertTemplateData(template: ObjectMap<string>, data: ObjectMap<any>, index?: Null<string>, include?: ObjectMap<any>, exclude?: ObjectMap<any>) {
    let output = (index != null ? template[index] : '');
    if (data['#include'] != null) {
        include = data['#include'];
        delete data['#include'];
    }
    if (data['#exclude'] != null) {
        exclude = data['#exclude'];
        delete data['#exclude'];
    }
    for (const i in data) {
        let value: any = '';
        if (data[i] === false) {
            output = output.replace(`{%${i}}`, '');
            continue;
        }
        else if (Array.isArray(data[i])) {
            for (const j in data[i]) {
                value += insertTemplateData(template, data[i][j], i, include, exclude);
            }
        }
        else {
            value = data[i];
        }
        if (hasValue(value)) {
            output = (index != null ? output.replace(new RegExp(`{[%@&]*${i}}`, 'g'), value) : value.trim());
        }
        else if (new RegExp(`{%${i}}`).test(output) || value === false) {
            output = output.replace(`{%${i}}`, '');
        }
        else if (new RegExp(`{&${i}}`).test(output)) {
            output = '';
        }
        const pattern = /\s+[\w:]+="{#(\w+)=(.*?)}"/g;
        let match: Null<RegExpExecArray>;
        while ((match = pattern.exec(output)) != null) {
            if (include && include[match[1]]) {
                const attribute = `{#${match[1]}=${match[2]}}`;
                if (data[match[2]] != null) {
                    output = output.replace(attribute, data[match[2]]);
                }
                else {
                    output = output.replace(attribute, match[2]);
                }
            }
            else if (exclude && exclude[match[1]]) {
                output = output.replace(match[0], '');
            }
        }
    }
    return output.replace(/\s+[\w:]+="{@\w+}"/g, '');
}