import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';

const SETTINGS = {
    builtInExtensions: [
        'androme.external',
        'androme.custom',
        'androme.list',
        'androme.table',
        'androme.grid',
        'androme.widget'
    ],
    targetAPI: BUILD_ANDROID.OREO,
    density: DENSITY_ANDROID.MDPI,
    useConstraintLayout: true,
    useConstraintGuideline: true,
    useConstraintChain: true,
    useUnitDP: true,
    useFontAlias: true,
    supportRTL: true,
    dimensResourceValue: true,
    numberResourceValue: false,
    alwaysReevaluateResources: true,
    excludeTextColor: ['#000000'],
    excludeBackgroundColor: ['#FFFFFF'],
    collapseUnattributedElements: false,
    horizontalPerspective: true,
    linearHorizontalTopOffset: 4,
    whitespaceHorizontalOffset: 4,
    whitespaceVerticalOffset: 16,
    constraintPercentAccuracy: 4,
    chainPackedHorizontalOffset: 4,
    chainPackedVerticalOffset: 16,
    showAttributes: true,
    autoCloseOnWrite: true,
    insertSpaces: 4,
    outputDirectory: 'app/src/main',
    outputActivityMainFileName: 'activity_main.xml',
    outputArchiveFileType: 'zip',
    outputMaxProcessingTime: 30
};

export default SETTINGS;