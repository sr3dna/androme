import { ExtensionResult, ListData } from '../../extension/lib/types';
import List from '../../extension/list';
import View from '../view';
import ResourceAndroid from '../resource';
import { convertInt, formatPX } from '../../lib/util';
import { delimitDimens, parseRTL } from '../lib/util';
import { NODE_ALIGNMENT, NODE_STANDARD } from '../../base/lib/constants';
import { BOX_STANDARD } from '../../lib/constants';
import { NODE_ANDROID } from '../constants';
import { EXT_NAME } from '../../extension/lib/constants';

export default class ListAndroid<T extends View> extends List<T> {
    constructor(name: string, framework = 0, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const node = this.node;
        const mainData: ListData = node.data(EXT_NAME.LIST, 'mainData');
        if (mainData != null) {
            const parent = this.parent as T;
            const controller = this.application.Controller;
            const parentLeft = convertInt(parent.css('paddingLeft')) + convertInt(parent.cssInitial('marginLeft', true));
            let columnCount = 0;
            let paddingLeft = node.marginLeft;
            node.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
            if (parent.is(NODE_STANDARD.GRID)) {
                columnCount = convertInt(parent.app('columnCount'));
                paddingLeft += parentLeft;
            }
            else if (parent.children[0] === node) {
                paddingLeft += parentLeft;
            }
            const ordinal =
                node.children.find(item =>
                    item.float === 'left' &&
                    convertInt(item.cssInitial('marginLeft', true)) < 0 &&
                    Math.abs(convertInt(item.cssInitial('marginLeft', true))) <= convertInt(item.documentParent.cssInitial('marginLeft', true))
                ) as T;
            if (ordinal && mainData.ordinal === '') {
                let xml = '';
                ordinal.parent = parent;
                if (ordinal.inlineText || ordinal.children.length === 0) {
                    xml = controller.renderNode(ordinal, parent, NODE_STANDARD.TEXT);
                }
                else if (ordinal.children.every(item => item.pageflow)) {
                    xml = controller.renderGroup(ordinal, parent, NODE_STANDARD.RELATIVE);
                }
                else {
                    xml = controller.renderGroup(ordinal, parent, NODE_STANDARD.CONSTRAINT);
                }
                controller.prependBefore(node.id, xml);
                if (columnCount === 3) {
                    node.app('layout_columnSpan', '2');
                }
                paddingLeft += ordinal.marginLeft;
                ordinal.modifyBox(BOX_STANDARD.MARGIN_LEFT, null);
                if (!ordinal.hasWidth && paddingLeft > 0) {
                    ordinal.android('minWidth', formatPX(paddingLeft));
                }
            }
            else {
                const settings = this.application.settings;
                const columnWeight = columnCount > 0 ? '0' : '';
                const positionInside = node.css('listStylePosition') === 'inside';
                const listStyleImage = !['', 'none'].includes(node.css('listStyleImage'));
                let image = '';
                let [left, top] = [0, 0];
                if (mainData.imageSrc !== '') {
                    image = ResourceAndroid.addImageURL(mainData.imageSrc);
                    [left, top] = ResourceAndroid.parseBackgroundPosition(mainData.imagePosition, node.css('fontSize')).map(value => convertInt(value));
                }
                const gravity = (image !== '' && !listStyleImage) || (parentLeft === 0 && node.marginLeft === 0) ? '' : 'right';
                if (gravity === '') {
                    paddingLeft += node.paddingLeft;
                    node.modifyBox(BOX_STANDARD.PADDING_LEFT, null);
                }
                if (left > 0 && paddingLeft > left) {
                    paddingLeft -= left;
                }
                paddingLeft = Math.max(paddingLeft, 20);
                const minWidth = paddingLeft > 0 ? delimitDimens(node.nodeName, parseRTL('min_width', settings), formatPX(paddingLeft), settings) : '';
                const paddingRight = (() => {
                    if (paddingLeft <= 24) {
                        return 6;
                    }
                    else if (paddingLeft <= 32) {
                        return 8;
                    }
                    else {
                        return 10;
                    }
                })();
                let marginLeftValue = left > 0 ? formatPX(left) : '';
                const paddingLeftValue = gravity === '' && image === '' ? formatPX(paddingRight) : '';
                const paddingRightValue = gravity === 'right' && paddingLeft > 20 ? formatPX(paddingRight) : '';
                const options = {
                    android: {},
                    app: {
                        layout_columnWeight: columnWeight
                    }
                };
                if (positionInside) {
                    if (marginLeftValue !== '') {
                        marginLeftValue = delimitDimens(node.nodeName, parseRTL('margin_left', settings), marginLeftValue, this.application.settings);
                    }
                    controller.prependBefore(
                        node.id,
                        controller.renderNodeStatic(
                            NODE_STANDARD.SPACE,
                            parent.renderDepth + 1,
                            {
                                android: {
                                    minWidth,
                                    [parseRTL('layout_marginLeft', settings)]: marginLeftValue
                                },
                                app: { layout_columnWeight: columnWeight }
                            },
                            'wrap_content',
                            'wrap_content'
                        )
                    );
                    Object.assign(options.android, {
                        minWidth: delimitDimens(node.nodeName, parseRTL('min_width', settings), formatPX(24), this.application.settings)
                    });
                }
                else {
                    Object.assign(options.android, {
                        minWidth,
                        gravity: paddingLeft > 20 ? parseRTL(gravity, settings) : '',
                        [parseRTL('layout_marginLeft', settings)]: marginLeftValue,
                        [parseRTL('paddingLeft', settings)]: paddingLeftValue,
                        [parseRTL('paddingRight', settings)]: paddingRightValue
                    });
                    if (columnCount === 3) {
                        node.app('layout_columnSpan', '2');
                    }
                }
                if (node.tagName === 'DT' && image === '') {
                    node.app('layout_columnSpan', columnCount.toString());
                }
                else {
                    if (image !== '') {
                        Object.assign(options.android, {
                            src: `@drawable/${image}`,
                            layout_marginTop: top > 0 ? formatPX(top) : '',
                            baselineAlignBottom: 'true',
                            scaleType: !positionInside && gravity === 'right' ? 'fitEnd' : 'fitStart'
                        });
                    }
                    else {
                        Object.assign(options.android, { text: mainData.ordinal });
                    }
                    const companion = new View(this.application.cache.nextId, node.api, document.createElement('SPAN')) as T;
                    companion.alignmentType = NODE_ALIGNMENT.SPACE;
                    companion.nodeName = `${node.tagName}_ORDINAL`;
                    companion.setNodeType(NODE_ANDROID.SPACE);
                    companion.inherit(node, 'style');
                    if (mainData.ordinal !== '' && !/[A-Za-z0-9]+\./.test(mainData.ordinal) && companion.toInt('fontSize') > 12) {
                        companion.css('fontSize', '12px');
                    }
                    node.companion = companion;
                    this.application.cache.append(companion);
                    controller.prependBefore(
                        node.id,
                        controller.renderNodeStatic(
                            image !== '' ? NODE_STANDARD.IMAGE
                                         : mainData.ordinal !== '' ? NODE_STANDARD.TEXT : NODE_STANDARD.SPACE,
                            parent.renderDepth + 1,
                            options,
                            'wrap_content',
                            'wrap_content',
                            companion
                        )
                    );
                }
            }
            if (columnCount > 0) {
                node.app('layout_columnWeight', '1');
            }
        }
        return { xml: '', complete: true };
    }

