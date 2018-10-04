import { LayoutMapX, LayoutMapY } from '../../base/lib/types';
import { BoxRect, Inheritable, ObjectMap } from '../../lib/types';

export interface IExtension {
    readonly dependencies: ExtensionDependency[];
    readonly subscribers: Set<{}>;
    readonly subscribersChild: Set<{}>;
    readonly name: string;
    readonly framework: number;
    application: any;
    node: {};
    parent?: {};
    element?: Element;
    tagNames: string[];
    options: ObjectMap<any>;
    documentRoot: boolean;
    setTarget(node: {}, parent?: {}, element?: Element): void;
    getData(): void;
    is(node: {}): boolean;
    require(value: string): void;
    included(element?: Element): boolean;
    beforeInit(internal?: boolean): void;
    init(element: Element): boolean;
    afterInit(internal?: boolean): void;
    condition(): boolean;
    processNode(mapX?: LayoutMapX<{}>, mapY?: LayoutMapY<{}>): ExtensionResult;
    processChild(mapX?: LayoutMapX<{}>, mapY?: LayoutMapY<{}>): ExtensionResult;
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
    parent?: {};
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