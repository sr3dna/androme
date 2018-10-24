type Null<T> = T | null | undefined;
type Constructor<T> = new(...args: any[]) => T;
type FunctionMap<T> = ObjectMap<(...args: any[]) => T>;
type IteratorPredicate<T, U> = (value: T, index?: number) => U;

interface StringMap {
    [key: string]: string;
}

interface ObjectMap<T> {
    [key: string]: T;
}

interface ObjectMapNested<T> {
    [key: string]: ObjectMap<T>;
}

interface ObjectIndex<T> {
    [key: number]: T;
}

interface ArrayObject<T> extends Array<T> {
    [key: number]: T;
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

interface NameValue {
    name: string;
    value: string;
}

interface Image {
    width: number;
    height: number;
    uri?: string;
}

interface PlainFile {
    pathname: string;
    filename: string;
    content: string;
    uri?: string;
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

interface Point {
    x: number;
    y: number;
}

interface InitialData<T> {
    readonly styleMap: StringMap;
    readonly children: T[];
    readonly bounds: BoxDimensions;
    linear?: BoxDimensions;
    box?: BoxDimensions;
    depth: number;
}