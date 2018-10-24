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
    backgroundColor: string[] | string;
    backgroundImage?: string;
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
    style: string;
    width: string;
    color: string | string[];
}

interface FontAttribute {
    fontFamily: string;
    fontStyle: string;
    fontSize: string;
    fontWeight: string;
    color: string | string[];
    backgroundColor: string | string[];
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
    d: string;
}

interface Gradient {
    type: string;
    startColor: string[];
    startColorStop: string | undefined;
    endColor: string[];
    endColorStop: string | undefined;
}

interface GradientLinear extends Gradient {
    angle: number;
}

interface GradientRadial extends Gradient {
    shapePosition: string[];
    centerColor: string[];
    centerColorStop: string | undefined;
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
    rgb?: RGB;
    hsl?: {
        h: number;
        s: number;
        l: number;
    };
}

interface RGB {
    r: number;
    g: number;
    b: number;
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
}