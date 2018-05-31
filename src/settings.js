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
    constraintBiasBoxOffset: 14,
    chainPackedHorizontalOffset: 4,
    chainPackedVerticalOffset: 14
};

export default SETTINGS;