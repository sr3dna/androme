import { SettingsAndroid } from './local';

declare global {
    namespace android.lib.base {
        export class Resource<T extends View> extends androme.lib.base.Resource<T> {
            public static formatOptions(options: {}, settings: SettingsAndroid): {};
            public static addString(value: string, name?: string, settings?: SettingsAndroid): string;
            public static addImageSrcSet(element: HTMLImageElement, prefix?: string): string;
            public static addImage(images: StringMap, prefix?: string): string;
            public static addImageURL(value: string, prefix?: string): string;
            public static addColor(hexAlpha: Null<ColorHexAlpha>): string;
            public static getColor(value: string): string;
            public addTheme(template: string, data: {}, options: {}): void;
        }
    }
}

export {};