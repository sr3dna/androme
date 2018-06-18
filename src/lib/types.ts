export interface IStringMap {
    [key: string]: string;
}

export interface IBoxModel {
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

export interface IClientRect {
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

export interface IPoint {
    x: number;
    y: number;
}

export interface IBorder {
    style: string;
    width: string;
    color: string;
}

export interface IPlainFile {
    pathname: string;
    filename: string;
    content: string;
}

export interface IResourceMap {
    STRINGS: Map<string, string>;
    ARRAYS: Map<string, string[]>;
    FONTS: Map<string, any>;
    COLORS: Map<string, string>;
    STYLES: Map<string, any>;
    DRAWABLES: Map<string, string>;
    IMAGES: Map<string, any>;
}