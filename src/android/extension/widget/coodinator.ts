import { ExtensionResult } from '../../../lib/types';
import View from '../../view';
import ViewList from '../../viewlist';
import Extension from '../../../base/extension';
import { VIEW_ANDROID } from '../../constants';
import { VIEW_SUPPORT } from '../lib/constants';
import { convertPX } from '../../../lib/util';
import parseRTL from '../../localization';
import SETTINGS from '../../../settings';

type T = View;
type U = ViewList<T>;

export default class Coordinator extends Extension<T, U> {
    constructor(name: string, tagNames?: string[], options?: {}) {
        super(name, tagNames, options);
    }

    public processNode(): ExtensionResult {
        const application = this.application;
        const controller = this.application.controllerHandler;
        const node = (<T> this.node);
        const parent = (<T> this.parent);
        let xml = controller.renderGroup(node, parent, VIEW_SUPPORT.COORDINATOR);
        const nodes = node.children.filter(item => !item.isolated);
        if (nodes.length > 0) {
            const constraint = new View(application.cache.nextId, SETTINGS.targetAPI, null, { viewId: `${node.viewId}_content` });
            constraint.parent = node;
            constraint.inheritBase(node);
            nodes.forEach(item => {
                item.parent = constraint;
                item.depth++;
                constraint.children.push(item);
            });
            node.children = node.children.filter(item => item.isolated);
            application.cache.list.push(constraint);
            const content = controller.getViewStatic(VIEW_ANDROID.CONSTRAINT, constraint.depth, {}, 'match_parent', 'wrap_content', constraint, true);
            xml = xml.replace(`{:${node.id}}`, `${content}{:${node.id}}`);
        }
        return [xml, false, false];
    }

    public processChild(): ExtensionResult {
        const node = (<T> this.node);
        const parent = (<T> this.parent);
        node.renderParent = parent;
        const horizontalBias = node.horizontalBias;
        const verticalBias = node.verticalBias;
        const gravity: string[] = [];
        if (horizontalBias < 0.5) {
            gravity.push(parseRTL('left'));
        }
        else if (horizontalBias > 0.5) {
            gravity.push(parseRTL('right'));
        }
        else {
            gravity.push('center_horizontal');
        }
        if (verticalBias < 0.5) {
            gravity.push('top');
            node.app('layout_dodgeInsetEdges', 'top');
        }
        else if (verticalBias > 0.5) {
            gravity.push('bottom');
        }
        else {
            gravity.push('center_vertical');
        }
        node.android('layout_gravity', (gravity.filter(value => value.indexOf('center') !== -1).length === 2 ? 'center' : gravity.join('|')));
        if (horizontalBias > 0 && horizontalBias < 1 && horizontalBias !== 0.5) {
            if (horizontalBias < 0.5) {
                node.css('marginLeft', convertPX(Math.floor(node.bounds.left - parent.box.left)));
            }
            else {
                node.css('marginRight', convertPX(Math.floor(parent.box.right - node.bounds.right)));
            }
        }
        if (verticalBias > 0 && verticalBias < 1 && verticalBias !== 0.5) {
            if (verticalBias < 0.5) {
                node.css('marginTop', convertPX(Math.floor(node.bounds.top - parent.box.top)));
            }
            else {
                node.css('marginBottom', convertPX(Math.floor(parent.box.bottom - node.bounds.bottom)));
            }
        }
        node.renderParent = false;
        return ['', false, false];
    }
}