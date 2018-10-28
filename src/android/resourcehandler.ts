import { SettingsAndroid } from './types/local';

import { BOX_ANDROID, FONT_ANDROID, FONTALIAS_ANDROID, FONTREPLACE_ANDROID, FONTWEIGHT_ANDROID, RESERVED_JAVA } from './lib/constant';

import SHAPE_TMPL from './template/resource/shape';
import LAYERLIST_TMPL from './template/resource/layer-list';
import VECTOR_TMPL from './template/resource/vector';

import View from './view';
import NodeList = androme.lib.base.NodeList;

import { generateId, parseRTL, replaceUnit } from './lib/util';

import $enum = androme.lib.enumeration;
import $util = androme.lib.util;
import $dom = androme.lib.dom;
import $xml = androme.lib.xml;
import $color = androme.lib.color;
import $resource = androme.lib.base.Resource;

type BackgroundImage = {
    src: string;
    top: string;
    right: string;
    bottom: string;
    left: string;
    gravity: string;
    tileMode: string;
    tileModeX: string;
    tileModeY: string;
    width: string;
    height: string;
};

type BackgroundGradient = {
    type: string;
    startColor: string;
    centerColor: string;
    endColor: string;
    angle: string;
    centerX: string;
    centerY: string;
    gradientRadius: string;
    useLevel: string;
};

type StyleList = ArrayObject<ObjectMap<number[]>>;

const FONT_STYLE = {
    'fontFamily': 'android:fontFamily="{0}"',
    'fontStyle': 'android:textStyle="{0}"',
    'fontWeight': 'android:fontWeight="{0}"',
    'fontSize': 'android:textSize="{0}"',
    'color': 'android:textColor="@color/{0}"',
    'backgroundColor': 'android:background="@color/{0}"'
};

function getStoredDrawable(xml: string) {
    for (const [name, value] of $resource.STORED.drawables.entries()) {
        if (value === xml) {
            return name;
        }
    }
    return '';
}

function getBorderStyle(border: BorderAttribute, direction = -1, halfSize = false): StringMap {
    const result = {
        solid: `android:color="@color/${border.color}"`,
        groove: '',
        ridge: ''
    };
    Object.assign(result, {
        double: result.solid,
        inset: result.solid,
        outset: result.solid,
        dotted: `${result.solid} android:dashWidth="3px" android:dashGap="1px"`,
        dashed: `${result.solid} android:dashWidth="1px" android:dashGap="1px"`
    });
    const groove = border.style === 'groove';
    if (parseInt(border.width) > 1 && (groove || border.style === 'ridge')) {
        let colorName = $util.isString(border.color) ? border.color : '';
        let hex = ResourceHandler.getColor(colorName);
        if (hex !== '') {
            let opacity = '1';
            if (hex.length === 9) {
                hex = `#${hex.substring(3)}`;
                opacity = `0.${parseInt(hex.substring(1, 3), 16)}`;
            }
            const reduced = $color.parseRGBA($color.reduceToRGB(hex, groove || hex === '#000000' ? 0.3 : -0.3));
            if (reduced.length > 0) {
                colorName = ResourceHandler.addColor(reduced[0], opacity);
            }
        }
        const colorReduced = `android:color="@color/${colorName}"`;
        if (groove) {
            if (halfSize) {
                switch (direction) {
                    case 0:
                        result.groove = colorReduced;
                        break;
                    case 1:
                        result.groove = colorReduced;
                        break;
                    case 2:
                        result.groove = result.solid;
                        break;
                    case 3:
                        result.groove = result.solid;
                        break;
                }
            }
            else {
                switch (direction) {
                    case 0:
                        result.groove = result.solid;
                        break;
                    case 1:
                        result.groove = result.solid;
                        break;
                    case 2:
                        result.groove = colorReduced;
                        break;
                    case 3:
                        result.groove = colorReduced;
                        break;
                }
            }
        }
        else {
            if (halfSize) {
                switch (direction) {
                    case 0:
                        result.ridge = result.solid;
                        break;
                    case 1:
                        result.ridge = result.solid;
                        break;
                    case 2:
                        result.ridge = colorReduced;
                        break;
                    case 3:
                        result.ridge = colorReduced;
                        break;
                }
            }
            else {
                switch (direction) {
                    case 0:
                        result.ridge = colorReduced;
                        break;
                    case 1:
                        result.ridge = colorReduced;
                        break;
                    case 2:
                        result.ridge = result.solid;
                        break;
                    case 3:
                        result.ridge = result.solid;
                        break;
                }
            }
        }
    }
    return result[border.style] || result.solid;
}

export default class ResourceHandler<T extends View> extends androme.lib.base.Resource<T> {
    public static formatOptions(options: {}, settings: SettingsAndroid) {
        for (const namespace in options) {
            const obj: StringMap = options[namespace];
            if (typeof obj === 'object') {
                for (const attr in obj) {
                    if (obj[attr] != null) {
                        let value = obj[attr].toString();
                        switch (namespace) {
                            case 'android':
                                switch (attr) {
                                    case 'text':
                                        if (!value.startsWith('@string/')) {
                                            value = this.addString(value, '', settings);
                                            if (value !== '') {
                                                obj[attr] = `@string/${value}`;
                                                continue;
                                            }
                                        }
                                        break;
                                    case 'src':
                                        if (/^\w+:\/\//.test(value)) {
                                            value = this.addImage({ mdpi: value });
                                            if (value !== '') {
                                                obj[attr] = `@drawable/${value}`;
                                                continue;
                                            }
                                        }
                                        break;
                                }
                                break;
                        }
                        const hex = $color.parseHex(value);
                        if (hex !== '') {
                            obj[attr] = `@color/${this.addColor(hex)}`;
                        }
                    }
                }
            }
        }
        return options;
    }

    public static addString(value: string, name = '', { numberResourceValue = false }) {
        if (value !== '') {
            if (name === '') {
                name = value;
            }
            const numeric = $util.isNumber(value);
            if (numberResourceValue || !numeric) {
                for (const [resourceName, resourceValue] of $resource.STORED.strings.entries()) {
                    if (resourceValue === value) {
                        return resourceName;
                    }
                }
                name = name.trim()
                    .toLowerCase()
                    .replace(/[^a-z\d]/g, '_')
                    .replace(/_+/g, '_')
                    .split('_')
                    .slice(0, 4)
                    .join('_')
                    .replace(/_+$/g, '');
                if (numeric || /^\d/.test(name) || RESERVED_JAVA.includes(name)) {
                    name = `__${name}`;
                }
                else if (name === '') {
                    name = `__symbol${Math.ceil(Math.random() * 100000)}`;
                }
                if ($resource.STORED.strings.has(name)) {
                    name = generateId('strings', name, 1);
                }
                $resource.STORED.strings.set(name, value);
            }
            return name;
        }
        return '';
    }

    public static addImageSrcSet(element: HTMLImageElement, prefix = '') {
        const images: StringMap = {};
        const srcset = element.srcset.trim();
        if (srcset !== '') {
            const filepath = element.src.substring(0, element.src.lastIndexOf('/') + 1);
            srcset.split(',').forEach(value => {
                const match = /^(.*?)\s*(\d+\.?\d*x)?$/.exec(value.trim());
                if (match) {
                    if (match[2] == null) {
                        match[2] = '1x';
                    }
                    const src = filepath + $util.lastIndexOf(match[1]);
                    switch (match[2]) {
                        case '0.75x':
                            images.ldpi = src;
                            break;
                        case '1x':
                            images.mdpi = src;
                            break;
                        case '1.5x':
                            images.hdpi = src;
                            break;
                        case '2x':
                            images.xhdpi = src;
                            break;
                        case '3x':
                            images.xxhdpi = src;
                            break;
                        case '4x':
                            images.xxxhdpi = src;
                            break;
                    }
                }
            });
        }
        if (images.mdpi == null) {
            images.mdpi = element.src;
        }
        return this.addImage(images, prefix);
    }