    public beforeInsert() {
        const node = this.node;
        if (node.is(NODE_STANDARD.GRID)) {
            const columnCount = node.app('columnCount');
            const children = node.renderChildren;
            for (let i = 0; i < children.length; i++) {
                const current = children[i];
                const previous = children[i - 1];
                let spaceHeight = 0;
                if (previous != null) {
                    const marginBottom = convertInt(previous.android('layout_marginBottom'));
                    if (marginBottom > 0) {
                        spaceHeight += convertInt(previous.android('layout_marginBottom'));
                        previous.delete('android', 'layout_marginBottom');
                        previous.modifyBox(BOX_STANDARD.MARGIN_BOTTOM, null);
                    }
                }
                const marginTop = convertInt(current.android('layout_marginTop'));
                if (marginTop > 0) {
                    spaceHeight += marginTop;
                    current.delete('android', 'layout_marginTop');
                    current.modifyBox(BOX_STANDARD.MARGIN_TOP, null);
                }
                if (spaceHeight > 0) {
                    this.application.Controller.prependBefore(
                        current.id,
                        this.application.Controller.renderNodeStatic(
                            NODE_STANDARD.SPACE,
                            current.renderDepth,
                            {
                                app: { layout_columnSpan: columnCount.toString() }
                            },
                            'match_parent',
                            formatPX(spaceHeight)
                        ),
                        0
                    );
                }
            }
        }
    }

    public afterInsert() {
        const node = this.node;
        if (node.is(NODE_STANDARD.GRID) && node.blockStatic && !node.has('width')) {
            node.android('layout_width', 'match_parent');
        }
    }
}