
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
        this.depth = 0;
        this.depthIndent = 0;
        this.renderParent = null;
        this.android = {};
        this.attributes = [];
        this.previous = {};
        this.scroll = {};
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
        const widget = WIDGET_ANDROID[this.androidWidgetName];
        const element = this.element;
        const result = {};
        if (widget != null) {
            let j = -1;
            if (this.actions != null) {
                actions = this.actions;
            }
            for (const i in widget) {
                j++;
                if (result[i] != null || (actions != null && actions.length > 0 && !actions.includes(j))) {
                    continue;
                }
                if (Utils.hasValue(this[i])) {
                    result[i] = widget[i].replace('{0}', this[i]);
                }
                else if (i.indexOf('.') != -1) {
                    let method = window;
                    let methodName = '';
                    i.split('.').forEach(value => {
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
                            for (const k in widget[i]) {
                                if (result[k] != null) {
                                    continue;
                                }
                                let value = data[k];
                                if (Utils.hasValue(value)) {
                                    if (value.startsWith('rgb')) {
                                        const rgb = Color.parseRGBA(value);
                                        if (k == 'backgroundColor') {
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
                                    output.push(widget[i][k].replace('{0}', value));
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
        for (const i in this.android) {
            const value = this.android[i];
            if (Utils.hasValue(value)) {
                result[i] = `android:${i}="${value}"`;
            }
        }
        if (element.tagName == 'INPUT' && element.id != '') {
            const nextElement = element.nextElementSibling;
            if (nextElement && nextElement.htmlFor == element.id) {
                const nodeNext = nextElement.cacheData;
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
                nodeNext.invisible = true;
                nodeNext.renderParent = true;
            }
        }
        for (const i in result) {
            const value = result[i];
            if (Utils.hasValue(value)) {
                if (Array.isArray(value)) {
                    this.appendAttribute(...value);
                }
                else {
                    this.appendAttribute(value);
                }
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
        const parentScrollView = (parent.cacheData && parent.cacheData.scroll.overflow != '');
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
                                        case 'line-this':
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
            bottom: bounds.bottom + parseInt(style.marginBottom),
            left: bounds.left - parseInt(style.marginLeft),
            right:bounds.right + parseInt(style.marginRight)
        };
        this.box = {
            x: bounds.x + parseInt(style.paddingLeft) + parseInt(style.borderLeftWidth),
            y: bounds.y + parseInt(style.paddingTop) + parseInt(style.borderTopWidth)
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
    appendAttribute(...value) {
        this.attributes.push(...value);
    }
    replaceAttribute(name, value, merge = false) {
        let index = -1;
        for (let i = 0; i < this.attributes.length; i++) {
            const attr = this.attributes[i];
            if (attr.startsWith(name)) {
                if (merge && !isNaN(parseInt(value))) {
                    const match = attr.match(/([0-9]+)([a-zA-Z]+)/);
                    if (match != null) {
                        value = `${parseInt(match[1]) + parseInt(value)}${match[2]}`;
                    }
                }
                index = i;
                break;
            }
        }
        const attribute = `${name}="${value}"`;
        if (index != -1) {
            this.attributes[i] = attribute;
        }
        else {
            this.attributes.push(attribute);
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
        return (this.styleMap.width && this.styleMap.overflowX == 'auto' || this.styleMap.overflowX == 'scroll');
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

    get widgetName() {
        let widgetName = MAPPING_ANDROID[this.tagName];
        if (typeof widgetName == 'object') {
            widgetName = widgetName[this.element.type];
        }
        return widgetName;
    }
    get marginTop() {
        if (this.style.marginTop != null) {
            return parseInt(this.style.marginTop);
        }
        return 0;
    }
    get marginBottom() {
        if (this.style.marginBottom != null) {
            return parseInt(this.style.marginBottom);
        }
        return 0;
    }
    get marginLeft() {
        if (this.style.marginLeft != null) {
            return parseInt(this.style.marginLeft);
        }
        return 0;
    }
    get marginRight() {
        if (this.style.marginRight != null) {
            return parseInt(this.style.marginRight);
        }
        return 0;
    }
    get paddingTop() {
        if (this.style.paddingTop != null) {
            return parseInt(this.style.paddingTop);
        }
        return 0;
    }
    get paddingBottom() {
        if (this.style.paddingBottom != null) {
            return parseInt(this.style.paddingBottom);
        }
        return 0;
    }
    get paddingLeft() {
        if (this.style.paddingLeft != null) {
            return parseInt(this.style.paddingLeft);
        }
        return 0;
    }
    get paddingRight() {
        if (this.style.paddingRight != null) {
            return parseInt(this.style.paddingRight);
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
            previous: node.previous,
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
        return (element.cacheData != null ? element.cacheData.style : window.getComputedStyle(element));
    }
}