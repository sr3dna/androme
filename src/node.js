import { WIDGET_ANDROID, BUILD_ANDROID, INHERIT_ANDROID, MAPPING_CHROME, API_ANDROID, FIXED_ANDROID } from './lib/constants';
import * as Util from './lib/util';
import { getRangeBounds, parseStyle } from './lib/element';
import * as Resource from './resource';
import RTL from './localization';

export default class Node {
    constructor(id, element, api, options = {}) {
        let style = {};
        let styleMap = {};
        if (element != null) {
            style = window.getComputedStyle(element);
            styleMap = element.styleMap || {};
            for (const inline of element.style) {
                styleMap[Util.hyphenToCamelCase(inline)] = element.style[inline];
            }
        }
        else {
            element = {};
        }
        this.id = id;
        this.element = element;
        this.api = api;
        this.depth = 0;
        this.style = style;
        this.styleMap = styleMap;
        this.visible = true;
        this.styleAttributes = [];
        this.label = null;
        this.constraint = {};
        this.wrapNode = null;
        this.parentIndex = Number.MAX_VALUE;

        this._tagName = null;
        this._parent = null;
        this._parentOriginal = null;
        this._flex = null;
        this._overflow = null;
        this._namespaces = new Set();

        Object.assign(this, options);

        if (options.element != null || arguments[1] != null) {
            this.element.androidNode = this;
        }
    }

