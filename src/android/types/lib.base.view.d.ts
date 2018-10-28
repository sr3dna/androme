import { Constraint, SettingsAndroid } from './local';

declare global {
    namespace android.lib.base {
        export class View extends androme.lib.base.Node {
            public static documentBody(): View;
            public static getCustomizationValue(api: number, tagName: string, obj: string, attr: string): string;
            public static getControlName(nodeType: number): string;
            public constraint: Constraint;
            public api: number;
            public readonly stringId: string;
            public readonly anchored: boolean;
            public android(attr: string, value?: string, overwrite?: boolean);
            public app(attr: string, value?: string, overwrite?: boolean);
            public formatted(value: string, overwrite?: boolean): void;
            public anchor(position: string, adjacent?: string, orientation?: string, overwrite?: boolean): void;
            public alignParent(position: string, settings: Settings): boolean;
            public horizontalBias(settings: SettingsAndroid): number;
            public verticalBias(settings: SettingsAndroid): number;
            public supported(obj: string, attr: string): boolean;
            public combine(...objs: string[]): string[];
        }
        export class ViewGroup<T extends View> extends View {}
    }
}

export {};