import { SettingsAndroid } from './types/local';

import { BUILD_ANDROID, DENSITY_ANDROID } from './lib/enumeration';

const settings: SettingsAndroid = {
    builtInExtensions: [
        'androme.external',
        'androme.origin',
        'androme.custom',
        'androme.accessibility',
        'androme.list',
        'androme.table',
        'androme.grid'
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
    constraintPercentAccuracy: 4,
    supportNegativeLeftTop: true,
    floatOverlapDisabled: false,
    collapseUnattributedElements: true,
    customizationsOverwritePrivilege: false,
    showAttributes: true,
    insertSpaces: 4,
    convertPixels: 'dp',
    handleExtensionsAsync: true,
    autoCloseOnWrite: true,
    outputDirectory: 'app/src/main',
    outputMainFileName: 'activity_main.xml',
    outputArchiveFileType: 'zip',
    outputMaxProcessingTime: 30
};

export default settings;