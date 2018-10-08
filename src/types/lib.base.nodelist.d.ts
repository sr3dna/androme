export {};

declare global {
    namespace androme.lib.base {
        export class NodeList<T extends Node> implements Iterable<T> {
            public static siblingIndex(): number;
            public static outerRegion<T>(list: T[], dimension?: string): ObjectMap<T>;
            public static floated<T>(list: T[]): Set<string>;
            public static cleared<T>(list: T[]): Map<T, string>;
            public static textBaseline<T>(list: T[]): T[];
            public static linearX<T>(list: T[], traverse?: boolean): boolean;
            public static linearY<T>(list: T[]): boolean;
            public parent?: T;
            public delegateAppend?: (nodes: T[]) => void;
            public readonly length: number;
            public readonly list: T[];
            public readonly visible: NodeList<T>;
            public readonly elements: NodeList<T>;
            public readonly nextId: number;
            public readonly linearX: boolean;
            public readonly linearY: boolean;
            constructor(nodes?: T[], parent?: T);
            public [Symbol.iterator]();
            public reset(): void;
            public get(index?: number): T;
            public append(...nodes: T[]): void;
            public prepend(...nodes: T[]): void;
            public remove(start: number, deleteCount?: number): T[];
            public clone(): NodeList<T>;
            public filter(predicate: (value: T) => boolean): NodeList<T>;
            public sort(predicate: (a: T, b: T) => number): NodeList<T>;
            public partition(predicate: (value: T) => boolean): NodeList<T>[];
            public each(predicate: (value: T, index?: number) => void): void;
            public locate(attr: string | FindPredicate<T>, value?: any): Null<T>;
            public clear(): void;
            public sortAsc(...attrs: string[]): this;
            public sortDesc(...attrs: string[]): this;
        }
    }
}