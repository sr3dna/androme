export type ResourceMap = {
    strings: Map<string, string>;
    arrays: Map<string, string[]>;
    fonts: Map<string, ObjectMap<boolean>>;
    colors: Map<string, string>;
    styles: Map<string, StyleStored>;
    dimens: Map<string, string>;
    drawables: Map<string, string>;
    images: Map<string, StringMap>;
};

export type SVG = {
    element: SVGSVGElement;
    name: string;
    width: number;
    height: number;
    viewBoxWidth: number;
    viewBoxHeight: number;
    opacity: number;
    children: SVGGroup[];
};

export type SVGGroup = {
    element: SVGSVGElement | SVGGElement;
    name: string;
    x?: number,
    y?: number,
    translateX: number;
    translateY: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    skewX: number;
    skewY: number;
    nestedSVG: boolean;
    children: SVGPath[];
};

export type SVGPath = {
    element: SVGGraphicsElement;
    name: string;
    color: string;
    fillColor: string;
    fillAlpha: number;
    strokeColor: string;
    strokeWidth: string;
    strokeAlpha: number;
    strokeLineCap: string;
    strokeLineJoin: string;
    strokeMiterLimit: string;
    clipPath: boolean;
    d: string;
};

export type StyleStored = {
    name: string;
    parent?: string;
    attrs: string;
    ids: number[];
};