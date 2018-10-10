import Node from './node';
import NodeList from './nodelist';
import Application from './application';
import File from './file';
import { convertInt, convertPX, hasValue, isNumber, isPercent, hasBit } from '../lib/util';
import { cssFromParent, getBoxSpacing, getElementCache, hasLineBreak, isLineBreak, setElementCache } from '../lib/dom';
import { replaceEntity } from '../lib/xml';
import { parseRGBA } from '../lib/color';
import { NODE_RESOURCE, USER_AGENT } from '../lib/enumeration';

export default abstract class Resource<T extends Node> implements androme.lib.base.Resource<T> {
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

    public abstract settings: Settings;
    public cache: NodeList<T>;
    public application: Application<T>;
    public imageDimensions: Map<string, Image>;

    protected constructor(public file: File<T>) {
        this.file.stored = Resource.STORED;
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
        this.cache.elements.forEach(node => {
            if (!node.hasBit('excludeResource', NODE_RESOURCE.BOX_SPACING) && (
                  !getElementCache(node.element, 'boxSpacing') ||
                  this.settings.alwaysReevaluateResources
               ))
            {
                const result = getBoxSpacing(node.element);
                const formatted = {};
                for (const attr in result) {
                    if (node.inlineStatic && (
                          attr === 'marginTop' ||
                          attr === 'marginBottom'
                       ))
                    {
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
        this.cache.elements.forEach(node => {
            if (!node.hasBit('excludeResource', NODE_RESOURCE.BOX_STYLE) && (
                  !getElementCache(node.element, 'boxStyle') ||
                  this.settings.alwaysReevaluateResources
               ))
            {
                const boxModel = {
                    borderTop: this.parseBorderStyle,
                    borderRight: this.parseBorderStyle,
                    borderBottom: this.parseBorderStyle,
                    borderLeft: this.parseBorderStyle,
                    borderRadius: this.parseBorderRadius,
                    backgroundColor: this.parseBackgroundColor,
                    backgroundImage: !node.hasBit('excludeResource', NODE_RESOURCE.IMAGE_SOURCE),
                    backgroundSize: this.parseBoxDimensions,
                    backgroundRepeat: true,
                    backgroundPositionX: true,
                    backgroundPositionY: true
                };
                const result: BoxStyle = {} as any;
                for (const attr in boxModel) {
                    const value = node.css(attr);
                    if (typeof boxModel[attr] === 'function') {
                        result[attr] = boxModel[attr](value, node, attr);
                    }
                    else if (boxModel[attr] === true) {
                        result[attr] = value;
                    }
                    else {
                        result[attr] = '';
                    }
                }
                if (Array.isArray(result.backgroundColor) &&
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
            if (!node.hasBit('excludeResource', NODE_RESOURCE.FONT_STYLE) && (
                  !getElementCache(node.element, 'fontStyle') ||
                  this.settings.alwaysReevaluateResources
               ))
            {
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
                    let fontFamily = node.css('fontFamily');
                    let fontSize = node.css('fontSize');
                    let fontWeight = node.css('fontWeight');
                    if (hasBit(this.application.userAgent, USER_AGENT.EDGE) && !node.has('fontFamily')) {
                        switch (node.tagName) {
                            case 'TT':
                            case 'CODE':
                            case 'KBD':
                            case 'SAMP':
                                fontFamily = 'monospace';
                                break;
                        }
                    }
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
                        fontFamily,
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
            if (node.multiLine && !node.renderParent.linearVertical) {
                value = value.replace(/^\s*\n/, '');
            }
            switch (node.css('whiteSpace')) {
                case 'nowrap':
                    value = value.replace(/\n/g, ' ');
                    break;
                case 'pre':
                case 'pre-wrap':
                    if (!node.renderParent.linearVertical) {
                        value = value.replace(/^\n/, '');
                    }
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
        this.cache.visible.forEach(node => {
            const element = node.element;
            if (!node.hasBit('excludeResource', NODE_RESOURCE.VALUE_STRING) && (
                  !getElementCache(element, 'valueString') ||
                  this.settings.alwaysReevaluateResources
               ))
            {
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
                            if (node.companion && !node.companion.visible) {
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
                        if (!previousSibling || previousSibling.multiLine || previousSibling.lineBreak) {
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
                                value = value.replace(/\s+$/, nextSibling && nextSibling.lineBreak ? '' : '&#160;');
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
        this.cache.list
            .filter(node =>
                node.visible &&
                node.tagName === 'SELECT' &&
                !node.hasBit('excludeResource', NODE_RESOURCE.OPTION_ARRAY)
            )
            .forEach(node => {
                const element = <HTMLSelectElement> node.element;
                if (!getElementCache(element, 'optionArray') || this.settings.alwaysReevaluateResources) {
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

    public borderVisible(border?: BorderAttribute) {
        return border != null && !(border.style === 'none' || border.width === '0px');
    }

    public hasDrawableBackground(object?: BoxStyle) {
        return (
            object != null && (
              this.borderVisible(object.borderTop) ||
              this.borderVisible(object.borderRight) ||
              this.borderVisible(object.borderBottom) ||
              this.borderVisible(object.borderLeft) ||
              object.borderRadius.length > 0 ||
              (object.backgroundImage !== '' && object.backgroundImage !== 'none')
            )
        );
    }

    private parseBorderStyle(value: string, node: T, attr: string): BorderAttribute {
        let cssColor = node.css(`${attr}Color`);
        switch (cssColor) {
            case 'initial':
                cssColor = value;
                break;
            case 'inherit':
            case 'currentColor':
                cssColor = node.documentParent.css(`${attr}Color`);
                break;
        }
        const style = node.css(`${attr}Style`) || 'none';
        let width = node.css(`${attr}Width`) || '1px';
        const color = style !== 'none' ? parseRGBA(cssColor, node.css('opacity')) : [];
        if (style === 'inset' && width === '0px') {
            width = '1px';
        }
        return {
            style,
            width,
            color: color.length > 0 ? color : ['#000000', 'rgb(0, 0, 0)', '0']
        };
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