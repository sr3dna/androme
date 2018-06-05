import { BUILD_ANDROID, DENSITY_ANDROID } from './lib/constants';

const SETTINGS = {
    targetAPI: BUILD_ANDROID.OREO,
    density: DENSITY_ANDROID.MDPI,
    showAttributes: true,
    horizontalPerspective: true,
    useConstraintLayout: true,
    useConstraintChain: true,
    useConstraintGuideline: false,
    useGridLayout: true,
    useLayoutWeight: false,
    useUnitDP: true,
    supportRTL: true,
    numberResourceValue: false,
    whitespaceHorizontalOffset: 4,
    whitespaceVerticalOffset: 14,
    constraintBiasBoxOffset: 14,
    chainPackedHorizontalOffset: 4,
    chainPackedVerticalOffset: 14
};

export default SETTINGS;