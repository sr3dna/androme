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
            overflow = ((style.overflow == 'auto' || style.overflow == 'scroll') && (element.clientHeight != element.scrollHeight || element.clientWidth != element.scrollWidth) ? style.overflow : '');
            for (const i of element.style) {
                styleMap[Utils.hyphenToCamelCase(i)] = element.style[i];
            }
            this.tagName = element.tagName;
        }
        else {
            element = { id: '' };
        }
        this.id = id;
        this.element = element;
        this.children = [];
        this.style = style;
        this.styleMap = styleMap;
        this.depthIndent = 0;
        this.visible = true;
        this.linearExclude = false;
        this.renderParent = null;
        this.android = {};
        this.attributes = [];
        this.original = {};
        this.scroll = {};
        this.boxRefit = {};
        if (bounds != null) {
            Object.assign(this.scroll, {
                width: styleMap.width || '',
                height: styleMap.height || '',
                overflow,
                bottom: bounds.bottom + (overflow != '' ? (element.scrollHeight - element.offsetHeight) : 0),
                right: bounds.right + (overflow != '' ? (element.scrollWidth - element.offsetWidth) : 0),
                nested: false
            });
        }
        Object.assign(this, options);
    }

    setAttributes(depth, actions = []) {
        if (depth == null) {
            depth = this.depth + this.depthIndent + 1;
        }
        const widget = WIDGET_ANDROID[this.androidWidgetName];
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
                        const data = method(element);
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
                                    else if (/(px|pt)$/.test(value)) {
                                        value = (value.toLowerCase().indexOf('font') != -1 ? Utils.convertToSP(value) : Utils.convertToDP(value));
                                    }
                                    output.push(widget[action][j].replace('{0}', value));
                                }
                            }
                            if (output.length > 0) {
                                if (methodName == 'getComputedStyle') {
                                    if (!RESOURCE_STYLE.has(this.tagName)) {
                                        RESOURCE_STYLE.set(this.tagName, []);
                                    }
                                    RESOURCE_STYLE.get(this.tagName).push({ id: this.id, attributes: output });
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
        for (const name in this.android) {
            const value = this.android[name];
            if (Utils.hasValue(value)) {
                result[name] = `android:${name}="${value}"`;
            }
        }
        if (element.tagName == 'INPUT' && element.id != '') {
            const nextElement = element.nextElementSibling;
            if (nextElement && nextElement.htmlFor == element.id) {
                const nodeNext = nextElement.androidNode;
                nodeNext.setAndroidAttributes(LAYOUT_ANDROID.TEXT);
                nodeNext.setAttributes(depth, [4]);
                if (this.isView(LAYOUT_ANDROID.RADIO)) {
                    nodeNext.depthIndent++;
                }
                const attributes = nodeNext.attributes;
                for (const name in attributes) {
                    const value = attributes[name];
                    if (result[name] == null && Utils.hasValue(value)) {
                        result[name] = value;
                    }
                }
                this.label = nodeNext;
                nodeNext.visible = false;
                nodeNext.renderParent = true;
            }
        }
        for (const i in result) {
            const value = result[i];
            if (Utils.hasValue(value)) {
                this.appendAttributes(value);
            }
        }
        this.depthAttribute = depth;
    }
    setAndroidAttributes(widgetName) {
        const element = this.element;
        if (widgetName == null) {
            widgetName = this.widgetName;
        }
        if (GENERATE_ID[widgetName] == null) {
            GENERATE_ID[widgetName] = 1;
        }
        this.androidWidgetName = widgetName;
        if (this.androidId == null) {
            do {
                this.androidId = (this.androidId != -1 ? element.id || element.name : (widgetName.toLowerCase() + GENERATE_ID[widgetName]++));
                if (GENERATE_ID['__current'].includes(this.androidId)) {
                    this.androidId = -1;
                }
                else {
                    GENERATE_ID['__current'].push(this.androidId);
                }
            }
            while (!this.androidId || this.androidId == -1)
        }
    }
    setAndroidDimensions() {
        let element = null;
        let parent = null;
        let style = null;
        let styleMap = null;
        let width = 0;
        let height = 0;
        if (this.wrapped != null) {
            element = this.wrapped.element;
            parent = this.parent.element;
            styleMap = this.wrapped.styleMap;
            [width, height] = this.getChildDimensions();
        }
        else {
            element = this.element;
            parent = element.parentNode;
            style = Node.getElementStyle(element);
            styleMap = this.styleMap;
            width = element.offsetWidth + parseInt(style.marginLeft) + parseInt(style.marginLeft);
            height = element.offsetHeight + parseInt(style.marginTop) + parseInt(style.marginBottom);
        }
        const parentStyle = Node.getElementStyle(parent);
        const parentWidth = parent.offsetWidth - (parseInt(parentStyle.paddingLeft) + parseInt(parentStyle.paddingRight) + parseInt(parentStyle.borderLeftWidth) + parseInt(parentStyle.borderRightWidth));
        const parentHeight = parent.offsetHeight - (parseInt(parentStyle.paddingTop) + parseInt(parentStyle.paddingBottom) + parseInt(parentStyle.borderTopWidth) + parseInt(parentStyle.borderBottomWidth));
        const parentScrollView = (parent.androidNode && parent.androidNode.scroll.overflow != '');
        const parentGridLayout = (this.parent.id != 0 && this.parent.isView(LAYOUT_ANDROID.GRID));
        if (Utils.hasValue(this.scroll.overflow) && !this.isView(LAYOUT_ANDROID.TEXT)) {
            this.attr('layout_width', 'match_parent');
            this.attr('layout_height', 'match_parent');
        }
        else {
            if (parentGridLayout) {
                this.attr('layout_columnWeight', (this.parent.gridColumnWeight[this.gridIndex] ? 0 : 1));
                this.attr('layout_width', (this.attr('layout_columnWeight') == 1 ? '0dp' : 'wrap_content'));
            }
            else {
                if (styleMap.width != null) {
                    this.attr('layout_width', Utils.convertToDP(styleMap.width));
                }
                else {
                    switch (this.tagName) {
                        case 'INPUT':
                        case 'SELECT':
                        case 'BUTTON':
                            this.attr('layout_width', 'wrap_content');
                            break;
                        default:
                            if (!parentScrollView && width >= parentWidth) {
                                this.attr('layout_width', 'match_parent');
                            }
                            else {
                                this.attr('layout_width', 'wrap_content');
                                if (style != null && MAPPING_ANDROID[element.tagName] != null) {
                                    switch (style.display) {
                                        case 'line-item':
                                        case 'block':
                                        case 'inherit':
                                            this.attr('layout_width', 'match_parent');
                                            break;
                                    }
                                }
                            }
                    }
                }
            }
            if (styleMap.height != null) {
                this.attr('layout_height', Utils.convertToDP(styleMap.height));
            }
            else {
                switch (this.tagName) {
                    case 'INPUT':
                    case 'SELECT':
                    case 'BUTTON':
                        this.attr('layout_height', 'wrap_content');
                        break;
                    default:
                        if (!parentScrollView && !parentGridLayout && height >= parentHeight) {
                            this.attr('layout_height', 'match_parent');
                        }
                        else {
                            this.attr('layout_height', 'wrap_content');
                        }
                }
            }
        }
    }
    setBounds() {
        if (this.element != null) {
            this.bounds = this.element.getBoundingClientRect();
        }
    }
    setLinearBoxRect() {
        const bounds = this.bounds;
        const style = this.style;
        this.linear = {
            top: bounds.top - parseInt(style.marginTop),
            right: bounds.right + parseInt(style.marginRight),
            bottom: bounds.bottom + parseInt(style.marginBottom),
            left: bounds.left - parseInt(style.marginLeft)
        };
        this.box = {
            top: bounds.top + parseInt(style.paddingTop) + parseInt(style.borderTopWidth),
            right: bounds.right - (parseInt(style.paddingRight) + parseInt(style.borderRightWidth)),
            left: bounds.left + parseInt(style.paddingLeft) + parseInt(style.borderLeftWidth),
            bottom: bounds.bottom - (parseInt(style.paddingBottom) + parseInt(style.borderBottomWidth))
        };
    }
    attr(name, value) { 
        if (Utils.hasValue(value)) {
            this.android[name] = value;
        }
        else {
            return this.android[name];
        }
    }
    addAttribute(name, value) {
        if (Utils.hasValue(value)) {
            this.attributes.push(`android:${name}="${value}"`);
        }
    }
    getAttribute(name, remove = false) {
        const property = `android:${name}`;
        const index = this.attributes.findIndex(value => value.startsWith(property));
        if (index != -1) {
            const value = this.attributes[index];
            if (remove) {
                this.attributes.splice(index, 1);
            }
            return value;
        }
        return '';
    }
    deleteAttribute(...names) {
        names.forEach(name => {
            const property = `android:${name}`;
            const index = this.attributes.findIndex(value => value.startsWith(property));
            if (index != -1) {
                this.attributes.splice(index, 1);
            }
        });
    }
    replaceAttribute(name, value, merge = false) {
        let index = -1;
        const property = `android:${name}`;
        for (let i = 0; i < this.attributes.length; i++) {
            const attr = this.attributes[i];
            if (attr.startsWith(property)) {
                if (merge && !isNaN(parseInt(value))) {
                    const match = attr.match(/([0-9]+)([a-zA-Z]+)/);
                    if (match != null) {
                        let result = parseFloat(match[1]) + parseFloat(value);
                        if (result < 1) {
                            result = result.toFixed(2);
                        }
                        else {
                            result = Math.floor(result);
                        }
                        value = `${result}${match[2]}`;
                    }
                }
                index = i;
                break;
            }
        }
        const attribute = `${property}="${value}"`;
        if (index != -1) {
            this.attributes[index] = attribute;
        }
        else {
            this.attributes.push(attribute);
        }
    }
    appendAttributes(value) {
        if (Array.isArray(value)) {
            this.attributes.push(...value);
        }
        else {
            this.attributes.push(value);
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
    isHorizontalScroll() {
        return (this.styleMap.width != null && (this.styleMap.overflowX == 'auto' || this.styleMap.overflowX == 'scroll'));
    }
    isView(viewName) {
        return (this.androidWidgetName == viewName);
    }
    inheritGridStatus(node) {
        if (node.gridFirst) {
            this.gridFirst = true;
            node.gridFirst = false;
        }
        if (node.gridRowStart) {
            this.gridRowStart = true;
            node.gridRowStart = false;
        }
        if (node.gridRowEnd) {
            this.gridRowEnd = true;
            node.gridRowEnd = false;
        }
    }
    css(name) {
        if (this.styleMap[name] != null) {
            return this.styleMap[name];
        }
        return (this.style[name] || ''); 
    }

    get widgetName() {
        let widgetName = MAPPING_ANDROID[this.tagName];
        if (typeof widgetName == 'object') {
            widgetName = widgetName[this.element.type];
        }
        return widgetName;
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
        const value = this.css('marginTop');
        if (value != '') {
            return parseInt(value);
        }
        return 0;
    }
    get marginBottom() {
        const value = this.css('marginBottom');
        if (value != '') {
            return parseInt(value);
        }
        return 0;
    }
    get marginLeft() {
        const value = this.css('marginLeft');
        if (value != '') {
            return parseInt(value);
        }
        return 0;
    }
    get marginRight() {
        const value = this.css('marginRight');
        if (value != '') {
            return parseInt(value);
        }
        return 0;
    }
    get paddingTop() {
        const value = this.css('paddingTop');
        if (value != '') {
            return parseInt(value);
        }
        return 0;
    }
    get paddingBottom() {
        const value = this.css('paddingBottom');
        if (value != '') {
            return parseInt(value);
        }
        return 0;
    }
    get paddingLeft() {
        const value = this.css('paddingLeft');
        if (value != '') {
            return parseInt(value);
        }
        return 0;
    }
    get paddingRight() {
        const value = this.css('paddingRight');
        if (value != '') {
            return parseInt(value);
        }
        return 0;
    }

    static insertWrapper(cache, node, parent, children, actions = null) {
        const options = {
            wrapped: node,
            parent,
            children,
            depth: parent.depth,
            depthIndent: parent.depthIndent,
            bounds: node.bounds,
            styleMap: node.styleMap,
            linear: node.linear,
            box: node.box,
            original: node.original,
            actions
        };
        const wrapper = new Node(cache.length + 1, null, options);
        cache.push(wrapper);
        return wrapper;
    }
    static isLinearXY(nodes) {
        let linearX = true;
        let linearY = true;
        if (nodes.length > 1) {
            const elements = nodes.slice();
            const minBottom = elements.reduce((a, b) => Math.min(a, b.linear.bottom), Number.MAX_VALUE);
            elements.some(item => {
                if (item.linear.top >= minBottom) {
                    linearX = false;
                    return true;
                }
            });
            const minRight = elements.reduce((a, b) => Math.min(a, b.linear.right), Number.MAX_VALUE);
            elements.some(item => {
                if (item.linear.left >= minRight) {
                    linearY = false;
                    return true;
                }
            });
        }
        return [linearX, linearY];
    }
    static getElementStyle(element) {
        return (element.androidNode != null ? element.androidNode.style : window.getComputedStyle(element));
    }
    static getOuterNodes(nodes) {
        let top = [nodes[0]];
        let right = [nodes[0]];
        let bottom = [nodes[0]];
        let left = [nodes[0]];
        for (let i = 1; i < nodes.length; i++) {
            const node = nodes[i];
            if (top[0].bounds.top == node.bounds.top) {
                top.push(node);
            }
            else if (node.bounds.top < top[0].bounds.top) {
                top = [node];
            }
            if (right[0].bounds.right == node.bounds.right) {
                right.push(node);
            }
            else if (node.bounds.right > top[0].bounds.right) {
                right = [node];
            }
            if (bottom[0].bounds.bottom == node.bounds.bottom) {
                bottom.push(node);
            }
            else if (node.bounds.bottom > top[0].bounds.bottom) {
                bottom = [node];
            }
            if (left[0].bounds.left == node.bounds.left) {
                left.push(node);
            }
            else if (node.bounds.left < top[0].bounds.left) {
                left = [node];
            }
        }
        return { top, right, bottom, left };
    }
}