import { ResourceMap } from './resource';

declare global {
    namespace androme.lib.base {
        export class File<T extends Node> {
            public static downloadToDisk(data: Blob, filename: string, mime?: string): void;
            public settings: Settings;
            public appName: string;
            public stored: ResourceMap;
            public readonly queue: PlainFile[];
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

export {};