    add(obj, attr, value, overwrite = true) {
        const name = `_${obj || '_'}`;
        if (this[name] == null) {
            this._namespaces.add(obj);
            this[name] = {};
        }
        if (Util.hasValue(value)) {
            if (!this.supported(obj, attr)) {
                return false;
            }
            if (!overwrite && this[name][attr] != null) {
                return null;
            }
            this[name][attr] = value;
        }
        return this[name][attr];
    }
    delete(obj, ...attributes) {
        const name = `_${obj}`;
        if (this[name] != null) {
            if (typeof attributes[0] == 'object') {
                for (const key in attributes[0]) {
                    delete this[name][attributes[0][key]];
                }
            }
            else {
                for (const attr of attributes) {
                    if (attr.indexOf('*') != -1) {
                        for (const [key] of Util.search(this[name], attr)) {
                            delete this[name][key];
                        }
                    }
                    else {
                        delete this[name][attr];
                    }
                }
            }
        }
        return this;
    }
    attr(value, overwrite = true) {
        const match = value.match(/^(?:([a-z]+):)?([a-zA-Z_]+)="((?:@+?[a-z]+\/)?.+)"$/);
        if (match != null) {
            this.add(match[1] || '_', match[2], match[3], overwrite);
        }
        return this;
    }
    android(attr, value, overwrite = true) {
        if (arguments.length == 0) {
            return this._android;
        }
        else {
            const result = this.add('android', attr, value, overwrite);
            if (arguments.length >= 2) {
                return this;
            }
            else {
                return result;
            }
        }
    }
    app(attr, value, overwrite = true) {
        if (arguments.length == 0) {
            return this._app;
        }
        else {
            const result = this.add('app', attr, value, overwrite);
            if (arguments.length >= 2) {
                return this;
            }
            else {
                return result;
            }
        }
    }
    combine() {
        const result = [];
        this._namespaces.forEach(value => {
            const obj = this[`_${value}`];
            for (const attr in obj) {
                if (value != '_') {
                    result.push(`${value}:${attr}="${obj[attr]}"`);
                }
                else {
                    result.push(`${attr}="${obj[attr]}"`);
                }
            }
        });
        result.sort();
        return result;
    }
    css(attr, value) {
        if (arguments.length == 2) {
            if (Util.hasValue(value)) {
                this.styleMap[attr] = value;
            }
            return this;
        }
        else {
            return (this.styleMap[attr] || this.style[attr]);
        }
    }
    supported(obj, attr) {
        for (let i = this.api + 1; i < BUILD_ANDROID.LATEST; i++) {
            const version = API_ANDROID[i];
            if (version != null && version[obj] != null && version[obj].includes(attr)) {
                return false;
            }
        }
        return true;
    }
    applyCustomizations() {
        const api = API_ANDROID[this.api];
        if (api != null) {
            const customizations = api.customizations[this.widgetName];
            if (customizations != null) {
                for (const obj in customizations) {
                    for (const attr in customizations[obj]) {
                        this.add(obj, attr, customizations[obj][attr], false);
                    }
                }
            }
        }
    }
    render(parent) {
        if (Node.is(parent)) {
            if (parent.isView(WIDGET_ANDROID.LINEAR) && parent.id != 0) {
                switch (this.widgetName) {
                    case WIDGET_ANDROID.LINEAR:
                    case WIDGET_ANDROID.RADIO_GROUP:
                        parent.linearRows.push(this);
                        break;
                }
            }
            this.renderParent = parent;
            this.renderDepth = (parent.id == 0 ? 0 : parent.renderDepth + 1);
        }
    }
    hide() {
        this.renderParent = true;
        this.visible = false;
    }
    ascend() {
        const result = [];
        let current = this.parent;
        while (current != null) {
            if (current.id != 0) {
                result.push(current);
                current = current.parent;
            }
            else {
                break;
            }
        }
        return result;
    }
    cascade() {
        function cascade(node) {
            const current = [...node.children];
            node.children.forEach(item => current.push(...cascade(item)));
            return current;
        }
        return cascade(this);
    }
    expandToFit() {
        let [width, height] = [this.children.reduce((a, b) => Math.max(a, b.linear.right), 0), this.children.reduce((a, b) => Math.max(a, b.linear.bottom), 0)];
        switch (this.style.position) {
            case 'static':
            case 'relative':
                width -= this.linear.left;
                height -= this.linear.top;
                break;
        }
        width += this.paddingRight + this.borderRightWidth;
        height += this.paddingBottom + this.borderBottomWidth;
        let calibrate = false;
        if (this.viewWidth < width) {
            if (this.bounds.width < width) {
                this.bounds.width = width;
                this.bounds.right = this.bounds.left + this.bounds.width;
                calibrate = true;
            }
            else {
                width = this.bounds.width;
            }
            if (this.parent.id != 0 && this.parentOriginal.bounds.width > width) {
                this.constraint.minWidth = 'match_parent';
            }
            else {
                this.constraint.minWidth = Util.formatPX(width);
            }
        }
        if (this.viewHeight < height) {
            if (this.bounds.height < height) {
                this.bounds.height = height;
                this.bounds.bottom = this.bounds.top + this.bounds.height;
                calibrate = true;
            }
            else {
                height = this.bounds.height;
            }
            if (this.parent.id != 0 && this.parentOriginal.bounds.height > height) {
                this.constraint.minHeight = 'match_parent';
            }
            else {
                this.constraint.minHeight = Util.formatPX(height);
            }
        }
        if (calibrate) {
            this.setBounds(null, true);
        }
    }
    inheritGrid(node) {
        for (const prop in node) {
            if (prop.startsWith('grid')) {
                if (node[prop] !== false) {
                    this[prop] = node[prop];
                }
                delete node[prop];
            }
        }
    }
    intersect(rect, dimension = 'bounds') {
        const top = (rect.top >= this[dimension].top && rect.top < this[dimension].bottom);
        const bottom = (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom);
        const left = (rect.left >= this[dimension].left && rect.left < this[dimension].right);
        const right = (rect.right > this[dimension].left && rect.right <= this[dimension].right);
        return (top && (left || right)) || (bottom && (left || right));
    }
    withinX(rect, dimension = 'linear') {
        return (
            (rect.top >= this[dimension].top && rect.top < this[dimension].bottom) ||
            (rect.bottom > this[dimension].top && rect.bottom <= this[dimension].bottom) ||
            (this[dimension].top >= rect.top && this[dimension].bottom <= rect.bottom) ||
            (rect.top >= this[dimension].top && rect.bottom <= this[dimension].bottom)
        );
    }
    withinY(rect, dimension = 'linear') {
        return (
            (rect.left >= this[dimension].left && rect.left < this[dimension].right) ||
            (rect.right > this[dimension].left && rect.right <= this[dimension].right) ||
            (this[dimension].left >= rect.left && this[dimension].right <= rect.right) ||
            (rect.left >= this[dimension].left && rect.right <= this[dimension].right)
        );
    }
    isHorizontal() {
        return (this._android.orientation == 'horizontal');
    }
    isView(...views) {
        for (const viewName of views) {
            if (this.widgetName == viewName) {
                return true;
            }
        }
        return false;
    }

