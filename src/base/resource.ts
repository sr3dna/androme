import { AppCurrent, Settings, ViewData } from './lib/types';
import { BorderAttribute, BoxStyle, FontAttribute, Image, Null, ObjectMap, ResourceMap } from '../lib/types';
import Node from './node';
import NodeList from './nodelist';
import Application from './application';
import File from './file';
import { convertInt, convertPX, hasValue, isNumber, isPercent } from '../lib/util';
import { replaceEntity } from '../lib/xml';
import { cssFromParent, getBoxSpacing, getElementCache, hasLineBreak, isLineBreak, setElementCache } from '../lib/dom';
import { parseRGBA } from '../lib/color';
import { NODE_RESOURCE } from './lib/constants';

export default abstract class Resource<T extends Node> implements AppCurrent<T> {
    public static STORED: ResourceMap = {
        strings: new Map(),
        arrays: new Map(),
        fonts: new Map(),
        colors: new Map(),
        styles: new Map(),
        dimens: new Map(),
        drawables: new Map(),
        images: new Map()
    };

    public static insertStoredAsset(asset: string, name: string, value: any) {
        const stored: Map<string, any> = Resource.STORED[asset];
        if (stored != null) {
            let storedName = '';
            for (const [storedKey, storedValue] of stored.entries()) {
                if (JSON.stringify(value) === JSON.stringify(storedValue)) {
                    storedName = storedKey;
                    break;
                }
            }
            if (storedName === '') {
                if (isNumber(name)) {
                    name = `__${name}`;
                }
                if (hasValue(value)) {
                    let i = 0;
                    do {
                        storedName = name;
                        if (i > 0) {
                            storedName += `_${i}`;
                        }
                        if (!stored.has(storedName)) {
                            stored.set(storedName, value);
                        }
                        i++;
                    }
                    while (stored.has(storedName) && stored.get(storedName) !== value);
                }
            }
            return storedName;
        }
        return '';
    }

    public cache: NodeList<T>;
    public application: Application<T>;
    public imageDimensions: Map<string, Image>;

    public abstract settings: Settings;

    constructor(public file: File<T>) {
    }

    public abstract setImageSource(): void;
    public abstract addTheme(template: string, data: {}, options: {}): void;
    public abstract finalize(viewData: ViewData<NodeList<T>>): void;

    public addFile(pathname: string, filename: string, content = '', uri = '') {
        this.file.addFile(pathname, filename, content, uri);
    }

    public reset() {
        for (const name in Resource.STORED) {
            Resource.STORED[name] = new Map();
        }
        this.file.reset();
    }

    public setBoxSpacing() {
        this.cache.elements.each(node => {
            if (!node.hasBit('excludeResource', NODE_RESOURCE.BOX_SPACING) && (getElementCache(node.element, 'boxSpacing') == null || this.settings.alwaysReevaluateResources)) {
                const result = getBoxSpacing(node.element);
                const formatted = {};
                for (const attr in result) {
                   if (node.inlineStatic && (attr === 'marginTop' || attr === 'marginBottom')) {
                        formatted[attr] = '0px';
                    }
                    else {
                        formatted[attr] = convertPX(result[attr], node.css('fontSize'));
                    }
                }
                setElementCache(node.element, 'boxSpacing', formatted);
            }
        });
    }

