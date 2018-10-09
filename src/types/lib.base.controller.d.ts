declare global {
    namespace androme.lib.base {
        export class Controller<T extends Node> implements AppCurrent<T> {
            public settings: Settings;
            public cache: NodeList<T>;
            public application: Application<T>;
            public readonly baseTemplate: string;
            public readonly supportInline: string[];
            public readonly supportInclude: boolean;
            public readonly settingsInternal: SettingsInternal;
            public initNode(node: T): void;
            public createGroup(parent: T, node: T, children: T[]): T;
            public renderGroup(node: T, parent: T, nodeName: number | string, options?: {}): string;
            public renderNode(node: T, parent: T, nodeName: number | string): string;
            public renderNodeStatic(nodeName: number | string, depth: number, options?: {}, width?: string, height?: string, node?: T, children?: boolean): string;
            public renderInclude(node: T, parent: T, name: string): string;
            public renderMerge(name: string, content: string[]): string;
            public baseRenderDepth(name: string): number;
            public setConstraints(): void;
            public setBoxSpacing(data: ViewData<NodeList<T>>): void;
            public setDimensions(data: ViewData<NodeList<T>>): void;
            public getEmptySpacer(nodeType: number, depth: number, width?: string, height?: string, columnSpan?: number): string;
            public finalize(data: ViewData<NodeList<T>>): void;
            public reset(): void;
            public appendRenderQueue(output: string): string;
            public prependBefore(id: number, output: string, index?: number): void;
            public appendAfter(id: number, output: string, index?: number): void;
            public hasAppendProcessing(id: number): boolean;
        }
    }
}

export {};