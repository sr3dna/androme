import ViewBase from './viewbase';

export default class View extends ViewBase(androme.lib.base.Node) {
    constructor(
        id = 0,
        element?: Element)
    {
        super(id, element);
    }
}