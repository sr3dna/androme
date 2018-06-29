import { ArrayMap, ObjectMap, PlainFile, RegExpNull, StringMap } from '../lib/types';
import File from '../base/file';
import { caseInsensitve, hasValue, getFileExt, replaceDP } from '../lib/util';
import { getDataLevel, parseTemplateData, parseTemplateMatch } from '../lib/xml';
import SETTINGS from '../settings';
import { BUILD_ANDROID, FONTWEIGHT_ANDROID } from './constants';

import STRING_TMPL from './template/resources/string';
import STRINGARRAY_TMPL from './template/resources/string-array';
import STYLE_TMPL from './template/resources/style';
import FONT_TMPL from './template/resources/font';
import COLOR_TMPL from './template/resources/color';
import DRAWABLE_TMPL from './template/resources/drawable';

export default class FileRes extends File {
    constructor() {
        super(SETTINGS.outputDirectory, SETTINGS.outputMaxProcessingTime, SETTINGS.outputArchiveFileType);
    }

    public saveAllToDisk(data: ArrayMap<any>) {
        const files: PlainFile[] = [];
        for (let i = 0; i < data.views.length; i++) {
            files.push(this.getLayoutFile(data.pathnames[i], (i === 0 ? SETTINGS.outputActivityMainFileName : `${data.ids[i]}.xml`), data.views[i]));
        }
        const xml = this.resourceDrawableToXml();
        files.push(...this.parseFileDetails(this.resourceStringToXml()));
        files.push(...this.parseFileDetails(this.resourceStringArrayToXml()));
        files.push(...this.parseFileDetails(this.resourceFontToXml()));
        files.push(...this.parseFileDetails(this.resourceColorToXml()));
        files.push(...this.parseFileDetails(this.resourceStyleToXml()));
        files.push(...this.parseImageDetails(xml), ...this.parseFileDetails(xml));
        this.saveToDisk(files);
    }

    public layoutAllToXml(data: ArrayMap<any>, saveToDisk = false) {
        const result: StringMap = {};
        const files: PlainFile[] = [];
        for (let i = 0; i < data.views.length; i++) {
            const view = data.views[i];
            result[data.ids[i]] = view;
            if (saveToDisk) {
                files.push(this.getLayoutFile(data.pathnames[i], (i === 0 ? SETTINGS.outputActivityMainFileName : `${data.ids[i]}.xml`), view));
            }
        }
        if (saveToDisk) {
            this.saveToDisk(files);
        }
        return result;
    }

    public resourceAllToXml(saveToDisk = false): {} {
        const result: StringMap = {
            string: this.resourceStringToXml(),
            stringArray: this.resourceStringArrayToXml(),
            font: this.resourceFontToXml(),
            color: this.resourceColorToXml(),
            style: this.resourceStyleToXml(),
            drawable: this.resourceDrawableToXml()
        };
        if (saveToDisk) {
            const files: PlainFile[] = [];
            for (const resource in result) {
                if (resource === 'drawable') {
                    files.push(...this.parseImageDetails(result[resource]));
                }
                files.push(...this.parseFileDetails(result[resource]));
            }
            this.saveToDisk(files);
        }
        return result;
    }

    public resourceStringToXml(saveToDisk = false) {
        this.stored.STRINGS = new Map([...this.stored.STRINGS.entries()].sort(caseInsensitve));
        let xml = '';
        if (this.stored.STRINGS.size > 0) {
            const template = parseTemplateMatch(STRING_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const rootItem = getDataLevel(data, '0');
            if (hasValue(this.appName) && !this.stored.STRINGS.has('app_name')) {
                rootItem['1'].push({ name: 'app_name', value: this.appName });
            }
            for (const [name, value] of this.stored.STRINGS.entries()) {
                rootItem['1'].push({ name: value, value: name });
            }
            xml = parseTemplateData(template, data);
            if (saveToDisk) {
                this.saveToDisk(this.parseFileDetails(xml));
            }
        }
        return xml;
    }

    public resourceStringArrayToXml(saveToDisk = false) {
        this.stored.ARRAYS = new Map([...this.stored.ARRAYS.entries()].sort());
        let xml = '';
        if (this.stored.ARRAYS.size > 0) {
            const template = parseTemplateMatch(STRINGARRAY_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name, values] of this.stored.ARRAYS.entries()) {
                const arrayItem: ObjectMap<any> = {
                    name,
                    '2': []
                };
                const item = arrayItem['2'];
                for (const value of values) {
                    item.push({ value });
                }
                rootItem['1'].push(arrayItem);
            }
            xml = parseTemplateData(template, data);
            if (saveToDisk) {
                this.saveToDisk(this.parseFileDetails(xml));
            }
        }
        return xml;
    }

