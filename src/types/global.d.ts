type Null<T> = T | null | undefined;

type Constructor<T> = new(...args: any[]) => T;

type StringMap = {
    [key: string]: string;
};

type ObjectMap<T> = {
    [key: string]: T;
};

type ObjectMapNested<T> = {
    [key: string]: ObjectMap<T>;
};

type ObjectIndex<T> = {
    [key: number]: T;
};

interface ArrayObject<T> extends Array<T> {
    [key: number]: T;
}

type FunctionMap<T> = ObjectMap<(...args: any[]) => T>;

type IteratorPredicate<T> = (value: T, index?: number) => boolean;

type BoxRect = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

type BoxDimensions = {
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
    backgroundPositionX: string;
    backgroundPositionY: string;
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
    rgb?: RGB;
    hsl?: {
        h: number;
        s: number;
        l: number;
    };
};

type RGB = {
    r: number,
    g: number,
    b: number
};

type Point = {
    x: number;
    y: number;
};

type InitialData<T> = {
    readonly styleMap: StringMap,
    readonly children: T[],
    readonly bounds: BoxDimensions,
    linear?: BoxDimensions,
    box?: BoxDimensions,
    depth: number
};