import { ExtensionResult, Null, ObjectMap } from '../../../lib/types';
import Extension from '../../../base/extension';
import View from '../../view';
import ViewList from '../../viewlist';
import { includes, optional } from '../../../lib/util';
import { createPlaceholder, overwriteDefault } from '../lib/util';
import { NODE_RESOURCE } from '../../../lib/constants';
import { NODE_ANDROID } from '../../constants';
import { VIEW_SUPPORT, WIDGET_NAME } from '../lib/constants';

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
        node.apply(this.options[node.element.id]);
        node.excludeResource |= NODE_RESOURCE.FONT_STYLE;
        const nodes = node.children.filter(item => !item.isolated);
        if (nodes.length > 0) {
            const toolbar = this.getToolbar(node);
            let offsetX = 0;
            let offsetHeight = 0;
            let collapsingToolbar = null;
            if (toolbar != null) {
                const extension = this.application.findExtension(WIDGET_NAME.TOOLBAR);
                if (extension != null) {
                    offsetX = toolbar.linear.bottom;
                    offsetHeight = toolbar.bounds.height;
                    if (Math.floor(toolbar.linear.top) === node.box.top) {
                        node.bounds.bottom -= offsetHeight;
                        node.setBounds(true);
                    }
                    collapsingToolbar = (extension.options[toolbar.element.id] != null ? extension.options[toolbar.element.id].collapsingToolbar : null);
                }
            }
            const filename = `${node.nodeId}_content`;
            let include = '';
            let contentNode: Null<T> = null;
            if (this.options.includes == null || this.options.includes) {
                include = controller.renderNodeStatic('include', node.depth + 1, { layout: `@layout/${filename}` });
                contentNode = createPlaceholder(application.cache.nextId, node, nodes);
                contentNode.documentRoot = true;
                contentNode.children.forEach(item => {
                    item.parent = (<T> contentNode);
                    item.depth++;
                    if (offsetHeight > 0 && item.linear.top >= offsetX) {
                        this.adjustBounds(item, offsetHeight);
                        item.cascade().forEach((child: T) => this.adjustBounds(child, offsetHeight));
                    }
                });
                application.cache.list.push(contentNode);
                node.children = node.children.filter(item => item.isolated);
            }
            const options: ObjectMap<any> = { android: {} };
            const optionsCollapsingToolbar = Object.assign({}, collapsingToolbar);
            const [linearX, linearY] = [ViewList.linearX(nodes), ViewList.linearY(nodes)];
            let viewName = '';
            if (application.isLinearXY(linearX, linearY, node, <T[]> nodes)) {
                viewName = NODE_ANDROID.LINEAR;
                options.android.orientation = (linearY ? 'vertical' : 'horizontal');
            }
            else {
                viewName = NODE_ANDROID.CONSTRAINT;
            }
            if (collapsingToolbar != null) {
                overwriteDefault(optionsCollapsingToolbar, 'app', 'layout_behavior', '@string/appbar_scrolling_view_behavior');
                node.android('fitsSystemWindows', 'true');
            }
            overwriteDefault((collapsingToolbar != null ? optionsCollapsingToolbar : options), 'android', 'id', `${node.stringId}_content`);
            const depth = (include !== '' ? 0 : node.depth + 1);
            let content = (include !== '' ? controller.renderNodeStatic(viewName, depth + (collapsingToolbar ? 1 : 0), options, 'match_parent', 'wrap_content', contentNode, true) : '');
            if (collapsingToolbar != null) {
                const scrollView = new View(0, node.api);
                scrollView.documentRoot = true;
                content = controller.renderNodeStatic(NODE_ANDROID.SCROLL_NESTED, depth, optionsCollapsingToolbar, 'match_parent', 'match_parent', scrollView, true).replace('{:0}', content);
            }
            if (include !== '') {
                application.addInclude(filename, content);
                content = include;
            }
            xml = xml.replace(`{:${node.id}}`, `${content}{:${node.id}}`);
        }
        return { xml };
    }

    public afterInsert() {
        const node = (<T> this.node);
        if (node.documentRoot) {
            node.android('layout_width', 'match_parent');
            node.android('layout_height', 'match_parent');
        }
    }

    private getToolbar(node: T): Null<T> {
        const toolbar = (<HTMLElement> Array.from(node.element.children).find((element: HTMLElement) => includes(optional(element, 'dataset.ext'), WIDGET_NAME.TOOLBAR)));
        return (toolbar != null ? (<any> toolbar).__node : null);
    }

    private adjustBounds(node: T, offsetHeight: number) {
        node.bounds.top -= offsetHeight;
        node.bounds.bottom -= offsetHeight;
        node.setBounds(true);
    }
}