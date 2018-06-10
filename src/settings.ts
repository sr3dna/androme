import { BUILD_ANDROID, DENSITY_ANDROID } from './lib/constants';

export default {
    targetAPI: BUILD_ANDROID.OREO,
    density: DENSITY_ANDROID.MDPI,
    showAttributes: true,
    horizontalPerspective: true,
    useConstraintLayout: true,
    useConstraintChain: true,
    useConstraintGuideline: true,
    useGridLayout: true,
    useLayoutWeight: true,
    useUnitDP: true,
    useFontAlias: false,
    supportRTL: true,
    numberResourceValue: false,
    excludeTextColor: ['#000000'],
    excludeBackgroundColor: ['#FFFFFF'],
    whitespaceHorizontalOffset: 4,
    whitespaceVerticalOffset: 14,
    chainPackedHorizontalOffset: 4,
    chainPackedVerticalOffset: 14
};