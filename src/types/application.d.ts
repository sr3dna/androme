interface Settings {
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

type SettingsInternal = {
    layout: {
        directory: string;
        fileExtension: string;
    }
};

interface AppFramework<T extends androme.lib.base.Node> {
    system: FunctionMap;
    create(): AppBase<T>;
    cached(): AppBase<T>;
}

interface AppBase<T extends androme.lib.base.Node> {
    framework: number;
    application?: androme.lib.base.Application<T>;
    settings: Settings;
    viewController: androme.lib.base.Controller<T>;
    resourceHandler: androme.lib.base.Resource<T>;
    nodeObject: Constructor<T>;
    builtInExtensions: ObjectMap<androme.lib.base.Extension<T>>;
}

interface AppCurrent<T extends androme.lib.base.Node> {
    settings: Settings;
    cache: androme.lib.base.NodeList<T>;
    application: androme.lib.base.Application<T>;
}

type ExtensionDependency = {
    name: string;
    init: boolean;
};

type ExtensionResult = {
    output: string;
    complete: boolean;
    next?: boolean;
    parent?: {};
    include?: boolean;
};

type ViewData<T> = {
    cache: T;
    views: PlainFile[];
    includes: PlainFile[];
};

type LayoutMapX<T> = {
    [key: number]: ObjectIndex<T[]>;
    length: number;
};

type LayoutMapY<T> = Map<number, Map<number, T>>;

type ResourceMap = {
    strings: Map<string, string>;
    arrays: Map<string, string[]>;
    fonts: Map<string, {}>;
    colors: Map<string, string>;
    styles: Map<string, any>;
    dimens: Map<string, string>;
    drawables: Map<string, string>;
    images: Map<string, {}>;
};