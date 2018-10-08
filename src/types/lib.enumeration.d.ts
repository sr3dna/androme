export {};

declare global {
    namespace androme.lib.enumeration {
        export enum APP_FRAMEWORK {
            UNIVERSAL,
            ANDROID
        }
        export enum APP_SECTION {
            NONE,
            INCLUDE,
            DOM_TRAVERSE,
            EXTENSION,
            RENDER,
            ALL
        }
        export enum NODE_ALIGNMENT {
            NONE,
            EXTENDABLE,
            HORIZONTAL,
            VERTICAL,
            ABSOLUTE,
            FLOAT,
            SEGMENTED,
            PERCENT,
            TOP,
            RIGHT,
            BOTTOM,
            LEFT,
            SINGLE,
            MULTILINE,
            SPACE
        }
        export enum NODE_RESOURCE {
            NONE,
            BOX_STYLE,
            BOX_SPACING,
            FONT_STYLE,
            VALUE_STRING,
            OPTION_ARRAY,
            IMAGE_SOURCE,
            ASSET,
            ALL
        }
        export enum NODE_PROCEDURE {
            NONE,
            LAYOUT,
            ALIGNMENT,
            AUTOFIT,
            OPTIMIZATION,
            CUSTOMIZATION,
            ACCESSIBILITY,
            ALL
        }
        export enum NODE_STANDARD {
            NONE,
            CHECKBOX,
            RADIO,
            EDIT,
            SELECT,
            RANGE,
            TEXT,
            IMAGE,
            BUTTON,
            INLINE,
            LINE,
            SPACE,
            BLOCK,
            WEB_VIEW,
            FRAME,
            LINEAR,
            RADIO_GROUP,
            GRID,
            RELATIVE,
            CONSTRAINT,
            SCROLL_HORIZONTAL,
            SCROLL_VERTICAL
        }
        export enum BOX_STANDARD {
            MARGIN_TOP,
            MARGIN_RIGHT,
            MARGIN_BOTTOM,
            MARGIN_LEFT,
            PADDING_TOP,
            PADDING_RIGHT,
            PADDING_BOTTOM,
            PADDING_LEFT,
            MARGIN,
            MARGIN_VERTICAL,
            MARGIN_HORIZONTAL,
            PADDING,
            PADDING_VERTICAL,
            PADDING_HORIZONTAL
        }
        export enum CSS_STANDARD {
            NONE,
            UNIT,
            AUTO,
            LEFT,
            BASELINE,
            PERCENT,
            ZERO
        }
    }
}