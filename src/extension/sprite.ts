import { DOM_REGEX, EXT_NAME } from '../lib/constant';

import { hasValue } from '../lib/util';
import { convertClientUnit, cssResolveUrl } from '../lib/dom';

import Node from '../base/node';
import Resource from '../base/resource';
import Extension from '../base/extension';

export default abstract class Sprite<T extends Node> extends Extension<T> {
    public condition() {
        const node = this.node;
        let valid = false;
        if (node.hasWidth && node.hasHeight && node.children.length === 0 && !node.inlineText) {
            let url = node.css('backgroundImage');
            if (!url || url === 'none') {
                url = '';
                const match = DOM_REGEX.CSS_URL.exec(node.css('background'));
                if (match) {
                    url = match[0];
                }
            }
            if (url !== '') {
                url = cssResolveUrl(url);
                const image = <ImageAsset> this.application.cacheImage.get(url);
                if (image) {
                    const fontSize = node.css('fontSize');
                    const width = convertClientUnit(node.has('width') ? node.css('width') : node.css('minWidth'), node.bounds.width, fontSize);
                    const height = convertClientUnit(node.has('height') ? node.css('width') : node.css('minHeight'), node.bounds.height, fontSize);
                    const position = Resource.parseBackgroundPosition(`${node.css('backgroundPositionX')} ${node.css('backgroundPositionY')}`, node.bounds, fontSize);
                    if (width > 0 && position.left <= 0 && image.width > width &&
                        height > 0 && position.top <= 0 && image.height > height)
                    {
                        image.position = { x: position.left, y: position.top };
                        node.data(EXT_NAME.SPRITE, 'image', image);
                        valid = true;
                    }
                }
            }
        }
        return valid && (!hasValue(node.dataset.ext) || this.included(<HTMLElement> node.element));
    }
}