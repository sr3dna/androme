declare global {
    namespace androme {
        export function setFramework(module: any, cached?: boolean): void;
        export function parseDocument(...elements: Null<string | Element>[]): FunctionMap<void>;
        export function registerExtension(ext: any): boolean;
        export function registerExtensionAsync(ext: any): boolean;
        export function configureExtension(name: string, options: {}): boolean;
        export function getExtension(name: string): {};
        export function ext(module: any): {} | boolean;
        export function ready(): boolean;
        export function close(): void;
        export function reset(): void;
        export function saveAllToDisk(): void;
        export function toString(): string;
        export const settings: Settings;
    }
}

export {};