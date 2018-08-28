import { BorderAttribute, BoxStyle, FontAttribute, Null, ResourceMap, ViewData } from '../lib/types';
import File from './file';
import Node from './node';
import NodeList from './nodelist';
import { convertPX, hasValue, includesEnum, isNumber, isPercent } from '../lib/util';
import { replaceEntity } from '../lib/xml';
import { getBoxSpacing, getCache, hasLineBreak, sameAsParent, setCache } from '../lib/dom';
import { parseRGBA } from '../lib/color';
import { NODE_RESOURCE } from '../lib/constants';
import SETTINGS from '../settings';

export default abstract class Resource<T extends Node> {
    public static STORED: ResourceMap = {
        STRINGS: new Map(),
        ARRAYS: new Map(),
        FONTS: new Map(),
        COLORS: new Map(),
        STYLES: new Map(),
        DIMENS: new Map(),
        DRAWABLES: new Map(),
        IMAGES: new Map()
    };

    public static insertStoredAsset(asset: string, name: string, value: any) {
        const stored: Map<string, any> = Resource.STORED[asset];
        if (stored) {
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

    constructor(public file: File<T>) {
    }

    public abstract combineStyles(viewData: ViewData<NodeList<T>>): void;
    public abstract setImageSource(): void;
    public abstract addTheme(template: string, data: {}, options: {}): void;
    public abstract finalize(viewData: ViewData<NodeList<T>>): void;

    public addFile(pathname: string, filename: string, content = '', uri = '') {
        this.file.addFile(pathname, filename, content, uri);
    }

    public reset() {
        Resource.STORED.STRINGS = new Map();
        Resource.STORED.ARRAYS = new Map();
        Resource.STORED.FONTS = new Map();
        Resource.STORED.STYLES = new Map();
        Resource.STORED.DRAWABLES = new Map();
        Resource.STORED.COLORS = new Map();
        Resource.STORED.DIMENS = new Map();
        Resource.STORED.IMAGES = new Map();
        this.file.reset();
    }

    public setBoxSpacing() {
        this.cache.elements.filter(node => !includesEnum(node.excludeResource, NODE_RESOURCE.BOX_SPACING)).each(node => {
            if (getCache(node.element, 'boxSpacing') == null || SETTINGS.alwaysReevaluateResources) {
                const result = getBoxSpacing(node.element);
                const formatted = {};
                for (const attr in result) {
                   if (node.inline && (attr === 'marginTop' || attr === 'marginBottom')) {
                        formatted[attr] = '0px';
                    }
                    else {
                        formatted[attr] = convertPX(result[attr]);
                    }
                }
                setCache(node.element, 'boxSpacing', formatted);
            }
        });
    }

    public setBoxStyle() {
        this.cache.elements.filter(node => !includesEnum(node.excludeResource, NODE_RESOURCE.BOX_STYLE)).each(node => {
            if (getCache(node.element, 'boxStyle') == null || SETTINGS.alwaysReevaluateResources) {
                const result: any = {
                    borderTop: this.parseBorderStyle,
                    borderRight: this.parseBorderStyle,
                    borderBottom: this.parseBorderStyle,
                    borderLeft: this.parseBorderStyle,
                    borderRadius: this.parseBorderRadius,
                    backgroundColor: this.parseBackgroundColor,
                    backgroundImage: (!includesEnum(node.excludeResource, NODE_RESOURCE.IMAGE_SOURCE) ? true : false),
                    backgroundSize: this.parseBoxDimensions,
                    backgroundRepeat: true,
                    backgroundPosition: true
                };
                for (const i in result) {
                    const value = node.css(i);
                    if (typeof result[i] === 'function') {
                        result[i] = result[i](value, node, i);
                    }
                    else if (result[i] === true) {
                        result[i] = value;
                    }
                    else {
                        result[i] = '';
                    }
                }
                if (result.backgroundColor.length > 0 && ((SETTINGS.excludeBackgroundColor.includes(result.backgroundColor[0]) && result.backgroundColor[1] !== node.styleMap.backgroundColor) || (!node.isSet('styleMap', 'backgroundColor') && node.documentParent.visible && sameAsParent(node.element, 'backgroundColor')))) {
                    result.backgroundColor = [];
                }
                const borderTop = JSON.stringify(result.borderTop);
                if (borderTop === JSON.stringify(result.borderRight) && borderTop === JSON.stringify(result.borderBottom) && borderTop === JSON.stringify(result.borderLeft)) {
                    result.border = result.borderTop;
                }
                setCache(node.element, 'boxStyle', result);
            }
        });
    }

    public setFontStyle() {
        this.cache.filter(node => node.visible && !includesEnum(node.excludeResource, NODE_RESOURCE.FONT_STYLE)).each(node => {
            if (getCache(node.element, 'fontStyle') == null || SETTINGS.alwaysReevaluateResources) {
                if (node.renderChildren.length > 0 || node.element.tagName === 'IMG' || node.element.tagName === 'HR') {
                    return;
                }
                else {
                    let color = parseRGBA(node.css('color'), node.css('opacity'));
                    if (color.length > 0 && SETTINGS.excludeTextColor.includes(color[0]) && (node.plainText || color[1] !== node.styleMap.color)) {
                        color = [];
                    }
                    let backgroundColor = parseRGBA(node.css('backgroundColor'), node.css('opacity'));
                    if (backgroundColor.length > 0 && (this.hasDrawableBackground(<BoxStyle> getCache(node.element, 'boxStyle')) || (SETTINGS.excludeBackgroundColor.includes(backgroundColor[0]) && (node.plainText || backgroundColor[1] !== node.styleMap.backgroundColor)) || (!node.isSet('styleMap', 'backgroundColor') && sameAsParent(node.element, 'backgroundColor')))) {
                        backgroundColor = [];
                    }
                    let fontWeight = node.css('fontWeight');
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
                        fontSize: node.css('fontSize'),
                        fontWeight,
                        color,
                        backgroundColor
                    };
                    setCache(node.element, 'fontStyle', result);
                }
            }
        });
    }

    public setOptionArray() {
        this.cache.filter(node => node.visible && node.element.tagName === 'SELECT' && !includesEnum(node.excludeResource, NODE_RESOURCE.OPTION_ARRAY)).each(node => {
            const element = <HTMLSelectElement> node.element;
            if (getCache(element, 'optionArray') == null || SETTINGS.alwaysReevaluateResources) {
                const stringArray: string[] = [];
                let numberArray: Null<string[]> = [];
                for (let i = 0; i < element.children.length; i++) {
                    const item = <HTMLOptionElement> element.children[i];
                    const value = item.text.trim();
                    if (value !== '') {
                        if (!SETTINGS.numberResourceValue && numberArray != null && stringArray.length === 0 && isNumber(value)) {
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
                setCache(element, 'optionArray', { stringArray: (stringArray.length > 0 ? stringArray : null), numberArray: (numberArray && numberArray.length > 0 ? numberArray : null) });
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
                    return [value, false];
            }
            return [value, true];
        }
        this.cache.filter(node => node.visible && !includesEnum(node.excludeResource, NODE_RESOURCE.VALUE_STRING)).each(node => {
            const element = <HTMLInputElement> node.element;
            if (getCache(element, 'valueString') == null || SETTINGS.alwaysReevaluateResources) {
                let name = '';
                let value = '';
                let inlineTrim = false;
                if (element.tagName === 'INPUT') {
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
                                value = node.companion.element.innerText.trim();
                            }
                            break;
                    }
                }
                else if (element.tagName === 'TEXTAREA') {
                    value = element.value.trim();
                }
                else if (node.plainText) {
                    name = (element.textContent || '').trim();
                    value = replaceEntity(element.textContent || '');
                    value = value.replace(/&[A-Za-z]+;/g, (match => match.replace('&', '&amp;')));
                    [value, inlineTrim] = parseWhiteSpace(node, value);
                    if (element.previousSibling && (<Element> element.previousSibling).tagName === 'BR') {
                        value = value.replace(/^\s+/, '');
                    }
                }
                else if (node.inlineText) {
                    name = (element.innerText || element.textContent || '').trim();
                    value = replaceEntity(element.children.length > 0 || element.tagName === 'CODE' ? element.innerHTML : element.innerText || element.textContent || '');
                    [value, inlineTrim] = parseWhiteSpace(node, value);
                    value = value.replace(/<br\s*\/?>/g, '\\n');
                    value = value.replace(/\s+(class|style)=".*?"/g, '');
                }
                if (value !== '') {
                    const previousSibling = node.previousSibling;
                    const nextSibling = node.nextSibling;
                    let previousSpaceEnd = false;
                    if (previousSibling == null) {
                        value = value.replace(/^\s+/, '');
                    }
                    else {
                        previousSpaceEnd = /\s+$/.test(<string> (previousSibling.element.innerText || previousSibling.element.textContent));
                    }
                    if (inlineTrim) {
                        const original = value;
                        value = value.trim();
                        if (previousSibling && previousSibling.display !== 'block' && !previousSpaceEnd && /^\s+/.test(original)) {
                            value = '&#160;' + value;
                        }
                        if (nextSibling && /\s+$/.test(original)) {
                            value = value + '&#160;';
                        }
                    }
                    else {
                        if (!/^\s+$/.test(value)) {
                            value = value.replace(/^\s+/, (previousSibling && (previousSibling.block || (previousSibling.hasElement && previousSpaceEnd && previousSibling.element.innerText.length > 1) || (node.multiLine && (hasLineBreak(element) || node.renderParent.renderParent.linearHorizontal))) ? '' : '&#160;'));
                            value = value.replace(/\s+$/, (nextSibling == null ? '' : '&#160;'));
                        }
                        else if (value.length > 0) {
                            value = '&#160;' + value.substring(1);
                        }
                    }
                    if (value !== '') {
                        setCache(element, 'valueString', { name, value });
                    }
                }
            }
        });
    }

    protected borderVisible(border: BorderAttribute) {
        return (border && !(border.style === 'none' || border.width === '0px'));
    }

    protected hasDrawableBackground(object: BoxStyle) {
        return (object && (this.borderVisible(object.borderTop) || this.borderVisible(object.borderRight) || this.borderVisible(object.borderBottom) || this.borderVisible(object.borderLeft) || object.backgroundImage !== '' || object.borderRadius.length > 0));
    }

    protected getBorderStyle(border: BorderAttribute) {
        const result = { solid: `android:color="@color/${border.color}"` };
        Object.assign(result, {
            dotted: `${result.solid} android:dashWidth="3px" android:dashGap="1px"`,
            dashed: `${result.solid} android:dashWidth="1px" android:dashGap="1px"`
        });
        return result[border.style] || result.solid;
    }

    private parseBorderStyle(value: string, node: T, attr: string): BorderAttribute {
        const style = node.css(`${attr}Style`) || 'none';
        let width = node.css(`${attr}Width`) || '1px';
        const color = (style !== 'none' ? parseRGBA(node.css(`${attr}Color`), node.css('opacity')) : []);
        if (style === 'inset' && width === '0px') {
            width = '1px';
        }
        return { style, width, color: (color.length > 0 ? color : ['#000000', '', '0']) };
    }

    private parseBorderRadius(value: string, node: T) {
        const [top, right, bottom, left] = [node.css('borderTopLeftRadius'), node.css('borderTopRightRadius'), node.css('borderBottomLeftRadius'), node.css('borderBottomRightRadius')];
        if (top === right && right === bottom && bottom === left) {
            return (top === '' || top === '0px' ? [] : [top]);
        }
        else {
            return [top, right, bottom, left];
        }
    }

    private parseBackgroundColor(value: string, node: T) {
        return parseRGBA(value, node.css('opacity'));
    }

    private parseBoxDimensions(value: string) {
        if (value !== 'auto') {
            const match = value.match(/^([0-9\.]+(?:px|pt|em|%)|auto)(?: ([0-9\.]+(?:px|pt|em|%)|auto))?(?: ([0-9\.]+(?:px|pt|em)))?(?: ([0-9\.]+(?:px|pt|em)))?$/);
            if (match) {
                if ((match[1] === '0px' && match[2] == null) || (match[1] === 'auto' && match[2] === 'auto')) {
                    return [];
                }
                if (match[1] === 'auto' || match[2] === 'auto') {
                    return [(match[1] === 'auto' ? '' : convertPX(match[1])), (match[2] === 'auto' ? '' : convertPX(match[2]))];
                }
                else if (isPercent(match[1]) && match[3] == null) {
                    return [match[1], match[2]];
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
        }
        return [];
    }
}