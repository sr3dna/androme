import { LayoutMapX, LayoutMapY } from '../../base/lib/types';
import { BoxRect, Inheritable, ObjectMap } from '../../lib/types';
import Node from '../../base/node';

type T = Node;

export interface IExtension {
    readonly dependencies: ExtensionDependency[];
    readonly subscribers: Set<T>;
    readonly subscribersChild: Set<T>;
    name: string;
    application: any;
    node: T;
    parent?: T;
    element?: Element;
    tagNames: string[];
    options: ObjectMap<any>;
    documentRoot: boolean;
    setTarget(node: T, parent?: T, element?: Element): void;
    getData(): void;
    is(node: T): boolean;
    require(value: string): void;
    included(element?: Element): boolean;
    beforeInit(internal?: boolean): void;
    init(element: Element): boolean;
    afterInit(internal?: boolean): void;
    condition(): boolean;
    processNode(mapX?: LayoutMapX<T>, mapY?: LayoutMapY<T>): ExtensionResult;
    processChild(mapX?: LayoutMapX<T>, mapY?: LayoutMapY<T>): ExtensionResult;
    afterRender(): void;
    beforeInsert(): void;
    afterInsert(): void;
    finalize(): void;
}

export type ExtensionDependency = {
    name: string;
    init: boolean;
};

export type ExtensionResult = {
    xml: string;
    complete: boolean;
    next?: boolean;
    parent?: Node;
    include?: boolean;
};

export type GridData = {
    columnEnd: number[];
    columnCount: number;
    padding: BoxRect;
};

export interface GridCellData extends Inheritable {
    rowSpan: number;
    columnSpan: number;
    index: number;
    cellFirst: boolean;
    cellLast: boolean;
    rowEnd: boolean;
    rowStart: boolean;
}

export type ListData = {
    ordinal: string;
    imageSrc: string;
    imagePosition: string;
};