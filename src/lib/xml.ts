import { ObjectMap, Null } from './types';
import { hasValue, repeat } from './util';

export function getPlaceholder(id: string | number, symbol = ':') {
    return `{${symbol + id.toString()}}`;
}

export function replacePlaceholder(value: string, id: string | number, content: string, before = false) {
    const placeholder = (typeof id === 'number' ? getPlaceholder(id) : id);
    return value.replace(placeholder, (before ? placeholder : '') + content + (before ? '' : placeholder));
}

export function removePlaceholders(value: string) {
    return value.replace(/{[<:@>]{1}[0-9]+(\:[0-9]+)?}/g, '').trim();
}

export function modifyIndent(value: string, depth: number) {
    if (depth >= 0) {
        let indent = -1;
        return value.split('\n').map(line => {
            const match = /^({.*?})(\t*)(<.*)/.exec(line);
            if (match) {
                if (indent === -1) {
                    indent = match[2].length;
                }
                return match[1] + repeat(depth + (match[2].length - indent)) + match[3];
            }
            return line;
        }).join('\n');
    }
    return value;
}

export function replaceTab(value: string, spaces = 4, preserve = false) {
    if (spaces > 0) {
        if (preserve) {
            value = value.split('\n').map(line => {
                const match = line.match(/^(\t+)(.*)$/);
                if (match) {
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
    value = value.replace(/&#([0-9]+);/g, (match, capture) => String.fromCharCode(capture));
    value = value.replace(/(&nbsp;|\u00A0)/g, '&#160;');
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
        if (pattern) {
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