    public static addImage(images: StringMap, prefix = '') {
        let src = '';
        if (images && images.mdpi) {
            src = $util.lastIndexOf(images.mdpi);
            const format = $util.lastIndexOf(src, '.').toLowerCase();
            src = src.replace(/.\w+$/, '').replace(/-/g, '_');
            switch (format) {
                case 'bmp':
                case 'cur':
                case 'gif':
                case 'ico':
                case 'jpg':
                case 'png':
                    src = $resource.insertStoredAsset('images', prefix + src, images);
                    break;
                default:
                    src = '';
                    break;
            }
        }
        return src;
    }

    public static addImageURL(value: string, prefix = '') {
        const url = $dom.cssResolveUrl(value);
        if (url !== '') {
            return this.addImage({ mdpi: url }, prefix);
        }
        return '';
    }

    public static addColor(value: string, opacity = '1') {
        value = value.toUpperCase().trim();
        if (value !== '') {
            const hex = parseFloat(opacity) < 1 ? `#${$color.convertToHex('255', parseFloat(opacity)) + value.substring(1)}` : value;
            if (hex !== '#00000000') {
                let colorName = $resource.STORED.colors.get(hex) || '';
                if (colorName === '') {
                    const color = $color.getColorNearest(value);
                    if (color) {
                        color.name = $util.camelToLowerCase(color.name);
                        if (hex === color.hex) {
                            colorName = color.name;
                        }
                        else {
                            colorName = generateId('color', color.name, 1);
                        }
                        $resource.STORED.colors.set(hex, colorName);
                    }
                }
                return colorName;
            }
        }
        return '';
    }

    public static getColor(value: string) {
        for (const [hex, name] of $resource.STORED.colors.entries()) {
            if (name === value) {
                return hex;
            }
        }
        return '';
    }

    public settings: SettingsAndroid;

    private _tagStyle: ObjectMap<StyleList> = {};
    private _tagCount: ObjectMap<number> = {};

    public reset() {
        super.reset();
        this.file.reset();
        this._tagStyle = {};
        this._tagCount = {};
    }

    public finalize(viewData: ViewData<NodeList<T>>) {
        const styles: ObjectMap<string[]> = {};
        this.processFontStyle(viewData);
        this.processDimensions(viewData);
        viewData.cache.each(node => {
            const children = node.renderChildren.filter(item => item.visible && item.auto);
            if (children.length > 1) {
                const map = new Map<string, number>();
                let style = '';
                let valid = true;
                for (let i = 0; i < children.length; i++) {
                    let found = false;
                    children[i].combine('_', 'android').some(value => {
                        if (value.startsWith('style=')) {
                            if (i === 0) {
                                style = value;
                            }
                            else {
                                if (style === '' || value !== style) {
                                    valid = false;
                                    return true;
                                }
                            }
                            found = true;
                        }
                        else {
                            if (!map.has(value)) {
                                map.set(value, 0);
                            }
                            map.set(value, (map.get(value) as number) + 1);
                        }
                        return false;
                    });
                    if (!valid || (style !== '' && !found)) {
                        valid = false;
                        break;
                    }
                }
                if (valid) {
                    for (const [attr, value] of map.entries()) {
                        if (value !== children.length) {
                            map.delete(attr);
                        }
                    }
                    if (map.size > 1) {
                        if (style !== '') {
                            style = $util.trimString(style.substring(style.indexOf('/') + 1), '"');
                        }
                        const common: string[] = [];
                        for (const attr of map.keys()) {
                            const match = attr.match(/(\w+):(\w+)="(.*?)"/);
                            if (match) {
                                children.forEach(item => item.delete(match[1], match[2]));
                                common.push(match[0]);
                            }
                        }
                        common.sort();
                        let name = '';
                        for (const index in styles) {
                            if (styles[index].join(';') === common.join(';')) {
                                name = index;
                                break;
                            }
                        }
                        if (!(name !== '' && style !== '' && name.startsWith(`${style}.`))) {
                            name = $util.convertCamelCase((style !== '' ? `${style}.` : '') + $util.capitalize(node.nodeId), '_');
                            styles[name] = common;
                        }
                        children.forEach(item => item.attr('_', 'style', `@style/${name}`));
                    }
                }
            }
        });
        for (const name in styles) {
            $resource.STORED.styles.set(name, {
                name,
                attrs: styles[name].join(';'),
                ids: []
            });
        }
    }

    public setBoxSpacing() {
        super.setBoxSpacing();
        this.cache.elements.forEach(node => {
            const stored: StringMap = $dom.getElementCache(node.element, 'boxSpacing');
            if (stored && !node.hasBit('excludeResource', $enum.NODE_RESOURCE.BOX_SPACING)) {
                if (stored.marginLeft === stored.marginRight &&
                    node.alignParent('left', this.settings) &&
                    node.alignParent('right', this.settings) &&
                    !node.blockWidth &&
                    !(node.position === 'relative' && node.alignNegative))
                {
                    node.modifyBox($enum.BOX_STANDARD.MARGIN_LEFT, null);
                    node.modifyBox($enum.BOX_STANDARD.MARGIN_RIGHT, null);
                }
                if (node.css('marginLeft') === 'auto') {
                    node.modifyBox($enum.BOX_STANDARD.MARGIN_LEFT, null);
                }
                if (node.css('marginRight') === 'auto') {
                    node.modifyBox($enum.BOX_STANDARD.MARGIN_RIGHT, null);
                }
            }
        });
    }

