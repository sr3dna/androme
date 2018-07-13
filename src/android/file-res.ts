import { Null, ObjectMap, PlainFile, StringMap, ViewData } from '../lib/types';
import File from '../base/file';
import View from './view';
import { caseInsensitve, hasValue, lastIndexOf } from '../lib/util';
import { getTemplateLevel, insertTemplateData, parseTemplate, replaceDP, replaceTab } from '../lib/xml';
import { BUILD_ANDROID, FONTWEIGHT_ANDROID } from './constants';
import SETTINGS from '../settings';

import STRING_TMPL from './template/resource/string';
import STRINGARRAY_TMPL from './template/resource/string-array';
import FONT_TMPL from './template/resource/font';
import COLOR_TMPL from './template/resource/color';
import STYLE_TMPL from './template/resource/style';
import DIMEN_TMPL from './template/resource/dimen';
import DRAWABLE_TMPL from './template/resource/drawable';

export default class FileRes<T extends View> extends File<T> {
    constructor() {
        super(SETTINGS.outputDirectory, SETTINGS.outputMaxProcessingTime, SETTINGS.outputArchiveFileType);
    }

    public saveAllToDisk(data: ViewData<T>) {
        const files: PlainFile[] = [];
        const views = [...data.views, ...data.includes];
        for (let i = 0; i < views.length; i++) {
            const view = views[i];
            files.push(this.getLayoutFile(view.pathname, (i === 0 ? SETTINGS.outputActivityMainFileName : `${view.filename}.xml`), view.content));
        }
        const xml = this.resourceDrawableToXml();
        files.push(...this.parseFileDetails(this.resourceStringToXml()));
        files.push(...this.parseFileDetails(this.resourceStringArrayToXml()));
        files.push(...this.parseFileDetails(this.resourceFontToXml()));
        files.push(...this.parseFileDetails(this.resourceColorToXml()));
        files.push(...this.parseFileDetails(this.resourceStyleToXml()));
        files.push(...this.parseFileDetails(this.resourceDimenToXml()));
        files.push(...this.parseImageDetails(xml), ...this.parseFileDetails(xml));
        this.saveToDisk(files);
    }

    public layoutAllToXml(data: ViewData<T>, saveToDisk = false) {
        const result: StringMap = {};
        const files: PlainFile[] = [];
        const views = [...data.views, ...data.includes];
        for (let i = 0; i < views.length; i++) {
            const view = views[i];
            result[view.filename] = view.content;
            if (saveToDisk) {
                files.push(this.getLayoutFile(view.pathname, (i === 0 ? SETTINGS.outputActivityMainFileName : `${view.filename}.xml`), view.content));
            }
        }
        if (saveToDisk) {
            this.saveToDisk(files);
        }
        return result;
    }

