declare global {
    namespace androme.lib.base {
        export class Application<T extends Node> implements AppBase<T> {
            public settings: Settings;
            public viewController: Controller<T>;
            public resourceHandler: Resource<T>;
            public nodeObject: NodeConstructor<T>;
            public builtInExtensions: ObjectMap<Extension<T>>;
            public renderQueue: ObjectMap<string[]>;
            public loading: boolean;
            public closed: boolean;
            public readonly framework: number;
            public readonly cache: NodeList<T>;
            public readonly cacheSession: NodeList<T>;
            public readonly elements: Set<HTMLElement>;
            public readonly extensions: Extension<T>[];
            public appName: string;
            public layoutProcessing: PlainFile;
            public readonly layouts: PlainFile[];
            public readonly viewData: ViewData<NodeList<T>>;
            public readonly size: number;
            public readonly userAgent: number;
            constructor(framework: number);
            public registerController(controller: Controller<T>): void;
            public registerResource(resource: Resource<T>): void;
            public registerExtension(ext: Extension<Node>): void;
            public finalize(): void;
            public reset(): void;
            public setConstraints(): void;
            public resetController(): void;
            public setResources(): void;
            public resetResource(): void;
            public initCache(rootElement: HTMLElement): boolean;
            public createDocument(): void;
            public writeFrameLayout(node: T, parent: T, children?: boolean): string;
            public writeLinearLayout(node: T, parent: T, horizontal: boolean): string;
            public writeGridLayout(node: T, parent: T, columns: number, rows?: number): string;
            public writeRelativeLayout(node: T, parent: T): string;
            public writeConstraintLayout(node: T, parent: T): string;
            public writeNode(node: T, parent: T, nodeName: number | string): string;
            public writeFrameLayoutHorizontal(group: T, parent: T, nodes: T[], cleared: Map<T, string>): string;
            public writeFrameLayoutVertical(group: Null<T>, parent: T, nodes: T[], cleared: Map<T, string>): string;
            public getEmptySpacer(nodeType: number, depth: number, width?: string, height?: string, columnSpan?: number): string;
            public createLayout(filename: string): void;
            public updateLayout(content: string, pathname?: string, documentRoot?: boolean): void;
            public addInclude(filename: string, content: string): void;
            public addRenderQueue(id: string, views: string[]): void;
            public sortByAlignment(children: T[], parent?: T, alignmentType?: number, preserve?: boolean): T[];
            public saveSortOrder(id: string | number, nodes: T[]): void;
            public getExtension(name: string): Extension<T> | undefined;
            public toString(): string;
        }
    }
}

export {};