import { ObjectMapNested } from '../../lib/types';
import View from '../view';
import NodeList from '../../base/nodelist';

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
    marginVertical: string;
    marginHorizontal: string;
    horizontalChain: NodeList<T>;
    verticalChain: NodeList<T>;
    guideline: ObjectMapNested<ObjectMapNested<number>>
};