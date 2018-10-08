export {};

declare global {
    namespace lib {
        namespace enumeration {
            export enum APP_FRAMEWORK {
                UNIVERSAL,
                ANDROID
            }
            export enum APP_SECTION {
                NONE,
                INCLUDE,
                DOM_TRAVERSE,
                EXTENSION,
                RENDER,
                ALL
            }
            export enum NODE_ALIGNMENT {
                NONE,
                EXTENDABLE,
                HORIZONTAL,
                VERTICAL,
                ABSOLUTE,
                FLOAT,
                SEGMENTED,
                PERCENT,
                TOP,
                RIGHT,
                BOTTOM,
                LEFT,
                SINGLE,
                MULTILINE,
                SPACE
            }
            export enum NODE_RESOURCE {
                NONE,
                BOX_STYLE,
                BOX_SPACING,
                FONT_STYLE,
                VALUE_STRING,
                OPTION_ARRAY,
                IMAGE_SOURCE,
                ASSET,
                ALL
            }
            export enum NODE_PROCEDURE {
                NONE,
                LAYOUT,
                ALIGNMENT,
                AUTOFIT,
                OPTIMIZATION,
                CUSTOMIZATION,
                ACCESSIBILITY,
                ALL
            }
            export enum NODE_STANDARD {
                NONE,
                CHECKBOX,
                RADIO,
                EDIT,
                SELECT,
                RANGE,
                TEXT,
                IMAGE,
                BUTTON,
                INLINE,
                LINE,
                SPACE,
                BLOCK,
                WEB_VIEW,
                FRAME,
                LINEAR,
                RADIO_GROUP,
                GRID,
                RELATIVE,
                CONSTRAINT,
                SCROLL_HORIZONTAL,
                SCROLL_VERTICAL
            }
            export enum BOX_STANDARD {
                MARGIN_TOP,
                MARGIN_RIGHT,
                MARGIN_BOTTOM,
                MARGIN_LEFT,
                PADDING_TOP,
                PADDING_RIGHT,
                PADDING_BOTTOM,
                PADDING_LEFT,
                MARGIN,
                MARGIN_VERTICAL,
                MARGIN_HORIZONTAL,
                PADDING,
                PADDING_VERTICAL,
                PADDING_HORIZONTAL
            }
            export enum CSS_STANDARD {
                NONE,
                UNIT,
                AUTO,
                LEFT,
                BASELINE,
                PERCENT,
                ZERO
            }
        }
        namespace constant {
            export const MAP_ELEMENT: ObjectMap<number>;
            export const BLOCK_ELEMENT: string[];
            export const INLINE_ELEMENT: string[];
            export const EXT_NAME: StringMap;
        }
        namespace util {
            export function formatString(value: string, ...params: string[]): string;
            export function cameltoLowerCase(value: string): string;
            export function convertCamelCase(value: string, char?: string): string;
            export function convertWord(value: string): string;
            export function capitalize(value: string, upper?: boolean): string;
            export function convertInt(value: any): number;
            export function convertFloat(value: any): number;
            export function convertPX(value: any, fontSize: string): string;
            export function replaceWhiteSpace(value: string): string;
            export function formatPX(value: any): string;
            export function convertAlpha(value: number): string;
            export function convertRoman(value: number): string;
            export function convertEnum(value: number, base: {}, derived: {}): string;
            export function hasBit(value: number, type: number): boolean;
            export function isNumber(value: string | number): value is number;
            export function isString(value: any): value is string;
            export function isUnit(value: string): boolean;
            export function isPercent(value: string): boolean;
            export function includes(source: Null<string>, value: string, delimiter?: string): boolean;
            export function optional(obj: Null<{}>, value: string, type?: string): any;
            export function resolvePath(value: string): string;
            export function trimNull(value: Null<string>): string;
            export function trimString(value: string, char: string): string;
            export function trimStart(value: string, char: string): string;
            export function trimEnd(value: string, char: string): string;
            export function repeat(n: number, value?: string): string;
            export function indexOf(value: string, ...terms: string[]): number;
            export function lastIndexOf(value: string, char?: string): string;
            export function sameValue(obj1: {}, obj2: {}, ...attrs: string[]): boolean;
            export function searchObject(obj: ObjectMap<string>, value: string | StringMap): any[][];
            export function compareObject(obj1: {}, obj2: {}, attr: string): false | any[];
            export function hasValue(value: any): boolean;
            export function withinRange(a: number, b: number, n?: number): boolean;
            export function withinFraction(lower: number, upper: number): boolean;
            export function overwriteDefault(options: {}, namespace: string, attr: string, value: string): void;
            export function partition<T>(list: T[], predicate: (value: T) => boolean): [T[], T[]];
            export function sortAsc<T>(list: T[], ...attrs: string[]): T[];
            export function sortDesc<T>(list: T[], ...attrs: string[]): T[];
        }
        namespace dom {
            export function getBoxRect(): BoxRect;
            export function getClientRect(): BoxDimensionsRect;
            export function getBoxModel(): BoxModel;
            export function setElementCache(element: Null<Element>, attr: string, data: any): void;
            export function getElementCache(element: Null<Element>, attr: string): any;
            export function deleteElementCache(element: Null<Element>, ...attrs: string[]): void;
            export function getNodeFromElement<T>(element: Null<Element>): Null<T>;
            export function getRangeClientRect(element: Element): [Null<BoxDimensionsRect>, boolean];
            export function assignBounds(bounds: BoxDimensionsRect | DOMRect): BoxDimensionsRect;
            export function getStyle(element: Null<Element>, cache?: boolean): CSSStyleDeclaration;
            export function getBoxSpacing(element: Element, complete?: boolean, merge?: boolean): BoxModel;
            export function parseBackgroundUrl(value: string): string;
            export function cssInherit(element: Element, attr: string, tagName?: string, exclude?: string[]): string;
            export function cssParent(element: Element, attr: string, ...styles: string[]): boolean;
            export function cssFromParent(element: Element, attr: string): boolean;
            export function hasFreeFormText(element: Element, maxDepth?: number, whiteSpace?: boolean): boolean;
            export function isPlainText(element: Null<Element>, whiteSpace?: boolean): boolean;
            export function hasLineBreak(element: Null<Element>): boolean;
            export function isLineBreak(element: Null<Element>, excluded?: boolean): boolean;
            export function getElementsBetweenSiblings(firstElement: Null<Element>, secondElement: Element, cacheNode?: boolean, whiteSpace?: boolean): Element[];
            export function isElementVisible(element: Element): boolean;
            export function locateExtension(element: Element, extension: string): Null<HTMLElement>;
        }
        namespace xml {
            export function formatPlaceholder(id: string | number, symbol?: string): string;
            export function replacePlaceholder(value: string, id: string | number, content: string, before?: boolean): string;
            export function removePlaceholders(value: string): string;
            export function replaceIndent(value: string, depth: number): string;
            export function replaceTab(value: string, settings?: {}, preserve?: boolean): string;
            export function replaceEntity(value: string): string;
            export function getTemplateLevel(data: {}, ...levels: string[]): {};
            export function parseTemplate(template: string): ObjectMap<string>;
            export function insertTemplateData(template: ObjectMap<string>, data: {}, index?: string, include?: {}, exclude?: {}): string;
        }
        namespace color {
            export function getColorNearest(value: string): '' | Color;
            export function getByColorName(value: string): '' | Color;
            export function formatRGB({ rgb }: Color): string;
            export function parseRGBA(value: string, opacity?: string): string[];
            export function convertRGBtoHex(value: string): string;
            export function convertHextoRGB(value: string): Null<Color>;
            export function parseHex(value: string): string;
            export function reduceHexToRGB(value: string, percent: number): string;
        }
        namespace nodelist {
            export function siblingIndex<T>(a: T, b: T): number;
            export function outerRegion<T>(list: T[], dimension?: string): ObjectMap<T[]>;
            export function floated<T>(list: T[]): Set<string>;
            export function cleared<T>(list: T[]): Map<T, string>;
            export function textBaseline<T>(list: T[]): T[];
            export function linearX<T>(list: T[], traverse?: boolean): boolean;
            export function linearY<T>(list: T[]): boolean;
        }
    }
}