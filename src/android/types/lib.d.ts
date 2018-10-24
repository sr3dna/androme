import { SettingsAndroid } from './local';

import * as $enum from '../lib/enumeration';
import * as $const from '../lib/constant';

declare global {
    namespace android {
        namespace lib {
            namespace enumeration {
                export import BUILD_ANDROID = $enum.BUILD_ANDROID;
                export import DENSITY_ANDROID = $enum.DENSITY_ANDROID;
            }
            namespace constant {
                export import NODE_ANDROID = $const.NODE_ANDROID;
                export import VIEW_SUPPORT = $const.VIEW_SUPPORT;
                export import BOX_ANDROID = $const.BOX_ANDROID;
                export import AXIS_ANDROID = $const.AXIS_ANDROID;
                export import XMLNS_ANDROID = $const.XMLNS_ANDROID;
                export import FONT_ANDROID = $const.FONT_ANDROID;
                export import FONTALIAS_ANDROID = $const.FONTALIAS_ANDROID;
                export import FONTREPLACE_ANDROID = $const.FONTREPLACE_ANDROID;
                export import FONTWEIGHT_ANDROID = $const.FONTWEIGHT_ANDROID;
                export import WEBVIEW_ANDROID = $const.WEBVIEW_ANDROID;
                export import RESERVED_JAVA = $const.RESERVED_JAVA;
                export import DRAWABLE_PREFIX = $const.DRAWABLE_PREFIX;
            }
            namespace util {
                export function resetId(): void;
                export function generateId(section: string, name: string, start: number): string;
                export function stripId(value: Null<string>): string;
                export function convertUnit(value: any, dpi?: number, font?: boolean): string;
                export function delimitUnit(nodeName: string, attr: string, size: string, settings: SettingsAndroid): string;
                export function replaceUnit(value: string, settings: Settings, font?: boolean): string;
                export function calculateBias(start: number, end: number, accuracy: number): number;
                export function parseRTL(value: string, settings: Settings): string;
            }
        }
    }
}

export {};