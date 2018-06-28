import { ObjectMap, RegExpNull } from '../lib/types';
import { hasValue } from './util';

export function getDataLevel(data: {}, ...levels: string[]): ObjectMap<any> {
    let current: any = data;
    for (const level of levels) {
        const [index, array = '0'] = level.split('-');
        current = current[index][array];
    }
    return current;
}

export function parseTemplateMatch(template: string) {
    const result: ObjectMap<string> = {};
    let pattern: RegExp | null = null;
    let match: RegExpNull | boolean = false;
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

export function parseTemplateData(template: ObjectMap<string>, data: ObjectMap<any>, index?: string | null, include?: ObjectMap<any>, exclude?: ObjectMap<any>) {
    let output: string = (index != null ? template[index] : '');
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
                value += parseTemplateData(template, data[i][j], i, include, exclude);
            }
        }
        else {
            value = data[i];
        }
        if (hasValue(value)) {
            output = (index != null ? output.replace(new RegExp(`{[%@&]*${i}}`), value) : value.trim());
        }
        else if (new RegExp(`{%${i}}`).test(output) || value === false) {
            output = output.replace(`{%${i}}`, '');
        }
        else if (new RegExp(`{&${i}}`).test(output)) {
            output = '';
        }
        const pattern = /\s+[\w:]+="{#(\w+)=(.*?)}"/g;
        let match: RegExpNull;
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