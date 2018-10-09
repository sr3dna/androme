import * as $enum from '../lib/enumeration';
import * as $const from '../lib/constant';

declare global {
    namespace androme.lib {
        namespace enumeration {
            export import APP_FRAMEWORK = $enum.APP_FRAMEWORK;
            export import APP_SECTION = $enum.APP_SECTION;
            export import NODE_ALIGNMENT = $enum.NODE_ALIGNMENT;
            export import NODE_RESOURCE = $enum.NODE_RESOURCE;
            export import NODE_PROCEDURE = $enum.NODE_PROCEDURE;
            export import NODE_STANDARD = $enum.NODE_STANDARD;
            export import BOX_STANDARD = $enum.BOX_STANDARD;
            export import CSS_STANDARD = $enum.CSS_STANDARD;
        }
        namespace constant {
            export import MAP_ELEMENT = $const.MAP_ELEMENT;
            export import BLOCK_ELEMENT = $const.BLOCK_ELEMENT;
            export import INLINE_ELEMENT = $const.INLINE_ELEMENT;
            export import EXT_NAME = $const.EXT_NAME;
        }
    }
}