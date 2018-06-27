export interface IExtension {
    name: string;
    application: any;
    node: any;
    parent: any;
    element: HTMLElement | undefined;
    tagNames: string[];
    enabled: boolean;
    options: {};
    is(tagName: string): void;
    require(value: string): void;
    included(element?: HTMLElement): boolean;
    beforeInit(): void;
    init(element: HTMLElement): boolean;
    afterInit(): void;
    condition(): void;
    processNode(mapX?: ObjectIndex<{}>, mapY?: ObjectIndex<{}>): (string | boolean)[];
    processChild(mapX?: ObjectIndex<{}>, mapY?: ObjectIndex<{}>): (string | boolean)[];
    afterRender(): void;
}

export interface BoxModel {
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    borderTopWidth?: number;
    borderRightWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
}

export interface BoxRect {
    top: any;
    right: any;
    bottom: any;
    left: any;
}

export interface ClientRect {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
    x?: number;
    y?: number;
    minWidth?: string;
    minHeight?: string;
}

export interface Point {
    x: number;
    y: number;
}

export interface Flexbox {
    enabled: boolean;
    direction: string;
    basis: string;
    grow: number;
    shrink: number;
    wrap: string;
    alignSelf: string;
    justifyContent: string;
    order: number;
}

export interface BorderAttribute {
    style: string;
    width: string;
    color: string;
}

export interface PlainFile {
    pathname: string;
    filename: string;
    content?: string;
    uri?: string;
}

export interface StringMap {
    [key: string]: string;
}

export interface ObjectMap<T> {
    [key: string]: T;
}

export interface ArrayMap<T> {
    [key: string]: T[];
}

export interface ObjectIndex<T> {
    [key: number]: T;
    length: number;
}

export interface ResourceMap {
    STRINGS: Map<string, string>;
    ARRAYS: Map<string, string[]>;
    FONTS: Map<string, {}>;
    COLORS: Map<string, string>;
    STYLES: Map<string, any>;
    DRAWABLES: Map<string, string>;
    IMAGES: Map<string, {}>;
}

export type RegExpNull = RegExpExecArray | null;