interface Asset {
    uri?: string;
}

interface FileAsset extends Asset {
    pathname: string;
    filename: string;
    content: string;
}

interface ImageAsset extends Asset {
    width: number;
    height: number;
    position?: Point;
}

interface SVG {
    element: SVGSVGElement;
    name: string;
    width: number;
    height: number;
    viewBoxWidth: number;
    viewBoxHeight: number;
    opacity: number;
    defs: {
        gradients: Map<string, Gradient>
    };
    children: SVGGroup[];
}

interface SVGGroup {
    element: SVGSVGElement | SVGGElement;
    name: string;
    x?: number;
    y?: number;
    translateX: number;
    translateY: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    skewX: number;
    skewY: number;
    nestedSVG: boolean;
    children: SVGPath[];
}

interface SVGPath {
    element: SVGGraphicsElement;
    name: string;
    fillRule: string;
    fill: string | string[] | ArrayObject<ObjectMap<any[]>>;
    fillOpacity: number;
    stroke: string | string[] | ArrayObject<ObjectMap<any[]>>;
    strokeWidth: string;
    strokeOpacity: number;
    strokeLineCap: string;
    strokeLineJoin: string;
    strokeMiterLimit: string;
    clipRule: string;
    clipPath: boolean;
    d: string;
}

interface Gradient {
    type: string;
    colorStop: ColorStop[];
}

interface LinearGradient extends Gradient {
    angle?: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface RadialGradient extends Gradient {
    shapePosition?: string[];
    cx: number;
    cy: number;
    r: number;
    fx: number;
    fy: number;
}

interface BoxRect {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface BoxDimensions extends BoxRect {
    width: number;
    height: number;
}

interface BoxPosition extends BoxRect {
    horizontal: string;
    vertical: string;
}

interface BoxModel {
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    borderTopWidth?: number;
    borderRightWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
}

interface Flexbox {
    enabled: boolean;
    direction: string;
    basis: string;
    grow: number;
    shrink: number;
    wrap: string;
    alignSelf: string;
    justifyContent: string;
    order: number;
}

interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface Color {
    name: string;
    hex: string;
    rgba?: RGBA;
    hsl?: {
        h: number;
        s: number;
        l: number;
    };
}

interface ColorStop {
    color: string | ColorHexAlpha;
    offset: string;
}

interface ColorHexAlpha {
    valueRGB: string;
    valueRGBA: string;
    valueARGB: string;
    rgba: RGBA;
    alpha: number;
    opaque: boolean;
    visible: boolean;
}

interface BorderAttribute {
    width: string;
    style: string;
    color: string | ColorHexAlpha;
}

interface FontAttribute {
    fontFamily: string;
    fontStyle: string;
    fontSize: string;
    fontWeight: string;
    color: string | ColorHexAlpha;
    backgroundColor: string | ColorHexAlpha;
}

interface BoxStyle {
    border?: BorderAttribute;
    borderTop: BorderAttribute;
    borderRight: BorderAttribute;
    borderBottom: BorderAttribute;
    borderLeft: BorderAttribute;
    borderRadius: string[];
    backgroundColor: string | ColorHexAlpha;
    background?: string;
    backgroundImage?: string[];
    backgroundGradient?: Gradient[];
    backgroundSize: string[];
    backgroundRepeat: string;
    backgroundPositionX: string;
    backgroundPositionY: string;
}

interface ResourceMap {
    strings: Map<string, string>;
    arrays: Map<string, string[]>;
    fonts: Map<string, ObjectMap<boolean>>;
    colors: Map<string, string>;
    styles: Map<string, {}>;
    dimens: Map<string, string>;
    drawables: Map<string, string>;
    images: Map<string, StringMap>;
}

type ExternalData = ObjectMap<any>;
type TemplateData = ObjectMap<any>;