    setAndroidId(widgetName) {
        this.androidWidgetName = widgetName || this.widgetName;
        if (this.androidId == null) {
            this.androidId = Util.generateId('android', this.element.id || this.element.name || `${this.androidWidgetName.substring(this.androidWidgetName.lastIndexOf('.') + 1).toLowerCase()}_1`);
        }
    }
    setAndroidDimensions() {
        if (this.visible) {
            const styleMap = this.styleMap;
            let parent = null;
            let width = 0;
            let height = 0;
            let requireWrap = false;
            if (this.wrapNode != null) {
                parent = this.wrapNode.parentOriginal;
                [width, height] = this.childrenBox;
                requireWrap = this.parent.isView(WIDGET_ANDROID.CONSTRAINT, WIDGET_ANDROID.GRID);
            }
            else {
                parent = this.parent;
                width = this.element.offsetWidth + this.marginLeft + this.marginRight;
                height = this.element.offsetHeight + this.marginTop + this.marginBottom;
                requireWrap = parent.isView(WIDGET_ANDROID.CONSTRAINT, WIDGET_ANDROID.GRID);
            }
            const parentWidth = (parent.id != 0 ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + Util.convertInt(parent.style.borderLeftWidth) + Util.convertInt(parent.style.borderRightWidth)) : Number.MAX_VALUE);
            const parentHeight = (parent.id != 0 ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + Util.convertInt(parent.style.borderTopWidth) + Util.convertInt(parent.style.borderBottomWidth)) : Number.MAX_VALUE);
            if (this.overflow != 0 && !this.isView(WIDGET_ANDROID.TEXT)) {
                this.android('layout_width', (this.isHorizontal() ? 'wrap_content' : 'match_parent'))
                    .android('layout_height', (this.isHorizontal() ? 'match_parent' : 'wrap_content'));
            }
            else {
                if (this.android('layout_width') != '0px') {
                    if (styleMap.width != null) {
                        this.android('layout_width', Util.convertPX(styleMap.width));
                    }
                    if (styleMap.minWidth != null) {
                        this.android('minWidth', Util.convertPX(styleMap.minWidth), false)
                            .android('layout_width', 'wrap_content', false);
                    }
                    if (styleMap.maxWidth != null) {
                        this.android('maxWidth', Util.convertPX(styleMap.maxWidth), false);
                    }
                }
                if (this.constraint.minWidth != null) {
                    if (this.constraint.layoutWidth || this.constraint.minWidth == 'match_parent') {
                        this.android('layout_width', this.constraint.minWidth);
                    }
                    else {
                        this.android('minWidth', this.constraint.minWidth)
                            .android('layout_width', 'wrap_content', false);
                    }
                }
                else if (this.android('layout_width') == null) {
                    if (requireWrap) {
                        this.android('layout_width', 'wrap_content');
                    }
                    else {
                        if (FIXED_ANDROID.includes(this.widgetName)) {
                            this.android('layout_width', 'wrap_content');
                        }
                        else {
                            if (parent.overflow == 0 && width >= parentWidth) {
                                this.android('layout_width', 'match_parent');
                            }
                            else {
                                const display = (this.style != null ? this.style.display : '');
                                switch (display) {
                                    case 'line-item':
                                    case 'block':
                                    case 'inherit':
                                        this.android('layout_width', 'match_parent');
                                        break;
                                    default:
                                        this.android('layout_width', 'wrap_content');
                                }
                            }
                        }
                    }
                }
                if (this.android('layout_height') != '0px') {
                    if (styleMap.height != null) {
                        this.android('layout_height', Util.convertPX(styleMap.height));
                    }
                    if (styleMap.minHeight != null) {
                        this.android('minHeight', Util.convertPX(styleMap.minHeight), false)
                            .android('layout_height', 'wrap_content', false);
                    }
                    if (styleMap.maxHeight != null) {
                        this.android('maxHeight', Util.convertPX(styleMap.maxHeight), false);
                    }
                }
                if (this.constraint.minHeight != null) {
                    if (this.constraint.layoutHeight || this.constraint.minHeight == 'match_parent') {
                        this.android('layout_height', this.constraint.minHeight, true);
                    }
                    else {
                        this.android('minHeight', this.constraint.minHeight)
                            .android('layout_height', 'wrap_content', false);
                    }
                }
                else if (this.android('layout_height') == null) {
                    switch (this.widgetName) {
                        case WIDGET_ANDROID.TEXT:
                        case WIDGET_ANDROID.EDIT:
                        case WIDGET_ANDROID.SPINNER:
                        case WIDGET_ANDROID.CHECKBOX:
                        case WIDGET_ANDROID.RADIO:
                        case WIDGET_ANDROID.BUTTON:
                            this.android('layout_height', 'wrap_content');
                            break;
                        default:
                            if (parent.overflow == 0 && !requireWrap && height >= parentHeight) {
                                this.android('layout_height', 'match_parent');
                            }
                            else {
                                this.android('layout_height', 'wrap_content');
                            }
                    }
                }
            }
        }
    }
    setAttributes(...actions) {
        const widget = Resource.ACTION_ANDROID[this.widgetName];
        const element = this.element;
        const result = {};
        if (element.tagName == 'INPUT' && element.id != '') {
            const nextElement = element.nextElementSibling;
            if (nextElement != null && nextElement.htmlFor == element.id) {
                const node = nextElement.androidNode;
                node.setAttributes(4);
                node.setAndroidId(WIDGET_ANDROID.TEXT);
                const attributes = node.combine();
                if (attributes.length > 0) {
                    result[4] = attributes;
                }
                this.css('marginRight', node.style.marginRight);
                this.css('paddingRight', node.style.paddingRight);
                this.label = node;
                node.hide();
            }
        }
        if (widget != null) {
            if (this.actions != null) {
                actions = this.actions;
            }
            let i = -1;
            for (const action in widget) {
                i++;
                if (result[action] != null || (actions != null && actions.length > 0 && !actions.includes(i))) {
                    continue;
                }
                if (Util.hasValue(this[action])) {
                    result[action] = Util.formatString(widget[action], this[action]);
                }
                else if (typeof Resource[action] == 'function') {
                    const data = Resource[action](this);
                    if (data != null) {
                        const output = [];
                        for (const j in widget[action]) {
                            if (result[j] != null) {
                                continue;
                            }
                            let value = data[j];
                            if (Util.hasValue(value)) {
                                value = parseStyle(element, j, value);
                                if (value != null) {
                                    switch (action) {
                                        case 'setComputedStyle':
                                            if (!this.supported.apply(this, widget[action][j].split('=')[0].split(':'))) {
                                                continue;
                                            }
                                            break;
                                        case 'addResourceString':
                                            value = Util.isNumber(value) ? value : `@string/${value}`;
                                            break;
                                    }
                                    output.push(Util.formatString(widget[action][j], value));
                                }
                            }
                        }
                        if (output.length > 0) {
                            switch (action) {
                                case 'setComputedStyle':
                                    this.styleAttributes = output;
                                    break;
                                default:
                                    result[i] = output;
                            }
                        }
                    }
                }
            }
        }
        for (const i in result) {
            let value = result[i];
            if (Util.hasValue(value)) {
                if (!Array.isArray(value)) {
                    value = [value];
                }
                value.forEach(attr => this.attr(attr, false));
            }
        }
    }
    setBounds(element, calibrate = false) {
        if (this.wrapNode == null) {
            if (!calibrate) {
                this.bounds = (element != null ?  getRangeBounds(element) : JSON.parse(JSON.stringify(this.element.getBoundingClientRect())));
            }
            this.linear = {
                top: this.bounds.top - this.marginTop,
                right: this.bounds.right + this.marginRight,
                bottom: this.bounds.bottom + this.marginBottom,
                left: this.bounds.left - this.marginLeft
            };
            this.box = {
                top: this.bounds.top + (this.paddingTop + this.borderTopWidth),
                right: this.bounds.right - (this.paddingRight + this.borderRightWidth),
                bottom: this.bounds.bottom - (this.paddingBottom + this.borderBottomWidth),
                left: this.bounds.left + (this.paddingLeft + this.borderLeftWidth)
            };
        }
        else {
            const nodes = this.outerNodes;
            if (!calibrate) {
                this.bounds = {
                    top: nodes.top[0].bounds.top,
                    right: nodes.right[0].bounds.right,
                    bottom: nodes.bottom[0].bounds.bottom,
                    left: nodes.left[0].bounds.left,
                    x: nodes.left[0].bounds.x,
                    y: nodes.top[0].bounds.y
                };
                this.bounds.width = this.bounds.right - this.bounds.left;
                this.bounds.height = this.bounds.bottom - this.bounds.top;
            }
            this.linear = {
                top: nodes.top[0].linear.top,
                right: nodes.right[0].linear.right,
                bottom: nodes.bottom[0].linear.bottom,
                left: nodes.left[0].linear.left
            };
            this.box = {
                top: nodes.top[0].box.top,
                right: nodes.right[0].box.right,
                bottom: nodes.bottom[0].box.bottom,
                left: nodes.left[0].box.left
            };
        }
        const linear = this.linear;
        linear.width = linear.right - linear.left;
        linear.height = linear.bottom - linear.top;
        const box = this.box;
        box.width = box.right - box.left;
        box.height = box.bottom - box.top;
    }
    setGravity() {
        if (this.wrapNode == null) {
            const verticalAlign = this.styleMap.verticalAlign;
            let textAlign = null;
            let element = this.element;
            while (element != null && element.styleMap != null) {
                textAlign = element.styleMap.textAlign || textAlign;
                const float = (element != this.element ? element.styleMap.float : '');
                if (float == 'left' || float == 'right' || Util.hasValue(textAlign)) {
                    break;
                }
                element = element.parentNode;
            }
            if (Util.hasValue(verticalAlign) || Util.hasValue(textAlign)) {
                let horizontal = null;
                let vertical = null;
                let layoutGravity = [];
                switch (textAlign) {
                    case 'start':
                        horizontal = 'start';
                        break;
                    case 'right':
                        horizontal = RTL('right', 'end');
                        break;
                    case 'end':
                        horizontal = 'end';
                        break;
                    case 'center':
                        horizontal = 'center_horizontal';
                        break;
                }
                switch (verticalAlign) {
                    case 'top':
                        vertical = 'top';
                        break;
                    case 'middle':
                        vertical = 'center_vertical';
                        break;
                    case 'bottom':
                    case 'text-bottom':
                        vertical = 'bottom';
                        break;
                    default:
                        if (this.style.height == this.style.lineHeight || Util.convertInt(this.style.lineHeight) == (this.box.bottom - this.box.top)) {
                            vertical = 'center_vertical';
                        }
                }
                const parentTextAlign = (this.styleMap.textAlign != textAlign && !this.renderParent.floating && !this.floating);
                switch (this.renderParent.widgetName) {
                    case WIDGET_ANDROID.RADIO_GROUP:
                    case WIDGET_ANDROID.LINEAR:
                        if (parentTextAlign && this.parent.wrapNode != null) {
                            this.renderParent.android('gravity', horizontal);
                        }
                        break;
                    case WIDGET_ANDROID.CONSTRAINT:
                    case WIDGET_ANDROID.RELATIVE:
                        const gravity = [vertical, horizontal].map(value => value);
                        this.android('gravity', (gravity.length == 2 ? 'center' : gravity[0]));
                        horizontal = null;
                        vertical = null;
                        break;
                    case WIDGET_ANDROID.GRID:
                        if (parentTextAlign && horizontal != null) {
                            layoutGravity.push(horizontal);
                        }
                        break;
                }
                if (vertical != null || layoutGravity.length > 0) {
                    layoutGravity.push(vertical);
                    this.android('layout_gravity', (layoutGravity.length == 2 ? 'center' : layoutGravity[0]));
                }
                if (horizontal != null) {
                    this.android('gravity', horizontal);
                }
            }
        }
    }

    get horizontalBias() {
        const parent = this.renderParent;
        if (parent != null && parent.visible) {
            const left = this.linear.left - parent.box.left;
            const right = parent.box.right - this.linear.right;
            return Util.calculateBias(left, right);
        }
        return 0.5;
    }
    get verticalBias() {
        const parent = this.renderParent;
        if (parent != null && parent.visible) {
            const top = this.linear.top - parent.box.top;
            const bottom = parent.box.bottom - this.linear.bottom;
            return Util.calculateBias(top, bottom);
        }
        return 0.5;
    }
    get widgetName() {
        if (this.androidWidgetName != null) {
            return this.androidWidgetName;
        }
        else {
            let widgetName = MAPPING_CHROME[this.tagName];
            if (typeof widgetName == 'object') {
                widgetName = widgetName[this.element.type];
            }
            return widgetName;
        }
    }
    set parent(value) {
        if (!Node.is(value) || value == this._parent) {
            return;
        }
        if (this._parent != null && this._parentOriginal == null) {
            this._parentOriginal = this._parent;
        }
        this._parent = value;
        if (this.depth == 0) {
            this.depth = value.depth + 1;
        }
    }
    get parent() {
        return (this._parent != null ? this._parent : new Node(0));
    }
    set parentOriginal(value) {
        if (Node.is(value)) {
            this._parentOriginal = value;
        }
    }
    get parentOriginal() {
        return (this._parentOriginal || this._parent);
    }
    get parentElement() {
        return this.element.parentNode;
    }
    set renderParent(value) {
        if (Node.is(value) && value.visible && value.renderChildren != null) {
            value.renderChildren.push(this);
        }
        this._renderParent = value;
    }
    get renderParent() {
        return this._renderParent;
    }
    get childrenBox() {
        let minLeft = Number.MAX_VALUE;
        let maxRight = Number.MIN_VALUE;
        let minTop = Number.MAX_VALUE;
        let maxBottom = Number.MIN_VALUE;
        for (const node of this.children) {
            minLeft = Math.min(node.bounds.left, minLeft);
            maxRight = Math.max(node.bounds.right, maxRight);
            minTop = Math.min(node.bounds.top, minTop);
            maxBottom = Math.max(node.bounds.bottom, maxBottom);
        }
        return [maxRight - minLeft, maxBottom - minTop];
    }
    get namespaces() {
        const result = [];
        for (const obj of this._namespaces) {
            const name = obj.replace(/^_+/, '');
            if (name != '') {
                result.push(name);
            }
        }
        return result;
    }
    get outerNodes() {
        const children = this.children;
        let top = [children[0]];
        let right = [children[0]];
        let bottom = [children[0]];
        let left = [children[0]];
        for (let i = 1; i < children.length; i++) {
            const node = children[i];
            const nodeRight = node.label || node;
            if (top[0].bounds.top == node.bounds.top) {
                top.push(node);
            }
            else if (node.bounds.top < top[0].bounds.top) {
                top = [node];
            }
            if (right[0].bounds.right == nodeRight.bounds.right) {
                right.push(nodeRight);
            }
            else if (nodeRight.bounds.right > right[0].bounds.right) {
                right = [nodeRight];
            }
            if (bottom[0].bounds.bottom == node.bounds.bottom) {
                bottom.push(node);
            }
            else if (node.bounds.bottom > bottom[0].bounds.bottom) {
                bottom = [node];
            }
            if (left[0].bounds.left == node.bounds.left) {
                left.push(node);
            }
            else if (node.bounds.left < left[0].bounds.left) {
                left = [node];
            }
        }
        return { top, right, bottom, left, children };
    }
    set tagName(value) {
        this._tagName = value;
    }
    get tagName() {
        return (this._tagName != null ? this._tagName : this.element.tagName);
    }
    get flex() {
        if (this._flex == null) {
            let parent = (this.parentElement != null ? this.parentElement.androidNode : null);
            this._flex = {
                parent,
                enabled: (this.style.display != null && this.style.display.indexOf('flex') != -1),
                direction: this.style.flexDirection,
                basis: this.style.flexBasis,
                grow: Util.convertInt(this.style.flexGrow),
                shrink: Util.convertInt(this.style.flexShrink),
                wrap: this.style.flexWrap,
                alignSelf: (parent != null && this.styleMap.alignSelf == null && this.style.alignSelf == 'auto' ? parent.styleMap.alignItems : this.style.alignSelf),
                justifyContent: this.style.justifyContent
            };
        }
        return this._flex;
    }
    get floating() {
        return (this.styleMap.float == 'left' || this.styleMap.float == 'right');
    }
    get fixed() {
        return (this.style.display == 'fixed');
    }
    get overflow() {
        if (this._overflow == null) {
            let value = 0;
            if (this.style.overflow == 'scroll' || (this.style.overflowX == 'auto' && this.element.clientWidth != this.element.scrollWidth)) {
                value |= 2;
            }
            if (this.style.overflow == 'scroll' || (this.style.overflowY == 'auto' && this.element.clientHeight != this.element.scrollHeight)) {
                value |= 4;
            }
            this._overflow = value;
        }
        return this._overflow;
    }
    get overflowX() {
        return ((this._overflow & 2) == 2);
    }
    get overflowY() {
        return ((this._overflow & 4) == 4);
    }
    get anchors() {
        return (this.constraint.horizontal ? 1 : 0) + (this.constraint.vertical ? 1 : 0);
    }
    get viewWidth() {
        return Util.convertInt(this.styleMap.width || this.styleMap.minWidth);
    }
    get viewHeight() {
        return Util.convertInt(this.styleMap.height || this.styleMap.minHeight);
    }
    get marginTop() {
        return Util.convertInt(this.css('marginTop'));
    }
    get marginBottom() {
        return Util.convertInt(this.css('marginBottom'));
    }
    get marginLeft() {
        return Util.convertInt(this.css('marginLeft'));
    }
    get marginRight() {
        return Util.convertInt(this.css('marginRight'));
    }
    get borderTopWidth() {
        return Util.convertInt(this.css('borderTopWidth'));
    }
    get borderRightWidth() {
        return Util.convertInt(this.css('borderRightWidth'));
    }
    get borderBottomWidth() {
        return Util.convertInt(this.css('borderBottomWidth'));
    }
    get borderLeftWidth() {
        return Util.convertInt(this.css('borderLeftWidth'));
    }
    get paddingTop() {
        return Util.convertInt(this.css('paddingTop'));
    }
    get paddingBottom() {
        return Util.convertInt(this.css('paddingBottom'));
    }
    get paddingLeft() {
        return Util.convertInt(this.css('paddingLeft'));
    }
    get paddingRight() {
        return Util.convertInt(this.css('paddingRight'));
    }
    get center() {
        return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2)};
    }
    get stringId() {
        return (this.androidId != null ? `@+id/${this.androidId}` : '');
    }

    static is(node) {
        return (node != null && node instanceof Node);
    }
    static createWrapNode(id, node, api, parent, children, actions = null) {
        const options = {
            wrapNode: node,
            children,
            parentOriginal: node.parentOriginal,
            depth: node.depth,
            parent,
            actions
        };
        return new Node(id, null, api, options);
    }
    static createTextNode(id, element, api, parent, actions = null) {
        const node = new Node(id, null, api, { element, parent, actions, tagName: 'TEXT' });
        node.setAndroidId(WIDGET_ANDROID.TEXT);
        node.setBounds(element);
        if (parent != null) {
            const inherit = INHERIT_ANDROID[WIDGET_ANDROID.TEXT];
            const style = [];
            for (const prop in inherit) {
                let value = parent.style[prop]; 
                node.style[prop] = value;
                value = parseStyle(null, prop, value);
                if (value != null) {
                    style.push(Util.formatString(inherit[prop], value));
                }
            }
            node.styleAttributes = style;
        }
        element.children = [];
        return node;
    }
}