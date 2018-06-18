import { IPlainFile, IStringMap } from '../lib/types';
import File from '../base/file';
import { replaceDP, trim } from '../lib/util';
import { getDataLevel, parseTemplateData, parseTemplateMatch } from '../lib/xml';
import SETTINGS from '../settings';
import { BUILD_ANDROID, FONT_ANDROID, FONTWEIGHT_ANDROID } from './constants';

import STRING_TMPL from './tmpl/resources/string';
import STRINGARRAY_TMPL from './tmpl/resources/string-array';
import STYLE_TMPL from './tmpl/resources/style';
import FONT_TMPL from './tmpl/resources/font';
import COLOR_TMPL from './tmpl/resources/color';
import DRAWABLE_TMPL from './tmpl/resources/drawable';

export default class FileRes extends File {
    constructor(appname: string, filetype?: string)
    {
        super(SETTINGS.outputDirectory, appname, filetype);
    }

    public layoutMainToDisk(content: string) {
        this.saveToDisk([this.getLayoutMainFile(content)]);
    }

    public resourceAllToXml(saveToDisk = false, layoutMain = ''): {} {
        const data: IStringMap = {
            string: this.resourceStringToXml(),
            stringArray: this.resourceStringArrayToXml(),
            font: this.resourceFontToXml(),
            color: this.resourceColorToXml(),
            style: this.resourceStyleToXml(),
            drawable: this.resourceDrawableToXml()
        };
        if (saveToDisk) {
            const files: IPlainFile[] = [];
            if (layoutMain !== '') {
                files.push(this.getLayoutMainFile(layoutMain));
            }
            for (const resource in data) {
                files.push(...this.parseFileDetails(data[resource]));
            }
            this.saveToDisk(files);
        }
        if (layoutMain !== '') {
            data.main = layoutMain;
        }
        return data;
    }

    public resourceStringToXml(saveToDisk = false) {
        this.stored.STRINGS = new Map([...this.stored.STRINGS.entries()].sort());
        let xml = '';
        if (this.stored.STRINGS.size > 0) {
            const template = parseTemplateMatch(STRING_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const rootItem = getDataLevel(data, '0');
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
                const arrayItem: {} = {
                    name,
                    '2': []
                };
                const item = arrayItem['2'];
                for (const text of values) {
                    item.push({ value: text });
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
                const data: {} = {
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
            const template = parseTemplateMatch(STYLE_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const rootItem = getDataLevel(data, '0');
            for (const [name1, style] of this.stored.STYLES.entries()) {
                const styleItem: {} = {
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
            const data: {} = {
                '0': []
            };
            const rootItem = data['0'];
            for (const [name, value] of this.stored.DRAWABLES.entries()) {
                rootItem.push({ name: `res/drawable/${name}.xml`, value});
            }
            for (const [name, images] of this.stored.IMAGES.entries()) {
                if (Object.keys(images).length > 1) {
                    for (const dpi in images) {
                        rootItem.push({ name: `res/drawable-${dpi}/${name + images[dpi].substring(images[dpi].lastIndexOf('.'))}`, value: `<!-- image: ${images[dpi]} -->` });
                    }
                }
                else if (images['mdpi'] != null) {
                    rootItem.push({ name: `res/drawable/${name + images['mdpi'].substring(images['mdpi'].lastIndexOf('.'))}`, value: `<!-- image: ${images['mdpi']} -->` });
                }
            }
            xml = parseTemplateData(template, data);
            if (SETTINGS.useUnitDP) {
                xml = replaceDP(xml, SETTINGS.density);
            }
            if (saveToDisk) {
                this.saveToDisk(this.parseFileDetails(xml));
            }
        }
        return xml;
    }

    private parseFileDetails(xml: string): IPlainFile[] {
        const result: IPlainFile[] = [];
        const pattern = /<\?xml[\w\W]*?(<!-- filename: (.+)\/(.*?.xml) -->)/;
        let match: RegExpExecArray | null = null;
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

    private getLayoutMainFile(content: string): IPlainFile {
        return {
            content,
            pathname: 'res/layout',
            filename: SETTINGS.outputActivityMainFileName
        };
    }
}