import { BorderAttribute, StringMap } from '../lib/types';
import File from './file';
import Node from './node';
import NodeList from './nodelist';
import { INLINE_CHROME } from '../lib/constants';
import { cameltoLowerCase, convertPX, generateId, getFileExt, getFileName, hasValue, isNumber } from '../lib/util';
import { findNearestColor, parseRGBA } from '../lib/color';
import { getBoxSpacing, getStyle } from '../lib/dom';
import SETTINGS from '../settings';

export default class Resource<T extends Node> {
    public static STORED = {
        STRINGS: new Map(),
        COLORS: new Map(),
        IMAGES: new Map()
    };

    public static addString(value: string, name = '') {
        if (hasValue(value)) {
            if (name === '') {
                name = value;
            }
            const num = isNumber(value);
            if (SETTINGS.numberResourceValue || !num) {
                for (const key of Resource.STORED.STRINGS.keys()) {
                    if (key === value) {
                        return (<string> key);
                    }
                }
                name = name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().replace(/_+/g, '_').split('_').slice(0, 5).join('_').replace(/_+$/g, '');
                if (num || /^[0-9].*/.test(value)) {
                    name = `__${name}`;
                }
                else if (name === '') {
                    name = `__symbol${Math.ceil(Math.random() * 100000)}`;
                }
                Resource.STORED.STRINGS.set(value, name);
            }
            return value;
        }
        return '';
    }

    public static addImage(images: StringMap) {
        let src = '';
        if (images['mdpi'] != null && hasValue(images['mdpi'])) {
            const image = getFileName(images['mdpi']);
            const format = getFileExt(image).toLowerCase();
            src = image.replace(/.\w+$/, '');
            switch (format) {
                case 'bmp':
                case 'bmpf':
                case 'cur':
                case 'gif':
                case 'ico':
                case 'jpg':
                case 'png':
                case 'tif':
                case 'tiff':
                case 'webp':
                case 'xbm':
                    src = Resource.insertStoredAsset('IMAGES', src, images);
                    break;
                default:
                    src = '';
            }
        }
        return src;
    }

    public static addColor(value: string, hex = true) {
        value = value.toUpperCase().trim();
        if (value !== '') {
            let colorName = '';
            if (!Resource.STORED.COLORS.has(value)) {
                const color = findNearestColor(value);
                if (color !== '') {
                    color.name = cameltoLowerCase((<string> color.name));
                    if (value === color.hex) {
                        colorName = color.name;
                    }
                    else {
                        colorName = generateId('color', `${color.name}_1`);
                    }
                    Resource.STORED.COLORS.set(value, colorName);
                }
            }
            else {
                colorName = Resource.STORED.COLORS.get(value);
            }
            return (hex ? [colorName, value] : colorName);
        }
        return '';
    }

    public static insertStoredAsset(asset: string, name: string, value: any) {
        const stored = Resource.STORED[asset];
        if (stored != null) {
            let storedName = '';
            if (isNumber(name)) {
                name = `__${name}`;
            }
            if (hasValue(value)) {
                let i = 0;
                do {
                    storedName = name;
                    if (i > 0) {
                        storedName += i;
                    }
                    if (!stored.has(storedName)) {
                        stored.set(storedName, value);
                    }
                    i++;
                }
                while (stored.has(storedName) && stored.get(storedName) !== value);
            }
            return storedName;
        }
        return '';
    }

    public cache: NodeList<T>;

    constructor(public file: File)
    {
    }

    public setBoxSpacing() {
        this.cache.elements.forEach((node: T) => {
            if (node.element instanceof HTMLElement) {
                const element = (<HTMLElement> node.element);
                const result = getBoxSpacing(element);
                for (const i in result) {
                    result[i] += 'px';
                }
                (<any> element).__boxSpacing = result;
            }
        });
    }

