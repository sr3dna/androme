type Null<T> = T | null | undefined;

type Constructor<T> = new(...args: any[]) => T;

type FunctionMap<T> = ObjectMap<(...args: any[]) => T>;

type IteratorPredicate<T, U> = (value: T, index?: number) => U;

type SelfWrapped<T> = (self: T) => void;

type FunctionVoid = (...args: any[]) => void;

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

interface NameValue {
    name: string;
    value: string;
}

interface Point {
    x: number;
    y: number;
}