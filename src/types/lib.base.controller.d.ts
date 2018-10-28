declare global {
    namespace androme.lib.base {
        export class Controller<T extends Node> implements AppCurrent<T> {
            public static getEnclosingTag(depth: number, controlName: string, id: number, xml?: string, preXml?: string, postXml?: string): string;
            public cache: NodeList<T>;
            public application: Application<T>;
            public settings: Settings;
            public readonly settingsInternal: SettingsInternal;
            public readonly delegateNodeInit: SelfWrapped<T>;
            public createGroup(parent: T, node: T, children: T[]): T;
            public renderGroup(node: T, parent: T, nodeName: number | string, options?: {}): string;
            public renderNode(node: T, parent: T, nodeName: number | string): string;
            public renderNodeStatic(nodeName: number | string, depth: number, options?: {}, width?: string, height?: string, node?: T, children?: boolean): string;
            public renderInclude(node: T, parent: T, name: string): string;
            public renderMerge(name: string, content: string[]): string;
            public renderColumnSpace(depth: number, width?: string, height?: string, columnSpan?: number): string;
            public baseRenderDepth(name: string): number;
            public setConstraints(): void;
            public setBoxSpacing(data: ViewData<NodeList<T>>): void;
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