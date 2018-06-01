import { BUILD_ANDROID, DENSITY_ANDROID } from './lib/constants';

const SETTINGS = {
    targetAPI: BUILD_ANDROID.OREO,
    density: DENSITY_ANDROID.MDPI,
    showAttributes: true,
    useConstraintLayout: true,
    useConstraintChain: true,
    useGridLayout: true,
    useLayoutWeight: true,
    useUnitDP: true,
    useRTL: true,
    numberResourceValue: false,
    whitespaceHorizontalOffset: 4,
    whitespaceVerticalOffset: 16,
    constraintBiasBoxOffset: 16,
    chainPackedHorizontalOffset: 4,
    chainPackedVerticalOffset: 16
};

export default SETTINGS;