    public setBoxStyle() {
        super.setBoxStyle();
        this.cache.elements.forEach(node => {
            const stored: BoxStyle = $dom.getElementCache(node.element, 'boxStyle');
            if (stored && !node.hasBit('excludeResource', $enum.NODE_RESOURCE.BOX_STYLE)) {
                function checkPartialBackgroundPosition(current: string, adjacent: string, defaultPosition: string) {
                    if (current.indexOf(' ') === -1 && adjacent.indexOf(' ') !== -1) {
                        if (/^[a-z]+$/.test(current)) {
                            return `${current === 'initial' ? defaultPosition : current} 0px`;
                        }
                        else {
                            return `${defaultPosition} ${current}`;
                        }
                    }
                    return current;
                }
                if (stored.backgroundColor.length > 0) {
                    stored.backgroundColor = ResourceHandler.addColor(stored.backgroundColor[0], stored.backgroundColor[2]);
                }
                const backgroundImage: string[] = [];
                const backgroundRepeat = stored.backgroundRepeat.split(',').map(value => value.trim());
                const backgroundDimensions: Null<Image>[] = [];
                const backgroundGradient: BackgroundGradient[] = [];
                const backgroundPositionX = stored.backgroundPositionX.split(',').map(value => value.trim());
                const backgroundPositionY = stored.backgroundPositionY.split(',').map(value => value.trim());
                const backgroundPosition: string[] = [];
                if (Array.isArray(stored.backgroundImage)) {
                    if (!node.hasBit('excludeResource', $enum.NODE_RESOURCE.IMAGE_SOURCE)) {
                        backgroundImage.push(...stored.backgroundImage);
                        for (let i = 0; i < backgroundImage.length; i++) {
                            if (backgroundImage[i] && backgroundImage[i] !== 'none') {
                                backgroundDimensions.push(this.imageDimensions.get($dom.cssResolveUrl(backgroundImage[i])));
                                backgroundImage[i] = ResourceHandler.addImageURL(backgroundImage[i]);
                                const postionX = backgroundPositionX[i] || backgroundPositionX[i - 1];
                                const postionY = backgroundPositionY[i] || backgroundPositionY[i - 1];
                                const x = checkPartialBackgroundPosition(postionX, postionY, 'left');
                                const y = checkPartialBackgroundPosition(postionY, postionX, 'top');
                                backgroundPosition[i] = `${x === 'initial' ? '0px' : x} ${y === 'initial' ? '0px' : y}`;
                            }
                            else {
                                backgroundImage[i] = '';
                                backgroundRepeat[i] = '';
                                backgroundPosition[i] = '';
                            }
                        }
                    }
                }
                else if (stored.backgroundGradient) {
                    for (let i = 0; i < stored.backgroundGradient.length; i++) {
                        const shape = stored.backgroundGradient[i];
                        const gradient: BackgroundGradient = {
                            type: shape.type,
                            startColor: shape.startColor.length > 0 ? ResourceHandler.addColor(shape.startColor[0], shape.startColor[2]) : '',
                            centerColor: '',
                            endColor: shape.endColor.length > 0 ? ResourceHandler.addColor(shape.endColor[0], shape.endColor[2]) : '',
                            angle: '',
                            centerX: '',
                            centerY: '',
                            gradientRadius: '',
                            useLevel: ''
                        };
                        switch (gradient.type) {
                            case 'radial':
                                const radial = <GradientRadial> shape;
                                const boxPosition: Null<BoxPosition> = radial.shapePosition.length > 1 ? $resource.parseBackgroundPosition(radial.shapePosition[1], node.bounds, node.css('fontSize'), true) : null;
                                if (radial.centerColor.length > 0) {
                                    gradient.centerColor = ResourceHandler.addColor(radial.centerColor[0], radial.centerColor[2]);
                                }
                                gradient.gradientRadius = $util.formatPX(node.bounds.width);
                                if (boxPosition) {
                                    if (boxPosition.horizontal === 'right') {
                                        gradient.centerX = `${100 - boxPosition.right}%`;
                                    }
                                    else {
                                        gradient.centerX = `${boxPosition.left}%`;
                                    }
                                    if (boxPosition.vertical === 'bottom') {
                                        gradient.centerY = `${100 - boxPosition.bottom}%`;
                                    }
                                    else {
                                        gradient.centerY = `${boxPosition.top}%`;
                                    }
                                }
                                break;
                            case 'linear':
                                const linear = <GradientLinear> shape;
                                gradient.angle = (Math.floor(linear.angle / 45) * 45).toString();
                                break;
                        }
                        backgroundGradient.push(gradient);
                    }
                }
                const companion = node.companion;
                if (companion &&
                    companion.htmlElement &&
                    !companion.visible &&
                    !$dom.cssFromParent(companion.element, 'backgroundColor'))
                {
                    const boxStyle: BoxStyle = $dom.getElementCache(companion.element, 'boxStyle');
                    if (boxStyle.backgroundColor.length > 0) {
                        stored.backgroundColor = ResourceHandler.addColor(boxStyle.backgroundColor[0], boxStyle.backgroundColor[2]);
                    }
                }
                const hasBorder = (
                    $resource.isBorderVisible(stored.borderTop) ||
                    $resource.isBorderVisible(stored.borderRight) ||
                    $resource.isBorderVisible(stored.borderBottom) ||
                    $resource.isBorderVisible(stored.borderLeft) ||
                    stored.borderRadius.length > 0
                );
                const hasBackgroundImage = backgroundImage.filter(value => value !== '').length > 0;
                if (hasBorder || hasBackgroundImage || backgroundGradient.length > 0) {
                    function getShapeAttribute(boxStyle: BoxStyle, name: string, direction = -1, hasInset = false, isInset = false): any[] | boolean {
                        switch (name) {
                            case 'stroke':
                                if (boxStyle.border && $resource.isBorderVisible(boxStyle.border)) {
                                    if (!hasInset || isInset) {
                                        return [{
                                            width: boxStyle.border.width,
                                            borderStyle: getBorderStyle(boxStyle.border, isInset ? direction : -1)
                                        }];
                                    }
                                    else if (hasInset) {
                                        return [{
                                            width: $util.formatPX(Math.ceil(parseInt(boxStyle.border.width) / 2)),
                                            borderStyle: getBorderStyle(boxStyle.border, direction, true)
                                        }];
                                    }
                                }
                                return false;
                            case 'backgroundColor':
                                return boxStyle.backgroundColor.length !== 0 && boxStyle.backgroundColor !== '' ? [{ color: boxStyle.backgroundColor }] : false;
                            case 'radius':
                                if (boxStyle.borderRadius.length === 1) {
                                    if (boxStyle.borderRadius[0] !== '0px') {
                                        return [{ radius: boxStyle.borderRadius[0] }];
                                    }
                                }
                                else if (boxStyle.borderRadius.length > 1) {
                                    const result = {};
                                    boxStyle.borderRadius.forEach((value, index) => result[`${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius`] = value);
                                    return [result];
                                }
                                return false;

                        }
                        return false;
                    }
                    const borders: BorderAttribute[] = [
                        stored.borderTop,
                        stored.borderRight,
                        stored.borderBottom,
                        stored.borderLeft
                    ];
                    borders.forEach((item: BorderAttribute) => {
                        if ($resource.isBorderVisible(item) && item.color.length > 0) {
                            item.color = ResourceHandler.addColor(item.color[0], item.color[2]);
                        }
                    });
                    const image2: BackgroundImage[] = [];
                    const image3: BackgroundImage[] = [];
                    let data: {};
                    let resourceName = '';
                    for (let i = 0; i < backgroundImage.length; i++) {
                        if (backgroundImage[i] !== '') {
                            const boxPosition = $resource.parseBackgroundPosition(backgroundPosition[i], node.bounds, node.css('fontSize'));
                            const image = backgroundDimensions[i];
                            let gravity = (() => {
                                if (boxPosition.horizontal === 'center' && boxPosition.vertical === 'center') {
                                    return 'center';
                                }
                                return `${boxPosition.horizontal === 'center' ? 'center_horizontal' : boxPosition.horizontal}|${boxPosition.vertical === 'center' ? 'center_vertical' : boxPosition.vertical}`;
                            })();
                            let tileMode = '';
                            let tileModeX = '';
                            let tileModeY = '';
                            const imageRepeat = image == null || image.width < node.bounds.width || image.height < node.bounds.height;
                            switch (backgroundRepeat[i]) {
                                case 'repeat-x':
                                    if (imageRepeat) {
                                        tileModeX = 'repeat';
                                    }
                                    break;
                                case 'repeat-y':
                                    if (imageRepeat) {
                                        tileModeY = 'repeat';
                                    }
                                    break;
                                case 'no-repeat':
                                    tileMode = 'disabled';
                                    break;
                                case 'repeat':
                                    if (imageRepeat) {
                                        tileMode = 'repeat';
                                    }
                                    break;
                            }
                            if (gravity !== '' && image && image.width > 0 && image.height > 0 && node.renderChildren.length === 0) {
                                if (tileModeY === 'repeat') {
                                    let backgroundWidth = node.viewWidth;
                                    if (backgroundWidth > 0) {
                                        if (this.settings.autoSizePaddingAndBorderWidth && !node.hasBit('excludeResource', $enum.NODE_RESOURCE.BOX_SPACING)) {
                                            backgroundWidth = node.viewWidth + node.paddingLeft + node.paddingRight;
                                        }
                                    }
                                    else {
                                        backgroundWidth = node.bounds.width - (node.borderLeftWidth + node.borderRightWidth);
                                    }
                                    if (image.width < backgroundWidth) {
                                        const layoutWidth = $util.convertInt(node.android('layout_width'));
                                        if (gravity.indexOf('left') !== -1) {
                                            boxPosition.right = backgroundWidth - image.width;
                                            if (node.viewWidth === 0 && backgroundWidth > layoutWidth) {
                                                node.android('layout_width', $util.formatPX(node.bounds.width));
                                            }
                                        }
                                        else if (gravity.indexOf('right') !== -1) {
                                            boxPosition.left = backgroundWidth - image.width;
                                            if (node.viewWidth === 0 && backgroundWidth > layoutWidth) {
                                                node.android('layout_width', $util.formatPX(node.bounds.width));
                                            }
                                        }
                                        else if (gravity === 'center' || gravity.indexOf('center_horizontal') !== -1) {
                                            boxPosition.right = Math.floor((backgroundWidth - image.width) / 2);
                                            if (node.viewWidth === 0 && backgroundWidth > layoutWidth) {
                                                node.android('layout_width', $util.formatPX(node.bounds.width));
                                            }
                                        }
                                    }
                                }
                                if (tileModeX === 'repeat') {
                                    let backgroundHeight = node.viewHeight;
                                    if (backgroundHeight > 0) {
                                        if (this.settings.autoSizePaddingAndBorderWidth && !node.hasBit('excludeResource', $enum.NODE_RESOURCE.BOX_SPACING)) {
                                            backgroundHeight = node.viewHeight + node.paddingTop + node.paddingBottom;
                                        }
                                    }
                                    else {
                                        backgroundHeight = node.bounds.height - (node.borderTopWidth + node.borderBottomWidth);
                                    }
                                    if (image.height < backgroundHeight) {
                                        const layoutHeight = $util.convertInt(node.android('layout_height'));
                                        if (gravity.indexOf('top') !== -1) {
                                            boxPosition.bottom = backgroundHeight - image.height;
                                            if (node.viewHeight === 0 && backgroundHeight > layoutHeight) {
                                                node.android('layout_height', $util.formatPX(node.bounds.height));
                                            }
                                        }
                                        else if (gravity.indexOf('bottom') !== -1) {
                                            boxPosition.top = backgroundHeight - image.height;
                                            if (node.viewHeight === 0 && backgroundHeight > layoutHeight) {
                                                node.android('layout_height', $util.formatPX(node.bounds.height));
                                            }
                                        }
                                        else if (gravity === 'center' || gravity.indexOf('center_vertical') !== -1) {
                                            boxPosition.bottom = Math.floor((backgroundHeight - image.height) / 2);
                                            if (node.viewHeight === 0 && backgroundHeight > layoutHeight) {
                                                node.android('layout_height', $util.formatPX(node.bounds.height));
                                            }
                                        }
                                    }
                                }
                            }
                            if (stored.backgroundSize.length > 0 && ($util.isPercent(stored.backgroundSize[0]) || $util.isPercent(stored.backgroundSize[1]))) {
                                if (stored.backgroundSize[0] === '100%' && stored.backgroundSize[1] === '100%') {
                                    tileMode = '';
                                    tileModeX = '';
                                    tileModeY = '';
                                    gravity = '';
                                }
                                else if (stored.backgroundSize[0] === '100%') {
                                    tileModeX = '';
                                }
                                else if (stored.backgroundSize[1] === '100%') {
                                    tileModeY = '';
                                }
                                stored.backgroundSize = [];
                            }
                            if (hasBackgroundImage) {
                                if (node.of($enum.NODE_STANDARD.IMAGE, $enum.NODE_ALIGNMENT.SINGLE) && backgroundPosition.length === 1) {
                                    node.android('src', `@drawable/${backgroundImage[0]}`);
                                    if (boxPosition.left > 0) {
                                        node.modifyBox($enum.BOX_STANDARD.MARGIN_LEFT, boxPosition.left);
                                    }
                                    if (boxPosition.top > 0) {
                                        node.modifyBox($enum.BOX_STANDARD.MARGIN_TOP, boxPosition.top);
                                    }
                                    let scaleType = '';
                                    switch (gravity) {
                                        case 'left|top':
                                        case 'left|center_vertical':
                                        case 'left|bottom':
                                            scaleType = 'fitStart';
                                            break;
                                        case 'right|top':
                                        case 'right|center_vertical':
                                        case 'right|bottom':
                                            scaleType = 'fitEnd';
                                            break;
                                        case 'center':
                                        case 'center_horizontal|top':
                                        case 'center_horizontal|bottom':
                                            scaleType = 'center';
                                            break;
                                    }
                                    node.android('scaleType', scaleType);
                                    if (!hasBorder) {
                                        return;
                                    }
                                    backgroundImage.length = 0;
                                }
                                else {
                                    if (gravity === 'left|top') {
                                        gravity = '';
                                    }
                                    const imageXml: BackgroundImage = {
                                        top: boxPosition.top !== 0 ? $util.formatPX(boxPosition.top) : '',
                                        right: boxPosition.right !== 0 ? $util.formatPX(boxPosition.right) : '',
                                        bottom: boxPosition.bottom !== 0 ? $util.formatPX(boxPosition.bottom) : '',
                                        left: boxPosition.left !== 0 ? $util.formatPX(boxPosition.left) : '',
                                        gravity,
                                        tileMode,
                                        tileModeX,
                                        tileModeY,
                                        width: '',
                                        height: '',
                                        src: backgroundImage[i]
                                    };
                                    if (gravity !== '' || tileMode !== '' || tileModeX !== '' || tileModeY !== '') {
                                        image3.push(imageXml);
                                    }
                                    else {
                                        if (stored.backgroundSize.length > 0) {
                                            imageXml.width = stored.backgroundSize[0];
                                            imageXml.height = stored.backgroundSize[1];
                                        }
                                        image2.push(imageXml);
                                    }
                                }
                            }
                        }
                    }
                    image3.sort((a, b) => {
                        if (!(a.tileModeX === 'repeat' || a.tileModeY === 'repeat' || a.tileMode === 'repeat')) {
                            return 1;
                        }
                        else if (!(b.tileModeX === 'repeat' || b.tileModeY === 'repeat' || b.tileMode === 'repeat')) {
                            return -1;
                        }
                        else {
                            if (a.tileMode === 'repeat') {
                                return -1;
                            }
                            else if (b.tileMode === 'repeat') {
                                return 1;
                            }
                            else {
                                return b.tileModeX === 'repeat' || b.tileModeY === 'repeat' ? 1 : -1;
                            }
                        }
                    });
                    const backgroundColor = getShapeAttribute(stored, 'backgroundColor');
                    const borderRadius = getShapeAttribute(stored, 'radius');
                    let template: ObjectMap<string>;
                    if (stored.border && !(
                            (parseInt(stored.border.width) > 1 && (stored.border.style === 'groove' || stored.border.style === 'ridge')) ||
                            (parseInt(stored.border.width) > 2 && stored.border.style === 'double')
                       ))
                    {
                        if (!hasBackgroundImage && backgroundGradient.length <= 1) {
                            if (borderRadius && borderRadius[0]['radius'] == null) {
                                borderRadius[0]['radius'] = '1px';
                            }
                            template = $xml.parseTemplate(SHAPE_TMPL);
                            data = {
                                '0': [{
                                    '1': getShapeAttribute(stored, 'stroke'),
                                    '2': backgroundColor,
                                    '3': borderRadius,
                                    '4': backgroundGradient.length > 0 ? backgroundGradient : false
                                }]
                            };
                        }
                        else {
                            template = $xml.parseTemplate(LAYERLIST_TMPL);
                            data = {
                                '0': [{
                                    '1': backgroundColor,
                                    '2': backgroundGradient.length > 0 ? backgroundGradient : false,
                                    '3': image2.length > 0 ? image2 : false,
                                    '4': image3.length > 0 ? image3 : false,
                                    '5': $resource.isBorderVisible(stored.border) || borderRadius ? [{ '6': getShapeAttribute(stored, 'stroke'), '7': borderRadius }] : false,
                                    '8': false
                                }]
                            };
                        }
                    }
                    else {
                        function getHideWidth(value: number) {
                            switch (value) {
                                case 1:
                                    return value + 1;
                                default:
                                    return value + 2;
                            }
                        }
                        template = $xml.parseTemplate(LAYERLIST_TMPL);
                        data = {
                            '0': [{
                                '1': backgroundColor,
                                '2': backgroundGradient.length > 0 ? backgroundGradient : false,
                                '3': image2.length > 0 ? image2 : false,
                                '4': image3.length > 0 ? image3 : false,
                                '5': [],
                                '8': []
                            }]
                        };
                        const root = $xml.getTemplateBranch(data, '0');
                        const borderVisible = borders.filter(item => $resource.isBorderVisible(item));
                        const borderWidth = new Set(borderVisible.map(item => item.width));
                        const borderStyle = new Set(borderVisible.map(item => getBorderStyle(item)));
                        const borderData = borderVisible[0];
                        function createDoubleBorder(border: BorderAttribute, top: boolean, right: boolean, bottom: boolean, left: boolean) {
                            const width = parseInt(border.width);
                            const baseWidth = Math.floor(width / 3);
                            const remainder = width % 3;
                            const offset = remainder === 2 ? 1 : 0;
                            const leftWidth = baseWidth + offset;
                            const rightWidth = baseWidth + offset;
                            const indentWidth = `${$util.formatPX(width - baseWidth)}`;
                            const hideWidth = `-${indentWidth}`;
                            root['5'].push({
                                'top': top ? '' : hideWidth,
                                'right': right ? '' : hideWidth,
                                'bottom': bottom ? '' : hideWidth,
                                'left': left ? '' :  hideWidth,
                                '6': [{ width: $util.formatPX(leftWidth), borderStyle: getBorderStyle(border) }],
                                '7': borderRadius
                            });
                            root['5'].push({
                                'top': top ? indentWidth : hideWidth,
                                'right': right ? indentWidth : hideWidth,
                                'bottom': bottom ? indentWidth : hideWidth,
                                'left': left ? indentWidth : hideWidth,
                                '6': [{ width: $util.formatPX(rightWidth), borderStyle: getBorderStyle(border) }],
                                '7': borderRadius
                            });
                        }
                        if (borderWidth.size === 1 && borderStyle.size === 1 && !(borderData.style === 'groove' || borderData.style === 'ridge')) {
                            const width = parseInt(borderData.width);
                            if (width > 2 && borderData.style === 'double') {
                                createDoubleBorder.apply(null, [
                                    borderData,
                                    $resource.isBorderVisible(stored.borderTop),
                                    $resource.isBorderVisible(stored.borderRight),
                                    $resource.isBorderVisible(stored.borderBottom),
                                    $resource.isBorderVisible(stored.borderLeft)
                                ]);
                            }
                            else {
                                const hideWidth = `-${$util.formatPX(getHideWidth(width))}`;
                                const topVisible = $resource.isBorderVisible(stored.borderTop);
                                root['5'].push({
                                    'top': topVisible ? '' : hideWidth,
                                    'right': $resource.isBorderVisible(stored.borderRight) ? '' : hideWidth,
                                    'bottom': $resource.isBorderVisible(stored.borderBottom) ? (topVisible ? '' : borderVisible[0].width) : hideWidth,
                                    'left': $resource.isBorderVisible(stored.borderLeft) ? '' : hideWidth,
                                    '6': getShapeAttribute(<BoxStyle> { border: borderVisible[0] }, 'stroke'),
                                    '7': borderRadius
                                });
                            }
                        }
                        else {
                            let topVisible = false;
                            for (let i = 0; i < borders.length; i++) {
                                const border = borders[i];
                                if ($resource.isBorderVisible(border)) {
                                    if (i === 0) {
                                        topVisible = true;
                                    }
                                    const width = parseInt(border.width);
                                    if (width > 2 && border.style === 'double') {
                                        createDoubleBorder.apply(null, [
                                            border,
                                            i === 0,
                                            i === 1,
                                            i === 2,
                                            i === 3
                                        ]);
                                    }
                                    else {
                                        const hasInset = width > 1 && (border.style === 'groove' || border.style === 'ridge');
                                        const outsetWidth = hasInset ? Math.ceil(width / 2) : width;
                                        let hideWidth = `-${$util.formatPX(getHideWidth(outsetWidth))}`;
                                        root['5'].push({
                                            'top':  i === 0 ? '' : hideWidth,
                                            'right': i === 1 ? '' : hideWidth,
                                            'bottom': i === 2 ? (topVisible ? '' : border.width) : hideWidth,
                                            'left': i === 3 ? '' : hideWidth,
                                            '6': getShapeAttribute(<BoxStyle> { border }, 'stroke', i, hasInset),
                                            '7': borderRadius
                                        });
                                        if (hasInset) {
                                            hideWidth = `-${$util.formatPX(getHideWidth(width))}`;
                                            root['8'].push({
                                                'top':  i === 0 ? '' : hideWidth,
                                                'right': i === 1 ? '' : hideWidth,
                                                'bottom': i === 2 ? (topVisible ? '' : border.width) : hideWidth,
                                                'left': i === 3 ? '' : hideWidth,
                                                '9': getShapeAttribute(<BoxStyle> { border }, 'stroke', i, true, true)
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (template) {
                        const xml = $xml.createTemplate(template, data);
                        resourceName = getStoredDrawable(xml);
                        if (resourceName === '') {
                            resourceName = `${node.nodeName.toLowerCase()}_${node.nodeId}`;
                            $resource.STORED.drawables.set(resourceName, xml);
                        }
                    }
                    node.android('background', `@drawable/${resourceName}`, node.renderExtension.size === 0);
                    if (hasBackgroundImage) {
                        node.data('RESOURCE', 'backgroundImage', true);
                        if (this.settings.autoSizeBackgroundImage &&
                            !node.documentRoot &&
                            !node.imageOrSvgElement &&
                            node.renderParent.tagName !== 'TABLE' &&
                            !node.hasBit('excludeProcedure', $enum.NODE_PROCEDURE.AUTOFIT))
                        {
                            const sizeParent: Image = { width: 0, height: 0 };
                            backgroundDimensions.forEach(item => {
                                if (item) {
                                    sizeParent.width = Math.max(sizeParent.width, item.width);
                                    sizeParent.height = Math.max(sizeParent.height, item.height);
                                }
                            });
                            if (sizeParent.width === 0) {
                                let current = node;
                                while (current && !current.documentBody) {
                                    if (current.hasWidth) {
                                        sizeParent.width = current.bounds.width;
                                    }
                                    if (current.hasHeight) {
                                        sizeParent.height = current.bounds.height;
                                    }
                                    if (!current.pageflow || (sizeParent.width > 0 && sizeParent.height > 0)) {
                                        break;
                                    }
                                    current = current.documentParent as T;
                                }
                            }
                            if (!node.has('width', $enum.CSS_STANDARD.UNIT)) {
                                const width = node.bounds.width + (!node.is($enum.NODE_STANDARD.LINE) ? node.borderLeftWidth + node.borderRightWidth : 0);
                                if (sizeParent.width === 0 || (width > 0 && width < sizeParent.width)) {
                                    node.css('width', $util.formatPX(width));
                                }
                            }
                            if (!node.has('height', $enum.CSS_STANDARD.UNIT)) {
                                const height = node.actualHeight + (!node.is($enum.NODE_STANDARD.LINE) ? node.borderTopWidth + node.borderBottomWidth : 0);
                                if (sizeParent.height === 0 || (height > 0 && height < sizeParent.height)) {
                                    node.css('height', $util.formatPX(height));
                                    if (node.marginTop < 0) {
                                        node.modifyBox($enum.BOX_STANDARD.MARGIN_TOP, null);
                                    }
                                    if (node.marginBottom < 0) {
                                        node.modifyBox($enum.BOX_STANDARD.MARGIN_BOTTOM, null);
                                    }
                                }
                            }
                        }
                    }
                }
                else if (!$dom.getElementCache(node.element, 'fontStyle') && $util.isString(stored.backgroundColor)) {
                    node.formatted($util.formatString(FONT_STYLE.backgroundColor, stored.backgroundColor), node.renderExtension.size === 0);
                }
            }
        });
    }

    public setFontStyle() {
        super.setFontStyle();
        const nodeName: ObjectMap<T[]> = {};
        this.cache.visible.forEach(node => {
            if (!node.hasBit('excludeResource', $enum.NODE_RESOURCE.FONT_STYLE)) {
                if ($dom.getElementCache(node.element, 'fontStyle')) {
                    if (nodeName[node.nodeName] == null) {
                        nodeName[node.nodeName] = [];
                    }
                    nodeName[node.nodeName].push(node);
                }
                const textShadow = node.css('textShadow');
                if (textShadow !== 'none') {
                    [
                        /^(rgb(?:a)?\(\d+, \d+, \d+(?:, [\d.]+)?\)) ([\d.]+[a-z]+) ([\d.]+[a-z]+) ([\d.]+[a-z]+)$/,
                        /^([\d.]+[a-z]+) ([\d.]+[a-z]+) ([\d.]+[a-z]+) (.+)$/
                    ]
                    .some((value, index) => {
                        const match = textShadow.match(value);
                        if (match) {
                            const color = $color.parseRGBA(match[index === 0 ? 1 : 4]);
                            if (color.length > 0) {
                                node.android('shadowColor', `@color/${ResourceHandler.addColor(color[0], color[2])}`);
                            }
                            node.android('shadowDx', $util.convertInt(match[index === 0 ? 2 : 1]).toString());
                            node.android('shadowDy', $util.convertInt(match[index === 0 ? 3 : 2]).toString());
                            node.android('shadowRadius', $util.convertInt(match[index === 0 ? 4 : 3]).toString());
                            return true;
                        }
                        return false;
                    });
                }
            }
        });
        for (const tag in nodeName) {
            const sorted: StyleList = [];
            const nodes = new NodeList(nodeName[tag]);
            nodes.each(node => {
                const nodeId = node.id;
                const companion = node.companion;
                let system = false;
                if (companion && !companion.visible && (companion.textElement || companion.tagName === 'LABEL')) {
                    node = companion as T;
                }
                const element = node.element;
                const stored: FontAttribute = Object.assign({}, $dom.getElementCache(element, 'fontStyle'));
                if (stored.backgroundColor.length > 0) {
                    stored.backgroundColor = ResourceHandler.addColor(stored.backgroundColor[0], stored.backgroundColor[2]);
                }
                if (stored.fontFamily) {
                    let fontFamily = stored.fontFamily.split(',')[0]
                        .replace(/"/g, '')
                        .toLowerCase()
                        .trim();
                    let fontStyle = '';
                    let fontWeight = '';
                    if (stored.color.length > 0) {
                        stored.color = ResourceHandler.addColor(stored.color[0], stored.color[2]);
                    }
                    if (this.settings.fontAliasResourceValue && FONTREPLACE_ANDROID[fontFamily]) {
                        fontFamily = FONTREPLACE_ANDROID[fontFamily];
                    }
                    if ((FONT_ANDROID[fontFamily] && this.settings.targetAPI >= FONT_ANDROID[fontFamily]) ||
                        (this.settings.fontAliasResourceValue && FONTALIAS_ANDROID[fontFamily] && this.settings.targetAPI >= FONT_ANDROID[FONTALIAS_ANDROID[fontFamily]]))
                    {
                        system = true;
                        stored.fontFamily = fontFamily;
                        if (stored.fontStyle === 'normal') {
                            delete stored.fontStyle;
                        }
                        if (stored.fontWeight === '400') {
                            delete stored.fontWeight;
                        }
                    }
                    else {
                        fontFamily = $util.convertWord(fontFamily);
                        stored.fontFamily = `@font/${fontFamily + (stored.fontStyle !== 'normal' ? `_${stored.fontStyle}` : '') + (stored.fontWeight !== '400' ? `_${FONTWEIGHT_ANDROID[stored.fontWeight] || stored.fontWeight}` : '')}`;
                        fontStyle = stored.fontStyle;
                        fontWeight = stored.fontWeight;
                        delete stored.fontStyle;
                        delete stored.fontWeight;
                    }
                    if (!system) {
                        const fonts = $resource.STORED.fonts.get(fontFamily) || {};
                        fonts[`${fontStyle}-${fontWeight}`] = true;
                        $resource.STORED.fonts.set(fontFamily, fonts);
                    }
                }
                const keys = Object.keys(FONT_STYLE);
                for (let i = 0; i < keys.length; i++) {
                    if (sorted[i] == null) {
                        sorted[i] = {};
                    }
                    const value: string = stored[keys[i]];
                    if ($util.hasValue(value)) {
                        if (node.supported('android', keys[i])) {
                            const attr = $util.formatString(FONT_STYLE[keys[i]], value);
                            if (sorted[i][attr] == null) {
                                sorted[i][attr] = [];
                            }
                            sorted[i][attr].push(nodeId);
                        }
                    }
                }
            });
            const tagStyle = this._tagStyle[tag];
            if (tagStyle) {
                for (let i = 0; i < tagStyle.length; i++) {
                    for (const attr in tagStyle[i]) {
                        if (sorted[i][attr]) {
                            sorted[i][attr].push(...tagStyle[i][attr]);
                        }
                        else {
                            sorted[i][attr] = tagStyle[i][attr];
                        }
                    }
                }
                this._tagCount[tag] += nodes.visible.length;
            }
            else {
                this._tagCount[tag] = nodes.visible.length;
            }
            this._tagStyle[tag] = sorted;
        }
    }

    public setImageSource() {
        super.setImageSource();
        this.cache.visible.forEach(node => {
            let result = '';
            if (node.svgElement) {
                const stored: SVG = $dom.getElementCache(node.element, 'imageSource');
                if (stored) {
                    const data = {
                        '0': [{
                            width: $util.formatPX(stored.width),
                            height: $util.formatPX(stored.height),
                            viewportWidth: stored.viewBoxWidth > 0 ? stored.viewBoxWidth.toString() : false,
                            viewportHeight: stored.viewBoxHeight > 0 ? stored.viewBoxHeight.toString() : false,
                            alpha: stored.opacity < 1 ? stored.opacity : false,
                            '1': []
                        }]
                    };
                    const root = $xml.getTemplateBranch(data, '0');
                    stored.children.forEach(svg => {
                        const group: ObjectMap<any> = {
                            name: svg.name,
                            '2': [],
                            '3': []
                        };
                        if (!svg.nestedSVG) {
                            if (svg.scaleX !== 1) {
                                group.scaleX = svg.scaleX.toString();
                            }
                            if (svg.scaleY !== 1) {
                                group.scaleY = svg.scaleY.toString();
                            }
                            if (svg.rotation !== 0) {
                                group.rotation = svg.rotation.toString();
                            }
                            if (svg.skewX !== 1) {
                                group.pivotX = svg.skewX.toString();
                            }
                            if (svg.skewY !== 1) {
                                group.pivotY = svg.skewY.toString();
                            }
                            if (svg.translateX !== 0) {
                                group.translateX = svg.translateX.toString();
                            }
                            if (svg.translateY !== 0) {
                                group.translateY = svg.translateY.toString();
                            }
                        }
                        else {
                            if (svg.x && svg.x !== 0) {
                                group.translateX = svg.x.toString();
                            }
                            if (svg.y && svg.y !== 0) {
                                group.translateY = svg.y.toString();
                            }
                        }
                        svg.children.forEach(item => {
                            if (item.clipPath) {
                                group['2'].push({
                                    name: item.name,
                                    d: item.d
                                });
                            }
                            else {
                                group['3'].push(item);
                            }
                        });
                        root['1'].push(group);
                    });
                    const xml = $xml.createTemplate($xml.parseTemplate(VECTOR_TMPL), data);
                    result = getStoredDrawable(xml);
                    if (result === '') {
                        result = `${node.nodeName.toLowerCase()}_${node.nodeId}`;
                        $resource.STORED.drawables.set(result, xml);
                    }
                }
            }
            else {
                if ((node.imageElement || (node.tagName === 'INPUT' && (<HTMLInputElement> node.element).type === 'image')) &&
                    !node.hasBit('excludeResource', $enum.NODE_RESOURCE.IMAGE_SOURCE))
                {
                    const element = <HTMLImageElement> node.element;
                    result = node.imageElement ? ResourceHandler.addImageSrcSet(element) : ResourceHandler.addImage({ mdpi: element.src });
                }
            }
            if (result !== '') {
                node.android('src', `@drawable/${result}`, node.renderExtension.size === 0);
                $dom.setElementCache(node.element, 'imageSource', result);
            }
        });
    }

    public setValueString() {
        super.setValueString();
        this.cache.visible.forEach(node => {
            const stored: NameValue = $dom.getElementCache(node.element, 'valueString');
            if (stored) {
                if (node.renderParent.is($enum.NODE_STANDARD.RELATIVE)) {
                    if (node.alignParent('left', this.settings) && !$dom.cssParent(node.element, 'whiteSpace', 'pre', 'pre-wrap')) {
                        const value = node.textContent;
                        let leadingSpace = 0;
                        for (let i = 0; i < value.length; i++) {
                            switch (value.charCodeAt(i)) {
                                case 32:
                                    continue;
                                case 160:
                                    leadingSpace++;
                                    continue;
                            }
                            break;
                        }
                        if (leadingSpace === 0) {
                            stored.value = stored.value.replace(/^(\s|&#160;)+/, '');
                        }
                    }
                }
                if (node.htmlElement) {
                    switch (node.css('fontVariant')) {
                        case 'small-caps':
                            stored.value = stored.value.toUpperCase();
                            break;
                    }
                    const match = node.css('textDecoration').match(/(underline|line-through)/);
                    if (match) {
                        switch (match[0]) {
                            case 'underline':
                                stored.value = `<u>${stored.value}</u>`;
                                break;
                            case 'line-through':
                                stored.value = `<strike>${stored.value}</strike>`;
                                break;
                        }
                    }
                }
                const name = ResourceHandler.addString(stored.value, stored.name, this.settings);
                if (name !== '' && node.toInt('textIndent') + node.bounds.width > 0) {
                    node.android('text', isNaN(parseInt(name)) || parseInt(name).toString() !== name ? `@string/${name}` : name, node.renderExtension.size === 0);
                }
            }
        });
    }

    public setOptionArray() {
        super.setOptionArray();
        this.cache.visible.forEach(node => {
            const stored: ObjectMap<string[]> = $dom.getElementCache(node.element, 'optionArray');
            if (stored) {
                const result: string[] = [];
                if (stored.numberArray) {
                    if (!this.settings.numberResourceValue) {
                        result.push(...stored.numberArray);
                    }
                    else {
                        stored.stringArray = stored.numberArray;
                    }
                }
                if (stored.stringArray) {
                    result.push(
                        ...stored.stringArray.map(value => {
                            const name = ResourceHandler.addString(value, '', this.settings);
                            return name !== '' ? `@string/${name}` : '';
                        })
                        .filter(name => name)
                    );
                }
                if (result.length > 0) {
                    const arrayValue = result.join('-');
                    let arrayName = '';
                    for (const [storedName, storedResult] of $resource.STORED.arrays.entries()) {
                        if (arrayValue === storedResult.join('-')) {
                            arrayName = storedName;
                            break;
                        }
                    }
                    if (arrayName === '') {
                        arrayName = `${node.nodeId}_array`;
                        $resource.STORED.arrays.set(arrayName, result);
                    }
                    node.android('entries', `@array/${arrayName}`, node.renderExtension.size === 0);
                }
            }
        });
    }

    public addTheme(template: string, data: {}, options: ObjectMap<any>) {
        if (options.item) {
            const root = $xml.getTemplateBranch(data, '0');
            for (const name in options.item) {
                let value = options.item[name];
                const hex = $color.parseHex(value);
                if (hex !== '') {
                    value = `@color/${ResourceHandler.addColor(hex)}`;
                }
                root['1'].push({ name, value });
            }
        }
        const xml = $xml.createTemplate($xml.parseTemplate(template), data);
        this.addFile(options.output.path, options.output.file, xml);
    }

    private processFontStyle(viewData: ViewData<NodeList<T>>) {
        function deleteStyleAttribute(sorted: ObjectMap<number[]>[], attrs: string, ids: number[]) {
            attrs.split(';').forEach(value => {
                for (let i = 0; i < sorted.length; i++) {
                    if (sorted[i]) {
                        let index = -1;
                        let key = '';
                        for (const j in sorted[i]) {
                            if (j === value) {
                                index = i;
                                key = j;
                                i = sorted.length;
                                break;
                            }
                        }
                        if (index !== -1) {
                            sorted[index][key] = sorted[index][key].filter(id => !ids.includes(id));
                            if (sorted[index][key].length === 0) {
                                delete sorted[index][key];
                            }
                            break;
                        }
                    }
                }
            });
        }
        const style: ObjectMapNested<number[]> = {};
        const layout: ObjectMapNested<number[]> = {};
        const resource: ObjectMap<ResourceStyleData[]> = {};
        const mapNode: ObjectMapNested<string[]> = {};
        const inherit = new Set<string>();
        for (const tag in this._tagStyle) {
            style[tag] = {};
            layout[tag] = {};
            const count = this._tagCount[tag];
            let sorted = this._tagStyle[tag].filter(item => Object.keys(item).length > 0).sort((a, b) => {
                let maxA = 0;
                let maxB = 0;
                let countA = 0;
                let countB = 0;
                for (const attr in a) {
                    maxA = Math.max(a[attr].length, maxA);
                    countA += a[attr].length;
                }
                for (const attr in b) {
                    if (b[attr]) {
                        maxB = Math.max(b[attr].length, maxB);
                        countB += b[attr].length;
                    }
                }
                if (maxA !== maxB) {
                    return maxA > maxB ? -1 : 1;
                }
                else {
                    return countA >= countB ? -1 : 1;
                }
            });
            do {
                if (sorted.length === 1) {
                    for (const attr in sorted[0]) {
                        const value = sorted[0][attr];
                        if (value.length === 1) {
                            layout[tag][attr] = value;
                        }
                        else if (value.length > 1) {
                            style[tag][attr] = value;
                        }
                    }
                    sorted.length = 0;
                }
                else {
                    const styleKey: ObjectMap<number[]> = {};
                    const layoutKey: ObjectMap<number[]> = {};
                    for (let i = 0; i < sorted.length; i++) {
                        if (!sorted[i]) {
                            continue;
                        }
                        const filtered: ObjectMap<number[]> = {};
                        const combined: ObjectMap<Set<string>> = {};
                        const deleteKeys = new Set<string>();
                        for (const attr1 in sorted[i]) {
                            const ids: number[] = sorted[i][attr1];
                            let revalidate = false;
                            if (!ids || ids.length === 0) {
                                continue;
                            }
                            else if (ids.length === count) {
                                styleKey[attr1] = ids.slice();
                                sorted[i] = {};
                                revalidate = true;
                            }
                            else if (ids.length === 1) {
                                layoutKey[attr1] = ids.slice();
                                sorted[i][attr1] = [];
                                revalidate = true;
                            }
                            if (!revalidate) {
                                const found: ObjectMap<number[]> = {};
                                let merged = false;
                                for (let j = 0; j < sorted.length; j++) {
                                    if (i !== j && sorted[j]) {
                                        for (const attr in sorted[j]) {
                                            const compare = sorted[j][attr];
                                            if (compare.length > 0) {
                                                for (const nodeId of ids) {
                                                    if (compare.includes(nodeId)) {
                                                        if (found[attr] == null) {
                                                            found[attr] = [];
                                                        }
                                                        found[attr].push(nodeId);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                for (const attr2 in found) {
                                    if (found[attr2].length > 1) {
                                        filtered[[attr1, attr2].sort().join(';')] = found[attr2];
                                        merged = true;
                                    }
                                }
                                if (!merged) {
                                    filtered[attr1] = ids;
                                }
                            }
                        }
                        for (const attr1 in filtered) {
                            for (const attr2 in filtered) {
                                if (attr1 !== attr2 && filtered[attr1].join('') === filtered[attr2].join('')) {
                                    const index = filtered[attr1].join(',');
                                    if (combined[index]) {
                                        combined[index] = new Set([...combined[index], ...attr2.split(';')]);
                                    }
                                    else {
                                        combined[index] = new Set([...attr1.split(';'), ...attr2.split(';')]);
                                    }
                                    deleteKeys.add(attr1).add(attr2);
                                }
                            }
                        }
                        deleteKeys.forEach(value => delete filtered[value]);
                        for (const attrs in filtered) {
                            deleteStyleAttribute(sorted, attrs, filtered[attrs]);
                            style[tag][attrs] = filtered[attrs];
                        }
                        for (const index in combined) {
                            const attrs = Array.from(combined[index]).sort().join(';');
                            const ids = index.split(',').map(value => parseInt(value));
                            deleteStyleAttribute(sorted, attrs, ids);
                            style[tag][attrs] = ids;
                        }
                    }
                    const shared = Object.keys(styleKey);
                    if (shared.length > 0) {
                        if (shared.length > 1 || styleKey[shared[0]].length > 1) {
                            style[tag][shared.join(';')] = styleKey[shared[0]];
                        }
                        else {
                            Object.assign(layoutKey, styleKey);
                        }
                    }
                    for (const attr in layoutKey) {
                        layout[tag][attr] = layoutKey[attr];
                    }
                    for (let i = 0; i < sorted.length; i++) {
                        if (sorted[i] && Object.keys(sorted[i]).length === 0) {
                            delete sorted[i];
                        }
                    }
                    sorted = sorted.filter((item: ObjectMap<number[]>) => {
                        if (item) {
                            for (const attr in item) {
                                if (item[attr] && item[attr].length > 0) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    });
                }
            }
            while (sorted.length > 0);
        }
        for (const tagName in style) {
            const tag = style[tagName];
            const tagData: ResourceStyleData[] = [];
            for (const attrs in tag) {
                tagData.push({
                    name: '',
                    attrs,
                    ids: tag[attrs]
                });
            }
            tagData.sort((a, b) => {
                let [c, d] = [a.ids.length, b.ids.length];
                if (c === d) {
                    [c, d] = [a.attrs.split(';').length, b.attrs.split(';').length];
                }
                return c >= d ? -1 : 1;
            });
            tagData.forEach((item, index) => item.name = $util.capitalize(tagName) + (index > 0 ? `_${index}` : ''));
            resource[tagName] = tagData;
        }
        for (const tagName in resource) {
            for (const group of resource[tagName]) {
                for (const id of group.ids) {
                    if (mapNode[id] == null) {
                        mapNode[id] = { styles: [], attrs: [] };
                    }
                    mapNode[id].styles.push(group.name);
                }
            }
            const tagData = <ObjectMap<number[]>> layout[tagName];
            if (tagData) {
                for (const attr in tagData) {
                    for (const id of tagData[attr]) {
                        if (mapNode[id] == null) {
                            mapNode[id] = { styles: [], attrs: [] };
                        }
                        mapNode[id].attrs.push(attr);
                    }
                }
            }
        }
        for (const id in mapNode) {
            const node = viewData.cache.find('id', parseInt(id));
            if (node) {
                const styles = mapNode[id].styles;
                const attrs = mapNode[id].attrs;
                if (styles.length > 0) {
                    inherit.add(styles.join('.'));
                    node.attr('_', 'style', `@style/${styles.pop()}`);
                }
                if (attrs.length > 0) {
                    attrs.sort().forEach(value => node.formatted(replaceUnit(value, this.settings, true), false));
                }
            }
        }
        for (const styles of inherit) {
            let parent = '';
            styles.split('.').forEach(value => {
                const match = value.match(/^(\w*?)(?:_(\d+))?$/);
                if (match) {
                    const tagData = resource[match[1].toUpperCase()][match[2] == null ? 0 : parseInt(match[2])];
                    tagData.name = value;
                    tagData.parent = parent;
                    $resource.STORED.styles.set(value, tagData);
                    parent = value;
                }
            });
        }
    }

    private processDimensions(data: ViewData<NodeList<T>>) {
        if (this.settings.dimensResourceValue) {
            const groups: ObjectMapNested<T[]> = {};
            const resource: Map<string, string> = $resource.STORED.dimens;
            function addToGroup(nodeName: string, node: T, dimen: string, attr?: string, value?: string) {
                const group: ObjectMap<T[]> = groups[nodeName];
                let name = dimen;
                if (arguments.length === 5) {
                    if (value && /(px|dp|sp)$/.test(value)) {
                        name += `,${attr},${value}`;
                    }
                    else {
                        return;
                    }
                }
                if (group[name] == null) {
                    group[name] = [];
                }
                group[name].push(node);
            }
            function boxValue(node: T, region: string, settings: Settings) {
                const name = $util.convertEnum(parseInt(region), $enum.BOX_STANDARD, BOX_ANDROID);
                if (name !== '') {
                    const attr = parseRTL(name, settings);
                    return [attr, node.android(attr) || '0px'];
                }
                return ['', '0px'];
            }
            function getResourceKey(key: string, value: string) {
                return resource.has(key) && resource.get(key) !== value ? generateId('dimens', key, 1) : key;
            }
            data.cache.visible.forEach(node => {
                const nodeName = node.nodeName.toLowerCase();
                if (groups[nodeName] == null) {
                    groups[nodeName] = {};
                }
                for (const key of Object.keys($enum.BOX_STANDARD)) {
                    const result = boxValue(node, key, this.application.settings);
                    if (result[0] !== '' && result[1] !== '0px') {
                        const name = `${$enum.BOX_STANDARD[key].toLowerCase()},${result[0]},${result[1]}`;
                        addToGroup(nodeName, node, name);
                    }
                }
                [
                    'android:layout_width:width',
                    'android:layout_height:height',
                    'android:minWidth:min_width',
                    'android:minHeight:min_height',
                    'app:layout_constraintWidth_min:constraint_width_min',
                    'app:layout_constraintHeight_min:constraint_height_min'
                ]
                .forEach(value => {
                    const [obj, attr, dimen] = value.split(':');
                    addToGroup(nodeName, node, dimen, attr, node[obj](attr));
                });
            });
            for (const nodeName in groups) {
                const group: ObjectMap<T[]> = groups[nodeName];
                for (const name in group) {
                    const [dimen, attr, value] = name.split(',');
                    const key = getResourceKey(`${nodeName}_${parseRTL(dimen, this.settings)}`, value);
                    group[name].forEach(node => node[attr.indexOf('constraint') !== -1 ? 'app' : 'android'](attr, `@dimen/${key}`));
                    resource.set(key, value);
                }
            }
            for (const value of [...data.views, ...data.includes]) {
                let content = value.content;
                const pattern = /\s+\w+:\w+="({%(\w+),(\w+),(-?\w+)})"/g;
                let match: Null<RegExpExecArray>;
                while ((match = pattern.exec(content)) != null) {
                    const key = getResourceKey(`${match[2]}_${parseRTL(match[3], this.settings)}`, match[4]);
                    resource.set(key, match[4]);
                    content = content.replace(new RegExp(match[1], 'g'), `@dimen/${key}`);
                }
                value.content = content;
            }
        }
    }
}