    public setBoxStyle() {
        this.cache.elements.each(node => {
            if (!node.hasBit('excludeResource', NODE_RESOURCE.BOX_STYLE) && (getElementCache(node.element, 'boxStyle') == null || this.settings.alwaysReevaluateResources)) {
                const result: ObjectMap<any> = {
                    borderTop: this.parseBorderStyle,
                    borderRight: this.parseBorderStyle,
                    borderBottom: this.parseBorderStyle,
                    borderLeft: this.parseBorderStyle,
                    borderRadius: this.parseBorderRadius,
                    backgroundColor: this.parseBackgroundColor,
                    backgroundImage: !node.hasBit('excludeResource', NODE_RESOURCE.IMAGE_SOURCE),
                    backgroundSize: this.parseBoxDimensions,
                    backgroundRepeat: true,
                    backgroundPosition: true
                };
                for (const attr in result) {
                    const value = node.css(attr);
                    if (typeof result[attr] === 'function') {
                        result[attr] = result[attr](value, node, attr);
                    }
                    else if (result[attr] === true) {
                        result[attr] = value;
                    }
                    else {
                        result[attr] = '';
                    }
                }
                if (result.backgroundColor.length > 0 &&
                    !node.has('backgroundColor') && (
                        node.cssParent('backgroundColor', false, true) === result.backgroundColor[1] ||
                        (node.documentParent.visible && cssFromParent(node.element, 'backgroundColor'))
                   ))
                {
                    result.backgroundColor.length = 0;
                }
                if (result.borderTop.style !== 'none') {
                    const borderTop = JSON.stringify(result.borderTop);
                    if (borderTop === JSON.stringify(result.borderRight) &&
                        borderTop === JSON.stringify(result.borderBottom) &&
                        borderTop === JSON.stringify(result.borderLeft))
                    {
                        result.border = result.borderTop;
                    }
                }
                setElementCache(node.element, 'boxStyle', result);
            }
        });
    }

    public setFontStyle() {
        this.cache.each(node => {
            if (!node.hasBit('excludeResource', NODE_RESOURCE.FONT_STYLE) && (getElementCache(node.element, 'fontStyle') == null || this.settings.alwaysReevaluateResources)) {
                const backgroundImage = this.hasDrawableBackground(<BoxStyle> getElementCache(node.element, 'boxStyle'));
                if (node.length > 0 ||
                    node.imageElement ||
                    node.tagName === 'HR' ||
                    (node.inlineText && !backgroundImage && !node.preserveWhiteSpace && node.element.innerHTML.trim() === ''))
                {
                    return;
                }
                else {
                    const color = parseRGBA(node.css('color'), node.css('opacity'));
                    const backgroundColor = parseRGBA(node.css('backgroundColor'), node.css('opacity'));
                    if (backgroundColor.length > 0 && (
                            backgroundImage ||
                            (node.cssParent('backgroundColor', false, true) === backgroundColor[1] && (node.plainText || backgroundColor[1] !== node.styleMap.backgroundColor)) ||
                            (!node.has('backgroundColor') && cssFromParent(node.element, 'backgroundColor'))
                       ))
                    {
                        backgroundColor.length = 0;
                    }
                    let fontWeight = node.css('fontWeight');
                    let fontSize = node.css('fontSize');
                    if (convertInt(fontSize) === 0) {
                        switch (fontSize) {
                            case 'xx-small':
                                fontSize = '8px';
                                break;
                            case 'x-small':
                                fontSize = '10px';
                                break;
                            case 'small':
                                fontSize = '13px';
                                break;
                            case 'medium':
                                fontSize = '16px';
                                break;
                            case 'large':
                                fontSize = '18px';
                                break;
                            case 'x-large':
                                fontSize = '24px';
                                break;
                            case 'xx-large':
                                fontSize = '32px';
                                break;
                        }
                    }
                    if (!isNumber(fontWeight)) {
                        switch (fontWeight) {
                            case 'lighter':
                                fontWeight = '200';
                                break;
                            case 'bold':
                                fontWeight = '700';
                                break;
                            case 'bolder':
                                fontWeight = '900';
                                break;
                            default:
                                fontWeight = '400';
                                break;
                        }
                    }
                    const result: FontAttribute = {
                        fontFamily: node.css('fontFamily'),
                        fontStyle: node.css('fontStyle'),
                        fontSize,
                        fontWeight,
                        color,
                        backgroundColor
                    };
                    setElementCache(node.element, 'fontStyle', result);
                }
            }
        });
    }

