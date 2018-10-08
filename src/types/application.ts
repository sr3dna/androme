export interface Settings {
    builtInExtensions: string[];
    supportRTL: boolean;
    alwaysReevaluateResources: boolean;
    renderInlineText: boolean;
    preloadImages: boolean;
    autoSizeBackgroundImage: boolean;
    autoSizePaddingAndBorderWidth: boolean;
    whitespaceHorizontalOffset: number;
    whitespaceVerticalOffset: number;
    supportNegativeLeftTop: boolean;
    floatOverlapDisabled: boolean;
    collapseUnattributedElements: boolean;
    customizationsOverwritePrivilege: boolean;
    insertSpaces: number;
    autoCloseOnWrite: boolean;
    outputDirectory: string;
    outputMainFileName: string;
    outputArchiveFileType: string;
    outputMaxProcessingTime: number;
}

export type SettingsInternal = {
    layout: {
        directory: string;
        fileExtension: string;
    }
};

export interface AppFramework<T extends lib.base.Node> {
    system: FunctionMap;
    create(): AppBase<T>;
    cached(): AppBase<T>;
}

export interface AppBase<T extends lib.base.Node> {
    framework: number;
    application?: lib.base.Application<T>;
    viewController: lib.base.Controller<T>;
    resourceHandler: lib.base.Resource<T>;
    nodeObject: Constructor<T>;
    builtInExtensions: ObjectMap<lib.base.Extension<lib.base.Node>>;
    settings: Settings;
}

export interface AppCurrent<T extends lib.base.Node> {
    settings: Settings;
    cache: lib.base.NodeList<T>;
    application: lib.base.Application<T>;
}

export type ViewData<T> = {
    cache: T;
    views: PlainFile[];
    includes: PlainFile[];
};

export type LayoutMapX<T> = {
    [key: number]: ObjectIndex<T[]>;
    length: number;
};

export type LayoutMapY<T> = Map<number, Map<number, T>>;

export type ResourceMap = {
    strings: Map<string, string>;
    arrays: Map<string, string[]>;
    fonts: Map<string, {}>;
    colors: Map<string, string>;
    styles: Map<string, any>;
    dimens: Map<string, string>;
    drawables: Map<string, string>;
    images: Map<string, {}>;
};