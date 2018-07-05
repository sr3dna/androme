import { ObjectMap } from './types';

export enum VIEW_STANDARD {
    FRAME = 1,
    LINEAR,
    CONSTRAINT,
    GUIDELINE,
    RELATIVE,
    GRID,
    SCROLL_VERTICAL,
    SCROLL_HORIZONTAL,
    SCROLL_NESTED,
    RADIO_GROUP,
    TEXT,
    EDIT,
    IMAGE,
    SELECT,
    RANGE,
    CHECKBOX,
    RADIO,
    BUTTON,
    VIEW,
    SPACE
}

export enum VIEW_RESOURCE {
    BOX_STYLE = 2,
    BOX_SPACING = 4,
    FONT_STYLE = 8,
    VALUE_STRING = 16,
    OPTION_ARRAY = 32,
    IMAGE_SOURCE = 64,
    ALL = 126
}

export enum BOX_STANDARD {
    MARGIN_TOP = 2,
    MARGIN_RIGHT = 4,
    MARGIN_BOTTOM = 8,
    MARGIN_LEFT = 16,
    PADDING_TOP = 32,
    PADDING_RIGHT = 64,
    PADDING_BOTTOM = 128,
    PADDING_LEFT = 256,
    MARGIN = 2 | 4 | 8 | 16,
    MARGIN_VERTICAL = 2 | 8,
    MARGIN_HORIZONTAL = 4 | 16,
    PADDING = 32 | 64 | 128 | 256,
    PADDING_VERTICAL = 32 | 128,
    PADDING_HORIZONTAL = 64 | 256
}

export const MAPPING_CHROME: ObjectMap<number> = {
    'PLAINTEXT': VIEW_STANDARD.TEXT,
    'HR': VIEW_STANDARD.VIEW,
    'IMG': VIEW_STANDARD.IMAGE,
    'SELECT': VIEW_STANDARD.SELECT,
    'RANGE': VIEW_STANDARD.RANGE,
    'TEXT': VIEW_STANDARD.EDIT,
    'PASSWORD': VIEW_STANDARD.EDIT,
    'NUMBER': VIEW_STANDARD.EDIT,
    'EMAIL': VIEW_STANDARD.EDIT,
    'SEARCH': VIEW_STANDARD.EDIT,
    'URL': VIEW_STANDARD.EDIT,
    'CHECKBOX': VIEW_STANDARD.CHECKBOX,
    'RADIO': VIEW_STANDARD.RADIO,
    'BUTTON': VIEW_STANDARD.BUTTON,
    'SUBMIT': VIEW_STANDARD.BUTTON,
    'RESET': VIEW_STANDARD.BUTTON,
    'TEXTAREA': VIEW_STANDARD.EDIT
};

export const BLOCK_CHROME = [
    'ADDRESS',
    'ARTICLE',
    'ASIDE',
    'BLOCKQUOTE',
    'CANVAS',
    'DD',
    'DIV',
    'DL',
    'DT',
    'FIELDSET',
    'FIGCAPTION',
    'FIGURE',
    'FOOTER',
    'FORM',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HEADER',
    'LI',
    'MAIN',
    'NAV',
    'OL',
    'OUTPUT',
    'P',
    'PRE',
    'SECTION',
    'TABLE',
    'TFOOT',
    'UL',
    'VIDEO'
];

export const INLINE_CHROME = [
    'STRONG',
    'B',
    'EM',
    'CITE',
    'DFN',
    'I',
    'BIG',
    'SMALL',
    'FONT',
    'BLOCKQUOTE',
    'TT',
    'A',
    'U',
    'SUP',
    'SUB',
    'STRIKE',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'DEL',
    'LABEL',
    'PLAINTEXT'
];

export const enum OVERFLOW_CHROME {
    NONE = 0,
    HORIZONTAL = 2,
    VERTICAL = 4
}