    public setBoxStyle() {
        this.cache.elements.forEach((node: T) => {
            if (node.element instanceof HTMLElement) {
                const element = (<HTMLElement> node.element);
                const result: any = {
                    borderTop: this.parseBorderStyle,
                    borderRight: this.parseBorderStyle,
                    borderBottom: this.parseBorderStyle,
                    borderLeft: this.parseBorderStyle,
                    borderRadius: this.parseBorderRadius,
                    backgroundColor: parseRGBA,
                    backgroundImage: this.parseImageURL,
                    backgroundSize: this.parseBoxDimensions
                };
                for (const i in result) {
                    result[i] = result[i](node.css(i), node, i);
                }
                let backgroundParent: string[] = [];
                if (element.parentElement != null) {
                    backgroundParent = parseRGBA(getStyle(element.parentElement)['backgroundColor']);
                }
                if (backgroundParent[0] === result.backgroundColor[0] || SETTINGS.excludeBackgroundColor.includes(result.backgroundColor[0]) || result.backgroundColor[2] === '0') {
                    result.backgroundColor = [];
                }
                else {
                    result.backgroundColor[0] = Resource.addColor(result.backgroundColor[0], false);
                }
                const borderTop = JSON.stringify(result.borderTop);
                if (borderTop === JSON.stringify(result.borderRight) && borderTop === JSON.stringify(result.borderBottom) && borderTop === JSON.stringify(result.borderLeft)) {
                    result.border = result.borderTop;
                }
                (<any> element).__boxStyle = result;
            }
        });
    }

    public setFontStyle(id: string) {
        this.cache.elements.forEach((node: T) => {
            if ((node.visible || node.companion) && node.renderChildren.length === 0) {
                const element = (<HTMLElement> node.element);
                switch (element.tagName) {
                    case 'IMG':
                    case 'HR':
                    case 'AREA':
                        return;
                }
                const color = parseRGBA(node.css('color') || '');
                const backgroundColor = parseRGBA(node.css('backgroundColor') || '');
                const result = {
                    fontFamily: node.css('fontFamily'),
                    fontStyle: node.css('fontStyle'),
                    fontSize: node.css('fontSize'),
                    fontWeight: node.css('fontWeight'),
                    color: (color.length > 0 ? Resource.addColor(color[0]) : ''),
                    backgroundColor: (backgroundColor.length > 0 ? Resource.addColor(backgroundColor[0]) : '')
                };
                (<any> element).__fontStyle = result;
            }
        });
    }

    public setImageSource() {
        this.cache.list.filter((item: T) => item.tagName === 'IMG').forEach((node: T) => {
            const element = (<HTMLImageElement> node.element);
            const srcset = element.srcset.trim();
            const images: StringMap = {};
            if (hasValue(srcset)) {
                const filepath = element.src.substring(0, element.src.lastIndexOf('/') + 1);
                srcset.split(',').forEach((value: string) => {
                    const match = /^(.*?)\s*([0-9]+\.?[0-9]*x)?$/.exec(value.trim());
                    if (match != null) {
                        if (match[2] == null) {
                            match[2] = '1x';
                        }
                        const image = filepath + getFileName(match[1]);
                        switch (match[2]) {
                            case '0.75x':
                                images['ldpi'] = image;
                                break;
                            case '1x':
                                images['mdpi'] = image;
                                break;
                            case '1.5x':
                                images['hdpi'] = image;
                                break;
                            case '2x':
                                images['xhdpi'] = image;
                                break;
                            case '3x':
                                images['xxhdpi'] = image;
                                break;
                            case '4x':
                                images['xxxhdpi'] = image;
                                break;
                        }
                    }
                });
            }
            if (images['mdpi'] == null) {
                images['mdpi'] = element.src;
            }
            const result = Resource.addImage(images);
            (<any> element).__imageSource = result;
        });
    }

    public setOptionArray() {
        this.cache.list.filter((item: T) => item.tagName === 'SELECT').forEach((node: T) => {
            const element = (<HTMLSelectElement> node.element);
            const stringArray: string[] = [];
            let numberArray: string[] | null = [];
            for (let i = 0; i < element.children.length; i++) {
                const item = (<HTMLOptionElement> element.children[i]);
                const value = item.text.trim();
                if (value !== '') {
                    if (numberArray != null && stringArray.length === 0 && isNumber(value)) {
                        numberArray.push(value);
                    }
                    else {
                        if (numberArray != null && numberArray.length > 0) {
                            i = -1;
                            numberArray = null;
                            continue;
                        }
                        const result = Resource.addString(value);
                        if (result !== '') {
                            stringArray.push(result);
                        }
                    }
                }
            }
            (<any> element).__optionArray = { stringArray: (stringArray.length > 0 ? stringArray : null), numberArray: (numberArray != null && numberArray.length > 0 ? numberArray : null) };
        });
    }

