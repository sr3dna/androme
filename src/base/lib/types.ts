import { BoxModel, Flexbox, Null, ObjectIndex, ObjectMap, PlainFile, Point, StringMap } from '../../lib/types';
import { IExtension } from '../../extension/lib/types';
import Application from '../application';
import Controller from '../controller';
import Resource from '../resource';
import Node from '../node';
import NodeList from '../nodelist';

export type Constructor<T> = new(...args: any[]) => T;
export type FunctionMap = ObjectMap<(...args: any[]) => any>;

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
    setLayout(): void;
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
    attr(obj: string, attr: string, value?: string, overwrite?: boolean): string;
    get(obj: string): StringMap;
    delete(obj: string, ...attrs: string[]): void;
    apply(options: {}): void;
    each(predicate: (value: {}, index?: number) => void, rendered: boolean): this;
    render(parent: {}): void;
    hide(): void;
    data(obj: string, attr: string, value?: any, overwrite?: boolean): any;
    ascend(xml: boolean, levels?: number): {}[];
    cascade(): {}[];
    inherit(node: {}, ...props: string[]): void;
    alignedVertically(previous: {}, cleared?: Map<any, string>, firstNode?: boolean): boolean;
    intersect(rect: ClientRect, dimension?: string): boolean;
    intersectX(rect: ClientRect, dimension?: string): boolean;
    intersectY(rect: ClientRect, dimension?: string): boolean;
    withinX(rect: ClientRect, dimension?: string): boolean;
    withinY(rect: ClientRect, dimension?: string): boolean;
    outsideX(rect: ClientRect, dimension?: string): boolean;
    outsideY(rect: ClientRect, dimension?: string): boolean;
    css(attr: string | object, value?: string): string;
    cssInitial(attr: string, complete?: boolean): string;
    cssParent(attr: string, startChild?: boolean, ignoreHidden?: boolean): string;
    has(attr: string, checkType: number, options?: ObjectMap<any>): boolean;
    isSet(obj: string, attr: string): boolean;
    hasBit(attr: string, value: number): boolean;
    toInt(attr: string, defaultValue?: number, options?: StringMap): number;
    hasAlign(value: number): boolean;
    setExclusions(): void;
    setBounds(calibrate?: boolean): void;
    setDimensions(region?: string[]): void;
    setMultiLine(): void;
    sort(): void;
    getParentElementAsNode(negative?: boolean, containerDefault?: {}): Null<{}>;
    remove(node: {}): void;
    renderAppend(node: {}): void;
    resetBox(region: number, node?: {}, negative?: boolean): void;
    removeElement(): void;
    previousSibling(pageflow?: boolean, lineBreak?: boolean, excluded?: boolean): {} | null;
    nextSibling(pageflow?: boolean, lineBreak?: boolean, excluded?: boolean): {} | null;
    actualLeft(dimension?: string): number;
    actualRight(dimension?: string): number;
}

export interface AppFramework<T extends Node> {
    system: FunctionMap;
    create(): AppBase<T>;
    cached(): AppBase<T>;
}

export interface AppBase<T extends Node> {
    Node: Constructor<T>;
    Controller: Controller<T>;
    Resource: Resource<T>;
    builtInExtensions: ObjectMap<IExtension>;
    settings: ObjectMap<any>;
}

export interface AppCurrent<T extends Node> {
    cache: NodeList<T>;
    settings: ObjectMap<any>;
    application: Application<T>;
}

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