    public setValueString() {
        function parseWhiteSpace(node: T, value: string): [string, boolean] {
            if (node.multiLine) {
                value = value.replace(/^\s*\n/, '');
            }
            switch (node.css('whiteSpace')) {
                case 'nowrap':
                    value = value.replace(/\n/g, ' ');
                    break;
                case 'pre':
                case 'pre-wrap':
                    value = value.replace(/\n/g, '\\n');
                    value = value.replace(/\s/g, '&#160;');
                    break;
                case 'pre-line':
                    value = value.replace(/\n/g, '\\n');
                    value = value.replace(/\s+/g, ' ');
                    break;
                default:
                    if (isLineBreak(<Element> node.element.previousSibling)) {
                        value = value.replace(/^\s+/, '');
                    }
                    if (isLineBreak(<Element> node.element.nextSibling)) {
                        value = value.replace(/\s+$/, '');
                    }
                    return [value, false];
            }
            return [value, true];
        }
        this.cache.visible.each(node => {
            const element = node.element;
            if (!node.hasBit('excludeResource', NODE_RESOURCE.VALUE_STRING) && (getElementCache(element, 'valueString') == null || this.settings.alwaysReevaluateResources)) {
                let name = '';
                let value = '';
                let inlineTrim = false;
                let performTrim = true;
                if (element instanceof HTMLInputElement) {
                    switch (element.type) {
                        case 'text':
                        case 'number':
                        case 'email':
                        case 'search':
                        case 'submit':
                        case 'reset':
                        case 'button':
                            value = element.value.trim();
                            break;
                        default:
                            if (node.companion != null) {
                                value = node.companion.textContent.trim();
                            }
                            break;
                    }
                }
                else if (element instanceof HTMLTextAreaElement) {
                    value = element.value.trim();
                }
                else if (element instanceof HTMLElement) {
                    if (element.tagName === 'BUTTON') {
                        value = element.innerText;
                    }
                    else if (node.inlineText) {
                        name = node.textContent.trim();
                        value = replaceEntity(element.children.length > 0 || element.tagName === 'CODE' ? element.innerHTML : node.textContent);
                        [value, inlineTrim] = parseWhiteSpace(node, value);
                        value = value.replace(/\s*<br\s*\/?>\s*/g, '\\n');
                        value = value.replace(/\s+(class|style)=".*?"/g, '');
                    }
                    else if (
                        element.innerText.trim() === '' &&
                        this.hasDrawableBackground(<BoxStyle> getElementCache(element, 'boxStyle')))
                    {
                        value = replaceEntity(element.innerText);
                        performTrim = false;
                    }
                }
                else if (node.plainText) {
                    name = node.textContent.trim();
                    value = replaceEntity(node.textContent);
                    value = value.replace(/&[A-Za-z]+;/g, (match => match.replace('&', '&amp;')));
                    [value, inlineTrim] = parseWhiteSpace(node, value);
                }
                if (value !== '') {
                    if (performTrim) {
                        const previousSibling = node.previousSibling();
                        const nextSibling = node.nextSibling();
                        let previousSpaceEnd = false;
                        if (previousSibling == null || previousSibling.multiLine || previousSibling.lineBreak) {
                            value = value.replace(/^\s+/, '');
                        }
                        else {
                            previousSpaceEnd = /\s+$/.test((<HTMLElement> previousSibling.element).innerText || previousSibling.element.textContent || '');
                        }
                        if (inlineTrim) {
                            const original = value;
                            value = value.trim();
                            if (previousSibling &&
                                !previousSibling.block &&
                                !previousSibling.lineBreak &&
                                !previousSpaceEnd && /^\s+/.test(original))
                            {
                                value = '&#160;' + value;
                            }
                            if (nextSibling && !nextSibling.lineBreak && /\s+$/.test(original)) {
                                value = value + '&#160;';
                            }
                        }
                        else {
                            if (!/^\s+$/.test(value)) {
                                value = value.replace(/^\s+/, (
                                    previousSibling && (
                                        previousSibling.block ||
                                        previousSibling.lineBreak ||
                                        (previousSibling.element instanceof HTMLElement && previousSibling.element.innerText.length > 1 && previousSpaceEnd) ||
                                        (node.multiLine && hasLineBreak(element))
                                    ) ? ''
                                      : '&#160;')
                                );
                                value = value.replace(/\s+$/, nextSibling != null && nextSibling.lineBreak ? '' : '&#160;');
                            }
                            else if (value.length > 0) {
                                value = '&#160;' + value.substring(1);
                            }
                        }
                    }
                    if (value !== '') {
                        setElementCache(element, 'valueString', { name, value });
                    }
                }
            }
        });
    }

