declare global {
    namespace androme.lib.base {
        export class Application<T extends Node> {
            public settings: Settings;
            public viewController: Controller<T>;
            public resourceHandler: Resource<T>;
            public nodeObject: NodeConstructor<T>;
            public builtInExtensions: ObjectMap<Extension<T>>;
            public renderQueue: ObjectMap<string[]>;
            public loading: boolean;
            public closed: boolean;
            public readonly framework: number;
            public readonly cacheSession: NodeList<T>;
            public readonly cacheProcessing: NodeList<T>;
            public readonly elements: Set<Element>;
            public readonly extensions: Extension<T>[];
            public appName: string;
            public layoutProcessing: FileAsset;
            public readonly layouts: FileAsset[];
            public readonly viewData: ViewData<NodeList<T>>;
            public readonly size: number;
            constructor(framework: number);
            public registerController(controller: Controller<T>): void;
            public registerResource(resource: Resource<T>): void;
            public registerExtension(ext: Extension<Node>): boolean;
            public finalize(): void;
            public saveAllToDisk(): void;
            public reset(): void;
            public parseDocument(...elements: Null<string | Element>[]): FunctionMap<void>;
            public setConstraints(): void;
            public setResources(): void;
            public createCache(rootElement: HTMLElement): boolean;
            public createDocument(): void;
            public writeFrameLayout(node: T, parent: T, children?: boolean): string;
            public writeLinearLayout(node: T, parent: T, horizontal: boolean): string;
            public writeGridLayout(node: T, parent: T, columnCount: number, rowCount?: number): string;
            public writeRelativeLayout(node: T, parent: T): string;
            public writeConstraintLayout(node: T, parent: T): string;
            public writeNode(node: T, parent: T, nodeName: number | string): string;
            public writeFrameLayoutHorizontal(group: T, parent: T, nodes: T[], cleared: Map<T, string>): string;
            public writeFrameLayoutVertical(group: Null<T>, parent: T, nodes: T[], cleared: Map<T, string>): string;
            public createLayoutFile(pathname: string, filename: string, content: string, documentRoot?: boolean): void;
            public createIncludeFile(filename: string, content: string): void;
            public addRenderQueue(id: string, views: string[]): void;
            public preserveRenderPosition(id: string | number, nodes: T[]): void;
            public getExtension(name: string): Extension<T> | undefined;
            public insertNode(element: Element, parent?: T): Null<T>;
            public toString(): string;
        }
    }
}

export {};