    public resourceAllToXml(saveToDisk = false) {
        const result: StringMap = {
            string: this.resourceStringToXml(),
            stringArray: this.resourceStringArrayToXml(),
            font: this.resourceFontToXml(),
            color: this.resourceColorToXml(),
            style: this.resourceStyleToXml(),
            dimen: this.resourceDimenToXml(),
            drawable: this.resourceDrawableToXml()
        };
        for (const resource in result) {
            if (result[resource] === '') {
                delete result[resource];
            }
        }
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
            const template = parseTemplate(STRING_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const root = getTemplateLevel(data, '0');
            if (hasValue(this.appName) && !this.stored.STRINGS.has('app_name')) {
                root['1'].push({ name: 'app_name', value: this.appName });
            }
            for (const [name, value] of this.stored.STRINGS.entries()) {
                root['1'].push({ name, value });
            }
            xml = insertTemplateData(template, data);
            xml = replaceTab(xml, true);
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
            const template = parseTemplate(STRINGARRAY_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const root = getTemplateLevel(data, '0');
            for (const [name, values] of this.stored.ARRAYS.entries()) {
                const arrayItem: ObjectMap<any> = {
                    name,
                    '2': []
                };
                const item = arrayItem['2'];
                for (const value of values) {
                    item.push({ value });
                }
                root['1'].push(arrayItem);
            }
            xml = insertTemplateData(template, data);
            xml = replaceTab(xml, true);
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
            const template = parseTemplate(FONT_TMPL);
            for (const [name, font] of this.stored.FONTS.entries()) {
                const data = {
                    '#include': {},
                    '#exclude': {},
                    '0': [{
                        name,
                        '1': []
                    }]
                };
                data[(SETTINGS.targetAPI < BUILD_ANDROID.OREO ? '#include' : '#exclude')]['app'] = true;
                const root = getTemplateLevel(data, '0');
                for (const attr in font) {
                    const [style, weight] = attr.split('-');
                    root['1'].push({
                        style,
                        weight,
                        font: `@font/${name + (style === 'normal' && weight === '400' ? `_${style}` : (style !== 'normal' ? `_${style}` : '') + (weight !== '400' ? `_${FONTWEIGHT_ANDROID[weight] || weight}` : ''))}`
                    });
                }
                xml += '\n\n' + insertTemplateData(template, data);
            }
            xml = replaceTab(xml);
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
            const template = parseTemplate(COLOR_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const root = getTemplateLevel(data, '0');
            for (const [name, value] of this.stored.COLORS.entries()) {
                root['1'].push({ name, value });
            }
            xml = insertTemplateData(template, data);
            xml = replaceTab(xml);
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
            const template = parseTemplate(STYLE_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const root = getTemplateLevel(data, '0');
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
                root['1'].push(styleItem);
            }
            xml = insertTemplateData(template, data);
            xml = replaceDP(xml, true);
            xml = replaceTab(xml);
            if (saveToDisk) {
                this.saveToDisk(this.parseFileDetails(xml));
            }
        }
        return xml;
    }

    public resourceDimenToXml(saveToDisk = false) {
        this.stored.DIMENS = new Map([...this.stored.DIMENS.entries()].sort());
        let xml = '';
        if (this.stored.DIMENS.size > 0) {
            const template = parseTemplate(DIMEN_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const root = getTemplateLevel(data, '0');
            for (const [name, value] of this.stored.DIMENS.entries()) {
                root['1'].push({ name, value });
            }
            xml = insertTemplateData(template, data);
            xml = replaceDP(xml);
            xml = replaceTab(xml);
            if (saveToDisk) {
                this.saveToDisk(this.parseFileDetails(xml));
            }
        }
        return xml;
    }

    public resourceDrawableToXml(saveToDisk = false) {
        let xml = '';
        if (this.stored.DRAWABLES.size > 0 || this.stored.IMAGES.size > 0) {
            const template = parseTemplate(DRAWABLE_TMPL);
            const data: ObjectMap<any> = {
                '0': []
            };
            const root = data['0'];
            for (const [name, value] of this.stored.DRAWABLES.entries()) {
                root.push({ name: `res/drawable/${name}.xml`, value});
            }
            for (const [name, images] of this.stored.IMAGES.entries()) {
                if (Object.keys(images).length > 1) {
                    for (const dpi in images) {
                        root.push({ name: `res/drawable-${dpi}/${name}.${lastIndexOf(images[dpi], '.')}`, value: `<!-- image: ${images[dpi]} -->` });
                    }
                }
                else if (images['mdpi'] != null) {
                    root.push({ name: `res/drawable/${name}.${lastIndexOf(images['mdpi'], '.')}`, value: `<!-- image: ${images['mdpi']} -->` });
                }
            }
            xml = insertTemplateData(template, data);
            xml = replaceDP(xml);
            xml = replaceTab(xml);
            if (saveToDisk) {
                this.saveToDisk([...this.parseImageDetails(xml), ...this.parseFileDetails(xml)]);
            }
        }
        return xml;
    }

    private parseImageDetails(xml: string) {
        const result: PlainFile[] = [];
        const pattern = /<!-- image: (.+) -->\n<!-- filename: (.+)\/(.*?\.\w+) -->/;
        let match: Null<RegExpExecArray> = null;
        while ((match = pattern.exec(xml)) != null) {
            result.push({
                uri: match[1],
                pathname: match[2],
                filename: match[3],
                content: ''
            });
            xml = xml.replace(match[0], '');
        }
        return result;
    }

    private parseFileDetails(xml: string) {
        const result: PlainFile[] = [];
        const pattern = /<\?xml[\w\W]*?(<!-- filename: (.+)\/(.*?\.xml) -->)/;
        let match: Null<RegExpExecArray> = null;
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