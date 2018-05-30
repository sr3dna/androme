class Node {
    constructor(id, element, api, options = {}) {
        let style = {};
        let styleMap = {};
        if (element != null) {
            style = window.getComputedStyle(element);
            styleMap = element.styleMap || {};
            for (const inline of element.style) {
                styleMap[Utils.hyphenToCamelCase(inline)] = element.style[inline];
            }
        }
        else {
            element = {};
        }
        this.id = id;
        this.element = element;
        this.children = [];
        this.api = api;
        this.depth = 0;
        this.style = style;
        this.styleMap = styleMap;
        this.visible = true;
        this.linearRows = [];
        this.renderChildren = [];
        this.styleAttributes = [];
        this.label = null;
        this.constraint = {};
        this.preAlignment = {};
        this.nestedScroll = false;
        this.wrapNode = null;
        this.parentOriginal = null;
        this.parentIndex = Number.MAX_VALUE;

        this._tagName = null;
        this._parent = null;
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
        if (Utils.hasValue(value)) {
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
            for (const attr of attributes) {
                if (attr.indexOf('*') != -1) {
                    for (const [key] of Utils.search(this[name], attr)) {
                        delete this[name][key];
                    }
                }
                else {
                    delete this[name][attr];
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
            if (Utils.hasValue(value)) {
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
            if (Utils.hasValue(value)) {
                return this;
            }
            else {
                return result;
            }
        }
        return this;
    }
    combine(xmlns) {
        const result = [];
        const namespaces = {};
        this._namespaces.forEach(value => {
            const obj = this[`_${value}`];
            for (const attr in obj) {
                if (value != '_') {
                    result.push(`${value}:${attr}="${obj[attr]}"`);
                    namespaces[XMLNS_ANDROID[value.toUpperCase()]] = true;
                }
                else {
                    result.push(`${attr}="${obj[attr]}"`);
                }
            }
        });
        result.sort();
        return (xmlns ? [result, Object.keys(namespaces)] : result);
    }
    css(attr, value, map = false) {
        if (Utils.hasValue(value)) {
            this.styleMap[attr] = value;
            return this;
        }
        else {
            return (this.styleMap[attr] || (!map ? this.style[attr] : null) || null);
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
        if (parent.isView(WIDGET_ANDROID.LINEAR)) {
            parent.linearRows.push(this);
        }
        this.renderParent = parent;
        this.renderDepth = (parent.id == 0 ? 0 : parent.renderDepth + 1);
    }
    hide(parent = true) {
        this.renderParent = parent;
        this.visible = false;
    }
    cascade() {
        function cascade(node) {
            const children = [...node.children];
            node.children.forEach(item => children.push(...cascade(item)));
            return children;
        }
        return cascade(this);
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
    isHorizontal() {
        return (this._android.orientation == 'horizontal');
    }
    isView(viewName) {
        return (this.widgetName == viewName);
    }
    inside(rect, dimension = 'bounds') {
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

    setAndroidId(widgetName) {
        this.androidWidgetName = widgetName || this.widgetName;
        if (this.androidId == null) {
            this.androidId = Utils.generateId('android', this.element.id || this.element.name || `${this.androidWidgetName.substring(this.androidWidgetName.lastIndexOf('.') + 1).toLowerCase()}_1`);
        }
    }
    setAndroidDimensions() {
        if (this.visible) {
            const styleMap = this.styleMap;
            let parent = null;
            let width = 0;
            let height = 0;
            let gridLayout = false;
            if (this.wrapNode != null) {
                parent = this.wrapNode.parentOriginal || this.parent;
                [width, height] = this.childrenBox;
                gridLayout = this.parent.isView(WIDGET_ANDROID.GRID);
            }
            else {
                parent = this.parent;
                width = this.element.offsetWidth + this.marginLeft + this.marginRight;
                height = this.element.offsetHeight + this.marginTop + this.marginBottom;
                gridLayout = parent.isView(WIDGET_ANDROID.GRID);
            }
            const parentWidth = (parent.id != 0 ? parent.element.offsetWidth - (parent.paddingLeft + parent.paddingRight + Utils.parseInt(parent.style.borderLeftWidth) + Utils.parseInt(parent.style.borderRightWidth)) : Number.MAX_VALUE);
            const parentHeight = (parent.id != 0 ? parent.element.offsetHeight - (parent.paddingTop + parent.paddingBottom + Utils.parseInt(parent.style.borderTopWidth) + Utils.parseInt(parent.style.borderBottomWidth)) : Number.MAX_VALUE);
            if (this.overflow != 0 && !this.isView(WIDGET_ANDROID.TEXT)) {
                this
                    .android('layout_width', (this.isHorizontal() ? 'wrap_content' : 'match_parent'))
                    .android('layout_height', (this.isHorizontal() ? 'match_parent' : 'wrap_content'));
            }
            else {
                if (styleMap.width != null) {
                    this.android('layout_width', Utils.convertToPX(styleMap.width), false);
                }
                if (this.android('layout_width') != '0px') {
                    if (styleMap.minWidth != null) {
                        this.android('minWidth', Utils.convertToPX(styleMap.minWidth), false);
                    }
                    if (styleMap.maxWidth != null) {
                        this.android('maxWidth', Utils.convertToPX(styleMap.maxWidth), false);
                    }
                }
                if (this.android('layout_width') == null) {
                    if (gridLayout) {
                        this.android('layout_width', 'wrap_content', false);
                    }
                    else {
                        if (FIXED_ANDROID.includes(this.widgetName)) {
                            this.android('layout_width', 'wrap_content', false);
                        }
                        else {
                            if (parent.overflow == 0 && width >= parentWidth) {
                                this.android('layout_width', 'match_parent', false);
                            }
                            else {
                                const display = (this.style != null ? this.style.display : '');
                                switch (display) {
                                    case 'line-item':
                                    case 'block':
                                    case 'inherit':
                                        this.android('layout_width', 'match_parent', false);
                                        break;
                                    default:
                                        this.android('layout_width', 'wrap_content', false);
                                }
                            }
                        }
                    }
                    if (this.constraint.minWidth != null && styleMap.width == null && this.android('minWidth') == null && this.android('layout_width') != 'match_parent') {
                        this.android('minWidth', `${this.constraint.minWidth}px`)
                            .android('layout_width', 'wrap_content');
                    }
                    if (this.constraint.minHeight != null && styleMap.height == null && this.android('minHeight') == null && this.android('layout_height') != 'match_parent') {
                        this.android('minHeight', `${this.constraint.minHeight}px`)
                            .android('layout_height', 'wrap_content');
                    }
                }
                if (styleMap.height != null) {
                    this.android('layout_height', Utils.convertToPX(styleMap.height), false);
                }
                if (this.android('layout_height') != '0px') {
                    if (styleMap.minHeight != null) {
                        this.android('minHeight', Utils.convertToPX(styleMap.minHeight), false);
                    }
                    if (styleMap.maxHeight != null) {
                        this.android('maxHeight', Utils.convertToPX(styleMap.maxHeight), false);
                    }
                }
                if (this.android('layout_height') == null) {
                    switch (this.widgetName) {
                        case WIDGET_ANDROID.TEXT:
                        case WIDGET_ANDROID.EDIT:
                        case WIDGET_ANDROID.SPINNER:
                        case WIDGET_ANDROID.CHECKBOX:
                        case WIDGET_ANDROID.RADIO:
                        case WIDGET_ANDROID.BUTTON:
                            this.android('layout_height', 'wrap_content', false);
                            break;
                        default:
                            if (parent.overflow == 0 && !gridLayout && height >= parentHeight) {
                                this.android('layout_height', 'match_parent', false);
                            }
                            else {
                                this.android('layout_height', 'wrap_content', false);
                            }
                    }
                }
            }
        }
    }
    setAttributes(...actions) {
        const widget = ACTION_ANDROID[this.widgetName];
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
                if (Utils.hasValue(this[action])) {
                    result[action] = Utils.formatString(widget[action], this[action]);
                }
                else if (action.indexOf('.') != -1) {
                    let method = window;
                    let methodName = '';
                    action.split('.').forEach(value => {
                        if (value == 'window') {
                            return true;
                        }
                        else if (method[value] != null) {
                            method = method[value];
                            methodName = value;
                        }
                    });
                    if (typeof method == 'function') {
                        const data = method(this);
                        if (data != null) {
                            const output = [];
                            for (const j in widget[action]) {
                                if (result[j] != null) {
                                    continue;
                                }
                                let value = data[j];
                                if (Utils.hasValue(value)) {
                                    value = Node.parseStyle(element, j, value);
                                    if (value != null) {
                                        switch (methodName) {
                                            case 'setComputedStyle':
                                                if (!this.supported.apply(this, widget[action][j].split('=')[0].split(':'))) {
                                                    continue;
                                                }
                                                break;
                                            case 'addResourceString':
                                                value = Utils.isNumber(value) ? value : `@string/${value}`;
                                                break;
                                        }
                                        output.push(Utils.formatString(widget[action][j], value));
                                    }
                                }
                            }
                            if (output.length > 0) {
                                switch (methodName) {
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
        }
        for (const i in result) {
            let value = result[i];
            if (Utils.hasValue(value)) {
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
                this.bounds = (element != null ?  Node.getRangeBounds(element) : JSON.parse(JSON.stringify(this.element.getBoundingClientRect())));
            }
            this.linear = {
                top: this.bounds.top - this.marginTop,
                right: this.bounds.right + this.marginRight,
                bottom: this.bounds.bottom + this.marginBottom,
                left: this.bounds.left - this.marginLeft
            };
            this.box = {
                top: this.bounds.top + (this.paddingTop + Utils.parseInt(this.css('borderTopWidth'))),
                right: this.bounds.right - (this.paddingRight + Utils.parseInt(this.css('borderRightWidth'))),
                bottom: this.bounds.bottom - (this.paddingBottom + Utils.parseInt(this.css('borderBottomWidth'))),
                left: this.bounds.left + (this.paddingLeft + Utils.parseInt(this.css('borderLeftWidth')))
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
                if (float == 'left' || float == 'right' || Utils.hasValue(textAlign)) {
                    break;
                }
                element = element.parentNode;
            }
            if (Utils.hasValue(verticalAlign) || Utils.hasValue(textAlign)) {
                let horizontal = null;
                let vertical = null;
                let layoutGravity = [];
                switch (textAlign) {
                    case 'start':
                        horizontal = 'start';
                        break;
                    case 'right':
                        horizontal = getLTR('right', 'end');
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
                        if (this.style.height == this.style.lineHeight || Utils.parseInt(this.style.lineHeight) == (this.box.bottom - this.box.top)) {
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
                        this.android('gravity', [vertical, horizontal].join('|'));
                        horizontal = null;
                        vertical = null;
                        break;
                    case WIDGET_ANDROID.GRID:
                        if (parentTextAlign) {
                            layoutGravity.push(horizontal);
                        }
                        break;
                }
                if (vertical != null || layoutGravity.length > 0) {
                    layoutGravity.push(vertical);
                    this.android('layout_gravity', layoutGravity.join('|'));
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
            return Utils.calculateBias(left, right);
        }
        return 0.5;
    }
    get verticalBias() {
        const parent = this.renderParent;
        if (parent != null && parent.visible) {
            const top = this.linear.top - parent.box.top;
            const bottom = parent.box.bottom - this.linear.bottom;
            return Utils.calculateBias(top, bottom);
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
        if (value == null || value == this._parent) {
            return;
        }
        if (this._parent != null && this.parentOriginal == null) {
            this.parentOriginal = this._parent;
        }
        this._parent = value;
        if (this.depth == 0) {
            this.depth = value.depth + 1;
        }
    }
    get parent() {
        return (this._parent != null ? this._parent : new Node(0));
    }
    get parentElement() {
        return this.element.parentNode;
    }
    set renderParent(value) {
        if (typeof value == 'object') {
            if (value.visible) {
                value.renderChildren.push(this);
            }
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
        this.children.forEach(node => {
            minLeft = Math.min(node.bounds.left, minLeft);
            maxRight = Math.max(node.bounds.right, maxRight);
            minTop = Math.min(node.bounds.top, minTop);
            maxBottom = Math.max(node.bounds.bottom, maxBottom);
        });
        return [maxRight - minLeft, maxBottom - minTop];
    }
    get outerNodes() {
        const children = this.children.filter(node => node.visible);
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
                grow: Utils.parseInt(this.style.flexGrow),
                shrink: Utils.parseInt(this.style.flexShrink),
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
    get marginTop() {
        return Utils.parseInt(this.css('marginTop'));
    }
    get marginBottom() {
        return Utils.parseInt(this.css('marginBottom'));
    }
    get marginLeft() {
        return Utils.parseInt(this.css('marginLeft'));
    }
    get marginRight() {
        return Utils.parseInt(this.css('marginRight'));
    }
    get paddingTop() {
        return Utils.parseInt(this.css('paddingTop'));
    }
    get paddingBottom() {
        return Utils.parseInt(this.css('paddingBottom'));
    }
    get paddingLeft() {
        return Utils.parseInt(this.css('paddingLeft'));
    }
    get paddingRight() {
        return Utils.parseInt(this.css('paddingRight'));
    }
    get center() {
        return { x: this.bounds.left + Math.floor(this.bounds.width / 2), y: this.bounds.top + Math.floor(this.bounds.height / 2)};
    }
    get stringId() {
        return (this.androidId != null ? `@+id/${this.androidId}` : '');
    }

    static createWrapNode(id, node, parent, children, api, actions = null) {
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
                value = Node.parseStyle(null, prop, value);
                if (value != null) {
                    style.push(Utils.formatString(inherit[prop], value));
                }
            }
            node.styleAttributes = style;
        }
        element.children = [];
        return node;
    }
    static android(nodes, name, value, overwrite = true) {
        nodes.forEach(node => node.android(name, value, overwrite));
    }
    static getHorizontalBias(parent, firstNode, lastNode) {
        const left = firstNode.linear.left - parent.box.left;
        const right = parent.box.right - lastNode.linear.right;
        return Utils.calculateBias(left, right);
    }
    static getVerticalBias(parent, firstNode, lastNode) {
        const top = firstNode.linear.top - parent.box.top;
        const bottom = parent.box.bottom - lastNode.linear.bottom;
        return Utils.calculateBias(top, bottom);
    }
    static getRangeBounds(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const domRect = range.getClientRects();
        const bounds = JSON.parse(JSON.stringify(domRect[domRect.length - 1]));
        if (domRect.length > 1) {
            bounds.x = Array.from(domRect).reduce((a, b) => Math.min(a, b.x), Number.MAX_VALUE);
            bounds.left = bounds.x;
            bounds.width = Array.from(domRect).reduce((a, b) => a + b.width, 0);
        }
        return bounds;
    }
    static getStyle(element) {
        return (element.androidNode != null ? element.androidNode.style : getComputedStyle(element));
    }
    static parseStyle(element, name, value) {
        if (name == 'backgroundColor') {
            if (element != null && element.parentNode != null && value == Node.getStyle(element.parentNode).backgroundColor) {
                return null;
            }
        }
        else if (/(pt|em)$/.test(value)) {
            value = Utils.convertToPX(value);
        }
        return value;
    }
    static inside(nodes, dimension = 'linear') {
        for (const node of nodes) {
            if (nodes.some(item => item != node && node.inside(item[dimension]))) {
                return true;
            }
        }
        return false;
    }
    static isLinearXY(nodes) {
        if (!Node.inside(nodes)) {
            let linearX = true;
            let linearY = true;
            if (nodes.length > 1) {
                const minBottom = nodes.reduce((a, b) => Math.min(a, b.linear.bottom), Number.MAX_VALUE);
                const minRight = nodes.reduce((a, b) => Math.min(a, b.linear.right), Number.MAX_VALUE);
                linearX = !nodes.some(item => (item.linear.top >= minBottom));
                linearY = !nodes.some(item => (item.linear.left >= minRight));
            }
            return [linearX, linearY];
        }
        else {
            return [false, false];
        }
    }
}