export interface IStringMap {
    [key: string]: string;
}

export interface IBoxModel {
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    borderTopWidth?: number;
    borderRightWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
}

export interface IClientRect {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
    x?: number;
    y?: number;
    minWidth?: string;
    minHeight?: string;
}

export interface IPoint {
    x: number;
    y: number;
}