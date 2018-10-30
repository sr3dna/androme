interface ResourceMap {
    strings: Map<string, string>;
    arrays: Map<string, string[]>;
    fonts: Map<string, ObjectMap<boolean>>;
    colors: Map<string, string>;
    styles: Map<string, ResourceStyleData>;
    dimens: Map<string, string>;
    drawables: Map<string, string>;
    images: Map<string, StringMap>;
}

interface ResourceStyleData {
    name: string;
    parent?: string;
    attrs: string;
    ids: number[];
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

interface BoxPosition extends BoxRect {
    horizontal: string;
    vertical: string;
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

interface SVG {
    element: SVGSVGElement;
    name: string;
    width: number;
    height: number;
    viewBoxWidth: number;
    viewBoxHeight: number;
    opacity: number;
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
    gradient: Gradient[];
    d: string;
}

interface Gradient {
    type: string;
    colorStop: ColorStop[];
}

interface GradientLinear extends Gradient {
    angle: number;
}

interface GradientRadial extends Gradient {
    shapePosition: string[];
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
    color: ColorHexAlpha;
    percent: number;
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

interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface PlainFile {
    pathname: string;
    filename: string;
    content: string;
    uri?: string;
}

interface Image {
    width: number;
    height: number;
    uri?: string;
    position?: Point;
}