    public resourceFontToXml(saveToDisk = false) {
        this.stored.FONTS = new Map([...this.stored.FONTS.entries()].sort());
        let xml = '';
        if (this.stored.FONTS.size > 0) {
            const template = parseTemplateMatch(FONT_TMPL);
            for (const [name, font] of this.stored.FONTS.entries()) {
                const data: ObjectMap<any> = {
                    '#include': {},
                    '#exclude': {},
                    '0': [{
                        name,
                        '1': []
                    }]
                };
                data[(SETTINGS.targetAPI < BUILD_ANDROID.OREO ? '#include' : '#exclude')]['app'] = true;
                const rootItem = getDataLevel(data, '0');
                for (const attr in font) {
                    const [style, weight] = attr.split('-');
                    rootItem['1'].push({
                        style,
                        weight,
                        font: `@font/${name + (style === 'normal' && weight === '400' ? `_${style}` : (style !== 'normal' ? `_${style}` : '') + (weight !== '400' ? `_${FONTWEIGHT_ANDROID[weight] || weight}` : ''))}`
                    });
                }
                xml += '\n\n' + parseTemplateData(template, data);
            }
            if (saveToDisk) {
                this.saveToDisk(this.parseFileDetails(xml));
            }
        }
        return xml.trim();
    }

    public resourceColorToXml(saveToDisk = false) {
        let xml = '';
        if (this.stored.COLORS.size > 0) {
            this.stored.COLORS = new Map([...this.stored.COLORS.entries()].sort());
            const template = parseTemplateMatch(COLOR_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name, value] of this.stored.COLORS.entries()) {
                rootItem['1'].push({ name, value });
            }
            xml = parseTemplateData(template, data);
            if (saveToDisk) {
                this.saveToDisk(this.parseFileDetails(xml));
            }
        }
        return xml;
    }

    public resourceStyleToXml(saveToDisk = false) {
        let xml = '';
        if (this.stored.STYLES.size > 0) {
            this.stored.STYLES = new Map([...this.stored.STYLES.entries()].sort());
            const template = parseTemplateMatch(STYLE_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name1, style] of this.stored.STYLES.entries()) {
                const styleItem: ObjectMap<any> = {
                    name1,
                    parent: style.parent || '',
                    '2': []
                };
                style.attributes.split(';').sort().forEach((attr: string) => {
                    const [name2, value] = attr.split('=');
                    styleItem['2'].push({ name2, value: value.replace(/"/g, '') });
                });
                rootItem['1'].push(styleItem);
            }
            xml = parseTemplateData(template, data);
            if (SETTINGS.useUnitDP) {
                xml = replaceDP(xml, SETTINGS.density, true);
            }
            if (saveToDisk) {
                this.saveToDisk(this.parseFileDetails(xml));
            }
        }
        return xml;
    }

    public resourceDrawableToXml(saveToDisk = false) {
        let xml = '';
        if (this.stored.DRAWABLES.size > 0 || this.stored.IMAGES.size > 0) {
            const template = parseTemplateMatch(DRAWABLE_TMPL);
            const data: ObjectMap<any> = {
                '0': []
            };
            const rootItem = data['0'];
            for (const [name, value] of this.stored.DRAWABLES.entries()) {
                rootItem.push({ name: `res/drawable/${name}.xml`, value});
            }
            for (const [name, images] of this.stored.IMAGES.entries()) {
                if (Object.keys(images).length > 1) {
                    for (const dpi in images) {
                        rootItem.push({ name: `res/drawable-${dpi}/${name}.${getFileExt((<any> images)[dpi])}`, value: `<!-- image: ${(<any> images)[dpi]} -->` });
                    }
                }
                else if ((<any> images)['mdpi'] != null) {
                    rootItem.push({ name: `res/drawable/${name}.${getFileExt((<any> images)['mdpi'])}`, value: `<!-- image: ${(<any> images)['mdpi']} -->` });
                }
            }
            xml = parseTemplateData(template, data);
            if (SETTINGS.useUnitDP) {
                xml = replaceDP(xml, SETTINGS.density);
            }
            if (saveToDisk) {
                this.saveToDisk([...this.parseImageDetails(xml), ...this.parseFileDetails(xml)]);
            }
        }
        return xml;
    }

    private parseImageDetails(xml: string) {
        const result: PlainFile[] = [];
        const pattern = /<!-- image: (.+) -->\n<!-- filename: (.+)\/(.*?\.\w+) -->/;
        let match: RegExpNull = null;
        while ((match = pattern.exec(xml)) != null) {
            result.push({
                uri: match[1],
                pathname: match[2],
                filename: match[3]
            });
            xml = xml.replace(match[0], '');
        }
        return result;
    }

    private parseFileDetails(xml: string) {
        const result: PlainFile[] = [];
        const pattern = /<\?xml[\w\W]*?(<!-- filename: (.+)\/(.*?\.xml) -->)/;
        let match: RegExpNull = null;
        while ((match = pattern.exec(xml)) != null) {
            result.push({
                content: match[0].replace(match[1], '').trim(),
                pathname: match[2],
                filename: match[3]
            });
            xml = xml.replace(match[0], '');
        }
        return result;
    }

    private getLayoutFile(pathname: string, filename: string, content: string): PlainFile {
        return {
            pathname,
            filename,
            content
        };
    }
}