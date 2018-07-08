import Node from '../base/node';

export type Null<T> = T | null | undefined;

export interface IExtension {
    name: string;
    application: any;
    node: Node;
    parent: Null<Node>;
    element: Null<HTMLElement>;
    tagNames: string[];
    enabled: boolean;
    options: ObjectMap<any>;
    dependencies: ExtensionDependency[];
    activityMain: boolean;
    setTarget(node: Node, parent?: Null<Node>, element?: Null<HTMLElement>): void;
    is(node: Node): void;
    require(value: string): void;
    included(element?: HTMLElement): boolean;
    beforeInit(internal: boolean): void;
    init(element: HTMLElement): boolean;
    afterInit(internal: boolean): void;
    condition(): void;
    processNode(mapX?: ObjectIndex<ObjectIndex<Node[]>>, mapY?: ObjectIndex<ObjectIndex<Node[]>>): ExtensionResult;
    processChild(mapX?: ObjectIndex<ObjectIndex<Node[]>>, mapY?: ObjectIndex<ObjectIndex<Node[]>>): ExtensionResult;
    afterRender(): void;
    insert(): void;
    afterInsert(): void;
    finalize(): void;
}

export interface ExtensionDependency {
    name: string;
    init: boolean;
}

export interface ExtensionResult {
    xml: string;
    restart?: boolean;
    proceed?: boolean;
    parent?: Node;
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

export interface BorderAttribute {
    style: string;
    width: string;
    color: string;
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
    length?: number;
}

export interface ArrayMap<T> {
    [key: string]: T[];
}

export interface ArrayIndex<T> {
    [key: number]: T[];
    length?: number;
}

export interface ViewData<T> {
    cache: T[];
    views: PlainFile[];
    includes: PlainFile[];
}

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

export interface Color {
    name: string;
    hex: string;
    rgb: {
        r: number;
        g: number;
        b: number;
    };
    hsl: {
        h: number;
        s: number;
        l: number;
    };
    [key: string]: string | {};
}