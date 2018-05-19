class Node {
    constructor(id, element, options = {}) {
        let style = {};
        let styleMap = {};
        let bounds = null;
        let overflow = null;
        if (element != null) {
            style = window.getComputedStyle(element);
            styleMap = element.styleMap || {};
            bounds = element.getBoundingClientRect();
            overflow = ((style.overflow == 'auto' || style.overflow == 'scroll') && (element.clientHeight != element.scrollHeight || element.clientWidth != element.scrollWidth) ? style.overflow : null);
            for (const i of element.style) {
                styleMap[Utils.hyphenToCamelCase(i)] = element.style[i];
            }
            this.tagName = element.tagName;
        }
        else {
            element = {};
        }
        this.id = id;
        this.element = element;
        this.wrapper = null;
        this.children = [];
        this.style = style;
        this.styleMap = styleMap;
        this.depthIndent = 0;
        this.visible = true;
        this.linearRows = [];
        this.renderId = null;
        this.renderChildren = [];
        this.android = {};
        this.androidAttributes = [];
        this.original = {};
        this.boxRefit = {};
        this.preAlignment = {};
        this.scrollOverflow = overflow;
        this.scrollNested = false;
        Object.assign(this, options);
    }

    setAndroidId(widgetName) {
        const element = this.element;
        if (widgetName == null) {
            widgetName = this.widgetName;
        }
        this.androidWidgetName = widgetName;
        if (this.androidId == null) {
            let androidName = element.id || element.name || widgetName.toLowerCase();
            if (GENERATE_ID[androidName] == null) {
                GENERATE_ID[androidName] = 1;
            }
            this.androidId = androidName;
            do {
                if (!GENERATE_ID['__id'].includes(this.androidId) && this.androidId != widgetName.toLowerCase()) {
                    GENERATE_ID['__id'].push(this.androidId);
                    break;
                }
                else {
                    this.androidId = `${androidName}_${GENERATE_ID[androidName]++}`;
                }
            }
            while (true)
        }
    }
    setAndroidDimensions() {
        let parent = null;
        let tagName = null;
        let style = null;
        let styleMap = null;
        let width = 0;
        let height = 0;
        if (this.wrapper != null) {
            parent = (this.parent.wrapper != null ? this.wrapper.original.parent.element : this.parent.element);
            styleMap = this.styleMap;
            [width, height] = this.getChildDimensions();
        }
        else {
            const element = this.element;
            parent = element.parentNode;
            tagName = element.tagName;
            style = Node.getElementStyle(element);
            styleMap = this.styleMap;
            width = element.offsetWidth + parseInt(style.marginLeft) + parseInt(style.marginLeft);
            height = element.offsetHeight + parseInt(style.marginTop) + parseInt(style.marginBottom);
        }
        const parentStyle = Node.getElementStyle(parent);
        const parentWidth = parent.offsetWidth - (parseInt(parentStyle.paddingLeft) + parseInt(parentStyle.paddingRight) + parseInt(parentStyle.borderLeftWidth) + parseInt(parentStyle.borderRightWidth));
        const parentHeight = parent.offsetHeight - (parseInt(parentStyle.paddingTop) + parseInt(parentStyle.paddingBottom) + parseInt(parentStyle.borderTopWidth) + parseInt(parentStyle.borderBottomWidth));
        const parentScrollView = (parent.androidNode && parent.androidNode.scrollOverflow != null);
        const parentGridLayout = (this.parent.id != 0 && this.parent.isView(WIDGET_ANDROID.GRID));
        if (this.scrollOverflow != null && !this.isView(WIDGET_ANDROID.TEXT)) {
            this.attr('layout_width', 'match_parent');
            this.attr('layout_height', 'match_parent');
        }
        else {
            const layoutWeight = (this.gridColumnWeight != null || this.layoutWeight != null);
            if (styleMap.width != null) {
                this.attr('layout_width', Utils.convertToPX(styleMap.width));
                if (layoutWeight) {
                    this.attr((this.gridColumnWeight != null ? 'layout_columnWeight' : 'layout_weight'), '0');
                }
            }
            else {
                if (layoutWeight) {
                    if (this.gridColumnWeight != null) {
                        this.attr('layout_columnWeight', this.gridColumnWeight);
                    }
                    if (this.layoutWeight != null) {
                        this.attr('layout_weight', this.layoutWeight);
                    }
                    this.attr('layout_width', (this.layoutWeight == '1' || this.gridColumnWeight == '1' ? '0px' : 'wrap_content'));
                }
                else {
                    if (parentGridLayout) {
                        this.attr('layout_width', 'wrap_content');
                    }
                    else {
                        if (!parentScrollView && width >= parentWidth) {
                            this.attr('layout_width', 'match_parent');
                        }
                        else {
                            const display = (style != null && MAPPING_ANDROID[tagName] == null ? style.display : '');
                            switch (display) {
                                case 'line-item':
                                case 'block':
                                case 'inherit':
                                    this.attr('layout_width', 'match_parent');
                                    break;
                                default:
                                    this.attr('layout_width', 'wrap_content');
                            }
                        }
                    }
                }
            }
            if (styleMap.height != null) {
                this.attr('layout_height', Utils.convertToPX(styleMap.height));
            }
            else {
                if (!parentScrollView && !parentGridLayout && height >= parentHeight) {
                    this.attr('layout_height', 'match_parent');
                }
                else {
                    this.attr('layout_height', 'wrap_content');
                }
            }
        }
    }
    setBounds() {
        if (this.wrapper == null) {
            if (this.element != null) {
                this.bounds = this.element.getBoundingClientRect();
            }
        }
        else {
            const nodes = Node.getOuterNodes(this.children);
            this.bounds = {
                top: nodes.top[0].bounds.top,
                right: nodes.right[0].bounds.right,
                bottom: nodes.bottom[0].bounds.bottom,
                left: nodes.left[0].bounds.left,
                x: nodes.left[0].bounds.x,
                y: nodes.top[0].bounds.y
            };
        }
    }
    setLinearBoxRect() {
        if (this.wrapper == null) {
            const bounds = this.bounds;
            const style = this.style;
            this.linear = {
                top: bounds.top,
                right: bounds.right + parseInt(style.marginRight),
                bottom: bounds.bottom + parseInt(style.marginBottom),
                left: bounds.left
            };
            this.box = {
                top: bounds.top + parseInt(style.paddingTop) + parseInt(style.borderTopWidth),
                right: bounds.right - (parseInt(style.paddingRight) + parseInt(style.borderRightWidth)),
                left: bounds.left + parseInt(style.paddingLeft) + parseInt(style.borderLeftWidth),
                bottom: bounds.bottom - (parseInt(style.paddingBottom) + parseInt(style.borderBottomWidth))
            };
        }
        else {
            const nodes = Node.getOuterNodes(this.children);
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
    }
    addAttribute(value) {
        if (Utils.hasValue(value)) {
            this.androidAttributes.push(value);
        }
    }
    setAttributes(actions = []) {
        const widget = ACTION_ANDROID[this.androidWidgetName];
        const element = this.element;
        const result = {};
        if (widget != null) {
            let i = -1;
            if (this.actions != null) {
                actions = this.actions;
            }
            for (const action in widget) {
                i++;
                if (result[action] != null || (actions != null && actions.length > 0 && !actions.includes(i))) {
                    continue;
                }
                if (Utils.hasValue(this[action])) {
                    result[action] = widget[action].replace('{0}', this[action]);
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
                                    if (value.startsWith('rgb')) {
                                        const rgb = Color.parseRGBA(value);
                                        if (j == 'backgroundColor') {
                                            let backgroundParent = [];
                                            if (element.parentNode != null) {
                                                backgroundParent = Color.parseRGBA(Node.getElementStyle(element.parentNode).backgroundColor);
                                            }
                                            if (backgroundParent[0] == rgb[0]) {
                                                continue;
                                            }
                                        }
                                        if (rgb != null) {
                                            value = addResourceColor(value.replace(rgb[0], rgb[1]));
                                        }
                                    }
                                    else if (/(px|pt|em)$/.test(value)) {
                                        value = (j.toLowerCase().indexOf('font') != -1 ? Utils.convertToSP(value) : Utils.convertToPX(value));
                                    }
                                    output.push(widget[action][j].replace('{0}', value));
                                }
                            }
                            if (output.length > 0) {
                                if (methodName == 'setComputedStyle') {
                                    if (!RESOURCE['style'].has(this.tagName)) {
                                        RESOURCE['style'].set(this.tagName, []);
                                    }
                                    RESOURCE['style'].get(this.tagName).push({ id: this.id, attributes: output });
                                }
                                else {
                                    result[i] = output;
                                }
                            }
                        }
                    }
                }
            }
        }
        if (element.tagName == 'INPUT' && element.id != '') {
            const nextElement = element.nextElementSibling;
            if (nextElement && nextElement.htmlFor == element.id) {
                const nextNode = nextElement.androidNode;
                nextNode.setAndroidId(WIDGET_ANDROID.TEXT);
                nextNode.setAttributes([5]);
                const attributes = nextNode.androidAttributes;
                for (const name in attributes) {
                    const value = attributes[name];
                    if (result[name] == null && Utils.hasValue(value)) {
                        result[name] = value;
                    }
                }
                this.label = nextNode;
                nextNode.visible = false;
                nextNode.renderParent = true;
            }
        }
        for (const i in result) {
            let value = result[i];
            if (Utils.hasValue(value)) {
                if (!Array.isArray(value)) {
                    value = [value];
                }
                value.forEach(attr => {
                    var match = attr.match(/^android:([a-zA-Z_]+)="([a-zA-Z0-9]+)"$/);
                    if (match != null) {
                        this.attr(match[1], match[2]);
                    }
                    else {
                        this.addAttribute(attr);
                    }
                });
            }
        }
    }
    getChildDimensions() {
        let minLeft = Number.MAX_VALUE;
        let maxRight = Number.MIN_VALUE;
        let minTop = Number.MAX_VALUE;
        let maxBottom = Number.MIN_VALUE;
        this.children.forEach(node => {
            const bounds = node.bounds;
            minLeft = Math.min(bounds.left, minLeft);
            maxRight = Math.max(bounds.right, maxRight);
            minTop = Math.min(bounds.top, minTop);
            maxBottom = Math.max(bounds.bottom, maxBottom);
        });
        return [maxRight - minLeft, maxBottom - minTop];
    }
    isHorizontalLinear() {
        return (this.android.orientation == 'horizontal');
    }
    isHorizontalScroll() {
        return (this.styleMap.width != null && (this.styleMap.overflowX == 'auto' || this.styleMap.overflowX == 'scroll'));
    }
    isView(viewName) {
        return (this.androidWidgetName == viewName);
    }
    inheritGrid(node) {
        for (const prop in node) {
            if (prop.startsWith('grid')) {
                this[prop] = node[prop];
                delete node[prop];
            }
        }
    }
    inheritStyleMap(node) {
        for (const prop in node.styleMap) {
            if (this.styleMap[prop] == null) {
                this.styleMap[prop] = node.styleMap[prop];
            }
        }
    }
    attr(name, value) { 
        if (Utils.hasValue(value)) {
            this.android[name] = value;
        }
        return this.android[name];
    }
    attrDelete(name) {
        delete this.android[name];
    }
    css(name) {
        if (this.styleMap[name] != null) {
            return this.styleMap[name];
        }
        return (this.style[name] || ''); 
    }

    get widgetName() {
        if (this.androidWidgetName != null) {
            return this.androidWidgetName;
        }
        else {
            let widgetName = MAPPING_ANDROID[this.tagName];
            if (typeof widgetName == 'object') {
                widgetName = widgetName[this.element.type];
            }
            return widgetName;
        }
    }
    set parent(value) {
        if (this._parent != null && this.original.parent == null) {
            this.original.parent = this._parent;
            this.original.parentId = this._parent.id;
        }
        if (value == null) {
            value = new Node(0);
            value.depth = -1;
        }
        if (this._depth == null) {
            this._depth = value.depth + 1;
        }
        this._parent = value;
    }
    get parent() {
        return (this._parent != null ? this._parent : new Node(0));
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
    set depth(value) {
        if (this._depth != null && this.original.depth == null) {
            this.original.depth = this._depth;
        }
        this._depth = value;
    }
    get depth() {
        return (this._depth != null ? this._depth : 0);
    }
    get firstChild() {
        const nodes = this.children.slice();
        nodes.sort((a, b) => {
            let [c, d] = [a.depth, b.depth];
            if (c == d) {
                [c, d] = [a.bounds.top, b.bounds.top];
            }
            if (c == d) {
                [c, d] = [a.bounds.left, b.bounds.left];
            }
            return (c > d ? 1 : -1);
        });
        return (nodes.length > 0 ? nodes[0] : null);
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

    static createWrapper(id, node, parent, children, actions = null) {
        const options = {
            wrapper: node,
            parent,
            children,
            depth: parent.depth,
            depthIndent: parent.depthIndent,
            bounds: node.bounds,
            linear: node.linear,
            box: node.box,
            original: node.original,
            actions
        };
        return new Node(id, null, options);
    }
    static isLinearXY(nodes) {
        let linearX = true;
        let linearY = true;
        if (nodes.length > 1) {
            const minBottom = nodes.reduce((a, b) => Math.min(a, b.linear.bottom), Number.MAX_VALUE);
            nodes.some(item => {
                if (item.linear.top >= minBottom) {
                    linearX = false;
                    return true;
                }
            });
            const minRight = nodes.reduce((a, b) => Math.min(a, b.linear.right), Number.MAX_VALUE);
            nodes.some(item => {
                if (item.linear.left >= minRight) {
                    linearY = false;
                    return true;
                }
            });
        }
        return [linearX, linearY];
    }
    static getOuterNodes(nodes) {
        let top = [nodes[0]];
        let right = [nodes[0]];
        let bottom = [nodes[0]];
        let left = [nodes[0]];
        for (let i = 1; i < nodes.length; i++) {
            let node = nodes[i];
            let nodeRight = node.label || node;
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
        return { top, right, bottom, left };
    }
    static getElementStyle(element) {
        return (element.androidNode != null ? element.androidNode.style : getComputedStyle(element));
    }
    static orderDefault(a, b) {
        let [c, d] = [a.depth, b.depth];
        if (c == d) {
            [c, d] = [a.bounds.x, b.bounds.x];
            if (c == d) {
                [c, d] = [a.id, b.id];
            }
        }
        return (c > d ? 1 : -1);
    }
}