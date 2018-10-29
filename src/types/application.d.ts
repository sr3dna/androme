interface LayoutMapX<T> {
    [key: number]: ObjectIndex<T[]>;
    length: number;
}

type LayoutMapY<T> = Map<number, Map<number, T>>;

interface Settings {
    builtInExtensions: string[];
    supportRTL: boolean;
    renderInlineText: boolean;
    preloadImages: boolean;
    autoSizeBackgroundImage: boolean;
    autoSizePaddingAndBorderWidth: boolean;
    alwaysReevaluateResources: boolean;
    whitespaceHorizontalOffset: number;
    whitespaceVerticalOffset: number;
    supportNegativeLeftTop: boolean;
    floatOverlapDisabled: boolean;
    hideOffScreenElements: boolean;
    collapseUnattributedElements: boolean;
    customizationsOverwritePrivilege: boolean;
    insertSpaces: number;
    handleExtensionsAsync: boolean;
    autoCloseOnWrite: boolean;
    outputDirectory: string;
    outputMainFileName: string;
    outputArchiveFileType: string;
    outputMaxProcessingTime: number;
}

interface SettingsInternal {
    includes: boolean;
    baseTemplate: string;
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
    cache: androme.lib.base.NodeList<T>;
    application: androme.lib.base.Application<T>;
    settings: Settings;
}

interface ExtensionDependency {
    name: string;
    preload: boolean;
}

interface ExtensionResult {
    output: string;
    complete: boolean;
    next?: boolean;
    parent?: Null<{}>;
    renderAs?: androme.lib.base.Node;
    renderOutput?: string;
    include?: boolean;
}

interface ViewData<T> {
    cache: T;
    views: PlainFile[];
    includes: PlainFile[];
}

interface InitialData<T> {
    readonly styleMap: StringMap;
    readonly children: T[];
    readonly bounds: BoxDimensions;
    linear?: BoxDimensions;
    box?: BoxDimensions;
    depth: number;
}

interface NodeConstructor<T> {
    new (id: number, element?: Element, afterInit?: SelfWrapped<T>): T;
}