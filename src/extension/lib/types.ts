import Node from '../../base/node';
import { ArrayIndex, BoxRect, Inheritable, Null, ObjectIndex, ObjectMap } from '../../lib/types';

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
    documentRoot: boolean;
    setTarget(node: Node, parent?: Null<Node>, element?: Null<HTMLElement>): void;
    getData(): void;
    is(node: Node): void;
    require(value: string): void;
    included(element?: HTMLElement): boolean;
    beforeInit(internal?: boolean): void;
    init(element: HTMLElement): boolean;
    afterInit(internal?: boolean): void;
    condition(): void;
    processNode(mapX?: ArrayIndex<ObjectIndex<Node[]>>, mapY?: ArrayIndex<ObjectIndex<Node[]>>): ExtensionResult;
    processChild(mapX?: ArrayIndex<ObjectIndex<Node[]>>, mapY?: ArrayIndex<ObjectIndex<Node[]>>): ExtensionResult;
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