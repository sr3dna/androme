import { Constructor } from '../lib/types';
import Node from '../base/node';
import ViewBase from './viewbase';

export default class View extends ViewBase(Node as Constructor<Node>) {
    constructor(
        id = 0,
        element?: Element)
    {
        super(id, element);
    }
}