import { BUILD_ANDROID, DENSITY_ANDROID } from './android/constants';

export default {
    targetAPI: BUILD_ANDROID.OREO,
    density: DENSITY_ANDROID.MDPI,
    showAttributes: true,
    horizontalPerspective: true,
    useConstraintLayout: true,
    useConstraintChain: true,
    useConstraintGuideline: true,
    useUnitDP: true,
    useFontAlias: true,
    supportRTL: true,
    numberResourceValue: false,
    alwaysReevaluateResources: false,
    builtInExtensions: ['lists', 'table', 'grid'],
    excludeTextColor: ['#000000'],
    excludeBackgroundColor: ['#FFFFFF'],
    whitespaceHorizontalOffset: 4,
    whitespaceVerticalOffset: 14,
    chainPackedHorizontalOffset: 4,
    chainPackedVerticalOffset: 14,
    autoCloseOnWrite: true,
    outputDirectory: 'app/src/main',
    outputArchiveFileType: 'zip',
    outputMaxProcessingTime: 30,
    outputActivityMainFileName: 'activity_main.xml'
};