export type Null<T> = T | null | undefined;

export interface Inheritable {
    inherit: boolean;
}

export interface BoxModel {
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    borderTopWidth?: number;
    borderRightWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
}

export type BoxRect = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

export type ClientRect = {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
};

export type Point = {
    x: number;
    y: number;
};

export type Flexbox = {
    enabled: boolean;
    direction: string;
    basis: string;
    grow: number;
    shrink: number;
    wrap: string;
    alignSelf: string;
    justifyContent: string;
    order: number;
};

export type NameValue = {
    name: string;
    value: string;
};

export type Image = {
    width: number;
    height: number;
    url?: string;
};

export type PlainFile = {
    pathname: string;
    filename: string;
    content: string;
    uri?: string;
};

export type StringMap = {
    [key: string]: string;
};

export type ObjectMap<T> = {
    [key: string]: T;
};

export type ObjectIndex<T> = {
    [key: number]: T;
};

export type ArrayIndex<T> = {
    [key: number]: T;
    length: number;
};

export type ViewData<T> = {
    cache: T;
    views: PlainFile[];
    includes: PlainFile[];
};

export type LayoutMapX<T> = {
    [key: number]: ObjectIndex<T[]>;
    length: number;
};

export type LayoutMapY<T> = Map<number, Map<number, T>>;

export type ResourceMap = {
    STRINGS: Map<string, string>;
    ARRAYS: Map<string, string[]>;
    FONTS: Map<string, {}>;
    COLORS: Map<string, string>;
    STYLES: Map<string, any>;
    DIMENS: Map<string, string>;
    DRAWABLES: Map<string, string>;
    IMAGES: Map<string, {}>;
};

export type BorderAttribute = {
    style: string;
    width: string;
    color: string[] | string;
};

export type FontAttribute = {
    fontFamily: string;
    fontStyle: string;
    fontSize: string;
    fontWeight: string;
    color: string[] | string;
    backgroundColor: string[] | string;
};

export type BoxStyle = {
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
};

export type DisplaySettings = {
    autoSizePaddingAndBorderWidth: boolean;
    autoSizeBackgroundImage: boolean;
    ellipsisOnTextOverflow: boolean;
};

export type ControllerSettings = {
    folderLayout: string;
};