    public setOptionArray() {
        this.cache
            .filter(node =>
                node.visible &&
                node.tagName === 'SELECT' &&
                !node.hasBit('excludeResource', NODE_RESOURCE.OPTION_ARRAY)
            ).each(node => {
                const element = <HTMLSelectElement> node.element;
                if (getElementCache(element, 'optionArray') == null || this.settings.alwaysReevaluateResources) {
                    const stringArray: string[] = [];
                    let numberArray: Null<string[]> = [];
                    let i = -1;
                    while (++i < element.children.length) {
                        const item = <HTMLOptionElement> element.children[i];
                        const value = item.text.trim();
                        if (value !== '') {
                            if (numberArray && stringArray.length === 0 && isNumber(value)) {
                                numberArray.push(value);
                            }
                            else {
                                if (numberArray && numberArray.length > 0) {
                                    i = -1;
                                    numberArray = null;
                                    continue;
                                }
                                if (value !== '') {
                                    stringArray.push(value);
                                }
                            }
                        }
                    }
                    setElementCache(element, 'optionArray', {
                        stringArray: stringArray.length > 0 ? stringArray : null,
                        numberArray: numberArray && numberArray.length > 0 ? numberArray : null
                    });
                }
            });
    }

    protected borderVisible(border?: BorderAttribute) {
        return border != null && !(border.style === 'none' || border.width === '0px');
    }

    protected hasDrawableBackground(object?: BoxStyle) {
        return (object && (
                this.borderVisible(object.borderTop) ||
                this.borderVisible(object.borderRight) ||
                this.borderVisible(object.borderBottom) ||
                this.borderVisible(object.borderLeft) ||
                (object.backgroundImage !== '' && object.backgroundImage !== 'none') ||
                object.borderRadius.length > 0
            )
        );
    }

    private parseBorderStyle(value: string, node: T, attr: string): BorderAttribute {
        let colorMap = node.css(`${attr}Color`);
        if (colorMap === 'initial') {
            colorMap = value;
        }
        const style = node.css(`${attr}Style`) || 'none';
        let width = node.css(`${attr}Width`) || '1px';
        const color = style !== 'none' ? parseRGBA(colorMap, node.css('opacity')) : [];
        if (style === 'inset' && width === '0px') {
            width = '1px';
        }
        return { style, width, color: color.length > 0 ? color : ['#000000', 'rgb(0, 0, 0)', '0'] };
    }

    private parseBorderRadius(value: string, node: T) {
        const [top, right, bottom, left] = [
            node.css('borderTopLeftRadius'),
            node.css('borderTopRightRadius'),
            node.css('borderBottomLeftRadius'),
            node.css('borderBottomRightRadius')
        ];
        if (top === right && right === bottom && bottom === left) {
            return top === '' || top === '0px' ? [] : [top];
        }
        else {
            return [top, right, bottom, left];
        }
    }

    private parseBackgroundColor(value: string, node: T) {
        return parseRGBA(value, node.css('opacity'));
    }

    private parseBoxDimensions(value: string, node: T) {
        const fontSize = node.css('fontSize');
        if (value !== 'auto' && value !== 'initial') {
            const match = value.match(/^([0-9\.]+(?:px|pt|em|%)|auto)(?: ([0-9\.]+(?:px|pt|em|%)|auto))?(?: ([0-9\.]+(?:px|pt|em)))?(?: ([0-9\.]+(?:px|pt|em)))?$/);
            if (match) {
                if ((match[1] === '0px' && match[2] == null) || (match[1] === 'auto' && match[2] === 'auto')) {
                    return [];
                }
                if (match[1] === 'auto' || match[2] === 'auto') {
                    return [match[1] === 'auto' ? '' : convertPX(match[1], fontSize), match[2] === 'auto' ? '' : convertPX(match[2], fontSize)];
                }
                else if (isPercent(match[1]) && match[3] == null) {
                    return [match[1], match[2]];
                }
                else if (match[2] == null || (match[1] === match[2] && match[1] === match[3] && match[1] === match[4])) {
                    return [convertPX(match[1], fontSize)];
                }
                else if (match[3] == null || (match[1] === match[3] && match[2] === match[4])) {
                    return [convertPX(match[1], fontSize), convertPX(match[2], fontSize)];
                }
                else {
                    return [convertPX(match[1], fontSize), convertPX(match[2], fontSize), convertPX(match[3], fontSize), convertPX(match[4], fontSize)];
                }
            }
        }
        return [];
    }
}