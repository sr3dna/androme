import { SettingsAndroid } from './lib/types';

import { BUILD_ANDROID, FONTWEIGHT_ANDROID } from './lib/constant';

import STRING_TMPL from './template/resource/string';
import STRINGARRAY_TMPL from './template/resource/string-array';
import FONT_TMPL from './template/resource/font';
import COLOR_TMPL from './template/resource/color';
import STYLE_TMPL from './template/resource/style';
import DIMEN_TMPL from './template/resource/dimen';
import DRAWABLE_TMPL from './template/resource/drawable';

import View from './view';

import { replaceUnit } from './lib/util';

import $util = androme.lib.util;
import $xml = androme.lib.xml;

function caseInsensitive(a: string | string[], b: string | string[]) {
    return a.toString().toLowerCase() >= b.toString().toLowerCase() ? 1 : -1;
}

export default class FileHandler<T extends View> extends androme.lib.base.File<T> {
    private static parseImageDetails(xml: string) {
        const result: PlainFile[] = [];
        const pattern = /<!-- image: (.+) -->\n<!-- filename: (.+)\/(.*?\.\w+) -->/;
        let match: Null<RegExpExecArray>;
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

    private static parseFileDetails(xml: string) {
        const result: PlainFile[] = [];
        const pattern = /<\?xml[\w\W]*?(<!-- filename: (.+)\/(.*?\.xml) -->)/;
        let match: Null<RegExpExecArray>;
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

    private static createPlainFile(pathname: string, filename: string, content: string): PlainFile {
        return {
            pathname,
            filename,
            content
        };
    }

    constructor(public settings: SettingsAndroid) {
        super();
    }

    public saveAllToDisk(data: ViewData<androme.lib.base.NodeList<T>>) {
        const files: PlainFile[] = [];
        const views = [...data.views, ...data.includes];
        for (let i = 0; i < views.length; i++) {
            const view = views[i];
            files.push(FileHandler.createPlainFile(view.pathname, i === 0 ? this.settings.outputMainFileName : `${view.filename}.xml`, view.content));
        }
        const xml = this.resourceDrawableToXml();
        files.push(...FileHandler.parseFileDetails(this.resourceStringToXml()));
        files.push(...FileHandler.parseFileDetails(this.resourceStringArrayToXml()));
        files.push(...FileHandler.parseFileDetails(this.resourceFontToXml()));
        files.push(...FileHandler.parseFileDetails(this.resourceColorToXml()));
        files.push(...FileHandler.parseFileDetails(this.resourceStyleToXml()));
        files.push(...FileHandler.parseFileDetails(this.resourceDimenToXml()));
        files.push(...FileHandler.parseImageDetails(xml), ...FileHandler.parseFileDetails(xml));
        this.saveToDisk(files);
    }

    public layoutAllToXml(data: ViewData<androme.lib.base.NodeList<T>>, saveToDisk = false) {
        const result = {};
        const files: PlainFile[] = [];
        const views = [...data.views, ...data.includes];
        for (let i = 0; i < views.length; i++) {
            const view = views[i];
            result[view.filename] = view.content;
            if (saveToDisk) {
                files.push(FileHandler.createPlainFile(view.pathname, i === 0 ? this.settings.outputMainFileName : `${view.filename}.xml`, view.content));
            }
        }
        if (saveToDisk) {
            this.saveToDisk(files);
        }
        return result;
    }

    public resourceAllToXml(saveToDisk = false) {
        const result = {
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
                    files.push(...FileHandler.parseImageDetails(result[resource]));
                }
                files.push(...FileHandler.parseFileDetails(result[resource]));
            }
            this.saveToDisk(files);
        }
        return result;
    }

    public resourceStringToXml(saveToDisk = false) {
        this.stored.strings = new Map([...this.stored.strings.entries()].sort(caseInsensitive));
        const template = $xml.parseTemplate(STRING_TMPL);
        const data: {} = {
            '0': [{
                '1': []
            }]
        };
        const root = $xml.getTemplateLevel(data, '0');
        if (this.appName !== '' && !this.stored.strings.has('app_name')) {
            root['1'].push({ name: 'app_name', value: this.appName });
        }
        for (const [name, value] of this.stored.strings.entries()) {
            root['1'].push({ name, value });
        }
        let xml = $xml.createTemplate(template, data);
        xml = $xml.replaceTab(xml, this.settings, true);
        if (saveToDisk) {
            this.saveToDisk(FileHandler.parseFileDetails(xml));
        }
        return xml;
    }

