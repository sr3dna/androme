export {};

declare global {
    namespace androme.lib.base {
        export class Resource<T extends Node> implements AppCurrent<T> {
            public static STORED: ResourceMap;
            public static insertStoredAsset(asset: string, name: string, value: any): string;
            public settings: Settings;
            public cache: NodeList<T>;
            public application: Application<T>;
            public imageDimensions: Map<string, Image>;
            public file: File<T>;
            constructor(file: File<T>);
            public setImageSource(): void;
            public addTheme(template: string, data: {}, options: {}): void;
            public finalize(viewData: ViewData<NodeList<T>>): void;
            public addFile(pathname: string, filename: string, content?: string, uri?: string): void;
            public reset(): void;
            public setBoxSpacing(): void;
            public setBoxStyle(): void;
            public setFontStyle(): void;
            public setValueString(): void;
            public setOptionArray(): void;
            public borderVisible(border?: BorderAttribute): boolean;
            public hasDrawableBackground(object?: BoxStyle): boolean;
        }
    }
}