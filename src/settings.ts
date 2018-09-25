import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';

const SETTINGS = {
    builtInExtensions: [
        'androme.external',
        'androme.origin',
        'androme.custom',
        'androme.accessibility',
        'androme.list',
        'androme.table',
        'androme.grid',
        'androme.widget'
    ],
    targetAPI: BUILD_ANDROID.OREO,
    density: DENSITY_ANDROID.MDPI,
    supportRTL: true,
    dimensResourceValue: true,
    numberResourceValue: false,
    fontAliasResourceValue: true,
    alwaysReevaluateResources: true,
    renderInlineText: true,
    ellipsisOnTextOverflow: true,
    preloadImages: true,
    autoSizeBackgroundImage: true,
    autoSizePaddingAndBorderWidth: true,
    whitespaceHorizontalOffset: 3.5,
    whitespaceVerticalOffset: 16,
    constraintChainDisabled: false,
    constraintChainPackedHorizontalOffset: 3.5,
    constraintChainPackedVerticalOffset: 16,
    constraintCirclePositionAbsolute: false,
    constraintSupportNegativeLeftTop: true,
    constraintPercentAccuracy: 4,
    floatOverlapDisabled: false,
    collapseUnattributedElements: true,
    showAttributes: true,
    customizationsOverwritePrivilege: false,
    autoCloseOnWrite: true,
    insertSpaces: 4,
    convertPixels: 'dp',
    outputDirectory: 'app/src/main',
    outputActivityMainFileName: 'activity_main.xml',
    outputArchiveFileType: 'zip',
    outputMaxProcessingTime: 30
};

export default SETTINGS;