    public resourceStringArrayToXml(saveToDisk = false) {
        let xml = '';
        this.stored.arrays = new Map([...this.stored.arrays.entries()].sort());
        if (this.stored.arrays.size > 0) {
            const template = $xml.parseTemplate(STRINGARRAY_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const root = $xml.getTemplateLevel(data, '0');
            for (const [name, values] of this.stored.arrays.entries()) {
                const arrayItem: {} = {
                    name,
                    '2': []
                };
                const item = arrayItem['2'];
                for (const value of values) {
                    item.push({ value });
                }
                root['1'].push(arrayItem);
            }
            xml = $xml.createTemplate(template, data);
            xml = $xml.replaceTab(xml, this.settings, true);
            if (saveToDisk) {
                this.saveToDisk(FileHandler.parseFileDetails(xml));
            }
        }
        return xml;
    }

    public resourceFontToXml(saveToDisk = false) {
        let xml = '';
        this.stored.fonts = new Map([...this.stored.fonts.entries()].sort());
        if (this.stored.fonts.size > 0) {
            const template = $xml.parseTemplate(FONT_TMPL);
            for (const [name, font] of this.stored.fonts.entries()) {
                const data = {
                    '#include': {},
                    '#exclude': {},
                    '0': [{
                        name,
                        '1': []
                    }]
                };
                data[this.settings.targetAPI < BUILD_ANDROID.OREO ? '#include' : '#exclude']['app'] = true;
                const root = $xml.getTemplateLevel(data, '0');
                for (const attr in font) {
                    const [style, weight] = attr.split('-');
                    root['1'].push({
                        style,
                        weight,
                        font: `@font/${name + (style === 'normal' && weight === '400' ? `_${style}` : (style !== 'normal' ? `_${style}` : '') + (weight !== '400' ? `_${FONTWEIGHT_ANDROID[weight] || weight}` : ''))}`
                    });
                }
                xml += '\n\n' + $xml.createTemplate(template, data);
            }
            xml = $xml.replaceTab(xml, this.settings);
            if (saveToDisk) {
                this.saveToDisk(FileHandler.parseFileDetails(xml));
            }
        }
        return xml.trim();
    }

    public resourceColorToXml(saveToDisk = false) {
        let xml = '';
        if (this.stored.colors.size > 0) {
            this.stored.colors = new Map([...this.stored.colors.entries()].sort());
            const template = $xml.parseTemplate(COLOR_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const root = $xml.getTemplateLevel(data, '0');
            for (const [name, value] of this.stored.colors.entries()) {
                root['1'].push({ name, value });
            }
            xml = $xml.createTemplate(template, data);
            xml = $xml.replaceTab(xml, this.settings);
            if (saveToDisk) {
                this.saveToDisk(FileHandler.parseFileDetails(xml));
            }
        }
        return xml;
    }

    public resourceStyleToXml(saveToDisk = false) {
        let xml = '';
        if (this.stored.styles.size > 0) {
            this.stored.styles = new Map([...this.stored.styles.entries()].sort(caseInsensitive));
            const template = $xml.parseTemplate(STYLE_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const root = $xml.getTemplateLevel(data, '0');
            for (const [name1, style] of this.stored.styles.entries()) {
                const styleItem: {} = {
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
            xml = $xml.createTemplate(template, data);
            xml = replaceUnit(xml, this.settings, true);
            xml = $xml.replaceTab(xml, this.settings);
            if (saveToDisk) {
                this.saveToDisk(FileHandler.parseFileDetails(xml));
            }
        }
        return xml;
    }

    public resourceDimenToXml(saveToDisk = false) {
        let xml = '';
        this.stored.dimens = new Map([...this.stored.dimens.entries()].sort());
        if (this.stored.dimens.size > 0) {
            const template = $xml.parseTemplate(DIMEN_TMPL);
            const data: {} = {
                '0': [{
                    '1': []
                }]
            };
            const root = $xml.getTemplateLevel(data, '0');
            for (const [name, value] of this.stored.dimens.entries()) {
                root['1'].push({ name, value });
            }
            xml = $xml.createTemplate(template, data);
            xml = replaceUnit(xml, this.settings);
            xml = $xml.replaceTab(xml, this.settings);
            if (saveToDisk) {
                this.saveToDisk(FileHandler.parseFileDetails(xml));
            }
        }
        return xml;
    }

    public resourceDrawableToXml(saveToDisk = false) {
        let xml = '';
        if (this.stored.drawables.size > 0 || this.stored.images.size > 0) {
            const template = $xml.parseTemplate(DRAWABLE_TMPL);
            const data: {} = {
                '0': []
            };
            const root = data['0'];
            for (const [name, value] of this.stored.drawables.entries()) {
                root.push({
                    name: `res/drawable/${name}.xml`,
                    value
                });
            }
            for (const [name, images] of this.stored.images.entries()) {
                if (Object.keys(images).length > 1) {
                    for (const dpi in images) {
                        root.push({
                            name: `res/drawable-${dpi}/${name}.${$util.lastIndexOf(images[dpi], '.')}`,
                            value: `<!-- image: ${images[dpi]} -->`
                        });
                    }
                }
                else if (images['mdpi']) {
                    root.push({
                        name: `res/drawable/${name}.${$util.lastIndexOf(images['mdpi'], '.')}`,
                        value: `<!-- image: ${images['mdpi']} -->`
                    });
                }
            }
            xml = $xml.createTemplate(template, data);
            xml = replaceUnit(xml, this.settings);
            xml = $xml.replaceTab(xml, this.settings);
            if (saveToDisk) {
                this.saveToDisk([...FileHandler.parseImageDetails(xml), ...FileHandler.parseFileDetails(xml)]);
            }
        }
        return xml;
    }
}