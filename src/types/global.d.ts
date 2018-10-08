type Null<T> = T | null | undefined;

type Constructor<T> = new(...args: any[]) => T;

type StringMap = {
    [key: string]: string;
};

type ObjectMap<T> = {
    [key: string]: T;
};

type ObjectIndex<T> = {
    [key: number]: T;
};

type ObjectMapNested<T> = {
    [key: string]: ObjectMap<T>;
};

type ArrayIndex<T> = {
    [key: number]: T;
    length: number;
    push(...items: T[]): number;
    forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
    filter(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T[];
};

type FunctionMap = ObjectMap<(...args: any[]) => any>;

type FindPredicate<T> = (value: T, index?: number) => boolean;

type BoxRect = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

type BoxDimensionsRect = {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
};

type Flexbox = {
    enabled: boolean;
    direction: string;
    basis: string;
    grow: number;
    shrink: number;
    wrap: string;
    alignSelf: string;
    justifyContent: string;
    order: number;
};

type NameValue = {
    name: string;
    value: string;
};

type Image = {
    width: number;
    height: number;
    url?: string;
};

type PlainFile = {
    pathname: string;
    filename: string;
    content: string;
    uri?: string;
};

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

type BoxStyle = {
    border?: BorderAttribute;
    borderTop: BorderAttribute;
    borderRight: BorderAttribute;
    borderBottom: BorderAttribute;
    borderLeft: BorderAttribute;
    borderRadius: string[];
    backgroundColor: string[] | string;
    backgroundImage: string;
    backgroundSize: string[];
    backgroundRepeat: string;
    backgroundPosition: string;
};

type BorderAttribute = {
    style: string;
    width: string;
    color: string | string[];
};

type FontAttribute = {
    fontFamily: string;
    fontStyle: string;
    fontSize: string;
    fontWeight: string;
    color: string | string[];
    backgroundColor: string | string[];
};

type Color = {
    name: string;
    hex: string;
    rgb?: {
        r: number;
        g: number;
        b: number;
    };
    hsl?: {
        h: number;
        s: number;
        l: number;
    };
};

type Point = {
    x: number;
    y: number;
};

type InitialValues<T> = {
    readonly styleMap: StringMap,
    readonly children: T[],
    readonly bounds: BoxDimensionsRect,
    depth: number,
    linear?: BoxDimensionsRect,
    box?: BoxDimensionsRect
};