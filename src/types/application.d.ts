type LayoutMapX<T> = {
    [key: number]: ObjectIndex<T[]>;
    length: number;
};
type LayoutMapY<T> = Map<number, Map<number, T>>;

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

interface SettingsInternal {
    includes: boolean;
    inline: {
        always: string[];
        tagName: string[];
    };
    layout: {
        pathName: string;
        fileExtension: string;
    };
    unsupported: {
        tagName: string[]
    };
}

interface AppFramework<T extends androme.lib.base.Node> {
    lib: ObjectMap<any>;
    system: FunctionMap<any>;
    create(): AppBase<T>;
    cached(): AppBase<T>;
}

interface AppBase<T extends androme.lib.base.Node> {
    application: androme.lib.base.Application<T>;
    framework: number;
    settings: Settings;
}

interface AppCurrent<T extends androme.lib.base.Node> {
    settings: Settings;
    cache: androme.lib.base.NodeList<T>;
    application: androme.lib.base.Application<T>;
}

interface ExtensionDependency {
    name: string;
    init: boolean;
}

interface ExtensionResult {
    output: string;
    complete: boolean;
    next?: boolean;
    parent?: {};
    include?: boolean;
}

interface ViewData<T> {
    cache: T;
    views: PlainFile[];
    includes: PlainFile[];
}

interface NodeConstructor<T> {
    new (id: number, element?: Element): T;
}