    public setValueString() {
        this.cache.elements.forEach((node: T) => {
            const element = (<HTMLElement> node.element);
            let name = '';
            let value = '';
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                value = (<HTMLInputElement> element).value.trim();
            }
            else if (element.nodeName === '#text') {
                value = (element.textContent ? element.textContent.trim() : '');
            }
            else if (element.children.length === 0 || Array.from(element.children).every((item: HTMLElement) => INLINE_CHROME.includes(item.tagName))) {
                name = element.innerText.trim();
                value = element.innerHTML.trim();
            }
            if (hasValue(value)) {
                Resource.addString(value, name);
                (<any> element).__valueString = value;
            }
        });
    }

    protected borderVisible(border: BorderAttribute) {
        return (border != null && !(border.style === 'none' || border.width === '0px'));
    }

    protected getBorderStyle(border: BorderAttribute) {
        const result = { solid: `android:color="@color/${border.color}"` };
        Object.assign(result, {
            inset: result.solid,
            outset: result.solid,
            dotted: `${result.solid} android:dashWidth="3px" android:dashGap="1px"`,
            dashed: `${result.solid} android:dashWidth="1px" android:dashGap="1px"`
        });
        return result[border.style] || 'android:color="@android:color/black"';
    }

    private parseBorderStyle(value: string, node: T, attribute: string): BorderAttribute {
        const style = node.css(`${attribute}Style`) || 'none';
        let width = node.css(`${attribute}Width`) || '1px';
        const color = (style !== 'none' ? parseRGBA(node.css(`${attribute}Color`)) : []);
        if (color.length > 0) {
            color[0] = (<string> Resource.addColor(color[0], false));
        }
        if (style === 'inset' && width === '0px') {
            width = '1px';
        }
        return { style, width, color: (color.length > 0 ? color[0] : '#000000') };
    }

    private parseBorderRadius(value: string, node: T, attribute: string) {
        const radiusTop = node.css('borderTopLeftRadius');
        const radiusRight = node.css('borderTopRightRadius');
        const radiusBottom = node.css('borderBottomLeftRadius');
        const radiusLeft = node.css('borderBottomRightRadius');
        if (radiusTop === radiusRight && radiusRight === radiusBottom && radiusBottom === radiusLeft) {
            return (radiusTop === '' || radiusTop === '0px' ? [] : [radiusTop]);
        }
        else {
            return [radiusTop, radiusRight, radiusBottom, radiusLeft];
        }
    }

    private parseBoxDimensions(value: string, node?: T, attribute?: string) {
        const match = value.match(/^([0-9]+(?:px|pt|em)|auto)(?: ([0-9]+(?:px|pt|em)|auto))?(?: ([0-9]+(?:px|pt|em)))?(?: ([0-9]+(?:px|pt|em)))?$/);
        if (match != null) {
            if ((match[1] === '0px' && match[2] == null) || (match[1] === 'auto' && match[2] === 'auto')) {
                return [];
            }
            if (match[1] === 'auto' || match[2] === 'auto') {
                return [(match[1] === 'auto' ? '' : convertPX(match[1])), (match[2] === 'auto' ? '' : convertPX(match[2]))];
            }
            else if (match[2] == null || (match[1] === match[2] && match[1] === match[3] && match[1] === match[4])) {
                return [convertPX(match[1])];
            }
            else if (match[3] == null || (match[1] === match[3] && match[2] === match[4])) {
                return [convertPX(match[1]), convertPX(match[2])];
            }
            else {
                return [convertPX(match[1]), convertPX(match[2]), convertPX(match[3]), convertPX(match[4])];
            }
        }
        return [];
    }

    private parseImageURL(value: string) {
        const match = value.match(/^url\("(.*?)"\)$/);
        if (match != null) {
            return Resource.addImage({ 'mdpi': match[1] });
        }
        return '';
    }
}