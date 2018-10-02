import { IExtension } from '../extension/lib/types';
import Application from '../base/application';
import Controller from '../base/controller';
import Resource from '../base/resource';
import Node from '../base/node';
import NodeList from '../base/nodelist';

export type Null<T> = T | null | undefined;

export type FunctionMap = ObjectMap<(...args: any[]) => any>;

export interface AppFramework<T extends Node> {
    system: FunctionMap;
    create(): AppBase<T>;
    cached(): AppBase<T>;
}

export type AppBase<T extends Node> = {
    Node: { new (id: number, api: number, element?: Element): T };
    Controller: Controller<T>;
    Resource: Resource<T>;
    builtInExtensions: ObjectMap<IExtension>;
    settings: ObjectMap<any>;
};

export interface AppCurrent<T extends Node> {
    cache: NodeList<T>;
    settings: ObjectMap<any>;
    application: Application<T>;
}

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

export type ObjectMapNested<T> = {
    [key: string]: ObjectMap<T>;
};

export type ArrayIndex<T> = {
    [key: number]: T;
    length: number;
    push(...items: T[]): number;
    forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
    filter(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T[];
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
    strings: Map<string, string>;
    arrays: Map<string, string[]>;
    fonts: Map<string, {}>;
    colors: Map<string, string>;
    styles: Map<string, any>;
    dimens: Map<string, string>;
    drawables: Map<string, string>;
    images: Map<string, {}>;
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

export type InitialValues<T> = {
    readonly styleMap: StringMap,
    readonly children: T[],
    readonly bounds: ClientRect,
    depth: number,
    linear?: ClientRect,
    box?: ClientRect
};

export type DisplaySettings = {
    supportRTL: boolean;
    autoSizePaddingAndBorderWidth: boolean;
    autoSizeBackgroundImage: boolean;
    ellipsisOnTextOverflow: boolean;
};

export type ControllerSettings = {
    folderLayout: string;
};