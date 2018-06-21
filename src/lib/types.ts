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

export interface ObjectIndex {
    [key: number]: {};
    length: number;
}

export interface ObjectMap {
    [key: string]: {};
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