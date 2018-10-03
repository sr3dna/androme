import { IExtension } from '../extension/lib/types';
import Application from '../base/application';
import Controller from '../base/controller';
import Resource from '../base/resource';
import Node from '../base/node';
import NodeList from '../base/nodelist';

export type Null<T> = T | null | undefined;
export type Constructor<T> = new(...args: any[]) => T;

export interface INode extends BoxModel {
    id: number;
    style: CSSStyleDeclaration;
    styleMap: StringMap;
    nodeId: string;
    nodeType: number;
    alignmentType: number;
    depth: number;
    siblingIndex: number;
    renderIndex: number;
    renderPosition: number;
    box: ClientRect;
    bounds: ClientRect;
    linear: ClientRect;
    excludeSection: number;
    excludeProcedure: number;
    excludeResource: number;
    renderExtension: Set<IExtension>;
    companion: {};
    documentRoot: boolean;
    auto: boolean;
    visible: boolean;
    excluded: boolean;
    rendered: boolean;
    children: {}[];
    constraint: ObjectMap<any>;
    readonly initial: InitialValues<{}>;
    readonly renderChildren: {}[];
    readonly controlName: string;
    readonly documentParent: {};
    readonly renderParent: {};
    readonly linearHorizontal: boolean;
    readonly linearVertical: boolean;
    readonly layoutHorizontal: boolean;
    readonly layoutVertical: boolean;
    readonly inlineWidth: boolean;
    readonly inlineHeight: boolean;
    readonly blockWidth: boolean;
    readonly blockHeight: boolean;
    readonly parent: {};
    readonly nodeName: string;
    readonly element: Element;
    readonly baseElement: Element;
    readonly tagName: string;
    readonly hasElement: boolean;
    readonly domElement: boolean;
    readonly documentBody: boolean;
    readonly renderAs: {};
    readonly renderDepth: number;
    readonly dataset: DOMStringMap;
    readonly extension: string;
    readonly flex: Flexbox;
    readonly viewWidth: number;
    readonly viewHeight: number;
    readonly hasWidth: boolean;
    readonly hasHeight: boolean;
    readonly lineHeight: number;
    readonly display: string;
    readonly position: string;
    readonly top: number | null;
    readonly right: number | null;
    readonly bottom: number | null;
    readonly left: number | null;
    readonly marginTop: number;
    readonly marginRight: number;
    readonly marginBottom: number;
    readonly marginLeft: number;
    readonly borderTopWidth: number;
    readonly borderRightWidth: number;
    readonly borderBottomWidth: number;
    readonly borderLeftWidth: number;
    readonly paddingTop: number;
    readonly paddingRight: number;
    readonly paddingBottom: number;
    readonly paddingLeft: number;
    readonly pageflow: boolean;
    readonly siblingflow: boolean;
    readonly inline: boolean;
    readonly inlineElement: boolean;
    readonly inlineStatic: boolean;
    readonly inlineText: boolean;
    readonly plainText: boolean;
    readonly imageElement: boolean;
    readonly lineBreak: boolean;
    readonly textElement: boolean;
    readonly block: boolean;
    readonly blockStatic: boolean;
    readonly alignOrigin: boolean;
    readonly alignNegative: boolean;
    readonly autoMargin: boolean;
    readonly autoMarginLeft: boolean;
    readonly autoMarginRight: boolean;
    readonly autoMarginHorizontal: boolean;
    readonly autoMarginVertical: boolean;
    readonly floating: boolean;
    readonly float: string;
    readonly textContent: string;
    readonly overflowX: boolean;
    readonly overflowY: boolean;
    readonly baseline: boolean;
    readonly baselineInside: boolean;
    readonly multiLine: boolean;
    readonly preserveWhiteSpace: boolean;
    readonly actualHeight: number;
    readonly singleChild: boolean;
    readonly dir: string;
    readonly nodes: {}[];
    readonly length: number;
    readonly previousElementSibling: Element | null;
    readonly nextElementSibling: Element | null;
    readonly firstElementChild: Element | null;
    readonly lastElementChild: Element | null;
    readonly center: Point;
    setNodeType(viewName: string): void;
    setLayout(width?: number, height?: number): void;
    setAlignment(settings: DisplaySettings): void;
    setBoxSpacing(settings: DisplaySettings): void;
    applyOptimizations(options: DisplaySettings): void;
    applyCustomizations(overwrite: boolean): void;
    modifyBox(region: number | string, offset: number | null, negative?: boolean): void;
    valueBox(region: number): string[];
    clone(id?: number, children?: boolean): {};
    init(): void;
    is(...views: number[]): boolean;
    of(nodeType: number, ...alignmentType: number[]): boolean;
    attr(obj: string, attr: string, value: string, overwrite: boolean): string;
    get(obj: string): StringMap;
    delete(obj: string, ...attrs: string[]): void;
    apply(options: {}): void;
    each(predicate: (value: {}, index?: number) => void, rendered: boolean): this;
    render(parent: {}): void;
    hide(): void;
    data(obj: string, attr: string, value?: any, overwrite?: boolean): any;
    ascend(xml: boolean, levels: number): {}[];
    cascade(): {}[];
    inherit(node: {}, ...props: string[]): void;
    alignedVertically(previous: {}, cleared: Map<any, string>, firstNode: boolean): boolean;
    intersect(rect: ClientRect, dimension: string): boolean;
    intersectX(rect: ClientRect, dimension: string): boolean;
    intersectY(rect: ClientRect, dimension: string): boolean;
    withinX(rect: ClientRect, dimension: string): boolean;
    withinY(rect: ClientRect, dimension: string): boolean;
    outsideX(rect: ClientRect, dimension: string): boolean;
    outsideY(rect: ClientRect, dimension: string): boolean;
    css(attr: string | object, value?: string): string;
    cssInitial(attr: string, complete?: boolean): string;
    cssParent(attr: string, startChild: boolean, ignoreHidden: boolean): string;
    has(attr: string, checkType: number, options?: ObjectMap<any>): boolean;
    isSet(obj: string, attr: string): boolean;
    hasBit(attr: string, value: number): boolean;
    toInt(attr: string, defaultValue: number, options?: StringMap): number;
    hasAlign(value: number): boolean;
    setExclusions(): void;
    setBounds(calibrate?: boolean): void;
    setDimensions(region: string[]): void;
    setMultiLine(): void;
    sort(): void;
    getParentElementAsNode(negative: boolean, containerDefault?: {}): Null<{}>;
    remove(node: {}): void;
    renderAppend(node: {}): void;
    resetBox(region: number, node?: {}, negative?: boolean): void;
    removeElement(): void;
    previousSibling(pageflow: boolean, lineBreak: boolean, excluded: boolean): {} | null;
    nextSibling(pageflow: boolean, lineBreak: boolean, excluded: boolean): {} | null;
    actualLeft(dimension: string): number;
    actualRight(dimension: string): number;
}

export type FunctionMap = ObjectMap<(...args: any[]) => any>;

export interface AppFramework<T extends Node> {
    system: FunctionMap;
    create(): AppBase<T>;
    cached(): AppBase<T>;
}

export type AppBase<T extends Node> = {
    Node: Constructor<T>;
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