import { ObjectMapNested } from '../../lib/types';
import View from '../view';

type ConstraintCurrent = {
    adjacent: string,
    orientation: string,
    overwrite: boolean;
};

export type Constraint<T extends View> = {
    horizontal: boolean,
    vertical: boolean,
    current: ConstraintCurrent,
    layoutWidth: boolean;
    layoutHeight: boolean;
    layoutHorizontal: boolean;
    layoutVertical: boolean;
    marginHorizontal: string;
    marginVertical: string;
    guideline: ObjectMapNested<ObjectMapNested<number>>
};