import { SettingsAndroid } from './lib/types';
import View from './view';
import { generateId, replaceUnit } from './lib/util';
import { FONT_ANDROID, FONTALIAS_ANDROID, FONTREPLACE_ANDROID, FONTWEIGHT_ANDROID, RESERVED_JAVA } from './lib/constant';

import $enum = androme.lib.enumeration;
import $util = androme.lib.util;
import $dom = androme.lib.dom;
import $xml = androme.lib.xml;
import $color = androme.lib.color;
import $resource = androme.lib.base.Resource;
import NodeList = androme.lib.base.NodeList;

import SHAPERECTANGLE_TMPL from './template/resource/shape-rectangle';
import LAYERLIST_TMPL from './template/resource/layer-list';

const METHOD_ANDROID = {
    'boxStyle': {
        'background': 'android:background="@drawable/{0}"',
        'backgroundColor': 'android:background="@color/{0}"'
    },
    'fontStyle': {
        'fontFamily': 'android:fontFamily="{0}"',
        'fontStyle': 'android:textStyle="{0}"',
        'fontWeight': 'android:fontWeight="{0}"',
        'fontSize': 'android:textSize="{0}"',
        'color': 'android:textColor="@color/{0}"',
        'backgroundColor': 'android:background="@color/{0}"'
    },
    'valueString': {
        'text': 'android:text="{0}"'
    },
    'optionArray': {
        'entries': 'android:entries="@array/{0}"'
    },
    'imageSource': {
        'src': 'android:src="@drawable/{0}"'
    }
};

type StyleTag = {
    name: string;
    attributes: string;
    ids: number[];
};

