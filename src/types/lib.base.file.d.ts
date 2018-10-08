export {};

declare global {
    namespace androme.lib.base {
        export class File<T extends Node> {
            public appName: string;
            public stored: ResourceMap;
            public readonly queue: PlainFile[];
            constructor(directory: string, processingTime: number, compression?: string);
            public saveAllToDisk(data: ViewData<NodeList<T>>): void;
            public layoutAllToXml(data: ViewData<NodeList<T>>, saveToDisk?: boolean): StringMap;
            public resourceAllToXml(saveToDisk?: boolean): StringMap;
            public resourceStringToXml(saveToDisk?: boolean): string;
            public resourceStringArrayToXml(saveToDisk?: boolean): string;
            public resourceFontToXml(saveToDisk?: boolean): string;
            public resourceColorToXml(saveToDisk?: boolean): string;
            public resourceStyleToXml(saveToDisk?: boolean): string;
            public resourceDimenToXml(saveToDisk?: boolean): string;
            public resourceDrawableToXml(saveToDisk?: boolean): string;
            public addFile(pathname: string, filename: string, content: string, uri: string): void;
            public reset(): void;
            public saveToDisk(files: PlainFile[]): void;
        }
    }
}