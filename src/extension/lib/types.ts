import Node from '../../base/node';
import { BoxRect, Inheritable, LayoutMapX, LayoutMapY, ObjectMap } from '../../lib/types';

type T = Node;

export interface IExtension {
    name: string;
    application: any;
    node: Node;
    parent?: Node;
    element?: HTMLElement;
    tagNames: string[];
    options: ObjectMap<any>;
    dependencies: ExtensionDependency[];
    documentRoot: boolean;
    setTarget(node: Node, parent?: Node, element?: HTMLElement): void;
    getData(): void;
    is(node: Node): void;
    require(value: string): void;
    included(element?: HTMLElement): boolean;
    beforeInit(internal?: boolean): void;
    init(element: HTMLElement): boolean;
    afterInit(internal?: boolean): void;
    condition(): void;
    processNode(mapX?: LayoutMapX<T>, mapY?: LayoutMapY<T>): ExtensionResult;
    processChild(mapX?: LayoutMapX<T>, mapY?: LayoutMapY<T>): ExtensionResult;
    afterRender(): void;
    beforeInsert(): void;
    afterInsert(): void;
    finalize(): void;
}

export interface ExtensionDependency {
    name: string;
    init: boolean;
}

export interface ExtensionResult {
    xml: string;
    proceed?: boolean;
    parent?: Node;
}

export interface GridData {
    columnEnd: number[];
    columnCount: number;
    padding: BoxRect;
}

export interface GridCellData extends Inheritable {
    rowSpan: number;
    columnSpan: number;
    index: number;
    cellFirst: boolean;
    cellLast: boolean;
    rowEnd: boolean;
    rowStart: boolean;
}