type BackgroundImage = {
    image: string;
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

type StyleList = ObjectMap<number[]>[];

export default class ResourceHandler<T extends View> extends androme.lib.base.Resource<T> {
    public static getStored(name: string) {
        return $resource.STORED[name];
    }

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
                                            value = ResourceHandler.addString(value, '', settings);
                                            if (value !== '') {
                                                obj[attr] = `@string/${value}`;
                                                continue;
                                            }
                                        }
                                        break;
                                    case 'src':
                                        if (/^\w+:\/\//.test(value)) {
                                            value = ResourceHandler.addImage({ 'mdpi': value });
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
                            obj[attr] = `@color/${ResourceHandler.addColor(hex)}`;
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
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .split('_')
                    .slice(0, 4)
                    .join('_')
                    .replace(/_+$/g, '');
                if (numeric || /^[0-9]/.test(name) || RESERVED_JAVA.includes(name)) {
                    name = `__${name}`;
                }
                else if (name === '') {
                    name = `__symbol${Math.ceil(Math.random() * 100000)}`;
                }
                if ($resource.STORED.strings.has(name)) {
                    name = generateId('strings', `${name}_1`);
                }
                $resource.STORED.strings.set(name, value);
            }
            return name;
        }
        return '';
    }

    public static addImageSrcSet(element: HTMLImageElement, prefix = '') {
        const srcset = element.srcset.trim();
        const images = {};
        if (srcset !== '') {
            const filepath = element.src.substring(0, element.src.lastIndexOf('/') + 1);
            srcset.split(',').forEach(value => {
                const match = /^(.*?)\s*([0-9]+\.?[0-9]*x)?$/.exec(value.trim());
                if (match) {
                    if (match[2] == null) {
                        match[2] = '1x';
                    }
                    const image = filepath + $util.lastIndexOf(match[1]);
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
        return ResourceHandler.addImage(images, prefix);
    }

    public static addImage(images: StringMap, prefix = '') {
        let src = '';
        if (images && images['mdpi']) {
            src = $util.lastIndexOf(images['mdpi']);
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
            return ResourceHandler.addImage({ 'mdpi': url }, prefix);
        }
        return '';
    }

    public static addColor(value: string, opacity = '1') {
        value = value.toUpperCase().trim();
        const opaque = parseFloat(opacity) < 1 ? `#${parseFloat(opacity).toFixed(2).substring(2) + value.substring(1)}` : value;
        if (value !== '') {
            let colorName = $resource.STORED.colors.get(opaque) || '';
            if (colorName === '') {
                const color = $color.getColorNearest(value);
                if (color) {
                    color.name = $util.camelToLowerCase(color.name);
                    if (value === color.hex && value === opaque) {
                        colorName = color.name;
                    }
                    else {
                        colorName = generateId('color', `${color.name}_1`);
                    }
                    $resource.STORED.colors.set(opaque, colorName);
                }
            }
            return colorName;
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

    public static parseBackgroundPosition(value: string, fontSize: string) {
        const match = new RegExp(/([0-9]+[a-z]{2}) ([0-9]+[a-z]{2})/).exec(value);
        if (match) {
            return [$util.convertPX(match[1], fontSize), $util.convertPX(match[2], fontSize)];
        }
        return ['', ''];
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
                            name = (style !== '' ? `${style}.` : '') + $util.capitalize(node.nodeId);
                            styles[name] = common;
                        }
                        children.forEach(item => item.attr('_', 'style', `@style/${name}`));
                    }
                }
            }
        });
        for (const name in styles) {
            $resource.STORED.styles.set(name, { attributes: styles[name].join(';') });
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
                if (Array.isArray(stored.backgroundColor) && stored.backgroundColor.length > 0) {
                    stored.backgroundColor = ResourceHandler.addColor(stored.backgroundColor[0], stored.backgroundColor[2]);
                }
                let backgroundImage = stored.backgroundImage.split(',').map(value => value.trim());
                let backgroundRepeat = stored.backgroundRepeat.split(',').map(value => value.trim());
                const backgroundPositionX = stored.backgroundPositionX.split(',').map(value => value.trim());
                const backgroundPositionY = stored.backgroundPositionY.split(',').map(value => value.trim());
                const backgroundImageUrl: string[] = [];
                const backgroundDimensions: Null<Image>[] = [];
                let backgroundPosition: string[] = [];
                for (let i = 0; i < backgroundImage.length; i++) {
                    if (backgroundImage[i] !== '' && backgroundImage[i] !== 'none') {
                        backgroundImageUrl.push(backgroundImage[i]);
                        const image = this.imageDimensions.get($dom.cssResolveUrl(backgroundImage[i]));
                        backgroundDimensions.push(image);
                        backgroundImage[i] = ResourceHandler.addImageURL(backgroundImage[i]);
                        backgroundPosition[i] = `${backgroundPositionX[i] === 'initial' ? '0%' : backgroundPositionX[i]} ${backgroundPositionY[i] === 'initial' ? '0%' : backgroundPositionY[i]}`;
                    }
                    else {
                        backgroundImage[i] = '';
                        backgroundRepeat[i] = '';
                        backgroundPosition[i] = '';
                    }
                }
                backgroundImage = backgroundImage.filter(value => value !== '');
                backgroundRepeat = backgroundRepeat.filter(value => value !== '');
                backgroundPosition = backgroundPosition.filter(value => value !== '');
                const method = METHOD_ANDROID['boxStyle'];
                const companion = node.companion;
                if (companion &&
                    !companion.visible &&
                    companion.hasElement &&
                    !$dom.cssFromParent(companion.element, 'backgroundColor'))
                {
                    const boxStyle: BoxStyle = $dom.getElementCache(companion.element, 'boxStyle');
                    if (Array.isArray(boxStyle.backgroundColor) && boxStyle.backgroundColor.length > 0) {
                        stored.backgroundColor = ResourceHandler.addColor(boxStyle.backgroundColor[0], boxStyle.backgroundColor[2]);
                    }
                }
                const hasBorder = (
                    this.borderVisible(stored.borderTop) ||
                    this.borderVisible(stored.borderRight) ||
                    this.borderVisible(stored.borderBottom) ||
                    this.borderVisible(stored.borderLeft) ||
                    stored.borderRadius.length > 0
                );
                if (hasBorder || backgroundImage.length > 0) {
                    const borders: BorderAttribute[] = [
                        stored.borderTop,
                        stored.borderRight,
                        stored.borderBottom,
                        stored.borderLeft
                    ];
                    borders.forEach((item: BorderAttribute) => {
                        if (Array.isArray(item.color) && item.color.length > 0) {
                            item.color = ResourceHandler.addColor(item.color[0], item.color[2]);
                        }
                    });
                    let data: {};
                    const image2: BackgroundImage[] = [];
                    const image3: BackgroundImage[] = [];
                    let template: Null<ObjectMap<string>> = null;
                    let resourceName = '';
                    for (let i = 0; i < backgroundImage.length; i++) {
                        let gravity = '';
                        let tileMode = '';
                        let tileModeX = '';
                        let tileModeY = '';
                        let [left, top] = ResourceHandler.parseBackgroundPosition(backgroundPosition[i], node.css('fontSize'));
                        let right = '';
                        let bottom = '';
                        const image = backgroundDimensions[i];
                        switch (backgroundRepeat[i]) {
                            case 'repeat-x':
                                if (image == null || image.width < node.bounds.width) {
                                    tileModeX = 'repeat';
                                }
                                break;
                            case 'repeat-y':
                                if (image == null || image.height < node.bounds.height) {
                                    tileModeY = 'repeat';
                                }
                                break;
                            case 'no-repeat':
                                tileMode = 'disabled';
                                break;
                            case 'repeat':
                                if (image == null ||
                                    image.width < node.bounds.width ||
                                    image.height < node.bounds.height)
                                {
                                    tileMode = 'repeat';
                                }
                                break;
                        }
                        if (left === '') {
                            switch (backgroundPosition[i]) {
                                case 'left top':
                                case '0% 0%':
                                    gravity = 'left|top';
                                    break;
                                case 'left center':
                                case '0% 50%':
                                    gravity = 'left|center_vertical';
                                    break;
                                case 'left bottom':
                                case '0% 100%':
                                    gravity = 'left|bottom';
                                    break;
                                case 'right top':
                                case '100% 0%':
                                    gravity = 'right|top';
                                    break;
                                case 'right center':
                                case '100% 50%':
                                    gravity = 'right|center_vertical';
                                    break;
                                case 'right bottom':
                                case '100% 100%':
                                    gravity = 'right|bottom';
                                    break;
                                case 'center top':
                                case '50% 0%':
                                    gravity = 'center_horizontal|top';
                                    break;
                                case 'center bottom':
                                case '50% 100%':
                                    gravity = 'center_horizontal|bottom';
                                    break;
                                case 'center center':
                                case '50% 50%':
                                    gravity = 'center';
                                    break;
                                default:
                                    const position = backgroundPosition[i].trim().split(' ');
                                    if (position.length === 2) {
                                        function mergeGravity(original: string, alignment: string) {
                                            return original + (original !== '' ? '|' : '') + alignment;
                                        }
                                        position.forEach((value, index) => {
                                            if ($util.isPercent(value)) {
                                                switch (index) {
                                                    case 0:
                                                        if (value === '0%') {
                                                            gravity = mergeGravity(gravity, 'left');
                                                        }
                                                        else if (value === '100%') {
                                                            gravity = mergeGravity(gravity, 'right');
                                                        }
                                                        else {
                                                            left = $util.formatPX(node.bounds.width * ($util.convertInt(value) / 100));
                                                        }
                                                        break;
                                                    case 1:
                                                        if (value === '0%') {
                                                            gravity = mergeGravity(gravity, 'top');
                                                        }
                                                        else if (value === '100%') {
                                                            gravity = mergeGravity(gravity, 'bottom');
                                                        }
                                                        else {
                                                            top = $util.formatPX(node.actualHeight * ($util.convertInt(value) / 100));
                                                        }
                                                        break;
                                                }
                                            }
                                            else if (/^[a-z]+$/.test(value)) {
                                                gravity = mergeGravity(gravity, value);
                                            }
                                            else {
                                                const leftTop = $util.convertPX(value, node.css('fontSize'));
                                                if (leftTop !== '0px') {
                                                    if (index === 0) {
                                                        left = leftTop;
                                                    }
                                                    else {
                                                        top = leftTop;
                                                    }
                                                }
                                                gravity = mergeGravity(gravity, index === 0 ? 'left' : 'top');
                                            }
                                        });
                                    }
                                    break;
                            }
                            if (gravity !== '' && image && image.width > 0 && image.height > 0) {
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
                                            right = $util.formatPX(backgroundWidth - image.width);
                                            if (node.viewWidth === 0 && backgroundWidth > layoutWidth) {
                                                node.android('layout_width', $util.formatPX(node.bounds.width));
                                            }
                                        }
                                        else if (gravity.indexOf('right') !== -1) {
                                            left = $util.formatPX(backgroundWidth - image.width);
                                            if (node.viewWidth === 0 && backgroundWidth > layoutWidth) {
                                                node.android('layout_width', $util.formatPX(node.bounds.width));
                                            }
                                        }
                                        else if (gravity === 'center' || gravity.indexOf('center_horizontal') !== -1) {
                                            right = $util.formatPX(Math.floor((backgroundWidth - image.width) / 2));
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
                                            bottom = $util.formatPX(backgroundHeight - image.height);
                                            if (node.viewHeight === 0 && backgroundHeight > layoutHeight) {
                                                node.android('layout_height', $util.formatPX(node.bounds.height));
                                            }
                                        }
                                        else if (gravity.indexOf('bottom') !== -1) {
                                            top = $util.formatPX(backgroundHeight - image.height);
                                            if (node.viewHeight === 0 && backgroundHeight > layoutHeight) {
                                                node.android('layout_height', $util.formatPX(node.bounds.height));
                                            }
                                        }
                                        else if (gravity === 'center' || gravity.indexOf('center_vertical') !== -1) {
                                            bottom = $util.formatPX(Math.floor((backgroundHeight - image.height) / 2));
                                            if (node.viewHeight === 0 && backgroundHeight > layoutHeight) {
                                                node.android('layout_height', $util.formatPX(node.bounds.height));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (stored.backgroundSize.length > 0) {
                            if ($util.isPercent(stored.backgroundSize[0]) || $util.isPercent(stored.backgroundSize[1])) {
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
                        }
                        if (node.of($enum.NODE_STANDARD.IMAGE, $enum.NODE_ALIGNMENT.SINGLE) && backgroundPosition.length === 1) {
                            node.android('src', `@drawable/${backgroundImage[0]}`);
                            if ($util.convertInt(left) > 0) {
                                node.modifyBox($enum.BOX_STANDARD.MARGIN_LEFT, $util.convertInt(left));
                            }
                            if ($util.convertInt(top) > 0) {
                                node.modifyBox($enum.BOX_STANDARD.MARGIN_TOP, $util.convertInt(top));
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
                            if (gravity !== '' ||
                                tileMode !== '' ||
                                tileModeX !== '' ||
                                tileModeY !== '')
                            {
                                image3.push({
                                    top,
                                    right,
                                    bottom,
                                    left,
                                    gravity,
                                    tileMode,
                                    tileModeX,
                                    tileModeY,
                                    width: '',
                                    height: '',
                                    image: backgroundImage[i]
                                });
                            }
                            else {
                                image2.push({
                                    top,
                                    right,
                                    bottom,
                                    left,
                                    gravity,
                                    tileMode,
                                    tileModeX,
                                    tileModeY,
                                    width: stored.backgroundSize.length > 0 ? stored.backgroundSize[0] : '',
                                    height: stored.backgroundSize.length > 0 ? stored.backgroundSize[1] : '',
                                    image: backgroundImage[i]
                                });
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
                    const backgroundColor = this.getShapeAttribute(stored, 'backgroundColor');
                    const radius = this.getShapeAttribute(stored, 'radius');
                    function createDoubleBorder(templateData: {}, border: BorderAttribute, top: boolean, right: boolean, bottom: boolean, left: boolean) {
                        const width = parseInt(border.width);
                        const baseWidth = Math.floor(width / 3);
                        const remainder = width % 3;
                        const leftWidth = baseWidth + (remainder === 2 ? 1 : 0);
                        const rightWidth = baseWidth + (remainder === 2 ? 1 : 0);
                        let leftTop = `-${$util.formatPX(leftWidth + 1)}`;
                        let rightBottom = `-${$util.formatPX(leftWidth)}`;
                        templateData['4'].push({
                            'top': top ? '' :  rightBottom,
                            'right': right ? '' :  leftTop,
                            'bottom': bottom ? '' :  rightBottom,
                            'left': left ? '' :  leftTop,
                            '5': [{ width: $util.formatPX(leftWidth), borderStyle: this.getBorderStyle(border) }],
                            '6': radius
                        });
                        leftTop = `-${$util.formatPX(width + 1)}`;
                        rightBottom = `-${$util.formatPX(width)}`;
                        const indentWidth = `${$util.formatPX(width - baseWidth)}`;
                        templateData['4'].push({
                            'top': top ? indentWidth : leftTop,
                            'right': right ? indentWidth : rightBottom,
                            'bottom': bottom ? indentWidth : rightBottom,
                            'left': left ? indentWidth : leftTop,
                            '5': [{ width: $util.formatPX(rightWidth), borderStyle: this.getBorderStyle(border) }],
                            '6': radius
                        });
                    }
                    if (stored.border &&
                        this.borderVisible(stored.border) && !(
                            (parseInt(stored.border.width) > 1 && (stored.border.style === 'groove' || stored.border.style === 'ridge')) ||
                            (parseInt(stored.border.width) > 2 && stored.border.style === 'double')
                       ))
                    {
                        if (backgroundImage.length === 0) {
                            template = $xml.parseTemplate(SHAPERECTANGLE_TMPL);
                            data = {
                                '0': [{
                                    '1': this.getShapeAttribute(stored, 'stroke'),
                                    '2': backgroundColor,
                                    '3': radius
                                }]
                            };
                        }
                        else {
                            template = $xml.parseTemplate(LAYERLIST_TMPL);
                            data = {
                                '0': [{
                                    '1': backgroundColor,
                                    '2': image2.length > 0 ? image2 : false,
                                    '3': image3.length > 0 ? image3 : false,
                                    '4': [{
                                        '5': this.getShapeAttribute(stored, 'stroke'),
                                        '6': radius
                                    }],
                                    '7': false
                                }]
                            };
                        }
                    }
                    else {
                        template = $xml.parseTemplate(LAYERLIST_TMPL);
                        data = {
                            '0': [{
                                '1': backgroundColor,
                                '2': image2.length > 0 ? image2 : false,
                                '3': image3.length > 0 ? image3 : false,
                                '4': [],
                                '7': []
                            }]
                        };
                        const root = $xml.getTemplateLevel(data, '0');
                        const borderVisible = borders.filter(item => this.borderVisible(item));
                        const borderWidth = new Set(borderVisible.map(item => item.width));
                        const borderStyle = new Set(borderVisible.map(item => this.getBorderStyle(item)));
                        const borderData = borderVisible[0];
                        if (borderWidth.size === 1 &&
                            borderStyle.size === 1 &&
                            !(borderData.style === 'groove' || borderData.style === 'ridge'))
                        {
                            const width = parseInt(borderData.width);
                            if (width > 2 && borderData.style === 'double') {
                                createDoubleBorder.apply(this, [
                                    root,
                                    borderData,
                                    this.borderVisible(stored.borderTop),
                                    this.borderVisible(stored.borderRight),
                                    this.borderVisible(stored.borderBottom),
                                    this.borderVisible(stored.borderLeft)
                                ]);
                            }
                            else {
                                const leftTop = `-${$util.formatPX(width + 1)}`;
                                const rightBottom = `-${$util.formatPX(width)}`;
                                root['4'].push({
                                    'top': this.borderVisible(stored.borderTop) ? '' : leftTop,
                                    'right': this.borderVisible(stored.borderRight) ? '' : rightBottom,
                                    'bottom': this.borderVisible(stored.borderBottom) ? '' : rightBottom,
                                    'left': this.borderVisible(stored.borderLeft) ? '' : leftTop,
                                    '5': this.getShapeAttribute(<BoxStyle> { border: borderVisible[0] }, 'stroke'),
                                    '6': radius
                                });
                            }
                        }
                        else {
                            for (let i = 0; i < borders.length; i++) {
                                const border = borders[i];
                                if (this.borderVisible(border)) {
                                    const width = parseInt(border.width);
                                    if (width > 2 && border.style === 'double') {
                                        createDoubleBorder.apply(this, [
                                            root,
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
                                        let leftTop = `-${$util.formatPX(outsetWidth + 1)}`;
                                        let rightBottom = `-${$util.formatPX(outsetWidth)}`;
                                        root['4'].push({
                                            'top':  i === 0 ? '' : leftTop,
                                            'right': i === 1 ? '' : rightBottom,
                                            'bottom': i === 2 ? '' : rightBottom,
                                            'left': i === 3 ? '' : leftTop,
                                            '5': this.getShapeAttribute(<BoxStyle> { border }, 'stroke', i, hasInset),
                                            '6': radius
                                        });
                                        if (hasInset) {
                                            leftTop = `-${$util.formatPX(width + 1)}`;
                                            rightBottom = `-${$util.formatPX(width)}`;
                                            root['7'].push({
                                                'top':  i === 0 ? '' : leftTop,
                                                'right': i === 1 ? '' : rightBottom,
                                                'bottom': i === 2 ? '' : rightBottom,
                                                'left': i === 3 ? '' : leftTop,
                                                '8': this.getShapeAttribute(<BoxStyle> { border }, 'stroke', i, true, true)
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        if (root['4'].length === 0) {
                            root['4'] = false;
                        }
                        if (root['7'].length === 0) {
                            root['7'] = false;
                        }
                    }
                    if (template) {
                        const xml = $xml.createTemplate(template, data);
                        for (const [name, value] of $resource.STORED.drawables.entries()) {
                            if (value === xml) {
                                resourceName = name;
                                break;
                            }
                        }
                        if (resourceName === '') {
                            resourceName = `${node.nodeName.toLowerCase()}_${node.nodeId}`;
                            $resource.STORED.drawables.set(resourceName, xml);
                        }
                    }
                    node.formatted($util.formatString(method['background'], resourceName), node.renderExtension.size === 0);
                    if (backgroundImage.length > 0) {
                        node.data('RESOURCE', 'backgroundImage', true);
                        if (this.settings.autoSizeBackgroundImage &&
                            !node.documentRoot &&
                            !node.imageElement &&
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
                    node.formatted($util.formatString(method['backgroundColor'], stored.backgroundColor), node.renderExtension.size === 0);
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
                    [/^(rgb(?:a)?\([0-9]{1,3}, [0-9]{1,3}, [0-9]{1,3}(?:, [0-9\.]+)?\)) ([0-9\.]+[a-z]{2}) ([0-9\.]+[a-z]{2}) ([0-9\.]+[a-z]{2})$/, /^([0-9\.]+[a-z]{2}) ([0-9\.]+[a-z]{2}) ([0-9\.]+[a-z]{2}) (.+)$/].some((value, index) => {
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
                let system = false;
                const nodeId = node.id;
                const companion = node.companion;
                if (companion &&
                    !companion.visible && (
                        companion.textElement ||
                        companion.tagName === 'LABEL'
                   ))
                {
                    node = companion as T;
                }
                const element = node.element;
                const stored: FontAttribute = Object.assign({}, $dom.getElementCache(element, 'fontStyle'));
                if (Array.isArray(stored.backgroundColor) && stored.backgroundColor.length > 0) {
                    stored.backgroundColor = ResourceHandler.addColor(stored.backgroundColor[0], stored.backgroundColor[2]);
                }
                if (stored.fontFamily) {
                    let fontFamily = stored.fontFamily.split(',')[0]
                        .replace(/"/g, '')
                        .toLowerCase()
                        .trim();
                    let fontStyle = '';
                    let fontWeight = '';
                    if (Array.isArray(stored.color) && stored.color.length > 0) {
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
                const method = METHOD_ANDROID['fontStyle'];
                const keys = Object.keys(method);
                for (let i = 0; i < keys.length; i++) {
                    if (sorted[i] == null) {
                        sorted[i] = {};
                    }
                    const value: string = stored[keys[i]];
                    if ($util.hasValue(value)) {
                        if (node.supported('android', keys[i])) {
                            const attr = $util.formatString(method[keys[i]], value);
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
        this.cache.list.filter(node =>
            node.visible &&
            (node.imageElement || (node.tagName === 'INPUT' && (<HTMLInputElement> node.element).type === 'image')) &&
            !node.hasBit('excludeResource', $enum.NODE_RESOURCE.IMAGE_SOURCE)
        )
        .forEach(node => {
            const element = <HTMLImageElement> node.element;
            if (!$dom.getElementCache(element, 'imageSource') || this.settings.alwaysReevaluateResources) {
                const result = node.imageElement ? ResourceHandler.addImageSrcSet(element) : ResourceHandler.addImage({ 'mdpi': element.src });
                if (result !== '') {
                    const method = METHOD_ANDROID['imageSource'];
                    node.formatted($util.formatString(method['src'], result), node.renderExtension.size === 0);
                    $dom.setElementCache(element, 'imageSource', result);
                }
            }
        });
    }

    public setOptionArray() {
        super.setOptionArray();
        this.cache.visible.forEach(node => {
            const stored: ObjectMap<string[]> = $dom.getElementCache(node.element, 'optionArray');
            if (stored && !node.hasBit('excludeResource', $enum.NODE_RESOURCE.OPTION_ARRAY)) {
                const method = METHOD_ANDROID['optionArray'];
                let result: string[] = [];
                if (stored.numberArray) {
                    if (!this.settings.numberResourceValue) {
                        result = stored.numberArray;
                    }
                    else {
                        stored.stringArray = stored.numberArray;
                    }
                }
                if (stored.stringArray) {
                    result = stored.stringArray.map(value => {
                        const name = ResourceHandler.addString(value, '', this.settings);
                        return name !== '' ? `@string/${name}` : '';
                    })
                    .filter(name => name);
                }
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
                node.formatted($util.formatString(method['entries'], arrayName), node.renderExtension.size === 0);
            }
        });
    }

    public setValueString() {
        super.setValueString();
        this.cache.visible.forEach(node => {
            const stored: NameValue = $dom.getElementCache(node.element, 'valueString');
            if (stored && !node.hasBit('excludeResource', $enum.NODE_RESOURCE.VALUE_STRING)) {
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
                if (node.hasElement) {
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
                if (name !== '') {
                    const method = METHOD_ANDROID['valueString'];
                    if (node.toInt('textIndent') + node.bounds.width > 0) {
                        node.formatted($util.formatString(method['text'], isNaN(parseInt(name)) || parseInt(name).toString() !== name ? `@string/${name}` : name), node.renderExtension.size === 0);
                    }
                }
            }
        });
    }

    public addTheme(template: string, data: {}, options: ObjectMap<any>) {
        const map: ObjectMap<string> = $xml.parseTemplate(template);
        if (options.item) {
            const root = $xml.getTemplateLevel(data, '0');
            for (const name in options.item) {
                let value = options.item[name];
                const hex = $color.parseHex(value);
                if (hex !== '') {
                    value = `@color/${ResourceHandler.addColor(hex)}`;
                }
                root['1'].push({ name, value });
            }
        }
        const xml = $xml.createTemplate(map, data);
        this.addFile(options.output.path, options.output.file, xml);
    }

    private processFontStyle(viewData: ViewData<NodeList<T>>) {
        const style: ObjectMapNested<number[]> = {};
        const layout: ObjectMapNested<number[]> = {};
        const resource: ObjectMap<StyleTag[]> = {};
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
                            this.deleteStyleAttribute(sorted, attrs, filtered[attrs]);
                            style[tag][attrs] = filtered[attrs];
                        }
                        for (const index in combined) {
                            const attrs = Array.from(combined[index]).sort().join(';');
                            const ids = index.split(',').map(value => parseInt(value));
                            this.deleteStyleAttribute(sorted, attrs, ids);
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
            const tagData: StyleTag[] = [];
            for (const attributes in tag) {
                tagData.push({
                    name: '',
                    attributes,
                    ids: tag[attributes]
                });
            }
            tagData.sort((a, b) => {
                let [c, d] = [a.ids.length, b.ids.length];
                if (c === d) {
                    [c, d] = [a.attributes.split(';').length, b.attributes.split(';').length];
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
                        mapNode[id] = { styles: [], attributes: [] };
                    }
                    mapNode[id].styles.push(group.name);
                }
            }
            const tagData = <ObjectMap<number[]>> layout[tagName];
            if (tagData) {
                for (const attr in tagData) {
                    for (const id of tagData[attr]) {
                        if (mapNode[id] == null) {
                            mapNode[id] = { styles: [], attributes: [] };
                        }
                        mapNode[id].attributes.push(attr);
                    }
                }
            }
        }
        for (const id in mapNode) {
            const node = viewData.cache.find('id', parseInt(id));
            if (node) {
                const styles = mapNode[id].styles;
                const attrs = mapNode[id].attributes;
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
                const match = value.match(/^(\w*?)(?:_([0-9]+))?$/);
                if (match) {
                    const tagData = resource[match[1].toUpperCase()][match[2] == null ? 0 : parseInt(match[2])];
                    $resource.STORED.styles.set(value, { parent, attributes: tagData.attributes });
                    parent = value;
                }
            });
        }
    }

    private deleteStyleAttribute(sorted: ObjectMap<number[]>[], attrs: string, ids: number[]) {
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

    private getShapeAttribute(stored: BoxStyle, name: string, direction = -1, hasInset = false, isInset = false): any[] | boolean {
        switch (name) {
            case 'stroke':
                if (stored.border && stored.border.width !== '0px') {
                    if (!hasInset || isInset) {
                        return [{
                            width: stored.border.width,
                            borderStyle: this.getBorderStyle(stored.border, isInset ? direction : -1)
                        }];
                    }
                    else if (hasInset) {
                        return [{
                            width: $util.formatPX(Math.ceil(parseInt(stored.border.width) / 2)),
                            borderStyle: this.getBorderStyle(stored.border, direction, true)
                        }];
                    }
                }
                return false;
            case 'backgroundColor':
                return stored.backgroundColor.length !== 0 && stored.backgroundColor !== '' ? [{ color: stored.backgroundColor }] : false;
            case 'radius':
                if (stored.borderRadius.length === 1) {
                    if (stored.borderRadius[0] !== '0px') {
                        return [{ radius: stored.borderRadius[0] }];
                    }
                }
                else if (stored.borderRadius.length > 1) {
                    const result = {};
                    stored.borderRadius.forEach((value, index) => result[`${['topLeft', 'topRight', 'bottomRight', 'bottomLeft'][index]}Radius`] = value);
                    return [result];
                }
                return false;

        }
        return false;
    }

    private getBorderStyle(border: BorderAttribute, direction = -1, halfSize = false): StringMap {
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
        if (parseInt(border.width) > 1 && (
                groove ||
                border.style === 'ridge'
           ))
        {
            let colorName = $util.isString(border.color) ? border.color : '';
            let hexValue = ResourceHandler.getColor(colorName);
            if (hexValue !== '') {
                let opacity = '1';
                if (hexValue.length === 9) {
                    hexValue = `#${hexValue.substring(3)}`;
                    opacity = `0.${hexValue.substring(1, 3)}`;
                }
                const reduced = $color.parseRGBA($color.reduceToRGB(hexValue, groove || hexValue === '#000000' ? 0.3 : -0.3));
                if (reduced.length > 0) {
                    colorName = ResourceHandler.addColor(reduced[0], opacity);
                }
            }
            const colorReduced = `android:color="@color/${colorName}"`;
            if (groove) {
                if (halfSize) {
                    switch (direction) {
                        case 0:
                            result['groove'] = colorReduced;
                            break;
                        case 1:
                            result['groove'] = colorReduced;
                            break;
                        case 2:
                            result['groove'] = result.solid;
                            break;
                        case 3:
                            result['groove'] = result.solid;
                            break;
                    }
                }
                else {
                    switch (direction) {
                        case 0:
                            result['groove'] = result.solid;
                            break;
                        case 1:
                            result['groove'] = result.solid;
                            break;
                        case 2:
                            result['groove'] = colorReduced;
                            break;
                        case 3:
                            result['groove'] = colorReduced;
                            break;
                    }
                }
            }
            else {
                if (halfSize) {
                    switch (direction) {
                        case 0:
                            result['ridge'] = result.solid;
                            break;
                        case 1:
                            result['ridge'] = result.solid;
                            break;
                        case 2:
                            result['ridge'] = colorReduced;
                            break;
                        case 3:
                            result['ridge'] = colorReduced;
                            break;
                    }
                }
                else {
                    switch (direction) {
                        case 0:
                            result['ridge'] = colorReduced;
                            break;
                        case 1:
                            result['ridge'] = colorReduced;
                            break;
                        case 2:
                            result['ridge'] = result.solid;
                            break;
                        case 3:
                            result['ridge'] = result.solid;
                            break;
                    }
                }
            }
        }
        return result[border.style] || result.solid;
    }
}