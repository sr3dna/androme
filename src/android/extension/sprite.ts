import { NODE_ANDROID } from '../lib/constant';

import View from '../view';
import ViewController from '../viewcontroller';
import ResourceHandler from '../resourcehandler';

import $enum = androme.lib.enumeration;
import $const = androme.lib.constant;
import $util = androme.lib.util;

export default class <T extends View> extends androme.lib.base.extensions.Sprite<T> {
    public processNode(): ExtensionResult {
        const node = this.node;
        const parent = this.parent as T;
        const image = <Image> node.data($const.EXT_NAME.SPRITE, 'image');
        let output = '';
        let container: Null<T>;
        if (image && image.uri && image.position) {
            container = new View(this.application.cacheProcessing.nextId, node.element) as T;
            container.api = node.api;
            container.siblingIndex = node.siblingIndex;
            container.nodeName = node.nodeName;
            container.inherit(node, 'initial', 'base', 'data', 'style', 'styleMap');
            container.setNodeType(NODE_ANDROID.FRAME);
            container.excludeResource |= $enum.NODE_RESOURCE.IMAGE_SOURCE;
            parent.replaceChild(node, container);
            container.render(parent);
            this.application.cacheProcessing.append(container);
            node.parent = container;
            node.nodeType = $enum.NODE_STANDARD.IMAGE;
            node.setNodeType(NODE_ANDROID.IMAGE);
            node.css({
                position: 'static',
                top: 'auto',
                right: 'auto',
                bottom: 'auto',
                left: 'auto',
                display: 'inline-block',
                width: $util.formatPX(image.width),
                height: $util.formatPX(image.height),
                marginTop: $util.formatPX(image.position.y),
                marginRight: '0px',
                marginBottom: '0px',
                marginLeft: $util.formatPX(image.position.x),
                paddingTop: '0px',
                paddingRight: '0px',
                paddingBottom: '0px',
                paddingLeft: '0px',
                borderTopStyle: 'none',
                borderRightStyle: 'none',
                borderBottomStyle: 'none',
                borderLeftStyle: 'none',
                borderRadius: '0px',
                backgroundPositionX: '0px',
                backgroundPositionY: '0px',
                backgroundColor: 'transparent'
            });
            node.excludeProcedure |= $enum.NODE_PROCEDURE.OPTIMIZATION;
            node.excludeResource |= $enum.NODE_RESOURCE.FONT_STYLE | $enum.NODE_RESOURCE.BOX_STYLE;
            node.android('src', `@drawable/${ResourceHandler.addImage({ mdpi: image.uri })}`);
            output = ViewController.getEnclosingTag(container.renderDepth, NODE_ANDROID.FRAME, container.id, `{:${container.id}}`);
        }
        return { output, parent: container, complete: true };
    }
}