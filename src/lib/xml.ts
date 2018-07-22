import { Null, ObjectMap } from './types';
import { convertDP, hasValue, repeat } from './util';
import SETTINGS from '../settings';

export function removePlaceholders(value: string) {
    value = value.replace(/{[<:@>]{1}[0-9]+}/g, '');
    value = value.replace(/{[0-9]+:.*?}/g, '');
    return value.trim();
}

export function placeIndent(value: string, depth: number) {
    return value.split('\n').map(line => {
        const match = /^({.*?})(.*)/g.exec(line);
        const indent = repeat(depth);
        if (match != null) {
            return (match[2] !== '' ? match[1] + indent + match[2] : '');
        }
        else {
            return indent + line;
        }
    }).join('\n');
}

export function stripId(value: string) {
    return value.replace(/@\+?id\//, '');
}

export function replaceDP(xml: string, font = false) {
    return (SETTINGS.useUnitDP ? xml.replace(/("|>)(-)?([0-9]+(?:\.[0-9]+)?px)("|<)/g, (match, ...capture) => capture[0] + (capture[1] || '') + convertDP(capture[2], SETTINGS.density, font) + capture[3]) : xml);
}

export function replaceTab(xml: string, preserve = false) {
    if (SETTINGS.insertSpaces > 0) {
        if (preserve) {
            xml = xml.split('\n').map(value => {
                const match = value.match(/^(\t+)(.*)$/);
                if (match != null) {
                    return ' '.repeat(SETTINGS.insertSpaces * match[1].length) + match[2];
                }
                return value;
            }).join('\n');
        }
        else {
            xml = xml.replace(/\t/g, ' '.repeat(SETTINGS.insertSpaces));
        }
    }
    return xml;
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

export function insertTemplateData(template: ObjectMap<string>, data: {}, index?: Null<string>, include?: {}, exclude?: {}) {
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
                const attr = `{#${match[1]}=${match[2]}}`;
                output = output.replace(attr, data[match[2]] || match[2]);
            }
            else if (exclude && exclude[match[1]]) {
                output = output.replace(match[0], '');
            }
        }
    }
    return output.replace(/\s+[\w:]+="{@\w+}"/g, '');
}