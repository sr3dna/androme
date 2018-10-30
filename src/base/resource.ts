import { NODE_RESOURCE, USER_AGENT } from '../lib/enumeration';

import { DOM_REGEX } from '../lib/constant';

import Node from './node';
import NodeList from './nodelist';
import Application from './application';
import File from './file';

import { convertFloat, convertInt, convertPX, hasValue, isNumber, isPercent, isString } from '../lib/util';
import { convertClientUnit, cssAttribute, cssFromParent, cssInherit, getBoxSpacing, getElementCache, hasLineBreak, isUserAgent, isLineBreak, setElementCache } from '../lib/dom';
import { replaceEntities } from '../lib/xml';
import { parseRGBA } from '../lib/color';

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

    public static parseBackgroundPosition(value: string, dimension: BoxDimensions, fontSize: string, percent = false) {
        const result: BoxPosition = {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            horizontal: 'left',
            vertical: 'top'
        };
        const orientation = value.split(' ');
        if (orientation.length === 4) {
            orientation.forEach((position, index) => {
                switch (index) {
                    case 0:
                        result.horizontal = position;
                        break;
                    case 2:
                        result.vertical = position;
                        break;
                    case 1:
                    case 3:
                        result[position[index - 1]] = convertClientUnit(position, index === 1 ? dimension.width : dimension.height, fontSize, percent);
                        break;
                }
            });
        }
        else if (orientation.length === 2) {
            orientation.forEach((position, index) => {
                const clientXY = convertClientUnit(position, index === 0 ? dimension.width : dimension.height, fontSize, percent);
                switch (position) {
                    case '0%':
                        break;
                    case '50%':
                        if (index === 0) {
                            result.horizontal = 'center';
                        }
                        else {
                            result.vertical = 'center';
                        }
                        result[index === 0 ? 'left' : 'top'] = clientXY;
                        break;
                    case '100%':
                        if (index === 0) {
                            result.horizontal = 'right';
                        }
                        else {
                            result.vertical = 'bottom';
                        }
                        break;
                    default:
                        if (/^[a-z]+$/.test(position)) {
                            if (index === 0) {
                                result.horizontal = position;
                            }
                            else {
                                result.vertical = position;
                            }
                        }
                        else {
                            result[index === 0 ? 'left' : 'top'] = clientXY;
                        }
                        break;
                }
            });
        }
        return result;
    }

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

    public static isBorderVisible(border?: BorderAttribute) {
        return border != null && !(border.style === 'none' || convertPX(border.width) === '0px' || border.color === '' || (typeof border.color === 'object' && !border.color.visible));
    }

    public static hasDrawableBackground(object?: BoxStyle) {
        return (
            object != null && (
                this.isBorderVisible(object.borderTop) ||
                this.isBorderVisible(object.borderRight) ||
                this.isBorderVisible(object.borderBottom) ||
                this.isBorderVisible(object.borderLeft) ||
                object.borderRadius.length > 0 ||
                (Array.isArray(object.backgroundImage) && object.backgroundImage.length > 0)
            )
        );
    }

    public abstract settings: Settings;
    public cache: NodeList<T>;
    public application: Application<T>;
    public imageDimensions: Map<string, ImageAsset>;

    protected constructor(public file: File<T>) {
        this.file.stored = Resource.STORED;
    }

    public abstract finalize(viewData: ViewData<NodeList<T>>): ArrayObject<FunctionVoid>;

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
        this.cache.elements.forEach(node => {
            if (!node.hasBit('excludeResource', NODE_RESOURCE.BOX_STYLE) && (
                    !getElementCache(node.element, 'boxStyle') || this.settings.alwaysReevaluateResources
               ))
            {
                const boxStyle: BoxStyle = {
                    background: null,
                    borderTop: null,
                    borderRight: null,
                    borderBottom: null,
                    borderLeft: null,
                    borderRadius: null,
                    backgroundColor: null,
                    backgroundSize: null,
                    backgroundImage: null,
                    backgroundRepeat: null,
                    backgroundPositionX: null,
                    backgroundPositionY: null
                } as any;
                for (const attr in boxStyle) {
                    const value = node.css(attr);
                    switch (attr) {
                        case 'borderTop':
                        case 'borderRight':
                        case 'borderBottom':
                        case 'borderLeft': {
                            let cssColor = node.css(`${attr}Color`);
                            switch (cssColor.toLowerCase()) {
                                case 'initial':
                                    cssColor = '#000000';
                                    break;
                                case 'inherit':
                                case 'currentcolor':
                                    cssColor = cssInherit(node.element, `${attr}Color`);
                                    break;
                            }
                            let width = node.css(`${attr}Width`) || '1px';
                            const style = node.css(`${attr}Style`) || 'none';
                            if (style === 'inset' && width === '0px') {
                                width = '1px';
                            }
                            const color = parseRGBA(cssColor, node.css('opacity'));
                            boxStyle[attr] = {
                                width,
                                style,
                                color: style !== 'none' && color && color.visible ? color : ''
                            };
                            break;
                        }
                        case 'borderRadius': {
                            const [top, right, bottom, left] = [
                                node.css('borderTopLeftRadius'),
                                node.css('borderTopRightRadius'),
                                node.css('borderBottomLeftRadius'),
                                node.css('borderBottomRightRadius')
                            ];
                            if (top === right && right === bottom && bottom === left) {
                                boxStyle.borderRadius = convertInt(top) === 0 ? [] : [top];
                            }
                            else {
                                boxStyle.borderRadius = [top, right, bottom, left];
                            }
                            break;
                        }
                        case 'backgroundColor': {
                            if (!node.has('backgroundColor') && (
                                    value === node.cssParent('backgroundColor', false, true) || node.documentParent.visible && cssFromParent(node.element, 'backgroundColor')
                               ))
                            {
                                boxStyle.backgroundColor = '';
                            }
                            else {
                                const color = parseRGBA(value, node.css('opacity'));
                                boxStyle.backgroundColor = color && color.visible ? color : '';
                            }
                            break;
                        }
                        case 'backgroundSize': {
                            let result: string[] = [];
                            if (value !== 'auto' && value !== 'auto auto' && value !== 'initial' && value !== '0px') {
                                const match = value.match(/^(?:([\d.]+(?:px|pt|em|%)|auto)\s*)+$/);
                                const fontSize = node.css('fontSize');
                                if (match) {
                                    if (match[1] === 'auto' || match[2] === 'auto') {
                                        result = [match[1] === 'auto' ? '' : convertPX(match[1], fontSize), match[2] === 'auto' ? '' : convertPX(match[2], fontSize)];
                                    }
                                    else if (isPercent(match[1]) && match[3] == null) {
                                        result = [match[1], match[2]];
                                    }
                                    else if (match[2] == null || (match[1] === match[2] && match[1] === match[3] && match[1] === match[4])) {
                                        result = [convertPX(match[1], fontSize)];
                                    }
                                    else if (match[3] == null || (match[1] === match[3] && match[2] === match[4])) {
                                        result = [convertPX(match[1], fontSize), convertPX(match[2], fontSize)];
                                    }
                                    else {
                                        result = [convertPX(match[1], fontSize), convertPX(match[2], fontSize), convertPX(match[3], fontSize), convertPX(match[4], fontSize)];
                                    }
                                }
                            }
                            boxStyle.backgroundSize = result;
                            break;
                        }
                        case 'background':
                        case 'backgroundImage': {
                            if (value !== 'none' && !node.hasBit('excludeResource', NODE_RESOURCE.IMAGE_SOURCE)) {
                                function colorStop(parse: boolean) {
                                    return `${parse ? '' : '(?:'},?\\s*(${parse ? '' : '?:'}rgba?\\(\\d+, \\d+, \\d+(?:, [\\d.]+)?\\)|[a-z]+)\\s*(${parse ? '' : '?:'}\\d+%)?${parse ? '' : ')'}`;
                                }
                                const gradients: Gradient[] = [];
                                let pattern: Null<RegExp> = new RegExp(`([a-z\-]+)-gradient\\(([\\w\\s%]+)?(${colorStop(false)}+)\\)`, 'g');
                                let match: Null<RegExpExecArray> = null;
                                while ((match = pattern.exec(value)) != null) {
                                    let gradient: Gradient;
                                    if (match[1] === 'linear') {
                                        gradient = <LinearGradient> {
                                            type: 'linear',
                                            x1: 0,
                                            y1: 0,
                                            x2: 0,
                                            y2: 0,
                                            angle: (() => {
                                                switch (match[2]) {
                                                    case 'to top':
                                                        return 0;
                                                    case 'to right top':
                                                        return 45;
                                                    case 'to right':
                                                        return 90;
                                                    case 'to right bottom':
                                                        return 135;
                                                    case 'to bottom':
                                                        return 180;
                                                    case 'to left bottom':
                                                        return 225;
                                                    case 'to left':
                                                        return 270;
                                                    case 'to left top':
                                                        return 315;
                                                    default:
                                                        return convertInt(match[2]);
                                                }
                                            })(),
                                            colorStop: []
                                        };
                                    }
                                    else {
                                        gradient = <RadialGradient> {
                                            type: 'radial',
                                            cx: 0,
                                            cy: 0,
                                            r: 0,
                                            fx: 0,
                                            fy: 0,
                                            shapePosition: (() => {
                                                const result = ['ellipse', 'center'];
                                                if (match[2]) {
                                                    const shape = match[2].split('at').map(item => item.trim());
                                                    switch (shape[0]) {
                                                        case 'ellipse':
                                                        case 'circle':
                                                        case 'closest-side':
                                                        case 'closest-corner':
                                                        case 'farthest-side':
                                                        case 'farthest-corner':
                                                            result[0] = shape[0];
                                                            break;
                                                        default:
                                                            result[1] = shape[0];
                                                            break;
                                                    }
                                                    if (shape[1]) {
                                                        result[1] = shape[1];
                                                    }
                                                }
                                                return result;
                                            })(),
                                            colorStop: []
                                        };
                                    }
                                    const stopMatch = match[3].trim().split(new RegExp(colorStop(true), 'g'));
                                    for (let i = 0; i < stopMatch.length; i += 3) {
                                        const color = parseRGBA(stopMatch[i + 1]);
                                        if (color && color.visible) {
                                            gradient.colorStop.push({
                                                color,
                                                offset: stopMatch[i + 2]
                                            });
                                        }
                                    }
                                    if (gradient.colorStop.length > 1) {
                                        gradients.push(gradient);
                                    }
                                }
                                if (gradients.length > 0) {
                                    boxStyle.backgroundGradient = gradients.reverse();
                                }
                                else {
                                    const images: string[] = [];
                                    pattern = new RegExp(DOM_REGEX.URL, 'g');
                                    match = null;
                                    while ((match = pattern.exec(value)) != null) {
                                        if (match) {
                                            images.push(match[0]);
                                        }
                                    }
                                    boxStyle.backgroundImage = images;
                                }
                            }
                            break;
                        }
                        case 'backgroundRepeat':
                        case 'backgroundPositionX':
                        case 'backgroundPositionY': {
                            boxStyle[attr] = value;
                            break;
                        }
                    }
                }
                const borderTop = JSON.stringify(boxStyle.borderTop);
                if (borderTop === JSON.stringify(boxStyle.borderRight) &&
                    borderTop === JSON.stringify(boxStyle.borderBottom) &&
                    borderTop === JSON.stringify(boxStyle.borderLeft))
                {
                    boxStyle.border = boxStyle.borderTop;
                }
                setElementCache(node.element, 'boxStyle', boxStyle);
            }
        });
    }

    public setFontStyle() {
        this.cache.each(node => {
            if (!node.hasBit('excludeResource', NODE_RESOURCE.FONT_STYLE) && (
                    !getElementCache(node.element, 'fontStyle') || this.settings.alwaysReevaluateResources
               ))
            {
                const backgroundImage = Resource.hasDrawableBackground(<BoxStyle> getElementCache(node.element, 'boxStyle'));
                if (node.length > 0 ||
                    node.imageElement ||
                    node.tagName === 'HR' ||
                    (node.inlineText && !backgroundImage && !node.preserveWhiteSpace && node.element.innerHTML.trim() === ''))
                {
                    return;
                }
                else {
                    const opacity = node.css('opacity');
                    const color = parseRGBA(node.css('color'), opacity) || '';
                    let backgroundColor: string | ColorHexAlpha = node.css('backgroundColor');
                    if (!(backgroundImage ||
                        (node.cssParent('backgroundColor', false, true) === backgroundColor && (node.plainText || backgroundColor !== node.styleMap.backgroundColor)) ||
                        (!node.has('backgroundColor') && node.documentParent.visible && cssFromParent(node.element, 'backgroundColor'))))
                    {
                        backgroundColor = parseRGBA(node.css('backgroundColor'), opacity) || '';
                    }
                    else {
                        backgroundColor = '';
                    }
                    let fontFamily = node.css('fontFamily');
                    let fontSize = node.css('fontSize');
                    let fontWeight = node.css('fontWeight');
                    if (isUserAgent(USER_AGENT.EDGE) && !node.has('fontFamily')) {
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

    public setImageSource() {
        this.cache.visible.forEach(node => {
            if (!node.hasBit('excludeResource', NODE_RESOURCE.IMAGE_SOURCE) && (
                    !getElementCache(node.element, 'imageSource') || this.settings.alwaysReevaluateResources
               ))
            {
                if (node.svgElement) {
                    const element = <SVGSVGElement> node.element;
                    if (element.children.length > 0) {
                        function getPath(item: SVGGraphicsElement, d: string, clipPath: boolean) {
                            if (isString(d) && d !== 'none' && cssAttribute(item, 'display') !== 'none' && !['hidden', 'collpase'].includes(cssAttribute(item, 'visibility'))) {
                                let fill: string | string[] = cssAttribute(item, 'fill');
                                let stroke: string | string[] = cssAttribute(item, 'stroke');
                                let match = DOM_REGEX.URL.exec(fill);
                                let color = parseRGBA(cssAttribute(item, 'color'));
                                if (color == null || !color.visible) {
                                    color = parseRGBA(cssInherit(item, 'color'));
                                }
                                if (match) {
                                    fill = [match[1]];
                                }
                                else if (isString(fill)) {
                                    switch (fill.toLowerCase()) {
                                        case 'none':
                                        case 'transparent':
                                            fill = '';
                                            break;
                                        case 'currentcolor':
                                            fill = color ? color.valueRGB : '';
                                            break;
                                        default:
                                            const fillColor = parseRGBA(fill);
                                            if (fillColor) {
                                                fill = fillColor.valueRGB;
                                            }
                                            break;
                                    }
                                }
                                match = DOM_REGEX.URL.exec(stroke);
                                if (match) {
                                    stroke = [match[1]];
                                }
                                else if (isString(stroke)) {
                                    switch (stroke.toLowerCase()) {
                                        case 'none':
                                        case 'transparent':
                                            stroke = '';
                                            break;
                                        case 'currentcolor':
                                            stroke = color ? color.valueRGB : '';
                                            break;
                                        default:
                                            const strokeColor = parseRGBA(stroke);
                                            if (strokeColor) {
                                                stroke = strokeColor.valueRGB;
                                            }
                                            break;
                                    }
                                }
                                const fillOpacity = parseFloat(cssAttribute(item, 'fill-opacity'));
                                const strokeOpacity = parseFloat(cssAttribute(item, 'stroke-opacity'));
                                return <SVGPath> {
                                    name: item.id,
                                    element: item,
                                    fillRule: cssAttribute(item, 'fill-rule'),
                                    fill,
                                    stroke,
                                    strokeWidth: convertInt(cssAttribute(item, 'stroke-width')).toString(),
                                    fillOpacity: !isNaN(fillOpacity) && fillOpacity < 1 ? fillOpacity : 1,
                                    strokeOpacity: !isNaN(strokeOpacity) && strokeOpacity < 1 ? strokeOpacity : 1,
                                    strokeLineCap: cssAttribute(item, 'stroke-linecap'),
                                    strokeLineJoin: cssAttribute(item, 'stroke-linejoin'),
                                    strokeMiterLimit: cssAttribute(item, 'stroke-miterlimit'),
                                    gradients: [],
                                    clipPath,
                                    clipRule: cssAttribute(item, 'clip-rule'),
                                    d
                                };
                            }
                            return null;
                        }
                        const opacity = convertFloat(node.css('opacity'));
                        const svg: SVG = {
                            element,
                            name: element.id,
                            width: element.width.baseVal.value,
                            height: element.height.baseVal.value,
                            viewBoxWidth: element.viewBox.baseVal.width,
                            viewBoxHeight: element.viewBox.baseVal.height,
                            opacity: !isNaN(opacity) && opacity < 1 ? opacity : 1,
                            defs: {
                                gradients: new Map<string, Gradient>()
                            },
                            children: []
                        };
                        const baseElements = Array.from(element.children).filter(item => item.tagName === 'svg' || item.tagName === 'defs' || item.tagName === 'g') as SVGSVGElement[];
                        [element, ...baseElements].forEach((item, index) => {
                            if (item.tagName === 'defs') {
                                function getColorStop(gradient: SVGGradientElement) {
                                    const result: ColorStop[] = [];
                                    Array.from(gradient.getElementsByTagName('stop')).forEach(stop => {
                                        const color = parseRGBA(cssAttribute(stop, 'stop-color'));
                                        if (color) {
                                            result.push({
                                                color,
                                                offset: cssAttribute(stop, 'offset')
                                            });
                                        }
                                    });
                                    return result;
                                }
                                const defs = <SVGDefsElement> item;
                                for (let i = 0; i < defs.children.length; i++) {
                                    if (defs.children[i].id) {
                                        switch (defs.children[i].tagName) {
                                            case 'linearGradient': {
                                                const gradient = <SVGLinearGradientElement> defs.children[i];
                                                svg.defs.gradients.set(`#${gradient.id}`, <LinearGradient> {
                                                    type: 'linear',
                                                    x1: gradient.x1.baseVal.value,
                                                    x2: gradient.x2.baseVal.value,
                                                    y1: gradient.y1.baseVal.value,
                                                    y2: gradient.y2.baseVal.value,
                                                    colorStop: getColorStop(gradient)
                                                });
                                                break;
                                            }
                                            case 'radialGradient': {
                                                const gradient = <SVGRadialGradientElement> defs.children[i];
                                                svg.defs.gradients.set(`#${gradient.id}`, <RadialGradient> {
                                                    type: 'radial',
                                                    cx: gradient.cx.baseVal.value,
                                                    cy: gradient.cy.baseVal.value,
                                                    r: gradient.r.baseVal.value,
                                                    fx: gradient.fx.baseVal.value,
                                                    fy: gradient.fy.baseVal.value,
                                                    colorStop: getColorStop(gradient)
                                                });
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                const group: SVGGroup = {
                                    element: item,
                                    name: item.id || `g_${index}`,
                                    translateX: 0,
                                    translateY: 0,
                                    scaleX: 1,
                                    scaleY: 1,
                                    rotation: 0,
                                    skewX: 0,
                                    skewY: 0,
                                    nestedSVG: false,
                                    children: []
                                };
                                switch (item.tagName) {
                                    case 'g':
                                        const g = <SVGGElement> item;
                                        for (let i = 0; i < g.transform.baseVal.numberOfItems; i++) {
                                            const transform = g.transform.baseVal.getItem(i);
                                            switch (transform.type) {
                                                case SVGTransform.SVG_TRANSFORM_TRANSLATE:
                                                    group.translateX = transform.matrix.e;
                                                    group.translateY = transform.matrix.f;
                                                    break;
                                                case SVGTransform.SVG_TRANSFORM_SCALE:
                                                    group.scaleX = transform.matrix.a;
                                                    group.scaleY = transform.matrix.d;
                                                    break;
                                                case SVGTransform.SVG_TRANSFORM_ROTATE:
                                                    group.rotation = transform.angle;
                                                    break;
                                                case SVGTransform.SVG_TRANSFORM_SKEWX:
                                                    group.skewX = transform.angle;
                                                    break;
                                                case SVGTransform.SVG_TRANSFORM_SKEWY:
                                                    group.skewY = transform.angle;
                                                    break;
                                            }
                                        }
                                        break;
                                    default:
                                        if (index > 0) {
                                            group.x = item.x.baseVal.value;
                                            group.y = item.y.baseVal.value;
                                            group.nestedSVG = true;
                                        }
                                        break;
                                }
                                const clipPath = Array.from(item.children).filter(path => path.tagName === 'clipPath') as SVGClipPathElement[];
                                [item, ...clipPath].forEach((shape, layerIndex) => {
                                    for (let i = 0; i < shape.children.length; i++) {
                                        const tagName = shape.children[i].tagName;
                                        const clipped = layerIndex > 0;
                                        switch (tagName) {
                                            case 'path': {
                                                const subitem = <SVGPathElement> shape.children[i];
                                                const path = getPath(subitem, cssAttribute(subitem, 'd'), clipped);
                                                if (path) {
                                                    group.children.push(path);
                                                }
                                                break;
                                            }
                                            case 'line': {
                                                const subitem = <SVGLineElement> shape.children[i];
                                                if (subitem.x1.baseVal.value !== 0 || subitem.y1.baseVal.value !== 0 || subitem.x2.baseVal.value !== 0 || subitem.y2.baseVal.value !== 0) {
                                                    const path = getPath(subitem, `M${subitem.x1.baseVal.value},${subitem.y1.baseVal.value} L${subitem.x2.baseVal.value},${subitem.y2.baseVal.value}`, clipped);
                                                    if (path && path.stroke) {
                                                        path.fill = '';
                                                        group.children.push(path);
                                                    }
                                                }
                                                break;
                                            }
                                            case 'rect': {
                                                const subitem = <SVGRectElement> shape.children[i];
                                                if (subitem.width.baseVal.value > 0 && subitem.height.baseVal.value > 0) {
                                                    const x = subitem.x.baseVal.value;
                                                    const y = subitem.y.baseVal.value;
                                                    const path = getPath(subitem, `M${x},${y} H${x + subitem.width.baseVal.value} V${y + subitem.height.baseVal.value} H${x} L${x},${y}`, clipped);
                                                    if (path) {
                                                        group.children.push(path);
                                                    }
                                                }
                                                break;
                                            }
                                            case 'polyline':
                                            case 'polygon': {
                                                const subitem = <SVGPolygonElement> shape.children[i];
                                                if (subitem.points.numberOfItems > 0) {
                                                    const d: string[] = [];
                                                    for (let j = 0; j < subitem.points.numberOfItems; j++) {
                                                        const point = subitem.points.getItem(j);
                                                        d.push(`${point.x},${point.y}`);
                                                    }
                                                    const path = getPath(subitem, `M${d.join(' ') + (tagName === 'polygon' ? 'z' : '')}`, clipped);
                                                    if (path) {
                                                        group.children.push(path);
                                                    }
                                                }
                                                break;
                                            }
                                            case 'circle': {
                                                const subitem = <SVGCircleElement> shape.children[i];
                                                const r = subitem.r.baseVal.value;
                                                if (r > 0) {
                                                    const path = getPath(subitem, `M${subitem.cx.baseVal.value},${subitem.cy.baseVal.value} m-${r},0 a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 -${r * 2},0`, clipped);
                                                    if (path) {
                                                        group.children.push(path);
                                                    }
                                                }
                                                break;
                                            }
                                            case 'ellipse': {
                                                const subitem = <SVGEllipseElement> shape.children[i];
                                                const rx = subitem.rx.baseVal.value;
                                                const ry = subitem.ry.baseVal.value;
                                                if (rx > 0 && ry > 0) {
                                                    const path = getPath(subitem, `M${subitem.cx.baseVal.value - rx},${subitem.cy.baseVal.value}a${rx},${ry} 0 1,0 ${rx * 2},0a${rx},${ry} 0 1,0 -${rx * 2},0`, clipped);
                                                    if (path) {
                                                        group.children.push(path);
                                                    }
                                                }
                                                break;
                                            }
                                        }
                                    }
                                });
                                if (group.children.length > 0) {
                                    svg.children.push(group);
                                }
                            }
                        });
                        if (svg.children.length > 0) {
                            setElementCache(element, 'imageSource', svg);
                        }
                    }
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
                    !getElementCache(element, 'valueString') || this.settings.alwaysReevaluateResources
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
                        value = replaceEntities(element.children.length > 0 || element.tagName === 'CODE' ? element.innerHTML : node.textContent);
                        [value, inlineTrim] = parseWhiteSpace(node, value);
                        value = value.replace(/\s*<br\s*\/?>\s*/g, '\\n');
                        value = value.replace(/\s+(class|style)=".*?"/g, '');
                    }
                    else if (element.innerText.trim() === '' && Resource.hasDrawableBackground(<BoxStyle> getElementCache(element, 'boxStyle'))) {
                        value = replaceEntities(element.innerText);
                        performTrim = false;
                    }
                }
                else if (node.plainText) {
                    name = node.textContent.trim();
                    value = replaceEntities(node.textContent);
                    value = value.replace(/&[A-Za-z]+;/g, match => match.replace('&', '&amp;'));
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
                                    ) ? '' : '&#160;')
                                );
                                value = value.replace(/\s+$/, nextSibling && nextSibling.lineBreak ? '' : '&#160;');
                            }
                            else if (value.length > 0) {
                                value = '&#160;' + value.substring(1);
                            }
                        }
                    }
                    if (value !== '') {
                        if (node.renderParent.layoutVertical && node.inlineText) {
                            const textIndent = node.toInt('textIndent');
                            if (textIndent > 0) {
                                value = '&#160;'.repeat(Math.ceil(textIndent / 6)) + value;
                            }
                        }
                        setElementCache(element, 'valueString', { name, value });
                    }
                }
            }
        });
    }

    public setOptionArray() {
        this.cache.list.filter(node =>
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
}