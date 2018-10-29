declare global {
    namespace androme.lib.base {
        export class Extension<T extends Node> {
            public application: Application<T>;
            public tagNames: string[];
            public options: ObjectMap<any>;
            public documentRoot: boolean;
            public readonly framework: number;
            public readonly name: string;
            public readonly dependencies: ExtensionDependency[];
            public readonly subscribers: Set<T>;
            public readonly subscribersChild: Set<T>;
            public readonly node: T;
            public readonly parent: T | undefined;
            public readonly element: Element | undefined;
            constructor(name: string, framework: number, tagNames?: string[], options?: {});
            public setTarget(node?: T, parent?: T, element?: Element): void;
            public getData(): StringMap;
            public is(node: T): boolean;
            public require(value: string, init?: boolean): void;
            public included(element?: Element): boolean;
            public beforeInit(init?: boolean): void;
            public init(element: HTMLElement): boolean;
            public afterInit(init?: boolean): void;
            public condition(): boolean;
            public processNode(mapX?: LayoutMapX<T>, mapY?: LayoutMapY<T>): ExtensionResult;
            public processChild(mapX?: LayoutMapX<T>, mapY?: LayoutMapY<T>): ExtensionResult;
            public afterRender(): void;
            public beforeInsert(): void;
            public afterInsert(): void;
            public finalize(): void;
        }
        namespace extensions {
            export class Accessibility<T extends Node> extends Extension<T> {}
            export class Button<T extends Node> extends Extension<T> {}
            export class Custom<T extends Node> extends Extension<T> {}
            export class External<T extends Node> extends Extension<T> {}
            export class Grid<T extends Node> extends Extension<T> {}
            export class List<T extends Node> extends Extension<T> {}
            export class Nav<T extends Node> extends Extension<T> {}
            export class Origin<T extends Node> extends Extension<T> {}
            export class Percent<T extends Node> extends Extension<T> {}
            export class Sprite<T extends Node> extends Extension<T> {}
            export class Table<T extends Node> extends Extension<T> {}
        }
    }
}

export {};