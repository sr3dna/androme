import { ListData } from '../../extension/types/data';
import { SettingsAndroid } from '../lib/types';
import View from '../view';
import ResourceHandler from '../resourcehandler';
import { delimitUnit, parseRTL } from '../lib/util';
import { NODE_ANDROID } from '../lib/constant';

import $enum = androme.lib.enumeration;
import $const = androme.lib.constant;
import $util = androme.lib.util;

export default class <T extends View> extends androme.lib.base.extensions.List<T> {
    constructor(name: string, framework = 0, tagNames?: string[], options?: {}) {
        super(name, framework, tagNames, options);
    }

    public processChild(): ExtensionResult {
        const node = this.node;
        const mainData: ListData = node.data($const.EXT_NAME.LIST, 'mainData');
        if (mainData) {
            const parent = this.parent as T;
            const controller = this.application.viewController;
            const settings = <SettingsAndroid> this.application.settings;
            const parentLeft = $util.convertInt(parent.css('paddingLeft')) + $util.convertInt(parent.cssInitial('marginLeft', true));
            let columnCount = 0;
            let paddingLeft = node.marginLeft;
            node.modifyBox($enum.BOX_STANDARD.MARGIN_LEFT, null);
            if (parent.is($enum.NODE_STANDARD.GRID)) {
                columnCount = $util.convertInt(parent.app('columnCount'));
                paddingLeft += parentLeft;
            }
            else if (parent.children[0] === node) {
                paddingLeft += parentLeft;
            }
            const ordinal =
                node.children.find(item =>
                    item.float === 'left' &&
                    $util.convertInt(item.cssInitial('marginLeft', true)) < 0 &&
                    Math.abs($util.convertInt(item.cssInitial('marginLeft', true))) <= $util.convertInt(item.documentParent.cssInitial('marginLeft', true))
                ) as T;
            if (ordinal && mainData.ordinal === '') {
                let output = '';
                ordinal.parent = parent;
                if (ordinal.inlineText || ordinal.children.length === 0) {
                    output = controller.renderNode(ordinal, parent, $enum.NODE_STANDARD.TEXT);
                }
                else if (ordinal.children.every(item => item.pageflow)) {
                    output = controller.renderGroup(ordinal, parent, $enum.NODE_STANDARD.RELATIVE);
                }
                else {
                    output = controller.renderGroup(ordinal, parent, $enum.NODE_STANDARD.CONSTRAINT);
                }
                controller.prependBefore(node.id, output);
                if (columnCount === 3) {
                    node.app('layout_columnSpan', '2');
                }
                paddingLeft += ordinal.marginLeft;
                ordinal.modifyBox($enum.BOX_STANDARD.MARGIN_LEFT, null);
                if (!ordinal.hasWidth && paddingLeft > 0) {
                    ordinal.android('minWidth', $util.formatPX(paddingLeft));
                }
            }
            else {
                const columnWeight = columnCount > 0 ? '0' : '';
                const positionInside = node.css('listStylePosition') === 'inside';
                const listStyleImage = !['', 'none'].includes(node.css('listStyleImage'));
                let image = '';
                let [left, top] = [0, 0];
                if (mainData.imageSrc !== '') {
                    image = ResourceHandler.addImageURL(mainData.imageSrc);
                    [left, top] = ResourceHandler.parseBackgroundPosition(mainData.imagePosition, node.css('fontSize')).map(value => $util.convertInt(value));
                }
                const gravity = (image !== '' && !listStyleImage) || (parentLeft === 0 && node.marginLeft === 0) ? '' : 'right';
                if (gravity === '') {
                    paddingLeft += node.paddingLeft;
                    node.modifyBox($enum.BOX_STANDARD.PADDING_LEFT, null);
                }
                if (left > 0 && paddingLeft > left) {
                    paddingLeft -= left;
                }
                paddingLeft = Math.max(paddingLeft, 20);
                const minWidth = paddingLeft > 0 ? delimitUnit(node.nodeName, parseRTL('min_width', settings), $util.formatPX(paddingLeft), settings) : '';
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
                let marginLeftValue = left > 0 ? $util.formatPX(left) : '';
                const paddingLeftValue = gravity === '' && image === '' ? $util.formatPX(paddingRight)
                                                                        : (paddingLeft === 20 ? '2px' : '');
                const paddingRightValue = gravity === 'right' && paddingLeft > 20 ? $util.formatPX(paddingRight) : '';
                const options = {
                    android: {},
                    app: {
                        layout_columnWeight: columnWeight
                    }
                };
                if (positionInside) {
                    if (marginLeftValue !== '') {
                        marginLeftValue = delimitUnit(node.nodeName, parseRTL('margin_left', settings), marginLeftValue, settings);
                    }
                    controller.prependBefore(
                        node.id,
                        controller.renderNodeStatic(
                            $enum.NODE_STANDARD.SPACE,
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
                        minWidth: delimitUnit(node.nodeName, parseRTL('min_width', settings), $util.formatPX(24), settings)
                    });
                }
                else {
                    Object.assign(options.android, {
                        minWidth,
                        gravity: paddingLeft > 20 ? parseRTL(gravity, settings) : '',
                        [parseRTL('layout_marginLeft', settings)]: marginLeftValue,
                        [parseRTL('paddingLeft', settings)]: paddingLeftValue,
                        [parseRTL('paddingRight', settings)]: paddingRightValue,
                        paddingTop: node.paddingTop > 0 ? $util.formatPX(node.paddingTop) : ''
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
                            layout_marginTop: top > 0 ? $util.formatPX(top) : '',
                            baselineAlignBottom: 'true',
                            scaleType: !positionInside && gravity === 'right' ? 'fitEnd' : 'fitStart'
                        });
                    }
                    else {
                        Object.assign(options.android, { text: mainData.ordinal });
                    }
                    const companion = new View(this.application.cache.nextId, document.createElement('SPAN')) as T;
                    companion.api = node.api;
                    companion.alignmentType = $enum.NODE_ALIGNMENT.SPACE;
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
                            image !== '' ? $enum.NODE_STANDARD.IMAGE
                                         : mainData.ordinal !== '' ? $enum.NODE_STANDARD.TEXT : $enum.NODE_STANDARD.SPACE,
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
        return { output: '', complete: true };
    }

    public beforeInsert() {
        const node = this.node;
        if (node.is($enum.NODE_STANDARD.GRID)) {
            const columnCount = node.app('columnCount');
            const children = node.renderChildren;
            for (let i = 0; i < children.length; i++) {
                const current = children[i];
                const previous = children[i - 1];
                let spaceHeight = 0;
                if (previous) {
                    const marginBottom = $util.convertInt(previous.android('layout_marginBottom'));
                    if (marginBottom > 0) {
                        spaceHeight += $util.convertInt(previous.android('layout_marginBottom'));
                        previous.delete('android', 'layout_marginBottom');
                        previous.modifyBox($enum.BOX_STANDARD.MARGIN_BOTTOM, null);
                    }
                }
                const marginTop = $util.convertInt(current.android('layout_marginTop'));
                if (marginTop > 0) {
                    spaceHeight += marginTop;
                    current.delete('android', 'layout_marginTop');
                    current.modifyBox($enum.BOX_STANDARD.MARGIN_TOP, null);
                }
                if (spaceHeight > 0) {
                    this.application.viewController.prependBefore(
                        current.id,
                        this.application.viewController.renderNodeStatic(
                            $enum.NODE_STANDARD.SPACE,
                            current.renderDepth,
                            {
                                app: { layout_columnSpan: columnCount.toString() }
                            },
                            'match_parent',
                            $util.formatPX(spaceHeight)
                        ),
                        0
                    );
                }
            }
        }
    }

    public afterInsert() {
        const node = this.node;
        if (node.is($enum.NODE_STANDARD.GRID) && node.blockStatic && !node.has('width')) {
            node.android('layout_width', 'match_parent');
        }
    }
}