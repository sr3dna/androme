export type Null<T> = T | null | undefined;

export interface Inheritable {
    inherit: boolean;
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
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface ClientRect {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
    [key: string]: number;
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

export interface BasicData {
    name: string;
    value: string;
}

export interface Image {
    width: number;
    height: number;
    url: string;
}

export interface PlainFile {
    pathname: string;
    filename: string;
    content: string;
    uri?: string;
}

export interface StringMap {
    [key: string]: string;
}

export interface ObjectMap<T> {
    [key: string]: T;
}

export interface ObjectIndex<T> {
    [key: number]: T;
}

export interface ArrayIndex<T> {
    [key: number]: T;
    length: number;
}

export interface ViewData<T> {
    cache: T;
    views: PlainFile[];
    includes: PlainFile[];
}

export interface LayoutMapX<T> {
    [key: number]: ObjectIndex<T[]>;
    length: number;
}

export type LayoutMapY<T> = Map<number, Map<number, T>>;

export interface ResourceMap {
    STRINGS: Map<string, string>;
    ARRAYS: Map<string, string[]>;
    FONTS: Map<string, {}>;
    COLORS: Map<string, string>;
    STYLES: Map<string, any>;
    DIMENS: Map<string, string>;
    DRAWABLES: Map<string, string>;
    IMAGES: Map<string, {}>;
}

export interface BorderAttribute {
    style: string;
    width: string;
    color: string[] | string;
}

export interface FontAttribute {
    fontFamily: string;
    fontStyle: string;
    fontSize: string;
    fontWeight: string;
    color: string[] | string;
    backgroundColor: string[] | string;
}

export interface BoxStyle {
    border?: BorderAttribute;
    borderTop: BorderAttribute;
    borderRight: BorderAttribute;
    borderBottom: BorderAttribute;
    borderLeft: BorderAttribute;
    borderRadius: string[];
    backgroundColor: string[] | string;
    backgroundImage: string;
    backgroundSize: string[];
    backgroundRepeat: string;
    backgroundPosition: string;
}

export interface ControllerSettings {
    folderLayout: string;
}
