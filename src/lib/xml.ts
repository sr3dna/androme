import { Null, ObjectMap } from './types';
import { hasValue, repeat } from './util';

export function removePlaceholders(value: string) {
    return value.replace(/{[<:@>]{1}[0-9]+}/g, '').trim();
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

export function replaceTab(value: string, spaces = 4, preserve = false) {
    if (spaces > 0) {
        if (preserve) {
            value = value.split('\n').map(line => {
                const match = line.match(/^(\t+)(.*)$/);
                if (match != null) {
                    return ' '.repeat(spaces * match[1].length) + match[2];
                }
                return line;
            }).join('\n');
        }
        else {
            value = value.replace(/\t/g, ' '.repeat(spaces));
        }
    }
    return value;
}

export function replaceEntity(value: string) {
    value = value.replace(/&#(\d+);/g, (match, capture) => String.fromCharCode(capture));
    value = value.replace(/&nbsp;/g, '&#160;');
    return value;
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

export function insertTemplateData(template: ObjectMap<string>, data: {}, index?: string, include?: {}, exclude?: {}) {
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
        if (value != null && value !== '') {
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