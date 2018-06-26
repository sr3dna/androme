export interface IExtension {
    application: any;
    name: string;
    node: any;
    parent: any;
    element: HTMLElement | undefined;
    tagNames: string[];
    dependencies: string[];
    enabled: boolean;
    options?: any;
    is(tagName: string): void;
    included(element?: HTMLElement): boolean;
    beforeInit(): void;
    init(element: HTMLElement): boolean;
    afterInit(): void;
    condition(): void;
    processNode(mapX?: any, mapY?: any): any[];
    processChild(mapX?: any, mapY?: any): any[];
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

export interface ObjectMap {
    [key: string]: {};
}

export interface ArrayMap {
    [key: string]: any[];
}

export interface ObjectIndex {
    [key: number]: {};
    length: number;
}

export interface ResourceMap {
    STRINGS: Map<string, string>;
    ARRAYS: Map<string, string[]>;
    FONTS: Map<string, any>;
    COLORS: Map<string, string>;
    STYLES: Map<string, any>;
    DRAWABLES: Map<string, string>;
    IMAGES: Map<string, any>;
}

export type RegExpNull = RegExpExecArray | null;