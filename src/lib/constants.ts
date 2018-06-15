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
    CHECKBOX,
    RADIO,
    BUTTON,
    VIEW,
    SPACE
}

export enum BOX_STANDARD {
    MARGIN_TOP = 2,
    MARGIN_RIGHT = 4,
    MARGIN_BOTTOM = 8,
    MARGIN_LEFT = 16,
    PADDING_TOP = 32,
    PADDING_RIGHT = 64,
    PADDING_BOTTOM = 128,
    PADDING_LEFT = 256
}

export const MAPPING_CHROME = {
    'TEXT': VIEW_STANDARD.TEXT,
    'LABEL': VIEW_STANDARD.TEXT,
    'P': VIEW_STANDARD.TEXT,
    'HR': VIEW_STANDARD.VIEW,
    'IMG': VIEW_STANDARD.IMAGE,
    'SELECT': VIEW_STANDARD.SELECT,
    'INPUT' : {
        'text': VIEW_STANDARD.EDIT,
        'password': VIEW_STANDARD.EDIT,
        'checkbox': VIEW_STANDARD.CHECKBOX,
        'radio': VIEW_STANDARD.RADIO,
        'button': VIEW_STANDARD.BUTTON,
        'submit': VIEW_STANDARD.BUTTON
    },
    'BUTTON': VIEW_STANDARD.BUTTON,
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
    'TEXT'
];

export const enum OVERFLOW_CHROME {
    NONE = 0,
    HORIZONTAL = 2,
    VERTICAL = 4
}